import { describe, expect, it } from 'vitest';
import { isNew, ymd, isoWithZone } from '../src/lib/date';

const DAY = 86_400_000;
const pub = new Date('2026-10-01T00:00:00+08:00');

describe('isNew', () => {
  it('刚好 30 天仍显示', () => expect(isNew(pub, pub.getTime() + 30 * DAY, 30)).toBe(true));
  it('超过 30 天不显示', () => expect(isNew(pub, pub.getTime() + 30 * DAY + 1, 30)).toBe(false));
  it('发布当刻显示', () => expect(isNew(pub, pub, 30)).toBe(true));
  it('定时发布（未来日期）不显示', () => expect(isNew(pub, pub.getTime() - 1, 30)).toBe(false));
  it('非法日期不显示', () => expect(isNew('nope', Date.now(), 30)).toBe(false));
});

describe('时区', () => {
  it('UTC 16:30 在东八区已是次日', () => expect(ymd(new Date('2026-11-02T16:30:00Z'))).toBe('2026-11-03'));
  it('isoWithZone 输出 +08:00', () =>
    expect(isoWithZone(new Date('2026-11-03T02:00:00Z'))).toBe('2026-11-03T10:00:00.000+08:00'));
});
