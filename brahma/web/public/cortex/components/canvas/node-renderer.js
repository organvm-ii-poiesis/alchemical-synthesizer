/**
 * Node Renderer — SVG node creation with ports and embedded knobs.
 * Each module instance is an SVG <g> with foreignObject for HTML knobs.
 */

import { createKnob } from "../../../golem/ui/knob.js";
import { getCategoryColor } from "./cable-renderer.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const HEADER_HEIGHT = 32;
const PORT_SPACING = 24;
const PORT_RADIUS = 6;
const NODE_WIDTH = 200;
const PARAM_ROW_HEIGHT = 56;
const COLLAPSED_HEIGHT = HEADER_HEIGHT;
const PORT_SECTION_PAD = 8;

/** Category -> header color */
const CATEGORY_COLORS = {
    engine:    "#06b6d4",
    fx:        "#a855f7",
    modular:   "#22c55e",
    makenoise: "#f97316",
    elektron:  "#f43f5e",
    daemon:    "#eab308",
    organism:  "#ec4899"
};

/**
 * Build the list of input and output ports for a node.
 * Inputs: inBus + every modulatable param
 * Outputs: outBus
 */
function buildPorts(node) {
    const inputs = [{ name: "inBus", type: "audio" }];
    if (!node.collapsed) {
        node.params.forEach(p => {
            inputs.push({ name: p.name, type: "control" });
        });
    }
    const outputs = [{ name: "outBus", type: "audio" }];
    return { inputs, outputs };
}

/** Calculate node height based on content */
function computeNodeHeight(node) {
    if (node.collapsed) return COLLAPSED_HEIGHT;
    const { inputs, outputs } = buildPorts(node);
    const portCount = Math.max(inputs.length, outputs.length);
    const portSectionHeight = portCount * PORT_SPACING + PORT_SECTION_PAD;
    const paramSectionHeight = node.params.length > 0
        ? Math.ceil(node.params.length / 2) * PARAM_ROW_HEIGHT + 8
        : 0;
    return HEADER_HEIGHT + portSectionHeight + paramSectionHeight + 8;
}

/**
 * Create an SVG group element representing a canvas node.
 * Returns { group, knobs, portElements }
 */
export function createNodeElement(node, callbacks) {
    const height = computeNodeHeight(node);
    node.height = height;
    node.width = NODE_WIDTH;

    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "canvas-node");
    g.setAttribute("transform", `translate(${node.x}, ${node.y})`);
    g.dataset.nodeId = node.id;

    const catColor = CATEGORY_COLORS[node.category] || "#a1a1aa";

    // Background rect
    const bg = document.createElementNS(SVG_NS, "rect");
    bg.setAttribute("width", NODE_WIDTH);
    bg.setAttribute("height", height);
    bg.setAttribute("rx", "6");
    bg.setAttribute("class", "node-bg");
    g.appendChild(bg);

    // Category color stripe (top border)
    const stripe = document.createElementNS(SVG_NS, "rect");
    stripe.setAttribute("width", NODE_WIDTH);
    stripe.setAttribute("height", "3");
    stripe.setAttribute("rx", "6");
    stripe.setAttribute("fill", catColor);
    g.appendChild(stripe);

    // Header background
    const headerBg = document.createElementNS(SVG_NS, "rect");
    headerBg.setAttribute("y", "3");
    headerBg.setAttribute("width", NODE_WIDTH);
    headerBg.setAttribute("height", HEADER_HEIGHT - 3);
    headerBg.setAttribute("class", "node-header");
    g.appendChild(headerBg);

    // Module name text
    const title = document.createElementNS(SVG_NS, "text");
    title.setAttribute("x", "10");
    title.setAttribute("y", "22");
    title.setAttribute("class", "node-title");
    title.textContent = node.moduleName.toUpperCase();
    g.appendChild(title);

    // Close button
    const closeG = document.createElementNS(SVG_NS, "g");
    closeG.setAttribute("class", "node-close");
    closeG.setAttribute("transform", `translate(${NODE_WIDTH - 22}, 8)`);
    closeG.style.cursor = "pointer";
    const closeRect = document.createElementNS(SVG_NS, "rect");
    closeRect.setAttribute("width", "16");
    closeRect.setAttribute("height", "16");
    closeRect.setAttribute("rx", "3");
    closeRect.setAttribute("fill", "transparent");
    const closeX = document.createElementNS(SVG_NS, "text");
    closeX.setAttribute("x", "4");
    closeX.setAttribute("y", "13");
    closeX.setAttribute("class", "node-close-text");
    closeX.textContent = "\u00D7";
    closeG.append(closeRect, closeX);
    closeG.addEventListener("click", (e) => {
        e.stopPropagation();
        callbacks.onClose?.(node.id);
    });
    g.appendChild(closeG);

    // Ports and params (only if not collapsed)
    const portElements = { inputs: {}, outputs: {} };
    const knobs = {};

    if (!node.collapsed) {
        const { inputs, outputs } = buildPorts(node);
        let portY = HEADER_HEIGHT + PORT_SECTION_PAD + PORT_RADIUS;

        // Input ports (left edge)
        inputs.forEach((port, i) => {
            const py = portY + i * PORT_SPACING;
            const portG = createPort(0, py, port.name, "input", catColor);
            portG.dataset.nodeId = node.id;
            portG.dataset.portName = port.name;
            portG.dataset.portDir = "input";
            portG.addEventListener("pointerdown", (e) => {
                e.stopPropagation();
                callbacks.onPortClick?.(node.id, port.name, "input", e);
            });
            g.appendChild(portG);
            portElements.inputs[port.name] = { x: 0, y: py };
        });

        // Output ports (right edge)
        outputs.forEach((port, i) => {
            const py = portY + i * PORT_SPACING;
            const portG = createPort(NODE_WIDTH, py, port.name, "output", catColor);
            portG.dataset.nodeId = node.id;
            portG.dataset.portName = port.name;
            portG.dataset.portDir = "output";
            portG.addEventListener("pointerdown", (e) => {
                e.stopPropagation();
                callbacks.onPortClick?.(node.id, port.name, "output", e);
            });
            g.appendChild(portG);
            portElements.outputs[port.name] = { x: NODE_WIDTH, y: py };
        });

        // Param knobs via foreignObject
        if (node.params.length > 0) {
            const paramStartY = HEADER_HEIGHT + PORT_SECTION_PAD +
                Math.max(inputs.length, outputs.length) * PORT_SPACING + 8;
            const fo = document.createElementNS(SVG_NS, "foreignObject");
            fo.setAttribute("x", "8");
            fo.setAttribute("y", paramStartY);
            fo.setAttribute("width", NODE_WIDTH - 16);
            fo.setAttribute("height", height - paramStartY - 4);

            const div = document.createElement("div");
            div.className = "node-params";

            node.params.forEach(p => {
                const val = p.value ?? p.default ?? 0;
                const knob = createKnob({
                    value: val,
                    min: p.min ?? 0,
                    max: p.max ?? 1,
                    label: p.name,
                    color: catColor,
                    onChange: (v) => {
                        callbacks.onParamChange?.(node.id, p.name, v);
                    }
                });
                knob.el.classList.add("node-knob");
                knobs[p.name] = knob;
                div.appendChild(knob.el);
            });

            fo.appendChild(div);
            g.appendChild(fo);
        }
    } else {
        // Collapsed: only show outBus port
        const portY = HEADER_HEIGHT / 2;
        const inPort = createPort(0, portY, "inBus", "input", catColor);
        inPort.dataset.nodeId = node.id;
        inPort.dataset.portName = "inBus";
        inPort.dataset.portDir = "input";
        inPort.addEventListener("pointerdown", (e) => {
            e.stopPropagation();
            callbacks.onPortClick?.(node.id, "inBus", "input", e);
        });
        g.appendChild(inPort);
        portElements.inputs["inBus"] = { x: 0, y: portY };

        const outPort = createPort(NODE_WIDTH, portY, "outBus", "output", catColor);
        outPort.dataset.nodeId = node.id;
        outPort.dataset.portName = "outBus";
        outPort.dataset.portDir = "output";
        outPort.addEventListener("pointerdown", (e) => {
            e.stopPropagation();
            callbacks.onPortClick?.(node.id, "outBus", "output", e);
        });
        g.appendChild(outPort);
        portElements.outputs["outBus"] = { x: NODE_WIDTH, y: portY };
    }

    return { group: g, knobs, portElements, height };
}

/** Create a port circle with label */
function createPort(x, y, name, direction, color) {
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", `port port-${direction}`);
    g.style.cursor = "crosshair";

    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", PORT_RADIUS);
    circle.setAttribute("class", "port-circle");
    circle.setAttribute("stroke", direction === "input" ? "#06b6d4" : "#f97316");

    // Larger hit area
    const hitCircle = document.createElementNS(SVG_NS, "circle");
    hitCircle.setAttribute("cx", x);
    hitCircle.setAttribute("cy", y);
    hitCircle.setAttribute("r", PORT_RADIUS + 4);
    hitCircle.setAttribute("fill", "transparent");

    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("y", y + 4);
    label.setAttribute("class", "port-label");
    if (direction === "input") {
        label.setAttribute("x", x + PORT_RADIUS + 6);
        label.setAttribute("text-anchor", "start");
    } else {
        label.setAttribute("x", x - PORT_RADIUS - 6);
        label.setAttribute("text-anchor", "end");
    }
    label.textContent = name;

    g.append(hitCircle, circle, label);
    return g;
}

/** Update a node group's transform to reflect new position */
export function updateNodePosition(group, x, y) {
    group.setAttribute("transform", `translate(${x}, ${y})`);
}

/** Get the absolute center of a port in canvas (world) coordinates */
export function getPortCenter(node, portName, direction, portElements) {
    const ports = direction === "input" ? portElements.inputs : portElements.outputs;
    const portPos = ports[portName];
    if (!portPos) return { x: node.x, y: node.y };
    return {
        x: node.x + portPos.x,
        y: node.y + portPos.y
    };
}

/** Toggle selection visual on a node */
export function setNodeSelected(group, selected) {
    if (selected) {
        group.classList.add("selected");
    } else {
        group.classList.remove("selected");
    }
}

/** Highlight valid target ports during connection drag */
export function setPortHighlight(portElement, highlighted) {
    if (highlighted) {
        portElement.classList.add("port-valid-target");
    } else {
        portElement.classList.remove("port-valid-target");
    }
}
