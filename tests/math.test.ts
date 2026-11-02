import { describe, expect, it } from 'vitest';
import { createMathRenderer } from '../src/lib/math';

describe('math', () => {
  const r = createMathRenderer({ macros: { R: '\\mathbb{R}' } });
  it('渲染为 SVG 且带辅助 MathML', () => {
    const { html, error } = r.render('a^2+b^2=c^2', false);
    expect(error).toBeUndefined();
    expect(html).toContain('<svg');
    expect(html).toContain('mjx-assistive-mml');
    expect(html).toContain('currentColor');
  });
  it('站点宏与文内 \\newcommand 生效', () => {
    expect(r.render('\\R', false).error).toBeUndefined();
    expect(r.render('\\newcommand{\\RR}{\\mathbb{R}}', false).error).toBeUndefined();
    expect(r.render('\\RR^n', false).error).toBeUndefined();
  });
  it('mhchem 与 \\text{中文}', () => {
    expect(r.render('\\ce{H2O}', false).error).toBeUndefined();
    expect(r.render('\\text{中文}', false).error).toBeUndefined();
  });
  it('\\label / \\eqref', () => {
    expect(r.render('\\begin{align}a&=1\\label{eq:x}\\end{align}', true).error).toBeUndefined();
    expect(r.render('\\eqref{eq:x}', false).html).toContain('mjx-eqn');
  });
  it('未知命令报错并带 TeX 源码', () => {
    const { error } = r.render('\\nosuchcommand{x}', false);
    expect(error?.message).toMatch(/Undefined control sequence/);
    expect(error?.tex).toBe('\\nosuchcommand{x}');
  });
});
