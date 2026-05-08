# Verifi — Multi-File Architecture

The Verifi prototype now ships as a small set of files instead of one
giant HTML file. The live app loads the same way for users (one URL,
single-page experience), but you can iterate on individual pages
without touching the monolith.

## Folder structure

```
verifi/
├── index.html              ← shell: chrome + truck drawer + page router
├── shared.css              ← Trinity tokens (light + dark mode)
├── app.css                 ← all chrome + shared component CSS
├── shared-data.js          ← truck/unit data
└── pages/
    ├── software-update.html   ← Software Update page (all viewports + own CSS + own JS)
    └── map.html               ← Map page (stub)
```

## How the live app works

1. User visits the GitHub Pages URL — `index.html` loads
2. Shell renders chrome + the All Trucks page (default landing)
3. User clicks "Software Update" in the sidebar
4. Shell calls `loadPage('update')` → fetches `pages/software-update.html`
5. Shell extracts:
   - `<style data-page-style>` → appended to `<head>`
   - innerHTML of `#dt-page-update` → injected into shell's placeholder
   - innerHTML of `#tb-page-update` → injected into tablet placeholder
   - `<script data-page-script>` → executed (defines `swuFigmaInit`)
6. Shell calls `swuFigmaInit()` to render the page
7. Page is now live in the shell, indistinguishable from before extraction

Subsequent navigation to Software Update reuses the already-loaded page
(idempotent — no re-fetch).

## Working on a page in Claude

When iterating on Software Update:

**Upload to chat:**
- `pages/software-update.html`
- `shared.css`
- `app.css` (only if Claude needs to see chrome styles for context)
- `shared-data.js` (only if Claude needs the truck/unit data)

Claude edits `pages/software-update.html` directly. Hands it back.
Replace one file in your repo. Push. Done.

**No merging step.** The file you give Claude IS the file in the live app.

## Previewing a page standalone

Each `pages/<name>.html` is a complete HTML document. Open it directly
in a browser:

- Shows production-like chrome (sidebar, top bar) inlined for context
- Page renders as it would in the live app
- Sidebar links are inert (no other pages are loaded)

This is for *visual* preview only — interactive flows that depend on
other pages won't work standalone. To test interactions, navigate from
the live shell.

**To preview locally:** browsers may block `file://` `<link>` loads. Use:
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000/pages/software-update.html`.

GitHub Pages handles this automatically — every page is reachable at
`<your-pages>/pages/software-update.html`.

## Cross-cutting changes

If a change affects multiple pages (e.g., "make all truck cards
smaller"), it has to be done **per file**:

- If the rule is in `app.css` (used by 2+ pages), edit `app.css` once
- If the rule is in each page's `<style>` block, edit each page file

The line: **anything used by more than one page belongs in `app.css`,
not in a page file.** Page files only carry rules unique to that page
(e.g., `.swu-*` rules belong in `pages/software-update.html`).

## Merge contracts (don't break these)

| Page             | Container IDs                     | CSS prefix | JS prefix | Init           |
|------------------|-----------------------------------|------------|-----------|----------------|
| software-update  | `dt-page-update`, `tb-page-update` | `.swu-*`   | `swu*`    | `swuFigmaInit` |
| map              | `dt-page-map`, `tb-page-map`       | (none)     | (none)    | (none)         |

The shell expects these container IDs to be present in the page file.
Renaming them breaks the loader.

## What's still in the shell (not extracted)

- All Trucks page (`#dt-page-trucks`, `#tb-content`)
- Units page (`#dt-page-units`, `#tb-page-units`)
- Tickets page (`#dt-page-tickets`)
- Home page (`#dt-page-home`)
- Truck drawer (Manual Control, Sensor, Component Conditions, Truck Logs, Configuration)
- Add Unit drawer
- Mobile views for everything

These pages share heavy infrastructure with the truck drawer. Extract
them later — when you actually need to work on them — using the same
pattern.

## Adding a new page later

Pattern for any future extraction:

1. Cut the page's HTML out of `index.html` and put it in `pages/<name>.html`
   inside `<div id="dt-page-<name>">` and `<div id="tb-page-<name>">`
2. Cut the page's CSS out of `app.css` and put it inside a
   `<style data-page-style="<name>">` block in the page file
3. Cut the page's JS out of `index.html` and put it inside a
   `<script data-page-script="<name>">` block in the page file
4. Replace the page's slot in `index.html` with an empty `<div id="...">` placeholder
5. Add `loadPage('<name>')` call to the appropriate nav function in `index.html`
6. Add chrome wrapper (sidebar + top bar) to the page file for standalone preview

## Checkpoints

| Checkpoint | What                                                            |
|------------|-----------------------------------------------------------------|
| v1         | Map + Software Update added as Coming Soon stubs                |
| v2         | Software Update Figma port (full content, in monolith)          |
| v3         | First extraction attempt (deprecated)                           |
| v4         | Pre-extraction state — last good monolith                       |
| v5         | Multi-file architecture (current)                               |
