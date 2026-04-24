# AtlasTrace Recorder

AtlasTrace Recorder is a Chrome Extension MVP for browser intelligence capture:

- UI actions (`click`, `input_change`)
- Navigation events
- Network requests from `fetch` + `XMLHttpRequest` only
- Request body + response body capture (text/json)
- Action-to-request correlation (5s window)
- Markdown session export

## Install (Load Unpacked)

1. Open `chrome://extensions/`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select `atlastrace-recorder/`

## Usage

1. Open popup and click **Start Session**
2. Reproduce user flow on target site
3. Click **Stop Session**
4. Click **Export Markdown** or **Copy Markdown**

## Output

Export creates a `.md` report with:

- session metadata
- timeline events
- request status + duration + content-type
- unique request/response pairs (deduplicated)
- request + response bodies (text/json, truncated)
- linked action IDs when correlation is available

## Notes

- SVG/image/video/audio/font responses are ignored.
- Binary responses are ignored.
- This is MVP. Sensitive data filtering/redaction is not implemented yet.
