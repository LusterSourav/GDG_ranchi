addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const encoded = url.searchParams.get('url');
  if (!encoded) {
    return new Response('Missing ?url= param', { status: 400 });
  }
  let target;
  try {
    target = atob(encoded);
  } catch {
    return new Response('Invalid base64 in ?url=', { status: 400 });
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Expose-Headers': 'Content-Type, Content-Length, Content-Range, Accept-Ranges',
      },
      status: 204,
    });
  }

  const googleRes = await fetch(target + '=dv', {
    method: request.method,
    headers: { 'User-Agent': 'Mozilla/5.0' },
    redirect: 'manual',
  });

  if (googleRes.status >= 300 && googleRes.status < 400) {
    const location = googleRes.headers.get('Location');
    if (!location) {
      return new Response('Redirect with no Location', { status: 502 });
    }
    const videoRes = await fetch(location, {
      method: request.method,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Range': request.headers.get('Range') || '' },
    });
    const responseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Content-Type, Content-Length, Content-Range, Accept-Ranges',
      'Content-Type': videoRes.headers.get('Content-Type') || 'video/mp4',
      'Accept-Ranges': 'bytes',
    };
    const contentRange = videoRes.headers.get('Content-Range');
    if (contentRange) responseHeaders['Content-Range'] = contentRange;
    const contentLength = videoRes.headers.get('Content-Length');
    if (contentLength) responseHeaders['Content-Length'] = contentLength;
    return new Response(videoRes.body, { status: videoRes.status, headers: responseHeaders });
  }

  return new Response('Unexpected response from upstream', { status: 502 });
}
