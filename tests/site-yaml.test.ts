import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { loadSite } from '../src/node/index.js';
import { mergeSite } from '../src/node/defaults.js';

describe('loadSite', () => {
  it('读取 YAML 并与默认值合并', () => {
    const dir = mkdtempSync(join(tmpdir(), 's7-'));
    writeFileSync(join(dir, 'site.yaml'), 'title: 测试\nauthor:\n  callsign: N0CALL\n');
    const site = mergeSite(loadSite(join(dir, 'site.yaml')));
    expect(site.title).toBe('测试');
    expect(site.author.callsign).toBe('N0CALL');
    expect(site.author.name).toBe('Author');
  });
});
