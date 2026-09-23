// Records the six looping placeholder videos (plus a poster frame for each)
// by drawing canvas animations in headless Chromium and capturing them with
// MediaRecorder. Only needed to regenerate the sample media:
//   npm i -D playwright && npm run placeholder-videos
import { execSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PALETTES } from './generate-placeholders.mjs';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'media', 'videos');
const SIZE = 480;
const SECONDS = 4;

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim();
    return import(pathToFileURL(path.join(globalRoot, 'playwright', 'index.mjs')).href);
  }
}

// Runs inside the browser page.
function recordClip({ kind, palette, size, seconds }) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const [frame, panel, a, d] = palette;
  const pad = size * 0.08;
  const inner = size - pad * 2;
  const TAU = Math.PI * 2;

  const scenes = {
    rays(t) {
      const c = inner / 2;
      for (let i = 0; i < 36; i++) {
        const ang = (i / 36) * TAU + t * TAU / 6;
        ctx.strokeStyle = i % 2 ? a : d;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(ang) * 50, c + Math.sin(ang) * 50);
        ctx.lineTo(c + Math.cos(ang) * inner, c + Math.sin(ang) * inner);
        ctx.stroke();
      }
      ctx.fillStyle = a;
      ctx.beginPath();
      ctx.arc(c, c, 34 + Math.sin(t * TAU * 2) * 8, 0, TAU);
      ctx.fill();
    },
    stripes(t) {
      ctx.save();
      ctx.translate(inner / 2, inner / 2);
      ctx.rotate(0.45);
      const gap = 40;
      for (let x = -inner; x < inner; x += gap) {
        ctx.fillStyle = (Math.round((x + inner) / gap)) % 3 ? a : d;
        ctx.fillRect(x + t * gap * 3, -inner, 14, inner * 2);
      }
      ctx.restore();
    },
    rings(t) {
      for (let k = 12; k >= 0; k--) {
        const r = ((k + t * 2) % 12) * 30;
        ctx.strokeStyle = k % 2 ? a : d;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(inner * 0.5, inner * 0.5, r, 0, TAU);
        ctx.stroke();
      }
    },
    confetti(t) {
      const cols = [a, d, frame, '#4ce0b3', '#ff6a00'];
      for (let i = 0; i < 70; i++) {
        const s = Math.sin(i * 91.7) * 43758.5453;
        const rx = s - Math.floor(s);
        const s2 = Math.sin(i * 12.9) * 3758.5453;
        const ry = s2 - Math.floor(s2);
        const y = ((ry + t) % 1) * (inner + 60) - 30;
        const x = rx * inner + Math.sin(t * TAU + i) * 12;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * TAU * (i % 2 ? 1 : -1) + i);
        ctx.fillStyle = cols[i % cols.length];
        ctx.fillRect(-18, -6, 36, 12);
        ctx.restore();
      }
    },
    waves(t) {
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      for (let y = 10, k = 0; y < inner + 40; y += 40, k++) {
        ctx.strokeStyle = k % 2 ? a : d;
        ctx.beginPath();
        for (let x = -10; x <= inner + 10; x += 6) {
          const yy = y + Math.sin(x / 40 + t * TAU + k * 0.7) * 14;
          x === -10 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
    },
    blocks(t) {
      const n = 6;
      const cell = inner / n;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          const phase = (x + y) / (n * 2);
          const rot = Math.sin((t + phase) * TAU) * Math.PI / 2;
          ctx.save();
          ctx.translate(x * cell + cell / 2, y * cell + cell / 2);
          ctx.rotate(rot);
          ctx.fillStyle = (x + y) % 2 ? a : d;
          const s = cell * (0.35 + 0.25 * Math.abs(Math.sin((t + phase) * TAU)));
          ctx.fillRect(-s / 2, -s / 2, s, s);
          ctx.restore();
        }
    },
  };

  function draw(t) {
    ctx.fillStyle = frame;
    ctx.fillRect(0, 0, size, size);
    ctx.save();
    ctx.translate(pad, pad);
    ctx.beginPath();
    ctx.rect(0, 0, inner, inner);
    ctx.clip();
    ctx.fillStyle = panel;
    ctx.fillRect(0, 0, inner, inner);
    scenes[kind](t);
    ctx.restore();
  }

  draw(0);
  const poster = canvas.toDataURL('image/jpeg', 0.85);

  return new Promise((resolve) => {
    const stream = canvas.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 900_000 });
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = async () => {
      const buf = await new Blob(chunks, { type: 'video/webm' }).arrayBuffer();
      let bin = '';
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      canvas.remove();
      resolve({ video: btoa(bin), poster });
    };
    const start = performance.now();
    rec.start();
    (function loop() {
      const elapsed = (performance.now() - start) / 1000;
      if (elapsed >= seconds) return rec.stop();
      draw((elapsed / seconds) % 1);
      requestAnimationFrame(loop);
    })();
  });
}

async function main() {
  const { chromium } = await loadPlaywright();
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<body style="margin:0;background:#000"></body>');
  const kinds = ['rays', 'stripes', 'rings', 'confetti', 'waves', 'blocks'];
  for (const [i, kind] of kinds.entries()) {
    const n = String(i + 1).padStart(2, '0');
    const { video, poster } = await page.evaluate(recordClip, { kind, palette: PALETTES[i], size: SIZE, seconds: SECONDS });
    await writeFile(path.join(OUT, `video-${n}.webm`), Buffer.from(video, 'base64'));
    await writeFile(path.join(OUT, `video-${n}.jpg`), Buffer.from(poster.split(',')[1], 'base64'));
    console.log(`wrote video-${n}.webm (${kind})`);
  }
  await browser.close();
}

main();
