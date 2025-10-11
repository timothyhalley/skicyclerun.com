import type { CollectionEntry } from "astro:content";
import { slugifyStr } from "./slugify";
import { SkiCycleRunConfig } from "../skicyclerun.config";
import postFilter from "./postFilter";

export interface PostPageProps {
  post?: CollectionEntry<"blog">;
  page?: {
    data: CollectionEntry<"blog">[];
    currentPage: number;
    totalPages: number;
    url: {
      prev?: string;
      next?: string;
    };
  };
}

export function generatePostStaticPaths(
  posts: CollectionEntry<"blog">[],
  filterTypes: string[] = [],
  _basePath: string = ""
) {
  const isDev = import.meta.env.DEV;
  const debug = (...args: any[]) => {
    if (isDev) console.log("[generatePostStaticPaths]", ...args);
  };

  debug("START", { totalPosts: posts?.length ?? 0, filterTypes });

  // Apply same filtering and sorting as the index page does via getFilteredPosts/getSortedPosts
  // 1. Filter by type
  const typeFiltered = filterTypes.length > 0 
    ? posts.filter((post) => filterTypes.includes(post.data.type))
    : posts;
  
  // 2. Filter by draft/scheduling (postFilter)
  const published = typeFiltered.filter(postFilter);
  
  // 3. Sort by date (newest first) - CRITICAL for pagination consistency
  const filteredPosts = published.sort(
    (a, b) =>
      Math.floor(
        new Date(b.data.modDatetime ?? b.data.pubDatetime).getTime() / 1000
      ) -
      Math.floor(
        new Date(a.data.modDatetime ?? a.data.pubDatetime).getTime() / 1000
      )
  );

  debug("FILTERED", { 
    filteredCount: filteredPosts.length, 
    typeFilteredCount: typeFiltered.length,
    publishedCount: published.length,
    originalCount: posts.length 
  });

  // Simple pipeline: post detail routes and paginated listing routes.
  const postDetailPaths: any[] = filteredPosts
    .map((post) => {
      // Astro provides post.slug from frontmatter or generates from filename
      // Use it exactly as provided for full SEO control
      const slug = post.slug;
      
      if (isDev) {
        debug("SLUG", { id: post.id, slug });
      }
      
      // Only emit if slug exists and isn't the base path
      if (!slug || slug === "tech" || slug === "posts") return null;
      
      return {
        params: { slug },
        props: { post },
      };
    })
    .filter((p) => p !== null);

  // Pagination: generate /tech/2, /tech/3, etc. as slug-based routes
  const pageSize = SkiCycleRunConfig.postsPerPage;
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const paginatedPaths: any[] = [];
  
  debug("PAGINATION", { 
    postCount: filteredPosts.length, 
    pageSize, 
    totalPages,
    willGeneratePages: totalPages > 1 ? `2 to ${totalPages}` : 'none (only 1 page needed)'
  });
  
  // Only generate pagination for pages 2+, since page 1 is handled by index.astro
  for (let page = 2; page <= totalPages; page++) {
    const pageData = filteredPosts.slice((page - 1) * pageSize, page * pageSize);
    // Remove leading slash from basePath if present to avoid double slashes
    const basePath = _basePath.replace(/^\/+/, '');
    const prevUrl = page === 2 ? `/${basePath}` : `/${basePath}/${page - 1}`;
    const nextUrl = page < totalPages ? `/${basePath}/${page + 1}` : undefined;
    
    debug("PAGINATION PAGE", { page, prevUrl, nextUrl, basePath });
    
    paginatedPaths.push({
      params: { slug: String(page) },
      props: {
        page: {
          data: pageData,
          currentPage: page,
          totalPages,
          url: {
            // Page 2 -> prev is /posts (page 1), Page 3 -> prev is /posts/2, etc.
            prev: prevUrl,
            next: nextUrl,
          },
        },
      },
    });
  }

  debug("DONE", {
    postDetailCount: postDetailPaths.length,
    paginatedCount: paginatedPaths.length,
    postSlugs: postDetailPaths.filter((p) => p?.params?.slug).map((p) => p.params.slug),
    paginatedPages: paginatedPaths.map((p) => `${_basePath}/${p.params.slug}`),
  });
  return [...postDetailPaths, ...paginatedPaths];
}