/*
  Phase 15: Golem FX Chain
  Per-track effects: drive -> bitcrush -> delay -> reverb -> track bus
*/

(
// DRIVE (tanh waveshaping)
SynthDef(\golem_drive, {
    |inBus=0, outBus=0, amount=0, mix=0.5|

    var in, driven, sig;

    in = In.ar(inBus, 1);

    // tanh saturation scaled by amount (0=clean, 1=full drive)
    driven = (in * (1 + (amount.clip(0, 1) * 9))).tanh;

    sig = XFade2.ar(in, driven, mix.clip(0, 1) * 2 - 1);

    ReplaceOut.ar(outBus, sig);
}).add;

// BITCRUSH (sample rate + bit reduction)
SynthDef(\golem_bitcrush, {
    |inBus=0, outBus=0, amount=0, mix=0.5|

    var in, crushed, sampleRate, bits, sig;

    in = In.ar(inBus, 1);

    // amount 0..1 maps to: sampleRate 44100->1000, bits 24->4
    sampleRate = amount.clip(0, 1).linexp(0, 1, 44100, 1000);
    bits = amount.clip(0, 1).linlin(0, 1, 24, 4);

    // Quantize amplitude to bit depth, decimate sample rate
    crushed = Latch.ar(in, Impulse.ar(sampleRate));
    crushed = crushed.round(2.pow(bits.neg));

    sig = XFade2.ar(in, crushed, mix.clip(0, 1) * 2 - 1);

    ReplaceOut.ar(outBus, sig);
}).add;

// DELAY (CombL with feedback)
SynthDef(\golem_delay, {
    |inBus=0, outBus=0, time=0.25, feedback=0.3, mix=0|

    var in, delayed, sig;

    in = In.ar(inBus, 1);

    delayed = CombL.ar(in, 2.0, time.clip(0.01, 2.0), feedback.clip(0, 0.95) * 4);

    sig = XFade2.ar(in, delayed, mix.clip(0, 1) * 2 - 1);

    ReplaceOut.ar(outBus, sig);
}).add;

// REVERB (FreeVerb)
SynthDef(\golem_reverb, {
    |inBus=0, outBus=0, decay=1.5, mix=0|

    var in, verb, sig;

    in = In.ar(inBus, 1);

    verb = FreeVerb.ar(in,
        mix: 1,  // internal mix always wet; we crossfade externally
        room: decay.clip(0, 1),
        damp: 0.5
    );

    sig = XFade2.ar(in, verb, mix.clip(0, 1) * 2 - 1);

    ReplaceOut.ar(outBus, sig);
}).add;

"--- BRAHMA: Golem FX Chain Loaded ---".postln;
)
