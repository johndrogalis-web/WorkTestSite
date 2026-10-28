# Tooltip

A short label that appears next to whatever you are pointing at. It names or explains; it never carries anything the person needs to finish the task.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Tooltip 2620:4152. Light and dark.

## Learn

### When to use

- The name of an icon-only control that already has a visible meaning: Edit, Filter, Refresh.
- A unit or a definition behind a number: “Water added after batching, as a share of design water”.
- The full text behind something truncated: a long plant name in a tag or a cell.

### Use something else when

- The person cannot finish without reading it. → Put the text on the page, or use Helper text
- It has a title, a link or a button in it. → That is a Modal or a popover
- It needs a third line. → Write a sentence on the page
- It is on a phone. → There is no hover; make the label visible

## Understand

### Behaviour (built in; timing and placement are the house convention)

- **Opens after 500ms on hover, at once on keyboard focus.** The delay stops tooltips firing as the pointer crosses a toolbar; focus has no such problem.
- **Closes after 100ms, and stays open while the pointer is on it.** That grace is what lets someone move onto the tooltip to read it (WCAG 1.4.13).
- **Escape closes it. It never takes focus.** Focus stays on the trigger throughout; the tooltip is announced through aria-describedby .
- **One at a time.** Opening a second closes the first, and the second opens with no delay, so a row of icon buttons feels like one tooltip following you.
- **Anchored to the trigger, never to the cursor.** 8px between trigger and box; the arrow sits in that gap. If the preferred side does not fit, it flips on the long axis and slides on the short one, then holds that place until it closes.
- **Closes on scroll. Fades 150ms in, 150ms out.** Fade only, no slide; under reduced motion it appears and disappears at once. It renders in a top layer above modals and drawers and is never clipped by a parent.

### Guidelines (your choices)

- **One line, under 45 characters.** The 280px cap holds about 45 characters a line; a typical help string measures 242px and never wraps. Two lines is the limit.
- **Pick the side from the surroundings.** Above for an inline trigger in a form or a paragraph; Right for an item in a left rail; Below for anything in a top bar.
- **Name the control, do not describe it.** “Edit”, not “Click here to edit this ticket”.
- **Never the only place a fact lives.** If it matters, it is also on screen, in the label, the helper text or a column.
- **Every icon-only control gets one.** It is the control’s name for sighted mouse users; the aria-label is its name for everyone else, and they say the same thing.

### Do not

- Put a link, a button or a title in it.
- Let it follow the cursor.
- Rely on it on a phone.
- Run it to three lines.
- Use it to explain a control that should have had a visible label.

## Building it

### Anatomy

- **Container**: Hug both ways, capped at 280 ( tooltip/max-width ). 24 tall at one line ( tooltip/height ): padding 4 top and bottom ( tooltip/padding-top-bottom ), 8 at the sides ( tooltip/padding ), radius 4 ( radius/sm ). Fill tooltip/fill .
- **Text**: Body/xs 12 / 1.3, tooltip/text . Wraps with word-break: break-word ; the box grows downward.
- **Arrow**: 15 × 6 ( tooltip/arrow-width , tooltip/arrow-height ), same fill, centred on the edge that faces the trigger, overlapping the box by 2px so 4px shows.
- **Position**: Above, Below, Left or Right. The name says where the tooltip sits, so Above puts the arrow underneath.

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Fill | tooltip/fill | #171614 | #FFFFFF |
| Text | tooltip/text | #FFFFFF | #211F1C |
| Type | Body/xs | 12 / 1.3 | Same |
| Size | tooltip/height; padding-top-bottom; padding; radius/sm; max-width | 24; 4; 8; 4; 280 | Same |
| Arrow | tooltip/arrow-width × arrow-height | 15 × 6 | Same |
| Motion | tooltip/duration; enter/easing; exit/easing | 150ms; ease-out; ease-in | Same |
| Timing (house rule) | open; close; between triggers | 500ms; 100ms; 0ms | Same |

### Accessibility

- The trigger carries aria-describedby pointing at the tooltip ( role="tooltip" ); the tooltip itself never takes focus.
- It opens on focus as well as hover, closes on Escape, and stays open while hovered, so it meets WCAG 1.4.13.
- The text is never the only place a fact lives, and an icon-only control still has an aria-label that says the same thing.
- Both pairs pass AAA in both themes; there is one pair per theme and it does not change per use.

### Known gaps

- None open.
