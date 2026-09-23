# a1wai.portfolio

A portfolio site with a 3D "tile stream" index: 18 tiles (videos, social media,
builds, projects) stacked in space on a solid black background. Scroll, drag or
use the arrow keys to travel through them; click a tile to open its details.

The bottom bar links to a separate page for each section:
**Index · Videos · Social Media · Builds · Projects · About**.

## Run it

```bash
npm install
npm start          # http://localhost:3000
npm run dev        # same, restarts when server.js changes
```

Set `PORT` to use a different port. Requires Node 18+.

## Editing content

Everything on the site comes from **`data/content.json`**. It is re-read on every
request, so just save and refresh the browser.

- `site`: name, intro text (top left), email, copyright line.
- `pages`: the title and intro for each section page, plus the About page text.
- `tiles`: the 18 tiles, in the order they appear in the stream. Each tile:

```jsonc
{
  "id": "video-01",
  "category": "videos",            // videos | social-media | builds | projects
  "title": "Showreel 2026",
  "subtitle": "Video · 2026",
  "description": "Shown in the detail view.",
  "tags": ["Editing", "Color"],
  "media": {
    "type": "video",               // "video" or "image"
    "src": "/media/videos/video-01.mp4",
    "poster": "/media/videos/video-01.jpg",          // optional, first frame
    "embed": "https://www.youtube.com/embed/VIDEO_ID" // optional, full video in the detail view
  },
  "link": { "label": "Watch full video", "url": "https://..." }
}
```

### Media files

Put your files in `public/media/...` and point `src` at them.

- **Video tiles** play muted and looping. Use short clips (5–15 s) as H.264
  `.mp4`, around 720×720, ideally under 3 MB each. Use `embed` to show the full
  video (YouTube, Vimeo, …) when someone opens the tile.
- **Screenshot tiles** can be `.jpg`, `.png`, `.webp` or `.svg`. Square images
  look best (around 1200×1200).

The sample media in `public/media` is generated placeholder art
(`npm run placeholders`, and `npm run placeholder-videos` which needs Playwright).

## Structure

```
server.js              Express server: static files, page routes, /api/content
data/content.json      all site content
public/index.html      page shell (top intro, bottom bar, detail modal)
public/css/style.css   all styles
public/js/main.js      loads content, client-side routing
public/js/stream.js    the 3D tile stream (layout, scroll, drag, keys, video playback)
public/js/pages.js     section pages (grid) and About page
public/js/modal.js     tile detail view
public/media/          images and videos
```

To reshape the stream (spacing, angle), change the constants at the top of
`public/js/stream.js`.
