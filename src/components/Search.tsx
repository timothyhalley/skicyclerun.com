import Fuse from "fuse.js";
import { useEffect, useRef, useState, useMemo } from "react";
import Card from "@components/Card";

interface FlatSearchItem {
  slug: string;
  title: string;
  description: string;
  type: string;
  author: string;
  pubDatetime: string | null; // ISO string
  modDatetime?: string | null;
  tags: string[];
  bodySnippet?: string; // added body content excerpt
  searchText: string; // composite lowercased
}

interface Props {
  searchList: FlatSearchItem[];
}

interface SearchResult {
  item: FlatSearchItem;
  refIndex: number;
}

export default function SearchBar({ searchList }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputVal, setInputVal] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [aggregateCount, setAggregateCount] = useState<number | null>(null);

  const handleChange = (e: React.FormEvent<HTMLInputElement>) => {
    setInputVal(e.currentTarget.value);
  };

  const fuse = useMemo(
    () =>
      new Fuse(searchList, {
        keys: [
          { name: "title", weight: 3.5 },
          { name: "description", weight: 2 },
          { name: "tags", weight: 2 },
          { name: "bodySnippet", weight: 3 },
          { name: "searchText", weight: 1.5 }, // composite fallback
        ],
        includeMatches: false,
        ignoreLocation: true,
        minMatchCharLength: 2,
        threshold: 0.32,
        distance: 150,
        useExtendedSearch: true,
      }),
    [searchList]
  );

  useEffect(() => {
    const raw = inputVal.trim();
    if (raw.length > 1) {
      const query = raw.toLowerCase();
      const isShort = query.length <= 2;

      let fuseResults = fuse.search(query);

      // For very short tokens, reduce noise by ensuring token boundary checks later
      if (
        fuseResults.length === 0 &&
        !isShort &&
        query.split(/\s+/).length === 1
      ) {
        fuseResults = fuse.search(`${query} |'${query} ${query}*`);
      }

      let results: SearchResult[];
      if (fuseResults.length > 0) {
        results = (fuseResults as any).map((r: any) => ({
          item: r.item,
          refIndex: r.refIndex,
        }));
      } else {
        // Manual fallback over individual fields with priority order
        const contains = (text?: string) => !!text && text.includes(query);
        const infixMode = !isShort && query.length >= 4; // allow infix capture for queries like 'real'
        results = searchList
          .filter(
            p =>
              contains(p.title.toLowerCase()) ||
              contains(p.description?.toLowerCase()) ||
              p.tags.some(t => contains(t.toLowerCase())) ||
              contains(p.bodySnippet) ||
              (infixMode && contains(p.searchText))
          )
          .map((item, idx) => ({ item, refIndex: idx }));
      }

      // If short query, enforce word boundary to reduce false positives (e.g., 'da' in 'Canada')
      if (isShort) {
        // Short token strategy: collect docs that have ANY token starting with the query.
        const tokenStarts = (text: string) =>
          text
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .some(tok => tok.startsWith(query));

        // Expand candidate pool from full list (not only previous results) for better recall.
        const expanded = searchList.filter(
          p =>
            tokenStarts(p.title) ||
            tokenStarts(p.description) ||
            (p.bodySnippet && tokenStarts(p.bodySnippet)) ||
            p.tags.some(t => tokenStarts(t))
        );
        const expandedMap = new Map(expanded.map(p => [p.slug, p]));
        for (const r of results) {
          if (!expandedMap.has(r.item.slug))
            expandedMap.set(r.item.slug, r.item);
        }
        results = Array.from(expandedMap.values()).map((item, idx) => ({
          item,
          refIndex: idx,
        }));
      }

      // Post-filter for medium+ length single-word queries to ensure proper token relevance (e.g. 'dark')
      const singleWord = !query.includes(" ");
      if (singleWord && query.length >= 4) {
        const tokenize = (text: string) =>
          text
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter(Boolean);
        const scoreDoc = (item: FlatSearchItem) => {
          const fields = [
            item.title,
            item.description,
            item.bodySnippet || "",
            item.tags.join(" "),
          ];
          let exact = false,
            prefix = false,
            infix = false;
          for (const f of fields) {
            for (const tok of tokenize(f)) {
              if (tok === query) {
                exact = true;
                return { exact, prefix, infix };
              }
              if (!exact && tok.startsWith(query)) prefix = true;
              if (!exact && !prefix && tok.includes(query)) infix = true;
            }
          }
          return { exact, prefix, infix };
        };

        // Evaluate all candidate docs (not only current results) to ensure we don't miss an exact match.
        const candidates = new Map<
          string,
          { item: FlatSearchItem; score: number; tier: number }
        >();
        const addCandidate = (item: FlatSearchItem) => {
          if (candidates.has(item.slug)) return;
          const s = scoreDoc(item);
          // tier: 0 exact, 1 prefix, 2 infix, 3 none
          const tier = s.exact ? 0 : s.prefix ? 1 : s.infix ? 2 : 3;
          if (tier < 3) candidates.set(item.slug, { item, score: tier, tier });
        };
        // Seed with all items to evaluate; cheap given modest dataset size.
        for (const p of searchList) addCandidate(p);

        // Select best tier present
        let bestTier = 3;
        for (const c of candidates.values())
          if (c.tier < bestTier) bestTier = c.tier;
        const filtered = Array.from(candidates.values())
          .filter(c => c.tier === bestTier)
          .map((c, idx) => ({ item: c.item, refIndex: idx }));

        // Replace results with narrowed set only if we actually found matches
        if (filtered.length > 0) {
          results = filtered;
        }
      }

      // Deduplicate by slug
      const seen = new Set<string>();
      const deduped: SearchResult[] = [];
      for (const r of results) {
        if (!seen.has(r.item.slug)) {
          seen.add(r.item.slug);
          deduped.push(r);
        }
      }

      setSearchResults(deduped);
      // Aggregate count (same as dedup count for now, placeholder for future token-level metrics)
      setAggregateCount(deduped.length);
      setDebugInfo({
        mode: fuseResults.length > 0 ? "fuse" : "manual",
        q: query,
        count: deduped.length,
        raw: results.length,
      });
    } else {
      setSearchResults([]);
      setDebugInfo(null);
    }
  }, [inputVal, fuse, searchList]);

  useEffect(() => {
    const searchUrl = new URLSearchParams(window.location.search);
    const searchStr = searchUrl.get("q");
    if (searchStr) setInputVal(searchStr);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = inputRef.current.selectionEnd =
          searchStr?.length || 0;
      }
    }, 0);
  }, []);

  return (
    <>
      <label className="relative block">
        <span className="absolute inset-y-0 left-0 flex items-center pl-2 opacity-75">
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M19.023 16.977a35.13 35.13 0 0 1-1.367-1.384c-.372-.378-.596-.653-.596-.653l-2.8-1.337A6.962 6.962 0 0 0 16 9c0-3.859-3.14-7-7-7S2 5.141 2 9s3.14 7 7 7c1.763 0 3.37-.66 4.603-1.739l1.337 2.8s.275.224.653.596c.387.363.896.854 1.384 1.367l1.358 1.392.604.646 2.121-2.121-.646-.604c-.379-.372-.885-.866-1.391-1.36zM9 14c-2.757 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5z"></path>
          </svg>
          <span className="sr-only">Search</span>
        </span>
        <input
          className="block w-full rounded border border-skin-fill border-opacity-40 bg-skin-fill py-3 pl-10 pr-3 placeholder:italic placeholder:text-opacity-75 focus:border-skin-accent focus:outline-none"
          placeholder="Search for anything..."
          type="text"
          name="search"
          value={inputVal}
          onChange={handleChange}
          autoComplete="off"
          ref={inputRef}
        />
      </label>

      {inputVal.trim().length > 1 && (
        <div className="mt-8">
          Found {searchResults.length}{" "}
          {searchResults.length === 1 ? "result" : "results"} for '{inputVal}'
          {debugInfo && (
            <span className="ml-2 text-xs opacity-70">
              [{debugInfo.mode}:{debugInfo.count}]
            </span>
          )}
        </div>
      )}

      <ul>
        {inputVal.trim().length > 1 && searchResults.length === 0 ? (
          <li>No results found.</li>
        ) : (
          searchResults.map(({ item, refIndex }) => (
            <Card
              href={`/posts/${item.slug}`}
              frontmatter={
                {
                  title: item.title,
                  description: item.description,
                  type: item.type as any,
                  author: item.author,
                  pubDatetime: item.pubDatetime
                    ? new Date(item.pubDatetime)
                    : new Date(),
                  modDatetime: item.modDatetime
                    ? new Date(item.modDatetime)
                    : undefined,
                  tags: item.tags,
                } as any
              }
              key={`${refIndex}-${item.slug}`}
            />
          ))
        )}
      </ul>
    </>
  );
}
