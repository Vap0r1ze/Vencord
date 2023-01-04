/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { DeclarationReflection, ReflectionKind } from "typedoc";

import { aliases } from "./aliases";
import { project } from "./project";

export const moduleRefls = new Map<string, DeclarationReflection>();
export const modules = new Map<string, Module>();

for (const decl of project.groups!.find(g => g.title === "Modules").children) {
    const name = aliases.get(decl.sources[0].fileName);

    modules.set(name, {
        name,
        src: decl.sources[0].fileName,
        decl,
    });
}

interface Module {
    name: string;
    src: string;
    decl: DeclarationReflection;
}
interface ExportSource {
    name: string;
    module: Module;
    decl: DeclarationReflection;
    isDefault: boolean;
}
interface ModuleExport {
    name: string;
    kind: SourceKind;
    decl: DeclarationReflection;
    source: ExportSource;
}
export const enum SourceKind {
    Unknown,
    Var,
    Const,
    Function,
    Class,
    Enum,
    Type,
}

export function getSourceKind(source: ExportSource): SourceKind {
    switch (source.decl.kind) {
        case ReflectionKind.Variable: {
            if (source.decl.flags.isConst) return SourceKind.Const;
            return SourceKind.Var;
        }

        case ReflectionKind.Function:
        case ReflectionKind.FunctionOrMethod: return SourceKind.Function;

        case ReflectionKind.Class: return SourceKind.Class;
        case ReflectionKind.Enum: return SourceKind.Enum;

        case ReflectionKind.Interface:
        case ReflectionKind.TypeAlias: return SourceKind.Type;

        default: return SourceKind.Unknown;
    }
}

export function getExports(module: Module): ModuleExport[] {
    if (!module.decl.children) return [];

    const sourcePairs = module.decl.children.map(decl => [decl, getExportSource(decl)] as const);
    const exports: ModuleExport[] = [];

    for (const [decl, source] of sourcePairs) {
        const shallowSource = getExportSource(decl, true);

        exports.push({
            name: shallowSource.name,
            kind: getSourceKind(source),
            decl,
            source,
        });
    }

    return exports;
}
export function getExportSource(srcDecl: DeclarationReflection, shallow = false): ExportSource {
    let decl: DeclarationReflection = srcDecl;
    while (
        !shallow &&
        "_target" in decl &&
        decl._target instanceof DeclarationReflection &&
        decl._target.parent instanceof DeclarationReflection &&
        decl._target.parent!.kind === ReflectionKind.Module
    ) decl = decl._target;

    const moduleName = aliases.get(decl.parent.sources[0].fileName);
    const module = modules.get(moduleName);
    const isDefault = decl.name === "default";
    const exportName = isDefault
        ? module.name.split("/").at(-1)
        : decl.name;

    return {
        module,
        name: exportName,
        decl,
        isDefault,
    };
}

const moduleNames = Array.from(modules.keys()).sort((a, b) => {
    const aDepth = a.split("/").length - 1;
    const bDepth = b.split("/").length - 1;
    if (aDepth === bDepth) return a.localeCompare(b);
    return aDepth - bDepth;
});

/* Now we will build a verbose tree and flatten it afterwards
 * | Example situation:
 * |    moduleNames: ["a", "a/b/c", "x/y/z"]
 * |   verbose tree: { a: { b: { c: null } }, x: { y: { z: null } } }
 * | flattened tree: { a: { "a/b/c": null }, "x/y/z": null }
 */

type VerboseModuleTree = Map<string, VerboseModuleTree>;
export const verboseModuleTree: VerboseModuleTree = new Map();

// Build verbose tree
for (const name of moduleNames) {
    const parts = name.split("/");
    for (let parent = verboseModuleTree, i = 0; i < parts.length; i++) {
        if (!parent.has(parts[i])) parent.set(parts[i], new Map());
        parent = parent.get(parts[i]);
    }
}

type ModuleTree = Map<string, ModuleTree | null>;

// Flatten tree
function flatten(verboseTree: VerboseModuleTree, prefix: string[] = []): ModuleTree | null {
    const flattened: ModuleTree = new Map();
    const path = prefix.join("/");

    if (verboseTree.size === 0) return flattened.set(path, null);
    if (verboseTree.size === 1 && !moduleNames.includes(path)) {
        const [name, tree] = Array.from(verboseTree)[0];
        return flatten(tree, prefix.concat(name));
    }

    for (const [childName, childVerboseTree] of verboseTree) {
        const childParts = prefix.concat(childName);
        const childPath = childParts.join("/");
        const childTree = flatten(childVerboseTree, childParts);

        if (moduleNames.includes(childPath)) {
            const childValue = childTree.has(childPath)
                ? childTree.get(childPath)
                : childTree;
            flattened.set(childPath, childValue);
            continue;
        }

        Array.from(childTree)
            .forEach(([name, tree]) => flattened.set(name, tree));
    }

    return flattened;
}

export const moduleTree = flatten(verboseModuleTree);

export const freshModules = new Map<string, Module>();

const seenSources = new Set<DeclarationReflection>();
for (const [alias, module] of modules) {
    const sources = module.decl.children?.map(r => getExportSource(r)) ?? [];
    const newSources = sources.filter(src => !seenSources.has(src.decl));

    if (newSources.length === 0) continue;

    freshModules.set(alias, module);
    newSources.forEach(src => seenSources.add(src.decl));
}
