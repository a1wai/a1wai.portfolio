export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Builds the <video> or <img> for a tile. Tile videos are always muted and
 * looping so browsers allow them to autoplay.
 */
export function createMedia(tile, { controls = false, muted = true } = {}) {
  if (tile.type === 'video') {
    const video = document.createElement('video');
    video.muted = muted;
    video.loop = true;
    video.playsInline = true;
    if (muted) video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    // With a poster there's nothing to show until it plays, so fetch nothing yet.
    video.preload = tile.poster && muted ? 'none' : 'metadata';
    if (tile.poster) video.poster = tile.poster;
    if (controls) video.controls = true;
    video.src = tile.src;
    return video;
  }

  const img = document.createElement('img');
  img.alt = '';
  img.decoding = 'async';
  img.draggable = false;
  img.src = tile.src || '';
  return img;
}

export function play(video) {
  if (!video.paused) return;
  const p = video.play();
  if (p) p.catch(() => {});
}
