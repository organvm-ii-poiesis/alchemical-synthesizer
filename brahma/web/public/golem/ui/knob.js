/**
 * Rotary Knob — drag up/down, arc indicator
 */
export function createKnob({ value = 0, min = 0, max = 1, label = "", color, bipolar = false, onChange }) {
    const wrap = document.createElement("div");
    wrap.className = "knob-wrap";

    const labelEl = document.createElement("span");
    labelEl.className = "knob-label";
    labelEl.textContent = label;

    const knob = document.createElement("div");
    knob.className = "knob";

    const arc = document.createElement("div");
    arc.className = "arc";
    const inner = document.createElement("div");
    inner.className = "inner";
    const needle = document.createElement("div");
    needle.className = "needle";
    const needleLine = document.createElement("div");
    needleLine.className = "needle-line";
    if (color) needleLine.style.background = color;
    needle.appendChild(needleLine);

    knob.append(arc, inner, needle);

    const valueEl = document.createElement("span");
    valueEl.className = "knob-value";

    wrap.append(labelEl, knob, valueEl);

    let currentVal = value;
    let dragging = false;
    let startY = 0, startVal = 0;

    function updateDisplay() {
        const ratio = (currentVal - min) / (max - min);
        const angle = bipolar ? (ratio - 0.5) * 270 : -135 + ratio * 270;
        needleLine.style.transform = `rotate(${angle}deg) translateY(-50%)`;
        arc.style.background = `conic-gradient(from -135deg, ${color || "var(--accent)"} ${ratio * 270}deg, transparent ${ratio * 270}deg)`;
        valueEl.textContent = currentVal.toFixed(2);
    }

    knob.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        dragging = true;
        startY = e.clientY;
        startVal = currentVal;
        knob.setPointerCapture(e.pointerId);
    });

    knob.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const dy = startY - e.clientY;
        currentVal = Math.max(min, Math.min(max, startVal + (dy / 100) * (max - min)));
        updateDisplay();
        onChange?.(currentVal);
    });

    knob.addEventListener("pointerup", () => { dragging = false; });

    function setValue(v) {
        currentVal = Math.max(min, Math.min(max, v));
        updateDisplay();
    }

    updateDisplay();

    return { el: wrap, setValue, getValue: () => currentVal };
}
