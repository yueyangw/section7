import { describe, expect, it } from 'vitest';
import { iconCandidates } from '../src/node/favicon.js';

describe('iconCandidates', () => {
  it('优先 apple-touch-icon，其次尺寸大的 icon，最后 /favicon.ico', () => {
    const html = `
      <link rel="icon" href="/a-16.png" sizes="16x16">
      <link rel="apple-touch-icon" href="https://cdn.example.com/touch.png">
      <link href='/b-64.png' rel='shortcut icon' sizes='64x64'>
      <link rel="stylesheet" href="/x.css">`;
    expect(iconCandidates(html, 'https://example.com/blog/')).toEqual([
      'https://cdn.example.com/touch.png',
      'https://example.com/b-64.png',
      'https://example.com/a-16.png',
      'https://example.com/favicon.ico',
    ]);
  });
  it('没有 link 时只剩 /favicon.ico', () => {
    expect(iconCandidates('<html></html>', 'https://a.dev/x/y')).toEqual(['https://a.dev/favicon.ico']);
  });
});
