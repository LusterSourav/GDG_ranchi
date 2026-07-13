const ALBUM_URL = 'https://photos.google.com/share/AF1QipMmV2mCJIxgLJRTgQmzZiwhJYK8WbaxM7JFM3jYHrcARrlK-bzOXxfjD5I2ORvQ1A?key=TkRHbnlpT3U3bTduZzNJeEZWaEo0X2hfU3IzMlZ3';
const CONCURRENCY = 15;
const WORKER_HOST = 'gdg-video-proxy.sourav-xcd.workers.dev';

function baseUrl(url) {
  return url.replace(/=[^=]*$/, '');
}

async function fetchAlbumHtml() {
  const res = await fetch(ALBUM_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
  });
  return await res.text();
}

function extractBaseUrls(html) {
  const seen = new Set();
  const urls = [];
  const re = /https:\/\/lh3\.googleusercontent\.com\/pw\/[A-Za-z0-9_\-]+/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const base = baseUrl(m[0]);
    if (!seen.has(base)) {
      seen.add(base);
      urls.push(base);
    }
  }
  return urls;
}

async function classifyUrl(base) {
  try {
    const res = await fetch(base + '=dv', { method: 'HEAD', redirect: 'follow' });
    const ct = res.headers.get('content-type') || '';
    if (ct.startsWith('video/')) {
      return { base, type: 'video', contentType: ct };
    }
    return { base, type: 'photo', contentType: ct };
  } catch {
    return { base, type: 'photo', contentType: '' };
  }
}

async function classifyAll(urls) {
  const results = [];
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const classified = await Promise.all(batch.map(classifyUrl));
    results.push(...classified);
    process.stdout.write(`\r  Classifying: ${Math.min(i + CONCURRENCY, urls.length)}/${urls.length}`);
  }
  process.stdout.write('\n');
  return results;
}

function generateHtml(items) {
  const photos = items.filter(i => i.type === 'photo');
  const videos = items.filter(i => i.type === 'video');

  const photoCards = photos.map(p =>
    `<a href="${p.base}=w2048" target="_blank" class="card photo"><img src="${p.base}=w600" alt="" loading="lazy"></a>`
  ).join('\n    ');

  const videoCards = videos.map(v =>
    `<div class="card video"><video src="https://${WORKER_HOST}/?url=${Buffer.from(v.base).toString('base64')}" controls preload="none" poster="${v.base}=w600-no"></video></div>`
  ).join('\n    ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Ranchi Hacks Coverage 1</title>
<link rel="preconnect" href="https://lh3.googleusercontent.com" crossorigin>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#111;color:#eee}
header{padding:2rem 1rem;text-align:center}
h1{font-size:1.5rem;font-weight:600;margin-bottom:.25rem}
.count{color:#888;font-size:.875rem}
.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px;padding:0 8px 8px;max-width:1600px;margin:0 auto}
.card{overflow:hidden;border-radius:4px;background:#1a1a1a;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center}
.card img,.card video{width:100%;height:100%;display:block}
.card img{object-fit:cover}
.card video{object-fit:contain;background:#000}
.photo{transition:transform .15s}
.photo:hover{transform:scale(1.02)}
@media(max-width:600px){.gallery{grid-template-columns:repeat(2,1fr);gap:4px;padding:0 4px 4px}.card{aspect-ratio:3/2}}
</style>
</head>
<body>
<header>
<h1>Ranchi Hacks Coverage 1</h1>
<p class="count">${photos.length} photos${videos.length ? ` &middot; ${videos.length} videos` : ''}</p>
</header>
<div class="gallery">
    ${photoCards}
    ${videoCards}
</div>
</body>
</html>`;
}

async function main() {
  console.log('Fetching album page...');
  const html = await fetchAlbumHtml();

  console.log('Extracting base URLs...');
  const urls = extractBaseUrls(html);
  console.log(`Found ${urls.length} items`);

  console.log('Classifying (HEAD /?=dv)...');
  const items = await classifyAll(urls);

  const photos = items.filter(i => i.type === 'photo').length;
  const videos = items.filter(i => i.type === 'video').length;
  console.log(`\nDone: ${photos} photos, ${videos} videos`);

  const htmlOut = generateHtml(items);
  const fs = await import('fs');
  fs.writeFileSync('index.html', htmlOut);
  console.log('Wrote index.html');
}

main().catch(console.error);
