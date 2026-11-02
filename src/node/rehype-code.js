import { visit } from 'unist-util-visit';
const TERMINAL = /* @__PURE__ */ new Set(['console', 'shell-session', 'sh-session', 'terminal']);
const cls = (n) => (Array.isArray(n.properties?.className) ? n.properties.className : []);
function rehypeCodeChrome() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index == null) return;
      if (parent.type === 'element' && parent.tagName === 'figure' && cls(parent).includes('codeblock')) return;
      const props = node.properties ?? {};
      const lang = String(props['dataLanguage'] ?? props['data-language'] ?? '');
      const title = String(props['dataTitle'] ?? props['data-title'] ?? '');
      if (
        !lang &&
        !title &&
        !String(props['class'] ?? '').includes('shiki') &&
        !cls(node).some((c) => c.includes('shiki'))
      )
        return;
      const terminal = TERMINAL.has(lang);
      if (terminal) {
        visit(node, 'element', (el) => {
          if (el.properties?.style) delete el.properties.style;
        });
      }
      const label = {
        type: 'element',
        tagName: 'span',
        properties: {},
        children: [{ type: 'text', value: title || lang || 'text' }],
      };
      const button = {
        type: 'element',
        tagName: 'button',
        properties: { type: 'button', className: ['copy-btn'], 'data-copy': '', 'aria-label': '复制代码' },
        children: [{ type: 'text', value: '复制' }],
      };
      const bar = { type: 'element', tagName: 'figcaption', properties: {}, children: [label, button] };
      const figure = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['codeblock', ...(terminal ? ['terminal'] : [])], 'data-lang': lang },
        children: [bar, node],
      };
      parent.children[index] = figure;
      return 'skip';
    });
  };
}
export { rehypeCodeChrome as default };
