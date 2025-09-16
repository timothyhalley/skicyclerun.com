import Fuse from "fuse.js";
import { useEffect, useRef, useState, useMemo } from "react";
import Card from "@components/Card";

// Toggle this to true when you want on-page debug UI
const DEBUG_MODE = false;

interface FlatSearchItem {
  slug: string;
  title: string;
  description: string;
  type: string;
  author: string;
  pubDatetime: string | null; // ISO string
  modDatetime?: string | null;
  tags: string[];
  bodySnippet?: string; // optional plain-text excerpt of body
  body?: string; // optional full plain-text body
}

interface Props {
  searchList: FlatSearchItem[];
}

interface SearchResult {
  item: FlatSearchItem;
  score?: number;
}

const NOISE_REGEX = /^[bcdfghjklmnpqrstvwxyz]{5,}$/i;

function normalize(str: string) {
  return str.toLowerCase();
}

function tokenize(str: string) {
  return normalize(str)
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

export default function SearchBar({ searchList }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputVal, setInputVal] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [debug, setDebug] = useState<any>(null);

  const fuse = useMemo(
    () =>
      new Fuse(searchList, {
        keys: [
          { name: "title", weight: 0.45 }, // Title strong weight
          { name: "description", weight: 0.25 },
          { name: "tags", weight: 0.15 },
          { name: "bodySnippet", weight: 0.1 },
          { name: "body", weight: 0.05 },
        ],
        threshold: 0.2,
        distance: 60,
        ignoreLocation: true,
        includeScore: true,
        includeMatches: false,
        minMatchCharLength: 3,
        shouldSort: true,
        useExtendedSearch: false,
      }),
    [searchList]
  );

  const handleChange = (e: React.FormEvent<HTMLInputElement>) => {
    setInputVal(e.currentTarget.value);
  };

  useEffect(() => {
    const raw = inputVal.trim();
    if (!raw) {
      setResults([]);
      setDebug(null);
      return;
    }

    // Basic sanity guards
    if (raw.length < 2) {
      setResults([]);
      setDebug({ reason: "too-short" });
      return;
    }

    if (NOISE_REGEX.test(raw) && raw.length > 5) {
      setResults([]);
      setDebug({ reason: "noise-pattern" });
      return;
    }

    const query = normalize(raw);
    const terms = query.split(/\s+/).filter(Boolean);
    const singleWord = terms.length === 1;
    const fuseRaw = fuse.search(query);

    const filterResults = (rawItems: typeof fuseRaw) => {
      const filtered: SearchResult[] = [];
      for (const r of rawItems) {
        const item = r.item;
        const fields: string[] = [];
        fields.push(normalize(item.title));
        fields.push(normalize(item.description));
        if (item.tags) fields.push(...item.tags.map(normalize));
        if (item.bodySnippet) fields.push(normalize(item.bodySnippet));
        if (item.body) fields.push(normalize(item.body));

        // Each term must appear somewhere
        const allTermsPresent = terms.every(t =>
          fields.some(f => f.includes(t))
        );
        if (!allTermsPresent) continue;

        // Relevance tier (single word)
        let tier = 3; // 0 exact, 1 prefix, 2 infix, 3 none
        if (singleWord) {
          for (const f of fields) {
            const tokens = tokenize(f);
            for (const tk of tokens) {
              if (tk === query) {
                tier = 0;
                break;
              }
              if (tier > 1 && tk.startsWith(query)) tier = Math.min(tier, 1);
              if (tier > 2 && tk.includes(query)) tier = Math.min(tier, 2);
            }
            if (tier === 0) break;
          }
          if (tier === 3) continue; // discard
        }

        const substringHit = fields.some(f => f.includes(query));
        if (r.score !== undefined && r.score > 0.2 && !substringHit) continue;

        filtered.push({ item, score: r.score });
      }

      if (singleWord && filtered.length > 0) {
        const tierMap = filtered.map(fr => {
          const item = fr.item;
          const fields = [
            item.title,
            item.description,
            item.bodySnippet || "",
            item.tags.join(" "),
          ].map(normalize);

          let bestTier = 3;
          const tokensAll = fields.flatMap(f => tokenize(f));
          for (const tk of tokensAll) {
            if (tk === query) {
              bestTier = 0;
              break;
            }
            if (bestTier > 1 && tk.startsWith(query))
              bestTier = Math.min(bestTier, 1);
            if (bestTier > 2 && tk.includes(query))
              bestTier = Math.min(bestTier, 2);
          }

          return { fr, tier: bestTier };
        });

        const minTier = tierMap.reduce(
          (acc, cur) => Math.min(acc, cur.tier),
          3
        );
        return tierMap.filter(tm => tm.tier === minTier).map(tm => tm.fr);
      }

      return filtered;
    };

    const filtered = filterResults(fuseRaw);

    // Deduplicate by slug
    const seen = new Set<string>();
    const deduped: SearchResult[] = [];
    for (const r of filtered) {
      if (!seen.has(r.item.slug)) {
        seen.add(r.item.slug);
        deduped.push(r);
      }
    }

    setResults(deduped);
    const dbg = {
      q: query,
      fuseInitial: fuseRaw.length,
      returned: deduped.length,
      mode: "fuse-only",
    };
    setDebug(dbg);

    // Optional: log debug to console even when UI suppressed
    // if (!DEBUG_MODE) console.info("[search-debug]", dbg);
  }, [inputVal, fuse]);

  // Prefill from URL ?q=
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q) {
        setInputVal(q);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = inputRef.current.selectionEnd =
              q.length;
          }
        }, 0);
      }
    } catch {
      /* noop for SSR */
    }
  }, []);

  return (
    <>
      <label className="relative block">
        <span className="absolute inset-y-0 left-0 flex items-center pl-2 opacity-75">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="h-5 w-5"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M19.023 16.977a35.13 35.13 0 0 1-1.367-1.384c-.372-.378-.596-.653-.596-.653l-2.8-1.337A6.962 6.962 0 0 0 16 9c0-3.859-3.14-7-7-7S2 5.141 2 9s3.14 7 7 7c1.763 0 3.37-.66 4.603-1.739l1.337 2.8s.275.224.653.596c.387.363.896.854 1.384 1.367l1.358 1.392.604.646 2.121-2.121-.646-.604c-.379-.372-.885-.866-1.391-1.36zM9 14c-2.757 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5z"
            />
          </svg>
          <span className="sr-only">Search</span>
        </span>
        <input
          ref={inputRef}
          className="block w-full rounded border border-skin-fill border-opacity-40 bg-skin-fill py-3 pl-10 pr-3 placeholder:italic placeholder:text-opacity-75 focus:border-skin-accent focus:outline-none"
          placeholder="Search posts..."
          type="text"
          name="search"
          value={inputVal}
          onChange={handleChange}
          autoComplete="off"
        />
      </label>

      {inputVal.trim().length > 1 && (
        <div className="mt-6 text-sm">
          Found {results.length} {results.length === 1 ? "result" : "results"}{" "}
          for '{inputVal}'
          {DEBUG_MODE && debug && (
            <span className="ml-2 text-xs opacity-70">
              [{debug.mode}:{debug.returned}/{debug.fuseInitial}]
            </span>
          )}
        </div>
      )}

      <ul className="mt-4 space-y-4">
        {inputVal.trim().length > 1 && results.length === 0 ? (
          <li className="text-sm opacity-70">No results found.</li>
        ) : (
          results.map(r => {
            const fm = r.item;
            return (
              <Card
                key={fm.slug}
                href={`/posts/${fm.slug}`}
                frontmatter={
                  {
                    title: fm.title,
                    description: fm.description,
                    type: fm.type,
                    author: fm.author,
                    pubDatetime: fm.pubDatetime
                      ? new Date(fm.pubDatetime)
                      : new Date(),
                    modDatetime: fm.modDatetime
                      ? new Date(fm.modDatetime)
                      : undefined,
                    tags: fm.tags,
                  } as any
                }
              />
            );
          })
        )}
      </ul>

      {DEBUG_MODE && debug && (
        <pre className="mt-6 max-h-48 overflow-auto rounded bg-black/5 p-3 text-[10px] leading-tight dark:bg-white/5">
          {JSON.stringify(debug, null, 2)}
        </pre>
      )}
    </>
  );
}
