import { createMedia, play, reducedMotion } from './media.js';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// How far a tile at distance `d` from the front sits from it, expressed as a
// fraction of the tile size. Tweak these to reshape the stream.
const STEP_X = 0.27;
const STEP_Y = 0.11;
const STEP_Z = 0.5;
const ROTATE_Y = 50; // deg — tiles face the viewer's left, like cards in a rack
const ROTATE_Z = -3;
const BEHIND = 3; // tiles kept on screen after they pass the front
const PLAY_AHEAD = 5; // videos this many tiles behind the front still play

/**
 * The index page: every tile laid out in 3D, one behind the other.
 * Scroll / drag / arrow keys move it along; it wraps around endlessly.
 */
export function createStream({ root, world, tiles, onOpen }) {
  const n = tiles.length;
  let target = 0;
  let current = 0;
  let visible = false;
  let running = false;
  let lastTime = 0;
  let size = 300;
  let anchorX = 0;
  let anchorY = 0;

  const els = tiles.map((tile, i) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'tile';
    // Generic screen-reader label only; file names are never exposed.
    el.setAttribute('aria-label', tile.type === 'about' ? 'About' : tile.type === 'video' ? 'Play video' : 'Open link');

    const face = document.createElement('span');
    face.className = 'tile-face';
    if (tile.type === 'about') {
      face.classList.add('tile-about');
      face.textContent = 'About';
    } else {
      face.append(createMedia(tile));
    }
    el.append(face);

    el.addEventListener('click', () => {
      if (!suppressClick) onOpen(tile);
    });
    world.append(el);
    return { el, video: el.querySelector('video'), playing: false };
  });

  function layout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const mobile = w < 700;
    size = clamp(Math.min(w * (mobile ? 0.62 : 0.3), h * 0.46), 170, 460);
    anchorX = mobile ? -w * 0.1 : -w * 0.12;
    anchorY = mobile ? h * 0.02 : h * 0.06;
    root.style.setProperty('--tile', `${size}px`);
    render();
  }

  function render() {
    for (let i = 0; i < n; i++) {
      // Distance from the front, wrapped so the tiles repeat forever.
      const d = ((((i - current + BEHIND) % n) + n) % n) - BEHIND;

      // Tiles already passed swing out to the bottom-left.
      const past = Math.min(d, 0);
      const x = anchorX + d * size * STEP_X + past * size * 0.95;
      const y = anchorY - d * size * STEP_Y - past * size * 0.3;
      const z = -d * size * STEP_Z;

      // Fade out just before wrapping, at both ends, so the jump is invisible.
      let opacity = 1;
      if (d < -2.2) opacity = clamp(1 - (-d - 2.2) / 0.6, 0, 1);
      else if (d > n - BEHIND - 4) opacity = clamp((n - BEHIND - 0.6 - d) / 3.4, 0, 1);

      const tile = els[i];
      tile.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${ROTATE_Y}deg) rotateZ(${ROTATE_Z}deg)`;
      tile.el.style.opacity = opacity.toFixed(3);
      tile.el.style.visibility = opacity < 0.02 ? 'hidden' : '';

      if (tile.video) {
        // Only the tiles near the front play; the rest show their poster, so
        // the page doesn't download every video at once.
        const shouldPlay = visible && d > -1.5 && d < PLAY_AHEAD;
        if (shouldPlay !== tile.playing) {
          tile.playing = shouldPlay;
          shouldPlay ? play(tile.video) : tile.video.pause();
        }
      }
    }
  }

  function frame(time) {
    if (!visible) {
      running = false;
      return;
    }
    const dt = lastTime ? Math.min(64, time - lastTime) : 16.7;
    lastTime = time;
    const k = reducedMotion.matches ? 1 : 1 - Math.pow(1 - 0.09, dt / 16.667);
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.0005) current = target;
    render();
    // Sleep once the stream has settled; input wakes it up again.
    if (current !== target || dragging) {
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  function start() {
    if (running || !visible) return;
    running = true;
    lastTime = 0;
    requestAnimationFrame(frame);
  }

  function push(amount) {
    target += amount;
    start();
  }

  // --- wheel / trackpad --------------------------------------------------
  root.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      let delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (e.deltaMode === 1) delta *= 32;
      else if (e.deltaMode === 2) delta *= window.innerHeight;
      push(delta * 0.003);
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
    }
    if (!suppressClick) return;
    // Dragging left or up travels deeper into the stream.
    target = startTarget + (-dx - dy) / (size * 0.9);
    start();
  });

  const endDrag = (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    root.classList.remove('is-dragging');
    // Let the click event (fired right after pointerup) see suppressClick.
    setTimeout(() => (suppressClick = false), 0);
  };
  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', endDrag);

  // --- keyboard ------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    if (!visible || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (document.body.classList.contains('lightbox-open')) return;
    const keys = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 };
    if (e.key in keys) {
      e.preventDefault();
      push(keys[e.key]);
    }
  });

  window.addEventListener('resize', layout);
  layout();

  return {
    setVisible(value) {
      visible = value;
      root.hidden = !value;
      render();
      start();
    },
  };
}
