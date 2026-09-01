/* ============================================================================
   app-11-ticket-manual.js
   TICKET DRAWER — MANUAL CONTROL TAB
   ----------------------------------------------------------------------------
   Add Water and Add Admix in the ticket drawer, behaving exactly as they do in
   the All Trucks drawer, plus a Ticket Adjustment Log below them.

   "Exactly" is meant literally. The Manual Control cards are single-instance:
   initMcCards() builds one CardInstance per MC_CARD_DEF and mounts it into
   #mc-unit-<id> inside the All Trucks panel. Cloning the markup would give you
   two cards that look alike and diverge the moment either one runs a command.
   So this moves the real nodes into the ticket panel on the way in and puts
   them back on the way out — the same borrow-and-return the summary panel uses
   on the Status tab.

   Two consequences worth knowing:
     - The card styles were written against #dt-state-manual. Both panels now
       carry .mc-scope and styles.css mirrors those rules onto it, so a card
       looks the same wherever it is parented.
     - mcCommandLog is shared, so a water add made here shows up in the truck's
       command history too. That is correct: it is the same truck and the same
       command, logged once.

   Load order: after app-01 (tkTab), app-02 (initMcCards, mcCommandLog,
   logCommand) and app-08/09/10, whose tkTab wrappers this one composes with.
   ========================================================================== */

/* The cards live here when nobody has borrowed them. */
const TKMC_UNITS = [
  { id: 'mc-unit-water', label: 'Add Water' },
  { id: 'mc-unit-admix', label: 'Add Admix' },
];
const tkmcHome = {};   /* mount id → original parent */

function tkmcRememberHome() {
  TKMC_UNITS.forEach(function (u) {
    const el = document.getElementById(u.id);
    if (el && !tkmcHome[u.id]) tkmcHome[u.id] = el.parentNode;
  });
}

/* Put the cards back in the All Trucks panel. Safe to call at any time. */
function tkmcReturnUnits() {
  TKMC_UNITS.forEach(function (u) {
    const el = document.getElementById(u.id);
    const home = tkmcHome[u.id];
    if (el && home && el.parentNode !== home) home.appendChild(el);
  });
}

/* ── Adjustment log ─────────────────────────────────────────────────────────
   Reads the shared mcCommandLog rather than keeping a second history. */
function tkmcRenderLog() {
  const body = document.getElementById('tkmc-log-body');
  if (!body) return;
  const log = (typeof mcCommandLog !== 'undefined') ? mcCommandLog : [];
  const count = document.getElementById('tkmc-log-count');
  const sub = document.getElementById('tkmc-log-sub');

  if (!log.length) {
    body.innerHTML = '<div class="tkmc-log-empty">No adjustments yet</div>';
    if (count) count.textContent = '0 records';
    if (sub) sub.textContent = 'Today';
    return;
  }
  body.innerHTML = log.map(function (e) {
    return '<div class="tkmc-log-row">' +
      '<span>' + e.time + '</span>' +
      '<span>' + e.title + '</span>' +
      '<span>' + e.value + '</span>' +
      '<span>' + e.result + '</span>' +
    '</div>';
  }).join('');
  if (count) count.textContent = log.length + (log.length === 1 ? ' record' : ' records');
  if (sub) sub.textContent = 'Last updated ' + log[0].time;
}

function tkmcClearLog() {
  if (typeof mcClearTable === 'function') mcClearTable();
  else if (typeof mcCommandLog !== 'undefined') mcCommandLog.length = 0;
  tkmcRenderLog();
}

/* Every command logged anywhere refreshes this panel if it is open. */
const tkmcOrigLog = (typeof logCommand === 'function') ? logCommand : null;
window.logCommand = function () {
  const r = tkmcOrigLog ? tkmcOrigLog.apply(this, arguments) : undefined;
  tkmcRenderLog();
  return r;
};

/* ── Panel ──────────────────────────────────────────────────────────────── */

function tkmcRender() {
  const scroll = document.getElementById('tk-drawer-scroll');
  if (!scroll) return;
  if (typeof tkxRescueSummary === 'function') tkxRescueSummary();

  /* The cards are built lazily by app-02; make sure they exist before we go
     looking for their mount points. */
  if (typeof initMcCards === 'function') initMcCards();
  tkmcRememberHome();

  scroll.style.padding = '';
  scroll.style.overflowX = 'hidden';
  scroll.innerHTML =
    /* Three across on a wide drawer: Add Water, Add Admix, and the log beside
       them rather than under them. The slots and the log are siblings in one
       grid so the log matches the cards' height instead of being a block
       stacked below. */
    '<div class="tkmc-panel mc-scope">' +
      TKMC_UNITS.map(function (u) {
        return '<div class="tkmc-slot" id="tkmc-slot-' + u.id + '"></div>';
      }).join('') +
      '<div class="tkmc-log">' +
        '<div class="tkmc-log-head">' +
          '<div>' +
            '<div class="tkmc-log-title">Ticket Adjustment Log</div>' +
            '<div class="tkmc-log-sub" id="tkmc-log-sub">Today</div>' +
          '</div>' +
          '<button class="tkmc-log-clear" onclick="tkmcClearLog()">Clear</button>' +
        '</div>' +
        '<div class="tkmc-log-cols">' +
          '<span>Time</span><span>Command</span><span>Value</span><span>Status</span>' +
        '</div>' +
        '<div id="tkmc-log-body"></div>' +
        '<div class="tkmc-log-foot" id="tkmc-log-count">0 records</div>' +
      '</div>' +
    '</div>';

  /* Borrow the live cards. */
  TKMC_UNITS.forEach(function (u) {
    const el = document.getElementById(u.id);
    const slot = document.getElementById('tkmc-slot-' + u.id);
    if (el && slot) slot.appendChild(el);
  });

  tkmcRenderLog();
}

/* ── Wiring ───────────────────────────────────────────────────────────────── */

const tkmcOrigTab = (typeof tkTab === 'function') ? tkTab : null;
window.tkTab = function (el, tab) {
  if (tab !== 'manual') tkmcReturnUnits();
  const r = tkmcOrigTab ? tkmcOrigTab.apply(this, arguments) : undefined;
  if (tab === 'manual') tkmcRender();
  return r;
};

/* Closing the drawer hands the cards back, so the All Trucks panel is never
   left with two empty holes where they used to be. */
const tkmcOrigClose = (typeof tkCloseDrawer === 'function') ? tkCloseDrawer : null;
window.tkCloseDrawer = function () {
  tkmcReturnUnits();
  if (tkmcOrigClose) return tkmcOrigClose.apply(this, arguments);
};
