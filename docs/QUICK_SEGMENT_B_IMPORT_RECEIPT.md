# Amazon Quick Segment B Import Receipt

Source archive: PARACHUTE_segment-b_2026-10-05T15-56-38-137Z.zip
Serialized source received: 2026-10-05
Destination: digital-Alchemy-mcmg/maraSEGMENTS @ segment/B

The Quick application source is added alongside the existing Python Segment B harness; existing Python runtime files remain untouched.

Known package gap: the Quick archive contains neither package-lock.json nor the local @amzn/quick-pages-runtime-lib tarball referenced by webapp/package.json. No dependency artifact was invented.
