import { createModal } from './modal.js';
import { cleanupPage, renderAbout, renderCategory } from './pages.js';
import { createStream } from './stream.js';

// URL path -> page key. Must match PAGE_ROUTES in server.js.
const ROUTES = {
  '/': 'index',
  '/videos': 'videos',
  '/social-media': 'social-media',
  '/builds': 'builds',
  '/projects': 'projects',
  '/about': 'about',
};

const pageEl = document.getElementById('page');
const streamEl = document.getElementById('stream');

async function loadContent() {
  const res = await fetch('/content.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(res.statusText);
  try {
    return await res.json();
  } catch (err) {
    throw new Error(`public/content.json is not valid JSON (${err.message})`);
  }
}

// Fisher–Yates shuffle so the stream starts in a different order every load.
function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function start(content) {
  const tiles = shuffle(content.tiles);
  const siteName = content.site?.name || 'Portfolio';

  const modal = createModal(document.getElementById('modal'));
  const stream = createStream({
    root: streamEl,
    world: document.getElementById('stream-world'),
    tiles,
    onOpen: (i) => modal.open(tiles, i),
  });

  function render() {
    const key = ROUTES[location.pathname.replace(/\/+$/, '') || '/'] || 'index';
    modal.close();

    document.querySelectorAll('.nav a').forEach((a) => {
      if (a.dataset.route === key) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    const isIndex = key === 'index';
    document.body.classList.toggle('is-index', isIndex);
    stream.setVisible(isIndex);
    cleanupPage(pageEl);
    pageEl.hidden = isIndex;

    if (isIndex) {
      document.title = `${siteName} — Portfolio`;
      return;
    }

    if (key === 'about') renderAbout(pageEl, content);
    else renderCategory(pageEl, key, content, modal.open);

    document.title = `${content.pages?.[key]?.title || key} — ${siteName}`;
    // Restart the entrance animation on every page change.
    pageEl.style.animation = 'none';
    void pageEl.offsetWidth;
    pageEl.style.animation = '';
    window.scrollTo(0, 0);
  }

  // Client-side navigation for internal links.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-link]');
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    // Nav buttons toggle: pressing the open page's button closes it again.
    const next = link.pathname === location.pathname ? '/' : link.pathname;
    if (next !== location.pathname) history.pushState(null, '', next);
    render();
  });
  window.addEventListener('popstate', render);

  render();
}

loadContent()
  .then(start)
  .catch((err) => {
    console.error(err);
    streamEl.hidden = true;
    pageEl.hidden = false;
    pageEl.innerHTML = `<h1 class="page-title">Oops.</h1><p class="page-intro">Could not load content: ${String(err.message).replace(/</g, '&lt;')}</p>`;
  });
