// ✅ Eagerly import all image modules to force inclusion in build
export const imageModules = import.meta.glob<{ default: ImageMetadata }>(
    "/src/assets/images/*.{svg,jpeg,jpg,png,gif}",
    { eager: true }
);

export function getFileName(path: string | undefined): string {
    if (!path) return "imageNotFound";

    const cleanPath = path.split("?")[0];
    const parts = cleanPath.split("/");
    const last = parts[parts.length - 1];

    // Match hashed filenames like dharma.DvJ3sSIt.svg
    const match = last.match(/^(.+?)\.[A-Za-z0-9]{8}\.(svg|jpg|jpeg|png|gif)$/);
    if (match) return `${match[1]}.${match[2]}`;

    return last;
}

/**
 * Normalize a hashed Astro src back to its original source path.
 * Example: /_astro/photo123.abc123.jpg → /src/assets/images/photo123.jpg
 */
export function normalizeSrc(src: string): string {
    const match = src.match(/\/_astro\/([a-zA-Z0-9_-]+)\.[a-z0-9]+\.(svg|jpeg|jpg|png|gif)/);
    if (!match) return src;
    const baseName = match[1];
    const ext = match[2];
    return `/src/assets/images/${baseName}.${ext}`;
}

/**
 * Resolve an image module from a given src string.
 * Works with both hashed runtime paths and original source paths.
 */
export function resolveImageModule(rawPath: string | undefined) {
    if (!rawPath) return undefined;

    // ✅ Runtime-safe: hashed or static public paths
    if (rawPath.startsWith("/_astro/") || rawPath.startsWith("/assets/")) {
        return { default: rawPath };
    }

    // ✅ Build-time resolution
    const fileName = getFileName(rawPath);
    const matchedKey = Object.keys(imageModules).find((key) =>
        key.endsWith(`/${fileName}`)
    );

    if (!matchedKey) {
        console.warn("[resolveImageModule] No match for:", fileName);
        return undefined;
    }

    return imageModules[matchedKey];
}