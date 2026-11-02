import { useEffect, useRef, useState } from 'react';

interface Props {
  server: string;
  site: string;
  pageKey: string;
  pageTitle: string;
}

/** Artalk 评论区：滚动到附近才加载（client:visible）。Artalk 的 JS/CSS 打包进站点，不走公共 CDN。 */
export default function CommentSection({ server, site, pageKey, pageTitle }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!server || !el.current) return;
    let instance: { destroy(): void } | undefined;
    (async () => {
      try {
        const [{ default: Artalk }] = await Promise.all([import('artalk'), import('artalk/dist/Artalk.css')]);
        instance = Artalk.init({
          el: el.current!,
          server,
          site,
          pageKey,
          pageTitle,
          pvEl: '',
          countEl: '',
          placeholder: '写点什么吧（寄出一张卡片）',
          sendBtn: '寄出 →',
          locale: 'zh-CN',
        });
      } catch {
        setFailed(true);
      }
    })();
    return () => instance?.destroy();
  }, [server, site, pageKey, pageTitle]);

  if (!server) return <p className="comments-note">评论服务尚未配置（site.ts → artalk.server）。</p>;
  if (failed) return <p className="comments-note">评论加载失败，请稍后刷新重试。</p>;
  return <div ref={el} className="qsl-comments" />;
}
