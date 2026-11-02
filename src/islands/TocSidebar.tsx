import { useEffect, useState } from 'react';

export interface TocItem {
  depth: number;
  slug: string;
  text: string;
}

export default function TocSidebar({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.slug)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: '0px 0px -70% 0px' },
    );
    els.forEach((e) => io.observe(e));
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      removeEventListener('scroll', onScroll);
    };
  }, [items]);

  const list = (cls = '') => (
    <ul className={cls}>
      {items.map((i) => (
        <li key={i.slug} className={i.depth === 3 ? 'd3' : 'd2'}>
          <a href={`#${i.slug}`} aria-current={active === i.slug ? 'true' : undefined} onClick={() => setSheet(false)}>
            {i.text}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {items.length > 0 && (
        <nav className="toc-side" aria-label="文内导航">
          <h2>
            <button
              type="button"
              className="btn"
              style={{ minHeight: 28, fontSize: 12 }}
              onClick={() => setCollapsed((c) => !c)}
              aria-expanded={!collapsed}
            >
              CONTENTS {collapsed ? '+' : '−'}
            </button>
          </h2>
          {!collapsed && list()}
        </nav>
      )}
      <div className="toc-fab" style={{ display: 'flex' }}>
        {items.length > 0 && (
          <button type="button" className="btn" onClick={() => setSheet(true)} aria-haspopup="dialog">
            目录
          </button>
        )}
        {showTop && (
          <button type="button" className="btn" onClick={() => scrollTo({ top: 0 })} aria-label="回到顶部">
            ↑ TOP
          </button>
        )}
      </div>
      {sheet && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="目录"
          className="sheet"
          onKeyDown={(e) => e.key === 'Escape' && setSheet(false)}
        >
          <button type="button" className="btn" onClick={() => setSheet(false)}>
            关闭
          </button>
          {list()}
        </div>
      )}
    </>
  );
}
