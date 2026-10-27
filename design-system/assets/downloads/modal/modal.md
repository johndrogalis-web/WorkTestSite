# Modal

A centred dialog that stops the page until the person decides. Header, content and footer, in Default (624) and Mobile (360).

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Modal / Drawer 64988:61036. Light and dark.

## Learn

### When to use

- Confirmations, especially of something that cannot be undone.
- A short decision or a short form that needs full attention.
- An alert the person must acknowledge.

### Use something else when

- The person needs the page while they work. → Use a Drawer
- It is a passing status. → Use a Toast
- It is about the whole page. → Use a Banner
- It is a long, multi-step task. → Use a full page

## Understand

### Behaviour (built in)

- **Centred, 40px from every edge.** Width 624 by default, up to 960 when the content needs it, never under 320. Below 600 it uses the Mobile layout.
- **Always modal.** A scrim dims the page (black at 20% light, 65% dark), the page is inert and focus is trapped inside.
- **Focus moves in and comes back.** On open, focus goes to the title or the first control. Escape, Close or finishing the action closes it and returns focus to the trigger.
- **Content scrolls inside.** Header and footer stay put; only the content scrolls when the modal reaches the top and bottom margins.
- **Motion.** Scales from 95% and fades in over 200ms ease-out; closes with ease-in. With reduced motion it only fades.

### Guidelines (your choices)

- **Make the title the question.** “Delete load 4417?”, not “Warning”.
- **Name buttons with verbs.** “Delete load” and “Cancel”, not “Yes” and “No”.
- **Primary on the right.** Secondary (Cancel) on the left, Link in the middle when there is one.
- **Keep it short.** If it needs scrolling or steps, it may want a Drawer or a page.
- **Write for a global reader.** Plain words, no idioms.

### Do not

- Open a modal from a modal.
- Use it for a passing message.
- Hide the Close button.
- Close it when the scrim is clicked during a destructive decision.
- Put a whole page in it.

## Building it

### Anatomy

- **Panel**: modal/background, radius 16, 0 4 24 shadow. No outer border.
- **Header**: Modal Header: title (18 Medium, modal/header/text) and a 32px Close icon button. 16 / 20 padding, 1px modal/border underneath.
- **Content**: A slot. 24px padding (16 on Mobile), Body/sm 14. Scrolls inside when it is taller than the space.
- **Footer**: Modal Footer: Secondary on the left, Link and Primary on the right, 8 apart, 20 / 24 padding, 1px rule above. Mobile stacks them full width: Primary, Secondary, Link.
- **Scrim**: modal/scrim behind it: black at 20% light, 65% dark.

### States

- **Closed** (Nothing open): Not in the page
- **Opening** (A trigger is pressed): Scrim fades in; panel scales from 95% over 200ms; focus moves in
- **Open** (Waiting for a decision): Page inert; Tab cycles inside
- **Closing** (Escape, Close or an action): Fades out with ease-in; focus returns to the trigger

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Panel | modal/background | #FFFFFF | #171614 |
| Shadow | modal/shadow-color, 0 4 24 | #4A4F55 at 12% | #000000 at 30% |
| Header and footer rule | modal/border, 1px | #DAD8D7 | #4D4B4A |
| Title | modal/header/text, 18 Medium | #171614 | #FFFFFF |
| Header padding | modal/header/padding | 16 / 20 | 16 / 20 |
| Content padding | modal/default/padding (mobile) | 24 (16) | 24 (16) |
| Footer | modal/footer/padding, button-gap | 20 / 24, 8 | 20 / 24, 8 |
| Scrim | modal/scrim | #000000 at 20% | #000000 at 65% |
| Width | Type Default / Mobile | 624 (up to 960) / 360 | Same |
| Margin | From the viewport | 40 | 40 |
| Motion | modal/duration, enter / exit easing | 200ms, ease-out / ease-in | Same |

### Accessibility

- It is a dialog with aria-modal="true" ; the native <dialog> with showModal() gives this, the scrim and Escape.
- Name it from its title: aria-labelledby points at the header text.
- On open, focus moves into the panel (to the title or the first control). On close, it returns to the button that opened it.
- The close button is a real button named “Close”. Escape does the same.
- Footer buttons are medium Buttons with visible focus (2px border and ring).
- The page behind is inert so nothing outside can be reached.

### Known gaps

- None open.
