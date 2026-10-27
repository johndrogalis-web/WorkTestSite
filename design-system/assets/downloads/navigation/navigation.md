# Navigation

The Hub’s side navigation: accordion sections with swappable link groups, as a rail on Large and a drawer behind a top bar below it. A compact button rail is the secondary option.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), page Navigation - Hub (Application) 57722:35285. Light and dark.

## Learn

### When to use

- Accordion rail (the default): any product with areas that hold several pages. Six areas and three utilities, always in the same order.
- Alternate button rail : a product with few areas and shallow content, where most areas are a single page and the few sub-pages fit a small popout menu.

### Use something else when

- Switching views inside one page. → Use Tabs or a Segmented control
- Showing where a page sits in a deep structure. → Use Breadcrumbs in the page header
- Choosing an action. → Use a Dropdown button

## Understand

### Behaviour (built in)

- **Which navigation shows.** Large (≥ 1200): the rail, always visible. Below: the 72px top bar; the same menu opens as a drawer from the toggle. See Page layout .
- **One section open.** Opening a section closes the other. The section holding the active page is open on load.
- **A header with children toggles; one without navigates.** Both keep the chevron so the rail reads as one list. A header with children does not also navigate; its first child is the landing page.
- **Active is the page, not the click.** The header is active when any of its children is the current page; the child link gets aria-current="page" and the bullet.
- **Drawer.** Opens from the left over the page with a scrim; the toggle becomes ×; focus moves in; Escape, × or the scrim closes it and focus returns to the toggle. The page behind is inert . Choosing a link closes it.
- **Search in the top bar.** The search icon opens the 44px field in place of the logo; Escape or clearing closes it. See Search .
- **Utility menu stays at the bottom.** Profile, Settings and Support are pinned; the primary menu scrolls if it must.
- **Alternate rail: a button with sub-pages opens a popout.** A Menu floats 12px to the right of the rail, level with the button. Picking a page closes it and selects the button. Escape or a click outside closes it.
- **Keyboard.** Tab reaches each header, button and visible link. Up and Down move between headers; Enter or Space toggles or opens; Escape collapses; Home and End jump to the ends.
- **Motion.** Sections expand over 300ms ease-out; colour changes take 150ms. With reduced motion, nothing slides.

### Guidelines (your choices)

- **Pick one rail per product.** Never both in one app. The accordion rail is the default.
- **Keep the primary menu to the product areas.** Add a child, not a section. With the button rail, keep it to areas that fit without scrolling.
- **Give every section an icon from the same set.** 20px in the accordion rail, 24px in the button rail.
- **Keep labels short.** Two words where you can. The accordion fits one line at 14px; the button rail allows two lines at 10px.
- **Swap, do not detach.** Use the Nav Link Group swap in Figma for children.

### Do not

- Nest a third level. Children are links, not sections.
- Put badges or counts in the rail; that is what the notifications bell is for.
- Make a header navigate and toggle.
- Change the rail width per page.
- Collapse the accordion rail to icons; use the button rail instead.

## Building it

### Anatomy

- **Side Navigation**: 244 wide, 8 padding, primary and utility menus, 16 between sections, 10 between items. Desktop (rail) or Mobile (drawer, 383, adds the Account block).
- **NavAccordionHeader**: 240 x 40, padding 12, gap 10, 20px icon, 14 / 18 label, 20px chevron. Default, Hover, Focus, Disabled, each with Active (6px left indicator).
- **Nav Link Group and Nav Link Item**: The children: a local component you swap per product. Items are 244 x 34, padding 12 / 12 / 12 / 44; Active adds a bullet.
- **Top Navigation (Mobile)**: 72px bar below Large: toggle, logo, search and notifications. Default, Search and Nav open.
- **Alternate button rail**: 112 wide, 8 padding. NavButtonOption: 24px icon over a 10px Caption label, min 40 high, padding 4 / 8 / 4 / 4, 4px left indicator when Selected. Sub-pages open in a Menu popout.

### States

- **Default** (At rest): background-default, label-default
- **Hover** (Pointer over it): Light #EEF9FF fill; dark yellow fill with a dark label
- **Focus** (Keyboard focus): Focus fill and border plus a ring (light #0C79A8, dark #9B958A)
- **Active / Selected** (You are on this page): Blue label and indicator (dark yellow); survives hover and focus
- **Disabled** (Not available): neutral/400 label and icon in light, #7F796C in dark

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Rail | nav/sidebar/width, padding; layout/base | 244, 8, #F0EEEA | 244, 8, #000000 |
| Header | nav-accordion-header/height, padding, gap, icon | 40, 12, 10, 20 | 40, 12, 10, 20 |
| Header label | label-default | #171614 | #FFFFFF |
| Header hover | background-hover, border-hover, label-hover | #EEF9FF, #EEF9FF, #171614 | #FEFFD6 at 70%, #E3F200 at 80%, #171614 |
| Header focus | background-focus, border-focus, focus-ring | #EEF9FF, #EEF9FF, #0C79A8 | #FEFFD6 at 70%, #E3F200, #9B958A |
| Header active | label-active, indicator-active (6px) | #0D598F, #0B7ACA | #FEFFD6, #E3F200 |
| Disabled | label-disabled, icon-disabled, chevron-disabled | #7F796C | #7F796C |
| Link item | nav/link/height, padding-left; bullet 6px | 34, 44 | 34, 44 |
| Top bar | nav/topbar/height, bg, icon-default | 72, #F0EEEA, #171614 | 72, #1C1B18, #FFFFFF |
| Button rail | width, padding; NavButtonOption min-height, padding, gap, icon | 112, 8; 40, 4 / 8 / 4 / 4, 4, 24 | Same |
| Button label | nav-button-option/label-default, Caption 10 | #171614 | #FFFFFF |
| Button hover | background-hover, label-hover | #EEF9FF, #171614 | #E3F200 at 80%, #171614 |
| Button focus | background-focus, focus-ring | #EEF9FF, #0C79A8 | #E3F200, #9B958A |
| Button selected | label/icon/indicator-selected (4px) | #0D598F | #E3F200; #171614 on focus |
| Motion | nav/section/expand; nav-accordion-header/duration | 300ms ease-out; 150ms ease-out | Same |

### Accessibility

- One <nav aria-label="Main"> whether rail, drawer or button rail. The utility menu is inside it.
- Headers are <button aria-expanded aria-controls> ; groups are plain lists of links. No tree or menu roles in the accordion rail.
- aria-current="page" on the active link, header or button. Colour and the indicator are the visual half.
- The top-bar toggle is named (“Open menu” / “Close menu”) with aria-expanded . The drawer traps focus and the page behind is inert .
- Button rail: a button with a popout has aria-haspopup and aria-expanded ; focus moves into the popout and returns to the button on close. Labels stay visible, so no button relies on its icon alone.

Note — Expanded class: Between 840 and 1199 the navigation is product-defined in the Page layout spec. This page treats it as the drawer.
Note — Top bar on Large: The top bar is drawn only as the mobile bar. On Large, search and notifications live in the page header; that is a house rule.

### Known gaps

- None open.
