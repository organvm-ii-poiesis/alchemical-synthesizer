/**
 * Patchbay View — SVG bezier patch cables, LFO editors, mod matrix
 */
import { createKnob } from "../ui/knob.js";
import { createSelect } from "../ui/select.js";
import { getTrackColors } from "../themes.js";

const modSources = ["lfo1", "lfo2", "lfo3", "env", "random", "stepPos", "velocity", "xyPadX", "xyPadY", "synthA", "synthB"];
const modDests = [
    "synthA.freq", "synthA.cutoff", "synthA.res", "synthA.decay",
    "synthB.freq", "synthB.cutoff",
    "blend.synthA", "blend.synthB", "blend.sampleA", "blend.sampleB",
    "pan", "drive", "delayMix", "reverbMix", "bitcrush"
];

const lfoShapes = ["sine", "square", "saw", "tri", "random"];

export class PatchbayView {
    constructor(container, state, osc) {
        this.container = container;
        this.state = state;
        this.osc = osc;
        this.lfoValues = Array.from({ length: 8 }, () => [0, 0, 0]);
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
        title.textContent = `Patchbay: Track ${this.state.selectedTrack + 1}`;
        header.appendChild(title);
        this.container.appendChild(header);

        // LFO editors
        const lfoCard = document.createElement("div");
        lfoCard.className = "card";
        const lfoTitle = document.createElement("div");
        lfoTitle.className = "card-title";
        lfoTitle.textContent = "LFOs";
        lfoCard.appendChild(lfoTitle);

        const lfoGrid = document.createElement("div");
        lfoGrid.className = "grid-3";

        track.lfos.forEach((lfo, li) => {
            const lfoBox = document.createElement("div");
            lfoBox.className = "card";

            const lfoLabel = document.createElement("div");
            lfoLabel.className = "card-title";
            lfoLabel.textContent = `LFO ${li + 1}`;
            lfoBox.appendChild(lfoLabel);

            const shapeSelect = createSelect({
                value: lfo.shape,
                options: lfoShapes,
                label: "Shape",
                onChange: (val) => {
                    lfo.shape = val;
                    const shapeIdx = lfoShapes.indexOf(val);
                    this.osc.send("/golem/lfo/param", this.state.selectedTrack, li, "shape", shapeIdx);
                }
            });
            lfoBox.appendChild(shapeSelect.el);

            const rateKnob = createKnob({
                value: lfo.rate, min: 0.01, max: 20,
                label: "Rate", color,
                onChange: (v) => {
                    lfo.rate = v;
                    this.osc.send("/golem/lfo/param", this.state.selectedTrack, li, "rate", v);
                }
            });
            lfoBox.appendChild(rateKnob.el);

            const phaseKnob = createKnob({
                value: lfo.phase, min: 0, max: 6.283,
                label: "Phase", color,
                onChange: (v) => {
                    lfo.phase = v;
                    this.osc.send("/golem/lfo/param", this.state.selectedTrack, li, "phase", v);
                }
            });
            lfoBox.appendChild(phaseKnob.el);

            // Live value display
            const valDisp = document.createElement("span");
            valDisp.className = "text-xs";
            valDisp.style.color = "var(--text-muted)";
            valDisp.textContent = "0.00";
            valDisp.dataset.lfoTrack = this.state.selectedTrack;
            valDisp.dataset.lfoIdx = li;
            lfoBox.appendChild(valDisp);

            lfoGrid.appendChild(lfoBox);
        });

        lfoCard.appendChild(lfoGrid);
        this.container.appendChild(lfoCard);

        // Mod Matrix
        const modCard = document.createElement("div");
        modCard.className = "card";
        const modTitle = document.createElement("div");
        modTitle.className = "card-title";
        modTitle.textContent = "Modulation Matrix";
        modCard.appendChild(modTitle);

        // Existing routes
        track.modMatrix.forEach((route, ri) => {
            const routeRow = document.createElement("div");
            routeRow.className = "flex items-center gap-2 mb-2";

            const srcLabel = document.createElement("span");
            srcLabel.className = "text-sm";
            srcLabel.textContent = route.source;
            srcLabel.style.color = color;

            const arrow = document.createElement("span");
            arrow.className = "text-sm";
            arrow.textContent = " -> ";
            arrow.style.color = "var(--text-muted)";

            const dstLabel = document.createElement("span");
            dstLabel.className = "text-sm";
            dstLabel.textContent = route.dest;

            const amtKnob = createKnob({
                value: route.amount, min: -1, max: 1,
                label: "Amt", color, bipolar: true,
                onChange: (v) => {
                    route.amount = v;
                    this.osc.send("/golem/mod/amount", this.state.selectedTrack, ri, v);
                }
            });

            const removeBtn = document.createElement("button");
            removeBtn.className = "scene-btn";
            removeBtn.textContent = "X";
            removeBtn.addEventListener("click", () => {
                track.modMatrix.splice(ri, 1);
                this.osc.send("/golem/mod/remove", this.state.selectedTrack, ri);
                this.render();
            });

            routeRow.append(srcLabel, arrow, dstLabel, amtKnob.el, removeBtn);
            modCard.appendChild(routeRow);
        });

        // Add new route
        const addRow = document.createElement("div");
        addRow.className = "flex items-center gap-2 mt-2";

        const srcSelect = createSelect({
            value: modSources[0],
            options: modSources,
            label: "Source"
        });

        const dstSelect = createSelect({
            value: modDests[0],
            options: modDests,
            label: "Dest"
        });

        const addBtn = document.createElement("button");
        addBtn.className = "scene-btn";
        addBtn.textContent = "+ Add Route";
        addBtn.addEventListener("click", () => {
            const src = srcSelect.getValue();
            const dst = dstSelect.getValue();
            track.modMatrix.push({ source: src, dest: dst, amount: 0.5 });
            this.osc.send("/golem/mod/add", this.state.selectedTrack, src, dst, 0.5);
            this.render();
        });

        addRow.append(srcSelect.el, dstSelect.el, addBtn);
        modCard.appendChild(addRow);
        this.container.appendChild(modCard);

        // Patch cable visualization (SVG)
        this.renderCables(track, color);
    }

    renderCables(track, color) {
        if (track.modMatrix.length === 0) return;

        const svgWrap = document.createElement("div");
        svgWrap.className = "card";
        const cableTitle = document.createElement("div");
        cableTitle.className = "card-title";
        cableTitle.textContent = "Patch Cables";
        svgWrap.appendChild(cableTitle);

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 600 200");
        svg.style.width = "100%";
        svg.style.height = "200px";

        const srcX = 50;
        const dstX = 550;

        track.modMatrix.forEach((route, ri) => {
            const srcIdx = modSources.indexOf(route.source);
            const dstIdx = modDests.indexOf(route.dest);
            const sy = 20 + (srcIdx / modSources.length) * 160;
            const dy = 20 + (dstIdx / modDests.length) * 160;

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            const midX = 300;
            path.setAttribute("d", `M ${srcX} ${sy} C ${midX} ${sy}, ${midX} ${dy}, ${dstX} ${dy}`);
            path.setAttribute("stroke", color);
            path.setAttribute("stroke-width", Math.abs(route.amount) * 3 + 1);
            path.setAttribute("fill", "none");
            path.setAttribute("opacity", 0.6);
            svg.appendChild(path);
        });

        // Source labels
        modSources.forEach((src, i) => {
            const y = 20 + (i / modSources.length) * 160;
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", srcX + 10);
            text.setAttribute("y", y + 4);
            text.setAttribute("fill", "var(--text-muted)");
            text.setAttribute("font-size", "9");
            text.textContent = src;
            svg.appendChild(text);
        });

        // Dest labels
        modDests.forEach((dst, i) => {
            const y = 20 + (i / modDests.length) * 160;
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", dstX - 10);
            text.setAttribute("y", y + 4);
            text.setAttribute("fill", "var(--text-muted)");
            text.setAttribute("font-size", "9");
            text.setAttribute("text-anchor", "end");
            text.textContent = dst;
            svg.appendChild(text);
        });

        svgWrap.appendChild(svg);
        this.container.appendChild(svgWrap);
    }

    updateLFO(trackId, lfoIdx, value) {
        this.lfoValues[trackId][lfoIdx] = value;
        const disp = this.container.querySelector(
            `[data-lfo-track="${trackId}"][data-lfo-idx="${lfoIdx}"]`
        );
        if (disp) disp.textContent = value.toFixed(2);
    }
}
