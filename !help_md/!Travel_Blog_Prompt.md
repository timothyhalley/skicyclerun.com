# Travel Blog Generator — LLM Prompt

Use this prompt with any capable LLM (GitHub Copilot, ChatGPT, Claude, Gemini, Perplexity, etc.).
Paste the prompt, then paste or attach your JSON data immediately after.

---

> **Philosophy:** This prompt produces a _grouped narrative summary_, not a per-photo breakdown.
> Photos taken near the same location are clustered into one section. The writing is clean,
> conversational, and highlight-driven — like a good travel piece, not a GPS log.

---

## Prompt

```text
You are a travel writer. I will give you a JSON array of photo entries, each with
GPS coordinates and optional timestamps or notes. Your job is to write a short,
engaging travel blog post summarising the collection — not a per-photo breakdown.

STEP 1 — CLUSTER
Group the entries by location. Entries within roughly 2–5 km of each other
(or sharing an obvious place name) belong to the same section. Use your geographic
knowledge to identify the place: city, beach, trail, landmark, national park, etc.

STEP 2 — WRITE ONE SECTION PER CLUSTER
For each cluster write a single flowing section with two parts:

  Context (2–4 sentences)
  A quick highlight of what makes this place interesting — geography, nature,
  history, or culture. Keep it factual and vivid. Think: what would a good
  guidebook say in a paragraph?

  Narrative (2–4 sentences)
  A loose, first-person observation about being there. Draw on any "notes" in
  the data if present. Keep it warm and conversational, not encyclopaedic.

STEP 3 — TRAVEL GAPS (only if useful)
If two clusters are far apart (different city, region, or country), add a single
sentence between sections noting the rough distance or journey — only when it
adds meaningful context. Skip it for short hops.

FORMATTING
- H2 (##) for each location: ## Place Name — Region, Country
- No sub-headers, no bold labels, no bullet lists within sections
- End with a brief ## Closing Note (2–3 sentences, reflective, not a list)
- Output clean Markdown only, no preamble before the first ## header

TONE
Concise and readable. Think magazine travel column, not GPS log or Wikipedia.
If you don't recognise a coordinate precisely, name the nearest known place and
write from there — do not flag uncertainty unless it materially affects the narrative.

I will now provide the JSON.
```

---

## JSON Input Format

Paste your data after the prompt. Fields recognised:

| Field       | Aliases accepted                          |
| ----------- | ----------------------------------------- |
| `lat`       | `latitude`, `y`                           |
| `lon`       | `longitude`, `lng`, `x`                   |
| `timestamp` | `time`, `datetime`, `date`, `recorded_at` |
| `name`      | `title`, `label`, `place`                 |
| `notes`     | `description`, `memo`, `comment`          |

Minimal example:

```json
[
  { "lat": -33.8908, "lon": 151.2743, "name": "Bondi Beach" },
  { "lat": -33.8915, "lon": 151.2762 },
  { "lat": -33.8601, "lon": 151.2058, "name": "Sydney CBD" }
]
```

---

## Tips

- **Copilot Chat**: paste prompt then JSON in the same message, or reference a `.json` file in your workspace.
- **ChatGPT / Claude / Gemini**: strong geographic knowledge, works well out of the box.
- **Perplexity**: add "search for current details about each location" to get live context for recent or niche spots.
- For large collections (200+ points), pre-filter duplicates and low-accuracy points before pasting.

---

## Output Example

```markdown
## Bondi Beach — Sydney, New South Wales, Australia

One of the world's most recognisable stretches of sand, Bondi curves for about a
kilometre between two sandstone headlands. The beach sits within Waverley Council
and has been a public bathing reserve since 1882 — one of the first in Australia —
drawing swimmers, surfers, and the annual Sculpture by the Sea coastal walk.

The eastern suburbs light was doing its thing: that flat late-afternoon gold that
makes everything look slightly more cinematic than it has any right to. We walked
the clifftop path south toward Coogee, stopped for coffee, watched a pod of
dolphins work the break.

## Sydney CBD — New South Wales, Australia

...
```
