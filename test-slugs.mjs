import { getCollection } from "astro:content";
import { generatePostStaticPaths } from "./src/utils/generatePostStaticPaths.js";

async function testSlugGeneration() {
  console.log("--- Running Slug Generation Test ---");
  try {
    // This will be executed by Astro, so we can use astro:content
    const posts = await getCollection("blog");
    console.log(`Found ${posts.length} total posts.`);

    const paths = generatePostStaticPaths(posts, ["TECH", "TRAVEL", "BLOG", "VLOG", "NOTES"], "/");

    console.log("\n--- Generated Slugs ---");
    paths.forEach(p => {
      if (p.props.post) {
        console.log({
          slug: p.params.slug,
          file: p.props.post.id,
          frontmatterSlug: p.props.post.data.slug || "N/A",
        });
      }
    });
    console.log("---------------------------------");

  } catch (e) {
    console.error("Error during test:", e);
  }
}

testSlugGeneration();
