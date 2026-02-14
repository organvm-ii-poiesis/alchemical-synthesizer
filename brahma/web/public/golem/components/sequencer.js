/**
 * Sequencer View — track list, step grid, transport, copy/paste
 */
import { createStepBtn } from "../ui/step-btn.js";
import { getTrackColors } from "../themes.js";

export class SequencerView {
    constructor(container, state, osc) {
        this.container = container;
        this.state = state;
        this.osc = osc;
        this.stepBtns = [];
        this.trackRows = [];
        this.render();
    }

    render() {
        this.container.innerHTML = "";
        const colors = getTrackColors();

        // Track list + step grid
        const trackList = document.createElement("div");
        trackList.className = "track-list";

        this.stepBtns = [];
        this.trackRows = [];

        this.state.tracks.forEach((track, ti) => {
            const row = document.createElement("div");
            row.className = `track-row${ti === this.state.selectedTrack ? " selected" : ""}`;

            // Track info
            const info = document.createElement("div");
            info.className = "flex items-center gap-2";
            info.style.minWidth = "140px";

            const name = document.createElement("span");
            name.className = "track-name";
            name.textContent = track.name;
            name.style.color = colors[ti] || "var(--text)";

            const muteBtn = document.createElement("button");
            muteBtn.className = `track-mute${track.muted ? " active" : ""}`;
            muteBtn.textContent = "M";
            muteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.osc.send("/golem/track/mute", ti);
            });

            const soloBtn = document.createElement("button");
            soloBtn.className = `track-solo${track.solo ? " active" : ""}`;
            soloBtn.textContent = "S";
            soloBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.osc.send("/golem/track/solo", ti);
            });

            info.append(name, muteBtn, soloBtn);

            // Step grid for this track
            const grid = document.createElement("div");
            grid.className = "step-grid";

            const trackBtns = [];
            for (let si = 0; si < track.steps; si++) {
                const step = track.pattern[si];
                const stepBtn = createStepBtn({
                    active: step.active,
                    velocity: step.velocity,
                    hasPLock: !!step.pLocks,
                    onToggle: () => {
                        step.active = !step.active;
                        stepBtn.setState({ active: step.active });
                        this.osc.send("/golem/step/toggle", ti, si);
                    },
                    onVelChange: (vel) => {
                        step.velocity = vel;
                        this.osc.send("/golem/step/velocity", ti, si, vel);
                    },
                    onLongPress: () => {
                        // Open p-lock editor (select track first)
                        this.state.selectedTrack = ti;
                        this.updateSelection();
                    }
                });

                // Color the active step by track color
                if (step.active) {
                    stepBtn.el.style.setProperty("--step-active", colors[ti]);
                }

                grid.appendChild(stepBtn.el);
                trackBtns.push(stepBtn);
            }
            this.stepBtns.push(trackBtns);

            row.append(info, grid);
            row.addEventListener("click", () => {
                this.state.selectedTrack = ti;
                this.updateSelection();
            });

            trackList.appendChild(row);
            this.trackRows.push(row);
        });

        this.container.appendChild(trackList);

        // Copy/Paste toolbar
        const toolbar = document.createElement("div");
        toolbar.className = "flex gap-2 mt-2";

        const copyBtn = document.createElement("button");
        copyBtn.className = "scene-btn";
        copyBtn.textContent = "Copy Pattern";
        copyBtn.addEventListener("click", () => {
            const t = this.state.selectedTrack;
            this.state._clipboard = JSON.parse(JSON.stringify(this.state.tracks[t].pattern));
        });

        const pasteBtn = document.createElement("button");
        pasteBtn.className = "scene-btn";
        pasteBtn.textContent = "Paste Pattern";
        pasteBtn.addEventListener("click", () => {
            if (this.state._clipboard) {
                const t = this.state.selectedTrack;
                this.state.tracks[t].pattern = JSON.parse(JSON.stringify(this.state._clipboard));
                this.render();
            }
        });

        const clearBtn = document.createElement("button");
        clearBtn.className = "scene-btn";
        clearBtn.textContent = "Clear";
        clearBtn.addEventListener("click", () => {
            const t = this.state.selectedTrack;
            this.state.tracks[t].pattern.forEach(s => {
                s.active = false;
                s.velocity = 0.8;
                s.pLocks = null;
            });
            this.render();
        });

        toolbar.append(copyBtn, pasteBtn, clearBtn);
        this.container.appendChild(toolbar);
    }

    updateSelection() {
        this.trackRows.forEach((row, i) => {
            row.classList.toggle("selected", i === this.state.selectedTrack);
        });
    }

    updateStep(stepIndex) {
        // Highlight current step column
        this.stepBtns.forEach(trackBtns => {
            trackBtns.forEach((btn, si) => {
                btn.setState({ playing: si === (stepIndex % trackBtns.length) });
            });
        });
        document.getElementById("step-display").textContent = `Step: ${stepIndex}`;
    }

    updateTrackState(trackId) {
        const track = this.state.tracks[trackId];
        const row = this.trackRows[trackId];
        if (!row) return;
        const muteBtn = row.querySelector(".track-mute");
        const soloBtn = row.querySelector(".track-solo");
        if (muteBtn) muteBtn.classList.toggle("active", track.muted);
        if (soloBtn) soloBtn.classList.toggle("active", track.solo);
    }
}
