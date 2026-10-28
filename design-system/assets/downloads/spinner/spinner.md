# Spinner

A rotating arc for work whose length you cannot predict. Three sizes, one colour per theme, and nothing that fills, because there is nothing to count.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Spinner 64411:20735. Light and dark.

## Learn

### When to use

- A request whose end you cannot measure: a refresh, a search, a save.
- The first load of a panel when a skeleton is not possible.
- Inside a button while its own request runs.

### Use something else when

- The work can report a number: bytes, rows, step 3 of 7. → Use a Progress bar
- The layout is predictable and the wait is the first load. → Use a skeleton
- The work finishes in under about 400ms. → Show nothing

## Understand

### Behaviour (built in)

- **Turns clockwise, 800ms a turn, linear, without pause.** Linear on purpose: an eased turn stutters, because there is no start or end to ease from.
- **Appears after 400ms, stays at least 400ms.** Nothing shows for short work; once shown it never flashes off.
- **One state: spinning.** No paused, error or done. What replaces it when the work ends is a separate decision.
- **Reduced motion slows it to 1500ms a turn.** It does not stop: a frozen spinner reads as a broken page.
- **It announces the start, the page announces the end.** role="status" with a name; the parent says “Done” or what failed.

### Guidelines (your choices)

- **Put it where the result will appear.** It marks the thing that is loading, not the page.
- **One spinner per waiting region.** Four spinners is a stalled page, not a loading page.
- **Past 1s, add words.** “Refreshing fleet status”. Past 10s, reconsider the pattern: a stage count, or let the person leave and be told.
- **Match the size to the area.** 40 for a page or panel, 24 for a card or modal body, 16 in a button or beside a line of text.
- **Reserve the space the result will take.** Nothing jumps when it arrives.

### Do not

- Use it for work that can report a percentage.
- Fake a progress bar with a timer; that is a lie with a shape.
- Put it on top of content the person can still read.
- Invent a colour for it.
- Let it spin forever; decide what a timeout looks like.

### Spinner or progress bar

| Situation | Use | Why |
|---|---|---|
| Dashboard card refreshing | Spinner | The request returns when it returns |
| Saving a form or a reading | Spinner, in the button | One request, no stages; usually under 400ms, so nothing shows |
| Uploading a photo | Progress bar | Bytes sent against bytes total is real |
| Export or batch job | Progress bar | Step n of m is countable |
| First load of a panel | Spinner, or a skeleton | Unknown length; a skeleton wins when the layout is known |

### How long before showing anything

| Elapsed | Show | Why |
|---|---|---|
| Under 400ms | Nothing | The flash is worse than the wait |
| 400ms to 1s | Spinner alone |  |
| Past 1s | Spinner and a short line of text |  |
| Past about 10s | Reconsider | Words, a stage count, or let the person leave and be told |

## Building it

### Anatomy

- **Arc**: A filled arc, about 290° from 12 o’clock, with a 70° gap. The gap is what makes the turn visible.
- **Ends**: Flat. Round caps would lengthen the arc past its sweep.
- **Thickness**: Drawn per size: about 5.5 / 4 / 3 at 40 / 24 / 16. Not a token, by decision.
- **Track**: None, by design.
- **Words**: Optional text beside it once a wait passes a second; not part of the component.

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Sizes | spinner/large, medium, small (width and height) | 40 / 24 / 16 | Same |
| Colour | transparent/strong | #171614 | #D0CEC8 |
| Thickness | drawn per size, not a token | 5.5 / 4 / 3 | Same |
| Sweep | drawn | 290° from 12 o’clock, clockwise | Same |
| Ends, track | drawn | flat; no track | Same |
| Motion | spinner/duration, spinner/easing | 800ms, linear, looping | Same |
| Reduced motion | spinner/reduced/duration | 1500ms | Same |
| Delay, minimum | house rule | 400ms, 400ms | Same |

### Accessibility

- Give it role="status" and an aria-label (“Loading”, or what is loading), or visible text beside it.
- Announce the end of loading too: a polite live region that says done, or what failed. “Loading” followed by silence tells a screen reader user nothing.
- Reduced motion slows the turn to 1500ms; it never stops.
- In a button, the spinner replaces the label and the button is disabled; the button keeps its name.
- Contrast is comfortable in both themes (see below); the accessibility work here is motion and announcement, not colour.

### Known gaps

- None open.
