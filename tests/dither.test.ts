import { describe, expect, it } from 'vitest';
import { ditherGray } from '../src/node/dither.js';

const flat = (v: number, n = 16) => new Uint8Array(n * n).fill(v);

describe('ditherGray', () => {
  for (const algo of ['atkinson', 'floyd-steinberg', 'bayer'] as const) {
    it(`${algo}: 全黑为墨、全白为纸`, () => {
      expect(ditherGray(flat(0), 16, 16, algo).every((v) => v === 1)).toBe(true);
      expect(ditherGray(flat(255), 16, 16, algo).every((v) => v === 0)).toBe(true);
    });
    it(`${algo}: 中灰约一半墨点`, () => {
      const out = ditherGray(flat(128, 64), 64, 64, algo);
      const ratio = out.reduce((a, b) => a + b, 0) / out.length;
      expect(ratio).toBeGreaterThan(0.35);
      expect(ratio).toBeLessThan(0.65);
    });
  }
});
