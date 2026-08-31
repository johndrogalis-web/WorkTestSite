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


/* ══ 4. Mobile ticket drawer ═══════════════════════════════════════════════
   The shared #dt-ticket-drawer is a two-pane desktop layout: tab content on
   the left, a permanent summary panel on the right. Neither device frame has
   the width for that split.

   Both All Trucks device drawers solve it the same way — one pane, and the
   summary is simply the last block in the scroll. On mobile that is
   .co-info-block at the bottom of #co-scroll; on tablet #tb-drawer is a single
   #tb-drawer-scroll with the info table inside the Overview tab. So we do the
   same here on both: #tk-side-body is moved into #tk-drawer-scroll after each
   tab render and sits under the tab content in one continuous scroll.

   The move has to be undone before app-01's tkTab() runs, because that
   function assigns scroll.innerHTML and would destroy the node, after which
   tkBuildSidePanel() would find nothing to fill. So: rescue out, let app-01
   render, dock back in. */

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
const TKX_NO_SUMMARY_TABS = ['messaging'];

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

const tkxOrigTab = (typeof tkTab === 'function') ? tkTab : null;
window.tkTab = function (el, tab) {
  tkxRescueSummary();
  const r = tkxOrigTab ? tkxOrigTab.apply(this, arguments) : undefined;
  tkxDockSummary(tab);
  return r;
};

/* Same rescue before app-01 refills the panel on open. tkOpenDrawer() ends by
   calling tkTab(), so docking happens on its way through the wrapper above. */
const tkxOrigOpen = (typeof tkOpenDrawer === 'function') ? tkOpenDrawer : null;
window.tkOpenDrawer = function (idx) {
  tkxRescueSummary();
  if (tkxOrigOpen) return tkxOrigOpen.apply(this, arguments);
};


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


/* ── Drag-to-scroll for the status table ────────────────────────────────────
   On a real tablet the browser handles this: touch-action:pan-x plus native
   momentum scrolling. But the prototype runs inside a desktop browser with the
   tablet as a fixed-size div, so a finger is a mouse and there is nothing to
   flick. This adds pointer dragging on top, which makes the table grabbable in
   the prototype and is skipped on genuine touch input so it never fights the
   browser's own inertia.

   Bound once at the document level rather than per-render, because
   tkRenderStatus() replaces the whole subtree on every group collapse. */

let tksDragEl = null, tksDragX = 0, tksDragLeft = 0, tksDragMoved = false, tksSwallowClick = false;

function tksInstallDragScroll() {
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') return;          /* let the device scroll it */
    const el = e.target.closest && e.target.closest('.tks-scroll-x');
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
      /* A drag that ends over a phase header shouldn't also collapse it. */
      tksSwallowClick = true;
      setTimeout(function () { tksSwallowClick = false; }, 0);
    }
    tksDragEl = null;
  }
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  document.addEventListener('click', function (e) {
    if (!tksSwallowClick) return;
    if (e.target.closest && e.target.closest('.tks-scroll-x')) {
      e.stopPropagation(); e.preventDefault();
    }
  }, true);
}

window.tkRenderStatus = function (t) {
  const scroll = document.getElementById('tk-drawer-scroll');
  if (!scroll) return;
  /* This function assigns scroll.innerHTML, and on mobile/tablet the summary
     panel is parked inside that scroll. Collapsing a phase group or expanding
     a row calls straight back in here, so without this rescue the panel would
     be destroyed on the first toggle and never rebuilt — tkBuildSidePanel()
     would find nothing to fill on every subsequent open. */
  tkxRescueSummary();
  scroll.style.overflowX = 'hidden';   /* the grid fits; nothing to scroll across */

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
    '<div class="tks-scroll-x"><div class="tks-tbl">' + head + body + '</div></div>' +
    tksCards();
  tkxDockSummary('status');            /* and put the panel back underneath */
};

/* ── 6. Init ──────────────────────────────────────────────────────────────── */
function mtkInit() {
  if (typeof TK_DATA === 'undefined') return;
  tksInstallDragScroll();
  mtkRender();
  ttkRender();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mtkInit);
else mtkInit();
