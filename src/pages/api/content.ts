import type { APIRoute } from 'astro';
import { getEntry, type CollectionEntry } from 'astro:content';
import { verifyRequest, hasMinRole } from '@utils/cognito';

export const GET: APIRoute = async ({ request }) => {
  const user = await verifyRequest(request);
  if (!hasMinRole(user, 'basic')) return new Response('Unauthorized', { status: 401 });

  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return new Response('Missing slug parameter', { status: 400 });

  type BlogEntry = CollectionEntry<'blog'>;
  const post = await getEntry('blog', slug as BlogEntry['slug']);
  if (!post) return new Response('Post not found', { status: 404 });

  return new Response(post.body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
