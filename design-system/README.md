# Verifi Design System

A documentation site for the Verifi brand identity and the Trinity product design
system. Persistent left rail, one page per component, the same page template every
time — modelled on Adobe Spectrum and Salesforce Lightning rather than on a
marketing site.

27 pages: 3 Get started, 7 Foundations, 13 Components (a 45-item catalogue plus 12
component pages), 3 Brand, and the open-items register.

## Publishing to GitHub Pages

Static site, no build step needed to serve it.

1. Push this folder to a repository.
2. Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Live at `https://<org>.github.io/<repo>/`.

`.nojekyll` is present so GitHub serves the files as-is.

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

Add the route to `NAV` in `core.py`, write a function that returns `cpage(...)`, and
register it in `mk.py`. The template enforces section order, so pages cannot drift
apart. `SITEMAP.md` lists which components are queued next.

## Copy behaviour

Every variant block carries its own **Copy HTML** and **Copy CSS**, scoped to that
variant only — the primary button's Copy CSS gives you the primary button, not every
button in the system. There is no whole-system download by design.

## Sources

- **Identity Guidelines V1.0** — Figma `XMo5SwXcO2GsafmFNTwqM5`. Brand questions: Brittany Cool.
- **Trinity v0.1.3** — Figma `Lx7MN3Ztd0qxhyF7rVAiOa`. Product questions: Verifi Design.

Breadcrumbs comes from node `63904:41676` (a complete written specification) and Table
from `63544:2653`. Where the two systems disagree, the difference is documented on
`open-items.html` rather than averaged away.
