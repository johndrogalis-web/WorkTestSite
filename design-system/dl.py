#!/usr/bin/env python3
"""Download assets — logo, animation, the fifth element and photography."""
from core import shell, DLICON, spec, table, checklist, ARROW
from assets_data import (PHOTOS, PHOTO_GROUPS, LOGO, FIFTH, FIFTH_VIDEO, ANIMATION)

D = '../assets/downloads/'
P = '../assets/downloads/preview/'


def kb(n):
    if n >= 1_000_000:
        return '%.1f MB' % (n / 1_000_000)
    if n < 1000:
        return '%d B' % n
    return '%d KB' % round(n / 1000)


def btn(href, label, size=None):
    s = '<span class="kb">%s</span>' % kb(size) if size else ''
    return ('<a class="dl-btn" href="%s" download>%s<b>%s</b>%s</a>'
            % (href, DLICON, label, s))


def card(shot, name, dim, buttons, shot_cls=''):
    return ('<div class="dl">%s<div class="meta3"><span class="nm">%s</span>'
            '<span class="dim">%s</span><span class="fmts">%s</span></div></div>'
            % (shot, name, dim, buttons))


# ── Logo ──────────────────────────────────────────────────────
LOGO_LABEL = {
    'verifi-logotype-black': ('Logotype, black', 'Symbol and wordmark. The normal logo.', 'lite'),
    'verifi-logotype-white': ('Logotype, white', 'For darker backgrounds and photography.', 'dark'),
    'verifi-symbol-black':   ('Symbol, black', 'Avatars and favicons only, or where the name is already obvious.', 'lite'),
    'verifi-symbol-white':   ('Symbol, white', 'The same rule, on dark.', 'dark'),
    'verifi-favicon':        ('Favicon', '512&times;512 PNG, for browser tabs and app icons.', 'lite'),
}


def logo_cards():
    out = ''
    for rec in LOGO:
        slug = rec['slug']
        label, note, tone = LOGO_LABEL[slug]
        ext = 'svg' if 'svg' in rec['files'] else 'png'
        shot = ('<img class="shot pad %s" src="%slogo/%s.%s" alt="%s" loading="lazy">'
                % (tone, D, slug, ext, label))
        buttons = ''
        for e in ('svg', 'png', 'eps'):
            if e in rec['files']:
                buttons += btn('%slogo/%s.%s' % (D, slug, e), e.upper(), rec['files'][e])
        out += card(shot, label, note, buttons)
    return '<div class="dl-grid">%s</div>' % out


# ── Animation ─────────────────────────────────────────────────
ANIM_SET = [
    ('black', 'Black logotype',
     'The reveal on a light background. 5 seconds, 25fps.'),
    ('white', 'White logotype',
     'The same animation for darker backgrounds.'),
]
ANIM_FMT = [
    ('verifi-logotype-reveal-4k-%s.mp4',          '4K MP4'),
    ('verifi-logotype-reveal-1080-%s.mp4',        '1080 MP4'),
    ('verifi-logotype-reveal-1080-%s-alpha.webm', '1080 WebM alpha'),
]
SIZES = {a['file']: a['bytes'] for a in ANIMATION}


def anim_cards():
    out = ''
    for tone, label, note in ANIM_SET:
        shot = ('<video class="shot %s" src="%sanimation/verifi-logotype-reveal-1080-%s.mp4" '
                'muted loop playsinline autoplay preload="metadata" '
                'aria-label="%s reveal"></video>'
                % ('lite' if tone == 'black' else 'dark', D, tone, label))
        buttons = ''
        for pat, fmt in ANIM_FMT:
            f = pat % tone
            if f in SIZES:
                buttons += btn('%sanimation/%s' % (D, f), fmt, SIZES[f])
        out += card(shot, label, note, buttons)
    return '<div class="dl-grid wide">%s</div>' % out


# ── Fifth element ─────────────────────────────────────────────
BAND_NOTE = {'480': 'Fine', '160': 'Medium', '48': 'Coarse', '40': 'Coarse'}


def fifth_cards():
    out = ''
    for rec in FIFTH:
        shot = ('<img class="shot" src="%s%s" alt="%s banding" loading="lazy">'
                % (P, rec.get('preview', ''), rec['name']))
        buttons = ''
        for band in ('480', '160', '48', '40'):
            if band in rec['stills']:
                f, size = rec['stills'][band]
                buttons += btn(D + 'fifth-element/' + f,
                               '%s %s' % (BAND_NOTE[band], band), size)
        out += card(shot, rec['name'],
                    'Three band coarsenesses from one source photograph.', buttons)
    return '<div class="dl-grid">%s</div>' % out


def fifth_video_table():
    by_colour = {}
    for v in FIFTH_VIDEO:
        by_colour.setdefault(v['colour'], {})[v['band']] = v
    rows = []
    for colour in sorted(by_colour):
        cells = ''
        for band in ('48', '144', '288'):
            v = by_colour[colour].get(band)
            cells += (btn(D + 'fifth-element/' + v['file'], band, v['bytes'])
                      if v else '<span class="m" style="opacity:.4">&mdash;</span>')
        rows.append([colour.title(), cells])
    return table(['Colourway', 'Band coarseness &mdash; coarse to fine'], rows)


# ── Photography ───────────────────────────────────────────────
def photo_group(key):
    out = ''
    for r in [p for p in PHOTOS if p['group'] == key]:
        sq = ' sq' if r['src_w'] == r['src_h'] else ''
        shot = ('<img class="shot%s" src="%s%s.webp" alt="%s" loading="lazy">'
                % (sq, P, r['slug'], r['title']))
        buttons = (btn('%sphotography/%s-web.jpg' % (D, r['slug']),
                       'Web %dpx' % r['web_w'], r['web']) +
                   btn('%sphotography/%s-large.jpg' % (D, r['slug']),
                       'Large %dpx' % r['large_w'], r['large']))
        out += card(shot, r['title'],
                    'Source %d &times; %d' % (r['src_w'], r['src_h']), buttons)
    return '<div class="dl-grid">%s</div>' % out


def assets():
    total = (sum(f for r in LOGO for f in r['files'].values())
             + sum(a['bytes'] for a in ANIMATION)
             + sum(s[1] for r in FIFTH for s in r['stills'].values())
             + sum(v['bytes'] for v in FIFTH_VIDEO)
             + sum(r['web'] + r['large'] for r in PHOTOS))
    count = (sum(len(r['files']) for r in LOGO) + len(ANIMATION)
             + sum(len(r['stills']) for r in FIFTH) + len(FIFTH_VIDEO)
             + len(PHOTOS) * 2)

    groups = ''
    for key, label, note in PHOTO_GROUPS:
        n = len([p for p in PHOTOS if p['group'] == key])
        groups += ('<h3 id="ph-%s">%s <span class="m" style="color:var(--ink-faint);'
                   'font-size:13px">%d</span></h3><p>%s</p>%s'
                   % (key, label, n, note, photo_group(key)))

    body = f"""
<h1>Download assets.</h1>
<p class="lede">The logo, the animation, the fifth element and {len(PHOTOS)} photographs &mdash;
   all downloadable from this page. You do not need SharePoint access to use any of it.</p>

<div class="note ok"><b>{count} files, {total / 1_000_000:.0f} MB in total.</b> Every download
  button gives you the file directly. Nothing here needs a login, a request, or a licence
  check &mdash; if you work at Verifi, you can use all of it.</div>

<h2 id="logo">Logo</h2>
<p><b>SVG for anything on screen</b> &mdash; it stays sharp at any size and the file is a
   thousand bytes. <b>PNG</b> when something will not take an SVG. <b>EPS</b> for print and
   for anyone working in Illustrator.</p>
{logo_cards()}
<div class="note"><b>Black or white only.</b> There is no blue version and no gradient version.
  The rules for clear space, minimum size and placement are on the
  <a href="logo.html">Logo page</a>, along with the eight things people get wrong.</div>

<h2 id="animation">Logo animation</h2>
<p>A five-second reveal, 25fps. Three formats because three different jobs:</p>
{spec([
  ('4K MP4', 'Slide decks, video edits, anything at full resolution.'),
  ('1080 MP4', 'Web and email. 27 KB &mdash; use this one unless you have a reason not to.'),
  ('1080 WebM with alpha', 'For the web when it has to sit over a coloured background or '
                           'photograph rather than a flat white or black one.'),
])}
{anim_cards()}
<div class="note"><b>The MP4s here are re-encoded, and that is deliberate.</b> The originals
  were 30 MB each for five seconds of flat graphics &mdash; around 48 Mbps, which is roughly
  400 times more data than the content needs. These measure 68 dB PSNR against the originals,
  which is visually identical, at 78 KB.</div>
<div class="note"><b>Editing in Premiere or After Effects?</b> The ProRes 4444 masters with a
  real alpha channel are 25 MB each, which is too big to belong on a documentation site. Ask
  Verifi Design, or take them from <span class="m">Logo/Animation/MOV</span> in the brand
  folder. For everything on the web, the WebM above has alpha and is 65 KB.</div>

<h2 id="fifth">Fifth element</h2>
<p>A photograph stretched into bands until it reads like a road passing at speed. Six approved
   sources, each at three band coarsenesses. The number is how coarse the banding is, not the
   pixel size.</p>
{fifth_cards()}

<h3 id="fifth-video">Moving fifth element</h3>
<p>Eight loops, three colourways at up to three coarsenesses.</p>
{fifth_video_table()}
<p class="dl-note">Placement, orientation and the three things that break it are on the
   <a href="imagery.html">Imagery page</a>.</p>

<h2 id="photography">Photography</h2>
<p>Every photograph comes in two sizes. <b>Web</b> at 1600px is the one you want for a deck, a
   document, an email or a web page &mdash; it is around 180 KB and it will not make anyone wait.
   <b>Large</b> at 4096px is for print and for anything filling a big screen.</p>
<div class="note warn"><b>What is not here.</b> The source files are 4096 to 8192px PNGs,
  between 3 and 73 MB each &mdash; 947 MB for the set. Those stay in SharePoint, because a
  design system site that ships a gigabyte of PNGs is a file server, not a design system. The
  4096px Large tier covers print up to about 13 inches at 300dpi, which covers almost
  everything. If you are doing large-format &mdash; a trade show wall, a vehicle wrap &mdash;
  ask Verifi Design for the original.</div>
{groups}

<h2 id="rules">Using them</h2>
{checklist([
  'Real work, real light. These are all shot on site or in a studio for Verifi &mdash; none of '
  'them are stock, and none of them need attribution.',
  'Do not add heavy filters or colour grades. The palette is doing a job and a grade fights it.',
  'Leave room for the horizon when you crop. It is the one move that makes a layout look like '
  'Verifi.',
  'People in these photographs are employees and contractors who agreed to be photographed for '
  'Verifi use. Do not use them to illustrate anything that is not Verifi.',
  'If you need something that is not here, ask Verifi Design rather than pulling from stock.',
])}
"""
    return shell('Download assets',
                 'The logo, the animation, the fifth element and 43 photographs, downloadable.',
                 'brand/assets.html', body, crumb=['Brand', 'Download assets'],
                 toc=[('logo', 'Logo'), ('animation', 'Logo animation'),
                      ('fifth', 'Fifth element'), ('photography', 'Photography'),
                      ('rules', 'Using them')])
