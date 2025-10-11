import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SkiCycleRunConfig } from "../skicyclerun.config";
import getSortedPosts from "@utils/getSortedPosts";

export const prerender = true;

export async function GET(context: { site: any }) {
  const posts = await getCollection("blog");
  const sortedPosts = getSortedPosts(posts);
  return rss({
    title: SkiCycleRunConfig.title,
    description: SkiCycleRunConfig.description,
    site: context.site,
    items: sortedPosts.map(({ data, slug }) => ({
      link: `posts/${slug}`,
      title: data.title,
      description: data.description,
      pubDate: new Date(data.pubDatetime),
    })),
  });
}
