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
