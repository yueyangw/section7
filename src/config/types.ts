export interface NavItem {
  label: string;
  href: string;
}

export interface FooterBlock {
  type: 'text' | 'links' | 'html';
  value: string | { label: string; url: string }[];
}

/** 站点配置：博客仓库的 site.config.ts 只需写想覆盖的字段，其余取主题默认值 */
export interface SiteConfig {
  /** 站点根地址，如 https://example.com */
  url: string;
  title: string;
  /** 页眉页脚使用，(7) 自动追加 */
  manName: string;
  description: string;
  author: { name: string; email: string; github: string };
  /** 文章距今不超过该天数则显示 NEW! */
  newDays: number;
  timezone: string;
  /** 文章源码所在仓库，用于 REVISIONS 链接；留空则不显示 */
  repo: { url: string; branch: string } | null;
  nav: NavItem[];
  /** 首页 SEE ALSO */
  seeAlso: { label: string; section: number; href: string }[];
  home: { logCount: number; noteCount: number; banner: boolean };
  dither: {
    algorithm: 'atkinson' | 'floyd-steinberg' | 'bayer';
    ink: string;
    paper: string;
    maxWidth: number;
    originalMaxWidth: number;
  };
  math: { strict: boolean; macros: Record<string, string | [string, number]> };
  /** server 为空则不加载评论区 */
  artalk: { server: string; site: string; pageview: boolean };
  readingProgress: boolean;
  /** hr 样式：'dots' 或 'line' */
  hr: 'dots' | 'line';
  footer: {
    left: string;
    center: string;
    right: string;
    blocks: FooterBlock[];
    icp: { number: string; url: string };
    police: { number: string; url: string; icon: string };
  };
  analytics: { provider: 'none' | 'umami' | 'plausible' };
  /** 额外样式表（绝对路径或相对博客根目录），在主题样式之后加载，可覆盖 CSS 变量 */
  customCss: string | null;
  /** 浏览器标签图标（URL）；留空使用主题内置图标 */
  favicon: string | null;
}

export type SiteConfigInput = { [K in keyof SiteConfig]?: SiteConfig[K] extends object ? Partial<SiteConfig[K]> : SiteConfig[K] };
