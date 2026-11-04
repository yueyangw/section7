import { describe, expect, it } from 'vitest';
import { parsePinned } from '../src/node/github.js';

// 截取自 GitHub 主页置顶区的结构（省略无关属性）
const item = (href: string, extra = '') => `
<li class="mb-3 d-flex pinned-item-list-item js-pinned-item-list-item">
  <div class="Box"><div class="pinned-item-list-item-content">
    <span><a href="${href}" class="Link text-bold"><span class="repo">${href.split('/').pop()}</span></a></span>
    <p class="pinned-item-desc color-fg-muted">
      一个黑白棋游戏。
    </p>
    <p class="mb-0 mt-2 f6">
      <span><span class="repo-language-color" style="background-color: #b07219"></span>
      <span itemprop="programmingLanguage">Java</span></span>
      ${extra}
    </p>
  </div></div>
</li>`;

describe('parsePinned', () => {
  it('按页面顺序解析仓库、描述、语言、星标与 fork', () => {
    const html = `<ol>${item('/me/othello', '<a href="/me/othello/stargazers"><svg></svg> 1,234 </a><a href="/me/othello/forks"><svg></svg> 2.5k </a>')}${item('/other/lib')}</ol>`;
    expect(parsePinned(html)).toEqual([
      {
        owner: 'me',
        name: 'othello',
        url: 'https://github.com/me/othello',
        description: '一个黑白棋游戏。',
        language: 'Java',
        languageColor: '#b07219',
        stars: 1234,
        forks: 2500,
        homepage: '',
      },
      expect.objectContaining({ owner: 'other', name: 'lib', stars: 0, forks: 0 }),
    ]);
  });
  it('没有置顶区时返回空数组', () => {
    expect(parsePinned('<html><body>nothing</body></html>')).toEqual([]);
  });
});
