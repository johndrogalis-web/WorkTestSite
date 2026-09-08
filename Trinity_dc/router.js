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

   WHAT THIS FILE REGISTERS
     desktop, desktop/home|units|tickets|update|map
     desktop/trucks, desktop/trucks/wts|overview|cc
     desktop/trucks/:truck[/:tab], desktop/units/:unit[/:tab]
     mobile,  mobile/trucks[/wts|overview|cc], mobile/trucks/:truck[/:tab]
     mobile/units, mobile/units/:unit[/:tab]
     tablet,  tablet/trucks[/wts|overview|cc], tablet/trucks/:truck[/:tab]
     tablet/units, tablet/units/:unit[/:tab]

   That is every route the hash writers in app-06 actually produce.
   Sub-tab state inside Map, Software Update and Tickets is not written
   to the hash by anything, so there is nothing to resolve there and no
   resolver is registered — those screens land at page level. Adding
   them means adding hash writers first.

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

/* "Visible" used to mean "inline style.display is not none". That held
   while every desktop page toggled its own inline display. app-13's
   Dashboards page hides the other pages some other way, so #dt-page-trucks
   kept a blank inline display while the dashboard was on screen, the
   router believed trucks was showing, skipped dtNavGo, and opened the
   truck drawer on top of the dashboard. Ask the layout engine instead:
   a page is on screen only if it has a laid-out box with height. */
function rtDtPageOnScreen(page) {
  var el = document.getElementById('dt-page-' + page);
  if (!el) return null;
  if (page === 'home' && !el.classList.contains('active')) return null;
  var cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return null;
  var r = el.getBoundingClientRect();
  return (r.width > 0 && r.height > 0) ? el : null;
}

function rtEnsureDtPage(page) {
  return rtEnsureDesktop().then(function () {
    if (!rtDtPageOnScreen(page)) dtNavGo(page);
    return rtWaitFor(function () { return rtDtPageOnScreen(page); });
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
['home', 'dashboard', 'units', 'tickets', 'update', 'map'].forEach(function (page) {
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

/* ── Mobile and tablet slices ───────────────────────────────────────
   Same contract as desktop: a route names ONE state, so each resolver
   closes what the route doesn't mention before opening what it does.
   Every app function is typeof-guarded — an unregistered or renamed
   function warns and lands you at page level instead of throwing and
   killing the jump. ── */

/* setView preserves orientation through vpApplyOrient, so a resolver
   never needs to know which way the device is turned. */
function rtEnsureView(view) {
  if (!document.body.classList.contains('view-' + view)) setView(view);
  return rtWaitFor(function () {
    return document.body.classList.contains('view-' + view);
  });
}

function rtVisible(id) {
  var el = document.getElementById(id);
  if (!el) return false;
  return getComputedStyle(el).display !== 'none';
}

/* ── Mobile ─────────────────────────────────────────────────────── */

/* Route slug → the label the mobile nav functions expect. Mirrors the
   label → slug maps in app-06's hash writers; if a tab is renamed
   there, rename it here too or the jump lands on the default tab. */
var RT_MO_WTS = {
  wts:      'Where to start',
  overview: 'Overview',
  cc:       'Components Condition'
};
var RT_MO_DRAWER_TAB = {
  components: 'Components Overview',
  overview:   'Components Overview',   /* openDrawer writes 'overview' */
  timeline:   'Component Timeline',
  logs:       'Truck Logs',
  manual:     'Manual Control',
  sensor:     'Sensor',
  config:     'Configuration'
};

function rtMoCloseDrawers(keep) {
  var d = document.getElementById('drawer');
  if (keep !== 'truck' && d && d.classList.contains('open') &&
      typeof closeDrawer === 'function') closeDrawer();
  if (keep !== 'unit' && rtVisible('units-drawer') &&
      typeof closeUnitDetail === 'function') closeUnitDetail();
}

function rtMoTrucks() {
  return rtEnsureView('mobile').then(function () {
    rtMoCloseDrawers(null);
    if (typeof goToAllTrucks === 'function') goToAllTrucks();
    return rtWaitFor(function () {
      var s = document.getElementById('s-main');
      return s && s.classList.contains('active') ? s : null;
    });
  });
}

function rtMoUnits() {
  return rtEnsureView('mobile').then(function () {
    rtMoCloseDrawers(null);
    if (typeof openUnits === 'function') openUnits();
    return rtWaitFor(function () {
      var s = document.getElementById('s-units');
      return s && s.classList.contains('active') ? s : null;
    });
  });
}

function rtMoOpenTruck(truckNum, tab) {
  return rtMoTrucks().then(function () {
    var i = (typeof trucks !== 'undefined')
      ? trucks.findIndex(function (t) { return String(t.num) === String(truckNum); }) : -1;
    if (i < 0) { console.warn('[router] unknown truck', truckNum); return; }
    rtMoCloseDrawers('truck');
    openDrawer(i);
    return rtWaitFor(function () {
      var d = document.getElementById('drawer');
      return d && d.classList.contains('open') ? d : null;
    }).then(function () {
      var label = RT_MO_DRAWER_TAB[tab];
      /* selectDrawerNav resolves its own element from the label, so the
         second argument is deliberately omitted. */
      if (label && typeof selectDrawerNav === 'function') selectDrawerNav(label);
      else if (tab && !label) console.warn('[router] unknown mobile tab', tab);
    });
  });
}

function rtMoOpenUnit(unitId, tab) {
  return rtMoUnits().then(function () {
    var u = (typeof UNITS_DATA !== 'undefined') &&
      UNITS_DATA.find(function (x) { return x.id === unitId; });
    if (!u) { console.warn('[router] unknown unit', unitId); return; }
    rtMoCloseDrawers('unit');
    openUnitDetail(unitId);
    return rtWaitFor(function () {
      return rtVisible('units-drawer') ? 1 : null;
    }).then(function () {
      /* Unit tabs vary by status, same as desktop. udSelectNavTab takes
         the slug straight, so no label map is needed here. */
      if (tab && typeof udSelectNavTab === 'function') udSelectNavTab(tab, null);
    });
  });
}

rtRegister('mobile', function () { return rtEnsureView('mobile'); });
rtRegister('mobile/trucks', function () { return rtMoTrucks(); });
rtRegister('mobile/units',  function () { return rtMoUnits(); });

Object.keys(RT_MO_WTS).forEach(function (sub) {
  rtRegister('mobile/trucks/' + sub, function () {
    return rtMoTrucks().then(function () {
      if (typeof selectWts === 'function') selectWts(RT_MO_WTS[sub]);
    });
  });
});

/* ':truck' is registered AFTER the three literal sub-tabs, but rtMatch
   scores literals above params at equal depth, so 'mobile/trucks/cc'
   still reaches the sub-tab resolver rather than being read as a truck
   number. Order here is cosmetic. */
rtRegister('mobile/trucks/:truck',      function (p) { return rtMoOpenTruck(p.truck, null); });
rtRegister('mobile/trucks/:truck/:tab', function (p) { return rtMoOpenTruck(p.truck, p.tab); });
rtRegister('mobile/units/:unit',        function (p) { return rtMoOpenUnit(p.unit, null); });
rtRegister('mobile/units/:unit/:tab',   function (p) { return rtMoOpenUnit(p.unit, p.tab); });

/* ── Tablet ─────────────────────────────────────────────────────────
   Tablet is not mobile with a wider frame: it has its own page nav
   (tbNavTrucks/tbNavUnits), its own drawer (#tb-drawer, tbOpenTruck),
   and its own unit drawer (tbUdOpen). Same route shapes, different
   functions underneath. Tab slugs match the desktop set. ── */

function rtTbCloseDrawers(keep) {
  var d = document.getElementById('tb-drawer');
  if (keep !== 'truck' && d && d.classList.contains('open') &&
      typeof tbCloseDrawer === 'function') tbCloseDrawer();
  var ud = document.getElementById('tb-ud-drawer');
  if (keep !== 'unit' && ud && ud.classList.contains('open') &&
      typeof tbUdClose === 'function') tbUdClose();
}

function rtTbTrucks() {
  return rtEnsureView('tablet').then(function () {
    rtTbCloseDrawers(null);
    if (typeof tbNavTrucks === 'function') tbNavTrucks();
    return rtWaitFor(function () { return rtVisible('tb-content') ? 1 : null; });
  });
}

function rtTbUnits() {
  return rtEnsureView('tablet').then(function () {
    rtTbCloseDrawers(null);
    if (typeof tbNavUnits === 'function') tbNavUnits();
    return rtWaitFor(function () { return rtVisible('tb-page-units') ? 1 : null; });
  });
}

function rtTbOpenTruck(truckNum, tab) {
  return rtTbTrucks().then(function () {
    if (typeof tbOpenTruck !== 'function') return;
    rtTbCloseDrawers('truck');
    tbOpenTruck(truckNum);
    return rtWaitFor(function () {
      var d = document.getElementById('tb-drawer');
      return d && d.classList.contains('open') ? d : null;
    }).then(function () {
      if (!tab || tab === 'overview') return;
      var btn = rtFindByOnclick('#tb-drawer', 'tbDrawerTab', tab);
      if (btn) tbDrawerTab(tab, btn);
      else console.warn('[router] tab', tab, 'not available on tablet drawer');
    });
  });
}

function rtTbOpenUnit(unitId, tab) {
  return rtTbUnits().then(function () {
    if (typeof tbUdOpen !== 'function') return;
    rtTbCloseDrawers('unit');
    tbUdOpen(unitId);
    return rtWaitFor(function () {
      var d = document.getElementById('tb-ud-drawer');
      return d && d.classList.contains('open') ? d : null;
    }).then(function () {
      if (tab && typeof tbUdSelectTab === 'function') tbUdSelectTab(tab);
    });
  });
}

rtRegister('tablet', function () { return rtEnsureView('tablet'); });
rtRegister('tablet/trucks', function () { return rtTbTrucks(); });
rtRegister('tablet/units',  function () { return rtTbUnits(); });

['wts', 'overview', 'cc'].forEach(function (sub) {
  rtRegister('tablet/trucks/' + sub, function () {
    return rtTbTrucks().then(function () {
      var btn = rtFindByOnclick('#tb-page', 'tbSelectTab', sub);
      if (btn && typeof tbSelectTab === 'function') tbSelectTab(sub, btn);
    });
  });
});

rtRegister('tablet/trucks/:truck',      function (p) { return rtTbOpenTruck(p.truck, null); });
rtRegister('tablet/trucks/:truck/:tab', function (p) { return rtTbOpenTruck(p.truck, p.tab); });
rtRegister('tablet/units/:unit',        function (p) { return rtTbOpenUnit(p.unit, null); });
rtRegister('tablet/units/:unit/:tab',   function (p) { return rtTbOpenUnit(p.unit, p.tab); });

/* ── Tablet hash-writer gap ─────────────────────────────────────────
   app-06 wraps the MOBILE nav functions and hardcodes 'mobile' into
   every setHash call, so a tablet session wrote mobile/... routes, or
   nothing at all where tablet uses its own tb* functions. Validate
   replays from the stored route, so a tablet task carrying a mobile
   route would reset onto the wrong surface. Wrap the tablet functions
   the same way app-06 wraps the mobile ones. ── */
(function rtTabletHashWriters() {
  function wrap(name, parts) {
    var fn = window[name];
    if (typeof fn !== 'function' || fn.__rtHash) return;
    window[name] = function () {
      var out = fn.apply(this, arguments);
      try {
        if (typeof setHash === 'function' &&
            document.body.classList.contains('view-tablet')) {
          var p = parts.apply(this, arguments);
          if (p) setHash(p);
        }
      } catch (e) {}
      return out;
    };
    window[name].__rtHash = true;
  }

  wrap('tbNavTrucks', function () { return ['tablet', 'trucks']; });
  wrap('tbNavUnits',  function () { return ['tablet', 'units']; });
  wrap('tbNavUpdate', function () { return ['tablet', 'update']; });
  wrap('tbNavMap',    function () { return ['tablet', 'map']; });
  wrap('tbSelectTab', function (tab) { return ['tablet', 'trucks', tab]; });
  wrap('tbOpenTruck', function (num) { return ['tablet', 'trucks', num, 'overview']; });
  wrap('tbCloseDrawer', function () { return ['tablet', 'trucks']; });
  wrap('tbDrawerTab', function (tab) {
    var num = (typeof tbDrawerTruck !== 'undefined' && tbDrawerTruck) ? tbDrawerTruck.num : '';
    return num ? ['tablet', 'trucks', num, tab] : null;
  });
  wrap('tbUdOpen',      function (id) { return ['tablet', 'units', id, 'lifespan']; });
  wrap('tbUdClose',     function () { return ['tablet', 'units']; });
  wrap('tbUdSelectTab', function (tab) {
    var id = (typeof tbUdCurrentUnitId !== 'undefined') ? tbUdCurrentUnitId : '';
    return id ? ['tablet', 'units', id, tab] : null;
  });
})();

/* Page-level tablet routes for the two screens with no deeper state
   written to the hash. */
rtRegister('tablet/update', function () {
  return rtEnsureView('tablet').then(function () {
    rtTbCloseDrawers(null);
    if (typeof tbNavUpdate === 'function') tbNavUpdate();
    return rtWaitFor(function () { return rtVisible('tb-page-update') ? 1 : null; });
  });
});
rtRegister('tablet/map', function () {
  return rtEnsureView('tablet').then(function () {
    rtTbCloseDrawers(null);
    if (typeof tbNavMap === 'function') tbNavMap();
    return rtWaitFor(function () { return rtVisible('tb-page-map') ? 1 : null; });
  });
});

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
    '.cmt-pin.cmt-flash{animation:rtPinFlash 0.65s ease-in-out 3;z-index:9655;}';
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
  /* A deep link is an authenticated context, exactly like ?test= links,
     which app-14 already skips login for. Hide the overlay the same way
     lgInit does (display + session flag) rather than calling lgDismiss,
     whose landing / onboarding side effects would race the jump. */
  (function rtSkipLogin() {
    var lg = document.getElementById('login-screen');
    if (!lg) return;
    lg.classList.add('lg-out');
    lg.style.display = 'none';
    try { sessionStorage.setItem('vfLoggedIn', '1'); } catch (e) {}
  })();
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

/* ═══════════════════════════════════════════════════════════════════
   EVERY PAGE GETS A URL  (added on top of the engine above)
   ───────────────────────────────────────────────────────────────────
   What was missing, and why each piece is here:

   1  RESOLVERS. The engine only knew trucks, units and six desktop
      page-level routes. Insights, Returned Concrete, Slump Tests,
      Batch Assistant, Fleet map and Phases had no resolver at all, on
      any surface, so a pasted URL fell through to the dashboard
      fallback. All of them are registered below for desktop, tablet
      and mobile.

   2  HASH WRITERS. app-06 wraps dtNavGo to write the hash, but every
      section module since app-13 replaces window.dtNavGo and returns
      early for its own key — so navigating to Insights, Returned
      Concrete, Slump Tests or Batch Assistant wrote nothing. router.js
      loads after app-25, so window.dtNavGo here is the end of that
      wrapper chain: wrapping it once catches every key. The section
      entry points (inNav / rcNav / slNav / baNav) are wrapped too,
      because on tablet and mobile they never reach dtNavGo.

   3  HASHCHANGE. Nothing listened. applyHashRoute is a one-shot at
      load, so the back button did nothing and editing the hash by hand
      did nothing — the only way in was ?jump=. A listener closes that
      loop, guarded so the hash we just wrote does not re-drive the UI.

   Route grammar is unchanged: <surface>/<page>[/<sub>]. The raw keys
   stay canonical because comments.js has already stored routes in that
   form and those pins have to keep resolving. Readable aliases are
   registered alongside them, so #batch-assistant and #desktop/batch
   both work and neither breaks the other.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Which surface are we on ─────────────────────────────────────── */

function rtSurface() {
  var c = document.body.classList;
  if (c.contains('view-mobile')) return 'mobile';
  if (c.contains('view-tablet')) return 'tablet';
  return 'desktop';
}

/* Write a hash and remember it, so the hashchange listener can tell a
   navigation we caused from one the user caused. Prefers app-06's
   setHash when it exists so there is still one writer. */
RT.lastWritten = null;
RT.driving = false;

function rtSetHash(parts) {
  var route = parts.filter(Boolean).join('/');
  RT.lastWritten = route;
  if (typeof setHash === 'function') { setHash(parts); return; }
  try { location.hash = '#' + route; } catch (e) {}
}

/* app-06's setHash does not know about RT.lastWritten, so record every
   hash it writes as well — otherwise its own navigations would look
   like user edits and re-drive the UI a second time. */
(function rtRecordSetHash() {
  if (typeof setHash !== 'function' || setHash.__rtRecord) return;
  var orig = setHash;
  window.setHash = function (parts) {
    try { RT.lastWritten = [].concat(parts).filter(Boolean).join('/'); } catch (e) {}
    return orig.apply(this, arguments);
  };
  window.setHash.__rtRecord = true;
})();

/* ── The sections that had no routes ─────────────────────────────────
   Each has one entry point that dispatches by body class, so the
   resolver only has to put the right frame up and then call it. */

var RT_SECTIONS = [
  { slug:'insights', alias:'insights',          nav:'inNav', dt:'insights',
    tb:'tb-page-insights', mo:'mob-page-insights' },
  { slug:'returned', alias:'returned-concrete', nav:'rcNav', dt:'returned',
    tb:'tb-page-returned', mo:'mob-page-returned' },
  { slug:'slump',    alias:'slump-tests',       nav:'slNav', dt:'slump',
    tb:'tb-page-slump',    mo:'mob-page-slump' },
  { slug:'batch',    alias:'batch-assistant',   nav:'baNav', dt:'batch',
    tb:'tb-page-batch',    mo:'mob-page-batch' }
];

function rtOpenSection(sec, surface) {
  if (surface === 'desktop') {
    return rtEnsureDtPage(sec.dt).then(function () { rtCloseOtherDrawers(null); });
  }
  var pageId = surface === 'tablet' ? sec.tb : sec.mo;
  return rtEnsureView(surface).then(function () {
    if (typeof window[sec.nav] !== 'function') {
      console.warn('[router] no entry point', sec.nav);
      return;
    }
    window[sec.nav]();
    return rtWaitFor(function () { return rtVisible(pageId) ? 1 : null; });
  });
}

RT_SECTIONS.forEach(function (sec) {
  ['desktop', 'tablet', 'mobile'].forEach(function (surface) {
    function res() { return rtOpenSection(sec, surface); }
    rtRegister(surface + '/' + sec.slug, res);
    /* Readable alias, same resolver. */
    if (sec.alias !== sec.slug) rtRegister(surface + '/' + sec.alias, res);
  });
  /* Bare slug: no surface named, so stay on whichever frame is up. */
  rtRegister(sec.slug, function () { return rtOpenSection(sec, rtSurface()); });
  if (sec.alias !== sec.slug) {
    rtRegister(sec.alias, function () { return rtOpenSection(sec, rtSurface()); });
  }
});

/* ── Batch Assistant tabs ────────────────────────────────────────────
   The only one of the four with sub-state worth a URL: three tabs a
   batchman switches between all shift. */

var RT_BA_TABS = { live:1, acc:1, water:1 };
var RT_BA_ALIAS = { live:'live', 'batch-accuracy':'acc', 'water-buildup':'water' };

['desktop', 'tablet', 'mobile'].forEach(function (surface) {
  rtRegister(surface + '/batch/:tab', function (p) {
    var tab = RT_BA_TABS[p.tab] ? p.tab : RT_BA_ALIAS[p.tab];
    if (!tab) { console.warn('[router] unknown batch tab', p.tab); tab = 'live'; }
    var sec = RT_SECTIONS[3];
    return rtOpenSection(sec, surface).then(function () {
      if (typeof baSetTab === 'function') baSetTab(tab);
    });
  });
});

/* ── Tickets: Fleet map and Phases ───────────────────────────────────
   Desktop has its own page container per sub-view; tablet and mobile
   route all three through tvNavGo. */

var RT_TV = { tickets:'list', tfleet:'map', tphases:'phases' };
var RT_TV_ALIAS = { 'ticket-list':'tickets', 'fleet-map':'tfleet', phases:'tphases' };

Object.keys(RT_TV).forEach(function (key) {
  rtRegister('desktop/' + key, function () {
    return rtEnsureDtPage(key).then(function () { rtCloseOtherDrawers(null); });
  });
  ['tablet', 'mobile'].forEach(function (surface) {
    rtRegister(surface + '/' + key, function () {
      return rtEnsureView(surface).then(function () {
        if (typeof tvNavGo === 'function') tvNavGo(RT_TV[key]);
      });
    });
  });
});
/* 'desktop/tickets' is registered twice now — once by the original page
   list above and once here. rtMatch keeps the first best score, so the
   original wins and behaviour is unchanged. The aliases below are the
   only new names. */
Object.keys(RT_TV_ALIAS).forEach(function (alias) {
  var key = RT_TV_ALIAS[alias];
  ['desktop', 'tablet', 'mobile'].forEach(function (surface) {
    rtRegister(surface + '/' + alias, function () { return rtGoTo(surface + '/' + key); });
  });
  rtRegister(alias, function () { return rtGoTo(rtSurface() + '/' + key); });
});

/* Bare page slugs for the screens the engine already resolved, so a URL
   does not have to name the surface. */
['home', 'dashboard', 'trucks', 'units', 'update', 'map'].forEach(function (page) {
  rtRegister(page, function () { return rtGoTo(rtSurface() + '/' + page); });
});
rtRegister('all-trucks',       function () { return rtGoTo(rtSurface() + '/trucks'); });
rtRegister('software-update',  function () { return rtGoTo(rtSurface() + '/update'); });
rtRegister('fleet-update',     function () { return rtGoTo(rtSurface() + '/update'); });

/* ── Hash writers for the sections that wrote nothing ────────────────
   router.js loads after app-25, so window.dtNavGo is the end of the
   wrapper chain: every key passes through here, including the ones the
   section modules intercept and return early on. */

(function rtSectionHashWriters() {
  var DT_KEYS = { home:1, dashboard:1, trucks:1, units:1, tickets:1, tfleet:1, tphases:1,
    update:1, map:1, insights:1, returned:1, slump:1, batch:1 };

  if (typeof dtNavGo === 'function' && !dtNavGo.__rtPageHash) {
    var origNav = window.dtNavGo;
    window.dtNavGo = function (key) {
      var out = origNav.apply(this, arguments);
      if (DT_KEYS[key]) rtSetHash(['desktop', key]);
      return out;
    };
    window.dtNavGo.__rtPageHash = true;
  }

  /* On tablet and mobile these never reach dtNavGo, so they need their
     own writer. The surface is read after the call, because the entry
     point is what decides which frame ends up on screen. */
  RT_SECTIONS.forEach(function (sec) {
    var name = sec.nav;
    if (typeof window[name] !== 'function' || window[name].__rtPageHash) return;
    var orig = window[name];
    window[name] = function () {
      var out = orig.apply(this, arguments);
      rtSetHash([rtSurface(), sec.slug]);
      return out;
    };
    window[name].__rtPageHash = true;
  });

  /* Batch tabs. */
  if (typeof baSetTab === 'function' && !baSetTab.__rtPageHash) {
    var origTab = window.baSetTab;
    window.baSetTab = function (tab) {
      var out = origTab.apply(this, arguments);
      rtSetHash([rtSurface(), 'batch', tab]);
      return out;
    };
    window.baSetTab.__rtPageHash = true;
  }

  /* Tickets sub-views on tablet and mobile. */
  if (typeof tvNavGo === 'function' && !tvNavGo.__rtPageHash) {
    var TV_BACK = { list:'tickets', map:'tfleet', phases:'tphases' };
    var origTv = window.tvNavGo;
    window.tvNavGo = function (which) {
      var out = origTv.apply(this, arguments);
      var key = TV_BACK[which];
      if (key) rtSetHash([rtSurface(), key]);
      return out;
    };
    window.tvNavGo.__rtPageHash = true;
  }
})();

/* ── hashchange: back, forward, and hand-edited URLs ─────────────────
   Three guards, each for a failure this listener would otherwise cause:

     RT.driving   a resolver calls setView and nav functions, which write
                  the hash themselves; without this the listener would
                  re-enter mid-resolve.
     lastWritten  a normal click writes the hash, which fires this event.
                  Re-driving the UI to where it already is rebuilds
                  tables and flashes the screen.
     canResolve   app-06 writes hashes this file has no resolver for
                  (sub-tab state inside Map and Software Update). Those
                  are left alone rather than bounced to a fallback. */

window.addEventListener('hashchange', function () {
  var h = String(location.hash || '').replace(/^#/, '');
  if (!h) return;
  if (RT.driving) return;
  if (h === RT.lastWritten) return;
  if (!rtCanResolve(h)) return;
  RT.driving = true;
  rtGoTo(h)
    .catch(function (e) { console.warn('[router] hashchange failed', h, e); })
    .then(function () {
      RT.lastWritten = String(location.hash || '').replace(/^#/, '');
      RT.driving = false;
    });
});

/* A hash present at load with no ?jump= means someone pasted a URL or
   reloaded on a page. app-06's applyHashRoute handles trucks and units;
   anything it does not know still needs driving, and an unresolvable
   hash is left for it. Runs after the ?jump= block above, and defers to
   it — an explicit jump link wins. */
(function rtBootFromHash() {
  var q = new URLSearchParams(location.search);
  if (q.get('jump')) return;
  var h = String(location.hash || '').replace(/^#/, '');
  if (!h || !rtCanResolve(h)) return;
  /* Only take over for routes app-06's restore does not cover, so the
     two do not fight over the same screen. */
  if (/^(desktop|tablet|mobile)\/(trucks|units)(\/|$)/.test(h)) return;
  setTimeout(function () {
    RT.driving = true;
    rtGoTo(h)
      .catch(function (e) { console.warn('[router] boot route failed', h, e); })
      .then(function () {
        RT.lastWritten = String(location.hash || '').replace(/^#/, '');
        RT.driving = false;
      });
  }, 450);
})();
