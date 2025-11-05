#!/usr/bin/env node

/**
 * YouTube Video Extractor - Standalone JavaScript Script
 * 
 * This script extracts YouTube video information similar to yt-dlp.
 * It fetches video metadata, available formats, and download URLs.
 * 
 * Usage: node youtube-extractor.js <youtube_url_or_video_id>
 * Example: node youtube-extractor.js "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 * Example: node youtube-extractor.js dQw4w9WgXcQ
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Extract video ID from YouTube URL or return as-is if already an ID
 */
function extractVideoId(input) {
    // If it's already an 11-character video ID
    if (/^[0-9A-Za-z_-]{11}$/.test(input)) {
        return input;
    }

    try {
        const url = new URL(input);
        
        // Handle different YouTube URL formats
        if (url.hostname.includes('youtube.com')) {
            // Standard watch URL: youtube.com/watch?v=VIDEO_ID
            if (url.pathname === '/watch' && url.searchParams.has('v')) {
                return url.searchParams.get('v');
            }
            // Embed URL: youtube.com/embed/VIDEO_ID
            if (url.pathname.startsWith('/embed/')) {
                return url.pathname.split('/')[2];
            }
            // Short URL: youtube.com/v/VIDEO_ID
            if (url.pathname.startsWith('/v/')) {
                return url.pathname.split('/')[2];
            }
            // Shorts URL: youtube.com/shorts/VIDEO_ID
            if (url.pathname.startsWith('/shorts/')) {
                return url.pathname.split('/')[2];
            }
        }
        
        // Handle youtu.be short URLs
        if (url.hostname === 'youtu.be') {
            return url.pathname.substring(1).split('/')[0];
        }
    } catch (e) {
        // Not a valid URL, might be just the video ID
    }

    throw new Error('Invalid YouTube URL or video ID');
}

/**
 * Make an HTTPS request
 */
function httpsRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {},
            ...options
        };

        const req = protocol.request(requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data
                    });
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                }
            });
        });

        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

/**
 * Extract JSON from JavaScript variable assignment in HTML
 * Uses a more robust approach to handle nested objects with braces
 */
function extractJsonFromHtml(html, variableName) {
    // Try to find the variable assignment and extract JSON
    const patterns = [
        new RegExp(`var\\s+${variableName}\\s*=\\s*({[^;]+});`, 's'),
        new RegExp(`${variableName}\\s*=\\s*({[^;]+});`, 's'),
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
            // Try to parse the JSON by finding balanced braces
            let jsonStr = match[1].trim();
            let braceCount = 0;
            let endIndex = 0;
            
            for (let i = 0; i < jsonStr.length; i++) {
                if (jsonStr[i] === '{') braceCount++;
                if (jsonStr[i] === '}') braceCount--;
                if (braceCount === 0) {
                    endIndex = i + 1;
                    break;
                }
            }
            
            if (endIndex > 0) {
                jsonStr = jsonStr.substring(0, endIndex);
            }
            
            try {
                return JSON.parse(jsonStr);
            } catch (e) {
                continue;
            }
        }
    }
    return null;
}

/**
 * Fetch YouTube video page and extract player response
 */
async function fetchVideoInfo(videoId) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    
    console.log(`Fetching video page: ${url}`);
    
    const response = await httpsRequest(url, {
        headers: {
            // Using a recent Chrome user agent; update periodically to avoid detection
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            // Note: Node.js http(s) module doesn't automatically decompress, but YouTube typically 
            // returns uncompressed responses when compression isn't explicitly handled
        }
    });

    const html = response.body;

    // Extract ytInitialPlayerResponse
    let playerResponse = extractJsonFromHtml(html, 'ytInitialPlayerResponse');
    
    if (!playerResponse) {
        // Try alternative extraction method
        const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/s);
        if (match && match[1]) {
            try {
                playerResponse = JSON.parse(match[1]);
            } catch (e) {
                throw new Error('Failed to parse player response from page');
            }
        }
    }

    if (!playerResponse) {
        throw new Error('Could not extract player response from page');
    }

    return playerResponse;
}

/**
 * Parse format information
 */
function parseFormats(streamingData) {
    if (!streamingData) {
        return [];
    }

    const formats = [];
    
    // Add regular formats
    if (streamingData.formats) {
        formats.push(...streamingData.formats);
    }
    
    // Add adaptive formats (separate audio/video)
    if (streamingData.adaptiveFormats) {
        formats.push(...streamingData.adaptiveFormats);
    }

    return formats.map(format => {
        const mimeType = format.mimeType || '';
        const hasVideo = mimeType.includes('video');
        // Audio is present if mimeType includes 'audio' OR if there are audio codecs (mp4a, opus, vorbis, etc.)
        const hasAudio = mimeType.includes('audio') || 
                         /mp4a|opus|vorbis|aac/i.test(mimeType) ||
                         format.audioQuality !== undefined;
        
        return {
            itag: format.itag,
            url: format.url,
            mimeType: format.mimeType,
            bitrate: format.bitrate,
            width: format.width,
            height: format.height,
            fps: format.fps,
            quality: format.quality,
            qualityLabel: format.qualityLabel,
            audioQuality: format.audioQuality,
            audioSampleRate: format.audioSampleRate,
            audioChannels: format.audioChannels,
            contentLength: format.contentLength,
            approxDurationMs: format.approxDurationMs,
            hasVideo: hasVideo,
            hasAudio: hasAudio,
        };
    });
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format duration
 */
function formatDuration(ms) {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Main extraction function
 */
async function extractVideo(input) {
    try {
        const videoId = extractVideoId(input);
        console.log(`Video ID: ${videoId}\n`);

        const playerResponse = await fetchVideoInfo(videoId);

        // Check playability
        const playabilityStatus = playerResponse.playabilityStatus;
        if (playabilityStatus.status !== 'OK') {
            throw new Error(`Video is not playable: ${playabilityStatus.reason || playabilityStatus.status}`);
        }

        // Extract video details
        const videoDetails = playerResponse.videoDetails;
        const streamingData = playerResponse.streamingData;

        console.log('='.repeat(80));
        console.log('VIDEO INFORMATION');
        console.log('='.repeat(80));
        console.log(`Title:        ${videoDetails.title}`);
        console.log(`Author:       ${videoDetails.author}`);
        console.log(`Channel ID:   ${videoDetails.channelId}`);
        console.log(`Duration:     ${formatDuration(videoDetails.lengthSeconds * 1000)}`);
        // Keep view count as string to avoid precision loss with large numbers
        console.log(`View Count:   ${videoDetails.viewCount ? parseInt(videoDetails.viewCount).toLocaleString() : 'N/A'}`);
        console.log(`Rating:       ${videoDetails.averageRating || 'N/A'}`);
        console.log(`Is Live:      ${videoDetails.isLiveContent ? 'Yes' : 'No'}`);
        // Safely handle shortDescription which may be undefined or null
        const description = videoDetails.shortDescription || '';
        console.log(`Short Desc:   ${description.substring(0, 200)}${description.length > 200 ? '...' : ''}`);
        
        console.log('\n' + '='.repeat(80));
        console.log('AVAILABLE FORMATS');
        console.log('='.repeat(80));

        const formats = parseFormats(streamingData);
        
        if (formats.length === 0) {
            console.log('No formats available. Video may be protected or unavailable.');
            return;
        }

        // Group formats
        const videoFormats = formats.filter(f => f.hasVideo && f.hasAudio);
        const videoOnlyFormats = formats.filter(f => f.hasVideo && !f.hasAudio);
        const audioOnlyFormats = formats.filter(f => !f.hasVideo && f.hasAudio);

        if (videoFormats.length > 0) {
            console.log('\n--- Combined Video+Audio Formats ---');
            videoFormats.forEach(format => {
                console.log(`\nFormat ID: ${format.itag}`);
                console.log(`  Quality:     ${format.qualityLabel || format.quality}`);
                console.log(`  Type:        ${format.mimeType}`);
                console.log(`  Resolution:  ${format.width}x${format.height}`);
                console.log(`  FPS:         ${format.fps || 'N/A'}`);
                console.log(`  Bitrate:     ${(format.bitrate / 1000).toFixed(0)} kbps`);
                console.log(`  Size:        ${formatFileSize(format.contentLength)}`);
                if (format.url) {
                    console.log(`  URL:         ${format.url.substring(0, 100)}...`);
                }
            });
        }

        if (videoOnlyFormats.length > 0) {
            console.log('\n--- Video-Only Formats (No Audio) ---');
            videoOnlyFormats.forEach(format => {
                console.log(`\nFormat ID: ${format.itag}`);
                console.log(`  Quality:     ${format.qualityLabel || format.quality}`);
                console.log(`  Type:        ${format.mimeType}`);
                console.log(`  Resolution:  ${format.width}x${format.height}`);
                console.log(`  FPS:         ${format.fps || 'N/A'}`);
                console.log(`  Bitrate:     ${(format.bitrate / 1000).toFixed(0)} kbps`);
                console.log(`  Size:        ${formatFileSize(format.contentLength)}`);
            });
        }

        if (audioOnlyFormats.length > 0) {
            console.log('\n--- Audio-Only Formats ---');
            audioOnlyFormats.forEach(format => {
                console.log(`\nFormat ID: ${format.itag}`);
                console.log(`  Quality:     ${format.audioQuality}`);
                console.log(`  Type:        ${format.mimeType}`);
                console.log(`  Sample Rate: ${format.audioSampleRate} Hz`);
                console.log(`  Channels:    ${format.audioChannels || 'N/A'}`);
                console.log(`  Bitrate:     ${(format.bitrate / 1000).toFixed(0)} kbps`);
                console.log(`  Size:        ${formatFileSize(format.contentLength)}`);
            });
        }

        console.log('\n' + '='.repeat(80));
        console.log('EXTRACTION COMPLETE');
        console.log('='.repeat(80));
        console.log(`\nTotal formats found: ${formats.length}`);
        console.log('Note: URLs expire after a few hours. Use them promptly or fetch new ones.');
        
        return {
            videoId,
            videoDetails,
            formats
        };

    } catch (error) {
        console.error('\nError:', error.message);
        throw error;
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('YouTube Video Extractor - Standalone JavaScript Script');
        console.log('Similar to yt-dlp but in pure JavaScript (Node.js)\n');
        console.log('Usage: node youtube-extractor.js <youtube_url_or_video_id>');
        console.log('\nExamples:');
        console.log('  node youtube-extractor.js "https://www.youtube.com/watch?v=dQw4w9WgXcQ"');
        console.log('  node youtube-extractor.js dQw4w9WgXcQ');
        console.log('  node youtube-extractor.js "https://youtu.be/dQw4w9WgXcQ"');
        process.exit(1);
    }

    const input = args[0];
    
    extractVideo(input)
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('\nFailed to extract video information');
            process.exit(1);
        });
}

// Export for use as a module
module.exports = {
    extractVideoId,
    extractVideo,
    fetchVideoInfo,
    parseFormats
};
