import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import { POST_TYPES } from './config/site';

const posts = defineCollection({
  loader: glob({
    pattern: '*/index.{md,mdx}',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.split('/')[0],
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
    }),
});

const notes = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/notes' }),
  schema: z.object({
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
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

export const collections = { posts, notes, projects, pages, home, friends };
