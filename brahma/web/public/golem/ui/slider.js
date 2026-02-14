/**
 * Slider — horizontal/vertical fader
 */
export function createSlider({ value = 0, min = 0, max = 1, label = "", vertical = false, color, onChange }) {
    const wrap = document.createElement("div");
    wrap.className = "slider-wrap";

    if (label) {
        const labelEl = document.createElement("span");
        labelEl.className = "slider-label";
        labelEl.textContent = label;
        wrap.appendChild(labelEl);
    }

    const track = document.createElement("div");
    track.className = `slider-track${vertical ? " slider-vertical" : ""}`;

    const fill = document.createElement("div");
    fill.className = "slider-fill";
    const thumb = document.createElement("div");
    thumb.className = "slider-thumb";
    if (color) {
        fill.style.background = color;
        thumb.style.borderColor = color;
    }

    track.append(fill, thumb);
    wrap.appendChild(track);

    let currentVal = value;
    let dragging = false;

    function updateDisplay() {
        const ratio = (currentVal - min) / (max - min);
        if (vertical) {
            fill.style.height = `${ratio * 100}%`;
            thumb.style.bottom = `${ratio * 100}%`;
            thumb.style.left = "50%";
            thumb.style.transform = "translate(-50%, 50%)";
        } else {
            fill.style.width = `${ratio * 100}%`;
            thumb.style.left = `${ratio * 100}%`;
            thumb.style.top = "50%";
            thumb.style.transform = "translate(-50%, -50%)";
        }
    }

    function handleMove(e) {
        const rect = track.getBoundingClientRect();
        const t = e.touches?.[0] || e;
        let ratio;
        if (vertical) {
            ratio = 1 - Math.max(0, Math.min(1, (t.clientY - rect.top) / rect.height));
        } else {
            ratio = Math.max(0, Math.min(1, (t.clientX - rect.left) / rect.width));
        }
        currentVal = min + ratio * (max - min);
        updateDisplay();
        onChange?.(currentVal);
    }

    track.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        dragging = true;
        track.setPointerCapture(e.pointerId);
        handleMove(e);
    });
    track.addEventListener("pointermove", (e) => {
        if (dragging) handleMove(e);
    });
    track.addEventListener("pointerup", () => { dragging = false; });

    function setValue(v) {
        currentVal = Math.max(min, Math.min(max, v));
        updateDisplay();
    }

    updateDisplay();

    return { el: wrap, setValue, getValue: () => currentVal };
}
