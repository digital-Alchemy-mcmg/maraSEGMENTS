// ============================================================
// Parachute Source Registry
// Build-time ?raw imports of every project file for ZIP archival
// ============================================================

// --- Root config ---
import rootPackageJson from '../../../../package.json?raw';

// --- Webapp config ---
import webappPackageJson from '../../../package.json?raw';
import webappTsconfig from '../../../tsconfig.json?raw';
import webappTsconfigNode from '../../../tsconfig.node.json?raw';
import webappViteConfig from '../../../vite.config.ts?raw';
import webappVitestConfig from '../../../vitest.config.ts?raw';
import webappIndexHtml from '../../../index.html?raw';
import webappTestSetup from '../../../testSetup.ts?raw';
import webappReadme from '../../../README.md?raw';
import webappGitignore from '../../../gitignore?raw';
import webappPrettierrc from '../../../.prettierrc?raw';
import webappPrettierignore from '../../../.prettierignore?raw';

// --- Webapp src ---
import srcApp from '../../App.tsx?raw';
import srcMain from '../../main.tsx?raw';
import srcViteEnv from '../../vite-env.d.ts?raw';

// --- b/ core ---
import bTypes from '../../b/types.ts?raw';
import bEngine from '../../b/engine.ts?raw';
import bContracts from '../../b/contracts.ts?raw';
import bTestFixtures from '../../b/test-fixtures.ts?raw';

// --- b/adapters ---
import standaloneAdapter from '../../b/adapters/standalone-adapter.ts?raw';
import compiledAdapter from '../../b/adapters/compiled-adapter.ts?raw';

// --- b/authority ---
import canonicalSdna from '../../b/authority/canonical-sdna.ts?raw';
import envelope from '../../b/authority/envelope.ts?raw';
import sidecar from '../../b/authority/sidecar.ts?raw';
import ingressGate from '../../b/authority/ingress-gate.ts?raw';
import accessControl from '../../b/authority/access-control.ts?raw';

// --- b/stages ---
import b1Decouple from '../../b/stages/b1-decouple.ts?raw';
import b2Tree from '../../b/stages/b2-tree.ts?raw';
import b3Binding from '../../b/stages/b3-binding.ts?raw';
import b4Audit from '../../b/stages/b4-audit.ts?raw';
import b5Prisms from '../../b/stages/b5-prisms.ts?raw';

// --- b/verification ---
import t06Trace from '../../b/verification/t06-trace.ts?raw';
import c1Readiness from '../../b/verification/c1-readiness.ts?raw';
import termination from '../../b/verification/termination.ts?raw';

// --- b/parachute (self-inclusion) ---
import zipWriter from '../../b/parachute/zip-writer.ts?raw';
import parachuteEngine from '../../b/parachute/parachute-engine.ts?raw';
import sourceRegistry from '../../b/parachute/source-registry.ts?raw';

// --- components/b ---
import stylesTs from '../../components/b/styles.ts?raw';
import bIngress from '../../components/b/BIngress.tsx?raw';
import b1Inspector from '../../components/b/B1Inspector.tsx?raw';
import b2TreeView from '../../components/b/B2TreeView.tsx?raw';
import b3BindingView from '../../components/b/B3BindingView.tsx?raw';
import b4AuditView from '../../components/b/B4AuditView.tsx?raw';
import b5ProjectionView from '../../components/b/B5ProjectionView.tsx?raw';
import bCodeInspector from '../../components/b/BCodeInspector.tsx?raw';
import bTestHarness from '../../components/b/BTestHarness.tsx?raw';
import traceHandoff from '../../components/b/TraceHandoff.tsx?raw';

/**
 * Complete source registry: repo-relative path → raw file content.
 * Every file required to reconstruct and run Segment B.
 */
export const SOURCE_FILES: Record<string, string> = {
  // Root
  'package.json': rootPackageJson,

  // Webapp config
  'webapp/package.json': webappPackageJson,
  'webapp/tsconfig.json': webappTsconfig,
  'webapp/tsconfig.node.json': webappTsconfigNode,
  'webapp/vite.config.ts': webappViteConfig,
  'webapp/vitest.config.ts': webappVitestConfig,
  'webapp/index.html': webappIndexHtml,
  'webapp/testSetup.ts': webappTestSetup,
  'webapp/README.md': webappReadme,
  'webapp/gitignore': webappGitignore,
  'webapp/.prettierrc': webappPrettierrc,
  'webapp/.prettierignore': webappPrettierignore,

  // Webapp src entry
  'webapp/src/App.tsx': srcApp,
  'webapp/src/main.tsx': srcMain,
  'webapp/src/vite-env.d.ts': srcViteEnv,

  // b/ core
  'webapp/src/b/types.ts': bTypes,
  'webapp/src/b/engine.ts': bEngine,
  'webapp/src/b/contracts.ts': bContracts,
  'webapp/src/b/test-fixtures.ts': bTestFixtures,

  // b/adapters
  'webapp/src/b/adapters/standalone-adapter.ts': standaloneAdapter,
  'webapp/src/b/adapters/compiled-adapter.ts': compiledAdapter,

  // b/authority
  'webapp/src/b/authority/canonical-sdna.ts': canonicalSdna,
  'webapp/src/b/authority/envelope.ts': envelope,
  'webapp/src/b/authority/sidecar.ts': sidecar,
  'webapp/src/b/authority/ingress-gate.ts': ingressGate,
  'webapp/src/b/authority/access-control.ts': accessControl,

  // b/stages
  'webapp/src/b/stages/b1-decouple.ts': b1Decouple,
  'webapp/src/b/stages/b2-tree.ts': b2Tree,
  'webapp/src/b/stages/b3-binding.ts': b3Binding,
  'webapp/src/b/stages/b4-audit.ts': b4Audit,
  'webapp/src/b/stages/b5-prisms.ts': b5Prisms,

  // b/verification
  'webapp/src/b/verification/t06-trace.ts': t06Trace,
  'webapp/src/b/verification/c1-readiness.ts': c1Readiness,
  'webapp/src/b/verification/termination.ts': termination,

  // b/parachute (self-inclusion)
  'webapp/src/b/parachute/zip-writer.ts': zipWriter,
  'webapp/src/b/parachute/parachute-engine.ts': parachuteEngine,
  'webapp/src/b/parachute/source-registry.ts': sourceRegistry,

  // components/b
  'webapp/src/components/b/styles.ts': stylesTs,
  'webapp/src/components/b/BIngress.tsx': bIngress,
  'webapp/src/components/b/B1Inspector.tsx': b1Inspector,
  'webapp/src/components/b/B2TreeView.tsx': b2TreeView,
  'webapp/src/components/b/B3BindingView.tsx': b3BindingView,
  'webapp/src/components/b/B4AuditView.tsx': b4AuditView,
  'webapp/src/components/b/B5ProjectionView.tsx': b5ProjectionView,
  'webapp/src/components/b/BCodeInspector.tsx': bCodeInspector,
  'webapp/src/components/b/BTestHarness.tsx': bTestHarness,
  'webapp/src/components/b/TraceHandoff.tsx': traceHandoff,
};
