import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { generateOgImageForPost } from "@utils/generateOgImages";
import { slugifyStr } from "@utils/slugify";
import { siteOrigin } from "@utils/getSiteOrigin";

export async function getStaticPaths() {
  const tech = await getCollection("tech").then(p =>
    p.filter(({ data }) => !data.draft && !data.ogImage)
  );
  console.log("DEGUG TECH OG_IMG: ", tech.map(tech => slugifyStr(tech.data.title)));
  return tech.map((post) => ({
    params: { slug: slugifyStr(post.data.title).toLowerCase() },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const post = (props as { post: CollectionEntry<"blog" | "tech"> }).post;
  const imageBuffer = await generateOgImageForPost(post as CollectionEntry<"blog">, siteOrigin());
  return new Response(imageBuffer.buffer as ArrayBuffer, {
    headers: { "Content-Type": "image/png" },
  });
};
