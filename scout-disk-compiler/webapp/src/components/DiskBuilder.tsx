// ═══════════════════════════════════════════════════════════════
// Scout Disk Builder — Input Form Tab
// With integrated NAICS / SOC taxonomy search from knowledgebase
// ═══════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import type { DiskDefinition, ObservationType, DiskStatus, ExecutionProfile, IndustryCode, RoleCode, KeywordScope } from './types';
import { base, colors } from './styles';
import { searchNaics, searchSoc, type NaicsEntry, type SocEntry } from './taxonomy-data';

interface Props {
  onCompile: (def: DiskDefinition) => void;
}

const OBS_TYPES: ObservationType[] = ['job_posting', 'employer', 'professional_profile', 'provider', 'business_location', 'market_listing'];
const STATUSES: DiskStatus[] = ['draft', 'active', 'inactive', 'retired'];
const PROFILES: ExecutionProfile[] = ['standard', 'discovery', 'research', 'forensics', 'strict'];

const PROFILE_DESC: Record<ExecutionProfile, string> = {
  standard: 'Limit 10 · Dedup · Strict filter · Scrape 1',
  discovery: 'Limit 50 · Dedup · Loose filter · No scrape',
  research: 'Limit 100 · Dedup · Ranked · Scrape 2',
  forensics: 'Limit 250 · No dedup · Loose · Scrape 3',
  strict: 'Limit 25 · Dedup · Strict filter · Scrape 2',
};

const dropdownStyle: React.CSSProperties = {
  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
  backgroundColor: colors.surfaceAlt, border: `1px solid ${colors.border}`,
  borderRadius: '0 0 6px 6px', maxHeight: '240px', overflowY: 'auto',
};
const dropItemStyle: React.CSSProperties = {
  padding: '7px 10px', cursor: 'pointer', fontSize: '12px',
  borderBottom: `1px solid ${colors.border}`, transition: 'background 0.1s',
};

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  const add = () => { const v = input.trim(); if (v && !tags.includes(v)) { onChange([...tags, v]); setInput(''); } };
  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: tags.length ? '6px' : 0 }}>
        <input style={{ ...base.input, flex: 1 }} value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button style={{ ...base.btn, ...base.btnPrimary, padding: '8px 12px' }} onClick={add}>+</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {tags.map((t, i) => (
          <span key={i} style={{ ...base.badge, backgroundColor: colors.surfaceAlt, color: colors.textDim, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {t}
            <span style={{ cursor: 'pointer', color: colors.error, fontWeight: 700 }} onClick={() => onChange(tags.filter((_, j) => j !== i))}>×</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── NAICS Search Input with dropdown ──
function NaicsSearchInput({ onSelect }: { onSelect: (entry: NaicsEntry) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NaicsEntry[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const r = searchNaics(query);
    setResults(r);
    setOpen(r.length > 0 && query.length > 0);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (e: NaicsEntry) => { onSelect(e); setQuery(''); setOpen(false); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        style={base.input}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0 && query) setOpen(true); }}
        placeholder="🔍 Search NAICS by code, title, sector, or keyword..."
      />
      {open && (
        <div style={dropdownStyle}>
          {results.map(e => (
            <div key={e.code} onClick={() => pick(e)}
              onMouseEnter={ev => (ev.currentTarget.style.backgroundColor = colors.surface)}
              onMouseLeave={ev => (ev.currentTarget.style.backgroundColor = 'transparent')}
              style={dropItemStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><strong style={{ color: colors.accent }}>{e.code}</strong> — {e.title}</span>
                <span style={{ fontSize: '10px', color: colors.textMuted }}>{e.sector}</span>
              </div>
              <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '2px' }}>{e.keywords}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SOC Search Input with dropdown ──
function SocSearchInput({ onSelect }: { onSelect: (entry: SocEntry) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SocEntry[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const r = searchSoc(query);
    setResults(r);
    setOpen(r.length > 0 && query.length > 0);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (e: SocEntry) => { onSelect(e); setQuery(''); setOpen(false); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        style={base.input}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0 && query) setOpen(true); }}
        placeholder="🔍 Search SOC by code, title, or category..."
      />
      {open && (
        <div style={dropdownStyle}>
          {results.map(e => (
            <div key={e.code} onClick={() => pick(e)}
              onMouseEnter={ev => (ev.currentTarget.style.backgroundColor = colors.surface)}
              onMouseLeave={ev => (ev.currentTarget.style.backgroundColor = 'transparent')}
              style={dropItemStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><strong style={{ color: colors.accent }}>{e.code}</strong> — {e.title}</span>
                <span style={{ fontSize: '10px', color: colors.textMuted }}>{e.broadCategory}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiskBuilder({ onCompile }: Props) {
  const [id, setId] = useState('DSK-000001');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [obsType, setObsType] = useState<ObservationType>('job_posting');
  const [version, setVersion] = useState('1.0.0');
  const [status, setStatus] = useState<DiskStatus>('draft');
  const [zipCode, setZipCode] = useState('');
  const [radius, setRadius] = useState('25');
  const [industries, setIndustries] = useState<IndustryCode[]>([]);
  const [indCode, setIndCode] = useState('');
  const [indTitle, setIndTitle] = useState('');
  const [roles, setRoles] = useState<RoleCode[]>([]);
  const [roleCode, setRoleCode] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [scopes, setScopes] = useState<KeywordScope[]>([]);
  const [scopeSoc, setScopeSoc] = useState('');
  const [scopeTerms, setScopeTerms] = useState('');
  const [specialtyFlags, setSpecialtyFlags] = useState<string[]>([]);
  const [globalExclude, setGlobalExclude] = useState<string[]>([]);
  const [profile, setProfile] = useState<ExecutionProfile>('standard');
  const [errors, setErrors] = useState<string[]>([]);

  const addIndustry = () => {
    const c = indCode.trim(); const t = indTitle.trim();
    if (!c && !t) return;
    if (industries.some(i => i.code === (c || '—') && i.title === (t || '—'))) return;
    setIndustries([...industries, { code: c || '—', title: t || '—' }]);
    setIndCode(''); setIndTitle('');
  };

  const addNaicsFromSearch = (entry: NaicsEntry) => {
    if (industries.some(i => i.code === entry.code)) return;
    setIndustries([...industries, { code: entry.code, title: entry.title }]);
  };

  const addRole = () => {
    const c = roleCode.trim(); const t = roleTitle.trim();
    if (!c && !t) return;
    if (roles.some(r => r.code === (c || '—') && r.title === (t || '—'))) return;
    setRoles([...roles, { code: c || '—', title: t || '—' }]);
    setRoleCode(''); setRoleTitle('');
  };

  const addSocFromSearch = (entry: SocEntry) => {
    if (roles.some(r => r.code === entry.code)) return;
    setRoles([...roles, { code: entry.code, title: entry.title }]);
  };

  const addScope = () => {
    if (scopeSoc.trim() && scopeTerms.trim()) {
      const terms = scopeTerms.split(',').map(t => t.trim()).filter(Boolean);
      setScopes([...scopes, { target_soc: scopeSoc.trim(), include: terms }]);
      setScopeSoc(''); setScopeTerms('');
    }
  };

  const handleCompile = () => {
    const errs: string[] = [];
    if (!/^DSK-[0-9]{6}$/.test(id)) errs.push('Disk ID must match DSK-XXXXXX');
    if (!label.trim()) errs.push('Label is required');
    if (!/^\d{5}$/.test(zipCode)) errs.push('ZIP code must be 5 digits');
    if (industries.length === 0) errs.push('At least one NAICS entry required');
    if (roles.length === 0) errs.push('At least one SOC entry required');
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    const def: DiskDefinition = {
      id, label: label.trim(), description: description.trim(), observation_type: obsType,
      version, status, territory: { zipCode, radiusMiles: parseInt(radius) || 25 },
      industry: industries, roles,
      keywords: { logic: 'match_any_role_scope_and_exclude_global', scopes, optional_specialty_flags: specialtyFlags, global_exclude: globalExclude },
      execution_profile: profile,
    };
    onCompile(def);
  };

  return (
    <div>
      {/* Mission Identity */}
      <div style={base.card}>
        <div style={base.cardTitle}>🎯 Mission Identity</div>
        <div style={base.row}>
          <div style={base.field}>
            <label style={base.label}>Disk ID</label>
            <input style={base.input} value={id} onChange={e => setId(e.target.value)} placeholder="DSK-000001" />
          </div>
          <div style={base.field}>
            <label style={base.label}>Label</label>
            <input style={base.input} value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g., Denver Tech Sweep" />
          </div>
        </div>
        <div style={base.field}>
          <label style={base.label}>Description</label>
          <textarea style={base.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Mission narrative..." />
        </div>
        <div style={base.row4}>
          <div style={base.field}>
            <label style={base.label}>Observation Type</label>
            <select style={base.select} value={obsType} onChange={e => setObsType(e.target.value as ObservationType)}>
              {OBS_TYPES.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div style={base.field}>
            <label style={base.label}>Version</label>
            <input style={base.input} value={version} onChange={e => setVersion(e.target.value)} placeholder="1.0.0" />
          </div>
          <div style={base.field}>
            <label style={base.label}>Status</label>
            <select style={base.select} value={status} onChange={e => setStatus(e.target.value as DiskStatus)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={base.field}>
            <label style={base.label}>Profile</label>
            <select style={base.select} value={profile} onChange={e => setProfile(e.target.value as ExecutionProfile)}>
              {PROFILES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div style={{ padding: '8px 12px', backgroundColor: colors.surfaceAlt, borderRadius: '6px', fontSize: '12px', color: colors.textDim }}>
          ⚙️ {PROFILE_DESC[profile]}
        </div>
      </div>

      {/* Geography */}
      <div style={base.card}>
        <div style={base.cardTitle}>🌍 Territory</div>
        <div style={base.row}>
          <div style={base.field}>
            <label style={base.label}>ZIP Code</label>
            <input style={base.input} value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="80202" />
          </div>
          <div style={base.field}>
            <label style={base.label}>Radius (miles)</label>
            <input style={base.input} type="number" value={radius} onChange={e => setRadius(e.target.value)} />
          </div>
        </div>
      </div>

      {/* NAICS — with search */}
      <div style={base.card}>
        <div style={base.cardTitle}>🏭 Industry (NAICS) — <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 400 }}>92 entries in knowledgebase</span></div>
        <div style={base.field}>
          <label style={base.label}>Search Knowledgebase</label>
          <NaicsSearchInput onSelect={addNaicsFromSearch} />
        </div>
        <div style={{ fontSize: '11px', color: colors.textMuted, margin: '8px 0 4px' }}>Or enter manually (code and/or title):</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input style={{ ...base.input, flex: 1 }} value={indCode} onChange={e => setIndCode(e.target.value)} placeholder="Code (e.g. 541511)" />
          <input style={{ ...base.input, flex: 2 }} value={indTitle} onChange={e => setIndTitle(e.target.value)} placeholder="Title (e.g. Custom Computer Programming)"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIndustry(); } }} />
          <button style={{ ...base.btn, ...base.btnPrimary }} onClick={addIndustry}>Add</button>
        </div>
        {industries.map((ind, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: colors.surfaceAlt, borderRadius: '4px', marginBottom: '4px', fontSize: '12px' }}>
            <span>
              {ind.code !== '—' && <strong style={{ color: colors.accent }}>{ind.code}</strong>}
              {ind.code !== '—' && ind.title !== '—' && ' — '}
              {ind.title !== '—' && ind.title}
            </span>
            <span style={{ cursor: 'pointer', color: colors.error }} onClick={() => setIndustries(industries.filter((_, j) => j !== i))}>×</span>
          </div>
        ))}
      </div>

      {/* SOC — with search */}
      <div style={base.card}>
        <div style={base.cardTitle}>👤 Roles (SOC) — <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 400 }}>109 entries in knowledgebase</span></div>
        <div style={base.field}>
          <label style={base.label}>Search Knowledgebase</label>
          <SocSearchInput onSelect={addSocFromSearch} />
        </div>
        <div style={{ fontSize: '11px', color: colors.textMuted, margin: '8px 0 4px' }}>Or enter manually (code and/or title):</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input style={{ ...base.input, flex: 1 }} value={roleCode} onChange={e => setRoleCode(e.target.value)} placeholder="Code (e.g. 15-1252)" />
          <input style={{ ...base.input, flex: 2 }} value={roleTitle} onChange={e => setRoleTitle(e.target.value)} placeholder="Title (e.g. Software Developers)"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRole(); } }} />
          <button style={{ ...base.btn, ...base.btnPrimary }} onClick={addRole}>Add</button>
        </div>
        {roles.map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: colors.surfaceAlt, borderRadius: '4px', marginBottom: '4px', fontSize: '12px' }}>
            <span>
              {r.code !== '—' && <strong style={{ color: colors.accent }}>{r.code}</strong>}
              {r.code !== '—' && r.title !== '—' && ' — '}
              {r.title !== '—' && r.title}
            </span>
            <span style={{ cursor: 'pointer', color: colors.error }} onClick={() => setRoles(roles.filter((_, j) => j !== i))}>×</span>
          </div>
        ))}
      </div>

      {/* Keywords */}
      <div style={base.card}>
        <div style={base.cardTitle}>🔑 Keyword Rules</div>
        <div style={base.field}>
          <label style={base.label}>Role Scopes</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input style={{ ...base.input, flex: 1 }} value={scopeSoc} onChange={e => setScopeSoc(e.target.value)} placeholder="Target SOC (15-1252)" />
            <input style={{ ...base.input, flex: 2 }} value={scopeTerms} onChange={e => setScopeTerms(e.target.value)} placeholder="Terms (comma separated)"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addScope(); } }} />
            <button style={{ ...base.btn, ...base.btnPrimary }} onClick={addScope}>Add</button>
          </div>
          {scopes.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: colors.surfaceAlt, borderRadius: '4px', marginBottom: '4px', fontSize: '12px' }}>
              <span><strong>{s.target_soc}:</strong> {s.include.join(', ')}</span>
              <span style={{ cursor: 'pointer', color: colors.error }} onClick={() => setScopes(scopes.filter((_, j) => j !== i))}>×</span>
            </div>
          ))}
        </div>
        <div style={base.row}>
          <div style={base.field}>
            <label style={base.label}>Optional Specialty Flags</label>
            <TagInput tags={specialtyFlags} onChange={setSpecialtyFlags} placeholder="e.g., security clearance" />
          </div>
          <div style={base.field}>
            <label style={base.label}>Global Exclude Terms</label>
            <TagInput tags={globalExclude} onChange={setGlobalExclude} placeholder="e.g., unpaid" />
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div style={{ ...base.card, backgroundColor: colors.errorBg, borderColor: colors.error }}>
          {errors.map((e, i) => <div key={i} style={{ color: colors.error, fontSize: '13px', marginBottom: '4px' }}>⚠ {e}</div>)}
        </div>
      )}

      {/* Compile */}
      <button style={{ ...base.btn, ...base.btnPrimary, width: '100%', padding: '14px', fontSize: '15px' }} onClick={handleCompile}>
        ⚡ Compile Disk → Cartridge
      </button>
    </div>
  );
}
