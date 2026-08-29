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

/* ── Validate — flags workflows broken by code changes ── */
function tstValidateAll() {
  tstState.workflows.forEach(function (wf) {
    if (wf.status !== 'active') return;
    var badge = document.getElementById('tst-val-' + wf.id);
    if (!badge) return;
    var steps = tstWfSteps(wf);
    var broken = -1, unverifiable = 0;
    for (var i = 0; i < steps.length; i++) {
      var cp = steps[i];
      if (cp.eid) {
        if (!document.getElementById(cp.eid)) { broken = i + 1; break; }
        continue;
      }
      var container = document.getElementById(cp.cid) || (cp.cid === 'phone' ? document.querySelector('.phone') : null);
      if (!container) { broken = i + 1; break; }
      var found = false;
      var candidates = container.querySelectorAll('button, a, [onclick]');
      for (var k = 0; k < candidates.length; k++) {
        var t = tstNorm(candidates[k].textContent);
        if (t === cp.text || tstDigitless(t) === cp.ntext) { found = true; break; }
      }
      if (!found) unverifiable++;   /* may live in runtime-rendered UI — advisory only */
    }
    if (broken !== -1) { badge.className = 'tst-badge tst-badge-bad'; badge.textContent = 'broken at step ' + broken; }
    else if (unverifiable) { badge.className = 'tst-badge tst-badge-warn'; badge.textContent = unverifiable + ' unverifiable'; }
    else { badge.className = 'tst-badge tst-badge-ok'; badge.textContent = 'ok'; }
  });
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
    tstState.run = { wf: wf, idx: 0, t0: now, tStep: now, misclicks: 0, stepMis: 0, steps: [] };
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
  r.steps.push({ i: r.idx, label: steps[r.idx].text || steps[r.idx].eid, ms: now - r.tStep, misclicks: r.stepMis });
  r.tStep = now; r.stepMis = 0; r.idx++;

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
    if (tstMatches(fp, steps[tstState.run.idx])) tstAdvance(e);
    else { tstState.run.misclicks++; tstState.run.stepMis++; }
  }
}, true);

/* ── Boot ── */
function tstBoot() {
  var url = new URL(location.href);
  var t = url.searchParams.get('test');
  if (t) { tstEnterTestMode(t); return; }
  tstMountButton();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tstBoot);
else tstBoot();
