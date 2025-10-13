# Crawler Management & SEO

## robots.txt Configuration

Location: `public/robots.txt`

### Strategy

Our `robots.txt` file balances three goals:

1. ✅ **Allow legitimate search engines** (Google, Bing, DuckDuckGo, etc.)
2. ❌ **Block AI training crawlers** (GPTBot, Claude, CCBot, etc.)
3. ❌ **Block aggressive SEO scrapers** (Ahrefs, Semrush, etc.)

### What's Allowed

- **Google** (Googlebot, Googlebot-Image, Googlebot-News)
- **Bing** (Bingbot)
- **Yahoo** (Slurp)
- **DuckDuckGo** (DuckDuckBot)
- **Baidu** (Baiduspider - Chinese search)
- **Yandex** (YandexBot - Russian search)
- **Facebook** (facebot - for link previews)
- **Internet Archive** (ia_archiver - for Wayback Machine)

### What's Blocked

#### AI Training Bots

- `GPTBot` - OpenAI's web crawler
- `ChatGPT-User` - ChatGPT browsing
- `CCBot` - Common Crawl (used for AI training)
- `anthropic-ai` / `Claude-Web` / `ClaudeBot` - Anthropic's crawlers
- `Google-Extended` - Google's AI training crawler
- `PerplexityBot` - Perplexity AI
- `Bytespider` - TikTok/ByteDance crawler
- `Omgilibot` - AI data scraper

#### SEO/Marketing Scrapers

- `SemrushBot` - SEO tool crawler
- `AhrefsBot` - Backlink checker
- `DotBot` - Moz/OpenSite Explorer
- `DataForSeoBot` - SEO data aggregator
- `PetalBot` - Huawei search
- `MJ12bot` - Majestic SEO
- `BLEXBot` - Link checker

### Protected Paths

Even for allowed bots, these paths are blocked:

- `/api/` - API endpoints (if any)
- `/.well-known/` - System files
- `/admin/` - Admin areas (if any)
- `/private/` - Private content (if any)
- `/_astro/` - Astro build artifacts

## Important Caveats

### robots.txt is NOT Security

⚠️ **Critical:** `robots.txt` is a **courtesy**, not a security measure:

- Bad actors **ignore** robots.txt
- AI companies often **disregard** robots.txt rules
- Crawlers can **lie** about their User-Agent
- Anyone can read your robots.txt file

### Real Protection Strategies

If you need real protection:

1. **Authentication** - Use AWS Cognito (already implemented)
2. **Rate Limiting** - Implement at CloudFront/Lambda level
3. **IP Blocking** - Block known bad actors via WAF
4. **User-Agent Filtering** - Server-side detection and blocking
5. **Honeypots** - Trap bots with hidden links
6. **CAPTCHA** - For sensitive actions

## AI Crawler Detection

Known AI crawler User-Agents (as of Oct 2025):

```
GPTBot/1.0
ChatGPT-User
CCBot/2.0
anthropic-ai
Claude-Web
ClaudeBot
Omgilibot
Bytespider
PerplexityBot
Diffbot
Google-Extended
facebookexternalhit (sometimes used for AI)
```

## Monitoring Crawler Activity

### Check Logs

If using CloudFront/CloudWatch, filter for:

```
User-Agent: *Bot*
User-Agent: *Crawler*
User-Agent: *Spider*
```

### Suspicious Patterns

Watch for:

- High request rates (> 100 req/min)
- Unusual paths (crawling `/_astro/` despite robots.txt)
- Rapid sequential requests
- Requests without proper headers

## Testing

### Validate robots.txt

```bash
# Check syntax
curl https://skicyclerun.dev/robots.txt

# Google's testing tool
https://www.google.com/webmasters/tools/robots-testing-tool
```

### Check if Bots Respect Rules

Monitor server logs for:

1. Blocked User-Agents still crawling
2. Crawling of disallowed paths
3. Ignoring crawl-delay directives

## Sitemap

Update the sitemap URL in `robots.txt` to match your domain:

```
Sitemap: https://skicyclerun.dev/sitemap-index.xml
```

Make sure your sitemap is generated and accessible!

## Optional: Advanced Protection

### 1. HTTP Headers

Add to your hosting config (CloudFront/Lambda):

```http
X-Robots-Tag: noai, noimageai
```

### 2. HTML Meta Tags

For extra protection, add to `<head>`:

```html
<meta name="robots" content="max-image-preview:large" />
<meta name="googlebot" content="index,follow" />
<meta name="GPTBot" content="noindex,nofollow" />
```

### 3. CloudFront Function

Block at edge:

```javascript
function handler(event) {
  var request = event.request;
  var userAgent = request.headers["user-agent"]?.value || "";

  var blockedBots = /GPTBot|CCBot|ClaudeBot|PerplexityBot/i;

  if (blockedBots.test(userAgent)) {
    return {
      statusCode: 403,
      statusDescription: "Forbidden",
      body: "Access Denied",
    };
  }

  return request;
}
```

## Resources

- [Google robots.txt Specification](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [OpenAI GPTBot Docs](https://platform.openai.com/docs/gptbot)
- [Common Crawl](https://commoncrawl.org/big-picture/faq/)
- [Dark Visitors](https://darkvisitors.com/) - AI crawler database

## Last Updated

October 10, 2025
