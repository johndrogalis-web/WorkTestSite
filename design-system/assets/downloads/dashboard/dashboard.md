# Dashboard and widgets

The Hub home page. Every tile on it is a widget: the same shell, on the Card tokens, holding a snapshot of one page or section.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), section 65667:14366: Widget Shell 65667:14367, Dashboard Grid demo 65668:14176. Light and dark.

Built on Card: The Widget Shell uses the Card surface, border, 16px radius and shadow tokens, so a widget and a card always match. This page covers the shell, its options and how widgets sit on the grid.

## Learn

### When to use

- A snapshot of one page or section on the Hub home: tickets, alarms, loads, a map.
- A set of snapshots people scan to decide where to go next.

### Use something else when

- People pick one record: a truck, a ticket, an order. → Use a Card
- It shows the health of one piece of hardware. → Use a Status Card
- People need every row and column. → Use a Table on its own page
- The message is about the whole page or account. → Use a Notification

### Examples

Built from the shell and other components; examples, not components.

- **Fleet map** (Large): Map in the Body slot (Widget/Map in Figma): truck markers coloured by phase , locate and zoom as Icon Only Buttons
- **Tickets** (Medium): List rows with a Truck phase tag
- **Trucks by phase** (Medium): Truck phase tags with a count. CTA off
- **Loads today** (Small): KPI with a Badge . Actions and CTA off, so the title fits
- **Alarms, Trucks, Plants, Orders** (Tiny): Compact shell, one number; Alarms adds an Error Badge

## Understand

### Behaviour (built in)

- **Snapshots, not pages.** A widget shows a slice of one page or section, so people get the picture without opening reports. The footer link is how they go deeper.
- **The grid sets the size.** Placed widgets fill their grid cell. The dashboard picks the span; the widget fills it and lays out its content to its own width.
- **Four sizes on Large.** Large spans 12 columns, Medium 4, Small 2, Tiny 1. Tiny uses Compact density and half the height.
- **The grid follows the page class.** 12 columns on Large and Expanded, 8 on Medium (Large widgets span all 8), 4 on a phone, where every widget is full width except Tiny, which goes two-up.
- **A KPI fills the card.** The number scales with the widget’s width (28px in a Small widget, up to 96px in a Large one) and sits in the middle of the Body slot, so a big widget never shows a small number in empty space.
- **Compact is title and content only.** No actions, no CTA, no footer. Turning those on does nothing at Compact.
- **Narrow widgets cut text.** The timestamp and long titles end in an ellipsis rather than wrap.
- **Narrow widgets drop the CTA (house rule).** Below 320px wide, “View all” hides so the title keeps its room. The footer link still goes to the same page.
- **Size ladder (house rule).** Dropping a widget from the Widget Library onto another splits that space in half, and both step down one size: Large, Medium, Small, Tiny. Tiny does not split. There is no Split button.
- **Edit mode.** “Edit dashboard” puts every widget in Mode=Edit; “Save changes” keeps the layout and leaves edit mode. Cancel restores the last saved layout.
- **Remove (house rule).** Remove takes the widget off the dashboard; the others close the gap. It comes back from the Widget Library.
- **Refresh never moves the grid.** Each widget refreshes on its own schedule and updates its “Last updated” line.

### Guidelines (your choices)

- **Turn off what the widget does not need.** Use the Show properties. A KPI tile often needs no actions; a Small widget has no room for the CTA.
- **Keep the footer link.** It is the way into the page the widget summarises. Turn the footer off only when the whole widget is the link.
- **Match content to size.** The one number in Tiny, the trend in Small, enough to decide in Medium, the full snapshot in Large.
- **Write a real title.** Name the data, not the chart: “Loads this week”, not “Bar chart”. Keep it under about 24 characters.
- **Keep “Last updated” honest.** If the data is stale, say so in the timestamp.
- **Give each widget type its own spans.** The widget configuration says which spans it allows at each layout class. The shell does not know.

### Do not

- Put a full data table in a Medium widget. That is a Large widget or a page.
- Let a widget change its own span. The dashboard decides spans; the widget decides layout.
- Hide the header and leave the widget without a name for screen readers.
- Show edit affordances (drag handle, Remove) outside edit mode.
- Restyle the shell. Change the Card tokens and every card and widget moves together.

## Building it

### Anatomy

- **Dashboard grid**: 12 columns on Large, 16px padding, 12px gaps (dashboard-grid/*). It owns columns, rows and placement.
- **Shell**: The Card surface: fill, 1px border, 16px radius and shadow. Padding 20, or 10 at Compact.
- **Header**: Title (Heading/sm), two bordered icon buttons and a secondary small “View all” button. Each part switches on and off.
- **Body slot**: The widget’s content: a chart, list, KPI or map. It lays itself out against the shell’s width.
- **Footer**: The timestamp (Body/sm, text/hint) and a 24px link to the page the widget summarises.

### Properties

| Property | Type | Default | What it does |
|---|---|---|---|
| showHeader | Boolean | On | The whole header row. Both densities. |
| Title | Text | “Title” | The widget name, Heading/sm. |
| Show actions | Boolean | On | Two Icon Only Buttons, Bordered, Small. Default only. |
| Show CTA | Boolean | On | The secondary small “View all” button. Default only. |
| Show footer | Boolean | On | Timestamp and open link. Default only. |
| Timestamp | Text | “Last updated 1 min ago” | Footer text, Body/sm. |
| Body | Slot | Empty | The widget content. |
| Density | Variant | Default | Default (20 padding, 16 gap) or Compact (10 padding, 8 gap; title and Body only). |
| Mode | Variant | View | View, or Edit: tinted, dashed border, drag handle and Remove. Actions, CTA and footer link hide. |

### Sizes (Large layout)

| Size | Span | What it shows |
|---|---|---|
| Large | 12 of 12 | The full snapshot: a chart or table with enough to act from. |
| Medium | 4 of 12 | Simplified data: enough to understand, or to pull people in. |
| Small | 2 of 12 | A preview link to what the page holds. CTA off. |
| Tiny | 1 of 12, Compact, half height | One key number, or a single indicator. |

### Spans by layout class

| Widget type | Compact (4) | Medium (8) | Large (12) |
|---|---|---|---|
| KPI | 2–4 | 4 | 3–4 |
| Trend | 4 | 4 | 4–6 |
| Chart | 4 | 8 | 6–12 |
| Summary list | 4 | 4–8 | 4–6 |
| Data table | 4 | 8 | 12 |

### States

- **Content** (Data has loaded): The Body slot shows the widget content.
- **Empty** (No data for the period): Widget Body / Empty: one line in text/hint saying so, and an optional link in link/link. Centred, gap/1, minimum height dashboard-grid/empty-min-height (120).
- **Loading** (First load or refresh): The Spinner , Large (40), centred in the Body slot; Medium (24) at Compact. aria-busy="true" on the widget. The widget keeps its size, so the grid does not jump.
- **Edit** (After “Edit dashboard”): Surface card/background-selected, 1px dashed card/border-selected, a drag handle before the title, and Remove in place of the actions. CTA and footer link hide; the timestamp stays. Same in both densities.

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Shell fill | card/background-default | #FFFFFF | #171614 |
| Shell border | card/border-default, 1px | #DFDEDD | #393632 |
| Radius | card/corner-radius (radius/xxl) | 16 | 16 |
| Shadow | card/shadow/default | 0 0 3 #4A4F55 12% | 0 0 3 #FFFFFF 24% |
| Padding | card/padding-desktop / card/padding-mobile | 20 / 10 | 20 / 10 |
| Root gap | gap/3 / gap/2 | 16 / 8 | 16 / 8 |
| Header, actions, footer gap | gap/2 | 8 | 8 |
| Title | Heading/sm 16 Medium, text/default | #171614 | #FFFFFF |
| Timestamp | Body/sm 14, text/hint | #666054 | #9B958A |
| Icon buttons | Icon Only Button, Bordered, Small: 24, 2px border | #F0EEEA, #D0CEC8 | #000000, #7F796C |
| CTA | Button secondary small | As Button | As Button |
| Grid gaps | dashboard-grid/column-gap, row-gap | 12 | 12 |
| Grid padding | dashboard-grid/padding-horizontal, -vertical | 16 | 16 |
| Grid background | dashboard-grid/background | #FFFFFF | #565147 |
| Grid border | dashboard-grid/border, weight 0 | #D0CEC8 (off) | #45413A (off) |
| Empty minimum | dashboard-grid/empty-min-height | 120 | 120 |
| Empty message | Body/sm 14, text/hint | #666054 | #9B958A |
| Empty link | Body/sm 14, link/link, underlined | #0975C3 | #41A8F2 |
| Edit fill | card/background-selected | #EEF9FF | #032D3D |
| Edit border | card/border-selected, 1px dashed 4 / 4 | #0C79A8 | #41A8F2 |
| Edit drag handle | fi-move 16, text/hint | #666054 | #9B958A |

### Accessibility

- Each widget is a <section> named by its title ( aria-labelledby ), so screen readers can list the dashboard by widget.
- With the header off, the widget keeps its name through aria-label .
- Widget titles are <h3> under the page heading, whatever the widget size.
- Icon buttons have names: “Refresh Tickets”, “Tickets options”, “Open Tickets”.
- Every drag in edit mode has a keyboard way: Move with arrow keys, and Remove as a button. A live region says where the widget went.
- The DOM order is the visual order. Rearranging reorders the DOM, not only the grid.
- A refresh updates content quietly. A loading widget sets aria-busy .

### Code

Template and styles: widget.html and widget.css in the same folder. Angular API: not yet written; to be agreed with the development team.

### Known gaps

- None open.
