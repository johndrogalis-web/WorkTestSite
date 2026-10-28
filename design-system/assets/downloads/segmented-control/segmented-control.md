# Segmented control

Two to five views of the same data, switched in place. One segment is always selected; picking another changes how the page shows the data, not what it does.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), SegmentControl 63396:1022, Type=Secondary, on Alternate Button 65181:6374 (hub). Light and dark.

## Learn

### When to use

- Different views of the same data: a list, a map, phases.
- A time window for the same chart: day, week, month.
- A layout switch: list or grid.

### Use something else when

- It does something (save, export, send). → Use a Button
- It is a value in a form. → Use a Radio group
- The views are different objects or pages. → Use Tabs
- There are more than five options. → Use a Select or a Dropdown button

## Understand

### Behaviour (built in)

- **Exactly one selected.** No empty state and no deselect. On load, the first segment unless the URL says otherwise.
- **Switching is instant and keeps everything.** Filters, scroll and selection survive the switch. If switching would lose input, this is the wrong component.
- **The choice is in the URL.** A view can be linked and survives refresh, like Tabs.
- **Segments size to their labels.** They do not stretch to equal widths.
- **Keyboard.** Tab reaches each segment; Enter or Space selects.

### Guidelines (your choices)

- **Neutral and light blue only.** No yellow and no dark blue. Those are call-to-action colours; a segmented control changes the view, it is not an action.
- **Order by how often each view is used.** Most used first, and first is the default.
- **One or two words per segment.** “Fleet map”, not “Show the fleet on a map”.
- **Large in a toolbar, Medium in a card header, Small in a table toolbar.** One size per toolbar.
- **Icons are optional.** Icon-only segments need a name and a tooltip, and only for glyphs people already know (list, grid, map).

### Do not

- Use the Primary, Accent or Ghost types. They stay in Figma but are not for the product.
- Use it for actions.
- Use it as a form input.
- Put more than five segments in.
- Mix sizes in one toolbar.

## Building it

### Anatomy

- **Segments**: Two to five Alternate Buttons (hub), edge to edge with a −1 gap so the 1px borders do not double.
- **Corners**: The ends are pills (radius 100); the inner corners are square ( segment-control/inner-radius 0).
- **Selected segment**: Light-blue fill with a darker border, so it reads without colour alone.
- **Label**: Body/sm Medium 14. Optional 16px icon before and after, 4 apart.

### States

| State | Light | Dark |
|---|---|---|
| Default | #FFFFFF, border #D0CEC8, label #171614 | #2F2D28, border #565147, label #FFFFFF |
| Hover | #DFDEDD, border #D0CEC8, outer #7F796C | #666054, border #F6F4F2, outer #D0CEC8 |
| Selected | #41A8F2 50%, border #7F796C, label #171614 | #C5E4FB, border #666054, label #393632 |
| Focus | #F0EEEA, border #565147, 2px outer #2F2D28 | #393632, border #DFDEDD, 2px outer #9B958A |
| Disabled | #D0CEC8, border #7F796C, label #7F796C | #45413A, border #7F796C, label #7F796C |

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Height | size | 52 / 40 / 32 / 24 | Same |
| Padding | alternate-button padding | 16 sides; 18 / 12 / 8 / 4 top and bottom | Same |
| Radius | pill ends, segment-control/inner-radius | 100, 0 | Same |
| Border | alternate-button/secondary/inner-border-width | 1 | 1 |
| Selected fill | alternate-button/secondary/active | #41A8F2 at 50% | #C5E4FB |
| Selected border | alternate-button/secondary/border-active | #7F796C | #666054 |
| Selected label | alternate-button/secondary/label-active | #171614 | #393632 |
| Label | Body/sm Medium | 14 | 14 |

### Accessibility

- A role="group" with a name; each segment is a <button aria-pressed> . It is a view switch, not a form value, so not a radio group.
- The selected segment has two cues: the light-blue fill and a darker border that passes 3:1 against white.
- Focus is a 2px outer stroke plus the fill change, in both themes.
- Icon-only segments need an accessible name and a tooltip each.

### Known gaps

- None open.
