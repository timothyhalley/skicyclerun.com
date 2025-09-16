import type { CollectionEntry } from 'astro:content';

const travelFilter = ({ data }: CollectionEntry<'blog'>) => {
  return data.type === 'TRAVEL' || data.type === 'VLOG';
};

export default travelFilter;
