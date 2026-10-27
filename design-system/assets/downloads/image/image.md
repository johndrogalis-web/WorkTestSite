# Image block

A frame with a fixed shape and a picture that fills it. Five aspect ratios, no states, no chrome.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Image Block 51681:83245 on page Image. Light and dark.

Updated in Figma: Image Block now has its own page, Image, under the atoms. Before, it was on no page even though Avatar uses it. The 5:3 and 4:3 frames were the wrong shape (133 x 100 and 125 x 100) and are now 167 x 100 and 133 x 100. A new token, image/placeholder, sits under the picture in every ratio.

## Learn

### When to use

- Photographs in cards, lists and page headers.
- Hardware renders and diagrams that sit in a layout.
- Thumbnails and avatars (Avatar uses the 1:1 block).

### Use something else when

- It is an icon or a logo. → Use the icon font or the logo files
- It is a chart. → Use the Widget charts
- It is a person’s initials or picture in a list. → Use Avatar
- Words need to sit on top of it. → Put the words beside it, or add a scrim that measures 4.5:1

## Understand

### Behaviour (built in)

- **The frame never changes shape for the picture.** The picture is scaled to cover and cropped from the centre. A portrait photo in a 16:9 block is cropped, not letterboxed.
- **The space is held before the picture arrives.** The frame takes its size from the layout width and the ratio, and image/placeholder fills it while the file loads, so nothing moves.
- **A failed picture leaves the placeholder.** Never a broken-image icon. The alt text is still read out.
- **No picture, no block.** An empty frame is not a state. Leave the block out.
- **The browser picks the file size.** Two sizes are served, so a 320px thumbnail does not download a 1,400px file.

### Guidelines (your choices)

- **Choose the ratio from what the picture is for.** Not from the picture you happen to have. If the crop loses the subject, pick a different picture.
- **Keep one ratio per row or grid.** Mixed ratios do not line up.
- **Load lazily below the fold, eagerly above it.** A hero picture should never be lazy.
- **Follow the imagery rules.** Real people, real sites, natural light. Renders are for hardware. See Imagery .
- **Write alt text that says what is shown.** Or leave it empty when the text beside the picture already says it.

### Do not

- Stretch, skew or letterbox a picture.
- Put text on a picture without a scrim.
- Use the block for icons or logos.
- Show a broken-image icon.
- Mix 3:2 and 16:9 in one grid.

## Building it

### Anatomy

- **Frame**: A box with a fixed aspect ratio. Width comes from the layout; height follows the ratio. Clips the picture.
- **Placeholder**: image/placeholder fill under the picture. Shows while loading and if the picture fails.
- **Picture**: Fills the frame, scaled to cover, cropped from the centre. Never stretched.
- **Radius**: None of its own. The container sets it: 16 in a card, 8 in a list row, 0 when it bleeds to the edge.

### Aspect ratios

- **16:9** (178 x 100 in Figma): Hero images, video posters, anything that reads as a screen
- **5:3** (167 x 100 in Figma): Photographs in cards and lists; the default for brand photography
- **3:2** (150 x 100 in Figma): Photographs from a camera at their native shape
- **4:3** (133 x 100 in Figma): Diagrams, hardware renders, anything taller than a photo
- **1:1** (100 x 100 in Figma): Thumbnails, avatars, anything in a grid

### Conditions (no interactive states)

- **Loading** (The file has not arrived): The placeholder, at the final size
- **Loaded** (The picture is in): The picture covers the placeholder
- **Failed** (The file did not load): The placeholder stays; alt text is still read
- **No picture** (There is nothing to show): Do not render the block

### Specs

| Part | Token | Light | Dark |
|---|---|---|---|
| Ratios | aspect ratio | 16:9 · 5:3 · 3:2 · 4:3 · 1:1 | Same |
| Fit | object-fit | Cover, centred | Same |
| Placeholder | image/placeholder | #DFDEDD (neutral/100) | #2F2D28 (neutral/850) |
| Radius | From the container | 16 / 8 / 0 | 16 / 8 / 0 |
| Loading | loading | Lazy below the fold, eager above | Same |
| Sizes | srcset | Layout width and 2x | Same |

### Accessibility

- Every picture has an alt . It says what is shown when the picture carries information, and is empty ( alt="" ) when the text beside it already says it.
- Alt text does not start with “image of”. The screen reader already says that.
- A picture inside a link takes its name from the link text or the alt, never both.
- Text over a picture needs a scrim that measures 4.5:1 with the text at the picture’s lightest point, or the text goes beside it.
- Reserved space helps people using magnification: the layout does not jump while pictures load.

### Known gaps

- None open.
