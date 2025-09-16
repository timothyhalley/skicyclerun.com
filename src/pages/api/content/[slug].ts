import type { APIRoute } from 'astro';
import { getEntry, type CollectionEntry } from 'astro:content';
import { Amplify } from 'aws-amplify';
import outputs from '@config/amplify_outputs.json';
import { runWithAmplifyServerContext } from '@utils/amplify-server';
import { getCurrentUser } from 'aws-amplify/auth/server';

// Configure Amplify for SSR in this route (idempotent)
Amplify.configure(outputs, { ssr: true });

export const GET: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  if (!slug) return new Response('Missing slug', { status: 400 });

  const cookieHeader = request.headers.get('cookie');

  return runWithAmplifyServerContext({
    cookieHeader,
    operation: async contextSpec => {
      try {
        await getCurrentUser(contextSpec);
      } catch {
        return new Response('Unauthorized', { status: 401 });
      }

      type BlogEntry = CollectionEntry<'blog'>;
      const post = await getEntry('blog', slug as BlogEntry['slug']);
      if (!post) return new Response('Post not found', { status: 404 });

      // Send the raw MDX body; your client loader renders it
      return new Response(post.body, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    },
  });
};
