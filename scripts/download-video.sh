#!/bin/bash

# Helper script to download YouTube videos for self-hosting
# Usage: ./scripts/download-video.sh <youtube-url> [output-name]

if [ -z "$1" ]; then
  echo "Usage: ./scripts/download-video.sh <youtube-url> [output-name]"
  echo "Example: ./scripts/download-video.sh 'https://youtube.com/watch?v=abc123' 'my-video'"
  exit 1
fi

URL="$1"
OUTPUT_NAME="${2:-%(title)s}"
OUTPUT_DIR="public/videos"

# Create videos directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
  echo "yt-dlp is not installed. Installing via brew..."
  brew install yt-dlp
fi

echo "Downloading video from: $URL"
echo "Output directory: $OUTPUT_DIR"

# Download best quality MP4
yt-dlp \
  -f 'bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]/best' \
  --merge-output-format mp4 \
  -o "$OUTPUT_DIR/${OUTPUT_NAME}.%(ext)s" \
  --write-thumbnail \
  --convert-thumbnails jpg \
  "$URL"

echo ""
echo "✅ Download complete!"
echo ""
echo "To use this video in your MDX file, update the frontmatter:"
echo ""
echo "---"
echo "layout: ../../layouts/MDXVideo.astro"
echo "title: Your Video Title"
echo "description: Your video description"
echo "videoSrc: /videos/${OUTPUT_NAME}.mp4"
echo "poster: /videos/${OUTPUT_NAME}.jpg  # Optional thumbnail"
echo "---"
