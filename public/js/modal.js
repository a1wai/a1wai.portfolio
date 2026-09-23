import { CATEGORY_LABELS, createMedia, play } from './media.js';

/** Full-screen detail view for a single tile, with prev/next through a list. */
export function createModal(root) {
  const mediaEl = root.querySelector('#modal-media');
  const catEl = root.querySelector('#modal-cat');
  const titleEl = root.querySelector('#modal-title');
  const subEl = root.querySelector('#modal-sub');
  const descEl = root.querySelector('#modal-desc');
  const tagsEl = root.querySelector('#modal-tags');
  const linkEl = root.querySelector('#modal-link');
  const closeBtn = root.querySelector('.modal-close');

  let list = [];
  let index = 0;
  let returnFocus = null;

  function show() {
    const tile = list[index];
    mediaEl.replaceChildren();

    if (tile.media?.embed) {
      // Optional: a YouTube/Vimeo/etc. embed URL shown instead of the file.
      const frame = document.createElement('iframe');
      frame.src = tile.media.embed;
      frame.title = tile.title;
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      frame.style.cssText = 'width:100%;height:100%;border:0';
      mediaEl.append(frame);
    } else {
      const media = createMedia(tile.media, { controls: true, eager: true });
      mediaEl.append(media);
      if (media.tagName === 'VIDEO') play(media);
    }

    catEl.textContent = CATEGORY_LABELS[tile.category] || tile.category;
    titleEl.textContent = tile.title;
    subEl.textContent = tile.subtitle || '';
    descEl.textContent = tile.description || '';
    tagsEl.replaceChildren(
      ...(tile.tags || []).map((tag) => {
        const li = document.createElement('li');
        li.textContent = tag;
        return li;
      }),
    );

    linkEl.hidden = !tile.link?.url;
    if (tile.link?.url) {
      linkEl.href = tile.link.url;
      linkEl.textContent = tile.link.label || 'Open';
    }
  }

  function open(tiles, i) {
    list = tiles;
    index = i;
    returnFocus = document.activeElement;
    show();
    root.hidden = false;
    document.body.classList.add('modal-open');
    closeBtn.focus({ preventScroll: true });
  }

  function close() {
    if (root.hidden) return;
    root.hidden = true;
    mediaEl.replaceChildren(); // stops any playing video / embed
    document.body.classList.remove('modal-open');
    returnFocus?.focus?.({ preventScroll: true });
  }

  function step(dir) {
    index = (index + dir + list.length) % list.length;
    show();
  }

  closeBtn.addEventListener('click', close);
  root.addEventListener('click', (e) => {
    if (e.target === root || e.target.classList.contains('modal-inner')) close();
    const stepBtn = e.target.closest('[data-step]');
    if (stepBtn) step(Number(stepBtn.dataset.step));
  });
  document.addEventListener('keydown', (e) => {
    if (root.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
  });

  return { open, close };
}
