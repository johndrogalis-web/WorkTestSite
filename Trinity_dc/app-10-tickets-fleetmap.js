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
}

/* Leaving Tickets: drop the inline display so app-06 owns these again. */
function tkPagesRelease() {
  TK_PAGES.forEach(function (p) {
    const el = document.getElementById(p);
    if (el) el.style.display = '';
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
