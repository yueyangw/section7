# section7

一个 man page 风格的 Astro 博客主题：Unix 手册页骨架 + 日志簿 + 蓝调时刻配色。名字取自 man 手册第 7 节。

> 本仓库只含主题（公开）。你自己的文章、站点配置、部署脚本应放在另一个私有的博客仓库里，通过依赖引入本主题。

## 特性

- 纯静态输出，Astro 7 + React islands，原生 CSS 设计 token，字体全部自托管（无外部 CDN）
- 数学：构建期 MathJax → SVG，支持 `align`/`\tag`/`\eqref`/`\newcommand`/mhchem；公式出错构建即失败，并给出文件、行号和 TeX 源码
- 图片默认抖动成双色（Atkinson / Floyd-Steinberg / Bayer），点击灯箱看原图；可整篇或单张关闭。本地图构建期抖动，图床图片在浏览器端用同一算法实时抖动
- Shiki 代码块（标题栏、复制、diff、终端深色底）、提示框、折叠块、三线表、脚注
- 首页 / 归档 / 类型 / 标签 / 日志 / 项目 / 关于（含友链）/ QSL 卡片墙 / 留言簿 / 自定义页面 / 404
- 主题与内容分离：博客仓库只放 Markdown、YAML 和图片，升级主题只需 `pnpm up section7-theme`
- NEW 标签、文内目录、系列文章、阅读进度、Pagefind 中文搜索、RSS、`llms.txt`、`.md` 原文、sitemap、JSON-LD
- Artalk 评论 / 阅读量（可选）

## 在博客仓库中使用

```bash
pnpm add astro @astrojs/react @astrojs/mdx react react-dom section7-theme@github:yueyangw/section7
```

`astro.config.ts`（脚手架样板，之后不用再改）：

```ts
import { defineConfig } from 'astro/config';
import section7 from 'section7-theme';

const s7 = section7('site.yaml');

export default defineConfig({
  site: s7.site.url,
  output: 'static',
  trailingSlash: 'always',
  integrations: s7.integrations,
  markdown: s7.markdown,
  vite: s7.vite,
});
```

`src/content.config.ts`：

```ts
export { collections } from 'section7-theme/content';
```

`site.yaml`（只写要覆盖的字段，默认值见 [`src/node/defaults.js`](src/node/defaults.js)；仍可用 `section7({...})` 传对象）：

```yaml
url: https://example.com
title: 我的博客
manName: EXAMPLE.COM
author: { name: York, github: yourname, callsign: N0CALL, avatar: ./assets/me.jpg }
home:
  banner: { src: ./assets/banner.jpg, caption: 傍晚的湖 }   # true 用主题内置图，false 不显示
```

## 内容

全部在博客仓库的 `src/` 下，schema 见 [`content.ts`](content.ts)，可直接参考 [`demo/`](demo/)。

| 路径 | 页面 | 说明 |
| --- | --- | --- |
| `content/posts/**/index.md` | 文章 | 可按 年/月/日 嵌套目录 |
| `content/notes/*.md` | `/notes/` 日志 | 通联日志式排版；frontmatter `qth` `wx` `images`（0 / 1 / 2 / 3+ 张各有版式） |
| `content/about/index.md` | `/about/` 关于 | `photo` `photoSide` `greeting` `facts` `history` `now` 控制版式，正文进照片旁的文字框；友链接在下面 |
| `data/friends.yaml` | 关于页 FRIENDS | `avatar` 可省略，构建期自动抓对方站点图标 |
| `content/qsl/<名>/card.yaml` | `/qsl/` QSL | `call` `dir`(rcvd/sent/mine) `date` `utc` `freq` `mode` `rst` `dxcc` `via` `front` `back`；无 `back` 时按记录生成背面 |
| `content/projects/*/index.mdx` | 项目 | |
| `content/pages/*.md` | 自定义页面 | 设置 `nav` 进入首页导航 |

frontmatter 里的图片写相对当前文件的路径（构建期抖动），或图床 URL（浏览器端抖动）。旧的 `/friends/` 会跳转到 `/about/#friends`；没有 `content/about/` 时沿用 `pages/about.md` 作为关于页正文。

博客仓库自己的 `src/pages/` 下同名路由优先于主题路由；`site.customCss` 可追加覆盖 CSS 变量的样式表。

## 开发主题

```bash
pnpm install
pnpm dev      # 运行 demo 站点
pnpm build    # 构建 demo 并生成搜索索引
pnpm test
pnpm lint
```

需要 Node 22+、pnpm 12。完整需求与设计稿见 [docs/](docs/)。

## 构建期细节

- 图片抖动结果缓存在博客仓库的 `.cache/`；关闭：frontmatter `dither: false`，或图片 title 加 `#nodither`。
- 图床图片：浏览器端读取像素需要图床允许跨域（CORS），不允许时退回 SVG 双色滤镜，不会破图。
- 友链图标缓存在 `.cache/favicons.json`（成功 30 天、失败 1 天后重试）；`SECTION7_OFFLINE=1` 时只用缓存不联网。
- 升级主题后若内容字段读不到，删掉博客仓库的 `.astro/` 让 Astro 重建内容缓存。
- 代码块：`title="文件名"`，`// [!code ++]` / `// [!code --]` / `// [!code highlight]`。
- 提示框：`:::note` `:::tip` `:::warning` `:::danger`（可带 `[标题]`），折叠块 `:::details[标题]`。
- 迁移过渡期可用 `MATH_STRICT=0` 把公式错误降级为警告。

## License

MIT
