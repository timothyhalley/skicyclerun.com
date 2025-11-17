export interface SearchPost {
  title: string;
  description?: string;
  tags: string[];
  slug: string;
  url: string;
  pubDatetime: string;
  searchFields: string;
}

export class SearchEngine {
  private allPosts: SearchPost[] = [];
  private isLoading = true;

  async loadPostsData(): Promise<void> {
    try {
      const response = await fetch("/search/posts.json");
      this.allPosts = await response.json();
      console.debug(
        "[search] Loaded",
        this.allPosts.length,
        "posts for search",
      );
      this.isLoading = false;
    } catch (err) {
      console.error("[search] Failed to load posts data:", err);
      this.isLoading = false;
    }
  }

  isLoadingData(): boolean {
    return this.isLoading;
  }

  filterPosts(query: string): SearchPost[] {
    if (!query) return [];

    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    console.debug("[search] Filtering posts with terms:", terms);

    // Filter posts where ALL terms have at least a prefix or substring hit
    const filtered = this.allPosts.filter((post) =>
      terms.every((t) => {
        return (
          post.searchFields.includes(t) ||
          post.searchFields.split(/\s+/).some((w) => w.startsWith(t))
        );
      }),
    );

    console.debug(
      "[search] Found",
      filtered.length,
      "results for q='" + query + "'",
    );

    return filtered;
  }

  paginatePosts(
    posts: SearchPost[],
    page: number,
    pageSize = 10,
  ): {
    items: SearchPost[];
    currentPage: number;
    totalPages: number;
  } {
    const totalPages = Math.max(Math.ceil(posts.length / pageSize), 1);
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const start = (currentPage - 1) * pageSize;
    const items = posts.slice(start, start + pageSize);

    return { items, currentPage, totalPages };
  }

  renderResultsHTML(
    posts: SearchPost[],
    currentPage: number,
    totalPages: number,
  ): string {
    let html =
      '<ul id="search-results" class="mt-6 mx-auto max-w-3xl list-none p-0 pt-4">';

    posts.forEach((post) => {
      const title = post.title || "Untitled";
      const description = post.description || "";
      const url = post.url || "#";
      const slug = post.slug || "";
      const pubDatetime = post.pubDatetime;
      const tags = post.tags || [];

      const dateStr = new Date(pubDatetime).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      html += `
        <li class="search-result border-b border-skin-line pb-2 mb-2" data-slug="${slug}">
          <a href="${url}" class="block no-underline text-inherit">
            <h3 class="text-lg font-bold text-skin-accent mb-2 hover:underline">${title}</h3>
            ${
              description
                ? `<p class="text-base text-skin-base opacity-90 ml-4 mb-2 leading-6">${description}</p>`
                : ""
            }
            <div class="flex items-center gap-2 text-sm text-skin-base opacity-70 ml-4">
              <time datetime="${pubDatetime}">${dateStr}</time>
              ${
                tags.length > 0
                  ? `<span>•</span><span class="italic">${tags
                      .slice(0, 3)
                      .join(", ")}</span>`
                  : ""
              }
            </div>
          </a>
        </li>
      `;
    });

    html += "</ul>";

    // Add pagination if needed
    if (totalPages > 1) {
      html +=
        '<div class="mx-auto mt-8 pt-6 border-t border-skin-line flex justify-between items-center max-w-3xl">';
      if (currentPage > 1) {
        html += `<button class="pagination-prev px-5 py-2 rounded-md bg-skin-accent text-skin-inverted font-medium hover:opacity-90 transition-opacity">← Previous</button>`;
      } else {
        html += "<span></span>";
      }
      html += `<span class="text-skin-base opacity-70 font-medium">Page ${currentPage} of ${totalPages}</span>`;
      if (currentPage < totalPages) {
        html += `<button class="pagination-next px-5 py-2 rounded-md bg-skin-accent text-skin-inverted font-medium hover:opacity-90 transition-opacity">Next →</button>`;
      } else {
        html += "<span></span>";
      }
      html += "</div>";
    }

    return html;
  }
}
