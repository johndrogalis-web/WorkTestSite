/* Loads a tree (base/ or bund/) in jsdom, drives the Dashboards surface the
   same way on both, and prints a JSON snapshot so the two runs can be diffed.
   Usage: node verify-dashboard.js base|bund */
const { JSDOM } = require('jsdom'); const fs = require('fs'); const path = require('path');
const dir = path.resolve(process.argv[2] || 'base');
const errors = [];
let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
/* Same strip testdrawer.js does: no CDN, no network tooling. */
html = html.replace(/<script src="https:[^"]*"[^>]*><\/script>/g, '')
           .replace(/<script src="(comments|testing|testing-questions)\.js"><\/script>/g, '')
           .replace(/<link[^>]*>/g, '');
/* Inline every local script so the page can run under an http origin
   (localStorage needs one) without a server. */
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  const p = path.join(dir, src);
  if (!fs.existsSync(p)) { errors.push('missing script: ' + src); return ''; }
  return '<script>\n//# file ' + src + '\n' + fs.readFileSync(p, 'utf8') + '\n</script>';
});
const dom = new JSDOM(html, {
  runScripts: 'dangerously', pretendToBeVisual: true,
  url: 'http://localhost/index.html',
  beforeParse(w) {
    w.L = undefined;
    w.requestAnimationFrame = f => setTimeout(f, 0);
    w.matchMedia = () => ({ matches: false, addListener() {}, addEventListener() {} });
    w.HTMLCanvasElement.prototype.getContext = () => null;
    w.scrollTo = () => {};
    w.Element.prototype.scrollIntoView = () => {};
  }
});
const w = dom.window, d = w.document;
w.addEventListener('error', e => errors.push(String(e.message)));
dom.virtualConsole && dom.virtualConsole.on && dom.virtualConsole.on('jsdomError', e => errors.push('jsdom:' + e.message));

setTimeout(() => {
  const snap = { errors, steps: {} };
  try {
    /* Stable layout: clear anything persisted so both runs start identical. */
    try { w.localStorage.clear(); } catch (e) {}
    if (typeof w.dbLoadLayout === 'function') { w.dbLayout = w.dbLoadLayout(); }

    snap.wrappers = {
      dbRenderLibrary_isWrapper: String(w.dbRenderLibrary).includes('dbpItemHtml'),
      dbRenderDesktop_isWrapper: String(w.dbRenderDesktop).includes('dbpTrimTop'),
      dbCellDrop_isWrapper: String(w.dbCellDrop).includes('dbpSwapTop'),
      dbTopAppendDrop_isWrapper: String(w.dbTopAppendDrop).includes('dbpTopFull'),
      dbpOrigRenderLibrary_isOriginal: !!w.dbpOrigRenderLibrary && !String(w.dbpOrigRenderLibrary).includes('dbpItemHtml'),
      dtNavGo_chainDepth: (function () {
        /* count how many wrapper layers name a *OrigNavGo capture */
        return ['tpOrigNavGo','tfOrigNavGo','dbOrigNavGo','inOrigNavGo','rcOrigNavGo','slOrigNavGo','baOrigNavGo']
          .filter(n => typeof w[n] === 'function').length;
      })()
    };

    if (typeof w.lgDismiss === 'function') w.lgDismiss();
    if (typeof w.obClose === 'function') w.obClose();
    w.dtNavGo('dashboard');
    const page = d.getElementById('dt-page-dashboard');
    snap.steps.dashboard_html = page ? page.innerHTML : null;

    if (typeof w.dbEditToggle === 'function') w.dbEditToggle();
    const lib = d.getElementById('db-library');
    snap.steps.library_html = lib ? lib.innerHTML : null;
    snap.steps.library_items = lib ? lib.querySelectorAll('.db-lib-item').length : -1;
    snap.steps.library_has_previews = lib ? lib.querySelectorAll('.dbp-frame').length : -1;
    snap.steps.library_has_done = lib ? !!lib.querySelector('.dbp-done') : null;

    /* Shelf cap: force six on the shelf and render; app-22 should trim to 5. */
    w.dbLayout.top = [['recent-notifications','create-ticket','alerts-warnings','component-condition','fleet-uptime','total-loads']];
    w.dbLayout.work = [['active-tickets']];
    w.dbRenderDesktop();
    snap.steps.shelf_after_trim = JSON.stringify(w.dbLayout.top[0]);
    snap.steps.work_after_trim = JSON.stringify(w.dbLayout.work);

    if (typeof w.dbEditToggle === 'function') w.dbEditToggle();
    snap.steps.dashboard_after_edit_html = page ? page.innerHTML : null;

    /* Leave and come back through another section so the wrapper chain runs. */
    w.dtNavGo('tickets'); w.dtNavGo('batch'); w.dtNavGo('dashboard');
    snap.steps.dashboard_roundtrip_html = page ? page.innerHTML : null;
    snap.steps.batch_hidden = (d.getElementById('dt-page-batch') || {}).style ? d.getElementById('dt-page-batch').style.display : null;
  } catch (e) { snap.exception = String(e && e.stack || e); }
  fs.writeFileSync(path.join(dir, '..', 'snap-' + path.basename(dir) + '.json'), JSON.stringify(snap, null, 1));
  console.log(path.basename(dir), 'errors:', errors.length, 'exception:', !!snap.exception,
    'wrappers:', JSON.stringify(snap.wrappers));
  process.exit(0);
}, 1200);
