import { useEffect, useState } from 'react';

interface C {
  id: number;
  nick: string;
  content: string;
  date: string;
}

/** 首页 GUESTBOOK：浏览器端取全站最新 2 条评论；失败时只显示按钮 */
export default function LatestGuestbook({ server, site, host }: { server: string; site: string; host: string }) {
  const [items, setItems] = useState<C[]>([]);
  useEffect(() => {
    if (!server) return;
    fetch(
      `${server.replace(/\/$/, '')}/api/v2/comments?site_name=${encodeURIComponent(site)}&limit=2&sort_by=date_desc`,
    )
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => setItems(((j.comments ?? j.data ?? []) as C[]).slice(0, 2)))
      .catch(() => setItems([]));
  }, [server, site]);

  const strip = (s: string) =>
    s
      .replace(/<[^>]+>/g, '')
      .replace(/[#>*`]/g, '')
      .slice(0, 80);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {items.length > 0 && (
        <div className="qsl-grid">
          {items.map((c) => (
            <div className="qsl" key={c.id}>
              <div className="qsl-meta">
                <span>TO {host}</span>
                <span>{String(c.date).slice(0, 10)}</span>
              </div>
              <div className="qsl-from">FROM {c.nick}</div>
              <p>{strip(c.content)}</p>
            </div>
          ))}
        </div>
      )}
      <a className="btn btn-primary" style={{ alignSelf: 'flex-start' }} href="/guestbook/">
        寄一张卡片 →
      </a>
    </div>
  );
}
