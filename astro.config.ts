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

import svelte from "@astrojs/svelte";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
    site: "https://vendicated.github.io/",
    base: "/",
    publicDir: "./docs/public",
    srcDir: "./docs",
    outDir: "./dist/docs/",
    root: "./docs",
    integrations: [svelte()]
});
