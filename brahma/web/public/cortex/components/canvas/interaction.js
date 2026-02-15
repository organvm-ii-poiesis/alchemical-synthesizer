/**
 * Interaction — Drag, pan, zoom, port-click, selection handlers.
 * Sets up all pointer and keyboard events for the canvas SVG.
 */

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.1;

/**
 * Convert screen (client) coordinates to world (canvas) coordinates.
 */
export function screenToWorld(clientX, clientY, svgRect, viewport) {
    return {
        x: (clientX - svgRect.left - viewport.panX) / viewport.zoom,
        y: (clientY - svgRect.top - viewport.panY) / viewport.zoom
    };
}

/**
 * Convert world coordinates to screen coordinates.
 */
export function worldToScreen(worldX, worldY, svgRect, viewport) {
    return {
        x: worldX * viewport.zoom + viewport.panX + svgRect.left,
        y: worldY * viewport.zoom + viewport.panY + svgRect.top
    };
}

/**
 * Set up all interaction handlers on the canvas.
 *
 * @param {SVGElement} svg - The root SVG element
 * @param {SVGGElement} canvasLayer - The <g> with pan/zoom transform
 * @param {object} canvasState - The canvas state object
 * @param {object} callbacks - Event callbacks:
 *   onNodeDrag(nodeId, x, y), onNodeDragEnd(nodeId, x, y),
 *   onPortDragStart(nodeId, portName, dir), onPortDragMove(x, y),
 *   onPortDragEnd(nodeId, portName, dir),
 *   onCableClick(connectionId), onCanvasClick(),
 *   onNodeClick(nodeId, shiftKey), onNodeDblClick(nodeId),
 *   onDelete(), onViewportChange(viewport),
 *   onRubberBandSelect(rect)
 */
export function setupInteraction(svg, canvasLayer, canvasState, callbacks) {
    let mode = "idle"; // idle | dragging-node | panning | connecting | rubber-band
    let dragTarget = null;
    let dragOffset = { x: 0, y: 0 };
    let panStart = { x: 0, y: 0 };
    let rubberBandStart = null;
    let rubberBandEl = null;

    /** Apply the current viewport transform to the canvas layer */
    function applyTransform() {
        const { panX, panY, zoom } = canvasState.viewport;
        canvasLayer.setAttribute("transform",
            `translate(${panX}, ${panY}) scale(${zoom})`);
    }

    // ─── Pointer down ───
    svg.addEventListener("pointerdown", (e) => {
        const svgRect = svg.getBoundingClientRect();
        const world = screenToWorld(e.clientX, e.clientY, svgRect, canvasState.viewport);

        // Middle mouse or Ctrl+left = pan
        if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey))) {
            mode = "panning";
            panStart = { x: e.clientX - canvasState.viewport.panX, y: e.clientY - canvasState.viewport.panY };
            svg.setPointerCapture(e.pointerId);
            svg.style.cursor = "grabbing";
            e.preventDefault();
            return;
        }

        // Check if clicking on a node header (for drag)
        const nodeEl = e.target.closest(".canvas-node");
        const isHeader = e.target.closest(".node-header") || e.target.closest(".node-title");
        const isPort = e.target.closest(".port");
        const isCable = e.target.closest(".cable-hit") || e.target.closest(".cable");
        const isClose = e.target.closest(".node-close");
        const isParam = e.target.closest(".node-params") || e.target.closest(".knob");

        // Don't interfere with knob interactions or close button
        if (isParam || isClose) return;

        // Port click — start connecting
        if (isPort) {
            // Handled by port's own event listener in node-renderer
            return;
        }

        // Cable click — select cable
        if (isCable) {
            const connId = parseInt(isCable.dataset.connectionId);
            if (!isNaN(connId)) {
                callbacks.onCableClick?.(connId, e.shiftKey);
            }
            e.preventDefault();
            return;
        }

        // Node header click — drag or select
        if (nodeEl && (isHeader || (!isPort && !isParam && !isClose))) {
            const nodeId = parseInt(nodeEl.dataset.nodeId);

            // Select the node
            callbacks.onNodeClick?.(nodeId, e.shiftKey);

            // Start drag
            mode = "dragging-node";
            dragTarget = nodeId;
            const node = canvasState.nodes[nodeId];
            if (node) {
                dragOffset = { x: world.x - node.x, y: world.y - node.y };
            }
            svg.setPointerCapture(e.pointerId);
            e.preventDefault();
            return;
        }

        // Empty canvas click — rubber band selection or deselect
        if (!nodeEl && !isCable) {
            if (e.shiftKey) {
                // Start rubber band
                mode = "rubber-band";
                rubberBandStart = world;
                rubberBandEl = createRubberBand(svg);
                e.preventDefault();
            } else {
                callbacks.onCanvasClick?.();
            }
            return;
        }
    });

    // ─── Pointer move ───
    svg.addEventListener("pointermove", (e) => {
        const svgRect = svg.getBoundingClientRect();
        const world = screenToWorld(e.clientX, e.clientY, svgRect, canvasState.viewport);

        if (mode === "dragging-node" && dragTarget != null) {
            callbacks.onNodeDrag?.(dragTarget, world.x - dragOffset.x, world.y - dragOffset.y);
        }

        if (mode === "panning") {
            canvasState.viewport.panX = e.clientX - panStart.x;
            canvasState.viewport.panY = e.clientY - panStart.y;
            applyTransform();
            callbacks.onViewportChange?.(canvasState.viewport);
        }

        if (mode === "connecting") {
            callbacks.onPortDragMove?.(world.x, world.y);
        }

        if (mode === "rubber-band" && rubberBandEl && rubberBandStart) {
            updateRubberBand(rubberBandEl, rubberBandStart, world, canvasState.viewport);
        }
    });

    // ─── Pointer up ───
    svg.addEventListener("pointerup", (e) => {
        if (mode === "dragging-node" && dragTarget != null) {
            const svgRect = svg.getBoundingClientRect();
            const world = screenToWorld(e.clientX, e.clientY, svgRect, canvasState.viewport);
            callbacks.onNodeDragEnd?.(dragTarget, world.x - dragOffset.x, world.y - dragOffset.y);
        }

        if (mode === "panning") {
            svg.style.cursor = "";
        }

        if (mode === "rubber-band" && rubberBandEl && rubberBandStart) {
            const svgRect = svg.getBoundingClientRect();
            const world = screenToWorld(e.clientX, e.clientY, svgRect, canvasState.viewport);
            const rect = {
                x: Math.min(rubberBandStart.x, world.x),
                y: Math.min(rubberBandStart.y, world.y),
                width: Math.abs(world.x - rubberBandStart.x),
                height: Math.abs(world.y - rubberBandStart.y)
            };
            callbacks.onRubberBandSelect?.(rect);
            rubberBandEl.remove();
            rubberBandEl = null;
        }

        mode = "idle";
        dragTarget = null;
        svg.releasePointerCapture(e.pointerId);
    });

    // ─── Double click ───
    svg.addEventListener("dblclick", (e) => {
        const nodeEl = e.target.closest(".canvas-node");
        if (nodeEl) {
            const isHeader = e.target.closest(".node-header") || e.target.closest(".node-title");
            if (isHeader) {
                const nodeId = parseInt(nodeEl.dataset.nodeId);
                callbacks.onNodeDblClick?.(nodeId);
            }
        }
    });

    // ─── Wheel — zoom ───
    svg.addEventListener("wheel", (e) => {
        e.preventDefault();
        const svgRect = svg.getBoundingClientRect();
        const mouseX = e.clientX - svgRect.left;
        const mouseY = e.clientY - svgRect.top;

        const oldZoom = canvasState.viewport.zoom;
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom + delta));

        // Zoom centered on cursor
        const ratio = newZoom / oldZoom;
        canvasState.viewport.panX = mouseX - ratio * (mouseX - canvasState.viewport.panX);
        canvasState.viewport.panY = mouseY - ratio * (mouseY - canvasState.viewport.panY);
        canvasState.viewport.zoom = newZoom;

        applyTransform();
        callbacks.onViewportChange?.(canvasState.viewport);
    }, { passive: false });

    // ─── Keyboard ───
    function handleKeyDown(e) {
        // Only handle when canvas view is visible
        const canvasView = document.getElementById("view-canvas");
        if (!canvasView || !canvasView.classList.contains("active")) return;

        if (e.key === "Delete" || e.key === "Backspace") {
            // Don't delete if focus is in an input
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
            callbacks.onDelete?.();
            e.preventDefault();
        }

        if (e.key === "Escape") {
            callbacks.onCanvasClick?.(); // cancel / deselect
        }
    }
    document.addEventListener("keydown", handleKeyDown);

    // Public API for starting a connection from a port
    function startConnecting(nodeId, portName, dir) {
        mode = "connecting";
        callbacks.onPortDragStart?.(nodeId, portName, dir);
    }

    function endConnecting(nodeId, portName, dir) {
        if (mode === "connecting") {
            callbacks.onPortDragEnd?.(nodeId, portName, dir);
            mode = "idle";
        }
    }

    function cancelConnecting() {
        mode = "idle";
    }

    // Return control object
    return {
        applyTransform,
        startConnecting,
        endConnecting,
        cancelConnecting,
        isConnecting: () => mode === "connecting",
        destroy: () => {
            document.removeEventListener("keydown", handleKeyDown);
        }
    };
}

/** Create the rubber-band selection rectangle */
function createRubberBand(svg) {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("class", "rubber-band");
    rect.setAttribute("fill", "rgba(6, 182, 212, 0.1)");
    rect.setAttribute("stroke", "#06b6d4");
    rect.setAttribute("stroke-width", "1");
    rect.setAttribute("stroke-dasharray", "4 2");
    svg.appendChild(rect);
    return rect;
}

/** Update rubber-band dimensions */
function updateRubberBand(rect, start, end, viewport) {
    const x = Math.min(start.x, end.x) * viewport.zoom + viewport.panX;
    const y = Math.min(start.y, end.y) * viewport.zoom + viewport.panY;
    const w = Math.abs(end.x - start.x) * viewport.zoom;
    const h = Math.abs(end.y - start.y) * viewport.zoom;
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", w);
    rect.setAttribute("height", h);
}
