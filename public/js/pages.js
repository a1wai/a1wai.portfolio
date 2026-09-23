import { createMedia, escapeHtml, play, reducedMotion } from './media.js';

const pad = (n) => String(n).padStart(2, '0');

let observer = null;

/** Tears down anything the previous page left running. */
export function cleanupPage(pageEl) {
  observer?.disconnect();
  observer = null;
  pageEl.replaceChildren();
}

/** Videos / Social Media / Builds / Projects: a grid of that category's tiles. */
export function renderCategory(pageEl, key, content, openModal) {
  const meta = content.pages?.[key] || { title: key };
  const tiles = content.tiles.filter((t) => t.category === key);

  pageEl.innerHTML = `
    <header class="page-head">
      <h1 class="page-title">${escapeHtml(meta.title)}<sup>(${pad(tiles.length)})</sup></h1>
      <p class="page-intro">${escapeHtml(meta.intro || '')}</p>
    </header>
    <div class="grid"></div>`;

  const grid = pageEl.querySelector('.grid');

  // Only play the videos that are actually on screen.
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target.querySelector('video');
        if (!video) continue;
        entry.isIntersecting ? play(video) : video.pause();
      }
    },
    { threshold: 0.2 },
  );

  tiles.forEach((tile, i) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.style.setProperty('--i', i);

    const media = document.createElement('div');
    media.className = 'card-media';
    media.append(createMedia(tile.media));
    if (tile.media?.type === 'video') {
      const live = document.createElement('span');
      live.className = 'play-dot';
      live.textContent = 'Playing';
      media.append(live);
    }

    const metaEl = document.createElement('div');
    metaEl.className = 'card-meta';
    metaEl.innerHTML = `<span class="card-title">${escapeHtml(tile.title)}</span><span class="card-sub">${escapeHtml(tile.subtitle || '')}</span>`;

    card.append(media, metaEl);
    card.addEventListener('click', () => openModal(tiles, i));
    if (!reducedMotion.matches) addTilt(card, media);
    grid.append(card);
    observer.observe(card);
  });
}

// Subtle 3D tilt that follows the cursor.
function addTilt(card, target) {
  card.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    target.style.setProperty('--ry', `${px * 14}deg`);
    target.style.setProperty('--rx', `${-py * 14}deg`);
  });
  card.addEventListener('pointerleave', () => {
    target.style.setProperty('--ry', '0deg');
    target.style.setProperty('--rx', '0deg');
  });
}

export function renderAbout(pageEl, content) {
  const about = content.pages?.about || {};
  const site = content.site || {};

  const sections = (about.sections || [])
    .map(
      (s) => `
      <div class="about-block">
        <h3>${escapeHtml(s.title)}</h3>
        <ul>${(s.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </div>`,
    )
    .join('');

  const links = (about.links || [])
    .map((l) => `<li><a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label)} ↗</a></li>`)
    .join('');

  pageEl.innerHTML = `
    <header class="page-head">
      <h1 class="page-title">${escapeHtml(about.title || 'About')}</h1>
    </header>
    <div class="about">
      <div class="about-text">
        <p class="about-headline">${escapeHtml(about.headline || '')}</p>
        ${(about.paragraphs || []).map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
      </div>
      <div class="about-side">
        ${sections}
        <div class="about-block">
          <h3>Contact</h3>
          <ul>
            ${site.email ? `<li><a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a></li>` : ''}
            ${links}
          </ul>
        </div>
      </div>
    </div>`;
}
