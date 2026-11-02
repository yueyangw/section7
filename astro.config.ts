import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import rehypeSlug from 'rehype-slug';
import rehypeShiki from '@shikijs/rehype';
import { transformerNotationDiff, transformerNotationHighlight } from '@shikijs/transformers';
import site from './src/config/site';
import remarkDirectives from './src/lib/remark-directives';
import rehypeMath from './src/lib/rehype-math';
import rehypeImages from './src/lib/rehype-images';
import rehypeAnchors from './src/lib/rehype-anchors';
import rehypeCodeChrome from './src/lib/rehype-code';
import ditherAssets from './src/lib/dither-integration';

/** 解析代码块 meta：title="a.conf" {1,3-5} */
function parseMeta(meta: string, node: unknown) {
  void node;
  const out: Record<string, string> = {};
  const t = meta.match(/title=(?:"([^"]*)"|'([^']*)')/);
  if (t) out['data-title'] = t[1] ?? t[2];
  return out;
}

/** 把语言写到 <pre data-language>，供 rehype-code 的标题栏与终端判定使用 */
const langTransformer: ShikiTransformer = {
  name: 'section7:lang',
  pre(node) {
    node.properties['data-language'] = this.options.lang;
  },
};

export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'always',
  integrations: [react(), mdx(), sitemap(), ditherAssets()],
  markdown: {
    syntaxHighlight: false, // 由下方 @shikijs/rehype 接管，以便控制与数学、代码块外壳的顺序
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
            transformers: [transformerNotationDiff(), transformerNotationHighlight(), langTransformer],
          },
        ],
        rehypeCodeChrome,
        rehypeImages,
      ],
    }),
  },
  vite: { build: { assetsInlineLimit: 0 } },
});
