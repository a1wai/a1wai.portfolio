// The blurred background ("ambient") layer.
//
// Rather than blurring a full-screen copy of the 3D stream every frame (far
// too slow on phones), the tiles near the front are painted onto a tiny
// canvas (~48px wide) that CSS stretches to fill the screen. Stretching a
// tiny image is itself a blur, and drawing a handful of images into 48px is
// almost free, so this can redraw every frame and even show the videos'
// actual motion.

const WIDTH = 40; // canvas resolution; lower = blurrier and cheaper
const ZOOM = 2.6; // how far the background is zoomed in on the front tile
const FOCUS_X = 0.4; // point it zooms in on, as a fraction of the screen
const FOCUS_Y = 0.55;

export function createAmbient(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  // Blur inside the canvas where supported; otherwise CSS blurs the element.
  const ctxFilter = 'filter' in ctx;
  if (!ctxFilter) canvas.classList.add('no-ctx-filter');

  let screenW = 1;
  let scale = 1;

  function resize(w, h) {
    screenW = w;
    canvas.width = WIDTH;
    canvas.height = Math.max(1, Math.round((WIDTH * h) / w));
    scale = WIDTH / w;
  }

  // items: [{ source, fill, x, y, w, h, alpha }] in screen pixels, far → near.
  function draw(items, screenH) {
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (ctxFilter) ctx.filter = 'blur(3px)';

    const fx = screenW * FOCUS_X;
    const fy = screenH * FOCUS_Y;
    for (const it of items) {
      const x = (fx + (it.x - fx) * ZOOM) * scale;
      const y = (fy + (it.y - fy) * ZOOM) * scale;
      const w = it.w * ZOOM * scale;
      const h = it.h * ZOOM * scale;
      if (x + w < 0 || y + h < 0 || x > canvas.width || y > canvas.height) continue;
      ctx.globalAlpha = it.alpha;
      if (it.fill) {
        ctx.fillStyle = it.fill;
        ctx.fillRect(x, y, w, h);
      } else {
        try {
          ctx.drawImage(it.source, x, y, w, h);
        } catch {
          // Source not decodable yet; skip this frame.
        }
      }
    }
  }

  return { resize, draw };
}
