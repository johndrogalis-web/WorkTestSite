const { JSDOM } = require('jsdom'); const fs = require('fs'); const path = require('path');
const dir = path.resolve(process.argv[2] || 'base'); const errors = [];
let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8')
  .replace(/<script src="https:[^"]*"[^>]*><\/script>/g, '')
  .replace(/<script src="(comments|testing|testing-questions)\.js"><\/script>/g, '')
  .replace(/<link[^>]*>/g, '');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  const p = path.join(dir, src); if (!fs.existsSync(p)) { errors.push('missing script: ' + src); return ''; }
  return '<script>\n//# file ' + src + '\n' + fs.readFileSync(p, 'utf8') + '\n</script>';
});
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/index.html',
  beforeParse(w) { w.L = undefined; w.requestAnimationFrame = f => setTimeout(f, 0);
    w.matchMedia = () => ({ matches: false, addListener() {}, addEventListener() {} });
    w.HTMLCanvasElement.prototype.getContext = () => null; w.scrollTo = () => {}; w.Element.prototype.scrollIntoView = () => {}; } });
const w = dom.window, d = w.document;
w.addEventListener('error', e => errors.push(String(e.message)));
const H = id => { const el = d.getElementById(id); return el ? el.innerHTML : null; };
setTimeout(() => {
  const S = { errors, steps: {} }; const st = S.steps;
  try {
    try { w.localStorage.clear(); } catch (e) {}
    if (typeof w.lgDismiss === 'function') w.lgDismiss(); if (typeof w.obClose === 'function') w.obClose();
    /* desktop three views */
    w.dtNavGo('tickets');  st.list_html = H('dt-page-tickets');
    w.dtNavGo('tphases');  st.phases_html = H('dt-page-tphases'); st.list_hidden = d.getElementById('dt-page-tickets').style.display;
    w.dtNavGo('tfleet');   st.fleet_html = H('dt-page-tfleet');
    w.tkSetPhase('Washing'); st.fleet_filtered = H('tf-rail'); st.phases_filtered = H('tp-board');
    w.tkSetPhase('Washing'); /* toggle off */
    w.dtNavGo('dashboard'); st.tickets_released = ['dt-page-tickets','dt-page-tfleet','dt-page-tphases'].map(i => d.getElementById(i).style.display + '|' + d.getElementById(i).className).join(' ; ');
    /* drawer */
    w.dtNavGo('tickets'); w.tkOpenDrawer(2); st.drawer_open = d.getElementById('dt-ticket-drawer').className; st.drawer_id = (d.getElementById('tk-drawer-id')||{}).textContent;
    const tabBtn = t => d.querySelector('#dt-ticket-drawer .dt-drawer-tab[data-tab="'+t+'"]');
    ['status','charts','manual','slump','messaging','order','map'].forEach(t => { w.tkTab(tabBtn(t), t); st['tab_'+t] = H('tk-drawer-scroll'); });
    w.tkNavTicket(1); st.drawer_next = (d.getElementById('tk-drawer-id')||{}).textContent;
    w.tkCloseDrawer(); st.drawer_closed = d.getElementById('dt-ticket-drawer').className;
    st.mc_home = !!d.getElementById('mc-unit-water') && !d.getElementById('mc-unit-water').closest('#tk-drawer-scroll');
    /* mobile */
    w.setView('mobile'); w.tvNavGo('list'); st.m_list = H('mtk-rows'); w.tvNavGo('phases'); st.m_board = H('mtk-board');
    w.tvNavGo('map'); st.m_strip = H('mtk-map-strip'); st.m_view = w.eval('TV.m.view');
    w.mtkChipSelect('Washing'); st.m_board_filtered = H('mtk-board'); w.mtkChipSelect('Washing');
    w.mtkOpenTicket(3); st.m_drawer = H('tk-drawer-scroll'); st.m_side_docked = (d.getElementById('tk-side-body')||{}).className; w.tkCloseDrawer();
    /* tablet */
    w.setView('tablet'); w.tvNavGo('list'); st.t_tbody = H('ttk-tbody'); st.t_pills = ['tb-nav-tickets','tb-nav-tfleet','tb-nav-tphases'].map(i => (d.getElementById(i)||{}).dataset && d.getElementById(i).dataset.active).join(',');
    w.tvNavGo('phases'); st.t_board = H('ttk-board'); st.t_pills2 = ['tb-nav-tickets','tb-nav-tfleet','tb-nav-tphases'].map(i => (d.getElementById(i)||{}).dataset && d.getElementById(i).dataset.active).join(',');
    w.tvColsSet(3); st.t_cols_css = (d.getElementById('tv-cols-style')||{}).textContent; w.tvColsReset();
    w.tbNavTrucks(); st.t_closed = d.getElementById('tb-page-tickets').style.display;
    w.setView('desktop');
    st.fn_owner = { tkTab_dispatcher: String(w.tkTab).includes('tkdLeave'), tkOpenDrawer: typeof w.tkOpenDrawer, tvNavGo_wrapped_vc: !!(w.tvNavGo && w.tvNavGo.__vcWrapped), ttkOpen_wrapped_vc: !!(w.ttkOpen && w.ttkOpen.__vcWrapped), logCommand_wrapped: String(w.logCommand).includes('tkmcOrigLog') };
  } catch (e) { S.exception = String(e && e.stack || e); }
  fs.writeFileSync('snap-tk-' + path.basename(dir) + '.json', JSON.stringify(S, null, 1));
  console.log(path.basename(dir), 'errors:', errors.length, 'exception:', !!S.exception, S.exception ? S.exception.slice(0,300) : '');
  process.exit(0);
}, 1200);
