import { defineSite } from 'section7-theme';

/** 示例站点配置：只写要覆盖的字段，其余取主题默认值（见 src/node/defaults.js） */
export default defineSite({
  url: 'https://example.com',
  title: 'section7 demo',
  manName: 'DEMO',
  description: '主题演示站点。',
  footer: { center: '73' },
});
