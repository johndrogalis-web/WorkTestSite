# Banner

A full-width strip under the page header. It holds one condition that stays until it is resolved.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), 38356:1239. Light and dark.

## Learn

### When to use

- A marketing message, such as an event or a new release.
- A condition that affects the whole page, such as a plant being offline.
- Something due soon that the person should act on, such as calibration.
- A short pointer anyone can ignore, such as new documentation. Use the Simple layout.

### Use something else when

- It confirms that something just happened. → Use a Toast
- It is about one field. → Use Helper text
- The person must decide before going on. → Use a Modal
- It belongs to one card or section. → Use an inline Notification

## Understand

### Behaviour (built in)

- **It sits under the page header, across Main Content.** Never inside a card, over content or at the bottom.
- **It appears with the page, with no animation.** If it starts while the page is open, it pushes content down. It never covers anything.
- **Default leaves when its condition clears.** Its action usually clears it.
- **Simple leaves when dismissed, fading out in 150ms.** It stays gone for that person until the message changes.
- **The whole Simple strip is the link.** Anywhere but the × follows it.
- **Below 600px, Default wraps.** Icon and text on top, the action full width below. Simple truncates to one line.
- **The action is always the yellow primary, in both themes.** Banners carry marketing messages, and the yellow is the marketing colour. In Figma the action and dismiss are set to Dark mode on purpose.
- **The strip has no states.** Its action, link and dismiss keep their own.

### Guidelines (your choices)

- **Show one Default banner per page.** If two conditions apply, show the more severe one. The other waits.
- **Lead with the message in plain words.** “See you at the trade show next week” or “Plant 2 is offline”. Put the detail or the deadline in the subheader.
- **Give it one action that does what the heading says.** “View plant” or “Schedule”, never “OK” or “Learn more”.
- **Use the icon to say what kind it is.** Info, warning or success. The strip stays the same colour for every kind.
- **Use Simple for anything a person may ignore.** Up to two can stack above a Default banner, newest first.

### Do not

- Use it to confirm something. That is a Toast.
- Put two actions in it.
- Colour the strip red or green.
- Show a Default banner nobody can act on and nobody can close.
- Animate it in, bounce it or blink it.

## Building it

### Anatomy

- **Container**: The full-width strip.
- **Icon**: Default only, optional. Says what kind of message it is.
- **Heading**: The whole message, in one line if you can.
- **Subheader**: Optional. The why or the when.
- **Action**: Default only, optional. One medium primary Button, always the yellow.
- **Link**: Simple only. The message, as one centred link.
- **Dismiss**: Simple only, optional. An icon only button.

### Options

- Default: icon, heading, subheader, one action. Hugs its text, 56px with one line.
- Simple: one centred link, optional dismiss. 40px.
- Booleans: iconBefore, show subtitle, actions, dismissable.

### States

- None for the strip. The action is a Button, the link is a Link, the dismiss is an Icon only button.

### Specs

| Part | Property | Token | Light | Dark |
|---|---|---|---|---|
| Container | Fill | banner/background | #F6F4F2 | #2F2D28 |
| Container | Padding, gap | banner/padding-vertical, padding-horizontal, content-gap | 12 / 22, 24 | same |
| Container | Radius | banner/radius | 0 | 0 |
| Icon | Size, colour | banner/icon-size, banner/icon | 24, #171614 | 24, #FFFFFF |
| Heading | Type, colour | Body/md Medium, banner/heading | ABC Repro Medium 16, #171614 | #FFFFFF |
| Subheader | Type, colour, gap | Body/md, banner/body, banner/text-gap | Regular 16, #171614, 8 | #D0CEC8 |
| Action | Component, mode | Button, primary, medium, Style mode Dark | #E3F200, text #171614 | #E3F200, text #171614 |
| Simple | Height, padding | banner/simple/content-min-height, content-padding-left, -right | 40; 12 left, 16 right | same |
| Link | Type, colour | Link/sm Medium, banner/link/default, hover, active, focus | Medium 14, underlined, #0D598F | #C5E4FB |
| Dismiss | Component | Icon only button, Standard, Medium | 32 target, 16 icon, 8 from right | same |
| Motion | Dismiss | banner/exit/duration, exit/easing | 150ms, ease-in | same |

### Accessibility

- Use role="status" by default. It is announced once, politely. Use role="alert" only when work has stopped.
- The heading is a <p> with weight, not a heading element. It is a message, not a section.
- It comes first in the main region’s tab order, after the page header.
- The dismiss is named “Dismiss”. After dismissing, focus moves to the next focusable element.
- The kind is carried by the icon and the words, never by colour.
- Every link state shares one colour, so hover thickens the underline instead.
- The Simple link is a native <a href> with a real destination. Never make the strip a button.
- Links go somewhere, buttons do something. Make the Default action an <a> when it navigates (“View plant”) and a <button> when it acts (“Schedule” opening a modal). It looks like a Button either way.
- Name the destination in the link text. Avoid “click here” and “learn more” (WCAG 2.4.4). If it opens a new window, say so in its accessible name.
- Focus must be visible without relying on colour (WCAG 2.4.7). The full rules are on the Link page, from the Link atom documentation in Figma (65835:47147).
- Every text pair passes AA; the lowest is 6.73:1.

### Code

Template and styles: banner.html and banner.css in the same folder. Angular API: not yet written; to be agreed with the development team.

### Known gaps

- None open.
- Exception: the yellow action’s focus ring: In a light banner the ring (#9B958A) reads 2.71:1, under the usual 3:1. Accepted as part of the marketing yellow decision.
