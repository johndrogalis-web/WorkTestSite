# Verifi Design System — site map and library outline

Draft for review. Nothing gets rebuilt until this is marked up and agreed.

---

## 1. The feedback, restated

Your teammate liked Adobe Spectrum / Atlassian / Salesforce for their **organisation and
levels of detail**, not their surface. What I built reads as a marketing site. That is a fair
call, and it is fixable without going back to the plain document we had before.

Specifically, here is what made it read as marketing. Every one of these is something Spectrum
and Atlassian do not have:

| In the current build | What Spectrum / Atlassian do instead |
|---|---|
| Full-bleed photo hero with a logo-reveal video | Page title and one sentence, content starts immediately |
| Top navigation bar | Persistent left rail, always visible, never collapses on desktop |
| Three "route" cards, a statement band, a stat strip, a tagline image | A short paragraph and a link list |
| Components grouped by theme ("Choosing things", "Telling people things") | One component, one page, alphabetical |
| Marketing photography throughout | Component examples only; photography lives in the brand section |

**The fix is structural, not cosmetic.** Side rail, one page per component, a fixed page
template, and everything above the fold being the thing you came for.

---

## 2. Navigation

Left rail, persistent, no top nav. Search at the top. Components listed alphabetically,
because that is how people look for them once they know the name.

```
┌──────────────────────┬─────────────────────────────────────┬──────────────┐
│ verifi design system │  Breadcrumbs                        │ ON THIS PAGE │
│ ┌──────────────────┐ │  Status: has gaps · Figma ↗         │              │
│ │ Search           │ │                                     │ Anatomy      │
│ └──────────────────┘ │  Breadcrumbs show where a page sits │ Options      │
│                      │  in a hierarchy and let someone     │ States       │
│ GET STARTED          │  climb back up it.                  │ Behaviour    │
│   Overview           │                                     │ Guidelines   │
│   For designers      │  ┌───────────────────────────────┐  │ Specs        │
│   For developers     │  │  Fleet › Rockdale › Truck 4417│  │ Code         │
│                      │  └───────────────────────────────┘  │ Gaps         │
│ FOUNDATIONS          │        [ Light | Dark ]             │              │
│   Colour             │                                     │              │
│   Typography         │  Anatomy ─────────────────────────  │              │
│   Spacing & layout   │  ...                                │              │
│   Shape              │                                     │              │
│   Motion             │                                     │              │
│   Accessibility      │                                     │              │
│   Truck phases       │                                     │              │
│                      │                                     │              │
│ COMPONENTS           │                                     │              │
│   All components     │                                     │              │
│   Breadcrumbs      ◀ │                                     │              │
│   Button             │                                     │              │
│   Checkbox           │                                     │              │
│   ...                │                                     │              │
│                      │                                     │              │
│ BRAND                │                                     │              │
│   Logo               │                                     │              │
│   Colour & type      │                                     │              │
│   Imagery            │                                     │              │
│                      │                                     │              │
│ Open items           │                                     │              │
└──────────────────────┴─────────────────────────────────────┴──────────────┘
```

Under 900px the rail collapses behind a button and the on-this-page column moves to the top
of the content as a collapsed list.

---

## 3. Site map — version 1

**23 pages.** Down from 27, but the shape is completely different: fewer overview pages, more
component pages, one page per component.

### Get started — 3 pages

| Page | Holds |
|---|---|
| Overview | What this is, the two sources (Identity Guidelines vs Trinity), how to read a component page, who to ask |
| For designers | Where the Figma libraries are, which components are safe to use, what is not drawn yet |
| For developers | The whole token block, how to use the downloads, the contrast failures, the sets not to build against |

*This replaces the three "route" cards on the old landing page and the four Resources pages.*

### Foundations — 7 pages

| Page | Holds |
|---|---|
| Colour | Both themes, the three jobs colour does, where brand and product disagree |
| Typography | The 20 published styles, two weights, when mono is allowed |
| Spacing & layout | The 4px grid, gutters, the page anatomy, the 280px rail |
| Shape | Four radii and what each one means, borders vs shadows |
| Motion | Four durations, one easing curve, reduced motion |
| Accessibility | Contrast measured live, the two failures, keyboard and focus rules |
| Truck phases | The nine phases, both themes, measured — the most Verifi-specific page in the system |

### Components — 12 pages in v1, one page each

Chosen on one test: **can you build a Hub screen without it?**

| Component | Why it is in v1 |
|---|---|
| Breadcrumbs | You asked for it; Figma node supplied |
| Button | Every screen |
| Checkbox | Every filter and form |
| Dropdown | Every form |
| Modal | Every destructive action |
| Radio group | Every form |
| Table | You asked for it; it is the product's core surface |
| Tabs | Every detail view |
| Text field | Every form, and the template for the other eight input types |
| Toast | Every save |
| Toggle | Every instant setting |
| Truck phase tag | The single most Verifi-specific component in the library |

Plus **All components** — the 45-item catalogue index that already exists, kept as the register
of what the library contains and what state each one is in. Components without a page yet are
listed there and say so.

### Brand — 3 pages

Compressed from 8. Sales and marketing still need this, but it does not need to lead.

| Page | Holds |
|---|---|
| Logo | Symbol / wordmark / logotype, clear space, minimum sizes, the eight misuses |
| Colour & type | The brand palette with Pantone and CMYK, ABC Repro, where yellow is allowed |
| Imagery | The three photographic categories, the fifth element, the horizon line |

### Plus

| Page | Holds |
|---|---|
| Open items | The nine undecided questions. Keep as-is; it is the most useful page on the site |

---

## 4. Version 2 and later — not now

Listed so it is clear what "pull back" means rather than "drop".

**Wave 2 — 12 more component pages:** Accordion · Badge · Banner · Card / Widget · Chip ·
Message · Pagination · Popover · Search · Segmented control · Side navigation · Tooltip

**Wave 3:** Avatar · Image block · Page layout · Progress bar · Slider · Spinner

**Wave 4 — Hub-specific:** Account selector · Active alerts · Map · Map legends · Map markers ·
Truck card · Widget types

**Deliberately not planned:** blog, news, release notes, careers, Figma plugin pages,
"other libraries", contribution process. Atlassian has all of these. We do not need any of them
to ship a useful library.

---

## 5. The component page template

**Every component page has these sections, in this order, with no exceptions.** That
predictability is the thing your teammate liked about Spectrum — once you have read one page,
you know where everything is on all of them.

| # | Section | What goes in it |
|---|---|---|
| 1 | **Header** | Name, one-sentence definition, status pill, link to the Figma node, last changed date |
| 2 | **Example** | The live component with a light / dark switch. First thing on the page, above the fold |
| 3 | **Anatomy** | The component with its parts labelled and named |
| 4 | **Options** | Every variant, each with its own example **and its own Copy HTML / Copy CSS** |
| 5 | **States** | Default, hover, focus, active, selected, disabled, error, loading — whichever apply |
| 6 | **Behaviour** | What it does when used: overflow, truncation, timing, dismissal, keyboard |
| 7 | **Guidelines** | Do / don't pairs, each one shown rather than described |
| 8 | **Specs** | The numbers table — sizes, padding, radii, type, gaps |
| 9 | **Accessibility** | Keyboard map, focus treatment, contrast, what a screen reader announces |
| 10 | **Code** | Full component HTML and CSS, with the download buttons |
| 11 | **Known gaps** | What Figma does not answer, and what we did instead |

Sections 1–9 are Spectrum's structure almost exactly. 10 and 11 are ours, and 11 is the one
that makes this honest rather than aspirational.

---

## 6. Downloads — the part you flagged

You said: *"I am not thinking CSS for all the buttons — whatever button you are looking for,
kind of thing."* Understood. Two levels, and the per-variant one is the default.

### Per variant, inline with the example

Every variant block in **Options** carries its own pair of buttons:

```
  Primary button                          [ Copy HTML ]  [ Copy CSS ]
  ┌──────────────┐
  │     Done     │        ← the example
  └──────────────┘
```

`Copy CSS` gives you the rules for **that variant only** — the base class plus the primary
modifier, nothing else. Not the danger variant, not the ghost variant, not the sizes you did
not ask for.

### Whole component, at the top of the Code section

```
  [ ⤓ button.html ]   [ ⤓ button.css ]
```

Two real files. `button.css` is self-contained: it opens with the `:root` token block it needs,
so it works pasted into an empty project with no build step and no imports. `button.html` has
every variant marked up with the classes that CSS expects.

### What is not happening

No "download the entire design system" button. No npm package. No zip of 45 components. If that
becomes useful later it is easy to add, but it is not what anyone is asking for today.

---

## 7. What gets cut

Being explicit so there are no surprises when it lands.

| Cut | Reason |
|---|---|
| Photo hero and logo-reveal video on the landing page | The thing that made it read as marketing |
| Top navigation | Replaced by the left rail |
| Statement band, stat strip, tagline image | Marketing furniture |
| The three "route" cards | Becomes three ordinary links in Get started |
| The four Resources pages | Folded into Get started (3 pages) and Open items |
| Grouped component pages — "Choosing things", "Telling people things", "Getting around", "Containers" | Replaced by one page per component |
| Five brand pages — idea, colour, type, fifth element, voice | Compressed into three |

**Kept:** the 45-component catalogue, the live contrast calculator, the open-items register,
the light/dark bench, the copy-CSS mechanism, the token block, and the photography — moved into
the brand section where it belongs.

---

## 8. Decisions I need from you and your teammate

1. **Does Brand stay in this site at all?** It is the biggest single contributor to the
   marketing feel. Three options: keep it compressed to 3 pages as proposed; move it to its own
   separate site and link out; or drop it and point at the Figma file. **My recommendation:
   keep the 3 pages** — sales and marketing are a stated audience and they have nowhere else to
   go — but the brand section should look like every other page, no full-bleed imagery.

2. **Is 12 the right v1 component list?** Swap anything. The only two I would defend hard are
   Table and Truck phase tag, because nothing else in the product works without them.

3. **Alphabetical or grouped component list in the rail?** Spectrum is alphabetical. Atlassian
   groups. **My recommendation: alphabetical**, because grouping is what produced "Choosing
   things" and nobody could find the checkbox.

4. **Does the whole-component download need to be a real file download, or is Copy enough?**
   Real downloads are slightly more work and need the site served over http (they will not work
   from a double-clicked local file in every browser). Copy works everywhere.

---

---

## Decisions (agreed, 16 September)

| # | Question | Answer |
|---|---|---|
| 1 | Does Brand stay in the site? | **Yes, compressed to 3 pages** — Logo, Colour and type, Imagery. Styled like every other page, no full-bleed hero. |
| 2 | How many component pages in the first pass? | **The 12 proposed.** Breadcrumbs and Table built first from their Figma specs, as the pages that prove the template. |
| 3 | Component list in the rail | **Alphabetical**, like Spectrum. |
| 4 | Downloads | **Copy only** for now. Per-variant Copy HTML and Copy CSS; no file downloads, no whole-system bundle. |

### Rail grouping (added 17 September)

A flat alphabetical list of 45 components is ~45 rows, which is more than a rail
can hold. The components are now grouped by **Trinity's own family names** —
Actions, Navigators, Form elements, Informers, Containers, Hub — and each family
collapses.

Why the file's taxonomy rather than nicer English: the point of grouping is that
you can predict where something lives. A designer who finds Checkbox under Form
Elements in Figma finds it under Form elements here. Invented thematic names
("Choosing things") were the thing that failed last time, and they failed because
nobody could guess them.

How it behaves:

- The family containing the page you are on opens automatically and is marked.
- Families you open yourself stay open as you navigate, for the session.
- Typing in the filter box opens every family so nothing hides behind a collapsed
  header, and hides families with no match. Clearing it puts them back.
- Alphabetical **within** each family. The alphabetical decision stands; it now
  applies inside a set of 5–10 rather than across 45.
- `All components` sits above the families as the flat, filterable escape hatch.

At 45 components this is ~20 visible rows instead of 45. At 90 it is still ~20,
because the number of families does not grow with the number of components.

**Built and delivered:** 27 pages in `design-system/`. The rail, the page template, all
12 component pages, 7 Foundations pages, 3 Brand pages and the open-items register.

Breadcrumbs turned out to have a complete written specification in Figma (v1.0 draft,
March 2026) — placement, the 30-character truncation rule, the content-shedding order,
responsive behaviour down to 375px, keyboard map and screen-reader announcements. That
page is built entirely from it. Table gave up its full Cell → Row content → Row
architecture plus four real conflicts with the rest of the system, all four now logged
as open item 08.

---

## 9. What happens next, once this is agreed

1. Rebuild the shell — left rail, compact index page, no top nav.
2. Build **Breadcrumbs** and **Table** first, from the Figma nodes you supplied, as the two
   reference pages that prove the template.
3. Port the remaining 10 v1 components onto the same template.
4. Rebuild Foundations and Brand at the reduced page count.
5. Verify and hand back.

Breadcrumbs and Table go first on purpose: if the template is wrong, it is better to find out
on two pages than on twelve.
