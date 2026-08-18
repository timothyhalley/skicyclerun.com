import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import path from "path";
import fs from "fs";
import { loadEnv } from "vite";

import tailwindcss from "@tailwindcss/vite";

const mode = process.env.MODE || process.env.NODE_ENV || "development";
const env = loadEnv(mode, process.cwd(), "");

const httpsConfig =
  fs.existsSync("./localhost+2.pem") && fs.existsSync("./localhost+2-key.pem")
    ? {
        key: fs.readFileSync(path.resolve("./localhost+2-key.pem")),
        cert: fs.readFileSync(path.resolve("./localhost+2.pem")),
      }
    : undefined;

export default defineConfig({
  site:
    process.env.SKICYCLERUN_URL ??
    env.SKICYCLERUN_URL ??
    "https://skicyclerun.com",
  output: "static",

  integrations: [
    mdx(),
    sitemap(),
    react()
  ],

  devToolbar: {
    enabled: false,
  },

  vite: {
    plugins: [tailwindcss()], // ✅  @tailwindcss/vite 
    resolve: {
      alias: {
        "@assets": path.resolve("src/assets"),
        "@components": path.resolve("src/components"),
        "@config": path.resolve("src/config"),
        "@constants": path.resolve("src/constants"),
        "@content": path.resolve("src/content"),
        "@images": path.resolve("src/assets/images"),
        "@layouts": path.resolve("src/layouts"),
        "@lib": path.resolve("src/lib"),
        "@locales": path.resolve("src/locales"),
        "@pages": path.resolve("src/pages"),
        "@scripts": path.resolve("src/scripts"),
        "@styles": path.resolve("src/styles"),
        "@types": path.resolve("src/types"),
        "@utils": path.resolve("src/utils"),
        "@svg_imgs": path.resolve("src/assets/svg_imgs"),
      },
    },
    build: {
      chunkSizeWarningLimit: 2000,
    },
    server: {
      https: httpsConfig,
    },
    preview: {
      https: httpsConfig || true,
    },
  },

  server: {
    port: 4321,
    host: "localhost",
    https: !!httpsConfig,
  },
});