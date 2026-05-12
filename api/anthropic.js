// Vercel Edge Function — proxies requests to Anthropic server-to-server,
// bypassing browser CORS restrictions on api.anthropic.com.
export const config = { runtime: 'edge' };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, anthropic-beta',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = req.headers.get('x-api-key') || '';
  const anthropicVersion = req.headers.get('anthropic-version') || '2023-06-01';
  const body = await req.text();

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': anthropicVersion,
    },
    body,
  });

  const resHeaders = new Headers(CORS_HEADERS);
  resHeaders.set('Content-Type', upstream.headers.get('Content-Type') || 'application/json');

  return new Response(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}
