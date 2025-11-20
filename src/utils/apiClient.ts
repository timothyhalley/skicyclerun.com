export async function fetchProtectedContent({
  slug,
  idToken,
  requiredGroup,
}: {
  slug: string;
  idToken: string;
  requiredGroup?: string;
}) {
  const base =
    import.meta.env.PUBLIC_SKICYCLERUN_API || "https://api.skicyclerun.com/v2/";

  const url = new URL("/content", base);
  url.searchParams.set("slug", slug);
  if (requiredGroup) url.searchParams.set("requiredGroup", requiredGroup);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 403) throw new Error("Forbidden");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  return (await res.json()) as { html?: string; error?: string };
}
