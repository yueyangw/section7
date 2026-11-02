import { useCallback, useEffect, useRef, useState } from 'react';

interface Item {
  el: HTMLAnchorElement;
  original: string;
  dither: string;
  caption: string;
}

/** 点击文章内 a[data-lightbox] 打开全屏原图；无 JS 时链接直接打开原图 */
export default function Lightbox() {
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState<number | null>(null);
  const [showOriginal, setShowOriginal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const dialog = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const collect = () =>
      Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-lightbox]')).map((el) => {
        const img = el.querySelector('img');
        return {
          el,
          original: el.getAttribute('href') ?? '',
          dither: img?.dataset.ditherSrc ?? img?.src ?? '',
          caption: el.closest('figure')?.querySelector('figcaption')?.textContent ?? img?.alt ?? '',
        };
      });
    setItems(collect());
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-lightbox]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      const list = collect();
      setItems(list);
      opener.current = a;
      setIdx(list.findIndex((i) => i.el === a));
      setShowOriginal(true);
      setScale(1);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const close = useCallback(() => {
    setIdx(null);
    opener.current?.focus();
  }, []);

  const go = useCallback(
    (d: number) => {
      setIdx((i) => (i === null ? i : (i + d + items.length) % items.length));
      setScale(1);
    },
    [items.length],
  );

  useEffect(() => {
    if (idx !== null) {
      dialog.current?.focus();
      setLoading(true);
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.documentElement.style.overflow = '';
      };
    }
  }, [idx !== null]);

  if (idx === null || !items[idx]) return null;
  const it = items[idx];
  const src = showOriginal ? it.original : it.dither;

  return (
    <div
      ref={dialog}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="图片查看"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowRight') go(1);
        else if (e.key === 'ArrowLeft') go(-1);
        else if (e.key === 'Tab') {
          // 简易焦点圈：只有工具栏按钮可聚焦
          const f = dialog.current?.querySelectorAll<HTMLElement>('button');
          if (f && f.length) {
            const first = f[0];
            const last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      }}
    >
      <div className="lightbox-bar">
        <span className="cap">{it.caption || ' '}</span>
        <span>
          {idx + 1} / {items.length}
        </span>
        <button type="button" className="btn" onClick={() => (setShowOriginal((v) => !v), setLoading(true))}>
          {showOriginal ? '看抖动图' : '看原图'}
        </button>
        <button type="button" className="btn" onClick={close} aria-label="关闭">
          关闭 Esc
        </button>
      </div>
      <div
        className="lightbox-stage"
        onClick={(e) => e.target === e.currentTarget && close()}
        onWheel={(e) => setScale((s) => Math.min(6, Math.max(1, s - e.deltaY * 0.002)))}
      >
        {loading && <span className="lightbox-loading">LOADING…</span>}
        <img
          key={src}
          src={src}
          alt={it.caption}
          style={{ transform: `scale(${scale})`, imageRendering: showOriginal ? 'auto' : 'pixelated' }}
          onLoad={() => setLoading(false)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
