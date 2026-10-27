# Date and time field

One field for a date and a time. Type it, or open the calendar and pick a day, then a time from the list beside it.

Status: Has gaps. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Date Time Field 65097:1543, Date Picker 65087:62233, Time Input 65097:1462. Light and dark.

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
- **Pick a day, then a time.** Choosing a day moves focus to Available Times; choosing a time writes both into the field and closes the panel.
- **Escape or a click outside closes it.** Nothing changes unless a day and time were both chosen.
- **Typed values are checked when you leave the field.** A valid value is rewritten in the full local format; anything else shows the error and keeps what was typed.
- **Six date rows, always.** The calendar is 224 wide and never changes height between months. Days from the months either side are left empty.
- **The arrows move one month.** At a range limit an arrow is disabled, not hidden, so nothing moves under the pointer.
- **Motion is short.** The panel fades and slides in over 200ms ease-out and out with ease-in. With reduced motion it only fades.

### Guidelines (your choices)

- **Say the format in the helper text.** Not only in the placeholder, which disappears on typing: “MM/DD/YYYY HH:MM AM/PM, your local time” (in the user’s own format).
- **Say whose time it is.** If the time is not the user’s own zone, such as the plant’s, name it in the helper text: “Plant time (CST)”.
- **Offer only times that can be booked.** Available Times lists real slots for the chosen day. If a day has none, disable it in the calendar.
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
- **Panel**: At input bottom + 4: the Calendar, a separator, and Available Times. Radius 16, padding 6, 1px date-picker/menu-border.
- **Calendar**: Calendar Header (two Icon Only Buttons and the month, 224 x 32) above a 7 x 7 grid: one row of weekday letters and six rows of 32 x 32 Calendar Day cells. 224 x 256.
- **Available Times**: 148 wide. A 34px header on available-times/header-background, then a list of Menu Items that scrolls inside a 204px viewport.

### Options

- **Date and time** (Date Time Field 65097:1543): One field; the panel shows the calendar and Available Times.
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
| Times header | available-times/header-background, height 34, padding 12 | #DFDEDD | #393632 |
| Times list | available-times/list-background, viewport 204 | #FFFFFF | #171614 |
| Time selected | Menu Item selected | #0D598F on #EEF9FF | #171614 on #E3F200 |
| Motion | date-picker/duration, enter, exit | 200ms, ease-out, ease-in | 200ms, ease-out, ease-in |

### Accessibility

- The calendar icon is a real button named “Choose date and time” with aria-haspopup="dialog" and aria-expanded .
- Typing works without the panel, so the field never depends on a pointer.
- In the calendar, arrow keys move by day and week, Page Up and Page Down by month, Enter picks. Today carries aria-current="date" .
- Available Times is a listbox : arrow keys move, Enter picks, Escape closes and returns focus to the field.
- Today is marked by an outline as well as colour. Weekday letters are decorative and not focusable.
- The helper text holds the format and time zone, linked with aria-describedby .

### Known gaps

- **CalendarOption has the wrong description.** It is copied from Menu Container and does not describe the calendar and Available Times panel.
