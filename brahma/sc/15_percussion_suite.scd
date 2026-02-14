/*
  Phase 15: The Alchemical Percussion Suite
  6 Synthesis Voices for the Golem Organism

  Each voice: oscillator, multi-mode filter (LP/HP/BP/Notch),
  amp ADSR, filter ADSR, plus type-specific params.
  All include outBus, inBus, velocity, gate for modular routing.
*/

(
// 1. SUBTRACTIVE (Classic Analog)
SynthDef(\drum_subtractive, {
    |outBus=0, inBus=0, gate=1, velocity=0.8,
     freq=150, detune=0, oscType=0,
     filterType=0, cutoff=2000, res=1, envAmt=0.5,
     atk=0.001, dec=0.3, sus=0, rel=0.1,
     fAtk=0.001, fDec=0.15, fSus=0.1, fRel=0.1,
     noiseAmt=0, foldAmt=0|

    var osc, noise, sig, filter, ampEnv, fEnv, fCutoff;

    ampEnv = EnvGen.ar(Env.adsr(atk, dec, sus, rel), gate, doneAction: 2);
    fEnv = EnvGen.ar(Env.adsr(fAtk, fDec, fSus, fRel), gate);

    // Oscillator selection: 0=sine, 1=saw, 2=square, 3=triangle
    osc = Select.ar(oscType.clip(0, 3), [
        SinOsc.ar(freq + detune),
        Saw.ar(freq + detune),
        Pulse.ar(freq + detune, 0.5),
        LFTri.ar(freq + detune)
    ]);

    // Optional noise layer
    noise = WhiteNoise.ar * noiseAmt.clip(0, 1);
    sig = osc + noise;

    // Optional wavefold
    sig = Select.ar((foldAmt > 0.01).asInteger, [
        sig,
        (sig * (1 + (foldAmt.clip(0, 1) * 10))).sin
    ]);

    // Filter envelope modulation
    fCutoff = (cutoff + (fEnv * envAmt * 5000)).clip(20, 20000);

    // Multi-mode filter: 0=LP, 1=HP, 2=BP, 3=Notch
    filter = Select.ar(filterType.clip(0, 3), [
        RLPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        RHPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        BPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        BRF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1))
    ]);

    Out.ar(outBus, filter * ampEnv * velocity);
}).add;

// 2. FM (2-Operator)
SynthDef(\drum_fm, {
    |outBus=0, inBus=0, gate=1, velocity=0.8,
     freq=150, detune=0, ratio=2, index=1,
     filterType=0, cutoff=8000, res=1, envAmt=0,
     atk=0.001, dec=0.3, sus=0, rel=0.1,
     fAtk=0.001, fDec=0.15, fSus=0.1, fRel=0.1,
     noiseAmt=0, foldAmt=0|

    var modulator, carrier, sig, filter, ampEnv, fEnv, fCutoff;

    ampEnv = EnvGen.ar(Env.adsr(atk, dec, sus, rel), gate, doneAction: 2);
    fEnv = EnvGen.ar(Env.adsr(fAtk, fDec, fSus, fRel), gate);

    modulator = SinOsc.ar((freq + detune) * ratio) * ((freq + detune) * index * ampEnv);
    carrier = SinOsc.ar(freq + detune + modulator);

    sig = carrier + (WhiteNoise.ar * noiseAmt.clip(0, 1));

    sig = Select.ar((foldAmt > 0.01).asInteger, [
        sig,
        (sig * (1 + (foldAmt.clip(0, 1) * 10))).sin
    ]);

    fCutoff = (cutoff + (fEnv * envAmt * 5000)).clip(20, 20000);

    filter = Select.ar(filterType.clip(0, 3), [
        RLPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        RHPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        BPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        BRF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1))
    ]);

    Out.ar(outBus, filter * ampEnv * velocity);
}).add;

// 3. ADDITIVE (Harmonic Series)
SynthDef(\drum_additive, {
    |outBus=0, inBus=0, gate=1, velocity=0.8,
     freq=150, detune=0,
     h1=1.0, h2=0.5, h3=0.25, h4=0.125, h5=0.06, h6=0.03,
     filterType=0, cutoff=8000, res=1, envAmt=0,
     atk=0.001, dec=0.3, sus=0, rel=0.1,
     fAtk=0.001, fDec=0.15, fSus=0.1, fRel=0.1,
     noiseAmt=0, foldAmt=0|

    var osc, sig, filter, ampEnv, fEnv, fCutoff, f;

    ampEnv = EnvGen.ar(Env.adsr(atk, dec, sus, rel), gate, doneAction: 2);
    fEnv = EnvGen.ar(Env.adsr(fAtk, fDec, fSus, fRel), gate);

    f = freq + detune;
    osc = (SinOsc.ar(f * 1) * h1)
        + (SinOsc.ar(f * 2) * h2)
        + (SinOsc.ar(f * 3) * h3)
        + (SinOsc.ar(f * 4) * h4)
        + (SinOsc.ar(f * 5) * h5)
        + (SinOsc.ar(f * 6) * h6);

    osc = osc / 6; // normalize

    sig = osc + (WhiteNoise.ar * noiseAmt.clip(0, 1));

    sig = Select.ar((foldAmt > 0.01).asInteger, [
        sig,
        (sig * (1 + (foldAmt.clip(0, 1) * 10))).sin
    ]);

    fCutoff = (cutoff + (fEnv * envAmt * 5000)).clip(20, 20000);

    filter = Select.ar(filterType.clip(0, 3), [
        RLPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        RHPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        BPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        BRF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1))
    ]);

    Out.ar(outBus, filter * ampEnv * velocity);
}).add;

// 4. KARPLUS-STRONG (Plucked String)
SynthDef(\drum_karplus, {
    |outBus=0, inBus=0, gate=1, velocity=0.8,
     freq=150, detune=0, karpDecay=0.4,
     filterType=0, cutoff=4000, res=1, envAmt=0,
     atk=0.001, dec=0.4, sus=0, rel=0.2,
     fAtk=0.001, fDec=0.2, fSus=0.1, fRel=0.1,
     noiseAmt=0, foldAmt=0|

    var exciter, delay, sig, filter, ampEnv, fEnv, fCutoff;

    ampEnv = EnvGen.ar(Env.adsr(atk, dec, sus, rel), gate, doneAction: 2);
    fEnv = EnvGen.ar(Env.adsr(fAtk, fDec, fSus, fRel), gate);

    // Exciter: burst of noise
    exciter = PinkNoise.ar * EnvGen.ar(Env.perc(0.001, 0.01));

    // Karplus-Strong delay line
    delay = CombL.ar(exciter, 0.05, (freq + detune).reciprocal, karpDecay.clip(0.01, 4));

    sig = LPF.ar(delay, (freq + detune) * 4);
    sig = sig + (WhiteNoise.ar * noiseAmt.clip(0, 1) * ampEnv);

    sig = Select.ar((foldAmt > 0.01).asInteger, [
        sig,
        (sig * (1 + (foldAmt.clip(0, 1) * 10))).sin
    ]);

    fCutoff = (cutoff + (fEnv * envAmt * 5000)).clip(20, 20000);

    filter = Select.ar(filterType.clip(0, 3), [
        RLPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        RHPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        BPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        BRF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1))
    ]);

    Out.ar(outBus, filter * ampEnv * velocity);
}).add;

// 5. NOISE (Filtered Percussion)
SynthDef(\drum_noise, {
    |outBus=0, inBus=0, gate=1, velocity=0.8,
     freq=200, detune=0, amount=0.7,
     filterType=0, cutoff=1000, res=1, envAmt=0,
     atk=0.001, dec=0.15, sus=0, rel=0.1,
     fAtk=0.001, fDec=0.1, fSus=0.1, fRel=0.1,
     foldAmt=0|

    var noise, tone, sig, filter, ampEnv, fEnv, fCutoff;

    ampEnv = EnvGen.ar(Env.adsr(atk, dec, sus, rel), gate, doneAction: 2);
    fEnv = EnvGen.ar(Env.adsr(fAtk, fDec, fSus, fRel), gate);

    noise = WhiteNoise.ar * amount.clip(0, 1);
    tone = SinOsc.ar(freq + detune) * (1 - amount.clip(0, 1));
    sig = noise + tone;

    sig = Select.ar((foldAmt > 0.01).asInteger, [
        sig,
        (sig * (1 + (foldAmt.clip(0, 1) * 10))).sin
    ]);

    fCutoff = (cutoff + (fEnv * envAmt * 5000)).clip(20, 20000);

    filter = Select.ar(filterType.clip(0, 3), [
        RLPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        RHPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        BPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        BRF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1))
    ]);

    Out.ar(outBus, filter * ampEnv * velocity);
}).add;

// 6. WAVEFOLD (Nonlinear)
SynthDef(\drum_wavefold, {
    |outBus=0, inBus=0, gate=1, velocity=0.8,
     freq=150, detune=0, oscType=0, foldAmt=0.5,
     filterType=0, cutoff=4000, res=1, envAmt=0,
     atk=0.001, dec=0.3, sus=0, rel=0.1,
     fAtk=0.001, fDec=0.15, fSus=0.1, fRel=0.1,
     noiseAmt=0|

    var osc, sig, filter, ampEnv, fEnv, fCutoff;

    ampEnv = EnvGen.ar(Env.adsr(atk, dec, sus, rel), gate, doneAction: 2);
    fEnv = EnvGen.ar(Env.adsr(fAtk, fDec, fSus, fRel), gate);

    // Base oscillator
    osc = Select.ar(oscType.clip(0, 3), [
        SinOsc.ar(freq + detune),
        Saw.ar(freq + detune),
        Pulse.ar(freq + detune, 0.5),
        LFTri.ar(freq + detune)
    ]);

    sig = osc + (WhiteNoise.ar * noiseAmt.clip(0, 1));

    // Recursive sine-fold waveshaping
    sig = (sig * (1 + (foldAmt.clip(0, 1) * 10))).sin;

    fCutoff = (cutoff + (fEnv * envAmt * 5000)).clip(20, 20000);

    filter = Select.ar(filterType.clip(0, 3), [
        RLPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        RHPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        BPF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1)),
        BRF.ar(sig, fCutoff, (1 / res.clip(0.5, 20)).clip(0.01, 1))
    ]);

    Out.ar(outBus, filter * ampEnv * velocity);
}).add;

"--- BRAHMA: Alchemical Percussion Suite Loaded (6 voices) ---".postln;
)
