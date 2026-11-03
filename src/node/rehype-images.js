import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { visit } from 'unist-util-visit';
import { processImage } from './dither.js';
const SKIP_EXT = /\.(gif|svg)$/i;
const isHttp = (s) => /^(https?:)?\/\//.test(s);
const isRemote = (s) => isHttp(s) || s.startsWith('data:') || s.startsWith('/');

/** 把 <img> 换成 figure > a[data-lightbox] > img (+ figcaption)；单独成段时把外层 <p> 换成 div */
function wrapFigure(node, index, parent, { img, href, caption, dither }) {
  const figure = {
    type: 'element',
    tagName: 'figure',
    properties: { className: ['figure', ...(dither ? ['dither'] : [])] },
    children: [
      { type: 'element', tagName: 'a', properties: { href, 'data-lightbox': '' }, children: [img] },
      ...(caption ? [{ type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: caption }] }] : []),
    ],
  };
  if (
    parent.type === 'element' &&
    parent.tagName === 'p' &&
    parent.children.filter((c) => c.type !== 'text' || c.value.trim()).length === 1
  ) {
    parent.tagName = 'div';
    parent.properties = { className: ['figure-wrap'] };
  }
  parent.children[index] = figure;
}
function rehypeImages(options) {
  return async (tree, file) => {
    const fm = file.data.astro?.frontmatter ?? {};
    const wholeOff = fm.dither === false;
    const jobs = [];
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'img' || !parent || index == null || !file.path) return;
      if (parent.type === 'element' && parent.tagName === 'a' && parent.properties?.['dataLightbox'] !== void 0) return;
      const srcRaw = String(node.properties?.src ?? '');
      if (!srcRaw || SKIP_EXT.test(srcRaw)) return;
      const title = String(node.properties?.title ?? '');
      const noDither = wholeOff || /#nodither/.test(title);
      const caption = title.replace(/\s*#nodither\s*/g, '').trim();
      const alt = String(node.properties?.alt ?? '');
      if (isHttp(srcRaw)) {
        // 图床图片：构建期拿不到文件，交给浏览器端 src/client/dither.ts 实时抖动
        const img = {
          type: 'element',
          tagName: 'img',
          properties: { src: srcRaw, alt, loading: 'lazy', decoding: 'async', ...(noDither ? {} : { 'data-dither-remote': '' }) },
          children: [],
        };
        wrapFigure(node, index, parent, { img, href: srcRaw, caption, dither: !noDither });
        return;
      }
      if (isRemote(srcRaw)) return;
      const abs = resolve(dirname(file.path), decodeURI(srcRaw));
      if (!existsSync(abs)) {
        throw new Error(`${file.path}: 找不到图片 ${srcRaw}`);
      }
      jobs.push(
        processImage(abs, options.dither).then((r) => {
          const img = {
            type: 'element',
            tagName: 'img',
            properties: {
              src: noDither ? r.original : r.dither,
              alt,
              width: r.width,
              height: r.height,
              loading: 'lazy',
              decoding: 'async',
              'data-dither-src': r.dither,
              'data-original-src': r.original,
            },
            children: [],
          };
          wrapFigure(node, index, parent, { img, href: r.original, caption, dither: !noDither });
        }),
      );
    });
    await Promise.all(jobs);
  };
}
export { rehypeImages as default };
