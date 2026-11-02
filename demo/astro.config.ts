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
