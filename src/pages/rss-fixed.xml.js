import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { SkiCycleRunConfig } from "../skicyclerun.config";

export const prerender = true;

export async function GET(context) {
  try {
    // Get all blog posts
    const posts = await getCollection("blog");

    // Filter out drafts in production
    const publishedPosts = posts.filter((post) => !post.data.draft);

    // Sort posts by publication date (newest first)
    const sortedPosts = publishedPosts.sort(
      (a, b) =>
        new Date(b.data.pubDatetime).getTime() -
        new Date(a.data.pubDatetime).getTime()
    );

    // Format each post for RSS - ensuring required fields are present
    const rssItems = sortedPosts.map((post) => {
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDatetime,
        link: `/blog/${post.slug || post.id}/`,
        categories: post.data.tags,
        author: post.data.author,
      };
    });

    // Return formatted RSS feed
    return rss({
      // Use your centralized config
      title: SkiCycleRunConfig.title,
      description: SkiCycleRunConfig.description,
      site: context.site,

      // Add custom RSS feed metadata
      customData: `
        <language>${SkiCycleRunConfig.locale.lang}</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <generator>Astro</generator>
        <copyright>Copyright ${new Date().getFullYear()} ${
        SkiCycleRunConfig.author
      }</copyright>
        <atom:link href="${
          context.site
        }rss.xml" rel="self" type="application/rss+xml"/>
      `,

      // Use our correctly formatted items
      items: rssItems,

      // Add namespaces for additional RSS features
      xmlns: {
        atom: "http://www.w3.org/2005/Atom",
        dc: "http://purl.org/dc/elements/1.1/",
        content: "http://purl.org/rss/1.0/modules/content/",
      },
    });
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    throw error;
  }
}
