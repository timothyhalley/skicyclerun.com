import type { APIRoute } from 'astro';
import { getEntry, type CollectionEntry } from 'astro:content';
import { runWithAmplifyServerContext } from '@utils/amplify-server';
import { getCurrentUser } from 'aws-amplify/auth/server';

export const GET: APIRoute = async ({ request }) => {
  const response = await runWithAmplifyServerContext({
    request,
    operation: async (contextSpec: Parameters<typeof getCurrentUser>[0]): Promise<Response> => {
      // 1) Auth check
      try {
        await getCurrentUser(contextSpec);
      } catch {
        return new Response('Unauthorized', { status: 401 });
      }

      // 2) Read slug
      const url = new URL(request.url);
      const slug = url.searchParams.get('slug');
      if (!slug) {
        return new Response('Missing slug parameter', { status: 400 });
      }

      // 3) Load entry using correct typing for the blog collection slug
      type BlogEntry = CollectionEntry<'blog'>;
      const post = await getEntry('blog', slug as BlogEntry['slug']);
      if (!post) {
        return new Response('Post not found', { status: 404 });
      }

      // 4) Return raw MDX; client is responsible for rendering
      return new Response(post.body, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    },
  });

  return response as Response;
};
