import type socialIcons from "@assets/socialIcons";
import type I18nKeys from "@locales/keys";

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
    linkTitle: string;
    active: boolean;
    icon?: string;
}[];

interface Configuration {
    blogType: string;
    title: string;
    subTitle?: string;
    brandTitle?: string;
    description: string;
    website: string;
    locale: {
        lang: "en" | "es" | "fr-CA";
        langTag: string[];
    };
    navigators: { nameKey: I18nKeys; href: string }[];
    author: string;
    avatarUrl: string;
    socials: {
        name: string;
        href: string;
        linkTitle: string;
        active: boolean;
        icon?: string;
    }[];
    maxSidebarCategoryChip: number;
    maxSidebarTagChip: number;
    maxFooterCategoryChip: number;
    maxFooterTagChip: number;
    banners: string[];
    slugMode: "HASH" | "RAW";
    license: {
        name: string;
        url: string;
    };
    bannerStyle: "LOOP";
    ogImage?: string;
    logoImage?: {
        enable: boolean;
        svg: boolean;
        width: number;
        height: number;
    };
    lightAndDarkMode: boolean;
    postPerPage: number;
    scheduledPostMargin: number;
    version: string;
}

export type { Configuration };