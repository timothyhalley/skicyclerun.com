---
title: Project Guide
slug: project-guide
type: 'PROJECT'
pubDatetime: 2024-01-27T14:30:00-08:00
modDatetime: 2024-01-27T14:50:00-08:00
featured: false
draft: false
tags:
  - skicyclerun
  - tech
  - development
description:
  Help to properly add/update and manage a blog post.
author: Halo Cyclone
---

This is a guide to configure the site and working with its project stack.
This post will document some key settings but not all. It assumes some
working knowledge of astro.build and other basic areas. Key links will be
provided to redirect to places of interest and help.

Additional build information can be found in the project [README.MD](https://github.com/timothyhalley/skicyclerun.com/blob/main/README.md) repo.

## Table of contents

## Frontmatter

Frontmatter is the "key" meta data for any blog post (article). Frontmatter is at top of the post and
is based on the the content scheme defined in the src/content/config.ts. There you can find what
is required and optional. 

Table below covers each field:

| Property           | Description                                                                                 | Remark                                        |
| ------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **_title_**        | Title of the post. (h1)                                                                     | required<sup>\*</sup>                         |
| **_slug_**         | Slug for the post. This field is optional but cannot be an empty string. (slug: ""❌)       | default = slugified file name                 |
| **_pubDatetime_**  | Published datetime in ISO 8601 format.                                                      | required<sup>\*</sup>                         |
| **_modDatetime_**  | Modified datetime in ISO 8601 format. (only add this property when a blog post is modified) | optional                                      |
| **_featured_**     | Whether or not display this post in featured section of home page                           | default = false                               |
| **_draft_**        | Mark this post 'unpublished'.                                                               | default = false                               |
| **_description_**  | Description of the post. Used in post excerpt and site description of the post.             | required<sup>\*</sup>                         |
| **_tags_**         | Related keywords for this post. Written in array yaml format.                               | default = others                              |
| **_ogImage_**      | OG image of the post. Useful for social media sharing and SEO.                              | default = SITE.ogImage or generated OG image  |
| **_canonicalURL_** | Canonical URL (absolute), in case the article already exists on other source.               | default = `Astro.site` + `Astro.url.pathname` |
| **_author_**       | Author of the post.                                                                         | default = SITE.author                         |

> For pub/mod dates use ISO 8601 datetime format. Use  https://timestampgenerator.com/ and select correct date & time period or use console and run: `new Date().toISOString()` an alternate method. 

> When adding new blog post, update schema meta data by running `npm run sync` in the terminal.

> Default `tag` can be set in the `/src/content/config.ts` file.

## Adding table of contents

To add a TOC: 
- Write `Table of contents` in h2 format (## in markdown). Typically found near top of post.
> Hint: run `npm run sync` to reindex TOC if a new entry is made (h2 - h5).

## Headings

Note that the `title` frontmatter is used for a `heading` and `H1` tags will create conflicts when post is index. 

## Storing Images for Blog Content

> Note: [MDX](https://docs.astro.build/en/guides/images/#images-in-mdx-files) for better control over image with tailwind CSS.

### Inside `src/assets/` directory (recommended)

Place images in `src/assets/` directory for astro build optimization. [Image Service API](https://docs.astro.build/en/reference/image-service-reference/).

This project uses alias for paths (eg.: `@assets/`). These are defined in project root file `tsconfig.json` for reference.

### Inside `public` directory

 The `public` directory artifacts will be directly available via domain path `\` and will not be optimized.

> Hint: use [TinyJPG](https://tinyjpg.com/) for quick compression of images or [TinyPNG](https://tinypng.com/)

## Enable/disable light & dark mode

SkiCycleRun theme and meta data can be configured in the `src/config.ts` file.
Find the `lightAndDarkMode` value for setting adjustments.

```js
// file: src/config.ts
export const SITE: Site = {
    website: "https://skicylerun.com/",
    author: "Tim H",
    desc: "In search of all things Visionary, Vivacious and Voluptuous",
    title: "SkiCycleRun",
    ogImage: "skicyclerun-og.jpeg",
    lightAndDarkMode: true,
    postPerPage: 3,
    blogType: 'Unknown',
    scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
};
```

New feature in SkiCycleRun v1.4.0, introducing dynamic OG image generation for blog posts.


## OG Image

The OG images is displayed when the website URL is shared on social media.

### Default/Static OG image

The project can specify a new OG image in frontmatter: `ogImage` or let the default be used `public/SkiCycleRun-og.jpg`. 

### Dynamic OG Image

Vercel's [Satori](https://github.com/vercel/satori) package is used for dynamic OG image generation.

 > See: [Satori](https://github.com/vercel/satori) how to create the dynamic OG image feature. Likely need to change this to GenAI API for increase entertainment and fun possibilities! 😵‍💫 

## Choose primary color scheme

When `SITE.lightAndDarkMode` is disable, system's prefers-color-scheme will prevail.
To adjust color scheme, find the primaryColorScheme variable inside `public/toggle-theme.js`.

```js
/* file: public/toggle-theme.js */
const primaryColorScheme = ""; // "light" | "dark"

// Get theme data from local storage
const currentTheme = localStorage.getItem("theme");
```
> Note: Other theme settings available in this file.

- `""` - system's prefers-color-scheme. (default)
- `"light"` - use light mode as primary color scheme.
- `"dark"` - use dark mode as primary color scheme.

<details><summary>Why 'primaryColorScheme' is not inside config.ts?</summary>

> To avoid color flickering on page reload, we have to place the toggle-switch JavaScript codes as early as possible when the page loads. It solves the problem of flickering, but as a trade-off, we cannot use ESM imports anymore.

[Click here](https://docs.astro.build/en/reference/directives-reference/#isinline) to know more about Astro's `is:inline` script.

</details>

## Customize color schemes

Both light & dark color schemes of SkiCycleRun theme can be customized. You can do this in `src/styles/base.css` file.

```css
/* file: src/styles/base.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root,
  html[data-theme="light"] {
    --color-fill: 251, 254, 251;
    --color-text-base: 40, 39, 40;
    --color-accent: 0, 108, 172;
    --color-card: 230, 230, 230;
    --color-card-muted: 205, 205, 205;
    --color-border: 236, 233, 233;
  }
  html[data-theme="dark"] {
    --color-fill: 47, 55, 65;
    --color-text-base: 230, 230, 230;
    --color-accent: 26, 217, 217;
    --color-card: 63, 75, 90;
    --color-card-muted: 89, 107, 129;
    --color-border: 59, 70, 85;
  }
  /* other styles */
}
```

The SkiCycleRun theme, `:root` and `html[data-theme="light"]` selectors are used as the light color scheme and `html[data-theme="dark"]` is used the dark color scheme. If you want to customize your custom color scheme, you have to specify your light color scheme inside `:root`,`html[data-theme="light"]` and dark color scheme inside `html[data-theme="dark"]`.

Colors are declared in CSS custom property (CSS Variable) notation. Color property values are written in rgb values. (Note: instead of `rgb(40, 39, 40)`, only specify `40, 39, 40`)

Here is the detail explanation of color properties.

| Color Property       | Definition & Usage                                         |
| -------------------- | ---------------------------------------------------------- |
| `--color-fill`       | Primary color of the website. Usually the main background. |
| `--color-text-base`  | Secondary color of the website. Usually the text color.    |
| `--color-accent`     | Accent color of the website. Link color, hover color etc.  |
| `--color-card`       | Card, scrollbar and code background color (like `this`).   |
| `--color-card-muted` | Card and scrollbar background color for hover state etc.   |
| `--color-border`     | Border color. Especially used in horizontal row (hr)       |

Here is an example of changing the light color scheme.

```css
@layer base {
  /* lobster color scheme */
  :root,
  html[data-theme="light"] {
    --color-fill: 246, 238, 225;
    --color-text-base: 1, 44, 86;
    --color-accent: 225, 74, 57;
    --color-card: 220, 152, 145;
    --color-card-muted: 233, 119, 106;
    --color-border: 220, 152, 145;
  }
}
```

> Check out cool [color schemes](https://www.diyphotography.net/colour-in-cinema-ad-astra-the-most-colourful-movie-you-never-saw/) other than this stock one. Need to up the game here!

## Configuring SITE

Site configurations is maintained in the `src/config.ts` file. Review the `SITE` object where many values are set.

SITE object:

| Options               | Description                                                                                                                                                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `website`             | Your deployed website url                                                                                                                                                                                                                           |
| `author`              | Your name                                                                                                                                                                                                                                           |
| `desc`                | Your site description. Useful for SEO and social media sharing.                                                                                                                                                                                     |
| `title`               | Your site name                                                                                                                                                                                                                                      |
| `ogImage`             | Your default OG image for the site. Useful for social media sharing. OG images can be an external image url or they can be placed under `/public` directory.                                                                                        |
| `lightAndDarkMode`    | Enable or disable `light & dark mode` for the website. If disabled, primary color scheme will be used. This option is enabled by default.                                                                                                           |
| `postPerPage`         | You can specify how many posts will be displayed in each posts page. (eg: if you set SITE.postPerPage to 3, each page will only show 3 posts per page)                                                                                              |
| `scheduledPostMargin` | In Production mode, posts with a future `pubDatetime` will not be visible. However, if a post's `pubDatetime` is within the next 15 minutes, it will be visible. You can set `scheduledPostMargin` if you don't like the default 15 minutes margin. |

## Configuring locale

Localization setting can be set in the `src/config.ts` file:

```js
// file: src/config.ts
export const LOCALE = {
  lang: "en", // html lang code. Set this empty and default will be "en"
  langTag: ["en-EN"], // BCP 47 Language Tags. Set this empty [] to use the environment default
} as const;
```

`LOCALE.lang` sets the HTML ISO Language code --> `<html lang="en">`. Default, aka no value will be set to `en`.
`LOCALE.langTag` is used as [datetime locale](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString#locales). Leave `LOCALE.langTag` empty `[]` to use the environment default at _build-_ and _run-time_.

## Configuring logo or title

Site logo image in `src/config.ts` file.

```js
// file: src/config.ts
export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};
```

If you specify `LOGO_IMAGE.enable` => `false`, SkiCycleRun will automatically convert `SITE.title` to the main site text logo.

If you specify `LOGO_IMAGE.enable` => `true`, SkiCycleRun will use the logo image as the site's main logo.

You have to specify `logo.png` or `logo.svg` under `/public/assets` directory. Currently, only svg and png image file formats are supported. (**_Important!_** _logo name has to be logo.png or logo.svg)_

If your logo image is png file format, you have to set `LOGO_IMAGE.svg` => `false`.

It is recommended that you specify width and height of your logo image. You can do that by setting `LOGO_IMAGE.width` _and_ `LOGO_IMAGE.height`

## Configuring social links

Configure social links and icons in `/src/config.ts`.

Another thing to note is that you can specify the `linkTitle` in the object. This text will display when hovering on the social icon link. Besides, this will improve accessibility and SEO. SkiCycleRun provides default link title values; but you can replace them with your own texts.

## MDX Setup and Example Sites

- [Astro DOCS MDX setup](https://docs.astro.build/en/guides/integrations-guide/mdx/)
- [Astro DOCS MDX guide](https://docs.astro.build/en/guides/markdown-content/)
- [MDXJS DOCS](https://mdxjs.com/docs/)

## Tailwind CSS Support

Need to find decent articles on this topic

- [Tailwind CSS cheatsheet](https://tailwindcomponents.com/cheatsheet/)

## Appendix & Resources

### SVG resources
- [SVG Repo](https://www.svgrepo.com/)
### Icon resources
- [Tabler](https://tabler.io/icons)

- Icon HTML example:
```html
<svg
  xmlns="http://www.w3.org/2000/svg"
  class="icon icon-tabler icon-tabler-brand-stackoverflow"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  stroke-width="2"
  stroke="currentColor"
  fill="none"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
  <path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-1" />
  <path d="M8 16h8" />
  <path d="M8.322 12.582l7.956 .836" />
  <path d="M8.787 9.168l7.826 1.664" />
  <path d="M10.096 5.764l7.608 2.472" />
</svg>
```