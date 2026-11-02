# section7

[wyy.ink](https://wyy.ink) 的博客源码。Astro + React 静态站，视觉为「Unix man page 骨架 + 日志簿 + 蓝调时刻」。名字取自 man 手册第 7 节。

完整需求见 [BUILD.md](BUILD.md)，视觉参考见 [design-ref/](design-ref/)。

## 开发

```bash
pnpm install
pnpm dev          # 开发服务器（草稿可见）
pnpm build        # 构建 dist/ 并生成 Pagefind 搜索索引
pnpm test         # vitest
pnpm lint
pnpm new my-slug  # 生成文章模板
```

需要 Node 22+、pnpm 12。

## 内容

- `src/content/posts/<slug>/index.md(x)`：文章，同目录放图片。frontmatter 见 `src/content.config.ts`。
- `src/content/notes/`、`projects/`、`pages/`、`home/about.mdx`、`src/data/friends.yaml`。
- 站点配置集中在 `src/config/site.ts`。

## 构建期管线

- **数学**：remark-math → MathJax 3 → SVG（`src/lib/math.ts`）。公式错误会让构建失败并给出文件、行号和 TeX 源码；迁移过渡期可用 `MATH_STRICT=0` 降级为警告。
- **图片**：本地图片默认 Atkinson 抖动（墨色 `--indigo`，纸色透明），点击看 WebP 原图。关闭：frontmatter `dither: false` 或图片 title 加 `#nodither`。缓存于 `.cache/`。
- **代码**：Shiki，`title="文件名"`、`// [!code ++]`、`// [!code --]`、`// [!code highlight]`。
- **提示框**：`:::note` `:::tip` `:::warning` `:::danger`（可带 `[标题]`），折叠块 `:::details[标题]`。

## 部署

`dist/` 为纯静态。`deploy/nginx/section7.conf`、`.github/workflows/deploy-*.yml` 为示例；评论服务见 `deploy/artalk/`，在 `site.ts` 填 `artalk.server` 后启用。
