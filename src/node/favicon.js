/**
 * 友链头像：构建期抓取对方站点图标，内联成 data URI。
 * 顺序：apple-touch-icon → 尺寸最大的 <link rel="icon"> → /favicon.ico。
 * 结果（含失败）缓存在 .cache/favicons.json：成功 30 天、失败 1 天后重试。
 * 设置环境变量 SECTION7_OFFLINE=1 则只用缓存、不联网。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const CACHE = '.cache/favicons.json';
const OK_TTL = 30 * 864e5;
const FAIL_TTL = 864e5;
const TIMEOUT = 5000;
const MAX_BYTES = 512 * 1024;
const UA = 'Mozilla/5.0 (compatible; section7-theme favicon fetcher)';

let cache;
const load = () => (cache ??= existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {});
const save = () => {
  mkdirSync('.cache', { recursive: true });
  writeFileSync(CACHE, JSON.stringify(cache, null, 1));
};

async function get(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error(`${res.status}`);
  return res;
}

/** 从首页 HTML 中找出候选图标地址（已按优先级排序） */
export function iconCandidates(html, base) {
  const out = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attr = (n) => tag.match(new RegExp(`\\b${n}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))?.slice(1).find((v) => v != null);
    const rel = (attr('rel') ?? '').toLowerCase().split(/\s+/);
    const href = attr('href');
    if (!href) continue;
    let score = -1;
    if (rel.includes('apple-touch-icon') || rel.includes('apple-touch-icon-precomposed')) score = 1000;
    else if (rel.includes('icon')) score = parseInt(attr('sizes') ?? '', 10) || (/\.svg/i.test(href) ? 500 : 16);
    if (score < 0) continue;
    try {
      out.push({ url: new URL(href, base).href, score });
    } catch {
      /* 非法地址忽略 */
    }
  }
  out.sort((a, b) => b.score - a.score);
  return [...out.map((c) => c.url), new URL('/favicon.ico', base).href];
}

async function toDataUri(url) {
  const res = await get(url);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length || buf.length > MAX_BYTES) throw new Error('size');
  const type = (res.headers.get('content-type') ?? '').split(';')[0].trim();
  if (/svg/.test(type) || /\.svg(\?|$)/i.test(url)) return `data:image/svg+xml;base64,${buf.toString('base64')}`;
  if (/icon/.test(type) || /\.ico(\?|$)/i.test(url)) {
    if (type && !/icon|octet-stream/.test(type)) throw new Error('type');
    return `data:image/x-icon;base64,${buf.toString('base64')}`;
  }
  // 位图统一缩到 96px，避免把大图内联进页面
  const png = await sharp(buf).resize(96, 96, { fit: 'cover' }).png().toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

async function fetchIcon(site) {
  const res = await get(site);
  const html = (await res.text()).slice(0, 200_000);
  for (const url of iconCandidates(html, res.url || site)) {
    try {
      return await toDataUri(url);
    } catch {
      /* 试下一个 */
    }
  }
  return null;
}

/** 返回站点图标的 data URI；抓不到返回 null（页面显示首字） */
export async function getFavicon(site) {
  const c = load();
  const hit = c[site];
  const offline = process.env.SECTION7_OFFLINE === '1';
  if (hit && (offline || Date.now() - hit.at < (hit.data ? OK_TTL : FAIL_TTL))) return hit.data;
  if (offline) return null;
  let data = null;
  try {
    data = await fetchIcon(site);
  } catch {
    data = null;
  }
  // 网络失败时保留旧的成功结果
  c[site] = { data: data ?? hit?.data ?? null, at: Date.now() };
  save();
  return c[site].data;
}
