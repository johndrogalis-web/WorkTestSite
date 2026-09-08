/* ============================================================================
   app-25-batch-assistant.js
   BATCH ASSISTANT — plant-scoped live monitoring, rebuilt in the Trinity dialect
   ----------------------------------------------------------------------------
   Top-level nav item, directly under Dashboards. Not a child of Dashboards:
   Dashboards is a configurable widget canvas you glance at, this is where one
   person sits for a whole shift. Same precedent as Returned Concrete.

   What the twenty feature requests actually say:

     Six of them are "add a column", "move a column" or "colour a column"
     (HUB-2696, HUB-2616, HUB-2551, HUB-2541, HUB-2394, HUB-2107, TRIAGE-5313).
     Answering each one literally gets you an eighteen-column table nobody can
     read. They are all the same complaint in different words: the batchman has
     to scan fifteen numbers to answer one question, which is "is this load in
     range, and if not what do I do about it".

     So there is one STATE cell that encodes the three things that change the
     batcher's next action — the in-cab management state (Grey / Orange /
     Green / Blue, HUB-2541), how far outside the band the load sits (wet or
     dry, HUB-2551), and the drum's buildup status (HUB-2616). The raw numbers
     stay in their own columns behind it, and the Columns control decides which
     of them are on screen.

   Three tabs, mapped to the request clusters:

     Live             The Currently Waiting to Load panel with the three
                      columns from HUB-1061 and the buildup dot from HUB-2390,
                      plus the drum water carryover that HUB-4184 says
                      currently vanishes when the next load starts.
     Batch accuracy   The loads table. Tolerance-aware stat band, Initial
                      Target Slump (HUB-2696), last measured and tested slump
                      (HUB-2394, TRIAGE-5313), temp at the seventh position
                      (HUB-2107), working Columns control.
     Water & buildup  The standalone Drum Water Estimate report TRIAGE-4132
                      asked for, per truck and driver, with buildup ranked
                      beside it since they are the same conversation.

   Scope and time, from four requests at once: one plant control that filters
   inside a location (VSE-620), remembers a default (HUB-3966) and honours a
   user's location scoping (HUB-254), and a lookback that goes past yesterday
   (TRIAGE-3062).

   Tolerances are editable at account level with a separate, wider band for
   Flow mixes (HUB-2580). Every derived number on the page — average,
   variability, in-range percentage, the wet/dry markers — recomputes from
   whatever those bands are set to.

   Marked as a concept, same as the Slump Tests section: the strip renders on
   every viewport and cannot be dismissed.

   Not built, and known: the search box, export, the external display
   suppression indicator (HUB-4681), and logging a manual slump test from here
   (TRIAGE-5308) all toast. The last one is deliberately not cross-linked to
   the Slump Tests concept, which is locked.

   Load order: after app-17 (amToast, am-* classes, the drawer classes) and
   app-24 (its dtNavGo wrapper, which this one composes with).
   ========================================================================== */

/* ── Data ─────────────────────────────────────────────────────────────────────
   Trucks, mix codes, drivers and times are taken from the production Batch
   Assistant screen. Plants come from shared-data's truckGroups so the plant
   filter agrees with the rest of the prototype. Belongs in shared-data.js the
   day it stops being mock. */

var BA_TODAY = '09/08/2026';
var BA_PLANTS = ['Phoenix Central', 'Mesa South', 'Mesa Gateway', 'Chandler West', 'Gilbert East'];

/* Account-level tolerances, in inches, measured against the initial target.
   The legacy band is a fixed -50mm/+25mm for everything, which field feedback
   says is far too narrow for Flow mixes — hence two rows (HUB-2580). */
var BA_TOL = {
  slump: { dry: 1.97, wet: 0.98 },   /* -50 mm / +25 mm, the current default */
  flow:  { dry: 3.50, wet: 1.75 }
};

var BA_WAITING = [
  { truck:'75928', returnedAt:'11:14 AM', atPlant:8,  water:0.00, buildup:'ok',
    lastTicket:'49617204', lastMix:'1332953', driver:'Torres, Fernando' },
  { truck:'75940', returnedAt:'11:08 AM', atPlant:14, water:0.00, buildup:'ok',
    lastTicket:'49617188', lastMix:'1556313', driver:'Duran, Armando' },
  { truck:'78350', returnedAt:'10:57 AM', atPlant:25, water:12.40, buildup:'warn',
    lastTicket:'49617141', lastMix:'1556313', driver:'Millanes, Eleno' },
  { truck:'75961', returnedAt:'10:41 AM', atPlant:41, water:31.80, buildup:'bad',
    lastTicket:'49617122', lastMix:'1441647', driver:'Gerardo, Reyes' }
];

/* mixType drives which tolerance band applies. state is the in-cab management
   state the driver already sees on the drum display. */
var BA_LOADS = [
  { truck:'78347', loadedAt:'10:32 AM', driver:'Torres, Fernando', mix:'1332953', mixType:'slump',
    ticketed:5.00, initial:null, initialNote:'NM', target:5.00, tested:null, lastMeasured:null,
    maxWater:2.95, waterAdj:null, temp:91, leaveSlump:null, leaveRevs:14, size:10.5,
    ticket:'49617302', order:'1188', plant:'Phoenix Central', state:'none', buildup:'ok', drumWaterIn:0 },
  { truck:'76820', loadedAt:'10:09 AM', driver:'Jaurigue, Nicholas', mix:'1332953', mixType:'slump',
    ticketed:5.00, initial:null, initialNote:'NM', target:5.00, tested:null, lastMeasured:null,
    maxWater:0.52, waterAdj:null, temp:88, leaveSlump:null, leaveRevs:0, size:10.5,
    ticket:'49617288', order:'1191', plant:'Phoenix Central', state:'none', buildup:'ok', drumWaterIn:0 },
  { truck:'78351', loadedAt:'09:56 AM', driver:'Gavonel, Cesar', mix:'1556313', mixType:'slump',
    ticketed:4.00, initial:3.00, target:4.00, tested:4.25, lastMeasured:3.50,
    maxWater:0.96, waterAdj:0.7, temp:null, leaveSlump:5.50, leaveRevs:24, size:10.5,
    ticket:'49617261', order:'1204', plant:'Phoenix Central', state:'water', buildup:'ok', drumWaterIn:0 },
  { truck:'75929', loadedAt:'09:40 AM', driver:'Duran, Armando', mix:'1555050', mixType:'slump',
    ticketed:6.00, initial:4.75, target:6.00, tested:null, lastMeasured:5.25,
    maxWater:0.09, waterAdj:1.2, temp:88, leaveSlump:null, leaveRevs:14, size:10.25,
    ticket:'49617244', order:'1209', plant:'Mesa South', state:'water', buildup:'warn', drumWaterIn:0 },
  { truck:'75953', loadedAt:'09:37 AM', driver:'Music, Dean', mix:'1385442', mixType:'flow',
    ticketed:5.00, initial:null, initialNote:'Small Load', target:5.00, tested:null, lastMeasured:null,
    maxWater:5.96, waterAdj:null, temp:92, leaveSlump:null, leaveRevs:0, size:3.0,
    ticket:'49617240', order:'1211', plant:'Mesa South', state:'none', buildup:'ok', drumWaterIn:0 },
  { truck:'78307', loadedAt:'09:30 AM', driver:'Orozco, David', mix:'1556313', mixType:'slump',
    ticketed:4.00, initial:4.75, target:4.00, tested:4.50, lastMeasured:4.75,
    maxWater:0.95, waterAdj:0.6, temp:88, leaveSlump:null, leaveRevs:0, size:10.5,
    ticket:'49617231', order:'1214', plant:'Mesa Gateway', state:'measured', buildup:'ok', drumWaterIn:0 },
  { truck:'78350', loadedAt:'09:26 AM', driver:'Millanes, Eleno', mix:'1556313', mixType:'slump',
    ticketed:4.00, initial:2.25, target:4.00, tested:2.75, lastMeasured:2.75,
    maxWater:4.36, waterAdj:1.4, temp:89, leaveSlump:2.75, leaveRevs:118, size:10.5,
    ticket:'49617225', order:'1216', plant:'Mesa Gateway', state:'water', buildup:'warn', drumWaterIn:12.4 },
  { truck:'75961', loadedAt:'09:23 AM', driver:'Gerardo, Reyes', mix:'1441647', mixType:'flow',
    ticketed:9.00, initial:5.50, target:9.00, tested:6.00, lastMeasured:5.75,
    maxWater:0.00, waterAdj:4.1, temp:87, leaveSlump:null, leaveRevs:172, size:10.5,
    ticket:'49617218', order:'1219', plant:'Chandler West', state:'admix', buildup:'bad', drumWaterIn:31.8 },
  { truck:'76782', loadedAt:'09:19 AM', driver:'Whyman, Joshua', mix:'1555050', mixType:'slump',
    ticketed:6.00, initial:5.00, target:6.00, tested:6.25, lastMeasured:6.00,
    maxWater:0.02, waterAdj:1.0, temp:86, leaveSlump:null, leaveRevs:104, size:10.5,
    ticket:'49617210', order:'1221', plant:'Chandler West', state:'measured', buildup:'ok', drumWaterIn:0 },
  { truck:'75940', loadedAt:'09:02 AM', driver:'Duran, Armando', mix:'1556313', mixType:'slump',
    ticketed:4.00, initial:4.25, target:4.00, tested:4.00, lastMeasured:4.25,
    maxWater:1.14, waterAdj:null, temp:87, leaveSlump:4.25, leaveRevs:88, size:10.5,
    ticket:'49617188', order:'1224', plant:'Phoenix Central', state:'measured', buildup:'ok', drumWaterIn:0 },
  { truck:'78347', loadedAt:'08:47 AM', driver:'Torres, Fernando', mix:'1385442', mixType:'flow',
    ticketed:8.00, initial:9.75, target:8.00, tested:9.50, lastMeasured:9.75,
    maxWater:0.00, waterAdj:null, temp:90, leaveSlump:9.75, leaveRevs:96, size:10.5,
    ticket:'49617171', order:'1228', plant:'Gilbert East', state:'measured', buildup:'ok', drumWaterIn:0 },
  { truck:'75928', loadedAt:'08:34 AM', driver:'Torres, Fernando', mix:'1332953', mixType:'slump',
    ticketed:5.00, initial:5.25, target:5.00, tested:null, lastMeasured:5.25,
    maxWater:1.88, waterAdj:null, temp:89, leaveSlump:5.25, leaveRevs:110, size:10.5,
    ticket:'49617204', order:'1231', plant:'Gilbert East', state:'measured', buildup:'ok', drumWaterIn:0 },
  { truck:'76820', loadedAt:'08:19 AM', driver:'Jaurigue, Nicholas', mix:'1555050', mixType:'slump',
    ticketed:6.00, initial:3.25, target:6.00, tested:3.75, lastMeasured:3.50,
    maxWater:6.20, waterAdj:2.6, temp:93, leaveSlump:4.00, leaveRevs:142, size:10.5,
    ticket:'49617288', order:'1234', plant:'Mesa South', state:'water', buildup:'ok', drumWaterIn:0 },
  { truck:'78351', loadedAt:'08:05 AM', driver:'Gavonel, Cesar', mix:'1441647', mixType:'flow',
    ticketed:9.00, initial:8.25, target:9.00, tested:8.50, lastMeasured:8.50,
    maxWater:0.44, waterAdj:0.4, temp:85, leaveSlump:8.75, leaveRevs:130, size:10.5,
    ticket:'49617261', order:'1237', plant:'Mesa Gateway', state:'measured', buildup:'ok', drumWaterIn:0 },
  { truck:'75953', loadedAt:'07:52 AM', driver:'Music, Dean', mix:'1556313', mixType:'slump',
    ticketed:4.00, initial:1.75, target:4.00, tested:2.00, lastMeasured:2.00,
    maxWater:5.10, waterAdj:1.9, temp:91, leaveSlump:2.50, leaveRevs:156, size:10.5,
    ticket:'49617240', order:'1240', plant:'Phoenix Central', state:'water', buildup:'warn', drumWaterIn:0 }
];

/* ── Columns. HUB-1059 fixed the order; HUB-2107 moved temp to the seventh
   position so the page stays usable when the screen is split with My Fleet.
   `on` is the default visible set. ─────────────────────────────────────────── */
var BA_COLS = [
  { k:'truck',   l:'Truck',         w:'78px',            on:true,  lock:true },
  { k:'loaded',  l:'Loaded at',     w:'96px',            on:true,  lock:true },
  { k:'driver',  l:'Driver',        w:'minmax(0, 1fr)',  on:true },
  { k:'mix',     l:'Mix code',      w:'92px',            on:true },
  { k:'state',   l:'State',         w:'168px',           on:true,  lock:true },
  { k:'slump',   l:'Slump',         w:'132px',           on:true,  lock:true },
  { k:'temp',    l:'Temp',          w:'70px',            on:true },
  { k:'maxwater',l:'Max water',     w:'92px',            on:true },
  { k:'wateradj',l:'Water adj',     w:'92px',            on:true },
  { k:'tested',  l:'Tested',        w:'78px',            on:true },
  { k:'leave',   l:'Leave plant',   w:'104px',           on:false },
  { k:'size',    l:'Size',          w:'80px',            on:false },
  { k:'ticket',  l:'Ticket',        w:'96px',            on:true },
  { k:'order',   l:'Order',         w:'76px',            on:false },
  { k:'buildup', l:'Buildup',       w:'96px',            on:false }
];

/* ── State ────────────────────────────────────────────────────────────────── */

var baMode  = 'd';
var baTab   = 'live';                 /* 'live' · 'acc' · 'water'            */
var baPlant = 'all';
var baLock  = false;                  /* HUB-3966: open straight to one plant */
var baRange = 'today';                /* 'today' · 'yesterday' · '7' · '30'   */
var baPop   = null;                   /* 'scope' · 'range' · 'cols' · 'tol'   */
var baDrawer = null;
var baAlertOn = true;

function baToast(m) { if (typeof amToast === 'function') amToast(m); }
function baStub(m)  { baToast('Prototype \u2014 ' + m); }

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function baEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function baN(v, d) { return v == null ? '\u2014' : parseFloat(v).toFixed(d == null ? 2 : d); }
function baBand(l) { return BA_TOL[l.mixType === 'flow' ? 'flow' : 'slump']; }

/* Signed distance from the initial target. Negative is dry. A load Verifi
   never measured has no delta at all, which is the point of the NM marker. */
function baDelta(l) {
  if (l.initial == null || l.target == null) return null;
  return l.initial - l.target;
}
function baVerdict(l) {
  var d = baDelta(l);
  if (d == null) return { k:'nm', label:l.initialNote || 'NM' };
  var b = baBand(l);
  if (d < -b.dry)  return { k:'dry',  d:d, out:true,  bad:d < -b.dry * 1.5 };
  if (d >  b.wet)  return { k:'wet',  d:d, out:true,  bad:d >  b.wet * 1.5 };
  return { k:'in', d:d, out:false };
}
function baLoads() {
  return BA_LOADS.filter(function (l) { return baPlant === 'all' || l.plant === baPlant; });
}
function baWaiting() {
  if (baPlant === 'all') return BA_WAITING;
  /* The waiting panel is keyed on the truck's last load, so scope it the same way. */
  return BA_WAITING.filter(function (w) {
    for (var i = 0; i < BA_LOADS.length; i++) {
      if (BA_LOADS[i].truck === w.truck) return BA_LOADS[i].plant === baPlant;
    }
    return false;
  });
}
var BA_RANGES = { today:'Today', yesterday:'Yesterday', '7':'Last 7 days', '30':'Last 30 days' };

/* ── Concept marker ──────────────────────────────────────────────────────── */

function baWip() {
  return '<div class="ba-wip"><span class="ba-wip-tag">Concept</span>'
    + '<span class="ba-wip-t"><b>Nothing here has been built or decided.</b> This is one way the twenty '
    + 'open Batch Assistant requests could be answered together rather than one column at a time. '
    + 'The live Batch Assistant in the Hub is unchanged.</span></div>';
}

/* ── Head ─────────────────────────────────────────────────────────────────── */

function baHead() {
  var loads = baLoads();
  return '<div class="ba-head">'
    + '<div><div class="am-title ba-title">Batch Assistant</div>'
      + '<div class="ba-sub"><span class="ba-live"><span class="ba-live-dot"></span>Live</span>'
      + '<span>\u00b7</span><span><b>' + loads.length + '</b> batches</span>'
      + '<span>\u00b7</span><span>' + (baPlant === 'all' ? 'All plants' : baEsc(baPlant)) + '</span>'
      + '<span>\u00b7</span><span>' + BA_RANGES[baRange] + '</span></div></div>'
    + '<div class="ba-head-actions">' + baScope() + baRangeBtn() + '</div>'
  + '</div>';
}

/* Plant scope: filters inside a location (VSE-620) and can be pinned as the
   landing plant (HUB-3966). One control, both requests. */
function baScope() {
  var counts = {};
  BA_LOADS.forEach(function (l) { counts[l.plant] = (counts[l.plant] || 0) + 1; });
  var rows = BA_PLANTS.map(function (p) {
    return '<div class="ba-pop-row' + (baPlant === p ? ' on' : '') + '" onclick="baSetPlant(\'' + p + '\')">'
      + '<span class="ba-tick">' + (baPlant === p ? '\u2713' : '') + '</span>' + baEsc(p)
      + '<span class="ba-count">' + (counts[p] || 0) + '</span></div>';
  }).join('');
  return '<div class="ba-scope">'
    + '<button class="ba-scope-btn" onclick="baTogglePop(\'scope\')">'
      + '<small>Plant</small>' + (baPlant === 'all' ? 'All plants' : baEsc(baPlant))
      + (baLock ? '<span class="ba-nav-pill">Pinned</span>' : '')
      + '<svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5l5 5 5-5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'
    + '</button>'
    + (baPop === 'scope' ? '<div class="ba-pop" onclick="event.stopPropagation()">'
        + '<div class="ba-pop-h">Locations you can see</div>'
        + '<div class="ba-pop-row' + (baPlant === 'all' ? ' on' : '') + '" onclick="baSetPlant(\'all\')">'
          + '<span class="ba-tick">' + (baPlant === 'all' ? '\u2713' : '') + '</span>All plants'
          + '<span class="ba-count">' + BA_LOADS.length + '</span></div>'
        + rows
        + '<div class="ba-pop-div"></div>'
        + '<div class="ba-lock' + (baLock ? ' on' : '') + '" onclick="baToggleLock()">'
          + '<span class="ba-switch"><i></i></span>Open here every shift</div>'
        + '<div class="ba-pop-note">Pinning a plant is a profile preference, so this page opens on '
          + 'it instead of on every location.</div>'
      + '</div>' : '')
  + '</div>';
}

/* Lookback. The live page stops at yesterday; field feedback asked to go back
   months (TRIAGE-3062). */
function baRangeBtn() {
  var rows = Object.keys(BA_RANGES).map(function (k) {
    return '<div class="ba-pop-row' + (baRange === k ? ' on' : '') + '" onclick="baSetRange(\'' + k + '\')">'
      + '<span class="ba-tick">' + (baRange === k ? '\u2713' : '') + '</span>' + BA_RANGES[k] + '</div>';
  }).join('');
  return '<div class="ba-scope">'
    + '<button class="ba-scope-btn" onclick="baTogglePop(\'range\')">'
      + '<small>Range</small>' + BA_RANGES[baRange]
      + '<svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5l5 5 5-5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'
    + '</button>'
    + (baPop === 'range' ? '<div class="ba-pop ba-pop--right" onclick="event.stopPropagation()">'
        + '<div class="ba-pop-h">Look back</div>' + rows
        + '<div class="ba-pop-div"></div>'
        + '<div class="ba-pop-row" onclick="baStub(\'the custom date range picker is not built\')">'
          + '<span class="ba-tick"></span>Custom range\u2026</div>'
      + '</div>' : '')
  + '</div>';
}

/* ── Stat band. Same four numbers as the live screen, but every one of them
   recomputes from the tolerance bands rather than from a fixed -50/+25. ──── */

function baStats() {
  var loads = baLoads();
  var measured = loads.filter(function (l) { return baDelta(l) != null; });
  var deltas = measured.map(baDelta);
  var avg = deltas.length ? deltas.reduce(function (a, b) { return a + b; }, 0) / deltas.length : 0;
  var spread = deltas.length ? Math.max.apply(null, deltas) - Math.min.apply(null, deltas) : 0;
  var inRange = measured.filter(function (l) { return !baVerdict(l).out; }).length;
  var pct = measured.length ? Math.round(inRange / measured.length * 100) : 0;
  var nm = loads.length - measured.length;

  return '<div class="ba-stats">'
    + baStat('Batches', String(loads.length), '',
        nm ? nm + ' not measured' : 'all measured')
    + baStat('Average', Math.abs(avg).toFixed(2), avg < 0 ? 'dry' : 'wet',
        'against initial target')
    + baStat('Variability', spread.toFixed(2), 'in', 'widest spread in this range')
    + baStat('In range', pct + '%', '', '<button data-ba-pop="1" onclick="baTogglePop(\'tol\')">'
        + inRange + ' of ' + measured.length + ' \u00b7 edit tolerances</button>')
  + '</div>';
}
function baStat(l, v, u, m) {
  return '<div class="ba-stat"><div class="ba-stat-l">' + l + '</div>'
    + '<div class="ba-stat-v">' + v + (u ? '<small>' + u + '</small>' : '') + '</div>'
    + '<div class="ba-stat-m">' + m + '</div></div>';
}

/* Tolerance editor. Two rows, because a single band cannot serve Slump and
   Flow mixes (HUB-2580). */
function baTolPop() {
  if (baPop !== 'tol') return '';
  function row(key, label, note) {
    var t = BA_TOL[key];
    return '<div class="ba-tol-row"><div class="ba-tol-l">' + label + '<small>' + note + '</small></div>'
      + '<input class="ba-tol-in" inputmode="decimal" value="' + t.dry.toFixed(2)
        + '" onchange="baSetTol(\'' + key + '\',\'dry\',this.value)">'
      + '<input class="ba-tol-in" inputmode="decimal" value="' + t.wet.toFixed(2)
        + '" onchange="baSetTol(\'' + key + '\',\'wet\',this.value)"></div>';
  }
  return '<div class="ba-pop ba-pop--right ba-tol" onclick="event.stopPropagation()">'
    + '<div class="ba-pop-h">In-range tolerance, inches from target</div>'
    + '<div class="ba-tol-row head"><div></div><div style="text-align:right;">Dry</div>'
      + '<div style="text-align:right;">Wet</div></div>'
    + row('slump', 'Slump mixes', 'legacy default, \u221250 mm / +25 mm')
    + row('flow',  'Flow mixes',  'field feedback: the slump band is too narrow')
    + '<div class="ba-pop-div"></div>'
    + '<div class="ba-pop-note">Account level. Every number on this page \u2014 average, variability, '
      + 'in-range, the wet and dry markers \u2014 recomputes from these.</div>'
  + '</div>';
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */

function baTabs() {
  var waiting = baWaiting().length;
  var out = baLoads().filter(function (l) { return baVerdict(l).out; }).length;
  var water = BA_LOADS.filter(function (l) { return l.drumWaterIn > 0; }).length;
  function tab(k, label, n) {
    return '<button class="ba-tab' + (baTab === k ? ' on' : '') + '" onclick="baSetTab(\'' + k + '\')">'
      + label + (n ? '<span class="ba-tab-n">' + n + '</span>' : '') + '</button>';
  }
  return '<div class="ba-tabs">' + tab('live', 'Live', waiting)
    + tab('acc', 'Batch accuracy', out) + tab('water', 'Water & buildup', water) + '</div>';
}

/* ── Toolbar ──────────────────────────────────────────────────────────────── */

function baToolbar() {
  return '<div class="ba-toolbar">'
    + '<div class="am-search"><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.6" stroke="currentColor" stroke-width="1.3"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'
      + '<input placeholder="Truck, driver, mix or ticket" oninput="baStub(\'search is not wired\')"></div>'
    + '<button class="am-pill" onclick="baStub(\'the filter popover is not built\')">'
      + '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>Filters</button>'
    + '<div class="ba-tb-right">'
      + (baTab === 'acc' ? '<div class="ba-scope"><button class="am-pill" onclick="baTogglePop(\'cols\')">Columns</button>'
          + baColsPop() + '</div>' : '')
      + '<div class="ba-scope"><button class="am-pill" onclick="baTogglePop(\'tol\')">Tolerances</button>'
          + baTolPop() + '</div>'
      + '<button class="am-pill" onclick="baStub(\'export is not wired\')">Export</button>'
    + '</div></div>';
}
function baColsPop() {
  if (baPop !== 'cols') return '';
  var rows = BA_COLS.map(function (c, i) {
    return '<div class="ba-pop-row' + (c.on ? ' on' : '') + '"'
      + (c.lock ? '' : ' onclick="baToggleCol(' + i + ')"') + '>'
      + '<span class="ba-tick">' + (c.on ? '\u2713' : '') + '</span>' + c.l
      + (c.lock ? '<span class="ba-count">always</span>' : '') + '</div>';
  }).join('');
  return '<div class="ba-pop ba-pop--right" onclick="event.stopPropagation()">'
    + '<div class="ba-pop-h">Columns</div>' + rows
    + '<div class="ba-pop-note">Truck, Loaded at, State and Slump stay on: without them the row '
      + 'cannot be read at a glance.</div></div>';
}

/* ── Tab: Live ────────────────────────────────────────────────────────────
   The Currently Waiting to Load panel, with the three columns HUB-1061 added
   and the buildup dot HUB-2390 added. The carryover strip above it is
   HUB-4184: water left in the drum from the last load, which today disappears
   the moment the next load starts. */

function baLive() {
  var rows = baWaiting();
  var carry = rows.filter(function (w) { return w.water > 0; });

  var alert = (baAlertOn && carry.length)
    ? '<div class="ba-alert"><span><b>' + carry.length + ' truck'
      + (carry.length === 1 ? '' : 's') + ' came back with water in the drum.</b> '
      + carry.map(function (w) { return w.truck + ' \u00b7 ' + baN(w.water, 1) + ' gal'; }).join(', ')
      + '. This is held against the truck until the next load is batched, so the batchman does not '
      + 'lose it the moment the drum turns.</span>'
      + '<button class="ba-alert-x" onclick="baDismissAlert()">Dismiss</button></div>'
    : '';

  var head = '<div class="ba-tr ba-tr--wait ba-th">'
    + ['Returned to plant at', 'Truck', 'Truck at plant for', 'Drum water estimate', 'Buildup status']
      .map(function (c) { return '<span>' + c + '</span>'; }).join('') + '</div>';

  var body = rows.length ? rows.map(function (w, i) {
    return '<div class="ba-tr ba-tr--wait' + (i % 2 ? ' zebra' : '') + '" onclick="baOpenTruck(\'' + w.truck + '\')">'
      + '<span class="ba-two"><span class="ba-strong">' + w.returnedAt + '</span><small>' + BA_TODAY + '</small></span>'
      + '<span><span class="ba-link">' + w.truck + '</span></span>'
      + '<span class="' + (w.atPlant >= 30 ? 'ba-strong' : '') + '">' + w.atPlant + ' minutes</span>'
      + '<span class="' + (w.water > 0 ? 'ba-strong' : 'ba-dim') + '">' + baN(w.water, 2) + ' gal</span>'
      + '<span>' + baUp(w.buildup) + '</span>'
    + '</div>';
  }).join('') : '<div class="ba-empty"><div class="ba-empty-t">No trucks waiting</div>'
      + '<div class="ba-empty-s">Every truck at ' + (baPlant === 'all' ? 'these plants' : baEsc(baPlant))
      + ' is out on a load.</div></div>';

  var cards = rows.map(function (w) {
    return '<div class="ba-card" onclick="baOpenTruck(\'' + w.truck + '\')">'
      + '<div class="ba-card-top"><div class="ba-card-t">' + w.truck
        + '<small>' + w.atPlant + ' min at plant</small></div>' + baUp(w.buildup) + '</div>'
      + '<div class="ba-card-k"><span>Back <b>' + w.returnedAt + '</b></span>'
        + '<span>Drum water <b>' + baN(w.water, 2) + ' gal</b></span>'
        + '<span>' + baEsc(w.driver) + '</span></div></div>';
  }).join('');

  return alert
    + '<div class="ba-panel"><div class="ba-panel-h">'
      + '<span class="ba-panel-t">Currently waiting to load</span>'
      + '<span class="ba-panel-s">' + rows.length + ' truck' + (rows.length === 1 ? '' : 's') + '</span>'
      + '<span class="ba-panel-r"><span class="ba-live"><span class="ba-live-dot"></span>'
        + 'Updating</span></span></div>'
      + '<div class="ba-panel-b"><div class="ba-table-wrap"><div class="ba-table">' + head + body + '</div></div>'
      + '<div class="ba-cards" style="padding:12px 13px;">' + cards + '</div></div></div>'
    + baLiveNext();
}

/* What is out on the road right now, ranked by whether the batchman will have
   to do something about it. */
function baLiveNext() {
  var out = baLoads().filter(function (l) { return baVerdict(l).out; }).slice(0, 5);
  if (!out.length) {
    return '<div class="ba-panel"><div class="ba-panel-h"><span class="ba-panel-t">Needs a look</span></div>'
      + '<div class="ba-panel-b"><div class="ba-empty"><div class="ba-empty-t">Everything in range</div>'
      + '<div class="ba-empty-s">Every measured load in this range sat inside its tolerance band.</div>'
      + '</div></div></div>';
  }
  var body = out.map(function (l, i) {
    return '<div class="ba-tr ba-tr--wait' + (i % 2 ? ' zebra' : '') + '" onclick="baOpenLoad(\'' + l.ticket + '\')"'
      + ' style="grid-template-columns:96px 90px 168px 132px minmax(0, 1fr);">'
      + '<span class="ba-strong">' + l.loadedAt + '</span>'
      + '<span><span class="ba-link">' + l.truck + '</span></span>'
      + '<span>' + baState(l) + '</span>'
      + '<span>' + baBandCell(l) + '</span>'
      + '<span class="ba-dim">' + baEsc(l.driver) + ' \u00b7 mix ' + l.mix + '</span>'
    + '</div>';
  }).join('');
  return '<div class="ba-panel"><div class="ba-panel-h">'
    + '<span class="ba-panel-t">Needs a look</span>'
    + '<span class="ba-panel-s">outside tolerance</span>'
    + '<span class="ba-panel-r"><button class="am-pill" onclick="baSetTab(\'acc\')">See all batches</button></span>'
    + '</div><div class="ba-panel-b"><div class="ba-table-wrap"><div class="ba-table">' + body + '</div></div>'
    + '</div></div>';
}

/* ── The three glanceable cells ──────────────────────────────────────────── */

var BA_STATE_L = { measured:'Measured', water:'Managed, water', admix:'Managed, admix', none:'Not measured' };

function baState(l) {
  return '<span class="ba-state"><span class="ba-state-dot ' + l.state + '"></span>'
    + '<span class="ba-state-l">' + BA_STATE_L[l.state] + '</span></span>';
}
function baBandCell(l) {
  var v = baVerdict(l);
  if (v.k === 'nm') return '<span class="ba-nm">' + baEsc(v.label) + '</span>';
  if (v.k === 'in') return '<span class="ba-band in"><span class="ba-band-g">\u25cf</span>In range</span>';
  var arrow = v.k === 'dry' ? '\u25bc' : '\u25b2';
  return '<span class="ba-band out' + (v.bad ? ' bad' : '') + '"><span class="ba-band-g">' + arrow + '</span>'
    + Math.abs(v.d).toFixed(2) + ' in ' + v.k + '</span>';
}
function baUp(k) {
  var l = { ok:'Clean', warn:'Watch', bad:'Buildup' }[k];
  return '<span class="ba-up"><span class="ba-up-dot ' + k + '"></span><span class="ba-up-l">' + l + '</span></span>';
}

/* ── Tab: Batch accuracy ────────────────────────────────────────────────── */

function baCells(l) {
  var v = {
    truck:    '<span class="ba-link">' + l.truck + '</span>',
    loaded:   '<span class="ba-two"><span class="ba-strong">' + l.loadedAt + '</span><small>' + BA_TODAY + '</small></span>',
    driver:   '<span class="ba-dim">' + baEsc(l.driver) + '</span>',
    mix:      l.mix,
    state:    baState(l),
    slump:    '<span class="ba-two"><span class="ba-strong">'
                + (l.initial == null ? '<span class="ba-nm">' + baEsc(l.initialNote || 'NM') + '</span>'
                   : baN(l.initial) + ' in')
              + '</span><small>target ' + baN(l.target) + ' \u00b7 ticketed ' + baN(l.ticketed) + '</small></span>',
    temp:     l.temp == null ? '<span class="ba-dim">\u2014</span>' : l.temp + ' \u00b0F',
    maxwater: baN(l.maxWater) + '<span class="ba-dim"> gal/yd\u00b3</span>',
    wateradj: l.waterAdj == null ? '<span class="ba-dim">\u2014</span>'
                : '+' + baN(l.waterAdj, 1) + '<span class="ba-dim"> gal/yd\u00b3</span>',
    tested:   l.tested == null ? '<span class="ba-dim">\u2014</span>' : '<span class="ba-strong">' + baN(l.tested) + ' in</span>',
    leave:    l.leaveSlump == null ? '<span class="ba-dim">\u2014</span>' : baN(l.leaveSlump) + ' in',
    size:     baN(l.size) + ' yd\u00b3',
    ticket:   '<span class="ba-link">' + l.ticket + '</span>',
    order:    l.order,
    buildup:  baUp(l.buildup)
  };
  return v;
}
function baVisCols() { return BA_COLS.filter(function (c) { return c.on; }); }

function baAcc() {
  var cols = baVisCols();
  var tracks = cols.map(function (c) { return c.w; }).join(' ');
  var loads = baLoads();

  var head = '<div class="ba-tr ba-th" style="grid-template-columns:' + tracks + ';">'
    + cols.map(function (c) { return '<span>' + c.l + '</span>'; }).join('') + '</div>';

  var body = loads.length ? loads.map(function (l, i) {
    var cells = baCells(l);
    return '<div class="ba-tr' + (i % 2 ? ' zebra' : '') + '" style="grid-template-columns:' + tracks
      + ';" onclick="baOpenLoad(\'' + l.ticket + '\')">'
      + cols.map(function (c) { return '<span>' + cells[c.k] + '</span>'; }).join('') + '</div>';
  }).join('') : '<div class="ba-empty"><div class="ba-empty-t">No batches</div>'
      + '<div class="ba-empty-s">Nothing was batched at ' + baEsc(baPlant) + ' in this range.</div></div>';

  var cards = loads.map(function (l) {
    return '<div class="ba-card" onclick="baOpenLoad(\'' + l.ticket + '\')">'
      + '<div class="ba-card-top"><div class="ba-card-t">' + l.truck
        + '<small>' + l.loadedAt + '</small></div>' + baBandCell(l) + '</div>'
      + '<div class="ba-card-k">' + baState(l) + '</div>'
      + '<div class="ba-card-k"><span>Initial <b>'
        + (l.initial == null ? baEsc(l.initialNote || 'NM') : baN(l.initial) + ' in') + '</b></span>'
        + '<span>Target <b>' + baN(l.target) + ' in</b></span>'
        + '<span>Tested <b>' + (l.tested == null ? '\u2014' : baN(l.tested) + ' in') + '</b></span></div>'
      + '<div class="ba-card-k"><span>' + baEsc(l.driver) + '</span><span>Mix ' + l.mix + '</span></div>'
    + '</div>';
  }).join('');

  var nm = loads.filter(function (l) { return baDelta(l) == null; }).length;
  return '<div class="ba-panel"><div class="ba-panel-b">'
    + '<div class="ba-table-wrap"><div class="ba-table" style="min-width:' + (cols.length * 100) + 'px;">'
      + head + body + '</div></div>'
    + '<div class="ba-cards" style="padding:12px 13px;">' + cards + '</div>'
    + '<div class="ba-foot"><span>' + loads.length + ' batches \u00b7 ' + nm + ' not measured</span>'
      + '<span>' + cols.length + ' of ' + BA_COLS.length + ' columns shown</span></div>'
  + '</div></div>';
}

/* ── Tab: Water & buildup ───────────────────────────────────────────────
   The standalone Drum Water Estimate report TRIAGE-4132 asked for. Rolled up
   per truck and driver, because the reason for the request is tracking driver
   behaviour around water brought back to the plant. */

function baWater() {
  var byTruck = {};
  BA_LOADS.forEach(function (l) {
    var t = byTruck[l.truck] || (byTruck[l.truck] = { truck:l.truck, driver:l.driver, plant:l.plant,
      loads:0, water:0, adj:0, adjN:0, buildup:l.buildup });
    t.loads++;
    t.water += l.drumWaterIn || 0;
    if (l.waterAdj != null) { t.adj += l.waterAdj; t.adjN++; }
    if (l.buildup === 'bad' || (l.buildup === 'warn' && t.buildup === 'ok')) t.buildup = l.buildup;
  });
  BA_WAITING.forEach(function (w) {
    var t = byTruck[w.truck] || (byTruck[w.truck] = { truck:w.truck, driver:w.driver, plant:'\u2014',
      loads:0, water:0, adj:0, adjN:0, buildup:w.buildup });
    t.water += w.water;
  });
  var rows = Object.keys(byTruck).map(function (k) { return byTruck[k]; })
    .filter(function (t) { return baPlant === 'all' || t.plant === baPlant; })
    .sort(function (a, b) { return b.water - a.water; });
  var max = rows.length ? Math.max.apply(null, rows.map(function (t) { return t.water; })) || 1 : 1;

  var head = '<div class="ba-tr ba-tr--water ba-th">'
    + ['Truck', 'Driver', 'Loads', 'Water back', 'Avg water adj', 'Buildup']
      .map(function (c, i) { return '<span' + (i === 2 ? ' class="num"' : '') + '>' + c + '</span>'; }).join('')
    + '</div>';

  var body = rows.map(function (t, i) {
    return '<div class="ba-tr ba-tr--water' + (i % 2 ? ' zebra' : '') + '" onclick="baOpenTruck(\'' + t.truck + '\')">'
      + '<span><span class="ba-link">' + t.truck + '</span></span>'
      + '<span class="ba-dim">' + baEsc(t.driver) + '</span>'
      + '<span class="num">' + t.loads + '</span>'
      + '<span class="' + (t.water > 0 ? 'ba-strong' : 'ba-dim') + '">' + baN(t.water, 1) + ' gal</span>'
      + '<span>' + (t.adjN ? '+' + (t.adj / t.adjN).toFixed(1) + ' gal/yd\u00b3' : '<span class="ba-dim">\u2014</span>') + '</span>'
      + '<span style="display:flex;align-items:center;gap:10px;">'
        + '<span class="ba-bar" style="flex:1;"><i class="' + (t.water > 0 ? 'warn' : '')
          + '" style="width:' + Math.round(t.water / max * 100) + '%"></i></span>'
        + baUp(t.buildup) + '</span>'
    + '</div>';
  }).join('');

  var cards = rows.map(function (t) {
    return '<div class="ba-card" onclick="baOpenTruck(\'' + t.truck + '\')">'
      + '<div class="ba-card-top"><div class="ba-card-t">' + t.truck
        + '<small>' + t.loads + ' loads</small></div>' + baUp(t.buildup) + '</div>'
      + '<div class="ba-card-k"><span>Water back <b>' + baN(t.water, 1) + ' gal</b></span>'
        + '<span>' + baEsc(t.driver) + '</span></div></div>';
  }).join('');

  var total = rows.reduce(function (a, t) { return a + t.water; }, 0);
  return '<div class="ba-panel"><div class="ba-panel-h">'
    + '<span class="ba-panel-t">Drum water estimate</span>'
    + '<span class="ba-panel-s">' + baN(total, 1) + ' gal back across ' + rows.length + ' trucks</span>'
    + '<span class="ba-panel-r"><button class="am-pill" onclick="baStub(\'export is not wired\')">Export</button></span>'
    + '</div><div class="ba-panel-b">'
      + '<div class="ba-table-wrap"><div class="ba-table" style="min-width:820px;">' + head + body + '</div></div>'
      + '<div class="ba-cards" style="padding:12px 13px;">' + cards + '</div>'
    + '</div></div>'
    + '<div class="ba-alert"><span><b>Why this is its own report.</b> Water carried back in the drum is a '
      + 'driver-behaviour number, not a batching number. Rolling it up per truck and driver is what makes '
      + 'it actionable; on the loads table it is one cell that resets every load.</span></div>';
}

/* ── Render ───────────────────────────────────────────────────────────────── */

function baHtml() {
  return '<div class="ba-scroll">' + baWip() + baHead() + baStats() + baTabs() + baToolbar()
    + (baTab === 'live' ? baLive() : baTab === 'acc' ? baAcc() : baWater()) + '</div>';
}
function baHost() {
  if (baMode === 't') return document.getElementById('ba-tb-mount');
  if (baMode === 'm') return document.getElementById('ba-mob-mount');
  return document.getElementById('dt-page-batch');
}
function baRender() {
  var host = baHost();
  if (!host) return;
  var scroll = host.querySelector('.ba-scroll');
  var top = scroll ? scroll.scrollTop : 0;
  host.innerHTML = baHtml();
  scroll = host.querySelector('.ba-scroll');
  if (scroll && top) scroll.scrollTop = top;
}

function baSetTab(k)   { baTab = k; baPop = null; baRender(); }
function baSetPlant(p) { baPlant = p; baPop = null; baRender(); }
function baSetRange(r) { baRange = r; baPop = null; baRender(); }
function baToggleLock() {
  baLock = !baLock;
  baToast(baLock ? 'Batch Assistant will open on ' + (baPlant === 'all' ? 'all plants' : baPlant)
    : 'Plant is no longer pinned');
  baRender();
}
function baTogglePop(k) { baPop = (baPop === k) ? null : k; baRender(); }
function baToggleCol(i) {
  if (BA_COLS[i].lock) return;
  BA_COLS[i].on = !BA_COLS[i].on;
  baRender();
}
function baSetTol(key, side, v) {
  var n = parseFloat(v);
  if (!isNaN(n) && n >= 0) BA_TOL[key][side] = n;
  baRender();
}
function baDismissAlert() { baAlertOn = false; baRender(); }

/* Clicking anywhere else closes an open popover.

   Bubble phase, not capture: on capture this ran before the trigger's own
   onclick, closed the popover and re-rendered, which tore the button out of
   the DOM before its handler fired — so the popover could never be opened.
   Clicks inside a popover, or on the control that owns one, are left alone. */
document.addEventListener('click', function (e) {
  if (!baPop) return;
  var host = baHost();
  if (!host || !host.innerHTML) return;          /* page is not on screen */
  var t = e.target;
  if (t && t.closest && t.closest('.ba-scope, .ba-pop, [data-ba-pop]')) return;
  baPop = null;
  baRender();
});

/* ── Drawer ───────────────────────────────────────────────────────────────── */

function baDrawerHost() {
  var el = document.getElementById('ba-drawer');
  if (el) return el;
  var anchor = document.getElementById('am-truck-drawer');
  var parent = anchor ? anchor.parentNode : (document.querySelector('.phone') || document.body);
  el = document.createElement('div');
  el.id = 'ba-drawer';
  el.className = 'am-out';
  parent.appendChild(el);
  return el;
}
function baDrawerPaint(title, sub, body) {
  var host = baDrawerHost();
  host.innerHTML = '<div class="am-scrim" onclick="baDrawerClose()"></div>'
    + '<div class="am-drawer">'
      + '<div class="am-dr-head"><div><div class="am-dr-title ba-dr-title">' + title
        + '<span class="ba-wip-tag">Concept</span></div>'
        + '<div class="am-dr-sub ba-dr-sub">' + sub + '</div></div>'
        + '<button class="am-dr-x" onclick="baDrawerClose()" title="Close">\u00d7</button></div>'
      + '<div class="am-dr-body ba-dr-body">' + body + '</div>'
    + '</div>';
  host.style.display = 'flex';
  host.classList.remove('am-out');
}
function baDrawerClose() {
  var host = document.getElementById('ba-drawer');
  baDrawer = null;
  if (!host) return;
  host.classList.add('am-out');
  setTimeout(function () {
    if (host.classList.contains('am-out')) { host.style.display = 'none'; host.innerHTML = ''; }
  }, 240);
}
function baKv(k, v) { return '<div><div class="ba-k">' + k + '</div><div class="ba-v">' + v + '</div></div>'; }

/* One load. The ladder is the point: ticketed, target, initial and tested on
   the same axis with the tolerance band drawn behind them, so the batchman can
   see which number disagrees with which instead of comparing four columns. */
function baOpenLoad(ticket) {
  var l = null;
  for (var i = 0; i < BA_LOADS.length; i++) if (BA_LOADS[i].ticket === ticket) l = BA_LOADS[i];
  if (!l) return;
  baDrawer = { kind:'load', key:ticket };
  var v = baVerdict(l), b = baBand(l);

  var body = '<div style="margin-bottom:16px;">' + baBandCell(l) + '</div>'
    + baLadder(l)
    + '<div class="ba-sec">Load management</div>'
    + '<div class="ba-kv">'
      + baKv('State', baState(l) + '<small>' + baStateWhy(l) + '</small>')
      + baKv('Max water', baN(l.maxWater) + ' gal/yd\u00b3')
      + baKv('Water adjustment', l.waterAdj == null ? '\u2014' : '+' + baN(l.waterAdj, 1) + ' gal/yd\u00b3')
      + baKv('Buildup', baUp(l.buildup))
      + baKv('Water in drum at load', l.drumWaterIn ? baN(l.drumWaterIn, 1) + ' gal<small>carried back from the last load</small>' : 'None')
      + baKv('Concrete temp', l.temp == null ? '\u2014' : l.temp + ' \u00b0F')
    + '</div>'
    + '<div class="ba-sec">Ticket</div>'
    + '<div class="ba-kv">'
      + baKv('Truck', '<span class="ba-link">' + l.truck + '</span>')
      + baKv('Ticket', '<span class="ba-link">' + l.ticket + '</span>')
      + baKv('Order', l.order)
      + baKv('Driver', baEsc(l.driver))
      + baKv('Mix code', l.mix + '<small>' + (l.mixType === 'flow' ? 'Flow mix' : 'Slump mix')
        + ' \u00b7 band \u2212' + b.dry.toFixed(2) + ' / +' + b.wet.toFixed(2) + ' in</small>')
      + baKv('Plant', baEsc(l.plant))
      + baKv('Size', baN(l.size) + ' yd\u00b3')
      + baKv('Loaded at', l.loadedAt)
      + baKv('Leave plant', (l.leaveSlump == null ? '\u2014' : baN(l.leaveSlump) + ' in')
        + '<small>' + l.leaveRevs + ' revs</small>')
    + '</div>'
    + '<div class="ba-dr-actions">'
      + '<button class="am-pill" onclick="baStub(\'logging a tested slump from here is TRIAGE-5308 and is not built\')">Log a tested slump</button>'
      + '<button class="am-pill" onclick="baStub(\'the ticket drawer is not wired from this page yet\')">Open ticket ' + l.ticket + '</button>'
      + '<button class="am-pill" onclick="baStub(\'external display suppression is HUB-4681 and is not built\')">Display settings</button>'
    + '</div>';

  baDrawerPaint('Truck ' + l.truck, 'Batched ' + l.loadedAt + ' \u00b7 ' + baEsc(l.plant)
    + ' \u00b7 mix ' + l.mix, body);
}
function baStateWhy(l) {
  return { measured:'Verifi measured this load end to end.',
    water:'Verifi brought it to target with water.',
    admix:'Verifi brought it to target with admix.',
    none:'Verifi never got a reading, so the numbers below are the ticket\u2019s, not the drum\u2019s.'
  }[l.state];
}
function baLadder(l) {
  var b = baBand(l);
  var vals = [
    ['Ticketed', l.ticketed], ['Initial target', l.target],
    ['Initial', l.initial], ['Last measured', l.lastMeasured], ['Tested', l.tested]
  ];
  var nums = vals.map(function (r) { return r[1]; }).filter(function (n) { return n != null; });
  var lo = Math.max(0, Math.min.apply(null, nums.concat([l.target - b.dry])) - 0.5);
  var hi = Math.max.apply(null, nums.concat([l.target + b.wet])) + 0.5;
  function pos(n) { return ((n - lo) / (hi - lo)) * 100; }

  var bandL = pos(l.target - b.dry), bandR = pos(l.target + b.wet);
  return '<div class="ba-ladder">'
    + vals.map(function (r) {
      if (r[1] == null) {
        return '<div class="ba-lad-row"><span class="ba-lad-l">' + r[0] + '</span>'
          + '<span class="ba-lad-bar"><i class="ba-lad-band" style="left:' + bandL.toFixed(1)
            + '%;width:' + (bandR - bandL).toFixed(1) + '%"></i></span>'
          + '<span class="ba-lad-v ba-dim">\u2014</span></div>';
      }
      return '<div class="ba-lad-row"><span class="ba-lad-l">' + r[0] + '</span>'
        + '<span class="ba-lad-bar"><i class="ba-lad-band" style="left:' + bandL.toFixed(1)
          + '%;width:' + (bandR - bandL).toFixed(1) + '%"></i>'
        + '<i class="tick" style="left:' + pos(r[1]).toFixed(1) + '%"></i></span>'
        + '<span class="ba-lad-v">' + baN(r[1]) + ' in</span></div>';
    }).join('')
    + '<div style="font-size:11.5px;color:var(--subtle);letter-spacing:-0.23px;padding:8px 0 0;">'
      + 'Shaded band is the in-range tolerance for a '
      + (l.mixType === 'flow' ? 'Flow' : 'Slump') + ' mix, \u2212' + b.dry.toFixed(2)
      + ' to +' + b.wet.toFixed(2) + ' in from target.</div>'
  + '</div>';
}

/* One truck, from the waiting panel or the water report. */
function baOpenTruck(truck) {
  var w = null;
  for (var i = 0; i < BA_WAITING.length; i++) if (BA_WAITING[i].truck === truck) w = BA_WAITING[i];
  var loads = BA_LOADS.filter(function (l) { return l.truck === truck; });
  baDrawer = { kind:'truck', key:truck };

  var water = (w ? w.water : 0) + loads.reduce(function (a, l) { return a + (l.drumWaterIn || 0); }, 0);
  var body = (w && w.water > 0
      ? '<div class="ba-alert"><span><b>' + baN(w.water, 1) + ' gal came back in the drum.</b> '
        + 'It is held against this truck until the next load is batched.</span></div>' : '')
    + '<div class="ba-kv">'
      + baKv('Status', w ? 'Waiting to load<small>at plant ' + w.atPlant + ' minutes</small>' : 'Out on a load')
      + baKv('Returned to plant', w ? w.returnedAt : '\u2014')
      + baKv('Drum water estimate', w ? baN(w.water, 2) + ' gal' : '\u2014')
      + baKv('Buildup', baUp(w ? w.buildup : (loads[0] ? loads[0].buildup : 'ok')))
      + baKv('Water back today', baN(water, 1) + ' gal')
      + baKv('Loads today', String(loads.length))
    + '</div>'
    + '<div class="ba-sec">Batches today</div>'
    + (loads.length ? '<div class="ba-table"><div class="ba-tr ba-th" style="grid-template-columns:92px 168px 132px 78px;">'
        + '<span>Loaded at</span><span>State</span><span>Band</span><span>Tested</span></div>'
        + loads.map(function (l, i) {
            return '<div class="ba-tr' + (i % 2 ? ' zebra' : '')
              + '" style="grid-template-columns:92px 168px 132px 78px;" onclick="baOpenLoad(\'' + l.ticket + '\')">'
              + '<span class="ba-strong">' + l.loadedAt + '</span><span>' + baState(l) + '</span>'
              + '<span>' + baBandCell(l) + '</span>'
              + '<span>' + (l.tested == null ? '<span class="ba-dim">\u2014</span>' : baN(l.tested) + ' in') + '</span></div>';
          }).join('') + '</div>'
      : '<div class="ba-v ba-dim">No batches for this truck in this range.</div>')
    + '<div class="ba-dr-actions">'
      + '<button class="am-pill" onclick="baStub(\'the truck drawer in the Diagnostic Center is not wired from this page yet\')">Open truck ' + truck + '</button>'
    + '</div>';

  baDrawerPaint('Truck ' + truck, w ? 'Waiting to load \u00b7 ' + baEsc(w.driver)
    : (loads[0] ? baEsc(loads[0].driver) + ' \u00b7 ' + baEsc(loads[0].plant) : 'No current load'), body);
}

/* ── Device mounts ────────────────────────────────────────────────────────── */

function baTeardown() { baPop = null; baDrawerClose(); }

var BA_TB_SIBLINGS = ['tb-content', 'tb-page-units', 'tb-page-update', 'tb-page-map', 'tb-page-tickets',
  'tb-page-dashboard', 'tb-page-account', 'tb-page-insights', 'tb-page-returned', 'tb-page-slump',
  'tb-page-header', 'tb-search-row', 'tb-tabs-row'];
var baTbSnap = null;

function baTabletOpen() {
  if (typeof tbNavClose === 'function') tbNavClose();
  ['ttkClose', 'dbTabletClose', 'amTabletClose', 'inTabletClose', 'rcTabletClose', 'slTabletClose']
    .forEach(function (f) { if (typeof window[f] === 'function') window[f](); });
  if (baTbSnap === null) {
    baTbSnap = {};
    BA_TB_SIBLINGS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { baTbSnap[id] = el.style.display; el.style.display = 'none'; }
    });
  }
  var page = document.getElementById('tb-page-batch');
  if (page) page.style.display = 'flex';
  baMode = 't';
  baRender();
}
function baTabletClose() {
  var page = document.getElementById('tb-page-batch');
  if (page) page.style.display = 'none';
  var mount = document.getElementById('ba-tb-mount');
  if (mount) mount.innerHTML = '';
  if (baTbSnap) {
    Object.keys(baTbSnap).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = baTbSnap[id];
    });
    baTbSnap = null;
  }
  baTeardown();
}

function baMobileOpen() {
  if (typeof closeNav === 'function') closeNav();
  ['mtkClose', 'mobSwuClose', 'dbMobileClose', 'amMobileClose', 'inMobileClose', 'rcMobileClose',
   'slMobileClose'].forEach(function (f) { if (typeof window[f] === 'function') window[f](); });
  var el = document.getElementById('mob-page-batch');
  if (el) el.style.display = 'flex';
  baMode = 'm';
  baRender();
}
function baMobileClose() {
  var el = document.getElementById('mob-page-batch');
  if (el) el.style.display = 'none';
  var mount = document.getElementById('ba-mob-mount');
  if (mount) mount.innerHTML = '';
  baTeardown();
}

function baNav() {
  var c = document.body.classList;
  if (c.contains('view-mobile')) baMobileOpen();
  else if (c.contains('view-tablet')) baTabletOpen();
  else if (typeof dtNavGo === 'function') dtNavGo('batch');
}

(function baHook() {
  ['tbNavSetActive', 'ttkOpen', 'dbTabletNav', 'dbTabletOpen', 'amTabletOpen', 'inTabletOpen',
   'rcTabletOpen', 'slTabletOpen', 'tbNavUnits', 'tbNavUpdate', 'tbNavMap'].forEach(function (fn) {
    if (typeof window[fn] === 'function' && !window[fn].__baWrapped) {
      var o = window[fn];
      window[fn] = function () { baTabletClose(); return o.apply(this, arguments); };
      window[fn].__baWrapped = true;
    }
  });
  ['mtkOpen', 'mobSwuOpen', 'goToAllTrucks', 'snGoMap', 'dbMobileNav', 'dbMobileOpen',
   'amMobileOpen', 'inMobileOpen', 'rcMobileOpen', 'slMobileOpen', 'openUnits'].forEach(function (fn) {
    if (typeof window[fn] === 'function' && !window[fn].__baWrapped) {
      var o = window[fn];
      window[fn] = function () { baMobileClose(); return o.apply(this, arguments); };
      window[fn].__baWrapped = true;
    }
  });
})();

/* ── Desktop routing ──────────────────────────────────────────────────────── */

function baNavLight(on) {
  var el = document.getElementById('dt-nav-batch');
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

var BA_SIBLINGS = ['dt-page-dashboard', 'dt-page-account', 'dt-page-insights', 'dt-page-returned',
  'dt-page-slump'];

function baDeskShow() {
  baMode = 'd';
  if (typeof dbOrigNavGo === 'function') dbOrigNavGo('__ba__');
  if (typeof dbNavLight === 'function') dbNavLight(false);
  if (typeof inNavLight === 'function') inNavLight(false);
  if (typeof rcNavLight === 'function') rcNavLight(false);
  if (typeof slNavLight === 'function') slNavLight(false);
  BA_SIBLINGS.forEach(function (id) { var el = document.getElementById(id); if (el) el.style.display = 'none'; });
  var page = document.getElementById('dt-page-batch');
  if (page) page.style.display = 'flex';
  baNavLight(true);
  baRender();
  try { if (typeof dtUnitsActivePage !== 'undefined') dtUnitsActivePage = 'batch'; } catch (e) {}
}

var baOrigNavGo = (typeof dtNavGo === 'function') ? dtNavGo : null;
window.dtNavGo = function (key) {
  if (key === 'batch') { baDeskShow(); return; }
  baNavLight(false);
  var page = document.getElementById('dt-page-batch');
  if (page) { page.style.display = 'none'; page.innerHTML = ''; }
  baTeardown();
  if (baOrigNavGo) baOrigNavGo(key);
};

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  if (baPop) { baPop = null; baRender(); return; }
  if (baDrawer) baDrawerClose();
});
