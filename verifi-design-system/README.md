# Verifi Design System

A published design system site covering the Verifi brand identity, the Trinity
product foundations, and all 45 components — for sales and marketing, product
and design, and development.

## Publishing to GitHub Pages

This is a static site. No build step is needed to serve it.

1. Push this folder to a repository.
2. Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. The site is live at `https://<org>.github.io/<repo>/`.

`.nojekyll` is present so GitHub serves the files as-is.

## Editing

The HTML is generated. Edit the Python, not the HTML:

    python3 make.py

| File | Holds |
|---|---|
| `build.py` | The page shell, the site map, and the copy-bar / bench helpers |
| `pages_home.py` | The landing page |
| `pages_sections.py` | Brand: overview, the horizon line, logo |
| `pages_rest.py` | Brand: colour, type, imagery, fifth element, voice |
| `pages_rest2.py` | Foundations: colour, type, shape and motion, phases, accessibility |
| `pages_comp.py` | Components: the 45-item catalogue and the six family pages |
| `pages_res.py` | Resources: the three audience routes and the open-items register |
| `make.py` | Builds every page, then fails loudly on a missing page or a broken link |

`assets/css/site.css` and `assets/js/site.js` are hand-written and not generated.

## Sources

- **Identity Guidelines V1.0** — Figma `XMo5SwXcO2GsafmFNTwqM5`. Brand questions: Brittany Cool.
- **Trinity v0.1.3** — the product design system behind the Hub. Product questions: Verifi Design.

Where the two disagree, the difference is documented on
`resources/open-items.html` rather than averaged away.
