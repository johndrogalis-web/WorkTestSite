# Verifi Design System

A documentation site for the Verifi brand identity and the Trinity product design
system. Persistent left rail, one page per component, the same page template every
time — modelled on Adobe Spectrum and Salesforce Lightning rather than on a
marketing site.

28 pages: 3 Get started, 7 Foundations, 13 Components (a 45-item catalogue plus 12
component pages), 4 Brand including a downloadable asset library, and the open-items
register.

## Publishing

Double-click **`publish.bat`**, then drag the folder it makes onto GitHub Desktop.
Full detail and the reasoning is in **`PUBLISHING.md`**.

The site is 226 files and 94 MB. `Images/` and `Logo/` are another 1 GB and are
excluded — they are source assets, not part of the site.

## Editing

The HTML is generated. Edit the Python, not the HTML:

    python3 mk.py

| File | Holds |
|---|---|
| `core.py` | The shell, the rail navigation, and `cpage()` — the component page template every component page is assembled from |
| `comp_proof.py` | Breadcrumbs and Table, built directly from their Figma specs |
| `comp_rest.py` | The other ten component pages and the 45-item catalogue |
| `found.py` | The seven Foundations pages |
| `rest.py` | Get started, Brand, and the open-items register |
| `mk.py` | Builds every page, then fails loudly on a missing page or a broken link |

`assets/css/site.css` and `assets/js/site.js` are hand-written, not generated.

### Adding a component page

Add the route to the right family inside `NAV` in `core.py`, write a function that
returns `cpage(...)`, and register it in `mk.py`. The template enforces section
order, so pages cannot drift apart. `SITEMAP.md` lists which components are queued
next.

### Rail grouping

Components are grouped in the rail by Trinity's own family names — Actions,
Navigators, Form elements, Informers, Containers, Hub — and each family collapses.
The family containing the current page opens automatically; families the reader
opens stay open for the session; the filter box opens all of them while it has
text. Keep families alphabetical inside.

## Copy behaviour

Every variant block carries its own **Copy HTML** and **Copy CSS**, scoped to that
variant only — the primary button's Copy CSS gives you the primary button, not every
button in the system. There is no whole-system download by design.

## Asset pipeline

`Images/` and `Logo/` are the source folders synced from OneDrive — about 1 GB of
print-resolution PNGs, EPS and ProRes. **They are gitignored and must not be
committed.** The site ships optimised derivatives in `assets/downloads/` (~137 MB):

| Tier | What it is |
|---|---|
| `preview/` | 720px WebP thumbnails, used by the page itself |
| `photography/*-web.jpg` | 1600px, ~180 KB — decks, documents, email, web |
| `photography/*-large.jpg` | 4096px, ~1.3 MB — print to about 13in at 300dpi |
| `logo/` | SVG, PNG and EPS, untouched from source |
| `animation/` | 4K and 1080 MP4 (re-encoded, visually lossless), WebM with alpha, ProRes 4444 |
| `fifth-element/` | Stills and video loops, untouched from source |

`assets_data.py` is the generated manifest that `dl.py` reads. If the source folders
change, regenerate it rather than editing it by hand — the pipeline is documented in
the commit history and uses PIL for stills and ffmpeg for video.

The 4K animation MP4s were re-encoded from 30 MB to 78 KB at 68 dB PSNR against the
originals. The sources were ~48 Mbps for five seconds of flat graphics.

## Sources

- **Identity Guidelines V1.0** — Figma `XMo5SwXcO2GsafmFNTwqM5`. Brand questions: Brittany Cool.
- **Trinity v0.1.3** — Figma `Lx7MN3Ztd0qxhyF7rVAiOa`. Product questions: Verifi Design.

Breadcrumbs comes from node `63904:41676` (a complete written specification) and Table
from `63544:2653`. Where the two systems disagree, the difference is documented on
`open-items.html` rather than averaged away.
