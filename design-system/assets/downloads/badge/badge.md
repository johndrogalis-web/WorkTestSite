# Badge

A small label that shows a status or a count. It never responds to a click.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), 7477:297479 (info 60895:44879). Light and dark.

## Learn

### When to use

- A count on an icon or a tab, such as unread alerts.
- The state of a unit, an update or a job, in a table or after a title.
- A short flag on a row, such as Ignition on.

### Use something else when

- It filters, opens, selects or dismisses when clicked. → Use a Chip
- The value is one of the nine truck phases. → Use a Truck phase tag
- The message needs a sentence. → Use a Notification
- It is not a status or a count. → Use plain text

## Understand

### Behaviour (built in)

- **It does not respond to hover, focus or press.** A badge that responds is a chip.
- **A number caps at 40px wide.** Anything above 99 shows as 99+.
- **A word grows to fit.** There is no width cap on text.
- **Default keeps the brand yellow in both themes.** Alternate, Outline and Error switch to their dark values, so every pair still passes on a dark page.
- **Only the light Default dot has a ring.** The brand yellow reads 1.07:1 on a light page, so a 1px ring inside the edge gives it one. Every other dot passes on its fill.
- **Data is the same badge with 2px corners. Icon holds one 12px icon and no label.** Both share the four styles.

### Guidelines (your choices)

- **Pick the style by emphasis. The word carries the meaning.** See the table below. Styles are levels of emphasis, not meanings.
- **Write the number when you have one.** A dot says something happened. A number says how much.
- **Use the Data type in tables and KPI rows.** A column of pills reads as a row of buttons.
- **Place it by what it belongs to.** Icon, line of text, table cell or tab. See the table below.
- **Let the label or column header name the status.** Then the badge only has to say the value.
- **Keep one badge per object.** Two badges on one row is a layout problem, not a status.
- **Need a colour the four styles do not have? Change only the fill, text and border.** Check AA in both themes, then propose it to the library as a named style.

#### Which style

| The status is | Use | For example |
|---|---|---|
| Neutral, inactive or switched off | Outline | Unlinked unit |
| Informational, or something in motion | Alternate | In progress, Maintenance mode |
| Brand emphasis, or a count | Default | 12, New, Active unit |
| Needs action now | Error | Failed, Overdue |

#### Where it goes

| Belongs to | Where | Rule |
|---|---|---|
| An icon | Top-right corner, overlapping the icon | Number or dot only. The icon’s click area does not grow. |
| A line of text | After the text, on the same line | 8px gap, centred on the text. |
| A table cell | Left-aligned, in its own column | The header names the status. No plain text in the same column. |
| A tab | After the tab label | Dot for “changed”, number for “this many”. No Error in a tab. |

### Do not

- Make a badge clickable, hoverable or dismissible.
- Use Error for numbers that are only high.
- Rely on the dot’s colour alone to say which state it is.
- Put a word on an icon. Use a number or a dot.
- Use a colour that has not been checked in both themes.

## Building it

### Anatomy

- **Container**: A pill, or 2px corners in the Data type.
- **Content**: A number, a word, a dot or one icon.
- **Border**: Outline style only.
- **Ring**: Light Default dot only. A thin edge inside the dot.

### Options

- Content: number, text, dot, icon.
- Style: Default, Alternate, Outline, Error.
- Type: Default (pill), Data (2px corners), Icon (28 × 20, icon only).

### States

- None. A badge does not respond to hover, focus or press.

### Specs

| Part | Property | Token | Light | Dark |
|---|---|---|---|---|
| Container | Height | — | 20 | 20 |
| Container | Padding | badge/display/default/left-right-padding, top-bottom-padding | 8 / 4 | 8 / 4 |
| Container | Radius, Default | badge/display/default/radius | 16 | 16 |
| Container | Radius, Data | badge/display/data/radius | 2 | 2 |
| Number | Max width | — | 40 | 40 |
| Icon type | Size, icon | — | 28 × 20, 12px icon | same |
| Text | Type | Body/xs Medium | ABC Repro Medium 12, line 1 | same |
| Default | Fill, text | badge/display/brand/background, text | #E3F200, #171614 | #E3F200, #171614 |
| Alternate | Fill, text | badge/display/alternate/background, text | #C5E4FB, #171614 | #0D598F, #FFFFFF |
| Outline | Fill, text | badge/display/outline/background, text | #FFFFFF, #171614 | #171614, #FFFFFF |
| Outline | Border, 1px inside | badge/display/outline/border | #41A8F2 | #41A8F2 |
| Error | Fill, text | badge/display/error/background, text | #B00100, #FFFFFF | #EFADAC, #171614 |
| Dot | Size | badge/dot/width, height | 8 × 8 | 8 × 8 |
| Dot | Fill: Default, Alternate, Error | badge/dot/fill/default, alternate, error | #E3F200, #0975C3, #B00100 | #E3F200, #41A8F2, #EFADAC |
| Dot | Ring, 1px inside, Default only | badge/dot/stroke | #171614 | none (transparent) |

### Accessibility

- A badge that changes on its own needs aria-live="polite" on its container.
- A dot needs role="img" and a label, such as “Unread”.
- Put the count in the accessible name: “Notifications, 12 unread”, not “12”.
- Never let colour alone separate Error from Default. The word or number has to do it.
- The dot is the information, so its edge needs 3:1 (WCAG 1.4.11). Where the fill falls short, the ring provides it.
- Every text pair passes AA. Lowest text pair: 7.37:1.

### Code

Template and styles: badge.html and badge.css in the same folder. Angular API: not yet written; to be agreed with the development team.

### Known gaps

- None open.

Note. Recommended: a darker Outline border: #41A8F2 reads 2.24:1 on the page. primary/600 (#0975C3) would read 4.17:1. Not a failure: the word identifies the badge, so WCAG 1.4.11 does not require the edge.
