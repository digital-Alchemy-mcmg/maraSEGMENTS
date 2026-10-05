# Segment B Parachute

The Amazon Quick build includes a manual in-app recovery exporter under webapp/src/b/parachute.

The exporter creates a ZIP containing registered source bytes, PARACHUTE_MANIFEST.json with per-file SHA-256, and PARACHUTE_RECEIPT.txt. It excludes node_modules, dist, .git, env/secrets, bytecode, caches, and prior Parachute ZIPs.

Imported source archive: PARACHUTE_segment-b_2026-10-05T15-56-38-137Z.zip.
Quick manifest: 47 source files / 49 archive entries.

Portability note: webapp/package.json references @amzn/quick-pages-runtime-lib through a local file tarball under webapp/libs. The supplied Parachute did not include that tarball or package-lock.json. Neither dependency artifact is fabricated in this commit; Amazon Quick remains the authoritative environment for that local runtime dependency until it is supplied.
