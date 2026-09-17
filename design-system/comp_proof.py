#!/usr/bin/env python3
"""Breadcrumbs and Table — the two pages that prove the template."""
from comp_rest import PHASES
from core import (shell, meta, pill, copybar, bench, brow, spec, dodont,
                  checklist, table, ARROW)

CHEV = ('<svg class="sep" viewBox="0 0 12 12" fill="none" aria-hidden="true">'
        '<path d="M4.4 2.6L7.8 6l-3.4 3.4" stroke="currentColor" stroke-width="1.5" '
        'stroke-linecap="round" stroke-linejoin="round"/></svg>')
SORT = ('<svg viewBox="0 0 12 12" fill="none" aria-hidden="true">'
        '<path d="M6 1.6v8.8M3 4.2L6 1.4l3 2.8M3 7.8L6 10.6l3-2.8" stroke="currentColor" '
        'stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>')


# ── Showcase: the table with other components inside its cells ──
# Figma 63798:44339 (light), 63798:45247 (dark), header 63798:43886.
PHASE_HEX = {n: (strong, subtle) for n, strong, subtle in PHASES}

SHOWCASE_COLS = [('Truck #', 80), ('Phase', 140), ('Customer', 180),
                 ('Status', 100), ('Progress', 200), ('Priority', 150)]

SHOWCASE_ROWS = [
    ('5040', 'Return to plant', 'Concrete Supply',   ('Active',  ''),    78, 'High'),
    ('5095', 'Pouring',         'Building Futures',  ('Alert',   'err'), 50, 'Medium'),
    ('3021', 'On site',         'Construction Corp', ('Idle',    'alt'), 88, 'Low'),
    ('1924', 'Loaded',          'Metro Builders',    ('Active',  ''),    30, 'High'),
    ('8443', 'To job',          'Concrete Supply',   ('Active',  ''),   100, 'Medium'),
    ('9662', 'Waiting to load', 'Building Futures',  ('Pending', 'alt'), 12, 'Low'),
]


def _showcase(dark=False):
    head = ''
    for label, w in SHOWCASE_COLS:
        head += ('<th style="width:%dpx"><span class="srt">%s%s</span></th>'
                 % (w, label, SORT))
    body = ''
    for num, phase, cust, (status, scls), pct, pri in SHOWCASE_ROWS:
        strong, subtle = PHASE_HEX[phase]
        bg = subtle if dark else strong
        fg = '#171614' if dark else '#fff'
        body += ('<tr>'
                 '<td>%s</td>'
                 '<td><span class="c-phase" style="background:%s;color:%s">%s</span></td>'
                 '<td>%s</td>'
                 '<td><span class="t-badge %s">%s</span></td>'
                 '<td><span class="t-pbar" style="max-width:180px">'
                 '<i style="width:%d%%"></i></span></td>'
                 '<td><span class="t-chip">%s</span></td>'
                 '</tr>' % (num, bg, fg, phase, cust, scls, status, pct, pri))
    return ('<div style="width:100%%;overflow-x:auto"><table class="c-tbl striped showcase">'
            '<thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (head, body))


SHOWCASE_HTML = """<table class="vf-table vf-table--striped">
  <thead>
    <tr>
      <th scope="col" style="width:80px">Truck #</th>
      <th scope="col" style="width:140px">Phase</th>
      <th scope="col" style="width:180px">Customer</th>
      <th scope="col" style="width:100px">Status</th>
      <th scope="col" style="width:200px">Progress</th>
      <th scope="col" style="width:150px">Priority</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>5040</td>
      <td><span class="vf-phase vf-phase--return">Return to plant</span></td>
      <td>Concrete Supply</td>
      <td><span class="vf-badge">Active</span></td>
      <td>
        <span class="vf-progress" role="progressbar" aria-valuenow="78"
              aria-valuemin="0" aria-valuemax="100" aria-label="Load progress">
          <i style="width:78%"></i>
        </span>
      </td>
      <td><span class="vf-chip">High</span></td>
    </tr>
  </tbody>
</table>"""

SHOWCASE_CSS = """/* The cell is a container. Nothing about the component changes
   because it is inside a table. */
.c-tbl.showcase td{ padding-top:11px; padding-bottom:11px; }
.c-tbl.showcase .t-pbar{ display:block; width:100%; }

.t-chip{
  display:inline-flex; align-items:center; height:22px; padding:0 10px;
  border-radius:100px; font-size:13px; line-height:1;
  color:var(--tink); box-shadow:inset 0 0 0 1px var(--bdm);
}"""


# ══════════════════════════════════════════════════════════════
#  BREADCRUMBS
# ══════════════════════════════════════════════════════════════
def crumbs(items, foc=None):
    """items: list of (label, kind) where kind is link | cur | ov"""
    out = '<nav class="c-crumbs" aria-label="Breadcrumbs">'
    for i, (label, kind) in enumerate(items):
        last = i == len(items) - 1
        cls = 'ci' + ('' if kind == 'link' else ' ' + kind)
        if foc is not None and i == foc:
            cls += ' foc'
        if kind == 'cur':
            out += '<span class="%s" aria-current="page">%s</span>' % (cls, label)
        elif kind == 'ov':
            out += '<button class="%s" aria-label="Show 3 more pages">%s</button>' % (cls, label)
        else:
            out += '<a class="%s" href="#0">%s</a>' % (cls, label)
        if not last:
            out += CHEV
    return out + '</nav>'


CRUMB_HTML = """<nav class="vf-crumbs" aria-label="Breadcrumbs">
  <ol>
    <li><a href="/fleet">Fleet</a></li>
    <li><a href="/fleet/rockdale">Rockdale</a></li>
    <li><a href="/fleet/rockdale/trucks">Trucks</a></li>
    <li><span aria-current="page">Truck 4417</span></li>
  </ol>
</nav>"""

CRUMB_CSS = """/* Verifi breadcrumbs — Trinity spec 63904:41676, v1.0 draft
   Link #0975c3, current page #666054, ABC Repro 14/18.
   Separators are CSS-generated and hidden from screen readers. */
.vf-crumbs ol {
  display: flex;
  align-items: center;
  gap: 8px;                       /* layout.gap2 */
  margin: 0;
  padding: 0;
  list-style: none;
  min-height: 16px;               /* layout.size2 — reserved even when empty */
  overflow: hidden;
  flex-wrap: nowrap;              /* breadcrumbs never wrap to a second line */
}
.vf-crumbs li { display: flex; align-items: center; gap: 8px; }

.vf-crumbs a,
.vf-crumbs span {
  padding: 6px;                   /* layout.breadcrumbItemPadding */
  border-radius: 4px;             /* layout.breadcrumbItemRadius */
  font-family: 'ABC Repro', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 18px;
  font-weight: 400;
  white-space: nowrap;
  max-width: 30ch;                /* 30-character truncation rule */
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color .2s, background .2s;
}

.vf-crumbs a {
  color: #0975c3;                 /* style.breadcrumbItemTextDefault — 4.83:1 on white */
  text-decoration: none;
  cursor: pointer;
}
.vf-crumbs a:hover { text-decoration: underline; text-underline-offset: 2px; }
.vf-crumbs a:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px #171614, 0 0 4px 2px rgba(141,135,121,.5);
}

.vf-crumbs [aria-current="page"] {
  color: #666054;                 /* style.breadcrumbItemTextCurrentPage — 6.24:1 */
  cursor: default;
}

/* Separator — decorative, never announced, never focusable */
.vf-crumbs li:not(:last-child)::after {
  content: "";
  width: 12px;
  height: 12px;
  flex: none;
  background: currentColor;
  color: #666054;                 /* style.breadcrumbItemIconDefault — 3:1 minimum */
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M4.4 2.6L7.8 6l-3.4 3.4' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/contain no-repeat;
          mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M4.4 2.6L7.8 6l-3.4 3.4' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/contain no-repeat;
}"""

OVERFLOW_HTML = """<nav class="vf-crumbs" aria-label="Breadcrumbs">
  <ol>
    <li><a href="/fleet">Fleet</a></li>
    <li><a href="/fleet/midwest">Midwest</a></li>
    <li>
      <button class="vf-crumbs__more" aria-haspopup="menu" aria-expanded="false"
              aria-label="Show 3 more pages">…</button>
    </li>
    <li><a href="/fleet/midwest/rockdale/trucks">Trucks</a></li>
    <li><span aria-current="page">Truck 4417</span></li>
  </ol>
</nav>"""

OVERFLOW_CSS = """/* Overflow trigger — fires at 6+ items regardless of container width.
   Menu must open on hover AND focus AND click (WCAG 1.4.13). */
.vf-crumbs__more {
  padding: 6px;
  border: 0;
  border-radius: 4px;
  background: none;
  color: #0975c3;
  font: inherit;
  letter-spacing: .08em;
  cursor: pointer;
  min-width: 24px;                /* WCAG 2.5.8 — 24x24 touch target */
  min-height: 24px;
}
.vf-crumbs__more:hover,
.vf-crumbs__more:focus-visible { background: rgba(9,117,195,.06); }
.vf-crumbs__more:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px #171614, 0 0 4px 2px rgba(141,135,121,.5);
}"""

TRUNC_CSS = """/* Per-item truncation — fires before anything else is dropped.
   Labels over 30 characters get an ellipsis and a tooltip on hover AND focus.
   Tooltip content caps at 80 characters. */
.vf-crumbs a,
.vf-crumbs span {
  max-width: 30ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}"""


def c_breadcrumbs():
    full = crumbs([('Fleet', 'link'), ('Rockdale', 'link'),
                   ('Trucks', 'link'), ('Truck 4417', 'cur')])
    over = crumbs([('Fleet', 'link'), ('Midwest', 'link'), ('&hellip;', 'ov'),
                   ('Trucks', 'link'), ('Truck 4417', 'cur')])
    mob = crumbs([('Fleet', 'link'), ('&hellip;', 'ov')])
    trunc = crumbs([('Fleet', 'link'),
                    ('<span class="trunc">Rockdale Ready Mix North Yard</span>', 'link'),
                    ('Truck 4417', 'cur')])
    states = (
        brow('Default', crumbs([('Fleet', 'link'), ('Rockdale', 'cur')])) +
        brow('Focus &mdash; 2px border plus shadow',
             crumbs([('Fleet', 'link'), ('Rockdale', 'cur')], foc=0)) +
        brow('Current page &mdash; not a link, not focusable',
             crumbs([('Truck 4417', 'cur')]))
    )

    body = f"""
<h1>Breadcrumbs.</h1>
<p class="lede">Breadcrumbs show where a page sits in a hierarchy and let someone climb back
   up it. They are navigation, never filters, and never a substitute for a page title.</p>
{meta([
  pill('gap'),
  '<span class="v">Spec v1.0 draft &middot; March 2026</span>',
  '<span class="v">Molecule (trail) + atom (items)</span>',
  '<a class="v" href="https://www.figma.com/design/Lx7MN3Ztd0qxhyF7rVAiOa/Trinity-Design-System--for-review-?node-id=63904-41676" target="_blank" rel="noopener">Figma 63904:41676 &nearr;</a>',
])}
<div class="note warn"><b>Status: research complete, pending Figma build.</b> The written
  specification is finished and unusually thorough &mdash; everything on this page comes from it.
  The component itself is not built in Figma yet, so what you see here is the spec rendered in
  code, not a screenshot of a finished component.</div>

<h2 id="example">Example</h2>
{bench(full, full,
       'Link <span class="m">#0975C3</span>, current page <span class="m">#666054</span>. '
       'The dark column is a derivation &mdash; see accessibility below.')}

<h2 id="anatomy">Anatomy</h2>
{spec([
  ('Trail', 'A <code>&lt;nav aria-label="Breadcrumbs"&gt;</code> wrapping an ordered list. '
            'The landmark is what a screen reader announces.'),
  ('Link item', 'A standard crumb with the full interactive state set. '
                '<span class="m">#0975C3</span>, ABC Repro 14px / weight 400.'),
  ('Current page', 'The last item. Static text, <code>aria-current="page"</code>, not '
                   'focusable, no states. <span class="m">#666054</span>.'),
  ('Overflow trigger', 'A <code>&hellip;</code> button that opens a menu of the collapsed items.'),
  ('Separator', 'A 12&times;12 angle-right, <code>aria-hidden</code>, generated in CSS. '
                'Never focusable, never announced.'),
  ('Item padding', '<span class="m">6px</span>, radius <span class="m">4px</span>'),
  ('Gap between items', '<span class="m">8px</span>'),
  ('Container height', '<span class="m">16px</span> &mdash; reserved even when no trail renders, '
                       'so the page below it does not jump'),
])}
<div class="note"><b>Placement is part of the spec.</b> Breadcrumbs sit in the content area
  <em>above</em> the page header. They are not embedded inside the header component, and the
  container keeps its height on pages with no trail so headings never shift.</div>

<h2 id="options">Options</h2>

{copybar('Standard trail', 'crumb', 'up to 5 items', CRUMB_HTML, CRUMB_CSS)}
{bench(full, full)}
<p>All items visible. This is the default and it covers three to five levels, which is the
   recommended depth for almost everything.</p>

{copybar('With overflow', 'crumbov', '6+ items', OVERFLOW_HTML, OVERFLOW_CSS)}
{bench(over, over)}
<p>At six or more items the overflow pattern fires <strong>regardless of container width</strong>.
   What stays visible: the first two items, the item immediately before the current page, and the
   current page. Everything between collapses behind the trigger, listed in hierarchical order.</p>

{copybar('Truncated item', 'crumbtr', '30 characters', None, TRUNC_CSS)}
{bench(trunc, trunc)}
<p>A label over 30 characters truncates with an ellipsis and gets a tooltip on hover
   <em>and</em> focus showing the full text. Tooltip content caps at 80 characters.</p>

{copybar('Mobile', 'crumbmo', '375px minimum', None, None)}
{bench(mob, mob)}
<p>At 375px the current page name drops entirely, because it is already visible as the page
   title directly below. What remains is the first item and the overflow trigger.</p>

<h2 id="states">States</h2>
{bench(states, states)}
{table(['State', 'What changes', 'Note'], [
  ['Default', '<span class="m">#0975C3</span>, ABC Repro 14 / 400, pointer cursor',
   'The base interactive appearance.'],
  ['Hover', 'Colour shift', 'Matches the link hover pattern used everywhere else.'],
  ['Active', 'Darker colour shift', 'Brief feedback on click.'],
  ['Focus', '2px border plus <span class="m">0 0 4px 2px</span> neutral shadow',
   'WCAG 2.4.7. Mandatory, never removed.'],
  ['Truncated', 'Ellipsis after 30 characters', 'Tooltip on hover and on focus.'],
  ['Current page', 'No states at all', 'It is not interactive, so it has nothing to respond to.'],
])}

<h2 id="behaviour">Behaviour</h2>
<h3>What gets dropped first</h3>
<p>As the container narrows, three things happen in this order. Knowing the order is what stops
   people inventing a fourth.</p>
{checklist([
  '<b>1 &middot; Per-item truncation.</b> Labels over 30 characters get an ellipsis and a tooltip. '
  'Nothing has been removed yet.',
  '<b>2 &middot; The current page name drops.</b> It is already the page title below, so removing '
  'it costs no context.',
  '<b>3 &middot; Middle items collapse into the overflow menu.</b> The first item always stays '
  'visible. Collapsed items appear in hierarchical order.',
])}
<div class="note stop"><b>Breadcrumbs never wrap to a second line.</b> Not at any width, not for
  any depth. If it does not fit, it truncates or collapses.</div>

<h3>Responsive</h3>
{table(['Context', 'Usable width', 'What renders'], [
  ['Desktop', 'Wide', 'Full trail up to 5 items. At 6+: first two, overflow trigger, '
                      'item before current, current page.'],
  ['Tablet', '748px+', 'Current page stays visible; middle items may collapse depending on depth.'],
  ['Mobile', '355px', 'Current page drops. First item plus overflow trigger only.'],
])}
<p class="cap">Minimum supported viewport is 375px, with 10px padding on all sides &mdash; which
   leaves 355px of usable space. That covers every iPhone from the 6 forward and nearly all
   Android devices.</p>

<h3>Depth</h3>
{table(['Depth', 'Recommendation', 'Source'], [
  ['3&ndash;5 levels', 'The optimal range for most applications', 'Industry consensus'],
  ['4 levels', 'Recommended maximum including the first level', 'Current design system guidance'],
  ['6 levels', 'Absolute maximum &mdash; past this, flatten the information architecture instead',
   'Current design system guidance'],
])}

<h2 id="guidelines">Guidelines</h2>
{dodont(
  ['Use breadcrumbs to communicate a genuine hierarchical relationship.',
   'Keep the trail consistent &mdash; the same page reached two ways shows the same trail.',
   'Let the first item stay visible at every width. It is the anchor.',
   'Put them above the page header, in the content area.'],
  ['Do not use breadcrumbs as filters. A filter state is not a hierarchy.',
   'Do not use them for lateral navigation between peers &mdash; that is tabs.',
   'Do not indent the items inside the overflow menu. It reads as a second hierarchy and '
   'makes the menu harder to scan.',
   'Do not repeat the current page as both a crumb and the page title on mobile.'])}

<h2 id="specs">Specs</h2>
{spec([
  ('Font', 'ABC Repro 14px / 18px line-height / weight 400'),
  ('Link colour', '<span class="sw" style="background:#0975c3"></span>'
                  '<span class="m">#0975C3</span>'),
  ('Current page colour', '<span class="sw" style="background:#666054"></span>'
                          '<span class="m">#666054</span>'),
  ('Separator colour', '<span class="sw" style="background:#666054"></span>'
                       '<span class="m">#666054</span>'),
  ('Separator size', '<span class="m">12 &times; 12</span>'),
  ('Item padding', '<span class="m">6px</span>'),
  ('Item radius', '<span class="m">4px</span>'),
  ('Gap', '<span class="m">8px</span>'),
  ('Container height', '<span class="m">16px</span>, reserved'),
  ('Truncation', '30 characters, tooltip caps at 80'),
  ('Touch target', '<span class="m">24 &times; 24</span> minimum'),
  ('Motion', 'Hover 200ms &middot; tooltip in 200ms ease-out &middot; '
             'menu open 200ms ease-out, close 200ms ease-in'),
])}

<h2 id="a11y">Accessibility</h2>
<h3>Structure</h3>
{checklist([
  '<code>&lt;nav aria-label="Breadcrumbs"&gt;</code> wraps the whole thing, giving it a landmark.',
  'An ordered list inside &mdash; <code>ol &gt; li</code> &mdash; because the sequence is the meaning.',
  '<code>aria-current="page"</code> on the last item, which is not a link.',
  'Separators carry <code>aria-hidden="true"</code> and are never focusable.',
])}

<h3>Keyboard</h3>
{table(['Key', 'Action'], [
  ['Tab', 'Moves between link items and the overflow trigger. Focusing the trigger opens its menu.'],
  ['Enter', 'Activates the focused link, or opens the overflow menu.'],
  ['Escape', 'Closes the overflow menu and returns focus to the trigger.'],
  ['&mdash;', 'The current page and the separators are not in the tab order at all.'],
])}

<h3>Contrast, measured</h3>
<div class="tw"><table id="cr-tbl">
  <thead><tr><th>Pair</th><th class="m">Ratio</th><th>Verdict</th><th>Required</th></tr></thead>
  <tbody id="cr-body"><tr><td colspan="4">Measuring&hellip;</td></tr></tbody>
</table></div>
<div class="note warn"><b>The published link blue fails in dark mode.</b>
  <span class="m">#0975C3</span> on the dark surface measures 3.40:1, under the 4.5:1 bar. The
  spec only defines light mode, so the dark column on this page uses
  <span class="m">#8DC6F0</span> for links and <span class="m">#B6B1A5</span> for the current
  page. Those are our derivation, not a decision &mdash;
  <a href="../open-items.html">tracked as an open item</a>.</div>

<h3>Screen reader</h3>
{checklist([
  '&ldquo;Breadcrumbs, navigation&rdquo; on entering the landmark.',
  'Each item announced as a link with its label.',
  'The last item announced with &ldquo;current page&rdquo;.',
  'The overflow trigger announced as a button.',
  'Separators are not announced at all.',
])}

<h2 id="gaps">Known gaps</h2>
{checklist([
  '<b>The component is not built in Figma yet.</b> The spec is complete; the artwork is pending. '
  'Anything you build today is against the written spec, not against a published component.',
  '<b>Dark mode is not specified.</b> Both colours here are derived, and the published link blue '
  'measurably fails on a dark surface.',
  '<b>Hover and active colours are described but not given.</b> The spec says '
  '&ldquo;colour shift&rdquo; and points at the link pattern; no hex is published.',
  '<b>The spec describes the separator two ways</b> &mdash; as a CSS-generated '
  '&ldquo;&gt;&rdquo; character in the key decisions, and as a 12&times;12 angle-right icon '
  'everywhere else. We use the icon, masked in CSS, which satisfies both.',
])}

<script>
document.addEventListener('DOMContentLoaded',function(){{
  if(!window.vfRatio) return;
  var P=[['Link #0975C3 on white','#0975c3','#ffffff','4.5:1'],
         ['Current page #666054 on white','#666054','#ffffff','4.5:1'],
         ['Separator #666054 on white','#666054','#ffffff','3:1 (non-text)'],
         ['Link #0975C3 on dark #211F1C','#0975c3','#211f1c','4.5:1'],
         ['Derived link #8DC6F0 on dark','#8dc6f0','#211f1c','4.5:1'],
         ['Derived current #B6B1A5 on dark','#b6b1a5','#211f1c','4.5:1']];
  var out='';
  P.forEach(function(p){{
    var r=window.vfRatio(p[1],p[2]), v=window.vfVerdict(r);
    out+='<tr><td class="wrap">'+p[0]+'</td><td class="m">'+r.toFixed(2)+':1</td>'
       +'<td><span class="pill '+v[0]+'">'+v[1]+'</span></td><td class="m">'+p[3]+'</td></tr>';
  }});
  document.getElementById('cr-body').innerHTML=out;
}});
</script>
"""
    return shell('Breadcrumbs',
                 'Breadcrumbs show where a page sits in a hierarchy and let someone climb back up it.',
                 'components/breadcrumbs.html', body,
                 crumb=['Components', 'Breadcrumbs'],
                 toc=[('example', 'Example'), ('anatomy', 'Anatomy'), ('options', 'Options'),
                      ('states', 'States'), ('behaviour', 'Behaviour'),
                      ('guidelines', 'Guidelines'), ('specs', 'Specs'),
                      ('a11y', 'Accessibility'), ('gaps', 'Known gaps')])


# ══════════════════════════════════════════════════════════════
#  TABLE
# ══════════════════════════════════════════════════════════════
TABLE_HTML = """<table class="vf-table">
  <thead>
    <tr>
      <th scope="col"><button class="vf-table__sort">Truck</button></th>
      <th scope="col"><button class="vf-table__sort">Plant</button></th>
      <th scope="col" class="is-number">Slump</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><a href="/trucks/4417">4417</a></td>
      <td>Rockdale</td>
      <td class="is-number">4.2"</td>
    </tr>
    <tr class="is-selected">
      <td><a href="/trucks/4418">4418</a></td>
      <td>Rockdale</td>
      <td class="is-number is-negative">−0.8"</td>
    </tr>
    <tr class="is-disabled">
      <td>4419</td>
      <td>Midwest</td>
      <td class="is-number">—</td>
    </tr>
  </tbody>
</table>"""

TABLE_CSS = """/* Verifi table — Trinity spec 63544:2653
   Architecture: Cell → Row content → Row. The ROW owns the background,
   never the cell — that is what makes hover, striping, selection and
   disabled states possible at all. */
.vf-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 16px;
}

/* Header — one state only. Hover lives on the cell, not the row. */
.vf-table th {
  background: #ffffff;              /* table/cell/header/background */
  color: #171614;                   /* table/cell/header/text */
  font-weight: 500;
  text-align: left;
  padding: 13px 10px;
  border-bottom: 2px solid #4a4f55; /* Table Header bottom border */
  white-space: nowrap;
}
.vf-table th:hover { background: #f6f4f2; }   /* table/cell/header/background-hover */

.vf-table__sort {
  display: inline-flex; align-items: center; gap: 6px;
  border: 0; background: none; font: inherit; color: inherit; cursor: pointer;
}

/* Body cells — the row paints the background, the cell only pads */
.vf-table td {
  color: #171614;                   /* table/cell/body/text */
  padding: 13px 10px;
  border-bottom: 1px solid #dad8d7; /* Table Row Bottom Border */
  white-space: nowrap;
}

/* Row states */
.vf-table tbody tr            { background: #ffffff; }  /* row/background-default */
.vf-table tbody tr:hover      { background: #f6f4f2; }  /* row/background-hover */
.vf-table tbody tr.is-selected{ background: #eef9ff; }  /* row/background-selected */
.vf-table tbody tr.is-disabled{ background: #dfdedd; opacity: .3; pointer-events: none; }
.vf-table.is-striped tbody tr:nth-child(even) { background: #f0eeea; }

/* Typed cells — never colour a number by hand */
.vf-table .is-number   { text-align: right; font-variant-numeric: tabular-nums; }
.vf-table .is-negative { color: #d70100; }
.vf-table a { color: #0975c3; text-decoration: underline; text-underline-offset: 2px; }

/* Selection column */
.vf-table .vf-table__pick { width: 24px; padding-right: 0; }"""

STRIPE_CSS = """/* Striped rows — a variant on the ROW, not a separate component.
   Use it when rows are wide enough that the eye loses the line. */
.vf-table.is-striped tbody tr:nth-child(even) { background: #f0eeea; }

/* Striping and hover must not fight: hover wins. */
.vf-table.is-striped tbody tr:hover { background: #f6f4f2; }"""

PICK_HTML = """<table class="vf-table">
  <thead>
    <tr>
      <th scope="col" class="vf-table__pick">
        <input type="checkbox" aria-label="Select all rows">
      </th>
      <th scope="col">Truck</th>
      <th scope="col">Phase</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="vf-table__pick"><input type="checkbox" aria-label="Select truck 4417"></td>
      <td><a href="/trucks/4417">4417</a></td>
      <td><span class="vf-phase">Pouring</span></td>
    </tr>
  </tbody>
</table>"""


def _tbl(striped=False, pick=None, sel=False, dis=False):
    cls = 'c-tbl' + (' striped' if striped else '')
    pickhead = ''
    if pick == 'cbx':
        pickhead = '<th class="pick"><span class="c-cbx"><i></i></span></th>'
    elif pick == 'rad':
        pickhead = '<th class="pick"></th>'
    rows = [('4417', 'Rockdale', '4.2&Prime;', '', 'on'),
            ('4418', 'Rockdale', '&minus;0.8&Prime;', 'sel' if sel else '', ''),
            ('4419', 'Midwest', '&mdash;', 'dis' if dis else '', '')]
    body = ''
    for num, plant, slump, rcls, checked in rows:
        cell = ''
        if pick == 'cbx':
            cell = ('<td class="pick"><span class="c-cbx %s"><i></i></span></td>'
                    % checked)
        elif pick == 'rad':
            cell = '<td class="pick"><span class="c-rad %s"><i></i></span></td>' % checked
        neg = ' neg' if slump.startswith('&minus;') else ''
        body += ('<tr class="%s">%s<td><a href="#0">%s</a></td><td>%s</td>'
                 '<td class="num%s">%s</td></tr>' % (rcls, cell, num, plant, neg, slump))
    return ('<div style="width:100%%;overflow-x:auto"><table class="%s"><thead><tr>%s'
            '<th><span class="srt">Truck %s</span></th><th>Plant</th>'
            '<th class="num">Slump</th></tr></thead><tbody>%s</tbody></table></div>'
            % (cls, pickhead, SORT, body))


def c_table():
    plain = _tbl()
    striped = _tbl(striped=True)
    withsel = _tbl(sel=True, dis=True)
    withcbx = _tbl(pick='cbx')
    withrad = _tbl(pick='rad')

    body = f"""
<h1>Table.</h1>
<p class="lede">Dense, comparable records in typed columns. This is the surface most of the Hub
   is made of, so the rules here matter more than anywhere else in the library.</p>
{meta([
  pill('gap'),
  '<span class="v">Cell &rarr; Row content &rarr; Row</span>',
  '<a class="v" href="https://www.figma.com/design/Lx7MN3Ztd0qxhyF7rVAiOa/Trinity-Design-System--for-review-?node-id=63544-2653" target="_blank" rel="noopener">Figma 63544:2653 &nearr;</a>',
])}

<h2 id="example">Example</h2>
{bench(plain, plain,
       'Row height 42px, cell padding 13px &times; 10px, 1px row rule, 2px header rule.')}

<h2 id="anatomy">Anatomy</h2>
<p>Three nested components, and the nesting is the whole design. Get this wrong and none of the
   row states are possible.</p>
{spec([
  ('<span class="m">Table_Cell</span>',
   'One cell. Body cells are slot-based with a single state; header cells have default and '
   'hover. The cell has <em>no background of its own</em> in a body row.'),
  ('<span class="m">Table_Row_Content</span>',
   'A horizontal wrapper of cells &mdash; this is your column definition. Duplicate it, rename '
   'it, add or resize cells, then swap it into the row.'),
  ('<span class="m">Table_Row</span>',
   'The full row: background, state, and the four toggles. <b>The row owns the background.</b>'),
])}
<div class="note ok"><b>Why the row owns the background.</b> Hover, striping, selection and
  disabled are all row-level facts. If each cell painted itself, every one of those states would
  need to be set on every cell in the row and would break the moment somebody added a column.
  This is the single most important thing to carry into code.</div>

<h3>Row slots, left to right</h3>
{spec([
  ('Row inset', '<span class="m">10px</span> from the row edge'),
  ('Checkbox slot', '<span class="m">24px</span> &mdash; <code>Show tableToggle</code>'),
  ('Radio slot', '<span class="m">24px</span> &mdash; <code>Show tableRadioButton</code>'),
  ('Icon slot', '<span class="m">30px</span> &mdash; <code>show rowIcon</code>'),
  ('Row content', 'Your cells, filling the remaining width'),
  ('Accordion button', '<span class="m">34px</span>, right-aligned &mdash; '
                       '<code>Show Accordion Button Toggle</code>'),
])}
<div class="note stop"><b>Checkbox and radio are mutually exclusive.</b> They appear together in
  the Figma file only to show that both slots exist. A table offers multi-select or single-select,
  never both.</div>

<h2 id="options">Options</h2>

{copybar('Standard table', 'tbl', '42px rows', TABLE_HTML, TABLE_CSS)}
{bench(plain, plain)}

{copybar('Striped', 'tblz', 'alternating rows', None, STRIPE_CSS)}
{bench(striped, striped)}
<p>Striping is a boolean on the row, not a separate component. Use it when rows are wide enough
   that the eye loses the line; skip it when the table is three columns and obvious.</p>

{copybar('Multi-select', 'tblcb', 'checkbox column', PICK_HTML, None)}
{bench(withcbx, withcbx)}
<div class="note ok"><b>Row selectors now match the standalone components.</b> The Figma table
  draws its checkbox and radio at <span class="m">24 &times; 24</span>, which disagreed with the
  <span class="m">16 &times; 16</span> of the
  <a href="checkbox.html">Checkbox</a> and <a href="radio-group.html">Radio group</a> components.
  Verifi Design has settled it in favour of the standalone size, so a checkbox is one size
  everywhere in the product. This page renders <span class="m">16 &times; 16</span>.</div>

{copybar('Single select', 'tblrd', 'radio column', None, None)}
{bench(withrad, withrad)}

<h3 id="showcase">Components inside cells</h3>
<p>The cell is a container and nothing else. A component dropped into one keeps its own
   size, its own tokens and its own theme behaviour &mdash; the table does not restyle it.
   This is the arrangement Figma publishes as the showcase table, and it is the fastest way
   to see whether the newer components agree with each other.</p>
{copybar('Showcase', 'tblshow', '6 columns', SHOWCASE_HTML, SHOWCASE_CSS)}
<div class="bench stack">
  <div class="pane pane-l"><div class="ph">Light</div><div class="pb">{_showcase(False)}</div></div>
  <div class="pane pane-d"><div class="ph">Dark</div><div class="pb">{_showcase(True)}</div></div>
</div>
<p class="cap">Truck phase tag, Badge, Progress bar and Chip, all in one row. The phase tag is
   the only one that inverts between themes; everything else keeps its colour and lets the row
   background change underneath it. Stacked rather than side by side because six columns do not
   fit in half a page.</p>
{table(['Column', 'Width', 'What is in it'], [
  ['Truck #', '<span class="m">80px</span>', 'Plain text, the row identifier'],
  ['Phase', '<span class="m">140px</span>',
   '<a href="truck-phase-tag.html">Truck phase tag</a> &mdash; sized by its label'],
  ['Customer', '<span class="m">180px</span>', 'Plain text'],
  ['Status', '<span class="m">100px</span>',
   '<a href="badge.html">Badge</a> &mdash; Default, Alternate or Error'],
  ['Progress', '<span class="m">200px</span>',
   '<a href="progress-bar.html">Progress bar</a> at <span class="m">180px</span> wide'],
  ['Priority', '<span class="m">150px</span>', 'Chip, outline only'],
])}
<div class="note warn"><b>The progress track is invisible here too.</b> Look at the 100%
  row against the ones below it &mdash; on a light background you cannot tell where the
  track ends. That is <a href="../open-items.html">open item 11</a>, and a table is where
  it does the most damage, because rows are compared against each other.</div>

<h2 id="states">States</h2>
{bench(withsel, withsel, 'Row 2 selected, row 3 disabled.')}
{table(['State', 'Light', 'Dark (derived)', 'Note'], [
  ['Default', '<span class="sw" style="background:#fff"></span><span class="m">#FFFFFF</span>',
   '<span class="sw" style="background:#211f1c"></span><span class="m">#211F1C</span>', ''],
  ['Hover', '<span class="sw" style="background:#f6f4f2"></span><span class="m">#F6F4F2</span>',
   '<span class="sw" style="background:#2f2d28"></span><span class="m">#2F2D28</span>',
   'Row level. Header hover is separate and lives on the cell.'],
  ['Selected', '<span class="sw" style="background:#eef9ff"></span><span class="m">#EEF9FF</span>',
   '<span class="sw" style="background:#0c2a3a"></span><span class="m">#0C2A3A</span>',
   'This is brand Blue 0, not the product Blue 0. See known gaps.'],
  ['Striped (even)', '<span class="sw" style="background:#f0eeea"></span><span class="m">#F0EEEA</span>',
   '<span class="sw" style="background:#1c1a18"></span><span class="m">#1C1A18</span>',
   'Only when the striped variant is on.'],
  ['Disabled', '<span class="sw" style="background:#dfdedd"></span><span class="m">#DFDEDD</span>',
   '<span class="sw" style="background:#2a2825"></span><span class="m">#2A2825</span>',
   'Plus 30% opacity on the row contents.'],
])}
<p>The header row has <strong>one state</strong>. Its hover belongs to the individual header
   cell, because hovering a column header is about that column &mdash; sorting it, hiding it,
   resizing it &mdash; not about the row.</p>

<h2 id="behaviour">Behaviour</h2>
<h3>Which framing to use</h3>
{dodont(
  ['<b>Full-bleed</b> for a primary page table. No outer border, no clipping &mdash; the page '
   'gutters are the table edges.',
   'Let it scroll horizontally on narrow screens rather than wrapping cell text.'],
  ['<b>Boxed</b> for a table inside a widget or card: 1px border, 8px radius, clipped.',
   'Do not mix the two treatments on one screen.'],
  'Full-bleed', 'Boxed')}

<h3>Header controls</h3>
{checklist([
  'A kebab menu appears per column on hover, offering hide and sort.',
  'Columns drag to reorder.',
  'An edge handle resizes.',
  'The header is sticky. Scrolling a long table never loses the column names.',
])}

<h3>Content rules</h3>
{checklist([
  'Cells do not wrap. Long values truncate; the full value belongs in the detail drawer.',
  'The first column is separated by a <span class="m">1.5px</span> rule &mdash; it is the '
  'identifier column and it reads as an anchor.',
  'Numbers right-align through the number cell type, never with an inline style.',
  'Positive and negative deltas use the signed cell types. Never colour a number by hand.',
  'An absent value is an em dash in the soft ink, never an empty cell.',
  'Entity links keep the regular weight and family, underlined. Never lime, never mono.',
])}

<h2 id="guidelines">Guidelines</h2>
{dodont(
  ['Use a table when someone needs to compare records against each other.',
   'Right-align anything that is a quantity.',
   'Put the identifier in the first column and make it the link.',
   'Say how many rows there are, and paginate past one screen.'],
  ['Do not use a table to lay out a form. That is a grid problem.',
   'Do not put a second interactive control in every cell &mdash; the row is the target.',
   'Do not hide the only copy of a value behind a truncation with no detail view.',
   'Do not stripe a three-column table. It adds noise and no help.'])}

<h2 id="specs">Specs</h2>
{spec([
  ('Row height', '<span class="m">42px</span>'),
  ('Cell padding', '<span class="m">13px</span> vertical, <span class="m">10px</span> horizontal'),
  ('Row inset', '<span class="m">10px</span>'),
  ('Header rule', '<span class="m">2px</span> <span class="sw" style="background:#4a4f55"></span>'
                  '<span class="m">#4A4F55</span>'),
  ('Row rule', '<span class="m">1px</span> <span class="sw" style="background:#dad8d7"></span>'
               '<span class="m">#DAD8D7</span>'),
  ('Body text', '<span class="m">14px / 16px</span>, weight 500'),
  ('Caption text', '<span class="m">12px / 14px</span>, weight 600'),
  ('Cell ink', '<span class="sw" style="background:#171614"></span><span class="m">#171614</span>'),
  ('Row checkbox', '<span class="m">16 &times; 16</span>, radius 2, stroke '
                   '<span class="m">#171614</span>, selected fill <span class="m">#211F1C</span> '
                   '&mdash; matches the standalone component'),
  ('Row radio', '<span class="m">16 &times; 16</span>, stroke '
                '<span class="m">#171614</span> &mdash; matches the standalone component'),
  ('Icon slot', '<span class="m">30px</span>, icon colour <span class="m">#88888E</span>'),
  ('Accordion button', '<span class="m">34 &times; 38</span>'),
  ('Disabled opacity', '<span class="m">30%</span>'),
])}

<h2 id="a11y">Accessibility</h2>
{checklist([
  'Use real <code>&lt;table&gt;</code>, <code>&lt;thead&gt;</code>, <code>&lt;th scope="col"&gt;</code> '
  'markup. A grid of divs announces nothing.',
  'A sortable header is a <code>&lt;button&gt;</code> inside the <code>&lt;th&gt;</code>, carrying '
  '<code>aria-sort</code>.',
  'Every row checkbox needs its own label naming the row &mdash; &ldquo;Select truck 4417&rdquo;, '
  'not &ldquo;Select&rdquo;.',
  'A disabled row must not be reachable by keyboard.',
  'Selection must be visible without colour. The checkbox does that job; the background tint '
  'alone does not.',
  'If the table scrolls horizontally, the scroll container needs <code>tabindex="0"</code> and a '
  'label so keyboard users can reach it.',
])}
<div class="note warn"><b>Selected rows at <span class="m">#EEF9FF</span> are a 1.05:1 tint.</b>
  That is a hint, not an indicator. The checkbox is what communicates selection; the background
  is decoration on top of it.</div>

<h2 id="gaps">Known gaps</h2>
<p>Four real conflicts came out of reading this node. None of them block building, but all four
   need a decision before the component is considered finished.</p>
{table(['Conflict', 'What the table does', 'What the rest of the system does'], [
  ['<b>Typeface</b>', 'Binds <span class="m">Montserrat</span> 14/16 weight 500 for body and '
                      '12/14 weight 600 for captions.',
   'ABC Repro everywhere. The breadcrumb spec explicitly notes that spec documents are authored '
   'in Montserrat for legibility &mdash; this may be that leaking into bound variables.'],
  ['<b>Icons</b>', 'Font Awesome 6 Pro at 18px, <span class="m">#88888E</span>.',
   '1,134 Unicons and 281 Feather, with a standing recommendation against adding Font Awesome.'],
  ['<b>Checkbox and radio size</b> <span class="pill ok">Settled</span>',
   '<span class="m">24 &times; 24</span> in the Figma table.',
   'Settled in favour of the standalone <span class="m">16 &times; 16</span>. One size '
   'everywhere; the Figma table still needs updating to match.'],
  ['<b>Selected tint</b>', '<span class="m">#EEF9FF</span> &mdash; brand Blue 0',
   'Product Blue 0 is <span class="m">#C5E4FB</span>.'],
])}
{checklist([
  '<b>Borders are drawn as inner shadows in Figma.</b> That is a canvas technique, not a '
  'specification. In code they are real borders &mdash; 2px under the header, 1px under each row.',
  '<b>No sort specification.</b> The header has a sort affordance but nothing says what '
  'ascending looks like, what the default sort is, or whether sort persists.',
  '<b>No empty state.</b> There is no empty-state component anywhere in the library. Until there '
  'is: say what would appear there, and offer exactly one action if the user can create it.',
  '<b>Pagination is a separate, orphaned component</b> with no states, not wired to this table.',
  '<b>Dark mode is not drawn.</b> Every dark value on this page is derived from the surface '
  'tokens applied consistently.',
])}
"""
    return shell('Table',
                 'Dense, comparable records in typed columns — the surface most of the Hub is made of.',
                 'components/table.html', body,
                 crumb=['Components', 'Table'],
                 toc=[('example', 'Example'), ('anatomy', 'Anatomy'), ('options', 'Options'),
                      ('states', 'States'), ('behaviour', 'Behaviour'),
                      ('guidelines', 'Guidelines'), ('specs', 'Specs'),
                      ('a11y', 'Accessibility'), ('gaps', 'Known gaps')])
