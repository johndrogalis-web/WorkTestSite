# Tabs

Peer views of one object, switched in place. Tabs are wayfinding, not settings: nothing is reconfigured, you are just looking somewhere else.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Tabs 39520:6900 and _tabItem 10544:31469. Light and dark.

## Learn

### When to use

- Two to eight views of one thing: Overview, Sensors, History for a truck.
- Sections of a long detail page that people jump between.
- A panel whose views share one title and one URL.

### Use something else when

- The views are different representations of one dataset. → Use a Segmented control
- It is a sequence of steps. → Use a stepper (none in the system yet); do not fake one with tabs
- It is one form split up. → Keep it one form on one page
- There are more than eight. → Rethink the page; a Navigation section may be what you need

## Understand

### Behaviour (built in)

- **Exactly one selected, always.** The first tab on load unless the URL says otherwise. Never nothing.
- **Instant and lossless.** 150ms ease-out on the label and rule; the panel swaps with no slide or fade. Switching never discards input.
- **The tab lives in the URL.** A view can be linked to and survives a refresh.
- **Past the width, the strip scrolls.** No visible scrollbar, no wrap, no dropdown. The selected tab is scrolled into view on load.
- **Keyboard.** Tab lands on the selected tab; Left and Right move and select; Home and End jump; Tab again goes to the panel.
- **Hover is a pointer cue only.** The label darkens and a faint rule appears; nothing is announced.

### Guidelines (your choices)

- **One or two words, no verbs.** “Sensors”, not “View sensors”.
- **Order by use, most used first.** The first tab is the default.
- **A Badge for a count, a dot for “changed”.** Never the Error badge in a tab.
- **Keep the panel height steady.** So the strip does not jump between tabs.
- **Disable a tab only with a reason nearby.** A view that exists but cannot open needs an explanation, not a grey tab.

### Do not

- Use tabs for steps.
- Split one form across tabs.
- Wrap to a second row.
- Use tabs and a segmented control for the same job on one screen.
- Put more than eight in.

## Building it

### Anatomy

- **Tab item**: A <button role="tab"> . Body/sm 14, padding 12 / 8 ( tabs/tab-item/padding-y, padding-x ), 34 tall.
- **Strip**: Tabs in a row with an 8px gap ( tabs/gap ) and a 1px track line underneath ( tabs/border ).
- **Indicator**: A 1px rule under the selected tab ( tabs/tab-item/border-selected , indicator-width ), sitting on the track line.
- **Hover rule**: 1px tabs/tab-item/border-hover while the pointer is over an unselected tab.
- **Focus**: 2px border in tabs/tab-item/border-focus , radius 4, around the whole tab.
- **Badge or dot**: Optional, after the label. A Badge for a count; a 6px dot for “changed”.

### States

| State | Light | Dark |
|---|---|---|
| Default | #565147, no rule | #9B958A, no rule |
| Hover | #171614, 1px rule #DFDEDD | #FFFFFF, 1px rule #2F2D28 |
| Selected | #171614, 1px rule #171614 | #FFFFFF, 1px rule #D0CEC8 |
| Focus | #171614, 2px border #171614, radius 4 | #FFFFFF, 2px border #D0CEC8 |
| Disabled | #7F796C, not focusable | #B6B1A5, not focusable |

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Tab item | padding-y, padding-x; Body/sm 14 / 1.3 | 12, 8; 34 tall | Same |
| Gap | tabs/gap | 8 | 8 |
| Track line | tabs/border, 1px | #DFDEDD | #2F2D28 |
| Text | text-default / hover / selected / focus / disabled | #565147 / #171614 / #171614 / #171614 / #7F796C | #9B958A / #FFFFFF / #FFFFFF / #FFFFFF / #B6B1A5 |
| Rules | border-hover; border-selected (indicator-width 1) | #DFDEDD; #171614 | #2F2D28; #D0CEC8 |
| Focus | border-focus, focus-border-width 2, radius-focus 4 | #171614 | #D0CEC8 |
| Count | items | 2 to 8 | Same |
| Motion | tabs/duration, easing | 150ms ease-out | Same |

### Accessibility

- role="tablist" with an aria-label ; each tab role="tab" with aria-selected and aria-controls ; each panel role="tabpanel" with aria-labelledby .
- Roving tabindex: only the selected tab is in the tab order; arrows move focus and selection together (automatic activation).
- Selected has two cues, the darker label and the rule, so it never relies on colour alone. The hover rule (1.2:1 light, 1.3:1 dark) is a pointer cue, never the accessible one.
- Focus is the 2px border: 18:1 light, 11.5:1 dark.
- A disabled tab is aria-disabled , stays readable, and the reason is nearby.

### Known gaps

- None open.
