/**
 * Palette — Module browser sidebar with search, category filter, and drag-to-canvas.
 */

const CATEGORIES = ["all", "engine", "fx", "modular", "makenoise", "elektron", "daemon", "organism"];
const CAT_LABELS = {
    all: "All", engine: "Engines", fx: "Effects", modular: "Modular",
    makenoise: "Make Noise", elektron: "Elektron", daemon: "Daemons", organism: "Organisms"
};

/**
 * Create the palette sidebar.
 * @param {HTMLElement} container - The sidebar container
 * @param {object} appState - The app state (state.modules, state.params)
 * @param {object} callbacks - { onAddModule(moduleName, x, y) }
 * @returns {{ render(), setCollapsed(bool) }}
 */
export function createPalette(container, appState, callbacks) {
    let filter = "all";
    let search = "";
    let collapsed = false;

    function render() {
        container.innerHTML = "";
        if (collapsed) {
            container.classList.add("collapsed");
            const expandBtn = document.createElement("button");
            expandBtn.className = "palette-expand-btn";
            expandBtn.textContent = "\u25B6";
            expandBtn.title = "Show palette";
            expandBtn.addEventListener("click", () => {
                collapsed = false;
                container.classList.remove("collapsed");
                render();
            });
            container.appendChild(expandBtn);
            return;
        }
        container.classList.remove("collapsed");

        // Header with collapse button
        const header = document.createElement("div");
        header.className = "palette-header";
        header.innerHTML = `<span class="palette-title">MODULES</span>`;
        const collapseBtn = document.createElement("button");
        collapseBtn.className = "palette-collapse-btn";
        collapseBtn.textContent = "\u25C0";
        collapseBtn.title = "Hide palette";
        collapseBtn.addEventListener("click", () => {
            collapsed = true;
            container.classList.add("collapsed");
            render();
        });
        header.appendChild(collapseBtn);
        container.appendChild(header);

        // Search input
        const searchInput = document.createElement("input");
        searchInput.className = "palette-search";
        searchInput.placeholder = "Search modules...";
        searchInput.value = search;
        searchInput.addEventListener("input", (e) => {
            search = e.target.value.toLowerCase();
            renderList();
        });
        container.appendChild(searchInput);

        // Category filters
        const catBar = document.createElement("div");
        catBar.className = "palette-categories";
        CATEGORIES.forEach(cat => {
            const btn = document.createElement("button");
            btn.className = `palette-cat-btn ${cat === filter ? "active" : ""}`;
            const count = cat === "all"
                ? Object.keys(appState.modules).length
                : Object.values(appState.modules).filter(m => m.category === cat).length;
            btn.textContent = `${CAT_LABELS[cat]} (${count})`;
            btn.addEventListener("click", () => {
                filter = cat;
                render();
            });
            catBar.appendChild(btn);
        });
        container.appendChild(catBar);

        // Module list
        const listEl = document.createElement("div");
        listEl.className = "palette-list";
        listEl.id = "palette-list";
        container.appendChild(listEl);
        renderList();
    }

    function renderList() {
        const listEl = container.querySelector("#palette-list");
        if (!listEl) return;
        listEl.innerHTML = "";

        const modules = Object.values(appState.modules)
            .filter(m => filter === "all" || m.category === filter)
            .filter(m => !search ||
                m.name.toLowerCase().includes(search) ||
                m.category.toLowerCase().includes(search) ||
                (m.description || "").toLowerCase().includes(search))
            .sort((a, b) => a.name.localeCompare(b.name));

        if (modules.length === 0) {
            listEl.innerHTML = `<div class="palette-empty">No modules found</div>`;
            return;
        }

        // Group by category
        const grouped = {};
        modules.forEach(m => {
            if (!grouped[m.category]) grouped[m.category] = [];
            grouped[m.category].push(m);
        });

        Object.entries(grouped).sort().forEach(([cat, mods]) => {
            const catHeader = document.createElement("div");
            catHeader.className = "palette-group-header";
            catHeader.textContent = (CAT_LABELS[cat] || cat).toUpperCase();
            listEl.appendChild(catHeader);

            mods.forEach(mod => {
                const item = document.createElement("div");
                item.className = "palette-item";
                item.draggable = true;
                item.dataset.module = mod.name;

                item.innerHTML = `
                    <span class="palette-item-name">${mod.name}</span>
                    <span class="palette-item-meta">${mod.numParams}p</span>
                `;

                // Double-click to add at viewport center
                item.addEventListener("dblclick", () => {
                    callbacks.onAddModule?.(mod.name);
                });

                // Drag start
                item.addEventListener("dragstart", (e) => {
                    e.dataTransfer.setData("text/plain", mod.name);
                    e.dataTransfer.effectAllowed = "copy";
                });

                listEl.appendChild(item);
            });
        });
    }

    function setCollapsed(val) {
        collapsed = val;
        if (collapsed) container.classList.add("collapsed");
        else container.classList.remove("collapsed");
        render();
    }

    return { render, setCollapsed };
}
