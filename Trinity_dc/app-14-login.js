/* ============================================================================
   app-14-login.js
   LOGIN SCREEN — the prototype's entry point
   ----------------------------------------------------------------------------
   Built from Trinity node 3208:172786. Desktop is the two-pane layout: a
   translucent card centered in the left half, the product image filling the
   right. Tablet and mobile stack it — form block on top, image below — which
   is what the frames in the design show.

   Two deliberate departures from the Figma:
     - The primary button is lime in the file. That is the outdated accent.
       Per the Trinity dialect it is blue in light mode and lime only in dark,
       so the CTA reads var(--blue) with white text and flips under body.dark.
     - The image is the hosted asset on GitHub Pages rather than the Figma
       export, since the export URL expires.

   The overlay lives inside .phone so it inherits the device frame at every
   viewport — no separate desktop/tablet/mobile copies of the markup, the same
   node just relayouts off body.view-*.

   Skipped entirely when a workflow-testing session is running (?test=), since
   those links are meant to drop a tester straight into a task.
   ========================================================================== */

function lgDismiss() {
  var el = document.getElementById('login-screen');
  if (!el) return;
  el.classList.add('lg-out');
  setTimeout(function () { el.style.display = 'none'; }, 260);
  try { sessionStorage.setItem('vfLoggedIn', '1'); } catch (e) {}
  /* First-timers get the workspace wizard; everyone else lands on the board
     they already built. app-15 owns that decision. */
  if (typeof obMaybe === 'function') obMaybe();
  else lgLand();
}

/* Signing in lands on Dashboards, whichever frame you are in. Each viewport
   has its own router: desktop goes through the wrapped dtNavGo, tablet and
   mobile through app-13's own entry points. */
function lgLand() {
  var b = document.body;
  try {
    if (b.classList.contains('view-mobile')) {
      if (typeof dbMobileOpen === 'function') dbMobileOpen();
    } else if (b.classList.contains('view-tablet')) {
      if (typeof dbTabletOpen === 'function') dbTabletOpen();
    } else {
      if (typeof dtNavGo === 'function') dtNavGo('dashboard');
    }
  } catch (e) { /* never trap the user behind a failed landing */ }
}

/* Sign back out to demo the screen again without a full reload. */
function lgShow() {
  var el = document.getElementById('login-screen');
  if (!el) return;
  el.classList.remove('lg-out');
  el.style.display = 'flex';
  try { sessionStorage.removeItem('vfLoggedIn'); } catch (e) {}
}

function lgKey(e) { if (e.key === 'Enter') lgDismiss(); }

(function lgInit() {
  var el = document.getElementById('login-screen');
  if (!el) return;
  var testing = /[?&](test|explore)=/.test(location.search);
  var seen = false;
  try { seen = sessionStorage.getItem('vfLoggedIn') === '1'; } catch (e) {}
  if (testing || seen) { el.style.display = 'none'; return; }
  el.style.display = 'flex';
})();
