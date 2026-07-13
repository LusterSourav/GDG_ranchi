# Ranchi Hacks Gallery

92 photos, 208 videos from a Google Photos album. Rendered as a static page.

## Deploy

Push to GitHub, enable Pages. Or upload `index.html` to Cloudflare Pages, Netlify, Vercel.

```bash
git init && git add . && git commit -m "ranchi gallery"
git remote add origin https://github.com/YOUR_USERNAME/ranchi-gallery.git
git push -u origin main
```

## Re-scrape

```bash
npm run scrape
```

Regenerates `index.html` with fresh URLs. Commit and push.

## Videos

Videos take about 10 seconds to start playing. Google's CDN doesn't support byte-range requests, and the mp4 metadata is at the end of the file. The browser has to download the whole thing before it can play. A 6-second, 26MB video takes about 10 seconds to load.

## How it works

92 photos load directly from Google's CDN. 208 videos go through a Cloudflare Worker that adds CORS headers. The `scrape.mjs` script fetches the album, classifies each item, and generates the gallery. Zero dependencies.
