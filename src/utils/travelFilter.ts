import { SITE } from "@config";
import type { CollectionEntry } from "astro:content";

const travelFilter = ({ data }: CollectionEntry<"blog">) => {

  return data.type === 'TRAVEL';
};

export default travelFilter;
