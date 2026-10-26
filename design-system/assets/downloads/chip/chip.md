# Chip

A pressable pill that filters, selects or jumps, and shows whether the thing it names is alive: Information, Offline, Live or Maintenance.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Chip 62644:15248. Light and dark.

## Learn

### When to use

- Filtering a list or a map by plant, truck or status, one press at a time.
- A removable filter the user has already applied.
- A short link to an entity that also shows its status.

### Use something else when

- It is a count or a status word on something else. → Use a Badge
- It is a static label that does nothing on click. → Use a Tag
- It changes a setting saved with a form. → Use a Checkbox
- It runs an action. → Use a Button
- The label needs more than two words. → Use a list row

## Understand

### Behaviour (built in)

- **A chip is a button.** Press selects it (Active), press again clears. In a single-select set, selecting one clears the others; in a multi-select set they add up.
- **Or a chip is a link.** With a trailing arrow and an href , pressing navigates and there is no Active state. Never both.
- **Dismiss removes, it does not deselect.** The × takes the chip out of the set. Focus moves to the next chip, or the previous one if it was last.
- **Mode is status, not decoration.** Live means a heartbeat in the last interval, Offline means none, Maintenance means someone set it. Information is everything else. The mode changes when the data does, never on click.
- **Sets wrap.** A row of chips wraps to the next line; it never scrolls sideways.
- **Motion is short.** Fill and stroke change over 150ms ease-out (chip/duration, chip/easing). Focus snaps. With reduced motion, nothing animates.

### Guidelines (your choices)

- **Use the mode the data has.** Live, Offline and Maintenance only when they are true.
- **Use Small inside tables and card headers.** Large everywhere else.
- **Show the × only when the person may remove the chip.** 
- **Keep one size and one kind of set together.** Do not mix a status set with a filter set.
- **Name the set.** “Filters”, “Plants”. It becomes the group’s accessible name.

### Do not

- Use Live or Maintenance as a colour choice.
- Put a chip where a Badge belongs, such as a count on a tab.
- Make the dot the only difference between two chips with the same label.
- Use a chip for a destructive action.
- Disable a chip. Remove it instead.

## Building it

### Anatomy

- **Container**: Pill, radius 100. A 1px container padding carries the outer stroke, then a 1px inner stroke, 2px on hover, focus and active.
- **Indicator dot**: 8px, the mode colour, with a white 0.5px ring. The dot is the mode; keep it whenever the chip carries status.
- **Label**: Body/sm 14, −2% tracking, mode colour. One or two words.
- **Trailing icon (optional)**: 12px, in an Icon Only Button. An arrow when the chip navigates.
- **Dismiss (optional)**: Icon Only Button, small: 24px element, 18px background, 12px ×.

### Modes

Mode Dot Means Use it for Information #0D598F Neutral, selectable Filters, categories, a linked entity. The default when nothing is wrong or alive. Offline #666054 Not connected, not reporting A truck, plant or sensor with no heartbeat. Live #2ECF1D Connected and reporting now Streams, live telemetry, an active pour. Maintenance #D85A00 Deliberately out of service Scheduled downtime, calibration, a held unit.

### States

- **Default** (At rest): Mode fill, 1px border
- **Hover** (Pointer over it): Fill to full strength, outer stroke darkens, 2px #F6F4F2 inner stroke
- **Focus** (Keyboard focus): Solid focus fill with a white label, outer and 2px inner stroke. Information: primary/600 #0975C3
- **Active (selected)** (After a press; it stays until pressed again): The mode’s dark selected fill, white label. Every mode uses chip/<mode>/fill-selected-default

### Specs

| Part | Token | Value |
|---|---|---|
| Radius | chip/radius | 100 |
| Container padding | chip/container-padding | 1 |
| Large height, padding, gap | chip/large/max-height, padding, gap | 32, 6, 5 |
| Small height, padding, gap | chip/small/max-height, padding, padding-left-right, gap | 24, 3, 8, 6 |
| Inner stroke | chip/large/* and chip/small/* inner-stroke, inner-stroke-focus | 1, 2 on hover, focus, active |
| Dot | chip/indicator-size | 8 |
| Motion | chip/duration, chip/easing | 150ms ease-out |

| Mode | Dot | Default | Border | Hover | Focus | Selected |
|---|---|---|---|---|---|---|
| Information | #0D598F | #0D598F on #C5E4FB 50% (dark 100%) | #41A8F2 | #C5E4FB, border #0975C3 (both themes) | #0975C3, white | #0D598F, white |
| Offline | #666054 | #000000 on #B6B1A5 50% (dark: white label) | #9B958A | #D0CEC8, label #171614 | #B6B1A5, label #171614 | #171614, white |
| Live | #2ECF1D | #15322F on #D5F1D2 | #2ECF1D | #2ECF1D 20% (dark label #D5F1D2) | #15322F 65%, white | #15322F, white |
| Maintenance | #D85A00 | #4F3C08 on #FFEFA9 | #D85A00 | #FFBA0D 20% (dark label #FFEFA9) | #894F18, white | #4F3C08, white |

### Accessibility

- Two targets, two buttons. The pill is a <button aria-pressed> (or an <a> when it navigates); the × is its own <button> named “Remove <label>”.
- Mode in words. The dot is decorative; the status goes in the accessible name, “Truck 45730, offline”.
- A set is role="group" with a name, and arrow keys move inside it.
- Focus shows as a solid fill plus the 2px inner stroke, in both themes.
- Live focus in light is 4.53:1 and Information selected was the tightest pair before the 26 October fix; both now pass.

Note. Dot ring in dark: The dot keeps a white 0.5px ring in dark mode too, so on Offline it is the brightest mark in the chip. It reads as deliberate in the file.
Note. No disabled chip: The file has label-disabled tokens but no disabled variant. Remove a chip rather than disable it.

### Code

Template and styles: chip.html and chip.css in the same folder. Angular API: not yet written; to be agreed with the development team.

### Known gaps

- None open.
