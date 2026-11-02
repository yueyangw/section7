import { getCollection, type CollectionEntry } from 'astro:content';
import site from '../config/site';

export type Post = CollectionEntry<'posts'>;

export async function getPosts(): Promise<Post[]> {
  const all = await getCollection('posts', ({ data }) => (import.meta.env.PROD ? !data.draft : true));
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getNotes() {
  const all = await getCollection('notes');
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export const postUrl = (p: Post) => `/posts/${p.id}/`;

export function groupByYear<T extends { data: { date: Date } }>(items: T[], yearOf: (d: Date) => number) {
  const m = new Map<number, T[]>();
  for (const it of items) {
    const y = yearOf(it.data.date);
    (m.get(y) ?? m.set(y, []).get(y)!).push(it);
  }
  return [...m.entries()].sort((a, b) => b[0] - a[0]);
}

export function tagCounts(posts: Post[]) {
  const m = new Map<string, number>();
  for (const p of posts) for (const t of p.data.tags) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function summaryOf(p: Post): string {
  if (p.data.summary) return p.data.summary;
  const text = (p.body ?? '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/[#>*`$\[\]!_]|\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 120);
}

export function slugOfType(t: string) {
  return t.toLowerCase();
}

export const sectionName = (s: string) => `${s.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}(7)`;
export const siteTitleMan = `${site.manName}(7)`;

/** 文章在仓库中的提交历史；未配置 site.repo 时为 undefined。filePath 为相对项目根的源文件路径 */
export function repoHistoryUrl(filePath?: string): string | undefined {
  if (!site.repo || !filePath) return undefined;
  return `${site.repo.url}/commits/${site.repo.branch}/${filePath}`;
}
