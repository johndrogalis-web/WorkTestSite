/* Verifi Design System — site behaviour.
   Rail search, mobile rail, on-this-page tracking, copy buttons,
   the live contrast calculator. Everything degrades without JS. */
(function () {
  'use strict';

  /* ── Mobile rail ──────────────────────────────────────────── */
  var rail = document.getElementById('rail');
  var burger = document.getElementById('burger');
  var scrim = document.getElementById('scrim');
  function closeRail() {
    if (!rail) return;
    rail.classList.remove('open');
    if (scrim) scrim.classList.remove('on');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }
  if (burger && rail) {
    burger.addEventListener('click', function () {
      var open = rail.classList.toggle('open');
      if (scrim) scrim.classList.toggle('on', open);
      burger.setAttribute('aria-expanded', String(open));
    });
  }
  if (scrim) scrim.addEventListener('click', closeRail);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeRail();
  });

  /* ── Rail search ──────────────────────────────────────────── */
  var finder = document.getElementById('finder');
  if (finder && rail) {
    var items = [].slice.call(rail.querySelectorAll('nav li'));
    var heads = [].slice.call(rail.querySelectorAll('nav h2'));
    var nohit = document.getElementById('nohit');
    finder.addEventListener('input', function () {
      var q = finder.value.trim().toLowerCase();
      var shown = 0;
      items.forEach(function (li) {
        var hit = !q || li.textContent.toLowerCase().indexOf(q) > -1;
        li.classList.toggle('hide', !hit);
        if (hit) shown++;
      });
      heads.forEach(function (h) {
        var ul = h.nextElementSibling;
        if (!ul) return;
        var any = [].slice.call(ul.querySelectorAll('li')).some(function (li) {
          return !li.classList.contains('hide');
        });
        h.style.display = any ? '' : 'none';
        ul.style.display = any ? '' : 'none';
      });
      if (nohit) nohit.hidden = shown > 0;
    });
    finder.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var first = items.filter(function (li) { return !li.classList.contains('hide'); })[0];
      var a = first && first.querySelector('a');
      if (a) window.location.href = a.href;
    });
  }

  /* ── On this page ─────────────────────────────────────────── */
  var toc = document.querySelector('.toc');
  if (toc && 'IntersectionObserver' in window) {
    var links = [].slice.call(toc.querySelectorAll('a'));
    var targets = links
      .map(function (a) { try { return document.querySelector(a.getAttribute('href')); }
                          catch (err) { return null; } })
      .filter(Boolean);
    if (targets.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) {
            a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id);
          });
        });
      }, { rootMargin: '-10% 0px -72% 0px' });
      targets.forEach(function (t) { io.observe(t); });
    }
  }

  /* ── Toast ────────────────────────────────────────────────── */
  var toastEl = document.getElementById('toast');
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 2600);
  }
  window.vfToast = toast;

  /* ── Copy ─────────────────────────────────────────────────── */
  function writeClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); }
      catch (err) { reject(err); }
      document.body.removeChild(ta);
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.copy');
    if (!btn) return;
    var src = document.getElementById('snip-' + btn.getAttribute('data-copy'));
    if (!src) return;
    var text = src.textContent;
    var label = btn.querySelector('.cl');
    var original = label ? label.textContent : '';
    var kind = btn.getAttribute('data-kind') || 'CSS';
    writeClipboard(text).then(function () {
      btn.classList.add('done');
      if (label) label.textContent = 'Copied';
      toast(kind + ' copied — ' + text.trim().split('\n').length + ' lines');
      setTimeout(function () {
        btn.classList.remove('done');
        if (label) label.textContent = original;
      }, 1700);
    }).catch(function () {
      toast('Could not reach the clipboard — select the code manually');
    });
  });

  /* ── Contrast calculator ──────────────────────────────────────
     Ink tokens carry alpha, so a pair has to be composited over
     its surface before it can be measured.                      */
  function parseHex(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length === 6) h += 'ff';
    return {
      r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16), a: parseInt(h.slice(6, 8), 16) / 255
    };
  }
  function over(fg, bg) {
    return {
      r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
      g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
      b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)), a: 1
    };
  }
  function lum(c) {
    var ch = [c.r, c.g, c.b].map(function (v) {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }
  window.vfRatio = function (fgHex, bgHex) {
    var bg = parseHex(bgHex), fg = over(parseHex(fgHex), bg);
    var a = lum(fg), b = lum(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  window.vfVerdict = function (r) {
    if (r >= 7) return ['ok', 'AAA'];
    if (r >= 4.5) return ['ok', 'AA'];
    if (r >= 3) return ['gap', 'AA Large'];
    return ['bad', 'Fail'];
  };

  /* ── Catalogue filtering ──────────────────────────────────── */
  var cat = document.getElementById('cat-table');
  if (cat) {
    var chips = [].slice.call(document.querySelectorAll('.fchip'));
    var rows = [].slice.call(cat.querySelectorAll('tbody tr'));
    var countEl = document.getElementById('fcount');
    var emptyEl = document.getElementById('catnone');
    function apply(key) {
      var shown = 0;
      rows.forEach(function (r) {
        var ok = key === 'all' || r.getAttribute('data-fam') === key ||
                 r.getAttribute('data-status') === key || r.getAttribute('data-page') === key;
        r.hidden = !ok;
        if (ok) shown++;
      });
      if (countEl) {
        countEl.textContent = shown === rows.length ? rows.length + ' components'
                                                    : shown + ' of ' + rows.length + ' shown';
      }
      if (emptyEl) emptyEl.hidden = shown > 0;
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (o) { o.setAttribute('aria-pressed', String(o === c)); });
        apply(c.getAttribute('data-filter'));
      });
    });
    apply('all');
  }

  /* ── Demo interactions in the benches ─────────────────────── */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.c-tabs button');
    if (t) {
      [].slice.call(t.parentNode.children).forEach(function (b) {
        b.setAttribute('aria-selected', String(b === t));
      });
      return;
    }
    var s = e.target.closest && e.target.closest('.c-seg button');
    if (s) {
      [].slice.call(s.parentNode.children).forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === s));
      });
      return;
    }
    var k = e.target.closest && e.target.closest('.c-cbx,.c-rad,.c-tog');
    if (k) {
      if (k.classList.contains('c-rad')) {
        var sibs = k.parentNode.querySelectorAll('.c-rad');
        [].slice.call(sibs).forEach(function (r) { r.classList.remove('on'); });
        k.classList.add('on');
      } else {
        k.classList.toggle('on');
      }
    }
  });
})();
