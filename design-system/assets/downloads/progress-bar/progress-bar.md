# Progress bar

An 8px bar that fills left to right to show how much of a task is done. One fill colour; the words beside it say what happened.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Progress Bar 51692:17330. Light and dark.

## Learn

### When to use

- A task with a known end: uploading photos, importing tickets, syncing a fleet.
- Steps through a fixed process where a percentage is honest.

### Use something else when

- You do not know how long it will take. → Use a Spinner
- It shows a measurement, not progress (fuel, capacity). → Use a chart or a Widget KPI
- It is a step-by-step flow. → Show the steps by name

## Understand

### Behaviour (built in)

- **Width only.** The fill grows over 300ms ease-out. Nothing else moves: no pulse, no shimmer, no stripes, no loops.
- **Never backwards.** If a new estimate is lower, hold until the real number catches up.
- **One fill, whatever happens.** It does not turn green at 100 or red on failure. The words beside it carry the outcome (WCAG 1.4.1).
- **The track shows the whole length.** A 1px track stroke draws the end, so 60% reads as 60% of something.
- **Reduced motion.** The fill jumps straight to its value.

### Guidelines (your choices)

- **Always pair it with words.** A label for the task and a line for the value or time left.
- **Say failure in text.** “Stopped at 40%. 3 photos failed.” Leave the bar as it is.
- **Round honestly.** Whole percentages; do not show 99% for minutes.
- **Let it take its container’s width.** It fills the width it is given; no fixed width.

### Do not

- Animate it without the value changing.
- Recolour it for success, warning or failure.
- Use it for an unknown duration.
- Make it thinner than 8px.
- Run it backwards.

## Building it

### Anatomy

- **Track**: progress-bar/track-fill with a 1px inside progress-bar/track-stroke. 8px high (progress-bar/height), radius 4.
- **Fill**: progress-bar/progress-fill, same height and radius, width = value.
- **Label and value**: Text beside it, outside the component: what is happening and how far.

### States

- **Working** (0 to 99%): Fill grows; value text updates
- **Done** (100%): Full fill; the text says done
- **Failed** (Stopped): Fill stays where it stopped; the text says what failed

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Height, radius | progress-bar/height, radius | 8, 4 | 8, 4 |
| Track | progress-bar/track-fill | #B6B1A5 | #666054 |
| Track stroke | progress-bar/track-stroke, 1px inside | #7F796C | #7F796C |
| Fill | progress-bar/progress-fill | #171614 | #FFFFFF |
| Motion | progress-bar/duration, easing | 300ms, ease-out | Same |
| Reduced motion | progress-bar/reduced/duration | 0 | 0 |

### Accessibility

- Use role="progressbar" with aria-valuenow , aria-valuemin="0" and aria-valuemax="100" , named by its label with aria-labelledby .
- Announce the end, not every step: a polite live region says “Done” or what failed.
- Outcome is in words, never colour alone (1.4.1).
- The track stroke and the fill both pass 3:1 against what they sit on (1.4.11).

### Known gaps

- None open.
