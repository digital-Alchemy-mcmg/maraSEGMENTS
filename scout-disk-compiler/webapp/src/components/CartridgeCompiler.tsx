// ═══════════════════════════════════════════════════════════════
// Scout — Cartridge Compiler & Validator View
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import type { Cartridge, ValidationResult } from './types';
import { compileDisk, validateCartridge } from './compiler';
import type { DiskDefinition } from './types';
import { base, colors } from './styles';
import { downloadFile } from '@amzn/quick-pages-runtime-lib';

interface Props {
  definition: DiskDefinition | null;
  onCertified: (cartridge: Cartridge) => void;
}

export default function CartridgeCompiler({ definition, onCertified }: Props) {
  const [cartridge, setCartridge] = useState<Cartridge | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [jsonView, setJsonView] = useState<'payload' | 'cartridge' | 'definition'>('payload');
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!cartridge) return;
    setDownloadError(null);
    const separator = '\n' + '═'.repeat(80) + '\n';
    const content = [
      `SCOUT DISK COMPILER — CERTIFIED CARTRIDGE EXPORT`,
      `Generated: ${new Date().toISOString()}`,
      `Cartridge: ${cartridge.metadata.cartridge_id}`,
      `Disk: ${cartridge.metadata.disk_id}`,
      `Certification: ${cartridge.certification.status}`,
      `Hash: ${cartridge.certification.content_hash}`,
      separator,
      `SECTION 1: MACHINE PAYLOAD`,
      separator,
      JSON.stringify(cartridge.machine_payload, null, 2),
      separator,
      `SECTION 2: FULL CARTRIDGE`,
      separator,
      JSON.stringify(cartridge, null, 2),
      separator,
      `SECTION 3: DISK DEFINITION`,
      separator,
      JSON.stringify(cartridge.definition, null, 2),
      separator,
      `END OF EXPORT`,
    ].join('\n');
    try {
      const blob = new Blob([content], { type: 'text/plain' });
      await downloadFile(`${cartridge.metadata.cartridge_id}_certified.txt`, blob);
    } catch (err: unknown) {
      setDownloadError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    if (!definition) return;
    setCompiling(true);
    setValidation(null);
    // Simulate compilation delay for UX
    const timer = setTimeout(() => {
      const c = compileDisk(definition);
      setCartridge(c);
      setCompiling(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [definition]);

  const runValidation = async () => {
    if (!cartridge) return;
    const result = await validateCartridge(cartridge);
    setValidation(result);
    if (result.certified_cartridge) {
      setCartridge(result.certified_cartridge);
      onCertified(result.certified_cartridge);
    }
  };

  if (!definition) {
    return (
      <div style={{ ...base.card, textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
        <div style={{ fontSize: '16px', color: colors.textDim }}>No disk definition loaded.</div>
        <div style={{ fontSize: '13px', color: colors.textMuted, marginTop: '8px' }}>Use the Disk Builder tab to create and compile a definition.</div>
      </div>
    );
  }

  if (compiling) {
    return (
      <div style={{ ...base.card, textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>⚙️</div>
        <div style={{ color: colors.accent }}>Compiling disk definition...</div>
      </div>
    );
  }

  if (!cartridge) return null;

  const cert = cartridge.certification;
  const isCertified = cert.status === 'CERTIFIED';

  return (
    <div>
      {/* Status Banner */}
      <div style={{
        ...base.card,
        backgroundColor: isCertified ? colors.successBg : colors.warningBg,
        borderColor: isCertified ? colors.success : colors.warning,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: isCertified ? colors.success : colors.warning }}>
            {isCertified ? '✅ CERTIFIED — READY' : '⏳ UNCERTIFIED — NOT READY'}
          </div>
          <div style={{ fontSize: '12px', color: colors.textDim, marginTop: '4px', ...base.mono }}>
            {cert.content_hash}
          </div>
        </div>
        {!isCertified && (
          <button style={{ ...base.btn, ...base.btnSuccess }} onClick={runValidation}>
            🔐 Run 25-Point Validator
          </button>
        )}
      </div>

      {/* Metadata Summary */}
      <div style={base.card}>
        <div style={base.cardTitle}>📋 Cartridge Metadata</div>
        <div style={base.row4}>
          {[
            ['Cartridge', cartridge.metadata.cartridge_id],
            ['Disk', cartridge.metadata.disk_id],
            ['Compilation', cartridge.metadata.compilation_id],
            ['Payload', cartridge.metadata.payload_id],
          ].map(([label, val]) => (
            <div key={label} style={{ padding: '10px', backgroundColor: colors.surfaceAlt, borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: colors.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
              <div style={{ ...base.mono, fontWeight: 700, color: colors.accent }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Compilation Report */}
      <div style={base.card}>
        <div style={base.cardTitle}>📊 Compilation Report</div>
        <div style={base.row4}>
          {[
            ['NAICS', cartridge.report.metrics.naics_count, '🏭'],
            ['SOC', cartridge.report.metrics.soc_count, '👤'],
            ['Rings', cartridge.report.metrics.ring_assignment_count, '🎯'],
            ['Keywords', cartridge.report.metrics.keywords_count, '🔑'],
          ].map(([label, count, icon]) => (
            <div key={label as string} style={{ textAlign: 'center', padding: '16px', backgroundColor: colors.surfaceAlt, borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>{icon}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: colors.text }}>{count as number}</div>
              <div style={{ fontSize: '11px', color: colors.textMuted }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Results */}
      {validation && (
        <div style={base.card}>
          <div style={base.cardTitle}>
            🔐 25-Point Validation — {validation.passed ?
              <span style={{ color: colors.success }}>ALL PASSED</span> :
              <span style={{ color: colors.error }}>FAILED</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
            {validation.checks.map(ch => (
              <div key={ch.id} title={`#${ch.id} ${ch.name}: ${ch.detail}`} style={{
                padding: '8px',
                backgroundColor: ch.passed ? colors.successBg : colors.errorBg,
                borderRadius: '4px',
                textAlign: 'center',
                cursor: 'default',
              }}>
                <div style={{ fontSize: '14px' }}>{ch.passed ? '✅' : '❌'}</div>
                <div style={{ fontSize: '10px', color: colors.textDim, marginTop: '2px' }}>#{ch.id}</div>
              </div>
            ))}
          </div>
          {/* Expanded list */}
          <div style={{ marginTop: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {validation.checks.map(ch => (
              <div key={ch.id} style={{ display: 'flex', gap: '8px', padding: '6px 0', borderBottom: `1px solid ${colors.border}`, fontSize: '12px' }}>
                <span style={{ width: '20px', textAlign: 'center' }}>{ch.passed ? '✅' : '❌'}</span>
                <span style={{ width: '30px', color: colors.textMuted }}>#{ch.id}</span>
                <span style={{ flex: 1, fontWeight: 600 }}>{ch.name}</span>
                <span style={{ color: colors.textDim, ...base.mono }}>{ch.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* JSON Viewer */}
      <div style={base.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={base.cardTitle}>{ '{ }' } JSON Inspector</div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {(['payload', 'cartridge', 'definition'] as const).map(v => (
              <button key={v} onClick={() => setJsonView(v)} style={{
                ...base.btn,
                padding: '4px 12px',
                fontSize: '11px',
                backgroundColor: jsonView === v ? colors.accent : colors.surfaceAlt,
                color: jsonView === v ? '#fff' : colors.textDim,
              }}>
                {v}
              </button>
            ))}
            {isCertified && (
              <button
                onClick={handleDownload}
                style={{
                  ...base.btn,
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: colors.successBg,
                  color: colors.success,
                  border: `1px solid ${colors.success}`,
                  marginLeft: '8px',
                }}
              >
                📥 Download All 3 JSONs (.txt)
              </button>
            )}
          </div>
        </div>
        {downloadError && (
          <div style={{ padding: '8px 12px', backgroundColor: colors.errorBg, borderRadius: '4px', marginBottom: '8px', fontSize: '12px', color: colors.error }}>
            {downloadError}
          </div>
        )}
        <pre style={{
          ...base.mono,
          backgroundColor: colors.bg,
          padding: '16px',
          borderRadius: '6px',
          border: `1px solid ${colors.border}`,
          maxHeight: '400px',
          overflowY: 'auto',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          lineHeight: 1.5,
          margin: 0,
        }}>
          {JSON.stringify(
            jsonView === 'payload' ? cartridge.machine_payload :
            jsonView === 'definition' ? cartridge.definition :
            cartridge,
            null, 2
          )}
        </pre>
      </div>
    </div>
  );
}
