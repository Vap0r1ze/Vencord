import { HMRClient, HMRClientConfig } from "./client";
import { HotContext } from "./context";

declare const __HMR_CONFIG__: HMRClientConfig;

declare global {
    interface Window {
        __hmr__?: HMRClient;
    }

    const __HOT__: HotContext;
}

window.__hmr__ ??= new HMRClient(__HMR_CONFIG__);

export { HotContext } from "./context";
