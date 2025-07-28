type Module = unknown;

export class HotContext {
    callback?: (mod: Module) => void;
    disposed = false;

    constructor(public id: string) {
        if (!window.__hmr__) throw new Error("HotContext created before __hmr__ initialized");

        if (window.__hmr__.contexts[id]) {
            window.__hmr__.contexts[id].dispose();
        }
        window.__hmr__.contexts[id] = this;
    }

    accept(cb: (mod: Module) => void) {
        if (this.disposed) {
            throw new Error("__HOT__.accept() called after dispose()");
        }
        if (this.callback) {
            throw new Error("__HOT__.accept() already called");
        }
        this.callback = cb;
    }

    dispose() {
        this.disposed = true;
        this.callback = undefined;
    }

    emit(mod: Module): boolean {
        if (this.disposed) {
            throw new Error("__HOT__.emit() called after dispose()");
        }
        if (!this.callback) return false;

        this.callback(mod);
        return true;
    }
}
