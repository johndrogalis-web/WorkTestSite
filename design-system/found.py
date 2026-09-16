#!/usr/bin/env python3
"""Foundations — seven pages."""
from core import (shell, copybar, bench, brow, spec, dodont, checklist, table, ARROW)
from comp_rest import PHASES

TOKENS_CSS = """/* ═══════════════════════════════════════════════════════════
   Verifi product tokens — Trinity v0.1.3
   Paste into your root stylesheet. Both themes included.
   Brand (marketing) values differ; see Brand → Colour and type.
   ═══════════════════════════════════════════════════════════ */
:root {
  color-scheme: light dark;

  /* Surfaces */
  --base:        #f6f4f2;   /* the page behind the main panel */
  --layer-1:     #ffffff;   /* content cards, drawers, widgets */
  --layer-2:     #f6f4f2;   /* inset areas, inputs, alternate rows */

  /* Ink — alpha over the surface, not solid colours */
  --strong:      #36322dff; /* headings */
  --defined:     #36322dc2; /* body and table text */
  --soft:        #36322d9e; /* secondary text */
  --subtle:      #36322d80; /* placeholders — fails contrast, see Accessibility */

  /* Lines */
  --border:      #36322d24;
  --border-mid:  rgba(54,50,45,.30);

  /* Interaction */
  --select:      #3069e3;   /* the item you are on */
  --on-select:   #ffffff;
  --hover:       rgba(48,105,227,.05);
  --blue-link:   #295ccc;
  --focus-ring:  #36322d;

  /* System */
  --red:         #d70100;
  --amber:       #ffba0d;
  --green:       #16a34a;

  /* Shape */
  --radius-xs:   2px;
  --radius-sm:   4px;
  --radius-md:   16px;
  --radius-lg:   20px;
  --radius-pill: 32px;
  --input-radius:100px;

  /* Type */
  --font:      'ABC Repro','Helvetica Neue',Helvetica,Arial,sans-serif;
  --font-mono: 'DM Mono',ui-monospace,SFMono-Regular,Menlo,monospace;

  /* Motion — nothing bounces */
  --t-fast:  .14s;
  --t-slide: .38s;
  --ease:    cubic-bezier(.22,1,.36,1);
}

@media (prefers-color-scheme: dark) {
  :root {
    --base:       #171614;
    --layer-1:    #211f1c;
    --layer-2:    #2f2d28;
    --strong:     #ffffffff;
    --defined:    #e5e5e5de;
    --soft:       #e5e5e5bf;
    --subtle:     #e5e5e566;
    --border:     #e5e5e51f;
    --border-mid: rgba(229,229,229,.25);
    --select:     #e3f200;    /* lime is dark-mode only */
    --on-select:  #000000;
    --hover:      rgba(227,242,0,.05);
    --blue-link:  #ffffff;
    --focus-ring: #ffffff;
  }
}"""


def f_colour():
    def swatches(items):
        out = '<div class="swatches">'
        for name, hexv in items:
            out += ('<div><span class="chip" style="background:%s"></span>'
                    '<span class="meta2"><span class="nm">%s</span>'
                    '<span class="hx">%s</span></span></div>' % (hexv, name, hexv))
        return out + '</div>'

    ink = ('<div class="bstack">'
           '<span style="color:var(--tx);font-size:17px">--strong &mdash; headings</span>'
           '<span style="color:var(--tx2);font-size:15px">--defined &mdash; body and table text</span>'
           '<span style="color:var(--tx3);font-size:15px">--soft &mdash; secondary text</span>'
           '<span style="opacity:.5;font-size:13px">--subtle &mdash; placeholders and small print</span>'
           '</div>')

    body = f"""
<h1>Colour.</h1>
<p class="lede">Colour in the product does three jobs and no others: it tells you what surface
   you are on, what you have selected, and what needs attention. Everything else is ink on a
   surface.</p>

<h2 id="jobs">The three jobs</h2>
{table(['Job', 'Colours', 'Rule'], [
  ['Surface', 'Base, Layer 1, Layer 2',
   'Three near-neutrals. They tell you what is on top of what, and nothing else.'],
  ['Selection', 'Blue in light, lime in dark',
   'Exactly one meaning: the thing you are on. Never decoration, never emphasis.'],
  ['Attention', 'Red, amber, green, and the nine phase colours',
   'Something happened or something is in a state. Always paired with words.'],
])}
<div class="note stop"><b>There is no fourth job.</b> If you are reaching for colour to make
  something look nicer, the answer is a border, a surface change, or more space.</div>

<h2 id="surfaces">Surfaces</h2>
{bench(
  '<div class="bstack"><div style="background:var(--bg);padding:14px 16px;border-radius:8px;'
  'width:100%;box-shadow:inset 0 0 0 1px var(--bd)"><span style="font-size:13px">--base</span>'
  '<div style="background:var(--l1);padding:14px 16px;border-radius:8px;margin-top:10px;'
  'box-shadow:inset 0 0 0 1px var(--bd)"><span style="font-size:13px">--layer-1</span>'
  '<div style="background:var(--l2);padding:10px 12px;border-radius:6px;margin-top:10px">'
  '<span style="font-size:13px">--layer-2</span></div></div></div></div>',
  '<div class="bstack"><div style="background:var(--bg);padding:14px 16px;border-radius:8px;'
  'width:100%;box-shadow:inset 0 0 0 1px var(--bd)"><span style="font-size:13px">--base</span>'
  '<div style="background:var(--l1);padding:14px 16px;border-radius:8px;margin-top:10px;'
  'box-shadow:inset 0 0 0 1px var(--bd)"><span style="font-size:13px">--layer-1</span>'
  '<div style="background:var(--l2);padding:10px 12px;border-radius:6px;margin-top:10px">'
  '<span style="font-size:13px">--layer-2</span></div></div></div></div>',
  'Base is the page. Layer 1 is the floating content card. Layer 2 is an inset inside it.')}

<h2 id="ink">Ink</h2>
<p>The four ink tokens carry <strong>alpha, not solid colour</strong>. <code>--defined</code> is
   <span class="m">#36322D</span> at 76%, so text picks up whatever surface it sits on. That is
   also why contrast has to be composited before it is measured &mdash; comparing the raw hex
   gives the wrong answer.</p>
{bench(ink, ink)}

<h2 id="selection">Selection</h2>
<div class="note warn"><b>Lime is dark-mode only.</b> <code>--select</code> is
  <span class="m">#3069E3</span> in light and <span class="m">#E3F200</span> in dark. If lime
  appears on a light screen, a token has been hardcoded somewhere. An early screenshot showed
  lime in light mode; that was an error, not intent, and it has been ruled on.</div>
<p>Hover is a 5% tint of the selection colour, in both themes. Never grey. That single decision
   is most of why the product does not feel washed out.</p>

<h2 id="tokens">The whole token set</h2>
{copybar('Trinity tokens', 'tok', 'both themes', None, TOKENS_CSS)}

<h2 id="brand">Where brand and product disagree</h2>
<p>Five values differ between the Identity Guidelines and Trinity. Four look like drift. One is
   a real difference that needs a decision.</p>
{table(['Value', 'Brand', 'Product', 'Read'], [
  ['Blue', '<span class="sw" style="background:#1594ef"></span><span class="m">#1594EF</span>',
   '<span class="sw" style="background:#3069e3"></span><span class="m">#3069E3</span>',
   '<b>A real difference.</b> #3069E3 appears in neither brand palette.'],
  ['Black', '<span class="sw" style="background:#2e2b27"></span><span class="m">#2E2B27</span>',
   '<span class="sw" style="background:#36322d"></span><span class="m">#36322D</span>', 'Drift.'],
  ['Grey 100', '<span class="sw" style="background:#faf9f6"></span><span class="m">#FAF9F6</span>',
   '<span class="sw" style="background:#f6f4f2"></span><span class="m">#F6F4F2</span>', 'Drift.'],
  ['Grey 650', '<span class="sw" style="background:#706a5c"></span><span class="m">#706A5C</span>',
   '<span class="sw" style="background:#7f796c"></span><span class="m">#7F796C</span>', 'Drift.'],
  ['Blue 0', '<span class="sw" style="background:#eef9ff"></span><span class="m">#EEF9FF</span>',
   '<span class="sw" style="background:#c5e4fb"></span><span class="m">#C5E4FB</span>',
   'Different tints, same intent.'],
])}
<p>Two values match exactly: Blue 600 <span class="m">#0975C3</span> and Blue 900
   <span class="m">#032D3D</span>. Which suggests the product palette was derived from the brand
   one and then edited. <a href="../open-items.html">Tracked as open item 01.</a></p>

<h2 id="yellow">Yellow</h2>
<p>Verifi Yellow means two different things in two different places, and both are correct.</p>
{table(['Domain', 'What yellow is', 'Example'], [
  ['Marketing', 'The call to action', 'The Request a demo button on verificoncrete.com'],
  ['Product', 'The dark-mode selection colour', 'The active item in the Hub sidebar, at night'],
])}
<p>So a yellow button on a landing page is right, and a yellow button in a screenshot of the Hub
   is wrong. Same colour, two domains, no conflict &mdash; recorded so nobody
   &ldquo;fixes&rdquo; one of them.</p>
"""
    return shell('Colour', 'Product colour tokens for both themes, and where the brand and the '
                 'product disagree.', 'foundations/colour.html', body,
                 crumb=['Foundations', 'Colour'],
                 toc=[('jobs', 'The three jobs'), ('surfaces', 'Surfaces'), ('ink', 'Ink'),
                      ('selection', 'Selection'), ('tokens', 'The token set'),
                      ('brand', 'Brand vs product'), ('yellow', 'Yellow')])


def f_type():
    scale = [('Display', '216 / 200', '500', 'Covers and campaign headlines only'),
             ('H1', '48 / 52', '500', 'Page title in marketing layouts'),
             ('H2', '32 / 38', '500', 'Section heading'),
             ('H3', '24 / 30', '500', 'Sub-section'),
             ('Page title', '24 / 30', '500', 'The Hub page title. Letter-spacing −0.72px'),
             ('Stat value', '40 / 44', '500', 'KPI numbers. Letter-spacing −1.2px'),
             ('Body lg', '16 / 24', '400', 'Long-form reading'),
             ('Body', '14 / 20', '400', 'The product default'),
             ('Body sm', '14 / 18', '400', 'Breadcrumbs, dense rows'),
             ('Label', '14 / 18', '400', 'Form labels'),
             ('Button', '14 / 20', '500', 'All button labels'),
             ('Table header', '13 / 16', '500', 'Column names'),
             ('Table cell', '13–14 / 16', '400', 'Row content'),
             ('Caption', '12 / 14', '400', 'Helper text, small print'),
             ('Phase pill', '12 / 12', '400', 'Never bold, never uppercase'),
             ('Version pill', '10 / 12', '400', 'Mono. The only routine mono use')]
    rows = ''.join('<tr><td>%s</td><td class="m">%s</td><td class="m">%s</td><td>%s</td></tr>'
                   % r for r in scale)

    body = f"""
<h1>Typography.</h1>
<p class="lede">One typeface, two weights, sixteen published styles. ABC Repro does everything
   except code, and the restraint is deliberate.</p>

<h2 id="face">ABC Repro</h2>
<div class="plate">
  <div style="text-align:center">
    <p style="font-size:clamp(48px,9vw,96px);line-height:1;margin:0;color:var(--ink);
              font-weight:500;letter-spacing:-.03em">Aa</p>
    <p class="cap" style="margin:16px 0 0">ABC Repro &middot; Regular 400 and Medium 500</p>
  </div>
</div>
<p>The product uses <strong>two weights</strong>. Regular for everything you read, Medium for
   everything you act on or scan &mdash; headings, buttons, labels, table headers. There is no
   Bold in the interface. If something needs more emphasis than Medium, it needs a different
   position on the page, not a heavier weight.</p>
<div class="note"><b>ABC Repro is licensed.</b> It is not bundled with this site, so pages fall
  back to Helvetica or Arial for anyone who does not have it installed. That is a fallback, not
  a substitute &mdash; product builds should load the real webfont.</div>

<h2 id="scale">The published styles</h2>
<div class="tw"><table>
  <thead><tr><th>Style</th><th class="m">Size / line</th><th class="m">Weight</th><th>Where</th></tr></thead>
  <tbody>{rows}</tbody>
</table></div>

<h2 id="mono">Mono is rare</h2>
<p>DM Mono appears in exactly three places: version pills, identifiers in a detail view, and
   code samples like the ones on this site.</p>
<div class="note stop"><b>Table columns stay proportional.</b> A column of numbers uses tabular
  figures from the proportional face, not the mono face. Setting a whole column in mono is a
  common instinct and it is wrong &mdash; it changes the texture of the table and makes it
  harder to read, not easier.</div>

<h2 id="rules">Rules that hold everywhere</h2>
{checklist([
  'Never set body text below <span class="m">14px</span> in the product. Captions at 12px are '
  'for genuinely secondary information.',
  'Line length tops out around 74 characters. Past that, reading breaks down.',
  'Headings get negative letter-spacing; body text gets none.',
  'Never letter-space lowercase text.',
  'Uppercase is for eyebrows and column headers only, and always with letter-spacing added.',
  'Never justify. Ragged right, always.',
])}
"""
    return shell('Typography', 'ABC Repro, two weights, and the sixteen published styles.',
                 'foundations/typography.html', body,
                 crumb=['Foundations', 'Typography'],
                 toc=[('face', 'ABC Repro'), ('scale', 'The published styles'),
                      ('mono', 'Mono is rare'), ('rules', 'Rules')])


def f_spacing():
    steps = [('4', 'Icon to its label, tight internal gaps'),
             ('8', 'Between related controls, chip padding'),
             ('10', 'Toolbar gap, between form options'),
             ('12', 'Card internal padding at small sizes'),
             ('16', 'Card and widget padding'),
             ('24', 'Page gutters, section spacing'),
             ('32', 'Between major sections'),
             ('48', 'Between page regions')]
    rows = ''.join('<tr><td class="m">%spx</td><td>%s</td></tr>' % s for s in steps)

    body = f"""
<h1>Spacing and layout.</h1>
<p class="lede">Everything sits on a 4px grid. Page gutters are 24px. The Hub content area is a
   floating card on a slightly darker page, and that one idea drives the whole frame.</p>

<h2 id="grid">The 4px grid</h2>
<p>Every dimension in the product is a multiple of four. Not because four is magic, but because
   one rule that is always true beats a hundred judgement calls.</p>
<div class="tw"><table>
  <thead><tr><th class="m">Step</th><th>Used for</th></tr></thead>
  <tbody>{rows}</tbody>
</table></div>

<h2 id="frame">The app frame</h2>
{spec([
  ('Sidebar', '<span class="m">280px</span>, on a surface slightly darker than the content'),
  ('Content', 'A floating card &mdash; <span class="m">12px</span> radius, soft shadow, '
              '<span class="m">8px</span> inset from the viewport edge'),
  ('Gutters', '<span class="m">24px</span>'),
  ('Sidebar items', '<span class="m">14px</span> text, <span class="m">10px / 8px</span> padding, '
                    '<span class="m">8px</span> radius'),
  ('Sidebar icons', '<span class="m">16px</span> at 60% opacity, 100% when active'),
  ('Sidebar footer', 'Account picker in a bordered card, then Profile, Support, Settings'),
])}
<div class="note"><b>Session scope lives in the sidebar.</b> A separate Account / Division /
  Region / Plant scope bar appeared in early consultant screens and was cut. It will not be in
  the Verifi build. The account picker in the sidebar footer is where scope is set.</div>

<h2 id="page">Page order</h2>
<p>Every Hub page stacks in the same order. Sticking to it is most of what makes the product
   feel like one product rather than twelve.</p>
<div class="plate" style="justify-content:flex-start;display:block;padding:24px 28px">
  <p class="m" style="font-size:13px;line-height:2.1;margin:0;color:var(--ink-soft)">
    title row<br>&darr; <span style="color:var(--ink-faint)">(stat band)</span><br>&darr;
    toolbar<br>&darr; <span style="color:var(--ink-faint)">(tabs)</span><br>&darr;
    content<br>&darr; <span style="color:var(--ink-faint)">(pagination)</span></p>
</div>
{spec([
  ('Page title', '<span class="m">24px / 500</span>, letter-spacing <span class="m">&minus;0.72px</span>'),
  ('Subtitle', '<span class="m">12&ndash;13px</span> in <code>--soft</code>'),
  ('Right slot', 'Either &ldquo;Last updated: Today, 9:42 AM&rdquo; <em>or</em> one page action '
                 'as an outline pill. Not both.'),
  ('Stat band', 'Full-width flex row, cells divided by 1px hairlines &mdash; not boxed cards. '
                'Label <span class="m">16px</span> above value <span class="m">40px / 500</span>. '
                '3 to 6 stats.'),
  ('Toolbar', '<span class="m">44px</span> controls, <span class="m">10px</span> gap'),
])}

<h2 id="toolbar">The toolbar</h2>
<p>Left to right, always in this order:</p>
{checklist([
  'Pill search input, with a placeholder listing what is searchable &mdash; '
  '&ldquo;Ticket, truck, order, mix, etc.&rdquo;',
  'Filters button with a funnel icon. Active state is a blue border, 6% blue background and a '
  'count badge.',
  'One quiet primary action &mdash; &ldquo;+ New ticket&rdquo;, as an outline pill, not filled.',
  'Columns menu (eye icon plus chevron).',
  'Export, icon-only, <span class="m">44 &times; 44</span>.',
  'Right-aligned: the segmented view switcher.',
])}

<h2 id="tables">Table framing</h2>
{dodont(
  ['<b>Full-bleed</b> for a primary page table. No outer border, no clipping. The page gutters '
   'are the table edges.'],
  ['<b>Boxed</b> for a table inside a widget or card: 1px border, 8px radius, clipped.'],
  'Full-bleed', 'Boxed')}
<p>The choice is contextual, not aesthetic. See <a href="../components/table.html">Table</a>.</p>
"""
    return shell('Spacing and layout', 'The 4px grid, the app frame, and the order every Hub '
                 'page follows.', 'foundations/spacing.html', body,
                 crumb=['Foundations', 'Spacing and layout'],
                 toc=[('grid', 'The 4px grid'), ('frame', 'The app frame'),
                      ('page', 'Page order'), ('toolbar', 'The toolbar'),
                      ('tables', 'Table framing')])


def f_shape():
    radii = [('2', 'Checkbox'), ('4', 'Tags, small chips, banners, menu items at rest'),
             ('8', 'Sidebar items, messages, toasts, boxed tables'),
             ('16', 'Cards, widgets, accordions, modals, drawers'),
             ('20', 'Large containers. Rare — use 16 unless something is genuinely oversized'),
             ('32', 'Buttons, segmented controls, phase pills'),
             ('100', 'Inputs. A true pill at any height')]
    demo = ''.join('<div style="display:flex;align-items:center;gap:12px">'
                   '<span style="width:56px;height:34px;border-radius:%spx;background:var(--l2);'
                   'box-shadow:inset 0 0 0 1px var(--bd);display:inline-block"></span>'
                   '<span style="font-size:13px;color:var(--tx3)">%spx</span></div>'
                   % (r, r) for r, _ in radii)
    rows = ''.join('<tr><td class="m">%spx</td><td>%s</td></tr>' % r for r in radii)

    body = f"""
<h1>Shape.</h1>
<p class="lede">Corner radius is not decoration. It tells you what kind of object you are
   looking at, and it comes from the hardware &mdash; the rounded casing of the drum unit is
   where the interface gets its corners.</p>

<h2 id="radii">The radii</h2>
{bench('<div class="bstack">%s</div>' % demo, '<div class="bstack">%s</div>' % demo)}
<div class="tw"><table>
  <thead><tr><th class="m">Radius</th><th>Belongs to</th></tr></thead>
  <tbody>{rows}</tbody>
</table></div>
<div class="note"><b>Anything you press or type into is a pill.</b> Buttons, inputs, segmented
  controls, phase pills. Anything that holds content is 16. Everything else is 4. Those three
  sentences cover almost every decision.</div>

<h2 id="elevation">Borders and shadows</h2>
{dodont(
  ['Cards, widgets, tables and panels rest on the page. They get a <b>1px border</b>.',
   'The border is <code>--border</code> — <span class="m">#36322D</span> at 14%.',
   'To make a resting panel stand out, change its surface, not its elevation.'],
  ['Modals, drawers, popovers, toasts and menus float above the page. They get a <b>shadow</b>.',
   'Standard float: <span class="m">0 10px 30px rgba(0,0,0,.18)</span>. Modal: '
   '<span class="m">0 14px 40px rgba(0,0,0,.24)</span>.',
   'A floating surface still carries a 1px inset border so its edge survives on a dark theme.'],
  'Resting — border', 'Floating — shadow')}
<div class="note stop"><b>If you are reaching for a shadow to make a panel stand out, you want a
  border and a different background.</b> Elevation means &ldquo;this is above the page and the
  page is waiting&rdquo;. Using it for emphasis breaks the one thing shadows are for.</div>

<h2 id="borders">Border rules</h2>
{checklist([
  'There is <b>no dashed or dotted border</b> anywhere in this system, in any state, on any '
  'component. Not for errors, not for drop targets, not for empty states.',
  'Borders are 1px. The only 2px lines are the table header rule and the focus ring.',
  'An error is a border colour change, never a border style change.',
  'Dividers inside a component are 1px in <code>--border</code>; the first table column gets '
  '1.5px because it is an anchor, not a divider.',
])}
"""
    return shell('Shape', 'Four radii, what each one means, and when a shadow is allowed.',
                 'foundations/shape.html', body, crumb=['Foundations', 'Shape'],
                 toc=[('radii', 'The radii'), ('elevation', 'Borders and shadows'),
                      ('borders', 'Border rules')])


RM_CSS = """@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: .01ms !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}"""


def f_motion():
    body = f"""
<h1>Motion.</h1>
<p class="lede">Four durations, one easing curve, and a rule that decides everything else:
   nothing bounces.</p>

<h2 id="durations">The four durations</h2>
{spec([
  ('Colour and border', '<span class="m">0.12&ndash;0.15s</span>. Use <span class="m">0.14s</span>.'),
  ('Popovers and menus', '<span class="m">0.2s</span> &mdash; fade plus a 4&ndash;6px rise'),
  ('Drawers', '<span class="m">0.35&ndash;0.38s</span> &mdash; use <span class="m">0.38s</span>'),
  ('Tooltips', '<span class="m">0.2s</span> in, ease-out; <span class="m">0.2s</span> out, ease-in'),
])}
<p>The easing curve is <span class="m">cubic-bezier(.22, 1, .36, 1)</span> for anything that
   travels. Colour changes are linear &mdash; there is nothing to ease.</p>

<h2 id="nobounce">Nothing bounces</h2>
<div class="note stop"><b>No overshoot easing anywhere in the product.</b> Not on drawers, not
  on toasts, not on a success tick. Overshoot reads as playful, and this is software that people
  use to decide whether a load of concrete is within spec. The interface should feel certain,
  which means it arrives where it is going and stops.</div>

<h2 id="drawer">The drawer</h2>
<p>Clicking an entity in the Hub slides a drawer over a scrim rather than navigating away, so the
   list you were reading stays underneath. This is the main detail surface in the product, and it
   is a pattern rather than a component &mdash; nothing is drawn for it in Figma.</p>
{spec([
  ('Scrim', '<span class="m">rgba(54, 50, 45, 0.5)</span>'),
  ('Width', '<span class="m">clamp(860px, 100% &minus; 280&ndash;380px, 1400px)</span>'),
  ('Radius', '<span class="m">16px</span>, left corners only'),
  ('Motion', '<span class="m">0.38s cubic-bezier(.22, 1, .36, 1)</span> slide'),
  ('Chrome', 'Title left; previous and next arrows plus a solid close on the right'),
  ('Body order', 'Summary chip row, then key-value rows at <span class="m">32px</span>, then '
                 'bordered cards for alerts, each with one quiet outline action'),
])}

<h2 id="focus">Focus</h2>
<p>Focus is not motion, but it is the thing motion most often breaks.</p>
{checklist([
  'The focus ring is a <span class="m">2px</span> outline in <code>--strong</code> at '
  '<span class="m">2px</span> offset.',
  'It is never removed and never replaced by a colour change alone.',
  'It never animates in. A focus ring that fades is a focus ring somebody misses.',
])}

<h2 id="reduced">Reduced motion</h2>
<p>Every transition in the product is switched off for anyone who asks for less. This is not a
   nice-to-have: vestibular disorders are common, and a sliding drawer can be genuinely
   unpleasant.</p>
{copybar('Reduced motion', 'rm', 'required on every build', None, RM_CSS)}
<p>This site obeys it too &mdash; turn the setting on and everything here stops moving.</p>
"""
    return shell('Motion', 'Four durations, one curve, and why nothing bounces.',
                 'foundations/motion.html', body, crumb=['Foundations', 'Motion'],
                 toc=[('durations', 'The four durations'), ('nobounce', 'Nothing bounces'),
                      ('drawer', 'The drawer'), ('focus', 'Focus'),
                      ('reduced', 'Reduced motion')])


def f_a11y():
    body = f"""
<h1>Accessibility.</h1>
<p class="lede">Measured in your browser rather than claimed. Two of our colour pairs currently
   fail, and they are written down rather than quietly shipped.</p>

<h2 id="measured">Contrast, measured</h2>
<p>Text has to be bright enough against its background for people to read it, including anyone
   with weaker eyesight and anyone holding a tablet in direct sun. <strong>4.5 to 1 is the pass
   mark</strong> for normal text; 3 to 1 applies to large text only.</p>
<div class="tw"><table>
  <thead><tr><th>Text</th><th>On</th><th>Sample</th><th class="m">Ratio</th><th>Result</th></tr></thead>
  <tbody id="a11y-body"><tr><td colspan="5">Measuring&hellip;</td></tr></tbody>
</table></div>
<p class="cap" id="a11y-foot">&nbsp;</p>

<div class="note stop"><b>Two failures, both in light mode.</b> The faintest ink token,
  <code>--subtle</code>, is used for placeholders and small print and measures 2.87:1 on white
  &mdash; below even the large-text bar. The next shade up, <code>--soft</code>, reaches
  3.79&ndash;3.94:1, which is legal at 18px and above but not at the 12&ndash;13px it is
  actually used at.
  <a href="../open-items.html">Tracked as open item 03.</a></div>
<div class="note warn"><b>Until it is fixed:</b> do not ship placeholder text in
  <code>--subtle</code>. Use <code>--soft</code> at 14px or larger for anything a user has to
  read.</div>

<h2 id="phases">Phase colours</h2>
<p>Eighteen combinations &mdash; nine phases in two themes. One fails.</p>
<div class="tw"><table>
  <thead><tr><th>Phase</th><th>Light</th><th class="m">Ratio</th><th>Dark</th><th class="m">Ratio</th></tr></thead>
  <tbody id="ph-body"><tr><td colspan="5">Measuring&hellip;</td></tr></tbody>
</table></div>
<p class="cap" id="ph-foot">&nbsp;</p>

<h2 id="beyond">Beyond contrast</h2>
{table(['Rule', 'What it means here'], [
  ['<b>Never colour alone</b>',
   'Every phase label carries its name. Every alert badge carries a count. Colour is the fast '
   'read, never the only read.'],
  ['<b>44px targets</b>',
   'Anything clickable in a toolbar is 44px tall. The person using it may be wearing gloves in '
   'a truck yard.'],
  ['<b>Focus is always visible</b>',
   'A 2px outline at 2px offset, never removed. Tab through any component on this site.'],
  ['<b>Reduced motion</b>',
   'Everything that animates has a path for people who ask for less.'],
  ['<b>Errors are not just red</b>',
   'A red border and a written message. The message is what tells you what to fix.'],
  ['<b>Real markup</b>',
   'Real buttons, real inputs, real tables. A div with a click handler announces nothing.'],
])}

<div class="note"><b>Before you quote these numbers.</b> This is the standard WCAG 2.1
  calculation &mdash; the right tool for checking a palette and the wrong one for settling a
  single borderline case. Anything between 3:1 and 5:1 deserves a look on real hardware in real
  light.</div>

<script>
document.addEventListener('DOMContentLoaded',function(){{
  if (!window.vfRatio) return;
  var INK = [['--strong','#36322dff','Headings'],['--defined','#36322dc2','Body text'],
             ['--soft','#36322d9e','Secondary'],['--subtle','#36322d80','Small print']];
  var SURF = [['--layer-1','#ffffff'],['--base / --layer-2','#f6f4f2']];
  var rows='',pass=0,total=0,worst=99,wn='';
  INK.forEach(function(i){{
    SURF.forEach(function(s){{
      var r=window.vfRatio(i[1],s[1]), v=window.vfVerdict(r);
      total++; if(r>=4.5) pass++;
      if(r<worst){{worst=r;wn=i[2]+' on '+s[0];}}
      rows+='<tr><td class="m">'+i[0]+'<br><span style="font-family:var(--sans);font-size:13px;'
        +'color:var(--ink-faint)">'+i[2]+'</span></td><td class="m">'+s[0]+'</td>'
        +'<td><span style="background:'+s[1]+';color:'+i[1]+';padding:4px 10px;border-radius:4px;'
        +'font-size:14px">Slump 118 mm</span></td>'
        +'<td class="m">'+r.toFixed(2)+':1</td>'
        +'<td><span class="pill '+v[0]+'">'+v[1]+'</span></td></tr>';
    }});
  }});
  document.getElementById('a11y-body').innerHTML=rows;
  document.getElementById('a11y-foot').textContent =
    pass+' of '+total+' pass the 4.5:1 mark. Weakest: '+wn+' at '+worst.toFixed(2)+':1.';

  var P={{phase_js}};
  var pr='',fails=0,wl=99,wd=99;
  P.forEach(function(p){{
    var rl=window.vfRatio('#ffffff',p[1]), rd=window.vfRatio('#171614',p[2]);
    var vl=window.vfVerdict(rl), vd=window.vfVerdict(rd);
    if(rl<4.5) fails++; if(rd<4.5) fails++;
    if(rl<wl) wl=rl; if(rd<wd) wd=rd;
    pr+='<tr><td>'+p[0]+'</td>'
      +'<td><span class="c-phase" style="background:'+p[1]+';color:#fff">'+p[0]+'</span></td>'
      +'<td class="m">'+rl.toFixed(2)+':1 <span class="pill '+vl[0]+'">'+vl[1]+'</span></td>'
      +'<td><span class="c-phase" style="background:'+p[2]+';color:#171614">'+p[0]+'</span></td>'
      +'<td class="m">'+rd.toFixed(2)+':1 <span class="pill '+vd[0]+'">'+vd[1]+'</span></td></tr>';
  }});
  document.getElementById('ph-body').innerHTML=pr;
  document.getElementById('ph-foot').textContent =
    'Weakest in light '+wl.toFixed(2)+':1, weakest in dark '+wd.toFixed(2)+':1. '
    +(fails===1?'One of the eighteen combinations falls below the pass mark.'
              :fails+' of the eighteen combinations fall below the pass mark.');
}});
</script>
"""
    phase_js = '[' + ','.join("['%s','%s','%s']" % (n, s, t) for n, s, t in PHASES) + ']'
    return shell('Accessibility', 'Contrast measured in the browser, and the two pairs that fail.',
                 'foundations/accessibility.html', body.replace('{phase_js}', phase_js),
                 crumb=['Foundations', 'Accessibility'],
                 toc=[('measured', 'Contrast, measured'), ('phases', 'Phase colours'),
                      ('beyond', 'Beyond contrast')])


def f_phases():
    rows = ''
    for i, (name, strong, subtle) in enumerate(PHASES, 1):
        rows += ('<tr><td class="m">%02d</td><td>%s</td>'
                 '<td class="m"><span class="sw" style="background:%s"></span>%s</td>'
                 '<td class="m"><span class="sw" style="background:%s"></span>%s</td></tr>'
                 % (i, name, strong, strong.upper(), subtle, subtle.upper()))

    def pills(dark):
        out = ''
        for name, strong, subtle in PHASES:
            bg = subtle if dark else strong
            fg = '#171614' if dark else '#fff'
            out += ('<span class="c-phase" style="background:%s;color:%s">%s</span>'
                    % (bg, fg, name))
        return '<div class="binline">%s</div>' % out

    body = f"""
<h1>Truck phases.</h1>
<p class="lede">Nine stages describe the whole life of a load, from waiting at the plant to
   ignition off. They are the closest thing this product has to a domain model made visible.</p>

<h2 id="nine">The nine</h2>
{bench(pills(False), pills(True),
       'Light mode is the solid colour with white text. Dark mode is the light tint with '
       'near-black text. The roles invert; they do not tint.')}
<div class="tw"><table>
  <thead><tr><th class="m">#</th><th>Phase</th><th class="m">Light (strong)</th>
  <th class="m">Dark (subtle)</th></tr></thead>
  <tbody>{rows}</tbody>
</table></div>

<h2 id="lifecycle">They are a sequence</h2>
<p>The order is the lifecycle, and it is the order they appear in everywhere &mdash; lists,
   legends, filters, the phases widget. Never alphabetical.</p>
{checklist([
  'A truck is in exactly one phase. There is no combined or transitional state.',
  'The sequence is not strictly linear &mdash; a load can return to the plant from several '
  'points &mdash; but the display order never changes.',
  'Ignition off is an end state, not an error.',
])}

<h2 id="three">One token, three components</h2>
<p>The same pair drives the phase pill, the map marker and the map legend dot. They read from
   one source, so they cannot disagree.</p>
<div class="note stop"><b>A truck shown as <em>Pouring</em> in a list and <em>On site</em> on the
  map is a bug, not a design choice.</b> If you find yourself hardcoding a phase colour in one
  of the three places, stop &mdash; that is how they drift apart.</div>
<p><a href="../components/truck-phase-tag.html">The phase tag component {ARROW}</a></p>

<h2 id="contrast">Contrast</h2>
<p>All eighteen combinations are measured live on the
   <a href="accessibility.html">Accessibility</a> page. One fails.</p>
<div class="note warn"><b>Loaded fails in light mode.</b> <span class="m">#887F13</span> with
  white text measures 4.12:1 against a 4.5:1 requirement &mdash; the only one of the eighteen
  that misses. <span class="m">#7A7211</span> would give 4.95:1;
  <span class="m">#6F6810</span> would give 5.73:1.
  <a href="../open-items.html">Tracked as open item 02.</a></div>

<h2 id="naming">Two names for two of them</h2>
<p>The component set and the token collection disagree on two phases.</p>
{table(['Component says', 'Token says', 'Status'], [
  ['In transit', 'To job', 'Unresolved'],
  ['Return to plant', 'Returning to plant', 'Unresolved'],
])}
<p>Until it is settled, map component to token <strong>by position, not by name</strong>. This
   site uses the component vocabulary because that is what appears on screen.
   <a href="../open-items.html">Tracked as open item 07.</a></p>
"""
    return shell('Truck phases', 'The nine stages of a load, in both themes, measured.',
                 'foundations/truck-phases.html', body,
                 crumb=['Foundations', 'Truck phases'],
                 toc=[('nine', 'The nine'), ('lifecycle', 'They are a sequence'),
                      ('three', 'One token, three components'), ('contrast', 'Contrast'),
                      ('naming', 'Two names')])
