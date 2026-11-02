import site, { POST_TYPES } from '../config/site';
import { getPosts } from '../lib/content';

export async function GET() {
  const posts = await getPosts();
  const lines = [`# ${site.title}`, '', `> ${site.description}`, ''];
  for (const t of POST_TYPES) {
    const list = posts.filter((p) => p.data.type === t);
    if (!list.length) continue;
    lines.push(`## ${t}`, '');
    for (const p of list)
      lines.push(`- [${p.data.title}](${site.url}/posts/${p.id}.md)${p.data.summary ? `: ${p.data.summary}` : ''}`);
    lines.push('');
  }
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
