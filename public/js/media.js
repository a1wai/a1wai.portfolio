export const CATEGORY_LABELS = {
  videos: 'Videos',
  'social-media': 'Social Media',
  builds: 'Builds',
  projects: 'Projects',
};

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Builds the <video> or <img> for a tile's `media` entry.
 * Videos are always muted + looping so browsers allow them to autoplay.
 */
export function createMedia(media = {}, { controls = false, eager = false } = {}) {
  if (media.type === 'video') {
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.preload = eager ? 'auto' : 'metadata';
    if (media.poster) video.poster = media.poster;
    if (controls) video.controls = true;
    video.src = media.src;
    return video;
  }

  const img = document.createElement('img');
  img.alt = '';
  img.decoding = 'async';
  img.draggable = false;
  img.loading = eager ? 'eager' : 'lazy';
  img.src = media.src || '';
  return img;
}

export function play(video) {
  if (!video.paused) return;
  const p = video.play();
  if (p) p.catch(() => {});
}

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
