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
