# Alchemical Synthesizer: Mega Feature Expansion Plan

## Context

The Alchemical Synthesizer currently has 46 SynthDefs across 21 SC files, with only 2 complete 7-stage organisms (Relinquished, Golem). It has no microtonality, no MIDI/MPE input, no wavetable synthesis, only 4 FX (drive, bitcrush, delay, reverb), and a percussion-only sequencer. This plan expands it into a comprehensive modular synthesis ecosystem covering all 14 requested features.

**Current codebase**: ~3,274 LOC SuperCollider, 8 PD patches, ~10K LOC web UI
**Expansion estimate**: ~20,000+ new LOC across all layers

### Key Decisions
- **Sequencer name**: CHRONOS (Titan of Time)
- **Implementation strategy**: Full sequential, phases 0-9 in dependency order
- **Golem integration**: Chronos subsumes Golem's sequencer (refactored into "drum mode" preset)
- **Make Noise clone fidelity**: Circuit-accurate behavioral models (component-level where feasible)

---

## Phase 0: Foundational Infrastructure

New files that all subsequent features depend on. Must be built first.

### 0A. Microtonality System
**Files**: `brahma/sc/BrahmaScale.sc`, `brahma/sc/02_microtonality.scd`

- `BrahmaScale` class: stores scale as ratio array, factory methods for 12-TET, Just Intonation, Pythagorean, Bohlen-Pierce, Wendy Carlos Alpha/Beta/Gamma, Bohlen-Pierce, Gamelan Slendro/Pelog, Harry Partch 43-tone, quarter-tone, arbitrary user-defined
- Scala `.scl` file parser for importing community tuning files
- `degreeToFreq(degree, octave, rootHz)` converter
- `quantize(freqHz)` snaps to nearest scale degree
- Per-voice tuning offset support (for MPE pitch bend)
- Global tuning registry in `~BRAHMA_TUNING`
- Extend AdamKadmon trait schema with `tuning_profile` dimension
- OSC: `/brahma/tuning/scale`, `/brahma/tuning/root`, `/brahma/tuning/transpose`

### 0B. MIDI & MPE Infrastructure
**Files**: `brahma/sc/BrahmaMPE.sc`, `brahma/sc/02_midi_mpe.scd`

- `BrahmaMPE` class: MPE zone manager (lower zone ch 2-16, upper zone configurable)
- Voice allocator with per-note: pitch bend (±48 semitones), pressure (aftertouch), slide (CC74), velocity, release velocity
- MIDIFunc-based input handlers for noteOn/Off, bend, pressure, CC
- MIDI output for external hardware sequencing
- MIDI clock receive and send
- MIDI Learn system: any CC → any parameter mapping
- Web MIDI API bridge (browser → WebSocket → SC)
- OSC: `/brahma/midi/route`, `/brahma/midi/mpe/config`, `/brahma/midi/learn`

### 0C. Universal Modulation & Patch Bay
**Files**: `brahma/sc/BrahmaModBus.sc`, `brahma/sc/08_patch_bay.scd`

- **Audio-rate modulation** replacing Golem's trigger-time-only approach
- `BrahmaModBus` class: allocates control buses on demand (256 bus pool)
- Universal source/destination registry — any module output → any module input
- Per-route attenuverter (amount, offset, scale, curve)
- `\patch_bay_mod` SynthDef: reads CV bus, scales, writes to destination bus
- Every parameter on every SynthDef gets a corresponding `cvBus` arg
- Visual Cortex integration: `/brahma/mod/value` broadcasts at 10Hz
- OSC: `/brahma/patch/connect`, `/brahma/patch/disconnect`, `/brahma/patch/attenuvert`

### 0D. Expanded Infrastructure
**Modify**: `brahma/sc/01_infrastructure.scd`

- Increase `numAudioBusChannels` from 1024 → 2048
- Increase `numControlBusChannels` from 4096 → 8192
- Add per-organism sub-group creation helper to `~SC_GRP`
- Add `~SC_GRP.createOrganismGroups(\name)` for dynamic organism registration

---

## Phase 1: CHRONOS — The Master Sequencer

**Named after the Titan primordial god of Time — the inexorable force that governs all rhythm, sequence, and temporal unfolding. Chronos devours and regenerates, perfectly mirroring a sequencer that cycles, mutates, and drives all organisms through time.**

**Files**: `brahma/sc/09_chronos_core.scd`, `09_chronos_clock.scd`, `09_chronos_tracks.scd`, `09_chronos_automation.scd`, `09_chronos_midi.scd`

### Core Architecture
- **128 tracks** (dynamically allocated), each independently configurable
- **Track types**: Note, Drum, CV, Gate, Chord, Arpeggio
- **1-128 steps** per track (polymetric — different lengths run simultaneously)
- **Polyrhythmic clock**: independent clock division per track (1/1 through 1/64)
- Uses SC's `TempoClock` with per-track `Routine` instances

### Per-Step Data
- `active` (trigger), `note` (MIDI note or scale degree), `velocity` (0-127)
- `length` (gate duration in ticks), `probability` (0-100%)
- `condition`: always, fill, notFill, 1:2, 2:3, 3:4, A:B patterns, first, last, pre (Elektron-style)
- `microTiming`: -50% to +50% of step length (nudge)
- `ratchet`: 1-8 retriggers within a single step
- `transpose`: per-step semitone offset
- `pLocks`: Dictionary of parameter name → value overrides (ANY connected parameter)

### Advanced Features
- **Song mode**: pattern chaining with loop counts, conditional branching (jump-on-fill, etc.)
- **Scene system**: 8 scenes, each storing complete parameter state; crossfade/morph between scenes (0.0-1.0)
- **Undo/redo**: 32-level deep-copy state snapshots
- **Scale quantization**: all notes pass through BrahmaScale before output
- **MIDI output**: route any track to external MIDI channel/port
- **Copy/paste**: track-level patterns, step ranges, parameter lock sets

### Integration (Chronos Subsumes Golem)
- Chronos **replaces** Golem's sequencer entirely — Golem's `15_golem_sequencer.scd` is refactored into Chronos with a "drum mode" preset that replicates Golem's current 8-track/16-step percussion workflow
- Golem retains its 7-stage organism, percussion suite, FX chain, and pattern presets — only the sequencer engine moves to Chronos
- All organisms register as Chronos targets via `~CHRONOS.registerTarget(\name, synthDef, outBus)`
- Triggers flow: Chronos → target organism's TE stage (or direct SynthDef spawn)
- Golem's existing OSC addresses (`/golem/step/*`, `/golem/transport/*`) are maintained as aliases that route to Chronos internally

### Web UI
- New `/chronos` route with views: Piano Roll, Step Grid, Song Arranger, Scene Morph, Automation Lanes
- Piano roll widget: horizontal timeline × vertical pitch, drag-to-paint, velocity overlay
- Parameter lock editor: expandable lanes per parameter

### PD UI
- `chronos_control.pd` (24HP): transport, track select, step grid, p-lock encoders

---

## Phase 2: Synthesis Engine Suite

**Files**: `brahma/sc/16_synthesis_engines.scd` (and supporting class files)

Each engine is a **complete 7-stage organism** (IA→EG→BC→AE→TE→PR→RR) with:
- Standard args: `outBus`, `inBus`, `freq`, `gate`, `vel`
- `cvBus` args for every parameter (universal modulation)
- MPE-compatible: per-voice pitch bend, pressure, slide
- Microtonal: accepts Hz via BrahmaScale conversion
- AdamKadmon trait map registration
- FSAP-compatible absorption targets

### 2A. PRIMA MATERIA — Subtractive Synthesis
- 3 oscillators (saw, pulse w/ PWM, square, triangle, sine, super-saw) + sub osc
- Hard sync between osc 1 & 2, ring modulation
- Multimode filter: Moog ladder LP24, LP12, HP, BP, Notch, Comb, Allpass
- Dual ADSR envelopes (amp + filter) with key tracking
- Unison with detune spread + drift
- Portamento/glide

### 2B. AZOTH — FM Synthesis (DX7-class)
- 4 operators with configurable algorithms (8 classic algorithms)
- Per-operator: ratio, level, envelope (6-stage), feedback, velocity sensitivity
- Modulation matrix between operators
- Operator waveforms: sine, triangle, saw, square (not just sine)

### 2C. QUINTESSENCE — Additive Synthesis
- 32 harmonics with individual amplitude + phase envelopes
- Harmonic spread, stretch, and shift controls
- Spectral morphing between two harmonic profiles
- Resynthesis from FFT analysis (absorb spectral profile from any source)

### 2D. OUROBOROS — Wavetable Synthesis
- 256-frame wavetable scanning with morphing
- Factory wavetables: basic, PWM, formant, spectral, noise
- User-loadable wavetable buffers (single-cycle WAV import)
- 2D wavetable (X=position, Y=morph between tables)
- FM between wavetable position and oscillator

### 2E. CHRYSOPOEIA — Phase Distortion (CZ-style)
- 8 PD waveforms (sawtooth, square, pulse, resonant saw/pulse/triangle, etc.)
- Dual oscillator with ring modulation
- Phase distortion amount envelope
- DCW (Digital Controlled Waveshape) parameter

### 2F. HOMUNCULUS — Physical Modeling
- **Karplus-Strong** extended (exciter types: noise, impulse, bow)
- **Bowed string** (bow pressure, bow position, string resonance)
- **Blown tube** (breath pressure, embouchure, bore length)
- **Modal synthesis** (bank of resonators with frequency/decay/amplitude per mode)
- **Membrane** (circular membrane model for drum-like sounds)

### 2G. BUCHLAEUS — West Coast Complex Oscillator
- Primary oscillator + modulation oscillator (both with sine/tri/saw/square)
- Through-zero FM with index control
- Timbre modulation (AM + wavefold combined)
- Wavefolder with symmetry and stages (1-8 folds)
- Inspired by Buchla 259 / Make Noise DPO topology

### 2H. LOGOS — Formant Synthesis
- 5 parallel formant filters (vowel resonators)
- Vowel morph: A↔E↔I↔O↔U with continuous interpolation
- Formant frequency/bandwidth/amplitude per filter
- Excitation: glottal pulse, noise, external input
- Choir mode: multiple detuned voices with formant variation

### 2I. TETRAMORPH — Vector Synthesis
- 4 sound sources at compass points (N/S/E/W)
- 2D crossfade via XY position (joystick/pad control)
- Envelope-driven vector path with recordable trajectories
- Each source can be any other synthesis engine

---

## Phase 3: Make Noise Module Clones

**Files**: `brahma/sc/17_make_noise_functions.scd`, `18_make_noise_filters.scd`, `19_make_noise_time.scd`, `20_make_noise_sequencers.scd`, `20_make_noise_oscillators.scd`, `20_make_noise_utilities.scd`

All 28 current Make Noise modules + key retired modules. Organized by function:

### Function Generators & Envelopes
| Module | Clone Name | Key Features |
|--------|-----------|--------------|
| **MATHS** | HERMETIC_DUAL | Dual function gen (envelope/LFO/slew/attenuverter), sum/OR outputs, end-of-cycle/rise triggers, exponential/linear curves |
| **PoliMATHS** | HERMETIC_QUAD | 4-channel MATHS in 20HP, cascading architecture |
| **Function** (retired) | HERMETIC_MONO | Single-channel function generator |
| **Contour** (retired) | HERMETIC_CONTOUR | ASR contour with voltage-controlled shape |

### Oscillators
| Module | Clone Name | Key Features |
|--------|-----------|--------------|
| **DPO** | PRISMATIC_TWIN | Dual oscillator with FM/AM/wavefold, strike input, follow mode |
| **STO** | PRISMATIC_MONO | Basic analog oscillator, sub output, shape control |
| **XPO** | PRISMATIC_STEREO | Stereo oscillator, 6 behaviors (FM, AM, fold, etc.) |
| **MultiWAVE** | PRISMATIC_MULTI | Multi-output waveform with 12 simultaneous outputs |
| **Spectraphon** | SPECTRAL_ORACLE | Dual spectral oscillator, FFT-based resynthesis + analysis |
| **tELHARMONIC** (retired) | HARMONIC_VESSEL | Additive synthesis based on telharmonium, 3 algorithms |

### Filters & Low-Pass Gates
| Module | Clone Name | Key Features |
|--------|-----------|--------------|
| **QPAS** | TETRAPEAK | Quad Peak Animation System, stereo multimode, radiate output |
| **Optomix** | VACTROL_SANCTUM | Dual low-pass gate with vactrol modeling, strike input |
| **LxD** | VACTROL_SHADOW | Dual LPG (low-pass/damped/VCA), 6dB + 12dB channels |
| **QXG** | VACTROL_MATRIX | Quad dynamics gate, 4 independent channels |
| **QMMG** | VACTROL_QUAD | Quad multimode gate (LP/HP/BP/Notch per channel) |
| **Multimod** | RESONANCE_PRISM | Multimode filter: LP/HP/BP/Notch simultaneous outputs |
| **MMG** (retired) | VACTROL_CLASSIC | Multimode gate (LP/HP/BP) with vactrol |
| **FxDf** (retired) | FORMANT_DRIFT | Fixed filter bank |
| **DXG** | VACTROL_DXG | Dual crossfading gate, stereo VCA with crossfade |

### Time-Domain Processors
| Module | Clone Name | Key Features |
|--------|-----------|--------------|
| **Mimeophon** | CHRONOS_ECHO | Micro-looping audio repeater, color/rate/zone/halo controls |
| **Echophon** | CHRONOS_PITCH | Pitch-shifting echo, frozen echoes |
| **Morphagene** | MORPHEUS_TAPE | Microsound tape machine, reel/splice/gene/slide/organize |
| **Phonogene** (retired) | MORPHEUS_PHONO | Granular sampler/looper, splice + micro-sound |
| **Erbe-Verb** (retired) | SPATIAL_ERBE | DSP reverb, absorb/decay/speed/tilt/size, pre-delay |

### Utilities & Mixers (ELIXIR suite — alchemical potions/mixtures)
| Module | Clone Name | Key Features |
|--------|-----------|--------------|
| **modDemix** | ELIXIR_BLEND | Voltage-controlled crossfader/panner/VCA, direct + signal outs |
| **X-PAN** | ELIXIR_COMPASS | Voltage-controlled stereo crossfader/panner |
| **XOH** | ELIXIR_CROWN | Output/headphone module with crossfade |
| **Dynamix** (retired) | ELIXIR_FLUX | Dynamics-controlled mixer (sidechain) |
| **Rosie** (retired) | ELIXIR_GATE | Output with send/return |

### Sequencers & Controllers
| Module | Clone Name | Key Features |
|--------|-----------|--------------|
| **Rene** | CARTESIAN_MAZE | Cartesian sequencer, X/Y/Z axes, snake/skip/states |
| **Pressure Points** | CAPACITIVE_GRID | 4×1 touch plate controller, pressure + position CV per pad |
| **PrssPNT** | CAPACITIVE_MINI | Compact touch-to-CV (updated Pressure Points) |
| **TEMPI** | TEMPORAL_ORACLE | Clock module, 6 independent clock outputs, tap tempo, ratios |

### Random & Chaos
| Module | Clone Name | Key Features |
|--------|-----------|--------------|
| **Wogglebug** | CHAOS_ORACLE | Random voltage generator: smooth, stepped, woggle, clock, burst |

### Complete Instruments
| Module | Clone Name | Key Features |
|--------|-----------|--------------|
| **Strega** | STREGA_VESSEL | Delay/filter instrument with touch, built-in spring tank |
| **0-COAST** | COAST_ZERO | Semi-modular monosynth (STO + Optomix + MATHS + Dynamix) |
| **Bruxa** | BRUXA_SIGIL | Analog stereo delay + touch control |

### Circuit-Accurate Modeling Approach
All Make Noise clones target **circuit-accurate behavioral models**:
- Component-level modeling where feasible (vactrol photoresistor curves, transistor saturation)
- Measured response curves from actual hardware (rise/fall times, frequency responses)
- Non-ideal behaviors preserved: vactrol "personality" (random decay variance per instance), oscillator drift, filter self-oscillation character
- CPU budget: accept higher CPU cost for authenticity (use NRT rendering for complex patches if needed)

### Vactrol Modeling (Critical for all LPG/gate modules)
All LPG/gate modules use a `vactrol_model` function:
- Non-linear response curve (slow attack ~5ms, long decay ~50-500ms with variance)
- Per-instance random decay time (vactrol "personality") using `Rand` at instantiation
- Logarithmic amplitude response matching real CdS photoresistor behavior
- Temperature-dependent response simulation (subtle, CV-controllable)
- Implemented as a control-rate UGen wrapper with `\vactrol_response` SynthDef

---

## Phase 4: Complete FX Rack

**Files**: `brahma/sc/21_fx_dynamics.scd`, `21_fx_eq.scd`, `22_fx_time.scd`, `22_fx_modulation.scd`, `22_fx_distortion.scd`, `22_fx_spectral.scd`, `22_fx_spatial.scd`

All FX follow standard interface: `|inBus, outBus, mix=0.5, bypass=0|` + specific params. All parameters have `cvBus` args for modulation.

### Dynamics — CRUCIBLE (alchemical melting vessel for purification)
- Compressor (threshold, ratio, attack, release, knee, makeup, sidechain input)
- Limiter (ceiling, lookahead, release)
- Gate (threshold, range, attack, hold, release, sidechain)
- Expander (threshold, ratio, attack, release)
- Sidechain ducker (external input → ducking amount)

### EQ — PHILOSOPHERS_PRISM (refracting sound into spectral components)
- 4-band parametric EQ (freq, gain, Q per band)
- 8-band graphic EQ
- High/low shelf with variable slope
- Tilt EQ (single-knob tone control)
- Dynamic EQ (frequency-dependent compression)

### Time-Based — AION (Greek deity of eternal/cyclical time)
- Stereo delay (independent L/R times, cross-feedback, ping-pong mode)
- Tape delay (wow/flutter, saturation, degradation, variable speed)
- Multi-tap delay (up to 8 taps, per-tap level/pan/feedback/filter)
- Granular delay (grain size, density, pitch, position randomization)
- Reverb: Room, Hall, Plate, Spring, Shimmer (octave-shifted feedback)
- Convolution reverb (impulse response loader)
- Freeze reverb (infinite sustain capture)

### Modulation FX — MAELSTROM (primordial whirlpool of transformation)
- Chorus (rate, depth, voices, stereo spread)
- Flanger (rate, depth, feedback, manual offset)
- Phaser (rate, depth, stages, feedback, stereo)
- Vibrato (rate, depth, delay)
- Tremolo (rate, depth, shape, stereo phase offset)
- Ring modulator (carrier freq, mix)
- Frequency shifter (shift amount in Hz, feedback)
- Rotary speaker (speed: slow/fast, acceleration curve)

### Distortion — CALCINATION (alchemical burning/purification by fire)
- Overdrive (gain, tone, asymmetry)
- Fuzz (gain, gate, octave-up mode)
- Waveshaper (transfer function: tanh, sine-fold, cheby polynomial, custom)
- Tube saturation (drive, bias, sag)
- Decimation (sample rate + bit depth reduction — upgrade existing bitcrush)
- Clipper (hard/soft, threshold, ceiling)

### Spectral — SOLVE_ET_COAGULA (dissolve and recombine — core alchemical maxim)
- Vocoder (16-band, carrier/modulator, band levels)
- Spectral freeze (capture and sustain spectrum indefinitely)
- Spectral blur (smear frequency bins, time constant)
- Pitch shifter (semitones, formant preservation)
- Harmonizer (intervals, up to 4 voices, scale-aware)
- Spectral filtering (draw frequency response, FFT-based)

### Spatial — AETHER (the fifth element, the celestial medium)
- Stereo width (mid/side processing, width 0-200%)
- Auto-pan (rate, depth, shape, sync-to-clock)
- Haas effect (delay one channel 1-40ms for width)
- Mid/Side encoder/decoder
- Binaural panner (HRTF-based 3D positioning)

---

## Phase 5: Standard Modular Module Coverage

**Files**: `brahma/sc/23_modular_oscillators.scd`, `23_modular_filters.scd`, `23_modular_amplifiers.scd`, `23_modular_envelopes.scd`, `23_modular_modulation.scd`, `24_modular_utilities.scd`, `24_modular_clock.scd`, `24_modular_sequencers.scd`

These are standalone modular-style building blocks (not full 7-stage organisms) that connect via the universal patch bay.

### Oscillators — ATHANOR (the alchemical furnace, source of all heat/energy)
- VCO: saw/pulse/tri/sine with CV inputs for freq, PWM, sync, FM
- Super oscillator: unison with spread, detune, fat/thin
- Sub oscillator: -1 or -2 octaves, square/sine
- Noise: white, pink, red/brown, blue, violet, crackle
- Dust: random impulse generator with density control
- Chaotic oscillator: Lorenz, Henon, Standard map

### Filters — ALEMBIC (the distillation vessel, separating essences)
- Ladder filter (Moog-style, 4-pole LP with resonance → self-oscillation)
- State variable filter (simultaneous LP/HP/BP/Notch outputs)
- Comb filter (positive/negative feedback, pitch-tracked)
- Allpass filter (for phase effects)
- Formant filter (parallel resonators for vowel sounds)
- Diode ladder (303-style with accent circuit)

### Amplifiers — ANIMA (the life force, breath of the soul)
- VCA: linear and exponential response
- Low-pass gate (vactrol modeled, combines VCA + VCF)
- Mixer: 4-channel with level + pan per channel
- Crossfader: A/B with CV control
- Ring modulator

### Envelopes — NIGREDO (the blackening, first alchemical stage of transformation)
- ADSR: standard 4-stage
- AD: attack-decay (trigger mode)
- AR: attack-release (gate mode)
- Multi-stage: up to 8 segments with loop points
- Function generator: rise/fall with shape + cycle mode (MATHS-style)
- Looping envelope: AR with auto-retrigger

### Modulation Sources — AQUA_VITAE (the water of life, animating essence)
- LFO: sine/tri/saw/square/S&H/random-walk, with sync and reset inputs
- Sample & Hold: triggered sampling with slew
- Track & Hold: continuous sampling until trigger
- Slew limiter: independent rise/fall rates
- Random: smooth (LFNoise1), stepped (LFNoise0), Lorenz, Gaussian
- Envelope follower: audio → CV with attack/release

### Utilities — GRIMOIRE (the book of spells and recipes)
- Multiple (1→4 signal splitter)
- Attenuverter (bipolar scaling with offset)
- Precision adder (CV summing with 1V/oct tracking)
- Sequential switch (rotate between N outputs on trigger)
- Analog switch (CV-controlled A/B routing)
- Logic: AND, OR, XOR, NOT, NAND, NOR (for gates/triggers)
- Comparator (A>B → gate, with hysteresis)
- Rectifier (half/full wave rectification of CV)
- Min/Max (output minimum or maximum of two CVs)
- Quantizer (snap CV to scale degrees — uses BrahmaScale)

### Clock — HOROLOGIUM (the celestial clockwork, keeper of cosmic time)
- Master clock with BPM (links to Chronos)
- Clock divider (/2, /3, /4, /5, /6, /7, /8, /16, /32)
- Clock multiplier (×2, ×3, ×4, ×8)
- Swing processor (applies swing to incoming clock)
- Tap tempo (averages last N taps)
- Burst generator (N pulses at rate on single trigger)
- Delay (shift clock by N ms or % of beat)
- Ableton Link integration (LinkClock quark)

### Sequencers — SIBYL (the ancient oracle, prophesying patterns)
- Step sequencer: 1-64 steps, bidirectional, pendulum, random
- Euclidean generator: fills + rotation + accent
- Shift register: Turing Machine (probability-based bit flip)
- Markov chain: weighted state transitions, trainable
- Cellular automata: 1D (Wolfram rules), 2D (Game of Life)
- L-system: rule-based string rewriting → note sequence
- Bernoulli gate: probability-based signal routing (A or B)
- Comparator sequencer: CV threshold → gate patterns

---

## Phase 6: Elektron Feature Clones — MAGNUM OPUS Suite

*Magnum Opus = "The Great Work" — the alchemical quest for perfection. These modules represent the pinnacle of electronic instrument design, transmuted into the Brahma ecosystem.*

**Files**: `brahma/sc/25_elektron_octatrack.scd`, `25_elektron_machinedrum.scd`, `25_elektron_digitone.scd`, `25_elektron_rytm.scd`

### OCTAHEDRON (Octatrack) — the 8-faced geometric solid
- **Crossfader scenes**: A/B scene states with continuous morph (integrated into Chronos scenes)
- **Pickup machines**: Live audio loop recorder with overdub, multiply, half-speed
- **Time-stretch**: Phase vocoder for pitch-independent time manipulation
- **Slice machines**: Auto-detect transients → create slice grid → trigger by index
- **Arranger mode**: Song-level arrangement with conditional jumps (into Chronos song mode)
- **Cue outputs**: Dedicated pre-listen bus for headphone cueing

### AUTOMATON (Machinedrum) — self-operating mechanical being
- **TRX**: 909-style analog-modeled percussion (kick, snare, hat, clap, tom, rim)
- **EFM**: FM metal percussion (bell, gong, metallic hit)
- **E12**: 12-bit sample emulation with classic grittiness
- **PI**: Physical input machine (external audio processing)
- **GND**: Noise machine (filtered noise percussion)
- **INP**: Input machine (external audio as sound source)

### AZOTH_MINOR (Digitone) — the lesser universal solvent (FM-focused sibling to AZOTH)
- **4-operator FM** with multimode filter (already covered in AZOTH, ensure parity)
- **Sound locks**: different preset per step (Chronos p-locks achieve this)
- **Arpeggiator**: up/down/upDown/random/asPlayed, 1-4 octaves, rate (Chronos arp track type)

### CHIMERA (Analog RYTM) — hybrid beast of multiple natures
- **Dual VCO + sample layering**: analog oscillators mixed with sample playback per voice
- **Performance macros**: 8 assignable macros, each controlling multiple parameters
- **Scenes**: A/B performance scenes with pad-morph (integrate with Chronos)

---

## Phase 7: Interaction Methods — CORPUS HERMETICUM

*Corpus Hermeticum = the body of Hermetic texts on divine contact. These modules enable physical, gestural, and environmental communion with the synthesis organism.*

**Files**: `brahma/sc/26_interaction_controllers.scd`, `brahma/sc/26_interaction_sensors.scd`, `brahma/sc/26_interaction_audio_cv.scd`

### SIGILLUM (Touch Plates — "seal" or "sigil", marks of power through touch)
- Web UI: 8 capacitive-simulated touch pads (4×2 grid)
- Output per pad: gate, pressure (touch area), position (X/Y within pad)
- Each pad maps to CV bus for patching to any destination
- SynthDef: `\touch_plate_cv` — converts web touch events to control buses

### MERIDIAN (Ribbon Controller — energy lines/channels of the body)
- Web UI: horizontal touch strip (800px)
- Outputs: position (0-1), velocity, gate
- Fretless pitch control: maps to BrahmaScale for glissando
- Bipolar mode for modulation

### TETRAGRAMMATON (Enhanced XY Pad — the 4-letter divine name, 4 corners of creation)
- 4-corner scene morphing (bilinear interpolation between 4 states)
- Gesture recording and playback (loop recorded movements)
- Assignable to any 2 parameters via patch bay
- SynthDef: `\tetragrammaton_morph` — blends 4 audio sources by position

### PNEUMA (Envelope Follower — "breath/spirit", the animating force extracted from sound)
- SynthDef: `\pneuma_amplitude` — amplitude tracking with attack/release
- SynthDef: `\pneuma_pitch` — pitch detection (Pitch.kr)
- SynthDef: `\pneuma_spectrum` — spectral centroid/flatness tracking
- External instrument input → drives synth parameters (guitar controlling filter, etc.)

### TACTUS (Contact Microphone — Latin "touch", the physical striking of matter)
- Web UI: tap/scratch gesture area
- Maps gesture intensity/speed to gate + CV
- SynthDef: `\tactus_gate` — generates gates from detected impacts

### SENSORIUM (Bio/Light/Distance — the seat of sensation in hermetic philosophy)
- OSC input endpoint: `/brahma/sensor/[name] [value]`
- Maps any incoming OSC to CV bus (universal sensor bridge)
- Pre-built mappings for common sensor ranges
- Web: mouse proximity, ambient light API, device orientation/accelerometer

---

## Phase 8: Generative Modules — DAEMON Suite

*Daemons in Greek philosophy are intermediary spirits between gods and mortals — autonomous intelligences that guide without direct intervention. These modules are self-playing, self-organizing systems.*

**Files**: `brahma/sc/27_generative_modules.scd`, `27_generative_sequencers.scd`

### DAEMON_MACHINA (Turing Machine — the spirit in the machine)
- N-bit shift register (4-32 bits) with probability-based bit flipping
- Output: lower 8 bits → CV, LSB → gate
- Lock mode: 0% probability = repeating loop, 100% = fully random
- Clock input from Chronos or independent

### MOIRAI (Markov Chain — the three Fates who weave destiny's thread)
- N states (4-16) with weighted transition matrix
- Trainable: record a sequence → learn transition probabilities
- Output: note CV + gate per state transition
- Temperature control: 0 = deterministic, 1 = fully random
- Preset chains: Fibonacci, pentatonic walk, blues progression

### GENESIS (Cellular Automata — creation from fundamental rules)
- 1D: Wolfram rules (0-255), 16-64 cells → 16-64 step pattern
- 2D: Game of Life, cell states → note triggers on grid
- Visual feedback in web UI (grid visualization)
- Mutation rate control

### TYCHE (Bernoulli Gates — Greek goddess of fortune/chance)
- Audio-rate coin flip: input trigger routes to A or B output
- Probability CV-controllable (modulate with LFO for evolving patterns)
- Cascade mode: chain multiple gates for probability trees

### TRIVIUM (Logic Modules — the three paths of classical logic)
- AND, OR, XOR, NOT, NAND, NOR for gates/triggers
- Comparator: A > B → gate (with hysteresis)
- Flip-flop: toggle on trigger
- Counter: count N triggers → output gate

### SERPENS (Self-Patching Generative System — the serpent that feeds on itself)
- End-of-cycle outputs on all function generators/envelopes
- Clock divider → random source → note quantizer → oscillator (patch recipe)
- Template patches for common generative topologies

### ARBOR_VITAE (L-System / Fractal Sequencer — the Tree of Life, branching growth)
- Lindenmayer grammar with configurable rules
- Iteration depth (1-8 generations)
- Character → note mapping (user-configurable)
- Branching support for polyphonic patterns

---

## Phase 9: Audio Suite QoL — SCRIPTORIUM

*The Scriptorium was the medieval chamber where monks transcribed, preserved, and illuminated sacred texts. These modules record, monitor, synchronize, and preserve the sonic manuscripts of the Brahma system.*

**Files**: `brahma/sc/28_audio_recording.scd`, `28_audio_monitoring.scd`, `28_audio_sync.scd`, `28_audio_presets.scd`

### Multi-Track Recording
- Arm individual tracks for recording to disk (WAV/AIFF, 24-bit)
- Simultaneous recording of up to 16 tracks
- Punch-in/punch-out recording
- SynthDef: `\recorder` with `RecordBuf`

### Monitoring
- Peak + RMS level meters per track (web VU meters at 30Hz)
- FFT spectrum analyzer (web canvas, selectable source)
- Oscilloscope (waveform display)
- Tuner (pitch detection display)
- CPU load monitor (Server.local.avgCPU broadcast)

### Routing
- Send/return buses (up to 8 aux sends)
- Sidechain routing (any audio bus → any FX sidechain input)
- Master bus processing chain
- Cue/headphone bus (pre-fader listen)

### Clock Sync
- MIDI clock receive (external hardware → Chronos tempo)
- MIDI clock send (Chronos → external hardware)
- Ableton Link (LinkClock quark for network tempo sync)
- Tap tempo (average last 4 taps)

### Preset Management
- Project save/load (entire system state serialized to JSON/Archive)
- Per-module preset save/load
- Preset morphing (interpolate between two presets)
- Factory preset library for all synthesis engines
- User preset browser in web UI

### File Management
- Sample browser (scan directories, preview, load to buffer)
- Wavetable browser (preview + load to Ouroboros)
- Bounce/render: offline render of pattern/arrangement to WAV
- Batch NRT processing (queue multiple renders)

### Undo/Redo
- System-wide state snapshots (32 levels)
- Integrated into Chronos (already planned)
- Extend to patch bay connections and FX parameter changes

---

## File Organization Summary

### New SuperCollider Files (load order)
```
02_microtonality.scd        — Scale/tuning system
02_midi_mpe.scd             — MIDI + MPE infrastructure
08_patch_bay.scd            — Universal modulation routing
09_chronos_core.scd        — Master sequencer state machine
09_chronos_clock.scd       — Polyrhythmic clock engine
09_chronos_tracks.scd      — Track management + patterns
09_chronos_automation.scd  — P-locks, scenes, undo/redo
09_chronos_midi.scd        — MIDI I/O for sequencer
16_synthesis_engines.scd    — 9 complete synthesis organisms
17_make_noise_functions.scd — MATHS, PoliMATHS, function gens
18_make_noise_filters.scd   — QPAS, Optomix, LxD, all LPGs/gates
19_make_noise_time.scd      — Mimeophon, Morphagene, Echophon, Erbe-Verb
20_make_noise_oscillators.scd — DPO, STO, XPO, Spectraphon
20_make_noise_sequencers.scd — Rene, Pressure Points, TEMPI
20_make_noise_utilities.scd — modDemix, X-PAN, Wogglebug, instruments
21_fx_dynamics.scd          — Compressor, limiter, gate, expander
21_fx_eq.scd                — Parametric, graphic, shelf, tilt
22_fx_time.scd              — Delays, reverbs, freeze
22_fx_modulation.scd        — Chorus, flanger, phaser, etc.
22_fx_distortion.scd        — Drive, fuzz, waveshaper, tube
22_fx_spectral.scd          — Vocoder, freeze, pitch shift
22_fx_spatial.scd           — Stereo width, pan, binaural
23_modular_oscillators.scd  — VCO, noise, chaos
23_modular_filters.scd      — Ladder, SVF, comb, formant
23_modular_amplifiers.scd   — VCA, LPG, mixer
23_modular_envelopes.scd    — ADSR, AD, function gen
23_modular_modulation.scd   — LFO, S&H, slew, random
24_modular_utilities.scd    — Mult, attenuverter, logic, switch
24_modular_clock.scd        — Divider, multiplier, Link
24_modular_sequencers.scd   — Step, Euclidean, Turing
25_elektron_octatrack.scd   — Crossfader, pickup, slice, stretch
25_elektron_machines.scd    — MD/DN/AR synthesis machines
26_interaction_controllers.scd — Touch, ribbon, XY, gesture
26_interaction_sensors.scd  — Env follower, sensor bridge
27_generative_modules.scd   — Turing, Markov, CA, logic
27_generative_sequencers.scd — L-system, Bernoulli, self-patch
28_audio_recording.scd      — Multi-track record
28_audio_monitoring.scd     — Meters, FFT, scope
28_audio_sync.scd           — MIDI clock, Link
28_audio_presets.scd        — Save/load system
```

### New SC Class Files
```
BrahmaScale.sc              — Scale/tuning abstraction
BrahmaTuning.sc             — Per-organism tuning state
BrahmaMPE.sc                — MPE zone + voice manager
BrahmaMIDIRouter.sc         — MIDI input routing
BrahmaModBus.sc             — Modulation bus allocator
```

### Updated loader.scd Order
```
01_* (infrastructure — expanded bus count)
02_* (microtonality + MIDI/MPE)        ← NEW
03_* (proteus)
04_* (relinquished + fusion)
05_* (organisms)
06_* (typhon)
07_* (safety/IMMUNE)
08_* (patch bay)                        ← NEW
09_* (chronos sequencer)               ← NEW
10-13_* (validation + metrics)
14_* (visual cortex)
15_* (golem)
16_* (synthesis engines)                ← NEW
17-20_* (make noise clones)             ← NEW
21-22_* (FX rack)                       ← NEW
23-24_* (modular modules)               ← NEW
25_* (elektron features)                ← NEW
26_* (interaction methods)              ← NEW
27_* (generative modules)               ← NEW
28_* (audio suite)                      ← NEW
```

---

## Implementation Priority

Recommended build order based on dependency chains:

1. **Phase 0** — Foundation (microtonality, MIDI/MPE, patch bay, infra expansion)
2. **Phase 1** — Chronos sequencer (all other features need sequencing)
3. **Phase 2** — Synthesis engines (core sound sources)
4. **Phase 4** — FX rack (process those sound sources)
5. **Phase 5** — Modular modules (building blocks)
6. **Phase 3** — Make Noise clones (specialized modules)
7. **Phase 6** — Elektron features (extends Chronos)
8. **Phase 7** — Interaction methods (alternative control)
9. **Phase 8** — Generative modules (algorithmic composition)
10. **Phase 9** — Audio suite QoL (polish and workflow)

---

## Verification Strategy

### Per-Module Testing
- Each SynthDef: instantiate, verify audio output, check all params respond
- Each organism: verify 7-stage signal chain, test absorption via FSAP
- Each FX: A/B test (bypass vs active), verify mix parameter, test CV modulation
- Each generative module: verify output distribution, test seed reproducibility

### Integration Testing
- Chronos → any synthesis engine (trigger notes, verify p-locks apply)
- BrahmaScale → all oscillators (verify microtonal pitch accuracy)
- MPE input → voice allocation → per-voice expression
- Patch bay: LFO → filter cutoff at audio rate (verify no clicks/glitches)
- Golem absorption of new organisms (verify trait map transfer)

### Performance Testing
- 16 simultaneous synthesis voices + 8 FX chains: CPU < 60%
- Chronos running 32 tracks at 120 BPM: no timing drift
- Patch bay with 64 active routes: control bus allocation < 512
- Web UI: 60fps rendering with meters + spectrum + grid active

### System Testing
- Full boot sequence: loader.scd loads all new files without errors
- OSC round-trip: web UI → SC → web UI latency < 20ms
- Preset save/load: complete state restore with no audio glitches
- IMMUNE governor: verify safety limiter still catches runaway feedback with new modules
