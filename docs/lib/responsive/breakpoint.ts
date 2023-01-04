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

const breakpointPattern = /^\$breakpoint: (\d+px);/;

export const breakpoint = readFileSync("docs/assets/responsive.scss", "utf8")
    .match(breakpointPattern)[1];

export const breakpointPx = parseInt(breakpoint, 10);

export const mediaMobile = `screen and (max-width: ${breakpoint})`;
export const mediaDesktop = `screen and not (max-width: ${breakpoint})`;
