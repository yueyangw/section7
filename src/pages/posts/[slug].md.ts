import type { APIContext } from 'astro';
import { getPosts, type Post } from '../../lib/content';
import { isoWithZone } from '../../lib/date';

export async function getStaticPaths() {
  return (await getPosts()).map((post) => ({ params: { slug: post.id }, props: { post } }));
}

export function GET({ props }: APIContext) {
  const { post } = props as { post: Post };
  const d = post.data;
  const fm = [
    '---',
    `title: ${JSON.stringify(d.title)}`,
    `date: ${isoWithZone(d.date)}`,
    ...(d.updated ? [`updated: ${isoWithZone(d.updated)}`] : []),
    `type: ${d.type}`,
    `tags: ${JSON.stringify(d.tags)}`,
    '---',
    '',
  ].join('\n');
  return new Response(fm + (post.body ?? ''), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
