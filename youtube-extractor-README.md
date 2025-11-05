# YouTube Video Extractor - Standalone JavaScript Script

A standalone JavaScript (Node.js) script that extracts YouTube video information similar to yt-dlp. This script fetches video metadata, available formats, and direct download URLs without requiring the yt-dlp Python package.

## Features

- 🎥 Extract video metadata (title, author, duration, views, etc.)
- 📊 List all available video/audio formats with quality information
- 🔗 Get direct download URLs for each format
- 🎯 Support for multiple YouTube URL formats
- 🚀 Zero external dependencies (uses only Node.js built-in modules)
- 💻 Works on all platforms (Windows, Linux, macOS)

## Requirements

- Node.js 12.0 or higher (uses built-in `https`, `http`, and `url` modules only)

## Installation

No installation required! Just download the script and run it with Node.js.

```bash
# Make the script executable (Linux/macOS)
chmod +x youtube-extractor.js

# Or run directly with node
node youtube-extractor.js
```

## Usage

### Basic Usage

```bash
# Using a full YouTube URL
node youtube-extractor.js "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Using a video ID only
node youtube-extractor.js dQw4w9WgXcQ

# Using a youtu.be short URL
node youtube-extractor.js "https://youtu.be/dQw4w9WgXcQ"

# Using a YouTube Shorts URL
node youtube-extractor.js "https://www.youtube.com/shorts/dQw4w9WgXcQ"
```

### As a Node.js Module

You can also use the script as a module in your own Node.js applications:

```javascript
const { extractVideo, extractVideoId } = require('./youtube-extractor.js');

async function main() {
    try {
        const result = await extractVideo('dQw4w9WgXcQ');
        
        console.log('Title:', result.videoDetails.title);
        console.log('Formats:', result.formats.length);
        
        // Get the best quality format
        const bestFormat = result.formats
            .filter(f => f.hasVideo && f.hasAudio)
            .sort((a, b) => b.height - a.height)[0];
            
        console.log('Best format:', bestFormat.qualityLabel);
        console.log('Download URL:', bestFormat.url);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
```

## Output Example

```
Fetching video page: https://www.youtube.com/watch?v=dQw4w9WgXcQ

================================================================================
VIDEO INFORMATION
================================================================================
Title:        Rick Astley - Never Gonna Give You Up (Official Video)
Author:       Rick Astley
Channel ID:   UCuAXFkgsw1L7xaCfnd5JJOw
Duration:     3:33
View Count:   1,234,567,890
Rating:       N/A
Is Live:      No
Short Desc:   The official video for "Never Gonna Give You Up" by Rick Astley...

================================================================================
AVAILABLE FORMATS
================================================================================

--- Combined Video+Audio Formats ---

Format ID: 18
  Quality:     360p
  Type:        video/mp4; codecs="avc1.42001E, mp4a.40.2"
  Resolution:  640x360
  FPS:         30
  Bitrate:     500 kbps
  Size:        15.32 MB
  URL:         https://rr3---sn-5hne6nsk.googlevideo.com/videoplayback?expire=...

--- Video-Only Formats (No Audio) ---

Format ID: 137
  Quality:     1080p
  Type:        video/mp4; codecs="avc1.640028"
  Resolution:  1920x1080
  FPS:         30
  Bitrate:     2500 kbps
  Size:        45.67 MB

--- Audio-Only Formats ---

Format ID: 140
  Quality:     AUDIO_QUALITY_MEDIUM
  Type:        audio/mp4; codecs="mp4a.40.2"
  Sample Rate: 44100 Hz
  Channels:    2
  Bitrate:     128 kbps
  Size:        5.23 MB

================================================================================
EXTRACTION COMPLETE
================================================================================

Total formats found: 15
Note: URLs expire after a few hours. Use them promptly or fetch new ones.
```

## How It Works

The script mimics yt-dlp's approach by:

1. **Extracting the video ID** from various YouTube URL formats
2. **Fetching the YouTube watch page** with appropriate user agent headers
3. **Parsing the `ytInitialPlayerResponse`** JavaScript object from the HTML
4. **Extracting video metadata** (title, author, duration, views, etc.)
5. **Parsing available formats** from the streaming data
6. **Categorizing formats** into:
   - Combined video+audio formats
   - Video-only formats (require separate audio)
   - Audio-only formats

## Format Types

YouTube provides formats in different categories:

### Combined Formats
These contain both video and audio in a single file (typically lower quality):
- Format 18: 360p MP4
- Format 22: 720p MP4

### Adaptive Formats
These are separate streams that offer higher quality:

**Video-Only:**
- 1080p, 1440p, 2160p (4K) and higher
- Various codecs: H.264 (AVC), VP9, AV1

**Audio-Only:**
- Various bitrates: 48kbps, 128kbps, 256kbps
- Codecs: AAC, Opus

To download adaptive formats, you need to download video and audio separately and merge them using a tool like FFmpeg.

## Limitations

- **URL Expiration**: Direct download URLs expire after a few hours
- **Signature Decryption**: Does not handle cipher/signature decryption (works with non-protected videos)
- **DRM Content**: Cannot extract DRM-protected or age-restricted content
- **No Download**: This script only extracts information; it doesn't download videos
- **Rate Limiting**: Making too many requests may trigger YouTube's rate limiting

## Differences from yt-dlp

This script is a simplified version that:
- ✅ Extracts video metadata and format information
- ✅ Works without Python or external dependencies
- ✅ Provides direct download URLs when available
- ❌ Does not decrypt signatures (yt-dlp does this via JavaScript interpretation)
- ❌ Does not download videos (only provides URLs)
- ❌ Does not merge audio/video streams
- ❌ Does not support all yt-dlp features (subtitles, playlists, etc.)

## Use Cases

This script is useful for:
- Understanding how YouTube video extraction works
- Quick video information lookup
- Integration into JavaScript/Node.js applications
- Educational purposes
- Situations where Python/yt-dlp cannot be installed

## Downloading Videos

To actually download videos using the URLs this script provides:

### Using curl or wget:
```bash
# Get the URL from the script output
node youtube-extractor.js VIDEO_ID

# Download with curl
curl -o video.mp4 "URL_FROM_SCRIPT"

# Or with wget
wget -O video.mp4 "URL_FROM_SCRIPT"
```

### For adaptive formats (video+audio separate):
```bash
# Download video and audio
curl -o video.mp4 "VIDEO_URL"
curl -o audio.m4a "AUDIO_URL"

# Merge with FFmpeg
ffmpeg -i video.mp4 -i audio.m4a -c copy output.mp4
```

## Troubleshooting

### "Could not extract player response from page"
- The page structure may have changed
- Video might be age-restricted or private
- Try with a different video

### "Video is not playable"
- Video might be region-locked
- Video might require sign-in
- Video might be private or deleted

### URLs don't work / "403 Forbidden"
- URLs have expired (they're valid for a few hours)
- Re-run the script to get fresh URLs
- Some formats may require additional headers

## Contributing

This script can be extended with:
- Signature decryption support
- Subtitle extraction
- Playlist support
- Download functionality
- Format filtering and selection
- FFmpeg integration for merging streams

## Legal Notice

This script is for educational purposes. Ensure you have the right to download content and respect YouTube's Terms of Service. Do not use this tool to violate copyrights or download content you don't have permission to access.

## License

This script follows the same license as yt-dlp (Unlicense).

## Related Projects

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - The full-featured Python tool this script is inspired by
- [youtube-dl](https://github.com/ytdl-org/youtube-dl) - The original YouTube downloader
- [ytdl-core](https://github.com/fent/node-ytdl-core) - A more complete Node.js YouTube library

## Support

For issues with this script:
1. Ensure you have Node.js 12.0 or higher installed
2. Try with a different, publicly available video
3. Check that the video is not region-locked or age-restricted
4. Make sure you have internet connectivity

For full yt-dlp functionality, use the actual [yt-dlp](https://github.com/yt-dlp/yt-dlp) tool.
