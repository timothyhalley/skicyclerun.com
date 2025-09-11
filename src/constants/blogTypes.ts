export const BLOG_TYPES = ["BLOG", "VLOG", "TECH", "NOTES", "TRAVEL", "BETA"] as const;
export type BlogType = typeof BLOG_TYPES[number];

export const BLOG_TYPE_META: Record<BlogType, { title: string; description: string }> = {
  BLOG:   { title: "Blog Posts",   description: "All blog articles and stories." },
  VLOG:   { title: "Vlogs",        description: "Video logs and adventures." },
  TECH:   { title: "Tech Posts",   description: "Technical deep-dives and tutorials." },
  NOTES:  { title: "Notes",        description: "Quick notes and thoughts." },
  TRAVEL: { title: "Travel Logs",  description: "Travel stories and guides." },
  BETA:   { title: "Beta Content", description: "Experimental or early-access posts." },
};