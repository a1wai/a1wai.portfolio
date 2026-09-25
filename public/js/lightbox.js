import { createMedia, play } from './media.js';

/** Full-screen viewer over a blurred background: a video, or the About text. */
export function createLightbox(root) {
  const content = root.querySelector('#lightbox-content');
  const closeBtn = root.querySelector('.lightbox-close');
  let returnFocus = null;

  function show(node, kind) {
    returnFocus = document.activeElement;
    content.className = `lightbox-content is-${kind}`;
    content.replaceChildren(node);
    root.hidden = false;
    document.body.classList.add('lightbox-open');
    closeBtn.focus({ preventScroll: true });
  }

  function openVideo(tile) {
    // Opened by a click, so the browser allows it to play with sound.
    const video = createMedia(tile, { controls: true, muted: false });
    show(video, 'video');
    play(video);
  }

  function openAbout(about = {}) {
    const wrap = document.createElement('article');
    wrap.className = 'about';
    const add = (tag, text, className) => {
      if (!text) return null;
      const el = document.createElement(tag);
      el.textContent = text;
      if (className) el.className = className;
      wrap.append(el);
      return el;
    };
    add('h2', about.title || 'About', 'about-title');
    add('p', about.headline, 'about-headline');
    (about.paragraphs || []).forEach((p) => add('p', p));
    if (about.links?.length) {
      const list = document.createElement('ul');
      list.className = 'about-links';
      for (const link of about.links) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = `${link.label} ↗`;
        li.append(a);
        list.append(li);
      }
      wrap.append(list);
    }
    show(wrap, 'about');
  }

  function close() {
    if (root.hidden) return;
    root.hidden = true;
    content.replaceChildren(); // stops the video
    document.body.classList.remove('lightbox-open');
    returnFocus?.focus?.({ preventScroll: true });
  }

  closeBtn.addEventListener('click', close);
  // Clicking anywhere outside the video / text closes it.
  root.addEventListener('click', (e) => {
    if (e.target === root || e.target === content) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  return { openVideo, openAbout, close };
}
