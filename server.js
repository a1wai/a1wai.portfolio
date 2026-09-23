import express from 'express';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const CONTENT_FILE = path.join(__dirname, 'data', 'content.json');
const PORT = Number(process.env.PORT) || 3000;

// Every page of the site. They all share one HTML shell; the client-side
// router decides what to render, so deep links and refreshes just work.
const PAGE_ROUTES = ['/', '/videos', '/social-media', '/builds', '/projects', '/about'];

const app = express();
app.disable('x-powered-by');

// Content is re-read on every request so edits to data/content.json show up
// on refresh without restarting the server.
app.get('/api/content', async (req, res) => {
  try {
    const raw = await readFile(CONTENT_FILE, 'utf8');
    res.set('Cache-Control', 'no-cache');
    res.json(JSON.parse(raw));
  } catch (err) {
    console.error(`[content] ${err.message}`);
    res.status(500).json({ error: 'Could not load data/content.json', detail: err.message });
  }
});

app.use(
  express.static(PUBLIC_DIR, {
    index: false,
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  }),
);

app.get(PAGE_ROUTES, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
});

app.listen(PORT, () => {
  console.log(`Portfolio running at http://localhost:${PORT}`);
});
