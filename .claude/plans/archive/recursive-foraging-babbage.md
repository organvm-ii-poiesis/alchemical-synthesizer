# THERE + BACK AGAIN: Alchemical Synthesizer Roadmap to Omega

## Context

The Alchemical Synthesizer has been built in rapid phases from initial commit to Phase 3B. The codebase is substantial (~20K LOC SC, ~3K LOC web, ~25K LOC Pd, plus classes) and boots cleanly with a working demo patch. But several subsystems are placeholder/partial, documentation has drifted from reality, and no end-to-end integration testing exists. This roadmap provides the **macro→micro→macro** path from current state to OMEGA: a fully operational, documented, performable instrument.

---

## MACRO VIEW: Where We Are

### Current State Audit

| Layer | Status | Evidence |
|-------|--------|----------|
| **SC DSP (60+ .scd)** | **~85% real** | 10 synthesis engines are full SynthDefs. 46 FX are real. Modular suite is real. Make Noise clones are real. |
| **SC Classes (6 .sc)** | **Complete** | AdamKadmon, BridgeRouter, FSAP, BrahmaScale, BrahmaMPE, BrahmaModBus — all functional |
| **Metrics (11_metrics.scd)** | **Placeholder** | 3 of 4 metrics return `rrand()` with TODOs. Only `measureStress` (CPU) is real |
| **NRT Renderer (13_nrt)** | **Stub** | `Score.recordNRT(...)` commented out — "would go here" |
| **CHRONOS Sequencer** | **~90% real** | Core, clock, tracks, MIDI, automation all have real logic. Scenes, song mode, undo structures exist |
| **Presets (28_presets)** | **Complete** | Save/load/morph/project/undo all implemented with OSC responders |
| **Recording (28_recording)** | **Complete** | Multi-track, punch-in/out, bounce, WAV export all implemented |
| **Web Visual Cortex** | **Complete** | Organism viz (p5.js), Canvas patching UI (cortex/), Golem UI, REST API, WebSocket bridge |
| **Web Canvas (Phase 3)** | **Complete** | Module browser, drag-drop canvas, connection drawing, param editors (7 components, ~2K LOC) |
| **PD Canvas (Phase 3B)** | **Complete** | GOP abstractions: brahma_module, brahma_route, brahma_palette, brahma_canvas |
| **PD Faceplates** | **Partial** | faceplate_14/18/24 and golem_faceplate exist but are simple templates |
| **OSC Bridge** | **Fixed** | oscformat inserted, /pd route added, bidirectional SC↔PD working |
| **Python tools** | **Minimal** | Only validate_audio.py exists |
| **README.md** | **Stale** | Missing Phases 2/3/3B, PD Canvas, Web Canvas, correct LOC counts, module counts inaccurate |
| **CLAUDE.md** | **Mostly current** | A few stale elements (PD patch count "8 patches", no Phase 3/3B mention) |
| **Demo Patch** | **Working** | Prima Materia + MOIRAI + Euclidean + Lorenz + Reverb — auto-plays on boot |

### What's Missing for Omega

1. **Real metrics** — Coherence, fidelity, entropy are random numbers
2. **Real NRT rendering** — Score.recordNRT not implemented
3. **Integration testing** — No automated way to verify SC↔PD↔Web pipeline
4. **Example compositions** — Only 1 demo patch; no user-facing examples
5. **Performance documentation** — No guide for actually performing with the system
6. **README accuracy** — Drifted significantly from implementation reality
7. **Golem SynthDef warnings** — `golem_lfo` and `golem_reverb` not found (non-blocking but messy)

---

## MICRO VIEW: Milestones & Tasks

### MILESTONE 1: VERITAS — Truth in Documentation
**Goal**: README and CLAUDE.md accurately reflect the system as built.

#### 1.1 Update README.md
- **File**: `README.md`
- Update "Technology Stack" section:
  - SC LOC: ~20,000 across 60+ files (not ~18,000)
  - PD: 12 patches (8 original + 4 canvas/) not "8 patches"
  - Web: Visual Cortex + Canvas + Golem UI (~3K LOC)
- Add "Phases Completed" section documenting the build history:
  - Phase 0: Infrastructure, organisms, classes
  - Phase 1: Expansion (engines, FX, modular, Make Noise, Elektron, generative)
  - Phase 2: VIVIFICATION (module registry, voice manager, Cortex UI, DAEMON-CHRONOS bridge)
  - Phase 3: CANVAS Web (browser-based visual patching)
  - Phase 3B: CANVAS PD (Pd-native GOP visual patching)
- Update "Quick Start" to mention:
  - `brahma/pd/canvas/brahma_canvas.pd` as an entry point (in addition to main.pd)
  - `http://localhost:3000/cortex` for the Canvas web UI
  - `http://localhost:3000/golem` for the Golem UI
- Update module counts with verified SynthDef tallies from source:
  - Synthesis Engines: 10 (confirmed)
  - FX: 49 (README says 46 — actually 7 dynamics + 5 EQ + 6 distortion + 8 modulation + 6 spatial + 6 spectral + 11 time)
  - Make Noise: 34 SynthDefs (README says ~30 — actually 4 functions + 9 filters + 6 time + 6 oscillators + 9 utilities)
  - Standard Modular: 56 (README says ~53 — actually 6 osc + 6 filter + 5 amp + 6 env + 6 mod + 6 clock + 3 seq + 18 util)
  - Elektron: 11 (README says ~15 — actually 6 machines + 5 octatrack)
  - Generative: 9 (README says 9 — correct, 8 modules + 1 sequencer)
  - Interaction: 9 (README says ~10 — actually 5 controllers + 4 sensors)
  - Total SynthDefs: 234 (README says ~234 — coincidentally correct!)
- Fix symlink paths in installation (currently shows `~/Library/Application Support/SuperCollider/Extensions/` but MEMORY.md says `~/.local/share/SuperCollider/Extensions/`)
- Add mention of Golem web UI at `/golem`
- Add "PD Canvas" section under Quick Start

#### 1.2 Update CLAUDE.md Stale Elements
- **File**: `CLAUDE.md`
- Update PD section: "8 patches" → "12 patches (8 legacy + 4 canvas/)"
- Add Phase 3/3B to "Common Development Tasks" or architecture notes
- Add `brahma/pd/canvas/` to the file/directory references
- Add `~pd_bridge` to the "Global State" section
- Note that osc_bridge.pd now has `oscformat` in the outgoing chain

### MILESTONE 2: METRON — Real Measurement
**Goal**: Replace placeholder metrics with actual signal analysis.

#### 2.1 Implement Real Coherence Measurement
- **File**: `brahma/sc/11_metrics.scd`
- Replace `rrand(0.4, 0.95)` with spectral centroid variance analysis
- Use `RunningSum` + `FFT` + `SpecCentroid` (all built into SC, no plugins needed)
- Measure over a short window (~0.5s), compute variance of centroid → map to 0-1

#### 2.2 Implement Real Fidelity Measurement
- **File**: `brahma/sc/11_metrics.scd`
- Replace `0.85` constant with cross-correlation
- Use `Convolution2` or `BufRd` comparison between source and output buffers
- Return normalized correlation coefficient (0-1)

#### 2.3 Implement Real Entropy Measurement
- **File**: `brahma/sc/11_metrics.scd`
- Replace `rrand(3.0, 8.0)` with Shannon entropy of spectral bins
- Use `FFT` → `UnpackFFT` → histogram of bin magnitudes → entropy formula
- Alternative: use `SpectralEntropy` if sc3-plugins available, else manual calculation

#### 2.4 Wire Metrics to Visual Cortex
- Ensure `~metric_collector` results feed into `~visual_cortex` broadcasts
- Add OSC responder `/brahma/metrics/measure` to trigger on-demand measurement

### MILESTONE 3: SPECIMEN — Working NRT Pipeline
**Goal**: Offline rendering actually produces WAV files.

#### 3.1 Complete NRT Renderer
- **File**: `brahma/sc/13_nrt_renderer.scd`
- Implement `Score.recordNRT(...)` call with proper server options
- Add input buffer allocation, processing chain, and output write
- Test with a simple sine→relinquished→output pipeline
- Add OSC responder `/brahma/nrt/render` for remote triggering

### MILESTONE 4: GOLEM CLEANUP — Resolve SynthDef Warnings
**Goal**: Clean boot with zero warnings.

#### 4.1 Fix Missing Golem SynthDefs
- **Files**: `brahma/sc/15_golem_fx.scd` or `brahma/sc/15_golem.scd`
- Either define `\golem_lfo` and `\golem_reverb` SynthDefs
- Or remove the references that try to instantiate them
- Verify: boot test shows zero warnings

### MILESTONE 5: EXEMPLAR — Example Compositions
**Goal**: Provide 2-3 standalone example patches users can study and perform.

#### 5.1 Create Example: Drone Meditation
- **File**: `brahma/sc/examples/01_drone_meditation.scd` (new)
- Uses: Quintessence (additive) + Nebula (granular) + Aether spatial FX
- Modulation: Lorenz attractor slowly evolving harmonics
- Duration: Self-sustaining, user stops manually

#### 5.2 Create Example: Rhythmic Machine
- **File**: `brahma/sc/examples/02_rhythmic_machine.scd` (new)
- Uses: Golem percussion + CHRONOS sequencer + Euclidean patterns
- Demonstrates: Track creation, pattern editing, live parameter changes

#### 5.3 Create Example: Parasitic Absorption
- **File**: `brahma/sc/examples/03_parasitic_absorption.scd` (new)
- Uses: Relinquished binding + Proteus emulation + FSAP stacking
- Demonstrates: The core organism model — absorb, mutate, re-express

### MILESTONE 6: PRAXIS — Integration Smoke Test
**Goal**: Automated verification that all layers communicate.

#### 6.1 SC Boot Test Script
- **File**: `tools/boot_test.sh` (new)
- Runs `timeout 45 sclang loader.scd`
- Greps for "BRAHMA SYSTEM ONLINE" and zero "ERROR" lines
- Exit code 0 = pass, 1 = fail

#### 6.2 OSC Round-Trip Test
- **File**: `tools/osc_test.py` (new)
- Sends `/brahma/modules/list` to port 57120
- Listens on 57122 for `/brahma/registry/module` responses
- Verifies module count > 0
- Tests `/brahma/module/create` → `/brahma/module/set` → `/brahma/module/free` cycle

---

## MACRO VIEW: The Return — What Omega Looks Like

When all milestones are complete, the Alchemical Synthesizer reaches OMEGA:

| Dimension | Omega State |
|-----------|-------------|
| **DSP** | 234+ SynthDefs, all real, all verified by boot test |
| **Metrics** | Real-time coherence, fidelity, entropy from actual signal analysis |
| **Rendering** | NRT pipeline produces specimen WAV files offline |
| **Documentation** | README accurate, CLAUDE.md current, 3 example compositions |
| **Integration** | SC↔PD↔Web all communicating, verified by automated tests |
| **Performance** | Demo patch + 3 examples demonstrate the full organism model |
| **Boot** | Clean — zero errors, zero warnings |

### Phase Ordering (recommended)

```
M1:VERITAS ──→ M4:GOLEM ──→ M2:METRON ──→ M3:SPECIMEN ──→ M5:EXEMPLAR ──→ M6:PRAXIS
 (docs)        (cleanup)     (metrics)     (NRT render)    (examples)      (testing)
```

M1 first because accurate docs inform all other work. M4 next because it's a quick win (clean boot). M2 before M3 because metrics feed into the NRT pipeline. M5 before M6 because examples serve as test fixtures for the integration tests.

---

## README.md Update Spec

### Sections to Change

1. **Badge URLs**: Remote is `4444J99/alchemical-synthesizer` but push redirects to `organvm-ii-poiesis/`. Badges reference `4444J99` — keep as-is (GitHub redirects work for badges)
2. **Quick Start > Installation**: Fix symlink path to `~/.local/share/SuperCollider/Extensions/`
3. **Quick Start > Running the Ritual**: Add step for Canvas web UI and PD Canvas
4. **Module Counts table**: Verify against actual registration postln messages from boot
5. **Technology Stack**: Update LOC counts, PD patch count, add Web Canvas/Golem UI
6. **Add new section "Development Phases"**: Timeline of completed work
7. **Add new section "Control Surfaces"**: Describe the 3 ways to interact (SC IDE, PD Canvas, Web Canvas)
8. **Infrastructure section**: Add Module Registry, PD Bridge, Preset Management
9. **Contributing link**: Verify `.github/CONTRIBUTING.md` exists (it does)

### Sections That Are Fine
- Architecture (7-Stage Organism) — still accurate
- Organisms table — still accurate
- Synthesis Engines table — still accurate (10 engines confirmed)
- License — correct (MIT)
- Closing quote — keep

---

## Implementation Order for This Session

**What we'll do NOW** (this session, per user request):

1. Update `README.md` with all stale corrections (Milestone 1.1)
2. Stage all, commit, push to origin

**What remains for future sessions** (Milestones 1.2 through 6):
- CLAUDE.md stale fixes (M1.2)
- Real metrics (M2)
- NRT renderer (M3)
- Golem SynthDef cleanup (M4)
- Example compositions (M5)
- Integration tests (M6)

---

## Verification

1. `git diff README.md` — review all changes before commit
2. Visual inspection: open README.md in browser, verify Mermaid diagram renders
3. Cross-reference module counts against boot log output
4. Verify all links (CLAUDE.md, CONTRIBUTING.md, LICENSE) resolve correctly
