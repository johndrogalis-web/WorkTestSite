# Text area

The Text field with room for more than one line: the same label, border and helper, a 98px box that grows with what is written.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Text Area 64751:66374. Light and dark.

## Learn

### When to use

- Notes, instructions, comments: anything that runs past one line.
- A description or reason the person writes in their own words.
- Free text with a character limit worth showing.

### Use something else when

- One line will do. → Use a Text field
- It is structured data: a list, a date, a number. → Use the matching field
- It is rich text with formatting. → Use an editor, not this

## Understand

### Behaviour (built in)

- **Starts at 98px and grows with the content.** Never a fixed box that scrolls and hides what was written. The minimum is 64.
- **Text is top-aligned.** The first line sits where the person expects to start typing.
- **Validates on blur, like Text field.** Same error rules, same reserved helper row.
- **A character count sits in the helper row when there is a limit.** It turns red with the error state when the limit is passed.
- **Enter makes a new line.** It never submits the form.
- **Motion.** 150ms ease-out on background, border and ring; growth is immediate.

### Guidelines (your choices)

- **Size the box to the expected answer.** 98px invites a few lines; a bigger empty box invites an essay.
- **Say the limit before they hit it.** “Up to 500 characters” in the helper, with the count.
- **Keep the label on.** As on every field.
- **Error copy says what to do.** “Add the gate code”, not “Required”.
- **Width follows the layout, not the answer.** Usually full width of its column.

### Do not

- Use it where one line will do.
- Fix the height so it scrolls inside.
- Let Enter submit.
- Hide the count until the limit is passed.
- Put formatting controls on it.

## Building it

### Anatomy

- **Label**: Label atom, as on Text field.
- **Box**: The Input’s border, background and states, text-area/height 98, min-height 64, padding 8 top and bottom ( text-area/padding-top-bottom ), 16 sides. Text top-aligned.
- **Helper text**: Helper text atom in its reserved 16px row; the character count sits at its right when there is a limit.
- **Stack**: Label, Box, Helper with a 6px gap: 10 + 6 + 98 + 6 + 16 = 136.

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
| Box | text-area/height, min-height, padding-top-bottom; side padding | 98, 64, 8; 16 | Same |
| Stack | input-field/gap; total | 6; 136 | Same |
| Border, background, text | input/* (same as Text field) | see Text field | see Text field |
| Count | helper row, Body/xs | #666054; error #B00100 | #9B958A; error #EFADAC |
| Motion | text-area/duration, easing | 150ms ease-out | Same |

### Accessibility

- Everything from Text field: label for , aria-describedby , aria-invalid and the alert.
- The count is inside the helper, so it is read with the description; when the limit is passed it joins the error message.
- Growing with content keeps everything written visible to sighted users and to magnifier users alike.
- Enter inserts a newline; a form submit is a button.

### Known gaps

- None open.
