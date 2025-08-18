import { defineCollection, z, type CollectionEntry } from "astro:content";
import { BLOG_TYPES } from "../constants/blogTypes";
import type { RefinementCtx } from "zod";

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
      .optional()
      .or(z.string())
      .superRefine((img: unknown, ctx: RefinementCtx) => {
        if (
          typeof img === "object" &&
          img !== null &&
          "width" in img &&
          "height" in img
        ) {
          const meta = img as { width: number; height: number };
          if (meta.width < 1200 || meta.height < 630) {
            ctx.addIssue({
              code: "custom",
              message: "OpenGraph image must be at least 1200 X 630 pixels!",
            });
          }
        }
      }),
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