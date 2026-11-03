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

export async function getAbout() {
  return (await getCollection('about'))[0];
}

export async function getQsl() {
  const all = await getCollection('qsl');
  return all.sort((a, b) => (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0));
}

/** 首页 SYNOPSIS 导航：site.nav + 关于页 + QSL（有卡片时）+ 设置了 nav 的自定义页面 */
export async function getNav() {
  const auto: { label: string; href: string; order: number }[] = [];
  const about = await getAbout();
  if (about && about.data.nav) auto.push({ ...about.data.nav, href: '/about/' });
  if ((await getCollection('qsl')).length) auto.push({ label: site.qsl.navLabel, order: site.qsl.navOrder, href: '/qsl/' });
  for (const p of await getCollection('pages', (p) => !!p.data.nav)) {
    if (about && p.id === 'about') continue;
    auto.push({ ...p.data.nav!, href: `/${p.id}/` });
  }
  auto.sort((a, b) => a.order - b.order);
  return [...site.nav, ...auto.map(({ label, href }) => ({ label, href }))];
}

/** 由频率（MHz）推算业余波段 */
export function bandOf(freq?: string): string | undefined {
  const f = Number(freq);
  if (!freq || !Number.isFinite(f)) return undefined;
  const bands: [number, number, string][] = [
    [1.8, 2, '160m'], [3.5, 4, '80m'], [5.3, 5.5, '60m'], [7, 7.3, '40m'], [10.1, 10.15, '30m'],
    [14, 14.35, '20m'], [18.068, 18.168, '17m'], [21, 21.45, '15m'], [24.89, 24.99, '12m'],
    [28, 29.7, '10m'], [50, 54, '6m'], [144, 148, '2m'], [430, 450, '70cm'], [1240, 1300, '23cm'],
  ];
  return bands.find(([lo, hi]) => f >= lo && f <= hi)?.[2];
}
