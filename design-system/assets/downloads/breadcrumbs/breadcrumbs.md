# Breadcrumbs

Shows where a page sits in a hierarchy, and lets people climb back up it.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), items 63776:44531, group 63776:44573, spec 63904:41676. Light and dark.

## Learn

### When to use

- A page three or more levels deep, such as one truck inside a plant.
- Pages people reach from search or a link, who need to see where they landed.

### Use something else when

- The levels are filters or saved views. → Use Chips
- People move between peer pages. → Use Tabs
- The page is one level deep. → Show the page title only
- It would replace the page title. → Keep the title; the trail sits above it

## Understand

### Behaviour (built in)

- **Links navigate. The current page is plain text.** It carries aria-current="page" and has no states.
- **Hover darkens the text and adds a fill in 150ms, easing out.** Focus snaps on with a 2px ring. It never animates.
- **It never wraps to a second line.** If it does not fit, it truncates or collapses.
- **As space runs out, it sheds in a fixed order.** Labels over 30 characters truncate first, with a tooltip of up to 80. Then the current page drops. Then middle items collapse into the overflow menu. The first item always stays.
- **At six or more levels the overflow fires at any width.** The first two items, the overflow, the item before the current page, and the current page stay visible.
- **The overflow opens its menu on hover, focus or click.** It lists the hidden items in order (WCAG 1.4.13).
- **The container keeps its 16px height when no trail renders.** So the page below never jumps.

### Guidelines (your choices)

- **Use it only for a real hierarchy.** The same page reached two ways shows the same trail.
- **Keep trails to three to five levels.** Four is the recommended maximum and six the absolute one. Past that, flatten the structure.
- **Place it in the content area, above the page header.** Not inside the header itself.
- **Write labels under 30 characters.** Longer ones truncate and need the tooltip to be read.
- **Pick the Breakpoint that matches the viewport.** Default, Tablet or Mobile in the Breadcrumb Group.

### Do not

- Use breadcrumbs as filters.
- Use them to move between peers.
- Indent items inside the overflow menu.
- Show the current page as both a crumb and the title on mobile.
- Let the trail wrap.

## Building it

### Anatomy

- **Trail**: A navigation landmark named “Breadcrumbs” around an ordered list.
- **Link item**: A crumb that navigates, with hover, active and focus states.
- **Current page**: The last item. Plain text, not focusable.
- **Overflow trigger**: “. . .” with a caret. Opens the overflow menu.
- **Separator**: An angle-right after each item but the last. Decorative and hidden from screen readers.
- **Overflow menu**: A Menu Container listing the collapsed items.

### Options

| Component | Property | Values |
|---|---|---|
| Hub BreadcrumbItem | Type | BreadcrumbItem, CurrentPage, Overflow |
| Hub BreadcrumbItem | State | Default, Hover, Active, Focus (not CurrentPage) |
| Hub BreadcrumbItem | show separator | On; off for the last item |
| Hub Breadcrumb Group | Breakpoint | Default, Tablet, Mobile |
| Hub Breadcrumb Group | Levels | 3, 4, 5 |

### States

- **Default**: Link colour.
- **Hover**: Darker text on a fill, 150ms.
- **Active**: The link-active colour while pressed.
- **Focus**: The link-focus colour plus a 2px ring inside the item. No transition.
- **Current page**: None. It is not interactive.

### Specs

Measured on Page Content (elevation/layer-1): #FFFFFF light, #171614 dark.

| Part | Property | Token | Light | Dark |
|---|---|---|---|---|
| Item | Padding, radius, gap | breadcrumb-item/padding, radius, gap | 6, 4, 8 | same |
| Item | Type | breadcrumb-item/font-family, font-size, line-height, font-weight | ABC Repro 14 / 18, 400 | same |
| Link | Default | breadcrumb-item/text-default (link/link) | #0975C3 | #41A8F2 |
| Link | Hover text, fill | breadcrumb-item/text-hover, fill-hover | #0D598F on #DFDEDD | #1594EF on #000000 |
| Link | Active, focus text | breadcrumb-item/text-active, text-focus | #0B7ACA | #41A8F2 |
| Link | Focus ring, 2px inside | breadcrumb-item/focus-outer-stroke, border/focus | #171614 | #D0CEC8 |
| Current page | Text | breadcrumb-item/text-current-page (text/hint) | #666054 | #9B958A |
| Separator | Icon, colour | u-angle-right-b 12px, breadcrumb-item/icon-default | #666054 | #7F796C |
| Overflow | Caret, menu | fi-chevron-down / -up 12px; Menu Container | see Menu | see Menu |
| Trail | Height, gap | layout size/2, gap/2 | 16 reserved, 8 | same |
| Motion | Colour change | breadcrumb-item/duration, easing | 150ms, ease-out | same |

### Accessibility

- Wrap the trail in <nav aria-label="Breadcrumbs"> around an <ol>. The order is the meaning.
- Put aria-current="page" on the last item, which is not a link and not focusable.
- Separators carry aria-hidden="true" and are never focusable or announced.
- The overflow trigger is a <button aria-haspopup="menu">. Escape closes its menu and returns focus to it.
- Tab moves between links and the overflow. Enter follows a link or opens the menu.
- Touch targets are at least 24 × 24 (WCAG 2.5.8).

### Code

Template and styles: breadcrumbs.html and breadcrumbs.css in the same folder. Angular API: not yet written; to be agreed with the development team.

### Known gaps

- None open.
