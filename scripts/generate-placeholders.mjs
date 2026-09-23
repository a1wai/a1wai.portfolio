// Generates the colourful placeholder "screenshots" used by the sample tiles.
// Replace the files in public/media with your real screenshots when ready.
//   npm run placeholders
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'media');
const S = 800; // tile art is square

// [frame, panel, accent, detail]
export const PALETTES = [
  ['#ff2d87', '#1c1a4d', '#ffd400', '#ffffff'],
  ['#ff6a00', '#00a36c', '#ff2d87', '#ffd400'],
  ['#ffd400', '#2aa7ff', '#ff4fa3', '#1c1a4d'],
  ['#7b3fe4', '#ff4fa3', '#4ce0b3', '#ffd400'],
  ['#c8f000', '#ff6a00', '#1c1a4d', '#ffffff'],
  ['#2aa7ff', '#ffd400', '#7b3fe4', '#ff2d87'],
  ['#ff4fa3', '#ffd400', '#00a36c', '#1c1a4d'],
  ['#12c2a5', '#7b3fe4', '#c8f000', '#ffffff'],
  ['#ff3b30', '#ffd400', '#2aa7ff', '#1c1a4d'],
  ['#ffe600', '#e8127c', '#2aa7ff', '#111111'],
  ['#9b5cff', '#c8f000', '#ff2d87', '#ffffff'],
  ['#ff8a00', '#3b1c7a', '#ff4fa3', '#ffd400'],
  ['#00c46b', '#ffe600', '#2a3bff', '#ff2d87'],
  ['#e8127c', '#1c1a4d', '#4ce0b3', '#ffffff'],
  ['#3d5afe', '#ff6a00', '#c8f000', '#ffffff'],
  ['#ffb000', '#7b3fe4', '#ff2d87', '#4ce0b3'],
  ['#b4ff39', '#ff2d87', '#1c1a4d', '#ffffff'],
  ['#ff5e7e', '#2aa7ff', '#ffe600', '#1c1a4d'],
];

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PAD = 64;
const IN = S - PAD * 2;

const patterns = {
  stripes([, , a], r) {
    let out = '';
    for (let x = -IN; x < IN * 2; x += 46) out += `<rect x="${x}" y="-200" width="18" height="${IN + 400}" fill="${a}" transform="rotate(${20 + r() * 20} ${IN / 2} ${IN / 2})"/>`;
    return out;
  },
  dots([, , a, d]) {
    let out = '';
    for (let y = 30; y < IN; y += 60)
      for (let x = 30 + ((y / 60) % 2) * 30; x < IN; x += 60) out += `<ellipse cx="${x}" cy="${y}" rx="22" ry="16" fill="${(x + y) % 180 === 0 ? d : a}"/>`;
    return out;
  },
  rays([, , a, d]) {
    let out = '';
    const c = IN / 2;
    for (let i = 0; i < 48; i++) {
      const ang = (i / 48) * Math.PI * 2;
      const r1 = 90 + (i % 3) * 20;
      out += `<line x1="${c + Math.cos(ang) * r1}" y1="${c + Math.sin(ang) * r1}" x2="${c + Math.cos(ang) * 420}" y2="${c + Math.sin(ang) * 420}" stroke="${i % 2 ? a : d}" stroke-width="6" stroke-linecap="round"/>`;
    }
    return out + `<circle cx="${c}" cy="${c}" r="60" fill="${a}"/>`;
  },
  rings([, , a, d]) {
    let out = '';
    for (let r = 360; r > 0; r -= 40) out += `<circle cx="${IN * 0.35}" cy="${IN * 0.65}" r="${r}" fill="none" stroke="${(r / 40) % 2 ? a : d}" stroke-width="14"/>`;
    return out;
  },
  confetti([, , a, d, f], r) {
    let out = '';
    const cols = [a, d, f, '#4ce0b3', '#ff6a00'];
    for (let i = 0; i < 90; i++) {
      const x = r() * IN, y = r() * IN, w = 20 + r() * 50, h = 10 + r() * 16;
      out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${cols[i % cols.length]}" transform="rotate(${r() * 180} ${x} ${y})"/>`;
    }
    return out;
  },
  waves([, , a, d]) {
    let out = '';
    for (let y = 20, k = 0; y < IN + 60; y += 54, k++) {
      let p = `M -20 ${y}`;
      for (let x = -20; x <= IN + 40; x += 40) p += ` Q ${x + 20} ${y + (k % 2 ? -26 : 26)} ${x + 40} ${y}`;
      out += `<path d="${p}" fill="none" stroke="${k % 2 ? a : d}" stroke-width="14" stroke-linecap="round"/>`;
    }
    return out;
  },
  shards([, , a, d], r) {
    let out = '';
    for (let i = 0; i < 12; i++) {
      const pts = Array.from({ length: 3 }, () => `${r() * IN},${r() * IN}`).join(' ');
      out += `<polygon points="${pts}" fill="${i % 2 ? a : d}" opacity="${0.55 + r() * 0.45}"/>`;
    }
    return out;
  },
  bubbles([, , a, d], r) {
    let out = '';
    for (let i = 0; i < 26; i++) out += `<circle cx="${r() * IN}" cy="${r() * IN}" r="${14 + r() * 60}" fill="${i % 3 ? a : d}"/>`;
    return out;
  },
  zigzag([, , a, d]) {
    let out = '';
    for (let y = 0, k = 0; y < IN + 60; y += 62, k++) {
      let p = `M -20 ${y}`;
      for (let x = -20; x <= IN + 40; x += 44) p += ` L ${x + 22} ${y + 28} L ${x + 44} ${y}`;
      out += `<path d="${p}" fill="none" stroke="${k % 2 ? a : d}" stroke-width="12" stroke-linejoin="round"/>`;
    }
    return out;
  },
};

function frame(palette, inner) {
  const [f, p] = palette;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
<rect width="${S}" height="${S}" fill="${f}"/>
<svg x="${PAD}" y="${PAD}" width="${IN}" height="${IN}" viewBox="0 0 ${IN} ${IN}" overflow="hidden">
<rect width="${IN}" height="${IN}" fill="${p}"/>
${inner}
</svg>
</svg>
`;
}

// A stylised "profile screenshot": avatar, name bars and a post grid.
function socialArt(palette, r) {
  const [, , a, d] = palette;
  let out = `<rect x="40" y="40" width="${IN - 80}" height="${IN - 80}" rx="36" fill="#0b0b0f"/>`;
  out += `<circle cx="130" cy="140" r="54" fill="${a}"/><circle cx="130" cy="140" r="40" fill="${d}"/>`;
  out += `<rect x="210" y="104" width="220" height="24" rx="12" fill="#ffffff"/>`;
  out += `<rect x="210" y="146" width="150" height="16" rx="8" fill="#ffffff" opacity=".45"/>`;
  out += `<rect x="210" y="172" width="260" height="16" rx="8" fill="#ffffff" opacity=".25"/>`;
  const cols = [a, d, palette[0], palette[1]];
  const gx = 76, gy = 236, cell = (IN - 152 - 16) / 3;
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) {
      const x = gx + col * (cell + 8), y = gy + row * (cell + 8);
      if (y + cell > IN - 60) continue;
      out += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="10" fill="${cols[Math.floor(r() * cols.length)]}"/>`;
      out += `<circle cx="${x + cell * (0.3 + r() * 0.4)}" cy="${y + cell * (0.3 + r() * 0.4)}" r="${cell * (0.12 + r() * 0.18)}" fill="${cols[Math.floor(r() * cols.length)]}"/>`;
    }
  return out;
}

async function main() {
  const jobs = [
    { dir: 'social', prefix: 'social', count: 4, offset: 6, social: true },
    { dir: 'builds', prefix: 'build', count: 3, offset: 10 },
    { dir: 'projects', prefix: 'project', count: 5, offset: 13 },
  ];
  const names = Object.keys(patterns);
  for (const job of jobs) {
    await mkdir(path.join(ROOT, job.dir), { recursive: true });
    for (let i = 0; i < job.count; i++) {
      const idx = job.offset + i;
      const palette = PALETTES[idx % PALETTES.length];
      const r = rng(idx * 977 + 13);
      const inner = job.social ? socialArt(palette, r) : patterns[names[idx % names.length]](palette, r);
      const file = path.join(ROOT, job.dir, `${job.prefix}-${String(i + 1).padStart(2, '0')}.svg`);
      await writeFile(file, frame(palette, inner));
      console.log('wrote', path.relative(process.cwd(), file));
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
