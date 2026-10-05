import { useState, useCallback } from 'react';
import type { DiskDefinition, Cartridge } from './components/types';
import DiskBuilder from './components/DiskBuilder';
import CartridgeCompiler from './components/CartridgeCompiler';
import PipelineSimulator from './components/PipelineSimulator';
import LiveDecompPreview from './components/LiveDecompPreview';
import CodeInspector from './components/CodeInspector';
import { base, colors } from './components/styles';
import { executeBrowserParachute, type ParachuteResult } from './parachute/parachute-browser';

type Tab = 'builder' | 'compiler' | 'pipeline' | 'decomp' | 'inspector';
type ParachuteStatus = 'READY' | 'GENERATING PARACHUTE...' | 'PARACHUTE READY' | 'PARACHUTE FAILED';

export const App = () => {
  const [tab, setTab] = useState<Tab>('builder');
  const [definition, setDefinition] = useState<DiskDefinition | null>(null);
  const [certifiedCartridge, setCertifiedCartridge] = useState<Cartridge | null>(null);
  const [parachuteStatus, setParachuteStatus] = useState<ParachuteStatus>('READY');
  const [parachuteResult, setParachuteResult] = useState<ParachuteResult | null>(null);
  const [parachuteError, setParachuteError] = useState<string | null>(null);

  const handleParachute = useCallback(async () => {
    if (parachuteStatus === 'GENERATING PARACHUTE...') return;
    setParachuteStatus('GENERATING PARACHUTE...');
    setParachuteResult(null);
    setParachuteError(null);
    try {
      const result = await executeBrowserParachute();
      setParachuteResult(result);
      setParachuteStatus('PARACHUTE READY');
    } catch (err: unknown) {
      setParachuteError(err instanceof Error ? err.message : String(err));
      setParachuteStatus('PARACHUTE FAILED');
    }
  }, [parachuteStatus]);

  const handleCompile = (def: DiskDefinition) => {
    setDefinition(def);
    setCertifiedCartridge(null);
    setTab('compiler');
  };

  const handleCertified = (cart: Cartridge) => {
    setCertifiedCartridge(cart);
  };

  const tabs: { key: Tab; label: string; icon: string; enabled: boolean }[] = [
    { key: 'builder', label: 'Disk Builder', icon: '🛠', enabled: true },
    { key: 'compiler', label: 'Cartridge Compiler', icon: '⚡', enabled: !!definition },
    { key: 'pipeline', label: 'Pipeline Flow', icon: '🚀', enabled: !!certifiedCartridge },
    { key: 'decomp', label: 'Live Preview', icon: '🔬', enabled: true },
    { key: 'inspector', label: 'Code Inspector', icon: '📐', enabled: true },
  ];

  return (
    <div style={base.app}>
      {/* Header */}
      <div style={base.header}>
        <h1 style={base.headerTitle}>
          <span style={{ fontSize: '22px' }}>◈</span>
          <span>SCOUT DISK COMPILER</span>
          <span style={{ ...base.badge, backgroundColor: colors.purpleBg, color: colors.purple, fontSize: '10px' }}>v2.2.0</span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {definition && (
            <span style={{ ...base.mono, color: colors.textDim, fontSize: '11px' }}>
              {definition.id} • {definition.label}
            </span>
          )}
          {certifiedCartridge && (
            <span style={{ ...base.badge, backgroundColor: colors.successBg, color: colors.success }}>CERTIFIED</span>
          )}
          <span style={{ color: colors.border, fontSize: '16px' }}>│</span>
          <button
            onClick={handleParachute}
            disabled={parachuteStatus === 'GENERATING PARACHUTE...'}
            style={{
              ...base.btn,
              padding: '6px 14px',
              fontSize: '11px',
              backgroundColor: parachuteStatus === 'PARACHUTE READY' ? colors.successBg
                : parachuteStatus === 'PARACHUTE FAILED' ? colors.errorBg
                : parachuteStatus === 'GENERATING PARACHUTE...' ? colors.warningBg
                : colors.surfaceAlt,
              color: parachuteStatus === 'PARACHUTE READY' ? colors.success
                : parachuteStatus === 'PARACHUTE FAILED' ? colors.error
                : parachuteStatus === 'GENERATING PARACHUTE...' ? colors.warning
                : colors.textDim,
              border: `1px solid ${
                parachuteStatus === 'PARACHUTE READY' ? colors.success
                : parachuteStatus === 'PARACHUTE FAILED' ? colors.error
                : parachuteStatus === 'GENERATING PARACHUTE...' ? colors.warning
                : colors.border
              }`,
              opacity: parachuteStatus === 'GENERATING PARACHUTE...' ? 0.7 : 1,
              cursor: parachuteStatus === 'GENERATING PARACHUTE...' ? 'wait' : 'pointer',
            }}
          >
            {parachuteStatus === 'GENERATING PARACHUTE...' ? '⏳' : '🪂'}{' '}
            {parachuteStatus === 'READY' ? 'EXPORT PARACHUTE' : parachuteStatus}
          </button>
        </div>
      </div>

      {/* Parachute Status Banner (only shown after action) */}
      {(parachuteResult || parachuteError) && (
        <div style={{
          padding: '8px 24px',
          backgroundColor: parachuteResult ? colors.successBg : colors.errorBg,
          borderBottom: `1px solid ${parachuteResult ? colors.success : colors.error}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
        }}>
          {parachuteResult && (
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <span style={{ color: colors.success, fontWeight: 700 }}>🪂 PARACHUTE READY</span>
              <span style={{ ...base.mono, color: colors.textDim }}>
                {parachuteResult.archiveName}
              </span>
              <span style={{ ...base.mono, color: colors.textDim }}>
                SHA-256: {parachuteResult.archiveSha256.substring(0, 16)}…
              </span>
              <span style={{ ...base.mono, color: colors.textDim }}>
                {parachuteResult.fileCount} files
              </span>
            </div>
          )}
          {parachuteError && (
            <span style={{ color: colors.error }}>{parachuteError}</span>
          )}
          <button
            onClick={() => { setParachuteResult(null); setParachuteError(null); setParachuteStatus('READY'); }}
            style={{ ...base.btn, padding: '2px 8px', fontSize: '10px', backgroundColor: 'transparent', color: colors.textMuted }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab Bar */}
      <div style={base.tabBar}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => t.enabled && setTab(t.key)}
            style={{
              ...base.tab,
              ...(tab === t.key ? base.tabActive : {}),
              opacity: t.enabled ? 1 : 0.4,
              cursor: t.enabled ? 'pointer' : 'not-allowed',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={base.content}>
        {tab === 'builder' && <DiskBuilder onCompile={handleCompile} />}
        {tab === 'compiler' && <CartridgeCompiler definition={definition} onCertified={handleCertified} />}
        {tab === 'pipeline' && <PipelineSimulator cartridge={certifiedCartridge} />}
        {tab === 'decomp' && <LiveDecompPreview />}
        {tab === 'inspector' && <CodeInspector />}
      </div>

      {/* Architecture Diagram */}
      <div style={{ padding: '0 24px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ ...base.card, padding: '16px' }}>
          <div style={{ ...base.cardTitle, marginBottom: '12px' }}>🗺 System Architecture</div>
          <pre style={{
            ...base.mono,
            color: colors.textDim,
            fontSize: '10px',
            lineHeight: 1.6,
            margin: 0,
            overflowX: 'auto',
          }}>{`┌──────────────── STAGE 1: THE APP (STUDIO) ─────────────────┐   ┌──────────────── STAGE 2: THE FLOW (PIPELINE) ────────────────┐
│                                                             │   │                                                                │
│  Operator ──► Disk Definition ──► DiskCompiler ──► 25-Pt    │   │  Candidates ──► ENVOY 1 (12 Gates) ──► Accepted Observations  │
│  Input         (JSON)              (Rings,        Validator  │   │                 (Haversine, NAICS,      (Canonical 13-Field    │
│  (ZIP, NAICS,                      Payload,       + SHA-256  │   │                  SOC, Dedup)             Row + OBS-ID)          │
│   SOC, KW)                         Taxonomy)                │   │                                              │                  │
│                                                             │   │  Envelope v0.2 ◄── ENVOY 2 (Code Step) ◄─────┘                  │
│  Live Preview ──► decomposeDescription() ──► Fact Table     │   │  (Handoff → B)      decomposeDescription()                     │
│  (Operator testing before batch runs)       + Rule Log      │   │                     12-Rule Deterministic Engine                │
│  Rule Test Harness ──► Individual rule function testing     │   │                     ★ ZERO AI ★ ZERO LLM ★                     │
└─────────────────────────────────────────────────────────────┘   └────────────────────────────────────────────────────────────────┘`}</pre>
        </div>
      </div>
    </div>
  );
};

export default App;
