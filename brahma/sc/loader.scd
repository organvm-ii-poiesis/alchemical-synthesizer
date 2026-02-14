/*
  Brahma Master Loader
*/

(
var root = thisProcess.nowExecutingPath.dirname;

// 1. Infrastructure
(root +/+ "01_infrastructure.scd").load;
(root +/+ "01_arbitration_engine.scd").load;

// 2. Proteus & MAW
(root +/+ "03_proteus_maw.scd").load;

// 3. Relinquished
(root +/+ "04_relinquished.scd").load;

// 4. Fusion Core
(root +/+ "04_fusion_core.scd").load;

// 5. Organisms & Creatures
(root +/+ "05_sampler_creatures.scd").load;
(root +/+ "05_sampler_creatures_stereo.scd").load;
(root +/+ "05_agent_smith.scd").load;
(root +/+ "05_ditto.scd").load;

// 6. Stacking & Evolution
(root +/+ "06_typhon.scd").load;

// 7. Safety & Stability
(root +/+ "07_safety.scd").load;

// 10. Validation & Metrics
(root +/+ "10_validation.scd").load;
(root +/+ "11_metrics.scd").load;
(root +/+ "12_test_bench.scd").load;
(root +/+ "13_nrt_renderer.scd").load;

// 14. Visual Cortex
(root +/+ "14_visual_cortex.scd").load;

"--- BRAHMA SYSTEM ONLINE ---".postln;
)
