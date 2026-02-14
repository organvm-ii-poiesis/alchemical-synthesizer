/**
 * Mixer View — channel strips: volume, pan, mute/solo, VU
 */
import { createSlider } from "../ui/slider.js";
import { createKnob } from "../ui/knob.js";
import { getTrackColors } from "../themes.js";

export class MixerView {
    constructor(container, state, osc) {
        this.container = container;
        this.state = state;
        this.osc = osc;
        this.vuFills = [];
        this.flashTimers = [];
    }

    render() {
        this.container.innerHTML = "";
        const colors = getTrackColors();
        this.vuFills = [];
        this.flashTimers = [];

        const title = document.createElement("div");
        title.className = "card-title mb-2";
        title.textContent = "Mixer";
        this.container.appendChild(title);

        const channels = document.createElement("div");
        channels.className = "mixer-channels";

        this.state.tracks.forEach((track, ti) => {
            const strip = document.createElement("div");
            strip.className = "channel-strip";
            strip.style.borderColor = colors[ti];

            // Name
            const name = document.createElement("div");
            name.className = "channel-name";
            name.style.color = colors[ti];
            name.textContent = track.name.slice(0, 6);
            strip.appendChild(name);

            // VU meter
            const vu = document.createElement("div");
            vu.className = "vu-meter";
            const vuFill = document.createElement("div");
            vuFill.className = "vu-fill";
            vuFill.style.height = "0%";
            vu.appendChild(vuFill);
            strip.appendChild(vu);
            this.vuFills.push(vuFill);

            // Volume fader (vertical)
            const vol = createSlider({
                value: track.fx.drive !== undefined ? 0.8 : 0.8,
                min: 0, max: 1,
                vertical: true,
                color: colors[ti],
                onChange: (v) => {
                    this.osc.send("/golem/engine/param", ti, "volume", v);
                }
            });
            strip.appendChild(vol.el);

            // Pan knob
            const pan = createKnob({
                value: 0, min: -1, max: 1,
                label: "Pan", color: colors[ti], bipolar: true,
                onChange: (v) => {
                    this.osc.send("/golem/engine/param", ti, "pan", v);
                }
            });
            strip.appendChild(pan.el);

            // Mute/Solo buttons
            const btnRow = document.createElement("div");
            btnRow.className = "flex gap-2";

            const muteBtn = document.createElement("button");
            muteBtn.className = `track-mute${track.muted ? " active" : ""}`;
            muteBtn.textContent = "M";
            muteBtn.dataset.track = ti;
            muteBtn.addEventListener("click", () => {
                this.osc.send("/golem/track/mute", ti);
            });

            const soloBtn = document.createElement("button");
            soloBtn.className = `track-solo${track.solo ? " active" : ""}`;
            soloBtn.textContent = "S";
            soloBtn.dataset.track = ti;
            soloBtn.addEventListener("click", () => {
                this.osc.send("/golem/track/solo", ti);
            });

            btnRow.append(muteBtn, soloBtn);
            strip.appendChild(btnRow);

            channels.appendChild(strip);
        });

        this.container.appendChild(channels);

        // Mute Groups
        const mgCard = document.createElement("div");
        mgCard.className = "card mt-2";
        const mgTitle = document.createElement("div");
        mgTitle.className = "card-title";
        mgTitle.textContent = "Mute Groups";
        mgCard.appendChild(mgTitle);

        const mgRow = document.createElement("div");
        mgRow.className = "flex gap-2";
        ["A", "B", "C", "D"].forEach(group => {
            const btn = document.createElement("button");
            btn.className = "scene-btn";
            btn.textContent = `Group ${group}`;
            btn.addEventListener("click", () => {
                this.osc.send("/golem/mutegroup/toggle", group);
            });
            mgRow.appendChild(btn);
        });
        mgCard.appendChild(mgRow);
        this.container.appendChild(mgCard);
    }

    flash(trackId, velocity) {
        if (this.vuFills[trackId]) {
            this.vuFills[trackId].style.height = `${velocity * 100}%`;
            clearTimeout(this.flashTimers[trackId]);
            this.flashTimers[trackId] = setTimeout(() => {
                if (this.vuFills[trackId]) {
                    this.vuFills[trackId].style.height = "0%";
                }
            }, 150);
        }
    }

    updateTrackState(trackId) {
        const track = this.state.tracks[trackId];
        const muteBtn = this.container.querySelector(`.track-mute[data-track="${trackId}"]`);
        const soloBtn = this.container.querySelector(`.track-solo[data-track="${trackId}"]`);
        if (muteBtn) muteBtn.classList.toggle("active", track.muted);
        if (soloBtn) soloBtn.classList.toggle("active", track.solo);
    }
}
