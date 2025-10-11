import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import getSortedPosts from "@utils/getSortedPosts";

export const prerender = true;

const stripMarkdown = (raw: string) =>
  raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>*_~`-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Create a compact search index for client-side filtering with a stable shape
export const GET: APIRoute = async () => {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const sorted = getSortedPosts(posts);

  const searchData = sorted.map(({ data, slug, body }) => {
    const tags = data.tags ?? [];
    const rawBody = body ? stripMarkdown(body) : "";
    const bodySnippet = rawBody.slice(0, 4000).toLowerCase();
    const slugStr = String(data.slug || slug);
    const lastSeg = slugStr.split("/").filter(Boolean).pop() || slugStr;
    const url = data.type === "TECH" ? `/tech/${lastSeg}` : `/posts/${slugStr}`;

    const searchFields = [
      data.title || "",
      data.description || "",
      tags.join(" "),
      data.author || "",
      data.type || "",
      slug || "",
      data.class || "",
      data.album || "",
      bodySnippet,
    ]
      .filter(Boolean)
      .join(" \n ")
      .toLowerCase();

    return {
      slug: slugStr,
      url,
      title: data.title,
      description: data.description ?? "",
      tags,
      pubDatetime: (
        data.pubDatetime ??
        data.modDatetime ??
        new Date()
      ).toString(),
      searchFields,
    };
  });

  return new Response(JSON.stringify(searchData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
