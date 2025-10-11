import type { CollectionEntry } from "astro:content";
import getSortedPosts from "./getSortedPosts";

const getFilteredPosts = (posts: CollectionEntry<"blog">[], filterTypes: string[]) => {
  // First filter by types, then apply the existing sorting and filtering logic
  const filteredByType = posts.filter((post) =>
    filterTypes.includes(post.data.type)
  );

  return getSortedPosts(filteredByType);
};

export default getFilteredPosts;