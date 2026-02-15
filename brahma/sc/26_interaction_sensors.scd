/*
  Phase 7: CORPUS HERMETICUM — Sensor & Audio Analysis
  PNEUMA (Envelope/Pitch/Spectrum Follower),
  SENSORIUM (Universal Sensor Bridge)
*/

(
// ==========================================
// 1. PNEUMA AMPLITUDE — Envelope Follower
// ==========================================
// Tracks amplitude of audio input with configurable attack/release.
// sensitivity scales the output for gain staging into downstream CV.
SynthDef(\pneuma_amplitude, {
    |inBus=0, outBus=0, attack=0.01, release=0.1, sensitivity=1.0|

    var input, amp;

    input = In.ar(inBus, 1);

    amp = Amplitude.kr(input,
        attack.clip(0.0001, 1.0),
        release.clip(0.001, 5.0)
    );

    // Scale by sensitivity and clip to safe range
    Out.kr(outBus, (amp * sensitivity.clip(0.01, 10.0)).clip(0, 1));
}).add;

// ==========================================
// 2. PNEUMA PITCH — Pitch Detection
// ==========================================
// Uses Pitch.kr for monophonic pitch tracking.
// Outputs normalized frequency (0-1 mapped from minFreq-maxFreq)
// and hasFreq confidence signal.
SynthDef(\pneuma_pitch, {
    |inBus=0, outBusPitch=0, outBusHasFreq=1,
     minFreq=60, maxFreq=4000|

    var input, freq, hasFreq, normalizedPitch;

    input = In.ar(inBus, 1);

    # freq, hasFreq = Pitch.kr(input,
        minFreq: minFreq.clip(20, 500),
        maxFreq: maxFreq.clip(500, 12000)
    );

    // Normalize detected frequency to 0-1 range
    normalizedPitch = freq.linlin(
        minFreq.clip(20, 500),
        maxFreq.clip(500, 12000),
        0, 1
    ).clip(0, 1);

    Out.kr(outBusPitch,    normalizedPitch);
    Out.kr(outBusHasFreq,  hasFreq);
}).add;

// ==========================================
// 3. PNEUMA SPECTRUM — Spectral Feature Extraction
// ==========================================
// FFT-based analysis outputting three spectral descriptors:
//   - Centroid: brightness (spectral center of mass)
//   - Flatness: noisiness (0=tonal, 1=noise)
//   - Flux: rate of spectral change (onset-like measure)
SynthDef(\pneuma_spectrum, {
    |inBus=0, outBusCentroid=0, outBusFlatness=1, outBusFlux=2|

    var input, fft, fftCopy, centroid, flatness, flux;

    input = In.ar(inBus, 1);

    // Primary FFT chain — 2048 samples for good frequency resolution
    fft = FFT(LocalBuf(2048), input);

    // Spectral centroid: normalized to 0-1 via Nyquist scaling
    centroid = SpecCentroid.kr(fft);
    centroid = (centroid / (SampleRate.ir * 0.5)).clip(0, 1);

    // Spectral flatness: already 0-1 (Wiener entropy)
    flatness = SpecFlatness.kr(fft);
    flatness = flatness.clip(0, 1);

    // Spectral flux approximation (FFTFlux requires sc3-plugins):
    // Track rate of amplitude change as a proxy for spectral change
    flux = (Slope.kr(Amplitude.kr(input, 0.01, 0.1)).abs * 10).clip(0, 1);

    Out.kr(outBusCentroid, centroid);
    Out.kr(outBusFlatness, flatness);
    Out.kr(outBusFlux,     flux);
}).add;

// ==========================================
// 4. PNEUMA ONSET — Onset Detector
// ==========================================
// Detects transient onsets in audio stream.
// type: 0=power, 1=phase, 2=complex (detection algorithm)
// Outputs a trigger (single-sample impulse) on each detected onset.
SynthDef(\pneuma_onset, {
    |inBus=0, outBus=0, threshold=0.5, type=0|

    var input, fft, onset, typeSelect;

    input = In.ar(inBus, 1);

    fft = FFT(LocalBuf(512), input);

    // Map integer type to Onsets type symbol index
    // 0=\power, 1=\phase, 2=\complex
    typeSelect = Select.kr(type.clip(0, 2), [
        // Onsets type indices: power=0, phase=3, complex=4
        // Using the odftype parameter as integer
        0, 3, 4
    ]);

    onset = Onsets.kr(fft,
        threshold.clip(0.01, 1.0),
        typeSelect
    );

    Out.kr(outBus, onset);
}).add;

// ==========================================
// SENSORIUM — Universal Sensor Bridge
// ==========================================
// Language-side mapper that accepts arbitrary named sensor values
// via OSC, scales them through configurable mapping curves,
// and writes the result to control buses.
~sensorium = (
    mappings: IdentityDictionary.new,

    // Register a named sensor mapping
    addMapping: { |self, sensorName, outBus, minIn=0, maxIn=1, minOut=0, maxOut=1, curve=\linear|
        self[\mappings][sensorName.asSymbol] = (
            outBus: outBus,
            minIn: minIn,
            maxIn: maxIn,
            minOut: minOut,
            maxOut: maxOut,
            curve: curve
        );
        ("SENSORIUM: Mapped sensor '" ++ sensorName ++ "' → bus " ++ outBus ++ " [" ++ curve ++ "]").postln;
    },

    // Remove a named sensor mapping
    removeMapping: { |self, sensorName|
        var removed = self[\mappings].removeAt(sensorName.asSymbol);
        if(removed.notNil) {
            ("SENSORIUM: Unmapped sensor '" ++ sensorName ++ "'").postln;
        } {
            ("SENSORIUM: No mapping found for '" ++ sensorName ++ "'").postln;
        };
    },

    // Process an incoming sensor value through its mapping
    processSensor: { |self, sensorName, value|
        var mapping = self[\mappings][sensorName.asSymbol];
        if(mapping.notNil) {
            var mapped;
            switch(mapping[\curve],
                \linear, {
                    mapped = value.linlin(
                        mapping[\minIn], mapping[\maxIn],
                        mapping[\minOut], mapping[\maxOut]
                    );
                },
                \exponential, {
                    mapped = value.linexp(
                        mapping[\minIn], mapping[\maxIn],
                        mapping[\minOut].max(0.001), mapping[\maxOut]
                    );
                },
                \logarithmic, {
                    mapped = value.lincurve(
                        mapping[\minIn], mapping[\maxIn],
                        mapping[\minOut], mapping[\maxOut],
                        -4
                    );
                },
                // Default: fall through to linear if curve is unrecognized
                {
                    mapped = value.linlin(
                        mapping[\minIn], mapping[\maxIn],
                        mapping[\minOut], mapping[\maxOut]
                    );
                }
            );
            mapping[\outBus].set(mapped);
        };
    },

    // List all active mappings
    listMappings: { |self|
        "SENSORIUM: Active mappings:".postln;
        self[\mappings].keysValuesDo({ |name, mapping|
            ("  " ++ name ++ " → bus " ++ mapping[\outBus]
                ++ " [" ++ mapping[\minIn] ++ "-" ++ mapping[\maxIn]
                ++ " → " ++ mapping[\minOut] ++ "-" ++ mapping[\maxOut]
                ++ " " ++ mapping[\curve] ++ "]").postln;
        });
    }
);

// ==========================================
// OSC RESPONDERS — Sensors & SENSORIUM
// ==========================================

// --- Universal Sensor Input ---
// /brahma/sensor/[name] [value]
// Wildcard responder: any sensor name is routed through SENSORIUM.
OSCdef(\sensorium_input, { |msg, time, addr|
    var fullAddr = msg[0].asString;
    var value = msg[1].asFloat;
    var sensorName;

    // Extract sensor name from address: /brahma/sensor/[name]
    if(fullAddr.beginsWith("/brahma/sensor/")) {
        sensorName = fullAddr.drop(15); // Length of "/brahma/sensor/"
        ~sensorium.processSensor(sensorName, value);
    };
}, "/brahma/sensor", recvPort: nil);

// --- SENSORIUM Mapping Management ---
// /sensorium/map [name] [busIdx] [minIn] [maxIn] [minOut] [maxOut] [curve]
OSCdef(\sensorium_map, { |msg|
    var name   = msg[1].asString;
    var busIdx = msg[2].asInteger;
    var minIn  = msg[3].asFloat;
    var maxIn  = msg[4].asFloat;
    var minOut = msg[5].asFloat;
    var maxOut = msg[6].asFloat;
    var curve  = if(msg[7].notNil) { msg[7].asString.asSymbol } { \linear };
    var bus    = Bus(\control, busIdx, 1, s);

    ~sensorium.addMapping(name, bus, minIn, maxIn, minOut, maxOut, curve);
}, "/sensorium/map");

// /sensorium/unmap [name]
OSCdef(\sensorium_unmap, { |msg|
    var name = msg[1].asString;
    ~sensorium.removeMapping(name);
}, "/sensorium/unmap");

// --- PNEUMA Configuration ---
// /pneuma/config [type] [param] [value]
// Allows runtime reconfiguration of running PNEUMA analysis synths.
// type: "amplitude", "pitch", "spectrum", "onset"
// param: synth argument name (e.g., "attack", "release", "threshold")
OSCdef(\pneuma_config, { |msg|
    var type  = msg[1].asString;
    var param = msg[2].asString.asSymbol;
    var value = msg[3].asFloat;

    switch(type,
        "amplitude", {
            if(~pneuma_amp.notNil) {
                ~pneuma_amp.set(param, value);
                ("PNEUMA: amplitude." ++ param ++ " = " ++ value).postln;
            };
        },
        "pitch", {
            if(~pneuma_pitch.notNil) {
                ~pneuma_pitch.set(param, value);
                ("PNEUMA: pitch." ++ param ++ " = " ++ value).postln;
            };
        },
        "spectrum", {
            if(~pneuma_spectrum.notNil) {
                ~pneuma_spectrum.set(param, value);
                ("PNEUMA: spectrum." ++ param ++ " = " ++ value).postln;
            };
        },
        "onset", {
            if(~pneuma_onset.notNil) {
                ~pneuma_onset.set(param, value);
                ("PNEUMA: onset." ++ param ++ " = " ++ value).postln;
            };
        },
        { ("PNEUMA: Unknown type '" ++ type ++ "'").postln; }
    );
}, "/pneuma/config");

// ==========================================
// GLOBAL STATE INITIALIZATION
// ==========================================
// Placeholder synth references — assigned during performance instantiation.
// Set these globals when spawning PNEUMA analysis synths in a patch.
~pneuma_amp      = nil;
~pneuma_pitch    = nil;
~pneuma_spectrum = nil;
~pneuma_onset    = nil;

"--- BRAHMA: CORPUS HERMETICUM Sensors Online (5 modules) ---".postln;
"  PNEUMA: Amplitude | Pitch | Spectrum | Onset".postln;
"  SENSORIUM: Universal Sensor Bridge (Language-side)".postln;

// ==========================================
// PATCH BAY REGISTRATION — Sensors
// ==========================================
// Sensors output analysis CV — register configurable params as destinations.
[
    [\pneuma_amplitude, [
        [\attack, "Follower attack"], [\release, "Follower release"],
        [\sensitivity, "Output sensitivity"]
    ]],
    [\pneuma_pitch, [
        [\minFreq, "Min detection freq"], [\maxFreq, "Max detection freq"]
    ]],
    [\pneuma_onset, [
        [\threshold, "Onset threshold"], [\type, "Detection algorithm"]
    ]]
].do({ |moduleSpec|
    var synthName = moduleSpec[0];
    var params = moduleSpec[1];
    params.do({ |p|
        ~patch_bay.registerDestination(
            (synthName.asString ++ "_" ++ p[0].asString).asSymbol,
            p[0], synthName.asString ++ " " ++ p[1]
        );
    });
});
)
