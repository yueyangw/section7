import { cpSync, existsSync, createReadStream } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const MAP = [
  ['/_dither/', '.cache/dither'],
  ['/_img/', '.cache/img'],
];
function ditherAssets() {
  return {
    name: 'section7-dither-assets',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const url = (req.url ?? '').split('?')[0];
          for (const [prefix, dir] of MAP) {
            if (url.startsWith(prefix)) {
              const f = join(process.cwd(), dir, url.slice(prefix.length));
              if (existsSync(f) && !f.endsWith('.json')) {
                res.setHeader('Content-Type', f.endsWith('.png') ? 'image/png' : 'image/webp');
                createReadStream(f).pipe(res);
                return;
              }
            }
          }
          next();
        });
      },
      'astro:build:done': ({ dir }) => {
        const out = fileURLToPath(dir);
        for (const [prefix, src] of MAP) {
          if (existsSync(src)) {
            cpSync(src, join(out, prefix), { recursive: true, filter: (p) => !p.endsWith('.json') });
          }
        }
      },
    },
  };
}
export { ditherAssets as default };
