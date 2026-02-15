/*
  Tier 1: VOICE — Demo Patch
  Self-playing generative composition that boots with the system.
  Combines Prima Materia, MOIRAI Markov melody, Euclidean rhythm,
  Lorenz attractor modulation, and reverb FX.

  /brahma/demo/start — begin
  /brahma/demo/stop  — silence
*/

(
~demo_patch = (
    active: false,
    synths: List.new,
    buses: IdentityDictionary.new,
    instances: List.new,

    start: { |self|
        if(self[\active].not) {
            var melodyBus, reverbBus, markov, pentatonic, euclidean;
            var lorenzBusX, lorenzBusY, lorenzBusZ, lorenz, reverb;

            self[\active] = true;

            // Allocate internal buses
            melodyBus = Bus.audio(s, 2);
            reverbBus = Bus.audio(s, 2);
            self[\buses][\melody] = melodyBus;
            self[\buses][\reverb] = reverbBus;

            // 1. Create MOIRAI Markov chain trained on pentatonic intervals
            markov = ~moirai.(12);
            // Train on pentatonic scale degrees (C D E G A in MIDI offsets)
            pentatonic = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 12, 7];
            markov.train(pentatonic);
            markov.setTemperature(0.7);
            self[\instances].add([\moirai, markov]);

            // 2. Create Euclidean rhythm generator E(5, 8)
            if(~daemon_euclidean_ext.notNil) {
                euclidean = ~daemon_euclidean_ext.(8, 5, 2, 0);
                euclidean.generate;
            };
            self[\instances].add([\euclidean, euclidean]);

            // 3. Create Lorenz attractor for filter modulation
            lorenzBusX = Bus.control(s, 1);
            lorenzBusY = Bus.control(s, 1);
            lorenzBusZ = Bus.control(s, 1);
            self[\buses][\lorenzX] = lorenzBusX;
            self[\buses][\lorenzY] = lorenzBusY;
            self[\buses][\lorenzZ] = lorenzBusZ;

            lorenz = Synth(\daemon_lorenz, [
                \outBusX, lorenzBusX.index,
                \outBusY, lorenzBusY.index,
                \outBusZ, lorenzBusZ.index,
                \sigma, 10, \rho, 28, \beta, 2.667,
                \rate, 2.0, \scale, 0.03
            ]);
            self[\synths].add(lorenz);

            // 4. Create a reverb on the reverb bus → main out
            reverb = Synth(\aion_hall, [
                \inBus, melodyBus.index,
                \outBus, 0,
                \mix, 0.35,
                \decay, 3.0,
                \damping, 0.4
            ], ~sc_grp[\rr], \addToHead);
            self[\synths].add(reverb);

            // 5. Start the generative Tdef
            Tdef(\demo_patch_gen, {
                var baseNote = 48; // C3
                var tempo = ~chronos[\tempo] ? 120;
                var stepDur, gate, vel;

                loop {
                    stepDur = 60 / tempo / 4; // 16th notes

                    // Advance Euclidean (or use fixed pattern fallback)
                    gate = try {
                        euclidean.advance;
                        euclidean.gate;
                    } { [1, 1, 0, 1, 0, 1, 0, 0].wrapAt(
                        (thisThread.seconds * 4).asInteger % 8) };
                    vel = try { euclidean.velocity } { 0.6 };

                    if(gate > 0) {
                        var interval, note, freq, cutoff, voice;
                        interval = (markov[\next].(markov) * 24).round.asInteger;
                        note = baseNote + interval;
                        note = note.clip(36, 84);

                        freq = note.midicps;

                        // Read Lorenz for cutoff modulation
                        lorenzBusX.get({ |v| cutoff = v.linexp(0, 1, 400, 8000) });
                        cutoff = cutoff ? 2000;

                        // Spawn a Prima Materia voice
                        voice = Synth(\prima_materia, [
                            \freq, freq,
                            \velocity, vel * 0.5, // Gentle volume
                            \gate, 1,
                            \outBus, melodyBus.index,
                            \cutoff, cutoff,
                            \resonance, 1.5,
                            \filterType, 0,
                            \atk, 0.01,
                            \dec, 0.2,
                            \sus, 0.4,
                            \rel, 0.6,
                            \osc1Type, 1, // saw
                            \osc2Type, 0, // sine
                            \osc2Detune, 5,
                            \osc2Level, 0.3
                        ], ~sc_grp[\te], \addToTail);

                        // Release after a fraction of the step
                        {
                            (stepDur * 0.7).wait;
                            voice.set(\gate, 0);
                        }.fork;
                    };

                    // Update tempo from CHRONOS if running
                    if(~chronos.notNil and: { ~chronos[\tempo].notNil }) {
                        tempo = ~chronos[\tempo];
                    };

                    stepDur.wait;
                };
            }).play;

            // Broadcast state
            if(~visual_cortex.notNil) {
                ~visual_cortex.target.sendMsg("/brahma/demo/state", 1);
            };

            "--- BRAHMA: Demo Patch PLAYING ---".postln;
            "  Prima Materia + MOIRAI melody + E(5,8) rhythm + Lorenz filter mod + Hall reverb".postln;
        };
    },

    stop: { |self|
        if(self[\active]) {
            self[\active] = false;

            // Stop the Tdef
            Tdef(\demo_patch_gen).stop;

            // Free all synths
            self[\synths].do({ |s| s.free });
            self[\synths] = List.new;

            // Free buses
            self[\buses].do({ |b| b.free });
            self[\buses] = IdentityDictionary.new;

            // Clear instances
            self[\instances] = List.new;

            // Broadcast state
            if(~visual_cortex.notNil) {
                ~visual_cortex.target.sendMsg("/brahma/demo/state", 0);
            };

            "--- BRAHMA: Demo Patch STOPPED ---".postln;
        };
    }
);

// ==========================================
// OSC RESPONDERS
// ==========================================
OSCdef(\demo_start, { ~demo_patch.start }, "/brahma/demo/start");
OSCdef(\demo_stop, { ~demo_patch.stop }, "/brahma/demo/stop");

// Auto-start after 1 second delay
{ 1.0.wait; ~demo_patch.start; }.fork;

"--- BRAHMA: Demo Patch Loaded (auto-start in 1s) ---".postln;
)
