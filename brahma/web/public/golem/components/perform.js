/**
 * Perform View — XY pad, drum pads, scene save/recall, Claude API
 */
import { createXYPad } from "../ui/xy-pad.js";
import { getTrackColors } from "../themes.js";

export class PerformView {
    constructor(container, state, osc) {
        this.container = container;
        this.state = state;
        this.osc = osc;
        this.padEls = [];
    }

    render() {
        this.container.innerHTML = "";
        const colors = getTrackColors();

        const layout = document.createElement("div");
        layout.className = "grid-2";

        // Left: XY Pad + Generative
        const leftCol = document.createElement("div");

        // XY Pad
        const xyCard = document.createElement("div");
        xyCard.className = "card";
        const xyTitle = document.createElement("div");
        xyTitle.className = "card-title";
        xyTitle.textContent = "XY Pad";
        xyCard.appendChild(xyTitle);

        const xyPad = createXYPad({
            x: this.state.xyPad.x,
            y: this.state.xyPad.y,
            onChange: (x, y) => {
                this.state.xyPad.x = x;
                this.state.xyPad.y = y;
                this.osc.send("/golem/xy/update", x, y);
            }
        });
        xyCard.appendChild(xyPad.el);
        leftCol.appendChild(xyCard);

        // Generative controls
        const genCard = document.createElement("div");
        genCard.className = "card";
        const genTitle = document.createElement("div");
        genTitle.className = "card-title";
        genTitle.textContent = "Generative";
        genCard.appendChild(genTitle);

        const genRow = document.createElement("div");
        genRow.className = "flex flex-wrap gap-2";

        const varBtn = document.createElement("button");
        varBtn.className = "scene-btn";
        varBtn.textContent = "Variation";
        varBtn.addEventListener("click", () => {
            this.osc.send("/golem/gen/variation", this.state.selectedTrack, 0.3);
        });

        const fillBtn = document.createElement("button");
        fillBtn.className = "scene-btn";
        fillBtn.textContent = "Fill";
        fillBtn.addEventListener("click", () => {
            this.osc.send("/golem/gen/fill", this.state.selectedTrack, 4, 0.75);
        });

        genRow.append(varBtn, fillBtn);
        genCard.appendChild(genRow);

        // Claude API integration (optional)
        const aiBox = document.createElement("div");
        aiBox.className = "mt-2";
        const aiLabel = document.createElement("div");
        aiLabel.className = "text-xs";
        aiLabel.style.color = "var(--text-muted)";
        aiLabel.textContent = "AI Pattern (requires API key in server config)";

        const aiInput = document.createElement("input");
        aiInput.type = "text";
        aiInput.placeholder = "Describe a beat...";
        aiInput.style.cssText = "width:100%;padding:6px;background:var(--bg-control);color:var(--text);border:1px solid var(--border);border-radius:6px;font-family:inherit;font-size:12px;margin-top:4px;";

        aiInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && aiInput.value.trim()) {
                // Send to server for Claude API processing (server-side endpoint not yet implemented)
                console.log("AI pattern request:", aiInput.value);
                aiInput.value = "";
            }
        });

        aiBox.append(aiLabel, aiInput);
        genCard.appendChild(aiBox);
        leftCol.appendChild(genCard);

        layout.appendChild(leftCol);

        // Right: Drum Pads + Scenes
        const rightCol = document.createElement("div");

        // Drum Pads
        const padCard = document.createElement("div");
        padCard.className = "card";
        const padTitle = document.createElement("div");
        padTitle.className = "card-title";
        padTitle.textContent = "Drum Pads";
        padCard.appendChild(padTitle);

        const pads = document.createElement("div");
        pads.className = "drum-pads";
        this.padEls = [];

        this.state.tracks.forEach((track, ti) => {
            const pad = document.createElement("div");
            pad.className = "drum-pad";
            pad.style.borderColor = colors[ti];
            pad.textContent = track.name.slice(0, 5);

            pad.addEventListener("pointerdown", (e) => {
                e.preventDefault();
                pad.style.background = colors[ti];
                pad.style.color = "#000";
                this.osc.send("/golem/pad/trigger", ti, 0.8);
            });
            pad.addEventListener("pointerup", () => {
                pad.style.background = "var(--bg-control)";
                pad.style.color = "";
            });
            pad.addEventListener("pointerleave", () => {
                pad.style.background = "var(--bg-control)";
                pad.style.color = "";
            });

            pads.appendChild(pad);
            this.padEls.push(pad);
        });

        padCard.appendChild(pads);
        rightCol.appendChild(padCard);

        // Scene save/recall
        const sceneCard = document.createElement("div");
        sceneCard.className = "card";
        const sceneTitle = document.createElement("div");
        sceneTitle.className = "card-title";
        sceneTitle.textContent = "Scenes";
        sceneCard.appendChild(sceneTitle);

        const sceneRow = document.createElement("div");
        sceneRow.className = "flex flex-wrap gap-2";

        for (let i = 1; i <= 8; i++) {
            const btn = document.createElement("button");
            btn.className = "scene-btn";
            btn.textContent = `Scene ${i}`;

            btn.addEventListener("click", () => {
                this.osc.send("/golem/scene/load", `scene_${i}`);
            });
            btn.addEventListener("dblclick", () => {
                this.osc.send("/golem/scene/save", `scene_${i}`);
                btn.classList.add("active");
                setTimeout(() => btn.classList.remove("active"), 500);
            });

            sceneRow.appendChild(btn);
        }

        const sceneHint = document.createElement("div");
        sceneHint.className = "text-xs mt-2";
        sceneHint.style.color = "var(--text-muted)";
        sceneHint.textContent = "Click to recall, double-click to save";

        sceneCard.append(sceneRow, sceneHint);
        rightCol.appendChild(sceneCard);

        layout.appendChild(rightCol);
        this.container.appendChild(layout);
    }

    flashPad(trackId) {
        const pad = this.padEls[trackId];
        if (!pad) return;
        const colors = getTrackColors();
        pad.style.background = colors[trackId];
        pad.style.color = "#000";
        setTimeout(() => {
            pad.style.background = "var(--bg-control)";
            pad.style.color = "";
        }, 80);
    }
}
