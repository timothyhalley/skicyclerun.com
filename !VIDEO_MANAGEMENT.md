# Video Management

This project supports **both YouTube embeds and self-hosted videos** with automatic fallback.

## How It Works

The `MDXVideo.astro` layout checks for videos in this priority order:

1. **`videoSrc`** (self-hosted) - If present, uses HTML5 video player
2. **`videoID`** (YouTube) - If no videoSrc, embeds YouTube video
3. **Error message** - If neither is provided

This means you can:

- ✅ Host your own videos for full control
- ✅ Use YouTube videos (yours or others) as fallback
- ✅ Mix both in your content library
- ✅ Migrate gradually from YouTube to self-hosted

## Quick Examples

### Using YouTube Video (Current Montreal Post)

```yaml
---
layout: "@layouts/MDXVideo.astro"
title: "Montreal Architecture"
videoID: "5JL6R62X0Dw" # YouTube video ID
---
```

**Result:** YouTube embed with astro-embed (lite-youtube, privacy-friendly)

### Using Self-Hosted Video

```yaml
---
layout: "@layouts/MDXVideo.astro"
title: "Montreal Architecture"
videoSrc: "/videos/montreal-architecture.mp4" # Self-hosted
poster: "/videos/montreal-architecture.jpg" # Optional thumbnail
---
```

**Result:** HTML5 video player with theme-aware styling

### Dual Support (Fallback Chain)

```yaml
---
layout: "@layouts/MDXVideo.astro"
title: "Montreal Architecture"
videoSrc: "/videos/montreal-architecture.mp4" # Preferred
videoID: "5JL6R62X0Dw" # Fallback (not used if videoSrc exists)
poster: "/videos/montreal-architecture.jpg"
---
```

**Result:** Uses self-hosted video; YouTube ignored (but available as backup)

## Self-Hosted Videos (Recommended)

### Benefits:

- ✅ **Complete control** over styling and player appearance
- ✅ **No tracking** - No YouTube analytics or cookies
- ✅ **Theme-aware** - Perfect integration with dark/light modes
- ✅ **Better performance** - No external iframe overhead
- ✅ **Consistent experience** - Works with ad blockers

### Downloading Videos

Use the provided script to download YouTube videos:

```bash
# Download with auto-generated name
./scripts/download-video.sh 'https://youtube.com/watch?v=VIDEO_ID'

# Download with custom name
./scripts/download-video.sh 'https://youtube.com/watch?v=VIDEO_ID' 'my-video'
```

The script will:

1. Download the best quality MP4 (up to 1080p)
2. Save it to `public/videos/`
3. Download the thumbnail as a poster image
4. Show you the frontmatter to use

### Using Self-Hosted Videos

In your MDX file frontmatter:

```yaml
---
layout: ../../layouts/MDXVideo.astro
title: My Video Title
description: Video description
videoSrc: /videos/my-video.mp4
poster: /videos/my-video.jpg # Optional: thumbnail/poster image
---
```

## YouTube Embeds (Fallback)

If you want to keep using YouTube:

```yaml
---
layout: ../../layouts/MDXVideo.astro
title: My Video Title
description: Video description
videoID: abc123xyz # YouTube video ID
---
```

## Priority

The layout checks in this order:

1. `videoSrc` (self-hosted) - **Used if present**
2. `videoID` (YouTube) - Fallback if no videoSrc
3. Error message if neither is provided

## Video Format Support

The HTML5 video player supports:

- MP4 (H.264) - Best compatibility
- WebM (VP9) - Optional, for better compression

The layout automatically tries both formats if available.

## Storage Considerations

- Videos are stored in `public/videos/`
- They will be deployed with your site
- Consider video file sizes for hosting costs
- 1080p videos are typically 50-200MB depending on length
- Optimize with tools like HandBrake if needed

## Converting Existing Posts

To migrate from YouTube to self-hosted:

1. Download the video: `./scripts/download-video.sh <url> <name>`
2. Update frontmatter: change `videoID: abc123` to `videoSrc: /videos/<name>.mp4`
3. Optionally add: `poster: /videos/<name>.jpg`
4. Test locally, then deploy

## Manual Download (Alternative)

If you prefer manual control:

```bash
# Install yt-dlp
brew install yt-dlp

# Download video
yt-dlp -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]' \
  --merge-output-format mp4 \
  -o 'public/videos/%(title)s.%(ext)s' \
  'https://youtube.com/watch?v=VIDEO_ID'
```
