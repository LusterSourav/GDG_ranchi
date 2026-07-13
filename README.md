# Ranchi Hacks Gallery

**92 photos · 208 videos** from Google Photos album, rendered as a static gallery page.

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

## Video delay

Videos take ~10s to start playing. Google Photos CDN doesn't support HTTP Range, and the mp4 metadata sits at the end of the file — the browser must download the full video before it can play. For a 6s, 26MB video that takes ~10s.

---

All 300 items: 92 photos (direct from Google CDN) + 208 videos (proxied through Cloudflare Worker for CORS headers).
