/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        skin: {
          base: "var(--color-text-base)",
          accent: "var(--color-text-accent)",
          line: "var(--color-border-line)",
          card: "var(--color-bg-card)",
          "card-muted": "var(--color-bg-card-muted)",
        },
      },
    },
  },
  plugins: [],
};
