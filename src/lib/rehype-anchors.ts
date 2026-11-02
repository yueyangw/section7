import { visit } from 'unist-util-visit';
import type { Root } from 'hast';

/** 标题（rehype-slug 之后）末尾追加 § 锚点链接，hover 时显示；表格外包一层可横向滚动的容器 */
export default function rehypeAnchors() {
  return (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (
        node.tagName === 'table' &&
        parent &&
        index != null &&
        !(
          parent.type === 'element' &&
          parent.tagName === 'div' &&
          Array.isArray(parent.properties?.className) &&
          parent.properties.className.includes('table-scroll')
        )
      ) {
        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-scroll'] },
          children: [node],
        };
        return 'skip';
      }
    });
    visit(tree, 'element', (node) => {
      if (!/^h[2-4]$/.test(node.tagName) || !node.properties?.id) return;
      node.children.push({
        type: 'element',
        tagName: 'a',
        properties: {
          className: ['anchor'],
          href: `#${node.properties.id}`,
          'aria-label': '复制本节链接',
          'data-copy-link': '',
        },
        children: [{ type: 'text', value: '§' }],
      });
    });
  };
}
