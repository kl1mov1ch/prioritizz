/**
 * Telegram Bot API relay — a transparent proxy to api.telegram.org.
 *
 * Deploy on Cloudflare Workers (free) when the server's datacenter blocks
 * api.telegram.org (common on RU hosting). Then set in the server .env:
 *
 *   TELEGRAM_API_ROOT=https://<your-worker>.<subdomain>.workers.dev
 *
 * The bot (Telegraf `apiRoot`) and the API (Stars invoices, avatar sync) both
 * pick it up. It forwards the path and body unchanged, so /bot<token>/method
 * and /file/bot<token>/... keep working.
 *
 * Quick deploy without the Wrangler CLI:
 *   1. dash.cloudflare.com → Workers & Pages → Create → Worker → name it → Deploy
 *   2. Edit code → paste this file → Save and deploy
 *   3. Copy the *.workers.dev URL into TELEGRAM_API_ROOT, re-run deploy.sh
 *
 * Optional hardening: set a SECRET var in the Worker and require it as a
 * ?s= query param or header so randoms can't use your relay.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (env.SECRET) {
      const given = url.searchParams.get('s') || request.headers.get('x-relay-secret');
      if (given !== env.SECRET) return new Response('forbidden', { status: 403 });
      url.searchParams.delete('s');
    }

    const target = 'https://api.telegram.org' + url.pathname + url.search;
    const upstream = new Request(target, {
      method: request.method,
      headers: request.headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'follow',
    });

    const resp = await fetch(upstream);
    const headers = new Headers(resp.headers);
    headers.set('access-control-allow-origin', '*');
    return new Response(resp.body, { status: resp.status, headers });
  },
};
