/**
 * 站点配置：所有可变信息集中在这里。
 * 字符串里的 {{manName}} {{buildDate}} {{year}} 会在渲染时替换。
 */
export interface FooterBlock {
  type: 'text' | 'links' | 'html';
  value: string | { label: string; url: string }[];
}

const site = {
  url: 'https://wyy.ink',
  title: 'York 的网络日志',
  manName: 'WYY.INK', // 页眉页脚使用，(7) 自动追加
  description: '计算机网络、AI，以及偶尔的生活。',
  author: { name: 'York', email: '', github: 'yueyangw' },
  /** 文章距今不超过该天数则显示 NEW! */
  newDays: 30,
  timezone: 'Asia/Shanghai',
  /** 文章源文件所在仓库，用于 REVISIONS 链接 */
  repo: { url: 'https://github.com/yueyangw/section7', branch: 'main' },
  nav: [
    { label: '文章', href: '/posts/' },
    { label: '笔记', href: '/notes/' },
    { label: '项目', href: '/projects/' },
    { label: '友链', href: '/friends/' },
    { label: '留言簿', href: '/guestbook/' },
  ],
  /** 首页 SEE ALSO */
  seeAlso: [
    { label: 'github', section: 1, href: 'https://github.com/yueyangw' },
    { label: 'projects', section: 7, href: '/projects/' },
    { label: 'friends', section: 7, href: '/friends/' },
    { label: 'rss.xml', section: 5, href: '/rss.xml' },
    { label: 'llms.txt', section: 5, href: '/llms.txt' },
    { label: 'archive', section: 7, href: '/posts/' },
  ],
  home: { logCount: 6, noteCount: 3, banner: true },
  dither: {
    algorithm: 'atkinson' as 'atkinson' | 'floyd-steinberg' | 'bayer',
    ink: '#1f2a5a',
    paper: '#f6f5f1',
    maxWidth: 1400,
    originalMaxWidth: 2400,
  },
  math: {
    strict: true,
    macros: {
      R: '\\mathbb{R}',
      E: '\\mathbb{E}',
      abs: ['\\left|#1\\right|', 1],
      norm: ['\\left\\|#1\\right\\|', 1],
      argmin: '\\operatorname*{arg\\,min}',
      argmax: '\\operatorname*{arg\\,max}',
    } as Record<string, string | [string, number]>,
  },
  /** server 为空则不加载评论区 */
  artalk: { server: '', site: 'wyy.ink', pageview: true },
  readingProgress: true,
  /** hr 样式：'dots' 或 'line' */
  hr: 'dots' as 'dots' | 'line',
  footer: {
    left: '{{manName}} {{buildDate}}',
    center: '73 de BD1DKW',
    right: '{{manName}}(7)',
    blocks: [
      { type: 'text', value: '© 2018–{{year}} York · CC BY-NC-SA 4.0' },
      {
        type: 'links',
        value: [
          { label: 'RSS', url: '/rss.xml' },
          { label: 'llms.txt', url: '/llms.txt' },
        ],
      },
      { type: 'html', value: '' },
    ] as FooterBlock[],
    icp: { number: '', url: 'https://beian.miit.gov.cn/' },
    police: { number: '', url: '', icon: '/beian-police.png' },
  },
  analytics: { provider: 'none' as 'none' | 'umami' | 'plausible' },
};

export const POST_TYPES = ['NET', 'AI', 'SYS', 'DEV', 'OI', 'ESSAY', 'LIFE'] as const;
export type PostType = (typeof POST_TYPES)[number];

export default site;
