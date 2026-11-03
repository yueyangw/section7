import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import { POST_TYPES } from './src/config/constants';

const posts = defineCollection({
  loader: glob({
    // 支持任意层级，如 posts/2024/05/12/<slug>/index.md；slug 取 index 所在目录名
    pattern: '**/index.{md,mdx}',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.split('/').slice(-2, -1)[0],
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      type: z.enum(POST_TYPES),
      tags: z.array(z.string()).default([]),
      summary: z.string().optional(),
      draft: z.boolean().default(false),
      series: z.object({ name: z.string(), order: z.number() }).optional(),
      cover: image().optional(),
      comments: z.boolean().default(true),
      dither: z.boolean().default(true),
      math: z.boolean().optional(),
      numbering: z.boolean().default(true),
      legacy: z.object({ cid: z.number(), url: z.string() }).optional(),
      /** 旧站阅读量，前端显示时与 Artalk 的 pv 相加 */
      legacyViews: z.number().optional(),
    }),
});

/** 图片：相对当前文件的路径（构建期抖动），或图床 URL（浏览器端抖动） */
const pic = z.union([z.string(), z.object({ src: z.string(), caption: z.string().optional() })]);

const notes = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/notes' }),
  schema: z.object({
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    /** 地点（日志表头 QTH 栏） */
    qth: z.string().optional(),
    /** 天气（日志表头 WX 栏） */
    wx: z.string().optional(),
    /** 0 / 1 / 2 / 3+ 张分别套用不同的图文版式 */
    images: z.array(pic).default([]),
    dither: z.boolean().default(true),
  }),
});

/** 关于页：src/content/about/index.md，版式由 frontmatter 决定，正文进照片旁的文字框 */
const about = defineCollection({
  loader: glob({ pattern: 'index.{md,mdx}', base: './src/content/about' }),
  schema: z.object({
    title: z.string().default('关于'),
    description: z.string().optional(),
    /** 首页导航里的入口；false 则不显示 */
    nav: z.union([z.object({ label: z.string(), order: z.number() }), z.literal(false)]).default({ label: '关于', order: 10 }),
    /** NAME 段下面的一行副标题 */
    tagline: z.string().optional(),
    photo: z.string().optional(),
    photoSide: z.enum(['left', 'right']).default('left'),
    photoCaption: z.string().optional(),
    photoAlt: z.string().default(''),
    /** 文字框里的大号问候语 */
    greeting: z.string().optional(),
    /** 文字框下方的信息表：键为栏名，值为文字，或 { text, href } */
    facts: z.record(z.string(), z.union([z.string(), z.object({ text: z.string(), href: z.string() })])).default({}),
    history: z
      .array(z.object({ year: z.union([z.string(), z.number()]), text: z.string() }))
      .default([]),
    historyPhoto: z.string().optional(),
    historyCaption: z.string().optional(),
    /** NOW 段：在做 / 在读 …… */
    now: z.record(z.string(), z.string()).default({}),
    /** 友链段开头的一句话 */
    friendsIntro: z.string().default('常去的几个站。头像取自对方站点图标。'),
    comments: z.boolean().default(false),
    dither: z.boolean().default(true),
  }),
});

/** QSL 卡：src/content/qsl/<任意名>/card.yaml（图片放同目录），或 src/content/qsl/<名>.yaml */
const qsl = defineCollection({
  loader: glob({
    pattern: '**/*.{yaml,yml}',
    base: './src/content/qsl',
    generateId: ({ entry }) => {
      const parts = entry.replace(/\.ya?ml$/, '').split('/');
      if (parts.length > 1 && /^(card|index|qsl)$/.test(parts.at(-1)!)) parts.pop();
      return parts.join('-').toLowerCase();
    },
  }),
  schema: z.object({
    call: z.string(),
    /** rcvd 收到 / sent 寄出 / mine 本台卡片 */
    dir: z.enum(['rcvd', 'sent', 'mine']).default('rcvd'),
    date: z.coerce.date().optional(),
    utc: z.coerce.string().optional(),
    /** MHz */
    freq: z.coerce.string().optional(),
    /** 缺省时按 freq 推算 */
    band: z.string().optional(),
    mode: z.string().optional(),
    rst: z.coerce.string().optional(),
    dxcc: z.string().optional(),
    qth: z.string().optional(),
    grid: z.string().optional(),
    /** buro / direct / eqsl / lotw …… */
    via: z.string().optional(),
    front: z.string().optional(),
    /** 缺省时用通联记录生成背面 */
    back: z.string().optional(),
    note: z.string().optional(),
    dither: z.boolean().default(true),
  }),
});

const projects = defineCollection({
  loader: glob({
    pattern: '*/index.mdx',
    base: './src/content/projects',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      status: z.enum(['active', 'paused', 'done']),
      period: z.string().optional(),
      links: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
      cover: image().optional(),
      order: z.number().default(0),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    nav: z.object({ label: z.string(), order: z.number() }).optional(),
    comments: z.boolean().default(false),
    layout: z.enum(['page', 'wide']).default('page'),
  }),
});

const home = defineCollection({
  loader: glob({ pattern: '*.{md,mdx}', base: './src/content/home' }),
  schema: z.object({}).passthrough(),
});

const friends = defineCollection({
  loader: file('src/data/friends.yaml'),
  schema: z.object({
    name: z.string(),
    url: z.string().url(),
    avatar: z.string().optional(),
    desc: z.string().default(''),
    group: z.string().default('友链'),
  }),
});

export const collections = { posts, notes, projects, pages, home, friends, about, qsl };
