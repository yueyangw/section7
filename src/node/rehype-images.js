import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { visit } from 'unist-util-visit';
import { fromHtml } from 'hast-util-from-html';
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
    // Markdown 里直接写的 <img …>（Typora 常见）是 raw 节点：只由 img/br 组成时解析成元素，与 ![]() 一样处理
    visit(tree, 'raw', (node, index, parent) => {
      if (!parent || index == null || !/<img\b/i.test(node.value)) return;
      if (node.value.replace(/<img\b[^>]*>|<br\s*\/?>/gi, '').trim()) {
        // 与其他标签混写（如 <div align="center"><img …></div>）时不改结构，只给远程图打上浏览器端抖动标记
        if (!wholeOff) node.value = node.value.replace(/<img\b(?=[^>]*\ssrc\s*=\s*["']?(?:https?:)?\/\/)(?![^>]*#nodither)/gi, '<img data-dither-remote');
        return;
      }
      parent.children.splice(index, 1, ...fromHtml(node.value, { fragment: true }).children);
      return index;
    });
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
          properties: {
            src: srcRaw,
            alt,
            loading: 'lazy',
            decoding: 'async',
            // 保留 <img width="60%"> 这类手写尺寸
            ...Object.fromEntries(['width', 'height', 'style'].filter((k) => node.properties?.[k] != null).map((k) => [k, node.properties[k]])),
            ...(noDither ? {} : { 'data-dither-remote': '' }),
          },
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
