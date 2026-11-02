/** 组件统一从这里取站点配置；值来自博客仓库的 site.config.ts，由集成注入为虚拟模块。 */
import site from 'virtual:section7/site';
import type { SiteConfig } from './types';

export default site as SiteConfig;
export { POST_TYPES } from './constants';
export type { PostType } from './constants';
export type { SiteConfig, FooterBlock } from './types';
