#!/usr/bin/env python3
"""Get started, Brand and Open items."""
from core import (shell, MARK, ARROW, copybar, bench, spec, dodont, checklist,
                  table, grid)
from comp_rest import CAT

# Counts are derived from the catalogue so these pages cannot drift from it.
N_ALL  = len(CAT)
N_DOC  = len({r[5] for r in CAT if r[5]})   # unique pages, not rows
N_OK   = sum(1 for r in CAT if r[3] == 'ok')
N_GAP  = sum(1 for r in CAT if r[3] == 'gap')
N_BAD  = sum(1 for r in CAT if r[3] == 'bad')
N_NONE = sum(1 for r in CAT if r[3] == 'none')

LOGO = MARK.split('>', 1)[1].rsplit('</svg>', 1)[0]


# ══════════════════════════════════════════════════════════════
#  GET STARTED
# ══════════════════════════════════════════════════════════════
def g_overview():
    body = f"""
<h1>Verifi Design System.</h1>
<p class="lede">Everything you need to make something that looks, sounds and behaves like
   Verifi. Brand on one side, product on the other, and an honest note wherever the two
   disagree.</p>

<h2 id="what">What Verifi is</h2>
<p>Concrete is mixed in motion and judged on arrival. Verifi puts sensors inside the drum, so
   the load that leaves the plant is the load that gets poured &mdash; measured, corrected and
   recorded on the way. When the mix drifts out of spec, water and admixture are dosed
   automatically, and every adjustment is logged. The producer and the customer end up looking
   at the same record.</p>
<p>That one idea shapes everything here: <strong>we build for certainty in an industry that has
   always lived with guesswork.</strong></p>

<h2 id="start">Where to start</h2>
{grid([
  ('start/designers.html', 'For designers',
   'Which components are safe to use, what is not drawn yet, and the six habits that make a screen look like Verifi.'),
  ('start/developers.html', 'For developers',
   'The whole token block, the measured contrast failures, and the sets not to build against.'),
  ('components/index.html', 'All components',
   'Every component in the library with an honest status. '
   f'{N_DOC} have full pages so far.'),
  ('brand/assets.html', 'Download assets',
   'Logo, animation, fifth element and 43 photographs — downloadable, no SharePoint needed.'),
  ('open-items.html', 'Open items',
   f'{len(OPEN)} questions this system cannot answer on its own, written down instead of '
   'guessed at.'),
])}

<h2 id="two">Two sources, one place to look</h2>
<p>Verifi has an identity system and a product design system, built by different teams at
   different times. Rather than quietly picking a winner, this site keeps both and says where
   they diverge.</p>
{table(['', 'Brand', 'Product'], [
  ['Called', 'Identity Guidelines V1.0', 'Trinity v0.1.3'],
  ['Covers', 'Logo, colour, typography, imagery, voice', 'Tokens, components, states, behaviour'],
  ['Governs', 'Anything a customer sees outside the product', 'Anything inside the Hub'],
  ['Ask', 'Brittany Cool', 'Verifi Design'],
])}
<p>Where the two overlap &mdash; the blue, the black, the greys &mdash; the differences are
   documented on <a href="open-items.html">open items</a> rather than averaged away.</p>

<h2 id="read">How to read a component page</h2>
<p>Every component page has the same eleven sections in the same order. Once you have read one,
   you know where everything is on all of them.</p>
{spec([
  ('Example', 'The component, light and dark, above the fold'),
  ('Anatomy', 'The parts, named and measured'),
  ('Options', 'Every variant, each with its own Copy HTML and Copy CSS'),
  ('States', 'Default, hover, focus, disabled, error &mdash; whichever apply'),
  ('Behaviour', 'What it does when used: overflow, timing, dismissal'),
  ('Guidelines', 'Do and do not, shown rather than described'),
  ('Specs', 'The numbers'),
  ('Accessibility', 'Keyboard, focus, contrast, what a screen reader says'),
  ('Known gaps', 'What Figma does not answer, and what we did instead'),
])}
<div class="note ok"><b>Copy is scoped to the block you are looking at.</b> The Copy CSS button
  beside the primary button gives you the primary button, not every button in the system. Each
  variant carries its own.</div>

<h2 id="honest">What is not finished</h2>
<p>This library is real but young. {N_GAP} of the {N_ALL} components carry a documented
   gap, dark mode is drawn for almost nothing, and several colour pairs fail contrast. All of it
   is written down. That is deliberate: a system that only publishes its settled parts teaches
   people to trust the unsettled parts too.</p>
"""
    return shell('Verifi Design System',
                 'Brand, foundations and components for Verifi — the in-transit concrete '
                 'management platform.',
                 'index.html', body,
                 toc=[('what', 'What Verifi is'), ('start', 'Where to start'),
                      ('two', 'Two sources'), ('read', 'How to read a page'),
                      ('honest', 'What is not finished')])


def g_designers():
    body = f"""
<h1>For designers.</h1>
<p class="lede">Everything here comes from Trinity. The brand half governs what a customer sees
   outside the product; this half governs what happens inside it.</p>

<h2 id="first">Read these four, in this order</h2>
{spec([
  ('1 &middot; Colour', '<a href="../foundations/colour.html">The three jobs colour is allowed '
                        'to do</a>, and why the product blue is not the brand blue.'),
  ('2 &middot; Shape', '<a href="../foundations/shape.html">Seven radii, what each one means, '
                       'and when a shadow is allowed.</a>'),
  ('3 &middot; The catalogue', f'<a href="../components/index.html">All {N_ALL} components with '
                               f'a status on each</a> &mdash; {N_GAP} carry a documented gap.'),
  ('4 &middot; Open items', '<a href="../open-items.html">What is genuinely undecided</a>, so '
                            'you do not spend a day resolving something that is waiting on a person.'),
])}

<h2 id="habits">Six habits that make a screen look like Verifi</h2>
{checklist([
  '<b>Use the quiet outline pill.</b> Filled buttons are for completion, at most one per '
  'container. A screen full of solid buttons is not this product.',
  '<b>Let colour mean status, not decoration.</b> Blue is selection. Red and amber are alerts. '
  'The nine phase colours belong to phases. Nothing else is coloured.',
  '<b>Keep the page order.</b> Title, stat band, toolbar, tabs, content, pagination. Every page.',
  '<b>Open detail in a drawer</b>, not a new page, so the list underneath survives.',
  '<b>Tint hover with the selection colour</b>, never grey. 5% in both themes.',
  '<b>Put the horizon back in it.</b> When a marketing layout is not working, a full-width image '
  'meeting a block of content on a clean line is almost always the answer.',
])}

<h2 id="safe">What is safe to use today</h2>
{table(['Status', 'Count', 'What it means for you'], [
  ['<span class="pill ok">Solid</span>', str(N_OK),
   'Variants, states and rules all present. Build with it and move on.'],
  ['<span class="pill gap">Has gaps</span>', str(N_GAP),
   'It works. Read the gap on the component page before relying on the missing part.'],
  ['<span class="pill bad">Broken</span>', str(N_BAD),
   'Top navigation. Figma reports it as structurally invalid. Do not use it.'],
  ['<span class="pill none">Missing</span>', str(N_NONE),
   'Card, Link, and no stepper at all. Interim rules are written on the nearest page.'],
])}

<h2 id="notfinished">What is not finished</h2>
{checklist([
  '<b>Dark mode is drawn for almost nothing.</b> Form fields in particular exist in light mode '
  'only. Every dark column on this site is a derivation.',
  '<b>Three components have no usable spec.</b> Card is a stub, Top navigation is broken, and '
  'Link does not exist.',
  '<b>Modal has one size.</b> Anything bigger than a confirm dialog is improvised.',
  '<b>There is no stepper, no skeleton and no empty state.</b> Interim rules exist; do not '
  'invent components to fill the holes.',
  '<b>Two icon libraries coexist</b> &mdash; 1,134 Unicons and 281 Feather. New work uses '
  'Unicons only, and never mixes prefixes in one view.',
])}

<h2 id="duplicates">Sets not to place</h2>
<p>Five clusters exist twice in the file. Instances must reference the canonical ID.</p>
{table(['Component', 'Use this', 'Not this'], [
  ['Side navigation', '<span class="m">56362:18728</span>', '<span class="m">57725:*</span>'],
  ['Toast', '<span class="m">39027:356</span>', '<span class="m">56362:19143</span>'],
  ['Table cells', '<span class="m">56348:4383</span>', '<span class="m">57724:564</span>'],
  ['Truck phase tag', '<span class="m">56361:2240</span>', '<span class="m">57719:16219</span>'],
  ['Top navigation', '&mdash;', '<span class="m">56362:18642</span> is broken outright'],
])}
"""
    return shell('For designers', 'Which components are safe, what is not drawn yet, and the '
                 'habits that make a screen look like Verifi.',
                 'start/designers.html', body, crumb=['Get started', 'For designers'],
                 toc=[('first', 'Read these four'), ('habits', 'Six habits'),
                      ('safe', 'What is safe today'), ('notfinished', 'What is not finished'),
                      ('duplicates', 'Sets not to place')])


def g_developers():
    body = f"""
<h1>For developers.</h1>
<p class="lede">Every component page carries copy-and-paste HTML and CSS, scoped to the variant
   you are looking at. This page is the token set, the things that will bite you, and the
   numbers we measured rather than claimed.</p>

<h2 id="tokens">The token set</h2>
<p>The whole block, both themes, is on
   <a href="../foundations/colour.html#tokens">Foundations &rarr; Colour</a> with a Copy button.
   Paste it into your root stylesheet and every snippet on this site works unchanged.</p>
<div class="note"><b>Ink tokens carry alpha on purpose.</b> <code>--defined</code> is
  <span class="m">#36322D</span> at 76%, not a solid grey, so text picks up whatever surface it
  sits on. That is also why contrast has to be <em>composited</em> before it is measured &mdash;
  the naive hex comparison gives the wrong answer.</div>

<h2 id="bite">Five things that will bite you</h2>
{checklist([
  '<b>Lime is dark-mode only.</b> <code>--select</code> is blue in light and lime in dark. If '
  'lime appears on a light screen, a token has been hardcoded somewhere.',
  '<b>Phase colours flip, they do not tint.</b> Light is the solid colour with white text; dark '
  'is the light tint with near-black text. Same token pair, inverted roles. Pill, map marker and '
  'legend dot all read from it and must agree.',
  '<b>Hover is selection-tinted, never grey.</b> 5% of the selection colour, both themes.',
  '<b>46% of the button set&rsquo;s fills are hardcoded in Figma.</b> Generate CSS from the file '
  'rather than from the token block and you inherit values that will not follow a theme change.',
  '<b>The table component binds Montserrat and Font Awesome.</b> Neither belongs to the rest of '
  'the system. Use ABC Repro and Unicons and flag it.',
])}

<h2 id="a11y">The two contrast failures</h2>
<p>Measured, not asserted &mdash; the calculator runs in your browser on the
   <a href="../foundations/accessibility.html">accessibility page</a> so you can check the
   arithmetic.</p>
{table(['Pair', 'Ratio', 'Verdict', 'Fix'], [
  ['Phase pill <em>Loaded</em> <span class="m">#887F13</span> with white text',
   '<span class="m">4.12:1</span>', '<span class="pill bad">Fail</span>',
   'Darken to <span class="m">#7A7211</span> for 4.95:1. The only one of eighteen phase '
   'combinations that misses.'],
  ['Light-mode <code>--subtle</code> on <code>--layer-1</code>',
   '<span class="m">2.87:1</span>', '<span class="pill bad">Fail</span>',
   'Below even the large-text bar, and it is the placeholder token. Use <code>--soft</code> at '
   '14px or larger until it is darkened.'],
])}

<h2 id="naming">State naming, normalised</h2>
<p>Three competing conventions coexist in the Figma file &mdash; <code>state</code> vs
   <code>State</code>, <code>disabled</code> vs <code>isDisabled</code>, <code>value</code> vs
   <code>isSelected</code>, <code>intermediate</code> vs <code>isIndeterminate</code>. Do not
   propagate that into code.</p>
{spec([
  ('State', '<span class="m">default &middot; hover &middot; focus &middot; active</span>'),
  ('Booleans', '<span class="m">disabled &middot; selected &middot; indeterminate &middot; '
               'loading &middot; inverse</span>'),
  ('Never', '<span class="m">pressed</span> (only the accordion has it), '
            '<span class="m">intermediate</span>, <span class="m">isFoo</span>'),
])}

<h2 id="motion">Motion, in four numbers</h2>
{spec([
  ('Colour and border', '<span class="m">0.14s</span>'),
  ('Popovers', '<span class="m">0.2s</span>, fade plus a 4&ndash;6px rise'),
  ('Drawers', '<span class="m">0.38s cubic-bezier(.22, 1, .36, 1)</span>'),
  ('Focus', '<span class="m">2px</span> outline at <span class="m">2px</span> offset, never animated'),
])}
<p>Nothing bounces, and every transition is switched off under
   <code>prefers-reduced-motion</code> &mdash; including on this site.
   <a href="../foundations/motion.html">The motion page has the snippet {ARROW}</a></p>

<h2 id="dontbuild">Sets not to build against</h2>
{table(['Component', 'Why', 'Instead'], [
  ['Top navigation <span class="m">56362:18642</span>',
   'Figma reports the variant properties as invalid.', 'Nothing. Ask Verifi Design.'],
  ['Side navigation <span class="m">57725:*</span>', 'Duplicate of the real cluster.',
   '<span class="m">56362:18728</span>'],
  ['Toast <span class="m">56362:19143</span>', 'Cruder duplicate.',
   '<span class="m">39027:356</span>'],
  ['Table cells <span class="m">57724:564</span>', 'Duplicate.',
   '<span class="m">56348:4383</span>'],
  ['Truck phase tag <span class="m">57719:16219</span>', 'Duplicate.',
   '<span class="m">56361:2240</span>'],
])}
"""
    return shell('For developers', 'The token set, the measured contrast failures, and the sets '
                 'not to build against.',
                 'start/developers.html', body, crumb=['Get started', 'For developers'],
                 toc=[('tokens', 'The token set'), ('bite', 'Five things'),
                      ('a11y', 'Contrast failures'), ('naming', 'State naming'),
                      ('motion', 'Motion'), ('dontbuild', 'Do not build against')])


# ══════════════════════════════════════════════════════════════
#  BRAND
# ══════════════════════════════════════════════════════════════
def b_logo():
    donts = [
        ('transform:scaleX(1.45)', '', '01', 'Do not stretch or squash it. Drag a corner, not a side.'),
        ('color:#1594ef', '', '02', 'Do not colour it. Not blue, not a phase colour, not yellow.'),
        ('color:#fff', 'background:linear-gradient(120deg,#8a8580,#d0cec8 55%,#5c5750)', '03',
         'Do not put it on a busy or mid-grey background.'),
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
                      % (' style="%s"' % box_style if box_style else '', svg_style, LOGO, n, cap))
    dont_html += ('<figure><div class="box"><span style="font-family:var(--mono);font-size:19px;'
                  'color:var(--ink-soft)">verifi</span></div><figcaption><b>07</b>'
                  'Do not type the word instead of placing the artwork.</figcaption></figure>'
                  '<figure><div class="box" style="gap:10px"><svg viewBox="0 0 96 24" '
                  'style="height:17px;width:68px;color:var(--ink)" aria-hidden="true">%s</svg>'
                  '<span style="font-size:15px">Pulse</span></div>'
                  '<figcaption><b>08</b>Do not invent a lock-up by typing a product name '
                  'beside it.</figcaption></figure>' % LOGO)

    body = f"""
<h1>Logo.</h1>
<p class="lede">Three words that are not interchangeable, one colour, and a margin nothing may
   enter.</p>

<div class="note ok"><b>Need the files?</b> Every logo format &mdash; SVG, PNG and EPS, in
  black and white, plus the animation &mdash; is on
  <a href="assets.html">Download assets</a>. No SharePoint access needed.</div>

<h2 id="parts">Symbol, wordmark, logotype</h2>
<div class="plate">
  <svg viewBox="0 0 96 24" style="height:40px;width:160px;color:var(--ink)" aria-hidden="true">{LOGO}</svg>
</div>
{table(['Word', 'What it means'], [
  ['Symbol', 'The two angled strokes on their own. It may stand alone only in tightly controlled '
             'places &mdash; avatars, favicons &mdash; or where the full name appears close by.'],
  ['Wordmark', 'The word &ldquo;verifi&rdquo; on its own, without the strokes.'],
  ['Logotype', 'Both together. This is the normal logo and what most people mean.'],
])}
<div class="note"><b>The symbol is not a shortcut.</b> It must not be separated from the Verifi
  name unless a special case has been approved.</div>

<h2 id="clearspace">Clear space and minimum size</h2>
<p>Leave a margin equal to <strong>the height of the symbol</strong> on all four sides. Nothing
   goes in it: no text, no rule, no part of a photograph, no other company&rsquo;s logo.</p>
{table(['Where', 'Smallest', 'Why'], [
  ['On screen', '<span class="m">96 &times; 24 px</span>',
   'Below this the counters in the <em>e</em> and the <em>fi</em> fill in.'],
  ['In print', '<span class="m">25 mm</span> wide', 'Ink spread closes the same gaps.'],
  ['Stitched, etched, cast', '<span class="m">40 mm</span> wide',
   'The two strokes of the symbol merge into one.'],
])}

<h2 id="colour">What colour it is</h2>
<div class="bench">
  <div class="pane pane-l"><div class="ph">On lighter backgrounds</div>
    <div class="pb" style="align-items:center;padding:32px">
      <svg viewBox="0 0 96 24" style="height:30px;width:120px;color:#2e2b27" aria-hidden="true">{LOGO}</svg>
      <span class="m" style="font-size:12px;opacity:.6">#2E2B27 &middot; Pantone 426</span></div></div>
  <div class="pane pane-d"><div class="ph">On darker backgrounds</div>
    <div class="pb" style="align-items:center;padding:32px">
      <svg viewBox="0 0 96 24" style="height:30px;width:120px;color:#fff" aria-hidden="true">{LOGO}</svg>
      <span class="m" style="font-size:12px;opacity:.6">#FFFFFF</span></div></div>
</div>
<p class="cap">Black or white only. There is no blue version, no two-tone version, no gradient.</p>
<div class="note"><b>One exception.</b> Verifi Yellow may be used on imagery, in special and
  considered cases, where the contrast is high. That is a Design decision, not a per-project one.</div>

<h2 id="placement">Placement and sizing</h2>
{spec([
  ('In marketing layouts', 'The logotype sits at the <b>bottom</b>. Where possible the centre of '
                           'the symbol aligns to the centre of the artboard.'),
  ('With the fifth element', 'It aligns to the centre of the &ldquo;road&rdquo; the banding creates.'),
  ('In the product', 'Top-left, in the sidebar.'),
  ('In documents', 'Top-left or bottom-right. Not both.'),
  ('Against a headline', 'Its height is 3/3, 2/3 or 1/3 of the headline height.'),
  ('Maximum', 'Never more than <b>50% of the artboard width</b>.'),
])}

<h2 id="misuse">Eight things people actually do</h2>
<div class="donts">{dont_html}</div>
"""
    return shell('Logo', 'Symbol, wordmark and logotype — clear space, sizing and misuse.',
                 'brand/logo.html', body, crumb=['Brand', 'Logo'],
                 toc=[('parts', 'The three words'), ('clearspace', 'Clear space'),
                      ('colour', 'Colour'), ('placement', 'Placement'), ('misuse', 'Misuse')])


def b_colour_type():
    rows = [('Verifi Blue', '#1594EF', '2192 U / C', '91 · 38 · 0 · 6'),
            ('Verifi Yellow', '#E3F200', '—', '17 · 0 · 100 · 2'),
            ('Grey 100', '#FAF9F6', '—', '0 · 0 · 2 · 2'),
            ('Grey 200', '#EBE7E1', 'Warm Gray 1', '0 · 2 · 4 · 8'),
            ('Grey 650', '#706A5C', 'Warm Gray 9', '0 · 5 · 18 · 56'),
            ('Black', '#2E2B27', '426 U / C', '0 · 7 · 15 · 82'),
            ('White', '#FFFFFF', '—', '0 · 0 · 0 · 0')]
    sw = ''.join('<div><span class="chip" style="background:%s"></span><span class="meta2">'
                 '<span class="nm">%s</span><span class="hx">%s</span></span></div>'
                 % (h, n, h) for n, h, p, c in rows)
    tbl = ''.join('<tr><td><span class="sw" style="background:%s"></span>%s</td>'
                  '<td class="m">%s</td><td class="m">%s</td><td class="m">%s</td></tr>'
                  % (h, n, h, p, c) for n, h, p, c in rows)

    body = f"""
<h1>Colour and type.</h1>
<p class="lede">Black, white and warm greys carry almost everything. Blue and yellow are applied
   purposefully, never as decoration.</p>

<h2 id="palette">The primary palette</h2>
<div class="swatches">{sw}</div>

<h2 id="print">Every value, including print</h2>
<div class="tw"><table>
  <thead><tr><th>Name</th><th class="m">Hex</th><th class="m">Pantone</th><th class="m">CMYK</th></tr></thead>
  <tbody>{tbl}</tbody>
</table></div>

<h2 id="supporting">Supporting ramps</h2>
<p>Blue and yellow each extend four steps, for data visualisation, hierarchy and depth. The rule
   the guidelines give is blunt: <strong>supporting colours must not be used purely for
   decoration</strong>.</p>
<div class="ramp">
  <span style="background:#EEF9FF;color:#032d3d">EEF9FF</span>
  <span style="background:#1594EF;color:#032d3d">1594EF</span>
  <span style="background:#0975C3;color:#fff">0975C3</span>
  <span style="background:#032D3D;color:#fff">032D3D</span>
</div>
<div class="ramp">
  <span style="background:#FEFFD6;color:#2b2712">FEFFD6</span>
  <span style="background:#E3F200;color:#2b2712">E3F200</span>
  <span style="background:#B5BF00;color:#2b2712">B5BF00</span>
  <span style="background:#4A4F00;color:#fff">4A4F00</span>
</div>

<h2 id="yellow">Where yellow is allowed</h2>
<p><strong>Verifi Yellow is a marketing colour.</strong> On verificoncrete.com it is the Request
   a demo button. In decks it is the callout. That is correct and approved.</p>
<p>Inside the product it means something else entirely &mdash; it is the dark-mode selection
   colour. So a yellow button in a screenshot of the Hub would be wrong, and a yellow button on a
   landing page is right. Same colour, two domains, no conflict.</p>

<h2 id="type">Typography</h2>
<p>ABC Repro, in three weights for marketing use: Regular, Medium and Bold. The product uses only
   Regular and Medium.</p>
<div class="plate">
  <div style="text-align:center">
    <p style="font-size:clamp(44px,8vw,84px);line-height:1;margin:0;color:var(--ink);
              font-weight:500;letter-spacing:-.03em">Confidence in concrete.</p>
  </div>
</div>
{checklist([
  'Headlines are set tight &mdash; negative letter-spacing, lines close together.',
  'Sentence case everywhere. Never all-caps headlines.',
  'Never justify, never letter-space lowercase.',
  'For the product scale, see <a href="../foundations/typography.html">Foundations &rarr; '
  'Typography</a>.',
])}

<h2 id="errors">Two errors in the source file</h2>
<div class="note warn">Worth knowing when you read the Identity Guidelines directly.
  <b>Verifi Yellow has two values</b> &mdash; <span class="m">#E3F200</span> on the primary
  palette page and <span class="m">#F3F85B</span> on the supporting palette page; the primary
  value is the one in use. And <b>one grey has two names</b> &mdash; the same warm dark grey is
  called Grey 650 on the palette page and Grey 700 on the contrast page.</div>
"""
    return shell('Colour and type', 'The brand palette with Pantone and CMYK, ABC Repro, and '
                 'where yellow is allowed.',
                 'brand/colour-type.html', body, crumb=['Brand', 'Colour and type'],
                 toc=[('palette', 'The primary palette'), ('print', 'Every value'),
                      ('supporting', 'Supporting ramps'), ('yellow', 'Where yellow is allowed'),
                      ('type', 'Typography'), ('errors', 'Errors in the source')])


def b_imagery():
    body = f"""
<h1>Imagery.</h1>
<p class="lede">Real work, real light, real people. Three categories, one underlying idea, and
   the banded graphic that ties them together.</p>

<div class="note ok"><b>Need the files?</b> All 43 photographs, the fifth element stills and
  the moving loops are on <a href="assets.html">Download assets</a>, in two sizes each.</div>

<h2 id="horizon">The horizon line</h2>
<img src="../assets/img/driver-1400.webp" alt="A driver in a high-visibility jacket at the wheel of a truck, looking at the road ahead."
     width="1400" height="1107" loading="lazy" style="border-radius:4px">
<p class="cap">The view the whole identity is drawn from</p>
<p>One idea sits under everything: the line where the road meets the sky, seen from the
   driver&rsquo;s seat. Verifi&rsquo;s work happens on the road, between the plant and the pour,
   so the identity starts there rather than in the office.</p>
{table(['Where', 'How it shows up'], [
  ['The symbol', 'Two open strokes built on the same angle as a road meeting the horizon.'],
  ['The wordmark', 'The <em>fi</em> ligature carries the line across the top of the word.'],
  ['Layout', 'Pages split by a horizon: image above, content below, or the reverse.'],
  ['The fifth element', 'A photograph stretched into bands, which reads as a road at speed.'],
])}
<div class="note"><b>When a layout is not working, put the horizon back in it.</b> A full-width
  image meeting a block of content on a clean line is almost always the right answer, and it is
  the one move that makes a page look like Verifi rather than like anyone else.</div>

<h2 id="categories">Three categories</h2>
{spec([
  ('Trucks and sites', 'The work as it happens. Wide, low sun, plenty of sky. No posed shots.'),
  ('Hardware', 'The sensor and drum unit in situ, on the truck, dirty. Not on a white background.'),
  ('People', 'Drivers, plant staff, engineers &mdash; doing something, not looking at camera.'),
])}
<img src="../assets/img/hardware-1-1400.webp" alt="The Verifi drum unit mounted on a truck, photographed in profile."
     width="1400" height="475" loading="lazy" style="border-radius:4px">
<p class="cap">Rounded edges on the unit become rounded edges in the interface</p>
{dodont(
  ['Shoot in real conditions, in real light.',
   'Let the equipment be dusty. It is a concrete truck.',
   'Leave room for the horizon in the crop.'],
  ['No stock handshakes, no hard hats in a boardroom.',
   'No heavy filters or colour grades that fight the palette.',
   'No people looking directly at camera.',
   'No product shots on seamless white.'])}

<h2 id="fifth">The fifth element</h2>
<img src="../assets/img/band-h-480.webp" alt="Warm brown and cream horizontal bands derived from a concrete photograph."
     width="2302" height="416" loading="lazy" style="border-radius:4px">
<p class="cap">Horizontal banding &mdash; the view from the driver&rsquo;s side window</p>
<p>A photograph stretched in one direction until it reads like a road passing at speed. The
   starting resolution controls how coarse the bands are.</p>
{table(['Starting image', 'Result'], [
  ['<span class="m">480 &times; 480</span>', 'Fine bands, most detail. Use at large sizes.'],
  ['<span class="m">160 &times; 160</span>', 'Medium. The general-purpose setting.'],
  ['<span class="m">40 &times; 40</span>', 'Coarse blocks. Use when the banding is the whole composition.'],
])}
{spec([
  ('Orientations', 'Horizontal (bands run across, the side window) or vertical (bands run down, '
                   'looking over the hood).'),
  ('Placement', 'Full-bleed, or cropped to 20% or 50% of the height.'),
  ('Alignment', 'The symbol aligns to the centre of the &ldquo;road&rdquo; the banding creates, '
                'not to the centre of the page.'),
  ('Approved sources', 'Concrete, Limestone, Oceanside, Red Sandstone, Forest.'),
])}
<div class="note stop"><b>Three things that break it.</b> Any angle other than 0 or 90 degrees.
  Cropped images that still contain horizontal lines. Placing the banding on the left or right
  rather than across a full edge.</div>

<h2 id="tagline">The tagline</h2>
<img src="../assets/img/tagline-1782.webp" alt="Aggregate in low light with the words: Confidence in concrete."
     width="1782" height="319" loading="lazy" style="border-radius:4px">
<p class="cap">Confidence in concrete &mdash; set in ABC Repro Medium over imagery</p>
"""
    return shell('Imagery', 'The three photographic categories, the horizon line and the fifth '
                 'element.', 'brand/imagery.html', body, crumb=['Brand', 'Imagery'],
                 toc=[('horizon', 'The horizon line'), ('categories', 'Three categories'),
                      ('fifth', 'The fifth element'), ('tagline', 'The tagline')])


# ══════════════════════════════════════════════════════════════
#  OPEN ITEMS
# ══════════════════════════════════════════════════════════════
OPEN = [
 ('01', 'Which blue is the blue?',
  'Brand says <span class="m">#1594EF</span>. The product uses <span class="m">#3069E3</span>, '
  'which appears in neither brand palette. Blue 600 and Blue 900 match exactly, so the product '
  'palette looks derived from the brand one and then edited.',
  'Verifi Design + Brittany Cool', 'Everything blue, in both systems'),
 ('02', 'The Loaded phase pill fails contrast',
  '<span class="m">#887F13</span> with white text measures 4.12:1 against a 4.5:1 requirement. '
  'It is the only one of eighteen phase combinations that misses.',
  'Verifi Design', 'One token — pill, map marker and legend dot all follow'),
 ('03', 'Light-mode <code>--subtle</code> is unreadable',
  '2.87:1 on <code>--layer-1</code> and 2.79:1 on <code>--base</code> — below even the '
  'large-text bar, and it is the placeholder and small-print token.',
  'Verifi Design', 'Every placeholder and caption in the product'),
 ('04', 'Dark mode is not drawn for form fields',
  'The Figma Form Fields page is light mode only. Every dark column on this site is derived '
  'from the surface and ink tokens applied consistently — a reading, not a decision.',
  'Verifi Design', 'Every input in dark mode'),
 ('05', 'There is no link component',
  'The tokens exist (<code>interaction/link</code>, <code>link-visited</code>); nothing is '
  'drawn. The interim rule is on the Button page. Separately, the published link blue '
  '<span class="m">#0975C3</span> measures 3.40:1 on the dark surface and fails.',
  'Verifi Design', 'Every inline link and every entity link in a table'),
 ('06', 'Modal has one size',
  'Only Extra small exists — no S, M or L, no header or footer slot spec, no close-affordance '
  'spec. The widths published on the Modal page are a proposal.',
  'Verifi Design', 'Any modal larger than a confirm dialog'),
 ('07', 'Two names for the same truck phases',
  'The component set says <em>In transit</em> and <em>Return to plant</em>. The tokens say '
  '<em>To job</em> and <em>Returning to plant</em>. Same domain, two dialects.',
  'Verifi Design + Product', 'Phase pills, map, legend, and anything reading the API'),
 ('08', 'The table component does not match the system',
  'Three conflicts left: it binds <b>Montserrat</b> rather than ABC Repro, uses '
  '<b>Font Awesome 6 Pro</b> icons rather than Unicons, and tints selected rows with brand '
  'Blue 0 <span class="m">#EEF9FF</span> rather than product Blue 0. The fourth is settled '
  '&mdash; row checkbox and radio are <b>16&times;16</b>, matching the standalone components, '
  'and the Figma table needs updating to suit.',
  'Verifi Design', 'The product’s single most-used surface'),
 ('09', 'Icons: two libraries, no decision',
  '1,134 Unicons and 281 Feather coexist, plus Font Awesome inside the table component. The '
  'interim rule is Unicons only for new work, Feather frozen, never mixed within one view.',
  'Verifi Design', 'Every icon in the product'),
 ('10', 'The badge dot is invisible on a light page',
  'Two of the three dot colours fail against the light surface — default '
  '<span class="m">#E3F200</span> at 1.07:1 and Information <span class="m">#41A8F2</span> at '
  '2.24:1, against a 3:1 requirement. A dot has no text inside it, so nothing else carries it. '
  'All three pass in dark mode. A 1px ring in the page ink would fix it without losing the '
  'brand colour.',
  'Verifi Design', 'Every notification and unread indicator in light mode'),
 ('11', 'The progress track fails in both components and both themes',
  'Progress bar and Slider both use <span class="m">#DFDEDD</span> in light, which measures '
  '1.16:1 against the page. In dark they diverge — <span class="m">#666054</span> at 2.64:1 and '
  '<span class="m">#393632</span> at 1.37:1 — so they are not actually on one token. Both dark '
  'values were chosen against the pure-black Figma demo rather than the product’s '
  '<span class="m">#211F1C</span>.',
  'Verifi Design', 'Progress bar and Slider, every theme'),
 ('12', 'Tag has no approved colour pairs',
  'Fill and label colour are per-instance overrides by design, so no checked palette exists and '
  'every tag anyone makes is an unchecked contrast risk. The light default '
  '<span class="m">#FFFFFF</span> on <span class="m">#0975C3</span> clears 4.5:1 by a third of '
  'a point, which will not survive recolouring.',
  'Verifi Design', 'Every tag anyone creates from here on'),
 ('13', 'Slider has no focus state',
  'A control that is dragged needs a visible focus ring more than it needs hover, and hover is '
  'the one that exists. There is no disabled state either, and no keyboard step, page step or '
  'Home/End behaviour is defined.',
  'Verifi Design', 'Keyboard and assistive-technology users of every slider'),
 ('14', 'Tooltip is a box with no behaviour',
  'No delay, no transition, no dismissal rule, no trigger rule and no touch behaviour. WCAG '
  '1.4.13 requires hover content to be dismissible, hoverable and persistent; none of the three '
  'is specified. The fixed 24px height also means a tooltip cannot wrap.',
  'Verifi Design', 'Every tooltip, and keyboard users especially'),
 ('15', 'The link blue fails on tinted table rows',
  'The product link colour <span class="m">#0975C3</span> measures 4.17:1 on a striped row '
  '<span class="m">#F0EEEA</span> and 3.60:1 on a disabled row <span class="m">#DFDEDD</span>, '
  'against the 4.5:1 AA requirement. It passes on a plain white row at 4.83:1, so the failure '
  'only appears in the two states a long table spends half its time in. '
  '<span class="m">#0A5F9D</span> clears every row background at 5.9:1 or better.',
  'Verifi Design', 'Every entity link in every table'),
]


def open_items():
    rows = ''
    for n, title, detail, who, blast in OPEN:
        rows += ('<tr><td class="m">%s</td><td class="wrap"><b>%s</b><br>'
                 '<span style="color:var(--ink-soft)">%s</span></td>'
                 '<td class="wrap">%s</td><td class="wrap">%s</td></tr>'
                 % (n, title, detail, who, blast))

    body = f"""
<h1>Open items.</h1>
<p class="lede">{len(OPEN)} questions this system cannot answer on its own, written down rather
   than guessed at. Everything else on this site is a rule; this page is the list of things that
   are not yet rules.</p>

<div class="note"><b>Why a page like this exists.</b> A design system that only publishes its
  settled parts teaches people to trust it uniformly, which means they trust the unsettled parts
  too. Naming the gaps costs a page and saves the argument that happens six weeks into a sprint.</div>

<h2 id="register">The register</h2>
<div class="tw"><table>
  <thead><tr><th class="m">#</th><th>Question</th><th>Needs</th><th>Affects</th></tr></thead>
  <tbody>{rows}</tbody>
</table></div>

<h2 id="closed">Settled, so nobody reopens them</h2>
{checklist([
  '<b>Nav and segmented active colour:</b> blue in light, lime in dark. The lime-in-light '
  'screenshot was an error, not intent.',
  '<b>Table framing:</b> full-bleed for primary page tables, boxed for tables inside widgets '
  'and cards.',
  '<b>Stat band order:</b> label above the number.',
  '<b>Scope bar:</b> cut. Session scope lives in the sidebar account picker and the scope bar '
  'will not be in the Verifi build.',
  '<b>Phase pills flip with the theme.</b> The static solid-in-both-modes prototype is overruled.',
  '<b>Yellow is a domain boundary, not a conflict.</b> Marketing call to action; product '
  'dark-mode selection. Both correct.',
])}

<h2 id="brandfile">Two errors inside the brand file itself</h2>
{checklist([
  '<b>Verifi Yellow has two values.</b> <span class="m">#E3F200</span> on the primary palette '
  'page, <span class="m">#F3F85B</span> on the supporting palette page. The primary value is '
  'the one in use.',
  '<b>One grey has two names.</b> The same warm dark grey is called Grey 650 on the palette page '
  'and Grey 700 on the contrast page.',
])}

<h2 id="raise">Raising something</h2>
<p>If you find another open question, it belongs here rather than in a thread. Brand questions
   go to Brittany Cool; product questions go to Verifi Design. Include the node ID &mdash; every
   component page lists them.</p>
"""
    return shell('Open items',
                 '%d open questions, written down instead of guessed at.' % len(OPEN),
                 'open-items.html', body,
                 toc=[('register', 'The register'), ('closed', 'Settled'),
                      ('brandfile', 'Errors in the brand file'), ('raise', 'Raising something')])
