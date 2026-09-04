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
