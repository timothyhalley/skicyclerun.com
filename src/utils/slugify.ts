// Deterministic SEO slug normalizer: no randomness, no global state.
// - lowercases
// - strips accents/diacritics
// - replaces non-alphanumerics with '-'
// - collapses multiple '-' and trims leading/trailing '-'
export const slugifyStr = (str: string) => {
	if (!str) return "";
	const s = str
		.toString()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/-{2,}/g, "-")
		.replace(/^-+|-+$/g, "");
	return s;
};

export const slugifyAll = (arr: string[]) => arr.map((str) => slugifyStr(str));

// Astro v6 (glob loader): post.slug no longer exists.
// Use frontmatter slug override if set, otherwise derive from post.id (strip extension).
export const getPostSlug = (post: { id: string; data: { slug?: string } }) =>
  post.data.slug ?? post.id.replace(/\.mdx?$/, "");
