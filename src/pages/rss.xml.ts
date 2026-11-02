import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import site from '../config/site';
import { getPosts, postUrl, summaryOf } from '../lib/content';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? site.url,
    // TODO：全文输出需要在构建期渲染正文（含数学 SVG），目前为摘要
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: summaryOf(p),
      link: postUrl(p),
      categories: [p.data.type, ...p.data.tags],
    })),
    customData: '<language>zh-CN</language>',
  });
}
