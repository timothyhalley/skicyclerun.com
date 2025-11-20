import type { CollectionEntry } from 'astro:content';

const travelFilter = ({ data }: CollectionEntry<'blog'>) => {
  if (data.type === 'TRAVEL' || data.type === 'VLOG') return true;

  const hasCoordinates = typeof data.lat === 'number' && typeof data.lon === 'number';
  return hasCoordinates;
};

export default travelFilter;
