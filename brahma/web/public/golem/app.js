/**
 * Golem — Main Application
 * State management, view router, OSC bridge init
 */
import { OSCClient } from "./osc-client.js";
import { applyTheme, getTrackColors } from "./themes.js";
import { SequencerView } from "./components/sequencer.js";
import { EngineView } from "./components/engine.js";
import { PatchbayView } from "./components/patchbay.js";
import { MixerView } from "./components/mixer.js";
import { AutomationView } from "./components/automation.js";
import { PerformView } from "./components/perform.js";

// ==========================================
// APPLICATION STATE
// ==========================================
const state = {
    playing: false,
    tempo: 120,
    currentStep: 0,
    selectedTrack: 0,
    tracks: Array.from({ length: 8 }, (_, i) => ({
        id: i,
        name: ["kick808", "snare", "clap", "hihatClosed", "hihatOpen", "tom", "rim", "fmBell"][i],
        steps: 16,
        swing: 0,
        pattern: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8, pLocks: null })),
        synthDef: "drum_subtractive",
        synthArgs: { freq: 150, cutoff: 2000, res: 1, envAmt: 0.5 },
        blend: { synthA: 1, synthB: 0, sampleA: 0, sampleB: 0 },
        fx: { reverbMix: 0, reverbDecay: 1.5, delayMix: 0, delayTime: 0.25, delayFB: 0.3, bitcrush: 0, drive: 0 },
        humanize: { velRand: 0, timeRand: 0, pitchRand: 0, probability: 1 },
        muted: false,
        solo: false,
        muteGroup: null,
        lfos: [
            { rate: 1, shape: "sine", phase: 0 },
            { rate: 2, shape: "tri", phase: 0 },
            { rate: 0.5, shape: "sine", phase: 0 }
        ],
        modMatrix: [],
        automation: {}
    })),
    xyPad: { x: 0.5, y: 0.5 },
    scenes: {}
};

// ==========================================
// OSC CLIENT
// ==========================================
const osc = new OSCClient();
const wsUrl = `ws://${window.location.hostname}:${window.location.port}`;
osc.connect(wsUrl);

// Inbound: SC -> Web
osc.on("/golem/step", (args) => {
    state.currentStep = args[0]?.value ?? args[0];
    views.sequencer?.updateStep(state.currentStep);
});

osc.on("/golem/track/trigger", (args) => {
    const trackId = args[0]?.value ?? args[0];
    const vel = args[1]?.value ?? args[1];
    views.mixer?.flash(trackId, vel);
    views.perform?.flashPad(trackId);
});

osc.on("/golem/track/state", (args) => {
    const id = args[0]?.value ?? args[0];
    state.tracks[id].muted = !!(args[1]?.value ?? args[1]);
    state.tracks[id].solo = !!(args[2]?.value ?? args[2]);
    views.sequencer?.updateTrackState(id);
    views.mixer?.updateTrackState(id);
});

osc.on("/golem/seq/state", (args) => {
    state.playing = !!(args[0]?.value ?? args[0]);
    state.tempo = args[1]?.value ?? args[1];
    state.currentStep = args[2]?.value ?? args[2];
    updateTransportUI();
});

osc.on("/golem/engine/state", (args) => {
    const id = args[0]?.value ?? args[0];
    state.tracks[id].synthDef = args[1]?.value ?? args[1];
    state.tracks[id].synthArgs.freq = args[2]?.value ?? args[2];
    state.tracks[id].synthArgs.cutoff = args[3]?.value ?? args[3];
});

osc.on("/golem/fx/state", (args) => {
    const id = args[0]?.value ?? args[0];
    state.tracks[id].fx.reverbMix = args[1]?.value ?? args[1];
    state.tracks[id].fx.delayMix = args[2]?.value ?? args[2];
    state.tracks[id].fx.bitcrush = args[3]?.value ?? args[3];
    state.tracks[id].fx.drive = args[4]?.value ?? args[4];
});

osc.on("/golem/lfo/value", (args) => {
    const trackId = args[0]?.value ?? args[0];
    const lfoIdx = args[1]?.value ?? args[1];
    if (views.patchbay) {
        views.patchbay.updateLFO(trackId, lfoIdx, args[2]?.value ?? args[2]);
    }
});

// ==========================================
// VIEWS
// ==========================================
const views = {};

function initViews() {
    views.sequencer = new SequencerView(
        document.getElementById("view-sequencer"), state, osc
    );
    views.engine = new EngineView(
        document.getElementById("view-engine"), state, osc
    );
    views.patchbay = new PatchbayView(
        document.getElementById("view-patchbay"), state, osc
    );
    views.mixer = new MixerView(
        document.getElementById("view-mixer"), state, osc
    );
    views.automation = new AutomationView(
        document.getElementById("view-automation"), state, osc
    );
    views.perform = new PerformView(
        document.getElementById("view-perform"), state, osc
    );
}

// ==========================================
// VIEW ROUTER
// ==========================================
function switchView(name) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

    const view = document.getElementById(`view-${name}`);
    const btn = document.querySelector(`.nav-btn[data-view="${name}"]`);
    if (view) view.classList.add("active");
    if (btn) btn.classList.add("active");

    if (views[name]?.render) views[name].render();
}

// ==========================================
// TRANSPORT
// ==========================================
function updateTransportUI() {
    const playBtn = document.getElementById("btn-play");
    playBtn.classList.toggle("active", state.playing);
    playBtn.textContent = state.playing ? "PLAYING" : "PLAY";
    document.getElementById("bpm-input").value = Math.round(state.tempo);
    document.getElementById("step-display").textContent = `Step: ${state.currentStep}`;
}

function initTransport() {
    document.getElementById("btn-play").addEventListener("click", () => {
        osc.send("/golem/transport/play");
    });
    document.getElementById("btn-stop").addEventListener("click", () => {
        osc.send("/golem/transport/stop");
    });
    document.getElementById("bpm-input").addEventListener("change", (e) => {
        const bpm = parseFloat(e.target.value);
        if (bpm >= 30 && bpm <= 300) {
            state.tempo = bpm;
            osc.send("/golem/transport/tempo", bpm);
        }
    });
}

// ==========================================
// THEME
// ==========================================
function initTheme() {
    const select = document.getElementById("theme-select");
    select.addEventListener("change", (e) => {
        applyTheme(e.target.value);
        Object.values(views).forEach(v => v?.render?.());
    });
    applyTheme("midnight");
}

// ==========================================
// NAV
// ==========================================
function initNav() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            switchView(btn.dataset.view);
        });
    });
}

// ==========================================
// BOOT
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initNav();
    initTransport();
    initViews();
    switchView("sequencer");
});
