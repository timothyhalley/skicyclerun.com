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
    content:
        [
            "./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx,vue}",
            "./node_modules/tw-elements/dist/js/**/*.js"
        ],
    theme: {
        // Remove the following screen breakpoint or add other breakpoints
        // if one breakpoint is not enough for you
        screens: {
            sm: "640px",
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
                asimovian: ['Asimovian', 'sans-serif'],
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
            backgroundImage: theme => ({
                'swoosh': "url('/background-swoosh.jpg')",
                'zen-brush': "url('/zen-brush.svg')"
            }),
        },
    },
    plugins:
        [
            require("@tailwindcss/typography")
        ],
    darkMode: "class"
};
