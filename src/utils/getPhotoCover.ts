const imageModules = import.meta.glob<{ default: any }>('/src/assets/images/*');

export async function getPhotoCover(filename: string) {
  console.log('[getPhotoCover] Requested filename:', filename);

  const allPaths = Object.keys(imageModules);
  console.log('[getPhotoCover] Available image paths:', allPaths);

  const entry = Object.entries(imageModules).find(([path]) =>
    path.endsWith(`/${filename}`)
  );
  if (entry) {
    console.log('[getPhotoCover] Found image path:', entry[0]);
    const mod = await entry[1]();
    return mod.default;
  }
  // Fallback to a default image if not found
  const fallback = Object.entries(imageModules).find(([path]) =>
    path.endsWith('/default-cover.svg')
  );
  if (fallback) {
    console.warn('[getPhotoCover] Using fallback image for:', filename);
    const mod = await fallback[1]();
    return mod.default;
  }
  console.error('[getPhotoCover] No image found for:', filename);
  return null;
}