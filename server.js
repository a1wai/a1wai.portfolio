import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 3000;

// Every page of the site. They all share one HTML shell; the client-side
// router decides what to render, so deep links and refreshes just work.
// Keep in sync with the rewrites in vercel.json.
const PAGE_ROUTES = ['/', '/videos', '/social-media', '/builds', '/projects', '/about'];

const app = express();
app.disable('x-powered-by');

app.use(
  express.static(PUBLIC_DIR, {
    index: false,
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    // Content edits should show up on a plain refresh.
    setHeaders(res, filePath) {
      if (filePath.endsWith('content.json')) res.set('Cache-Control', 'no-cache');
    },
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
