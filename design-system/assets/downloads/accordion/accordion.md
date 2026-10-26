# Accordion

A section that opens and closes under a heading. The heading is the button; the content is whatever you put in it.

Status: Solid. Figma: Trinity Design System John V, 63692:9304. Light and dark.

## When to use

- A long page where each person needs only one or two sections, such as truck settings.
- Optional detail most people skip, such as history or advanced settings.
- A list of similar sections that people scan by title.

## Use something else when

- People need to compare sections side by side. → Use Tabs, or show them all
- The content is two or three short paragraphs. → Show it
- It is the main content of the page. → Show it
- It is a task that has to be finished. → Use a Modal or Drawer
- It is one summary with one action. → Use a Card

## Anatomy

- **Container**: The frame around the header and the content.
- **Header**: The button. It takes hover, focus and press.
- **Title**: Always shown. Says what is inside.
- **Subheading**: Optional. One line of detail under the title.
- **Icon**: Optional. Before the title.
- **Count**: Optional. A Badge in the Alternate style.
- **Chevron**: Always shown. Points down when closed, up when open.
- **Content**: A slot. Anything goes in, and the accordion styles none of it.

## States

- **Default**: Header fill matches the container.
- **Hover**: Header fill darkens one step. The content does not change.
- **Focus**: Same fill as hover, plus a 2px ring inside the header edge. Keyboard only.
- **Pressed Active in Figma**: Same as hover. Opening is instant, so a separate look would never be seen.
- **Disabled**: Title, subheading, icon and chevron fade to 36%. Not focusable and does not open.
- **Open**: Chevron points up and the content shows below the header.

## Rules

- **Open and close from the whole header.** The chevron only shows which way it will go.
- **Keep sections independent.** Opening one leaves the others alone. Use one-at-a-time only when sections replace each other, like steps.
- **Start closed.** If the page is about one section, open that one and only that one.
- **Keep hover, focus and press on the header.** The content never changes colour, so it is always clear what Enter will act on.
- **Use the count for how much is inside.** Changes, items or alerts, as a number. Never a word that repeats the title.
- **Use Disabled only when the section will become available.** Say why next to it. If it will never be available to this person, leave it out.
- **Leave the icon off by default.** Turn it on for three or more different sections that each have their own icon. All or none in a group, never with the chevron at the start, and never to show status.
- **Let the content style itself.** The accordion adds no padding or dividers inside the slot.
- **Animate open and close in 0.14s.** Under reduced motion the content appears without animation.

## Do

- Write titles that say what is inside.
- Add the count when the number is the reason to open.
- Keep one chevron position per screen.
- Use icons only when each section has its own.
- Say why a section is disabled.

## Do not

- Hide the main content of the page in a closed accordion.
- Put an accordion inside an accordion.
- Use it for two or three short paragraphs.
- Split a form that has to be submitted across closed sections.
- Mix rows with and without icons, or use a coloured icon for status.

## Specs

| Part | Property | Token | Light | Dark |
|---|---|---|---|---|
| Container | Fill | accordion/container-fill | #F6F4F2 | #393632 |
| Container | Border, 1px | accordion/container-stroke | #B6B1A5 | #666054 |
| Container | Radius, padding | accordion/container-radius | 16, 3 | 16, 3 |
| Header | Fill | accordion/fill-default | #F6F4F2 | #393632 |
| Header | Hover and focus fill | accordion/fill-hover, fill-focus | #DFDEDD | #211F1C |
| Header | Focus ring, 2px inside | accordion/stroke-focus | #171614 | #D0CEC8 |
| Header | Padding, gap, radius | accordion/top-bottom-padding, left-right-padding, gap | 6 / 8, 8, 16 | 6 / 8, 8, 16 |
| Header | Disabled fill | accordion/fill-disabled | #F6F4F2 | #2F2D28 |
| Header | Disabled foreground | accordion/foreground-disabled, opacity-disabled | #7F796C at 36% | #7F796C at 36% |
| Title | Colour | accordion/header-default | #171614 | #FFFFFF |
| Title | Type | Heading/lg | ABC Repro Medium 24, line 1.2 | same |
| Subheading | Type | Body/md | ABC Repro Regular 16, line 1.3, title colour | same |
| Icon, chevron | Size, colour | icon/default, accordion/chevron-icon | 24px, #171614 | 24px, #FFFFFF |
| Count | Component | Badge, Alternate | see Badge | see Badge |
| Content | Padding, gap | — | 10, 10 | 10, 10 |
| Closed height | With and without subheading | — | 68 / 49 | 68 / 49 |
| Motion | Fill and chevron | — | 0.14s | 0.14s |

## Accessibility

- The header is a <button> inside a heading, with aria-expanded and aria-controls.
- The content is role="region", labelled by the header.
- Enter and Space open and close. Tab moves between headers.
- The focus ring bounds the header only (WCAG 2.4.13).
- The count is read as part of the button name: “Truck settings, 3 changes, collapsed”. Write it so it reads well.
- Disabled is exempt from the contrast minimum (WCAG 1.4.3), which is why the reason has to be written next to it.
- Every text pair passes AA; the lowest is 12.02:1. Focus ring 13.46:1 light, 10.45:1 dark.

## Code

Template and styles: accordion.html and accordion.css in the same folder. Angular API: not yet written; to be agreed with the development team.
