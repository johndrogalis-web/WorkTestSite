/* ============================================================================
   app-09-ticket-map.js
   TICKET DRAWER — MAP TAB
   ----------------------------------------------------------------------------
   Two jobs, per the Figma (Trinity Design Overview, node 2651:104717):

     1. Show where the truck is right now.
     2. Replay the run from the start of the trail, dropping breadcrumb dots
        coloured by the phase the truck was in at that point — the same phases,
        and the same --phase-* tokens, the Status tab groups its readings by.

   The trail is the link between the two tabs. A dot on the map and a group
   header in the Status table are the same phase in the same colour, so the
   map answers "where was it when the slump went out of spec".

   Built on the existing map vocabulary rather than a new one: Leaflet in a
   .dc-map-area-style container, .dc-map-ctrl-btn controls, phase colours from
   shared.css. Everything else is tkm-.

   Load order: after app-01 (tkTab, TK_DATA) and app-08 (the drawer's tab
   wrapper and summary docking).
   ========================================================================== */

/* The map fills the tab body, so the summary panel does not dock under it on
   mobile/tablet the way it does on Status. TKX_NO_SUMMARY_TABS is app-08's. */
if (typeof TKX_NO_SUMMARY_TABS !== 'undefined') TKX_NO_SUMMARY_TABS.push('map');

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

/* ── 6. Wiring ────────────────────────────────────────────────────────────── */

const tkmOrigTab = (typeof tkTab === 'function') ? tkTab : null;
window.tkTab = function (el, tab) {
  const scroll = document.getElementById('tk-drawer-scroll');
  if (tab !== 'map') {
    tkmStop();
    if (tkmMap) { try { tkmMap.remove(); } catch (e) {} tkmMap = null; }
    if (scroll) scroll.style.padding = '';
  }
  const r = tkmOrigTab ? tkmOrigTab.apply(this, arguments) : undefined;
  if (tab === 'map') tkmRender();
  return r;
};

/* Closing the drawer kills the animation and releases the Leaflet instance. */
const tkmOrigClose = (typeof tkCloseDrawer === 'function') ? tkCloseDrawer : null;
window.tkCloseDrawer = function () {
  tkmStop();
  if (tkmMap) { try { tkmMap.remove(); } catch (e) {} tkmMap = null; }
  const scroll = document.getElementById('tk-drawer-scroll');
  if (scroll) scroll.style.padding = '';
  if (tkmOrigClose) return tkmOrigClose.apply(this, arguments);
};
