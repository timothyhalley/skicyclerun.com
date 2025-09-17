import type { APIRoute } from 'astro';
import { getEntry, type CollectionEntry } from 'astro:content';
import { verifyRequest, hasMinRole } from '@utils/cognito';

export const GET: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  if (!slug) return new Response('Missing slug', { status: 400 });

  // Verify Cognito tokens and derive role
  const user = await verifyRequest(request);
  // Example policy: basic for most, elevated for notes/* (adjust as needed)
  const requires: 'anonymous' | 'basic' | 'elevated' = slug.startsWith('notes/')
    ? 'elevated'
    : 'basic';
  if (!hasMinRole(user, requires)) return new Response('Unauthorized', { status: 401 });

  type BlogEntry = CollectionEntry<'blog'>;
  const post = await getEntry('blog', slug as BlogEntry['slug']);
  if (!post) return new Response('Post not found', { status: 404 });

  // Send the raw MDX body; your client loader renders it
  return new Response(post.body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
