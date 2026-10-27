# Notification

One family for every message the system sends: a Toast that floats and leaves, a Banner that stays in the page, and an Inline note beside a field. Four statuses.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Notification 63891:45043 (Pattern x Status, showButton). Light and dark.

## Learn

### When to use

- Toast : the result of something the person just did. “Ticket saved”.
- Banner : something true about this page, section or workflow until it is fixed. “Storage almost full”.
- Inline : something about one field or block, right beside it. “Slump out of range”.

### Use something else when

- It is a site-wide announcement or outage. → Use the Banner (website banner) at the top of the page
- It needs a decision before anything else. → Use a Modal
- It explains what a field needs. → Use Helper text
- It is a status on an object. → Use a Badge or Tag

### Which can have buttons

| Pattern | Dismiss (X) | Action | Why |
|---|---|---|---|
| Toast | Always | Optional, one, Secondary | Floats over the page; the action is a shortcut |
| Banner | Optional | Optional, one, Secondary | Stays until resolved; no X if dismissing hides something to fix |
| Inline | Never | Never | Leaves when the input is fixed |

## Understand

### Behaviour (built in)

- **Pick the pattern by what it is about.** Something the person did: Toast. Something true about the page: Banner. Something about one field: Inline.
- **Toasts leave on their own.** 5 seconds, 8 with an action. Error never leaves on its own. Hover or focus pauses the clock.
- **Toasts stack bottom right.** Newest at the bottom, three at most; a fourth pushes the oldest out.
- **A Banner stays until its condition is resolved.** It fills the width of the section it belongs to, in the page flow, with no shadow. One per section; the more severe one shows.
- **Inline comes and goes with the input.** It appears when the input is wrong or needs help and leaves when it is right. It never has an X.
- **Motion.** Enters over 300ms ease-out and leaves with ease-in. With reduced motion it fades only.

### Guidelines (your choices)

- **Say what happened, then what to do.** Title in five words or fewer, body in one sentence.
- **Use Error only when something failed.** A warning is something that will fail if ignored.
- **Keep the action Secondary.** One action at most. A notification should not compete with the page’s main button.
- **Put a Banner at the top of what it is about.** Not the top of the window.
- **Write for a global reader.** Plain words; the user’s own time zone and units.

### Do not

- Put anything in a Toast that the person must remember.
- Use a notification Banner as a sticky bar across the whole window.
- Show a Toast and a Banner for the same event.
- Colour the surface by status. The border and icon carry it.
- Give Inline an X or a button.

## Building it

### Anatomy

- **Container**: notification/surface, 1px status border, padding 16 (Inline 12). Radius 16 for Toast, 8 for Banner and Inline. Toast adds the shadow.
- **Status icon**: 24px, in the status colour: fi-info, fi-check, fi-alert-triangle, fi-alert-octagon.
- **Title and body**: Heading/sm 16 and Body/sm 14 (Inline title Body/sm Medium). Body in notification/text/body.
- **Dismiss**: 32 x 32 Icon Only Button, top right. Toast always; Banner optional; Inline never.
- **Action**: One Secondary medium Button under the text (showButton). Toast and Banner only.

### States

- **Entering** (It is shown): Fades and slides in over 300ms
- **Shown** (On screen): Toast counts down unless hovered or focused
- **Leaving** (X, timeout, or the condition is fixed): Fades out with ease-in; focus moves back to where it was

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Surface | notification/surface/* | #F6F4F2 | #171614 |
| Title | notification/text/title | #171614 | #FFFFFF |
| Body | notification/text/body | #565147 | #B6B1A5 |
| Info | notification/status/info, border/info | #0D598F | #41A8F2 |
| Success | status/success, border/success | #15322F | #2ECF1D |
| Warning | status/warning, border/warning | #D85A00 | #FFBA0D |
| Error | status/error, border/error | #D70100 | #EFADAC |
| Toast | pattern/toast/width, padding, radius | 418, 16, 16 | 418, 16, 16 |
| Banner | fill; padding, radius; min width | 100%, 16, 8, 420 | Same |
| Inline | pattern/inline/padding, gap, radius | 12, 12, 8 | 12, 12, 8 |
| Shadow (Toast) | notification/shadow/color, 0 5 8 | #4A4F55 at 12% | #FFFFFF at 24% |
| Motion | notification/duration, enter / exit | 300ms, ease-out / ease-in | Same |

### Accessibility

- Toast: role="status" (polite), or role="alert" for Error. Focus stays where it is; the X is reachable by Tab.
- Banner: role="status" with a heading; Error banners use role="alert" .
- Inline: linked to its field with aria-describedby ; the field gets aria-invalid for Error.
- Status is shown by icon and words as well as colour.
- The X is a 32 x 32 button named “Dismiss”. Timed toasts pause on hover and focus so they can be read.

### Known gaps

- None open.
