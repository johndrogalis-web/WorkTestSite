/* ============================================================================
   app-13-dashboard.js
   DASHBOARDS — customizable landing page (desktop + tablet + mobile)
   ----------------------------------------------------------------------------
   One dashboard system, several saved views. The layout is two zones (a top
   strip and "Your workspace"), each a list of rows, each row 1-4 widget ids.
   A row of 1 renders the widget full width, 2 renders halves, 3-4 quarters.
   Each widget declares how it renders at each size, so dropping a widget into
   a fuller row automatically shifts it down to its smaller form — the split-
   on-drop behaviour from the design.

   Editing is desktop-only (matching the mocks: no Setup page on the frames).
   "Setup page" enters edit mode: both zones highlight, every card gets a drag
   handle and a remove button, and the Widgets library slides in on the right.
   Drop between rows (blue rule) inserts a full-width row; drop ON a card
   (blue outline) splits its row. Save persists to localStorage; Cancel
   reverts; Restore defaults reloads the Dispatch preset.

   The device frames render whatever was saved, flattened: small widgets go
   2-up, large ones full width in their smallest variant. No editing there.

   Contract with the suite
     - Owns nothing outside #dt-page-dashboard / #tb-page-dashboard /
       #mob-page-dashboard and the db- namespace.
     - Wraps dtNavGo (desktop), tbNavSetActive + ttkOpen (tablet), and
       mtkOpen / mobSwuOpen / goToAllTrucks / snGoMap (mobile) rather than
       editing earlier files, same composition pattern as app-08/10/12.
     - Reads trucks[], TK_DATA, dcMapTrucks(), tkPhasePill() where available;
       degrades to fabricated-but-stable values where the suite has no data.
     - Zero CSS here; it all lives in styles.css under "DASHBOARDS".

   Load order: last of the app-* files (after app-12).
   ========================================================================== */

/* ── 0. Small helpers ─────────────────────────────────────────────────────── */

function dbEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* Stable per-string hash so fabricated numbers survive rerenders. */
function dbHash(s) {
  var h = 0; s = String(s);
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
  return h;
}

function dbGreeting() {
  var h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/* Phase label → css token suffix. Reuses app-10's map when present. */
var DB_PHASE_CSS = (typeof TF_PHASE_CSS !== 'undefined') ? TF_PHASE_CSS : {
  'Waiting to Load':'waiting-to-load','Loading':'loading','Loaded':'loaded',
  'In Transit':'to-job','On Site':'on-site','Pouring':'pouring',
  'Washing':'washing','Return to Plant':'return-to-plant','Ignition Off':'ignition-off'
};

function dbPhasePill(phase) {
  if (typeof tkPhasePill === 'function') return tkPhasePill(phase);
  var css = DB_PHASE_CSS[phase] || 'ignition-off';
  return '<span class="db-phase-pill" style="background:var(--phase-' + css + ')">' + dbEsc(phase) + '</span>';
}

function dbErrChip(n)  { return n ? '<span class="db-chip-err">' + n + '</span>' : ''; }
function dbWrnChip(n)  { return n ? '<span class="db-chip-wrn">' + n + '</span>' : ''; }

/* ── 1. Data adapters ─────────────────────────────────────────────────────── */

function dbTickets() { return (typeof TK_DATA !== 'undefined') ? TK_DATA : []; }
function dbTrucks()  { return (typeof trucks  !== 'undefined') ? trucks  : []; }

/* Ticket phase counts in lifecycle order. */
var DB_PHASE_ORDER = ['Waiting to Load','Loading','Loaded','In Transit','On Site','Pouring','Washing','Return to Plant'];
function dbPhaseCounts() {
  var c = {};
  dbTickets().forEach(function (t) { c[t.phase] = (c[t.phase] || 0) + 1; });
  return DB_PHASE_ORDER.map(function (p) { return { phase: p, n: c[p] || 0 }; });
}

/* Fabricated-but-stable ETA per truck. */
function dbEta(num)  { return (12 + dbHash('eta' + num) % 48) + ' min'; }
function dbPour(num) { return (5 + dbHash('pr' + num) % 4) + 'm ' + (10 + dbHash('ps' + num) % 50) + 's'; }

/* Trucks by issue count, worst first. */
function dbCondRows(n) {
  return dbTrucks().slice()
    .filter(function (t) { return (t.err || 0) + (t.wrn || 0) > 0; })
    .sort(function (a, b) { return ((b.err||0)*10 + (b.wrn||0)) - ((a.err||0)*10 + (a.wrn||0)); })
    .slice(0, n || 5);
}

function dbDrivers() {
  return dbTrucks().filter(function (t) { return !!t.driver; });
}

var DB_CONTRACTORS = ['Pegasus Construction','Hacklin Inc','Acme Association','Treetops AB','Highlander'];
var DB_NOTES = [
  'Manual test differs from Verifi reading by more than the allowed tolerance for Ticket 14283.',
  'New monthly Plant efficiency report ready for review. All time high efficiency at 89%.'
];

/* ── 2. SVG builders (tokens only) ───────────────────────────────────────── */

function dbSvgLine(data, W, H, min, max, dashed) {
  var PAD = { t:8, r:8, b:18, l:34 };
  var cW = W - PAD.l - PAD.r, cH = H - PAD.t - PAD.b, N = data.length;
  var toX = function (i) { return PAD.l + (i / (N - 1)) * cW; };
  var toY = function (v) { return PAD.t + cH - ((v - min) / (max - min)) * cH; };
  function path(arr) {
    return arr.map(function (v, i) {
      if (i === 0) return 'M' + toX(0).toFixed(1) + ',' + toY(v).toFixed(1);
      var cx = ((toX(i - 1) + toX(i)) / 2).toFixed(1);
      return 'C' + cx + ',' + toY(arr[i-1]).toFixed(1) + ' ' + cx + ',' + toY(v).toFixed(1) + ' ' + toX(i).toFixed(1) + ',' + toY(v).toFixed(1);
    }).join(' ');
  }
  var grid = [min, (min + max) / 2, max].map(function (v) {
    var gy = toY(v).toFixed(1);
    return '<line x1="' + PAD.l + '" y1="' + gy + '" x2="' + (PAD.l + cW) + '" y2="' + gy + '" stroke="var(--border)" stroke-width="1"/>'
      + '<text x="' + (PAD.l - 5) + '" y="' + (parseFloat(gy) + 3) + '" text-anchor="end" class="db-svg-lbl">' + Math.round(v) + '</text>';
  }).join('');
  var labels = ['Jan 7','Jan 8','Jan 9','Jan 10','Jan 11','Yesterday','Today'];
  var xl = labels.map(function (m, i) {
    return '<text x="' + (PAD.l + (i / (labels.length - 1)) * cW).toFixed(1) + '" y="' + (H - 4) + '" text-anchor="middle" class="db-svg-lbl">' + m + '</text>';
  }).join('');
  var second = data.map(function (v, i) { return Math.round(v * 0.78 + (dbHash('l' + i) % 20)); });
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" class="db-svg">' + grid
    + '<path d="' + path(data) + '" stroke="var(--blue)" stroke-width="2" fill="none" stroke-linecap="round"/>'
    + (dashed ? '<path d="' + path(second) + '" stroke="var(--blue)" stroke-width="1.6" fill="none" stroke-dasharray="4 4" opacity="0.55"/>' : '')
    + xl + '</svg>';
}

/* Slump histogram: center buckets solid, tails tinted, mock shape. */
var DB_HISTO = [40, 230, 580, 810, 1090, 580, 530, 740, 290, 130, 60];
function dbSvgHisto(H, withAxis) {
  var W = 700, PAD = { t:6, r:8, b: withAxis ? 34 : 4, l: withAxis ? 40 : 4 };
  var cW = W - PAD.l - PAD.r, cH = H - PAD.t - PAD.b;
  var max = 2000, bw = cW / DB_HISTO.length;
  var bars = DB_HISTO.map(function (v, i) {
    var h = (v / max) * cH, solid = (i >= 3 && i <= 7 && i !== 5 && i !== 8);
    var inRange = (i >= 3 && i <= 7);
    return '<rect x="' + (PAD.l + i * bw + bw * 0.08).toFixed(1) + '" y="' + (PAD.t + cH - h).toFixed(1)
      + '" width="' + (bw * 0.84).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="3" fill="var(--blue)" opacity="' + (inRange ? '1' : '0.25') + '"/>';
  }).join('');
  var axis = '';
  if (withAxis) {
    axis = [0, 500, 1000, 1500, 2000].map(function (v) {
      var gy = (PAD.t + cH - (v / max) * cH).toFixed(1);
      return '<line x1="' + PAD.l + '" y1="' + gy + '" x2="' + (PAD.l + cW) + '" y2="' + gy + '" stroke="var(--border)"/>'
        + '<text x="' + (PAD.l - 6) + '" y="' + (parseFloat(gy) + 3) + '" text-anchor="end" class="db-svg-lbl">' + v + '</text>';
    }).join('');
    for (var i = 0; i < 11; i++) {
      axis += '<text x="' + (PAD.l + i * bw + bw / 2).toFixed(1) + '" y="' + (H - 18) + '" text-anchor="middle" class="db-svg-lbl">' + (i - 5) + '</text>';
    }
    axis += '<text x="' + (PAD.l + cW / 2) + '" y="' + (H - 4) + '" text-anchor="middle" class="db-svg-lbl">Initial slump vs target (Inches)</text>';
  }
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" class="db-svg">' + axis + bars + '</svg>';
}

/* Grouped bars per plant (Batch scorecard). */
function dbSvgScorecard(H) {
  var W = 900, PAD = { t:6, r:8, b:34, l:40 }, cW = W - PAD.l - PAD.r, cH = H - PAD.t - PAD.b;
  var max = 2000, plants = 11, gw = cW / plants, out = '';
  out += [0, 500, 1000, 1500, 2000].map(function (v) {
    var gy = (PAD.t + cH - (v / max) * cH).toFixed(1);
    return '<line x1="' + PAD.l + '" y1="' + gy + '" x2="' + (PAD.l + cW) + '" y2="' + gy + '" stroke="var(--border)"/>'
      + '<text x="' + (PAD.l - 6) + '" y="' + (parseFloat(gy) + 3) + '" text-anchor="end" class="db-svg-lbl">' + v + '</text>';
  }).join('');
  for (var i = 0; i < plants; i++) {
    var a = Math.round(1350 * Math.pow(0.72, i)) + 40;
    var b = Math.round(a * (0.55 + (dbHash('sc' + i) % 30) / 100));
    var ha = (a / max) * cH, hb = (b / max) * cH, x = PAD.l + i * gw;
    out += '<rect x="' + (x + gw * 0.14).toFixed(1) + '" y="' + (PAD.t + cH - ha).toFixed(1) + '" width="' + (gw * 0.3).toFixed(1) + '" height="' + ha.toFixed(1) + '" rx="3" fill="var(--blue)"/>';
    out += '<rect x="' + (x + gw * 0.5).toFixed(1) + '" y="' + (PAD.t + cH - hb).toFixed(1) + '" width="' + (gw * 0.3).toFixed(1) + '" height="' + hb.toFixed(1) + '" rx="3" fill="var(--blue)" opacity="0.45"/>';
    out += '<text x="' + (x + gw / 2).toFixed(1) + '" y="' + (H - 18) + '" text-anchor="middle" class="db-svg-lbl">Plant ' + String.fromCharCode(65 + i) + '</text>';
  }
  out += '<text x="' + (PAD.l + cW / 2) + '" y="' + (H - 4) + '" text-anchor="middle" class="db-svg-lbl">Plant Name</text>';
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" class="db-svg">' + out + '</svg>';
}

/* Abstract geo blot + activity dots (Plant efficiency). */
function dbSvgGeo(H) {
  var W = 640;
  var dots = [[300,150,14],[330,162,7],[360,148,5],[402,168,6],[286,178,5]].map(function (d) {
    return '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="' + d[2] + '" fill="var(--blue)" opacity="0.5"/>';
  }).join('');
  return '<svg viewBox="0 0 ' + W + ' ' + (H || 210) + '" preserveAspectRatio="xMidYMid meet" class="db-svg">'
    + '<path d="M120 90 q60 -46 150 -34 q90 10 150 -6 q80 -20 120 16 q30 30 -6 58 q-40 30 -110 26 q-60 -4 -110 14 q-70 24 -130 -4 q-70 -32 -64 -70 z" fill="none" stroke="var(--border-mid)" stroke-width="1.4"/>'
    + '<path d="M330 176 q30 26 20 52 q-10 22 -34 12 q-22 -10 -14 -38 q6 -20 28 -26 z" fill="none" stroke="var(--border-mid)" stroke-width="1.2"/>'
    + dots + '</svg>';
}

function dbSvgDonut(pct, size) {
  size = size || 120;
  var r = (size - 22) / 2, c = size / 2, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">'
    + '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="var(--border)" stroke-width="13"/>'
    + '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="var(--blue)" stroke-width="13" stroke-linecap="round"'
    + ' stroke-dasharray="' + dash.toFixed(1) + ' ' + (circ - dash).toFixed(1) + '" transform="rotate(-90 ' + c + ' ' + c + ')"/>'
    + '<text x="' + c + '" y="' + (c + 7) + '" text-anchor="middle" class="db-donut-lbl">' + pct + '%</text></svg>';
}

/* Component status dot grids (matrix + timeline). */
function dbDot(kind) {
  if (kind === 'err')  return '<span class="db-dot-badge err"><svg width="9" height="9" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="white" stroke-width="1.1"/><path d="M5 3v2.2M5 6.8h.01" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg></span>';
  if (kind === 'wrn')  return '<span class="db-dot-badge wrn"><svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M5 1.4 9.2 8.6H0.8L5 1.4z" stroke="#36322d" stroke-width="1.1" stroke-linejoin="round"/></svg></span>';
  if (kind === 'off')  return '<span class="db-dot none">&#215;</span>';
  if (kind === 'half') return '<span class="db-dot half"></span>';
  return '<span class="db-dot ' + (kind === 'on' ? 'on' : '') + '"></span>';
}
function dbDotFor(seed) {
  var h = dbHash(seed) % 100;
  if (h < 4)  return dbDot('err');
  if (h < 8)  return dbDot('wrn');
  if (h < 16) return dbDot('off');
  if (h < 24) return dbDot('half');
  if (h < 60) return dbDot('on');
  return dbDot('');
}

/* ── 3. Card chrome ───────────────────────────────────────────────────────── */

function dbIconCal()  { return '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2.5" width="11" height="10" rx="2" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 6h11M4.5 1v3M9.5 1v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>'; }
function dbIconGear() { return '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2" stroke="currentColor" stroke-width="1.2"/><path d="M7 1.5v1.2M7 11.3v1.2M1.5 7h1.2M11.3 7h1.2M3.2 3.2l.85.85M9.95 9.95l.85.85M10.8 3.2l-.85.85M4.05 9.95l-.85.85" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>'; }
function dbIconArrow(){ return '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7h9M7.5 3l4 4-4 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
function dbIconPlus() { return '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>'; }

/* Widget shell. size 'f'|'h'|'q'|'m'. */
function dbCardHtml(def, size, editAttrs) {
  var wide = (size === 'f' || size === 'h');
  var tools = '';
  if (def.tools !== false && size !== 'm') {
    tools += '<button class="db-icon-btn" title="Time range">' + dbIconCal() + '</button>';
    tools += '<button class="db-icon-btn" title="Configure">' + dbIconGear() + '</button>';
  } else if (size === 'm' && def.tools !== false) {
    tools += '<button class="db-icon-btn" title="Configure">' + dbIconGear() + '</button>';
  }
  if (def.go && wide) {
    tools += '<button class="db-go-pill" onclick="dbGo(\'' + def.go.key + '\')">' + dbEsc(def.go.label) + ' ' + dbIconArrow() + '</button>';
  }
  var head = '<div class="db-card-head"><div><div class="db-card-title">' + dbEsc(def.title) + '</div>'
    + (def.sub ? '<div class="db-card-sub">' + dbEsc(def.sub) + '</div>' : '') + '</div>'
    + '<div class="db-card-tools">' + tools + '</div></div>';
  var foot = '';
  if (def.foot !== false) {
    foot = '<div class="db-card-foot"><span>Last updated 1 min ago</span>'
      + '<button class="db-foot-arrow" ' + (def.go ? 'onclick="dbGo(\'' + def.go.key + '\')"' : '') + '>' + dbIconArrow() + '</button></div>';
  }
  return '<div class="db-card db-w-' + def.id + ' db-size-' + size + '"' + (editAttrs || '') + '>'
    + (def.bare ? '' : head)
    + '<div class="db-card-body">' + def.body(size) + '</div>'
    + (def.bare ? '' : foot)
    + '</div>';
}

/* Cross-page nav from a widget (desktop only; inert on frames). */
function dbGo(key) {
  if (!document.body.classList.contains('view-desktop')) return;
  if (typeof dtNavGo === 'function') dtNavGo(key);
}

/* Shared body builders */
function dbKpiBody(value, delta, dir, chips) {
  return '<div class="db-kpi">' + (chips ? '<div class="db-kpi-chips">' + chips + '</div>' : '')
    + '<div class="db-kpi-row"><span class="db-kpi-value">' + value + '</span>'
    + (delta ? '<span class="db-kpi-delta ' + (dir || 'up') + '">' + delta + '</span>' : '') + '</div></div>';
}

function dbTableBody(cols, rows, opts) {
  opts = opts || {};
  var head = '<div class="db-tr db-th">' + cols.map(function (c) { return '<span>' + c + '</span>'; }).join('') + '</div>';
  var body = rows.map(function (r, i) {
    return '<div class="db-tr' + (i % 2 ? ' zebra' : '') + '">' + r.map(function (v) { return '<span>' + v + '</span>'; }).join('') + '</div>';
  }).join('');
  var pag = '';
  if (opts.pag) {
    pag = '<div class="db-pag"><span>1 - ' + rows.length + ' of ' + opts.pag + ' Records</span>'
      + '<span class="db-pag-btns"><button disabled>&#171;</button><button disabled>&#8249;</button><button>&#8250;</button><button>&#187;</button></span></div>';
  }
  return '<div class="db-table db-cols-' + cols.length + '">' + head + body + '</div>' + pag;
}

function dbListBody(rows) {
  return '<div class="db-list">' + rows.map(function (r, i) {
    return '<div class="db-list-row' + (i % 2 ? ' zebra' : '') + '">' + r + '</div>';
  }).join('') + '</div>';
}

/* ── 4. Widget registry ───────────────────────────────────────────────────── */

var DB_CATS = [ { id:'ops', label:'Operations' }, { id:'cond', label:'Condition and specs' }, { id:'qa', label:'Quick actions' } ];

var DB_TP_PHASES = ['Waiting to Load', 'Pouring', 'Return to Plant'];

var DB_WIDGETS = [

  /* ── Operations ── */
  { id:'truck-phases', title:'Truck phases', cat:'ops', w:2, go:{ label:'Go to phases', key:'tphases' },
    body: function (size) {
      var counts = dbPhaseCounts();
      if (size === 'q' || size === 'm') {
        var list = (size === 'm' ? counts.filter(function (c) { return DB_TP_PHASES.indexOf(c.phase) >= 0; }) : counts.filter(function (c) { return c.n > 0; }).slice(0, 6));
        return dbListBody(list.map(function (c) {
          return '<span class="db-legend-dot" style="background:var(--phase-' + (DB_PHASE_CSS[c.phase] || 'ignition-off') + ')"></span>'
            + '<span class="db-grow">' + dbEsc(c.phase) + '</span><span class="db-num">' + c.n + '</span>';
        }));
      }
      /* f / h: configured phase columns with truck tables */
      var tks = dbTickets();
      return '<div class="db-tp-cols">' + DB_TP_PHASES.map(function (p) {
        var rows = tks.filter(function (t) { return t.phase === p; }).slice(0, 9);
        var timeCol = (p === 'Pouring');
        return '<div class="db-tp-col">'
          + '<div class="db-tp-head"><span class="db-legend-dot" style="background:var(--phase-' + (DB_PHASE_CSS[p] || 'ignition-off') + ')"></span>' + dbEsc(p) + '</div>'
          + '<div class="db-tp-count">' + rows.length + '</div>'
          + dbTableBody(['Truck', timeCol ? 'Time' : 'ETA'], rows.map(function (t) {
              return [dbEsc(t.truck), timeCol ? dbPour(t.truck) : dbEta(t.truck)];
            }))
          + '</div>';
      }).join('') + '</div>';
    } },

  { id:'active-tickets', title:'Active tickets', cat:'ops', go:{ label:'Go to tickets', key:'tickets' },
    body: function (size) {
      var tks = dbTickets().slice().sort(function (a, b) {
        return DB_PHASE_ORDER.indexOf(b.phase) - DB_PHASE_ORDER.indexOf(a.phase);
      });
      if (size === 'q' || size === 'm') {
        return dbTableBody(['Truck','Phase','Ticket'], tks.slice(0, 5).map(function (t) {
          return [dbEsc(t.truck), dbPhasePill(t.phase), dbEsc(t.ticket.replace('TKT-', '') + t.truck.slice(0, 2))];
        }));
      }
      var rows = tks.slice(0, 13).map(function (t) {
        var alerts = (t.alerts ? dbErrChip(t.alerts) : '') + (dbHash('w' + t.ticket) % 4 === 0 ? dbWrnChip(1) : '');
        return [dbEsc(t.truck), dbPhasePill(t.phase), dbEsc(t.ticket.replace('TKT-', '') + t.truck.slice(0, 2)), dbEsc(t.customer), alerts || '<span class="db-dim">&mdash;</span>'];
      });
      return dbTableBody(['Truck','Phase','Ticket','Customer','Active alerts'], rows, { pag: 150 });
    } },

  { id:'fleet-map', title:'Fleet map', cat:'ops', bare:true, foot:false, go:{ label:'Go to the map', key:'map' },
    body: function (size) {
      var search = (size === 'f')
        ? '<div class="db-map-search"><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.3"/><path d="M9.5 9.5 12.5 12.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg><span>Ticket, truck, order, mix, plant, etc.</span></div>' : '';
      var pill = (size === 'f' || size === 'h')
        ? '<button class="db-go-pill db-map-pill" onclick="dbGo(\'map\')">Go to the map ' + dbIconArrow() + '</button>'
        : '<button class="db-foot-arrow db-map-pill" onclick="dbGo(\'map\')">' + dbIconArrow() + '</button>';
      return '<div class="db-map-wrap">'
        + '<div class="db-map db-map-mount"></div>'
        + '<div class="db-map-label">Fleet map</div>' + search + pill + '</div>';
    } },

  { id:'active-orders', title:'Active orders', cat:'ops', sub:'Today', go:{ label:'See all orders', key:'tickets' },
    body: function (size) {
      var tks = dbTickets();
      if (size === 'q' || size === 'm') {
        return dbTableBody(['Order ID','Client'], tks.slice(0, 5).map(function (t) {
          return [dbEsc(t.order.replace('ORD-', '') + t.truck.slice(0, 2)), dbEsc(t.customer)];
        }));
      }
      return dbTableBody(['Order ID','Ticket ID','Customer','Mix Code','Water added'], tks.slice(0, 12).map(function (t) {
        var water = (dbHash('wa' + t.ticket) % 3 === 0) ? '<span class="db-dim">&mdash;</span>' : '0.3 gal/yd&sup3;';
        return [dbEsc(t.order.replace('ORD-', '') + t.truck.slice(0, 2)), dbEsc(t.ticket.replace('TKT-1', '')), dbEsc(t.customer), '04-14230-01', water];
      }), { pag: 250 });
    } },

  { id:'top-drivers', title:'Top drivers', cat:'ops', sub:'Today', small:true,
    body: function (size) {
      var d = dbDrivers().slice(0, size === 'm' ? 3 : 5);
      return dbTableBody(['#','Driver','Truck'], d.map(function (t, i) {
        return [String(i + 1), '<span class="db-link">' + dbEsc(t.driver) + '</span>', '<span class="db-link">' + dbEsc(t.num) + '</span>'];
      }));
    } },

  { id:'bottom-drivers', title:'Bottom drivers', cat:'ops', sub:'Today', small:true,
    body: function (size) {
      var all = dbDrivers(); var d = all.slice(-(size === 'm' ? 3 : 5));
      var base = all.length - d.length;
      return dbTableBody(['#','Driver','Truck'], d.map(function (t, i) {
        return [String(base + i + 1 + 8), '<span class="db-link">' + dbEsc(t.driver) + '</span>', '<span class="db-link">' + dbEsc(t.num) + '</span>'];
      }));
    } },

  { id:'top-contractors', title:'Top contractors', cat:'ops', sub:'Today', small:true,
    body: function (size) {
      return dbTableBody(['#','Name'], DB_CONTRACTORS.slice(0, size === 'm' ? 3 : 5).map(function (n, i) {
        return [String(i + 1), '<span class="db-link">' + dbEsc(n) + '</span>'];
      }));
    } },

  { id:'total-loads', title:'Total loads', cat:'ops', sub:'Today', go:{ label:'Plant efficiency report', key:'home' },
    body: function (size) {
      var data = [340, 352, 361, 340, 331, 326, 321, 318, 322, 316, 319, 314, 322, 318, 309];
      var h = (size === 'f' || size === 'h') ? 150 : 90;
      return dbKpiBody('2,004', '-32', 'down') + '<div class="db-chart">' + dbSvgLine(data, 700, h, 0, 400, true) + '</div>';
    } },

  { id:'create-ticket', title:'Create new ticket', cat:'qa', small:true, foot:false, tools:false,
    body: function () { return '<div class="db-qa"><button class="db-qa-btn">' + dbIconPlus() + '</button></div>'; } },

  { id:'new-order', title:'New order', cat:'qa', small:true, foot:false, tools:false,
    body: function () { return '<div class="db-qa"><button class="db-qa-btn">' + dbIconPlus() + '</button></div>'; } },

  { id:'schedule-repair', title:'Schedule repair', cat:'qa', small:true, foot:false, tools:false,
    body: function () { return '<div class="db-qa"><button class="db-qa-btn">' + dbIconPlus() + '</button></div>'; } },

  /* ── Condition and specs ── */
  { id:'recent-notifications', title:'Recent notifications', cat:'cond', small:true,
    body: function (size) {
      if (size === 'm') return dbKpiBody('2', '', '', '<span class="db-live-dot"></span>');
      return '<div class="db-notes">' + DB_NOTES.map(function (n) {
        return '<div class="db-note"><span>' + dbEsc(n) + '</span><span class="db-live-dot"></span></div>';
      }).join('') + '</div>';
    } },

  { id:'component-condition', title:'Component condition', cat:'cond', small:true, go:{ label:'Go to trucks', key:'trucks' },
    body: function (size) {
      if (size === 'm') {
        var total = dbCondRows(99).reduce(function (s, t) { return s + (t.err || 0) + (t.wrn || 0); }, 0);
        return dbKpiBody(String(total), '', '', '<span class="db-live-dot"></span>');
      }
      return dbTableBody(['Truck','Found issues'], dbCondRows(5).map(function (t) {
        return ['<span class="db-link">' + dbEsc(t.num) + '</span>', '<span class="db-chip-row">' + dbErrChip(t.err) + dbWrnChip(t.wrn) + '</span>'];
      }));
    } },

  { id:'alerts-warnings', title:'Alerts and warnings', cat:'cond', small:true,
    body: function (size) {
      if (size === 'q' || size === 'm') return dbKpiBody('2', '', '', dbErrChip(1) + dbWrnChip(1));
      return '<div class="db-al-sub">Most urgent</div>' + dbListBody([0, 1, 2].map(function (i) {
        return (i < 2 ? dbErrChip('!') : dbWrnChip('!')) + '<span class="db-grow db-al-txt">Manual test differs from Verifi reading by more than the allowed tolerance for Ticket 1428' + i + '.</span>';
      }));
    } },

  { id:'software-update', title:'Software update', cat:'cond', small:true, go:{ label:'Go to updates', key:'update' },
    body: function (size) {
      var rows = dbTrucks().slice(0, size === 'm' ? 3 : 5);
      return dbTableBody(['Truck','TC3','Device'], rows.map(function (t) {
        return [dbEsc(t.num), '3.04.028', 'TCG4'];
      }));
    } },

  { id:'slump-at-plant', title:'Slump at plant', cat:'cond', sub:'Today', go:{ label:'See all tickets', key:'tickets' },
    body: function (size) {
      var tks = dbTickets();
      function diff(t) { var d = [(-3), 1, 0.25, (-1), 5][dbHash('df' + t.ticket) % 5]; return (d > 0 ? '' : '') + d.toFixed(2) + ' in'; }
      if (size === 'q' || size === 'm') {
        return dbTableBody(['Ticket ID','Initial Slump','Diff'], tks.slice(0, 5).map(function (t) {
          return [dbEsc(String(dbHash('tk' + t.ticket) + 1676000)), '4.00 in', diff(t)];
        }));
      }
      return dbTableBody(['Ticket ID','Customer','Initial Slump','Slump vs tar...','Left plant slu...','Water added'], tks.slice(0, 12).map(function (t) {
        var left = (dbHash('lp' + t.ticket) % 3 === 0) ? '<span class="db-dim">&mdash;</span>' : ((dbHash('lp2' + t.ticket) % 2) ? '5.00 in' : '6.25');
        var wa = (dbHash('wa2' + t.ticket) % 3 === 0) ? '<span class="db-dim">&mdash;</span>' : '0.3 gal/yd&sup3;';
        return ['<span class="db-link">' + dbEsc(String(dbHash('tk' + t.ticket) + 491000)) + '</span>', dbEsc(t.customer), '4.00 in', diff(t), left, wa];
      }), { pag: 250 });
    } },

  { id:'delivered-on-spec', title:'Delivered on spec', cat:'cond', sub:'Today', small:true,
    body: function (size) {
      return dbKpiBody('64%', '+2%', 'up') + '<div class="db-chart db-chart-mini">' + dbSvgHisto(size === 'm' ? 56 : 72, false) + '</div>';
    } },

  { id:'delivered-within-spec', title:'Delivered within spec', cat:'cond', sub:'Today', go:{ label:'Read report', key:'home' },
    body: function (size) {
      var big = (size === 'f' || size === 'h');
      return '<div class="db-headline">64% within range</div>'
        + '<div class="db-chart">' + dbSvgHisto(big ? 230 : 110, big) + '</div>';
    } },

  { id:'batch-scorecard', title:'Batch scorecard', cat:'cond', sub:'Today', go:{ label:'Read report', key:'home' },
    body: function (size) {
      var big = (size === 'f' || size === 'h');
      return '<div class="db-headline-row"><span class="db-headline">64% within range across all plants</span>'
        + (big ? '<span class="db-headline db-dim2">Plant A leading with X variability</span>' : '') + '</div>'
        + '<div class="db-chart">' + dbSvgScorecard(big ? 240 : 120) + '</div>';
    } },

  { id:'fleet-uptime', title:'Fleet uptime', cat:'cond', sub:'Today', small:true,
    body: function (size) {
      if (size === 'h' || size === 'f') return '<div class="db-donut-wrap">' + dbSvgDonut(80, 128) + '<div class="db-kpi-delta up">+0.53</div></div>';
      return dbKpiBody('80%', '+0.53', 'up');
    } },

  { id:'time-to-discharge', title:'Time to discharge at arrival', cat:'cond', sub:'Today', small:true,
    body: function (size) { return dbKpiBody(size === 'm' ? '17.16' : '17m 16s', '+0.53', 'up'); } },

  { id:'end-load-to-leave', title:'End load to leave plant', cat:'cond', sub:'Today', small:true,
    body: function (size) { return dbKpiBody(size === 'm' ? '9.49' : '9m 49s', '+0.53', 'up'); } },

  { id:'plant-efficiency', title:'Plant efficiency', cat:'cond', sub:'Today', go:{ label:'Plant efficiency report', key:'home' },
    body: function (size) {
      if (size === 'q') return dbKpiBody('88%', '+3%', 'up');
      return '<div class="db-chart">' + dbSvgGeo(size === 'm' ? 170 : 210) + '</div>';
    } },

  { id:'maintenance-required', title:'Maintenance required', cat:'cond', small:true,
    body: function (size) {
      if (size === 'h' || size === 'f') {
        return dbTableBody(['Truck','Found issues'], dbCondRows(3).map(function (t) {
          return [dbEsc(t.num), '<span class="db-chip-row">' + dbErrChip(t.err) + dbWrnChip(t.wrn) + '</span>'];
        }));
      }
      return dbKpiBody('3', '', '', dbWrnChip('!'));
    } },

  { id:'scheduled-maintenance', title:'Scheduled for maintenance', cat:'cond', small:true,
    body: function () { return dbKpiBody('20', '', ''); } },

  { id:'in-maintenance', title:'In maintenance', cat:'cond', small:true,
    body: function () { return dbKpiBody('5', '', ''); } },

  { id:'components-matrix', title:'Components condition', cat:'cond', go:{ label:'Go to Diagnostic Center', key:'trucks' },
    body: function (size) {
      var comps = ['Bus power','Startup','Iox/Robotex','Charge','Discharge','Drum','CWR','WDC'];
      var rows = dbTrucks().slice(0, size === 'm' ? 6 : 10);
      if (size === 'q' || size === 'm') {
        return dbTableBody(['Truck','Sys.','Ignition','Issues'], rows.map(function (t) {
          return [dbEsc(t.num), 'V3', dbEsc(t.ign || 'On'), '<span class="db-chip-row">' + dbErrChip(t.err) + dbWrnChip(t.wrn) + '</span>'];
        }));
      }
      var head = '<div class="db-mx-tr db-mx-th"><span>Truck</span><span>Sys.</span><span>Ignition</span>'
        + comps.map(function (c) { return '<span>' + c + '</span>'; }).join('') + '</div>';
      var body = rows.map(function (t, i) {
        return '<div class="db-mx-tr' + (i % 2 ? ' zebra' : '') + '"><span>' + dbEsc(t.num) + '</span><span>V3</span><span>' + dbEsc(t.ign || 'On') + '</span>'
          + comps.map(function (c) { return '<span>' + dbDotFor('mx' + t.num + c) + '</span>'; }).join('') + '</div>';
      }).join('');
      return '<div class="db-matrix">' + head + body + '</div>'
        + '<div class="db-pag"><span>1 - ' + rows.length + ' of 250 Records</span><span class="db-pag-btns"><button disabled>&#171;</button><button disabled>&#8249;</button><button>&#8250;</button><button>&#187;</button></span></div>';
    } },

  { id:'components-timeline', title:'Components timeline', cat:'cond', foot:false,
    body: function (size) {
      var comps = ['Ignition State','Iox / Robotex','Charge','Discharge','Drum','Internal Display','External Display','Bus power','CWR','WDS'];
      var hours = (size === 'f' || size === 'h') ? 18 : 8;
      var head = '<div class="db-tl-tr db-tl-th"><span></span>';
      for (var h = 0; h < hours; h++) head += '<span>' + (h < 10 ? '0' : '') + h + ':00</span>';
      head += '</div>';
      var body = comps.map(function (c, ci) {
        var out = '<div class="db-tl-tr' + (ci % 2 ? ' zebra' : '') + '"><span class="db-tl-lbl">' + c + '</span>';
        for (var h2 = 0; h2 < hours; h2++) out += '<span>' + dbDotFor('tl' + c + h2) + '</span>';
        return out + '</div>';
      }).join('');
      return '<div class="db-tl-tools"><button class="db-go-pill">Truck 2672 <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></button>'
        + '<button class="db-go-pill" onclick="dbGo(\'trucks\')">Truck details ' + dbIconArrow() + '</button></div>'
        + '<div class="db-timeline">' + head + body + '</div>';
    } }
];

function dbDef(id) {
  for (var i = 0; i < DB_WIDGETS.length; i++) if (DB_WIDGETS[i].id === id) return DB_WIDGETS[i];
  return null;
}

/* ── 5. Layout state ──────────────────────────────────────────────────────── */

var DB_LS_KEY = 'vfDashLayout1';

var DB_PRESETS = {
  dispatch: {
    top:  [['recent-notifications', 'create-ticket']],
    work: [['truck-phases', 'active-tickets'], ['fleet-map']]
  }
};

function dbClone(o) { return JSON.parse(JSON.stringify(o)); }

function dbLoadLayout() {
  try {
    var raw = localStorage.getItem(DB_LS_KEY);
    if (raw) {
      var l = JSON.parse(raw);
      if (l && l.top && l.work) return l;
    }
  } catch (e) { /* private mode etc. — fall through to preset */ }
  return dbClone(DB_PRESETS.dispatch);
}

var dbLayout = dbLoadLayout();          /* live, possibly mid-edit  */
var dbLayoutSaved = dbClone(dbLayout);  /* last committed           */
var dbEdit = false;

function dbPersist() {
  try { localStorage.setItem(DB_LS_KEY, JSON.stringify(dbLayout)); } catch (e) { /* ignore */ }
}

function dbPlacedIds() {
  var ids = {};
  ['top', 'work'].forEach(function (z) {
    dbLayout[z].forEach(function (row) { row.forEach(function (id) { ids[id] = true; }); });
  });
  return ids;
}

/* ── 6. Desktop shell + render ────────────────────────────────────────────── */

var dbDeskBuilt = false;

function dbDeskBuild() {
  var page = document.getElementById('dt-page-dashboard');
  if (!page || dbDeskBuilt) return;
  dbDeskBuilt = true;
  page.innerHTML =
    '<div class="db-scroll" id="db-desk-scroll">'
    + '<div class="db-head">'
      + '<div><div class="db-greet" id="db-greet"></div><div class="db-greet-sub">It\u2019s <b>54\u00b0 F</b> and sunny \u2600</div></div>'
      + '<div class="db-head-actions">'
        + '<button class="db-go-pill" id="db-cancel-btn" style="display:none;" onclick="dbEditCancel()">Cancel</button>'
        + '<button class="db-go-pill" id="db-edit-btn" onclick="dbEditToggle()"><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg> <span id="db-edit-lbl">Setup page</span></button>'
      + '</div>'
    + '</div>'
    + '<div class="db-zone" id="db-zone-top" ondragover="dbZoneTopOver(event)" ondrop="dbTopAppendDrop(event)"></div>'
    + '<div class="db-ws-title">Your workspace</div>'
    + '<div class="db-zone" id="db-zone-work"></div>'
    + '<div style="height:32px;"></div>'
    + '</div>'
    + '<div class="db-library" id="db-library"></div>';
}

function dbRenderDesktop() {
  dbDeskBuild();
  /* Top strip is one horizontal shelf of small cards, never stacked rows. */
  if (dbLayout.top.length > 1) dbLayout.top = [[].concat.apply([], dbLayout.top)];
  var greet = document.getElementById('db-greet');
  if (greet) greet.textContent = dbGreeting() + ' John!';
  dbKillMaps('db-desk-scroll');
  dbRenderZone('top', 'db-zone-top');
  dbRenderZone('work', 'db-zone-work');
  var page = document.getElementById('dt-page-dashboard');
  if (page) page.classList.toggle('db-editing', dbEdit);
  if (dbEdit) dbRenderLibrary();
  dbInitMaps(document.getElementById('db-desk-scroll'), false);
}

function dbRenderZone(zone, mountId) {
  var mount = document.getElementById(mountId);
  if (!mount) return;
  var rows = dbLayout[zone];
  var html = '';

  /* ── Top strip: one wrapping shelf, small cards, max 5 across (CSS) ── */
  if (zone === 'top') {
    var ids = rows.length ? rows[0] : [];
    html += '<div class="db-row db-row-top">';
    ids.forEach(function (id, c) {
      var def = dbDef(id);
      if (!def) return;
      var editAttrs = '';
      if (dbEdit) {
        editAttrs = ' draggable="true" ondragstart="dbDragStart(event,\'mv\',\'top\',0,' + c + ')"'
          + ' ondragover="dbCellOver(event,this)" ondragleave="dbCellLeave(event,this)"'
          + ' ondrop="dbCellDrop(event,\'top\',0,' + c + ')"';
      }
      html += '<div class="db-cell">' + dbCardHtml(def, 'q', editAttrs)
        + (dbEdit ? '<button class="db-remove" title="Remove" onclick="dbRemoveAt(\'top\',0,' + c + ')">&#215;</button>' : '')
        + '</div>';
    });
    /* The slot only appears while the current line has room; past that the
       shelf itself takes the drop, so an orphan square never hangs below. */
    if (dbEdit && (ids.length % 5) !== 0) {
      html += '<div class="db-top-slot" ondragover="dbGapOver(event,this)" ondragleave="dbGapLeave(event,this)" ondrop="dbTopAppendDrop(event)">Drop here</div>';
    }
    html += '</div>';
    if (!ids.length && !dbEdit) html = '';
    mount.innerHTML = html;
    return;
  }

  if (dbEdit) html += dbGapHtml(zone, 0);
  rows.forEach(function (row, r) {
    var size = zone === 'top' ? 'q' : row.length === 1 ? 'f' : row.length === 2 ? 'h' : 'q';
    html += '<div class="db-row' + (zone === 'top' ? ' db-row-top' : '') + '">';
    row.forEach(function (id, c) {
      var def = dbDef(id);
      if (!def) return;
      var w = (row.length === 2 && def.w) ? def.w : 1;
      var editAttrs = '';
      if (dbEdit) {
        editAttrs = ' draggable="true" ondragstart="dbDragStart(event,\'mv\',\'' + zone + '\',' + r + ',' + c + ')"'
          + ' ondragover="dbCellOver(event,this)" ondragleave="dbCellLeave(event,this)"'
          + ' ondrop="dbCellDrop(event,\'' + zone + '\',' + r + ',' + c + ')"';
      }
      html += '<div class="db-cell" style="flex:' + w + ' 1 0;">'
        + dbCardHtml(def, size, editAttrs)
        + (dbEdit ? '<button class="db-remove" title="Remove" onclick="dbRemoveAt(\'' + zone + '\',' + r + ',' + c + ')">&#215;</button>' : '')
        + '</div>';
    });
    html += '</div>';
    if (dbEdit) html += dbGapHtml(zone, r + 1);
  });
  if (!rows.length) {
    html += '<div class="db-empty-zone" ondragover="dbGapOver(event,this)" ondragleave="dbGapLeave(event,this)" ondrop="dbGapDrop(event,\'' + zone + '\',0)">Drag widgets here</div>';
  }
  mount.innerHTML = html;
}

function dbGapHtml(zone, idx) {
  return '<div class="db-gap" ondragover="dbGapOver(event,this)" ondragleave="dbGapLeave(event,this)" ondrop="dbGapDrop(event,\'' + zone + '\',' + idx + ')"></div>';
}

/* ── 7. Edit mode + drag and drop ─────────────────────────────────────────── */

var dbDragPayload = null;   /* {kind:'lib'|'mv', id, zone, r, c} */

function dbEditToggle() {
  if (!dbEdit) {
    dbEdit = true;
    dbLayoutSaved = dbClone(dbLayout);
    document.getElementById('db-edit-lbl').textContent = 'Save changes';
    document.getElementById('db-cancel-btn').style.display = '';
    dbRenderDesktop();
  } else {
    dbEdit = false;
    dbPersist();
    dbLayoutSaved = dbClone(dbLayout);
    document.getElementById('db-edit-lbl').textContent = 'Setup page';
    document.getElementById('db-cancel-btn').style.display = 'none';
    dbRenderDesktop();
  }
}

function dbEditCancel() {
  dbLayout = dbClone(dbLayoutSaved);
  dbEdit = false;
  document.getElementById('db-edit-lbl').textContent = 'Setup page';
  document.getElementById('db-cancel-btn').style.display = 'none';
  dbRenderDesktop();
}

function dbRestoreDefaults() {
  dbLayout = dbClone(DB_PRESETS.dispatch);
  dbRenderDesktop();
}

function dbRenderLibrary() {
  var lib = document.getElementById('db-library');
  if (!lib) return;
  var placed = dbPlacedIds();
  var html = '<div class="db-lib-head"><div class="db-lib-title">Widgets</div>'
    + '<div class="db-lib-sub">Drag the widgets to your dashboard to customize your experience. Keep what\u2019s important to you close at hand.</div>'
    + '<button class="db-go-pill" onclick="dbRestoreDefaults()">Restore defaults</button></div>';
  DB_CATS.forEach(function (cat) {
    var items = DB_WIDGETS.filter(function (w) { return w.cat === cat.id; });
    if (!items.length) return;
    html += '<div class="db-lib-cat">' + cat.label + '</div><div class="db-lib-grid">';
    items.forEach(function (w) {
      var isPlaced = !!placed[w.id];
      html += '<div class="db-lib-item' + (isPlaced ? ' placed' : '') + '"'
        + ' draggable="true" ondragstart="dbDragStart(event,\'lib\',null,0,0,\'' + w.id + '\')"'
        + '><div class="db-lib-item-title">' + dbEsc(w.title) + '</div>'
        + (isPlaced ? '<div class="db-lib-check" title="Already on your dashboard">&#10003;</div>' : '<div class="db-lib-drag">&#8942;&#8942;</div>')
        + '</div>';
    });
    html += '</div>';
  });
  lib.innerHTML = html;
}

function dbDragStart(e, kind, zone, r, c, id) {
  dbDragPayload = kind === 'lib'
    ? { kind:'lib', id:id }
    : { kind:'mv', id:dbLayout[zone][r][c], zone:zone, r:r, c:c };
  try { e.dataTransfer.setData('text/plain', dbDragPayload.id); } catch (err) {}
  e.dataTransfer.effectAllowed = 'move';
}

function dbGapOver(e, el)  { if (!dbDragPayload) return; e.preventDefault(); el.classList.add('on'); }
function dbGapLeave(e, el) { el.classList.remove('on'); }
function dbCellOver(e, el) {
  if (!dbDragPayload) return;
  e.preventDefault(); e.stopPropagation();
  el.classList.add('db-drop-target');
}
function dbCellLeave(e, el) { el.classList.remove('db-drop-target'); }

/* Remove the dragged widget from its source (move only). Returns adjusted
   insertion coordinates when source and destination share a row/zone. */
function dbLift(destZone, destRow, destCell) {
  if (!dbDragPayload || dbDragPayload.kind !== 'mv') return { r:destRow, c:destCell };
  var p = dbDragPayload;
  dbLayout[p.zone][p.r].splice(p.c, 1);
  var r = destRow, c = destCell;
  if (p.zone === destZone) {
    if (destRow != null && p.r === destRow && destCell != null && p.c < destCell) c -= 1;
    if (!dbLayout[p.zone][p.r].length) {
      dbLayout[p.zone].splice(p.r, 1);
      if (destRow != null && p.r < destRow) r -= 1;
    }
  } else if (!dbLayout[p.zone][p.r].length) {
    dbLayout[p.zone].splice(p.r, 1);
  }
  return { r:r, c:c };
}

/* Drop between rows: insert as a full-width row. */
function dbGapDrop(e, zone, rowIdx) {
  e.preventDefault(); e.stopPropagation();
  if (!dbDragPayload) return;
  var id = dbDragPayload.id;
  var adj = dbLift(zone, rowIdx, null);
  dbLayout[zone].splice(adj.r, 0, [id]);
  dbDragPayload = null;
  dbRenderDesktop();
}

/* Drop on a card: split its row (cap 4 → falls through to a new row below). */
function dbCellDrop(e, zone, rowIdx, cellIdx) {
  e.preventDefault(); e.stopPropagation();
  if (!dbDragPayload) return;
  var id = dbDragPayload.id;
  if (dbDragPayload.kind === 'mv' && dbDragPayload.zone === zone && dbDragPayload.r === rowIdx && dbDragPayload.c === cellIdx) {
    dbDragPayload = null; dbRenderDesktop(); return;   /* dropped on itself */
  }
  var adj = dbLift(zone, rowIdx, cellIdx);
  var row = dbLayout[zone][adj.r];
  if (zone === 'top') { if (row) row.splice(adj.c + 1, 0, id); else dbLayout.top = [[id]]; }
  else if (row && row.length < 4) row.splice(adj.c + 1, 0, id);
  else dbLayout[zone].splice(adj.r + 1, 0, [id]);
  dbDragPayload = null;
  dbRenderDesktop();
}

function dbZoneTopOver(e) {
  if (!dbDragPayload || !dbEdit) return;
  e.preventDefault();
}

/* Drop on the top strip's trailing slot: append to the shelf. */
function dbTopAppendDrop(e) {
  e.preventDefault(); e.stopPropagation();
  if (!dbDragPayload) return;
  var id = dbDragPayload.id;
  dbLift('top', null, null);
  if (!dbLayout.top.length) dbLayout.top = [[]];
  dbLayout.top[0].push(id);
  dbDragPayload = null;
  dbRenderDesktop();
}

function dbRemoveAt(zone, r, c) {
  dbLayout[zone][r].splice(c, 1);
  if (!dbLayout[zone][r].length) dbLayout[zone].splice(r, 1);
  dbRenderDesktop();
}

/* ── 8. Fleet map instances ───────────────────────────────────────────────── */

var dbMaps = [];   /* { el, map } */

function dbKillMaps(scopeId) {
  dbMaps = dbMaps.filter(function (m) {
    var inScope = scopeId ? (m.scope === scopeId) : true;
    if (inScope || !document.body.contains(m.el)) {
      try { m.map.remove(); } catch (e) {}
      return false;
    }
    return true;
  });
}

function dbInitMaps(scopeEl, still) {
  if (!scopeEl || typeof L === 'undefined') {
    if (scopeEl) setTimeout(function () { dbInitMaps(scopeEl, still); }, 120);
    return;
  }
  var mounts = scopeEl.querySelectorAll('.db-map-mount');
  mounts.forEach(function (el) {
    if (el._dbMap) return;
    var map = L.map(el, { zoomControl:false, attributionControl:false,
      dragging:!still, scrollWheelZoom:false, doubleClickZoom:false, boxZoom:false, keyboard:false, touchZoom:!still });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    var pts = (typeof dcMapTrucks === 'function') ? dcMapTrucks() : [];
    var bounds = [];
    pts.forEach(function (t) {
      bounds.push([t.lat, t.lng]);
      L.marker([t.lat, t.lng], { icon: L.divIcon({ className:'dc-map-marker-wrap', html:'<div class="dc-map-marker ' + (t.phase || 'ignition-off') + '">' + dbEsc(t.num) + '</div>', iconSize:null, iconAnchor:[0,0] }) }).addTo(map);
    });
    if (bounds.length) map.fitBounds(bounds, { padding:[26,26], maxZoom:11 });
    else map.setView([37.75, -122.25], 9);
    el._dbMap = map;
    dbMaps.push({ el: el, map: map, scope: scopeEl.id });
    setTimeout(function () { map.invalidateSize(); if (bounds.length) map.fitBounds(bounds, { padding:[26,26], maxZoom:11 }); }, 80);
  });
}

/* ── 9. Desktop routing ───────────────────────────────────────────────────── */

function dbNavLight(on) {
  var el = document.getElementById('dt-nav-dashboard');
  if (!el) return;
  var dark = document.body.classList.contains('dark');
  var span = el.querySelector('span');
  if (on) {
    el.dataset.active = '1';
    el.style.background = dark ? '#e3f200' : 'var(--blue)';
    if (span) { span.style.color = dark ? '#000' : '#fff'; span.style.fontWeight = '500'; }
  } else {
    delete el.dataset.active;
    el.style.background = '';
    if (span) { span.style.color = ''; span.style.fontWeight = ''; }
  }
}

/* app-06 owns the hash; we just write our own segment through its helper.
   Without this the reset call below leaves '__db__' in the URL and a refresh
   falls through to All Trucks. */
function dbSetHash(view) {
  if (typeof setHash === 'function') setHash([view, 'dashboard']);
}

function dbDeskShow() {
  /* Put the shell in a clean state: an unknown key hides every core page and
     clears every core nav light; app-10's wrapper clears the Tickets branch. */
  if (typeof dbOrigNavGo === 'function') dbOrigNavGo('__db__');
  var page = document.getElementById('dt-page-dashboard');
  if (page) page.style.display = 'flex';
  dbNavLight(true);
  dbRenderDesktop();
  dbSetHash('desktop');
}

var dbOrigNavGo = (typeof dtNavGo === 'function') ? dtNavGo : null;
window.dtNavGo = function (key) {
  if (key === 'dashboard') { dbDeskShow(); return; }
  dbNavLight(false);
  var page = document.getElementById('dt-page-dashboard');
  if (page) page.style.display = '';
  if (dbOrigNavGo) dbOrigNavGo(key);
};

/* ── 10. Device rendering (shared) ────────────────────────────────────────── */

function dbFlatWidgets() {
  var out = [];
  ['top', 'work'].forEach(function (z) {
    dbLayout[z].forEach(function (row) {
      row.forEach(function (id) { var d = dbDef(id); if (d) out.push(d); });
    });
  });
  return out;
}

function dbRenderDevice(mountId, dev) {   /* dev 't' | 'm' */
  var mount = document.getElementById(mountId);
  if (!mount) return;
  dbKillMaps(mountId);
  var html = '<div class="db-dev-greet"><div class="db-greet">' + dbGreeting() + ' John!</div>'
    + '<div class="db-greet-sub">It\u2019s <b>54\u00b0 F</b> and sunny \u2600</div></div>'
    + '<div class="db-dev-grid">';
  var wsShown = false;
  var flatTop = [], flatWork = [];
  dbLayout.top.forEach(function (row) { row.forEach(function (id) { flatTop.push(id); }); });
  dbLayout.work.forEach(function (row) { row.forEach(function (id) { flatWork.push(id); }); });
  function cell(id) {
    var def = dbDef(id);
    if (!def) return '';
    var size = def.small ? (dev === 'm' ? 'm' : 'q') : (dev === 'm' ? 'm' : 'f');
    var span = def.small ? '' : ' db-dev-span';
    return '<div class="db-dev-cell' + span + '">' + dbCardHtml(def, size) + '</div>';
  }
  html += flatTop.map(cell).join('');
  html += '</div>';
  if (flatWork.length) {
    html += '<div class="db-ws-title">Your workspace</div><div class="db-dev-grid">' + flatWork.map(cell).join('') + '</div>';
  }
  mount.innerHTML = html;
  dbInitMaps(mount, true);
}

/* ── 11. Tablet ───────────────────────────────────────────────────────────── */

var DB_TB_SIBLINGS = ['tb-content', 'tb-page-units', 'tb-page-update', 'tb-page-map', 'tb-page-tickets', 'tb-page-header', 'tb-search-row', 'tb-tabs-row'];
var dbTbSnapshot = null;
var dbTbOpening = false;

function dbTabletNav() {
  if (typeof tbNavClose === 'function') tbNavClose();
  dbTabletOpen();
}

function dbTabletOpen() {
  if (typeof ttkClose === 'function') ttkClose();
  if (dbTbSnapshot === null) {
    dbTbSnapshot = {};
    DB_TB_SIBLINGS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { dbTbSnapshot[id] = el.style.display; el.style.display = 'none'; }
    });
  }
  var page = document.getElementById('tb-page-dashboard');
  if (page) page.style.display = 'flex';
  dbTbOpening = true;
  if (typeof tbNavSetActive === 'function') tbNavSetActive('');
  dbTbOpening = false;
  dbTabletPill(true);
  dbRenderDevice('db-tb-mount', 't');
  dbSetHash('tablet');
}

function dbTabletClose() {
  var page = document.getElementById('tb-page-dashboard');
  if (page) page.style.display = 'none';
  if (dbTbSnapshot) {
    Object.keys(dbTbSnapshot).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = dbTbSnapshot[id];
    });
    dbTbSnapshot = null;
  }
  dbTabletPill(false);
}

function dbTabletPill(on) {
  var el = document.getElementById('tb-nav-dashboard');
  if (!el) return;
  var span = el.querySelector('span');
  if (on) { el.dataset.active = '1'; el.style.background = 'var(--blue)'; }
  else    { delete el.dataset.active; el.style.background = ''; }
  if (span) { span.style.color = on ? '#ffffff' : 'rgba(54,50,45,0.5)'; span.style.fontWeight = on ? '500' : ''; }
}

/* Any other tablet destination closes this page first. */
(function dbHookTablet() {
  if (typeof window.tbNavSetActive === 'function' && !window.tbNavSetActive.__dbWrapped) {
    var orig = window.tbNavSetActive;
    window.tbNavSetActive = function (id) {
      if (!dbTbOpening) dbTabletClose();
      return orig.apply(this, arguments);
    };
    window.tbNavSetActive.__dbWrapped = true;
  }
  if (typeof window.ttkOpen === 'function' && !window.ttkOpen.__dbWrapped) {
    var origT = window.ttkOpen;
    window.ttkOpen = function () { dbTabletClose(); return origT.apply(this, arguments); };
    window.ttkOpen.__dbWrapped = true;
  }
})();

/* ── 12. Mobile ───────────────────────────────────────────────────────────── */

function dbMobileNav() {
  if (document.body.classList.contains('view-tablet')) { dbTabletNav(); return; }
  dbMobileOpen();
}

function dbMobileOpen() {
  if (typeof closeNav === 'function') closeNav();
  if (typeof mtkClose === 'function') mtkClose();
  if (typeof mobSwuClose === 'function') mobSwuClose();
  var el = document.getElementById('mob-page-dashboard');
  if (el) el.style.display = 'flex';
  document.querySelectorAll('.sn-sub-item').forEach(function (i) { i.classList.remove('active'); });
  dbRenderDevice('db-mob-mount', 'm');
  dbSetHash('mobile');
}

function dbMobileClose() {
  var el = document.getElementById('mob-page-dashboard');
  if (el) el.style.display = 'none';
}

/* Any other mobile destination closes the overlay first. */
(function dbHookMobile() {
  ['mtkOpen', 'mobSwuOpen', 'goToAllTrucks', 'snGoMap'].forEach(function (fn) {
    if (typeof window[fn] === 'function' && !window[fn].__dbWrapped) {
      var orig = window[fn];
      window[fn] = function () { dbMobileClose(); return orig.apply(this, arguments); };
      window[fn].__dbWrapped = true;
    }
  });
})();

/* ── 13. Restore on refresh ───────────────────────────────────────────────────
   app-06's applyHashRoute runs at its own load time, before this file exists,
   and treats an unrecognised section as the trucks page. So the dashboard has
   to claim its own route once the suite is up. */
(function dbBootFromHash() {
  var parts = (typeof readHashParts === 'function') ? readHashParts() : [];
  if (parts[1] !== 'dashboard') return;
  var view = parts[0];
  setTimeout(function () {
    try {
      if (view === 'mobile') dbMobileOpen();
      else if (view === 'tablet') dbTabletOpen();
      else dbDeskShow();
    } catch (e) { /* a failed restore should never blank the app */ }
  }, 140);
})();
