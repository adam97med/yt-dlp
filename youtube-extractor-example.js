#!/usr/bin/env node

/**
 * Example usage of youtube-extractor.js as a module
 * 
 * This demonstrates how to use the YouTube extractor in your own Node.js applications
 */

const { extractVideo, extractVideoId } = require('./youtube-extractor.js');

/**
 * Example 1: Basic video extraction
 */
async function basicExample() {
    console.log('=== Example 1: Basic Video Extraction ===\n');
    
    try {
        const videoUrl = 'dQw4w9WgXcQ'; // Can use URL or just video ID
        const result = await extractVideo(videoUrl);
        
        console.log('✓ Extraction successful!');
        console.log(`  Title: ${result.videoDetails.title}`);
        console.log(`  Author: ${result.videoDetails.author}`);
        console.log(`  Duration: ${result.videoDetails.lengthSeconds} seconds`);
        console.log(`  Total formats: ${result.formats.length}\n`);
        
    } catch (error) {
        console.error('✗ Error:', error.message);
    }
}

/**
 * Example 2: Extract video ID from various URL formats
 */
function extractIdExample() {
    console.log('=== Example 2: Extract Video ID from URLs ===\n');
    
    const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'dQw4w9WgXcQ'
    ];
    
    urls.forEach(url => {
        try {
            const videoId = extractVideoId(url);
            console.log(`✓ ${url}`);
            console.log(`  → Video ID: ${videoId}\n`);
        } catch (error) {
            console.error(`✗ ${url}: ${error.message}\n`);
        }
    });
}

/**
 * Example 3: Find best quality format
 */
async function findBestFormat() {
    console.log('=== Example 3: Find Best Quality Format ===\n');
    
    try {
        // Note: This is a test video ID. Replace with an actual video for real testing.
        const result = await extractVideo('dQw4w9WgXcQ');
        
        // Find best combined format (video + audio)
        const combinedFormats = result.formats.filter(f => f.hasVideo && f.hasAudio);
        
        if (combinedFormats.length > 0) {
            const bestCombined = combinedFormats.reduce((best, current) => {
                const bestHeight = best.height || 0;
                const currentHeight = current.height || 0;
                return currentHeight > bestHeight ? current : best;
            });
            
            console.log('Best combined format (video + audio):');
            console.log(`  Format ID: ${bestCombined.itag}`);
            console.log(`  Quality: ${bestCombined.qualityLabel || bestCombined.quality}`);
            console.log(`  Resolution: ${bestCombined.width}x${bestCombined.height}`);
            console.log(`  Type: ${bestCombined.mimeType}`);
            console.log(`  Has URL: ${bestCombined.url ? 'Yes' : 'No'}\n`);
        } else {
            console.log('No combined formats available.\n');
        }
        
        // Find best video-only format
        const videoOnlyFormats = result.formats.filter(f => f.hasVideo && !f.hasAudio);
        
        if (videoOnlyFormats.length > 0) {
            const bestVideo = videoOnlyFormats.reduce((best, current) => {
                const bestHeight = best.height || 0;
                const currentHeight = current.height || 0;
                return currentHeight > bestHeight ? current : best;
            });
            
            console.log('Best video-only format:');
            console.log(`  Format ID: ${bestVideo.itag}`);
            console.log(`  Quality: ${bestVideo.qualityLabel || bestVideo.quality}`);
            console.log(`  Resolution: ${bestVideo.width}x${bestVideo.height}`);
            console.log(`  Type: ${bestVideo.mimeType}\n`);
        }
        
        // Find best audio-only format
        const audioOnlyFormats = result.formats.filter(f => !f.hasVideo && f.hasAudio);
        
        if (audioOnlyFormats.length > 0) {
            const bestAudio = audioOnlyFormats.reduce((best, current) => {
                const bestBitrate = best.bitrate || 0;
                const currentBitrate = current.bitrate || 0;
                return currentBitrate > bestBitrate ? current : best;
            });
            
            console.log('Best audio-only format:');
            console.log(`  Format ID: ${bestAudio.itag}`);
            console.log(`  Quality: ${bestAudio.audioQuality}`);
            console.log(`  Bitrate: ${(bestAudio.bitrate / 1000).toFixed(0)} kbps`);
            console.log(`  Type: ${bestAudio.mimeType}\n`);
        }
        
    } catch (error) {
        console.error('✗ Error:', error.message);
    }
}

/**
 * Example 4: Filter formats by quality
 */
async function filterFormats() {
    console.log('=== Example 4: Filter Formats by Criteria ===\n');
    
    try {
        const result = await extractVideo('dQw4w9WgXcQ');
        
        // Get only 1080p formats
        const hd1080Formats = result.formats.filter(f => f.height === 1080);
        console.log(`1080p formats found: ${hd1080Formats.length}`);
        
        // Get only MP4 formats
        const mp4Formats = result.formats.filter(f => f.mimeType && f.mimeType.includes('mp4'));
        console.log(`MP4 formats found: ${mp4Formats.length}`);
        
        // Get formats under 50MB
        const smallFormats = result.formats.filter(f => {
            const size = parseInt(f.contentLength);
            return !isNaN(size) && size < 50 * 1024 * 1024; // 50MB
        });
        console.log(`Formats under 50MB: ${smallFormats.length}`);
        
        console.log('');
        
    } catch (error) {
        console.error('✗ Error:', error.message);
    }
}

/**
 * Example 5: Get download URLs
 */
async function getDownloadUrls() {
    console.log('=== Example 5: Get Download URLs ===\n');
    
    try {
        const result = await extractVideo('dQw4w9WgXcQ');
        
        // Get URLs for combined formats
        const combinedWithUrls = result.formats
            .filter(f => f.hasVideo && f.hasAudio && f.url)
            .slice(0, 3); // Just show first 3
        
        if (combinedWithUrls.length > 0) {
            console.log('Download URLs (first 3 combined formats):');
            combinedWithUrls.forEach((format, index) => {
                console.log(`\n${index + 1}. Quality: ${format.qualityLabel || format.quality}`);
                console.log(`   Format: ${format.mimeType}`);
                console.log(`   URL: ${format.url.substring(0, 80)}...`);
            });
            console.log('\nNote: These URLs expire after a few hours!');
        } else {
            console.log('No formats with direct URLs available.');
            console.log('The video may require signature decryption.');
        }
        
        console.log('');
        
    } catch (error) {
        console.error('✗ Error:', error.message);
    }
}

// Main execution
async function main() {
    console.log('YouTube Extractor - Usage Examples\n');
    console.log('This demonstrates various ways to use the youtube-extractor module\n');
    
    // Run examples (comment out the ones you don't want to run)
    
    // Example 1: Basic extraction
    // await basicExample();
    
    // Example 2: Extract video IDs
    extractIdExample();
    
    // Example 3: Find best formats (requires actual video extraction)
    // await findBestFormat();
    
    // Example 4: Filter formats (requires actual video extraction)
    // await filterFormats();
    
    // Example 5: Get download URLs (requires actual video extraction)
    // await getDownloadUrls();
    
    console.log('Examples complete!');
    console.log('\nNote: Examples that fetch video data are commented out by default');
    console.log('to avoid making unnecessary requests. Uncomment them to test with real videos.');
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    basicExample,
    extractIdExample,
    findBestFormat,
    filterFormats,
    getDownloadUrls
};
