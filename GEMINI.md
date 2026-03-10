# Alchemical Synthesizer (Brahma) - Instructional Context

## Project Overview
The **Alchemical Synthesizer**, also known as the **Brahma Meta-Rack**, is a modular synthesis organism designed to **absorb**, **mutate**, and **re-express** the identities of other systems. It is not a fixed instrument but a parasitic–symbiotic apparatus whose identity is contingent on contact.

### Core Philosophy
- **Absorption:** Ingesting external sonic DNA through contact.
- **Mutation:** Antagonistic recombination of captured traits.
- **Fusion:** Binding multiple identities into a "perfect form."
- **Evolution:** Geometric growth in complexity via non-destructive stacking.

### Main Technologies
- **SuperCollider (SC):** High-fidelity DSP engine, trait registries, and state machines.
- **Pure Data (Pd):** Performance interface, virtual patching, and macro-control.
- **OSC:** Bidirectional communication between the UI (Pd) and the Engine (SC).
- **Python:** Automated specimen validation and dataset management.

---

## Architecture & Infrastructure

### 1. The Brahma metaRack
The macro-container that provides global timing, energy budgets, and the virtual backplane for inter-module infection.
- **Backplane:** Simulated I2C-style bus (`BRIDGE__DOMAIN_ROUTER__v1`) for 32-byte metadata transfer.
- **Registry:** Managed by **Adam Kadmon**, the ontological integrator that enforces canonical trait schemas.

### 2. The 7-Stage Organism Model
Every primary module (e.g., **Relinquished**) adheres to a strict stage specification:
1.  **IA (Input Assimilation):** Normalization and protection.
2.  **EG (Equip Gating):** Single-equip constraint state machine.
3.  **BC (Binding Core):** Signal capture and "wearing."
4.  **AE (Analysis Extraction):** Spectral and temporal trait derivation.
5.  **TE (Transmutation Engine):** Operator-based transformation.
6.  **PR (Protection/Reflection):** Sacrificial buffering and retaliation.
7.  **RR (Release Router):** Final routing and bypass logic.

### 3. Key Organisms
- **Proteus:** The Form-Knower; perfect observation and high-fidelity emulation.
- **Typhon:** The Accumulator; multiplicative stacking of cumulative traits.
- **Janus:** The Gate; dual-faced concurrency and arbitration between worlds.
- **Agent Smith:** Deterministic signal intelligence; homogeneity enforcement.
- **Ditto:** The Morphic Substrate; imitation under imperfect cognition.
- **Sampler Creatures:** Mnemosyne (Archive), Protean Hound (Fragments), Chrysalid Siren (Vocals), Ossuary Monk (Impact), Janiform Child (Time).

---

## Building and Running

### 1. Booting the System
1.  **Launch SuperCollider.**
2.  **Open and Execute `brahma/sc/loader.scd`.** This script loads all SynthDefs, Classes (Adam Kadmon, FSAP, BridgeRouter), and operational engines in the correct order.
3.  **Launch Pure Data.**
4.  **Open `brahma/pd/main.pd`.** This is the master patching surface.

### 2. Operational Workflows
- **Absorption Ritual:** Feed audio into a module's IA stage, trigger an EQUIP pulse, and observe the trait extraction in the AE stage.
- **A/B Testing:** Use `brahma/sc/12_test_bench.scd` to run side-by-side comparisons of different mutation algorithms.
- **NRT Rendering:** Use `brahma/sc/13_nrt_renderer.scd` for high-volume offline specimen generation.

### 3. Automation & Validation
- **Validate Audio:** Run `python3 tools/validate_audio.py path/to/specimen.wav` to ensure the viability of a recorded specimen.

---

## Development Conventions

### Coding Style
- **SC Side:** Use snake_case for SynthDef arguments and CamelCase for Class names. Ensure all SynthDefs include an `outBus` and `inBus` for modular routing.
- **Pd Side:** Follow the 14HP/18HP/24HP faceplate standardization using the provided abstractions (`faceplate_14.pd`, etc.).
- **Metadata:** All inter-module communication must conform to the 32-byte `MetaPacket` structure defined in the Bridge protocol.

### Invariants
- **Single-Equip:** A module core may only bind one donor identity at a time.
- **Lossless Stacking:** In FSAP-compliant modules, no prior absorption may be degraded during accumulation.
- **Safety First:** The `IMMUNE` governor must be the final node before any output to prevent recursive collapse.

---

## TODO / Roadmap
- [ ] Implement actual `FluidBuf` analysis in `MetricCollector`.
- [ ] Expand `AdamKadmon` to include a full JSON-based contract system.
- [ ] Create 3D visualizations for trait maps in a browser-based overlay.

<!-- ORGANVM:AUTO:START -->
## System Context (auto-generated — do not edit)

**Organ:** ORGAN-II (Art) | **Tier:** standard | **Status:** PUBLIC_PROCESS
**Org:** `organvm-ii-poiesis` | **Repo:** `alchemical-synthesizer`

### Edges
- **Produces** → `unspecified`: creative-artifact
- **Consumes** ← `ORGAN-I`: theory-artifact

### Siblings in Art
`core-engine`, `performance-sdk`, `example-generative-music`, `metasystem-master`, `example-choreographic-interface`, `showcase-portfolio`, `archive-past-works`, `case-studies-methodology`, `learning-resources`, `example-generative-visual`, `example-interactive-installation`, `example-ai-collaboration`, `docs`, `a-mavs-olevm`, `a-i-council--coliseum` ... and 14 more

### Governance
- Consumes Theory (I) concepts, produces artifacts for Commerce (III).

*Last synced: 2026-03-08T20:11:34Z*

## Session Review Protocol

At the end of each session that produces or modifies files:
1. Run `organvm session review --latest` to get a session summary
2. Check for unimplemented plans: `organvm session plans --project .`
3. Export significant sessions: `organvm session export <id> --slug <slug>`
4. Run `organvm prompts distill --dry-run` to detect uncovered operational patterns

Transcripts are on-demand (never committed):
- `organvm session transcript <id>` — conversation summary
- `organvm session transcript <id> --unabridged` — full audit trail
- `organvm session prompts <id>` — human prompts only


## Active Directives

| Scope | Phase | Name | Description |
|-------|-------|------|-------------|
| system | any | prompting-standards | Prompting Standards |
| system | any | research-standards-bibliography | APPENDIX: Research Standards Bibliography |
| system | any | research-standards | METADOC: Architectural Typology & Research Standards |
| system | any | sop-ecosystem | METADOC: SOP Ecosystem — Taxonomy, Inventory & Coverage |
| system | any | autopoietic-systems-diagnostics | SOP: Autopoietic Systems Diagnostics (The Mirror of Eternity) |
| system | any | cicd-resilience-and-recovery | SOP: CI/CD Pipeline Resilience & Recovery |
| system | any | cross-agent-handoff | SOP: Cross-Agent Session Handoff |
| system | any | document-audit-feature-extraction | SOP: Document Audit & Feature Extraction |
| system | any | essay-publishing-and-distribution | SOP: Essay Publishing & Distribution |
| system | any | market-gap-analysis | SOP: Full-Breath Market-Gap Analysis & Defensive Parrying |
| system | any | pitch-deck-rollout | SOP: Pitch Deck Generation & Rollout |
| system | any | promotion-and-state-transitions | SOP: Promotion & State Transitions |
| system | any | repo-onboarding-and-habitat-creation | SOP: Repo Onboarding & Habitat Creation |
| system | any | research-to-implementation-pipeline | SOP: Research-to-Implementation Pipeline (The Gold Path) |
| system | any | security-and-accessibility-audit | SOP: Security & Accessibility Audit |
| system | any | session-self-critique | session-self-critique |
| system | any | source-evaluation-and-bibliography | SOP: Source Evaluation & Annotated Bibliography (The Refinery) |
| system | any | stranger-test-protocol | SOP: Stranger Test Protocol |
| system | any | strategic-foresight-and-futures | SOP: Strategic Foresight & Futures (The Telescope) |
| system | any | typological-hermeneutic-analysis | SOP: Typological & Hermeneutic Analysis (The Archaeology) |

Linked skills: evaluation-to-growth


**Prompting (Google)**: context 1M tokens (Gemini 1.5 Pro), format: markdown, thinking: thinking mode (thinkingConfig)

<!-- ORGANVM:AUTO:END -->


## ⚡ Conductor OS Integration
This repository is a managed component of the ORGANVM meta-workspace.
- **Orchestration:** Use `conductor patch` for system status and work queue.
- **Lifecycle:** Follow the `FRAME -> SHAPE -> BUILD -> PROVE` workflow.
- **Governance:** Promotions are managed via `conductor wip promote`.
- **Intelligence:** Conductor MCP tools are available for routing and mission synthesis.
