import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { ditherGray } from './dither-core.js';
const DITHER_DIR = '.cache/dither';
const IMG_DIR = '.cache/img';
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
function params(d) {
  return `${d.algorithm}|${d.ink}|${d.maxWidth}|${d.originalMaxWidth}|v1`;
}
async function processImage(file, d) {
  const src = readFileSync(file);
  const key = createHash('sha1').update(src).update(params(d)).digest('hex').slice(0, 16);
  mkdirSync(DITHER_DIR, { recursive: true });
  mkdirSync(IMG_DIR, { recursive: true });
  const ditherPath = join(DITHER_DIR, `${key}.png`);
  const origPath = join(IMG_DIR, `${key}.webp`);
  const metaPath = join(DITHER_DIR, `${key}.json`);
  if (!existsSync(metaPath) || !existsSync(ditherPath) || !existsSync(origPath)) {
    const base = sharp(src, { animated: false }).rotate();
    const orig = await base
      .clone()
      .resize({ width: d.originalMaxWidth, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    writeFileSync(origPath, orig);
    const { data, info } = await base
      .clone()
      .resize({ width: d.maxWidth, withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const bits = ditherGray(data, info.width, info.height, d.algorithm);
    const [r, g, b] = hex(d.ink);
    const rgba = Buffer.alloc(info.width * info.height * 4);
    for (let i = 0; i < bits.length; i++) {
      if (bits[i]) {
        rgba[i * 4] = r;
        rgba[i * 4 + 1] = g;
        rgba[i * 4 + 2] = b;
        rgba[i * 4 + 3] = 255;
      }
    }
    await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
      .png({ palette: true, colours: 2, compressionLevel: 9 })
      .toFile(ditherPath);
    writeFileSync(metaPath, JSON.stringify({ width: info.width, height: info.height }));
  }
  const { width, height } = JSON.parse(readFileSync(metaPath, 'utf8'));
  return { dither: `/_dither/${key}.png`, original: `/_img/${key}.webp`, width, height };
}
export { DITHER_DIR, IMG_DIR, ditherGray, processImage };
