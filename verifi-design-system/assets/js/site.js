/* ═══════════════════════════════════════════════════════════════
   VERIFI DESIGN SYSTEM — site behaviour
   Mobile nav, on-this-page tracking, copy-to-clipboard, the
   landing reveal, and the live contrast calculator.
   Everything degrades: content is visible with JS switched off.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Mobile navigation ────────────────────────────────────── */
  var burger = document.getElementById('burger');
  var mainnav = document.getElementById('mainnav');
  if (burger && mainnav) {
    burger.addEventListener('click', function () {
      var open = mainnav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mainnav.classList.contains('open')) {
        mainnav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* ── On-this-page: highlight the heading you are reading ──── */
  var toc = document.querySelector('.toc');
  if (toc && 'IntersectionObserver' in window) {
    var links = [].slice.call(toc.querySelectorAll('a'));
    var targets = links
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);
    if (targets.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) {
            a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id);
          });
        });
      }, { rootMargin: '-14% 0px -70% 0px' });
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

  /* ── Copy to clipboard, with a fallback for older engines ─── */
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
    var key = btn.getAttribute('data-copy');
    var src = document.getElementById('snip-' + key);
    var text = src ? src.textContent : btn.getAttribute('data-text');
    if (!text) return;
    var label = btn.querySelector('.copy-label');
    var original = label ? label.textContent : '';
    writeClipboard(text).then(function () {
      btn.classList.add('done');
      if (label) label.textContent = 'Copied';
      toast('Copied — ' + text.trim().split('\n').length + ' lines on your clipboard');
      setTimeout(function () {
        btn.classList.remove('done');
        if (label) label.textContent = original;
      }, 1800);
    }).catch(function () {
      toast('Could not reach the clipboard — select the code manually');
    });
  });

  /* ── Landing reveal ───────────────────────────────────────────
     Plays once per session. Anyone arriving with reduced motion
     on, or on a repeat visit, goes straight to the page.        */
  var reveal = document.getElementById('reveal');
  if (reveal) {
    var vid = reveal.querySelector('video');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var seen = false;
    try { seen = sessionStorage.getItem('vf-reveal') === '1'; } catch (err) { seen = false; }

    function finish() {
      reveal.classList.add('done');
      setTimeout(function () { reveal.hidden = true; }, 750);
      try { sessionStorage.setItem('vf-reveal', '1'); } catch (err) { /* private window */ }
    }
    if (reduced || seen || !vid) {
      reveal.hidden = true;
    } else {
      vid.addEventListener('ended', finish);
      vid.addEventListener('error', finish);
      setTimeout(finish, 6000);            // never trap the page
      reveal.addEventListener('click', finish);
      var play = vid.play();
      if (play && play.catch) play.catch(finish);
    }
  }

  /* ── Click-to-play film ───────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var p = e.target.closest && e.target.closest('.play');
    if (!p) return;
    var v = p.parentNode.querySelector('video');
    if (!v) return;
    v.controls = true;
    v.play();
    p.hidden = true;
  });

  /* ── Contrast calculator ──────────────────────────────────────
     Text colours are alpha over a surface, so the pair has to be
     composited before it can be measured.                       */
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
  window.vfToast = toast;

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
        var ok = key === 'all' ||
                 r.getAttribute('data-fam') === key ||
                 r.getAttribute('data-status') === key;
        r.hidden = !ok;
        if (ok) shown++;
      });
      if (countEl) {
        countEl.textContent = shown === rows.length
          ? rows.length + ' components'
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

  /* ── Accordion demos ──────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var h = e.target.closest && e.target.closest('.c-acc .h');
    if (!h) return;
    var acc = h.parentNode;
    var open = acc.classList.toggle('open');
    h.setAttribute('aria-expanded', String(open));
  });
})();
