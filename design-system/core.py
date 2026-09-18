#!/usr/bin/env python3
"""Shell, navigation and page helpers for the Verifi Design System site."""
import os, html

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
            '<rect x="5.2" y="5.2" width="8.3" height="8.3" rx="1.6" stroke="currentColor" stroke-width="1.5"/>'
            '<path d="M10.8 5.2V3.9c0-.8-.6-1.4-1.4-1.4H3.9c-.8 0-1.4.6-1.4 1.4v5.5c0 .8.6 1.4 1.4 1.4h1.3" '
            'stroke="currentColor" stroke-width="1.5"/></svg>')

MAGNIFY = ('<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
           '<circle cx="7" cy="7" r="4.6" stroke="currentColor" stroke-width="1.5"/>'
           '<path d="M10.4 10.4L14 14" stroke="currentColor" stroke-width="1.5" '
           'stroke-linecap="round"/></svg>')

DLICON = ('<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">'
          '<path d="M8 2.6v7.2M4.8 7l3.2 3.2L11.2 7" stroke="currentColor" stroke-width="1.5" '
          'stroke-linecap="round" stroke-linejoin="round"/>'
          '<path d="M2.8 12.2h10.4" stroke="currentColor" stroke-width="1.5" '
          'stroke-linecap="round"/></svg>')

ARROW = '<span aria-hidden="true">&rarr;</span>'

# ── Navigation ────────────────────────────────────────────────
# A group is (label, entries). An entry is either
#   ('p', href, label, status)                      a page
#   ('g', sublabel, [(href, label, status), ...])   a collapsible subgroup
# Subgroups use Trinity's own family names, so a component sits in the same
# place here as it does in the Figma file.
NAV = [
    ('Get started', [
        ('p', 'index.html',            'Overview', ''),
        ('p', 'start/designers.html',  'For designers', ''),
        ('p', 'start/developers.html', 'For developers', ''),
    ]),
    ('Foundations', [
        ('p', 'foundations/colour.html',        'Colour', ''),
        ('p', 'foundations/typography.html',    'Typography', ''),
        ('p', 'foundations/spacing.html',       'Spacing and layout', ''),
        ('p', 'foundations/shape.html',         'Shape', ''),
        ('p', 'foundations/motion.html',        'Motion', ''),
        ('p', 'foundations/accessibility.html', 'Accessibility', ''),
        ('p', 'foundations/iconography.html',   'Iconography', 'new'),
        ('p', 'foundations/truck-phases.html',  'Truck phases', ''),
    ]),
    ('Components', [
        ('p', 'components/index.html', 'All components', ''),
        ('g', 'Actions', [
            ('components/button.html', 'Button', ''),
        ]),
        ('g', 'Navigators', [
            ('components/breadcrumbs.html', 'Breadcrumbs', ''),
            ('components/tabs.html',        'Tabs', ''),
        ]),
        ('g', 'Form elements', [
            ('components/checkbox.html',    'Checkbox', ''),
            ('components/dropdown.html',    'Dropdown', ''),
            ('components/radio-group.html', 'Radio group', ''),
            ('components/slider.html',      'Slider', 'new'),
            ('components/text-field.html',  'Text field', ''),
            ('components/toggle.html',      'Toggle', ''),
        ]),
        ('g', 'Informers', [
            ('components/avatar.html',          'Avatar', 'new'),
            ('components/badge.html',           'Badge', 'new'),
            ('components/progress-bar.html',    'Progress bar', 'new'),
            ('components/spinner.html',         'Spinner', 'new'),
            ('components/tag.html',             'Tag', 'new'),
            ('components/toast.html',           'Toast', ''),
            ('components/tooltip.html',         'Tooltip', 'new'),
            ('components/truck-phase-tag.html', 'Truck phase tag', ''),
        ]),
        ('g', 'Containers', [
            ('components/modal.html', 'Modal', ''),
            ('components/table.html', 'Table', ''),
        ]),
    ]),
    ('Brand', [
        ('p', 'brand/logo.html',        'Logo', ''),
        ('p', 'brand/colour-type.html', 'Colour and type', ''),
        ('p', 'brand/imagery.html',     'Imagery', ''),
        ('p', 'brand/assets.html',      'Download assets', ''),
    ]),
    (None, [
        ('p', 'open-items.html', 'Open items', ''),
    ]),
]


def _flatten():
    out = []
    for _, entries in NAV:
        for e in entries:
            if e[0] == 'p':
                out.append((e[1], e[2]))
            else:
                out.extend((h, l) for h, l, _ in e[2])
    return out


ORDER = _flatten()
ALL_HREFS = [h for h, _ in ORDER]


def family_of(href):
    """Which subgroup a page sits in, or None."""
    for _, entries in NAV:
        for e in entries:
            if e[0] == 'g' and any(h == href for h, _, _ in e[2]):
                return e[1]
    return None


def neighbours(href):
    """Previous and next page in rail order."""
    idx = [i for i, (h, _) in enumerate(ORDER) if h == href]
    if not idx:
        return None, None
    i = idx[0]
    return (ORDER[i - 1] if i > 0 else None,
            ORDER[i + 1] if i < len(ORDER) - 1 else None)


def rel(frm, to):
    """Link from one page path to another."""
    up = '../' * frm.count('/')
    return up + to


def shell(title, desc, href, body, toc=None, crumb=None):
    depth = href.count('/')
    up = '../' * depth

    def link(h, label, st):
        cur = ' aria-current="page"' if h == href else ''
        tag = '<span class="st">%s</span>' % st if st else ''
        return '<li><a href="%s%s"%s>%s%s</a></li>' % (up, h, cur, label, tag)

    nav = ''
    for group, entries in NAV:
        if group:
            nav += '<h2>%s</h2>' % group
        else:
            nav += '<div class="sep"></div>'
        loose = [e for e in entries if e[0] == 'p']
        if loose:
            nav += '<ul>%s</ul>' % ''.join(link(e[1], e[2], e[3]) for e in loose)
        for e in entries:
            if e[0] != 'g':
                continue
            sublabel, pages = e[1], e[2]
            here = any(h == href for h, _, _ in pages)
            nav += ('<details class="grp" data-grp="%s"%s>'
                    '<summary><span class="gl">%s</span>'
                    '<span class="gn">%d</span></summary>'
                    '<ul>%s</ul></details>'
                    % (sublabel, ' open' if here else '', sublabel, len(pages),
                       ''.join(link(h, l, st) for h, l, st in pages)))

    toc_html = ''
    doc_cls = 'doc'
    if toc:
        toc_html = ('<nav class="toc" aria-label="On this page"><h2>On this page</h2><ul>'
                    + ''.join('<li><a href="#%s">%s</a></li>' % (a, t) for a, t in toc)
                    + '</ul></nav>')
    else:
        doc_cls = 'doc notoc'

    crumb_html = ''
    if crumb:
        parts = ''.join('<i>/</i><span>%s</span>' % c for c in crumb)
        crumb_html = ('<nav class="crumb" aria-label="Breadcrumb">'
                      '<a href="%sindex.html">Verifi Design System</a>%s</nav>' % (up, parts))

    prev, nxt = neighbours(href)
    np = ''
    if prev or nxt:
        np = '<div class="nextprev">'
        np += ('<a href="%s%s"><span class="k">Previous</span><span class="t">%s</span></a>'
               % (up, prev[0], prev[1])) if prev else '<span></span>'
        np += ('<a class="r" href="%s%s"><span class="k">Next</span><span class="t">%s</span></a>'
               % (up, nxt[0], nxt[1])) if nxt else ''
        np += '</div>'

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{html.escape(title)} &middot; Verifi Design System</title>
<meta name="description" content="{html.escape(desc, quote=True)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{up}assets/css/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<button class="burger" id="burger" aria-expanded="false" aria-controls="rail">Menu</button>
<div class="scrim" id="scrim"></div>

<div class="shell">
  <aside class="rail" id="rail">
    <div class="rail-top">
      <a class="rail-brand" href="{up}index.html">
        {MARK}<span>Design<br>System</span>
      </a>
      <div class="finder">
        {MAGNIFY}
        <input type="search" id="finder" placeholder="Filter pages" aria-label="Filter pages">
      </div>
    </div>
    <nav aria-label="Site">{nav}<p class="nohit" id="nohit" hidden>Nothing matches.</p></nav>
  </aside>

  <div class="main">
    <div class="{doc_cls}">
      <main id="main">
        {crumb_html}
        {body}
        {np}
      </main>
      {toc_html}
    </div>
  </div>
</div>

<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="{up}assets/js/site.js"></script>
</body>
</html>
"""


def write(path, content):
    full = os.path.join(ROOT, path)
    d = os.path.dirname(full)
    if d:
        os.makedirs(d, exist_ok=True)
    with open(full, 'w', encoding='utf-8') as fh:
        fh.write(content)
    return len(content)


# ── Building blocks ───────────────────────────────────────────
def snip(key, text):
    return '<script type="text/plain" id="snip-%s">%s</script>' % (key, html.escape(text))


def copybar(title, key, tag='', html_text=None, css_text=None):
    """A titled bar with Copy HTML / Copy CSS scoped to this one block."""
    out = '<div class="barline"><span class="t">%s</span>' % title
    if tag:
        out += '<span class="tag">%s</span>' % tag
    out += '<span class="copyset">'
    if html_text is not None:
        out += ('<button class="copy" data-copy="%s-h" data-kind="HTML">%s'
                '<span class="cl">Copy HTML</span></button>' % (key, COPYICON))
    if css_text is not None:
        out += ('<button class="copy" data-copy="%s-c" data-kind="CSS">%s'
                '<span class="cl">Copy CSS</span></button>' % (key, COPYICON))
    out += '</span></div>'
    if html_text is not None:
        out += snip(key + '-h', html_text)
    if css_text is not None:
        out += snip(key + '-c', css_text)
    return out


def bench(light, dark=None, cap=None, solo=False):
    if solo:
        out = ('<div class="bench solo"><div class="pane pane-l">'
               '<div class="ph">Light</div><div class="pb">%s</div></div></div>' % light)
    else:
        dark = dark if dark is not None else light
        out = ('<div class="bench">'
               '<div class="pane pane-l"><div class="ph">Light</div><div class="pb">%s</div></div>'
               '<div class="pane pane-d"><div class="ph">Dark</div><div class="pb">%s</div></div>'
               '</div>' % (light, dark))
    if cap:
        out += '<p class="cap">%s</p>' % cap
    return out


def brow(label, inner):
    return '<div class="brow"><span class="bl">%s</span>%s</div>' % (label, inner)


def spec(rows):
    return ('<ul class="spec">%s</ul>'
            % ''.join('<li><b>%s</b><span>%s</span></li>' % (k, v) for k, v in rows))


def dodont(do, dont, do_title='Do', dont_title='Do not'):
    return ('<div class="useno"><div class="y"><h3>%s</h3><ul>%s</ul></div>'
            '<div class="n"><h3>%s</h3><ul>%s</ul></div></div>'
            % (do_title, ''.join('<li>%s</li>' % x for x in do),
               dont_title, ''.join('<li>%s</li>' % x for x in dont)))


def checklist(items):
    return '<ul class="checklist">%s</ul>' % ''.join('<li>%s</li>' % x for x in items)


def table(head, rows, cls=''):
    th = ''.join('<th>%s</th>' % h for h in head)
    tr = ''.join('<tr>%s</tr>' % ''.join('<td>%s</td>' % c for c in r) for r in rows)
    c = ' class="%s"' % cls if cls else ''
    return ('<div class="tw"><table%s><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>'
            % (c, th, tr))


def grid(items, up=''):
    out = '<div class="grid">'
    for href, title, desc in items:
        out += '<a href="%s%s"><h3>%s</h3><p>%s</p></a>' % (up, href, title, desc)
    return out + '</div>'


def meta(bits):
    return '<div class="meta">%s</div>' % ''.join(bits)


def pill(status):
    labels = {'ok': 'Solid', 'gap': 'Has gaps', 'bad': 'Broken', 'none': 'Missing'}
    return '<span class="pill %s">%s</span>' % (status, labels[status])


# ── The component page template ───────────────────────────────
# Every component page is assembled here, so none of them can drift.
SECTION_ORDER = [
    ('example',    'Example'),
    ('anatomy',    'Anatomy'),
    ('options',    'Options'),
    ('states',     'States'),
    ('behaviour',  'Behaviour'),
    ('guidelines', 'Guidelines'),
    ('specs',      'Specs'),
    ('a11y',       'Accessibility'),
    ('gaps',       'Known gaps'),
]


def cpage(href, name, lede, status, figma=None, note=None, extra_meta=None,
          tail='', **sections):
    """Build a component page. Keyword args are section ids from SECTION_ORDER."""
    bits = [pill(status)]
    for b in (extra_meta or []):
        bits.append('<span class="v">%s</span>' % b)
    if figma:
        bits.append('<a class="v" href="https://www.figma.com/design/'
                    'Lx7MN3Ztd0qxhyF7rVAiOa/Trinity-Design-System--for-review-?node-id=%s"'
                    ' target="_blank" rel="noopener">Figma %s &nearr;</a>'
                    % (figma.replace(':', '-'), figma))

    body = '<h1>%s</h1><p class="lede">%s</p>%s' % (name, lede, meta(bits))
    if note:
        body += note

    toc = []
    for key, label in SECTION_ORDER:
        content = sections.get(key)
        if not content:
            continue
        toc.append((key, label))
        body += '<h2 id="%s">%s</h2>%s' % (key, label, content)
    body += tail

    return shell(name, lede.replace('<strong>', '').replace('</strong>', ''),
                 href, body, crumb=['Components', name], toc=toc)
