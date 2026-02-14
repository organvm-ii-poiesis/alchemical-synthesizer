const osc = require("osc");
const WebSocket = require("ws");
const express = require("express");
const path = require("path");

const HTTP_PORT = 3000;
const OSC_UDP_PORT = 57122; // Listening for SC
const OSC_SEND_PORT = 57120; // Sending to Pd/SC

// 1. HTTP Server
const app = express();
app.use(express.static(path.join(__dirname, "public")));
const server = app.listen(HTTP_PORT, () => {
    console.log(`--- VISUAL CORTEX ONLINE: http://localhost:${HTTP_PORT} ---`);
});

// 2. WebSocket Server (for Browser)
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
    console.log("Client Connected to Visual Cortex");
    
    ws.on("message", (message) => {
        // Forward browser interactions to OSC (if needed)
        // Format: JSON -> OSC
    });
});

// 3. OSC UDP Port (From SuperCollider)
const udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: OSC_UDP_PORT,
    metadata: true
});

udpPort.on("message", (oscMsg) => {
    // Broadcast OSC to all WebSocket clients
    const jsonMsg = JSON.stringify({
        address: oscMsg.address,
        args: oscMsg.args
    });
    
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(jsonMsg);
        }
    });
});

udpPort.on("ready", () => {
    console.log(`OSC Listener Ready on port ${OSC_UDP_PORT}`);
});

udpPort.open();
