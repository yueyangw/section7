/** 由 section7() 集成在 Node 端注册的构建函数（见 src/node/index.js），避免把 sharp 等依赖打进页面产物 */
interface Section7Node {
  processImage(file: string, d: unknown): Promise<{ dither: string; original: string; width: number; height: number }>;
  getFavicon(url: string): Promise<string | null>;
}

export function node(): Section7Node {
  const n = (globalThis as { __section7Node?: Section7Node }).__section7Node;
  if (!n) throw new Error('section7: 未找到构建函数，请确认 astro.config 里使用了 section7() 返回的 integrations');
  return n;
}
