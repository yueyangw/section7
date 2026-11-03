import { defineConfig } from 'astro/config';
import section7 from 'section7-theme';
// 站点配置写在 site.yaml；也可以传入对象（旧的 site.config.ts 写法）
const s7 = section7('site.yaml');

export default defineConfig({
  site: s7.site.url,
  output: 'static',
  trailingSlash: 'always',
  integrations: s7.integrations,
  markdown: s7.markdown,
  vite: s7.vite,
});
