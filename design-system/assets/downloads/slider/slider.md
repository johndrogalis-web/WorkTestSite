# Slider

Pick a rough value by dragging a thumb along a track, alone or as a range between two thumbs. Drag it roughly; type it exactly.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Slider 53714:4469, Slider-Range 62887:1916, Slider Thumb 53714:4557. Light and dark.

## Learn

### When to use

- A target where the rough size of the change matters more than the exact number: slump, water, air.
- A range between two values: a window of temperatures or times.
- A setting people adjust by feel: volume, zoom, brightness.

### Use something else when

- The exact value matters. → Use a number Input , or show one beside the slider
- There are a handful of named choices. → Use a Segmented control or Radio group
- It is on or off. → Use a Toggle

## Understand

### Behaviour (built in)

- **The fill runs from the left edge to the thumb.** On the range form it runs between the two thumbs.
- **The value bubble shows while the thumb is active or focused.** It says the current number; it fades when you let go.
- **The thumb grows as you interact.** 16px ring at rest, a 1px outline on hover, 24px ring while dragging. The 24px target never changes.
- **Keyboard.** Arrow keys move one step, Page Up and Page Down ten, Home and End go to the ends.
- **Range thumbs can meet but never cross.** The minimum gap is one step; when they touch the fill between them disappears.
- **Disabled does not move.** Track and thumb go grey; the value stays readable.
- **Motion.** The fill and thumb move in 200ms ease-out when the value is set from outside; dragging is immediate.

### Guidelines (your choices)

- **Write the ends and the unit.** “0 in” and “12 in” under the track, in the user’s units.
- **Show the current value somewhere permanent.** The bubble only shows while dragging.
- **Give it room.** One step should be a visible movement; past about twenty steps, show the number too.
- **Say what would enable a disabled slider.** In the helper text or a tooltip.
- **Keep the thumb at 24.** That is the AA target size; never smaller.

### Do not

- Use it when the exact value matters and nothing shows the number.
- Use it for a handful of named options.
- Put tick marks on a track with more than ten steps.
- Shrink the thumb or the track.
- Cross the range thumbs.

## Building it

### Anatomy

- **Track**: 4px, radius 4, slider/track/base neutral/400 in both themes. Full width of its container.
- **Fill**: Same size, slider/track/progress-bar : left edge to the thumb, or between the two thumbs.
- **Thumb**: A 24×24 target. At rest a 16px circle with a 6px ring ( slider/thumb/stroke on slider/thumb/fill ); active, a 24px circle with an 8px ring.
- **Value bubble**: 24 tall, radius 4, slider/value/fill with a pointer. Shows the number while active or focused.
- **Ends and unit**: Text under the track: min and max with the unit. Not part of the Figma component; always present in product.

### States

| State | Light | Dark |
|---|---|---|
| Default | 16px circle, 6px ring #211F1C on #FFFFFF | 6px ring #FFFFFF on #211F1C |
| Hover | + 1px outline #B6B1A5 at the 24px edge | + 1px outline #D0CEC8 |
| Focus | + 1px outline #666054; bubble shows | + 1px outline #FFFFFF; bubble shows |
| Active | 24px circle, 8px ring; bubble #C5E4FB | 24px circle, 8px ring; bubble #E3F200 |
| Disabled | track #D0CEC8, fill #B6B1A5, ring #B6B1A5 | track #45413A, fill #B6B1A5, ring #B6B1A5 |

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Track | slider/track/height, radius, base | 4, 4, #7F796C | 4, 4, #7F796C |
| Fill | slider/track/progress-bar | #171614 | #D0CEC8 |
| Thumb target | slider/thumb/width, height | 24 | 24 |
| Thumb ring | slider/thumb/stroke, default-stroke-thickness | #211F1C, 6 | #FFFFFF, 6 |
| Thumb fill | slider/thumb/fill | #FFFFFF | #211F1C |
| Hover outline | slider/thumb/hover-stroke (colour, 1px) | #B6B1A5 | #D0CEC8 |
| Focus outline | slider/thumb/focus-stroke (colour, 1px) | #666054 | #FFFFFF |
| Active ring | slider/thumb/active-stroke-thickness | 8 | 8 |
| Value bubble | slider/value/fill, Body/xs | #C5E4FB, text #000000 | #E3F200, text #000000 |
| Disabled | slider/track/base-disabled, progress-bar-disabled, thumb/stroke-disabled | #D0CEC8, #B6B1A5, #B6B1A5 | #45413A, #B6B1A5, #B6B1A5 |
| Motion | slider/duration, easing | 200ms ease-out | Same |

### Accessibility

- Build on a native <input type="range"> per thumb, visually hidden over the painted track: keyboard, touch and the value come for free. Give it a name that says what is being set and aria-valuetext with the unit.
- Focus is the 1px outline plus the value bubble appearing; the bubble is the second cue.
- The 24×24 thumb meets WCAG 2.2 target size (2.5.8) at AA. A larger invisible hit area is welcome on touch.
- The dark fill (#D0CEC8) measures 2.75:1 against the empty track (#7F796C), an accepted exception: the thumb marks the position at 16:1.
- Disabled stays readable: 2.3:1 track on page, 2.7:1 fill on track, and the number beside it.

### Known gaps

- None open.
