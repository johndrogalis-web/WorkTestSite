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
  mode: null,            /* null | 'record' | 'run' | 'explore' */
  workflows: [],
  testing: false,        /* page opened via ?test= */
  user: '',
  rec: null,             /* {name, instruction, steps[], editingId} */
  run: null,             /* {wf, idx, t0, tStep, misclicks, stepMis, steps[]} */
  explore: null          /* {t0, tNode, clicks, path[]} — open exploration */
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
    /* Docked top by default: the bottom of the viewport is where the
       prototype puts its own primary actions, so a bar down there sat
       on top of the thing the tester was trying to click. */
    '.tst-bar{position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:3000;',
    '  background:#171614;color:#fff;border-radius:100px;padding:10px 16px;display:flex;gap:12px;',
    '  align-items:center;font-family:var(--font,sans-serif);font-size:12.5px;box-shadow:0 8px 28px rgba(0,0,0,0.35);',
    '  cursor:grab;user-select:none;-webkit-user-select:none;}',
    '.tst-bar.tst-dragging{cursor:grabbing;transition:none;}',
    /* Once dragged, left/top are set explicitly and the centering
       transform has to come off or the bar sits half a width away
       from the pointer. */
    '.tst-bar.tst-moved{transform:none;}',
    '.tst-bar .tst-grip{opacity:0.45;letter-spacing:1px;font-size:14px;line-height:1;margin-right:-4px;}',
    '.tst-bar button,.tst-bar .tst-chip{cursor:pointer;}',
    '.tst-bar.tst-bar-rec{background:#1f9d55;}',
    '.tst-bar b{font-weight:600;}',
    '.tst-bar .tst-chip{border-color:rgba(255,255,255,0.4);color:#fff;background:none;}',
    '.tst-bar .tst-chip:hover{background:rgba(255,255,255,0.12);}',
    '.tst-dot{width:8px;height:8px;border-radius:50%;background:#fff;animation:tstblink 1.1s infinite;}',
    '@keyframes tstblink{50%{opacity:0.25;}}',
    /* ── Test-mode chrome ──────────────────────────────────────────
       Hide what can invalidate a run: viewport pills (the link already
       pinned the surface), the comment layer (authoring furniture), and
       the Test button. Options STAYS — dark mode is a real preference
       that changes nothing being measured. Inside it, Role and Version
       are hidden because they change what the prototype shows. */
    'body.tst-testing .vp-viewport-pills,body.tst-testing .cmt-wrap,',
    'body.tst-testing .tst-wrap{display:none !important;}',
    'body.tst-testing #vp-opt-external,body.tst-testing #vp-opt-internal,',
    'body.tst-testing #vp-opt-final,',
    'body.tst-testing #vp-opts-dd .vp-opts-section-label:nth-of-type(1),',
    'body.tst-testing #vp-opts-dd .vp-opts-section-label:nth-of-type(2),',
    'body.tst-testing #vp-opts-dd .vp-opts-divider:nth-of-type(1),',
    'body.tst-testing #vp-opts-dd .vp-opts-divider:nth-of-type(2){display:none !important;}',
    /* Comment layer is authoring furniture. A tester should never see a
       pin, a card, the hint strip or the drawer during a session. */
    'body.tst-testing .cmt-pin,body.tst-testing .cmt-card,body.tst-testing .cmt-hint,',
    'body.tst-testing .cmt-menu,body.tst-testing .cmt-drawer,',
    'body.tst-testing .cmt-drawer-scrim{display:none !important;}',
    '.tst-dev-tag{display:inline-block;font-size:10px;font-weight:600;letter-spacing:0.03em;',
    '  text-transform:uppercase;color:#555;background:#f0eeec;border-radius:100px;padding:2px 8px;}',
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
    '.tst-veil{position:fixed;inset:0;z-index:2990;backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);',
    '  background:rgba(246,244,242,0.45);display:flex;flex-direction:column;gap:12px;',
    '  align-items:center;justify-content:center;font-family:var(--font,sans-serif);}',
    '.tst-veil-msg{background:#171614;color:#fff;font-size:13px;padding:10px 20px;border-radius:100px;',
    '  box-shadow:0 8px 28px rgba(0,0,0,0.3);}',
    '.tst-toast{position:fixed;top:54px;left:50%;transform:translateX(-50%);z-index:3001;',
    '  background:#171614;color:#fff;font-family:var(--font,sans-serif);font-size:12px;',
    '  padding:8px 16px;border-radius:100px;box-shadow:0 4px 14px rgba(0,0,0,0.3);max-width:80vw;',
    '  text-align:center;}',
    '.tst-flash{position:fixed;border-radius:50%;width:34px;height:34px;border:3px solid #1f9d55;',
    '  z-index:2999;pointer-events:none;animation:tstflash 0.5s ease-out forwards;margin:-17px 0 0 -17px;}',
    '@keyframes tstflash{from{transform:scale(0.5);opacity:1;}to{transform:scale(1.6);opacity:0;}}',
    /* Heat map overlay */
    '.tst-heat-layer{position:absolute;top:0;left:0;pointer-events:none;z-index:1400;overflow:hidden;}',
    '.tst-heat-blob{position:absolute;border-radius:50%;pointer-events:none;',
    '  background:radial-gradient(circle closest-side,rgba(211,84,47,0.55),rgba(211,84,47,0.22) 55%,rgba(211,84,47,0) 100%);}',
    '.tst-heat-blob.hit{background:radial-gradient(circle closest-side,rgba(31,157,85,0.55),rgba(31,157,85,0.22) 55%,rgba(31,157,85,0) 100%);}',
    '.tst-heat-pin.hit{background:#16693a;}',
    '.tst-heat-n.hit{color:#16693a;}',
    '.tst-heat-ramp.hit{background:linear-gradient(90deg,rgba(31,157,85,0.18),rgba(31,157,85,0.95));}',
    '.tst-heat-seg{display:flex;gap:0;border:1px solid rgba(0,0,0,0.15);border-radius:100px;overflow:hidden;}',
    '.tst-heat-seg button{flex:1;border:none;background:#fff;font-family:inherit;font-size:11px;',
    '  font-weight:500;color:#555;padding:5px 0;cursor:pointer;}',
    '.tst-heat-seg button.on{background:#171614;color:#fff;}',
    '.tst-heat-pin{position:absolute;transform:translate(-50%,-50%);pointer-events:none;',
    '  font-family:var(--font,sans-serif);font-size:10px;font-weight:700;color:#fff;',
    '  background:#a8341a;border-radius:100px;padding:1px 6px;box-shadow:0 1px 4px rgba(0,0,0,0.35);}',
    '.tst-heat-row{display:flex;align-items:center;justify-content:space-between;gap:8px;',
    '  font-size:11.5px;padding:5px 0;border-bottom:1px solid rgba(0,0,0,0.07);}',
    '.tst-heat-row:last-child{border-bottom:none;}',
    '.tst-heat-cid{font-family:ui-monospace,Menlo,monospace;font-size:10.5px;color:#171614;',
    '  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.tst-heat-n{font-weight:700;color:#a8341a;flex:0 0 auto;}',
    '.tst-heat-off{color:#8a8d94;font-size:10px;flex:0 0 auto;}',
    '.tst-heat-key{display:flex;align-items:center;gap:6px;font-size:10.5px;color:#8a8d94;}',
    '.tst-heat-ramp{height:8px;flex:1;border-radius:4px;',
    '  background:linear-gradient(90deg,rgba(211,84,47,0.18),rgba(211,84,47,0.95));}',
    /* ── Admin drawer ──
       The admin surface outgrew a 320px floating card: seven co-equal
       chips were doing three unrelated jobs (author / share / analyse)
       and the list mixed tasks, goals and archived rows in one stack.
       This is a docked right drawer with a tab rail, so each job gets
       its own room and the dashboard gets a permanent home in the
       footer instead of living two levels deep under Results. */
    '.tst-drawer{position:fixed;top:52px;right:0;bottom:0;width:420px;max-width:92vw;background:#fff;',
    '  border-left:1px solid rgba(0,0,0,0.12);box-shadow:-10px 0 34px rgba(0,0,0,0.16);z-index:3000;',
    '  display:flex;flex-direction:column;font-family:var(--font,sans-serif);animation:tstdrin 0.16s ease-out;}',
    '@keyframes tstdrin{from{transform:translateX(28px);opacity:0;}to{transform:none;opacity:1;}}',
    '.tst-dr-head{flex:0 0 auto;padding:14px 18px 0;display:flex;flex-direction:column;gap:12px;}',
    '.tst-dr-title{display:flex;align-items:center;justify-content:space-between;',
    '  font-size:14px;font-weight:600;color:#171614;}',
    '.tst-dr-tabs{display:flex;gap:18px;border-bottom:1px solid rgba(0,0,0,0.09);}',
    '.tst-dr-tab{border:none;background:none;font-family:inherit;font-size:12.5px;font-weight:500;',
    '  color:#8a8d94;padding:0 0 9px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;}',
    '.tst-dr-tab:hover{color:#171614;}',
    '.tst-dr-tab.on{color:#171614;border-bottom-color:#171614;}',
    /* min-height:0 or the body refuses to scroll inside the flex column */
    '.tst-dr-body{flex:1;min-height:0;overflow-y:auto;padding:14px 18px 18px;',
    '  display:flex;flex-direction:column;gap:12px;}',
    '.tst-dr-foot{flex:0 0 auto;border-top:1px solid rgba(0,0,0,0.09);background:#faf9f8;',
    '  padding:10px 18px;display:flex;align-items:center;justify-content:space-between;gap:10px;}',
    '.tst-dr-foot-left{font-size:11px;color:#8a8d94;}',
    '.tst-dr-formtitle{font-size:13px;font-weight:600;color:#171614;}',
    /* The old panel got its rhythm from the panel-level flex gap. The
       drawer body has its own gap, so the three tab hosts have to
       re-establish it for their own children. */
    '#tst-list,#tst-results,#tst-heat-body{display:flex;flex-direction:column;gap:10px;}',
    /* Grouped workflow list */
    '.tst-actions{display:flex;gap:6px;flex-wrap:wrap;}',
    '.tst-share{border:1px solid rgba(0,0,0,0.08);background:#faf9f8;border-radius:10px;',
    '  padding:9px 10px;display:flex;flex-direction:column;gap:7px;}',
    '.tst-share-label{font-size:10.5px;font-weight:600;letter-spacing:0.04em;',
    '  text-transform:uppercase;color:#8a8d94;}',
    '.tst-group{display:flex;flex-direction:column;gap:8px;}',
    '.tst-group-h{display:flex;align-items:baseline;gap:7px;}',
    '.tst-group-t{font-size:12px;font-weight:600;color:#171614;}',
    '.tst-group-n{font-size:11px;color:#8a8d94;}',
    '.tst-group-sub{font-size:11px;color:#8a8d94;margin-top:-6px;}',
    '.tst-fold{border-top:1px solid rgba(0,0,0,0.08);padding-top:11px;}',
    '.tst-fold>summary{cursor:pointer;font-size:12px;font-weight:600;color:#8a8d94;padding:1px 0;}',
    '.tst-fold>summary:hover{color:#171614;}',
    '.tst-fold-body{display:flex;flex-direction:column;gap:8px;padding-top:10px;}',
    /* Test split button + shortcut menu */
    '.tst-wrap{position:relative;}',
    '.tst-menu{display:none;position:absolute;top:calc(100% + 6px);right:0;min-width:190px;',
    '  background:#fff;border:1px solid rgba(0,0,0,0.12);border-radius:10px;',
    '  box-shadow:0 10px 28px rgba(0,0,0,0.22);padding:5px;z-index:3100;font-family:var(--font,sans-serif);}',
    '.tst-menu.open{display:block;}',
    '.tst-menu-item{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:7px;',
    '  font-size:12px;color:#171614;cursor:pointer;white-space:nowrap;}',
    '.tst-menu-item:hover{background:#f2f0ee;}',
    '.tst-menu-div{height:1px;background:rgba(0,0,0,0.08);margin:4px 6px;}',
    'body.tst-testing .tst-drawer,body.tst-testing .tst-menu{display:none !important;}'
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

/* ── Tester IP — Apps Script cannot see the client address, so the
   browser resolves it and hands it to the backend in the payload.
   Prefetched on entry to test mode so it is warm before the first
   task finishes. Fails silent: a blank ip never blocks a save. ── */
var tstIP = null;          /* string once resolved, '' if lookup failed */
var tstIPWait = [];        /* callbacks queued while the fetch is in flight */
var tstIPBusy = false;

function tstFetchIP(cb) {
  if (tstIP !== null) { if (cb) cb(tstIP); return; }
  if (cb) tstIPWait.push(cb);
  if (tstIPBusy) return;
  tstIPBusy = true;
  var done = function (v) {
    tstIP = v || '';
    tstIPBusy = false;
    var q = tstIPWait; tstIPWait = [];
    q.forEach(function (f) { try { f(tstIP); } catch (e) {} });
  };
  var bail = setTimeout(function () { if (tstIPBusy) done(''); }, 2500);
  fetch('https://api.ipify.org?format=json')
    .then(function (r) { return r.json(); })
    .then(function (d) { clearTimeout(bail); done(d && d.ip); })
    .catch(function () { clearTimeout(bail); done(''); });
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
  /* Split button, same grammar as the Comment control: the label opens
     the drawer, the caret exposes the three things you want without
     opening anything (dashboard + the two tester links). */
  wrap.innerHTML =
    '<button class="vp-opts-btn tst-btn" id="tst-btn" onclick="tstTogglePanel()" title="Workflow testing">' +
    '<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7.2 5.2 10.4 12 3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '<span style="font-family:var(--font);font-size:12px;font-weight:500;letter-spacing:-0.24px;">Test</span></button>' +
    '<button class="vp-opts-btn" id="tst-caret" onclick="tstMenuToggle(event)" title="Testing shortcuts">' +
    '<svg width="9" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '<div class="tst-menu" id="tst-menu">' +
      '<div class="tst-menu-item" onclick="tstMenuGo(\'dash\')">' +
        '<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="4.5" height="4.5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="8" y="1.5" width="4.5" height="7.5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="1.5" y="8" width="4.5" height="4.5" rx="1" stroke="currentColor" stroke-width="1.2"/></svg>' +
        'Open dashboard \u2197</div>' +
      '<div class="tst-menu-div"></div>' +
      '<div class="tst-menu-item" onclick="tstMenuGo(\'tester\')">' +
        '<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M5.8 8.2a2.4 2.4 0 0 0 3.4 0l2.1-2.1a2.4 2.4 0 0 0-3.4-3.4l-.6.6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M8.2 5.8a2.4 2.4 0 0 0-3.4 0L2.7 7.9a2.4 2.4 0 0 0 3.4 3.4l.6-.6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>' +
        'Copy tester link</div>' +
      '<div class="tst-menu-item" onclick="tstMenuGo(\'explore\')">' +
        '<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.2"/><path d="M9.2 4.8 8 8 4.8 9.2 6 6z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>' +
        'Copy explore link</div>' +
    '</div>';
  var anchor = cluster.querySelector('.cmt-wrap') || cluster.querySelector('.vp-opts-wrap');
  if (anchor) cluster.insertBefore(wrap, anchor);
  else cluster.appendChild(wrap);
}

/* ── Panels ──
   Two surfaces now. The floating card (tst-panel) is what a TESTER
   sees: one thing at a time, small, disposable. The drawer
   (tst-drawer) is the ADMIN surface: tabbed, docked, persistent.
   tstClosePanel() kills both so every existing "get out of my way"
   caller (start recording, begin a run, enter test mode) keeps
   working unchanged. */
function tstClosePanel() {
  var p = document.getElementById('tst-panel'); if (p) p.remove();
  tstDrawerClose();
}

function tstDrawerClose() { var d = document.getElementById('tst-drawer'); if (d) d.remove(); }

function tstTogglePanel() {
  if (document.getElementById('tst-drawer')) { tstDrawerClose(); return; }
  tstOpenAdminPanel();
}

/* ── Admin drawer shell ──
   Built once, then reused: each tab render just refills the body, so
   scroll chrome and the footer never flicker between tabs. */
var tstTab = 'workflows';

function tstDrawerShell(tab) {
  var d = document.getElementById('tst-drawer');
  if (!d) {
    var old = document.getElementById('tst-panel'); if (old) old.remove();
    d = document.createElement('div');
    d.id = 'tst-drawer'; d.className = 'tst-drawer tst-ui';
    d.innerHTML =
      '<div class="tst-dr-head">' +
        '<div class="tst-dr-title"><span>Workflow testing</span>' +
        '<span class="tst-x" onclick="tstDrawerClose()">\u00D7</span></div>' +
        '<div class="tst-dr-tabs">' +
          '<button class="tst-dr-tab" data-tab="workflows" onclick="tstDrawerGo(\'workflows\')">Workflows</button>' +
          '<button class="tst-dr-tab" data-tab="results" onclick="tstDrawerGo(\'results\')">Results</button>' +
          '<button class="tst-dr-tab" data-tab="heat" onclick="tstDrawerGo(\'heat\')">Heat map</button>' +
        '</div>' +
      '</div>' +
      '<div class="tst-dr-body" id="tst-dr-body"></div>' +
      '<div class="tst-dr-foot">' +
        '<span class="tst-dr-foot-left" id="tst-dr-count"></span>' +
        '<button class="tst-chip tst-chip-primary" onclick="tstOpenDashboard()">Open dashboard \u2197</button>' +
      '</div>';
    document.body.appendChild(d);
  }
  tstTab = tab;
  var tabs = d.querySelectorAll('.tst-dr-tab');
  for (var i = 0; i < tabs.length; i++) {
    if (tabs[i].getAttribute('data-tab') === tab) tabs[i].classList.add('on');
    else tabs[i].classList.remove('on');
  }
  var body = document.getElementById('tst-dr-body');
  body.innerHTML = '';
  body.scrollTop = 0;
  tstDrawerCount();
  return body;
}

function tstDrawerGo(tab) {
  if (tab === 'results') tstOpenResultsPanel();
  else if (tab === 'heat') tstOpenHeatPanel();
  else tstOpenAdminPanel();
}

/* Footer summary — cheap orientation without opening the Workflows tab */
function tstDrawerCount() {
  var el = document.getElementById('tst-dr-count');
  if (!el) return;
  var act = tstState.workflows.filter(function (w) { return w.status === 'active'; });
  if (!act.length) { el.textContent = ''; return; }
  var goals = act.filter(tstIsGoal).length;
  var tasks = act.length - goals;
  el.textContent = tasks + (tasks === 1 ? ' task' : ' tasks') + ' \u00B7 ' + goals + (goals === 1 ? ' goal' : ' goals');
}

/* ── Top-bar shortcut menu ── */
function tstMenuToggle(e) {
  if (e) e.stopPropagation();
  var m = document.getElementById('tst-menu');
  if (m) m.classList.toggle('open');
}

function tstMenuGo(what) {
  var m = document.getElementById('tst-menu');
  if (m) m.classList.remove('open');
  if (what === 'dash') { tstOpenDashboard(); return; }
  var url = new URL(location.href);
  url.search = what === 'explore' ? '?explore=1' : '?test=1';
  url.hash = '';
  var text = url.toString();
  (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
    .then(function () { tstToast((what === 'explore' ? 'Explore' : 'Tester') + ' link copied'); })
    .catch(function () { prompt('Copy this link:', text); });
}

document.addEventListener('click', function (e) {
  var m = document.getElementById('tst-menu');
  if (m && m.classList.contains('open') && !e.target.closest('.tst-wrap')) m.classList.remove('open');
});

/* Escape closes the shallowest thing that is open. Recording and live
   runs own Escape themselves, so leave them alone. */
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  var m = document.getElementById('tst-menu');
  if (m && m.classList.contains('open')) { m.classList.remove('open'); return; }
  if (tstState.mode) return;
  if (document.getElementById('tst-drawer')) tstDrawerClose();
});

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
  var body = tstDrawerShell('workflows');
  body.innerHTML =
    /* Authoring first — the three things that change what exists */
    '<div class="tst-actions">' +
      '<button class="tst-chip tst-chip-primary" onclick="tstStartRecordForm()">\u25CF Record workflow</button>' +
      '<button class="tst-chip" onclick="tstStartGoalForm()">+ New goal</button>' +
      '<button class="tst-chip" onclick="tstValidateAll()">Validate all</button>' +
    '</div>' +
    /* Sharing second, boxed so it stops competing with the actions */
    '<div class="tst-share">' +
      '<span class="tst-share-label">Send to a tester</span>' +
      '<div class="tst-item-row">' +
        '<button class="tst-chip" onclick="tstCopyLink(\'1\', this)">Copy tester link</button>' +
        '<button class="tst-chip" onclick="tstCopyExploreLink(this)">Copy explore link</button>' +
      '</div>' +
      '<div class="tst-sub">Tester link shows the task list. Explore link drops them into free roam with no task.</div>' +
    '</div>' +
    '<div id="tst-list"><div class="tst-sub">Loading\u2026</div></div>';
  tstGet('?action=list&prototype=' + encodeURIComponent(TST_PROTOTYPE) + '&all=1', function (res) {
    tstState.workflows = (res.ok && res.workflows) || [];
    tstRenderAdminList();
  });
}

/* Goals have nothing to validate: a static check needs checkpoints,
   and a goal deliberately has none. */
function tstValidatable(wf) { return !tstIsGoal(wf); }

function tstWfMeta(wf) {
  var m = (wf.checkpoints && wf.checkpoints[0] && wf.checkpoints[0].meta) ? wf.checkpoints[0] : null;
  return m ? (m.view + (m.orientation ? ' \u00B7 ' + m.orientation : '')) : '';
}
/* ── Device target ───────────────────────────────────────────────
   A workflow is recorded against one surface and only makes sense on
   that surface, so the target is chosen up front, applied before the
   first click is recorded, and re-applied for the tester. Stored on the
   meta checkpoint as {view, orientation} — same shape it always had, so
   older workflows keep working. ── */
var TST_DEVICES = [
  { v: 'desktop', o: 'portrait',  label: 'Desktop' },
  { v: 'tablet',  o: 'portrait',  label: 'Tablet \u00B7 portrait' },
  { v: 'tablet',  o: 'landscape', label: 'Tablet \u00B7 landscape' },
  { v: 'mobile',  o: 'portrait',  label: 'Mobile \u00B7 portrait' },
  { v: 'mobile',  o: 'landscape', label: 'Mobile \u00B7 landscape' }
];
function tstDevKey(view, orient) {
  return view === 'desktop' ? 'desktop' : view + '-' + (orient || 'portrait');
}
function tstDevLabel(view, orient) {
  var k = tstDevKey(view, orient);
  for (var i = 0; i < TST_DEVICES.length; i++) {
    if (tstDevKey(TST_DEVICES[i].v, TST_DEVICES[i].o) === k) return TST_DEVICES[i].label;
  }
  return 'Desktop';
}
/* Select markup, defaulted to whatever surface the author is on now. */
function tstDevSelect(id, view, orient) {
  var cur = tstDevKey(view || tstCurView(), orient || tstCurOrient());
  return '<div class="tst-sub">Which surface is this test run on?</div>' +
    '<select class="tst-input" id="' + id + '" onchange="tstDevPreview(this)">' +
    TST_DEVICES.map(function (d) {
      var k = tstDevKey(d.v, d.o);
      return '<option value="' + k + '"' + (k === cur ? ' selected' : '') + '>' + d.label + '</option>';
    }).join('') + '</select>';
}
/* Changing the dropdown flips the prototype behind the panel straight
   away, so you author against the surface you picked instead of finding
   out at Start. The form lives in the drawer, so its values survive. */
function tstDevPreview(sel) {
  var p = (sel && sel.value ? sel.value : 'desktop').split('-');
  tstDevApply(p[0], p[1] || 'portrait');
}
function tstDevRead(id) {
  var el = document.getElementById(id);
  var k = (el && el.value) || 'desktop';
  var p = k.split('-');
  return { view: p[0], orientation: p[1] || 'portrait' };
}
/* Single place that puts the prototype on a surface. */
function tstDevApply(view, orient) {
  try {
    if (!view) return;
    if (typeof setView === 'function') setView(view);
    if (view !== 'desktop' && typeof setOrientation === 'function') setOrientation(view, orient || 'portrait');
  } catch (e) { console.warn('[testing] view switch failed', e); }
  tstReassert();
}

/* setView() rebuilds body.className from scratch ('view-' + view), which
   wipes tst-testing — and tstDevApply calls setView at the start of every
   run to pin the surface. That is why the toolbar reappeared the moment a
   test began: the class hiding it had just been destroyed. Re-assert after
   any class rewrite, from wherever it came. */
function tstReassert() {
  if (tstState.testing && !document.body.classList.contains('tst-testing')) {
    document.body.classList.add('tst-testing');
  }
}
(function () {
  new MutationObserver(tstReassert)
    .observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();

function tstWfSteps(wf) {
  return (wf.checkpoints || []).filter(function (s) { return !s.meta; });
}

/* One workflow card. Unchanged content, extracted so the three
   groups can each render their own slice. */
function tstWfCard(wf) {
  var steps = tstWfSteps(wf);
  var archived = wf.status !== 'active';
  var goal = tstIsGoal(wf);
  return '<div class="tst-item" data-wfid="' + tstEsc(wf.id) + '">' +
    '<div class="tst-item-name">' + tstEsc(wf.name) +
    /* The goal badge is redundant inside the Goals group but the
       archived fold mixes both kinds, so it earns its place there. */
    (archived && goal ? ' <span class="tst-badge">goal</span>' : '') +
    (archived ? ' <span class="tst-badge tst-badge-arch">archived</span>' : '') +
    (goal || archived ? '' : ' <span class="tst-badge" id="tst-val-' + tstEsc(wf.id) + '"></span>') + '</div>' +
    '<div class="tst-item-meta">' +
      (goal ? 'No fixed route \u00B7 tester decides when they\u2019re there' : steps.length + ' steps') +
      ' \u00B7 ' + tstWfMeta(wf) + '</div>' +
    '<div class="tst-item-meta">' + tstEsc(wf.instruction) + '</div>' +
    '<div class="tst-item-row">' +
    (archived
      ? '<button class="tst-chip" onclick="tstSetStatus(\'' + tstEsc(wf.id) + '\',\'active\',this)">Restore</button>'
      : '<button class="tst-chip" onclick="tstCopyLink(\'' + tstEsc(wf.id) + '\', this)">Copy link</button>' +
        (goal ? '' : '<button class="tst-chip" onclick="tstStartRecordForm(\'' + tstEsc(wf.id) + '\')">Re-record</button>') +
        '<button class="tst-chip" onclick="tstSetStatus(\'' + tstEsc(wf.id) + '\',\'archived\',this)">Archive</button>') +
    '</div></div>';
}

function tstGroup(title, sub, arr, empty) {
  if (!arr.length && !empty) return '';
  return '<div class="tst-group">' +
    '<div class="tst-group-h"><span class="tst-group-t">' + title + '</span>' +
    '<span class="tst-group-n">' + arr.length + '</span></div>' +
    '<div class="tst-group-sub">' + sub + '</div>' +
    (arr.length ? arr.map(tstWfCard).join('') : '<div class="tst-sub">' + empty + '</div>') +
    '</div>';
}

/* Tasks and goals are different instruments and were reading as one
   list. Archived rows are history, not inventory, so they fold away
   instead of padding the scroll. */
function tstRenderAdminList() {
  var list = document.getElementById('tst-list');
  if (!list) return;
  tstDrawerCount();
  if (!tstState.workflows.length) {
    list.innerHTML = '<div class="tst-sub">No workflows yet. Hit Record, then click through the task in the prototype \u2014 every click becomes a step.</div>';
    return;
  }
  var tasks = [], goals = [], arch = [];
  tstState.workflows.forEach(function (wf) {
    if (wf.status !== 'active') arch.push(wf);
    else if (tstIsGoal(wf)) goals.push(wf);
    else tasks.push(wf);
  });
  var html =
    tstGroup('Recorded tasks', 'Fixed route \u00B7 every click is matched against a step', tasks,
             'Nothing recorded yet. Hit Record and click through a task.') +
    tstGroup('Goals', 'A destination with no route \u00B7 the tester finds their own way', goals, '');
  if (arch.length) {
    html += '<details class="tst-fold"><summary>Archived (' + arch.length + ')</summary>' +
      '<div class="tst-fold-body">' + arch.map(tstWfCard).join('') + '</div></details>';
  }
  list.innerHTML = html;
}

function tstSetStatus(id, status, btn) {
  btn.disabled = true;
  tstPost({ action: 'setWorkflowStatus', id: id, status: status }, function () { tstOpenAdminPanel(); });
}

/* An explore link drops the tester straight into free roam, no task
   list, no instruction. Separate link so you can send guided and
   open-ended sessions to different people. */
function tstCopyExploreLink(btn) {
  var url = new URL(location.href);
  url.search = '?explore=1';
  url.hash = '';
  var text = url.toString();
  (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
    .then(function () { btn.textContent = 'Copied!'; setTimeout(function () { btn.textContent = 'Copy explore link'; }, 1400); })
    .catch(function () { prompt('Copy this link:', text); });
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
    if (!tstValidatable(wf)) return;      /* goals have no checkpoints to verify */
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
  /* The Back and Expand chips are gone: the tab rail is the way back
     and the footer holds the dashboard permanently. */
  var body = tstDrawerShell('results');
  body.innerHTML = '<div id="tst-results"><div class="tst-sub">Loading\u2026</div></div>';

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
  var wfMeta = (wf && wf.checkpoints && wf.checkpoints[0] && wf.checkpoints[0].meta) ? wf.checkpoints[0] : null;
  /* Lives inside the Workflows tab now rather than replacing the whole
     surface, so cancelling returns you to the list instead of nothing. */
  var body = tstDrawerShell('workflows');
  body.innerHTML =
    '<div class="tst-item-row"><button class="tst-chip" onclick="tstOpenAdminPanel()">\u2190 Back</button></div>' +
    '<div class="tst-dr-formtitle">' + (editingId ? 'Re-record workflow' : 'New workflow') + '</div>' +
    '<input class="tst-input" id="tst-rec-name" placeholder="Workflow name (e.g. Send an update to 2 trucks)" value="' + (wf ? tstEsc(wf.name) : '') + '">' +
    '<textarea class="tst-ta" id="tst-rec-inst" placeholder="Instruction the tester will read">' + (wf ? tstEsc(wf.instruction) : '') + '</textarea>' +
    tstDevSelect('tst-rec-device', wfMeta ? wfMeta.view : null, wfMeta ? wfMeta.orientation : null) +
    '<div class="tst-sub">Hitting Start switches the prototype to that surface for you. Click through the task exactly as a user would \u2014 every click becomes a step. Finish on the last click. Testers are locked to this same surface.</div>' +
    '<div class="tst-err" id="tst-rec-err" style="display:none;"></div>' +
    '<div class="tst-item-row" style="justify-content:flex-end;">' +
    '<button class="tst-cta tst-cta-quiet" onclick="tstOpenAdminPanel()">Cancel</button>' +
    '<button class="tst-cta tst-cta-dark" onclick="tstBeginRecording(' + (editingId ? '\'' + tstEsc(editingId) + '\'' : 'null') + ')">Start recording</button></div>';
  setTimeout(function () { var i = document.getElementById('tst-rec-name'); if (i) i.focus(); }, 50);
}

function tstBeginRecording(editingId) {
  var name = document.getElementById('tst-rec-name').value.trim();
  var inst = document.getElementById('tst-rec-inst').value.trim();
  var err = document.getElementById('tst-rec-err');
  if (!name || !inst) { err.textContent = 'Name and instruction are both needed.'; err.style.display = 'block'; return; }
  var dev = tstDevRead('tst-rec-device');
  tstClosePanel();
  tstState.mode = 'record';
  tstState.rec = { name: name, instruction: inst, steps: [], editingId: editingId, device: dev };
  /* Record on the surface that was chosen, not whatever was on screen. */
  tstDevApply(dev.view, dev.orientation);
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
    /* Testers forget the instruction two steps in and have no way back
       to it — the panel is dismissed with "Got it" and never returns.
       Re-reading the task is not a hint, it is the task. */
    bar.innerHTML = '<b>' + tstEsc(r.wf.name) + '</b>' +
      '<span id="tst-bar-count">Step ' + (r.idx + 1) + ' of ' + total + '</span>' +
      '<button class="tst-chip" onclick="tstShowTask()">Task</button>' +
      '<button class="tst-chip" onclick="tstRunGiveUp(this)">Give up</button>';
  }
  bar.innerHTML = '<span class="tst-grip">\u22EE\u22EE</span>' + bar.innerHTML;
  document.body.appendChild(bar);
  tstBarDraggable(bar);
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
  var dev = rec.device || { view: tstCurView(), orientation: tstCurOrient() };
  var meta = { meta: 1, view: dev.view, orientation: dev.orientation };
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
  tstFetchIP();                                   /* warm it up early */
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
  if (param === 'explore') { tstBeginExplore(); return; }
  tstOpenTesterPanel(param);
}

function tstOpenTesterPanel(param) {
  var wfs = tstState.workflows;
  if (param === 'explore') { tstBeginExplore(); return; }
  if (param !== '1') {
    var one = wfs.find(function (w) { return w.id === param; });
    if (one) { tstIsGoal(one) ? tstBeginGoal(one) : tstBeginRun(one); return; }
  }
  var p = tstPanelShell('Tasks to try');
  if (!wfs.length) {
    p.insertAdjacentHTML('beforeend', '<div class="tst-sub">No tasks are available right now.</div>');
    return;
  }
  p.insertAdjacentHTML('beforeend',
    '<div class="tst-sub">Pick a task, read the instruction, and complete it in the prototype like you normally would. There are no wrong answers \u2014 we\u2019re testing the design, not you.</div>' +
    '<div class="tst-item"><div class="tst-item-name">Just have a look around</div>' +
    '<div class="tst-item-meta">No task. Click wherever you like and tell us nothing \u2014 we learn from where you go.</div>' +
    '<div class="tst-item-row"><button class="tst-chip" onclick="tstStartExplore()">Explore</button></div></div>' +
    wfs.map(function (wf) {
      var g = tstIsGoal(wf);
      var wm = (wf.checkpoints && wf.checkpoints[0] && wf.checkpoints[0].meta) ? wf.checkpoints[0] : null;
      return '<div class="tst-item"><div class="tst-item-name">' + tstEsc(wf.name) + '</div>' +
        '<div class="tst-item-meta">' + tstEsc(wf.instruction) + '</div>' +
        '<div class="tst-item-meta"><span class="tst-dev-tag">' +
          tstEsc(tstDevLabel(wm ? wm.view : 'desktop', wm ? wm.orientation : 'portrait')) +
        '</span></div>' +
        (g ? '<div class="tst-item-meta">Find your own way. Tell us when you think you\u2019ve got it, or give up \u2014 both are useful.</div>' : '') +
        '<div class="tst-item-row"><button class="tst-chip tst-chip-primary" onclick="tstBeginRunById(\'' + tstEsc(wf.id) + '\')">Start</button></div></div>';
    }).join(''));
}

/* Exploration still needs a name on the row, so route through the
   same prompt the guided runs use rather than recording an anonymous
   path we cannot attribute later. */
function tstStartExplore() {
  if (!tstState.user) { tstAskName('explore'); return; }
  tstBeginExplore();
}

function tstBeginRunById(id) {
  var wf = tstState.workflows.find(function (w) { return w.id === id; });
  if (!wf) return;
  if (tstIsGoal(wf)) tstBeginGoal(wf); else tstBeginRun(wf);
}

function tstBeginRun(wf) {
  tstClosePanel();
  /* Put the prototype in the surface the workflow was recorded on */
  var meta = (wf.checkpoints && wf.checkpoints[0] && wf.checkpoints[0].meta) ? wf.checkpoints[0] : null;
  tstDevApply(meta ? meta.view : 'desktop', meta ? meta.orientation : 'portrait');

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

/* Re-show the current task. Works for both run kinds — a guided run
   keeps its workflow on tstState.run, a goal run on tstState.explore. */
function tstShowTask() {
  var wf = (tstState.run && tstState.run.wf) ||
           (tstState.explore && tstState.explore.wf) || null;
  if (wf) tstShowInstruction(wf);
}

function tstAdvance(e) {
  var r = tstState.run;
  var steps = tstWfSteps(r.wf);
  var now = Date.now();
  /* `hit` is the position of the click that satisfied this step. New as
     of the heat map: sessions recorded before this exists have misses
     only, which is why the heat panel can show 0 correct on old data. */
  var hit = null;
  try { hit = tstClickPos(e); } catch (err) {}
  r.steps.push({ i: r.idx, label: steps[r.idx].text || steps[r.idx].eid, ms: now - r.tStep,
                 misclicks: r.stepMis, missed: r.stepMissed, hit: hit });
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

  tstFetchIP(function (ip) {
  tstPost({
    action: 'addSession',
    prototype: TST_PROTOTYPE,
    workflow_id: r.wf.id,
    user: tstState.user,
    ip: ip || '',
    view: document.body.classList.contains('view-mobile') ? 'mobile'
        : document.body.classList.contains('view-tablet') ? 'tablet' : 'desktop',
    orientation: document.body.classList.contains('orient-landscape') ? 'landscape' : 'portrait',
    outcome: outcome,
    duration_s: Math.round((Date.now() - r.t0) / 100) / 10,
    steps_total: tstWfSteps(r.wf).length,
    misclicks_total: r.misclicks,
    steps_data: r.steps
  }, function () {});
  });

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

/* ── The bar is draggable, and remembers where you put it ──
   Testers on small viewports will always find something underneath it.
   Position is stored per browser so it does not reset mid-session. */
function tstBarDraggable(bar) {
  try {
    var saved = JSON.parse(localStorage.getItem('tst_bar_pos') || 'null');
    if (saved && typeof saved.x === 'number') {
      bar.classList.add('tst-moved');
      bar.style.left = saved.x + 'px';
      bar.style.top = saved.y + 'px';
    }
  } catch (e) {}

  var drag = null;
  bar.addEventListener('pointerdown', function (e) {
    /* Let the buttons be buttons */
    if (e.target.closest('button')) return;
    var r = bar.getBoundingClientRect();
    drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    bar.classList.add('tst-moved', 'tst-dragging');
    bar.style.left = r.left + 'px';
    bar.style.top = r.top + 'px';
    try { bar.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });
  bar.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var w = bar.offsetWidth, h = bar.offsetHeight;
    /* Clamp so it can never be dragged off screen and stranded */
    var x = Math.max(4, Math.min(window.innerWidth - w - 4, e.clientX - drag.dx));
    var y = Math.max(4, Math.min(window.innerHeight - h - 4, e.clientY - drag.dy));
    bar.style.left = x + 'px';
    bar.style.top = y + 'px';
  });
  function end() {
    if (!drag) return;
    drag = null;
    bar.classList.remove('tst-dragging');
    try {
      localStorage.setItem('tst_bar_pos', JSON.stringify({
        x: parseFloat(bar.style.left) || 0, y: parseFloat(bar.style.top) || 0
      }));
    } catch (e) {}
  }
  bar.addEventListener('pointerup', end);
  bar.addEventListener('pointercancel', end);
}

/* ═══════════════════════════════════════════════════════
   SCREEN MODEL — what counts as a \u201Cplace\u201D in the prototype

   The path diagram needs nodes, and a single-file app has no URLs to
   borrow. So a screen is derived from three things already encoded in
   the markup, in priority order:

     1. an open drawer          (dt-drawer, dt-ud-drawer, …)
     2. its active tab          (.dt-drawer-tab.active)
     3. otherwise the visible page div (dt-page-*, toggled display:none)

   Derived rather than tagged, so it keeps working as screens are added.
   TST_SCREENS only supplies readable LABELS — an unmapped id still
   tracks correctly, it just shows its raw id in the diagram. That is
   the failure mode you want: ugly, not missing.
   ═══════════════════════════════════════════════════════ */

var TST_SCREENS = {
  'dt-page-home':    'Home',
  'dt-page-trucks':  'Trucks',
  'dt-page-units':   'Units',
  'dt-page-update':  'Fleet Update',
  'dt-page-map':     'Map',
  'dt-page-tickets': 'Tickets',
  'dt-drawer':       'Truck detail',
  'dt-ud-drawer':    'Unit detail',
  'dt-at-drawer':    'Add truck',
  'dt-au-drawer':    'Add unit',
  'add-unit-sheet':  'Add unit sheet'
};

var TST_PAGE_IDS   = ['dt-page-home','dt-page-trucks','dt-page-units',
                      'dt-page-update','dt-page-map','dt-page-tickets'];
/* Most specific first: an add-unit sheet layered over a truck drawer
   should read as the sheet, since that is where the tester actually is. */
var TST_DRAWER_IDS = ['add-unit-sheet','dt-au-drawer','dt-at-drawer',
                      'dt-ud-drawer','dt-drawer'];

/* Deciding whether a container is really on screen is harder than it
   looks. add-unit-sheet is position:absolute and hidden with
   transform:translateX(100%) — it keeps a non-null offsetParent and a
   full-size bounding rect the entire time, so a naive check reports it
   as visible on every screen and the whole session collapses into one
   node. Four tests, cheapest first:

     1. computed style          catches display/visibility/opacity
     2. non-zero rect           catches collapsed containers
     3. intersects the viewport catches transform-slid panels
     4. hit test at its centre  catches anything clipped by an ancestor

   Step 4 is the expensive one and the only one that catches a panel
   slid outside a parent with overflow:hidden, which is the pattern
   this prototype uses everywhere. */
function tstVisible(id) {
  var el = document.getElementById(id);
  if (!el) return null;

  var cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return null;

  var r = el.getBoundingClientRect();
  if (r.width <= 2 || r.height <= 2) return null;

  var vw = window.innerWidth, vh = window.innerHeight;
  if (r.right <= 0 || r.bottom <= 0 || r.left >= vw || r.top >= vh) return null;

  /* Hit test the centre of whatever part of it is actually on screen */
  var cx = Math.min(Math.max((Math.max(r.left, 0) + Math.min(r.right, vw)) / 2, 1), vw - 1);
  var cy = Math.min(Math.max((Math.max(r.top, 0) + Math.min(r.bottom, vh)) / 2, 1), vh - 1);

  var stack = document.elementsFromPoint ? document.elementsFromPoint(cx, cy) : [document.elementFromPoint(cx, cy)];
  for (var i = 0; i < stack.length; i++) {
    var hit = stack[i];
    if (!hit) continue;
    if (hit.closest && hit.closest('.tst-ui')) continue;   /* our own bar and overlays don't count */
    return (hit === el || el.contains(hit)) ? el : null;
  }
  return null;
}

function tstScreenLabel(id) { return TST_SCREENS[id] || id; }

/* Returns {id, label}. id is stable and machine-comparable; label is
   what the diagram prints. */
function tstScreen() {
  for (var i = 0; i < TST_DRAWER_IDS.length; i++) {
    var d = tstVisible(TST_DRAWER_IDS[i]);
    if (!d) continue;
    var tab = d.querySelector('.dt-drawer-tab.active, .dt-tab.active');
    var tabTxt = tab ? tstNorm(tab.textContent) : '';
    var id = TST_DRAWER_IDS[i] + (tabTxt ? '#' + tabTxt : '');
    return { id: id, label: tstScreenLabel(TST_DRAWER_IDS[i]) + (tabTxt ? ' \u00B7 ' + tabTxt : '') };
  }
  for (var j = 0; j < TST_PAGE_IDS.length; j++) {
    if (tstVisible(TST_PAGE_IDS[j])) {
      return { id: TST_PAGE_IDS[j], label: tstScreenLabel(TST_PAGE_IDS[j]) };
    }
  }
  return { id: 'unknown', label: 'Unknown' };
}

/* ═══════════════════════════════════════════════════════
   OPEN EXPLORATION — no workflow, no right answer

   The tester wanders; every click is timestamped and the screen is
   re-read AFTER the DOM settles, so a click that opens a drawer is
   attributed to the drawer it opened rather than the page it left.
   Only screen CHANGES become path nodes. Clicks that stay put are
   counted as dwell activity on the current node instead of adding a
   node, or the diagram would be one column per click.
   ═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
   GOAL RUNS — a destination, no route

   Three modes now exist, and the difference is what is prescribed:

     workflow  goal + exact route — clicks matched to checkpoints
     goal      goal, no route     — tester decides when they got there
     explore   neither            — free roam

   A goal is stored as a Workflow row whose only checkpoint is the
   meta record, so tstWfSteps() returns zero steps. That is the test
   for \u201Cis this a goal\u201D and it needs no backend change: the sheet
   already carries a name and an instruction, which is the whole
   definition of a goal. Runs post as mode 'explore' with the goal's
   workflow_id attached, so the path is recorded AND attributable.
   ═══════════════════════════════════════════════════════ */

function tstIsGoal(wf) { return tstWfSteps(wf).length === 0; }

function tstStartGoalForm() {
  var body = tstDrawerShell('workflows');
  body.innerHTML =
    '<div class="tst-item-row"><button class="tst-chip" onclick="tstOpenAdminPanel()">\u2190 Back</button></div>' +
    '<div class="tst-dr-formtitle">New goal</div>' +
    '<div class="tst-sub">Give the tester a destination without a route. They wander until they think they found it, or give up. Every screen they touch is recorded either way.</div>' +
    '<input class="tst-input" id="tst-goal-name" placeholder="Short name, e.g. Find a truck\u2019s sensor history">' +
    '<textarea class="tst-ta" id="tst-goal-inst" placeholder="The goal, in the tester\u2019s language"></textarea>' +
    tstDevSelect('tst-goal-device', null, null) +
    '<div class="tst-item-row" style="justify-content:flex-end;">' +
    '<button class="tst-cta tst-cta-quiet" onclick="tstOpenAdminPanel()">Cancel</button>' +
    '<button class="tst-cta tst-cta-dark" onclick="tstSaveGoal(this)">Save goal</button></div>';
  setTimeout(function () { var i = document.getElementById('tst-goal-name'); if (i) i.focus(); }, 50);
}

function tstSaveGoal(btn) {
  var name = document.getElementById('tst-goal-name').value.trim();
  var inst = document.getElementById('tst-goal-inst').value.trim();
  if (!name || !inst) { alert('A goal needs both a name and an instruction.'); return; }
  var goalDev = tstDevRead('tst-goal-device');
  btn.disabled = true;
  /* Meta-only checkpoint list: satisfies the backend's non-empty
     requirement while defining zero steps to match against. */
  tstPost({
    action: 'addWorkflow', prototype: TST_PROTOTYPE, name: name, instruction: inst, author: '',
    checkpoints: [{ meta: 1, kind: 'goal', view: goalDev.view, orientation: goalDev.orientation }]
  }, function (res) {
    if (!res.ok) { alert('Save failed: ' + res.error); btn.disabled = false; return; }
    tstOpenAdminPanel();
  });
}

function tstBeginGoal(wf) {
  tstClosePanel();
  var meta = (wf.checkpoints && wf.checkpoints[0] && wf.checkpoints[0].meta) ? wf.checkpoints[0] : null;
  tstDevApply(meta ? meta.view : 'desktop', meta ? meta.orientation : 'portrait');
  setTimeout(function () {
    tstBeginExplore(wf);
    tstShowInstruction(wf);
  }, 650);
}

var TST_EXPLORE_CAP = 300;   /* backend truncates at ~48k chars; this keeps us well under */

function tstBeginExplore(wf) {
  tstClosePanel();
  var s = tstScreen();
  tstState.mode = 'explore';
  tstState.explore = {
    wf: wf || null,          /* set for a goal run, null for free roam */
    t0: Date.now(),
    tNode: Date.now(),
    clicks: 0,
    truncated: false,
    path: [{ s: s.id, label: s.label, t: 0, clicks: 0, ms: 0,
             r: location.hash.replace(/^#/, '') }]
  };
  tstExploreBar();
}

function tstExploreBar() {
  var old = document.getElementById('tst-bar'); if (old) old.remove();
  var x = tstState.explore;
  var bar = document.createElement('div');
  bar.id = 'tst-bar'; bar.className = 'tst-ui tst-bar';
  bar.innerHTML = '<span class="tst-grip">\u22EE\u22EE</span>' +
    '<b>' + (x.wf ? tstEsc(x.wf.name) : 'Exploring') + '</b>' +
    '<span id="tst-bar-count">' + x.path.length + ' screens \u00B7 ' + x.clicks + ' clicks</span>' +
    (x.wf
      ? '<button class="tst-chip" onclick="tstShowTask()">Task</button>' +
        '<button class="tst-chip" onclick="tstExploreDone(\'completed\')">I found it</button>' +
        '<button class="tst-chip" onclick="tstExploreDone(\'abandoned\')">Give up</button>'
      : '<button class="tst-chip" onclick="tstExploreDone()">I\u2019m done</button>');
  document.body.appendChild(bar);
  tstBarDraggable(bar);
}

/* Called after every click while exploring, once the DOM has settled */
function tstExploreSample(clickLabel) {
  var x = tstState.explore;
  if (!x) return;
  var now = Date.now();
  var cur = x.path[x.path.length - 1];
  var s = tstScreen();
  if (s.id === cur.s) { cur.clicks++; return; }
  if (x.path.length >= TST_EXPLORE_CAP) { x.truncated = true; return; }
  cur.ms = now - x.tNode;
  x.tNode = now;
  /* Sampled 380ms after the click, so the hash has settled on the NEW
     screen — exactly the route a dashboard node click should jump to. */
  x.path.push({ s: s.id, label: s.label, t: now - x.t0, clicks: 0, ms: 0, via: clickLabel || '',
                r: location.hash.replace(/^#/, '') });
  tstExploreCount();
}

function tstExploreCount() {
  var x = tstState.explore;
  var c = document.getElementById('tst-bar-count');
  if (x && c) c.textContent = x.path.length + ' screens \u00B7 ' + x.clicks + ' clicks';
}

function tstExploreDone(outcome) {
  var x = tstState.explore;
  if (!x) return;
  /* A goal run has a verdict; free roam does not. The tester decides,
     which is the point — there are no checkpoints to decide for them. */
  outcome = x.wf ? (outcome === 'completed' ? 'completed' : 'abandoned') : 'explored';
  if (x.wf && outcome === 'abandoned' &&
      !confirm('Give up on this one? Everywhere you looked is still recorded \u2014 that\u2019s the useful part.')) return;
  x.path[x.path.length - 1].ms = Date.now() - x.tNode;
  tstState.mode = null;
  var bar = document.getElementById('tst-bar'); if (bar) bar.remove();

  tstFetchIP(function (ip) {
    tstPost({
      action: 'addSession',
      mode: 'explore',
      prototype: TST_PROTOTYPE,
      workflow_id: x.wf ? x.wf.id : '',
      user: tstState.user,
      ip: ip || '',
      view: tstCurView(),
      orientation: tstCurOrient(),
      outcome: outcome,
      duration_s: Math.round((Date.now() - x.t0) / 100) / 10,
      steps_total: x.path.length,
      misclicks_total: 0,
      steps_data: x.path
    }, function () {});
  });

  var p = tstPanelShell(outcome === 'abandoned' ? 'No problem \u2014 recorded' : 'Thanks \u2014 that\u2019s recorded');
  p.insertAdjacentHTML('beforeend',
    '<div class="tst-sub">You visited ' + x.path.length + ' screens over ' +
      (Math.round((Date.now() - x.t0) / 100) / 10) + 's. Where you went and what you opened tells us ' +
      'more than any single task could.</div>' +
    (tstState.testing
      ? '<div class="tst-item-row" style="justify-content:flex-end;">' +
        '<button class="tst-cta tst-cta-dark" onclick="tstOpenTesterPanel(\'1\')">Back to tasks</button></div>'
      : ''));
  tstState.explore = null;
}

/* ═══════════════════════════════════════════════════════
   MISCLICK HEAT MAP

   Every misclick has been recorded since the playback feature shipped:
   steps_data[].missed[] holds {cid, text, x, y} where x/y are percent
   of the container's scroll content. That is already a heat map data
   set, so this reads history rather than collecting anything new.

   Coordinates are container-relative AND layout-specific, so points
   are filtered to the view + orientation currently on screen before
   anything is drawn. Pooling a mobile-portrait click with a desktop
   one would put the blob in the wrong place.

   Blobs are stacked translucent radial gradients: overlap darkens
   naturally, so density reads as heat without a canvas.
   ═══════════════════════════════════════════════════════ */

var tstHeat = {
  on: false,
  mode: 'both',     /* 'miss' | 'hit' | 'both' */
  wf: 'all',        /* workflow filter */
  sessions: null,   /* cached raw sessions */
  clusters: {},     /* cid -> [{x,y,n,labels[]}] for the active filter */
  keepAlive: null
};

function tstCurView() {
  return document.body.classList.contains('view-mobile') ? 'mobile'
       : document.body.classList.contains('view-tablet') ? 'tablet' : 'desktop';
}
function tstCurOrient() {
  return document.body.classList.contains('orient-landscape') ? 'landscape' : 'portrait';
}

/* Desktop has no orientation, so it matches on view alone. Older
   sessions predating the orientation column come through blank and
   are kept rather than silently dropped. */
function tstHeatSessionMatches(s) {
  if (String(s.view || 'desktop') !== tstCurView()) return false;
  if (tstCurView() === 'desktop') return true;
  var o = String(s.orientation || '');
  return !o || o === tstCurOrient();
}

/* Grid-bucket the points so 40 clicks on one button become one hot
   blob with n=40 instead of 40 identical blobs. 1.6% of the container
   is roughly a button's worth at typical prototype sizes. */
var TST_HEAT_CELL = 1.6;

function tstHeatAdd(out, cid, x, y, label) {
  if (typeof x !== 'number' || typeof y !== 'number') return;
  cid = cid || 'phone';
  var key = Math.round(x / TST_HEAT_CELL) + ':' + Math.round(y / TST_HEAT_CELL);
  var bucket = (out[cid] = out[cid] || {});
  var c = bucket[key];
  if (!c) c = bucket[key] = { x: 0, y: 0, n: 0, labels: {} };
  c.x += x; c.y += y; c.n++;
  if (label) c.labels[label] = (c.labels[label] || 0) + 1;
}

function tstHeatCollapse(out) {
  var clusters = {};
  Object.keys(out).forEach(function (cid) {
    clusters[cid] = Object.keys(out[cid]).map(function (k) {
      var c = out[cid][k];
      var top = Object.keys(c.labels).sort(function (a, b) { return c.labels[b] - c.labels[a]; })[0] || '';
      return { x: c.x / c.n, y: c.y / c.n, n: c.n, label: top };
    }).sort(function (a, b) { return b.n - a.n; });
  });
  return clusters;
}

function tstHeatBuild() {
  var miss = {}, hit = {};
  var sessions = (tstHeat.sessions || []).filter(tstHeatSessionMatches);
  sessions.forEach(function (s) {
    if (tstHeat.wf !== 'all' && String(s.workflow_id) !== tstHeat.wf) return;
    var steps = s.steps_data;
    if (typeof steps === 'string') { try { steps = JSON.parse(steps); } catch (e) { steps = []; } }
    (steps || []).forEach(function (st) {
      (st.missed || []).forEach(function (m) {
        tstHeatAdd(miss, m.cid, m.x, m.y, m.text);
      });
      /* Correct clicks. Absent on sessions recorded before this shipped,
         which is expected and surfaced in the panel rather than hidden. */
      if (st.hit) tstHeatAdd(hit, st.hit.cid, st.hit.x, st.hit.y, st.label);
    });
  });
  tstHeat.clusters = tstHeatCollapse(miss);
  tstHeat.hits = tstHeatCollapse(hit);
  return tstHeat.clusters;
}

function tstHeatSum(set) {
  set = set || {};
  return Object.keys(set).reduce(function (a, cid) {
    return a + set[cid].reduce(function (b, c) { return b + c.n; }, 0);
  }, 0);
}
function tstHeatTotal() { return tstHeatSum(tstHeat.clusters); }

function tstHeatLive(cid) {
  var el = document.getElementById(cid) || (cid === 'phone' ? document.querySelector('.phone') : null);
  return (el && el.getBoundingClientRect().width > 0) ? el : null;
}

function tstHeatClear() {
  var n = document.querySelectorAll('.tst-heat-layer');
  for (var i = 0; i < n.length; i++) n[i].remove();
}

/* Repaint from scratch. Cheap enough to run on a timer, which is how
   this survives drawers and tabs that re-render their contents and
   wipe anything appended to them — same problem the ping dot has. */
/* Which sets to draw, in z-order: correct underneath, misses on top,
   because the miss is the thing you are looking for. */
function tstHeatActiveSets() {
  var sets = [];
  if (tstHeat.mode !== 'miss') sets.push({ data: tstHeat.hits || {}, cls: 'hit' });
  if (tstHeat.mode !== 'hit') sets.push({ data: tstHeat.clusters || {}, cls: '' });
  return sets;
}

function tstHeatPaint() {
  tstHeatClear();
  if (!tstHeat.on) return;
  var sets = tstHeatActiveSets();

  /* Scale hits and misses independently. Correct clicks outnumber
     misses roughly one per step per tester, so a shared scale would
     flatten the misses into invisibility — which is the opposite of
     what this view is for. */
  sets.forEach(function (set) {
    var m = 1;
    Object.keys(set.data).forEach(function (cid) {
      set.data[cid].forEach(function (c) { if (c.n > m) m = c.n; });
    });
    set.max = m;
  });

  /* One layer per container, holding every active set, so a container
     that re-renders loses and regains all of its heat together. */
  var cids = {};
  sets.forEach(function (set) { Object.keys(set.data).forEach(function (cid) { cids[cid] = 1; }); });

  Object.keys(cids).forEach(function (cid) {
    var live = tstHeatLive(cid);
    if (!live) return;
    if (getComputedStyle(live).position === 'static') live.style.position = 'relative';
    var w = live.scrollWidth, h = live.scrollHeight;
    var layer = document.createElement('div');
    layer.className = 'tst-heat-layer tst-ui';
    layer.setAttribute('data-heat-cid', cid);
    layer.style.width = w + 'px';
    layer.style.height = h + 'px';

    sets.forEach(function (set) {
      (set.data[cid] || []).forEach(function (c) {
        var px = c.x / 100 * w, py = c.y / 100 * h;
        /* Radius grows with sqrt of count so one loud spot cannot swallow
           the whole surface; alpha carries the rest of the signal. */
        var d = Math.min(190, 54 + Math.sqrt(c.n) * 26);
        var blob = document.createElement('div');
        blob.className = 'tst-heat-blob' + (set.cls ? ' ' + set.cls : '');
        blob.style.width = d + 'px';
        blob.style.height = d + 'px';
        blob.style.left = (px - d / 2) + 'px';
        blob.style.top = (py - d / 2) + 'px';
        blob.style.opacity = String(Math.min(1, 0.35 + (c.n / set.max) * 0.65));
        layer.appendChild(blob);

        if (c.n > 1) {
          var pin = document.createElement('div');
          pin.className = 'tst-heat-pin' + (set.cls ? ' ' + set.cls : '');
          pin.style.left = px + 'px';
          pin.style.top = py + 'px';
          pin.textContent = String(c.n);
          layer.appendChild(pin);
        }
      });
    });
    live.appendChild(layer);
  });
}

function tstHeatSetMode(m) {
  tstHeat.mode = m;
  tstHeatRenderPanel();
  if (tstHeat.on) tstHeatPaint();
}

function tstHeatOn() {
  tstHeat.on = true;
  tstHeatBuild();
  tstHeatPaint();
  if (tstHeat.keepAlive) clearInterval(tstHeat.keepAlive);
  tstHeat.keepAlive = setInterval(function () {
    if (!tstHeat.on) { clearInterval(tstHeat.keepAlive); tstHeat.keepAlive = null; return; }
    /* Rebuild if the user flipped viewport pills while heat is showing */
    var sig = tstCurView() + '|' + tstCurOrient();
    if (sig !== tstHeat.sig) { tstHeat.sig = sig; tstHeatBuild(); tstHeatRenderPanel(); }
    tstHeatPaint();
  }, 900);
  tstHeat.sig = tstCurView() + '|' + tstCurOrient();
}

function tstHeatOff() {
  tstHeat.on = false;
  if (tstHeat.keepAlive) { clearInterval(tstHeat.keepAlive); tstHeat.keepAlive = null; }
  tstHeatClear();
}

function tstHeatToggle() {
  if (tstHeat.on) tstHeatOff(); else tstHeatOn();
  tstHeatRenderPanel();
}

function tstHeatSetWf(v) {
  tstHeat.wf = v;
  tstHeatBuild();
  tstHeatRenderPanel();
  if (tstHeat.on) tstHeatPaint();
}

/* Scroll a container into view so its heat is actually on screen */
function tstHeatGoto(cid) {
  var live = tstHeatLive(cid);
  if (!live) { tstToast('\u201C' + cid + '\u201D is not on screen \u2014 open that screen or drawer and the heat appears.'); return; }
  try { live.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
  if (!tstHeat.on) { tstHeatOn(); tstHeatRenderPanel(); }
}

/* ── Panel ── */
function tstOpenHeatPanel() {
  var body = tstDrawerShell('heat');
  body.innerHTML = '<div id="tst-heat-body"><div class="tst-sub">Loading\u2026</div></div>';

  var needWfs = !tstState.workflows.length;
  var loadWfs = needWfs
    ? new Promise(function (res) {
        tstGet('?action=list&prototype=' + encodeURIComponent(TST_PROTOTYPE) + '&all=1', function (r) {
          tstState.workflows = (r.ok && r.workflows) || []; res();
        });
      })
    : Promise.resolve();

  loadWfs.then(function () {
    if (tstHeat.sessions) { tstHeatBuild(); tstHeatRenderPanel(); return; }
    tstGet('?action=results&prototype=' + encodeURIComponent(TST_PROTOTYPE), function (res) {
      tstHeat.sessions = (res.ok && res.sessions) || [];
      tstHeatBuild();
      tstHeatRenderPanel();
    });
  });
}

function tstHeatRenderPanel() {
  var host = document.getElementById('tst-heat-body');
  if (!host) return;

  var missTotal = tstHeatSum(tstHeat.clusters);
  var hitTotal = tstHeatSum(tstHeat.hits);
  var active = tstHeat.mode === 'hit' ? (tstHeat.hits || {}) : (tstHeat.clusters || {});
  var cids = Object.keys(active).sort(function (a, b) {
    var an = active[a].reduce(function (x, c) { return x + c.n; }, 0);
    var bn = active[b].reduce(function (x, c) { return x + c.n; }, 0);
    return bn - an;
  });
  var total = tstHeat.mode === 'hit' ? hitTotal : missTotal;
  var onNow = cids.filter(function (c) { return !!tstHeatLive(c); }).length;

  var wfOpts = '<option value="all"' + (tstHeat.wf === 'all' ? ' selected' : '') + '>All workflows</option>' +
    tstState.workflows.map(function (w) {
      return '<option value="' + tstEsc(w.id) + '"' + (tstHeat.wf === w.id ? ' selected' : '') + '>' + tstEsc(w.name) + '</option>';
    }).join('');

  var html =
    '<div class="tst-sub">Showing <b>' + tstCurView() +
      (tstCurView() === 'desktop' ? '' : ' \u00B7 ' + tstCurOrient()) + '</b>. ' +
      'Misclick positions are layout-specific, so only sessions run on this surface are plotted. ' +
      'Flip the viewport pills to see another one.</div>' +
    '<select class="tst-ta" style="height:auto;padding:6px;font-size:12px;" onchange="tstHeatSetWf(this.value)">' + wfOpts + '</select>' +
    '<div class="tst-heat-seg">' +
      '<button class="' + (tstHeat.mode === 'miss' ? 'on' : '') + '" onclick="tstHeatSetMode(\'miss\')">Misses</button>' +
      '<button class="' + (tstHeat.mode === 'hit' ? 'on' : '') + '" onclick="tstHeatSetMode(\'hit\')">Correct</button>' +
      '<button class="' + (tstHeat.mode === 'both' ? 'on' : '') + '" onclick="tstHeatSetMode(\'both\')">Both</button>' +
    '</div>' +
    '<div class="tst-stat">' +
      '<span style="color:#a8341a;"><b>' + missTotal + '</b> misses</span>' +
      '<span style="color:#16693a;"><b>' + hitTotal + '</b> correct</span>' +
      '<span><b>' + onNow + '</b> on screen</span></div>';

  /* Correct-click positions started being recorded when the heat map
     shipped. Say so plainly rather than letting an empty green layer
     read as \u201cnobody ever got it right.\u201d */
  if (!hitTotal && missTotal) {
    html += '<div class="tst-sub">No correct-click positions on this surface yet. Sessions recorded before the heat map shipped only stored misses \u2014 run one new test and the green layer fills in.</div>';
  }

  if (!missTotal && !hitTotal) {
    html += '<div class="tst-sub">Nothing recorded on this surface yet. Either nobody has tested it, or these sessions ran on a different viewport.</div>';
    host.innerHTML = html;
    return;
  }
  if (!total) {
    html += '<div class="tst-sub">Nothing to show in this mode.</div>';
    host.innerHTML = html;
    return;
  }

  html +=
    '<div class="tst-item-row">' +
    '<button class="tst-chip ' + (tstHeat.on ? 'tst-chip-primary' : '') + '" onclick="tstHeatToggle()">' +
      (tstHeat.on ? 'Hide heat' : 'Show heat') + '</button>' +
    '<button class="tst-chip" onclick="tstHeat.sessions=null;tstOpenHeatPanel();">Refresh</button>' +
    '</div>' +
    '<div class="tst-heat-key">' +
      (tstHeat.mode !== 'hit' ? '<span style="color:#a8341a;">miss</span><span class="tst-heat-ramp"></span>' : '') +
      (tstHeat.mode !== 'miss' ? '<span style="color:#16693a;">correct</span><span class="tst-heat-ramp hit"></span>' : '') +
    '</div>';

  /* Hottest single spots, across containers */
  var flat = [];
  cids.forEach(function (cid) {
    active[cid].forEach(function (c) { flat.push({ cid: cid, c: c }); });
  });
  flat.sort(function (a, b) { return b.c.n - a.c.n; });

  var hotLabel = tstHeat.mode === 'hit' ? 'Most-clicked targets' : 'Hottest misses';
  var nCls = tstHeat.mode === 'hit' ? ' hit' : '';
  html += '<div class="tst-sub" style="margin-top:2px;">' + hotLabel + '</div>';
  html += flat.slice(0, 5).map(function (f) {
    var live = !!tstHeatLive(f.cid);
    return '<div class="tst-heat-row" style="cursor:pointer;" onclick="tstHeatGoto(\'' + tstEsc(f.cid) + '\')">' +
      '<div style="min-width:0;">' +
        '<div style="font-size:12px;color:#171614;">' + tstEsc(f.c.label || '(no label)') + '</div>' +
        '<div class="tst-heat-cid">' + tstEsc(f.cid) + (live ? '' : ' <span class="tst-heat-off">not on screen</span>') + '</div>' +
      '</div>' +
      '<span class="tst-heat-n' + nCls + '">' + f.c.n + '</span></div>';
  }).join('');

  host.innerHTML = html;
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

  if (tstState.mode === 'guide') {
    var gfp = tstFingerprint(e.target);
    if (tstMatches(gfp, tstGuide.steps[tstGuide.idx])) tstGuideAdvance(e);
    return;   /* wrong clicks during a guide are just navigation, not data */
  }

  if (tstState.mode === 'explore') {
    tstState.explore.clicks++;
    tstExploreCount();
    var lbl = tstNorm(e.target.textContent).slice(0, 40);
    /* Read the screen AFTER the click's own handlers have run and any
       drawer has finished opening, or every transition is attributed
       to the screen the tester just left. */
    setTimeout(function () { tstExploreSample(lbl); }, 380);
    return;
  }

  if (tstState.mode === 'run') {
    var steps = tstWfSteps(tstState.run.wf);
    var fp = tstFingerprint(e.target);
    if (tstMatches(fp, steps[tstState.run.idx])) { tstAdvance(e); return; }
    tstState.run.misclicks++; tstState.run.stepMis++;
    if (tstState.run.stepMissed.length < 25) {   /* cap so steps_data can't bloat */
      var mp = tstClickPos(e);
      mp.text = fp.text.slice(0, 40);
      tstState.run.stepMissed.push(mp);
    }
  }
}, true);

/* Container-relative click position, as % of the container's scroll
   content. The single source of truth for BOTH misses and hits, so the
   two heat layers are guaranteed to sit in the same coordinate space. */
function tstClickPos(e, target) {
  var c = tstContainerOf(target || e.target);
  var r = c.getBoundingClientRect();
  return {
    cid: c.id || 'phone',
    x: Math.round(((e.clientX - r.left + c.scrollLeft) / Math.max(c.scrollWidth, 1)) * 1000) / 10,
    y: Math.round(((e.clientY - r.top + c.scrollTop) / Math.max(c.scrollHeight, 1)) * 1000) / 10,
    /* The hash at click time — this listener runs in the capture phase,
       before the click's own handlers can navigate, so this is the
       screen the tester was on when they clicked. Lets the dashboard
       build ?jump= links instead of replaying the whole path. */
    route: location.hash.replace(/^#/, '')
  };
}

/* ── Location ping ──
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

/* ── Auto-walk to a misclick: the page blurs while the tester's own
   completed steps are replayed as clicks (the path IS what opens the
   right drawers and menus), then the veil lifts and the dot appears.
   If any step can't be auto-resolved, the veil lifts and the guided
   bar takes over from exactly that point — you click, it advances. ── */
var tstGuide = null;   /* {wf, steps, idx, ping:{spec,label}} */

function tstVeil(msg) {
  /* The walk's veil is a direct continuation of the boot veil — hand
     over rather than stack two blurs. */
  if (msg !== null && window.bootVeilLift) window.bootVeilLift();
  var v = document.getElementById('tst-veil');
  if (msg === null) { if (v) v.remove(); return; }
  if (!v) {
    v = document.createElement('div');
    v.id = 'tst-veil'; v.className = 'tst-veil tst-ui';
    v.innerHTML = '<div class="tst-veil-msg" id="tst-veil-msg"></div>' +
      '<button class="tst-chip" style="background:#fff;" onclick="tstVeil(null);tstGuideCancel();">Cancel</button>';
    document.body.appendChild(v);
  }
  document.getElementById('tst-veil-msg').textContent = msg;
}

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

function tstStartGuide(wfId, uptoStep, spec, label) {
  tstGet('?action=list&prototype=' + encodeURIComponent(TST_PROTOTYPE) + '&all=1', function (res) {
    var wf = ((res.ok && res.workflows) || []).find(function (w) { return w.id === wfId; });
    if (!wf) { tstPlacePing(spec, label); return; }
    var steps = tstWfSteps(wf).slice(0, uptoStep);
    if (!steps.length) { tstPlacePing(spec, label); return; }

    var ping = { spec: spec, label: label };
    tstVeil('Taking you to the spot the tester clicked\u2026');
    var i = 0;
    (function next() {
      if (document.getElementById('tst-veil') === null) return;   /* cancelled */
      if (i >= steps.length) {
        tstVeil(null);
        setTimeout(function () { tstPlacePing(spec, label); }, 600);   /* let the last click settle */
        return;
      }
      /* Steps often target elements the PREVIOUS click creates —
         confirm overlays, buttons that appear after entering a mode.
         A single immediate lookup fails on any render slower than the
         inter-step delay and dumps the walk on the human. So: poll for
         the element up to ~4.5s. The guided hand-off stays, but only
         for elements that genuinely never materialise. */
      tstVeil('Walking the tester\u2019s path \u2014 step ' + (i + 1) + ' of ' + steps.length + '\u2026');
      var attempts = 0;
      (function resolve() {
        if (document.getElementById('tst-veil') === null) return;   /* cancelled mid-wait */
        var el = tstResolveStep(steps[i]);
        if (el) {
          el.click();
          i++;
          setTimeout(next, 800);
          return;
        }
        attempts++;
        if (attempts > 15) {
          /* ~4.5s and it never appeared — this one really does need a
             human (renamed element, state the replay can't recreate). */
          tstVeil(null);
          tstState.mode = 'guide';
          tstGuide = { wf: wf, steps: steps, idx: i, ping: ping };
          tstGuideBar();
          return;
        }
        setTimeout(resolve, 300);
      })();
    })();
  });
}

function tstGuideBar() {
  var old = document.getElementById('tst-bar'); if (old) old.remove();
  var g = tstGuide;
  var next = g.steps[g.idx];
  var bar = document.createElement('div');
  bar.id = 'tst-bar'; bar.className = 'tst-ui tst-bar';
  bar.innerHTML = '<b>Finish the path</b>' +
    '<span id="tst-bar-count">' + (g.idx + 1) + ' of ' + g.steps.length +
    ' \u2014 click \u201C' + tstEsc(next.text || next.eid || 'next step') + '\u201D</span>' +
    '<button class="tst-chip" onclick="tstGuideCancel()">Cancel</button>';
  document.body.appendChild(bar);
}

function tstGuideCancel() {
  tstState.mode = null; tstGuide = null;
  var b = document.getElementById('tst-bar'); if (b) b.remove();
  tstToast(null);
}

function tstGuideAdvance(e) {
  var g = tstGuide;
  g.idx++;
  var flash = document.createElement('div');
  flash.className = 'tst-flash';
  flash.style.left = e.clientX + 'px'; flash.style.top = e.clientY + 'px';
  document.body.appendChild(flash);
  setTimeout(function () { flash.remove(); }, 550);
  if (g.idx >= g.steps.length) {
    var ping = g.ping;
    tstGuideCancel();
    setTimeout(function () { tstPlacePing(ping.spec, ping.label); }, 600);   /* let the last click's UI settle */
    return;
  }
  tstGuideBar();
}

function tstPing(spec, view, orient, label, wfId, uptoStep) {
  try {
    if (view && typeof setView === 'function') setView(view);
    if (view && view !== 'desktop' && orient && typeof setOrientation === 'function') setOrientation(view, orient);
  } catch (e) {}

  if (wfId && uptoStep > 0) {
    setTimeout(function () { tstStartGuide(wfId, uptoStep, spec, label); }, 700);
    return;
  }
  tstPlacePing(spec, label);
}

function tstPlacePing(spec, label) {
  var parts = spec.split(',');
  var cid = parts[0], x = parseFloat(parts[1]) || 0, y = parseFloat(parts[2]) || 0;
  var tries = 0;
  var timer = setInterval(function () {
    tries++;
    var container = document.getElementById(cid) || (cid === 'phone' ? document.querySelector('.phone') : null);
    var visible = container && container.getBoundingClientRect().width > 0;
    if (!visible) {
      if (tries === 3) {
        if (window.bootVeilLift) window.bootVeilLift();   /* waiting on the USER now — show them the screen */
        tstToast('Looking for "' + cid + '" \u2014 open the screen or drawer where it lives and the ping will appear.');
      }
      if (tries > 60) { clearInterval(timer); if (window.bootVeilLift) window.bootVeilLift(); tstToast('Could not find "' + cid + '" \u2014 it may have been renamed since this test ran.'); }
      return;
    }
    clearInterval(timer);
    if (window.bootVeilLift) window.bootVeilLift();   /* the spot is on screen — reveal it */
    tstToast(label ? 'They clicked: \u201C' + label + '\u201D \u2014 tap the dot to dismiss' : null);

    /* Freshly opened drawers often re-render their contents right after
       appearing, which wipes anything appended to them — including this
       dot. So: let the container settle first, then keep the dot alive
       by re-appending it if a render pass destroys it. */
    var dismissed = false;
    function placeDot() {
      var live = document.getElementById(cid) || (cid === 'phone' ? document.querySelector('.phone') : null);
      if (!live) return;
      if (getComputedStyle(live).position === 'static') live.style.position = 'relative';
      var px = x / 100 * live.scrollWidth;
      var py = y / 100 * live.scrollHeight;
      var dot = document.createElement('div');
      dot.className = 'tst-ping tst-ui';
      dot.id = 'tst-ping-dot';
      dot.style.left = px + 'px';
      dot.style.top = py + 'px';
      dot.title = label || '';
      dot.addEventListener('click', function () {
        dismissed = true; dot.remove(); tstToast(null);
        try { window.close(); } catch (e) {}   /* closes when opened from the dashboard; harmless otherwise */
      });
      live.appendChild(dot);
      try {
        live.scrollTo({ left: Math.max(0, px - live.clientWidth / 2),
                        top: Math.max(0, py - live.clientHeight / 2), behavior: 'smooth' });
      } catch (e) {}
    }
    setTimeout(function () {
      placeDot();
      var guard = 0;
      var keepAlive = setInterval(function () {
        guard++;
        if (dismissed || guard > 20) { clearInterval(keepAlive); return; }   /* ~10s of protection */
        if (!document.getElementById('tst-ping-dot')) placeDot();
      }, 500);
    }, 500);
  }, 700);
}

/* ── Heat deep link — ?heat=1&hv=view&ho=orientation&hw=workflowId&hm=mode
   Opened from the dashboard so a friction row goes straight to the
   heat, on the right viewport, without hunting for the Test button. ── */
function tstHeatDeepLink(view, orient, wfId, mode) {
  try {
    if (view && typeof setView === 'function') setView(view);
    if (view && view !== 'desktop' && orient && typeof setOrientation === 'function') setOrientation(view, orient);
  } catch (e) {}
  tstHeat.wf = wfId || 'all';
  tstHeat.mode = (mode === 'hit' || mode === 'miss') ? mode : 'both';
  /* Let the viewport change settle before measuring containers, or the
     blobs get placed against the old layout's scroll dimensions. */
  setTimeout(function () {
    tstOpenHeatPanel();
    var tries = 0;
    var wait = setInterval(function () {
      tries++;
      if (tstHeat.sessions) {
        clearInterval(wait);
        tstHeatBuild();
        tstHeatOn();
        tstHeatRenderPanel();
      } else if (tries > 40) { clearInterval(wait); }
    }, 200);
  }, 800);
}

/* ── Boot ── */
function tstBoot() {
  var url = new URL(location.href);
  var heat = url.searchParams.get('heat');
  if (heat) {
    tstMountButton();
    setTimeout(function () {
      tstHeatDeepLink(url.searchParams.get('hv') || '', url.searchParams.get('ho') || '',
        url.searchParams.get('hw') || 'all', url.searchParams.get('hm') || 'both');
    }, 400);
    return;
  }
  var ping = url.searchParams.get('ping');
  if (ping) {
    if (url.searchParams.get('jump')) {
      /* Route-carrying link: router.js consumes ?jump and drives the UI
         there. Routes restore NAVIGATION state (page, drawer, tab) but
         not FLOW state — a misclick inside a confirm dialog or error
         overlay has a container that only exists mid-flow. So: give the
         router time to land, poll briefly for the container, and if it
         never appears hand off to the auto-walk, which replays the
         tester's own clicks — the thing that opens those modals. */
      setTimeout(function () {
        var cid = ping.split(',')[0];
        var pt  = url.searchParams.get('pt') || '';
        var wf  = url.searchParams.get('wf') || null;
        var st  = parseInt(url.searchParams.get('st') || '0', 10) || 0;
        var tries = 0;
        var probe = setInterval(function () {
          tries++;
          var c = document.getElementById(cid) || (cid === 'phone' ? document.querySelector('.phone') : null);
          if (c && c.getBoundingClientRect().width > 0) {
            clearInterval(probe);
            tstPlacePing(ping, pt);
          } else if (tries > 8) {          /* ~4s — the router has landed; this container needs the flow */
            clearInterval(probe);
            if (wf && st > 0) tstStartGuide(wf, st, ping, pt);
            else tstPlacePing(ping, pt);   /* no path to replay — long poll + honest toast */
          }
        }, 500);
      }, 900);
    } else {
      /* Legacy link (pre-route sessions): view-set + auto-walk replay. */
      setTimeout(function () {
        tstPing(ping, url.searchParams.get('pv') || '', url.searchParams.get('po') || '',
          url.searchParams.get('pt') || '', url.searchParams.get('wf') || null,
          parseInt(url.searchParams.get('st') || '0', 10) || 0);
      }, 400);   /* let the app's own boot finish first */
    }
  }
  if (url.searchParams.get('explore')) { tstEnterTestMode('explore'); return; }
  var t = url.searchParams.get('test');
  if (t) { tstEnterTestMode(t); return; }
  tstMountButton();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tstBoot);
else tstBoot();
