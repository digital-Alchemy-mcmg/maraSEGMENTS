// ═══════════════════════════════════════════════════════════════
// PARACHUTE — Shared Constants & Types
//
// Extracted so both the Node-side parachute.ts and the
// browser-side parachute-browser.ts can import without
// pulling in Node-only dependencies.
// ═══════════════════════════════════════════════════════════════

export const PROJECT_NAME = 'scout-disk-compiler';
export const ARCHIVE_FORMAT_VERSION = '1.0.0';

export const EXCLUDED_CATEGORIES = [
  'secrets / credentials / API keys',
  'environment-variable files containing secrets (.env*)',
  'cookies.json',
  'caches and temporary files',
  '__pycache__ / .pyc files',
  'dependency/vendor directories (node_modules)',
  'build output (dist/)',
  '.git internal objects',
  'large binary assets (.woff2 fonts, .tgz archives)',
  'package-lock.json (reconstructable)',
];

export interface ParachuteManifest {
  project: string;
  generated_timestamp: string;
  archive_format_version: string;
  git_branch: string;
  git_commit_sha: string;
  included_files_count: number;
  included_files: Record<string, string>;
  excluded_categories: string[];
}
