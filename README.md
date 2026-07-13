# Ranchi Hacks Gallery

**300 photos** from Google Photos album, rendered as a static gallery page.

## How to deploy (GitHub Pages — free)

```bash
# 1. Create a GitHub repo and push
git init
git add .
git commit -m "ranchi gallery"
git remote add origin https://github.com/YOUR_USERNAME/ranchi-gallery.git
git push -u origin main

# 2. Go to repo Settings → Pages → deploy from main branch, /root
# 3. Your gallery is live at: https://YOUR_USERNAME.github.io/ranchi-gallery/
```

Or deploy to **Cloudflare Pages**, **Netlify**, **Vercel** — upload the `index.html` file, it's a static site.

## How to re-scrape (if album changes)

```bash
npm run scrape
```

This regenerates `index.html` with fresh URLs. Commit and push to update.

### `scrape.mjs`

Fetches the album, extracts all photo/video URLs from Google's CDN, and generates a responsive grid gallery. Zero dependencies.

- Photo thumbnails: 600px (`=w600-h600`)
- Photo full-res links: 2048px (`=w2048`)
- Videos: proxied through Cloudflare Worker for CORS
- Videos take ~10s to start playing — Google Photos CDN lacks HTTP Range support and mp4 metadata sits at end of file, so browser downloads full video before playback
- Dark theme, lazy loading, responsive grid
