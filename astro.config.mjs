import { defineConfig } from "astro/config";
import fs from 'node:fs';
import node from "@astrojs/node";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import sitemap from "@astrojs/sitemap";
import { SkiCycleRunConfig } from "./src/skicyclerun.config.ts";
import mdx from '@astrojs/mdx';
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
    site: SkiCycleRunConfig.website,
    output: "server", // <-- Change from 'static' to 'server'
    adapter: node({
    // <-- Add the adapter
    mode: "standalone",
    }),
    integrations: [tailwind({
        applyBaseStyles: false,
    }), react(), sitemap(), mdx(), icon()],
    markdown: {
        remarkPlugins: [
            remarkToc,
            [
                remarkCollapse,
                {
                    test: "Table of contents",
                },
            ],
        ],
        shikiConfig: {
            theme: "one-dark-pro",
            wrap: true,
        },
    },
    vite: {
        server: {
            https: {
                key: fs.readFileSync('localhost+2-key.pem'),
                cert: fs.readFileSync('localhost+2.pem'),
            },
            host: 'localhost',
            port: 4321,
            strictPort: true,
        },
        optimizeDeps: {
            exclude: ["@resvg/resvg-js"],
        },
    },
    scopedStyleStrategy: "where",
});