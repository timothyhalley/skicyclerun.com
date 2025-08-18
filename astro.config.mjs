import { defineConfig } from "astro/config";
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
        optimizeDeps: {
            exclude: ["@resvg/resvg-js"],
        },
    },
    scopedStyleStrategy: "where",
});