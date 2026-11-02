import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

const LABELS: Record<string, string> = { note: 'NOTE', tip: 'TIP', warning: 'WARN', danger: 'DANGER' };

/**
 * :::note / :::tip / :::warning / :::danger （可带 [标题]）→ <aside class="admonition note">
 * :::details[标题] → <details>
 */
export default function remarkDirectives() {
  return (tree: Root) => {
    visit(tree, (node: any) => {
      if (node.type !== 'containerDirective') return;
      const name: string = node.name;
      const isAdmon = name in LABELS;
      if (!isAdmon && name !== 'details') return;

      // [标题] 在 mdast 中表现为首个 data.directiveLabel 段落
      let title = '';
      const first = node.children[0];
      if (first?.data?.directiveLabel) {
        title = first.children.map((c: any) => c.value ?? '').join('');
        node.children.shift();
      }
      const data = (node.data ??= {});
      if (isAdmon) {
        data.hName = 'aside';
        data.hProperties = { className: ['admonition', name], 'data-label': LABELS[name] };
        if (title) {
          node.children.unshift({
            type: 'paragraph',
            data: { hName: 'p', hProperties: { className: ['admonition-title'] } },
            children: [{ type: 'text', value: title }],
          });
        }
      } else {
        data.hName = 'details';
        data.hProperties = { className: ['fold'] };
        node.children.unshift({
          type: 'paragraph',
          data: { hName: 'summary', hProperties: { className: ['btn'] } },
          children: [{ type: 'text', value: title || '展开' }],
        });
      }
    });
  };
}
