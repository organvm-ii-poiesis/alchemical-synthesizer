/*
  Brahma Meta-Rack: Infrastructure & Backplane
  Phase 1: Environment Setup (Expanded for Mega Feature Suite)
*/

(
// 1. Server Boot & Configuration
s = Server.local;
s.options.numAudioBusChannels = 2048;
s.options.numControlBusChannels = 8192;
s.options.memSize = 8192 * 32; // Expanded for wavetable, FFT, convolution, granular
s.options.numBuffers = 4096;   // Expanded for wavetable banks, samples, IRs
s.options.maxNodes = 4096;     // Expanded for large patch bay + many voices
s.waitForBoot({

    "--- BRAHMA: Server Booted ---".postln;

    // 2. Group Hierarchy (~sc_grp)
    // Order: Input -> Binding -> Analysis -> Transmutation -> Protection -> Release
    ~sc_grp = (
        root: Group.head(s),
        ia: nil, bc: nil, ae: nil, te: nil, pr: nil, rr: nil,

        // Organism sub-groups: per-organism isolation within the main chain
        organisms: Dictionary.new,

        // Helper: create organism-specific sub-groups within the main chain
        createOrganismGroups: { |self, name|
            var grps = (
                ia: Group.tail(self[\ia]),
                bc: Group.tail(self[\bc]),
                ae: Group.tail(self[\ae]),
                te: Group.tail(self[\te]),
                pr: Group.tail(self[\pr]),
                rr: Group.tail(self[\rr])
            );
            self[\organisms].put(name.asSymbol, grps);
            "SC_GRP: Organism sub-groups created for '%'".format(name).postln;
            grps;
        },

        // Helper: free organism sub-groups
        freeOrganismGroups: { |self, name|
            var grps = self[\organisms][name.asSymbol];
            if(grps.notNil) {
                grps.keysValuesDo({ |k, g| g.free });
                self[\organisms].removeAt(name.asSymbol);
                "SC_GRP: Organism sub-groups freed for '%'".format(name).postln;
            };
        }
    );

    // Build main groups in strict signal-flow order
    ~sc_grp[\ia] = Group.after(~sc_grp[\root]);
    ~sc_grp[\bc] = Group.after(~sc_grp[\ia]);
    ~sc_grp[\ae] = Group.after(~sc_grp[\bc]);
    ~sc_grp[\te] = Group.after(~sc_grp[\ae]);
    ~sc_grp[\pr] = Group.after(~sc_grp[\te]);
    ~sc_grp[\rr] = Group.after(~sc_grp[\pr]);

    // 3. Bus Dictionary (~sc_bus)
    ~sc_bus = Dictionary.new;

    // Global Audio Buses (Virtual Rack Backplane)
    ~sc_bus.add(\bus_audio_shared -> Bus.audio(s, 1));
    ~sc_bus.add(\master_bus -> Bus.audio(s, 2));      // Stereo master
    ~sc_bus.add(\cue_bus -> Bus.audio(s, 2));          // Headphone cue

    // Aux send/return buses (8 sends)
    8.do({ |i|
        ~sc_bus.add(("aux_send_" ++ i).asSymbol -> Bus.audio(s, 2));
    });

    // 4. Global Registry (~brahma_registry)
    ~brahma_registry = (
        entities: Dictionary.new,
        trait_maps: Dictionary.new,
        lineage_graph: Dictionary.new,
        nextEntityId: 3000, // Auto-increment for new entities

        registerEntity: { |self, id, type, traits|
            "Registering Entity: % (%)".format(id, type).postln;
            self.entities.put(id, (type: type, traits: traits, created: Date.getDate));
        },

        getTraits: { |self, id|
            self.entities[id] !? { |e| e[\traits] };
        },

        // Auto-assign next entity ID
        nextId: { |self|
            var id = self[\nextEntityId];
            self[\nextEntityId] = id + 1;
            id;
        }
    );

    // 5. Global Tuning State (~brahma_tuning)
    ~brahma_tuning = (
        currentScale: nil,  // BrahmaScale instance (set by 02_microtonality)
        rootHz: 440.0,
        transpose: 0        // Semitone offset
    );

    // 6. The Bridge State (~bridge)
    ~bridge = (
        domains: Dictionary.new,
        active_links: List.new,

        lines: (
            cv: 0.0,
            clk: 0,
            flag: 0,
            data: nil,
            audio: nil
        ),

        master_id: nil,
        master_lease_expiry: 0
    );

    // Initialize Domains (4 default zones)
    4.do { |i| ~bridge.domains.put(i, (id: i, modules: List.new)) };

    "--- BRAHMA: Infrastructure Ready ---".postln;
    "Groups: %, %, %, %, %, %".format(~sc_grp[\ia], ~sc_grp[\bc], ~sc_grp[\ae], ~sc_grp[\te], ~sc_grp[\pr], ~sc_grp[\rr]).postln;
    "Audio buses: %, Control buses: %".format(s.options.numAudioBusChannels, s.options.numControlBusChannels).postln;
});
)
