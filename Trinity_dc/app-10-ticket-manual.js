/* app-10-ticket-manual.js — Ticket drawer, Manual control tab. Loads last of
   the app-* files.

   The tab used to render a static mock of two cards and an empty log. This
   replaces it with the REAL manual-control cards: the same MC_CARD_DEFS from
   shared-data.js and the same CardInstance from app-01 that the All Trucks
   page mounts, so scenarios, progress, partial deliveries, retries and the
   command log all behave identically. Only two of the defs come across —
   water and admix — because those are the only adjustments that belong to a
   ticket rather than to the truck.

   The log is the shared mcCommandLog. A water add made here and one made on
   All Trucks are the same event against the same truck, so they belong in one
   list rather than two that disagree.
   ────────────────────────────────────────────────────────────────────────── */

var TKMC_CARD_IDS = ['water', 'admix'];

/* ── Log table ──────────────────────────────────────────────────────────── */

function tkmcRenderTable() {
  var body = document.getElementById('tkmc-log-body');
  if (!body) return;                       /* tab not open — nothing to draw */

  var updated = document.getElementById('tkmc-log-updated');
  var count   = document.getElementById('tkmc-log-count');
  var log     = (typeof mcCommandLog !== 'undefined') ? mcCommandLog : [];

  if (!log.length) {
    body.innerHTML = '<div class="tkmc-log-empty">No adjustments yet</div>';
    if (updated) updated.textContent = 'Today';
    if (count)   count.textContent   = '0 records';
    return;
  }

  body.innerHTML = log.map(function (e) {
    return '<div class="tkmc-log-row">' +
      '<span class="tkmc-log-time">'   + tlEsc(e.time)   + '</span>' +
      '<span class="tkmc-log-cmd">'    + tlEsc(e.title)  + '</span>' +
      '<span class="tkmc-log-val">'    + tlEsc(e.value)  + '</span>' +
      '<span class="tkmc-log-result">' + tlEsc(e.result) + '</span>' +
    '</div>';
  }).join('');

  if (updated) updated.textContent = 'Last updated ' + log[0].time;
  if (count)   count.textContent   = log.length + ' record' + (log.length !== 1 ? 's' : '');
}

function tkmcClearLog() {
  if (typeof mcClearTable === 'function') mcClearTable();
  else if (typeof mcCommandLog !== 'undefined') mcCommandLog.length = 0;
  tkmcRenderTable();
}

/* CardInstance.resolveCard() calls the global logCommand(). Wrapping it here
   keeps app-02 untouched: the page table still updates through the original,
   and the drawer table follows. mcRenderTable() no-ops when the All Trucks
   markup is not in the DOM, so the reverse direction is safe too. */
(function tkmcHookLog() {
  if (typeof window.logCommand !== 'function' || window.logCommand.__tkmcWrapped) return;
  var orig = window.logCommand;
  window.logCommand = function () {
    orig.apply(this, arguments);
    tkmcRenderTable();
  };
  window.logCommand.__tkmcWrapped = true;
})();

/* ── Tab body ───────────────────────────────────────────────────────────── */

function tkmcRender(scroll) {
  scroll.style.cssText = 'flex:1;overflow-y:auto;padding:16px;';
  scroll.innerHTML =
    '<div class="tkmc-wrap tkmc-scope">' +
      '<div class="tkmc-cards">' +
        TKMC_CARD_IDS.map(function (id) {
          return '<div class="tkmc-mount" id="tkmc-unit-' + id + '"></div>';
        }).join('') +
      '</div>' +
      '<div class="tkmc-log">' +
        '<div class="tkmc-log-head">' +
          '<div>' +
            '<div class="tkmc-log-title">Ticket Adjustment Log</div>' +
            '<div class="tkmc-log-sub" id="tkmc-log-updated">Today</div>' +
          '</div>' +
          '<button class="tkmc-log-clear" onclick="tkmcClearLog()">Clear</button>' +
        '</div>' +
        '<div class="tkmc-log-thead">' +
          '<span>Time</span><span>Command</span><span>Value</span><span>Status</span>' +
        '</div>' +
        '<div class="tkmc-log-body" id="tkmc-log-body"></div>' +
        '<div class="tkmc-log-foot"><span id="tkmc-log-count">0 records</span></div>' +
      '</div>' +
    '</div>';

  /* Mount the real cards. Same two lines initMcCards() uses, minus the flip
     wiring, which only applies to the CAN errors and Sensors cards. */
  TKMC_CARD_IDS.forEach(function (id) {
    var mount = document.getElementById('tkmc-unit-' + id);
    var def   = (typeof MC_CARD_DEFS !== 'undefined')
      ? MC_CARD_DEFS.find(function (d) { return d.id === id; }) : null;
    if (!mount || !def) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = '<div class="mc-card ' + (def.hasInput ? 'mc-input-card' : '') + '">' +
      '<div class="progress-track"><div class="progress-fill"></div></div></div>';
    mount.appendChild(wrap);
    new CardInstance(def, wrap);
  });

  tkmcRenderTable();
}

/* ── Route the tab ──────────────────────────────────────────────────────── */
/* tkTab is a plain function declaration in app-01, so it lives on window and
   the onclick handlers resolve it at call time. Wrapping rather than editing
   app-01 keeps every other tab on its existing path. */
(function tkmcHookTab() {
  if (typeof window.tkTab !== 'function' || window.tkTab.__tkmcWrapped) return;
  var orig = window.tkTab;
  window.tkTab = function (el, tab) {
    if (tab !== 'manual') return orig.call(this, el, tab);

    if (el) {
      var tabsEl = el.closest ? el.closest('.dt-drawer-tabs') : null;
      if (tabsEl) tabsEl.querySelectorAll('.dt-drawer-tab').forEach(function (t) {
        t.classList.remove('active');
      });
      el.classList.add('active');
    }
    var scroll = document.getElementById('tk-drawer-scroll');
    if (!scroll) return;
    if (typeof senStop === 'function') senStop();
    tkmcRender(scroll);
  };
  window.tkTab.__tkmcWrapped = true;
})();
