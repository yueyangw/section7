import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import site from '../config/site';

export type DitherAlgorithm = 'atkinson' | 'floyd-steinberg' | 'bayer';

/**
 * 对 8 位灰度图做 2 值抖动。返回 w*h 的数组，1 = 墨色，0 = 纸色。
 */
export function ditherGray(
  gray: Uint8Array | Uint8ClampedArray,
  w: number,
  h: number,
  algo: DitherAlgorithm,
): Uint8Array {
  const out = new Uint8Array(w * h);
  if (algo === 'bayer') {
    const m = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const th = ((m[(y % 4) * 4 + (x % 4)] + 0.5) / 16) * 255;
        out[y * w + x] = gray[y * w + x] < th ? 1 : 0;
      }
    return out;
  }
  const buf = Float32Array.from(gray);
  const spread: [number, number, number][] =
    algo === 'atkinson'
      ? [
          [1, 0, 1 / 8],
          [2, 0, 1 / 8],
          [-1, 1, 1 / 8],
          [0, 1, 1 / 8],
          [1, 1, 1 / 8],
          [0, 2, 1 / 8],
        ]
      : [
          [1, 0, 7 / 16],
          [-1, 1, 3 / 16],
          [0, 1, 5 / 16],
          [1, 1, 1 / 16],
        ];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const old = buf[i];
      const val = old < 128 ? 0 : 255;
      out[i] = val === 0 ? 1 : 0;
      const err = old - val;
      for (const [dx, dy, k] of spread) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < w && ny < h) buf[ny * w + nx] += err * k;
      }
    }
  return out;
}

export const DITHER_DIR = '.cache/dither';
export const IMG_DIR = '.cache/img';

export interface ProcessedImage {
  /** 站内 URL */
  dither: string;
  original: string;
  width: number;
  height: number;
}

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

function params() {
  const d = site.dither;
  return `${d.algorithm}|${d.ink}|${d.maxWidth}|${d.originalMaxWidth}|v1`;
}

/** 处理一张本地图片：抖动图 + 原图（WebP）。结果按内容哈希缓存，未变化时不重复计算。 */
export async function processImage(file: string): Promise<ProcessedImage> {
  const src = readFileSync(file);
  const key = createHash('sha1').update(src).update(params()).digest('hex').slice(0, 16);
  mkdirSync(DITHER_DIR, { recursive: true });
  mkdirSync(IMG_DIR, { recursive: true });
  const ditherPath = join(DITHER_DIR, `${key}.png`);
  const origPath = join(IMG_DIR, `${key}.webp`);
  const metaPath = join(DITHER_DIR, `${key}.json`);

  if (!existsSync(metaPath) || !existsSync(ditherPath) || !existsSync(origPath)) {
    const base = sharp(src, { animated: false }).rotate();
    const orig = await base
      .clone()
      .resize({ width: site.dither.originalMaxWidth, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    writeFileSync(origPath, orig);

    const { data, info } = await base
      .clone()
      .resize({ width: site.dither.maxWidth, withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const bits = ditherGray(data, info.width, info.height, site.dither.algorithm);
    const [r, g, b] = hex(site.dither.ink);
    const rgba = Buffer.alloc(info.width * info.height * 4);
    for (let i = 0; i < bits.length; i++) {
      if (bits[i]) {
        rgba[i * 4] = r;
        rgba[i * 4 + 1] = g;
        rgba[i * 4 + 2] = b;
        rgba[i * 4 + 3] = 255;
      }
    }
    // 纸色为透明，由 CSS 容器提供 --paper 背景（见 prose.css 与 8.4 节说明）
    await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
      .png({ palette: true, colours: 2, compressionLevel: 9 })
      .toFile(ditherPath);
    writeFileSync(metaPath, JSON.stringify({ width: info.width, height: info.height }));
  }
  const { width, height } = JSON.parse(readFileSync(metaPath, 'utf8'));
  return { dither: `/_dither/${key}.png`, original: `/_img/${key}.webp`, width, height };
}
