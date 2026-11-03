/**
 * frontmatter / 站点配置里的图片统一走这里：
 * - 相对路径（相对所在内容文件，或站点根目录）→ 构建期抖动，产出 /_dither/ 与 /_img/
 * - http(s) 图床地址、/ 开头的 public 文件 → 原样输出，由浏览器端 src/client/dither.ts 实时抖动
 */
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import site from '../config/site';
import { processImage } from '../node/dither.js';

export interface Pic {
  /** 页面上显示的地址 */
  src: string;
  /** 灯箱里的原图 */
  original: string;
  /** 构建期抖动图地址（远程图为 undefined） */
  ditherSrc?: string;
  width?: number;
  height?: number;
  /** 需要浏览器端抖动 */
  remote: boolean;
  dithered: boolean;
}

const isRemote = (s: string) => /^(https?:)?\/\//.test(s) || s.startsWith('/') || s.startsWith('data:');

/**
 * @param src  图片地址
 * @param from 引用它的文件（相对项目根，如 entry.filePath）；省略则相对项目根
 */
export async function resolvePic(src: string, from?: string, dither = true): Promise<Pic> {
  if (isRemote(src) || /\.(svg|gif)$/i.test(src)) {
    const canDither = dither && !src.startsWith('data:') && !/\.(svg|gif)$/i.test(src);
    return { src, original: src, remote: canDither, dithered: canDither };
  }
  const abs = resolve(process.cwd(), from ? dirname(from) : '.', src);
  if (!existsSync(abs)) throw new Error(`${from ?? 'site.config'}: 找不到图片 ${src}`);
  const r = await processImage(abs, site.dither);
  return {
    src: dither ? r.dither : r.original,
    original: r.original,
    ditherSrc: r.dither,
    width: r.width,
    height: r.height,
    remote: false,
    dithered: dither,
  };
}

export const resolvePics = (list: string[], from?: string, dither = true) => Promise.all(list.map((s) => resolvePic(s, from, dither)));
