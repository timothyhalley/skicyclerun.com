function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx,vue}",
    "./src/styles/base.css",
    "./node_modules/tw-elements/dist/js/**/*.js",
  ],
  theme: {
    // Tailwind default breakpoints
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },

    extend: {
      colors: {
        skin: {
          fill: "rgb(var(--color-fill) / <alpha-value>)",
          base: "rgb(var(--color-text-base) / <alpha-value>)",
          accent: "rgb(var(--color-accent) / <alpha-value>)",
          card: "rgb(var(--color-card) / <alpha-value>)",
          cardMuted: "rgb(var(--color-card-muted) / <alpha-value>)",
          line: "rgb(var(--color-border) / <alpha-value>)",
        },
      },
      textColor: {
        skin: {
          base: withOpacity("--color-text-base"),
          accent: withOpacity("--color-accent"),
          inverted: withOpacity("--color-fill"),
        },
      },
      backgroundColor: {
        skin: {
          fill: withOpacity("--color-fill"),
          accent: withOpacity("--color-accent"),
          inverted: withOpacity("--color-text-base"),
          card: withOpacity("--color-card"),
          "card-muted": withOpacity("--color-card-muted"),
        },
      },
      outlineColor: {
        skin: {
          fill: withOpacity("--color-accent"),
        },
      },
      borderColor: {
        skin: {
          line: withOpacity("--color-border"),
          fill: withOpacity("--color-text-base"),
          accent: withOpacity("--color-accent"),
        },
      },
      fill: {
        skin: {
          base: withOpacity("--color-text-base"),
          accent: withOpacity("--color-accent"),
        },
        transparent: "transparent",
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "monospace"],
        asimovian: ["Asimovian", "sans-serif"],
      },

      typography: {
        DEFAULT: {
          css: {
            pre: {
              color: false,
            },
            code: {
              color: false,
            },
          },
        },
      },
      backgroundImage: (theme) => ({
        swoosh: "url('images/skicyclerun_banner_2.png')",
        "zen-brush": "url('/images/zen-brush.svg')",
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
  darkMode: "class",
  safelist: [
    "text-2xl",
    "text-3xl",
    "text-4xl",
    "text-5xl",
    "text-6xl",
    "text-7xl",
    "text-8xl",
    "md:text-2xl",
    "md:text-3xl",
    "md:text-4xl",
    "md:text-5xl",
    "lg:text-2xl",
    "lg:text-3xl",
    "lg:text-4xl",
    "lg:text-5xl",
    "text-center",
    "text-left",
    "text-right",
    "font-extrabold",
    "font-semibold",
    "font-bold",
    "w-full",
    {
      pattern: /text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/,
      variants: ["md", "lg", "xl"],
    },
  ],
};
