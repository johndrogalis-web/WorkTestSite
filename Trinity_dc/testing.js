/* ═══════════════════════════════════════════════════════════════════
   Workflow Testing — record tasks by demonstration, send testers a
   link, measure completion, time, misclicks, and abandonment.
   Backend: shared multi-prototype Google Apps Script + Sheet.

   Portability: this file is self-mounting. To add the system to any
   prototype: include <script src="testing.js"> and set TST_PROTOTYPE.
   The Test button, panels, recorder, and runner all inject themselves.

   Modes:
     admin   — Test button in the top bar: list, record, re-record,
               archive, validate, copy tester links
     record  — every click in the prototype becomes a checkpoint
     run     — tester follows the instruction; clicks are matched
               against checkpoints; timing + misclicks per step

   URL params for testers:
     ?test=1          tester picks from all active workflows
     ?test=<id>       straight into one workflow
     &user=Name       pre-fills the tester's name

   Checkpoint fingerprint = container id + element id (when present) +
   normalized text (+ digit-stripped variant, so "Trucks · 3" still
   matches when the count is different). Same idea that makes comment
   pins survive code updates.
   ═══════════════════════════════════════════════════════════════════ */

var TST_API = 'https://script.google.com/macros/s/AKfycbzS0d5DyWuuecdbT6If2Y5AaXBNsK0dCUGYOYemdxQ-FON0thzyzw2yDvYjqwNjT0HIhg/exec';
var TST_PROTOTYPE = 'diagnostic-center';

var tstState = {
  mode: null,            /* null | 'record' | 'run' */
  workflows: [],
  testing: false,        /* page opened via ?test= */
  user: '',
  rec: null,             /* {name, instruction, steps[], editingId} */
  run: null              /* {wf, idx, t0, tStep, misclicks, stepMis, steps[]} */
};

/* ── Styles ── */
(function () {
  var css = [
    '.tst-btn.tst-armed{background:#1f9d55;color:#fff;border-color:#1f9d55;}',
    /* Panels */
    '.tst-panel{position:fixed;top:52px;right:12px;width:320px;max-height:calc(100vh - 70px);',
    '  overflow-y:auto;background:#fff;border:1px solid rgba(0,0,0,0.12);border-radius:14px;',
    '  box-shadow:0 10px 32px rgba(0,0,0,0.25);z-index:3000;font-family:var(--font,sans-serif);',
    '  padding:14px;display:flex;flex-direction:column;gap:10px;}',
    '.tst-h{font-size:14px;font-weight:600;color:#171614;display:flex;align-items:center;justify-content:space-between;}',
    '.tst-x{cursor:pointer;color:#8a8d94;font-size:16px;line-height:1;padding:2px 6px;}',
    '.tst-sub{font-size:11.5px;color:#8a8d94;line-height:1.4;}',
    '.tst-item{border:1px solid rgba(0,0,0,0.1);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:6px;}',
    '.tst-item-name{font-size:13px;font-weight:600;color:#171614;}',
    '.tst-item-meta{font-size:11px;color:#8a8d94;}',
    '.tst-item-row{display:flex;gap:6px;flex-wrap:wrap;}',
    '.tst-chip{border:1px solid rgba(0,0,0,0.15);background:#fff;border-radius:100px;padding:4px 10px;',
    '  font-size:11px;font-weight:500;color:#333;cursor:pointer;font-family:inherit;}',
    '.tst-chip:hover{background:#f2f0ee;}',
    '.tst-chip-primary{background:#171614;color:#fff;border-color:#171614;}',
    '.tst-chip:disabled{opacity:0.5;cursor:default;}',
    '.tst-badge{font-size:10.5px;border-radius:100px;padding:2px 8px;font-weight:600;}',
    '.tst-badge-ok{background:#e2f5e9;color:#1f7a44;}',
    '.tst-badge-warn{background:#fdf3e2;color:#9a6b0c;}',
    '.tst-badge-bad{background:#fbe4e0;color:#b03a2a;}',
    '.tst-badge-arch{background:#eee;color:#777;}',
    '.tst-input,.tst-ta{width:100%;box-sizing:border-box;font-family:inherit;font-size:12.5px;',
    '  border:1px solid rgba(0,0,0,0.18);border-radius:8px;padding:7px 9px;outline:none;color:#1a1a1a;background:#fff;}',
    '.tst-ta{resize:none;height:56px;}',
    '.tst-cta{border:none;border-radius:100px;padding:7px 16px;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;}',
    '.tst-cta-dark{background:#171614;color:#fff;}',
    '.tst-cta-quiet{background:none;color:#555;}',
    '.tst-err{font-size:11px;color:#c0392b;}',
    '.tst-spin{display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,0.35);',
    '  border-top-color:#fff;border-radius:50%;animation:tstspin 0.7s linear infinite;vertical-align:-2px;}',
    '@keyframes tstspin{to{transform:rotate(360deg)}}',
    /* Recorder / runner bar */
    '.tst-bar{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:3000;',
    '  background:#171614;color:#fff;border-radius:100px;padding:10px 16px;display:flex;gap:12px;',
    '  align-items:center;font-family:var(--font,sans-serif);font-size:12.5px;box-shadow:0 8px 28px rgba(0,0,0,0.35);}',
    '.tst-bar.tst-bar-rec{background:#1f9d55;}',
    '.tst-bar b{font-weight:600;}',
    '.tst-bar .tst-chip{border-color:rgba(255,255,255,0.4);color:#fff;background:none;}',
    '.tst-bar .tst-chip:hover{background:rgba(255,255,255,0.12);}',
    '.tst-dot{width:8px;height:8px;border-radius:50%;background:#fff;animation:tstblink 1.1s infinite;}',
    '@keyframes tstblink{50%{opacity:0.25;}}',
    /* Test-mode chrome hiding */
    'body.tst-testing .vp-viewport-pills,body.tst-testing .cmt-wrap,',
    'body.tst-testing .vp-opts-wrap,body.tst-testing .tst-wrap{display:none !important;}',
    /* Step flash on successful match */
    /* Results view */
    '.tst-stat{display:flex;gap:14px;font-size:11.5px;color:#555;flex-wrap:wrap;}',
    '.tst-stat b{color:#171614;font-weight:600;}',
    '.tst-stepbar{display:flex;align-items:center;gap:8px;font-size:11px;color:#555;}',
    '.tst-stepbar-label{flex:0 0 118px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.tst-stepbar-track{flex:1;height:8px;background:#f0eeec;border-radius:4px;overflow:hidden;}',
    '.tst-stepbar-fill{height:100%;background:#3069e3;border-radius:4px;}',
    '.tst-stepbar-fill.tst-friction{background:#d3542f;}',
    '.tst-stepbar-ms{flex:0 0 44px;text-align:right;font-variant-numeric:tabular-nums;}',
    '.tst-ses-row{display:flex;justify-content:space-between;font-size:11px;color:#555;padding:3px 0;border-bottom:1px solid #f2f0ee;}',
    '.tst-ses-row:last-child{border-bottom:none;}',
    /* Location ping — deep-linked from the dashboard */
    '.tst-ping{position:absolute;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;',
    '  background:#d3542f;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.4);z-index:1500;cursor:pointer;}',
    '.tst-ping::before{content:"";position:absolute;inset:-14px;border-radius:50%;',
    '  border:3px solid #d3542f;animation:tstping 1.4s ease-out infinite;}',
    '@keyframes tstping{from{transform:scale(0.4);opacity:1;}to{transform:scale(1.5);opacity:0;}}',
    '.tst-toast{position:fixed;top:54px;left:50%;transform:translateX(-50%);z-index:3001;',
    '  background:#171614;color:#fff;font-family:var(--font,sans-serif);font-size:12px;',
    '  padding:8px 16px;border-radius:100px;box-shadow:0 4px 14px rgba(0,0,0,0.3);max-width:80vw;',
    '  text-align:center;}',
    '.tst-flash{position:fixed;border-radius:50%;width:34px;height:34px;border:3px solid #1f9d55;',
    '  z-index:2999;pointer-events:none;animation:tstflash 0.5s ease-out forwards;margin:-17px 0 0 -17px;}',
    '@keyframes tstflash{from{transform:scale(0.5);opacity:1;}to{transform:scale(1.6);opacity:0;}}'
  ].join('\n');
  var el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
})();

/* ── IO ── */
function tstGet(qs, cb) {
  fetch(TST_API + qs).then(function (r) { return r.json(); }).then(cb)
    .catch(function (e) { console.warn('[testing] load failed', e); });
}
function tstPost(payload, cb) {
  fetch(TST_API, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) })
    .then(function (r) { return r.json(); }).then(cb)
    .catch(function (e) { console.warn('[testing] save failed', e); if (cb) cb({ ok: false, error: String(e) }); });
}

/* ── Fingerprinting — shared by record, run, and validate ── */
function tstNorm(t) { return String(t || '').trim().replace(/\s+/g, ' ').slice(0, 60); }
function tstDigitless(t) { return tstNorm(t).replace(/\d+/g, '#'); }

function tstContainerOf(el) {
  var node = el, firstWithId = null;
  while (node && node !== document.body) {
    if (node.id) {
      if (!firstWithId) firstWithId = node;
      var cs = getComputedStyle(node);
      if ((/(auto|scroll)/).test(cs.overflowY + cs.overflowX)) return node;
    }
    node = node.parentElement;
  }
  return firstWithId || document.querySelector('.phone');
}

function tstFingerprint(target) {
  var anchor = target.closest('button, a, [onclick], [id]') || target;
  var container = tstContainerOf(target);
  return {
    cid: container ? (container.id || 'phone') : 'phone',
    eid: anchor.id || '',
    text: tstNorm(anchor.textContent),
    ntext: tstDigitless(anchor.textContent)
  };
}

function tstMatches(fp, cp) {
  if (cp.eid && fp.eid === cp.eid) return true;
  if (cp.eid && document.getElementById(cp.eid)) {
    /* checkpoint targets a specific id — only that id counts */
    return fp.eid === cp.eid;
  }
  return fp.cid === cp.cid && (fp.text === cp.text || (cp.ntext && fp.ntext === cp.ntext));
}

/* ── Self-mounting Test button ── */
function tstMountButton() {
  var cluster = document.querySelector('.vp-right-cluster');
  if (!cluster) return;
  var wrap = document.createElement('div');
  wrap.className = 'tst-wrap cmt-wrap';
  wrap.innerHTML =
    '<button class="vp-opts-btn tst-btn" id="tst-btn" onclick="tstTogglePanel()" title="Workflow testing">' +
    '<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7.2 5.2 10.4 12 3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '<span style="font-family:var(--font);font-size:12px;font-weight:500;letter-spacing:-0.24px;">Test</span></button>';
  var anchor = cluster.querySelector('.cmt-wrap') || cluster.querySelector('.vp-opts-wrap');
  if (anchor) cluster.insertBefore(wrap, anchor);
  else cluster.appendChild(wrap);
}

/* ── Panels ── */
function tstClosePanel() { var p = document.getElementById('tst-panel'); if (p) p.remove(); }

function tstTogglePanel() {
  if (document.getElementById('tst-panel')) { tstClosePanel(); return; }
  tstOpenAdminPanel();
}

function tstPanelShell(title) {
  tstClosePanel();
  var p = document.createElement('div');
  p.className = 'tst-panel tst-ui'; p.id = 'tst-panel';
  p.innerHTML = '<div class="tst-h"><span>' + title + '</span><span class="tst-x" onclick="tstClosePanel()">\u00D7</span></div>';
  document.body.appendChild(p);
  return p;
}

function tstEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

/* ── Admin panel ── */
function tstOpenAdminPanel() {
  var p = tstPanelShell('Workflow testing');
  p.insertAdjacentHTML('beforeend',
    '<div class="tst-item-row">' +
    '<button class="tst-chip tst-chip-primary" onclick="tstStartRecordForm()">\u25CF Record new workflow</button>' +
    '<button class="tst-chip" onclick="tstValidateAll()">Validate all</button>' +
    '<button class="tst-chip" onclick="tstOpenResultsPanel()">Results</button>' +
    '<button class="tst-chip" onclick="tstCopyLink(\'1\', this)">Copy tester link</button>' +
    '</div><div id="tst-list"><div class="tst-sub">Loading\u2026</div></div>');
  tstGet('?action=list&prototype=' + encodeURIComponent(TST_PROTOTYPE) + '&all=1', function (res) {
    tstState.workflows = (res.ok && res.workflows) || [];
    tstRenderAdminList();
  });
}

function tstWfMeta(wf) {
  var m = (wf.checkpoints && wf.checkpoints[0] && wf.checkpoints[0].meta) ? wf.checkpoints[0] : null;
  return m ? (m.view + (m.orientation ? ' \u00B7 ' + m.orientation : '')) : '';
}
function tstWfSteps(wf) {
  return (wf.checkpoints || []).filter(function (s) { return !s.meta; });
}

function tstRenderAdminList() {
  var list = document.getElementById('tst-list');
  if (!list) return;
  if (!tstState.workflows.length) {
    list.innerHTML = '<div class="tst-sub">No workflows yet. Hit Record, then click through the task in the prototype \u2014 every click becomes a step.</div>';
    return;
  }
  list.innerHTML = tstState.workflows.map(function (wf, i) {
    var steps = tstWfSteps(wf);
    var archived = wf.status !== 'active';
    return '<div class="tst-item" data-wfid="' + tstEsc(wf.id) + '">' +
      '<div class="tst-item-name">' + tstEsc(wf.name) +
      (archived ? ' <span class="tst-badge tst-badge-arch">archived</span>' : '') +
      ' <span class="tst-badge" id="tst-val-' + tstEsc(wf.id) + '"></span></div>' +
      '<div class="tst-item-meta">' + steps.length + ' steps \u00B7 ' + tstWfMeta(wf) + '</div>' +
      '<div class="tst-item-meta">' + tstEsc(wf.instruction) + '</div>' +
      '<div class="tst-item-row">' +
      (archived
        ? '<button class="tst-chip" onclick="tstSetStatus(\'' + tstEsc(wf.id) + '\',\'active\',this)">Restore</button>'
        : '<button class="tst-chip" onclick="tstCopyLink(\'' + tstEsc(wf.id) + '\', this)">Copy link</button>' +
          '<button class="tst-chip" onclick="tstStartRecordForm(\'' + tstEsc(wf.id) + '\')">Re-record</button>' +
          '<button class="tst-chip" onclick="tstSetStatus(\'' + tstEsc(wf.id) + '\',\'archived\',this)">Archive</button>') +
      '</div></div>';
  }).join('');
}

function tstSetStatus(id, status, btn) {
  btn.disabled = true;
  tstPost({ action: 'setWorkflowStatus', id: id, status: status }, function () { tstOpenAdminPanel(); });
}

function tstCopyLink(idOrAll, btn) {
  var url = new URL(location.href);
  url.search = '?test=' + idOrAll;
  url.hash = '';
  var text = url.toString();
  (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
    .then(function () { btn.textContent = 'Copied!'; setTimeout(function () { btn.textContent = idOrAll === '1' ? 'Copy tester link' : 'Copy link'; }, 1400); })
    .catch(function () { prompt('Copy this link:', text); });
}

/* ── Validate — verifies what it can, and is honest about the rest.
   A static check can PROVE a step is findable but can never prove it's
   broken: checkpoints inside drawers, menus, and sheets legitimately
   don't exist on a fresh page. So each step is tried three ways —
   element id, then text within its recorded container, then text
   anywhere in the document — and whatever still isn't found is
   reported as "unverified", never "broken". Click the badge to see
   exactly which steps to eyeball by hand. ── */
function tstVerifyStep(cp) {
  if (cp.eid && document.getElementById(cp.eid)) return true;
  var scopes = [];
  var container = document.getElementById(cp.cid) || (cp.cid === 'phone' ? document.querySelector('.phone') : null);
  if (container) scopes.push(container);
  scopes.push(document);
  if (!cp.text && !cp.ntext) return false;
  for (var s = 0; s < scopes.length; s++) {
    var cands = scopes[s].querySelectorAll('button, a, [onclick], [id]');
    for (var k = 0; k < cands.length; k++) {
      var t = tstNorm(cands[k].textContent);
      if (t && (t === cp.text || tstDigitless(t) === cp.ntext)) return true;
    }
  }
  return false;
}

function tstValidateAll() {
  tstState.workflows.forEach(function (wf) {
    if (wf.status !== 'active') return;
    var badge = document.getElementById('tst-val-' + wf.id);
    if (!badge) return;
    var steps = tstWfSteps(wf);
    var unverified = [];
    steps.forEach(function (cp, i) {
      if (!tstVerifyStep(cp)) unverified.push((i + 1) + '. ' + (cp.text || cp.eid || 'step'));
    });
    if (!unverified.length) {
      badge.className = 'tst-badge tst-badge-ok';
      badge.textContent = 'all ' + steps.length + ' steps verified';
      badge.onclick = null;
    } else {
      badge.className = 'tst-badge tst-badge-warn';
      badge.textContent = (steps.length - unverified.length) + '/' + steps.length + ' verified \u00B7 details';
      badge.style.cursor = 'pointer';
      badge.title = 'Unverified steps (likely inside a drawer or menu \u2014 walk the flow to confirm):\n' + unverified.join('\n');
      badge.onclick = function () {
        alert('Unverified steps in \u201C' + wf.name + '\u201D \u2014 these usually live inside drawers or menus that are closed right now. Walk the flow once to confirm they still work:\n\n' + unverified.join('\n'));
      };
    }
  });
}

/* ── Results — in-prototype review, no spreadsheet needed ── */
function tstMedian(arr) {
  if (!arr.length) return 0;
  var s = arr.slice().sort(function (a, b) { return a - b; });
  var mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function tstFmtS(s) { return (Math.round(s * 10) / 10) + 's'; }

function tstOpenResultsPanel() {
  var p = tstPanelShell('Results');
  p.style.width = '360px';
  p.insertAdjacentHTML('beforeend',
    '<div class="tst-item-row"><button class="tst-chip" onclick="tstOpenAdminPanel()">\u2190 Back</button>' +
    '<button class="tst-chip" onclick="tstOpenDashboard()">Expand \u2197</button></div>' +
    '<div id="tst-results"><div class="tst-sub">Loading\u2026</div></div>');

  var wfsReady = tstState.workflows.length
    ? Promise.resolve()
    : new Promise(function (resolve) {
        tstGet('?action=list&prototype=' + encodeURIComponent(TST_PROTOTYPE) + '&all=1', function (res) {
          tstState.workflows = (res.ok && res.workflows) || [];
          resolve();
        });
      });

  wfsReady.then(function () {
    tstGet('?action=results&prototype=' + encodeURIComponent(TST_PROTOTYPE), function (res) {
      var host = document.getElementById('tst-results');
      if (!host) return;
      if (!res.ok) { host.innerHTML = '<div class="tst-err">' + tstEsc(res.error) + '</div>'; return; }
      var sessions = res.sessions || [];
      if (!sessions.length) { host.innerHTML = '<div class="tst-sub">No test sessions yet. Send someone a tester link and results show up here.</div>'; return; }
      window.__tstSessions = sessions;

      /* Overall strip */
      var completed = sessions.filter(function (s) { return s.outcome === 'completed'; });
      var users = {};
      sessions.forEach(function (s) { users[String(s.user).toLowerCase()] = 1; });
      var html = '<div class="tst-stat" style="margin-bottom:4px;">' +
        '<span><b>' + sessions.length + '</b> sessions</span>' +
        '<span><b>' + Object.keys(users).length + '</b> testers</span>' +
        '<span><b>' + Math.round(completed.length / sessions.length * 100) + '%</b> completed</span></div>';

      /* Per-workflow blocks — archived ones included, their data lives on */
      var byWf = {};
      sessions.forEach(function (s) {
        (byWf[s.workflow_id] = byWf[s.workflow_id] || []).push(s);
      });
      html += Object.keys(byWf).map(function (wfId) {
        var ses = byWf[wfId];
        var wf = tstState.workflows.find(function (w) { return w.id === wfId; });
        var name = wf ? wf.name : (ses[0].workflow_name || wfId);
        var archived = wf ? wf.status !== 'active' : true;
        var comp = ses.filter(function (s) { return s.outcome === 'completed'; });
        var med = tstMedian(comp.map(function (s) { return Number(s.duration_s) || 0; }));
        var avgMis = ses.reduce(function (a, s) { return a + (Number(s.misclicks_total) || 0); }, 0) / ses.length;
        return '<div class="tst-item">' +
          '<div class="tst-item-name">' + tstEsc(name) +
          (archived ? ' <span class="tst-badge tst-badge-arch">archived</span>' : '') + '</div>' +
          '<div class="tst-stat">' +
          '<span><b>' + ses.length + '</b> runs</span>' +
          '<span><b>' + Math.round(comp.length / ses.length * 100) + '%</b> done</span>' +
          '<span>median <b>' + tstFmtS(med) + '</b></span>' +
          '<span><b>' + (Math.round(avgMis * 10) / 10) + '</b> misclicks avg</span></div>' +
          '<div class="tst-item-row">' +
          '<button class="tst-chip" onclick="tstResultsSteps(\'' + tstEsc(wfId) + '\', this)">Steps</button>' +
          '<button class="tst-chip" onclick="tstResultsSessions(\'' + tstEsc(wfId) + '\', this)">Sessions</button></div>' +
          '<div id="tst-detail-' + tstEsc(wfId) + '"></div></div>';
      }).join('');
      host.innerHTML = html;
    });
  });
}

/* Full dashboard in a new tab — one page serves every prototype;
   ?prototype preselects this one in its filter */
function tstOpenDashboard() {
  var url = new URL(location.href);
  var base = url.pathname.replace(/[^\/]*$/, '');
  window.open(url.origin + base + 'test-dashboard.html?prototype=' + encodeURIComponent(TST_PROTOTYPE), '_blank');
}

/* Per-step breakdown — avg time bar per step, friction step flagged */
function tstResultsSteps(wfId, btn) {
  var box = document.getElementById('tst-detail-' + wfId);
  if (!box) return;
  if (box.dataset.showing === 'steps') { box.innerHTML = ''; box.dataset.showing = ''; return; }
  box.dataset.showing = 'steps';

  var ses = (window.__tstSessions || []).filter(function (s) { return s.workflow_id === wfId; });
  var agg = {};   /* step index -> {label, msSum, n, mis} */
  ses.forEach(function (s) {
    (Array.isArray(s.steps_data) ? s.steps_data : []).forEach(function (st) {
      var a = agg[st.i] = agg[st.i] || { label: st.label || ('Step ' + (st.i + 1)), msSum: 0, n: 0, mis: 0 };
      if (!st.partial) { a.msSum += Number(st.ms) || 0; a.n++; }
      a.mis += Number(st.misclicks) || 0;
    });
  });
  var idxs = Object.keys(agg).map(Number).sort(function (a, b) { return a - b; });
  if (!idxs.length) { box.innerHTML = '<div class="tst-sub">No step data yet.</div>'; return; }
  var maxAvg = Math.max.apply(null, idxs.map(function (i) { return agg[i].n ? agg[i].msSum / agg[i].n : 0; })) || 1;
  var frictionIdx = idxs.reduce(function (best, i) {
    return agg[i].mis > agg[best].mis ? i : best;
  }, idxs[0]);
  box.innerHTML = idxs.map(function (i) {
    var a = agg[i], avg = a.n ? a.msSum / a.n : 0;
    var friction = i === frictionIdx && a.mis > 0;
    return '<div class="tst-stepbar">' +
      '<span class="tst-stepbar-label" title="' + tstEsc(a.label) + '">' + (i + 1) + '. ' + tstEsc(a.label) + '</span>' +
      '<span class="tst-stepbar-track"><span class="tst-stepbar-fill' + (friction ? ' tst-friction' : '') + '" style="width:' + Math.max(4, Math.round(avg / maxAvg * 100)) + '%"></span></span>' +
      '<span class="tst-stepbar-ms">' + tstFmtS(avg / 1000) + '</span>' +
      (a.mis ? '<span class="tst-badge ' + (friction ? 'tst-badge-bad' : 'tst-badge-warn') + '">' + a.mis + ' mis</span>' : '') +
      '</div>';
  }).join('');
}

/* Individual sessions — who, when, outcome, time */
function tstResultsSessions(wfId, btn) {
  var box = document.getElementById('tst-detail-' + wfId);
  if (!box) return;
  if (box.dataset.showing === 'sessions') { box.innerHTML = ''; box.dataset.showing = ''; return; }
  box.dataset.showing = 'sessions';

  var ses = (window.__tstSessions || []).filter(function (s) { return s.workflow_id === wfId; })
    .sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
  box.innerHTML = ses.map(function (s) {
    var when = '';
    try { when = new Date(s.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) {}
    return '<div class="tst-ses-row">' +
      '<span><b>' + tstEsc(s.user) + '</b> \u00B7 ' + when + '</span>' +
      '<span>' + (s.outcome === 'completed' ? tstFmtS(Number(s.duration_s) || 0) : '<span class="tst-badge tst-badge-bad">gave up</span>') +
      (Number(s.misclicks_total) ? ' \u00B7 ' + s.misclicks_total + ' mis' : '') + '</span></div>';
  }).join('');
}

/* ── Recorder ── */
function tstStartRecordForm(editingId) {
  var wf = editingId ? tstState.workflows.find(function (w) { return w.id === editingId; }) : null;
  var p = tstPanelShell(editingId ? 'Re-record workflow' : 'New workflow');
  p.insertAdjacentHTML('beforeend',
    '<input class="tst-input" id="tst-rec-name" placeholder="Workflow name (e.g. Send an update to 2 trucks)" value="' + (wf ? tstEsc(wf.name) : '') + '">' +
    '<textarea class="tst-ta" id="tst-rec-inst" placeholder="Instruction the tester will read">' + (wf ? tstEsc(wf.instruction) : '') + '</textarea>' +
    '<div class="tst-sub">After you hit Start, set the right view first if needed, then click through the task exactly as a user would. Every click in the prototype becomes a step. Finish on the last click of the task.</div>' +
    '<div class="tst-err" id="tst-rec-err" style="display:none;"></div>' +
    '<div class="tst-item-row" style="justify-content:flex-end;">' +
    '<button class="tst-cta tst-cta-quiet" onclick="tstClosePanel()">Cancel</button>' +
    '<button class="tst-cta tst-cta-dark" onclick="tstBeginRecording(' + (editingId ? '\'' + tstEsc(editingId) + '\'' : 'null') + ')">Start recording</button></div>');
}

function tstBeginRecording(editingId) {
  var name = document.getElementById('tst-rec-name').value.trim();
  var inst = document.getElementById('tst-rec-inst').value.trim();
  var err = document.getElementById('tst-rec-err');
  if (!name || !inst) { err.textContent = 'Name and instruction are both needed.'; err.style.display = 'block'; return; }
  tstClosePanel();
  tstState.mode = 'record';
  tstState.rec = { name: name, instruction: inst, steps: [], editingId: editingId };
  tstRenderBar();
}

function tstRenderBar() {
  var old = document.getElementById('tst-bar'); if (old) old.remove();
  var bar = document.createElement('div');
  bar.id = 'tst-bar'; bar.className = 'tst-ui tst-bar' + (tstState.mode === 'record' ? ' tst-bar-rec' : '');
  if (tstState.mode === 'record') {
    bar.innerHTML = '<span class="tst-dot"></span><b>Recording</b><span id="tst-bar-count">' +
      tstState.rec.steps.length + ' steps</span>' +
      '<button class="tst-chip" onclick="tstRecUndo()">Undo</button>' +
      '<button class="tst-chip" onclick="tstRecCancel()">Cancel</button>' +
      '<button class="tst-chip" onclick="tstRecFinish(this)">Finish</button>';
  } else if (tstState.mode === 'run') {
    var r = tstState.run, total = tstWfSteps(r.wf).length;
    bar.innerHTML = '<b>' + tstEsc(r.wf.name) + '</b>' +
      '<span id="tst-bar-count">Step ' + (r.idx + 1) + ' of ' + total + '</span>' +
      '<button class="tst-chip" onclick="tstRunGiveUp(this)">Give up</button>';
  }
  document.body.appendChild(bar);
}

function tstRecUndo() {
  if (tstState.rec.steps.length) tstState.rec.steps.pop();
  var c = document.getElementById('tst-bar-count');
  if (c) c.textContent = tstState.rec.steps.length + ' steps';
}
function tstRecCancel() {
  tstState.mode = null; tstState.rec = null;
  var b = document.getElementById('tst-bar'); if (b) b.remove();
}
function tstRecFinish(btn) {
  var rec = tstState.rec;
  if (!rec.steps.length) { alert('No steps recorded yet \u2014 click through the task first.'); return; }
  btn.disabled = true; btn.innerHTML = '<span class="tst-spin"></span>';
  var meta = {
    meta: 1,
    view: document.body.classList.contains('view-mobile') ? 'mobile'
        : document.body.classList.contains('view-tablet') ? 'tablet' : 'desktop',
    orientation: document.body.classList.contains('orient-landscape') ? 'landscape' : 'portrait'
  };
  var checkpoints = [meta].concat(rec.steps);
  var done = function (res) {
    tstRecCancel();
    if (!res.ok) alert('Save failed: ' + res.error);
    else tstOpenAdminPanel();
  };
  if (rec.editingId) tstPost({ action: 'updateWorkflow', id: rec.editingId, name: rec.name, instruction: rec.instruction, checkpoints: checkpoints }, done);
  else tstPost({ action: 'addWorkflow', prototype: TST_PROTOTYPE, name: rec.name, instruction: rec.instruction, checkpoints: checkpoints, author: '' }, done);
}

/* ── Tester runner ── */
function tstEnterTestMode(param) {
  tstState.testing = true;
  document.body.classList.add('tst-testing');
  var url = new URL(location.href);
  tstState.user = url.searchParams.get('user') || '';
  try { if (!tstState.user) tstState.user = localStorage.getItem('tst_user') || ''; } catch (e) {}
  tstGet('?action=list&prototype=' + encodeURIComponent(TST_PROTOTYPE), function (res) {
    tstState.workflows = (res.ok && res.workflows) || [];
    if (!tstState.user) tstAskName(param);
    else tstOpenTesterPanel(param);
  });
}

function tstAskName(param) {
  var p = tstPanelShell('Before you start');
  p.insertAdjacentHTML('beforeend',
    '<div class="tst-sub">What\u2019s your name? It\u2019s saved with your results so we know who tested what.</div>' +
    '<input class="tst-input" id="tst-user-input" placeholder="Your name">' +
    '<div class="tst-item-row" style="justify-content:flex-end;">' +
    '<button class="tst-cta tst-cta-dark" onclick="tstSaveName(\'' + tstEsc(param) + '\')">Continue</button></div>');
  setTimeout(function () { var i = document.getElementById('tst-user-input'); if (i) i.focus(); }, 50);
}
function tstSaveName(param) {
  var v = document.getElementById('tst-user-input').value.trim();
  if (!v) return;
  tstState.user = v;
  try { localStorage.setItem('tst_user', v); } catch (e) {}
  tstOpenTesterPanel(param);
}

function tstOpenTesterPanel(param) {
  var wfs = tstState.workflows;
  if (param !== '1') {
    var one = wfs.find(function (w) { return w.id === param; });
    if (one) { tstBeginRun(one); return; }
  }
  var p = tstPanelShell('Tasks to try');
  if (!wfs.length) {
    p.insertAdjacentHTML('beforeend', '<div class="tst-sub">No tasks are available right now.</div>');
    return;
  }
  p.insertAdjacentHTML('beforeend',
    '<div class="tst-sub">Pick a task, read the instruction, and complete it in the prototype like you normally would. There are no wrong answers \u2014 we\u2019re testing the design, not you.</div>' +
    wfs.map(function (wf) {
      return '<div class="tst-item"><div class="tst-item-name">' + tstEsc(wf.name) + '</div>' +
        '<div class="tst-item-meta">' + tstEsc(wf.instruction) + '</div>' +
        '<div class="tst-item-row"><button class="tst-chip tst-chip-primary" onclick="tstBeginRunById(\'' + tstEsc(wf.id) + '\')">Start</button></div></div>';
    }).join(''));
}

function tstBeginRunById(id) {
  var wf = tstState.workflows.find(function (w) { return w.id === id; });
  if (wf) tstBeginRun(wf);
}

function tstBeginRun(wf) {
  tstClosePanel();
  /* Put the prototype in the surface the workflow was recorded on */
  var meta = (wf.checkpoints && wf.checkpoints[0] && wf.checkpoints[0].meta) ? wf.checkpoints[0] : null;
  try {
    if (meta && typeof setView === 'function') setView(meta.view);
    if (meta && meta.view !== 'desktop' && typeof setOrientation === 'function') setOrientation(meta.view, meta.orientation || 'portrait');
  } catch (e) { console.warn('[testing] view switch failed', e); }

  setTimeout(function () {
    var now = Date.now();
    tstState.mode = 'run';
    tstState.run = { wf: wf, idx: 0, t0: now, tStep: now, misclicks: 0, stepMis: 0, stepMissed: [], steps: [] };
    tstRenderBar();
    tstShowInstruction(wf);
  }, 650);
}

function tstShowInstruction(wf) {
  var p = tstPanelShell('Your task');
  p.insertAdjacentHTML('beforeend',
    '<div class="tst-item-name">' + tstEsc(wf.name) + '</div>' +
    '<div class="tst-sub" style="font-size:12.5px;color:#333;">' + tstEsc(wf.instruction) + '</div>' +
    '<div class="tst-item-row" style="justify-content:flex-end;">' +
    '<button class="tst-cta tst-cta-dark" onclick="tstClosePanel()">Got it</button></div>');
}

function tstAdvance(e) {
  var r = tstState.run;
  var steps = tstWfSteps(r.wf);
  var now = Date.now();
  r.steps.push({ i: r.idx, label: steps[r.idx].text || steps[r.idx].eid, ms: now - r.tStep, misclicks: r.stepMis, missed: r.stepMissed });
  r.tStep = now; r.stepMis = 0; r.stepMissed = []; r.idx++;

  var flash = document.createElement('div');
  flash.className = 'tst-flash';
  flash.style.left = e.clientX + 'px'; flash.style.top = e.clientY + 'px';
  document.body.appendChild(flash);
  setTimeout(function () { flash.remove(); }, 550);

  if (r.idx >= steps.length) { tstComplete('completed'); return; }
  var c = document.getElementById('tst-bar-count');
  if (c) c.textContent = 'Step ' + (r.idx + 1) + ' of ' + steps.length;
}

function tstRunGiveUp(btn) {
  if (!confirm('Stop this task? Your progress so far still gets recorded \u2014 that\u2019s useful too.')) return;
  btn.disabled = true;
  tstComplete('abandoned');
}

function tstComplete(outcome) {
  var r = tstState.run;
  if (outcome === 'abandoned' && r.idx < tstWfSteps(r.wf).length) {
    var stuck = tstWfSteps(r.wf)[r.idx];
    r.steps.push({ i: r.idx, label: stuck.text || stuck.eid, ms: Date.now() - r.tStep,
                   misclicks: r.stepMis, missed: r.stepMissed, partial: 1 });
  }
  tstState.mode = null;
  var bar = document.getElementById('tst-bar'); if (bar) bar.remove();

  tstPost({
    action: 'addSession',
    prototype: TST_PROTOTYPE,
    workflow_id: r.wf.id,
    user: tstState.user,
    view: document.body.classList.contains('view-mobile') ? 'mobile'
        : document.body.classList.contains('view-tablet') ? 'tablet' : 'desktop',
    orientation: document.body.classList.contains('orient-landscape') ? 'landscape' : 'portrait',
    outcome: outcome,
    duration_s: Math.round((Date.now() - r.t0) / 100) / 10,
    steps_total: tstWfSteps(r.wf).length,
    misclicks_total: r.misclicks,
    steps_data: r.steps
  }, function () {});

  var p = tstPanelShell(outcome === 'completed' ? 'Task complete \u2714' : 'Task stopped');
  p.insertAdjacentHTML('beforeend',
    '<div class="tst-sub">' + (outcome === 'completed'
      ? 'Nice \u2014 that took ' + (Math.round((Date.now() - r.t0) / 100) / 10) + 's. Your result was recorded.'
      : 'No problem \u2014 what you did was still recorded and helps us find the rough spots.') + '</div>' +
    (tstState.testing
      ? '<div class="tst-item-row" style="justify-content:flex-end;"><button class="tst-cta tst-cta-dark" onclick="tstOpenTesterPanel(\'1\')">More tasks</button></div>'
      : ''));
  tstState.run = null;
}

/* ── One capture listener routes clicks by mode ── */
document.addEventListener('click', function (e) {
  if (!tstState.mode) return;
  if (e.target.closest('.tst-ui')) return;                    /* our own chrome */
  var phone = document.querySelector('.phone');
  if (!phone || !phone.contains(e.target)) return;            /* top bar etc. */

  if (tstState.mode === 'record') {
    tstState.rec.steps.push(tstFingerprint(e.target));
    var c = document.getElementById('tst-bar-count');
    if (c) c.textContent = tstState.rec.steps.length + ' steps';
    return;                                                    /* click passes through */
  }

  if (tstState.mode === 'run') {
    var steps = tstWfSteps(tstState.run.wf);
    var fp = tstFingerprint(e.target);
    if (tstMatches(fp, steps[tstState.run.idx])) { tstAdvance(e); return; }
    tstState.run.misclicks++; tstState.run.stepMis++;
    if (tstState.run.stepMissed.length < 25) {   /* cap so steps_data can't bloat */
      var mc = tstContainerOf(e.target);
      var mr = mc.getBoundingClientRect();
      tstState.run.stepMissed.push({
        cid: mc.id || 'phone',
        text: fp.text.slice(0, 40),
        x: Math.round(((e.clientX - mr.left + mc.scrollLeft) / Math.max(mc.scrollWidth, 1)) * 1000) / 10,
        y: Math.round(((e.clientY - mr.top + mc.scrollTop) / Math.max(mc.scrollHeight, 1)) * 1000) / 10
      });
    }
  }
}, true);

/* ── Location ping — ?ping=cid,x,y&pv=view&po=orientation&pt=label ──
   Opens the prototype on the right surface and pulses the exact spot a
   misclick landed. Coordinates are % of the container's scroll content,
   converted to px at render so long scrolling pages resolve correctly. */
function tstToast(text) {
  var t = document.getElementById('tst-toast');
  if (t) t.remove();
  if (!text) return;
  t = document.createElement('div');
  t.id = 'tst-toast'; t.className = 'tst-toast tst-ui'; t.textContent = text;
  document.body.appendChild(t);
}

/* Find the live, VISIBLE element a checkpoint points at. Visibility
   matters: mobile and tablet surfaces coexist in the DOM with the same
   button text, and we must click the one that's actually on screen. */
function tstResolveStep(cp) {
  function vis(el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
  if (cp.eid) {
    var e = document.getElementById(cp.eid);
    if (e && vis(e)) return e;
  }
  var scopes = [];
  var c = document.getElementById(cp.cid) || (cp.cid === 'phone' ? document.querySelector('.phone') : null);
  if (c) scopes.push(c);
  scopes.push(document);
  if (!cp.text && !cp.ntext) return null;
  for (var s = 0; s < scopes.length; s++) {
    var cands = scopes[s].querySelectorAll('button, a, [onclick], [id]');
    for (var k = 0; k < cands.length; k++) {
      if (!vis(cands[k])) continue;
      var t = tstNorm(cands[k].textContent);
      if (t && (t === cp.text || tstDigitless(t) === cp.ntext)) return cands[k];
    }
  }
  return null;
}

/* Replay the tester's completed steps to drive the UI into the state
   where the misclick happened — the recorded workflow doubles as the
   navigation script that opens the right drawers and menus. */
function tstReplayPath(wfId, uptoStep, done) {
  tstGet('?action=list&prototype=' + encodeURIComponent(TST_PROTOTYPE) + '&all=1', function (res) {
    var wf = ((res.ok && res.workflows) || []).find(function (w) { return w.id === wfId; });
    if (!wf) { done(); return; }
    var steps = tstWfSteps(wf).slice(0, uptoStep);
    if (!steps.length) { done(); return; }
    var i = 0;
    (function next() {
      if (i >= steps.length) { tstToast(null); done(); return; }
      var el = tstResolveStep(steps[i]);
      if (!el) {
        tstToast('Replayed ' + i + ' of ' + steps.length + ' steps \u2014 couldn\u2019t find \u201C' +
          (steps[i].text || steps[i].eid) + '\u201D, finish the path by hand and the ping will appear.');
        done();
        return;
      }
      tstToast('Replaying the tester\u2019s path \u2014 step ' + (i + 1) + ' of ' + steps.length + '\u2026');
      el.click();
      i++;
      setTimeout(next, 750);   /* let menus, sheets, and drawers animate in */
    })();
  });
}

function tstPing(spec, view, orient, label, wfId, uptoStep) {
  var parts = spec.split(',');
  var cid = parts[0], x = parseFloat(parts[1]) || 0, y = parseFloat(parts[2]) || 0;

  try {
    if (view && typeof setView === 'function') setView(view);
    if (view && view !== 'desktop' && orient && typeof setOrientation === 'function') setOrientation(view, orient);
  } catch (e) {}

  if (wfId && uptoStep > 0) {
    setTimeout(function () {
      tstReplayPath(wfId, uptoStep, function () {
        tstPing(spec, '', '', label, null, 0);   /* path walked — now find and pulse */
      });
    }, 700);   /* after the view switch settles */
    return;
  }

  var tries = 0;
  var timer = setInterval(function () {
    tries++;
    var container = document.getElementById(cid) || (cid === 'phone' ? document.querySelector('.phone') : null);
    var visible = container && container.getBoundingClientRect().width > 0;
    if (!visible) {
      if (tries === 3) tstToast('Looking for "' + cid + '" \u2014 open the screen or drawer where it lives and the ping will appear.');
      if (tries > 60) { clearInterval(timer); tstToast('Could not find "' + cid + '" \u2014 it may have been renamed since this test ran.'); }
      return;
    }
    clearInterval(timer);
    tstToast(label ? 'They clicked: \u201C' + label + '\u201D \u2014 tap the dot to dismiss' : null);

    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    var px = x / 100 * container.scrollWidth;
    var py = y / 100 * container.scrollHeight;
    var dot = document.createElement('div');
    dot.className = 'tst-ping tst-ui';
    dot.style.left = px + 'px';
    dot.style.top = py + 'px';
    dot.title = label || '';
    dot.addEventListener('click', function () { dot.remove(); tstToast(null); });
    container.appendChild(dot);
    try {
      container.scrollTo({ left: Math.max(0, px - container.clientWidth / 2),
                           top: Math.max(0, py - container.clientHeight / 2), behavior: 'smooth' });
    } catch (e) {}
  }, 700);
}

/* ── Boot ── */
function tstBoot() {
  var url = new URL(location.href);
  var ping = url.searchParams.get('ping');
  if (ping) {
    setTimeout(function () {
      tstPing(ping, url.searchParams.get('pv') || '', url.searchParams.get('po') || '',
        url.searchParams.get('pt') || '', url.searchParams.get('wf') || null,
        parseInt(url.searchParams.get('st') || '0', 10) || 0);
    }, 400);   /* let the app's own boot finish first */
  }
  var t = url.searchParams.get('test');
  if (t) { tstEnterTestMode(t); return; }
  tstMountButton();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tstBoot);
else tstBoot();
