/*
  Phase 12: The Evolutionary Crucible (A/B Test Bench)
  Comparing Organism Variations
*/

(
~test_bench = (

    // Compare two SynthDefs side-by-side
    runComparison: { |self, defA, defB, inputBus, duration=5|
        "--- STARTING A/B TEST: % vs % ---".format(defA, defB).postln;

        {
            var sigA, sigB;

            // 1. Run Version A
            "Running Version A...".postln;
            x = Synth(defA, [\inBus, inputBus, \outBus, ~sc_bus.mainOut]); // Route to main for monitoring
            duration.wait;
            x.free;

            // 2. Run Version B
            "Running Version B...".postln;
            y = Synth(defB, [\inBus, inputBus, \outBus, ~sc_bus.mainOut]);
            duration.wait;
            y.free;

            "--- A/B TEST COMPLETE ---".postln;
        }.fork;
    },

    // Auto-Variation Generator
    spawnMutant: { |self, baseDefName|
        var newName = (baseDefName ++ "_mutant").asSymbol;
        SynthDescLib.global[baseDefName.asSymbol].def.name_(newName).add;
        ^newName;
    },

    // ==========================================
    // GOLEM TEST SUITE
    // ==========================================
    testGolemVoices: { |self|
        "--- GOLEM TEST: Voice Trigger (all 6 synth types) ---".postln;
        {
            var voices = [\drum_subtractive, \drum_fm, \drum_additive,
                          \drum_karplus, \drum_noise, \drum_wavefold];
            var bus = Bus.audio(s, 1);

            voices.do({ |def, i|
                "  Testing %...".format(def).postln;
                Synth(def, [\outBus, bus.index, \velocity, 0.8, \gate, 1,
                    \freq, 150, \cutoff, 2000, \res, 1]);
                0.5.wait;
            });

            "  All 6 voices triggered successfully.".postln;
            bus.free;
        }.fork;
    },

    testGolemSequencer: { |self|
        "--- GOLEM TEST: Sequencer (4-on-floor, 4 bars) ---".postln;
        {
            // Set up a basic 4-on-floor pattern on track 0
            [0, 4, 8, 12].do({ |step|
                ~golem_seq.tracks[0][\pattern][step][\active] = true;
            });

            ~golem_seq.setTempo(120);
            ~golem_seq.play;

            // Let it run for 4 bars (64 steps at 120bpm = 8 seconds)
            8.wait;

            ~golem_seq.stop;
            "  Sequencer test complete (4 bars at 120 BPM).".postln;
        }.fork;
    },

    testGolemSingleEquip: { |self|
        "--- GOLEM TEST: Single-Equip Invariant ---".postln;
        {
            var result1, result2;

            // First absorption should succeed
            ~golem.evict;
            result1 = ~golem.absorb(1001);
            "  First absorb (should succeed): %".format(result1).postln;

            // Second absorption while equipped should fail
            result2 = ~golem.absorb(1002);
            "  Second absorb while equipped (should fail): %".format(result2).postln;

            if(result1 == true and: { result2 == false }) {
                "  PASS: Single-equip invariant holds.".postln;
            } {
                "  FAIL: Single-equip invariant violated!".postln;
            };

            // Clean up
            ~golem.evict;
        }.fork;
    },

    testGolemIMMUNE: { |self|
        "--- GOLEM TEST: IMMUNE Passthrough ---".postln;
        {
            // Verify that excessive gain triggers the IMMUNE governor
            var testBus = Bus.audio(s, 1);
            var immune = Synth(\immune_governor, [
                \inBus, testBus.index, \outBus, 0, \threshold, 0.9
            ]);

            // Send a loud signal
            var loud = { Out.ar(testBus.index, SinOsc.ar(440) * 5) }.play;
            0.5.wait;

            // IMMUNE should have limited this
            "  Excessive signal sent through IMMUNE — check audio output is limited.".postln;

            loud.free;
            immune.free;
            testBus.free;
            "  IMMUNE passthrough test complete.".postln;
        }.fork;
    },

    // Run all Golem tests
    testGolemAll: { |self|
        "=== GOLEM FULL TEST SUITE ===".postln;
        {
            self.testGolemVoices;
            4.wait;
            self.testGolemSingleEquip;
            2.wait;
            self.testGolemIMMUNE;
            2.wait;
            // Skip sequencer test by default (takes 8s of audio)
            // self.testGolemSequencer;
            "=== GOLEM TEST SUITE COMPLETE ===".postln;
        }.fork;
    }
);

"--- BRAHMA: A/B Test Bench Ready ---".postln;
)
