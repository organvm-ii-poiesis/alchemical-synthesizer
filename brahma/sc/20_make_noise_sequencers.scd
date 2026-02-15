/*
  Phase 3: Make Noise Sequencer & Controller Clones
  Rene, Pressure Points, PrssPNT, TEMPI
*/

(
// ==========================================
// CARTESIAN_MAZE — Rene (Cartesian Sequencer)
// ==========================================
// Language-side sequencer: X/Y/Z axes, snake/skip/state modes
~cartesian_maze = (
    // 4x4 grid of CV values
    grid: Array.fill(4, { Array.fill(4, { rrand(0.0, 1.0) }) }),
    gateGrid: Array.fill(4, { Array.fill(4, true) }),

    // Current position
    posX: 0,
    posY: 0,

    // Modes: \forward, \reverse, \pendulum, \random, \snake
    modeX: \forward,
    modeY: \forward,

    // Pendulum state
    dirX: 1,
    dirY: 1,

    // Output buses
    cvBus: nil,
    gateBus: nil,

    init: { |self|
        self[\cvBus] = Bus.control(s, 1);
        self[\gateBus] = Bus.control(s, 1);
        ~patch_bay.registerSource(\rene_cv, self[\cvBus], \control, "Rene CV out");
        ~patch_bay.registerSource(\rene_gate, self[\gateBus], \control, "Rene gate out");
        "CARTESIAN_MAZE: Initialized".postln;
    },

    // Advance X axis
    advanceX: { |self|
        case
        { self[\modeX] == \forward } { self[\posX] = (self[\posX] + 1) % 4 }
        { self[\modeX] == \reverse } { self[\posX] = (self[\posX] - 1 + 4) % 4 }
        { self[\modeX] == \pendulum } {
            self[\posX] = self[\posX] + self[\dirX];
            if(self[\posX] >= 3 or: { self[\posX] <= 0 }) {
                self[\dirX] = self[\dirX].neg;
            };
            self[\posX] = self[\posX].clip(0, 3);
        }
        { self[\modeX] == \random } { self[\posX] = 4.rand }
        { self[\modeX] == \snake } {
            if((self[\posY] % 2) == 0) {
                self[\posX] = (self[\posX] + 1) % 4;
            } {
                self[\posX] = (self[\posX] - 1 + 4) % 4;
            };
        };
    },

    // Advance Y axis
    advanceY: { |self|
        case
        { self[\modeY] == \forward } { self[\posY] = (self[\posY] + 1) % 4 }
        { self[\modeY] == \reverse } { self[\posY] = (self[\posY] - 1 + 4) % 4 }
        { self[\modeY] == \pendulum } {
            self[\posY] = self[\posY] + self[\dirY];
            if(self[\posY] >= 3 or: { self[\posY] <= 0 }) {
                self[\dirY] = self[\dirY].neg;
            };
            self[\posY] = self[\posY].clip(0, 3);
        }
        { self[\modeY] == \random } { self[\posY] = 4.rand };
    },

    // Clock tick: advance and output
    tick: { |self, axis=\x|
        var cv, gate;
        if(axis == \x) { self.advanceX } { self.advanceY };

        cv = self[\grid][self[\posY]][self[\posX]];
        gate = self[\gateGrid][self[\posY]][self[\posX]];

        self[\cvBus].set(cv);
        self[\gateBus].set(gate.asInteger);

        ~visual_cortex.target.sendMsg("/rene/position",
            self[\posX], self[\posY], cv, gate.asInteger);
    },

    setCV: { |self, x, y, value|
        self[\grid][y.clip(0, 3)][x.clip(0, 3)] = value.clip(0, 1);
    },

    setGate: { |self, x, y, active|
        self[\gateGrid][y.clip(0, 3)][x.clip(0, 3)] = active;
    }
);

// ==========================================
// CAPACITIVE_GRID — Pressure Points (Touch Controller)
// ==========================================
// Language-side touch plate simulator (4 pads)
~capacitive_grid = (
    pads: Array.fill(4, {
        (pressure: 0.0, posX: 0.5, posY: 0.5, gate: 0,
         cvBus: nil, gateBus: nil, pressureBus: nil)
    }),

    init: { |self|
        self[\pads].do({ |pad, i|
            pad[\cvBus] = Bus.control(s, 1);
            pad[\gateBus] = Bus.control(s, 1);
            pad[\pressureBus] = Bus.control(s, 1);
            ~patch_bay.registerSource(
                ("pp_cv_" ++ i).asSymbol, pad[\cvBus], \control,
                "Pressure Points pad " ++ i ++ " CV");
            ~patch_bay.registerSource(
                ("pp_gate_" ++ i).asSymbol, pad[\gateBus], \control,
                "Pressure Points pad " ++ i ++ " gate");
            ~patch_bay.registerSource(
                ("pp_pressure_" ++ i).asSymbol, pad[\pressureBus], \control,
                "Pressure Points pad " ++ i ++ " pressure");
        });
        "CAPACITIVE_GRID: 4 pads initialized".postln;
    },

    touch: { |self, padIdx, pressure, posX, posY|
        var pad = self[\pads][padIdx.clip(0, 3)];
        pad[\pressure] = pressure.clip(0, 1);
        pad[\posX] = posX.clip(0, 1);
        pad[\posY] = posY.clip(0, 1);
        pad[\gate] = (pressure > 0.01).asInteger;

        pad[\cvBus].set(posX);
        pad[\gateBus].set(pad[\gate]);
        pad[\pressureBus].set(pressure);
    },

    release: { |self, padIdx|
        var pad = self[\pads][padIdx.clip(0, 3)];
        pad[\pressure] = 0;
        pad[\gate] = 0;
        pad[\gateBus].set(0);
        pad[\pressureBus].set(0);
    }
);

// ==========================================
// TEMPORAL_ORACLE — TEMPI (Clock Module)
// ==========================================
// 6 independent clock outputs with tap tempo, ratios
~temporal_oracle = (
    bpm: 120,
    outputs: Array.fill(6, { |i|
        (ratio: [1, 2, 3, 4, 6, 8][i], bus: nil, routine: nil, phase: 0)
    }),

    init: { |self|
        self[\outputs].do({ |out, i|
            out[\bus] = Bus.control(s, 1);
            ~patch_bay.registerSource(
                ("tempi_" ++ i).asSymbol, out[\bus], \control,
                "TEMPI clock " ++ i);
        });
        "TEMPORAL_ORACLE: 6 clock outputs initialized".postln;
    },

    start: { |self|
        self[\outputs].do({ |out, i|
            if(out[\routine].notNil) { out[\routine].stop };
            out[\routine] = Routine({
                loop {
                    out[\bus].set(1);
                    (0.01).wait;
                    out[\bus].set(0);
                    (60 / self[\bpm] / out[\ratio] - 0.01).max(0.001).wait;
                };
            }).play;
        });
        "TEMPORAL_ORACLE: Clocks started at % BPM".format(self[\bpm]).postln;
    },

    stop: { |self|
        self[\outputs].do({ |out|
            if(out[\routine].notNil) { out[\routine].stop; out[\routine] = nil };
            out[\bus].set(0);
        });
    },

    setTempo: { |self, bpm|
        self[\bpm] = bpm.clip(20, 300);
    },

    setRatio: { |self, outputIdx, ratio|
        self[\outputs][outputIdx.clip(0, 5)][\ratio] = ratio.clip(0.125, 32);
    },

    // Tap tempo (record tap times, calculate average interval)
    tapTimes: List.new,
    tap: { |self|
        var now = SystemClock.seconds;
        self[\tapTimes].add(now);
        if(self[\tapTimes].size > 4) {
            self[\tapTimes].removeAt(0);
        };
        if(self[\tapTimes].size >= 2) {
            var intervals, avgInterval;
            intervals = List.new;
            (1..(self[\tapTimes].size - 1)).do({ |i|
                intervals.add(self[\tapTimes][i] - self[\tapTimes][i - 1]);
            });
            avgInterval = intervals.sum / intervals.size;
            self[\bpm] = (60 / avgInterval).clip(20, 300);
            "TEMPORAL_ORACLE: Tap tempo = % BPM".format(self[\bpm].round(0.1)).postln;
        };
    }
);

// ==========================================
// OSC RESPONDERS
// ==========================================

// Rene
OSCdef(\rene_tick_x, { ~cartesian_maze.tick(\x) }, "/rene/tick/x");
OSCdef(\rene_tick_y, { ~cartesian_maze.tick(\y) }, "/rene/tick/y");
OSCdef(\rene_set_cv, { |msg|
    ~cartesian_maze.setCV(msg[1].asInteger, msg[2].asInteger, msg[3].asFloat);
}, "/rene/set/cv");
OSCdef(\rene_set_gate, { |msg|
    ~cartesian_maze.setGate(msg[1].asInteger, msg[2].asInteger, msg[3].asInteger > 0);
}, "/rene/set/gate");
OSCdef(\rene_mode_x, { |msg| ~cartesian_maze[\modeX] = msg[1].asSymbol }, "/rene/mode/x");
OSCdef(\rene_mode_y, { |msg| ~cartesian_maze[\modeY] = msg[1].asSymbol }, "/rene/mode/y");

// Pressure Points
OSCdef(\pp_touch, { |msg|
    ~capacitive_grid.touch(msg[1].asInteger, msg[2].asFloat, msg[3].asFloat, msg[4].asFloat);
}, "/pp/touch");
OSCdef(\pp_release, { |msg|
    ~capacitive_grid.release(msg[1].asInteger);
}, "/pp/release");

// TEMPI
OSCdef(\tempi_start, { ~temporal_oracle.start }, "/tempi/start");
OSCdef(\tempi_stop, { ~temporal_oracle.stop }, "/tempi/stop");
OSCdef(\tempi_tempo, { |msg| ~temporal_oracle.setTempo(msg[1].asFloat) }, "/tempi/tempo");
OSCdef(\tempi_ratio, { |msg|
    ~temporal_oracle.setRatio(msg[1].asInteger, msg[2].asFloat);
}, "/tempi/ratio");
OSCdef(\tempi_tap, { ~temporal_oracle.tap }, "/tempi/tap");

// Initialize
~cartesian_maze.init;
~capacitive_grid.init;
~temporal_oracle.init;

"--- BRAHMA: Make Noise Sequencer Clones Online ---".postln;
"  CARTESIAN_MAZE (Rene) | CAPACITIVE_GRID (Pressure Points) | TEMPORAL_ORACLE (TEMPI)".postln;

// --- MODULE REGISTRY REGISTRATION ---
if(~module_registry.notNil) {
    ~module_registry.register(\cartesian_maze, \makenoise, \cartesian_maze, [
        (\name: \posX, \default: 0, \min: 0, \max: 3, \units: "", \desc: "X position on 4x4 grid"),
        (\name: \posY, \default: 0, \min: 0, \max: 3, \units: "", \desc: "Y position on 4x4 grid"),
        (\name: \modeX, \default: 0, \min: 0, \max: 4, \units: "", \desc: "X mode (0=fwd 1=rev 2=pend 3=rand 4=snake)"),
        (\name: \modeY, \default: 0, \min: 0, \max: 3, \units: "", \desc: "Y mode (0=fwd 1=rev 2=pend 3=rand)"),
        (\name: \cvValue, \default: 0.5, \min: 0, \max: 1, \units: "", \desc: "CV value at current grid cell"),
        (\name: \gateState, \default: 1, \min: 0, \max: 1, \units: "", \desc: "Gate state at current grid cell")
    ], ~sc_grp[\te], "Cartesian sequencer (Rene) — 4x4 XY grid with snake/pendulum modes");

    ~module_registry.register(\capacitive_grid, \makenoise, \capacitive_grid, [
        (\name: \padIdx, \default: 0, \min: 0, \max: 3, \units: "", \desc: "Active pad index"),
        (\name: \pressure, \default: 0, \min: 0, \max: 1, \units: "", \desc: "Pad pressure amount"),
        (\name: \posX, \default: 0.5, \min: 0, \max: 1, \units: "", \desc: "Touch X position"),
        (\name: \posY, \default: 0.5, \min: 0, \max: 1, \units: "", \desc: "Touch Y position"),
        (\name: \gate, \default: 0, \min: 0, \max: 1, \units: "", \desc: "Pad gate output")
    ], ~sc_grp[\te], "Touch controller (Pressure Points) — 4 capacitive pads with pressure/position CV");

    ~module_registry.register(\temporal_oracle, \makenoise, \temporal_oracle, [
        (\name: \bpm, \default: 120, \min: 20, \max: 300, \units: "BPM", \desc: "Master tempo"),
        (\name: \ratio0, \default: 1, \min: 0.125, \max: 32, \units: "", \desc: "Clock 0 ratio"),
        (\name: \ratio1, \default: 2, \min: 0.125, \max: 32, \units: "", \desc: "Clock 1 ratio"),
        (\name: \ratio2, \default: 3, \min: 0.125, \max: 32, \units: "", \desc: "Clock 2 ratio"),
        (\name: \ratio3, \default: 4, \min: 0.125, \max: 32, \units: "", \desc: "Clock 3 ratio"),
        (\name: \ratio4, \default: 6, \min: 0.125, \max: 32, \units: "", \desc: "Clock 4 ratio"),
        (\name: \ratio5, \default: 8, \min: 0.125, \max: 32, \units: "", \desc: "Clock 5 ratio")
    ], ~sc_grp[\te], "Clock module (TEMPI) — 6 independent outputs with tap tempo");
};
)
