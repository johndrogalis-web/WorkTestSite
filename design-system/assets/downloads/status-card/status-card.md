# Status Card

A Card for one piece of hardware. It shows the device’s health in a strip along the bottom, so a row of them reads at a glance.

Status: Has gaps. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Status Card 63716:15725. Built on Card 63493:8711. Light and dark.

Built on Card: Same shell, states and card/* tokens as the Card . This page covers only what is different: the Status property and the strip.

## Learn

### When to use

- One device, sensor or piece of hardware on a truck, with its health.
- A set of devices people scan to find the one that needs attention.

### Use something else when

- People pick a truck, ticket or order. → Use a Card
- The status sits in a table row or a list. → Use a Badge or a Chip
- The problem affects the whole page or account. → Use a Notification
- It shows a value changing over time. → Use a dashboard widget

Seen in Trinity: Truck drawer › Component condition: one Status Card per device (TCG, DRM, WDS, GPS and the rest). Not installed opens the install flow; Pending asks the user to reset errors to confirm.

## Understand

### Behaviour (built in)

- **Status drives the strip and nothing else.** Switch the Status variant; the shell keeps its own states.
- **The strip is full width and 31px tall.** It sits at the bottom, under a 1px border, and the card hugs the content above it.
- **Warning, Alarm and Pending carry a dot.** Normal and Not installed do not.
- **The strip looks the same in both themes.** Status colours do not change with the theme, so a strip reads the same on a light or dark page.
- **The shell states come from Card.** Hover, Selected and Focus, with the same tokens. There is no Focus + Selected and no Compact view.
- **Motion is short.** Hover and selection ease in over 200ms. Focus snaps. With reduced motion, nothing animates.

### Guidelines (your choices)

- **Say what is wrong.** Override the strip text with the condition: “Alarm · No signal”, “Warning · Calibration due”. Keep the status word first.
- **Keep it to one line.** About 30 characters. Detail goes in the drawer.
- **Put the worst first.** In a set, order Alarm, Warning, Pending, Normal, Not installed, so the eye lands on the problem.
- **Use the Device header and the device-detail content.** The header names the device; the content gives the value and the error count.
- **Use Not installed only for absent hardware.** A fitted device that stopped reporting is an Alarm.

### Do not

- Recolour the strip by hand. Switch the Status variant.
- Let the status colour the whole card.
- Remove the Alarm dot.
- Use a Status Card for anything that is not hardware.
- Hide the status text and leave only the colour.

## Building it

### Anatomy

- **Shell**: The Card shell: surface, border, 8px radius, states. 10px padding.
- **Content slot**: The Device header and device-detail content, set to Hug.
- **Strip**: Full width, 31px, at the bottom. Holds an optional dot and one line of text.

### Status

| Status | Strip | Text | Dot | Default text | Means |
|---|---|---|---|---|---|
| Normal | status/success/100 #D5F1D2 | status/success/900 #15322F | None | Operating normally | Connected and working |
| Warning | status/warning/500 #FFBA0D | status/warning/900 #4F3C08 | status/warning/100 #FFEFA9 | Warning · out of range | Working, but degraded: weak signal, latency, calibration due |
| Alarm | status/error/100 #FFD0D0 | status/error/900 #392222 | status/error/500 #D70100 | Alarm · sensor fault | Not working: hardware fault, lost telemetry |
| Pending | status/warning/100 #FFEFA9 | status/warning/900 #4F3C08 | status/warning/500 #FFBA0D | Pending verification | Just installed or replaced; waits for someone to confirm it |
| Not installed | neutral/100 #DFDEDD | neutral/700 #45413A | None | Not installed | Optional hardware that is not fitted |

### States

- **Default** (At rest): card/border-default; default shadow
- **Hover** (Pointer over it): Border card/border-hover; hover shadow
- **Selected** (After a click or Space): 2px card/border-selected; surface card/background-selected
- **Focus** (Keyboard focus only): Border card/border-focus; focus ring card/focus/ring-color

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Shell | card/* (see Card specs ) | As Card | As Card |
| Padding | raw; Card has card/padding-mobile | 10, bottom 36 | 10, bottom 36 |
| Strip height | raw | 31 | 31 |
| Strip padding, gap | raw | 20 / 10, gap 8 | 20 / 10, gap 8 |
| Strip top border | card/border-default, 1px | #DFDEDD | #393632 |
| Strip text | Body/sm Medium, 14 | — | — |
| Dot | 8px circle | — | — |

### Accessibility

- The status is in words on the strip, so colour is not the only cue (WCAG 1.4.1).
- The strip is role="status" , so a change from Normal to Alarm is announced.
- A selectable set is a role="radiogroup" : arrow keys move, Space selects. Focus shows on the card itself.
- The dot is extra. On Warning and Pending it measures 1.48:1 and does not need to pass, because the text names the status.

### Code

Template and styles: status-card.html, card.css and status-card.css in the same folder. Angular API: not yet written; to be agreed with the development team.

### Known gaps

- **Hover glow and focus ring are not on tokens.** The default shadow now uses card/shadow/default , the same as Card and Widget Shell. Hover and Focus are still raw: Hover glows #00A1E0 under a #1594EF border (Card: card/shadow/hover , #1594EF), and the focus ring stays #0C79A8 in dark (Card: card/focus/ring-color , #41A8F2). This page uses the Card tokens.
- **The guide and the component disagree on Pending.** The guide frame says Pending is Teal/Blue. The component binds status/warning/100 with a status/warning/500 dot, and the prototype uses amber too. This page shows the component.
