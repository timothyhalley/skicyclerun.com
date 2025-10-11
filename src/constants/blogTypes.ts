export const BLOG_TYPES = ["BLOG", "VLOG", "TECH", "NOTES", "TRAVEL", "BETA"] as const;
export type BlogType = typeof BLOG_TYPES[number];

export type BlogSection = "posts" | "tech";

export const BLOG_TYPE_META: Record<BlogType, { 
  title: string; 
  description: string; 
  section: BlogSection;
}> = {
  BLOG:   { title: "Blog Posts",   description: "All blog articles and stories.", section: "posts" },
  VLOG:   { title: "Vlogs",        description: "Video logs and adventures.", section: "posts" },
  TECH:   { title: "Tech Posts",   description: "Technical deep-dives and tutorials.", section: "tech" },
  NOTES:  { title: "Notes",        description: "Quick notes and thoughts.", section: "posts" },
  TRAVEL: { title: "Travel Logs",  description: "Travel stories and guides.", section: "posts" },
  BETA:   { title: "Beta Content", description: "Experimental or early-access posts.", section: "tech" },
};

// Derived constants for filtering by section
export const TECH_TYPES: BlogType[] = (Object.entries(BLOG_TYPE_META) as [BlogType, typeof BLOG_TYPE_META[BlogType]][])
  .filter(([_, meta]) => meta.section === "tech")
  .map(([type]) => type);

export const POSTS_TYPES: BlogType[] = (Object.entries(BLOG_TYPE_META) as [BlogType, typeof BLOG_TYPE_META[BlogType]][])
  .filter(([_, meta]) => meta.section === "posts")
  .map(([type]) => type);

// Helper function to get section for a blog type
export function getBlogSection(type: BlogType): BlogSection {
  return BLOG_TYPE_META[type]?.section ?? "posts";
}