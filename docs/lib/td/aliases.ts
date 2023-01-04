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

import glob from "fast-glob";
import { join, sep } from "path";

import { compilerOptions } from "../../../tsconfig.json";

/**
 * Two-way map of module paths and their import aliases
 * @example
 * aliases.get("src/api/Commands/index.ts") // => "@api/Commands"
 * aliases.get("@api/Commands") // => "src/api/Commands/index.ts"
 */
export const aliases = new Map<string, string>();

// Get aliases from tsconfig.json
for (const [alias, [relPath]] of Object.entries(compilerOptions.paths)) {
    const pathPattern = join(compilerOptions.baseUrl, relPath).replaceAll(sep, "/");

    // Handle static paths
    if (!pathPattern.endsWith("/*")) {
        const [path] = await glob(`${pathPattern}{/index.{ts,tsx},.{ts,tsx}}`);
        if (!path) throw new Error("Path not found: " + pathPattern);
        aliases.set(path, alias);
        aliases.set(alias, path);
        continue;
    }

    // Handle wildcard paths
    const paths = await glob(pathPattern.replace("/*", "/**/*.{ts,tsx}"));
    for (const path of paths) {
        const moduleDir = pathPattern.slice(0, -2);
        if (!path.startsWith(moduleDir)) throw new Error(`Path ${path} does not start with ${moduleDir}`);

        const narrowModule = alias.slice(0, -2) + path.slice(moduleDir.length);
        const module = narrowModule.replace(/(?:\/index)?\.(tsx?)$/, "");
        aliases.set(path, module);
        aliases.set(module, path);
    }
}
