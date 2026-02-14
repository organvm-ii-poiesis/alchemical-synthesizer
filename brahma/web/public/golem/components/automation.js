/**
 * Automation View — per-step parameter curves with drag editing
 */
import { createSelect } from "../ui/select.js";
import { getTrackColors } from "../themes.js";

const autoParams = [
    "freq", "cutoff", "res", "envAmt", "atk", "dec", "sus", "rel",
    "fAtk", "fDec", "fSus", "fRel", "noiseAmt", "foldAmt", "drive"
];

export class AutomationView {
    constructor(container, state, osc) {
        this.container = container;
        this.state = state;
        this.osc = osc;
        this.selectedParam = "cutoff";
    }

    render() {
        this.container.innerHTML = "";
        const track = this.state.tracks[this.state.selectedTrack];
        const colors = getTrackColors();
        const color = colors[this.state.selectedTrack];

        // Header
        const header = document.createElement("div");
        header.className = "flex items-center gap-3 mb-2";
        const title = document.createElement("span");
        title.className = "font-bold";
        title.style.color = color;
        title.textContent = `Automation: Track ${this.state.selectedTrack + 1}`;
        header.appendChild(title);

        const paramSelect = createSelect({
            value: this.selectedParam,
            options: autoParams,
            label: "Parameter",
            onChange: (val) => {
                this.selectedParam = val;
                this.render();
            }
        });
        header.appendChild(paramSelect.el);
        this.container.appendChild(header);

        // Ensure automation data exists
        if (!track.automation[this.selectedParam]) {
            track.automation[this.selectedParam] = Array(track.steps).fill(0.5);
        }
        const data = track.automation[this.selectedParam];

        // Automation lane (bar graph)
        const lane = document.createElement("div");
        lane.className = "auto-lane";

        const bars = [];
        for (let i = 0; i < track.steps; i++) {
            const bar = document.createElement("div");
            bar.className = "auto-bar";
            bar.style.height = `${(data[i] || 0.5) * 100}%`;
            bar.style.background = color;

            let dragging = false;

            bar.addEventListener("pointerdown", (e) => {
                e.preventDefault();
                dragging = true;
                bar.setPointerCapture(e.pointerId);
            });

            bar.addEventListener("pointermove", (e) => {
                if (!dragging) return;
                const rect = lane.getBoundingClientRect();
                const ratio = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
                data[i] = ratio;
                bar.style.height = `${ratio * 100}%`;
                // Send p-lock for this step
                this.osc.send("/golem/step/plock",
                    this.state.selectedTrack, i, this.selectedParam, ratio);
            });

            bar.addEventListener("pointerup", () => { dragging = false; });

            lane.appendChild(bar);
            bars.push(bar);
        }

        this.container.appendChild(lane);

        // Controls
        const controls = document.createElement("div");
        controls.className = "flex gap-2 mt-2";

        const clearBtn = document.createElement("button");
        clearBtn.className = "scene-btn";
        clearBtn.textContent = "Clear Lane";
        clearBtn.addEventListener("click", () => {
            track.automation[this.selectedParam] = Array(track.steps).fill(0.5);
            this.render();
        });

        const randomBtn = document.createElement("button");
        randomBtn.className = "scene-btn";
        randomBtn.textContent = "Randomize";
        randomBtn.addEventListener("click", () => {
            for (let i = 0; i < track.steps; i++) {
                data[i] = Math.random();
                this.osc.send("/golem/step/plock",
                    this.state.selectedTrack, i, this.selectedParam, data[i]);
            }
            this.render();
        });

        const rampBtn = document.createElement("button");
        rampBtn.className = "scene-btn";
        rampBtn.textContent = "Ramp Up";
        rampBtn.addEventListener("click", () => {
            for (let i = 0; i < track.steps; i++) {
                data[i] = i / (track.steps - 1);
                this.osc.send("/golem/step/plock",
                    this.state.selectedTrack, i, this.selectedParam, data[i]);
            }
            this.render();
        });

        controls.append(clearBtn, randomBtn, rampBtn);
        this.container.appendChild(controls);
    }
}
