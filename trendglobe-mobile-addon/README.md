# TrendGlobe Mobile PWA Add‑on

This add-on turns your mobile HTML into a production-friendly PWA shell that connects to the TrendGlobe API.

## What you get
- `mobile.html` (mobile app shell)
- `mobile.js` (fetches real trends from `/api/trends` and opens detail sheet from `/api/trends/:id`)
- `manifest.json` + icons placeholders
- `sw.js` (cache-first for static assets)

## Install into your existing project
Place these files into your `web/` folder:
- `mobile.html` -> `web/mobile.html`
- `mobile.js`   -> `web/assets/mobile.js`
- `manifest.json` -> `web/manifest.json`
- `sw.js` -> `web/sw.js`
- Add icons under `web/icons/`

Update `API_BASE` in `mobile.js` if needed.

## Local run
Serve `web/` on a static host. Ensure your API is reachable and CORS allows the web origin.
