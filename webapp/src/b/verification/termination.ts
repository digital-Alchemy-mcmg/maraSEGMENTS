// ============================================================
// Termination — sidecar purge, vault unmount
// ============================================================

import type { BContext, SidecarAttestation } from '../types';
import { createSidecarAttestation } from '../authority/sidecar';

export function terminateSidecar(ctx: BContext): SidecarAttestation {
  const attestation = createSidecarAttestation();
  // Purge sidecar live references
  (ctx as any)._sidecarPurged = true;
  return attestation;
}

export function unmountVault(ctx: BContext): void {
  ctx.vault.mounted = false;
  ctx.vault.atoms = [];
  ctx.vault.atom_index = new Map();
}

export function verifyVaultUnmounted(ctx: BContext): boolean {
  return !ctx.vault.mounted && ctx.vault.atoms.length === 0 && ctx.vault.atom_index.size === 0;
}
