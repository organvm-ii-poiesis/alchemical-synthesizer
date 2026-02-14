/*
  Phase 14: The Visual Cortex Integration
  Broadcasting Trait Maps to the Web
*/

(
~VISUAL_CORTEX = (
    target: NetAddr("127.0.0.1", 57122), // Node.js server
    
    // Broadcast an update for an entity
    broadcastUpdate: { |self, entityId, type, coherence, entropy|
        self.target.sendMsg("/brahma/organism/update", entityId, type, coherence, entropy);
    },
    
    // Auto-Broadcast Loop (Mocking data for visualization)
    startStream: { |self|
        Tdef(\viz_stream, {
            loop {
                // Mock data representing active organisms
                self.broadcastUpdate(1001, "Relinquished", rrand(0.4, 0.9), rrand(1.0, 5.0));
                self.broadcastUpdate(1002, "Proteus", rrand(0.8, 1.0), rrand(0.1, 2.0));
                0.1.wait; // 10Hz update rate
            }
        }).play;
        "--- VISUAL CORTEX STREAM ACTIVE ---".postln;
    },
    
    stopStream: {
        Tdef(\viz_stream).stop;
        "--- VISUAL CORTEX STREAM STOPPED ---".postln;
    }
);

// Start by default for demo purposes
~VISUAL_CORTEX.startStream;
)
