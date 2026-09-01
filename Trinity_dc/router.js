/* ═══════════════════════════════════════════════════════════════════
   router.js — route registry + goTo(). Loads LAST (after comments.js
   and testing.js) so it can wrap their render functions.

   WHY THIS FILE EXISTS
   The prototype already writes a hash on every navigation (app-06's
   wrapper layer) and comments.js already stores that hash on every
   pin. What was missing is the reverse direction: nothing could READ
   a route and drive the UI there. applyHashRoute() in app-06 does a
   one-shot restore at load with blind setTimeout chains, but it can't
   be called for an arbitrary route mid-session, and it only knows
   trucks/units.

   THE CONTRACT
   - Each screen registers a resolver: rtRegister(pattern, fn).
     Patterns are hash segments, ':name' captures a param.
   - rtGoTo(route) matches the most specific pattern and runs its
     resolver. Resolvers are async and use rtWaitFor() to poll for
     real DOM conditions instead of guessing at timeouts — that
     guessing is what killed the first Jump-to attempt.
   - Consumers (comments Jump, dashboard see-location, ?jump= links)
     never touch app internals. They only speak routes.

   THIS FILE CURRENTLY REGISTERS THE DESKTOP TRUCKS SLICE ONLY:
     desktop
     desktop/trucks
     desktop/trucks/wts|overview|cc
     desktop/trucks/:truck
     desktop/trucks/:truck/:tab
   Once the pattern is approved, registrations migrate into the app
   file that owns each screen (map into app-04, tickets into app-01,
   mobile into app-03/05) and this file keeps only the engine.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Engine ─────────────────────────────────────────────────────── */

var RT = { routes: [] };

function rtRegister(pattern, resolver) {
  RT.routes.push({ segs: pattern.split('/'), resolver: resolver });
}

/* Most-specific match wins: more segments beats fewer, and among
   equal lengths, more literal (non-param) segments beats fewer. */
function rtMatch(route) {
  var parts = String(route || '').replace(/^#/, '').split('/').filter(Boolean);
  var best = null, bestScore = -1;
  RT.routes.forEach(function (r) {
    if (r.segs.length !== parts.length) return;
    var params = {}, literals = 0, ok = true;
    for (var i = 0; i < r.segs.length; i++) {
      var s = r.segs[i];
      if (s.charAt(0) === ':') { params[s.slice(1)] = parts[i]; }
      else if (s === parts[i]) { literals++; }
      else { ok = false; break; }
    }
    if (!ok) return;
    var score = parts.length * 100 + literals;
    if (score > bestScore) { bestScore = score; best = { reg: r, params: params }; }
  });
  return best;
}

function rtCanResolve(route) { return !!rtMatch(route); }

/* Poll until testFn() returns truthy, or give up. Resolves with the
   truthy value so resolvers can waitFor an element and then use it. */
function rtWaitFor(testFn, timeoutMs, intervalMs) {
  timeoutMs = timeoutMs || 3000; intervalMs = intervalMs || 60;
  return new Promise(function (resolve, reject) {
    var t0 = Date.now();
    (function poll() {
      var v = null;
      try { v = testFn(); } catch (e) {}
      if (v) return resolve(v);
      if (Date.now() - t0 > timeoutMs) return reject(new Error('rtWaitFor timeout'));
      setTimeout(poll, intervalMs);
    })();
  });
}

function rtGoTo(route) {
  var m = rtMatch(route);
  if (!m) {
    console.warn('[router] no resolver for', route);
    return Promise.reject(new Error('no resolver: ' + route));
  }
  var out;
  try { out = m.reg.resolver(m.params); } catch (e) { return Promise.reject(e); }
  return Promise.resolve(out);
}

/* ── Shared resolver steps ──────────────────────────────────────── */

/* setView is already wrapped by app-06 to keep the hash current, so
   calling it here maintains the hash for free. Skip if already there:
   setView rebuilds tables, and a no-op rebuild flashes the screen. */
function rtEnsureDesktop() {
  if (!document.body.classList.contains('view-desktop')) setView('desktop');
  return rtWaitFor(function () {
    return document.body.classList.contains('view-desktop');
  });
}

function rtEnsureDtPage(page) {
  return rtEnsureDesktop().then(function () {
    var el = document.getElementById('dt-page-' + page);
    var visible = el && el.style.display !== 'none' &&
      (page !== 'home' || el.classList.contains('active'));
    if (!visible) dtNavGo(page);
    return rtWaitFor(function () {
      var p = document.getElementById('dt-page-' + page);
      return p && p.style.display !== 'none' ? p : null;
    });
  });
}

/* A route names ONE state, so a jump must close whatever drawer the
   route does NOT mention. Truck (#dt-drawer) and unit (#dt-ud-drawer)
   drawers are separate elements over a shared scrim — without this,
   jumping across them stacks both open. dtUdClose also reverts a
   half-finished Pending link, which is the right side effect when
   navigating away mid-flow. */
function rtCloseOtherDrawers(keep) {
  var td = document.getElementById('dt-drawer');
  if (keep !== 'truck' && td && td.classList.contains('open')) dtCloseDrawer();
  var ud = document.getElementById('dt-ud-drawer');
  if (keep !== 'unit' && ud && ud.classList.contains('open') &&
      typeof dtUdClose === 'function') dtUdClose();
  var tk = document.getElementById('dt-ticket-drawer');
  if (keep !== 'ticket' && tk && tk.classList.contains('open') &&
      typeof tkCloseDrawer === 'function') tkCloseDrawer();
}

/* Nav functions that take an element (dtSelectTab, dtDrawerTab) get
   the real button, found by its own onclick string — the one selector
   that survives both the static markup and app-06's rebuilt tab sets. */
function rtFindByOnclick(scopeSel, fnName, arg) {
  return document.querySelector(scopeSel + ' [onclick*="' + fnName + '(\'' + arg + '\'"]');
}

/* ── Desktop trucks slice ───────────────────────────────────────── */

rtRegister('desktop', function () {
  return rtEnsureDesktop();
});

/* Page-level fallback for every desktop page. Comments dropped on
   Software Update, Map, Tickets, Units, or Home stored routes like
   'desktop/update' (dtNavGo's wrapper writes those; sub-tab state
   inside them isn't hash-written yet). A page-level jump still lands
   you on the right screen with the pin rendered — better than no
   button while deep resolvers for those pages get built. */
['home', 'units', 'tickets', 'update', 'map'].forEach(function (page) {
  rtRegister('desktop/' + page, function () {
    return rtEnsureDtPage(page).then(function () {
      rtCloseOtherDrawers(null);
    });
  });
});

rtRegister('desktop/trucks', function () {
  return rtEnsureDtPage('trucks').then(function () {
    /* Route says list, not drawer — close anything open. */
    rtCloseOtherDrawers(null);
  });
});

['wts', 'overview', 'cc'].forEach(function (sub) {
  rtRegister('desktop/trucks/' + sub, function () {
    return rtEnsureDtPage('trucks').then(function () {
      rtCloseOtherDrawers(null);
      var btn = rtFindByOnclick('#dt-page-trucks', 'dtSelectTab', sub);
      if (btn && !btn.classList.contains('active')) dtSelectTab(sub, btn);
    });
  });
});

rtRegister('desktop/trucks/:truck', function (p) {
  return rtOpenDtTruck(p.truck, 'overview');
});

rtRegister('desktop/trucks/:truck/:tab', function (p) {
  return rtOpenDtTruck(p.truck, p.tab || 'overview');
});

function rtOpenDtTruck(truckNum, tab) {
  return rtEnsureDtPage('trucks').then(function () {
    if (typeof trucks !== 'undefined' && !trucks.find(function (t) { return t.num === truckNum; })) {
      console.warn('[router] unknown truck', truckNum);
      return;
    }
    rtCloseOtherDrawers('truck');
    /* Reopen even if this truck is already showing — dtOpenTruck is
       idempotent and it resets the drawer to a known Overview state,
       which is exactly the clean base the tab step needs. */
    dtOpenTruck(truckNum);
    return rtWaitFor(function () {
      var d = document.getElementById('dt-drawer');
      return d && d.classList.contains('open') ? d : null;
    }).then(function () {
      if (!tab || tab === 'overview') return;
      return rtWaitFor(function () {
        return rtFindByOnclick('#dt-drawer', 'dtDrawerTab', tab);
      }).then(function (btn) {
        dtDrawerTab(tab, btn);
      });
    });
  });
}

/* ── Desktop units drawer ───────────────────────────────────────── */

rtRegister('desktop/units/:unit', function (p) {
  return rtOpenDtUnit(p.unit, null);
});

rtRegister('desktop/units/:unit/:tab', function (p) {
  return rtOpenDtUnit(p.unit, p.tab);
});

function rtOpenDtUnit(unitId, tab) {
  return rtEnsureDtPage('units').then(function () {
    /* dtUdOpen validates the id and only opens Unlinked / Pending /
       Linked units — a silent return means the drawer never opens and
       the waitFor below times out into the catch. Check up front so
       the failure names itself. */
    var u = (typeof UNITS_DATA !== 'undefined') &&
      UNITS_DATA.find(function (x) { return x.id === unitId; });
    if (!u) { console.warn('[router] unknown unit', unitId); return; }
    rtCloseOtherDrawers('unit');
    dtUdOpen(unitId);
    return rtWaitFor(function () {
      var d = document.getElementById('dt-ud-drawer');
      return d && d.classList.contains('open') ? d : null;
    }).then(function () {
      if (!tab) return;
      /* Unit tabs vary by status (Linked gets six, Unlinked gets two).
         If the stored tab doesn't exist for this unit's CURRENT status
         — it may have been linked/unlinked since the comment — land on
         the default tab rather than failing the whole jump. */
      return rtWaitFor(function () {
        return document.getElementById('dt-ud-tabs');
      }).then(function () {
        var btn = rtFindByOnclick('#dt-ud-tabs', 'dtUdSelectTab', tab);
        if (btn) dtUdSelectTab(tab);
        else console.warn('[router] tab', tab, 'not available for unit', unitId, '— left on default');
      });
    });
  });
}

/* ── Hash-writer gap fix ────────────────────────────────────────────
   app-06 wraps `selectDtTab` to write the hash on desktop sub-tab
   switches, but the live function is `dtSelectTab` — the wrapper never
   fires, so a comment dropped on Overview/CC captured a stale route.
   Wrap the real one. Same wrap-don't-edit pattern as app-10's tkTab. */
(function () {
  if (typeof dtSelectTab !== 'function' || dtSelectTab.__rtWrapped) return;
  var orig = dtSelectTab;
  dtSelectTab = function (tab, el) {
    orig.call(this, tab, el);
    if (typeof setHash === 'function') setHash(['desktop', 'trucks', tab]);
  };
  dtSelectTab.__rtWrapped = true;
})();

/* app-06's dtDrawerTab wrapper guesses the truck number from hash
   position with a length<=6 test — and the slug 'logs' is 4 chars, so
   clicking the Logs tab wrote hashes like desktop/trucks/logs/logs.
   dtDrawerTruckNum is the drawer's own source of truth; rewrite the
   hash from it after the (already wrapped) original runs. */
(function () {
  if (typeof dtDrawerTab !== 'function' || dtDrawerTab.__rtHashFix) return;
  var orig = dtDrawerTab;
  dtDrawerTab = function (tab, el) {
    orig.call(this, tab, el);
    if (typeof dtDrawerTruckNum !== 'undefined' && dtDrawerTruckNum &&
        typeof setHash === 'function') {
      setHash(['desktop', 'trucks', dtDrawerTruckNum, tab]);
    }
  };
  dtDrawerTab.__rtHashFix = true;
})();

/* ── Comments: Jump button ──────────────────────────────────────────
   comments.js already stores the route inside each pin's anchor
   (cmtAnchorParts splits it back out). The drawer renders rows in a
   deterministic order — newest first, then the active filter — so the
   wrapper below rebuilds that same list to pair each row with its
   comment, then appends a Jump button wherever the registry can
   actually resolve the stored route. Unresolvable routes (screens not
   yet registered) get no button rather than a dead one.

   Coupled to cmtDrawerRender's sort+filter. If that ordering ever
   changes, change rtCmtList() to match. */

function rtCmtList() {
  var all = cmtState.comments.slice().sort(function (a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  return all.filter(function (c) {
    if (cmtDrawerFilter === 'open') return c.status !== 'done';
    if (cmtDrawerFilter === 'done') return c.status === 'done';
    return true;
  });
}

function rtCmtJump(c) {
  var route = cmtAnchorParts(c).route;
  if (!route) return;
  cmtDrawerClose();
  rtGoTo(route).then(function () {
    /* Pins re-render on body-class mutations with a 450ms debounce;
       force it now so the flash doesn't race the debounce. */
    cmtSetVisible(true);
    cmtRenderAll();
    return rtWaitFor(function () {
      return document.querySelector('.cmt-pin[data-cmt-id="' + c.id + '"]');
    }, 2500);
  }).then(function (pin) {
    pin.classList.add('cmt-flash');
    pin.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    setTimeout(function () { pin.classList.remove('cmt-flash'); }, 2600);
  }).catch(function (e) {
    console.warn('[router] jump failed', e);
  });
}

(function rtHookCmtDrawer() {
  if (typeof cmtDrawerRender !== 'function' || cmtDrawerRender.__rtWrapped) return;
  var orig = cmtDrawerRender;
  cmtDrawerRender = function () {
    orig.apply(this, arguments);
    var listEl = document.getElementById('cmt-dlist');
    if (!listEl) return;
    var rows = listEl.querySelectorAll('.cmt-drow');
    var list = rtCmtList();
    rows.forEach(function (row, i) {
      var c = list[i];
      if (!c) return;
      var route = cmtAnchorParts(c).route;
      if (!route || !rtCanResolve(route)) return;
      var acts = row.querySelector('.cmt-dacts');
      if (!acts || acts.querySelector('[data-act="jump"]')) return;
      var btn = document.createElement('button');
      btn.className = 'cmt-dact cmt-dact-primary';
      btn.dataset.act = 'jump';
      btn.textContent = 'Jump to';
      btn.addEventListener('click', function () { rtCmtJump(c); });
      acts.insertBefore(btn, acts.firstChild);
    });
  };
  cmtDrawerRender.__rtWrapped = true;
})();

/* Flash animation for the jumped-to pin */
(function () {
  var el = document.createElement('style');
  el.textContent =
    '@keyframes rtPinFlash{0%,100%{transform:scale(1);box-shadow:0 2px 8px rgba(0,0,0,0.35);}' +
    '50%{transform:scale(1.35);box-shadow:0 0 0 6px rgba(48,105,227,0.28),0 2px 8px rgba(0,0,0,0.35);}}' +
    '.cmt-pin.cmt-flash{animation:rtPinFlash 0.65s ease-in-out 3;z-index:1300;}';
  document.head.appendChild(el);
})();

/* ── Shell scroll guard ─────────────────────────────────────────────
   scrollIntoView() scrolls EVERY scrollable ancestor — including
   overflow:hidden ones — and the codebase calls it from 15+ places.
   When a target is mid-animation or inside a translated panel at
   measure time, the browser scrolls the .phone shell sideways to
   reach it, and with no scrollbar there is no way back: the parked
   ticket drawer (translateX just past the phone's right edge) slides
   into view looking like a mystery panel. The shell containers are
   never legitimately horizontally scrolled — tables and tab strips
   scroll their OWN inner containers — so pin them at scrollLeft 0.
   Vertical is untouched. */
(function () {
  function pin(el) {
    if (!el) return;
    if (el.scrollLeft !== 0) el.scrollLeft = 0;
    el.addEventListener('scroll', function () {
      if (el.scrollLeft !== 0) el.scrollLeft = 0;
    }, { passive: true });
  }
  pin(document.querySelector('.phone-wrap'));
  pin(document.querySelector('.phone'));
  pin(document.getElementById('s-desktop'));
})();

/* ── ?jump= deep link ───────────────────────────────────────────────
   The dashboard's see-location (and anyone pasting a link) can open
   the prototype at index.html?jump=desktop/trucks/45689/logs. Runs
   after app-06's own applyHashRoute load restore, and wins, because
   an explicit link beats a remembered hash. */
(function () {
  var q = new URLSearchParams(location.search);
  var jump = q.get('jump');
  if (!jump) return;
  setTimeout(function () {
    rtGoTo(jump)
      .catch(function (e) { console.warn('[router] ?jump failed', e); })
      .then(function () {
        /* A ping link keeps the boot veil up until the dot (or the
           auto-walk's own veil) takes over — the jump landing is not
           the answer the user came for, the dot is. */
        if (!q.get('ping') && window.bootVeilLift) window.bootVeilLift();
      });
  }, 400);
})();
