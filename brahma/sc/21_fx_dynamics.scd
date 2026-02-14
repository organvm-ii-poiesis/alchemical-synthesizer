/*
  Phase 4: CRUCIBLE — Dynamics FX
  Compressor, Limiter, Gate, Expander, Sidechain Ducker
  All follow: |inBus, outBus, mix=0.5, bypass=0| + specific params
*/

(
// ==========================================
// COMPRESSOR
// ==========================================
SynthDef(\crucible_compressor, {
    |inBus=0, outBus=0, mix=1.0, bypass=0,
     threshold=(-12), ratio=4, attack=0.01, release=0.1,
     knee=6, makeup=0,
     sidechainBus=(-1)|  // -1 = use input as sidechain

    var input, sc, env, gain, compressed, sig;

    input = In.ar(inBus, 1);
    sc = if(sidechainBus >= 0, { In.ar(sidechainBus, 1) }, { input });

    env = Amplitude.kr(sc, attack.clip(0.0001, 1), release.clip(0.001, 2));
    env = env.ampdb;

    // Soft knee compression
    gain = Select.kr((env > threshold).asInteger, [
        0, // Below threshold: no reduction
        (env - threshold) * (1 - (1 / ratio.clip(1, 100))) * -1
    ]);

    compressed = input * (gain + makeup).dbamp;
    sig = XFade2.ar(input, compressed, mix.clip(0, 1) * 2 - 1);
    sig = Select.ar(bypass.clip(0, 1), [sig, input]);

    ReplaceOut.ar(outBus, sig);
}).add;

// ==========================================
// LIMITER
// ==========================================
SynthDef(\crucible_limiter, {
    |inBus=0, outBus=0, mix=1.0, bypass=0,
     ceiling=(-0.3), lookahead=0.005, release=0.05|

    var input, limited, sig;

    input = In.ar(inBus, 1);
    limited = Limiter.ar(input, ceiling.dbamp.clip(0.01, 1), lookahead.clip(0.001, 0.02));

    sig = XFade2.ar(input, limited, mix.clip(0, 1) * 2 - 1);
    sig = Select.ar(bypass.clip(0, 1), [sig, input]);

    ReplaceOut.ar(outBus, sig);
}).add;

// ==========================================
// NOISE GATE
// ==========================================
SynthDef(\crucible_gate, {
    |inBus=0, outBus=0, mix=1.0, bypass=0,
     threshold=(-40), range=(-80), attack=0.001, hold=0.05, release=0.1,
     sidechainBus=(-1)|

    var input, sc, env, gateSignal, gated, sig;

    input = In.ar(inBus, 1);
    sc = if(sidechainBus >= 0, { In.ar(sidechainBus, 1) }, { input });

    env = Amplitude.kr(sc, attack.clip(0.0001, 0.5), release.clip(0.001, 2));

    // Gate with hold time
    gateSignal = (env.ampdb > threshold);
    gateSignal = Trig1.kr(gateSignal, hold.clip(0.001, 1)) + gateSignal;
    gateSignal = gateSignal.clip(0, 1).lag(attack, release);

    // Range: how much to attenuate when gated (0 = full mute, -80dB = nearly mute)
    gated = input * gateSignal.linlin(0, 1, range.dbamp, 1);

    sig = XFade2.ar(input, gated, mix.clip(0, 1) * 2 - 1);
    sig = Select.ar(bypass.clip(0, 1), [sig, input]);

    ReplaceOut.ar(outBus, sig);
}).add;

// ==========================================
// EXPANDER
// ==========================================
SynthDef(\crucible_expander, {
    |inBus=0, outBus=0, mix=1.0, bypass=0,
     threshold=(-30), ratio=2, attack=0.005, release=0.1|

    var input, env, gain, expanded, sig;

    input = In.ar(inBus, 1);
    env = Amplitude.kr(input, attack.clip(0.0001, 0.5), release.clip(0.001, 2));

    // Expand: signals below threshold are attenuated more
    gain = Select.kr((env.ampdb < threshold).asInteger, [
        0, // Above threshold: no change
        (env.ampdb - threshold) * (ratio.clip(1, 20) - 1)
    ]);

    expanded = input * gain.dbamp;
    sig = XFade2.ar(input, expanded, mix.clip(0, 1) * 2 - 1);
    sig = Select.ar(bypass.clip(0, 1), [sig, input]);

    ReplaceOut.ar(outBus, sig);
}).add;

// ==========================================
// SIDECHAIN DUCKER
// ==========================================
SynthDef(\crucible_ducker, {
    |inBus=0, outBus=0, sidechainBus=0, mix=1.0, bypass=0,
     duckAmount=0.8, attack=0.005, release=0.15|

    var input, sc, env, ducked, sig;

    input = In.ar(inBus, 1);
    sc = In.ar(sidechainBus, 1);

    env = Amplitude.kr(sc, attack.clip(0.0001, 0.5), release.clip(0.001, 2));
    ducked = input * (1 - (env * duckAmount.clip(0, 1)));

    sig = XFade2.ar(input, ducked, mix.clip(0, 1) * 2 - 1);
    sig = Select.ar(bypass.clip(0, 1), [sig, input]);

    ReplaceOut.ar(outBus, sig);
}).add;

// ==========================================
// MULTIBAND COMPRESSOR (3-band)
// ==========================================
SynthDef(\crucible_multiband, {
    |inBus=0, outBus=0, mix=1.0, bypass=0,
     // Crossover frequencies
     lowFreq=200, highFreq=3000,
     // Low band
     lowThresh=(-12), lowRatio=3, lowAtk=0.01, lowRel=0.1, lowMakeup=0,
     // Mid band
     midThresh=(-12), midRatio=3, midAtk=0.005, midRel=0.08, midMakeup=0,
     // High band
     highThresh=(-12), highRatio=3, highAtk=0.003, highRel=0.05, highMakeup=0,
     // Band levels
     lowLevel=1, midLevel=1, highLevel=1|

    var input, low, mid, high;
    var lowEnv, midEnv, highEnv;
    var lowGain, midGain, highGain;
    var lowComp, midComp, highComp;
    var combined, sig;

    input = In.ar(inBus, 1);

    // 3-band split via Linkwitz-Riley (cascaded Butterworth)
    low = LPF.ar(LPF.ar(input, lowFreq.clip(20, 20000)), lowFreq.clip(20, 20000));
    high = HPF.ar(HPF.ar(input, highFreq.clip(20, 20000)), highFreq.clip(20, 20000));
    mid = input - low - high; // Complementary mid extraction

    // Per-band compression
    lowEnv = Amplitude.kr(low, lowAtk.clip(0.0001, 1), lowRel.clip(0.001, 2));
    lowGain = Select.kr((lowEnv.ampdb > lowThresh).asInteger, [
        0, (lowEnv.ampdb - lowThresh) * (1 - (1 / lowRatio.clip(1, 100))) * -1
    ]);
    lowComp = low * (lowGain + lowMakeup).dbamp * lowLevel;

    midEnv = Amplitude.kr(mid, midAtk.clip(0.0001, 1), midRel.clip(0.001, 2));
    midGain = Select.kr((midEnv.ampdb > midThresh).asInteger, [
        0, (midEnv.ampdb - midThresh) * (1 - (1 / midRatio.clip(1, 100))) * -1
    ]);
    midComp = mid * (midGain + midMakeup).dbamp * midLevel;

    highEnv = Amplitude.kr(high, highAtk.clip(0.0001, 1), highRel.clip(0.001, 2));
    highGain = Select.kr((highEnv.ampdb > highThresh).asInteger, [
        0, (highEnv.ampdb - highThresh) * (1 - (1 / highRatio.clip(1, 100))) * -1
    ]);
    highComp = high * (highGain + highMakeup).dbamp * highLevel;

    combined = lowComp + midComp + highComp;

    sig = XFade2.ar(input, combined, mix.clip(0, 1) * 2 - 1);
    sig = Select.ar(bypass.clip(0, 1), [sig, input]);

    ReplaceOut.ar(outBus, sig);
}).add;

// ==========================================
// DE-ESSER
// ==========================================
SynthDef(\crucible_deesser, {
    |inBus=0, outBus=0, mix=1.0, bypass=0,
     freq=6000,           // Center frequency of sibilance detection
     bandwidth=2000,      // Detection bandwidth
     threshold=(-20),     // Threshold in dB
     ratio=4,             // Compression ratio for sibilance band
     attack=0.001,        // Fast attack for sibilance
     release=0.03|        // Quick release

    var input, sibilance, env, gain, deessed, sig;

    input = In.ar(inBus, 1);

    // Extract sibilance band for detection
    sibilance = BPF.ar(input, freq.clip(2000, 16000),
        (bandwidth / freq).clip(0.1, 2));

    // Detect sibilance level
    env = Amplitude.kr(sibilance, attack.clip(0.0001, 0.1), release.clip(0.001, 0.5));

    // Gain reduction when sibilance exceeds threshold
    gain = Select.kr((env.ampdb > threshold).asInteger, [
        0,
        (env.ampdb - threshold) * (1 - (1 / ratio.clip(1, 20))) * -1
    ]);

    // Apply gain reduction only to the sibilance band, recombine
    deessed = input - sibilance + (sibilance * gain.dbamp);

    sig = XFade2.ar(input, deessed, mix.clip(0, 1) * 2 - 1);
    sig = Select.ar(bypass.clip(0, 1), [sig, input]);

    ReplaceOut.ar(outBus, sig);
}).add;

"--- BRAHMA: CRUCIBLE Dynamics FX Online (7 processors) ---".postln;

// ==========================================
// PATCH BAY REGISTRATION — Dynamics FX
// ==========================================
[
    [\crucible_compressor, [
        [\threshold, "Threshold dB"], [\ratio, "Ratio"],
        [\attack, "Attack time"], [\release, "Release time"],
        [\makeup, "Makeup gain"], [\mix, "Dry/wet mix"]
    ]],
    [\crucible_limiter, [
        [\ceiling, "Ceiling dB"], [\mix, "Dry/wet mix"]
    ]],
    [\crucible_gate, [
        [\threshold, "Threshold dB"], [\range, "Gate range"],
        [\attack, "Attack"], [\hold, "Hold time"], [\release, "Release"],
        [\mix, "Dry/wet mix"]
    ]],
    [\crucible_expander, [
        [\threshold, "Threshold dB"], [\ratio, "Expansion ratio"],
        [\attack, "Attack"], [\release, "Release"], [\mix, "Dry/wet mix"]
    ]],
    [\crucible_ducker, [
        [\duckAmount, "Duck amount"], [\attack, "Attack"],
        [\release, "Release"], [\mix, "Dry/wet mix"]
    ]],
    [\crucible_multiband, [
        [\lowFreq, "Low crossover"], [\highFreq, "High crossover"],
        [\lowThresh, "Low threshold"], [\midThresh, "Mid threshold"],
        [\highThresh, "High threshold"], [\mix, "Dry/wet mix"]
    ]],
    [\crucible_deesser, [
        [\freq, "Sibilance frequency"], [\threshold, "Threshold"],
        [\ratio, "Ratio"], [\mix, "Dry/wet mix"]
    ]]
].do({ |moduleSpec|
    var synthName = moduleSpec[0];
    var params = moduleSpec[1];
    params.do({ |p|
        ~PATCH_BAY.registerDestination(
            (synthName.asString ++ "_" ++ p[0].asString).asSymbol,
            p[0], synthName.asString ++ " " ++ p[1]
        );
    });
});
)
