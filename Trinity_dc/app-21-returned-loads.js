/* ============================================================================
   app-21-returned-loads.js
   RETURNED CONCRETE — Returned Loads
   ----------------------------------------------------------------------------
   The Hub's Returned Loads report, rebuilt in the Trinity dialect. Uptime is
   deliberately out of scope; the page carries the tab so the second view has
   somewhere to land, and it renders a placeholder.

   What the page is for. A returned load is a billing event: concrete left the
   plant, some of it went into the customer's forms, and the rest came back.
   The table says how much came back and what is billable. The map is the
   proof: batched here, poured there, discharged back there, so the number in
   the last column is not an assertion, it is a receipt.

   Structure, per the page recipe: title row with the two exports, one filter
   row, the billing settings card, the Full / Partial tabs, then a 50/50 split
   of table and journey panel. Selecting a row drives the panel; nothing else
   in the page reacts to selection.

   Three departures from the legacy screen, all of them dialect:

     1. The map is Leaflet on real tiles, not the hand-drawn SVG basemap. The
        journey coordinates in the legacy file are schematic (a 1000x720 art
        board), so rcLL() fits them onto the Tucson corridor they were drawn
        to represent. A pin here and a pin on the fleet map are the same
        component.
     2. The legacy pin palette was Google's amber / green / red. Red and amber
        are alert colours in Trinity and nothing else, so the locations are
        neutral labelled pills and the two trail legs carry the phase tokens
        they actually are: --phase-to-job outbound, --phase-return-to-plant
        back. The same colours the Status tab groups readings by.
     3. Billing settings stay a card, not filters. They change what is
        billable rather than what is shown, which is a producer decision made
        once, and the caption says so.

   Billing settings are producer-side and compound: a load is billable only if
   its pour count is at or under the maximum, and only if the returned volume
   survives the accuracy buffer and the rounding, which always rounds down. A
   load that falls to zero drops out of billing entirely rather than billing
   at zero, so the table is the billable set, not the returned set.

   Not built, and known: the invoice preview behind Download invoice (the
   legacy file has a full rate-editable receipt), the date picker calendar,
   and the Uptime chart. All three toast instead.

   Device frames. One renderer, three mounts. The split is a flex row on
   desktop and a column on tablet, and the table and the card stack are BOTH
   emitted every render with CSS choosing between them, so rotating a frame
   swaps layouts without a re-render. That is app-08's Status table pattern,
   reused rather than reinvented.

   Mobile is the one behaviour change: the journey panel cannot sit beside or
   under a list on a phone, so it becomes a sheet. Tapping a load raises it,
   Close puts it away. Same read as the desktop split, one load at a time.

   Load order: after app-13 (vfDd), app-17 (amToast, amTag, am-table styles)
   and app-18 (its dtNavGo wrapper, which this one composes with).
   ========================================================================== */

/* ── Data ─────────────────────────────────────────────────────────────────────
   Lifted from the Hub prototype so the two screens show the same loads. Each
   record carries the three locations (plant / job / discharge) plus the
   outbound and return legs as SVG path data, which is what the breadcrumb
   trail is sampled from. Belongs in shared-data.js the day it stops being
   mock. */

var RC_LOADS = {
  partial: [
    { ticket:'49604962', customer:'Old Pueblo Construction', order:'1029', loadT:'11:16 AM', recvT:'11:19 AM', date:'08/11/2026',
      ret:'Pima', addr:'35 East Quail Crossing Boulevard, Green Valley', size:7, returned:3.89, pours:1,
      dischargeType:'plant', batchT:'10:31 AM', arriveT:'10:52 AM',
      plant:[430,560], plantName:'Pima Plant', job:[330,655], jobName:'E Quail Crossing Blvd',
      out:'M430 560 C 400 585, 370 600, 355 625 S 335 645, 330 655',
      back:'M330 655 C 350 640, 385 615, 400 595 S 420 575, 430 560' },
    { ticket:'49604869', customer:'Sonoran Homes', order:'1367', loadT:'10:36 AM', recvT:'10:37 AM', date:'08/11/2026',
      ret:'Aqua Fria Ready Mix', addr:'Cactus & Loop 303, Surprise', size:7, returned:2.87, pours:2,
      dischargeType:'plant', batchT:'9:48 AM', arriveT:'10:07 AM',
      plant:[150,120], plantName:'Aqua Fria Plant', job:[95,62], jobName:'Cactus & Loop 303',
      out:'M150 120 C 130 105, 115 90, 105 78 S 98 68, 95 62',
      back:'M95 62 C 105 75, 118 92, 130 104 S 142 114, 150 120' },
    { ticket:'49604878', customer:'Pantano Contracting', order:'1228', loadT:'10:30 AM', recvT:'10:33 AM', date:'08/11/2026',
      ret:'San Tan', addr:'1223 E Pecos Rd, Gilbert', size:10.5, returned:2.84, pours:1,
      dischargeType:'plant', batchT:'9:40 AM', arriveT:'9:58 AM',
      plant:[760,300], plantName:'San Tan Plant', job:[875,240], jobName:'E Pecos Rd',
      out:'M760 300 C 795 285, 830 268, 850 255 S 868 246, 875 240',
      back:'M875 240 C 860 252, 830 270, 805 283 S 778 294, 760 300' },
    { ticket:'49604845', customer:'Rincon Structures', order:'1296', loadT:'10:24 AM', recvT:'10:26 AM', date:'08/11/2026',
      ret:'Apex', addr:'Tangerine Rd & N Innovation Pk Dr, Oro Valley', size:6, returned:3.18, pours:2,
      dischargeType:'plant', batchT:'9:22 AM', arriveT:'9:47 AM',
      plant:[255,242], plantName:'Apex Plant', job:[600,160], jobName:'Tangerine & Innovation Pk',
      out:'M255 242 C 330 238, 400 240, 455 225 S 545 185, 600 160',
      back:'M600 160 C 555 190, 500 220, 440 238 S 330 246, 255 242' },
    { ticket:'49604840', customer:'Rincon Structures', order:'1199', loadT:'10:16 AM', recvT:'10:20 AM', date:'08/11/2026',
      ret:'Apex', addr:'6011 N La Cholla Blvd, Tucson', size:10.5, returned:5.75, pours:1,
      dischargeType:'plant', batchT:'9:15 AM', arriveT:'9:38 AM',
      plant:[255,242], plantName:'Apex Plant', job:[430,420], jobName:'N La Cholla Blvd',
      out:'M255 242 C 300 290, 350 340, 390 380 S 418 408, 430 420',
      back:'M430 420 C 412 400, 375 358, 340 320 S 285 268, 255 242' },
    { ticket:'49604799', customer:'Old Pueblo Construction', order:'6002', loadT:'10:02 AM', recvT:'10:04 AM', date:'08/11/2026',
      ret:'Pima', addr:'14787 East Sands Ranch Road, Vail', size:5, returned:3.59, pours:1,
      dischargeType:'dump', batchT:'9:04 AM', arriveT:'9:31 AM',
      plant:[430,560], plantName:'Pima Plant', job:[705,635], jobName:'E Sands Ranch Rd',
      dump:[445,566], dumpName:'Pima Dump Site',
      out:'M430 560 C 510 585, 590 605, 645 618 S 690 630, 705 635',
      back:'M705 635 C 665 628, 600 615, 545 600 S 470 575, 445 566' },
    { ticket:'49604791', customer:'Catalina Paving', order:'1257', loadT:'09:55 AM', recvT:'09:58 AM', date:'08/11/2026',
      ret:'San Tan', addr:'Terrace Rd & Hwy 24, Sacaton', size:10, returned:4.92, pours:2,
      dischargeType:'plant', batchT:'9:02 AM', arriveT:'9:26 AM',
      plant:[760,300], plantName:'San Tan Plant', job:[850,440], jobName:'Terrace Rd & Hwy 24',
      out:'M760 300 C 800 335, 828 370, 842 400 S 850 428, 850 440',
      back:'M850 440 C 845 415, 830 380, 810 350 S 780 315, 760 300' }
  ],
  full: [
    { ticket:'49604712', customer:'Marana Builders', order:'1188', loadT:'09:12 AM', recvT:'09:15 AM', date:'08/11/2026',
      ret:'Apex', addr:'W Ina Rd & N Thornydale Rd, Marana', size:9, returned:9.0, pours:0,
      dischargeType:'plant', batchT:'8:20 AM', arriveT:'8:44 AM',
      plant:[255,242], plantName:'Apex Plant', job:[190,160], jobName:'Ina & Thornydale',
      out:'M255 242 C 235 215, 218 192, 205 178 S 195 166, 190 160',
      back:'M190 160 C 200 172, 215 190, 230 210 S 248 233, 255 242' },
    { ticket:'49604688', customer:'Pantano Contracting', order:'6014', loadT:'08:47 AM', recvT:'08:51 AM', date:'08/11/2026',
      ret:'Pima', addr:'S Houghton Rd & E Valencia Rd, Tucson', size:10.5, returned:10.5, pours:0,
      dischargeType:'plant', batchT:'7:55 AM', arriveT:'8:19 AM',
      plant:[430,560], plantName:'Pima Plant', job:[640,540], jobName:'Houghton & Valencia',
      out:'M430 560 C 495 552, 560 546, 600 542 S 628 540, 640 540',
      back:'M640 540 C 610 544, 555 550, 505 555 S 450 559, 430 560' }
  ]
};

/* ── State ────────────────────────────────────────────────────────────────── */

var rcSet = 'partial';
var rcTicket = '49604845';
var rcSettings = { maxPours: 2, buffer: 0, round: 0 };
var rcCustomer = '';
var rcMap = null, rcLayer = null, rcSvg = null;
var rcMode = 'd';          /* which frame owns the page: d, t or m */
var rcSheet = false;       /* mobile only: is the journey sheet up */

function rcEsc(s) { return (typeof dbEsc === 'function') ? dbEsc(s) : String(s == null ? '' : s); }
function rcToast(m) { if (typeof amToast === 'function') amToast(m); }

/* ── Billing ──────────────────────────────────────────────────────────────
   Buffer first, then rounding, always down. Null means the load stops being
   billable rather than billing at zero, which is why the table below is the
   billable set and not the returned set. */
function rcBill(r) {
  var b = r.returned - rcSettings.buffer;
  if (b <= 0) return null;
  if (rcSettings.round > 0) b = Math.floor(b / rcSettings.round) * rcSettings.round;
  return b > 0 ? b : null;
}

function rcRows(set) {
  return (RC_LOADS[set || rcSet] || []).filter(function (r) {
    return r.pours <= rcSettings.maxPours
      && (!rcCustomer || r.customer === rcCustomer)
      && rcBill(r) !== null;
  });
}

function rcFind(t) {
  var all = RC_LOADS.partial.concat(RC_LOADS.full);
  for (var i = 0; i < all.length; i++) if (all[i].ticket === t) return all[i];
  return null;
}

function rcCustomers() {
  var seen = {}, out = [];
  RC_LOADS.partial.concat(RC_LOADS.full).forEach(function (r) {
    if (!seen[r.customer]) { seen[r.customer] = 1; out.push(r.customer); }
  });
  return out.sort();
}

function rcTotal() {
  return rcRows().reduce(function (a, r) { return a + (rcBill(r) || 0); }, 0);
}

/* ── Schematic coordinates to real ones ───────────────────────────────────
   The legacy journeys were drawn on a 1000x720 art board with Tucson at
   (470,450) and Marana at (150,180). These constants are the linear fit
   through those two anchors, so the trails land on the corridor they were
   drawn to represent. Approximate by construction; when real GPS arrives,
   this function is the only thing that changes. */
var RC_LAT0 = 33.076, RC_LAT_K = 1.369 / 720;
var RC_LNG0 = -111.337, RC_LNG_K = 0.781 / 1000;

function rcLL(pt) {
  return [RC_LAT0 - pt[1] * RC_LAT_K, RC_LNG0 + pt[0] * RC_LNG_K];
}

/* Breadcrumbs come off the legacy bezier paths. getPointAtLength needs the
   path in the document, so one hidden SVG is kept for measuring. */
function rcSampler() {
  if (rcSvg && document.body.contains(rcSvg)) return rcSvg;
  rcSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  rcSvg.setAttribute('class', 'rc-sampler');
  rcSvg.innerHTML = '<path id="rc-sample-path"></path>';
  document.body.appendChild(rcSvg);
  return rcSvg;
}

function rcTrail(d, n) {
  var svg = rcSampler();
  var p = svg.querySelector('#rc-sample-path');
  p.setAttribute('d', d);
  var out = [], len = 0;
  try { len = p.getTotalLength(); } catch (e) { len = 0; }
  if (!len) return out;
  for (var i = 0; i <= n; i++) {
    var q = p.getPointAtLength(len * (i / n));
    out.push(rcLL([q.x, q.y]));
  }
  return out;
}

/* ── Interactions ─────────────────────────────────────────────────────────── */

function rcSelect(t) {
  rcTicket = t;
  rcRenderTable();
  rcRenderJourney();
  /* On a phone the panel is a sheet, so selecting is also what opens it. */
  if (rcMode === 'm') rcSheetOpen();
}

function rcSheetOpen() {
  rcSheet = true;
  var el = document.getElementById('rc-panel');
  if (el) el.classList.add('on');
  /* Leaflet measured zero while the sheet was down. */
  setTimeout(function () { if (rcMap) { rcMap.invalidateSize(); rcRenderJourney(); } }, 60);
}

function rcSheetClose() {
  rcSheet = false;
  var el = document.getElementById('rc-panel');
  if (el) el.classList.remove('on');
}

function rcTab(set) {
  rcSet = set;
  var rows = rcRows();
  if (rows.length) rcTicket = rows[0].ticket;
  rcRender();
}

function rcSetPours(v) { rcSettings.maxPours = +v; rcAfterSettings(); }
function rcSetBuffer(v) { rcSettings.buffer = +v; rcAfterSettings(); }

function rcSetRound(v) {
  rcSettings.round = +v;
  rcAfterSettings();
}

/* A settings change can drop the selected load out of billing, so selection
   is re-resolved before anything repaints. */
function rcAfterSettings() {
  var rows = rcRows();
  if (!rows.some(function (r) { return r.ticket === rcTicket; })) {
    rcTicket = rows.length ? rows[0].ticket : null;
  }
  rcRender();
}

function rcPickCustomer(v) { rcCustomer = v || ''; rcAfterSettings(); }

function rcZoom(d) { if (rcMap) rcMap.setZoom(rcMap.getZoom() + d); }
function rcFit() { rcRenderJourney(); }

function rcDownloadAll() {
  rcToast('Prototype \u2014 would export ' + rcRows('partial').length + ' partial and '
    + rcRows('full').length + ' full loads for this date range');
}
function rcDownloadInvoice() {
  rcToast('Prototype \u2014 the invoice preview is not built yet');
}
function rcDates() { rcToast('Prototype \u2014 the date picker is not built yet'); }

/* ── Render: header, filters, settings ────────────────────────────────────── */

var RC_ROUNDS = [
  { v:1,    label:'Whole yd\u00b3' },
  { v:0.5,  label:'Half yd\u00b3' },
  { v:0.25, label:'Quarter yd\u00b3' },
  { v:0,    label:'None' }
];

function rcTip(text) {
  return '<span class="rc-tip" tabindex="0">i<span class="rc-tip-pop">' + text + '</span></span>';
}

function rcHead() {
  return '<div class="rc-head">'
    + '<div><div class="am-title rc-title">Returned Concrete</div>'
      + '<div class="rc-sub">Load date 08/11/2026 \u00b7 ' + rcRows().length + ' billable '
      + (rcRows().length === 1 ? 'load' : 'loads') + ' \u00b7 ' + rcTotal().toFixed(2) + ' yd\u00b3 to bill</div></div>'
    + '<div class="rc-head-actions">'
      + '<button class="am-pill" onclick="rcDownloadAll()">Download all data</button>'
      + '<button class="am-pill" onclick="rcDownloadInvoice()">Download invoice</button>'
    + '</div></div>';
}

function rcFilters() {
  return '<div class="in-filters rc-filters">'
    + '<div class="in-f"><label class="in-f-l">Date range</label>'
      + '<button class="am-pill rc-daterange" onclick="rcDates()">08/11/2026 \u2013 08/11/2026'
      + '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M5.5 2v3M10.5 2v3M2.5 7h11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></button></div>'
    + '<div class="in-f rc-f-cust"><label class="in-f-l">Customer</label>'
      + vfDd({ id:'rc-dd-cust', options:[{ v:'', label:'All customers' }].concat(rcCustomers().map(function (c) { return { v:c, label:c }; })),
               value:(rcCustomer || ''), placeholder:'All customers', onChange:'rcPickCustomer' }) + '</div>'
    + '</div>';
}

function rcSettingsCard() {
  return '<div class="am-card rc-settings">'
    + '<div class="rc-settings-cap">'
      + '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.2"/><path d="M8 1.6v2M8 12.4v2M1.6 8h2M12.4 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M12.5 3.5l-1.4 1.4M4.9 11.1L3.5 12.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>'
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

/* ── Render: table ────────────────────────────────────────────────────────── */

var RC_COLS = [
  ['Ticket number', ''], ['Load date', ''], ['Customer', ''], ['Return location', ''],
  ['Load size', 'num'], ['Returned', 'num'], ['Pours', 'num'], ['Amount to bill', 'num']
];

function rcTabs() {
  var n = { partial: rcRows('partial').length, full: rcRows('full').length };
  return '<div class="rc-tabs">'
    + ['partial', 'full'].map(function (k) {
        return '<button class="rc-tab' + (rcSet === k ? ' active' : '') + '" onclick="rcTab(\'' + k + '\')">'
          + (k === 'partial' ? 'Partial loads' : 'Full loads')
          + '<span class="rc-tab-n">' + n[k] + '</span></button>';
      }).join('')
    + '</div>';
}

function rcRowHtml(r, i) {
  var bill = rcBill(r);
  return '<div class="am-tr rc-tr' + (i % 2 ? ' zebra' : '') + (r.ticket === rcTicket ? ' sel' : '')
      + '" onclick="rcSelect(\'' + r.ticket + '\')">'
    + '<span><button class="rc-link">' + r.ticket + '</button></span>'
    + '<span class="rc-stack"><b>' + r.loadT + '</b><em>' + r.date + ' \u00b7 Order ' + r.order + '</em></span>'
    + '<span class="rc-stack"><b>' + rcEsc(r.customer) + '</b><em title="' + rcEsc(r.addr) + '">' + rcEsc(r.addr) + '</em></span>'
    + '<span class="rc-stack"><b>' + rcEsc(r.ret) + '</b>'
      + (r.dischargeType === 'dump' ? '<em class="rc-dump">Dump site</em>' : '') + '</span>'
    + '<span class="num">' + r.size + ' yd\u00b3</span>'
    + '<span class="num">' + r.returned.toFixed(2) + ' yd\u00b3</span>'
    + '<span class="num">' + r.pours + '</span>'
    + '<span class="num rc-bill">' + bill.toFixed(2) + ' yd\u00b3</span>'
    + '</div>';
}

function rcTableHtml() {
  var rows = rcRows();
  var head = '<div class="am-tr am-th rc-tr">' + RC_COLS.map(function (c) {
    return '<span' + (c[1] ? ' class="' + c[1] + '"' : '') + '>' + c[0] + '</span>';
  }).join('') + '</div>';

  if (!rows.length) {
    return '<div class="am-table rc-table">' + head + '</div>'
      + '<div class="rc-empty">No billable loads match these settings. Raising the max pour count or lowering the accuracy buffer will bring loads back.</div>';
  }
  return '<div class="am-table rc-table">' + head
    + rows.map(function (r, i) { return rcRowHtml(r, i); }).join('')
    + '</div>'
    + '<div class="rc-foot"><span>' + rows.length + (rows.length === 1 ? ' load' : ' loads') + '</span>'
    + '<span>Total to bill <b>' + rcTotal().toFixed(2) + ' yd\u00b3</b></span></div>';
}

/* Mobile portrait card stack. Eight columns is not a table on a phone, it is
   a list wearing table chrome, so the same fields become a card: who, where,
   how much came back, and what bills. Both markups are rendered and CSS picks
   one, which is how the Status table handles the same problem. */
function rcCardsHtml() {
  var rows = rcRows();
  if (!rows.length) return '';
  return '<div class="rc-cards">' + rows.map(function (r) {
    var bill = rcBill(r);
    return '<div class="rc-card' + (r.ticket === rcTicket ? ' sel' : '') + '" onclick="rcSelect(\'' + r.ticket + '\')">'
      + '<div class="rc-card-top"><button class="rc-link">' + r.ticket + '</button>'
        + '<span class="rc-card-bill">' + bill.toFixed(2) + ' yd\u00b3</span></div>'
      + '<div class="rc-card-cust">' + rcEsc(r.customer) + '</div>'
      + '<div class="rc-card-addr">' + rcEsc(r.addr) + '</div>'
      + '<div class="rc-card-meta">'
        + '<span>' + r.returned.toFixed(2) + ' of ' + r.size + ' yd\u00b3 back</span>'
        + '<span>' + r.pours + ' pour' + (r.pours === 1 ? '' : 's') + '</span>'
        + '<span>' + rcEsc(r.ret) + (r.dischargeType === 'dump' ? ' \u00b7 dump site' : '') + '</span>'
      + '</div></div>';
  }).join('') + '</div>';
}

function rcRenderTable() {
  var el = document.getElementById('rc-table');
  if (el) el.innerHTML = rcTableHtml() + rcCardsHtml();
  var tabs = document.getElementById('rc-tabs');
  if (tabs) tabs.innerHTML = rcTabs();
}

/* ── Render: journey panel ────────────────────────────────────────────────── */

function rcReceipt(r) {
  if (!r) {
    return '<div class="rc-rc-step"><div class="rc-rc-k">Journey</div>'
      + '<div class="rc-rc-v rc-rc-none">Select a load to see its route, where it discharged, and why it bills.</div></div>';
  }
  var bill = rcBill(r);
  var poured = (r.size - r.returned).toFixed(2);
  var dis = r.dischargeType === 'dump' ? r.dumpName : r.plantName;
  var step = function (dot, k, v, m) {
    return '<div class="rc-rc-step"><div class="rc-rc-k"><span class="rc-dot ' + dot + '"></span>' + k + '</div>'
      + '<div class="rc-rc-v">' + v + '</div><div class="rc-rc-m">' + rcEsc(m) + '</div></div>';
  };
  return step('rc-dot-plant', 'Batched', r.batchT + ' \u00b7 ' + r.size + ' yd\u00b3', r.plantName)
    + step('rc-dot-job', 'Poured', poured + ' yd\u00b3 \u00b7 ' + r.pours + ' pour' + (r.pours === 1 ? '' : 's'),
           'Arrived ' + r.arriveT + ' \u00b7 ' + r.jobName)
    + step('rc-dot-dis', 'Discharged', r.recvT + ' \u00b7 ' + r.returned.toFixed(2) + ' yd\u00b3',
           dis + (r.dischargeType === 'dump' ? ' (dump site)' : ''))
    + '<div class="rc-rc-bill"><div class="rc-rc-k">Bill ' + rcEsc(r.customer) + '</div>'
      + '<div class="rc-rc-v">' + (bill === null ? '\u2014' : bill.toFixed(2) + ' yd\u00b3') + '</div>'
      + '<div class="rc-rc-m">' + (rcSettings.buffer || rcSettings.round
          ? 'After buffer and rounding' : 'Exact measured amount') + '</div></div>';
}

function rcPanelHtml() {
  var r = rcTicket ? rcFind(rcTicket) : null;
  return '<button class="rc-sheet-close" onclick="rcSheetClose()">'
      + '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>Close</button>'
    + '<div class="rc-receipt" id="rc-receipt">' + rcReceipt(r) + '</div>'
    + '<div class="rc-map-stage">'
      + '<div class="rc-map-chip" id="rc-map-chip"></div>'
      + '<div class="rc-map" id="rc-map"></div>'
      + '<div class="dc-map-controls rc-map-controls">'
        + '<div class="dc-map-ctrl-stack"><button class="dc-map-ctrl-btn" onclick="rcFit()" title="Fit journey">'
          + '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6V3a1 1 0 011-1h3M14 6V3a1 1 0 00-1-1h-3M2 10v3a1 1 0 001 1h3M14 10v3a1 1 0 01-1 1h-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button></div>'
        + '<div class="dc-map-zoom">'
          + '<button class="dc-map-ctrl-btn" onclick="rcZoom(1)" title="Zoom in"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>'
          + '<button class="dc-map-ctrl-btn" onclick="rcZoom(-1)" title="Zoom out"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>'
        + '</div></div>'
      + '<div class="rc-legend">'
        + '<div class="rc-legend-h">Locations</div>'
        + '<div class="rc-legend-r"><span class="rc-dot rc-dot-plant"></span>Batch plant</div>'
        + '<div class="rc-legend-r"><span class="rc-dot rc-dot-job"></span>Job site</div>'
        + '<div class="rc-legend-r"><span class="rc-dot rc-dot-dis"></span>Discharge</div>'
        + '<div class="rc-legend-h">Trail</div>'
        + '<div class="rc-legend-r"><span class="rc-dot rc-dot-out"></span>Plant to job</div>'
        + '<div class="rc-legend-r"><span class="rc-dot rc-dot-back"></span>Return trip</div>'
      + '</div>'
    + '</div>';
}

function rcInitMap() {
  var el = document.getElementById('rc-map');
  if (!el || typeof L === 'undefined') return;
  if (rcMap) { try { rcMap.remove(); } catch (e) {} rcMap = null; }
  rcMap = L.map(el, { zoomControl:false, attributionControl:false });
  rcMap.setView([32.22, -110.97], 10);
  L.tileLayer((typeof window !== 'undefined' && window.TKM_TILE_URL) || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    { maxZoom: 19 }).addTo(rcMap);
  rcLayer = L.layerGroup().addTo(rcMap);
}

function rcPin(ll, cls, label) {
  return L.marker(ll, { icon: L.divIcon({
    className: '', iconSize:[0, 0], iconAnchor:[0, 30],
    html: '<span class="dc-map-marker rc-pin ' + cls + '">' + rcEsc(label) + '</span>'
  }) });
}

function rcCrumbs(pts, cls) {
  return pts.map(function (ll) {
    return L.marker(ll, { icon: L.divIcon({
      className: '', iconSize:[0, 0], iconAnchor:[4, 4],
      html: '<span class="rc-crumb ' + cls + '"></span>'
    }) });
  });
}

function rcRenderJourney() {
  var box = document.getElementById('rc-receipt');
  var chip = document.getElementById('rc-map-chip');
  var r = rcTicket ? rcFind(rcTicket) : null;
  if (box) box.innerHTML = rcReceipt(r);
  if (chip) chip.innerHTML = r
    ? 'Ticket ' + r.ticket + '<span> \u00b7 Order ' + r.order + ' \u00b7 ' + rcEsc(r.ret) + '</span>'
    : 'No load selected';
  if (!rcMap || !rcLayer || typeof L === 'undefined') return;
  rcLayer.clearLayers();
  if (!r) return;

  /* Legs carry the phase they are: out to the job, then back to the plant. */
  var out = rcTrail(r.out, 14), back = rcTrail(r.back, 14);
  if (out.length) L.polyline(out, { className:'rc-trail rc-trail-out', weight:2.5, opacity:1 }).addTo(rcLayer);
  if (back.length) L.polyline(back, { className:'rc-trail rc-trail-back', weight:2.5, opacity:1 }).addTo(rcLayer);
  rcCrumbs(out.slice(1, -1), 'rc-crumb-out').forEach(function (m) { m.addTo(rcLayer); });
  rcCrumbs(back.slice(1, -1), 'rc-crumb-back').forEach(function (m) { m.addTo(rcLayer); });

  rcPin(rcLL(r.job), 'rc-pin-job', r.jobName).addTo(rcLayer);
  if (r.dischargeType === 'dump') {
    rcPin(rcLL(r.plant), 'rc-pin-plant', r.plantName).addTo(rcLayer);
    rcPin(rcLL(r.dump), 'rc-pin-dis', 'Discharge \u00b7 ' + r.dumpName).addTo(rcLayer);
  } else {
    /* Batched and discharged at the same plant: one pin, both jobs named,
       rather than two pins stacked on the same point. */
    rcPin(rcLL(r.plant), 'rc-pin-dual', r.plantName + ' \u00b7 batch and discharge').addTo(rcLayer);
  }

  var bounds = out.concat(back);
  if (bounds.length) rcMap.fitBounds(bounds, { padding:[80, 90], maxZoom:14 });
  setTimeout(function () { if (rcMap) rcMap.invalidateSize(); }, 40);
}

/* ── Render: page ─────────────────────────────────────────────────────────── */

var rcView = 'returned';

function rcUptimeHtml() {
  return '<div class="rc-soon"><div class="rc-soon-t">Uptime</div>'
    + '<div class="rc-soon-d">The uptime breakdown is not part of this pass. It comes over from the Hub next, using the same chart grammar as Insights.</div></div>';
}

function rcHtml() {
  var html = '<div class="rc-scroll">' + rcHead()
    + '<div class="rc-views">'
      + ['returned', 'uptime'].map(function (k) {
          return '<button class="rc-view' + (rcView === k ? ' active' : '') + '" onclick="rcGoView(\'' + k + '\')">'
            + (k === 'returned' ? 'Returned loads' : 'Uptime') + '</button>';
        }).join('')
    + '</div>';

  if (rcView === 'uptime') return html + rcUptimeHtml() + '</div>';

  html += rcFilters() + rcSettingsCard()
    + '<div class="rc-split">'
      + '<div class="rc-left"><div id="rc-tabs">' + rcTabs() + '</div>'
        + '<div class="am-table-wrap rc-table-wrap" id="rc-table">' + rcTableHtml() + rcCardsHtml() + '</div></div>'
      + '<div class="rc-right"><div class="rc-panel' + (rcSheet ? ' on' : '') + '" id="rc-panel">' + rcPanelHtml() + '</div></div>'
    + '</div></div>';
  return html;
}

function rcGoView(v) { rcView = v; rcRender(); }

/* One renderer, three mounts. Only the active frame's mount holds markup, so
   there is never more than one #rc-map in the document to confuse Leaflet. */
function rcHost() {
  if (rcMode === 't') return document.getElementById('rc-tb-mount');
  if (rcMode === 'm') return document.getElementById('rc-mob-mount');
  return document.getElementById('dt-page-returned');
}

function rcRender() {
  var host = rcHost();
  if (!host) return;
  host.innerHTML = rcHtml();
  if (rcView !== 'returned') { rcMap = null; return; }
  rcInitMap();
  rcRenderJourney();
}

function rcTeardown() {
  if (rcMap) { try { rcMap.remove(); } catch (e) {} rcMap = null; }
  rcLayer = null;
  rcSheet = false;
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
  rcSheet = false;
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
  rcView = 'returned';
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

window.addEventListener('resize', function () { if (rcMap) rcMap.invalidateSize(); });
