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
