#!/usr/bin/env python3
"""Build every page of the Verifi Design System site.

    python3 make.py

Writes index.html plus brand/, foundations/, components/ and resources/.
Every entry in build.SECTIONS must resolve to a real file; the run fails
loudly if one does not.
"""
import os, sys, re

from build import write, SECTIONS, ROOT
import pages_home
import pages_sections as S
import pages_rest as R1
import pages_rest2 as R2
import pages_comp as C
import pages_res as X

PAGES = [
    ('index.html',                      pages_home.home),

    ('brand/index.html',                S.brand_index),
    ('brand/idea.html',                 S.brand_idea),
    ('brand/logo.html',                 S.brand_logo),
    ('brand/colour.html',               R1.brand_colour),
    ('brand/type.html',                 R1.brand_type),
    ('brand/imagery.html',              R1.brand_imagery),
    ('brand/fifth-element.html',        R1.brand_fifth),
    ('brand/voice.html',                R1.brand_voice),

    ('foundations/index.html',          R2.f_index),
    ('foundations/colour.html',         R2.f_colour),
    ('foundations/type.html',           R2.f_type),
    ('foundations/shape-motion.html',   R2.f_shape),
    ('foundations/phases.html',         R2.f_phases),
    ('foundations/accessibility.html',  R2.f_a11y),

    ('components/index.html',           C.c_index),
    ('components/buttons.html',         C.c_buttons),
    ('components/form-fields.html',     C.c_fields),
    ('components/choosing.html',        C.c_choosing),
    ('components/informing.html',       C.c_informing),
    ('components/navigation.html',      C.c_navigation),
    ('components/containers.html',      C.c_containers),

    ('resources/index.html',            X.r_index),
    ('resources/sales.html',            X.r_sales),
    ('resources/design.html',           X.r_design),
    ('resources/engineering.html',      X.r_engineering),
    ('resources/open-items.html',       X.r_open),
]


def main():
    built = {}
    total = 0
    for path, fn in PAGES:
        html = fn()
        n = write(path, html)
        built[path] = html
        total += n
        print('  %-34s %7d' % (path, n))

    # Every nav entry must exist.
    missing = []
    for sec, (_, pages) in SECTIONS.items():
        for f, _ in pages:
            p = '%s/%s' % (sec, f)
            if p not in built:
                missing.append(p)
    if missing:
        print('\nMISSING PAGES: %s' % ', '.join(missing))
        return 1

    # Every internal link must resolve.
    broken = []
    for path, html in built.items():
        base = os.path.dirname(path)
        for href in re.findall(r'href="([^"#?]+)', html):
            if href.startswith(('http', 'mailto:', '#', 'data:')):
                continue
            target = os.path.normpath(os.path.join(base, href))
            if not os.path.exists(os.path.join(ROOT, target)):
                broken.append('%s -> %s' % (path, href))
    if broken:
        print('\nBROKEN LINKS:')
        for b in sorted(set(broken)):
            print('  ' + b)
        return 1

    print('\n%d pages, %d KB of HTML. Every link resolves.'
          % (len(PAGES), total // 1024))
    return 0


if __name__ == '__main__':
    sys.exit(main())
