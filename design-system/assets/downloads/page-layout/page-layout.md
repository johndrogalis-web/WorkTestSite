# Page layout

Four responsive classes, three breakpoints, one fluid grid that lives inside Main Content. The frame every Hub page is laid out in.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), spec 65601:82539, Page Layout Breakpoints 64897:58621, Page Grid 65588:2545. Light and dark.

## Learn

### When to use

- Every Hub page: the shell (header, navigation, main content) and the Page Grid inside it.
- Deciding how many columns a widget spans at each size.
- Testing a page: Compact at 320, Large at 1440 and 1920.

### Use something else when

- Laying out the inside of one widget. → Use its own container-responsive layout; see Dashboard and widgets
- Spacing inside a card. → That belongs to Card
- Designing the navigation itself. → See Navigation

### Classes

| Class | Width | Breakpoint | Figma frame | Columns | Navigation |
|---|---|---|---|---|---|
| Compact | 320–599 | Base | 360 | 4 | Drawer |
| Medium | 600–839 | 600 | 768 | 8 | Drawer |
| Expanded | 840–1199 | 840 | 1024 | 12 | Drawer |
| Large | 1200+ | 1200 | 1440 | 12 | Persistent rail |

## Understand

### Behaviour (built in)

- **Breakpoints are the only switches.** 600, 840 and 1200. The Figma frame widths (360, 768, 1024, 1440) are examples inside each range, not breakpoints.
- **Navigation.** Compact, Medium and Expanded: hidden, opened as a drawer from the toggle in the 72px top bar. Large: the persistent rail.
- **The grid belongs to Main Content.** Main-content width = application width minus the rail. The grid never runs under the navigation.
- **Columns are fluid.** Column width = (content width − 32 − (n − 1) × 12) / n. Compact at 360: 73px per column.
- **Widgets change span per class.** A chart that is 8 of 8 on Medium may be 6 of 12 on Large. Widget configuration owns the allowed spans, not the Card.
- **Widget insides respond to their own width.** Container queries, not viewport queries.
- **At 320 nothing is lost.** No page-level sideways scroll; widgets go full width; secondary controls may move to an overflow menu; a wide table may scroll inside its own box.
- **No maximum width.** Main Content stays fluid at any width. 1920 is the wide-screen check.

### Guidelines (your choices)

- **Treat breakpoints as rules and Figma widths as examples.** Never write media queries at 360, 768, 1024 or 1440.
- **Test the edges.** Compact at 320; Large at 1440 and 1920.
- **Pad once.** 16px Main Content inset with grid padding 0, or the reverse. Not both.
- **Let spans change.** Pick each widget’s span per class.
- **Keep layout spacing apart from component spacing.** 16 / 12 / 12 is dashboard density; cards keep their own padding.

### Do not

- Add a breakpoint for a named device.
- Run the grid under the navigation rail.
- Give the Card component widget minimum widths.
- Double the inset (16 padding plus a 16 grid margin).
- Cap the content width without a decision.

## Building it

### Anatomy

- **Application viewport**: The browser window. Minimum supported width 320.
- **Top bar**: Below Large: 72px with the navigation toggle, logo, search and notifications. See Navigation .
- **Navigation**: Large: the 244px rail, 8px from the window edge. Below: a drawer from the toggle.
- **Main content**: What is left, on nav/page-layout/content-bg with a 1px content border, 8px from the shell edge.
- **Page header and controls**: Title, filters and actions above the grid, full width of Main Content.
- **Page Grid**: 4 / 8 / 12 fluid columns, 16 padding, 12 column and row gaps. Widgets span tracks.

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Thresholds | Medium / Expanded / Large | 600 / 840 / 1200 | Same |
| Figma frames | Compact / Medium / Expanded / Large | 360 / 768 / 1024 / 1440 | Same |
| Validation | Compact minimum, Large wide | 320, 1920 | Same |
| Columns | Page Grid Layout | 4 / 8 / 12 / 12 | Same |
| Grid spacing | dashboard-grid/padding, column-gap, row-gap | 16, 12, 12 | 16, 12, 12 |
| Shell | nav/page-layout/bg, outer-padding, outer-gap | #F0EEEA, 8, 8 | #000000, 8, 8 |
| Rail | nav/sidebar/width, padding | 244, 8 | 244, 8 |
| Main content | nav/page-layout/content-bg, content-border | #F6F4F2, #DFDEDD | #2F2D28, #45413A |
| Title | nav/page-layout/title-text | #171614 | #FFFFFF |
| Top bar | nav/topbar/height, bg | 72, #F0EEEA | 72, #1C1B18 |
| Button-rail shell | rail width | 112 (128 with padding) | Same |

### Accessibility

- Landmarks: one <header> , one <nav aria-label="Main"> , one <main> . The drawer and the rail are the same nav.
- Reflow (1.4.10): no sideways page scroll at 320 CSS px. Wide tables scroll in their own box, noted per page.
- A “Skip to main content” link comes first and shows on focus.
- The classes follow CSS pixels, so 200% zoom on a 1440 window behaves as Medium. That is intended.
- DOM order is header, navigation, main at every class, so reading order never changes.

Note — No maximum content width: Decided for now: Main Content stays fluid at every width. Revisit if wide screens look sparse; 1920 is the check.

### Known gaps

- None open.
