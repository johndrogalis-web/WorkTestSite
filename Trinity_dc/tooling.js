/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  tooling.js — TOOLING bundle (the authoring layer)                         ║
   ║  Prefixes: cmt- (review pins)  rt- (hash router)  tst- (workflow testing)  ║
   ║            vc- (viewport continuity)                                       ║
   ║                                                                            ║
   ║  Not part of the product. This is the layer that reviews, routes and       ║
   ║  tests the prototype, and it is meant to be lifted onto other prototypes   ║
   ║  and, later, into a standalone harness. Straight concatenation of five     ║
   ║  former scripts in their original load order. No code was edited; the      ║
   ║  only additions are comment markers:                                       ║
   ║                                                                            ║
   ║    ▶ APP-SPECIFIC … ◀ END APP-SPECIFIC                                     ║
   ║      wraps every block that knows THIS prototype (route registrations,     ║
   ║      section lists, shell selectors, nav fixes, TST_PROTOTYPE). Cutting    ║
   ║      those blocks into a routes.js that ships with the app leaves a        ║
   ║      portable engine. Everything outside the markers talks to the app      ║
   ║      only through the contract in STRUCTURE.md rule 4.                     ║
   ║                                                                            ║
   ║    1. comments.js             Figma-style review pins + all-comments drawer║
   ║    2. router.js               route registry, rtGoTo, hashchange, ?jump=   ║
   ║    3. testing.js              record / run / explore workflows, heat map   ║
   ║    4. testing-questions.js    post-task questions on top of testing.js     ║
   ║    5. testing-cache.js        cached / delta reads on top of testing.js   ║
   ║                               (new 2026-09-08, pairs with Code.gs since=) ║
   ║    6. app-23-viewport-continuity.js  same screen across frame swaps        ║
   ║                                                                            ║
   ║  Load order: LAST, after sections.js and before the Leaflet CDN tag.       ║
   ║  testdrawer.js strips this file (it used to strip comments.js and          ║
   ║  testing.js by name) so the drawer test runs without network tooling.      ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */



/* ═══ FILE: comments.js ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   Comment Pins — Figma-style review comments for the prototype.
   Backend: Google Apps Script web app writing to a Google Sheet.

   How positioning works (and why comments survive code updates):
   a pin is stored as a percentage of the *scrollable content* of the
   nearest identifiable container (by element id), not of the screen.
   Pins are appended INTO that container, so they scroll with content
   and show/hide with their page automatically. As long as container
   ids stay stable across code changes, pins stay where they were put.
   ═══════════════════════════════════════════════════════════════════ */

var CMT_API = 'https://script.google.com/macros/s/AKfycbymB9TsgS4EkVXe5m-qdpYrFeM6I9qu2kAFJ9pQfb5A5EouEphItXG680AyOb9OwC1DTQ/exec';

var cmtState = {
  mode: false,          /* drop-a-comment mode */
  visible: false,       /* pins hidden by default — the prototype is
                           the thing being reviewed, not the annotation
                           layer. Turn them on from the Comment caret
                           menu, or just arm drop mode. */
  comments: [],
  names: [],
  pending: [],          /* comments whose container isn't in DOM yet */
  bubbleFor: null
};

/* ── Styles ── */
(function () {
  var css = [
    /* Toolbar buttons */
    '.cmt-wrap{display:flex;gap:6px;align-items:center;}',
    '.cmt-btn.cmt-armed{background:#3069e3;color:#fff;border-color:#3069e3;}',
    '.cmt-eye-off svg{opacity:0.4;}',
    /* Crosshair while armed */
    'body.cmt-mode .phone, body.cmt-mode .phone *{cursor:crosshair !important;}',
    /* Pin — Figma-style teardrop: rounded square, sharp bottom-left */
    '.cmt-pin{position:absolute;width:28px;height:28px;margin:-28px 0 0 0;',
    '  border-radius:14px 14px 14px 2px;background:#3069e3;color:#fff;',
    '  align-items:center;justify-content:center;',
    '  font-family:var(--font,sans-serif);font-size:12px;font-weight:600;',
    '  box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:pointer;z-index:9650;',
    '  border:2px solid #fff;user-select:none;}',
    '.cmt-pin.cmt-done{background:#8a8d94;}',
    '.cmt-pin.cmt-done::after{content:"";position:absolute;top:-4px;right:-4px;width:12px;height:12px;',
    '  border-radius:50%;background:#1f9d55;border:2px solid #fff;}',
    /* Fail-safe direction: pins are hidden UNLESS body.cmt-show is
       present. setView() rebuilds body.className from scratch, and any
       future code that does the same now hides the annotation layer
       instead of dumping review pins into a live test. */
    '.cmt-pin{display:none;}',
    'body.cmt-show .cmt-pin{display:flex;}',
    /* Composer + bubble share a card look */
    '.cmt-card{position:absolute;width:260px;background:#fff;border:1px solid rgba(0,0,0,0.12);',
    '  border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,0.22);z-index:9700;',
    '  font-family:var(--font,sans-serif);padding:12px;display:flex;flex-direction:column;gap:8px;}',
    '.cmt-card select,.cmt-card textarea,.cmt-card input{width:100%;box-sizing:border-box;',
    '  font-family:inherit;font-size:12.5px;border:1px solid rgba(0,0,0,0.18);border-radius:8px;',
    '  padding:6px 8px;outline:none;background:#fff;color:#1a1a1a;}',
    '.cmt-card textarea{resize:none;height:64px;}',
    '.cmt-row{display:flex;gap:6px;justify-content:flex-end;}',
    '.cmt-cta{border:none;border-radius:100px;padding:6px 14px;font-size:12px;font-weight:500;cursor:pointer;}',
    '.cmt-cta-post{background:#171614;color:#fff;}',
    '.cmt-cta:disabled{opacity:0.75;cursor:default;}',
    '.cmt-spin{display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,0.35);',
    '  border-top-color:#fff;border-radius:50%;animation:cmtspin 0.7s linear infinite;vertical-align:-2px;}',
    '.cmt-cta-quiet .cmt-spin{border-color:rgba(0,0,0,0.2);border-top-color:#555;}',
    '@keyframes cmtspin{to{transform:rotate(360deg)}}',
    '.cmt-cta-quiet{background:none;color:#555;}',
    '.cmt-meta{font-size:11px;color:#8a8d94;}',
    '.cmt-author{font-size:12.5px;font-weight:600;color:#1a1a1a;}',
    '.cmt-text{font-size:12.5px;color:#333;line-height:1.45;white-space:pre-wrap;word-break:break-word;}',
    '.cmt-err{font-size:11px;color:#c0392b;}',
    '.cmt-hint{position:fixed;top:54px;left:50%;transform:translateX(-50%);z-index:10000;',
    '  background:#171614;color:#fff;font-family:var(--font,sans-serif);font-size:12px;',
    '  padding:7px 14px;border-radius:100px;box-shadow:0 4px 14px rgba(0,0,0,0.3);}'
  ].join('\n');
  var el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
})();

/* ── Server IO — POST body is text/plain on purpose (no CORS preflight) ── */
function cmtGet(cb) {
  fetch(CMT_API + '?action=list')
    .then(function (r) { return r.json(); })
    .then(cb)
    .catch(function (e) { console.warn('[comments] load failed', e); });
}
function cmtPost(payload, cb) {
  fetch(CMT_API, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) })
    .then(function (r) { return r.json(); })
    .then(cb)
    .catch(function (e) { console.warn('[comments] save failed', e); if (cb) cb({ ok: false, error: String(e) }); });
}

/* ── Toolbar actions ── */
function cmtToggleMode() {
  cmtState.mode = !cmtState.mode;
  /* Arming drop mode is the moment you start caring about comments,
     so bring the existing pins back rather than making you drop one
     blind on top of a pin you cannot see. */
  if (cmtState.mode) cmtSetVisible(true);
  document.body.classList.toggle('cmt-mode', cmtState.mode);
  var btn = document.getElementById('cmt-btn');
  if (btn) btn.classList.toggle('cmt-armed', cmtState.mode);
  cmtHint(cmtState.mode ? 'Click anywhere in the prototype to drop a comment (Esc to cancel)' : null);
  if (!cmtState.mode) cmtCloseCard();
}
function cmtSetVisible(on) {
  cmtState.visible = !!on;
  document.body.classList.toggle('cmt-show', cmtState.visible);
  var eye = document.getElementById('cmt-eye');
  if (eye) eye.classList.toggle('cmt-eye-off', !cmtState.visible);
  if (!cmtState.visible) cmtCloseCard();
}
function cmtToggleVisible() { cmtSetVisible(!cmtState.visible); }
function cmtHint(text) {
  var h = document.getElementById('cmt-hint');
  if (h) h.remove();
  if (!text) return;
  h = document.createElement('div');
  h.id = 'cmt-hint'; h.className = 'cmt-hint'; h.textContent = text;
  document.body.appendChild(h);
}

/* ── Container resolution — the heart of persistence ──
   Climb from the clicked element to the nearest scrollable ancestor
   that has an id; fall back to the nearest id'd ancestor, then .phone. */
function cmtFindContainer(el) {
  var node = el, firstWithId = null;
  while (node && node !== document.body) {
    if (node.id) {
      if (!firstWithId) firstWithId = node;
      var cs = getComputedStyle(node);
      var scrollable = (/(auto|scroll)/).test(cs.overflowY + cs.overflowX);
      if (scrollable) return node;
    }
    node = node.parentElement;
  }
  return firstWithId || document.querySelector('.phone');
}

/* ── Drop-mode click capture ── */
document.addEventListener('click', function (e) {
  if (!cmtState.mode) return;
  var phone = document.querySelector('.phone');
  if (!phone || !phone.contains(e.target)) return;   /* toolbar clicks pass through */
  if (e.target.closest('.cmt-card') || e.target.closest('.cmt-pin')) return;
  e.preventDefault(); e.stopPropagation();

  var container = cmtFindContainer(e.target);
  var rect = container.getBoundingClientRect();
  var xPct = ((e.clientX - rect.left + container.scrollLeft) / Math.max(container.scrollWidth, 1)) * 100;
  var yPct = ((e.clientY - rect.top + container.scrollTop) / Math.max(container.scrollHeight, 1)) * 100;

  var anchorEl = e.target.closest('button, a, [class]') || e.target;
  var anchorText = (anchorEl.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);

  cmtOpenComposer({
    container: container,
    x_pct: Math.round(xPct * 100) / 100,
    y_pct: Math.round(yPct * 100) / 100,
    anchor: '#' + (container.id || 'phone') + (anchorText ? ' \u00B7 "' + anchorText + '"' : ''),
    clientX: e.clientX, clientY: e.clientY
  });
}, true);

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && cmtState.mode) cmtToggleMode();
});

/* ── Page/subtab context for the sheet row ── */
function cmtContext() {
  var view = 'desktop';
  if (document.body.classList.contains('view-mobile')) view = 'mobile';
  else if (document.body.classList.contains('view-tablet')) view = 'tablet';
  var orientation = document.body.classList.contains('orient-landscape') ? 'landscape' : 'portrait';
  var subtab = '';
  try { if (typeof swuSmTab !== 'undefined') subtab = swuSmTab || ''; } catch (err) {}
  return { view: view, orientation: orientation, subtab: subtab };
}

/* ── Composer ── */
function cmtCloseCard() {
  var c = document.getElementById('cmt-card');
  if (c) c.remove();
  cmtState.bubbleFor = null;
}

function cmtOpenComposer(drop) {
  cmtCloseCard();
  var card = document.createElement('div');
  card.className = 'cmt-card'; card.id = 'cmt-card';

  var lastName = '';
  try { lastName = localStorage.getItem('cmt_last_name') || ''; } catch (err) {}

  var opts = cmtState.names.map(function (n) {
    return '<option value="' + n.replace(/"/g, '&quot;') + '"' + (n === lastName ? ' selected' : '') + '>' + n + '</option>';
  }).join('');
  card.innerHTML =
    '<select id="cmt-name">' + (opts || '') + '<option value="__add">\u2795 Add your name\u2026</option></select>' +
    '<input id="cmt-newname" placeholder="Your name" style="display:none;">' +
    '<textarea id="cmt-textarea" placeholder="Leave a comment"></textarea>' +
    '<div class="cmt-err" id="cmt-err" style="display:none;"></div>' +
    '<div class="cmt-row"><button class="cmt-cta cmt-cta-quiet" onclick="cmtCloseCard()">Cancel</button>' +
    '<button class="cmt-cta cmt-cta-post" id="cmt-post">Post</button></div>';

  document.querySelector('.phone-wrap').appendChild(card);
  cmtPlaceCard(card, drop.clientX, drop.clientY);

  var sel = card.querySelector('#cmt-name');
  var newName = card.querySelector('#cmt-newname');
  if (!cmtState.names.length) { sel.value = '__add'; newName.style.display = 'block'; }
  sel.addEventListener('change', function () {
    newName.style.display = sel.value === '__add' ? 'block' : 'none';
    if (sel.value === '__add') newName.focus();
  });

  card.querySelector('#cmt-post').addEventListener('click', function () {
    var btn = this;
    if (btn.disabled) return;   /* Apps Script is slow — block double-submits */
    var name = sel.value === '__add' ? newName.value.trim() : sel.value;
    var text = card.querySelector('#cmt-textarea').value.trim();
    var err = card.querySelector('#cmt-err');
    if (!name) { err.textContent = 'Pick or add a name first.'; err.style.display = 'block'; return; }
    if (!text) { err.textContent = 'Comment is empty.'; err.style.display = 'block'; return; }
    err.style.display = 'none';
    btn.disabled = true;
    btn.style.width = btn.offsetWidth + 'px';   /* keep size while swapping to spinner */
    btn.innerHTML = '<span class="cmt-spin"></span>';
    try { localStorage.setItem('cmt_last_name', name); } catch (e2) {}

    var fail = function (msg) {
      err.textContent = 'Save failed: ' + msg; err.style.display = 'block';
      btn.disabled = false; btn.style.width = ''; btn.textContent = 'Post';
    };
    var ctx = cmtContext();
    var post = function () {
      /* Route capture — the app's hash router keeps location.hash
         current (#mobile/trucks/45689/timeline). Pack it into the
         anchor field so Jump-to can replay the exact state without
         a backend schema change; cmtAnchorParts strips it on display. */
      var route = location.hash.replace(/^#/, '');
      var anchorOut = drop.anchor + (route ? ' \u27C2route=' + route : '');
      cmtPost({
        action: 'add', name: name, view: ctx.view, orientation: ctx.orientation,
        page: drop.container.id || 'phone', subtab: ctx.subtab,
        x_pct: drop.x_pct, y_pct: drop.y_pct, anchor: anchorOut, comment: text
      }, function (res) {
        if (!res.ok) { fail(res.error); return; }
        cmtCloseCard();
        if (cmtState.mode) cmtToggleMode();   /* one pin per arm, like Figma */
        cmtRefresh();
      });
    };
    if (sel.value === '__add') cmtPost({ action: 'addName', name: name }, function (res) {
      if (!res.ok) { fail(res.error); return; }
      post();
    });
    else post();
  });

  setTimeout(function () { card.querySelector('#cmt-textarea').focus(); }, 50);
}

/* Keep the card inside the visible window near the click point */
function cmtPlaceCard(card, cx, cy) {
  var wrap = document.querySelector('.phone-wrap').getBoundingClientRect();
  var x = cx - wrap.left + 14, y = cy - wrap.top + 6;
  if (x + 274 > wrap.width) x = Math.max(8, cx - wrap.left - 274);
  card.style.left = x + 'px';
  card.style.top = Math.max(8, y) + 'px';
}

/* ── Pins ── */
function cmtColor(name) {
  var palette = ['#3069e3', '#8a4fd3', '#1f9d55', '#d3542f', '#b8860b', '#0f766e', '#be185d'];
  var h = 0;
  for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function cmtRenderAll() {
  document.querySelectorAll('.cmt-pin').forEach(function (p) { p.remove(); });
  cmtState.pending = [];
  cmtState.comments.forEach(cmtRenderPin);
}

function cmtRenderPin(c) {
  var container = document.getElementById(c.page) || (c.page === 'phone' ? document.querySelector('.phone') : null);
  if (!container) { cmtState.pending.push(c); return; }
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';

  var pin = document.createElement('div');
  pin.className = 'cmt-pin' + (c.status === 'done' ? ' cmt-done' : '');
  pin.dataset.cmtId = c.id;   /* lets the drawer's Jump-to find this pin */
  pin.textContent = (String(c.name).trim()[0] || '?').toUpperCase();
  if (c.status !== 'done') pin.style.background = cmtColor(String(c.name));
  pin.style.left = 'calc(' + c.x_pct + '% - 2px)';
  pin.style.top = c.y_pct + '%';
  pin.title = c.name + ': ' + c.comment;
  pin.addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    cmtOpenBubble(c, e.clientX, e.clientY);
  });
  container.appendChild(pin);
}

/* Containers built at runtime (sheets, drawers) may not exist yet —
   retry unresolved pins a few times after load. */
function cmtRetryPending() {
  if (!cmtState.pending.length) return;
  var retry = cmtState.pending; cmtState.pending = [];
  retry.forEach(cmtRenderPin);
}
setInterval(cmtRetryPending, 2500);

/* Split a stored anchor into its display text and the machine route
   token appended at post time (see the route capture in the composer). */
function cmtAnchorParts(c) {
  var a = String(c.anchor || '');
  var tok = '\u27C2route=';
  var i = a.indexOf(tok);
  if (i === -1) return { display: a, route: null };
  /* slice by token length, not a hand-counted offset — the old i+8
     ate the first character of every route ("esktop/trucks/...") and
     silently broke everything downstream that consumed routes. */
  return { display: a.slice(0, i).trim(), route: a.slice(i + tok.length).trim() };
}

/* ── Bubble (read / resolve) ── */
function cmtOpenBubble(c, cx, cy) {
  if (cmtState.bubbleFor === c.id) { cmtCloseCard(); return; }
  cmtCloseCard();
  cmtState.bubbleFor = c.id;

  var when = '';
  try { when = new Date(c.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) {}

  var card = document.createElement('div');
  card.className = 'cmt-card'; card.id = 'cmt-card';
  card.innerHTML =
    '<div><span class="cmt-author">' + c.name + '</span> <span class="cmt-meta">' + when +
    (c.status === 'done' ? ' \u00B7 resolved' : '') + '</span></div>' +
    '<div class="cmt-text"></div>' +
    '<div class="cmt-meta"></div>' +
    '<div class="cmt-row">' +
    (c.status === 'done'
      ? '<button class="cmt-cta cmt-cta-quiet" id="cmt-reopen">Reopen</button>'
      : '<button class="cmt-cta cmt-cta-post" id="cmt-resolve">Mark as done</button>') +
    '</div>';
  card.querySelector('.cmt-text').textContent = c.comment;
  card.querySelectorAll('.cmt-meta')[1].textContent = cmtAnchorParts(c).display;

  document.querySelector('.phone-wrap').appendChild(card);
  cmtPlaceCard(card, cx, cy);

  var resolveBtn = card.querySelector('#cmt-resolve');
  if (resolveBtn) resolveBtn.addEventListener('click', function () {
    if (resolveBtn.disabled) return;
    resolveBtn.disabled = true;
    resolveBtn.style.width = resolveBtn.offsetWidth + 'px';
    resolveBtn.innerHTML = '<span class="cmt-spin"></span>';
    cmtPost({ action: 'resolve', id: c.id }, function () { cmtCloseCard(); cmtRefresh(); });
  });
  var reopenBtn = card.querySelector('#cmt-reopen');
  if (reopenBtn) reopenBtn.addEventListener('click', function () {
    if (reopenBtn.disabled) return;
    reopenBtn.disabled = true;
    reopenBtn.style.width = reopenBtn.offsetWidth + 'px';
    reopenBtn.innerHTML = '<span class="cmt-spin"></span>';
    cmtPost({ action: 'reopen', id: c.id }, function () { cmtCloseCard(); cmtRefresh(); });
  });
}

/* Close bubble on outside click */
document.addEventListener('click', function (e) {
  var card = document.getElementById('cmt-card');
  if (card && !card.contains(e.target) && !e.target.closest('.cmt-pin') && !cmtState.mode) cmtCloseCard();
});

/* ── Load + refresh ── */
function cmtRefresh() {
  cmtGet(function (res) {
    if (!res.ok) { console.warn('[comments]', res.error); return; }
    cmtState.comments = res.comments || [];
    cmtState.names = res.names || [];
    cmtRenderAll();
    cmtDrawerSync();   /* keep the all-comments drawer current if open */
  });
}

/* Re-render on view/orientation change — container sizes shift */
(function () {
  var mo = new MutationObserver(function () {
    /* setView() rebuilds body.className from scratch ('view-' + view).
       Hidden is now the CSS default, so a clobber while hidden needs no
       repair — only a SHOWN state has to be re-asserted. The guards keep
       the re-add from re-triggering this observer into a loop. */
    if (cmtState.visible && !document.body.classList.contains('cmt-show')) {
      document.body.classList.add('cmt-show');
    }
    if (cmtState.mode && !document.body.classList.contains('cmt-mode')) {
      document.body.classList.add('cmt-mode');
    }
    clearTimeout(window.__cmtRerenderT);
    window.__cmtRerenderT = setTimeout(cmtRenderAll, 450);
  });
  mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();

/* Hidden is the CSS default now — nothing to set at boot. A visible
   preference (only ever set by a human toggling the eye) adds cmt-show
   through cmtSetVisible. */
if (cmtState.visible) document.body.classList.add('cmt-show');

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cmtRefresh);
else cmtRefresh();

/* ═══════════════════════════════════════════════════════════════════
   ALL-COMMENTS DRAWER — opened from a caret button injected next to
   the Comment button. Slides over the whole prototype (z-index above
   the phone notch and comment cards). Each row can Jump to the pin's
   location (switching view/orientation first if needed) or resolve /
   reopen the comment without hunting for its pin.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Drawer styles ── */
(function () {
  var css = [
    '.cmt-drawer-scrim{position:fixed;inset:0;background:rgba(0,0,0,0.28);z-index:10590;',
    '  opacity:0;pointer-events:none;transition:opacity 0.25s;}',
    '.cmt-drawer-scrim.open{opacity:1;pointer-events:auto;}',
    '.cmt-drawer{position:fixed;top:0;right:0;bottom:0;width:372px;max-width:92vw;background:#fff;',
    '  z-index:10600;box-shadow:-8px 0 32px rgba(0,0,0,0.2);display:flex;flex-direction:column;',
    '  font-family:var(--font,sans-serif);transform:translateX(102%);transition:transform 0.28s cubic-bezier(0.22,1,0.36,1);}',
    '.cmt-drawer.open{transform:translateX(0);}',
    '.cmt-dh{display:flex;align-items:center;gap:8px;padding:16px 16px 10px;flex-shrink:0;}',
    '.cmt-dh-title{font-size:16px;font-weight:600;color:#1a1a1a;letter-spacing:-0.32px;flex:1;}',
    '.cmt-dh-count{font-size:12px;color:#8a8d94;font-weight:500;}',
    '.cmt-dh-close{width:30px;height:30px;border-radius:50%;border:1px solid rgba(0,0,0,0.12);',
    '  background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#1a1a1a;}',
    '.cmt-dtabs{display:flex;gap:4px;padding:0 16px 12px;flex-shrink:0;border-bottom:1px solid rgba(0,0,0,0.08);}',
    '.cmt-dtab{border:1px solid rgba(0,0,0,0.15);background:none;border-radius:100px;padding:5px 12px;',
    '  font-size:12px;font-weight:500;font-family:inherit;color:#555;cursor:pointer;}',
    '.cmt-dtab.on{background:#171614;color:#fff;border-color:#171614;}',
    '.cmt-dlist{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:8px 0 24px;}',
    '.cmt-drow{padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.06);}',
    '.cmt-drow-head{display:flex;align-items:center;gap:8px;margin-bottom:6px;}',
    '.cmt-davatar{width:24px;height:24px;border-radius:12px 12px 12px 2px;color:#fff;display:flex;',
    '  align-items:center;justify-content:center;font-size:11px;font-weight:600;flex-shrink:0;border:1.5px solid #fff;',
    '  box-shadow:0 1px 4px rgba(0,0,0,0.25);}',
    '.cmt-davatar.done{background:#8a8d94 !important;}',
    '.cmt-dname{font-size:12.5px;font-weight:600;color:#1a1a1a;flex:1;min-width:0;overflow:hidden;',
    '  text-overflow:ellipsis;white-space:nowrap;}',
    '.cmt-dtime{font-size:11px;color:#8a8d94;flex-shrink:0;}',
    '.cmt-dtext{font-size:12.5px;color:#333;line-height:1.45;margin-bottom:6px;white-space:pre-wrap;word-break:break-word;}',
    '.cmt-dctx{font-size:11px;color:#8a8d94;margin-bottom:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.cmt-dacts{display:flex;gap:6px;}',
    '.cmt-dact{border:1px solid rgba(0,0,0,0.15);background:none;border-radius:100px;padding:5px 12px;',
    '  font-size:12px;font-weight:500;font-family:inherit;color:#1a1a1a;cursor:pointer;}',
    '.cmt-dact-primary{background:#3069e3;border-color:#3069e3;color:#fff;}',
    '.cmt-dact:disabled{opacity:0.6;cursor:default;}',
    '.cmt-dempty{padding:36px 16px;text-align:center;font-size:12.5px;color:#8a8d94;}',
    /* Injected caret button hugs the Comment button */
    '.cmt-dd-btn svg{display:block;}',
    /* Caret menu — matches the toolbar dropdown pattern (Options) */
    '.cmt-menu{position:absolute;top:calc(100% + 6px);right:0;min-width:170px;background:#2a2a2a;',
    '  border:1px solid rgba(255,255,255,0.14);border-radius:10px;padding:4px;z-index:10700;',
    '  box-shadow:0 8px 28px rgba(0,0,0,0.4);display:none;flex-direction:column;gap:2px;}',
    '.cmt-menu.open{display:flex;}',
    '.cmt-menu-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:7px;',
    '  font-family:var(--font,sans-serif);font-size:12.5px;font-weight:500;color:#eee;cursor:pointer;',
    '  letter-spacing:-0.24px;white-space:nowrap;}',
    '.cmt-menu-item:hover{background:rgba(255,255,255,0.1);}'
  ].join('\n');
  var el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
})();

var cmtDrawerFilter = 'open';   /* 'open' | 'done' | 'all' */

/* ── Inject nothing — the split button + menu live in index.html.
   Menu behavior: caret toggles, item click acts and closes,
   outside click closes. ── */
function cmtMenuToggle() {
  var m = document.getElementById('cmt-menu');
  if (!m) return;
  var opening = !m.classList.contains('open');
  m.classList.toggle('open', opening);
  if (opening) {
    var lbl = document.getElementById('cmt-vis-label');
    if (lbl) lbl.textContent = cmtState.visible ? 'Hide pins' : 'Show pins';
  }
}
function cmtMenuPick(what) {
  var m = document.getElementById('cmt-menu');
  if (m) m.classList.remove('open');
  if (what === 'drawer') cmtDrawerOpen();
  if (what === 'toggle') cmtToggleVisible();
}
document.addEventListener('click', function (e) {
  var m = document.getElementById('cmt-menu');
  if (m && m.classList.contains('open') && !e.target.closest('#cmt-wrap')) m.classList.remove('open');
});

/* ── Open / close ── */
function cmtDrawerToggle() {
  var d = document.getElementById('cmt-drawer');
  if (d && d.classList.contains('open')) cmtDrawerClose();
  else cmtDrawerOpen();
}

function cmtDrawerOpen() {
  var scrim = document.getElementById('cmt-drawer-scrim');
  if (!scrim) {
    scrim = document.createElement('div');
    scrim.id = 'cmt-drawer-scrim'; scrim.className = 'cmt-drawer-scrim';
    scrim.addEventListener('click', cmtDrawerClose);
    document.body.appendChild(scrim);
  }
  var d = document.getElementById('cmt-drawer');
  if (!d) {
    d = document.createElement('div');
    d.id = 'cmt-drawer'; d.className = 'cmt-drawer';
    document.body.appendChild(d);
  }
  cmtDrawerRender();
  /* double rAF so the entrance transition actually plays on first build */
  requestAnimationFrame(function () { requestAnimationFrame(function () {
    scrim.classList.add('open'); d.classList.add('open');
  }); });
  cmtRefresh();   /* pull latest while it slides in */
}

function cmtDrawerClose() {
  var d = document.getElementById('cmt-drawer');
  var scrim = document.getElementById('cmt-drawer-scrim');
  if (d) d.classList.remove('open');
  if (scrim) scrim.classList.remove('open');
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    var d = document.getElementById('cmt-drawer');
    if (d && d.classList.contains('open')) cmtDrawerClose();
  }
});

/* Re-render the list if the drawer is open (called from cmtRefresh) */
function cmtDrawerSync() {
  var d = document.getElementById('cmt-drawer');
  if (d && d.classList.contains('open')) cmtDrawerRender();
}

/* ── List render ── */
function cmtDrawerRender() {
  var d = document.getElementById('cmt-drawer');
  if (!d) return;

  var all = cmtState.comments.slice().sort(function (a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  var openCount = all.filter(function (c) { return c.status !== 'done'; }).length;
  var list = all.filter(function (c) {
    if (cmtDrawerFilter === 'open') return c.status !== 'done';
    if (cmtDrawerFilter === 'done') return c.status === 'done';
    return true;
  });

  var tabs = [['open', 'Open (' + openCount + ')'], ['done', 'Resolved'], ['all', 'All (' + all.length + ')']];
  var html =
    '<div class="cmt-dh">' +
    '  <div class="cmt-dh-title">Comments <span class="cmt-dh-count">' + openCount + ' open</span></div>' +
    '  <button class="cmt-dh-close" onclick="cmtDrawerClose()" title="Close">' +
    '    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
    '  </button>' +
    '</div>' +
    '<div class="cmt-dtabs">' + tabs.map(function (t) {
      return '<button class="cmt-dtab' + (cmtDrawerFilter === t[0] ? ' on' : '') + '" onclick="cmtDrawerSetFilter(\'' + t[0] + '\')">' + t[1] + '</button>';
    }).join('') + '</div>' +
    '<div class="cmt-dlist" id="cmt-dlist"></div>';
  d.innerHTML = html;

  var listEl = d.querySelector('#cmt-dlist');
  if (!list.length) {
    listEl.innerHTML = '<div class="cmt-dempty">' +
      (cmtDrawerFilter === 'open' ? 'No open comments \u2014 nice.' : 'Nothing here yet.') + '</div>';
    return;
  }

  list.forEach(function (c) {
    var row = document.createElement('div');
    row.className = 'cmt-drow';
    var when = '';
    try { when = new Date(c.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) {}
    var initial = (String(c.name).trim()[0] || '?').toUpperCase();
    var ctxBits = [];
    if (c.page) ctxBits.push('#' + c.page);
    if (c.view) ctxBits.push(c.view + (c.orientation === 'landscape' ? ' \u00b7 landscape' : ''));
    if (c.subtab) ctxBits.push(c.subtab);

    row.innerHTML =
      '<div class="cmt-drow-head">' +
      '  <div class="cmt-davatar' + (c.status === 'done' ? ' done' : '') + '"></div>' +
      '  <div class="cmt-dname"></div>' +
      '  <div class="cmt-dtime">' + when + (c.status === 'done' ? ' \u00b7 resolved' : '') + '</div>' +
      '</div>' +
      '<div class="cmt-dtext"></div>' +
      '<div class="cmt-dctx"></div>' +
      '<div class="cmt-dacts">' +
      (c.status === 'done'
        ? '  <button class="cmt-dact" data-act="reopen">Reopen</button>'
        : '  <button class="cmt-dact" data-act="resolve">Mark as done</button>') +
      '</div>';

    /* textContent assignment — comment text and names are user input */
    var av = row.querySelector('.cmt-davatar');
    av.textContent = initial;
    if (c.status !== 'done') av.style.background = cmtColor(String(c.name));
    row.querySelector('.cmt-dname').textContent = c.name;
    row.querySelector('.cmt-dtext').textContent = c.comment;
    row.querySelector('.cmt-dctx').textContent = ctxBits.join('  \u00b7  ');
    row.querySelector('.cmt-dctx').title = cmtAnchorParts(c).display;

    var res = row.querySelector('[data-act="resolve"]');
    if (res) res.addEventListener('click', function () { cmtDrawerAct(res, 'resolve', c.id); });
    var reo = row.querySelector('[data-act="reopen"]');
    if (reo) reo.addEventListener('click', function () { cmtDrawerAct(reo, 'reopen', c.id); });

    listEl.appendChild(row);
  });
}

function cmtDrawerSetFilter(f) {
  cmtDrawerFilter = f;
  cmtDrawerRender();
}

/* Resolve / reopen from the drawer — same endpoint, spinner treatment */
function cmtDrawerAct(btn, action, id) {
  if (btn.disabled) return;
  btn.disabled = true;
  btn.style.width = btn.offsetWidth + 'px';
  btn.innerHTML = '<span class="cmt-spin" style="border-color:rgba(0,0,0,0.2);border-top-color:#555;"></span>';
  cmtPost({ action: action, id: id }, function () { cmtRefresh(); });
}


/* ═══ FILE: router.js ═════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   router.js — route registry + goTo(). Loads LAST (after comments.js
   and testing.js) so it can wrap their render functions.

   WHY THIS FILE EXISTS
   The prototype already writes a hash on every navigation (app-06's
   wrapper layer) and comments.js already stores that hash on every
   pin. What was missing is the reverse direction: nothing could READ
   a route and drive the UI there. applyHashRoute() in app-06 does a
   one-shot restore at load with blind setTimeout chains, but it can't
   be called for an arbitrary route mid-session, and it only knows
   trucks/units.

   THE CONTRACT
   - Each screen registers a resolver: rtRegister(pattern, fn).
     Patterns are hash segments, ':name' captures a param.
   - rtGoTo(route) matches the most specific pattern and runs its
     resolver. Resolvers are async and use rtWaitFor() to poll for
     real DOM conditions instead of guessing at timeouts — that
     guessing is what killed the first Jump-to attempt.
   - Consumers (comments Jump, dashboard see-location, ?jump= links)
     never touch app internals. They only speak routes.

   WHAT THIS FILE REGISTERS
     desktop, desktop/home|units|tickets|update|map
     desktop/trucks, desktop/trucks/wts|overview|cc
     desktop/trucks/:truck[/:tab], desktop/units/:unit[/:tab]
     mobile,  mobile/trucks[/wts|overview|cc], mobile/trucks/:truck[/:tab]
     mobile/units, mobile/units/:unit[/:tab]
     tablet,  tablet/trucks[/wts|overview|cc], tablet/trucks/:truck[/:tab]
     tablet/units, tablet/units/:unit[/:tab]

   That is every route the hash writers in app-06 actually produce.
   Sub-tab state inside Map, Software Update and Tickets is not written
   to the hash by anything, so there is nothing to resolve there and no
   resolver is registered — those screens land at page level. Adding
   them means adding hash writers first.

   Once the pattern is approved, registrations migrate into the app
   file that owns each screen (map into app-04, tickets into app-01,
   mobile into app-03/05) and this file keeps only the engine.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Engine ─────────────────────────────────────────────────────── */

var RT = { routes: [] };

function rtRegister(pattern, resolver) {
  RT.routes.push({ segs: pattern.split('/'), resolver: resolver });
}

/* Most-specific match wins: more segments beats fewer, and among
   equal lengths, more literal (non-param) segments beats fewer. */
function rtMatch(route) {
  var parts = String(route || '').replace(/^#/, '').split('/').filter(Boolean);
  var best = null, bestScore = -1;
  RT.routes.forEach(function (r) {
    if (r.segs.length !== parts.length) return;
    var params = {}, literals = 0, ok = true;
    for (var i = 0; i < r.segs.length; i++) {
      var s = r.segs[i];
      if (s.charAt(0) === ':') { params[s.slice(1)] = parts[i]; }
      else if (s === parts[i]) { literals++; }
      else { ok = false; break; }
    }
    if (!ok) return;
    var score = parts.length * 100 + literals;
    if (score > bestScore) { bestScore = score; best = { reg: r, params: params }; }
  });
  return best;
}

function rtCanResolve(route) { return !!rtMatch(route); }

/* Poll until testFn() returns truthy, or give up. Resolves with the
   truthy value so resolvers can waitFor an element and then use it. */
function rtWaitFor(testFn, timeoutMs, intervalMs) {
  timeoutMs = timeoutMs || 3000; intervalMs = intervalMs || 60;
  return new Promise(function (resolve, reject) {
    var t0 = Date.now();
    (function poll() {
      var v = null;
      try { v = testFn(); } catch (e) {}
      if (v) return resolve(v);
      if (Date.now() - t0 > timeoutMs) return reject(new Error('rtWaitFor timeout'));
      setTimeout(poll, intervalMs);
    })();
  });
}

function rtGoTo(route) {
  var m = rtMatch(route);
  if (!m) {
    console.warn('[router] no resolver for', route);
    return Promise.reject(new Error('no resolver: ' + route));
  }
  var out;
  try { out = m.reg.resolver(m.params); } catch (e) { return Promise.reject(e); }
  return Promise.resolve(out);
}

/* ── Shared resolver steps ──────────────────────────────────────── */

/* setView is already wrapped by app-06 to keep the hash current, so
   calling it here maintains the hash for free. Skip if already there:
   setView rebuilds tables, and a no-op rebuild flashes the screen. */
function rtEnsureDesktop() {
  if (!document.body.classList.contains('view-desktop')) setView('desktop');
  return rtWaitFor(function () {
    return document.body.classList.contains('view-desktop');
  });
}

/* "Visible" used to mean "inline style.display is not none". That held
   while every desktop page toggled its own inline display. app-13's
   Dashboards page hides the other pages some other way, so #dt-page-trucks
   kept a blank inline display while the dashboard was on screen, the
   router believed trucks was showing, skipped dtNavGo, and opened the
   truck drawer on top of the dashboard. Ask the layout engine instead:
   a page is on screen only if it has a laid-out box with height. */
function rtDtPageOnScreen(page) {
  var el = document.getElementById('dt-page-' + page);
  if (!el) return null;
  if (page === 'home' && !el.classList.contains('active')) return null;
  var cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return null;
  var r = el.getBoundingClientRect();
  return (r.width > 0 && r.height > 0) ? el : null;
}

function rtEnsureDtPage(page) {
  return rtEnsureDesktop().then(function () {
    if (!rtDtPageOnScreen(page)) dtNavGo(page);
    return rtWaitFor(function () { return rtDtPageOnScreen(page); });
  });
}

/* A route names ONE state, so a jump must close whatever drawer the
   route does NOT mention. Truck (#dt-drawer) and unit (#dt-ud-drawer)
   drawers are separate elements over a shared scrim — without this,
   jumping across them stacks both open. dtUdClose also reverts a
   half-finished Pending link, which is the right side effect when
   navigating away mid-flow. */
function rtCloseOtherDrawers(keep) {
  var td = document.getElementById('dt-drawer');
  if (keep !== 'truck' && td && td.classList.contains('open')) dtCloseDrawer();
  var ud = document.getElementById('dt-ud-drawer');
  if (keep !== 'unit' && ud && ud.classList.contains('open') &&
      typeof dtUdClose === 'function') dtUdClose();
  var tk = document.getElementById('dt-ticket-drawer');
  if (keep !== 'ticket' && tk && tk.classList.contains('open') &&
      typeof tkCloseDrawer === 'function') tkCloseDrawer();
}

/* Nav functions that take an element (dtSelectTab, dtDrawerTab) get
   the real button, found by its own onclick string — the one selector
   that survives both the static markup and app-06's rebuilt tab sets. */
function rtFindByOnclick(scopeSel, fnName, arg) {
  return document.querySelector(scopeSel + ' [onclick*="' + fnName + '(\'' + arg + '\'"]');
}

/* ▶ APP-SPECIFIC ── route registrations for this prototype's screens (desktop, mobile, tablet), the tablet hash writers, and the dtSelectTab / dtDrawerTab hash fixes
   Cut into routes.js (ships with the app) when tooling.js goes portable. */

/* ── Desktop trucks slice ───────────────────────────────────────── */

rtRegister('desktop', function () {
  return rtEnsureDesktop();
});

/* Page-level fallback for every desktop page. Comments dropped on
   Software Update, Map, Tickets, Units, or Home stored routes like
   'desktop/update' (dtNavGo's wrapper writes those; sub-tab state
   inside them isn't hash-written yet). A page-level jump still lands
   you on the right screen with the pin rendered — better than no
   button while deep resolvers for those pages get built. */
['home', 'dashboard', 'units', 'tickets', 'update', 'map'].forEach(function (page) {
  rtRegister('desktop/' + page, function () {
    return rtEnsureDtPage(page).then(function () {
      rtCloseOtherDrawers(null);
    });
  });
});

rtRegister('desktop/trucks', function () {
  return rtEnsureDtPage('trucks').then(function () {
    /* Route says list, not drawer — close anything open. */
    rtCloseOtherDrawers(null);
  });
});

['wts', 'overview', 'cc'].forEach(function (sub) {
  rtRegister('desktop/trucks/' + sub, function () {
    return rtEnsureDtPage('trucks').then(function () {
      rtCloseOtherDrawers(null);
      var btn = rtFindByOnclick('#dt-page-trucks', 'dtSelectTab', sub);
      if (btn && !btn.classList.contains('active')) dtSelectTab(sub, btn);
    });
  });
});

rtRegister('desktop/trucks/:truck', function (p) {
  return rtOpenDtTruck(p.truck, 'overview');
});

rtRegister('desktop/trucks/:truck/:tab', function (p) {
  return rtOpenDtTruck(p.truck, p.tab || 'overview');
});

function rtOpenDtTruck(truckNum, tab) {
  return rtEnsureDtPage('trucks').then(function () {
    if (typeof trucks !== 'undefined' && !trucks.find(function (t) { return t.num === truckNum; })) {
      console.warn('[router] unknown truck', truckNum);
      return;
    }
    rtCloseOtherDrawers('truck');
    /* Reopen even if this truck is already showing — dtOpenTruck is
       idempotent and it resets the drawer to a known Overview state,
       which is exactly the clean base the tab step needs. */
    dtOpenTruck(truckNum);
    return rtWaitFor(function () {
      var d = document.getElementById('dt-drawer');
      return d && d.classList.contains('open') ? d : null;
    }).then(function () {
      if (!tab || tab === 'overview') return;
      return rtWaitFor(function () {
        return rtFindByOnclick('#dt-drawer', 'dtDrawerTab', tab);
      }).then(function (btn) {
        dtDrawerTab(tab, btn);
      });
    });
  });
}

/* ── Desktop units drawer ───────────────────────────────────────── */

rtRegister('desktop/units/:unit', function (p) {
  return rtOpenDtUnit(p.unit, null);
});

rtRegister('desktop/units/:unit/:tab', function (p) {
  return rtOpenDtUnit(p.unit, p.tab);
});

function rtOpenDtUnit(unitId, tab) {
  return rtEnsureDtPage('units').then(function () {
    /* dtUdOpen validates the id and only opens Unlinked / Pending /
       Linked units — a silent return means the drawer never opens and
       the waitFor below times out into the catch. Check up front so
       the failure names itself. */
    var u = (typeof UNITS_DATA !== 'undefined') &&
      UNITS_DATA.find(function (x) { return x.id === unitId; });
    if (!u) { console.warn('[router] unknown unit', unitId); return; }
    rtCloseOtherDrawers('unit');
    dtUdOpen(unitId);
    return rtWaitFor(function () {
      var d = document.getElementById('dt-ud-drawer');
      return d && d.classList.contains('open') ? d : null;
    }).then(function () {
      if (!tab) return;
      /* Unit tabs vary by status (Linked gets six, Unlinked gets two).
         If the stored tab doesn't exist for this unit's CURRENT status
         — it may have been linked/unlinked since the comment — land on
         the default tab rather than failing the whole jump. */
      return rtWaitFor(function () {
        return document.getElementById('dt-ud-tabs');
      }).then(function () {
        var btn = rtFindByOnclick('#dt-ud-tabs', 'dtUdSelectTab', tab);
        if (btn) dtUdSelectTab(tab);
        else console.warn('[router] tab', tab, 'not available for unit', unitId, '— left on default');
      });
    });
  });
}

/* ── Mobile and tablet slices ───────────────────────────────────────
   Same contract as desktop: a route names ONE state, so each resolver
   closes what the route doesn't mention before opening what it does.
   Every app function is typeof-guarded — an unregistered or renamed
   function warns and lands you at page level instead of throwing and
   killing the jump. ── */

/* setView preserves orientation through vpApplyOrient, so a resolver
   never needs to know which way the device is turned. */
function rtEnsureView(view) {
  if (!document.body.classList.contains('view-' + view)) setView(view);
  return rtWaitFor(function () {
    return document.body.classList.contains('view-' + view);
  });
}

function rtVisible(id) {
  var el = document.getElementById(id);
  if (!el) return false;
  return getComputedStyle(el).display !== 'none';
}

/* ── Mobile ─────────────────────────────────────────────────────── */

/* Route slug → the label the mobile nav functions expect. Mirrors the
   label → slug maps in app-06's hash writers; if a tab is renamed
   there, rename it here too or the jump lands on the default tab. */
var RT_MO_WTS = {
  wts:      'Where to start',
  overview: 'Overview',
  cc:       'Components Condition'
};
var RT_MO_DRAWER_TAB = {
  components: 'Components Overview',
  overview:   'Components Overview',   /* openDrawer writes 'overview' */
  timeline:   'Component Timeline',
  logs:       'Truck Logs',
  manual:     'Manual Control',
  sensor:     'Sensor',
  config:     'Configuration'
};

function rtMoCloseDrawers(keep) {
  var d = document.getElementById('drawer');
  if (keep !== 'truck' && d && d.classList.contains('open') &&
      typeof closeDrawer === 'function') closeDrawer();
  if (keep !== 'unit' && rtVisible('units-drawer') &&
      typeof closeUnitDetail === 'function') closeUnitDetail();
}

function rtMoTrucks() {
  return rtEnsureView('mobile').then(function () {
    rtMoCloseDrawers(null);
    if (typeof goToAllTrucks === 'function') goToAllTrucks();
    return rtWaitFor(function () {
      var s = document.getElementById('s-main');
      return s && s.classList.contains('active') ? s : null;
    });
  });
}

function rtMoUnits() {
  return rtEnsureView('mobile').then(function () {
    rtMoCloseDrawers(null);
    if (typeof openUnits === 'function') openUnits();
    return rtWaitFor(function () {
      var s = document.getElementById('s-units');
      return s && s.classList.contains('active') ? s : null;
    });
  });
}

function rtMoOpenTruck(truckNum, tab) {
  return rtMoTrucks().then(function () {
    var i = (typeof trucks !== 'undefined')
      ? trucks.findIndex(function (t) { return String(t.num) === String(truckNum); }) : -1;
    if (i < 0) { console.warn('[router] unknown truck', truckNum); return; }
    rtMoCloseDrawers('truck');
    openDrawer(i);
    return rtWaitFor(function () {
      var d = document.getElementById('drawer');
      return d && d.classList.contains('open') ? d : null;
    }).then(function () {
      var label = RT_MO_DRAWER_TAB[tab];
      /* selectDrawerNav resolves its own element from the label, so the
         second argument is deliberately omitted. */
      if (label && typeof selectDrawerNav === 'function') selectDrawerNav(label);
      else if (tab && !label) console.warn('[router] unknown mobile tab', tab);
    });
  });
}

function rtMoOpenUnit(unitId, tab) {
  return rtMoUnits().then(function () {
    var u = (typeof UNITS_DATA !== 'undefined') &&
      UNITS_DATA.find(function (x) { return x.id === unitId; });
    if (!u) { console.warn('[router] unknown unit', unitId); return; }
    rtMoCloseDrawers('unit');
    openUnitDetail(unitId);
    return rtWaitFor(function () {
      return rtVisible('units-drawer') ? 1 : null;
    }).then(function () {
      /* Unit tabs vary by status, same as desktop. udSelectNavTab takes
         the slug straight, so no label map is needed here. */
      if (tab && typeof udSelectNavTab === 'function') udSelectNavTab(tab, null);
    });
  });
}

rtRegister('mobile', function () { return rtEnsureView('mobile'); });
rtRegister('mobile/trucks', function () { return rtMoTrucks(); });
rtRegister('mobile/units',  function () { return rtMoUnits(); });

Object.keys(RT_MO_WTS).forEach(function (sub) {
  rtRegister('mobile/trucks/' + sub, function () {
    return rtMoTrucks().then(function () {
      if (typeof selectWts === 'function') selectWts(RT_MO_WTS[sub]);
    });
  });
});

/* ':truck' is registered AFTER the three literal sub-tabs, but rtMatch
   scores literals above params at equal depth, so 'mobile/trucks/cc'
   still reaches the sub-tab resolver rather than being read as a truck
   number. Order here is cosmetic. */
rtRegister('mobile/trucks/:truck',      function (p) { return rtMoOpenTruck(p.truck, null); });
rtRegister('mobile/trucks/:truck/:tab', function (p) { return rtMoOpenTruck(p.truck, p.tab); });
rtRegister('mobile/units/:unit',        function (p) { return rtMoOpenUnit(p.unit, null); });
rtRegister('mobile/units/:unit/:tab',   function (p) { return rtMoOpenUnit(p.unit, p.tab); });

/* ── Tablet ─────────────────────────────────────────────────────────
   Tablet is not mobile with a wider frame: it has its own page nav
   (tbNavTrucks/tbNavUnits), its own drawer (#tb-drawer, tbOpenTruck),
   and its own unit drawer (tbUdOpen). Same route shapes, different
   functions underneath. Tab slugs match the desktop set. ── */

function rtTbCloseDrawers(keep) {
  var d = document.getElementById('tb-drawer');
  if (keep !== 'truck' && d && d.classList.contains('open') &&
      typeof tbCloseDrawer === 'function') tbCloseDrawer();
  var ud = document.getElementById('tb-ud-drawer');
  if (keep !== 'unit' && ud && ud.classList.contains('open') &&
      typeof tbUdClose === 'function') tbUdClose();
}

function rtTbTrucks() {
  return rtEnsureView('tablet').then(function () {
    rtTbCloseDrawers(null);
    if (typeof tbNavTrucks === 'function') tbNavTrucks();
    return rtWaitFor(function () { return rtVisible('tb-content') ? 1 : null; });
  });
}

function rtTbUnits() {
  return rtEnsureView('tablet').then(function () {
    rtTbCloseDrawers(null);
    if (typeof tbNavUnits === 'function') tbNavUnits();
    return rtWaitFor(function () { return rtVisible('tb-page-units') ? 1 : null; });
  });
}

function rtTbOpenTruck(truckNum, tab) {
  return rtTbTrucks().then(function () {
    if (typeof tbOpenTruck !== 'function') return;
    rtTbCloseDrawers('truck');
    tbOpenTruck(truckNum);
    return rtWaitFor(function () {
      var d = document.getElementById('tb-drawer');
      return d && d.classList.contains('open') ? d : null;
    }).then(function () {
      if (!tab || tab === 'overview') return;
      var btn = rtFindByOnclick('#tb-drawer', 'tbDrawerTab', tab);
      if (btn) tbDrawerTab(tab, btn);
      else console.warn('[router] tab', tab, 'not available on tablet drawer');
    });
  });
}

function rtTbOpenUnit(unitId, tab) {
  return rtTbUnits().then(function () {
    if (typeof tbUdOpen !== 'function') return;
    rtTbCloseDrawers('unit');
    tbUdOpen(unitId);
    return rtWaitFor(function () {
      var d = document.getElementById('tb-ud-drawer');
      return d && d.classList.contains('open') ? d : null;
    }).then(function () {
      if (tab && typeof tbUdSelectTab === 'function') tbUdSelectTab(tab);
    });
  });
}

rtRegister('tablet', function () { return rtEnsureView('tablet'); });
rtRegister('tablet/trucks', function () { return rtTbTrucks(); });
rtRegister('tablet/units',  function () { return rtTbUnits(); });

['wts', 'overview', 'cc'].forEach(function (sub) {
  rtRegister('tablet/trucks/' + sub, function () {
    return rtTbTrucks().then(function () {
      var btn = rtFindByOnclick('#tb-page', 'tbSelectTab', sub);
      if (btn && typeof tbSelectTab === 'function') tbSelectTab(sub, btn);
    });
  });
});

rtRegister('tablet/trucks/:truck',      function (p) { return rtTbOpenTruck(p.truck, null); });
rtRegister('tablet/trucks/:truck/:tab', function (p) { return rtTbOpenTruck(p.truck, p.tab); });
rtRegister('tablet/units/:unit',        function (p) { return rtTbOpenUnit(p.unit, null); });
rtRegister('tablet/units/:unit/:tab',   function (p) { return rtTbOpenUnit(p.unit, p.tab); });

/* ── Tablet hash-writer gap ─────────────────────────────────────────
   app-06 wraps the MOBILE nav functions and hardcodes 'mobile' into
   every setHash call, so a tablet session wrote mobile/... routes, or
   nothing at all where tablet uses its own tb* functions. Validate
   replays from the stored route, so a tablet task carrying a mobile
   route would reset onto the wrong surface. Wrap the tablet functions
   the same way app-06 wraps the mobile ones. ── */
(function rtTabletHashWriters() {
  function wrap(name, parts) {
    var fn = window[name];
    if (typeof fn !== 'function' || fn.__rtHash) return;
    window[name] = function () {
      var out = fn.apply(this, arguments);
      try {
        if (typeof setHash === 'function' &&
            document.body.classList.contains('view-tablet')) {
          var p = parts.apply(this, arguments);
          if (p) setHash(p);
        }
      } catch (e) {}
      return out;
    };
    window[name].__rtHash = true;
  }

  wrap('tbNavTrucks', function () { return ['tablet', 'trucks']; });
  wrap('tbNavUnits',  function () { return ['tablet', 'units']; });
  wrap('tbNavUpdate', function () { return ['tablet', 'update']; });
  wrap('tbNavMap',    function () { return ['tablet', 'map']; });
  wrap('tbSelectTab', function (tab) { return ['tablet', 'trucks', tab]; });
  wrap('tbOpenTruck', function (num) { return ['tablet', 'trucks', num, 'overview']; });
  wrap('tbCloseDrawer', function () { return ['tablet', 'trucks']; });
  wrap('tbDrawerTab', function (tab) {
    var num = (typeof tbDrawerTruck !== 'undefined' && tbDrawerTruck) ? tbDrawerTruck.num : '';
    return num ? ['tablet', 'trucks', num, tab] : null;
  });
  wrap('tbUdOpen',      function (id) { return ['tablet', 'units', id, 'lifespan']; });
  wrap('tbUdClose',     function () { return ['tablet', 'units']; });
  wrap('tbUdSelectTab', function (tab) {
    var id = (typeof tbUdCurrentUnitId !== 'undefined') ? tbUdCurrentUnitId : '';
    return id ? ['tablet', 'units', id, tab] : null;
  });
})();

/* Page-level tablet routes for the two screens with no deeper state
   written to the hash. */
rtRegister('tablet/update', function () {
  return rtEnsureView('tablet').then(function () {
    rtTbCloseDrawers(null);
    if (typeof tbNavUpdate === 'function') tbNavUpdate();
    return rtWaitFor(function () { return rtVisible('tb-page-update') ? 1 : null; });
  });
});
rtRegister('tablet/map', function () {
  return rtEnsureView('tablet').then(function () {
    rtTbCloseDrawers(null);
    if (typeof tbNavMap === 'function') tbNavMap();
    return rtWaitFor(function () { return rtVisible('tb-page-map') ? 1 : null; });
  });
});

/* ── Hash-writer gap fix ────────────────────────────────────────────
   app-06 wraps `selectDtTab` to write the hash on desktop sub-tab
   switches, but the live function is `dtSelectTab` — the wrapper never
   fires, so a comment dropped on Overview/CC captured a stale route.
   Wrap the real one. Same wrap-don't-edit pattern as app-10's tkTab. */
(function () {
  if (typeof dtSelectTab !== 'function' || dtSelectTab.__rtWrapped) return;
  var orig = dtSelectTab;
  dtSelectTab = function (tab, el) {
    orig.call(this, tab, el);
    if (typeof setHash === 'function') setHash(['desktop', 'trucks', tab]);
  };
  dtSelectTab.__rtWrapped = true;
})();

/* app-06's dtDrawerTab wrapper guesses the truck number from hash
   position with a length<=6 test — and the slug 'logs' is 4 chars, so
   clicking the Logs tab wrote hashes like desktop/trucks/logs/logs.
   dtDrawerTruckNum is the drawer's own source of truth; rewrite the
   hash from it after the (already wrapped) original runs. */
(function () {
  if (typeof dtDrawerTab !== 'function' || dtDrawerTab.__rtHashFix) return;
  var orig = dtDrawerTab;
  dtDrawerTab = function (tab, el) {
    orig.call(this, tab, el);
    if (typeof dtDrawerTruckNum !== 'undefined' && dtDrawerTruckNum &&
        typeof setHash === 'function') {
      setHash(['desktop', 'trucks', dtDrawerTruckNum, tab]);
    }
  };
  dtDrawerTab.__rtHashFix = true;
})();

/* ◀ END APP-SPECIFIC ── route registrations */

/* ── Comments: Jump button ──────────────────────────────────────────
   comments.js already stores the route inside each pin's anchor
   (cmtAnchorParts splits it back out). The drawer renders rows in a
   deterministic order — newest first, then the active filter — so the
   wrapper below rebuilds that same list to pair each row with its
   comment, then appends a Jump button wherever the registry can
   actually resolve the stored route. Unresolvable routes (screens not
   yet registered) get no button rather than a dead one.

   Coupled to cmtDrawerRender's sort+filter. If that ordering ever
   changes, change rtCmtList() to match. */

function rtCmtList() {
  var all = cmtState.comments.slice().sort(function (a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  return all.filter(function (c) {
    if (cmtDrawerFilter === 'open') return c.status !== 'done';
    if (cmtDrawerFilter === 'done') return c.status === 'done';
    return true;
  });
}

function rtCmtJump(c) {
  var route = cmtAnchorParts(c).route;
  if (!route) return;
  cmtDrawerClose();
  rtGoTo(route).then(function () {
    /* Pins re-render on body-class mutations with a 450ms debounce;
       force it now so the flash doesn't race the debounce. */
    cmtSetVisible(true);
    cmtRenderAll();
    return rtWaitFor(function () {
      return document.querySelector('.cmt-pin[data-cmt-id="' + c.id + '"]');
    }, 2500);
  }).then(function (pin) {
    pin.classList.add('cmt-flash');
    pin.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    setTimeout(function () { pin.classList.remove('cmt-flash'); }, 2600);
  }).catch(function (e) {
    console.warn('[router] jump failed', e);
  });
}

(function rtHookCmtDrawer() {
  if (typeof cmtDrawerRender !== 'function' || cmtDrawerRender.__rtWrapped) return;
  var orig = cmtDrawerRender;
  cmtDrawerRender = function () {
    orig.apply(this, arguments);
    var listEl = document.getElementById('cmt-dlist');
    if (!listEl) return;
    var rows = listEl.querySelectorAll('.cmt-drow');
    var list = rtCmtList();
    rows.forEach(function (row, i) {
      var c = list[i];
      if (!c) return;
      var route = cmtAnchorParts(c).route;
      if (!route || !rtCanResolve(route)) return;
      var acts = row.querySelector('.cmt-dacts');
      if (!acts || acts.querySelector('[data-act="jump"]')) return;
      var btn = document.createElement('button');
      btn.className = 'cmt-dact cmt-dact-primary';
      btn.dataset.act = 'jump';
      btn.textContent = 'Jump to';
      btn.addEventListener('click', function () { rtCmtJump(c); });
      acts.insertBefore(btn, acts.firstChild);
    });
  };
  cmtDrawerRender.__rtWrapped = true;
})();

/* Flash animation for the jumped-to pin */
(function () {
  var el = document.createElement('style');
  el.textContent =
    '@keyframes rtPinFlash{0%,100%{transform:scale(1);box-shadow:0 2px 8px rgba(0,0,0,0.35);}' +
    '50%{transform:scale(1.35);box-shadow:0 0 0 6px rgba(48,105,227,0.28),0 2px 8px rgba(0,0,0,0.35);}}' +
    '.cmt-pin.cmt-flash{animation:rtPinFlash 0.65s ease-in-out 3;z-index:9655;}';
  document.head.appendChild(el);
})();

/* ▶ APP-SPECIFIC ── shell selectors (.phone-wrap, .phone, #s-desktop)
   Cut into routes.js (ships with the app) when tooling.js goes portable. */

/* ── Shell scroll guard ─────────────────────────────────────────────
   scrollIntoView() scrolls EVERY scrollable ancestor — including
   overflow:hidden ones — and the codebase calls it from 15+ places.
   When a target is mid-animation or inside a translated panel at
   measure time, the browser scrolls the .phone shell sideways to
   reach it, and with no scrollbar there is no way back: the parked
   ticket drawer (translateX just past the phone's right edge) slides
   into view looking like a mystery panel. The shell containers are
   never legitimately horizontally scrolled — tables and tab strips
   scroll their OWN inner containers — so pin them at scrollLeft 0.
   Vertical is untouched. */
(function () {
  function pin(el) {
    if (!el) return;
    if (el.scrollLeft !== 0) el.scrollLeft = 0;
    el.addEventListener('scroll', function () {
      if (el.scrollLeft !== 0) el.scrollLeft = 0;
    }, { passive: true });
  }
  pin(document.querySelector('.phone-wrap'));
  pin(document.querySelector('.phone'));
  pin(document.getElementById('s-desktop'));
})();

/* ◀ END APP-SPECIFIC ── shell scroll guard */

/* ── ?jump= deep link ───────────────────────────────────────────────
   The dashboard's see-location (and anyone pasting a link) can open
   the prototype at index.html?jump=desktop/trucks/45689/logs. Runs
   after app-06's own applyHashRoute load restore, and wins, because
   an explicit link beats a remembered hash. */
(function () {
  var q = new URLSearchParams(location.search);
  var jump = q.get('jump');
  if (!jump) return;
  /* A deep link is an authenticated context, exactly like ?test= links,
     which app-14 already skips login for. Hide the overlay the same way
     lgInit does (display + session flag) rather than calling lgDismiss,
     whose landing / onboarding side effects would race the jump. */
  (function rtSkipLogin() {
    var lg = document.getElementById('login-screen');
    if (!lg) return;
    lg.classList.add('lg-out');
    lg.style.display = 'none';
    try { sessionStorage.setItem('vfLoggedIn', '1'); } catch (e) {}
  })();
  setTimeout(function () {
    rtGoTo(jump)
      .catch(function (e) { console.warn('[router] ?jump failed', e); })
      .then(function () {
        /* A ping link keeps the boot veil up until the dot (or the
           auto-walk's own veil) takes over — the jump landing is not
           the answer the user came for, the dot is. */
        if (!q.get('ping') && window.bootVeilLift) window.bootVeilLift();
      });
  }, 400);
})();

/* ═══════════════════════════════════════════════════════════════════
   EVERY PAGE GETS A URL  (added on top of the engine above)
   ───────────────────────────────────────────────────────────────────
   What was missing, and why each piece is here:

   1  RESOLVERS. The engine only knew trucks, units and six desktop
      page-level routes. Insights, Returned Concrete, Slump Tests,
      Batch Assistant, Fleet map and Phases had no resolver at all, on
      any surface, so a pasted URL fell through to the dashboard
      fallback. All of them are registered below for desktop, tablet
      and mobile.

   2  HASH WRITERS. app-06 wraps dtNavGo to write the hash, but every
      section module since app-13 replaces window.dtNavGo and returns
      early for its own key — so navigating to Insights, Returned
      Concrete, Slump Tests or Batch Assistant wrote nothing. router.js
      loads after app-25, so window.dtNavGo here is the end of that
      wrapper chain: wrapping it once catches every key. The section
      entry points (inNav / rcNav / slNav / baNav) are wrapped too,
      because on tablet and mobile they never reach dtNavGo.

   3  HASHCHANGE. Nothing listened. applyHashRoute is a one-shot at
      load, so the back button did nothing and editing the hash by hand
      did nothing — the only way in was ?jump=. A listener closes that
      loop, guarded so the hash we just wrote does not re-drive the UI.

   Route grammar is unchanged: <surface>/<page>[/<sub>]. The raw keys
   stay canonical because comments.js has already stored routes in that
   form and those pins have to keep resolving. Readable aliases are
   registered alongside them, so #batch-assistant and #desktop/batch
   both work and neither breaks the other.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Which surface are we on ─────────────────────────────────────── */

function rtSurface() {
  var c = document.body.classList;
  if (c.contains('view-mobile')) return 'mobile';
  if (c.contains('view-tablet')) return 'tablet';
  return 'desktop';
}

/* Write a hash and remember it, so the hashchange listener can tell a
   navigation we caused from one the user caused. Prefers app-06's
   setHash when it exists so there is still one writer. */
RT.lastWritten = null;
RT.driving = false;

function rtSetHash(parts) {
  var route = parts.filter(Boolean).join('/');
  RT.lastWritten = route;
  if (typeof setHash === 'function') { setHash(parts); return; }
  try { location.hash = '#' + route; } catch (e) {}
}

/* app-06's setHash does not know about RT.lastWritten, so record every
   hash it writes as well — otherwise its own navigations would look
   like user edits and re-drive the UI a second time. */
(function rtRecordSetHash() {
  if (typeof setHash !== 'function' || setHash.__rtRecord) return;
  var orig = setHash;
  window.setHash = function (parts) {
    try { RT.lastWritten = [].concat(parts).filter(Boolean).join('/'); } catch (e) {}
    return orig.apply(this, arguments);
  };
  window.setHash.__rtRecord = true;
})();

/* ▶ APP-SPECIFIC ── section list, Batch tabs, Tickets sub-views, bare-slug aliases, and the hash writers for all of them
   Cut into routes.js (ships with the app) when tooling.js goes portable. */

/* ── The sections that had no routes ─────────────────────────────────
   Each has one entry point that dispatches by body class, so the
   resolver only has to put the right frame up and then call it. */

var RT_SECTIONS = [
  { slug:'insights', alias:'insights',          nav:'inNav', dt:'insights',
    tb:'tb-page-insights', mo:'mob-page-insights' },
  { slug:'returned', alias:'returned-concrete', nav:'rcNav', dt:'returned',
    tb:'tb-page-returned', mo:'mob-page-returned' },
  { slug:'slump',    alias:'slump-tests',       nav:'slNav', dt:'slump',
    tb:'tb-page-slump',    mo:'mob-page-slump' },
  { slug:'batch',    alias:'batch-assistant',   nav:'baNav', dt:'batch',
    tb:'tb-page-batch',    mo:'mob-page-batch' }
];

function rtOpenSection(sec, surface) {
  if (surface === 'desktop') {
    return rtEnsureDtPage(sec.dt).then(function () { rtCloseOtherDrawers(null); });
  }
  var pageId = surface === 'tablet' ? sec.tb : sec.mo;
  return rtEnsureView(surface).then(function () {
    if (typeof window[sec.nav] !== 'function') {
      console.warn('[router] no entry point', sec.nav);
      return;
    }
    window[sec.nav]();
    return rtWaitFor(function () { return rtVisible(pageId) ? 1 : null; });
  });
}

RT_SECTIONS.forEach(function (sec) {
  ['desktop', 'tablet', 'mobile'].forEach(function (surface) {
    function res() { return rtOpenSection(sec, surface); }
    rtRegister(surface + '/' + sec.slug, res);
    /* Readable alias, same resolver. */
    if (sec.alias !== sec.slug) rtRegister(surface + '/' + sec.alias, res);
  });
  /* Bare slug: no surface named, so stay on whichever frame is up. */
  rtRegister(sec.slug, function () { return rtOpenSection(sec, rtSurface()); });
  if (sec.alias !== sec.slug) {
    rtRegister(sec.alias, function () { return rtOpenSection(sec, rtSurface()); });
  }
});

/* ── Batch Assistant tabs ────────────────────────────────────────────
   The only one of the four with sub-state worth a URL: three tabs a
   batchman switches between all shift. */

var RT_BA_TABS = { live:1, acc:1, water:1 };
var RT_BA_ALIAS = { live:'live', 'batch-accuracy':'acc', 'water-buildup':'water' };

['desktop', 'tablet', 'mobile'].forEach(function (surface) {
  rtRegister(surface + '/batch/:tab', function (p) {
    var tab = RT_BA_TABS[p.tab] ? p.tab : RT_BA_ALIAS[p.tab];
    if (!tab) { console.warn('[router] unknown batch tab', p.tab); tab = 'live'; }
    var sec = RT_SECTIONS[3];
    return rtOpenSection(sec, surface).then(function () {
      if (typeof baSetTab === 'function') baSetTab(tab);
    });
  });
});

/* ── Tickets: Fleet map and Phases ───────────────────────────────────
   Desktop has its own page container per sub-view; tablet and mobile
   route all three through tvNavGo. */

var RT_TV = { tickets:'list', tfleet:'map', tphases:'phases' };
var RT_TV_ALIAS = { 'ticket-list':'tickets', 'fleet-map':'tfleet', phases:'tphases' };

Object.keys(RT_TV).forEach(function (key) {
  rtRegister('desktop/' + key, function () {
    return rtEnsureDtPage(key).then(function () { rtCloseOtherDrawers(null); });
  });
  ['tablet', 'mobile'].forEach(function (surface) {
    rtRegister(surface + '/' + key, function () {
      return rtEnsureView(surface).then(function () {
        if (typeof tvNavGo === 'function') tvNavGo(RT_TV[key]);
      });
    });
  });
});
/* 'desktop/tickets' is registered twice now — once by the original page
   list above and once here. rtMatch keeps the first best score, so the
   original wins and behaviour is unchanged. The aliases below are the
   only new names. */
Object.keys(RT_TV_ALIAS).forEach(function (alias) {
  var key = RT_TV_ALIAS[alias];
  ['desktop', 'tablet', 'mobile'].forEach(function (surface) {
    rtRegister(surface + '/' + alias, function () { return rtGoTo(surface + '/' + key); });
  });
  rtRegister(alias, function () { return rtGoTo(rtSurface() + '/' + key); });
});

/* Bare page slugs for the screens the engine already resolved, so a URL
   does not have to name the surface. */
['home', 'dashboard', 'trucks', 'units', 'update', 'map'].forEach(function (page) {
  rtRegister(page, function () { return rtGoTo(rtSurface() + '/' + page); });
});
rtRegister('all-trucks',       function () { return rtGoTo(rtSurface() + '/trucks'); });
rtRegister('software-update',  function () { return rtGoTo(rtSurface() + '/update'); });
rtRegister('fleet-update',     function () { return rtGoTo(rtSurface() + '/update'); });

/* ── Hash writers for the sections that wrote nothing ────────────────
   router.js loads after app-25, so window.dtNavGo is the end of the
   wrapper chain: every key passes through here, including the ones the
   section modules intercept and return early on. */

(function rtSectionHashWriters() {
  var DT_KEYS = { home:1, dashboard:1, trucks:1, units:1, tickets:1, tfleet:1, tphases:1,
    update:1, map:1, insights:1, returned:1, slump:1, batch:1 };

  if (typeof dtNavGo === 'function' && !dtNavGo.__rtPageHash) {
    var origNav = window.dtNavGo;
    window.dtNavGo = function (key) {
      var out = origNav.apply(this, arguments);
      if (DT_KEYS[key]) rtSetHash(['desktop', key]);
      return out;
    };
    window.dtNavGo.__rtPageHash = true;
  }

  /* On tablet and mobile these never reach dtNavGo, so they need their
     own writer. The surface is read after the call, because the entry
     point is what decides which frame ends up on screen. */
  RT_SECTIONS.forEach(function (sec) {
    var name = sec.nav;
    if (typeof window[name] !== 'function' || window[name].__rtPageHash) return;
    var orig = window[name];
    window[name] = function () {
      var out = orig.apply(this, arguments);
      rtSetHash([rtSurface(), sec.slug]);
      return out;
    };
    window[name].__rtPageHash = true;
  });

  /* Batch tabs. */
  if (typeof baSetTab === 'function' && !baSetTab.__rtPageHash) {
    var origTab = window.baSetTab;
    window.baSetTab = function (tab) {
      var out = origTab.apply(this, arguments);
      rtSetHash([rtSurface(), 'batch', tab]);
      return out;
    };
    window.baSetTab.__rtPageHash = true;
  }

  /* Tickets sub-views on tablet and mobile. */
  if (typeof tvNavGo === 'function' && !tvNavGo.__rtPageHash) {
    var TV_BACK = { list:'tickets', map:'tfleet', phases:'tphases' };
    var origTv = window.tvNavGo;
    window.tvNavGo = function (which) {
      var out = origTv.apply(this, arguments);
      var key = TV_BACK[which];
      if (key) rtSetHash([rtSurface(), key]);
      return out;
    };
    window.tvNavGo.__rtPageHash = true;
  }
})();

/* ◀ END APP-SPECIFIC ── sections and hash writers */

/* ── hashchange: back, forward, and hand-edited URLs ─────────────────
   Three guards, each for a failure this listener would otherwise cause:

     RT.driving   a resolver calls setView and nav functions, which write
                  the hash themselves; without this the listener would
                  re-enter mid-resolve.
     lastWritten  a normal click writes the hash, which fires this event.
                  Re-driving the UI to where it already is rebuilds
                  tables and flashes the screen.
     canResolve   app-06 writes hashes this file has no resolver for
                  (sub-tab state inside Map and Software Update). Those
                  are left alone rather than bounced to a fallback. */

window.addEventListener('hashchange', function () {
  var h = String(location.hash || '').replace(/^#/, '');
  if (!h) return;
  if (RT.driving) return;
  if (h === RT.lastWritten) return;
  if (!rtCanResolve(h)) return;
  RT.driving = true;
  rtGoTo(h)
    .catch(function (e) { console.warn('[router] hashchange failed', h, e); })
    .then(function () {
      RT.lastWritten = String(location.hash || '').replace(/^#/, '');
      RT.driving = false;
    });
});

/* A hash present at load with no ?jump= means someone pasted a URL or
   reloaded on a page. app-06's applyHashRoute handles trucks and units;
   anything it does not know still needs driving, and an unresolvable
   hash is left for it. Runs after the ?jump= block above, and defers to
   it — an explicit jump link wins. */
(function rtBootFromHash() {
  var q = new URLSearchParams(location.search);
  if (q.get('jump')) return;
  var h = String(location.hash || '').replace(/^#/, '');
  if (!h || !rtCanResolve(h)) return;
  /* Only take over for routes app-06's restore does not cover, so the
     two do not fight over the same screen. */
  if (/^(desktop|tablet|mobile)\/(trucks|units)(\/|$)/.test(h)) return;
  setTimeout(function () {
    RT.driving = true;
    rtGoTo(h)
      .catch(function (e) { console.warn('[router] boot route failed', h, e); })
      .then(function () {
        RT.lastWritten = String(location.hash || '').replace(/^#/, '');
        RT.driving = false;
      });
  }, 450);
})();


/* ═══ FILE: testing.js ════════════════════════════════════════════════════════════════ */

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
/* ▶ APP-SPECIFIC ── the one per-prototype setting in this file. */
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
    '  box-shadow:0 10px 32px rgba(0,0,0,0.25);z-index:11000;font-family:var(--font,sans-serif);',
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
    '.tst-bar{position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:11000;',
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
    '  background:#d3542f;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.4);z-index:9660;cursor:pointer;}',
    '.tst-ping::before{content:"";position:absolute;inset:-14px;border-radius:50%;',
    '  border:3px solid #d3542f;animation:tstping 1.4s ease-out infinite;}',
    '@keyframes tstping{from{transform:scale(0.4);opacity:1;}to{transform:scale(1.5);opacity:0;}}',
    '.tst-veil{position:fixed;inset:0;z-index:10990;backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);',
    '  background:rgba(246,244,242,0.45);display:flex;flex-direction:column;gap:12px;',
    '  align-items:center;justify-content:center;font-family:var(--font,sans-serif);}',
    '.tst-veil-msg{background:#171614;color:#fff;font-size:13px;padding:10px 20px;border-radius:100px;',
    '  box-shadow:0 8px 28px rgba(0,0,0,0.3);}',
    '.tst-toast{position:fixed;top:54px;left:50%;transform:translateX(-50%);z-index:11001;',
    '  background:#171614;color:#fff;font-family:var(--font,sans-serif);font-size:12px;',
    '  padding:8px 16px;border-radius:100px;box-shadow:0 4px 14px rgba(0,0,0,0.3);max-width:80vw;',
    '  text-align:center;}',
    '.tst-flash{position:fixed;border-radius:50%;width:34px;height:34px;border:3px solid #1f9d55;',
    '  z-index:10999;pointer-events:none;animation:tstflash 0.5s ease-out forwards;margin:-17px 0 0 -17px;}',
    '@keyframes tstflash{from{transform:scale(0.5);opacity:1;}to{transform:scale(1.6);opacity:0;}}',
    /* Heat map overlay */
    '.tst-heat-layer{position:absolute;top:0;left:0;pointer-events:none;z-index:9640;overflow:hidden;}',
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
    '  border-left:1px solid rgba(0,0,0,0.12);box-shadow:-10px 0 34px rgba(0,0,0,0.16);z-index:11000;',
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
    '  box-shadow:0 10px 28px rgba(0,0,0,0.22);padding:5px;z-index:11100;font-family:var(--font,sans-serif);}',
    '.tst-menu.open{display:block;}',
    '.tst-menu-item{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:7px;',
    '  font-size:12px;color:#171614;cursor:pointer;white-space:nowrap;}',
    '.tst-menu-item:hover{background:#f2f0ee;}',
    '.tst-menu-div{height:1px;background:rgba(0,0,0,0.08);margin:4px 6px;}',
    'body.tst-testing .tst-drawer,body.tst-testing .tst-menu{display:none !important;}',
    /* ── Research skin ──────────────────────────────────────────────
       Everything a TESTER sees has to read as moderator furniture, not
       as part of the product. Three signals do the work, and none of
       them rely on colour alone:
         1. system font, never ABC Repro
         2. squared geometry (8-10px), never Trinity pills / 16-24px
         3. indigo #4a3ec8, a hue that appears nowhere in Trinity
       The admin drawer is deliberately NOT reskinned — authors know
       what they are looking at, testers do not. */
    ':root{--tst-ink:#4a3ec8;--tst-ink-deep:#211d4d;--tst-paper:#f4f4fb;',
    '  --tst-face:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}',
    /* Session frame — a permanent, unmissable "you are being observed"
       edge. One element, pointer-events:none, removed with the mode. */
    '#tst-frame{position:fixed;inset:0;pointer-events:none;z-index:10996;',
    '  box-shadow:inset 0 0 0 2px var(--tst-ink);}',
    '#tst-frame-tag{position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:10997;',
    '  pointer-events:none;background:var(--tst-ink);color:#fff;font-family:var(--tst-face);',
    '  font-size:9.5px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;',
    '  padding:3px 12px 4px;border-radius:0 0 7px 7px;}',
    /* Scrim behind the start / finish moments */
    '#tst-scrim{position:fixed;inset:0;z-index:10994;background:rgba(23,21,52,0.42);',
    '  backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);}',
    /* Panel — the only shell a tester ever sees */
    '.tst-panel{font-family:var(--tst-face);background:var(--tst-paper);border:2px solid var(--tst-ink);',
    '  border-radius:10px;box-shadow:0 18px 44px rgba(23,21,52,0.28);gap:11px;padding:16px;}',
    '.tst-panel.tst-modal{top:50%;left:50%;right:auto;transform:translate(-50%,-50%);',
    '  width:400px;max-width:calc(100vw - 32px);max-height:calc(100vh - 48px);}',
    '.tst-eyebrow{display:flex;align-items:center;gap:6px;font-size:9.5px;font-weight:700;',
    '  letter-spacing:0.1em;text-transform:uppercase;color:var(--tst-ink);}',
    '.tst-eyebrow::before{content:"";width:6px;height:6px;border-radius:50%;',
    '  background:var(--tst-ink);animation:tstblink 1.6s infinite;}',
    '.tst-panel .tst-h{font-size:15.5px;color:var(--tst-ink-deep);letter-spacing:-0.01em;}',
    '.tst-panel .tst-sub{color:#4c4a6b;}',
    '.tst-panel .tst-item{background:#fff;border-color:rgba(74,62,200,0.20);border-radius:8px;}',
    '.tst-panel .tst-item-name{color:var(--tst-ink-deep);}',
    '.tst-panel .tst-item-meta{color:#615f80;}',
    '.tst-panel .tst-chip{border-radius:6px;border-color:rgba(74,62,200,0.35);color:var(--tst-ink-deep);}',
    '.tst-panel .tst-chip:hover{background:#eceafb;}',
    '.tst-panel .tst-chip-primary{background:var(--tst-ink);border-color:var(--tst-ink);color:#fff;}',
    '.tst-panel .tst-chip-primary:hover{background:#3d33ac;}',
    '.tst-panel .tst-cta{border-radius:6px;font-weight:600;}',
    '.tst-panel .tst-cta-dark{background:var(--tst-ink);}',
    '.tst-panel .tst-cta-dark:hover{background:#3d33ac;}',
    '.tst-panel .tst-input,.tst-panel .tst-ta{border-radius:6px;border-color:rgba(74,62,200,0.35);}',
    '.tst-panel .tst-input:focus,.tst-panel .tst-ta:focus{border-color:var(--tst-ink);}',
    '.tst-panel .tst-dev-tag{background:#e8e6f9;color:var(--tst-ink);}',
    /* A short list of what the session records, shown on the start screen */
    '.tst-note{background:#fff;border:1px dashed rgba(74,62,200,0.35);border-radius:8px;',
    '  padding:10px 12px;display:flex;flex-direction:column;gap:5px;}',
    '.tst-note-li{font-size:11.5px;color:#4c4a6b;padding-left:14px;position:relative;line-height:1.45;}',
    '.tst-note-li::before{content:"";position:absolute;left:2px;top:6px;width:5px;height:5px;',
    '  border-radius:50%;background:var(--tst-ink);}',
    /* Runner bar joins the same family: squared, system font, indigo */
    '.tst-bar{font-family:var(--tst-face);border-radius:12px;background:var(--tst-ink);',
    '  box-shadow:0 10px 30px rgba(23,21,52,0.34);}',
    '.tst-bar.tst-bar-rec{background:#1f9d55;border-radius:12px;}',
    '.tst-bar .tst-chip{border-radius:6px;}'
  ].join('\n');
  var el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
})();

/* ── IO ── */
/* Apps Script answers with an HTML page (sign-in, "unable to open",
   or a rendered stack trace) instead of JSON whenever the deployment
   or the script itself fails. r.json() on that produces the opaque
   "Unexpected token '<'" error, so read text first and, when it is
   not JSON, say what kind of page came back. */
function tstParse_(r) {
  return r.text().then(function (t) {
    try { return JSON.parse(t); }
    catch (e) {
      var kind = /accounts\.google\.com|Sign in/i.test(t) ? 'Google sign-in page (deployment access is not "Anyone")'
               : /unable to open|not found/i.test(t) ? 'Google "unable to open" page (deployment URL is archived or wrong)'
               : /Exception|Error/i.test(t) ? 'Apps Script error page (check Executions in the script editor)'
               : 'non-JSON reply';
      throw new Error('Backend returned ' + kind + ' (HTTP ' + r.status + '). First 120 chars: ' + t.slice(0, 120).replace(/\s+/g, ' '));
    }
  });
}
function tstGet(qs, cb) {
  fetch(TST_API + qs).then(tstParse_).then(cb)
    .catch(function (e) { console.warn('[testing] load failed', e); tstLoadFailed_(e); });
}

/* A failed read used to log to the console and leave "Loading\u2026" on
   screen forever, which reads as "slow" when it is actually "dead".
   Replace whichever placeholder is showing with the reason and a retry. */
function tstLoadFailed_(e) {
  ['tst-list', 'tst-results', 'tst-heat-body'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el || !/Loading/.test(el.textContent)) return;
    el.innerHTML = '<div class="tst-sub" style="color:#b3261e;">Could not reach the testing backend. ' +
      tstEsc(String(e && e.message || e)) + '</div>' +
      '<div class="tst-item-row"><button class="tst-chip" onclick="tstOpenAdminPanel()">Retry</button></div>';
  });
}
function tstPost(payload, cb) {
  fetch(TST_API, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) })
    .then(tstParse_).then(cb)
    .catch(function (e) {
      console.warn('[testing] save reply unreadable, re-reading the sheet to check whether the write landed', e);
      if (!cb) return;
      if (!tstVerifySave_(payload, e, cb)) cb({ ok: false, error: String(e) });
    });
}

/* Apps Script answers a POST with a redirect to script.googleusercontent.com,
   and that hop has been returning a 404 page while doPost itself ran and
   wrote the row. A garbled reply is therefore not evidence of a failed
   save. Re-read the sheet and look for the row we just asked for; only
   when it is genuinely absent do we report failure. "Saved" now means
   "present in the sheet", not "the reply reached us". */
function tstVerifySave_(payload, err, cb) {
  var proto = encodeURIComponent(TST_PROTOTYPE);
  var since = Date.now() - 120000;
  var fail = function () { cb({ ok: false, error: String(err) }); };
  var ok = function (row) {
    console.warn('[testing] reply was unreadable but the write is in the sheet; treating as saved', row.id);
    cb({ ok: true, id: row.id, recovered: true });
  };
  var same = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
  var a = payload.action;

  if (a === 'addWorkflow' || a === 'updateWorkflow' || a === 'setWorkflowStatus') {
    fetch(TST_API + '?action=list&prototype=' + proto + '&all=1').then(tstParse_).then(function (res) {
      var list = res.workflows || [];
      var hit = null;
      if (a === 'addWorkflow') {
        hit = list.filter(function (w) {
          return w.name === payload.name && w.instruction === payload.instruction &&
                 new Date(w.created).getTime() >= since;
        }).sort(function (x, y) { return new Date(y.created) - new Date(x.created); })[0] || null;
      } else {
        var w = list.find(function (x) { return String(x.id) === String(payload.id); });
        if (w) {
          if (a === 'setWorkflowStatus') { if (w.status === payload.status) hit = w; }
          else if ((payload.name === undefined || w.name === payload.name) &&
                   (payload.instruction === undefined || w.instruction === payload.instruction) &&
                   (payload.checkpoints === undefined || same(w.checkpoints, payload.checkpoints))) hit = w;
        }
      }
      if (hit) ok(hit); else fail();
    }).catch(fail);
    return true;
  }

  if (a === 'addSession') {
    fetch(TST_API + '?action=results&prototype=' + proto).then(tstParse_).then(function (res) {
      var rows = (res.sessions || []).filter(function (s) {
        return String(s.user) === String(payload.user) &&
               String(s.outcome) === String(payload.outcome) &&
               String(s.workflow_id || '') === String(payload.workflow_id || '') &&
               Number(s.duration_s) === Number(payload.duration_s || 0) &&
               new Date(s.timestamp).getTime() >= since;
      });
      if (rows.length) ok(rows[rows.length - 1]); else fail();
    }).catch(fail);
    return true;
  }
  return false;
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
  var s = document.getElementById('tst-scrim'); if (s) s.remove();
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

/* `modal` centres the panel over a scrim. Reserved for the moments
   that bracket a session — start screen, task list, finish — where the
   tester should be looking at us and not at the prototype. Mid-run
   panels (re-reading the task) stay docked so the screen behind them
   is still readable. */
function tstPanelShell(title, modal) {
  tstClosePanel();
  if (modal) {
    var sc = document.createElement('div');
    sc.id = 'tst-scrim'; sc.className = 'tst-ui';
    document.body.appendChild(sc);
  }
  var p = document.createElement('div');
  p.className = 'tst-panel tst-ui' + (modal ? ' tst-modal' : ''); p.id = 'tst-panel';
  p.innerHTML = '<div class="tst-eyebrow">Research session</div>' +
    '<div class="tst-h"><span>' + title + '</span><span class="tst-x" onclick="tstClosePanel()">\u00D7</span></div>';
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
  tstPaintVal();          /* re-apply the last validate pass to the fresh badges */
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

/* ── Validate — a replay, not a static scan ─────────────────────────
   The question this feature answers is a regression question: after a
   change to the prototype, does this recorded task still run? A static
   existence check can't answer it, because step 7 only exists because
   step 6 opened the drawer that holds it. Scanning a cold home screen
   for all ten steps reports six false unverifieds and gives you no way
   to tell noise from a real break.

   So validate replays. The workflow's surface is applied, each step is
   resolved with tstResolveStep (id, then text in its recorded
   container, then text anywhere) and CLICKED, and the walk continues
   into whatever that click opened. The first step that never appears
   inside the poll window is the break, reported by number and label:
   "breaks at step 7 of 10". That is the signal that means re-record.

   Real clicks means real consequences: the replay navigates, opens
   drawers, and fires whatever those paths fire. It asks before running
   and tells you to reload afterwards. Nothing else in the suite does a
   dry run, and a dry run couldn't reproduce state anyway. ── */

var tstVal = null;                /* {queue, i, cancelled} while running */

/* Results survive the panel being closed and re-rendered, which it is
   at the end of every pass, so they hang off window rather than the
   list markup. */
function tstValResults() {
  if (!window.__tstVal) window.__tstVal = {};
  return window.__tstVal;
}

function tstValidateAll() {
  if (tstVal) return;                                  /* already running */
  var queue = (tstState.workflows || []).filter(function (wf) {
    return wf.status === 'active' && tstValidatable(wf) && tstWfSteps(wf).length;
  });
  if (!queue.length) { alert('No recorded tasks to validate.'); return; }

  if (!confirm('Validate replays each recorded task by actually clicking through it. ' +
               'The prototype will navigate and anything those paths trigger will fire for real.\n\n' +
               queue.length + ' task' + (queue.length !== 1 ? 's' : '') +
               ' to replay. Reload the page afterwards to get back to a clean state.\n\nRun it?')) return;

  tstVal = { queue: queue, i: 0, cancelled: false, slow: [] };
  tstClosePanel();
  tstValNext();
}

/* The veil's own Cancel calls tstVeil(null), so a missing veil is the
   cancel signal — same convention the misclick walk uses. */
function tstValLive() {
  if (!tstVal || tstVal.cancelled) return false;
  if (!document.getElementById('tst-veil')) { tstVal.cancelled = true; return false; }
  return true;
}

function tstValNext() {
  if (!tstVal) return;
  if (tstVal.cancelled || tstVal.i >= tstVal.queue.length) return tstValFinish();

  var wf    = tstVal.queue[tstVal.i];
  var steps = tstWfSteps(wf);
  var meta  = (wf.checkpoints && wf.checkpoints[0] && wf.checkpoints[0].meta) ? wf.checkpoints[0] : null;

  tstVeil('Validating \u201C' + wf.name + '\u201D \u2014 task ' +
          (tstVal.i + 1) + ' of ' + tstVal.queue.length + '\u2026');
  tstDevApply(meta ? meta.view : 'desktop', meta ? meta.orientation : 'portrait');
  tstValReset(meta, function () { tstValWalk(wf, steps, 0); });
}

/* One task's leftover drawers should not decide the next task's verdict.
   If the workflow carries a start route and the router can reach it, go
   there first. Recordings made before routes existed have none, so the
   replay starts from wherever the previous task left off — which is
   also how a real tester run starts, so the verdict stays honest. */
/* The sign-in screen is an overlay, not a route: it never writes a hash,
   so a recording that began there stored the dashboard route underneath
   it and every replay started past the tester's first step. The recorder
   now stores whether login was showing, and every start path restores it.
   Recordings made before the flag existed have no `login` key and are
   left alone. */
function tstLoginShowing() {
  var el = document.getElementById('login-screen');
  return !!(el && el.style.display !== 'none' && !el.classList.contains('lg-out'));
}
function tstApplyStart(meta) {
  tstDevApply(meta ? meta.view : 'desktop', meta ? meta.orientation : 'portrait');
  if (meta && meta.login === true && typeof lgShow === 'function') lgShow();
}

function tstValReset(meta, then) {
  if (meta && meta.login === true && typeof lgShow === 'function') lgShow();
  var route = (meta && meta.route) || null;
  if (route && typeof rtCanResolve === 'function' && rtCanResolve(route)) {
    try {
      rtGoTo(route).then(function () { setTimeout(then, 450); },
                         function () { setTimeout(then, 450); });
      return;
    } catch (e) { /* fall through to the plain delay */ }
  }
  setTimeout(then, 550);
}

/* ── Clickability ───────────────────────────────────────────────────
   Finding the element is not the same as being able to use it. The
   install bar renders its Confirm button immediately but leaves it
   disabled for the 2.5s scan; a replay that clicks the instant it
   appears fires into a dead button, the click is swallowed, and the
   NEXT step is the one that reports the break. The flow looks broken
   at step 8 when step 7 is what actually failed.

   So the replay waits for the element to be genuinely clickable, and
   when it gives up it says which of the two things went wrong:
   never appeared, or appeared and never became usable. ── */
function tstValUsable(el) {
  if (!el) return false;
  if (el.disabled) return false;
  if (el.getAttribute && el.getAttribute('aria-disabled') === 'true') return false;
  if (el.closest && el.closest('[disabled],[aria-disabled="true"],fieldset[disabled]')) return false;
  var cs = getComputedStyle(el);
  if (cs.pointerEvents === 'none') return false;
  if (parseFloat(cs.opacity) < 0.25) return false;   /* the disabled-look pattern used across the kit */
  return true;
}

/* {el, state} so the verdict can name the reason. 'blocked' means the
   element is on screen but not usable — a tester would be just as
   stuck, so it still counts as a break, it just gets a different
   sentence. */
function tstValFind(cp) {
  var el = tstResolveStep(cp);
  if (!el) return { el: null, state: 'missing' };
  if (tstValUsable(el)) return { el: el, state: 'ok' };
  /* First match is dead — a second element with the same label may be
     the live one (tab strip plus legacy dropdown, for instance). */
  var all = document.querySelectorAll('button, a, [onclick], [id]');
  for (var k = 0; k < all.length; k++) {
    var t = tstNorm(all[k].textContent);
    var hit = (cp.eid && all[k].id === cp.eid) ||
              (t && (t === cp.text || (cp.ntext && tstDigitless(t) === cp.ntext)));
    if (hit && tstValUsable(all[k])) return { el: all[k], state: 'ok' };
  }
  return { el: el, state: 'blocked' };
}

function tstValWalk(wf, steps, i) {
  if (!tstValLive()) return tstValFinish();
  if (i >= steps.length) {
    return tstValDone(wf, { ok: true, total: steps.length });
  }
  tstVeil('Validating \u201C' + wf.name + '\u201D \u2014 step ' + (i + 1) + ' of ' + steps.length + '\u2026');

  var attempts = 0, last = 'missing';
  (function resolve() {
    if (!tstValLive()) return tstValFinish();
    var f = tstValFind(steps[i]);
    last = f.state;
    if (f.state === 'ok') {
      try { f.el.click(); } catch (e) {}
      /* A step that needed most of the window was still a pass, but a
         tester on a slow connection may not be so patient — worth
         seeing in the report. */
      if (attempts > 10) (tstVal.slow = tstVal.slow || []).push(wf.name + ' \u2014 step ' + (i + 1));
      setTimeout(function () { tstValWalk(wf, steps, i + 1); }, 650);
      return;
    }
    /* ~8s. The scan states, the reconnection animation and the drawer
       transitions all land inside this; 3s did not, which is what made
       the first pass report false breaks. */
    if (++attempts > 26) {
      return tstValDone(wf, {
        ok: false, at: i + 1, total: steps.length,
        reason: last,
        label: steps[i].text || steps[i].eid || 'step',
        cid: steps[i].cid || ''
      });
    }
    setTimeout(resolve, 300);
  })();
}

function tstValDone(wf, res) {
  tstValResults()[wf.id] = res;
  if (!tstVal) return;
  tstVal.i++;
  setTimeout(tstValNext, 350);
}

function tstValFinish() {
  var n = tstVal ? tstVal.queue.length : 0;
  var done = tstVal ? tstVal.i : 0;
  var cancelled = tstVal ? tstVal.cancelled : false;
  var slow = (tstVal && tstVal.slow) || [];
  tstVal = null;
  tstVeil(null);

  var r = tstValResults();
  var broke = 0;
  Object.keys(r).forEach(function (k) { if (r[k] && !r[k].ok) broke++; });

  tstOpenAdminPanel();
  if (slow.length) console.warn('[validate] slow steps (took over 3s to appear):\n' + slow.join('\n'));
  tstToast(cancelled
    ? 'Validate cancelled after ' + done + ' of ' + n
    : (broke ? broke + ' task' + (broke !== 1 ? 's' : '') + ' broke \u2014 re-record ' + (broke !== 1 ? 'them' : 'it')
             : 'All ' + n + ' task' + (n !== 1 ? 's' : '') + ' still run'));
  setTimeout(function () { tstToast(null); }, 5000);
}

/* Badges are painted from the cache, not during the walk, because the
   admin list is rebuilt after every pass. */
function tstPaintVal() {
  var r = window.__tstVal;
  if (!r) return;
  Object.keys(r).forEach(function (id) {
    var badge = document.getElementById('tst-val-' + id);
    var res   = r[id];
    if (!badge || !res) return;
    if (res.ok) {
      badge.className   = 'tst-badge tst-badge-ok';
      badge.textContent = 'replayed \u00B7 ' + res.total + ' steps still work';
      badge.onclick = null;
      badge.style.cursor = '';
      badge.title = 'Every step resolved and clicked through on the last validate pass.';
    } else {
      var blocked = res.reason === 'blocked';
      badge.className   = 'tst-badge tst-badge-bad';
      badge.textContent = (blocked ? 'stuck at step ' : 'breaks at step ') + res.at + ' of ' + res.total;
      badge.style.cursor = 'pointer';
      badge.title = 'Step ' + res.at + ' (\u201C' + res.label + '\u201D) ' +
        (blocked ? 'is on screen but never became clickable.' : 'never appeared.');
      badge.onclick = (function (res, blocked) {
        return function () {
          alert((blocked ? 'Stuck at step ' : 'Breaks at step ') + res.at + ' of ' + res.total + '.\n\n' +
                'Looking for: \u201C' + res.label + '\u201D' + (res.cid ? ' in ' + res.cid : '') + '\n\n' +
                (blocked
                  ? 'It is on screen but stayed disabled for 8 seconds, so the replay could not click it. ' +
                    'Either the step before it left the UI in the wrong state, or this control now waits on ' +
                    'something that never arrives. A tester would be stuck here too.'
                  : 'It never appeared within 8 seconds. Renamed, moved, or removed.') + '\n\n' +
                'Steps 1\u2013' + (res.at - 1) + ' replayed fine, so the path is intact up to there.');
        };
      })(res, blocked);
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
  /* Where the recording began. Validate replays from here so one task's
     leftover state can't fail the next one. Captured after the surface
     switch because setView writes the hash. Older workflows have no
     route and simply replay from wherever the page already is. */
  setTimeout(function () {
    if (!tstState.rec) return;
    tstState.rec.route = location.hash.replace(/^#/, '');
    tstState.rec.login = tstLoginShowing();
  }, 400);
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
  var meta = { meta: 1, view: dev.view, orientation: dev.orientation, route: rec.route || '', login: !!rec.login };
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
  tstFrameOn();
  tstFetchIP();                                   /* warm it up early */
  var url = new URL(location.href);
  tstState.user = url.searchParams.get('user') || '';
  try { if (!tstState.user) tstState.user = localStorage.getItem('tst_user') || ''; } catch (e) {}
  /* The start screen needs nothing from the network — a name field and
     a paragraph of copy. Paint it now and let the workflow list land
     underneath it; tstSaveName picks up whichever order they finish in. */
  tstStartScreen(param);
  tstState.wfLoaded = false;
  tstGet('?action=list&prototype=' + encodeURIComponent(TST_PROTOTYPE), function (res) {
    tstState.workflows = (res.ok && res.workflows) || [];
    tstState.wfLoaded = true;
    if (tstState.waitingParam !== undefined) {
      var w = tstState.waitingParam; tstState.waitingParam = undefined;
      tstOpenTesterPanel(w);
    }
  });
}

/* Indigo edge + tab that sit above the prototype for the whole
   session. Cheapest possible answer to \"is this thing part of the
   product?\" — the answer is visible without opening anything. */
/* Clears the synchronous curtain painted by the gate snippet in
   index.html's <head>. Safe to call when no gate is present. */
function tstGateOff() {
  document.documentElement.classList.remove('tst-gate');
}

function tstFrameOn() {
  if (document.getElementById('tst-frame')) return;
  var f = document.createElement('div');
  f.id = 'tst-frame'; f.className = 'tst-ui';
  var t = document.createElement('div');
  t.id = 'tst-frame-tag'; t.className = 'tst-ui'; t.textContent = 'Research session';
  document.body.appendChild(f);
  document.body.appendChild(t);
}

/* Every session opens here, name on file or not. A tester who lands
   straight inside a prototype has no way to know a session has begun,
   what is being recorded, or that the thing being judged is the design
   and not them. One screen, said once, before anything is measured. */
function tstStartScreen(param) {
  tstGateOff();
  var p = tstPanelShell('You\u2019re about to test a prototype', 1);
  p.insertAdjacentHTML('beforeend',
    '<div class="tst-sub">This is a design prototype, not the live product. Some things work, some are painted on. ' +
      'We\u2019re testing the design \u2014 there are no wrong answers and nothing you do here breaks anything.</div>' +
    '<div class="tst-note">' +
      '<div class="tst-note-li">' + (param === 'explore'
        ? 'No task this time. Click wherever you like \u2014 we learn from where you go.'
        : 'You get a short task. Do it the way you normally would.') + '</div>' +
      '<div class="tst-note-li">We record where you click and how long it takes. No screen or audio recording.</div>' +
      '<div class="tst-note-li">Stuck is useful. Give up whenever you like \u2014 that tells us more than finishing.</div>' +
      '<div class="tst-note-li">The indigo border stays up for the whole session. Anything indigo is us, not the product.</div>' +
    '</div>' +
    '<input class="tst-input" id="tst-user-input" placeholder="Your name" value="' + tstEsc(tstState.user || '') + '">' +
    '<div class="tst-item-row" style="justify-content:flex-end;">' +
    '<button class="tst-cta tst-cta-dark" onclick="tstSaveName(\'' + tstEsc(param) + '\')">Begin</button></div>');
  var x = p.querySelector('.tst-x'); if (x) x.remove();
  setTimeout(function () {
    var i = document.getElementById('tst-user-input');
    if (!i) return;
    i.focus();
    i.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); tstSaveName(param); }
    });
  }, 50);
}

/* Kept as an alias: tstStartExplore() still routes here when a free-roam
   link is opened outside test mode and we have no name yet. */
function tstAskName(param) { tstStartScreen(param); }
function tstSaveName(param) {
  var v = document.getElementById('tst-user-input').value.trim();
  if (!v) return;
  tstState.user = v;
  try { localStorage.setItem('tst_user', v); } catch (e) {}
  if (param === 'explore') { tstBeginExplore(); return; }
  tstOpenTesterPanel(param);
}

function tstOpenTesterPanel(param) {
  if (param === 'explore') { tstBeginExplore(); return; }
  /* Begin can beat the Apps Script round trip. Park the tester on a
     labelled wait rather than an empty task list. */
  if (tstState.wfLoaded === false) {
    tstState.waitingParam = param;
    var w = tstPanelShell('Loading your tasks', 1);
    w.insertAdjacentHTML('beforeend',
      '<div class="tst-sub">One moment \u2014 fetching the tasks for this session.</div>');
    return;
  }
  var wfs = tstState.workflows;
  if (param !== '1') {
    var one = wfs.find(function (w) { return w.id === param; });
    if (one) { tstIsGoal(one) ? tstBeginGoal(one) : tstBeginRun(one); return; }
  }
  var p = tstPanelShell('Tasks to try', 1);
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
  tstApplyStart(meta);

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

  var p = tstPanelShell(outcome === 'completed' ? 'Task complete \u2714' : 'Task stopped', 1);
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
    checkpoints: [{ meta: 1, kind: 'goal', view: goalDev.view, orientation: goalDev.orientation, login: tstLoginShowing() }]
  }, function (res) {
    if (!res.ok) { alert('Save failed: ' + res.error); btn.disabled = false; return; }
    tstOpenAdminPanel();
  });
}

function tstBeginGoal(wf) {
  tstClosePanel();
  var meta = (wf.checkpoints && wf.checkpoints[0] && wf.checkpoints[0].meta) ? wf.checkpoints[0] : null;
  tstApplyStart(meta);
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

  var p = tstPanelShell(outcome === 'abandoned' ? 'No problem \u2014 recorded' : 'Thanks \u2014 that\u2019s recorded', 1);
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
  tstGateOff();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tstBoot);
else tstBoot();


/* ═══ FILE: testing-questions.js ══════════════════════════════════════════════════════ */

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


/* ═══ FILE: testing-cache.js ══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   testing-cache.js — reads from the testing backend, cached

   Loads AFTER testing.js and testing-questions.js and wraps two of
   their functions. Nothing in either file changes.

   WHY
   Every tab in the Workflow testing panel started with one or two
   cold round trips to Apps Script, and the Results and Heat map tabs
   made them in sequence: the workflow list, then every session ever
   recorded for this prototype with its full click stream. Nothing was
   kept between opens, so the third time you looked at the heat map
   cost the same minute as the first.

   WHAT THIS DOES
     results    Sessions are kept in localStorage, keyed by prototype.
                Every read asks the backend only for rows newer than the
                `since` the backend handed back last time, merges them
                in by id, and stores the result. The first open in a
                fresh browser is the only full read; from then on a read
                is a few rows. Works against the old backend too: a
                reply without `since` is treated as a full snapshot and
                nothing is stored, which is exactly today's behaviour.
     list       Workflow and question lists are small and change only
     questions  when someone here saves, so they are cached for a
                minute and dropped the moment this browser posts a
                workflow or question write.
     in-flight  Identical requests share one fetch. Opening a panel
                that asks for the list and the sessions while another
                tab's request is still out does not double the load.
     warm-up    A cold `list` request also starts the `results` read,
                so the first open of Results or Heat map runs its two
                calls in parallel instead of one after the other.

   A `mode=` results request (explore-only) is rare and small and is
   passed straight through. tstVerifySave_ in testing.js reads the
   sheet directly to confirm a write and is untouched.

   localStorage can refuse a large store (quota). The wrapper then keeps
   the sessions in memory for this page only and the next reload starts
   cold again — the old behaviour, never worse than it.

   tstCacheClear() empties everything, for when a sheet was edited by
   hand and you want a clean read.

   Load order: after testing-questions.js, before app-23.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  if (typeof tstGet !== 'function' || typeof tstParse_ !== 'function' || typeof TST_API === 'undefined') return;
  if (window.tstGet.__tstCached) return;

  var origGet = window.tstGet;
  var origPost = window.tstPost;
  var LIST_TTL = 60000;
  var NS = 'tstc1:' + (typeof TST_PROTOTYPE !== 'undefined' ? TST_PROTOTYPE : 'x') + ':';
  var mem = {};
  var inflight = {};

  function lsGet(k) {
    if (mem[k]) return mem[k];
    try { var v = JSON.parse(localStorage.getItem(NS + k)); if (v) mem[k] = v; return v; } catch (e) { return null; }
  }
  function lsSet(k, v) {
    mem[k] = v;
    try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) { /* quota: memory only */ }
  }
  function lsDropPrefix(pfx) {
    Object.keys(mem).forEach(function (k) { if (k.indexOf(pfx) === 0) delete mem[k]; });
    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var k = localStorage.key(i);
        if (k && k.indexOf(NS + pfx) === 0) localStorage.removeItem(k);
      }
    } catch (e) {}
  }

  function fetchJson(qs) {
    if (inflight[qs]) return inflight[qs];
    var p = fetch(TST_API + qs).then(tstParse_);
    var done = function () { delete inflight[qs]; };
    p.then(done, done);
    inflight[qs] = p;
    return p;
  }
  function fail(e) {
    console.warn('[testing] load failed', e);
    if (typeof tstLoadFailed_ === 'function') tstLoadFailed_(e);
  }
  function kind(qs) {
    var m = /^\?action=(list|results|questions)(?:&|$)/.exec(qs);
    return m ? m[1] : null;
  }

  function cachedList(qs, cb) {
    var hit = lsGet('ttl:' + qs);
    if (hit && Date.now() - hit.t < LIST_TTL) { cb(hit.res); return; }
    fetchJson(qs).then(function (res) {
      if (res && res.ok) lsSet('ttl:' + qs, { t: Date.now(), res: res });
      cb(res);
    }).catch(fail);
  }

  function results(qs, cb) {
    var store = lsGet('ses:' + qs) || { since: null, sessions: [] };
    var q = qs + (store.since ? '&since=' + encodeURIComponent(store.since) : '');
    fetchJson(q).then(function (res) {
      if (!res || !res.ok) { cb(res); return; }
      var merged;
      if (res.partial && store.since) {
        var byId = {};
        store.sessions.forEach(function (s) { byId[String(s.id)] = s; });
        (res.sessions || []).forEach(function (s) { byId[String(s.id)] = s; });
        merged = Object.keys(byId).map(function (k) { return byId[k]; });
        /* Sheet order is chronological; keep it so nothing downstream
           notices the merge. */
        merged.sort(function (a, b) { return String(a.timestamp).localeCompare(String(b.timestamp)); });
      } else {
        merged = res.sessions || [];
      }
      if (res.since) lsSet('ses:' + qs, { since: res.since, sessions: merged });
      cb({ ok: true, sessions: merged });
    }).catch(fail);
  }

  window.tstGet = function (qs, cb) {
    var k = kind(qs);
    if (!k) return origGet(qs, cb);
    if (k === 'results') {
      if (/[&?]mode=/.test(qs)) return origGet(qs, cb);
      return results(qs, cb);
    }
    /* Cold list read: start the sessions read alongside it. */
    if (k === 'list' && typeof TST_PROTOTYPE !== 'undefined') {
      var rq = '?action=results&prototype=' + encodeURIComponent(TST_PROTOTYPE);
      if (!lsGet('ses:' + rq)) results(rq, function () {});
    }
    return cachedList(qs, cb);
  };
  window.tstGet.__tstCached = true;

  if (typeof origPost === 'function') {
    window.tstPost = function (payload) {
      var a = (payload && payload.action) || '';
      if (/Workflow/.test(a)) lsDropPrefix('ttl:?action=list');
      if (/Question/.test(a)) lsDropPrefix('ttl:?action=questions');
      return origPost.apply(this, arguments);
    };
  }

  window.tstCacheClear = function () { lsDropPrefix(''); };
})();


/* ═══ FILE: app-23-viewport-continuity.js ═════════════════════════════════════════════ */

/* ============================================================================
   app-23-viewport-continuity.js
   VIEWPORT CONTINUITY  switching device frames keeps you on the same screen
   ----------------------------------------------------------------------------
   Before this file, setView() was amnesiac. It rebuilt body.className, synced
   the pills, re-rendered the desktop and tablet tables, and dropped you
   wherever that viewport happened to have been last. Standing on the Fleet map
   in desktop and tapping Mobile put you on the mobile home screen, because
   nothing carried the answer to "which screen was I on" across the swap.

   WHY NOT ROUTES
   router.js already resolves a hash into a UI state, and app-06 already
   rewrites the first hash segment on every setView. That pairing is the right
   long-term answer, but it only covers what app-06 writes a hash for, which is
   trucks and units. Fleet map, Phases, Dashboards, Insights and Returned Loads
   write nothing, so there is no route to carry. Rather than add a hash writer
   plus three resolvers per screen before anything works at all, this file
   carries live state directly: capture before the swap, replay after it.

   THE CONTRACT
   Each screen registers one object:

     vcRegister({
       id:      'tickets',
       detect:  function (view) { ... }   returns a state object, or null
       restore: function (view, state) { ... }
     })

   detect() answers "am I the screen currently on the frame, and what is my
   state". It is asked in registration order and the first non-null wins, so
   register specific screens before general ones. restore() is handed the state
   captured in the OLD viewport and the name of the NEW one, and is responsible
   for getting there through that viewport's own entry points. It never touches
   another screen's internals.

   WHAT "ON SCREEN" MEANS
   Same test router.js settled on after the Dashboards bug: not "inline display
   is not none", which lies whenever a page is hidden by a stylesheet rather
   than by a style attribute, but "the layout engine gave it a box with size".
   Ask the browser, do not trust a class.

   SUSPENDED DURING JUMPS
   rtGoTo() resolvers call setView() themselves on their way to a route. If the
   continuity layer fired there it would restore the screen the jump is trying
   to leave, and the two would race. rtGoTo is wrapped to hold the layer down
   for the life of the jump, so a comment pin Jump, a ?jump= link and a testing
   auto-walk all behave exactly as they did before this file existed.

   REGISTERED HERE
     tickets     all three sub views (Ticket List, Fleet map, Phases) across
                 all three viewports, carrying the phase filter and search text.
     dashboards  the landing page, across all three viewports. Registered first
                 because it is where an unresolved route already lands, so an
                 unregistered Dashboards was the most visible gap of the lot.

   Everything else is unregistered and therefore unchanged: no snapshot is
   taken, no restore runs, setView behaves as it always has. Adding a screen is
   one vcRegister() call and touches nothing else.

   Load order: LAST, after every app-* file and after router.js, because it
   wraps setView (app-06), reads dtNavGo through whatever wrapper chain app-21
   ended on, and wraps rtGoTo (router.js).
   ========================================================================== */

var VC = {
  screens: [],
  suspend: 0,
  /* setView schedules tbRenderTable at 50ms. Restoring before that lands means
     the tablet repaint runs after us and can undo the nav we just did, so the
     replay waits it out. */
  delay: 90,
  debug: false
};

function vcRegister(def) {
  if (!def || !def.id || typeof def.detect !== 'function') return;
  VC.screens.push(def);
}

function vcLog() {
  if (VC.debug && window.console) console.log.apply(console, ['[vc]'].concat([].slice.call(arguments)));
}

function vcView() {
  if (typeof vpCurrentView === 'function') return vpCurrentView();
  if (document.body.classList.contains('view-mobile')) return 'mobile';
  if (document.body.classList.contains('view-tablet')) return 'tablet';
  return 'desktop';
}

/* A page is on screen only if it has a laid out box with size. */
function vcOnScreen(id) {
  var el = document.getElementById(id);
  if (!el) return false;
  var cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  var r = el.getBoundingClientRect();
  return (r.width > 0 && r.height > 0);
}

function vcVal(id) {
  var el = document.getElementById(id);
  return (el && typeof el.value === 'string') ? el.value : null;
}

function vcSetVal(id, v) {
  if (v == null || v === '') return;
  var el = document.getElementById(id);
  if (el) el.value = v;
}

/* ── Capture and replay ─────────────────────────────────────────────────── */

function vcCapture() {
  var view = vcView();
  for (var i = 0; i < VC.screens.length; i++) {
    var s = VC.screens[i], st = null;
    try { st = s.detect(view); } catch (e) { vcLog('detect threw', s.id, e); st = null; }
    if (st) { vcLog('captured', s.id, st); return { id: s.id, from: view, state: st }; }
  }
  vcLog('no screen matched, nothing to carry');
  return null;
}

function vcReplay(snap, view) {
  if (!snap) return;
  var s = null;
  for (var i = 0; i < VC.screens.length; i++) {
    if (VC.screens[i].id === snap.id) { s = VC.screens[i]; break; }
  }
  if (!s || typeof s.restore !== 'function') return;
  try { s.restore(view, snap.state); vcLog('replayed', snap.id, 'into', view); }
  catch (e) { console.warn('[vc] restore failed for', snap.id, e); }
}

/* ── setView wrapper ────────────────────────────────────────────────────── */

var vcOrigSetView = window.setView;

window.setView = function (view) {
  /* A no-op swap has nothing to carry, and a router jump owns its own
     destination. Both fall straight through to the original. */
  if (VC.suspend > 0 || view === vcView() || typeof vcOrigSetView !== 'function') {
    return vcOrigSetView ? vcOrigSetView.apply(this, arguments) : undefined;
  }

  var snap = vcCapture();
  var r = vcOrigSetView.apply(this, arguments);
  if (snap) setTimeout(function () { vcReplay(snap, view); }, VC.delay);
  return r;
};

/* ── Router jumps hold the layer down ───────────────────────────────────── */

(function vcGuardRouter() {
  if (typeof rtGoTo !== 'function') return;
  var orig = rtGoTo;
  window.rtGoTo = function () {
    VC.suspend++;
    var release = function () { VC.suspend = Math.max(0, VC.suspend - 1); };
    var p;
    try { p = orig.apply(this, arguments); }
    catch (e) { release(); throw e; }
    return Promise.resolve(p).then(
      function (v) { release(); return v; },
      function (e) { release(); throw e; }
    );
  };
})();

/* ▶ APP-SPECIFIC ── three navigation fixes for this prototype (tablet handoff, mobile tickets nav, mobile overlay release) and the Dashboards + Tickets screen registrations. Everything above this line is the engine.
   Cut into routes.js (ships with the app) when tooling.js goes portable. */

/* ══════════════════════════════════════════════════════════════════════════
   TABLET HANDOFF GUARD
   Not continuity, a real bug, fixed here only because it is the one this file
   makes reachable and a second script tag is not worth it.

   Five tablet pages hide their siblings and stash the old display values so
   they can put them back. Their sibling lists overlap almost completely, and
   each guards with "if my snapshot is null", which assumes the pages it is
   about to hide are currently in their normal state.

   The convention that keeps that assumption true is that every opener closes
   its predecessors first, and each file added one more link:

     ttkOpen       (app-08)  closes nothing
     dbTabletOpen  (app-13)  closes ttk
     amTabletOpen  (app-17)  closes ttk, db
     inTabletOpen  (app-18)  closes ttk, db, am
     rcTabletOpen  (app-21)  closes ttk, db, am, in

   ttkOpen is the hole, and it is the hole because it came first: it had no
   successors to know about. It also cannot be fixed by the wrapper hooks the
   later files installed on tbNavSetActive, because it clears the nav through
   ttkOrigNav.tbNavSetActive, the reference app-08 captured from app-05 before
   any of them wrapped it. Calling the original is right for the nav lighting
   and is exactly what skips the closes.

   So arriving at Tickets from any of the other four snapshots a set of
   siblings that are already display:none, records "none" as their resting
   state, and leaves the old page sitting on top of the tickets page that just
   opened. The next close restores everything to none and the tablet is stuck.

   This was always true and almost never reachable, since it needed a specific
   nav sequence. Viewport continuity lands you on Dashboards routinely, which
   turned a corner into the main road. Closing the loop makes ttkOpen honour
   the same convention its four successors already do.
   ══════════════════════════════════════════════════════════════════════════ */

/* Snapshot variable paired with the close function that releases it. Testing
   the variable rather than the page's visibility matters: a visibility test
   also fires during a close animation, when the handback already happened. */
var VC_TB_HOLDERS = [
  ['dbTbSnapshot', 'dbTabletClose'],
  ['amTbSnap',     'amTabletClose'],
  ['inTbSnap',     'inTabletClose'],
  ['rcTbSnap',     'rcTabletClose']
];

function vcTbReleaseAll() {
  VC_TB_HOLDERS.forEach(function (pair) {
    var held = false;
    /* Bare name, not window[...]: several of these are top-level let/var in
       classic scripts, and a let never lands on window. */
    try { held = eval('typeof ' + pair[0] + " !== 'undefined' && " + pair[0] + ' !== null'); }
    catch (e) { held = false; }
    if (held && typeof window[pair[1]] === 'function') {
      try { window[pair[1]](); } catch (e) { vcLog('release failed', pair[1], e); }
    }
  });
}

(function vcTabletHandoff() {
  if (typeof window.ttkOpen !== 'function' || window.ttkOpen.__vcWrapped) return;
  var orig = window.ttkOpen;

  window.ttkOpen = function () {
    vcTbReleaseAll();
    return orig.apply(this, arguments);
  };
  window.ttkOpen.__vcWrapped = true;
})();

/* ══════════════════════════════════════════════════════════════════════════
   MOBILE TICKETS NAV LIGHTING
   Second pre-existing gap, same reason as the tablet one: a path nobody used
   to take often enough to notice.

   Every mobile sidenav destination lights its own item. All trucks and Units
   do it in app-03, Map and Software Updates in app-04, Dashboards clears them
   in app-13. The three Tickets items do not, because app-12's tvApplyNav wraps
   its nav lighting in "if (tablet)". On tablet it moves the pill; on mobile it
   does nothing at all, so whatever was lit before stays lit and the sidenav
   claims you are still on the page you left.

   The page itself always loaded correctly. Only the highlight lied, which is
   why this survived: you close the nav to look at the page, and the stale
   highlight is only visible the next time you open it.

   Matching on the onclick attribute rather than an index keeps this correct if
   the three items are ever reordered in the markup.
   ══════════════════════════════════════════════════════════════════════════ */

var VC_MO_TK_NAV = { list: "tvNavGo('list')", map: "tvNavGo('map')", phases: "tvNavGo('phases')" };

(function vcMobileTicketsNav() {
  if (typeof window.tvNavGo !== 'function' || window.tvNavGo.__vcWrapped) return;
  var orig = window.tvNavGo;

  window.tvNavGo = function (view) {
    var r = orig.apply(this, arguments);
    /* Tablet already moves its own pill inside tvApplyNav. */
    if (!document.body.classList.contains('view-tablet')) {
      var want = VC_MO_TK_NAV[view];
      document.querySelectorAll('.sn-sub-item').forEach(function (i) {
        i.classList.remove('active');
        if (want && (i.getAttribute('onclick') || '').indexOf(want) >= 0) i.classList.add('active');
      });
    }
    return r;
  };
  window.tvNavGo.__vcWrapped = true;
})();

/* ══════════════════════════════════════════════════════════════════════════
   MOBILE OVERLAY RELEASE FOR UNITS
   Third pre-existing gap, and the tidiest evidence yet that these are copied
   conventions rather than designed ones.

   Six mobile pages are full-bleed overlays inside .phone: Tickets, Software
   Updates, Dashboards, Account, Insights, Returned Concrete. Because they
   stack on top of the section-based Diagnostic Center pages rather than
   replacing them, every non-overlay destination has to close them on the way
   past. Four files each wrote that list:

     app-13  mtkOpen, mobSwuOpen, goToAllTrucks, snGoMap
     app-17  the same four, plus dbMobileNav, dbMobileOpen
     app-18  the same six, plus amMobileOpen
     app-21  the same seven, plus inMobileOpen

   Every list grew at the end and every list is missing the same entry:
   openUnits. So Units is the one Diagnostic Center destination that leaves an
   overlay standing, and the overlay wins because it is painted on top. The
   nav updates, the hash updates, the page underneath changes, and none of it
   is visible.

   Reachable before this file only by opening an overlay and then picking Units
   specifically. Continuity lands you on the Dashboards overlay every time you
   change frames, so it is now the first thing you hit.

   One release function rather than a sixth copy of the list: openUnits hands
   back every overlay, whichever one happens to be up.
   ══════════════════════════════════════════════════════════════════════════ */

var VC_MO_OVERLAY_CLOSERS = [
  'mtkClose', 'mobSwuClose', 'dbMobileClose',
  'amMobileClose', 'inMobileClose', 'rcMobileClose'
];

function vcMoReleaseAll() {
  VC_MO_OVERLAY_CLOSERS.forEach(function (fn) {
    if (typeof window[fn] === 'function') {
      try { window[fn](); } catch (e) { vcLog('mobile release failed', fn, e); }
    }
  });
}

(function vcHookOpenUnits() {
  if (typeof window.openUnits !== 'function' || window.openUnits.__vcWrapped) return;
  var orig = window.openUnits;

  window.openUnits = function () {
    if (!document.body.classList.contains('view-desktop')) vcMoReleaseAll();
    return orig.apply(this, arguments);
  };
  window.openUnits.__vcWrapped = true;
})();

/* ══════════════════════════════════════════════════════════════════════════
   SCREEN: Dashboards
   The simplest possible registration, and the one that matters most, since
   Dashboards is both the post-login landing and the fallback for any route the
   router cannot restore. Unregistered, a swap out of Dashboards fell through
   to whatever the target viewport defaults to, which on mobile is All Trucks.

   There is no sub state to carry: the layout is a single dbLayout persisted to
   localStorage, so it is already the same board in every frame. Detecting
   simply asks whether this viewport's dashboard page has a box, and restoring
   calls that viewport's own opener, the same three the login screen uses.
   ══════════════════════════════════════════════════════════════════════════ */

var VC_DB_PAGE = { desktop: 'dt-page-dashboard', tablet: 'tb-page-dashboard', mobile: 'mob-page-dashboard' };

vcRegister({
  id: 'dashboards',

  detect: function (view) {
    return vcOnScreen(VC_DB_PAGE[view]) ? {} : null;
  },

  restore: function (view) {
    if (view === 'mobile')      { if (typeof dbMobileOpen === 'function') dbMobileOpen(); return; }
    if (view === 'tablet')      { if (typeof dbTabletOpen === 'function') dbTabletOpen(); return; }
    if (typeof dtNavGo === 'function') dtNavGo('dashboard');
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   SCREEN: Tickets
   The section has three sub views and each viewport reaches them differently.
   Desktop routes to three sibling pages through dtNavGo. Mobile and tablet
   have one page with a segmented control, and tvNavGo already reads the body
   class to decide which frame it is talking about, so one call covers both.
   ══════════════════════════════════════════════════════════════════════════ */

/* Desktop page per sub view, checked in this order. */
var VC_TK_PAGE = { list: 'dt-page-tickets', map: 'dt-page-tfleet', phases: 'dt-page-tphases' };

/* dtNavGo key per sub view. */
var VC_TK_NAV = { list: 'tickets', map: 'tfleet', phases: 'tphases' };

/* Each view has its own search box. Desktop has one per page; the device
   frames share a single box across all three sub views. */
var VC_TK_SEARCH = {
  desktop: { list: 'tk-search-input', map: 'tf-search-input', phases: 'tp-search-input' },
  mobile:  { list: 'mtk-search', map: 'mtk-search', phases: 'mtk-search' },
  tablet:  { list: 'ttk-search', map: 'ttk-search', phases: 'ttk-search' }
};

/* One filter, three names. This is the whole reason a mapping layer beats a
   refactor: nothing in the codebase declares these equivalent, so something
   has to, and it may as well be four lines. */
function vcTkPhaseGet(view) {
  try {
    if (view === 'mobile') return (typeof mtkPhaseFilter !== 'undefined') ? mtkPhaseFilter : null;
    if (view === 'tablet') return (typeof ttkPhaseFilter !== 'undefined') ? ttkPhaseFilter : null;
    return (typeof tkDeskPhase !== 'undefined') ? tkDeskPhase : null;
  } catch (e) { return null; }
}

function vcTkPhaseSet(view, phase) {
  if (phase === undefined) return;
  try {
    if (view === 'mobile')      { if (typeof mtkPhaseFilter !== 'undefined') mtkPhaseFilter = phase; }
    else if (view === 'tablet') { if (typeof ttkPhaseFilter !== 'undefined') ttkPhaseFilter = phase; }
    else                        { if (typeof tkDeskPhase   !== 'undefined') tkDeskPhase   = phase; }
  } catch (e) { vcLog('phase set failed', view, e); }
}

/* Same repaint tkSetPhase does, minus the toggle. Setting the variable without
   this leaves the filter chip and the rows disagreeing. */
function vcTkRepaintDesktop(sub) {
  if (typeof tkFiltersRender === 'function') tkFiltersRender();
  if (typeof tkRebuildTable === 'function') tkRebuildTable();
  if (sub === 'phases' && typeof tpRender === 'function') tpRender();
  if (sub === 'map' && typeof tfRender === 'function') tfRender();
}

vcRegister({
  id: 'tickets',

  detect: function (view) {
    if (view === 'desktop') {
      var sub = null;
      ['map', 'phases', 'list'].forEach(function (k) {
        if (!sub && vcOnScreen(VC_TK_PAGE[k])) sub = k;
      });
      if (!sub) return null;
      return { sub: sub, phase: vcTkPhaseGet('desktop'), q: vcVal(VC_TK_SEARCH.desktop[sub]) };
    }

    var pageId = (view === 'tablet') ? 'tb-page-tickets' : 'mob-page-tickets';
    if (!vcOnScreen(pageId)) return null;

    /* app-12 keeps the segmented control's position in TV.m / TV.t. */
    var key = (view === 'tablet') ? 't' : 'm';
    var sub2 = (typeof TV !== 'undefined' && TV[key] && TV[key].view) ? TV[key].view : 'list';
    return { sub: sub2, phase: vcTkPhaseGet(view), q: vcVal(VC_TK_SEARCH[view][sub2]) };
  },

  restore: function (view, st) {
    var sub = st.sub || 'list';
    vcTkPhaseSet(view, st.phase);

    if (view === 'desktop') {
      if (typeof dtNavGo === 'function') dtNavGo(VC_TK_NAV[sub] || 'tickets');
      vcSetVal(VC_TK_SEARCH.desktop[sub], st.q);
      vcTkRepaintDesktop(sub);
      return;
    }

    /* tvNavGo picks the frame off the body class, which setView has already
       swapped, so one call serves mobile and tablet. It opens the page, moves
       the segmented control and lights the nav pill. */
    if (typeof tvNavGo === 'function') tvNavGo(sub);
    else if (view === 'tablet' && typeof ttkOpen === 'function') ttkOpen();
    else if (typeof mtkOpen === 'function') mtkOpen();

    /* tvNavGo defers its tablet half by a tick, so the search text goes in
       behind it rather than into a box that is about to be rebuilt. */
    setTimeout(function () {
      vcSetVal(VC_TK_SEARCH[view][sub], st.q);
      if (view === 'tablet') { if (typeof ttkRender === 'function') ttkRender(); }
      else                   { if (typeof mtkRender === 'function') mtkRender(); }
    }, 40);
  }
});
