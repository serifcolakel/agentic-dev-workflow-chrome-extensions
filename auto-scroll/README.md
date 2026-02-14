# Universal Auto Scroll Extension

Automatically scroll through short-form videos on multiple platforms.

## Platforms

✅ **YouTube Shorts** - `youtube.com/shorts/*`  
✅ **Instagram Reels** - `instagram.com/reels/*`, `instagram.com/*/reel/*`  
✅ **TikTok** - `tiktok.com/*`  
🔴 **Facebook Reels** - `facebook.com/reel/*`  
🔴 **Reddit** - `reddit.com/*` (video feeds)

## Installation

1. Go to `chrome://extensions/` in Chrome
2. Enable **Developer Mode** in the top right corner
3. Click the **Load unpacked** button that appears in the top left
4. Select this folder (`auto-scroll`)

## Usage

- The extension automatically works on supported platforms
- Automatically switches to the next video when the current one is about to end
- You can toggle it on/off by clicking the extension icon
- Automatically pauses when you manually scroll

## Folder Structure

```
auto-scroll/
├── manifest.json    # Extension configuration (multi-platform)
├── content.js       # Platform-aware auto-scroll logic
├── popup.html       # Toggle UI
├── popup.js         # UI logic
└── README.md        # This file
```

## Features

- ✅ **Multi-platform support** - Supports 5+ platforms
- ✅ Automatic video transitions
- ✅ Toggle on/off button
- ✅ Settings are persistently stored in the browser
- ✅ Platform-specific optimizations
- ✅ Lightweight and fast
- ✅ **Double trigger protection** - Prevents the same video from playing twice
- ✅ **Manual scroll support** - Automatically pauses when user scrolls
- ✅ **Adaptive timing** - Optimized timing for each platform

## Troubleshooting

- If it's not working, click the refresh button next to the extension on the `chrome://extensions/` page
- You can open the console (F12) to check for error messages
