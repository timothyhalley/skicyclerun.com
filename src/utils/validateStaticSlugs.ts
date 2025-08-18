import type { PageMeta } from "@config/pagesConfig";

export function validateStaticSlugs(pages: PageMeta[]) {
    const seen = new Set<string>();
    const reservedNumericSlugs = new Set(
        Array.from({ length: 100 }, (_, i) => String(i + 1)) // ['1', '2', ..., '100']
    );

    for (const { slug } of pages) {
        const key = slug.join("/");

        if (seen.has(key)) {
            throw new Error(`❌ Duplicate slug detected in STATIC_PAGES: "${key}"`);
        }

        if (reservedNumericSlugs.has(key)) {
            throw new Error(
                `❌ Slug "${key}" conflicts with paginated route. Use a non-numeric slug or restructure your route.`
            );
        }

        seen.add(key);
    }
}