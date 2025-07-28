import { HotContext } from "./context";
import { HotPayload } from "./payload";

export interface HMRClientConfig {
    base: string;
    hostname: string;
    port: number;
    timeout: number;
    wsToken: string;
}

export class HMRClient {
    contexts: Partial<Record<string, HotContext>> = {};
    socket: WebSocket;

    constructor(public config: HMRClientConfig) {
        const socketUrl = new URL(`ws://${config.hostname}:${config.port}${config.base}__hmr__?token=${config.wsToken}`);

        this.socket = new WebSocket(socketUrl);

        this.socket.addEventListener("message", (event) => this.onMessage(event));
    }

    async onMessage(event: MessageEvent) {
        const payload: HotPayload = JSON.parse(event.data);

        switch (payload.type) {
            case "update": {
                if (!payload.updates?.length) return;

                let anyAccepted = false;
                for (const update of payload.updates) {
                    const ctx = this.contexts[update.id];
                    if (ctx) {
                        const accepted = ctx.emit(
                            await import(update.url + "?t=" + Date.now())
                        );
                        if (accepted) {
                            console.info("[HMR] Updated accepted by", update.id);
                            anyAccepted = true;
                        }
                    }
                }

                if (!anyAccepted) {
                    console.warn("[HMR] Updated rejected");
                }
                break;
            }
        }
    }
}
