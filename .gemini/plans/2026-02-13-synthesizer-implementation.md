# Alchemical Synthesizer: Extensive Implementation Plan

## Project Overview: The Brahma Meta-Rack
The Alchemical Synthesizer is a modular, organism-based instrument designed to **absorb**, **mutate**, and **re-express** sonic identities. It is architected as a containment hierarchy named **Brahma**, hosting semi-autonomous organisms that follow the **Fidelity Stacking Absorption Protocol (FSAP)**.

### Target Architecture (Topology A)
- **Patching Surface & UI:** Pure Data (Pd)
- **DSP Engine:** SuperCollider (SC)
- **Communication:** OSC (Deterministic Parameter Schema)
- **Internal Bus Protocol:** BRIDGE__DOMAIN_ROUTER__v1 (I2C-style metadata + audio)

---

## Phase 1: Infrastructure & The Brahma Backplane
Establish the core environment and the communication protocols that allow modules to "infect" and "absorb" one another.

### 1.1 SuperCollider Environment Setup
- Initialize global `~SC_BUS` dictionary for audio and control routing.
- Initialize `~SC_GRP` hierarchy: `ia` -> `bc` -> `ae` -> `te` -> `pr` -> `rr`.
- Setup a global Registry for `EntityIDs` and `TraitMaps`.

### 1.2 Pure Data Framework
- Create the OSC Bridge abstraction (`[pd osc_bridge]`).
- Implement the Master Clock and Cell-Cycle counter.
- Create UI templates for the 14HP, 18HP, and 24HP standardized faceplates.

### 1.3 The Infection Bus Protocol
- Implement the 12-byte **Bridge Control Frame** in both SC (Language side) and Pd.
- Implement the **BUS_DATA** metadata packet (32 bytes) for sharing spectral fingerprints and behavior vectors.
- Implement the **Arbitration Model** (Slot-based master selection).

---

## Phase 2: The Primordial Schema (Adam Kadmon)
Define the ontological structure that ensures all absorbed beings remain addressable and compatible.

### 2.1 Trait Map Definition
- Finalize the `TraitMap` schema:
    - Spectral Profile (Centroid, Flatness, Onsets).
    - Temporal Topology (Envelope archetypes, Slew profiles).
    - Modulation Graph (Inferred causality).
    - Performance Response (Velocity/Gesture mappings).

### 2.2 Adam Kadmon Implementation
- **SC Side:** Implement the `AdamKadmon` class to handle trait normalization and capability tokens.
- **Pd Side:** Create the Ontology selection UI.

---

## Phase 3: Core Analytical Organisms
The "Eyes" and "Stomachs" of the system.

### 3.1 Proteus (The Form-Knower)
- Implement the `relinquished_ae` analysis engine in SC.
- Implement the resynthesis renderer (`relinquished_te`) with `MORPH_ALPHA` interpolation.
- Create the "Frozen Trait" snapshot logic.

### 3.2 MAW (Digestive Intake)
- Implement high-speed feature extraction (FFT, RMS, Onset detection).
- Implement "Biotype" classification (Oscillator-like, Noise-like, etc.).

---

## Phase 4: The Absorption-Fusion Loop
The core parasitic mechanics.

### 4.1 Relinquished (The Parasite)
- Implement the **Single-Equip Constraint** state machine.
- Implement the **Binding Core** (Circular buffer with VC read head).
- Implement **Sacrificial Buffering** and **Retaliatory Reflection**.

### 4.2 FUSION CORE & NUCLEUS
- Implement the binding matrix for Morphology, Physiology, and Psychology.
- Create the `Genome` data model for NUCLEUS.
- Implement weighted recombination of stored kernels.

---

## Phase 5: Anthropomorphized Sampler Creatures
Translate the theory into executable SynthDefs and Pd abstractions.

### 5.1 Mnemosyne (The Archivist)
- 32-bit float archival buffer with "Tape-aging" model (Wow/Flutter).
- Historical context stratification logic.

### 5.2 Protean Hound (The Fragment Tracker)
- Transient discriminator and micro-buffer array.
- Feral recombination engine.

### 5.3 Chrysalid Siren (The Vocalist)
- Spectral morphing matrix and grain density control.
- Identity-blur pathology.

### 5.4 Ossuary Monk (The Ritualizer)
- Impulse detector and resonance relic engine.
- Liturgical pattern generator (Non-linear quantization).

### 5.5 Janiform Child (The Symmetric Listener)
- Dual-read-head temporal symmetry engine.
- Foreshadowing/Pre-echo artifacts.

---

## Phase 6: Stacking & Evolution (Typhon & FSAP)
The mechanism for geometric growth.

### 6.1 Typhon (The Accumulator)
- Implement the multiplicative stacking of `TraitMaps`.
- Create the cross-coupling matrix for inter-layer modulation.

### 6.2 FSAP State Machine
- Implement the five-stage loop: **Observation -> Absorption -> Integration -> Accumulation -> Repeat**.
- Enforce the "Lossless" invariant via the `CTS` (Cumulative Trait Stack).

---

## Phase 7: Safety & Stability (The Governors)
Ensure the growing organism doesn't collapse into noise or crash the system.

### 7.1 IMMUNE
- Implement feedback runaway detection and DC build-up suppression.
- Implement "Quarantine" for unstable subgraphs.

### 7.2 METABOLISM
- Macro-dynamic engine driven by the "Cell Cycle".
- Thermal drift and glucose-based drive saturation.

---

## Phase 8: Inter-Domain Routing (The Bridge)
Finalize the hardware-faithful routing logic.

### 8.1 BRIDGE__DOMAIN_ROUTER__v1
- Implement the physical mapping from UI knobs to Control Frames.
- Implement Loopback semantics and paired-link staggering.

---

## Phase 9: Final Assembly & Performance Interface
- Assemble the "Brahma Rack" in Pure Data.
- Create the Macro Performance Panel (12 knobs + 8 buttons).
- Setup multi-channel recording/export for "Specimen Documentation."

---

## Phase 10: Validation & Regression
- Setup the **Measurement Harness**.
- Capture hardware reference vectors (Make Noise MATHS, DPO, Optomix approximations).
- Automate THD+N and Frequency Response metrics for absorbed entities.

---

## Deployment & Usage Ritual
1. **Power-Up:** Initialize amnesia and clear registries.
2. **Absorption:** Capture external identities through contact.
3. **Synthesis:** Negotiate between mutation and authority.
4. **Documentation:** Record specimens that will never exist again.
5. **Death:** Power-down and clear the stack.
