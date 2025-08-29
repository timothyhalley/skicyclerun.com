import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { generateOgImageForPost } from "@utils/generateOgImages";
import { slugifyStr } from "@utils/slugify";

export async function getStaticPaths() {
  const tech = await getCollection("tech").then(p =>
    p.filter(({ data }) => !data.draft && !data.ogImage)
  );

  return tech.map((post) => ({
    params: { slug: slugifyStr(post.data.title).toLowerCase() },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const post = (props as { post: CollectionEntry<"tech"> }).post;
  const imageBuffer = await generateOgImageForPost(post as unknown as CollectionEntry<"blog">);
  return new Response(imageBuffer as BodyInit, {
    headers: { "Content-Type": "image/png" },
  });
};
