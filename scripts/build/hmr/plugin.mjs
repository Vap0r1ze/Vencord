// @ts-check

import { readFile, writeFile } from "fs/promises";
import { relative, resolve, sep } from "path";
import { sep as posixSep } from "path/posix";
import { HmrServer } from "./server.mjs";
import { transformIife } from "./transform.mjs";

/** @type {HmrServer | undefined} */
let hmrServer;
export function getHmrServer() {
    return hmrServer ??= new HmrServer();
}

/**
 * @type {import("esbuild").Plugin}
 */
export const hmrPlugin = {
    name: "hmr",
    setup: build => {
        // const hmrServer = getHmrServer();

        const write = build.initialOptions.write ?? true;
        build.initialOptions.write = false;

        // const filter = /^~hmr$/;
        // build.onResolve({ filter }, args => {
        //     return {
        //         namespace: "hmr",
        //         path: args.path,
        //     };
        // });

        build.onResolve({ filter: /./, }, async args => {
            if (args.pluginData) return null;
            args.pluginData = true;

            const result = await build.resolve(args.path, {
                importer: args.importer,
                resolveDir: args.resolveDir,
                kind: args.kind,
                namespace: args.namespace,
                with: args.with,
                pluginData: args.pluginData,
            });

            // args.importer: absolute or namespace:~virtual
            // args.resolveDir: absolute
            // result.path: absolute or unresolvable (result.path === args.path)
            // console.log("Resolving %o in %o from %o", args.path, args.resolveDir, args.importer);
            // console.log("Resolved to %o", result.path);

            return result;
        });

        // build.onLoad({ filter, namespace: "hmr" }, async () => {
        //     return {
        //         contents: await readFile("./src/hmr/prelude.ts", "utf-8"),
        //         resolveDir: "./src/hmr",
        //         loader: "ts",
        //     };
        // });

        // build.onLoad({ filter: /\.tsx?$/ }, async args => {
        //     const moduleId = relative(process.cwd(), args.path).replaceAll(sep, posixSep);

        //     let code = await readFile(args.path, "utf-8");
        //     if (!moduleId.startsWith("src/hmr/")) {
        //         code = `import { HotContext } from "~hmr";\nconst __HOT__ = new HotContext(${JSON.stringify(moduleId)});\n${code}`;
        //     }

        //     return {
        //         contents: code,
        //         loader: args.path.endsWith("x") ? "tsx" : "ts",
        //     };
        // });

        // /** @type {import("hmr/client").HMRClientConfig} */
        // const hmrConfig = {
        //     base: "/renderer/",
        //     port: hmrServer.wss.options.port ?? 3000,
        //     hostname: hmrServer.wss.options.host ?? "localhost",
        //     timeout: 5000,
        //     wsToken: hmrServer.wsToken,
        // };

        // build.initialOptions.define = {
        //     ...build.initialOptions.define,
        //     __HMR_CONFIG__: JSON.stringify(hmrConfig),
        // };

        const lastOutputs = {};

        build.onEnd(async (result) => {
            if (!build.initialOptions.outfile) return;
            if (!write) return;
            const entryPath = resolve(build.initialOptions.outfile);

            /** @type {string | undefined} */
            let entryContents;

            for (const output of result.outputFiles ?? []) {
                const contents = new TextDecoder().decode(output.contents);
                if (lastOutputs[output.path] === contents) continue;
                lastOutputs[output.path] = contents;

                if (output.path === entryPath) entryContents = contents;
                else await writeFile(output.path, output.contents);
            }
            if (!entryContents) return;

            console.time("HMR transform");
            const { transformed } = await transformIife(entryContents);
            console.timeEnd("HMR transform");
            await writeFile(entryPath, transformed);
        });

        // build.initialOptions.inject ??= [];
        // build.initialOptions.inject.push("./src/hmr/prelude.ts");
    }
};
