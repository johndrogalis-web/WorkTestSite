# Select

Choose a value from a list, and show the choice. A field with a caret, a menu that floats 4px beneath it, and a multi-select that is the same field with a different menu.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Form Fields v2: Select 64751:67612, Select Field 64751:67912, Multi-Select Field 64760:68616, Menu Container 64751:66928, Menu Item 64751:66615. Light and dark.

## Learn

### When to use

- Choosing one value from a list that is too long for radios: a plant, a status, an owner.
- Choosing several values when the field only needs to show how many.
- Any choice the field should keep showing after it is made.

### Use something else when

- Picking an action, such as share or archive. → Use a Dropdown button
- Two to five options that fit on screen. → Use a Radio group
- Free text with suggestions. → Use Search
- A date. → Use the Date picker

## Understand

### Behaviour

The menu is absolutely positioned, always, at trigger bottom + 4px. An open menu never pushes the form down. The 4px gap is deliberate: flush reads as one object and looks wrong; wider reads as a disconnected panel. Do not change it. The menu overlays the helper text. That is intended. The helper is read before opening, not during. Opening moves focus to the current choice, or to the first row if there is none. Closing returns focus to the trigger. Selected and Hover are independent. A row can be both, and is, every time the person moves the mouse back over their choice. Collapsing the two into one axis is the most common way menu components go wrong. Single-select closes on choice; multi-select stays open. Multi closes on click-outside or Escape, and the field says “3 selected”, never the list, because listing breaks the fixed field height. Select-all is a real checkbox and behaves like one: indeterminate when some are chosen, all on when every row is. Switch Has Search on past about ten options. Under that, a filter field is more friction than scrolling. Flip above when there is no room below. Decide once on open; do not re-flip while open. Keep the 4px gap on the other side. Group with a divider, not a heading, unless the groups genuinely need names. Headings are not options and must not be focusable.

### Guidelines

Do Use Select when the person is choosing a value the field will then display. Use Select Field for the open composite in layouts; use Select on its own only when the menu is drawn elsewhere. Use Multi-Select Field for many; summarise the count in the field. Enable Has Search past ten options. Keep the 4px gap and the absolute position. Do not Do not use Select to trigger an action — that is Dropdown Button . Do not create select-specific colour tokens. Inheritance is the point. Do not create a separate multi-select trigger. Use Select and swap the menu variant. Do not place the menu inline in the layout flow. Do not use Selected to mean hover. They are different things and people see both at once. Do not detach Menu Container to change its options. Use the slot.

## Building it

### Anatomy

Select Molecule. An Input Field instance with a caret in the trailing icon slot. Every border, background and error token is inherited; there are no select-specific colour tokens, and there should never be any Select Field Organism. Select plus a Menu Container placed absolutely at input bottom + 4. Is Open = True shows the menu and flips the caret. 82px tall either way Multi-Select Field Organism. The same Select with the Menu Container in its MultiSelect variant: a select-all row, a divider, then Checkbox-content items. No separate trigger exists on purpose Menu Container Molecule. Optional search header · optional select-all · divider · an Items slot. #FFFFFF on a 1px #7F796C border, 16px radius (the house surface radius, shared with toast and accordion), 6px padding, 2px between items, a 0 5px 4px shadow at 5%. Scrolls past 600px Menu Item Atom. Optional check · leading icon · text or Checkbox · count · trailing icon · caret, with an optional description beneath. 30px tall, 34 when focused. The check space is reserved on every row so text aligns

### Components

Component Level Axes / properties Notes Select Molecule State × 6, inherited Caret down closed, up open; disabled caret takes input/icon-disabled Select Field Organism Is Open False / True Both 82px tall. The open composite to use in layouts Multi-Select Field Organism Is Open False / True Same trigger, MultiSelect menu. Field shows “3 selected”, never the list Menu Container Molecule Property 1 Default / MultiSelect; Has Search Items is a real slot. Shared by Select, Multi-Select, Dropdown Button, Date Picker and Search suggestions Menu Item Atom State Default / Hover / Focus / Disabled × Selected False / True × Content Text / Checkbox 16 variants. Selected is its own axis, so a row can be selected and hovered at once

### States

From Action To What changes Closed Click, Enter, Space, ArrowDown Open Menu appears at bottom + 4; caret flips; focus moves to the selected item, or the first Open Arrow keys Open, focus moves Ring on the focused row, row grows to 34. Disabled rows are skipped Open Enter or click a row Closed, Filled Value written into the field; the previous selection clears (single); focus returns to the trigger Open Escape or click outside Closed No change to the value Open, multi Space on a row Open The checkbox toggles; the menu stays open; the field summary updates Any Validation fails Error Inherited from Input Field: border, label, helper and icon go red together

### Specs

| Part | Note | Light | Dark |
|---|---|---|---|
| Trigger | Input Field: 44px, padding 12 / 16, radius 8. Caret input/icon-default, 16px |  |  |
| Menu offset | Input bottom + 4px; Select Field stays 82px open or closed |  |  |
| menu-container/background |  | #FFFFFF | #171614 |
| menu-container/border, 1px |  | #7F796C | #9B958A |
| menu-container/radius · padding · items-gap |  | 16 · 6 · 2 | same |
| menu-container/shadow | 0 5px 4px | #4A4F55 at 5% | #000000 at 40% |
| menu-container/divider, 1px |  | #B6B1A5 | #45413A |
| menu-container/max-height |  | 600 | 600 |
| menu-item/text |  | #171614 | #FFFFFF |
| menu-item/background-hover · text-hover |  | #DFDEDD · #171614 | #FEFFD6 · #171614 |
| menu-item/background-selected · text-selected |  | #EEF9FF · #0D598F | #E3F200 · #171614 |
| menu-item/background-selected-hover |  | #C5E4FB | #FEFFD6 |
| menu-item/border-focus, 2px + shadow-focus | blur 4, spread 2 | #7F796C, #171614 25% | #9B958A, #FFFFFF 35% |
| menu-item/text-disabled |  | #7F796C | #B6B1A5 |
| menu-item/description-text (hover, selected) |  | #666054 | #9B958A (#45413A) |
| menu-item/count-background (hover, selected) · count-text |  | #DFDEDD (#D0CEC8, #C5E4FB) · #171614 | #393632 (#505527, #505527) · #FFFFFF |
| menu-item padding · radius · gaps |  | 6 · 4 · text 8, icon 8, content 6 | same |
| Row height |  | 30, 34 focused | same |
| Motion | menu-container/duration, enter / exit easing; menu-item/duration | 200ms ease-out in, ease-in out; rows 150ms ease-out | same |

Note. Dark selected is yellow, on purpose: In dark mode a selected row is #E3F200 with #171614 text (14.61:1), and hover is #FEFFD6. It follows the dark yellow used elsewhere for emphasis.
Note. Ticked checkbox on a yellow row: In dark mode a ticked checkbox is white, so on a yellow selected row its box blends in (1.24:1). The tick stays clear (14:1) and carries the state; this is accepted as drawn.
Note. House rules beyond the drawing: Figma always opens the menu below and does not draw type-ahead or Home / End. This page adds them: flip above when there is no room, decide once on open, keep the 4px gap; type to jump; Home and End jump to the ends.
Note. Select all, partly selected: The select-all row uses the real Checkbox. When some rows are chosen, set its nested Checkbox to indeterminate.

### Accessibility

- Trigger: a <button role="combobox"> with aria-haspopup="listbox" , aria-expanded , aria-controls and aria-labelledby pointing at the Label.
- Menu: role="listbox" ; rows role="option" with aria-selected ; multi adds aria-multiselectable="true" .
- Keyboard: ArrowDown and ArrowUp move, Home and End jump, typing jumps to a match, Enter selects, Space toggles in multi, Escape closes. Disabled rows are skipped.
- Selection shows as the check or the ticked checkbox, not by colour alone.
- On close, focus returns to the trigger and the new value is announced.

### Code

Menu styles: select.css and a sample menu in select.html. The trigger is the Input Field. Angular API: not yet written; to be agreed with the development team.

### Known gaps

- None open.
