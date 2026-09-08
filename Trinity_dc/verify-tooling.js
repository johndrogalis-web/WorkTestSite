const { JSDOM } = require('jsdom'); const fs = require('fs'); const path = require('path');
const dir = path.resolve(process.argv[2] || 'base'); const errors = [];
let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8')
  .replace(/<script src="https:[^"]*"[^>]*><\/script>/g, '').replace(/<link[^>]*>/g, '');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => { const p = path.join(dir, src); if (!fs.existsSync(p)) { errors.push('missing ' + src); return ''; } return '<script>\n' + fs.readFileSync(p, 'utf8') + '\n</script>'; });
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/index.html',
  beforeParse(w) { w.L = undefined; w.requestAnimationFrame = f => setTimeout(f, 0); w.matchMedia = () => ({ matches: false, addListener() {}, addEventListener() {} });
    w.HTMLCanvasElement.prototype.getContext = () => null; w.scrollTo = () => {}; w.Element.prototype.scrollIntoView = () => {};
    w.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: false, error: 'stub' }), text: () => Promise.resolve('{"ok":false,"error":"stub"}') });
    w.navigator.sendBeacon = () => true; w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    /* jsdom has no layout; give visible elements a box so rtDtPageOnScreen / vcOnScreen can work. */
    w.Element.prototype.getBoundingClientRect = function () {
      let el = this, vis = true;
      while (el && el.nodeType === 1) { const cs = w.getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') { vis = false; break; } el = el.parentElement; }
      const n = vis ? 100 : 0; return { x: 0, y: 0, top: 0, left: 0, right: n, bottom: n, width: n, height: n, toJSON() {} };
    }; } });
const w = dom.window, d = w.document; w.addEventListener('error', e => errors.push(String(e.message)));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const onscreen = id => { const el = d.getElementById(id); if (!el) return 'missing'; const cs = w.getComputedStyle(el); return cs.display === 'none' ? 'off' : 'on'; };
(async () => {
  await sleep(1500);
  const S = { errors, steps: {} }, st = S.steps;
  try {
    try { w.localStorage.clear(); } catch (e) {}
    w.lgDismiss(); w.obClose(); await sleep(50);
    st.tooling_present = { rtGoTo: typeof w.rtGoTo, rtGoTo_vcWrapped: String(w.rtGoTo).includes('VC.suspend'), cmtState: typeof w.cmtState, tstState: typeof w.tstState, TST_PROTOTYPE: w.TST_PROTOTYPE, VC: typeof w.VC, setView_vc: String(w.setView).includes('vcCapture'), tstPost_wrapped: String(w.tstPost).includes('tstQForSession'), dtNavGo_rt: !!w.dtNavGo.__rtPageHash };
    st.routes_registered = w.RT.routes.length; st.body_at_start = d.body.className;
    const go = async (r) => { try { await w.rtGoTo(r); return 'ok'; } catch (e) { return 'ERR ' + e.message; } };
    /* hash writers */
    w.dtNavGo('insights'); await sleep(60); st.hash_insights = w.location.hash; w.dtNavGo('batch'); await sleep(60); w.baSetTab('water'); await sleep(60); st.hash_batch = w.location.hash;
    w.setView('tablet'); await sleep(300); w.tvNavGo('phases'); await sleep(120); st.hash_tablet_phases = w.location.hash; w.setView('desktop'); await sleep(400); st.hash_back_desktop = w.location.hash + ' driving=' + w.RT.driving;
    /* router jumps */
    await sleep(100); st['go_desktop/batch/acc'] = await go('desktop/batch/acc'); st.jump_batch = onscreen('dt-page-batch') + ' tab=' + w.baTab;
    st['go_desktop/trucks/45689/logs'] = await go('desktop/trucks/45689/logs'); st.jump_truck = d.getElementById('dt-drawer').classList.contains('open') + ' ' + onscreen('dt-page-trucks') + ' batch=' + onscreen('dt-page-batch');
    st['go_desktop/tfleet'] = await go('desktop/tfleet'); st.jump_fleet = onscreen('dt-page-tfleet') + ' drawer=' + d.getElementById('dt-drawer').classList.contains('open');
    st['go_returned-concrete'] = await go('returned-concrete'); st.jump_alias = onscreen('dt-page-returned');
    st['go_mobile/units'] = await go('mobile/units'); st.jump_mobile_units = d.body.className.includes('view-mobile') + ' ' + (d.getElementById('s-units').classList.contains('active'));
    st['go_tablet/trucks/cc'] = await go('tablet/trucks/cc'); st.jump_tablet_cc = d.body.className.includes('view-tablet');
    st.jump_unknown = await go('nowhere/at/all');
    st['go_desktop/dashboard'] = await go('desktop/dashboard'); await sleep(100);
    /* continuity: tickets phases desktop → mobile → tablet keeps the screen */
    w.dtNavGo('tphases'); d.getElementById('tp-search-input').value = 'cemex'; w.setView('mobile'); await sleep(250);
    st.vc_mobile = onscreen('mob-page-tickets') + ' view=' + w.eval('TV.m.view') + ' q=' + d.getElementById('mtk-search').value;
    w.setView('tablet'); await sleep(250); st.vc_tablet = onscreen('tb-page-tickets') + ' view=' + w.eval('TV.t.view');
    w.setView('desktop'); await sleep(250); st.vc_desktop = onscreen('dt-page-tphases') + ' q=' + d.getElementById('tp-search-input').value;
    /* comments drawer + jump buttons */
    w.cmtState.comments = [{ id: 'c1', name: 'John', comment: 'test', status: 'open', timestamp: '2026-09-08T10:00:00Z', page: 'dt-page-batch', view: 'desktop', x_pct: 10, y_pct: 10, anchor: '#dt-page-batch · "x" ⟂route=desktop/batch/acc' },
      { id: 'c2', name: 'Ann', comment: 'no route', status: 'done', timestamp: '2026-09-08T09:00:00Z', page: 'dt-page-trucks', view: 'desktop', x_pct: 5, y_pct: 5, anchor: '#dt-page-trucks' }];
    w.cmtDrawerFilter = 'all'; w.cmtDrawerOpen(); await sleep(50);
    st.cmt_rows = d.querySelectorAll('#cmt-dlist .cmt-drow').length + ' jump=' + d.querySelectorAll('#cmt-dlist [data-act="jump"]').length; w.cmtDrawerClose();
    w.cmtSetVisible(true); w.cmtRenderAll(); st.cmt_pins = d.querySelectorAll('.cmt-pin').length + ' show=' + d.body.classList.contains('cmt-show');
    /* hashchange drives the UI */
    w.location.hash = '#desktop/slump'; await sleep(300); st.hashchange = onscreen('dt-page-slump');
    /* testing questions presets intact */
    st.tst_presets = w.TST_Q_PRESETS.length + ' ' + typeof w.tstQOf;
  } catch (e) { S.exception = String(e && e.stack || e); }
  fs.writeFileSync('snap-tool-' + path.basename(dir) + '.json', JSON.stringify(S, null, 1));
  console.log(path.basename(dir), 'errors:', errors.length, 'exception:', S.exception ? S.exception.slice(0, 300) : false); process.exit(0);
})();
