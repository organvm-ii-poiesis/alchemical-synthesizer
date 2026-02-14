/**
 * OSC Client — WebSocket <-> OSC message abstraction
 */
export class OSCClient {
    constructor() {
        this.ws = null;
        this.listeners = new Map();
        this.connected = false;
    }

    connect(url) {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            this.connected = true;
            console.log("OSC: Connected to Visual Cortex");
        };

        this.ws.onclose = () => {
            this.connected = false;
            console.log("OSC: Disconnected — reconnecting in 2s");
            setTimeout(() => this.connect(url), 2000);
        };

        this.ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                this.dispatch(msg.address, msg.args);
            } catch (e) {
                // Ignore malformed messages
            }
        };
    }

    send(address, ...args) {
        if (this.ws && this.connected) {
            this.ws.send(JSON.stringify({ address, args }));
        }
    }

    on(address, callback) {
        if (!this.listeners.has(address)) {
            this.listeners.set(address, []);
        }
        this.listeners.get(address).push(callback);
    }

    off(address, callback) {
        const cbs = this.listeners.get(address);
        if (cbs) {
            const idx = cbs.indexOf(callback);
            if (idx >= 0) cbs.splice(idx, 1);
        }
    }

    dispatch(address, args) {
        // Exact match
        const cbs = this.listeners.get(address);
        if (cbs) cbs.forEach(cb => cb(args));

        // Wildcard prefix match
        this.listeners.forEach((callbacks, pattern) => {
            if (pattern.endsWith("*") && address.startsWith(pattern.slice(0, -1))) {
                callbacks.forEach(cb => cb(args, address));
            }
        });
    }
}
