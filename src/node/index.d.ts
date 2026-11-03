import type { AstroIntegration, AstroUserConfig } from 'astro';
import type { SiteConfig, SiteConfigInput } from '../config/types';

export type { SiteConfig, SiteConfigInput };

export interface Section7Result {
  /** 合并默认值后的完整站点配置 */
  site: SiteConfig;
  integrations: AstroIntegration[];
  vite: NonNullable<AstroUserConfig['vite']>;
  markdown: NonNullable<AstroUserConfig['markdown']>;
}

/** 类型辅助：写 site.config.ts 时获得补全 */
export function defineSite(site: SiteConfigInput): SiteConfigInput;
/** 读取 YAML 站点配置（相对博客根目录） */
export function loadSite(path?: string): SiteConfigInput;
/** site 可为配置对象，或 YAML 文件路径，如 section7('site.yaml') */
export default function section7(site?: SiteConfigInput | string): Section7Result;
