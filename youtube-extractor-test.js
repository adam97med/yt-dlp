#!/usr/bin/env node

/**
 * Test suite for youtube-extractor.js
 * 
 * Run with: node youtube-extractor-test.js
 */

const { extractVideoId, parseFormats } = require('./youtube-extractor.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log('✓', name);
        passed++;
    } catch (e) {
        console.log('✗', name, '-', e.message);
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

console.log('Running tests for youtube-extractor.js...\n');

// Test video ID extraction
test('Extract video ID from plain ID', () => {
    const id = extractVideoId('dQw4w9WgXcQ');
    assert(id === 'dQw4w9WgXcQ', 'ID should match');
});

test('Extract video ID from watch URL', () => {
    const id = extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert(id === 'dQw4w9WgXcQ', 'ID should match');
});

test('Extract video ID from watch URL with extra params', () => {
    const id = extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s');
    assert(id === 'dQw4w9WgXcQ', 'ID should match');
});

test('Extract video ID from youtu.be URL', () => {
    const id = extractVideoId('https://youtu.be/dQw4w9WgXcQ');
    assert(id === 'dQw4w9WgXcQ', 'ID should match');
});

test('Extract video ID from youtu.be URL with params', () => {
    const id = extractVideoId('https://youtu.be/dQw4w9WgXcQ?t=10');
    assert(id === 'dQw4w9WgXcQ', 'ID should match');
});

test('Extract video ID from embed URL', () => {
    const id = extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ');
    assert(id === 'dQw4w9WgXcQ', 'ID should match');
});

test('Extract video ID from v/ URL', () => {
    const id = extractVideoId('https://www.youtube.com/v/dQw4w9WgXcQ');
    assert(id === 'dQw4w9WgXcQ', 'ID should match');
});

test('Extract video ID from shorts URL', () => {
    const id = extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ');
    assert(id === 'dQw4w9WgXcQ', 'ID should match');
});

test('Reject invalid video ID (too short)', () => {
    try {
        extractVideoId('invalid');
        throw new Error('Should have thrown');
    } catch (e) {
        assert(e.message.includes('Invalid'), 'Should throw invalid error');
    }
});

test('Reject invalid video ID (too long)', () => {
    try {
        extractVideoId('dQw4w9WgXcQ123');
        throw new Error('Should have thrown');
    } catch (e) {
        assert(e.message.includes('Invalid'), 'Should throw invalid error');
    }
});

// Test format parsing
test('Parse null streaming data', () => {
    const formats = parseFormats(null);
    assert(Array.isArray(formats), 'Should return array');
    assert(formats.length === 0, 'Should be empty');
});

test('Parse undefined streaming data', () => {
    const formats = parseFormats(undefined);
    assert(Array.isArray(formats), 'Should return array');
    assert(formats.length === 0, 'Should be empty');
});

test('Parse empty streaming data', () => {
    const formats = parseFormats({});
    assert(Array.isArray(formats), 'Should return array');
    assert(formats.length === 0, 'Should be empty');
});

test('Parse streaming data with formats only', () => {
    const mockData = {
        formats: [
            {
                itag: 18,
                mimeType: 'video/mp4',
                quality: '360p',
                url: 'https://example.com/video.mp4'
            }
        ]
    };
    const formats = parseFormats(mockData);
    assert(formats.length === 1, 'Should have 1 format');
    assert(formats[0].itag === 18, 'Format should have itag 18');
});

test('Parse streaming data with adaptive formats only', () => {
    const mockData = {
        adaptiveFormats: [
            {
                itag: 140,
                mimeType: 'audio/mp4',
                audioQuality: 'AUDIO_QUALITY_MEDIUM'
            }
        ]
    };
    const formats = parseFormats(mockData);
    assert(formats.length === 1, 'Should have 1 format');
    assert(formats[0].itag === 140, 'Format should have itag 140');
});

test('Parse streaming data with both format types', () => {
    const mockData = {
        formats: [
            {
                itag: 18,
                mimeType: 'video/mp4',
                quality: '360p'
            }
        ],
        adaptiveFormats: [
            {
                itag: 140,
                mimeType: 'audio/mp4',
                audioQuality: 'AUDIO_QUALITY_MEDIUM'
            }
        ]
    };
    const formats = parseFormats(mockData);
    assert(formats.length === 2, 'Should have 2 formats');
    assert(formats[0].itag === 18, 'First format should have itag 18');
    assert(formats[1].itag === 140, 'Second format should have itag 140');
});

test('Format categorization - video+audio (combined)', () => {
    const mockData = {
        formats: [{
            itag: 18,
            mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"'
        }]
    };
    const formats = parseFormats(mockData);
    assert(formats[0].hasVideo === true, 'Should have video');
    assert(formats[0].hasAudio === true, 'Should have audio');
});

test('Format categorization - video only', () => {
    const mockData = {
        adaptiveFormats: [{
            itag: 137,
            mimeType: 'video/mp4; codecs="avc1.640028"'
        }]
    };
    const formats = parseFormats(mockData);
    assert(formats[0].hasVideo === true, 'Should have video');
    assert(formats[0].hasAudio === false, 'Should not have audio');
});

test('Format categorization - audio only', () => {
    const mockData = {
        adaptiveFormats: [{
            itag: 140,
            mimeType: 'audio/mp4; codecs="mp4a.40.2"'
        }]
    };
    const formats = parseFormats(mockData);
    assert(formats[0].hasVideo === false, 'Should not have video');
    assert(formats[0].hasAudio === true, 'Should have audio');
});

test('Format includes all metadata', () => {
    const mockData = {
        formats: [{
            itag: 18,
            url: 'https://example.com/video.mp4',
            mimeType: 'video/mp4',
            bitrate: 500000,
            width: 640,
            height: 360,
            fps: 30,
            quality: 'medium',
            qualityLabel: '360p',
            contentLength: '10000000',
            approxDurationMs: '180000'
        }]
    };
    const formats = parseFormats(mockData);
    const format = formats[0];
    
    assert(format.itag === 18, 'Should have itag');
    assert(format.url === 'https://example.com/video.mp4', 'Should have URL');
    assert(format.mimeType === 'video/mp4', 'Should have mimeType');
    assert(format.bitrate === 500000, 'Should have bitrate');
    assert(format.width === 640, 'Should have width');
    assert(format.height === 360, 'Should have height');
    assert(format.fps === 30, 'Should have fps');
    assert(format.quality === 'medium', 'Should have quality');
    assert(format.qualityLabel === '360p', 'Should have qualityLabel');
});

test('Format handles missing optional fields', () => {
    const mockData = {
        formats: [{
            itag: 18,
            mimeType: 'video/mp4'
        }]
    };
    const formats = parseFormats(mockData);
    const format = formats[0];
    
    assert(format.itag === 18, 'Should have itag');
    assert(format.url === undefined, 'URL should be undefined');
    assert(format.width === undefined, 'Width should be undefined');
    assert(format.height === undefined, 'Height should be undefined');
});

console.log('\n' + '='.repeat(60));
console.log('Test Results:');
console.log('  Passed:', passed);
console.log('  Failed:', failed);
console.log('  Total:', passed + failed);
console.log('='.repeat(60));

if (failed > 0) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}
