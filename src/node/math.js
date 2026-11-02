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
function createMathRenderer(opts = {}) {
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
    formatError: (_jax, err) => {
      throw new Error(err.message);
    },
  });
  const svg = new SVG({ fontCache: 'global', mtextInheritFont: true, internalSpeechTitles: false });
  const doc = mathjax.document('', { InputJax: tex, OutputJax: svg });
  return {
    render(source, display) {
      try {
        const Item = doc.options.MathItem;
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
      const c = svg.fontCache.getCache();
      return adaptor.outerHTML(c);
    },
  };
}
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
export { createMathRenderer };
