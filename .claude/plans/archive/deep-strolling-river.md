# ALCHEMIA — The Ingestion & Aesthetic Propagation System

> From scattered touchstones to a unified creative operating system.
> Intake. Absorb. Alchemize. Cascade.

## Context

**The problem:** 6,580+ source files — theory drafts, code prototypes, AI transcripts, design specs, manifestos — sit scattered across `~/Workspace/` in non-git directories. Beyond files on disk, creative inputs live in iOS Notes, Google Docs, AI chat histories, bookmarks, and screenshots. Meanwhile, the 88-repo system generates output autonomously (via GitHub Actions agents) but produces aesthetically generic results because it has no access to the owner's taste, visual sensibility, or design DNA.

**What we're building:** A two-part system:
1. **The Alchemical Forge** — A material ingestion pipeline that discovers, classifies, transforms, and deploys source materials into target repos
2. **The Aesthetic Nervous System** — A cascading taste profile that captures visual/tonal preferences and propagates them through organ → repo → generated output

**Why this matters:** The repos currently tell the story of what they ARE, but not where they CAME FROM or what they LOOK LIKE. Ingesting provenance gives each repo intellectual depth. Cascading aesthetic DNA ensures autonomous output matches the owner's vision rather than defaulting to generic AI aesthetics.

---

## Part 1: The Alchemical Forge (Material Ingestion)

### Architecture: Three-Stage Pipeline

```
INTAKE (discover + fingerprint)
  → intake-inventory.json
ABSORB (classify + map)
  → absorb-mapping.json
ALCHEMIZE (transform + deploy)
  → per-repo PROVENANCE.yaml + master provenance-registry.json
```

### Where it lives

New repo: `meta-organvm/alchemia-ingestvm`. Separation rationale: the corpus repo is documentation-only (no build system), and orchestration-start-here is for GitHub Actions agents, not local CLI tools.

### Stage 1: INTAKE

Crawl configured source directories, fingerprint every file, detect duplicates.

**Source directories:**
- `~/Workspace/intake/` (incl. `inSORT/`, `processCONTAINER/`, `MET4_Fuse-Transform-Symbiote/`)
- `~/Workspace/<repo-named-dirs>/` (metasystem-core, auto-rev-epistemic-engine_spec, etc.)
- `~/Workspace/ORG-*-staging/`
- `~/Workspace/organvm-pactvm/` (parent PDFs, CSV manifest, architecture docs)

**Per-file metadata:** SHA-256, extension, MIME type, size, last-modified, parent dir. Integrates existing `FUNCTIONcalled .meta.json` sidecars where present. Cross-references `MANIFEST_INDEX_TABLE.csv` (68 pre-cataloged entries with IDs, categories, tags, dependencies).

**Output:** `intake-inventory.json` with ~6,580 entries.

### Stage 2: ABSORB

Classify each file → target organ, org, repo, subdirectory. Seven rules in priority order:

| Rule | Trigger | Example |
|------|---------|---------|
| 1. Direct repo match | Parent dir name matches registry repo | `~/Workspace/card-trade-social/` → `organvm-iii-ergon/card-trade-social` |
| 2. Name-variant match | Known discrepancy table | `hokage-chess--believe-it!` → `hokage-chess` |
| 3. Staging dir match | `ORG-{N}-*-staging/` pattern | `ORG-IV-orchestration-staging/` → ORGAN-IV repos |
| 4. processCONTAINER | All files → RE:GE subsystem specs | `AcademiaManager.md` → `recursive-engine--generative-entity` |
| 5. MANIFEST_INDEX_TABLE | CSV category + tags lookup | Category "Technical Specifications" → ORGAN-I |
| 6. Content-keyword heuristic | First 500 lines keyword scan | "epistemology", "recursive" → ORGAN-I |
| 7. Unresolved | Flagged `PENDING_REVIEW` | Human reviews suggestions |

**Target directory in each repo:**
```
docs/source-materials/
  PROVENANCE.yaml       # Auto-generated manifest
  theory/               # Theory docs, transcripts
  specs/                # Specifications, architecture
  prototypes/           # Code prototypes (.py, .js, .html)
  research/             # Case studies, precedent
  transcripts/          # AI conversation transcripts
```

**Output:** `absorb-mapping.json` with classification rule, confidence, target path per entry.

### Stage 3: ALCHEMIZE

Transform files as needed, deploy via `gh api PUT` (reusing `put_file()` pattern from `scripts/platinum-deploy.py`).

**File handling:**

| Type | Action |
|------|--------|
| `.md`, `.txt`, `.py`, `.js`, `.jsx`, `.html`, `.yaml`, `.json` | Deploy directly |
| `.docx` | Convert → `.md` via pandoc, deploy the `.md` |
| `.pdf` < 5MB | Deploy directly |
| `.pdf` >= 5MB | Reference-only in PROVENANCE.yaml |
| `.gdoc`, `.zip` | Reference-only |
| `.png`, `.jpg` < 2MB | Deploy directly |

**Pre-flight per repo:** Skip archived (6 repos). Branch-protected repos → create branch + PR. Never overwrite existing files unless `--force`.

**Outputs:**
- Per-repo `docs/source-materials/PROVENANCE.yaml` — lists all ingested materials with source paths, dates, SHA-256
- Master `provenance-registry.json` in corpus repo — bidirectional traceability

### CLI Interface

```
alchemia intake   [--source-dir DIR...]           # Crawl + fingerprint
alchemia absorb   [--inventory FILE]              # Classify + map
alchemia alchemize [--dry-run] [--organ X] [--repo Y] [--batch-size N]
alchemia status                                    # Pipeline stats
alchemia review   [--status PENDING_REVIEW]       # Interactive review
```

### Key files to reuse

- `scripts/platinum-deploy.py:105-162` — `gh_api()`, `get_file_sha()`, `put_file()`, `get_default_branch()` functions
- `registry-v2.json` — repo catalog for classification
- `~/Workspace/organvm-pactvm/MANIFEST_INDEX_TABLE.csv` — pre-existing 68-entry catalog
- `~/Workspace/intake/functioncalled-metadata-sidecar.v1.1.schema.json` — existing metadata schema

---

## Part 2: The Aesthetic Nervous System

### The Problem It Solves

Autonomous AI generation defaults to generic aesthetics — safe color palettes, cookie-cutter layouts, stock-feeling language. The owner has specific taste that currently exists only in their head and in scattered inspirations. The aesthetic nervous system makes taste machine-readable and cascading.

### Architecture: Cascading Taste Chain

```
taste.yaml (system-wide DNA)
  → organ-aesthetic.yaml (per-organ specialization)
    → repo-aesthetic.yaml (per-repo specifics)
      → AI agent output (generated content respects the chain)
```

### taste.yaml — The Root Aesthetic DNA

Lives in `meta-organvm/alchemia-ingestvm/taste.yaml`. Single source of truth for system-wide aesthetic identity.

```yaml
schema_version: "1.0"
owner: "4444j99"

palette:
  primary: "#..."
  secondary: "#..."
  accent: "#..."
  background: "#..."
  text: "#..."

typography:
  headings: "..."
  body: "..."
  code: "..."
  weight_preference: "..."

tone:
  voice: "..."        # e.g. "cerebral but accessible"
  register: "..."     # e.g. "elevated without pretension"
  density: "..."      # e.g. "rich, layered"

visual_language:
  influences: []      # Named aesthetic references
  keywords: []        # e.g. "brutalist", "typographic", "diagrammatic"

references:           # Captured inspirations (screenshots, URLs, descriptions)
  - type: "url"
    source: "https://..."
    tags: ["minimal", "typography-forward"]
    notes: "This captures the density I want"
    captured: "2026-02-14"
  - type: "screenshot"
    path: "inspirations/screenshot-001.png"
    tags: ["color-palette", "layout"]
    notes: "The way text and diagram coexist"
    captured: "2026-02-14"
  - type: "description"
    text: "Dense but breathable. Academic weight without institutional dryness."
    tags: ["tone", "density"]
    captured: "2026-02-14"

anti_patterns:         # What to explicitly avoid
  - "Generic tech startup gradient backgrounds"
  - "Stock photography"
  - "Emoji-heavy communication"
  - "Rounded-corner card UI with drop shadows"
  - "Default Bootstrap/Tailwind aesthetic"
```

### organ-aesthetic.yaml — Per-Organ Specialization

Lives in each org's `.github` repo (e.g., `organvm-i-theoria/.github/organ-aesthetic.yaml`). Inherits from taste.yaml, adds organ-specific modifiers.

```yaml
schema_version: "1.0"
inherits: "meta-organvm/alchemia-ingestvm/taste.yaml"
organ: "ORGAN-I"
name: "Theoria"

modifiers:
  palette_shift: "cooler, more muted"
  typography_emphasis: "serif headings, monospace for formal notation"
  tone_shift: "more academic, denser, philosophical weight"
  visual_shift: "diagram-heavy, clean lines, mathematical precision"

specific_references: []  # Organ-specific visual inspirations
```

### repo-aesthetic.yaml — Per-Repo Specifics

Lives in individual repos at `docs/aesthetic.yaml`. Inherits from organ-aesthetic.yaml.

```yaml
schema_version: "1.0"
inherits: "organvm-i-theoria/.github/organ-aesthetic.yaml"
repo: "recursive-engine--generative-entity"

specifics:
  visual_theme: "recursive mandala patterns, Tufte-inspired data-ink ratio"
  color_accent_override: null  # or specific override
  tone_override: null

references: []  # Repo-specific inspirations
```

### Capture Channels (Autonomous Ingestion of Inspirations)

These feed new entries into `taste.yaml`'s `references[]` array and into the material pipeline.

#### Channel 1: Screenshot Watcher
- **Mechanism:** macOS `launchd` agent watching `~/Desktop` and `~/Screenshots` for new `.png`/`.jpg`
- **Trigger:** New image file appears
- **Action:** Copies to `inspirations/` directory, generates thumbnail, adds placeholder entry to `taste.yaml` references with `tags: ["uncategorized"]` and timestamp
- **Tagging:** User tags later via `alchemia tag <file> --tags "palette, layout"` CLI command, or items accumulate for batch review

#### Channel 2: Bookmark/Favorites Sync
- **Safari:** Monitor `~/Library/Safari/Bookmarks.plist` via launchd WatchPaths. Parse bookmarks added to "Inspirations" folder.
- **Chrome:** Monitor `~/Library/Application Support/Google/Chrome/Default/Bookmarks` (JSON). Parse bookmarks in "Inspirations" folder.
- **Action:** Fetch page screenshot via headless browser, extract title/description, add to taste.yaml references as `type: "url"`

#### Channel 3: Apple Notes Bridge
- **Mechanism:** AppleScript automation that reads notes from an "Alchemia" folder in Apple Notes
- **Trigger:** Scheduled via launchd (e.g., every 30 min) or on-demand via CLI
- **Action:** Export note content (text + inline images) to `intake/notes/` directory. Classify: notes tagged `#aesthetic` → taste.yaml references; notes tagged `#spec` or `#idea` → material pipeline
- **iOS workflow:** User creates/edits notes on iPhone → iCloud syncs → Mac picks up via AppleScript

#### Channel 4: Google Docs Sync
- **Mechanism:** Google Drive API (OAuth2) watching a designated "Alchemia" folder
- **Alternative:** Google Takeout batch export to a local folder, then standard file intake
- **Action:** Download as `.md` (via export API), ingest through material pipeline
- **Setup:** Requires one-time OAuth2 consent flow; token stored in macOS Keychain

#### Channel 5: AI Chat Capture
- **ChatGPT:** Export conversations (Settings → Data Controls → Export), unzip to `intake/chats/`
- **Claude:** Conversation exports from claude.ai, or session transcripts from Claude Code (`.jsonl` files already exist at `~/.claude/projects/`)
- **Gemini:** `_gemini_visit_*.json` files already appear in intake directories
- **Action:** Parse chat content, extract key excerpts (spec fragments, aesthetic descriptions, code snippets), classify by organ

#### Channel 6: Quick Capture CLI
For ad-hoc inputs that don't come from a watched source:
```
alchemia capture --type url "https://example.com/inspiration" --tags "palette,brutalist"
alchemia capture --type note "Dense typography with breathing room" --tags "tone,typography"
alchemia capture --type screenshot ~/Desktop/cool-layout.png --tags "layout,reference"
```

### Synthesis: Scatter-Shot → Something New

The "arrive at something new" pattern. When enough raw inspirations accumulate, the system synthesizes them.

**`alchemia synthesize` command:**
1. Reads all `references[]` from taste.yaml
2. Groups by tag clusters (palette references, typography references, tone references, etc.)
3. Generates a **creative brief** per organ:
   - Color palette extraction from screenshot references (using image analysis)
   - Typography recommendations based on described influences
   - Tone guide synthesized from written descriptions
   - Visual mood board (collage of reference screenshots)
   - Anti-pattern checklist
4. Output: `docs/creative-brief.md` per organ, plus updated `organ-aesthetic.yaml` with synthesized values

**How AI agents consume this:**
- GitHub Actions workflows that generate content (READMEs, essays, design docs) include a step that fetches the cascading aesthetic chain: `taste.yaml` → `organ-aesthetic.yaml` → `repo-aesthetic.yaml`
- The fetched aesthetic context is injected into the AI prompt as constraints
- Example prompt injection: "You are generating a README for recursive-engine--generative-entity. Follow these aesthetic guidelines: [tone: cerebral but accessible, typography: serif headings, avoid: generic startup aesthetic, visual reference: Tufte-inspired data-ink ratio]..."

---

## Implementation Phases

### Phase A: Scaffold + Core Pipeline (Session 1)

1. Create `meta-organvm/alchemia-ingestvm` repo
2. Set up Python package structure (`src/alchemia/`)
3. Implement INTAKE stage: `crawler.py`, `dedup.py`, `manifest_loader.py`
4. Run first crawl of `~/Workspace/` → produce `intake-inventory.json`

### Phase B: Classification + Mapping (Session 2)

1. Implement ABSORB stage: `classifier.py` (Rules 1-7), `registry_loader.py`, `name_variants.py`
2. Build the name-variant mapping table
3. Run classification → produce `absorb-mapping.json`
4. Review PENDING_REVIEW items, refine rules

### Phase C: Transform + Deploy (Session 3-4)

1. Implement ALCHEMIZE stage: `transformer.py`, `deployer.py`, `provenance.py`
2. Implement pandoc `.docx` → `.md` conversion
3. `--dry-run` full pipeline, review deployment plan
4. Deploy batch 1: Tier 1 (explicit repo matches, ~200 files across ~12 repos)
5. Deploy batch 2: Tier 2 (rule-based, ~300 files)
6. Deploy `provenance-registry.json` to corpus repo

### Phase D: Taste Profile Foundation (Session 5)

1. Create `taste.yaml` with initial aesthetic DNA (collaborative with user)
2. Create 8 `organ-aesthetic.yaml` files, deploy to each org's `.github` repo
3. Create template `repo-aesthetic.yaml`, deploy to flagship repos
4. Build `alchemia capture` CLI command for quick aesthetic inputs

### Phase E: Capture Channels (Session 6-7)

1. Screenshot watcher (launchd agent + file monitor script)
2. Bookmark sync (Safari plist parser + Chrome JSON parser)
3. Apple Notes bridge (AppleScript export automation)
4. Quick capture CLI refinements
5. Google Docs sync (OAuth2 setup + Drive API integration) — deferred if complex
6. AI chat parser (ChatGPT export format + Claude .jsonl + Gemini JSON)

### Phase F: Synthesis Engine (Session 8)

1. Implement `alchemia synthesize` — generates creative briefs from accumulated references
2. Image analysis for color palette extraction from screenshots
3. Per-organ creative brief generation
4. Integration point: demonstrate how a GitHub Actions workflow consumes the aesthetic chain

---

## Verification

| # | Check | Phase |
|---|-------|-------|
| 1 | `alchemia intake` produces valid `intake-inventory.json` with ~6,580 entries | A |
| 2 | `alchemia absorb` classifies >70% of entries with confidence ≥ 0.7 | B |
| 3 | `alchemia alchemize --dry-run` reports correct deployment targets | C |
| 4 | First batch deploys to 12+ repos without overwriting existing content | C |
| 5 | Each target repo has `docs/source-materials/PROVENANCE.yaml` | C |
| 6 | `provenance-registry.json` deployed to corpus repo with full traceability | C |
| 7 | `taste.yaml` is parseable and captures owner's aesthetic DNA | D |
| 8 | 8 `organ-aesthetic.yaml` files deployed, each inheriting from taste.yaml | D |
| 9 | Screenshot watcher detects new screenshots within 5 seconds | E |
| 10 | `alchemia capture --type url` adds entry to taste.yaml references | E |
| 11 | `alchemia synthesize` produces per-organ creative briefs | F |
| 12 | A GitHub Actions workflow successfully reads the aesthetic chain and uses it in generation | F |

---

## Edge Cases

- **Archived repos (6):** Skip deployment, log as `SKIPPED_ARCHIVED`
- **Branch-protected repos:** Create branch + PR instead of direct push
- **Duplicate files:** SHA-256 dedup; most specific directory wins (inSORT > intake root)
- **Special chars in filenames:** Sanitize `|`, `"`, `:`, `?`, `*` → `-`; record original in PROVENANCE.yaml
- **Large PDFs (>5MB):** Reference-only (e.g., `grok-report-(1).pdf` at 11.7MB)
- **metasystem-core code files:** Route docs to `docs/source-materials/`, flag code for separate integration review
- **all-fusion-engine (no registry entry):** Flag as PENDING_REVIEW, suggest creating ORGAN-I repo or routing to RE:GE
