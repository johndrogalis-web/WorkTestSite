# Checkbox

An independent yes or no. Several can be true at once, and the change applies when the form is saved, not the moment it is clicked.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Checkbox 30515:78521, input 30515:78570. Light and dark.

## Learn

### When to use

- Choosing any number of options from a list, including none.
- One opt-in that is saved with a form, such as accepting terms.
- Selecting rows in a table for a bulk action.

### Use something else when

- Flipping it changes the system at once, with nothing to press afterwards. → Use a Toggle
- Exactly one option may be true. → Use a Radio group
- It filters a list or a map the moment it is pressed. → Use a Chip
- More than about seven options with no grouping. → Group them, or use a filtered list

## Understand

### Behaviour (built in)

- **It waits.** Clicking stages a change that Save, Apply or Done commits. Until then it may be wrong, reversed or left alone.
- **Two states, plus a readout.** Unchecked and checked are choices. Indeterminate is shown by a parent whose children are partly checked; a click never produces it.
- **From indeterminate, a click checks all.** It never unchecks and never cycles back to the dash.
- **The label is part of the target.** Click the words or the box; the 24 × 24 touchpoint is the minimum, not the whole target.
- **Disabled keeps its value.** A disabled checked box still shows its tick, in a lighter grey, on a solid grey box with no border.
- **Motion is short.** Fill and ring change over 150ms ease-out (checkbox/duration, checkbox/easing). Focus snaps. With reduced motion, nothing animates.

### Guidelines (your choices)

- **Write the label as the positive statement.** What is true when it is ticked. “Show returned concrete”, never “Do not show…”.
- **Put the count on a parent.** “All plants (3 of 7)”. The dash says partial; only the number says how partial.
- **Keep groups vertical, one per line.** A horizontal row makes the eye find the box again after every label.
- **Give every group a legend that asks the question.** Even when a heading next to it seems to say the same.
- **Default to unchecked.** Unless checked is both the common choice and the safe one. Never pre-check consent.

### Do not

- Write a negative label. An unticked “Do not show” is a double negative.
- Use a checkbox for something that takes effect at once. That is a Toggle.
- Let a click set a box to indeterminate.
- Disable a checkbox without saying why somewhere the user can see.
- Turn the boxes red for a group error. The message belongs to the group.

### Parent checkboxes

Children Parent shows Clicking the parent None checked Unchecked Checks all children Some checked Indeterminate Checks all children All checked Checked Unchecks all children

From indeterminate, a click always checks all. It never unchecks, and it never cycles back to the partial state. Users reach for a parent checkbox to finish selecting, not to undo a selection they are halfway through — and undo is one more click away in either direction. A parent that cycled through all three states would make a two-item list take three clicks to clear. Only a parent of a visible set may be indeterminate. A standalone checkbox has two states. The parent reflects its children the instant they change. It is never stale. Put the count in the label — All plants (3 of 7) . The dash says partial ; only the number says how partial. Nesting stops at one level here. A parent of parents is a tree, and a tree needs disclosure, not checkboxes.

### Select all in a long table

The header checkbox in a long table is the one place this component routinely lies. “All” means the rows a person can see; the database means every row that matches. On a fleet list that is the difference between forty trucks and four thousand. The header checkbox selects the loaded rows only , and it reflects those rows only. This is the default and it needs no explanation. When the filter matches more than is loaded, offer the wider selection as an explicit second step, in words: 40 selected. Select all 4,182 matching? Never make the header checkbox silently mean the larger set. Say what is selected, always, near the action that will act on it. A count is the cheapest protection against a destructive mistake. Changing a filter clears the selection. Carrying a selection across a filter change is how people delete rows they never saw. Selection survives sorting and pagination within the same filter. Sorting does not change which rows matched. Try it Six loaded rows standing in for 4,182 matching ones. Tick the header. Tick one row, then shift-click another four down. Then change the filter. Light Truck Plant Phase 4417 Rockdale Loaded 4418 Rockdale In transit 4419 Midwest Pouring 4420 Midwest Washing out 4421 Northgate Returning 4422 Northgate At plant Change the filter Dark Truck Plant Phase 4417 Rockdale Loaded 4418 Rockdale In transit 4419 Midwest Pouring 4420 Midwest Washing out 4421 Northgate Returning 4422 Northgate At plant Change the filter The header never means more than the rows you can see. The wider selection has to be asked for, in words. Shift-click selects a range. Click one row, shift-click another, and everything between them takes the state of the row you clicked first. It is unadvertised and everyone who needs it already tries it. It must never be the only way to do something. Handle the range on the row, not on the checkbox. When Shift is held, the browser suppresses a <label> ’s activation behaviour entirely — it reads the gesture as a text-range selection, so the <input> never receives a click and never toggles. A listener on the input alone does nothing at all, silently. Bind the handler to the row, read shiftKey there, call preventDefault() and set the range yourself. The demo above does exactly this; it did not work until it did.

### Required groups and errors

“Pick at least one” is a property of the group, not of any box in it, so the error belongs to the group too. Trinity has no error variant for the checkbox, and it does not need one: nothing about the individual box changes. The message sits under the group, once, tied to the <fieldset> with aria-describedby . Not once per checkbox. No box turns red. Reddening six boxes to say “one of these is required” tells the user nothing about which one, because the answer is none of them. Validate on submit, not on blur. A group cannot be judged until the user has finished with all of it. A single required checkbox — accepting terms — is the exception: the message sits under that one box, and the box may carry the --error border.

### Disabled, read-only or absent

Three different situations that all get solved with disabled by reflex, and only one of them should be. Situation Use Why The user could change this, but not yet — something else has to happen first Disabled , with the reason in text nearby Disabled with no explanation is the single most common complaint about any form. The state is honest; the silence is not. The value matters but this user may never change it Read-only — render the value as text, not as a dead control A checkbox the user cannot ever operate is a control that lies about being a control. The option does not apply to this user at all Leave it out A permanently greyed row is visual debt on every screen after it. Disabled does not mean unreadable. The value stays visible — a disabled checked box still shows its tick. Hiding the value because the control is inert loses the information as well as the control.

### When the save fails

The checkbox commits with the form, so it has no loading state and does not need one. What it does need is a rule for the moment the form comes back. On failure the boxes keep what the user set. Never silently revert — the user has to be able to press Save again without re-answering. The failure is announced once, at the form level, in a toast or an inline message. Not on the checkbox. If one box in a batch failed and the rest went through, say which. A partial failure reported as a total failure makes people redo work that already succeeded.

### Touch

The 24 × 24 touchpoint is the AA minimum, not a comfortable target. Stacked checkboxes get 10px between them, which puts 34px between centres. The whole label is part of the target. That is what makes a 16px box usable on a phone, so never render the label outside the <label> . Two adjacent targets must not touch. Where a checkbox sits beside another control in a dense table row, give it its own cell.

## Building it

### Anatomy

Touchpoint 24 × 24 — the outer frame, and the only thing the pointer or the finger has to hit Box 16 × 16 , 1px border, 2px radius Tick Feather fi-check at 12 × 12 , centred, 1.5px stroke, round caps Dash Feather fi-minus at 12 × 12 , centred, 1.5px stroke Gap to label 4px from the touchpoint edge — 8px of visible air beside the box Label 14px , the defined ink Group spacing 10px between options

### States

State What changes Token Unchecked White box, 1px border. checkbox/input-default-fill Checked Box fills solid, tick on top in the opposite colour. checkbox/input-selected-fill Indeterminate The same solid fill as checked, with the 8 × 1 dash instead of the tick. For a parent whose children are partly selected. It is a display state, never something a click produces. checkbox/input-selected-fill Hover A 2px ring appears outside the box. The border itself does not change. checkbox/hover-stroke Focus Two things at once: a 2px ring outside, and the box’s own 1px border drops to a light grey. checkbox/focus-outer-stroke checkbox/focus-inner-stroke Disabled Solid grey fill and no border at all . The tick or dash stays, in a lighter grey. Not an opacity. checkbox/input-fill-disabled checkbox/icon-color-disabled checkbox/label-disabled

### Specs

| Token | Light | Dark |
|---|---|---|
| checkbox/width · checkbox/height | 24 | 24 |
| checkbox/padding | 4 | 4 |
| checkbox/gap | 4 | 4 |
| checkbox/radius | 2 | 2 |
| checkbox/input-stroke | #171614 | #FFFFFF |
| checkbox/input-default-fill | #FFFFFF | #211F1C |
| checkbox/input-selected-fill | #211F1C | #FFFFFF |
| checkbox/icon-color | #FFFFFF | #211F1C |
| checkbox/hover-stroke | #D0CEC8 | #B6B1A5 |
| checkbox/focus-outer-stroke | #171614 | #FFFFFF |
| checkbox/focus-inner-stroke | #D0CEC8 | #B6B1A5 |
| checkbox/input-fill-disabled | #B6B1A5 | #B6B1A5 |
| checkbox/icon-color-disabled | #DFDEDD | #D0CEC8 |
| checkbox/label-default | #171614 | #FFFFFF |
| checkbox/label-disabled | #B6B1A5 | #B6B1A5 |
| checkbox/duration · checkbox/easing | 150ms ease-out | 150ms ease-out |

Touchpoint 24 × 24 Box 16 × 16 Radius 2px Border 1px checkbox/input-stroke Checked fill checkbox/input-selected-fill — light #211F1C , dark #FFFFFF Tick Feather fi-check (Icons page, 56109:2744) as an instance at 12 × 12 , 2px in from each edge of the box, 1.5px stroke, round cap and join, colour checkbox/icon-color . In CSS: M12 5 6.5 10.5 4 8 in a 16px box. Replaced the hand-drawn 6 × 4 tick in October 2026, which was too small to read. Dash Feather fi-minus (56109:2875) at 12 × 12 , 1.5px stroke: M4.5 8h7 in a 16px box Hover ring 2px outside, no offset Focus ring 2px outside, no offset, plus the inner border Gap 4px from the touchpoint — 8px clear of the box Label ABC Repro Regular 14 / 130% Variant properties state ( default · hover · focus ), value , indeterminate , disabled — all lowercase, booleans true / false . The public and private sets use the same four.

### Accessibility

Use a real <input type="checkbox"> inside a <label> . Do not rebuild it from divs. Everything below comes free if you do, and has to be hand-built and maintained if you do not. Set indeterminate in JavaScript — it is a property, not an attribute, and it cannot be expressed in HTML alone. It also does not change checked , so send the parent’s real value, not the dash, to the server. A native indeterminate checkbox already reports aria-checked="mixed" . Do not also set the attribute by hand — the two can disagree. Group related checkboxes in a <fieldset> with a <legend> . That is what makes a screen reader announce “Plants, 3 of 7” instead of six unrelated checkboxes. Space is the activation key. Enter must not submit from a focused checkbox. The visible label is the accessible name. Do not add a different aria-label — speech users say what they see. A group error is tied to the <fieldset> with aria-describedby and announced once, in a live region. Six identical errors is six interruptions. Shift-click range selection needs a keyboard equivalent. Shift plus arrow, or nothing — never a mouse-only path to a bulk action. In a table, the header checkbox needs its own accessible name ( Select all rows ). An unlabelled checkbox in a <th> reads as nothing at all.

### Code

Template and styles: checkbox.html and checkbox.css in the same folder. Angular API: not yet written; to be agreed with the development team.

### Known gaps

- None open.
