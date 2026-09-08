/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  tickets.js — TICKETS bundle                                               ║
   ║  Prefixes: tk- tp- tf- tv- mtk- ttk- tks- tkd- tkx- tkm- tkmc- so-         ║
   ║  Nav items: Tickets → Ticket List / Fleet map / Phases, all three frames,  ║
   ║  and the ticket drawer they all open.                                      ║
   ║                                                                            ║
   ║  Concatenation of five former scripts in their original relative load      ║
   ║  order. One edit, marked "FIX 2026-09-08" in the app-10 block: the         ║
   ║  segmented control now follows the page on screen. Search "FILE:" to jump. ║
   ║                                                                            ║
   ║    1. app-07-tickets-phases.js        Phases board, shared phase filter,   ║
   ║                                       tkTicketCard, demo data top-up       ║
   ║    2. app-08-tickets-mobile-tablet.js mtk* mobile overlay, ttk* tablet     ║
   ║                                       page, drag-to-scroll installer       ║
   ║    3. app-10-tickets-fleetmap.js      desktop Fleet map, TK_PAGES routing  ║
   ║    4. app-12-tickets-device-views.js  map + phases on the device frames,   ║
   ║                                       tvNavGo, Columns, CSV export         ║
   ║    5. app-20-ticket-drawer.js         drawer shell, tkTab dispatcher, all  ║
   ║                                       seven tab bodies, Status table       ║
   ║                                                                            ║
   ║  app-20 used to load after app-18. It moved up here because nothing in     ║
   ║  app-13..18 touches its names at load time and it touches none of theirs   ║
   ║  at load time (amToast / dbEsc are called at runtime only). Audited        ║
   ║  2026-09-08; see STRUCTURE.md for the checks.                              ║
   ║                                                                            ║
   ║  Load order: after app-06, before dashboard.js. The Ticket List table      ║
   ║  itself (tk-* rendering) is still in core app-01.                          ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */



/* ═══ FILE: app-07-tickets-phases.js ══════════════════════════════════════════════════ */

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
  { key:'Waiting to Load', css:'waiting-to-load', token:'--phase-waiting-to-load', dwellLimit: 30 },
  { key:'Loading',         css:'loading',         token:'--phase-loading',         dwellLimit: 20 },
  { key:'Loaded',          css:'loaded',          token:'--phase-loaded',          dwellLimit: 15 },
  { key:'In Transit',      css:'to-job',          token:'--phase-to-job',          dwellLimit: 60 },
  { key:'On Site',         css:'on-site',         token:'--phase-on-site',         dwellLimit: 25 },
  { key:'Pouring',         css:'pouring',         token:'--phase-pouring',         dwellLimit: 55 },
  { key:'Washing',         css:'washing',         token:'--phase-washing',         dwellLimit: 20 },
  { key:'Return to Plant', css:'return-to-plant', token:'--phase-return-to-plant', dwellLimit: 60 },
  { key:'Ignition Off',    css:'ignition-off',    token:'--phase-ignition-off',    dwellLimit: 15 },
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
   tkDeskPhase is shared by the Ticket List, the Fleet map and this board: all
   three toolbars open the same filter, so switching views keeps the filter you
   set. The Ticket List's own rendering lives in app-01, so rather than
   reimplement it we wrap tkRebuildTable() and hide the rows that fall out
   (see section 4b). */
let tkDeskPhase = null;

function tpFiltered() {
  const q = (document.getElementById('tp-search-input')?.value || '').toLowerCase().trim();
  return TK_DATA.filter(t => {
    if (tkDeskPhase && t.phase !== tkDeskPhase) return false;
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

/* ── 6. Ticket card ─────────────────────────────────────────────────────────
   One card component, used by the Phases board here and by the Fleet map rail
   in app-10. Defining it in the earlier-loading file means app-10 can call it
   rather than keeping a second copy in sync.                                */

/* Stable per-ticket minutes, so a card shows the same numbers on every render */
function tkCardMins(ticket, salt) {
  let h = 0;
  const str = ticket.ticket + salt;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return 4 + (h % 56);
}

/* opts: { idPrefix, onClick, hover } — the Fleet map needs its own click
   behaviour and hover pairing; the board just opens the drawer. */
function tkTicketCard(t, idx, opts) {
  opts = opts || {};
  const prefix = opts.idPrefix || 'tk-card-';
  const click = opts.onClick || ('tkOpenDrawer(' + idx + ')');
  const hover = opts.hover
    ? ' onmouseenter="' + opts.hover + '(' + idx + ')" onmouseleave="' + opts.hover + '(-1)"'
    : '';
  const dwell = tkCardMins(t, ':dwell');
  const eta = tkCardMins(t, ':eta');
  const onJob = ['In Transit', 'On Site', 'Pouring'].indexOf(t.phase) !== -1;
  const row = (k, v) =>
    '<div class="tf-row"><span class="tf-k">' + k + '</span><span class="tf-link">' + v + '</span></div>';

  return '' +
    '<article class="tf-card" id="' + prefix + idx + '" onclick="' + click + '"' + hover + '>' +
      '<div class="tf-card-top">' +
        '<div class="tf-card-id">' +
          '<div class="tf-truck">' + t.truck + '</div>' +
          '<div class="tf-driver">' + (t.driver || '\u2014') + '</div>' +
          '<div class="tf-since">Loaded ' + dwell + ' min ago</div>' +
        '</div>' +
        '<div class="tf-card-chips">' +
          '<span class="tf-chip">' + (t.temp || '\u2014') + '</span>' +
          '<span class="tf-chip' + (parseFloat(t.slump) > 5 ? ' warn' : '') + '">' + t.slump + '</span>' +
          (t.alerts ? tkAlertBadge(t.alerts) : '') +
        '</div>' +
      '</div>' +
      '<div class="tf-rows">' +
        row('Customer', t.customer) + row('Order', t.order) +
        row('Ticket', t.ticket) + row('Mix', t.mix) +
      '</div>' +
      '<div class="tf-card-foot">' +
        '<span class="tf-foot-phase">' + tkPhasePill(t.phase) +
          '<span class="tf-for">for <b>' + dwell + ' min</b></span>' +
        '</span>' +
        (onJob ? '<span class="tf-eta">ETA in <b>' + eta + ' min</b></span>' : '') +
      '</div>' +
    '</article>';
}

/* ── 6b. Lanes ──────────────────────────────────────────────────────────────
   One lane per phase, always present. An empty lane collapses to a rail with
   its name turned on its side — you can still see the phase exists and where
   it sits in the lifecycle — and expands to full width the moment a truck
   lands in it.                                                              */
function tpColumn(phase, rows) {
  const cards = rows.filter(o => o.t.phase === phase.key);
  const label = (typeof TK_PHASES !== 'undefined' && TK_PHASES[phase.key])
    ? TK_PHASES[phase.key].label : phase.key;

  return '' +
    '<section class="tp-lane ' + phase.css + (cards.length ? '' : ' empty') + '">' +
      '<header class="tp-lane-head">' +
        '<span class="tp-lane-dot ' + phase.css + '"></span>' +
        '<span class="tp-lane-name">' + label + '</span>' +
        '<span class="tp-lane-count">' + cards.length + '</span>' +
      '</header>' +
      '<div class="tp-lane-body">' +
        cards.map(o => tkTicketCard(o.t, o.i, { idPrefix: 'tp-card-' })).join('') +
      '</div>' +
    '</section>';
}

function tpRender() {
  const board = document.getElementById('tp-board');
  if (!board) return;
  const rows = tpFiltered().map(t => ({ t: t, i: TK_DATA.indexOf(t) }));
  const count = document.getElementById('tp-count');
  if (count) count.textContent = rows.length + (rows.length === 1 ? ' ticket' : ' tickets');
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


/* ═══ FILE: app-08-tickets-mobile-tablet.js ═══════════════════════════════════════════ */

/* ============================================================================
   app-08-tickets-mobile-tablet.js
   TICKETS — mobile and tablet, portrait and landscape
   ----------------------------------------------------------------------------
   Two surfaces, one file:
     mtk*  →  #mob-page-tickets   full-bleed overlay inside .phone, the same
                                  pattern #mob-page-update uses
     ttk*  →  #tb-page-tickets    sibling page inside #tb-page, the same
                                  pattern #tb-page-units / #tb-page-map use

   Rules this file follows (established elsewhere in the suite)
     - Responsive behaviour keys off body classes (view-mobile / view-tablet /
       orient-landscape), never window-width media queries: the device frames
       are fixed-size divs inside a desktop browser, so media queries never fire.
     - Landscape-only columns carry .lsc-col, hidden by default, revealed by
       two-class selectors in styles.css so they outrank the single-class base.
     - Zero CSS in this file. It all lives in styles.css under
       "TICKETS — MOBILE + TABLET".
     - Reads TK_DATA and reuses tkPhasePill() / tkAlertBadge() from app-01, so
       pills and badges match the desktop list exactly.
     - Mobile rows expand in place, the same behaviour as the All Trucks and
       Units mobile tables: the columns that only fit on tablet/desktop drop
       into a label/value panel under the row, closed by a full-width CTA.
     - That CTA and the tablet rows open the SAME #dt-ticket-drawer the desktop
       list opens, via tkOpenDrawer(). The drawer was moved to .phone level in
       index.html so all three viewports can host it. Nothing on these surfaces
       opens the Diagnostic Center truck drawer.

   Load order: after app-01 (TK_DATA, tk* helpers) and app-07 (data top-up).
   ========================================================================== */

/* ── 1. Shared filtering ──────────────────────────────────────────────────── */

function mtkMatch(t, q, phase) {
  if (phase && t.phase !== phase) return false;
  if (!q) return true;
  return t.truck.includes(q)
    || t.ticket.toLowerCase().includes(q)
    || t.customer.toLowerCase().includes(q)
    || t.order.toLowerCase().includes(q)
    || t.mix.toLowerCase().includes(q)
    || t.location.toLowerCase().includes(q)
    || t.phase.toLowerCase().includes(q)
    || (t.driver || '').toLowerCase().includes(q);
}

/* Phases present in the data, in lifecycle order, for the filter chip strip. */
function mtkPhasesInUse() {
  const order = (typeof TP_PHASE_ORDER !== 'undefined')
    ? TP_PHASE_ORDER.map(p => p.key)
    : Object.keys(TK_PHASES || {});
  return order.filter(k => TK_DATA.some(t => t.phase === k));
}

/* Strip the "Today, " prefix — the column header already says today. */
function mtkTime(t) { return (t.date || '').replace(/^Today,\s*/, ''); }

/* Row tap opens the ticket drawer, same call the desktop table makes. Nothing
   on these surfaces opens the Diagnostic Center truck drawer. */
function mtkOpenTicket(idx) {
  if (typeof tkOpenDrawer === 'function') tkOpenDrawer(idx);
}

/* ══ 2. MOBILE ═════════════════════════════════════════════════════════════ */

let mtkPhaseFilter = null;
const mtkOpenRows = {};

function mtkOpen() {
  if (typeof closeNav === 'function') closeNav();
  const el = document.getElementById('mob-page-tickets');
  if (el) el.style.display = 'flex';
  mtkRender();
}

function mtkClose() {
  const el = document.getElementById('mob-page-tickets');
  if (el) el.style.display = 'none';
}

/* Phase filtering lives inside the Filters control, not as a chip strip: the
   strip ran off the right edge of both frames and duplicated a control the
   toolbar already advertises. */
function mtkFilterToggle(e) {
  if (e) e.stopPropagation();
  const pop = document.getElementById('mtk-filter-pop');
  if (!pop) return;
  const open = pop.classList.contains('open');
  pop.classList.toggle('open', !open);
  if (!open) mtkRenderFilter();
}

function mtkChipSelect(phase) {
  mtkPhaseFilter = (mtkPhaseFilter === phase) ? null : phase;
  const pop = document.getElementById('mtk-filter-pop');
  if (pop) pop.classList.remove('open');
  mtkRender();
}

function mtkRenderFilter() {
  const list = document.getElementById('mtk-filter-list');
  if (!list) return;
  const row = (label, key, active) =>
    '<button class="mtk-filter-row' + (active ? ' active' : '') + '" onclick="mtkChipSelect(' +
    (key === null ? 'null' : "'" + key + "'") + ')">' +
    '<span>' + label + '</span>' +
    (active ? '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') +
    '</button>';
  list.innerHTML = row('All phases', null, !mtkPhaseFilter) +
    mtkPhasesInUse().map(k => {
      const label = (TK_PHASES && TK_PHASES[k]) ? TK_PHASES[k].label : k;
      return row(label, k, mtkPhaseFilter === k);
    }).join('');

  const badge = document.getElementById('mtk-filter-count');
  if (badge) {
    badge.style.display = mtkPhaseFilter ? 'inline-flex' : 'none';
    badge.textContent = '1';
  }
}

function mtkRow(t, idx) {
  const open = !!mtkOpenRows[idx];
  const chev = '<svg class="mtk-chev" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 1.5L7 5l-3.5 3.5" stroke="#36322d9e" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const row =
    '<div class="mtk-row' + (open ? ' mtk-row-open' : '') + '" onclick="mtkToggleRow(' + idx + ')">' +
      '<div class="mtk-td mtk-td-id">' + chev + '<span>' + t.ticket + '</span></div>' +
      '<div class="mtk-td">' + tkPhasePill(t.phase) + '</div>' +
      '<div class="mtk-td mtk-td-truck">' + t.truck + '</div>' +
      '<div class="mtk-td lsc-col">' + t.customer + '</div>' +
      '<div class="mtk-td lsc-col">' + t.order + '</div>' +
      '<div class="mtk-td lsc-col">' + t.location + '</div>' +
      '<div class="mtk-td mtk-td-time">' + mtkTime(t) + '</div>' +
      '<div class="mtk-td lsc-col">' + t.mix + '</div>' +
      '<div class="mtk-td lsc-col">' + t.size + '</div>' +
      '<div class="mtk-td lsc-col">' + t.slump + '</div>' +
      '<div class="mtk-td mtk-td-alerts">' + tkAlertBadge(t.alerts) + '</div>' +
    '</div>';

  /* Everything the narrow frame had to drop, in the column order the desktop
     table uses, so the two read as the same list. */
  const kv = (k, v) =>
    '<div class="mtk-exp-row"><span class="mtk-exp-label">' + k + '</span>' +
    '<span class="mtk-exp-value">' + v + '</span></div>';

  const expand =
    '<div class="mtk-expand' + (open ? ' open' : '') + '">' +
      kv('Customer', t.customer) +
      kv('Order', t.order) +
      kv('Location', t.location) +
      kv('Mix code', t.mix) +
      kv('Size', t.size) +
      kv('Ticketed slump', t.slump) +
      kv('Plant', t.plant || '—') +
      kv('Driver', t.driver || '—') +
      kv('Water added', t.water || '—') +
      kv('Temperature', t.temp || '—') +
      '<div class="mtk-exp-cta">' +
        '<button class="mtk-exp-btn" onclick="event.stopPropagation();mtkOpenTicket(' + idx + ')">View Ticket</button>' +
      '</div>' +
    '</div>';

  return row + expand;
}

function mtkToggleRow(idx) {
  mtkOpenRows[idx] = !mtkOpenRows[idx];
  mtkRender();
}

function mtkRender() {
  const list = document.getElementById('mtk-rows');
  if (!list) return;
  const q = (document.getElementById('mtk-search')?.value || '').toLowerCase().trim();
  const rows = TK_DATA.map((t, i) => ({ t, i })).filter(o => mtkMatch(o.t, q, mtkPhaseFilter));
  mtkRenderFilter();
  const count = document.getElementById('mtk-count');
  if (count) count.textContent = rows.length + (rows.length === 1 ? ' ticket' : ' tickets');
  list.innerHTML = rows.length
    ? rows.map(o => mtkRow(o.t, o.i)).join('')
    : '<div class="mtk-empty">No tickets match this filter</div>';
}

function mtkSearchClear() {
  const el = document.getElementById('mtk-search');
  if (el) el.value = '';
  mtkRender();
}

/* Any other mobile nav destination closes the Tickets overlay first — it sits
   at z-index 200 over #s-main, so without this it would stay on top of them. */
['goToAllTrucks', 'openUnits', 'snGoMap', 'mobSwuOpen'].forEach(fn => {
  const orig = window[fn];
  if (typeof orig !== 'function') return;
  window[fn] = function () { mtkClose(); return orig.apply(this, arguments); };
});

/* ══ 3. TABLET ═════════════════════════════════════════════════════════════ */

let ttkPhaseFilter = null;

/* The tablet shell shows its Diagnostic Center content as loose children of
   #tb-page rather than in one wrapper, so opening the Tickets page means
   hiding those siblings. We snapshot their inline display first and restore it
   on the way out, which keeps this working no matter what app-05's own nav
   functions do with them. */
const TTK_SIBLINGS = ['tb-page-header', 'tb-search-row', 'tb-tabs-row', 'tb-content',
                      'tb-page-units', 'tb-page-update', 'tb-page-map'];
let ttkSnapshot = null;

function ttkOpen() {
  if (typeof tbNavClose === 'function') tbNavClose();
  if (ttkSnapshot === null) {
    ttkSnapshot = {};
    TTK_SIBLINGS.forEach(id => {
      const el = document.getElementById(id);
      if (el) { ttkSnapshot[id] = el.style.display; el.style.display = 'none'; }
    });
  }
  const page = document.getElementById('tb-page-tickets');
  if (page) page.style.display = 'flex';
  /* app-05's tbNavSetActive only knows the four Diagnostic Center items, so it
     never clears them when the selection moves outside that branch. Passing an
     id it will not match clears all four, then we light Ticket List. Without
     this, Ticket List and All trucks both read as selected. */
  if (ttkOrigNav.tbNavSetActive) ttkOrigNav.tbNavSetActive('');
  ttkSetNavActive(true);
  ttkRender();
}

function ttkClose() {
  const wasOpen = ttkSnapshot !== null;
  const page = document.getElementById('tb-page-tickets');
  if (page) page.style.display = 'none';
  if (ttkSnapshot) {
    Object.keys(ttkSnapshot).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = ttkSnapshot[id];
    });
    ttkSnapshot = null;
  }
  ttkSetNavActive(false);
  /* Leaving Tickets with no other destination chosen (the nav panel's own
     All trucks item calls tbNavSetActive itself) drops back to All trucks,
     which is the tablet's default page. */
  if (wasOpen && ttkOrigNav.tbNavSetActive) ttkOrigNav.tbNavSetActive('tb-nav-alltrucks');
}

function ttkSetNavActive(on) {
  const el = document.getElementById('tb-nav-tickets');
  if (!el) return;
  const span = el.querySelector('span');
  if (on) { el.dataset.active = '1'; el.style.background = 'var(--blue)'; }
  else    { delete el.dataset.active; el.style.background = ''; }
  if (span) {
    span.style.color = on ? '#ffffff' : 'rgba(54,50,45,0.5)';
    span.style.fontWeight = on ? '500' : '';
  }
}

/* Any other tablet nav destination closes the Tickets page first. The originals
   are kept so ttkOpen() can call tbNavSetActive without tripping its own
   wrapper and closing the page it is opening. */
const ttkOrigNav = {};
['tbNavUnits', 'tbNavMap', 'tbNavUpdate', 'tbNavSetActive'].forEach(fn => {
  const orig = window[fn];
  if (typeof orig !== 'function') return;
  ttkOrigNav[fn] = orig;
  window[fn] = function () { ttkClose(); return orig.apply(this, arguments); };
});

/* Tablet portrait (834px) fits ten columns once the cells are tightened;
   landscape (1194px) adds Ticketed Slump for full desktop parity. */
const TTK_COLS = [
  { label: 'Ticket',   lsc: false },
  { label: 'Truck',    lsc: false },
  { label: 'Phase',    lsc: false },
  { label: 'Customer', lsc: false },
  { label: 'Order',    lsc: false },
  { label: 'Mix Code', lsc: false },
  { label: 'Size',     lsc: false },
  { label: 'Slump',    lsc: true  },
  { label: 'Location', lsc: false },
  { label: 'Created',  lsc: false },
  { label: 'Alerts',   lsc: false },
];

function ttkFilterToggle(e) {
  if (e) e.stopPropagation();
  const pop = document.getElementById('ttk-filter-pop');
  if (!pop) return;
  const open = pop.classList.contains('open');
  pop.classList.toggle('open', !open);
  if (!open) ttkRenderFilter();
}

function ttkChipSelect(phase) {
  ttkPhaseFilter = (ttkPhaseFilter === phase) ? null : phase;
  const pop = document.getElementById('ttk-filter-pop');
  if (pop) pop.classList.remove('open');
  ttkRender();
}

function ttkRenderFilter() {
  const list = document.getElementById('ttk-filter-list');
  if (!list) return;
  const row = (label, key, active) =>
    '<button class="ttk-filter-row' + (active ? ' active' : '') + '" onclick="ttkChipSelect(' +
    (key === null ? 'null' : "'" + key + "'") + ')">' +
    '<span>' + label + '</span>' +
    (active ? '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') +
    '</button>';
  list.innerHTML = row('All phases', null, !ttkPhaseFilter) +
    mtkPhasesInUse().map(k => {
      const label = (TK_PHASES && TK_PHASES[k]) ? TK_PHASES[k].label : k;
      return row(label, k, ttkPhaseFilter === k);
    }).join('');

  const badge = document.getElementById('ttk-filter-count');
  if (badge) {
    badge.style.display = ttkPhaseFilter ? 'inline-flex' : 'none';
    badge.textContent = '1';
  }
}

function ttkRender() {
  const tbody = document.getElementById('ttk-tbody');
  if (!tbody) return;
  const thead = document.getElementById('ttk-thead');
  if (thead) thead.innerHTML = '<tr>' + TTK_COLS.map(c =>
    '<th class="tb-th' + (c.lsc ? ' ttk-lsc' : '') + '">' + c.label + '</th>').join('') + '</tr>';

  const q = (document.getElementById('ttk-search')?.value || '').toLowerCase().trim();
  const rows = TK_DATA.map((t, i) => ({ t, i })).filter(o => mtkMatch(o.t, q, ttkPhaseFilter));

  ttkRenderFilter();
  const sub = document.getElementById('ttk-sub');
  if (sub) sub.textContent = 'Ticket List · ' + rows.length + (rows.length === 1 ? ' ticket' : ' tickets');

  if (!rows.length) {
    tbody.innerHTML = '<tr><td class="ttk-empty" colspan="' + TTK_COLS.length + '">No tickets match this filter</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map((o, n) => {
    const t = o.t, idx = o.i;
    return '<tr class="tb-tr' + (n % 2 ? ' alt' : '') + '" onclick="mtkOpenTicket(' + idx + ')">' +
      '<td class="tb-td">' + t.ticket + '</td>' +
      '<td class="tb-td">' + t.truck + '</td>' +
      '<td class="tb-td">' + tkPhasePill(t.phase) + '</td>' +
      '<td class="tb-td">' + t.customer + '</td>' +
      '<td class="tb-td">' + t.order + '</td>' +
      '<td class="tb-td">' + t.mix + '</td>' +
      '<td class="tb-td">' + t.size + '</td>' +
      '<td class="tb-td ttk-lsc">' + t.slump + '</td>' +
      '<td class="tb-td tb-td-trunc">' + t.location + '</td>' +
      '<td class="tb-td">' + mtkTime(t) + '</td>' +
      '<td class="tb-td">' + tkAlertBadge(t.alerts) + '</td>' +
    '</tr>';
  }).join('');
}

function ttkSearchClear() {
  const el = document.getElementById('ttk-search');
  if (el) el.value = '';
  ttkRender();
}

/* Outside click closes either filter popover. */
document.addEventListener('click', function () {
  ['mtk-filter-pop', 'ttk-filter-pop'].forEach(id => {
    const pop = document.getElementById(id);
    if (pop) pop.classList.remove('open');
  });
});


/* ══ 4. Mobile ticket drawer / 5. Responsive Status table ══════════════════
   Both moved to app-20-ticket-drawer.js (tkx* docking, TKS_* table, tksCards,
   tkRenderStatus). The drag-to-scroll installer below stays here because it is
   document-level and serves the Phases board and Fleet map rail as well. */

/* ── Drag-to-scroll for horizontal rails ────────────────────────────────────
   Applies to anything carrying .tk-dragscroll: the Status table, the Phases
   board, the Fleet map card rail.

   Two problems it solves. On a real tablet the browser handles horizontal
   panning, but the prototype runs inside a desktop browser where a finger is a
   mouse and there is nothing to flick. And on macOS the overlay scrollbar is
   invisible until you scroll, so a wide rail looks like a clipped one — you
   can't tell there is more to the right.

   So: grab and drag with the pointer, and a plain vertical wheel scrolls the
   rail sideways when there is nothing vertical under the cursor to scroll.

   Bound once at the document level, because these containers are replaced
   wholesale on every render. */

let tksDragEl = null, tksDragX = 0, tksDragLeft = 0, tksDragMoved = false, tksSwallowClick = false;

/* Is there something between the cursor and the rail that scrolls vertically?
   If so the wheel belongs to it — a lane of cards, not the board. */
function tksVerticalUnder(target, rail) {
  let el = target;
  while (el && el !== rail) {
    if (el.scrollHeight - el.clientHeight > 2) {
      const oy = getComputedStyle(el).overflowY;
      if (oy === 'auto' || oy === 'scroll') return true;
    }
    el = el.parentElement;
  }
  return false;
}

function tksInstallDragScroll() {
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') return;          /* let the device scroll it */
    const el = e.target.closest && e.target.closest('.tk-dragscroll');
    if (!el || el.scrollWidth <= el.clientWidth) return;
    tksDragEl = el; tksDragX = e.clientX; tksDragLeft = el.scrollLeft; tksDragMoved = false;
    el.classList.add('tks-dragging');
  });

  document.addEventListener('pointermove', function (e) {
    if (!tksDragEl) return;
    const dx = e.clientX - tksDragX;
    if (!tksDragMoved && Math.abs(dx) > 4) tksDragMoved = true;
    if (!tksDragMoved) return;
    tksDragEl.scrollLeft = tksDragLeft - dx;
    e.preventDefault();
  }, { passive: false });

  function endDrag() {
    if (!tksDragEl) return;
    tksDragEl.classList.remove('tks-dragging');
    if (tksDragMoved) {
      /* A drag that ends over a card or a phase header shouldn't also click it. */
      tksSwallowClick = true;
      setTimeout(function () { tksSwallowClick = false; }, 0);
    }
    tksDragEl = null;
  }
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  document.addEventListener('click', function (e) {
    if (!tksSwallowClick) return;
    if (e.target.closest && e.target.closest('.tk-dragscroll')) {
      e.stopPropagation(); e.preventDefault();
    }
  }, true);

  document.addEventListener('wheel', function (e) {
    const el = e.target.closest && e.target.closest('.tk-dragscroll');
    if (!el || el.scrollWidth <= el.clientWidth) return;
    if (e.deltaX !== 0) return;                     /* trackpad already panning */
    if (tksVerticalUnder(e.target, el)) return;     /* the wheel belongs to a lane */
    el.scrollLeft += e.deltaY;
    e.preventDefault();
  }, { passive: false });
}

/* ── 6. Init ──────────────────────────────────────────────────────────────── */
function mtkInit() {
  if (typeof TK_DATA === 'undefined') return;
  tksInstallDragScroll();
  mtkRender();
  ttkRender();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mtkInit);
else mtkInit();


/* ═══ FILE: app-10-tickets-fleetmap.js ════════════════════════════════════════════════ */

/* ============================================================================
   app-10-tickets-fleetmap.js
   TICKETS → FLEET MAP
   ----------------------------------------------------------------------------
   The third view of the Tickets section, alongside the Ticket List and the
   Phases board. Structurally it is the Diagnostic Center map with a different
   subject: instead of the fleet, it plots the tickets in the current list, and
   clicking a pin opens the same #dt-ticket-drawer the list opens.

   Deliberately reuses the fleet map's own vocabulary rather than inventing a
   parallel one:
     .dc-map-marker      the phase-coloured pill pins, so a pin here and a pin
                         on the DC map are the same component and colour
     .dc-map-legend      the phase key along the bottom
     .dc-map-ctrl-btn    the control cluster
   Everything new is tf-.

   Search and the phase filter are shared with the Ticket List and the Phases
   board through app-07's tkDeskPhase, so a filter set in one view survives the
   jump to another.

   Load order: after app-01 (TK_DATA, tkOpenDrawer, tkPhasePill) and app-07
   (tkDeskPhase, tkFiltersRender, the dtNavGo and tkSegSelect wrappers).
   ========================================================================== */

/* Phase key → the CSS suffix the marker and legend classes use. Same mapping
   the DC map applies, kept here so this file has no hidden dependency on it. */
const TF_PHASE_CSS = {
  'Waiting to Load': 'waiting-to-load',
  'Loading':         'loading',
  'Loaded':          'loaded',
  'In Transit':      'to-job',
  'On Site':         'on-site',
  'Pouring':         'pouring',
  'Washing':         'washing',
  'Return to Plant': 'return-to-plant',
  'Ignition Off':    'ignition-off',
};

const TF_LEGEND = [
  ['Waiting to load', 'waiting-to-load'], ['Loading', 'loading'], ['Loaded', 'loaded'],
  ['To job', 'to-job'], ['On site', 'on-site'], ['Pouring', 'pouring'],
  ['Washing', 'washing'], ['Return to plant', 'return-to-plant'], ['Ignition off', 'ignition-off'],
];

let tfMap = null, tfLayer = null, tfMarkers = {}, tfActive = -1;

/* ── 1. Filtering ───────────────────────────────────────────────────────────
   Same predicate the other two views use, plus the shared phase filter. */
function tfFiltered() {
  const q = (document.getElementById('tf-search-input')?.value || '').toLowerCase().trim();
  const phase = (typeof tkDeskPhase !== 'undefined') ? tkDeskPhase : null;
  return TK_DATA.map((t, i) => ({ t: t, i: i })).filter(o => {
    const t = o.t;
    if (phase && t.phase !== phase) return false;
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

/* Position: the truck's real lat/lng when shared-data has one, otherwise a
   stable point in the same Bay Area grid, seeded off the ticket so a ticket
   always lands in the same place. app-09 does the same for its trail. */
function tfLatLng(ticket) {
  if (typeof tkmAnchor === 'function') return tkmAnchor(ticket);
  const t = (typeof trucks !== 'undefined') ? trucks.find(x => x.num === ticket.truck) : null;
  if (t && t.lat != null) return [t.lat, t.lng];
  let h = 0;
  for (let i = 0; i < ticket.ticket.length; i++) h = (h * 31 + ticket.ticket.charCodeAt(i)) & 0xffff;
  return [37.62 + (h % 260) / 1000, -122.42 + ((h >> 4) % 420) / 1000];
}

/* Card markup lives in app-07 as tkTicketCard, shared with the Phases board.
   The map passes its own click and hover behaviour: a click flies to the pin
   rather than opening the drawer, and hovering pairs the card with its pin. */
function tfCard(t, idx) {
  const html = tkTicketCard(t, idx, {
    idPrefix: 'tf-card-',
    onClick: 'tfFocus(' + idx + ')',
    hover: 'tfHighlight'
  });
  return tfActive === idx ? html.replace('class="tf-card"', 'class="tf-card active"') : html;
}

/* ── 3. Render ────────────────────────────────────────────────────────────── */

function tfRender() {
  const rail = document.getElementById('tf-rail');
  if (!rail) return;
  const rows = tfFiltered();

  rail.innerHTML = rows.length
    ? rows.map(o => tfCard(o.t, o.i)).join('')
    : '<div class="tf-empty">No tickets match this filter</div>';

  const count = document.getElementById('tf-count');
  if (count) count.textContent = rows.length + (rows.length === 1 ? ' ticket' : ' tickets');

  tfPaintMarkers(rows);
}

function tfPaintMarkers(rows) {
  if (!tfMap || !tfLayer || typeof L === 'undefined') return;
  tfLayer.clearLayers();
  tfMarkers = {};
  const bounds = [];

  rows.forEach(o => {
    const ll = tfLatLng(o.t);
    bounds.push(ll);
    const css = TF_PHASE_CSS[o.t.phase] || 'ignition-off';
    const m = L.marker(ll, {
      icon: L.divIcon({
        className: '',
        html: '<span class="dc-map-marker ' + css + ' tf-pin' +
              (tfActive === o.i ? ' selected' : '') + '" data-idx="' + o.i + '">' + o.t.truck + '</span>',
        iconSize: [0, 0], iconAnchor: [0, 32]
      })
    });
    /* The pin is the commit step: it opens the same drawer the list rows open. */
    m.on('click', function () { tfActive = o.i; tfMarkSelected(); tkOpenDrawer(o.i); });
    m.addTo(tfLayer);
    tfMarkers[o.i] = m;
  });

  if (bounds.length && !tfMap._tfFitted) {
    tfMap.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
    tfMap._tfFitted = true;
  }
}

/* Two steps, not one: the card takes you to the pin, the pin opens the ticket.
   That keeps the map as the thing you navigate and the drawer as the thing you
   commit to, instead of a card click throwing a drawer over the map you were
   trying to look at. */
function tfFocus(idx) {
  tfActive = idx;
  const t = TK_DATA[idx];
  if (!t) return;
  const ll = tfLatLng(t);
  if (tfMap) {
    const z = Math.max(tfMap.getZoom(), 15);
    if (tfMap.flyTo) tfMap.flyTo(ll, z, { duration: 0.7 });
    else tfMap.setView(ll, z);
  }
  tfMarkSelected();
}

/* Selection is persistent; hover is transient. Both are painted directly
   rather than through a rerender, which would rebuild every marker. */
function tfMarkSelected() {
  document.querySelectorAll('#tf-map .tf-pin').forEach(function (el) {
    el.classList.toggle('selected', String(tfActive) === el.getAttribute('data-idx'));
  });
  document.querySelectorAll('#tf-rail .tf-card').forEach(function (el) {
    el.classList.toggle('active', el.id === 'tf-card-' + tfActive);
  });
}

/* Hovering a card lifts its pin, and vice versa, so the two halves of the page
   are obviously the same list. */
function tfHighlight(idx) {
  document.querySelectorAll('#tf-map .tf-pin').forEach(function (el) {
    el.classList.toggle('active', String(idx) === el.getAttribute('data-idx'));
  });
  document.querySelectorAll('#tf-rail .tf-card').forEach(function (el) {
    el.classList.toggle('hover', el.id === 'tf-card-' + idx);
  });
}

/* ── 4. Leaflet ───────────────────────────────────────────────────────────── */

function tfInitMap() {
  const el = document.getElementById('tf-map');
  if (!el || typeof L === 'undefined' || tfMap) return;
  tfMap = L.map(el, { zoomControl: false, attributionControl: false });
  tfMap.setView([37.75, -122.25], 10);
  L.tileLayer(
    (typeof window !== 'undefined' && window.TKM_TILE_URL) || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    { maxZoom: 19 }
  ).addTo(tfMap);
  tfLayer = L.layerGroup().addTo(tfMap);
}

function tfZoom(d) { if (tfMap) tfMap.setZoom(tfMap.getZoom() + d); }

function tfFit() {
  if (!tfMap) return;
  tfMap._tfFitted = false;
  tfPaintMarkers(tfFiltered());
}

/* ── 5. Routing ───────────────────────────────────────────────────────────
   The three Tickets views share one shell state, and getting there means
   calling app-06's dtNavGo('tickets') first — which shows the Ticket List.
   Removing the .active class was not enough to put it away again, so both
   pages rendered stacked. These helpers set display outright, and hand
   control back to app-06 the moment you leave the Tickets branch.        */

const TK_PAGES = ['dt-page-tickets', 'dt-page-tfleet', 'dt-page-tphases'];

function tkPagesShow(id) {
  TK_PAGES.forEach(function (p) {
    const el = document.getElementById(p);
    if (!el) return;
    const on = (p === id);
    el.classList.toggle('active', on);
    el.style.display = on ? 'flex' : 'none';
  });
  tkSegSync(id);
}

/* FIX 2026-09-08 (tickets.js): each of the three Tickets pages carries its own
   copy of the segmented control, and tkSegSelect only re-lit the copy you
   clicked. Arrive at a page by any other route (the sidebar, a nav wrapper,
   the other page's control) and its copy still showed whatever was clicked
   there last, so "Phases" could sit highlighted over the Fleet map. The
   highlight now follows the page that is actually on screen, on all three
   copies at once, every time the page changes. */
const TK_SEG_LABEL = { 'dt-page-tickets':'all tickets', 'dt-page-tfleet':'fleet map', 'dt-page-tphases':'phases' };

function tkSegSync(pageId) {
  const want = TK_SEG_LABEL[pageId];
  if (!want) return;
  document.querySelectorAll('#s-desktop .tk-seg .tk-seg-item, .tk-seg .tk-seg-item').forEach(function (item) {
    item.classList.toggle('active', (item.textContent || '').trim().toLowerCase() === want);
  });
}

/* Leaving Tickets: drop the inline display so app-06 owns these again. */
function tkPagesRelease() {
  TK_PAGES.forEach(function (p) {
    const el = document.getElementById(p);
    if (!el) return;
    el.style.display = '';
    /* tkPagesShow also set .active, and styles.css renders .active as flex.
       Clearing only the inline display left the Ticket List visible under
       whatever page came next (Dashboard stacked below it). */
    el.classList.remove('active');
  });
}

function tfShow() {
  /* Let app-06 put the shell into its Tickets state, then swap the page. */
  if (typeof tpOrigNavGo === 'function') tpOrigNavGo('tickets');
  tkPagesShow('dt-page-tfleet');
  tkNavLight('tfleet');

  tfInitMap();
  if (typeof tkFiltersRender === 'function') tkFiltersRender();
  tfRender();
  /* The page is flex-sized, so Leaflet measures 0 until it is visible. */
  setTimeout(function () { if (tfMap) { tfMap.invalidateSize(); tfFit(); } }, 60);
}

/* All three Tickets views have a sidebar entry, so one function owns which of
   them is lit. app-06 lights Ticket List on its own when it handles the
   'tickets' key; this then clears the other two. */
const TK_NAV = { tickets:'dt-nav-tickets', tfleet:'dt-nav-tfleet', tphases:'dt-nav-tphases' };

function tkNavLight(key) {
  Object.keys(TK_NAV).forEach(function (k) {
    const el = document.getElementById(TK_NAV[k]);
    if (!el) return;
    const span = el.querySelector('span');
    const on = (k === key);
    if (on) { el.dataset.active = '1'; el.style.background = 'var(--blue)'; }
    else { delete el.dataset.active; el.style.background = ''; }
    if (span) {
      span.style.color = on ? '#ffffff' : 'rgba(54,50,45,0.5)';
      span.style.fontWeight = on ? '500' : '';
    }
  });
}

/* Leaving the Tickets branch: nothing here should stay lit. */
function tkNavClear() { tkNavLight(null); }

const tfOrigNavGo = (typeof dtNavGo === 'function') ? dtNavGo : null;
window.dtNavGo = function (key) {
  if (key === 'tfleet') { tfShow(); return; }

  tkNavClear();
  if (tfOrigNavGo) tfOrigNavGo(key);

  /* app-07 owns the Phases swap; both it and app-06's Ticket List still need
     the sibling pages put away explicitly. */
  if (key === 'tphases')      { tkPagesShow('dt-page-tphases'); tkNavLight('tphases'); }
  else if (key === 'tickets') { tkPagesShow('dt-page-tickets'); tkNavLight('tickets'); }
  else                        tkPagesRelease();
};

/* Segmented control — all three Tickets views now have a destination. */
const tfOrigSeg = (typeof tkSegSelect === 'function') ? tkSegSelect : null;
window.tkSegSelect = function (el) {
  const label = (el.textContent || '').trim().toLowerCase();
  if (label === 'fleet map') {
    const seg = el.closest('.tk-seg');
    if (seg) seg.querySelectorAll('.tk-seg-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    dtNavGo('tfleet');
    return;
  }
  if (tfOrigSeg) return tfOrigSeg.apply(this, arguments);
};

/* The shared phase filter has to repaint this page too. */
const tfOrigSetPhase = (typeof tkSetPhase === 'function') ? tkSetPhase : null;
window.tkSetPhase = function (phase) {
  if (tfOrigSetPhase) tfOrigSetPhase.apply(this, arguments);
  tfRender();
};


/* ═══ FILE: app-12-tickets-device-views.js ════════════════════════════════════════════ */

/* ============================================================================
   app-12-tickets-device-views.js
   TICKETS — FLEET MAP + PHASES on mobile and tablet
   ----------------------------------------------------------------------------
   The desktop Tickets section has three views. This gives the mobile overlay
   (#mob-page-tickets) and the tablet page (#tb-page-tickets) the same three,
   switched by a segmented control under the toolbar rather than by nav routes,
   because on a device frame the whole section is one page.

   Nothing here re-implements a view. The cards are tkTicketCard from app-07,
   the phase lanes are tpColumn from app-07, the pin colours are TF_PHASE_CSS
   and the coordinates are tfLatLng from app-10. What is device-specific is the
   layout: the map takes the frame and the cards ride in a horizontal strip
   underneath, which is the pattern app-04 already uses for the Diagnostic
   Center map (.mom-card-strip on mobile, .tbm-card-strip on tablet).

   Tiles match app-04 exactly — OpenStreetMap, same URL, same maxZoom — so the
   two maps in the prototype look like one product.

   Load order: last. Reads app-07 (tpColumn, tkTicketCard, tpFiltered,
   TP_PHASE_ORDER), app-08 (mtkMatch, the drag-scroll installer) and app-10
   (tfLatLng, TF_PHASE_CSS).
   ========================================================================== */

const TV_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

/* Per-frame element ids. 'm' = mobile overlay, 't' = tablet page. */
const TV = {
  m: { view:'list', map:null, layer:null, markers:{}, active:-1,
       seg:'mtk-seg', list:'mtk-table-wrap', mapView:'mtk-map-view', board:'mtk-board',
       leaflet:'mtk-leaflet', legend:'mtk-legend', strip:'mtk-map-strip',
       search:'mtk-search', phaseKey:'m' },
  t: { view:'list', map:null, layer:null, markers:{}, active:-1,
       seg:'ttk-seg', list:'ttk-content', mapView:'ttk-map-view', board:'ttk-board',
       leaflet:'ttk-leaflet', legend:'ttk-legend', strip:'ttk-map-strip',
       search:'ttk-search', phaseKey:'t' },
};

const TV_LEGEND = [
  ['Waiting to load', 'waiting-to-load'], ['Loading', 'loading'], ['Loaded', 'loaded'],
  ['To job', 'to-job'], ['On site', 'on-site'], ['Pouring', 'pouring'],
  ['Washing', 'washing'], ['Return to plant', 'return-to-plant'], ['Ignition off', 'ignition-off'],
];

/* ── Rows ───────────────────────────────────────────────────────────────────
   Each frame filters on its own search box but shares the phase filter with
   the rest of the section, exactly as the list view already does. */
function tvRows(key) {
  const cfg = TV[key];
  const q = (document.getElementById(cfg.search)?.value || '').toLowerCase().trim();
  const phase = (key === 'm')
    ? (typeof mtkPhaseFilter !== 'undefined' ? mtkPhaseFilter : null)
    : (typeof ttkPhaseFilter !== 'undefined' ? ttkPhaseFilter : null);
  return TK_DATA.map((t, i) => ({ t: t, i: i }))
                .filter(o => mtkMatch(o.t, q, phase));
}

/* ── View switching ─────────────────────────────────────────────────────── */

function tvSwitch(key, view, btn) {
  const cfg = TV[key];
  if (!cfg) return;
  cfg.view = view;

  const seg = document.getElementById(cfg.seg);
  if (seg) seg.querySelectorAll('.tv-seg-item').forEach(b => b.classList.toggle('active', b === btn));

  const show = (id, on) => {
    const el = document.getElementById(id);
    if (el) el.style.display = on ? '' : 'none';
  };
  show(cfg.list, view === 'list');
  show(cfg.mapView, view === 'map');
  show(cfg.board, view === 'phases');

  if (view === 'map') { tvInitMap(key); tvRenderMap(key); }
  if (view === 'phases') tvRenderBoard(key);
}

/* ── Nav routing ────────────────────────────────────────────────────────────
   The device side nav carries the same three Tickets entries the desktop rail
   does. On a frame there is only one Tickets page, so a nav pick opens that
   page and moves the segmented control, rather than routing to a second page.
   Same shape as the Diagnostic Center sub-items, which open a page and land on
   a view. */
function tvNavGo(view) {
  const tablet = document.body.classList.contains('view-tablet');
  const key = tablet ? 't' : 'm';

  /* Two different navs. Mobile has the sidenav overlay (closeNav); the tablet
     has the tb-nav-panel slide-out (tbNavClose). Every other tablet nav item
     closes the panel either inline or inside its router, so the Tickets items
     have to as well or the panel sits over the page you just opened. */
  if (tablet) {
    if (typeof tbNavClose === 'function') tbNavClose();
    if (typeof ttkOpen === 'function') ttkOpen();
    else console.warn('tvNavGo: ttkOpen is not defined');
  } else {
    if (typeof closeNav === 'function') closeNav();
    if (typeof mtkOpen === 'function') mtkOpen();
    else console.warn('tvNavGo: mtkOpen is not defined');
  }

  /* The tablet page is the one that needs a nudge: ttkOpen shows the page and
     leaves the list up, and on some paths it finishes that work a tick later.
     Running the switch on the next tick means it lands after ttkOpen either
     way, and it still runs if ttkOpen threw on the way past. */
  if (tablet) { setTimeout(function () { tvApplyNav(key, view, tablet); }, 0); }
  else        { tvApplyNav(key, view, tablet); }
}

function tvApplyNav(key, view, tablet) {

  const seg = document.getElementById(TV[key].seg);
  const order = { list: 0, map: 1, phases: 2 };
  const btn = seg ? seg.querySelectorAll('.tv-seg-item')[order[view] || 0] : null;
  /* The page may still be animating in; a map built in a hidden frame needs a
     re-measure, which tvSwitch's init already handles on the next tick. */
  tvSwitch(key, view, btn);

  /* Move the tablet nav pill to the view that was actually picked. */
  if (tablet) {
    /* Do not call tbNavSetActive here. app-08 wrapped it so that any call runs
       ttkClose() first, which is right for a Diagnostic Center destination and
       fatal here: it would close the Tickets page we just opened. ttkOpen has
       already cleared the DC pills through the unwrapped original, so all that
       is left is lighting the right one of the three Tickets pills. */
    const navId = { list: 'tb-nav-tickets', map: 'tb-nav-tfleet', phases: 'tb-nav-tphases' }[view];
    tvTabletPill(navId);
  }
}

/* Light one of the three Tickets pills and clear the other two. Same blue,
   same white 500-weight label app-05 uses for the DC pills. */
const TV_TB_PILLS = ['tb-nav-tickets', 'tb-nav-tfleet', 'tb-nav-tphases'];
function tvTabletPill(activeId) {
  TV_TB_PILLS.forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    const span = el.querySelector('span');
    if (id === activeId) {
      el.style.background = '#3069e3';
      el.dataset.active = '1';
      if (span) { span.style.color = '#ffffff'; span.style.fontWeight = '500'; }
    } else {
      el.style.background = '';
      el.dataset.active = '';
      if (span) { span.style.color = 'rgba(54,50,45,0.5)'; span.style.fontWeight = ''; }
    }
  });
}

/* app-08 already sends every other tablet destination through ttkClose, and
   ttkClose already restores the sibling pages it hid. The only gap is that its
   ttkSetNavActive unlights tb-nav-tickets and does not know about the two new
   pills, so hook ttkClose rather than the routers. */
const tvOrigTtkClose = (typeof ttkClose === 'function') ? ttkClose : null;
window.ttkClose = function () {
  const r = tvOrigTtkClose ? tvOrigTtkClose.apply(this, arguments) : undefined;
  tvTabletPill(null);
  return r;
};

/* tbNavTrucks is the one router app-08 does not wrap, because All trucks is the
   tablet default rather than a page switch. Leaving Tickets for it still has to
   close the Tickets page. */
const tvOrigTbNavTrucks = (typeof tbNavTrucks === 'function') ? tbNavTrucks : null;
window.tbNavTrucks = function () {
  if (typeof ttkClose === 'function') ttkClose();
  return tvOrigTbNavTrucks ? tvOrigTbNavTrucks.apply(this, arguments) : undefined;
};

/* ── Columns ────────────────────────────────────────────────────────────────
   The actions row gained a Columns control to match the mock. Rather than
   rebuilding ttkRender's markup, hidden columns are applied as a stylesheet
   keyed on nth-child, so app-08 keeps owning the table and this keeps owning
   which of its columns show. TTK_COLS is the single source of the order, the
   same list ttkRender builds its header from.

   Ticket is not offered: dropping the identifier leaves rows you cannot read. */
const TV_COLS_LOCKED = 0;
const tvColsHidden = new Set();

function tvColsStyle() {
  let el = document.getElementById('tv-cols-style');
  if (!el) {
    el = document.createElement('style');
    el.id = 'tv-cols-style';
    document.head.appendChild(el);
  }
  return el;
}

function tvColsApply() {
  const rules = [];
  tvColsHidden.forEach(function (i) {
    const n = i + 1;
    rules.push('#ttk-thead th:nth-child(' + n + '),' +
               '#ttk-tbody tr:not(.ttk-empty-row) td:nth-child(' + n + '){display:none;}');
  });
  tvColsStyle().textContent = rules.join('\n');
}

function tvColsRender() {
  const list = document.getElementById('ttk-cols-list');
  if (!list || typeof TTK_COLS === 'undefined') return;
  list.innerHTML = TTK_COLS.map(function (c, i) {
    if (i === TV_COLS_LOCKED) return '';
    const on = !tvColsHidden.has(i);
    return '<button class="ttk-filter-row' + (on ? ' active' : '') + '" onclick="tvColsSet(' + i + ')">' +
      '<span>' + c.label + '</span>' +
      (on ? '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') +
    '</button>';
  }).join('');
}

function tvColsSet(i) {
  if (tvColsHidden.has(i)) tvColsHidden.delete(i); else tvColsHidden.add(i);
  tvColsApply();
  tvColsRender();
}

function tvColsReset() {
  tvColsHidden.clear();
  tvColsApply();
  tvColsRender();
}

function tvColsToggle(e) {
  if (e) e.stopPropagation();
  const pop = document.getElementById('ttk-cols-pop');
  if (!pop) return;
  const open = pop.classList.contains('open');
  /* app-08 closes the two filter popovers on any document click; this one has
     to be closed the same way, so share the gesture rather than add a second. */
  document.querySelectorAll('.ttk-filter-pop.open, .mtk-filter-pop.open')
          .forEach(function (el) { el.classList.remove('open'); });
  if (!open) { pop.classList.add('open'); tvColsRender(); }
}

document.addEventListener('click', function () {
  const pop = document.getElementById('ttk-cols-pop');
  if (pop) pop.classList.remove('open');
});


/* ── Export ─────────────────────────────────────────────────────────────────
   The download button on both actions rows. Exports what is on screen, which
   means the search text and the phase filter both apply, not the whole fleet. */
function tvCsvCell(v) {
  const s = String(v === undefined || v === null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function tvExport(key) {
  const rows = tvRows(key);
  const head = ['Ticket', 'Truck', 'Phase', 'Customer', 'Order', 'Mix Code',
                'Size', 'Slump', 'Location', 'Created', 'Alerts'];
  const body = rows.map(function (o) {
    const t = o.t;
    const phase = (typeof TK_PHASES !== 'undefined' && TK_PHASES[t.phase])
      ? TK_PHASES[t.phase].label : t.phase;
    return [t.ticket, t.truck, phase, t.customer, t.order, t.mix, t.size,
            t.slump, t.location, (typeof mtkTime === 'function' ? mtkTime(t) : ''),
            (t.alerts || 0)].map(tvCsvCell).join(',');
  });
  const csv = head.join(',') + '\n' + body.join('\n');

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tickets.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

/* ── Phases ─────────────────────────────────────────────────────────────── */

function tvRenderBoard(key) {
  const cfg = TV[key];
  const board = document.getElementById(cfg.board);
  if (!board || typeof tpColumn !== 'function') return;
  const rows = tvRows(key);
  board.innerHTML = TP_PHASE_ORDER.map(p => tpColumn(p, rows)).join('');
}

/* ── Fleet map ──────────────────────────────────────────────────────────── */

function tvInitMap(key) {
  const cfg = TV[key];
  const el = document.getElementById(cfg.leaflet);
  if (!el || typeof L === 'undefined' || cfg.map) return;

  cfg.map = L.map(el, { center: [37.7649, -122.2300], zoom: 10, zoomControl: false, attributionControl: false, keyboard: false });
  L.tileLayer(TV_TILES, { maxZoom: 19 }).addTo(cfg.map);
  cfg.layer = L.layerGroup().addTo(cfg.map);

  const legend = document.getElementById(cfg.legend);
  if (legend && !legend.innerHTML) {
    legend.innerHTML = TV_LEGEND.map(function (p) {
      return '<span class="tv-legend-item"><span class="tv-legend-dot ' + p[1] + '"></span>' + p[0] + '</span>';
    }).join('');
  }
  setTimeout(function () { if (cfg.map) cfg.map.invalidateSize(); }, 80);
}

function tvRenderMap(key) {
  const cfg = TV[key];
  const rows = tvRows(key);

  /* Card strip — same card as everywhere else, laid out horizontally.
     A tap focuses the pin; the pin opens the drawer, matching the desktop
     Fleet map's two-step. */
  const strip = document.getElementById(cfg.strip);
  if (strip) {
    strip.innerHTML = rows.length
      ? rows.map(o => tkTicketCard(o.t, o.i, {
          idPrefix: 'tv-' + key + '-card-',
          onClick: "tvFocus('" + key + "'," + o.i + ")"
        })).join('')
      : '<div class="tv-strip-empty">No tickets match this filter</div>';
  }

  if (!cfg.map || !cfg.layer) return;
  cfg.layer.clearLayers();
  cfg.markers = {};
  const bounds = [];

  rows.forEach(function (o) {
    const ll = tfLatLng(o.t);
    bounds.push(ll);
    const css = TF_PHASE_CSS[o.t.phase] || 'ignition-off';
    const m = L.marker(ll, {
      icon: L.divIcon({
        className: '',
        html: '<span class="dc-map-marker ' + css + ' tf-pin' +
              (cfg.active === o.i ? ' selected' : '') + '" data-idx="' + o.i + '">' + o.t.truck + '</span>',
        iconSize: [0, 0], iconAnchor: [0, 32]
      })
    });
    m.on('click', function () { cfg.active = o.i; tvMarkSelected(key); tkOpenDrawer(o.i); });
    m.addTo(cfg.layer);
    cfg.markers[o.i] = m;
  });

  if (bounds.length && !cfg.fitted) {
    cfg.map.fitBounds(bounds, { padding: [36, 36], maxZoom: 12 });
    cfg.fitted = true;
  }
}

function tvFocus(key, idx) {
  const cfg = TV[key];
  const t = TK_DATA[idx];
  if (!t) return;
  cfg.active = idx;
  if (cfg.map) {
    const ll = tfLatLng(t);
    const z = Math.max(cfg.map.getZoom(), 14);
    if (cfg.map.flyTo) cfg.map.flyTo(ll, z, { duration: 0.6 });
    else cfg.map.setView(ll, z);
  }
  tvMarkSelected(key);
  /* Bring the tapped card into view — the strip scrolls horizontally on both
     frames, the same as .mom-card-strip does on the Diagnostic Center map. */
  const strip = document.getElementById(cfg.strip);
  const card = document.getElementById('tv-' + key + '-card-' + idx);
  if (strip && card && strip.scrollTo) {
    strip.scrollTo({ left: card.offsetLeft - (strip.offsetWidth / 2) + (card.offsetWidth / 2), behavior: 'smooth' });
  }
}

function tvMarkSelected(key) {
  const cfg = TV[key];
  document.querySelectorAll('#' + cfg.leaflet + ' .tf-pin').forEach(function (el) {
    el.classList.toggle('selected', String(cfg.active) === el.getAttribute('data-idx'));
  });
  document.querySelectorAll('#' + cfg.strip + ' .tf-card').forEach(function (el) {
    el.classList.toggle('active', el.id === 'tv-' + key + '-card-' + cfg.active);
  });
}

/* ── Keeping the views in step with search and filters ──────────────────────
   mtkRender and ttkRender already run on every search keystroke and every
   phase pick, so wrapping them keeps whichever view is open current without
   a second set of listeners. */
const tvOrigMtkRender = (typeof mtkRender === 'function') ? mtkRender : null;
window.mtkRender = function () {
  const r = tvOrigMtkRender ? tvOrigMtkRender.apply(this, arguments) : undefined;
  if (TV.m.view === 'map') tvRenderMap('m');
  if (TV.m.view === 'phases') tvRenderBoard('m');
  return r;
};

const tvOrigTtkRender = (typeof ttkRender === 'function') ? ttkRender : null;
window.ttkRender = function () {
  const r = tvOrigTtkRender ? tvOrigTtkRender.apply(this, arguments) : undefined;
  /* The empty state is one colspan cell, so nth-child column hiding must skip
     it. Tagging the row here is cheaper than teaching app-08 about it. */
  const empty = document.querySelector('#ttk-tbody .ttk-empty');
  if (empty && empty.parentNode) empty.parentNode.classList.add('ttk-empty-row');
  if (TV.t.view === 'map') tvRenderMap('t');
  if (TV.t.view === 'phases') tvRenderBoard('t');
  return r;
};

/* Opening either page lands on the list and re-measures a map that was built
   while its frame was hidden. */
const tvOrigMtkOpen = (typeof mtkOpen === 'function') ? mtkOpen : null;
window.mtkOpen = function () {
  const r = tvOrigMtkOpen ? tvOrigMtkOpen.apply(this, arguments) : undefined;
  setTimeout(function () { if (TV.m.map) TV.m.map.invalidateSize(); }, 80);
  return r;
};

const tvOrigTtkOpen = (typeof ttkOpen === 'function') ? ttkOpen : null;
window.ttkOpen = function () {
  const r = tvOrigTtkOpen ? tvOrigTtkOpen.apply(this, arguments) : undefined;
  setTimeout(function () { if (TV.t.map) TV.t.map.invalidateSize(); }, 80);
  return r;
};


/* ═══ FILE: app-20-ticket-drawer.js ═══════════════════════════════════════════════════ */

/* ============================================================================
   app-20-ticket-drawer.js
   TICKET DRAWER — shell, tab dispatcher, and every tab body
   ----------------------------------------------------------------------------
   Everything that happens inside #dt-ticket-drawer lives here: open/close/
   prev-next, the summary side panel, the mobile/tablet one-pane docking, and
   the seven tab bodies (Status, Charts, Map, Order details, Manual control,
   Text messaging, Ticketed Slump override).

   Why one file. Before this the tab handler was tkTab in app-01, wrapped four
   deep by app-08 (summary docking), app-09 (Map), app-11 (Manual control) and
   app-19 (Slump override), each guarding against the others and each
   depending on load order. app-19 short-circuited the chain, so switching
   from Manual control to Slump override wiped the borrowed Add Water / Add
   Admix cards out of the DOM. That is the fragile-assumption bug shape, and
   the fix is structural: one dispatcher, one explicit leave step.

   Shape
     tkTab(el, tab)
       -> tkdLeave()        stop sensors, tear down Leaflet, hand the Manual
                            Control cards back, rescue the summary panel.
                            Runs before ANY innerHTML assignment, every time.
       -> render(tab)       one switch, one renderer per tab.
       -> tkxDockSummary()  mobile/tablet only: park the summary under the
                            tab body, unless the tab keeps the body to itself.

   The list views (Ticket List, Phases, Fleet Map) stay in app-01/07/10/12 and
   only ever call tkOpenDrawer(idx). Nothing outside this file wraps tkTab.

   Load order: after app-13 (vfDd, amToast, amTag) and after app-02 (CardInstance,
   initMcCards, mcCommandLog, logCommand). Replaces app-09, app-11, app-19 and
   the drawer sections of app-01 and app-08.
   ========================================================================== */

/* Prefixes: tkd- dispatcher · tkx- device docking · tks- Status table ·
   tkm- Map · tkmc- Manual control · so- Slump override · tk- shell (legacy). */

/* ══ 1. Shell: open, close, prev/next, summary panel ═══════════════════════ */

function tkOpenDrawer(idx) {
  const t = TK_DATA[idx];
  if (!t) return;
  tkCurrentTicket = t;
  tkCurrentIdx = idx;
  document.getElementById('tk-drawer-id').textContent = 'Ticket: ' + t.ticket;
  const pill = document.getElementById('tk-drawer-phase-pill');
  if (pill) pill.innerHTML = tkPhasePill(t.phase);
  /* Build side panel */
  tkBuildSidePanel(t);
  /* Open on Status tab */
  const firstTab = document.querySelector('#dt-ticket-drawer .dt-drawer-tab[data-tab="status"]');
  if (firstTab) tkTab(firstTab, 'status');
  document.getElementById('dt-ticket-drawer').classList.add('open');
  document.getElementById('dt-ticket-scrim').classList.add('open');
}

function tkNavTicket(dir) {
  const next = tkCurrentIdx + dir;
  if (next >= 0 && next < TK_DATA.length) tkOpenDrawer(next);
}

function tkCloseDrawer() {
  /* Same leave step a tab switch runs: sensors, Leaflet, borrowed MC cards,
     summary panel. Then the drawer state. */
  tkdLeave();
  const scroll = document.getElementById('tk-drawer-scroll');
  if (scroll) { scroll.style.padding = ''; scroll.classList.remove('so-scope-root'); }
  tkdCurrentTab = null;
  document.getElementById('dt-ticket-drawer').classList.remove('open');
  document.getElementById('dt-ticket-scrim').classList.remove('open');
  tkCurrentTicket = null;
  tkCurrentIdx = -1;
}

function tkBuildSidePanel(t) {
  const side = document.getElementById('tk-side-body');
  if (!side) return;

  const chip = (icon, label, value, linked) =>
    '<div class="tk-summary-chip">' +
      '<div class="tk-chip-icon">' + icon + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
        '<div class="tk-chip-label">' + label + '</div>' +
        '<div class="tk-chip-value' + (linked ? ' linked' : '') + '"' + (linked ? ' onclick="' + linked + '"' : '') + '>' + value + '</div>' +
      '</div>' +
    '</div>';

  const iconOrder  = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.66675 1.83301H9.33374C9.55464 1.83309 9.7664 1.92094 9.92261 2.07715C10.0788 2.23335 10.1667 2.44512 10.1667 2.66602V3.16602H11.3337C11.7314 3.1661 12.1131 3.32424 12.3943 3.60547C12.6755 3.8867 12.8337 4.26831 12.8337 4.66602V12.666C12.8337 13.0637 12.6754 13.4453 12.3943 13.7266C12.1131 14.0078 11.7314 14.1659 11.3337 14.166H4.66675C4.26892 14.166 3.88751 14.0079 3.6062 13.7266C3.325 13.4453 3.16675 13.0638 3.16675 12.666V4.66602C3.16683 4.26831 3.32497 3.8867 3.6062 3.60547C3.88749 3.32427 4.269 3.16602 4.66675 3.16602H5.83374V2.66602C5.83383 2.44512 5.92168 2.23335 6.07788 2.07715C6.23415 1.92097 6.44581 1.83301 6.66675 1.83301ZM4.66675 3.5C4.35733 3.5 4.06034 3.623 3.84155 3.8418C3.62304 4.06048 3.49984 4.35687 3.49976 4.66602V12.666C3.49976 12.9754 3.62286 13.2724 3.84155 13.4912C4.06035 13.71 4.35733 13.833 4.66675 13.833H11.3337C11.643 13.8329 11.9393 13.7098 12.158 13.4912C12.3768 13.2724 12.4998 12.9754 12.4998 12.666V4.66602C12.4997 4.35671 12.3767 4.06051 12.158 3.8418C11.9392 3.62308 11.643 3.50009 11.3337 3.5H10.1667V4C10.1667 4.2209 10.0788 4.43266 9.92261 4.58887C9.7664 4.74507 9.55464 4.83292 9.33374 4.83301H6.66675C6.44581 4.83301 6.23415 4.74505 6.07788 4.58887C5.92168 4.43266 5.83383 4.2209 5.83374 4V3.5H4.66675ZM6.16675 4.5H9.83374V2.16602H6.16675V4.5Z" stroke="currentColor"/></svg>';
  const iconMix    = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h10v12H3z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M5 6h6M5 9h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
  const iconTruck  = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.5 11V9.5c0-.8.7-2 2-2.5l2-1V4c0-.8.8-1.5 2-1.5h1c1.2 0 2 .7 2 1.5v2l2 1c1.3.5 2 1.7 2 2.5V11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="4" cy="12.5" r="1.2" stroke="currentColor" stroke-width="1.3"/><circle cx="12" cy="12.5" r="1.2" stroke="currentColor" stroke-width="1.3"/></svg>';
  const iconDriver = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';

  const alertItem = (errType, label, desc, truckNum) => {
    const badge = errType === 'err'
      ? '<div style="width:20px;height:20px;border-radius:4px;background:#d70100;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="white" stroke-width="1"/><path d="M5 3v2.2M5 6.8h.01" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg></div>'
      : '<div style="width:20px;height:20px;border-radius:4px;background:rgba(250,30,30,0.23);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1.5L9.5 8.5H.5L5 1.5z" stroke="#d97706" stroke-width="1" stroke-linejoin="round"/><path d="M5 4.5v1.5M5 7.5h.01" stroke="#d97706" stroke-width="1" stroke-linecap="round"/></svg></div>';
    return '<div class="tk-alert-item">' +
      '<div class="tk-alert-item-hdr">' + badge + '<span class="tk-alert-label">' + label + '</span></div>' +
      '<div class="tk-alert-desc">' + desc + '</div>' +
      '<button class="tk-msg-btn">Message driver</button>' +
    '</div>';
  };

  side.innerHTML =
    /* Summary chips — 2 rows of 2, icon + bold label + underlined value */
    '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;">' +
      '<div style="display:flex;gap:8px;">' +
        chip(iconOrder,  'Order number', t.order,  false) +
        chip(iconMix,    'Mix code',     t.mix,    false) +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        chip(iconTruck,  'Truck number', t.truck,  'tkGoTruck(\'' + t.truck + '\')') +
        chip(iconDriver, 'Driver',       t.driver, false) +
      '</div>' +
    '</div>' +

    /* KV table — two plain flex cols, no border box */
    '<div style="display:flex;margin-bottom:24px;">' +
      '<div style="flex:1;display:flex;flex-direction:column;">' +
        '<div class="tk-kv-key">Load size</div>' +
        '<div class="tk-kv-key">Mix code instruction</div>' +
        '<div class="tk-kv-key">Customer</div>' +
        '<div class="tk-kv-key">Current location</div>' +
        '<div class="tk-kv-key">Destination</div>' +
      '</div>' +
      '<div style="flex:1;display:flex;flex-direction:column;">' +
        '<div class="tk-kv-val">' + t.size + '</div>' +
        '<div class="tk-kv-val">Manage to Allowable Water</div>' +
        '<div class="tk-kv-val">' + t.customer + '</div>' +
        '<div class="tk-kv-val">' + t.location + '</div>' +
        '<div class="tk-kv-val">' + t.plant + '</div>' +
      '</div>' +
    '</div>' +

    /* Alerts card */
    '<div class="tk-alerts-card">' +
      '<div class="tk-alerts-title">Alerts</div>' +
      (t.alerts > 0
        ? alertItem('err', 'Slump deviation: Above target', 'Consistent slump deviations above target for certain drivers.', t.truck)
          + alertItem('wrn', 'Driver exceeding time at plant', 'Truck ' + t.truck + ' has been at Lockhart for over 60 minutes.', t.truck)
        : '<div style="padding:0 16px 14px;font-size:13px;color:var(--soft);">No active alerts</div>'
      ) +
    '</div>';
}


/* ── Mobile/tablet one-pane docking ─────────────────────────────────────────
   The drawer is a two-pane desktop layout: tab content left, summary panel
   right. Neither device frame has the width, so on mobile and tablet the
   summary (#tk-side-body) is moved into #tk-drawer-scroll under the tab body,
   the way the All Trucks device drawers show their info block. It has to be
   rescued back to its own column before any innerHTML assignment, which is why
   tkdLeave() runs it first, unconditionally. */

/* Mobile and tablet share the one-pane treatment; desktop keeps its split. */
function tkxIsDevice() {
  const c = document.body.classList;
  return c.contains('view-mobile') || c.contains('view-tablet');
}

function tkxSideHome() { return document.querySelector('#dt-ticket-drawer .dt-drawer-side'); }

/* Pull the panel back to its own column so an innerHTML assignment can't eat it. */
function tkxRescueSummary() {
  const side = document.getElementById('tk-side-body');
  const home = tkxSideHome();
  if (side && home && side.parentNode !== home) home.appendChild(side);
}

/* app-01's Status tab renders a 1100px-wide table and turns on horizontal
   scrolling for the WHOLE tab body. Left alone, the docked summary would
   inherit that and slide sideways with the table. Confine the overflow to the
   table itself so the page scrolls vertically and only the table scrolls
   across, which is how the truck drawer behaves. */
function tkxConfineWideContent(scroll) {
  const wide = scroll.firstElementChild;
  if (!wide || wide.classList.contains('tkx-hscroll')) return;
  if (!/min-width/.test(wide.getAttribute('style') || '')) return;
  const wrap = document.createElement('div');
  wrap.className = 'tkx-hscroll';
  scroll.insertBefore(wrap, wide);
  wrap.appendChild(wide);
  scroll.style.overflowX = 'hidden';
}

/* Messaging is a full-height chat with a pinned input bar, so it keeps the
   body to itself — the same way the truck drawers show their info block on
   Components Overview but not on Logs or Manual Control. */
/* Tabs that keep the body to themselves. Messaging is a full-height chat with a
   pinned input; Map and Manual control fill the pane; Slump override has its
   own sticky footer. Status, Charts and Order details take the summary. */
const TKX_NO_SUMMARY_TABS = ['messaging', 'map', 'manual', 'slump'];

function tkxDockSummary(tab) {
  if (!tkxIsDevice()) return;
  const scroll = document.getElementById('tk-drawer-scroll');
  const side = document.getElementById('tk-side-body');
  if (!scroll || !side) return;
  if (TKX_NO_SUMMARY_TABS.indexOf(tab) !== -1) { side.classList.remove('tkx-docked'); return; }
  tkxConfineWideContent(scroll);
  side.classList.add('tkx-docked');
  scroll.appendChild(side);
}

/* ══ 2. Dispatcher ═════════════════════════════════════════════════════════ */

let tkdCurrentTab = null;

/* Everything that must be true before the tab body is replaced. Each line is a
   former wrapper's "on the way out" duty, now an invariant rather than a hope
   that the wrapper below it was called. */
function tkdLeave() {
  if (typeof senStop === 'function') senStop();
  if (typeof tkmStop === 'function') tkmStop();
  if (typeof tkmMap !== 'undefined' && tkmMap) { try { tkmMap.remove(); } catch (e) {} tkmMap = null; }
  if (typeof tkmcReturnUnits === 'function') tkmcReturnUnits();
  tkxRescueSummary();
}

function tkdComingSoon(scroll, tab) {
  scroll.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--soft);font-size:14px;">' +
      tab.charAt(0).toUpperCase() + tab.slice(1).replace(/-/g, ' ') + ' \u2014 coming soon' +
    '</div>';
}

function tkTab(el, tab) {
  if (el) {
    const tabsEl = el.closest('.dt-drawer-tabs');
    if (tabsEl) tabsEl.querySelectorAll('.dt-drawer-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
  }
  const scroll = document.getElementById('tk-drawer-scroll');
  if (!scroll) return;

  tkdLeave();
  tkdCurrentTab = tab;
  scroll.classList.remove('so-scope-root');
  /* Reset scroll styles; each renderer sets what it needs. */
  scroll.style.cssText = 'flex:1;overflow-y:auto;';

  switch (tab) {
    case 'status':
      tkStatusCollapsed = {};
      tkRenderStatus(tkCurrentTicket);
      break;
    case 'charts':
      senSelected.clear();
      senSelected.add('slump');
      senSelected.add('water');
      scroll.style.padding = '16px';
      scroll.innerHTML = tkBuildSensor();
      requestAnimationFrame(function () {
        dtSenRenderCards();
        if (!senAnimId) setTimeout(function () { senTick(); }, 300);
      });
      break;
    case 'map':
      tkmRender();
      break;
    case 'manual':
      tkmcRender();
      break;
    case 'messaging':
      tkRenderMessaging(scroll);
      break;
    case 'slump':
      scroll.classList.add('so-scope-root');
      soState.type = null; soState.value = '';
      soRender();
      break;
    default:
      tkdComingSoon(scroll, tab);
  }

  tkxDockSummary(tab);
}


/* ══ 3. Status tab ═════════════════════════════════════════════════════════ */

/* Status tab — phase-grouped data table (Figma node 3121:21674) */
var tkStatusCollapsed = {};

function tkStatusToggleGroup(phase) {
  tkStatusCollapsed[phase] = !tkStatusCollapsed[phase];
  tkRenderStatus(tkCurrentTicket);
}

function tkSlumpBadge(val, target) {
  if (!val || val === '-') return '<span style="color:var(--soft);font-size:14px;">-</span>';
  var num = parseFloat(val);
  var tgt = parseFloat(target) || 4.0;
  var bad = Math.abs(num - tgt) > 1.5;
  if (bad) return '<span style="display:inline-flex;align-items:center;justify-content:center;background:#d70100;color:white;font-size:12px;letter-spacing:-0.24px;padding:2px 6px;border-radius:2px;white-space:nowrap;">' + val + '</span>';
  return '<span style="font-size:14px;color:var(--defined);">' + val + '</span>';
}

/* ══ 5. Responsive Status table ════════════════════════════════════════════
   app-01 renders the Status tab as a fixed 1100px-wide table and turns on
   horizontal scrolling. That never fitted anything: the desktop drawer pane is
   roughly 970px so the last two columns clip, and both device frames end up
   dragging sideways to read a single row.

   This replaces it with one CSS grid sized per frame. Every frame that shows
   the table shows all ten columns; tablet portrait is ~140px short of fitting
   them, so the table slides sideways inside its own scroller rather than
   hiding two fields behind a chevron. Two columns is not worth an affordance.

   Mobile portrait is the exception. Three columns is not a table, it is a list
   wearing table chrome, so that one breakpoint renders the accordion card
   stack the Component Timeline uses instead (.ct-list / .ct-row / .ct-event),
   with the readings inside each phase and the rest of the fields on a tap.
   Both markups are rendered and CSS picks one, so rotating the frame swaps
   layouts live without needing a re-render.

   Desktop is included deliberately: it was clipping the last two columns at
   the old fixed 1100px. Column order is regrouped so Target Slump sits next
   to Actual Slump, which reads better than the original interleave.        */

const TKS_COLS = [
  { key:'date',   label:'Date & Time'  },
  { key:'status', label:'Status'       },
  { key:'slump',  label:'Actual Slump' },
  { key:'target', label:'Target Slump' },
  { key:'water',  label:'Water added'  },
  { key:'fluid',  label:'Fluid event'  },
  { key:'admix',  label:'Admix added'  },
  { key:'revs',   label:'Total revs'   },
  { key:'temp',   label:'Temp'         },
  { key:'size',   label:'Load size'    },
];

/* Mock phase groups, lifted verbatim from app-01's tkRenderStatus so the two
   renderers show the same thing. Belongs in shared-data.js the day this stops
   being mock. */
const TKS_ROW = { date:'1:16 PM', dateD:'07/23/2025', status:'Loading', slump:'9.75 in', fluid:'-',
                  target:'8.00 in', water:'0.5 gal/yd\u00b3', admix:'-', revs:'-', temp:'100\u00b0F', size:'-' };
const TKS_GROUPS = [
  { phase:'In Transit',      elapsed:'24m 18s', count:1 },
  { phase:'Loaded',          elapsed:'',        count:1 },
  { phase:'Loading',         elapsed:'',        count:2 },
  { phase:'Waiting to Load', elapsed:'',        count:4 },
];

const tksOpenRows = {};

/* Only the mobile-portrait card stack expands; every table frame shows all
   ten columns, so there is nothing left to reveal. */
function tksToggleRow(key) {
  tksOpenRows[key] = !tksOpenRows[key];
  if (typeof tkRenderStatus === 'function') tkRenderStatus(tkCurrentTicket);
}

function tksCell(col, row) {
  if (col.key === 'date') {
    return '<span class="tks-date-t">' + row.date + '</span>' +
           '<span class="tks-date-d">' + row.dateD + '</span>';
  }
  if (col.key === 'slump') return tkSlumpBadge(row.slump, row.target);
  return row[col.key] || '-';
}


/* Same test tkSlumpBadge uses to decide the red chip — reused here to colour
   the card icon, so an out-of-spec reading is visible before you open it. */
function tksOutOfSpec(row) {
  const n = parseFloat(row.slump), t = parseFloat(row.target) || 4.0;
  return isFinite(n) && Math.abs(n - t) > 1.5;
}

const TKS_WARN_SVG  = '<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1.5L11 10.5H1L6 1.5Z" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/><path d="M6 5v2.2M6 8.8h.01" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></svg>';
const TKS_CLOCK_SVG = '<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.6" stroke="#36322d" stroke-width="1.2"/><path d="M6 3.4V6l1.8 1.1" stroke="#36322d" stroke-width="1.2" stroke-linecap="round"/></svg>';

/* Mobile-portrait card stack, built from the Component Timeline vocabulary so
   it is the same component, not a lookalike. */
function tksCards() {
  return '<div class="tks-cards"><div class="ct-list">' + TKS_GROUPS.map((g, gi) => {
    const collapsed = tkStatusCollapsed[g.phase];
    const label = g.count + (g.count === 1 ? ' reading' : ' readings') + (g.elapsed ? ' \u00b7 ' + g.elapsed : '');

    let evts = '';
    for (let i = 0; i < g.count; i++) {
      const key = gi + '-' + i;
      const open = !!tksOpenRows[key];
      const bad = tksOutOfSpec(TKS_ROW);
      evts +=
        '<div class="tks-evt">' +
          '<div class="ct-event" onclick="tksToggleRow(\'' + key + '\')">' +
            '<div class="ct-event-left">' +
              '<div class="ct-event-icon ' + (bad ? 'ct-icon-alarm' : 'tks-icon-ok') + '">' +
                (bad ? TKS_WARN_SVG : TKS_CLOCK_SVG) +
              '</div>' +
              '<div>' +
                '<div class="ct-event-time">' + TKS_ROW.date + '</div>' +
                '<div class="ct-event-sub">' + TKS_ROW.dateD + ' \u00b7 ' + TKS_ROW.status + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="ct-row-right">' +
              tkSlumpBadge(TKS_ROW.slump, TKS_ROW.target) +
              '<svg class="tks-evt-arrow' + (open ? ' open' : '') + '" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 1.5L7 5l-3.5 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</div>' +
          '</div>' +
          '<div class="tks-evt-detail' + (open ? ' open' : '') + '">' +
            TKS_COLS.filter(c => ['date', 'status', 'slump'].indexOf(c.key) === -1).map(c =>
              '<div class="tl-detail-row"><span class="tl-detail-k">' + c.label + '</span>' +
              '<span class="tl-detail-v">' + (TKS_ROW[c.key] || '-') + '</span></div>').join('') +
          '</div>' +
        '</div>';
    }

    return '<div class="ct-row">' +
        '<div class="ct-row-hdr" onclick="tkStatusToggleGroup(\'' + g.phase.replace(/'/g, "\\'") + '\')">' +
          '<div class="ct-row-left">' + tkPhasePill(g.phase) + '</div>' +
          '<div class="ct-row-right">' +
            '<span class="ct-row-summary">' + label + '</span>' +
            '<svg class="ct-chev' + (collapsed ? '' : ' open') + '" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5l5 5 5-5" stroke="#36322d9e" stroke-width="1.3" stroke-linecap="round"/></svg>' +
          '</div>' +
        '</div>' +
        '<div class="ct-events' + (collapsed ? '' : ' open') + '">' + evts + '</div>' +
      '</div>';
  }).join('') + '</div></div>';
}

function tkRenderStatus(t) {
  const scroll = document.getElementById('tk-drawer-scroll');
  if (!scroll) return;
  /* This function assigns scroll.innerHTML, and on mobile/tablet the summary
     panel is parked inside that scroll. Collapsing a phase group or expanding
     a row calls straight back in here, so without this rescue the panel would
     be destroyed on the first toggle and never rebuilt — tkBuildSidePanel()
     would find nothing to fill on every subsequent open. */
  tkxRescueSummary();
  scroll.style.overflowX = 'hidden';   /* the grid fits; nothing to scroll across */

  /* Header and every data row emit exactly one cell per column, in the same
     order, and styles.css pins each to its own grid track. Belt and braces:
     an incomplete row can't drag the rest of the table out of alignment. */
  const head = TKS_COLS.map(c =>
    '<div class="tks-th tks-c-' + c.key + '">' + c.label + '</div>').join('');

  const body = TKS_GROUPS.map(g => {
    const collapsed = tkStatusCollapsed[g.phase];
    const group =
      '<div class="tks-group" onclick="tkStatusToggleGroup(\'' + g.phase.replace(/'/g, "\\'") + '\')">' +
        '<svg class="tks-group-chev' + (collapsed ? ' closed' : '') + '" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5l5 5 5-5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>' +
        tkPhasePill(g.phase) +
        (g.elapsed ? '<span class="tks-group-elapsed">' + g.elapsed + '</span>' : '') +
      '</div>';
    if (collapsed) return group;

    let rows = '';
    for (let i = 0; i < g.count; i++) {
      const alt = i % 2 === 1 ? ' alt' : '';
      rows += TKS_COLS.map(c =>
        '<div class="tks-td tks-c-' + c.key + alt + '">' + tksCell(c, TKS_ROW) + '</div>').join('');
    }
    return group + rows;
  }).join('');

  /* Both layouts go in; CSS shows the table or the cards depending on the
     frame, so rotating swaps them without a re-render. */
  scroll.innerHTML =
    '<div class="tks-scroll-x tk-dragscroll"><div class="tks-tbl">' + head + body + '</div></div>' +
    tksCards();
  /* Direct re-entries (group toggle, row expand) bypass tkTab, so dock here too.
     tkTab's own dock call after this is a no-op re-append. */
  tkxDockSummary('status');
}

/* ══ 4. Charts tab ═════════════════════════════════════════════════════════
   The sensor engine (SEN_CONFIGS, senSelected, dtSenRenderCards, senTick,
   senStop) is app-02's and shared with the truck drawer. Only the chip
   markup is the ticket drawer's own. */

function tkBuildSensor() {
  const chips = [
    { key:'slump',    label:'Slump',         },
    { key:'water',    label:'Water Add.',     },
    { key:'admix',    label:'Admix',          },
    { key:'revs',     label:'Total Revs',     },
    { key:'drum',     label:'Drum Speed',     },
    { key:'temp',     label:'Temperature',    },
  ];

  const chipsHtml = chips.map(c => {
    const isActive = senSelected.has(c.key);
    const cfg = SEN_CONFIGS[c.key];
    if (!cfg) return '';
    const val = `<span class="sen-chip-val" id="dt-sv-${c.key}">${cfg.liveBase.toFixed(cfg.liveDecimals)}<span class="sen-chip-unit"> ${cfg.liveUnit}</span></span>`;
    return `<div class="sen-chip${isActive ? ' active' : ''}" data-sensor="${c.key}" onclick="dtSenToggle(this)">
      <div class="sen-chip-label">${c.label}</div>
      ${val}
    </div>`;
  }).join('');

  return `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div id="dt-sen-chips" style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;">
        ${chipsHtml}
      </div>
      <div id="dt-sen-charts" style="display:grid;grid-template-columns:1fr;gap:12px;"></div>
    </div>`;
}

/* ══ 5. Text messaging tab ═════════════════════════════════════════════════ */

var tkMsgHistory = [
  { type:'date', text:'November 18, 2026' },
  { type:'user', sender:'Emily Carter', text:'I need you to come back to the plant.', time:'03:36pm' },
  { type:'driver', sender:'John D Ramsey', text:'10-4, will do.', time:'03:45pm' },
  { type:'date', text:'November 21, 2026' },
  { type:'user', sender:'Emily Carter', text:'When you get back to the plant, can you wash out the truck? Let\'s talk after.', time:'04:02pm' },
  { type:'driver', sender:'John D Ramsey', text:'10-4, will do.', time:'04:12pm' },
];

var TK_QUICK_REPLIES = ['10-4', 'K', 'On my way', 'Give me 5 min', 'Almost there'];

function tkNow() {
  var d = new Date();
  var h = d.getHours(), m = d.getMinutes();
  var ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return h + ':' + (m < 10 ? '0'+m : m) + ampm;
}

function tkMsgBubble(msg) {
  if (msg.type === 'date') {
    return '<div class="tk-msg-date-divider">' + msg.text + '</div>';
  }
  if (msg.type === 'user') {
    return '<div class="tk-msg-row-user">' +
      '<div class="tk-msg-sender">' + msg.sender + '</div>' +
      '<div class="tk-msg-bubble-user">' + msg.text + '</div>' +
      '<div class="tk-msg-time">' + msg.time + '</div>' +
    '</div>';
  }
  if (msg.type === 'driver') {
    return '<div class="tk-msg-row-driver">' +
      '<div class="tk-msg-sender">' + msg.sender + '</div>' +
      '<div class="tk-msg-bubble-driver">' + msg.text + '</div>' +
      '<div class="tk-msg-time">' + msg.time + '</div>' +
    '</div>';
  }
  return '';
}

function tkMsgRender() {
  var scroll = document.getElementById('tk-msg-scroll');
  if (!scroll) return;
  scroll.innerHTML = tkMsgHistory.map(tkMsgBubble).join('');
  scroll.scrollTop = scroll.scrollHeight;
}


function tkMsgSend() {
  var input = document.getElementById('tk-msg-input');
  if (!input) return;
  var text = input.value.trim();
  if (!text) return;
  input.value = '';

  /* Add user message */
  tkMsgHistory.push({ type:'user', sender:'Emily Carter', text:text, time:tkNow() });
  var scroll = document.getElementById('tk-msg-scroll');
  if (!scroll) return;
  /* Remove old quick row if present */
  var qr = document.getElementById('tk-quick-row');
  if (qr) qr.remove();
  var el = document.createElement('div');
  el.innerHTML = tkMsgBubble(tkMsgHistory[tkMsgHistory.length-1]);
  scroll.appendChild(el.firstChild);
  scroll.scrollTop = scroll.scrollHeight;

  /* Show typing indicator then driver auto-replies */
  var typingEl = document.createElement('div');
  typingEl.className = 'tk-msg-row-driver';
  typingEl.id = 'tk-msg-typing';
  typingEl.innerHTML = '<div class="tk-msg-sender">' + (tkCurrentTicket ? tkCurrentTicket.driver : 'Driver') + '</div>' +
    '<div class="tk-msg-typing"><span></span><span></span><span></span></div>';
  scroll.appendChild(typingEl);
  scroll.scrollTop = scroll.scrollHeight;

  /* After 1.5s auto-send a driver response */
  setTimeout(function() {
    var typing = document.getElementById('tk-msg-typing');
    if (typing) typing.remove();
    var replies = ['10-4', 'K', 'On my way', 'Give me 5 min', 'Almost there', 'Roger that', 'Copy'];
    var reply = replies[Math.floor(Math.random() * replies.length)];
    var driver = tkCurrentTicket ? tkCurrentTicket.driver : 'Driver';
    tkMsgHistory.push({ type:'driver', sender:driver, text:reply, time:tkNow() });
    var el = document.createElement('div');
    el.innerHTML = tkMsgBubble(tkMsgHistory[tkMsgHistory.length-1]);
    scroll.appendChild(el.firstChild);
    scroll.scrollTop = scroll.scrollHeight;
  }, 1500);
}

function tkRenderMessaging(scroll) {
  scroll.style.padding = '0';
  scroll.style.overflow = 'hidden';
  scroll.style.display = 'flex';
  scroll.style.flexDirection = 'column';
  scroll.innerHTML =
    '<div class="tk-msg-wrap">' +
      '<div class="tk-msg-scroll" id="tk-msg-scroll"></div>' +
      '<div class="tk-msg-input-bar">' +
        '<div class="tk-msg-input-inner">' +
          '<input class="tk-msg-input-field" id="tk-msg-input" placeholder="Send a message..." ' +
            'onkeydown="if(event.key===\'Enter\')tkMsgSend()" />' +
          '<button class="tk-msg-send-btn" onclick="tkMsgSend()" title="Send">' +
            '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12.5 1.5L6.5 7.5M12.5 1.5L8.5 12.5L6.5 7.5L1.5 5.5L12.5 1.5Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  tkMsgRender();
}

/* ══ 6. Map tab ════════════════════════════════════════════════════════════
   Two jobs, per the Figma (Trinity Design Overview, node 2651:104717): show
   where the truck is now, and replay the run from the start of the trail,
   dropping breadcrumb dots coloured by the phase the truck was in. A dot on
   the map and a group header in the Status table are the same phase in the
   same --phase-* token. Built on the existing map vocabulary (.dc-map-*);
   everything else is tkm-. Teardown lives in tkdLeave() and tkCloseDrawer. */

/* ── 1. Route synthesis ─────────────────────────────────────────────────────
   No route data exists yet, so we generate one that is stable per ticket: the
   same ticket always draws the same trail. Phases run in lifecycle order and
   stop at the ticket's current phase, which is what makes the head of the
   trail agree with the phase pill in the drawer header.                     */

const TKM_PHASE_ORDER = [
  { key:'Waiting to Load', css:'waiting-to-load', token:'--phase-waiting-to-load', pts:3 },
  { key:'Loading',         css:'loading',         token:'--phase-loading',         pts:3 },
  { key:'Loaded',          css:'loaded',          token:'--phase-loaded',          pts:2 },
  { key:'In Transit',      css:'to-job',          token:'--phase-to-job',          pts:9 },
  { key:'On Site',         css:'on-site',         token:'--phase-on-site',         pts:3 },
  { key:'Pouring',         css:'pouring',         token:'--phase-pouring',         pts:4 },
  { key:'Washing',         css:'washing',         token:'--phase-washing',         pts:2 },
  { key:'Return to Plant', css:'return-to-plant', token:'--phase-return-to-plant', pts:7 },
  { key:'Ignition Off',    css:'ignition-off',    token:'--phase-ignition-off',    pts:1 },
];

function tkmSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0x7fffffff;
  return function () { h = (h * 1103515245 + 12345) & 0x7fffffff; return h / 0x7fffffff; };
}

/* Anchor the trail on the truck's real position when it has one (the first 15
   trucks carry lat/lng from shared-data), otherwise on a stable point in the
   same Bay Area grid so the tile view still looks right. */
function tkmAnchor(ticket) {
  const t = (typeof trucks !== 'undefined') ? trucks.find(x => x.num === ticket.truck) : null;
  if (t && t.lat != null) return [t.lat, t.lng];
  const rnd = tkmSeed(ticket.ticket);
  return [37.62 + rnd() * 0.26, -122.42 + rnd() * 0.42];
}

/* Returns { points:[{lat,lng,phase,css,token,idx}], legs:[{phase,from,to}] } */
function tkmRoute(ticket) {
  const rnd = tkmSeed(ticket.ticket + ':route');
  const end = tkmAnchor(ticket);
  const stopAt = TKM_PHASE_ORDER.findIndex(p => p.key === ticket.phase);
  const legsIn = TKM_PHASE_ORDER.slice(0, (stopAt < 0 ? 3 : stopAt) + 1);

  const total = legsIn.reduce((n, p) => n + p.pts, 0);
  /* Walk backwards from the truck's current position so the head always lands
     exactly on it, then reverse — that way the live marker is truthful and the
     tail is the part we fabricate. */
  let lat = end[0], lng = end[1];
  const back = [];
  let heading = rnd() * Math.PI * 2;
  for (let i = 0; i < total; i++) {
    back.push([lat, lng]);
    heading += (rnd() - 0.5) * 0.7;
    const step = 0.0016 + rnd() * 0.0022;
    lat -= Math.sin(heading) * step;
    lng -= Math.cos(heading) * step * 1.25;
  }
  back.reverse();

  const points = [];
  const legs = [];
  let n = 0;
  legsIn.forEach(p => {
    const from = n;
    for (let i = 0; i < p.pts; i++, n++) {
      points.push({ lat: back[n][0], lng: back[n][1], phase: p.key, css: p.css, token: p.token, idx: n });
    }
    legs.push({ phase: p.key, css: p.css, from: from, to: n - 1 });
  });
  return { points: points, legs: legs };
}

/* ── 2. State ─────────────────────────────────────────────────────────────── */
let tkmMap = null, tkmLayer = null, tkmHead = null, tkmLine = null;
let tkmData = null, tkmTicket = null;
let tkmShown = 0;              /* how many breadcrumbs are revealed */
let tkmTimer = null;

function tkmIsPlaying() { return tkmTimer !== null; }

/* ── 3. Rendering ─────────────────────────────────────────────────────────── */

function tkmCardHTML(t) {
  const row = (k, v) => '<div class="tkm-row"><span class="tkm-k">' + k + '</span><span class="tkm-v">' + v + '</span></div>';
  return '' +
    '<button class="tkm-card-head" onclick="tkmCardToggle()">' +
      '<div class="tkm-card-title">Truck ' + t.truck + '</div>' +
      '<span class="tkm-card-time" id="tkm-time">' + (t.date || '').replace(/^Today,\s*/, '') + '</span>' +
      '<svg class="tkm-card-chev" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5l5 5 5-5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>' +
    '</button>' +
    '<div class="tkm-card-pill">' + tkPhasePill(t.phase) + '</div>' +
    '<div class="tkm-rows">' +
      row('Slump', t.slump) +
      row('Targeted slump', '8.00 in') +
      row('Water added', t.water || '—') +
      row('Admix added', '12 yd\u00b3') +
      row('Load size', t.size) +
    '</div>' +
    '<div class="tkm-card-foot">' +
      '<button class="tkm-replay" id="tkm-replay" onclick="tkmReplayToggle()">' +
        '<svg id="tkm-replay-icon" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 1.5l8 4.5-8 4.5V1.5z" fill="currentColor"/></svg>' +
        '<span id="tkm-replay-label">Replay</span>' +
      '</button>' +
      '<div class="tkm-steps">' +
        '<button class="dc-map-ctrl-btn tkm-step" onclick="tkmStep(-1)" title="Previous phase">' +
          '<svg width="10" height="14" viewBox="0 0 10 14" fill="none"><path d="M8 1L2 7l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '<button class="dc-map-ctrl-btn tkm-step" onclick="tkmStep(1)" title="Next phase">' +
          '<svg width="10" height="14" viewBox="0 0 10 14" fill="none"><path d="M2 1l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
      '</div>' +
    '</div>';
}

function tkmLegendHTML(route) {
  return route.legs.map(l =>
    '<button class="tkm-leg" onclick="tkmSeekTo(' + l.to + ')" title="' + l.phase + '">' +
      '<span class="tkm-leg-dot ' + l.css + '"></span>' +
      '<span class="tkm-leg-label">' + l.phase + '</span>' +
    '</button>').join('');
}

function tkmRender() {
  const scroll = document.getElementById('tk-drawer-scroll');
  if (!scroll || !tkCurrentTicket) return;
  if (typeof tkxRescueSummary === 'function') tkxRescueSummary();

  tkmTicket = tkCurrentTicket;
  tkmData = tkmRoute(tkmTicket);
  tkmShown = tkmData.points.length;      /* full trail until Replay is pressed */

  scroll.style.padding = '0';
  scroll.style.overflowX = 'hidden';
  scroll.innerHTML =
    '<div class="tkm-wrap">' +
      '<div class="tkm-leaflet" id="tkm-leaflet"></div>' +
      '<div class="tkm-card" id="tkm-card">' + tkmCardHTML(tkmTicket) + '</div>' +
      '<div class="dc-map-controls tkm-controls">' +
        '<div class="dc-map-ctrl-stack">' +
          '<button class="dc-map-ctrl-btn" onclick="tkmFit()" title="Fit trail">' +
            '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6V3a1 1 0 011-1h3M14 6V3a1 1 0 00-1-1h-3M2 10v3a1 1 0 001 1h3M14 10v3a1 1 0 01-1 1h-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="dc-map-zoom">' +
          '<button class="dc-map-ctrl-btn" onclick="tkmZoom(1)" title="Zoom in"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>' +
          '<button class="dc-map-ctrl-btn" onclick="tkmZoom(-1)" title="Zoom out"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>' +
        '</div>' +
      '</div>' +
      '<div class="tkm-legend">' + tkmLegendHTML(tkmData) + '</div>' +
    '</div>';

  tkmInitMap();
}

/* ── 4. Leaflet ───────────────────────────────────────────────────────────── */

/* Carto's Voyager basemap is the closest match to the Figma, but it now stamps
   "API KEY REQUIRED" across unkeyed tiles, so this uses plain OpenStreetMap.
   Set window.TKM_TILE_URL to point both this and the fleet map at whatever
   provider the team ends up licensing. */
const TKM_TILES = (typeof window !== 'undefined' && window.TKM_TILE_URL) ||
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

function tkmInitMap() {
  const el = document.getElementById('tkm-leaflet');
  if (!el || typeof L === 'undefined') return;
  if (tkmMap) { try { tkmMap.remove(); } catch (e) {} tkmMap = null; }

  const pts = tkmData.points;
  tkmMap = L.map(el, { zoomControl: false, attributionControl: false });
  L.tileLayer(TKM_TILES, { maxZoom: 19 }).addTo(tkmMap);
  tkmLayer = L.layerGroup().addTo(tkmMap);

  tkmLine = L.polyline(pts.map(p => [p.lat, p.lng]), {
    color: '#36322d', weight: 3, opacity: 0.35, lineCap: 'round'
  }).addTo(tkmMap);

  tkmFit();
  tkmPaint();
  /* The tab body is sized by flex, so Leaflet measures 0 on first paint. */
  setTimeout(function () { if (tkmMap) tkmMap.invalidateSize(); }, 60);
}

function tkmPaint() {
  if (!tkmMap || !tkmLayer) return;
  tkmLayer.clearLayers();
  const pts = tkmData.points;
  const upto = Math.max(1, Math.min(tkmShown, pts.length));

  for (let i = 0; i < upto - 1; i++) {
    const p = pts[i];
    tkmLayer.addLayer(L.marker([p.lat, p.lng], {
      interactive: false,
      icon: L.divIcon({
        className: '',
        html: '<span class="tkm-dot ' + p.css + '"></span>',
        iconSize: [10, 10], iconAnchor: [5, 5]
      })
    }));
  }

  const head = pts[upto - 1];
  const mins = Math.max(1, (pts.length - upto) * 3 + 2);
  tkmLayer.addLayer(L.marker([head.lat, head.lng], {
    icon: L.divIcon({
      className: '',
      html: '<span class="dc-map-marker ' + head.css + ' tkm-head">' +
              tkmTicket.truck + ' <span class="tkm-head-sep"></span> ' + head.phase +
              (upto < pts.length ? ' \u00b7 ' + mins + ' min ago' : '') +
            '</span>',
      iconSize: [0, 0], iconAnchor: [0, 34]
    })
  }));

  document.querySelectorAll('.tkm-leg').forEach(function (el, i) {
    const leg = tkmData.legs[i];
    el.classList.toggle('done', leg && leg.from < upto);
    el.classList.toggle('current', leg && leg.from < upto && leg.to >= upto - 1);
  });
}

/* The card and the legend float over the map, so fitting to the raw bounds
   parks part of the trail underneath them — on mobile that hid the very start,
   which is the one thing Replay is meant to show. Measure both and fit into
   what is actually visible. */
function tkmFit() {
  if (!tkmMap || !tkmLine) return;
  const wrap = document.querySelector('#tk-drawer-scroll .tkm-wrap');
  const card = document.getElementById('tkm-card');
  const legend = document.querySelector('#tk-drawer-scroll .tkm-legend');
  let tl = [28, 28], br = [28, 28];

  if (wrap && card) {
    const w = wrap.getBoundingClientRect(), c = card.getBoundingClientRect();
    /* A card pinned to the bottom edge is the mobile sheet; anything else is
       the floating card on the left. */
    if (c.bottom >= w.bottom - 2) br = [br[0], Math.round(c.height) + 24];
    else tl = [Math.round(c.width) + 36, tl[1]];
  }
  if (wrap && legend) {
    const w = wrap.getBoundingClientRect(), g = legend.getBoundingClientRect();
    if (g.top - w.top < w.height / 2) tl = [tl[0], Math.max(tl[1], Math.round(g.height) + 24)];
    else br = [br[0], Math.max(br[1], Math.round(g.height) + 24)];
  }
  tkmMap.fitBounds(tkmLine.getBounds(), {
    paddingTopLeft: tl, paddingBottomRight: br, maxZoom: 15
  });
}

function tkmZoom(d) { if (tkmMap) tkmMap.setZoom(tkmMap.getZoom() + d); }

/* Collapsing the card gives the map back its bottom third on a phone. The
   header and the Replay row stay put; only the readings fold away. Refit
   afterwards so the trail uses the space that just opened up. */
function tkmCardToggle() {
  const card = document.getElementById('tkm-card');
  if (!card) return;
  card.classList.toggle('collapsed');
  setTimeout(function () { if (tkmMap) { tkmMap.invalidateSize(); tkmFit(); } }, 220);
}

/* ── 5. Replay ────────────────────────────────────────────────────────────── */

function tkmSetReplayUI(playing) {
  const label = document.getElementById('tkm-replay-label');
  const icon = document.getElementById('tkm-replay-icon');
  if (label) label.textContent = playing ? 'Pause' : 'Replay';
  if (icon) icon.innerHTML = playing
    ? '<rect x="2.5" y="1.5" width="2.6" height="9" fill="currentColor"/><rect x="7" y="1.5" width="2.6" height="9" fill="currentColor"/>'
    : '<path d="M2.5 1.5l8 4.5-8 4.5V1.5z" fill="currentColor"/>';
}

function tkmStop() {
  if (tkmTimer) { clearInterval(tkmTimer); tkmTimer = null; }
  tkmSetReplayUI(false);
}

function tkmReplayToggle() {
  if (tkmIsPlaying()) { tkmStop(); return; }
  if (!tkmData) return;
  /* Always from the start of the trail — that is what Replay means here. */
  tkmShown = 1;
  tkmPaint();
  tkmSetReplayUI(true);
  tkmTimer = setInterval(function () {
    tkmShown++;
    if (tkmShown >= tkmData.points.length) { tkmShown = tkmData.points.length; tkmPaint(); tkmStop(); return; }
    tkmPaint();
    /* No panning. The fit above already frames the whole trail clear of the
       card, and chasing the head was what pushed the start off screen. */
  }, 420);
}

/* Arrows step phase by phase rather than point by point — a point is a
   breadcrumb, a phase is the thing you actually want to jump between. */
function tkmStep(dir) {
  if (!tkmData) return;
  tkmStop();
  const legs = tkmData.legs;
  let i = legs.findIndex(l => l.to >= tkmShown - 1);
  if (i < 0) i = legs.length - 1;
  i = Math.max(0, Math.min(legs.length - 1, i + dir));
  tkmSeekTo(legs[i].to);
}

function tkmSeekTo(idx) {
  if (!tkmData) return;
  tkmStop();
  tkmShown = Math.max(1, Math.min(idx + 1, tkmData.points.length));
  tkmPaint();
}

/* ══ 7. Manual control tab ═════════════════════════════════════════════════
   Add Water and Add Admix behaving exactly as they do in the All Trucks
   drawer, plus a Ticket Adjustment Log. "Exactly" is literal: the cards are
   single-instance CardInstance objects built by app-02's initMcCards(), so
   the real nodes are borrowed into this panel and returned by tkdLeave() and
   tkCloseDrawer(). mcCommandLog is shared: one truck, one command, logged
   once. Both panels carry .mc-scope so styles.css can mirror the rules. */

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

/* ══ 8. Ticketed Slump override tab ════════════════════════════════════════
   Not the Hub's four-step wizard. Opening from a ticket already answers
   order, location and mix code, so this is one screen, three zones: Applies
   to (read-only, off the ticket, with an Edit scope escape hatch), the rule
   (three-way segmented type, stepper value in 0.25 in increments), and the
   live Result (ticketed target -> resulting target), which is the part the
   Hub never shows and the reason a dispatcher hesitates. Out-of-range results
   warn inline against the plant spill limit instead of failing on save. */

var SO_TYPES = [
  { v:'add',     label:'Add or subtract', hint:'Shift the ticketed target up or down',
    field:'Add / subtract from target slump', unit:'in', step:0.25 },
  { v:'target',  label:'New target',      hint:'Replace the ticketed target outright',
    field:'New target slump', unit:'in', step:0.25 },
  { v:'measure', label:'Do not measure',  hint:'Stop slump management for this load', field:null }
];

var SO_MIXERS = ['McNeilus','London','Beck Industrial','Con-Tech','Terex','Oshkosh S-Series','Liebherr'];
var SO_MIXES = [
  { v:'3000-STD', label:'3000-STD \u2014 Standard 3000 PSI' },
  { v:'4000-HE',  label:'4000-HE \u2014 High Early Strength' },
  { v:'4500-AE',  label:'4500-AE \u2014 Air Entrained 4500 PSI' },
  { v:'5000-HS',  label:'5000-HS \u2014 High Strength' },
  { v:'3500-FLY', label:'3500-FLY \u2014 Fly Ash Blend' },
  { v:'6000-SF',  label:'6000-SF \u2014 Silica Fume Mix' },
  { v:'2500-LW',  label:'2500-LW \u2014 Lightweight Aggregate' }
];

/* Plant spill limit: the ceiling a resulting target must stay under. Mirrors
   the profile set on the plant in Account management. */
var SO_MAX_SLUMP = 8.0, SO_MIN_SLUMP = 1.0;

var soState = { type:null, value:'', active:true, show:true, scope:false, saved:{} };

function soEsc(s) { return (typeof dbEsc === 'function') ? dbEsc(s) : String(s == null ? '' : s); }

function soTicket() {
  if (typeof tkCurrentTicket !== 'undefined' && tkCurrentTicket) return tkCurrentTicket;
  var d = (typeof TK_DATA !== 'undefined') ? TK_DATA : [];
  return d[0] || {};
}

/* Ticketed target, in inches, from the ticket's own slump string. */
function soTarget() {
  var t = soTicket();
  var n = parseFloat(String(t.slump || '4.0').replace(/[^\d.]/g, ''));
  return isFinite(n) ? n : 4.0;
}

function soType() { return SO_TYPES.filter(function (x) { return x.v === soState.type; })[0] || null; }

function soResult() {
  var base = soTarget(), ty = soType();
  if (!ty) return { text:'\u2014', n:null };
  if (ty.v === 'measure') return { text:'Not managed', n:null, muted:true };
  var v = parseFloat(soState.value);
  if (!isFinite(v)) return { text:'\u2014', n:null };
  var n = (ty.v === 'add') ? base + v : v;
  return { text:n.toFixed(2) + ' in', n:n };
}

function soKey() { var t = soTicket(); return t.ticket || 'ticket'; }
function soList() { if (!soState.saved[soKey()]) soState.saved[soKey()] = []; return soState.saved[soKey()]; }

/* ── Interactions ─────────────────────────────────────────────────────────── */

function soPickType(v) {
  soState.type = v;
  if (v === 'measure') soState.value = '';
  soRender();
}

function soSetValue(v) { soState.value = v; soRefreshResult(); }

function soStep(dir) {
  var ty = soType(); if (!ty || !ty.step) return;
  var base = (ty.v === 'target') ? soTarget() : 0;
  var cur = parseFloat(soState.value);
  if (!isFinite(cur)) cur = base;
  soState.value = (cur + dir * ty.step).toFixed(2);
  var inp = document.getElementById('so-value');
  if (inp) inp.value = soState.value;
  soRefreshResult();
}

function soToggle(k) {
  soState[k] = !soState[k];
  var el = document.getElementById('so-sw-' + k);
  if (el) el.classList.toggle('on', soState[k]);
}

function soScope() { soState.scope = !soState.scope; soRender(); }

function soRefreshResult() {
  var el = document.getElementById('so-result');
  if (el) el.innerHTML = soResultHtml();
}

function soApply() {
  var ty = soType();
  if (!ty) { amToast('Pick an override type first'); return; }
  var r = soResult();
  if (ty.field && !isFinite(parseFloat(soState.value))) { amToast('Enter a ' + ty.field.toLowerCase()); return; }
  if (r.n !== null && (r.n > SO_MAX_SLUMP || r.n < SO_MIN_SLUMP)) {
    amToast('Resulting target is outside the plant spill limit'); return;
  }
  var t = soTicket();
  soList().unshift({
    type:ty.label, detail: ty.v === 'measure' ? 'Slump not managed' : (ty.v === 'add'
      ? (parseFloat(soState.value) >= 0 ? '+' : '') + parseFloat(soState.value).toFixed(2) + ' in \u2192 ' + r.text
      : 'Target set to ' + r.text),
    active: soState.active, show: soState.show,
    scope: soState.scope ? 'Plant + mix code' : 'This ticket only',
    when: new Date().toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })
  });
  soState.type = null; soState.value = '';
  soRender();
  amToast('Override applied to ' + (t.ticket || 'ticket'));
}

function soRemove(i) { soList().splice(i, 1); soRender(); amToast('Override removed'); }

function soReset() { soState.type = null; soState.value = ''; soState.scope = false; soRender(); }

/* ── Render ───────────────────────────────────────────────────────────────── */

function soSwitch(k, label, onLabel, offLabel) {
  return '<div class="so-sw-row"><div class="so-sw-l">' + label + '</div>'
    + '<div class="so-sw-wrap"><span class="so-sw-t">' + (soState[k] ? onLabel : offLabel) + '</span>'
    + '<button class="pf-switch' + (soState[k] ? ' on' : '') + '" id="so-sw-' + k + '" onclick="soToggle(\'' + k + '\')"><span class="pf-knob"></span></button></div></div>';
}

function soResultHtml() {
  var ty = soType(), r = soResult();
  var out = r.n !== null && (r.n > SO_MAX_SLUMP || r.n < SO_MIN_SLUMP);
  return '<div class="so-res">'
    + '<div class="so-res-cell"><div class="so-res-l">Ticketed target</div><div class="so-res-v">' + soTarget().toFixed(2) + ' in</div></div>'
    + '<div class="so-res-arrow"><svg width="20" height="14" viewBox="0 0 20 14" fill="none"><path d="M1 7h17M13 2l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
    + '<div class="so-res-cell"><div class="so-res-l">' + (ty && ty.v === 'measure' ? 'Slump management' : 'Resulting target') + '</div>'
      + '<div class="so-res-v' + (out ? ' so-bad' : (r.muted ? ' so-muted' : ' so-ok')) + '">' + r.text + '</div></div>'
    + '</div>'
    + (out ? '<div class="so-warn"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.6 15 14H1L8 1.6z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6v3.4M8 11.4h.01" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'
        + 'Outside the plant spill limit of ' + SO_MIN_SLUMP.toFixed(1) + '\u2013' + SO_MAX_SLUMP.toFixed(1) + ' in. Adjust before applying.</div>' : '')
    + (ty && ty.v === 'measure' ? '<div class="so-note-line">The drum keeps mixing; Verifi stops adding water and stops reporting slump for this load.</div>' : '');
}

function soHtml() {
  var t = soTicket(), ty = soType();
  var scopeRows = [
    ['Order number', t.order || '\u2014'], ['Ticket', t.ticket || '\u2014'],
    ['Truck', t.truck || '\u2014'], ['Plant', t.location || t.plant || '\u2014'],
    ['Mix code', t.mix || '\u2014'], ['Override date', 'Today (US/Arizona)']
  ];

  var html = '<div class="so-wrap">';

  /* 1. Applies to */
  html += '<div class="so-card"><div class="so-card-head"><div><div class="so-h">Applies to</div>'
    + '<div class="so-sub">Taken from this ticket. Nothing to pick.</div></div>'
    + '<button class="am-link" onclick="soScope()">' + (soState.scope ? 'Use ticket scope' : 'Edit scope') + '</button></div>'
    + '<div class="so-scope">' + scopeRows.map(function (r) {
        return '<div class="so-scope-cell"><div class="so-scope-l">' + r[0] + '</div><div class="so-scope-v">' + soEsc(r[1]) + '</div></div>';
      }).join('') + '</div>';

  if (soState.scope) {
    html += '<div class="so-wide"><div class="so-wide-t">Widen the rule beyond this load</div>'
      + '<div class="so-grid2">'
        + '<div class="so-field"><label class="am-flabel">Override location</label>'
          + vfDd({ id:'so-dd-loc', options:(typeof AM_PLANT_NAMES !== 'undefined' ? AM_PLANT_NAMES : [t.location || 'Phoenix Central']), value:(t.location || null), placeholder:'Select a plant location' }) + '</div>'
        + '<div class="so-field"><label class="am-flabel">Override mix code</label>'
          + vfDd({ id:'so-dd-mix', options:SO_MIXES, value:null, placeholder:'Select a mix code' }) + '</div>'
        + '<div class="so-field"><label class="am-flabel">Mixer type</label>'
          + vfDd({ id:'so-dd-mixer', options:SO_MIXERS, value:null, placeholder:'Select mixer type', search:false }) + '</div>'
        + '<div class="so-field"><label class="am-flabel">Truck</label>'
          + vfDd({ id:'so-dd-truck', options:(typeof trucks !== 'undefined' ? trucks.map(function (x) { return x.num; }) : [t.truck]), value:(t.truck || null), placeholder:'Select truck' }) + '</div>'
      + '</div></div>';
  }
  html += '</div>';

  /* 2. The rule */
  html += '<div class="so-card"><div class="so-h">Override type</div>'
    + '<div class="so-seg">' + SO_TYPES.map(function (x) {
        return '<button class="so-seg-btn' + (soState.type === x.v ? ' on' : '') + '" onclick="soPickType(\'' + x.v + '\')">'
          + '<span class="so-seg-l">' + x.label + '</span><span class="so-seg-h">' + x.hint + '</span></button>';
      }).join('') + '</div>';

  if (ty && ty.field) {
    var ph = (ty.v === 'add') ? 'e.g. -0.50' : soTarget().toFixed(2);
    html += '<div class="so-field so-value-field"><label class="am-flabel">' + ty.field + ' (' + ty.unit + ')</label>'
      + '<div class="so-stepper"><button onclick="soStep(-1)" title="Down">\u2212</button>'
      + '<input id="so-value" class="am-input" type="number" step="' + ty.step + '" inputmode="decimal" placeholder="' + ph + '" value="' + soEsc(soState.value) + '" oninput="soSetValue(this.value)">'
      + '<button onclick="soStep(1)" title="Up">+</button></div>'
      + '<div class="so-hint">Steps of ' + ty.step + ' in. ' + (ty.v === 'add' ? 'Negative values make the load drier.' : 'Must stay inside the plant spill limit.') + '</div></div>';
  }

  html += '<div id="so-result" class="so-result-box">' + soResultHtml() + '</div>'
    + soSwitch('active', 'Rule status', 'Active', 'Inactive')
    + soSwitch('show', 'External slump display', 'Show slump', 'Hide slump')
    + '</div>';

  /* 3. Existing overrides */
  var list = soList();
  html += '<div class="so-card"><div class="so-h">Overrides on this order'
    + (list.length ? '<span class="so-count">' + list.length + '</span>' : '') + '</div>';
  if (!list.length) {
    html += '<div class="so-empty">No overrides yet. The load runs on its ticketed target of ' + soTarget().toFixed(2) + ' in.</div>';
  } else {
    html += '<div class="so-list">' + list.map(function (o, i) {
      return '<div class="so-item"><div class="so-item-main"><div class="so-item-t">' + o.type
        + (o.active ? amTag('Active') : amTag('Inactive', 'warning')) + '</div>'
        + '<div class="so-item-d">' + o.detail + '</div>'
        + '<div class="so-item-m">' + o.scope + ' \u00b7 ' + (o.show ? 'Slump shown' : 'Slump hidden') + ' \u00b7 ' + o.when + '</div></div>'
        + '<button class="am-link" onclick="soRemove(' + i + ')">Remove</button></div>';
    }).join('') + '</div>';
  }
  html += '</div></div>';

  /* Sticky footer so Apply is always reachable */
  html += '<div class="so-foot"><button class="am-pill so-foot-btn" onclick="soReset()">Reset</button>'
    + '<button class="am-primary so-foot-btn" onclick="soApply()">Apply override</button></div>';

  return html;
}

function soRender() {
  var scroll = document.getElementById('tk-drawer-scroll');
  if (!scroll) return;
  scroll.innerHTML = soHtml();
}
