# Toggle

A switch for a setting that takes effect now and can be flipped back. Two sizes, on or off, with a label that names the setting.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Toggle 35264:124887, Toggle Item 61014:46755. Light and dark.

## Learn

### When to use

- A setting that applies the moment it is flipped, with no Save.
- Turning a feature, a notification or a view option on or off.

### Use something else when

- The choice is saved with a form. → Use a Checkbox
- One of several values. → Use a Radio group or a Segmented control
- It starts a job or confirms something. → Use a Button
- The change cannot be undone. → Use a Button with a confirmation

## Understand

### Behaviour (built in)

- **Immediate.** Flipping it does the thing. If a change needs Save, it is a checkbox in a form.
- **Reversible.** Anything destructive gets a Button and a confirmation instead.
- **The label is part of the target.** Click the words or the switch; Space flips it from the keyboard. Arrow keys do nothing.
- **Failure snaps back.** If the change does not take, the switch returns and a Toast says why.
- **Hover is a grey ring, focus is an ink ring.** So a mouse user and a keyboard user see different things.
- **Motion is 200ms ease-in-out.** The switch slides and the track colour crosses together (toggle/duration, toggle/easing). With reduced motion it jumps (toggle/reduced/duration).

### Guidelines (your choices)

- **Name the setting, not the state.** “Live fleet updates”, never “Turn on live updates” or “Enabled”. The switch position is the state.
- **Say why it is disabled.** A reason next to it, “requires a sensor”, or a tooltip. Never a bare grey switch.
- **Default a new setting to Off.** Unless the person asked for it.
- **One setting per row.** Label left, switch right in a settings list. Never a grid of switches.
- **Use Small in tables and card headers.** Large everywhere else. Do not mix sizes in one list.

### Do not

- Use a toggle inside a form with a Submit.
- Write ON or OFF in or beside the track.
- Use it to start a job; that is a Button.
- Change the switch colour per setting.

## Building it

### Anatomy

- **Track**: Large 40 × 24, Small 24 × 16 in a 24px element, radius 100. Owns the on and off colour.
- **Switch**: Large 16px, Small 8px, inside 4px padding. Travels 16px large, 8px small.
- **Label (Toggle Item)**: Body/sm 14, 4px from the track, part of the hit area.
- **Hover ring**: 2px outside the track in toggle/hover-stroke.
- **Focus**: A 2px ink ring outside the track and a 2px stroke on its edge in toggle/focus-stroke (1px each on Small).

### States

- **Off** (At rest): Track toggle/track-fill-false, switch left
- **On** (After a click or Space): Track toggle/track-fill-true, switch slides right
- **Hover** (Pointer over the item): A 2px toggle/hover-stroke ring outside the track. New on 26 October.
- **Focus** (Keyboard focus only): 2px toggle/focus-outer-stroke ring outside, 2px toggle/focus-stroke on the track edge
- **Disabled** (Cannot be changed): Track toggle/track-fill-disabled, label toggle/label-disabled; the switch keeps its position

### Specs

| Token | Light | Dark |
|---|---|---|
| toggle/track-fill-true | #171614 | #FFFFFF |
| toggle/track-fill-false | #666054 | #DFDEDD |
| toggle/switch-fill | #FFFFFF | #211F1C |
| toggle/track-fill-disabled | #B6B1A5 | #B6B1A5 |
| toggle/hover-stroke | #B6B1A5 | #9B958A |
| toggle/focus-outer-stroke | #171614 | #FFFFFF |
| toggle/focus-stroke | #FFFFFF | #211F1C |
| toggle/label-default | #171614 | #FFFFFF |
| toggle/label-disabled | #B6B1A5 | #B6B1A5 |
| toggle/large/track width · height · padding | 40 · 24 · 4 | same |
| toggle/large/switch | 16 | same |
| toggle/small/track width · element height | 24 · 24 (track 16) | same |
| toggle/small/switch | 8 | same |
| toggle/duration · easing | 200ms ease-in-out | same |
| toggle/reduced/duration | 0 | same |

### Accessibility

- Use <input type="checkbox" role="switch"> , so it announces as “switch, on” or “off” and keeps native keyboard behaviour.
- The label text is the accessible name, through the wrapping <label> . Toggle Item exists so the name is never missing.
- On and off differ by position as well as colour; the switch moves (WCAG 1.4.1).
- Focus shows an ink ring and an edge stroke, different from the grey hover ring, in both themes.
- The whole Toggle Item is the target, 24px tall; settings rows pad it to 44px.

### Code

Template and styles: toggle.html and toggle.css in the same folder. Angular API: not yet written; to be agreed with the development team.

### Known gaps

- None open.
