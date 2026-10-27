# Date picker

A field you can type a date into, with a calendar under it for when you would rather look. One date, no time.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Date Picker 65087:62233 with CalendarOption ShowTimes off. Light and dark.

Shown in the user&rsquo;s own format: The date format follows the user’s location. MM/DD/YYYY on this page is the United States example; the United Kingdom shows 18/09/2026 and Germany 18.09.2026. Typed digits are read in the same order. Store the value as an ISO date (2026-09-18); only the display changes.

Same panel as Date and time field: Date picker is the Date Picker component with CalendarOption’s ShowTimes switched off. The calendar, its tokens and its keys are shared with the Date and time field , which turns ShowTimes on. The component’s default text reads “Date and Time”; for a date-only field, change the label, placeholder and helper.

## Learn

### When to use

- One date: a delivery date, a due date, a start date.
- When people often know the date and want to type it, and sometimes want to look it up.

### Use something else when

- A time is needed too. → Use the Date and time field
- It is a range with a start and an end date. → Two Date pickers, Start and End; ranges are not built
- It is a month or a year only. → Use a Select
- It is a relative period (last 7 days). → Use a Segmented control or a Select

## Understand

### Behaviour (built in)

- **Typing always works.** The calendar is a convenience, not the only way in. The field is never read-only.
- **The calendar icon or a click opens the panel.** At input bottom + 4, on the month of the current value, or today. The field keeps its height.
- **Picking a day fills the field and closes.** The date is written in full and focus returns to the field.
- **The panel follows your typing.** Typing opens the panel and moves the calendar to the date as soon as it can be read. Enter writes it in full and closes the panel; if it cannot be read, the error shows and the panel stays open.
- **Typing is forgiving.** Separators are optional and two-digit years work: 09241983 and 9/24/83 both become 09/24/1983 when you press Enter or leave the field.
- **Escape or a click outside closes it.** Nothing changes.
- **Six date rows, always.** The calendar is 224 x 256 and never changes height between months. Days from the months either side are left empty.
- **The arrows move one month.** At a range limit an arrow is disabled, not hidden, so nothing moves under the pointer.
- **Motion is short.** The panel fades and slides in over 200ms ease-out and out with ease-in. With reduced motion it only fades.

### Typing is forgiving

- 09241983 → 09/24/1983
- 9/24/83 → 09/24/1983
- 9-24-2026 → 09/24/2026
- 092426 → 09/24/2026
- 9.24.2026 → 09/24/2026
- 02302026 → Error: not a real date

### Guidelines (your choices)

- **Say the format in the helper text.** Not only in the placeholder, which disappears on typing: “MM/DD/YYYY, your local format” (in the user’s own format).
- **Limit the range when it matters.** Disable days that cannot be chosen, such as the past for a delivery date, and disable the arrows at the limits.
- **Write the label as a noun.** “Delivery date”, not “Select a date”.
- **Use two pickers for a range.** Start date and End date, with an error when End is before Start.

### Do not

- Make the field read-only to force the calendar.
- Hard-code MM/DD/YYYY for everyone.
- Shrink the calendar cells below 32 to fit more.
- Hide the calendar arrows at a limit.
- Show days from the months either side.

## Building it

### Anatomy

- **Field**: The Input Field: label, 44px input with the calendar icon in the trailing slot, helper text. Every input/* token and state applies.
- **Panel**: CalendarOption at input bottom + 4, ShowTimes off. Radius 16, padding 6, 1px date-picker/menu-border.
- **Calendar Header**: Two Icon Only Buttons and the month written out, 224 x 32.
- **Date grid**: 7 x 7: one row of weekday letters and six rows of 32 x 32 Calendar Day cells. 224 x 256 with the header.

### States

- **Default** (At rest): input/* default border and placeholder
- **Hover** (Pointer over the field): Hover fill and border
- **Focus** (Typing, or the panel is open): 2px focus border and ring
- **Filled** (A date is set): Value in input text colour
- **Error** (The typed value is not a date): Error border, label and helper; the helper says the expected format
- **Disabled** (Not available): Disabled tokens; the icon cannot open the panel

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Field | Input Field (see Text field ) | As Text field | As Text field |
| Panel fill | date-picker/menu-background | #FFFFFF | #171614 |
| Panel border | date-picker/menu-border | #B6B1A5 | #45413A |
| Panel radius, padding | CalendarOption | 16 / 6 | 16 / 6 |
| Day cell | calendar-day/size, padding, radius | 32, 3, 9999 | 32, 3, 9999 |
| Day text | calendar-day/text | #171614 | #FFFFFF |
| Weekday letter | calendar-day/text-weekday | #666054 | #9B958A |
| Day hover | calendar-day/background-hover, text-hover | #DFDEDD, #171614 | #FEFFD6, #171614 |
| Day selected | calendar-day/background-selected, text-selected | #0D598F, #FFFFFF | #E3F200, #171614 |
| Today | calendar-day/border-today, text-today, 1px | #0D598F | #E3F200 |
| Day focus | calendar-day/border-focus | #171614 | #D0CEC8 |
| Day disabled | calendar-day/text-disabled | #7F796C | #B6B1A5 |
| Month label | calendar-header/text, Body/sm Medium | #171614 | #FFFFFF |
| Motion | date-picker/duration, enter, exit | 200ms, ease-out, ease-in | 200ms, ease-out, ease-in |

### Accessibility

- The calendar icon is a real button named “Choose a date” with aria-haspopup="dialog" and aria-expanded .
- Typing works without the panel, so the field never depends on a pointer.
- In the calendar, arrow keys move by day and week, Page Up and Page Down by month, Enter picks, Escape closes and returns focus to the field. Today carries aria-current="date" .
- Today is marked by an outline as well as colour. Weekday letters are decorative and not focusable.
- The helper text holds the format, linked with aria-describedby .

### Known gaps

- None open.
