const { JSDOM } = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('index.html','utf8');
// strip external scripts (leaflet, comments, testing) we do not want
html = html.replace(/<script src="https:[^"]*"><\/script>/g,"").replace(/<script src="(comments|testing)\.js"><\/script>/g,"");
html = html.replace(/<link[^>]*>/g,'');
const dom = new JSDOM(html, { runScripts:'dangerously', resources:'usable', url:'file://'+process.cwd()+'/index.html', pretendToBeVisual:true,
  beforeParse(w){ w.L = undefined; w.requestAnimationFrame = f=>setTimeout(f,0); w.matchMedia = ()=>({matches:false,addListener(){},addEventListener(){}}); w.HTMLCanvasElement.prototype.getContext = ()=>null; w.scrollTo=()=>{}; } });
const w = dom.window, d = w.document;
w.addEventListener('error', e => console.log('WINDOW ERROR', e.message));
const fails = [];
function check(c, msg){ if(!c){ fails.push(msg); console.log('FAIL', msg);} else console.log('ok  ', msg); }
setTimeout(() => {
  try {
    check(typeof w.tkTab === 'function', 'tkTab defined');
    check(typeof w.tkOpenDrawer === 'function' && typeof w.tkCloseDrawer === 'function', 'open/close defined');
    check(w.tkTab.toString().includes('tkdLeave'), 'tkTab is the dispatcher (no wrapper on top)');
    const scroll = d.getElementById('tk-drawer-scroll'), side = d.getElementById('tk-side-body');
    check(scroll && side, 'drawer nodes exist');
    const tabBtn = t => d.querySelector('#dt-ticket-drawer .dt-drawer-tab[data-tab="'+t+'"]');
    ['status','charts','map','order','manual','messaging','slump'].forEach(t => console.log('   tab present:', t, !!tabBtn(t)));

    w.tkOpenDrawer(2);
    check(d.getElementById('dt-ticket-drawer').classList.contains('open'), 'drawer opens');
    check(d.getElementById('tk-drawer-id').textContent.includes('TKT-10480'), 'header shows ticket');
    check(scroll.querySelector('.tks-tbl'), 'status table rendered');

    // Manual control: cards borrowed
    if (typeof w.initMcCards === 'function') w.initMcCards();
    const water = d.getElementById('mc-unit-water'); const home = water && water.parentNode;
    w.tkTab(tabBtn('manual') || null, 'manual');
    check(d.getElementById('mc-unit-water') && d.getElementById('mc-unit-water').closest('#tk-drawer-scroll'), 'manual: Add Water card borrowed into drawer');
    // The former bug: manual -> slump wiped the borrowed cards
    w.tkTab(tabBtn('slump') || null, 'slump');
    const w2 = d.getElementById('mc-unit-water');
    check(w2 && w2.parentNode === home, 'manual->slump: Add Water card returned home (former bug)');
    check(scroll.querySelector('.so-wrap') && scroll.classList.contains('so-scope-root'), 'slump: override screen rendered');
    w.soPickType('add'); w.soSetValue('-0.5');
    check(d.getElementById('so-result').textContent.includes('3.00 in'), 'slump: result computed (3.50 - 0.50)');
    w.tkTab(tabBtn('messaging') || null, 'messaging');
    check(scroll.querySelector('.tk-msg-wrap'), 'messaging rendered');
    check(!scroll.classList.contains('so-scope-root'), 'slump scope class cleared on leave');
    w.tkTab(tabBtn('charts') || null, 'charts');
    check(scroll.querySelector('#dt-sen-chips'), 'charts rendered');
    w.tkTab(tabBtn('order') || null, 'order');
    check(scroll.textContent.includes('coming soon'), 'unknown tab falls to coming soon');
    w.tkTab(tabBtn('map') || null, 'map');
    check(scroll.querySelector('.tkm-wrap'), 'map rendered (no Leaflet, markup only)');

    // Mobile docking
    d.body.classList.add('view-mobile');
    w.tkTab(tabBtn('status') || null, 'status');
    check(side.parentNode === scroll && side.classList.contains('tkx-docked'), 'mobile: summary docked under status');
    w.tkStatusToggleGroup('Loading');
    check(side.parentNode === scroll, 'mobile: summary survives group toggle');
    w.tkTab(tabBtn('manual') || null, 'manual');
    check(side.parentNode !== scroll, 'mobile: summary rescued on manual');
    check(d.getElementById('tk-side-body') === side, 'summary node never destroyed');
    w.tkTab(tabBtn('messaging') || null, 'messaging');
    check(side.parentNode !== scroll, 'mobile: messaging keeps body to itself');
    d.body.classList.remove('view-mobile');

    w.tkTab(tabBtn('manual') || null, 'manual');
    w.tkCloseDrawer();
    check(d.getElementById('mc-unit-water').parentNode === home, 'close: cards returned home');
    check(!d.getElementById('dt-ticket-drawer').classList.contains('open'), 'close: drawer closed');
    w.tkOpenDrawer(0); w.tkNavTicket(1);
    check(d.getElementById('tk-drawer-id').textContent.includes('TKT-10481'), 'prev/next works');
    // tkGoTruck from summary
    check(typeof w.tkGoTruck === 'function', 'tkGoTruck still in app-01');
  } catch(e) { console.log('EXC', e.stack); fails.push('exception'); }
  console.log(fails.length ? '\n' + fails.length + ' FAILURES' : '\nALL PASS'); process.exit(fails.length?1:0);
}, 800);
