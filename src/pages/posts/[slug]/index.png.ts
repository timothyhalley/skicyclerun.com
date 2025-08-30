import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { generateOgImageForPost } from "@utils/generateOgImages";
import { slugifyStr } from "@utils/slugify";
import { siteOrigin } from "@utils/getSiteOrigin";

export async function getStaticPaths() {
  const posts = await getCollection("blog").then(p =>
    p.filter(({ data }) => !data.draft && !data.ogImage)
  );
  console.log("DEGUG BLOG  OG_IMG: ", posts.map(post => slugifyStr(post.data.title)));
  return posts.map(post => ({
    params: { slug: slugifyStr(post.data.title).toLowerCase() },
    props: post,
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const post = (props as { post: CollectionEntry<"blog"> }).post || (props as CollectionEntry<"blog">);
  const imageBuffer = await generateOgImageForPost(post, siteOrigin());
  return new Response(imageBuffer.buffer as ArrayBuffer, {
    headers: { "Content-Type": "image/png" },
  });
};
