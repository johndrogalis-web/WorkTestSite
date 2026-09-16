#!/usr/bin/env python3
"""All section pages."""
from build import (shell, write, SECTIONS, MARK, ARROW, COPYICON,
                   copybar, snippet, bench, brow, nextprev)

SEARCH = ('<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
          '<circle cx="7" cy="7" r="4.6" stroke="currentColor" stroke-width="1.5"/>'
          '<path d="M10.4 10.4L14 14" stroke="currentColor" stroke-width="1.5" '
          'stroke-linecap="round"/></svg>')
CLEAR = ('<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
         '<circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.4"/>'
         '<path d="M6 6l4 4M10 6l-4 4" stroke="currentColor" stroke-width="1.4" '
         'stroke-linecap="round"/></svg>')
ALERT = ('<svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true" '
         'style="flex:none"><circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.4"/>'
         '<path d="M8 5v3.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
         '<circle cx="8" cy="11" r=".9" fill="currentColor"/></svg>')
CHEV = ('<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">'
        '<path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" stroke-width="1.6" '
        'stroke-linecap="round"/></svg>')

PHASES = [
    ('Waiting to load', 'waiting-to-load', '#644325', '#d9a97c'),
    ('Loading', 'loading', '#9a1f1e', '#efadac'),
    ('Loaded', 'loaded', '#887f13', '#e4d95f'),
    ('To job', 'to-job', '#1e6252', '#75dfc7'),
    ('On site', 'on-site', '#872781', '#ed9ce6'),
    ('Pouring', 'pouring', '#101010', '#d6d2d2'),
    ('Washing', 'washing', '#126886', '#b9deea'),
    ('Return to plant', 'return-to-plant', '#9c0f5a', '#f6a4cf'),
    ('Ignition off', 'ignition-off', '#525252', '#bababa'),
]


def cards(items, up=''):
    """A grid of links into a section."""
    out = '<div class="routes" style="border:1px solid var(--rule);border-radius:3px;margin:34px 0">'
    for href, title, desc in items:
        out += ('<a class="route" href="%s%s"><h3>%s</h3><p>%s</p>'
                '<span class="go">Open <span>%s</span></span></a>'
                % (up, href, title, desc, ARROW))
    return out + '</div>'


def tf(state, label, value, ph, help_, req=False, lead=False, clear=False, dis=False):
    lab = '<span class="lb">%s%s</span>' % (label, '<i>*</i>' if req else '')
    ic = SEARCH if lead else ''
    cl = CLEAR if clear else ''
    inp = ('<input type="text" value="%s" placeholder="%s"%s aria-label="%s">'
           % (value, ph, ' disabled' if dis else '', label))
    hi = ALERT if 'error' in state else ''
    hp = '<span class="hp">%s%s</span>' % (hi, help_) if help_ else ''
    return ('<div class="c-field %s">%s<div class="bx">%s%s%s</div>%s</div>'
            % (state, lab, ic, inp, cl, hp))


# ══════════════════════════════════════════════════════════════
#  BRAND
# ══════════════════════════════════════════════════════════════
def brand_index():
    body = f"""
<p class="eyebrow">Brand</p>
<h1>The identity.</h1>
<p class="lede">The logo, the palette, the typeface and the ideas behind them. This half of
   the system is owned by Verifi Design and published as the Identity Guidelines.</p>
<img src="../assets/img/render-1400.webp" alt="A rendered Verifi sensor unit in warm light."
     width="1400" height="784" loading="lazy" style="border-radius:3px;margin:8px 0 6px">
<p class="cap">Identity Guidelines V1.0 &middot; 235 pages &middot; contact Brittany Cool for source files</p>
{cards([
  ('idea.html', 'The horizon line', 'Where the whole identity comes from — the road ahead, and the view from the driver&rsquo;s seat.'),
  ('logo.html', 'Logo', 'Symbol, wordmark and logotype. Clear space, minimum sizes and the eight things people get wrong.'),
  ('colour.html', 'Colour', 'The primary and supporting palettes, with Pantone and CMYK.'),
  ('type.html', 'Typography', 'ABC Repro, its three weights, and the sizing system.'),
  ('imagery.html', 'Imagery', 'The three photographic categories and how they are shot.'),
  ('fifth-element.html', 'Fifth element', 'The banded graphic that reads like a road at speed.'),
  ('voice.html', 'Voice', 'How Verifi writes, and the rules for the name.'),
])}
{nextprev(nxt=('idea.html', 'The horizon line'))}
"""
    return shell('Brand', 'The Verifi identity — logo, colour, typography and imagery.',
                 'brand', 'index.html', body)


def brand_idea():
    body = f"""
<p class="eyebrow">Brand</p>
<h1>The horizon line.</h1>
<p class="lede">One idea sits under everything: the line where the road meets the sky, seen
   from the driver&rsquo;s seat.</p>

<img src="../assets/img/driver-1400.webp" alt="A driver in a high-visibility jacket at the wheel of a truck, looking at the road ahead."
     width="1400" height="1107" loading="lazy" style="border-radius:3px">
<p class="cap">The view the whole identity is drawn from</p>

<h2 id="where">Where it comes from</h2>
<p>Verifi&rsquo;s work happens on the road, between the plant and the pour. The identity
   starts there rather than in the office: the horizon line is what a driver looks at for
   the whole journey, and the point where two things meet.</p>
<p>It is not decoration. It shows up in four places, and once you know to look for it you
   cannot stop seeing it.</p>

<div class="tw"><table>
  <thead><tr><th>Where</th><th>How it shows up</th></tr></thead>
  <tbody>
    <tr><td class="wrap">The symbol</td><td>Two open strokes — a funnel and an arrow pointing into it — built on the same angle as a road meeting the horizon.</td></tr>
    <tr><td class="wrap">The wordmark</td><td>The <em>fi</em> ligature carries the line across the top of the word.</td></tr>
    <tr><td class="wrap">Layout</td><td>Pages are split by a horizon: image above, content below, or the reverse. See the grid.</td></tr>
    <tr><td class="wrap">The fifth element</td><td>A photograph stretched into bands, which reads as a road passing at speed.</td></tr>
  </tbody>
</table></div>

<h2 id="hardware">And the hardware informs the details</h2>
<p>The second source is the product itself. The rounded corners throughout the system —
   on buttons, cards, the drum unit&rsquo;s own casing — come from the hardware rather than
   from a style preference.</p>
<img src="../assets/img/hardware-1-1400.webp" alt="The Verifi drum unit mounted on a truck, photographed in profile."
     width="1400" height="475" loading="lazy" style="border-radius:3px">
<p class="cap">Rounded edges on the unit become rounded edges in the interface</p>

<div class="note"><b>Why this matters when you are making something.</b> If you are stuck on
  a layout, put the horizon back in it. A full-width image meeting a block of content on a
  clean line is almost always the right answer, and it is the one move that makes a page look
  like Verifi rather than like anyone else.</div>

{nextprev(('index.html','Brand overview'), ('logo.html','Logo'))}
"""
    return shell('The horizon line', 'The idea underneath the Verifi identity.',
                 'brand', 'idea.html', body,
                 toc=[('where', 'Where it comes from'), ('hardware', 'The hardware')])


def brand_logo():
    donts = [
        ('transform:scaleX(1.45)', '', '01', 'Do not stretch or squash it. Drag a corner, not a side.'),
        ('color:var(--blue)', '', '02', 'Do not colour it. Not blue, not a phase colour, not yellow.'),
        ('color:#fff', 'background:linear-gradient(120deg,#8a8580,#d0cec8 55%,#5c5750)', '03',
         'Do not put it on a busy or mid-grey background. It has to hold across the whole clear space.'),
        ('transform:rotate(-11deg)', '', '04', 'Do not tilt it. It is level everywhere, including on trucks.'),
        ('filter:drop-shadow(2px 3px 0 rgba(0,0,0,.35))', '', '05',
         'Do not add a shadow, outline, bevel or glow.'),
        ('color:#171614', 'background:#e3f200', '06',
         'Do not sit it on yellow, except where Design has approved it on imagery.'),
    ]
    dont_html = ''
    for svg_style, box_style, n, cap in donts:
        dont_html += ('<figure><div class="box"%s><svg viewBox="0 0 96 24" style="%s" '
                      'aria-hidden="true">%s</svg></div>'
                      '<figcaption><b>%s</b>%s</figcaption></figure>'
                      % (' style="%s"' % box_style if box_style else '', svg_style,
                         MARK.split('>', 1)[1].rsplit('</svg>', 1)[0], n, cap))
    dont_html += ('<figure><div class="box"><span style="font-family:var(--mono);font-size:21px;'
                  'color:var(--ink-soft)">verifi</span></div><figcaption><b>07</b>'
                  'Do not type the word instead of placing the artwork.</figcaption></figure>'
                  '<figure><div class="box" style="gap:10px"><svg viewBox="0 0 96 24" '
                  'style="height:19px;width:76px" aria-hidden="true">%s</svg>'
                  '<span style="font-size:16px;font-weight:500">Pulse</span></div>'
                  '<figcaption><b>08</b>Do not invent a lock-up by typing a product name '
                  'beside it.</figcaption></figure>'
                  % MARK.split('>', 1)[1].rsplit('</svg>', 1)[0])

    body = f"""
<p class="eyebrow">Brand</p>
<h1>Logo.</h1>
<p class="lede">Three words that are not interchangeable, one colour, and a margin nothing
   may enter.</p>

<h2 id="parts">Symbol, wordmark, logotype</h2>
<p>The design system is strict about these three words, and using the wrong one causes real
   confusion when someone asks for a file.</p>
<div class="plate">
  <div style="text-align:center">
    <svg viewBox="0 0 96 24" style="height:44px;width:auto;color:var(--ink)" aria-hidden="true"
         preserveAspectRatio="xMinYMid meet" viewBox="0 0 27 24">{MARK.split('>',1)[1].rsplit('</svg>',1)[0]}</svg>
    <p class="cap" style="margin:14px 0 0">Symbol</p>
  </div>
  <div style="text-align:center">
    <svg viewBox="0 0 96 24" style="height:44px;width:176px;color:var(--ink)" aria-hidden="true">{MARK.split('>',1)[1].rsplit('</svg>',1)[0]}</svg>
    <p class="cap" style="margin:14px 0 0">Logotype &mdash; symbol plus wordmark</p>
  </div>
</div>
<div class="tw"><table>
  <thead><tr><th>Word</th><th>What it means</th></tr></thead>
  <tbody>
    <tr><td>Symbol</td><td>The two angled strokes on their own. It may stand alone only in tightly controlled places — avatars, profile images, favicons — or where the full name appears close by.</td></tr>
    <tr><td>Wordmark</td><td>The word &ldquo;verifi&rdquo; on its own, without the strokes.</td></tr>
    <tr><td>Logotype</td><td>Both together. This is the normal logo and what most people mean when they say &ldquo;the logo&rdquo;.</td></tr>
  </tbody>
</table></div>
<div class="note"><b>The symbol is not a shortcut.</b> It must not be separated from the
  Verifi name unless a special case has been approved. Use of the symbol alone is limited to
  highly branded contexts where Verifi is clearly communicated by the text and imagery
  around it.</div>

<h2 id="clearspace">Clear space</h2>
<p>Leave a margin equal to <strong>the height of the symbol</strong> on all four sides. Nothing
   goes in it: no text, no rule, no part of a photograph, no other company&rsquo;s logo.</p>
<div class="plate inset"><div class="clearbox"><svg viewBox="0 0 96 24" aria-hidden="true">{MARK.split('>',1)[1].rsplit('</svg>',1)[0]}</svg></div></div>
<p class="cap">Blue line: the edge of the logotype. Dashed line: the margin that stays empty.</p>
<div class="note">Clear space is a separate rule from placement and margins. It only protects
  the logo from other things getting too close; it does not tell you where on the page the
  logo goes.</div>

<h2 id="size">How small is too small</h2>
<div class="plate" style="justify-content:flex-start;gap:48px">
  <figure style="margin:0"><svg viewBox="0 0 96 24" style="height:42px;width:169px;color:var(--ink)" aria-hidden="true">{MARK.split('>',1)[1].rsplit('</svg>',1)[0]}</svg>
    <figcaption class="cap" style="margin:14px 0 0">169 &times; 42 &mdash; product nav</figcaption></figure>
  <figure style="margin:0"><svg viewBox="0 0 96 24" style="height:24px;width:96px;color:var(--ink)" aria-hidden="true">{MARK.split('>',1)[1].rsplit('</svg>',1)[0]}</svg>
    <figcaption class="cap" style="margin:14px 0 0">96 &times; 24 &mdash; the floor</figcaption></figure>
</div>
<div class="tw"><table>
  <thead><tr><th>Where</th><th class="m">Smallest</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td class="wrap">On screen</td><td class="m">96 &times; 24 px</td><td>Below this the counters in the <em>e</em> and the <em>fi</em> fill in.</td></tr>
    <tr><td class="wrap">In print</td><td class="m">25 mm wide</td><td>Ink spread closes the same gaps.</td></tr>
    <tr><td class="wrap">Stitched, etched, cast</td><td class="m">40 mm wide</td><td>The two strokes of the symbol merge into one.</td></tr>
  </tbody>
</table></div>

<h2 id="sizing">Sizing against a headline</h2>
<p>When the logotype sits with a headline, its height is set by the headline in three steps:
   <strong>3/3, 2/3 or 1/3 of the headline height</strong>. In extreme formats use judgement —
   but the logotype never exceeds <strong>50% of the artboard width</strong>.</p>

<h2 id="colour">What colour it is</h2>
<div class="bench">
  <div class="pane pane-l"><div class="ph">On lighter backgrounds</div>
    <div class="pb" style="align-items:center;padding:36px">
      <svg viewBox="0 0 96 24" style="height:34px;width:136px;color:#2e2b27" aria-hidden="true">{MARK.split('>',1)[1].rsplit('</svg>',1)[0]}</svg>
      <span class="m" style="font-size:12px;opacity:.6">#2E2B27 &middot; Pantone 426</span></div></div>
  <div class="pane pane-d"><div class="ph">On darker backgrounds</div>
    <div class="pb" style="align-items:center;padding:36px">
      <svg viewBox="0 0 96 24" style="height:34px;width:136px;color:#fff" aria-hidden="true">{MARK.split('>',1)[1].rsplit('</svg>',1)[0]}</svg>
      <span class="m" style="font-size:12px;opacity:.6">#FFFFFF</span></div></div>
</div>
<p class="cap">Black or white only. There is no blue version, no two-tone version, no gradient.</p>
<div class="note"><b>One exception.</b> Verifi Yellow may be used on imagery, in special and
  considered cases, where the contrast is high. That is a Design decision, not a per-project
  one.</div>

<h2 id="placement">Placement</h2>
<p>The logotype sits at the <strong>bottom</strong> of a layout. Where possible the centre of
   the symbol aligns to the centre of the artboard; when the fifth element is present, it
   aligns instead to the centre of the &ldquo;road&rdquo; the banding creates.</p>
<p>In the product it sits top-left in the sidebar. In documents, top-left or bottom-right —
   not both.</p>

<h2 id="misuse">Eight things people actually do</h2>
<div class="donts">{dont_html}</div>

{nextprev(('idea.html','The horizon line'), ('colour.html','Colour'))}
"""
    return shell('Logo', 'Symbol, wordmark and logotype — clear space, sizing and misuse.',
                 'brand', 'logo.html', body,
                 toc=[('parts', 'The three words'), ('clearspace', 'Clear space'),
                      ('size', 'Minimum size'), ('sizing', 'Sizing'),
                      ('colour', 'Colour'), ('placement', 'Placement'),
                      ('misuse', 'Misuse')])
