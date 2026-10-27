# Date and time field

One field for a date and a time. Type it, or open the calendar and pick a day, then the hour and minutes beside it.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Date Time Field 65097:1543, Date Picker 65087:62233, Time Input 65097:1462. Light and dark.

Shown in the user&rsquo;s own format: Verifi works in many countries. The date format, the clock (12 or 24 hour) and the time zone follow the user’s location. MM/DD/YYYY HH:MM AM/PM on this page is the United States example; in the United Kingdom the same moment reads 18/09/2026 09:00, and in Germany 18.09.2026 09:00. Store the value as an ISO date and time with its offset; only the display changes.

## Learn

### When to use

- A single moment: a delivery slot, a pour start, an appointment.
- When people often know the exact date and time and want to type it, and sometimes want to look it up.

### Use something else when

- Only a date is needed. → Use the Date picker
- It is a window with a start and an end time. → Use the time range below (Time Input)
- The time is one of a few fixed slots with no date. → Use a Select
- It is a duration (2 hours), not a moment. → Use a Text field with a unit

## Understand

### Behaviour (built in)

- **Typing always works.** The calendar is a convenience, not the only way in. The field is never read-only.
- **The calendar icon or a click opens the panel.** It opens at input bottom + 4 on the month of the current value, or today. The field keeps its height.
- **Pick a day, then the time.** Choosing a day moves focus to the hours. Each pick of hour, minutes or AM/PM writes the field straight away; Enter or a click outside closes the panel.
- **Escape or a click outside closes it.** Nothing changes unless a day and time were both chosen.
- **The panel follows your typing.** Typing opens the panel. As you type, the calendar moves to the date and the time columns highlight the time, so people can see what they are picking. A minute between steps highlights the step below it: typing 12:17 highlights 15, and the field keeps 12:17. Enter writes the value in full and closes the panel; if it cannot be read, the error shows and the panel stays open.
- **Typing is forgiving.** Separators are optional: 09241983 1215 pm becomes 09/24/1983 12:15 PM. Two-digit years, a single a or p, and 24-hour times (13:15) all work. The value is rewritten in the full local format when you press Enter or leave the field; anything it cannot read shows the error and keeps what was typed.
- **Six date rows, always.** The calendar is 224 wide and never changes height between months. Days from the months either side are left empty.
- **The arrows move one month.** At a range limit an arrow is disabled, not hidden, so nothing moves under the pointer.
- **Motion is short.** The panel fades and slides in over 200ms ease-out and out with ease-in. With reduced motion it only fades.

### Typing is forgiving

- 09241983 1215 pm → 09/24/1983 12:15 PM
- 9/18/26 13:15 → 09/18/2026 01:15 PM
- 9-18-2026 915a → 09/18/2026 09:15 AM
- 091826 9p → 09/18/2026 09:00 PM
- 12/31/2026 0:05 → 12/31/2026 12:05 AM
- 09/18/2026 12:17 PM → 09/18/2026 12:17 PM (the panel highlights 12, 15, PM)
- 09241983 (no time) → Error: add a time
- 02302026 1pm → Error: not a real date

Digits follow the user’s date order: month-day-year in the US (09241983), day-month-year in the UK and most of Europe (24091983), year first where that is the local order (19830924).

### Guidelines (your choices)

- **Say the format in the helper text.** Not only in the placeholder, which disappears on typing: “MM/DD/YYYY HH:MM AM/PM, your local time” (in the user’s own format).
- **Say whose time it is.** If the time is not the user’s own zone, such as the plant’s, name it in the helper text: “Plant time (CST)”.
- **Any time, in 5-minute steps.** Hours 1 to 12, minutes 00 to 55 in steps of 5, and AM/PM. For any other minute, type it: 1:17 PM is fine. Where only booked slots are allowed, use Available Times instead.
- **Use the time range for windows.** Start and End are two Selects; End must be after Start.
- **Write the label as a noun.** “Delivery date and time”, not “Select a date”.

### Do not

- Make the field read-only to force the calendar.
- Hard-code MM/DD/YYYY for everyone.
- Add a second Time field next to it; the time is in this field.
- Shrink the calendar cells below 32 to fit more.
- Hide the calendar arrows at a limit.

## Building it

### Anatomy

- **Field**: The Input Field: label, 44px input with the calendar icon in the trailing slot, helper text. Every input/* token and state applies.
- **Panel**: At input bottom + 4: the Calendar, a separator, and Time Columns. Radius 16, padding 6, 1px date-picker/menu-border.
- **Calendar**: Calendar Header (two Icon Only Buttons and the month, 224 x 32) above a 7 x 7 grid: one row of weekday letters and six rows of 32 x 32 Calendar Day cells. 224 x 256.
- **Time Columns**: 156 wide. A 34px Time header, an hours column and a minutes column (5-minute steps) that scroll, and an AM/PM row. Users on a 24-hour clock get hours 00 to 23 and no AM/PM row.

### Options

- **Date and time** (Date Time Field 65097:1543): One field; the panel shows the calendar and Time Columns (any time, 5-minute steps).
- **Booked slots** (Available Times 65116:61527): A list of the times that can be booked, in place of Time Columns, when the time is not free.
- **Date only** (Date Picker 65087:62233, ShowTimes off): The panel shows the calendar only. See Date picker .
- **Time range** (Time Input 65097:1462): Start time and End time as two Selects.

### States

- **Default** (At rest): input/* default border and placeholder
- **Hover** (Pointer over the field): Hover fill and border
- **Focus** (Typing, or the panel is open): 2px focus border and ring
- **Filled** (A value is set): Value in input text colour
- **Error** (The typed value is not a date and time): Error border, label and helper; the helper says the expected format
- **Disabled** (Not available): Disabled tokens; the icon cannot open the panel

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Field | Input Field (see Text field ) | As Text field | As Text field |
| Panel fill | date-picker/menu-background | #FFFFFF | #171614 |
| Panel border, separator | date-picker/menu-border, separator | #B6B1A5 | #45413A |
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
| Time header | available-times/header-background, height 34, padding 12 | #DFDEDD | #393632 |
| Time columns | available-times/list-background; items 30, radius 4; AM/PM 28, pill | #FFFFFF | #171614 |
| Time selected | Menu Item selected | #0D598F on #EEF9FF | #171614 on #E3F200 |
| Motion | date-picker/duration, enter, exit | 200ms, ease-out, ease-in | 200ms, ease-out, ease-in |

### Accessibility

- The calendar icon is a real button named “Choose date and time” with aria-haspopup="dialog" and aria-expanded .
- Typing works without the panel, so the field never depends on a pointer.
- In the calendar, arrow keys move by day and week, Page Up and Page Down by month, Enter picks. Today carries aria-current="date" .
- Hours and minutes are listbox es and AM/PM a radiogroup : up and down move within a column, left and right move between them, Enter closes, Escape closes and returns focus to the field.
- Today is marked by an outline as well as colour. Weekday letters are decorative and not focusable.
- The helper text holds the format and time zone, linked with aria-describedby .

### Known gaps

- None open.
