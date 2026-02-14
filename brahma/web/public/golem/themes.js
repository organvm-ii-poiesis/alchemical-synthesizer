/**
 * Golem Themes — CSS custom property sets
 */
export const themes = {
    midnight: {
        name: "Midnight",
        "--bg": "#09090b",
        "--bg-card": "#18181b",
        "--bg-control": "#27272a",
        "--text": "#f4f4f5",
        "--text-muted": "#a1a1aa",
        "--text-accent": "#fb923c",
        "--accent": "#f97316",
        "--accent-dim": "#9a3412",
        "--border": "#3f3f46",
        "--border-accent": "#f97316",
        "--step-active": "#f97316",
        "--step-plock": "#a855f7",
        "--track-colors": "#f97316,#06b6d4,#a855f7,#22c55e,#f43f5e,#eab308,#ec4899,#14b8a6",
        "--glow": "none"
    },
    vapor: {
        name: "Vaporwave",
        "--bg": "#1a0a2e",
        "--bg-card": "#2d1054",
        "--bg-control": "#3d1a6e",
        "--text": "#fce7f3",
        "--text-muted": "#f9a8d480",
        "--text-accent": "#22d3ee",
        "--accent": "#22d3ee",
        "--accent-dim": "#0e7490",
        "--border": "#ec489930",
        "--border-accent": "#22d3ee",
        "--step-active": "#22d3ee",
        "--step-plock": "#c084fc",
        "--track-colors": "#22d3ee,#f472b6,#c084fc,#a3e635,#fb7185,#facc15,#818cf8,#34d399",
        "--glow": "0 0 10px var(--accent)"
    },
    terminal: {
        name: "Terminal",
        "--bg": "#000000",
        "--bg-card": "#001a0030",
        "--bg-control": "#001a0050",
        "--text": "#4ade80",
        "--text-muted": "#166534",
        "--text-accent": "#86efac",
        "--accent": "#22c55e",
        "--accent-dim": "#15803d",
        "--border": "#14532d",
        "--border-accent": "#22c55e",
        "--step-active": "#22c55e",
        "--step-plock": "#86efac",
        "--track-colors": "#22c55e,#4ade80,#86efac,#a3e635,#34d399,#10b981,#6ee7b7,#a7f3d0",
        "--glow": "0 0 8px #22c55e"
    },
    arctic: {
        name: "Arctic",
        "--bg": "#f1f5f9",
        "--bg-card": "#ffffffee",
        "--bg-control": "#e0f2fe",
        "--text": "#1e293b",
        "--text-muted": "#64748b",
        "--text-accent": "#0284c7",
        "--accent": "#0ea5e9",
        "--accent-dim": "#0369a1",
        "--border": "#bae6fd",
        "--border-accent": "#0ea5e9",
        "--step-active": "#0ea5e9",
        "--step-plock": "#8b5cf6",
        "--track-colors": "#0ea5e9,#6366f1,#8b5cf6,#14b8a6,#06b6d4,#f59e0b,#ec4899,#10b981",
        "--glow": "none"
    },
    neon: {
        name: "Neon",
        "--bg": "#000000",
        "--bg-card": "#09090b",
        "--bg-control": "#18181b",
        "--text": "#ffffff",
        "--text-muted": "#71717a",
        "--text-accent": "#a3e635",
        "--accent": "#a3e635",
        "--accent-dim": "#4d7c0f",
        "--border": "#27272a",
        "--border-accent": "#a3e635",
        "--step-active": "#a3e635",
        "--step-plock": "#f472b6",
        "--track-colors": "#a3e635,#f472b6,#22d3ee,#facc15,#fb7185,#818cf8,#34d399,#f97316",
        "--glow": "0 0 10px var(--accent)"
    }
};

export function applyTheme(name) {
    const theme = themes[name];
    if (!theme) return;

    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
        if (key.startsWith("--")) {
            root.style.setProperty(key, value);
        }
    });
    document.body.setAttribute("data-theme", name);
}

export function getTrackColors() {
    const str = getComputedStyle(document.documentElement).getPropertyValue("--track-colors").trim();
    return str.split(",").map(c => c.trim());
}
