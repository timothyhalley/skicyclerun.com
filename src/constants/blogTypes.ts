export const BLOG_TYPES = ["BLOG", "VLOG", "TECH", "GENERAL", "TRAVEL", "BETA"] as const;

export type BlogType = typeof BLOG_TYPES[number];