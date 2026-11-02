import site from '../config/site';

const DAY = 86_400_000;

/** 判断文章是否应显示 NEW!（浏览器端内联脚本使用同一规则，见 BaseLayout） */
export function isNew(date: Date | string | number, now: Date | number = Date.now(), days = site.newDays): boolean {
  const t = new Date(date).getTime();
  const n = typeof now === 'number' ? now : now.getTime();
  if (Number.isNaN(t)) return false;
  const diff = n - t;
  return diff >= 0 && diff <= days * DAY;
}

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: site.timezone, ...opts });

/** 2026-11-03 */
export function ymd(d: Date): string {
  return fmt({ year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** 2026-11-03 10:00 */
export function ymdHm(d: Date): string {
  const parts = Object.fromEntries(
    fmt({ year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

export function year(d: Date): number {
  return Number(fmt({ year: 'numeric' }).format(d));
}

/** 带时区偏移的 ISO 字符串（东八区固定 +08:00，其余回退 UTC） */
export function isoWithZone(d: Date): string {
  if (site.timezone === 'Asia/Shanghai') {
    const shifted = new Date(d.getTime() + 8 * 3600_000);
    return shifted.toISOString().replace('Z', '+08:00');
  }
  return d.toISOString();
}

/** 中文约 400 字/分钟 */
export function readingMinutes(body: string): number {
  const text = body.replace(/```[\s\S]*?```/g, ' ').replace(/\$\$[\s\S]*?\$\$/g, ' ');
  const cjk = (text.match(/[一-鿿]/g) ?? []).length;
  const words = (text.replace(/[一-鿿]/g, ' ').match(/[A-Za-z0-9_]+/g) ?? []).length;
  return Math.max(1, Math.round(cjk / 400 + words / 220));
}

export function applyTemplate(tpl: string, extra: Record<string, string> = {}): string {
  const vars: Record<string, string> = {
    manName: site.manName,
    buildDate: ymd(new Date()),
    year: String(year(new Date())),
    ...extra,
  };
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
}
