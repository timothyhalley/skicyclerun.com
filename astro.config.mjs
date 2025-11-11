import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import { loadEnv } from "vite";

// Derive mode and load .env files so SKICYCLERUN_URL also works from .env.development/.env.production
const mode = process.env.MODE || process.env.NODE_ENV || "development";
const env = loadEnv(mode, process.cwd(), "");

// Optional local HTTPS for astro dev when certs are present
const httpsConfig =
  fs.existsSync("./localhost+2.pem") && fs.existsSync("./localhost+2-key.pem")
    ? {
        key: fs.readFileSync(path.resolve("./localhost+2-key.pem")),
        cert: fs.readFileSync(path.resolve("./localhost+2.pem")),
      }
    : undefined;

export default defineConfig({
  // Canonical site URL for sitemap/canonicals, from env first
  site:
    process.env.SKICYCLERUN_URL ??
    env.SKICYCLERUN_URL ??
    "https://skicyclerun.com",
  output: "static",
  integrations: [mdx(), sitemap(), react()],
  devToolbar: {
    enabled: false,
  },
  image: {
    service: {
      entrypoint: "astro/assets/services/noop",
    },
  },
  vite: {
    plugins: [tailwindcss()],
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
