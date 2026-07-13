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
        'Access-Control-Expose-Headers': 'Content-Type, Content-Length',
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
    const fetchOpts = {
      method: request.method,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    };
    const range = request.headers.get('Range');
    if (range) fetchOpts.headers['Range'] = range;

    const videoRes = await fetch(location, fetchOpts);

    const responseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Content-Type, Content-Length',
      'Content-Type': videoRes.headers.get('Content-Type') || 'video/mp4',
    };

    const contentLength = videoRes.headers.get('Content-Length');
    if (contentLength) responseHeaders['Content-Length'] = contentLength;

    let status = videoRes.status;
    if (range && status === 206) {
      const contentRange = videoRes.headers.get('Content-Range');
      if (contentRange) responseHeaders['Content-Range'] = contentRange;
      responseHeaders['Accept-Ranges'] = 'bytes';
    } else if (range && status === 200) {
      // ponytail: Google CDN ignores Range, serve full 200, browser plays from start
    }

    return new Response(videoRes.body, { status, headers: responseHeaders });
  }

  return new Response('Unexpected response from upstream', { status: 502 });
}
