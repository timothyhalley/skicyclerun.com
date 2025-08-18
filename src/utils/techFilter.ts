import type { CollectionEntry } from "astro:content";

const techFilter = ({ data }: CollectionEntry<"tech">) => {

  return data.type === 'TECH';
};

export default techFilter;
