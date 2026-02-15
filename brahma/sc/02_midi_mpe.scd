/*
  Phase 0B: MIDI & MPE Infrastructure
  Voice allocation, per-note expression, MIDI learn, clock
*/

(
// ==========================================
// GLOBAL MIDI STATE
// ==========================================
~brahma_midi = (
    mpe: BrahmaMPE.new(16, true),
    enabled: false,
    clockRunning: false,
    clockTempo: 120,
    clockCount: 0,
    externalSync: false,

    // MIDI Learn state
    learnMode: false,
    learnTarget: nil,    // Target parameter path
    learnRoutes: Dictionary.new,  // CC -> parameter mapping

    // Active synth target (which SynthDef to trigger from MIDI)
    targetSynthDef: \drum_subtractive,
    targetOutBus: 0,
    targetGroup: nil,

    // CC state (for all 128 CCs on all 16 channels)
    ccState: Array.fill(16, { Array.fill(128, 0.0) })
);

// ==========================================
// MIDI INITIALIZATION
// ==========================================
~brahma_midi[\init] = { |self|
    MIDIClient.init;
    MIDIIn.connectAll;
    self[\enabled] = true;
    self[\targetGroup] = ~sc_grp[\te];

    // Initialize MIDI output (first available destination, or nil if none)
    if(MIDIClient.destinations.size > 0) {
        self[\midiOut] = MIDIOut(0);
        "MIDI: Output initialized (%)".format(MIDIClient.destinations[0]).postln;
    } {
        self[\midiOut] = nil;
        "MIDI: No output destinations available".postln;
    };

    // ==========================================
    // NOTE ON
    // ==========================================
    MIDIdef.noteOn(\brahma_noteOn, { |vel, note, ch, src|
        var voiceIdx, freq, v;

        voiceIdx = self[\mpe].allocateVoice(ch, note, vel);
        v = self[\mpe].voices[voiceIdx];

        // Get frequency from tuning system
        freq = self[\mpe].voiceFreq(voiceIdx,
            ~brahma_tuning[\currentScale],
            ~brahma_tuning[\rootHz]);

        // Apply global transpose
        freq = freq * (2 ** (~brahma_tuning[\transpose] / 12));

        v[\freq] = freq;

        // Spawn synth
        v[\synthNode] = Synth(self[\targetSynthDef], [
            \outBus, self[\targetOutBus],
            \freq, freq,
            \gate, 1,
            \velocity, vel / 127,
            \pressure, v[\pressure],
            \slide, v[\slide]
        ], target: self[\targetGroup]);

        // Broadcast to Visual Cortex
        if(~visual_cortex.notNil) {
            ~visual_cortex.target.sendMsg("/brahma/midi/noteOn",
                ch, note, vel, voiceIdx);
        };
    });

    // ==========================================
    // NOTE OFF
    // ==========================================
    MIDIdef.noteOff(\brahma_noteOff, { |vel, note, ch, src|
        var voiceIdx = self[\mpe].findVoice(ch, note);
        if(voiceIdx.notNil) {
            var v = self[\mpe].voices[voiceIdx];
            self[\mpe].releaseVoice(voiceIdx, vel);
            if(v[\synthNode].notNil) {
                v[\synthNode].set(\gate, 0);
                v[\synthNode] = nil;
            };
            if(~visual_cortex.notNil) {
                ~visual_cortex.target.sendMsg("/brahma/midi/noteOff",
                    ch, note, vel, voiceIdx);
            };
        };
    });

    // ==========================================
    // PITCH BEND (per-channel for MPE)
    // ==========================================
    MIDIdef.bend(\brahma_bend, { |bendVal, ch, src|
        self[\mpe].setBend(ch, bendVal);

        // Update running synth nodes with new frequency
        self[\mpe].findVoicesByChannel(ch).do({ |idx|
            var v = self[\mpe].voices[idx];
            if(v[\synthNode].notNil) {
                var freq = self[\mpe].voiceFreq(idx,
                    ~brahma_tuning[\currentScale],
                    ~brahma_tuning[\rootHz]);
                freq = freq * (2 ** (~brahma_tuning[\transpose] / 12));
                v[\synthNode].set(\freq, freq);
            };
        });
    });

    // ==========================================
    // CHANNEL PRESSURE / AFTERTOUCH
    // ==========================================
    MIDIdef.touch(\brahma_touch, { |pressure, ch, src|
        self[\mpe].setPressure(ch, pressure);

        self[\mpe].findVoicesByChannel(ch).do({ |idx|
            var v = self[\mpe].voices[idx];
            if(v[\synthNode].notNil) {
                v[\synthNode].set(\pressure, pressure / 127);
            };
        });
    });

    // ==========================================
    // CC (including CC74 = MPE slide)
    // ==========================================
    MIDIdef.cc(\brahma_cc, { |val, cc, ch, src|
        self[\ccState][ch][cc] = val;

        // MPE Slide (CC74)
        if(cc == 74) {
            self[\mpe].setSlide(ch, val);
            self[\mpe].findVoicesByChannel(ch).do({ |idx|
                var v = self[\mpe].voices[idx];
                if(v[\synthNode].notNil) {
                    v[\synthNode].set(\slide, val / 127);
                };
            });
        };

        // MIDI Learn: if in learn mode, capture this CC
        if(self[\learnMode] and: { self[\learnTarget].notNil }) {
            var key = (ch.asString ++ "_" ++ cc.asString).asSymbol;
            self[\learnRoutes].put(key, (
                channel: ch, cc: cc,
                target: self[\learnTarget]
            ));
            "MIDI Learn: CC% ch% -> %".format(cc, ch, self[\learnTarget]).postln;
            self[\learnMode] = false;
            self[\learnTarget] = nil;
        };

        // Apply learned routes
        self[\learnRoutes].keysValuesDo({ |key, route|
            if(route[\channel] == ch and: { route[\cc] == cc }) {
                // Route to patch bay or direct parameter
                if(~visual_cortex.notNil) {
                    ~visual_cortex.target.sendMsg("/brahma/midi/cc",
                        ch, cc, val, route[\target]);
                };
            };
        });
    });

    // ==========================================
    // MIDI CLOCK
    // ==========================================
    MIDIdef(\brahma_clock, { |src|
        self[\clockCount] = self[\clockCount] + 1;

        // 24 PPQN: calculate tempo every 24 ticks
        if((self[\clockCount] % 24) == 0) {
            // Could calculate tempo from tick intervals here
        };
    }, \clock);

    MIDIdef(\brahma_start, {
        self[\clockCount] = 0;
        self[\clockRunning] = true;
        "MIDI: External clock started".postln;
    }, \start);

    MIDIdef(\brahma_stop, {
        self[\clockRunning] = false;
        "MIDI: External clock stopped".postln;
    }, \stop);

    "MIDI: Input handlers initialized".postln;
};

// ==========================================
// MIDI OUTPUT
// ==========================================
~brahma_midi[\sendNote] = { |self, ch, note, vel, dur=0.25|
    // Requires MIDIOut to be initialized
    if(self[\midiOut].notNil) {
        self[\midiOut].noteOn(ch, note, vel);
        SystemClock.sched(dur, {
            self[\midiOut].noteOff(ch, note, 0);
            nil;
        });
    };
};

~brahma_midi[\sendClock] = { |self, bpm|
    // Send MIDI clock at 24 PPQN
    var interval = 60 / bpm / 24;
    if(self[\clockRoutine].notNil) { self[\clockRoutine].stop };
    if(self[\midiOut].notNil) {
        self[\midiOut].start;
        self[\clockRoutine] = Routine({
            loop {
                self[\midiOut].midiClock;
                interval.wait;
            };
        }).play;
    };
};

~brahma_midi[\stopClock] = { |self|
    if(self[\clockRoutine].notNil) {
        self[\clockRoutine].stop;
        self[\clockRoutine] = nil;
    };
    if(self[\midiOut].notNil) {
        self[\midiOut].stop;
    };
};

// ==========================================
// OSC RESPONDERS
// ==========================================

// /brahma/midi/route <synthDef:string> <outBus:int>
OSCdef(\brahma_midi_route, { |msg|
    ~brahma_midi[\targetSynthDef] = msg[1].asSymbol;
    ~brahma_midi[\targetOutBus] = msg[2].asInteger;
    "MIDI: Routed to '%' on bus %".format(msg[1], msg[2]).postln;
}, "/brahma/midi/route");

// /brahma/midi/mpe/config <enabled:int> <lowerMembers:int> <upperMembers:int>
OSCdef(\brahma_midi_mpe_config, { |msg|
    var enabled = msg[1].asInteger > 0;
    var lower = msg[2].asInteger;
    var upper = msg[3].asInteger;

    ~brahma_midi[\mpe] = BrahmaMPE.new(16, enabled);
    if(enabled) {
        ~brahma_midi[\mpe].setLowerZone(lower);
        if(upper > 0) { ~brahma_midi[\mpe].setUpperZone(upper) };
    };
    "MIDI: MPE % (lower:%, upper:%)".format(
        if(enabled, "enabled", "disabled"), lower, upper).postln;
}, "/brahma/midi/mpe/config");

// /brahma/midi/learn <targetParam:string>
OSCdef(\brahma_midi_learn, { |msg|
    ~brahma_midi[\learnMode] = true;
    ~brahma_midi[\learnTarget] = msg[1].asString;
    "MIDI Learn: Waiting for CC input... (target: %)".format(msg[1]).postln;
}, "/brahma/midi/learn");

// /brahma/midi/panic
OSCdef(\brahma_midi_panic, {
    ~brahma_midi[\mpe].panic;
}, "/brahma/midi/panic");

// /brahma/midi/bendRange <semitones:int>
OSCdef(\brahma_midi_bendRange, { |msg|
    ~brahma_midi[\mpe].pitchBendRange = msg[1].asInteger.clip(1, 96);
    "MIDI: Pitch bend range set to ±% semitones".format(msg[1]).postln;
}, "/brahma/midi/bendRange");

// Initialize MIDI
~brahma_midi.init;

"--- BRAHMA: MIDI & MPE Infrastructure Online ---".postln;
)
