#!/usr/bin/env python3
"""Resources — the three audience routes and the open-items register."""
from build import shell, ARROW, nextprev
from pages_sections import cards
from pages_rest import copybar, snip


def r_index():
    body = f"""
<p class="eyebrow">Resources</p>
<h1>Depending on what you make.</h1>
<p class="lede">The same system, read three different ways. Pick the one that matches your
   week &mdash; each page tells you which five things to read and which five to ignore.</p>

<div class="audience">
  <div>
    <h3>Sales and marketing</h3>
    <p>You are making a deck, a page, an email or a stand. You need the story and the
       artwork, and almost none of the product rules.</p>
    <ul><li>The one-paragraph explanation</li><li>Logo files and the eight misuses</li>
        <li>Where yellow is allowed</li><li>The photography categories</li></ul>
  </div>
  <div>
    <h3>Product and design</h3>
    <p>You are drawing a screen. You need the tokens, the component inventory and an honest
       read on what is finished.</p>
    <ul><li>Both colour systems and where they disagree</li><li>All 45 components with status</li>
        <li>Which control to reach for</li><li>What is still undecided</li></ul>
  </div>
  <div>
    <h3>Development and engineering</h3>
    <p>You are shipping it. You need values you can paste, both themes, and the accessibility
       numbers measured rather than claimed.</p>
    <ul><li>Copy-and-paste CSS on every component</li><li>Token names next to resolved hex</li>
        <li>The two contrast failures</li><li>The components that are structurally broken</li></ul>
  </div>
</div>

{cards([
  ('sales.html', 'Sales and marketing', 'The story, the artwork, the rules that matter outside the product.'),
  ('design.html', 'Product and design', 'Tokens, components, and an honest status on each.'),
  ('engineering.html', 'Development', 'Values, themes, measured contrast and the broken sets.'),
  ('open-items.html', 'Still undecided', 'Nine open questions, written down instead of guessed at.'),
])}

<h2 id="two">Why there are two of everything</h2>
<p>Verifi has an identity system and a product design system, built by different teams at
   different times, and they do not entirely agree. Rather than quietly picking a winner, this
   site keeps both and says where they diverge.</p>
<div class="tw"><table>
  <thead><tr><th></th><th>Brand</th><th>Product</th></tr></thead>
  <tbody>
    <tr><td>Called</td><td>Identity Guidelines V1.0</td><td>Trinity v0.1.3</td></tr>
    <tr><td>Covers</td><td>Logo, colour, typography, imagery, the fifth element, voice</td>
        <td>Tokens, components, states, behaviour</td></tr>
    <tr><td>Governs</td><td>Anything a customer sees outside the product</td>
        <td>Anything inside the Hub</td></tr>
    <tr><td>Ask</td><td>Brittany Cool</td><td>Verifi Design</td></tr>
  </tbody>
</table></div>
<p>Where the two overlap &mdash; the blue, the black, the greys &mdash; the differences are
   documented on <a href="open-items.html">the open items page</a> rather than averaged away.</p>

{nextprev(('../components/containers.html', 'Containers'), ('sales.html', 'Sales and marketing'))}
"""
    return shell('Resources', 'Three ways to read the system, and a register of what is '
                 'still undecided.', 'resources', 'index.html', body,
                 toc=[('two', 'Why there are two')])


def r_sales():
    body = f"""
<p class="eyebrow">Resources &middot; Sales and marketing</p>
<h1>For the deck you are making today.</h1>
<p class="lede">You do not need the product rules. You need the story, the artwork, and four
   things not to do.</p>

<h2 id="story">What Verifi is, in one paragraph</h2>
<div class="note"><p style="margin:0">Concrete is mixed in motion and judged on arrival.
  Verifi puts sensors inside the drum, so the load that leaves the plant is the load that gets
  poured &mdash; measured, corrected and recorded on the way. When the mix drifts out of spec,
  water and admixture are dosed automatically, and every adjustment is logged. The producer
  and the customer end up looking at the same record.</p></div>
<p>That paragraph is safe to paste. It carries the proposition without claiming a number, and
   it explains the product to someone who has never poured concrete.</p>

<h2 id="say">Shorter versions</h2>
<ul class="spec">
  <li><b>Tagline</b><span>Confidence in concrete.</span></li>
  <li><b>One line</b><span>In-transit concrete management &mdash; measured in the drum, corrected
      on the road, recorded on arrival.</span></li>
  <li><b>Two words</b><span>Certainty, not guesswork.</span></li>
  <li><b>The company</b><span>Verifi, a Saint-Gobain company.</span></li>
</ul>
<div class="note warn"><b>The name is a word, not a logo.</b> In running text it is
  &ldquo;Verifi&rdquo; &mdash; capital V, no italic, no registered mark mid-sentence, and never
  the logotype artwork dropped into a sentence.</div>

<h2 id="artwork">The artwork you will be asked for</h2>
<div class="tw"><table>
  <thead><tr><th>You need</th><th>Ask for</th><th>Rule</th></tr></thead>
  <tbody>
    <tr><td class="wrap">A logo for a deck or a page</td><td>The <b>logotype</b> &mdash; symbol
        and wordmark together</td><td>Black or white only. No blue version exists.</td></tr>
    <tr><td class="wrap">A profile picture or favicon</td><td>The <b>symbol</b> alone</td>
        <td>Only where the Verifi name is already obvious from the context.</td></tr>
    <tr><td class="wrap">A banner or divider</td><td>The <b>fifth element</b></td>
        <td>A photograph stretched into bands. It reads as a road at speed.</td></tr>
    <tr><td class="wrap">Photography</td><td>Truck, hardware or site</td>
        <td>Real work, real light. No stock handshakes.</td></tr>
  </tbody>
</table></div>
<p><a href="../brand/logo.html">The logo page, including the eight things people get wrong
   {ARROW}</a></p>

<h2 id="yellow">Yes, you can use yellow</h2>
<p>This confuses people, so it is worth stating plainly. <strong>Verifi Yellow is a marketing
   colour.</strong> On verificoncrete.com it is the Request a demo button. In decks it is the
   callout. That is correct and approved.</p>
<p>Inside the product it means something else entirely &mdash; it is the dark-mode selection
   colour, the equivalent of blue highlight. So a yellow button in a screenshot of the Hub
   would be wrong, and a yellow button on a landing page is right. Same colour, two domains,
   no conflict.</p>

<h2 id="four">Four things not to do</h2>
<ul class="checklist">
  <li><b>Do not stretch, tilt, recolour or shadow the logo.</b> If it does not fit, make the
      space bigger.</li>
  <li><b>Do not type the word instead of placing the artwork.</b> ABC Repro set in lowercase
      is not the wordmark.</li>
  <li><b>Do not invent a lock-up</b> by typing a product name next to the logo. Those are made
      by Verifi Design.</li>
  <li><b>Do not let anything into the clear space</b> &mdash; a margin equal to the height of
      the symbol, on all four sides.</li>
</ul>

<h2 id="next">Where to go next</h2>
{cards([
  ('../brand/idea.html', 'The horizon line', 'The idea under the identity. Useful when a layout is not working.'),
  ('../brand/imagery.html', 'Imagery', 'The three photographic categories and how they are shot.'),
  ('../brand/voice.html', 'Voice', 'How Verifi writes, and the rules for the name.'),
  ('../brand/colour.html', 'Colour', 'Every value including Pantone and CMYK, for print.'),
], up='')}

{nextprev(('index.html', 'Resources'), ('design.html', 'Product and design'))}
"""
    return shell('Sales and marketing', 'The story, the artwork and the four rules that '
                 'matter outside the product.', 'resources', 'sales.html', body,
                 toc=[('story', 'What Verifi is'), ('say', 'Shorter versions'),
                      ('artwork', 'The artwork'), ('yellow', 'Using yellow'),
                      ('four', 'Four things not to do'), ('next', 'Where to go next')])


def r_design():
    body = f"""
<p class="eyebrow">Resources &middot; Product and design</p>
<h1>For the screen you are drawing.</h1>
<p class="lede">Everything here comes from Trinity. The brand half governs what a customer sees
   outside the product; this half governs what happens inside it.</p>

<h2 id="first">Read these four, in this order</h2>
<ul class="spec">
  <li><b>1 &middot; Colour</b><span><a href="../foundations/colour.html">The three jobs colour
      is allowed to do in the product</a>, and why the product blue is not the brand blue.</span></li>
  <li><b>2 &middot; Shape and motion</b><span><a href="../foundations/shape-motion.html">Four
      radii, a 4px grid, no shadows on resting surfaces, nothing that bounces.</a></span></li>
  <li><b>3 &middot; The catalogue</b><span><a href="../components/index.html">All 45 components
      with a status on each</a> &mdash; and 22 of them carry a documented gap.</span></li>
  <li><b>4 &middot; Open items</b><span><a href="open-items.html">What is genuinely undecided</a>,
      so you do not spend a day resolving something that is waiting on a person.</span></li>
</ul>

<h2 id="habits">Six habits that make a screen look like Verifi</h2>
<ul class="checklist">
  <li><b>Put the horizon back in it.</b> A full-width image meeting a block of content on a
      clean line is the move that makes a layout look like Verifi rather than like anyone
      else.</li>
  <li><b>Use the quiet outline pill.</b> Filled buttons are for completion, and there is at
      most one per container. A screen full of solid buttons is not this product.</li>
  <li><b>Let colour mean status, not decoration.</b> Blue is selection. Red and amber are
      alerts. The nine phase colours belong to phases. Nothing else is coloured.</li>
  <li><b>Keep the page order.</b> Title, stat band, toolbar, tabs, content, pagination. Every
      page. Consistency here is most of what makes the product feel like one product.</li>
  <li><b>Open detail in a drawer</b>, not a new page, so the list underneath survives.</li>
  <li><b>Tint hover with the selection colour</b>, never grey. It is 5% of the selection blue
      in light, 5% of lime in dark.</li>
</ul>

<h2 id="conflicts">Where brand and product disagree</h2>
<p>Five values differ between the two systems. Four are near-identical and probably drift; one
   is a real difference that needs a decision.</p>
<div class="tw"><table>
  <thead><tr><th>Value</th><th class="m">Brand</th><th class="m">Product</th><th>Read</th></tr></thead>
  <tbody>
    <tr><td>Blue</td><td class="m"><span class="sw" style="background:#1594ef"></span>#1594EF</td>
        <td class="m"><span class="sw" style="background:#3069e3"></span>#3069E3</td>
        <td><b>A real difference.</b> #3069E3 appears in neither brand palette.</td></tr>
    <tr><td>Black</td><td class="m"><span class="sw" style="background:#2e2b27"></span>#2E2B27</td>
        <td class="m"><span class="sw" style="background:#36322d"></span>#36322D</td>
        <td>Drift. Both are warm near-blacks.</td></tr>
    <tr><td>Grey 100</td><td class="m"><span class="sw" style="background:#faf9f6"></span>#FAF9F6</td>
        <td class="m"><span class="sw" style="background:#f6f4f2"></span>#F6F4F2</td>
        <td>Drift.</td></tr>
    <tr><td>Grey 650</td><td class="m"><span class="sw" style="background:#706a5c"></span>#706A5C</td>
        <td class="m"><span class="sw" style="background:#7f796c"></span>#7F796C</td>
        <td>Drift.</td></tr>
    <tr><td>Blue 0</td><td class="m"><span class="sw" style="background:#eef9ff"></span>#EEF9FF</td>
        <td class="m"><span class="sw" style="background:#c5e4fb"></span>#C5E4FB</td>
        <td>Different tints, same intent.</td></tr>
  </tbody>
</table></div>
<p>Two values do match exactly: Blue 600 <span class="m">#0975C3</span> and Blue 900
   <span class="m">#032D3D</span>. Which suggests the product palette was derived from the
   brand one and then edited.</p>

<h2 id="honest">What is not finished</h2>
<p>An honest read, so you can plan around it rather than discover it:</p>
<ul class="checklist">
  <li><b>Dark mode is drawn for almost nothing.</b> Form fields, in particular, exist in light
      mode only. The dark column on the form fields page is a derivation.</li>
  <li><b>Three components have no usable spec:</b> Card is a stub, Top navigation is
      structurally broken, and Link does not exist.</li>
  <li><b>Modal has one size.</b> Anything bigger than extra small is improvised.</li>
  <li><b>There is no stepper, no skeleton and no empty state.</b> Interim rules exist on the
      relevant pages; do not invent components to fill the holes.</li>
  <li><b>Two icon libraries coexist</b> &mdash; 1,134 Unicons and 281 Feather. New work uses
      Unicons only, and never mixes prefixes within one view.</li>
</ul>

{nextprev(('sales.html', 'Sales and marketing'), ('engineering.html', 'Development'))}
"""
    return shell('Product and design', 'Tokens, components and an honest status on each.',
                 'resources', 'design.html', body,
                 toc=[('first', 'Read these four'), ('habits', 'Six habits'),
                      ('conflicts', 'Where they disagree'), ('honest', 'What is not finished')])


CSS_TOKENS = """/* ═══════════════════════════════════════════════════════════
   Verifi product tokens — Trinity v0.1.3
   Paste this into your root stylesheet. Both themes included.
   Brand values (marketing) differ; see Resources → Product and design.
   ═══════════════════════════════════════════════════════════ */
:root {
  color-scheme: light dark;

  /* Surfaces */
  --base:        #f6f4f2;
  --layer-1:     #ffffff;
  --layer-2:     #f6f4f2;

  /* Ink — alpha over the surface, not solid colours */
  --strong:      #36322dff;
  --defined:     #36322dc2;
  --soft:        #36322d9e;
  --subtle:      #36322d80;   /* fails contrast at small sizes — see accessibility */

  /* Lines */
  --border:      #36322d24;
  --border-mid:  rgba(54,50,45,.30);

  /* Interaction */
  --select:      #3069e3;
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
  --font:        'ABC Repro', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --font-mono:   'DM Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

  /* Motion — nothing bounces */
  --t-fast:      .14s;
  --t-slide:     .38s;
  --ease:        cubic-bezier(.22, 1, .36, 1);

  /* Truck phases — strong for light mode, subtle for dark */
  --phase-waiting-strong:  #644325;  --phase-waiting-subtle:  #d9a97c;
  --phase-loading-strong:  #9a1f1e;  --phase-loading-subtle:  #efadac;
  --phase-loaded-strong:   #887f13;  --phase-loaded-subtle:   #e4d95f;
  --phase-tojob-strong:    #1e6252;  --phase-tojob-subtle:    #75dfc7;
  --phase-onsite-strong:   #872781;  --phase-onsite-subtle:   #ed9ce6;
  --phase-pouring-strong:  #101010;  --phase-pouring-subtle:  #d6d2d2;
  --phase-washing-strong:  #126886;  --phase-washing-subtle:  #b9deea;
  --phase-return-strong:   #9c0f5a;  --phase-return-subtle:   #f6a4cf;
  --phase-ignition-strong: #525252;  --phase-ignition-subtle: #bababa;
}

[data-theme="dark"], @media (prefers-color-scheme: dark) {
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
    --select:     #e3f200;     /* lime is dark-mode only */
    --on-select:  #000000;
    --hover:      rgba(227,242,0,.05);
    --blue-link:  #ffffff;
    --focus-ring: #ffffff;
  }
}"""


def r_engineering():
    body = f"""
<p class="eyebrow">Resources &middot; Development</p>
<h1>For the thing you are shipping.</h1>
<p class="lede">Every component page carries copy-and-paste CSS with the token name and the
   resolved hex side by side. This page is the whole token set in one block, plus the four
   things that will bite you.</p>

<h2 id="tokens">The whole token set</h2>
{copybar('Trinity tokens', 'tokens', 'both themes &middot; v0.1.3')}
{snip('tokens', CSS_TOKENS)}
<div class="note"><b>Ink tokens carry alpha on purpose.</b> <code>--defined</code> is
  <span class="m">#36322d</span> at 76%, not a solid grey, so the text picks up whatever
  surface it sits on. That is also why contrast has to be <em>composited</em> before it is
  measured &mdash; the naive hex comparison gives the wrong answer.</div>

<h2 id="bite">Four things that will bite you</h2>
<ul class="checklist">
  <li><b>Lime is dark-mode only.</b> <code>--select</code> is blue in light and lime in dark.
      If lime appears on a light screen, a token has been hardcoded somewhere.</li>
  <li><b>Phase colours flip, they do not tint.</b> Light mode is the solid colour with white
      text; dark mode is the light tint with near-black text. Same token pair, inverted roles.
      Pill, map marker and legend dot all read from it and must agree.</li>
  <li><b>Hover is selection-tinted, never grey.</b> 5% of the selection colour, in both themes.</li>
  <li><b>46% of the button set&rsquo;s fills are hardcoded in Figma.</b> If you generate CSS
      from the file rather than from this token block, you will inherit values that will not
      follow a theme change.</li>
</ul>

<h2 id="a11y">The two contrast failures</h2>
<p>Measured, not asserted &mdash; the calculator runs in your browser on the
   <a href="../foundations/accessibility.html">accessibility page</a> so you can check the
   arithmetic.</p>
<div class="tw"><table>
  <thead><tr><th>Pair</th><th class="m">Ratio</th><th>Verdict</th><th>Fix</th></tr></thead>
  <tbody>
    <tr><td class="wrap">Phase pill <em>Loaded</em> <span class="m">#887F13</span> with white
        text</td><td class="m">4.12:1</td><td><span class="pill bad">Fail</span></td>
        <td class="wrap">Darken to <span class="m">#7A7211</span> for 4.95:1, or
        <span class="m">#6F6810</span> for 5.73:1. The only one of eighteen phase combinations
        that misses.</td></tr>
    <tr><td class="wrap">Light-mode <code>--subtle</code> on <code>--layer-1</code></td>
        <td class="m">2.87:1</td><td><span class="pill bad">Fail</span></td>
        <td class="wrap">Below even the large-text bar, and it is the placeholder and
        small-print token. <code>--soft</code> measures 3.79&ndash;3.94:1, which is legal at
        18px but not at the 12&ndash;13px it is actually used at.</td></tr>
  </tbody>
</table></div>
<div class="note stop"><b>Do not ship placeholder text in <code>--subtle</code>.</b> Until
  Verifi Design darkens the token, use <code>--soft</code> at 14px or larger for anything a
  user has to read.</div>

<h2 id="dontbuild">Components not to build against</h2>
<div class="tw"><table>
  <thead><tr><th>Component</th><th>Why</th><th>Instead</th></tr></thead>
  <tbody>
    <tr><td>Top navigation <span class="m">56362:18642</span></td>
        <td>Figma reports the variant properties as invalid.</td>
        <td>Nothing. Ask Verifi Design.</td></tr>
    <tr><td>Side navigation <span class="m">57725:*</span></td>
        <td>Duplicate of the real cluster.</td>
        <td>Reference <span class="m">56362:18728</span>.</td></tr>
    <tr><td>Toast <span class="m">56362:19143</span></td><td>Cruder duplicate.</td>
        <td>Reference <span class="m">39027:356</span>.</td></tr>
    <tr><td>Table cells <span class="m">57724:564</span></td><td>Duplicate.</td>
        <td>Reference <span class="m">56348:4383</span>.</td></tr>
    <tr><td>Truck phase tag <span class="m">57719:16219</span></td><td>Duplicate.</td>
        <td>Reference <span class="m">56361:2240</span>.</td></tr>
  </tbody>
</table></div>

<h2 id="naming">State naming, normalised</h2>
<p>Three competing conventions coexist in the Figma file &mdash; <code>state</code> vs
   <code>State</code>, <code>disabled</code> vs <code>isDisabled</code>, <code>value</code> vs
   <code>isSelected</code>, <code>intermediate</code> vs <code>isIndeterminate</code>. Do not
   propagate that into code. Use:</p>
<ul class="spec">
  <li><b>State</b><span class="m">default &middot; hover &middot; focus &middot; active</span></li>
  <li><b>Booleans</b><span class="m">disabled &middot; selected &middot; indeterminate &middot;
      loading &middot; inverse</span></li>
  <li><b>Never</b><span class="m">pressed (only the accordion has it), intermediate, isFoo</span></li>
</ul>

<h2 id="motion">Motion, in four numbers</h2>
<ul class="spec">
  <li><b>Colour and border</b><span class="m">0.12&ndash;0.15s. Use 0.14s.</span></li>
  <li><b>Drawers</b><span class="m">0.35&ndash;0.38s, cubic-bezier(.22, 1, .36, 1)</span></li>
  <li><b>Popovers</b><span class="m">fade plus a 4&ndash;6px rise</span></li>
  <li><b>Focus</b><span class="m">2px <code>--strong</code> outline at 2px offset</span></li>
</ul>
<div class="note"><b>Nothing bounces.</b> No overshoot easing anywhere in the product. And
  every transition above is switched off under <code>prefers-reduced-motion</code> &mdash;
  including on this site.</div>

{nextprev(('design.html', 'Product and design'), ('open-items.html', 'Still undecided'))}
"""
    return shell('Development', 'The whole token set, the measured contrast failures, and the '
                 'components not to build against.', 'resources', 'engineering.html', body,
                 toc=[('tokens', 'The token set'), ('bite', 'Four things'),
                      ('a11y', 'Contrast failures'), ('dontbuild', 'Do not build against'),
                      ('naming', 'State naming'), ('motion', 'Motion')])


OPEN = [
 ('01', 'Which blue is the blue?',
  'Brand says <span class="m">#1594EF</span>. The product uses <span class="m">#3069E3</span>, '
  'which appears in neither brand palette. Blue 600 and Blue 900 match exactly, so the product '
  'palette looks derived from the brand one and then edited.',
  'Verifi Design + Brittany Cool', 'Everything blue, in both systems'),
 ('02', 'The Loaded phase pill fails contrast',
  '<span class="m">#887F13</span> with white text measures 4.12:1 against a 4.5:1 requirement. '
  'It is the only one of eighteen phase combinations that misses.',
  'Verifi Design', 'One token; pill, map marker and legend dot all follow'),
 ('03', 'Light-mode <code>--subtle</code> is unreadable',
  '2.87:1 on <code>--layer-1</code> and 2.79:1 on <code>--base</code> — below even the '
  'large-text bar, and it is the placeholder and small-print token.',
  'Verifi Design', 'Every placeholder and caption in the product'),
 ('04', 'Dark mode for form fields is not drawn',
  'The Figma Form Fields page is light mode only. The dark column on this site is a derivation '
  'from the surface and ink tokens, applied consistently — a reading, not a decision.',
  'Verifi Design', 'Every input in dark mode'),
 ('05', 'There is no link component',
  'The tokens exist (<code>interaction/link</code>, <code>link-visited</code>); nothing is '
  'drawn. The interim rule is on the buttons page.',
  'Verifi Design', 'Every inline link and entity link in a table'),
 ('06', 'Modal has one size',
  'Only Extra small exists — no S, M or L, no header or footer slot spec, no close-affordance '
  'spec. The widths published here are a proposal.',
  'Verifi Design', 'Any modal larger than a confirm dialog'),
 ('07', 'Two names for the same truck phases',
  'The component set says <em>In transit</em> and <em>Return to plant</em>. The tokens say '
  '<em>To job</em> and <em>Returning to plant</em>. Same domain, two dialects.',
  'Verifi Design + Product', 'Phase pills, map, legend, and anything reading the API'),
 ('08', 'Yellow, confirmed as a domain boundary',
  'Marketing uses Verifi Yellow for calls to action — the Request a demo button on '
  'verificoncrete.com. The product uses it as the dark-mode selection colour. Both are correct; '
  'this is recorded so nobody "fixes" one of them.',
  'Recorded, no action', 'Marketing and product, kept apart'),
 ('09', 'Icons: two libraries, no decision',
  '1,134 Unicons and 281 Feather coexist. The interim rule is Unicons only for new work, '
  'Feather frozen, never mixed within one view.',
  'Verifi Design', 'Every icon in the product'),
]


def r_open():
    rows = ''
    for n, title, detail, who, blast in OPEN:
        rows += ('<tr><td class="m">%s</td><td class="wrap"><b>%s</b><br>'
                 '<span style="color:var(--ink-soft)">%s</span></td>'
                 '<td class="wrap">%s</td><td class="wrap">%s</td></tr>'
                 % (n, title, detail, who, blast))

    body = f"""
<p class="eyebrow">Resources</p>
<h1>Still undecided.</h1>
<p class="lede">Nine questions this system cannot answer on its own, written down rather than
   guessed at. Everything else on this site is a rule; this page is the list of things that are
   not yet rules.</p>

<div class="note"><b>Why a page like this exists.</b> A design system that only publishes its
  settled parts teaches people to trust it uniformly, which means they trust the unsettled
  parts too. Naming the gaps costs a page and saves the argument that happens six weeks into a
  sprint.</div>

<h2 id="register">The register</h2>
<div class="tw"><table>
  <thead><tr><th class="m">#</th><th>Question</th><th>Needs</th><th>Affects</th></tr></thead>
  <tbody>{rows}</tbody>
</table></div>

<h2 id="brandfile">Two errors inside the brand file itself</h2>
<p>These are not open questions so much as things to be aware of when you read the source.</p>
<ul class="checklist">
  <li><b>Verifi Yellow has two values.</b> <span class="m">#E3F200</span> on the primary palette
      page, <span class="m">#F3F85B</span> on the supporting palette page. The primary value is
      the one in use everywhere.</li>
  <li><b>One grey has two names.</b> The same warm dark grey is called Grey 650 on the palette
      page and Grey 700 on the contrast page.</li>
</ul>

<h2 id="closed">Settled, so nobody reopens them</h2>
<ul class="checklist">
  <li><b>Nav and segmented active colour:</b> blue in light, lime in dark. The lime-in-light
      screenshot was an error, not intent.</li>
  <li><b>Table framing:</b> full-bleed for primary page tables, boxed for tables inside widgets
      and cards.</li>
  <li><b>Stat band order:</b> label above the number.</li>
  <li><b>Scope bar:</b> cut. Session scope lives in the sidebar account picker and the scope bar
      will not be in the Verifi build.</li>
  <li><b>Phase pills flip with the theme.</b> The static solid-in-both-modes prototype is
      overruled.</li>
</ul>

<h2 id="raise">Raising something</h2>
<p>If you find a sixth conflict or a tenth open question, it belongs here rather than in a
   thread. Brand questions go to Brittany Cool; product questions go to Verifi Design. Include
   the node ID &mdash; every component page on this site lists them.</p>

{nextprev(('engineering.html', 'Development'), ('../components/index.html', 'All 45 components'))}
"""
    return shell('Still undecided', 'Nine open questions, written down instead of guessed at.',
                 'resources', 'open-items.html', body,
                 toc=[('register', 'The register'), ('brandfile', 'Errors in the brand file'),
                      ('closed', 'Settled'), ('raise', 'Raising something')])
