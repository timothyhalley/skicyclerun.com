import type socialIcons from "@assets/socialIcons";

export type Site = {
    website: string;
    author: string;
    desc: string;
    title: string;
    ogImage?: string;
    lightAndDarkMode: boolean;
    postPerPage: number;
    blogType: string;
    scheduledPostMargin: number;
    version: string;
};

export type SocialObjects = {
    name: keyof typeof socialIcons;
    href: string;
    active: boolean;
    linkTitle: string;
}[];