// API client for protected content from API Gateway

export interface ProtectedPost {
  slug: string;
  title: string;
  summary: string;
  requiredGroups: string[];
  s3Key?: string;
}

export interface PostContent {
  slug: string;
  title: string;
  content: string;
  metadata: {
    summary: string;
    requiredGroups: string[];
    s3Key?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const API_BASE_URL = "https://api.skicyclerun.com/dev";

class ProtectedApiClient {
  private getAuthHeaders(): Record<string, string> {
    // Use ID token for Cognito JWT authorization (not access token)
    const token = localStorage.getItem("cognito_id_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: "Authentication required",
            message: "Please log in to access this content",
          };
        }

        if (response.status === 403) {
          return {
            success: false,
            error: "Access denied",
            message: "You don't have permission to access this content",
          };
        }

        const errorText = await response.text().catch(() => "Unknown error");
        return {
          success: false,
          error: `HTTP ${response.status}`,
          message: errorText,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("API request failed:", error);
      return {
        success: false,
        error: "Network error",
        message:
          error instanceof Error ? error.message : "Failed to connect to API",
      };
    }
  }

  /**
   * Get list of protected posts (filtered by user groups)
   */
  async getProtectedPosts(): Promise<ApiResponse<ProtectedPost[]>> {
    return this.makeRequest<ProtectedPost[]>("/protected/posts");
  }

  /**
   * Get specific protected post content by slug
   */
  async getProtectedPost(slug: string): Promise<ApiResponse<PostContent>> {
    if (!slug) {
      return {
        success: false,
        error: "Invalid slug",
        message: "Post slug is required",
      };
    }

    return this.makeRequest<PostContent>(
      `/protected/posts/${encodeURIComponent(slug)}`
    );
  }

  /**
   * Check if user has access to a specific post without fetching content
   */
  async checkPostAccess(
    slug: string
  ): Promise<ApiResponse<{ hasAccess: boolean; requiredGroups: string[] }>> {
    if (!slug) {
      return {
        success: false,
        error: "Invalid slug",
        message: "Post slug is required",
      };
    }

    return this.makeRequest<{ hasAccess: boolean; requiredGroups: string[] }>(
      `/protected/posts/${encodeURIComponent(slug)}/access`
    );
  }
}

// Export singleton instance
export const protectedApi = new ProtectedApiClient();

// Helper functions for common operations
export async function getProtectedPosts(): Promise<ProtectedPost[]> {
  const response = await protectedApi.getProtectedPosts();
  if (response.success && response.data) {
    return response.data;
  }
  console.warn(
    "Failed to fetch protected posts:",
    response.error,
    response.message
  );
  return [];
}

export async function getProtectedPost(
  slug: string
): Promise<PostContent | null> {
  const response = await protectedApi.getProtectedPost(slug);
  if (response.success && response.data) {
    return response.data;
  }
  console.warn(
    `Failed to fetch protected post "${slug}":`,
    response.error,
    response.message
  );
  return null;
}

export async function hasPostAccess(slug: string): Promise<boolean> {
  const response = await protectedApi.checkPostAccess(slug);
  if (response.success && response.data) {
    return response.data.hasAccess;
  }
  return false;
}

/**
 * Filter posts based on user's current auth state
 * This is a client-side fallback for when API filtering isn't available
 */
export function filterPostsByUserGroups(
  posts: ProtectedPost[],
  userGroups: string[]
): ProtectedPost[] {
  return posts.filter((post) => {
    // If no groups required, post is public
    if (!post.requiredGroups || post.requiredGroups.length === 0) {
      return true;
    }

    // Check if user has any of the required groups
    return post.requiredGroups.some((requiredGroup) =>
      userGroups.includes(requiredGroup)
    );
  });
}
