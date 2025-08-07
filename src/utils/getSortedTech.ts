import type { CollectionEntry } from "astro:content";
import techFilter from "./techFilter";

const getSortedPosts = (posts: CollectionEntry<"tech">[]) => {
  return posts
    .filter(techFilter)
    .sort(
      (a, b) =>
        Math.floor(
          new Date(b.data.modDatetime ?? b.data.pubDatetime).getTime() / 1000
        ) -
        Math.floor(
          new Date(a.data.modDatetime ?? a.data.pubDatetime).getTime() / 1000
        )
    );
};

export default getSortedPosts;
