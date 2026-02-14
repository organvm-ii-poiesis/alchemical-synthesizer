/**
 * Step Button — velocity bar, p-lock indicator, tap/drag/long-press
 */
export function createStepBtn({ active = false, velocity = 0.8, hasPLock = false, onToggle, onVelChange, onLongPress }) {
    const btn = document.createElement("div");
    btn.className = "step-btn";

    const velBar = document.createElement("div");
    velBar.className = "vel-bar";

    const plockDot = document.createElement("div");
    plockDot.className = "plock-dot";
    plockDot.style.display = "none";

    btn.append(velBar, plockDot);

    let state = { active, velocity, hasPLock, playing: false };
    let pressing = false;
    let longTimer = null;
    let startY = 0, startVel = 0;
    let moved = false;

    function updateDisplay() {
        btn.classList.toggle("active", state.active);
        btn.classList.toggle("has-plock", state.hasPLock);
        btn.classList.toggle("playing", state.playing);
        velBar.style.height = state.active ? `${state.velocity * 100}%` : "0";
        plockDot.style.display = state.hasPLock ? "block" : "none";
    }

    btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        pressing = true;
        moved = false;
        startY = e.clientY;
        startVel = state.velocity;
        btn.setPointerCapture(e.pointerId);

        longTimer = setTimeout(() => {
            if (!moved) {
                onLongPress?.();
                pressing = false;
            }
        }, 400);
    });

    btn.addEventListener("pointermove", (e) => {
        if (!pressing) return;
        const dy = startY - e.clientY;
        if (Math.abs(dy) > 3) {
            moved = true;
            clearTimeout(longTimer);
            if (state.active) {
                state.velocity = Math.max(0.1, Math.min(1, startVel + dy / 60));
                updateDisplay();
                onVelChange?.(state.velocity);
            }
        }
    });

    btn.addEventListener("pointerup", () => {
        clearTimeout(longTimer);
        if (pressing && !moved) {
            onToggle?.();
        }
        pressing = false;
    });

    function setState(newState) {
        Object.assign(state, newState);
        updateDisplay();
    }

    updateDisplay();

    return { el: btn, setState, getState: () => ({ ...state }) };
}
