// ═══════════════════════════════════════════════════════════════
// PARACHUTE — Emergency Export / Recovery Package
//
// Read-only with respect to the working project.
// Does not modify source files, mutate compiler state, or
// delete anything. Does not execute the compiler.
//
// Invocation:  npx tsx webapp/src/parachute/parachute.ts
//              npx tsx webapp/src/parachute/parachute.ts --force
//
// Output:      PARACHUTE_scout-disk-compiler_<timestamp>.zip
// ═══════════════════════════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';
import * as zlib from 'zlib';

// ── Constants (re-exported from shared module) ──
export { PROJECT_NAME, ARCHIVE_FORMAT_VERSION, EXCLUDED_CATEGORIES } from './parachute-constants';
export type { ParachuteManifest } from './parachute-constants';
import { PROJECT_NAME, ARCHIVE_FORMAT_VERSION, EXCLUDED_CATEGORIES } from './parachute-constants';
import type { ParachuteManifest } from './parachute-constants';

// Resolve project root: this file lives at webapp/src/parachute/,
// so root is three levels up.
export function getProjectRoot(): string {
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
}

// ── Exclusion rules ──
const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '__pycache__',
  '.cache',
  '.forge',
]);

const EXCLUDED_EXTENSIONS = new Set([
  '.pyc',
  '.pyo',
  '.tgz',
  '.woff2',
  '.pack',
  '.idx',
  '.rev',
]);

const EXCLUDED_FILENAMES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  'cookies.json',
  'package-lock.json',
]);

// (EXCLUDED_CATEGORIES imported from parachute-constants.ts above)

// ── Helpers ──

export function sha256File(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function sha256Buffer(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export function getGitInfo(root: string): { branch: string; commitSha: string } {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: root, encoding: 'utf8' }).trim();
    const commitSha = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim();
    return { branch, commitSha };
  } catch {
    return { branch: 'unknown', commitSha: 'unknown' };
  }
}

export function shouldExclude(relPath: string): boolean {
  const parts = relPath.split(path.sep);
  for (const part of parts) {
    if (EXCLUDED_DIRS.has(part)) return true;
  }
  const basename = path.basename(relPath);
  const ext = path.extname(relPath);
  if (EXCLUDED_FILENAMES.has(basename)) return true;
  if (EXCLUDED_EXTENSIONS.has(ext)) return true;
  if (basename.startsWith('PARACHUTE_') && basename.endsWith('.zip')) return true;
  return false;
}

export function collectFiles(dir: string, base: string): string[] {
  const results: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(base, fullPath);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) {
        results.push(...collectFiles(fullPath, base));
      }
    } else if (entry.isFile()) {
      if (!shouldExclude(relPath)) {
        results.push(relPath);
      }
    }
  }
  return results.sort();
}

// ── Minimal ZIP builder (Node standard library only) ──

function crc32(buf: Buffer): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

interface ZipEntry {
  name: string;
  compressedData: Buffer;
  uncompressedSize: number;
  crc: number;
  offset: number;
  method: number;
}

export function createZip(entries: Array<{ name: string; data: Buffer }>): Buffer {
  const zipEntries: ZipEntry[] = [];
  const parts: Buffer[] = [];
  let offset = 0;

  for (const { name, data } of entries) {
    const crc = crc32(data);
    const nameBytes = Buffer.from(name, 'utf8');
    const compressed = zlib.deflateRawSync(data);
    const useDeflate = compressed.length < data.length;
    const storedData = useDeflate ? compressed : data;
    const method = useDeflate ? 8 : 0;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(storedData.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(nameBytes.length, 26);
    localHeader.writeUInt16LE(0, 28);

    zipEntries.push({ name, compressedData: storedData, uncompressedSize: data.length, crc, offset, method });
    parts.push(localHeader, nameBytes, storedData);
    offset += 30 + nameBytes.length + storedData.length;
  }

  const cdStart = offset;
  for (const entry of zipEntries) {
    const nameBytes = Buffer.from(entry.name, 'utf8');
    const cdHeader = Buffer.alloc(46);
    cdHeader.writeUInt32LE(0x02014b50, 0);
    cdHeader.writeUInt16LE(20, 4);
    cdHeader.writeUInt16LE(20, 6);
    cdHeader.writeUInt16LE(0, 8);
    cdHeader.writeUInt16LE(entry.method, 10);
    cdHeader.writeUInt16LE(0, 12);
    cdHeader.writeUInt16LE(0, 14);
    cdHeader.writeUInt32LE(entry.crc, 16);
    cdHeader.writeUInt32LE(entry.compressedData.length, 20);
    cdHeader.writeUInt32LE(entry.uncompressedSize, 24);
    cdHeader.writeUInt16LE(nameBytes.length, 28);
    cdHeader.writeUInt16LE(0, 30);
    cdHeader.writeUInt16LE(0, 32);
    cdHeader.writeUInt16LE(0, 34);
    cdHeader.writeUInt16LE(0, 36);
    cdHeader.writeUInt32LE(0, 38);
    cdHeader.writeUInt32LE(entry.offset, 42);
    parts.push(cdHeader, nameBytes);
    offset += 46 + nameBytes.length;
  }
  const cdSize = offset - cdStart;

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(zipEntries.length, 8);
  eocd.writeUInt16LE(zipEntries.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdStart, 16);
  eocd.writeUInt16LE(0, 20);
  parts.push(eocd);

  return Buffer.concat(parts);
}

// ── Manifest builder (exported for testability) ──

// (ParachuteManifest imported from parachute-constants.ts above)

export function buildManifest(root: string): { manifest: ParachuteManifest; files: string[] } {
  const files = collectFiles(root, root);
  if (files.length === 0) {
    throw new Error('No files collected — something is wrong with the project root.');
  }

  const fileHashes: Record<string, string> = {};
  for (const relPath of files) {
    fileHashes[relPath] = sha256File(path.join(root, relPath));
  }

  const git = getGitInfo(root);

  const manifest: ParachuteManifest = {
    project: PROJECT_NAME,
    generated_timestamp: new Date().toISOString(),
    archive_format_version: ARCHIVE_FORMAT_VERSION,
    git_branch: git.branch,
    git_commit_sha: git.commitSha,
    included_files_count: files.length,
    included_files: fileHashes,
    excluded_categories: EXCLUDED_CATEGORIES,
  };

  return { manifest, files };
}

// ── Main entry ──

export async function runParachute(options?: { force?: boolean; outputDir?: string }): Promise<string> {
  const root = getProjectRoot();
  const force = options?.force ?? false;
  const outputDir = options?.outputDir ?? root;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '');
  const archiveName = `PARACHUTE_${PROJECT_NAME}_${timestamp}.zip`;
  const archivePath = path.join(outputDir, archiveName);

  if (fs.existsSync(archivePath) && !force) {
    throw new Error(`Archive already exists: ${archivePath}. Use --force to overwrite.`);
  }

  const { manifest, files } = buildManifest(root);
  const manifestJson = JSON.stringify(manifest, null, 2);

  const zipFileEntries: Array<{ name: string; data: Buffer }> = [];
  zipFileEntries.push({ name: 'PARACHUTE_MANIFEST.json', data: Buffer.from(manifestJson, 'utf8') });
  for (const relPath of files) {
    zipFileEntries.push({ name: relPath, data: fs.readFileSync(path.join(root, relPath)) });
  }

  const zipBuffer = createZip(zipFileEntries);
  fs.writeFileSync(archivePath, zipBuffer);
  const archiveHash = sha256Buffer(zipBuffer);

  console.log('══════════════════════════════════════════════════════════════');
  console.log('  PARACHUTE — Recovery Archive Generated');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`  Project:        ${PROJECT_NAME}`);
  console.log(`  Timestamp:      ${manifest.generated_timestamp}`);
  console.log(`  Git Branch:     ${manifest.git_branch}`);
  console.log(`  Git Commit:     ${manifest.git_commit_sha}`);
  console.log(`  Files Included: ${files.length}`);
  console.log(`  Archive:        ${archivePath}`);
  console.log(`  Archive SHA-256:${archiveHash}`);
  console.log('══════════════════════════════════════════════════════════════');

  return archivePath;
}

// ── CLI ──
const isCLI = process.argv[1] && (
  process.argv[1].endsWith('parachute.ts') ||
  process.argv[1].endsWith('parachute.js')
);

if (isCLI) {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('PARACHUTE — Emergency Export / Recovery Package');
    console.log('');
    console.log('Usage: npx tsx webapp/src/parachute/parachute.ts [--force]');
    console.log('');
    console.log('  --force   Overwrite existing archive if present');
    console.log('');
    console.log('Output: PARACHUTE_scout-disk-compiler_<timestamp>.zip');
    process.exit(0);
  }
  runParachute({ force: args.includes('--force') }).catch((err) => {
    console.error(`PARACHUTE FAILED: ${err.message}`);
    process.exit(1);
  });
}
