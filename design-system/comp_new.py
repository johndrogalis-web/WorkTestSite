#!/usr/bin/env python3
"""Pass two: Progress bar, Spinner, Badge, Tooltip, Tag, Slider, Avatar.

Every value on these pages was read from the Trinity Figma variables and,
where it is a colour pair, measured. Nothing here is designed. Where Figma
defines nothing the page says so under Known gaps rather than inventing a
number and letting it harden into spec.
"""
from core import (cpage, copybar, bench, brow, spec, dodont, checklist,
                  table, snip)

# ── little icons used in the demos ────────────────────────────
ICON_USER = ('<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">'
             '<circle cx="12" cy="8.4" r="3.9" stroke="currentColor" stroke-width="1.9"/>'
             '<path d="M4.6 20.4c0-3.6 3.3-6 7.4-6s7.4 2.4 7.4 6" stroke="currentColor" '
             'stroke-width="1.9" stroke-linecap="round"/></svg>')

ICON_STAR = ('<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">'
             '<path d="M12 3.4l2.6 5.7 6.2.7-4.6 4.2 1.3 6.1L12 17l-5.5 3.1 1.3-6.1L3.2 9.8l6.2-.7z" '
             'stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>')

ICON_FLAG = ('<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
             '<path d="M3.6 14V2.6h8.8l-1.9 3.2 1.9 3.2H3.6" stroke="currentColor" '
             'stroke-width="1.6" stroke-linejoin="round"/></svg>')


def measured(rows):
    """A contrast table. Every number here was computed, not asserted."""
    out = ''
    for pair, a, b, ratio, need, verdict in rows:
        cls = 'ok' if verdict else 'bad'
        out += ('<tr><td>%s</td>'
                '<td class="m"><span class="sw" style="background:%s"></span>%s</td>'
                '<td class="m"><span class="sw" style="background:%s"></span>%s</td>'
                '<td class="m">%s</td><td class="m">%s</td>'
                '<td><span class="pill %s">%s</span></td></tr>'
                % (pair, a, a.upper(), b, b.upper(), ratio, need, cls,
                   'Pass' if verdict else 'Fail'))
    return ('<div class="tw"><table><thead><tr><th>Pair</th><th>Foreground</th>'
            '<th>Background</th><th class="m">Ratio</th><th class="m">Needs</th>'
            '<th>Result</th></tr></thead><tbody>%s</tbody></table></div>' % out)


# ══════════════════════════════════════════════════════════════
#  PROGRESS BAR
# ══════════════════════════════════════════════════════════════
PBAR_HTML = """<div class="t-pbar" role="progressbar" aria-valuenow="75"
     aria-valuemin="0" aria-valuemax="100" aria-label="Upload">
  <i style="width:75%"></i>
</div>"""

PBAR_CSS = """.t-pbar{
  width:100%; max-width:280px; height:8px;
  border-radius:4px; background:var(--pbtrack); overflow:hidden;
}
.t-pbar > i{ display:block; height:100%; border-radius:4px; background:var(--pbfill); }

/* light */ --pbtrack:#DFDEDD; --pbfill:#171614;
/* dark  */ --pbtrack:#666054; --pbfill:#FFFFFF;"""

PBAR_STEPS = [100, 90, 75, 50, 25, 10, 5, 0]


def _pbars():
    out = '<div class="t-stack">'
    for v in PBAR_STEPS:
        out += ('<div class="t-row"><span class="t-lab">%d%%</span>'
                '<div class="t-pbar"><i style="width:%d%%"></i></div></div>' % (v, v))
    return out + '</div>'


def c_progress():
    return cpage(
        'components/progress-bar.html', 'Progress bar',
        'An 8px bar that fills left to right. Eight variants, every one of them named '
        'by the value it shows.',
        'gap', figma='51692:17330', extra_meta=['8 variants', 'Light and dark'],

        note='<div class="note warn"><b>The unfilled track fails contrast in both '
             'themes.</b> <span class="m">#DFDEDD</span> measures 1.16:1 against the '
             'light page and <span class="m">#666054</span> measures 2.64:1 against '
             'the real dark surface. The filled part is fine; it is the empty part '
             'you cannot see. Detail under Accessibility.</div>',

        example=bench(_pbars(), _pbars(),
                      'All eight variants, from full to empty. The 5% and 0% ends are '
                      'the ones worth looking at: at 0% the fill disappears entirely and '
                      'only the track is left, which is exactly the part that fails '
                      'contrast.'),

        anatomy=spec([
            ('Track', 'Full width of its container, <span class="m">8px</span> tall, '
                      '<span class="m">4px</span> radius'),
            ('Fill', 'Same height and radius, width set by the value'),
            ('Height token', '<span class="m">progress bar/height</span> = 8, which is '
                             '<span class="m">size/1</span>'),
            ('Radius token', '<span class="m">progress bar/radius</span> = 4, which is '
                             '<span class="m">radius/sm</span>'),
            ('Label', 'None. The bar carries no text of its own.'),
        ]),

        options=(copybar('Progress bar', 'pbar', '75%', PBAR_HTML, PBAR_CSS) +
                 bench(_pbars(), _pbars()) +
                 '<h3>The eight variants</h3>' +
                 table(['Variant', 'Fill', 'Notes'], [
                     ['<span class="m">progress=100%</span>', '100%', 'Complete'],
                     ['<span class="m">progress=90%</span>', '90%', ''],
                     ['<span class="m">progress=75%</span>', '75%', ''],
                     ['<span class="m">progress=50%</span>', '50%', ''],
                     ['<span class="m">progress=25%</span>', '25%', ''],
                     ['<span class="m">progress=10%</span>', '10%', ''],
                     ['<span class="m">progress=5%</span>', '5%',
                      'The shortest fill the component draws.'],
                     ['<span class="m">progress=0%</span>', '0%',
                      'Nothing but track. See Accessibility.'],
                 ])),

        states=('<p>The component has no states. It is a readout, not a control &mdash; '
                'there is no hover, no focus, no disabled and no error variant.</p>'
                '<div class="note"><b>There is no indeterminate state either.</b> If you '
                'do not know how much work is left, this component cannot say so. Use the '
                '<a href="spinner.html">Spinner</a> until Figma adds one.</div>'),

        behaviour=checklist([
            'The bar fills from the left edge and keeps its <span class="m">4px</span> '
            'radius on the fill as well as the track, so at very low percentages the fill '
            'reads as a short capsule rather than a sliver.',
            'Nothing in Figma defines a transition, so the bar in this documentation '
            'jumps rather than animates. Do not read that as a decision.',
            'There is no minimum visible width. At 0% the fill disappears entirely, which '
            'is what the <span class="m">0%</span> variant shows.',
            'The bar has no intrinsic width. It takes the width of whatever contains it.',
        ]),

        guidelines=dodont(
            ['Put the percentage or a count next to the bar if the number matters. The '
             'bar cannot say it.',
             'Use it when you know the total amount of work.',
             'Give it a sensible maximum width. A progress bar stretched across a '
             '1600px screen is hard to read.'],
            ['Do not use it for an unknown duration. That is a spinner.',
             'Do not colour the fill to signal success or failure. No such tokens exist.',
             'Do not build a striped or animated variant. Neither is in the system.',
             'Do not rely on the track being visible. Today it is not.']),

        specs=spec([
            ('Height', '<span class="m">8px</span>'),
            ('Radius', '<span class="m">4px</span>'),
            ('Track, light', '<span class="m">#DFDEDD</span>'),
            ('Fill, light', '<span class="m">#171614</span>'),
            ('Track, dark', '<span class="m">#666054</span>'),
            ('Fill, dark', '<span class="m">#FFFFFF</span>'),
        ]),

        a11y=('<p>WCAG 1.4.11 asks for 3:1 between a graphical object and what sits '
              'behind it, when you need to see that object to understand the control. '
              'For a progress bar that means the track, because the track is what tells '
              'you how much is left.</p>' +
              measured([
                  ('Fill on track, light', '#171614', '#dfdedd', '13.46:1', '3:1', True),
                  ('Track on page, light', '#dfdedd', '#f0eeea', '1.16:1', '3:1', False),
                  ('Track on white card', '#dfdedd', '#ffffff', '1.34:1', '3:1', False),
                  ('Fill on track, dark', '#ffffff', '#666054', '6.24:1', '3:1', True),
                  ('Track on demo black', '#666054', '#000000', '3.37:1', '3:1', True),
                  ('Track on product dark', '#666054', '#211f1c', '2.64:1', '3:1', False),
              ]) +
              '<div class="note warn"><b>The dark track passes in Figma and fails in the '
              'product.</b> The Figma demonstration frame sits on pure black, where the '
              'track reaches 3.37:1. The product surface is <span class="m">#211F1C</span>, '
              'where the same colour reaches 2.64:1. The value was chosen against the '
              'wrong background.</div>' +
              checklist([
                  'Give the element <span class="m">role="progressbar"</span> with '
                  '<span class="m">aria-valuenow</span>, <span class="m">aria-valuemin</span> '
                  'and <span class="m">aria-valuemax</span>.',
                  'Give it an <span class="m">aria-label</span> saying what is progressing. '
                  '&ldquo;75%&rdquo; on its own tells a screen reader nothing.',
                  'If the bar is the only indication that something is happening, put the '
                  'same information in text as well.',
              ])),

        gaps=('<div class="note ok"><b>One question already closed.</b> The two variants '
              'that used to be called <span class="m">progress7</span> and '
              '<span class="m">progress8</span> have been renamed to '
              '<span class="m">5%</span> and <span class="m">0%</span> in Figma.</div>' +
              checklist([
            '<b>The track fails contrast in both themes.</b> One token change fixes it here '
            'and on <a href="slider.html">Slider</a>, which has the same problem.',
            '<b>No label or value text.</b> The component has no way to display its own '
            'number.',
            '<b>No indeterminate state</b>, so unknown-duration work has nowhere to go.',
            '<b>No status colours.</b> There is no success, warning or error fill.',
            '<b>No size scale.</b> One 8px height, everywhere.',
            '<b>No transition, easing or duration</b> is specified.',
            '<b>The light and dark demonstration frame is named &ldquo;Brand core '
            'palette&rdquo;</b> in the Figma layer tree rather than after this component.',
              ])),
    )


# ══════════════════════════════════════════════════════════════
#  SPINNER
# ══════════════════════════════════════════════════════════════
SPIN_SVG = ('<svg viewBox="0 0 24 24" aria-hidden="true">'
            '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" '
            'stroke-width="2.4" stroke-linecap="round" stroke-dasharray="52 11"/>'
            '</svg>')

SPIN_HTML = """<span class="t-spin md" role="status" aria-label="Loading">
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor"
            stroke-width="2.4" stroke-linecap="round" stroke-dasharray="52 11"/>
  </svg>
</span>"""

SPIN_CSS = """.t-spin{
  display:inline-block; color:var(--spin);
  animation:t-rot .9s linear infinite;
}
.t-spin > svg{ width:100%; height:100%; display:block; }
.t-spin.lg{ width:40px; height:40px; }
.t-spin.md{ width:24px; height:24px; }
.t-spin.sm{ width:16px; height:16px; }
@keyframes t-rot{ to{ transform:rotate(360deg); } }

/* Reduced motion: slowed, not stopped. A stopped spinner says nothing. */
@media (prefers-reduced-motion:reduce){ .t-spin{ animation-duration:2.4s; } }

/* light */ --spin:#171614;
/* dark  */ --spin:#FFFFFF;

/* The Figma component is an arc shape, so its thickness lives in the
   vector rather than in a token. The duration above is this site's
   placeholder; Figma does not specify one. */"""


def _spins():
    out = '<div class="t-row">'
    for cls, label in (('lg', '40'), ('md', '24'), ('sm', '16')):
        out += ('<span class="t-lab">%s</span>'
                '<span class="t-spin %s">%s</span>' % (label, cls, SPIN_SVG))
    return out + '</div>'


def c_spinner():
    return cpage(
        'components/spinner.html', 'Spinner',
        'A rotating arc for work whose duration you cannot predict. Three sizes, one '
        'colour per theme, and nothing else defined.',
        'gap', figma='10259:29263', extra_meta=['3 sizes', 'Light and dark'],

        note='<div class="note"><b>It is an arc, not a stroked circle.</b> Confirmed by '
             'Verifi Design: the component is a vector arc shape, so its thickness lives '
             'in the geometry rather than in a stroke token, and there is no separate '
             'track ring behind it. Nothing here fills with progress &mdash; it is a '
             'spinner and only a spinner. The rotation timing on this page is still a '
             'placeholder, because Figma does not specify one.</div>',

        example=bench(_spins(), _spins(),
                      'Large 40, Medium 24, Small 16. The colour flips between themes; '
                      'nothing else changes.'),

        anatomy=spec([
            ('Form', 'An arc shape with a gap. The gap is what makes the rotation visible. '
                     'It is drawn as a shape, not as a stroke on a circle, so there is no '
                     'stroke-width token to look for.'),
            ('Track', 'None. There is no ring behind the arc, by design.'),
            ('Large', '<span class="m">40 &times; 40</span>, token '
                      '<span class="m">spinner/large</span>'),
            ('Medium', '<span class="m">24 &times; 24</span>, token '
                       '<span class="m">spinner/medium</span>'),
            ('Small', '<span class="m">16 &times; 16</span>, token '
                      '<span class="m">spinner/small</span>'),
            ('Colour', 'One token, <span class="m">spinner/fill</span>, flipped per theme'),
        ]),

        options=(copybar('Spinner', 'spin', '3 sizes', SPIN_HTML, SPIN_CSS) +
                 bench(_spins(), _spins()) +
                 '<h3>Choosing a size</h3>' +
                 table(['Size', 'Pixels', 'Where it belongs'], [
                     ['Large', '<span class="m">40</span>',
                      'A whole page or a whole panel is waiting.'],
                     ['Medium', '<span class="m">24</span>',
                      'A card, a section, a modal body.'],
                     ['Small', '<span class="m">16</span>',
                      'Inside a button or beside a line of text.'],
                 ])),

        states=('<p>A spinner has one state: spinning. There is no paused, no error and '
                'no success variant, so whatever replaces the spinner when the work ends '
                'is a separate decision the system does not make for you.</p>'),

        behaviour=checklist([
            'Use a spinner when you do not know how long the work will take. If you do '
            'know, use the <a href="progress-bar.html">Progress bar</a>.',
            'Put the spinner where the result will appear, not somewhere else on the page. '
            'It marks the thing that is loading.',
            'For work that finishes in under about half a second, show nothing. A spinner '
            'that flashes on and off reads as a glitch.',
            'Keep one spinner per waiting region. Four spinners on one screen is a stalled '
            'page, not a loading page.',
        ]),

        guidelines=dodont(
            ['Pair the spinner with a short line of text when the wait may be long.',
             'Match the size to the area that is waiting.',
             'Reserve the space the result will occupy, so nothing jumps when it arrives.'],
            ['Do not use a spinner for a known-length operation.',
             'Do not stack a spinner on top of content the person can still read.',
             'Do not invent a colour for it. There is one token per theme.',
             'Do not let it spin forever. Decide what a timeout looks like.']),

        specs=spec([
            ('Sizes', '<span class="m">40 / 24 / 16</span>'),
            ('Colour, light', '<span class="m">#171614</span>'),
            ('Colour, dark', '<span class="m">#FFFFFF</span>'),
            ('Stroke width', 'Not applicable &mdash; the arc is a shape, not a stroke'),
            ('Track ring', 'None, by design'),
            ('Duration', 'Not specified in Figma'),
        ]),

        a11y=('<p>The spinner passes contrast comfortably in both themes &mdash; '
              '18.08:1 in light and 16.44:1 in dark against the product surfaces. The '
              'accessibility work here is about motion and announcement, not colour.</p>' +
              checklist([
                  'Give it <span class="m">role="status"</span> and an '
                  '<span class="m">aria-label</span>, or put visible text beside it.',
                  'Announce the end of loading as well as the start. A screen reader user '
                  'who hears &ldquo;Loading&rdquo; and then silence does not know it '
                  'finished.',
                  'Respect <span class="m">prefers-reduced-motion</span>. This page slows '
                  'the rotation rather than stopping it, because a frozen spinner reads as '
                  'a broken page.',
                  'Do not rely on the spinner alone to explain a long wait. After a few '
                  'seconds, words help more than motion.',
              ])),

        gaps=('<div class="note ok"><b>Two earlier questions are now closed.</b> There is '
              'no stroke-width token because the arc is a shape rather than a stroke, and '
              'there is deliberately no track ring behind it. Both confirmed by Verifi '
              'Design.</div>' +
              checklist([
                  '<b>No rotation duration, easing or direction.</b> This is the one that '
                  'still blocks a faithful build &mdash; two teams will pick two speeds.',
                  '<b>No reduced-motion alternative</b> is specified. This page slows the '
                  'rotation rather than stopping it, which is a site decision, not spec.',
                  '<b>No rule for spinner versus progress bar</b>, and no rule for how long '
                  'to wait before showing either.',
                  '<b>Both demonstration frames are named &ldquo;Brand core palette&rdquo;'
                  '</b> in the Figma layer tree rather than after this component.',
              ])),
    )


# ══════════════════════════════════════════════════════════════
#  BADGE
# ══════════════════════════════════════════════════════════════
BADGE_HTML = """<span class="t-badge num">99+</span>
<span class="t-badge alt">NEW</span>
<span class="t-badge out">NEW</span>
<span class="t-badge err">NEW</span>

<span class="t-dot" role="img" aria-label="Unread"></span>"""

BADGE_CSS = """.t-badge{
  display:inline-flex; align-items:center; justify-content:center;
  height:20px; padding:0 8px; border-radius:16px;
  font-size:12px; line-height:1; font-weight:500;
  background:var(--bdgd); color:var(--bdgtx);
}
.t-badge.num{ max-width:40px; overflow:hidden; }   /* fits "99+" */
.t-badge.alt{ background:var(--bdga); }
.t-badge.out{ background:var(--bdgo); box-shadow:inset 0 0 0 1px var(--bdgob); }
.t-badge.err{ background:var(--bdgebg); color:var(--bdgetx); }

.t-dot{ display:inline-block; width:8px; height:8px; border-radius:16px;
        background:var(--dotd); }
.t-dot.info{ background:var(--doti); }
.t-dot.err { background:var(--dote); }

/* light */ --bdgd:#E3F200; --bdga:#C5E4FB; --bdgo:#FFFFFF; --bdgob:#41A8F2;
            --bdgtx:#171614; --bdgebg:#B00100; --bdgetx:#FFFFFF;
            --dotd:#E3F200; --doti:#41A8F2; --dote:#B00100;
/* dark  */ --bdgd:#E3F200; --bdga:#C5E4FB; --bdgo:#FFFFFF; --bdgob:#41A8F2;
            --bdgtx:#171614; --bdgebg:#EFADAC; --bdgetx:#171614;
            --dotd:#E3F200; --doti:#41A8F2; --dote:#EFADAC;"""

BADGE_STYLES = [('', 'Default'), ('alt', 'Alternate'), ('out', 'Outline'), ('err', 'Error')]


def _badges(kind):
    out = '<div class="t-stack">'
    for cls, label in BADGE_STYLES:
        c = ('t-badge ' + cls).strip()
        if kind == 'num':
            body = '<span class="%s num">99+</span>' % c
        else:
            body = '<span class="%s">NEW</span>' % c
        out += '<div class="t-row"><span class="t-lab">%s</span>%s</div>' % (label, body)
    return out + '</div>'


def _dots():
    out = '<div class="t-stack">'
    for cls, label in (('', 'Default'), ('info', 'Information'), ('err', 'Error')):
        out += ('<div class="t-row"><span class="t-lab">%s</span>'
                '<span class="t-dot %s"></span></div>' % (label, cls))
    return out + '</div>'


def c_badge():
    return cpage(
        'components/badge.html', 'Badge',
        'A small chip carrying a count, a word, or nothing at all. Three content types, '
        'four styles, and one of the three types is close to invisible in light mode.',
        'gap', figma='60895:44879',
        extra_meta=['3 content types', '4 styles', 'Light and dark'],

        note='<div class="note stop"><b>The dot is unreadable on a light page.</b> '
             'Two of the three dot colours measure under 2.3:1 against the light surface, '
             'and a dot has no text inside it to fall back on. Full numbers under '
             'Accessibility. This is the most serious defect in the pass-two set.</div>',

        example=bench(_badges('text'), _badges('text'),
                      'Only the Error style changes between themes, and that is deliberate: '
                      'the light red would sit at 2.23:1 against the dark surface. The other '
                      'three keep one background in both modes.'),

        anatomy=spec([
            ('Shape', '<span class="m">16px</span> radius, <span class="m">20px</span> tall'),
            ('Padding', '<span class="m">8px</span> left and right, '
                        '<span class="m">4px</span> top and bottom'),
            ('Type', 'ABC Repro Medium <span class="m">12px</span>'),
            ('Number width', 'Capped at <span class="m">40px</span>, sized for '
                             '&ldquo;99+&rdquo;'),
            ('Text width', 'Uncapped. A separate variant exists purely so the number '
                           'keeps its cap.'),
            ('Dot', '<span class="m">8 &times; 8</span>, same 16px radius, no text'),
        ]),

        options=(copybar('Badge', 'badge', '4 styles + dot', BADGE_HTML, BADGE_CSS) +
                 '<h3>Number</h3>' +
                 bench(_badges('num'), _badges('num')) +
                 '<h3>Text</h3>' +
                 bench(_badges('text'), _badges('text')) +
                 '<h3>Dot</h3>' +
                 bench(_dots(), _dots(),
                       'Three dot colours. In light mode two of them barely exist.') +
                 '<h3>The four display styles</h3>' +
                 table(['Style', 'Light', 'Dark', 'Changes with theme'], [
                     ['Default',
                      '<span class="m"><span class="sw" style="background:#e3f200"></span>'
                      '#E3F200</span>',
                      '<span class="m"><span class="sw" style="background:#e3f200"></span>'
                      '#E3F200</span>', 'No'],
                     ['Alternate',
                      '<span class="m"><span class="sw" style="background:#c5e4fb"></span>'
                      '#C5E4FB</span>',
                      '<span class="m"><span class="sw" style="background:#c5e4fb"></span>'
                      '#C5E4FB</span>', 'No'],
                     ['Outline',
                      '<span class="m"><span class="sw" style="background:#ffffff"></span>'
                      '#FFFFFF + #41A8F2</span>',
                      '<span class="m"><span class="sw" style="background:#ffffff"></span>'
                      '#FFFFFF + #41A8F2</span>', 'No'],
                     ['Error',
                      '<span class="m"><span class="sw" style="background:#b00100"></span>'
                      '#B00100</span>',
                      '<span class="m"><span class="sw" style="background:#efadac"></span>'
                      '#EFADAC</span>', '<b>Yes</b>'],
                 ])),

        states=('<p>Badges have no interactive states, and that is the definition rather '
                'than an omission.</p>'
                '<div class="note ok"><b>A badge has no interactions. A chip does.</b> '
                'Verifi Design&rsquo;s rule: a badge is a displayed item that reports the '
                'current state of something and nothing more. The moment it can be clicked, '
                'hovered, selected or dismissed, it is a chip and belongs to that component '
                'instead. That single test decides which one you want, and it is the reason '
                'no hover, focus or pressed state will ever be added here.</div>'),

        behaviour=checklist([
            'The number badge caps at <span class="m">40px</span>, which fits three '
            'characters. Anything above 99 is written &ldquo;99+&rdquo;.',
            'The text badge has no width cap at all, by deliberate choice &mdash; the '
            'designer split it into its own variant so the number could keep its cap.',
            '<b>Only Error changes between themes, for a measured reason.</b> The light '
            'error chip <span class="m">#B00100</span> reaches only 2.23:1 against the dark '
            'surface, so it flips to <span class="m">#EFADAC</span> at 8.80:1. The other '
            'three backgrounds are light enough to work in both modes and do not change.',
            'The dot carries meaning by colour alone. Nothing else about it varies.',
        ]),

        guidelines=dodont(
            ['Write the number. A dot says something happened; a number says how much.',
             'Use Error for counts that need action, not for counts that are merely high.',
             'Keep one badge per object. Two badges on one row is a layout problem, not a '
             'status problem.'],
            ['Do not make a badge clickable, hoverable or dismissible. That is a chip.',
             'Do not use the dot as the only signal for anything important in light mode '
             'until its contrast is fixed.',
             'Do not invent a success or warning style. Neither exists.',
             'Do not use Outline on a dark surface expecting it to adapt. It does not.',
             'Do not put a badge on something that is not countable or not a status.']),

        specs=spec([
            ('Height', '<span class="m">20px</span>'),
            ('Radius', '<span class="m">16px</span>'),
            ('Padding', '<span class="m">4px 8px</span>'),
            ('Type', '<span class="m">ABC Repro Medium 12px</span>'),
            ('Border', '<span class="m">1px</span>, Outline style only'),
            ('Dot size', '<span class="m">8 &times; 8</span>'),
            ('Number max width', '<span class="m">40px</span>'),
        ]),

        a11y=('<p>The text inside every badge is comfortably readable. The failures are '
              'all about shapes that have no text in them: the dot, and the outline '
              'badge&rsquo;s border.</p>' +
              measured([
                  ('Default text on chip', '#171614', '#e3f200', '14.61:1', '4.5:1', True),
                  ('Alternate text on chip', '#171614', '#c5e4fb', '13.66:1', '4.5:1', True),
                  ('Outline text on chip', '#171614', '#ffffff', '18.08:1', '4.5:1', True),
                  ('Error text, light', '#ffffff', '#b00100', '7.37:1', '4.5:1', True),
                  ('Error text, dark', '#171614', '#efadac', '9.68:1', '4.5:1', True),
                  ('Outline border on chip', '#41a8f2', '#ffffff', '2.59:1', '3:1', False),
                  ('Default dot on light page', '#e3f200', '#f0eeea', '1.07:1', '3:1', False),
                  ('Information dot on light page', '#41a8f2', '#f0eeea', '2.24:1', '3:1', False),
                  ('Error dot on light page', '#b00100', '#f0eeea', '6.36:1', '3:1', True),
                  ('Default dot on dark page', '#e3f200', '#211f1c', '13.28:1', '3:1', True),
                  ('Information dot on dark page', '#41a8f2', '#211f1c', '6.35:1', '3:1', True),
                  ('Error dot on dark page', '#efadac', '#211f1c', '8.80:1', '3:1', True),
              ]) +
              '<div class="note warn"><b>One honest caveat about those dot numbers.</b> '
              'WCAG 2.x measures luminance only and discards hue, which is unkind to '
              'saturated yellows and greens &mdash; the Default dot looks more visible to '
              'most eyes than 1.07:1 suggests. The reason it still matters is that hue is '
              'the <em>only</em> thing carrying it. Reduced colour vision, a dimmed screen '
              'or sunlight on a tablet all take that away, and a colour-only signal fails '
              '1.4.1 regardless of the ratio.</div>' +
              '<div class="note ok"><b>The cheap fix.</b> A <span class="m">1px</span> ring '
              'in the page ink keeps the brand colour and gives the dot an edge in both '
              'themes: <span class="t-dot ringed" style="vertical-align:middle"></span> '
              'Proposed here, not yet in Figma.</div>' +
              checklist([
                  'A badge that changes on its own needs <span class="m">aria-live="polite"'
                  '</span> on its container, or the change is silent.',
                  'A dot needs <span class="m">role="img"</span> and a label. '
                  '&ldquo;Unread&rdquo; is a label; a bare <span class="m">&lt;span&gt;</span> '
                  'is not.',
                  'Write the count into the accessible name: &ldquo;Notifications, 12 '
                  'unread&rdquo;, not &ldquo;12&rdquo;.',
                  'Never let colour alone distinguish Error from Default. The word or the '
                  'number has to do it.',
              ])),

        gaps=('<div class="note ok"><b>Three questions closed.</b> The Error style changes '
              'between themes on purpose, for contrast. The dot style names will be renamed to '
              'match the display names. And a badge is defined by having no interactions &mdash; '
              'anything interactive is a chip.</div>' +
              checklist([
            '<b>Two of three dot colours fail contrast in light mode</b>, and the dot has '
            'no text to fall back on.',
            '<b>The Outline border fails at 2.59:1</b>, below the 3:1 for a boundary that '
            'defines the control.',
            '<b>The Default background is still bound to '
            '<span class="m">badge/dot/fill/default</span></b> &mdash; a dot token reused for '
            'the chip. Verifi Design is checking that variable.',
            '<b>The dot names will be brought in line with the display names.</b> Agreed, not '
            'yet done, and the component structure is the reason the two drifted apart.',
            '<b>Dot has no Outline variant; display has no Information variant.</b>',
            '<b>No success or warning style.</b> Verifi Design&rsquo;s leaning is one '
            'reusable badge whose colour can be set, rather than a growing list of named '
            'styles &mdash; which makes the colour-pair problem on '
            '<a href="tag.html">Tag</a> worth solving first, since it would arrive here too.',
            '<b>The 20px height and 4px padding only work at line-height 1</b>, but the '
            'type token says 1.3. One of the two is wrong.',
            '<b>No placement rule</b> &mdash; anchored to an icon, inline with text, in a '
            'tab header. All undefined.',
            '<b>Outline border still measures 2.59:1</b>, below the 3:1 a boundary needs. '
            'Unanswered.',
            '<b>Still no stated relationship to <a href="truck-phase-tag.html">Truck phase '
            'tag</a></b>. Both are non-interactive status displays, so the badge-versus-chip '
            'test does not separate them; something else has to.',
              ])),
    )


# ══════════════════════════════════════════════════════════════
#  TOOLTIP
# ══════════════════════════════════════════════════════════════
TIP_HTML = """<span class="t-tip above" role="tooltip" id="tip-1">Tooltip</span>

<!-- the trigger owns the relationship -->
<button aria-describedby="tip-1">Help</button>"""

TIP_CSS = """.t-tip{
  position:relative; display:inline-flex; align-items:center;
  height:24px; padding:0 8px; border-radius:4px;
  background:var(--ttbg); color:var(--tttx);
  font-size:12px; line-height:1; white-space:nowrap;
}
.t-tip::after{ content:""; position:absolute; border:5px solid transparent; }
.t-tip.above::after{ top:100%; left:16px; border-top-color:var(--ttbg); border-bottom:0; }
.t-tip.below::after{ bottom:100%; left:16px; border-bottom-color:var(--ttbg); border-top:0; }
.t-tip.left::after { left:100%; top:50%; margin-top:-5px;
                     border-left-color:var(--ttbg); border-right:0; }
.t-tip.right::after{ right:100%; top:50%; margin-top:-5px;
                     border-right-color:var(--ttbg); border-left:0; }

/* light */ --ttbg:#171614; --tttx:#FFFFFF;
/* dark  */ --ttbg:#FFFFFF; --tttx:#211F1C;"""

TIP_POS = [('above', 'Above'), ('left', 'Left'), ('below', 'Below'), ('right', 'Right')]


def _tips():
    out = '<div class="t-row top" style="gap:26px;padding:10px 0">'
    for cls, label in TIP_POS:
        out += ('<div class="brow"><span class="bl">%s</span>'
                '<span class="t-tip %s">Tooltip</span></div>' % (label, cls))
    return out + '</div>'


def c_tooltip():
    return cpage(
        'components/tooltip.html', 'Tooltip',
        'A short label that appears next to whatever you are pointing at. Four arrow '
        'positions, a box that hugs its text in both directions, and no width limit.',
        'gap', figma='2620:4152', extra_meta=['4 positions', 'One height'],

        note='<div class="note"><b>Figma defines the box; this page defines the '
             'behaviour.</b> The file gives fill, text, padding, radius and four arrow '
             'positions, and stops there. A tooltip is almost entirely behaviour, so Verifi '
             'Design has asked that the Behaviour and Accessibility sections below follow '
             'established UX practice rather than sit empty. Those rules are the house '
             'convention and are binding for new work; they are marked where they go beyond '
             'what Figma says.</div>',

        example=bench(_tips(), _tips(),
                      'The variant name describes where the tooltip sits, so '
                      '&ldquo;Above&rdquo; puts the arrow underneath it.'),

        anatomy=spec([
            ('Width', 'Hug &mdash; the box is as wide as its text, with no maximum'),
            ('Height', 'Hug &mdash; <span class="m">24px</span> is what one line of 12/1.3 '
                       'plus <span class="m">8px</span> padding comes to, not a cap'),
            ('Padding', '<span class="m">8px</span>'),
            ('Radius', '<span class="m">4px</span>'),
            ('Fill', '<span class="m">#171614</span> light, '
                     '<span class="m">#FFFFFF</span> dark'),
            ('Text', 'ABC Repro Regular <span class="m">12px</span> &mdash; '
                     '<span class="m">#FFFFFF</span> light, '
                     '<span class="m">#211F1C</span> dark'),
            ('Arrow', 'Drawn on all four variants. No size or offset token.'),
        ]),

        options=(copybar('Tooltip', 'tip', '4 positions', TIP_HTML, TIP_CSS) +
                 bench(_tips(), _tips()) +
                 '<h3>The four positions</h3>' +
                 table(['Variant', 'Tooltip sits', 'Arrow points'], [
                     ['<span class="m">position=Above</span>', 'Above the trigger', 'Down'],
                     ['<span class="m">position=Below</span>', 'Below the trigger', 'Up'],
                     ['<span class="m">position=Left</span>', 'Left of the trigger', 'Right'],
                     ['<span class="m">position=Right</span>', 'Right of the trigger', 'Left'],
                 ]) +
                 '<div class="note warn"><b>Both axes are set to Hug, so nothing stops the '
                 'box growing.</b> The <span class="m">56 &times; 24</span> you see in Figma '
                 'is simply what the word &ldquo;Tooltip&rdquo; measures. Give it a sentence '
                 'and you get a single line as wide as that sentence, running off the side of '
                 'the screen. A maximum width is the missing constraint, not a maximum '
                 'height.</div>'),

        states=('<p>There is one state: visible. Figma does not describe how the tooltip '
                'gets there or how it leaves, so appearance, disappearance and everything '
                'in between is currently up to whoever builds it.</p>'),

        behaviour=('<div class="note ok"><b>These are rules, not suggestions.</b> Figma '
                   'does not specify tooltip behaviour, so Verifi Design has adopted '
                   'established UX practice as the house convention. Build to this.</div>' +
                   checklist([
                       '<b>A tooltip supplements, never carries.</b> If the person cannot '
                       'finish the task without reading it, the text belongs on the page.',
                       '<b>Open after 500ms on hover, immediately on keyboard focus.</b> '
                       'The delay stops tooltips firing as the pointer crosses a toolbar; '
                       'focus has no such problem, so it gets no delay.',
                       '<b>Close after 100ms, and stay open while the pointer is inside '
                       'the tooltip itself.</b> That short grace period is what lets '
                       'someone move onto the tooltip to read it.',
                       '<b>Escape dismisses it, and it never takes focus.</b> Focus stays '
                       'on the trigger throughout.',
                       '<b>One trigger open at a time.</b> Moving between two triggers '
                       'swaps immediately rather than re-running the 500ms delay.',
                   ]) +
                   '<h3>Touch, and the missing width cap</h3>' +
                   '<p>Two things the convention cannot fix on its own.</p>' +
                   checklist([
                       '<b>Hover does not exist on a phone.</b> Do not ship a pattern where '
                       'a tooltip is the only route to the information. Either the label is '
                       'visible at small widths, or the trigger becomes a tap target that '
                       'opens a popover.',
                       '<b>Set a maximum width and let it wrap.</b> The box hugs its '
                       'content on both axes, so without a cap a long tooltip becomes one '
                       'enormous line. The house convention is <span class="m">280px</span>, '
                       'after which the text wraps and the box grows downward &mdash; which '
                       'the Hug height already allows, so nothing in the file has to change '
                       'for this to work.',
                   ])),

        guidelines=dodont(
            ['Keep it short. Nothing in the file stops a long tooltip becoming one very wide line.',
             'Attach it to something that is already focusable.',
             'Use it for a name or a short clarification.'],
            ['Do not put essential instructions in a tooltip.',
             'Do not put a link or a button inside one.',
             'Do not use it as a substitute for a visible label on an icon-only control.',
             'Do not rely on it existing on touch devices.']),

        specs=spec([
            ('Width', 'Hug, no maximum in Figma'),
            ('Height', 'Hug &mdash; <span class="m">24px</span> at one line'),
            ('Padding', '<span class="m">8px</span>'),
            ('Radius', '<span class="m">4px</span>'),
            ('Fill, light / dark', '<span class="m">#171614 / #FFFFFF</span>'),
            ('Text, light / dark', '<span class="m">#FFFFFF / #211F1C</span>'),
            ('Contrast, light / dark', '<span class="m">18.08:1 / 16.44:1</span>'),
            ('Show delay', '<span class="m">500ms</span> on hover, none on focus'),
            ('Hide delay', '<span class="m">100ms</span>'),
        ]),

        a11y=('<p>Both themes clear the requirement with room to spare: white on '
              '<span class="m">#171614</span> measures 18.08:1 in light, and '
              '<span class="m">#211F1C</span> on white measures 16.44:1 in dark.</p>' +
              checklist([
                  'Use <span class="m">aria-describedby</span> on the trigger pointing at '
                  'the tooltip, not <span class="m">aria-label</span>, which would replace '
                  'the trigger&rsquo;s own name.',
                  'The tooltip must be reachable by keyboard. Hover-only is a failure of '
                  'WCAG 2.1.1.',
                  'Content that appears on hover must be dismissible, hoverable and '
                  'persistent &mdash; WCAG 1.4.13. None of the three is specified here.',
                  'Never put the only copy of important information inside a tooltip.',
              ])),

        gaps=('<div class="note ok"><b>Two questions closed.</b> Dark mode is specified '
              'after all &mdash; the tooltip inverts to a white fill with '
              '<span class="m">#211F1C</span> text. And behaviour is settled by adopting UX '
              'best practice as the house convention, written up under Behaviour above.</div>' +
              checklist([
                  '<b>No maximum width.</b> Width is set to Hug, so the box grows with the '
                  'text and a long string produces one very wide line. This is the single '
                  'most important thing to add. The height is Hug too, so it can already '
                  'wrap the moment a width cap exists.',
                  '<b>No arrow size or offset token.</b>',
                  '<b>No transition</b> is specified. The delays above are timing, not '
                  'animation.',
                  '<b>No stated relationship to the help text</b> already used under form '
                  'fields, which solves a neighbouring problem.',
              ])),
    )


# ══════════════════════════════════════════════════════════════
#  TAG
# ══════════════════════════════════════════════════════════════
TAG_HTML = """<span class="t-tag">%s<span>Tag Label</span></span>
<span class="t-tag diag">%s<span>Tag Label</span></span>
<span class="t-tag solid">%s<span>Tag Label</span></span>""" % (
    ICON_FLAG, ICON_FLAG, ICON_FLAG)

TAG_CSS = """.t-tag{
  position:relative; display:inline-flex; align-items:center; gap:4px;
  height:20px; padding:0 4px; border-radius:4px;
  max-width:100px; overflow:hidden;
  font-size:12px; line-height:1;
  background:var(--tagbg); color:var(--tagtx);
}
.t-tag > span{ position:relative; z-index:1;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.t-tag > svg { position:relative; z-index:1; width:12px; height:12px; flex:none; }

.t-tag.diag::before, .t-tag.solid::before{
  content:""; position:absolute; inset:0;
}
.t-tag.diag::before{  background:repeating-linear-gradient(135deg,
  var(--tagdo) 0 2.6px, transparent 2.6px 5px); }
.t-tag.solid::before{ background:repeating-linear-gradient(135deg,
  var(--tagds) 0 2.6px, transparent 2.6px 5px); }

/* light */ --tagbg:#0975C3; --tagtx:#FFFFFF; --tagdo:#1D57AF; --tagds:#1F5B8D;
/* dark  */ --tagbg:#C5E4FB; --tagtx:#211F1C; --tagdo:#BADFF9; --tagds:#3698EC;

/* Stripes run bottom-left to top-right, 3.7px wide on a 7.1px horizontal
   pitch. Fill, text AND diagonal are all overridable per instance. */"""

TAG_ROWS = [
    ('', True, 'Icon + overlay', 'diag'),
    ('', True, 'Icon + solid', 'solid'),
    ('', True, 'Icon only', ''),
    ('', False, 'Overlay only', 'diag'),
    ('', False, 'Solid only', 'solid'),
    ('', False, 'All off', ''),
]


def _tags():
    out = '<div class="t-stack">'
    for _, icon, label, cls in TAG_ROWS:
        inner = (ICON_FLAG if icon else '') + '<span>Tag Label</span>'
        out += ('<div class="t-row"><span class="t-lab" style="min-width:104px">%s</span>'
                '<span class="t-tag %s">%s</span></div>' % (label, cls, inner))
    return out + '</div>'


def c_tag():
    return cpage(
        'components/tag.html', 'Tag',
        'A small labelled chip with an optional icon and an optional diagonal pattern. '
        'The colours are designed to be replaced per instance, which is the interesting '
        'part and also the problem.',
        'gap', figma='62678:46633', extra_meta=['6 combinations', 'Light and dark'],

        note='<div class="note warn"><b>This component has no fixed palette, and that '
             'goes further than the fill.</b> The Figma documentation says the fill and the '
             'label colour are changed per instance using selection colours, and the '
             'diagonal lines can be recoloured too. The solid diagonal is bound to no '
             'variable at all. So no approved colour set exists and every tag anyone makes '
             'is an unchecked contrast risk. The values on this page were measured from the '
             'Figma documentation frame pixel by pixel, because there was nothing else to '
             'read them from. See Accessibility.</div>',

        example=bench(_tags(), _tags(),
                      'Icon and diagonal pattern toggle independently. The diagonal comes '
                      'in a 35% overlay and a solid form.'),

        anatomy=spec([
            ('Height', '<span class="m">20px</span>'),
            ('Radius', '<span class="m">4px</span>'),
            ('Padding', '<span class="m">4px</span> all round'),
            ('Gap', '<span class="m">4px</span> between icon and label'),
            ('Max width', '<span class="m">100px</span>'),
            ('Type', 'ABC Repro Regular <span class="m">12px</span>'),
            ('Diagonal', 'Stripes running bottom-left to top-right, '
                         '<span class="m">3.7px</span> wide on a '
                         '<span class="m">7.1px</span> horizontal pitch'),
            ('Diagonal colour', 'Overlay is a softened tint of the fill; solid is a '
                                'stronger one. Both are per-instance, not tokenised.'),
        ]),

        options=(copybar('Tag', 'tag', '6 combinations', TAG_HTML, TAG_CSS) +
                 bench(_tags(), _tags()) +
                 '<h3>The six combinations</h3>' +
                 table(['Combination', 'Icon', 'Diagonal'], [
                     ['Icon and diagonal overlay', 'On', 'Overlay at 35%'],
                     ['Icon and diagonal solid', 'On', 'Solid'],
                     ['Icon only', 'On', 'Off'],
                     ['Diagonal overlay only', 'Off', 'Overlay at 35%'],
                     ['Diagonal solid only', 'Off', 'Solid'],
                     ['All off', 'Off', 'Off'],
                 ])),

        states=('<p>No interactive states are defined. Whether a tag can be clicked, '
                'selected or removed is not answered anywhere in the file, so treat it as '
                'a label until someone says otherwise.</p>'),

        behaviour=checklist([
            'The icon and the diagonal are independent toggles, so all six combinations '
            'are legitimate.',
            'The diagonal has two forms because the overlay is sometimes too subtle. Which '
            'one to use, and what either of them means, is not written down.',
            'The solid form runs straight across the label. Until the file says otherwise, '
            'prefer the 35% overlay for any tag whose text has to be read.',
            'The label truncates at <span class="m">100px</span>. What it truncates to, '
            'and whether the full text is recoverable, is not specified.',
            'Fill and label colour are per-instance overrides, so two tags made by two '
            'people will not match unless they agree beforehand.',
        ]),

        guidelines=dodont(
            ['Check the contrast of any fill and label pair you choose. Nothing else will.',
             'Keep labels short enough to survive the 100px cap.',
             'Agree the meaning of the diagonal within your team before using it.'],
            ['Do not use a tag where a <a href="truck-phase-tag.html">Truck phase tag</a> '
             'belongs. Phases have nine defined colours and meanings; this does not.',
             'Do not rely on the diagonal alone to mean anything. It has no defined meaning '
             'and no text equivalent.',
             'Do not make a tag look pressable unless you have also built the states, '
             'because the system has none.']),

        specs=spec([
            ('Height', '<span class="m">20px</span>'),
            ('Radius', '<span class="m">4px</span>'),
            ('Padding', '<span class="m">4px</span>'),
            ('Gap', '<span class="m">4px</span>'),
            ('Max width', '<span class="m">100px</span>'),
            ('Fill, light', '<span class="m">#0975C3</span> &mdash; default, overridable'),
            ('Text, light', '<span class="m">#FFFFFF</span>'),
            ('Fill, dark', '<span class="m">#C5E4FB</span> &mdash; default, overridable'),
            ('Text, dark', '<span class="m">#211F1C</span>'),
        ]),

        a11y=('<p>The two default pairs pass. The light one passes by very little, which '
              'matters more than usual here because these colours are meant to be swapped '
              'by hand.</p>' +
              measured([
                  ('Label on default fill, light', '#ffffff', '#0975c3', '4.83:1', '4.5:1', True),
                  ('Label on default fill, dark', '#211f1c', '#c5e4fb', '12.42:1', '4.5:1', True),
                  ('Label on overlay stripe, light', '#ffffff', '#1d57af', '6.92:1', '4.5:1', True),
                  ('Label on solid stripe, light', '#ffffff', '#1f5b8d', '7.14:1', '4.5:1', True),
                  ('Label on overlay stripe, dark', '#211f1c', '#badff9', '11.75:1', '4.5:1', True),
                  ('Label on solid stripe, dark', '#211f1c', '#3698ec', '5.37:1', '4.5:1', True),
                  ('Label on the fill the Figma examples use, light',
                   '#ffffff', '#2778c1', '4.62:1', '4.5:1', True),
              ]) +
              '<div class="note warn"><b>The examples are worse than the default.</b> The '
              'documentation frame in Figma overrides the fill to '
              '<span class="m">#2778C1</span>, which measures 4.62:1 &mdash; below the '
              '4.83:1 of the <span class="m">#0975C3</span> default. Anyone who copies an '
              'example rather than starting from the component inherits the weaker pair. '
              'This page renders the default.</div>' +
              '<div class="note warn"><b>4.83:1 has no headroom.</b> The light default '
              'clears 4.5:1 by a third of a point, and the stripe colours are overridable '
              'too, so a designer can change three things independently and break the pair '
              'without touching the one they were looking at. Measure the composite, not '
              'the fill.</div>' +
              checklist([
                  'Measure every fill and label pair you invent. There is no approved list '
                  'to fall back on.',
                  'The stripe pattern changes the effective background under the text. '
                  'Measure against the composited colour, not the base fill.',
                  'The icon is decorative unless it carries meaning the label does not. If '
                  'it does, the icon needs a text equivalent.',
                  'If the tag is ever made clickable it needs a focus style, and none '
                  'exists.',
              ])),

        gaps=checklist([
            '<b>No approved fill and text pairs.</b> Colours are per-instance overrides, so '
            'contrast is unenforced by design.',
            '<b>The diagonal pattern has no defined meaning.</b> Disabled, pending, '
            'estimated? The file shows it without saying.',
            '<b>No stated relationship to <a href="truck-phase-tag.html">Truck phase tag'
            '</a></b>, which covers similar ground with nine fixed meanings.',
            '<b><span class="m">letter-spacing: -2</span> at 12px</b> is bound to the type '
            'token here and used nowhere else in the library. Likely a leftover.',
            '<b>No icon inventory</b>, and no mapping from icon to meaning.',
            '<b>The solid diagonal crosses the label and makes it hard to read.</b> The '
            'pattern covers the whole chip, text included, and nothing in the file says how '
            'the label is meant to stay legible underneath it. The stripe pitch is not '
            'tokenised either, so this page picked one.',
            '<b>No truncation rule</b> beyond the 100px cap, and no tooltip fallback.',
            '<b>No interactive states</b>, so clickable or removable tags are undefined.',
        ]),
    )


# ══════════════════════════════════════════════════════════════
#  SLIDER
# ══════════════════════════════════════════════════════════════
SLIDER_HTML = """<div class="t-slider">
  <span class="trk"></span>
  <span class="fil" style="width:50%"></span>
  <span class="thb" style="left:50%"></span>
</div>

<!-- active, with the value bubble -->
<div class="t-slider act">
  <span class="trk"></span>
  <span class="fil" style="width:50%"></span>
  <span class="val" style="left:50%">50</span>
  <span class="thb" style="left:50%"></span>
</div>"""

SLIDER_CSS = """.t-slider{ position:relative; width:100%; max-width:237px;
  height:24px; display:flex; align-items:center; }
.t-slider .trk{ position:absolute; left:0; right:0; height:4px;
  border-radius:4px; background:var(--sltrack); }
.t-slider .fil{ position:absolute; left:0; height:4px;
  border-radius:4px; background:var(--slfill); }
.t-slider .thb{ position:absolute; width:24px; height:24px; margin-left:-12px;
  border-radius:9999px; background:var(--slthumbf);
  box-shadow:inset 0 0 0 6px var(--slthumbs); }
.t-slider.hov .thb{ box-shadow:inset 0 0 0 6px var(--slthumbs),
                                0 0 0 1px var(--slthumbs); }
.t-slider.act .thb{ box-shadow:inset 0 0 0 8px var(--slthumbs); }
.t-slider .val{ position:absolute; bottom:28px; transform:translateX(-50%);
  height:24px; padding:0 8px; border-radius:4px;
  background:var(--slval); color:var(--slvaltx);
  font-size:12px; line-height:24px; white-space:nowrap; }

/* light */ --sltrack:#DFDEDD; --slfill:#171614;
            --slthumbf:#FFFFFF; --slthumbs:#211F1C; --slval:#FFBA0D;
/* dark  */ --sltrack:#393632; --slfill:#D0CEC8;
            --slthumbf:#211F1C; --slthumbs:#FFFFFF; --slval:#E3F200;"""

SLIDER_STEPS = [10, 25, 40, 50, 60, 75, 90, 100]


def _slider(pct, cls='', val=False):
    v = ('<span class="val" style="left:%d%%">%d</span>' % (pct, pct)) if val else ''
    return ('<div class="t-slider %s"><span class="trk"></span>'
            '<span class="fil" style="width:%d%%"></span>%s'
            '<span class="thb" style="left:%d%%"></span></div>'
            % (cls, pct, v, pct))


def _sliders():
    out = '<div class="t-stack">'
    for p in SLIDER_STEPS:
        out += ('<div class="t-row"><span class="t-lab">%d%%</span>%s</div>'
                % (p, _slider(p)))
    return out + '</div>'


def _live(pct=50, label='Slump target'):
    """A working slider: the painted parts mirror a real range input."""
    return ('<div class="t-slider live">'
            '<span class="trk"></span>'
            '<span class="fil" style="width:%d%%"></span>'
            '<span class="val" style="left:%d%%">%d</span>'
            '<span class="thb" style="left:%d%%"></span>'
            '<input type="range" min="0" max="100" step="1" value="%d" '
            'aria-label="%s">'
            '</div>' % (pct, pct, pct, pct, pct, label))


def _thumbs():
    out = '<div class="t-stack" style="gap:30px;padding-top:34px">'
    for cls, label in (('', 'Default'), ('hov', 'Hover'), ('act', 'Active')):
        out += ('<div class="brow"><span class="bl">%s</span>%s</div>'
                % (label, _slider(50, cls, val=(cls == 'act'))))
    return out + '</div>'


def _range():
    return ('<div class="t-slider"><span class="trk"></span>'
            '<span class="fil" style="left:25%;width:45%"></span>'
            '<span class="thb" style="left:25%"></span>'
            '<span class="thb" style="left:70%"></span></div>')


def c_slider():
    return cpage(
        'components/slider.html', 'Slider',
        'A 4px track with a 24px ringed thumb, in single and range forms. The one '
        'component in this pass whose dark mode was fully specified.',
        'gap', figma='53714:4469',
        extra_meta=['8 positions', 'Single and range', 'Light and dark'],

        note='<div class="note warn"><b>The track has the same problem as the '
             '<a href="progress-bar.html">Progress bar</a>, and worse in dark.</b> '
             '<span class="m">#DFDEDD</span> measures 1.16:1 on the light page and '
             '<span class="m">#393632</span> measures 1.37:1 on the dark one, so the '
             'unfilled part of the track is invisible in both themes. The two components '
             'also use different dark track colours, so they are not actually sharing a '
             'token.</div>',

        example=bench(_sliders(), _sliders(),
                      'Eight positions. The thumb is a ring: the stroke colour is what you '
                      'see, and it inverts between themes.'),

        anatomy=spec([
            ('Track', '<span class="m">4px</span> tall, <span class="m">4px</span> radius, '
                      'full width'),
            ('Fill', 'Same height, drawn from the left edge to the thumb'),
            ('Thumb', '<span class="m">24 &times; 24</span>, fully round'),
            ('Thumb ring', '<span class="m">6px</span> at rest, plus a '
                           '<span class="m">1px</span> outline on hover, '
                           '<span class="m">8px</span> when active &mdash; heavier as you '
                           'interact, while the 24px target never changes'),
            ('Value bubble', '<span class="m">24px</span> tall, '
                             '<span class="m">4px</span> radius, active state only'),
        ]),

        options=(copybar('Slider', 'slider', 'single + range', SLIDER_HTML, SLIDER_CSS) +
                 '<h3>Single</h3>' +
                 bench(_sliders(), _sliders()) +
                 '<h3>Range</h3>' +
                 bench(_range(), _range(),
                       'Two thumbs on one track. No minimum gap between them is defined, '
                       'and nothing says what happens when they meet.')),

        states=('<h3>Try it</h3>'
                '<p>Drag it, or tab to it and use the arrow keys. Both panes are live, so you '
                'can see the hover ring, the active ring and the value bubble behave in each '
                'theme rather than taking the screenshots on trust.</p>' +
                bench(_live(50), _live(50),
                      'A real <span class="m">&lt;input type="range"&gt;</span> sits invisibly '
                      'on top and the painted parts mirror its value, so keyboard, touch and '
                      'screen readers work without being rebuilt. Arrow keys move by 1, Page '
                      'Up and Page Down by 10, Home and End jump to the ends &mdash; all '
                      'browser defaults, none of them specified in Figma.') +
                '<div class="note warn"><b>The focus ring you see here is a proposal.</b> '
                'Trinity does not define one. This demo draws a 3px ring in the theme&rsquo;s '
                'selection colour so the control is usable by keyboard at all; treat it as a '
                'starting point for the real decision, not as spec.</div>' +
                '<h3>The three drawn states</h3>' +
                bench(_thumbs(), _thumbs(),
                      'Default, hover and active. The value bubble appears only while '
                      'active.') +
                '<div class="note ok"><b>The thumb grows on interaction; the target does '
                'not.</b> Confirmed by Verifi Design: the visible ring gets heavier as you '
                'hover and then drag, so you can see where you are, while the 24px touch '
                'point stays exactly the same size throughout. Read '
                '<span class="m">hover-stroke: 1</span> as a 1px outline added to the 6px '
                'resting ring rather than a replacement for it.</div>' +
                '<div class="note stop"><b>There is no focus state and no disabled '
                'state.</b> For a control that is dragged, focus matters more than hover, '
                'and it is the one that is missing.</div>'),

        behaviour=checklist([
            'The fill runs from the left edge to the thumb. On the range variant it runs '
            'between the two thumbs.',
            'The value bubble appears above the thumb while the thumb is active, and shows '
            'the current number.',
            'Nothing defines the step size, so whether this control moves in ones, fives '
            'or tenths is a per-implementation decision today.',
            'Nothing defines what happens when the two range thumbs collide.',
        ]),

        guidelines=dodont(
            ['Show the current value. The bubble only appears while dragging, so put the '
             'number somewhere permanent as well.',
             'Use a slider when the rough size of the change matters more than the exact '
             'number.',
             'Give the track enough width that a single step is a visible movement.'],
            ['Do not use a slider when the exact value matters. Use a number field.',
             'Do not use it for more than about twenty steps without also showing the '
             'number.',
             'Do not ship it without a focus style. Keyboard users cannot see where they '
             'are.',
             'Do not rely on the 24px thumb as the touch target on a phone.']),

        specs=spec([
            ('Track height', '<span class="m">4px</span>'),
            ('Track radius', '<span class="m">4px</span>'),
            ('Thumb', '<span class="m">24 &times; 24</span>, radius 9999'),
            ('Ring, rest / hover / active', '<span class="m">6 / 6 + 1 outline / 8</span>'),
            ('Track, light / dark', '<span class="m">#DFDEDD / #393632</span>'),
            ('Fill, light / dark', '<span class="m">#171614 / #D0CEC8</span>'),
            ('Thumb fill, light / dark', '<span class="m">#FFFFFF / #211F1C</span>'),
            ('Thumb ring, light / dark', '<span class="m">#211F1C / #FFFFFF</span>'),
            ('Value bubble, light / dark', '<span class="m">#FFBA0D / #E3F200</span>'),
        ]),

        a11y=('<p>The thumb is well handled in both themes. The track is not, and the '
              'value bubble is not in light mode.</p>' +
              measured([
                  ('Fill on track, light', '#171614', '#dfdedd', '13.46:1', '3:1', True),
                  ('Track on page, light', '#dfdedd', '#f0eeea', '1.16:1', '3:1', False),
                  ('Thumb ring on page, light', '#211f1c', '#f0eeea', '14.19:1', '3:1', True),
                  ('Value bubble on page, light', '#ffba0d', '#f0eeea', '1.48:1', '3:1', False),
                  ('Fill on track, dark', '#d0cec8', '#393632', '7.64:1', '3:1', True),
                  ('Track on page, dark', '#393632', '#211f1c', '1.37:1', '3:1', False),
                  ('Thumb ring on page, dark', '#ffffff', '#211f1c', '16.44:1', '3:1', True),
                  ('Value bubble on page, dark', '#e3f200', '#211f1c', '13.28:1', '3:1', True),
              ]) +
              '<div class="note ok"><b>Credit where it is due.</b> The dark-mode block '
              'flips the thumb ring to <span class="m">#FFFFFF</span> on a '
              '<span class="m">#211F1C</span> fill, which is exactly right. Most of the '
              'other components in this pass did not get that treatment.</div>' +
              checklist([
                  'Build it on a real <span class="m">&lt;input type="range"&gt;</span> '
                  'where you can, and you inherit keyboard support for free.',
                  'A focus-visible ring is mandatory and does not exist yet. Ship one.',
                  'Arrow keys must move the value, and Home and End should reach the ends.',
                  'The accessible name must say what is being set, and the value needs a '
                  'text form if the number is not plain &mdash; '
                  '<span class="m">aria-valuetext</span> for units.',
                  'The 24px thumb is below the 44px touch target guidance. Give it a larger '
                  'invisible hit area.',
              ])),

        gaps=checklist([
            '<b>The track fails contrast in both themes</b>, and the two dark values '
            'disagree with <a href="progress-bar.html">Progress bar</a> &mdash; '
            '<span class="m">#393632</span> here, <span class="m">#666054</span> there.',
            '<b>No focus-visible state.</b> The most important missing piece.',
            '<b>No disabled state.</b>',
'<b>No keyboard behaviour</b> &mdash; step, page step, Home and End are all '
            'undefined.',
            '<b>No tick marks, no min or max labels, no unit.</b>',
            '<b>Range variant has no minimum gap</b> and no collision rule.',
            '<b>The value bubble reuses <span class="m">tooltip/height</span> and '
            '<span class="m">radius/sm</span></b> but is not the '
            '<a href="tooltip.html">Tooltip</a> component.',
            '<b>The value bubble changes hue between themes</b>, amber in light and '
            'yellow-green in dark. Confirmed deliberate.',
            '<b>24px thumb is under the 44px touch target guidance</b> with no larger hit '
            'area specified.',
        ]),
    )


# ══════════════════════════════════════════════════════════════
#  AVATAR
# ══════════════════════════════════════════════════════════════
AV_HTML = """<!-- photograph -->
<span class="t-av circle lg">
  <img src="driver.jpg" alt="Marco Ruiz">
</span>

<!-- no photograph: the icon is the fallback, not a placeholder -->
<span class="t-av circle lg">%s</span>

<!-- 16px takes the icon only, never a photograph -->
<span class="t-av circle xs">%s</span>""" % (ICON_USER, ICON_USER)

AV_CSS = """.t-av{
  display:inline-flex; align-items:center; justify-content:center;
  overflow:hidden; flex:none;
  background:var(--avbg); color:var(--avtx);
}
.t-av.circle{ border-radius:9999px; }
.t-av.square{ border-radius:8px; }
.t-av.lg{ width:56px; height:56px; }
.t-av.md{ width:32px; height:32px; }
.t-av.sm{ width:24px; height:24px; }
.t-av.xs{ width:16px; height:16px; }
.t-av > img{ width:100%; height:100%; object-fit:cover; }

/* light */ --avbg:#171614; --avtx:#FFFFFF;
/* dark  */ --avbg:#F0EEEA; --avtx:#171614;"""

AV_SIZES = [('lg', 'Large 56'), ('md', 'Medium 32'), ('sm', 'Small 24'), ('xs', 'XSmall 16')]

# A real Verifi photograph, square-cropped to the face. The source is
# concrete-truck-driver-closeup-cabin-light, on the Download assets page.
AV_PHOTO = ('<img src="../assets/img/avatar-sample.webp" alt="Verifi driver" '
            'width="112" height="112" loading="lazy">')


def _avrow(shape, kind):
    """One row of avatars, all sitting on a shared baseline. kind is photo or icon."""
    out = '<div class="t-avrow">'
    for cls, label in AV_SIZES:
        photo_xs = (kind == 'photo' and cls == 'xs')
        body = ICON_USER if (kind == 'icon' or photo_xs) else AV_PHOTO
        note = '<span class="t-note">icon only</span>' if photo_xs else ''
        out += ('<div class="t-avcell"><span class="box">'
                '<span class="t-av %s %s">%s</span></span>'
                '<span class="cl2">%s</span>%s</div>'
                % (shape, cls, body, label, note))
    return out + '</div>'


def _avs(shape):
    return ('<div class="t-stack" style="gap:22px">'
            '<div class="brow"><span class="bl">Photograph</span>%s</div>'
            '<div class="brow"><span class="bl">Icon &mdash; when there is no photograph</span>'
            '%s</div></div>'
            % (_avrow(shape, 'photo'), _avrow(shape, 'icon')))


def c_avatar():
    return cpage(
        'components/avatar.html', 'Avatar',
        'A person, drawn as a circle or a square, at four sizes. The only component in '
        'this pass with no contrast failure anywhere.',
        'gap', figma='60899:8165',
        extra_meta=['2 shapes', '4 sizes', 'Light and dark'],

        note='<div class="note ok"><b>This one is in good shape.</b> Both themes are '
             'specified, both pass contrast comfortably, and the icon comes from the '
             'TrinityIcons font rather than an embedded SVG, so it can be swapped without '
             'rebuilding the component. The gaps below are about missing variants, not '
             'broken ones.</div>',

        example=bench(_avs('circle'), _avs('circle'),
                      'A real photograph on the top row and the icon fallback underneath, '
                      'at all four sizes. The photograph is one of the images on the '
                      '<a href="../brand/assets.html#photography">Download assets</a> page, '
                      'square-cropped to the face. Only the icon background and icon colour '
                      'change between themes; a photograph looks the same in both.'),

        anatomy=spec([
            ('Circle radius', '<span class="m">9999</span>'),
            ('Square radius', '<span class="m">8px</span>'),
            ('Large', '<span class="m">56 &times; 56</span>'),
            ('Medium', '<span class="m">32 &times; 32</span>'),
            ('Small', '<span class="m">24 &times; 24</span>'),
            ('XSmall', '<span class="m">16 &times; 16</span>'),
            ('Content', 'An image, or an icon from the TrinityIcons font'),
            ('XSmall content', 'Icon only. An image is not permitted at '
                               '<span class="m">16px</span>.'),
        ]),

        options=(copybar('Avatar', 'avatar', '2 shapes, 4 sizes', AV_HTML, AV_CSS) +
                 '<h3>Circle</h3>' +
                 bench(_avs('circle'), _avs('circle')) +
                 '<h3>Square</h3>' +
                 bench(_avs('square'), _avs('square'),
                       'Same sizes, <span class="m">8px</span> radius instead of round.') +
                 '<h3>What each size may contain</h3>' +
                 table(['Size', 'Image', 'Icon'], [
                     ['Large <span class="m">56</span>', 'Yes', 'Yes'],
                     ['Medium <span class="m">32</span>', 'Yes', 'Yes'],
                     ['Small <span class="m">24</span>', 'Yes', 'Yes'],
                     ['XSmall <span class="m">16</span>',
                      '<b>No</b> &mdash; a face is unreadable at this size',
                      'Yes'],
                 ]) +
                 '<div class="note"><b>XSmall is the icon form only.</b> Confirmed by Verifi '
                 'Design and being annotated in the Figma file. Every XSmall example on this '
                 'page is an icon for that reason &mdash; there is no image demonstration at '
                 '16px because there is no permitted use of one.</div>'),

        states=('<p>No interactive states are defined. An avatar inside a clickable row or '
                'menu inherits that control&rsquo;s states; on its own it is a picture.</p>'),

        behaviour=checklist([
            'Pick one shape for a product and keep it. Circles and squares mixed on one '
            'screen read as two systems.',
            'The icon is a font glyph, not an embedded SVG, so a different icon can be '
            'dropped in without touching the component. That is also how the no-photo case '
            'is handled: there is no initials variant, and there is not meant to be one.',
            '<b>Do not put a photograph in the XSmall avatar.</b> At '
            '<span class="m">16px</span> a face is a smudge. Confirmed by Verifi Design, and '
            'being annotated in Figma &mdash; XSmall is the icon form only.',
            'The image fills the frame and crops to the centre. There is no focal point '
            'control.',
        ]),

        guidelines=dodont(
            ['Choose one shape per product.',
             'Use the icon form when there is no photograph. It is the intended fallback, '
             'not a placeholder.',
             'Match the size to the density of what surrounds it.'],
            ['Do not mix circle and square avatars in one interface.',
             'Do not use a photograph at XSmall. Use the icon form.',
             'Do not stretch an image to fit. It crops, by design.',
             'Do not rely on the avatar alone to identify someone. Put the name near it.']),

        specs=spec([
            ('Sizes', '<span class="m">56 / 32 / 24 / 16</span>'),
            ('Circle radius', '<span class="m">9999</span>'),
            ('Square radius', '<span class="m">8px</span>'),
            ('Background, light', '<span class="m">#171614</span>'),
            ('Icon, light', '<span class="m">#FFFFFF</span>'),
            ('Background, dark', '<span class="m">#F0EEEA</span>'),
            ('Icon, dark', '<span class="m">#171614</span>'),
            ('Icon font', '<span class="m">TrinityIcons Regular 24</span> at Large'),
        ]),

        a11y=('<p>Both themes clear the 4.5:1 requirement with a wide margin. No other '
              'component in this pass can say that.</p>' +
              measured([
                  ('Icon on background, light', '#ffffff', '#171614', '18.08:1', '4.5:1', True),
                  ('Icon on background, dark', '#171614', '#f0eeea', '15.61:1', '4.5:1', True),
              ]) +
              checklist([
                  'An avatar that carries meaning needs alt text with the person&rsquo;s '
                  'name. A decorative one beside a visible name takes '
                  '<span class="m">alt=""</span>.',
                  'The icon form is decorative when a name sits next to it. Do not announce '
                  '&ldquo;user icon&rdquo; twice.',
                  'If the avatar is the only way to tell two people apart, that is a '
                  'failure regardless of contrast. Show the name.',
                  'An avatar inside a link or button must not swallow that control&rsquo;s '
                  'accessible name.',
              ])),

        gaps=('<div class="note ok"><b>One question already closed.</b> Photographs are not '
              'allowed in the XSmall avatar &mdash; it is the icon form only. Confirmed by '
              'Verifi Design and being annotated in the Figma file.</div>' +
              checklist([
            '<b>Icon size was only found at Large</b> (<span class="m">TrinityIcons 24'
            '</span>). Whether Medium, Small and XSmall have their own icon sizes or scale '
            'a 24px glyph is unconfirmed.',
            '<b>No initials variant.</b> Verifi Design\u2019s position is that the icon '
            'already covers the no-photo case and the icon itself can be made clearer. That '
            'is a legitimate choice, so the open question is narrower: initials distinguish '
            'two people apart in a list where a generic icon cannot, so decide whether a list '
            'of people is a case this component has to serve.',
            '<b>No group or stacked variant, and none is planned.</b> Verifi Design has '
            'deprioritised it. If you need to show several people at once, list them rather '
            'than stacking them &mdash; do not build a stack locally, because the overlap '
            'rule, the order and the overflow count would all be yours to invent.',
            '<b>No status dot overlay</b>, even though <a href="badge.html">Badge</a> '
            'defines a dot that would fit.',
            '<b>No image crop, focal point or aspect rule.</b>',
            '<b>No broken or missing image fallback.</b>',
            '<b>No border or ring.</b> An avatar on a dark photograph has no separation '
            'from it. Verifi Design has accepted this and a ring is planned. It stands on '
            'its own now that the stacked group is deprioritised.',
              ])),
    )
