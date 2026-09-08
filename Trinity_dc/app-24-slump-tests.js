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
  var el = document.getElementById('dt-nav-slump');
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
