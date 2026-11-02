/**
 * 主题默认配置（不含任何个人信息）。博客仓库的 site.config.js 只写要覆盖的字段。
 * @type {import('../config/types').SiteConfig}
 */
export const defaultSite = {
  url: 'https://example.com',
  title: 'My Blog',
  manName: 'EXAMPLE.COM',
  description: '一个 man page 风格的博客。',
  author: { name: 'Author', email: '', github: '' },
  newDays: 30,
  timezone: 'Asia/Shanghai',
  repo: null,
  nav: [
    { label: '文章', href: '/posts/' },
    { label: '笔记', href: '/notes/' },
    { label: '项目', href: '/projects/' },
    { label: '友链', href: '/friends/' },
    { label: '留言簿', href: '/guestbook/' },
  ],
  seeAlso: [
    { label: 'projects', section: 7, href: '/projects/' },
    { label: 'friends', section: 7, href: '/friends/' },
    { label: 'rss.xml', section: 5, href: '/rss.xml' },
    { label: 'llms.txt', section: 5, href: '/llms.txt' },
    { label: 'archive', section: 7, href: '/posts/' },
  ],
  home: { logCount: 6, noteCount: 3, banner: true },
  dither: { algorithm: 'atkinson', ink: '#1f2a5a', paper: '#f6f5f1', maxWidth: 1400, originalMaxWidth: 2400 },
  math: {
    strict: true,
    macros: {
      R: '\\mathbb{R}',
      E: '\\mathbb{E}',
      abs: ['\\left|#1\\right|', 1],
      norm: ['\\left\\|#1\\right\\|', 1],
      argmin: '\\operatorname*{arg\\,min}',
      argmax: '\\operatorname*{arg\\,max}',
    },
  },
  artalk: { server: '', site: '', pageview: true },
  readingProgress: true,
  hr: 'dots',
  footer: {
    left: '{{manName}} {{buildDate}}',
    center: '',
    right: '{{manName}}(7)',
    blocks: [
      { type: 'links', value: [{ label: 'RSS', url: '/rss.xml' }, { label: 'llms.txt', url: '/llms.txt' }] },
    ],
    icp: { number: '', url: 'https://beian.miit.gov.cn/' },
    police: { number: '', url: '', icon: '' },
  },
  analytics: { provider: 'none' },
  customCss: null,
  favicon: null,
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

/** 对象递归合并；数组与标量整体替换（math.macros 例外：与默认宏合并） */
export function mergeSite(user = {}, base = defaultSite) {
  const out = { ...base };
  for (const [k, v] of Object.entries(user)) {
    out[k] = isObj(v) && isObj(base[k]) ? mergeSite(v, base[k]) : v;
  }
  return out;
}
