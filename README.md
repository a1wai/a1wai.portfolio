# a1wai.portfolio

A one-page portfolio: tiles stacked in 3D on a solid black background. Scroll,
drag or use the arrow keys to move through them; the stream loops forever and
the order is shuffled on every load.

- **Video tiles** play muted in the stream. Clicking one opens the video with
  sound over a blurred background (Esc or click outside to close).
- **Photo tiles** open their link in a new tab.
- **The About tile** opens the About text over a blurred background.

## Run it

```bash
npm install
npm start          # http://localhost:3000
```

## Deploy on Vercel

`vercel.json` deploys `public/` as a static site. Production deploys come from
`main`.

## Adding content

1. Put files in `public/media/videos/` (short `.mp4`, H.264) and
   `public/media/photos/` (`.jpg`, `.png`, `.webp`). Use simple file names
   without spaces or `@`.
2. List them in `public/content.json`:

```jsonc
{
  "site": { "name": "A1WAI" },
  "about": {
    "title": "About",
    "headline": "One bold sentence.",
    "paragraphs": ["…"],
    "links": [{ "label": "Instagram", "url": "https://…" }]
  },
  "tiles": [
    { "type": "video", "src": "/media/videos/clip-01.mp4" },
    { "type": "image", "src": "/media/photos/arminn_ai.jpg", "url": "https://www.instagram.com/arminn_ai" },
    { "type": "about" }
  ]
}
```

Optional for videos: `"poster"` (a still shown while the video loads). File
names are never shown on the site, not even as alt text.
