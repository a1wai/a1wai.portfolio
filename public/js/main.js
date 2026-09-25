import { createLightbox } from './lightbox.js';
import { createStream } from './stream.js';

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
  if (content.site?.name) document.title = content.site.name;
  const lightbox = createLightbox(document.getElementById('lightbox'));

  const stream = createStream({
    root: document.getElementById('stream'),
    world: document.getElementById('stream-world'),
    backdrop: document.getElementById('backdrop-world'),
    tiles: shuffle(content.tiles),
    onOpen(tile) {
      if (tile.type === 'video') lightbox.openVideo(tile);
      else if (tile.type === 'about') lightbox.openAbout(content.about);
      else if (tile.url) window.open(tile.url, '_blank', 'noopener');
    },
  });
  stream.setVisible(true);
}

loadContent()
  .then(start)
  .catch((err) => {
    console.error(err);
    const msg = document.createElement('p');
    msg.className = 'load-error';
    msg.textContent = `Could not load content: ${err.message}`;
    document.body.append(msg);
  });
