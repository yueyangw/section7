import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    // 组件里的虚拟模块在测试中指向主题默认配置
    alias: { 'virtual:section7/site': fileURLToPath(new URL('./tests/site-stub.ts', import.meta.url)) },
  },
  test: { include: ['tests/**/*.test.ts'] },
});
