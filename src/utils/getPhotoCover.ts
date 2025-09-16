import type { ImageMetadata } from 'astro';

const imageModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{png,jpg,jpeg,webp,avif,gif,svg}',
  { eager: true }
);

const DEFAULTS = [
  '/src/assets/images/default-cover.png',
  '/src/assets/images/default-cover.jpg',
];
let DEFAULT_COVER: ImageMetadata | null = null;
for (const p of DEFAULTS) {
  if (p in imageModules) {
    // @ts-ignore
    DEFAULT_COVER = imageModules[p].default;
    break;
  }
}

function matchByFilename(name: string | undefined | null): ImageMetadata | null {
  if (!name) return null;
  const target = name.split('/').pop();
  for (const [fullPath, mod] of Object.entries(imageModules)) {
    if (fullPath.endsWith(`/${target}`)) {
      // @ts-ignore
      return mod.default;
    }
  }
  return null;
}

export function getPhotoCover(name: string | undefined | null): ImageMetadata | null {
  return matchByFilename(name) || DEFAULT_COVER;
}