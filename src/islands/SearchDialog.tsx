import { useCallback, useEffect, useRef, useState } from 'react';

interface Hit {
  url: string;
  title: string;
  excerpt: string;
  type?: string;
}

interface PagefindApi {
  search(
    q: string,
  ): Promise<{ results: { data(): Promise<{ url: string; excerpt: string; meta: Record<string, string> }> }[] }>;
}

let pf: Promise<PagefindApi | null> | null = null;
function loadPagefind() {
  pf ??= import(/* @vite-ignore */ `${'/pagefind/'}pagefind.js`).then((m) => m as PagefindApi).catch(() => null);
  return pf;
}

/** 按 / 或 ⌘K 打开；点击任何带 data-open-search 的元素也会打开 */
export default function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [sel, setSel] = useState(0);
  const [state, setState] = useState<'idle' | 'loading' | 'unavailable'>('idle');
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<Element | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    (opener.current as HTMLElement | null)?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        opener.current = document.activeElement;
        setOpen(true);
      }
    };
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-open-search]');
      if (el) {
        e.preventDefault();
        opener.current = el;
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!q.trim()) {
      setHits([]);
      return;
    }
    let cancelled = false;
    setState('loading');
    (async () => {
      const api = await loadPagefind();
      if (cancelled) return;
      if (!api) return setState('unavailable');
      const res = await api.search(q);
      const data = await Promise.all(res.results.slice(0, 8).map((r) => r.data()));
      if (cancelled) return;
      setHits(data.map((d) => ({ url: d.url, title: d.meta.title ?? d.url, excerpt: d.excerpt, type: d.meta.type })));
      setSel(0);
      setState('idle');
    })();
    return () => {
      cancelled = true;
    };
  }, [q, open]);

  if (!open) return null;

  return (
    <div
      className="search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="搜索"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSel((s) => Math.min(s + 1, hits.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSel((s) => Math.max(s - 1, 0));
        } else if (e.key === 'Enter' && hits[sel]) location.href = hits[sel].url;
      }}
    >
      <div className="search-box">
        <input
          ref={input}
          className="search-input"
          type="search"
          placeholder="$ grep …"
          aria-label="搜索关键词"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {state === 'unavailable' && <p className="search-hint">搜索索引不可用（开发模式下需先运行 pnpm build）。</p>}
        {q && state === 'idle' && hits.length === 0 && <p className="search-hint">No manual entry for “{q}”。</p>}
        <ul className="search-results" role="listbox">
          {hits.map((h, i) => (
            <li key={h.url} role="option" aria-selected={i === sel}>
              <a href={h.url}>
                <span className="t">{h.title}</span>
                <span className="x" dangerouslySetInnerHTML={{ __html: h.excerpt }} />
              </a>
            </li>
          ))}
        </ul>
        <p className="search-hint">↑↓ 选择 · Enter 打开 · Esc 关闭</p>
      </div>
    </div>
  );
}
