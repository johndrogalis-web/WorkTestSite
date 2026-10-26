# Link

A word or phrase inside a sentence that takes the reader somewhere. It keeps the paragraph’s type and changes only colour and underline.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), link/* tokens; Link atom documentation 65835:47147. Light and dark.

## Learn

### When to use

- Body copy, captions and helper text that point to another page or document.
- A list or table cell, when it holds prose rather than data.

### Use something else when

- It runs an action: opens, saves, filters or toggles. → Use a Button, or the Link button
- It sits on its own in a toolbar, table or card footer. → Use the Link button
- It is a heading, a label, a tab or a navigation item. → Use that component; it carries its own link
- It goes inside a tooltip. → Move it out; a tooltip cannot be reached

## Understand

### Behaviour (built in)

- **It navigates.** It goes somewhere, and the address can be copied, bookmarked and opened in a new tab.
- **It is always underlined.** 1px at rest and 2px on hover and press, 2px below the baseline.
- **It takes the paragraph’s type.** Family, size, weight and line height come from the sentence.
- **It wraps like the sentence around it.** The underline follows it across lines.
- **Focus shows a 2px ring on keyboard focus only.** The ring is the cue, not the colour change.
- **It has no visited state.** In an application a colour that changes after one click reads as a status.

### Guidelines (your choices)

- **Link the phrase that names the destination.** “View order details”, never “click here” or “read more”.
- **Use it on Page Content.** On white in light and #171614 in dark every state passes. On grey layer surfaces, use the component’s own link colour, such as the Banner’s.
- **Open a new tab only for an external site or a document that would lose the reader’s work.** Say so in the link.
- **Give the same destination the same text everywhere.** Different destinations get different text.
- **Separate neighbouring links with words or punctuation.** Two links side by side read as one.

### Do not

- Remove the underline.
- Use a link to run an action.
- Write a raw URL as the link text.
- Use it for headings, labels or navigation.
- Put it in a tooltip.

## Building it

### Anatomy

- **Text**: The linked phrase, in the paragraph’s type.
- **Underline**: Always on.
- **Focus ring**: Keyboard focus only.

### States

- **Default** (At rest): link/link, 1px underline
- **Hover** (Pointer over it): link/link-hover, 2px underline
- **Pressed Active in Figma** (While held down): link/link-active, 2px underline
- **Focus** (Keyboard focus): link/link-focus, plus the 2px ring

### Specs

Measured on Page Content: #FFFFFF light, #171614 dark.

| State | Token | Light | Dark | Underline |
|---|---|---|---|---|
| Default | link/link (primary/600, primary/400) | #0975C3 | #41A8F2 | 1px, offset 2 |
| Hover | link/link-hover (primary/700, primary/500) | #0D598F | #1594EF | 2px |
| Pressed | link/link-active (primary/550, primary/400) | #0B7ACA | #41A8F2 | 2px |
| Focus | link/link-focus (primary/550, primary/400) | #0B7ACA | #41A8F2 | 1px |
| Focus ring | interaction/focus; 2px outline, offset 2, radius 2 | #171614 | #D0CEC8 | — |

Note. Grey layer surfaces: On layout/layer-1 (#F6F4F2 light, #2F2D28 dark) link/link drops to 4.41:1 in light and the dark hover to 4.27:1. Components on those surfaces carry their own link colour; the Banner uses banner/link (#0D598F, #C5E4FB).

### Accessibility

- It is always underlined, so colour alone does not mark it (WCAG 1.4.1). In dark the blue sits close to white body text.
- It is a real <a href>. Never a span with a click handler, never an anchor that runs an action.
- Focus is visible on :focus-visible (WCAG 2.4.7).
- The purpose is clear from the link text or its sentence (WCAG 2.4.4).
- A link that opens a new tab says so in its accessible name.

### Code

Template and styles: link.html and link.css in the same folder. Angular API: not yet written; to be agreed with the development team.

### Known gaps

- None open.
