# Table

Dense, comparable records in typed columns: a cell, a row, and rows stacked. Most of the Hub is a table, so these rules matter more than any other page.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Table_Cell 63541:40073 → Table Row 65726:49453 → table. Light and dark.

## Learn

### When to use

- Records people compare and scan: tickets, trucks, loads, alerts.
- Anything with more than a handful of rows and more than two data points each.
- Lists that sort, select or expand.

### Use something else when

- Each item is a rich object with a picture or a summary. → Use Cards
- It is a form. → Use fields in a page layout
- There are only a few key/value pairs. → Use a description list in a Card

## Understand

### Behaviour

- Only columns with showSort sort. One sort at a time; click cycles ascending, descending, off. The arrow shows direction; the header cell hover shows it is clickable.
- Sort the whole data set, not the page. If the table is paginated, sorting re-queries and returns to page 1.
- Default sort is the column the person came for — most recent first for tickets, worst first for alerts.
- Checkbox for many, radio for one. Never both in one table. The header checkbox selects the page; it never selects the whole data set silently.
- Clicking the row selects the row when the table is selectable and the click did not land on a control. The checkbox is the indicator, not the only target.
- Selected survives sorting and paging within a session, and the count is shown somewhere the person can see it.
- Two kinds of expansion, and they do not mix. The v3 Open view (a designed Accordion Content panel) opens from its chevron only, at any width, where a product chooses to use it. The responsive detail (the columns that did not fit) exists only on tablet and phone; there the whole row toggles. The identifier is always a link to the detail page, never a toggle.
- One row open at a time on tablet and phone. Opening a row closes the other, so the list never becomes a wall of detail. Designed Accordion Content on desktop may keep several open.
- Accordion content is read-only summary — key/value rows, a mini table, a note — plus at most one action. A form belongs in a Modal / Drawer .
- Cells do not wrap. Long values truncate with an ellipsis and the full value is in the detail or a Tooltip .
- Quantities right-align with tabular figures. Everything else left-aligns. Never centre a column.
- Empty is a dash , not a blank and not “N/A”.
- Say how many rows there are and paginate past one screen. Infinite scroll loses the footer and the count.
- The header is sticky on any table taller than the viewport.

### Guidelines

- Fill from the inside out: content → Cell Content → Row Cell Content.
- Give each column a fixed Table_Cell width and reuse it on every row so columns align.
- Set Cell Content and Accordion Content to Hug after dropping content.
- Use View = Basic for simple lists; Closed / Open only when a row needs to expand.
- Put the identifier first and make it the link.
- Do not detach Table_Cell or Table Row to add content — use the slots.
- Do not build header labels as loose text — use Table_Cell Type = Header, with showSort if the column sorts.
- Do not recolour rows by hand for hover or selection — switch the State variant.
- Do not pull from Table v2 DO NOT USE or Table DO NOT USE .
- Do not use a table to lay out a form, and do not put a second interactive control in every cell — the row is the target.

## Building it

### Anatomy

- 1 · Table_Cell One cell with its padding built in and a Cell Content slot in the middle. Variants Type = Body, Header, HeaderHover; boolean showSort . Drop text, a Badge , Chip , Tag , Avatar , Progress bar , Checkbox or Button into it. A body cell paints no background of its own.
- 2 · Table Row Holds the cells in its Row Cell Content slot and owns the background. Variants Type = Body, Header; View = Basic, Closed, Open; State = Default, Hover, Selected. Booleans isSelectable , hasRadioButton , showIcon , and the four chevrons. Extra slots: Icon container , Accordion Content .
- 3 · Table Rows stacked in a vertical auto layout, gap 0, Header first. That is the whole component: there is no separate table frame to configure.
- Row  42px tall, 8px side padding, 8px gap between slots, a 1px #D0CEC8 rule beneath
- Header row Same cells with Type=Header ; a heavier bottom rule; no radio button even when the body rows have one; no hover or selected state of its own
- Accordion content Appears under an Open row on a #DFDEDD container. Key/value rows, a mini table, notes — anything, set to Hug

### States

| State | Light | Dark | Note |
|---|---|---|---|
| Default | #FFFFFF | #171614 | table/row/background-default |
| Hover | #F6F4F2 | #211F1C | Row level. The header row has no hover; its cells do, via table/cell/header/background-hover |
| Selected | #EEF9FF | #032D3D | With the checkbox ticked or the radio on. The tint is a hint; the control is the indicator |
| Disabled | #DFDEDD, text #7F796C | #2F2D28, text #B6B1A5 | New in October 2026: table/row/background-disabled, table/cell/body/text-disabled. The row does not respond; say why |
| Open | #DFDEDD | #2F2D28 | The Accordion Content container, table/row/accordion-container-background |
| Striped | #F0EEEA | #1C1B18 | Even rows, table/row/background-striped |
| Header | #FFFFFF, 2px rule #565147 | #171614, 2px rule #DFDEDD | One state. table/cell/header/border and border-width |

### How it breaks

- The detail shows the hidden columns, and only those. Label and value, in column order, in the Accordion Content container. Visible columns do not repeat.
- Actions that lost their column move in too. A delete or an edit that was a cell on desktop becomes a button at the foot of the detail.
- The whole row toggles. On a tablet or a phone the chevron is the cue, not the only target; tapping anywhere on the row that is not a control opens it.
- One open at a time. Opening a row closes the other, so the list never becomes a wall of detail.
- Desktop never expands for this. Every data point is a column on desktop; the row opens only on tablet and phone. (The v3 Open view with Accordion Content in the Example above is a different thing: a designed detail panel, used where a product chooses to, at any width.)
- Drop by fit, not by breakpoint. The whole point of the row is to scan as much data as possible before anyone has to expand it. Below 900 the table measures itself and hides the lowest-priority column only when the row would overflow, then the next, until it fits. A 670px row keeps six columns; a 420px row keeps four.
- Give every droppable column a priority in the column definition. Nothing is dropped that was not marked, and the identifier, the status and the alerts never are.
- Below 900, prefer dropping a column to scrolling sideways. Sideways scroll hides the right-hand columns completely; a dropped column is one tap away. Desktop is the exception: it keeps every column and scrolls if it must.
- Keep the <table> markup at every width. It is the same DOM with columns hidden, so screen readers keep the row and column semantics.

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Row | table/row/height, padding-x, gap | 42, 8, 8 | Same |
| Cell padding | table/cell/padding-x, padding-y; header padding | 10, 4; 10 | Same |
| Cell min width | table/cell/min-width | 80 | 80 |
| Row rule | table/row/border, 1px | #D0CEC8 | #DFDEDD |
| Header rule | table/cell/header/border, border-width 2 | #565147 | #DFDEDD |
| Row fills | background-default / hover / selected | #FFFFFF / #F6F4F2 / #EEF9FF | #171614 / #211F1C / #032D3D |
| Disabled | background-disabled, text-disabled | #DFDEDD, #7F796C | #2F2D28, #B6B1A5 |
| Accordion container | table/row/accordion-container-background | #DFDEDD | #2F2D28 |
| Striped | table/row/background-striped | #F0EEEA | #1C1B18 |
| Text | Body/sm; header Body/sm Medium | #171614 | #FFFFFF |
| Icons | table/icon/default; Icon Medium 20 in the icon slot, Large 24 for chevrons | #171614 | #FFFFFF |
| Slot columns | chevron, checkbox, radio, icon | 24 each, in that order | Same |
| Mobile detail | table/mobile/detail padding-y, padding-x, field-gap; expand-target | 14, 20, 12; 34 | Same |
| Breakpoints | house rule, on the wrapper | 900 and 600 | Same |
| Motion | table/duration; table/expand/duration | 200ms; 300ms ease-out | Same |

### Accessibility

- Real <table> , <thead> , <th scope="col"> at every width. The phone layout is the same table with fewer columns, never a list of cards.
- A sortable header is a <button> inside the <th> carrying aria-sort .
- Every row checkbox or radio has its own label naming the row: “Select truck 45689”.
- The chevron is a <button> with aria-expanded and aria-controls ; Space and Enter toggle it. On tablet and phone the whole row toggles too.
- Selection, open and disabled must read without colour: the ticked box, the turned chevron, and a disabled row that does not respond and says why.
- A wrapper that scrolls sideways needs tabindex="0" and a label.

### Known gaps

- None open.
