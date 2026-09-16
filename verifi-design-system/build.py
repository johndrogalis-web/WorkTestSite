#!/usr/bin/env python3
"""Build the Verifi Design System site.

One shell, many pages. Every nav entry resolves to a real page —
nothing 404s and nothing is an empty stub.
"""
import os, re, html

ROOT = os.path.dirname(os.path.abspath(__file__))

MARK = ('<svg viewBox="0 0 96 24" fill="none" xmlns="http://www.w3.org/2000/svg" '
        'aria-label="Verifi"><path d="M10.3958 8.06142H0V11.2399H9.15381L0.367992 24H8.00383L12.6497 '
        '11.286C13.1097 10.0422 12.4197 8.06142 10.3958 8.06142ZM16.6517 8.06142C14.6277 8.06142 '
        '13.9377 10.0422 14.3977 11.286L19.0436 24H26.6794L17.8936 11.2399H27.0474V8.06142H16.6517ZM'
        '75.4384 3.91555C75.4384 2.53359 76.4504 1.52015 77.8304 1.52015C79.2104 1.52015 80.2223 '
        '2.53359 80.2223 3.91555C80.2223 5.2975 79.2104 6.31094 77.8304 6.31094C76.4504 6.31094 '
        '75.4384 5.2975 75.4384 3.91555ZM49.587 15.8004C49.587 20.4069 52.9909 24 57.4068 24C60.7187 '
        '24 63.7087 22.3877 64.8587 18.8868H61.1787C60.2587 20.4069 58.7868 20.8215 57.4068 '
        '20.8215C55.2908 20.8215 53.5429 19.2092 53.1749 17.1363H65.1806V16.1228C65.1806 11.286 '
        '61.9147 7.60077 57.4068 7.60077C52.8989 7.60077 49.587 11.286 49.587 15.8004ZM61.7307 '
        '14.2802H53.1749C53.5429 12.2994 55.2449 10.7793 57.4068 10.7793C59.5688 10.7793 61.3627 '
        '12.2994 61.7307 14.2802ZM39.8812 21.7428L34.6833 8.06142H38.5012L41.7671 17.1363L42.4111 '
        '19.6238H42.5031L43.1471 17.1363L46.413 8.06142H50.231L45.0331 21.7428C44.5731 22.9405 '
        '43.8831 24 42.4571 24C41.0311 24 40.3412 22.9405 39.8812 21.7428ZM76.0824 23.9079V8.06142H'
        '79.5323V23.9079H76.0824ZM83.0283 23.9079V11.2399H81.0963V8.06142H83.0283V6.31094C83.0283 '
        '2.57965 85.9262 0 89.5141 0C93.1021 0 96 2.57965 96 6.31094H92.5041C92.5041 4.56046 91.2621 '
        '3.27063 89.5601 3.27063C87.8582 3.27063 86.5242 4.56046 86.5242 6.31094V8.06142H96V23.9079H'
        '92.5041V11.2399H86.5242V23.9079H83.0283ZM66.6526 23.9079V10.4568C66.6526 9.07486 67.6646 '
        '8.06142 69.0446 8.06142H74.5184V11.2399H70.1485V23.9079H66.6526Z" fill="currentColor"/></svg>')

COPYICON = ('<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
            '<rect x="5.2" y="5.2" width="8.3" height="8.3" rx="1.6" stroke="currentColor" stroke-width="1.4"/>'
            '<path d="M10.8 5.2V3.9c0-.8-.6-1.4-1.4-1.4H3.9c-.8 0-1.4.6-1.4 1.4v5.5c0 .8.6 1.4 1.4 1.4h1.3" '
            'stroke="currentColor" stroke-width="1.4"/></svg>')

ARROW = '<span aria-hidden="true">&rarr;</span>'

# ── Site map ──────────────────────────────────────────────────
SECTIONS = {
    'brand': ('Brand', [
        ('index.html',        'Overview'),
        ('idea.html',         'The horizon line'),
        ('logo.html',         'Logo'),
        ('colour.html',       'Colour'),
        ('type.html',         'Typography'),
        ('imagery.html',      'Imagery'),
        ('fifth-element.html','Fifth element'),
        ('voice.html',        'Voice'),
    ]),
    'foundations': ('Foundations', [
        ('index.html',        'Overview'),
        ('colour.html',       'Colour'),
        ('type.html',         'Type'),
        ('shape-motion.html', 'Shape and motion'),
        ('phases.html',       'Truck phases'),
        ('accessibility.html','Accessibility'),
    ]),
    'components': ('Components', [
        ('index.html',        'All 45'),
        ('buttons.html',      'Buttons'),
        ('form-fields.html',  'Form fields'),
        ('choosing.html',     'Choosing things'),
        ('informing.html',    'Telling people things'),
        ('navigation.html',   'Getting around'),
        ('containers.html',   'Containers'),
    ]),
    'resources': ('Resources', [
        ('index.html',        'Overview'),
        ('sales.html',        'Sales and marketing'),
        ('design.html',       'Product and design'),
        ('engineering.html',  'Development'),
        ('open-items.html',   'Still undecided'),
    ]),
}
TOP = [('brand', 'Brand'), ('foundations', 'Foundations'),
       ('components', 'Components'), ('resources', 'Resources')]


def shell(title, desc, section, page, body, toc=None, depth=1, wide=False):
    """Wrap page content in the site chrome."""
    up = '../' * depth
    nav = ''.join(
        '<a href="{u}{k}/index.html"{cur}>{lbl}</a>'.format(
            u=up, k=k, lbl=lbl,
            cur=' aria-current="true"' if k == section else '')
        for k, lbl in TOP)

    rail = ''
    if section and not wide:
        sec_label, pages = SECTIONS[section]
        items = ''.join(
            '<li><a href="{u}{s}/{f}"{cur}>{t}</a></li>'.format(
                u=up, s=section, f=f, t=t,
                cur=' aria-current="page"' if f == page else '')
            for f, t in pages)
        rail = ('<nav class="rail" aria-label="{s}"><h2>{s}</h2><ul>{i}</ul></nav>'
                .format(s=sec_label, i=items))

    toc_html = ''
    cls = 'doc'
    if toc:
        cls = 'doc has-toc'
        toc_html = ('<nav class="toc" aria-label="On this page"><h2>On this page</h2><ul>'
                    + ''.join('<li><a href="#{a}">{t}</a></li>' for a, t in [])
                    + ''.join('<li><a href="#%s">%s</a></li>' % (a, t) for a, t in toc)
                    + '</ul></nav>')

    foot_cols = ''
    for k, lbl in TOP:
        _, pages = SECTIONS[k]
        links = ''.join('<li><a href="{u}{s}/{f}">{t}</a></li>'.format(u=up, s=k, f=f, t=t)
                        for f, t in pages[:5])
        foot_cols += '<div><h2>%s</h2><ul>%s</ul></div>' % (lbl, links)

    if wide:
        content = body
    else:
        content = ('<div class="%s">%s<main id="main">%s</main>%s</div>'
                   % (cls, rail, body, toc_html))

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title} &middot; Verifi Design System</title>
<meta name="description" content="{html.escape(desc, quote=True)}">
<meta property="og:title" content="{html.escape(title, quote=True)} · Verifi Design System">
<meta property="og:description" content="{html.escape(desc, quote=True)}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{up}assets/css/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<header class="masthead">
  <div class="masthead-in">
    <a class="brand" href="{up}index.html">
      {MARK}
      <span class="sub">Design System</span>
    </a>
    <nav class="mainnav" id="mainnav" aria-label="Sections">{nav}</nav>
    <div class="mh-tools">
      <a class="cta" href="{up}components/index.html">Get started</a>
      <button class="ghost burger" id="burger" aria-expanded="false" aria-controls="mainnav">Menu</button>
    </div>
  </div>
</header>

{content}

<hr class="horizon">
<footer class="site">
  <div class="foot-in">
    <div class="foot-brand">
      {MARK}
      <p>The design system behind Verifi &mdash; the in-transit concrete management platform.
         Brand, foundations and components in one place.</p>
      <p class="small">Brand questions: Brittany Cool<br>Product questions: Verifi Design</p>
    </div>
    {foot_cols}
  </div>
  <div class="foot-legal">
    <span>&copy; 2026 Verifi, a Saint-Gobain company</span>
    <span class="sp"></span>
    <span>Identity Guidelines V1.0</span>
    <span>Trinity v0.1.3</span>
  </div>
</footer>

<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="{up}assets/js/site.js"></script>
</body>
</html>
"""


def write(path, content):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as fh:
        fh.write(content)
    return len(content)


def copybar(title, key, tag=''):
    t = '<span class="tag">%s</span>' % tag if tag else ''
    return ('<div class="barline"><span class="t">%s</span>%s'
            '<button class="copy" data-copy="%s">%s<span class="copy-label">Copy CSS</span>'
            '</button></div>' % (title, t, key, COPYICON))


def snippet(key, text):
    return '<script type="text/plain" id="snip-%s">%s</script>' % (key, html.escape(text))


def bench(body_l, body_d=None, cap=None):
    body_d = body_d if body_d is not None else body_l
    out = ('<div class="bench">'
           '<div class="pane pane-l"><div class="ph">Light</div><div class="pb">%s</div></div>'
           '<div class="pane pane-d"><div class="ph">Dark</div><div class="pb">%s</div></div>'
           '</div>' % (body_l, body_d))
    if cap:
        out += '<p class="cap">%s</p>' % cap
    return out


def brow(label, inner):
    return '<div class="brow"><span class="bl">%s</span>%s</div>' % (label, inner)


def nextprev(prev=None, nxt=None):
    a = ''
    if prev:
        a += ('<a href="%s"><span class="k">Previous</span><span class="t">%s</span></a>'
              % prev)
    else:
        a += '<span></span>'
    if nxt:
        a += ('<a class="r" href="%s"><span class="k">Next</span><span class="t">%s</span></a>'
              % nxt)
    return '<div class="nextprev">%s</div>' % a
