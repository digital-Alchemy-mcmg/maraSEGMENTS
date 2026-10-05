// ============================================================
// SDNA Canonicalization + Adapter
// Robust YAML parser → SDNA adapter → CandidateVault
// Handles CF-SDNA-EVERYTHING-1.0 and legacy simple schemas
// ============================================================

import type { CandidateVaultState, SDNAAtom } from '../types';

// ---- SHA-256 ----
export async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---- Deterministic canonicalization ----
function validateSemantic(val: unknown, p: string): any {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') { if (!isFinite(val)) return null; return val; }
  if (Array.isArray(val)) return val.map((v, i) => validateSemantic(v, `${p}[${i}]`));
  if (typeof val === 'object') {
    const r: Record<string, any> = {};
    for (const k of Object.keys(val as any)) r[k] = validateSemantic((val as any)[k], `${p}.${k}`);
    return r;
  }
  return null;
}

function detStringify(o: any): string {
  if (o === null || o === undefined) return 'null';
  if (typeof o === 'string') return JSON.stringify(o);
  if (typeof o === 'number' || typeof o === 'boolean') return String(o);
  if (Array.isArray(o)) return '[' + o.map(detStringify).join(',') + ']';
  const ks = Object.keys(o).sort();
  return '{' + ks.map(k => JSON.stringify(k) + ':' + detStringify(o[k])).join(',') + '}';
}

// ---- Robust YAML Parser ----
// Index-based recursive descent. Handles: nested mappings, arrays of mappings,
// flow scalars with continuation lines, block scalars, inline arrays/objects,
// same-indent arrays under keys, quoted strings containing colons.

class YAMLParser {
  private lines: string[];
  private pos = 0;

  constructor(text: string) {
    if (/!!(?:binary|timestamp|omap|pairs|set|merge)/.test(text)) {
      throw new Error('Unsupported YAML tag');
    }
    this.lines = text.split('\n');
  }

  parse(): any {
    const ind = this.nextContentIndent();
    if (ind < 0) return null;
    return this.parseNode(ind);
  }

  private nextContentIndent(): number {
    while (this.pos < this.lines.length) {
      const l = this.lines[this.pos];
      if (l.trim() === '' || l.trim().startsWith('#')) { this.pos++; continue; }
      return l.length - l.trimStart().length;
    }
    return -1;
  }

  private peekContentLine(): { indent: number; trimmed: string } | null {
    let p = this.pos;
    while (p < this.lines.length) {
      const l = this.lines[p];
      if (l.trim() === '' || l.trim().startsWith('#')) { p++; continue; }
      return { indent: l.length - l.trimStart().length, trimmed: l.trim() };
    }
    return null;
  }

  private parseNode(minIndent: number): any {
    const peek = this.peekContentLine();
    if (!peek || peek.indent < minIndent) return null;
    if (peek.trimmed.startsWith('- ')) return this.parseArray(peek.indent);
    if (this.looksLikeKey(peek.trimmed)) return this.parseMapping(peek.indent);
    this.pos++;
    return this.scalar(peek.trimmed);
  }

  private looksLikeKey(trimmed: string): boolean {
    // A line is a mapping key if it contains `: ` or ends with `:` and is not a quoted string starting value
    if (trimmed.startsWith('"') || trimmed.startsWith("'")) return false;
    for (let i = 0; i < trimmed.length; i++) {
      if (trimmed[i] === ':' && (i + 1 >= trimmed.length || trimmed[i + 1] === ' ')) return true;
    }
    return false;
  }

  private splitKey(trimmed: string): { key: string; rest: string } {
    for (let i = 0; i < trimmed.length; i++) {
      if (trimmed[i] === ':' && (i + 1 >= trimmed.length || trimmed[i + 1] === ' ')) {
        return {
          key: trimmed.substring(0, i).trim().replace(/^["']|["']$/g, ''),
          rest: trimmed.substring(i + 1).trim(),
        };
      }
    }
    return { key: trimmed, rest: '' };
  }

  private parseMapping(baseIndent: number): Record<string, any> {
    const obj: Record<string, any> = {};

    while (true) {
      const peek = this.peekContentLine();
      if (!peek || peek.indent < baseIndent) break;
      if (peek.indent > baseIndent) break;
      if (!this.looksLikeKey(peek.trimmed)) break;

      this.pos++; // consume the key line
      const { key, rest } = this.splitKey(peek.trimmed);

      if (rest === '' || rest === '|' || rest === '>' || rest === '|-' || rest === '>-') {
        const nextPeek = this.peekContentLine();
        if (!nextPeek || nextPeek.indent <= baseIndent) {
          if (nextPeek && nextPeek.indent === baseIndent && nextPeek.trimmed.startsWith('- ')) {
            obj[key] = this.parseArray(nextPeek.indent);
          } else {
            obj[key] = (rest === '' || rest === '|' || rest === '>' || rest === '|-' || rest === '>-') ? null : null;
          }
          if (rest === '|' || rest === '|-' || rest === '>' || rest === '>-') {
            // Block scalar with no content
            obj[key] = '';
          }
        } else {
          if (rest === '|' || rest === '|-') {
            obj[key] = this.parseBlockScalar(nextPeek.indent, true);
          } else if (rest === '>' || rest === '>-') {
            obj[key] = this.parseBlockScalar(nextPeek.indent, false);
          } else {
            obj[key] = this.parseNode(nextPeek.indent);
          }
        }
      } else {
        // Inline value — collect continuation lines
        let full = rest;
        while (true) {
          const np = this.peekContentLine();
          if (!np || np.indent <= baseIndent) break;
          // If it's a new mapping key or array at child indent, stop
          if (np.trimmed.startsWith('- ')) break;
          if (this.looksLikeKey(np.trimmed)) break;
          // Continuation scalar line
          full += ' ' + np.trimmed;
          this.pos++;
        }
        obj[key] = this.parseInline(full);
      }
    }
    return obj;
  }

  private parseArray(baseIndent: number): any[] {
    const arr: any[] = [];

    while (true) {
      const peek = this.peekContentLine();
      if (!peek || peek.indent !== baseIndent || !peek.trimmed.startsWith('- ')) break;

      this.pos++; // consume the `- ...` line
      const after = peek.trimmed.substring(2).trim();

      if (after === '') {
        // Block under dash
        const np = this.peekContentLine();
        if (np && np.indent > baseIndent) {
          arr.push(this.parseNode(np.indent));
        } else {
          arr.push(null);
        }
      } else if (this.looksLikeKey(after) && !after.startsWith('"') && !after.startsWith("'")
                  && !after.startsWith('{') && !after.startsWith('[')) {
        // Mapping item starting on the dash line
        // e.g. `- atom_id: CF-ID-001` followed by continuation mapping lines
        const dashContentIndent = baseIndent + 2;
        // We need to parse a mapping whose first key:value we already have
        // Collect all lines at dashContentIndent+ as part of this item
        const { key, rest: krest } = this.splitKey(after);
        const subObj: Record<string, any> = {};

        // Handle first key's value
        if (krest === '') {
          const np = this.peekContentLine();
          if (np && np.indent > baseIndent) {
            subObj[key] = this.parseNode(np.indent);
          } else {
            subObj[key] = null;
          }
        } else {
          let full = krest;
          while (true) {
            const np = this.peekContentLine();
            if (!np || np.indent <= baseIndent) break;
            if (np.indent <= baseIndent + 1) break;
            if (np.trimmed.startsWith('- ')) break;
            if (this.looksLikeKey(np.trimmed) && np.indent === dashContentIndent) break;
            full += ' ' + np.trimmed;
            this.pos++;
          }
          subObj[key] = this.parseInline(full);
        }

        // Parse remaining keys of this mapping item
        while (true) {
          const np = this.peekContentLine();
          if (!np || np.indent < dashContentIndent) break;
          if (np.indent > dashContentIndent) break; // deeper nesting handled by recursive calls
          if (!this.looksLikeKey(np.trimmed)) break;

          this.pos++;
          const { key: k2, rest: r2 } = this.splitKey(np.trimmed);

          if (r2 === '' || r2 === '|' || r2 === '>' || r2 === '|-' || r2 === '>-') {
            const nnp = this.peekContentLine();
            if (nnp && nnp.indent === dashContentIndent && nnp.trimmed.startsWith('- ')) {
              // Array at same indent as mapping keys (YAML allows this)
              subObj[k2] = (r2 === '|' || r2 === '|-' || r2 === '>' || r2 === '>-')
                ? '' : this.parseArray(nnp.indent);
            } else if (!nnp || nnp.indent <= dashContentIndent) {
              subObj[k2] = (r2 === '|' || r2 === '|-' || r2 === '>' || r2 === '>-') ? '' : null;
            } else {
              if (r2 === '|' || r2 === '|-') {
                subObj[k2] = this.parseBlockScalar(nnp.indent, true);
              } else if (r2 === '>' || r2 === '>-') {
                subObj[k2] = this.parseBlockScalar(nnp.indent, false);
              } else {
                subObj[k2] = this.parseNode(nnp.indent);
              }
            }
          } else {
            let full = r2;
            while (true) {
              const cp = this.peekContentLine();
              if (!cp || cp.indent <= dashContentIndent) break;
              if (cp.trimmed.startsWith('- ')) break;
              if (this.looksLikeKey(cp.trimmed)) break;
              full += ' ' + cp.trimmed;
              this.pos++;
            }
            subObj[k2] = this.parseInline(full);
          }
        }
        arr.push(subObj);
      } else {
        arr.push(this.parseInline(after));
      }
    }
    return arr;
  }

  private parseBlockScalar(blockIndent: number, literal: boolean): string {
    const bl: string[] = [];
    while (this.pos < this.lines.length) {
      const l = this.lines[this.pos];
      if (l.trim() === '') { bl.push(''); this.pos++; continue; }
      const ind = l.length - l.trimStart().length;
      if (ind < blockIndent) break;
      bl.push(l.substring(blockIndent));
      this.pos++;
    }
    while (bl.length > 0 && bl[bl.length - 1] === '') bl.pop();
    return literal ? bl.join('\n') : bl.join(' ').replace(/\s+/g, ' ').trim();
  }

  private parseInline(s: string): any {
    const t = s.trim();
    if (t.startsWith('[') && t.endsWith(']')) {
      const inner = t.slice(1, -1).trim();
      if (inner === '') return [];
      return inner.split(',').map(v => this.scalar(v.trim()));
    }
    if (t.startsWith('{') && t.endsWith('}')) {
      const inner = t.slice(1, -1).trim();
      if (inner === '') return {};
      const obj: Record<string, any> = {};
      for (const pair of inner.split(',')) {
        const ci = pair.indexOf(':');
        if (ci >= 0) obj[pair.substring(0, ci).trim()] = this.scalar(pair.substring(ci + 1).trim());
      }
      return obj;
    }
    return this.scalar(t);
  }

  private scalar(s: string): any {
    let c = s;
    if (!c.startsWith('"') && !c.startsWith("'")) {
      const h = c.indexOf(' #');
      if (h > 0) c = c.substring(0, h).trim();
    }
    if (c === '' || c === 'null' || c === '~') return null;
    if (c === 'true' || c === 'True' || c === 'TRUE') return true;
    if (c === 'false' || c === 'False' || c === 'FALSE') return false;
    if (/^-?\d+$/.test(c) && c.length < 16) return parseInt(c, 10);
    if (/^-?\d+\.\d+$/.test(c)) return parseFloat(c);
    if ((c.startsWith('"') && c.endsWith('"')) || (c.startsWith("'") && c.endsWith("'"))) return c.slice(1, -1);
    return c;
  }
}

export function parseYAML(text: string): any {
  return new YAMLParser(text).parse();
}

// ---- SDNA Adapter ----
interface NormalizedSDNA {
  candidate_id: string;
  display_name: string;
  atoms: SDNAAtom[];
  source_registry: Record<string, any>;
  raw: any;
}

function normalizeAtom(raw: any, idx: number): SDNAAtom {
  if (!raw?.atom_id) throw new Error(`Atom at index ${idx} missing atom_id`);
  const content = raw.statement || raw.content;
  if (typeof content !== 'string' || !content) throw new Error(`Atom ${raw.atom_id} missing statement/content`);
  const domain = raw.plane || raw.domain;
  if (!domain) throw new Error(`Atom ${raw.atom_id} missing plane/domain`);
  return { atom_id: raw.atom_id, content, domain, metadata: { ...raw } };
}

export function parseSDNAYaml(yamlText: string): NormalizedSDNA {
  if (!yamlText?.trim()) throw new Error('Empty SDNA YAML');
  const parsed = parseYAML(yamlText);
  if (!parsed || typeof parsed !== 'object') throw new Error('SDNA YAML must be a mapping');

  // CF-SDNA-EVERYTHING-1.0: candidate.candidate_id + candidate.spatial_dna.evidence_atoms
  if (parsed.candidate?.candidate_id) {
    const c = parsed.candidate;
    const atoms = c.spatial_dna?.evidence_atoms;
    if (!Array.isArray(atoms) || !atoms.length) throw new Error('Missing candidate.spatial_dna.evidence_atoms');
    return {
      candidate_id: String(c.candidate_id),
      display_name: c.display_name || String(c.candidate_id),
      atoms: atoms.map((a: any, i: number) => normalizeAtom(a, i)),
      source_registry: c.source_registry || {},
      raw: parsed,
    };
  }

  // Legacy simple: top-level candidate_id + atoms[]
  if (parsed.candidate_id) {
    if (!Array.isArray(parsed.atoms)) throw new Error('Missing atoms array in legacy SDNA');
    return {
      candidate_id: String(parsed.candidate_id),
      display_name: String(parsed.candidate_id),
      atoms: parsed.atoms.map((a: any, i: number) => normalizeAtom(a, i)),
      source_registry: {},
      raw: parsed,
    };
  }

  throw new Error('SDNA: cannot find candidate_id at candidate.candidate_id or top-level');
}

export async function canonicalizeSDNA(sdna: NormalizedSDNA): Promise<string> {
  const copy = JSON.parse(JSON.stringify(sdna.raw));
  if (copy.integrity) { delete copy.integrity.content_sha256; if (!Object.keys(copy.integrity).length) delete copy.integrity; }
  if (copy.candidate?.integrity) { delete copy.candidate.integrity.content_sha256; if (!Object.keys(copy.candidate.integrity).length) delete copy.candidate.integrity; }
  return sha256(detStringify(validateSemantic(copy, 'root')));
}

export async function mountCandidateVault(yamlText: string): Promise<CandidateVaultState> {
  const sdna = parseSDNAYaml(yamlText);
  const canonical_manifest_sha256 = await canonicalizeSDNA(sdna);
  const raw_yaml_sha256 = await sha256(yamlText);
  const atom_index = new Map<string, SDNAAtom>();
  for (const atom of sdna.atoms) atom_index.set(atom.atom_id, atom);
  return {
    mounted: true,
    candidate_id: sdna.candidate_id,
    display_name: sdna.display_name,
    canonical_manifest_sha256,
    raw_yaml_sha256,
    atoms: sdna.atoms,
    atom_index,
    source_registry: sdna.source_registry,
  };
}
