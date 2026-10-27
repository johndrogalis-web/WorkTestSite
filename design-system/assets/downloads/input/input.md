# Input

The bare field: border, background, text and two icon slots. Use Text field instead unless you are building something new.

Status: Has gaps. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Input 64751:66225. Light and dark.

## Learn

### When to use

- Building a new component that needs a field without a label or helper text, as Select, Search and Date picker do.
- A field inside a table cell or a toolbar, where the column header or the toolbar names it.

### Use something else when

- It is a field in a form. → Use Text field , which adds the Label and Helper text
- More than one line is expected. → Use Text area
- People choose from a list. → Use Select
- People search or filter. → Use Search

## Understand

### Behaviour (built in)

- **Pointer over it: Hover.** Fill and border darken. Leaving returns to Default.
- **Click or Tab into it: Focus.** 2px border and a 4px focus ring. Height stays 44: the padding drops 1px to make room.
- **Typing: Filled.** The value replaces the placeholder. When focus leaves, the ring and 2px border go; the darker border stays while there is a value.
- **Validation fails: Error.** The border turns error red. A bare Input has no message, so whatever contains it must say what went wrong.
- **Disabled.** Fill, border, text and icons go to their disabled tokens. It takes no focus and no pointer.
- **Changes are short.** Fill, border and ring change over 150ms, ease-out.

### Guidelines (your choices)

- **Give it a name.** With no Label, set aria-label or aria-labelledby . A placeholder is not a name.
- **Make icons mean something.** Leading icons say what kind of field it is (search, truck). Trailing icons are actions (clear, show password) and are real buttons.
- **Width comes from the layout.** It fills its container. There are no size variants and the height is always 44.
- **Swap the glyph, do not detach.** Both icon slots have a swap property in Figma.

### Do not

- Build a label and helper around it by hand. That is Text field.
- Use the placeholder as the label.
- Make a new component for each field type (email, phone, date). Change the text and the icon.
- Shrink the height below 44.
- Show Error with no message anywhere near it.

## Building it

### Anatomy

- **Container**: 44 high, 16px left and right padding, 8px radius (input/field-radius), 1px border, 2px on Focus.
- **Leading icon**: 16px, hidden by default. input/icon-default; input/icon-disabled when Disabled.
- **Text**: Placeholder or value, Body/sm 14 / 1.3. Fills the space between the icons.
- **Trailing icon**: 16px, hidden by default. An action: make it a button with a name.

### States

- **Default** (At rest): border-default, background, text-placeholder
- **Hover** (Pointer over it): border-hover, background-hover
- **Focus** (Keyboard or click focus): border-focus at 2px, shadow-focus ring
- **Filled** (Has a value): border-filled, text-default
- **Error** (Validation failed): border-error; the message lives in what contains it
- **Disabled** (Not available): background-disabled, border-disabled, text-disabled, icon-disabled

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Height | input/height | 44 | 44 |
| Padding | input/padding-left-right, padding-top-bottom | 16 / 12 | 16 / 12 |
| Icon gap | input/gap | 8 | 8 |
| Radius | input/field-radius | 8 | 8 |
| Border | input/border-width, border-width-focus | 1, 2 on Focus | 1, 2 on Focus |
| Background | input/background | #FFFFFF | #171614 |
| Background, hover | input/background-hover | #F0EEEA | #2F2D28 |
| Background, disabled | input/background-disabled | #DFDEDD | #211F1C |
| Border | input/border-default | #666054 | #DFDEDD |
| Border, hover and filled | input/border-hover, border-filled | #171614 | #F0EEEA |
| Border, focus | input/border-focus | #171614 | #D0CEC8 |
| Border, error | input/border-error | #B00100 | #EFADAC |
| Border, disabled | input/border-disabled | #B6B1A5 | #9B958A |
| Value | input/text-default | #171614 | #FFFFFF |
| Placeholder | input/text-placeholder | #666054 | #9B958A |
| Text, disabled | input/text-disabled | #7F796C | #B6B1A5 |
| Icon | input/icon-default, icon-disabled | #171614, #7F796C | #FFFFFF, #B6B1A5 |
| Focus ring | input/shadow-focus, focus-blur, focus-spread | #171614 at 25%, 4, 2 | #FFFFFF at 35%, 4, 2 |
| Type | Body/sm | 14 / 1.3 | 14 / 1.3 |
| Motion | input/duration, input/easing | 150ms, ease-out | 150ms, ease-out |

### Accessibility

- There is no visible label, so the field needs aria-label or aria-labelledby . The placeholder disappears on typing and is not a name.
- In Error, set aria-invalid="true" and point aria-describedby at the message, wherever it is.
- Trailing icons that do something are buttons with a name (“Clear”, “Show password”). Leading icons are decorative ( aria-hidden ).
- Focus shows as a 2px border and a ring, never colour alone.
- Disabled uses the disabled attribute, so it leaves the tab order.

### Known gaps

- **Spec frame names the wrong radius token.** The Input spec frame says “radius input/radius”. The component uses input/field-radius (8). input/radius is 100 and only used on two Typography frames. The frame text needs to say input/field-radius.
