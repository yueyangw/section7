import { visit } from 'unist-util-visit';
const LABELS = { note: 'NOTE', tip: 'TIP', warning: 'WARN', danger: 'DANGER' };
function remarkDirectives() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== 'containerDirective') return;
      const name = node.name;
      const isAdmon = name in LABELS;
      if (!isAdmon && name !== 'details') return;
      let title = '';
      const first = node.children[0];
      if (first?.data?.directiveLabel) {
        title = first.children.map((c) => c.value ?? '').join('');
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
export { remarkDirectives as default };
