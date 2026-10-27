# Label

Names the field. Every field gets one; a placeholder is not a label.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Label 64749:66011 (Required False | True). Light and dark.

## Learn

### When to use

- Above every Text field, Text area, Select, Search and Date picker. They already include it.
- Above a group of checkboxes or radios, as the group’s name (use a fieldset legend in code).

### Use something else when

- The words explain the field or say what went wrong. → That is Helper text
- It is a heading for a section of a form. → Use a heading
- The field is in a table cell or toolbar. → Use a bare Input with aria-label

## Understand

### Behaviour (built in)

- **Clicking the label focuses the field.** It is a real <label for> tied to the input.
- **The field sets its colour.** Default, Hover, Focus, Filled and Error use label/text-default. Disabled uses label/text-disabled. Label has no state of its own.
- **It stays dark in Error.** The border, icon and helper carry the error. A red label would only repeat it.
- **Long labels wrap.** The label fills the field width and wraps; the asterisk stays on the first line.
- **Required adds an asterisk.** In label/required-indicator, 4px after the text. Screen readers get required from the input instead.

### Guidelines (your choices)

- **Write a noun, not an instruction.** “Delivery date”, not “Select a delivery date”. Sentence case, no colon.
- **Keep it short.** One to four words reads fastest. Put the explanation in Helper text.
- **Say required in words where it matters.** The asterisk alone is easy to miss: “Required” in the helper text.
- **Mark the exception.** If most fields are required, mark the optional ones instead: “(optional)” after the label.
- **Write for a global reader.** Plain words and the user’s own units: “Volume (m³)” or “Volume (yd³)”.

### Do not

- Use the placeholder instead of a label.
- Turn the label red in Error.
- Rely on the asterisk alone.
- End labels with a colon.
- Hide the label to save space. Use a bare Input with aria-label if the context names it.

## Building it

### Anatomy

- **Text**: Body/sm Medium, 14 / 1.3, label/text-default. Fills the field width and wraps.
- **Required indicator**: An asterisk in label/required-indicator, 4px (label/gap) after the text. Required=True only.
- **Gap to the input**: input-field/gap, 6px.

### States (set by the field)

- **Default** (Any field state except Disabled, including Error): label/text-default
- **Disabled** (The field is Disabled): label/text-disabled

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Text | label/text-default | #171614 | #D0CEC8 |
| Text, disabled field | label/text-disabled (text/label-disabled) | #9B958A | #B6B1A5 |
| Required asterisk | label/required-indicator | #B00100 | #EFADAC |
| Asterisk gap | label/gap | 4 | 4 |
| Type | Body/sm Medium | 14 / 1.3, Medium | 14 / 1.3, Medium |
| Gap to the input | input-field/gap | 6 | 6 |

### Accessibility

- Use a real <label for="id"> . It names the field and makes the label a click target.
- The asterisk is aria-hidden ; the input carries required so screen readers say “required”.
- For a group of checkboxes or radios, the label is a <legend> inside a <fieldset> .
- Weight and position, not only colour, set the label apart from the value.

### Known gaps

- None open.
