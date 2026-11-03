import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parse as parseYaml } from 'yaml';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import rehypeSlug from 'rehype-slug';
import rehypeShiki from '@shikijs/rehype';
import { transformerMetaHighlight, transformerNotationDiff, transformerNotationHighlight } from '@shikijs/transformers';
import remarkDirectives from './remark-directives.js';
import rehypeMath from './rehype-math.js';
import rehypeImages from './rehype-images.js';
import rehypeAnchors from './rehype-anchors.js';
import rehypeCodeChrome from './rehype-code.js';
import ditherAssets from './dither-integration.js';
import { processImage } from './dither.js';
import { getFavicon } from './favicon.js';
import { mergeSite } from './defaults.js';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const PKG = here('../../');

/** 解析代码块 meta：title="a.conf"；行高亮 {2,4-6} 由 transformerMetaHighlight 读取 __raw */
function parseMeta(meta) {
  const out = {};
  const t = meta.match(/title=(?:"([^"]*)"|'([^']*)')/);
  if (t) out['data-title'] = t[1] ?? t[2];
  return out;
}

/** 把语言写到 <pre data-language>，供 rehype-code 的标题栏与终端判定使用 */
const langTransformer = {
  name: 'section7:lang',
  pre(node) {
    node.properties['data-language'] = this.options.lang;
  },
};

/**
 * Astro 的内容缓存（data-store.json）只按内容文件判断是否过期，主题的 Markdown 插件变了也会沿用旧 HTML。
 * 这里对主题构建代码与相关配置取指纹，变化时删掉缓存让 Astro 重新渲染。
 */
function invalidateContentCache(root, site) {
  const h = createHash('sha1');
  for (const f of readdirSync(here('./')).sort()) h.update(f).update(readFileSync(here(`./${f}`)));
  h.update(readFileSync(resolve(PKG, 'content.ts')));
  h.update(JSON.stringify({ dither: site.dither, math: site.math }));
  const sig = h.digest('hex');
  const mark = resolve(root, '.cache/section7-build.txt');
  if (existsSync(mark) && readFileSync(mark, 'utf8') === sig) return;
  for (const f of ['node_modules/.astro/data-store.json', '.astro/data-store.json']) rmSync(resolve(root, f), { force: true });
  mkdirSync(resolve(root, '.cache'), { recursive: true });
  writeFileSync(mark, sig);
}

const ROUTES = [
  ['/', 'index.astro'],
  ['/404', '404.astro'],
  ['/posts', 'posts/index.astro'],
  ['/posts/[slug]', 'posts/[slug]/index.astro'],
  ['/posts/[slug].md', 'posts/[slug].md.ts'],
  ['/types/[type]', 'types/[type].astro'],
  ['/tags', 'tags/index.astro'],
  ['/tags/[tag]', 'tags/[tag]/index.astro'],
  ['/notes', 'notes/index.astro'],
  ['/projects', 'projects/index.astro'],
  ['/projects/[slug]', 'projects/[slug].astro'],
  ['/about', 'about/index.astro'],
  ['/friends', 'friends/index.astro'],
  ['/qsl', 'qsl/index.astro'],
  ['/guestbook', 'guestbook/index.astro'],
  ['/search', 'search/index.astro'],
  ['/rss.xml', 'rss.xml.ts'],
  ['/llms.txt', 'llms.txt.ts'],
  ['/[slug]', '[slug].astro'],
];

/**
 * section7 主题入口。
 *
 *   const s7 = section7(site);
 *   export default defineConfig({ site: site.url, trailingSlash: 'always', ...s7 });
 *
 * 返回 { integrations, markdown, vite }，三者都需要传给 defineConfig。
 * 博客自己的 src/pages 里的同名路由会优先于主题路由。
 * site 可以是对象，也可以是 YAML 文件路径（相对项目根），如 section7('site.yaml')。
 */
export default function section7(userSite = {}) {
  const site = mergeSite(typeof userSite === 'string' ? loadSite(userSite) : userSite);
  // 页面渲染期要用的 Node 能力（sharp、联网抓图标）从这里注册，页面经 globalThis 调用：
  // 主题源码会被 Vite 打进博客的构建产物，若直接 import sharp，博客仓库里解析不到这个依赖
  globalThis.__section7Node = { processImage, getFavicon };

  const theme = {
    name: 'section7-theme',
    hooks: {
      'astro:config:setup': ({ injectRoute, injectScript, config }) => {
        invalidateContentCache(fileURLToPath(config.root), site);
        for (const [pattern, file] of ROUTES) {
          injectRoute({ pattern, entrypoint: resolve(PKG, 'src/pages', file), prerender: true });
        }
        if (site.customCss) {
          const abs = resolve(fileURLToPath(config.root), site.customCss);
          injectScript('page-ssr', `import ${JSON.stringify(abs)};`);
        }
      },
    },
  };

  const virtualSite = {
    name: 'section7-virtual-site',
    resolveId: (id) => (id === 'virtual:section7/site' ? '\0virtual:section7/site' : undefined),
    load: (id) => (id === '\0virtual:section7/site' ? `export default ${JSON.stringify(site)};` : undefined),
  };

  return {
    site,
    integrations: [react(), mdx(), sitemap(), ditherAssets(), theme],
    vite: { plugins: [virtualSite], ssr: { noExternal: ['section7-theme'] }, build: { assetsInlineLimit: 0 } },
    markdown: {
      // 由 @shikijs/rehype 接管，以便控制与数学、代码块外壳的顺序
      syntaxHighlight: false,
      processor: unified({
        gfm: false, // 由显式的 remark-gfm 提供
        smartypants: false,
        remarkRehype: { footnoteLabel: 'NOTES', footnoteBackLabel: '返回正文' },
        remarkPlugins: [remarkMath, remarkGfm, remarkDirective, remarkDirectives],
        rehypePlugins: [
          // 数学必须在 Shiki 之前：否则块级公式的 <pre><code class="language-math"> 会被当成代码块
          [rehypeMath, { strict: site.math.strict, macros: site.math.macros }],
          rehypeSlug,
          rehypeAnchors,
          [
            rehypeShiki,
            {
              theme: 'github-light',
              defaultLanguage: 'text',
              fallbackLanguage: 'text',
              parseMetaString: parseMeta,
              transformers: [transformerMetaHighlight(), transformerNotationDiff(), transformerNotationHighlight(), langTransformer],
            },
          ],
          rehypeCodeChrome,
          [rehypeImages, { dither: site.dither }],
        ],
      }),
    },
  };
}

/** 读取 YAML 站点配置（相对当前工作目录，即博客根目录） */
export function loadSite(path = 'site.yaml') {
  return parseYaml(readFileSync(resolve(process.cwd(), path), 'utf8')) ?? {};
}

/** 类型辅助，无运行时作用 */
export const defineSite = (site) => site;
