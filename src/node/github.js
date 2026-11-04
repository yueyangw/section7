/**
 * 项目页：构建期获取 GitHub 主页上置顶（pinned）的仓库。
 * 有环境变量 GITHUB_TOKEN 时走 GraphQL（pinnedItems），否则解析 github.com/<user> 主页 HTML。
 * 结果缓存在 .cache/github-pinned.json：成功 1 天、失败 1 小时后重试；网络失败时沿用旧结果。
 * 设置环境变量 SECTION7_OFFLINE=1 则只用缓存、不联网。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fromHtml } from 'hast-util-from-html';
import { toString } from 'hast-util-to-string';
import { visit } from 'unist-util-visit';

const CACHE = '.cache/github-pinned.json';
const OK_TTL = 864e5;
const FAIL_TTL = 36e5;
const TIMEOUT = 8000;
const UA = 'Mozilla/5.0 (compatible; section7-theme pinned fetcher)';

let cache;
const load = () => (cache ??= existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {});
const save = () => {
  mkdirSync('.cache', { recursive: true });
  writeFileSync(CACHE, JSON.stringify(cache, null, 1));
};

const cls = (node) => [node.properties?.className ?? []].flat();
const num = (s) => {
  const t = s.trim().toLowerCase().replace(/,/g, '');
  const n = parseFloat(t);
  if (Number.isNaN(n)) return 0;
  return Math.round(t.endsWith('k') ? n * 1000 : n);
};

/**
 * 从 GitHub 主页 HTML 中解析置顶仓库（按页面顺序）。
 * @returns {import('../config/types').PinnedRepo[]}
 */
export function parsePinned(html) {
  const out = [];
  visit(fromHtml(html), 'element', (li) => {
    if (!cls(li).includes('pinned-item-list-item')) return;
    const repo = {
      owner: '',
      name: '',
      url: '',
      description: '',
      language: '',
      languageColor: '',
      stars: 0,
      forks: 0,
      homepage: '',
    };
    visit(li, 'element', (el) => {
      const c = cls(el);
      const href = String(el.properties?.href ?? '');
      if (el.tagName === 'a' && !repo.url && /^\/[^/]+\/[^/]+$/.test(href)) {
        const [, owner, name] = href.split('/');
        Object.assign(repo, { owner, name, url: `https://github.com${href}` });
      } else if (c.includes('pinned-item-desc')) repo.description = toString(el).trim();
      else if (el.properties?.itemProp?.includes?.('programmingLanguage')) repo.language = toString(el).trim();
      else if (c.includes('repo-language-color'))
        repo.languageColor = String(el.properties?.style ?? '').match(/#[0-9a-f]{3,8}/i)?.[0] ?? '';
      else if (el.tagName === 'a' && href.endsWith('/stargazers')) repo.stars = num(toString(el));
      else if (el.tagName === 'a' && /\/(forks|network\/members)$/.test(href)) repo.forks = num(toString(el));
    });
    // 置顶的也可能是 gist，只要仓库
    if (repo.url) out.push(repo);
    return 'skip';
  });
  return out;
}

async function fetchHtml(user) {
  const res = await fetch(`https://github.com/${encodeURIComponent(user)}`, {
    headers: { 'user-agent': UA, accept: 'text/html' },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return parsePinned(await res.text());
}

const QUERY = `query($login: String!) {
  user(login: $login) {
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes { ... on Repository {
        name url description homepageUrl stargazerCount forkCount
        owner { login }
        primaryLanguage { name color }
      } }
    }
  }
}`;

async function fetchGraphql(user, token) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { 'user-agent': UA, authorization: `bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { login: user } }),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  const json = await res.json();
  if (!res.ok || json.errors || !json.data?.user) throw new Error(json.errors?.[0]?.message ?? `${res.status}`);
  return json.data.user.pinnedItems.nodes.map((r) => ({
    owner: r.owner.login,
    name: r.name,
    url: r.url,
    description: r.description ?? '',
    language: r.primaryLanguage?.name ?? '',
    languageColor: r.primaryLanguage?.color ?? '',
    stars: r.stargazerCount,
    forks: r.forkCount,
    homepage: r.homepageUrl ?? '',
  }));
}

/** 返回 user 置顶的仓库；获取失败且无缓存时返回 [] */
export async function getPinned(user) {
  if (!user) return [];
  const c = load();
  const hit = c[user];
  const offline = process.env.SECTION7_OFFLINE === '1';
  if (hit && (offline || Date.now() - hit.at < (hit.ok ? OK_TTL : FAIL_TTL))) return hit.data;
  if (offline) return [];
  let data = null;
  try {
    const token = process.env.GITHUB_TOKEN;
    data = token ? await fetchGraphql(user, token) : await fetchHtml(user);
  } catch (e) {
    console.warn(`[section7] 获取 ${user} 的 GitHub 置顶仓库失败：${e.message}`);
  }
  c[user] = { ok: data != null, data: data ?? hit?.data ?? [], at: Date.now() };
  save();
  return c[user].data;
}
