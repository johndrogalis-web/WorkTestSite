#!/usr/bin/env python3
"""Component pages — the catalogue and the six family pages."""
from build import shell, MARK, ARROW, COPYICON, nextprev
from pages_sections import cards, tf, PHASES, CHEV, SEARCH, CLEAR, ALERT
from pages_rest import copybar, snip, bench, brow

INFO = ('<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
        '<circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.4"/>'
        '<path d="M8 7.2v3.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
        '<circle cx="8" cy="5" r=".95" fill="currentColor"/></svg>')
WARN = ('<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
        '<path d="M8 2.4l6 11H2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>'
        '<path d="M8 6.6v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
        '<circle cx="8" cy="11.6" r=".9" fill="currentColor"/></svg>')
TICK = ('<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
        '<circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.4"/>'
        '<path d="M5.3 8.2l1.9 1.9 3.5-3.9" stroke="currentColor" stroke-width="1.5" '
        'stroke-linecap="round" stroke-linejoin="round"/></svg>')

# ══════════════════════════════════════════════════════════════
#  THE CATALOGUE — 45 components
#  (name, family key, family label, status, node id, note, page)
# ══════════════════════════════════════════════════════════════
CAT = [
 ('Button', 'action', 'Actions', 'ok', '30033:78562',
  '144 variants — the most complete set in the file.', 'buttons.html'),
 ('Link', 'action', 'Actions', 'none', '—',
  'No component exists. The tokens do. Open item P-15.', 'buttons.html'),

 ('Tabs', 'nav', 'Navigators', 'gap', '39520:6900',
  'No rule for what happens past eight tabs.', 'navigation.html'),
 ('Breadcrumbs', 'nav', 'Navigators', 'gap', '2703:7',
  'Levels 2&ndash;7 drawn. No hover or focus state.', 'navigation.html'),
 ('Side navigation (Hub)', 'nav', 'Navigators', 'gap', '56362:18728',
  'The whole cluster is duplicated. Build against 56362, never 57725.', 'navigation.html'),
 ('Top navigation', 'nav', 'Navigators', 'bad', '56362:18642',
  'Figma reports the variant properties as invalid. Do not build against it.', 'navigation.html'),
 ('In-page navigation', 'nav', 'Navigators', 'gap', '57415:5988',
  'One component. No variants, no states.', 'navigation.html'),
 ('Website navigation', 'nav', 'Navigators', 'ok', '57415:2482',
  'Marketing site only. Breakpoints XL&ndash;XS.', 'navigation.html'),
 ('Website footer', 'nav', 'Navigators', 'ok', '57415:5618',
  'Marketing site only.', 'navigation.html'),
 ('Pagination', 'nav', 'Navigators', 'gap', '56541:7660',
  'Orphaned from the table set it belongs to.', 'navigation.html'),

 ('Text input family', 'form', 'Form elements', 'gap', '51688:14279&ndash;87',
  'Nine loose components. All the states live in a private part underneath.', 'form-fields.html'),
 ('Dropdown', 'form', 'Form elements', 'gap', '51689:13501',
  'No focus state on the public set.', 'form-fields.html'),
 ('Checkbox', 'form', 'Form elements', 'gap', '30515:78521',
  'Public set says &ldquo;intermediate&rdquo;, private set says &ldquo;isIndeterminate&rdquo;.',
  'choosing.html'),
 ('Radio group', 'form', 'Form elements', 'ok', '30173:78572',
  'Input and item sets, full state coverage.', 'choosing.html'),
 ('Toggle', 'form', 'Form elements', 'gap', '35264:124887',
  'The only atom in the file with no hover state.', 'choosing.html'),
 ('Slider', 'form', 'Form elements', 'gap', '53714:4469',
  'No disabled state, no focus state.', 'choosing.html'),
 ('Segmented control', 'form', 'Form elements', 'gap', '56873:24205',
  'Structure exists, the spec does not. Default variant names.', 'choosing.html'),
 ('Chip', 'form', 'Form elements', 'ok', '11268:39456',
  'Two sizes, full state set, selectable.', 'choosing.html'),
 ('Search', 'form', 'Form elements', 'gap', '56362:18621',
  'Eleven suggestion layouts, all filed under default variant names.', 'form-fields.html'),

 ('Message (inline)', 'inform', 'Informers', 'ok', '37329:254',
  'Four severities, minimal and full layouts.', 'informing.html'),
 ('Toast', 'inform', 'Informers', 'gap', '39027:356',
  'A second, cruder set exists on the Hub work. This one is canonical.', 'informing.html'),
 ('Banner', 'inform', 'Informers', 'gap', '38356:1239',
  'No severity axis, unlike every other informer.', 'informing.html'),
 ('Tag', 'inform', 'Informers', 'gap', '56041:114',
  'Variants are slash-paths crammed into one axis.', 'informing.html'),
 ('Truck phase tag', 'inform', 'Informers', 'gap', '56361:2240',
  'Exact duplicate set exists, and the phase names disagree with the tokens.',
  'informing.html'),
 ('Badge', 'inform', 'Informers', 'gap', '7477:297479',
  'Only three of the six size and content combinations were drawn.', 'informing.html'),
 ('Tooltip', 'inform', 'Informers', 'gap', '2620:4152',
  'Four positions. No timing, no dismissal behaviour.', 'informing.html'),
 ('Progress bar', 'inform', 'Informers', 'gap', '51692:17330',
  'Two junk variants named progress7 and progress8. No indeterminate state.',
  'informing.html'),
 ('Spinner', 'inform', 'Informers', 'ok', '10259:29263',
  'Three sizes: 16, 24, 40.', 'informing.html'),
 ('Avatar', 'inform', 'Informers', 'ok', '51692:17265',
  'Circle or squircle, four sizes. Pick one shape per product.', 'informing.html'),
 ('Sensor indicators', 'inform', 'Informers', 'gap', '56539:6813',
  'Hub temperature and slump readouts. Variants unnamed.', 'informing.html'),

 ('Modal', 'hold', 'Containers', 'gap', '37282:2485',
  'Only Extra small exists. No sizes, no header or footer slots, no close spec.',
  'containers.html'),
 ('Popover', 'hold', 'Containers', 'ok', '16794:59241',
  'Menu, single select and multi select, with full item states.', 'containers.html'),
 ('Accordion', 'hold', 'Containers', 'ok', '37498:4517',
  '36 variants and the only component with a pressed state. The best-built set in the file.',
  'containers.html'),
 ('Card', 'hold', 'Containers', 'none', '38190:1747',
  'The Figma page is literally called &ldquo;Cards - missing&rdquo;. One loose stub.',
  'containers.html'),
 ('Table', 'hold', 'Containers', 'gap', '56348:4383',
  '30 typed cells, duplicated. No sort, selection or empty state.', 'containers.html'),
 ('Image block', 'hold', 'Containers', 'ok', '51681:83245',
  'Five aspect ratios.', 'containers.html'),
 ('Page layout', 'hold', 'Containers', 'ok', '56794:115247',
  'Three breakpoints, paired with the seven grid styles.', 'containers.html'),

 ('Widgets (eight types)', 'hub', 'Hub', 'ok', '56362:*',
  'KPI, Report, Alerts, Notifications, Tickets, Component alarms, Quick action, Phases.',
  'containers.html'),
 ('Map', 'hub', 'Hub', 'ok', '56362:17874',
  'City, site and continental views, light and dark.', 'containers.html'),
 ('Map markers', 'hub', 'Hub', 'ok', '56361:2259',
  'Phase-coloured. Must always agree with the phase pill.', 'informing.html'),
 ('Map legends', 'hub', 'Hub', 'ok', '56454:10916',
  'Fleet map and diagnostics map.', 'informing.html'),
 ('Active alerts', 'hub', 'Hub', 'gap', '56361:2310',
  'Unnamed axis.', 'informing.html'),
 ('Account selector', 'hub', 'Hub', 'ok', '56362:18171',
  'Sits in the sidebar footer. Session scope lives here.', 'navigation.html'),
 ('Truck card V.3', 'hub', 'Hub', 'gap', '56479:4980',
  'Unnamed axis, and a version number baked into the component name.', 'containers.html'),
 ('Truck phases module V.3', 'hub', 'Hub', 'gap', '56479:4882',
  'Loose component, no variants.', 'containers.html'),
]

STATUS_LABEL = {'ok': 'Solid', 'gap': 'Has gaps', 'bad': 'Broken', 'none': 'Missing'}
FAMS = [('all', 'Everything'), ('action', 'Actions'), ('nav', 'Navigators'),
        ('form', 'Form elements'), ('inform', 'Informers'), ('hold', 'Containers'),
        ('hub', 'Hub')]


def c_index():
    counts = {}
    for _, fam, _, st, _, _, _ in CAT:
        counts[fam] = counts.get(fam, 0) + 1
        counts[st] = counts.get(st, 0) + 1

    chips = ''
    for key, label in FAMS:
        n = len(CAT) if key == 'all' else counts.get(key, 0)
        chips += ('<button class="fchip" data-filter="%s" aria-pressed="%s">%s'
                  '<span class="n">%d</span></button>'
                  % (key, 'true' if key == 'all' else 'false', label, n))
    for key in ('ok', 'gap', 'bad', 'none'):
        chips += ('<button class="fchip" data-filter="%s" aria-pressed="false">%s'
                  '<span class="n">%d</span></button>'
                  % (key, STATUS_LABEL[key], counts.get(key, 0)))
    chips += '<span class="fcount" id="fcount">%d components</span>' % len(CAT)

    rows = ''
    for name, fam, famlbl, st, node, note, page in CAT:
        rows += ('<tr data-fam="%s" data-status="%s">'
                 '<td><a href="%s"><span class="nm">%s</span></a>'
                 '<span class="id">%s</span></td>'
                 '<td><span class="fam">%s</span></td>'
                 '<td><span class="pill %s">%s</span></td>'
                 '<td class="wrap">%s</td></tr>'
                 % (fam, st, page, name, node, famlbl, st, STATUS_LABEL[st], note))

    body = f"""
<p class="eyebrow">Components</p>
<h1>All forty-five.</h1>
<p class="lede">Everything the Trinity library actually contains, with an honest status on
   each one. Filter it, then follow a name through to the page that shows it working.</p>

<h2 id="count">How we get to 45</h2>
<p>The Figma file does not have a number on it, so here is the arithmetic. Thirty-seven core
   components across five families, plus eight Hub components that ship with the Diagnostic
   Center. Charts (17 sets) and Icons (1,416 components) are counted as <em>libraries</em>
   rather than components, because you pick from them rather than configure them.</p>
<div class="note"><b>Nine of the nine text-input types count as one entry.</b> Text Input,
  Email, Phone, Password, Search, Date picker, Dropdown, Language selector and Text Area are
  nine loose Figma components that share a single private field underneath. Treating them as
  one family is how the design behaves, even if it is not how the file is organised.</div>

<h2 id="catalogue">The catalogue</h2>
<div class="filters">{chips}</div>
<div class="tw"><table class="cat" id="cat-table">
  <thead><tr><th>Component</th><th>Family</th><th>Status</th><th>What to know</th></tr></thead>
  <tbody>{rows}</tbody>
</table></div>
<p class="catnone" id="catnone" hidden>Nothing matches that filter.</p>

<h2 id="status">What the statuses mean</h2>
<div class="tw"><table>
  <thead><tr><th>Status</th><th>Meaning</th><th>What to do</th></tr></thead>
  <tbody>
    <tr><td><span class="pill ok">Solid</span></td>
        <td>Variants, states and rules are all present.</td>
        <td>Build against it.</td></tr>
    <tr><td><span class="pill gap">Has gaps</span></td>
        <td>The component exists and works, but something is missing, duplicated or
            misnamed. The gap is written out in the row.</td>
        <td>Build against it, and read the gap before you rely on the part that is missing.</td></tr>
    <tr><td><span class="pill bad">Broken</span></td>
        <td>Figma itself reports the set as structurally invalid.</td>
        <td>Do not build against it. Ask Verifi Design.</td></tr>
    <tr><td><span class="pill none">Missing</span></td>
        <td>No usable component. Tokens or a stub may exist.</td>
        <td>Use the written rule on the relevant page, and expect it to change.</td></tr>
  </tbody>
</table></div>

<h2 id="families">The six pages</h2>
{cards([
  ('buttons.html', 'Buttons', 'The one component people reach for first, and the four variants most of them do not need.'),
  ('form-fields.html', 'Form fields', 'The pill input in every state, in both themes, with the error rule written out.'),
  ('choosing.html', 'Choosing things', 'Checkbox, radio, toggle, chip, segmented control, slider &mdash; and which one to reach for.'),
  ('informing.html', 'Telling people things', 'Message, toast, banner, tag, badge, tooltip, progress. Ranked by how loud they are.'),
  ('navigation.html', 'Getting around', 'Tabs, breadcrumbs, the Hub sidebar, in-page anchors and pagination.'),
  ('containers.html', 'Containers', 'Accordion, modal, popover, card, table, widgets. The things other things live in.'),
])}

<div class="note warn"><b>This list is what exists, not what is finished.</b> Twenty-two of
  the forty-five carry a documented gap. That is normal for a system this age, and writing
  them down is cheaper than discovering them in a sprint. The
  <a href="../resources/open-items.html">open items page</a> tracks the ones that need a
  decision from a person rather than a fix in the file.</div>

{nextprev(('../foundations/accessibility.html', 'Accessibility'), ('buttons.html', 'Buttons'))}
"""
    return shell('All 45 components', 'Every component in the Trinity library, with an '
                 'honest status on each.', 'components', 'index.html', body,
                 toc=[('count', 'How we get to 45'), ('catalogue', 'The catalogue'),
                      ('status', 'What the statuses mean'), ('families', 'The six pages')])


# ══════════════════════════════════════════════════════════════
#  BUTTONS
# ══════════════════════════════════════════════════════════════
CSS_BTN = """/* Verifi button — Trinity v0.1.3
   The default button in the Hub is a QUIET OUTLINE PILL.
   A filled button is rare and means "this completes the task". */
.vf-btn {
  height: 44px;                  /* --control-height */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 18px;
  border-radius: 32px;           /* --radius-pill */
  font-family: 'ABC Repro', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background .14s, border-color .14s, color .14s, opacity .14s;
}

/* Secondary / ghost — the everyday button */
.vf-btn--quiet {
  background: transparent;
  border: 1px solid var(--border);        /* light #36322d24 · dark #e5e5e51f */
  color: var(--defined);                  /* light #36322dc2 · dark #e5e5e5de */
}
.vf-btn--quiet:hover { border-color: var(--border-mid); color: var(--strong); }

/* Primary — one per container, and only for completion */
.vf-btn--primary {
  background: var(--strong);              /* light #36322d · dark #ffffff */
  color: var(--layer-1);                  /* light #ffffff · dark #211f1c */
  border: 0;
}
.vf-btn--primary:hover { opacity: .88; }

/* Danger — destroys data, nothing else */
.vf-btn--danger { background: var(--red); color: #fff; border: 0; }  /* #d70100 */

/* Selected — a state, not an emphasis level */
.vf-btn--selected {
  background: var(--select);              /* light #3069e3 · dark #e3f200 */
  color: var(--on-select);                /* light #ffffff · dark #000000 */
  border: 0;
}

.vf-btn[disabled] { opacity: .42; pointer-events: none; }
.vf-btn:focus-visible { outline: 2px solid var(--strong); outline-offset: 2px; }"""


def c_buttons():
    row1 = brow('Quiet — the default',
                '<div class="binline"><button class="c-btn quiet">Add a ticket</button>'
                '<button class="c-btn quiet">Export</button></div>')
    row2 = brow('Primary — completion only',
                '<div class="binline"><button class="c-btn commit">Done</button>'
                '<button class="c-btn commit" disabled>Done</button></div>')
    row3 = brow('Danger', '<button class="c-btn danger">Delete ticket</button>')
    row4 = brow('Selected — a state',
                '<div class="binline"><button class="c-btn sel">Fleet map</button>'
                '<button class="c-btn quiet">Phases</button></div>')
    row5 = brow('Segmented control',
                '<div class="c-seg"><button aria-pressed="true">All tickets</button>'
                '<button aria-pressed="false">Fleet map</button>'
                '<button aria-pressed="false">Phases</button></div>')
    inner = row1 + row2 + row3 + row4 + row5

    body = f"""
<p class="eyebrow">Components &middot; Actions</p>
<h1>Buttons.</h1>
<p class="lede">A button causes something to happen. If pressing it only takes you somewhere,
   it is a link, and it should look like one.</p>

<h2 id="surprise">The thing that surprises people</h2>
<p>The Figma set has four variants and 144 combinations, which reads like an invitation to use
   them all. The Hub does not. Open any real screen and almost every button is the
   <strong>quiet outline pill</strong> &mdash; even the one that creates a ticket. Filled
   buttons appear in perhaps two places in the whole product.</p>
<div class="note"><b>The rule that actually governs:</b> a filled button means
  <em>this finishes the task and closes what you are in</em>. The Done button at the bottom of
  a filter popover is one. Everything else &mdash; New ticket, Export, Columns, Filters &mdash;
  is an outline pill. If you are adding a solid button to a page, you probably want an outline
  one.</div>

<h2 id="bench">Every variant, both themes</h2>
{copybar('Button', 'btn', '44px &middot; pill &middot; 4 variants')}
{snip('btn', CSS_BTN)}
{bench(inner, inner,
       'Same markup, both themes. Note that <em>selected</em> flips from blue to lime: '
       'lime is a dark-mode-only selection colour and must never appear as a light-mode fill.')}

<h2 id="choose">Which variant</h2>
<div class="tw"><table>
  <thead><tr><th>Variant</th><th>Use it when</th><th>How many per container</th></tr></thead>
  <tbody>
    <tr><td><b>Quiet</b> (secondary / ghost)</td>
        <td>Almost always. Toolbar actions, row actions, anything repeated, anything reversible.</td>
        <td>As many as the layout can carry.</td></tr>
    <tr><td><b>Primary</b></td>
        <td>Exactly one high-stakes completion action inside the current visual container &mdash;
            the Done that closes a popover, the Save that ends a flow.</td>
        <td>One. Never two.</td></tr>
    <tr><td><b>Danger</b></td>
        <td>The action destroys data or cannot be undone. Pair it with a confirm step when the
            loss is permanent.</td>
        <td>One, and only in a modal or a destructive row action.</td></tr>
    <tr><td><b>Selected</b></td>
        <td>Not an emphasis level at all &mdash; it shows which of a set of peers you are on.
            Segmented controls and nav items use it.</td>
        <td>One per group, by definition.</td></tr>
  </tbody>
</table></div>
<div class="note stop"><b>There is no tertiary.</b> The file does not have one and the product
  does not need one. If you feel you need a third level of emphasis, you want ghost.</div>

<h2 id="specs">The numbers</h2>
<ul class="spec">
  <li><b>Height</b><span class="m">44px</span></li>
  <li><b>Corner radius</b><span class="m">32px &mdash; <code>--radius-pill</code>, which at
      44px height renders as a full pill</span></li>
  <li><b>Horizontal padding</b><span class="m">18px, 20px in a segmented control</span></li>
  <li><b>Label</b><span class="m">14px / 500 / ABC Repro</span></li>
  <li><b>Gap to icon</b><span class="m">8px</span></li>
  <li><b>Icon-only</b><span class="m">44 &times; 44, still a pill</span></li>
  <li><b>Gap between buttons</b><span class="m">10px in a toolbar, 8px in a modal footer</span></li>
  <li><b>Transition</b><span class="m">0.14s on background, border and colour. Nothing bounces.</span></li>
  <li><b>Focus</b><span class="m">2px <code>--strong</code> outline at 2px offset &mdash;
      never removed, never replaced with a colour change alone</span></li>
</ul>

<h2 id="dos">Do and do not</h2>
<div class="useno">
  <div class="y"><h4>Do</h4><ul>
    <li>Label it with the verb the user is doing: <em>Export</em>, <em>Message driver</em>,
        <em>Add a ticket</em>.</li>
    <li>Keep one primary per visual container, at most.</li>
    <li>Use ghost for anything that repeats down a table.</li>
    <li>Let the button be as wide as its label needs; do not stretch a row of buttons to match.</li>
  </ul></div>
  <div class="n"><h4>Do not</h4><ul>
    <li>Use a button for pure navigation. Use a link.</li>
    <li>Colour a button by severity. Only danger has a colour, and only for destruction.</li>
    <li>Put a spinner inside a button by hand &mdash; the set has a loading variant.</li>
    <li>Use yellow. In the product, yellow is dark-mode selection, not a call to action.</li>
  </ul></div>
</div>

<h2 id="links">Links, which do not exist yet</h2>
<p>There is no link component. The tokens are there &mdash; <code>interaction/link</code> and
   <code>link-visited</code> &mdash; but nothing is drawn. Until one is, the rule is:</p>
<div class="note"><b>Interim link rule (open item P-15).</b> Inline links use
  <code>--blue-link</code> <span class="m">#295ccc</span> in light and <code>--strong</code>
  (white) in dark, underlined, with a 2px offset. In table cells they keep the regular weight
  and family &mdash; never lime, never mono. Visited styling applies in long-form content only,
  never in app chrome.</div>

<h2 id="gaps">Known gaps</h2>
<ul class="checklist">
  <li>46% of the button set&rsquo;s non-text fills are hardcoded rather than bound to tokens.
      A theme change today would miss them.</li>
  <li>The three sizes (large / medium / small) exist as variants but no heights are published
      for medium and small. Everything in the Hub is the 44px large.</li>
  <li>No distinct pressed state. <em>Active</em> covers it.</li>
</ul>

{nextprev(('index.html', 'All 45'), ('form-fields.html', 'Form fields'))}
"""
    return shell('Buttons', 'The four button variants, and why the Hub uses one of them.',
                 'components', 'buttons.html', body,
                 toc=[('surprise', 'The surprise'), ('bench', 'Every variant'),
                      ('choose', 'Which variant'), ('specs', 'The numbers'),
                      ('dos', 'Do and do not'), ('links', 'Links'), ('gaps', 'Known gaps')])


# ══════════════════════════════════════════════════════════════
#  FORM FIELDS
# ══════════════════════════════════════════════════════════════
CSS_FIELD = """/* Verifi text field — Trinity, Form Fields page (node 63987:77509)
   Label, input, helper. 6px between each. The input is a 44px pill.
   Light mode is drawn in the file; the dark column below is derived. */
.vf-field { display: flex; flex-direction: column; gap: 6px; }

.vf-field__label {
  font-size: 14px;
  line-height: 1.3;
  color: #171614;                 /* label ink, light mode */
}
.vf-field__label i { color: #b00100; font-style: normal; }   /* required mark */

.vf-field__box {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 12px 16px;
  border-radius: 100px;           /* --input-radius, a true pill */
  background: #ffffff;
  border: 1px solid #666054;      /* resting border */
  transition: border-color .14s, box-shadow .14s;
}
.vf-field__box input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: none;
  outline: none;
  font-family: 'ABC Repro', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 20px;
  color: #171614;
}
.vf-field__box input::placeholder { color: #666054; }

.vf-field__help {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 16px;
  padding: 4px 0;
  font-size: 12px;
  line-height: 1.3;
  color: #171614;
}

/* States — border only. Never a fill, never a dashed or dotted edge. */
.vf-field.is-filled   .vf-field__box { border-color: #171614; }
.vf-field.is-focus    .vf-field__box { border-color: #171614; box-shadow: 0 0 0 2px #171614; }
.vf-field.is-error    .vf-field__box { border-color: #b00100; }
.vf-field.is-error    .vf-field__help { color: #d70100; }
.vf-field.is-disabled .vf-field__box { background: #dfdedd; border-color: #b6b1a5; }
.vf-field.is-disabled .vf-field__box input { color: #7f796c; }

/* Dark mode — derived, not published. See the note on the page. */
@media (prefers-color-scheme: dark) {
  .vf-field__label, .vf-field__help { color: #ffffff; }
  .vf-field__box { background: #211f1c; border-color: #b6b1a5; }
  .vf-field__box input { color: #ffffff; }
  .vf-field__box input::placeholder { color: #b6b1a5; }
  .vf-field.is-filled .vf-field__box,
  .vf-field.is-focus  .vf-field__box { border-color: #ffffff; }
  .vf-field.is-focus  .vf-field__box { box-shadow: 0 0 0 2px #ffffff; }
  .vf-field.is-error  .vf-field__box { border-color: #efadac; }
  .vf-field.is-error  .vf-field__help { color: #efadac; }
  .vf-field.is-disabled .vf-field__box { background: #2f2d28; border-color: #565147; }
}"""


def c_fields():
    states = (
        brow('Resting', tf('', 'Truck number', '', 'e.g. 4417', 'Numbers only')) +
        brow('Filled', tf('filled', 'Truck number', '4417', '', 'Numbers only')) +
        brow('Focus &mdash; the clear control appears',
             tf('focus', 'Truck number', '4417', '', 'Numbers only', clear=True)) +
        brow('Error', tf('error', 'Truck number', '44 17', '',
                         'That truck number does not exist on this account')) +
        brow('Disabled &mdash; the value stays visible',
             tf('dis', 'Truck number', '4417', '', 'Set by the dispatch system', dis=True)) +
        brow('Required', tf('', 'Plant', '', 'Choose a plant', 'Required to save', req=True)) +
        brow('With a leading icon',
             tf('', 'Search', '', 'Ticket, truck, order, mix, etc.', '', lead=True))
    )

    body = f"""
<p class="eyebrow">Components &middot; Form elements</p>
<h1>Form fields.</h1>
<p class="lede">One pill-shaped input, drawn in six states, carrying nine different kinds of
   data. Get this component right and most of the product is right.</p>

<h2 id="anatomy">Three parts, 6px apart</h2>
<p>Every field is a label, a box and a helper line, stacked with 6px between them. The helper
   line is always present in the layout even when it is empty, so fields in a row keep their
   baselines when one of them goes into error.</p>
<ul class="spec">
  <li><b>Label</b><span>14px, always rendered. Two positions exist in Figma &mdash; eyebrow
      (above, at rest) and minimized (floated). Use eyebrow unless the design says otherwise.</span></li>
  <li><b>Box</b><span class="m">min-height 44px &middot; padding 12px 16px &middot; radius 100px</span></li>
  <li><b>Input text</b><span class="m">14px / 20px line-height</span></li>
  <li><b>Helper</b><span class="m">12px, 4px vertical padding, reserved even when empty</span></li>
  <li><b>Gap</b><span class="m">6px label &rarr; box &rarr; helper</span></li>
  <li><b>Icon</b><span class="m">16px, 8px from the text on either side</span></li>
</ul>

<h2 id="bench">Six states, both themes</h2>
{copybar('Text field', 'field', '44px pill &middot; node 63987:77509')}
{snip('field', CSS_FIELD)}
{bench(states, states)}
<div class="note warn"><b>The dark column is derived, not published.</b> The Form Fields page
  in Figma draws the light theme only. The dark values above are taken from the Trinity
  surface and ink tokens applied consistently &mdash; they are a reasonable reading, not a
  decision. Treat them as provisional until Verifi Design draws the dark field.
  <a href="../resources/open-items.html">Tracked as an open item.</a></div>

<h2 id="error">The error rule, written out</h2>
<p>This is the part people get wrong, so it is worth being exact.</p>
<ul class="checklist">
  <li><b>The border changes colour. Nothing else does.</b> No red fill, no red text in the
      input, no icon inside the box.</li>
  <li><b>The alert icon lives in the helper line</b>, to the left of the message, at 13px.</li>
  <li><b>Error text replaces helper text.</b> It never stacks underneath it. If the helper
      text was load-bearing, the error message has to carry that information too.</li>
  <li><b>The error state needs both parts.</b> The field&rsquo;s error variant on its own, with
      no message, tells the user that something is wrong but not what.</li>
  <li><b>Never dashed, never dotted.</b> There is no dashed or dotted border anywhere in this
      system, in any state, on any component.</li>
</ul>

<h2 id="disabled">Disabled keeps its value</h2>
<p>A disabled field does not blank. It shows what it holds, greyed, because the value is
   usually the explanation &mdash; the plant was set by dispatch, the mix came from the order.
   Blanking it turns a clear screen into a mystery.</p>

<h2 id="types">Nine types, one field</h2>
<div class="tw"><table>
  <thead><tr><th>Type</th><th>Reach for it when</th></tr></thead>
  <tbody>
    <tr><td>Text input</td><td>Free text with no format to enforce.</td></tr>
    <tr><td>Email</td><td>An address. The type does the keyboard and the validation hint.</td></tr>
    <tr><td>Phone</td><td>A number with a country format.</td></tr>
    <tr><td>Password</td><td>Masked entry, with a reveal control.</td></tr>
    <tr><td>Search</td><td>Only inside a search surface &mdash; toolbar, global search, a filter
        panel. Not as a shortcut for &ldquo;text input with a magnifier&rdquo;.</td></tr>
    <tr><td>Date picker</td><td>A date. Never ask someone to type one in three boxes.</td></tr>
    <tr><td>Dropdown</td><td>5&ndash;15 known options, one choice. Fewer than five, use radios.</td></tr>
    <tr><td>Language selector</td><td>Exactly what it says; it exists so nobody rebuilds it.</td></tr>
    <tr><td>Text area</td><td>Multi-line. Note that this one exists twice in the file.</td></tr>
  </tbody>
</table></div>

<h2 id="search">Search behaves differently</h2>
<p>Search in the Hub is a lookup across trucks, customers, order numbers, mixes and reports,
   and its suggestion box has eleven layouts. The behaviour the variants describe:</p>
<ul class="checklist">
  <li>Focus with nothing typed shows <b>recent searches</b>.</li>
  <li>A typed prefix routes to a <b>typed result group</b> &mdash; a truck number and a customer
      name produce different result lists, not one merged list.</li>
  <li>No matches shows <b>No hit</b>, and offers <b>Did you mean</b> when something is close.</li>
  <li>A long result set ends with <b>Show all</b> rather than scrolling forever.</li>
</ul>

<h2 id="dos">Do and do not</h2>
<div class="useno">
  <div class="y"><h4>Do</h4><ul>
    <li>Write helper text before the user needs it, not after they fail.</li>
    <li>Mark required fields with the asterisk and say what happens if they are empty.</li>
    <li>Keep one field per line for anything a person types from memory.</li>
  </ul></div>
  <div class="n"><h4>Do not</h4><ul>
    <li>Use placeholder text as the label. It disappears exactly when it is needed.</li>
    <li>Validate on every keystroke. Validate on blur, or on submit.</li>
    <li>Put the error message anywhere but the helper line.</li>
    <li>Disable the submit button to communicate a validation failure &mdash; say what is wrong.</li>
  </ul></div>
</div>

<h2 id="gaps">Known gaps</h2>
<ul class="checklist">
  <li>The nine types are loose components, not a variant set. All the states live in a private
      part underneath, which means an instance can be swapped into a state nobody drew.</li>
  <li>Text Area exists twice &mdash; once in the family and once on its own page.</li>
  <li>The public dropdown set has no focus state.</li>
  <li>Dark mode is not drawn for any of them.</li>
</ul>

{nextprev(('buttons.html', 'Buttons'), ('choosing.html', 'Choosing things'))}
"""
    return shell('Form fields', 'The Verifi text field in six states, both themes, with the '
                 'error rule written out.', 'components', 'form-fields.html', body,
                 toc=[('anatomy', 'Anatomy'), ('bench', 'Six states'),
                      ('error', 'The error rule'), ('disabled', 'Disabled'),
                      ('types', 'Nine types'), ('search', 'Search'),
                      ('dos', 'Do and do not'), ('gaps', 'Known gaps')])


# ══════════════════════════════════════════════════════════════
#  CHOOSING THINGS
# ══════════════════════════════════════════════════════════════
CSS_CHOOSE = """/* Verifi selection controls — Trinity v0.1.3
   Checkbox, radio, toggle, chip. Square, round, sliding, pill. */

/* Checkbox — independent boolean, applies on submit */
.vf-check { display: inline-flex; align-items: center; gap: 9px; font-size: 14px; }
.vf-check__box {
  width: 16px; height: 16px; flex: none;
  border: 1px solid var(--strong);        /* light #36322d · dark #ffffff */
  border-radius: 2px;                      /* --radius-xs */
  background: var(--layer-1);
  display: inline-flex; align-items: center; justify-content: center;
}
.vf-check.is-on .vf-check__box {
  background: var(--strong); border-color: var(--strong); color: var(--layer-1);
}

/* Radio — mutually exclusive, all options visible */
.vf-radio__box { width: 16px; height: 16px; border-radius: 99px; }
.vf-radio.is-on .vf-radio__box::after {
  content: ""; width: 8px; height: 8px; border-radius: 99px; background: var(--strong);
}

/* Toggle — takes effect immediately, no submit */
.vf-toggle {
  width: 40px; height: 22px; padding: 2px; border-radius: 99px;
  background: var(--border-mid); display: inline-flex; align-items: center;
  transition: background .14s;
}
.vf-toggle__knob {
  width: 18px; height: 18px; border-radius: 99px; background: var(--layer-1);
  transition: transform .14s cubic-bezier(.22,1,.36,1);
}
.vf-toggle.is-on { background: var(--strong); }
.vf-toggle.is-on .vf-toggle__knob { transform: translateX(18px); }

/* Chip — an applied filter or a selected entity */
.vf-chip {
  height: 32px; padding: 0 12px; border-radius: 32px;
  border: 1px solid var(--border-mid); font-size: 13px; color: var(--defined);
  display: inline-flex; align-items: center; gap: 6px;
}
.vf-chip.is-on {
  background: var(--strong); border-color: var(--strong); color: var(--layer-1);
}

/* Segmented control — switches how you look at one dataset */
.vf-seg { display: inline-flex; border: 1px solid var(--border); border-radius: 32px; overflow: hidden; }
.vf-seg > button {
  min-height: 44px; padding: 9px 20px; font-size: 14px; color: var(--defined);
  border-right: 1px solid var(--border); background: none;
}
.vf-seg > button:last-child { border-right: 0; }
.vf-seg > button[aria-pressed="true"] {
  background: var(--select);              /* light #3069e3 · dark #e3f200 */
  color: var(--on-select);                /* light #ffffff · dark #000000 */
}"""


def c_choosing():
    inner = (
        brow('Checkbox &mdash; independent, applies on save',
             '<div class="binline" style="flex-direction:column;align-items:flex-start;gap:10px">'
             '<span class="c-cbx on"><i>&#10003;</i>Show returned concrete</span>'
             '<span class="c-cbx"><i>&#10003;</i>Show washed-out loads</span>'
             '<span class="c-cbx on" style="opacity:.45"><i>&ndash;</i>All plants (some)</span>'
             '</div>') +
        brow('Radio &mdash; one of a visible few',
             '<div class="binline" style="flex-direction:column;align-items:flex-start;gap:10px">'
             '<span class="c-rad on"><i></i>Metric</span>'
             '<span class="c-rad"><i></i>Imperial</span></div>') +
        brow('Toggle &mdash; takes effect now',
             '<div class="binline"><span class="c-tog on"><i></i></span>'
             '<span style="font-size:14px;color:var(--tx2)">Live fleet updates</span>'
             '<span class="c-tog"><i></i></span>'
             '<span style="font-size:14px;color:var(--tx2)">Dark mode</span></div>') +
        brow('Chip &mdash; an applied filter',
             '<div class="binline"><span class="c-chip on">Plant: Rockdale &#215;</span>'
             '<span class="c-chip">Phase: Pouring</span>'
             '<span class="c-chip">Within spec</span></div>') +
        brow('Segmented control',
             '<div class="c-seg"><button aria-pressed="true">All tickets</button>'
             '<button aria-pressed="false">Fleet map</button>'
             '<button aria-pressed="false">Phases</button></div>') +
        brow('Slider &mdash; approximate, bounded',
             '<div class="c-slider"><i style="width:62%"></i><u style="left:62%"></u></div>')
    )

    body = f"""
<p class="eyebrow">Components &middot; Form elements</p>
<h1>Choosing things.</h1>
<p class="lede">Six controls that all mean &ldquo;pick something&rdquo;. They are not
   interchangeable, and picking the wrong one is the most common mistake in the whole system.</p>

<h2 id="decide">Start here</h2>
<p>Answer these in order and you will land on the right control every time.</p>
<div class="tw"><table>
  <thead><tr><th>Ask</th><th>If yes</th></tr></thead>
  <tbody>
    <tr><td class="wrap">Does flipping it change the system <em>immediately</em>, with no Save?</td>
        <td><b>Toggle.</b> Dark mode, live updates, a filter that redraws the map.</td></tr>
    <tr><td class="wrap">Can more than one be true at once?</td>
        <td><b>Checkbox.</b> Also for a single opt-in confirmation.</td></tr>
    <tr><td class="wrap">Exactly one, and there are two to five options?</td>
        <td><b>Radio group.</b> All options visible, no hunting.</td></tr>
    <tr><td class="wrap">Exactly one, and there are five to fifteen options?</td>
        <td><b>Dropdown.</b> See <a href="form-fields.html">form fields</a>.</td></tr>
    <tr><td class="wrap">Are you switching how you <em>look at</em> one dataset?</td>
        <td><b>Segmented control.</b> Two to four short options, always visible.</td></tr>
    <tr><td class="wrap">Are you switching between peer <em>views of an object</em>?</td>
        <td><b>Tabs</b> &mdash; wayfinding, not parameters. See <a href="navigation.html">getting
            around</a>.</td></tr>
    <tr><td class="wrap">Is it an applied filter or a chosen entity that can be dismissed?</td>
        <td><b>Chip.</b> If it cannot be removed or selected, you want a tag.</td></tr>
    <tr><td class="wrap">Is precision beside the point and the range bounded?</td>
        <td><b>Slider.</b> If the user needs an exact number, pair it with an input or drop it.</td></tr>
  </tbody>
</table></div>

<h2 id="bench">All six, both themes</h2>
{copybar('Selection controls', 'choose', 'checkbox &middot; radio &middot; toggle &middot; chip &middot; segmented')}
{snip('choose', CSS_CHOOSE)}
{bench(inner, inner,
       'The segmented control is where the lime shows itself: selection is blue in light mode '
       'and lime in dark, from one token pair. The third checkbox is the indeterminate state.')}

<h2 id="pairs">The two pairs people confuse</h2>
<div class="useno">
  <div class="y"><h4>Checkbox vs toggle</h4><ul>
    <li>Checkbox sits in a form and waits for Save.</li>
    <li>Toggle <em>is</em> the save. Nothing follows it.</li>
    <li>A toggle inside a form with a Save button is a checkbox wearing a costume.</li>
  </ul></div>
  <div class="y" style="border-color:var(--rule)"><h4>Chip vs tag</h4><ul>
    <li>Chip is interactive &mdash; select it, remove it, apply it.</li>
    <li>Tag is a label. It classifies; you cannot press it.</li>
    <li>If it has an &#215;, it is a chip. If it states a status, it is a
        <a href="informing.html">tag</a>.</li>
  </ul></div>
</div>

<h2 id="filters">How filters actually behave in the Hub</h2>
<p>Filters are a composition rather than a component, and the pattern is fixed:</p>
<ul class="checklist">
  <li>The <b>Filters button</b> in the toolbar shows a blue border, a 6% blue background and a
      count badge when anything is applied.</li>
  <li>It opens a <b>380px popover</b> at 16px radius: a head with the title and Reset, a
      scrollable body of chip groups under uppercase labels, and a foot with the result count
      and a solid Done button.</li>
  <li>Applied filters then render as a <b>removable pill strip</b> under the toolbar &mdash;
      <span class="m">Group: value &#215;</span> &mdash; ending in a Clear all text button.</li>
  <li>The result count updates before Done is pressed, so nobody commits to a filter that
      returns nothing.</li>
</ul>

<h2 id="specs">The numbers</h2>
<ul class="spec">
  <li><b>Checkbox / radio</b><span class="m">16 &times; 16, 1px border, 9px to the label</span></li>
  <li><b>Checkbox radius</b><span class="m">2px. Radio is a circle.</span></li>
  <li><b>Toggle</b><span class="m">40 &times; 22, 18px knob, 2px inset</span></li>
  <li><b>Chip</b><span class="m">32px high, 12px padding, 32px radius</span></li>
  <li><b>Segmented item</b><span class="m">44px min height, 9px / 20px padding, 14px text,
      1px internal dividers</span></li>
  <li><b>Segmented group</b><span class="m">2&ndash;4 items, 32px radius, 1px outer border</span></li>
  <li><b>Hit target</b><span class="m">44px minimum on every one of them, however small the
      drawn control is</span></li>
</ul>

<h2 id="gaps">Known gaps</h2>
<ul class="checklist">
  <li>The toggle has <b>no hover state</b> &mdash; the only atom in the library missing one.</li>
  <li>The slider has no disabled and no focus state.</li>
  <li>The segmented control&rsquo;s variants are still called Primary and Variant2, and one
      item has both &ldquo;default&rdquo; and &ldquo;Default&rdquo; as distinct values.</li>
  <li>The checkbox calls the third state &ldquo;intermediate&rdquo; in one place and
      &ldquo;isIndeterminate&rdquo; in another. The concept is <em>indeterminate</em>.</li>
</ul>

{nextprev(('form-fields.html', 'Form fields'), ('informing.html', 'Telling people things'))}
"""
    return shell('Choosing things', 'Checkbox, radio, toggle, chip, segmented control and '
                 'slider — and which one to reach for.', 'components', 'choosing.html', body,
                 toc=[('decide', 'Start here'), ('bench', 'All six'),
                      ('pairs', 'The confusing pairs'), ('filters', 'Filters in the Hub'),
                      ('specs', 'The numbers'), ('gaps', 'Known gaps')])


# ══════════════════════════════════════════════════════════════
#  TELLING PEOPLE THINGS
# ══════════════════════════════════════════════════════════════
CSS_INFORM = """/* Verifi informers — Trinity v0.1.3
   Four severities, shared by Message and Toast. No fifth severity, ever. */

/* Inline message — persists until the thing it describes is resolved */
.vf-msg {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 12px 14px; border-radius: 8px;          /* --radius-sm-plus */
  background: var(--layer-2); color: var(--defined);
  box-shadow: inset 0 0 0 1px var(--border);
  font-size: 13.5px; line-height: 1.45;
}
.vf-msg--info    { box-shadow: inset 0 0 0 1px var(--select); }  /* #3069e3 */
.vf-msg--success { box-shadow: inset 0 0 0 1px #16a34a; }
.vf-msg--warning { box-shadow: inset 0 0 0 1px var(--amber); }   /* #ffba0d */
.vf-msg--error   { box-shadow: inset 0 0 0 1px var(--red); }     /* #d70100 */

/* Toast — transient, 5s, max three stacked, newest on top */
.vf-toast {
  display: flex; gap: 10px; align-items: center;
  padding: 13px 15px; border-radius: 8px;
  background: var(--layer-1); color: var(--defined);
  box-shadow: inset 0 0 0 1px var(--border), 0 6px 22px rgba(0,0,0,.14);
}

/* Banner — page-global, outlives any one section */
.vf-banner {
  display: flex; gap: 10px; align-items: center;
  padding: 11px 15px; border-radius: 4px;
  background: var(--strong); color: var(--layer-1); font-size: 13.5px;
}

/* Tag — a label. Not interactive. */
.vf-tag {
  height: 20px; padding: 0 6px; border-radius: 4px;
  font-size: 12px; font-weight: 500;
  background: var(--layer-2); color: var(--defined);
  box-shadow: inset 0 0 0 1px var(--border);
  display: inline-flex; align-items: center;
}

/* Alert badge — count of unseen items, attached to something else */
.vf-badge {
  height: 20px; padding: 0 8px; border-radius: 16px;
  font-size: 11px; font-weight: 500; display: inline-flex; align-items: center; gap: 5px;
}
.vf-badge--error   { background: var(--red);   color: #fff; }      /* white icon + count */
.vf-badge--warning { background: var(--amber); color: #36322d; }   /* dark icon + count */
.vf-badge--neutral { background: var(--layer-2); color: var(--soft);
                     box-shadow: inset 0 0 0 1px var(--border); }

/* Truck phase pill — THE colour flips with the theme. See Foundations → Truck phases. */
.vf-phase {
  font-size: 12px; line-height: 1; font-weight: 400;
  padding: 5px 10px; border-radius: 32px; white-space: nowrap;
  background: var(--phase-strong); color: #fff;                    /* light mode */
}
@media (prefers-color-scheme: dark) {
  .vf-phase { background: var(--phase-subtle); color: #171614; }   /* dark mode */
}"""


def _phase_pills(dark=False):
    out = ''
    for name, key, strong, subtle in PHASES:
        bg = subtle if dark else strong
        fg = '#171614' if dark else '#fff'
        out += ('<span class="c-phase" style="background:%s;color:%s">%s</span>'
                % (bg, fg, name))
    return '<div class="binline">%s</div>' % out


def c_informing():
    def block(dark):
        return (
            brow('Inline message &mdash; stays until resolved',
                 '<div class="c-msg err">' + ALERT + '<span><b>Three tickets failed to sync</b>'
                 'They will retry automatically. Nothing has been lost.</span></div>') +
            brow('Toast &mdash; 5 seconds, then gone',
                 '<div class="c-toast">' + TICK + '<span>Ticket 88213 saved</span>'
                 '<span class="x">&#215;</span></div>') +
            brow('Banner &mdash; whole page, whole session',
                 '<div class="c-banner">' + INFO +
                 '<span>You are looking at the training environment.</span></div>') +
            brow('Tags and badges',
                 '<div class="binline"><span class="c-tag">Unlinked</span>'
                 '<span class="c-tag">Within spec</span>'
                 '<span class="c-badge er">' + ALERT + '3</span>'
                 '<span class="c-badge am">' + WARN + '1</span>'
                 '<span class="c-badge nu">Draft</span></div>') +
            brow('Truck phase pills &mdash; the colour flips with the theme',
                 _phase_pills(dark)) +
            brow('Connection dot, progress, spinner, avatar',
                 '<div class="binline">'
                 '<span style="font-size:13.5px;color:var(--tx2)">'
                 '<span class="c-dot" style="background:#16a34a"></span>Live</span>'
                 '<span class="c-prog" style="max-width:120px"><i style="width:64%"></i></span>'
                 '<span class="c-spin"></span>'
                 '<span class="c-av">JD</span><span class="c-av sq">BC</span></div>') +
            brow('Tooltip', '<span class="c-tip">Slump, measured at the drum</span>')
        )

    body = f"""
<p class="eyebrow">Components &middot; Informers</p>
<h1>Telling people things.</h1>
<p class="lede">Eleven ways to say something is happening, ranked by how much of the
   user&rsquo;s attention they take. Take the least you can get away with.</p>

<h2 id="ladder">The loudness ladder</h2>
<p>Read this top to bottom and stop at the first row that is true. Almost everything belongs
   further down than it first appears.</p>
<div class="tw"><table>
  <thead><tr><th>If the message&hellip;</th><th>Use</th><th>Because</th></tr></thead>
  <tbody>
    <tr><td class="wrap">blocks all progress until a decision is made</td>
        <td><b>Modal</b></td><td>It takes the whole screen hostage. Earn it.</td></tr>
    <tr><td class="wrap">affects the whole page or session and outlives any section</td>
        <td><b>Banner</b></td><td>Outage, training environment, account suspended.</td></tr>
    <tr><td class="wrap">is bound to a place on the page and must persist until resolved</td>
        <td><b>Message</b></td><td>Validation summary, a section that failed to load.</td></tr>
    <tr><td class="wrap">confirms something that just finished, and needs no action</td>
        <td><b>Toast</b></td><td>It disappears; nothing important should be in it alone.</td></tr>
    <tr><td class="wrap">is the status of one thing in a list</td>
        <td><b>Tag</b> or <b>phase pill</b></td><td>It belongs to the row, not the page.</td></tr>
    <tr><td class="wrap">is a count of unseen items</td>
        <td><b>Badge</b></td><td>Attaches to what it counts.</td></tr>
    <tr><td class="wrap">clarifies a control the user is already looking at</td>
        <td><b>Tooltip</b></td><td>Never load-bearing. If it is required, put it in the UI.</td></tr>
  </tbody>
</table></div>

<h2 id="bench">All of them, both themes</h2>
{copybar('Informers', 'inform', 'message &middot; toast &middot; banner &middot; tag &middot; badge &middot; phase')}
{snip('inform', CSS_INFORM)}
{bench(block(False), block(True),
       'The phase pills are the one component whose colours genuinely change between themes: '
       'solid colour with white text in light, a light tint with near-black text in dark.')}

<h2 id="severity">Four severities, and only four</h2>
<p>Message and Toast share one severity grammar: <b>info</b>, <b>success</b>, <b>warning</b>,
   <b>error</b>, coloured by the <code>system/*</code> tokens. Any new informer uses exactly
   these four. There is no fifth, no &ldquo;critical&rdquo;, no &ldquo;notice&rdquo;.</p>
<div class="note"><b>Alert badges are stricter still.</b> Error is a solid red chip with a
  white icon and count. Warning is a solid amber <span class="m">#FFBA0D</span> chip with a
  dark <span class="m">#36322D</span> triangle and count &mdash; amber holds its contrast on
  dark, so it does not change. Never tint a warning red. Neutral statuses such as
  &ldquo;Unlinked&rdquo; use a grey chip and never borrow an alert colour.</div>

<h2 id="toastrules">Toast rules</h2>
<ul class="checklist">
  <li>Five seconds by default.</li>
  <li><b>Error toasts persist</b> until dismissed. An error that vanishes is an error nobody
      saw.</li>
  <li>One stack region per viewport, newest on top, three visible at most.</li>
  <li>If the user has to act on it, it is not a toast. Use an inline message or a modal.</li>
</ul>

<h2 id="phases">Phase pills, markers and legend dots</h2>
<p>The nine truck phases drive three things at once: the pill in a table, the marker on the
   map, and the dot in the map legend. They read from the same token, and they must always
   agree. A truck shown as <em>Pouring</em> in a list and <em>On site</em> on the map is a bug,
   not a design choice.</p>
<p><a href="../foundations/phases.html">The nine phases, with contrast measured in both themes
   {ARROW}</a></p>
<div class="note warn"><b>One phase fails contrast.</b> <em>Loaded</em> at
  <span class="m">#887F13</span> with white text measures 4.12:1 &mdash; under the 4.5:1 bar,
  and the only one of the eighteen combinations that misses. The fix is one shade darker.
  <a href="../foundations/accessibility.html">The measurement is on the accessibility page.</a></div>

<h2 id="specs">The numbers</h2>
<ul class="spec">
  <li><b>Tag</b><span class="m">20px high, 6px padding, 4px radius, 12px / 500</span></li>
  <li><b>Badge</b><span class="m">20px high, 8px padding, 16px radius, 11px / 500</span></li>
  <li><b>Phase pill</b><span class="m">12px / 400, 4px &times; 10px padding, 32px radius</span></li>
  <li><b>Version pill</b><span class="m">mono 10px on <code>--layer-2</code>, 16px radius, no
      colour coding</span></li>
  <li><b>Connection dot</b><span class="m">7px &mdash; green #16A34A live, 25% neutral when
      there is none</span></li>
  <li><b>Spinner</b><span class="m">16 inline &middot; 24 in a panel &middot; 40 for a page</span></li>
  <li><b>Avatar</b><span class="m">48 / 32 / 24 / 16, circle or squircle &mdash; pick one shape
      per product and never mix them in a view</span></li>
  <li><b>Empty value</b><span class="m">an em dash in <code>--soft</code>, never a blank cell</span></li>
</ul>

<h2 id="gaps">Known gaps</h2>
<ul class="checklist">
  <li>Banner has no severity axis, which makes it the odd one out. Until it does, use the
      four-severity grammar by hand.</li>
  <li>Badge only drew three of its six size and content combinations.</li>
  <li>Progress bar carries two junk variants and has no indeterminate state &mdash; use the
      spinner when you do not know the total.</li>
  <li>There is no skeleton component. Do not build a fake one.</li>
  <li>There is no empty-state component. The interim rule: say what would appear there, and
      offer exactly one action when the user can create it. Never a bare blank panel.</li>
</ul>

{nextprev(('choosing.html', 'Choosing things'), ('navigation.html', 'Getting around'))}
"""
    return shell('Telling people things', 'Message, toast, banner, tag, badge, tooltip and '
                 'progress — ranked by how loud they are.',
                 'components', 'informing.html', body,
                 toc=[('ladder', 'The loudness ladder'), ('bench', 'All of them'),
                      ('severity', 'Four severities'), ('toastrules', 'Toast rules'),
                      ('phases', 'Phase pills'), ('specs', 'The numbers'),
                      ('gaps', 'Known gaps')])


# ══════════════════════════════════════════════════════════════
#  GETTING AROUND
# ══════════════════════════════════════════════════════════════
CSS_NAV = """/* Verifi navigation — Trinity v0.1.3 + Hub composition rules */

/* Sidebar item — 280px rail, item is 14px with a soft icon */
.vf-navitem {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 8px; border-radius: 8px;
  font-size: 14px; color: var(--defined);
  transition: background .14s, color .14s;
}
.vf-navitem svg { width: 16px; height: 16px; opacity: .6; }
.vf-navitem:hover { background: var(--hover); }        /* selection-tinted, never grey */
.vf-navitem[aria-current="page"] {
  background: var(--select);      /* light #3069e3 · dark #e3f200 */
  color: var(--on-select);        /* light #ffffff · dark #000000 */
}
.vf-navitem[aria-current="page"] svg { opacity: 1; }

/* Tabs — peer views of the same object */
.vf-tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border); }
.vf-tabs > button {
  padding: 11px 16px; font-size: 14px; color: var(--soft);
  border-bottom: 2px solid transparent; margin-bottom: -1px; background: none;
}
.vf-tabs > button[aria-selected="true"] {
  color: var(--strong); border-bottom-color: var(--select);
}

/* Breadcrumbs — climbing a hierarchy, 2 to 7 levels */
.vf-crumbs { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--soft); }
.vf-crumbs a { color: var(--soft); text-decoration: underline; text-underline-offset: 2px; }
.vf-crumbs [aria-current="page"] { color: var(--strong); font-weight: 500; }

/* Pagination */
.vf-pag { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--soft); }
.vf-pag button { min-width: 28px; height: 28px; border-radius: 6px; }
.vf-pag [aria-current="page"] {
  background: var(--select); color: var(--on-select); font-weight: 500;
}"""

TRUCKICON = ('<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
             '<rect x="1.2" y="4.2" width="8.2" height="6.4" rx="1.2" stroke="currentColor" '
             'stroke-width="1.3"/><path d="M9.4 6.4h2.6l2.4 2.4v1.8H9.4z" stroke="currentColor" '
             'stroke-width="1.3" stroke-linejoin="round"/><circle cx="4.6" cy="12" r="1.5" '
             'stroke="currentColor" stroke-width="1.3"/><circle cx="11.6" cy="12" r="1.5" '
             'stroke="currentColor" stroke-width="1.3"/></svg>')


def c_navigation():
    inner = (
        brow('Sidebar item &mdash; active, hover, resting',
             '<div class="binline" style="flex-direction:column;align-items:stretch;gap:4px;'
             'width:100%;max-width:230px">'
             '<span class="c-nav">' + TRUCKICON + 'Trucks</span>'
             '<span class="c-nav" style="background:var(--hov);color:var(--tx)">'
             + TRUCKICON + 'Tickets</span>'
             '<span class="c-nav" style="background:none;color:var(--tx2)">'
             + TRUCKICON + 'Mixtures</span></div>') +
        brow('Tabs',
             '<div class="c-tabs"><button aria-selected="true">Overview</button>'
             '<button aria-selected="false">Sensors</button>'
             '<button aria-selected="false">History</button></div>') +
        brow('Breadcrumbs',
             '<div class="c-crumb"><a href="#0">Fleet</a><span>&rsaquo;</span>'
             '<a href="#0">Rockdale</a><span>&rsaquo;</span><b>Truck 4417</b></div>') +
        brow('Pagination',
             '<div class="c-pag"><span>&lsaquo;</span><b>1</b><span>2</span><span>3</span>'
             '<span>&hellip;</span><span>18</span><span>&rsaquo;</span></div>')
    )

    body = f"""
<p class="eyebrow">Components &middot; Navigators</p>
<h1>Getting around.</h1>
<p class="lede">Five components that answer &ldquo;where am I&rdquo; and &ldquo;how do I get
   back&rdquo;. None of them change anything; that is what makes them navigation.</p>

<h2 id="which">Tabs or segmented control?</h2>
<p>These two look alike and mean different things, and the distinction is worth holding onto.</p>
<div class="useno">
  <div class="y"><h4>Tabs &mdash; wayfinding</h4><ul>
    <li>Peer <em>views of the same object</em>: Overview, Sensors, History for one truck.</li>
    <li>Content swaps in place. Switching is instant and loses nothing.</li>
    <li>Two to eight of them.</li>
  </ul></div>
  <div class="y" style="border-color:var(--rule)"><h4>Segmented &mdash; parameters</h4><ul>
    <li>Different <em>representations of one dataset</em>: All tickets, Fleet map, Phases.</li>
    <li>You are reconfiguring the current view, not moving to another one.</li>
    <li>Two to four of them. <a href="choosing.html">On the choosing page.</a></li>
  </ul></div>
</div>
<div class="note stop"><b>Neither is a stepper.</b> If the views are steps in a sequence, or
  switching away loses unsaved input, you need a stepper &mdash; and no stepper component
  exists. Talk to Verifi Design rather than dressing tabs up as one.</div>

<h2 id="bench">Four of them, both themes</h2>
{copybar('Navigation', 'nav', 'sidebar &middot; tabs &middot; breadcrumbs &middot; pagination')}
{snip('nav', CSS_NAV)}
{bench(inner, inner,
       'Hover on a nav item is selection-tinted, not grey — 5% of the selection colour. '
       'That is the same rule table rows follow.')}

<h2 id="sidebar">The Hub sidebar</h2>
<p>The Hub&rsquo;s primary navigation is a 280px rail on a surface slightly darker than the
   content, and the content sits on it as a floating card at 12px radius, inset 8px from the
   viewport edge.</p>
<ul class="spec">
  <li><b>Width</b><span class="m">280px</span></li>
  <li><b>Top</b><span>The logotype.</span></li>
  <li><b>Items</b><span class="m">14px text, 10px / 8px padding, 8px radius, 16px icon at 60%
      opacity &mdash; 100% when active</span></li>
  <li><b>Groups</b><span>Collapse behind chevrons.</span></li>
  <li><b>New features</b><span>An outlined blue pill reading &ldquo;New&rdquo;.</span></li>
  <li><b>Footer, always</b><span>Account picker in a bordered card, then Profile, Support,
      Settings.</span></li>
  <li><b>Observed items</b><span>Home, Insights, Tickets, Trucks, Mixtures, Return concrete.</span></li>
</ul>
<div class="note"><b>Session scope lives in the sidebar.</b> A separate Account / Division /
  Region / Plant scope bar appeared in early consultant screens and was cut. It will not be in
  the Verifi build. Do not reintroduce it &mdash; the account picker in the sidebar footer is
  where scope is set.</div>

<h2 id="anatomy">Page order</h2>
<p>Every Hub page stacks in the same order, and sticking to it is most of what makes the
   product feel like one product.</p>
<div class="plate inset" style="justify-content:flex-start;display:block;padding:26px 30px">
  <p class="m" style="font-size:13px;line-height:2.1;margin:0;color:var(--ink-soft)">
    title row<br>&darr; <span style="color:var(--ink-faint)">(stat band)</span><br>&darr;
    toolbar<br>&darr; <span style="color:var(--ink-faint)">(tabs)</span><br>&darr;
    content<br>&darr; <span style="color:var(--ink-faint)">(pagination)</span></p>
</div>
<ul class="spec">
  <li><b>Page title</b><span class="m">24px / 500, letter-spacing &minus;0.72px</span></li>
  <li><b>Subtitle</b><span class="m">12&ndash;13px in <code>--soft</code></span></li>
  <li><b>Right slot</b><span>Either &ldquo;Last updated: Today, 9:42 AM&rdquo; or one page
      action as an outline pill. Not both.</span></li>
  <li><b>Gutters</b><span class="m">24px</span></li>
  <li><b>Toolbar</b><span class="m">44px controls, 10px gap &mdash; search, Filters, one quiet
      action, Columns, export; view switcher right-aligned</span></li>
</ul>

<h2 id="drawer">Detail opens in a drawer, not a page</h2>
<p>Clicking an entity in the Hub slides a drawer over a scrim rather than navigating away, so
   the list you were reading stays underneath.</p>
<ul class="spec">
  <li><b>Scrim</b><span class="m">rgba(54,50,45,0.5)</span></li>
  <li><b>Width</b><span class="m">clamp(860px, 100% &minus; 280&ndash;380px, 1400px)</span></li>
  <li><b>Radius</b><span class="m">16px, left corners only</span></li>
  <li><b>Motion</b><span class="m">0.38s cubic-bezier(.22, 1, .36, 1) slide</span></li>
  <li><b>Chrome</b><span>Title left; previous / next arrows and a solid close on the right.</span></li>
  <li><b>Body order</b><span>Summary chip row, then key-value rows at 32px, then bordered
      cards for alerts, each with one quiet outline action.</span></li>
</ul>

<h2 id="gaps">Known gaps</h2>
<ul class="checklist">
  <li><b>Top navigation is structurally broken.</b> Figma reports its variant properties as
      invalid. Do not build against it.</li>
  <li>The entire Hub sidebar cluster exists twice. Instances must reference
      <span class="m">56362:*</span>, never <span class="m">57725:*</span>.</li>
  <li>Tabs have no defined overflow behaviour past eight. The interim rule: scroll the strip,
      never wrap to a second row.</li>
  <li>Breadcrumb links have no hover or focus state drawn. Treat them as links and give them
      the link treatment.</li>
  <li>Pagination is a single component with no states, orphaned from the table it serves.</li>
</ul>

{nextprev(('informing.html', 'Telling people things'), ('containers.html', 'Containers'))}
"""
    return shell('Getting around', 'Tabs, breadcrumbs, the Hub sidebar, in-page anchors and '
                 'pagination.', 'components', 'navigation.html', body,
                 toc=[('which', 'Tabs or segmented'), ('bench', 'Four of them'),
                      ('sidebar', 'The Hub sidebar'), ('anatomy', 'Page order'),
                      ('drawer', 'Drawers'), ('gaps', 'Known gaps')])


# ══════════════════════════════════════════════════════════════
#  CONTAINERS
# ══════════════════════════════════════════════════════════════
CSS_HOLD = """/* Verifi containers — Trinity v0.1.3
   Radii carry the meaning: 4 small, 16 card, 20 large, 32 pill. No shadows on
   anything resting on the page; shadows belong to things floating above it. */

/* Accordion — progressive disclosure of peer sections */
.vf-acc {
  border: 1px solid var(--border); border-radius: 16px; overflow: hidden;
  background: var(--layer-1);
}
.vf-acc__head {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 13px 15px; font-size: 14px; font-weight: 500; color: var(--strong);
  background: none; transition: background .14s;
}
.vf-acc__head:hover { background: var(--hover); }
.vf-acc__head svg { margin-left: auto; transition: transform .18s cubic-bezier(.22,1,.36,1); }
.vf-acc.is-open .vf-acc__head svg { transform: rotate(180deg); }
.vf-acc__body { padding: 0 15px 14px; font-size: 13.5px; color: var(--soft); line-height: 1.5; }

/* Card / widget — the panel most of the product is made of */
.vf-card {
  border-radius: 16px; background: var(--layer-1); padding: 16px;
  box-shadow: inset 0 0 0 1px var(--border);
}

/* Modal — interruption. Only Extra small is drawn; these are the interim sizes. */
.vf-modal {
  border-radius: 16px; background: var(--layer-1); padding: 20px;
  box-shadow: 0 14px 40px rgba(0,0,0,.24);
  max-width: 400px;                 /* xs — the only published size */
}
.vf-modal--sm { max-width: 560px; }
.vf-modal--md { max-width: 720px; }
.vf-modal--lg { max-width: 960px; }
.vf-scrim { background: rgba(54,50,45,.5); }

/* Popover — light contextual menu, dismisses on outside click */
.vf-pop {
  border-radius: 12px; background: var(--layer-1); padding: 6px;
  box-shadow: inset 0 0 0 1px var(--border), 0 10px 30px rgba(0,0,0,.18);
}
.vf-pop__item { padding: 9px 11px; border-radius: 8px; font-size: 13.5px; color: var(--defined); }
.vf-pop__item:hover { background: var(--hover); color: var(--strong); }

/* Table — the product's core surface */
.vf-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.vf-table th {
  position: sticky; top: 0; z-index: 1;
  font-size: 13px; font-weight: 500; text-align: left; padding: 9px 10px;
  border-bottom: 1px solid var(--border); background: var(--layer-1);
}
.vf-table td { padding: 9px 10px; color: var(--defined); white-space: nowrap; }
.vf-table td:first-child { border-right: 1.5px solid var(--border); }
.vf-table tr:nth-child(even) td { background: var(--layer-2); }
.vf-table tr:hover td { background: var(--hover); }   /* selection-tinted, never grey */
.vf-table td.is-number { text-align: right; font-variant-numeric: tabular-nums; }
.vf-table td.is-negative { color: var(--red); }
.vf-table a { color: var(--blue-link); text-decoration: underline; text-underline-offset: 2px; }"""


def c_containers():
    tbl = ('<table class="c-tbl"><thead><tr><th>Truck</th><th>Phase</th>'
           '<th class="num">Slump</th></tr></thead><tbody>'
           '<tr><td><a href="#0">4417</a></td>'
           '<td><span class="c-phase" style="background:%s;color:#fff">Pouring</span></td>'
           '<td class="num">4.2&Prime;</td></tr>'
           '<tr><td><a href="#0">4418</a></td>'
           '<td><span class="c-phase" style="background:%s;color:#fff">Washing</span></td>'
           '<td class="num neg">&minus;0.8&Prime;</td></tr></tbody></table>'
           % (PHASES[5][2], PHASES[6][2]))
    tbl_d = ('<table class="c-tbl"><thead><tr><th>Truck</th><th>Phase</th>'
             '<th class="num">Slump</th></tr></thead><tbody>'
             '<tr><td><a href="#0">4417</a></td>'
             '<td><span class="c-phase" style="background:%s;color:#171614">Pouring</span></td>'
             '<td class="num">4.2&Prime;</td></tr>'
             '<tr><td><a href="#0">4418</a></td>'
             '<td><span class="c-phase" style="background:%s;color:#171614">Washing</span></td>'
             '<td class="num neg">&minus;0.8&Prime;</td></tr></tbody></table>'
             % (PHASES[5][3], PHASES[6][3]))

    def block(table_html):
        return (
            brow('Accordion &mdash; try it',
                 '<div class="c-acc"><button class="h" aria-expanded="false">'
                 'What the sensor measures' + CHEV + '</button>'
                 '<div class="b">Slump, temperature and drum speed, continuously, while the '
                 'truck is moving. Readings are taken at the drum rather than at the chute.</div>'
                 '</div>') +
            brow('Card',
                 '<div class="c-card"><h4>Rockdale plant</h4>'
                 '<p>18 trucks out &middot; 3 within 10 minutes of the job</p></div>') +
            brow('Modal &mdash; only Extra small is drawn',
                 '<div class="c-modal"><h4>Delete this ticket?</h4>'
                 '<p>Ticket 88213 and its sensor history will be removed. This cannot be '
                 'undone.</p><div class="row"><button class="c-btn quiet">Cancel</button>'
                 '<button class="c-btn danger">Delete</button></div></div>') +
            brow('Popover',
                 '<div class="c-pop"><span class="on">Message driver</span>'
                 '<span>Open ticket</span><span>Hide column</span></div>') +
            brow('Table &mdash; zebra, typed cells, entity links',
                 '<div style="width:100%;overflow-x:auto">' + table_html + '</div>')
        )

    body = f"""
<p class="eyebrow">Components &middot; Containers</p>
<h1>Containers.</h1>
<p class="lede">The things other things live in. Their corner radius is not decoration &mdash;
   it tells you what kind of object you are looking at.</p>

<h2 id="radii">Radius carries meaning</h2>
<div class="tw"><table>
  <thead><tr><th class="m">Radius</th><th>Belongs to</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td class="m">4px</td><td>Tags, small chips, banners</td>
        <td>Small enough that a pill would look like a mistake.</td></tr>
    <tr><td class="m">16px</td><td>Cards, widgets, accordions, modals, drawers</td>
        <td>The default for anything holding content.</td></tr>
    <tr><td class="m">20px</td><td>Large containers</td>
        <td>Rare. Use 16 unless something is genuinely oversized.</td></tr>
    <tr><td class="m">32px / 100px</td><td>Buttons, inputs, segmented controls, phase pills</td>
        <td>Anything you press or type into is a pill.</td></tr>
  </tbody>
</table></div>
<div class="note"><b>Shadows mean floating.</b> Cards, widgets and tables sit on the page and
  get a 1px border, never a shadow. Modals, drawers, popovers and toasts float above it and
  get one. If you are reaching for a shadow to make a panel stand out, you want a border and
  a different background instead.</div>

<h2 id="bench">Five of them, both themes</h2>
{copybar('Containers', 'hold', 'accordion &middot; card &middot; modal &middot; popover &middot; table')}
{snip('hold', CSS_HOLD)}
{bench(block(tbl), block(tbl_d),
       'The accordion is live — press a header. Table row hover and nav hover use the same '
       '5% selection tint, which is why the product never feels grey.')}

<h2 id="tables">Tables, because most of the product is one</h2>
<p>Two treatments exist and the choice is contextual, not aesthetic.</p>
<div class="useno">
  <div class="y"><h4>Full-bleed</h4><ul>
    <li>Primary page tables. No outer border, no clipping.</li>
    <li>The page gutters are the table&rsquo;s edges.</li>
  </ul></div>
  <div class="y" style="border-color:var(--rule)"><h4>Boxed</h4><ul>
    <li>Tables inside a widget or card: 1px border, 8px radius, clipped.</li>
    <li>Keeps the table visually inside its container.</li>
  </ul></div>
</div>
<ul class="spec">
  <li><b>Header</b><span class="m">13px / 500, sticky, kebab menu per column on hover for
      hide and sort; drag to reorder; edge handle to resize</span></li>
  <li><b>Cells</b><span class="m">13&ndash;14px <code>--defined</code>, 9&ndash;10px vertical
      padding, no wrapping</span></li>
  <li><b>First column</b><span class="m">separated by a 1.5px rule</span></li>
  <li><b>Zebra</b><span>Even rows take <code>--layer-2</code>; 3% white in dark.</span></li>
  <li><b>Hover</b><span class="m">rgba(48,105,227,.05) light, rgba(227,242,0,.05) dark</span></li>
  <li><b>Entity links</b><span>Underlined, regular weight and family. Blue in light, white in
      dark. Never lime, never mono.</span></li>
  <li><b>Numbers</b><span>Right-aligned through the number cell type. Positive and negative
      deltas use the signed cell types, never ad-hoc colour.</span></li>
  <li><b>Group headers</b><span class="m">#EBE7E0 band, 13px / 600, sticky, with a red count
      badge at 6px radius</span></li>
  <li><b>Empty values</b><span>An em dash in <code>--soft</code>.</span></li>
</ul>
<div class="note"><b>Thirty typed cells exist.</b> Default, Number, Positive Number, Negative
  Number, Slot, Search, Active, Progress, Chart, User, User Group and DoubleSlot. If you are
  writing custom cell markup, check this list first &mdash; the cell you need has probably
  been drawn.</div>

<h2 id="widgets">Widgets</h2>
<p>Dashboard widgets are panels at 16px radius with a title row (16px / 600, icon buttons, and
   a &ldquo;Go to X&rdquo; pill link), a body, and a footer carrying &ldquo;Last updated 1
   minute ago&rdquo; and pagination when the body is a table.</p>
<div class="note"><b>The widget grammar, in one line:</b> every widget renders at all four
  sizes on the shared size scale. A thing that cannot survive being small is not a widget.</div>

<h2 id="gaps">Known gaps</h2>
<ul class="checklist">
  <li><b>Modal has only one size.</b> Extra small. The sm / md / lg widths in the CSS above are
      an interim proposal, not published values. There is also no header or footer slot spec
      and no close-affordance spec.</li>
  <li><b>Card is a stub.</b> The Figma page is called &ldquo;Cards - missing&rdquo; and holds
      one loose component with no variants. The card CSS above is taken from the widget
      pattern, which is the closest thing to a real spec.</li>
  <li>The 30-variant cell set exists twice, and the table wrapper itself is a loose component
      with no variants. There is no sort spec, no selection spec and no empty state.</li>
  <li>Two Hub components carry unnamed axes and a version number in the component name
      (Truck Card V.3).</li>
</ul>

{nextprev(('navigation.html', 'Getting around'), ('../resources/index.html', 'Resources'))}
"""
    return shell('Containers', 'Accordion, modal, popover, card, table and widgets.',
                 'components', 'containers.html', body,
                 toc=[('radii', 'Radius carries meaning'), ('bench', 'Five of them'),
                      ('tables', 'Tables'), ('widgets', 'Widgets'), ('gaps', 'Known gaps')])
