/**
 * Canvas State — Pure state management for the visual patching canvas.
 * No DOM manipulation; only data structures and transformations.
 */

/** Create a fresh canvas state object */
export function createCanvasState() {
    return {
        nodes: {},          // nodeId -> { id, moduleName, instanceName, x, y, width, height, params, collapsed, category }
        connections: [],    // [{ id, sourceNodeId, sourcePort, destNodeId, destPort, amount }]
        viewport: { panX: 0, panY: 0, zoom: 1 },
        selection: { nodes: new Set(), cables: new Set() },
        connecting: null,   // { sourceNodeId, sourcePort, mouseX, mouseY } during drag
        nextNodeId: 1,
        nextConnectionId: 1,
        instanceCounters: {} // moduleName -> count (for auto-naming)
    };
}

/** Generate a unique instance name for a module */
export function generateInstanceName(canvasState, moduleName) {
    if (!canvasState.instanceCounters[moduleName]) {
        canvasState.instanceCounters[moduleName] = 0;
    }
    canvasState.instanceCounters[moduleName]++;
    return `${moduleName}_${canvasState.instanceCounters[moduleName]}`;
}

/** Add a node to the canvas. Returns the new node. */
export function addNode(canvasState, { moduleName, instanceName, x, y, params, category }) {
    const id = canvasState.nextNodeId++;
    const node = {
        id,
        moduleName,
        instanceName: instanceName || generateInstanceName(canvasState, moduleName),
        x: x || 100,
        y: y || 100,
        width: 200,
        height: 0, // computed by renderer
        params: params || [],
        collapsed: false,
        category: category || "engine"
    };
    canvasState.nodes[id] = node;
    return node;
}

/** Remove a node and all its connections */
export function removeNode(canvasState, nodeId) {
    const removed = canvasState.nodes[nodeId];
    if (!removed) return null;

    // Remove all connections to/from this node
    canvasState.connections = canvasState.connections.filter(
        c => c.sourceNodeId !== nodeId && c.destNodeId !== nodeId
    );

    // Clean selection
    canvasState.selection.nodes.delete(nodeId);

    delete canvasState.nodes[nodeId];
    return removed;
}

/** Move a node to new coordinates */
export function moveNode(canvasState, nodeId, x, y) {
    const node = canvasState.nodes[nodeId];
    if (node) {
        node.x = x;
        node.y = y;
    }
}

/** Add a connection between two ports. Returns the connection or null if invalid. */
export function addConnection(canvasState, { sourceNodeId, sourcePort, destNodeId, destPort, amount }) {
    // Validate: no self-connections
    if (sourceNodeId === destNodeId) return null;

    // One cable per input port (last wins) — remove existing
    canvasState.connections = canvasState.connections.filter(
        c => !(c.destNodeId === destNodeId && c.destPort === destPort)
    );

    // Remove from cable selection since we may have removed one
    canvasState.selection.cables.clear();

    const conn = {
        id: canvasState.nextConnectionId++,
        sourceNodeId,
        sourcePort: sourcePort || "outBus",
        destNodeId,
        destPort: destPort || "inBus",
        amount: amount ?? 1.0
    };
    canvasState.connections.push(conn);
    return conn;
}

/** Remove a connection by id */
export function removeConnection(canvasState, connectionId) {
    const idx = canvasState.connections.findIndex(c => c.id === connectionId);
    if (idx < 0) return null;
    const removed = canvasState.connections.splice(idx, 1)[0];
    canvasState.selection.cables.delete(connectionId);
    return removed;
}

/** Update a parameter value on a node */
export function setNodeParam(canvasState, nodeId, paramName, value) {
    const node = canvasState.nodes[nodeId];
    if (!node) return;
    const param = node.params.find(p => p.name === paramName);
    if (param) param.value = value;
}

/** Toggle collapsed state of a node */
export function toggleCollapsed(canvasState, nodeId) {
    const node = canvasState.nodes[nodeId];
    if (node) node.collapsed = !node.collapsed;
}

/** Select a single node (clear previous selection) */
export function selectNode(canvasState, nodeId, additive) {
    if (!additive) {
        canvasState.selection.nodes.clear();
        canvasState.selection.cables.clear();
    }
    canvasState.selection.nodes.add(nodeId);
}

/** Select a single cable */
export function selectCable(canvasState, cableId, additive) {
    if (!additive) {
        canvasState.selection.nodes.clear();
        canvasState.selection.cables.clear();
    }
    canvasState.selection.cables.add(cableId);
}

/** Clear all selections */
export function clearSelection(canvasState) {
    canvasState.selection.nodes.clear();
    canvasState.selection.cables.clear();
}

/** Delete all selected items. Returns { deletedNodes, deletedConnections }. */
export function deleteSelected(canvasState) {
    const deletedNodes = [];
    const deletedConnections = [];

    // Delete selected cables first
    for (const cableId of canvasState.selection.cables) {
        const removed = removeConnection(canvasState, cableId);
        if (removed) deletedConnections.push(removed);
    }

    // Delete selected nodes (and their cables)
    for (const nodeId of canvasState.selection.nodes) {
        // Gather connections that will be removed
        const nodeCables = canvasState.connections.filter(
            c => c.sourceNodeId === nodeId || c.destNodeId === nodeId
        );
        deletedConnections.push(...nodeCables);

        const removed = removeNode(canvasState, nodeId);
        if (removed) deletedNodes.push(removed);
    }

    canvasState.selection.nodes.clear();
    canvasState.selection.cables.clear();

    return { deletedNodes, deletedConnections };
}

/** Get all connections for a given node */
export function getNodeConnections(canvasState, nodeId) {
    return canvasState.connections.filter(
        c => c.sourceNodeId === nodeId || c.destNodeId === nodeId
    );
}

/** Snap coordinates to a grid */
export function snapToGrid(x, y, gridSize = 20) {
    return {
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize
    };
}
