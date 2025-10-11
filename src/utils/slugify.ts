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
