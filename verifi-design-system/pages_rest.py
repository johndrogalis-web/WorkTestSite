#!/usr/bin/env python3
"""The remaining section pages."""
from build import shell, write, MARK, ARROW, COPYICON, nextprev
from pages_sections import cards, tf, PHASES, CHEV, SEARCH, CLEAR, ALERT

LOGO = MARK.split('>', 1)[1].rsplit('</svg>', 1)[0]


def copybar(title, key, tag=''):
    t = '<span class="tag">%s</span>' % tag if tag else ''
    return ('<div class="barline"><span class="t">%s</span>%s'
            '<button class="copy" data-copy="%s">%s<span class="copy-label">Copy CSS</span>'
            '</button></div>' % (title, t, key, COPYICON))


def snip(key, text):
    import html as H
    return '<script type="text/plain" id="snip-%s">%s</script>' % (key, H.escape(text))


def bench(l, d=None, cap=None):
    d = d if d is not None else l
    out = ('<div class="bench">'
           '<div class="pane pane-l"><div class="ph">Light</div><div class="pb">%s</div></div>'
           '<div class="pane pane-d"><div class="ph">Dark</div><div class="pb">%s</div></div>'
           '</div>' % (l, d))
    if cap:
        out += '<p class="cap">%s</p>' % cap
    return out


def brow(label, inner):
    return '<div class="brow"><span class="bl">%s</span>%s</div>' % (label, inner)


# ══════════════════════════════════════════════════════════════
#  BRAND — remaining
# ══════════════════════════════════════════════════════════════
def brand_colour():
    rows = [('Verifi Blue', '#1594EF', '2192 U / C', '91 · 38 · 0 · 6'),
            ('Verifi Yellow', '#E3F200', '—', '17 · 0 · 100 · 2'),
            ('Grey 100', '#FAF9F6', '—', '0 · 0 · 2 · 2'),
            ('Grey 200', '#EBE7E1', 'Warm Gray 1', '0 · 2 · 4 · 8'),
            ('Grey 650', '#706A5C', 'Warm Gray 9', '0 · 5 · 18 · 56'),
            ('Black', '#2E2B27', '426 U / C', '0 · 7 · 15 · 82'),
            ('White', '#FFFFFF', '—', '0 · 0 · 0 · 0')]
    tbl = ''.join('<tr><td><span class="sw" style="background:%s"></span>%s</td>'
                  '<td class="m">%s</td><td class="m">%s</td><td class="m">%s</td></tr>'
                  % (h, n, h, p, c) for n, h, p, c in rows)
    sw = ''.join('<div><span class="chip" style="background:%s"></span><span class="meta">'
                 '<span class="nm">%s</span><span class="hx">%s</span>'
                 '<span class="pm">%s</span></span></div>' % (h, n, h, p)
                 for n, h, p, c in rows)
    body = f"""
<p class="eyebrow">Brand</p>
<h1>Colour.</h1>
<p class="lede">Black, white and warm greys carry almost everything. Blue and yellow are
   applied purposefully, never as decoration.</p>

<div class="swatches">{sw}</div>

<h2 id="print">Every value, including print</h2>
<div class="tw"><table>
  <thead><tr><th>Name</th><th class="m">Hex</th><th class="m">Pantone</th><th class="m">CMYK</th></tr></thead>
  <tbody>{tbl}</tbody>
</table></div>

<h2 id="supporting">Supporting ramps</h2>
<p>Blue and yellow each extend four steps, for data visualisation, hierarchy and depth. The
   rule the guidelines give is blunt: <strong>supporting colours must not be used purely for
   decoration</strong> — they exist to reinforce the primary palette and make information
   clearer.</p>
<div class="ramp" style="margin-bottom:14px">
  <span style="background:#EEF9FF;color:#032d3d">EEF9FF</span>
  <span style="background:#1594EF;color:#fff">1594EF</span>
  <span style="background:#0975C3;color:#fff">0975C3</span>
  <span style="background:#032D3D;color:#fff">032D3D</span>
</div>
<div class="ramp">
  <span style="background:#FEFFD6;color:#2b2712">FEFFD6</span>
  <span style="background:#F3F85B;color:#2b2712">F3F85B</span>
  <span style="background:#6C632A;color:#fff">6C632A</span>
  <span style="background:#2B2712;color:#fff">2B2712</span>
</div>
<p class="cap">Blue 0 / Verifi Blue / Blue 600 / Blue 900 &nbsp;&middot;&nbsp; Yellow 100 / Verifi Yellow / Yellow 800 / Yellow 900</p>

<h2 id="yellow">What yellow is for</h2>
<p>Yellow is the attention colour in brand-facing work: <strong>calls to action, buttons,
   callouts and headline type over imagery.</strong> The live site uses it for
   &ldquo;Request a demo&rdquo;, and this site uses it the same way.</p>
<div class="note"><b>Inside the product it means something else.</b> In the Hub, yellow is the
  dark-mode selection colour and nothing else — a yellow button there reads as a highlighted
  row. Same colour, two rulebooks, split by where you are working.
  <a href="../foundations/colour.html">See the product rules</a>.</div>

<h2 id="proportion">Proportion</h2>
<p>The guidelines put it plainly: the brand is <strong>primarily black and white</strong>,
   with colour applied strategically. In practice that means a page is mostly neutral and
   colour occupies a narrow band of it.</p>

<h2 id="wrong">Four things not to do</h2>
<div class="tw"><table><tbody>
  <tr><td class="wrap">No full-bleed colour</td><td>Backgrounds are grey or white. Other colours appear only in accents or contained bands.</td></tr>
  <tr><td class="wrap">No mixing primaries</td><td>One primary colour per composition. Blue and yellow together in one layout is a build error.</td></tr>
  <tr><td class="wrap">Nothing that fails contrast</td><td>Text on a coloured background uses the lightest or darkest step of that colour&rsquo;s own scale.</td></tr>
  <tr><td class="wrap">Only two colours on imagery</td><td>Verifi Yellow or white. Nothing else goes over a photograph.</td></tr>
</tbody></table></div>

{nextprev(('logo.html','Logo'), ('type.html','Typography'))}
"""
    return shell('Colour', 'The Verifi brand palette, with Pantone and CMYK values.',
                 'brand', 'colour.html', body,
                 toc=[('print', 'Every value'), ('supporting', 'Supporting ramps'),
                      ('yellow', 'What yellow is for'), ('proportion', 'Proportion'),
                      ('wrong', 'What not to do')])


def brand_type():
    specs = [('Large headline', 72, 'Light or Regular', '&minus;1.5% &middot; 95% leading'),
             ('Medium headings', 36, 'Light or Regular', '0% &middot; 110% leading'),
             ('Body copy', 18, 'Light or Regular', '0% &middot; 125% leading &middot; base size'),
             ('Captions', 14, 'Medium', '2% &middot; 135% leading')]
    rows = ''.join('<tr><td class="wrap">%s</td><td class="m">%s pt</td><td>%s</td>'
                   '<td class="m">%s</td></tr>' % (n, s, w, t) for n, s, w, t in specs)
    body = f"""
<p class="eyebrow">Brand</p>
<h1>Typography.</h1>
<p class="lede">ABC Repro, in three weights, sized by multiples of an 18pt base.</p>

<div class="plate" style="justify-content:flex-start;flex-direction:column;align-items:flex-start;gap:18px">
  <div style="font-size:clamp(40px,7vw,72px);line-height:.98;letter-spacing:-.04em">Confidence in concrete</div>
  <div style="font-size:clamp(22px,3vw,36px);line-height:1.1;letter-spacing:-.02em;color:var(--ink-soft)">Point A to B with confidence</div>
  <div style="font-size:18px;line-height:1.25;max-width:52ch;color:var(--ink-soft)">In-transit control ensures the right load, with the right spec, is delivered every time.</div>
</div>

<h2 id="scale">The scale</h2>
<div class="tw"><table>
  <thead><tr><th>Role</th><th class="m">Size</th><th>Weight</th><th class="m">Tracking &amp; leading</th></tr></thead>
  <tbody>{rows}</tbody>
</table></div>
<p>Everything is a multiple of the <strong>18pt base</strong>: body &times;1, headings &times;2,
   large headline &times;4, captions &times;0.6.</p>

<h2 id="settings">Three settings that matter</h2>
<div class="tw"><table><tbody>
  <tr><td class="wrap">Always left-aligned</td><td>Every format, with one exception — buttons.</td></tr>
  <tr><td class="wrap">Leading by role</td><td>Tight for headlines, around 90%. Generous for body, 115&ndash;130%. Legibility wins over impact in body copy.</td></tr>
  <tr><td class="wrap">Tracking by role</td><td>Headlines tighter, around &minus;1.5%. Body from 0 to +2%.</td></tr>
</tbody></table></div>

<h2 id="alternates">The letterforms we choose</h2>
<p>ABC Repro ships alternates, and the brand picks specific ones because they echo the
   wordmark and the hardware.</p>
<div class="tw"><table><tbody>
  <tr><td class="wrap">Circular dots</td><td>On the i and j, reflecting the forms in the wordmark.</td></tr>
  <tr><td class="wrap">Curved t, l, j, y</td><td>Curved tails rather than straight, echoing the hardware.</td></tr>
  <tr><td class="wrap">Sharp numbers</td><td>Sharp arms and legs rather than the rounded alternate.</td></tr>
  <tr><td class="wrap">Single-storey a</td><td>Emphasises the geometric form.</td></tr>
  <tr><td class="wrap">Circular callouts</td><td>Retained for data points and numbers we want to emphasise.</td></tr>
</tbody></table></div>

<h2 id="pill">The pill</h2>
<p>A rounded highlight drawn around <strong>a number</strong> — <code>25%</code>,
   <code>3.2B</code>, <code>100KG</code> — to make a figure stand out. ABC Repro has a built-in
   setting that creates them; in Helvetica they must be drawn and centred by hand.</p>
<div class="plate" style="justify-content:flex-start;gap:12px;flex-wrap:wrap">
  <span style="background:var(--yellow);border-radius:100px;padding:5px 15px;font-size:19px;font-weight:500">25%</span>
  <span style="background:var(--blue-0);border-radius:100px;padding:5px 15px;font-size:19px;font-weight:500">1.7M</span>
  <span style="background:var(--inset);border-radius:100px;padding:5px 15px;font-size:19px;font-weight:500">248KM</span>
</div>
<div class="note"><b>Three rules for pills.</b> One word only. Never lower case. Never an
  actionable word — a pill is emphasis, not a button.</div>

<div class="note stop"><b>Licensing.</b> In the design file the large sizes are still set in a
  <em>trial</em> copy of ABC Repro. That version must never leave Figma; anything published or
  printed uses the licensed family.</div>

{nextprev(('colour.html','Colour'), ('imagery.html','Imagery'))}
"""
    return shell('Typography', 'ABC Repro and the Verifi type scale.',
                 'brand', 'type.html', body,
                 toc=[('scale', 'The scale'), ('settings', 'Settings'),
                      ('alternates', 'Letterforms'), ('pill', 'The pill')])


def brand_imagery():
    body = f"""
<p class="eyebrow">Brand</p>
<h1>Imagery.</h1>
<p class="lede">Three categories, one tone: warm, real and human, even when the subject is
   a machine.</p>

<img src="../assets/img/driver-800.webp" alt="A driver at the wheel of a truck in low sun."
     width="800" height="632" loading="lazy" style="border-radius:3px">

<h2 id="categories">The three categories</h2>
<div class="tw"><table>
  <thead><tr><th>Category</th><th>What it shows</th></tr></thead>
  <tbody>
    <tr><td>People</td><td>How the technology changes life and work, through users and employees. Connection, collaboration, impact.</td></tr>
    <tr><td>Transit</td><td>The journey from plant to pour, and the places it connects — cities, rural roads, construction sites.</td></tr>
    <tr><td>Technology</td><td>Hardware and software, shot warmly and connected to the people and places that use them.</td></tr>
  </tbody>
</table></div>

<h2 id="tone">Tone</h2>
<p>Low, warm light. Real environments rather than studio setups. The subject is usually small
   in the frame with plenty of room around it — which is what makes these images work under a
   headline.</p>

<div class="note"><b>Rights.</b> The images in the Identity Guidelines are inspiration only —
  Verifi does not own them and they cannot be published externally. The photography on this
  site is from the approved Verifi library. Check with Brittany Cool before using anything in
  a customer-facing piece.</div>

{nextprev(('type.html','Typography'), ('fifth-element.html','Fifth element'))}
"""
    return shell('Imagery', 'The three photographic categories and their tone.',
                 'brand', 'imagery.html', body,
                 toc=[('categories', 'Categories'), ('tone', 'Tone')])


def brand_fifth():
    body = f"""
<p class="eyebrow">Brand</p>
<h1>Fifth element.</h1>
<p class="lede">A photograph stretched into bands until it reads like a road passing at
   speed. The brand&rsquo;s signature graphic, and the one thing nobody else has.</p>

<img src="../assets/img/band-h-480.webp" alt="Warm brown and cream vertical bands derived from a concrete photograph."
     width="2302" height="416" loading="lazy" style="border-radius:3px">
<p class="cap">Horizontal banding &mdash; the view from the driver&rsquo;s side window</p>

<h2 id="how">How it is made</h2>
<p>It starts as a square photograph and is stretched in one direction. The starting resolution
   controls how coarse the bands are, and the guidelines define three:</p>
<div class="tw"><table>
  <thead><tr><th class="m">Starting image</th><th>Result</th></tr></thead>
  <tbody>
    <tr><td class="m">480 &times; 480</td><td>Fine bands, the most detail. Use at large sizes.</td></tr>
    <tr><td class="m">160 &times; 160</td><td>Medium. The general-purpose setting.</td></tr>
    <tr><td class="m">40 &times; 40</td><td>Coarse blocks. Use when the banding is the whole composition.</td></tr>
  </tbody>
</table></div>
<div class="bench">
  <div class="pane pane-l"><div class="ph">480 &mdash; fine</div>
    <div class="pb" style="padding:0"><img src="../assets/img/band-h-480.webp" alt="Fine banding" width="2302" height="416" loading="lazy"></div></div>
  <div class="pane pane-l"><div class="ph">40 &mdash; coarse</div>
    <div class="pb" style="padding:0"><img src="../assets/img/band-h-40.webp" alt="Coarse banding" width="2292" height="424" loading="lazy"></div></div>
</div>

<h2 id="orientation">Two orientations</h2>
<div class="tw"><table><tbody>
  <tr><td class="wrap">Horizontal banding</td><td>The driver-side window. Bands run across.</td></tr>
  <tr><td class="wrap">Vertical banding</td><td>Looking over the hood. Bands run down.</td></tr>
</tbody></table></div>

<h2 id="placement">Placement and cropping</h2>
<p>It sits full-bleed, or cropped to 20% or 50% of the height. The symbol aligns to the centre
   of the &ldquo;road&rdquo; the banding creates, not to the centre of the page.</p>
<div class="note stop"><b>Three things that break it.</b> Any angle other than 0 or 90
  degrees. Cropped images that still contain horizontal lines. Placing the banding on the left
  or right rather than across a full edge.</div>

<h2 id="library">The library</h2>
<p>Five source images are approved: <strong>Concrete, Limestone, Oceanside, Red Sandstone</strong>
   and <strong>Forest</strong>. The banding on this site is Concrete, and it is what the 5px rule
   between every chapter is made from.</p>
<hr class="horizon" style="margin:20px 0">
<p class="cap">That rule, at actual size</p>

{nextprev(('imagery.html','Imagery'), ('voice.html','Voice'))}
"""
    return shell('Fifth element', 'The banded graphic that reads like a road at speed.',
                 'brand', 'fifth-element.html', body,
                 toc=[('how', 'How it is made'), ('orientation', 'Orientations'),
                      ('placement', 'Placement'), ('library', 'The library')])


def brand_voice():
    body = f"""
<p class="eyebrow">Brand</p>
<h1>Voice.</h1>
<p class="lede">Write like a good plant manager talks: specific, calm, never dramatic about a
   problem and never vague about a number.</p>

<h2 id="traits">Five traits</h2>
<div class="tw"><table>
  <thead><tr><th>Aim for</th><th>Like this</th><th>Not this</th></tr></thead>
  <tbody>
    <tr><td class="wrap">Specific</td><td>&ldquo;Slump held at 118 mm. 14.2 L added at 11:42.&rdquo;</td><td>&ldquo;Slump optimised in transit.&rdquo;</td></tr>
    <tr><td class="wrap">Calm</td><td>&ldquo;Sensor offline since 09:14. Last reading 122 mm.&rdquo;</td><td>&ldquo;Critical failure! Immediate action required!&rdquo;</td></tr>
    <tr><td class="wrap">Plain</td><td>&ldquo;This load is 8 minutes from the job.&rdquo;</td><td>&ldquo;ETA telemetry indicates proximate arrival.&rdquo;</td></tr>
    <tr><td class="wrap">Accountable</td><td>&ldquo;We could not reach the drum unit. Here is what we know.&rdquo;</td><td>&ldquo;An error occurred.&rdquo;</td></tr>
    <tr><td class="wrap">Not selling in-product</td><td>&ldquo;Add a plant.&rdquo;</td><td>&ldquo;Unlock the power of your fleet!&rdquo;</td></tr>
  </tbody>
</table></div>

<h2 id="name">The name</h2>
<p><strong>Verifi</strong> &mdash; one f, one i, small f. Use <em>Verifi&reg;</em> and
   <em>Verifi Pulse&reg;</em> the first time they appear prominently in a document, then plain
   afterwards. Never &ldquo;VERIFI&rdquo; in a sentence. Never &ldquo;Verify&rdquo;.</p>
<p>The tagline is <strong>Confidence in concrete</strong>.</p>

<h2 id="micro">In the product</h2>
<div class="tw"><table><tbody>
  <tr><td class="wrap">Buttons say what happens</td><td>&ldquo;Send to plant&rdquo;, not &ldquo;Submit&rdquo;.</td></tr>
  <tr><td class="wrap">Errors say what to do</td><td>What failed, what it affects, the one next step. Never a code alone.</td></tr>
  <tr><td class="wrap">Real times, not relative</td><td>&ldquo;11:42&rdquo; beats &ldquo;a few minutes ago&rdquo; for anything that might end up in a dispute.</td></tr>
</tbody></table></div>

{nextprev(('fifth-element.html','Fifth element'), ('../foundations/index.html','Foundations'))}
"""
    return shell('Voice', 'How Verifi writes.', 'brand', 'voice.html', body,
                 toc=[('traits', 'Five traits'), ('name', 'The name'), ('micro', 'In the product')])
