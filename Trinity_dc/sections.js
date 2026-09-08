/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  sections.js — SECTIONS bundle                                             ║
   ║  Prefixes: in- (Insights)  rc- (Returned Concrete)                         ║
   ║            sl- (Slump Tests, concept)  ba- (Batch Assistant, concept)      ║
   ║  Nav items: Insights, Returned Concrete, Slump Tests, Batch Assistant       ║
   ║  Stylesheet: sections.css (the sl- and ba- rules; in- and rc- live in      ║
   ║  styles.css under their own headers)                                       ║
   ║                                                                            ║
   ║  Straight concatenation of four former scripts in their original load      ║
   ║  order. Nothing inside was edited. Search "FILE:" to jump.                 ║
   ║                                                                            ║
   ║    1. app-18-insights.js         reports hub + report pages                ║
   ║    2. app-21-returned-loads.js   Returned Concrete Insights                ║
   ║    3. app-24-slump-tests.js      Slump Tests concept (gated)               ║
   ║    4. app-25-batch-assistant.js  Batch Assistant concept                   ║
   ║                                                                            ║
   ║  Each block wraps window.dtNavGo once and hides its siblings by its own    ║
   ║  list. That chain is untouched here; the section registry in STRUCTURE.md  ║
   ║  ("Later") is where it gets replaced. Adding a fifth section today means   ║
   ║  a fifth FILE block that copies the app-25 pattern exactly.                ║
   ║                                                                            ║
   ║  Load order: after account.js (amToast, am-* kit, vfDd), before comments.  ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */



/* ═══ FILE: app-18-insights.js ════════════════════════════════════════════════════════ */

/* ============================================================================
   app-18-insights.js
   INSIGHTS — reports hub + report pages
   ----------------------------------------------------------------------------
   Insights is one nav item that lands on the hub. The hub is the only way
   into a report: search, a catalog grouped into Production / Quality Control /
   Performance, a Pinned strip, and Recently viewed grouped by day from real
   usage. The old per-report sub-nav is gone; it duplicated the catalog card
   for card and would have grown with every report.

   Every report shares one shell: title, description, back link, its own
   filter bar, then a result card with a computed headline, Download, Key
   take-aways, and the report body. Opening a report writes it to recents.

   Placeholders in the mocks are filled from the suite's own data. Headlines
   and take-aways are computed sentences, tables come from TK_DATA / trucks /
   drivers, and axes labelled "N" get real scales. Where the suite has no
   figure, values are hash-stable so they never change between renders.

   Four reports are built in full: Initial slump report, Driver scorecard,
   Estimated buildup by truck, Leave plant slump accuracy. The rest open into
   the same shell with a headline, take-aways, and a populated table so no
   card dead-ends. Trends and forecast is Premium and stays locked.

   Chart colours follow the severity grammar: blue is on-target, amber is
   drifting, red is out of range. Lime never appears in a chart in light mode.

   Load order: after app-17 (uses AM_COMPANY, amToast, amTag, table styles).
   ========================================================================== */

/* ── Data ─────────────────────────────────────────────────────────────────── */

function inCo() { return (typeof VF_COMPANY !== 'undefined') ? VF_COMPANY : 'Cemex AZ'; }
function inH(s) { return (typeof dbHash === 'function') ? dbHash(s) : 7; }
function inEsc(s) { return (typeof dbEsc === 'function') ? dbEsc(s) : String(s == null ? '' : s); }
function inTickets() { return (typeof TK_DATA !== 'undefined') ? TK_DATA : []; }
function inTrucks() { return (typeof trucks !== 'undefined') ? trucks : []; }

/* Slump vs target per ticket, in inches, stable per ticket. Shaped so most
   loads land near zero and the tails are thin. */
function inSlumpDiff(t) {
  var h = inH('sd' + t.ticket);
  var r = (h % 1000) / 1000;
  var v = r < 0.05 ? -5 : r < 0.11 ? -4 : r < 0.22 ? -3 : r < 0.40 ? -2 : r < 0.62 ? -1
        : r < 0.75 ? 0 : r < 0.86 ? 1 : r < 0.94 ? 2 : r < 0.975 ? 3 : r < 0.99 ? 4 : 5;
  return v;
}

function inDrivers() {
  var seen = {}, out = [];
  inTickets().forEach(function (t) { if (t.driver && !seen[t.driver]) { seen[t.driver] = 1; out.push(t.driver); } });
  inTrucks().forEach(function (t) { if (t.driver && !seen[t.driver]) { seen[t.driver] = 1; out.push(t.driver); } });
  return out.length ? out : ['R. Martinez','D. Ochoa','J. Torres','L. Chen','M. Alvarez','S. Patel'];
}

function inPlants() {
  var seen = {}, out = [];
  inTrucks().forEach(function (t) { if (t.plant && !seen[t.plant]) { seen[t.plant] = 1; out.push(t.plant); } });
  return out.length ? out : ['Phoenix Central','Mesa South','Chandler West'];
}

/* Buckets -5..5 of slump vs target across all tickets. */
function inHistoBuckets() {
  var b = [0,0,0,0,0,0,0,0,0,0,0];
  var scale = 22; /* tickets → loads over the period */
  inTickets().forEach(function (t) { b[inSlumpDiff(t) + 5] += scale + inH('hb' + t.ticket) % 30; });
  return b;
}

function inPct(n, d) { return d ? Math.round((n / d) * 100) : 0; }

/* ── Chart builders (tokens only) ─────────────────────────────────────────── */

function inLbl(x, y, txt, anchor) {
  return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '" class="db-svg-lbl">' + txt + '</text>';
}

/* Histogram with severity colouring by distance from target. */
function inSvgHisto(buckets, H) {
  var W = 900, PAD = { t:10, r:12, b:40, l:46 }, cW = W - PAD.l - PAD.r, cH = H - PAD.t - PAD.b;
  var max = Math.max.apply(null, buckets) * 1.15 || 1, bw = cW / buckets.length, out = '';
  var ticks = 4;
  for (var g = 0; g <= ticks; g++) {
    var v = Math.round((max / ticks) * g / 100) * 100, y = (PAD.t + cH - (v / max) * cH).toFixed(1);
    out += '<line x1="' + PAD.l + '" y1="' + y + '" x2="' + (PAD.l + cW) + '" y2="' + y + '" stroke="var(--border)"/>' + inLbl(PAD.l - 8, parseFloat(y) + 4, v, 'end');
  }
  buckets.forEach(function (v, i) {
    var d = Math.abs(i - 5);
    var color = d <= 1 ? 'var(--blue)' : d <= 2 ? 'var(--amber)' : 'var(--red)';
    var op = d <= 1 ? 1 : d <= 2 ? 0.85 : 0.75;
    var h = (v / max) * cH;
    out += '<rect x="' + (PAD.l + i * bw + bw * 0.12).toFixed(1) + '" y="' + (PAD.t + cH - h).toFixed(1) + '" width="' + (bw * 0.76).toFixed(1)
      + '" height="' + h.toFixed(1) + '" rx="3" fill="' + color + '" opacity="' + op + '"/>';
    out += inLbl((PAD.l + i * bw + bw / 2).toFixed(1), H - 20, i - 5);
  });
  out += inLbl(PAD.l + cW / 2, H - 4, 'Initial slump vs target (Inches)');
  out += '<text transform="translate(12 ' + (PAD.t + cH / 2) + ') rotate(-90)" text-anchor="middle" class="db-svg-lbl">Loads</text>';
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" class="db-svg">' + out + '</svg>';
}

function inSvgDonut(pct, size) {
  if (typeof dbSvgDonut === 'function') return dbSvgDonut(pct, size);
  return '<div class="db-kpi-value">' + pct + '%</div>';
}

/* Scatter: slump accuracy at pour. x = minutes since leaving plant, y = inches off. */
function inSvgScatter(pts, H) {
  var W = 700, PAD = { t:12, r:14, b:40, l:46 }, cW = W - PAD.l - PAD.r, cH = H - PAD.t - PAD.b, out = '';
  var minX = 10, maxX = 90, minY = -4, maxY = 4;
  var tx = function (x) { return PAD.l + ((x - minX) / (maxX - minX)) * cW; };
  var ty = function (y) { return PAD.t + cH - ((y - minY) / (maxY - minY)) * cH; };
  for (var yy = minY; yy <= maxY; yy += 2) {
    out += '<line x1="' + PAD.l + '" y1="' + ty(yy).toFixed(1) + '" x2="' + (PAD.l + cW) + '" y2="' + ty(yy).toFixed(1) + '" stroke="var(--border)"/>'
      + inLbl(PAD.l - 8, ty(yy) + 4, (yy > 0 ? '+' : '') + yy, 'end');
  }
  for (var xx = minX; xx <= maxX; xx += 20) out += inLbl(tx(xx).toFixed(1), H - 20, xx);
  out += '<line x1="' + tx(45).toFixed(1) + '" y1="' + PAD.t + '" x2="' + tx(45).toFixed(1) + '" y2="' + (PAD.t + cH) + '" stroke="var(--border-mid)" stroke-dasharray="3 4"/>';
  pts.forEach(function (p) {
    var c = Math.abs(p.y) <= 1 ? 'var(--blue)' : Math.abs(p.y) <= 2.5 ? 'var(--amber)' : 'var(--red)';
    out += '<circle cx="' + tx(p.x).toFixed(1) + '" cy="' + ty(p.y).toFixed(1) + '" r="4" fill="' + c + '" opacity="0.85"/>';
  });
  out += inLbl(PAD.l + cW / 2, H - 4, 'Minutes from plant to pour');
  out += '<text transform="translate(12 ' + (PAD.t + cH / 2) + ') rotate(-90)" text-anchor="middle" class="db-svg-lbl">Inches off target</text>';
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" class="db-svg">' + out + '</svg>';
}

/* Stacked horizontal bar: wet / within / dry shares. */
function inStackBar(w, ok, d) {
  var seg = function (v, cls) {
    return v > 0 ? '<span class="in-seg in-seg-' + cls + '" style="flex:' + v + ' 1 0;">' + (v >= 12 ? v + '%' : '') + '</span>' : '';
  };
  return '<div class="in-stack">' + seg(w, 'wet') + seg(ok, 'ok') + seg(d, 'dry') + '</div>';
}

/* ── Catalog ──────────────────────────────────────────────────────────────── */

var IN_GROUPS = [
  { id:'prod', label:'Production Reports' },
  { id:'qc',   label:'Quality Control Reports' },
  { id:'perf', label:'Performance Reports' }
];

var IN_REPORTS = [
  { id:'returning',    group:'prod', title:'Returning trucks',            desc:'Shows which trucks returned due to quality or delivery issues and why.' },
  { id:'contractors',  group:'prod', title:'Most common contractors',     desc:'Summarizes volume, quality outcomes, and recurring patterns for each contractor.' },
  { id:'expenses',     group:'prod', title:'Producer expenses efficiency', desc:'An overview of producer expenses connected to production over a set period.' },
  { id:'trends',       group:'prod', title:'Trends and forecast',         desc:'Highlights patterns in quality data and predicts future performance.', premium:true },
  { id:'initial-slump',group:'qc',   title:'Initial slump report',        desc:'Captures slump measurements taken at loading before departure.' },
  { id:'leave-plant',  group:'qc',   title:'Leave plant slump accuracy',  desc:'Shows which trucks left the plant with an accurate slump, by location.' },
  { id:'plant',        group:'qc',   title:'Plant report',                desc:'Loads, slump averages, water, and timing for every plant in the account.' },
  { id:'buildup',      group:'qc',   title:'Estimated buildup by truck',  desc:'Monitors material buildup in drums and which trucks need a chipout.' },
  { id:'delivery',     group:'qc',   title:'Delivery phase',              desc:'Where time is lost between end of load and leaving the plant, by cause.' },
  { id:'mix',          group:'qc',   title:'Mix optimization',            desc:'Current strength performance against specified class, with over-design flagged.' },
  { id:'driver',       group:'perf', title:'Driver scorecard',            desc:'Rates drivers on quality, consistency and compliance metrics.' },
  { id:'driver-sub',   group:'perf', title:'Driver scorecard subscription', desc:'A recurring report tracking driver performance over time.' }
];

function inDef(id) { for (var i = 0; i < IN_REPORTS.length; i++) if (IN_REPORTS[i].id === id) return IN_REPORTS[i]; return null; }

/* ── Card stats ───────────────────────────────────────────────────────────────
   Every catalog card carries one computed figure so the hub reads as triage
   rather than twelve identical rectangles: you can see which report has
   something wrong before opening it. One number and one caption, always in
   the same place, plus a delta where a direction genuinely exists and a
   severity tone where the number itself is the warning. Anything richer
   belongs in the report, not the card.

   Figures come from the same data the report body uses, so a card never
   promises a number the report contradicts. */

function inStat(id) {
  var tks = inTickets(), trks = inTrucks(), h = inH(id);
  switch (id) {
    case 'initial-slump': {
      var b = inHistoBuckets(), tot = b.reduce(function (s, v) { return s + v; }, 0);
      var within = b[3] + b[4] + b[5] + b[6] + b[7];
      var p = inPct(within, tot);
      return { value:p + '%', label:'of loads within \u00b12 in of target', delta:'+3 pts', dir:'up',
        tone: p >= 75 ? 'ok' : p >= 60 ? 'warn' : 'bad' };
    }
    case 'leave-plant': {
      var wet = trks.filter(function (t) { return inH('lp' + t.num) % 4 === 0; }).length;
      return { value:String(wet), label:'trucks leaving the plant wet', tone: wet > 3 ? 'warn' : 'ok' };
    }
    case 'buildup': {
      var chip = trks.filter(function (t) { return inH('bu' + t.num) % 5 === 0; }).length;
      return { value:String(chip), label:'trucks past the chipout threshold', delta:'\u2197 4%', dir:'down', tone: chip ? 'bad' : 'ok' };
    }
    case 'driver': {
      var d = inDrivers(), who = d[0], hh = inH('drv' + who);
      return { value:(72 + hh % 12) + '%', label:'best driver in range at arrival \u00b7 ' + d.length + ' rated', tone:'ok' };
    }
    case 'driver-sub': {
      return { value:(8 + (h % 20) / 10).toFixed(2) + ' min', label:'fleet average end load to leave', delta:'-1 min', dir:'up', tone:'ok' };
    }
    case 'returning': {
      var r = tks.filter(function (t) { return inH('rt' + t.ticket) % 4 === 0; }).length;
      return { value:String(r), label:'loads returned this period', tone: r > 2 ? 'warn' : 'ok' };
    }
    case 'contractors': {
      var seen = {}, n = 0;
      tks.forEach(function (t) { if (!seen[t.customer]) { seen[t.customer] = 1; n++; } });
      return { value:String(n), label:'contractors supplied this period', tone:'ok' };
    }
    case 'expenses': {
      return { value:'$' + (34 + h % 12) + 'k', label:'lost to early arrival and idling', tone:'warn' };
    }
    case 'plant': {
      return { value:String(inPlants().length), label:'plants reporting \u00b7 2 running wet', tone:'warn' };
    }
    case 'delivery': {
      return { value:'33%', label:'of lost time is mix code instructions', tone:'bad' };
    }
    case 'mix': {
      return { value:(700 + h % 300) + ' psi', label:'average over-design above class', tone:'warn' };
    }
    default: return null;
  }
}

/* ── Usage: recents + pins ────────────────────────────────────────────────── */

var IN_RECENT_KEY = 'vfInsightsRecent', IN_PIN_KEY = 'vfInsightsPins';
function inLoad(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
function inSave(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

function inRecord(id) {
  var r = inLoad(IN_RECENT_KEY, []).filter(function (x) { return x.id !== id; });
  r.unshift({ id:id, ts:Date.now() });
  inSave(IN_RECENT_KEY, r.slice(0, 12));
}
function inPins() { return inLoad(IN_PIN_KEY, []); }
function inTogglePin(id, e) {
  if (e) e.stopPropagation();
  var p = inPins(), i = p.indexOf(id);
  if (i >= 0) p.splice(i, 1); else p.push(id);
  inSave(IN_PIN_KEY, p);
  inRenderAll();
}

function inDayLabel(ts) {
  var d = new Date(ts), now = new Date();
  var same = function (a, b) { return a.toDateString() === b.toDateString(); };
  var y = new Date(now); y.setDate(now.getDate() - 1);
  if (same(d, now)) return 'Today';
  if (same(d, y)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}
function inTime(ts) { return new Date(ts).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' }); }

/* ── Report bodies ────────────────────────────────────────────────────────── */

function inTake(items) {
  return '<div class="in-take"><div class="in-take-t">Key take-aways</div><div class="in-take-grid">'
    + items.map(function (it) {
        return '<div class="in-take-item"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="2.5" width="10" height="11.5" rx="1.6" stroke="currentColor" stroke-width="1.3"/><path d="M6 1.5h4v2H6z" stroke="currentColor" stroke-width="1.3"/></svg>'
          + '<div class="in-take-a">' + it[0] + '</div><div class="in-take-r">' + it[1] + '</div></div>';
      }).join('') + '</div></div>';
}

function inFilters(list) {
  return '<div class="in-filters">' + list.map(function (f) {
    if (f.type === 'range') {
      return '<div class="in-f"><div class="in-f-l">' + f.label + '</div><div class="in-range"><span>' + f.min + '</span>'
        + '<div class="in-range-track"><span class="in-range-fill"></span><span class="in-range-knob" style="left:18%"></span><span class="in-range-knob" style="left:46%"></span></div><span>' + f.max + '</span></div></div>';
    }
    if (f.type === 'dates') {
      return '<div class="in-f"><div class="in-f-l">' + f.label + '</div><div class="in-dates">'
        + '<label>From: <input placeholder="dd/mm/yy" value="' + (f.from || '') + '"></label><label>To: <input placeholder="dd/mm/yy" value="' + (f.to || '') + '"></label></div></div>';
    }
    var opts = f.opts || ['All'];
    return '<div class="in-f"><div class="in-f-l">' + f.label + '</div>'
      + vfDd({ id:'in-dd-' + f.label.toLowerCase().replace(/\W+/g, '-'), options:opts, value:opts[0], search:opts.length > 6 }) + '</div>';
  }).join('') + '</div>';
}

function inTable(cols, rows, opts) {
  opts = opts || {};
  var grid = cols.map(function (c) { return (c.w || 1) + 'fr'; }).join(' ');
  return '<div class="am-table-wrap"><div class="am-table in-table" style="min-width:' + (opts.minWidth || 720) + 'px;">'
    + '<div class="am-tr am-th" style="grid-template-columns:' + grid + ';">' + cols.map(function (c) { return '<span>' + c.label + '</span>'; }).join('') + '</div>'
    + rows.map(function (r, i) {
        return '<div class="am-tr' + (i % 2 ? ' zebra' : '') + '" style="grid-template-columns:' + grid + ';">'
          + r.map(function (v, j) { return '<span class="' + (cols[j].mono ? 'am-mono' : '') + '">' + v + '</span>'; }).join('') + '</div>';
      }).join('') + '</div></div>';
}

function inKpi(label, sub, value, delta, dir) {
  return '<div class="in-kpi"><div class="in-kpi-l">' + label + (sub ? '<div class="in-kpi-s">' + sub + '</div>' : '') + '</div>'
    + '<div class="in-kpi-v">' + value + (delta ? '<span class="in-kpi-d ' + (dir || 'up') + '">' + delta + '</span>' : '') + '</div></div>';
}

var IN_BUILD = {

  /* ── Initial slump report ── */
  'initial-slump': function () {
    var tks = inTickets(), b = inHistoBuckets();
    var total = b.reduce(function (s, v) { return s + v; }, 0);
    var within = b[3] + b[4] + b[5] + b[6] + b[7];
    var wet = b[0] + b[1] + b[2], dry = b[8] + b[9] + b[10];
    var pct = inPct(within, total);
    var worst = tks.slice().sort(function (a, c) { return Math.abs(inSlumpDiff(c)) - Math.abs(inSlumpDiff(a)); })[0];
    return {
      filters: inFilters([
        { label:'Time period', type:'dates' },
        { label:'Location', opts:[inCo()].concat(inPlants()) },
        { label:'Compare', opts:['None','Last period','Same period last year'] },
        { label:'Truck', opts:['None'].concat(inTrucks().slice(0, 8).map(function (t) { return t.num; })) },
        { label:'Ticket', opts:['None'] },
        { label:'Estimated buildup (lbs)', type:'range', min:23, max:130 }
      ]),
      headline: pct + '% of loads left within \u00b12 in of target slump',
      take: [
        ['Hold the ' + within.toLocaleString() + ' on-target loads', 'Batching at ' + inPlants()[0] + ' is the tightest in the account; use its water settings as the baseline.'],
        [inPct(wet, total) + '% arrived wet', 'Wet loads cluster at -2 to -3 in. Trim initial water by 1.5 gal/yd\u00b3 on MC-4000 and re-check in a week.'],
        ['Review truck ' + (worst ? worst.truck : '45689'), 'Furthest from target this period (' + (worst ? inSlumpDiff(worst) : -4) + ' in). Check the slump sensor calibration before its next load.']
      ],
      body: '<div class="in-sec-t">Slump accuracy distribution</div><div class="in-chart">' + inSvgHisto(b, 330) + '</div>'
        + inTable([{ label:'Ticket ID', mono:true }, { label:'Truck', mono:true }, { label:'Intended slump' }, { label:'Initial slump' }, { label:'Difference' }, { label:'Customer', w:1.4 }],
          tks.slice(0, 14).map(function (t) {
            var d = inSlumpDiff(t), target = 4.0, init = (target + d * 0.5).toFixed(2);
            var tag = Math.abs(d) <= 1 ? '' : (Math.abs(d) <= 2 ? amTag((d > 0 ? '+' : '') + d + ' in', 'warning') : amTag((d > 0 ? '+' : '') + d + ' in', 'error'));
            return [inEsc(t.ticket.replace('TKT-', '')), inEsc(t.truck), target.toFixed(2) + ' in', init + ' in', tag || (d > 0 ? '+' : '') + d + ' in', inEsc(t.customer)];
          }))
    };
  },

  /* ── Driver scorecard ── */
  'driver': function () {
    var drivers = inDrivers(), who = drivers[0];
    var h = inH('drv' + who);
    var loads = 1800 + h % 400, within = 72 + h % 12, ontime = (96 + (h % 35) / 10).toFixed(1);
    var wash = 7 + h % 4, turn = 38 + h % 20;
    var pts = [];
    for (var i = 0; i < 48; i++) {
      var hh = inH('sc' + who + i);
      pts.push({ x: 15 + hh % 70, y: ((hh % 81) - 40) / 10 * (i % 7 === 0 ? 1.4 : 0.7) });
    }
    var rows = inTickets().filter(function (t) { return t.driver === who; }).concat(inTickets().slice(0, 6)).slice(0, 8);
    return {
      filters: inFilters([
        { label:'Driver', opts:drivers },
        { label:'Time period', type:'dates' },
        { label:'Compare', opts:['None','Fleet average','Last period'] }
      ]),
      headline: who + ': ' + within + '% of loads within range at arrival, ' + ontime + '% left plant on time',
      take: [
        ['Consistent at the plant', ontime + '% on-time departures is top-quartile for ' + inCo() + '. Nothing to change on loading.'],
        ['Slump drifts on long hauls', 'Loads over 45 minutes arrive ' + (1 + h % 2) + ' in drier on average. Consider a mid-route water check on the Mesa routes.'],
        ['Washout is ' + (wash > 8 ? 'slow' : 'on pace'), 'Averaging ' + wash + ' min against a fleet median of 8. ' + (wash > 8 ? 'Worth a conversation.' : 'No action.')]
      ],
      body: '<div class="in-grid3">'
        + '<div class="in-card"><div class="in-card-t">Loads</div><div class="in-big">' + loads.toLocaleString() + '</div></div>'
        + '<div class="in-card"><div class="in-card-t">Slump is within range at arrival</div><div class="in-donut">' + inSvgDonut(within, 160) + '</div></div>'
        + '<div class="in-card in-card-wide"><div class="in-card-t">Slump accuracy at pour</div><div class="in-chart in-chart-sm">' + inSvgScatter(pts, 260) + '</div></div>'
        + '</div>'
        + '<div class="in-grid4">'
        + inKpi('Left plant on time', '', ontime + '%') + inKpi('Average washing time', '', wash + ' min')
        + inKpi('Washout time median reverse', '', String(9 + h % 3)) + inKpi('Turnaround time', '', turn + ' min')
        + '</div>'
        + '<div class="in-sec-t">History</div>'
        + inTable([{ label:'Ticket ID', mono:true }, { label:'Delivery address', w:1.6 }, { label:'Turnaround' }, { label:'Arrive state' }, { label:'Within range' }, { label:'Washing' }, { label:'Left on time' }],
          rows.map(function (t, i) {
            var hh = inH('hist' + t.ticket);
            return [inEsc(t.ticket.replace('TKT-', '')), inEsc(t.location || 'Phoenix Central'), (30 + hh % 30) + ' min', (hh % 5 === 0) ? 'Pressed' : 'Auto',
              (hh % 4 === 0) ? amTag('No', 'warning') : 'Yes', (6 + hh % 6) + ' min', (hh % 9 === 0) ? amTag('No', 'error') : 'Yes'];
          }))
    };
  },

  /* ── Estimated buildup by truck ── */
  'buildup': function () {
    var plants = inPlants().slice(0, 4), trucks = inTrucks();
    var days = ['22/03','23/03','24/03','25/03','26/03','27/03'];
    var withB = trucks.filter(function (t) { return inH('bu' + t.num) % 3 === 0; });
    var chip = trucks.filter(function (t) { return inH('bu' + t.num) % 5 === 0; });
    var groups = plants.map(function (p) {
      var rows = trucks.filter(function (t) { return t.plant === p; }).slice(0, 7);
      return '<div class="in-grp"><div class="in-grp-t"><svg width="10" height="6" viewBox="0 0 12 8" fill="none"><path d="M1 1.5l5 5 5-5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>' + inEsc(p) + '</div>'
        + inTable([{ label:'Truck', mono:true }].concat(days.map(function (d) { return { label:d + '/2025' }; })),
          rows.map(function (t) {
            return [inEsc(t.num)].concat(days.map(function (d, di) {
              var hh = inH(t.num + d);
              if (hh % 6 === 0) return '<span class="am-dim">\u2014</span>';
              var v = 900 + hh % 400 + di * 60;
              return v > 1400 ? amTag(v.toLocaleString(), 'error') : v > 1200 ? amTag(v.toLocaleString(), 'warning') : v.toLocaleString();
            }));
          }), { minWidth: 760 }) + '</div>';
    }).join('');
    return {
      filters: inFilters([
        { label:'Location', opts:['All'].concat(plants) }, { label:'Time period', type:'dates' },
        { label:'Truck mode', opts:['LIVE','Maintenance','All'] }, { label:'Mix code', opts:['All','MC-3500','MC-4000','MC-5000'] },
        { label:'Driver name', opts:['All'].concat(inDrivers()) }, { label:'Truck', opts:['All'] },
        { label:'Estimated buildup (lbs)', type:'range', min:23, max:130 }
      ]),
      headline: withB.length + ' trucks carrying buildup, ' + chip.length + ' past the chipout threshold',
      take: [
        ['Schedule ' + chip.length + ' chipouts this week', 'Trucks over 1,400 lbs lose about 0.4 yd\u00b3 of usable capacity per load.'],
        ['Watch ' + plants[0], 'It holds ' + Math.max(1, Math.round(withB.length / 2)) + ' of the buildup trucks. Washout water at that plant runs cold; check the heater.'],
        ['Buildup is climbing ' + (4 + inH('wk') % 5) + '% week over week', 'The trend started with the MC-5000 mix change. Compare admixture dosing before and after.']
      ],
      body: '<div class="in-grid2">'
        + inKpi('Trucks with buildup', '<span class="in-up">\u2197 4% from last week</span>', String(withB.length))
        + inKpi('Trucks in need of chipout', '<span class="in-up">\u2197 4% from last week</span>', String(chip.length))
        + '</div>' + groups
    };
  },

  /* ── Leave plant slump accuracy ── */
  'leave-plant': function () {
    var plants = inPlants().slice(0, 3), trucks = inTrucks();
    var totals = { w:0, ok:0, d:0, n:0 };
    var groups = plants.map(function (p) {
      var rows = trucks.filter(function (t) { return t.plant === p; }).slice(0, 7);
      return '<div class="in-grp"><div class="in-grp-t"><svg width="10" height="6" viewBox="0 0 12 8" fill="none"><path d="M1 1.5l5 5 5-5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>' + inEsc(p) + '</div>'
        + '<div class="in-bars"><div class="in-bars-h"><span>Truck</span><span>22/03/2025</span></div>'
        + rows.map(function (t) {
            var hh = inH('lp' + t.num);
            var w = hh % 4 === 0 ? 10 + hh % 25 : 0, d = hh % 3 === 0 ? 8 + hh % 20 : 0, ok = 100 - w - d;
            totals.w += w; totals.ok += ok; totals.d += d; totals.n++;
            return '<div class="in-bars-r"><span class="am-mono">' + inEsc(t.num) + '</span>' + inStackBar(w, ok, d) + '</div>';
          }).join('') + '</div></div>';
    }).join('');
    var okAvg = totals.n ? Math.round(totals.ok / totals.n) : 0;
    return {
      filters: inFilters([{ label:'Time period', type:'dates' }]),
      headline: okAvg + '% of loads left the plant within range across ' + plants.length + ' plants',
      take: [
        ['Wet loads are the bigger problem', Math.round(totals.w / totals.n) + '% wet against ' + Math.round(totals.d / totals.n) + '% dry. Initial water, not admixture, is where the slack is.'],
        ['Fix ' + plants[plants.length - 1] + ' first', 'Its trucks carry most of the wet share. Same fix as the Initial slump report: trim 1.5 gal/yd\u00b3.'],
        ['Four trucks are perfect', 'Use them as the reference set when checking sensor calibration on the rest.']
      ],
      body: '<div class="in-legend"><span><i class="in-dot in-dot-wet"></i>Left plant wet</span><span><i class="in-dot in-dot-ok"></i>Left plant within range</span><span><i class="in-dot in-dot-dry"></i>Left plant dry</span></div>' + groups
    };
  }
};

/* Reports without a bespoke body still open into the shell with a real
   headline, take-aways, and a filled table. */
function inGenericBuild(def) {
  var tks = inTickets(), h = inH(def.id);
  var rows, cols, headline, take;
  if (def.id === 'contractors') {
    var seen = {}, list = [];
    tks.forEach(function (t) { if (!seen[t.customer]) { seen[t.customer] = 0; list.push(t.customer); } seen[t.customer]++; });
    cols = [{ label:'Customer name', w:1.6 }, { label:'Most common mix', mono:true }, { label:'Loads' }, { label:'Total volume' }, { label:'Avg. time to leave' }, { label:'Avg. pouring time' }, { label:'Water added' }];
    rows = list.map(function (c) { var hh = inH('ct' + c); return [inEsc(c), 'MC-' + (3500 + (hh % 3) * 500), 40 + hh % 160, (150 + hh % 50) + ' yd\u00b3', (9 + hh % 15) + ' min', (30 + hh % 60) + ' min', (hh % 3 ? '0.3' : '0.1') + ' gal/yd\u00b3']; });
    headline = list[0] + ' takes ' + inPct(seen[list[0]], tks.length) + '% of loads this period';
    take = [['Concentration risk', list.length + ' contractors, but one takes most of the volume. A schedule change there moves the whole plant.'], ['Water adds cluster on two accounts', 'Both run MC-4000 to slabs. Check their mix targets against site slump requests.'], ['Pour times are healthy', 'Median under 45 minutes across the board.']];
  } else if (def.id === 'plant') {
    cols = [{ label:'Location', w:1.4 }, { label:'Loads' }, { label:'Ticketed slump avg' }, { label:'Initial slump avg' }, { label:'Turnaround' }, { label:'Water when leaving' }, { label:'Slump at site avg' }, { label:'Discharge slump avg' }];
    rows = inPlants().map(function (p) { var hh = inH('pr' + p); return [inEsc(p), 120 + hh % 200, (4 + (hh % 10) / 10).toFixed(1) + ' in', (4 + (hh % 14) / 10).toFixed(1) + ' in', (35 + hh % 25) + ' min', (hh % 3 ? '0.3' : '0.1') + ' gal/yd\u00b3', (3.8 + (hh % 12) / 10).toFixed(1) + ' in', (3.6 + (hh % 12) / 10).toFixed(1) + ' in']; });
    headline = inPlants().length + ' plants, ' + rows.reduce(function (s, r) { return s + r[1]; }, 0).toLocaleString() + ' loads in the period';
    take = [['Two plants run wet', 'Initial slump is 0.6 in over ticket at Mesa South and Chandler West.'], ['Turnaround is even', 'Spread is under 10 minutes between best and worst plant.'], ['Site slump lands close', 'Average loss from plant to site is 0.4 in, inside tolerance.']];
  } else if (def.id === 'driver-sub') {
    var drivers = inDrivers();
    cols = [{ label:'Driver', w:1.6 }, { label:'End load to leave' }, { label:'Left with slump in range' }, { label:'Pressed arrive state' }, { label:'Return speed avg' }];
    rows = drivers.map(function (d) { var hh = inH('ds' + d); return [inEsc(d), (7 + (hh % 40) / 10).toFixed(1) + ' min', (45 + hh % 45) + '%', (60 + hh % 35) + '%', (26 + hh % 8) + ' min']; });
    headline = 'Fleet leaves plant in ' + (8 + (h % 20) / 10).toFixed(2) + ' min on average, ' + (50 + h % 20) + '% with slump in range';
    take = [['Top drivers hold under 8 min', 'Name the top five in the weekly note; it moves the middle of the pack.'], ['Range compliance is the weak metric', 'Half the fleet leaves outside +2/-1. That is a plant problem as much as a driver one.'], ['Pressed arrive state improving', '+5 points against last period.']];
  } else if (def.id === 'returning') {
    cols = [{ label:'Truck', mono:true }, { label:'Ticket', mono:true }, { label:'Customer', w:1.4 }, { label:'Reason', w:1.4 }, { label:'Returned volume' }, { label:'Time' }];
    rows = tks.filter(function (t) { return inH('rt' + t.ticket) % 4 === 0; }).slice(0, 10).map(function (t) { var hh = inH('rr' + t.ticket); return [inEsc(t.truck), inEsc(t.ticket.replace('TKT-', '')), inEsc(t.customer), ['Slump out of spec','Site not ready','Wrong mix','Over-ordered'][hh % 4], (1 + hh % 4) + ' yd\u00b3', inEsc(t.date || 'Today')]; });
    headline = rows.length + ' loads returned this period, mostly slump out of spec';
    take = [['Site readiness is the avoidable half', 'Confirm pour windows with the top two contractors the evening before.'], ['Returned volume is ' + rows.reduce(function (s, r) { return s + parseInt(r[4], 10); }, 0) + ' yd\u00b3', 'Roughly one full load of waste.'], ['Two trucks account for a third', 'Cross-reference with the Initial slump report.']];
  } else if (def.id === 'expenses') {
    cols = [{ label:'#' }, { label:'Objective', w:1.3 }, { label:'Owner', w:1.2 }, { label:'Location', w:1.3 }, { label:'Current' }, { label:'Target' }, { label:'Value' }];
    rows = []; for (var i = 1; i <= 10; i++) { var hh = inH('ex' + i); rows.push([i, (hh % 3 ? 'Early arrival' : 'Extra idling'), (hh % 5 ? 'Plant policy' : 'Driver'), inEsc(inPlants()[hh % inPlants().length]), (18 + hh % 50) + ' min', (hh % 2 ? '0 min' : '19 min'), '$' + (1900 + (hh % 30) * 100).toLocaleString() + '.20']); }
    headline = 'Early arrival and idling cost about $' + (34 + h % 12) + 'k this quarter';
    take = [['Early arrival dominates', 'Seven of the top ten objectives are trucks arriving before the site is ready.'], ['One plant policy change covers most of it', 'A 15-minute dispatch hold at Phoenix Central addresses six rows.'], ['Fuel is flat', 'No action on fuel this period.']];
  } else if (def.id === 'delivery') {
    cols = [{ label:'Cause group', w:1.3 }, { label:'Cause', w:1.6 }, { label:'Share of time' }, { label:'Minutes lost' }];
    var causes = [['Equipment','Measure equipment',0.7],['Equipment','Manage equipment',0.4],['Ticket','No ticket',7.3],['Out of scope','Small load',5.5],['Out of scope','Build-up',0.1],['Mix code','No slump curve',0.8],['Mix code','Measure instructions',15.3],['Mix code','Manage instructions',17.2],['Up-time','Verifi managed',38]];
    rows = causes.map(function (c) { return [c[0], c[1], c[2] + '%', Math.round(c[2] * 42) + ' min']; });
    headline = 'Mix code instructions account for 33% of time lost between end load and leaving';
    take = [['Fix the mix codes first', 'Measure and manage instructions together are a third of lost time and one data change.'], ['Tickets are the next 7%', 'Loads leaving without a ticket cannot be managed.'], ['Equipment is not the problem', 'Under 2% combined.']];
  } else if (def.id === 'mix') {
    cols = [{ label:'Mix code', mono:true }, { label:'Specified class' }, { label:'Tests' }, { label:'Average' }, { label:'Std. dev.' }, { label:'Over-design' }];
    rows = ['MC-3500','MC-4000','MC-4500','MC-5000','MC-5500','MC-6000'].map(function (m) { var hh = inH('mx' + m); var spec = parseInt(m.slice(3), 10); var avg = spec + 400 + hh % 900; return [m, spec.toLocaleString() + ' psi', 20 + hh % 60, avg.toLocaleString() + ' psi', (250 + hh % 300) + ' psi', amTag('+' + (avg - spec) + ' psi', avg - spec > 900 ? 'warning' : null)]; });
    headline = 'Average over-design is ' + (700 + h % 300) + ' psi above specified class';
    take = [['Two mixes are over-designed by 900+ psi', 'Cement reduction of 20 lbs/yd\u00b3 is defensible at current failure rate.'], ['MC-4000 has the most tests', 'Its numbers are the ones to trust when changing dosing.'], ['Keep the 1/100 failure rate', 'Reductions above 30 lbs/yd\u00b3 push MC-3500 past it.']];
  } else {
    cols = [{ label:'Metric', w:1.6 }, { label:'Value' }];
    rows = [['Loads', tks.length * 22], ['Within range', '68%']];
    headline = 'Report for ' + inCo();
    take = [['Coming soon', 'This report is being defined.'], ['', ''], ['', '']];
  }
  return {
    filters: inFilters([{ label:'Time period', type:'dates' }, { label:'Location', opts:['All'].concat(inPlants()) }]),
    headline: headline, take: take,
    body: inTable(cols, rows)
  };
}

/* ── State + render ───────────────────────────────────────────────────────── */

var inView = 'hub';      /* 'hub' | report id */
var inQuery = '';

function inGo(id) {
  var def = inDef(id);
  if (!def) return;
  if (def.premium) { amToast('Trends and forecast is a Premium report'); return; }
  inView = id;
  inRecord(id);
  inRenderAll();
  inSetHash();
}
function inBack() { inView = 'hub'; inRenderAll(); inSetHash(); }
function inSearch(v) { inQuery = (v || '').toLowerCase(); inRenderAll(true); }

function inSetHash() {
  if (typeof setHash !== 'function') return;
  var view = document.body.classList.contains('view-mobile') ? 'mobile' : document.body.classList.contains('view-tablet') ? 'tablet' : 'desktop';
  setHash(inView === 'hub' ? [view, 'insights'] : [view, 'insights', inView]);
}

function inCard(def) {
  var pinned = inPins().indexOf(def.id) >= 0;
  return '<div class="in-rcard' + (def.premium ? ' in-locked' : '') + '" onclick="inGo(\'' + def.id + '\')">'
    + '<button class="in-pin' + (pinned ? ' on' : '') + '" onclick="inTogglePin(\'' + def.id + '\',event)" title="' + (pinned ? 'Unpin' : 'Pin') + '">'
      + '<svg width="14" height="14" viewBox="0 0 16 16" fill="' + (pinned ? 'currentColor' : 'none') + '"><path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg></button>'
    + '<div class="in-rcard-t">' + def.title + '</div><div class="in-rcard-d">' + def.desc + '</div>'
    + inStatHtml(def)
    + '<div class="in-rcard-f">' + (def.premium
        ? '<span class="am-icon-btn in-lock"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2.5" y="6" width="9" height="6.5" rx="1.6" stroke="currentColor" stroke-width="1.2"/><path d="M4.6 6V4.4a2.4 2.4 0 0 1 4.8 0V6" stroke="currentColor" stroke-width="1.2"/></svg></span><span class="in-premium">Premium</span>'
        : '<span class="am-icon-btn">' + amArrow() + '</span>') + '</div></div>';
}

function inStatHtml(def) {
  if (def.premium) return '<div class="in-stat in-stat-locked">Unlock to see forecast accuracy and drift</div>';
  var s = inStat(def.id);
  if (!s) return '';
  return '<div class="in-stat">'
    + '<div class="in-stat-v' + (s.tone ? ' t-' + s.tone : '') + '">' + s.value
    + (s.delta ? '<span class="in-stat-d ' + (s.dir || 'up') + '">' + s.delta + '</span>' : '') + '</div>'
    + '<div class="in-stat-l">' + s.label + '</div></div>';
}

function inHubHtml(dev) {
  var q = inQuery;
  var match = function (d) { return !q || d.title.toLowerCase().indexOf(q) >= 0 || d.desc.toLowerCase().indexOf(q) >= 0; };
  var pins = inPins().map(inDef).filter(function (d) { return d && match(d); });
  var html = '<div class="in-hub-head"><div class="am-title">All reports</div></div>'
    + '<div class="am-search in-search"><span>' + amIconSearch() + '</span><input placeholder="Search for report" value="' + inEsc(q) + '" oninput="inSearch(this.value)"></div>';
  if (pins.length) {
    html += '<div class="in-sec-t in-sec-pin">Pinned</div><div class="in-rgrid">' + pins.map(inCard).join('') + '</div>';
  }
  IN_GROUPS.forEach(function (g) {
    var items = IN_REPORTS.filter(function (d) { return d.group === g.id && match(d); });
    if (!items.length) return;
    html += '<div class="in-sec-t">' + g.label + '</div><div class="in-rgrid">' + items.map(inCard).join('') + '</div>';
  });
  if (!IN_REPORTS.some(match)) html += '<div class="am-sp-empty">No reports match \u201c' + inEsc(inQuery) + '\u201d.</div>';

  /* Recents grouped by day */
  var rec = inLoad(IN_RECENT_KEY, []).filter(function (r) { return inDef(r.id); });
  if (rec.length && !q) {
    html += '<div class="in-sec-t in-recent-t"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9M2.5 2.5v2.4h2.4M8 5v3.3l2.2 1.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>Recently viewed reports</div>';
    var byDay = {}, order = [];
    rec.forEach(function (r) { var k = inDayLabel(r.ts); if (!byDay[k]) { byDay[k] = []; order.push(k); } byDay[k].push(r); });
    order.forEach(function (k) {
      html += '<div class="in-rec-day"><svg width="10" height="6" viewBox="0 0 12 8" fill="none"><path d="M1 1.5l5 5 5-5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>' + k + '</div>'
        + byDay[k].map(function (r, i) {
            var d = inDef(r.id);
            return '<div class="in-rec-row' + (i % 2 ? ' zebra' : '') + '" onclick="inGo(\'' + d.id + '\')"><span class="am-link">' + d.title + ': ' + inCo() + '</span>'
              + '<span class="in-rec-when">Viewed: ' + inTime(r.ts) + '</span></div>';
          }).join('');
    });
  }
  return '<div class="am-scroll in-scroll">' + html + '</div>';
}

function inReportHtml(dev) {
  var def = inDef(inView);
  if (!def) return inHubHtml(dev);
  var r = IN_BUILD[def.id] ? IN_BUILD[def.id]() : inGenericBuild(def);
  return '<div class="am-scroll in-scroll">'
    + '<button class="in-back" onclick="inBack()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9 2.5 4.5 7 9 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>All reports</button>'
    + '<div class="am-title in-title">' + def.title + '</div>'
    + '<div class="in-desc">' + def.desc + '</div>'
    + r.filters
    + '<div class="in-result">'
      + '<div class="in-result-head"><div class="in-headline">' + r.headline + '</div>'
        + '<button class="am-pill" onclick="amToast(\'Preparing ' + def.title.replace(/'/g, '') + ' for download\')">' + amIconDl() + ' Download</button></div>'
      + inTake(r.take)
      + r.body
    + '</div></div>';
}

function inShell(dev) { return inView === 'hub' ? inHubHtml(dev) : inReportHtml(dev); }

function inRenderAll(keepFocus) {
  var d = document.getElementById('dt-page-insights');
  if (d && d.style.display && d.style.display !== 'none') d.innerHTML = inShell('d');
  var t = document.getElementById('in-tb-mount');
  if (t && t.offsetParent) t.innerHTML = inShell('t');
  var m = document.getElementById('in-mob-mount');
  if (m && m.offsetParent) m.innerHTML = inShell('m');
  if (keepFocus) {
    var inp = document.querySelector('.in-search input');
    if (inp) { inp.focus(); var v = inp.value; inp.setSelectionRange(v.length, v.length); }
  }
}

/* ── Desktop routing ──────────────────────────────────────────────────────── */

function inDeskShow(reportId) {
  if (typeof dbOrigNavGo === 'function') dbOrigNavGo('__in__');
  if (typeof dbNavLight === 'function') dbNavLight(false);
  ['dt-page-dashboard', 'dt-page-account'].forEach(function (id) { var el = document.getElementById(id); if (el) el.style.display = 'none'; });
  inView = reportId && inDef(reportId) ? reportId : 'hub';
  var page = document.getElementById('dt-page-insights');
  if (page) { page.style.display = 'flex'; page.innerHTML = inShell('d'); }
  inNavLight(true);
  inSetHash();
  try { if (typeof dtUnitsActivePage !== 'undefined') dtUnitsActivePage = 'insights'; } catch (e) {}
}

function inNavLight(on) {
  var el = document.getElementById('dt-nav-insights');
  if (!el) return;
  var dark = document.body.classList.contains('dark');
  var span = el.querySelector('span');
  if (on) { el.dataset.active = '1'; el.style.background = dark ? '#e3f200' : 'var(--blue)'; if (span) { span.style.color = dark ? '#000' : '#fff'; span.style.fontWeight = '500'; } }
  else { delete el.dataset.active; el.style.background = ''; if (span) { span.style.color = ''; span.style.fontWeight = ''; } }
}

var inOrigNavGo = (typeof dtNavGo === 'function') ? dtNavGo : null;
window.dtNavGo = function (key) {
  if (key === 'insights') { inDeskShow(inView === 'hub' ? null : inView); return; }
  inNavLight(false);
  var page = document.getElementById('dt-page-insights');
  if (page) page.style.display = 'none';
  if (inOrigNavGo) inOrigNavGo(key);
};

/* ── Tablet + mobile ──────────────────────────────────────────────────────── */

var IN_TB_SIBLINGS = ['tb-content','tb-page-units','tb-page-update','tb-page-map','tb-page-tickets',
  'tb-page-dashboard','tb-page-account','tb-page-header','tb-search-row','tb-tabs-row'];
var inTbSnap = null;

function inTabletOpen() {
  if (typeof tbNavClose === 'function') tbNavClose();
  if (typeof ttkClose === 'function') ttkClose();
  if (typeof dbTabletClose === 'function') dbTabletClose();
  if (typeof amTabletClose === 'function') amTabletClose();
  if (inTbSnap === null) {
    inTbSnap = {};
    IN_TB_SIBLINGS.forEach(function (id) { var el = document.getElementById(id); if (el) { inTbSnap[id] = el.style.display; el.style.display = 'none'; } });
  }
  var page = document.getElementById('tb-page-insights');
  if (page) page.style.display = 'flex';
  var mount = document.getElementById('in-tb-mount');
  if (mount) mount.innerHTML = inShell('t');
  inSetHash();
}
function inTabletClose() {
  var page = document.getElementById('tb-page-insights');
  if (page) page.style.display = 'none';
  if (inTbSnap) { Object.keys(inTbSnap).forEach(function (id) { var el = document.getElementById(id); if (el) el.style.display = inTbSnap[id]; }); inTbSnap = null; }
}
function inMobileOpen() {
  if (typeof closeNav === 'function') closeNav();
  ['mtkClose','mobSwuClose','dbMobileClose','amMobileClose'].forEach(function (f) { if (typeof window[f] === 'function') window[f](); });
  var el = document.getElementById('mob-page-insights');
  if (el) el.style.display = 'flex';
  var mount = document.getElementById('in-mob-mount');
  if (mount) mount.innerHTML = inShell('m');
  inSetHash();
}
function inMobileClose() { var el = document.getElementById('mob-page-insights'); if (el) el.style.display = 'none'; }

function inNav() {
  inView = 'hub';
  if (document.body.classList.contains('view-mobile')) inMobileOpen();
  else if (document.body.classList.contains('view-tablet')) inTabletOpen();
  else if (typeof dtNavGo === 'function') dtNavGo('insights');
}

(function inHook() {
  ['tbNavSetActive','ttkOpen','dbTabletNav','dbTabletOpen','amTabletOpen'].forEach(function (fn) {
    if (typeof window[fn] === 'function' && !window[fn].__inWrapped) {
      var o = window[fn]; window[fn] = function () { inTabletClose(); return o.apply(this, arguments); }; window[fn].__inWrapped = true;
    }
  });
  ['mtkOpen','mobSwuOpen','goToAllTrucks','snGoMap','dbMobileNav','dbMobileOpen','amMobileOpen'].forEach(function (fn) {
    if (typeof window[fn] === 'function' && !window[fn].__inWrapped) {
      var o = window[fn]; window[fn] = function () { inMobileClose(); return o.apply(this, arguments); }; window[fn].__inWrapped = true;
    }
  });
})();

(function inWatchTheme() {
  var was = document.body.classList.contains('dark');
  new MutationObserver(function () {
    var is = document.body.classList.contains('dark');
    if (is === was) return; was = is;
    var el = document.getElementById('dt-nav-insights');
    if (el && el.dataset.active) inNavLight(true);
    inRenderAll();
  }).observe(document.body, { attributes:true, attributeFilter:['class'] });
})();

(function inBootRoute() {
  var parts = (typeof readHashParts === 'function') ? readHashParts() : [];
  if (parts[1] !== 'insights') return;
  var rid = parts[2] && inDef(parts[2]) ? parts[2] : null;
  setTimeout(function () {
    try {
      inView = rid || 'hub';
      if (parts[0] === 'mobile') inMobileOpen();
      else if (parts[0] === 'tablet') inTabletOpen();
      else inDeskShow(rid);
    } catch (e) {}
  }, 220);
})();


/* ═══ FILE: app-21-returned-loads.js ══════════════════════════════════════════════════ */

/* ============================================================================
   app-21-returned-loads.js
   RETURNED CONCRETE — Returned Concrete Insights
   ----------------------------------------------------------------------------
   Second pass on the page. The first pass was the Hub's Returned Loads report
   in the Trinity dialect: a billable table beside a journey map. This pass
   folds in the Returned Concrete Insights structure (indexDS) and keeps the
   billing logic and the map from the first.

   Shape of the page, top to bottom:

     Impact at a glance   Four stats in a hairline band, always visible. This
                          is the enticement: the numbers are real whether or
                          not the customer has bought Insights.
     Analysis             Everything below the band sits behind a paywall
                          until the user unlocks it (session-only here). One
                          segmented switcher, three views:
       Explore            the billable returned loads, the billing settings
                          card, Partial / Full / Removed tabs. A row opens the
                          load in a DRAWER: receipt strip, the ticket's phase
                          readings (the same Status table the ticket drawer
                          shows, grouped by phase), and the one destructive
                          action, "Remove from returned concrete", which goes
                          through a reason modal and then lands on the Removed
                          tab with a restore link.
       Invoicing          billable returns rolled up per customer. A row opens
                          the invoice document in the drawer: editable rate,
                          Download PDF, mark billed.
       Real time          the loads still to deliver today that look likely to
                          come back, ranked by return-risk signals, plus the
                          three "top" widgets behind that judgement.

   What moved and why:

     1. The map is gone. Confirming a returned load is a readings question,
        not a route question: where the load size dropped, how many pours,
        what came back on the Return to plant leg. So the drawer shows the
        ticket's phase readings instead, in the ticket drawer's Status-table
        grammar (phase chip + duration group rows, readings beneath). The
        drawer itself is the account module's own (.am-drawer, mounted at
        .phone level so it stays inside every device frame).
     2. Uptime is gone. It never rendered anything, and Real time is the
        forward-looking view now.
     3. Removed loads are a real state. Billing, invoices and the stat band
        all recompute without them, so a bad sensor read cannot bill twice.

   Billing settings are unchanged from the first pass and still compound:
   pours at or under the max, then buffer, then rounding, always down. A load
   that falls to zero drops out rather than billing at zero.

   Not built, and known: the date picker, the filter popover, the Columns menu,
   and every download. All of them toast.

   Device frames. One renderer, three mounts, as before. The drawer is the
   only thing that changes shape: full width on a phone, near full on tablet.

   Load order: after app-13 (vfDd), app-17 (amToast, am-* classes, the
   drawer classes) and app-18 (its dtNavGo wrapper, which this one composes
   with). No Leaflet dependency any more.
   ========================================================================== */

/* ── Data ─────────────────────────────────────────────────────────────────────
   Lifted from the Hub prototype so the two screens show the same loads. Each
   record carries the three locations (plant / job / discharge) plus the
   outbound and return legs as SVG path data, which is what the breadcrumb
   trail is sampled from. Belongs in shared-data.js the day it stops being
   mock. */

var RC_LOADS = {
  partial: [
    { ticket:'49604962', customer:'Old Pueblo Construction', order:'1029', truck:'5588', mix:'M4000AE', loadT:'11:16 AM', recvT:'11:19 AM', date:'08/11/2026',
      ret:'Pima', addr:'35 East Quail Crossing Boulevard, Green Valley', size:7, returned:3.89, pours:1,
      dischargeType:'plant', batchT:'10:31 AM', arriveT:'10:52 AM',
      plant:[430,560], plantName:'Pima Plant', job:[330,655], jobName:'E Quail Crossing Blvd',
      out:'M430 560 C 400 585, 370 600, 355 625 S 335 645, 330 655',
      back:'M330 655 C 350 640, 385 615, 400 595 S 420 575, 430 560' },
    { ticket:'49604869', customer:'Sonoran Homes', order:'1367', truck:'5612', mix:'M3000', loadT:'10:36 AM', recvT:'10:37 AM', date:'08/11/2026',
      ret:'Aqua Fria Ready Mix', addr:'Cactus & Loop 303, Surprise', size:7, returned:2.87, pours:2,
      dischargeType:'plant', batchT:'9:48 AM', arriveT:'10:07 AM',
      plant:[150,120], plantName:'Aqua Fria Plant', job:[95,62], jobName:'Cactus & Loop 303',
      out:'M150 120 C 130 105, 115 90, 105 78 S 98 68, 95 62',
      back:'M95 62 C 105 75, 118 92, 130 104 S 142 114, 150 120' },
    { ticket:'49604878', customer:'Pantano Contracting', order:'1228', truck:'5701', mix:'M4500HP', loadT:'10:30 AM', recvT:'10:33 AM', date:'08/11/2026',
      ret:'San Tan', addr:'1223 E Pecos Rd, Gilbert', size:10.5, returned:2.84, pours:1,
      dischargeType:'plant', batchT:'9:40 AM', arriveT:'9:58 AM',
      plant:[760,300], plantName:'San Tan Plant', job:[875,240], jobName:'E Pecos Rd',
      out:'M760 300 C 795 285, 830 268, 850 255 S 868 246, 875 240',
      back:'M875 240 C 860 252, 830 270, 805 283 S 778 294, 760 300' },
    { ticket:'49604845', customer:'Rincon Structures', order:'1296', truck:'5560', mix:'M4000AE', loadT:'10:24 AM', recvT:'10:26 AM', date:'08/11/2026',
      ret:'Apex', addr:'Tangerine Rd & N Innovation Pk Dr, Oro Valley', size:6, returned:3.18, pours:2,
      dischargeType:'plant', batchT:'9:22 AM', arriveT:'9:47 AM',
      plant:[255,242], plantName:'Apex Plant', job:[600,160], jobName:'Tangerine & Innovation Pk',
      out:'M255 242 C 330 238, 400 240, 455 225 S 545 185, 600 160',
      back:'M600 160 C 555 190, 500 220, 440 238 S 330 246, 255 242' },
    { ticket:'49604840', customer:'Rincon Structures', order:'1199', truck:'5563', mix:'M3500F', loadT:'10:16 AM', recvT:'10:20 AM', date:'08/11/2026',
      ret:'Apex', addr:'6011 N La Cholla Blvd, Tucson', size:10.5, returned:5.75, pours:1,
      dischargeType:'plant', batchT:'9:15 AM', arriveT:'9:38 AM',
      plant:[255,242], plantName:'Apex Plant', job:[430,420], jobName:'N La Cholla Blvd',
      out:'M255 242 C 300 290, 350 340, 390 380 S 418 408, 430 420',
      back:'M430 420 C 412 400, 375 358, 340 320 S 285 268, 255 242' },
    { ticket:'49604799', customer:'Old Pueblo Construction', order:'6002', truck:'5590', mix:'M3000', loadT:'10:02 AM', recvT:'10:04 AM', date:'08/11/2026',
      ret:'Pima', addr:'14787 East Sands Ranch Road, Vail', size:5, returned:3.59, pours:1,
      dischargeType:'dump', batchT:'9:04 AM', arriveT:'9:31 AM',
      plant:[430,560], plantName:'Pima Plant', job:[705,635], jobName:'E Sands Ranch Rd',
      dump:[445,566], dumpName:'Pima Dump Site',
      out:'M430 560 C 510 585, 590 605, 645 618 S 690 630, 705 635',
      back:'M705 635 C 665 628, 600 615, 545 600 S 470 575, 445 566' },
    { ticket:'49604791', customer:'Catalina Paving', order:'1257', truck:'5704', mix:'M4000AE', loadT:'09:55 AM', recvT:'09:58 AM', date:'08/11/2026',
      ret:'San Tan', addr:'Terrace Rd & Hwy 24, Sacaton', size:10, returned:4.92, pours:2,
      dischargeType:'plant', batchT:'9:02 AM', arriveT:'9:26 AM',
      plant:[760,300], plantName:'San Tan Plant', job:[850,440], jobName:'Terrace Rd & Hwy 24',
      out:'M760 300 C 800 335, 828 370, 842 400 S 850 428, 850 440',
      back:'M850 440 C 845 415, 830 380, 810 350 S 780 315, 760 300' }
  ],
  full: [
    { ticket:'49604712', customer:'Marana Builders', order:'1188', truck:'5561', mix:'M3500F', loadT:'09:12 AM', recvT:'09:15 AM', date:'08/11/2026',
      ret:'Apex', addr:'W Ina Rd & N Thornydale Rd, Marana', size:9, returned:9.0, pours:0,
      dischargeType:'plant', batchT:'8:20 AM', arriveT:'8:44 AM',
      plant:[255,242], plantName:'Apex Plant', job:[190,160], jobName:'Ina & Thornydale',
      out:'M255 242 C 235 215, 218 192, 205 178 S 195 166, 190 160',
      back:'M190 160 C 200 172, 215 190, 230 210 S 248 233, 255 242' },
    { ticket:'49604688', customer:'Pantano Contracting', order:'6014', truck:'5702', mix:'M5000SL', loadT:'08:47 AM', recvT:'08:51 AM', date:'08/11/2026',
      ret:'Pima', addr:'S Houghton Rd & E Valencia Rd, Tucson', size:10.5, returned:10.5, pours:0,
      dischargeType:'plant', batchT:'7:55 AM', arriveT:'8:19 AM',
      plant:[430,560], plantName:'Pima Plant', job:[640,540], jobName:'Houghton & Valencia',
      out:'M430 560 C 495 552, 560 546, 600 542 S 628 540, 640 540',
      back:'M640 540 C 610 544, 555 550, 505 555 S 450 559, 430 560' }
  ]
};

/* Real time: loads still to deliver today, with the signals that make a return
   likely. The flags are what the row's badge counts and the drawer explains. */
var RC_UPCOMING = [
  { ticket:'49605018', order:'1301', customer:'Rincon Structures',       driver:'Marcus T',   truck:'5560', plant:'Apex',      mix:'M4000AE', vol:8.5,  eta:'12:10 PM', flags:{ customer:1, mix:1, plant:0, order:0 } },
  { ticket:'49605021', order:'1303', customer:'Desert Ridge Homes',      driver:'David R',    truck:'5615', plant:'Aqua Fria', mix:'M3000',   vol:6.0,  eta:'12:25 PM', flags:{ customer:0, mix:1, plant:0, order:0 } },
  { ticket:'49605024', order:'1304', customer:'Old Pueblo Construction', driver:'Jennifer M', truck:'5591', plant:'Pima',      mix:'M4000AE', vol:9.0,  eta:'12:40 PM', flags:{ customer:1, mix:1, plant:1, order:1 } },
  { ticket:'49605027', order:'1306', customer:'Cornerstone Inc',         driver:'Robert K',   truck:'5705', plant:'San Tan',   mix:'M4500HP', vol:7.5,  eta:'1:05 PM',  flags:{ customer:0, mix:0, plant:1, order:0 } },
  { ticket:'49605031', order:'1309', customer:'Pantano Contracting',     driver:'Patricia G', truck:'5701', plant:'San Tan',   mix:'M3500F',  vol:10.5, eta:'1:20 PM',  flags:{ customer:1, mix:0, plant:1, order:1 } },
  { ticket:'49605034', order:'1310', customer:'Sunburst Paving',         driver:'Luis A',     truck:'5620', plant:'Apex',      mix:'M3000',   vol:5.5,  eta:'1:45 PM',  flags:{ customer:0, mix:0, plant:0, order:0 } }
];
var RC_FLAG_TEXT = {
  customer: 'Customer returned concrete on 4 of the last 10 orders',
  mix:      'Mix has the highest return rate in the last 30 days',
  plant:    'Plant is above its 30-day return average this week',
  order:    'Ordered volume is 15%+ above the estimate for this pour size'
};
var RC_FLAG_NAME = { customer:'Customer', mix:'Mix', plant:'Plant', order:'Order size' };

/* Top-of-list widgets, last 30 days: name, yd3, share. */
var RC_TOP = {
  customers: [ ['Rincon Structures',171,25.0], ['Old Pueblo Construction',149,21.8], ['Pantano Contracting',132,19.3], ['Catalina Paving',122,17.8], ['Sonoran Homes',110,16.1] ],
  mixes:     [ ['M4000AE',156,5.7], ['M3000',142,5.2], ['M3500F',128,4.7], ['M4500HP',115,4.2], ['M5000SL',98,3.6] ],
  plants:    [ ['San Tan',487,17.8], ['Pima',412,15.1], ['Apex',368,13.4], ['Aqua Fria',285,10.4], ['Marana',220,8.0] ]
};

/* 12-week trend lines for the stat drawer. Mock; the last point is this week. */
var RC_TREND = {
  volume:  { label:'Returned volume', unit:'yd\u00b3 / week', values:[141,133,152,128,119,137,146,131,124,118,128,112] },
  hours:   { label:'Driver hours on returned loads', unit:'hours / week', values:[16,15,18,14,13,15,17,15,14,13,14,12] },
  revs:    { label:'Truck revolutions mixing returned concrete', unit:'revolutions / week', values:[19400,18200,20800,17600,16400,18900,19700,17900,17100,16300,17240,15600] },
  revenue: { label:'Lost revenue recovered', unit:'$ / week', values:[3100,3600,3400,3900,4200,3800,4400,4700,4300,4900,5200,5500] }
};

/* ── State ────────────────────────────────────────────────────────────────── */

var rcUnlocked = false;                     /* the paywall, session-only */
var rcView = 'explore';                     /* explore | invoicing | realtime */
var rcSet = 'partial';                      /* partial | full | removed */
var rcSettings = { maxPours: 2, buffer: 0, round: 0 };
var rcCustomer = '';
var rcRemoved = {};                         /* ticket -> reason */
var rcRate = 5;                             /* $ per yd3 on the invoice */
var rcInvoiceStatus = {};                   /* customer -> billed | pending */
var rcDrawer = null;                        /* { kind, key } while the drawer is up */
var rcMode = 'd';                           /* which frame owns the page: d, t or m */

function rcEsc(s) { return (typeof dbEsc === 'function') ? dbEsc(s) : String(s == null ? '' : s); }
function rcToast(m) { if (typeof amToast === 'function') amToast(m); }
function rcYd(n) { return (Math.round(n * 100) / 100).toFixed(2) + ' yd\u00b3'; }
function rcYd1(n) { return (Math.round(n * 10) / 10) + ' yd\u00b3'; }
function rcMoney(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 }); }
function rcMinutes(t) { var m = /(\d+):(\d+)\s*(AM|PM)/i.exec(t); if (!m) return 0; return (+m[1] % 12 + (/pm/i.test(m[3]) ? 12 : 0)) * 60 + +m[2]; }
function rcAttr(s) { return String(s).replace(/'/g, '\\\''); }

/* ── Billing ──────────────────────────────────────────────────────────────
   Buffer first, then rounding, always down. Null means the load stops being
   billable rather than billing at zero. Removed loads never bill, which is
   why the table below is the billable set and not the returned set. */
function rcBill(r) {
  var b = r.returned - rcSettings.buffer;
  if (b <= 0) return null;
  if (rcSettings.round > 0) b = Math.floor(b / rcSettings.round) * rcSettings.round;
  return b > 0 ? b : null;
}

function rcAll() { return RC_LOADS.partial.concat(RC_LOADS.full); }

function rcRows(set) {
  set = set || rcSet;
  if (set === 'removed') {
    return rcAll().filter(function (r) { return rcRemoved[r.ticket] && (!rcCustomer || r.customer === rcCustomer); });
  }
  return (RC_LOADS[set] || []).filter(function (r) {
    return !rcRemoved[r.ticket]
      && r.pours <= rcSettings.maxPours
      && (!rcCustomer || r.customer === rcCustomer)
      && rcBill(r) !== null;
  });
}
function rcBillable() { return rcRows('partial').concat(rcRows('full')); }
function rcTotal(rows) { return (rows || rcRows()).reduce(function (a, r) { return a + (rcBill(r) || 0); }, 0); }

function rcFind(t) {
  var all = rcAll();
  for (var i = 0; i < all.length; i++) if (all[i].ticket === t) return all[i];
  return null;
}

function rcCustomers() {
  var seen = {}, out = [];
  rcAll().forEach(function (r) { if (!seen[r.customer]) { seen[r.customer] = 1; out.push(r.customer); } });
  return out.sort();
}
function rcRemovedCount() { return Object.keys(rcRemoved).length; }

/* Per-customer roll-up over the live billable set. Status defaults are mock
   until the user marks one. */
function rcInvoices() {
  var by = {};
  rcBillable().forEach(function (r) { (by[r.customer] = by[r.customer] || []).push(r); });
  return Object.keys(by).sort().map(function (c, i) {
    var vol = by[c].reduce(function (a, r) { return a + (rcBill(r) || 0); }, 0);
    return { id:'INV-0811-' + (i + 1 < 10 ? '0' : '') + (i + 1), customer:c, loads:by[c], volume:vol,
             amount:vol * rcRate, status: rcInvoiceStatus[c] || (i % 3 === 2 ? 'pending' : 'billed') };
  });
}

/* Stat band. Volume and hours come off the live set so removing a load moves
   them; revolutions are a proxy off the minutes aboard. */
function rcStats() {
  var live = rcAll().filter(function (r) { return !rcRemoved[r.ticket]; });
  var vol = live.reduce(function (a, r) { return a + r.returned; }, 0);
  var mins = live.reduce(function (a, r) { return a + Math.max(0, rcMinutes(r.recvT) - rcMinutes(r.batchT)); }, 0);
  return { volume:vol, hours:mins / 60, revs:Math.round(mins * 10.6), count:live.length };
}

/* ── Icons ─────────────────────────────────────────────────────────────────── */
var RC_I = {
  cal: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M5.5 2v3M10.5 2v3M2.5 7h11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
  gear: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.2"/><path d="M8 1.6v2M8 12.4v2M1.6 8h2M12.4 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M12.5 3.5l-1.4 1.4M4.9 11.1L3.5 12.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
  funnel: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 2.5h11L8.5 7.5v4l-3 1.5v-5.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  eye: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7s2.2-4 6-4 6 4 6 4-2.2 4-6 4-6-4-6-4z" stroke="currentColor" stroke-width="1.3"/><circle cx="7" cy="7" r="1.8" stroke="currentColor" stroke-width="1.3"/></svg>',
  down: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5v8M3.5 6l3.5 3.5L10.5 6M2 12.5h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6.2l2.6 2.6L10 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  warn: '<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1.5 11 10.5H1L6 1.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M6 5v2.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  up: '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 8l6-6M3.5 2H8v4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  dn: '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M3.5 8H8V3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chev: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

function rcTip(text) {
  return '<span class="rc-tip" tabindex="0">i<span class="rc-tip-pop">' + text + '</span></span>';
}

/* ── Render: header + stat band ───────────────────────────────────────────── */

function rcHead() {
  var rows = rcBillable();
  return '<div class="rc-head">'
    + '<div><div class="am-title rc-title">Returned Concrete</div>'
      + '<div class="rc-sub">Load date 08/11/2026 \u00b7 <b>' + rcRows('partial').length + '</b> partial and <b>' + rcRows('full').length
      + '</b> full loads billable \u00b7 <b>' + rcYd(rcTotal(rows)) + '</b> to bill'
      + (rcRemovedCount() ? ' \u00b7 ' + rcRemovedCount() + ' removed' : '') + '</div></div>'
    + '<div class="rc-head-actions">'
      + '<button class="am-pill" onclick="rcDownloadAll()">' + RC_I.down + 'Download all data</button>'
      + '<button class="am-pill" onclick="rcOpenInvoice(null)">' + RC_I.down + 'Download invoice</button>'
    + '</div></div>';
}

function rcStatCell(key, label, value, meta, foot) {
  return '<button class="rc-stat" onclick="rcOpenStat(\'' + key + '\')" title="Open the 12-week trend">'
    + '<span class="rc-stat-l">' + label + '</span>'
    + '<span class="rc-stat-v">' + value + '</span>'
    + '<span class="rc-stat-m">' + meta + '</span>'
    + '<span class="rc-stat-f">' + (foot || '') + '</span>'
    + '</button>';
}

function rcInsights() {
  var s = rcStats();
  var revenue = rcUnlocked
    ? rcStatCell('revenue', 'Lost revenue recovered', '$186k<small>YTD</small>', 'from returned concrete billed back to customers',
        '<span class="am-tag am-tag-success">' + RC_I.up + ' Top 12% of customers</span>')
    : rcStatCell('revenue', 'Lost revenue recovered', '$0<small>YTD</small>', 'returned concrete is not being billed back',
        '<span class="am-tag">Not able to bill</span>');
  return '<div class="rc-sec-h"><div><div class="rc-sec-t">Impact at a glance</div>'
      + '<div class="rc-sec-s">What returned concrete cost your operation today. Open a number to see its 12-week trend.</div></div>'
      + '<button class="rc-ghost" onclick="rcToast(\'Prototype \\u2014 would open a chat with your Verifi representative\')">Talk to a Verifi representative</button></div>'
    + '<div class="rc-stats">'
      + rcStatCell('volume', 'Returned volume', rcYd1(s.volume).replace(' yd\u00b3', '<small>yd\u00b3</small>'), '128 yd\u00b3 this week \u00b7 ' + s.count + ' loads today',
          '<span class="am-tag am-tag-success">' + RC_I.dn + ' Bottom 18% of customers</span>')
      + rcStatCell('hours', 'Driver hours', s.hours.toFixed(1) + '<small>today</small>', 'hours delivering returned loads \u00b7 14 hours last week',
          '<span class="am-tag am-tag-error">' + RC_I.up + ' Top 16% of customers</span>')
      + rcStatCell('revs', 'Truck revolutions', s.revs.toLocaleString('en-US') + '<small>today</small>', 'drum revolutions mixing returned concrete \u00b7 17,240 this week',
          '<span class="am-tag">43rd percentile</span>')
      + revenue
    + '</div>';
}

/* ── Render: analysis block (paywalled) ───────────────────────────────────── */

function rcModes() {
  return '<div class="rc-modes">' + [['explore','Explore'],['invoicing','Invoicing'],['realtime','Real time']].map(function (m) {
    return '<button class="rc-mode' + (rcView === m[0] ? ' on' : '') + '" onclick="rcGoView(\'' + m[0] + '\')">' + m[1] + '</button>';
  }).join('') + '</div>';
}

function rcPaywall() {
  return '<div class="rc-paywall"><div class="rc-paywall-card">'
    + '<div class="rc-paywall-t">Want to see more?</div>'
    + '<div class="rc-paywall-p">The numbers above are real. Returned Concrete Insights turns them into billable loads, invoices, and a heads-up before the next one comes back.</div>'
    + '<ul class="rc-pts">'
      + '<li>' + RC_I.check + 'Every returned load with its route as proof</li>'
      + '<li>' + RC_I.check + 'Remove the ones that should not bill, invoice the rest</li>'
      + '<li>' + RC_I.check + 'Today\u2019s orders most likely to return concrete</li>'
    + '</ul>'
    + '<button class="am-primary rc-unlock" onclick="rcUnlock()">Unlock Returned Concrete Insights</button>'
    + '<button class="rc-ghost" onclick="rcToast(\'Prototype \\u2014 would open a chat with your Verifi representative\')">Talk to a Verifi representative</button>'
    + '</div></div>';
}

function rcFilters() {
  var rt = rcView === 'realtime';
  return '<div class="in-filters rc-filters">'
    + (rt
      ? '<div class="in-f"><label class="in-f-l">Window</label><button class="am-pill rc-daterange" onclick="rcToast(\'Real time follows the dispatch board; the window is the next 3 hours\')">Next 3 hours' + RC_I.cal + '</button></div>'
      : '<div class="in-f"><label class="in-f-l">Load date</label><button class="am-pill rc-daterange" onclick="rcDates()">08/11/2026 \u2013 08/11/2026' + RC_I.cal + '</button></div>'
        + '<div class="in-f rc-f-cust"><label class="in-f-l">Customer</label>'
        + vfDd({ id:'rc-dd-cust', options:[{ v:'', label:'All customers' }].concat(rcCustomers().map(function (c) { return { v:c, label:c }; })),
                 value:(rcCustomer || ''), placeholder:'All customers', onChange:'rcPickCustomer' }) + '</div>')
    + '<div class="in-f rc-f-btns"><label class="in-f-l">&nbsp;</label><div class="rc-f-row">'
      + '<button class="am-pill" onclick="rcToast(\'Prototype \\u2014 the filter popover is not built yet\')">' + RC_I.funnel + 'Filters</button>'
      + (rt ? '' : '<button class="am-pill" onclick="rcToast(\'Prototype \\u2014 the Columns menu is not built yet\')">' + RC_I.eye + 'Columns</button>')
    + '</div></div>'
    + '</div>';
}

function rcAnalysis() {
  var view = rcView === 'explore' ? rcExploreHtml() : rcView === 'invoicing' ? rcInvoicingHtml() : rcRealtimeHtml();
  return '<div class="rc-sec-h rc-sec-h--analysis"><div><div class="rc-sec-t">Analysis</div>'
      + '<div class="rc-sec-s">Confirm each returned load, bill it, and see which of today\u2019s orders are likely to come back.</div></div>'
      + rcModes() + '</div>'
    + '<div class="rc-gate' + (rcUnlocked ? '' : ' locked') + '">'
      + '<div class="rc-gated">' + rcFilters() + view + '</div>'
      + (rcUnlocked ? '' : rcPaywall())
    + '</div>';
}

/* ── Explore ──────────────────────────────────────────────────────────────── */

var RC_ROUNDS = [
  { v:1,    label:'Whole yd\u00b3' },
  { v:0.5,  label:'Half yd\u00b3' },
  { v:0.25, label:'Quarter yd\u00b3' },
  { v:0,    label:'None' }
];

function rcSettingsCard() {
  return '<div class="am-card rc-settings">'
    + '<div class="rc-settings-cap">' + RC_I.gear
      + 'Billing settings<span>Set once \u00b7 changes what is billable, not what is shown</span></div>'
    + '<div class="rc-settings-row">'
      + '<div class="in-f"><label class="in-f-l">Max no. pours'
        + rcTip('Two pours or fewer is the recommendation. Every stop and start of the drum costs the returned-volume estimate accuracy, so loads above this are held out of billing.') + '</label>'
        + vfDd({ id:'rc-dd-pours', options:[{ v:0, label:'0' }, { v:1, label:'1' }, { v:2, label:'2' }, { v:3, label:'3' }],
                 value:rcSettings.maxPours, search:false, onChange:'rcSetPours' }) + '</div>'
      + '<div class="in-f"><label class="in-f-l">Volume accuracy buffer'
        + rcTip('A cushion in cubic yards taken off every returned amount before billing. It is how much you trust the estimate. A load that falls to zero leaves billing rather than billing at zero.') + '</label>'
        + vfDd({ id:'rc-dd-buffer', options:[{ v:0, label:'0 yd\u00b3' }, { v:1, label:'1 yd\u00b3' }, { v:2, label:'2 yd\u00b3' }, { v:3, label:'3 yd\u00b3' }],
                 value:rcSettings.buffer, search:false, onChange:'rcSetBuffer' }) + '</div>'
      + '<div class="in-f rc-f-round"><label class="in-f-l">Round returned concrete to nearest'
        + rcTip('How the returned volume reaches the customer: billed per whole, half or quarter yard, or the exact measured amount. Always rounds down.') + '</label>'
        + '<div class="rc-seg">' + RC_ROUNDS.map(function (o) {
            return '<button class="rc-seg-btn' + (rcSettings.round === o.v ? ' on' : '') + '" onclick="rcSetRound(' + o.v + ')">' + o.label + '</button>';
          }).join('') + '</div></div>'
    + '</div></div>';
}

var RC_COLS = [
  ['Ticket number', ''], ['Load date', ''], ['Customer', ''], ['Return location', ''],
  ['Load size', 'num'], ['Returned', 'num'], ['Pours', 'num'], ['Amount to bill', 'num']
];
var RC_COLS_REMOVED = [
  ['Ticket number', ''], ['Load date', ''], ['Customer', ''], ['Return location', ''],
  ['Load size', 'num'], ['Returned', 'num'], ['Pours', 'num'], ['Reason', 'rc-reason']
];

function rcTabs() {
  var n = { partial: rcRows('partial').length, full: rcRows('full').length, removed: rcRows('removed').length };
  var lab = { partial:'Partial loads', full:'Full loads', removed:'Removed' };
  return '<div class="rc-tabs">'
    + ['partial', 'full', 'removed'].map(function (k) {
        return '<button class="rc-tab' + (rcSet === k ? ' active' : '') + '" onclick="rcTab(\'' + k + '\')">'
          + lab[k] + '<span class="rc-tab-n">' + n[k] + '</span></button>';
      }).join('')
    + '</div>';
}

function rcRowHtml(r, i) {
  var bill = rcBill(r);
  var removed = rcSet === 'removed';
  return '<div class="am-tr rc-tr' + (removed ? ' rc-tr--removed' : '') + (i % 2 ? ' zebra' : '') + '" onclick="rcOpenLoad(\'' + r.ticket + '\')">'
    + '<span><button class="rc-link">' + r.ticket + '</button></span>'
    + '<span class="rc-stack"><b>' + r.loadT + '</b><em>' + r.date + ' \u00b7 Order ' + r.order + '</em></span>'
    + '<span class="rc-stack"><b>' + rcEsc(r.customer) + '</b><em title="' + rcEsc(r.addr) + '">' + rcEsc(r.addr) + '</em></span>'
    + '<span class="rc-stack"><b>' + rcEsc(r.ret) + '</b>'
      + (r.dischargeType === 'dump' ? '<em class="rc-dump">Dump site</em>' : '') + '</span>'
    + '<span class="num">' + r.size + ' yd\u00b3</span>'
    + '<span class="num">' + r.returned.toFixed(2) + ' yd\u00b3</span>'
    + '<span class="num">' + r.pours + '</span>'
    + (removed
        ? '<span class="rc-reason"><span>' + rcEsc(rcRemoved[r.ticket]) + '</span>'
          + '<button class="rc-link" onclick="event.stopPropagation();rcRestore(\'' + r.ticket + '\')">Restore</button></span>'
        : '<span class="num rc-bill">' + (bill === null ? '\u2014' : bill.toFixed(2) + ' yd\u00b3') + '</span>')
    + '</div>';
}

function rcTableHtml() {
  var rows = rcRows();
  var removed = rcSet === 'removed';
  var cols = removed ? RC_COLS_REMOVED : RC_COLS;
  var head = '<div class="am-tr am-th rc-tr' + (removed ? ' rc-tr--removed' : '') + '">' + cols.map(function (c) {
    return '<span' + (c[1] ? ' class="' + c[1] + '"' : '') + '>' + c[0] + '</span>';
  }).join('') + '</div>';

  if (!rows.length) {
    return '<div class="am-table rc-table">' + head + '</div>'
      + '<div class="rc-empty">' + (removed
          ? 'Nothing removed. Loads you take out of returned concrete land here and can be restored.'
          : 'No billable loads match these settings. Raising the max pour count or lowering the accuracy buffer will bring loads back.') + '</div>';
  }
  return '<div class="am-table rc-table">' + head
    + rows.map(function (r, i) { return rcRowHtml(r, i); }).join('')
    + '</div>'
    + '<div class="rc-foot"><span>' + rows.length + (rows.length === 1 ? ' load' : ' loads') + '</span>'
    + (removed
        ? '<span>Removed loads never bill and are excluded from the insights above</span>'
        : '<span>Total to bill <b>' + rcYd(rcTotal(rows)) + '</b></span>')
    + '</div>';
}

/* Mobile portrait card stack. Both markups are rendered and CSS picks one,
   which is how the Status table handles the same problem. */
function rcCardsHtml() {
  var rows = rcRows();
  if (!rows.length) return '';
  var removed = rcSet === 'removed';
  return '<div class="rc-cards">' + rows.map(function (r) {
    var bill = rcBill(r);
    return '<div class="rc-card" onclick="rcOpenLoad(\'' + r.ticket + '\')">'
      + '<div class="rc-card-top"><button class="rc-link">' + r.ticket + '</button>'
        + '<span class="rc-card-bill">' + (removed ? 'Removed' : bill === null ? '\u2014' : bill.toFixed(2) + ' yd\u00b3') + '</span></div>'
      + '<div class="rc-card-cust">' + rcEsc(r.customer) + '</div>'
      + '<div class="rc-card-addr">' + rcEsc(r.addr) + '</div>'
      + '<div class="rc-card-meta">'
        + '<span>' + r.returned.toFixed(2) + ' of ' + r.size + ' yd\u00b3 back</span>'
        + '<span>' + r.pours + ' pour' + (r.pours === 1 ? '' : 's') + '</span>'
        + '<span>' + (removed ? rcEsc(rcRemoved[r.ticket]) : rcEsc(r.ret) + (r.dischargeType === 'dump' ? ' \u00b7 dump site' : '')) + '</span>'
      + '</div></div>';
  }).join('') + '</div>';
}

function rcExploreHtml() {
  return rcSettingsCard()
    + '<div id="rc-tabs">' + rcTabs() + '</div>'
    + '<div class="am-table-wrap rc-table-wrap" id="rc-table">' + rcTableHtml() + rcCardsHtml() + '</div>';
}

/* ── Invoicing ────────────────────────────────────────────────────────────── */

function rcInvoicingHtml() {
  var inv = rcInvoices();
  var head = '<div class="am-tr am-th rc-tr rc-tr--inv"><span>Invoice</span><span>Customer</span><span class="num">Loads</span>'
    + '<span class="num">Volume</span><span class="num">Rate</span><span class="num">Amount</span><span>Status</span></div>';
  var rows = inv.map(function (v, i) {
    return '<div class="am-tr rc-tr rc-tr--inv' + (i % 2 ? ' zebra' : '') + '" onclick="rcOpenInvoice(\'' + rcAttr(v.customer) + '\')">'
      + '<span><button class="rc-link">' + v.id + '</button></span>'
      + '<span>' + rcEsc(v.customer) + '</span>'
      + '<span class="num">' + v.loads.length + '</span>'
      + '<span class="num">' + rcYd(v.volume) + '</span>'
      + '<span class="num">' + rcMoney(rcRate) + ' / yd\u00b3</span>'
      + '<span class="num rc-bill">' + rcMoney(v.amount) + '</span>'
      + '<span>' + (v.status === 'billed' ? '<span class="am-tag am-tag-success">Billed</span>' : '<span class="am-tag">Pending</span>') + '</span>'
      + '</div>';
  }).join('');
  var total = inv.reduce(function (a, v) { return a + v.amount; }, 0);
  if (!inv.length) return '<div class="am-table rc-table">' + head + '</div><div class="rc-empty">Nothing to invoice on this date with these settings.</div>';
  return '<div class="am-table-wrap rc-table-wrap"><div class="am-table rc-table">' + head + rows + '</div>'
    + '<div class="rc-foot"><span>' + inv.length + (inv.length === 1 ? ' invoice' : ' invoices') + ' \u00b7 load date 08/11/2026</span>'
    + '<span>Total <b>' + rcMoney(total) + '</b></span></div></div>';
}

/* ── Real time ────────────────────────────────────────────────────────────── */

function rcFlagCount(u) { return Object.keys(u.flags).reduce(function (a, k) { return a + (u.flags[k] ? 1 : 0); }, 0); }
function rcFlagNames(u) { return Object.keys(u.flags).filter(function (k) { return u.flags[k]; }).map(function (k) { return RC_FLAG_NAME[k]; }); }
function rcUpcomingSorted() { return RC_UPCOMING.slice().sort(function (a, b) { return rcFlagCount(b) - rcFlagCount(a); }); }

function rcRealtimeHtml() {
  var head = '<div class="am-tr am-th rc-tr rc-tr--rt"><span>Ticket</span><span>ETA</span><span>Customer</span><span>Driver</span>'
    + '<span>Plant</span><span>Mix</span><span class="num">Ordered</span><span>Return risk</span></div>';
  var rows = rcUpcomingSorted().map(function (u, i) {
    var n = rcFlagCount(u);
    return '<div class="am-tr rc-tr rc-tr--rt' + (i % 2 ? ' zebra' : '') + '" onclick="rcOpenUpcoming(\'' + u.ticket + '\')">'
      + '<span class="rc-stack"><button class="rc-link">' + u.ticket + '</button><em>Order ' + u.order + '</em></span>'
      + '<span>' + u.eta + '</span>'
      + '<span>' + rcEsc(u.customer) + '</span>'
      + '<span class="rc-stack"><b>' + rcEsc(u.driver) + '</b><em>Truck ' + u.truck + '</em></span>'
      + '<span>' + rcEsc(u.plant) + '</span>'
      + '<span><button class="rc-link">' + u.mix + '</button></span>'
      + '<span class="num">' + rcYd1(u.vol) + '</span>'
      + '<span class="rc-risk">' + (n ? '<span class="rc-badge">' + RC_I.warn + n + '</span><em>' + rcFlagNames(u).join(' \u00b7 ') + '</em>' : '<em>\u2014</em>') + '</span>'
      + '</div>';
  }).join('');

  var widget = function (title, col, data, max) {
    return '<div class="am-card rc-widget"><div class="rc-widget-h"><span class="rc-widget-t">' + title + '</span><span class="rc-widget-s">Last 30 days</span></div>'
      + '<div class="rc-mini">'
      + '<div class="rc-mini-r rc-mini-h"><span>' + col + '</span><span class="num">yd\u00b3</span><span></span><span class="num">%</span></div>'
      + data.map(function (d) {
          return '<div class="rc-mini-r"><span>' + rcEsc(d[0]) + '</span><span class="num">' + d[1] + '</span>'
            + '<span><span class="rc-bar"><i style="width:' + Math.round(d[1] / max * 100) + '%"></i></span></span>'
            + '<span class="num">' + d[2].toFixed(1) + '%</span></div>';
        }).join('')
      + '</div></div>';
  };

  return '<div class="rc-sec-h rc-sec-h--rt"><div><div class="rc-widget-t">Upcoming loads to keep an eye on</div>'
      + '<div class="rc-sec-s">Loads on today\u2019s board with signals that concrete is likely to come back. Check the order is needed and the volume is right before the truck leaves.</div></div>'
      + '<span class="rc-sec-s rc-updated">Updated just now</span></div>'
    + '<div class="am-table-wrap rc-table-wrap"><div class="am-table rc-table">' + head + rows + '</div>'
    + '<div class="rc-foot"><span>' + RC_UPCOMING.length + ' loads in the next 3 hours</span><span>'
      + RC_UPCOMING.filter(function (u) { return rcFlagCount(u); }).length + ' flagged</span></div></div>'
    + '<div class="rc-widgets">'
      + widget('Top customers returning concrete', 'Customer', RC_TOP.customers, 171)
      + widget('Top mixes returned', 'Mix', RC_TOP.mixes, 156)
      + widget('Top plants with returns', 'Plant', RC_TOP.plants, 487)
    + '</div>';
}

/* ── Interactions: page ───────────────────────────────────────────────────── */

function rcUnlock() {
  rcUnlocked = true;
  rcRender();
  rcToast('Returned Concrete Insights unlocked for this session');
}
function rcGoView(v) { rcView = v; rcRender(); }
function rcTab(set) { rcSet = set; rcRender(); }
function rcSetPours(v) { rcSettings.maxPours = +v; rcRender(); }
function rcSetBuffer(v) { rcSettings.buffer = +v; rcRender(); }
function rcSetRound(v) { rcSettings.round = +v; rcRender(); }
function rcPickCustomer(v) { rcCustomer = v || ''; rcRender(); }
function rcDates() { rcToast('Prototype \u2014 the date picker is not built yet'); }
function rcDownloadAll() {
  rcToast('Prototype \u2014 would export ' + rcRows('partial').length + ' partial and '
    + rcRows('full').length + ' full loads for this date range');
}

/* ── Drawer ───────────────────────────────────────────────────────────────
   The account module's drawer, not a new one: same scrim, same panel, same
   slide. It mounts at .phone level like #am-truck-drawer so it stays inside
   whichever device frame is showing. */

function rcDrawerHost() {
  var el = document.getElementById('rc-drawer');
  if (el) return el;
  var anchor = document.getElementById('am-truck-drawer');
  var parent = anchor ? anchor.parentNode : (document.querySelector('.phone') || document.body);
  el = document.createElement('div');
  el.id = 'rc-drawer';
  el.className = 'am-out';
  parent.appendChild(el);
  return el;
}

function rcDrawerOpen(kind, key, title, sub, bodyHtml) {
  rcDrawer = { kind:kind, key:key };
  var host = rcDrawerHost();
  host.innerHTML = '<div class="am-scrim" onclick="rcDrawerClose()"></div>'
    + '<div class="am-drawer rc-dr">'
      + '<div class="am-dr-head"><div><div class="am-dr-title rc-dr-title" id="rc-dr-title">' + title + '</div>'
        + '<div class="am-dr-sub rc-dr-sub" id="rc-dr-sub">' + sub + '</div></div>'
        + '<button class="am-dr-x" onclick="rcDrawerClose()" title="Close">\u00d7</button></div>'
      + '<div class="am-dr-body rc-dr-body" id="rc-dr-body">' + bodyHtml + '</div>'
    + '</div>';
  host.style.display = 'flex';
  host.classList.remove('am-out');
}

function rcDrawerBody(title, sub, html) {
  var t = document.getElementById('rc-dr-title'), s = document.getElementById('rc-dr-sub'), b = document.getElementById('rc-dr-body');
  if (t) t.innerHTML = title;
  if (s) s.innerHTML = sub;
  if (b) b.innerHTML = html;
}

function rcDrawerClose() {
  var host = document.getElementById('rc-drawer');
  if (!host) return;
  host.classList.add('am-out');
  rcDrawer = null;
  setTimeout(function () { if (host.classList.contains('am-out')) { host.style.display = 'none'; host.innerHTML = ''; } }, 240);
}

/* ── Readings ─────────────────────────────────────────────────────────────
   The ticket's phase readings, the same table the ticket drawer's Status tab
   shows. Mock, generated from the load record so the story is consistent with
   the receipt: batched at the plant, slump drifting down on the way out, the
   load size stepping down once per pour, and the returned volume riding back
   on the Return to plant leg. Newest phase first, as the Status tab does. */

var RC_READ_COLS = ['Date & Time', 'Status', 'Actual slump', 'Target slump', 'Water added', 'Fluid event', 'Admix added', 'Total revs', 'Temp', 'Load size'];
var RC_TARGET_SLUMP = { M4000AE:5.0, M3000:4.0, M3500F:6.0, M4500HP:5.5, M5000SL:8.0 };
var RC_PHASES = [
  ['waiting-to-load', 'Waiting to load'], ['loading', 'Loading'], ['loaded', 'Loaded'], ['to-job', 'To job'],
  ['on-site', 'On site'], ['pouring', 'Pouring'], ['washing', 'Washing'], ['return-to-plant', 'Return to plant'], ['ignition-off', 'Ignition off']
];

function rcClock(mins) {
  mins = ((mins % 1440) + 1440) % 1440;
  var h = Math.floor(mins / 60), m = mins % 60, ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
}
function rcDur(mins) { return mins >= 60 ? Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm' : mins + 'm'; }

/* Deterministic per ticket, so re-opening a load shows the same readings. */
function rcSeed(t) { var h = 0; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 9973; return function () { h = (h * 7919 + 13) % 9973; return h / 9973; }; }

function rcReadings(r) {
  var rnd = rcSeed(r.ticket);
  var t0 = rcMinutes(r.batchT), tJob = rcMinutes(r.arriveT), tEnd = rcMinutes(r.recvT);
  var target = RC_TARGET_SLUMP[r.mix] || 5.0;
  var poured = r.size - r.returned;
  var perPour = r.pours ? poured / r.pours : 0;
  var slump = target + 1.4 + rnd() * 0.6;    /* comes off the plant wet, tightens on the road */
  var revs = 0, temp = 88 + Math.round(rnd() * 6), load = r.size, water = 0;
  var groups = [];

  function row(time, status, opts) {
    opts = opts || {};
    revs += opts.revs || 0;
    if (opts.slump != null) slump = opts.slump;
    return { time:time, status:status, slump:slump, target:target, water:opts.water || 0, fluid:opts.fluid || '', admix:opts.admix || '', revs:revs, temp:temp, load:load };
  }
  function group(key, label, from, to, rows) { groups.push({ key:key, label:label, dur:Math.max(1, to - from), rows:rows }); }

  /* Waiting to load: the drum is empty, readings are placeholders. */
  group('waiting-to-load', 'Waiting to load', t0 - 9, t0 - 1, [
    { time:t0 - 9, status:'Waiting', dash:true }, { time:t0 - 4, status:'Waiting', dash:true }
  ]);
  /* Loading: water goes in, slump reads high, revs start. */
  var w = 0.4 + Math.round(rnd() * 3) / 10;
  group('loading', 'Loading', t0, t0 + 6, [
    row(t0,     'Loading', { revs:22, water:w }),
    row(t0 + 3, 'Loading', { revs:40, water:w, slump:slump - 0.2 }),
    row(t0 + 6, 'Loading', { revs:38, slump:slump - 0.3 })
  ]);
  group('loaded', 'Loaded', t0 + 6, t0 + 10, [ row(t0 + 8, 'Loaded', { revs:16, slump:slump - 0.3 }) ]);
  /* To job: one reading every ~6 minutes, slump easing toward target. */
  var toJob = [], span = Math.max(6, tJob - (t0 + 10)), n = Math.max(2, Math.round(span / 6));
  for (var i = 0; i < n; i++) {
    var tt = t0 + 10 + Math.round(span * i / (n - 1 || 1));
    toJob.push(row(tt, 'In transit', { revs:20 + Math.round(rnd() * 8), slump:Math.max(target - 0.3, slump - 0.35) }));
  }
  group('to-job', 'To job', t0 + 10, tJob, toJob);
  group('on-site', 'On site', tJob, tJob + 8, [
    row(tJob,     'Arrived', { revs:12 }),
    row(tJob + 5, 'Arrived', { revs:14, admix:(rnd() > 0.5 ? '8 oz' : ''), fluid:(rnd() > 0.6 ? 'Water' : ''), water:(rnd() > 0.6 ? 0.2 : 0) })
  ]);
  /* Pouring: load size steps down once per pour. This is the column that
     makes the returned volume legible. */
  var pourRows = [], tp = tJob + 8;
  for (var k = 0; k < r.pours; k++) {
    pourRows.push(row(tp, 'Pouring', { revs:30 + Math.round(rnd() * 10) }));
    load = Math.max(r.returned, load - perPour);
    tp += 6;
    pourRows.push(row(tp, 'Pouring', { revs:26 }));
    tp += 4;
  }
  load = r.returned;
  if (r.pours) group('pouring', 'Pouring', tJob + 8, tp, pourRows);
  else group('pouring', 'Pouring', tJob + 8, tJob + 9, [ row(tJob + 8, 'No pour', { revs:6 }) ]);
  group('washing', 'Washing', tp, tp + 3, [ row(tp + 1, 'Washing', { revs:9, water:0.1 }) ]);
  /* Return to plant: what rides back is what bills. */
  var back = [], tb0 = tp + 3, bspan = Math.max(4, (tEnd - 2) - tb0), m = Math.max(2, Math.round(bspan / 6));
  for (var q = 0; q < m; q++) {
    var tq = tb0 + Math.round(bspan * q / (m - 1 || 1));
    back.push(row(tq, 'Returning', { revs:18 + Math.round(rnd() * 6), slump:Math.max(target - 1.2, slump - 0.25) }));
  }
  group('return-to-plant', 'Return to plant', tb0, tEnd - 1, back);
  group('ignition-off', 'Ignition off', tEnd - 1, tEnd, [ row(tEnd, r.dischargeType === 'dump' ? 'Discharged at dump site' : 'Discharged at plant', { revs:4 }) ]);
  return groups.reverse();
}

var rcReadOpen = {};   /* phase key -> collapsed? (open by default) */
function rcReadToggle(key) {
  rcReadOpen[key] = !rcReadOpen[key];
  var g = document.querySelector('.rc-rd-group[data-key="' + key + '"]');
  if (g) g.classList.toggle('collapsed', !!rcReadOpen[key]);
}

function rcReadingsHtml(r) {
  var groups = rcReadings(r);
  var head = '<div class="rc-rd-row rc-rd-head">' + RC_READ_COLS.map(function (c, i) {
    return '<span' + (i >= 2 ? ' class="num"' : '') + '>' + c + '</span>';
  }).join('') + '</div>';
  var body = groups.map(function (g) {
    var rows = g.rows.map(function (x, i) {
      if (x.dash) {
        return '<div class="rc-rd-row' + (i % 2 ? ' zebra' : '') + '"><span class="rc-rd-time"><b>' + rcClock(x.time) + '</b><em>' + r.date + '</em></span>'
          + '<span>' + x.status + '</span>' + '<span class="num">\u2014</span>'.repeat(8) + '</div>';
      }
      var off = Math.abs(x.slump - x.target) > 1.0;
      return '<div class="rc-rd-row' + (i % 2 ? ' zebra' : '') + '">'
        + '<span class="rc-rd-time"><b>' + rcClock(x.time) + '</b><em>' + r.date + '</em></span>'
        + '<span>' + x.status + '</span>'
        + '<span class="num"><span class="rc-rd-slump' + (off ? ' off' : '') + '">' + x.slump.toFixed(2) + ' in</span></span>'
        + '<span class="num">' + x.target.toFixed(2) + ' in</span>'
        + '<span class="num">' + (x.water ? x.water.toFixed(1) + ' gal/yd\u00b3' : '\u2014') + '</span>'
        + '<span class="num">' + (x.fluid || '\u2014') + '</span>'
        + '<span class="num">' + (x.admix || '\u2014') + '</span>'
        + '<span class="num">' + x.revs.toLocaleString('en-US') + '</span>'
        + '<span class="num">' + x.temp + '\u00b0F</span>'
        + '<span class="num rc-rd-load">' + (Math.round(x.load * 100) / 100) + ' yd\u00b3</span>'
        + '</div>';
    }).join('');
    return '<div class="rc-rd-group' + (rcReadOpen[g.key] ? ' collapsed' : '') + '" data-key="' + g.key + '">'
      + '<button class="rc-rd-gh" onclick="rcReadToggle(\'' + g.key + '\')">' + RC_I.chev
        + '<span class="dc-tc-phase-chip ' + g.key + '">' + g.label + '</span>'
        + '<span class="rc-rd-dur">' + rcDur(g.dur) + '</span>'
        + (g.key === 'return-to-plant' ? '<span class="rc-rd-note">' + r.returned.toFixed(2) + ' yd\u00b3 aboard</span>' : '')
        + (g.key === 'pouring' ? '<span class="rc-rd-note">' + r.pours + ' pour' + (r.pours === 1 ? '' : 's') + ' \u00b7 ' + (r.size - r.returned).toFixed(2) + ' yd\u00b3 placed</span>' : '')
      + '</button><div class="rc-rd-rows">' + rows + '</div></div>';
  }).join('');
  return '<div class="rc-rd-wrap"><div class="rc-rd">' + head + body + '</div></div>';
}

/* ── Drawer: load detail ──────────────────────────────────────────────────── */

function rcReceipt(r) {
  var bill = rcBill(r);
  var poured = r.size - r.returned;
  var dis = r.dischargeType === 'dump' ? r.dumpName : r.plantName;
  var removed = !!rcRemoved[r.ticket];
  var step = function (dot, k, v, m) {
    return '<div class="rc-rc-step"><div class="rc-rc-k"><span class="rc-dot ' + dot + '"></span>' + k + '</div>'
      + '<div class="rc-rc-v">' + v + '</div><div class="rc-rc-m" title="' + rcEsc(m) + '">' + rcEsc(m) + '</div></div>';
  };
  return '<div class="rc-receipt rc-receipt--card">'
    + step('rc-dot-plant', 'Batched', r.batchT + ' \u00b7 ' + r.size + ' yd\u00b3', r.plantName)
    + step('rc-dot-job', 'Poured', poured.toFixed(2) + ' yd\u00b3 \u00b7 ' + r.pours + ' pour' + (r.pours === 1 ? '' : 's'), 'Arrived ' + r.arriveT + ' \u00b7 ' + r.jobName)
    + step('rc-dot-dis', 'Discharged', r.recvT + ' \u00b7 ' + r.returned.toFixed(2) + ' yd\u00b3', dis + (r.dischargeType === 'dump' ? ' (dump site)' : ''))
    + '<div class="rc-rc-bill"><div class="rc-rc-k">Bill ' + rcEsc(r.customer) + '</div>'
      + '<div class="rc-rc-v">' + (removed || bill === null ? '\u2014' : bill.toFixed(2) + ' yd\u00b3') + '</div>'
      + '<div class="rc-rc-m">' + (removed ? 'Removed from returned concrete' : bill === null ? 'Below the billing threshold'
          : (rcSettings.buffer || rcSettings.round) ? 'After buffer and rounding' : 'Exact measured amount') + '</div></div>'
    + '</div>';
}

function rcLoadBody(r) {
  var reason = rcRemoved[r.ticket];
  return (reason ? '<div class="rc-d-alert">' + RC_I.warn + '<span><b>Removed from returned concrete</b> \u00b7 ' + rcEsc(reason) + '. It no longer bills or counts toward the insights.</span></div>' : '')
    + '<div class="rc-d-grid">'
      + '<div><div class="rc-d-k">Truck</div><div class="rc-d-v"><button class="rc-link" onclick="rcToast(\'Prototype \\u2014 would open truck ' + r.truck + ' in the Diagnostic Center\')">' + r.truck + '</button></div></div>'
      + '<div><div class="rc-d-k">Mix</div><div class="rc-d-v"><button class="rc-link" onclick="rcToast(\'Prototype \\u2014 would open mix ' + r.mix + '\')">' + r.mix + '</button></div></div>'
      + '<div><div class="rc-d-k">Return location</div><div class="rc-d-v">' + rcEsc(r.ret) + '<small>' + (r.dischargeType === 'dump' ? 'Discharged at dump site' : 'Discharged at plant') + '</small></div></div>'
      + '<div><div class="rc-d-k">Load \u2192 received</div><div class="rc-d-v">' + r.loadT + ' \u2192 ' + r.recvT + '<small>' + Math.max(0, rcMinutes(r.recvT) - rcMinutes(r.batchT)) + ' min plant to plant</small></div></div>'
    + '</div>'
    + '<div class="rc-d-sec">Receipt</div>'
    + rcReceipt(r)
    + '<div class="rc-d-sec rc-d-sec--row"><span>Readings by phase</span>'
      + '<span class="rc-d-sec-r">' + RC_READ_COLS.length + ' columns \u00b7 newest phase first</span></div>'
    + rcReadingsHtml(r)
    + '<div class="rc-d-sec">Confirm</div>'
    + '<p class="rc-d-p">The trail is the receipt: batched at <b>' + rcEsc(r.plantName) + '</b>, poured <b>' + (r.size - r.returned).toFixed(2) + ' yd\u00b3</b> at <b>' + rcEsc(r.jobName)
      + '</b>, then <b>' + r.returned.toFixed(2) + ' yd\u00b3</b> came back and was discharged at <b>' + rcEsc(r.dischargeType === 'dump' ? r.dumpName : r.plantName) + '</b>. '
      + (reason ? 'Restore it if this now looks right.' : 'If the route or the volumes look wrong, remove it and it drops out of billing and the invoice.') + '</p>'
    + '<div class="rc-d-actions">'
      + (reason
          ? '<button class="am-pill" onclick="rcRestore(\'' + r.ticket + '\')">Restore to returned concrete</button>'
          : '<button class="am-pill rc-danger" onclick="rcAskRemove(\'' + r.ticket + '\')">Remove from returned concrete</button>')
      + '<button class="am-pill" onclick="rcToast(\'Prototype \\u2014 would download ticket ' + r.ticket + ' as CSV\')">' + RC_I.down + 'Download ticket data</button>'
      + '<button class="rc-ghost" onclick="rcToast(\'Prototype \\u2014 would open ticket ' + r.ticket + ' in Tickets\')">Open in Tickets</button>'
    + '</div>';
}

function rcOpenLoad(ticket) {
  var r = rcFind(ticket);
  if (!r) return;
  rcDrawerOpen('load', ticket,
    'Ticket ' + r.ticket + (rcRemoved[r.ticket] ? ' <span class="am-tag am-tag-warning">Removed</span>' : ''),
    rcEsc(r.customer) + ' \u2014 ' + rcEsc(r.addr),
    rcLoadBody(r));
}

/* ── Remove / restore ─────────────────────────────────────────────────────
   Destructive, so a modal, and a reason so the Removed tab explains itself
   later. Restore is a link on that tab and a quiet pill in the drawer. */

var RC_REASONS = ['Not a returned load', 'Sensor reading looks wrong', 'Customer dispute', 'Duplicate ticket', 'Other'];
var rcPendingRemove = null;

function rcModalHost() {
  var el = document.getElementById('rc-modal');
  if (el) return el;
  var anchor = document.getElementById('am-truck-drawer');
  var parent = anchor ? anchor.parentNode : (document.querySelector('.phone') || document.body);
  el = document.createElement('div');
  el.id = 'rc-modal';
  el.onclick = function (e) { if (e.target === el) rcModalClose(); };
  parent.appendChild(el);
  return el;
}

function rcAskRemove(ticket) {
  var r = rcFind(ticket);
  if (!r) return;
  rcPendingRemove = ticket;
  var host = rcModalHost();
  host.innerHTML = '<div class="rc-modal-card">'
    + '<div class="rc-modal-t">Remove ticket ' + r.ticket + ' from returned concrete?</div>'
    + '<div class="rc-modal-p"><b>' + rcYd(rcBill(r) || 0) + '</b> drops out of billing and off the invoice for <b>' + rcEsc(r.customer) + '</b>. The load stays on the Removed tab and can be restored.</div>'
    + '<div class="in-f"><label class="in-f-l">Reason</label><select class="rc-select" id="rc-remove-reason">'
      + RC_REASONS.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select></div>'
    + '<div class="rc-modal-foot"><button class="rc-ghost" onclick="rcModalClose()">Cancel</button>'
    + '<button class="am-pill rc-danger" onclick="rcConfirmRemove()">Remove load</button></div>'
    + '</div>';
  host.style.display = 'flex';
}

function rcModalClose() {
  var host = document.getElementById('rc-modal');
  if (host) { host.style.display = 'none'; host.innerHTML = ''; }
  rcPendingRemove = null;
}

function rcConfirmRemove() {
  var t = rcPendingRemove;
  if (!t) return;
  var sel = document.getElementById('rc-remove-reason');
  rcRemoved[t] = sel ? sel.value : 'Other';
  rcModalClose();
  rcDrawerClose();
  rcRender();
  rcToast('Ticket ' + t + ' removed from returned concrete');
}

function rcRestore(ticket) {
  delete rcRemoved[ticket];
  rcDrawerClose();
  if (rcSet === 'removed' && !rcRows('removed').length) rcSet = 'partial';
  rcRender();
  rcToast('Ticket ' + ticket + ' restored to returned concrete');
}

/* ── Drawer: invoice ──────────────────────────────────────────────────────── */

function rcInvoiceBody(customer) {
  var invs = rcInvoices().filter(function (v) { return !customer || v.customer === customer; });
  if (!invs.length) return '<div class="rc-empty">Nothing to invoice for this date and settings.</div>';
  var one = customer ? invs[0] : null;
  var loads = invs.reduce(function (a, v) { return a.concat(v.loads); }, []);
  var total = invs.reduce(function (a, v) { return a + v.amount; }, 0);
  var acct = (typeof rcAccountName === 'function') ? rcAccountName() : 'Cemex AZ';
  var head = '<div class="am-tr am-th rc-tr rc-tr--line' + (customer ? '' : ' rc-tr--line-all') + '"><span>Ticket</span><span>Loaded</span>'
    + (customer ? '' : '<span>Customer</span>') + '<span>Order</span><span>Returned to</span><span class="num">Load</span><span class="num">Returned</span><span class="num">Billable</span><span class="num">Amount</span></div>';
  var lines = loads.map(function (r, i) {
    var b = rcBill(r) || 0;
    return '<div class="am-tr rc-tr rc-tr--line' + (customer ? '' : ' rc-tr--line-all') + (i % 2 ? ' zebra' : '') + '">'
      + '<span><button class="rc-link" onclick="rcOpenLoad(\'' + r.ticket + '\')">' + r.ticket + '</button></span>'
      + '<span>' + r.date + ' ' + r.loadT + '</span>'
      + (customer ? '' : '<span>' + rcEsc(r.customer) + '</span>')
      + '<span>' + r.order + '</span><span>' + rcEsc(r.ret) + '</span>'
      + '<span class="num">' + r.size + ' yd\u00b3</span><span class="num">' + r.returned.toFixed(2) + ' yd\u00b3</span><span class="num">' + b.toFixed(2) + ' yd\u00b3</span>'
      + '<span class="num rc-bill">' + rcMoney(b * rcRate) + '</span></div>';
  }).join('');
  return '<div class="rc-inv">'
      + '<div class="rc-inv-head"><div><div class="rc-inv-brand">' + rcEsc(acct) + '</div>'
        + '<div class="rc-inv-meta">Ready mix \u00b7 Returned concrete charges<br>Load date <b>08/11/2026</b> \u00b7 Issued <b>09/04/2026</b></div></div>'
        + '<div class="rc-inv-meta rc-inv-to">Bill to<br><b>' + (one ? rcEsc(one.customer) : invs.length + ' customers') + '</b><br>'
        + 'Rate <span class="rc-inv-rate">$<input type="number" step="0.5" min="0" value="' + rcRate + '" onchange="rcSetRate(this.value)" aria-label="Rate per cubic yard"> / yd\u00b3</span></div></div>'
      + '<div class="am-table-wrap"><div class="am-table rc-table rc-table--inv">' + head + lines + '</div></div>'
      + '<div class="rc-inv-total"><span>' + loads.length + (loads.length === 1 ? ' load' : ' loads') + ' \u00b7 ' + rcYd(invs.reduce(function (a, v) { return a + v.volume; }, 0)) + '</span><b>' + rcMoney(total) + '</b></div>'
      + '<div class="rc-inv-note">Billable volume is the measured returned volume after your billing settings (max ' + rcSettings.maxPours + ' pour' + (rcSettings.maxPours === 1 ? '' : 's')
        + ', ' + rcSettings.buffer + ' yd\u00b3 buffer' + (rcSettings.round ? ', rounded down to the nearest ' + rcSettings.round + ' yd\u00b3' : ', no rounding') + '). Loads removed from returned concrete are not included.</div>'
    + '</div>'
    + '<div class="rc-d-actions">'
      + '<button class="am-primary" onclick="rcToast(\'Prototype \\u2014 would download ' + (one ? one.id : 'the statement') + ' as PDF\')">' + RC_I.down + 'Download PDF</button>'
      + (one ? '<button class="am-pill" onclick="rcToggleBilled(\'' + rcAttr(one.customer) + '\')">' + (one.status === 'billed' ? 'Mark as pending' : 'Mark as billed') + '</button>' : '')
      + '<button class="rc-ghost" onclick="rcToast(\'Prototype \\u2014 would email the invoice to the customer contact\')">Email to customer</button>'
    + '</div>';
}

function rcInvoiceTitle(customer) {
  var invs = rcInvoices().filter(function (v) { return !customer || v.customer === customer; });
  var one = customer ? invs[0] : null;
  return {
    t: one ? one.id + (one.status === 'billed' ? ' <span class="am-tag am-tag-success">Billed</span>' : ' <span class="am-tag">Pending</span>') : 'Invoice statement',
    s: one ? rcEsc(one.customer) + ' \u2014 returned concrete, load date 08/11/2026' : invs.length + ' customers \u2014 returned concrete, load date 08/11/2026'
  };
}

function rcOpenInvoice(customer) {
  var h = rcInvoiceTitle(customer);
  rcDrawerOpen('invoice', customer, h.t, h.s, rcInvoiceBody(customer));
}

function rcAccountName() {
  var el = document.querySelector('#dt-acct-name, .dt-acct-name, #acct-current');
  return el && el.textContent.trim() ? el.textContent.trim() : 'Cemex AZ';
}

function rcSetRate(v) {
  rcRate = Math.max(0, +v || 0);
  rcRender();
  if (rcDrawer && rcDrawer.kind === 'invoice') { var h = rcInvoiceTitle(rcDrawer.key); rcDrawerBody(h.t, h.s, rcInvoiceBody(rcDrawer.key)); }
}

function rcToggleBilled(customer) {
  var cur = rcInvoices().filter(function (v) { return v.customer === customer; })[0];
  if (!cur) return;
  rcInvoiceStatus[customer] = cur.status === 'billed' ? 'pending' : 'billed';
  rcRender();
  var h = rcInvoiceTitle(customer);
  rcDrawerBody(h.t, h.s, rcInvoiceBody(customer));
  rcToast(cur.id + ' marked as ' + rcInvoiceStatus[customer]);
}

/* ── Drawer: stat trend ───────────────────────────────────────────────────── */

function rcChart(values, unit) {
  var W = 760, H = 260, padL = 56, padR = 20, padT = 20, padB = 34;
  var max = Math.max.apply(null, values) * 1.15, min = 0;
  var x = function (i) { return padL + (W - padL - padR) * (i / (values.length - 1)); };
  var y = function (v) { return padT + (H - padT - padB) * (1 - (v - min) / (max - min)); };
  var pts = values.map(function (v, i) { return [x(i), y(v)]; });
  var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
  var area = d + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + y(0) + ' L' + pts[0][0].toFixed(1) + ' ' + y(0) + ' Z';
  var grid = [0, .25, .5, .75, 1].map(function (f) {
    var v = min + (max - min) * f, yy = y(v);
    var lab = v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k' : Math.round(v);
    return '<line class="grid" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + yy + '" y2="' + yy + '"/><text class="axis" x="' + (padL - 10) + '" y="' + (yy + 4) + '" text-anchor="end">' + lab + '</text>';
  }).join('');
  var weeks = values.map(function (v, i) { var w = values.length - 1 - i; return '<text class="axis" x="' + x(i) + '" y="' + (H - 10) + '" text-anchor="middle">' + (w === 0 ? 'This wk' : '-' + w + 'w') + '</text>'; }).join('');
  var last = pts[pts.length - 1], lv = values[values.length - 1];
  return '<svg class="rc-chart" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' + grid + weeks
    + '<path class="area" d="' + area + '"/><path class="line" d="' + d + '"/>'
    + pts.map(function (p) { return '<circle class="pt" cx="' + p[0] + '" cy="' + p[1] + '" r="3"/>'; }).join('')
    + '<text class="val" x="' + (last[0] - 8) + '" y="' + (last[1] - 12) + '" text-anchor="end">' + lv.toLocaleString('en-US') + ' ' + unit.split(' ')[0] + '</text>'
    + '</svg>';
}

function rcStatBody(key) {
  var t = RC_TREND[key];
  var v = t.values, last = v[v.length - 1], prev = v[v.length - 2], avg = v.reduce(function (a, b) { return a + b; }, 0) / v.length;
  var delta = (last - prev) / prev * 100;
  var fmt = function (n) { return key === 'revenue' ? '$' + Math.round(n).toLocaleString('en-US') : String(Math.round(n * 10) / 10); };
  return '<div class="rc-d-grid rc-d-grid--3">'
      + '<div><div class="rc-d-k">This week</div><div class="rc-d-v">' + fmt(last) + '</div></div>'
      + '<div><div class="rc-d-k">vs last week</div><div class="rc-d-v">' + (delta > 0 ? '+' : '') + delta.toFixed(1) + '%</div></div>'
      + '<div><div class="rc-d-k">12-week average</div><div class="rc-d-v">' + fmt(avg) + '</div></div>'
    + '</div>'
    + '<div class="rc-chart-wrap' + (rcUnlocked ? '' : ' locked') + '">' + rcChart(v, t.unit)
      + (rcUnlocked ? '' : '<div class="rc-paywall"><div class="rc-paywall-card"><div class="rc-paywall-t">Trends are part of Insights</div>'
          + '<div class="rc-paywall-p">Unlock to see how this number has moved and which customers, mixes, and plants drive it.</div>'
          + '<button class="am-primary rc-unlock" onclick="rcUnlock();rcOpenStat(\'' + key + '\')">Unlock Returned Concrete Insights</button></div></div>')
    + '</div>'
    + (rcUnlocked ? '<div class="rc-d-sec">What moves it</div><p class="rc-d-p">'
        + (key === 'revenue' ? 'Every yd\u00b3 confirmed on the Explore view and invoiced adds to this line. Loads removed from returned concrete are excluded.'
          : key === 'volume' ? 'Three customers account for two thirds of the volume. Rincon Structures and Old Pueblo Construction are both on today\u2019s Real time board.'
          : key === 'hours' ? 'Time from batch to discharge back at the plant, summed across returned loads. Dump-site discharges run shorter than plant returns.'
          : 'Drum turns while returned concrete is aboard, a proxy for wear and fuel. Tracks driver hours closely.') + '</p>' : '');
}

function rcOpenStat(key) {
  var t = RC_TREND[key];
  rcDrawerOpen('stat', key, t.label, 'Impact at a glance \u00b7 12 weeks \u00b7 ' + t.unit, rcStatBody(key));
}

/* ── Drawer: upcoming load ────────────────────────────────────────────────── */

function rcUpcomingBody(u) {
  var flags = Object.keys(u.flags).filter(function (k) { return u.flags[k]; });
  return '<div class="rc-d-grid">'
      + '<div><div class="rc-d-k">Driver</div><div class="rc-d-v">' + rcEsc(u.driver) + '</div></div>'
      + '<div><div class="rc-d-k">Truck</div><div class="rc-d-v"><button class="rc-link" onclick="rcToast(\'Prototype \\u2014 would open truck ' + u.truck + '\')">' + u.truck + '</button></div></div>'
      + '<div><div class="rc-d-k">Mix</div><div class="rc-d-v"><button class="rc-link" onclick="rcToast(\'Prototype \\u2014 would open mix ' + u.mix + '\')">' + u.mix + '</button></div></div>'
      + '<div><div class="rc-d-k">Return risk</div><div class="rc-d-v">' + (flags.length ? '<span class="rc-badge">' + RC_I.warn + flags.length + '</span>' : '<span class="am-tag">None</span>') + '</div></div>'
    + '</div>'
    + '<div class="rc-d-sec">Why it is flagged</div>'
    + (flags.length ? '<ul class="rc-pts rc-pts--warn">' + flags.map(function (k) { return '<li>' + RC_I.warn + RC_FLAG_TEXT[k] + '</li>'; }).join('') + '</ul>'
        : '<p class="rc-d-p">No return signals on this order. It is on the board for completeness.</p>')
    + '<div class="rc-d-sec">Before it leaves</div>'
    + '<p class="rc-d-p">Confirm with dispatch that <b>' + rcYd1(u.vol) + '</b> is what the pour needs. Trimming an over-order now is cheaper than billing the return later.</p>'
    + '<div class="rc-d-actions">'
      + '<button class="am-pill" onclick="rcToast(\'Prototype \\u2014 would message ' + rcAttr(rcEsc(u.driver)) + '\')">Message driver</button>'
      + '<button class="am-pill" onclick="rcToast(\'Prototype \\u2014 would open order ' + u.order + ' in dispatch\')">Open order</button>'
      + '<button class="rc-ghost" onclick="rcDrawerClose();rcToast(\'Ticket ' + u.ticket + ' dismissed from the watch list for today\')">Dismiss for today</button>'
    + '</div>';
}

function rcOpenUpcoming(ticket) {
  var u = RC_UPCOMING.filter(function (x) { return x.ticket === ticket; })[0];
  if (!u) return;
  rcDrawerOpen('upcoming', ticket, 'Ticket ' + u.ticket + ' <span class="am-tag">Not yet loaded</span>',
    rcEsc(u.customer) + ' \u2014 ' + rcYd1(u.vol) + ' of ' + u.mix + ' from ' + rcEsc(u.plant) + ', ETA ' + u.eta,
    rcUpcomingBody(u));
}

/* ── Render: page ─────────────────────────────────────────────────────────── */

function rcHtml() {
  return '<div class="rc-scroll">' + rcHead() + rcInsights() + rcAnalysis() + '</div>';
}

/* One renderer, three mounts. Only the active frame's mount holds markup. */
function rcHost() {
  if (rcMode === 't') return document.getElementById('rc-tb-mount');
  if (rcMode === 'm') return document.getElementById('rc-mob-mount');
  return document.getElementById('dt-page-returned');
}

function rcRender() {
  var host = rcHost();
  if (!host) return;
  var scroll = host.querySelector('.rc-scroll');
  var top = scroll ? scroll.scrollTop : 0;
  host.innerHTML = rcHtml();
  scroll = host.querySelector('.rc-scroll');
  if (scroll && top) scroll.scrollTop = top;
}

function rcTeardown() {
  rcDrawerClose();
  rcModalClose();
}

/* ── Tablet ───────────────────────────────────────────────────────────────
   The tablet shell is a stack of sibling panels rather than a router, so
   opening this page means hiding the siblings and remembering what they were,
   exactly as Insights does. Same list, same snapshot-and-restore. */

var RC_TB_SIBLINGS = ['tb-content', 'tb-page-units', 'tb-page-update', 'tb-page-map', 'tb-page-tickets',
  'tb-page-dashboard', 'tb-page-account', 'tb-page-insights', 'tb-page-header', 'tb-search-row', 'tb-tabs-row'];
var rcTbSnap = null;

function rcTabletOpen() {
  if (typeof tbNavClose === 'function') tbNavClose();
  ['ttkClose', 'dbTabletClose', 'amTabletClose', 'inTabletClose'].forEach(function (f) {
    if (typeof window[f] === 'function') window[f]();
  });
  if (rcTbSnap === null) {
    rcTbSnap = {};
    RC_TB_SIBLINGS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { rcTbSnap[id] = el.style.display; el.style.display = 'none'; }
    });
  }
  var page = document.getElementById('tb-page-returned');
  if (page) page.style.display = 'flex';
  rcMode = 't';
  rcRender();
}

function rcTabletClose() {
  var page = document.getElementById('tb-page-returned');
  if (page) page.style.display = 'none';
  var mount = document.getElementById('rc-tb-mount');
  if (mount) mount.innerHTML = '';
  if (rcTbSnap) {
    Object.keys(rcTbSnap).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = rcTbSnap[id];
    });
    rcTbSnap = null;
  }
  rcTeardown();
}

/* ── Mobile ───────────────────────────────────────────────────────────────── */

function rcMobileOpen() {
  if (typeof closeNav === 'function') closeNav();
  ['mtkClose', 'mobSwuClose', 'dbMobileClose', 'amMobileClose', 'inMobileClose'].forEach(function (f) {
    if (typeof window[f] === 'function') window[f]();
  });
  var el = document.getElementById('mob-page-returned');
  if (el) el.style.display = 'flex';
  rcMode = 'm';
  rcRender();
}

function rcMobileClose() {
  var el = document.getElementById('mob-page-returned');
  if (el) el.style.display = 'none';
  var mount = document.getElementById('rc-mob-mount');
  if (mount) mount.innerHTML = '';
  rcTeardown();
}

/* The one entry point every nav item calls, in every frame. */
function rcNav() {
  var c = document.body.classList;
  if (c.contains('view-mobile')) rcMobileOpen();
  else if (c.contains('view-tablet')) rcTabletOpen();
  else if (typeof dtNavGo === 'function') dtNavGo('returned');
}

/* Leaving for any other device page closes this one. Wrapping the other
   sections' entry points is how every device page in the suite gets put away;
   there is no shared router at this level to ask. */
(function rcHook() {
  ['tbNavSetActive', 'ttkOpen', 'dbTabletNav', 'dbTabletOpen', 'amTabletOpen', 'inTabletOpen'].forEach(function (fn) {
    if (typeof window[fn] === 'function' && !window[fn].__rcWrapped) {
      var o = window[fn];
      window[fn] = function () { rcTabletClose(); return o.apply(this, arguments); };
      window[fn].__rcWrapped = true;
    }
  });
  ['mtkOpen', 'mobSwuOpen', 'goToAllTrucks', 'snGoMap', 'dbMobileNav', 'dbMobileOpen', 'amMobileOpen', 'inMobileOpen'].forEach(function (fn) {
    if (typeof window[fn] === 'function' && !window[fn].__rcWrapped) {
      var o = window[fn];
      window[fn] = function () { rcMobileClose(); return o.apply(this, arguments); };
      window[fn].__rcWrapped = true;
    }
  });
})();

/* ── Desktop routing ──────────────────────────────────────────────────────
   Same shape as app-18: an unknown key puts the shell's core pages away,
   then this page is shown and its own nav item lit. */

function rcNavLight(on) {
  var el = document.getElementById('dt-nav-returned');
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

var RC_SIBLINGS = ['dt-page-dashboard', 'dt-page-account', 'dt-page-insights'];

function rcDeskShow() {
  rcMode = 'd';
  if (typeof dbOrigNavGo === 'function') dbOrigNavGo('__rc__');
  if (typeof dbNavLight === 'function') dbNavLight(false);
  if (typeof inNavLight === 'function') inNavLight(false);
  RC_SIBLINGS.forEach(function (id) { var el = document.getElementById(id); if (el) el.style.display = 'none'; });
  var page = document.getElementById('dt-page-returned');
  if (page) page.style.display = 'flex';
  rcNavLight(true);
  rcRender();
  /* toggleDarkMode() repaints the nav through dtNavGo(dtUnitsActivePage);
     claiming it keeps a theme flip on this page instead of navigating away. */
  try { if (typeof dtUnitsActivePage !== 'undefined') dtUnitsActivePage = 'returned'; } catch (e) {}
}

var rcOrigNavGo = (typeof dtNavGo === 'function') ? dtNavGo : null;
window.dtNavGo = function (key) {
  if (key === 'returned') { rcDeskShow(); return; }
  rcNavLight(false);
  var page = document.getElementById('dt-page-returned');
  if (page) { page.style.display = 'none'; page.innerHTML = ''; }
  rcTeardown();
  if (rcOrigNavGo) rcOrigNavGo(key);
};

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  if (document.getElementById('rc-modal') && document.getElementById('rc-modal').style.display === 'flex') { rcModalClose(); return; }
  if (rcDrawer) rcDrawerClose();
});


/* ═══ FILE: app-24-slump-tests.js ═════════════════════════════════════════════════════ */

/* ============================================================================
   app-24-slump-tests.js
   SLUMP TESTS — the Hub's Slump Test Report, rebuilt in the Trinity dialect
   ----------------------------------------------------------------------------
   First pass. Lives under Tickets in the sidebar, because a slump test is a
   measurement taken against one pour of one load, and the ticket is the object
   it hangs off. Nothing else in today's IA moved.

   The diagnosis this page is built around:

     The legacy Add Slump Test form asks the tester to type what the system
     already knows (truck, ticket, date, time) and never asks the one thing
     only the tester knows: WHICH POUR this measurement came from. That is why
     "incorrect time and/or date" is the top rejection reason. Identity is the
     payload; the measurement is three numbers.

   So the flow inverts. Instead of one long form:

     1  Load     pick the load off a live list, scoped to the plant. Trucks
                 pouring now first, then earlier today, then a date field for
                 the notebook case.
     2  Pour     pick which discharge segment. This field does not exist in
                 the legacy form. Selecting it is what sets the timestamp, so
                 the top rejection cause stops being reachable by typing.
     3  Measure  slump on a big +/- stepper in 0.25 in steps (gloves), shape,
                 then temp / unit weight / air behind a disclosure because
                 they are optional in practice.
     4  Confirm  the derived record, shown before save: everything the system
                 filled in, the Verifi reading at that moment, the delta, and
                 any validation notice. A wrong pick is caught here rather
                 than rejected downstream a day later.

   Batch entry is a peer, not a follow-up. "Do the tests get written down and
   entered at 4pm" is the common case, and a stepped wizard makes that worse,
   not better. The toolbar toggles the table for an editable grid: one date at
   the top, one row per test, load and pour as selects, tab across the
   numbers. Same validation, applied per row on save.

   Extensions, flagged for review (nothing here is in an existing design):
     - Sidebar "Quick add · slump test" button, desktop and tablet. This is
       the one piece of John's proposed IA borrowed forward, because burying
       the action in an Actions dropdown is half the discoverability problem.
       Mobile gets a FAB on the page instead of a sidebar item.
     - The pour picker itself, and the pour column in the table.
     - Submit-time validation notices (error / warning / info).

   Not built, and known: the date-range picker, the Filters popover, the
   Columns menu, Export, and the photo capture. All of them toast.

   Load order: after app-13 (vfDd), app-17 (amToast, am-* classes, the drawer
   classes) and app-21 (its dtNavGo wrapper, which this one composes with).
   Nothing in this file edits another module's globals; it wraps them.
   ========================================================================== */

/* ── Data ─────────────────────────────────────────────────────────────────────
   Trucks, tickets, mix codes and locations are taken from the production
   Slump Test Report so the before/after reads against the same universe.
   Each load carries its detected discharge segments as `pours`, which is what
   step 2 lists and what sets the test's timestamp. Belongs in shared-data.js
   the day it stops being mock. */

var SL_TODAY = '09/08/2026';
var SL_TOL = 1.5;          /* in — beyond this, measured vs Verifi is a warning */
var SL_TESTER = 'perry.leong@verificoncrete.com';

var SL_LOADS = [
  { ticket:'49616695', order:'1132', truck:'78320', driver:'Vazquez, Mario M', customer:'Yuma Ready Mix',
    mix:'1634181', mixNote:'ADMIX @ PLANT ADMIX IN TRANSIT HSHF', plant:'Yuma', size:10.5,
    ticketed:6.50, date:SL_TODAY, loadT:'05:19 AM', arriveT:'05:38 AM',
    phase:'pouring', phaseLabel:'Pouring', addr:'2200 E 24th St, Yuma',
    pours:[
      { n:1, start:'05:40 AM', end:'05:52 AM', vol:6.0, remaining:4.5, verifi:5.75, reason:'Ok' },
      { n:2, start:'06:07 AM', end:null,       vol:2.5, remaining:2.0, verifi:5.25, reason:'Ok', live:true }
    ] },
  { ticket:'49616702', order:'1141', truck:'75985', driver:'Nguyen, Anh',      customer:'Aqua Fria Ready Mix',
    mix:'1634182', mixNote:'ADMIX @ PLANT', plant:'Aqua Fria Ready Mix', size:10.25,
    ticketed:6.00, date:SL_TODAY, loadT:'04:11 AM', arriveT:'04:26 AM',
    phase:'on-site', phaseLabel:'On site', addr:'Cactus & Loop 303, Surprise',
    pours:[
      { n:1, start:'04:28 AM', end:'04:44 AM', vol:5.25, remaining:5.0, verifi:7.75, reason:'Slump unstable' }
    ] },
  { ticket:'49616708', order:'1000', truck:'75972', driver:'Cortez, Elena',    customer:'Aqua Fria Ready Mix',
    mix:'1635910', mixNote:'ADMIX IN TRANSIT', plant:'Aqua Fria Ready Mix', size:10.0,
    ticketed:7.50, date:SL_TODAY, loadT:'03:58 AM', arriveT:'04:19 AM',
    phase:'pouring', phaseLabel:'Pouring', addr:'S 99th Ave & W Olive, Peoria',
    pours:[
      { n:1, start:'04:27 AM', end:'04:41 AM', vol:4.0, remaining:6.0, verifi:8.00, reason:'Ok' },
      { n:2, start:'05:03 AM', end:null,       vol:3.5, remaining:2.5, verifi:7.25, reason:'Ok', live:true }
    ] },
  { ticket:'49616711', order:'1377', truck:'72600', driver:'Dean, Eric',       customer:'Maricopa Concrete',
    mix:'1632743', mixNote:'NO ADMIX', plant:'Maricopa', size:10.5,
    ticketed:2.00, date:SL_TODAY, loadT:'05:02 AM', arriveT:'05:21 AM',
    phase:'washing', phaseLabel:'Washing', addr:'W Honeycutt Rd, Maricopa',
    pours:[
      { n:1, start:'05:25 AM', end:'05:49 AM', vol:10.5, remaining:0, verifi:2.00, reason:'Ok' }
    ] },
  { ticket:'49616715', order:'1197', truck:'76747', driver:'Alvarez, Rosa',    customer:'San Tan Builders',
    mix:'1618211', mixNote:'ADMIX @ PLANT', plant:'San Tan', size:10.5,
    ticketed:7.50, date:SL_TODAY, loadT:'04:55 AM', arriveT:'05:08 AM',
    phase:'to-job', phaseLabel:'To job', addr:'1223 E Pecos Rd, Gilbert',
    pours:[] },
  { ticket:'49616720', order:'1135', truck:'76709', driver:'Barrett, Cole',    customer:'Yuma Ready Mix',
    mix:'1634181', mixNote:'ADMIX @ PLANT ADMIX IN TRANSIT HSHF', plant:'Yuma', size:10.5,
    ticketed:6.50, date:SL_TODAY, loadT:'04:12 AM', arriveT:'04:29 AM',
    phase:'return-to-plant', phaseLabel:'Return to plant', addr:'2200 E 24th St, Yuma',
    pours:[
      { n:1, start:'04:34 AM', end:'04:48 AM', vol:6.5, remaining:4.0, verifi:6.25, reason:'Ok' },
      { n:2, start:'05:02 AM', end:'05:14 AM', vol:4.0, remaining:0,   verifi:6.00, reason:'Ok' }
    ] },
  /* Yesterday — the notebook case. These are what a tester backfills at 4pm. */
  { ticket:'49616441', order:'1152', truck:'78318', driver:'Barrett, Cole',    customer:'Yuma Ready Mix',
    mix:'1634181', mixNote:'ADMIX @ PLANT', plant:'Yuma', size:10.5,
    ticketed:6.50, date:'09/07/2026', loadT:'06:48 AM', arriveT:'07:05 AM',
    phase:'ignition-off', phaseLabel:'Ignition off', addr:'2200 E 24th St, Yuma',
    pours:[
      { n:1, start:'07:15 AM', end:'07:31 AM', vol:5.5, remaining:5.0, verifi:6.25, reason:'Ok' },
      { n:2, start:'07:52 AM', end:'08:06 AM', vol:5.0, remaining:0,   verifi:6.00, reason:'Ok' }
    ] },
  { ticket:'49616450', order:'1361', truck:'75939', driver:'Alvarez, Rosa',    customer:'San Tan Builders',
    mix:'1555658', mixNote:'NO ADMIX', plant:'San Tan', size:10.5,
    ticketed:2.00, date:'09/07/2026', loadT:'05:44 AM', arriveT:'06:01 AM',
    phase:'ignition-off', phaseLabel:'Ignition off', addr:'E Ocotillo Rd, Chandler',
    pours:[
      { n:1, start:'06:12 AM', end:'06:40 AM', vol:10.5, remaining:0, verifi:2.00, reason:'Ok' }
    ] },
  { ticket:'49616463', order:'1118', truck:'78301', driver:'Nguyen, Anh',      customer:'Aqua Fria Ready Mix',
    mix:'1634181', mixNote:'ADMIX @ PLANT', plant:'Aqua Fria Ready Mix', size:10.5,
    ticketed:6.50, date:'09/07/2026', loadT:'01:31 AM', arriveT:'01:49 AM',
    phase:'ignition-off', phaseLabel:'Ignition off', addr:'Cactus & Loop 303, Surprise',
    pours:[
      { n:1, start:'01:58 AM', end:'02:19 AM', vol:6.0, remaining:4.5, verifi:6.25, reason:'Ok' },
      { n:2, start:'02:41 AM', end:'02:55 AM', vol:4.5, remaining:0,   verifi:6.00, reason:'Drum not in charge' }
    ] }
];

/* Tests already on the books. `flags` is what the row's status badge counts;
   it is computed at save time by slAudit and stored, so the list does not have
   to re-derive history. */
var SL_TESTS = [
  { id:'T-1041', ticket:'49616695', pour:1, date:SL_TODAY,     time:'05:40 AM', measured:6.50, shape:'true',
    temp:89, uw:'', air:'', note:'', tester:SL_TESTER, source:'field', flags:[] },
  { id:'T-1040', ticket:'49616702', pour:1, date:SL_TODAY,     time:'04:29 AM', measured:7.00, shape:'true',
    temp:91, uw:'', air:'', note:'Reading bounced while drum was charging.', tester:SL_TESTER, source:'field',
    flags:[{ sev:'warning', t:'Verifi flagged the slump as unstable across this pour.' }] },
  { id:'T-1039', ticket:'49616708', pour:1, date:SL_TODAY,     time:'04:27 AM', measured:8.25, shape:'true',
    temp:88, uw:'', air:'', note:'', tester:SL_TESTER, source:'field', flags:[] },
  { id:'T-1038', ticket:'49616711', pour:1, date:SL_TODAY,     time:'05:25 AM', measured:4.00, shape:'collapsed',
    temp:94, uw:148.2, air:5.5, note:'Slump cone slumped out on one side.', tester:'eric.dean@saint-gobain.com',
    source:'field', flags:[{ sev:'warning', t:'Measured slump is 2.00 in above the Verifi reading for this pour.' }] },
  { id:'T-1037', ticket:'49616720', pour:2, date:SL_TODAY,     time:'05:02 AM', measured:6.00, shape:'true',
    temp:90, uw:'', air:'', note:'', tester:'perry.amsu@gmail.com', source:'batch', flags:[] },
  { id:'T-1036', ticket:'49616720', pour:1, date:SL_TODAY,     time:'04:34 AM', measured:6.50, shape:'true',
    temp:90, uw:'', air:'', note:'', tester:'perry.amsu@gmail.com', source:'batch', flags:[] },
  { id:'T-1035', ticket:'49616441', pour:2, date:'09/07/2026', time:'07:52 AM', measured:7.00, shape:'true',
    temp:92, uw:'', air:'', note:'', tester:'perry.amsu@gmail.com', source:'batch', flags:[] },
  { id:'T-1034', ticket:'49616441', pour:1, date:'09/07/2026', time:'07:15 AM', measured:6.75, shape:'true',
    temp:92, uw:'', air:'', note:'', tester:'perry.amsu@gmail.com', source:'batch', flags:[] },
  { id:'T-1033', ticket:'49616450', pour:1, date:'09/07/2026', time:'06:12 AM', measured:1.75, shape:'true',
    temp:95, uw:'', air:'', note:'', tester:'perry.amsu@gmail.com', source:'field', flags:[] },
  { id:'T-1032', ticket:'49616463', pour:2, date:'09/07/2026', time:'02:41 AM', measured:6.25, shape:'true',
    temp:87, uw:'', air:'', note:'', tester:'perry.amsu@gmail.com', source:'field',
    flags:[{ sev:'warning', t:'Verifi reported the drum was not in charge during this pour.' }] },
  { id:'T-1031', ticket:'49616463', pour:1, date:'09/07/2026', time:'01:58 AM', measured:7.25, shape:'true',
    temp:87, uw:'', air:'', note:'', tester:'perry.amsu@gmail.com', source:'field', flags:[] },
  /* The rejection story: entered from a notebook with the time typed by hand,
     which landed 4 hours 49 minutes outside the load's window. Today this
     silently fails validation downstream. Here it is visible and fixable. */
  { id:'T-1030', ticket:'49616450', pour:null, date:'09/07/2026', time:'11:01 AM', measured:2.00, shape:'true',
    temp:'', uw:'', air:'', note:'Entered from the log book.', tester:'perry.amsu@gmail.com', source:'batch',
    flags:[{ sev:'error', t:'Entered time is 4 hr 49 min outside this load\u2019s window. No pour could be matched.' },
           { sev:'warning', t:'No pour selected, so this test will not roll up to a pour.' }] }
];

/* ── State ────────────────────────────────────────────────────────────────── */

var slMode  = 'd';                /* 'd' desktop · 't' tablet · 'm' mobile     */
var slView  = 'all';              /* 'all' · 'review' · 'batch'                */
var slQ     = '';
var slGate  = true;               /* true = show Coming soon instead of the page */
var slDrawer = null;              /* { kind:'test'|'wizard', key }             */
var slWiz   = null;
var slBatch = null;
var slSeq   = 1042;

function slToast(m) { if (typeof amToast === 'function') amToast(m); }
function slStub(m)  { slToast('Prototype \u2014 ' + m); }

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function slEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function slNum(n, d) { var v = parseFloat(n); return isNaN(v) ? '\u2014' : v.toFixed(d == null ? 2 : d); }
function slLoad(ticket) {
  for (var i = 0; i < SL_LOADS.length; i++) if (SL_LOADS[i].ticket === ticket) return SL_LOADS[i];
  return null;
}
function slPour(load, n) {
  if (!load || n == null) return null;
  for (var i = 0; i < load.pours.length; i++) if (load.pours[i].n === n) return load.pours[i];
  return null;
}
/* Verifi's reading at the moment of the test. Comes off the pour when there is
   one; there is nothing to compare against when there is not. */
function slVerifi(t) {
  var p = slPour(slLoad(t.ticket), t.pour);
  return p ? p.verifi : null;
}
function slDelta(t) {
  var v = slVerifi(t);
  return v == null ? null : (t.measured - v);
}
function slSev(t) {
  var s = null;
  for (var i = 0; i < (t.flags || []).length; i++) {
    if (t.flags[i].sev === 'error') return 'error';
    if (t.flags[i].sev === 'warning') s = 'warning';
  }
  return s;
}
function slMins(hhmm) {
  if (!hhmm) return null;
  var m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(hhmm.trim());
  if (!m) return null;
  var h = parseInt(m[1], 10) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + parseInt(m[2], 10);
}
function slClock(mins) {
  mins = ((mins % 1440) + 1440) % 1440;
  var h = Math.floor(mins / 60), m = mins % 60, ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
}
function slGap(mins) {
  mins = Math.abs(mins);
  return mins >= 60 ? Math.floor(mins / 60) + ' hr ' + (mins % 60) + ' min' : mins + ' min';
}
function slDateLabel(d) {
  if (d === SL_TODAY) return 'Today';
  if (d === '09/07/2026') return 'Yesterday';
  return d;
}

/* ── Validation. Run at save time, stored on the test, shown before commit.
   This is the "flag tests that should not be reported" item, moved from a
   downstream rejection into the moment the tester can still fix it. ─────── */

function slAudit(ticket, pour, timeStr, measured, excludeId) {
  var out = [], load = slLoad(ticket);
  if (!load) return [{ sev:'error', t:'No load selected.' }];

  var p = slPour(load, pour);

  if (pour == null) {
    out.push({ sev:'warning', t:'No pour selected, so this test will not roll up to a pour.' });
    var lo = slMins(load.loadT), t0 = slMins(timeStr);
    var hi = load.pours.length ? slMins(load.pours[load.pours.length - 1].end || load.pours[load.pours.length - 1].start) : lo;
    if (t0 != null && lo != null && (t0 < lo - 30 || t0 > hi + 90)) {
      out.push({ sev:'error', t:'Entered time is ' + slGap(t0 < lo ? lo - t0 : t0 - hi)
        + ' outside this load\u2019s window. No pour could be matched.' });
    }
  }

  if (p) {
    var v = p.verifi, d = measured - v;
    if (Math.abs(d) > SL_TOL) {
      out.push({ sev:'warning', t:'Measured slump is ' + Math.abs(d).toFixed(2) + ' in '
        + (d > 0 ? 'above' : 'below') + ' the Verifi reading for this pour.' });
    }
    if (p.reason && p.reason !== 'Ok') {
      out.push({ sev:'warning', t:'Verifi flagged this pour: ' + p.reason.toLowerCase() + '.' });
    }
    for (var i = 0; i < SL_TESTS.length; i++) {
      var e = SL_TESTS[i];
      if (e.id !== excludeId && e.ticket === ticket && e.pour === pour) {
        out.push({ sev:'warning', t:'Pour ' + pour + ' on this load already has a test (' + e.id
          + ', ' + slNum(e.measured) + ' in). Save this one only if you took a second reading.' });
        break;
      }
    }
  }

  var mv = parseFloat(measured);
  if (isNaN(mv) || mv <= 0) out.push({ sev:'error', t:'Enter a measured slump.' });
  else if (mv > 12) out.push({ sev:'warning', t:'A measured slump above 12 in is unusual. Check the reading.' });

  return out;
}
function slHasError(flags) {
  for (var i = 0; i < flags.length; i++) if (flags[i].sev === 'error') return true;
  return false;
}

/* ── Rows ─────────────────────────────────────────────────────────────────── */

function slRows() {
  var q = slQ.trim().toLowerCase();
  return SL_TESTS.filter(function (t) {
    if (slView === 'review' && !slSev(t)) return false;
    if (!q) return true;
    var load = slLoad(t.ticket) || {};
    return [t.ticket, t.id, load.truck, load.mix, load.customer, load.plant, t.tester]
      .join(' ').toLowerCase().indexOf(q) > -1;
  });
}

/* ── Render: head + stats ─────────────────────────────────────────────────── */

/* ── Gate ────────────────────────────────────────────────────────────────
   The nav item stays in place, but the section reads as Coming soon by
   default. The concept behind it is reachable on request rather than deleted,
   because the design direction here is not this file's call to make.

   Locked: there is no reveal control in the UI. The concept still renders if
   slGate is set to false from the console, which is how it gets demoed, but
   nothing in the interface can open it. Nobody clicking around the prototype
   can reach the concept and mistake it for a decision. */
function slGatePanel() {
  return '<div class="sl-gate">'
    + '<span class="sl-gate-tag">Coming soon</span>'
    + '<div class="sl-gate-t">Slump Tests</div>'
    + '<div class="sl-gate-s">This section is not built. Today\u2019s Slump Test Report still lives in '
      + 'the Hub and is unchanged.<br><br>There is an early concept behind this screen for how a test '
      + 'could attach to a specific load and pour instead of being typed in by hand. Whether to take '
      + 'that direction is the call of whoever owns this area, not something settled here.</div>'
  + '</div>';
}
function slReveal(on) {
  slGate = !on;
  slDrawerClose();
  slRender();
}

/* ── Concept marker ──────────────────────────────────────────────────────
   Deliberately not dismissible. A banner that can be closed vanishes from
   screenshots, and screenshots are how "this is an idea" turns into "they
   changed the product". It renders above the title on every viewport, and the
   same tag rides in the drawer and wizard headers. */
function slWip() {
  return '<div class="sl-wip"><span class="sl-wip-tag">Concept</span>'
    + '<span class="sl-wip-t"><b>Nothing here has been built or decided.</b> This is one idea for how a '
    + 'slump test could attach to a specific load and pour instead of being typed in by hand. '
    + 'The live Slump Test Report in the Hub is unchanged.</span></div>';
}

function slHead() {
  var today = SL_TESTS.filter(function (t) { return t.date === SL_TODAY; });
  var review = SL_TESTS.filter(function (t) { return slSev(t); });
  var withDelta = SL_TESTS.filter(function (t) { return slDelta(t) != null; });
  var avg = withDelta.length
    ? withDelta.reduce(function (a, t) { return a + Math.abs(slDelta(t)); }, 0) / withDelta.length : 0;
  var unpoured = SL_TESTS.filter(function (t) { return t.pour == null; });

  return '<div class="sl-head">'
    + '<div><div class="am-title sl-title">Slump Tests</div>'
      + '<div class="sl-sub"><b>' + SL_TESTS.length + '</b> tests \u00b7 Cemex AZ \u00b7 last 30 days</div></div>'
    + '<div class="sl-head-actions">'
      + '<button class="am-pill" onclick="slStub(\'the date range picker is not built\')">'
        + '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M2 6.5h12M5.5 2v2M10.5 2v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'
        + '9/1/2026 \u2013 9/8/2026</button>'
      + '<button class="am-pill" onclick="slStub(\'export is not wired\')">Export</button>'
    + '</div></div>'
    + '<div class="sl-stats">'
      + slStat('Tests today', today.length, '', today.length
          ? 'Latest ' + today[0].time + ' \u00b7 truck ' + ((slLoad(today[0].ticket) || {}).truck || '\u2014') : 'None yet')
      + slStat('Needs review', review.length, '', review.length
          ? 'Flagged at entry, not rejected later' : 'Nothing flagged')
      + slStat('Avg vs Verifi', avg.toFixed(2), 'in', 'Tolerance ' + SL_TOL.toFixed(2) + ' in')
      + slStat('Missing a pour', unpoured.length, '', unpoured.length
          ? 'These cannot roll up to a pour' : 'Every test is attached')
    + '</div>';
}
function slStat(label, val, unit, meta) {
  return '<div class="sl-stat"><div class="sl-stat-l">' + label + '</div>'
    + '<div class="sl-stat-v">' + val + (unit ? '<small>' + unit + '</small>' : '') + '</div>'
    + '<div class="sl-stat-m">' + meta + '</div></div>';
}

/* ── Render: toolbar ──────────────────────────────────────────────────────── */

function slToolbar() {
  var review = SL_TESTS.filter(function (t) { return slSev(t); }).length;
  return '<div class="sl-toolbar">'
    + '<div class="am-search"><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.6" stroke="currentColor" stroke-width="1.3"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'
      + '<input placeholder="Truck, ticket, mix or tester" value="' + slEsc(slQ)
      + '" oninput="slSearch(this.value)"></div>'
    + '<button class="am-pill" onclick="slStub(\'the filter popover is not built\')">'
      + '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>Filters</button>'
    + '<button class="am-pill" onclick="slStub(\'the Columns menu is not built\')">Columns</button>'
    + '<button class="am-primary" onclick="slWizOpen()">'
      + '<span class="am-plus">+</span>Log slump test</button>'
    + '<div class="sl-tb-right">'
      + '<div class="sl-seg">'
        + slSegBtn('all', 'All tests')
        + slSegBtn('review', 'Needs review' + (review ? ' \u00b7 ' + review : ''))
        + slSegBtn('batch', 'Batch entry')
      + '</div>'
    + '</div></div>';
}
function slSegBtn(k, label) {
  return '<button class="sl-seg-btn' + (slView === k ? ' on' : '') + '" onclick="slSetView(\'' + k + '\')">'
    + label + '</button>';
}

/* ── Render: table ────────────────────────────────────────────────────────── */

var SL_COLS = ['Date & time', 'Ticket', 'Truck', 'Pour', 'Mix code', 'Measured', 'Verifi', '\u0394', 'Status', 'Tester'];

function slTable() {
  var rows = slRows();
  if (!rows.length) {
    return '<div class="sl-empty"><div class="sl-empty-t">'
      + (slView === 'review' ? 'Nothing needs review' : 'No tests match')
      + '</div><div class="sl-empty-s">'
      + (slView === 'review'
          ? 'Every test in this range matched a pour and sat inside tolerance.'
          : 'Clear the search, or log a test against a load that is pouring now.')
      + '</div><button class="am-primary" onclick="slWizOpen()"><span class="am-plus">+</span>Log slump test</button></div>';
  }

  var head = '<div class="sl-tr sl-th am-th">' + SL_COLS.map(function (c, i) {
    return '<span' + (i >= 5 && i <= 7 ? ' class="num"' : '') + '>' + c + '</span>';
  }).join('') + '</div>';

  var body = rows.map(function (t, i) {
    var load = slLoad(t.ticket) || {}, v = slVerifi(t), d = slDelta(t);
    return '<div class="sl-tr' + (i % 2 ? ' zebra' : '') + '" onclick="slOpenTest(\'' + t.id + '\')">'
      + '<span class="sl-strong">' + slDateLabel(t.date) + ' ' + t.time + '</span>'
      + '<span><span class="sl-link">' + t.ticket + '</span></span>'
      + '<span><span class="sl-link">' + (load.truck || '\u2014') + '</span></span>'
      + '<span>' + (t.pour == null ? '<span class="sl-dim">Not set</span>' : 'Pour ' + t.pour) + '</span>'
      + '<span>' + (load.mix || '\u2014') + '</span>'
      + '<span class="num sl-strong">' + slNum(t.measured) + ' in</span>'
      + '<span class="num">' + (v == null ? '<span class="sl-dim">\u2014</span>' : slNum(v) + ' in') + '</span>'
      + '<span class="num sl-delta' + (d != null && Math.abs(d) > SL_TOL ? ' over' : '') + '">'
        + (d == null ? '<span class="sl-dim">\u2014</span>' : (d > 0 ? '+' : '') + d.toFixed(2)) + '</span>'
      + '<span>' + slBadge(t) + '</span>'
      + '<span class="sl-dim">' + slEsc(t.tester) + '</span>'
    + '</div>';
  }).join('');

  var cards = rows.map(function (t) {
    var load = slLoad(t.ticket) || {}, d = slDelta(t);
    return '<div class="sl-card" onclick="slOpenTest(\'' + t.id + '\')">'
      + '<div class="sl-card-top"><div class="sl-card-m">' + slNum(t.measured) + '<span>in measured</span></div>'
        + slBadge(t) + '</div>'
      + '<div class="sl-card-k"><span>Truck <b>' + (load.truck || '\u2014') + '</b></span>'
        + '<span>Ticket <b>' + t.ticket + '</b></span>'
        + '<span>' + (t.pour == null ? 'Pour <b>not set</b>' : 'Pour <b>' + t.pour + '</b>') + '</span></div>'
      + '<div class="sl-card-k"><span>' + slDateLabel(t.date) + ' ' + t.time + '</span>'
        + '<span>Verifi <b>' + (slVerifi(t) == null ? '\u2014' : slNum(slVerifi(t)) + ' in') + '</b></span>'
        + '<span>\u0394 <b>' + (d == null ? '\u2014' : (d > 0 ? '+' : '') + d.toFixed(2)) + '</b></span></div>'
    + '</div>';
  }).join('');

  return '<div class="sl-table-wrap"><div class="sl-table am-table">' + head + body + '</div></div>'
    + '<div class="sl-cards">' + cards + '</div>'
    + '<div class="sl-foot"><span>Showing ' + rows.length + ' of ' + SL_TESTS.length + ' tests</span>'
      + '<span>Rows per page 50</span></div>';
}

function slBadge(t) {
  var sev = slSev(t), n = (t.flags || []).length;
  if (!sev) return '<span class="am-tag am-tag-success">OK</span>';
  var cls = sev === 'error' ? 'am-tag-error' : 'am-tag-warning';
  return '<span class="am-tag ' + cls + '">'
    + (sev === 'error' ? 'Rejected' : 'Warning') + (n > 1 ? ' \u00b7 ' + n : '') + '</span>';
}

/* ── Render: batch grid ───────────────────────────────────────────────────
   The notebook case. One date at the top, one row per test, load and pour as
   selects so the identity is picked and never typed. Same slAudit on save. */

function slBatchInit() {
  if (slBatch) return;
  slBatch = { date:SL_TODAY, rows:[slBatchRow(), slBatchRow(), slBatchRow()] };
}
function slBatchRow() { return { ticket:'', pour:'', slump:'', shape:'true', temp:'', uw:'', air:'' }; }

function slBatchView() {
  slBatchInit();
  var loads = SL_LOADS.filter(function (l) { return l.date === slBatch.date; });

  var bar = '<div class="sl-batch-bar">'
    + '<div class="sl-bb-field"><div class="sl-bb-k">Test date</div>'
      + '<select class="sl-bb-input" onchange="slBatchDate(this.value)">'
        + ['09/08/2026', '09/07/2026'].map(function (d) {
            return '<option value="' + d + '"' + (slBatch.date === d ? ' selected' : '') + '>'
              + slDateLabel(d) + ' \u00b7 ' + d + '</option>'; }).join('')
      + '</select></div>'
    + '<div class="sl-bb-field"><div class="sl-bb-k">Loads on this date</div>'
      + '<div style="font-size:14px;color:var(--strong);letter-spacing:-0.28px;padding-top:9px;">'
      + loads.length + ' loads \u00b7 ' + loads.reduce(function (a, l) { return a + l.pours.length; }, 0)
      + ' pours</div></div>'
    + '<div class="sl-bb-note">Pick the load and the pour. Each row takes its timestamp from the pour, '
      + 'so a typed time cannot put the test outside the load\u2019s window.</div>'
    + '</div>';

  var head = '<div class="sl-grow sl-ghead">'
    + ['Load', 'Pour', 'Slump in', 'Shape', 'Temp \u00b0F', 'Unit wt lb/ft\u00b3', 'Air %', '']
      .map(function (c) { return '<div class="sl-gcell">' + c + '</div>'; }).join('')
    + '</div>';

  var rows = slBatch.rows.map(function (r, i) {
    var load = slLoad(r.ticket);
    var pours = load ? load.pours : [];
    return '<div class="sl-grow">'
      + '<div class="sl-gcell"><select class="sl-gin' + (r.slump && !r.ticket ? ' sl-bad' : '')
        + '" onchange="slBatchSet(' + i + ',\'ticket\',this.value)">'
        + '<option value="">Select a load\u2026</option>'
        + loads.map(function (l) {
            return '<option value="' + l.ticket + '"' + (r.ticket === l.ticket ? ' selected' : '') + '>'
              + l.truck + ' \u00b7 ' + l.ticket + ' \u00b7 ' + l.customer + '</option>'; }).join('')
        + '</select></div>'
      + '<div class="sl-gcell"><select class="sl-gin" ' + (load ? '' : 'disabled ')
        + 'onchange="slBatchSet(' + i + ',\'pour\',this.value)">'
        + '<option value="">' + (load ? 'Select\u2026' : '\u2014') + '</option>'
        + pours.map(function (p) {
            return '<option value="' + p.n + '"' + (String(r.pour) === String(p.n) ? ' selected' : '') + '>'
              + 'Pour ' + p.n + ' \u00b7 ' + p.start + '</option>'; }).join('')
        + '<option value="plant"' + (r.pour === 'plant' ? ' selected' : '') + '>At the plant</option>'
        + '</select></div>'
      + slGcell(i, 'slump', r.slump, '0.00')
      + '<div class="sl-gcell"><select class="sl-gin" onchange="slBatchSet(' + i + ',\'shape\',this.value)">'
        + '<option value="true"' + (r.shape === 'true' ? ' selected' : '') + '>True</option>'
        + '<option value="collapsed"' + (r.shape === 'collapsed' ? ' selected' : '') + '>Collapsed</option>'
        + '</select></div>'
      + slGcell(i, 'temp', r.temp, '\u2014')
      + slGcell(i, 'uw', r.uw, '\u2014')
      + slGcell(i, 'air', r.air, '\u2014')
      + '<div class="sl-gcell"><button class="sl-gx" onclick="slBatchDrop(' + i + ')" title="Remove row">\u00d7</button></div>'
    + '</div>';
  }).join('');

  var filled = slBatch.rows.filter(function (r) { return r.ticket && r.slump; }).length;

  return bar
    + '<div class="sl-grid-wrap"><div class="sl-grid">' + head + rows + '</div></div>'
    + '<div class="sl-grid-actions">'
      + '<button class="am-pill" onclick="slBatchAdd()"><span class="am-plus">+</span>Add row</button>'
      + '<button class="am-pill" onclick="slStub(\'CSV paste is not wired\')">Paste from CSV</button>'
      + '<div style="flex:1;"></div>'
      + '<span style="font-size:13px;color:var(--soft);letter-spacing:-0.26px;">' + filled + ' of '
        + slBatch.rows.length + ' rows ready</span>'
      + '<button class="am-primary" onclick="slBatchSave()">Save ' + filled + ' test'
        + (filled === 1 ? '' : 's') + '</button>'
    + '</div>';
}
function slGcell(i, key, val, ph) {
  return '<div class="sl-gcell"><input class="sl-gin" inputmode="decimal" placeholder="' + ph
    + '" value="' + slEsc(val) + '" onchange="slBatchSet(' + i + ',\'' + key + '\',this.value)"></div>';
}

function slBatchDate(d) { slBatch.date = d; slBatch.rows.forEach(function (r) { r.ticket = ''; r.pour = ''; }); slRender(); }
function slBatchSet(i, k, v) {
  slBatch.rows[i][k] = v;
  if (k === 'ticket') slBatch.rows[i].pour = '';
  slRender();
}
function slBatchAdd() { slBatch.rows.push(slBatchRow()); slRender(); }
function slBatchDrop(i) { slBatch.rows.splice(i, 1); if (!slBatch.rows.length) slBatch.rows.push(slBatchRow()); slRender(); }

function slBatchSave() {
  var saved = 0, flagged = 0;
  slBatch.rows.forEach(function (r) {
    if (!r.ticket || !r.slump) return;
    var pour = (r.pour === '' || r.pour === 'plant') ? null : parseInt(r.pour, 10);
    var p = slPour(slLoad(r.ticket), pour);
    var time = p ? p.start : (slLoad(r.ticket) || {}).loadT;
    var flags = slAudit(r.ticket, pour, time, parseFloat(r.slump));
    if (slHasError(flags)) { flagged++; return; }
    SL_TESTS.unshift({
      id:'T-' + (slSeq++), ticket:r.ticket, pour:pour, date:slBatch.date, time:time,
      measured:parseFloat(r.slump), shape:r.shape, temp:r.temp, uw:r.uw, air:r.air, note:'',
      tester:SL_TESTER, source:'batch', flags:flags
    });
    saved++;
  });
  slBatch = null;
  slView = 'all';
  slRender();
  slToast(saved + ' test' + (saved === 1 ? '' : 's') + ' saved'
    + (flagged ? ' \u00b7 ' + flagged + ' row' + (flagged === 1 ? '' : 's') + ' held back, fix and resubmit' : ''));
}

/* ── Render: page ─────────────────────────────────────────────────────────── */

function slHtml() {
  if (slGate) return '<div class="sl-scroll sl-scroll--gated">' + slGatePanel() + '</div>';
  return '<div class="sl-scroll">' + slWip() + slHead() + slToolbar()
    + (slView === 'batch' ? slBatchView() : slTable()) + '</div>';
}
function slHost() {
  if (slMode === 't') return document.getElementById('sl-tb-mount');
  if (slMode === 'm') return document.getElementById('sl-mob-mount');
  return document.getElementById('dt-page-slump');
}
function slRender() {
  var host = slHost();
  if (!host) return;
  var scroll = host.querySelector('.sl-scroll');
  var top = scroll ? scroll.scrollTop : 0;
  host.innerHTML = slHtml();
  scroll = host.querySelector('.sl-scroll');
  if (scroll && top) scroll.scrollTop = top;
}
function slSearch(v) {
  slQ = v;
  var host = slHost();
  if (!host) return;
  var input = host.querySelector('.am-search input');
  var pos = input ? input.selectionStart : null;
  slRender();
  input = slHost().querySelector('.am-search input');
  if (input) { input.focus(); if (pos != null) try { input.setSelectionRange(pos, pos); } catch (e) {} }
}
function slSetView(k) { slView = k; if (k === 'batch') slBatchInit(); slRender(); }

/* ── Drawer ───────────────────────────────────────────────────────────────
   The account module's drawer, not a new one. Mounted at .phone level like
   #am-truck-drawer so it stays inside whichever device frame is showing. */

function slDrawerHost() {
  var el = document.getElementById('sl-drawer');
  if (el) return el;
  var anchor = document.getElementById('am-truck-drawer');
  var parent = anchor ? anchor.parentNode : (document.querySelector('.phone') || document.body);
  el = document.createElement('div');
  el.id = 'sl-drawer';
  el.className = 'am-out';
  parent.appendChild(el);
  return el;
}
function slDrawerPaint(title, sub, body, foot) {
  var host = slDrawerHost();
  host.innerHTML = '<div class="am-scrim" onclick="slDrawerClose()"></div>'
    + '<div class="am-drawer">'
      + '<div class="am-dr-head"><div><div class="am-dr-title sl-dr-title">' + title + '</div>'
        + '<div class="am-dr-sub sl-dr-sub">' + sub + '</div></div>'
        + '<button class="am-dr-x" onclick="slDrawerClose()" title="Close">\u00d7</button></div>'
      + (slWiz ? slStepRail() : '')
      + '<div class="am-dr-body sl-dr-body" id="sl-dr-body">' + body + '</div>'
      + (foot ? '<div class="sl-dr-foot">' + foot + '</div>' : '')
    + '</div>';
  host.style.display = 'flex';
  host.classList.remove('am-out');
}
function slDrawerClose() {
  var host = document.getElementById('sl-drawer');
  slDrawer = null; slWiz = null;
  if (!host) return;
  host.classList.add('am-out');
  setTimeout(function () {
    if (host.classList.contains('am-out')) { host.style.display = 'none'; host.innerHTML = ''; }
  }, 240);
}

/* ── Detail drawer for an existing test ──────────────────────────────────── */

function slOpenTest(id) {
  var t = null;
  for (var i = 0; i < SL_TESTS.length; i++) if (SL_TESTS[i].id === id) t = SL_TESTS[i];
  if (!t) return;
  slWiz = null;
  slDrawer = { kind:'test', key:id };
  var load = slLoad(t.ticket) || {}, p = slPour(load, t.pour), d = slDelta(t);

  var notices = (t.flags || []).map(function (f) {
    return '<div class="sl-notice sl-notice--' + f.sev + '"><span>' + f.t + '</span>'
      + (f.sev === 'error' ? '<button class="sl-notice-x" onclick="slStub(\'the correction flow is not built\')">Fix</button>' : '')
      + '</div>';
  }).join('');

  var body = notices
    + '<div class="sl-confirm-hero">'
      + '<div><div class="sl-k">Measured</div><div class="sl-confirm-v">' + slNum(t.measured) + '<small>in</small></div></div>'
      + '<div class="sl-confirm-d">Verifi at ' + t.time + '<b>' + (slVerifi(t) == null ? '\u2014' : slNum(slVerifi(t)) + ' in') + '</b>'
        + (d == null ? '' : '<span>\u0394 ' + (d > 0 ? '+' : '') + d.toFixed(2) + ' in</span>') + '</div>'
    + '</div>'
    + '<div class="sl-sec">Where this came from</div>'
    + '<div class="sl-kv">'
      + slKv('Truck', '<span class="sl-link">' + (load.truck || '\u2014') + '</span>')
      + slKv('Ticket', '<span class="sl-link">' + t.ticket + '</span>')
      + slKv('Order', load.order || '\u2014')
      + slKv('Pour', t.pour == null ? '<span class="sl-dim">Not set</span>' : 'Pour ' + t.pour
          + (p ? '<small>' + p.start + (p.end ? ' \u2013 ' + p.end : ' \u2013 running') + '</small>' : ''))
      + slKv('Discharged', p ? p.vol.toFixed(2) + ' yd\u00b3<small>' + p.remaining.toFixed(2) + ' yd\u00b3 left on the drum</small>' : '\u2014')
      + slKv('Load size', (load.size || 0).toFixed(2) + ' yd\u00b3')
      + slKv('Mix code', load.mix || '\u2014')
      + slKv('Ticketed slump', load.ticketed ? slNum(load.ticketed) + ' in' : '\u2014')
      + slKv('Location', load.plant || '\u2014')
    + '</div>'
    + '<div class="sl-sec">Slump across this load</div>'
    + slTrace(t, load, p)
    + '<div class="sl-sec">Measurements</div>'
    + '<div class="sl-kv">'
      + slKv('Shape', t.shape === 'collapsed' ? 'Collapsed' : 'True')
      + slKv('Temperature', t.temp === '' ? '\u2014' : t.temp + ' \u00b0F')
      + slKv('Unit weight', t.uw === '' ? '\u2014' : t.uw + ' lb/ft\u00b3')
      + slKv('Air content', t.air === '' ? '\u2014' : t.air + ' %')
      + slKv('Entered', slDateLabel(t.date) + ' ' + t.time + '<small>' + (t.source === 'batch' ? 'Batch entry' : 'In the field') + '</small>')
      + slKv('Tester', slEsc(t.tester))
    + '</div>'
    + (t.note ? '<div class="sl-sec">Note</div><div class="sl-v" style="line-height:1.55;">' + slEsc(t.note) + '</div>' : '')
    + '<div class="sl-dr-actions">'
      + '<button class="am-pill" onclick="slStub(\'the ticket drawer is not wired from this page yet\')">Open ticket ' + t.ticket + '</button>'
      + '<button class="am-pill" onclick="slStub(\'editing a saved test is not built\')">Edit</button>'
      + '<button class="am-pill sl-danger-pill" onclick="slDelete(\'' + t.id + '\')">Delete test</button>'
    + '</div>';

  slDrawerPaint('Slump test ' + t.id + slBadge(t) + '<span class="sl-wip-tag">Concept</span>',
    (load.truck ? 'Truck ' + load.truck + ' \u00b7 ' : '') + 'Ticket ' + t.ticket
      + ' \u00b7 ' + slDateLabel(t.date) + ' ' + t.time, body, '');
}
function slKv(k, v) { return '<div><div class="sl-k">' + k + '</div><div class="sl-v">' + v + '</div></div>'; }

/* A deterministic slump trace for the load, with the test's pour window lit.
   Mock, seeded off the ticket so re-opening a test shows the same shape. */
function slTrace(t, load, p) {
  var h = 0, s = String(t.ticket);
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
  function rnd() { h = (h * 7919 + 13) % 9973; return h / 9973; }
  var base = load.ticketed || 6, bars = [], N = 46;
  var lo = slMins(load.loadT) || 0;
  var hi = lo + 150;
  var ps = p ? slMins(p.start) : null, pe = p ? (slMins(p.end) || (ps + 12)) : null;
  for (var j = 0; j < N; j++) {
    var at = lo + Math.round((hi - lo) * j / (N - 1));
    var v = base + (rnd() - 0.5) * 0.9 + (j < 4 ? -base * 0.85 : 0);
    var pct = Math.max(6, Math.min(100, (v / (base * 1.6)) * 100));
    var on = ps != null && at >= ps && at <= pe;
    bars.push('<i style="height:' + pct.toFixed(0) + '%"' + (on ? ' class="on"' : '') + '></i>');
  }
  return '<div class="sl-trace">' + bars.join('') + '</div>'
    + '<div class="sl-trace-x"><span>' + load.loadT + ' loaded</span>'
    + '<span>' + (p ? 'Pour ' + p.n + ' highlighted' : 'No pour matched') + '</span>'
    + '<span>' + slClock(hi) + '</span></div>';
}

function slDelete(id) {
  for (var i = 0; i < SL_TESTS.length; i++) {
    if (SL_TESTS[i].id === id) { SL_TESTS.splice(i, 1); break; }
  }
  slDrawerClose();
  slRender();
  slToast('Slump test ' + id + ' deleted');
}

/* ── Quick add wizard ─────────────────────────────────────────────────────── */

function slWizOpen(ticket, pour) {
  slDrawer = { kind:'wizard' };
  slWiz = {
    step: ticket ? (pour != null ? 3 : 2) : 1,
    ticket: ticket || null, pour: (pour == null ? null : pour), pourSet:false,
    date: SL_TODAY, q:'', slump:6.00, shape:'true',
    temp:'', uw:'', air:'', note:'', more:false, time:null
  };
  slWizPaint();
}
function slWizStep(n) {
  if (n === 2 && !slWiz.ticket) return;
  if (n === 3 && !slWiz.pourSet) return;
  if (n === 4 && !slWiz.pourSet) return;
  slWiz.step = n;
  slWizPaint();
}
function slStepRail() {
  var names = ['Load', 'Pour', 'Measure', 'Confirm'];
  return '<div class="sl-steps">' + names.map(function (nm, i) {
    var n = i + 1;
    var cls = slWiz.step === n ? 'on' : (slWiz.step > n ? 'done' : '');
    return (i ? '<span class="sl-step-line"></span>' : '')
      + '<span class="sl-step ' + cls + '" onclick="slWizStep(' + n + ')">'
      + '<span class="sl-step-n">' + (slWiz.step > n ? '\u2713' : n) + '</span>'
      + '<span class="sl-step-lbl">' + nm + '</span></span>';
  }).join('') + '</div>';
}

function slWizPaint() {
  var s = slWiz.step;
  var body = s === 1 ? slWiz1() : s === 2 ? slWiz2() : s === 3 ? slWiz3() : slWiz4();
  var foot;
  if (s === 1) {
    foot = '<button class="am-pill" onclick="slDrawerClose()">Cancel</button><div class="sl-spacer"></div>'
      + '<button class="am-primary"' + (slWiz.ticket ? ' onclick="slWizStep(2)"' : ' disabled style="opacity:0.45;"')
      + '>Next \u00b7 pick the pour</button>';
  } else if (s === 2) {
    foot = '<button class="am-pill" onclick="slWizStep(1)">Back</button><div class="sl-spacer"></div>'
      + '<button class="am-primary"' + (slWiz.pourSet ? ' onclick="slWizStep(3)"' : ' disabled style="opacity:0.45;"')
      + '>Next \u00b7 enter the slump</button>';
  } else if (s === 3) {
    foot = '<button class="am-pill" onclick="slWizStep(2)">Back</button><div class="sl-spacer"></div>'
      + '<button class="am-primary" onclick="slWizStep(4)">Review</button>';
  } else {
    var flags = slWizFlags();
    foot = '<button class="am-pill" onclick="slWizStep(3)">Back</button><div class="sl-spacer"></div>'
      + '<button class="am-primary"' + (slHasError(flags) ? ' disabled style="opacity:0.45;"' : ' onclick="slWizSave()"')
      + '>Save test</button>';
  }
  var load = slWiz.ticket ? slLoad(slWiz.ticket) : null;
  slDrawerPaint('Log a slump test<span class="sl-wip-tag">Concept</span>',
    load ? 'Truck ' + load.truck + ' \u00b7 ticket ' + load.ticket
      + (slWiz.pourSet ? ' \u00b7 ' + slPourLabel() : '')
      : 'Pick the load this test came from',
    body, foot);
}
/* Repaint just the body and hold the scroll position. Everything that stays on
   one step goes through here; only a step change needs slWizPaint, which
   rebuilds the header, the rail and the commit bar too. */
function slWizBody() {
  var b = document.getElementById('sl-dr-body');
  if (!b) { slWizPaint(); return; }
  var top = b.scrollTop;
  var s = slWiz.step;
  b.innerHTML = s === 1 ? slWiz1() : s === 2 ? slWiz2() : s === 3 ? slWiz3() : slWiz4();
  b.scrollTop = top;
}

function slPourLabel() {
  if (slWiz.pour === 'plant') return 'at the plant';
  if (slWiz.pour == null) return 'no pour';
  return 'pour ' + slWiz.pour;
}

/* Step 1 — the load. Pouring now first, because that is the field case. */
function slWiz1() {
  var q = slWiz.q.trim().toLowerCase();
  function match(l) {
    if (!q) return true;
    return [l.truck, l.ticket, l.order, l.customer, l.mix, l.driver, l.plant]
      .join(' ').toLowerCase().indexOf(q) > -1;
  }
  var live = [], today = [], other = [];
  SL_LOADS.filter(match).forEach(function (l) {
    if (l.date === SL_TODAY && (l.phase === 'pouring' || l.phase === 'on-site')) live.push(l);
    else if (l.date === SL_TODAY) today.push(l);
    else other.push(l);
  });

  var out = '<div class="sl-pick-search">'
    + '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.6" stroke="currentColor" stroke-width="1.3"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'
    + '<input autocomplete="off" placeholder="Truck number, ticket or customer" value="' + slEsc(slWiz.q)
    + '" oninput="slWizQ(this.value)"></div>';

  if (!live.length && !today.length && !other.length) {
    out += '<div class="sl-empty"><div class="sl-empty-t">No load matches</div>'
      + '<div class="sl-empty-s">Try the truck number on the drum, or clear the search to see everything '
      + 'in service today.</div></div>';
    return out;
  }
  if (live.length)  out += '<div class="sl-group-h">Pouring now <i></i></div>' + live.map(slLoadBtn).join('');
  if (today.length) out += '<div class="sl-group-h">Earlier today <i></i></div>' + today.map(slLoadBtn).join('');
  if (other.length) out += '<div class="sl-group-h">Earlier loads <i></i></div>' + other.map(slLoadBtn).join('');
  out += '<div class="sl-auto-note"><span>Everything else on the record \u2014 <b>ticket, order, mix code, '
    + 'load size, ticketed slump, location, driver</b> \u2014 comes off the load. You never type it.</span></div>';
  return out;
}
function slLoadBtn(l) {
  var on = slWiz.ticket === l.ticket;
  var done = SL_TESTS.filter(function (t) { return t.ticket === l.ticket; }).length;
  return '<button class="sl-load' + (on ? ' on' : '') + '" onclick="slWizPick(\'' + l.ticket + '\')">'
    + '<span class="sl-load-truck">' + l.truck + '<small>Truck</small></span>'
    + '<span class="sl-load-main">' + slEsc(l.customer) + ' \u00b7 ' + slEsc(l.addr) + '</span>'
    + '<span class="sl-load-meta"><span>Ticket ' + l.ticket + '</span><span>Mix ' + l.mix + '</span>'
      + '<span>' + l.size.toFixed(2) + ' yd\u00b3</span><span>Ticketed ' + slNum(l.ticketed) + ' in</span></span>'
    + '<span class="sl-load-right"><span class="dc-tc-phase-chip ' + l.phase + '">' + l.phaseLabel + '</span>'
      + '<span class="sl-load-t">' + (l.pours.length ? l.pours.length + ' pour'
        + (l.pours.length === 1 ? '' : 's') : 'No pour yet')
      + (done ? ' \u00b7 ' + done + ' test' + (done === 1 ? '' : 's') : '') + '</span></span>'
  + '</button>';
}
function slWizQ(v) {
  slWiz.q = v;
  slWizBody();
  var input = document.querySelector('#sl-dr-body .sl-pick-search input');
  if (input) { input.focus(); try { input.setSelectionRange(v.length, v.length); } catch (e) {} }
}
function slWizPick(ticket) { slWiz.ticket = ticket; slWiz.pour = null; slWiz.pourSet = false; slWizStep(2); }

/* Step 2 — the pour. This is the field the legacy form never had. */
function slWiz2() {
  var l = slLoad(slWiz.ticket);
  var out = '';
  if (!l.pours.length) {
    out += '<div class="sl-notice sl-notice--info"><span>Verifi has not seen a discharge on this load yet. '
      + 'It is still <b>' + l.phaseLabel.toLowerCase() + '</b>. Log the test against the plant, or wait for '
      + 'the first pour.</span></div>';
  }
  out += '<div class="sl-pours">';
  l.pours.forEach(function (p) {
    var on = slWiz.pourSet && slWiz.pour === p.n;
    var taken = SL_TESTS.filter(function (t) { return t.ticket === l.ticket && t.pour === p.n; });
    out += '<button class="sl-pour' + (on ? ' on' : '') + '" onclick="slWizPour(' + p.n + ')">'
      + '<span class="sl-pour-n">' + p.n + '</span>'
      + '<span class="sl-pour-t">Pour ' + p.n + (p.live ? ' \u00b7 running now' : '') + '</span>'
      + '<span class="sl-pour-s"><span>' + p.start + (p.end ? ' \u2013 ' + p.end : ' \u2013 open') + '</span>'
        + '<span>Verifi ' + slNum(p.verifi) + ' in</span>'
        + (p.reason && p.reason !== 'Ok' ? '<span>' + slEsc(p.reason) + '</span>' : '')
        + (taken.length ? '<span>' + taken.length + ' test already logged</span>' : '') + '</span>'
      + '<span class="sl-pour-r"><b>' + p.vol.toFixed(2) + ' yd\u00b3</b>' + p.remaining.toFixed(2) + ' left</span>'
    + '</button>';
  });
  out += '<button class="sl-pour' + (slWiz.pourSet && slWiz.pour === 'plant' ? ' on' : '')
    + '" onclick="slWizPour(\'plant\')">'
    + '<span class="sl-pour-n">P</span>'
    + '<span class="sl-pour-t">At the plant, before dispatch</span>'
    + '<span class="sl-pour-s"><span>' + l.loadT + '</span><span>Nothing discharged yet</span></span>'
    + '<span class="sl-pour-r"><b>' + l.size.toFixed(2) + ' yd\u00b3</b>on the drum</span></button>';
  out += '<button class="sl-pour' + (slWiz.pourSet && slWiz.pour === null ? ' on' : '')
    + '" onclick="slWizPour(null)">'
    + '<span class="sl-pour-n">?</span>'
    + '<span class="sl-pour-t">I don\u2019t know which pour</span>'
    + '<span class="sl-pour-s"><span>Sets the time by hand and flags the test for review</span></span>'
    + '<span class="sl-pour-r"></span></button>';
  out += '</div>';

  if (slWiz.pourSet && slWiz.pour === null) {
    out += '<div class="sl-field" style="margin-top:18px;"><div class="sl-flabel">Time of the test '
      + '<span>on ' + slWiz.date + '</span></div>'
      + '<input class="sl-input" placeholder="e.g. 07:15 AM" value="' + slEsc(slWiz.time || '')
      + '" onchange="slWizTime(this.value)"></div>'
      + '<div class="sl-notice sl-notice--warning"><span>A typed time is the top reason tests get rejected. '
      + 'Pick a pour above if you can.</span></div>';
  } else if (slWiz.pourSet) {
    var p2 = slWiz.pour === 'plant' ? null : slPour(l, slWiz.pour);
    out += '<div class="sl-auto-note" style="margin-top:16px;"><span>This test will be stamped '
      + '<b>' + (p2 ? p2.start : l.loadT) + '</b> from the pour, not from the clock on your phone.</span></div>';
  }
  return out;
}
function slWizPour(n) { slWiz.pour = n; slWiz.pourSet = true; slWizPaint(); }
function slWizTime(v) { slWiz.time = v; slWizPaint(); }

/* Step 3 — the measurement. Big targets: this happens with gloves on. */
function slMeasureHint() {
  var l = slLoad(slWiz.ticket);
  var p = (slWiz.pour === 'plant' || slWiz.pour == null) ? null : slPour(l, slWiz.pour);
  var v = p ? p.verifi : null, d = v == null ? null : slWiz.slump - v;
  return 'Ticketed <b>' + slNum(l.ticketed) + ' in</b>'
    + (v == null ? '' : ' \u00b7 Verifi at this pour <b>' + slNum(v) + ' in</b>'
      + ' \u00b7 \u0394 <b>' + (d > 0 ? '+' : '') + d.toFixed(2) + '</b>');
}

function slWiz3() {
  var l = slLoad(slWiz.ticket);

  var out = '<div class="sl-measure">'
    + '<div class="sl-measure-k">Measured slump</div>'
    + '<div class="sl-stepper">'
      + '<button class="sl-step-btn" onclick="slWizSlump(-0.25)">\u2212</button>'
      + '<div class="sl-measure-v">' + slNum(slWiz.slump) + '<small>in</small></div>'
      + '<button class="sl-step-btn" onclick="slWizSlump(0.25)">+</button>'
    + '</div>'
    + '<div class="sl-measure-h">' + slMeasureHint() + '</div>'
  + '</div>';

  out += '<div class="sl-field"><div class="sl-flabel">Shape</div><div class="sl-choice">'
    + '<button class="sl-choice-btn' + (slWiz.shape === 'true' ? ' on' : '') + '" onclick="slWizShape(\'true\')">'
      + 'True<small>Cone held its shape</small></button>'
    + '<button class="sl-choice-btn' + (slWiz.shape === 'collapsed' ? ' on' : '') + '" onclick="slWizShape(\'collapsed\')">'
      + 'Collapsed<small>Slumped out or sheared</small></button>'
    + '</div></div>';

  out += '<button class="sl-disclose" onclick="slWizMore()">'
    + '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="transform:rotate('
    + (slWiz.more ? '90' : '0') + 'deg);"><path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>'
    + (slWiz.more ? 'Hide' : 'Add') + ' temperature, unit weight and air</button>';

  if (slWiz.more) {
    out += '<div class="sl-fgrid">'
      + slField('Temperature', '\u00b0F', 'temp', slWiz.temp)
      + slField('Unit weight', 'lb/ft\u00b3', 'uw', slWiz.uw)
      + slField('Air content', '%', 'air', slWiz.air)
      + '</div>';
  }

  out += '<button class="sl-photo" onclick="slStub(\'photo capture is not built \u2014 the open question is whether '
    + 'the image metadata can prefill the record\')">'
    + '<span class="sl-photo-i"><svg width="20" height="20" viewBox="0 0 20 20" fill="none">'
    + '<rect x="2.5" y="5" width="15" height="11" rx="2" stroke="currentColor" stroke-width="1.3"/>'
    + '<circle cx="10" cy="10.5" r="3" stroke="currentColor" stroke-width="1.3"/>'
    + '<path d="M7 5l1-1.5h4L13 5" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg></span>'
    + '<span><span class="sl-photo-t">Photograph the cone</span>'
    + '<span class="sl-photo-s">Open question: would the timestamp on the photo be enough to prefill the test?</span></span>'
  + '</button>';

  out += '<div class="sl-field" style="margin-top:18px;"><div class="sl-flabel">Note <span>optional</span></div>'
    + '<textarea class="sl-input" placeholder="Anything the numbers do not say" onchange="slWizSet(\'note\',this.value)">'
    + slEsc(slWiz.note) + '</textarea></div>';
  return out;
}
function slField(label, unit, key, val) {
  return '<div class="sl-field"><div class="sl-flabel">' + label + ' <span>' + unit + '</span></div>'
    + '<input class="sl-input" inputmode="decimal" placeholder="\u2014" value="' + slEsc(val)
    + '" onchange="slWizSet(\'' + key + '\',this.value)"></div>';
}
/* Tapping +/- must not rebuild the drawer. It writes the two nodes that
   changed and nothing else, so the panel does not flash, the scroll position
   holds, and the note textarea keeps focus if the tester was typing in it. */
function slWizSlump(step) {
  slWiz.slump = Math.max(0, Math.round((slWiz.slump + step) * 100) / 100);
  var v = document.querySelector('#sl-dr-body .sl-measure-v');
  var h = document.querySelector('#sl-dr-body .sl-measure-h');
  if (!v || !h) { slWizBody(); return; }
  v.innerHTML = slNum(slWiz.slump) + '<small>in</small>';
  h.innerHTML = slMeasureHint();
}

/* Shape is a class swap on two buttons, not a rebuild. */
function slWizShape(v) {
  slWiz.shape = v;
  var btns = document.querySelectorAll('#sl-dr-body .sl-choice-btn');
  if (!btns.length) { slWizBody(); return; }
  btns[0].className = 'sl-choice-btn' + (v === 'true' ? ' on' : '');
  btns[1].className = 'sl-choice-btn' + (v === 'collapsed' ? ' on' : '');
}

function slWizMore() { slWiz.more = !slWiz.more; slWizBody(); }
function slWizSet(k, v) { slWiz[k] = v; }

/* Step 4 — the derived record, before it is committed. */
function slWizTime2() {
  var l = slLoad(slWiz.ticket);
  if (slWiz.pour === 'plant') return l.loadT;
  if (slWiz.pour == null) return slWiz.time || '\u2014';
  var p = slPour(l, slWiz.pour);
  return p ? p.start : l.loadT;
}
function slWizFlags() {
  var pour = (slWiz.pour === 'plant' || slWiz.pour == null) ? null : slWiz.pour;
  return slAudit(slWiz.ticket, pour, slWizTime2(), slWiz.slump);
}
function slWiz4() {
  var l = slLoad(slWiz.ticket);
  var p = (slWiz.pour === 'plant' || slWiz.pour == null) ? null : slPour(l, slWiz.pour);
  var v = p ? p.verifi : null, d = v == null ? null : slWiz.slump - v;
  var flags = slWizFlags();

  var out = flags.map(function (f) {
    return '<div class="sl-notice sl-notice--' + f.sev + '"><span>' + f.t + '</span></div>';
  }).join('');
  if (!flags.length) {
    out += '<div class="sl-notice sl-notice--info"><span>Matched to <b>' + slPourLabel()
      + '</b> and inside tolerance. Nothing here will bounce.</span></div>';
  }

  out += '<div class="sl-confirm-hero">'
    + '<div><div class="sl-k">Measured</div><div class="sl-confirm-v">' + slNum(slWiz.slump) + '<small>in</small></div></div>'
    + '<div class="sl-confirm-d">Verifi at ' + slWizTime2()
      + '<b>' + (v == null ? '\u2014' : slNum(v) + ' in') + '</b>'
      + (d == null ? '' : '<span>\u0394 ' + (d > 0 ? '+' : '') + d.toFixed(2) + ' in</span>') + '</div>'
  + '</div>';

  out += '<div class="sl-sec">Filled in from the load</div>'
    + '<div class="sl-kv">'
      + slKv('Truck', l.truck) + slKv('Ticket', l.ticket) + slKv('Order', l.order)
      + slKv('Pour', slWiz.pour === 'plant' ? 'At the plant'
          : slWiz.pour == null ? '<span class="sl-dim">Not set</span>' : 'Pour ' + slWiz.pour)
      + slKv('Time', slWizTime2() + '<small>' + (slWiz.pour == null ? 'entered by hand' : 'from the pour') + '</small>')
      + slKv('Date', slDateLabel(slWiz.date))
      + slKv('Mix code', l.mix) + slKv('Ticketed slump', slNum(l.ticketed) + ' in')
      + slKv('Load size', l.size.toFixed(2) + ' yd\u00b3')
      + slKv('Location', l.plant) + slKv('Driver', slEsc(l.driver))
      + slKv('Tester', slEsc(SL_TESTER))
    + '</div>'
    + '<div class="sl-auto-note"><span>Eleven fields the legacy form asked for, none of them typed. '
      + 'The tester picked a load and a pour.</span></div>';

  out += '<div class="sl-sec">What you entered</div>'
    + '<div class="sl-kv">'
      + slKv('Measured slump', slNum(slWiz.slump) + ' in')
      + slKv('Shape', slWiz.shape === 'collapsed' ? 'Collapsed' : 'True')
      + slKv('Temperature', slWiz.temp === '' ? '\u2014' : slWiz.temp + ' \u00b0F')
      + slKv('Unit weight', slWiz.uw === '' ? '\u2014' : slWiz.uw + ' lb/ft\u00b3')
      + slKv('Air content', slWiz.air === '' ? '\u2014' : slWiz.air + ' %')
      + slKv('Note', slWiz.note ? slEsc(slWiz.note) : '\u2014')
    + '</div>';
  return out;
}

function slWizSave() {
  var flags = slWizFlags();
  if (slHasError(flags)) return;
  var pour = (slWiz.pour === 'plant' || slWiz.pour == null) ? null : slWiz.pour;
  var id = 'T-' + (slSeq++);
  SL_TESTS.unshift({
    id:id, ticket:slWiz.ticket, pour:pour, date:slWiz.date, time:slWizTime2(),
    measured:slWiz.slump, shape:slWiz.shape, temp:slWiz.temp, uw:slWiz.uw, air:slWiz.air,
    note:slWiz.note, tester:SL_TESTER, source:'field', flags:flags
  });
  var again = slWiz.ticket;
  slDrawerClose();
  slView = 'all';
  slRender();
  slToast('Slump test ' + id + ' saved \u00b7 ' + slNum(SL_TESTS[0].measured) + ' in on '
    + slPourLabelFor(SL_TESTS[0]));
  /* The field case is repetitive: same truck, next pour. Offer that, don't
     make them walk the picker again. */
  setTimeout(function () { slWizOpen(again); }, 420);
}
function slPourLabelFor(t) {
  var load = slLoad(t.ticket) || {};
  return 'truck ' + (load.truck || '\u2014') + (t.pour == null ? '' : ', pour ' + t.pour);
}

/* ── Device mounts ────────────────────────────────────────────────────────── */

function slTeardown() { slDrawerClose(); }

/* Tablet. The tablet shell is a stack of sibling panels rather than a router,
   so opening this page means hiding the siblings and remembering what they
   were, exactly as Insights and Returned Concrete do. */
var SL_TB_SIBLINGS = ['tb-content', 'tb-page-units', 'tb-page-update', 'tb-page-map', 'tb-page-tickets',
  'tb-page-dashboard', 'tb-page-account', 'tb-page-insights', 'tb-page-returned',
  'tb-page-header', 'tb-search-row', 'tb-tabs-row'];
var slTbSnap = null;

function slTabletOpen() {
  if (typeof tbNavClose === 'function') tbNavClose();
  ['ttkClose', 'dbTabletClose', 'amTabletClose', 'inTabletClose', 'rcTabletClose'].forEach(function (f) {
    if (typeof window[f] === 'function') window[f]();
  });
  if (slTbSnap === null) {
    slTbSnap = {};
    SL_TB_SIBLINGS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { slTbSnap[id] = el.style.display; el.style.display = 'none'; }
    });
  }
  var page = document.getElementById('tb-page-slump');
  if (page) page.style.display = 'flex';
  slMode = 't';
  slRender();
}
function slTabletClose() {
  var page = document.getElementById('tb-page-slump');
  if (page) page.style.display = 'none';
  var mount = document.getElementById('sl-tb-mount');
  if (mount) mount.innerHTML = '';
  if (slTbSnap) {
    Object.keys(slTbSnap).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = slTbSnap[id];
    });
    slTbSnap = null;
  }
  slTeardown();
}

function slMobileOpen() {
  if (typeof closeNav === 'function') closeNav();
  ['mtkClose', 'mobSwuClose', 'dbMobileClose', 'amMobileClose', 'inMobileClose', 'rcMobileClose']
    .forEach(function (f) { if (typeof window[f] === 'function') window[f](); });
  var el = document.getElementById('mob-page-slump');
  if (el) el.style.display = 'flex';
  slMode = 'm';
  slRender();
}
function slMobileClose() {
  var el = document.getElementById('mob-page-slump');
  if (el) el.style.display = 'none';
  var mount = document.getElementById('sl-mob-mount');
  if (mount) mount.innerHTML = '';
  slTeardown();
}

/* The one entry point every nav item calls, in every frame. */
function slNav() {
  var c = document.body.classList;
  if (c.contains('view-mobile')) slMobileOpen();
  else if (c.contains('view-tablet')) slTabletOpen();
  else if (typeof dtNavGo === 'function') dtNavGo('slump');
}

/* Quick add from the sidebar: land on the page, then open the wizard. */
function slQuickAdd() {
  slNav();
  if (slGate) return;   /* land on the Coming soon panel, do not force the flow open */
  setTimeout(function () { slWizOpen(); }, 60);
}

/* Leaving for any other device page closes this one. Wrapping the other
   sections' entry points is how every device page in the suite gets put away;
   there is no shared router at this level to ask. */
(function slHook() {
  ['tbNavSetActive', 'ttkOpen', 'dbTabletNav', 'dbTabletOpen', 'amTabletOpen', 'inTabletOpen',
   'rcTabletOpen', 'tbNavUnits', 'tbNavUpdate', 'tbNavMap'].forEach(function (fn) {
    if (typeof window[fn] === 'function' && !window[fn].__slWrapped) {
      var o = window[fn];
      window[fn] = function () { slTabletClose(); return o.apply(this, arguments); };
      window[fn].__slWrapped = true;
    }
  });
  ['mtkOpen', 'mobSwuOpen', 'goToAllTrucks', 'snGoMap', 'dbMobileNav', 'dbMobileOpen',
   'amMobileOpen', 'inMobileOpen', 'rcMobileOpen', 'openUnits'].forEach(function (fn) {
    if (typeof window[fn] === 'function' && !window[fn].__slWrapped) {
      var o = window[fn];
      window[fn] = function () { slMobileClose(); return o.apply(this, arguments); };
      window[fn].__slWrapped = true;
    }
  });
})();

/* ── Desktop routing ──────────────────────────────────────────────────────
   Same shape as app-18 and app-21: an unknown key puts the shell's core pages
   away, then this page is shown and its own nav item lit. This wrapper must
   load after app-21 so both pages compose rather than clobber. */

function slNavLight(on) {
  var dark = document.body.classList.contains('dark');
  ['dt-nav-slump', 'tb-nav-slump'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (on) {
      el.dataset.active = '1';
      el.style.background = dark ? '#e3f200' : 'var(--blue)';
    } else {
      delete el.dataset.active;
      el.style.background = '';
    }
  });
  /* Label and pill colours come from CSS keyed on [data-active]. Writing them
     inline and clearing them to '' was wiping the muted colour the sub-nav
     markup carries, which left the row reading near-black once the user
     navigated away from the page. */
}

var SL_SIBLINGS = ['dt-page-dashboard', 'dt-page-account', 'dt-page-insights', 'dt-page-returned'];

function slDeskShow() {
  slMode = 'd';
  if (typeof dbOrigNavGo === 'function') dbOrigNavGo('__sl__');
  if (typeof dbNavLight === 'function') dbNavLight(false);
  if (typeof inNavLight === 'function') inNavLight(false);
  if (typeof rcNavLight === 'function') rcNavLight(false);
  SL_SIBLINGS.forEach(function (id) { var el = document.getElementById(id); if (el) el.style.display = 'none'; });
  var page = document.getElementById('dt-page-slump');
  if (page) page.style.display = 'flex';
  slNavLight(true);
  slRender();
  /* toggleDarkMode() repaints the nav through dtNavGo(dtUnitsActivePage);
     claiming it keeps a theme flip on this page instead of navigating away. */
  try { if (typeof dtUnitsActivePage !== 'undefined') dtUnitsActivePage = 'slump'; } catch (e) {}
}

var slOrigNavGo = (typeof dtNavGo === 'function') ? dtNavGo : null;
window.dtNavGo = function (key) {
  if (key === 'slump') { slDeskShow(); return; }
  slNavLight(false);
  var page = document.getElementById('dt-page-slump');
  if (page) { page.style.display = 'none'; page.innerHTML = ''; }
  slTeardown();
  if (slOrigNavGo) slOrigNavGo(key);
};

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  if (slDrawer) slDrawerClose();
});


/* ═══ FILE: app-25-batch-assistant.js ═════════════════════════════════════════════════ */

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
  { k:'driver',  l:'Driver',        w:'146px',           on:true },
  { k:'mix',     l:'Mix code',      w:'88px',            on:true },
  { k:'state',   l:'State',         w:'152px',           on:true,  lock:true },
  { k:'slump',   l:'Slump',         w:'152px',           on:true,  lock:true },
  { k:'temp',    l:'Temp',          w:'70px',            on:true },
  { k:'maxwater',l:'Max water',     w:'96px',            on:true },
  { k:'wateradj',l:'Water adj',     w:'96px',            on:true },
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
      + '<div class="ba-panel-b"><div class="ba-table-wrap"><div class="ba-table" style="min-width:720px;">'
        + head + body + '</div></div>'
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
    + '</div><div class="ba-panel-b"><div class="ba-table-wrap">'
      + '<div class="ba-table" style="min-width:700px;">' + body + '</div></div>'
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
              + '</span><small>target ' + baN(l.target) + ' \u00b7 tkt ' + baN(l.ticketed) + '</small></span>',
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
  /* Trailing spacer soaks up whatever is left over. Without it grid hands the
     slack to whichever track is flexible, which is what opened the gap. */
  var tracks = cols.map(function (c) { return c.w; }).join(' ') + ' minmax(0, 1fr)';
  var loads = baLoads();
  /* Real minimum: the fixed tracks plus a floor for each flexible one, plus
     the gaps and the row padding. Guessing at 100px a column made the table
     either clip or scroll when it did not need to. */
  var minW = cols.reduce(function (a, c) {
    var m = /^(\d+)px$/.exec(c.w);
    return a + (m ? parseInt(m[1], 10) : 150);
  }, 0) + cols.length * 10 + 32;

  var head = '<div class="ba-tr ba-th" style="grid-template-columns:' + tracks + ';">'
    + cols.map(function (c) { return '<span>' + c.l + '</span>'; }).join('') + '<span></span></div>';

  var body = loads.length ? loads.map(function (l, i) {
    var cells = baCells(l);
    return '<div class="ba-tr' + (i % 2 ? ' zebra' : '') + '" style="grid-template-columns:' + tracks
      + ';" onclick="baOpenLoad(\'' + l.ticket + '\')">'
      + cols.map(function (c) { return '<span>' + cells[c.k] + '</span>'; }).join('') + '<span></span></div>';
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
    + '<div class="ba-table-wrap"><div class="ba-table" style="min-width:' + minW + 'px;">'
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
