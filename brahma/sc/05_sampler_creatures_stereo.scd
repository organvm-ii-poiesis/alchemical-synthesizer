/*
  Phase 5 Refinement: Stereo-Native Sampler Creatures
  Enhancing "The Thing" aesthetic with spatial misalignment.
*/

(
// ------------------------------------------------------------
// 1. MNEMOSYNE (Stereo)
// ------------------------------------------------------------
SynthDef(\mnemosyne_voice_stereo, {
    |outBus=0, bufL, bufR, 
     age=0.0, erosion=0.0, recallOffset=0.0|
    
    var sigL, sigR, rateL, rateR, wow, flutter, dust;
    
    wow = LFNoise2.kr(0.5).bipolar(age * 0.05);
    flutter = LFNoise1.kr(10).bipolar(age * 0.02);
    
    // Slight rate misalignment for stereo "tearing"
    rateL = 1.0 + wow + flutter;
    rateR = 1.0 + wow + (flutter * 1.05) + recallOffset;
    
    sigL = PlayBuf.ar(1, bufL, rateL, loop: 1);
    sigR = PlayBuf.ar(1, bufR, rateR, loop: 1);
    
    sigL = LPF.ar(sigL, 18000 - (erosion * 15000));
    sigR = LPF.ar(sigR, 18000 - (erosion * 14000)); // asymmetric erosion
    
    sigL = tanh(sigL * (1 + (age * 0.5)));
    sigR = tanh(sigR * (1 + (age * 0.5)));
    
    dust = Dust2.ar(age * 10, 0.1);
    
    Out.ar(outBus, [sigL, sigR] + dust);
}).add;

// ------------------------------------------------------------
// 2. PROTEAN HOUND (Stereo)
// ------------------------------------------------------------
SynthDef(\protean_hound_stereo, {
    |inBusL=0, inBusR=1, outBus=0, bufL, bufR,
     sensitivity=0.5, aggression=0.5, chaos=0.0|
    
    var inL, inR, trig, ptrL, ptrR, sigL, sigR;
    
    inL = In.ar(inBusL, 1);
    inR = In.ar(inBusR, 1);
    
    trig = Onsets.kr(FFT(LocalBuf(512), (inL + inR) * 0.5), sensitivity);
    
    RecordBuf.ar(inL, bufL, loop: 1);
    RecordBuf.ar(inR, bufR, loop: 1);
    
    ptrL = Phasor.ar(0, 1, 0, BufFrames.ir(bufL));
    ptrR = Phasor.ar(0, 1, 0, BufFrames.ir(bufR));
    
    // Asymmetric pointer jumps
    ptrL = K2A.ar(TChoose.kr(trig, [ptrL - (TRand.kr(0.01, 0.5, trig) * SampleRate.ir * chaos), ptrL]));
    ptrR = K2A.ar(TChoose.kr(trig, [ptrR - (TRand.kr(0.01, 0.5, trig) * SampleRate.ir * (chaos * 1.1)), ptrR]));

    sigL = BufRd.ar(1, bufL, ptrL, loop: 1);
    sigR = BufRd.ar(1, bufR, ptrR, loop: 1);
    
    Out.ar(outBus, [sigL, sigR]);
}).add;

// ------------------------------------------------------------
// 3. CHRYSALID SIREN (Stereo)
// ------------------------------------------------------------
SynthDef(\chrysalid_siren_stereo, {
    |inBusL=0, inBusR=1, outBus=0, bufL, bufR,
     grainDensity=10, identityBlur=0.0, formantShift=0.0|
    
    var trig, pos, sigL, sigR, dur, pitchRatio;
    
    RecordBuf.ar(In.ar(inBusL, 1), bufL, loop: 1);
    RecordBuf.ar(In.ar(inBusR, 1), bufR, loop: 1);
    
    trig = Impulse.kr(grainDensity);
    pos = Phasor.ar(0, 1, 0, BufFrames.ir(bufL)) / BufFrames.ir(bufL);
    pos = pos + LFNoise1.kr(10).bipolar(identityBlur * 0.1);
    
    pitchRatio = 2 ** (formantShift / 12);
    dur = 1.2 / grainDensity;
    
    sigL = GrainBuf.ar(1, trig, dur, bufL, pitchRatio, pos, 2);
    sigR = GrainBuf.ar(1, trig, dur, bufR, pitchRatio, pos + 0.01, 2); // Slight offset
    
    Out.ar(outBus, [sigL, sigR]);
}).add;

// ------------------------------------------------------------
// 4. OSSUARY MONK (Stereo)
// ------------------------------------------------------------
SynthDef(\ossuary_monk_stereo, {
    |inBusL=0, inBusR=1, outBus=0, 
     impactThreshold=0.5, relicDecay=1.0, gravity=0.0|
    
    var in, trig, exciter, sigL, sigR;
    
    in = (In.ar(inBusL, 1) + In.ar(inBusR, 1)) * 0.5;
    // Coyote fallback: onset detection via amplitude threshold
    trig = Trig1.kr(Amplitude.kr(in) > impactThreshold, 0.01);
    exciter = Decay.ar(K2A.ar(trig), 0.01) * PinkNoise.ar;
    
    sigL = DynKlank.ar(`[[200, 450, 800, 1200] * (1 - (gravity * 0.5)), [1, 0.8, 0.6, 0.4], [1, 1, 1, 1] * relicDecay], exciter);
    sigR = DynKlank.ar(`[[205, 460, 810, 1220] * (1 - (gravity * 0.5)), [1, 0.8, 0.6, 0.4], [1, 1, 1, 1] * relicDecay], exciter);
    
    Out.ar(outBus, [sigL, sigR]);
}).add;

// ------------------------------------------------------------
// 5. JANIFORM CHILD (Stereo)
// ------------------------------------------------------------
SynthDef(\janiform_child_stereo, {
    |inBusL=0, inBusR=1, outBus=0, bufL, bufR,
     symmetry=0.5, causalDrift=0.0|
    
    var fwdL, revL, fwdR, revR, sigL, sigR, ptr;
    
    RecordBuf.ar(In.ar(inBusL, 1), bufL, loop: 1);
    RecordBuf.ar(In.ar(inBusR, 1), bufR, loop: 1);
    
    ptr = Phasor.ar(0, 1, 0, BufFrames.ir(bufL));
    
    fwdL = BufRd.ar(1, bufL, ptr, loop: 1);
    fwdR = BufRd.ar(1, bufR, ptr, loop: 1);
    
    revL = BufRd.ar(1, bufL, (BufFrames.ir(bufL) - ptr + (causalDrift * SampleRate.ir)).wrap(0, BufFrames.ir(bufL)), loop: 1);
    revR = BufRd.ar(1, bufR, (BufFrames.ir(bufR) - ptr + ((causalDrift * 1.05) * SampleRate.ir)).wrap(0, BufFrames.ir(bufR)), loop: 1);
    
    sigL = XFade2.ar(fwdL, revL, (symmetry * 2) - 1);
    sigR = XFade2.ar(fwdR, revR, (symmetry * 2) - 1);
    
    Out.ar(outBus, [sigL, sigR]);
}).add;

"--- BRAHMA: Stereo Sampler Creatures Loaded ---".postln;
)
