#!/usr/bin/env python3
"""Build every page. Fails loudly on a missing page or a broken link."""
import sys, os, re
from core import write, ALL_HREFS, ROOT
import comp_proof as P, comp_rest as C, found as F, rest as R
import dl as DL

PAGES = [
    ('index.html',                          R.g_overview),
    ('start/designers.html',                R.g_designers),
    ('start/developers.html',               R.g_developers),

    ('foundations/colour.html',             F.f_colour),
    ('foundations/typography.html',         F.f_type),
    ('foundations/spacing.html',            F.f_spacing),
    ('foundations/shape.html',              F.f_shape),
    ('foundations/motion.html',             F.f_motion),
    ('foundations/accessibility.html',      F.f_a11y),
    ('foundations/truck-phases.html',       F.f_phases),

    ('components/index.html',               C.c_index),
    ('components/breadcrumbs.html',         P.c_breadcrumbs),
    ('components/button.html',              C.c_button),
    ('components/checkbox.html',            C.c_checkbox),
    ('components/dropdown.html',            C.c_dropdown),
    ('components/modal.html',               C.c_modal),
    ('components/radio-group.html',         C.c_radio),
    ('components/table.html',               P.c_table),
    ('components/tabs.html',                C.c_tabs),
    ('components/text-field.html',          C.c_field),
    ('components/toast.html',               C.c_toast),
    ('components/toggle.html',              C.c_toggle),
    ('components/truck-phase-tag.html',     C.c_phase),

    ('brand/logo.html',                     R.b_logo),
    ('brand/colour-type.html',              R.b_colour_type),
    ('brand/imagery.html',                  R.b_imagery),
    ('brand/assets.html',                   DL.assets),

    ('open-items.html',                     R.open_items),
]


def main():
    built, total = {}, 0
    for path, fn in PAGES:
        h = fn(); n = write(path, h); built[path] = h; total += n
        print('  %-38s %7d' % (path, n))

    missing = [h for h in ALL_HREFS if h not in built]
    if missing:
        print('\nMISSING PAGES: %s' % ', '.join(missing)); return 1

    broken = []
    for path, html in built.items():
        base = os.path.dirname(path)
        for href in re.findall(r'href="([^"#?]+)', html):
            if href.startswith(('http', 'mailto:', '#', 'data:')):
                continue
            t = os.path.normpath(os.path.join(base, href))
            if not os.path.exists(os.path.join(ROOT, t)):
                broken.append('%s -> %s' % (path, href))
    if broken:
        print('\nBROKEN LINKS:')
        for b in sorted(set(broken)):
            print('  ' + b)
        return 1

    print('\n%d pages, %d KB. Every nav entry resolves, every link works.'
          % (len(PAGES), total // 1024))
    return 0


if __name__ == '__main__':
    sys.exit(main())
