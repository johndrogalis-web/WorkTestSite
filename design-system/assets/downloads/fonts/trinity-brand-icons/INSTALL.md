# TrinityBrandIcons — Install & Use

The company's brand icon set — **16 icons** — as a font, separate from TrinityIcons.

## Files
| File | Use |
|---|---|
| `TrinityBrandIcons.ttf` | **Install this** — desktop + Figma |
| `TrinityBrandIcons.woff2` / `.woff` | Web fonts |
| `TrinityBrandIcons.css` | `@font-face` + `.brand-<name>` classes |
| `TrinityBrandIcons.json` | name → codepoint map |

## Install
**macOS:** double-click `TrinityBrandIcons.ttf` → **Install Font**. Then quit & reopen Figma.

## Use in Figma
Text layer → font **TrinityBrandIcons** → type the icon name (e.g. `ready-mix-truck`, `co2-carbon-emissions`, `water`) → it folds to the glyph.

## Use in web / code
```html
<link rel="stylesheet" href="TrinityBrandIcons.css">
<i class="brand-ready-mix-truck"></i>
<i class="brand-water"></i>
```

## The 16 icons
`batching` · `cement` · `co2-carbon-emissions` · `commercial-building` · `concrete-pour` · `data` · `fuel` · `money-bag` · `raw-material` · `ready-mix-truck` · `security` · `sustainability` · `temperature` · `transit` · `trust` · `water`

## Notes / choices made (easy to change)
- **Font name:** `TrinityBrandIcons` (sibling to `TrinityIcons`).
- **CSS prefix:** `brand-` (deliberately different from TrinityIcons' `icon-`, so both stylesheets can load together without the base `.icon` rule colliding).
- **`-black` suffix dropped** from every name — it's meaningless for a monochrome font (the glyph takes whatever color you set).
- Illustrator `fill-rule: evenodd` was preserved, so holes/counters (truck wheels, CO₂ text, knockouts) render correctly.
