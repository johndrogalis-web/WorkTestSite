# Card

A bordered container for one thing: a truck, a ticket or an order. The shell owns the states; what goes inside comes from a header and a content slot.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Card 63493:8711, guide 65926:18926. Light and dark.

## Learn

### When to use

- A set of trucks, tickets or orders that people scan, then pick one or several.
- An item that opens its own page when clicked.
- A short block of related, read-only details in a drawer or on a page.

### Use something else when

- People compare many items on the same columns, or sort them. → Use a Table
- It shows hardware or sensor health. → Use a Status Card
- It is a region of a dashboard with a title, tools and a footer. → Use the Widget Shell, see Dashboard and widgets
- It is one headline number. → Use a stat with no container, as the Diagnostic Center does
- It is a single line of text. → Use a list row

### Which card

Cards are for choosing, tables are for comparing. A card gives each item its own box, so people can scan a few at a glance and act on one. Every box also adds a border and padding, so the same data reads slower as cards once people need to line values up. This is why the Phases board uses cards and the truck list uses a table.

| You are showing | Use | Seen in Trinity |
|---|---|---|
| One choice from a short set of rich options | Card, Type = Input, Radio header | TCG replace flow, choosing an action |
| Several items picked from a set | Card, Type = Input, Checkbox header | Not in the prototype yet |
| One truck or ticket on a board; a click opens its details | Card with the Detail header | Tickets › Phases board; Fleet map list |
| An item that opens its own page | Card, Type = Navigational | Batch Assistant truck and load lists |
| Read-only details grouped in a drawer | Card, Type = Static | Ticket drawer sections |
| Device or sensor health | Status Card | Truck drawer › Component condition |
| A dashboard region with title, tools and footer | Widget Shell | Home, Dashboards |
| Many rows compared on the same columns | Table, not a card | All trucks, Units |
| A headline number | A stat, no container | Diagnostic Center summary row |

## Understand

### Behaviour (built in)

- **The whole card is the target.** On an Input card, a click anywhere toggles the radio or checkbox in the header. The control shows the state; it is not the only hit area.
- **Radio means one, Checkbox means many.** Selecting a card in a Radio set clears the others.
- **A Navigational card is a link.** No header, no selection; the whole card goes somewhere.
- **A Static card does nothing.** It shows no hover and takes no focus.
- **It grows with its content.** Height hugs; it is never fixed in a list.
- **Motion is short.** Hover and selection ease in over 200ms (card/duration, card/easing). Focus snaps. With reduced motion, nothing animates.

### Guidelines (your choices)

- **Choose by the job.** Pick from the table under When to use. If people compare values across items, it is a table.
- **One card, one thing.** One truck, one ticket, one order. Split anything bigger.
- **Lead with the identifier.** Truck or ticket number top left, status next to it, details below. People scan the first line, so it must name the item.
- **Keep it to what people need to decide.** Four or five facts at most. Everything else belongs in the drawer or the detail page.
- **Keep a set consistent.** One header type, one View and one width per list or column. Heights may differ.
- **Use Compact below 600px and in dense lists.** Same content, 10px padding, the compact content.

### Do not

- Mix Radio and Checkbox cards in one set.
- Put a Button or a link inside a Navigational card. A link inside a link cannot be reached.
- Put a card inside a card. Group inside a card with spacing or a divider.
- Use a card where people compare or sort values.
- Detach a Card to add rows. Drop content into the slot.
- Use a card for a single line of text.

## Building it

### Anatomy

- **Shell**: Surface, border, radius and shadow. Padding 20px, or 10px in Compact. It owns every state.
- **Input Card Header**: Input type only. Six variants swapped in: Radio, Checkbox, Ticket Status, Ticket Check, Detail, Device. The radio or checkbox sits on the right.
- **Content slot**: Any content. Four ready-made: detailed-truck, compact-truck, device-detail and truck-status. 10px below the header.

### Options

| Type | What it is | Use it for |
|---|---|---|
| Input | Has a header; can be selected | Picking trucks, tickets or orders |
| Navigational | No header; opens a page on click | Lists that lead to a detail page |
| Static | No header; not interactive | Read-only details |

| View | Padding | Use it for |
|---|---|---|
| Default | 20px | Desktop and tablet |
| Compact | 10px | Below 600px and dense lists |

| Header | Holds | Use it for |
|---|---|---|
| Radio | Badge and radio | Pick one |
| Checkbox | Badge and checkbox | Pick many |
| Ticket Status | Ticket, phase tag and radio | Pick one truck or ticket |
| Ticket Check | Ticket, phase tag and checkbox | Pick many trucks or tickets |
| Detail | Truck ID, chips, driver and time | Board cards with the full detail |
| Device | Status dot, device ID, version and tool | Hardware; use with Status Card |

### States

- **Default** (At rest): card/border-default, default shadow
- **Hover** (Pointer over it; Input and Navigational only): Border card/border-hover; shadow 0 4px 12px in the same blue
- **Selected** (Input only, after a click or Space): 2px card/border-selected; surface card/background-selected; the header control turns on. Padding drops 1px so the card does not grow.
- **Focus** (Keyboard focus only): Ring 0 0 4px 2px card/focus/ring-color; border card/border-focus
- **Focus + Selected** (Input only, a selected card with keyboard focus): Surface card/background-selected and the control stays on; border card/border-focus, 1px, plus the focus ring. The light border and the ring set it apart from Selected.

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Surface | card/background-default | #FFFFFF | #171614 |
| Border | card/border-default, 1px | #DFDEDD | #393632 |
| Hover border | card/border-hover | #1594EF | #1594EF |
| Selected border | card/border-selected, 2px | #0C79A8 | #41A8F2 |
| Selected surface | card/background-selected | #EEF9FF | #032D3D |
| Focus ring | card/focus/ring-color; blur 4, spread 2 | #0C79A8 | #41A8F2 |
| Focus border | card/border-focus | #EEF9FF | #EEF9FF |
| Default shadow | card/shadow/default; 0 0 3px | #4A4F55 at 12% | #FFFFFF at 24% |
| Hover shadow | card/shadow/hover; 0 4px 12px | #1594EF at 15% | #1594EF at 20% |
| Text | text/default, text/hint | #171614, #666054 | #FFFFFF, #9B958A |
| Radius | card/corner-radius | 8 | 8 |
| Padding | card/padding-desktop, card/padding-mobile | 20, 10 | 20, 10 |
| Header to content | card/input-content-gap | 10 | 10 |
| Motion | card/duration, card/easing | 200ms ease-out | 200ms ease-out |

Note. Resting border: The 1px border is 1.34:1 in light and 1.50:1 in dark. It is decorative; the shadow and the content mark the card, so it does not need 3:1.

### Accessibility

- An Input card is focusable and carries aria-selected. A set of them is a role="radiogroup" or a group of checkboxes: arrow keys move, Space selects.
- A Navigational card is an <a href>. Its accessible name is the identifier, not the whole contents.
- Selection shows in the control and the 2px border, not the tint alone (WCAG 1.4.1).
- Focus shows on the card itself, not only on the control inside it (WCAG 2.4.7).
- The whole card is the target. A Compact card is never shorter than 44px.

### Code

Template and styles: card.html and card.css in the same folder. Angular API: not yet written; to be agreed with the development team.

### Known gaps

- None open.
