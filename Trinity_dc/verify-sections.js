const { JSDOM } = require('jsdom'); const fs = require('fs'); const path = require('path');
const dir = path.resolve(process.argv[2] || 'base'); const errors = [];
let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8')
  .replace(/<script src="https:[^"]*"[^>]*><\/script>/g, '').replace(/<script src="(comments|testing|testing-questions)\.js"><\/script>/g, '').replace(/<link[^>]*>/g, '');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => { const p = path.join(dir, src); if (!fs.existsSync(p)) { errors.push('missing ' + src); return ''; } return '<script>\n' + fs.readFileSync(p, 'utf8') + '\n</script>'; });
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/index.html',
  beforeParse(w) { w.L = undefined; w.requestAnimationFrame = f => setTimeout(f, 0); w.matchMedia = () => ({ matches: false, addListener() {}, addEventListener() {} });
    w.HTMLCanvasElement.prototype.getContext = () => null; w.scrollTo = () => {}; w.Element.prototype.scrollIntoView = () => {}; } });
const w = dom.window, d = w.document; w.addEventListener('error', e => errors.push(String(e.message)));
const H = id => { const el = d.getElementById(id); return el ? el.innerHTML : null; };
const norm = s => s == null ? s : s.replace(/Viewed: \d+:\d\d [AP]M/g, 'Viewed: T').replace(/Today, \d+:\d\d [AP]M/g, 'Today, T');
const shown = ids => ids.map(i => { const el = d.getElementById(i); return el ? i.replace('dt-page-','') + '=' + (w.getComputedStyle(el).display) : i + '=?'; }).join(' ');
const PAGES = ['dt-page-dashboard','dt-page-insights','dt-page-returned','dt-page-slump','dt-page-batch','dt-page-account','dt-page-tickets'];
setTimeout(() => {
  const S = { errors, steps: {} }, st = S.steps;
  try {
    try { w.localStorage.clear(); } catch (e) {}
    w.lgDismiss(); w.obClose();
    /* Insights */
    w.dtNavGo('insights'); st.in_hub = norm(H('dt-page-insights')); st.in_vis = shown(PAGES);
    w.inGo('initial-slump'); st.in_report = norm(H('dt-page-insights')); w.inGo('driver'); st.in_driver = norm(H('dt-page-insights'));
    w.inTogglePin('buildup'); w.inBack(); st.in_hub_pinned = norm(H('dt-page-insights')); w.inSearch('slump'); st.in_search = norm(H('dt-page-insights')); w.inSearch('');
    /* Returned Concrete */
    w.dtNavGo('returned'); st.rc_locked = norm(H('dt-page-returned')); st.rc_vis = shown(PAGES);
    w.rcUnlock(); st.rc_explore = norm(H('dt-page-returned')); w.rcGoView('invoicing'); st.rc_invoicing = norm(H('dt-page-returned')); w.rcGoView('realtime'); st.rc_realtime = norm(H('dt-page-returned')); w.rcGoView('explore');
    const firstTicket = (st.rc_explore.match(/rcOpenLoad\('([^']+)'\)/) || [])[1]; if (firstTicket) { w.rcOpenLoad(firstTicket); st.rc_drawer = norm((d.getElementById('rc-drawer')||{}).innerHTML || null); w.rcDrawerClose(); }
    /* Slump Tests */
    w.dtNavGo('slump'); st.sl_page = norm(H('dt-page-slump')); st.sl_vis = shown(PAGES);
    if (typeof w.slReveal === 'function') { w.slReveal(true); st.sl_revealed = norm(H('dt-page-slump')); w.slSetView('review'); st.sl_review = norm(H('dt-page-slump')); w.slSetView('batch'); st.sl_batch = norm(H('dt-page-slump')); w.slSetView('all'); }
    /* Batch Assistant */
    w.dtNavGo('batch'); st.ba_live = norm(H('dt-page-batch')); st.ba_vis = shown(PAGES);
    w.baSetTab('acc'); st.ba_acc = norm(H('dt-page-batch')); w.baSetTab('water'); st.ba_water = norm(H('dt-page-batch'));
    w.baSetPlant('Mesa South'); st.ba_plant = norm(H('dt-page-batch')); w.baSetPlant('all'); w.baTogglePop('tol'); st.ba_tolpop = norm(H('dt-page-batch')); w.baSetTol('flow','wet','2.5'); w.baSetTab('acc'); st.ba_acc_tol = norm(H('dt-page-batch'));
    w.baOpenLoad('49617225'); st.ba_drawer = norm((d.getElementById('ba-drawer')||{}).innerHTML || null); w.baDrawerClose();
    /* leave: every section page hidden */
    w.dtNavGo('dashboard'); st.after_dash = shown(PAGES);
    w.dtNavGo('tickets'); st.after_tickets = shown(PAGES);
    /* tablet + mobile entries */
    w.setView('tablet'); w.inNav(); st.t_in = norm(H('in-tb-mount')); w.rcNav(); st.t_rc = norm(H('rc-tb-mount')); st.t_in_hidden = d.getElementById('tb-page-insights').style.display;
    w.slNav(); st.t_sl = norm(H('sl-tb-mount')); w.baNav(); st.t_ba = norm(H('ba-tb-mount')); st.t_pages = ['tb-page-insights','tb-page-returned','tb-page-slump','tb-page-batch','tb-content'].map(i => i + '=' + d.getElementById(i).style.display).join(' ');
    w.tbNavTrucks(); st.t_released = ['tb-page-insights','tb-page-returned','tb-page-slump','tb-page-batch','tb-content'].map(i => i + '=' + d.getElementById(i).style.display).join(' ');
    w.setView('mobile'); w.inNav(); st.m_in = norm(H('in-mob-mount')); w.rcNav(); st.m_rc = norm(H('rc-mob-mount')); w.slNav(); st.m_sl = norm(H('sl-mob-mount')); w.baNav(); st.m_ba = norm(H('ba-mob-mount'));
    st.m_pages = ['mob-page-insights','mob-page-returned','mob-page-slump','mob-page-batch'].map(i => i + '=' + d.getElementById(i).style.display).join(' ');
    w.goToAllTrucks(); st.m_released = ['mob-page-insights','mob-page-returned','mob-page-slump','mob-page-batch'].map(i => i + '=' + d.getElementById(i).style.display).join(' ');
    w.setView('desktop');
    st.chain = ['inOrigNavGo','rcOrigNavGo','slOrigNavGo','baOrigNavGo'].map(n => n + ':' + typeof w[n]).join(' ');
  } catch (e) { S.exception = String(e && e.stack || e); }
  fs.writeFileSync('snap-sec-' + path.basename(dir) + '.json', JSON.stringify(S, null, 1));
  console.log(path.basename(dir), 'errors:', errors.length, 'exception:', S.exception ? S.exception.slice(0, 300) : false); process.exit(0);
}, 1200);
