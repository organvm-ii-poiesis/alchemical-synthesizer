# Golem: Alchemical Percussion Organism

## Context

The `docs/absorb-alchemize/` directory contains a 7-iteration drum machine (107 features total, 85% implemented in final TSX). The user wants to **absorb** all features — implemented and missing — into the Brahma system as a new 7-Stage Organism called **Golem** (the animated clay body, inscribed with sigils).

Golem is a percussion creature that follows the same architectural contract as Relinquished (`04_relinquished.scd`), registers with AdamKadmon, and can absorb traits from other organisms via FSAP. Its UI spans both the web Visual Cortex (full sequencer/patchbay) and a PD faceplate (stripped performance control). Generative patterns use SC-native Pbind/Pdef with optional Claude API integration in the web layer.

---

## Phase A: SuperCollider DSP Engine

### A.1: Rewrite `brahma/sc/15_percussion_suite.scd` (~250 lines)

Replace the 5 bare SynthDefs with 6 full-featured synthesis voices matching the TSX's `createSynth()` data model. Add the missing `\drum_additive`.

Each voice gets: oscillator section (type, freq, detune), filter (LP/HP/BP/Notch via `Select.ar`, cutoff, res, envAmt), amp ADSR, filter ADSR, plus type-specific params (FM ratio/index, additive harmonics[6], noise amount, wavefold amount, karplus decay). All include `outBus`, `inBus`, `velocity`, `gate`.

### A.2: New `brahma/sc/15_golem_fx.scd` (~120 lines)

4 FX SynthDefs for per-track chain:
- `\golem_reverb` (FreeVerb, mix/decay)
- `\golem_delay` (CombL, time/feedback/mix)
- `\golem_bitcrush` (Decimator, amount)
- `\golem_drive` (tanh waveshaping, amount)

Chain order: voice -> drive -> bitcrush -> delay -> reverb -> track bus

### A.3: New `brahma/sc/15_golem_patterns.scd` (~200 lines)

- 9 factory engine presets matching TSX: kick808, snare, clap, hihatClosed, hihatOpen, tom, rim, fmBell, pluck (stored as Dictionaries mapping to SynthDef args)
- User preset save/load (Dictionary persistence)
- SC-native generative patterns via Pdef/Pbind for algorithmic drums
- `generateVariation` — mutate a pattern with configurable amount (probabilistic step toggling, velocity jitter)
- `generateFill` — Euclidean rhythm-based fill generator for last N steps

### A.4: New `brahma/sc/15_golem_sequencer.scd` (~300 lines)

**Step Sequencer** (Tdef on TempoClock for sub-ms accuracy):
- 8 tracks, 16-64 variable steps per track, per-step velocity
- Swing per track (offset odd steps)
- Per-step parameter locks (Dictionary of param->value overrides)
- Automation lanes (per-step parameter curves)
- Humanization: velRand, timeRand, pitchRand, probability — applied at trigger time
- Pattern copy/paste, scene save/recall
- Mute groups (A-D), solo, mute per track
- MIDI recording (timestamped events list) and MIDI file export (binary encoding)

**LFO Engine** — SynthDef `\golem_lfo`:
- 3 per track (24 total), control-rate
- 5 shapes via `Select.kr`: sine, square, saw, tri, random
- Rate + phase params, output to control bus

**Modulation Matrix** (language-side routing):
- 11 sources: lfo1-3, env, random, stepPos, velocity, xyPadX, xyPadY, synthA, synthB
- 15 destinations: synthA/B freq, synthA/B filter cutoff/res, synthA/B ampEnv decay, blend amounts (4), pan, drive, delayMix, reverbMix, bitcrush
- Bipolar amounts (-1 to +1), applied at trigger time by reading control bus values

### A.5: New `brahma/sc/15_golem.scd` (~400 lines)

The Golem organism — 7-stage SynthDefs following Relinquished's pattern exactly:

| Stage | SynthDef | Purpose |
|-------|----------|---------|
| IA | `\golem_ia` | Input selection (external audio for sample capture/sidechain), gain, pad, HP, limiter, clip detect |
| EG | Language-side | Single-equip state machine (idle/equipped/absorbing) |
| BC | `\golem_bc` | Multi-buffer binding — 8 track buffers, write/read with freeze/jitter, sample trim (start/end/pitch/reverse) |
| AE | `\golem_ae` | FFT analysis (SpecCentroid, SpecFlatness, Amplitude, Onsets) + onset density, outputs to 4 CV buses |
| TE | `\golem_te` | Multi-engine mixer: 4 sources (synthA/B, sampleA/B) with blend, cross-mod (A->B pitch/filter/amp), ring mod, drive |
| PR | `\golem_pr` | Protection/Reflection (4 modes: SACRIFICE/INVERT/RING/MUTE), feedback limiting, fault detect |
| RR | `\golem_rr` | Bypass toggle, level (dB), pan, routes through IMMUNE governor |

**Language-side `~GOLEM` controller:**
- `tracks`: Array[8] with id, name, engine state, blend, mute/solo/muteGroup, buses
- `register`: Registers with `~BRAHMA_REGISTRY` using AdamKadmon-valid trait schema (spectral_profile, temporal_topology, modulation_graph, performance_response)
- `allocate`: Dynamically allocates audio + control buses per track from `~SC_BUS`
- `absorb`/`evict`: FSAP-compliant trait absorption from other organisms (maps donor spectral profile to drum params)
- OSC responders for all `/golem/*` messages (collocated with organism, not in Visual Cortex)

---

## Phase B: OSC Protocol

### B.1: Message Specification

**SC -> Web (port 57122):**
```
/golem/step              int:stepIndex
/golem/track/trigger     int:trackId float:velocity
/golem/track/state       int:trackId int:muted int:solo
/golem/engine/state      int:trackId string:synthType float:freq float:cutoff
/golem/seq/state         int:playing float:tempo int:currentStep
/golem/lfo/value         int:trackId int:lfoIdx float:value
/golem/fx/state          int:trackId float:reverb float:delay float:crush float:drive
/golem/organism/update   int:entityId string:"Golem" float:coherence float:entropy
```

**Web -> SC (port 57120):**
```
/golem/transport/play|stop|tempo
/golem/track/select|mute|solo
/golem/engine/param      int:trackId string:path float:value
/golem/step/toggle|velocity|plock
/golem/lfo/param         int:trackId int:lfoIdx string:param float:value
/golem/mod/add|remove|amount
/golem/fx/param          int:trackId string:fx string:param float:value
/golem/preset/load|save
/golem/scene/save|load
/golem/pad/trigger       int:trackId float:velocity
/golem/xy/update         float:x float:y
/golem/mutegroup/toggle  string:group
/golem/gen/variation|fill
```

### B.2: Modify `brahma/sc/14_visual_cortex.scd`

Add `broadcastGolem` method to `~VISUAL_CORTEX` — sends organism state, step position, and per-track levels at 10Hz. Hook into existing `Tdef(\viz_stream)` loop.

---

## Phase C: Web UI (Visual Cortex Expansion)

### Architecture: Vanilla JS modules (no build toolchain)

The existing web layer has no transpiler. Implement as ES modules extending the Express + WebSocket server. Golem UI served at `/golem` alongside existing p5.js viz at `/`.

### New files under `brahma/web/public/golem/`:

| File | Lines (est.) | Purpose |
|------|-------------|---------|
| `index.html` | ~50 | Shell: loads CSS, JS modules, theme container |
| `app.js` | ~300 | Main state management, view router, OSC bridge init |
| `osc-client.js` | ~60 | WebSocket <-> OSC message abstraction |
| `themes.js` | ~80 | 5 themes (midnight, vapor, terminal, arctic, neon) as CSS custom property sets |
| `style.css` | ~400 | All styles using CSS custom properties for theming |
| **Components** | | |
| `components/sequencer.js` | ~250 | Track list, step grid (tap/drag/long-press), transport, copy/paste |
| `components/engine.js` | ~300 | Source tabs, blend mixer, synth/sample editors, FX, humanize, p-lock |
| `components/patchbay.js` | ~250 | SVG bezier patch cables, LFO editors, source/dest nodes, live preview |
| `components/mixer.js` | ~150 | Channel strips (volume fader, pan, mute/solo, VU) |
| `components/automation.js` | ~150 | Parameter selector, per-step bar graph with drag editing |
| `components/perform.js` | ~150 | XY pad, 8 drum pads, scene save/recall |
| **UI primitives** | | |
| `ui/knob.js` | ~80 | Rotary knob (drag up/down, arc indicator) — ported from TSX |
| `ui/slider.js` | ~80 | Horizontal/vertical fader — ported from TSX |
| `ui/step-btn.js` | ~80 | Step button (velocity bar, p-lock dot, tap/drag/long-press) |
| `ui/select.js` | ~40 | Styled dropdown |
| `ui/env-display.js` | ~50 | SVG ADSR polyline |
| `ui/xy-pad.js` | ~70 | 2D touch controller with crosshairs and cursor glow |

### Modify `brahma/web/server.js`

- Add bidirectional OSC: forward `/golem/*` WebSocket messages to SC via UDP port 57120
- Add `/golem` static route serving `public/golem/`

### Optional: Claude API integration

In `components/perform.js`, add a text input that sends a beat description to Claude API, parses the response into pattern data, and forwards to SC via OSC. Gated behind API key configuration.

---

## Phase D: PD Faceplate

### New `brahma/pd/golem_faceplate.pd` (~60 lines)

24HP performance faceplate:
- Row 1: Play/Stop bangs, Record toggle, BPM number box
- Row 2: Track select (8-position hradio)
- Row 3: Mute group toggles (A/B/C/D)
- Row 4: XY simulation (2 sliders -> `/golem/pd/xy`)
- Row 5: 4 macro knobs (selected track key params)
- Row 6: 8 drum pad bangs -> `/golem/pd/trigger`

All messages routed through existing `osc_bridge.pd`.

### Modify `brahma/pd/main.pd`

Add `golem_faceplate` object connected to OSC bridge.

---

## Phase E: Integration

### E.1: Modify `brahma/sc/loader.scd`

Add after existing line 43 (current `15_percussion_suite.scd` load):
```
(root +/+ "15_percussion_suite.scd").load;  // existing, rewritten
(root +/+ "15_golem_fx.scd").load;
(root +/+ "15_golem_patterns.scd").load;
(root +/+ "15_golem_sequencer.scd").load;
(root +/+ "15_golem.scd").load;
```

### E.2: Test Bench (`brahma/sc/12_test_bench.scd`)

Add Golem test suite: voice trigger test (all 6 synth types), sequencer test (4-on-floor 4 bars), single-equip invariant test, IMMUNE passthrough test.

### E.3: Validation (`brahma/sc/10_validation.scd`)

Add `~MEASURE.analyzeGolem` — per-track spectral analysis against factory preset reference vectors.

---

## Implementation Order

```
A.1 Percussion SynthDefs ──┐
A.2 FX SynthDefs ──────────┤ (parallel, no deps)
A.3 Pattern Presets ────────┤
                            ├── A.4 Sequencer + LFO + Mod Matrix
                            ├── A.5 Golem 7-Stage Organism
                            │
                            ├── B.2 Visual Cortex extension
                            │
                            ├── C: Web UI (server.js -> osc-client -> views)
                            │
                            ├── D: PD Faceplate
                            │
                            └── E: Integration (loader, tests, validation)
```

A.1, A.2, A.3 can be done in parallel. Everything else is sequential.

---

## Verification

1. **SC standalone**: Evaluate `loader.scd` — should print `--- BRAHMA SYSTEM ONLINE ---` with no errors. Trigger each drum SynthDef manually.
2. **Sequencer**: Set a pattern, play, verify audio output and `/golem/step` OSC messages on port 57122.
3. **Web UI**: `cd brahma/web && npm start`, open `http://localhost:3000/golem`, verify bidirectional control (toggle steps in browser -> hear audio from SC).
4. **PD**: Open `main.pd`, verify Golem faceplate OSC messages reach SC.
5. **Invariants**: Single-equip (absorb while equipped -> rejected), IMMUNE passthrough (excessive gain -> limited), lossless stacking (FSAP accumulate preserves prior traits).

---

## Estimated Scope

- **22 new files**, **7 modified files**
- **~3,900 lines** of new code
- **SC**: ~1,270 lines (5 files)
- **Web**: ~2,540 lines (16 files)
- **PD**: ~60 lines (1 file)
