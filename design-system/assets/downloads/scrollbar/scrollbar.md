# Scrollbar

A thin thumb that shows where you are in a scrolling area and how much is left. No track; the thumb sits on the surface.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Scrollbar 38351:39609 and Scrollbar Thumb 67936:2056 (Modal / Drawer page). Light and dark.

## Learn

### When to use

- A modal or drawer body taller than the screen.
- A menu, list or panel with a fixed height.
- A table body that scrolls under a fixed header.

### Use something else when

- The whole page scrolls. → Leave the browser’s own page scrollbar alone
- The content can be shorter instead. → Cut or paginate before you add a scroll area
- You want a horizontal carousel. → Use paging buttons; a hidden sideways scroll is easy to miss

## Understand

### Behaviour (built in)

- **It is the native scrollbar, styled.** Wheel, trackpad, touch, keyboard and drag all work the way the platform does.
- **Thumb length shows how much is visible.** Longer when most of the content fits; it is never a fixed size.
- **Hover darkens the thumb.** Hover and drag use scrollbar/thumb-hover .
- **No track, no arrows.** The thumb sits on the surface, 6px wide, pill ends.
- **Platform overlay rules still apply.** On macOS and phones it fades when idle; we do not force it on.

### Guidelines (your choices)

- **One scroll area per view where you can.** Nested scroll areas trap the wheel. If you must nest, keep the inner one short.
- **Give it a fixed height from the layout.** A max height that suits the screen, not a magic number.
- **Show that there is more.** Let a row cut off at the bottom edge so people see it continues.
- **Keep it keyboard reachable.** If nothing inside can take focus, the area itself must (see Accessibility).

### Do not

- Replace it with a JavaScript scrollbar.
- Hide it on desktop.
- Add a coloured track or arrows.
- Put a scroll area inside another scroll area that scrolls the same way.

## Building it

### Anatomy

- **Thumb**: The only visible part. 6 wide ( scrollbar/width ), pill ends ( scrollbar/radius ), scrollbar/thumb . Length follows visible ÷ total.
- **Track**: Transparent. The scroll area’s own surface shows through.
- **Scroll area**: Any element with a fixed height and overflow:auto . Not part of the component.

### States

- **Default** (At rest): neutral/400 in both modes
- **Hover** (Pointer on the thumb): neutral/600 light, neutral/200 dark
- **Drag** (Thumb held): Same as Hover

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Width | scrollbar/width | 6 | 6 |
| Radius | scrollbar/radius | pill | pill |
| Thumb | scrollbar/thumb | #7F796C | #7F796C |
| Thumb, hover or drag | scrollbar/thumb-hover | #565147 | #B6B1A5 |
| Track | none | transparent | transparent |

### Accessibility

- A scroll area with nothing focusable inside needs tabindex="0" , a role ( region ) and a name ( aria-label ), so keyboard users can reach it and scroll with the arrow keys.
- Never hide the native scrollbar on desktop: it is how many people see that there is more.
- The thumb passes 3:1 against the surfaces it sits on in both themes (1.4.11).
- Do not trap the wheel: when the inner area reaches its end, the page scrolls on.

### Known gaps

- None open.
