/**
 * Engine View — synth editors, blend mixer, FX, humanize, p-lock
 */
import { createKnob } from "../ui/knob.js";
import { createSlider } from "../ui/slider.js";
import { createSelect } from "../ui/select.js";
import { createEnvDisplay } from "../ui/env-display.js";
import { getTrackColors } from "../themes.js";

const synthTypes = [
    { value: "drum_subtractive", label: "Subtractive" },
    { value: "drum_fm", label: "FM" },
    { value: "drum_additive", label: "Additive" },
    { value: "drum_karplus", label: "Karplus-Strong" },
    { value: "drum_noise", label: "Noise" },
    { value: "drum_wavefold", label: "Wavefold" }
];

const filterTypes = [
    { value: 0, label: "Lowpass" },
    { value: 1, label: "Highpass" },
    { value: 2, label: "Bandpass" },
    { value: 3, label: "Notch" }
];

const presets = [
    "kick808", "snare", "clap", "hihatClosed", "hihatOpen", "tom", "rim", "fmBell", "pluck"
];

export class EngineView {
    constructor(container, state, osc) {
        this.container = container;
        this.state = state;
        this.osc = osc;
    }

    render() {
        this.container.innerHTML = "";
        const track = this.state.tracks[this.state.selectedTrack];
        const colors = getTrackColors();
        const color = colors[this.state.selectedTrack];

        // Track selector
        const header = document.createElement("div");
        header.className = "flex items-center gap-3 mb-2";
        const title = document.createElement("span");
        title.className = "font-bold";
        title.style.color = color;
        title.textContent = `Track ${this.state.selectedTrack + 1}: ${track.name}`;
        header.appendChild(title);
        this.container.appendChild(header);

        // Preset loader
        const presetCard = document.createElement("div");
        presetCard.className = "card";
        const presetTitle = document.createElement("div");
        presetTitle.className = "card-title";
        presetTitle.textContent = "Presets";
        presetCard.appendChild(presetTitle);

        const presetRow = document.createElement("div");
        presetRow.className = "flex flex-wrap gap-2";
        presets.forEach(name => {
            const btn = document.createElement("button");
            btn.className = "scene-btn";
            btn.textContent = name;
            btn.addEventListener("click", () => {
                this.osc.send("/golem/preset/load", this.state.selectedTrack, name);
                track.name = name;
                this.render();
            });
            presetRow.appendChild(btn);
        });
        presetCard.appendChild(presetRow);
        this.container.appendChild(presetCard);

        // Synth A section
        const synthCard = document.createElement("div");
        synthCard.className = "card";
        const synthTitle = document.createElement("div");
        synthTitle.className = "card-title";
        synthTitle.textContent = "Synth A";
        synthCard.appendChild(synthTitle);

        // Type selector
        const typeSelect = createSelect({
            value: track.synthDef,
            options: synthTypes,
            label: "Type",
            onChange: (val) => {
                track.synthDef = val;
                this.osc.send("/golem/engine/param", this.state.selectedTrack, "synthDef", val);
            }
        });
        synthCard.appendChild(typeSelect.el);

        // Oscillator params
        const oscRow = document.createElement("div");
        oscRow.className = "flex gap-3 mt-2";

        const freqKnob = createKnob({
            value: track.synthArgs.freq || 150, min: 20, max: 2000,
            label: "Freq", color,
            onChange: (v) => {
                track.synthArgs.freq = v;
                this.osc.send("/golem/engine/param", this.state.selectedTrack, "freq", v);
            }
        });

        const cutoffKnob = createKnob({
            value: track.synthArgs.cutoff || 2000, min: 20, max: 20000,
            label: "Cutoff", color,
            onChange: (v) => {
                track.synthArgs.cutoff = v;
                this.osc.send("/golem/engine/param", this.state.selectedTrack, "cutoff", v);
            }
        });

        const resKnob = createKnob({
            value: track.synthArgs.res || 1, min: 0.5, max: 20,
            label: "Res", color,
            onChange: (v) => {
                track.synthArgs.res = v;
                this.osc.send("/golem/engine/param", this.state.selectedTrack, "res", v);
            }
        });

        const envAmtKnob = createKnob({
            value: track.synthArgs.envAmt || 0, min: 0, max: 1,
            label: "EnvAmt", color,
            onChange: (v) => {
                track.synthArgs.envAmt = v;
                this.osc.send("/golem/engine/param", this.state.selectedTrack, "envAmt", v);
            }
        });

        oscRow.append(freqKnob.el, cutoffKnob.el, resKnob.el, envAmtKnob.el);
        synthCard.appendChild(oscRow);

        // Filter type
        const filterSelect = createSelect({
            value: track.synthArgs.filterType || 0,
            options: filterTypes,
            label: "Filter",
            onChange: (val) => {
                track.synthArgs.filterType = parseInt(val);
                this.osc.send("/golem/engine/param", this.state.selectedTrack, "filterType", parseInt(val));
            }
        });
        synthCard.appendChild(filterSelect.el);

        // Amp envelope
        const ampEnvTitle = document.createElement("div");
        ampEnvTitle.className = "card-title mt-2";
        ampEnvTitle.textContent = "Amp Envelope";
        synthCard.appendChild(ampEnvTitle);

        const envRow = document.createElement("div");
        envRow.className = "flex gap-3";

        const atkKnob = createKnob({
            value: track.synthArgs.atk || 0.001, min: 0.001, max: 0.5,
            label: "Attack", color,
            onChange: (v) => {
                track.synthArgs.atk = v;
                this.osc.send("/golem/engine/param", this.state.selectedTrack, "atk", v);
            }
        });
        const decKnob = createKnob({
            value: track.synthArgs.dec || 0.3, min: 0.01, max: 2,
            label: "Decay", color,
            onChange: (v) => {
                track.synthArgs.dec = v;
                this.osc.send("/golem/engine/param", this.state.selectedTrack, "dec", v);
            }
        });
        const susKnob = createKnob({
            value: track.synthArgs.sus || 0, min: 0, max: 1,
            label: "Sustain", color,
            onChange: (v) => {
                track.synthArgs.sus = v;
                this.osc.send("/golem/engine/param", this.state.selectedTrack, "sus", v);
            }
        });
        const relKnob = createKnob({
            value: track.synthArgs.rel || 0.1, min: 0.01, max: 2,
            label: "Release", color,
            onChange: (v) => {
                track.synthArgs.rel = v;
                this.osc.send("/golem/engine/param", this.state.selectedTrack, "rel", v);
            }
        });

        envRow.append(atkKnob.el, decKnob.el, susKnob.el, relKnob.el);
        synthCard.appendChild(envRow);

        // Env display
        const envDisplay = createEnvDisplay({
            a: track.synthArgs.atk || 0.001,
            d: track.synthArgs.dec || 0.3,
            s: track.synthArgs.sus || 0,
            r: track.synthArgs.rel || 0.1,
            color
        });
        synthCard.appendChild(envDisplay.el);

        this.container.appendChild(synthCard);

        // Blend section
        const blendCard = document.createElement("div");
        blendCard.className = "card";
        const blendTitle = document.createElement("div");
        blendTitle.className = "card-title";
        blendTitle.textContent = "Source Blend";
        blendCard.appendChild(blendTitle);

        const blendRow = document.createElement("div");
        blendRow.className = "flex gap-3";

        ["synthA", "synthB", "sampleA", "sampleB"].forEach(src => {
            const knob = createKnob({
                value: track.blend[src] || 0, min: 0, max: 1,
                label: src, color,
                onChange: (v) => {
                    track.blend[src] = v;
                    this.osc.send("/golem/engine/param", this.state.selectedTrack, `blend_${src}`, v);
                }
            });
            blendRow.appendChild(knob.el);
        });
        blendCard.appendChild(blendRow);
        this.container.appendChild(blendCard);

        // FX section
        const fxCard = document.createElement("div");
        fxCard.className = "card";
        const fxTitle = document.createElement("div");
        fxTitle.className = "card-title";
        fxTitle.textContent = "Effects";
        fxCard.appendChild(fxTitle);

        const fxRow = document.createElement("div");
        fxRow.className = "flex gap-3";

        const fxParams = [
            { key: "drive", label: "Drive", fx: "drive", param: "amount" },
            { key: "bitcrush", label: "Crush", fx: "bitcrush", param: "amount" },
            { key: "delayMix", label: "Delay", fx: "delay", param: "mix" },
            { key: "reverbMix", label: "Reverb", fx: "reverb", param: "mix" }
        ];

        fxParams.forEach(({ key, label, fx, param }) => {
            const knob = createKnob({
                value: track.fx[key] || 0, min: 0, max: 1,
                label, color,
                onChange: (v) => {
                    track.fx[key] = v;
                    this.osc.send("/golem/fx/param", this.state.selectedTrack, fx, param, v);
                }
            });
            fxRow.appendChild(knob.el);
        });
        fxCard.appendChild(fxRow);
        this.container.appendChild(fxCard);

        // Humanize section
        const humCard = document.createElement("div");
        humCard.className = "card";
        const humTitle = document.createElement("div");
        humTitle.className = "card-title";
        humTitle.textContent = "Humanize";
        humCard.appendChild(humTitle);

        const humRow = document.createElement("div");
        humRow.className = "flex gap-3";

        ["velRand", "timeRand", "pitchRand", "probability"].forEach(param => {
            const max = param === "probability" ? 1 : (param === "timeRand" ? 0.05 : 0.3);
            const knob = createKnob({
                value: track.humanize[param] || (param === "probability" ? 1 : 0),
                min: 0, max,
                label: param, color,
                onChange: (v) => {
                    track.humanize[param] = v;
                    this.osc.send("/golem/engine/param", this.state.selectedTrack, param, v);
                }
            });
            humRow.appendChild(knob.el);
        });
        humCard.appendChild(humRow);
        this.container.appendChild(humCard);
    }
}
