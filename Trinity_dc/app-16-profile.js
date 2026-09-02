/* ============================================================================
   app-16-profile.js
   MY PROFILE — account panel behind the Profile item in every viewport
   ----------------------------------------------------------------------------
   Three tabs: Personal Information, Preferences, Notifications. Opens from the
   Profile row in the desktop rail, the tablet nav panel, and the mobile side
   nav, so there is one panel rather than three copies.

   Departures from the Figma, all deliberate:
     - Save Password is lime in the file. Lime is the outdated accent: blue in
       light mode, lime only on dark. Same correction as login and setup.
     - No photograph. The avatar is a tinted circle with the user's initials,
       colour picked deterministically from the name so it never changes
       between sessions.
     - Dark Mode is a live control, not a mock toggle. It drives the suite's
       own toggleDarkMode(), so the whole UI flips and the viewport bar's
       switch stays in sync.
     - Strictly Necessary Cookies reads locked-on and disabled rather than the
       off state drawn in the file, since a cookie category you cannot decline
       should not present an affordance that says you can.
     - The Notifications tab is empty in the file; it is populated here from
       ticket and truck data so the list has something to show.

   Load order: after app-13 (reads ticket/truck data) and app-15 (reads the
   role chosen during setup).
   ========================================================================== */

/* ── Identity ─────────────────────────────────────────────────────────────── */

var PF_USER = {
  first: 'John', last: 'Drogalis',
  company: (typeof VF_COMPANY !== 'undefined') ? VF_COMPANY : 'Cemex AZ',
  plant: (typeof VF_HOME_PLANT !== 'undefined') ? VF_HOME_PLANT : 'Phoenix Central',
  phone: '602-298-1498', email: 'john.drogalis@cemex.com',
  address: '2201 East Camelback Road, Phoenix, AZ, 85016',
  lastLogin: 'November 17, 2025 - 9:11am'
};

var PF_ROLE_LABEL = { dispatch:'Dispatch', qc:'Quality control', manager:'Manager', success:'Customer success' };

function pfRole() {
  var r = (typeof obPick !== 'undefined' && obPick.role) ? obPick.role : null;
  if (!r) {
    try { r = JSON.parse(localStorage.getItem('vfOnboard1') || '{}').role; } catch (e) {}
  }
  return PF_ROLE_LABEL[r] || 'Dispatch';
}

function pfInitials() { return (PF_USER.first.charAt(0) + PF_USER.last.charAt(0)).toUpperCase(); }

/* Deterministic tint so the avatar is stable across sessions. */
var PF_AVATAR_COLORS = ['#3069e3', '#7a3fb8', '#1e7d6b', '#b5442e', '#2f6ea5', '#8a5a1f'];
function pfAvatarColor() {
  var seed = (typeof dbHash === 'function') ? dbHash(PF_USER.first + PF_USER.last) : 7;
  return PF_AVATAR_COLORS[seed % PF_AVATAR_COLORS.length];
}

/* ── Notification feed ────────────────────────────────────────────────────── */

function pfNotifications() {
  var tks = (typeof dbTickets === 'function') ? dbTickets() : [];
  var trk = (typeof dbCondRows === 'function') ? dbCondRows(4) : [];
  var out = [];

  if (tks[0]) out.push({ sev:'err', when:'9 min ago', group:'Today',
    title:'Manual test outside tolerance',
    body:'Manual test differs from Verifi reading by more than the allowed tolerance for Ticket ' + tks[0].ticket.replace('TKT-', '') + '.', unread:true });

  if (trk[0]) out.push({ sev:'err', when:'24 min ago', group:'Today',
    title:'Truck ' + trk[0].num + ' needs attention',
    body:(trk[0].err || 0) + ' active alerts and ' + (trk[0].wrn || 0) + ' warnings reported across drum and discharge sensors.', unread:true });

  out.push({ sev:'info', when:'1 hr ago', group:'Today',
    title:'Plant efficiency report ready',
    body:'New monthly Plant efficiency report ready for review. All time high efficiency at 89%.', unread:true });

  if (tks[3]) out.push({ sev:'wrn', when:'3 hrs ago', group:'Today',
    title:'Water added above target',
    body:'Ticket ' + tks[3].ticket.replace('TKT-', '') + ' for ' + tks[3].customer + ' left the plant with 0.3 gal/yd\u00b3 added after batching.', unread:false });

  if (trk[1]) out.push({ sev:'wrn', when:'Yesterday', group:'Earlier',
    title:'Software update pending',
    body:'Truck ' + trk[1].num + ' is running TC3 3.04.028 and is scheduled for the next maintenance window.', unread:false });

  out.push({ sev:'info', when:'2 days ago', group:'Earlier',
    title:'Scheduled maintenance confirmed',
    body:'20 trucks are booked into the maintenance queue for next week. No dispatch impact expected.', unread:false });

  out.push({ sev:'info', when:'4 days ago', group:'Earlier',
    title:'Batch scorecard published',
    body:'64% of loads landed within range across all plants. Plant A is leading on variability.', unread:false });

  return out;
}

var pfReadAll = false;

/* ── Icons ────────────────────────────────────────────────────────────────── */

function pfIconLock() { return '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2.5" y="6" width="9" height="6.5" rx="1.6" stroke="currentColor" stroke-width="1.2"/><path d="M4.6 6V4.4a2.4 2.4 0 0 1 4.8 0V6" stroke="currentColor" stroke-width="1.2"/></svg>'; }
function pfIconEye(off) {
  return off
    ? '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.4-3.6 6-3.6S14 8 14 8s-2.4 3.6-6 3.6S2 8 2 8z" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="1.7" stroke="currentColor" stroke-width="1.2"/><path d="M3 13 13 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>'
    : '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.4-3.6 6-3.6S14 8 14 8s-2.4 3.6-6 3.6S2 8 2 8z" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="1.7" stroke="currentColor" stroke-width="1.2"/></svg>';
}

function pfSwitch(id, on, opts) {
  opts = opts || {};
  return '<button class="pf-switch' + (on ? ' on' : '') + (opts.locked ? ' locked' : '') + '" id="' + id + '"'
    + (opts.locked ? ' disabled title="Required for the product to function"' : ' onclick="' + (opts.onclick || ('pfToggle(\'' + id + '\')')) + '"')
    + '><span class="pf-knob"></span></button>';
}

/* ── Panel ────────────────────────────────────────────────────────────────── */

var pfTab = 'info';
var pfCookies = { marketing:true, functional:true, necessary:true, performance:true };
var pfPassShown = { cur:false, nw:false };

function pfOpen(tab) {
  var host = document.getElementById('pf-screen');
  if (!host) return;
  if (tab) pfTab = tab;
  host.style.display = 'flex';
  pfRender();
}

function pfClose() {
  var host = document.getElementById('pf-screen');
  if (!host) return;
  host.classList.add('pf-out');
  setTimeout(function () { host.style.display = 'none'; host.classList.remove('pf-out'); }, 200);
}

function pfGoTab(t) {
  pfTab = t;
  var body = document.getElementById('pf-body');
  if (!body) { pfRender(); return; }
  body.innerHTML = pfTabBody();
  body.scrollTop = 0;
  document.querySelectorAll('#pf-screen .pf-tab').forEach(function (el) {
    el.classList.toggle('on', el.dataset.tab === t);
  });
}

function pfToggle(id) {
  var key = id.replace('pf-ck-', '');
  pfCookies[key] = !pfCookies[key];
  var el = document.getElementById(id);
  if (el) el.classList.toggle('on', pfCookies[key]);
}

/* Real theme switch — drives the suite's own toggle so the viewport bar and
   any saved onboarding preference stay in agreement. */
function pfToggleTheme() {
  if (typeof toggleDarkMode === 'function') toggleDarkMode();
  else document.body.classList.toggle('dark');
  var dark = document.body.classList.contains('dark');
  var el = document.getElementById('pf-theme');
  if (el) el.classList.toggle('on', dark);
  try {
    var st = JSON.parse(localStorage.getItem('vfOnboard1') || '{}');
    st.theme = dark ? 'dark' : 'light';
    localStorage.setItem('vfOnboard1', JSON.stringify(st));
  } catch (e) {}
  if (typeof obPick !== 'undefined') obPick.theme = dark ? 'dark' : 'light';
}

function pfShowPass(which) {
  pfPassShown[which] = !pfPassShown[which];
  var inp = document.getElementById(which === 'cur' ? 'pf-pass-cur' : 'pf-pass-new');
  var btn = document.getElementById(which === 'cur' ? 'pf-eye-cur' : 'pf-eye-new');
  if (inp) inp.type = pfPassShown[which] ? 'text' : 'password';
  if (btn) btn.innerHTML = pfIconEye(!pfPassShown[which]);
}

function pfMarkAllRead() { pfReadAll = true; pfRender(); }

function pfRender() {
  var host = document.getElementById('pf-screen');
  if (!host) return;

  var tabs = [['info', 'Personal Information'], ['prefs', 'Preferences'], ['notes', 'Notifications']];
  var tabBar = '<div class="pf-tabs">' + tabs.map(function (t) {
    return '<button class="pf-tab' + (pfTab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '" onclick="pfGoTab(\'' + t[0] + '\')">' + t[1] + '</button>';
  }).join('') + '</div>';

  host.innerHTML =
    '<div class="pf-scrim" onclick="pfClose()"></div>'
    + '<div class="pf-panel">'
      + '<div class="pf-head"><div class="pf-title">My Profile</div>'
        + '<button class="pf-x" onclick="pfClose()">&#215;</button></div>'
      + tabBar
      + '<div class="pf-body" id="pf-body">' + pfTabBody() + '</div>'
    + '</div>';
}

/* Tab content only — the drawer shell around it stays mounted. */
function pfTabBody() {
  var body = '';

  /* ── Personal information ── */
  if (pfTab === 'info') {
    body =
      '<div class="pf-id">'
        + '<div class="pf-id-left">'
          + '<div class="pf-avatar" style="background:' + pfAvatarColor() + ';">' + pfInitials() + '</div>'
          + '<button class="pf-link pf-edit">Edit</button>'
        + '</div>'
        + '<div class="pf-id-body">'
          + '<div class="pf-id-name">' + PF_USER.first + ' ' + PF_USER.last + '<span class="pf-role">' + pfRole() + '</span></div>'
          + '<div class="pf-id-line">' + PF_USER.company + '</div>'
          + '<div class="pf-id-line">' + PF_USER.plant + '</div>'
          + '<div class="pf-id-line pf-dim">Last Log In: ' + PF_USER.lastLogin + '</div>'
        + '</div>'
      + '</div>'

      + '<div class="pf-h2">Contact Information</div>'
      + '<div class="pf-grid">'
        + '<div>'
          + '<div class="pf-field"><label class="pf-label">Phone number</label>'
            + '<div class="pf-row"><input class="pf-input" value="' + PF_USER.phone + '"><button class="pf-link">Update</button></div></div>'
          + '<div class="pf-field"><label class="pf-label">Email</label>'
            + '<div class="pf-row"><input class="pf-input" value="' + PF_USER.email + '"><button class="pf-link">Update</button></div></div>'
        + '</div>'
        + '<div class="pf-field"><label class="pf-label">Address</label>'
          + '<div class="pf-static">' + PF_USER.address + '</div></div>'
      + '</div>'

      + '<div class="pf-h2">Update Password</div>'
      + '<div class="pf-pass">'
        + '<div class="pf-inputwrap"><span class="pf-in-icon">' + pfIconLock() + '</span>'
          + '<input id="pf-pass-cur" class="pf-input pf-input-icon" type="password" placeholder="Current password">'
          + '<button class="pf-in-eye" id="pf-eye-cur" onclick="pfShowPass(\'cur\')">' + pfIconEye(true) + '</button></div>'
        + '<div class="pf-inputwrap"><span class="pf-in-icon">' + pfIconLock() + '</span>'
          + '<input id="pf-pass-new" class="pf-input pf-input-icon" type="password" placeholder="New password">'
          + '<button class="pf-in-eye" id="pf-eye-new" onclick="pfShowPass(\'nw\')">' + pfIconEye(true) + '</button></div>'
        + '<button class="pf-cta">Save Password</button>'
        + '<div class="pf-note">Can\u2019t remember your current password?</div>'
        + '<button class="pf-link">Reset your password via email</button>'
      + '</div>';
  }

  /* ── Preferences ── */
  if (pfTab === 'prefs') {
    var dark = document.body.classList.contains('dark');
    body =
      '<div class="pf-h2">Preferences</div>'
      + '<div class="pf-field"><label class="pf-label">Language</label>'
        + '<div class="pf-select">' + vfDd({ id:'pf-dd-lang', options:[
            { v:'en-US', label:'\u{1F1FA}\u{1F1F8}\u2002English - US' }, { v:'en-GB', label:'\u{1F1EC}\u{1F1E7}\u2002English - UK' },
            { v:'es', label:'\u{1F1F2}\u{1F1FD}\u2002Espa\u00f1ol' }, { v:'fr', label:'\u{1F1EB}\u{1F1F7}\u2002Fran\u00e7ais' },
            { v:'pt', label:'\u{1F1E7}\u{1F1F7}\u2002Portugu\u00eas' }], value:'en-US', search:false }) + '</div></div>'

      + '<div class="pf-h2">Theme</div>'
      + '<div class="pf-toggle-row"><div><div class="pf-toggle-lbl">Dark Mode</div>'
        + '<div class="pf-toggle-sub">Switches the whole interface, not just this panel.</div></div>'
        + pfSwitch('pf-theme', dark, { onclick:'pfToggleTheme()' }) + '</div>'

      + '<div class="pf-h2">Manage Cookies</div>'
      + [['marketing','Marketing Cookies', false], ['functional','Functional Cookies', false],
         ['necessary','Strictly Necessary Cookies', true], ['performance','Performance Cookies', false]].map(function (c) {
          return '<div class="pf-toggle-row"><div class="pf-toggle-lbl">' + c[1] + (c[2] ? '<span class="pf-req">Always on</span>' : '') + '</div>'
            + pfSwitch('pf-ck-' + c[0], pfCookies[c[0]], { locked: c[2] }) + '</div>';
        }).join('');
  }

  /* ── Notifications ── */
  if (pfTab === 'notes') {
    var list = pfNotifications();
    var unread = list.filter(function (n) { return n.unread && !pfReadAll; }).length;
    var groups = ['Today', 'Earlier'];
    body = '<div class="pf-notes-head"><div class="pf-h2 pf-h2-flush">Notifications'
      + (unread ? '<span class="pf-count">' + unread + '</span>' : '') + '</div>'
      + (unread ? '<button class="pf-quiet" onclick="pfMarkAllRead()">Mark all as read</button>' : '') + '</div>'
      + groups.map(function (g) {
          var rows = list.filter(function (n) { return n.group === g; });
          if (!rows.length) return '';
          return '<div class="pf-group">' + g + '</div>' + rows.map(function (n) {
            var isUnread = n.unread && !pfReadAll;
            return '<div class="pf-note-row' + (isUnread ? ' unread' : '') + '">'
              + '<span class="pf-sev pf-sev-' + n.sev + '"></span>'
              + '<div class="pf-note-body"><div class="pf-note-title">' + n.title + '</div>'
              + '<div class="pf-note-text">' + n.body + '</div></div>'
              + '<div class="pf-note-meta"><span class="pf-note-when">' + n.when + '</span>'
              + (isUnread ? '<span class="pf-unread-dot"></span>' : '') + '</div></div>';
          }).join('');
        }).join('');
  }

  return body;
}

/* Mobile and tablet open it through their own nav, which must close first. */
function pfNav() {
  if (typeof closeNav === 'function' && document.body.classList.contains('view-mobile')) closeNav();
  if (typeof tbNavClose === 'function' && document.body.classList.contains('view-tablet')) tbNavClose();
  pfOpen();
}
