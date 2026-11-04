import { useEffect, useRef, useState } from 'react';

interface Props {
  server: string;
  site: string;
  pageKey: string;
  pageTitle: string;
}

/** 给编辑框的输入框和正文区加上日志式栏名（FROM / EMAIL / WEB / MESSAGE） */
function labelEditor(root: HTMLElement) {
  const fields: [string, string][] = [
    ['.atk-name', 'FROM'],
    ['.atk-email', 'EMAIL'],
    ['.atk-link', 'WEB'],
  ];
  for (const [sel, text] of fields) {
    const input = root.querySelector<HTMLInputElement>(`.atk-main-editor > .atk-header ${sel}`);
    if (!input || input.parentElement?.classList.contains('s7-field')) continue;
    const label = document.createElement('label');
    label.className = 's7-field';
    const span = document.createElement('span');
    span.className = 's7-label';
    span.textContent = text;
    input.replaceWith(label);
    label.append(span, input);
  }
  const wrap = root.querySelector('.atk-main-editor > .atk-textarea-wrap');
  if (wrap && !wrap.querySelector('.s7-label')) {
    const span = document.createElement('span');
    span.className = 's7-label';
    span.textContent = 'MESSAGE';
    span.setAttribute('aria-hidden', 'true');
    wrap.prepend(span);
  }
}

/** Artalk 评论区：滚动到附近才加载（client:visible）。Artalk 的 JS/CSS 打包进站点，不走公共 CDN；站点风格见 styles/comments.css。 */
export default function CommentSection({ server, site, pageKey, pageTitle }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!server || !el.current) return;
    let instance: { destroy(): void } | undefined;
    (async () => {
      try {
        const [{ default: Artalk }] = await Promise.all([import('artalk'), import('artalk/dist/Artalk.css')]);
        // 换皮样式必须排在 Artalk.css 之后
        await import('../styles/comments.css');
        instance = Artalk.init({
          el: el.current!,
          server,
          site,
          pageKey,
          pageTitle,
          pvEl: '',
          countEl: '',
          placeholder: '写点什么吧',
          noComment: '「此时无声胜有声」',
          sendBtn: '寄出 →',
          locale: 'zh-CN',
        });
        labelEditor(el.current!);
      } catch {
        setFailed(true);
      }
    })();
    return () => instance?.destroy();
  }, [server, site, pageKey, pageTitle]);

  if (!server) return <p className="comments-note">评论服务尚未配置（site.ts → artalk.server）。</p>;
  if (failed) return <p className="comments-note">评论加载失败，请稍后刷新重试。</p>;
  return <div ref={el} className="s7-comments" />;
}
