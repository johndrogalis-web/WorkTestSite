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
  visible: true,        /* pins shown (on by default) */
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
    '  display:flex;align-items:center;justify-content:center;',
    '  font-family:var(--font,sans-serif);font-size:12px;font-weight:600;',
    '  box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:pointer;z-index:1200;',
    '  border:2px solid #fff;user-select:none;}',
    '.cmt-pin.cmt-done{background:#8a8d94;}',
    '.cmt-pin.cmt-done::after{content:"";position:absolute;top:-4px;right:-4px;width:12px;height:12px;',
    '  border-radius:50%;background:#1f9d55;border:2px solid #fff;}',
    'body.cmt-hidden .cmt-pin{display:none;}',
    /* Composer + bubble share a card look */
    '.cmt-card{position:absolute;width:260px;background:#fff;border:1px solid rgba(0,0,0,0.12);',
    '  border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,0.22);z-index:1450;',
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
    '.cmt-hint{position:fixed;top:54px;left:50%;transform:translateX(-50%);z-index:2000;',
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
  document.body.classList.toggle('cmt-mode', cmtState.mode);
  var btn = document.getElementById('cmt-btn');
  if (btn) btn.classList.toggle('cmt-armed', cmtState.mode);
  cmtHint(cmtState.mode ? 'Click anywhere in the prototype to drop a comment (Esc to cancel)' : null);
  if (!cmtState.mode) cmtCloseCard();
}
function cmtToggleVisible() {
  cmtState.visible = !cmtState.visible;
  document.body.classList.toggle('cmt-hidden', !cmtState.visible);
  var eye = document.getElementById('cmt-eye');
  if (eye) eye.classList.toggle('cmt-eye-off', !cmtState.visible);
  if (!cmtState.visible) cmtCloseCard();
}
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
      cmtPost({
        action: 'add', name: name, view: ctx.view, orientation: ctx.orientation,
        page: drop.container.id || 'phone', subtab: ctx.subtab,
        x_pct: drop.x_pct, y_pct: drop.y_pct, anchor: drop.anchor, comment: text
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
  card.querySelectorAll('.cmt-meta')[1].textContent = c.anchor || '';

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
  });
}

/* Re-render on view/orientation change — container sizes shift */
(function () {
  var mo = new MutationObserver(function () {
    clearTimeout(window.__cmtRerenderT);
    window.__cmtRerenderT = setTimeout(cmtRenderAll, 450);
  });
  mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cmtRefresh);
else cmtRefresh();
