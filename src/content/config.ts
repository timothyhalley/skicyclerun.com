import { defineCollection, z, type CollectionEntry } from "astro:content";
import { BLOG_TYPES } from "../constants/blogTypes";

const sharedSchema = ({ image }: any) =>
  z.object({
    type: z.enum(BLOG_TYPES),
    category: z.string().optional(),
    author: z.string().default("Tim H"),
    pubDatetime: z.date(),
    modDatetime: z.date().optional().nullable(),
    title: z.string(),
    featured: z.boolean().optional(),
    draft: z.boolean().optional(),
    tags: z.array(z.string()).default(["others"]),
    cover: image().optional(),
    ogImage: image()
      .refine(img => img.width >= 1200 && img.height >= 630, {
        message: "OpenGraph image must be at least 1200 X 630 pixels!",
      })
      .or(z.string())
      .optional(),
    description: z.string(),
    canonicalURL: z.string().optional(),
    slug: z.string().optional(),
    class: z.string().optional(),
    album: z.string().optional(),
  });

const blog = defineCollection({
  type: "content",
  schema: sharedSchema,
});

const tech = defineCollection({
  type: "content",
  schema: sharedSchema,
});

export const collections = { blog, tech };

export type PostMeta = CollectionEntry<"blog">;
export type TechMeta = CollectionEntry<"tech">;
export type AnyPostMeta = PostMeta | TechMeta;