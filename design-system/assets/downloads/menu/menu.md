# Menu

The floating list behind Select, Dropdown button, Search suggestions and Date picker. Menu Item is one row; Menu Container holds them.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Menu Item 64751:66615 (16 variants) and Menu Container 64751:66928 (4 variants). Light and dark.

## Learn

### When to use

- Building a Select, Multi-select, Dropdown button or Search suggestions. They already include it.
- A list of options that floats over the page and closes when done.

### Use something else when

- People choose a value in a form. → Use Select , which adds the field
- People pick an action. → Use Dropdown button
- Two to five options fit on screen. → Use Radio group or Segmented control
- It is navigation. → Use the Navigation rail or Tabs

## Understand

### Behaviour (built in)

- **It floats 4px under its trigger.** Positioned absolutely at trigger bottom + 4, so it never pushes the page down. It may cover the field’s helper text; that is intended.
- **Opening moves focus in.** To the selected row, or the first row if nothing is selected.
- **Arrow keys move, Enter picks.** Up and Down move by row, Home and End jump, Enter or Space selects. Disabled rows are skipped.
- **Selected is its own axis.** A row can be selected and hovered at once: the check stays and the background lifts.
- **Single-select closes; multi-select stays open.** Picking in a single menu clears the old choice and closes. In MultiSelect each row toggles and Select all sets every row; Escape or a click outside closes.
- **Rows never change height.** 30 in every state, 36 with a checkbox. The focus ring sits inside the row.
- **It scrolls past 600.** menu-container/max-height. Turn on Has Search past about ten options.
- **Motion is short.** The menu fades and slides in over 200ms ease-out and out with ease-in; rows change over 150ms. With reduced motion, no movement.

### Guidelines (your choices)

- **Write rows as the thing, not an instruction.** “Phoenix Central”, not “Choose Phoenix Central”. Sentence case.
- **Use extras only when they help choose.** A count or a description earns its place when two rows would otherwise look alike.
- **Keep icons meaningful.** A leading icon says what kind of thing the row is. Do not decorate every row.
- **Order the list on purpose.** Most used first, or alphabetical. Say which in the trigger’s helper text if it matters.
- **Use the slot.** Drop Menu Item instances into Items. Never detach the container.

### Do not

- Use Selected to show hover.
- Signal selection with colour alone. The check is the signal.
- Draw your own tick in a multi-select. Use the real Checkbox content.
- Put more than one line of text in the label. Use Description.
- Let the menu push the layout down.

## Building it

### Anatomy

- **Container**: menu-container/*: 1px border, radius 16, padding 6, 2px between rows, 5% shadow. Optional search header, optional Select all and divider, then the Items slot.
- **Check**: 16px, space reserved on every row so text lines up. Shown only when Selected.
- **Leading icon**: Optional, 16px. Takes the row’s text colour in Hover and Selected.
- **Text**: Body/sm 14. Optional Description under it in Body/xs.
- **Count, trailing icon, caret**: Optional. The count is a small pill; the caret means the row opens a sub-menu.

### States

- **Default** (At rest): menu-item/background, text
- **Hover** (Pointer over the row): background-hover, text-hover; icons follow the text
- **Focus** (Arrow keys reach the row): 2px border-focus inside the row plus shadow-focus; height unchanged
- **Disabled** (Not available): text-disabled, icon-disabled; skipped by keys
- **Selected** (The current choice, with any state above): background-selected, text-selected, check shown; selected + hover uses background-selected-hover

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Container fill | menu-container/background | #FFFFFF | #171614 |
| Container border | menu-container/border | #7F796C | #9B958A |
| Container | radius, padding, items-gap | 16, 6, 2 | 16, 6, 2 |
| Shadow | menu-container/shadow-color, 0 5 4 | #4A4F55 at 5% | #000000 at 40% |
| Divider | menu-container/divider | #B6B1A5 | #45413A |
| Row | menu-item/padding, radius, text-gap | 6, 4, 8 | 6, 4, 8 |
| Row text | menu-item/text | #171614 | #FFFFFF |
| Hover | background-hover, text-hover | #DFDEDD, #171614 | #FEFFD6, #171614 |
| Selected | background-selected, text-selected | #EEF9FF, #0D598F | #E3F200, #171614 |
| Selected + hover | background-selected-hover | #C5E4FB | #FEFFD6 |
| Focus | border-focus 2px, shadow-focus | #7F796C, #171614 at 25% | #9B958A, #FFFFFF at 35% |
| Disabled | text-disabled, icon-disabled | #7F796C | #B6B1A5 |
| Icons | icon-default; text-hover in Hover; text-selected in Selected | #171614 | #FFFFFF; #171614 on yellow |
| Description | description-text (hover, selected) | #666054 | #9B958A (#45413A) |
| Count pill | count-background, hover, selected | #DFDEDD, #D0CEC8, #C5E4FB | #393632, #505527, #505527 |
| Max height | menu-container/max-height | 600 | 600 |
| Motion | container 200ms in ease-out, out ease-in; item 150ms ease-out |  |  |

### Accessibility

- The container is a listbox (or a menu for actions). Rows are option s with aria-selected ; MultiSelect adds aria-multiselectable .
- Focus moves into the menu on open and back to the trigger on close. Escape closes without changing anything.
- Selection is shown by a check or a checked box, never by colour alone.
- Disabled rows carry aria-disabled and are skipped by the arrow keys.
- Checkbox rows keep their 24 x 24 target.

### Known gaps

- None open.
