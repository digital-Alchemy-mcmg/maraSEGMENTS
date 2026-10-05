
# Build Spec — Vol 2
## Multi-Model Résumé Surface Comparative Audit, MARA Registry & HTML Surfaces

---

## Source A — Frame Analysis (Technical Text)

---

### Multi-Model Résumé Surface Comparative Audit: Strategic Evaluation of PDF Writing Geometries

#### 1. Document Inventory and Origin Tracking

The strategic importance of establishing a rigorous design inventory lies in the requirement to treat every résumé surface not as a visual template, but as a fixed, deterministic writing budget. In automated content systems, precise original attribution and system compatibility are non-negotiable; they ensure that candidate "DNA"—the discrete data points of a professional history—is projected into a geometry that supports its specific volume without violating PDF constraints.

The following inventory captures every distinct résumé surface identified across the Meta, Claude, KIMI, and Gemini source families. Note that while GLM was referenced in prior directives, it remains absent from the provided source context; this audit recognizes the omission of GLM as a defined limitation.

| Design Identifier | Originating Model | Declared Density Class | Format | Header/Footer Status |
|---|---|---|---|---|
| D1 to D7 | Claude | Minimum to High | One-page first | Excluded from capacity |
| S1 to S7 | KIMI | Minimum to High | One-page (Letter) | Excluded from capacity |
| MIN-01 to HIGH-02 | Meta | Minimum to High | One-page first | Excluded from capacity |
| Precision | Gemini | Minimum | One-page | Excluded from capacity |
| Contextual | Gemini | Moderate | One-page | Excluded from capacity |
| Thesis | Gemini | High | One-page | Excluded from capacity |
| Integrated | Gemini | Integrated | Two-page | Excluded from capacity |

This array demonstrates a significant diversity of layout configurations—from the monolithic single-column "Atrium" (MIN-01) to the fragmented "Triple Rail Editorial" (HIGH-02). This diversity directly dictates candidate branding: a sparse profile in a high-density grid appears deficient, while an executive profile in a low-density frame leads to catastrophic wrapping. Successful implementation requires the technical normalization of these disparate writing geometries.

#### 2. Capacity Normalization and Metric Standardization

Normalizing metrics across disparate models is the only path to a "ground truth" for evidence-bearing real estate. Discrepancies abound in source methodologies: Meta defines containers in inches (e.g., 6.3" x 5.9"), whereas KIMI provides raw point values (e.g., 468pt x 187pt). To achieve architectural parity, all designs must be evaluated through the lens of usable lines and comfortable character capacity.

The following capacity maps establish the writing budget for primary designs:

| Design ID | Usable Lines per Container | Total Usable Lines | Comfortable CPL | Total Comfortable Capacity |
|---|---|---|---|---|
| D6 | A:48, B:40, C:48 | 136 | 24–48 | 4,464 chars |
| S7 | A:3, B:24, C:2, D:9, E:9, F:4 | 51 | 59–122 | 5,088 chars |
| HIGH-01 | A:17, B:17, C:16, D:32, E:23 | 105 | 38–64 | 5,420 chars |
| Thesis | A:5, B:12, C:12, D:5 | 34 | 90 | 3,060 chars |
| D1 | A:3, B:9, C:22 | 34 | 31–93 | 2,604 chars |
| MIN-01 | A:5, B:24 | 29 | 72 | 2,088 chars |
| Integrated | P1:33, P2:37 | 70 | 60 | 4,200 chars |

A primary differentiator in physical credibility is the measurement methodology. Claude utilizes Adobe Font Metrics (AFM) stringWidth logic with a variable "Comfortable-Fit" safety factor (0.91 for Helvetica, 0.93 for Times). KIMI similarly uses Measured Mean Glyph Advance (e.g., 4.422 pt/char for 11pt Liberation Serif) with a 0.92 derating factor. These safety factors serve a critical engineering purpose: they absorb word-wrap losses and "ragged-right" slack, preventing non-professional text crowding at container boundaries. These normalized metrics will now be applied to test the physical credibility of each claimed geometry.

#### 3. Capacity Credibility and Geometric Physicality

Every claimed writing capacity must be reconciled with the hard physical constraints of the US Letter surface (612pt x 792pt). When high-capacity claims approach the limits of the surface, they often sacrifice professional aesthetics for data volume.

Scrutiny is required for KIMI's S7 "LEDGER GRID" (5,088 chars) and Meta's HIGH-01 "Dense Dual Grid" (5,420 chars). To achieve these budgets, margins are aggressively reduced to 26pt (0.36") and 25.2pt (0.35") respectively. The "So What?" of this reduction is clear: such narrow margins encroach upon printer-safe "quiet zones" and risk a cluttered, "inflated" appearance. In contrast, Claude's D-series maintains higher aesthetic stability by utilizing AFM-derived metrics that respect the actual physical widths of characters, ensuring readability over raw compression.

Designs like Meta's MIN-01 "Atrium" represent the opposite pole; their 1.1" margins are intentionally "wasteful" with white space to make sparse evidence look curated rather than deficient. The audit must prioritize designs where capacity is derived from real font metrics, ensuring the artifact survives the transition to a rendered PDF without structural degradation.

#### 4. PDF Fitness and Structural Stability

PDF generation requires deterministic geometry where reflow and responsive behaviors are strictly prohibited. A surface must be stable, with containers possessing predictable (x, y, w, h) boundaries.

In evaluating PDF fitness, the following structural risks were identified:

- **Predictable Boundaries:** The Claude D-series and KIMI S-series provide the highest stability, using fixed-point geometries for all containers.
- **Expansion Logic:** Claude's "one-page-first" model is the gold standard for controlled growth, designating specific containers as "growth points" to manage page breaks logically.
- **Geometric Complexity:** Meta's MOD-03 "Masonry Stack" introduces significant risk. Its horizontal-to-vertical-to-horizontal allocation is visually attractive in wireframes but presents a higher failure rate for automated projection compared to simple linear or rail-based flows.

Machine usability—the ease with which a system can map candidate "DNA" to a writing budget—is highest in designs with semantically distinct containers (e.g., Gemini's "Integrated" Rail). We will now analyze performance across specific evidence profiles.

#### 5. Minimum-Density Performance (Thin Evidence)

The challenge for minimum-density surfaces is fill-ratio management—preventing an "empty region" effect when candidate data is sparse.

**Performance Ranking:**

1. **Meta MIN-01 "Atrium":** Ranked #1 for its "prominence chamber" and 1.1" margins, which frame minimal text as a premium, curated profile.
2. **KIMI S1 "Monolith":** Highly effective due to its scale; broad, airy containers fill the page with only 22 total lines of evidence.
3. **Claude D1 "Statement-Led":** Successfully occupies space through a large narrative profile section (78.6% of body capacity).

While Gemini's "Precision" surface is aesthetically sharp, its total capacity of 1,088 characters makes it a niche tool for ultra-minimalist profiles, ranking lower than MIN-01 or S1 in general-purpose utility for early-career candidates.

#### 6. Moderate-Density Performance (Standard Evidence)

Moderate-density surfaces require a balance of placement flexibility and container weight for mid-level professionals.

Key architectural differentiators include:

- **Horizontal Stratification:** KIMI S5 "Strata" uses stacked full-width bands of unequal height. This avoids column rigidity and is the strongest choice for candidates with varied project-based histories.
- **Asymmetric Rails:** Meta MOD-02 and Claude D4 utilize a dominant primary field for narrative evidence paired with a supporting "rail" for scannable data (skills/certs). This prevents "ragged" whitespace in the primary field.
- **Container Equilibrium:** Claude D3 "Balanced Two-Column" and Meta MOD-01 provide equal-weight containers, ensuring that neither the experience nor the skill section appears overcrowded.

These designs resist the "cramming" associated with higher densities while providing a robust writing budget of approximately 2,500 to 3,700 characters.

#### 7. Strategic Decision Matrix and Disposition

This matrix exposes the trade-offs of all evaluated surfaces to inform final architectural selection. "Combined Designs" are prohibited; all entries represent unique standalone geometries.

| Design ID | Model | Density | Page | Total Lines | Total Capacity | PDF Fitness | Readability | Recommended Disposition |
|---|---|---|---|---|---|---|---|---|
| D1 | Claude | MIN | 1 | 34 | 2,604 | High | High | RETAIN CANDIDATE |
| D2 | Claude | MIN | 1 | 63 | 2,842 | High | High | RETAIN CANDIDATE |
| D3 | Claude | MOD | 1 | 80 | 3,666 | High | High | RETAIN CANDIDATE |
| D4 | Claude | MOD | 1 | 66 | 3,204 | High | High | RETAIN CANDIDATE |
| D5 | Claude | MOD | 1 | 66 | 3,290 | High | High | RETAIN CANDIDATE |
| D6 | Claude | HIGH | 1 | 136 | 4,464 | High | Med | RETAIN FOR UNIQUE FEATURE |
| D7 | Claude | HIGH | 1 | 94 | 4,282 | High | High | RETAIN CANDIDATE |
| S1 | KIMI | MIN | 1 | 22 | 2,134 | High | High | RETAIN CANDIDATE |
| S2 | KIMI | MIN | 1 | 47 | 2,279 | High | High | RETAIN CANDIDATE |
| S3 | KIMI | MOD | 1 | 60 | 3,360 | High | High | RETAIN CANDIDATE |
| S4 | KIMI | MOD | 1 | 39 | 3,759 | High | High | RETAIN CANDIDATE |
| S5 | KIMI | MOD | 1 | 42 | 3,561 | High | High | RETAIN CANDIDATE |
| S6 | KIMI | HIGH | 1 | 78 | 4,756 | High | Med | RETAIN FOR UNIQUE FEATURE |
| S7 | KIMI | HIGH | 1 | 51 | 5,088 | Medium | Medium | REQUIRES GEOMETRY REVALIDATION |
| MIN-01 | Meta | MIN | 1 | 29 | 2,088 | High | High | RETAIN CANDIDATE |
| MIN-02 | Meta | MIN | 1 | 24 | 1,824 | High | High | REDUNDANT |
| MOD-01 | Meta | MOD | 1 | 70 | 3,080 | High | High | RETAIN CANDIDATE |
| MOD-02 | Meta | MOD | 1 | 70 | 3,010 | High | High | RETAIN CANDIDATE |
| MOD-03 | Meta | MOD | 1 | 54 | 2,778 | Medium | High | REQUIRES GEOMETRY REVALIDATION |
| HIGH-01 | Meta | HIGH | 1 | 105 | 5,420 | Medium | Low | REQUIRES GEOMETRY REVALIDATION |
| HIGH-02 | Meta | HIGH | 1 | 108 | 4,544 | High | Medium | RETAIN FOR UNIQUE FEATURE |
| Precision | Gemini | MIN | 1 | 16 | 1,088 | High | High | RETAIN CANDIDATE |
| Contextual | Gemini | MOD | 1 | 27 | 2,160 | High | High | RETAIN CANDIDATE |
| Thesis | Gemini | HIGH | 1 | 34 | 3,060 | High | High | RETAIN CANDIDATE |
| Integrated | Gemini | INT | 2 | 70 | 4,200 | High | High | RETAIN FOR UNIQUE FEATURE |

> This audit serves as the final tool for human designers to align candidate evidence volume with a mathematically capable physical surface.

---

### Technical Audit and Comparative Analysis of Résumé Surface Geometries

#### 1. Design Authority and Inventory Matrix

In the engineering of fixed-document systems, the "design authority" serves as the final arbiter of structural integrity. Establishing a centralized design authority is essential to prevent "geometric drift"—the cumulative loss of layout precision that occurs when models generate content based on visual approximations rather than deterministic geometric constraints. Without this authority, minor discrepancies in font metric calculations (such as stringWidth variance) trigger "line-wrapping cascades," where a single character overflow in a high-density container forces a re-pagination event that destabilizes the entire document surface. A standardized inventory ensures cross-model reliability, providing a predictable budget for candidate evidence regardless of the generative engine.

**Global Design Inventory**

| Design Identifier | Originating Model | Declared Density Class | Layout Configuration | Capacity Specification Status |
|---|---|---|---|---|
| D1—D2 | Claude | Minimum | Single Column / Ident-Band | Exact (ReportLab AFM metrics) |
| D3—D5 | Claude | Moderate | Twin / Dominant / Banded | Exact (ReportLab AFM metrics) |
| D6—D7 | Claude | High | Three-Col / Full-Bleed | Exact (ReportLab AFM metrics) |
| S1—S2 | KIMI | Minimum | Monolith / Offset Rail | Measured (Glyph advance width) |
| S3—S5 | KIMI | Moderate | Twin / Sovereign / Strata | Measured (Glyph advance width) |
| S6—S7 | KIMI | High | Meridian / Ledger Grid | Measured (Glyph advance width) |
| MIN-01 | META | Minimum | Atrium (Centered Monolith) | Deterministic mapping (29-line spec) |
| MIN-02 | META | Minimum | Horizon Bands | Deterministic mapping |
| MOD-01 | META | Moderate | Balanced Columns (35/65) | Deterministic mapping |
| MOD-02 | META | Moderate | Dominant + Rail (68/32) | Deterministic mapping |
| MOD-03 | META | Moderate | Masonry Stack | Deterministic mapping |
| HIGH-01 | META | High | Dense Dual Grid (38/62) | Deterministic mapping |
| HIGH-02 | META | High | Triple Rail Editorial | Deterministic mapping |

These diverse architectures provide the foundational geometric bounds required to normalize evidence capacity, moving beyond aesthetic templates toward measurable writing surfaces. To maintain technical transparency, this audit utilizes the META sub-specification for MIN-01 (29 lines / 2,088 chars) as the primary benchmark for the Atrium design.

#### 2. Capacity Normalization and Evidence Real Estate

Raw line counts are a deceptive metric in document systems engineering. A line in a narrow rail (e.g., the 21 CPL tracks in HIGH-02) holds significantly less evidence value than a line in a full-width experience container. To achieve true normalization, we utilize "Comfortable Character Capacity" (CCC). This metric accounts for specific font metrics and a safety "comfort factor" to ensure reported capacity represents what professional prose can occupy without triggering abnormal wrapping.

**Full Matrix: Normalized Surface Comparison**

| Design Identifier | Usable Evidence Lines | Primary CPL (Comfortable) | Total Comfortable CCC | Primary Container % |
|---|---|---|---|---|
| D1 | 34 | 93 | 2,604 | 78.6% |
| D6 | 136 | 48 (Var: 24/29/48) | 4,464 | 43.0% |
| D7 | 94 | 70 | 4,282 | 65.4% |
| S1 | 22 | 97 | 2,134 | 45.5% |
| S3 | 60 | 56 | 3,360 | 23.3% |
| S7 | 51 | 122 | 5,088 | 57.5% |
| MIN-01 | 29 | 72 | 2,088 | 82.8% |
| MIN-02 | 24 | 76 | 1,824 | 62.5% |
| MOD-01 | 70 | 58 | 3,080 | 43.3% |
| MOD-02 | 70 | 58 | 3,010 | 67.4% |
| MOD-03 | 54 | 88 | 2,778 | 31.0% |
| HIGH-01 | 105 | 64 | 5,420 | 37.8% |
| HIGH-02 | 108 | 58 (Rail: 21) | 4,544 | 40.8% |

**Critical Analysis of Incompatible Metrics**

A critical discrepancy exists in "comfort factor" application. Claude applies a variable safety (0.91 for Helvetica / 0.93 for Times), whereas KIMI utilizes a flat 0.92 across the S-series. For a 5,000-character high-density document, a 0.02 variance in the comfort factor creates a 100-character "ghost capacity." This margin of error is sufficient to cause catastrophic text-overflow in automated rendering. Furthermore, multi-column designs like D6 exhibit extreme CPL variability (24 CPL in Sidebar A vs 48 CPL in Experience B), meaning "average" CCC can obscure the fact that short-form data is required in over 50% of the usable containers.

#### 3. Capacity Credibility and PDF Fitness Audit

The "Credibility Gap" represents the tension between high-density claims and professional legibility on a fixed 612pt x 792pt surface. While a design may mathematically support 5,000+ characters, the resulting visual density often violates the legibility floor.

**Physical Credibility Critique**

- **Typography Floors:** The High-Density array pushes the boundaries of readability. HIGH-02 drops the body size to 8.5pt/11pt leading, while S7 utilizes 9.5pt at a tight 12.2pt leading. These specs approach the limit of professional PDF fitness, where any rendering variance will result in character collision.
- **Margin Stress:** S7 utilizes aggressive 0.36in (26pt) margins, the narrowest in the inventory. This creates a "crowded" aesthetic that lacks the anchoring provided by the 1.1in (79.2pt) margins in MIN-01.
- **Structural Load:** D6 carries the highest line count in the inventory at 136 lines. This extreme density, spread across three vertical tracks, renders the document structurally unstable; it leaves zero vertical "slack" for the automated placement of data, making it prone to ragged alignment failures.

**PDF Fitness Assessment**

The most reliable designs are MOD-01 and D4, which maintain 0.6in to 0.75in margins and avoid the "full-bleed" risks of the high-density class. Conversely, S7 is a "high-risk" surface; its 96% container fill ratio is geometrically brittle, depending entirely on precise character-width math that rarely survives standard PDF rendering across diverse viewer engines.

#### 4. Minimum-Density Performance Ranking

Minimum-density surfaces must solve the "Thin Evidence Problem," ensuring sparse data appears as a curated strategic choice rather than a lack of history.

**Ranked Minimum-Density Surfaces**

1. **S1 Monolith:** The premier performer. By using "monument" containers and 1-inch uniform margins, it achieves prominence through scale. It resists "empty region" syndrome by expanding container widths to fill the horizontal axis.
2. **MIN-01 Atrium:** Succeeds via extreme whitespace (1.1in margins). It creates a "prominence chamber" for the candidate, making a 3-line positioning statement feel like a high-value executive summary.
3. **D1 Statement-Led:** Effective for narrative-heavy transitions. It assigns 78.6% of its CCC to the "Professional Narrative" container, allowing a career story to breathe without fragmentation.

#### 5. Moderate-Density Performance Ranking

Moderate density provides the "General-Purpose Standard" critical for mid-career professionals where balance between narrative and metrics is required.

**Ranked Moderate-Density Surfaces**

1. **S3 Twin Ledger:** Appraises the most balanced distribution. Utilizing equal-width columns allows for parallel timelines (e.g., Technical vs. Management) to carry equal weight without a dominant bias.
2. **D4 Dominant Primary:** Determines high flexibility for candidates with one major career pillar. It allocates 62% of the body to experience, while the sidebar handles supporting credentials without visual overcrowding.
3. **MOD-01 Balanced:** Critiques show this as the reliable baseline. Its 35/65 split resists the "claustrophobia" of high-density designs while providing enough tracks for a standard mid-level skillset.

#### 6. Failure Modes and Geometric Weaknesses

A "Failure of Intent" occurs when geometric choices compromise the document's utility for specific candidate profiles.

- **Unrealistic Capacity:** HIGH-01 and HIGH-02 claim the highest capacities (>4,500 chars) but achieve this by dropping to 8.5pt–9.5pt type. This leads to a document that fails the "arm's length" readability test.
- **Structural Instability:** D6 (Three-Column Dense) suffers from "Ragged Alignment" risk. Because it uses three parallel vertical tracks, any imbalance in the narrative length between columns creates a disjointed horizontal rhythm that appears broken to the human eye.
- **Column Constraints:** The 21 CPL rails in HIGH-02 and 22 CPL rails in MIN-02 are poor at accommodating standard chronological history. Long organization names or role titles (e.g., "Director of International Operations") will cause excessive 3-line wrapping, destroying the intended container height and causing a page-flow failure.

#### 7. Component Excellence: Best Practices Across Models

- **Best Use of Space:** S7 Ledger Grid (KIMI). Its central two-column grid for repeated, compact slots (Projects/Leadership) maximizes vertical real estate without wasting column width.
- **Best Capacity-Accounting Method:** D-Series (Claude). The use of ReportLab AFM (Adobe Font Metrics) stringWidth math provides the most reliable fit calculation by accounting for individual glyph widths.
- **Best Strategy for Uneven Evidence:** MOD-02 (META). The use of "internal cards" within a dominant field allows for discrete evidence clusters that handle varied data lengths with high aesthetic stability.
- **Best Machine-Readable Specification:** S-Series (KIMI). Provides clear JSON-style "restrictions" (e.g., "One credential per line," "Prose fragments only") essential for deterministic automated data placement.

#### 8. Cross-Model Comparative Rankings

**I. Visual Geometry Quality (Aesthetic Professionalism)**

1. S1 Monolith: Best-in-class use of airy, intentional whitespace.
2. MIN-01 Atrium: Creates a "premium" curated executive look.
3. D5 Horizontal Banded: Superior modern stratification.

**II. PDF Reliability (Stability of Fixed Surface)**

1. MOD-01 Balanced: The safest geometric bet for automated rendering.
2. D4 Dominant Primary: Robust container boundaries that resist wrapping cascades.
3. S3 Twin Ledger: Predictable, symmetrical column rhythm.

**III. Capacity Efficiency (Usable Space Ratio)**

1. HIGH-01 Dense Dual Grid: Highest prose density at 5,420 characters.
2. S7 Ledger Grid: 96% container fill ratio; maximum real estate usage.
3. D6 Three-Column Dense: Highest line count (136) in the inventory.

**IV. Machine-Placement Usability (Boundary Clarity)**

1. D1 Single Column: Lowest complexity for data-to-container mapping.
2. S2 Offset Rail: Clearly defined roles for rail vs. main body.
3. MOD-03 Masonry: Modular "slots" simplify the filling of parallel data types.

**V. Evidence Flexibility (Candidate DNA Performance)**

1. S3 Twin Ledger: Perfectly handles dual-strand experience timelines.
2. HIGH-02 Triple Rail: Best for "Deep Data" candidates (Patents + Publications + Narrative).
3. D2 Identity Band: Optimized for candidates leading with a heavy achievement snapshot.

> **Final Statement:** This audit establishes a Deterministic Spectrum for document generation. By scaling from the 1,824-character budget of MIN-02 to the 5,420-character density of HIGH-01, the system enables a 2.97x range of evidence projection. This mathematical range ensures that candidate data is projected onto a surface specifically engineered for its volume, preventing both the dilution of sparse evidence and the crushing of dense histories.

---

### Technical Audit and Decision Matrix: PDF Résumé Design Surface Array

#### 1. Design Surface Inventory and Origin Analysis

In a deterministic writing system, a standardized design inventory is the fundamental substrate for information engineering. By mapping candidate evidence to fixed geometric coordinate systems, we eliminate the unpredictability of "visual templating." This audit synthesizes the D-Series (Claude), S-Series (KIMI), and Alphanumeric-Series (Gemini) authorities into a single, addressable array. Each surface is evaluated as a fixed-coordinate map where container boundaries are immutable.

| Design ID | Originating Model | Declared Density Class | Format | Layout Configuration | Body Containers | Reproducibility Status |
|---|---|---|---|---|---|---|
| D1 | Claude | Minimum | 1-Page | Statement-Led Single Column | 3 | Deterministic / Fixed |
| D2 | Claude | Minimum | 1-Page | IdentityUnderstood — **GO** triggered, finalizing Vol 2, then closing the session with **END**.

---

**Integrity Snapshot:**

| Metric | Value |
|--------|-------|
| Blocks received | 4 |
| Blocks emitted | 4 |
| Mismatch | None |

---

<artifact id="390f4137-9dda-48c9-9efd-2824ba57578d" title="Build Spec — Vol 2: Multi-Model Résumé Surface Comparative Audit" type="text" path="artifacts/390f4137-9dda-48c9-9efd-2824ba57578d.md">
# Build Spec — Vol 2
## Multi-Model Résumé Surface Comparative Audit

---

## Source A — Frame Analysis (Technical Text)

---

### Multi-Model Résumé Surface Comparative Audit: Strategic Evaluation of PDF Writing Geometries

#### 1. Document Inventory and Origin Tracking

The strategic importance of establishing a rigorous design inventory lies in the requirement to treat every résumé surface not as a visual template, but as a fixed, deterministic writing budget. In automated content systems, precise original attribution and system compatibility are non-negotiable; they ensure that candidate "DNA"—the discrete data points of a professional history—is projected into a geometry that supports its specific volume without violating PDF constraints.

The following inventory captures every distinct résumé surface identified across the Meta, Claude, KIMI, and Gemini source families. Note that while GLM was referenced in prior directives, it remains absent from the provided source context; this audit recognizes the omission of GLM as a defined limitation.

| Design Identifier | Originating Model | Declared Density Class | Format | Header/Footer Status |
|---|---|---|---|---|
| D1 to D7 | Claude | Minimum to High | One-page first | Excluded from capacity |
| S1 to S7 | KIMI | Minimum to High | One-page (Letter) | Excluded from capacity |
| MIN-01 to HIGH-02 | Meta | Minimum to High | One-page first | Excluded from capacity |
| Precision | Gemini | Minimum | One-page | Excluded from capacity |
| Contextual | Gemini | Moderate | One-page | Excluded from capacity |
| Thesis | Gemini | High | One-page | Excluded from capacity |
| Integrated | Gemini | Integrated | Two-page | Excluded from capacity |

This array demonstrates a significant diversity of layout configurations—from the monolithic single-column "Atrium" (MIN-01) to the fragmented "Triple Rail Editorial" (HIGH-02). This diversity directly dictates candidate branding: a sparse profile in a high-density grid appears deficient, while an executive profile in a low-density frame leads to catastrophic wrapping. Successful implementation requires the technical normalization of these disparate writing geometries.

#### 2. Capacity Normalization and Metric Standardization

Normalizing metrics across disparate models is the only path to a "ground truth" for evidence-bearing real estate. Discrepancies abound in source methodologies: Meta defines containers in inches (e.g., 6.3" x 5.9"), whereas KIMI provides raw point values (e.g., 468pt x 187pt). To achieve architectural parity, all designs must be evaluated through the lens of usable lines and comfortable character capacity.

The following capacity maps establish the writing budget for primary designs:

| Design ID | Usable Lines per Container | Total Usable Lines | Comfortable CPL | Total Comfortable Capacity |
|---|---|---|---|---|
| D6 | A:48, B:40, C:48 | 136 | 24–48 | 4,464 chars |
| S7 | A:3, B:24, C:2, D:9, E:9, F:4 | 51 | 59–122 | 5,088 chars |
| HIGH-01 | A:17, B:17, C:16, D:32, E:23 | 105 | 38–64 | 5,420 chars |
| Thesis | A:5, B:12, C:12, D:5 | 34 | 90 | 3,060 chars |
| D1 | A:3, B:9, C:22 | 34 | 31–93 | 2,604 chars |
| MIN-01 | A:5, B:24 | 29 | 72 | 2,088 chars |
| Integrated | P1:33, P2:37 | 70 | 60 | 4,200 chars |

A primary differentiator in physical credibility is the measurement methodology. Claude utilizes Adobe Font Metrics (AFM) stringWidth logic with a variable "Comfortable-Fit" safety factor (0.91 for Helvetica, 0.93 for Times). KIMI similarly uses Measured Mean Glyph Advance (e.g., 4.422 pt/char for 11pt Liberation Serif) with a 0.92 derating factor. These safety factors serve a critical engineering purpose: they absorb word-wrap losses and "ragged-right" slack, preventing non-professional text crowding at container boundaries. These normalized metrics will now be applied to test the physical credibility of each claimed geometry.

#### 3. Capacity Credibility and Geometric Physicality

Every claimed writing capacity must be reconciled with the hard physical constraints of the US Letter surface (612pt x 792pt). When high-capacity claims approach the limits of the surface, they often sacrifice professional aesthetics for data volume.

Scrutiny is required for KIMI's S7 "LEDGER GRID" (5,088 chars) and Meta's HIGH-01 "Dense Dual Grid" (5,420 chars). To achieve these budgets, margins are aggressively reduced to 26pt (0.36") and 25.2pt (0.35") respectively. The "So What?" of this reduction is clear: such narrow margins encroach upon printer-safe "quiet zones" and risk a cluttered, "inflated" appearance. In contrast, Claude's D-series maintains higher aesthetic stability by utilizing AFM-derived metrics that respect the actual physical widths of characters, ensuring readability over raw compression.

Designs like Meta's MIN-01 "Atrium" represent the opposite pole; their 1.1" margins are intentionally "wasteful" with white space to make sparse evidence look curated rather than deficient. The audit must prioritize designs where capacity is derived from real font metrics, ensuring the artifact survives the transition to a rendered PDF without structural degradation.

#### 4. PDF Fitness and Structural Stability

PDF generation requires deterministic geometry where reflow and responsive behaviors are strictly prohibited. A surface must be stable, with containers possessing predictable (x, y, w, h) boundaries.

In evaluating PDF fitness, the following structural risks were identified:

- **Predictable Boundaries:** The Claude D-series and KIMI S-series provide the highest stability, using fixed-point geometries for all containers.
- **Expansion Logic:** Claude's "one-page-first" model is the gold standard for controlled growth, designating specific containers as "growth points" to manage page breaks logically.
- **Geometric Complexity:** Meta's MOD-03 "Masonry Stack" introduces significant risk. Its horizontal-to-vertical-to-horizontal allocation is visually attractive in wireframes but presents a higher failure rate for automated projection compared to simple linear or rail-based flows.

Machine usability—the ease with which a system can map candidate "DNA" to a writing budget—is highest in designs with semantically distinct containers (e.g., Gemini's "Integrated" Rail). We will now analyze performance across specific evidence profiles.

#### 5. Minimum-Density Performance (Thin Evidence)

The challenge for minimum-density surfaces is fill-ratio management—preventing an "empty region" effect when candidate data is sparse.

**Performance Ranking:**

1. **Meta MIN-01 "Atrium":** Ranked #1 for its "prominence chamber" and 1.1" margins, which frame minimal text as a premium, curated profile.
2. **KIMI S1 "Monolith":** Highly effective due to its scale; broad, airy containers fill the page with only 22 total lines of evidence.
3. **Claude D1 "Statement-Led":** Successfully occupies space through a large narrative profile section (78.6% of body capacity).

While Gemini's "Precision" surface is aesthetically sharp, its total capacity of 1,088 characters makes it a niche tool for ultra-minimalist profiles, ranking lower than MIN-01 or S1 in general-purpose utility for early-career candidates.

#### 6. Moderate-Density Performance (Standard Evidence)

Moderate-density surfaces require a balance of placement flexibility and container weight for mid-level professionals.

Key architectural differentiators include:

- **Horizontal Stratification:** KIMI S5 "Strata" uses stacked full-width bands of unequal height. This avoids column rigidity and is the strongest choice for candidates with varied project-based histories.
- **Asymmetric Rails:** Meta MOD-02 and Claude D4 utilize a dominant primary field for narrative evidence paired with a supporting "rail" for scannable data (skills/certs). This prevents "ragged" whitespace in the primary field.
- **Container Equilibrium:** Claude D3 "Balanced Two-Column" and Meta MOD-01 provide equal-weight containers, ensuring that neither the experience nor the skill section appears overcrowded.

These designs resist the "cramming" associated with higher densities while providing a robust writing budget of approximately 2,500 to 3,700 characters.

#### 7. Strategic Decision Matrix and Disposition

This matrix exposes the trade-offs of all evaluated surfaces to inform final architectural selection. "Combined Designs" are prohibited; all entries represent unique standalone geometries.

| Design ID | Model | Density | Page | Total Lines | Total Capacity | PDF Fitness | Readability | Recommended Disposition |
|---|---|---|---|---|---|---|---|---|
| D1 | Claude | MIN | 1 | 34 | 2,604 | High | High | RETAIN CANDIDATE |
| D2 | Claude | MIN | 1 | 63 | 2,842 | High | High | RETAIN CANDIDATE |
| D3 | Claude | MOD | 1 | 80 | 3,666 | High | High | RETAIN CANDIDATE |
| D4 | Claude | MOD | 1 | 66 | 3,204 | High | High | RETAIN CANDIDATE |
| D5 | Claude | MOD | 1 | 66 | 3,290 | High | High | RETAIN CANDIDATE |
| D6 | Claude | HIGH | 1 | 136 | 4,464 | High | Med | RETAIN FOR UNIQUE FEATURE |
| D7 | Claude | HIGH | 1 | 94 | 4,282 | High | High | RETAIN CANDIDATE |
| S1 | KIMI | MIN | 1 | 22 | 2,134 | High | High | RETAIN CANDIDATE |
| S2 | KIMI | MIN | 1 | 47 | 2,279 | High | High | RETAIN CANDIDATE |
| S3 | KIMI | MOD | 1 | 60 | 3,360 | High | High | RETAIN CANDIDATE |
| S4 | KIMI | MOD | 1 | 39 | 3,759 | High | High | RETAIN CANDIDATE |
| S5 | KIMI | MOD | 1 | 42 | 3,561 | High | High | RETAIN CANDIDATE |
| S6 | KIMI | HIGH | 1 | 78 | 4,756 | High | Med | RETAIN FOR UNIQUE FEATURE |
| S7 | KIMI | HIGH | 1 | 51 | 5,088 | Medium | Medium | REQUIRES GEOMETRY REVALIDATION |
| MIN-01 | Meta | MIN | 1 | 29 | 2,088 | High | High | RETAIN CANDIDATE |
| MIN-02 | Meta | MIN | 1 | 24 | 1,824 | High | High | REDUNDANT |
| MOD-01 | Meta | MOD | 1 | 70 | 3,080 | High | High | RETAIN CANDIDATE |
| MOD-02 | Meta | MOD | 1 | 70 | 3,010 | High | High | RETAIN CANDIDATE |
| MOD-03 | Meta | MOD | 1 | 54 | 2,778 | Medium | High | REQUIRES GEOMETRY REVALIDATION |
| HIGH-01 | Meta | HIGH | 1 | 105 | 5,420 | Medium | Low | REQUIRES GEOMETRY REVALIDATION |
| HIGH-02 | Meta | HIGH | 1 | 108 | 4,544 | High | Medium | RETAIN FOR UNIQUE FEATURE |
| Precision | Gemini | MIN | 1 | 16 | 1,088 | High | High | RETAIN CANDIDATE |
| Contextual | Gemini | MOD | 1 | 27 | 2,160 | High | High | RETAIN CANDIDATE |
| Thesis | Gemini | HIGH | 1 | 34 | 3,060 | High | High | RETAIN CANDIDATE |
| Integrated | Gemini | INT | 2 | 70 | 4,200 | High | High | RETAIN FOR UNIQUE FEATURE |

> This audit serves as the final tool for human designers to align candidate evidence volume with a mathematically capable physical surface.

---

### Technical Audit and Comparative Analysis of Résumé Surface Geometries

#### 1. Design Authority and Inventory Matrix

In the engineering of fixed-document systems, the "design authority" serves as the final arbiter of structural integrity. Establishing a centralized design authority is essential to prevent "geometric drift"—the cumulative loss of layout precision that occurs when models generate content based on visual approximations rather than deterministic geometric constraints. Without this authority, minor discrepancies in font metric calculations (such as stringWidth variance) trigger "line-wrapping cascades," where a single character overflow in a high-density container forces a re-pagination event that destabilizes the entire document surface. A standardized inventory ensures cross-model reliability, providing a predictable budget for candidate evidence regardless of the generative engine.

**Global Design Inventory**

| Design Identifier | Originating Model | Declared Density Class | Layout Configuration | Capacity Specification Status |
|---|---|---|---|---|
| D1—D2 | Claude | Minimum | Single Column / Ident-Band | Exact (ReportLab AFM metrics) |
| D3—D5 | Claude | Moderate | Twin / Dominant / Banded | Exact (ReportLab AFM metrics) |
| D6—D7 | Claude | High | Three-Col / Full-Bleed | Exact (ReportLab AFM metrics) |
| S1—S2 | KIMI | Minimum | Monolith / Offset Rail | Measured (Glyph advance width) |
| S3—S5 | KIMI | Moderate | Twin / Sovereign / Strata | Measured (Glyph advance width) |
| S6—S7 | KIMI | High | Meridian / Ledger Grid | Measured (Glyph advance width) |
| MIN-01 | META | Minimum | Atrium (Centered Monolith) | Deterministic mapping (29-line spec) |
| MIN-02 | META | Minimum | Horizon Bands | Deterministic mapping |
| MOD-01 | META | Moderate | Balanced Columns (35/65) | Deterministic mapping |
| MOD-02 | META | Moderate | Dominant + Rail (68/32) | Deterministic mapping |
| MOD-03 | META | Moderate | Masonry Stack | Deterministic mapping |
| HIGH-01 | META | High | Dense Dual Grid (38/62) | Deterministic mapping |
| HIGH-02 | META | High | Triple Rail Editorial | Deterministic mapping |

These diverse architectures provide the foundational geometric bounds required to normalize evidence capacity, moving beyond aesthetic templates toward measurable writing surfaces. To maintain technical transparency, this audit utilizes the META sub-specification for MIN-01 (29 lines / 2,088 chars) as the primary benchmark for the Atrium design.

#### 2. Capacity Normalization and Evidence Real Estate

Raw line counts are a deceptive metric in document systems engineering. A line in a narrow rail (e.g., the 21 CPL tracks in HIGH-02) holds significantly less evidence value than a line in a full-width experience container. To achieve true normalization, we utilize "Comfortable Character Capacity" (CCC). This metric accounts for specific font metrics and a safety "comfort factor" to ensure reported capacity represents what professional prose can occupy without triggering abnormal wrapping.

**Full Matrix: Normalized Surface Comparison**

| Design Identifier | Usable Evidence Lines | Primary CPL (Comfortable) | Total Comfortable CCC | Primary Container % |
|---|---|---|---|---|
| D1 | 34 | 93 | 2,604 | 78.6% |
| D6 | 136 | 48 (Var: 24/29/48) | 4,464 | 43.0% |
| D7 | 94 | 70 | 4,282 | 65.4% |
| S1 | 22 | 97 | 2,134 | 45.5% |
| S3 | 60 | 56 | 3,360 | 23.3% |
| S7 | 51 | 122 | 5,088 | 57.5% |
| MIN-01 | 29 | 72 | 2,088 | 82.8% |
| MIN-02 | 24 | 76 | 1,824 | 62.5% |
| MOD-01 | 70 | 58 | 3,080 | 43.3% |
| MOD-02 | 70 | 58 | 3,010 | 67.4% |
| MOD-03 | 54 | 88 | 2,778 | 31.0% |
| HIGH-01 | 105 | 64 | 5,420 | 37.8% |
| HIGH-02 | 108 | 58 (Rail: 21) | 4,544 | 40.8% |

**Critical Analysis of Incompatible Metrics**

A critical discrepancy exists in "comfort factor" application. Claude applies a variable safety (0.91 for Helvetica / 0.93 for Times), whereas KIMI utilizes a flat 0.92 across the S-series. For a 5,000-character high-density document, a 0.02 variance in the comfort factor creates a 100-character "ghost capacity." This margin of error is sufficient to cause catastrophic text-overflow in automated rendering. Furthermore, multi-column designs like D6 exhibit extreme CPL variability (24 CPL in Sidebar A vs 48 CPL in Experience B), meaning "average" CCC can obscure the fact that short-form data is required in over 50% of the usable containers.

#### 3. Capacity Credibility and PDF Fitness Audit

The "Credibility Gap" represents the tension between high-density claims and professional legibility on a fixed 612pt x 792pt surface. While a design may mathematically support 5,000+ characters, the resulting visual density often violates the legibility floor.

**Physical Credibility Critique**

- **Typography Floors:** The High-Density array pushes the boundaries of readability. HIGH-02 drops the body size to 8.5pt/11pt leading, while S7 utilizes 9.5pt at a tight 12.2pt leading. These specs approach the limit of professional PDF fitness, where any rendering variance will result in character collision.
- **Margin Stress:** S7 utilizes aggressive 0.36in (26pt) margins, the narrowest in the inventory. This creates a "crowded" aesthetic that lacks the anchoring provided by the 1.1in (79.2pt) margins in MIN-01.
- **Structural Load:** D6 carries the highest line count in the inventory at 136 lines. This extreme density, spread across three vertical tracks, renders the document structurally unstable; it leaves zero vertical "slack" for the automated placement of data, making it prone to ragged alignment failures.

**PDF Fitness Assessment**

The most reliable designs are MOD-01 and D4, which maintain 0.6in to 0.75in margins and avoid the "full-bleed" risks of the high-density class. Conversely, S7 is a "high-risk" surface; its 96% container fill ratio is geometrically brittle, depending entirely on precise character-width math that rarely survives standard PDF rendering across diverse viewer engines.

#### 4. Minimum-Density Performance Ranking

Minimum-density surfaces must solve the "Thin Evidence Problem," ensuring sparse data appears as a curated strategic choice rather than a lack of history.

**Ranked Minimum-Density Surfaces**

1. **S1 Monolith:** The premier performer. By using "monument" containers and 1-inch uniform margins, it achieves prominence through scale. It resists "empty region" syndrome by expanding container widths to fill the horizontal axis.
2. **MIN-01 Atrium:** Succeeds via extreme whitespace (1.1in margins). It creates a "prominence chamber" for the candidate, making a 3-line positioning statement feel like a high-value executive summary.
3. **D1 Statement-Led:** Effective for narrative-heavy transitions. It assigns 78.6% of its CCC to the "Professional Narrative" container, allowing a career story to breathe without fragmentation.

#### 5. Moderate-Density Performance Ranking

Moderate density provides the "General-Purpose Standard" critical for mid-career professionals where balance between narrative and metrics is required.

**Ranked Moderate-Density Surfaces**

1. **S3 Twin Ledger:** Appraises the most balanced distribution. Utilizing equal-width columns allows for parallel timelines (e.g., Technical vs. Management) to carry equal weight without a dominant bias.
2. **D4 Dominant Primary:** Determines high flexibility for candidates with one major career pillar. It allocates 62% of the body to experience, while the sidebar handles supporting credentials without visual overcrowding.
3. **MOD-01 Balanced:** Critiques show this as the reliable baseline. Its 35/65 split resists the "claustrophobia" of high-density designs while providing enough tracks for a standard mid-level skillset.

#### 6. Failure Modes and Geometric Weaknesses

A "Failure of Intent" occurs when geometric choices compromise the document's utility for specific candidate profiles.

- **Unrealistic Capacity:** HIGH-01 and HIGH-02 claim the highest capacities (>4,500 chars) but achieve this by dropping to 8.5pt–9.5pt type. This leads to a document that fails the "arm's length" readability test.
- **Structural Instability:** D6 (Three-Column Dense) suffers from "Ragged Alignment" risk. Because it uses three parallel vertical tracks, any imbalance in the narrative length between columns creates a disjointed horizontal rhythm that appears broken to the human eye.
- **Column Constraints:** The 21 CPL rails in HIGH-02 and 22 CPL rails in MIN-02 are poor at accommodating standard chronological history. Long organization names or role titles (e.g., "Director of International Operations") will cause excessive 3-line wrapping, destroying the intended container height and causing a page-flow failure.

#### 7. Component Excellence: Best Practices Across Models

- **Best Use of Space:** S7 Ledger Grid (KIMI). Its central two-column grid for repeated, compact slots (Projects/Leadership) maximizes vertical real estate without wasting column width.
- **Best Capacity-Accounting Method:** D-Series (Claude). The use of ReportLab AFM (Adobe Font Metrics) stringWidth math provides the most reliable fit calculation by accounting for individual glyph widths.
- **Best Strategy for Uneven Evidence:** MOD-02 (META). The use of "internal cards" within a dominant field allows for discrete evidence clusters that handle varied data lengths with high aesthetic stability.
- **Best Machine-Readable Specification:** S-Series (KIMI). Provides clear JSON-style "restrictions" (e.g., "One credential per line," "Prose fragments only") essential for deterministic automated data placement.

#### 8. Cross-Model Comparative Rankings

**I. Visual Geometry Quality (Aesthetic Professionalism)**

1. S1 Monolith: Best-in-class use of airy, intentional whitespace.
2. MIN-01 Atrium: Creates a "premium" curated executive look.
3. D5 Horizontal Banded: Superior modern stratification.

**II. PDF Reliability (Stability of Fixed Surface)**

1. MOD-01 Balanced: The safest geometric bet for automated rendering.
2. D4 Dominant Primary: Robust container boundaries that resist wrapping cascades.
3. S3 Twin Ledger: Predictable, symmetrical column rhythm.

**III. Capacity Efficiency (Usable Space Ratio)**

1. HIGH-01 Dense Dual Grid: Highest prose density at 5,420 characters.
2. S7 Ledger Grid: 96% container fill ratio; maximum real estate usage.
3. D6 Three-Column Dense: Highest line count (136) in the inventory.

**IV. Machine-Placement Usability (Boundary Clarity)**

1. D1 Single Column: Lowest complexity for data-to-container mapping.
2. S2 Offset Rail: Clearly defined roles for rail vs. main body.
3. MOD-03 Masonry: Modular "slots" simplify the filling of parallel data types.

**V. Evidence Flexibility (Candidate DNA Performance)**

1. S3 Twin Ledger: Perfectly handles dual-strand experience timelines.
2. HIGH-02 Triple Rail: Best for "Deep Data" candidates (Patents + Publications + Narrative).
3. D2 Identity Band: Optimized for candidates leading with a heavy achievement snapshot.

> **Final Statement:** This audit establishes a Deterministic Spectrum for document generation. By scaling from the 1,824-character budget of MIN-02 to the 5,420-character density of HIGH-01, the system enables a 2.97x range of evidence projection. This mathematical range ensures that candidate data is projected onto a surface specifically engineered for its volume, preventing both the dilution of sparse evidence and the crushing of dense histories.

---

### Technical Audit and Decision Matrix: PDF Résumé Design Surface Array

#### 1. Design Surface Inventory and Origin Analysis

In a deterministic writing system, a standardized design inventory is the fundamental substrate for information engineering. By mapping candidate evidence to fixed geometric coordinate systems, we eliminate the unpredictability of "visual templating." This audit synthesizes the D-Series (Claude), S-Series (KIMI), and Alphanumeric-Series (Gemini) authorities into a single, addressable array. Each surface is evaluated as a fixed-coordinate map where container boundaries are immutable.

| Design ID | Originating Model | Declared Density Class | Format | Layout Configuration | Body Containers | Reproducibility Status |
|---|---|---|---|---|---|---|
| D1 | Claude | Minimum | 1-Page | Statement-Led Single Column | 3 | Deterministic / Fixed |
| D2 | Claude | Minimum | 1-Page | Identity Band + Highlights | 3 Groups | Deterministic / Fixed |
| D3 | Claude | Moderate | 1-Page | Balanced Two-Column | 2 Groups | Deterministic / Fixed |
| D4 | Claude | Moderate | 1-Page | Dominant Primary + Sidebar | 2 Groups | Deterministic / Fixed |
| D5 | Claude | Moderate | 1-Page | Horizontal Banded | 4 Groups | Deterministic / Fixed |
| D6 | Claude | High | 1-Page | Three-Column Dense | 3 Groups | Deterministic / Fixed |
| D7 | Claude | High | 1-Page | Full-Bleed Two-Column Heavy | 2 Groups | Deterministic / Fixed |
| S1 | KIMI | Minimum | 1-Page | Monolith (Centered Column) | 4 | Deterministic / Fixed |
| S2 | KIMI | Minimum | 1-Page | Offset Rail (Asymmetric) | 7 | Deterministic / Fixed |
| S3 | KIMI | Moderate | 1-Page | Twin Ledger (Equal Columns) | 8 | Deterministic / Fixed |
| S4 | KIMI | Moderate | 1-Page | Sovereign (Dominant Primary) | 5 | Deterministic / Fixed |
| S5 | KIMI | Moderate | 1-Page | Strata (Horizontal Bands) | 5 | Deterministic / Fixed |
| S6 | KIMI | High | 1-Page | Meridian (Editorial 2-Column) | 8 | Deterministic / Fixed |
| S7 | KIMI | High | 1-Page | Ledger Grid (Full-width Grid) | 6 | Deterministic / Fixed |
| MIN-01 | Gemini | Minimum | 1-Page | Atrium (Centered Monolith) | 3 | Deterministic / Fixed |
| MIN-02 | Gemini | Minimum | 1-Page | Horizon Bands | 2 | Deterministic / Fixed |
| MOD-01 | Gemini | Moderate | 1-Page | Balanced 35/65 Columns | 4 | Deterministic / Fixed |
| MOD-02 | Gemini | Moderate | 1-Page | Dominant 68 + Rail 32 | 6 | Deterministic / Fixed |
| MOD-03 | Gemini | Moderate | 1-Page | Masonry Stack | 4 | Deterministic / Fixed |
| HIGH-01 | Gemini | High | 1-Page | Dense Dual Grid (38/62) | 5 | Deterministic / Fixed |
| HIGH-02 | Gemini | High | 1-Page | Triple Rail Editorial | 7 | Deterministic / Fixed |

#### 2. Capacity Credibility and Physical Real Estate Audit

Verifying "comfortable capacity" against "theoretical maximums" is a strategic necessity to prevent spatial collapse. Professional readability on a 612 × 792 pt surface requires strict adherence to font constants and glyph advance widths. This audit utilizes measured metrics: Liberation Sans (0.441 em/char) and Liberation Serif (0.402 em/char). By applying a 0.92 comfort factor (derating), we ensure the character-per-line (CPL) and character-per-container (CPC) totals absorb ragged-right slack and word-wrap loss without requiring font-size reduction.

**Real Estate Utilization Audit:**

- **High Spatial Fragility (Risk of Overcrowding):**
  - HIGH-01: Utilizes aggressive 0.35" margins and 11 pt leading. This design is highly sensitive to CPL deviations; any overflow triggers visual collision.
  - D6/D7: Marginal boundaries (38–40 pt) push the limits of printable real estate, requiring maximum line-efficiency.
  - S7 Ledger Grid: Features the narrowest margins (26 pt / 0.36 in). While efficient, it leaves zero "wrap-slack tolerance" for dense narrative.
- **Spatial Under-utilization (Excessive Whitespace):**
  - S1 Monolith: Employs 72 pt (1-inch) margins on all axes. This intentionally discards approximately 35% of the usable body region to create a curated "premium" aesthetic.
  - MIN-01 Atrium: Features extreme 1.1" side margins. It is essentially a "monument" design, vulnerable to appearing empty if the core evidence field is not perfectly balanced.
  - D1: Uses uniform 61 pt margins and a 97 pt header, significantly restricting the primary professional narrative area.

#### 3. PDF Fitness and Geometric Stability

Fixed geometry is the governing law of PDF-native surfaces. Unlike fluid web layouts, these designs treat the US Letter sheet as a static coordinate map. Stability is achieved through a "one-page-first" expansion model where specific containers serve as designated vertical growth points. Typography remains readable by maintaining line-heights (leading) between 1.28× and 1.43× of the base font size.

**Geometric Stability Table**

| Category | Design Characteristics | Identified Designs |
|---|---|---|
| Stable Geometry | Broad margins; fixed containers; predictable narrative flow. | S1, S5, D1, D5, MIN-02, MOD-03 |
| Predictable | Standard column ratios; standard leading; designated expansion points. | S2, S3, S4, D3, D4, MOD-01, MOD-02 |
| High Spatial Fragility | Aggressive margins; low wrap-slack tolerance; grid-heavy architectures. | S6, S7, D6, D7, HIGH-01, HIGH-02 |

#### 4. Performance Evaluation: Minimum-Density Surfaces

The "Atrium" strategy focuses on making sparse candidate evidence appear curated rather than lacking. These surfaces succeed through symmetric margins and broad containers that resist the pressure to fill space.

**Ranked Minimum-Density Surfaces:**

1. **S1 Monolith:** (2,134 chars). The optimal "Monolith" performer. It utilizes four horizontal bands that provide weight to every line. A comfortable 97 CPL ensures readability.
2. **MIN-01 Atrium:** (2,088 chars). Succeeds via extreme 1.1" margins and a tall 400.8 pt core field. This forces focus onto a single, high-impact narrative.
3. **D1 Statement-Led Single Column:** (2,604 chars). While it holds more characters than S1, its "Narrow Narrative" (93 CPL in a single column) makes it prone to vertical exhaustion if the narrative exceeds its 22-line budget.

#### 5. Performance Evaluation: Moderate-Density Surfaces

The "General Purpose Standard" requires balancing container flexibility with readable information density, typically utilizing "Dominant Primary + Sidebar" or "Horizontal Banded" configurations.

**Top Moderate-Density Surfaces:**

- **S4 Sovereign:** (3,759 chars). The leader in this class. Its dominant full-width container (roughly 50% of body) is ideal for deep single-strand evidence.
- **D3 Balanced Two-Column:** (3,666 chars). Provides the highest line count (80 lines) in the moderate class, allowing for more granular evidence distribution.
- **S5 Strata:** (3,561 chars). Strongest horizontal performer. Its 109 CPL allows for deep, single-line achievements across deliberately unequal band heights.
- **MOD-01 Balanced Columns:** (3,080 chars). A 35/65 split that offers the most familiar professional aesthetic. It is highly scannable and easier for automated systems to fill.

#### 6. Performance Evaluation: High-Density Surfaces

High-density surfaces require rigorous structural engineering to accommodate maximum evidence (e.g., Executive or Technical CVs) without loss of readability.

**Ranked High-Density Surfaces:**

1. **HIGH-01 Dense Dual Grid:** (5,420 chars). The absolute capacity leader. It achieves this through 0.35" margins and 105 CPL. It is the most efficient use of real estate in the array.
2. **S7 Ledger Grid:** (5,088 chars). Uses a central two-column grid of compact repeated slots. This is the strongest performer for "High-Count Short Evidence" (e.g., multiple concurrent projects).
3. **S6 Meridian:** (4,756 chars). Achieves high density using an "Editorial 2-Column" strategy (2/3 main, 1/3 utility). This allows for deep narrative evidence to coexist with high-count metadata without the crowding risk seen in HIGH-01.

#### 7. Container Architecture and Writing-System Usability

"Machine Usability" is the primary bottleneck for automated placement. To be deterministic, a system must utilize the "Reportlab AFM stringWidth" methodology to know when a container is full before writing. Designs providing "Narrow but Deep" rails (S2, MOD-02) are easier to fill with list-based evidence, whereas "Large Uninterrupted Narrative Areas" (D1, S1) require more sophisticated prose-weighting.

**Top 5 Designs by Machine Usability:**

1. **S2 Offset Rail:** (Rating: 5/5). Highly deterministic; fixed-size boxes (A, B, C, D) provide explicit coordinate boundaries for DNA types.
2. **S7 Ledger Grid:** (Rating: 5/5). Grid-based modular slots allow for perfect placement of project-based evidence.
3. **D6 Three-Column Dense:** (Rating: 4.5/5). High efficiency through clear separation of metadata columns from the core narrative.
4. **MOD-02 Dominant + Rail:** (Rating: 4/5). Uses internal "cards" (A1-A3) within the dominant field, creating a rigid framework for automated insertion.
5. **D2 Identity Band:** (Rating: 4/5). Uses 17-line fixed containers for Education and Skills, allowing for precise list-length control.

#### 8. Integrated Cover Letter and Package Synergy

Strategic "Contextual Priming" is achieved through Integrated Surfaces where a cover letter is directly attached to the factual résumé. Selection is governed by the candidate's DNA and the destination's requirements.

- **Precision Letter** (1,846 chars): Use for strong direct fits; brief and fast (26 lines).
- **Contextual Letter** (2,808 chars): Balanced standard; use when motivation strengthens the case (36 lines).
- **Thesis Letter** (3,485 chars): Deepest standalone; essential for career transitions or senior roles requiring complex arguments (41 lines).
- **Integrated Package** (6,048 chars total): A two-page artifact. Page 1 (2,688 chars) primes the reader, while Page 2 (3,360 chars) provides a complete, moderate-density résumé.

#### 9. Master Decision Matrix and Final Disposition

This matrix is a human-in-the-loop tool for matching evidence volume to appropriate PDF surfaces. Usable line counts consistently exclude structural title lines.

| Design ID | Model | Density | Usable Lines | Capacity | PDF Fitness | Machine Usability | Best Use Case | Primary Weakness | Recommended Disposition |
|---|---|---|---|---|---|---|---|---|---|
| S1 | KIMI | MIN | 22 | 2,134 | 5 | 5 | Curated Profile | Spatial Under-utilization | RETAIN CANDIDATE |
| D1 | Claude | MIN | 34 | 2,604 | 5 | 4 | Narrative-Heavy | Vertical Exhaustion | RETAIN CANDIDATE |
| MIN-01 | Gemini | MIN | 29 | 2,088 | 4 | 4 | Single-Column Focus | Extreme Side Margins | RETAIN CANDIDATE |
| MIN-02 | Gemini | MIN | 24 | 1,824 | 4 | 4 | Sparse Narrative | Low Capacity | DO NOT RETAIN |
| S2 | KIMI | MIN | 47 | 2,279 | 5 | 5 | Scannable Metrics | Narrow Rail (33 CPL) | RETAIN CANDIDATE |
| D4 | Claude | MOD | 66 | 3,204 | 5 | 4 | Exp + Meta Sidebar | Rigid Sidebar | RETAIN CANDIDATE |
| S4 | KIMI | MOD | 39 | 3,759 | 5 | 4 | Deep Single Strand | Single Column Risk | RETAIN CANDIDATE |
| S3 | KIMI | MOD | 60 | 3,360 | 5 | 4 | Dual Equal Timelines | Rigid Split | RETAIN CANDIDATE |
| D3 | Claude | MOD | 80 | 3,666 | 5 | 4 | Balanced Mid-Career | High Line Count | RETAIN CANDIDATE |
| MOD-01 | Gemini | MOD | 70 | 3,080 | 4 | 4 | Standard Split | Traditional Aesthetic | RETAIN CANDIDATE |
| S5 | KIMI | MOD | 42 | 3,561 | 5 | 5 | Wide Achievement Bands | Unequal Band Heights | RETAIN FOR UNIQUE FEATURE |
| MOD-03 | Gemini | MOD | 54 | 2,778 | 4 | 4 | Modular Projects | Redundant (vs S5) | REDUNDANT |
| HIGH-01 | Gemini | HIGH | 105 | 5,420 | 4 | 4 | Technical/Academic CV | High Spatial Fragility | RETAIN CANDIDATE |
| S7 | KIMI | HIGH | 51 | 5,088 | 5 | 5 | Project-Rich Roles | Narrowest Margins | RETAIN CANDIDATE |
| D6 | Claude | HIGH | 136 | 4,464 | 5 | 5 | Max Metadata | Cognitive Load | RETAIN CANDIDATE |
| S6 | KIMI | HIGH | 78 | 4,756 | 5 | 5 | Editorial CV | Narrow Utility Col | RETAIN CANDIDATE |
| HIGH-02 | Gemini | HIGH | 108 | 4,544 | 4 | 3 | Parallel Track Exp | Eye Fatigue | REQUIRES GEOMETRY REVALIDATION |
| D7 | Claude | HIGH | 94 | 4,282 | 4 | 3 | Full-Bleed Executive | Low Wrap-Slack | REQUIRES CAPACITY REVALIDATION |

---

## Source B — Résumé Surface Comparative Audit (Presentation Deck, 16 Slides)

---

### Slide 01 — Title

**MULTI-MODEL COMPARATIVE AUDIT · PDF WRITING GEOMETRIES**

Résumé Surface Geometries

A comparative technical audit of 25 fixed-layout résumé surfaces from four model families — Claude, KIMI, Meta, and Gemini — scored on capacity credibility, PDF fitness, density performance, and machine-placement usability.

**THE DETERMINISTIC SPECTRUM**

- 1,088 chars — floor (Precision · Gemini)
- 5,420 chars — ceiling (HIGH-01 · Meta)

| Family | Surfaces |
|---|---|
| CLAUDE | 7 surfaces · D1–D7 |
| KIMI | 7 surfaces · S1–S7 |
| META | 7 surfaces · MIN-01–HIGH-02 |
| GEMINI | 4 surfaces · Precision–Integrated |

GLM family — referenced in the audit brief, no surfaces submitted; carried as a defined limitation.

---

### Slide 02 — Scope and Method (01 · SCOPE AND METHOD)

> Every surface is audited as a fixed, deterministic writing budget — not a visual template

**AUDIT MANDATE**

- Treat each surface as a fixed coordinate map with a measurable evidence budget
- Evaluate each model family internally first, then compare families on identical criteria and evidentiary standards
- Preserve attribution of every underlying design
- No redesign, merging, or creation of new surfaces
- PDF compatibility is mandatory: stable geometry, no browser-only behavior

**METHOD — THREE PASSES**

1. Family-internal evaluation — Inventory, capacity maps, and density-class performance scored inside each family
2. Normalized scoring — Ten dimensions on a 100-point scale, equal 10-point weights, one scorecard per family
3. Cross-family comparison — Category leadership, a master decision matrix, and a disposition for every surface

**SCOPE AND LIMITS**

- 25 surfaces across 4 families: Claude D1–D7, KIMI S1–S7, Meta MIN-01–HIGH-02, Gemini Precision–Integrated
- GLM submitted no surfaces; the omission is a defined limitation
- Measurements that cannot be verified from the documentation are flagged as unverified
- Cover-letter surfaces audited separately: Precision 1,846 · Contextual 2,808 · Thesis 3,485 · Integrated 6,048 chars
- Ten scored dimensions: PDF Fitness · Capacity Credibility · Minimum Density · Moderate Density · High Density · Container Architecture · Machine-Placement Usability · Capacity-Map Quality · Evidence-Distribution Flexibility · Visual Geometry

---

### Slide 03 — Design Inventory (02 · DESIGN INVENTORY)

> 25 surfaces, four families — from a centered monolith to a triple-rail editorial grid

| Family | Design | Layout configuration | Density | Containers | Format |
|---|---|---|---|---|---|
| Claude | D1 | Statement-Led Single Column | MIN | 3 | 1-page |
| | D2 | Identity Band + Highlights | MIN | 3 groups | 1-page |
| | D3 | Balanced Two-Column | MOD | 2 groups | 1-page |
| | D4 | Dominant Primary + Sidebar | MOD | 2 groups | 1-page |
| | D5 | Horizontal Banded | MOD | 4 groups | 1-page |
| | D6 | Three-Column Dense | HIGH | 3 groups | 1-page |
| | D7 | Full-Bleed Two-Column Heavy | HIGH | 2 groups | 1-page |
| KIMI | S1 | Monolith (Centered Column) | MIN | 4 | 1-page Letter |
| | S2 | Offset Rail (Asymmetric) | MIN | 7 | 1-page Letter |
| | S3 | Twin Ledger (Equal Columns) | MOD | 8 | 1-page Letter |
| | S4 | Sovereign (Dominant Primary) | MOD | 5 | 1-page Letter |
| | S5 | Strata (Horizontal Bands) | MOD | 5 | 1-page Letter |
| | S6 | Meridian (Editorial 2-Column) | HIGH | 8 | 1-page Letter |
| | S7 | Ledger Grid (Full-width Grid) | HIGH | 6 | 1-page Letter |
| Meta | MIN-01 | Atrium (Centered Monolith) | MIN | 3 | 1-page |
| | MIN-02 | Horizon Bands | MIN | 2 | 1-page |
| | MOD-01 | Balanced 35/65 Columns | MOD | 4 | 1-page |
| | MOD-02 | Dominant 68 + Rail 32 | MOD | 6 | 1-page |
| | MOD-03 | Masonry Stack | MOD | 4 | 1-page |
| | HIGH-01 | Dense Dual Grid (38/62) | HIGH | 5 | 1-page |
| | HIGH-02 | Triple Rail Editorial | HIGH | 7 | 1-page |
| Gemini | Precision | Ultra-minimalist single column | MIN | — | 1-page |
| | Contextual | Balanced standard | MOD | — | 1-page |
| | Thesis | Deep standalone narrative | HIGH | 4 | 1-page |
| | Integrated | Cover letter + résumé package | INT | 2 parts | 2-page |

> Attribution note — one contributing report lists the MIN/MOD/HIGH series under Gemini; the majority of the audit record assigns it to Meta. Header and footer zones are excluded from all capacity figures.

---

### Slide 04 — Capacity Normalization (03 · CAPACITY NORMALIZATION)

> Comfortable Character Capacity is the common currency across incompatible metrics

Raw line counts deceive: a 21-CPL rail line in HIGH-02 carries a fraction of the evidence of a full-width line. The audit normalizes every surface into usable evidence lines and Comfortable Character Capacity (CCC) — lines × comfortable characters per line, net of font metrics and a safety derating that absorbs word-wrap loss and ragged-right slack.

**MEASUREMENT BASES**

- Claude D-series — ReportLab AFM stringWidth logic; comfort factor 0.91 for Helvetica, 0.93 for Times
- KIMI S-series — measured mean glyph advance (4.422 pt/char at 11 pt Liberation Serif); flat 0.92 derating
- Meta / Gemini — deterministic line maps (benchmark: MIN-01 at 29 lines / 2,088 chars)

> Ghost capacity. A 0.02 comfort-factor variance creates a ~100-character phantom budget in a 5,000-character document — enough to trigger text overflow in automated rendering.

**BENCHMARK CAPACITIES — COMFORTABLE CHARS**

| Design | Lines | CPL | CCC |
|---|---|---|---|
| HIGH-01 · Meta | 105 | 38–64 | 5,420 |
| S7 · KIMI | 51 | 59–122 | 5,088 |
| S6 · KIMI | 78 | — | 4,756 |
| HIGH-02 · Meta | 108 | 21–58 | 4,544 |
| D6 · Claude | 136 | 24–48 | 4,464 |
| D7 · Claude | 94 | 70 | 4,282 |
| Integrated · Gemini | 70 | 60 | 4,200 |
| S4 · KIMI | 39 | — | 3,759 |
| D3 · Claude | 80 | — | 3,666 |
| MIN-01 · Meta | 29 | 72 | 2,088 |

> Lines exclude headers, footers, and whitespace-only rows. CPL = comfortable characters per line; ranges reflect mixed container widths.

---

### Slide 05 — Capacity Credibility (04 · CAPACITY CREDIBILITY)

> Capacity is bought with margins and type size — the two largest claims sit at the credibility edge

**MARGIN WIDTH BY DESIGN (PT, US LETTER)**

| Design | Margin (pt) |
|---|---|
| MIN-01 | 79.2 |
| S1 | 72 |
| D1 | 61 |
| MOD-01 | 48 |
| D6 | 39 |
| D7 | 38 |
| S7 | 26 |
| HIGH-01 | 25.2 |

> MOD-01 plotted at the midpoint of its 0.6–0.75 in (43–54 pt) band; D4 sits in the same band. 26 pt ≈ 0.36 in — the narrowest margin in the inventory.

**WHERE THE CREDIBILITY GOES**

- **Typography floor.** HIGH-02 runs 8.5 pt type on 11 pt leading; S7 runs 9.5 pt on 12.2 pt — any rendering variance risks character collision, and both fail the arm's-length readability test.
- **Structural load.** D6 carries 136 usable lines across three vertical tracks — the highest line count in the inventory leaves zero vertical slack and invites ragged alignment failures.
- **Brittle fill ratio.** S7 fills 96% of its container area on 26 pt margins; the geometry depends on exact glyph-width math that rarely survives diverse PDF viewer engines.
- **Intentional slack.** MIN-01's 1.1 in margins discard roughly a third of the body region on purpose — sparse evidence is framed as curated, not deficient.

---

### Slide 06 — PDF Fitness and Stability (05 · PDF FITNESS AND STABILITY)

> Fixed geometry is the governing law — stability tiers separate safe surfaces from brittle ones

| Stability tier | Design characteristics | Surfaces |
|---|---|---|
| Stable geometry | Broad margins; fixed containers; predictable narrative flow | S1, S5, D1, D5, MIN-02, MOD-03 |
| Predictable | Standard column ratios; standard leading; designated expansion points | S2, S3, S4, D3, D4, MOD-01, MOD-02 |
| High spatial fragility | Aggressive margins; low wrap-slack tolerance; grid-heavy architectures | S6, S7, D6, D7, HIGH-01, HIGH-02 |

> Every high-density surface lands in the fragile tier — the capacity leaders are exactly the designs that most need geometry revalidation before automated production use.

**WHAT MAKES A SURFACE PDF-NATIVE**

- Fixed (x, y, w, h) containers — reflow and responsive behavior are prohibited; Claude and KIMI series ship fixed-point geometry throughout
- One-page-first growth — designated containers act as vertical growth points; Claude's expansion model is the audit's gold standard
- Leading discipline — line-height held between 1.28× and 1.43× of base font size

> Safest surfaces: MOD-01 and D4 — 0.6–0.75 in margins, no full-bleed risk. Highest risk: S7.

---

### Slide 07 — Minimum-Density Performance (06 · MINIMUM-DENSITY PERFORMANCE)

> Thin evidence must read as curated — Monolith and Atrium turn whitespace into the message

**01 — S1 Monolith · KIMI**
22 lines · 2,134 chars · 97 CPL · 1 in uniform margins
Monument-scale containers fill the horizontal axis, so sparse evidence gains weight through scale rather than filler. The audit's premier thin-evidence performer.

**02 — MIN-01 Atrium · Meta**
29 lines · 2,088 chars · 72 CPL · 1.1 in side margins
Extreme margins create a prominence chamber around a tall 400.8 pt core field — a 3-line positioning statement reads as a high-value executive summary.

**03 — D1 Statement-Led · Claude**
34 lines · 2,604 chars · 93 CPL · 78.6% narrative share
A single narrative container lets a career story breathe — best for narrative-heavy transitions. Risk: vertical exhaustion once the narrative exceeds its 22-line budget.

> Below the threshold: Gemini Precision (16 lines · 1,088 chars) is a sharp but niche ultra-minimalist tool — it ranks below MIN-01 and S1 in general-purpose utility for early-career candidates. All three leaders avoid empty regions, artificial content, oversized type, and filler.

---

### Slide 08 — Moderate-Density Performance (07 · MODERATE-DENSITY PERFORMANCE)

> The general-purpose standard: balance narrative depth against scannable structure

| Design | Family | Lines | CCC | Structural idea |
|---|---|---|---|---|
| S4 Sovereign | KIMI | 39 | 3,759 | Dominant full-width field (~50% of body) for deep single-strand evidence |
| D3 Balanced | Claude | 80 | 3,666 | Highest line count in class; most granular evidence distribution |
| S5 Strata | KIMI | 42 | 3,561 | Deliberately unequal horizontal bands; 109-CPL achievement lines |
| D4 Dominant | Claude | 66 | 3,204 | 62% of body to experience; sidebar absorbs credentials |
| MOD-01 Balanced | Meta | 70 | 3,080 | Familiar 35/65 split; the easiest surface for automated filling |

**READING THE CLASS**

- The working range of the moderate class is roughly 2,500–3,700 characters — mid-career evidence without cramming
- Asymmetric rails (MOD-02, D4) pair a narrative field with a scannable rail, preventing ragged whitespace
- Horizontal stratification (S5) avoids column rigidity — strongest for varied, project-based histories

> Placement verdict: S4 Sovereign leads the class on capacity and single-strand depth; D3 wins on granularity; MOD-01 is the reliability baseline. Equal-weight containers (D3, MOD-01) keep experience and skills from overcrowding each other; dominant-primary structures (S4, D4) suit candidates with one major career pillar.

---

### Slide 09 — High-Density Performance (08 · HIGH-DENSITY PERFORMANCE)

> Density leaders reach 5,400+ characters — the cost is paid in margins, leading, and slack

**COMFORTABLE CHARACTER CAPACITY (CHARS)**

| Design | CCC |
|---|---|
| HIGH-01 | 5,420 |
| S7 | 5,088 |
| S6 | 4,756 |
| HIGH-02 | 4,544 |
| D6 | 4,464 |
| D7 | 4,282 |
| Thesis | 3,060 |

**THE HIGH-DENSITY PODIUM**

1. **HIGH-01 Dense Dual Grid** — absolute capacity leader (105 CPL, 38/62 split), but 0.35 in margins and 11 pt leading trigger a geometry-revalidation flag.
2. **S7 Ledger Grid** — a central grid of compact repeated slots; strongest for high-count short evidence (concurrent projects, leadership roles). 96% fill ratio.
3. **S6 Meridian** — editorial 2/3 + 1/3 columns let deep narrative coexist with high-count metadata, without the crowding risk seen in HIGH-01.

> Readability cost: HIGH-02 (108 lines) draws an eye-fatigue flag; D6 (136 lines) carries the audit's highest cognitive load.

---

### Slide 10 — Machine-Placement Usability (09 · MACHINE-PLACEMENT USABILITY)

> Deterministic placement means knowing a container is full before writing into it

**TOP FIVE BY MACHINE USABILITY ( /5)**

| Design | Rating | Family | Why it leads |
|---|---|---|---|
| S2 Offset Rail | 5.0 | KIMI | Fixed-size boxes A–D give explicit coordinate boundaries for each evidence type. |
| S7 Ledger Grid | 5.0 | KIMI | Grid-based modular slots allow perfect placement of project-based evidence. |
| D6 Three-Column | 4.5 | Claude | Clear separation of metadata columns from the core narrative; high efficiency. |
| MOD-02 Dom. + Rail | 4.0 | Meta | Internal cards A1–A3 inside the dominant field create a rigid framework for insertion. |
| D2 Identity Band | 4.0 | Claude | 17-line fixed containers for Education and Skills allow precise list-length control. |

**WHAT DETERMINISTIC PLACEMENT REQUIRES**

- Explicit capacity boundaries — the system can tell when a container is full
- Content quantity determined before writing, not during
- Evidence allocated to containers without guessing
- Container purposes clear enough for unusual evidence distributions

> Most machine-readable specification: KIMI's S-series ships JSON-style restrictions — "one credential per line," "prose fragments only" — that make automated data placement deterministic.

> Most reliable fit calculation: Claude's ReportLab AFM stringWidth math accounts for individual glyph widths.

---

### Slide 11 — Failure Modes (10 · FAILURE MODES)

> Four failure modes recur — each is a geometry decision, not a content problem

**Unrealistic capacity**
HIGH-01 · HIGH-02 — Meta high-density class
Claims above 4,500 characters are achieved by dropping body type to 8.5–9.5 pt. The resulting documents fail the arm's-length readability test, and any rendering variance risks character collision.

**Ragged alignment**
D6 — Claude high-density class
Three parallel vertical tracks at 136 usable lines: any imbalance in narrative length between columns breaks the horizontal rhythm and appears broken to the human eye — with zero vertical slack to absorb it.

**Narrow-rail wrap failure**
HIGH-02 (21 CPL) · MIN-02 (22 CPL)
Rails too narrow for standard chronological history: a role title like "Director of International Operations" wraps to three lines, destroying the intended container height and causing a page-flow failure.

**Placement ambiguity**
MOD-03 Masonry Stack — Meta moderate class
The horizontal-to-vertical-to-horizontal allocation is attractive in wireframes but carries a higher automated-projection failure rate than linear or rail-based flows — flagged for geometry revalidation.

> Scope of impact: the capacity and wrap failures are concentrated in the high-density classes of each family; minimum- and moderate-density surfaces are largely unaffected. No weakness here is family-wide.

---

### Slide 12 — Component Leadership (11 · COMPONENT LEADERSHIP)

> No family owns every subsystem — the strongest ideas are distributed, with provenance intact

| Capability | Design | Family | Why it leads |
|---|---|---|---|
| Best capacity accounting | D-series | Claude | ReportLab AFM stringWidth with per-typeface comfort factors (0.91 Helvetica / 0.93 Times) |
| Best use of space | S7 Ledger Grid | KIMI | Central two-column grid of compact slots maximizes vertical real estate without wasting width |
| Best machine-readable spec | S-series | KIMI | JSON-style restrictions ("one credential per line") enable deterministic automated placement |
| Best uneven-evidence strategy | MOD-02 | Meta | Internal cards inside a dominant field absorb varied data lengths with high aesthetic stability |
| Best minimum-density strategy | MIN-01 Atrium | Meta | Extreme margins and a prominence chamber make sparse evidence read as premium |
| Best horizontal stratification | S5 Strata | KIMI | Stacked full-width bands of unequal height avoid column rigidity for project-based histories |

> Ingredients are identified and attributed only. Per the audit mandate, no combined system is constructed here — the decision of which family governs geometry, capacity accounting, and density handling belongs to the human design stage that follows this report.

---
