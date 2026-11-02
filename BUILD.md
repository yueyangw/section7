# section7 — wyy.ink 博客构建文档

> 给 Claude Code 的执行说明。项目名 **section7**（取自 man page 第 7 节，页眉 `WYY.INK(7)` 的出处），站点域名 **wyy.ink**。
> 视觉参考：`design-ref/G-Home.html`、`design-ref/G-Post.html`（方向 G「网络日志」，浏览器直接打开即可；其中的 `<x-dc>`、`<helmet>` 是设计工具的标签，忽略即可，只参考视觉和结构）。
>
> **执行原则**
> 1. 按第 17 节的里程碑顺序推进，每个里程碑完成后运行验收项，全部通过再进入下一个。
> 2. 文中标注 **【待确认】** 的事项，开工前或做到该处时向用户提问，不要自行假设。
> 3. 文中提到的库版本以执行时 npm 上的最新稳定版为准，先核实再安装；如果某个库的 API 与本文描述不符，以官方文档为准并在 PR/提交说明里注明。
> 4. 不使用任何会在中国大陆加载失败的外部 CDN（Google Fonts、unpkg、jsdelivr 等）。字体、脚本、样式全部自托管。

---

## 1. 目标与非目标

**目标**
- 用 Astro + React 重写 wyy.ink，替换现有 Typecho（handsome 主题）。
- 视觉为方向 G：Unix man page 骨架 + 日志簿 + 蓝调时刻配色；全站富文本带复古质感，但阅读体验是现代标准。
- 纯静态输出（`dist/`），只有评论/阅读量依赖一个自托管的 Artalk 服务。
- 内容以 Markdown/MDX 文件存在仓库里，`git push` 即发布。
- **数学公式的兼容性和正确性是最高优先级之一**（见第 6 节）。

**非目标（v1 不做）**
- 在线后台编辑、登录系统、会员。
- 多语言（站点只有中文，代码和元数据字段用英文）。
- 服务端渲染（SSR）。所有页面都是构建期静态生成。

---

## 2. 技术栈

| 项 | 选型 | 说明 |
|---|---|---|
| 框架 | Astro（最新稳定版，6.x） | `output: 'static'` |
| 交互组件 | React（`@astrojs/react`） | 只用于 island：搜索、目录滚动高亮、图片灯箱、评论挂载、NEW 标签判定等 |
| 语言 | TypeScript strict | |
| 包管理 | pnpm | Node 22 LTS 及以上 |
| 内容 | Astro Content Collections + Zod schema | `.md` 与 `.mdx` 均支持 |
| Markdown 管线 | remark / rehype 插件（见第 7 节） | |
| 数学 | MathJax 构建期渲染为 SVG（见第 6 节） | 不在浏览器端运行 MathJax |
| 代码高亮 | Shiki（Astro 内置）+ `@shikijs/transformers` | |
| 图片 | sharp + 自写抖动处理 | 见第 8 节 |
| 搜索 | Pagefind | 构建后索引，中文分词需验证 |
| 评论 / 阅读量 | Artalk（自托管） | 见第 10 节 |
| 样式 | 原生 CSS + CSS 自定义属性（设计 token） | 不使用 Tailwind，复古细节需要精细控制 |
| 测试 | Vitest（单元）、Playwright（页面与截图） | |
| 代码规范 | ESLint + Prettier | |

---

## 3. 设计系统

完整视觉见 `design-ref/`。以下 token 写进 `src/styles/tokens.css`，全站只通过变量取值。

### 3.1 颜色（亮色，v1 默认）

```css
:root {
  --paper:      #f6f5f1;  /* 页面底色 */
  --paper-2:    #ecebe5;  /* 按钮底、次级块 */
  --card:       #ffffff;  /* 卡片、代码块底 */
  --ink:        #1b2233;  /* 正文、粗线 */
  --ink-2:      #4a5163;  /* 次要文字（在 --paper 上对比度 ≥ 7:1） */
  --rule:       #d9d8d2;  /* 细分隔线 */
  --indigo:     #1f2a5a;  /* 大标题、主按钮、NET/AI 标签、抖动图墨色 */
  --link:       #2a3fb0;
  --link-visited:#5b3a8a;
  --lamp:       #9c4a00;  /* NEW 标签、NOTE 提示，暖色强调 */
  --lamp-bg:    #fbf3e9;
  --on-dark:    #f6f5f1;
  --bevel-hi:   #ffffff;
  --bevel-lo:   #bdbcb4;
}
```

【待确认】暗色模式（“入夜”）是否放进 v1。无论是否放进 v1，都要把颜色全部写成变量，暗色只需另一组变量值。

### 3.2 字体（全部自托管）

| 用途 | 字体 | 获取方式 |
|---|---|---|
| 中文标题/正文 | Noto Serif SC | 按 unicode-range 切片自托管（推荐用“中文网字计划” cn-font-split 或同类工具切片，只加载页面用到的分片） |
| 西文正文 | Source Serif 4 | `@fontsource-variable/source-serif-4` |
| 等宽 | JetBrains Mono | `@fontsource-variable/jetbrains-mono` |

字体栈：
```css
--font-serif: 'Source Serif 4', 'Noto Serif SC', Georgia, serif;
--font-display: 'Noto Serif SC', serif;      /* 900 字重用于大标题 */
--font-mono: 'JetBrains Mono', ui-monospace, monospace;
```
所有字体 `font-display: swap`。首屏必需的分片 preload。

### 3.3 版式结构（man page 骨架）

- 页面最大宽度 1120px，左右内边距 32px（手机 16px）。
- **页眉**：一行等宽小字，三段式 `WYY.INK(7) │ 页面标题 │ WYY.INK(7)`，下方 1px `--ink` 实线。文章页右侧显示 `<SLUG大写>(7)`。
- **页脚**：同样三段式，内容由配置驱动（见第 11 节）。
- **章节**：每个区块左侧 150px 是等宽、全大写、字距 0.1em 的节名（NAME、SYNOPSIS、DESCRIPTION、LOG、NOTES、GUESTBOOK、SEE ALSO……），右侧为内容（`flex: 1 1 600px`）。区块之间用 1px `--rule` 细线分隔。窄屏时节名在上、内容在下。
- 阅读正文最大宽度 720px。

### 3.4 组件外观（必须实现）

- **凸起按钮 `.btn`**：`background: var(--paper-2); border: 1px solid var(--ink); box-shadow: inset 1px 1px 0 var(--bevel-hi), inset -2px -2px 0 var(--bevel-lo);` 按下（`:active`）时两组 inset 阴影互换，产生“按下去”的效果。主按钮 `.btn-primary` 用 `--indigo` 底。最小高度 44px。
- **类型标签 `.type-tag`**：等宽 12px 粗体，最小宽 40px 居中。`NET` 和 `AI` 是 `--indigo` 实心反白，其余类型是 1px 描边。
- **NEW 标签**：等宽 12px 粗体，`--lamp` 底、`#fff8ec` 字，内边距 2px 6px，文案 `NEW!`。规则见第 9 节。
- **QSL 卡片**（评论/留言）：白底，1px `--ink` 边框，`box-shadow: 3px 3px 0 var(--rule)`；顶部一行等宽小字 `TO wyy.ink · <页面>` 与日期，下面是 `FROM <昵称>` 大号等宽字，再下面是留言内容。
- **焦点样式**：所有可交互元素有明显的 2px `--link` outline。

---

## 4. 项目结构

```
section7/
├─ astro.config.ts
├─ src/
│  ├─ config/site.ts            # 站点配置（类型化，见第 11 节）
│  ├─ content.config.ts         # collections + zod schema
│  ├─ content/
│  │  ├─ posts/<slug>/index.md(x) + 同目录图片
│  │  ├─ notes/<YYYY-MM-DD-HHmm>.md
│  │  ├─ projects/<slug>/index.mdx
│  │  ├─ pages/<slug>.mdx       # 任意自定义页面
│  │  └─ home/about.mdx         # 首页“关于我”富文本
│  ├─ data/friends.yaml
│  ├─ components/               # .astro 组件
│  ├─ islands/                  # React 组件（client:* 挂载）
│  ├─ layouts/                  # BaseLayout / PostLayout / PageLayout
│  ├─ lib/                      # dither、math、date、markdown 插件等
│  ├─ pages/                    # 路由
│  └─ styles/                   # tokens.css、prose.css、components.css
├─ public/                      # favicon、字体分片等
├─ scripts/
│  ├─ migrate-typecho/          # 迁移脚本（第 12 节）
│  └─ new-post.ts               # pnpm new <slug> 生成文章模板
├─ tests/                       # vitest + playwright
├─ deploy/                      # nginx 示例、artalk docker-compose、redirects
└─ design-ref/
```

---

## 5. 内容模型（`src/content.config.ts`）

### 5.1 posts

```ts
{
  title: string,
  date: Date,                 // 发布时间，带时区，默认 Asia/Shanghai【待确认】
  updated?: Date,
  type: 'NET' | 'AI' | 'SYS' | 'DEV' | 'OI' | 'ESSAY' | 'LIFE',   // 【待确认】类型清单
  tags: string[] = [],
  summary?: string,           // 列表与 RSS 摘要；缺省取正文前 120 字
  draft: boolean = false,     // 生产构建排除
  series?: { name: string, order: number },
  cover?: image(),
  comments: boolean = true,
  dither: boolean = true,     // 整篇关闭抖动
  math?: boolean,             // 不填则自动检测是否含公式
  legacy?: { cid: number, url: string },  // 迁移来源，用于 301
}
```
- slug 默认取目录名。
- 草稿在 `pnpm dev` 中可见并带“DRAFT”标记，生产构建排除。

### 5.2 notes（原“时光机”）
`{ date: Date, tags?: string[] }`，正文是短 Markdown（可含图片）。

### 5.3 projects
`{ title, summary, status: 'active'|'paused'|'done', period?: string, links?: {label,url}[], cover?, order: number }`，正文 MDX。

### 5.4 pages（任意自定义页面）
`{ title, description?, nav?: { label: string, order: number }, comments: boolean = false, layout: 'page'|'wide' = 'page' }`。
文件 `src/content/pages/foo.mdx` 生成 `/foo/`。设置了 `nav` 的页面自动进入首页 SYNOPSIS 导航。

### 5.5 friends（`src/data/friends.yaml`）
```yaml
- name: 名称
  url: https://example.com
  avatar: https://...   # 可选；构建时下载到本地并做抖动，失败则显示首字母占位
  desc: 一句话介绍
  group: 默认分组名     # 可选，用于分组展示
```

---

## 6. 数学公式（最高优先级）

### 6.1 方案

- 解析：`remark-math`（支持 `$...$` 行内与 `$$...$$` 块级）。
- 渲染：**构建期 MathJax → SVG**。优先使用 MathJax 4（`@mathjax/src`）；如果 4 在 Node 端的集成不成熟，使用 MathJax 3（`mathjax-full`，可通过 `rehype-mathjax/svg` 或自写 rehype 插件调用）。执行前核实两者现状，并在提交说明里写明最终选择和理由。
- 选择 MathJax 而不是 KaTeX 的原因：旧博客（handsome 主题）用的是 MathJax 语法，约 70 篇 OI 文章含大量公式，MathJax 对 LaTeX 的覆盖更全（`\newcommand`、`\label/\ref`、`\require`、扩展宏包）。
- 选择 SVG 输出：不依赖浏览器端加载数学字体，在国内网络下也稳定；浏览器端不运行任何数学 JS。
- 开启 `fontCache: 'global'`（或等价设置）以复用字形路径，减小页面体积。
- 开启辅助 MathML（assistive MathML），保证屏幕阅读器和复制可用。

### 6.2 必须支持的写法（全部写进测试页 `src/content/posts/_math-test/index.md`）

1. 行内 `$a^2+b^2=c^2$`，以及和中文紧贴：`设$x\in\mathbb{R}$，则`。
2. 块级 `$$...$$`，以及迁移来的 `\[...\]`、`\(...\)`（迁移脚本统一转换，见 12.3）。
3. 环境：`align`、`align*`、`aligned`、`gather`、`cases`、`matrix`/`pmatrix`/`bmatrix`、`array`。
4. 编号与引用：`\tag{1}`、`\label{eq:a}` + `\eqref{eq:a}`，在同一篇文章内正确跳转。
5. 宏：文章内 `\newcommand{\R}{\mathbb{R}}` 在后续所有公式生效；`site.ts` 里可配置全局宏（如 `\abs`、`\norm`、`\E`、`\argmin`）。
6. 常用命令：`\operatorname`、`\mathbb`、`\mathcal`、`\boldsymbol`、`\underbrace`、`\overset`、`\binom`、`\lfloor\rfloor`、`\pmod`、`\sum_{i=1}^{n}`、`\prod`、`\int`、`\lim`、`\color`。
7. `\text{中文}` 中的中文字符正确显示（MathJax SVG 对字体外字符的回退要实测）。
8. 化学式 `\ce{H2O}`（mhchem 扩展）。
9. 公式内的 `_`、`*`、`\\`、`|` 不被 Markdown 误解析（表格单元格中的 `|` 需要专门测试）。
10. 普通文本中的美元符号：`价格 \$5` 正常显示；迁移脚本要扫描疑似误判的 `$` 并报告。
11. 超长块级公式在窄屏下横向滚动，不撑破页面。
12. 公式颜色跟随 `currentColor`（为将来的暗色模式做准备）。

### 6.3 正确性保障

- **构建期报错即失败**：MathJax 遇到未知命令或语法错误时（生成 `merror` 节点），构建直接失败，并输出文件名、行号和出错的 TeX 源码。提供 `MATH_STRICT=0` 开关，只在迁移过渡期临时降级为警告。
- Playwright 对数学测试页做截图对比（基线截图入库），防止升级依赖后公式渲染悄悄变化。
- 迁移完成后，对所有含公式的旧文章跑一次全量构建，把报错清单交给用户确认。

---

## 7. Markdown 与富文本

### 7.1 语法支持

- GFM：表格、删除线、任务列表、自动链接、脚注。
- 标题自动锚点（`rehype-slug` + 自写的锚点链接，hover 时显示 `§`）。
- 提示框（`remark-directive`）：`:::note`、`:::tip`、`:::warning`、`:::danger`，也支持自定义标题 `:::note[标题]`。样式：1px 彩色边框，左上角等宽小标签（NOTE / TIP / WARN / DANGER），不使用左侧粗色条。
- 折叠块：`:::details[标题]` → `<details>`，summary 用凸起按钮样式。
- 原生 HTML：`.md` 中允许直接写 HTML；`.mdx` 中可以 import 并使用组件。
- 代码块：Shiki 高亮，支持 `title="文件名"`、行高亮 `{1,3-5}`、diff（`// [!code ++]`）、行号可选；顶部有一条 `--indigo` 标题栏，显示文件名/语言和“复制”按钮（React island 或小段原生脚本）。终端输出（语言为 `console`/`shell-session`）使用深色底。
- `<kbd>` 渲染成凸起的小键帽。
- `==高亮==` → `<mark>`（如果相应插件稳定）。

### 7.2 MDX 组件（`src/components/mdx/`，在 MDX 中默认可用）

`<Figure>`（多图、并排、说明文字）、`<Note>`、`<Details>`、`<Video>`（本地视频/B 站嵌入）、`<LinkCard>`（链接预览卡，构建期抓取 OG 信息并缓存）、`<Terminal>`、`<Columns>`。

【待确认】是否需要 Mermaid 流程图（构建期渲染为 SVG），以及是否需要 B 站/YouTube 嵌入。

### 7.3 富文本的复古样式（`src/styles/prose.css`）

- 链接：`--link` 蓝 + 下划线；访问过的变 `--link-visited` 紫。这是全站复古感的基础，不要去掉下划线。
- 标题：中文衬线 900 字重；h2/h3 前带等宽灰色编号（`1`、`2.1`），由 rehype 插件根据层级自动生成，frontmatter 可关闭。
- 分隔线 `<hr>`：居中的 `· · ·` 等宽字符，或 1px `--ink` 实线（二选一做成配置项）。
- 引用：左侧 2px `--ink` 线，衬线斜体，`--ink-2` 色。
- 表格：上下 1px `--ink` 粗线、行间 `--rule` 细线（三线表），表头等宽小字，窄屏横向滚动。
- 图片说明：等宽 12px，`图 N　说明`，自动编号。
- 脚注：等宽数字上标；文末脚注区标题为 `NOTES`。
- 正文 19px，行高 1.85。

---

## 8. 图片：默认抖动 + 点击看原图

### 8.1 处理流程

1. 构建时，一个 rehype 插件找到文章里的所有本地图片（以及 `cover`、头像、友链头像）。
2. 用 sharp 读取原图，缩放到最大宽度 1400px（保持比例），转灰度，做**双色抖动**：墨色 `--indigo`、纸色 `--paper`。算法可配置：`atkinson`（默认，经典 Mac 风格）、`floyd-steinberg`、`bayer`。
3. 输出索引色 PNG（2 色调色板，体积很小），文件名包含原图内容哈希和参数哈希；缓存到 `.cache/dither/`，原图不变时不重复计算。
4. 原图也经过 Astro 的图片优化（WebP/AVIF，限制最大宽度 2400px）作为“原图”版本。
5. 输出 HTML：
   ```html
   <figure class="dither">
     <a href="/_astro/原图.webp" data-lightbox>
       <img src="/_astro/抖动图.png" alt="…" width height loading="lazy" decoding="async">
     </a>
     <figcaption>图 1　…</figcaption>
   </figure>
   ```
   没有 JS 时，点击链接直接打开原图。

### 8.2 关闭抖动

- 整篇：frontmatter `dither: false`。
- 单张：`![alt](photo.jpg "说明 #nodither")`，或在 MDX 中用 `<Figure dither={false}>`。
- 外链图片默认不抖动、原样显示（可配置为构建时下载并抖动）。
- GIF、SVG 不处理。

### 8.3 灯箱（React island，`client:idle`）

- 点击图片后全屏显示**原图**，背景 `--ink` 90% 不透明度；顶部显示说明文字和“原图 / 抖动”切换按钮。
- 支持 Esc 关闭、方向键在同一篇文章的图片之间切换、滚轮或双指缩放、点击空白处关闭。
- 打开时焦点移入灯箱，关闭后焦点回到原图片；`aria-modal`。
- 原图加载时显示等宽字体的 `LOADING…`。

### 8.4 暗色模式预留
抖动 PNG 的墨色像素用 `--indigo`，纸色用透明；用 CSS 给 `<img>` 容器设 `--paper` 背景。这样将来做暗色模式只需切换背景和一个 `filter`，或者改为 `mask-image` 着色。实现时选一种，并写注释说明。

---

## 9. NEW 标签

- 规则：文章 `date` 距离**访问时刻**不超过 `site.newDays`（默认 30）天，就显示 `NEW!`。
- 因为站点是静态的，判断必须在浏览器里做：渲染 `<span class="new-badge" data-date="2026-11-03T10:00:00+08:00" hidden>NEW!</span>`，用一段内联小脚本（约 10 行，不用 React）在 `DOMContentLoaded` 时移除符合条件元素的 `hidden`。
- 无 JS 时不显示 NEW（宁缺毋滥）。
- 出现位置：首页 LOG 表、文章列表、归档页、文章页头部。
- 单元测试覆盖边界：刚好 30 天、时区跨日、未来日期（定时发布的文章不显示）。

---

## 10. 评论、阅读量、留言簿（Artalk）

### 10.1 服务端
- 提供 `deploy/artalk/docker-compose.yml`（Artalk 官方镜像 + SQLite 数据卷）和 Nginx 反向代理示例，域名放在配置里，例如 `comments.wyy.ink`【待确认】。
- 在说明里写清：开启邮件通知、开启审核、配置管理员账号、允许的站点域名（CORS）。

### 10.2 前端
- `CommentSection` React island，`client:visible` 挂载（滚动到评论区附近才加载 Artalk 的 JS/CSS）。
- Artalk 客户端的 JS 和 CSS 从自己的 Artalk 服务加载，或作为 npm 依赖打包，不使用公共 CDN。
- `pageKey` 使用文章的规范路径（`/posts/<slug>/`）。迁移来的文章要保证 pageKey 与导入的旧评论一致（见 12.4）。
- 用 CSS 覆盖 Artalk 默认样式：每条评论渲染为 **QSL 卡片**（3.4 节），输入框为内凹样式，提交按钮为 `.btn-primary`，文案为“寄出 →”。
- 页面上的标题统一叫 GUESTBOOK。
- 文章 `comments: false` 时不渲染评论区。

### 10.3 阅读量
- 使用 Artalk 自带的页面浏览量统计（pv）。文章页头部元数据显示 `VIEWS 1234`，首页 LOG 表可选显示（默认关闭）。
- 迁移时把旧博客的阅读量导入为初始值（如果 Artalk 支持写入初始 pv；否则在本地数据里存一个 `legacyViews` 字段，前端显示时相加）【执行时核实】。

### 10.4 留言簿页 `/guestbook/`
- 独立页面，pageKey 为 `/guestbook/`，导入旧留言板的留言。
- 首页 GUESTBOOK 区块在浏览器端调用 Artalk API，取全站最新 2 条评论，显示为 QSL 卡片；失败时只显示“寄一张卡片 →”按钮。

---

## 11. 站点配置（`src/config/site.ts`）

所有可变信息集中在这里，带 TypeScript 类型和注释：

```ts
export default {
  url: 'https://wyy.ink',
  title: 'York 的网络日志',
  manName: 'WYY.INK',          // 页眉页脚使用，(7) 自动追加
  description: '计算机网络、AI，以及偶尔的生活。',
  author: { name: 'York', avatar: '/src/assets/avatar.jpg', email: '' },
  newDays: 30,
  timezone: 'Asia/Shanghai',
  nav: [ /* 文章、笔记、项目、友链、留言簿、关于；pages 中带 nav 的页面自动追加 */ ],
  dither: { algorithm: 'atkinson', ink: '#1f2a5a', paper: '#f6f5f1', maxWidth: 1400 },
  math: { strict: true, macros: { R: '\\mathbb{R}', E: '\\mathbb{E}' } },
  artalk: { server: '', site: 'wyy.ink', pageview: true },
  footer: {
    left:   '{{manName}} {{buildDate}}',
    center: '73 de BD1DKW',    // 可改为任意文字或留空
    right:  '{{manName}}(7)',
    blocks: [                  // 页脚下方的额外信息行，按顺序渲染，均可为空
      { type: 'text', value: '© 2018–{{year}} York · CC BY-NC-SA 4.0' },   // 【待确认】许可协议
      { type: 'links', value: [{ label: 'RSS', url: '/rss.xml' }, { label: 'llms.txt', url: '/llms.txt' }] },
      { type: 'html', value: '' },
    ],
    icp:    { number: '', url: 'https://beian.miit.gov.cn/' },             // 为空则不渲染
    police: { number: '', url: '', icon: '/beian-police.png' },           // 公安备案，为空则不渲染
  },
  analytics: { provider: 'none' },  // 预留：umami / plausible，自托管
}
```

验收：清空 `icp.number` 和 `police.number` 时，页脚不出现任何空标签或多余的分隔符。

---

## 12. 从 Typecho 迁移

旧站：Typecho 1.2.1 + handsome 主题，约 102 篇文章、35 条评论，还有时光机、友链、留言板、阅读量。

### 12.1 输入【待确认】
需要用户提供以下之一：
- MySQL 导出的 `.sql` 文件（推荐），或 SQLite 数据库文件；
- 以及 `usr/uploads/` 附件目录的打包。

同时需要确认旧站的固定链接格式（例如 `/archives/{cid}/`、`/index.php/archives/{cid}/` 或 `/{category}/{slug}.html`），用来生成 301 跳转。

### 12.2 脚本 `scripts/migrate-typecho/`
用 TypeScript 编写，`pnpm migrate --sql dump.sql --uploads ./uploads --out src/content`：

1. 读取 `typecho_contents`（`type = 'post'` 为文章，`'page'` 为页面，`status` 区分发布/草稿/私密）、`typecho_metas`（分类、标签）、`typecho_relationships`、`typecho_comments`、`typecho_fields`（自定义字段，例如缩略图、阅读量）。
2. 去掉正文开头的 `<!--markdown-->` 标记；非 Markdown 的旧文章（HTML）保留为 HTML 放进 `.md`。
3. 生成 `src/content/posts/<slug>/index.md`，frontmatter 包括 `title`、`date`（来自 `created`，时区【待确认】）、`updated`（来自 `modified`）、`type`（按 12.5 的映射表）、`tags`、`legacy.cid`、`legacy.url`。slug 优先用 Typecho 的 slug，纯数字或缺失时用标题拼音或 `post-<cid>`。
4. 附件：把正文中指向旧域名 `/usr/uploads/...` 的图片复制到文章目录并改写为相对路径；外链图片保持原样，并记录到报告里。
5. 时光机：handsome 主题的时光机内容通常以评论的形式存在“时光机”页面下（以实际数据库为准），导出为 `src/content/notes/*.md`。
6. 生成迁移报告 `migration-report.md`：每篇文章的转换状态、疑似公式问题、丢失的附件、无法识别的短代码（handsome 的短代码需要逐个列出，并转换为 MDX 组件或纯文本）。

### 12.3 公式转换
- `\(...\)` → `$...$`，`\[...\]` → `$$...$$`。
- 检测并报告：普通文本里落单的 `$`、公式中被 Markdown 转义过的 `\_`、`\*`。
- 迁移后在 `MATH_STRICT=1` 下全量构建，确保旧文章的公式全部能渲染。

### 12.4 评论迁移
- 优先使用 Artalk 官方的数据迁移工具（支持从 Typecho 导入，执行时核实），pageKey 映射到新的 `/posts/<slug>/`。
- 如果官方工具不能满足需求，脚本自行生成 Artalk 支持的导入格式（Artrans JSON）。
- 留言板页面的评论映射到 `/guestbook/`。

### 12.5 分类映射【待确认】

| 旧分类 | 新 type | 备注 |
|---|---|---|
| 随笔 | ESSAY | |
| 日记 | LIFE | |
| OI（及子分类：类目、集训、题目、比赛） | OI | 子分类转为标签 |
| 网络&服务器 | NET | |
| 语言 | DEV | |
| 第四届字节跳动青训营 | DEV | 同时加标签 `青训营` |

### 12.6 跳转
- 生成 `deploy/redirects/nginx-redirects.conf`（`map` 或 `rewrite` 列表）和 `public/_redirects`（Cloudflare Pages 格式），把旧链接 301 到新链接；覆盖旧的分类页、标签页、归档页、RSS 地址。
- 测试：对迁移报告中的每个旧 URL，断言存在对应的跳转规则。

---

## 13. 页面与路由

| 路由 | 内容 |
|---|---|
| `/` | 首页（见 13.1） |
| `/posts/` | 归档：按年份分组的时间线，年份用大号等宽数字；顶部有类型筛选 |
| `/posts/<slug>/` | 文章页（见 13.2） |
| `/posts/<slug>.md` | 文章 Markdown 原文（纯文本，供 AI 和“查看源文件”使用） |
| `/types/<type>/` | 按类型列出 |
| `/tags/`、`/tags/<tag>/` | 标签索引（取代旧的标签云）与标签页 |
| `/notes/` | 全部短动态，时间倒序 |
| `/projects/`、`/projects/<slug>/` | 项目列表与项目详情 |
| `/friends/` | 友情链接（见 13.3） |
| `/guestbook/` | 留言簿 |
| `/search/` | 搜索页（也可以通过快捷键在任意页面打开搜索浮层） |
| `/<slug>/` | `content/pages` 中的自定义页面（关于、其他） |
| `/rss.xml` | 全文 RSS |
| `/llms.txt` | 站点说明和文章索引（按类型分组，链接到 `.md` 原文） |
| `/sitemap-index.xml` | `@astrojs/sitemap` |
| `404` | man 风格：`No manual entry for <路径>`，下面给出搜索框和最近文章 |

### 13.1 首页（参考 `design-ref/G-Home.html`）
从上到下：页眉 → **NAME**（站名 + 一句话描述）→ **SYNOPSIS**（`wyy.ink [文章] [笔记] [项目] [友链] [留言簿] [关于]` 凸起按钮 + 搜索按钮）→ 横幅配图（抖动风格，可配置，可关闭）→ **ABOUT**（头像 + `content/home/about.mdx` 富文本；头像也做抖动，点击看原图）→ **LOG**（最近 N 篇文章的表格：DATE / TYPE / TITLE，NEW 标签，类型筛选链接，“按年份看全部 →”）→ **NOTES**（最近 3 条短动态）→ **GUESTBOOK**（最新 2 条留言 QSL 卡片 + “寄一张卡片 →”）→ **SEE ALSO**（`github(1), projects(7), friends(7), rss.xml(5), llms.txt(5), archive(7)`，内容可配置）→ 页脚。

### 13.2 文章页（参考 `design-ref/G-Post.html`）
- 页眉；左侧节名列显示类型标签和 NEW；标题；元数据栏 `DATE / UPDATED / LENGTH（阅读时长） / VIEWS / SOURCE（.md 原文链接） / REVISIONS（GitHub 上该文件的历史链接）`。
- **SYNOPSIS**：summary。
- **CONTENTS**：文章开头的目录（h2、h3）。
- **文内导航**（需求 6）：
  - 宽屏（≥ 1280px）在右侧显示一个跟随滚动的目录，当前章节高亮（React island，`IntersectionObserver`），可折叠；窄屏时右下角有一个“目录”按钮，点开为底部弹层。
  - 标题锚点可复制链接。
  - 顶部一条 2px `--indigo` 阅读进度条（可配置关闭）。
  - “回到顶部”按钮。
  - 系列文章：文章属于 `series` 时，在开头显示系列名和“第 n / N 篇”，文末列出系列全部文章。
  - 文末：上一篇 / 下一篇；**SEE ALSO**（同标签的 3 篇相关文章）。
- **GUESTBOOK**：评论区。

### 13.3 友链页 `/friends/`
- 读取 `friends.yaml`，按分组展示为卡片（抖动头像、名称、介绍），卡片随机排序或按配置固定排序。
- 页面底部写“申请友链”的说明与本站信息（名称、地址、头像、介绍，带复制按钮），并挂留言簿评论区，用于提交申请。
- 迁移旧站友链（lirewriter、haolin_z、qwerdkr、Chloris、Gekoo、DODOLA's WareHouse、Zarya、WuShuang、Steve Paul、asdfczf 等，以数据库为准）。
- 提供 GitHub Action `check-friends.yml`：每周检测友链可达性，失败时开 issue 提醒，不自动删除。

### 13.4 项目页 `/projects/`
列表为日志表风格（名称 / 状态 / 时间 / 一句话），详情页为 MDX，可以写富文本、放图片和链接。

### 13.5 搜索
- Pagefind 构建后生成索引；验证中文分词效果，必要时调整 `pagefind` 的语言配置或预处理。
- `SearchDialog` React island：按 `/` 或 `⌘K` 打开，等宽输入框，结果显示类型标签、标题、高亮摘要；键盘上下选择、回车打开。

---

## 14. AI 友好与 SEO

- 每篇文章提供 `.md` 原文路由（frontmatter + 正文，公式保持 TeX 源码）。
- `/llms.txt`：按 llms.txt 约定的格式输出站点简介和文章索引。
- 每页输出 JSON-LD（`BlogPosting` / `WebSite`）、Open Graph、canonical。
- OG 图片：构建期为每篇文章生成一张 man page 风格的 1200×630 PNG（Satori 或同类工具），使用站内字体。【可选，可放到最后】

---

## 15. 性能、可访问性、质量要求

- 文章页在没有任何交互的情况下 **0 KB 框架 JS**；island 只在需要时加载。
- Lighthouse（移动端）：Performance ≥ 95，Accessibility = 100，Best Practices ≥ 95，SEO = 100。
- 文字对比度满足 WCAG AA；所有交互元素可用键盘操作；`prefers-reduced-motion` 时关闭动画。
- 构建期检查站内链接，存在死链即失败。
- CI（GitHub Actions）：`pnpm lint`、`pnpm test`、`pnpm build`、Playwright 测试，任何一项失败都阻止部署。

---

## 16. 部署

- 构建产物为纯静态 `dist/`，部署目标做成可配置，提供两份 workflow 示例，用户按需启用：
  - `deploy-rsync.yml`：构建后通过 SSH + rsync 上传到用户自己的服务器（Nginx 托管，附 `deploy/nginx/section7.conf` 示例，包含缓存头、gzip/brotli、`.md` 的 `text/markdown; charset=utf-8` 类型、旧链接跳转 include）。
  - `deploy-cloudflare.yml`：部署到 Cloudflare Pages。
- 【待确认】最终部署位置、Artalk 服务所在机器与域名。
- 备案号只通过配置显示，见第 11 节。

---

## 17. 里程碑与验收

| # | 内容 | 验收标准 |
|---|---|---|
| M0 | 初始化项目、依赖、目录结构、tokens.css、字体自托管、BaseLayout（页眉/页脚/man 章节组件）、`.btn` 等基础组件 | `pnpm dev` 能打开一个只有页眉页脚的空页面，样式与设计稿一致；页面中没有任何外部 CDN 请求 |
| M1 | 内容集合与 schema、文章页、Markdown 管线（第 7 节）、代码高亮 | 示例文章覆盖第 7 节所有语法并正确渲染 |
| M2 | **数学公式**（第 6 节） | 数学测试页全部 12 类用例正确；故意写错一个公式时构建失败并给出位置；截图基线入库 |
| M3 | 图片抖动 + 灯箱（第 8 节） | 本地图片默认抖动、可单张/整篇关闭、缓存生效（第二次构建不重复计算）、灯箱键盘可用、无 JS 时可打开原图 |
| M4 | 首页、归档、类型/标签页、笔记、项目、自定义页面、NEW 标签、文内导航 | 设计稿中的所有区块都在；NEW 单元测试通过；目录高亮与系列导航可用 |
| M5 | Artalk 评论、阅读量、留言簿、友链页 | 本地用 docker-compose 起 Artalk，评论/留言/阅读量全流程跑通；QSL 卡片样式正确 |
| M6 | 搜索、RSS、llms.txt、`.md` 原文、sitemap、JSON-LD、404 | 中文关键词能搜到文章；RSS 通过校验 |
| M7 | Typecho 迁移（第 12 节） | 迁移报告无未处理错误；全部旧文章在 `MATH_STRICT=1` 下构建通过；旧链接跳转规则覆盖完整；旧评论出现在对应文章下 |
| M8 | CI、部署 workflow、性能与可访问性检查 | 第 15 节指标全部达标；按用户选定的方式完成一次真实部署 |

每个里程碑结束后，向用户简要汇报：完成了什么、和设计稿的差异、遇到的问题、下一步需要用户提供或决定的事。

---

## 18. 汇总：需要向用户确认的事项

1. 文章类型清单（`NET / AI / SYS / DEV / OI / ESSAY / LIFE`）以及旧分类的映射表（12.5）。
2. 暗色模式（“入夜”）是否放进 v1。
3. 是否需要 Mermaid 图表、B 站/YouTube 视频嵌入。
4. Typecho 数据库导出文件、附件目录，以及旧站的固定链接格式。
5. 时间戳的时区（默认 Asia/Shanghai）。
6. 内容许可协议（如 CC BY-NC-SA 4.0）。
7. Artalk 部署在哪台机器、使用什么域名；评论是否需要先审核后显示。
8. 最终部署目标（自有服务器 rsync / Cloudflare Pages / 两者都要）。
9. 头像原图、首页 about 文案、首页横幅图片（不提供则使用占位图）。
10. 原图存放策略：直接放仓库，还是体积大时改用 Git LFS / 对象存储。
11. 是否接入自托管的访问统计（Umami / Plausible）。
12. 页脚中间文字是否保留 `73 de BD1DKW`。
