/**
 * Cable Renderer — SVG Bezier cable paths with glow effects.
 * Max/MSP-style S-curves connecting output ports to input ports.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

/** Category -> cable color map */
const CATEGORY_COLORS = {
    engine:    "#06b6d4",
    fx:        "#a855f7",
    modular:   "#22c55e",
    makenoise: "#f97316",
    elektron:  "#f43f5e",
    daemon:    "#eab308",
    organism:  "#ec4899"
};

/** Compute a cubic Bezier path (Max/MSP-style horizontal S-curve) */
export function computeBezierPath(x1, y1, x2, y2) {
    const tension = Math.max(Math.abs(x2 - x1) * 0.4, 60);
    return `M ${x1} ${y1} C ${x1 + tension} ${y1}, ${x2 - tension} ${y2}, ${x2} ${y2}`;
}

/** Add the glow filter definition to an SVG <defs> element */
export function addCableGlowFilter(defs) {
    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", "cable-glow");
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");

    const blur = document.createElementNS(SVG_NS, "feGaussianBlur");
    blur.setAttribute("in", "SourceGraphic");
    blur.setAttribute("stdDeviation", "3");
    blur.setAttribute("result", "blur");

    const merge = document.createElementNS(SVG_NS, "feMerge");
    const mergeBlur = document.createElementNS(SVG_NS, "feMergeNode");
    mergeBlur.setAttribute("in", "blur");
    const mergeOrig = document.createElementNS(SVG_NS, "feMergeNode");
    mergeOrig.setAttribute("in", "SourceGraphic");
    merge.append(mergeBlur, mergeOrig);

    filter.append(blur, merge);
    defs.appendChild(filter);
}

/** Create an SVG path element for a cable connection */
export function createCableElement(connection, x1, y1, x2, y2, sourceCategory) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", computeBezierPath(x1, y1, x2, y2));
    path.setAttribute("class", "cable");
    path.dataset.connectionId = connection.id;

    const color = CATEGORY_COLORS[sourceCategory] || "#a1a1aa";
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", "2.5");
    path.setAttribute("stroke-opacity", "0.7");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");

    // Wider invisible hit area for easier clicking
    const hitArea = document.createElementNS(SVG_NS, "path");
    hitArea.setAttribute("d", computeBezierPath(x1, y1, x2, y2));
    hitArea.setAttribute("class", "cable-hit");
    hitArea.dataset.connectionId = connection.id;
    hitArea.setAttribute("stroke", "transparent");
    hitArea.setAttribute("stroke-width", "12");
    hitArea.setAttribute("fill", "none");
    hitArea.style.cursor = "pointer";

    const group = document.createElementNS(SVG_NS, "g");
    group.dataset.connectionId = connection.id;
    group.append(path, hitArea);
    return group;
}

/** Update position of an existing cable element */
export function updateCablePosition(cableGroup, x1, y1, x2, y2) {
    const d = computeBezierPath(x1, y1, x2, y2);
    const paths = cableGroup.querySelectorAll("path");
    paths.forEach(p => p.setAttribute("d", d));
}

/** Set cable selected state (adds glow filter) */
export function setCableSelected(cableGroup, selected) {
    const path = cableGroup.querySelector(".cable");
    if (!path) return;
    if (selected) {
        path.setAttribute("filter", "url(#cable-glow)");
        path.setAttribute("stroke-width", "3.5");
        path.setAttribute("stroke-opacity", "1");
    } else {
        path.removeAttribute("filter");
        path.setAttribute("stroke-width", "2.5");
        path.setAttribute("stroke-opacity", "0.7");
    }
}

/** Create a preview cable (dashed, animated) for drag-to-connect */
export function createPreviewCable() {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", "cable-preview");
    path.setAttribute("stroke", "#a1a1aa");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-opacity", "0.5");
    path.setAttribute("stroke-dasharray", "8 4");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");
    return path;
}

/** Update the preview cable position */
export function updatePreviewCable(previewPath, x1, y1, x2, y2, color) {
    previewPath.setAttribute("d", computeBezierPath(x1, y1, x2, y2));
    if (color) previewPath.setAttribute("stroke", color);
}

/** Get the category color for a given category */
export function getCategoryColor(category) {
    return CATEGORY_COLORS[category] || "#a1a1aa";
}
