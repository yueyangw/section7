import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const slug = process.argv[2];
if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error('用法: pnpm new <slug>   （slug 仅限小写字母、数字、连字符）');
  process.exit(1);
}
const dir = join('src/content/posts', slug);
if (existsSync(dir)) {
  console.error(`已存在: ${dir}`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });
const now = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
// 东八区本地时间
const local = new Date(now.getTime() + 8 * 3600_000);
const iso = `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:00+08:00`;
writeFileSync(
  join(dir, 'index.md'),
  `---\ntitle: ${slug}\ndate: ${iso}\ntype: ESSAY\ntags: []\nsummary: \ndraft: true\n---\n\n正文。\n`,
);
console.log(`已创建 ${join(dir, 'index.md')}`);
