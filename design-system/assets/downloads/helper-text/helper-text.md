# Helper text

The line under a field that explains it, or says what went wrong.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Helper Text 64749:66018 (State Helper | Error). Light and dark.

Updated in Figma: long text wraps: Helper Text was fixed at 16px tall and never wrapped, so a long message ran past the field. Now the text fills the field width and wraps, the row grows from a 16px minimum, and the icon stays on the first line. The top and bottom padding token is 0; at 4 it squeezed the 12px text into an 8px box.

## Learn

### When to use

- A format, unit or limit the field needs: “MM/DD/YYYY”, “In yd³”, “Up to 40 characters” (US examples; format and units follow the user).
- Whose time or which plant a value belongs to: “Plant time (CST)”.
- What went wrong with a field, and how to fix it.

### Use something else when

- The message is about the whole form, or about saving. → Use a Banner above the form
- The words name the field. → That is the Label
- It is a status that is not tied to one field. → Use a Toast or a Banner
- It needs a link or a button. → Put the action in the form, not in the helper

## Understand

### Behaviour (built in)

- **The row is always there.** It keeps at least 16px under the field even when empty, so the form does not jump when an error appears.
- **An error replaces the helper.** Same row: the alert icon appears and the text turns error red. The field turns the label and border red with it.
- **Fixing the value brings the helper back.** When the value is valid again the error clears and the original helper text returns.
- **Long text wraps.** The text fills the field width. The row grows to two lines or more and the icon stays beside the first line.
- **Errors are announced.** The helper is linked to the input with aria-describedby and is a polite live region, so a new error is read out once.

### Guidelines (your choices)

- **Say what to do, not what failed.** “Enter a date like 09/18/2026” beats “Invalid date”.
- **Aim for one line.** Wrapping is allowed so nothing is lost, but a short message is read faster. About 45 characters fits a 320 field.
- **Check on leaving the field, or on submit.** Not on every keystroke, or people see errors before they have finished typing.
- **One message per field.** Show the one that helps most. Do not stack several errors.
- **Leave it empty rather than repeat the label.** The row is still reserved.
- **Use the user’s format and units.** Dates, times and units follow the user’s location and settings: m³ for most of the world, yd³ in the US. Never hard-code one.
- **Write for a global reader.** Plain words, no idioms or local shorthand. Sentence case and numerals. Describe the value, never blame the person.

Product copy, not marketing: The Tone of voice page covers marketing and external copy. Helper text, labels and other product microcopy follow this page and the other component pages.

### Do not

- Use it as a second label.
- Hide the error icon. Colour alone does not carry the meaning.
- Write “Invalid input” or “Error”.
- Truncate a message with an ellipsis.
- Put links or buttons in it.

## Building it

### Anatomy

- **Row**: Fills the field width. At least 16px tall (helper-text/height), grows with the text. 8px gap, no padding.
- **Icon**: 16px alert circle, Error only, in helper-text/icon-error. Aligned to the first line.
- **Text**: Body/xs, 12px with a 1.3 line height. Fills the rest of the row and wraps.

### States

- **Helper** (Guidance for the field, or nothing): helper-text/text-default, no icon
- **Error** (The value failed a check): helper-text/text-error, alert icon in helper-text/icon-error; the field turns its label and border red

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Text, helper | helper-text/text-default | #171614 | #FFFFFF |
| Text, error | helper-text/text-error | #B00100 | #EFADAC |
| Icon, error | helper-text/icon-error | #B00100 | #EFADAC |
| Icon to text | helper-text/gap | 8 | 8 |
| Padding top and bottom | helper-text/padding-top-bottom (spacing/micro/000) | 0 | 0 |
| Minimum height | helper-text/height | 16 | 16 |
| Type | Body/xs | 12 / 1.3, Regular | 12 / 1.3, Regular |
| Icon size | Icon Small | 16 | 16 |
| Gap above (in a field) | input-field/gap | 6 | 6 |

### Accessibility

- Link the helper to its input with aria-describedby , so it is read with the field.
- In Error, set aria-invalid="true" on the input. The helper is a polite live region ( aria-live="polite" ), so the new message is read once.
- The icon is decorative ( aria-hidden ): the words carry the meaning, and the icon is what keeps the error from depending on colour (WCAG 1.4.1).
- Wrapping keeps the whole message readable at 400% zoom (WCAG 1.4.10).

### Known gaps

- None open.
