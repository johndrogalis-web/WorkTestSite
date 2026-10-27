# Dropdown button

A Button that opens a short menu of actions. Pick one and it runs; the label never changes to show what you picked.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Dropdown Button 64751:68409, spec 64764:71139. Light and dark.

Actions, never values: A Dropdown Button does not show a selected item. Picking an option runs an action (share, move, archive) and the label stays the same. If the label should show what was chosen, use a Select .

## Learn

### When to use

- A handful of actions on one thing: Actions on a ticket, Create on a list, More at the end of a toolbar.
- When the actions would crowd the screen as separate buttons.

### Use something else when

- People choose a value that stays shown. → Use a Select
- There are only one or two actions. → Use Buttons side by side
- The menu is navigation. → Use Tabs or links
- There is one main action plus extras. → Use a Button plus a Link-type Dropdown Button for the extras

## Understand

### Behaviour (built in)

- **Click opens; the caret flips.** The menu appears at button bottom + 4 and the caret points up. The button takes its pressed (active) look while the menu is open.
- **Picking an item runs it and closes the menu.** The label does not change.
- **Escape or a click outside closes.** Nothing runs. Focus returns to the button after Escape.
- **Disabled cannot open.** The button takes Button’s disabled tokens.
- **Destructive actions confirm.** Delete and similar items look like the others, sit last after a divider, and open a confirm Modal before they run.
- **The menu flips above when there is no room below (house rule).** Same rule as Select.

### Guidelines (your choices)

- **Name the button for the group.** “Actions”, “Create”, “More”. Never the last action taken.
- **Start each item with a verb.** “Move to plant”, not “Plant”.
- **Keep it short.** Up to about seven items. Group with a divider; put destructive actions last.
- **Use icons for all items or none.** A leading Feather icon helps scanning in longer menus.
- **Pick the type by weight.** Primary for the main thing on the page, Secondary for most, Link for quiet extras.

### Do not

- Use it to choose a value.
- Change the label to the last action.
- Colour a destructive item red; confirm it instead.
- Put a second menu inside an item.
- Hide the caret.

## Building it

### Anatomy

- **Button**: A real Button instance, Medium (32), with the caret in its trailing icon slot. All colours come from Button.
- **Caret**: Icon Small 16 in the label colour. Down when closed, up when open.
- **Menu**: The shared Menu Container, 240 wide, at button bottom + 4, with Menu Items in its slot. Same container as Select.
- **Items**: Menu Items: an optional leading icon and a verb. A divider before destructive actions.

### Types

- **Secondary**: Most actions (Button secondary)
- **Primary**: The main action on the page (Button primary)
- **Link**: Quiet extras, end of a toolbar (Button link)

### States

- **Default** (At rest): Button default
- **Hover** (Pointer over it): Button hover
- **Focus** (Keyboard focus): Button focus ring
- **Open** (Menu showing): Button active (pressed) look, caret up, menu at bottom + 4
- **Disabled** (Not available): Button disabled; cannot open

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Button | Button, size medium (32), suffix icon | As Button | As Button |
| Caret | Icon Small 16, label colour | — | — |
| Menu | Menu Container, Has Search off; width 240; at bottom + 4 | As Select menu | As Select menu |
| Item | Menu Item, 30 tall, radius 4; text menu-item/text | #171614 | #FFFFFF |
| Item hover | menu-item/background-hover, text-hover | #DFDEDD, #171614 | #FEFFD6, #171614 |
| Divider | menu-container divider | #B6B1A5 | #45413A |

### Accessibility

- The button has aria-haspopup="menu" and aria-expanded ; the menu is role="menu" with menuitem s.
- Down arrow or click opens and focuses the first item. Up and down move, Home and End jump, Enter or Space runs, Escape closes and returns focus, Tab closes.
- The caret direction is a second signal for the open state, alongside the menu itself.
- Colour and contrast come from Button and Menu Item in all three types and both themes.

### Known gaps

- None open.
