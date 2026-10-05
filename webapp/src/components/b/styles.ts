// ============================================================
// Shared UI styles
// ============================================================

export const COLORS = {
  bg: '#0a0e17',
  panel: '#111827',
  panelBorder: '#1f2937',
  accent: '#3b82f6',
  accentDim: '#1e40af',
  success: '#10b981',
  fail: '#ef4444',
  warn: '#f59e0b',
  text: '#e5e7eb',
  textDim: '#9ca3af',
  textBright: '#f9fafb',
  locked: '#4b5563',
  ready: '#3b82f6',
  running: '#f59e0b',
  pass: '#10b981',
  sealed: '#8b5cf6',
  code: '#1e1e2e',
};

export const STATUS_COLORS: Record<string, string> = {
  LOCKED: COLORS.locked,
  READY: COLORS.ready,
  RUNNING: COLORS.running,
  PASS: COLORS.pass,
  SEALED: COLORS.sealed,
  FAIL: COLORS.fail,
};

export const basePanel: React.CSSProperties = {
  background: COLORS.panel,
  border: `1px solid ${COLORS.panelBorder}`,
  borderRadius: 8,
  padding: 16,
  marginBottom: 12,
};

export const btn = (color: string = COLORS.accent, disabled = false): React.CSSProperties => ({
  background: disabled ? COLORS.locked : color,
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '8px 16px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 600,
  fontSize: 13,
  opacity: disabled ? 0.5 : 1,
});

export const badge = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  background: color + '22',
  color,
  border: `1px solid ${color}44`,
  borderRadius: 4,
  padding: '2px 8px',
  fontSize: 11,
  fontWeight: 600,
  marginRight: 4,
});

export const mono: React.CSSProperties = {
  fontFamily: '"AmazonEmberMono", monospace',
  fontSize: 12,
};

export const heading: React.CSSProperties = {
  color: COLORS.textBright,
  margin: '0 0 12px',
  fontSize: 16,
  fontWeight: 700,
};

export const subheading: React.CSSProperties = {
  color: COLORS.textDim,
  margin: '8px 0 4px',
  fontSize: 13,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: 1,
};
