# Drawer

A full-height panel that slides in from the edge. Modal when it needs the person’s attention, non-modal when they work alongside the page. No maximum width.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Modal / Drawer 64988:61036. Light and dark.

## Learn

### When to use

- Filters, settings and detail views opened from a list or a map.
- Multi-step forms that should keep the page in sight.
- Help or reference read alongside the page (non-modal).

### Use something else when

- It is a short decision. → Use a Modal
- It is the main navigation. → Use the Navigation drawer
- It is a passing status. → Use a Toast

## Understand

### Behaviour (built in)

- **Full height, flush to an edge.** Right by default, left when the layout calls for it. Square corners, no margin.
- **No maximum width.** It starts at 700 and grows with its content, up to the full screen. Below 600 it is always full width. Never narrower than 320.
- **Modal or non-modal.** Modal: scrim (black at 20% light, 65% dark), focus trap and inert page. Non-modal: no scrim, no trap; the page stays usable and Tab flows back to it.
- **Focus moves in and comes back.** On open, focus goes to the title or the first control; Escape or Close returns it to the trigger.
- **Header and footer stay put.** Only the content scrolls; the footer sits at the bottom of the screen.
- **Motion.** Slides in from its edge over 300ms ease-out and out with ease-in. With reduced motion it appears without sliding.

### Guidelines (your choices)

- **Choose modal only when the page must wait.** If the person needs to see or use the page, make it non-modal.
- **Let the content set the width.** Start at 700; let tables and wide forms grow it instead of squeezing them.
- **Keep the footer for the decision.** Apply and Cancel, or nothing for a read-only panel.
- **Open one at a time.** A drawer replaces the previous one; it does not stack.
- **Write for a global reader.** Plain words, no idioms.

### Do not

- Trap focus or dim the page in a non-modal drawer.
- Use aria-modal="true" on a non-modal drawer.
- Cap the width so content wraps or scrolls sideways.
- Round the corners on the screen edge.
- Open a modal on top of a modal drawer.

## Building it

### Anatomy

- **Panel**: modal/background, square corners, 0 4 24 shadow, full height.
- **Header**: Modal Header: title (18 Medium, modal/header/text) and a 32px Close icon button. 16 / 20 padding, 1px modal/border underneath.
- **Content**: A slot. 24px padding (16 on Mobile), Body/sm 14. Scrolls inside when it is taller than the space.
- **Footer**: Modal Footer: Secondary on the left, Link and Primary on the right, 8 apart, 20 / 24 padding, 1px rule above. Mobile stacks them full width: Primary, Secondary, Link.
- **Scrim**: Modal drawer only: modal/scrim.

### States

- **Closed** (Nothing open): Not in the page
- **Opening** (A trigger is pressed): Slides in over 300ms; modal adds the scrim and inert page
- **Open** (In use): Modal: Tab stays inside. Non-modal: the page still works
- **Closing** (Escape, Close or an action): Slides out with ease-in; focus returns to the trigger

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
| Width | Type=Drawer | 700 to start, no maximum; full width under 600; min 320 | Same |
| Height | Viewport | 100% | 100% |
| Radius | None | 0 | 0 |
| Motion | modal/drawer/duration | 300ms, ease-out / ease-in | Same |

### Accessibility

- Modal drawer: role="dialog" and aria-modal="true" , page inert . Non-modal: role="complementary" or <aside> , no aria-modal , no trap.
- Name it from its title: aria-labelledby points at the header text.
- On open, focus moves into the panel (to the title or the first control). On close, it returns to the button that opened it.
- The close button is a real button named “Close”. Escape does the same.
- Footer buttons are medium Buttons with visible focus (2px border and ring).
- A non-modal drawer must not dim the page or block it; Tab flows out to the page.

### Known gaps

- None open.
