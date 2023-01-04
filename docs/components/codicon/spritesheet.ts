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

import { readFileSync } from "fs";

// Keeps track of all icons used on a given page
const iconMap: Record<string, Set<string>> = {};

export function addIcon(page: string, name: string) {
    const sprites = (iconMap[page] ??= new Set());
    sprites.add(name);
}

export function getIconsForPage(page: string) {
    return iconMap[page] ? [...iconMap[page]] : [];
}

export function getSpritesheetForPage(page: string) {
    return getIconsForPage(page).map(name =>
        readFileSync(`node_modules/@vscode/codicons/src/icons/${name}.svg`, "utf-8")
            .replace("<svg", `<symbol id="${name}"`)
    ).join("");
}

export function getFullSpritesheet() {
    const svg = readFileSync("node_modules/@vscode/codicons/dist/codicon.svg", "utf-8");
    return svg.slice(svg.indexOf("<symbol"), svg.indexOf("</svg"));
}
