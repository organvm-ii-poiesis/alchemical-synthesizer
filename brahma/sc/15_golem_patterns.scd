/*
  Phase 15: Golem Pattern Engine
  Factory presets, user preset save/load, generative patterns
*/

(
~golem_patterns = (

    // ==========================================
    // FACTORY ENGINE PRESETS
    // ==========================================
    // Each maps directly to SynthDef argument dictionaries
    factory: (
        kick808: (
            synthDef: \drum_subtractive,
            args: (freq: 55, oscType: 0, filterType: 0, cutoff: 400,
                   res: 2, envAmt: 0, atk: 0.001, dec: 0.5, sus: 0.1, rel: 0.3,
                   fAtk: 0.001, fDec: 0.08, fSus: 0, fRel: 0.05,
                   noiseAmt: 0, foldAmt: 0)
        ),
        snare: (
            synthDef: \drum_noise,
            args: (freq: 180, amount: 0.7, filterType: 1, cutoff: 1000,
                   res: 1, envAmt: 0, atk: 0.001, dec: 0.15, sus: 0, rel: 0.1,
                   fAtk: 0.001, fDec: 0.08, fSus: 0, fRel: 0.05)
        ),
        clap: (
            synthDef: \drum_noise,
            args: (freq: 100, amount: 0.9, filterType: 2, cutoff: 1500,
                   res: 2, envAmt: 0, atk: 0.001, dec: 0.2, sus: 0, rel: 0.15,
                   fAtk: 0.001, fDec: 0.1, fSus: 0, fRel: 0.05)
        ),
        hihatClosed: (
            synthDef: \drum_noise,
            args: (freq: 800, amount: 1, filterType: 1, cutoff: 7000,
                   res: 3, envAmt: 0, atk: 0.001, dec: 0.04, sus: 0, rel: 0.02,
                   fAtk: 0.001, fDec: 0.02, fSus: 0, fRel: 0.01)
        ),
        hihatOpen: (
            synthDef: \drum_noise,
            args: (freq: 800, amount: 1, filterType: 1, cutoff: 6000,
                   res: 2, envAmt: 0, atk: 0.001, dec: 0.25, sus: 0.1, rel: 0.15,
                   fAtk: 0.001, fDec: 0.1, fSus: 0.05, fRel: 0.1)
        ),
        tom: (
            synthDef: \drum_subtractive,
            args: (freq: 100, oscType: 0, filterType: 0, cutoff: 1500,
                   res: 1, envAmt: 0.5, atk: 0.001, dec: 0.3, sus: 0, rel: 0.2,
                   fAtk: 0.001, fDec: 0.15, fSus: 0, fRel: 0.1,
                   noiseAmt: 0, foldAmt: 0)
        ),
        rim: (
            synthDef: \drum_subtractive,
            args: (freq: 400, oscType: 2, filterType: 2, cutoff: 2000,
                   res: 8, envAmt: 0, atk: 0.001, dec: 0.03, sus: 0, rel: 0.02,
                   fAtk: 0.001, fDec: 0.01, fSus: 0, fRel: 0.01,
                   noiseAmt: 0, foldAmt: 0)
        ),
        fmBell: (
            synthDef: \drum_fm,
            args: (freq: 440, ratio: 3.5, index: 5, filterType: 0, cutoff: 6000,
                   res: 1, envAmt: 0, atk: 0.001, dec: 0.8, sus: 0.2, rel: 0.5,
                   fAtk: 0.001, fDec: 0.3, fSus: 0.1, fRel: 0.2,
                   noiseAmt: 0, foldAmt: 0)
        ),
        pluck: (
            synthDef: \drum_karplus,
            args: (freq: 220, karpDecay: 0.4, filterType: 0, cutoff: 3000,
                   res: 1, envAmt: 0, atk: 0.001, dec: 0.4, sus: 0, rel: 0.2,
                   fAtk: 0.001, fDec: 0.2, fSus: 0, fRel: 0.1,
                   noiseAmt: 0, foldAmt: 0)
        )
    ),

    // ==========================================
    // USER PRESETS (save/load)
    // ==========================================
    userPresets: Dictionary.new,

    savePreset: { |self, name, preset|
        self.userPresets.put(name.asSymbol, preset.deepCopy);
        "GOLEM: Preset '%' saved".format(name).postln;
    },

    loadPreset: { |self, name|
        var preset = self.userPresets[name.asSymbol];
        if(preset.notNil) {
            "GOLEM: Preset '%' loaded".format(name).postln;
            ^preset.deepCopy;
        } {
            "GOLEM: Preset '%' not found".format(name).warn;
            ^nil;
        };
    },

    listPresets: { |self|
        var names = self.factory.keys.asArray ++ self.userPresets.keys.asArray;
        "GOLEM: Available presets: %".format(names).postln;
        ^names;
    },

    // ==========================================
    // GENERATIVE PATTERNS (SC-native via Pdef/Pbind)
    // ==========================================

    // Generate a Euclidean rhythm as a boolean array
    euclidean: { |self, hits, steps|
        var pattern, counts, remainders, level, divisor;
        pattern = Array.fill(steps, { |i| i < hits });
        // Bjorklund algorithm
        counts = Array.fill(steps, 1);
        remainders = Array.newClear(steps);
        remainders[0] = hits;
        level = 0;
        divisor = steps - hits;
        loop {
            var newPat;
            if(divisor <= 1) { level };  // break condition
            counts[level + 1] = divisor.div(remainders[level]).max(1);
            remainders[level + 1] = divisor.mod(remainders[level]);
            divisor = remainders[level + 1];
            level = level + 1;
            if(divisor <= 0) { level };
        };
        // Simple Euclidean via modular spacing
        ^Array.fill(steps, { |i|
            ((i * hits) % steps) < hits
        });
    },

    // Generate a variation of an existing pattern
    // amount: 0..1 (0=identical, 1=fully random)
    generateVariation: { |self, pattern, amount=0.3|
        var result = pattern.deepCopy;
        result.do({ |step, i|
            if(amount.coin) {
                // Toggle step activity
                result[i] = result[i].copy;
                result[i][\active] = result[i][\active].not;
            };
            if(result[i][\active] and: { (amount * 0.5).coin }) {
                // Jitter velocity
                result[i][\velocity] = (result[i][\velocity] + rrand(-0.2, 0.2) * amount).clip(0.1, 1.0);
            };
        });
        "GOLEM: Variation generated (amount: %)".format(amount).postln;
        ^result;
    },

    // Generate a fill for the last N steps using Euclidean density
    generateFill: { |self, numSteps=16, fillLength=4, density=0.75|
        var pattern, fillStart, eucl;
        pattern = Array.fill(numSteps, {
            (active: false, velocity: 0.8, pLocks: nil)
        });

        fillStart = numSteps - fillLength;
        eucl = self.euclidean(
            (fillLength * density).round.asInteger.clip(1, fillLength),
            fillLength
        );

        fillLength.do({ |i|
            pattern[fillStart + i][\active] = eucl[i];
            if(eucl[i]) {
                // Rising velocity toward end of fill
                pattern[fillStart + i][\velocity] = (0.6 + (i / fillLength * 0.4)).clip(0.1, 1.0);
            };
        });

        "GOLEM: Fill generated (% steps, density %)".format(fillLength, density).postln;
        ^pattern;
    },

    // Create a Pdef pattern for algorithmic drumming
    makePdef: { |self, name, trackId, presetName, stepsPerBar=16, tempo=120|
        var preset = self.factory[presetName.asSymbol];
        if(preset.isNil) {
            "GOLEM: Unknown preset '%' for Pdef".format(presetName).warn;
            ^nil;
        };

        Pdef(name.asSymbol,
            Pbind(
                \instrument, preset[\synthDef],
                \dur, Pfunc({ (60 / tempo / (stepsPerBar / 4)) }),
                \velocity, Pwhite(0.6, 1.0),
                \freq, preset[\args][\freq] ? 150
            )
        );
        "GOLEM: Pdef '%' created for track %".format(name, trackId).postln;
    }
);

"--- BRAHMA: Golem Pattern Engine Loaded ---".postln;
)
