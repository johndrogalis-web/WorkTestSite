#!/usr/bin/env python3
"""The landing page."""
from build import shell, write, MARK, ARROW

PLAY = ('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
        '<path d="M8 5.14v13.72L19 12z"/></svg>')


def home():
    body = f"""
<div class="hero">
  <div class="reveal" id="reveal" aria-hidden="true">
    <video muted playsinline preload="auto">
      <source src="assets/video/logo-reveal.webm" type="video/webm">
    </video>
  </div>
  <picture>
    <source media="(max-width:700px)" srcset="assets/img/truck-wall-1100.webp">
    <img class="hero-img" src="assets/img/truck-wall-1848.webp" alt=""
         width="1848" height="1028" fetchpriority="high">
  </picture>
  <div class="hero-in">
    <div class="hero-copy">
    <h1>The design system behind confidence in concrete.</h1>
    <p class="lede">Everything you need to make something that looks, sounds and behaves
       like Verifi &mdash; whether you are writing a pitch, drawing a screen or shipping
       code.</p>
    <div class="hero-cta">
      <a class="btn-solid" href="#start">Find your starting point {ARROW}</a>
      <a class="btn-line" href="components/index.html">Browse components</a>
    </div>
    </div>
  </div>
</div>
<hr class="horizon">

<section class="wrap statement">
  <p>Concrete is mixed in motion and judged on arrival.</p>
  <p class="after">Verifi puts sensors inside the drum, so the load that leaves the plant is
     the load that gets poured &mdash; measured, corrected and recorded on the way. That one
     idea shapes everything here: <strong>we build for certainty in an industry that has
     always lived with guesswork.</strong></p>
</section>

<section class="wrap">
  <div class="feature">
    <div class="feat-txt">
      <p class="eyebrow">What the product does</p>
      <h2>A sensor in the drum, a decision on the road.</h2>
      <p>Hardware on the truck reads the concrete continuously while it is moving. When the
         mix drifts out of spec, water and admixture are dosed automatically, and every
         adjustment is recorded. The producer and the customer end up looking at the same
         record.</p>
      <p><a href="brand/idea.html">Where the brand idea comes from {ARROW}</a></p>
    </div>
    <div class="media">
      <video preload="none" poster="assets/img/pulse-poster.webp" playsinline
             width="1152" height="640" aria-label="Verifi Pulse product film">
        <source src="assets/video/pulse.mp4" type="video/mp4">
      </video>
      <button class="play" aria-label="Play the product film">
        <i>{PLAY}</i>
      </button>
    </div>
  </div>
</section>

<hr class="horizon">
<section id="start">
  <div class="wrap" style="padding-top:clamp(56px,7vh,84px);padding-bottom:26px">
    <p class="eyebrow">Start here</p>
    <h2 style="margin-top:0">Three ways in, depending on what you make.</h2>
    <p class="lede" style="margin-bottom:0">You do not need a design background to use this.
       Pick the door that matches your work.</p>
  </div>
  <div class="routes">
    <a class="route" href="resources/sales.html">
      <span class="n">01</span>
      <h3>Sales and marketing</h3>
      <p>The story, the logo, the imagery and the film. What Verifi is, in words you can put
         in a deck without checking with anyone.</p>
      <span class="go">Brand and messaging <span>{ARROW}</span></span>
    </a>
    <a class="route" href="resources/design.html">
      <span class="n">02</span>
      <h3>Product and design</h3>
      <p>Colour, type, spacing, all 45 components and the rules for choosing between them.
         Plus what is finished and what is not.</p>
      <span class="go">Foundations and components <span>{ARROW}</span></span>
    </a>
    <a class="route" href="resources/engineering.html">
      <span class="n">03</span>
      <h3>Development and engineering</h3>
      <p>Tokens, copy-and-paste CSS for every component, both themes, and the accessibility
         numbers measured rather than claimed.</p>
      <span class="go">Code and tokens <span>{ARROW}</span></span>
    </a>
  </div>
</section>

<section class="wrap">
  <div class="feature flip">
    <div class="feat-txt">
      <p class="eyebrow">How it is organised</p>
      <h2>Two sources, one place to look.</h2>
      <p><strong>Brand</strong> is the identity &mdash; logo, colour, typography, imagery,
         the fifth element. It comes from the Identity Guidelines and Verifi Design owns it.</p>
      <p><strong>Foundations and Components</strong> are the product &mdash; the tokens,
         states and behaviour that make a screen. They come from Trinity, the design system
         behind the Hub.</p>
      <p>The two mostly agree. Where they do not, we say so rather than quietly picking one.</p>
      <p><a href="resources/open-items.html">See what is still undecided {ARROW}</a></p>
    </div>
    <div>
      <img src="assets/img/hardware-2-1400.webp" alt="A Verifi sensor unit mounted on the frame of a concrete truck, lit by low sun."
           width="1400" height="783" loading="lazy">
      <p class="cap">The drum unit. Every rule in this system eventually serves someone
         reading a screen next to one of these.</p>
    </div>
  </div>
</section>

<hr class="horizon">
<section class="wrap" style="padding:clamp(48px,6vh,72px) 0 clamp(56px,7vh,88px)">
  <p class="eyebrow">What is in here</p>
  <h2 style="margin-top:0">Measured, not asserted.</h2>
  <div class="stats" style="margin-top:34px">
    <div class="stat"><p class="v">45</p><p class="l">components catalogued, with an honest status on each</p></div>
    <div class="stat"><p class="v">9</p><p class="l">truck phase colours, checked for contrast in both themes</p></div>
    <div class="stat"><p class="v">20</p><p class="l">published text styles, from 12px captions to 216px display</p></div>
    <div class="stat"><p class="v">9</p><p class="l">open questions we have written down instead of guessing</p></div>
  </div>
</section>

<section class="wrap" style="padding-bottom:clamp(56px,8vh,96px)">
  <img src="assets/img/tagline-1782.webp" alt="Aggregate in low light with the words: Confidence in concrete."
       width="1782" height="319" loading="lazy" style="border-radius:3px">
</section>
"""
    return shell(
        title='Verifi Design System',
        desc=('Brand, foundations and components for Verifi — the in-transit concrete '
              'management platform. One place for sales, design and engineering.'),
        section=None, page='index.html', body=body, depth=0, wide=True)


if __name__ == '__main__':
    n = write('index.html', home())
    print('index.html', n, 'bytes')
