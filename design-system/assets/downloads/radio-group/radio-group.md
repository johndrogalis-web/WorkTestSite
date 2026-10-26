# Radio group

Exactly one choice from a short list, with every option visible at once. Choosing one clears the others.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Radio Button Input 30173:78572, Field 30173:78607. Light and dark.

## Learn

### When to use

- Two to five options where exactly one must be true.
- A setting saved with a form, where seeing every option helps people choose.

### Use something else when

- Any number of options may be true, including none. → Use a Checkbox
- It is a single on or off that takes effect at once. → Use a Toggle
- More than five options. → Use a Select
- It switches the view of the page, not a value. → Use a Segmented control or Tabs

## Understand

### Behaviour (built in)

- **One tab stop for the group.** Tab lands on the selected option once; Tab again leaves the group.
- **Arrow keys move and select together.** That is the browser’s own behaviour with a shared name . Do not rebuild it.
- **There is no way back to nothing.** Once one is chosen, one stays chosen. That is a checkbox’s job.
- **The label is part of the target.** Click the words or the circle.
- **Disabled keeps its value.** A disabled selected radio is a grey ring with a lighter centre; unselected is a solid grey circle.
- **Motion is short.** Ring and halo change over 150ms ease-out (radiobutton/duration, radiobutton/easing). Focus snaps. With reduced motion, nothing animates.

### Guidelines (your choices)

- **Ask the question in the legend.** “Units shown on the ticket”. Every group has one, even next to a heading.
- **Preselect the safest or most common option.** A group with nothing selected is easy to forget. Leave it empty only when the choice is truly open.
- **Keep options vertical, one per line.** 10px between them.
- **Order by a logic people can see.** Frequency, size or alphabetical; never the order they came out of the database.
- **Say why an option is disabled.** In the label or next to it: “Imperial, set by the account”.

### Do not

- Use radios for an on or off that takes effect at once. That is a Toggle.
- Use them for more than five options.
- Mix radios and checkboxes in one group.
- Offer a way to unselect back to nothing.

## Building it

### Anatomy

- **Touchpoint**: 24 × 24, the same as the checkbox.
- **Circle**: 16 × 16, 1px border.
- **Selected**: The border becomes a 4px ring inside the circle, leaving an 8px centre in the surface colour.
- **Hover halo**: A 20px circle behind it in radiobutton/hover-fill, 2px wider than the input.
- **Focus ring**: A 2px ring outside a 20px container, 2px clear of the circle.
- **Label**: Body/sm 14, 4px from the touchpoint (radiobutton/gap).
- **Legend**: The question the group answers. Always present.

### States

- **Unselected** (At rest): Empty circle, 1px radiobutton/input-stroke
- **Selected** (After a click or an arrow key): 4px radiobutton/input-stroke ring inside; the centre stays radiobutton/input-default-fill
- **Hover** (Pointer over the touchpoint): A 2px halo in radiobutton/hover-fill; the circle does not change
- **Focus** (Keyboard focus only): A 2px radiobutton/focus-outer-stroke ring outside a 20px container, with a 2px gap
- **Disabled** (Cannot be changed): Unselected: solid radiobutton/input-fill-disabled. Selected: a 4px input-fill-disabled ring with an icon-color-disabled centre. Label radiobutton/label-disabled.

### Specs

| Token | Light | Dark |
|---|---|---|
| radiobutton/width · height | 24 | 24 |
| radiobutton/padding | 2 | 2 |
| radiobutton/gap | 4 | 4 |
| radiobutton/radius | 9999 | 9999 |
| radiobutton/input-stroke | #171614 | #FFFFFF |
| radiobutton/input-default-fill | #FFFFFF | #211F1C |
| radiobutton/hover-fill | #B6B1A5 | #9B958A |
| radiobutton/focus-outer-stroke | #171614 | #FFFFFF |
| radiobutton/input-fill-disabled | #B6B1A5 | #B6B1A5 |
| radiobutton/icon-color-disabled | #DFDEDD | #D0CEC8 |
| radiobutton/label-default | #171614 | #FFFFFF |
| radiobutton/label-disabled | #B6B1A5 | #B6B1A5 |
| radiobutton/duration · easing | 150ms ease-out | 150ms ease-out |

Note. Tokens the drawing does not use: radiobutton/input-selected-fill, icon-color and focus-inner-stroke exist but no variant uses them since the 26 October fix: the selected radio is a ring, not a fill, and focus keeps the 1px border.

### Accessibility

- All radios in a group share one name . That is what makes them a group to the browser and to assistive technology.
- Wrap them in a <fieldset> with a <legend> .
- Arrow keys move and select; Tab moves past the whole group. Do not override either.
- A group with nothing selected puts every option in the tab order; with a selection, only the selected one. Preselecting is the friendlier default.
- The touchpoint is 24 × 24, the AA minimum; the clickable label carries the real target well past it.

### Code

Template and styles: radio-group.html and radio-group.css in the same folder. Angular API: not yet written; to be agreed with the development team.

### Known gaps

- None open.
