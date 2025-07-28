import { parse } from "acorn";
import { generate } from "astring";
import { SourceMapGenerator, SourceMapConsumer } from "source-map";

/** @param {string} code */
export async function transformIife(code) {
    // return code;
    /** @type {{ id: string, line: number }[]} */
    const modules = [];

    let sourceMapJson;
    let sourceMap;

    const program = parse(code, {
        ecmaVersion: "latest",
        sourceType: "script",
        locations: true,
        onComment: (block, text, start, end, startLoc, endLoc) => {
            if (block) return;

            if (startLoc.column === 2) modules.push({ id: text.trim(), line: startLoc.line });

            if (startLoc.column === 0) {
                if (text.startsWith("# sourceMappingURL=")) {
                    const b64 = text.replace("# sourceMappingURL=data:application/json;base64,", "");
                    sourceMapJson = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
                }
            }
        },
    });

    // if (sourceMapJson) {
    //     const consumer = await new SourceMapConsumer(sourceMapJson);
    //     sourceMap = SourceMapGenerator.fromSourceMap(consumer);
    // }

    /** @type {import("acorn").Statement[]} */
    const body = program.body[0].declarations[0].init.callee.body.body;

    const initIdx = body.findIndex(stmt => stmt.type === "ExpressionStatement" && stmt.expression.type === "CallExpression" && stmt.expression.callee.type === "Identifier" && stmt.expression.callee.name === "init_Vencord");
    const modulesStartIdx = body.findIndex(stmt => stmt.loc.start.line > modules[0].line);

    /** @type {import("acorn").Statement[]} */
    const moduleStmts = [];

    /** @type {import("acorn").Statement[]} */
    const wrappedModuleStmts = [];
    /** @type {string[]} */
    const moduleExports = [];

    for (let i = 0; i < modules.length; i++) {
        const start = body.findIndex(stmt => stmt.loc.start.line > modules[i].line);
        const end = modules[i + 1]
            ? body.findLastIndex(stmt => stmt.loc.end.line < modules[i + 1].line) + 1
            : initIdx;

        const slice = body.slice(start, end);
        const moduleCode = slice.map(stmt => generate(stmt)).join("\n");

        /** @type {import("acorn").Statement[]} */
        const wrappedStmts = [];
        for (const stmt of slice) {
            if (stmt.type === "VariableDeclaration" && stmt.declarations.every(decl => decl.init == null)) {
                moduleExports.push(...stmt.declarations.map(decl => decl.id.name));
                continue;
            };
            if (stmt.type === "VariableDeclaration") {
                if (stmt.declarations.length !== 1) throw new Error("Expected single variable declaration");
                moduleExports.push(stmt.declarations[0].id.name);
                wrappedStmts.push({
                    type: "ExpressionStatement",
                    expression: {
                        type: "AssignmentExpression",
                        operator: "=",
                        left: stmt.declarations[0].id,
                        right: stmt.declarations[0].init,
                    },
                });
            }
            if (stmt.type === "FunctionDeclaration") {
                moduleExports.push(stmt.id.name);
                wrappedStmts.push({
                    type: "ExpressionStatement",
                    expression: {
                        type: "AssignmentExpression",
                        operator: "=",
                        left: stmt.id,
                        right: stmt,
                    },
                });
            }
            if (stmt.type === "ExpressionStatement") {
                wrappedStmts.push(stmt);
            }
        }

        wrappedModuleStmts.push(...wrappedStmts);
        moduleStmts.push(...slice);
    }

    /** @type {import("acorn").ExpressionStatement} */
    const initModules = {
        type: "ExpressionStatement",
        expression: {
            type: "AssignmentExpression",
            operator: "=",
            left: {
                type: "MemberExpression",
                object: {
                    type: "Identifier",
                    name: "window",
                },
                property: {
                    type: "Identifier",
                    name: "VencordModules",
                },
            },
            right: {
                type: "ObjectExpression",
                properties: moduleExports.map(name => ({
                    type: "Property",
                    key: {
                        type: "Identifier",
                        name,
                    },
                    value: {
                        type: "Literal",
                        value: undefined,
                    },
                    kind: "init",
                })),
            },
        },
    };
    /** @type {import("acorn").WithStatement} */
    const wrappedModules = {
        type: "WithStatement",
        object: {
            type: "MemberExpression",
            object: {
                type: "Identifier",
                name: "window",
            },
            property: {
                type: "Identifier",
                name: "VencordModules",
            },
        },
        body: {
            type: "BlockStatement",
            body: wrappedModuleStmts,
        },
    };

    body[initIdx].expression.callee.name = "window.VencordModules." + body[initIdx].expression.callee.name;
    body[initIdx + 1].argument.arguments[0].name = "window.VencordModules." + body[initIdx + 1].argument.arguments[0].name;
    body.splice(modulesStartIdx, moduleStmts.length, initModules, wrappedModules);
    // console.log(moduleStmts.filter(stmt => stmt.type === "ExpressionStatement").map(stmt => generate(stmt)));

    // const vars = moduleStmts.flatMap(stmt => {
    //     if (stmt.type === "VariableDeclaration") return stmt.declarations.map(decl => decl.id.name);
    //     if (stmt.type === "FunctionDeclaration") return [stmt.id.name];
    //     return [];
    // });

    // console.log(vars.filter((v, i, a) => a.indexOf(v) !== i));

    const transformed = generate(program, { sourceMap });

    return { transformed };
}
