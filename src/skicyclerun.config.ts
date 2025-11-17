import type { SocialObjects } from "@config/types";
import I18nKeys from "@locales/keys";
import { BLOG_TYPES } from "@constants/blogTypes";

export const SkiCycleRunConfig = {
  website: "https://skicylerun.com/",
  author: "Tim H",
  title: "SkiCycleRun",
  description: "Adventures, Technology and Interests",
  ogImage: "SkiCycleRun.svg",
  lightAndDarkMode: true,
  loginAndLogout: true,
  postsPerPage: 5,
  blogType: BLOG_TYPES[3], // "GENERAL"
  scheduledPostMargin: 15 * 60 * 1000,
  version: "2025-11-16 V04.015",
  maxWidth: 1024,
  // maximum photos to request/display in MDXLayout galleries (4x4 => 16)
  galleryMaxPhotos: 16,

  // Photo API configuration
  photoApi: {
    buildTimePhotos: 150, // Photos fetched during SSG build
    dynamicPhotos: 250, // Photos fetched for dynamic "Full Library" mode
  },

  locale: {
    lang: "en",
    langTag: "en-US",
  },

  logoImage: {
    enable: false,
    svg: true,
    width: 216,
    height: 46,
  },

  socials: [
    {
      name: "Github",
      href: "https://github.com/timothyhalley/timothyhalley",
      linkTitle: "SkiCycleRun on Github",
      icon: "ant-design:github-filled",
      active: true,
    },
    {
      name: "Facebook",
      href: "https://www.facebook.com/skicyclerun",
      linkTitle: "SkiCycleRun on Facebook",
      icon: "ant-design:facebook-filled",
      active: false,
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/skicyclerun/",
      linkTitle: "SkiCycleRun on Instagram",
      icon: "ant-design:instagram-filled",
      active: true,
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/timothyhalley/",
      linkTitle: "SkiCycleRun on LinkedIn",
      icon: "ant-design:linkedin-filled",
      active: true,
    },
    {
      name: "Mail",
      href: "mailto:skicyclerun@gmail.com",
      linkTitle: "Send an email to SkiCycleRun",
      icon: "ant-design:mail-filled",
      active: true,
    },
    {
      name: "Twitter",
      href: "https://twitter.com/SkiCycleRun",
      linkTitle: "SkiCycleRun on Twitter",
      icon: "ant-design:twitter-outlined",
      active: true,
    },
    {
      name: "YouTube",
      href: "https://www.youtube.com/@TimothyHalley",
      linkTitle: "SkiCycleRun on YouTube",
      icon: "ant-design:youtube-filled",
      active: true,
    },
    {
      name: "CodePen",
      href: "https://codepen.io/timothyhalley",
      linkTitle: "SkiCycleRun on CodePen",
      icon: "ant-design:codepen-outlined",
      active: false,
    },
    {
      name: "Discord",
      href: "https://discordapp.com/users/660199746547220484",
      linkTitle: "SkiCycleRun on Discord",
      icon: "ant-design:discord-filled",
      active: false,
    },
  ] satisfies SocialObjects,

  navigators: [
    {
      nameKey: I18nKeys.nav_bar_home,
      href: "/",
    },
    {
      nameKey: I18nKeys.nav_bar_archive,
      href: "/archive",
    },
    {
      nameKey: I18nKeys.nav_bar_about,
      href: "/about",
    },
    {
      nameKey: I18nKeys.nav_bar_github,
      href: "https://github.com/timothyalley/skicyclerun.com",
    },
  ],

  avatarUrl: "https://s2.loli.net/2025/01/25/FPpTrQSezM8ivbl.webp",

  maxSidebarCategoryChip: 6,
  maxSidebarTagChip: 12,
  maxFooterCategoryChip: 6,
  maxFooterTagChip: 24,

  banners: [
    "/assets/banners/PBvHFjr5yDu6t4a.webp",
    "/assets/banners/6bKcwHZigzlM4mJ.webp",
    "/assets/banners/H9WgEK6qNTcpFiS.webp",
    "/assets/banners/njNVtuUMzxs81RI.webp",
    "/assets/banners/tozsJ8QHAjFN3Mm.webp",
    "/assets/banners/Pm89OveZq7NWUxF.webp",
    "/assets/banners/UCYKvc1ZhgPHB9m.webp",
    "/assets/banners/JjpLOW8VSmufzlA.webp",
  ],

  slugMode: "HASH",

  license: {
    name: "CC BY-NC-SA 4.0",
    url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  },

  bannerStyle: "LOOP",
};
