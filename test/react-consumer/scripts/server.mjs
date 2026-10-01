import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, sep, extname } from 'node:path';
import { site } from './common.mjs';

// Main can import this handler and mount the complete site at any directory prefix.
// Worker/shim/WASM paths remain relative to that directory; do not serve source assets.
export async function createHandler({ directory = site, prefix = '/' } = {}) {
  if (!prefix.startsWith('/') || !prefix.endsWith('/') || prefix.includes('..')) throw Error('Prefix must be an absolute directory path');
  const base = await realpath(directory);
  const html = await readFile(resolve(base, 'index.html'), 'utf8');
  const map = html.match(/<script type="importmap">([^<]+)<\/script>/)?.[1];
  if (!map) throw Error('Import map missing');
  const hash = createHash('sha256').update(map).digest('base64');
  const csp = `default-src 'self'; script-src 'self' 'sha256-${hash}' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'`;
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.wasm': 'application/wasm' };
  return async (req, res) => {
    const fail = status => { res.writeHead(status, { 'Cache-Control': 'no-store' }); res.end(); };
    try {
      // Validate raw path before URL normalization can erase traversal components.
      const pathname = decodeURIComponent((req.url ?? '').split('?')[0]);
      if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(part => part === '.' || part === '..')) return fail(404);
      if (!['GET', 'HEAD'].includes(req.method) || !pathname.startsWith(prefix)) return fail(404);
      const leaf = pathname.slice(prefix.length) || 'index.html';
      const path = resolve(base, leaf);
      if (!path.startsWith(base + sep)) return fail(404);
      const actual = await realpath(path);
      if (!actual.startsWith(base + sep) || !(await stat(actual)).isFile()) return fail(404);
      const bytes = await readFile(actual);
      res.writeHead(200, {
        'Content-Type': mime[extname(actual)] ?? 'application/octet-stream',
        'Content-Length': bytes.length, 'Cache-Control': 'no-store',
        'Content-Security-Policy': csp, 'X-Content-Type-Options': 'nosniff',
      });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { fail(404); }
  };
}

export async function startServer(options = {}) {
  const { port = 0, host = '127.0.0.1', ...handlerOptions } = options;
  const server = http.createServer(await createHandler(handlerOptions));
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, resolve); });
  const origin = `http://${host}:${server.address().port}`;
  return { server, origin, url: origin + (handlerOptions.prefix ?? '/') };
}
