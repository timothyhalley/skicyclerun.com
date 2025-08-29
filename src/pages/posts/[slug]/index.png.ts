import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { generateOgImageForPost } from "@utils/generateOgImages";
import { slugifyStr } from "@utils/slugify";

export async function getStaticPaths() {
  const posts = await getCollection("blog").then(p =>
    p.filter(({ data }) => !data.draft && !data.ogImage)
  );
  console.log("DEGUG OG_IMG: ", posts.map(post => slugifyStr(post.data.title)));
  return posts.map(post => ({
    params: { slug: slugifyStr(post.data.title).toLowerCase() },
    props: post,
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const siteOrigin = import.meta.env.SITE ?? "https://skicyclerun.com";
  const png = await generateOgImageForPost(props as CollectionEntry<"blog">, siteOrigin);
  return new Response(png.buffer as ArrayBuffer, {
    headers: { "Content-Type": "image/png" },
  });
};
