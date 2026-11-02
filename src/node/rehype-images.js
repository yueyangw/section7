import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { visit } from 'unist-util-visit';
import { processImage } from './dither.js';
const SKIP_EXT = /\.(gif|svg)$/i;
const isRemote = (s) => /^(https?:)?\/\//.test(s) || s.startsWith('data:') || s.startsWith('/');
function rehypeImages(options) {
  return async (tree, file) => {
    const fm = file.data.astro?.frontmatter ?? {};
    const wholeOff = fm.dither === false;
    const jobs = [];
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'img' || !parent || index == null || !file.path) return;
      if (parent.type === 'element' && parent.tagName === 'a' && parent.properties?.['dataLightbox'] !== void 0) return;
      const srcRaw = String(node.properties?.src ?? '');
      if (!srcRaw || isRemote(srcRaw) || SKIP_EXT.test(srcRaw)) return;
      const abs = resolve(dirname(file.path), decodeURI(srcRaw));
      if (!existsSync(abs)) {
        throw new Error(`${file.path}: 找不到图片 ${srcRaw}`);
      }
      let title = String(node.properties?.title ?? '');
      const noDither = wholeOff || /#nodither/.test(title);
      title = title.replace(/\s*#nodither\s*/g, '').trim();
      const alt = String(node.properties?.alt ?? '');
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
          const a = {
            type: 'element',
            tagName: 'a',
            properties: { href: r.original, 'data-lightbox': '' },
            children: [img],
          };
          const caption = title || '';
          const figure = {
            type: 'element',
            tagName: 'figure',
            properties: { className: ['figure', ...(noDither ? [] : ['dither'])] },
            children: [
              a,
              ...(caption
                ? [
                    {
                      type: 'element',
                      tagName: 'figcaption',
                      properties: {},
                      children: [{ type: 'text', value: caption }],
                    },
                  ]
                : []),
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
        }),
      );
    });
    await Promise.all(jobs);
  };
}
export { rehypeImages as default };
