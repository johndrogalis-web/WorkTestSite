/* ============================================================================
   app-15-onboarding.js
   WORKSPACE SETUP — first-run wizard that builds the user's dashboard
   ----------------------------------------------------------------------------
   Runs once, straight after login. Four steps: a welcome, then role, daily
   focus, and theme. Every answer recomputes the dashboard layout, and the
   right pane shows that layout live at about a third scale so the choice has
   consequences you can see rather than a promise you have to trust.

   The preview is the real thing, not a mock. It renders the actual widgets
   through app-13's dbCardHtml with the real DB_WIDGETS bodies, into a fixed
   1360x860 stage that is then CSS-scaled to fit the pane. Two substitutions:
   the fleet map renders as a flat panel (Leaflet measures itself with
   getBoundingClientRect, which a CSS scale corrupts), and the rail is a
   static replica since the app's own rail is a single instance elsewhere in
   the DOM.

   The result is persisted: the computed layout goes to app-13's own
   localStorage key, so a returning user lands on their dashboard and never
   sees this again. "Reset workspace setup" in the top-bar options menu clears
   it and starts over.

   Departures from the Figma
     - The primary buttons are lime in the file. Lime is the outdated accent:
       blue in light mode, lime only on dark. Same correction as the login.
     - Picking a theme applies it for real, so the whole surface flips, not
       just the preview. Scoping dark to one container is not possible without
       duplicating the shared.css token block, and seeing the app flip is the
       better demo anyway.

   Load order: after app-13 (needs DB_WIDGETS/dbCardHtml) and app-14.
   ========================================================================== */

/* ── State ────────────────────────────────────────────────────────────────── */

var OB_KEY = 'vfOnboard1';
var obStep = 0;
var obPick = { role: 'dispatch', focus: 'tickets', theme: 'light' };

var OB_STEPS = [
  { kind:'welcome', title:'Let\u2019s set up your workspace', cta:'Let\u2019s get started' },
  { kind:'choice', key:'role',  title:'What role do you have at<br>your company?',
    options:[ ['qc','Quality control'], ['dispatch','Dispatch'], ['manager','Manager'], ['success','Customer success'] ] },
  { kind:'choice', key:'focus', title:'What\u2019s most important<br>in your daily work?',
    options:[ ['tickets','Active tickets'], ['map','The map'], ['phases','Phases'], ['diag','Diagnostics'] ] },
  { kind:'choice', key:'theme', title:'Choose your theme',
    options:[ ['light','Light mode'], ['dark','Dark mode'], ['system','Same as my system'] ] }
];

/* ── Layout computation ───────────────────────────────────────────────────── */

/* Each role gets a starting board. Top strip is small widgets only, since
   that shelf renders everything at quarter size. */
var OB_ROLE_LAYOUTS = {
  dispatch: {
    top:  ['recent-notifications', 'create-ticket', 'alerts-warnings', 'component-condition'],
    work: [['truck-phases', 'active-tickets'], ['fleet-map']]
  },
  qc: {
    top:  ['recent-notifications', 'component-condition', 'alerts-warnings', 'delivered-on-spec'],
    work: [['slump-at-plant', 'active-orders'], ['delivered-within-spec']]
  },
  manager: {
    top:  ['recent-notifications', 'fleet-uptime', 'time-to-discharge', 'end-load-to-leave'],
    work: [['batch-scorecard'], ['top-drivers', 'bottom-drivers']]
  },
  success: {
    top:  ['recent-notifications', 'top-contractors', 'scheduled-maintenance', 'in-maintenance'],
    work: [['active-orders', 'active-tickets'], ['fleet-map']]
  }
};

/* Daily focus decides what leads the workspace. */
var OB_FOCUS_WIDGET = { tickets:'active-tickets', map:'fleet-map', phases:'truck-phases', diag:'components-matrix' };

function obPromote(work, id) {
  var found = -1;
  for (var r = 0; r < work.length; r++) if (work[r].indexOf(id) >= 0) { found = r; break; }
  if (found > 0) { var row = work.splice(found, 1)[0]; work.unshift(row); }
  else if (found < 0) work.unshift([id]);
  return work;
}

function obLayout() {
  var base = OB_ROLE_LAYOUTS[obPick.role] || OB_ROLE_LAYOUTS.dispatch;
  var top = base.top.slice();
  var work = base.work.map(function (r) { return r.slice(); });

  var lead = OB_FOCUS_WIDGET[obPick.focus];
  if (lead) work = obPromote(work, lead);
  /* Diagnostics wants the condition tile on the shelf too. */
  if (obPick.focus === 'diag' && top.indexOf('component-condition') < 0) {
    top.splice(1, 0, 'component-condition');
    top = top.slice(0, 5);
  }
  return { top: [top], work: work };
}

/* ── Preview renderer ─────────────────────────────────────────────────────── */

var OB_STAGE_W = 1360, OB_STAGE_H = 860;

/* Leaflet cannot live inside a CSS-scaled box, so the map shows as a panel. */
function obMapStub(size) {
  return '<div class="db-card db-size-' + size + ' ob-map-stub">'
    + '<div class="ob-map-search">Ticket, truck, order, mix, plant, etc.</div>'
    + '<div class="ob-map-pill">Go to the map</div></div>';
}

function obCard(id, size) {
  if (id === 'fleet-map') return obMapStub(size);
  var def = (typeof dbDef === 'function') ? dbDef(id) : null;
  if (!def) return '';
  try { return dbCardHtml(def, size); }
  catch (e) { return '<div class="db-card db-size-' + size + '"></div>'; }
}

function obPreviewRender() {
  var stage = document.getElementById('ob-stage');
  if (!stage) return;
  var blank = (obStep === 0);
  var L = obLayout();

  var rail = '<div class="ob-rail">'
    + '<div class="ob-rail-brand"><svg width="70" height="18" viewBox="0 0 96 24" fill="none"><path d="M10.3958 8.06142H0V11.2399H9.15381L0.367992 24H8.00383L12.6497 11.286C13.1097 10.0422 12.4197 8.06142 10.3958 8.06142ZM16.6517 8.06142C14.6277 8.06142 13.9377 10.0422 14.3977 11.286L19.0436 24H26.6794L17.8936 11.2399H27.0474V8.06142H16.6517Z" fill="var(--strong)"/></svg><span>verifi</span></div>'
    + ['Home', 'Tickets', 'Diagnostic Center', 'Mix Design', 'Insights', 'Returned Concrete'].map(function (n, i) {
        return '<div class="ob-rail-item' + (i === 0 ? ' on' : '') + '">' + n + '</div>';
      }).join('')
    + '<div class="ob-rail-foot">' + ['Profile', 'Support', 'Settings'].map(function (n) {
        return '<div class="ob-rail-item">' + n + '</div>';
      }).join('') + '</div></div>';

  var topCells, workRows;
  if (blank) {
    topCells = ['<div class="db-cell"><div class="db-card ob-skel"></div></div>',
                '<div class="db-cell">' + obCard('create-ticket', 'q') + '</div>'].join('');
    workRows = '<div class="db-row"><div class="db-cell"><div class="db-card ob-skel ob-skel-lg"></div></div>'
             + '<div class="db-cell"><div class="db-card ob-skel ob-skel-lg"></div></div></div>';
  } else {
    topCells = L.top[0].map(function (id) {
      return '<div class="db-cell">' + obCard(id, 'q') + '</div>';
    }).join('');
    workRows = L.work.map(function (row) {
      var size = row.length === 1 ? 'f' : row.length === 2 ? 'h' : 'q';
      return '<div class="db-row">' + row.map(function (id) {
        var def = (typeof dbDef === 'function') ? dbDef(id) : null;
        var w = (row.length === 2 && def && def.w) ? def.w : 1;
        return '<div class="db-cell" style="flex:' + w + ' 1 0;">' + obCard(id, size) + '</div>';
      }).join('') + '</div>';
    }).join('');
  }

  stage.innerHTML = rail
    + '<div class="ob-canvas">'
      + '<div class="ob-canvas-head"><div><div class="db-greet">Good morning John!</div>'
        + '<div class="db-greet-sub">It\u2019s <b>54\u00b0 F</b> and sunny \u2600</div></div>'
        + '<div class="db-go-pill">Setup page</div></div>'
      + '<div class="db-zone"><div class="db-row db-row-top">' + topCells + '</div></div>'
      + '<div class="db-ws-title">Your workspace</div>'
      + '<div class="db-zone">' + workRows + '</div>'
    + '</div>';
  obPreviewFit();
}

/* The stage is a fixed 1360x860 board scaled to whatever the pane gives us. */
function obPreviewFit() {
  var frame = document.getElementById('ob-preview');
  var stage = document.getElementById('ob-stage');
  if (!frame || !stage) return;
  var s = frame.clientWidth / OB_STAGE_W;
  if (!s || !isFinite(s)) return;
  stage.style.transform = 'scale(' + s.toFixed(4) + ')';
  frame.style.height = Math.round(OB_STAGE_H * s) + 'px';
}

/* ── Step rendering ───────────────────────────────────────────────────────── */

function obRender() {
  var host = document.getElementById('ob-screen');
  if (!host) return;
  var step = OB_STEPS[obStep];
  var body = '';

  if (step.kind === 'welcome') {
    body = '<div class="ob-title ob-title-lg">' + step.title + '</div>'
      + '<button class="ob-cta" onclick="obNext()">' + step.cta + '</button>';
  } else {
    var picked = obPick[step.key];
    body = '<div class="ob-title">' + step.title + '</div>'
      + '<div class="ob-dots">' + [1, 2, 3].map(function (n) {
          return '<span class="ob-dot' + (n === obStep ? ' on' : '') + '"></span>';
        }).join('') + '</div>'
      + '<div class="ob-options">' + step.options.map(function (o) {
          return '<button class="ob-opt' + (picked === o[0] ? ' on' : '') + '" onclick="obChoose(\'' + step.key + '\',\'' + o[0] + '\')">' + o[1] + '</button>';
        }).join('') + '</div>';
  }

  var foot = (step.kind === 'welcome') ? '' :
    '<div class="ob-foot">'
      + '<button class="ob-back" onclick="obBack()" title="Back"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2.5 4.5 7 9 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
      + '<button class="ob-cta" onclick="obNext()">' + (obStep === OB_STEPS.length - 1 ? 'Finish setup' : 'Next step') + '</button>'
    + '</div>';

  host.innerHTML =
    '<div class="ob-left"><div class="ob-left-inner">' + body + '</div>' + foot + '</div>'
    + '<div class="ob-right">'
      + '<img class="ob-bg" src="https://johndrogalis-web.github.io/WorkTestSite/Trinity_dc/Img/LoginImg.png" alt="">'
      + '<div class="ob-preview" id="ob-preview"><div class="ob-stage" id="ob-stage"></div></div>'
    + '</div>';
  obPreviewRender();
}

function obChoose(key, val) {
  obPick[key] = val;
  if (key === 'theme') obApplyTheme(val);
  obRender();
}

function obApplyTheme(mode) {
  var want = (mode === 'dark') ||
    (mode === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  var isDark = document.body.classList.contains('dark');
  if (want !== isDark && typeof toggleDarkMode === 'function') toggleDarkMode();
  else if (want !== isDark) document.body.classList.toggle('dark', want);
}

function obNext() {
  if (obStep < OB_STEPS.length - 1) { obStep++; obRender(); return; }
  obFinish();
}

function obBack() { if (obStep > 0) { obStep--; obRender(); } }

function obFinish() {
  var L = obLayout();
  if (typeof dbLayout !== 'undefined') {
    dbLayout = L;
    if (typeof dbLayoutSaved !== 'undefined') dbLayoutSaved = JSON.parse(JSON.stringify(L));
    if (typeof dbPersist === 'function') dbPersist();
  }
  try { localStorage.setItem(OB_KEY, JSON.stringify({ done:true, role:obPick.role, focus:obPick.focus, theme:obPick.theme })); } catch (e) {}
  obClose();
  if (typeof lgLand === 'function') lgLand();
}

function obClose() {
  var host = document.getElementById('ob-screen');
  if (!host) return;
  host.classList.add('ob-out');
  setTimeout(function () { host.style.display = 'none'; host.classList.remove('ob-out'); }, 260);
}

function obLaunch() {
  var host = document.getElementById('ob-screen');
  if (!host) return;
  obStep = 0;
  obPick.theme = document.body.classList.contains('dark') ? 'dark' : 'light';
  host.style.display = 'flex';
  obRender();
}

function obDone() {
  try { return JSON.parse(localStorage.getItem(OB_KEY) || '{}').done === true; } catch (e) { return false; }
}

/* Called by the login screen: first-timers get the wizard, everyone else
   goes straight to their saved dashboard. */
function obMaybe() {
  if (obDone()) { if (typeof lgLand === 'function') lgLand(); return; }
  obLaunch();
}

/* Options menu → start over with a clean board. */
function obReset() {
  try {
    localStorage.removeItem(OB_KEY);
    localStorage.removeItem(typeof DB_LS_KEY !== 'undefined' ? DB_LS_KEY : 'vfDashLayout1');
  } catch (e) {}
  if (typeof vpOptsToggle === 'function') { var dd = document.getElementById('vp-opts-dd'); if (dd) dd.classList.remove('open'); }
  obLaunch();
}

window.addEventListener('resize', obPreviewFit);
