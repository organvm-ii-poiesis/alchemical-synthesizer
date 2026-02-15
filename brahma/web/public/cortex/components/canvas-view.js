/**
 * CanvasView — Orchestrator for the visual patching canvas.
 * Wires together state, renderers, interaction, and palette.
 * Manages OSC communication for module create/free/set/connect/disconnect.
 */

import {
    createCanvasState, addNode, removeNode, moveNode,
    addConnection, removeConnection, setNodeParam,
    toggleCollapsed, selectNode, selectCable,
    clearSelection, deleteSelected, getNodeConnections,
    snapToGrid
} from "./canvas/state.js";

import {
    createNodeElement, updateNodePosition, getPortCenter,
    setNodeSelected
} from "./canvas/node-renderer.js";

import {
    addCableGlowFilter, createCableElement, updateCablePosition,
    setCableSelected, createPreviewCable, updatePreviewCable,
    getCategoryColor
} from "./canvas/cable-renderer.js";

import {
    setupInteraction, screenToWorld
} from "./canvas/interaction.js";

import { createPalette } from "./canvas/palette.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export class CanvasView {
    constructor(container, appState, osc) {
        this.el = container;
        this.appState = appState;
        this.osc = osc;

        this.canvasState = createCanvasState();
        this.nodeElements = {};   // nodeId -> { group, knobs, portElements }
        this.cableElements = {};  // connectionId -> <g> element
        this.previewCable = null;
        this.connectingFrom = null; // { nodeId, portName, dir }
        this.interaction = null;
        this.palette = null;
        this.built = false;

        // SVG elements
        this.svg = null;
        this.canvasLayer = null;
        this.cablesLayer = null;
        this.nodesLayer = null;
    }

    /** Build the DOM structure (once) */
    build() {
        if (this.built) return;
        this.built = true;

        this.el.innerHTML = "";

        // Layout: palette | workspace
        const layout = document.createElement("div");
        layout.className = "canvas-layout";

        // Palette sidebar
        const paletteEl = document.createElement("div");
        paletteEl.className = "canvas-palette";
        this.palette = createPalette(paletteEl, this.appState, {
            onAddModule: (moduleName) => this.handleAddModule(moduleName)
        });

        // Workspace
        const workspace = document.createElement("div");
        workspace.className = "canvas-workspace";

        // Toolbar
        const toolbar = this.buildToolbar();
        workspace.appendChild(toolbar);

        // SVG canvas
        this.svg = document.createElementNS(SVG_NS, "svg");
        this.svg.setAttribute("class", "canvas-svg");
        this.svg.setAttribute("width", "100%");
        this.svg.setAttribute("height", "100%");

        // Defs (filters)
        const defs = document.createElementNS(SVG_NS, "defs");
        addCableGlowFilter(defs);
        // Dot grid pattern
        const pattern = document.createElementNS(SVG_NS, "pattern");
        pattern.setAttribute("id", "dot-grid");
        pattern.setAttribute("width", "20");
        pattern.setAttribute("height", "20");
        pattern.setAttribute("patternUnits", "userSpaceOnUse");
        const dot = document.createElementNS(SVG_NS, "circle");
        dot.setAttribute("cx", "10");
        dot.setAttribute("cy", "10");
        dot.setAttribute("r", "1");
        dot.setAttribute("fill", "var(--border)");
        pattern.appendChild(dot);
        defs.appendChild(pattern);
        this.svg.appendChild(defs);

        // Background with dot grid
        const bgRect = document.createElementNS(SVG_NS, "rect");
        bgRect.setAttribute("width", "10000");
        bgRect.setAttribute("height", "10000");
        bgRect.setAttribute("x", "-5000");
        bgRect.setAttribute("y", "-5000");
        bgRect.setAttribute("fill", "url(#dot-grid)");
        bgRect.setAttribute("class", "canvas-bg");

        // Canvas layer (pan/zoom)
        this.canvasLayer = document.createElementNS(SVG_NS, "g");
        this.canvasLayer.setAttribute("class", "canvas-layer");
        this.canvasLayer.appendChild(bgRect);

        // Cables layer
        this.cablesLayer = document.createElementNS(SVG_NS, "g");
        this.cablesLayer.setAttribute("class", "cables-layer");
        this.canvasLayer.appendChild(this.cablesLayer);

        // Nodes layer
        this.nodesLayer = document.createElementNS(SVG_NS, "g");
        this.nodesLayer.setAttribute("class", "nodes-layer");
        this.canvasLayer.appendChild(this.nodesLayer);

        this.svg.appendChild(this.canvasLayer);
        workspace.appendChild(this.svg);

        // Handle drop from palette
        this.svg.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
        });
        this.svg.addEventListener("drop", (e) => {
            e.preventDefault();
            const moduleName = e.dataTransfer.getData("text/plain");
            if (moduleName && this.appState.modules[moduleName]) {
                const svgRect = this.svg.getBoundingClientRect();
                const world = screenToWorld(
                    e.clientX, e.clientY, svgRect, this.canvasState.viewport
                );
                this.handleAddModule(moduleName, world.x - 100, world.y - 50);
            }
        });

        layout.append(paletteEl, workspace);
        this.el.appendChild(layout);

        // Set up interaction
        this.interaction = setupInteraction(this.svg, this.canvasLayer, this.canvasState, {
            onNodeDrag: (id, x, y) => this.handleNodeDrag(id, x, y),
            onNodeDragEnd: (id, x, y) => this.handleNodeDragEnd(id, x, y),
            onPortDragStart: (nodeId, portName, dir) => {},
            onPortDragMove: (x, y) => this.handlePortDragMove(x, y),
            onPortDragEnd: (nodeId, portName, dir) => this.handlePortDragEnd(nodeId, portName, dir),
            onCableClick: (id, shift) => this.handleCableClick(id, shift),
            onCanvasClick: () => this.handleCanvasClick(),
            onNodeClick: (id, shift) => this.handleNodeClick(id, shift),
            onNodeDblClick: (id) => this.handleNodeDblClick(id),
            onDelete: () => this.handleDelete(),
            onViewportChange: () => this.updateToolbarInfo(),
            onRubberBandSelect: (rect) => this.handleRubberBandSelect(rect)
        });

        this.interaction.applyTransform();
    }

    /** Build the toolbar */
    buildToolbar() {
        const toolbar = document.createElement("div");
        toolbar.className = "canvas-toolbar";

        // Zoom controls
        const zoomOut = document.createElement("button");
        zoomOut.className = "toolbar-btn";
        zoomOut.textContent = "\u2212";
        zoomOut.title = "Zoom out";
        zoomOut.addEventListener("click", () => {
            this.canvasState.viewport.zoom = Math.max(0.25, this.canvasState.viewport.zoom - 0.1);
            this.interaction.applyTransform();
            this.updateToolbarInfo();
        });

        this.zoomLabel = document.createElement("span");
        this.zoomLabel.className = "toolbar-label";
        this.zoomLabel.textContent = "100%";

        const zoomIn = document.createElement("button");
        zoomIn.className = "toolbar-btn";
        zoomIn.textContent = "+";
        zoomIn.title = "Zoom in";
        zoomIn.addEventListener("click", () => {
            this.canvasState.viewport.zoom = Math.min(3.0, this.canvasState.viewport.zoom + 0.1);
            this.interaction.applyTransform();
            this.updateToolbarInfo();
        });

        const fitBtn = document.createElement("button");
        fitBtn.className = "toolbar-btn";
        fitBtn.textContent = "Fit";
        fitBtn.title = "Fit all nodes in view";
        fitBtn.addEventListener("click", () => this.fitToView());

        const sep = document.createElement("span");
        sep.className = "toolbar-sep";

        this.nodeCountLabel = document.createElement("span");
        this.nodeCountLabel.className = "toolbar-label";
        this.nodeCountLabel.textContent = "0 nodes";

        this.cableCountLabel = document.createElement("span");
        this.cableCountLabel.className = "toolbar-label toolbar-label-muted";
        this.cableCountLabel.textContent = "0 cables";

        toolbar.append(zoomOut, this.zoomLabel, zoomIn, fitBtn, sep, this.nodeCountLabel, this.cableCountLabel);
        return toolbar;
    }

    /** Update toolbar info labels */
    updateToolbarInfo() {
        if (this.zoomLabel) {
            this.zoomLabel.textContent = `${Math.round(this.canvasState.viewport.zoom * 100)}%`;
        }
        if (this.nodeCountLabel) {
            this.nodeCountLabel.textContent = `${Object.keys(this.canvasState.nodes).length} nodes`;
        }
        if (this.cableCountLabel) {
            this.cableCountLabel.textContent = `${this.canvasState.connections.length} cables`;
        }
    }

    /** Render (called when view becomes visible) */
    render() {
        this.build();
        this.palette?.render();
        this.updateToolbarInfo();
    }

    // ════════════════════════════════════════
    // Module lifecycle
    // ════════════════════════════════════════

    /** Add a module to the canvas */
    handleAddModule(moduleName, x, y) {
        const mod = this.appState.modules[moduleName];
        if (!mod) return;

        // Get params from app state
        const params = (this.appState.params[moduleName] || []).map(p => ({
            name: p.name,
            value: p.default,
            min: p.min,
            max: p.max,
            units: p.units
        }));

        // If we don't have params cached, request them
        if (params.length === 0 && mod.numParams > 0) {
            this.osc.send("/brahma/modules/params", moduleName);
        }

        // Default position: viewport center
        if (x == null || y == null) {
            const svgRect = this.svg.getBoundingClientRect();
            const center = screenToWorld(
                svgRect.left + svgRect.width / 2,
                svgRect.top + svgRect.height / 2,
                svgRect,
                this.canvasState.viewport
            );
            x = center.x - 100;
            y = center.y - 50;
        }

        const snapped = snapToGrid(x, y);
        const node = addNode(this.canvasState, {
            moduleName,
            x: snapped.x,
            y: snapped.y,
            params,
            category: mod.category
        });

        // Create instance in SC via OSC
        this.osc.send("/brahma/module/create", moduleName, node.instanceName, 0);

        // Render the node
        this.renderNode(node);
        this.updateToolbarInfo();
    }

    /** Render a single node into the SVG */
    renderNode(node) {
        const { group, knobs, portElements, height } = createNodeElement(node, {
            onClose: (id) => this.handleDeleteNode(id),
            onPortClick: (nodeId, portName, dir, e) => this.handlePortClick(nodeId, portName, dir, e),
            onParamChange: (nodeId, paramName, value) => this.handleParamChange(nodeId, paramName, value)
        });

        node.height = height;
        this.nodesLayer.appendChild(group);
        this.nodeElements[node.id] = { group, knobs, portElements };
    }

    /** Delete a specific node */
    handleDeleteNode(nodeId) {
        const node = this.canvasState.nodes[nodeId];
        if (!node) return;

        // Remove cables visually
        const cables = getNodeConnections(this.canvasState, nodeId);
        cables.forEach(c => {
            if (this.cableElements[c.id]) {
                this.cableElements[c.id].remove();
                delete this.cableElements[c.id];
            }
            // Send disconnect OSC
            const srcNode = this.canvasState.nodes[c.sourceNodeId];
            const dstNode = this.canvasState.nodes[c.destNodeId];
            if (srcNode && dstNode) {
                this.osc.send("/brahma/patch/disconnect",
                    `${srcNode.instanceName}_out`,
                    `${dstNode.instanceName}_${c.destPort}`);
            }
        });

        // Free in SC
        this.osc.send("/brahma/module/free", node.moduleName, node.instanceName);

        // Remove from state
        removeNode(this.canvasState, nodeId);

        // Remove from DOM
        if (this.nodeElements[nodeId]) {
            this.nodeElements[nodeId].group.remove();
            delete this.nodeElements[nodeId];
        }

        this.updateToolbarInfo();
    }

    // ════════════════════════════════════════
    // Node interaction
    // ════════════════════════════════════════

    handleNodeClick(nodeId, shiftKey) {
        selectNode(this.canvasState, nodeId, shiftKey);
        this.updateSelectionVisuals();
    }

    handleNodeDrag(nodeId, x, y) {
        const snapped = snapToGrid(x, y);
        moveNode(this.canvasState, nodeId, snapped.x, snapped.y);
        const el = this.nodeElements[nodeId];
        if (el) updateNodePosition(el.group, snapped.x, snapped.y);
        // Update connected cables
        this.updateNodeCables(nodeId);
    }

    handleNodeDragEnd(nodeId, x, y) {
        const snapped = snapToGrid(x, y);
        moveNode(this.canvasState, nodeId, snapped.x, snapped.y);
        const el = this.nodeElements[nodeId];
        if (el) updateNodePosition(el.group, snapped.x, snapped.y);
        this.updateNodeCables(nodeId);
    }

    handleNodeDblClick(nodeId) {
        toggleCollapsed(this.canvasState, nodeId);
        // Re-render the node
        const node = this.canvasState.nodes[nodeId];
        if (!node) return;

        // Remove old element
        if (this.nodeElements[nodeId]) {
            this.nodeElements[nodeId].group.remove();
            delete this.nodeElements[nodeId];
        }

        // Re-create
        this.renderNode(node);
        this.updateNodeCables(nodeId);
    }

    handleCanvasClick() {
        clearSelection(this.canvasState);
        this.updateSelectionVisuals();
        this.cancelConnecting();
    }

    handleRubberBandSelect(rect) {
        // Select all nodes within the rectangle
        Object.values(this.canvasState.nodes).forEach(node => {
            if (node.x + node.width > rect.x && node.x < rect.x + rect.width &&
                node.y + node.height > rect.y && node.y < rect.y + rect.height) {
                this.canvasState.selection.nodes.add(node.id);
            }
        });
        this.updateSelectionVisuals();
    }

    // ════════════════════════════════════════
    // Param changes
    // ════════════════════════════════════════

    handleParamChange(nodeId, paramName, value) {
        setNodeParam(this.canvasState, nodeId, paramName, value);
        const node = this.canvasState.nodes[nodeId];
        if (node) {
            this.osc.send("/brahma/module/set",
                node.moduleName, node.instanceName, paramName, value);
        }
    }

    // ════════════════════════════════════════
    // Port / Cable connection
    // ════════════════════════════════════════

    handlePortClick(nodeId, portName, dir, e) {
        if (this.connectingFrom) {
            // Complete the connection
            this.completeConnection(nodeId, portName, dir);
        } else {
            // Start a new connection
            this.startConnecting(nodeId, portName, dir);
        }
    }

    startConnecting(nodeId, portName, dir) {
        this.connectingFrom = { nodeId, portName, dir };

        // Create preview cable
        const node = this.canvasState.nodes[nodeId];
        const el = this.nodeElements[nodeId];
        if (!node || !el) return;

        const portPos = getPortCenter(node, portName, dir, el.portElements);
        this.previewCable = createPreviewCable();
        this.cablesLayer.appendChild(this.previewCable);

        // Store start position for preview
        this._previewStart = portPos;

        // Highlight valid targets
        this.highlightValidTargets(dir);

        this.interaction?.startConnecting(nodeId, portName, dir);
    }

    handlePortDragMove(worldX, worldY) {
        if (this.previewCable && this._previewStart) {
            const from = this._previewStart;
            const color = this.connectingFrom
                ? getCategoryColor(this.canvasState.nodes[this.connectingFrom.nodeId]?.category)
                : null;
            updatePreviewCable(this.previewCable, from.x, from.y, worldX, worldY, color);
        }
    }

    handlePortDragEnd(nodeId, portName, dir) {
        this.completeConnection(nodeId, portName, dir);
    }

    completeConnection(targetNodeId, targetPortName, targetDir) {
        if (!this.connectingFrom) return;

        const from = this.connectingFrom;

        // Validate: output -> input only
        let sourceNodeId, sourcePort, destNodeId, destPort;
        if (from.dir === "output" && targetDir === "input") {
            sourceNodeId = from.nodeId;
            sourcePort = from.portName;
            destNodeId = targetNodeId;
            destPort = targetPortName;
        } else if (from.dir === "input" && targetDir === "output") {
            sourceNodeId = targetNodeId;
            sourcePort = targetPortName;
            destNodeId = from.nodeId;
            destPort = from.portName;
        } else {
            // Invalid connection direction
            this.cancelConnecting();
            return;
        }

        // Add to state
        const conn = addConnection(this.canvasState, {
            sourceNodeId, sourcePort, destNodeId, destPort, amount: 1.0
        });

        if (conn) {
            // Remove any existing cable for replaced connection
            Object.keys(this.cableElements).forEach(id => {
                if (!this.canvasState.connections.find(c => c.id === parseInt(id))) {
                    this.cableElements[id].remove();
                    delete this.cableElements[id];
                }
            });

            // Render the cable
            this.renderCable(conn);

            // Send OSC
            const srcNode = this.canvasState.nodes[sourceNodeId];
            const dstNode = this.canvasState.nodes[destNodeId];
            if (srcNode && dstNode) {
                this.osc.send("/brahma/patch/connect",
                    `${srcNode.instanceName}_out`,
                    `${dstNode.instanceName}_${destPort}`,
                    conn.amount);
            }
        }

        this.cancelConnecting();
        this.updateToolbarInfo();
    }

    cancelConnecting() {
        if (this.previewCable) {
            this.previewCable.remove();
            this.previewCable = null;
        }
        this.connectingFrom = null;
        this._previewStart = null;
        this.clearPortHighlights();
        this.interaction?.cancelConnecting();
    }

    highlightValidTargets(fromDir) {
        const targetDir = fromDir === "output" ? "input" : "output";
        this.svg.querySelectorAll(`.port-${targetDir} .port-circle`).forEach(circle => {
            circle.classList.add("port-valid-target");
        });
    }

    clearPortHighlights() {
        this.svg.querySelectorAll(".port-valid-target").forEach(el => {
            el.classList.remove("port-valid-target");
        });
    }

    // ════════════════════════════════════════
    // Cable rendering
    // ════════════════════════════════════════

    renderCable(conn) {
        const srcNode = this.canvasState.nodes[conn.sourceNodeId];
        const dstNode = this.canvasState.nodes[conn.destNodeId];
        const srcEl = this.nodeElements[conn.sourceNodeId];
        const dstEl = this.nodeElements[conn.destNodeId];
        if (!srcNode || !dstNode || !srcEl || !dstEl) return;

        const p1 = getPortCenter(srcNode, conn.sourcePort, "output", srcEl.portElements);
        const p2 = getPortCenter(dstNode, conn.destPort, "input", dstEl.portElements);

        const cableG = createCableElement(conn, p1.x, p1.y, p2.x, p2.y, srcNode.category);

        // Click handler on the cable hit area
        cableG.addEventListener("pointerdown", (e) => {
            e.stopPropagation();
            this.handleCableClick(conn.id, e.shiftKey);
        });

        this.cablesLayer.appendChild(cableG);
        this.cableElements[conn.id] = cableG;
    }

    /** Update all cables connected to a node */
    updateNodeCables(nodeId) {
        const cables = getNodeConnections(this.canvasState, nodeId);
        cables.forEach(conn => {
            const cableG = this.cableElements[conn.id];
            if (!cableG) return;

            const srcNode = this.canvasState.nodes[conn.sourceNodeId];
            const dstNode = this.canvasState.nodes[conn.destNodeId];
            const srcEl = this.nodeElements[conn.sourceNodeId];
            const dstEl = this.nodeElements[conn.destNodeId];
            if (!srcNode || !dstNode || !srcEl || !dstEl) return;

            const p1 = getPortCenter(srcNode, conn.sourcePort, "output", srcEl.portElements);
            const p2 = getPortCenter(dstNode, conn.destPort, "input", dstEl.portElements);
            updateCablePosition(cableG, p1.x, p1.y, p2.x, p2.y);
        });
    }

    // ════════════════════════════════════════
    // Cable selection
    // ════════════════════════════════════════

    handleCableClick(connectionId, shiftKey) {
        selectCable(this.canvasState, connectionId, shiftKey);
        this.updateSelectionVisuals();
    }

    // ════════════════════════════════════════
    // Selection visuals
    // ════════════════════════════════════════

    updateSelectionVisuals() {
        // Nodes
        Object.entries(this.nodeElements).forEach(([id, el]) => {
            setNodeSelected(el.group, this.canvasState.selection.nodes.has(parseInt(id)));
        });

        // Cables
        Object.entries(this.cableElements).forEach(([id, el]) => {
            setCableSelected(el, this.canvasState.selection.cables.has(parseInt(id)));
        });
    }

    // ════════════════════════════════════════
    // Delete
    // ════════════════════════════════════════

    handleDelete() {
        const { deletedNodes, deletedConnections } = deleteSelected(this.canvasState);

        // Send OSC for deleted connections
        const seenConns = new Set();
        deletedConnections.forEach(c => {
            if (seenConns.has(c.id)) return;
            seenConns.add(c.id);
            const srcNode = this.canvasState.nodes[c.sourceNodeId];
            const dstNode = this.canvasState.nodes[c.destNodeId];
            // Only send disconnect if both nodes still existed when cable was removed
            // (node removal already handled its own cables)
            if (srcNode && dstNode) {
                this.osc.send("/brahma/patch/disconnect",
                    `${srcNode.instanceName}_out`,
                    `${dstNode.instanceName}_${c.destPort}`);
            }
            if (this.cableElements[c.id]) {
                this.cableElements[c.id].remove();
                delete this.cableElements[c.id];
            }
        });

        // Send OSC for deleted nodes
        deletedNodes.forEach(node => {
            this.osc.send("/brahma/module/free", node.moduleName, node.instanceName);
            if (this.nodeElements[node.id]) {
                this.nodeElements[node.id].group.remove();
                delete this.nodeElements[node.id];
            }
        });

        this.updateToolbarInfo();
    }

    // ════════════════════════════════════════
    // Fit to view
    // ════════════════════════════════════════

    fitToView() {
        const nodes = Object.values(this.canvasState.nodes);
        if (nodes.length === 0) {
            this.canvasState.viewport = { panX: 0, panY: 0, zoom: 1 };
            this.interaction?.applyTransform();
            this.updateToolbarInfo();
            return;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(n => {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + n.width);
            maxY = Math.max(maxY, n.y + n.height);
        });

        const svgRect = this.svg.getBoundingClientRect();
        const padding = 60;
        const contentW = maxX - minX + padding * 2;
        const contentH = maxY - minY + padding * 2;
        const zoom = Math.min(
            svgRect.width / contentW,
            svgRect.height / contentH,
            2.0
        );

        this.canvasState.viewport.zoom = Math.max(0.25, zoom);
        this.canvasState.viewport.panX = (svgRect.width - contentW * zoom) / 2 - (minX - padding) * zoom;
        this.canvasState.viewport.panY = (svgRect.height - contentH * zoom) / 2 - (minY - padding) * zoom;

        this.interaction?.applyTransform();
        this.updateToolbarInfo();
    }

    // ════════════════════════════════════════
    // External: params loaded callback
    // ════════════════════════════════════════

    /** Called when params are loaded for a module — update any nodes of that module type */
    onParamsLoaded(moduleName) {
        const params = this.appState.params[moduleName] || [];
        if (params.length === 0) return;

        Object.values(this.canvasState.nodes)
            .filter(n => n.moduleName === moduleName && n.params.length === 0)
            .forEach(node => {
                node.params = params.map(p => ({
                    name: p.name,
                    value: p.default,
                    min: p.min,
                    max: p.max,
                    units: p.units
                }));

                // Re-render node
                if (this.nodeElements[node.id]) {
                    this.nodeElements[node.id].group.remove();
                    delete this.nodeElements[node.id];
                }
                this.renderNode(node);
                this.updateNodeCables(node.id);
            });
    }

    /** Cleanup on view destroy */
    destroy() {
        this.interaction?.destroy();
    }
}
