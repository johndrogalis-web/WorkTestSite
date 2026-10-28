# Tag

A small label that names a category or a quality of the thing it sits on. It cannot be clicked, selected or removed; that is a Chip.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Tag 62644:52173. Light and dark.

## Learn

### When to use

- A category or source on a record: Customer ticket, Manual entry.
- A provisional value, with the diagonal and a word that says so: “Est. 14:20”.
- A short quality that helps scanning: Priority, Sample.

### Use something else when

- It can be clicked, selected or removed. → Use a Chip
- It is a truck phase. → Use the Truck phase tag
- It is a count or a status dot. → Use a Badge
- It needs more than a few words. → Write a sentence

## Understand

### Behaviour (built in)

- **It does nothing.** No hover, no focus, no press. If it needs to, it is a Chip.
- **Long labels truncate at 100px.** An ellipsis, and the full label in a tooltip on hover or on focus of the control it sits in.
- **The diagonal means provisional.** A pattern has no text equivalent, so the label says it too: “Est.”, “Projected”.
- **Icon and diagonal are independent.** Four combinations, all legitimate.
- **The colour pair flips with the theme.** Blue with white text in light; pale blue with ink text in dark.

### Guidelines (your choices)

- **Measure any new colour pair in both themes before you use it.** Change only the fill and the text, keep 4.5:1, and bring a colour that earns its place back to the library as a token.
- **Same meaning, same colour.** Two screens using a tag for the same thing use the same pair.
- **Keep the label short enough to survive 100px.** Two or three words.
- **Write the word the diagonal stands for.** The pattern is never the only signal.
- **The icon is a shortcut, not the message.** If it carries meaning the label does not, it needs a text equivalent.

### Do not

- Make it look pressable.
- Use it for a truck phase.
- Rely on the diagonal alone.
- Invent a pair without measuring it.
- Run it past 100px.

## Building it

### Anatomy

- **Container**: 20 tall ( tag/height ), padding 4 ( tag/display/*-padding ), radius 4, max width 100 ( tag/max-width ). Fill tag/fill .
- **Label**: Body/xs 12, tag/text . Truncates with an ellipsis.
- **Icon**: Optional, 12px TrinityIcon before the label, 4 apart ( tag/gap ). Decorative.
- **Diagonal**: Optional stripes bottom-left to top-right, tag/diagonal-overlay-fill at 35% ( tag/diagonal-overlay ). Means provisional.

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Size | tag/height; padding; radius; gap; max-width | 20; 4; 4; 4; 100 | Same |
| Fill | tag/fill | #0975C3 | #C5E4FB |
| Text | tag/text | #FFFFFF | #211F1C |
| Diagonal | tag/diagonal-overlay-fill at tag/diagonal-overlay | #171614 at 35% | #211F1C at 35% |
| Diagonal, composited on the fill | measured | #0E5486 | #8C9FAD |
| Type | Body/xs | 12 / 1 | Same |

### Accessibility

- A tag is a <span> and never takes focus; the tooltip for a truncated label opens on focus of whatever it sits in.
- The icon is aria-hidden unless it carries meaning the label does not.
- The diagonal is never the only signal for provisional; the label says it.
- Measure the composite under the text (fill plus stripes), not the base fill. The default pair clears 4.5:1 by a third of a point in light, so a changed fill can break it easily.

### Known gaps

- None open.
