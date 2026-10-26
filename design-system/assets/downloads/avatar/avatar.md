# Avatar

A person, shown as a photograph or an icon. Two shapes, four sizes.

Status: Has gaps. Figma: Trinity Design System John V, 60899:8165 (set 51692:17265). Light and dark.

## Learn

### When to use

- Next to a person’s name in a list, a table row or a page header.
- The signed-in person, in the top bar or the account menu.
- A comment, note or change, to show who made it.

### Use something else when

- It stands for a truck, a plant or a company. → Use an icon or the logo
- It would be the only way to tell people apart. → Show the name
- You need to show a status, such as online or away. → Use a Badge next to the name
- You need to show a group of people. → List them, one per row

## Understand

### Behaviour (built in)

- **The photograph fills the frame.** It crops square from the centre and never stretches.
- **With no photograph, the icon shows.** A missing or broken image falls back to the icon too. Never an empty frame.
- **XSmall shows only the icon.** A face is unreadable at 16px, so Figma has no image variant there.
- **A 1px ring sits inside the edge, in both themes.** It keeps a photograph from merging into a dark surface.
- **It has no states of its own.** Inside a link, button or menu row, it takes that control’s states.
- **The icon is the Icon atom.** A different icon can be swapped in without touching the component.

### Guidelines (your choices)

- **Pick one shape per product.** Circles and squares on one screen read as two systems.
- **Put the name next to it.** The avatar supports the name. It never replaces it.
- **Match the size to what sits around it.** Bigger in a profile header, smaller in a dense table.
- **Ask for square photographs.** There is no focal-point control, so an off-centre face gets cut.
- **Use the icon when there is no photograph.** It is the intended fallback, not a placeholder to fill later.

### Do not

- Mix circle and square avatars in one product.
- Put a photograph in an XSmall avatar.
- Add initials. The icon covers the no-photo case and the name tells people apart.
- Stack avatars or put a status dot on one.

## Building it

### Anatomy

- **Frame**: A circle or a square. Sets the size.
- **Content**: A photograph, or the user icon when there is none.
- **Ring**: A thin edge inside the frame. Always on.

### Options

- Shape: circle or square.
- Size: Large 56, Medium 32, Small 24, XSmall 16.
- Content: photograph or icon. XSmall is icon only.

### States

- None. On its own it is a picture. Inside a control it takes that control’s states.

### Specs

| Part | Property | Token | Light | Dark |
|---|---|---|---|---|
| Frame | Size | avatar/large, medium, small, xsmall | 56, 32, 24, 16 | same |
| Frame | Radius, circle | avatar/circle radius | 9999 | 9999 |
| Frame | Radius, square | avatar/sm radius | 8 | 8 |
| Frame | Fill, icon form | avatar/background | #171614 | #F0EEEA |
| Icon | Colour | avatar/default | #FFFFFF | #171614 |
| Icon | Size, stroke | Icon atom, user | 24 / 20 / 16 / 12, 1.5px | same |
| Ring | Width, colour | avatar/stroke-width, stroke-color | 1px inside, #F0EEEA | 1px inside, #F0EEEA |
| Photograph | Fit | — | Cover, centred | same |

### Accessibility

- A photograph that identifies someone needs alt text with their name.
- Next to a visible name, use alt="" and hide the icon with aria-hidden. Do not announce the person twice.
- Inside a link or button, the avatar must not replace the control’s accessible name.
- Never make the avatar the only way to tell two people apart. Show the name.
- The ring is decorative, so the 3:1 rule for controls does not apply (WCAG 1.4.11).
- Icon on fill: 18.08:1 light, 15.61:1 dark. Both pass AA.

### Code

Template and styles: avatar.html and avatar.css in the same folder. Angular API: not yet written; to be agreed with the development team.

### Known gaps

- **Figma variant names read Med and squircle.** Rename to Medium and Square so Figma, this page and the code agree. Until then, read Med as Medium and squircle as Square.
- **The user icon comes from the Feather set.** The icon rule says Unicons for new work. Needs a decision: swap to the Unicons user icon, or record Avatar as an agreed exception.
