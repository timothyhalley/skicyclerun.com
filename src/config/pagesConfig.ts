export type StaticPageConfig = {
    slug: string[];
    title: string;
    visible?: boolean;
};

export interface PageMeta {
    slug: string[]; // e.g. ['yukina']
    title: string;
    layout: string; // optional layout override
    visible?: boolean; // for nav exposure
    image?: string; // optional hero or thumbnail
}

export const STATIC_PAGES: PageMeta[] = [
    {
        slug: ['yukina'],
        title: 'Yukina',
        layout: 'YukinaLayout',
        visible: true,
        image: '/images/yukina-hero.jpg',
    },
    {
        slug: ['kaoru'],
        title: 'Kaoru',
        layout: 'DefaultLayout',
        visible: true,
    },
    // Add more pages here
];