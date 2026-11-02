import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';

const TERMINAL = new Set(['console', 'shell-session', 'sh-session', 'terminal']);

const cls = (n: Element): string[] =>
  Array.isArray(n.properties?.className) ? (n.properties!.className as string[]) : [];

/**
 * 在 Shiki 之后运行：把 <pre> 包进 <figure class="codeblock">，加上 indigo 标题栏与复制按钮。
 * 终端输出（console / shell-session）使用深色底，去掉 Shiki 的行内颜色。
 */
export default function rehypeCodeChrome() {
  return (tree: Root) => {
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
      const label: Element = {
        type: 'element',
        tagName: 'span',
        properties: {},
        children: [{ type: 'text', value: title || lang || 'text' }],
      };
      const button: Element = {
        type: 'element',
        tagName: 'button',
        properties: { type: 'button', className: ['copy-btn'], 'data-copy': '', 'aria-label': '复制代码' },
        children: [{ type: 'text', value: '复制' }],
      };
      const bar: Element = { type: 'element', tagName: 'figcaption', properties: {}, children: [label, button] };
      const figure: Element = {
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
