import { visit } from 'unist-util-visit';
import { fromHtml } from 'hast-util-from-html';
import { toString } from 'hast-util-to-string';
import { createMathRenderer } from './math.js';
const has = (n, cls) => {
  const c = n.properties?.className;
  return Array.isArray(c) && c.includes(cls);
};
function rehypeMath(options = {}) {
  const strict = process.env.MATH_STRICT === '0' ? false : (options.strict ?? true);
  return (tree, file) => {
    const r = createMathRenderer(options);
    let count = 0;
    const errors = [];
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'code' || !has(node, 'language-math') || !parent || index == null) return;
      const display = has(node, 'math-display');
      const tex = toString(node);
      const { html, error } = r.render(tex, display);
      if (error) {
        const line = node.position?.start.line ?? '?';
        errors.push(
          `${file.path ?? '(unknown)'}:${line}  ${error.message}
    TeX: ${error.tex.trim().slice(0, 200)}`,
        );
      }
      count++;
      const frag = fromHtml(html, { fragment: true, space: 'svg' }).children;
      const wrapper = {
        type: 'element',
        tagName: display ? 'div' : 'span',
        properties: { className: display ? ['math-block'] : ['math-inline'], 'data-pagefind-ignore': 'all' },
        children: frag,
      };
      if (display && parent.type === 'element' && parent.tagName === 'pre') return replaceParent(tree, parent, wrapper);
      parent.children[index] = wrapper;
    });
    if (errors.length) {
      const msg = `[math] ${errors.length} 处公式错误：
  ${errors.join('\n  ')}`;
      if (strict) throw new Error(msg);
      console.warn(msg);
    }
    if (count > 0) {
      const cache = fromHtml(
        `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${r.cache()}</svg>`,
        { fragment: true, space: 'svg' },
      ).children;
      tree.children.push(...cache);
    }
  };
}
function replaceParent(tree, pre, wrapper) {
  visit(tree, 'element', (n, i, p) => {
    if (n === pre && p && i != null) {
      p.children[i] = wrapper;
      return false;
    }
  });
}
export { rehypeMath as default };
