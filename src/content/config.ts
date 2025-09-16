import { defineCollection, z, type CollectionEntry } from 'astro:content';
import { BLOG_TYPES } from '../constants/blogTypes';

// Making the schema more robust by making more fields optional.
// This prevents the entire build from crashing if a post is missing a field.
const blog = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      type: z.enum(BLOG_TYPES),
      author: z.string().default('Tim H'),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(['others']),
      description: z.string(),

      // Optional Fields that might be causing issues
      ogImage: image().optional(),
      cover: z.string().optional(),
      canonicalURL: z.string().optional(),
      slug: z.string().optional(),
      class: z.string().optional(),
      album: z.string().optional(),
      lat: z.number().optional(),
      lon: z.number().optional(),
      auth_required: z.boolean().optional(), // Assuming this might exist in some posts
    }),
});

export const collections = { blog };

export type PostMeta = CollectionEntry<'blog'>;
