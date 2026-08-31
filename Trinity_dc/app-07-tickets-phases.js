/* ============================================================================
   app-07-tickets-phases.js
   TICKETS → PHASES
   ----------------------------------------------------------------------------
   A phase board for the Tickets section. One column per delivery phase, one
   card per live ticket, cards open the SAME ticket drawer the Ticket List uses
   (tkOpenDrawer / #dt-ticket-drawer) so there is one detail surface, not two.

   Contract with the rest of the suite
     - Owns nothing outside #dt-page-tphases and the tp- namespace.
     - Reads TK_DATA and reuses tkPhasePill() / tkAlertBadge() / tkOpenDrawer()
       from app-01 so pills, badges and drawer stay in lockstep with the list.
     - Wraps dtNavGo() and tkSegSelect() rather than editing app-01 / app-06.
     - Zero CSS in this file. All styles live in styles.css under
       "TICKETS — PHASES BOARD".

   Load order: must come AFTER app-01 (TK_DATA, tk* helpers) and app-06 (dtNavGo).
   ========================================================================== */

/* ── 1. Demo data top-up ────────────────────────────────────────────────────
   TK_DATA ships 12 rows, which leaves most phase columns empty and makes the
   board read as broken rather than quiet. These rows are pushed onto the same
   array so the list table, the board and the drawer all stay index-consistent.
   Truck numbers are drawn from the real fleet in shared-data.js so "View truck"
   resolves. Delete this block to run the board on the original 12.           */
const TP_EXTRA_TICKETS = [
  { truck:'39821', ticket:'TKT-10470', phase:'Waiting to Load', customer:'Cemex AZ', order:'ORD-8822', mix:'MC-4000', location:'Phoenix Central', date:'Today, 9:31 AM', size:'9 yd³',  alerts:0, plant:'Plant 1', driver:'E. Salas',    slump:'—',      water:'—',      temp:'79°F' },
  { truck:'53127', ticket:'TKT-10469', phase:'Waiting to Load', customer:'Vulcan AZ', order:'ORD-8821', mix:'MC-3500', location:'Gilbert SW',      date:'Today, 9:24 AM', size:'10 yd³', alerts:1, plant:'Plant 4', driver:'N. Delgado',  slump:'—',      water:'—',      temp:'78°F' },
  { truck:'61042', ticket:'TKT-10468', phase:'Waiting to Load', customer:'Cemex AZ', order:'ORD-8820', mix:'MC-4500', location:'Tempe South',     date:'Today, 9:12 AM', size:'8 yd³',  alerts:0, plant:'Plant 2', driver:'S. Aguilar',  slump:'—',      water:'—',      temp:'77°F' },
  { truck:'77391', ticket:'TKT-10467', phase:'Loading',         customer:'Cemex AZ', order:'ORD-8819', mix:'MC-4000', location:'Phoenix Central', date:'Today, 9:05 AM', size:'9 yd³',  alerts:0, plant:'Plant 1', driver:'T. Núñez',    slump:'—',      water:'—',      temp:'77°F' },
  { truck:'67234', ticket:'TKT-10466', phase:'Washing',         customer:'Vulcan AZ', order:'ORD-8817', mix:'MC-5000', location:'Scottsdale N',    date:'Today, 8:52 AM', size:'7 yd³',  alerts:0, plant:'Plant 3', driver:'V. Ibarra',   slump:'5.0 in', water:'24 gal', temp:'76°F' },
  { truck:'84760', ticket:'TKT-10465', phase:'Washing',         customer:'Cemex AZ', order:'ORD-8816', mix:'MC-3000', location:'Chandler E',      date:'Today, 8:44 AM', size:'8 yd³',  alerts:1, plant:'Plant 1', driver:'H. Peña',     slump:'3.0 in', water:'16 gal', temp:'75°F' },
  { truck:'98214', ticket:'TKT-10464', phase:'Loaded',          customer:'Cemex AZ', order:'ORD-8815', mix:'MC-4500', location:'Mesa Eastside',   date:'Today, 8:36 AM', size:'10 yd³', alerts:0, plant:'Plant 2', driver:'O. Bravo',    slump:'4.5 in', water:'22 gal', temp:'75°F' },
  { truck:'21348', ticket:'TKT-10463', phase:'In Transit',      customer:'Vulcan AZ', order:'ORD-8814', mix:'MC-3500', location:'Gilbert SW',      date:'Today, 8:28 AM', size:'9 yd³',  alerts:2, plant:'Plant 4', driver:'K. Solano',   slump:'3.5 in', water:'18 gal', temp:'74°F' },
  { truck:'33501', ticket:'TKT-10462', phase:'On Site',         customer:'Cemex AZ', order:'ORD-8813', mix:'MC-4000', location:'Tempe South',     date:'Today, 8:19 AM', size:'8 yd³',  alerts:0, plant:'Plant 2', driver:'W. Castro',   slump:'4.0 in', water:'20 gal', temp:'74°F' },
  { truck:'44892', ticket:'TKT-10461', phase:'Ignition Off',    customer:'Cemex AZ', order:'ORD-8812', mix:'MC-3000', location:'Phoenix Central', date:'Today, 7:58 AM', size:'7 yd³',  alerts:1, plant:'Plant 1', driver:'Y. Mendez',   slump:'—',      water:'—',      temp:'73°F' },
];

/* ── 2. Phase order + accents ───────────────────────────────────────────────
   Column order follows the real delivery lifecycle, not alphabetical. Accent
   colors come from the --phase-* tokens in shared.css so a column rail, the
   pill on its cards, and the map marker for the same truck can never drift. */
const TP_PHASE_ORDER = [
  { key:'Waiting to Load', token:'--phase-waiting-to-load', dwellLimit: 30 },
  { key:'Loading',         token:'--phase-loading',         dwellLimit: 20 },
  { key:'Loaded',          token:'--phase-loaded',          dwellLimit: 15 },
  { key:'In Transit',      token:'--phase-to-job',          dwellLimit: 60 },
  { key:'On Site',         token:'--phase-on-site',         dwellLimit: 25 },
  { key:'Pouring',         token:'--phase-pouring',         dwellLimit: 55 },
  { key:'Washing',         token:'--phase-washing',         dwellLimit: 20 },
  { key:'Return to Plant', token:'--phase-return-to-plant', dwellLimit: 60 },
  { key:'Ignition Off',    token:'--phase-ignition-off',    dwellLimit: 15 },
];

/* ── 3. Dwell model ─────────────────────────────────────────────────────────
   TK_DATA has no "time in phase" field. Rather than bolt one onto app-01 we
   derive a stable minute count from the ticket id, so a card shows the same
   dwell on every render and after every filter. Swap tpDwell() for a real
   field the day the data carries one.                                       */
function tpDwell(t) {
  let h = 0;
  for (let i = 0; i < t.ticket.length; i++) h = (h * 31 + t.ticket.charCodeAt(i)) & 0xffff;
  const phase = TP_PHASE_ORDER.find(p => p.key === t.phase);
  const limit = phase ? phase.dwellLimit : 45;
  /* Spread 0.2x – 1.2x of the phase limit, so roughly one card in six runs over. */
  return Math.max(2, Math.round(limit * (0.2 + (h % 100) / 100)));
}

function tpDwellLabel(mins) {
  if (mins < 60) return mins + 'm';
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? h + 'h ' + m + 'm' : h + 'h';
}

function tpIsOverdue(t) {
  const phase = TP_PHASE_ORDER.find(p => p.key === t.phase);
  return phase ? tpDwell(t) > phase.dwellLimit : false;
}

/* ── 4. Filtering ───────────────────────────────────────────────────────────
   tkDeskPhase is shared by the Ticket List and the Phases board: both toolbars
   open the same filter, so switching views keeps the filter you set. The
   Ticket List's own rendering lives in app-01, so rather than reimplement it
   we wrap tkRebuildTable() and hide the rows that fall out (see section 4b). */
let tpOverdueOnly = false;
let tkDeskPhase = null;

function tpFiltered() {
  const q = (document.getElementById('tp-search-input')?.value || '').toLowerCase().trim();
  return TK_DATA.filter(t => {
    if (tkDeskPhase && t.phase !== tkDeskPhase) return false;
    if (tpOverdueOnly && !tpIsOverdue(t)) return false;
    if (!q) return true;
    return t.truck.includes(q)
      || t.ticket.toLowerCase().includes(q)
      || t.customer.toLowerCase().includes(q)
      || t.order.toLowerCase().includes(q)
      || t.mix.toLowerCase().includes(q)
      || t.location.toLowerCase().includes(q)
      || t.phase.toLowerCase().includes(q)
      || (t.driver || '').toLowerCase().includes(q);
  });
}

function tpToggleOverdue(btn) {
  tpOverdueOnly = !tpOverdueOnly;
  btn.classList.toggle('on', tpOverdueOnly);
  tpRender();
}

/* ── 4b. Desktop Filters control ────────────────────────────────────────────
   One popover definition, rendered into both toolbars (keys 'tk' and 'tp').  */

function tkPhaseList() {
  return TP_PHASE_ORDER.map(p => p.key).filter(k => TK_DATA.some(t => t.phase === k));
}

function tkFiltersToggle(e, key) {
  if (e) e.stopPropagation();
  const pop = document.getElementById(key + '-filters-pop');
  if (!pop) return;
  const open = pop.classList.contains('open');
  document.querySelectorAll('.dt-cols-popover.open').forEach(p => p.classList.remove('open'));
  pop.classList.toggle('open', !open);
  if (!open) tkFiltersRender();
}

function tkSetPhase(phase) {
  tkDeskPhase = (tkDeskPhase === phase) ? null : phase;
  document.querySelectorAll('.dt-cols-popover.open').forEach(p => p.classList.remove('open'));
  tkFiltersRender();
  if (typeof tkRebuildTable === 'function') tkRebuildTable();
  tpRender();
}

function tkFiltersRender() {
  const row = (label, phase, active) =>
    '<button class="tp-filter-row' + (active ? ' active' : '') + '" onclick="tkSetPhase(' +
    (phase === null ? 'null' : "'" + phase + "'") + ')">' +
    '<span>' + label + '</span>' +
    (active ? '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') +
    '</button>';
  const html = row('All phases', null, !tkDeskPhase) +
    tkPhaseList().map(k => {
      const label = (typeof TK_PHASES !== 'undefined' && TK_PHASES[k]) ? TK_PHASES[k].label : k;
      return row(label, k, tkDeskPhase === k);
    }).join('');

  ['tk', 'tp'].forEach(key => {
    const list = document.getElementById(key + '-filters-list');
    if (list) list.innerHTML = html;
    const badge = document.getElementById(key + '-filters-count');
    if (badge) {
      badge.style.display = tkDeskPhase ? 'inline-flex' : 'none';
      badge.textContent = '1';
    }
  });
}

/* The Ticket List table is rendered by app-01. Wrap it and hide the rows the
   phase filter excludes, reading each row's index back out of its onclick so
   we never duplicate app-01's cell-building logic. Zebra striping is reapplied
   over the visible rows, since :nth-child would still count the hidden ones. */
const tkOrigRebuild = (typeof tkRebuildTable === 'function') ? tkRebuildTable : null;

function tkApplyPhaseFilter() {
  const tbody = document.getElementById('tk-tbody');
  if (!tbody) return;
  let visible = 0;
  Array.from(tbody.rows).forEach(tr => {
    /* app-01 puts an event.stopPropagation();tkGoTruck() handler on the truck
       cell, which jumped the user out to All Trucks and the Diagnostic Center
       drawer. Clicking a truck in a ticket list should open that ticket, same
       as every other cell in the row. Dropping the handler lets the click
       bubble to the row's own tkOpenDrawer(). The link styling stays — it is
       still an entity reference, it just resolves to the ticket. */
    const link = tr.querySelector('.truck-link');
    if (link && link.hasAttribute('onclick')) link.removeAttribute('onclick');

    const m = /tkOpenDrawer\((\d+)\)/.exec(tr.getAttribute('onclick') || '');
    const t = m ? TK_DATA[+m[1]] : null;
    const ok = !tkDeskPhase || (t && t.phase === tkDeskPhase);
    tr.style.display = ok ? '' : 'none';
    tr.classList.remove('tp-alt', 'tp-noalt');
    if (ok) { tr.classList.add(visible % 2 ? 'tp-alt' : 'tp-noalt'); visible++; }
  });
}

window.tkRebuildTable = function () {
  if (tkOrigRebuild) tkOrigRebuild.apply(this, arguments);
  tkApplyPhaseFilter();
};

/* Outside click closes either desktop filter popover. */
document.addEventListener('click', function () {
  ['tk-filters-pop', 'tp-filters-pop'].forEach(id => {
    const pop = document.getElementById(id);
    if (pop) pop.classList.remove('open');
  });
});

/* ── 5. Stat band ───────────────────────────────────────────────────────────
   Hairline-divided row, not boxed cards. Counts are derived from the filtered
   set so the band always describes what is actually on screen.              */
function tpRenderStats(rows) {
  const el = document.getElementById('tp-statband');
  if (!el) return;
  const onJob   = rows.filter(t => ['In Transit','On Site','Pouring'].includes(t.phase)).length;
  const atPlant = rows.filter(t => ['Waiting to Load','Loading','Loaded','Return to Plant'].includes(t.phase)).length;
  const overdue = rows.filter(tpIsOverdue).length;
  const alerts  = rows.reduce((n, t) => n + (t.alerts || 0), 0);

  const stat = (label, value, tone) =>
    '<div class="tp-stat">' +
      '<div class="tp-stat-label">' + label + '</div>' +
      '<div class="tp-stat-value' + (tone ? ' ' + tone : '') + '">' + value + '</div>' +
    '</div>';

  el.innerHTML =
    stat('Live tickets', rows.length) +
    stat('On the job', onJob) +
    stat('At the plant', atPlant) +
    stat('Over phase time', overdue, overdue ? 'warn' : '') +
    stat('Active alerts', alerts, alerts ? 'err' : '');
}

/* ── 6. Card + column ───────────────────────────────────────────────────── */
function tpCard(t) {
  const idx = TK_DATA.indexOf(t);
  const mins = tpDwell(t);
  const over = tpIsOverdue(t);
  return '' +
    '<div class="tp-card" onclick="tkOpenDrawer(' + idx + ')">' +
      '<div class="tp-card-top">' +
        '<span class="tp-card-ticket">' + t.ticket + '</span>' +
        (t.alerts ? tkAlertBadge(t.alerts) : '') +
      '</div>' +
      '<div class="tp-card-truck">Truck ' + t.truck + '</div>' +
      '<div class="tp-card-meta">' + t.customer + ' · ' + t.mix + ' · ' + t.size + '</div>' +
      '<div class="tp-card-foot">' +
        '<span class="tp-card-loc" title="' + t.location + '">' + t.location + '</span>' +
        '<span class="tp-dwell' + (over ? ' over' : '') + '" title="Time in phase">' +
          '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1.1"/><path d="M5 2.8V5l1.6 1" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>' +
          tpDwellLabel(mins) +
        '</span>' +
      '</div>' +
    '</div>';
}

function tpColumn(phase, rows) {
  const cards = rows.filter(t => t.phase === phase.key);
  const body = cards.length
    ? cards.map(tpCard).join('')
    : '<div class="tp-empty">No trucks in this phase</div>';
  return '' +
    '<section class="tp-col" style="--tp-accent:var(' + phase.token + ');">' +
      '<header class="tp-col-head">' +
        tkPhasePill(phase.key) +
        '<span class="tp-col-count">' + cards.length + '</span>' +
      '</header>' +
      '<div class="tp-col-body">' + body + '</div>' +
    '</section>';
}

function tpRender() {
  const board = document.getElementById('tp-board');
  if (!board) return;
  const rows = tpFiltered();
  tpRenderStats(rows);
  board.innerHTML = TP_PHASE_ORDER.map(p => tpColumn(p, rows)).join('');
}

/* ── 7. Routing ─────────────────────────────────────────────────────────────
   Phases has no sidebar entry of its own — it is a view of the Ticket List,
   reached from the segmented control, so "Ticket List" stays lit in the nav
   the whole time. We call the original dtNavGo('tickets') to let app-06 put
   the shell in its Tickets state, then swap which page is visible. No edits
   to app-06 required.                                                       */
const tpOrigNavGo = (typeof dtNavGo === 'function') ? dtNavGo : null;

function tpShow() {
  if (tpOrigNavGo) tpOrigNavGo('tickets');       /* shell into Tickets state */
  const list = document.getElementById('dt-page-tickets');
  const board = document.getElementById('dt-page-tphases');
  if (list) list.classList.remove('active');
  if (board) board.classList.add('active');
  tpRender();
}

window.dtNavGo = function (key) {
  if (key === 'tphases') { tpShow(); return; }
  const board = document.getElementById('dt-page-tphases');
  if (board) board.classList.remove('active');
  if (tpOrigNavGo) tpOrigNavGo(key);
};

/* Segmented control — shared by both views. "Fleet map" is still a stub; it
   gets wired when Tickets → Map is built. */
window.tkSegSelect = function (el) {
  const label = (el.textContent || '').trim().toLowerCase();
  el.closest('.tk-seg').querySelectorAll('.tk-seg-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  if (label === 'phases')      { dtNavGo('tphases'); return; }
  if (label === 'all tickets') { dtNavGo('tickets');  return; }
  /* Fleet map: no target yet — leave the segment selected and do nothing. */
};

/* ── 8. Init ────────────────────────────────────────────────────────────── */
function tpInit() {
  if (typeof TK_DATA === 'undefined') return;   /* app-01 missing — bail quietly */
  const seen = new Set(TK_DATA.map(t => t.ticket));
  TP_EXTRA_TICKETS.forEach(t => { if (!seen.has(t.ticket)) TK_DATA.push(t); });
  tkFiltersRender();
  if (typeof tkRebuildTable === 'function') tkRebuildTable();  /* list picks up new rows */
  tpRender();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tpInit);
else tpInit();
