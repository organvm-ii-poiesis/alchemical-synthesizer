/**
 * 2D XY touch controller with crosshairs and cursor glow
 */
export function createXYPad({ x = 0.5, y = 0.5, onChange }) {
    const pad = document.createElement("div");
    pad.className = "xy-pad";

    const crossH = document.createElement("div");
    crossH.className = "xy-crosshair-h";
    const crossV = document.createElement("div");
    crossV.className = "xy-crosshair-v";
    const cursor = document.createElement("div");
    cursor.className = "xy-cursor";

    pad.append(crossH, crossV, cursor);

    let state = { x, y };
    let dragging = false;

    function updateDisplay() {
        const px = state.x * pad.offsetWidth;
        const py = (1 - state.y) * pad.offsetHeight;
        cursor.style.left = `${px}px`;
        cursor.style.top = `${py}px`;
        crossH.style.top = `${py}px`;
        crossV.style.left = `${px}px`;
    }

    function handleMove(e) {
        const rect = pad.getBoundingClientRect();
        const t = e.touches?.[0] || e;
        state.x = Math.max(0, Math.min(1, (t.clientX - rect.left) / rect.width));
        state.y = Math.max(0, Math.min(1, 1 - (t.clientY - rect.top) / rect.height));
        updateDisplay();
        onChange?.(state.x, state.y);
    }

    pad.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        dragging = true;
        pad.setPointerCapture(e.pointerId);
        handleMove(e);
    });
    pad.addEventListener("pointermove", (e) => {
        if (dragging) handleMove(e);
    });
    pad.addEventListener("pointerup", () => { dragging = false; });

    // Initial position after element is in DOM
    requestAnimationFrame(updateDisplay);

    function setValue(newX, newY) {
        state.x = newX;
        state.y = newY;
        updateDisplay();
    }

    return { el: pad, setValue, getValue: () => ({ ...state }) };
}
