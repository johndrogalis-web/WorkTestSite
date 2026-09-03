/* ═══════════════════════════════════════════════════════════════════
   Workflow Testing — POST-TASK QUESTIONS

   Loads AFTER testing.js and adds nothing to it. Three jobs:

     author   a Questions chip on every workflow card opens an editor:
              pull from a canned UX-research set, pull from the saved
              library, or write your own (optionally saving it)
     ask      the tester answers after the run, before the result posts
     store    answers ride in the addSession payload's `answers` field

   WHY A SEPARATE FILE
   testing.js is 2500 lines of working recorder, runner, results and
   heat map. Questions touch three moments in it and nothing else, so
   this wraps those three moments instead of editing them. Rolling the
   feature back is deleting one script tag.

   WHERE QUESTIONS LIVE
   On the workflow's meta checkpoint — checkpoints[0].questions — which
   is already stored as one JSON blob. No Workflows schema change, no
   migration, and tstWfSteps() still ignores it because it filters on
   `meta`. A workflow authored before this existed simply has no
   `questions` key and behaves exactly as it did.

   HOW THE ASK IS INTERCEPTED
   One override on tstPost. Every session in the system — guided run,
   goal run, free roam — ends by posting {action:'addSession'}, so that
   single call is the only place this needs to stand. tstComplete and
   tstExploreDone are untouched and do not know this file exists.

   The two of them ARE wrapped, but only to remember which workflow was
   running: both null out tstState.run / tstState.explore synchronously,
   while the post fires later from the IP callback. By then the answer
   to "which workflow was this" is already gone.

   IF THE TESTER CLOSES THE TAB
   Holding the post until the questions are answered means an abandoned
   panel would take the whole session with it. `pagehide` fires a
   sendBeacon with whatever has been collected so far, so the worst case
   is a session with partial answers rather than no session at all.

   AUTHORING ENTRY POINT
   Questions are added to a workflow that already exists, not while
   recording one. Recording is a hands-on, click-through act and a
   survey builder in the middle of it is the wrong shape — and this way
   every workflow already in the sheet can have questions without being
   re-recorded.
   ═══════════════════════════════════════════════════════════════════ */

/* ── The canned set ──
   Deliberately NOT in the spreadsheet. These version with the code, so
   every prototype gets the same starters on day one with no seed step
   and no round trip. The sheet's Questions tab holds only what a human
   chose to save.

   SEQ first because it is the one post-task measure with published
   norms behind it: a 7-point scale, and a mean below ~5.5 marks a task
   worth looking at. The rest are the standard companions — confidence
   catches people who finished but are not sure they did, expectation
   catches tasks that were fine but felt wrong, and the open pair is
   where the actual design note usually comes from. */
var TST_Q_PRESETS = [
  { q: 'Overall, how difficult or easy was this task?',
    type: 'scale', options: { min: 1, max: 7, minLabel: 'Very difficult', maxLabel: 'Very easy' } },
  { q: 'How confident are you that you completed it correctly?',
    type: 'scale', options: { min: 1, max: 5, minLabel: 'Not at all', maxLabel: 'Completely' } },
  { q: 'Was this easier or harder than you expected?',
    type: 'choice', options: ['Much harder', 'Harder', 'About what I expected', 'Easier', 'Much easier'] },
  { q: 'How likely would you be to use this in your day to day?',
    type: 'scale', options: { min: 1, max: 5, minLabel: 'Never', maxLabel: 'Every day' } },
  { q: 'What, if anything, was confusing?', type: 'text', options: null },
  { q: 'If you could change one thing about this screen, what would it be?', type: 'text', options: null },
  { q: 'Where did you look first?', type: 'text', options: null }
];

var TST_Q_TYPES = ['scale', 'choice', 'text'];

var tstQDraft = null;      /* { wfId, wfName, items[], lib[] } while editing */
var tstQLastWf = null;     /* workflow of the run that just ended */
var tstQFlight = null;     /* payload held while the tester answers */

/* ── Styles ── */
(function () {
  var css = [
    '.tst-q-block{border:1px solid rgba(0,0,0,0.1);border-radius:10px;padding:10px;display:flex;',
    '  flex-direction:column;gap:8px;background:#fff;}',
    '.tst-q-text{font-size:12.5px;font-weight:600;color:#171614;line-height:1.35;}',
    '.tst-q-scale{display:flex;gap:5px;}',
    '.tst-q-scale button{flex:1;border:1px solid rgba(0,0,0,0.18);background:#fff;border-radius:8px;',
    '  padding:8px 0;font-family:inherit;font-size:12.5px;font-weight:600;color:#3f3c38;cursor:pointer;}',
    '.tst-q-scale button:hover{background:#f2f0ee;}',
    '.tst-q-scale button.on{background:#171614;color:#fff;border-color:#171614;}',
    '.tst-q-ends{display:flex;justify-content:space-between;font-size:10.5px;color:#8a8d94;}',
    '.tst-q-choices{display:flex;flex-direction:column;gap:5px;}',
    '.tst-q-choices button{text-align:left;border:1px solid rgba(0,0,0,0.18);background:#fff;',
    '  border-radius:8px;padding:8px 10px;font-family:inherit;font-size:12.5px;color:#3f3c38;cursor:pointer;}',
    '.tst-q-choices button:hover{background:#f2f0ee;}',
    '.tst-q-choices button.on{background:#171614;color:#fff;border-color:#171614;}',
    '.tst-q-ta{width:100%;box-sizing:border-box;font-family:inherit;font-size:12.5px;resize:vertical;',
    '  min-height:62px;border:1px solid rgba(0,0,0,0.18);border-radius:8px;padding:7px 9px;outline:none;}',
    '.tst-q-count{font-size:11px;color:#8a8d94;}',
    /* Editor */
    '.tst-q-row{display:flex;align-items:flex-start;gap:8px;border:1px solid rgba(0,0,0,0.1);',
    '  border-radius:10px;padding:8px 10px;background:#fff;}',
    '.tst-q-row .tst-q-grab{color:#b3b0ac;font-size:13px;line-height:1.4;cursor:default;}',
    '.tst-q-row-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}',
    '.tst-q-row-t{font-size:12px;color:#171614;line-height:1.35;}',
    '.tst-q-row-m{font-size:10.5px;color:#8a8d94;}',
    '.tst-q-row-btns{display:flex;gap:3px;flex:0 0 auto;}',
    '.tst-q-mini{border:1px solid rgba(0,0,0,0.15);background:#fff;border-radius:6px;width:22px;height:22px;',
    '  font-size:11px;line-height:1;color:#555;cursor:pointer;font-family:inherit;padding:0;}',
    '.tst-q-mini:hover{background:#f2f0ee;}',
    '.tst-q-mini:disabled{opacity:0.35;cursor:default;}',
    '.tst-q-lib{display:flex;flex-direction:column;gap:5px;}',
    '.tst-q-pick{text-align:left;border:1px dashed rgba(0,0,0,0.2);background:#fbfaf9;border-radius:8px;',
    '  padding:7px 10px;font-family:inherit;font-size:11.5px;color:#3f3c38;cursor:pointer;line-height:1.35;}',
    '.tst-q-pick:hover{background:#f2f0ee;border-style:solid;}',
    '.tst-q-pick:disabled{opacity:0.4;cursor:default;}',
    '.tst-q-pick .k{font-size:10px;color:#8a8d94;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;}',
    '.tst-q-sec{font-size:11px;font-weight:600;color:#171614;margin-top:2px;}',
    '.tst-q-chk{display:flex;align-items:center;gap:6px;font-size:11.5px;color:#3f3c38;}',
    '.tst-q-chk input{margin:0;}'
  ].join('');
  var s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);
})();

/* ── Model helpers ── */

function tstQMeta(wf) {
  return (wf && wf.checkpoints && wf.checkpoints[0] && wf.checkpoints[0].meta) ? wf.checkpoints[0] : null;
}

/* Always an array, always of the normalized shape, so nothing
   downstream has to guard against a half-written question. */
function tstQOf(wf) {
  var m = tstQMeta(wf);
  var raw = (m && Array.isArray(m.questions)) ? m.questions : [];
  return raw.map(tstQNorm).filter(function (x) { return !!x.q; });
}

function tstQNorm(x) {
  var type = (x && TST_Q_TYPES.indexOf(x.type) !== -1) ? x.type : 'text';
  var o = x ? x.options : null;
  if (type === 'scale') {
    o = o && typeof o === 'object' ? o : {};
    o = { min: Number(o.min) || 1, max: Number(o.max) || 5,
          minLabel: String(o.minLabel || ''), maxLabel: String(o.maxLabel || '') };
    if (o.max <= o.min) o.max = o.min + 4;
  } else if (type === 'choice') {
    o = Array.isArray(o) ? o.map(String).filter(Boolean) : [];
    if (!o.length) { type = 'text'; o = null; }
  } else {
    o = null;
  }
  return { q: String((x && x.q) || '').trim(), type: type, options: o };
}

function tstQTypeLabel(x) {
  if (x.type === 'scale') return 'Scale ' + x.options.min + '\u2013' + x.options.max;
  if (x.type === 'choice') return x.options.length + ' choices';
  return 'Open text';
}

/* ═══════════════════════════════════════════════════════
   AUTHORING
   ═══════════════════════════════════════════════════════ */

/* Add a Questions chip to every workflow card without reaching into
   tstWfCard's markup: render the original, then splice one button into
   its action row. Goals and archived workflows get it too — an
   archived task still holds data worth explaining. */
(function () {
  var orig = window.tstWfCard;
  if (typeof orig !== 'function') return;
  window.tstWfCard = function (wf) {
    var html = orig.apply(this, arguments);
    var n = tstQOf(wf).length;
    var chip = '<button class="tst-chip" onclick="tstQEdit(\'' + tstEsc(wf.id) + '\')">' +
      (n ? 'Questions \u00B7 ' + n : 'Questions') + '</button>';
    /* The action row is the last tst-item-row in the card */
    var i = html.lastIndexOf('</div></div>');
    return i === -1 ? html : html.slice(0, i) + chip + html.slice(i);
  };
})();

function tstQEdit(wfId) {
  var wf = (tstState.workflows || []).find(function (w) { return String(w.id) === String(wfId); });
  if (!wf) { alert('Workflow not found \u2014 reopen the panel and try again.'); return; }
  tstQDraft = { wfId: wf.id, wfName: wf.name, items: tstQOf(wf), lib: null };
  tstQRender();
  /* Library is a nice-to-have, so it loads after the editor paints
     rather than holding it up. */
  tstGet('?action=questions&prototype=' + encodeURIComponent(TST_PROTOTYPE), function (res) {
    if (!tstQDraft) return;
    tstQDraft.lib = (res.ok && res.questions) ? res.questions.map(function (r) {
      return { id: r.id, q: String(r.text || ''), type: r.type, options: r.options };
    }).map(function (x) { var n = tstQNorm(x); n.id = x.id; return n; }).filter(function (x) { return !!x.q; })
      : [];
    tstQRenderLib();
  });
}

function tstQRender() {
  var d = tstQDraft;
  var body = tstDrawerShell('workflows');
  body.innerHTML =
    '<div class="tst-item-row"><button class="tst-chip" onclick="tstQCancel()">\u2190 Back</button></div>' +
    '<div class="tst-dr-formtitle">Questions</div>' +
    '<div class="tst-sub">Asked once, after the run, before the result is saved. ' +
      'Keep it to three or four \u2014 a long survey after a two-minute task is how you get blank answers. ' +
      'Applies to: <b>' + tstEsc(d.wfName) + '</b></div>' +
    '<div id="tst-q-items"></div>' +
    '<div class="tst-q-sec">Add from the standard set</div>' +
    '<div class="tst-q-lib" id="tst-q-presets"></div>' +
    '<div class="tst-q-sec">Your saved questions</div>' +
    '<div class="tst-q-lib" id="tst-q-saved"><div class="tst-sub">Loading\u2026</div></div>' +
    '<div class="tst-q-sec">Write your own</div>' +
    '<textarea class="tst-ta" id="tst-q-new" placeholder="Ask it the way you would say it out loud"></textarea>' +
    '<select class="tst-input" id="tst-q-newtype" onchange="tstQNewType()">' +
      '<option value="text">Open text</option>' +
      '<option value="scale">Rating scale</option>' +
      '<option value="choice">Pick one</option>' +
    '</select>' +
    '<div id="tst-q-newopts"></div>' +
    '<label class="tst-q-chk"><input type="checkbox" id="tst-q-save" checked>' +
      '<span>Save to the library for future tests</span></label>' +
    '<div class="tst-item-row"><button class="tst-chip" onclick="tstQAddCustom(this)">+ Add question</button></div>' +
    '<div class="tst-err" id="tst-q-err" style="display:none;"></div>' +
    '<div class="tst-item-row" style="justify-content:flex-end;">' +
      '<button class="tst-cta tst-cta-quiet" onclick="tstQCancel()">Cancel</button>' +
      '<button class="tst-cta tst-cta-dark" onclick="tstQSaveWf(this)">Save questions</button></div>';
  tstQRenderItems();
  tstQRenderLib();
  tstQNewType();
}

function tstQCancel() { tstQDraft = null; tstOpenAdminPanel(); }

function tstQRenderItems() {
  var host = document.getElementById('tst-q-items');
  if (!host) return;
  var items = tstQDraft.items;
  if (!items.length) {
    host.innerHTML = '<div class="tst-sub">No questions yet. This workflow ends the way it does today, ' +
      'with the thank-you panel and nothing asked.</div>';
    return;
  }
  host.innerHTML = items.map(function (x, i) {
    return '<div class="tst-q-row">' +
      '<span class="tst-q-grab">' + (i + 1) + '.</span>' +
      '<span class="tst-q-row-main"><span class="tst-q-row-t">' + tstEsc(x.q) + '</span>' +
      '<span class="tst-q-row-m">' + tstQTypeLabel(x) + '</span></span>' +
      '<span class="tst-q-row-btns">' +
        '<button class="tst-q-mini" onclick="tstQMove(' + i + ',-1)"' + (i === 0 ? ' disabled' : '') + '>\u2191</button>' +
        '<button class="tst-q-mini" onclick="tstQMove(' + i + ',1)"' + (i === items.length - 1 ? ' disabled' : '') + '>\u2193</button>' +
        '<button class="tst-q-mini" onclick="tstQRemove(' + i + ')">\u00D7</button>' +
      '</span></div>';
  }).join('');
}

/* A question already on the workflow is greyed rather than hidden, so
   the standard set stays in the same order every time you open this. */
function tstQRenderLib() {
  var have = {};
  tstQDraft.items.forEach(function (x) { have[x.q.toLowerCase()] = 1; });

  var pre = document.getElementById('tst-q-presets');
  if (pre) {
    pre.innerHTML = TST_Q_PRESETS.map(function (x, i) {
      var on = have[x.q.toLowerCase()];
      return '<button class="tst-q-pick" onclick="tstQAddPreset(' + i + ')"' + (on ? ' disabled' : '') + '>' +
        '<span class="k">' + tstQTypeLabel(tstQNorm(x)) + (on ? ' \u00B7 added' : '') + '</span><br>' + tstEsc(x.q) + '</button>';
    }).join('');
  }

  var sav = document.getElementById('tst-q-saved');
  if (!sav) return;
  if (tstQDraft.lib === null) { sav.innerHTML = '<div class="tst-sub">Loading\u2026</div>'; return; }
  if (!tstQDraft.lib.length) {
    sav.innerHTML = '<div class="tst-sub">Nothing saved yet. Anything you write below with the box ticked shows up here next time.</div>';
    return;
  }
  sav.innerHTML = tstQDraft.lib.map(function (x, i) {
    var on = have[x.q.toLowerCase()];
    return '<button class="tst-q-pick" onclick="tstQAddSaved(' + i + ')"' + (on ? ' disabled' : '') + '>' +
      '<span class="k">' + tstQTypeLabel(x) + (on ? ' \u00B7 added' : '') + '</span><br>' + tstEsc(x.q) + '</button>';
  }).join('');
}

function tstQAddPreset(i) { tstQPush(tstQNorm(TST_Q_PRESETS[i])); }
function tstQAddSaved(i)  { tstQPush(tstQNorm(tstQDraft.lib[i])); }

function tstQPush(x) {
  if (!x.q) return;
  var dup = tstQDraft.items.some(function (y) { return y.q.toLowerCase() === x.q.toLowerCase(); });
  if (dup) return;
  tstQDraft.items.push(x);
  tstQRenderItems();
  tstQRenderLib();
}

function tstQMove(i, dir) {
  var a = tstQDraft.items, j = i + dir;
  if (j < 0 || j >= a.length) return;
  var t = a[i]; a[i] = a[j]; a[j] = t;
  tstQRenderItems();
}

function tstQRemove(i) {
  tstQDraft.items.splice(i, 1);
  tstQRenderItems();
  tstQRenderLib();
}

/* The options editor only exists for the types that need one, so the
   form is two fields for the common case and grows when asked. */
function tstQNewType() {
  var t = document.getElementById('tst-q-newtype');
  var host = document.getElementById('tst-q-newopts');
  if (!t || !host) return;
  if (t.value === 'scale') {
    host.innerHTML =
      '<div class="tst-item-row">' +
        '<select class="tst-input" id="tst-q-max" style="flex:1;">' +
          '<option value="5">1 to 5</option><option value="7">1 to 7</option><option value="10">1 to 10</option>' +
        '</select></div>' +
      '<div class="tst-item-row">' +
        '<input class="tst-input" id="tst-q-lo" placeholder="Label for the low end" style="flex:1;">' +
        '<input class="tst-input" id="tst-q-hi" placeholder="Label for the high end" style="flex:1;"></div>';
  } else if (t.value === 'choice') {
    host.innerHTML = '<textarea class="tst-ta" id="tst-q-opts" placeholder="One option per line"></textarea>';
  } else {
    host.innerHTML = '';
  }
}

function tstQAddCustom(btn) {
  var err = document.getElementById('tst-q-err');
  var text = (document.getElementById('tst-q-new').value || '').trim();
  if (!text) { err.textContent = 'Type the question first.'; err.style.display = 'block'; return; }
  var type = document.getElementById('tst-q-newtype').value;
  var options = null;
  if (type === 'scale') {
    options = { min: 1, max: Number(document.getElementById('tst-q-max').value) || 5,
                minLabel: (document.getElementById('tst-q-lo').value || '').trim(),
                maxLabel: (document.getElementById('tst-q-hi').value || '').trim() };
  } else if (type === 'choice') {
    options = (document.getElementById('tst-q-opts').value || '').split('\n')
      .map(function (s) { return s.trim(); }).filter(Boolean);
    if (options.length < 2) { err.textContent = 'A pick-one question needs at least two options.'; err.style.display = 'block'; return; }
  }
  err.style.display = 'none';
  var item = tstQNorm({ q: text, type: type, options: options });
  tstQPush(item);

  document.getElementById('tst-q-new').value = '';
  tstQNewType();

  if (!document.getElementById('tst-q-save').checked) return;
  /* Saving to the library is a side errand: the question is already on
     the workflow whether or not this write lands, so a failure is a
     toast and not an error state. */
  btn.disabled = true;
  tstPost({ action: 'addQuestion', prototype: TST_PROTOTYPE, text: item.q,
            type: item.type, options: item.options, author: '' }, function (res) {
    btn.disabled = false;
    if (!res.ok) { tstToast('Saved to this test, but not to the library'); return; }
    if (tstQDraft) {
      var n = tstQNorm(item); n.id = res.id;
      if (!tstQDraft.lib) tstQDraft.lib = [];
      if (!tstQDraft.lib.some(function (x) { return x.q.toLowerCase() === n.q.toLowerCase(); })) tstQDraft.lib.push(n);
      tstQRenderLib();
    }
  });
}

/* Writes the whole checkpoints array back. The meta object is read
   fresh from the workflow and only its `questions` key is replaced, so
   view, orientation, route and login survive untouched. */
function tstQSaveWf(btn) {
  var d = tstQDraft;
  var wf = (tstState.workflows || []).find(function (w) { return String(w.id) === String(d.wfId); });
  if (!wf) { alert('Workflow not found.'); return; }

  var cps = (wf.checkpoints || []).slice();
  var meta = (cps[0] && cps[0].meta) ? cps[0] : null;
  if (!meta) {
    /* Every workflow this system writes has one, but a hand-edited row
       might not. Build the minimum rather than refusing. */
    meta = { meta: 1, view: 'desktop', orientation: 'portrait', route: '', login: false };
    cps.unshift(meta);
  }
  var newMeta = {};
  for (var k in meta) if (Object.prototype.hasOwnProperty.call(meta, k)) newMeta[k] = meta[k];
  if (d.items.length) newMeta.questions = d.items;
  else delete newMeta.questions;
  cps[0] = newMeta;

  btn.disabled = true; btn.innerHTML = '<span class="tst-spin"></span>';
  tstPost({ action: 'updateWorkflow', id: d.wfId, checkpoints: cps }, function (res) {
    if (!res.ok) { alert('Save failed: ' + res.error); btn.disabled = false; btn.textContent = 'Save questions'; return; }
    wf.checkpoints = cps;
    tstQDraft = null;
    tstOpenAdminPanel();
  });
}

/* ═══════════════════════════════════════════════════════
   ASKING
   ═══════════════════════════════════════════════════════ */

/* Both run enders drop their workflow reference before the post fires.
   Catch it on the way in. */
(function () {
  var oc = window.tstComplete, oe = window.tstExploreDone;
  if (typeof oc === 'function') {
    window.tstComplete = function () {
      tstQLastWf = (tstState.run && tstState.run.wf) || null;
      return oc.apply(this, arguments);
    };
  }
  if (typeof oe === 'function') {
    window.tstExploreDone = function () {
      tstQLastWf = (tstState.explore && tstState.explore.wf) || null;
      return oe.apply(this, arguments);
    };
  }
})();

/* The single interception point. Anything that is not a session post
   goes straight through, so the recorder and the library writes never
   touch this path. */
(function () {
  var origPost = window.tstPost;
  if (typeof origPost !== 'function') return;
  window.tstPost = function (payload, cb) {
    if (!payload || payload.action !== 'addSession') return origPost(payload, cb);
    var qs = tstQForSession(payload);
    if (!qs.length) return origPost(payload, cb);

    tstQFlight = payload;
    /* tstFetchIP calls back SYNCHRONOUSLY once the address is warm, and
       it is warmed on entry to test mode. So this runs inside
       tstComplete BEFORE its finish panel has painted. One tick of
       delay lets that panel exist, which is the panel this borrows and
       gives back. */
    setTimeout(function () {
      tstQAsk(qs, function (answers) {
        payload.answers = answers;
        tstQFlight = null;
        origPost(payload, cb);
      });
    }, 0);
  };
})();

function tstQForSession(payload) {
  var wf = tstQLastWf;
  if (!wf && payload.workflow_id) {
    wf = (tstState.workflows || []).find(function (w) { return String(w.id) === String(payload.workflow_id); });
  }
  return wf ? tstQOf(wf) : [];
}

/* Last resort. Not a substitute for answering — a beacon cannot be
   read back or retried — but a session with three blank answers beats
   a session that never existed. */
window.addEventListener('pagehide', function () {
  if (!tstQFlight) return;
  try {
    tstQFlight.answers = tstQCollect(tstQFlight.__qs || []);
    navigator.sendBeacon(TST_API, new Blob([JSON.stringify(tstQFlight)], { type: 'text/plain' }));
  } catch (e) {}
  tstQFlight = null;
});

var tstQAnswers = {};   /* index -> value, for the panel currently open */

function tstQAsk(qs, done) {
  tstQAnswers = {};
  if (tstQFlight) tstQFlight.__qs = qs;

  /* The finish panel has already painted by the time this runs. Keep
     the node rather than its HTML so its inline handlers come back
     intact when the questions are done. */
  var prev = document.getElementById('tst-panel');
  if (prev) prev.remove();

  var p = tstPanelShell('Two quick questions', 1);
  p.insertAdjacentHTML('beforeend',
    '<div class="tst-sub">Answer however you actually felt. There is no right one, and blank is fine.</div>' +
    '<div id="tst-q-ask" style="display:flex;flex-direction:column;gap:10px;"></div>' +
    '<div class="tst-item-row" style="justify-content:space-between;align-items:center;">' +
      '<span class="tst-q-count" id="tst-q-progress"></span>' +
      '<span><button class="tst-cta tst-cta-quiet" onclick="tstQFinish(1)">Skip</button>' +
      '<button class="tst-cta tst-cta-dark" onclick="tstQFinish(0)">Send</button></span></div>');

  /* Header copy should not lie when there are five of them */
  /* The shell's \u00D7 closes the panel without telling anyone. Left as
     built it would swallow the session, since the post is waiting on
     this callback. Dismissing IS skipping. */
  var x = p.querySelector('.tst-x');
  if (x) x.setAttribute('onclick', 'tstQFinish(1)');

  var h = p.querySelector('.tst-h span');
  if (h) h.textContent = qs.length === 1 ? 'One quick question'
       : qs.length === 2 ? 'Two quick questions'
       : qs.length + ' quick questions';

  document.getElementById('tst-q-ask').innerHTML = qs.map(function (x, i) {
    var inner;
    if (x.type === 'scale') {
      var btns = '';
      for (var v = x.options.min; v <= x.options.max; v++) {
        btns += '<button data-v="' + v + '" onclick="tstQPick(' + i + ',' + v + ',this)">' + v + '</button>';
      }
      inner = '<div class="tst-q-scale" data-qi="' + i + '">' + btns + '</div>' +
        ((x.options.minLabel || x.options.maxLabel)
          ? '<div class="tst-q-ends"><span>' + tstEsc(x.options.minLabel) + '</span><span>' + tstEsc(x.options.maxLabel) + '</span></div>'
          : '');
    } else if (x.type === 'choice') {
      inner = '<div class="tst-q-choices" data-qi="' + i + '">' + x.options.map(function (o) {
        return '<button data-v="' + tstEsc(o) + '" onclick="tstQPick(' + i + ',this.getAttribute(\'data-v\'),this)">' + tstEsc(o) + '</button>';
      }).join('') + '</div>';
    } else {
      inner = '<textarea class="tst-q-ta" data-qi="' + i + '" oninput="tstQType(' + i + ',this.value)" placeholder="Type as much or as little as you like"></textarea>';
    }
    return '<div class="tst-q-block"><div class="tst-q-text">' + (i + 1) + '. ' + tstEsc(x.q) + '</div>' + inner + '</div>';
  }).join('');

  tstQProgress(qs);
  tstQDone = function (skipped) {
    var answers = tstQCollect(qs);
    if (prev) document.body.appendChild(prev);
    tstQAnswers = {};
    done(answers);
  };
}

var tstQDone = null;

function tstQFinish(skipped) {
  var f = tstQDone;
  tstQDone = null;
  tstClosePanel();
  if (f) f(skipped);
}

function tstQPick(i, v, btn) {
  tstQAnswers[i] = v;
  var row = btn.parentNode;
  for (var j = 0; j < row.children.length; j++) row.children[j].classList.remove('on');
  btn.classList.add('on');
  tstQProgress();
}

function tstQType(i, v) {
  tstQAnswers[i] = String(v || '').trim();
  tstQProgress();
}

function tstQProgress(qs) {
  var el = document.getElementById('tst-q-progress');
  if (!el) return;
  var n = 0;
  for (var k in tstQAnswers) if (String(tstQAnswers[k]) !== '') n++;
  var total = qs ? qs.length : document.querySelectorAll('#tst-q-ask .tst-q-block').length;
  el.textContent = n + ' of ' + total + ' answered';
}

/* Unanswered questions are recorded as blanks rather than dropped. A
   question nobody answers is a finding, and it only shows up if the
   row is there. */
function tstQCollect(qs) {
  return (qs || []).map(function (x, i) {
    var v = tstQAnswers[i];
    return { q: x.q, type: x.type, a: v === undefined || v === null ? '' : v };
  });
}
