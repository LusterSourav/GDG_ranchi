const ALBUM_URL = 'https://photos.google.com/share/AF1QipMmV2mCJIxgLJRTgQmzZiwhJYK8WbaxM7JFM3jYHrcARrlK-bzOXxfjD5I2ORvQ1A?key=TkRHbnlpT3U3bTduZzNJeEZWaEo0X2hfU3IzMlZ3';
const CONCURRENCY = 10;

function baseUrl(url) {
  return url.replace(/=[^=]*$/, '');
}

async function fetchAlbumHtml() {
  const res = await fetch(ALBUM_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
  });
  return await res.text();
}

function extractImageUrls(html) {
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

async function classifyUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'manual' });
    const ct = res.headers.get('content-type') || '';
    if (res.status >= 300 && res.status < 400) {
      // ponytail: redirected = video (Google returns video source via redirect)
      return { url, type: 'video', contentType: ct };
    }
    if (ct.startsWith('image/')) {
      return { url, type: 'photo', contentType: ct };
    }
    // fallback: try a GET with range to check
    const res2 = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } });
    const ct2 = res2.headers.get('content-type') || '';
    if (ct2.startsWith('image/')) {
      return { url, type: 'photo', contentType: ct2 };
    }
    return { url, type: 'photo', contentType: ct2 };
  } catch {
    return { url, type: 'photo', contentType: '' };
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

  const photoCards = photos.map((p, i) =>
    `<a href="${p.url}=w2048" target="_blank" class="card photo"><img src="${p.url}=w600-h600" alt="" loading="lazy"></a>`
  ).join('\n    ');

  const videoCards = videos.map((v, i) =>
    `<div class="card video"><video src="${v.url}=dv" controls preload="none" poster="${v.url}=w600-h600-no"></video></div>`
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
.card img,.card video{width:100%;height:100%;object-fit:cover;display:block}
.card video{object-fit:contain;background:#000}
.photo{transition:transform .15s}
.photo:hover{transform:scale(1.02)}
@media(max-width:600px){.gallery{grid-template-columns:repeat(2,1fr);gap:4px;padding:0 4px 4px}.card{aspect-ratio:3/2}}
</style>
</head>
<body>
<header>
<h1>Ranchi Hacks Coverage 1</h1>
<p class="count">${photos.length} photos${videos.length ? ` · ${videos.length} videos` : ''}</p>
</header>
<div class="gallery">
    ${photoCards}
    ${videoCards ? '\n    ' + videoCards : ''}
</div>
</body>
</html>`;
}

async function main() {
  console.log('Fetching album page...');
  const html = await fetchAlbumHtml();

  console.log('Extracting image URLs...');
  const urls = extractImageUrls(html);
  console.log(`Found ${urls.length} unique media items`);

  console.log('Classifying (photo vs video)...');
  const items = await classifyAll(urls);

  const photos = items.filter(i => i.type === 'photo').length;
  const videos = items.filter(i => i.type === 'video').length;
  console.log(`\nDone: ${photos} photos, ${videos} videos`);

  const html_out = generateHtml(items);
  const fs = await import('fs');
  fs.writeFileSync('index.html', html_out);
  console.log('Wrote index.html');
}

main().catch(console.error);
