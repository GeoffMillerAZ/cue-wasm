import { startServer } from './server.mjs';
const args = process.argv.slice(2);
if (args.length > 2 || (args[0] && !/^\d+$/.test(args[0]))) throw Error('Usage: npm run serve -- [port] [/directory-prefix/]');
const port = Number(args[0] ?? 0);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('Invalid port');
const { server, url } = await startServer({ port, prefix: args[1] ?? '/' });
console.log(JSON.stringify({ pid: process.pid, url, assetSource: 'site generated from installed archive', browserExecuted: false }));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { server.close(); server.closeAllConnections(); });
