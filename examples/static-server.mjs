import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.json': 'application/json', '.wasm': 'application/wasm', '.cue': 'text/plain; charset=utf-8' };
const server = createServer(async (req, res) => {
    try {
        if (!['GET', 'HEAD'].includes(req.method)) {
            res.writeHead(405, { Allow: 'GET, HEAD' }).end();
            return;
        }
        const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        if (!/^\/(examples|dist|bin)\//.test(path) || path.includes('\0')) {
            res.writeHead(404).end();
            return;
        }
        const file = await realpath(resolve(root, '.' + path));
        if (!['examples', 'dist', 'bin'].some(dir => file.startsWith(root + sep + dir + sep))) {
            res.writeHead(404).end();
            return;
        }
        const info = await stat(file);
        if (!info.isFile()) { res.writeHead(404).end(); return; }
        res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream',
            'Content-Length': info.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
        if (req.method === 'HEAD') { res.end(); return; }
        await pipeline(createReadStream(file), res);
    } catch (error) {
        if (res.headersSent) { res.destroy(); return; }
        const status = error instanceof URIError ? 400 : ['ENOENT', 'ENOTDIR'].includes(error.code) ? 404 : 500;
        res.writeHead(status).end();
    }
});
server.requestTimeout = 10_000;
server.headersTimeout = 10_000;
server.maxConnections = 64;
server.listen(8080, '0.0.0.0', () => console.log('Example assets listening on port 8080'));
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => { server.close(); server.closeAllConnections(); });
}
