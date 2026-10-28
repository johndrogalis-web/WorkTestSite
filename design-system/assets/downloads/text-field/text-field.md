# Text field

Label, Input and Helper text in one molecule: 82px tall, six states, one shape for every kind of single-line answer.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Input Field 64751:66298 (Label 64749:66011, Input 64751:66225, Helper Text 64749:66018). Light and dark.

## Learn

### When to use

- Any single-line answer in a form: a truck number, a name, an email, a password.
- A value with a format hint or a validation rule.
- Anywhere the person types rather than picks.

### Use something else when

- More than one line is expected. → Use Text area
- They pick from a known list. → Use Select
- They are finding things. → Use Search
- It is a date or a time. → Use the Date and time field

## Understand

### Behaviour (built in)

- **Validates on blur, not on every keystroke.** An error while the person is still typing is the fastest way to a hostile form.
- **Error never moves the layout.** The 16px helper row is always reserved, so the message and its icon appear in place.
- **The error clears on the next blur once the value is fixed.** No second submit to find out.
- **The label stays dark in Error.** Border, helper text and icon carry it; the label keeps naming the field.
- **Filled keeps the dark border after blur.** So a form at a glance shows what has been answered.
- **Motion.** Background, border and ring change in 150ms ease-out.

### Guidelines (your choices)

- **Keep the label on.** A placeholder disappears the moment the person types and screen readers do not reliably announce it.
- **Error copy says what to do.** “Enter a truck number using digits only”, not “Invalid”. One sentence, no blame.
- **Required is the asterisk plus words.** Say “Required” in the helper, or say which fields are optional.
- **Width follows the expected answer.** A truck number does not need a full-width field; fields in one column share one width.
- **Disabled means the reason is visible.** In the helper, or hide the field.

### Do not

- Use the placeholder as the label.
- Build a label and helper around a bare Input by hand.
- Turn the label red yourself.
- Use the helper as a second label.
- Make a new component per field type.

## Building it

### Anatomy

- **Label**: Label atom, Body/sm Medium 14, 10 high in the stack. Required adds the asterisk.
- **Input**: Input atom, 44 high, 16 side padding, radius 8, 1px border (2px on focus). Leading and trailing 16px icon slots, off by default.
- **Helper text**: Helper text atom, Body/xs 12 in a 16px row that is always reserved. Error adds the 16px icon.
- **Stack**: Label, Input, Helper with a 6px gap ( input-field/gap ): 10 + 6 + 44 + 6 + 16 = 82.

### States

| State | When | What changes |
|---|---|---|
| Default | At rest | border #666054, background #FFFFFF, placeholder #666054 |
| Hover | Pointer over the box | background #F0EEEA, border #171614 |
| Focus | Tab or click | 2px border #171614 and the focus ring; background #FFFFFF |
| Filled | Has a value | border #171614; the value in #171614 replaces the placeholder |
| Error | Validation failed on blur | border #B00100; the helper turns red and gains its icon; the label stays dark |
| Disabled | Cannot be used | background #DFDEDD, border #B6B1A5, text #7F796C; label and helper grey |

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Stack | input-field/gap; total | 6; 82 | Same |
| Input | input/height, padding, field-radius | 44, 12 / 16, 8 | Same |
| Border | input/border-default / hover / focus (2px) / filled / error / disabled | #666054 / #171614 / #171614 / #171614 / #B00100 / #B6B1A5 | #DFDEDD / #F0EEEA / #D0CEC8 / #FFFFFF / #EFADAC / #9B958A |
| Background | input/background, -hover, -disabled | #FFFFFF, #F0EEEA, #DFDEDD | #171614, #2F2D28, #211F1C |
| Text | input/text-default, -placeholder, -disabled | #171614, #666054, #7F796C | #FFFFFF, #9B958A, #B6B1A5 |
| Focus ring | input/shadow-focus | #171614 at 25%, blur 4, spread 2 | #FFFFFF at 35% |
| Label | label/text-default, Body/sm Medium | #171614 | #FFFFFF |
| Helper | helper text tokens, Body/xs; error | #171614; #B00100 | #FFFFFF; #EFADAC |
| Motion | input-field/duration, easing | 150ms ease-out | Same |

### Accessibility

- <label for> wired to the input’s id; clicking the label focuses the field.
- Helper text linked with aria-describedby , so it reads after the label.
- Error sets aria-invalid="true" and the message gets role="alert" . The icon keeps the error from being colour alone; never hide it.
- The right type and inputmode per field type, so phones show the right keyboard.
- The password toggle is a button whose name changes: Show password / Hide password.

### Known gaps

- None open.
