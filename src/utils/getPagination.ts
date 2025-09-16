import { SkiCycleRunConfig } from "skicyclerun.config";
import type { CollectionEntry } from "astro:content";

interface GetPaginationProps {
  posts: CollectionEntry<"blog">[];
  page?: string | number;
  isIndex?: boolean;
}

const getPagination = ({
  posts,
  page = 1,
  isIndex = false,
}: GetPaginationProps) => {
  const totalPages = Math.ceil(posts.length / SkiCycleRunConfig.postPerPage);
  const currentPage = isIndex ? 1 : Number(page);

  const lastPost = currentPage * SkiCycleRunConfig.postPerPage;
  const startPost = lastPost - SkiCycleRunConfig.postPerPage;
  const paginatedPosts = posts.slice(startPost, lastPost);

  // Generate URLs that match the /posts/page/[page] structure
  const nextUrl = totalPages > 1 && currentPage < totalPages ? `/posts/page/${currentPage + 1}` : undefined;
  
  // The previous URL from page 2 should go back to the root /posts
  const prevUrl = currentPage > 1 
    ? (currentPage - 1 === 1 ? '/posts' : `/posts/page/${currentPage - 1}`) 
    : undefined;

  return {
    totalPages,
    currentPage,
    paginatedPosts,
    prevUrl,
    nextUrl,
  };
};

export default getPagination;