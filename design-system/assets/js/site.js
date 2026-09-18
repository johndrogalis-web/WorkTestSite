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

  /* ── Rail groups: remember what is open, mark the current one ── */
  var groups = rail ? [].slice.call(rail.querySelectorAll('.grp')) : [];
  if (groups.length) {
    var KEY = 'vf-rail-open';
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(KEY) || 'null'); }
    catch (err) { saved = null; }

    groups.forEach(function (g) {
      var name = g.getAttribute('data-grp');
      if (g.querySelector('a[aria-current="page"]')) {
        g.classList.add('has-current');
        g.open = true;                       // the group you are in always opens
      } else if (saved && saved.indexOf(name) > -1) {
        g.open = true;
      }
      g.addEventListener('toggle', function () {
        if (g.hasAttribute('data-forced')) return;   // search opened it, not the user
        var open = groups.filter(function (o) { return o.open; })
                         .map(function (o) { return o.getAttribute('data-grp'); });
        try { sessionStorage.setItem(KEY, JSON.stringify(open)); } catch (e) { /* private */ }
      });
    });
  }

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

      // While searching, every group opens so nothing hides behind a collapsed
      // header. Clearing the box puts them back where the user left them.
      groups.forEach(function (g) {
        var any = [].slice.call(g.querySelectorAll('li')).some(function (li) {
          return !li.classList.contains('hide');
        });
        g.classList.toggle('hide', !any);
        if (q) {
          g.setAttribute('data-forced', '');
          g.open = true;
        } else {
          g.removeAttribute('data-forced');
          g.open = g.classList.contains('has-current') ||
                   (saved && saved.indexOf(g.getAttribute('data-grp')) > -1) || false;
        }
      });

      heads.forEach(function (h) {
        var sec = [], n = h.nextElementSibling;
        while (n && n.tagName !== 'H2') {
          if (n.tagName === 'UL' || n.classList.contains('grp')) sec.push(n);
          n = n.nextElementSibling;
        }
        var any = sec.some(function (el) {
          return [].slice.call(el.querySelectorAll('li')).some(function (li) {
            return !li.classList.contains('hide');
          });
        });
        h.style.display = any ? '' : 'none';
        sec.forEach(function (el) {
          if (el.tagName === 'UL') el.style.display = any ? '' : 'none';
        });
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

  /* ── Live slider ──────────────────────────────────────────
     A real <input type="range"> sits invisibly on top, so keyboard,
     touch and assistive technology all work without being rebuilt.
     The painted parts only mirror its value. */
  [].slice.call(document.querySelectorAll('.t-slider.live')).forEach(function (sl) {
    var input = sl.querySelector('input[type="range"]');
    if (!input) return;
    var fil = sl.querySelector('.fil');
    var thb = sl.querySelector('.thb');
    var val = sl.querySelector('.val');

    function paint() {
      var p = Number(input.value);
      if (fil) fil.style.width = p + '%';
      if (thb) thb.style.left = p + '%';
      if (val) { val.style.left = p + '%'; val.textContent = p; }
      input.setAttribute('aria-valuetext', p + ' percent');
    }
    function grab()    { sl.classList.add('act', 'show'); }
    function release() { sl.classList.remove('act', 'show'); }

    input.addEventListener('input', paint);
    input.addEventListener('pointerdown', grab);
    input.addEventListener('focus', grab);
    input.addEventListener('pointerup', release);
    input.addEventListener('pointercancel', release);
    input.addEventListener('blur', release);
    sl.addEventListener('pointerenter', function () { sl.classList.add('hov'); });
    sl.addEventListener('pointerleave', function () { sl.classList.remove('hov'); });
    paint();
  });

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
    /* Live demos drive their own state from a real input. Toggling the
       painted class here as well would let the two drift apart. */
    if (k && !k.classList.contains('live')) {
      if (k.classList.contains('c-rad')) {
        var sibs = k.parentNode.querySelectorAll('.c-rad');
        [].slice.call(sibs).forEach(function (r) { r.classList.remove('on'); });
        k.classList.add('on');
      } else {
        k.classList.toggle('on');
      }
    }
  });

  /* ── Live tooltip ──────────────────────────────────────────
     The documented behaviour, actually running: 500ms to open on
     hover and none on focus, 100ms to close with a grace period
     over the tooltip itself, one open at a time with no delay when
     swapping, Escape to dismiss, close on scroll, and a flip when
     there is no room above. A readout names the state so the
     timing is visible and not just felt. */
  [].slice.call(document.querySelectorAll('.tiplive')).forEach(function (box, boxN) {
    var uid    = 'tiplive' + boxN;
    var tip    = box.querySelector('.tiplive-tip');
    var read   = box.querySelector('.tiplive-state');
    var trigs  = [].slice.call(box.querySelectorAll('.tiplive-trig'));
    if (!tip || !trigs.length) return;

    var openT = null, closeT = null, current = null, isOpen = false;
    var REDUCED = window.matchMedia &&
                  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function say(s, cls) {
      if (!read) return;
      read.textContent = s;
      read.className = 'tiplive-state' + (cls ? ' ' + cls : '');
    }

    function place(trig) {
      var b = box.getBoundingClientRect();
      var t = trig.getBoundingClientRect();
      tip.style.visibility = 'hidden';
      tip.style.display = 'block';
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      tip.style.display = '';
      tip.style.visibility = '';

      var left = (t.left - b.left) + (t.width / 2) - (tw / 2);
      left = Math.max(4, Math.min(left, b.width - tw - 4));

      // Above by default; flip below when the trigger sits too near the top.
      var above = t.top - b.top - th - 8;
      var flipped = above < 0;
      var top = flipped ? (t.bottom - b.top + 8) : above;

      tip.style.left = left + 'px';
      tip.style.top  = top + 'px';
      tip.classList.toggle('below', flipped);

      var ax = (t.left - b.left) + (t.width / 2) - left;
      tip.style.setProperty('--ax', Math.max(10, Math.min(ax, tw - 10)) + 'px');
      return flipped;
    }

    function show(trig, instant) {
      clearTimeout(closeT);
      current = trig;
      tip.textContent = trig.getAttribute('data-tip') || '';
      var flipped = place(trig);
      tip.id = uid + '-tip';
      trig.setAttribute('aria-describedby', tip.id);
      isOpen = true;
      tip.classList.add('on');
      say((instant ? 'Open — no delay, swapped from the last trigger' : 'Open')
          + (flipped ? ' · flipped below, no room above' : '')
          + (REDUCED ? ' · no fade, reduced motion' : ' · 150ms fade in'), 'ok');
    }

    function hide(why) {
      isOpen = false;
      tip.classList.remove('on');
      trigs.forEach(function (t) { t.removeAttribute('aria-describedby'); });
      current = null;
      say(why || 'Closed', '');
    }

    function arm(trig) {
      clearTimeout(closeT);
      if (isOpen && current !== trig) { show(trig, true); return; }  // swap, no delay
      if (isOpen && current === trig) return;
      clearTimeout(openT);
      say('Waiting 500ms before opening…', 'wait');
      openT = setTimeout(function () { show(trig, false); }, 500);
    }

    function disarm() {
      clearTimeout(openT);
      if (!isOpen) { say('Left before 500ms — never opened', ''); return; }
      clearTimeout(closeT);
      say('Closing in 100ms — move onto the tooltip to keep it', 'wait');
      closeT = setTimeout(function () { hide('Closed'); }, 100);
    }

    trigs.forEach(function (trig, i) {
      trig.id = uid + '-t' + i;
      trig.addEventListener('pointerenter', function () { arm(trig); });
      trig.addEventListener('pointerleave', disarm);
      trig.addEventListener('focus', function () {
        clearTimeout(openT); clearTimeout(closeT);
        show(trig, false);
        say('Open immediately — keyboard focus takes no delay', 'ok');
      });
      trig.addEventListener('blur', function () { clearTimeout(openT); hide('Closed on blur'); });
      trig.addEventListener('click', function (e) { e.preventDefault(); });
    });

    tip.addEventListener('pointerenter', function () {
      clearTimeout(closeT);
      say('Held open — the pointer is inside the tooltip', 'ok');
    });
    tip.addEventListener('pointerleave', disarm);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        clearTimeout(openT); clearTimeout(closeT);
        hide('Dismissed with Escape — focus stayed on the trigger');
      }
    });
    window.addEventListener('scroll', function () {
      if (isOpen) { clearTimeout(openT); clearTimeout(closeT); hide('Closed on scroll'); }
    }, true);

    say('Idle — hover or tab to a trigger', '');
  });

  /* ── Live checkbox: the parent/child indeterminate contract ──
     Real inputs, so indeterminate is the DOM property and the
     announcement is the browser's. The parent never becomes
     indeterminate by being clicked; it only reports its children. */
  [].slice.call(document.querySelectorAll('.cbxlive')).forEach(function (box) {
    var parent = box.querySelector('.cbxlive-parent input');
    var kids   = [].slice.call(box.querySelectorAll('.cbxlive-kid input'));
    var count  = box.querySelector('.cbxlive-count');
    var read   = box.querySelector('.cbxlive-state');
    if (!parent || !kids.length) return;

    function sync(note) {
      var on = kids.filter(function (k) { return k.checked; }).length;
      parent.checked = on === kids.length;
      parent.indeterminate = on > 0 && on < kids.length;
      if (count) count.textContent = '(' + on + ' of ' + kids.length + ')';
      if (read) {
        var s = parent.indeterminate ? 'Indeterminate'
              : parent.checked ? 'Checked' : 'Unchecked';
        var next = parent.checked ? 'unchecks all' : 'checks all';
        read.textContent = note ? note
          : 'Parent is ' + s + ' — aria-checked="' +
            (parent.indeterminate ? 'mixed' : parent.checked) +
            '". Clicking it ' + next + '.';
        read.className = 'cbxlive-state' + (parent.indeterminate ? ' wait' : ' ok');
      }
    }

    parent.addEventListener('click', function () {
      // From indeterminate a click always checks all. It never unchecks,
      // and it never cycles back to partial.
      var wasMixed = count && /\(([0-9]+) of/.test(count.textContent)
                   ? Number(RegExp.$1) > 0 && Number(RegExp.$1) < kids.length : false;
      var target = wasMixed ? true : parent.checked;
      kids.forEach(function (k) { k.checked = target; });
      sync(wasMixed
        ? 'Was indeterminate — the click checked all, it did not clear them.'
        : null);
      setTimeout(function () { sync(); }, 1800);
    });

    kids.forEach(function (k) {
      k.addEventListener('change', function () { sync(); });
    });
    sync();
  });

  /* ── Live table selection: header scope, shift-click ranges ── */
  [].slice.call(document.querySelectorAll('.selive')).forEach(function (box) {
    var head = box.querySelector('.selive-all input');
    var rows = [].slice.call(box.querySelectorAll('.selive-row input'));
    var bar  = box.querySelector('.selive-bar');
    var read = box.querySelector('.selive-state');
    var TOTAL = Number(box.getAttribute('data-total') || rows.length);
    var last = null, wide = false;
    if (!head || !rows.length) return;

    function sync(note) {
      var on = rows.filter(function (r) { return r.checked; }).length;
      head.checked = on === rows.length;
      head.indeterminate = on > 0 && on < rows.length;
      if (bar) {
        if (!on) { bar.hidden = true; }
        else {
          bar.hidden = false;
          bar.innerHTML = wide
            ? '<b>All ' + TOTAL.toLocaleString() + ' matching rows selected.</b> '
              + '<button type="button" class="selive-undo">Select only these ' + on + '</button>'
            : '<b>' + on + ' selected</b> — the ' + rows.length + ' rows loaded here.'
              + (on === rows.length
                 ? ' <button type="button" class="selive-wide">Select all '
                   + TOTAL.toLocaleString() + ' matching?</button>' : '');
        }
      }
      if (read) read.textContent = note || (on ? on + ' of ' + rows.length + ' loaded rows'
                                               : 'Nothing selected');
    }

    head.addEventListener('click', function () {
      var on = rows.filter(function (r) { return r.checked; }).length;
      var target = (on > 0 && on < rows.length) ? true : head.checked;
      rows.forEach(function (r) { r.checked = target; });
      wide = false; last = null;
      sync('Header selects the loaded rows only — never the whole result set.');
      setTimeout(function () { sync(); }, 2200);
    });

    /* Shift-click has to be handled on the row, not on the input.
       Chrome suppresses a <label>'s activation behaviour entirely when Shift
       is held — it treats the gesture as a text-range selection — so the
       input never receives a click and never toggles. Listening on the input
       alone silently does nothing. */
    var labels = [].slice.call(box.querySelectorAll('.selive-row'));
    labels.forEach(function (lab, i) {
      lab.addEventListener('click', function (e) {
        if (e.shiftKey && last !== null && last !== i) {
          e.preventDefault();
          var anchor = rows[last].checked;              // the row clicked first
          var a = Math.min(last, i), b = Math.max(last, i);
          for (var n = a; n <= b; n++) rows[n].checked = anchor;
          wide = false;
          sync('Shift-click — rows ' + (a + 1) + ' to ' + (b + 1) +
               ' took the state of row ' + (last + 1) + '.');
          setTimeout(function () { sync(); }, 2400);
          last = i;
          return;
        }
        last = i;
      });
    });

    rows.forEach(function (r) {
      r.addEventListener('change', function () { wide = false; sync(); });
    });

    box.addEventListener('click', function (e) {
      var t = e.target;
      if (t.classList && t.classList.contains('selive-wide')) {
        wide = true; sync('Widening the selection is an explicit second step, in words.');
        setTimeout(function () { sync(); }, 2200);
      }
      if (t.classList && t.classList.contains('selive-undo')) { wide = false; sync(); }
    });

    var filter = box.querySelector('.selive-filter');
    if (filter) filter.addEventListener('click', function () {
      rows.forEach(function (r) { r.checked = false; });
      wide = false; last = null;
      sync('Filter changed — the selection was cleared, not carried over.');
      setTimeout(function () { sync(); }, 2600);
    });

    sync();
  });

  /* ── Live radio group ──────────────────────────────────────
     Almost all of this is native and free, which is the point:
     a shared name makes the group one tab stop, arrow keys move
     AND select, and there is no way back to nothing. The script
     only narrates what the browser already does. Each bench
     instance gets its own name, or the light and dark panes
     would be one group and fight each other. */
  [].slice.call(document.querySelectorAll('.radlive')).forEach(function (box, boxN) {
    var radios = [].slice.call(box.querySelectorAll('.radlive-opt input'));
    var read   = box.querySelector('.radlive-state');
    if (!radios.length) return;

    var name = 'radlive' + boxN;
    radios.forEach(function (r) { r.name = name; });

    var lastKey = null;
    function say(s, cls) {
      if (!read) return;
      read.textContent = s;
      read.className = 'radlive-state' + (cls ? ' ' + cls : '');
    }
    function labelOf(r) {
      return (r.closest('label') || {}).textContent
        ? r.closest('label').textContent.trim() : r.value;
    }

    box.addEventListener('keydown', function (e) {
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) > -1) {
        lastKey = e.key;
      } else if (e.key === ' ') {
        lastKey = 'Space';
      } else { lastKey = null; }
    });

    radios.forEach(function (r) {
      r.addEventListener('change', function () {
        if (lastKey && lastKey !== 'Space') {
          say(lastKey.replace('Arrow', '') + ' moved to "' + labelOf(r) +
              '" and selected it in the same keystroke. Arrow keys do both.', 'ok');
        } else {
          say('"' + labelOf(r) + '" selected. The others cleared themselves — ' +
              'that is the browser, not script.', 'ok');
        }
        lastKey = null;
      });
      r.addEventListener('focus', function () {
        if (!lastKey) {
          say('Focus entered the group. Four options, one tab stop — Tab again ' +
              'leaves, it does not step through them.', 'wait');
        }
      });
    });

    var after = box.querySelector('.radlive-after');
    if (after) after.addEventListener('focus', function () {
      say('Tab left the whole group in one press.', '');
    });

    var checked = radios.filter(function (r) { return r.checked; })[0];
    say(checked ? '"' + labelOf(checked) + '" is selected. There is no gesture that ' +
                  'returns this group to nothing.'
               : 'Nothing selected yet.', '');
  });

  /* ── Live progress bar ─────────────────────────────────────
     Determinate movement, the indeterminate case, and what
     happens when the job fails. The value text is the component's
     job, not the caller's, and it is what carries status — the
     fill colour only reinforces it. */
  [].slice.call(document.querySelectorAll('.pblive')).forEach(function (box) {
    var bar  = box.querySelector('.t-pbar');
    var fil  = box.querySelector('.t-pbar > i');
    var val  = null;   /* the atom carries no value text */
    var lab  = null;   /* and no label */
    var read = box.querySelector('.pblive-state');
    var btns = [].slice.call(box.querySelectorAll('.pblive-btn'));
    if (!bar || !fil) return;

    var pct = 0, timer = null;

    function say(s) { if (read) read.textContent = s; }

    function paint(p, statusLabel) {
      pct = p;
      fil.style.width = p + '%';
      if (val) val.textContent = Math.round(p) + '%';
      if (lab && statusLabel) lab.textContent = statusLabel;
      bar.setAttribute('aria-valuenow', String(Math.round(p)));
    }

    function reset(cls) {
      clearInterval(timer);
      bar.classList.remove('ind');
      bar.removeAttribute('aria-busy');
      if (cls) bar.classList.add(cls);
      if (val) val.hidden = false;
    }

    function run(endAt, thenSay) {
      reset();
      paint(0);
      timer = setInterval(function () {
        var next = pct + (3 + Math.random() * 5);
        if (next >= endAt) {
          paint(endAt);
          clearInterval(timer);
          say(thenSay);
        } else { paint(next); }
      }, 90);
    }

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mode = btn.getAttribute('data-mode');
        if (mode === 'run') {
          run(100,
              'Finished at 100%. The fill did not change colour on the way — the atom ' +
              'has one fill token and keeps it.');
          say('Running. 240ms on width, cubic-bezier(.22, 1, .36, 1).');
        }
        if (mode === 'stop') {
          reset();
          paint(0);
          say('Idle.');
        }
      });
    });

    paint(0);
    say('Idle.');
  });
})();
