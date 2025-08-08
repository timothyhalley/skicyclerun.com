import type { Site, SocialObjects } from "../types";

export const SITE: Site = {
    website: "https://skicylerun.com/",
    author: "Tim H",
    desc: "Adventures, Escapades and Technology Insights",
    title: "SkiCycleRun",
    ogImage: "/src/assets/images/hikeclimb.svg",
    lightAndDarkMode: true,
    postPerPage: 5,
    blogType: 'GENERAL',
    scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
    version: '2025-07-25-0001'
};

export const LOCALE = {
    lang: 'en', // html lang code. Set this empty and default will be 'en'
    langTag: ['en-EN'], // BCP 47 Language Tags. Set this empty [] to use the environment default
} as const;

export const LOGO_IMAGE = {
    enable: false,
    svg: true,
    width: 216,
    height: 46,
};

export const SOCIALS: SocialObjects = [
    {
        name: "Github",
        href: "https://github.com/timothyhalley/skicyclerun.com",
        linkTitle: ` ${SITE.title} on Github`,
        active: true,
    },
    {
        name: "Facebook",
        href: "https://www.facebook.com/skicyclerun",
        linkTitle: `${SITE.title} on Facebook`,
        active: false,
    },
    {
        name: "Instagram",
        href: "https://www.instagram.com/skicyclerun/",
        linkTitle: `${SITE.title} on Instagram`,
        active: true,
    },
    {
        name: "LinkedIn",
        href: "https://www.linkedin.com/in/timothyhalley/",
        linkTitle: `${SITE.title} on LinkedIn`,
        active: true,
    },
    {
        name: "Mail",
        href: "mailto:skicyclerun@gmail.com",
        linkTitle: `Send an email to ${SITE.title}`,
        active: true,
    },
    {
        name: "Twitter",
        href: "https://twitter.com/SkiCycleRun",
        linkTitle: `${SITE.title} on Twitter`,
        active: true,
    },
    {
        name: "YouTube",
        href: "https://www.youtube.com/@TimothyHalley",
        linkTitle: `${SITE.title} on YouTube`,
        active: true,
    },
    {
        name: "CodePen",
        href: "https://codepen.io/timothyhalley",
        linkTitle: `${SITE.title} on CodePen`,
        active: false,
    },
    {
        name: "Discord",
        href: "https://discordapp.com/users/660199746547220484",
        linkTitle: `${SITE.title} on Discord`,
        active: false,
    },
];
