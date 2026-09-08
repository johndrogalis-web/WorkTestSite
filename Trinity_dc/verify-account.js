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
const norm = s => s == null ? s : s.replace(/Good (morning|afternoon|evening)/g, 'Good X').replace(/Today, \d+:\d\d [AP]M/g, 'Today, T');
setTimeout(() => {
  const S = { errors, steps: {} }, st = S.steps;
  try {
    try { w.localStorage.clear(); w.sessionStorage.clear(); } catch (e) {}
    st.login_shown_at_boot = d.getElementById('login-screen').style.display;
    /* login → wizard (fresh) */
    w.lgDismiss(); st.ob_shown = d.getElementById('ob-screen').style.display; st.ob_step0 = norm(H('ob-screen'));
    w.obNext(); st.ob_step1 = norm(H('ob-screen')); w.obChoose('role','qc'); w.obNext(); w.obChoose('focus','map'); w.obNext(); st.ob_step3 = norm(H('ob-screen'));
    w.obNext(); /* finish */ st.ob_layout = JSON.stringify(w.dbLayout); st.ob_saved = w.localStorage.getItem('vfOnboard1'); st.ob_hidden_after = d.getElementById('ob-screen').className;
    st.landed_dashboard = w.getComputedStyle(d.getElementById('dt-page-dashboard')).display;
    /* profile */
    w.pfOpen('info'); st.pf_info = H('pf-screen'); w.pfGoTab('prefs'); st.pf_prefs = H('pf-body'); w.pfGoTab('notes'); st.pf_notes = H('pf-body'); w.pfMarkAllRead(); st.pf_notes_read = H('pf-body'); w.pfClose();
    st.pf_role = w.pfRole();
    /* settings desktop, all tabs */
    w.dtNavGo('account'); st.am_company = H('dt-page-account');
    ['units','trucks','users','plants','permissions','software'].forEach(t => { w.amGoTab(t); st['am_' + t] = H('dt-page-account'); });
    w.amTruckOpen('45689'); st.am_truck_drawer = (d.getElementById('am-truck-drawer')||{}).innerHTML; w.amTruckClose();
    w.amToast('hello'); st.toast = !!d.querelector; st.toast_el = [...d.querySelectorAll('[class*="toast"]')].map(e => e.className + ':' + e.textContent.trim()).join('|');
    w.dtNavGo('dashboard'); st.am_hidden = d.getElementById('dt-page-account').style.display;
    /* logout / login again */
    w.lgShow(); st.login_reshown = d.getElementById('login-screen').style.display; w.lgDismiss(); st.ob_skipped_second_time = d.getElementById('ob-screen').style.display;
    /* tablet + mobile settings */
    w.setView('tablet'); w.amTabletOpen(); st.am_tb = H('am-tb-mount'); st.tb_hidden_siblings = ['tb-content','tb-page-units'].map(i => d.getElementById(i).style.display).join(','); w.amTabletClose();
    w.setView('mobile'); w.amMobileOpen(); st.am_mob = H('am-mob-mount'); w.amMobileClose(); w.pfNav(); st.pf_mob = d.getElementById('pf-screen').style.display; w.pfClose();
    w.setView('desktop');
    st.owners = { dtNavGo_wraps_am: String(w.dtNavGo).includes('am') , amOrigNavGo: typeof w.amOrigNavGo, amToast: typeof w.amToast, lgDismiss: typeof w.lgDismiss, obMaybe: typeof w.obMaybe };
  } catch (e) { S.exception = String(e && e.stack || e); }
  fs.writeFileSync('snap-am-' + path.basename(dir) + '.json', JSON.stringify(S, null, 1));
  console.log(path.basename(dir), 'errors:', errors.length, 'exception:', S.exception ? S.exception.slice(0, 200) : false); process.exit(0);
}, 1200);
