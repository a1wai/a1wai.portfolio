import { CATEGORY_LABELS, createMedia, play, reducedMotion } from './media.js';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const pad = (n) => String(n).padStart(2, '0');

// How far a tile at distance `d` from the focused one sits from it,
// expressed as a fraction of the tile size. Tweak these to reshape the stream.
const STEP_X = 0.27;
const STEP_Y = 0.11;
const STEP_Z = 0.5;
const ROTATE_Y = 50; // deg — tiles face the viewer's left, like cards in a rack
const ROTATE_Z = -3;
const VIDEO_RANGE = 5; // only videos this close to focus keep playing

/**
 * The index page: every tile laid out in 3D, one behind the other.
 * Scroll / drag / arrow keys move a float "position" through the stream.
 */
export function createStream({ root, world, tiles, countEl, titleEl, progressEl, onOpen }) {
  const n = tiles.length;
  let target = 0;
  let current = 0;
  let lastDir = 1;
  let visible = false;
  let running = false;
  let lastTime = 0;
  let focusIndex = -1;
  let size = 300;
  let anchorX = 0;
  let anchorY = 0;
  let snapTimer = 0;

  const els = tiles.map((tile, i) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'tile';
    el.setAttribute('aria-label', `${tile.title} (${CATEGORY_LABELS[tile.category] || tile.category})`);

    const face = document.createElement('span');
    face.className = 'tile-face';
    face.append(createMedia(tile.media, { eager: true }));

    const badge = document.createElement('span');
    badge.className = 'tile-badge';
    badge.textContent = CATEGORY_LABELS[tile.category] || tile.category;
    face.append(badge);

    el.append(face);
    el.addEventListener('click', () => {
      if (suppressClick) return;
      goTo(i);
      onOpen(i);
    });
    // Tabbing through tiles scrolls the stream (mouse focus is left to click).
    el.addEventListener('focus', () => el.matches(':focus-visible') && goTo(i));
    world.append(el);
    return { el, video: el.querySelector('video') };
  });

  function layout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const mobile = w < 700;
    size = clamp(Math.min(w * (mobile ? 0.62 : 0.3), h * 0.46), 170, 460);
    anchorX = mobile ? -w * 0.1 : -w * 0.12;
    anchorY = mobile ? h * 0.02 : h * 0.06;
    root.style.setProperty('--tile', `${size}px`);
    render(true);
  }

  function render(force = false) {
    for (let i = 0; i < n; i++) {
      const d = i - current;
      // Tiles already passed swing out to the bottom-left so they never hide
      // the focused tile.
      const past = Math.min(d, 0);
      const x = anchorX + d * size * STEP_X + past * size * 0.95;
      const y = anchorY - d * size * STEP_Y - past * size * 0.3;
      const z = -d * size * STEP_Z;

      // Fade tiles out as they fly past the camera, and far in the distance.
      let opacity = 1;
      if (d < -2.2) opacity = clamp(1 - (-d - 2.2) / 0.6, 0, 1);
      else if (d > 12) opacity = clamp(1 - (d - 12) / 5, 0, 1);

      const { el } = els[i];
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${ROTATE_Y}deg) rotateZ(${ROTATE_Z}deg)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.visibility = opacity < 0.02 ? 'hidden' : '';
      el.style.zIndex = String(1000 - i);
    }

    const idx = clamp(Math.round(current), 0, n - 1);
    if (idx !== focusIndex || force) {
      focusIndex = idx;
      els.forEach(({ el }, i) => el.classList.toggle('is-active', i === idx));
      const tile = tiles[idx];
      countEl.textContent = `${pad(idx + 1)} / ${pad(n)} · ${CATEGORY_LABELS[tile.category] || tile.category}`;
      titleEl.textContent = tile.title;
      syncVideos();
    }
    progressEl.style.transform = `scaleY(${n > 1 ? clamp(current / (n - 1), 0, 1) : 1})`;
  }

  function syncVideos() {
    els.forEach(({ video }, i) => {
      if (!video) return;
      if (visible && Math.abs(i - focusIndex) <= VIDEO_RANGE) play(video);
      else video.pause();
    });
  }

  function frame(time) {
    const dt = lastTime ? Math.min(64, time - lastTime) : 16.7;
    lastTime = time;
    const k = reducedMotion.matches ? 1 : 1 - Math.pow(1 - 0.09, dt / 16.667);
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.0005) current = target;
    render();
    if (current !== target || dragging) {
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  function kick() {
    if (running || !visible) return;
    running = true;
    lastTime = 0;
    requestAnimationFrame(frame);
  }

  function goTo(i) {
    const next = clamp(Math.round(i), 0, n - 1);
    lastDir = next >= target ? 1 : -1;
    target = next;
    kick();
  }

  // Snap to a whole tile, favouring the direction the user was moving in so a
  // small nudge still advances one tile.
  function snap() {
    const t = lastDir > 0 ? Math.ceil(target - 0.2) : Math.floor(target + 0.2);
    target = clamp(t, 0, n - 1);
    kick();
  }

  function markMoved() {
    root.classList.add('has-moved');
  }

  // --- wheel / trackpad --------------------------------------------------
  root.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      let delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (e.deltaMode === 1) delta *= 32;
      else if (e.deltaMode === 2) delta *= window.innerHeight;
      if (!delta) return;
      lastDir = Math.sign(delta);
      target = clamp(target + delta * 0.003, -0.25, n - 0.75);
      markMoved();
      kick();
      clearTimeout(snapTimer);
      snapTimer = setTimeout(snap, 140);
    },
    { passive: false },
  );

  // --- drag (mouse + touch) ----------------------------------------------
  let dragging = false;
  let suppressClick = false;
  let startX = 0;
  let startY = 0;
  let startTarget = 0;
  let pointerId = null;

  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    suppressClick = false;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startTarget = target;
  });

  root.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!suppressClick && Math.hypot(dx, dy) > 6) {
      suppressClick = true;
      root.classList.add('is-dragging');
      root.setPointerCapture(pointerId);
      markMoved();
    }
    if (!suppressClick) return;
    // Dragging left or up travels deeper into the stream.
    const advance = (-dx - dy) / (size * 0.9);
    const next = clamp(startTarget + advance, -0.4, n - 0.6);
    if (next !== target) lastDir = Math.sign(next - target);
    target = next;
    kick();
  });

  const endDrag = (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    root.classList.remove('is-dragging');
    if (suppressClick) snap();
    // Let the click event (fired right after pointerup) see suppressClick.
    setTimeout(() => (suppressClick = false), 0);
  };
  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', endDrag);

  // --- keyboard ------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    if (!visible || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (document.body.classList.contains('modal-open')) return;
    const keys = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 };
    if (e.key in keys) {
      e.preventDefault();
      markMoved();
      goTo(Math.round(target) + keys[e.key]);
    } else if (e.key === 'Home') {
      goTo(0);
    } else if (e.key === 'End') {
      goTo(n - 1);
    } else if (e.key === 'Enter' && !e.target.closest('a, button')) {
      onOpen(Math.round(target));
    }
  });

  window.addEventListener('resize', layout);
  layout();

  return {
    setVisible(value) {
      visible = value;
      root.hidden = !value;
      syncVideos();
      if (value) {
        render(true);
        kick();
      }
    },
    goTo,
  };
}
