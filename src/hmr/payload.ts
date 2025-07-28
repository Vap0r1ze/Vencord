export type HotPayload =
    | ConnectedPayload
    | UpdatePayload
    | ErrorPayload
    | PrunePayload;

export interface ConnectedPayload {
    type: 'connected';
}

export interface UpdatePayload {
    type: 'update';
    updates: Update[];
}

export interface Update {
    type: 'js';
    id: string;
    url: string;
    timestamp: number;

    // TODO: explicitImportRequired, isWithinCircularImport, firstInvalidatedBy, invalidates
}

export interface PrunePayload {
    type: 'prune';
    paths: string[];
}

export interface ErrorPayload {
    type: 'error';
    err: {
        [name: string]: any;
        message: string;
        stack: string;
        id?: string;
        frame?: string;
        plugin?: string;
        pluginCode?: string;
        loc?: {
            file?: string;
            line: number;
            column: number;
        };
    };
}
