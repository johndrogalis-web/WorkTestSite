# Search

Find or filter, with suggestions as you type. An Input with a magnifier, the shared Menu beneath it, and rows that show what matched.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Form Fields v2: Search 64751:68007, Suggestion Row 65138:76717. Light and dark.

## Learn

### When to use

- Finding one thing in a large or unknown set: a truck, a ticket, an order, a customer.
- Filtering a long table or list by typing.
- A toolbar or top bar search (the inline version).

### Use something else when

- The person picks from a list the product already knows. → Use Select
- There are a handful of fixed filters. → Use Chips or a Segmented control
- It is an action menu. → Use a Dropdown button

## Understand

### Behaviour (built in)

- **Suggests after two characters and a 200ms pause.** Earlier is noise; later feels slow.
- **Starts-with first, then contains.** Exact above both. Only the matched part is highlighted.
- **Grouped by what the thing is.** Trucks, Tickets, Orders, Customers, in a fixed order, a divider between groups, up to five rows each, then Show more.
- **Arrow keys move the highlight; focus stays in the field.** The highlighted row is the one Enter will run. The pointer moves the same highlight.
- **Picking a suggestion runs the search.** It does not fill the field and wait. That is the difference from Select.
- **Enter always works on the typed text.** Suggestions are a shortcut, never a gate.
- **Empty focus shows recent searches.** The last five, newest first. Each has a remove ×; Delete removes the highlighted one.
- **No hit says so and offers a next step.** “No results for “zz”” and a tip in hint text. Never an empty overlay.
- **One result keeps its header.** The category still tells you what kind of thing it is.
- **Escape closes; Clear empties.** Escape closes the overlay and keeps the text. Clear empties the field, keeps focus and reopens recent searches.

### Guidelines (your choices)

- **Name the scope in the placeholder.** “Search tickets”, not “Search”.
- **Keep the label in forms; drop it in toolbars.** The inline version is the same component with label and helper off. Give it an aria-label .
- **Keep the group order fixed.** People learn where Trucks sit.
- **Write the tip for the data you hold.** Name the IDs people search by in your product, in the user’s locale.

### Do not

- Use it to choose from a known list.
- Build a second inline search component.
- Show an empty overlay.
- Require a suggestion to be picked before a search can run.
- Recolour the highlight or the match per product area.

## Building it

### Anatomy

- **Field**: An Input with fi-search 16×16 in the leading slot. Every field colour and state is the Input’s. Clear fi-x sits in the trailing slot once there is text.
- **Overlay**: A Menu Container at the field bottom + 4, holding Suggestion Rows. Dividers between groups.
- **Suggestion Row**: 28 tall; 32 left padding so results line up under their header; 6 right; 4 top and bottom; 8 between parts. Types: Header, Default, Show More.
- **Prefix · Match · Suffix**: Three text parts in one result. The match sits in its own highlight. An optional Description follows on the same line in hint colour.
- **Highlighted**: Default and Show More only. The row under the arrow keys or the pointer.
- **Remove**: Optional trailing × on Recent search rows.

### Interaction

| From | Action | To | What changes |
|---|---|---|---|
| Empty, focused | — | Recent | Recent searches open beneath, if any |
| Any | Type 2+ characters | Suggesting | After a 200ms pause the overlay shows matches; Clear appears |
| Suggesting | ArrowDown / ArrowUp | Row highlighted | The highlight moves; focus and the typed text stay in the field |
| Suggesting | Enter | Searched | Runs the highlighted row, or the typed text if none |
| Suggesting | Escape, blur | Closed | Overlay closes, text stays |
| Filled | Clear | Empty, focused | Text cleared, focus stays, recent searches open |

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Field | input/*, fi-search 16 | Input tokens | Input tokens |
| Overlay | Menu Container, bottom + 4 | #FFFFFF, border #7F796C | #171614, border #9B958A |
| Row height, padding | suggestion-row/height, padding-* | 28; 4 / 6 / 4 / 32 | Same |
| Gap, radius | suggestion-row/content-gap, radius | 8, 4 | Same |
| Header | suggestion-row/text-header, Body/sm | #171614 | #D0CEC8 |
| Result | suggestion-row/text-result | #171614 | #FFFFFF |
| Match | suggestion-row/text-match on match-highlight | #032D3D on #C5E4FB | #032D3D on #E3F200 |
| Description | suggestion-row/text-description | #666054 | #9B958A |
| Show more | suggestion-row/text-action | #0975C3 | #41A8F2 |
| Highlighted row | suggestion-row/background-highlight | #DFDEDD | #FEFFD6 |
| Highlighted text | text-result-, text-description-, text-action-highlight | #171614, #666054, #0D598F | #171614, #45413A, #0D598F |
| Remove | suggestion-row/icon-remove (-highlight) | #171614 | #FFFFFF (#171614 highlighted) |
| Timing | House rule | 2 characters, 200ms, 5 per group | Same |

### Accessibility

- The input is role="combobox" with aria-autocomplete="list" , aria-expanded and aria-controls ; the overlay is a listbox ; results and Show more are option s.
- The highlight uses aria-activedescendant , so focus never leaves the field. Headers, dividers and the tip are not options.
- Wrap it in role="search" (or <search> ) so it is a landmark.
- A polite live region says the count: “5 suggestions”, “No results”.
- The match is a <mark> ; the result reads fully without it. Clear is a real button with a name and returns focus to the field.
- Inline: the placeholder is not a label. Give the input an aria-label that names the scope.

### Known gaps

- None open.
