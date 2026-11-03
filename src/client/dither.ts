/**
 * 浏览器端抖动：处理图床等远程图片（构建期拿不到文件）。
 *
 * 标记了 data-dither-remote 的 <img> 进入视口时，以 CORS 方式重新加载到 canvas，
 * 用与构建期相同的算法（dither-core）抖成墨色 + 透明纸色，再替换显示。
 * 图床不允许跨域读取像素时保持 CSS 双色滤镜（见 base.css），不会破图。
 * 参数来自 <html data-dither-*>，由 BaseLayout 按站点配置写入。
 */
import { ditherGray } from '../node/dither-core.js';

type Algo = 'atkinson' | 'floyd-steinberg' | 'bayer';

const root = document.documentElement;
const ink = root.dataset.ditherInk ?? '#1f2a5a';
const algo = (root.dataset.ditherAlgo ?? 'atkinson') as Algo;
const maxWidth = Number(root.dataset.ditherMax ?? 1400);
const [ir, ig, ib] = [1, 3, 5].map((i) => parseInt(ink.slice(i, i + 2), 16));

function dither(img: HTMLImageElement) {
  if (img.dataset.ditherState) return;
  img.dataset.ditherState = 'pending';
  const src = img.dataset.originalSrc ?? img.currentSrc ?? img.src;
  const probe = new Image();
  probe.crossOrigin = 'anonymous';
  probe.decoding = 'async';
  probe.onerror = () => (img.dataset.ditherState = 'css');
  probe.onload = () => {
    try {
      const w = Math.min(probe.naturalWidth, maxWidth);
      const h = Math.max(1, Math.round((probe.naturalHeight * w) / probe.naturalWidth));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(probe, 0, 0, w, h);
      const px = ctx.getImageData(0, 0, w, h); // 跨域被拒时这里抛错
      const d = px.data;
      const gray = new Uint8Array(w * h);
      for (let i = 0; i < gray.length; i++) gray[i] = 0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2];
      const bits = ditherGray(gray, w, h, algo);
      for (let i = 0; i < bits.length; i++) {
        d[i * 4] = ir;
        d[i * 4 + 1] = ig;
        d[i * 4 + 2] = ib;
        d[i * 4 + 3] = bits[i] ? 255 : 0;
      }
      ctx.putImageData(px, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return void (img.dataset.ditherState = 'css');
        const url = URL.createObjectURL(blob);
        img.dataset.originalSrc = src;
        img.dataset.ditherSrc = url;
        img.removeAttribute('srcset');
        img.src = url;
        img.dataset.ditherState = 'done';
      }, 'image/png');
    } catch {
      img.dataset.ditherState = 'css';
    }
  };
  probe.src = src;
}

function scan() {
  const imgs = document.querySelectorAll<HTMLImageElement>('img[data-dither-remote]:not([data-dither-state])');
  if (!imgs.length) return;
  if (!('IntersectionObserver' in window)) return imgs.forEach(dither);
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        dither(e.target as HTMLImageElement);
      }
    },
    { rootMargin: '300px' },
  );
  imgs.forEach((i) => io.observe(i));
}

scan();
