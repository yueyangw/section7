/**
 * 构建期 MathJax → SVG。
 * 选用 MathJax 3（mathjax-full）：@mathjax/src (v4) 的 Node 端 API 仍在变动，
 * 而 v3 的 liteAdaptor + SVG 输出久经考验，支持 ams/newcommand/mhchem/color 等所有需要的扩展。
 */
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { SerializedMmlVisitor } from 'mathjax-full/js/core/MmlTree/SerializedMmlVisitor.js';
import 'mathjax-full/js/input/tex/base/BaseConfiguration.js';
import 'mathjax-full/js/input/tex/ams/AmsConfiguration.js';
import 'mathjax-full/js/input/tex/newcommand/NewcommandConfiguration.js';
import 'mathjax-full/js/input/tex/color/ColorConfiguration.js';
import 'mathjax-full/js/input/tex/mhchem/MhchemConfiguration.js';
import 'mathjax-full/js/input/tex/boldsymbol/BoldsymbolConfiguration.js';
import 'mathjax-full/js/input/tex/configmacros/ConfigMacrosConfiguration.js';
import 'mathjax-full/js/input/tex/textmacros/TextMacrosConfiguration.js';

interface MathItemLike {
  root: never;
  typesetRoot: never;
  setMetrics(em: number, ex: number, cw: number, scale: number, ls: number): void;
  compile(doc: unknown): void;
  typeset(doc: unknown): void;
}

export interface MathOptions {
  macros?: Record<string, string | [string, number]>;
}

export interface MathError {
  tex: string;
  message: string;
}

export interface MathRenderer {
  /** 渲染一段 TeX；出错时 error 非空，html 为 MathJax 的 merror 输出 */
  render(tex: string, display: boolean): { html: string; error?: MathError };
  /** 全局字形缓存（fontCache: 'global'）所需的 <svg><defs> 容器，需随页面输出一次 */
  cache(): string;
}

/** 每篇文章创建一个渲染器，保证 \newcommand 与公式编号只在本文内生效 */
export function createMathRenderer(opts: MathOptions = {}): MathRenderer {
  const adaptor = liteAdaptor();
  RegisterHTMLHandler(adaptor);
  const visitor = new SerializedMmlVisitor();
  const tex = new TeX({
    packages: ['base', 'ams', 'newcommand', 'color', 'mhchem', 'boldsymbol', 'configmacros', 'textmacros'],
    inlineMath: [],
    displayMath: [],
    processEscapes: false,
    tags: 'ams',
    useLabelIds: true,
    macros: opts.macros ?? {},
    formatError: (_jax: unknown, err: { message: string }) => {
      throw new Error(err.message);
    },
  });
  const svg = new SVG({ fontCache: 'global', mtextInheritFont: true, internalSpeechTitles: false });
  const doc = mathjax.document('', { InputJax: tex, OutputJax: svg });

  return {
    render(source, display) {
      try {
        // 手动走 compile → typeset，这样同一次编译既得到 SVG，也得到辅助 MathML（避免 \label 被重复定义）
        const Item = (doc as unknown as { options: { MathItem: new (...a: unknown[]) => MathItemLike } }).options
          .MathItem;
        const item = new Item(source, tex, display);
        item.setMetrics(16, 8, 1280, 1e6, 1);
        item.compile(doc);
        const mml = visitor.visitTree(item.root);
        item.typeset(doc);
        const html = adaptor
          .outerHTML(item.typesetRoot)
          .replace(/<svg /, '<svg aria-hidden="true" ')
          .replace(
            /<\/mjx-container>$/,
            `<mjx-assistive-mml unselectable="on" display="${display ? 'block' : 'inline'}">${mml}</mjx-assistive-mml></mjx-container>`,
          );
        return { html };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return { html: `<span class="math-error">${escapeHtml(source)}</span>`, error: { tex: source, message } };
      }
    },
    cache() {
      const c = (svg as unknown as { fontCache: { getCache(): unknown } }).fontCache.getCache();
      return adaptor.outerHTML(c as never);
    },
  };
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
