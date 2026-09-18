#!/usr/bin/env python3
"""The remaining ten component pages, plus the catalogue index."""
from core import (shell, cpage, copybar, bench, brow, spec, dodont, checklist,
                  table, grid, meta, pill, ARROW)

TICK = ('<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
        '<circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.4"/>'
        '<path d="M5.3 8.2l1.9 1.9 3.5-3.9" stroke="currentColor" stroke-width="1.5" '
        'stroke-linecap="round" stroke-linejoin="round"/></svg>')
ALERT = ('<svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true" '
         'style="flex:none"><circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.4"/>'
         '<path d="M8 5v3.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
         '<circle cx="8" cy="11" r=".9" fill="currentColor"/></svg>')
SEARCH = ('<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
          '<circle cx="7" cy="7" r="4.6" stroke="currentColor" stroke-width="1.5"/>'
          '<path d="M10.4 10.4L14 14" stroke="currentColor" stroke-width="1.5" '
          'stroke-linecap="round"/></svg>')
CLEARX = ('<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
          '<circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.4"/>'
          '<path d="M6 6l4 4M10 6l-4 4" stroke="currentColor" stroke-width="1.4" '
          'stroke-linecap="round"/></svg>')
CHEVD = ('<svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" '
         'style="flex:none"><path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" '
         'stroke-width="1.6" stroke-linecap="round"/></svg>')

PHASES = [
    ('Waiting to load', '#644325', '#d9a97c'),
    ('Loading',         '#9a1f1e', '#efadac'),
    ('Loaded',          '#887f13', '#e4d95f'),
    ('To job',          '#1e6252', '#75dfc7'),
    ('On site',         '#872781', '#ed9ce6'),
    ('Pouring',         '#101010', '#d6d2d2'),
    ('Washing',         '#126886', '#b9deea'),
    ('Return to plant', '#9c0f5a', '#f6a4cf'),
    ('Ignition off',    '#525252', '#bababa'),
]


def tf(state='', label='Truck number', value='', ph='e.g. 4417', help_='Numbers only',
       req=False, lead=False, clear=False, dis=False, chev=False):
    lab = '<span class="lb">%s%s</span>' % (label, '<i>*</i>' if req else '')
    ic = SEARCH if lead else ''
    tail = CLEARX if clear else (CHEVD if chev else '')
    inp = ('<input type="text" value="%s" placeholder="%s"%s aria-label="%s">'
           % (value, ph, ' disabled' if dis else '', label))
    hi = ALERT if 'error' in state else ''
    hp = '<span class="hp">%s%s</span>' % (hi, help_) if help_ else ''
    return ('<div class="c-field %s">%s<div class="bx">%s%s%s</div>%s</div>'
            % (state, lab, ic, inp, tail, hp))


# ══════════════════════════════════════════════════════════════
#  BUTTON
# ══════════════════════════════════════════════════════════════
BTN_HTML = """<button type="button" class="vf-btn vf-btn--quiet">Add a ticket</button>
<button type="button" class="vf-btn vf-btn--primary">Done</button>
<button type="button" class="vf-btn vf-btn--danger">Delete ticket</button>
<button type="button" class="vf-btn vf-btn--quiet" disabled>Export</button>"""

BTN_BASE = """/* Verifi button — base. Every variant below extends this. */
.vf-btn {
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 18px;
  border: 0;
  border-radius: 32px;
  font-family: 'ABC Repro', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background .14s, border-color .14s, color .14s, opacity .14s;
}
.vf-btn:focus-visible { outline: 2px solid #36322d; outline-offset: 2px; }
.vf-btn[disabled]     { opacity: .42; pointer-events: none; }"""

BTN_QUIET = """/* Quiet — the everyday button. This is what the Hub actually uses. */
.vf-btn--quiet {
  background: transparent;
  border: 1px solid #36322d24;       /* --border */
  color: #36322dc2;                  /* --defined */
}
.vf-btn--quiet:hover { border-color: rgba(54,50,45,.30); color: #36322d; }

@media (prefers-color-scheme: dark) {
  .vf-btn--quiet { border-color: #e5e5e51f; color: #e5e5e5de; }
  .vf-btn--quiet:hover { border-color: rgba(229,229,229,.25); color: #fff; }
}"""

BTN_PRIMARY = """/* Primary — one per container, and only for completion. */
.vf-btn--primary {
  background: #36322d;               /* --strong */
  color: #ffffff;
}
.vf-btn--primary:hover { opacity: .88; }

@media (prefers-color-scheme: dark) {
  .vf-btn--primary { background: #ffffff; color: #211f1c; }
}"""

BTN_DANGER = """/* Danger — destroys data or cannot be undone. Nothing else. */
.vf-btn--danger { background: #d70100; color: #ffffff; }
.vf-btn--danger:hover { opacity: .9; }"""


def c_button():
    row = lambda: (
        brow('Quiet &mdash; the default',
             '<div class="binline"><button class="c-btn quiet">Add a ticket</button>'
             '<button class="c-btn quiet">Export</button></div>') +
        brow('Primary &mdash; completion only',
             '<button class="c-btn commit">Done</button>') +
        brow('Danger', '<button class="c-btn danger">Delete ticket</button>') +
        brow('Disabled', '<button class="c-btn quiet" disabled>Export</button>'))

    return cpage(
        'components/button.html', 'Button',
        'A button causes something to happen. If pressing it only takes you somewhere, it is a '
        'link and it should look like one.',
        'ok', figma='30033:78562',
        extra_meta=['144 variants'],
        note='<div class="note"><b>The thing that surprises people.</b> The set has four '
             'variants, but open any real Hub screen and almost every button is the quiet '
             'outline pill &mdash; even the one that creates a ticket. A filled button means '
             '<em>this finishes the task and closes what you are in</em>. If you are adding a '
             'solid button to a page, you probably want an outline one.</div>',

        example=bench(row(), row(),
                      'Same markup, both themes.'),

        anatomy=spec([
            ('Height', '<span class="m">44px</span> &mdash; the standard control height'),
            ('Radius', '<span class="m">32px</span>, which at 44px renders as a full pill'),
            ('Padding', '<span class="m">0 18px</span>'),
            ('Label', '<span class="m">14px / 500</span>, ABC Repro'),
            ('Icon gap', '<span class="m">8px</span>'),
            ('Icon-only', '<span class="m">44 &times; 44</span>, still a pill'),
        ]),

        options=(
            copybar('Base', 'btnb', 'shared by all variants', BTN_HTML, BTN_BASE) +
            copybar('Quiet', 'btnq', 'secondary / ghost', None, BTN_QUIET) +
            bench('<div class="binline"><button class="c-btn quiet">Add a ticket</button>'
                  '<button class="c-btn quiet">Export</button></div>',
                  '<div class="binline"><button class="c-btn quiet">Add a ticket</button>'
                  '<button class="c-btn quiet">Export</button></div>') +
            copybar('Primary', 'btnp', 'one per container', None, BTN_PRIMARY) +
            bench('<button class="c-btn commit">Done</button>',
                  '<button class="c-btn commit">Done</button>') +
            copybar('Danger', 'btnd', 'destructive only', None, BTN_DANGER) +
            bench('<button class="c-btn danger">Delete ticket</button>',
                  '<button class="c-btn danger">Delete ticket</button>')
        ),

        states=table(['State', 'What changes'], [
            ['Default', 'The variant&rsquo;s base appearance.'],
            ['Hover', 'Quiet darkens its border and ink; filled variants drop to 88% opacity.'],
            ['Focus', '2px outline in <code>--strong</code> at 2px offset. Never removed.'],
            ['Active', 'Same as hover. There is no separate pressed state.'],
            ['Disabled', '42% opacity, pointer events off.'],
            ['Loading', 'A variant on the set. Never drop a spinner in by hand.'],
        ]),

        behaviour=('<p>Buttons do not navigate. If activating the element changes the URL '
                   'without changing state, it is a link.</p>' +
                   checklist([
                       'One primary per visual container, at most. Never two.',
                       'Danger pairs with a confirm step when the loss is permanent.',
                       'In a toolbar, buttons sit 10px apart. In a modal footer, 8px.',
                       'A button that repeats down a table is ghost, every time.',
                   ])),

        guidelines=dodont(
            ['Label it with the verb the user is doing &mdash; <em>Export</em>, '
             '<em>Message driver</em>.',
             'Let the button be as wide as its label needs.',
             'Use ghost for anything repeated.'],
            ['Do not use a button for navigation.',
             'Do not colour a button by severity. Only danger has a colour.',
             'Do not use yellow. In the product, yellow is dark-mode selection, not a '
             'call to action.',
             'Do not disable the submit button to communicate a validation failure &mdash; '
             'say what is wrong.']),

        specs=spec([
            ('Height', '<span class="m">44px</span>'),
            ('Radius', '<span class="m">32px</span>'),
            ('Padding', '<span class="m">0 18px</span>'),
            ('Font', '<span class="m">14px / 500</span>'),
            ('Gap to icon', '<span class="m">8px</span>'),
            ('Gap between buttons', '<span class="m">10px</span> toolbar, '
                                    '<span class="m">8px</span> modal footer'),
            ('Transition', '<span class="m">0.14s</span>. Nothing bounces.'),
            ('Focus ring', '<span class="m">2px</span> at <span class="m">2px</span> offset'),
        ]),

        a11y=checklist([
            'Use <code>&lt;button type="button"&gt;</code>. A clickable div announces nothing '
            'and is not keyboard reachable.',
            'An icon-only button needs an <code>aria-label</code>. The tooltip is not a label.',
            'A loading button keeps its accessible name and adds <code>aria-busy="true"</code>.',
            'Never remove the focus ring. Never replace it with a colour change alone &mdash; '
            'colour alone fails for anyone who cannot distinguish it.',
            'Disabled buttons are removed from the tab order, which means the reason they are '
            'disabled has to be visible on the page.',
        ]),

        gaps=checklist([
            '<b>46% of the set&rsquo;s non-text fills are hardcoded</b> rather than bound to '
            'tokens. Generate CSS from the Figma file and you inherit values that will not '
            'follow a theme change.',
            '<b>Three sizes exist as variants but only the 44px large has published values.</b> '
            'Everything in the Hub is the large.',
            '<b>No distinct pressed state.</b> Active covers it.',
            '<b>There is no link component.</b> Interim rule: inline links use '
            '<span class="m">#295CCC</span> in light and white in dark, underlined at 2px offset.',
        ]),
    )


# ══════════════════════════════════════════════════════════════
#  CHECKBOX
# ══════════════════════════════════════════════════════════════
CBX_HTML = """<label class="vf-check">
  <input type="checkbox" checked>
  <span class="vf-check__box" aria-hidden="true"></span>
  <span class="vf-check__label">Show returned concrete</span>
</label>"""

CBX_CSS = """/* Verifi checkbox — independent boolean, applies on save.
   One size. The box is 16 x 16; the 24 x 24 touchpoint around it is what the
   pointer and the finger hit. The negative margin keeps the box on the same
   baseline grid as everything else while the target stays 24. */
.vf-check { display: inline-flex; align-items: center; gap: 9px; cursor: pointer;
            font-size: 14px; color: #36322dc2; }
.vf-check input { position: absolute; opacity: 0; width: 0; height: 0; }

.vf-check__box {
  width: 24px; height: 24px; margin: -4px; flex: none;   /* touchpoint */
  position: relative;
  display: inline-flex; align-items: center; justify-content: center;
}
.vf-check__box::before {                                 /* the 16px box */
  content: ""; width: 16px; height: 16px; box-sizing: border-box;
  border: 1px solid #171614;        /* --strong */
  border-radius: 2px;               /* --radius-xs */
  background: #ffffff;              /* --layer-1 */
  transition: background .14s, border-color .14s;
}
/* The tick and the dash are Trinity's own vectors, carried as masks so they
   take the surface colour. Tick: 6 x 4 polyline at (5,6), 1px, round caps.
   Dash: 8 x 1 bar at (4,7.5). Do not substitute a font character or a
   rotated border — neither has the right angle or the right weight. */
.vf-check__box::after {
  content: ""; position: absolute; width: 16px; height: 16px; opacity: 0;
  background: #ffffff;
  -webkit-mask: var(--vf-tick) center / 16px 16px no-repeat;
          mask: var(--vf-tick) center / 16px 16px no-repeat;
}
.vf-check {
  --vf-tick: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M5 7.3333 7.4 10 11 6' fill='none' stroke='%23000' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  --vf-dash: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect x='4' y='7.5' width='8' height='1' rx='.5' fill='%23000'/%3E%3C/svg%3E");
}
.vf-check input:checked + .vf-check__box::before,
.vf-check input:indeterminate + .vf-check__box::before {
  background: #211f1c; border-color: #211f1c;
}
.vf-check input:checked + .vf-check__box::after,
.vf-check input:indeterminate + .vf-check__box::after { opacity: 1; }

/* Indeterminate — a parent whose children are partly checked */
.vf-check input:indeterminate + .vf-check__box::after {
  -webkit-mask-image: var(--vf-dash); mask-image: var(--vf-dash);
}
.vf-check input:focus-visible + .vf-check__box::before {
  outline: 2px solid #171614; outline-offset: 2px;
}
.vf-check input:disabled ~ * { opacity: .42; }

@media (prefers-color-scheme: dark) {
  .vf-check { color: #e5e5e5de; }
  .vf-check__box::before { border-color: #fff; background: #211f1c; }
  .vf-check input:checked + .vf-check__box::before,
  .vf-check input:indeterminate + .vf-check__box::before { background: #fff; border-color: #fff; }
  .vf-check__box::after { background: #211f1c; }
  .vf-check input:focus-visible + .vf-check__box::before { outline-color: #fff; }
}"""


def _cbxlive():
    """The parent/child contract, running on real inputs."""
    kids = ['Rockdale', 'Midwest', 'Northgate', 'Cedar Park', 'Lakeside',
            'Fairview', 'Brightwater']
    pre = {'Rockdale', 'Midwest', 'Northgate'}
    rows = ''.join(
        '<label class="c-cbx live cbxlive-kid"><input type="checkbox"%s><i></i>%s</label>'
        % (' checked' if k in pre else '', k) for k in kids)
    return ('<div class="cbxlive">'
            '<label class="c-cbx live cbxlive-parent"><input type="checkbox"><i></i>'
            'All plants<em class="cbxlive-count"></em></label>'
            '<div class="cbxlive-kids">' + rows + '</div>'
            '<p class="cbxlive-state" aria-live="polite"></p>'
            '</div>')


def _selive():
    """Header scope, shift-click ranges, and what a filter change does."""
    rows = [('4417', 'Rockdale', 'Loaded'), ('4418', 'Rockdale', 'In transit'),
            ('4419', 'Midwest', 'Pouring'), ('4420', 'Midwest', 'Washing out'),
            ('4421', 'Northgate', 'Returning'), ('4422', 'Northgate', 'At plant')]
    body = ''.join(
        '<tr><td><label class="c-cbx live selive-row"><input type="checkbox">'
        '<i></i></label></td><td>%s</td><td>%s</td><td>%s</td></tr>' % r for r in rows)
    return ('<div class="selive" data-total="4182">'
            '<table><thead><tr>'
            '<th><label class="c-cbx live selive-all"><input type="checkbox" '
            'aria-label="Select all loaded rows"><i></i></label></th>'
            '<th>Truck</th><th>Plant</th><th>Phase</th></tr></thead>'
            '<tbody>' + body + '</tbody></table>'
            '<div class="selive-bar" hidden></div>'
            '<button type="button" class="selive-filter">Change the filter</button>'
            '<p class="selive-state" aria-live="polite"></p>'
            '</div>')

def c_checkbox():
    demo = (
        brow('Unchecked', '<span class="c-cbx"><i></i>Show washed-out loads</span>') +
        brow('Checked', '<span class="c-cbx on"><i></i>Show returned concrete</span>') +
        brow('Indeterminate', '<span class="c-cbx ind">'
                              '<i></i>All plants (3 of 7)</span>') +
        brow('Disabled', '<span class="c-cbx dis"><i></i>Locked by dispatch</span>'))

    # The full grid Trinity documents: four states x three values.
    def _row(cls):
        return ('<div class="cbxr">'
                '<span class="c-cbx %s"><i></i>Label</span>'
                '<span class="c-cbx on %s"><i></i>Label</span>'
                '<span class="c-cbx ind %s"><i></i>Label</span></div>' % (cls, cls, cls))
    grid = ('<div class="cbxg"><div class="cbxh"><span></span>'
            '<span>Unchecked</span><span>Checked</span><span>Indeterminate</span></div>'
            + ''.join('<div class="cbxl">%s</div>%s' % (lbl, _row(cls))
                      for lbl, cls in [('Default', ''), ('Hover', 'hov'),
                                       ('Focus', 'foc'), ('Disabled', 'dis')])
            + '</div>')
    grp = ('<div class="bstack"><span class="c-cbx on"><i></i>Rockdale</span>'
           '<span class="c-cbx on"><i></i>Midwest</span>'
           '<span class="c-cbx"><i></i>Northgate</span></div>')

    return cpage(
        'components/checkbox.html', 'Checkbox',
        'An independent yes or no. Several can be true at once, and the change applies when '
        'the form is saved, not the moment it is clicked.',
        'ok', figma='30515:78521', extra_meta=['12 variants'],

        note='<div class="note ok"><b>Use this component in prototypes rather than drawing a '
             'checkbox.</b> Verifi Design&rsquo;s note: the label is a toggle on the component, '
             'so you switch it off where you do not want one and edit it in one place where you '
             'do, instead of retyping it in every layout. It also carries light and dark with it, '
             'so a prototype switched to dark mode brings the checkbox along without any manual '
             'recolouring. The same instance is what the '
             '<a href="table.html#showcase">table</a> row selector uses.</div>'

             '<div class="note"><b>One size: a 16px box inside a 24px target.</b> '
             '<span class="m">checkbox/width</span> and '
             '<span class="m">checkbox/height</span> are <span class="m">24</span>; '
             '<span class="m">checkbox/padding</span> is <span class="m">4</span>; 24 less 4 a '
             'side leaves the <span class="m">16 &times; 16</span> box. Trinity names that outer '
             'frame <span class="m">touchpoint</span>, and it is what WCAG 2.2 '
             '<span class="m">2.5.8 Target Size (Minimum), AA</span> measures. Draw the box at 16 '
             'and give it 24 of room. Never scale the box to fill the target.</div>',

        example=bench(demo, demo),

        anatomy=spec([
            ('Touchpoint', '<span class="m">24 &times; 24</span> &mdash; the outer frame, and '
                           'the only thing the pointer or the finger has to hit'),
            ('Box', '<span class="m">16 &times; 16</span>, 1px border, <span class="m">2px</span> radius'),
            ('Tick', '<span class="m">6 &times; 4</span> at <span class="m">(5, 6)</span>, 1px, round caps'),
            ('Dash', '<span class="m">8 &times; 1</span> at <span class="m">(4, 7.5)</span>'),
            ('Gap to label', '<span class="m">4px</span> from the touchpoint edge &mdash; <span class="m">8px</span> of visible air beside the box'),
            ('Label', '<span class="m">14px</span>, the defined ink'),
            ('Group spacing', '<span class="m">10px</span> between options'),
        ]),

        options=(copybar('Checkbox', 'cbx', '16px box', CBX_HTML, CBX_CSS) +
                 bench(demo, demo) +
                 copybar('In a group', 'cbxg', 'multi-select', None, None) +
                 bench(grp, grp)),

        states=(table(['State', 'What changes', 'Token'], [
            ['Unchecked', 'White box, 1px border.',
             '<code>checkbox/input-default-fill</code>'],
            ['Checked', 'Box fills solid, tick on top in the opposite colour.',
             '<code>checkbox/input-selected-fill</code>'],
            ['Indeterminate', 'The same solid fill as checked, with the '
                              '<span class="m">8 &times; 1</span> dash instead of the tick. '
                              'For a parent whose children are partly selected. It is a display '
                              'state, never something a click produces.',
             '<code>checkbox/input-selected-fill</code>'],
            ['Hover', 'A <span class="m">2px</span> ring appears <i>outside</i> the box. The '
                      'border itself does not change.',
             '<code>checkbox/hover-stroke</code>'],
            ['Focus', 'Two things at once: a <span class="m">2px</span> ring outside, and the '
                      'box&rsquo;s own 1px border drops to a light grey.',
             '<code>checkbox/focus-outer-stroke</code><br>'
             '<code>checkbox/focus-inner-stroke</code>'],
            ['Disabled', 'Solid grey fill and <b>no border at all</b>. The tick or dash stays, '
                         'in a lighter grey. Not an opacity.',
             '<code>checkbox/input-fill-disabled</code><br>'
             '<code>checkbox/icon-color-disabled</code><br>'
             '<code>checkbox/label-disabled</code>'],
        ]) + bench(grid, grid)),

        behaviour=('<p>A checkbox waits. Clicking it stages a change that something else '
                   '&mdash; Save, Apply, Done &mdash; commits. That single sentence settles most '
                   'of the questions below, because a control that has not committed yet is '
                   'allowed to be wrong, reversible, and quiet about it.</p>' +
                   '<div class="note"><b>Checkbox or toggle?</b> If flipping it changes the '
                   'system immediately, with nothing to press afterwards, it is a '
                   '<a href="toggle.html">toggle</a>. A toggle inside a form with a Save button '
                   'is a checkbox wearing a costume.</div>' +
                   '<div class="note"><b>Checkbox or radio?</b> If exactly one option may be '
                   'true, it is a <a href="radio-group.html">radio group</a>. A single checkbox '
                   'is also correct for one opt-in confirmation.</div>'

                   '<h3>The indeterminate contract</h3>'
                   '<p>Indeterminate is a <b>readout, not a choice</b>. A parent enters it '
                   'because some but not all of its children are checked; nobody ever clicks a '
                   'box <i>into</i> it. Get that backwards and you end up with a three-position '
                   'control nobody can predict.</p>'
                   + table(['Children', 'Parent shows', 'Clicking the parent'], [
                       ['None checked', 'Unchecked', 'Checks all children'],
                       ['Some checked', '<b>Indeterminate</b>', 'Checks all children'],
                       ['All checked', 'Checked', 'Unchecks all children'],
                     ]) +
                   '<h4>Try it</h4>'
                   '<p>Real <span class="m">&lt;input&gt;</span> elements, so '
                   '<span class="m">indeterminate</span> is the DOM property and the '
                   'announcement is the browser&rsquo;s, not a drawing of one. Tick children '
                   'off one at a time and watch the parent fall into the dash. Then click the '
                   'parent while it is dashed.</p>'
                   + bench(_cbxlive(), _cbxlive(),
                           'The line underneath reports the parent\u2019s real state and what a '
                           'click would do next.') +
                   '<div class="note"><b>From indeterminate, a click always checks all.</b> It '
                   'never unchecks, and it never cycles back to the partial state. Users reach '
                   'for a parent checkbox to finish selecting, not to undo a selection they are '
                   'halfway through &mdash; and undo is one more click away in either direction. '
                   'A parent that cycled through all three states would make a two-item list '
                   'take three clicks to clear.</div>'
                   + checklist([
                       'Only a parent of a visible set may be indeterminate. A standalone '
                       'checkbox has two states.',
                       'The parent reflects its children the instant they change. It is never '
                       'stale.',
                       'Put the count in the label &mdash; <span class="m">All plants (3 of '
                       '7)</span>. The dash says <i>partial</i>; only the number says how '
                       'partial.',
                       'Nesting stops at one level here. A parent of parents is a tree, and a '
                       'tree needs disclosure, not checkboxes.',
                   ]) +

                   '<h3>Select all, in a table that scrolls</h3>'
                   '<p>The header checkbox in a long table is the one place this component '
                   'routinely lies. &ldquo;All&rdquo; means the rows a person can see; the '
                   'database means every row that matches. On a fleet list that is the '
                   'difference between forty trucks and four thousand.</p>'
                   + checklist([
                       'The header checkbox selects <b>the loaded rows only</b>, and it reflects '
                       'those rows only. This is the default and it needs no explanation.',
                       'When the filter matches more than is loaded, offer the wider selection as '
                       'an explicit second step, in words: <span class="m">40 selected. Select '
                       'all 4,182 matching?</span> Never make the header checkbox silently mean '
                       'the larger set.',
                       'Say what is selected, always, near the action that will act on it. A '
                       'count is the cheapest protection against a destructive mistake.',
                       'Changing a filter clears the selection. Carrying a selection across a '
                       'filter change is how people delete rows they never saw.',
                       'Selection survives sorting and pagination within the same filter. Sorting '
                       'does not change which rows matched.',
                   ]) +
                   '<h4>Try it</h4>'
                   '<p>Six loaded rows standing in for 4,182 matching ones. Tick the header. '
                   'Tick one row, then shift-click another four down. Then change the '
                   'filter.</p>'
                   + bench(_selive(), _selive(),
                           'The header never means more than the rows you can see. The wider '
                           'selection has to be asked for, in words.') +
                   '<div class="note"><b>Shift-click selects a range.</b> Click one row, '
                   'shift-click another, and everything between them takes the state of the row '
                   'you clicked first. It is unadvertised and everyone who needs it already '
                   'tries it. It must never be the only way to do something.</div>' +
                   '<div class="note stop"><b>Handle the range on the row, not on the '
                   'checkbox.</b> When Shift is held, the browser suppresses a '
                   '<span class="m">&lt;label&gt;</span>&rsquo;s activation behaviour entirely '
                   '&mdash; it reads the gesture as a text-range selection, so the '
                   '<span class="m">&lt;input&gt;</span> never receives a click and never '
                   'toggles. A listener on the input alone does nothing at all, silently. Bind '
                   'the handler to the row, read <span class="m">shiftKey</span> there, call '
                   '<span class="m">preventDefault()</span> and set the range yourself. The '
                   'demo above does exactly this; it did not work until it did.</div>' +

                   '<h3>Required groups, and the error state Trinity does not draw</h3>'
                   '<p>&ldquo;Pick at least one&rdquo; is a property of the group, not of any box '
                   'in it, so the error belongs to the group too. Trinity has no error variant '
                   'for the checkbox, and it does not need one: nothing about the individual box '
                   'changes.</p>'
                   + checklist([
                       'The message sits under the group, once, tied to the '
                       '<span class="m">&lt;fieldset&gt;</span> with '
                       '<span class="m">aria-describedby</span>. Not once per checkbox.',
                       'No box turns red. Reddening six boxes to say &ldquo;one of these is '
                       'required&rdquo; tells the user nothing about which one, because the '
                       'answer is none of them.',
                       'Validate on submit, not on blur. A group cannot be judged until the user '
                       'has finished with all of it.',
                       'A single required checkbox &mdash; accepting terms &mdash; is the '
                       'exception: the message sits under that one box, and the box may carry '
                       'the <span class="m">--error</span> border.',
                   ]) +

                   '<h3>Disabled, read-only, or just absent</h3>'
                   '<p>Three different situations that all get solved with '
                   '<span class="m">disabled</span> by reflex, and only one of them should be.</p>'
                   + table(['Situation', 'Use', 'Why'], [
                       ['The user could change this, but not yet &mdash; something else has to '
                        'happen first', '<b>Disabled</b>, with the reason in text nearby',
                        'Disabled with no explanation is the single most common complaint about '
                        'any form. The state is honest; the silence is not.'],
                       ['The value matters but this user may never change it',
                        '<b>Read-only</b> &mdash; render the value as text, not as a dead control',
                        'A checkbox the user cannot ever operate is a control that lies about '
                        'being a control.'],
                       ['The option does not apply to this user at all', '<b>Leave it out</b>',
                        'A permanently greyed row is visual debt on every screen after it.'],
                     ]) +
                   '<div class="note"><b>Disabled does not mean unreadable.</b> The value stays '
                   'visible &mdash; a disabled checked box still shows its tick. Hiding the value '
                   'because the control is inert loses the information as well as the '
                   'control.</div>' +

                   '<h3>When the save fails</h3>'
                   '<p>The checkbox commits with the form, so it has no loading state and does '
                   'not need one. What it does need is a rule for the moment the form comes '
                   'back.</p>'
                   + checklist([
                       'On failure the boxes keep what the user set. Never silently revert &mdash; '
                       'the user has to be able to press Save again without re-answering.',
                       'The failure is announced once, at the form level, in a '
                       '<a href="toast.html">toast</a> or an inline message. Not on the '
                       'checkbox.',
                       'If one box in a batch failed and the rest went through, say which. A '
                       'partial failure reported as a total failure makes people redo work that '
                       'already succeeded.',
                   ]) +

                   '<h3>Touch</h3>'
                   + checklist([
                       'The <span class="m">24 &times; 24</span> touchpoint is the AA minimum, '
                       'not a comfortable target. Stacked checkboxes get '
                       '<span class="m">10px</span> between them, which puts 34px between '
                       'centres.',
                       'The whole label is part of the target. That is what makes a 16px box '
                       'usable on a phone, so never render the label outside the '
                       '<span class="m">&lt;label&gt;</span>.',
                       'Two adjacent targets must not touch. Where a checkbox sits beside another '
                       'control in a dense table row, give it its own cell.',
                   ]) +

                   '<h3>Defaults</h3>'
                   + checklist([
                       'Default to unchecked unless checked is both the common choice and the '
                       'safe one.',
                       'Never pre-check anything that consents on the user\u2019s behalf. That is '
                       'the one place a default is not a convenience.',
                       'A pre-checked box must survive a reset to the same value. If Reset '
                       'clears it, it was never a default.',
                   ]) +

                   '<h3>Settled by design</h3>'
                   '<p>Four things about this component look like oversights and are not. They '
                   'have been confirmed correct as drawn, so do not re-log them.</p>'
                   + table(['Looks like', 'Actually'], [
                       ['The tick vector is named '
                        '<span class="m">Icon / Check / Temp</span>.',
                        'That is the final tick, not a placeholder. The name is historical.'],
                       ['<span class="m">checkbox/hover-stroke</span> and '
                        '<span class="m">checkbox/focus-inner-stroke</span> hold the same value '
                        'in both modes without being aliased.',
                        'Deliberate. They are separate decisions that happen to agree today, and '
                        'they are free to diverge without dragging the other with them.'],
                       ['Disabled drops the border entirely, so an unchecked disabled box is a '
                        'solid grey square.',
                        'Deliberate. Disabled is not meant to invite a second look &mdash; the '
                        'grey block reads as inert faster than a greyed outline does.'],
                       ['<span class="m">checkbox/large/track/width</span> and '
                        '<span class="m">.../height</span> sit in the checkbox namespace.',
                        'Correct where they are. There is still one checkbox size; these are not '
                        'evidence of a second.'],
                     ])),
        guidelines=dodont(
            ['Write the label as the positive statement &mdash; what is true when it is ticked.',
             'Put the parent checkbox above its children, indented away from them, and let it '
             'reflect them honestly.',
             'Keep groups vertical, one per line. Horizontal rows force the eye to re-find the '
             'box after every label.',
             'Give the group a <span class="m">&lt;legend&gt;</span> that states the question, '
             'even when it looks redundant next to a heading.',
             'Say what a selection contains before offering an action on it.'],
            ['Do not write a negative label. &ldquo;Do not show returned concrete&rdquo; makes '
             'an unticked box a double negative.',
             'Do not use a checkbox for something that takes effect immediately &mdash; that is '
             'a <a href="toggle.html">toggle</a>.',
             'Do not put more than about seven in one ungrouped list. Past that, group them or '
             'move to a filtered list.',
             'Do not let a click set a box to indeterminate. It is a readout of children, never '
             'a choice.',
             'Do not disable a checkbox without saying why somewhere the user can see.']),

        specs=(table(['Trinity variable', 'Light', 'Dark'], [
            ['<code>checkbox/width</code> &middot; <code>checkbox/height</code>',
             '<span class="m">24</span>', '<span class="m">24</span>'],
            ['<code>checkbox/padding</code>', '<span class="m">4</span>', '<span class="m">4</span>'],
            ['<code>checkbox/gap</code>', '<span class="m">4</span>', '<span class="m">4</span>'],
            ['<code>checkbox/radius</code>', '<span class="m">2</span>', '<span class="m">2</span>'],
            ['<code>checkbox/input-stroke</code>',
             '<span class="m">#171614</span>', '<span class="m">#FFFFFF</span>'],
            ['<code>checkbox/input-default-fill</code>',
             '<span class="m">#FFFFFF</span>', '<span class="m">#211F1C</span>'],
            ['<code>checkbox/input-selected-fill</code>',
             '<span class="m">#211F1C</span>', '<span class="m">#FFFFFF</span>'],
            ['<code>checkbox/icon-color</code>',
             '<span class="m">#FFFFFF</span>', '<span class="m">#211F1C</span>'],
            ['<code>checkbox/hover-stroke</code>',
             '<span class="m">#D0CEC8</span>', '<span class="m">#B6B1A5</span>'],
            ['<code>checkbox/focus-outer-stroke</code>',
             '<span class="m">#171614</span>', '<span class="m">#FFFFFF</span>'],
            ['<code>checkbox/focus-inner-stroke</code>',
             '<span class="m">#D0CEC8</span>', '<span class="m">#B6B1A5</span>'],
            ['<code>checkbox/input-fill-disabled</code>',
             '<span class="m">#B6B1A5</span>', '<span class="m">#B6B1A5</span>'],
            ['<code>checkbox/icon-color-disabled</code>',
             '<span class="m">#DFDEDD</span>', '<span class="m">#D0CEC8</span>'],
            ['<code>checkbox/label-default</code>',
             '<span class="m">#171614</span>', '<span class="m">#FFFFFF</span>'],
            ['<code>checkbox/label-disabled</code>',
             '<span class="m">#B6B1A5</span>', '<span class="m">#B6B1A5</span>'],
        ]) + spec([
            ('Touchpoint', '<span class="m">24 &times; 24</span>'),
            ('Box', '<span class="m">16 &times; 16</span>'),
            ('Radius', '<span class="m">2px</span>'),
            ('Border', '<span class="m">1px</span> <code>checkbox/input-stroke</code>'),
            ('Checked fill', '<code>checkbox/input-selected-fill</code> &mdash; light '
                             '<span class="m">#211F1C</span>, dark <span class="m">#FFFFFF</span>'),
            ('Tick', '<span class="m">6 &times; 4</span> polyline at <span class="m">(5, 6)</span> '
                     '&mdash; <span class="m">(0, 1.33) &rarr; (2.4, 4) &rarr; (6, 0)</span> '
                     '&mdash; <span class="m">1px</span>, round cap and join, in the surface '
                     'colour. Both arms run at <span class="m">48&deg;</span>, not 45. Copy the '
                     'path; a <span class="m">&amp;#10003;</span> glyph or a rotated CSS border '
                     'gets the angle, the weight and the arm ratio wrong.'),
            ('Dash', '<span class="m">8 &times; 1</span> bar at <span class="m">(4, 7.5)</span>, '
                     '<span class="m">0.5</span> radius'),
            ('Hover ring', '<span class="m">2px</span> outside, no offset'),
            ('Focus ring', '<span class="m">2px</span> outside, no offset, plus the inner border'),
            ('Gap', '<span class="m">4px</span> from the touchpoint &mdash; '
                    '<span class="m">8px</span> clear of the box'),
            ('Label', 'ABC Repro Regular <span class="m">14 / 130%</span>'),
            ('Variant properties', '<span class="m">state</span> '
                                   '(<span class="m">default &middot; hover &middot; focus</span>), '
                                   '<span class="m">value</span>, '
                                   '<span class="m">indeterminate</span>, '
                                   '<span class="m">disabled</span> &mdash; all lowercase, '
                                   'booleans <span class="m">true</span> / '
                                   '<span class="m">false</span>. The public and private sets '
                                   'use the same four.'),
        ])),

        a11y=(checklist([
            'Use a real <code>&lt;input type="checkbox"&gt;</code> inside a <code>&lt;label&gt;</code>. '
            'Do not rebuild it from divs. Everything below comes free if you do, and has to be '
            'hand-built and maintained if you do not.',
            'Set <code>indeterminate</code> in JavaScript &mdash; it is a property, not an '
            'attribute, and it cannot be expressed in HTML alone. It also does not change '
            '<code>checked</code>, so send the parent\u2019s real value, not the dash, to the server.',
            'A native indeterminate checkbox already reports <code>aria-checked="mixed"</code>. '
            'Do not also set the attribute by hand &mdash; the two can disagree.',
            'Group related checkboxes in a <code>&lt;fieldset&gt;</code> with a '
            '<code>&lt;legend&gt;</code>. That is what makes a screen reader announce '
            '&ldquo;Plants, 3 of 7&rdquo; instead of six unrelated checkboxes.',
            'Space is the activation key. Enter must not submit from a focused checkbox.',
            'The visible label is the accessible name. Do not add a different '
            '<code>aria-label</code> &mdash; speech users say what they see.',
            'A group error is tied to the <code>&lt;fieldset&gt;</code> with '
            '<code>aria-describedby</code> and announced once, in a live region. Six identical '
            'errors is six interruptions.',
            'Shift-click range selection needs a keyboard equivalent. Shift plus arrow, or '
            'nothing &mdash; never a mouse-only path to a bulk action.',
            'In a table, the header checkbox needs its own accessible name '
            '(<code>Select all rows</code>). An unlabelled checkbox in a <code>&lt;th&gt;</code> '
            'reads as nothing at all.',
        ]) +
        '<div class="note"><b>Target size passes at AA, not AAA.</b> The '
        '<span class="m">24 &times; 24</span> touchpoint meets '
        '<span class="m">2.5.8 Target Size (Minimum), AA</span> exactly. '
        '<span class="m">2.5.5 Target Size (Enhanced)</span> asks for '
        '<span class="m">44 &times; 44</span> and is AAA, which this system does not target. '
        'The clickable label carries the real target well past 44px in practice. See '
        '<a href="../foundations/accessibility.html#target">Accessibility</a>.</div>' +
        '<div class="note"><b>Disabled is exempt from contrast, not compliant with it.</b> '
        'The disabled fill measures <span class="m">1.94:1</span> and the disabled label '
        '<span class="m">2.14:1</span>. WCAG exempts inactive controls from '
        '<span class="m">1.4.3</span> and <span class="m">1.4.11</span>, so these are not '
        'failures &mdash; but do not cite them as passes either, and do not put information in a '
        'disabled control that the user needs to read.</div>'),

    )


# ══════════════════════════════════════════════════════════════
#  RADIO GROUP
# ══════════════════════════════════════════════════════════════
RAD_HTML = """<fieldset class="vf-radios">
  <legend>Units</legend>
  <label class="vf-radio">
    <input type="radio" name="units" value="metric" checked>
    <span class="vf-radio__dot" aria-hidden="true"></span>
    <span>Metric</span>
  </label>
  <label class="vf-radio">
    <input type="radio" name="units" value="imperial">
    <span class="vf-radio__dot" aria-hidden="true"></span>
    <span>Imperial</span>
  </label>
</fieldset>"""

RAD_CSS = """/* Verifi radio group — mutually exclusive, all options visible. */
.vf-radios { border: 0; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.vf-radios legend { font-size: 14px; color: #171614; padding: 0 0 6px; }

.vf-radio { display: inline-flex; align-items: center; gap: 9px; cursor: pointer;
            font-size: 14px; color: #36322dc2; }
.vf-radio input { position: absolute; opacity: 0; width: 0; height: 0; }

.vf-radio__dot {
  width: 24px; height: 24px; margin: -4px; flex: none;   /* touchpoint */
  display: inline-flex; align-items: center; justify-content: center;
}
.vf-radio__dot::before {                                /* the 16px circle */
  content: ""; width: 16px; height: 16px; box-sizing: border-box;
  border: 1px solid #171614;
  border-radius: 99px;
  background: #ffffff;
  transition: border-color .14s, border-width .1s;
}
/* Selected is a 4px ring, not a dot. The centre keeps the surface colour,
   so the 16px circle reads as an 8px hole rather than an 8px blob. */
.vf-radio input:checked + .vf-radio__dot::before { border-width: 4px; }
.vf-radio input:focus-visible + .vf-radio__dot::before {
  outline: 2px solid #171614; outline-offset: 2px;
}
.vf-radio input:disabled ~ * { opacity: .42; }

@media (prefers-color-scheme: dark) {
  .vf-radios legend { color: #fff; }
  .vf-radio { color: #e5e5e5de; }
  .vf-radio__dot::before { border-color: #fff; background: #211f1c; }
  .vf-radio input:focus-visible + .vf-radio__dot::before { outline-color: #fff; }
}"""


def _radlive():
    """A real radio group. Almost everything here is native behaviour."""
    opts = [('metric', 'Metric &mdash; mm, kg, &deg;C', True),
            ('imperial', 'Imperial &mdash; in, lb, &deg;F', False),
            ('mixed', 'Mixed &mdash; metric slump, imperial weight', False),
            ('plant', 'Follow the plant setting', False)]
    rows = ''.join(
        '<label class="c-rad live radlive-opt"><input type="radio" value="%s"%s>'
        '<i></i>%s</label>' % (v, ' checked' if c else '', lbl) for v, lbl, c in opts)
    return ('<div class="radlive">'
            '<input class="radlive-edge" type="text" aria-label="A field before the group"'
            ' placeholder="A field before the group">'
            '<fieldset><legend>Units shown on the ticket</legend>'
            '<div class="radlive-opts">' + rows + '</div></fieldset>'
            '<input class="radlive-edge radlive-after" type="text" '
            'aria-label="A field after the group" placeholder="A field after the group">'
            '<p class="radlive-state" aria-live="polite"></p>'
            '</div>')

def c_radio():
    demo = ('<div class="bstack"><span class="c-rad on"><i></i>Metric</span>'
            '<span class="c-rad"><i></i>Imperial</span></div>')
    dis = ('<div class="bstack"><span class="c-rad on"><i></i>Metric</span>'
           '<span class="c-rad" style="opacity:.42"><i></i>Imperial &mdash; set by the account</span>'
           '</div>')

    return cpage(
        'components/radio-group.html', 'Radio group',
        'Exactly one choice from a short list, with every option visible at once. Choosing one '
        'unchooses the others.',
        'ok', figma='30173:78572',

        example=(bench(demo, demo) +
                 '<h3 id="try">Try it</h3>'
                 '<p>Click into the field above the group, then press Tab. Focus lands on the '
                 'group once, not four times. Press the arrow keys &mdash; each one moves and '
                 'selects in the same keystroke. Press Tab again and you leave the whole group '
                 'in one press. Then try to get back to nothing selected; there is no gesture '
                 'that does it.</p>' +
                 bench(_radlive(), _radlive(),
                       'Native <span class="m">&lt;input type="radio"&gt;</span> with a shared '
                       '<span class="m">name</span>. The script here only narrates &mdash; every '
                       'behaviour you can feel is the browser\u2019s.') +
                 '<div class="note"><b>None of that is worth rebuilding.</b> A shared '
                 '<span class="m">name</span> buys the single tab stop, the arrow-key '
                 'navigation, the mutual exclusion and the group announcement. Every '
                 'div-and-script radio group in the wild is an attempt to re-earn those four '
                 'things, and most get the tab stop wrong.</div>'),

        anatomy=spec([
            ('Touchpoint', '<span class="m">24 &times; 24</span> &mdash; the outer frame, same '
                           'as the <a href="checkbox.html">checkbox</a>'),
            ('Circle', '<span class="m">16 &times; 16</span>, 1px border'),
            ('Selected', 'The same circle with a <span class="m">4px</span> inside ring, leaving '
                         'an <span class="m">8px</span> centre in the surface colour'),
            ('Gap to label', '<span class="m">9px</span>'),
            ('Gap between options', '<span class="m">10px</span>'),
            ('Legend', 'The question the group answers. Always present.'),
        ]),

        options=(copybar('Radio group', 'rad', '2 to 5 options', RAD_HTML, RAD_CSS) +
                 bench(demo, demo) +
                 copybar('With a disabled option', 'radd', '', None, None) +
                 bench(dis, dis)),

        states=table(['State', 'What changes'], [
            ['Unselected', 'Empty circle, 1px border.'],
            ['Selected', 'The border thickens to <span class="m">4px</span> on the inside. The '
                         'centre stays the surface colour, so it reads as an 8px hole rather '
                         'than an 8px blob.'],
            ['Hover', 'Border darkens. The touchpoint, not the circle, decides when hover starts.'],
            ['Focus', '2px outline at 2px offset.'],
            ['Disabled', '42% opacity. Say why it is disabled.'],
        ]),

        behaviour=('<p>Radios are for two to five options. Past five, the list becomes a '
                   'scanning problem and a <a href="dropdown.html">dropdown</a> is kinder.</p>' +
                   checklist([
                       'One option should be selected by default unless the choice is genuinely '
                       'open. A group with nothing selected is a form the user can forget.',
                       'Never offer a way to unselect back to nothing. That is a checkbox.',
                       'Order the options by a logic the user can see &mdash; frequency, size, '
                       'alphabetical. Not by how they came out of the database.',
                   ])),

        guidelines=dodont(
            ['Use a legend that states the question.',
             'Keep options vertical, one per line.',
             'Preselect the safest or most common option.'],
            ['Do not use radios for a binary on/off that takes effect immediately &mdash; '
             'that is a <a href="toggle.html">toggle</a>.',
             'Do not use them for more than five options.',
             'Do not mix radios and checkboxes in the same visual group.']),

        specs=spec([
            ('Touchpoint', '<span class="m">24 &times; 24</span>'),
            ('Circle', '<span class="m">16 &times; 16</span>'),
            ('Border, unselected', '<span class="m">1px</span> <code>--strong</code>'),
            ('Border, selected', '<span class="m">4px</span> <code>--strong</code>, inside'),
            ('Centre, selected', '<span class="m">8 &times; 8</span> of the surface colour'),
            ('Gap to label', '<span class="m">9px</span>'),
            ('Gap between options', '<span class="m">10px</span>'),
        ]),

        a11y=checklist([
            'All radios in a group share one <code>name</code>. That is what makes them a group '
            'to the browser and to assistive technology.',
            'Wrap them in <code>&lt;fieldset&gt;</code> with a <code>&lt;legend&gt;</code>.',
            'Arrow keys move between options and change the selection. Tab moves past the whole '
            'group, not between its options &mdash; this is standard and you should not override it.',
            'A group with nothing selected puts every option in the tab order; a group with a '
            'selection puts only the selected one there. Preselecting is the friendlier default.',
        ]),

        gaps=checklist([
            'Two sets exist &mdash; Radio Button Input and Radio Button Item &mdash; and the '
            'division between them is not documented.',
            'The Input set adds an <code>isInverse</code> axis the Item set does not have.',
            'The radio inside a <a href="table.html">table row</a> is '
            '<span class="m">24 &times; 24</span>, not 16.',
        ]),
    )


# ══════════════════════════════════════════════════════════════
#  TOGGLE
# ══════════════════════════════════════════════════════════════
TOG_HTML = """<label class="vf-toggle">
  <input type="checkbox" role="switch" checked>
  <span class="vf-toggle__track" aria-hidden="true"><span class="vf-toggle__knob"></span></span>
  <span>Live fleet updates</span>
</label>"""

TOG_CSS = """/* Verifi toggle — takes effect immediately. There is no Save. */
.vf-toggle { display: inline-flex; align-items: center; gap: 10px; cursor: pointer;
             font-size: 14px; color: #36322dc2; }
.vf-toggle input { position: absolute; opacity: 0; width: 0; height: 0; }

.vf-toggle__track {
  width: 40px; height: 22px; flex: none;
  padding: 2px;
  border-radius: 99px;
  background: rgba(54,50,45,.30);   /* --border-mid */
  display: inline-flex; align-items: center;
  transition: background .14s;
}
.vf-toggle__knob {
  width: 18px; height: 18px; border-radius: 99px; background: #ffffff;
  transition: transform .14s cubic-bezier(.22,1,.36,1);
}
.vf-toggle input:checked + .vf-toggle__track { background: #36322d; }
.vf-toggle input:checked + .vf-toggle__track .vf-toggle__knob { transform: translateX(18px); }
.vf-toggle input:focus-visible + .vf-toggle__track {
  outline: 2px solid #36322d; outline-offset: 2px;
}
.vf-toggle input:disabled ~ * { opacity: .42; }

@media (prefers-color-scheme: dark) {
  .vf-toggle { color: #e5e5e5de; }
  .vf-toggle__track { background: rgba(229,229,229,.25); }
  .vf-toggle__knob { background: #211f1c; }
  .vf-toggle input:checked + .vf-toggle__track { background: #fff; }
}"""


def c_toggle():
    demo = ('<div class="bstack">'
            '<span class="binline"><span class="c-tog on"><i></i></span>'
            '<span style="font-size:14px;color:var(--tx2)">Live fleet updates</span></span>'
            '<span class="binline"><span class="c-tog"><i></i></span>'
            '<span style="font-size:14px;color:var(--tx2)">Dark mode</span></span>'
            '<span class="binline" style="opacity:.42"><span class="c-tog"><i></i></span>'
            '<span style="font-size:14px;color:var(--tx2)">Auto-dose (requires a sensor)</span>'
            '</span></div>')

    return cpage(
        'components/toggle.html', 'Toggle',
        'An instant on or off. Flipping it changes the system there and then &mdash; there is '
        'nothing to press afterwards.',
        'gap', figma='35264:124887',

        example=bench(demo, demo),

        anatomy=spec([
            ('Track', '<span class="m">40 &times; 22</span>, fully rounded, 2px inner padding'),
            ('Knob', '<span class="m">18 &times; 18</span>, travels <span class="m">18px</span>'),
            ('Gap to label', '<span class="m">10px</span>'),
            ('Motion', '<span class="m">0.14s</span> on the knob, <span class="m">0.14s</span> '
                       'on the track colour'),
        ]),

        options=(copybar('Toggle', 'tog', '40 &times; 22', TOG_HTML, TOG_CSS) +
                 bench(demo, demo)),

        states=table(['State', 'What changes'], [
            ['Off', 'Track in <code>--border-mid</code>, knob left.'],
            ['On', 'Track fills with <code>--strong</code>, knob slides right.'],
            ['Focus', '2px outline at 2px offset.'],
            ['Disabled', '42% opacity. Say what would enable it.'],
            ['Hover', '<b>Not drawn.</b> See known gaps.'],
        ]),

        behaviour=('<div class="note stop"><b>If there is a Save button on the screen, this is '
                   'the wrong component.</b> A toggle commits on flip. Anything that waits for a '
                   'form submission is a <a href="checkbox.html">checkbox</a>.</div>' +
                   checklist([
                       'The label says what is on, not what the toggle does. '
                       '&ldquo;Live fleet updates&rdquo;, not &ldquo;Turn on live updates&rdquo;.',
                       'No separate on/off text beside it. The position is the state.',
                       'If the change can fail &mdash; a network call &mdash; show the failure '
                       'and return the toggle to where it was. Never leave it lying.',
                   ])),

        guidelines=dodont(
            ['Use it for preferences and live filters that redraw immediately.',
             'Keep the label positive and static; it does not change when the state does.',
             'Group related toggles under a heading.'],
            ['Do not use a toggle inside a form with a Save button.',
             'Do not use one for a destructive action. That needs a confirm step.',
             'Do not add &ldquo;On&rdquo; and &ldquo;Off&rdquo; text either side &mdash; it '
             'doubles the reading and halves the clarity.']),

        specs=spec([
            ('Track', '<span class="m">40 &times; 22</span>'),
            ('Knob', '<span class="m">18 &times; 18</span>'),
            ('Inner padding', '<span class="m">2px</span>'),
            ('Travel', '<span class="m">18px</span>'),
            ('Gap to label', '<span class="m">10px</span>'),
            ('Transition', '<span class="m">0.14s cubic-bezier(.22, 1, .36, 1)</span>'),
            ('Hit target', '<span class="m">44px</span> minimum'),
        ]),

        a11y=checklist([
            'Use <code>&lt;input type="checkbox" role="switch"&gt;</code>. A screen reader then '
            'says &ldquo;switch, on&rdquo; rather than &ldquo;checkbox, checked&rdquo;.',
            'The visible label is the accessible name.',
            'Space activates. The change must be announced &mdash; if flipping it changes '
            'content elsewhere on the page, that region needs <code>aria-live</code>.',
            'Do not rely on the track colour alone; the knob position carries the state for '
            'anyone who cannot distinguish the fill.',
        ]),

        gaps=checklist([
            '<b>The toggle has no hover state.</b> It is the only atom in the library missing '
            'one. Until it is drawn, we darken the track slightly, which is a guess.',
            '<b>Mixed casing in the variants</b> &mdash; <code>disabled: False/True</code> beside '
            '<code>value: true/false</code>.',
            'A small size exists as a variant but has no published dimensions.',
        ]),
    )


# ══════════════════════════════════════════════════════════════
#  TEXT FIELD
# ══════════════════════════════════════════════════════════════
FIELD_HTML = """<div class="vf-field">
  <label class="vf-field__label" for="truck">Truck number</label>
  <div class="vf-field__box">
    <input id="truck" type="text" placeholder="e.g. 4417">
  </div>
  <p class="vf-field__help">Numbers only</p>
</div>"""

FIELD_CSS = """/* Verifi text field — label, box, helper. 6px between each.
   The helper line is always in the layout, even when empty, so fields in a
   row keep their baselines when one of them goes into error. */
.vf-field { display: flex; flex-direction: column; gap: 6px; }

.vf-field__label { font-size: 14px; line-height: 1.3; color: #171614; }
.vf-field__label .required { color: #b00100; }

.vf-field__box {
  display: flex; align-items: center; gap: 8px;
  min-height: 44px;
  padding: 12px 16px;
  border-radius: 100px;             /* a true pill */
  background: #ffffff;
  border: 1px solid #666054;
  transition: border-color .14s, box-shadow .14s;
}
.vf-field__box input {
  flex: 1; min-width: 0; border: 0; background: none; outline: none; padding: 0;
  font-family: 'ABC Repro', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px; line-height: 20px; color: #171614;
}
.vf-field__box input::placeholder { color: #666054; }

.vf-field__help {
  display: flex; align-items: center; gap: 8px;
  min-height: 16px; margin: 0; padding: 4px 0;
  font-size: 12px; line-height: 1.3; color: #171614;
}

/* States — border only. Never a fill, never a dashed or dotted edge. */
.vf-field.is-filled   .vf-field__box { border-color: #171614; }
.vf-field.is-error    .vf-field__box { border-color: #b00100; }
.vf-field.is-error    .vf-field__help { color: #d70100; }
.vf-field.is-disabled .vf-field__box { background: #dfdedd; border-color: #b6b1a5; }
.vf-field.is-disabled .vf-field__box input { color: #7f796c; }
.vf-field__box:focus-within { border-color: #171614; box-shadow: 0 0 0 2px #171614; }

@media (prefers-color-scheme: dark) {
  .vf-field__label, .vf-field__help { color: #ffffff; }
  .vf-field__box { background: #211f1c; border-color: #b6b1a5; }
  .vf-field__box input { color: #fff; }
  .vf-field__box input::placeholder { color: #b6b1a5; }
  .vf-field.is-filled .vf-field__box { border-color: #fff; }
  .vf-field__box:focus-within { border-color: #fff; box-shadow: 0 0 0 2px #fff; }
  .vf-field.is-error .vf-field__box { border-color: #efadac; }
  .vf-field.is-error .vf-field__help { color: #efadac; }
  .vf-field.is-disabled .vf-field__box { background: #2f2d28; border-color: #565147; }
}"""


def c_field():
    states = (
        brow('Resting', tf()) +
        brow('Filled', tf('filled', value='4417', ph='')) +
        brow('Focus &mdash; the clear control appears',
             tf('focus', value='4417', ph='', clear=True)) +
        brow('Error', tf('error', value='44 17', ph='',
                         help_='That truck number does not exist on this account')) +
        brow('Disabled &mdash; the value stays visible',
             tf('dis', value='4417', ph='', help_='Set by the dispatch system', dis=True)) +
        brow('Required', tf(label='Plant', ph='Choose a plant', help_='Required to save', req=True))
    )

    return cpage(
        'components/text-field.html', 'Text field',
        'One pill-shaped input, drawn in six states, carrying nine different kinds of data. Get '
        'this right and most of the product is right.',
        'gap', figma='63987:77509', extra_meta=['9 input types'],

        example=bench(states, states),

        anatomy=('<p>Every field is a label, a box and a helper line stacked 6px apart.</p>' +
                 spec([
                     ('Label', '<span class="m">14px</span>, always rendered'),
                     ('Box', '<span class="m">min-height 44px</span> &middot; padding '
                             '<span class="m">12px 16px</span> &middot; radius '
                             '<span class="m">100px</span>'),
                     ('Input text', '<span class="m">14px / 20px</span>'),
                     ('Helper', '<span class="m">12px</span>, 4px vertical padding, reserved '
                                'even when empty'),
                     ('Gap', '<span class="m">6px</span> label &rarr; box &rarr; helper'),
                     ('Icon', '<span class="m">16px</span>, 8px from the text'),
                 ])),

        options=(copybar('Text field', 'fld', '44px pill', FIELD_HTML, FIELD_CSS) +
                 bench(states, states) +
                 copybar('With a leading icon', 'fldi', 'search surfaces only', None, None) +
                 bench(tf(label='Search', value='', ph='Ticket, truck, order, mix, etc.',
                          help_='', lead=True),
                       tf(label='Search', value='', ph='Ticket, truck, order, mix, etc.',
                          help_='', lead=True))),

        states=table(['State', 'What changes'], [
            ['Resting', 'Border in <span class="m">#666054</span>, placeholder visible.'],
            ['Filled', 'Border darkens to <span class="m">#171614</span>.'],
            ['Focus', 'Border darkens and gains a 2px ring. The clear control appears.'],
            ['Error', '<b>Border only.</b> No red fill, no red text in the input, no icon '
                      'inside the box.'],
            ['Disabled', 'Solid grey fill. The value stays visible.'],
            ['Required', 'A red asterisk after the label.'],
        ]),

        behaviour=('<h3>The error rule, written out</h3>' +
                   checklist([
                       '<b>The border changes colour. Nothing else does.</b>',
                       '<b>The alert icon lives in the helper line</b>, left of the message, at 13px.',
                       '<b>Error text replaces helper text.</b> It never stacks underneath. If the '
                       'helper text was load-bearing, the error has to carry that information too.',
                       '<b>Both parts are required.</b> The error variant with no message tells '
                       'someone that something is wrong but not what.',
                       '<b>Never dashed, never dotted.</b> There is no dashed or dotted border '
                       'anywhere in this system, in any state, on any component.',
                   ]) +
                   '<h3>Disabled keeps its value</h3>'
                   '<p>A disabled field does not blank. It shows what it holds, greyed, because '
                   'the value is usually the explanation &mdash; the plant was set by dispatch, '
                   'the mix came from the order. Blanking it turns a clear screen into a mystery.</p>'
                   '<h3>Nine types, one field</h3>' +
                   table(['Type', 'Reach for it when'], [
                       ['Text input', 'Free text with no format to enforce.'],
                       ['Email', 'An address. The type drives the keyboard and the validation hint.'],
                       ['Phone', 'A number with a country format.'],
                       ['Password', 'Masked entry with a reveal control.'],
                       ['Search', 'Only inside a search surface. Not as shorthand for '
                                  '&ldquo;text input with a magnifier&rdquo;.'],
                       ['Date picker', 'A date. Never ask someone to type one in three boxes.'],
                       ['Dropdown', '5&ndash;15 known options. See <a href="dropdown.html">Dropdown</a>.'],
                       ['Language selector', 'Exactly what it says. It exists so nobody rebuilds it.'],
                       ['Text area', 'Multi-line.'],
                   ])),

        guidelines=dodont(
            ['Write helper text before the user needs it, not after they fail.',
             'Mark required fields and say what happens if they are empty.',
             'One field per line for anything typed from memory.',
             'Validate on blur or on submit.'],
            ['Do not use placeholder text as the label. It disappears exactly when it is needed.',
             'Do not validate on every keystroke.',
             'Do not put the error message anywhere but the helper line.',
             'Do not disable submit to communicate a validation failure.']),

        specs=spec([
            ('Height', '<span class="m">44px</span> minimum'),
            ('Padding', '<span class="m">12px 16px</span>'),
            ('Radius', '<span class="m">100px</span>'),
            ('Border', '<span class="m">1px</span> &mdash; resting '
                       '<span class="m">#666054</span>, filled and focus '
                       '<span class="m">#171614</span>, error <span class="m">#B00100</span>'),
            ('Focus ring', '<span class="m">0 0 0 2px</span>'),
            ('Disabled fill', '<span class="m">#DFDEDD</span>, border '
                              '<span class="m">#B6B1A5</span>, text <span class="m">#7F796C</span>'),
            ('Input text', '<span class="m">14px / 20px</span>'),
            ('Helper', '<span class="m">12px</span>'),
            ('Gaps', '<span class="m">6px</span> vertical, <span class="m">8px</span> to icons'),
        ]),

        a11y=checklist([
            'Every field needs a real <code>&lt;label for&gt;</code>. Placeholder is not a label.',
            'Link the helper or error text with <code>aria-describedby</code>.',
            'Set <code>aria-invalid="true"</code> on the input in the error state.',
            'Move focus to the first invalid field on a failed submit, and announce the count.',
            'Use the right <code>type</code> and <code>autocomplete</code> so mobile keyboards '
            'and password managers behave.',
            'The disabled fill at <span class="m">#DFDEDD</span> with text at '
            '<span class="m">#7F796C</span> is deliberately low contrast &mdash; never put '
            'information there that exists nowhere else.',
        ]),

        gaps=checklist([
            '<b>Dark mode is not drawn.</b> The dark column here is derived from the surface and '
            'ink tokens applied consistently. It is a reading, not a decision.',
            '<b>The nine types are loose components, not a variant set.</b> All the states live '
            'in a private part underneath, which means an instance can be swapped into a state '
            'nobody drew.',
            '<b>Text area exists twice</b> &mdash; once in the family and once on its own page.',
            '<b>Two label positions exist</b> &mdash; eyebrow and minimized &mdash; with no rule '
            'for when to float. Use eyebrow unless a design says otherwise.',
        ]),
    )


# ══════════════════════════════════════════════════════════════
#  DROPDOWN
# ══════════════════════════════════════════════════════════════
DD_HTML = """<div class="vf-field">
  <label class="vf-field__label" for="plant">Plant</label>
  <div class="vf-field__box">
    <select id="plant">
      <option value="">Choose a plant</option>
      <option>Rockdale</option>
      <option>Midwest</option>
      <option>Northgate</option>
    </select>
    <svg class="vf-field__chevron" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 6.5L8 10.5L12 6.5" fill="none" stroke="currentColor"
            stroke-width="1.6" stroke-linecap="round"/>
    </svg>
  </div>
  <p class="vf-field__help">Where this load is dispatched from</p>
</div>"""

DD_CSS = """/* Verifi dropdown — the text field box with a select inside it.
   Everything about the box is shared with the text field; only the
   chevron and the open menu are new. */
.vf-field__box select {
  flex: 1; min-width: 0; border: 0; background: none; outline: none;
  font-family: inherit; font-size: 14px; line-height: 20px; color: #171614;
  appearance: none; -webkit-appearance: none; cursor: pointer;
}
.vf-field__chevron { width: 14px; height: 14px; flex: none; color: #171614; }

.vf-menu {
  margin-top: 4px;
  border-radius: 16px;
  background: #ffffff;
  padding: 6px;
  box-shadow: inset 0 0 0 1px #36322d24, 0 10px 30px rgba(0,0,0,.18);
  max-height: 320px;
  overflow-y: auto;
}
.vf-menu__item {
  display: block; width: 100%; text-align: left;
  padding: 9px 11px; border-radius: 8px; border: 0; background: none;
  font: inherit; font-size: 14px; color: #36322dc2; cursor: pointer;
}
.vf-menu__item:hover           { background: rgba(48,105,227,.05); color: #36322d; }
.vf-menu__item[aria-selected="true"] { background: #3069e3; color: #fff; }

@media (prefers-color-scheme: dark) {
  .vf-field__box select, .vf-field__chevron { color: #fff; }
  .vf-menu { background: #211f1c; box-shadow: inset 0 0 0 1px #e5e5e51f, 0 10px 30px rgba(0,0,0,.4); }
  .vf-menu__item { color: #e5e5e5de; }
  .vf-menu__item:hover { background: rgba(227,242,0,.05); color: #fff; }
  .vf-menu__item[aria-selected="true"] { background: #e3f200; color: #000; }
}"""


def c_dropdown():
    closed = tf(label='Plant', value='', ph='Choose a plant',
                help_='Where this load is dispatched from', chev=True)
    filled = tf('filled', label='Plant', value='Rockdale', ph='',
                help_='Where this load is dispatched from', chev=True)
    err = tf('error', label='Plant', value='', ph='Choose a plant',
             help_='Pick a plant before saving', chev=True)
    openmenu = (closed +
                '<div class="c-pop" style="max-width:320px;margin-top:-10px">'
                '<span class="on">Rockdale</span><span>Midwest</span>'
                '<span>Northgate</span></div>')

    return cpage(
        'components/dropdown.html', 'Dropdown',
        'One choice from a closed set of five to fifteen options. If the user might need a value '
        'that is not in the list, this is the wrong component.',
        'gap', figma='51689:13501',

        note='<div class="note"><b>The box is the text field.</b> Padding, height, radius, '
             'border colours and every state come from <a href="text-field.html">Text field</a>. '
             'Only the chevron and the open menu belong to this page.</div>',

        example=bench(filled, filled),

        anatomy=spec([
            ('Field', 'The 44px pill from <a href="text-field.html">Text field</a>'),
            ('Chevron', '<span class="m">14 &times; 14</span>, right-aligned, rotates on open'),
            ('Menu', '<span class="m">16px</span> radius, 6px padding, floats above with a shadow'),
            ('Menu item', '<span class="m">9px 11px</span> padding, <span class="m">8px</span> radius'),
            ('Max height', '<span class="m">320px</span>, then it scrolls'),
        ]),

        options=(copybar('Dropdown', 'dd', 'closed-set, single choice', DD_HTML, DD_CSS) +
                 bench(closed, closed) +
                 copybar('Open', 'ddo', 'menu below', None, None) +
                 bench(openmenu, openmenu) +
                 copybar('Error', 'dde', '', None, None) +
                 bench(err, err)),

        states=table(['State', 'What changes'], [
            ['Resting', 'Placeholder visible, border <span class="m">#666054</span>.'],
            ['Hover', 'Border darkens.'],
            ['Selected', 'The chosen value replaces the placeholder; border darkens.'],
            ['Expanded', 'Chevron rotates 180&deg;, menu appears below (or above if there is no room).'],
            ['Error', 'Border only, message in the helper line.'],
            ['Focus', '<b>Not drawn on the public set.</b> See known gaps.'],
        ]),

        behaviour=('<div class="note"><b>Five to fifteen.</b> Under five options, use a '
                   '<a href="radio-group.html">radio group</a> &mdash; all of them fit on screen '
                   'and nobody has to open anything. Over fifteen, add a filter inside the menu '
                   'or use a search field with suggestions.</div>' +
                   checklist([
                       'The menu opens below by default and flips above when there is no room.',
                       'It closes on outside click, on Escape, and on selection.',
                       'The currently selected item is marked in the menu, not just in the field.',
                       'Long option labels truncate in the field but never in the menu.',
                   ])),

        guidelines=dodont(
            ['Order the options the way the user thinks about them.',
             'Use a placeholder that names the choice &mdash; &ldquo;Choose a plant&rdquo;.',
             'Preselect when there is a sensible default.'],
            ['Do not use a dropdown when the user may need a value that is not listed.',
             'Do not use one for two options. That is a '
             '<a href="radio-group.html">radio group</a> or a <a href="toggle.html">toggle</a>.',
             'Do not nest a dropdown inside a dropdown.',
             'Do not hide the selected value behind a generic label such as &ldquo;Selected&rdquo;.']),

        specs=spec([
            ('Field', 'Inherits every dimension from <a href="text-field.html">Text field</a>'),
            ('Chevron', '<span class="m">14 &times; 14</span>'),
            ('Menu radius', '<span class="m">16px</span>'),
            ('Menu padding', '<span class="m">6px</span>'),
            ('Item padding', '<span class="m">9px 11px</span>'),
            ('Item radius', '<span class="m">8px</span>'),
            ('Menu offset', '<span class="m">4px</span> below the field'),
            ('Max height', '<span class="m">320px</span>'),
            ('Sizes', 'Large, small and jumbo exist as variants; only large has published values'),
        ]),

        a11y=checklist([
            'A native <code>&lt;select&gt;</code> is the right answer more often than people '
            'think &mdash; it is keyboard and screen-reader correct for free, and on mobile it '
            'gets the platform picker.',
            'If you build a custom one, it needs <code>role="combobox"</code>, '
            '<code>aria-expanded</code>, <code>aria-controls</code>, and a listbox with '
            '<code>aria-selected</code> on the chosen item.',
            'Arrow keys move through options, Enter selects, Escape closes and returns focus to '
            'the field.',
            'Type-ahead should jump to the first matching option.',
            'The label must stay visible when the menu is open.',
        ]),

        gaps=checklist([
            '<b>No focus state on the public set.</b> Interim rule: the field takes the same '
            'focus treatment as a text field &mdash; darkened border plus a 2px ring.',
            '<b>Three sizes, one set of values.</b> Large, small and jumbo exist as variants but '
            'only large is specified.',
            '<b>No multi-select variant.</b> If you need one, the closest published thing is the '
            'popover in multi-select mode.',
            '<b>Dark mode is not drawn.</b>',
        ]),
    )


# ══════════════════════════════════════════════════════════════
#  TABS
# ══════════════════════════════════════════════════════════════
TABS_HTML = """<div class="vf-tabs" role="tablist" aria-label="Truck detail">
  <button role="tab" aria-selected="true"  id="tab-overview" aria-controls="panel-overview">Overview</button>
  <button role="tab" aria-selected="false" id="tab-sensors"  aria-controls="panel-sensors" tabindex="-1">Sensors</button>
  <button role="tab" aria-selected="false" id="tab-history"  aria-controls="panel-history" tabindex="-1">History</button>
</div>
<div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">…</div>"""

TABS_CSS = """/* Verifi tabs — peer views of the same object. Content swaps in place. */
.vf-tabs {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid #36322d24;
  overflow-x: auto;
  scrollbar-width: none;
}
.vf-tabs::-webkit-scrollbar { display: none; }

.vf-tabs > [role="tab"] {
  padding: 11px 16px;
  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: none;
  font: inherit;
  font-size: 14px;
  color: #36322d9e;                 /* --soft */
  white-space: nowrap;
  cursor: pointer;
  transition: color .14s, border-color .14s;
}
.vf-tabs > [role="tab"]:hover { color: #36322d; }
.vf-tabs > [role="tab"][aria-selected="true"] {
  color: #36322d;                   /* --strong */
  border-bottom-color: #3069e3;     /* --select */
}
.vf-tabs > [role="tab"]:focus-visible { outline: 2px solid #36322d; outline-offset: -2px; }

@media (prefers-color-scheme: dark) {
  .vf-tabs { border-bottom-color: #e5e5e51f; }
  .vf-tabs > [role="tab"] { color: #e5e5e5bf; }
  .vf-tabs > [role="tab"]:hover,
  .vf-tabs > [role="tab"][aria-selected="true"] { color: #fff; }
  .vf-tabs > [role="tab"][aria-selected="true"] { border-bottom-color: #e3f200; }
}"""


def c_tabs():
    demo = ('<div class="c-tabs"><button aria-selected="true">Overview</button>'
            '<button aria-selected="false">Sensors</button>'
            '<button aria-selected="false">History</button></div>')
    many = ('<div class="c-tabs"><button aria-selected="true">Overview</button>'
            '<button aria-selected="false">Sensors</button>'
            '<button aria-selected="false">History</button>'
            '<button aria-selected="false">Alerts</button>'
            '<button aria-selected="false">Mix design</button>'
            '<button aria-selected="false">Documents</button></div>')

    return cpage(
        'components/tabs.html', 'Tabs',
        'Peer views of the same object, switched in place. Tabs are wayfinding, not parameters '
        '&mdash; nothing is being reconfigured, you are just looking somewhere else.',
        'gap', figma='39520:6900',

        note='<div class="note"><b>Tabs or segmented control?</b> Tabs switch between <em>views '
             'of one object</em> &mdash; Overview, Sensors, History for a single truck. A '
             'segmented control switches between <em>representations of one dataset</em> &mdash; '
             'All tickets, Fleet map, Phases. If the page title stays the same and the content '
             'below changes shape, you want a segmented control.</div>',

        example=bench(demo, demo, 'The tabs in these panels are live — press one.'),

        anatomy=spec([
            ('Tab', '<span class="m">11px 16px</span> padding, 14px label'),
            ('Indicator', '<span class="m">2px</span> bottom border in <code>--select</code>'),
            ('Track', '<span class="m">1px</span> bottom border across the full width'),
            ('Gap', '<span class="m">2px</span> between tabs'),
            ('Count', '2 to 8. Past 8, rethink the page.'),
        ]),

        options=(copybar('Tabs', 'tabs', '2 to 8', TABS_HTML, TABS_CSS) +
                 bench(demo, demo) +
                 copybar('Overflowing', 'tabso', '6+ tabs', None, None) +
                 bench(many, many) +
                 '<p>Past the container width the strip scrolls horizontally. '
                 '<b>It never wraps to a second row.</b></p>'),

        states=table(['State', 'What changes'], [
            ['Default', 'Label in <code>--soft</code>, no indicator.'],
            ['Hover', 'Label lifts to <code>--strong</code>.'],
            ['Selected', 'Label in <code>--strong</code>, 2px indicator in <code>--select</code>.'],
            ['Focus', '2px outline, inset so it does not clip on the track.'],
            ['Disabled', 'Rare and usually wrong. A view that exists but cannot be opened needs '
                         'an explanation, not a greyed tab.'],
        ]),

        behaviour=checklist([
            'Switching is instant and lossless. If moving away would discard unsaved input, tabs '
            'are the wrong component.',
            'The first tab is selected on load. Never open with nothing selected.',
            'The selected tab should survive a page refresh &mdash; put it in the URL.',
            'Past eight tabs the strip scrolls. It never wraps to two rows, and it never '
            'collapses into a dropdown.',
        ]),

        guidelines=dodont(
            ['Keep labels to one or two words.',
             'Order them by how often they are used, most first.',
             'Put the tab in the URL so a view can be linked to.'],
            ['Do not use tabs for steps in a sequence. That is a stepper, and no stepper '
             'component exists &mdash; talk to Verifi Design rather than dressing tabs up as one.',
             'Do not put a form that spans tabs behind them.',
             'Do not wrap tabs to a second row.',
             'Do not use tabs and a segmented control on the same screen for the same job.']),

        specs=spec([
            ('Padding', '<span class="m">11px 16px</span>'),
            ('Label', '<span class="m">14px</span>'),
            ('Indicator', '<span class="m">2px</span>'),
            ('Track', '<span class="m">1px</span>'),
            ('Gap', '<span class="m">2px</span>'),
            ('Selected colour', 'Light <span class="m">#3069E3</span>, dark '
                                '<span class="m">#E3F200</span>'),
            ('Transition', '<span class="m">0.14s</span>'),
        ]),

        a11y=checklist([
            'The strip is <code>role="tablist"</code> with an <code>aria-label</code>; each tab '
            'is <code>role="tab"</code> with <code>aria-selected</code> and '
            '<code>aria-controls</code>.',
            'Only the selected tab is in the tab order &mdash; <code>tabindex="-1"</code> on the '
            'rest. Arrow keys move between them. This is the standard pattern and users expect it.',
            'Home and End jump to the first and last tab.',
            'Each panel is <code>role="tabpanel"</code> with <code>aria-labelledby</code> pointing '
            'at its tab.',
            'The indicator is a 2px line, which is not enough on its own &mdash; the label colour '
            'change carries the state as well.',
        ]),

        gaps=checklist([
            '<b>No overflow behaviour is defined past eight tabs.</b> Interim rule: scroll the '
            'strip, never wrap.',
            '<b>No pressed state</b> is drawn.',
            '<b>The private tab item has its own state model</b> that does not quite match the '
            'public set.',
            '<b>Dark mode is not drawn.</b>',
        ]),
    )


# ══════════════════════════════════════════════════════════════
#  MODAL
# ══════════════════════════════════════════════════════════════
MODAL_HTML = """<div class="vf-scrim" data-modal-scrim>
  <div class="vf-modal" role="dialog" aria-modal="true" aria-labelledby="m-title">
    <h2 class="vf-modal__title" id="m-title">Delete this ticket?</h2>
    <p class="vf-modal__body">
      Ticket 88213 and its sensor history will be removed. This cannot be undone.
    </p>
    <div class="vf-modal__actions">
      <button type="button" class="vf-btn vf-btn--quiet">Cancel</button>
      <button type="button" class="vf-btn vf-btn--danger">Delete</button>
    </div>
  </div>
</div>"""

MODAL_CSS = """/* Verifi modal — an interruption that requires a decision.
   Only Extra small is published; sm/md/lg below are an interim proposal. */
.vf-scrim {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(54,50,45,.5);
  display: grid; place-items: center;
  padding: 24px;
}

.vf-modal {
  width: 100%;
  max-width: 400px;                 /* xs — the only published size */
  border-radius: 16px;
  background: #ffffff;
  padding: 20px;
  box-shadow: 0 14px 40px rgba(0,0,0,.24);
}
.vf-modal--sm { max-width: 560px; }   /* interim */
.vf-modal--md { max-width: 720px; }   /* interim */
.vf-modal--lg { max-width: 960px; }   /* interim */

.vf-modal__title { margin: 0 0 6px; font-size: 16px; font-weight: 500; color: #36322d; }
.vf-modal__body  { margin: 0 0 16px; font-size: 13.5px; line-height: 1.5; color: #36322d9e; }
.vf-modal__actions { display: flex; gap: 8px; justify-content: flex-end; }

@media (prefers-color-scheme: dark) {
  .vf-modal { background: #211f1c; box-shadow: inset 0 0 0 1px #e5e5e51f, 0 14px 40px rgba(0,0,0,.5); }
  .vf-modal__title { color: #fff; }
  .vf-modal__body  { color: #e5e5e5bf; }
}"""


def c_modal():
    demo = ('<div class="c-modal"><h3>Delete this ticket?</h3>'
            '<p>Ticket 88213 and its sensor history will be removed. This cannot be undone.</p>'
            '<div class="row"><button class="c-btn quiet sm">Cancel</button>'
            '<button class="c-btn danger sm">Delete</button></div></div>')

    return cpage(
        'components/modal.html', 'Modal',
        'An interruption that requires a decision before anything else can happen. It takes the '
        'whole screen hostage, so it has to earn that.',
        'gap', figma='37282:2485', extra_meta=['Extra small only'],

        note='<div class="note warn"><b>Only one size is published.</b> Extra small is the only '
             'variant drawn. There is no header or footer slot spec and no close-affordance spec. '
             'The sm / md / lg widths in the CSS below are our proposal, not published values.</div>',

        example=bench(demo, demo),

        anatomy=spec([
            ('Scrim', '<span class="m">rgba(54, 50, 45, .5)</span> over the whole viewport'),
            ('Panel', '<span class="m">16px</span> radius, <span class="m">20px</span> padding'),
            ('Title', '<span class="m">16px / 500</span>'),
            ('Body', '<span class="m">13.5px</span>, soft ink'),
            ('Actions', 'Right-aligned, <span class="m">8px</span> apart, the safe one on the left'),
            ('Shadow', '<span class="m">0 14px 40px rgba(0,0,0,.24)</span> &mdash; it floats'),
        ]),

        options=(copybar('Modal', 'mod', 'confirm / destructive', MODAL_HTML, MODAL_CSS) +
                 bench(demo, demo) +
                 table(['Size', 'Max width', 'Status'], [
                     ['Extra small', '<span class="m">400px</span>',
                      '<span class="pill ok">Published</span>'],
                     ['Small', '<span class="m">560px</span>',
                      '<span class="pill none">Proposed</span>'],
                     ['Medium', '<span class="m">720px</span>',
                      '<span class="pill none">Proposed</span>'],
                     ['Large', '<span class="m">960px</span>',
                      '<span class="pill none">Proposed</span>'],
                 ])),

        states=table(['State', 'What changes'], [
            ['Open', 'Scrim fades in, panel appears. Focus moves into the panel.'],
            ['Closing', 'Both fade out; focus returns to whatever opened it.'],
            ['Scrolling', 'The panel body scrolls, never the page behind it.'],
        ]),

        behaviour=('<div class="note stop"><b>Modals are for confirmation and destruction.</b> '
                   'Not for reference content alongside a page &mdash; that is a drawer. Not for '
                   'a large workflow &mdash; that is a page. Not for a message the user does not '
                   'have to act on &mdash; that is a <a href="toast.html">toast</a>.</div>' +
                   checklist([
                       'The page behind it must not scroll while it is open.',
                       'Escape closes it, and so does clicking the scrim &mdash; unless the user '
                       'has entered data, in which case confirm first.',
                       'The destructive action is on the right, the safe one on the left.',
                       'Never open a modal from inside a modal.',
                       'The title is a question or a statement, never a single word like '
                       '&ldquo;Confirm&rdquo;.',
                   ])),

        guidelines=dodont(
            ['Say exactly what will happen and to what &mdash; name the ticket, the truck, '
             'the load.',
             'Label the buttons with the verb, not Yes and No.',
             'Keep it to one decision.'],
            ['Do not use a modal to show information the user did not ask for.',
             'Do not stack modals.',
             'Do not put a form longer than the viewport in one.',
             'Do not make the only way out the close icon.']),

        specs=spec([
            ('Radius', '<span class="m">16px</span>'),
            ('Padding', '<span class="m">20px</span>'),
            ('Max width', '<span class="m">400px</span> (xs, the only published size)'),
            ('Scrim', '<span class="m">rgba(54, 50, 45, .5)</span>'),
            ('Shadow', '<span class="m">0 14px 40px rgba(0, 0, 0, .24)</span>'),
            ('Action gap', '<span class="m">8px</span>'),
            ('Title', '<span class="m">16px / 500</span>'),
            ('Body', '<span class="m">13.5px / 1.5</span>'),
        ]),

        a11y=checklist([
            '<code>role="dialog"</code> with <code>aria-modal="true"</code> and '
            '<code>aria-labelledby</code> pointing at the title.',
            'Focus moves into the panel on open &mdash; to the first control, or to the panel '
            'itself if there is nothing to focus.',
            'Focus is trapped inside while it is open, and returns to the trigger on close.',
            'Escape always closes. This is not optional.',
            'Everything behind it gets <code>inert</code> or <code>aria-hidden="true"</code>.',
            'A destructive confirm should not autofocus the destructive button.',
        ]),

        gaps=checklist([
            '<b>Only Extra small exists.</b> Anything bigger is improvised.',
            '<b>No header or footer slot spec</b> &mdash; nothing says where a title, a close '
            'button or a footer belong.',
            '<b>No close-affordance spec.</b> There is no drawn close icon, and nothing says '
            'whether one is required.',
            '<b>Drawers are not a component at all</b>, despite being the Hub&rsquo;s main '
            'detail surface. The pattern is documented under '
            '<a href="../foundations/motion.html">Motion</a>.',
        ]),
    )


# ══════════════════════════════════════════════════════════════
#  TOAST
# ══════════════════════════════════════════════════════════════
TOAST_HTML = """<div class="vf-toasts" role="region" aria-label="Notifications">
  <div class="vf-toast" role="status">
    <svg class="vf-toast__icon" viewBox="0 0 16 16" aria-hidden="true">…</svg>
    <span>Ticket 88213 saved</span>
    <button class="vf-toast__close" aria-label="Dismiss">×</button>
  </div>
</div>"""

TOAST_CSS = """/* Verifi toast — transient feedback about something that already happened.
   5 seconds, newest on top, three visible at most. */
.vf-toasts {
  position: fixed; right: 24px; bottom: 24px; z-index: 90;
  display: flex; flex-direction: column-reverse; gap: 8px;
  max-width: min(420px, calc(100vw - 48px));
}

.vf-toast {
  display: flex; align-items: center; gap: 10px;
  padding: 13px 15px;
  border-radius: 8px;
  background: #ffffff;
  color: #36322dc2;
  font-size: 13.5px;
  box-shadow: inset 0 0 0 1px #36322d24, 0 6px 22px rgba(0,0,0,.14);
}
.vf-toast__icon  { width: 16px; height: 16px; flex: none; }
.vf-toast__close { margin-left: auto; border: 0; background: none; cursor: pointer;
                   color: #36322d9e; font-size: 15px; line-height: 1; }

.vf-toast--success .vf-toast__icon { color: #16a34a; }
.vf-toast--info    .vf-toast__icon { color: #3069e3; }
.vf-toast--warning .vf-toast__icon { color: #ffba0d; }
.vf-toast--error   .vf-toast__icon { color: #d70100; }

@media (prefers-color-scheme: dark) {
  .vf-toast { background: #211f1c; color: #e5e5e5de;
              box-shadow: inset 0 0 0 1px #e5e5e51f, 0 6px 22px rgba(0,0,0,.5); }
}
@media (prefers-reduced-motion: no-preference) {
  .vf-toast { animation: vf-toast-in .2s cubic-bezier(.22,1,.36,1); }
  @keyframes vf-toast-in { from { opacity: 0; transform: translateY(6px); } }
}"""


def c_toast():
    one = ('<div class="c-toast">' + TICK + '<span>Ticket 88213 saved</span>'
           '<span class="x">&times;</span></div>')
    stack = ('<div class="bstack">' + one +
             '<div class="c-toast">' + ALERT + '<span>Three tickets failed to sync</span>'
             '<span class="x">&times;</span></div></div>')

    return cpage(
        'components/toast.html', 'Toast',
        'Transient confirmation that something finished. It disappears on its own, so nothing '
        'important may live only here.',
        'gap', figma='39027:356',

        example=bench(one, one),

        anatomy=spec([
            ('Panel', '<span class="m">8px</span> radius, <span class="m">13px 15px</span> padding'),
            ('Icon', '<span class="m">16 &times; 16</span>, coloured by severity'),
            ('Close', 'Right-aligned, always present'),
            ('Shadow', 'It floats, so it has one'),
            ('Stack', 'Bottom right, newest on top, <span class="m">8px</span> apart'),
        ]),

        options=(copybar('Toast', 'toast', '5 seconds', TOAST_HTML, TOAST_CSS) +
                 bench(one, one) +
                 copybar('Stacked', 'toasts', 'max 3 visible', None, None) +
                 bench(stack, stack)),

        states=table(['Severity', 'Icon colour', 'Behaviour'], [
            ['Info', '<span class="sw" style="background:#3069e3"></span>'
                     '<span class="m">#3069E3</span>', 'Auto-dismisses after 5s.'],
            ['Success', '<span class="sw" style="background:#16a34a"></span>'
                        '<span class="m">#16A34A</span>', 'Auto-dismisses after 5s.'],
            ['Warning', '<span class="sw" style="background:#ffba0d"></span>'
                        '<span class="m">#FFBA0D</span>', 'Auto-dismisses after 5s.'],
            ['Error', '<span class="sw" style="background:#d70100"></span>'
                      '<span class="m">#D70100</span>',
             '<b>Persists until dismissed.</b> An error that vanishes is an error nobody saw.'],
        ]),

        behaviour=('<div class="note"><b>Four severities, and only four.</b> Toast shares its '
                   'severity grammar with the inline message. There is no fifth, no '
                   '&ldquo;critical&rdquo;, no &ldquo;notice&rdquo;.</div>' +
                   checklist([
                       'Five seconds by default; error toasts do not time out.',
                       'One stack region per viewport, bottom right, newest on top.',
                       'Three visible at most. A fourth waits for a slot.',
                       'Hovering a toast pauses its timer.',
                       '<b>If the user must act on it, it is not a toast.</b> Use an inline '
                       'message or a <a href="modal.html">modal</a>.',
                   ])),

        guidelines=dodont(
            ['Confirm the thing that just happened, in the past tense, naming the object.',
             'Offer Undo in the toast when the action is reversible.',
             'Let errors persist.'],
            ['Do not put the only copy of information in a toast.',
             'Do not fire a toast for something the user can already see happening.',
             'Do not stack more than three.',
             'Do not use a toast to report a validation error on a form the user is looking at '
             '&mdash; that belongs in the field.']),

        specs=spec([
            ('Radius', '<span class="m">8px</span>'),
            ('Padding', '<span class="m">13px 15px</span>'),
            ('Font', '<span class="m">13.5px</span>'),
            ('Icon', '<span class="m">16 &times; 16</span>'),
            ('Gap', '<span class="m">10px</span> inside, <span class="m">8px</span> between toasts'),
            ('Position', 'Bottom right, <span class="m">24px</span> from each edge'),
            ('Timeout', '<span class="m">5s</span>; errors never'),
            ('Max stacked', '<span class="m">3</span>'),
            ('Entry', '<span class="m">0.2s</span>, 6px rise, no bounce'),
        ]),

        a11y=checklist([
            'The stack region is <code>role="region"</code> with a label; each toast is '
            '<code>role="status"</code> so it is announced without stealing focus.',
            'An error toast is <code>role="alert"</code> &mdash; it interrupts, because it has to.',
            'Never move focus to a toast. It is not a place the user asked to be.',
            'The close button needs an accessible name.',
            'Under <code>prefers-reduced-motion</code> the toast appears without sliding.',
            'Five seconds is not enough for everyone to read. Hovering pauses the timer, and '
            'the information must exist somewhere else too.',
        ]),

        gaps=checklist([
            '<b>A second, cruder Toast set exists</b> on the Hub work at '
            '<span class="m">56362:19143</span>. This one, <span class="m">39027:356</span>, '
            'is canonical. Do not build against the duplicate.',
            '<b>The timing rules are a placeholder</b>, not a published decision.',
            '<b>No Undo variant is drawn</b>, though the pattern calls for one.',
            '<b>Dark mode is not drawn.</b>',
        ]),
    )


# ══════════════════════════════════════════════════════════════
#  TRUCK PHASE TAG
# ══════════════════════════════════════════════════════════════
PHASE_CSS = """/* Verifi truck phase tag — the nine stages of a load.
   THE COLOUR ROLES INVERT BETWEEN THEMES. Light mode is the solid colour
   with white text; dark mode is the light tint with near-black text.
   The same token pair drives the pill, the map marker and the legend dot —
   they must always agree. */
.vf-phase {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 32px;
  font-family: 'ABC Repro', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 1;
  white-space: nowrap;
  background: var(--phase-strong);
  color: #ffffff;
}

@media (prefers-color-scheme: dark) {
  .vf-phase { background: var(--phase-subtle); color: #171614; }
}

/* The nine pairs */
.vf-phase--waiting  { --phase-strong: #644325; --phase-subtle: #d9a97c; }
.vf-phase--loading  { --phase-strong: #9a1f1e; --phase-subtle: #efadac; }
.vf-phase--loaded   { --phase-strong: #887f13; --phase-subtle: #e4d95f; }
.vf-phase--to-job   { --phase-strong: #1e6252; --phase-subtle: #75dfc7; }
.vf-phase--on-site  { --phase-strong: #872781; --phase-subtle: #ed9ce6; }
.vf-phase--pouring  { --phase-strong: #101010; --phase-subtle: #d6d2d2; }
.vf-phase--washing  { --phase-strong: #126886; --phase-subtle: #b9deea; }
.vf-phase--return   { --phase-strong: #9c0f5a; --phase-subtle: #f6a4cf; }
.vf-phase--ignition { --phase-strong: #525252; --phase-subtle: #bababa; }"""

PHASE_HTML = """<span class="vf-phase vf-phase--pouring">Pouring</span>
<span class="vf-phase vf-phase--washing">Washing</span>
<span class="vf-phase vf-phase--loaded">Loaded</span>"""


def _pills(dark):
    out = ''
    for name, strong, subtle in PHASES:
        bg = subtle if dark else strong
        fg = '#171614' if dark else '#fff'
        out += ('<span class="c-phase" style="background:%s;color:%s">%s</span>'
                % (bg, fg, name))
    return '<div class="binline">%s</div>' % out


def c_phase():
    rows = ''
    for name, strong, subtle in PHASES:
        rows += ('<tr><td>%s</td>'
                 '<td class="m"><span class="sw" style="background:%s"></span>%s</td>'
                 '<td class="m"><span class="sw" style="background:%s"></span>%s</td></tr>'
                 % (name, strong, strong.upper(), subtle, subtle.upper()))

    return cpage(
        'components/truck-phase-tag.html', 'Truck phase tag',
        'The nine stages of a load, from waiting at the plant to ignition off. The most '
        'Verifi-specific component in the library, and the one most likely to be misused.',
        'gap', figma='56361:2240', extra_meta=['9 phases'],

        note='<div class="note ok"><b>One token pair, three components.</b> The phase pill, the '
             'map marker and the map legend dot all read from the same pair. A truck shown as '
             '<em>Pouring</em> in a list and <em>On site</em> on the map is a bug, not a design '
             'choice.</div>',

        example=bench(_pills(False), _pills(True),
                      'The colour roles invert between themes — this is the one component in '
                      'the library where that happens.'),

        anatomy=spec([
            ('Shape', '<span class="m">32px</span> radius pill'),
            ('Padding', '<span class="m">5px 10px</span>'),
            ('Label', '<span class="m">12px / 400</span>, never bold, never uppercase'),
            ('Light mode', 'Solid phase colour, white text'),
            ('Dark mode', 'Light phase tint, near-black text'),
        ]),

        options=(copybar('Phase tag', 'phase', 'all nine', PHASE_HTML, PHASE_CSS) +
                 bench(_pills(False), _pills(True)) +
                 '<h3>The nine pairs</h3>' +
                 '<div class="tw"><table><thead><tr><th>Phase</th><th class="m">Light (strong)</th>'
                 '<th class="m">Dark (subtle)</th></tr></thead><tbody>' + rows +
                 '</tbody></table></div>'),

        states=('<p>The phase tag has no interactive states. It is a label, not a control &mdash; '
                'it reports what the truck is doing and cannot be pressed, selected or dismissed.</p>'
                '<div class="note"><b>If you need it to be pressable</b>, you want a '
                'filter chip, and the phase colour does not come with it.</div>'),

        behaviour=('<div class="note stop"><b>The colour roles invert. They do not tint.</b> '
                   'Light mode is the solid colour with white text. Dark mode is the light tint '
                   'with near-black text. An early prototype rendered the same solid pill in both '
                   'modes; that has been overruled.</div>' +
                   checklist([
                       'The phase name is always written. Colour is the fast read, never the '
                       'only read.',
                       'Phases are ordered by the lifecycle, not alphabetically, everywhere they '
                       'are listed.',
                       'A truck has exactly one phase. There is no combined or transitional state.',
                       'The pill does not change size with the label. Long names such as '
                       '&ldquo;Waiting to load&rdquo; simply make a wider pill.',
                   ])),

        guidelines=dodont(
            ['Always render the phase name alongside the colour.',
             'Keep the lifecycle order in lists, legends and filters.',
             'Use the same token for the pill, the marker and the legend dot.'],
            ['Do not invent a tenth phase. Nine is the model.',
             'Do not reuse phase colours for anything that is not a phase.',
             'Do not bold or uppercase the label.',
             'Do not use a phase colour as a background for a region or card.']),

        specs=spec([
            ('Radius', '<span class="m">32px</span>'),
            ('Padding', '<span class="m">5px 10px</span>'),
            ('Font', '<span class="m">12px / 400</span>'),
            ('Line height', '<span class="m">1</span>'),
            ('Light text', '<span class="m">#FFFFFF</span>'),
            ('Dark text', '<span class="m">#171614</span>'),
        ]),

        a11y=('<p>Contrast for all eighteen combinations is measured on the '
              '<a href="../foundations/truck-phases.html">Truck phases</a> page. One fails.</p>' +
              '<div class="note warn"><b>Loaded fails in light mode.</b> '
              '<span class="m">#887F13</span> with white text measures 4.12:1 against a 4.5:1 '
              'requirement &mdash; the only one of eighteen that misses. '
              '<span class="m">#7A7211</span> would give 4.95:1.</div>' +
              checklist([
                  'The phase name is the accessible content. Never ship a bare coloured dot with '
                  'no text.',
                  'The tag is not interactive, so it needs no role &mdash; but if it sits in a '
                  'table cell, the cell is what gets announced.',
                  'Colour-blind users get no information from the hue. The label does all the '
                  'real work, and that is by design.',
              ])),

        gaps=checklist([
            '<b>An exact duplicate set exists</b> at <span class="m">57719:16219</span>. Build '
            'against <span class="m">56361:2240</span>.',
            '<b>The phase names disagree with the tokens.</b> The component says '
            '&ldquo;In transit&rdquo; and &ldquo;Return to plant&rdquo;; the tokens say '
            '&ldquo;To job&rdquo; and &ldquo;Returning to plant&rdquo;. Same domain, two '
            'dialects. Until it is settled, map component &rarr; token by position, not by name.',
            '<b>The Loaded pill fails contrast</b> and needs one shade of darkening.',
            '<b>No hover or focus treatment</b> exists for the case where a phase pill sits '
            'inside a clickable row.',
        ]),
    )


# ══════════════════════════════════════════════════════════════
#  CATALOGUE
# ══════════════════════════════════════════════════════════════
CAT = [
 ('Accordion', 'hold', 'Containers', 'ok', '37498:4517', None,
  '36 variants and the only component with a pressed state. The best-built set in the file.'),
 ('Account selector', 'hub', 'Hub', 'ok', '56362:18171', None,
  'Sits in the sidebar footer. Session scope lives here.'),
 ('Active alerts', 'hub', 'Hub', 'gap', '56361:2310', None, 'Unnamed axis.'),
 ('Avatar', 'inform', 'Informers', 'gap', '60899:8165', 'avatar.html',
  'Circle or square, four sizes. The only pass-two component with no contrast failure.'),
 ('Badge', 'inform', 'Informers', 'gap', '60895:44879', 'badge.html',
  'Two of three dot colours are invisible on a light page.'),
 ('Banner', 'inform', 'Informers', 'gap', '38356:1239', None,
  'No severity axis, unlike every other informer.'),
 ('Breadcrumbs', 'nav', 'Navigators', 'gap', '63904:41676', 'breadcrumbs.html',
  'Specification complete and unusually thorough; the Figma component is not built yet.'),
 ('Button', 'action', 'Actions', 'ok', '30033:78562', 'button.html',
  '144 variants — the most complete set in the file.'),
 ('Card', 'hold', 'Containers', 'none', '38190:1747', None,
  'The Figma page is called “Cards - missing”. One loose stub, no variants.'),
 ('Checkbox', 'form', 'Form elements', 'ok', '30515:78521', 'checkbox.html',
  'Tokens, states and naming all match Trinity. Nothing outstanding.'),
 ('Chip', 'form', 'Form elements', 'ok', '11268:39456', None,
  'Two sizes, full state set, selectable and removable.'),
 ('Dropdown', 'form', 'Form elements', 'gap', '51689:13501', 'dropdown.html',
  'No focus state on the public set; only one of three sizes is specified.'),
 ('Image block', 'hold', 'Containers', 'ok', '51681:83245', None, 'Five aspect ratios.'),
 ('In-page navigation', 'nav', 'Navigators', 'gap', '57415:5988', None,
  'One component. No variants, no states.'),
 ('Link', 'action', 'Actions', 'none', '—', 'button.html',
  'No component exists. The tokens do. The interim rule is on the Button page.'),
 ('Map', 'hub', 'Hub', 'ok', '56362:17874', None,
  'City, site and continental views, light and dark.'),
 ('Map legends', 'hub', 'Hub', 'ok', '56454:10916', None, 'Fleet map and diagnostics map.'),
 ('Map markers', 'hub', 'Hub', 'ok', '56361:2259', 'truck-phase-tag.html',
  'Phase-coloured. Must always agree with the phase pill.'),
 ('Message (inline)', 'inform', 'Informers', 'ok', '37329:254', None,
  'Four severities, minimal and full layouts.'),
 ('Modal', 'hold', 'Containers', 'gap', '37282:2485', 'modal.html',
  'Only Extra small exists. No header or footer slot spec, no close-affordance spec.'),
 ('Page layout', 'hold', 'Containers', 'ok', '56794:115247', None,
  'Three breakpoints, paired with the seven grid styles.'),
 ('Pagination', 'nav', 'Navigators', 'gap', '56541:7660', None,
  'Orphaned from the table set it belongs to. No states.'),
 ('Popover', 'hold', 'Containers', 'ok', '16794:59241', None,
  'Menu, single select and multi select, with full item states.'),
 ('Progress bar', 'inform', 'Informers', 'gap', '51692:17330', 'progress-bar.html',
  'The track fails contrast in both themes. Variant names now fixed.'),
 ('Radio group', 'form', 'Form elements', 'ok', '30173:78572', 'radio-group.html',
  'Input and item sets with full state coverage.'),
 ('Search', 'form', 'Form elements', 'gap', '56362:18621', 'text-field.html',
  'Eleven suggestion layouts, all filed under default variant names.'),
 ('Segmented control', 'form', 'Form elements', 'gap', '56873:24205', None,
  'Structure exists, the spec does not. Default variant names, one duplicated value.'),
 ('Sensor indicators', 'inform', 'Informers', 'gap', '56539:6813', None,
  'Hub temperature and slump readouts. Variants unnamed.'),
 ('Side navigation', 'nav', 'Navigators', 'gap', '56362:18728', None,
  'The whole cluster is duplicated. Build against 56362, never 57725.'),
 ('Slider', 'form', 'Form elements', 'gap', '53714:4469', 'slider.html',
  'No focus state, no disabled state. Dark mode is otherwise the best specified in the file.'),
 ('Spinner', 'inform', 'Informers', 'gap', '10259:29263', 'spinner.html',
  'Three sizes. Rotation timing is still unspecified.'),
 ('Table', 'hold', 'Containers', 'gap', '63544:2653', 'table.html',
  'Three open conflicts — typeface, icons, selected tint. Selector size now settled at 16.'),
 ('Tabs', 'nav', 'Navigators', 'gap', '39520:6900', 'tabs.html',
  'No rule for what happens past eight tabs.'),
 ('Tag', 'inform', 'Informers', 'gap', '62678:46633', 'tag.html',
  'Colours are per-instance overrides, so contrast is unenforced by design.'),
 ('Text input family', 'form', 'Form elements', 'gap', '51688:14279', 'text-field.html',
  'Nine loose components. All the states live in a private part underneath.'),
 ('Toast', 'inform', 'Informers', 'gap', '39027:356', 'toast.html',
  'A second, cruder set exists on the Hub work. This one is canonical.'),
 ('Toggle', 'form', 'Form elements', 'gap', '35264:124887', 'toggle.html',
  'The only atom in the library with no hover state.'),
 ('Tooltip', 'inform', 'Informers', 'ok', '2620:4152', 'tooltip.html',
  'Fully specified: four positions, placement and flip order, timing, motion, stacking.'),
 ('Top navigation', 'nav', 'Navigators', 'bad', '56362:18642', None,
  'Figma reports the variant properties as invalid. Do not build against it.'),
 ('Truck card V.3', 'hub', 'Hub', 'gap', '56479:4980', None,
  'Unnamed axis, and a version number baked into the component name.'),
 ('Truck phase tag', 'inform', 'Informers', 'gap', '56361:2240', 'truck-phase-tag.html',
  'Exact duplicate set, and the phase names disagree with the tokens.'),
 ('Truck phases module V.3', 'hub', 'Hub', 'gap', '56479:4882', None,
  'Loose component, no variants.'),
 ('Website footer', 'nav', 'Navigators', 'ok', '57415:5618', None, 'Marketing site only.'),
 ('Website navigation', 'nav', 'Navigators', 'ok', '57415:2482', None,
  'Marketing site only. Breakpoints XL–XS.'),
 ('Widgets (eight types)', 'hub', 'Hub', 'ok', '56362:*', None,
  'KPI, Report, Alerts, Notifications, Tickets, Component alarms, Quick action, Phases.'),
]

STATUS_LABEL = {'ok': 'Solid', 'gap': 'Has gaps', 'bad': 'Broken', 'none': 'Missing'}
FAMS = [('all', 'Everything'), ('action', 'Actions'), ('nav', 'Navigators'),
        ('form', 'Form elements'), ('inform', 'Informers'), ('hold', 'Containers'),
        ('hub', 'Hub')]


def c_index():
    counts = {}
    documented = 0
    for _, fam, _, st, _, page, _ in CAT:
        counts[fam] = counts.get(fam, 0) + 1
        counts[st] = counts.get(st, 0) + 1
        if page:
            documented += 1

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
    chips += ('<button class="fchip" data-filter="doc" aria-pressed="false">Has a page'
              '<span class="n">%d</span></button>' % documented)
    chips += '<span class="fcount" id="fcount">%d components</span>' % len(CAT)

    rows = ''
    for name, fam, famlbl, st, node, page, note in CAT:
        nm = ('<a href="%s"><span class="nm">%s</span></a>' % (page, name) if page
              else '<span class="nm">%s</span>' % name)
        rows += ('<tr data-fam="%s" data-status="%s" data-page="%s">'
                 '<td>%s<span class="id">%s</span></td>'
                 '<td>%s</td><td><span class="pill %s">%s</span></td>'
                 '<td class="wrap">%s</td></tr>'
                 % (fam, st, 'doc' if page else '', nm, node, famlbl, st,
                    STATUS_LABEL[st], note))

    body = f"""
<h1>All components.</h1>
<p class="lede">Every component the Trinity library contains, with an honest status on each.
   {len({r[5] for r in CAT if r[5]})} component pages cover {documented} of the {len(CAT)} rows; the
   rest are listed here and say so.</p>

<div class="filters">{chips}</div>
<div class="tw"><table class="cat" id="cat-table">
  <thead><tr><th>Component</th><th>Family</th><th>Status</th><th>What to know</th></tr></thead>
  <tbody>{rows}</tbody>
</table></div>
<p class="catnone" id="catnone" hidden>Nothing matches that filter.</p>

<h2 id="status">What the statuses mean</h2>
{table(['Status', 'Meaning', 'What to do'], [
  ['<span class="pill ok">Solid</span>', 'Variants, states and rules are all present.',
   'Build against it.'],
  ['<span class="pill gap">Has gaps</span>',
   'It works, but something is missing, duplicated or misnamed. The gap is named in the row.',
   'Build against it, and read the gap before relying on the missing part.'],
  ['<span class="pill bad">Broken</span>', 'Figma itself reports the set as structurally invalid.',
   'Do not build against it. Ask Verifi Design.'],
  ['<span class="pill none">Missing</span>', 'No usable component. Tokens or a stub may exist.',
   'Use the written interim rule, and expect it to change.'],
])}

<h2 id="count">How this list is counted</h2>
<p>The Figma file does not carry a number, so here is the arithmetic. Thirty-seven core
   components across five families, plus eight Hub components that ship with the Diagnostic
   Center. Charts (17 sets) and Icons (1,416 components) are counted as <em>libraries</em> rather
   than components, because you pick from them rather than configure them.</p>
<div class="note"><b>The nine text-input types count as one entry.</b> Text Input, Email, Phone,
  Password, Search, Date picker, Dropdown, Language selector and Text Area are nine loose Figma
  components sharing one private field underneath. Treating them as a family is how the design
  behaves, even if it is not how the file is organised.</div>

<h2 id="next">What gets a page next</h2>
<p>Twelve components have full pages today, chosen on one test: can you build a Hub screen
   without it? The next wave is Accordion, Badge, Banner, Card, Chip, Message, Pagination,
   Popover, Search, Segmented control, Side navigation and Tooltip.</p>
<p><a href="../open-items.html">The open items register {ARROW}</a></p>
"""
    return shell('All components',
                 'Every component in the Trinity library, with an honest status on each.',
                 'components/index.html', body, crumb=['Components'],
                 toc=[('status', 'What the statuses mean'), ('count', 'How this is counted'),
                      ('next', 'What gets a page next')])
