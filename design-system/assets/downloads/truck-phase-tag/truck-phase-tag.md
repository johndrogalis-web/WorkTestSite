# Truck phase tag

The nine stages of a load, from waiting at the plant to ignition off, as a coloured pill. It is for truck phases and nothing else; every other status is a Badge.

Status: Solid. Figma: Trinity Design System V2 (9bRI2xwkTcoTRuKgon1JFf), Truck Phase Tag 56361:2240. Light and dark.

## Learn

### When to use

- The phase column in a truck or ticket list.
- The phase of one truck on a card, a map marker or a lane header.
- A legend that explains the phase colours on a map or a timeline.

### Use something else when

- It is a status that is not a truck phase: a unit, an update, a flag, a count. → Use a Badge
- It can be clicked, selected or removed. → Use a Chip , and the phase colour does not come with it
- It is a category or a provisional value. → Use a Tag

## Understand

### Behaviour (built in)

- **It is the Badge atom with a phase colour.** Nine Badge instances in Figma, Style=Alternate; size, type and radius come from Badge, so a change there reaches every phase tag.
- **The colour roles invert between themes.** Light is the solid colour with white text; dark is the light tint with near-black text. They do not tint. This is the one component in the library where that happens.
- **One token pair drives three things.** The pill, the map marker and the legend dot read from truck-phases/<phase>/background and /label . A truck shown as Pouring in a list and On site on the map is a bug.
- **It never reacts.** Inside a clickable row, hover and focus belong to the row; the pill stays as it is.
- **A truck has exactly one phase.** No combined or transitional state. The pill changes when the phase changes, with no animation of its own.

### Guidelines (your choices)

- **Always write the phase name.** Colour is the fast read, never the only read. Never a bare coloured dot.
- **Keep the lifecycle order everywhere.** Lists, legends, filters and the phases widget all run Waiting to load → Ignition off. Never alphabetical.
- **Nine is the model.** Do not invent a tenth phase, and do not reuse a phase colour for anything that is not a phase.
- **Use the token, not the hex.** Hard-coding a phase colour in one of the three places is how they drift apart.
- **Keep Badge’s type.** 12px Medium, never bold, never uppercase; the name is a short noun phrase.

### Do not

- Use it for a status that is not a truck phase.
- Reuse a phase colour for a region, a card or a chart series.
- Invent a tenth phase or a combined one.
- Bold or uppercase the label.
- Make it look pressable.

## Building it

### Anatomy

- **Container**: The Badge pill: 20 tall, padding 0 8, radius 16, hugs the label. Fill truck-phases/<phase>/background .
- **Label**: Body/xs Medium 12 / 1.3, truck-phases/<phase>/label (neutral/0 light, neutral/950 dark). Always the phase name.
- **Phase**: One of nine, in lifecycle order: Waiting to load, Loading, Loaded, To job, On site, Pouring, Washing, Return to plant, Ignition off.

### Specs

| Phase | Token | Light | Dark |
|---|---|---|---|
| Waiting to load | truck-phases/waiting-to-load/background | data/phase/01/900  #644325 | data/phase/01/100  #D9A97C |
| Loading | truck-phases/loading/background | data/phase/03/900  #9A1F1E | data/phase/03/100  #EFADAC |
| Loaded | truck-phases/loaded/background | data/phase/04/950  #7E7712 | data/phase/04/100  #E4D95F |
| To job | truck-phases/to-job/background | data/phase/05/900  #1E6252 | data/phase/05/100  #75DFC7 |
| On site | truck-phases/on-site/background | data/phase/06/900  #872781 | data/phase/06/100  #ED9CE6 |
| Pouring | truck-phases/pouring/background | data/phase/07/900  #193C9B | data/phase/07/100  #BECDF5 |
| Washing | truck-phases/washing/background | data/phase/08/900  #126886 | data/phase/08/100  #B9DEEA |
| Return to plant | truck-phases/return-to-plant/background | data/phase/09/900  #9C0F5A | data/phase/09/100  #F6A4CF |
| Ignition off | truck-phases/ignition-off/background | data/phase/02/900  #525252 | data/phase/02/100  #BABABA |
| Label, all nine | truck-phases/<phase>/label | neutral/0  #FFFFFF | neutral/950  #171614 |
| Shape and type | from Badge | 20 tall; 0 8; radius 16; 12 / 500 | Same |

### Accessibility

- The phase name is the accessible content; the pill is a <span> with no role and never takes focus. In a table the cell is what gets announced.
- All eighteen pairs pass 4.5:1; Loaded light is the closest at 4.63:1, which is why it sits on the 950 step rather than 900.
- Colour-blind users get nothing from the hue; the label does the work, by design. Legends pair the dot with the name.

### Known gaps

- None open.
