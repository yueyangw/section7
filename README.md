# section7

一个 man page 风格的 Astro 博客主题：Unix 手册页骨架 + 日志簿 + 蓝调时刻配色。名字取自 man 手册第 7 节。

> 本仓库只含主题（公开）。你自己的文章、站点配置、部署脚本应放在另一个私有的博客仓库里，通过依赖引入本主题。

## 特性

- 纯静态输出，Astro 7 + React islands，原生 CSS 设计 token，字体全部自托管（无外部 CDN）
- 数学：构建期 MathJax → SVG，支持 `align`/`\tag`/`\eqref`/`\newcommand`/mhchem；公式出错构建即失败，并给出文件、行号和 TeX 源码
- 图片默认抖动成双色（Atkinson / Floyd-Steinberg / Bayer），点击灯箱看原图；可整篇或单张关闭
- Shiki 代码块（标题栏、复制、diff、终端深色底）、提示框、折叠块、三线表、脚注
- 首页 / 归档 / 类型 / 标签 / 笔记 / 项目 / 友链 / 留言簿 / 自定义页面 / 404
- NEW 标签、文内目录、系列文章、阅读进度、Pagefind 中文搜索、RSS、`llms.txt`、`.md` 原文、sitemap、JSON-LD
- Artalk 评论 / 阅读量（可选）

## 在博客仓库中使用

```bash
pnpm add astro @astrojs/react @astrojs/mdx react react-dom section7-theme@github:yueyangw/section7
```

`astro.config.ts`：

```ts
import { defineConfig } from 'astro/config';
import section7 from 'section7-theme';
import site from './site.config';

const s7 = section7(site);

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

`site.config.ts`（只写要覆盖的字段，默认值见 [`src/node/defaults.js`](src/node/defaults.js)）：

```ts
import { defineSite } from 'section7-theme';
export default defineSite({ url: 'https://example.com', title: '我的博客', manName: 'EXAMPLE.COM' });
```

内容放在博客仓库的 `src/content/{posts,notes,projects,pages,home}`、`src/data/friends.yaml`；schema 见 [`content.ts`](content.ts)。博客仓库自己的 `src/pages/` 下同名路由优先于主题路由；`site.customCss` 可追加覆盖 CSS 变量的样式表。可直接参考 [`demo/`](demo/)。

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
- 代码块：`title="文件名"`，`// [!code ++]` / `// [!code --]` / `// [!code highlight]`。
- 提示框：`:::note` `:::tip` `:::warning` `:::danger`（可带 `[标题]`），折叠块 `:::details[标题]`。
- 迁移过渡期可用 `MATH_STRICT=0` 把公式错误降级为警告。

## License

MIT
