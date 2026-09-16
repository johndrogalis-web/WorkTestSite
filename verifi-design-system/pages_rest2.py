#!/usr/bin/env python3
"""Foundations, Components and Resources."""
from build import shell, MARK, ARROW, COPYICON, nextprev
from pages_sections import cards, tf, PHASES, CHEV
from pages_rest import copybar, snip, bench, brow

# ══════════════════════════════════════════════════════════════
#  FOUNDATIONS
# ══════════════════════════════════════════════════════════════
def f_index():
    body = f"""
<p class="eyebrow">Foundations</p>
<h1>The product half.</h1>
<p class="lede">Colour, type, spacing and motion as the Hub actually uses them. These come
   from Trinity, the design system behind the product, and they are what a developer types.</p>
{cards([
  ('colour.html','Colour','Tokens for both themes, the three jobs colour is allowed to do, and where the product disagrees with the brand.'),
  ('type.html','Type','The published styles, and the two weights the product uses.'),
  ('shape-motion.html','Shape and motion','Four radii, a 4px grid, no shadows, and movement that never bounces.'),
  ('phases.html','Truck phases','Nine colours for the nine stages of a load, measured in both themes.'),
  ('accessibility.html','Accessibility','What passes, what does not, and the two failures we have written down.'),
])}
{nextprev(('../brand/voice.html','Voice'), ('colour.html','Colour'))}
"""
    return shell('Foundations', 'Product tokens for colour, type, shape and motion.',
                 'foundations', 'index.html', body)


def f_colour():
    ink = [('--strong', '#36322dff', 'Headings'), ('--defined', '#36322dc2', 'Body text'),
           ('--soft', '#36322d9e', 'Secondary'), ('--subtle', '#36322d80', 'Small print')]
    inkd = [('--strong', '#ffffffff', 'Headings'), ('--defined', '#e5e5e5de', 'Body text'),
            ('--soft', '#e5e5e5bf', 'Secondary'), ('--subtle', '#e5e5e566', 'Small print')]
    surf = {'light': [('--layer-1', '#ffffff'), ('--base', '#f6f4f2')],
            'dark': [('--layer-1', '#211f1c'), ('--base', '#171614'), ('--layer-2', '#2f2d28')]}

    css = """/* Verifi product colour tokens — Trinity v0.1.3 */
:root {
  --base:        #f6f4f2;   /* page behind the main panel */
  --layer-1:     #ffffff;   /* the content card, drawers, widgets */
  --layer-2:     #f6f4f2;   /* inset areas, inputs, alternate rows */
  --strong:      #36322d;   /* headings  (brand black is #2E2B27) */
  --defined:     #36322dc2; /* body and table text */
  --soft:        #36322d9e; /* secondary text */
  --subtle:      #36322d80; /* placeholders, small print */
  --border:      #36322d24;
  --border-mid:  rgba(54,50,45,0.30);
  --blue:        #3069e3;   /* NOT the brand blue — see Brand vs product */
  --blue-link:   #295ccc;
  --select:      #3069e3;   /* the item you are on */
  --on-select:   #ffffff;
  --red:         #d70100;   /* errors — product only */
  --amber:       #ffba0d;   /* warnings — product only */
  --radius-sm:   4px;
  --radius-md:   16px;
  --radius-lg:   20px;
  --radius-pill: 32px;
  --font:        'ABC Repro', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --font-mono:   'DM Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* Dark mode. Only these values change. */
body.dark {
  --base:        #171614;
  --layer-1:     #211f1c;
  --layer-2:     #2f2d28;
  --strong:      #ffffff;
  --defined:     #e5e5e5de;
  --soft:        #e5e5e5bf;
  --subtle:      #e5e5e566;
  --border:      #e5e5e51f;
  --border-mid:  rgba(229,229,229,0.25);
  --blue:        #6492f1;
  --blue-link:   #6492f1;
  --select:      #e3f200;
  --on-select:   #000000;
}"""

    conflicts = [
        ('Brand blue', '#1594EF', '#3069E3',
         'The product blue is in neither brand palette. This is drift.'),
        ('Black', '#2E2B27', '#36322D',
         'Close enough to look identical, far enough to fail a match.'),
        ('Lightest grey', '#FAF9F6', '#F6F4F2', 'Two different off-whites doing one job.'),
        ('Dark grey', '#706A5C', '#7F796C', 'The brand one carries a Pantone; ours does not.'),
        ('Pale blue', '#EEF9FF', '#C5E4FB', 'Our accent fill is deeper than the brand step.'),
    ]
    crows = ''.join(
        '<tr><td class="wrap">%s</td><td class="m"><span class="sw" style="background:%s"></span>%s</td>'
        '<td class="m"><span class="sw" style="background:%s"></span>%s</td><td class="wrap">%s</td></tr>'
        % (n, b, b, p, p, note) for n, b, p, note in conflicts)

    body = f"""
<p class="eyebrow">Foundations</p>
<h1>Colour.</h1>
<p class="lede">Nearly everything on a Verifi screen is a warm grey. Colour is only allowed
   three jobs: show what is selected, warn you, or say which phase a truck is in.</p>

<h2 id="jobs">The three jobs</h2>
<div class="tw"><table>
  <thead><tr><th>Job</th><th>Colour</th><th>Used for</th></tr></thead>
  <tbody>
    <tr><td class="wrap">Selection</td><td class="wrap">Blue in light,<br>yellow in dark</td><td>The menu item or tab you are on. Nothing else, ever.</td></tr>
    <tr><td class="wrap">Warning</td><td class="wrap">Red and amber</td><td>Small badges with an icon and a count. Not backgrounds, not headings.</td></tr>
    <tr><td class="wrap">Phase</td><td class="wrap">Nine phase colours</td><td>Truck phase labels, map pins, the map key. Nothing else.</td></tr>
    <tr><td class="wrap">Everything else</td><td class="wrap">The grey range</td><td>All backgrounds, text, lines and borders.</td></tr>
  </tbody>
</table></div>

<h2 id="tokens">The tokens</h2>
{copybar('Every product colour', 'tokens', 'light and dark')}
{snip('tokens', css)}
{bench(
  ''.join(brow(n + ' &middot; ' + u,
    '<span style="color:%s;font-size:15px">Slump held at 118 mm</span>' % h)
    for n, h, u in ink),
  ''.join(brow(n + ' &middot; ' + u,
    '<span style="color:%s;font-size:15px">Slump held at 118 mm</span>' % h)
    for n, h, u in inkd),
  'Text colours are a percentage of black or white over whatever is behind them, not fixed greys.')}

<h2 id="conflict">Where this disagrees with the brand</h2>
<p>Five values differ between the brand palette and the product tokens. None of them is a
   disaster, all of them are worth knowing about, and one is genuine drift.</p>
<div class="tw"><table>
  <thead><tr><th>Colour</th><th class="m">Brand</th><th class="m">Product</th><th>Note</th></tr></thead>
  <tbody>{crows}</tbody>
</table></div>
<div class="note warn"><b>The one to fix.</b> The product&rsquo;s blue is
  <code>#3069E3</code>, which appears in neither the primary nor the supporting brand palette.
  The brand blue is <code>#1594EF</code>. Either the product moves, or the difference gets a
  written reason. <a href="../resources/open-items.html">It is on the list</a>.</div>
<p>Two product colours <em>do</em> match the brand exactly: the action blue
   <code>#0975C3</code> is the brand&rsquo;s Blue 600, and the pressed blue
   <code>#032D3D</code> is Blue 900. Those are right and should stay.</p>

<h2 id="yellow">Yellow, in the product</h2>
<p>Inside the Hub, yellow is the dark-mode selection colour and nothing else. A yellow button
   in the product reads as a highlighted row. In marketing it is the call to action — same
   colour, different rulebook. <a href="../brand/colour.html">The brand side is here</a>.</p>

{nextprev(('index.html','Foundations'), ('type.html','Type'))}
"""
    return shell('Colour', 'Product colour tokens for both themes, and where they differ from the brand.',
                 'foundations', 'colour.html', body,
                 toc=[('jobs', 'The three jobs'), ('tokens', 'The tokens'),
                      ('conflict', 'Brand vs product'), ('yellow', 'Yellow')])


def f_type():
    body = f"""
<p class="eyebrow">Foundations</p>
<h1>Type.</h1>
<p class="lede">ABC Repro in two weights. The brand uses three and measures in points; the
   product uses two and measures in pixels.</p>

<h2 id="scale">The everyday sizes</h2>
<div class="tw"><table>
  <thead><tr><th>Style</th><th class="m">Size</th><th>Weight</th><th>Used for</th></tr></thead>
  <tbody>
    <tr><td class="wrap">Title / lg</td><td class="m">24 px</td><td>Medium</td><td>Page titles, tracked &minus;0.72px</td></tr>
    <tr><td class="wrap">Title / md</td><td class="m">20 px</td><td>Medium</td><td>Section headings</td></tr>
    <tr><td class="wrap">Title / sm</td><td class="m">16 px</td><td>Medium</td><td>Card headings</td></tr>
    <tr><td class="wrap">Body Loud / sm</td><td class="m">14 px</td><td>Medium</td><td>Button labels</td></tr>
    <tr><td class="wrap">Body / md</td><td class="m">16 px</td><td>Regular</td><td>Reading text</td></tr>
    <tr><td class="wrap">Body / sm</td><td class="m">14 px</td><td>Regular</td><td>Table cells</td></tr>
    <tr><td class="wrap">Body Loud / xs</td><td class="m">12 px</td><td>Medium</td><td>Badges and labels</td></tr>
  </tbody>
</table></div>
<p>Trinity publishes <strong>twenty styles</strong> in five families, up to 216px. Nine of
   them have no home in a dashboard — the Display and Headline tiers exist for brand work,
   and <a href="../brand/type.html">that is where they belong</a>.</p>

<h2 id="weights">Two weights only</h2>
<p>Regular and Medium. <strong>No Bold, no Light, no italic</strong> in the product. If Medium
   is not enough emphasis, the layout is the problem.</p>
<div class="note warn"><b>A gap worth knowing.</b> The brand uses ABC Repro Light for large
  headlines. The product publishes only Regular and Medium, so a product screen cannot match a
  brand headline even when it should.</div>

<h2 id="mono">The second typeface</h2>
<p>DM Mono is <strong>product-only</strong> — it is not in the Identity Guidelines at all.
   Keep it to version tags and serial numbers inside a detail panel. Table columns stay in ABC
   Repro, numbers included, because a table set in mono looks like a log file.</p>

{nextprev(('colour.html','Colour'), ('shape-motion.html','Shape and motion'))}
"""
    return shell('Type', 'The product type scale.', 'foundations', 'type.html', body,
                 toc=[('scale', 'The sizes'), ('weights', 'Weights'), ('mono', 'Mono')])


def f_shape():
    radii = [(4, '--radius-sm', 'labels, code, small chips'),
             (16, '--radius-md', 'cards, panels, badges'),
             (20, '--radius-lg', 'large surfaces'),
             (32, '--radius-pill', 'buttons, inputs, pills')]
    plates = ''.join(
        '<figure style="margin:0;text-align:center"><div style="width:96px;height:96px;'
        'background:var(--inset);border:1px solid var(--rule-mid);border-radius:%dpx"></div>'
        '<figcaption class="cap" style="margin:12px 0 0">%dpx<br>%s<br>%s</figcaption></figure>'
        % (r, r, t, u) for r, t, u in radii)
    body = f"""
<p class="eyebrow">Foundations</p>
<h1>Shape and motion.</h1>
<p class="lede">Four corner roundings, spacing in fours, no shadows anywhere, and movement
   that is quick and never bouncy.</p>

<div class="plate" style="justify-content:flex-start;gap:22px">{plates}</div>
<p><strong>Everything you can click is fully rounded.</strong> The radius does not change with
   size, which is what makes a 20px phase label and a 44px button feel like one family. The
   rounded corner is a brand idea before it is a product one — the Identity Guidelines trace it
   to the hardware.</p>
<div class="note warn"><b>Three answers exist for this.</b> The working code says 20 and 32,
  an older file says 24, the brand settings say fully round. Use the code&rsquo;s numbers for
  now.</div>

<h2 id="space">Spacing</h2>
<p>All gaps are multiples of four: <strong>4, 8, 12, 16, 24, 32</strong>. Page margins are
   24px. Anything clickable in a toolbar is 44px tall — the smallest comfortable target for a
   gloved thumb.</p>

<h2 id="shadow">No shadows</h2>
<p>The product is flat. Separation comes from a change of background and a thin line, never a
   drop shadow. Trinity publishes exactly one shadow and it is the glow around a
   keyboard-focused element.</p>

<h2 id="motion">Movement</h2>
<p>Colour changes take about <strong>an eighth of a second</strong>. Side panels slide in over
   about a third. <strong>Nothing bounces or springs.</strong> In a moving truck, a button that
   wobbles under your finger is one you miss.</p>
<p>Anything that animates has a reduced-motion path. This site has one authored moment — the
   logo reveal on first load — and it is skipped entirely if your system asks for less motion.</p>

{nextprev(('type.html','Type'), ('phases.html','Truck phases'))}
"""
    return shell('Shape and motion', 'Radii, spacing, elevation and movement.',
                 'foundations', 'shape-motion.html', body,
                 toc=[('space', 'Spacing'), ('shadow', 'No shadows'), ('motion', 'Movement')])


def f_phases():
    lt = ''.join('<span class="c-phase" style="background:%s;color:#fff">%s</span>' % (s, n)
                 for n, k, s, t in PHASES)
    dk = ''.join('<span class="c-phase" style="background:%s;color:#171614">%s</span>' % (t, n)
                 for n, k, s, t in PHASES)
    rows = ''.join('<tr><td>%s</td><td class="m"><span class="sw" style="background:%s"></span>%s</td>'
                   '<td class="m"><span class="sw" style="background:%s"></span>%s</td></tr>'
                   % (n, s, s, t, t) for n, k, s, t in PHASES)
    css = "/* Verifi truck phase colours — product only */\n.phase {\n  display: inline-flex;\n  align-items: center;\n  padding: 4px 10px;\n  border-radius: 32px;\n  font: 400 12px/1 'ABC Repro', Helvetica, sans-serif;\n  color: #ffffff;\n}\nbody.dark .phase { color: #171614; }\n\n"
    css += ''.join('.phase-%-17s { background: %s; }   /* %s */\n' % (k, s, n)
                   for n, k, s, t in PHASES)
    css += '\nbody.dark {\n'
    css += ''.join('  .phase-%-17s { background: %s; }\n' % (k, t) for n, k, s, t in PHASES)
    css += ('}\n\n/* KNOWN PROBLEM: white on the "Loaded" olive (#887f13) measures\n'
            '   4.12:1, below the 4.5:1 pass mark. #7a7211 clears it at 4.95:1. */')
    body = f"""
<p class="eyebrow">Foundations</p>
<h1>Truck phases.</h1>
<p class="lede">Nine colours for the nine stages of a load. They exist only in the product,
   the brand book has never seen them, and the label text is never optional.</p>

<p>A load moves through the same nine stages every time, and its colour is the same wherever
   it appears: the pin on the map, the label on the card, the dot in the key. One setting
   drives all three.</p>

<h2 id="flip">The labels swap over in dark mode</h2>
<p><strong>Light is the solid strong colour with white text. Dark is the pale tint with
   near-black text.</strong> A dark label on a dark screen is a bug.</p>
{copybar('All nine phases', 'phases', 'both themes')}
{snip('phases', css)}
{bench('<div class="binline">' + lt + '</div>', '<div class="binline">' + dk + '</div>',
       'Both sets shown together whatever theme you are in, because specifying this means giving both.')}

<h2 id="values">The values</h2>
<div class="tw"><table>
  <thead><tr><th>Phase</th><th class="m">Light</th><th class="m">Dark</th></tr></thead>
  <tbody>{rows}</tbody>
</table></div>

<h2 id="rules">Four rules</h2>
<div class="tw"><table><tbody>
  <tr><td class="wrap">Never decorative</td><td>A phase colour in a chart or a marketing panel breaks the link between colour and meaning.</td></tr>
  <tr><td class="wrap">Never a notification dot</td><td>The dot meaning &ldquo;unread&rdquo; is a different thing with a different colour.</td></tr>
  <tr><td class="wrap">Always show the words</td><td>Nine colours is more than anyone reliably tells apart, and about one man in twelve cannot separate the brown, the dark red and the olive.</td></tr>
  <tr><td class="wrap">A tenth is a Design decision</td><td>&ldquo;Done&rdquo; appears in some designs but has no colour. Use <code>#e4d95f</code> meanwhile.</td></tr>
</tbody></table></div>
<div class="note stop"><b>One fails contrast.</b> White on the olive &ldquo;Loaded&rdquo;
  measures 4.12:1, the only one of eighteen combinations under the bar.
  <a href="accessibility.html">See the measurements</a>.</div>

{nextprev(('shape-motion.html','Shape and motion'), ('accessibility.html','Accessibility'))}
"""
    return shell('Truck phases', 'The nine phase colours, in both themes.',
                 'foundations', 'phases.html', body,
                 toc=[('flip', 'Mode flip'), ('values', 'The values'), ('rules', 'Rules')])


def f_a11y():
    body = f"""
<p class="eyebrow">Foundations</p>
<h1>Accessibility.</h1>
<p class="lede">Measured in the browser rather than claimed. Two of our colour pairs
   currently fail, and they are written down rather than quietly shipped.</p>

<p>Text has to be bright enough against its background for people to read it, including
   anyone with weaker eyesight and anyone holding a tablet in direct sun.
   <strong>4.5 to 1 is the pass mark</strong> for normal text; 3 to 1 applies to large text
   only.</p>

<h2 id="measured">What we measured</h2>
<div class="tw"><table id="a11y">
  <thead><tr><th>Text</th><th>On</th><th>Sample</th><th class="m">Ratio</th><th>Result</th></tr></thead>
  <tbody id="a11y-body"><tr><td colspan="5">Measuring&hellip;</td></tr></tbody>
</table></div>
<p class="cap" id="a11y-foot">&nbsp;</p>

<div class="note stop"><b>Two failures, both in light mode.</b> Our faintest text
  (<code>--subtle</code>, used for placeholders and small print) measures 2.87:1 on white and
  2.79:1 on the page background — below even the large-text bar. The next shade up
  (<code>--soft</code>) reaches 3.79&ndash;3.94:1, legal at 18px and above but not at the
  12&ndash;13px we actually use it at.</div>

<h2 id="phases">Phase labels</h2>
<div class="tw"><table>
  <thead><tr><th>Phase</th><th>Light</th><th class="m">Ratio</th><th>Dark</th><th class="m">Ratio</th></tr></thead>
  <tbody id="ph-body"><tr><td colspan="5">Measuring&hellip;</td></tr></tbody>
</table></div>
<p class="cap" id="ph-foot">&nbsp;</p>

<h2 id="beyond">Beyond contrast</h2>
<div class="tw"><table><tbody>
  <tr><td class="wrap">Never colour alone</td><td>Every phase label carries its name. Every alert badge carries a count. Colour is the fast read, not the only read.</td></tr>
  <tr><td class="wrap">44px targets</td><td>Anything clickable in a toolbar is 44px tall. The driver is wearing gloves.</td></tr>
  <tr><td class="wrap">Focus is visible</td><td>A 2px outline at 2px offset, in the panel&rsquo;s own ink. Tab through any component on this site.</td></tr>
  <tr><td class="wrap">Reduced motion</td><td>Everything that animates has a path for people who ask for less.</td></tr>
  <tr><td class="wrap">Errors are not just red</td><td>A red border and a written message. The message is what tells you what to fix.</td></tr>
</tbody></table></div>

<div class="note"><b>Before you quote these numbers.</b> This is the standard international
  calculation, the right tool for checking a palette and the wrong one for settling a single
  borderline case. Anything between 3:1 and 5:1 deserves a look on real hardware in real
  light.</div>

<script>
(function(){{
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
}})();
</script>

{nextprev(('phases.html','Truck phases'), ('../components/index.html','Components'))}
"""
    phase_js = '[' + ','.join("['%s','%s','%s']" % (n, s, t) for n, k, s, t in PHASES) + ']'
    return shell('Accessibility', 'Contrast measured in the browser, and what fails.',
                 'foundations', 'accessibility.html',
                 body.replace('{phase_js}', phase_js),
                 toc=[('measured', 'What we measured'), ('phases', 'Phase labels'),
                      ('beyond', 'Beyond contrast')])
