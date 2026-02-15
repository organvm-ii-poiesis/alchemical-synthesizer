/*
  Phase 1: CHRONOS Track Management
  Track creation, step data, pattern editing, trigger routing,
  p-locks, conditions, copy/paste
*/

(
~chronos_tracks = (

    // ==========================================
    // TRACK CREATION
    // ==========================================
    // Track types: \note, \drum, \cv, \gate, \chord, \arpeggio, \midi
    createTrack: { |self, type=\note, numSteps=16, division=16, name=""|
        var trackIdx = ~chronos[\numActiveTracks];
        var track;

        if(trackIdx >= ~chronos[\maxTracks]) {
            "CHRONOS: Maximum tracks (%) reached".format(~chronos[\maxTracks]).warn;
            ^nil;
        };

        track = (
            id: trackIdx,
            name: if(name.size > 0, name, "Track " ++ (trackIdx + 1)),
            type: type.asSymbol,
            active: true,
            numSteps: numSteps.clip(1, 128),
            division: division.clip(1, 64), // Clock division (1=whole, 4=quarter, 16=16th)
            currentStep: 0,
            swing: 0.0,

            // Target (which synth/organism to trigger)
            targetName: nil,   // Key in ~chronos[\targets]
            targetSynthDef: \drum_subtractive,
            targetOutBus: 0,
            targetGroup: ~sc_grp[\te],

            // Base synth args (overridden by p-locks)
            synthArgs: Dictionary.new,

            // Pattern data: array of step dictionaries
            pattern: Array.fill(numSteps.clip(1, 128), {
                (
                    active: false,
                    note: 60,          // MIDI note or scale degree
                    velocity: 100,     // 0-127
                    length: 4,         // Gate duration in ticks
                    probability: 100,  // 0-100%
                    condition: \always, // Elektron-style conditions
                    microTiming: 0,    // -50 to +50 (% of step)
                    ratchet: 1,        // 1-8 retriggers
                    transpose: 0,      // Per-step semitone offset
                    pLocks: nil        // Dictionary of param -> value overrides
                )
            }),

            // Track state
            muted: false,
            solo: false,

            // Chord track: chord voicings
            chordVoicings: nil, // Array of note arrays per step

            // Arpeggio track
            arpMode: \up,       // \up, \down, \upDown, \random, \asPlayed
            arpOctaves: 1,      // 1-4
            arpRate: 16,        // Clock division for arp steps
            arpGate: 0.5,       // 0-1 gate length proportion
            arpNotes: nil,      // Currently held notes for arp

            // Audio bus for this track's output
            audioBus: nil,

            // Per-track FX send levels (into aux buses)
            fxSends: Array.fill(8, 0.0),

            // MIDI output (for \midi track type)
            midiChannel: 0,         // 0-15
            midiPort: nil,          // MIDIOut instance (set via setTrackMidiPort)
            midiCCMap: nil          // Dictionary of step -> [cc#, value] for CC automation
        );

        ~chronos[\tracks] = ~chronos[\tracks].add(track);
        ~chronos[\numActiveTracks] = ~chronos[\numActiveTracks] + 1;

        "CHRONOS: Track % created (%, % steps, /%)"
            .format(trackIdx, type, numSteps, division).postln;
        ^trackIdx;
    },

    // Create a batch of tracks (e.g., Golem drum mode: 8 drum tracks)
    createDrumKit: { |self, numTracks=8|
        var indices = List.new;
        numTracks.do({ |i|
            var idx = self.createTrack(\drum, 16, 16,
                ["Kick", "Snare", "Clap", "HH Closed", "HH Open", "Tom", "Rim", "FM Bell"][i] ? ("Drum " ++ (i+1)));
            indices.add(idx);
        });
        "CHRONOS: Drum kit created (% tracks)".format(numTracks).postln;
        ^indices;
    },

    // Delete a track
    deleteTrack: { |self, trackIdx|
        if(trackIdx < ~chronos[\tracks].size and: { ~chronos[\tracks][trackIdx].notNil }) {
            ~chronos[\tracks][trackIdx][\active] = false;
            "CHRONOS: Track % deactivated".format(trackIdx).postln;
        };
    },

    // ==========================================
    // STEP CONDITION EVALUATION (Elektron-style)
    // ==========================================
    evaluateCondition: { |self, condition, step, track, fillActive|
        case
        { condition == \always } { true }
        { condition == \never } { false }
        { condition == \fill } { fillActive }
        { condition == \notFill } { fillActive.not }
        { condition == \first } { step == 0 }
        { condition == \last } { step == (track[\numSteps] - 1) }
        { condition == \pre } { step == (track[\numSteps] - 2) }
        // A:B patterns — trigger on Ath pass out of every B passes
        { condition == \oneOfTwo } { (track[\currentStep].div(track[\numSteps]) % 2) == 0 }
        { condition == \twoOfThree } {
            var pass;
            pass = track[\currentStep].div(track[\numSteps]) % 3;
            (pass == 0) or: { pass == 1 };
        }
        { condition == \threeOfFour } {
            var pass;
            pass = track[\currentStep].div(track[\numSteps]) % 4;
            pass < 3;
        }
        { condition == \oneOfThree } { (track[\currentStep].div(track[\numSteps]) % 3) == 0 }
        { condition == \oneOfFour } { (track[\currentStep].div(track[\numSteps]) % 4) == 0 }
        { condition == \twoOfFour } {
            var pass;
            pass = track[\currentStep].div(track[\numSteps]) % 4;
            (pass == 0) or: { pass == 1 };
        }
        // Default: always trigger
        { true };
    },

    // ==========================================
    // STEP TRIGGERING
    // ==========================================
    triggerStep: { |self, trackIdx, step|
        var track = ~chronos[\tracks][trackIdx];
        var stepData, target, synthDef, outBus, group, args;
        if(track.isNil or: { track[\active].not }) { ^nil };

        stepData = track[\pattern][step];
        target = ~chronos[\targets][track[\targetName]];
        synthDef = if(target.notNil) { target[\synthDef] } { track[\targetSynthDef] };
        outBus = if(target.notNil) { target[\outBus] } { track[\targetOutBus] };
        group = if(target.notNil) { target[\group] } { track[\targetGroup] };

        // Build synth args from base + p-locks
        args = track[\synthArgs].copy;
        if(stepData[\pLocks].notNil) {
            stepData[\pLocks].keysValuesDo({ |k, v|
                args[k] = v;
            });
        };

        // Frequency calculation based on track type
        case
        { track[\type] == \note or: { track[\type] == \drum } } {
            var note, freq;
            note = stepData[\note] + stepData[\transpose];

            // Use microtonal system if available
            if(~brahma_tuning[\currentScale].notNil) {
                freq = ~brahma_tuning.degreeToFreq(note - 60, 4);
            } {
                freq = note.midicps;
            };

            args[\freq] = freq;
            args[\gate] = 1;
            args[\velocity] = stepData[\velocity] / 127;
            args[\outBus] = outBus;

            Synth(synthDef, args.asPairs, target: group);
        }
        { track[\type] == \chord } {
            // Trigger multiple notes simultaneously
            var notes;
            notes = track[\chordVoicings] !? { |cv| cv[step] } ?? [stepData[\note]];
            notes.do({ |note|
                var freq, chordArgs;
                note = note + stepData[\transpose];
                if(~brahma_tuning[\currentScale].notNil) {
                    freq = ~brahma_tuning.degreeToFreq(note - 60, 4);
                } {
                    freq = note.midicps;
                };
                chordArgs = args.copy;
                chordArgs[\freq] = freq;
                chordArgs[\gate] = 1;
                chordArgs[\velocity] = stepData[\velocity] / 127;
                chordArgs[\outBus] = outBus;
                Synth(synthDef, chordArgs.asPairs, target: group);
            });
        }
        { track[\type] == \cv } {
            // Output to control bus (for modulation)
            if(track[\audioBus].notNil) {
                track[\audioBus].set(stepData[\note] / 127);
            };
        }
        { track[\type] == \gate } {
            // Output gate pulse to control bus
            if(track[\audioBus].notNil) {
                track[\audioBus].set(1);
                SystemClock.sched(stepData[\length] * 60 / ~chronos[\tempo] / 96, {
                    track[\audioBus].set(0);
                    nil;
                });
            };
        }
        { track[\type] == \midi } {
            // Send MIDI note to external device
            var port, ch, note, vel, dur;
            port = track[\midiPort] ?? { ~brahma_midi[\defaultOut] };
            ch = track[\midiChannel].clip(0, 15);
            note = stepData[\note] + stepData[\transpose];
            vel = stepData[\velocity].clip(0, 127);
            dur = stepData[\length] * 60 / ~chronos[\tempo] / 96;

            if(port.notNil) {
                // Send note on
                port.noteOn(ch, note.clip(0, 127), vel);

                // Schedule note off
                SystemClock.sched(dur.max(0.01), {
                    port.noteOff(ch, note.clip(0, 127), 0);
                    nil;
                });

                // Send CC automation from p-locks if present
                if(track[\midiCCMap].notNil) {
                    var ccData;
                    ccData = track[\midiCCMap][step];
                    if(ccData.notNil) {
                        ccData.keysValuesDo({ |ccNum, ccVal|
                            port.control(ch, ccNum.asInteger, ccVal.asInteger.clip(0, 127));
                        });
                    };
                };

                // Also send any CC p-locks from the step
                if(stepData[\pLocks].notNil) {
                    stepData[\pLocks].keysValuesDo({ |k, v|
                        var key, ccNum;
                        key = k.asString;
                        if(key.beginsWith("cc")) {
                            ccNum = key[2..].asInteger;
                            port.control(ch, ccNum.clip(0, 127), v.asInteger.clip(0, 127));
                        };
                    });
                };
            };
        };

        // Broadcast trigger to Visual Cortex
        ~visual_cortex.target.sendMsg("/chronos/trigger",
            trackIdx, step, stepData[\velocity]);
    },

    // ==========================================
    // PATTERN EDITING
    // ==========================================
    toggleStep: { |self, trackIdx, step|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil) {
            ~chronos.pushUndoState;
            track[\pattern][step][\active] = track[\pattern][step][\active].not;
        };
    },

    setStepNote: { |self, trackIdx, step, note|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil) {
            track[\pattern][step][\note] = note.clip(0, 127);
        };
    },

    setStepVelocity: { |self, trackIdx, step, vel|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil) {
            track[\pattern][step][\velocity] = vel.clip(0, 127);
        };
    },

    setStepLength: { |self, trackIdx, step, length|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil) {
            track[\pattern][step][\length] = length.clip(1, 128);
        };
    },

    setStepProbability: { |self, trackIdx, step, prob|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil) {
            track[\pattern][step][\probability] = prob.clip(0, 100);
        };
    },

    setStepCondition: { |self, trackIdx, step, condition|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil) {
            track[\pattern][step][\condition] = condition.asSymbol;
        };
    },

    setStepMicroTiming: { |self, trackIdx, step, offset|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil) {
            track[\pattern][step][\microTiming] = offset.clip(-50, 50);
        };
    },

    setStepRatchet: { |self, trackIdx, step, count|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil) {
            track[\pattern][step][\ratchet] = count.clip(1, 8);
        };
    },

    setStepTranspose: { |self, trackIdx, step, semitones|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil) {
            track[\pattern][step][\transpose] = semitones.clip(-48, 48);
        };
    },

    // Parameter lock (any param on a specific step)
    setStepPLock: { |self, trackIdx, step, param, value|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil) {
            if(track[\pattern][step][\pLocks].isNil) {
                track[\pattern][step][\pLocks] = Dictionary.new;
            };
            track[\pattern][step][\pLocks][param.asSymbol] = value;
        };
    },

    clearStepPLock: { |self, trackIdx, step, param|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil and: { track[\pattern][step][\pLocks].notNil }) {
            track[\pattern][step][\pLocks].removeAt(param.asSymbol);
            if(track[\pattern][step][\pLocks].isEmpty) {
                track[\pattern][step][\pLocks] = nil;
            };
        };
    },

    // ==========================================
    // COPY / PASTE
    // ==========================================
    clipboard: nil,

    copyPattern: { |self, trackIdx|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil) {
            self[\clipboard] = track[\pattern].deepCopy;
            "CHRONOS: Track % pattern copied".format(trackIdx).postln;
        };
    },

    pastePattern: { |self, trackIdx|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil and: { self[\clipboard].notNil }) {
            ~chronos.pushUndoState;
            track[\pattern] = self[\clipboard].deepCopy;
            "CHRONOS: Pattern pasted to track %".format(trackIdx).postln;
        };
    },

    // Copy a range of steps
    copyStepRange: { |self, trackIdx, startStep, endStep|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil) {
            self[\clipboard] = track[\pattern].copyRange(startStep, endStep).deepCopy;
        };
    },

    // ==========================================
    // TRACK CONFIGURATION
    // ==========================================
    setTrackTarget: { |self, trackIdx, targetName|
        var track = ~chronos[\tracks][trackIdx];
        var target = ~chronos[\targets][targetName.asSymbol];
        if(track.notNil and: { target.notNil }) {
            track[\targetName] = targetName.asSymbol;
            track[\targetSynthDef] = target[\synthDef];
            track[\targetOutBus] = target[\outBus];
            track[\targetGroup] = target[\group];
            "CHRONOS: Track % -> target '%'".format(trackIdx, targetName).postln;
        };
    },

    setTrackDivision: { |self, trackIdx, division|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil) {
            track[\division] = division.clip(1, 64);
        };
    },

    setTrackSteps: { |self, trackIdx, numSteps|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil) {
            var oldSteps;
            oldSteps = track[\numSteps];
            numSteps = numSteps.clip(1, 128);
            if(numSteps > oldSteps) {
                // Extend pattern
                (numSteps - oldSteps).do({
                    track[\pattern] = track[\pattern].add(
                        (active: false, note: 60, velocity: 100, length: 4,
                         probability: 100, condition: \always, microTiming: 0,
                         ratchet: 1, transpose: 0, pLocks: nil)
                    );
                });
            };
            track[\numSteps] = numSteps;
        };
    },

    muteTrack: { |self, trackIdx|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil) {
            track[\muted] = track[\muted].not;
        };
    },

    soloTrack: { |self, trackIdx|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil) {
            track[\solo] = track[\solo].not;
        };
    },

    // ==========================================
    // MIDI TRACK CONFIGURATION
    // ==========================================
    setTrackMidiChannel: { |self, trackIdx, channel|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil and: { track[\type] == \midi }) {
            track[\midiChannel] = channel.clip(0, 15);
            "CHRONOS: Track % MIDI channel = %".format(trackIdx, channel).postln;
        };
    },

    setTrackMidiPort: { |self, trackIdx, portIndex|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil and: { track[\type] == \midi }) {
            var out;
            out = MIDIOut(portIndex.clip(0, 15));
            track[\midiPort] = out;
            "CHRONOS: Track % MIDI port = %".format(trackIdx, portIndex).postln;
        };
    },

    setStepMidiCC: { |self, trackIdx, step, ccNum, ccVal|
        var track = ~chronos[\tracks][trackIdx];
        if(track.notNil and: { track[\type] == \midi }) {
            if(track[\midiCCMap].isNil) {
                track[\midiCCMap] = Dictionary.new;
            };
            if(track[\midiCCMap][step].isNil) {
                track[\midiCCMap][step] = Dictionary.new;
            };
            track[\midiCCMap][step][ccNum.clip(0, 127)] = ccVal.clip(0, 127);
        };
    }
);

// ==========================================
// OSC RESPONDERS — Track Management
// ==========================================
OSCdef(\chronos_track_create, { |msg|
    var type = msg[1] !? _.asSymbol ?? \note;
    var steps = msg[2] !? _.asInteger ?? 16;
    var div = msg[3] !? _.asInteger ?? 16;
    ~chronos_tracks.createTrack(type, steps, div);
}, "/chronos/track/create");

OSCdef(\chronos_track_target, { |msg|
    ~chronos_tracks.setTrackTarget(msg[1].asInteger, msg[2].asString);
}, "/chronos/track/target");

OSCdef(\chronos_track_div, { |msg|
    ~chronos_tracks.setTrackDivision(msg[1].asInteger, msg[2].asInteger);
}, "/chronos/track/division");

OSCdef(\chronos_track_steps, { |msg|
    ~chronos_tracks.setTrackSteps(msg[1].asInteger, msg[2].asInteger);
}, "/chronos/track/steps");

OSCdef(\chronos_track_mute, { |msg|
    ~chronos_tracks.muteTrack(msg[1].asInteger);
}, "/chronos/track/mute");

OSCdef(\chronos_track_solo, { |msg|
    ~chronos_tracks.soloTrack(msg[1].asInteger);
}, "/chronos/track/solo");

// Step editing OSC
OSCdef(\chronos_step_toggle, { |msg|
    ~chronos_tracks.toggleStep(msg[1].asInteger, msg[2].asInteger);
}, "/chronos/step/toggle");

OSCdef(\chronos_step_note, { |msg|
    ~chronos_tracks.setStepNote(msg[1].asInteger, msg[2].asInteger, msg[3].asInteger);
}, "/chronos/step/note");

OSCdef(\chronos_step_vel, { |msg|
    ~chronos_tracks.setStepVelocity(msg[1].asInteger, msg[2].asInteger, msg[3].asInteger);
}, "/chronos/step/velocity");

OSCdef(\chronos_step_prob, { |msg|
    ~chronos_tracks.setStepProbability(msg[1].asInteger, msg[2].asInteger, msg[3].asInteger);
}, "/chronos/step/probability");

OSCdef(\chronos_step_cond, { |msg|
    ~chronos_tracks.setStepCondition(msg[1].asInteger, msg[2].asInteger, msg[3]);
}, "/chronos/step/condition");

OSCdef(\chronos_step_micro, { |msg|
    ~chronos_tracks.setStepMicroTiming(msg[1].asInteger, msg[2].asInteger, msg[3].asFloat);
}, "/chronos/step/microTiming");

OSCdef(\chronos_step_ratchet, { |msg|
    ~chronos_tracks.setStepRatchet(msg[1].asInteger, msg[2].asInteger, msg[3].asInteger);
}, "/chronos/step/ratchet");

OSCdef(\chronos_step_plock, { |msg|
    ~chronos_tracks.setStepPLock(msg[1].asInteger, msg[2].asInteger, msg[3], msg[4].asFloat);
}, "/chronos/step/plock");

OSCdef(\chronos_copy, { |msg| ~chronos_tracks.copyPattern(msg[1].asInteger) }, "/chronos/copy");
OSCdef(\chronos_paste, { |msg| ~chronos_tracks.pastePattern(msg[1].asInteger) }, "/chronos/paste");

// MIDI track configuration
OSCdef(\chronos_midi_channel, { |msg|
    ~chronos_tracks.setTrackMidiChannel(msg[1].asInteger, msg[2].asInteger);
}, "/chronos/track/midi/channel");

OSCdef(\chronos_midi_port, { |msg|
    ~chronos_tracks.setTrackMidiPort(msg[1].asInteger, msg[2].asInteger);
}, "/chronos/track/midi/port");

OSCdef(\chronos_midi_cc, { |msg|
    ~chronos_tracks.setStepMidiCC(
        msg[1].asInteger, msg[2].asInteger,
        msg[3].asInteger, msg[4].asInteger);
}, "/chronos/step/midi/cc");

// Golem legacy step aliases
OSCdef(\golem_step_toggle_alias, { |msg|
    ~chronos_tracks.toggleStep(msg[1].asInteger, msg[2].asInteger);
}, "/golem/step/toggle");

OSCdef(\golem_step_vel_alias, { |msg|
    ~chronos_tracks.setStepVelocity(msg[1].asInteger, msg[2].asInteger, (msg[3].asFloat * 127).asInteger);
}, "/golem/step/velocity");

"--- BRAHMA: CHRONOS Track Manager Online ---".postln;
)
