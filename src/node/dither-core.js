/** 纯算法，无 Node 依赖：构建期（sharp）与浏览器端（canvas）共用同一份实现，保证两边抖动结果一致。 */
/** 输入灰度数组，返回 1=墨色像素、0=纸色像素 */
export function ditherGray(gray, w, h, algo) {
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
  const spread =
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
