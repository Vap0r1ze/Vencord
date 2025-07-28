import { WebSocketServer } from "ws";

export class HmrServer {
    wss = new WebSocketServer({
        host: "127.0.0.1",
        port: 3000,
    });
    wsToken = Math.random().toString(36).slice(2);

    /** @type {import("ws").WebSocket[]} */
    clients = [];

    constructor() {
        this.wss.on("listening", () => {
            console.log(`HMR server listening on ws://${this.wss.options.host}:${this.wss.options.port}`);
        });

        this.wss.on("connection", (client, request) => {
            const url = new URL(`ws://${request.headers.host}${request.url}`);
            if (url.searchParams.get("token") !== this.wsToken) return client.close(3000, "Invalid token");

            this.clients = [...this.clients, client];

            client.on("close", () => {
                this.clients = this.clients.filter(c => c !== client);
            });
        });
    }

    /** @param {import("hmr/payload").HotPayload} payload */
    send(payload) {
        this.clients.forEach(client => {
            if (client.readyState !== client.OPEN) return;

            client.send(JSON.stringify(payload));
        });
    }
}
