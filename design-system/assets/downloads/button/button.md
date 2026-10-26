# Button

The action component. Six variants for six levels of emphasis, four sizes, icons before or after, and the states the rest of the system reuses.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Button 30033:78562, Icon Only Button 63853:2232. Light and dark.

## Learn

### When to use

- An action on this screen: save, send, add, export, delete.
- The one action that completes the task, as Primary.
- Quiet actions in toolbars, tables and cards, as Link.

### Use something else when

- It takes the reader somewhere. → Use a Link, or an anchor styled as a button
- It switches between views. → Use a Segmented control or Tabs
- It turns a setting on or off. → Use a Toggle
- It opens a list of actions. → Use the Dropdown button

## Understand

### Behaviour (built in)

- **Hover moves the fill one step and adds a 1px outer stroke.** The change fades in 150ms, easing out.
- **Focus adds two 2px rings, keyboard only.** The fill does not change and the rings snap on with no transition.
- **Pressed moves the fill two steps while held.** The label may invert to stay readable.
- **Loading replaces the label with a spinner.** The width holds, so the button does not jump. Every variant supports it.
- **Disabled uses the native attribute.** The fill and label grey out; it cannot be focused or clicked.
- **In dark, Primary, Accent and Destructive secondary hover and press as an opacity of their colour.** They blend with the surface below, as Figma does.

### Guidelines (your choices)

- **Use one Primary per view.** If two actions feel primary, one of them is Secondary. If nothing completes the task, there is no Primary.
- **Write labels as verbs.** “Add a truck”, “Export”. Two to three words, sentence case, no trailing punctuation. Never “OK” or “Submit” alone.
- **Put Destructive behind a confirm.** Open a Modal with the Destructive button next to a Link Cancel. Destructive secondary may act at once when the step can be undone.
- **Order a row: Primary right, Secondary or Link to its left, Destructive far left.** On mobile, stack Primary on top.
- **Use Large on desktop and XLarge on mobile.** XLarge clears a 44px target. Use Small only where a 16px icon looks heavy in a dense row.
- **Disable only when the reason is on screen.** Otherwise show the reason as help text, or validate on click.
- **Give icon-only buttons a name.** A Tooltip on hover and an aria-label. Universal glyphs (close, add, search) may skip the tooltip.

#### Which variant

| Variant | Use it for | Light | Dark |
|---|---|---|---|
| Primary | The one action that completes the task on this screen. One per view. | #0975C3 fill, white label | #E3F200 fill, ink label |
| Accent | A highlighted but not final action: Apply filter, Add another. Sits below Primary. | #C5E4FB fill, ink label | #FEFFD6 fill, ink label |
| Secondary | The alternative next to a Primary: Save draft, Preview, Back. | #F0EEEA fill, 2px #D0CEC8 border, ink label | #000000 fill, 2px #7F796C border, white label |
| Link | Low-emphasis actions in toolbars, tables and cards; the unselected segment of a segmented control. No border. To navigate from inside a sentence, use the Link instead. | #F0EEEA fill, ink label | #000000 fill, white label |
| Destructive | The rare, final, cannot-be-undone action: delete the ticket, remove the truck. Loud on purpose, and always behind a confirm. | #D70100 fill, 1px #B00100 border, white label | #EFADAC fill, 1px #FFD0D0 border, ink label |
| Destructive secondary | A destructive step that is a normal part of a workflow: remove a line, discard a draft, clear a filter set. Red, so nobody mistakes it, but outlined so it does not shout. | #F0EEEA fill, 2px #B00100 border and label | #393632 fill, 2px #EFADAC border and label |

### Do not

- Put two Primary buttons side by side.
- Use Destructive for Cancel or Close; those are Link.
- Use Accent as a second Primary.
- Change the label while it is loading.
- Restyle a button locally. If a state is wrong, fix the token.

## Building it

### Anatomy

- **Container**: A pill, filled by the variant.
- **Label**: The verb.
- **Prefix and suffix icon**: Optional. Either, both or neither.
- **Border**: Secondary, Destructive and Destructive secondary only.
- **Hover stroke**: A thin ring on hover.
- **Focus rings**: Inner and outer, keyboard only.
- **Spinner**: Replaces the content while loading.

### Sizes

| Size | Height | Padding (top-bottom / sides) | Icon | Use it for |
|---|---|---|---|---|
| xlarge | 52 | 18 / 16 | 16 | Hero sections, mobile action bars, anything that must clear a 44px target |
| large | 40 | 12 / 16 | 16 | Default. Most desktop use |
| medium | 32 | 8 / 12 | 16 | Compact layouts, toolbars, table rows |
| small | 32 | 4 / 12 | 12 | Inline actions in tight spaces. Same height as Medium; the difference is the 12px icon and the tighter vertical padding |

### Icon-only button

- Standard: circle behind the glyph, invisible at rest.
- Bordered: filled circle with a 2px border filling the box; lines up with text buttons. No XSmall.

| Size | Box | Circle | Icon | Note |
|---|---|---|---|---|
| XSmall | 18 | 18 | 12 | Standard only. No size tokens bound yet. |
| Small | 24 | 18 | 12 |  |
| Medium | 32 | 26 | 16 |  |
| Large | 40 | 34 | 20 |  |
| XLarge | 52 | 46 | 24 |  |

### States

| State | What changes |
|---|---|
| Hover | The fill moves one step and a 1px stroke in hover-outer-stroke appears. Primary darkens on hover in light (#0975C3 &rarr; #0B7ACA). In dark, Primary and Accent hover at 80% opacity of their fill. |
| Focus | Two rings: 2px inner in focus-inner-stroke, 2px outer in focus-outer-stroke. The fill does not change. Keyboard only — never on pointer click. |
| Pressed Active in Figma | While the pointer or key is held down. The fill moves two steps and the label may invert. Light: Secondary, Link and Destructive secondary go dark with a light label; Primary deepens; Accent becomes Primary blue. Dark: Secondary and Link go to a light grey with an ink label; Destructive goes full red with a white label. |
| Disabled | Fill #D0CEC8 light / #45413A dark with a #7F796C label on every variant except Destructive, which keeps a pink #FFD0D0 fill in light. Borders drop to #7F796C. |
| Loading | Label and icons hide, a spinner in the spinner colour takes the centre, the width holds. Every variant supports it. |

### Specs

| Part | Property | Token | Light | Dark |
|---|---|---|---|---|
| Container | Radius | radius/pill | 100 | same |
| Container | Height | button/{size}/max-height | 52, 40, 32, 32 | same |
| Container | Padding (top-bottom / sides) | button/{size}/padding-* | 18/16, 12/16, 8/12, 4/12; label +1px each side | same |
| Label | Type | Body/sm Medium | ABC Repro Medium 14, line 1.3, every size | same |
| Icon | Size, gap | Icon Small / XSmall, button/{size}/gap | 16 (12 at Small), 4 | same |
| Border | Width | button/{variant}/inner-border-width | 2 Secondary and Destructive secondary; 1 Destructive | same |
| Hover stroke | Width, colour | button/{variant}/hover-outer-stroke | 1px, #7F796C | 1px, #D0CEC8 |
| Focus rings | Width | border/focus | 2px inner + 2px outer | same |
| Spinner | Size | spinner/medium, spinner/small | 24 (16 at Small), 1s per turn | same |
| Motion | Colour change | button/duration, button/easing | 150ms, ease-out; focus snaps | same |

#### Primary tokens

| Token | Light | Dark |
|---|---|---|
| Fill | #0975C3 | #E3F200 |
| Label | #FFFFFF | #171614 |
| Hover fill | #0B7ACA | #B6C200 (CC alpha) |
| Pressed fill | #0D598F | #D7E600 (F2 alpha) |
| Pressed label | #FFFFFF | #171614 |
| Focus inner | #FFFFFF | #FFFFFF |
| Focus outer | #171614 | #9B958A |
| Disabled fill | #D0CEC8 | #45413A |
| Disabled label | #7F796C | #7F796C |
| Spinner | #FFFFFF | #171614 |

#### Accent tokens

| Token | Light | Dark |
|---|---|---|
| Fill | #C5E4FB | #FEFFD6 |
| Label | #171614 | #171614 |
| Hover fill | #EEF9FF | #CBCCAB (CC alpha) |
| Pressed fill | #0975C3 | #E4E5C0 (E5 alpha) |
| Pressed label | #FFFFFF | #171614 |
| Focus inner | #FFFFFF | #6B7138 |
| Focus outer | #171614 | #9B958A |
| Disabled fill | #D0CEC8 | #45413A |
| Disabled label | #7F796C | #7F796C |
| Spinner | #171614 | #171614 |

#### Secondary tokens

| Token | Light | Dark |
|---|---|---|
| Fill | #F0EEEA | #000000 |
| Label | #171614 | #FFFFFF |
| Hover fill | #DFDEDD | #666054 |
| Pressed fill | #211F1C | #9B958A |
| Pressed label | #F6F4F2 | #171614 |
| Border | #D0CEC8 | #7F796C |
| Focus inner | #565147 | #DFDEDD |
| Focus outer | #2F2D28 | #9B958A |
| Disabled fill | #D0CEC8 | #45413A |
| Disabled label | #7F796C | #7F796C |
| Disabled border | #7F796C | #393632 |
| Spinner | #171614 | #FFFFFF |

#### Link tokens

| Token | Light | Dark |
|---|---|---|
| Fill | #F0EEEA | #000000 |
| Label | #171614 | #FFFFFF |
| Hover fill | #DFDEDD | #666054 |
| Pressed fill | #211F1C | #9B958A |
| Pressed label | #F6F4F2 | #171614 |
| Focus inner | - | #DFDEDD |
| Focus outer | - | #9B958A |
| Disabled fill | #D0CEC8 | #45413A |
| Disabled label | #7F796C | #7F796C |
| Spinner | #171614 | #FFFFFF |

#### Destructive tokens

| Token | Light | Dark |
|---|---|---|
| Fill | #D70100 | #EFADAC |
| Label | #FFFFFF | #171614 |
| Hover fill | #B00100 | #FFD0D0 |
| Pressed fill | #850100 | #D70100 |
| Pressed label | #F6F4F2 | #FFFFFF |
| Border | #B00100 | #FFD0D0 |
| Focus inner | #F6F4F2 | #FFFFFF |
| Focus outer | #850100 | #D70100 |
| Disabled fill | #FFD0D0 | #45413A |
| Disabled label | #7F796C | #7F796C |
| Disabled border | #EFADAC | #7F796C |
| Spinner | #FFFFFF | #171614 |

#### Destructive secondary tokens

| Token | Light | Dark |
|---|---|---|
| Fill | #F0EEEA | #393632 |
| Label | #B00100 | #EFADAC |
| Hover fill | #FFD0D0 | #360000 (40 alpha) |
| Pressed fill | #850100 | #560000 (66 alpha) |
| Pressed label | #FFFFFF | #FFFFFF |
| Border | #B00100 | #EFADAC |
| Focus inner | #D70100 | #EFADAC |
| Focus outer | #850100 | #D70100 |
| Disabled fill | #D0CEC8 | #45413A |
| Disabled label | #7F796C | #7F796C |
| Disabled border | #EFADAC | #7F796C |
| Spinner | #B00100 | #EFADAC |

### Accessibility

- It is a real <button>. Loading sets aria-busy and keeps the width.
- Focus shows two rings on :focus-visible only (WCAG 2.4.7).
- Every label passes AA in both themes, at rest, on hover and when pressed.
- Disabled is exempt from the contrast minimum (WCAG 1.4.3). Its label reads faint, so say why it is disabled.
- An icon-only button needs an aria-label.

### Code

Template and styles: button.html and button.css in the same folder. Angular API: not yet written; to be agreed with the development team.

### Known gaps

- None open.
- Note. Recommended: give Secondary a clearer edge: On Page Content (white) the light Secondary fill #F0EEEA is 1.16:1 and its border #D0CEC8 is 1.57:1, so next to a Primary it can read as plain text. Not a failure: WCAG does not require a button boundary. A border of at least #8F8A80 (3:1) would make it read as a button.
