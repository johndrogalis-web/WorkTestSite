/* ============================================================================
   app-23-viewport-continuity.js
   VIEWPORT CONTINUITY  switching device frames keeps you on the same screen
   ----------------------------------------------------------------------------
   Before this file, setView() was amnesiac. It rebuilt body.className, synced
   the pills, re-rendered the desktop and tablet tables, and dropped you
   wherever that viewport happened to have been last. Standing on the Fleet map
   in desktop and tapping Mobile put you on the mobile home screen, because
   nothing carried the answer to "which screen was I on" across the swap.

   WHY NOT ROUTES
   router.js already resolves a hash into a UI state, and app-06 already
   rewrites the first hash segment on every setView. That pairing is the right
   long-term answer, but it only covers what app-06 writes a hash for, which is
   trucks and units. Fleet map, Phases, Dashboards, Insights and Returned Loads
   write nothing, so there is no route to carry. Rather than add a hash writer
   plus three resolvers per screen before anything works at all, this file
   carries live state directly: capture before the swap, replay after it.

   THE CONTRACT
   Each screen registers one object:

     vcRegister({
       id:      'tickets',
       detect:  function (view) { ... }   returns a state object, or null
       restore: function (view, state) { ... }
     })

   detect() answers "am I the screen currently on the frame, and what is my
   state". It is asked in registration order and the first non-null wins, so
   register specific screens before general ones. restore() is handed the state
   captured in the OLD viewport and the name of the NEW one, and is responsible
   for getting there through that viewport's own entry points. It never touches
   another screen's internals.

   WHAT "ON SCREEN" MEANS
   Same test router.js settled on after the Dashboards bug: not "inline display
   is not none", which lies whenever a page is hidden by a stylesheet rather
   than by a style attribute, but "the layout engine gave it a box with size".
   Ask the browser, do not trust a class.

   SUSPENDED DURING JUMPS
   rtGoTo() resolvers call setView() themselves on their way to a route. If the
   continuity layer fired there it would restore the screen the jump is trying
   to leave, and the two would race. rtGoTo is wrapped to hold the layer down
   for the life of the jump, so a comment pin Jump, a ?jump= link and a testing
   auto-walk all behave exactly as they did before this file existed.

   REGISTERED HERE
     tickets     all three sub views (Ticket List, Fleet map, Phases) across
                 all three viewports, carrying the phase filter and search text.
     dashboards  the landing page, across all three viewports. Registered first
                 because it is where an unresolved route already lands, so an
                 unregistered Dashboards was the most visible gap of the lot.

   Everything else is unregistered and therefore unchanged: no snapshot is
   taken, no restore runs, setView behaves as it always has. Adding a screen is
   one vcRegister() call and touches nothing else.

   Load order: LAST, after every app-* file and after router.js, because it
   wraps setView (app-06), reads dtNavGo through whatever wrapper chain app-21
   ended on, and wraps rtGoTo (router.js).
   ========================================================================== */

var VC = {
  screens: [],
  suspend: 0,
  /* setView schedules tbRenderTable at 50ms. Restoring before that lands means
     the tablet repaint runs after us and can undo the nav we just did, so the
     replay waits it out. */
  delay: 90,
  debug: false
};

function vcRegister(def) {
  if (!def || !def.id || typeof def.detect !== 'function') return;
  VC.screens.push(def);
}

function vcLog() {
  if (VC.debug && window.console) console.log.apply(console, ['[vc]'].concat([].slice.call(arguments)));
}

function vcView() {
  if (typeof vpCurrentView === 'function') return vpCurrentView();
  if (document.body.classList.contains('view-mobile')) return 'mobile';
  if (document.body.classList.contains('view-tablet')) return 'tablet';
  return 'desktop';
}

/* A page is on screen only if it has a laid out box with size. */
function vcOnScreen(id) {
  var el = document.getElementById(id);
  if (!el) return false;
  var cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  var r = el.getBoundingClientRect();
  return (r.width > 0 && r.height > 0);
}

function vcVal(id) {
  var el = document.getElementById(id);
  return (el && typeof el.value === 'string') ? el.value : null;
}

function vcSetVal(id, v) {
  if (v == null || v === '') return;
  var el = document.getElementById(id);
  if (el) el.value = v;
}

/* ── Capture and replay ─────────────────────────────────────────────────── */

function vcCapture() {
  var view = vcView();
  for (var i = 0; i < VC.screens.length; i++) {
    var s = VC.screens[i], st = null;
    try { st = s.detect(view); } catch (e) { vcLog('detect threw', s.id, e); st = null; }
    if (st) { vcLog('captured', s.id, st); return { id: s.id, from: view, state: st }; }
  }
  vcLog('no screen matched, nothing to carry');
  return null;
}

function vcReplay(snap, view) {
  if (!snap) return;
  var s = null;
  for (var i = 0; i < VC.screens.length; i++) {
    if (VC.screens[i].id === snap.id) { s = VC.screens[i]; break; }
  }
  if (!s || typeof s.restore !== 'function') return;
  try { s.restore(view, snap.state); vcLog('replayed', snap.id, 'into', view); }
  catch (e) { console.warn('[vc] restore failed for', snap.id, e); }
}

/* ── setView wrapper ────────────────────────────────────────────────────── */

var vcOrigSetView = window.setView;

window.setView = function (view) {
  /* A no-op swap has nothing to carry, and a router jump owns its own
     destination. Both fall straight through to the original. */
  if (VC.suspend > 0 || view === vcView() || typeof vcOrigSetView !== 'function') {
    return vcOrigSetView ? vcOrigSetView.apply(this, arguments) : undefined;
  }

  var snap = vcCapture();
  var r = vcOrigSetView.apply(this, arguments);
  if (snap) setTimeout(function () { vcReplay(snap, view); }, VC.delay);
  return r;
};

/* ── Router jumps hold the layer down ───────────────────────────────────── */

(function vcGuardRouter() {
  if (typeof rtGoTo !== 'function') return;
  var orig = rtGoTo;
  window.rtGoTo = function () {
    VC.suspend++;
    var release = function () { VC.suspend = Math.max(0, VC.suspend - 1); };
    var p;
    try { p = orig.apply(this, arguments); }
    catch (e) { release(); throw e; }
    return Promise.resolve(p).then(
      function (v) { release(); return v; },
      function (e) { release(); throw e; }
    );
  };
})();

/* ══════════════════════════════════════════════════════════════════════════
   TABLET HANDOFF GUARD
   Not continuity, a real bug, fixed here only because it is the one this file
   makes reachable and a second script tag is not worth it.

   Five tablet pages hide their siblings and stash the old display values so
   they can put them back. Their sibling lists overlap almost completely, and
   each guards with "if my snapshot is null", which assumes the pages it is
   about to hide are currently in their normal state.

   The convention that keeps that assumption true is that every opener closes
   its predecessors first, and each file added one more link:

     ttkOpen       (app-08)  closes nothing
     dbTabletOpen  (app-13)  closes ttk
     amTabletOpen  (app-17)  closes ttk, db
     inTabletOpen  (app-18)  closes ttk, db, am
     rcTabletOpen  (app-21)  closes ttk, db, am, in

   ttkOpen is the hole, and it is the hole because it came first: it had no
   successors to know about. It also cannot be fixed by the wrapper hooks the
   later files installed on tbNavSetActive, because it clears the nav through
   ttkOrigNav.tbNavSetActive, the reference app-08 captured from app-05 before
   any of them wrapped it. Calling the original is right for the nav lighting
   and is exactly what skips the closes.

   So arriving at Tickets from any of the other four snapshots a set of
   siblings that are already display:none, records "none" as their resting
   state, and leaves the old page sitting on top of the tickets page that just
   opened. The next close restores everything to none and the tablet is stuck.

   This was always true and almost never reachable, since it needed a specific
   nav sequence. Viewport continuity lands you on Dashboards routinely, which
   turned a corner into the main road. Closing the loop makes ttkOpen honour
   the same convention its four successors already do.
   ══════════════════════════════════════════════════════════════════════════ */

/* Snapshot variable paired with the close function that releases it. Testing
   the variable rather than the page's visibility matters: a visibility test
   also fires during a close animation, when the handback already happened. */
var VC_TB_HOLDERS = [
  ['dbTbSnapshot', 'dbTabletClose'],
  ['amTbSnap',     'amTabletClose'],
  ['inTbSnap',     'inTabletClose'],
  ['rcTbSnap',     'rcTabletClose']
];

function vcTbReleaseAll() {
  VC_TB_HOLDERS.forEach(function (pair) {
    var held = false;
    /* Bare name, not window[...]: several of these are top-level let/var in
       classic scripts, and a let never lands on window. */
    try { held = eval('typeof ' + pair[0] + " !== 'undefined' && " + pair[0] + ' !== null'); }
    catch (e) { held = false; }
    if (held && typeof window[pair[1]] === 'function') {
      try { window[pair[1]](); } catch (e) { vcLog('release failed', pair[1], e); }
    }
  });
}

(function vcTabletHandoff() {
  if (typeof window.ttkOpen !== 'function' || window.ttkOpen.__vcWrapped) return;
  var orig = window.ttkOpen;

  window.ttkOpen = function () {
    vcTbReleaseAll();
    return orig.apply(this, arguments);
  };
  window.ttkOpen.__vcWrapped = true;
})();

/* ══════════════════════════════════════════════════════════════════════════
   MOBILE TICKETS NAV LIGHTING
   Second pre-existing gap, same reason as the tablet one: a path nobody used
   to take often enough to notice.

   Every mobile sidenav destination lights its own item. All trucks and Units
   do it in app-03, Map and Software Updates in app-04, Dashboards clears them
   in app-13. The three Tickets items do not, because app-12's tvApplyNav wraps
   its nav lighting in "if (tablet)". On tablet it moves the pill; on mobile it
   does nothing at all, so whatever was lit before stays lit and the sidenav
   claims you are still on the page you left.

   The page itself always loaded correctly. Only the highlight lied, which is
   why this survived: you close the nav to look at the page, and the stale
   highlight is only visible the next time you open it.

   Matching on the onclick attribute rather than an index keeps this correct if
   the three items are ever reordered in the markup.
   ══════════════════════════════════════════════════════════════════════════ */

var VC_MO_TK_NAV = { list: "tvNavGo('list')", map: "tvNavGo('map')", phases: "tvNavGo('phases')" };

(function vcMobileTicketsNav() {
  if (typeof window.tvNavGo !== 'function' || window.tvNavGo.__vcWrapped) return;
  var orig = window.tvNavGo;

  window.tvNavGo = function (view) {
    var r = orig.apply(this, arguments);
    /* Tablet already moves its own pill inside tvApplyNav. */
    if (!document.body.classList.contains('view-tablet')) {
      var want = VC_MO_TK_NAV[view];
      document.querySelectorAll('.sn-sub-item').forEach(function (i) {
        i.classList.remove('active');
        if (want && (i.getAttribute('onclick') || '').indexOf(want) >= 0) i.classList.add('active');
      });
    }
    return r;
  };
  window.tvNavGo.__vcWrapped = true;
})();

/* ══════════════════════════════════════════════════════════════════════════
   MOBILE OVERLAY RELEASE FOR UNITS
   Third pre-existing gap, and the tidiest evidence yet that these are copied
   conventions rather than designed ones.

   Six mobile pages are full-bleed overlays inside .phone: Tickets, Software
   Updates, Dashboards, Account, Insights, Returned Concrete. Because they
   stack on top of the section-based Diagnostic Center pages rather than
   replacing them, every non-overlay destination has to close them on the way
   past. Four files each wrote that list:

     app-13  mtkOpen, mobSwuOpen, goToAllTrucks, snGoMap
     app-17  the same four, plus dbMobileNav, dbMobileOpen
     app-18  the same six, plus amMobileOpen
     app-21  the same seven, plus inMobileOpen

   Every list grew at the end and every list is missing the same entry:
   openUnits. So Units is the one Diagnostic Center destination that leaves an
   overlay standing, and the overlay wins because it is painted on top. The
   nav updates, the hash updates, the page underneath changes, and none of it
   is visible.

   Reachable before this file only by opening an overlay and then picking Units
   specifically. Continuity lands you on the Dashboards overlay every time you
   change frames, so it is now the first thing you hit.

   One release function rather than a sixth copy of the list: openUnits hands
   back every overlay, whichever one happens to be up.
   ══════════════════════════════════════════════════════════════════════════ */

var VC_MO_OVERLAY_CLOSERS = [
  'mtkClose', 'mobSwuClose', 'dbMobileClose',
  'amMobileClose', 'inMobileClose', 'rcMobileClose'
];

function vcMoReleaseAll() {
  VC_MO_OVERLAY_CLOSERS.forEach(function (fn) {
    if (typeof window[fn] === 'function') {
      try { window[fn](); } catch (e) { vcLog('mobile release failed', fn, e); }
    }
  });
}

(function vcHookOpenUnits() {
  if (typeof window.openUnits !== 'function' || window.openUnits.__vcWrapped) return;
  var orig = window.openUnits;

  window.openUnits = function () {
    if (!document.body.classList.contains('view-desktop')) vcMoReleaseAll();
    return orig.apply(this, arguments);
  };
  window.openUnits.__vcWrapped = true;
})();

/* ══════════════════════════════════════════════════════════════════════════
   SCREEN: Dashboards
   The simplest possible registration, and the one that matters most, since
   Dashboards is both the post-login landing and the fallback for any route the
   router cannot restore. Unregistered, a swap out of Dashboards fell through
   to whatever the target viewport defaults to, which on mobile is All Trucks.

   There is no sub state to carry: the layout is a single dbLayout persisted to
   localStorage, so it is already the same board in every frame. Detecting
   simply asks whether this viewport's dashboard page has a box, and restoring
   calls that viewport's own opener, the same three the login screen uses.
   ══════════════════════════════════════════════════════════════════════════ */

var VC_DB_PAGE = { desktop: 'dt-page-dashboard', tablet: 'tb-page-dashboard', mobile: 'mob-page-dashboard' };

vcRegister({
  id: 'dashboards',

  detect: function (view) {
    return vcOnScreen(VC_DB_PAGE[view]) ? {} : null;
  },

  restore: function (view) {
    if (view === 'mobile')      { if (typeof dbMobileOpen === 'function') dbMobileOpen(); return; }
    if (view === 'tablet')      { if (typeof dbTabletOpen === 'function') dbTabletOpen(); return; }
    if (typeof dtNavGo === 'function') dtNavGo('dashboard');
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   SCREEN: Tickets
   The section has three sub views and each viewport reaches them differently.
   Desktop routes to three sibling pages through dtNavGo. Mobile and tablet
   have one page with a segmented control, and tvNavGo already reads the body
   class to decide which frame it is talking about, so one call covers both.
   ══════════════════════════════════════════════════════════════════════════ */

/* Desktop page per sub view, checked in this order. */
var VC_TK_PAGE = { list: 'dt-page-tickets', map: 'dt-page-tfleet', phases: 'dt-page-tphases' };

/* dtNavGo key per sub view. */
var VC_TK_NAV = { list: 'tickets', map: 'tfleet', phases: 'tphases' };

/* Each view has its own search box. Desktop has one per page; the device
   frames share a single box across all three sub views. */
var VC_TK_SEARCH = {
  desktop: { list: 'tk-search-input', map: 'tf-search-input', phases: 'tp-search-input' },
  mobile:  { list: 'mtk-search', map: 'mtk-search', phases: 'mtk-search' },
  tablet:  { list: 'ttk-search', map: 'ttk-search', phases: 'ttk-search' }
};

/* One filter, three names. This is the whole reason a mapping layer beats a
   refactor: nothing in the codebase declares these equivalent, so something
   has to, and it may as well be four lines. */
function vcTkPhaseGet(view) {
  try {
    if (view === 'mobile') return (typeof mtkPhaseFilter !== 'undefined') ? mtkPhaseFilter : null;
    if (view === 'tablet') return (typeof ttkPhaseFilter !== 'undefined') ? ttkPhaseFilter : null;
    return (typeof tkDeskPhase !== 'undefined') ? tkDeskPhase : null;
  } catch (e) { return null; }
}

function vcTkPhaseSet(view, phase) {
  if (phase === undefined) return;
  try {
    if (view === 'mobile')      { if (typeof mtkPhaseFilter !== 'undefined') mtkPhaseFilter = phase; }
    else if (view === 'tablet') { if (typeof ttkPhaseFilter !== 'undefined') ttkPhaseFilter = phase; }
    else                        { if (typeof tkDeskPhase   !== 'undefined') tkDeskPhase   = phase; }
  } catch (e) { vcLog('phase set failed', view, e); }
}

/* Same repaint tkSetPhase does, minus the toggle. Setting the variable without
   this leaves the filter chip and the rows disagreeing. */
function vcTkRepaintDesktop(sub) {
  if (typeof tkFiltersRender === 'function') tkFiltersRender();
  if (typeof tkRebuildTable === 'function') tkRebuildTable();
  if (sub === 'phases' && typeof tpRender === 'function') tpRender();
  if (sub === 'map' && typeof tfRender === 'function') tfRender();
}

vcRegister({
  id: 'tickets',

  detect: function (view) {
    if (view === 'desktop') {
      var sub = null;
      ['map', 'phases', 'list'].forEach(function (k) {
        if (!sub && vcOnScreen(VC_TK_PAGE[k])) sub = k;
      });
      if (!sub) return null;
      return { sub: sub, phase: vcTkPhaseGet('desktop'), q: vcVal(VC_TK_SEARCH.desktop[sub]) };
    }

    var pageId = (view === 'tablet') ? 'tb-page-tickets' : 'mob-page-tickets';
    if (!vcOnScreen(pageId)) return null;

    /* app-12 keeps the segmented control's position in TV.m / TV.t. */
    var key = (view === 'tablet') ? 't' : 'm';
    var sub2 = (typeof TV !== 'undefined' && TV[key] && TV[key].view) ? TV[key].view : 'list';
    return { sub: sub2, phase: vcTkPhaseGet(view), q: vcVal(VC_TK_SEARCH[view][sub2]) };
  },

  restore: function (view, st) {
    var sub = st.sub || 'list';
    vcTkPhaseSet(view, st.phase);

    if (view === 'desktop') {
      if (typeof dtNavGo === 'function') dtNavGo(VC_TK_NAV[sub] || 'tickets');
      vcSetVal(VC_TK_SEARCH.desktop[sub], st.q);
      vcTkRepaintDesktop(sub);
      return;
    }

    /* tvNavGo picks the frame off the body class, which setView has already
       swapped, so one call serves mobile and tablet. It opens the page, moves
       the segmented control and lights the nav pill. */
    if (typeof tvNavGo === 'function') tvNavGo(sub);
    else if (view === 'tablet' && typeof ttkOpen === 'function') ttkOpen();
    else if (typeof mtkOpen === 'function') mtkOpen();

    /* tvNavGo defers its tablet half by a tick, so the search text goes in
       behind it rather than into a box that is about to be rebuilt. */
    setTimeout(function () {
      vcSetVal(VC_TK_SEARCH[view][sub], st.q);
      if (view === 'tablet') { if (typeof ttkRender === 'function') ttkRender(); }
      else                   { if (typeof mtkRender === 'function') mtkRender(); }
    }, 40);
  }
});
