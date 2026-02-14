const osc = require("osc");
const WebSocket = require("ws");
const express = require("express");
const path = require("path");

const HTTP_PORT = 3000;
const OSC_UDP_PORT = 57122; // Listening for SC
const OSC_SEND_PORT = 57120; // Sending to SC

// 1. HTTP Server
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use("/golem", express.static(path.join(__dirname, "public", "golem")));
const server = app.listen(HTTP_PORT, () => {
    console.log(`--- VISUAL CORTEX ONLINE: http://localhost:${HTTP_PORT} ---`);
    console.log(`--- GOLEM UI: http://localhost:${HTTP_PORT}/golem ---`);
});

// 2. WebSocket Server (for Browser)
const wss = new WebSocket.Server({ server });

// 3. OSC UDP Port (From SuperCollider)
const udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: OSC_UDP_PORT,
    metadata: true
});

// 4. OSC Send Port (To SuperCollider)
const sendPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 0, // ephemeral
    remoteAddress: "127.0.0.1",
    remotePort: OSC_SEND_PORT,
    metadata: true
});

wss.on("connection", (ws) => {
    console.log("Client Connected to Visual Cortex");

    ws.on("message", (message) => {
        try {
            const msg = JSON.parse(message);

            // Forward /golem/* messages from browser to SC via OSC
            if (msg.address && msg.address.startsWith("/golem/")) {
                const oscArgs = (msg.args || []).map(arg => {
                    if (typeof arg === "number") {
                        return Number.isInteger(arg)
                            ? { type: "i", value: arg }
                            : { type: "f", value: arg };
                    }
                    return { type: "s", value: String(arg) };
                });

                sendPort.send({
                    address: msg.address,
                    args: oscArgs
                });
            }
        } catch (e) {
            // Ignore malformed messages
        }
    });
});

// Broadcast incoming OSC to all WebSocket clients
udpPort.on("message", (oscMsg) => {
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

sendPort.on("ready", () => {
    console.log(`OSC Sender Ready -> port ${OSC_SEND_PORT}`);
});

udpPort.open();
sendPort.open();
