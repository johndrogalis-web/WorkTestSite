# STRUCTURE — how this prototype is organized, and how to add to it

This file answers two questions: "which file do I open?" and "where does a
new page go?". The prefix map at the top of `index.html` is the quick lookup;
this is the reasoning behind it and the rules that keep it true.

## The five rules

**1. One nav item lives in one place.**
Every item in the left rail maps to exactly one file, or to one `FILE:` banner
block inside a bundle. A new *view* inside a section (a tab, a drawer, a
device-frame variant, a popover) goes into that section's file. It never gets
a file of its own. If you cannot find the section's file from the nav label,
the rule has been broken and the fix is to move the code, not to add a map
entry.

**2. Prefix equals file.**
Every id, class, function and global in a file starts with that file's prefix
(`ba-`, `sl-`, `db-`, `tk-` …). When you see `ba-tr--wait` in the inspector
you already know the file. A file may own more than one prefix (the ticket
drawer owns `tkx- tkm- so-`), but a prefix never spans two files. New code
picks an unused two or three letter prefix and adds it to the map in
`index.html` in the same commit.

**3. A new section registers, it does not wrap.**
Today every section adds itself by replacing `window.dtNavGo` with a wrapper,
copying a list of sibling pages to hide, and writing its own nav-light
function. That chain is nine deep and each layer hides pages by its own list,
which is where the "page stuck on top of another page" bugs come from. Until
the registry exists (see *Later* below), a new section copies the pattern in
`app-25-batch-assistant.js` exactly, including adding itself to every older
section's sibling list. Once the registry ships, a new section is one call and
no wrapper.

**4. Tooling talks to the app only through the contract.**
`comments.js`, `router.js`, `testing.js`, `testing-questions.js` and
`app-23-viewport-continuity.js` are the authoring layer. They are meant to be
lifted onto other prototypes, and eventually into a standalone harness that
loads a prototype and tests it. So they may depend on these things and nothing
else:

- stable element ids on containers (`dt-page-*`, `tb-page-*`, `mob-page-*`,
  drawers, scroll regions)
- `body.view-desktop|tablet|mobile` and `body.orient-landscape`
- the hash route grammar `<surface>/<page>[/<sub>]` and `setHash()` /
  `readHashParts()`
- the app's entry points named in the route registrations

Anything app-specific inside a tooling file (route registrations, the list of
sections, the nav-lighting fix for mobile tickets) sits under an
`/* APP-SPECIFIC */` banner so it can be cut out into a `routes.js` that ships
with the app, leaving the engine portable.

**5. Flat directory, one archive folder.**
Everything loads from the same directory as `index.html`. Nothing moves into
subfolders; GitHub Pages URLs, `?jump=` links and `testdrawer.js` all assume
flat paths. Superseded originals move to `archive/`, which nothing loads.
`testdrawer.js` strips `tooling.js` (it used to strip `comments.js` and
`testing.js` by name) so the drawer test still runs without network tooling.

## Load order

Load order is the whole reason concatenation is safe: every file shares one
global scope and each later file captures or wraps what earlier files defined.
Bundles keep the relative order of their parts, and a bundle sits in the load
order at the slot of its **earliest** part. Never reorder script tags to make
something "cleaner".

```
shared-data.js
app-01 … app-06          core (Diagnostic Center, split once already for size)
tickets.js               ← app-07, 08, 10, 12, 20   ✔ shipped
dashboard.js             ← app-13, 22            ✔ shipped
account.js               ← app-14, 15, 16, 17       ✔ shipped
sections.js              ← app-18, 21, 24, 25        ✔ shipped (+ sections.css ← app-24/25 .css)
tooling.js               ← comments, router, testing, testing-questions,
                           testing-cache (new), app-23                 ✔ shipped
leaflet (CDN, last)
```

Result: 28 script tags → 12 (shared-data, the six core files, and five
bundles), and 4 stylesheets → 3 (shared, styles, sections).

## Why a bundle is safe, and the one thing to check

Concatenating classic scripts in load order preserves behaviour because:

- top-level `var` / `function` already land on `window` either way
- `window.x = function` wrappers run in the same order either way
- duplicate top-level `let`/`const` across files would already throw today, so
  merged files cannot introduce a collision that did not exist

The one thing that **does** change is hoisting. Inside one file, a
`function foo() {}` declaration is visible from line one. So a load-time guard
in an earlier part such as `typeof foo === 'function'` that today returns
`false` (because `foo` is declared in a later file) would return `true` after
the merge. Before merging, grep every part for:

1. duplicate top-level names across the parts
2. `typeof <name>` guards at load time (outside functions) naming a function
   *declared* in a later part
3. any bare reference in an earlier part to a name that only a later part
   defines

`window.x = …` assignments do not hoist and are not a hazard.

## Per-bundle checklist

1. Run the three greps above; record "none" or resolve.
2. Concatenate in load order with a `FILE:` banner per original. Do not edit
   the bodies. The original header comments stay where they are.
3. `node --check bundle.js`.
4. Replace the parts' script tags with one tag at the earliest part's slot.
5. Update the prefix map in `index.html`.
6. Run `testdrawer.js` (and, for the bundle in hand, a before/after jsdom
   snapshot of the affected surface: same clicks on both trees, diff the
   rendered HTML — `verify-dashboard.js`, `verify-tickets.js`, `verify-account.js`,
   `verify-sections.js` and `verify-tooling.js` are the
   templates; run `node verify-x.js base` and `node verify-x.js bund` against
   two copies of the folder and diff the two `snap-*.json` files).
7. Click through the affected section on all three frames and both themes.
8. Move the originals to `archive/`.

## Testing backend speed

`testing-cache.js` (inside tooling.js) and `Code.gs` work as a pair. The
backend accepts `?since=` on results and answers with only the newer rows
plus `partial:true`; the client keeps sessions in localStorage per prototype
and asks for deltas. Workflow and question lists are cached for a minute and
dropped when this browser writes. The backend also caches full responses for
45 seconds (chunked, version-keyed so a write is visible on the next read).
Either half works alone; together the first open is one full read per
browser and every open after that is a few rows. `tstCacheClear()` in the
console wipes the client store.

## Later, once the bundles are stable

- **Section registry.** Replace the `dtNavGo` wrapper chain with
  `vfSection({ id, label, prefix, desktop, tablet, mobile })`. One place owns
  "hide every other section", so no more per-file sibling lists.
- **routes.js.** Cut the `/* APP-SPECIFIC */` blocks out of `router.js` and
  `app-23` into a file that ships with the app. `tooling.js` becomes portable.
- **Harness.** A page that loads a prototype in an iframe and speaks the
  contract in rule 4. It is `tooling.js` plus the iframe plumbing; no app
  code moves.
