import react from '@vitejs/plugin-react';
import { defineConfig, UserConfig, loadEnv, Plugin } from 'vite';
import checker from 'vite-plugin-checker';
import tsconfigPaths from 'vite-tsconfig-paths';
import { viteSingleFile } from 'vite-plugin-singlefile';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Vite plugin that inlines RuntimeLib IIFE bundles into index.html at build time.
 *
 * index.html loads each IIFE via a plain (non-module) <script src> tag pointing into
 * ../node_modules/. Vite does not process plain <script src> tags as bundleable assets —
 * only <script type="module"> tags enter the module graph. So the tag survives verbatim
 * into the built output, where it becomes a broken reference: the artifact directory
 * contains only index.html and fonts/, with no node_modules alongside it.
 *
 * This plugin hooks into transformIndexHtml at build time, reads each IIFE file from
 * ../node_modules/ (which exists on the build machine), and replaces the <script src>
 * tag with an inline <script> block so the artifact is fully self-contained.
 *
 * Covers two RuntimeLib IIFEs:
 *   - bridge-registry.iife.js  → window.__bridgeRegistry
 *   - qw-test-exec.iife.js     → window.__qwTestExec (QuickWork E2E test bridge)
 *
 * In dev server mode the plugin is a no-op — the browser loads each file directly
 * via the <script src> path, which resolves correctly against the workspace root.
 */
function inlineRuntimeLibIifesPlugin(): Plugin {
    // The IIFEs live in the workspace root node_modules (npm hoisting),
    // one level above webapp/ where vite.config.ts lives.
    const IIFES: { rel: string; tag: RegExp; label: string }[] = [
        {
            label: 'bridge-registry',
            rel: '../node_modules/@amzn/quick-pages-runtime-lib/dist/bridge-registry.iife.js',
            tag: /<script\s+src="\.\.\/node_modules\/@amzn\/quick-pages-runtime-lib\/dist\/bridge-registry\.iife\.js"><\/script>/,
        },
        {
            label: 'qw-test-exec',
            rel: '../node_modules/@amzn/quick-pages-runtime-lib/dist/qw-test-exec.iife.js',
            tag: /<script\s+src="\.\.\/node_modules\/@amzn\/quick-pages-runtime-lib\/dist\/qw-test-exec\.iife\.js"><\/script>/,
        },
    ];
    let isBuild = false;

    return {
        name: 'inline-runtime-lib-iifes',
        configResolved(resolvedConfig) {
            isBuild = resolvedConfig.command === 'build';
        },
        // Only inline during build — dev server loads the files directly from disk via the src paths
        transformIndexHtml: {
            order: 'pre',
            handler(html) {
                if (!isBuild) return html;
                let result = html;
                for (const { rel, tag, label } of IIFES) {
                    const iifePath = path.resolve(__dirname, rel);
                    if (!fs.existsSync(iifePath)) {
                        throw new Error(
                            `[inline-runtime-lib-iifes] ${label} IIFE bundle not found at ${iifePath}. ` +
                            `Run 'npm install' in the workspace root to unpack the RuntimeLib .tgz.`
                        );
                    }
                    const iife = fs.readFileSync(iifePath, 'utf8');
                    // Use a replacer FUNCTION, not a string: String.prototype.replace
                    // interprets `$&`, `$\``, `$'`, `$n` in a string replacement, and the
                    // minified IIFE routinely contains `$` (variable names, templates),
                    // which would silently corrupt the inlined output. A function returns
                    // the replacement verbatim.
                    const next = result.replace(tag, () => `<script>\n${iife}\n</script>`);
                    if (next === result) {
                        throw new Error(
                            `[inline-runtime-lib-iifes] Could not find the ${label} <script src> tag in index.html. ` +
                            'Ensure the tag matches the expected pattern.'
                        );
                    }
                    result = next;
                }
                return result;
            },
        },
    };
}

/**
 * Vite's `root` is this directory: `vite build` runs in webapp/ (see the build script
 * in package.json), the config sets no `root`, so it defaults to cwd. The read
 * boundary is one level up, where node_modules is hoisted.
 */
const VITE_ROOT = __dirname;
const WORKSPACE_ROOT = path.resolve(VITE_ROOT, '..');

const isInsideWorkspace = (target: string): boolean =>
    target === WORKSPACE_ROOT || target.startsWith(WORKSPACE_ROOT + path.sep);


/** A reference Vite resolves as a path, as opposed to a bare specifier or a URL. */
const isPathReference = (reference: string): boolean =>
    (reference.startsWith('/') && !reference.startsWith('//')) || reference.startsWith('.');

/**
 * True when `reference`, written in `fromDir`, would make the build read outside the
 * workspace.
 *
 * An absolute reference is tried against Vite's `root` and then as a filesystem path,
 * matching Vite's order, and each is tested independently: '/src/../../../root'
 * escapes via the first while the second hits nothing. Resolving against the boundary
 * instead of `root` would check a path one level off from the one Vite reads, letting
 * an absolute reference escape to any intermediate depth.
 *
 * Only an existing target is refused -- a reference resolving to no file discloses
 * nothing, and requiring existence is what keeps absolute-looking runtime URLs such
 * as '/api/logo.png' building.
 */
function readsOutsideWorkspace(reference: string, fromDir: string | null): boolean {
    const candidates = path.isAbsolute(reference)
        ? [path.resolve(VITE_ROOT, '.' + reference), path.resolve(reference)]
        : fromDir
          ? [path.resolve(fromDir, reference)]
          : [];
    return candidates.some(
        (candidate) => !isInsideWorkspace(candidate) && fs.existsSync(candidate)
    );
}

const CSS_REFERENCE = /@import\s+(?:url\(\s*)?['"]?([^'")\s]+)|url\(\s*['"]?([^'")\s]+)/g;
const ASSET_IMPORT_META_URL = /new\s+URL\(\s*['"`]([^'"`]+)['"`]\s*,\s*import\.meta\.url/g;

/**
 * Refuses build-time reads outside the workspace (P491201879).
 *
 * `vite build` has no equivalent of `server.fs.allow`, which guards only the dev
 * server, so '/root/.npmrc?raw' is otherwise read off the container filesystem and
 * inlined into the artifact. Three read paths need gating: only module imports reach
 * the plugin container, while CSS url()/@import is resolved by postcss-import and
 * new URL(..., import.meta.url) by Vite's asset handling.
 */
function denyOutOfWorkspaceReadsPlugin(): Plugin {
    const refuse = (kind: string, reference: string): never => {
        throw new Error(
            `${kind} '${reference}' reads a file outside the app workspace and is not allowed.`
        );
    };
    return {
        name: 'deny-out-of-workspace-reads',
        // Build only: the dev server is never on a customer path -- Forge runs
        // `npm run build` and serves the static artifact.
        apply: 'build',
        enforce: 'pre',
        resolveId(source, importer) {
            if (source.startsWith('\0')) return null;
            // Vite strips these two before the read, so the existence check below
            // cannot see the real target through them.
            if (source.startsWith('/@fs/') || source.startsWith('file://')) {
                refuse('Import of', source);
            }
            // Virtual ids need no skip: they resolve to no file, so the existence
            // check passes them. A skip on '/@' would instead let '/@id/../../../x'
            // through, since '@id' is a literal segment one '..' consumes.
            const bare = source.split('?')[0].split('#')[0];
            if (!isPathReference(bare)) return null;
            const fromDir = importer ? path.dirname(importer.split('?')[0]) : null;
            if (readsOutsideWorkspace(bare, fromDir)) refuse('Import of', source);
            return null;
        },
        transform(code, id) {
            const file = id.split('?')[0];
            // Plain .css only: no preprocessor dependency exists in either template, so
            // a .scss/.styl file fails the build regardless -- and listing those
            // extensions would imply @use/@forward/@require coverage this does not have.
            const isCss = /\.css$/.test(file);
            if (!isCss && !/\.(js|jsx|ts|tsx|mts|mjs|cjs)$/.test(file)) return null;
            // Block comments only. Stripping `//` too would need a tokenizer to avoid
            // clipping '://' inside string literals, and a line-commented reference
            // has to name a real out-of-tree file to matter.
            const active = code.replace(/\/\*[\s\S]*?\*\//g, '');
            const fromDir = path.dirname(file);
            for (const match of active.matchAll(isCss ? CSS_REFERENCE : ASSET_IMPORT_META_URL)) {
                const reference = (match[1] || match[2] || '').split('?')[0].split('#')[0];
                if (isPathReference(reference) && readsOutsideWorkspace(reference, fromDir)) {
                    refuse(isCss ? 'CSS reference' : 'new URL()', reference);
                }
            }
            return null;
        },
    };
}

/**
 * Highcharts licensing.
 *
 * Highcharts License ID: 5E4B-835F-CDEE-8F7E-F052
 *   Per Highcharts FAQ, no key needs to be set in code for the core
 *   Highcharts library; the License ID is a record of purchase only.
 *
 * Highcharts Grid Pro requires a Grid Key to suppress the unlicensed-use
 * console warning. The same key covers Grid components rendered inside
 * Highcharts Dashboards.
 *
 * The setup is injected into main.tsx in-memory at build/dev time so it
 * reaches existing apps too — webapp/src/main.tsx is never re-copied
 * from the template (it lives in each app's git bundle), but vite.config.ts
 * IS re-copied on every workspace prep (see _copy_template_vite_config in
 * tools/workspace.py), so a plugin here reaches old and new apps alike on
 * their next build.
 *
 * Docs: https://www.highcharts.com/docs/grid/grid-key
 */
function highchartsLicensePlugin(): Plugin {
    const PREFIX =
        "import Grid from '@highcharts/grid-pro';\n" +
        "Grid.setOptions({ gridKey: 'AV58-GK4N-VJLA-A22K-06Z2-NDM9' });\n";
    return {
        name: 'highcharts-license',
        enforce: 'pre',
        transform(code, id) {
            if (/[\\/]src[\\/]main\.tsx$/.test(id)) {
                return { code: PREFIX + code, map: null };
            }
            return null;
        },
    };
}

// Helper function to read key-value pairs from cookies.json
function loadCookiesFromFile(): string | undefined {
    try {
        const cookiesPath = path.join(__dirname, 'cookies.json');
        if (fs.existsSync(cookiesPath)) {
            const cookiesJson = JSON.parse(fs.readFileSync(cookiesPath, 'utf-8'));
            const cookieString = cookiesJson
                .map((cookie: any) => `${cookie.name}=${cookie.value}`)
                .join('; ');
            console.log(`[Vite] Loaded ${cookiesJson.length} cookies from cookies.json`);
            return cookieString;
        }
    } catch (error) {
        console.error('[Vite] Error loading cookies.json:', error);
    }
    return undefined;
}

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const cookiesFromFile = loadCookiesFromFile();
    
    const config: UserConfig = {
        base: './',
        publicDir: 'public',
        build: {
            // Inline all assets to produce a single index.html
            assetsInlineLimit: Infinity,
            cssCodeSplit: false,
            rollupOptions: {
                output: {
                    // Single chunk for all JS
                    manualChunks: undefined,
                    inlineDynamicImports: true
                }
            }
        },
        optimizeDeps: {
            include: ['react**']
        },
        // Reload frontend if any backend code is changed
        plugins: [
            // Must precede every other plugin so nothing resolves an
            // out-of-workspace path before this gate sees it.
            denyOutOfWorkspaceReadsPlugin(),
            react(),
            tsconfigPaths(),
            checker({
                    // e.g. use TypeScript check
                    typescript: true
                }),
            // Inline RuntimeLib IIFEs (bridge-registry, qw-test-exec) into the built index.html
            inlineRuntimeLibIifesPlugin(),
            // Inject Highcharts Grid Pro license key at the top of main.tsx
            highchartsLicensePlugin(),
            // Inline all JS and CSS into a single index.html file
            viteSingleFile()
        ]
    };

    // Server config calls getCspHeader, which requires the BUILDER_ORIGIN env var to be defined.
    // With this condition, BUILDER_ORIGIN will only need to be defined for serve and not build.
    if (command === 'serve') {
        config.server = {
            hmr: true,
            proxy: {
                '/api': {
                    target: 'http://localhost:3028',
                    changeOrigin: true,
                    secure: false
                },
                // TODO: remove after integrated with spaceneedle domain
                // Proxy for qs-file-proxy endpoint (Spaces document uploads)
                '/qs-file-proxy': {
                    target: 'https://spaceneedle-alpha.amazon.com',
                    changeOrigin: true,
                    secure: false,
                    cookieDomainRewrite: { '*': '' },
                    rewrite: (path) => {
                        const accountAlias = env.VITE_ACCOUNT_ALIAS || '30rock-sn-test-account-devtest-idc';
                        const newPath = path.replace(/^\/qs-file-proxy/, `/sn/account/${accountAlias}/qbsproxy/qs-file-proxy`);
                        console.log('[Vite Proxy]', path, '->', newPath);
                        return newPath;
                    },
                    configure: (proxy) => {
                        proxy.on('proxyReq', (proxyReq, req) => {
                            const cookiesToUse = cookiesFromFile || req.headers.cookie;
                            
                            if (cookiesToUse) {
                                proxyReq.setHeader('cookie', cookiesToUse);
                            }
                            proxyReq.setHeader('referer', 'https://spaceneedle-alpha.amazon.com/');
                            proxyReq.setHeader('origin', 'https://spaceneedle-alpha.amazon.com');
                            
                            ['accept', 'accept-language', 'user-agent', 'x-amzn-target', 'instance-id'].forEach(header => {
                                const value = req.headers[header];
                                if (value) proxyReq.setHeader(header, value);
                            });
                        });
                        
                        proxy.on('proxyRes', (proxyRes) => {
                            proxyRes.headers['access-control-allow-origin'] = '*';
                            proxyRes.headers['access-control-allow-credentials'] = 'true';
                        });
                    }
                },
                // TODO: remove after integrated with spaceneedle domain
                // Temporary reverse proxy to make cross-site requests to spaceneedle
                // Remove after integrated with spaceneedle and QBSProxy
                '/qbs-proxy': {
                    target: 'https://spaceneedle-alpha.amazon.com',
                    changeOrigin: true,
                    secure: false,
                    cookieDomainRewrite: { '*': '' },
                    rewrite: (path) => {
                        const accountAlias = env.VITE_ACCOUNT_ALIAS || '30rock-sn-test-account-devtest-idc';
                        const newPath = path.replace(/^\/qbs-proxy/, `/sn/account/${accountAlias}/qbsproxy/quicksight`);
                        console.log('[Vite Proxy]', path, '->', newPath);
                        return newPath;
                    },
                    configure: (proxy) => {
                        proxy.on('proxyReq', (proxyReq, req) => {
                            const cookiesToUse = cookiesFromFile || req.headers.cookie;
                            
                            if (cookiesToUse) {
                                proxyReq.setHeader('cookie', cookiesToUse);
                            }
                            proxyReq.setHeader('referer', 'https://spaceneedle-alpha.amazon.com/');
                            proxyReq.setHeader('origin', 'https://spaceneedle-alpha.amazon.com');
                            
                            ['accept', 'accept-language', 'user-agent', 'x-amzn-target', 'instance-id'].forEach(header => {
                                const value = req.headers[header];
                                if (value) proxyReq.setHeader(header, value);
                            });
                        });
                        
                        proxy.on('proxyRes', (proxyRes) => {
                            proxyRes.headers['access-control-allow-origin'] = '*';
                            proxyRes.headers['access-control-allow-credentials'] = 'true';
                        });
                    }
                }
            },
            port: 3029,
            strictPort: true
        };
    }

    return config;
});
