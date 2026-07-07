/* app-04-softwareupdate-maps.js — Software Update page (swu), Maps / Diagnostic Center (dc). Loads 4th.
   Part of the app.js split. All six app-*.js files share one global
   scope and MUST load in numeric order (see index.html). */
function hmSvgLine(data, color, W, H, min, max) {
  var PAD = { t:8, r:8, b:20, l:36 };
  var cW = W - PAD.l - PAD.r, cH = H - PAD.t - PAD.b;
  var N = data.length;
  var toX = function(i){ return PAD.l + (i/(N-1))*cW; };
  var toY = function(v){ return PAD.t + cH - ((v-min)/(max-min))*cH; };
  var pathD = data.map(function(v,i){
    if(i===0) return 'M'+toX(0).toFixed(1)+','+toY(v).toFixed(1);
    var ppx=toX(i-1), ppy=toY(data[i-1]), px=toX(i), py=toY(v);
    var cpx=((ppx+px)/2).toFixed(1);
    return 'C'+cpx+','+ppy.toFixed(1)+' '+cpx+','+py.toFixed(1)+' '+px.toFixed(1)+','+py.toFixed(1);
  }).join(' ');
  var fillD = pathD + ' L'+toX(N-1).toFixed(1)+','+(PAD.t+cH)+' L'+PAD.l+','+(PAD.t+cH)+' Z';
  var gradId = 'hmg-'+color.replace('#','');
  var ySteps = [min, min+(max-min)*0.5, max];
  var grid = ySteps.map(function(v){
    var gy = toY(v).toFixed(1);
    return '<line x1="'+PAD.l+'" y1="'+gy+'" x2="'+(PAD.l+cW)+'" y2="'+gy+'" stroke="rgba(54,50,45,0.07)" stroke-width="1"/>'
         + '<text x="'+(PAD.l-5)+'" y="'+(parseFloat(gy)+4)+'" text-anchor="end" font-size="9" font-family="Helvetica,Arial,sans-serif" fill="rgba(54,50,45,0.35)">'+v+'</text>';
  }).join('');
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul'];
  var xLbls = months.map(function(m,i){
    var lx = (PAD.l + (i/(months.length-1))*cW).toFixed(1);
    return '<text x="'+lx+'" y="'+(H-4)+'" text-anchor="middle" font-size="9" font-family="Helvetica,Arial,sans-serif" fill="rgba(54,50,45,0.35)">'+m+'</text>';
  }).join('');
  return '<svg width="100%" height="'+H+'" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" style="display:block;">'
    +'<defs><linearGradient id="'+gradId+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+color+'" stop-opacity="0.18"/><stop offset="100%" stop-color="'+color+'" stop-opacity="0"/></linearGradient></defs>'
    +'<clipPath id="hm-clip-'+gradId+'"><rect x="'+PAD.l+'" y="'+PAD.t+'" width="'+cW+'" height="'+cH+'"/></clipPath>'
    +grid
    +'<g clip-path="url(#hm-clip-'+gradId+')">'
    +'<path d="'+fillD+'" fill="url(#'+gradId+')"/>'
    +'<path d="'+pathD+'" stroke="'+color+'" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>'
    +'</g>'
    +xLbls
    +'</svg>';
}

function hmDonut(pct, color, size) {
  size = size || 120;
  var r = (size-20)/2, cx = size/2, cy = size/2;
  var circ = 2*Math.PI*r;
  var dash = (pct/100)*circ;
  return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'">'
    +'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="rgba(54,50,45,0.08)" stroke-width="14"/>'
    +'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="14"'
    +' stroke-dasharray="'+dash.toFixed(1)+' '+(circ-dash).toFixed(1)+'"'
    +' stroke-dashoffset="'+(circ*0.25).toFixed(1)+'" stroke-linecap="round" transform="rotate(-90 '+cx+' '+cy+')" style="transition:stroke-dasharray 0.8s ease;"/>'
    +'<text x="'+cx+'" y="'+(cy+6)+'" text-anchor="middle" font-size="22" font-weight="700" font-family="Helvetica,Arial,sans-serif" fill="#36322d">'+pct+'%</text>'
    +'</svg>';
}

function hmArrowIcon() {
  return '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7h9M7.5 3l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function hmCalIcon() {
  return '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 6h11M4.5 1v3M9.5 1v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
}
function hmSettingsIcon() {
  return '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2" stroke="currentColor" stroke-width="1.3"/><path d="M7 1.5v1.2M7 11.3v1.2M1.5 7h1.2M11.3 7h1.2M3.2 3.2l.85.85M9.95 9.95l.85.85M10.8 3.2l-.85.85M4.05 9.95l-.85.85" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
}
function hmEditIcon() {
  return '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';
}

function hmCard(id, content, minH) {
  return '<div class="hm-card" id="'+id+'" style="min-height:'+(minH||'326')+'px;">'+content+'</div>';
}

function hmCardHeader(title, subtitle, clickPage) {
  var navStr = clickPage ? 'style="cursor:pointer;" onclick="dtNavGo(\''+clickPage+'\')"' : '';
  return '<div class="hm-card-header" '+navStr+'>'
    +'<div><div class="hm-card-title">'+title+'</div>'+(subtitle?'<div class="hm-card-subtitle">'+subtitle+'</div>':'')+'</div>'
    +'<div class="hm-card-actions">'
    +'<button class="hm-icon-btn">'+hmCalIcon()+'</button>'
    +'<button class="hm-icon-btn">'+hmSettingsIcon()+'</button>'
    +'</div></div>';
}

function hmCardFooter(label, clickPage) {
  var nav = clickPage ? 'onclick="dtNavGo(\''+clickPage+'\')"' : '';
  return '<div class="hm-card-footer">'
    +'<span class="hm-footer-updated">'+label+'</span>'
    +'<button class="hm-footer-arrow" '+nav+'>'+hmArrowIcon()+'</button>'
    +'</div>';
}

/* Truck locations for fleet map */
var HM_TRUCKS = [
  { lat:33.4480, lng:-112.0740, label:'45689', title:'Truck 45689 — Pouring',     color:'#d70100' },
  { lat:33.4350, lng:-112.0520, label:'12457', title:'Truck 12457 — On Site',     color:'#d70100' },
  { lat:33.4680, lng:-111.8850, label:'33201', title:'Truck 33201 — In Transit',  color:'#d97706' },
  { lat:33.5320, lng:-111.9150, label:'77840', title:'Truck 77840 — Loaded',      color:'#1594ef' },
  { lat:33.4920, lng:-111.7380, label:'55120', title:'Truck 55120 — Loading',     color:'#1594ef' },
];

function hmInitMap() {
  var el = document.getElementById('hm-gmap');
  if (!el) return;

  /* If Leaflet already loaded */
  if (typeof L !== 'undefined') {
    hmBuildMap(el);
    return;
  }

  /* Load Leaflet CSS */
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);

  /* Load Leaflet JS */
  var script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = function() { hmBuildMap(el); };
  document.head.appendChild(script);
}

function hmBuildMap(el) {
  /* Prevent double-init */
  if (el._leaflet_id) return;

  var map = L.map(el, {
    center: [33.480, -111.960],
    zoom: 10,
    zoomControl: true,
    attributionControl: false,
    keyboard: false
  });

  /* OpenStreetMap tiles — no API key */
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  /* Custom truck marker */
  function truckIcon(color) {
    return L.divIcon({
      className: '',
      html: '<div style="width:14px;height:14px;border-radius:50%;background:'+color+';border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  }

  HM_TRUCKS.forEach(function(t) {
    L.marker([t.lat, t.lng], { icon: truckIcon(t.color) })
      .addTo(map)
      .bindPopup(
        '<div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#36322d;min-width:140px;">'
        + '<strong>' + t.label + '</strong><br>'
        + t.title.replace(t.label + ' — ', '')
        + '</div>'
      );
  });
}

function hmInit() {
  var wrap = document.getElementById('hm-wrap');
  if (!wrap) return;

  var now = new Date();
  var hour = now.getHours();
  var greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  var month = now.toLocaleString('en-US',{month:'long'});
  var day = now.getDate();

  /* Trend data */
  var loadsData = [210,195,230,248,220,235,260,245,270,285,268,280,295,310,298];
  var delivSpecData = [88,85,90,92,87,91,93,89,94,91,88,92,95,93,90];

  /* ── Greeting ── */
  var greetingHtml = '<div class="hm-greeting">'
    +'<div class="hm-greeting-text">'
    +'<h2>'+greeting+' John!</h2>'
    +'<p><span>It\'s 54°F ☀ and sunny · '+month+' '+day+'</span></p>'
    +'</div>'
    +'<button class="hm-setup-btn" onclick="">'+hmEditIcon()+' Setup page</button>'
    +'</div>';

  /* ── Row 1: 4 small cards ── */
  /* Fleet map — Google Maps JS API */
  var mapCard = '<div class="hm-card hm-map-card" style="min-height:326px;">'
    +'<div id="hm-gmap" style="width:100%;height:326px;"></div>'
    +'<div class="hm-map-header">'
    +'<span class="hm-map-title">Fleet map</span>'
    +'<button class="hm-map-arrow" onclick="dtNavGo(\'trucks\')">'+hmArrowIcon()+'</button>'
    +'</div></div>';

  /* Component condition */
  var ccRows = [
    {truck:'45689', err:2, wrn:0},
    {truck:'12457', err:1, wrn:3},
    {truck:'33201', err:0, wrn:5},
    {truck:'77840', err:0, wrn:2},
    {truck:'55120', err:1, wrn:1},
  ];
  var ccTableBody = ccRows.map(function(r,i){
    var bg = i%2===0?'':'background:var(--layer-2);';
    var badges = (r.err?'<span class="hm-badge-err">'+r.err+'</span>':'')
               + (r.wrn?'<span class="hm-badge-wrn">'+r.wrn+'</span>':'');
    return '<tr style="'+bg+'"><td style="padding:8px;color:var(--defined);font-size:14px;">'+r.truck+'</td><td style="padding:8px;text-align:right;"><div class="hm-badge-row">'+badges+'</div></td></tr>';
  }).join('');
  var ccCard = hmCard('hm-cc', hmCardHeader('Component condition','','trucks')
    +'<div style="padding:0 20px;flex:1;overflow:hidden;margin-top:12px;">'
    +'<table class="hm-table"><thead><tr><th>Truck</th><th style="text-align:right;">Found issues</th></tr></thead>'
    +'<tbody>'+ccTableBody+'</tbody></table></div>'
    +hmCardFooter('Last updated 1 min ago','trucks'));

  /* Top drivers */
  var topDrivers = [
    {rank:1,name:'R. Martinez',truck:'45689'},{rank:2,name:'D. Ochoa',truck:'12457'},
    {rank:3,name:'J. Torres',truck:'33201'},{rank:4,name:'A. Reyes',truck:'77840'},
    {rank:5,name:'M. Fuentes',truck:'55120'},
  ];
  var tdBody = topDrivers.map(function(d,i){
    var bg = i%2===0?'':'background:var(--layer-2);';
    return '<tr style="'+bg+'"><td style="padding:8px;color:var(--soft);font-size:13px;width:24px;">'+d.rank+'</td>'
      +'<td style="padding:8px;color:var(--blue-link);text-decoration:underline;cursor:pointer;font-size:14px;">'+d.name+'</td>'
      +'<td style="padding:8px;text-align:right;color:var(--blue-link);text-decoration:underline;cursor:pointer;font-size:14px;">'+d.truck+'</td></tr>';
  }).join('');
  var topCard = hmCard('hm-top', hmCardHeader('Top drivers','Today')
    +'<div style="padding:0 20px;flex:1;overflow:hidden;margin-top:12px;">'
    +'<table class="hm-table"><thead><tr><th></th><th>Driver</th><th style="text-align:right;">Truck</th></tr></thead>'
    +'<tbody>'+tdBody+'</tbody></table></div>'
    +hmCardFooter('Last updated 1 min ago'));

  /* Bottom drivers */
  var botDrivers = [
    {rank:19,name:'C. Gomez',truck:'98302'},{rank:20,name:'F. Herrera',truck:'14520'},
    {rank:21,name:'L. Vargas',truck:'66478'},{rank:22,name:'P. Sanchez',truck:'22190'},
    {rank:23,name:'R. Cruz',truck:'40031'},
  ];
  var bdBody = botDrivers.map(function(d,i){
    var bg = i%2===0?'':'background:var(--layer-2);';
    return '<tr style="'+bg+'"><td style="padding:8px;color:var(--soft);font-size:13px;width:24px;">'+d.rank+'</td>'
      +'<td style="padding:8px;color:var(--blue-link);text-decoration:underline;cursor:pointer;font-size:14px;">'+d.name+'</td>'
      +'<td style="padding:8px;text-align:right;color:var(--blue-link);text-decoration:underline;cursor:pointer;font-size:14px;">'+d.truck+'</td></tr>';
  }).join('');
  var botCard = hmCard('hm-bot', hmCardHeader('Bottom drivers','Today')
    +'<div style="padding:0 20px;flex:1;overflow:hidden;margin-top:12px;">'
    +'<table class="hm-table"><thead><tr><th></th><th>Driver</th><th style="text-align:right;">Truck</th></tr></thead>'
    +'<tbody>'+bdBody+'</tbody></table></div>'
    +hmCardFooter('Last updated 1 min ago'));

  var row1 = '<div class="hm-row-4">'+mapCard+ccCard+topCard+botCard+'</div>';

  /* ── Row 2: Total loads (wide) + Delivered on spec + Fleet uptime ── */
  var loadsChart = hmSvgLine(loadsData,'#3069e3',700,100,150,350);
  var loadsCard = '<div class="hm-card hm-card-wide" style="min-height:326px;">'
    +hmCardHeader('Total loads','')
    +'<div style="padding:16px 20px 0;display:flex;align-items:baseline;gap:12px;">'
    +'<span class="hm-kpi-value">15,249</span>'
    +'<span class="hm-kpi-change up">+4%</span>'
    +'</div>'
    +'<div class="hm-chart-wrap" style="padding:12px 8px 0;flex:1;">'+loadsChart+'</div>'
    +'<div style="display:flex;justify-content:space-between;padding:4px 20px 0;">'
    +'<span style="font-size:11px;color:var(--soft);">Jan</span>'
    +'<span style="font-size:11px;color:var(--soft);">Apr</span>'
    +'<span style="font-size:11px;color:var(--soft);">Jul</span>'
    +'</div>'
    +hmCardFooter('Last updated 5 min ago')+'</div>';

  var specBars = [3,11,25,34,46,25,23,32,13,6,3];
  var specMax = Math.max.apply(null,specBars);
  var specBarsHtml = specBars.map(function(v){
    return '<div class="hm-bar" style="height:'+(v/specMax*100)+'%;background:var(--blue);"></div>';
  }).join('');
  var specCard = hmCard('hm-spec', hmCardHeader('Delivered on spec','')
    +'<div style="padding:16px 20px 0;display:flex;align-items:baseline;gap:12px;">'
    +'<span class="hm-kpi-value">91%</span>'
    +'<span class="hm-kpi-change up">+2%</span>'
    +'</div>'
    +'<div class="hm-bar-wrap">'+specBarsHtml+'</div>'
    +hmCardFooter('Last updated 5 min ago'));

  var uptimeCard = hmCard('hm-uptime', hmCardHeader('Fleet uptime','')
    +'<div style="display:flex;flex-direction:column;align-items:center;padding:16px 20px 0;flex:1;justify-content:center;">'
    +hmDonut(94,'#3069e3',130)
    +'<div style="display:flex;align-items:baseline;gap:8px;margin-top:4px;">'
    +'<span class="hm-kpi-change up" style="font-size:14px;">+1.2%</span>'
    +'<span style="font-size:13px;color:var(--soft);">vs last week</span>'
    +'</div></div>'
    +hmCardFooter('Last updated 5 min ago'));

  var row2 = '<div class="hm-row-3">'+loadsCard+specCard+uptimeCard+'</div>';

  /* ── Row 3: Batch scorecard (full width) ── */
  var scData = [
    {h:208,s:200},{h:150,s:115},{h:121,s:104},{h:97,s:63},{h:81,s:50},
    {h:66,s:38},{h:50,s:26},{h:36,s:13},{h:16,s:6},{h:20,s:8},{h:10,s:5}
  ];
  var scMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov'];
  var scMax = 220;
  var scBarsHtml = scData.map(function(d,i){
    return '<div class="hm-sc-bar-pair">'
      +'<div class="hm-sc-bar-a" style="height:'+(d.h/scMax*100)+'%;background:#3069e3;"></div>'
      +'<div class="hm-sc-bar-b" style="height:'+(d.s/scMax*100)+'%;background:#e3f200;"></div>'
      +'</div>';
  }).join('');
  var scLabels = scMonths.map(function(m){ return '<span>'+m+'</span>'; }).join('');
  var scCard = '<div class="hm-card" style="min-height:200px;">'
    +hmCardHeader('Batch scorecard','')
    +'<div class="hm-scorecard-wrap">'
    +'<div style="display:flex;gap:16px;margin-bottom:10px;">'
    +'<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--defined);">'
    +'<span style="width:10px;height:10px;border-radius:2px;background:#3069e3;display:inline-block;"></span>On spec</div>'
    +'<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--defined);">'
    +'<span style="width:10px;height:10px;border-radius:2px;background:#e3f200;display:inline-block;"></span>Off spec</div>'
    +'</div>'
    +'<div class="hm-scorecard-bars">'+scBarsHtml+'</div>'
    +'<div class="hm-scorecard-labels">'+scLabels+'</div>'
    +'</div>'
    +hmCardFooter('Last updated 5 min ago')+'</div>';

  var row3 = scCard;

  /* ── Row 4: 3 KPI cards ── */
  var ttdCard = hmCard('hm-ttd', hmCardHeader('Time to discharge','')
    +'<div style="display:flex;flex-direction:column;align-items:center;padding:16px 20px 0;flex:1;justify-content:center;">'
    +hmDonut(78,'#059669',130)
    +'<div style="display:flex;align-items:baseline;gap:8px;margin-top:4px;">'
    +'<span class="hm-kpi-change down" style="font-size:14px;">-0.8%</span>'
    +'<span style="font-size:13px;color:var(--soft);">vs last week</span>'
    +'</div></div>'
    +hmCardFooter('Last updated 5 min ago'));

  var eltlCard = hmCard('hm-eltl', hmCardHeader('End load to leave','')
    +'<div style="display:flex;flex-direction:column;align-items:center;padding:16px 20px 0;flex:1;justify-content:center;">'
    +hmDonut(85,'#d97706',130)
    +'<div style="display:flex;align-items:baseline;gap:8px;margin-top:4px;">'
    +'<span class="hm-kpi-change up" style="font-size:14px;">+1.5%</span>'
    +'<span style="font-size:13px;color:var(--soft);">vs last week</span>'
    +'</div></div>'
    +hmCardFooter('Last updated 5 min ago'));

  var plantData = [72,68,74,78,76,80,82,79,83,85,84,88,90,87,91];
  var plantChart = hmSvgLine(plantData,'#7c3aed',400,100,50,100);
  var plantCard = hmCard('hm-plant', hmCardHeader('Plant efficiency','')
    +'<div style="padding:16px 20px 0;display:flex;align-items:baseline;gap:12px;">'
    +'<span class="hm-kpi-value">88%</span>'
    +'<span class="hm-kpi-change up">+3%</span>'
    +'</div>'
    +'<div class="hm-chart-wrap" style="padding:12px 8px 0;flex:1;">'+plantChart+'</div>'
    +hmCardFooter('Last updated 5 min ago'));

  var row4 = '<div class="hm-row-bottom">'+ttdCard+eltlCard+plantCard+'</div>';

  wrap.innerHTML = greetingHtml + row1 + row2 + row3 + row4;

  /* Init Google Map after DOM is painted */
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      hmInitMap();
    });
  });
  /* Init Google Map after DOM is ready */
  requestAnimationFrame(function() { hmInitMap(); });
}

function dtNavGo(page) {
  dtUnitsActivePage = page;
  const trucks  = document.getElementById('dt-page-trucks');
  const units   = document.getElementById('dt-page-units');
  const tickets = document.getElementById('dt-page-tickets');
  const home    = document.getElementById('dt-page-home');
  const update  = document.getElementById('dt-page-update');
  const map     = document.getElementById('dt-page-map');
  if (trucks)  trucks.style.display  = page === 'trucks'  ? '' : 'none';
  if (units)   units.style.display   = page === 'units'   ? '' : 'none';
  if (tickets) { tickets.style.display = page === 'tickets' ? 'flex' : 'none'; if (page === 'tickets') tkInit(); }
  if (home)    { home.classList.toggle('active', page === 'home'); if (page === 'home') hmInit(); }
  if (update)  update.style.display  = page === 'update'  ? 'flex' : 'none';
  if (map)     map.style.display     = page === 'map'     ? 'flex' : 'none';

  // Sidenav active state — respects dark mode
  const navT  = document.getElementById('dt-nav-trucks');
  const navU  = document.getElementById('dt-nav-units');
  const navTk = document.getElementById('dt-nav-tickets');
  const navUp = document.getElementById('dt-nav-update');
  const navMp = document.getElementById('dt-nav-map');
  const dark = document.body.classList.contains('dark');
  const activeBg   = dark ? '#e3f200' : '#3069e3';
  const activeClr  = dark ? '#000' : '#ffffff';
  const inactiveClr = dark ? 'rgba(255,255,255,0.45)' : 'rgba(54,50,45,0.5)';

  const navH = document.getElementById('dt-nav-home');
  [
    { el: navH,  active: page === 'home'    },
    { el: navT,  active: page === 'trucks'  },
    { el: navU,  active: page === 'units'   },
    { el: navTk, active: page === 'tickets' },
    { el: navUp, active: page === 'update'  },
    { el: navMp, active: page === 'map'     },
  ].forEach(({ el, active }) => {
    if (!el) return;
    el.style.background = active ? activeBg : '';
    if (active) el.dataset.active = '1'; else delete el.dataset.active;
    const span = el.querySelector('span');
    if (span) { span.style.color = active ? activeClr : inactiveClr; span.style.fontWeight = active ? '500' : ''; }
  });

  if (page === 'units') dtUnitsRender();
  if (page === 'update' && typeof swuFigmaInit === 'function') swuFigmaInit();
  if (page === 'map'    && typeof dcMapInit    === 'function') dcMapInit();
}

/* ════════════════════════════════════════════════════════════
   DC MAPS PAGE — runtime
   Figma node 1:11486. Renders truck cards on the left and a
   real Leaflet map on the right with phase-colored markers.

   Tile source: OpenStreetMap (default) and CARTO Voyager (terrain
   toggle). Both free, no API key. OSM attribution restored in
   prod — currently styled subtly per Figma.
   ════════════════════════════════════════════════════════════ */

/* ─── Maps fleet
   Source of truth is `trucks[]` (the same fleet All Trucks, Units,
   and Software Update read from). Maps shows the subset that has
   lat/lng — those are added by the enrichTrucksForMaps() IIFE.
   Use dcMapTrucks() to get the live list; don't cache it.
   ───────────────────────────────────────────────────────────── */

/* Module state — populated by dcMapInit, persists across nav. */
window.dcMap = {
  leaflet: null,         // L.Map instance
  markers: {},           // truck.num -> L.Marker
  layers: { osm:null, voyager:null },
  activeNum: null,       // currently focused truck (highlighted in stack + map)
  initialized: false,
  searchQuery: ''
};

/* ─── Phase label lookup (chip class -> human label) ─── */
window.DC_PHASE_LABELS = {
  'waiting-to-load': 'Waiting to load',
  'loading':         'Loading',
  'loaded':          'Loaded',
  'to-job':          'To job',
  'on-site':         'On site',
  'pouring':         'Pouring',
  'washing':         'Washing',
  'return-to-plant': 'Return to plant',
  'ignition-off':    'Ignition off'
};

/* ─── Public init — called by dtNavGo('map') ─── */
function dcMapInit() {
  /* Update page sub label with live truck count */
  var mapSub = document.getElementById('dc-map-page-sub');
  if (mapSub) {
    var count = dcMapTrucks().length;
    mapSub.textContent = 'All Trucks \u00b7 ' + count + ' truck' + (count !== 1 ? 's' : '');
  }

  /* Render the card stack first — works even if Leaflet is still
     loading. */
  dcMapRenderStack();

  /* Inject Plant chips once — they're derived from data, not static. */
  dcMapFilterPlantChips();

  /* Leaflet loads from CDN; if it's not ready yet, retry shortly. */
  if (typeof L === 'undefined') {
    setTimeout(dcMapInit, 80);
    return;
  }
  if (window.dcMap.initialized) {
    /* Re-attach: invalidateSize fixes Leaflet rendering when the
       container was display:none then made visible. */
    setTimeout(function() {
      if (window.dcMap.leaflet) window.dcMap.leaflet.invalidateSize();
    }, 60);
    return;
  }

  var map = L.map('dc-map-leaflet', {
    center:[37.7649, -122.2300],   /* SF Bay — frames most markers */
    zoom:11,
    zoomControl:false,
    attributionControl:true,
    keyboard:false   /* prevent Leaflet focus on flyTo causing browser page scroll */
  });

  /* Two free tile providers — toggle via the terrain button.
     Both are CC-BY and free, no key. */
  var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19,
    attribution:'© OpenStreetMap'
  });
  var voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
    maxZoom:19,
    subdomains:'abcd',
    attribution:'© OpenStreetMap, © CARTO'
  });

  osm.addTo(map);
  window.dcMap.leaflet = map;
  window.dcMap.layers.osm = osm;
  window.dcMap.layers.voyager = voyager;

  /* Build all markers up front. */
  dcMapTrucks().forEach(function(t) {
    var html =
      '<div class="dc-map-marker ' + t.phase + '" ' +
        'onclick="dcMapFocusTruck(\'' + t.num + '\', true)">' +
        t.num +
      '</div>';
    var icon = L.divIcon({
      className:'dc-map-marker-wrap',
      html:html,
      iconSize:null,    /* let CSS size naturally */
      iconAnchor:[0, 0] /* offset handled in CSS */
    });
    var m = L.marker([t.lat, t.lng], { icon:icon });
    m.addTo(map);
    window.dcMap.markers[t.num] = m;
  });

  window.dcMap.initialized = true;

  /* When the page becomes visible the container size may be 0 at
     init. invalidateSize flushes Leaflet's internal cache. */
  setTimeout(function() { map.invalidateSize(); }, 80);
}

/* ═══════════════════════════════════════════════════════════
   TABLET / MOBILE MAP  (tbm-*)
   Mirrors dcMapInit logic but targets #tbm-leaflet and the
   horizontal card strip instead of the desktop 2-col layout.
   ═══════════════════════════════════════════════════════════ */
window.tbMap = {
  leaflet:     null,
  markers:     {},
  layers:      { osm:null, voyager:null },
  activeNum:   null,
  initialized: false,
  searchQuery: ''
};

function tbMapInit() {
  /* Populate stat bar — mirrors desktop dc-map-metric-* values */
  var setEl = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('tbm-stat-commissioned', '250');
  setEl('tbm-stat-maint-req',    '3');
  setEl('tbm-stat-maint-sched',  '20');
  setEl('tbm-stat-oos',          '2');
  setEl('tbm-stat-in-maint',     '5');

  /* Update subtitle with live truck count */
  var n = (typeof dcMapTrucks === 'function') ? dcMapTrucks().length : 0;
  setEl('tb-map-subtitle', 'All Trucks \u00b7 ' + n + ' truck' + (n !== 1 ? 's' : ''));

  tbmRenderCards();

  if (typeof L === 'undefined') {
    setTimeout(tbMapInit, 80);
    return;
  }

  if (window.tbMap.initialized) {
    setTimeout(function() {
      if (window.tbMap.leaflet) window.tbMap.leaflet.invalidateSize();
    }, 60);
    return;
  }

  var map = L.map('tbm-leaflet', {
    center: [37.7649, -122.2300],
    zoom: 11,
    zoomControl: false,
    attributionControl: true,
    keyboard: false
  });

  var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '\u00a9 OpenStreetMap'
  });
  var voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
    maxZoom: 19, subdomains: 'abcd', attribution: '\u00a9 OpenStreetMap, \u00a9 CARTO'
  });

  osm.addTo(map);
  window.tbMap.leaflet = map;
  window.tbMap.layers.osm = osm;
  window.tbMap.layers.voyager = voyager;

  /* Build markers — reuses .dc-map-marker CSS */
  if (typeof dcMapTrucks === 'function') {
    dcMapTrucks().forEach(function(t) {
      var html =
        '<div class="dc-map-marker ' + t.phase + '" ' +
          'onclick="tbmOpenTruckDrawer(\'' + t.num + '\')">' +
          t.num +
        '</div>';
      var icon = L.divIcon({
        className: 'dc-map-marker-wrap',
        html: html,
        iconSize: null,
        iconAnchor: [0, 0]
      });
      var m = L.marker([t.lat, t.lng], { icon: icon });
      m.addTo(map);
      window.tbMap.markers[t.num] = m;
    });
  }

  window.tbMap.initialized = true;
  setTimeout(function() { map.invalidateSize(); }, 80);
}

/* Render / re-render the horizontal truck card strip */
function tbmRenderCards() {
  var strip = document.getElementById('tbm-card-strip');
  if (!strip || typeof dcMapTrucks !== 'function') return;

  var q = (window.tbMap.searchQuery || '').trim().toLowerCase();
  var trucks = dcMapTrucks();
  if (q) {
    trucks = trucks.filter(function(t) {
      return t.num.indexOf(q) !== -1 ||
             (t.driver || '').toLowerCase().indexOf(q) !== -1;
    });
  }

  var LABELS = window.DC_PHASE_LABELS || {};
  var html = trucks.map(function(t) {
    var phaseLabel = LABELS[t.phase] || t.phase;
    var subtitle = t.loadedMinAgo === 0
      ? 'Waiting at plant'
      : 'Loaded ' + t.loadedMinAgo + ' min ago';
    var activeCls = window.tbMap.activeNum === t.num ? ' active' : '';
    return (
      '<div class="tbm-card' + activeCls + '" onclick="tbmFocusTruck(\'' + t.num + '\')" data-truck="' + t.num + '">' +
        '<div class="tbm-card-head">' +
          '<div class="tbm-card-id">' +
            '<div class="tbm-card-num">' + t.num + '</div>' +
            '<div class="tbm-card-driver">' + t.driver + '</div>' +
          '</div>' +
          '<div class="tbm-card-sensors">' +
            '<div class="tbm-card-sensor">' + t.temp + '\u00b0F</div>' +
            '<div class="tbm-card-sensor">' + t.slump + '"</div>' +
            (t.alerts > 0 ? '<div class="tbm-card-alert"><svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 3v6M8 12v1" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg></div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="tbm-card-sub">' + subtitle + '</div>' +
        '<div class="tbm-card-meta">' +
          '<div class="tbm-card-meta-key">Plant</div><div class="tbm-card-meta-val">' + t.plant + '</div>' +
          '<div class="tbm-card-meta-key">Mode</div><div class="tbm-card-meta-val">' + t.mode + '</div>' +
        '</div>' +
        '<div class="tbm-card-footer">' +
          '<div class="tbm-card-phase ' + t.phase + '">' + phaseLabel + '</div>' +
          '<div class="tbm-card-phase-dur">' +
            '<span class="tbm-card-phase-dur-pre">for </span>' +
            '<span>' + t.phaseDur + '</span>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  strip.innerHTML = html ||
    '<div style="padding:16px;font-family:var(--font);font-size:13px;color:var(--soft);">No trucks match.</div>';
}

function tbmFocusTruck(num) {
  /* Clear previous active marker */
  if (window.tbMap.activeNum && window.tbMap.markers[window.tbMap.activeNum]) {
    var prev = window.tbMap.markers[window.tbMap.activeNum].getElement();
    if (prev) { var pp = prev.querySelector('.dc-map-marker'); if (pp) pp.classList.remove('active'); }
  }
  window.tbMap.activeNum = num;
  /* Set new active marker */
  var el = window.tbMap.markers[num] && window.tbMap.markers[num].getElement();
  if (el) { var pill = el.querySelector('.dc-map-marker'); if (pill) pill.classList.add('active'); }
  /* Pan map */
  var trucks = (typeof dcMapTrucks === 'function') ? dcMapTrucks() : [];
  var t = trucks.find(function(x) { return x.num === num; });
  if (t && window.tbMap.leaflet) {
    window.tbMap.leaflet.panTo([t.lat, t.lng], { animate: true, duration: 0.4 });
  }
  /* Re-render cards to show active highlight */
  tbmRenderCards();
  /* Scroll the card strip to the active card — horizontal only, never vertical */
  var strip = document.getElementById('tbm-card-strip');
  var card  = document.querySelector('.tbm-card[data-truck="' + num + '"]');
  if (strip && card) {
    var target = card.offsetLeft - (strip.offsetWidth / 2) + (card.offsetWidth / 2);
    strip.scrollTo({ left: target, behavior: 'smooth' });
  }
  /* Drawer opens only on second tap (marker click) — see tbmOpenTruckDrawer */
}

/* Called by marker click — focuses the truck first, then opens the drawer */
function tbmOpenTruckDrawer(num) {
  tbmFocusTruck(num);
  if (typeof tbOpenTruck === 'function') tbOpenTruck(num);
}

function tbmSearchOnInput() {
  var inp = document.getElementById('tbm-search-input');
  var clr = document.getElementById('tbm-srch-clear');
  window.tbMap.searchQuery = inp ? inp.value : '';
  if (clr) clr.style.display = window.tbMap.searchQuery ? '' : 'none';
  tbmRenderCards();
}

function tbmSearchClear() {
  var inp = document.getElementById('tbm-search-input');
  var clr = document.getElementById('tbm-srch-clear');
  if (inp) inp.value = '';
  if (clr) clr.style.display = 'none';
  window.tbMap.searchQuery = '';
  tbmRenderCards();
}

function tbmZoom(delta) {
  if (window.tbMap.leaflet) window.tbMap.leaflet.setZoom(window.tbMap.leaflet.getZoom() + delta);
}

function tbmLocate() {
  if (!window.tbMap.leaflet) return;
  window.tbMap.leaflet.locate({ setView: true, maxZoom: 13 });
}

function tbmToggleTraffic(btn) {
  btn.classList.toggle('active');
}

function tbmToggleTerrain(btn) {
  if (!window.tbMap.leaflet) return;
  btn.classList.toggle('active');
  var isVoyager = btn.classList.contains('active');
  if (isVoyager) {
    if (window.tbMap.layers.osm) window.tbMap.layers.osm.remove();
    if (window.tbMap.layers.voyager) window.tbMap.layers.voyager.addTo(window.tbMap.leaflet);
  } else {
    if (window.tbMap.layers.voyager) window.tbMap.layers.voyager.remove();
    if (window.tbMap.layers.osm) window.tbMap.layers.osm.addTo(window.tbMap.leaflet);
  }
}

function tbmToggleFullscreen() {
  var area = document.getElementById('tbm-map-area');
  if (!area) return;
  area.classList.toggle('tbm-fullscreen');
  if (window.tbMap.leaflet) setTimeout(function() { window.tbMap.leaflet.invalidateSize(); }, 60);
}

/* ═══════════════════════════════════════════════════════════════════
   MOBILE MAP — moMap*  /  mom*
   Full-screen Leaflet map page for the mobile (phone) shell.
   Flow: moGoMap() → moMapInit() → momRenderCards()
         card tap → moFocusTruck() (highlight + pan)
         marker tap → moOpenTruckDrawer() (focus + open drawer)
═══════════════════════════════════════════════════════════════════ */

window.moMap = {
  leaflet:      null,
  markers:      {},
  layers:       { osm: null, voyager: null },
  activeNum:    null,
  initialized:  false,
  searchQuery:  ''
};

/* Synthetic per-truck order data — seeded from truck number so values
   are stable across renders but vary per truck. No fabricated readings. */
function momTruckMeta(num) {
  var seed   = parseInt(String(num).replace(/\D/g,''), 10) || 1;
  var customers = ['Construction Co. Miami','Skyline Builders','Valley Concrete','Metro Contracting','Desert Build Co.'];
  var mixes     = ['CJ00S','A4500','B3200','C6000','MX-900','D2800'];
  var cust  = customers[seed % customers.length];
  var order = String(90000000 + (seed * 7919) % 9999999);
  var ticket = String(900000 + (seed * 1301) % 99999);
  var mix   = mixes[seed % mixes.length];
  var eta   = ((seed % 18) + 4);
  return { customer: cust, order: order, ticket: ticket, mix: mix, eta: eta };
}

/* Navigate to mobile map page */
function moGoMap() {
  mobSwuClose();
  /* Close side nav if open */
  if (typeof closeNav === 'function') closeNav();


  var page = document.getElementById('mo-page-map');
  if (!page) return;

  page.classList.add('active');

  /* Mark Map as active in sidenav */
  document.querySelectorAll('.sn-sub-item').forEach(function(i) { i.classList.remove('active'); });
  document.querySelectorAll('.sn-sub-item').forEach(function(i) {
    if (i.textContent.trim() === 'Map') i.classList.add('active');
  });

  if (!window.moMap.initialized) {
    if (typeof L === 'undefined') {
      setTimeout(moMapInit, 80);
    } else {
      moMapInit();
    }
  } else {
    setTimeout(function() {
      if (window.moMap.leaflet) window.moMap.leaflet.invalidateSize();
    }, 60);
  }
}

/* Navigate back from mobile map to main screen */
function moMapBack() {
  var page = document.getElementById('mo-page-map');
  if (page) page.classList.remove('active');
}

/* Sidenav dispatcher — routes to mobile or tablet map based on active shell */
function snGoMap() {
  var isTablet = document.body.classList.contains('view-tablet');
  if (isTablet) {
    tbNavMap();
  } else {
    moGoMap();
  }
}

/* Initialise Leaflet on #mom-leaflet */
function moMapInit() {
  if (window.moMap.initialized) return;
  if (typeof L === 'undefined') { setTimeout(moMapInit, 80); return; }

  var map = L.map('mom-leaflet', {
    center: [37.7649, -122.2300],
    zoom: 11,
    zoomControl: false,
    attributionControl: true,
    keyboard: false
  });

  var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '\u00a9 OpenStreetMap'
  });
  var voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
    maxZoom: 19, subdomains: 'abcd', attribution: '\u00a9 OpenStreetMap, \u00a9 CARTO'
  });

  osm.addTo(map);
  window.moMap.leaflet = map;
  window.moMap.layers.osm     = osm;
  window.moMap.layers.voyager = voyager;

  /* Build markers — reuse .dc-map-marker CSS (same tokens) */
  if (typeof dcMapTrucks === 'function') {
    dcMapTrucks().forEach(function(t) {
      var html =
        '<div class="dc-map-marker ' + t.phase + '" ' +
          'onclick="moOpenTruckDrawer(\'' + t.num + '\')">' +
          t.num +
        '</div>';
      var icon = L.divIcon({
        className: 'dc-map-marker-wrap',
        html: html,
        iconSize: null,
        iconAnchor: [0, 0]
      });
      var m = L.marker([t.lat, t.lng], { icon: icon });
      m.addTo(map);
      window.moMap.markers[t.num] = m;
    });
  }

  window.moMap.initialized = true;
  momRenderCards();
  setTimeout(function() { map.invalidateSize(); }, 80);

  /* Drag-to-scroll on card strip (desktop prototype demos) */
  momInitStripDrag();
}

/* Render / re-render the horizontal truck card strip */
function momRenderCards() {
  var strip = document.getElementById('mom-card-strip');
  if (!strip || typeof dcMapTrucks !== 'function') return;

  var q = (window.moMap.searchQuery || '').trim().toLowerCase();
  var trucks = dcMapTrucks();
  if (q) {
    trucks = trucks.filter(function(t) {
      return t.num.indexOf(q) !== -1 ||
             (t.driver || '').toLowerCase().indexOf(q) !== -1;
    });
  }

  var LABELS = window.DC_PHASE_LABELS || {};
  var html = trucks.map(function(t) {
    var phaseLabel  = LABELS[t.phase] || t.phase;
    var meta        = momTruckMeta(t.num);
    var subtitle    = t.loadedMinAgo === 0
      ? 'Waiting at plant'
      : 'Loaded ' + t.loadedMinAgo + ' min ago';
    var activeCls   = window.moMap.activeNum === t.num ? ' active' : '';
    var alertBadge  = (t.alerts > 0 || t.err > 0)
      ? '<div class="mom-card-alert"><svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 3v6M8 12v1" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg></div>'
      : '';
    return (
      '<div class="mom-card' + activeCls + '" onclick="moFocusTruck(\'' + t.num + '\')" data-truck="' + t.num + '">' +
        /* Header */
        '<div class="mom-card-head">' +
          '<div class="mom-card-id">' +
            '<div class="mom-card-num">' + t.num + '</div>' +
            '<div class="mom-card-driver">' + (t.driver || '—') + '</div>' +
          '</div>' +
          '<div class="mom-card-sensors">' +
            '<div class="mom-card-sensor">' + (t.temp || '—') + '\u00b0F</div>' +
            '<div class="mom-card-sensor">' + (t.slump || '—') + '"</div>' +
            alertBadge +
          '</div>' +
        '</div>' +
        /* Subtitle */
        '<div class="mom-card-sub">' + subtitle + '</div>' +
        /* Meta grid */
        '<div class="mom-card-meta">' +
          '<div class="mom-card-meta-key">Customer</div><div class="mom-card-meta-val">' + meta.customer + '</div>' +
          '<div class="mom-card-meta-key">Order</div><div class="mom-card-meta-val">' + meta.order + '</div>' +
          '<div class="mom-card-meta-key">Ticket</div><div class="mom-card-meta-val">' + meta.ticket + '</div>' +
          '<div class="mom-card-meta-key">Mix</div><div class="mom-card-meta-val">' + meta.mix + '</div>' +
        '</div>' +
        /* Footer */
        '<div class="mom-card-footer">' +
          '<div style="display:flex;align-items:center;gap:4px;">' +
            '<div class="mom-card-phase ' + t.phase + '">' + phaseLabel + '</div>' +
            '<div class="mom-card-phase-dur">' +
              '<span class="mom-card-phase-dur-pre">for </span>' +
              '<span>' + (t.phaseDur || '—') + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="mom-card-eta">ETA in ' + meta.eta + ' min</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  strip.innerHTML = html || '<div style="padding:16px;font-size:14px;color:var(--soft);font-family:var(--font);">No trucks match</div>';
}

/* Card tap — highlight marker + pan map, no drawer */
function moFocusTruck(num) {
  /* Clear previous active marker */
  if (window.moMap.activeNum && window.moMap.markers[window.moMap.activeNum]) {
    var prev = window.moMap.markers[window.moMap.activeNum].getElement();
    if (prev) { var pp = prev.querySelector('.dc-map-marker'); if (pp) pp.classList.remove('active'); }
  }
  window.moMap.activeNum = num;
  /* Set new active marker */
  var el = window.moMap.markers[num] && window.moMap.markers[num].getElement();
  if (el) { var pill = el.querySelector('.dc-map-marker'); if (pill) pill.classList.add('active'); }
  /* Pan map */
  var truckList = (typeof dcMapTrucks === 'function') ? dcMapTrucks() : [];
  var t = truckList.find(function(x) { return x.num === num; });
  if (t && window.moMap.leaflet) {
    window.moMap.leaflet.panTo([t.lat, t.lng], { animate: true, duration: 0.4 });
  }
  /* Re-render cards to show active highlight */
  momRenderCards();
  /* Scroll strip to active card — horizontal only, never touch vertical page scroll */
  var strip = document.getElementById('mom-card-strip');
  var card  = document.querySelector('.mom-card[data-truck="' + num + '"]');
  if (strip && card) {
    var target = card.offsetLeft - (strip.offsetWidth / 2) + (card.offsetWidth / 2);
    strip.scrollTo({ left: target, behavior: 'smooth' });
  }
}

/* Marker tap — focus then open the drawer on top of the map */
function moOpenTruckDrawer(num) {
  moFocusTruck(num);

  var truckList = (typeof trucks !== 'undefined') ? trucks : [];
  var idx = truckList.findIndex(function(t) { return String(t.num) === String(num); });
  if (idx < 0) return;

  /* Flag so closeDrawer() restores Map active state in sidenav */
  window._drawerOpenedFromMap = true;

  if (typeof openDrawer === 'function') {
    openDrawer(idx, { list: truckList.map(function(_, i) { return i; }), idx: idx });
  }
}

/* Search */
function momSearchOnInput() {
  var inp = document.getElementById('mom-search-input');
  var clr = document.getElementById('mom-srch-clear');
  window.moMap.searchQuery = inp ? inp.value : '';
  if (clr) clr.style.display = window.moMap.searchQuery ? '' : 'none';
  momRenderCards();
}
function momSearchClear() {
  var inp = document.getElementById('mom-search-input');
  var clr = document.getElementById('mom-srch-clear');
  if (inp) inp.value = '';
  if (clr) clr.style.display = 'none';
  window.moMap.searchQuery = '';
  momRenderCards();
}

/* Map controls */
function momZoom(delta) {
  if (window.moMap.leaflet) window.moMap.leaflet.setZoom(window.moMap.leaflet.getZoom() + delta);
}
function momLocate() {
  if (!window.moMap.leaflet) return;
  window.moMap.leaflet.locate({ setView: true, maxZoom: 13 });
}
function momToggleTraffic(btn) {
  btn.classList.toggle('active');
}
function momToggleTerrain(btn) {
  if (!window.moMap.leaflet) return;
  btn.classList.toggle('active');
  var isVoyager = btn.classList.contains('active');
  if (isVoyager) {
    if (window.moMap.layers.osm)     window.moMap.layers.osm.remove();
    if (window.moMap.layers.voyager) window.moMap.layers.voyager.addTo(window.moMap.leaflet);
  } else {
    if (window.moMap.layers.voyager) window.moMap.layers.voyager.remove();
    if (window.moMap.layers.osm)     window.moMap.layers.osm.addTo(window.moMap.leaflet);
  }
}
function momToggleFullscreen() {
  var area = document.getElementById('mom-map-area');
  if (!area) return;
  area.classList.toggle('tbm-fullscreen'); /* reuse tbm-fullscreen CSS */
  if (window.moMap.leaflet) setTimeout(function() { window.moMap.leaflet.invalidateSize(); }, 60);
}

/* Drag-to-scroll for desktop prototype demos (mirrors tbm handler) */
function momInitStripDrag() {
  var strip = document.getElementById('mom-card-strip');
  if (!strip) return;

  var isDown = false, startX, scrollLeft;
  var velX = 0, lastX = 0, lastT = 0, rafId = null;

  function getMap() { return window.moMap && window.moMap.leaflet; }
  function lockPage(lock) {
    var shell = document.querySelector('.phone') || document.body;
    shell.style.overflow = lock ? 'hidden' : '';
    var m = getMap();
    if (m) {
      if (lock) { m.dragging.disable(); m.scrollWheelZoom.disable(); }
      else      { m.dragging.enable();  m.scrollWheelZoom.enable();  }
    }
  }
  function glide() {
    velX *= 0.88;
    if (Math.abs(velX) < 0.5) return;
    strip.scrollLeft -= velX;
    rafId = requestAnimationFrame(glide);
  }

  strip.addEventListener('mousedown', function(e) {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    isDown = true;
    startX = e.clientX; scrollLeft = strip.scrollLeft;
    lastX = e.clientX; lastT = Date.now(); velX = 0;
    strip.style.cursor = 'grabbing';
    lockPage(true);
    e.preventDefault(); e.stopPropagation();
  }, { passive: false });

  strip.addEventListener('mousemove', function(e) {
    if (!isDown) return;
    var now = Date.now(), dt = Math.max(now - lastT, 1);
    velX = (lastX - e.clientX) / dt * 16;
    lastX = e.clientX; lastT = now;
    strip.scrollLeft = scrollLeft - (e.clientX - startX);
    e.preventDefault(); e.stopPropagation();
  }, { passive: false });

  document.addEventListener('mouseup', function() {
    if (!isDown) return;
    isDown = false;
    strip.style.cursor = '';
    lockPage(false);
    rafId = requestAnimationFrame(glide);
  });
}

/* ─── Mouse-drag scroll for tbm-card-strip (desktop prototype demos) ───
   Touch devices use native -webkit-overflow-scrolling; this handler adds
   click-and-drag on desktop where touch events don't fire. */
(function() {
  function initStripDrag() {
    var strip = document.getElementById('tbm-card-strip');
    if (!strip) return;

    var isDown = false, startX, scrollLeft;
    var velX = 0, lastX = 0, lastT = 0, rafId = null;

    function getMap() { return window.tbMap && window.tbMap.leaflet; }

    /* Lock the outer prototype shell so it cannot scroll while we drag */
    function lockPage(lock) {
      var shell = document.querySelector('.phone') || document.body;
      shell.style.overflow = lock ? 'hidden' : '';
      var m = getMap();
      if (m) {
        if (lock) { m.dragging.disable(); m.scrollWheelZoom.disable(); }
        else      { m.dragging.enable();  m.scrollWheelZoom.enable();  }
      }
    }

    /* Momentum glide after release */
    function glide() {
      velX *= 0.88;                          /* friction */
      if (Math.abs(velX) < 0.5) return;     /* stop when negligible */
      strip.scrollLeft -= velX;
      rafId = requestAnimationFrame(glide);
    }

    strip.addEventListener('mousedown', function(e) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      isDown    = true;
      startX    = e.clientX;
      scrollLeft = strip.scrollLeft;
      lastX     = e.clientX;
      lastT     = Date.now();
      velX      = 0;
      strip.style.cursor = 'grabbing';
      lockPage(true);
      e.preventDefault();
      e.stopPropagation();
    }, { passive: false });

    /* mousemove on the strip itself — not document — so it never reaches page scroll */
    strip.addEventListener('mousemove', function(e) {
      if (!isDown) return;
      var now = Date.now();
      var dt  = Math.max(now - lastT, 1);
      velX    = (lastX - e.clientX) / dt * 16;   /* px/frame @60fps */
      lastX   = e.clientX;
      lastT   = now;
      strip.scrollLeft = scrollLeft - (e.clientX - startX);
      e.preventDefault();
      e.stopPropagation();
    }, { passive: false });

    /* Also catch mouseup on document in case mouse leaves the strip */
    document.addEventListener('mouseup', function() {
      if (!isDown) return;
      isDown = false;
      strip.style.cursor = '';
      lockPage(false);
      rafId = requestAnimationFrame(glide);  /* kick off momentum */
    });
  }
  /* Strip exists in DOM immediately but map page may not be active yet —
     init on first activation or immediately if DOM is ready. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStripDrag);
  } else {
    initStripDrag();
  }
})();

/* ─── Render the truck card stack ─── */
function dcMapRenderStack() {
  var stack = document.getElementById('dc-map-stack');
  if (!stack) return;

  /* Two-stage filtering — search query (free-text) then the
     filter popover state (chip groups). Both must pass. */
  var q = (window.dcMap.searchQuery || '').trim().toLowerCase();
  var trucks = dcMapTrucks().filter(dcMapTruckPassesFilters);
  if (q) {
    trucks = trucks.filter(function(t) {
      return t.num.indexOf(q) !== -1 ||
             (t.driver || '').toLowerCase().indexOf(q) !== -1;
    });
  }

  var html = trucks.map(function(t) {
    var phaseLabel = DC_PHASE_LABELS[t.phase] || t.phase;
    var ignClass = t.ignition === 'off' ? 'off' : '';
    var ignText = t.ignition === 'off' ? 'Ignition off' : 'Ignition on';
    var subtitle = t.loadedMinAgo === 0
      ? 'Waiting at plant'
      : 'Loaded ' + t.loadedMinAgo + ' min ago';
    var activeCls = window.dcMap.activeNum === t.num ? ' active' : '';
    return (
      '<div class="dc-tc' + activeCls + '" onclick="dcMapFocusTruck(\'' + t.num + '\', false)" data-truck="' + t.num + '">' +
        '<div class="dc-tc-head">' +
          '<div class="dc-tc-head-row">' +
            '<div class="dc-tc-id-block">' +
              '<div class="dc-tc-num">' + t.num + '</div>' +
              '<div class="dc-tc-driver">' + t.driver + '</div>' +
            '</div>' +
            '<div class="dc-tc-ignition ' + ignClass + '">' +
              '<span class="dc-tc-ign-dot"></span>' +
              '<span>' + ignText + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="dc-tc-subtitle">' + subtitle + '</div>' +
        '</div>' +
        '<div class="dc-tc-meta">' +
          '<div class="dc-tc-meta-key">Truck Mode</div>' +
          '<div class="dc-tc-meta-val">' + t.mode + '</div>' +
          '<div class="dc-tc-meta-key">Plant</div>' +
          '<div class="dc-tc-meta-val">' + t.plant + '</div>' +
        '</div>' +
        '<div class="dc-tc-footer">' +
          '<div class="dc-tc-phase-chip ' + t.phase + '">' + phaseLabel + '</div>' +
          '<div class="dc-tc-phase-dur">' +
            '<span class="dc-tc-phase-dur-pre">for</span>' +
            '<span class="dc-tc-phase-dur-val">' + t.phaseDur + '</span>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  stack.innerHTML = html || '<div style="padding:32px 12px;font-family:var(--font);font-size:13px;color:var(--soft);text-align:center;">No trucks match.</div>';
}

/* ─── Card ↔ marker linking ─── */
function dcMapFocusTruck(num, fromMarker) {
  var truck = dcMapTrucks().find(function(t) { return t.num === num; });
  if (!truck) return;

  /* Clear previous active marker styling */
  if (window.dcMap.activeNum && window.dcMap.markers[window.dcMap.activeNum]) {
    var prevEl = window.dcMap.markers[window.dcMap.activeNum].getElement();
    if (prevEl) {
      var prevPill = prevEl.querySelector('.dc-map-marker');
      if (prevPill) prevPill.classList.remove('active');
    }
  }

  window.dcMap.activeNum = num;

  /* Mark the new marker active */
  var nowEl = window.dcMap.markers[num] && window.dcMap.markers[num].getElement();
  if (nowEl) {
    var nowPill = nowEl.querySelector('.dc-map-marker');
    if (nowPill) nowPill.classList.add('active');
  }

  /* Re-render stack so the active card highlights */
  dcMapRenderStack();

  /* If the click came from a card, pan/zoom the map. If from a
     marker, scroll the matching card into view. */
  if (window.dcMap.leaflet) {
    if (!fromMarker) {
      /* Zoom 15 = neighborhood scale — close enough to see the
         truck's surroundings, far enough to stay oriented. Bumped
         up from 13 (city scale) which felt too zoomed out. */
      window.dcMap.leaflet.flyTo([truck.lat, truck.lng], 15, { duration:0.6 });
    }
  }
  if (fromMarker) {
    setTimeout(function() {
      var card = document.querySelector('.dc-tc[data-truck="' + num + '"]');
      if (card) {
        var stack = document.querySelector('.dc-map-stack');
        if (stack) {
          var stackTop = stack.getBoundingClientRect().top;
          var cardTop  = card.getBoundingClientRect().top;
          var target   = stack.scrollTop + (cardTop - stackTop) - (stack.clientHeight / 2) + (card.offsetHeight / 2);
          stack.scrollTo({ top: target, behavior: 'smooth' });
        }
      }
    }, 30);
    /* Marker click also opens the truck drawer so the user can dig into
       the truck without a second click. Card click keeps the existing
       pan/zoom-only behavior — drawer only opens from the marker. */
    if (typeof dtOpenTruck === 'function') {
      dtOpenTruck(num);
    }
  }
}

/* ════════════════════════════════════════════════════════════
   DC MAPS — TYPEAHEAD SEARCH (mirrors All Trucks .dt-srch-*)
   The truck-number field shows a dropdown with matching trucks
   while the user types, with the matching characters highlighted.
   Selecting a result calls dcMapFocusTruck so the map flies to
   the truck and its card scrolls into view in the stack.
   ════════════════════════════════════════════════════════════ */

/* Module state for typeahead. Kept on window so re-renders don't reset. */
window.dcMapSrch = {
  query: '',
  shown: [],   /* trucks currently visible in dropdown — array index drives selection */
  activeIdx: -1
};

/* Wrap a substring match in a highlight chip — same DOM as
   .dt-srch-chip / .dt-srch-soft so the All Trucks CSS styles it. */
function dcMapSrchHighlight(text, query) {
  if (!query) return '<span class="dt-srch-soft">' + text + '</span>';
  var lower = text.toLowerCase();
  var idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return '<span class="dt-srch-soft">' + text + '</span>';
  var before = text.slice(0, idx);
  var match  = text.slice(idx, idx + query.length);
  var after  = text.slice(idx + query.length);
  return (before ? '<span class="dt-srch-soft">' + before + '</span>' : '') +
         '<span class="dt-srch-chip">' + match + '</span>' +
         (after ? '<span class="dt-srch-soft">' + after + '</span>' : '');
}

function dcMapSrchOnInput() {
  var input = document.getElementById('dc-map-search-input');
  var clearBtn = document.getElementById('dc-map-srch-clear');
  var drop = document.getElementById('dc-map-srch-drop');
  if (!input || !drop) return;

  var q = (input.value || '').trim();
  window.dcMapSrch.query = q;
  window.dcMapSrch.activeIdx = -1;

  /* Old name kept on window for the stack filter — same value */
  window.dcMap.searchQuery = q;

  if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

  /* Re-render the card stack with the search applied */
  dcMapRenderStack();

  if (!q) { drop.style.display = 'none'; return; }

  var ql = q.toLowerCase();
  var matches = dcMapTrucks().filter(function(t) {
    return String(t.num).toLowerCase().indexOf(ql) !== -1 ||
           (t.driver || '').toLowerCase().indexOf(ql) !== -1 ||
           (t.plant  || '').toLowerCase().indexOf(ql) !== -1;
  });

  window.dcMapSrch.shown = matches;

  var resultsEl = document.getElementById('dc-map-srch-results');
  if (!resultsEl) return;

  if (matches.length === 0) {
    resultsEl.innerHTML = '<div class="dt-srch-no-hits">No matches found</div>';
    drop.style.display = 'block';
    return;
  }

  /* Same truck icon used in All Trucks dropdown header — for visual match */
  var truckIcon =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none">' +
      '<path d="M2.5 13C1.94772 13 1.5 12.5523 1.5 12V9.80278C1.5 9.60535 1.55844 9.41234 1.66795 9.24808L3.20313 6.9453C3.3886 6.6671 3.70083 6.5 4.03518 6.5H6V12C6 12.5523 6.44772 13 7 13H11" stroke="#36322d9e" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<circle cx="4" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/>' +
      '<circle cx="12" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/>' +
      '<path d="M12.2242 5.15477L8.65195 6.06584C6.54213 6.60392 5.61922 9.08368 6.86385 10.8702L11.9902 10.8575L14.0825 7.82226C14.204 7.64525 14.204 7.41112 14.0811 7.23472L12.7748 5.35971C12.6519 5.18331 12.4325 5.10164 12.2242 5.15477Z" stroke="#36322d9e" stroke-width="1.2"/>' +
    '</svg>';

  var html =
    '<div class="dt-srch-section-hdr">' +
      truckIcon +
      '<span class="dt-srch-section-label">Trucks</span>' +
    '</div>';

  matches.forEach(function(t, i) {
    var primary   = dcMapSrchHighlight(String(t.num), q);
    var phaseLabel = (DC_PHASE_LABELS && DC_PHASE_LABELS[t.phase]) || t.phase;
    var ignText   = t.ignition === 'off' ? 'Ign Off' : 'Ign On';
    var secondary = (t.plant || '—') + ' · ' + phaseLabel + ' · ' + ignText;
    html +=
      '<div class="dt-srch-row" data-idx="' + i + '" onclick="dcMapSrchSelect(' + i + ')">' +
        '<span class="dt-srch-match-text">' + primary + '</span>' +
        '<span class="dt-srch-meta">' + secondary + '</span>' +
      '</div>';
  });

  resultsEl.innerHTML = html;
  drop.style.display = 'block';
}

function dcMapSrchOnFocus() {
  if (window.dcMapSrch.query) dcMapSrchOnInput();
}

function dcMapSrchClear() {
  var input    = document.getElementById('dc-map-search-input');
  var clearBtn = document.getElementById('dc-map-srch-clear');
  var drop     = document.getElementById('dc-map-srch-drop');
  if (input)    input.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  if (drop)     drop.style.display = 'none';
  window.dcMapSrch.query = '';
  window.dcMapSrch.activeIdx = -1;
  window.dcMap.searchQuery = '';
  dcMapRenderStack();
  if (input) input.focus();
}

function dcMapSrchSelect(idx) {
  var t = window.dcMapSrch.shown[idx];
  if (!t) return;
  /* Hide dropdown, fill input with the truck number */
  var drop  = document.getElementById('dc-map-srch-drop');
  var input = document.getElementById('dc-map-search-input');
  if (drop)  drop.style.display = 'none';
  if (input) input.value = String(t.num);
  window.dcMapSrch.query = String(t.num);
  /* Hand off to the existing focus path: flies map to the truck,
     marks the card active, scrolls it into view in the stack. */
  dcMapFocusTruck(t.num, false);
}

function dcMapSrchKey(e) {
  var drop = document.getElementById('dc-map-srch-drop');
  var open = drop && drop.style.display === 'block';
  if (!open) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    window.dcMapSrch.activeIdx = Math.min(window.dcMapSrch.activeIdx + 1, window.dcMapSrch.shown.length - 1);
    dcMapSrchUpdateActive();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    window.dcMapSrch.activeIdx = Math.max(window.dcMapSrch.activeIdx - 1, 0);
    dcMapSrchUpdateActive();
  } else if (e.key === 'Enter') {
    if (window.dcMapSrch.activeIdx >= 0) {
      e.preventDefault();
      dcMapSrchSelect(window.dcMapSrch.activeIdx);
    }
  } else if (e.key === 'Escape') {
    drop.style.display = 'none';
  }
}

function dcMapSrchUpdateActive() {
  var idx = window.dcMapSrch.activeIdx;
  var rows = document.querySelectorAll('#dc-map-srch-drop .dt-srch-row');
  rows.forEach(function(el, i) { el.classList.toggle('active', i === idx); });
  if (idx >= 0 && rows[idx]) rows[idx].scrollIntoView({ block:'nearest' });
}

/* Click-outside closes the search dropdown — mirrors the filter
   popover handler we added earlier. */
document.addEventListener('click', function(e) {
  var drop = document.getElementById('dc-map-srch-drop');
  if (!drop || drop.style.display !== 'block') return;
  var wrap = document.getElementById('dc-map-srch-wrap');
  if (wrap && wrap.contains(e.target)) return;
  drop.style.display = 'none';
});

/* Backwards compat: the old naive entry point. Routes to the new
   one in case anything else still calls it. Safe to remove later. */


/* ─── Map controls ─── */
function dcMapZoom(delta) {
  if (window.dcMap.leaflet) {
    window.dcMap.leaflet.setZoom(window.dcMap.leaflet.getZoom() + delta);
  }
}
function dcMapLocate() {
  if (!window.dcMap.leaflet) return;
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(function(pos) {
    window.dcMap.leaflet.flyTo([pos.coords.latitude, pos.coords.longitude], 13, { duration:0.6 });
  }, function() {
    /* Permission denied or unavailable — fall back to fitting all markers */
    var bounds = L.latLngBounds(dcMapTrucks().map(function(t) { return [t.lat, t.lng]; }));
    window.dcMap.leaflet.flyToBounds(bounds, { padding:[40,40] });
  });
}
function dcMapToggleTraffic(btn) {
  /* Visual stub — Leaflet+OSM doesn't ship a traffic layer. Real
     impl would use Mapbox Traffic or Google. Toggle the button
     state so the interaction is still demonstrable. */
  btn.classList.toggle('active');
  if (typeof dtShowToast === 'function') {
    dtShowToast({
      title: btn.classList.contains('active') ? 'Traffic on' : 'Traffic off',
      body: 'Traffic data not available in prototype.',
      variant: 'info'
    });
  }
}
function dcMapToggleTerrain(btn) {
  if (!window.dcMap.leaflet) return;
  var active = btn.classList.toggle('active');
  if (active) {
    window.dcMap.leaflet.removeLayer(window.dcMap.layers.osm);
    window.dcMap.layers.voyager.addTo(window.dcMap.leaflet);
  } else {
    window.dcMap.leaflet.removeLayer(window.dcMap.layers.voyager);
    window.dcMap.layers.osm.addTo(window.dcMap.leaflet);
  }
}
function dcMapToggleFullscreen() {
  /* Stub — would request the .dc-map-area to enter the
     Fullscreen API. Out of scope for this prototype slice. */
  if (typeof dtShowToast === 'function') {
    dtShowToast({
      title:'Fullscreen',
      body:'Coming in a later iteration.',
      variant:'info'
    });
  }
}
/* ════════════════════════════════════════════════════════════
   DC MAPS — FILTER SYSTEM
   Mirrors the All Trucks (.dt-flt-*) and SWU (.swu-filter-*)
   patterns. State is a map of group -> Set of selected values.
   Logic is AND across groups, OR within group. Filters apply
   to BOTH the truck stack (left) and the map markers (right).
   ════════════════════════════════════════════════════════════ */

window.dcMapFilterState = {
  phase:    new Set(),
  plant:    new Set(),
  mode:     new Set(),
  ignition: new Set()
};

/* Inject Plant chips dynamically — pulled from dcMapTrucks() so the
   set stays in sync if data changes. Mirrors swuFilterPlantChips. */
function dcMapFilterPlantChips() {
  var host = document.getElementById('dc-map-flt-plant');
  if (!host) return;
  var plants = {};
  dcMapTrucks().forEach(function(t) { if (t.plant) plants[t.plant] = true; });
  var sorted = Object.keys(plants).sort();
  host.innerHTML = sorted.map(function(p) {
    return '<button class="dt-flt-chip" data-group="plant" data-value="' + p + '" ' +
           'onclick="dcMapFilterToggleChip(this)">' + p + '</button>';
  }).join('');
}

/* Predicate: does this truck pass the current filter state?
   AND across groups, OR within group. Empty group = no filter
   on that dimension (lets everything through). */
function dcMapTruckPassesFilters(t) {
  var st = window.dcMapFilterState;
  if (st.phase.size    && !st.phase.has(t.phase))       return false;
  if (st.plant.size    && !st.plant.has(t.plant))       return false;
  if (st.mode.size     && !st.mode.has(t.mode))         return false;
  if (st.ignition.size && !st.ignition.has(t.ignition)) return false;
  return true;
}

/* Total count of active filter chips — drives badge + foot count */
function dcMapFilterTotal() {
  var st = window.dcMapFilterState;
  return st.phase.size + st.plant.size + st.mode.size + st.ignition.size;
}

/* ── Open / close ── */
function dcMapFilterToggle(e) {
  if (e) e.stopPropagation();
  var pop = document.getElementById('dc-map-flt-pop');
  if (!pop) return;
  if (pop.classList.contains('open')) dcMapFilterClose();
  else dcMapFilterOpen();
}
function dcMapFilterOpen() {
  var pop = document.getElementById('dc-map-flt-pop');
  var btn = document.getElementById('dc-map-flt-btn');
  if (!pop) return;
  pop.classList.add('open');
  if (btn) btn.setAttribute('aria-expanded', 'true');
  /* Sync chip active classes from current state — handles re-opens */
  var st = window.dcMapFilterState;
  document.querySelectorAll('#dc-map-flt-pop .dt-flt-chip').forEach(function(chip) {
    var grp = chip.dataset.group;
    var val = chip.dataset.value;
    chip.classList.toggle('active', st[grp] && st[grp].has(val));
  });
  dcMapFilterUpdateFootCount();
  dcMapFilterUpdateResetState();
}
function dcMapFilterClose() {
  var pop = document.getElementById('dc-map-flt-pop');
  var btn = document.getElementById('dc-map-flt-btn');
  if (!pop) return;
  pop.classList.remove('open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

/* ── Chip toggle ── */
function dcMapFilterToggleChip(el) {
  var grp = el.dataset.group;
  var val = el.dataset.value;
  var set = window.dcMapFilterState[grp];
  if (!set) return;
  if (set.has(val)) { set.delete(val); el.classList.remove('active'); }
  else              { set.add(val);    el.classList.add('active'); }
  dcMapFilterReapply();
}

/* ── Reset ── */
function dcMapFilterReset() {
  var st = window.dcMapFilterState;
  Object.keys(st).forEach(function(k) { st[k].clear(); });
  document.querySelectorAll('#dc-map-flt-pop .dt-flt-chip').forEach(function(c) {
    c.classList.remove('active');
  });
  dcMapFilterReapply();
}

/* ── Live re-apply: stack + markers + badge + foot-count ── */
function dcMapFilterReapply() {
  dcMapRenderStack();
  dcMapApplyMarkerVisibility();
  dcMapFilterUpdateBadge();
  dcMapFilterUpdateFootCount();
  dcMapFilterUpdateResetState();
}

function dcMapFilterUpdateBadge() {
  var total = dcMapFilterTotal();
  var btn   = document.getElementById('dc-map-flt-btn');
  var badge = document.getElementById('dc-map-flt-count');
  if (!btn || !badge) return;
  if (total > 0) {
    btn.classList.add('has-filters');
    badge.style.display = 'inline-flex';
    badge.textContent = total;
  } else {
    btn.classList.remove('has-filters');
    badge.style.display = 'none';
  }
}

function dcMapFilterUpdateFootCount() {
  var foot = document.getElementById('dc-map-flt-foot-count');
  if (!foot) return;
  var total = dcMapFilterTotal();
  if (total === 0) { foot.textContent = 'All trucks shown'; return; }
  var visible = dcMapTrucks().filter(dcMapTruckPassesFilters).length;
  foot.textContent = visible + ' of ' + dcMapTrucks().length + ' trucks shown';
}

function dcMapFilterUpdateResetState() {
  var btn = document.getElementById('dc-map-flt-reset');
  if (!btn) return;
  btn.disabled = dcMapFilterTotal() === 0;
}

/* ── Marker visibility — sync to filter state ── */
function dcMapApplyMarkerVisibility() {
  var map = window.dcMap.leaflet;
  if (!map) return;
  dcMapTrucks().forEach(function(t) {
    var m = window.dcMap.markers[t.num];
    if (!m) return;
    var pass = dcMapTruckPassesFilters(t);
    if (pass) {
      if (!map.hasLayer(m)) m.addTo(map);
    } else {
      if (map.hasLayer(m))  map.removeLayer(m);
    }
  });
}

/* Click-outside closes the filter popover. Mirrors the pattern
   used by the Software Status column menus. */
document.addEventListener('click', function(e) {
  var pop = document.getElementById('dc-map-flt-pop');
  if (!pop || !pop.classList.contains('open')) return;
  /* Don't close when click originated inside the wrap (button or popover) */
  var wrap = pop.closest('.dc-map-flt-wrap');
  if (wrap && wrap.contains(e.target)) return;
  dcMapFilterClose();
});

/* ============================================================
   SOFTWARE UPDATE PAGE — Figma node 1:15544 ported as-is
   Generates the truck card stack from the Figma's repeated card.
   ============================================================ */

/* The 5 trucks shown in the visible area. Real product would pull
   this from fleet data; mocked here for prototype. */
/* Deterministic fabricator: turns the global `trucks` array into the
   shape the SWU card list + render functions expect. Seeded by truck
   number so every truck always gets the same driver/phase/etc. across
   reloads. Called lazily by swuFigmaInit so the trucks array is in
   scope by then. */
window.swuFabricateTrucks = function () {
  var DRIVERS = [
    'Chris Jennings', 'Marcus Whitley', 'Daniel Reyes', 'Aaron Chen',
    'Tomás Herrera', 'Jamal Brooks', 'Luis Vega', 'Sam O\u2019Connor',
    'Nadia Petrov', 'Owen Russo', 'Devon Park', 'Ravi Krishnan',
    'Theo Marchetti', 'Ben Carter', 'Diego Núñez', 'Ed Foley',
    'Hank Olsen', 'Ian Wright', 'Joel Tanaka', 'Kyle Mendez',
    'Liam Doyle', 'Marco Silva', 'Nate Hollis', 'Otis Bell',
    'Pete Yamamoto', 'Quinn Walsh', 'Reid Patel', 'Seth Rojas',
    'Trent Burke', 'Vince Ortiz', 'Wes Calloway', 'Xander Lee',
    'Yusuf Ahmed', 'Zane Decker', 'Adam Cole', 'Brian Rivers',
    'Caleb Stone', 'Dean Acosta', 'Evan Kim', 'Felix Gray'
  ];
  var PHASES = [
    { name: 'Waiting to load',  range: [3, 30] },
    { name: 'In transit',       range: [4, 24] },
    { name: 'At plant',         range: [10, 45] },
    { name: 'Discharging',      range: [3, 12] }
  ];
  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
    return Math.abs(h);
  }
  /* `trucks` is a top-level const in this script — directly accessible here. */
  if (typeof trucks === 'undefined' || !Array.isArray(trucks)) return [];
  /* System types — distributed roughly the way a real fleet would mix.
     Most trucks are V5; a small set on Spark / Pulse / V3 to make
     filter-by-system-type meaningful in the demo. */
  var SYS_TYPES = ['V5', 'V5', 'V5', 'V5', 'Spark', 'Pulse', 'V3'];
  return trucks.map(function (t) {
    var s        = String(t.num);
    var seed     = hash(s);
    var driver   = DRIVERS[seed % DRIVERS.length];
    var sysType  = SYS_TYPES[seed % SYS_TYPES.length];
    var ignOn    = (t.ign === 'On' || t.ign === 'on');
    var phaseDef, mode, loadedMin;
    if (!ignOn) {
      phaseDef  = PHASES[2]; // At plant
      mode      = 'Out of service';
      loadedMin = 0;
    } else {
      phaseDef  = PHASES[seed % PHASES.length];
      mode      = 'Live';
      loadedMin = (phaseDef.name === 'In transit' || phaseDef.name === 'Discharging')
                  ? (phaseDef.range[0] + (seed % (phaseDef.range[1] - phaseDef.range[0])))
                  : 0;
    }
    var phaseFor = (phaseDef.range[0] + (seed % (phaseDef.range[1] - phaseDef.range[0]))) + ' min';
    return {
      num:        s,
      driver:     driver,
      ign:        ignOn ? 'on' : 'off',
      loadedMin:  loadedMin,
      mode:       mode,
      plant:      t.plant || '—',
      phase:      phaseDef.name,
      phaseFor:   phaseFor,
      currentVer: t.ver || 'v5.01.008',
      sysType:    sysType
    };
  });
};
window.SWU_TRUCKS = window.swuFabricateTrucks();

/* Master state for the page. Survives multiple swuFigmaInit calls
   (when shell re-routes to this page). */
window.swuState = window.swuState || {
  selected: new Set(),         // truck nums currently selected (Pending in table)
  inFlight: new Set(),         // truck nums where Send was just hit (In Progress)
  completed: new Map(),        // truckNum -> { version, components: [...] }
  failed: new Map(),           // truckNum -> { version, components: [...], failedComponent: 'TCG' }
  expanded: new Set(),         // truck nums with expanded row in the overview table
  attempts: new Map(),         // truckNum -> count of times Send has been hit (drives retry behavior)
};

function swuFigmaInit() {
  const stack = document.getElementById('swu-truck-stack');
  if (!stack) return;
  /* Lazy-rebuild SWU_TRUCKS / SWU_STATUS_FIRMWARE if they came up empty,
     which can happen if script-load order ever shifts. */
  if (!window.SWU_TRUCKS || window.SWU_TRUCKS.length === 0) {
    if (typeof window.swuFabricateTrucks === 'function') {
      window.SWU_TRUCKS = window.swuFabricateTrucks();
    }
  }
  if (!window.SWU_STATUS_FIRMWARE || Object.keys(window.SWU_STATUS_FIRMWARE).length === 0) {
    if (typeof window.swuFabricateFirmware === 'function') {
      window.SWU_STATUS_FIRMWARE = window.swuFabricateFirmware();
    }
  }
  if (stack.dataset.built === '1') {
    // Already built; just re-render in case state changed while page was hidden
    swuRenderOverview();
    swuUpdateSendMeta();
    return;
  }

  function renderCard(t) {
    /* Map truck.mode to status pill class + label.
       'Live' = active operations, dot=green
       'Out of service' = unavailable, dot=red, label = "Out of service"
       Default = idle/grey */
    let statusClass = 'idle', statusLabel = 'Idle';
    if (t.mode === 'Live')               { statusClass = 'live';    statusLabel = 'Live'; }
    else if (t.mode === 'Out of service'){ statusClass = 'error';   statusLabel = 'Out of service'; }
    else if (t.ign === 'off')            { statusClass = 'offline'; statusLabel = 'Offline'; }

    /* Loaded info — prefer "Loaded Nm ago" if loadedMin>0, else show ignition state */
    const loadedTxt = (t.loadedMin > 0)
      ? 'Loaded ' + t.loadedMin + 'm ago'
      : (t.ign === 'on' ? 'Empty · ignition on' : 'Empty · ignition off');

    /* Phase icon — clock for waiting, truck/arrow for transit, etc.
       Default to a clock since "Waiting to load" is the most common case. */
    const phaseIcon = '<svg class="swu-tc-phase-icon" viewBox="0 0 18 18" fill="none">' +
      '<circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.4"/>' +
      '<path d="M9 5v4l2.5 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';

    return (
      '<div class="swu-truck-card" data-truck="' + t.num + '" onclick="swuToggleTruck(\'' + t.num + '\')">' +
        '<div class="swu-tc-check">' +
          '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5L9.5 3.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</div>' +

        '<div class="swu-tc-head">' +
          '<div class="swu-tc-id-block">' +
            '<div class="swu-tc-num">' + t.num + '</div>' +
            '<div class="swu-tc-driver">' + t.driver + '</div>' +
          '</div>' +
          '<div class="swu-tc-status ' + statusClass + '">' +
            '<span class="swu-tc-status-dot"></span>' +
            '<span>' + statusLabel + '</span>' +
          '</div>' +
        '</div>' +

        '<div class="swu-tc-context">' +
          '<span class="swu-tc-context-plant">' + t.plant + '</span>' +
          '<span class="swu-tc-context-sep">·</span>' +
          '<span class="swu-tc-context-loaded">' + loadedTxt + '</span>' +
        '</div>' +

        '<div class="swu-tc-phase">' +
          phaseIcon +
          '<div class="swu-tc-phase-text">' +
            '<span class="swu-tc-phase-name">' + t.phase + '</span>' +
            '<span class="swu-tc-phase-dur">· ' + t.phaseFor + '</span>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  stack.innerHTML = window.SWU_TRUCKS.map(renderCard).join('');
  stack.dataset.built = '1';
  /* Update bulk-bar count to reflect the real fleet size */
  var cntEl = document.getElementById('swu-select-all-count');
  if (cntEl) {
    var n = window.SWU_TRUCKS.length;
    cntEl.textContent = n + ' truck' + (n === 1 ? '' : 's');
  }
  swuRefreshStats();
  swuRefreshCardStates();
  swuUpdateSendMeta();
}

/* Refresh the fleet-wide metric strip at the top of the SWU page.
   Numbers are derived from SWU_TRUCKS + swuState. Compliance/latest
   are heuristic for the prototype (until real version data lands). */
function swuRefreshStats() {
  var trucks = window.SWU_TRUCKS || [];
  var s = window.swuState || { completed: new Map(), failed: new Map(), selected: new Set(), inFlight: new Set() };
  var total = trucks.length;
  /* "On latest version" — anything just-completed counts as latest;
     trucks not in any error/non-compliant bucket also count as latest.
     Simple model: total minus non-compliant minus failed minus pending. */
  var pending = s.selected.size + s.inFlight.size;
  var failed  = s.failed.size;
  /* Out of compliance: deterministic — every Nth truck is non-compliant
     so the number stays stable across reloads. ~20% of fleet. */
  var noncompliant = Math.round(total * 0.2);
  var latest = Math.max(0, total - noncompliant - failed);

  function set(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
  set('swu-stat-total',         total);
  set('swu-stat-latest',        latest);
  set('swu-stat-pending',       pending);
  set('swu-stat-noncompliant',  noncompliant);
  set('swu-stat-failed',        failed);
}

/* Toggle a single truck's selection. Respects locked state (in-flight). */
/* ============================================================
   SOFTWARE UPDATE — search behavior
   Mirrors the All Trucks search pattern (dt-srch-*) so the dropdown
   looks identical. Reuses the same CSS classes for the dropdown,
   highlights, rows, etc. — only the data source and select handler
   differ.

   Search filters across truck#, driver, plant, and current version.
   Click a result → toggle-select the truck card AND scroll it into
   view inside the truck stack.
   ============================================================ */
window.swuSrchActiveQuery = '';
window.swuSrchActiveIdx = -1;
window.swuSrchShownTrucks = [];

function swuSrchHighlight(text, query) {
  /* Reuse All Trucks chip + soft styling so the dropdown looks identical */
  if (!query) return '<span class="dt-srch-soft">' + text + '</span>';
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return '<span class="dt-srch-soft">' + text + '</span>';
  const before = text.slice(0, idx);
  const match  = text.slice(idx, idx + query.length);
  const after  = text.slice(idx + query.length);
  return (
    (before ? '<span class="dt-srch-soft">' + before + '</span>' : '') +
    '<span class="dt-srch-chip">' + match + '</span>' +
    (after ? '<span class="dt-srch-soft">' + after + '</span>' : '')
  );
}

/* ============================================================
   SOFTWARE UPDATE — filter behavior
   Mirrors the All Trucks filter pattern (chip-based, live-applied,
   no Apply button — chips toggle filter immediately).

   State: window.swuFilterState — a map of group -> Set of active values.
   Empty set in any group means "no filter applied for this dimension"
   (i.e. all values pass).

   On chip click: toggle membership, re-apply, update count badge, foot
   count, and the truck-card stack visibility.

   On Reset: clear all sets, re-apply.

   Filter dimensions:
     - plant       (multi)
     - systype     (multi: V3, V5, Spark, Pulse)
     - compliance  (multi: latest, outdated)  — vs. fleet's most-common version
     - status      (multi: none, pending, progress, failed, complete) — driven by swuState
   ============================================================ */
window.swuFilterState = window.swuFilterState || {
  plant:      new Set(),
  systype:    new Set(),
  compliance: new Set(),
  status:     new Set()
};

/* Determine "the latest version" — used to evaluate compliance.
   For the prototype, we treat the most-common version in SWU_TRUCKS as
   the latest. In production this would come from a release manifest. */
function swuLatestVersion() {
  var trucks = window.SWU_TRUCKS || [];
  if (trucks.length === 0) return '';
  var counts = {};
  trucks.forEach(function(t) {
    var v = t.currentVer || '';
    counts[v] = (counts[v] || 0) + 1;
  });
  var winner = '', max = -1;
  Object.keys(counts).forEach(function(v) {
    if (counts[v] > max) { max = counts[v]; winner = v; }
  });
  return winner;
}

/* Resolve a truck's update status from swuState.
   Returns one of: 'pending' | 'progress' | 'failed' | 'complete' | 'none' */
function swuTruckStatus(num) {
  var s = window.swuState;
  if (!s) return 'none';
  if (s.completed.has(num)) return 'complete';
  if (s.failed.has(num))    return 'failed';
  if (s.inFlight.has(num))  return 'progress';
  if (s.selected.has(num))  return 'pending';
  return 'none';
}

/* Build the Plant chip list dynamically from data — plants vary per
   account, so we can't hardcode them. Sorted alphabetically for
   stable order. */
function swuFilterBuildPlantChips() {
  var host = document.getElementById('swu-flt-plant');
  if (!host) return;
  var plants = new Set();
  (window.SWU_TRUCKS || []).forEach(function(t) {
    if (t.plant && t.plant !== '—') plants.add(t.plant);
  });
  var sorted = Array.from(plants).sort();
  host.innerHTML = sorted.map(function(p) {
    /* Escape quotes/backslashes in the value for safe HTML attribute embedding */
    var safe = p.replace(/"/g, '&quot;');
    return (
      '<button class="dt-flt-chip" data-group="plant" data-value="' + safe + '" ' +
      'onclick="swuFilterToggleChip(this)">' + p + '</button>'
    );
  }).join('');
}

/* Open / close the popover */
function swuFilterToggle(e) {
  if (e) e.stopPropagation();
  var pop = document.getElementById('swu-flt-pop');
  if (!pop) return;
  if (pop.classList.contains('open')) swuFilterClose();
  else swuFilterOpen();
}

function swuFilterOpen() {
  var pop = document.getElementById('swu-flt-pop');
  var btn = document.getElementById('swu-flt-btn');
  if (!pop) return;
  /* Build plant chips lazily — cheap and ensures we have current data */
  swuFilterBuildPlantChips();
  pop.classList.add('open');
  if (btn) btn.setAttribute('aria-expanded', 'true');
  /* Sync chip active state to current swuFilterState */
  var st = window.swuFilterState;
  document.querySelectorAll('#swu-flt-pop .dt-flt-chip').forEach(function(chip) {
    var grp = chip.dataset.group;
    var val = chip.dataset.value;
    var on  = !!(st[grp] && st[grp].has(val));
    chip.classList.toggle('active', on);
  });
  swuFilterUpdateFootCount();
}

function swuFilterClose() {
  var pop = document.getElementById('swu-flt-pop');
  var btn = document.getElementById('swu-flt-btn');
  if (!pop) return;
  pop.classList.remove('open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

/* Click a chip → toggle membership in its group's Set. Live-apply. */
function swuFilterToggleChip(el) {
  var grp = el.dataset.group;
  var val = el.dataset.value;
  var st  = window.swuFilterState;
  if (!st[grp]) return;
  if (st[grp].has(val)) { st[grp].delete(val); el.classList.remove('active'); }
  else                  { st[grp].add(val);    el.classList.add('active'); }
  swuFilterReapply();
}

function swuFilterReset() {
  var st = window.swuFilterState;
  Object.keys(st).forEach(function(k) { st[k].clear(); });
  document.querySelectorAll('#swu-flt-pop .dt-flt-chip').forEach(function(c) {
    c.classList.remove('active');
  });
  swuFilterReapply();
}

/* Apply the current filter state to the truck stack — hide cards that
   don't match. Keeps the running-log of completed cards intact (just
   hides the cards that don't pass the filter). */
function swuFilterReapply() {
  var st     = window.swuFilterState;
  var latest = swuLatestVersion();
  var trucks = window.SWU_TRUCKS || [];
  var anyActive =
    st.plant.size + st.systype.size + st.compliance.size + st.status.size > 0;

  /* Decide pass/fail per truck. AND across groups, OR within a group. */
  var passing = trucks.filter(function(t) {
    if (st.plant.size      > 0 && !st.plant.has(t.plant)) return false;
    if (st.systype.size    > 0 && !st.systype.has(t.sysType)) return false;
    if (st.compliance.size > 0) {
      var isLatest = (t.currentVer === latest);
      var matchLatest   = st.compliance.has('latest')   && isLatest;
      var matchOutdated = st.compliance.has('outdated') && !isLatest;
      if (!matchLatest && !matchOutdated) return false;
    }
    if (st.status.size > 0) {
      var s = swuTruckStatus(t.num);
      if (!st.status.has(s)) return false;
    }
    return true;
  });

  /* Hide non-passing cards via display:none. We don't move/reorder
     because the completed-cards-drop-to-bottom behavior is already in
     swuReorderTruckStack. Just toggle visibility. */
  var passingNums = new Set(passing.map(function(t) { return t.num; }));
  document.querySelectorAll('.swu-truck-card[data-truck]').forEach(function(card) {
    var ok = passingNums.has(card.dataset.truck);
    card.style.display = ok ? '' : 'none';
  });

  /* Update bulk-select count to reflect the filtered visible set */
  var cntEl = document.getElementById('swu-select-all-count');
  if (cntEl) {
    var n = passing.length;
    cntEl.textContent = n + ' truck' + (n === 1 ? '' : 's');
  }

  swuFilterUpdateBadge();
  swuFilterUpdateFootCount(passing.length);
  /* Toggle the active styling on the button itself */
  var btn = document.getElementById('swu-flt-btn');
  if (btn) btn.classList.toggle('has-filters', anyActive);
}

function swuFilterUpdateBadge() {
  var st = window.swuFilterState;
  var n  = st.plant.size + st.systype.size + st.compliance.size + st.status.size;
  var el = document.getElementById('swu-flt-count');
  if (!el) return;
  if (n > 0) { el.textContent = n; el.style.display = ''; }
  else       { el.style.display = 'none'; }
}

function swuFilterUpdateFootCount(passingCount) {
  var el = document.getElementById('swu-flt-foot-count');
  if (!el) return;
  var st = window.swuFilterState;
  var anyActive =
    st.plant.size + st.systype.size + st.compliance.size + st.status.size > 0;
  if (!anyActive) {
    el.textContent = 'All trucks shown';
    return;
  }
  /* If caller didn't provide a count, derive it now */
  if (typeof passingCount !== 'number') {
    var latest = swuLatestVersion();
    var trucks = window.SWU_TRUCKS || [];
    passingCount = trucks.filter(function(t) {
      if (st.plant.size      > 0 && !st.plant.has(t.plant)) return false;
      if (st.systype.size    > 0 && !st.systype.has(t.sysType)) return false;
      if (st.compliance.size > 0) {
        var isLatest = (t.currentVer === latest);
        var matchLatest   = st.compliance.has('latest')   && isLatest;
        var matchOutdated = st.compliance.has('outdated') && !isLatest;
        if (!matchLatest && !matchOutdated) return false;
      }
      if (st.status.size > 0) {
        var s = swuTruckStatus(t.num);
        if (!st.status.has(s)) return false;
      }
      return true;
    }).length;
  }
  el.textContent = passingCount + ' truck' + (passingCount === 1 ? '' : 's') + ' shown';
}

/* Close the popover when clicking outside it */
document.addEventListener('click', function(e) {
  var pop = document.getElementById('swu-flt-pop');
  var wrap = document.getElementById('swu-flt-wrap');
  if (!pop || !wrap) return;
  if (!pop.classList.contains('open')) return;
  if (!wrap.contains(e.target)) swuFilterClose();
});

function swuSrchOnInput() {
  const input = document.getElementById('swu-search-input');
  const q = input.value.trim();
  window.swuSrchActiveQuery = q;
  window.swuSrchActiveIdx = -1;

  document.getElementById('swu-srch-field').classList.toggle('active', q.length > 0);
  document.getElementById('swu-srch-clear').style.display = q.length > 0 ? 'block' : 'none';

  const drop = document.getElementById('swu-srch-drop');
  if (!q) { drop.style.display = 'none'; return; }

  const trucks = window.SWU_TRUCKS || [];
  const ql = q.toLowerCase();
  const matches = trucks.filter(t =>
    String(t.num).toLowerCase().includes(ql) ||
    (t.driver || '').toLowerCase().includes(ql) ||
    (t.plant  || '').toLowerCase().includes(ql) ||
    (t.currentVer || '').toLowerCase().includes(ql)
  );

  const MAX = 6;
  const shown = matches.slice(0, MAX);
  const extra = matches.length - MAX;
  window.swuSrchShownTrucks = shown;

  const resultsEl = document.getElementById('swu-srch-results');
  if (matches.length === 0) {
    resultsEl.innerHTML = '<div class="dt-srch-no-hits">No matches found</div>';
    drop.style.display = 'block';
    return;
  }

  /* Reuse the same truck icon SVG as All Trucks */
  const truckIcon = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 13C1.94772 13 1.5 12.5523 1.5 12V9.80278C1.5 9.60535 1.55844 9.41234 1.66795 9.24808L3.20313 6.9453C3.3886 6.6671 3.70083 6.5 4.03518 6.5H6V12C6 12.5523 6.44772 13 7 13H11" stroke="#36322d9e" stroke-width="1.2" stroke-linejoin="round"/><circle cx="4" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/><circle cx="12" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/><path d="M12.2242 5.15477L8.65195 6.06584C6.54213 6.60392 5.61922 9.08368 6.86385 10.8702L11.9902 10.8575L14.0825 7.82226C14.204 7.64525 14.204 7.41112 14.0811 7.23472L12.7748 5.35971C12.6519 5.18331 12.4325 5.10164 12.2242 5.15477Z" stroke="#36322d9e" stroke-width="1.2"/></svg>';

  let html = (
    '<div class="dt-srch-section-hdr">' + truckIcon +
    '<span class="dt-srch-section-label">Trucks</span></div>'
  );

  shown.forEach((t, i) => {
    const primary = swuSrchHighlight(String(t.num), q);
    const secondary = (t.plant || '—') + ' · ' + (t.currentVer || '—') + ' · ' + (t.driver || '—');
    html += (
      '<div class="dt-srch-row" data-idx="' + i + '" onclick="swuSrchSelect(' + i + ')">' +
        '<span class="dt-srch-match-text">' + primary + '</span>' +
        '<span class="dt-srch-meta">' + secondary + '</span>' +
      '</div>'
    );
  });

  if (extra > 0) {
    html += '<div class="dt-srch-show-more" onclick="swuSrchShowMore()">Show ' + extra + ' more truck' + (extra > 1 ? 's' : '') + '</div>';
  }

  resultsEl.innerHTML = html;
  drop.style.display = 'block';
}

function swuSrchOnFocus() {
  if (window.swuSrchActiveQuery) swuSrchOnInput();
}

function swuSrchClear() {
  const input = document.getElementById('swu-search-input');
  input.value = '';
  window.swuSrchActiveQuery = '';
  window.swuSrchActiveIdx = -1;
  document.getElementById('swu-srch-field').classList.remove('active');
  document.getElementById('swu-srch-clear').style.display = 'none';
  document.getElementById('swu-srch-drop').style.display = 'none';
  input.focus();
}

function swuSrchSelect(idx) {
  const t = window.swuSrchShownTrucks[idx];
  if (!t) return;
  /* Close the dropdown and clear the query — keep the search field
     value so the user knows what they searched for, but get out of
     the way so they can see the selected truck in the stack. */
  document.getElementById('swu-srch-drop').style.display = 'none';

  /* Toggle-select the truck if it's not locked. swuToggleTruck handles
     the lock check (in-flight / completed). Failed is allowed. */
  swuToggleTruck(String(t.num));

  /* Scroll the truck card into view inside the stack so the user can
     see what they just selected. The reorder logic doesn't move
     non-completed cards, so scrolling is enough. */
  const card = document.querySelector('.swu-truck-card[data-truck="' + t.num + '"]');
  if (card && typeof card.scrollIntoView === 'function') {
    card.scrollIntoView({ block:'center', behavior:'smooth' });
  }
}

function swuSrchShowMore() {
  /* Re-render the full match list (no MAX cap) — same simple approach
     as All Trucks. */
  const q = window.swuSrchActiveQuery;
  if (!q) return;
  const trucks = window.SWU_TRUCKS || [];
  const ql = q.toLowerCase();
  const matches = trucks.filter(t =>
    String(t.num).toLowerCase().includes(ql) ||
    (t.driver || '').toLowerCase().includes(ql) ||
    (t.plant  || '').toLowerCase().includes(ql) ||
    (t.currentVer || '').toLowerCase().includes(ql)
  );
  window.swuSrchShownTrucks = matches;

  const truckIcon = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 13C1.94772 13 1.5 12.5523 1.5 12V9.80278C1.5 9.60535 1.55844 9.41234 1.66795 9.24808L3.20313 6.9453C3.3886 6.6671 3.70083 6.5 4.03518 6.5H6V12C6 12.5523 6.44772 13 7 13H11" stroke="#36322d9e" stroke-width="1.2" stroke-linejoin="round"/><circle cx="4" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/><circle cx="12" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/><path d="M12.2242 5.15477L8.65195 6.06584C6.54213 6.60392 5.61922 9.08368 6.86385 10.8702L11.9902 10.8575L14.0825 7.82226C14.204 7.64525 14.204 7.41112 14.0811 7.23472L12.7748 5.35971C12.6519 5.18331 12.4325 5.10164 12.2242 5.15477Z" stroke="#36322d9e" stroke-width="1.2"/></svg>';

  let html = (
    '<div class="dt-srch-section-hdr">' + truckIcon +
    '<span class="dt-srch-section-label">Trucks</span></div>'
  );
  matches.forEach((t, i) => {
    const primary = swuSrchHighlight(String(t.num), q);
    const secondary = (t.plant || '—') + ' · ' + (t.currentVer || '—') + ' · ' + (t.driver || '—');
    html += (
      '<div class="dt-srch-row" data-idx="' + i + '" onclick="swuSrchSelect(' + i + ')">' +
        '<span class="dt-srch-match-text">' + primary + '</span>' +
        '<span class="dt-srch-meta">' + secondary + '</span>' +
      '</div>'
    );
  });
  document.getElementById('swu-srch-results').innerHTML = html;
}

function swuSrchKey(e) {
  const drop = document.getElementById('swu-srch-drop');
  const visible = drop && drop.style.display === 'block';
  if (!visible) return;
  const rows = document.querySelectorAll('#swu-srch-results .dt-srch-row');
  if (rows.length === 0) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    window.swuSrchActiveIdx = Math.min(rows.length - 1, window.swuSrchActiveIdx + 1);
    rows.forEach((r, i) => r.classList.toggle('active', i === window.swuSrchActiveIdx));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    window.swuSrchActiveIdx = Math.max(0, window.swuSrchActiveIdx - 1);
    rows.forEach((r, i) => r.classList.toggle('active', i === window.swuSrchActiveIdx));
  } else if (e.key === 'Enter') {
    if (window.swuSrchActiveIdx >= 0) {
      e.preventDefault();
      swuSrchSelect(window.swuSrchActiveIdx);
    }
  } else if (e.key === 'Escape') {
    swuSrchClear();
  }
}

/* Close the dropdown when clicking anywhere outside the search wrapper */
document.addEventListener('click', function(e) {
  const wrap = document.getElementById('swu-srch-wrap');
  const drop = document.getElementById('swu-srch-drop');
  if (!wrap || !drop) return;
  if (drop.style.display !== 'block') return;
  if (!wrap.contains(e.target)) drop.style.display = 'none';
});

function swuToggleTruck(num) {
  const s = window.swuState;
  // In-flight: locked (currently being sent).
  // Completed: locked (truck is already on the target version).
  // Failed: UNLOCKED — user can re-select to retry. The Failed entry
  // stays in the running log below; a new Pending row appears at the top.
  if (s.inFlight.has(num) || s.completed.has(num)) return;

  if (s.selected.has(num)) s.selected.delete(num);
  else s.selected.add(num);

  swuRefreshCardStates();
  swuRenderOverview();
  swuUpdateSendMeta();
  swuUpdateSendState();
}

/* Toggle select-all on the header card. Respects locked trucks.
   Failed trucks are NOT locked — they can be re-selected to retry. */
function swuToggleAll() {
  const s = window.swuState;
  const eligible = window.SWU_TRUCKS
    .map(t => t.num)
    .filter(n => !s.inFlight.has(n) && !s.completed.has(n));
  // If everyone eligible is already selected, deselect all. Otherwise select all eligible.
  const allSelected = eligible.every(n => s.selected.has(n));
  if (allSelected) {
    eligible.forEach(n => s.selected.delete(n));
  } else {
    eligible.forEach(n => s.selected.add(n));
  }
  swuRefreshCardStates();
  swuRenderOverview();
  swuUpdateSendMeta();
  swuUpdateSendState();
}

/* Sync visual state of every truck card to swuState. */
function swuRefreshCardStates() {
  const s = window.swuState;
  document.querySelectorAll('.swu-truck-card[data-truck]').forEach(card => {
    const num = card.dataset.truck;
    card.classList.toggle('selected', s.selected.has(num));
    /* Locked = card is greyed/un-clickable. Failed is NOT locked — the
       user can re-select it to retry the update. */
    const locked = s.inFlight.has(num) || s.completed.has(num);
    card.classList.toggle('locked', locked);
  });
  /* Completed cards drop to the bottom of the stack so the active /
     selectable trucks stay at the top where the eye lands. Same pattern
     as the Package Overview running log. Done via DOM appendChild so
     the cards physically move (preserves any in-flight transitions). */
  swuReorderTruckStack();
  // Header card "all-selected" state
  const hdr = document.getElementById('swu-select-all-card');
  if (hdr) {
    const eligible = window.SWU_TRUCKS
      .map(t => t.num)
      .filter(n => !s.inFlight.has(n) && !s.completed.has(n));
    const allSel = eligible.length > 0 && eligible.every(n => s.selected.has(n));
    hdr.classList.toggle('all-selected', allSel);
    const lbl = document.getElementById('swu-select-all-label');
    if (lbl) lbl.textContent = allSel ? 'Deselect all' : 'Select all';
  }
  /* Keep the fleet-wide stats in sync with selection / in-flight / failed */
  if (typeof swuRefreshStats === 'function') swuRefreshStats();
  /* If filters are active, re-apply them — a truck's status may have just
     changed (Pending → In Progress → Complete) which can flip its filter
     match. No-op if no filter is active. */
  if (typeof swuFilterReapply === 'function') {
    var fst = window.swuFilterState;
    if (fst && (fst.plant.size + fst.systype.size + fst.compliance.size + fst.status.size) > 0) {
      swuFilterReapply();
    }
  }
}

/* Move completed truck cards to the bottom of the stack. Active /
   selectable cards stay in their original (truck-number) order on top. */
function swuReorderTruckStack() {
  const stack = document.getElementById('swu-truck-stack');
  if (!stack) return;
  const s = window.swuState;
  const cards = Array.from(stack.querySelectorAll('.swu-truck-card[data-truck]'));
  /* Append every completed card to the end. appendChild on an existing
     child moves it — cards already at the bottom stay where they are. */
  cards.forEach(card => {
    if (s.completed.has(card.dataset.truck)) {
      stack.appendChild(card);
    }
  });
}

/* Update the "Sending to N Trucks" meta below the Send button. */
function swuUpdateSendMeta() {
  const meta = document.getElementById('swu-send-meta');
  if (!meta) return;
  const n = window.swuState.selected.size;
  if (n === 0) meta.textContent = 'No trucks selected';
  else if (n === 1) meta.textContent = 'Sending to 1 truck';
  else meta.textContent = 'Sending to ' + n + ' trucks';
}

/* ============================================================
   PACKAGE OVERVIEW table render
   Single source of truth: swuState. Rebuild table from state.
   ============================================================ */
function swuRenderOverview() {
  const empty = document.getElementById('swu-overview-empty');
  const pop   = document.getElementById('swu-overview-populated');
  const tbody = document.getElementById('swu-ovt-tbody');
  const footL = document.getElementById('swu-foot-left');
  const footR = document.getElementById('swu-foot-right');
  if (!empty || !pop || !tbody) return;

  const s = window.swuState;
  /* Layout the table as a running log of today's work:
       1. Pending     — selected but not sent yet (top, you're about to act)
       2. In Progress — currently sending
       3. Failed      — newest failure first
       4. Complete    — newest completion first
     This keeps the active work at the top and lets the day's history
     accumulate underneath. Re-selecting a previously-completed truck
     for another update is allowed; that truck's completed entry stays
     in the log AND a new pending row appears at the top. */
  const orderedNums = window.SWU_TRUCKS.map(t => t.num);

  const pendingRows  = [];
  const inFlightRows = [];
  /* Build pending + in-flight in stable truck-number order */
  orderedNums.forEach(num => {
    if (s.inFlight.has(num)) {
      inFlightRows.push({ num, status:'progress', data: { version: s.inFlight._pkg } });
    } else if (s.selected.has(num)) {
      const truck = window.SWU_TRUCKS.find(t => t.num === num);
      pendingRows.push({ num, status:'pending', data: { version: truck.currentVer } });
    }
  });

  /* Failed + Complete sorted newest-first by _at timestamp */
  const failedRows = Array.from(s.failed.entries())
    .map(([num, data]) => ({ num, status:'failed', data, _at: data._at || 0 }))
    .sort((a, b) => b._at - a._at);
  const completedRows = Array.from(s.completed.entries())
    .map(([num, data]) => ({ num, status:'complete', data, _at: data._at || 0 }))
    .sort((a, b) => b._at - a._at);

  const rows = [].concat(pendingRows, inFlightRows, failedRows, completedRows);

  if (rows.length === 0) {
    empty.style.display = '';
    pop.style.display = 'none';
    if (footL) footL.textContent = 'Awaiting selection';
    if (footR) footR.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  pop.style.display = 'flex';
  if (footL) footL.textContent = '';
  if (footR) {
    footR.style.display = '';
    footR.textContent = '1 - ' + rows.length + ' of ' + rows.length + ' Records';
  }

  function statusPill(status) {
    if (status === 'pending')   return '<span class="swu-status swu-status-pending">Pending</span>';
    if (status === 'progress')  return '<span class="swu-status swu-status-progress"><span class="swu-spinner"></span>In Progress</span>';
    if (status === 'complete')  return '<span class="swu-status swu-status-complete"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Complete</span>';
    if (status === 'failed')    return '<span class="swu-status swu-status-failed"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 3l4 4M7 3l-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>Failed</span>';
    return '';
  }

  function expandCell(status, isExpanded) {
    /* Always rendered so the grid stays stable across status changes.
       Visibility is controlled by the .expandable class on the row. */
    var label = isExpanded ? 'Hide' : 'View';
    return (
      '<div class="swu-ovt-expand-cell">' +
        '<div class="swu-ovt-chev">' +
          '<svg width="10" height="6" viewBox="0 0 10 6" fill="none">' +
            '<path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>' +
        '</div>' +
        '<span class="swu-ovt-expand-label">' + label + '</span>' +
      '</div>'
    );
  }

  function expandedBody(num, data, status) {
    /* Failed: show update results with status pills + failure banner.
       Complete: show update results with status pills.
       Pending: show CURRENT firmware on each component — preview before sending. */
    let banner = '';
    if (status === 'failed' && data.failedComponent) {
      const retryVer = data.version || '';
      banner = (
        '<div class="swu-fail-banner" onclick="event.stopPropagation()">' +
          '<span class="swu-fail-banner-msg">' +
            data.failedComponent + ' update failed. Remaining components were skipped to prevent partial state. Re-run the update or contact support.' +
          '</span>' +
          '<button class="swu-fail-retry-btn" onclick="swuRetryFailed(\'' + num + '\', \'' + retryVer + '\'); event.stopPropagation();">' +
            '<svg width="12" height="12" viewBox="0 0 12 12" fill="none">' +
              '<path d="M10 2v3h-3M2 10v-3h3M9.5 7a4 4 0 0 1-7-1M2.5 5a4 4 0 0 1 7 1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
            'Retry update' +
          '</button>' +
        '</div>'
      );
    }

    let compRows = '';
    let title = 'Component update results';

    if (status === 'pending') {
      /* Pull current firmware from the Status data, fall back to placeholder. */
      const fw = (window.SWU_STATUS_FIRMWARE && window.SWU_STATUS_FIRMWARE[num]) || {};
      const components = [
        { name: 'TCG', current: fw.tcg },
        { name: 'ICD', current: fw.icd },
        { name: 'ED',  current: fw.ed  },
        { name: 'WDS', current: fw.wds },
        { name: 'CWR', current: fw.cwr }
      ];
      title = 'Current firmware on this truck';
      compRows = components.map(c => {
        const cur = (c.current === '—' || !c.current) ? '<span class="swu-na">—</span>' : c.current;
        return (
          '<div class="swu-comp-row">' +
            '<div class="swu-comp-name">' + c.name + '</div>' +
            '<div class="swu-comp-vers">' + cur + '</div>' +
            '<div class="swu-comp-status pending">Awaiting update</div>' +
          '</div>'
        );
      }).join('');
    } else {
      /* Complete / Failed: existing behavior */
      const comps = data.components || [];
      compRows = comps.map(c => {
        const arrow = '<span class="swu-comp-vers-arrow">→</span>';
        const versHtml = (c.fromVer && c.toVer)
          ? c.fromVer + ' ' + arrow + ' ' + c.toVer
          : (c.toVer || '');
        const statusClass = c.status;
        const statusLabel = c.status === 'complete' ? 'Complete' : (c.status === 'failed' ? 'Failed' : 'Skipped');
        return (
          '<div class="swu-comp-row">' +
            '<div class="swu-comp-name">' + c.name + '</div>' +
            '<div class="swu-comp-vers">' + versHtml + '</div>' +
            '<div class="swu-comp-status ' + statusClass + '">' + statusLabel + '</div>' +
          '</div>'
        );
      }).join('');
    }

    return (
      '<div class="swu-ovt-expand" data-expand-for="' + num + '">' +
        banner +
        '<div class="swu-comp-title">' + title + '</div>' +
        '<div class="swu-comp-grid">' + compRows + '</div>' +
      '</div>'
    );
  }

  tbody.innerHTML = rows.map((r, i) => {
    const isExpandable = r.status === 'complete' || r.status === 'failed' || r.status === 'pending';
    const isExpanded = isExpandable && s.expanded.has(r.num);
    const altClass = (i % 2 === 1) ? ' alt' : '';
    const expClass = (isExpandable ? ' expandable' : '') + (isExpanded ? ' expanded' : '');
    const onClick = isExpandable ? (' onclick="swuToggleExpand(\'' + r.num + '\')"') : '';

    let html = (
      '<div class="swu-ovt-row' + altClass + expClass + '"' + onClick + '>' +
        expandCell(r.status, isExpanded) +
        '<div class="swu-ovt-row-cell">' + r.num + '</div>' +
        '<div class="swu-ovt-row-cell">' + statusPill(r.status) + '</div>' +
        '<div class="swu-ovt-row-cell vers">' + (r.data.version || '—') + '</div>' +
      '</div>'
    );
    if (isExpandable) {
      html += expandedBody(r.num, r.data, r.status);
    }
    return html;
  }).join('');
}

/* Expand or collapse a row in the Package Overview. */
function swuToggleExpand(num) {
  const s = window.swuState;
  if (s.expanded.has(num)) s.expanded.delete(num);
  else s.expanded.add(num);
  swuRenderOverview();
}

/* ============================================================
   SEND UPDATES — the main action.
   1. Move all selected → inFlight (status=In Progress in table).
   2. After 2.5s, resolve each truck:
      - If 3+ trucks, fail one (deterministic: 2nd-to-last selected).
      - Otherwise all complete.
   3. Components: 5 per truck, varied old versions, all upgrade to picked version.
   4. Failed truck: failed component is "TCG" (the brain), rest are skipped.
   ============================================================ */
function swuSendUpdates() {
  const s = window.swuState;
  if (s.selected.size === 0) return;
  if (!window.swuDdState || !window.swuDdState.version || !window.swuDdState.commit) return;

  const newVer = window.swuDdState.version;
  const sending = Array.from(s.selected);
  s.selected.clear();

  swuExecuteSend(sending, newVer);
}

/* Retry a single failed truck from inside its expanded warning banner.
   Bypasses the version dropdown — uses the version that originally
   failed so the user gets exactly the same update they tried before.
   One-click recovery from the failure detail. */
function swuRetryFailed(num, version) {
  if (!num || !version) return;
  const s = window.swuState;
  /* Defensive: don't retry an already-in-flight truck */
  if (s.inFlight.has(num)) return;
  /* Don't fire if this truck somehow isn't in failed (shouldn't happen
     since the button only renders for failed rows, but stay safe) */
  if (!s.failed.has(num)) return;
  swuExecuteSend([num], version);
}

/* Shared send pipeline. Moves trucks → inFlight, schedules resolution,
   updates UI. Used by both Send Updates (multi-truck batch) and the
   per-row Retry button. */
function swuExecuteSend(sending, newVer) {
  const s = window.swuState;
  if (!sending || sending.length === 0 || !newVer) return;

  // Move trucks → inFlight. If a truck is being retried (was in
  // s.failed), clear the stale Failed entry so it doesn't double-render
  // as both In Progress (top) and Failed (history). The retry creates
  // a fresh result.
  sending.forEach(n => {
    s.inFlight.add(n);
    if (s.failed.has(n)) s.failed.delete(n);
    if (s.expanded.has(n)) s.expanded.delete(n);
    /* Track attempt count so 12457 can fail on first attempt and
       succeed on retry. Counter increments every time Send is hit. */
    s.attempts.set(n, (s.attempts.get(n) || 0) + 1);
  });
  s.inFlight._pkg = newVer; // remember what version was being sent

  swuRefreshCardStates();
  swuRenderOverview();
  swuUpdateSendMeta();
  swuUpdateSendState();

  // After 2.5s, resolve each truck
  setTimeout(function() {
    /* Failure target: truck 12457 fails on its FIRST send attempt and
       succeeds on retry. Demonstrates the failure-then-recovery flow
       without needing real backend behavior. The attempts Map drives this. */
    const failTarget = (
      sending.includes('12457') && (s.attempts.get('12457') || 0) === 1
    ) ? '12457' : null;

    sending.forEach(num => {
      const truck = window.SWU_TRUCKS.find(t => t.num === num);
      const fromVer = truck ? truck.currentVer : 'v2.3.8';

      // Build component results
      const baseComps = [
        { name: 'TCG',           fromVer: fromVer,  toVer: newVer },
        { name: 'Sensor Module', fromVer: 'v1.4.2', toVer: 'v1.5.0' },
        { name: 'ICD',           fromVer: 'v3.1.0', toVer: 'v3.2.0' },
        { name: 'ED',            fromVer: 'v2.2.1', toVer: 'v2.2.5' },
        { name: 'CWR',           fromVer: 'v1.8.4', toVer: 'v1.8.4', skipReason: 'no change' },
      ];

      if (num === failTarget) {
        // TCG fails; subsequent components skipped
        const components = baseComps.map((c, i) => {
          if (i === 0) return Object.assign({}, c, { status:'failed', toVer: '—' });
          return Object.assign({}, c, { status:'skipped', toVer: '—' });
        });
        s.failed.set(num, { version: newVer, components: components, failedComponent: 'TCG', _at: Date.now() });
      } else {
        const components = baseComps.map(c => Object.assign({}, c, { status:'complete' }));
        s.completed.set(num, { version: newVer, components: components, _at: Date.now() });
      }

      s.inFlight.delete(num);
    });

    // Update truck currentVer in mock data so subsequent re-selection shows the new version
    s.completed.forEach((data, num) => {
      const truck = window.SWU_TRUCKS.find(t => t.num === num);
      if (truck) truck.currentVer = data.version;
    });

    swuRefreshCardStates();
    swuRenderOverview();
    swuUpdateSendMeta();
  }, 2500);
}

/* ============================================================
   Update Software widget — dropdown behavior
   Two dropdowns:
     - 'version' — release version (no default)
     - 'commit'  — commit timing (default: "On Next Startup")
   ============================================================ */
window.swuDdState = window.swuDdState || { version: null, commit: 'On Next Startup' };

function swuDdToggle(name) {
  document.querySelectorAll('.swu-dd-wrap').forEach(w => {
    if (w.dataset.dd === name) {
      w.classList.toggle('open');
    } else {
      w.classList.remove('open');
    }
  });
}

function swuDdSelect(name, value) {
  window.swuDdState[name] = value;
  const valEl = document.getElementById('swu-dd-val-' + name);
  if (valEl) {
    valEl.textContent = value;
    valEl.classList.remove('placeholder');
  }
  // Update selected styling in the menu
  const menu = document.getElementById('swu-dd-menu-' + name);
  if (menu) {
    menu.querySelectorAll('.swu-dd-opt').forEach(opt => {
      opt.classList.toggle('swu-dd-opt-selected', opt.textContent.trim() === value);
    });
  }
  // Close
  const wrap = document.querySelector('.swu-dd-wrap[data-dd="' + name + '"]');
  if (wrap) wrap.classList.remove('open');
  // Update Send button enabled state
  swuUpdateSendState();
}

function swuUpdateSendState() {
  const btn = document.querySelector('.swu-send-btn');
  if (!btn) return;
  const hasTrucks = window.swuState && window.swuState.selected && window.swuState.selected.size > 0;
  const ready = hasTrucks && !!window.swuDdState.version && !!window.swuDdState.commit;
  btn.disabled = !ready;
}

/* Close dropdowns when clicking outside */
document.addEventListener('click', function(e) {
  if (e.target.closest('.swu-dd-wrap')) return;
  document.querySelectorAll('.swu-dd-wrap.open').forEach(w => w.classList.remove('open'));
});

/* ============================================================
   SOFTWARE STATUS TAB
   - Tab switching between Updates and Status sub-tabs
   - Renders firmware version table for the visible truck fleet
   - Component names corrected per Cox session (May 6) and VOC:
     TCG (not TC3), ICD, ED, WDS, DRS, CWR
   ============================================================ */
/* Auto-generate firmware version data for every truck in the fleet so
   the Software Status table covers the full list. Seeded by truck number
   so versions stay deterministic across reloads. CWR shows "—" for
   measure-only systems (Spark, Pulse) since they don't carry CWR. */
window.swuFabricateFirmware = function () {
  var FW = {};
  if (typeof trucks === 'undefined' || !Array.isArray(trucks)) return FW;
  trucks.forEach(function (t, i) {
    var s = String(t.num);
    var ver = String(t.ver || '').toLowerCase();
    var system = 'V5';
    if (ver.indexOf('spark') >= 0) system = 'Spark';
    else if (ver.indexOf('pulse') >= 0) system = 'Pulse';
    /* No V3 trucks per Brandon VOC — anything else stays V5 */

    /* Distribute dates across roughly the last month so the table looks lived-in */
    var dayOffset = i % 28;
    var month = 4 + Math.floor(dayOffset / 14); // April / May
    var day   = ((dayOffset * 3) % 28) + 1;
    var dateStr = month + '-' + day + '-2025';

    FW[s] = {
      dateUpdated: dateStr,
      system:      system,
      tcg:         '3.04.029',
      icd:         '1468',
      ed:          '8195',
      wds:         '40.0',
      cwr:         (system === 'V5' ? '1.8.4' : '—')
    };
  });
  return FW;
};
window.SWU_STATUS_FIRMWARE = window.swuFabricateFirmware();

function swuStatusTab(name) {
  const subUpd = document.getElementById('swu-subtab-updates');
  const subSta = document.getElementById('swu-subtab-status');
  const bodyUpd = document.getElementById('swu-tab-updates-body');
  const bodySta = document.getElementById('swu-tab-status-body');
  if (!subUpd || !subSta || !bodyUpd || !bodySta) return;
  if (name === 'status') {
    subUpd.classList.remove('active');
    subSta.classList.add('active');
    bodyUpd.style.display = 'none';
    bodySta.style.display = 'flex';
    swuRenderStatus();
  } else {
    subSta.classList.remove('active');
    subUpd.classList.add('active');
    bodyUpd.style.display = '';
    bodySta.style.display = 'none';
  }
}

/* ============================================================
   SOFTWARE STATUS — column model + sort + hide
   Mirrors the All Trucks pattern (dt-th-menu, dt-cols-popover,
   dtSortBy/dtSortArrow). Header label = sort. 3-dot button = Hide
   column. Columns popover = global show/hide + Reset.

   Single source of truth: SWU_STATUS_COLS (id, label, sortKey, render).
   Run-time state: window.swuStatusColState[id] = { hidden:bool }
                   window.swuStatusSortState = { col, dir: 1|-1|0 }
   ============================================================ */

/* Column definitions. `getValue(num, firmware, parentTruck)` returns
   the comparable value for sorting. `render(num, firmware, parentTruck)`
   returns the HTML for the cell. */
window.SWU_STATUS_COLS = [
  {
    id:'truck', label:'Truck',
    getValue: function(num) { return parseInt(num, 10) || 0; },
    render:   function(num) { return '<td>' + num + '</td>'; }
  },
  {
    id:'compliant', label:'SW Compliant',
    getValue: function(num, f, parent) {
      /* Sort: non-compliant first when ascending (so user sees problems on top) */
      return (parent && parent.swCompliant === false) ? 0 : 1;
    },
    render: function(num, f, parent) {
      var ok = !parent || parent.swCompliant !== false;
      var icon = ok
        ? '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3.5 3.5 5.5-6" stroke="#16a34a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="#d70100" stroke-width="1.6" stroke-linecap="round"/></svg>';
      return '<td>' + icon + '</td>';
    }
  },
  {
    id:'dateUpdated', label:'Date Updated',
    getValue: function(num, f) { return f.dateUpdated || ''; },
    render:   function(num, f) { return '<td><span class="swu-vers">' + (f.dateUpdated || '—') + '</span></td>'; }
  },
  {
    id:'system', label:'System',
    getValue: function(num, f) { return f.system || ''; },
    render:   function(num, f) { return '<td>' + (f.system || '—') + '</td>'; }
  },
  {
    id:'tcg', label:'TCG',
    getValue: function(num, f) { return f.tcg || ''; },
    render:   function(num, f) { return swuStatusVersCell(f.tcg); }
  },
  {
    id:'icd', label:'ICD',
    getValue: function(num, f) { return f.icd || ''; },
    render:   function(num, f) { return swuStatusVersCell(f.icd); }
  },
  {
    id:'ed', label:'ED',
    getValue: function(num, f) { return f.ed || ''; },
    render:   function(num, f) { return swuStatusVersCell(f.ed); }
  },
  {
    id:'wds', label:'WDS',
    getValue: function(num, f) { return f.wds || ''; },
    render:   function(num, f) { return swuStatusVersCell(f.wds); }
  },
  {
    id:'cwr', label:'CWR',
    getValue: function(num, f) { return f.cwr || ''; },
    render:   function(num, f) { return swuStatusVersCell(f.cwr); }
  }
];

/* Helper for version cells — handles em-dash placeholder */
function swuStatusVersCell(v) {
  if (v === '—' || v == null || v === '') {
    return '<td><span class="swu-na">—</span></td>';
  }
  return '<td><span class="swu-vers">' + v + '</span></td>';
}

/* Per-column visibility state. Default = all visible. */
window.swuStatusColState = window.swuStatusColState || (function() {
  var s = {};
  window.SWU_STATUS_COLS.forEach(function(c) { s[c.id] = { hidden:false }; });
  return s;
})();

/* Sort state — mirrors dtSortState shape */
window.swuStatusSortState = window.swuStatusSortState || { col:null, dir:0 };

/* Tracker for the currently-open per-column menu */
window.swuStatusOpenColMenu = null;

function swuStatusVisibleCols() {
  return window.SWU_STATUS_COLS.filter(function(c) {
    return !window.swuStatusColState[c.id].hidden;
  });
}

/* ── Sort by clicking column header label ── */
function swuStatusSortBy(colId) {
  var s = window.swuStatusSortState;
  if (s.col === colId) {
    /* Cycle: asc → desc → off */
    s.dir = s.dir === 1 ? -1 : (s.dir === -1 ? 0 : 1);
    if (s.dir === 0) s.col = null;
  } else {
    s.col = colId;
    s.dir = 1;
  }
  swuRenderStatus();
}

function swuStatusSortArrow(colId) {
  var s = window.swuStatusSortState;
  var active = s.col === colId && s.dir !== 0;
  var rot = s.dir === -1 ? 'rotate(180deg)' : 'rotate(0deg)';
  var op  = active ? '0.7' : '0.18';
  var sty = active ? 'opacity:' + op + ';transform:' + rot + ';transition:transform 0.15s;' : 'opacity:' + op + ';';
  return '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="flex-shrink:0;' + sty + '"><path d="M5 2v6M2 5l3-3 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

/* ── Per-column 3-dot menu (Hide column) ── */
function swuStatusColMenuOpen(e, colId) {
  e.stopPropagation();
  if (window.swuStatusOpenColMenu && window.swuStatusOpenColMenu !== colId) {
    var prev = document.getElementById('swu-status-th-menu-' + window.swuStatusOpenColMenu);
    if (prev) prev.classList.remove('open');
  }
  var menu = document.getElementById('swu-status-th-menu-' + colId);
  if (!menu) return;
  var isOpen = menu.classList.contains('open');
  menu.classList.toggle('open', !isOpen);
  window.swuStatusOpenColMenu = isOpen ? null : colId;
}

function swuStatusColHide(colId) {
  if (!window.swuStatusColState[colId]) return;
  window.swuStatusColState[colId].hidden = true;
  /* If the hidden col was the active sort, clear sort */
  if (window.swuStatusSortState.col === colId) {
    window.swuStatusSortState = { col:null, dir:0 };
  }
  swuRenderStatus();
  swuStatusColsListRefresh();
  /* Close the menu we just used */
  if (window.swuStatusOpenColMenu) {
    var m = document.getElementById('swu-status-th-menu-' + window.swuStatusOpenColMenu);
    if (m) m.classList.remove('open');
    window.swuStatusOpenColMenu = null;
  }
}

/* ── Columns popover (global show/hide + Reset) ── */
function swuStatusColsToggle(e) {
  if (e) e.stopPropagation();
  var pop = document.getElementById('swu-status-cols-popover');
  if (!pop) return;
  var isOpen = pop.classList.contains('open');
  pop.classList.toggle('open', !isOpen);
  if (!isOpen) swuStatusColsListRefresh();
}

function swuStatusColsListRefresh() {
  var list = document.getElementById('swu-status-cols-list');
  if (!list) return;
  list.innerHTML = window.SWU_STATUS_COLS.map(function(col) {
    var hidden = window.swuStatusColState[col.id].hidden;
    return (
      '<div class="dt-cols-pop-row">' +
        '<button class="dt-cols-toggle ' + (hidden ? '' : 'on') + '" ' +
          'onclick="swuStatusColTogglePop(\'' + col.id + '\', this)"></button>' +
        '<span class="dt-cols-pop-label ' + (hidden ? 'hidden' : '') + '">' + col.label + '</span>' +
      '</div>'
    );
  }).join('');
}

function swuStatusColTogglePop(colId, btn) {
  var st = window.swuStatusColState[colId];
  if (!st) return;
  st.hidden = !st.hidden;
  /* If newly hidden col was the active sort, clear sort */
  if (st.hidden && window.swuStatusSortState.col === colId) {
    window.swuStatusSortState = { col:null, dir:0 };
  }
  btn.classList.toggle('on', !st.hidden);
  if (btn.nextElementSibling) {
    btn.nextElementSibling.classList.toggle('hidden', st.hidden);
  }
  swuRenderStatus();
}

function swuStatusColsReset() {
  /* Show all columns + clear sort */
  Object.keys(window.swuStatusColState).forEach(function(k) {
    window.swuStatusColState[k].hidden = false;
  });
  window.swuStatusSortState = { col:null, dir:0 };
  swuStatusColsListRefresh();
  swuRenderStatus();
}

/* Click-outside closes any open per-column menu and the popover */
document.addEventListener('click', function() {
  if (window.swuStatusOpenColMenu) {
    var m = document.getElementById('swu-status-th-menu-' + window.swuStatusOpenColMenu);
    if (m) m.classList.remove('open');
    window.swuStatusOpenColMenu = null;
  }
  var pop = document.getElementById('swu-status-cols-popover');
  if (pop && pop.classList.contains('open')) pop.classList.remove('open');
});

/* ── Header build — uses .dt-th-menu styles for the dropdown so it
   visually matches All Trucks. ── */
function swuRenderStatusHeaders() {
  var thead = document.getElementById('swu-status-thead');
  if (!thead) return;
  var ths = swuStatusVisibleCols().map(function(col) {
    return (
      '<th data-col="' + col.id + '">' +
        '<div class="swu-status-th-inner">' +
          '<span class="swu-status-th-label" onclick="swuStatusSortBy(\'' + col.id + '\')">' +
            col.label + ' ' + swuStatusSortArrow(col.id) +
          '</span>' +
          '<button class="swu-status-th-menu-btn" onclick="swuStatusColMenuOpen(event, \'' + col.id + '\')" title="Column options">' +
            '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="2" r="1" fill="currentColor"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="10" r="1" fill="currentColor"/></svg>' +
          '</button>' +
          '<div class="dt-th-menu" id="swu-status-th-menu-' + col.id + '">' +
            '<div class="dt-th-menu-item" onclick="swuStatusColHide(\'' + col.id + '\')">' +
              '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M6 2C3.5 2 1.5 4 1 6c.3 1 1 2 2 2.8M10 9.2C10.7 8.3 11.3 7.2 11 6c-.5-2-2.5-4-5-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>' +
              'Hide column' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</th>'
    );
  }).join('');
  thead.innerHTML = '<tr>' + ths + '</tr>';
}

function swuRenderStatus() {
  const tbody = document.getElementById('swu-status-tbody');
  const meta  = document.getElementById('swu-status-meta');
  if (!tbody) return;

  /* Build the headers fresh — they reflect current visibility + sort state */
  swuRenderStatusHeaders();

  /* Source of which trucks to show. Renamed to truckNums to avoid
     shadowing the closure-level `trucks` const (the parent fleet data). */
  const truckNums = (window.SWU_TRUCKS || []).map(t => t.num);
  if (meta) meta.textContent = truckNums.length + ' truck' + (truckNums.length === 1 ? '' : 's');

  /* Pre-resolve parent truck lookup once per row. */
  function findParent(num) {
    return (typeof trucks !== 'undefined' && Array.isArray(trucks))
      ? trucks.find(function(t) { return String(t.num) === String(num); })
      : null;
  }

  /* Build row data: one row per truck with its firmware + parent ref */
  var rows = truckNums.map(function(num) {
    return {
      num: num,
      firmware: window.SWU_STATUS_FIRMWARE[num] || {},
      parent: findParent(num)
    };
  });

  /* Apply sort */
  var s = window.swuStatusSortState;
  if (s.col && s.dir !== 0) {
    var col = window.SWU_STATUS_COLS.find(function(c) { return c.id === s.col; });
    if (col) {
      var dir = s.dir;
      rows.sort(function(a, b) {
        var va = col.getValue(a.num, a.firmware, a.parent);
        var vb = col.getValue(b.num, b.firmware, b.parent);
        if (typeof va === 'number' && typeof vb === 'number') {
          return (va - vb) * dir;
        }
        return String(va).localeCompare(String(vb)) * dir;
      });
    }
  }

  /* Render rows from visible columns */
  var visibleCols = swuStatusVisibleCols();
  tbody.innerHTML = rows.map(function(r) {
    var cells = visibleCols.map(function(col) {
      return col.render(r.num, r.firmware, r.parent);
    }).join('');
    return '<tr>' + cells + '</tr>';
  }).join('');
}

/* Initialize Send button state on first load */
document.addEventListener('DOMContentLoaded', swuUpdateSendState);
// Also run immediately in case DOM is already loaded (when shell injects this script)
if (document.readyState !== 'loading') swuUpdateSendState();


function dtUnitsBuildHeaders() {
  const cols = visibleCols('units');
  const tab = 'units';
  const ths = cols.map((col, i) => {
    const locked = col.locked ? 'data-locked="1"' : '';
    return `
      <th class="dt-th" style="width:${col.width}px;min-width:${col.width}px;max-width:${col.width}px;"
          data-col="${col.id}" data-tab="${tab}" data-idx="${i}" ${locked}
          draggable="${col.locked ? 'false' : 'true'}"
          ondragstart="dtColDragStart(event)"
          ondragover="dtColDragOver(event)"
          ondrop="dtColDrop(event)"
          ondragend="dtColDragEnd(event)">
        <div class="dt-th-inner">
          <span class="dt-th-label">${col.label}</span>
          ${col.locked ? '' : `
          <button class="dt-th-menu-btn" onclick="dtColMenuOpen(event,'${col.id}','${tab}')" title="Column options">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="2" r="1" fill="currentColor"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="10" r="1" fill="currentColor"/></svg>
          </button>
          <div class="dt-th-menu" id="dt-th-menu-${col.id}">
            <div class="dt-th-menu-item" onclick="dtColHide('${col.id}','${tab}')">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M6 2C3.5 2 1.5 4 1 6c.3 1 1 2 2 2.8M10 9.2C10.7 8.3 11.3 7.2 11 6c-.5-2-2.5-4-5-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
              Hide column
            </div>
          </div>`}
        </div>
        ${col.locked ? '' : `<div class="dt-th-resize" data-col="${col.id}" data-tab="${tab}"
          onmousedown="dtResizeStart(event,'${col.id}','${tab}')"></div>`}
      </th>`;
  }).join('');
  const thead = document.getElementById('dt-units-thead');
  if (thead) thead.innerHTML = `<tr><th class="dt-th" style="width:40px;min-width:40px;max-width:40px;padding:0 8px;"></th>${ths}</tr>`;
}

function dtUnitsRender() {
  // Stat counts
  const linkedCount   = UNITS_DATA.filter(u => u.status === 'Linked Unit').length;
  const unlinkedCount = UNITS_DATA.filter(u => u.status === 'Unlinked Unit').length;
  const maintCount    = UNITS_DATA.filter(u => u.status === 'Maintenance').length;
  const pendingCount  = UNITS_DATA.filter(u => u.status === 'Pending Return').length;

  const setStat = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setStat('dt-units-stat-commissioned', linkedCount);
  setStat('dt-units-stat-total',        UNITS_DATA.length);
  setStat('dt-units-stat-unlinked',     unlinkedCount);
  setStat('dt-units-stat-maintreq',     maintCount);
  setStat('dt-units-stat-pending',      pendingCount);

  // Make sure headers exist & match visible cols
  dtUnitsBuildHeaders();
  dtUnitsUpdateTabs();

  // Table rows
  const q = (dtUnitsSearchQuery || '').toLowerCase();
  const filtered = UNITS_DATA.filter(u => {
    if (!q) return true;
    return u.id.toLowerCase().includes(q) ||
           u.status.toLowerCase().includes(q) ||
           u.truck.toLowerCase().includes(q) ||
           (u.tgw || '').toLowerCase().includes(q) ||
           (u.contract || '').toLowerCase().includes(q) ||
           (u.sysType || '').toLowerCase().includes(q) ||
           (u.config || '').toLowerCase().includes(q);
  });

  document.getElementById('dt-units-page-info').textContent = `1 - ${filtered.length} of ${filtered.length} Records`;
  const sub = document.getElementById('dt-units-sub');
  if (sub) sub.textContent = `All Units · ${filtered.length} unit${filtered.length === 1 ? '' : 's'}`;

  const tbody = document.getElementById('dt-units-tbody');
  if (!tbody) return;

  const cols = visibleCols('units');
  const ncols = cols.length;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${ncols}" style="padding:40px;text-align:center;color:var(--soft);font-size:14px;">No units match.</td></tr>`;
    return;
  }

  /* Cell builder — maps col.id to unit data */
  function unitsCell(col, u) {
    const c = col.id;
    if (c === 'unitid')   return `<td class="dt-td dt-td-strong">${u.id}</td>`;
    if (c === 'status') {
      let pillCls = 'unlinked';
      let pillLabel = u.status;
      if (u.status === 'Linked Unit')      { pillCls = 'linked';   pillLabel = 'Active Unit'; }
      else if (u.status === 'Maintenance') { pillCls = 'maint';    pillLabel = 'Maintenance Mode'; }
      else if (u.status === 'Pending')     { pillCls = 'pending';  pillLabel = 'Pending Configuration'; }
      return `<td class="dt-td"><span class="dt-units-status-pill ${pillCls}"><span class="dot"></span>${pillLabel}</span></td>`;
    }
    if (c === 'truck')     return `<td class="dt-td">${u.truck === '--' ? '<span style="color:var(--soft);">—</span>' : u.truck}</td>`;
    if (c === 'tgw')       return `<td class="dt-td">${u.tgw}</td>`;
    if (c === 'contract')  return `<td class="dt-td">${u.contract}</td>`;
    if (c === 'sysType')   return `<td class="dt-td">${u.sysType}</td>`;
    if (c === 'config')    return `<td class="dt-td">${u.config}</td>`;
    if (c === 'firstComm') {
      if (!u.firstCommissioned) return `<td class="dt-td"><span style="color:var(--soft);">—</span></td>`;
      const _p = u.firstCommissioned.match(/^(\d{1,2}:\d{2}\s*[AP]M)\s+(.+)$/i);
      return _p
        ? `<td class="dt-td"><span>${_p[1]}</span> <span class="dt-units-date-secondary">${_p[2]}</span></td>`
        : `<td class="dt-td"><span>${u.firstCommissioned}</span></td>`;
    }
    return `<td class="dt-td">—</td>`;
  }

  tbody.innerHTML = filtered.map((u, i) => {
    const canOpen   = u.status === 'Unlinked Unit' || u.status === 'Pending' || u.status === 'Linked Unit';
    const cursor    = canOpen && !dtUnitsSelectMode ? 'pointer' : 'default';
    const safeUnitId = u.id.split("'").join("\\'");
    const onclick   = canOpen && !dtUnitsSelectMode ? `onclick="dtUdOpen('${safeUnitId}')"` : '';
    const isSelected = dtUnitsSelected.has(u.id);
    const eligible = u.status === 'Unlinked Unit';
    const checked  = isSelected ? 'checked' : '';
    const disabled = !eligible ? 'disabled' : '';
    const safeId   = u.id.split("'").join("\'");
    const cbVis    = dtUnitsSelectMode ? '' : 'visibility:hidden;pointer-events:none;';
    const cbCell   = `<td class="dt-td dt-units-cb-cell" style="width:40px;min-width:40px;padding:0 8px;">
      <input type="checkbox" class="dt-units-cb" ${checked} ${disabled} style="${cbVis}"
             onclick="event.stopPropagation(); dtUnitsToggleRow('${safeId}', this)" />
    </td>`;
    return `
    <tr class="dt-tr${i % 2 === 1 ? ' alt' : ''}${isSelected ? ' dt-selected' : ''}"
        data-unit="${u.id}" style="cursor:${cursor};" ${onclick}>
      ${cbCell}
      ${cols.map(col => unitsCell(col, u)).join('')}
    </tr>`;
  }).join('');
}

/* ════════════════════════════════════════════════════════════
   RETURN TO VERIFI — bulk select + remove workflow
   Entry: "Select" button in units toolbar
   Eligible: Unlinked Unit status only (Linked/Pending are locked)
   Flow: Select mode → multi-select → bulk bar → confirm modal → remove
═══════════════════════════════════════════════════════════ */

let dtUnitsSelectMode = false;

function dtUnitsSelectToggle() {
  dtUnitsSelectMode = !dtUnitsSelectMode;
  dtUnitsSelected.clear();

  const selectBtn  = document.getElementById('dt-units-select-btn');
  const bulkBar    = document.getElementById('dt-units-bulk-bar');

  if (dtUnitsSelectMode) {
    if (selectBtn) {
      selectBtn.style.background    = 'rgba(48,105,227,0.1)';
      selectBtn.style.borderColor   = 'rgba(48,105,227,0.4)';
      selectBtn.style.color         = 'var(--blue)';
    }
    if (bulkBar) { bulkBar.style.display='flex'; bulkBar.classList.add('visible'); }
  } else {
    if (selectBtn) {
      selectBtn.style.background  = '';
      selectBtn.style.borderColor = '';
      selectBtn.style.color       = '';
    }
    if (bulkBar) { bulkBar.style.display='none'; bulkBar.classList.remove('visible'); }
  }

  dtUnitsRender();
  dtUnitsUpdateBulkBar();
}

function dtUnitsUpdateBulkBar() {
  const count   = dtUnitsSelected.size;
  const countEl = document.getElementById('dt-units-bulk-count');
  const returnBtn = document.getElementById('dt-units-bulk-return-btn');
  if (countEl)   countEl.textContent = count === 0 ? '0 selected' : `${count} unit${count === 1 ? '' : 's'} selected`;
  if (returnBtn) returnBtn.disabled  = count === 0;
}

function dtUnitsToggleRow(unitId, checkbox) {
  if (checkbox.checked) {
    dtUnitsSelected.add(unitId);
  } else {
    dtUnitsSelected.delete(unitId);
  }
  // Highlight the row
  const row = document.querySelector(`#dt-units-tbody tr[data-unit="${unitId}"]`);
  if (row) row.classList.toggle('dt-selected', checkbox.checked);
  dtUnitsUpdateBulkBar();
}

function dtUnitsSelectAll() {
  // Select every Unlinked Unit that is currently visible in the table
  document.querySelectorAll('#dt-units-tbody .dt-units-cb:not(:disabled)').forEach(cb => {
    const row = cb.closest('tr');
    const unitId = row ? row.dataset.unit : null;
    if (unitId) {
      cb.checked = true;
      dtUnitsSelected.add(unitId);
      row.classList.add('dt-selected');
    }
  });
  dtUnitsUpdateBulkBar();
}

function dtUnitsReturnConfirm() {
  if (dtUnitsSelected.size === 0) return;
  const ids = [...dtUnitsSelected];
  const unitRows = ids.map(id => `<div class="dt-return-modal-unit-row">${id}</div>`).join('');

  const overlay = document.createElement('div');
  overlay.className = 'dt-return-overlay';
  overlay.id = 'dt-return-overlay';
  overlay.innerHTML = `
    <div class="dt-return-modal">
      <div class="dt-return-modal-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M8.5 4H5a2 2 0 00-2 2v9a2 2 0 002 2h10a2 2 0 002-2v-4" stroke="#d70100" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M13 2l5 4-5 4M18 6H9" stroke="#d70100" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="dt-return-modal-title">Return ${ids.length} unit${ids.length === 1 ? '' : 's'} to Verifi?</div>
      <div class="dt-return-modal-body">
        These units will be removed from your system and returned to Verifi inventory.
        Only unlinked units can be returned — any unit currently attached to a truck
        must be unlinked first.
      </div>
      <div class="dt-return-modal-units">${unitRows}</div>
      <div class="dt-return-modal-btns">
        <button class="dt-return-modal-cancel" onclick="dtUnitsReturnCancel()">Cancel</button>
        <button class="dt-return-modal-confirm" onclick="dtUnitsReturnDo()">Return to Verifi</button>
      </div>
    </div>`;

  // Mount inside dt-content so it covers the units page
  const content = document.querySelector('.dt-content') || document.getElementById('s-desktop');
  if (content) {
    content.style.position = 'relative';
    content.appendChild(overlay);
  }
}

function dtUnitsReturnCancel() {
  document.getElementById('dt-return-overlay')?.remove();
}

function dtUnitsReturnDo() {
  const ids = [...dtUnitsSelected];
  const now = new Date();
  const dateStr = (now.getMonth()+1) + '/' + now.getDate() + '/' + now.getFullYear();

  // Switch to Pending Return — stays visible until Verifi marks received
  ids.forEach(id => {
    const u = UNITS_DATA.find(u => u.id === id);
    if (u) { u.status = 'Pending Return'; u.returnDate = dateStr; }
  });

  // Clean up UI
  dtUnitsReturnCancel();
  dtUnitsSelectMode = false;
  dtUnitsSelected.clear();

  const selectBtn = document.getElementById('dt-units-select-btn');
  if (selectBtn) { selectBtn.style.background = ''; selectBtn.style.borderColor = ''; selectBtn.style.color = ''; }
  const bulkBar = document.getElementById('dt-units-bulk-bar');
  if (bulkBar) { bulkBar.style.display = 'none'; bulkBar.classList.remove('visible'); }

  // Re-render table, pending tab, and update tab strip
  dtUnitsRender();
  dtUnitsPendingRender();
  dtUnitsUpdateTabs();

  // Toast
  dtShowToast({
    title: `${ids.length} unit${ids.length === 1 ? '' : 's'} flagged for return`,
    body: `Pending Return · Verifi will confirm receipt`,
    variant: 'warning'
  });
}


const DT_UNITS_SRCH_ICON = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="3" width="11" height="9" rx="1.5" stroke="#36322d9e" stroke-width="1.2"/><path d="M5.5 6h5M5.5 9h3" stroke="#36322d9e" stroke-width="1.2" stroke-linecap="round"/></svg>`;
let dtUnitsSrchActiveIdx = -1;
let dtUnitsSrchShown = [];

function dtUnitsSearchOnInput() {
  const input    = document.getElementById('dt-units-search-input');
  const q        = input.value.trim();
  dtUnitsSearchQuery = q;

  const field    = document.getElementById('dt-units-srch-field');
  const clearBtn = document.getElementById('dt-units-srch-clear');
  const drop     = document.getElementById('dt-units-srch-drop');
  const results  = document.getElementById('dt-units-srch-results');

  if (field)    field.classList.toggle('active', q.length > 0);
  if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

  // Always re-render the table to reflect inline filter
  dtUnitsRender();

  if (!q) {
    if (drop) drop.style.display = 'none';
    return;
  }

  const ql = q.toLowerCase();
  const matches = UNITS_DATA.filter(u =>
    u.id.toLowerCase().includes(ql) ||
    u.status.toLowerCase().includes(ql) ||
    (u.truck && String(u.truck).toLowerCase().includes(ql)) ||
    (u.sysType || '').toLowerCase().includes(ql)
  );

  const MAX = 5;
  const shown = matches.slice(0, MAX);
  const extra = matches.length - MAX;
  dtUnitsSrchShown = shown;
  dtUnitsSrchActiveIdx = -1;

  if (matches.length === 0) {
    results.innerHTML = `<div class="dt-srch-no-hits">No units found</div>`;
  } else {
    let html = `<div class="dt-srch-section-hdr">${DT_UNITS_SRCH_ICON}<span class="dt-srch-section-label">Units</span></div>`;
    shown.forEach((u, i) => {
      const primary   = dtSrchHighlight(u.id, q);
      const secondary = `${u.status} · ${u.sysType}${u.truck && u.truck !== '--' ? ' · Truck ' + u.truck : ''}`;
      html += `
        <div class="dt-srch-row" data-idx="${i}" onclick="dtUnitsSrchSelect('${u.id}')">
          <span class="dt-srch-match-text">${primary}</span>
          <span class="dt-srch-meta">${secondary}</span>
        </div>`;
    });
    if (extra > 0) {
      html += `<div class="dt-srch-show-more" onclick="dtUnitsSrchShowAll()">+${extra} more unit${extra > 1 ? 's' : ''}</div>`;
    }
    results.innerHTML = html;
  }

  drop.style.display = 'block';
}

function dtUnitsSearchOnFocus() {
  if (dtUnitsSearchQuery) dtUnitsSearchOnInput();
}

function dtUnitsSearchClear() {
  const input = document.getElementById('dt-units-search-input');
  if (input) input.value = '';
  dtUnitsSearchQuery = '';
  document.getElementById('dt-units-srch-field').classList.remove('active');
  document.getElementById('dt-units-srch-clear').style.display = 'none';
  document.getElementById('dt-units-srch-drop').style.display = 'none';
  dtUnitsRender();
  if (input) input.focus();
}

function dtUnitsSrchSelect(unitId) {
  // Fill the input with the picked unit and dismiss the dropdown.
  // Then scroll the matching row into view and flash-highlight it,
  // mirroring the desktop trucks search behavior.
  const input = document.getElementById('dt-units-search-input');
  if (input) input.value = unitId;
  dtUnitsSearchQuery = unitId;
  document.getElementById('dt-units-srch-drop').style.display = 'none';
  dtUnitsRender();
  requestAnimationFrame(() => {
    const tr = document.querySelector(`#dt-units-tbody tr[data-unit="${unitId}"]`);
    if (tr) {
      tr.scrollIntoView({ block:'center', behavior:'smooth' });
      tr.classList.remove('dt-srch-flash');
      void tr.offsetWidth;
      tr.classList.add('dt-srch-flash');
    }
  });
}

function dtUnitsSrchShowAll() {
  // Re-render dropdown without the MAX cap
  const q = dtUnitsSearchQuery;
  if (!q) return;
  const ql = q.toLowerCase();
  const matches = UNITS_DATA.filter(u =>
    u.id.toLowerCase().includes(ql) ||
    u.status.toLowerCase().includes(ql) ||
    (u.truck && String(u.truck).toLowerCase().includes(ql)) ||
    (u.sysType || '').toLowerCase().includes(ql)
  );
  let html = `<div class="dt-srch-section-hdr">${DT_UNITS_SRCH_ICON}<span class="dt-srch-section-label">Units</span></div>`;
  matches.forEach((u, i) => {
    const primary   = dtSrchHighlight(u.id, q);
    const secondary = `${u.status} · ${u.sysType}${u.truck && u.truck !== '--' ? ' · Truck ' + u.truck : ''}`;
    html += `
      <div class="dt-srch-row" data-idx="${i}" onclick="dtUnitsSrchSelect('${u.id}')">
        <span class="dt-srch-match-text">${primary}</span>
        <span class="dt-srch-meta">${secondary}</span>
      </div>`;
  });
  document.getElementById('dt-units-srch-results').innerHTML = html;
  dtUnitsSrchShown = matches;
  dtUnitsSrchActiveIdx = -1;
}

function dtUnitsSearchKey(e) {
  const drop = document.getElementById('dt-units-srch-drop');
  const open = drop && drop.style.display === 'block';
  if (e.key === 'Escape') {
    if (open) drop.style.display = 'none';
    else dtUnitsSearchClear();
    return;
  }
  if (!open || dtUnitsSrchShown.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    dtUnitsSrchActiveIdx = (dtUnitsSrchActiveIdx + 1) % dtUnitsSrchShown.length;
    dtUnitsSrchUpdateActive();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    dtUnitsSrchActiveIdx = (dtUnitsSrchActiveIdx - 1 + dtUnitsSrchShown.length) % dtUnitsSrchShown.length;
    dtUnitsSrchUpdateActive();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const i = dtUnitsSrchActiveIdx >= 0 ? dtUnitsSrchActiveIdx : 0;
    if (dtUnitsSrchShown[i]) dtUnitsSrchSelect(dtUnitsSrchShown[i].id);
  }
}

function dtUnitsSrchUpdateActive() {
  document.querySelectorAll('#dt-units-srch-results .dt-srch-row').forEach(r => r.classList.remove('active'));
  if (dtUnitsSrchActiveIdx < 0) return;
  const row = document.querySelector(`#dt-units-srch-results .dt-srch-row[data-idx="${dtUnitsSrchActiveIdx}"]`);
  if (row) {
    row.classList.add('active');
    row.scrollIntoView({ block:'nearest' });
  }
}

// Click-outside dismisses the units search dropdown
document.addEventListener('click', (e) => {
  const drop = document.getElementById('dt-units-srch-drop');
  const wrap = document.getElementById('dt-units-srch-wrap');
  if (drop && wrap && drop.style.display === 'block' && !wrap.contains(e.target)) {
    drop.style.display = 'none';
  }
});

function dtUnitsAddPlaceholder() {
  dtAuOpen();
}

/* ── Add Unit modal — desktop ──
   Same data model + validation rules as the mobile flow, but laid out as
   a centered 560px modal with two-column form rows, inline errors, and
   a top-right toast on success. */
const DT_AU_CONTRACTS_BY_ACCOUNT = (typeof AU_CONTRACTS !== 'undefined') ? AU_CONTRACTS : {
  'Cemex AZ': ['SRM Tennessee', 'SRM Texas', 'SRM Arizona']
};
const dtAuValues = { account: 'Cemex AZ', contract: '', sysType: '', config: '' };

function dtAuOpen() {
  if (document.body.classList.contains('view-tablet')) { tbAuOpen(); return; }
  // Reset values — contract defaults to Cemex AZ
  dtAuValues.contract = 'Cemex AZ';
  dtAuValues.sysType  = '';
  dtAuValues.config   = '';

  // Populate Contract dropdown for the active account
  const contracts = DT_AU_CONTRACTS_BY_ACCOUNT[dtAuValues.account] || [];
  const contractMenu = document.getElementById('dt-au-contract-menu');
  contractMenu.innerHTML = contracts.map(function(c) {
    const sel = c === 'Cemex AZ' ? ' selected' : '';
    const safe = c.split("'").join("\\'");
    return '<div class="dt-au-dd-item' + sel + '" onclick="dtAuSelectDd(\'contract\',\'' + safe + '\')">' + c + '</div>';
  }).join('');

  // Set contract display to default
  const contractVal = document.getElementById('dt-au-contract-val');
  if (contractVal) { contractVal.textContent = 'Cemex AZ'; contractVal.className = ''; }

  // Reset sysType and config dropdown displays
  ['sysType','config'].forEach(key => {
    const valEl  = document.getElementById('dt-au-' + key + '-val');
    const menuEl = document.getElementById('dt-au-' + key + '-menu');
    const chevEl = document.getElementById('dt-au-' + key + '-chev');
    const btnEl  = document.getElementById('dt-au-' + key + '-btn');
    if (valEl) { valEl.textContent = key === 'sysType' ? 'Select type' : 'Select config'; valEl.className = 'placeholder'; }
    if (menuEl) { menuEl.classList.remove('open'); menuEl.querySelectorAll('.dt-au-dd-item').forEach(el => el.classList.remove('selected')); }
    if (chevEl) chevEl.classList.remove('open');
    if (btnEl)  btnEl.classList.remove('open');
  });

  // Reset text inputs and errors
  ['dt-au-unit-id','dt-au-tgw'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = '';
      el.classList.remove('error');
      el.placeholder = id === 'dt-au-unit-id' ? 'Enter unit ID' : 'e.g. 210000095269';
    }
  });
  document.getElementById('dt-au-unit-id-err').classList.remove('show');

  dtAuValidate();

  // Slide drawer in + show the same scrim that the truck drawer uses
  document.getElementById('dt-drawer-scrim').classList.add('open');
  const drawer = document.getElementById('dt-au-drawer');
  requestAnimationFrame(() => drawer.classList.add('open'));

  // Focus the Unit ID field after the open animation
  setTimeout(() => {
    const idInput = document.getElementById('dt-au-unit-id');
    if (idInput) idInput.focus();
  }, 200);
}

function dtAuClose() {
  if (document.body.classList.contains('view-tablet')) {
    tbAuClose();
    if (typeof tbUnitsRender === 'function') tbUnitsRender();
    return;
  }
  const drawer = document.getElementById('dt-au-drawer');
  drawer.classList.remove('open');
  document.getElementById('dt-drawer-scrim').classList.remove('open');
  // Close any open dropdown
  ['contract','sysType','config'].forEach(key => {
    document.getElementById('dt-au-' + key + '-menu')?.classList.remove('open');
    document.getElementById('dt-au-' + key + '-chev')?.classList.remove('open');
    document.getElementById('dt-au-' + key + '-btn')?.classList.remove('open');
  });
}

// Prefix helper: tablet overlay and desktop drawer both exist in the DOM at all
// times, with conflicting IDs (`dt-au-*` on desktop, `tb-au-*` on tablet).
// `getElementById` returns the first match in DOM order, so without this helper
// every desktop call would silently operate on the hidden tablet form.
function dtAuPrefix() {
  return document.body.classList.contains('view-tablet') ? 'tb-au-' : 'dt-au-';
}

/* Compatibility shim. Earlier code used dtAuQ('dt-au-X') as a
   scoped lookup; a number of call sites still reference it. Route
   those through dtAuPrefix so they pick up the right form (tablet
   vs desktop) at runtime. The drawer container ID itself is unique
   and falls through to a direct lookup. */
function dtAuQ(id) {
  if (id === 'dt-au-drawer') return document.getElementById('dt-au-drawer');
  if (id && id.indexOf('dt-au-') === 0) {
    const realId = dtAuPrefix() + id.slice('dt-au-'.length);
    return document.getElementById(realId);
  }
  return document.getElementById(id);
}

function dtAuToggleDd(key) {
  const p    = dtAuPrefix();
  const btn  = document.getElementById(p + key + '-btn');
  const menu = document.getElementById(p + key + '-menu');
  const chev = document.getElementById(p + key + '-chev');
  if (!menu || btn.disabled) return;
  const open = menu.classList.contains('open');
  // Close all other dropdowns first
  ['contract','sysType','config'].forEach(k => {
    document.getElementById(p + k + '-menu')?.classList.remove('open');
    document.getElementById(p + k + '-chev')?.classList.remove('open');
    document.getElementById(p + k + '-btn')?.classList.remove('open');
  });
  if (!open) {
    menu.classList.add('open');
    chev.classList.add('open');
    btn.classList.add('open');
  }
}

function dtAuSelectDd(key, value) {
  dtAuValues[key] = value;
  const p      = dtAuPrefix();
  const valEl  = document.getElementById(p + key + '-val');
  const menuEl = document.getElementById(p + key + '-menu');
  const chevEl = document.getElementById(p + key + '-chev');
  const btnEl  = document.getElementById(p + key + '-btn');
  if (valEl) {
    valEl.textContent = value;
    valEl.className = '';  // remove placeholder class so it gets strong color
  }
  if (menuEl) {
    menuEl.querySelectorAll('.dt-au-dd-item').forEach(el => {
      el.classList.toggle('selected', el.textContent.trim() === value);
    });
    menuEl.classList.remove('open');
  }
  if (chevEl) chevEl.classList.remove('open');
  if (btnEl)  btnEl.classList.remove('open');
  dtAuValidate();
}

function dtAuValidate() {
  const p      = dtAuPrefix();
  const unitId = (document.getElementById(p + 'unit-id').value || '').trim();
  const valid  = unitId && dtAuValues.contract && dtAuValues.sysType && dtAuValues.config;
  const submit = document.getElementById(p + 'submit');
  const hint   = document.getElementById(p + 'foot-hint');
  if (submit) submit.disabled = !valid;
  if (hint) {
    if (valid) {
      hint.textContent = 'Ready to add';
      hint.classList.add('valid');
    } else {
      // Tell the user exactly what's missing
      const missing = [];
      if (!unitId)               missing.push('Unit ID');
      if (!dtAuValues.contract)  missing.push('Contract');
      if (!dtAuValues.sysType)   missing.push('System Type');
      if (!dtAuValues.config)    missing.push('Configuration');
      hint.textContent = missing.length === 4
        ? 'Fill required fields to add'
        : `Still need: ${missing.join(', ')}`;
      hint.classList.remove('valid');
    }
  }
  // Clear duplicate error if user has changed the value
  const idInput = document.getElementById(p + 'unit-id');
  const idErr   = document.getElementById(p + 'unit-id-err');
  if (idInput && idInput.classList.contains('error') && idInput.value !== '') {
    idInput.classList.remove('error');
    if (idErr) idErr.classList.remove('show');
  }
}

function dtAuSubmit() {
  const p       = dtAuPrefix();
  const unitId  = (document.getElementById(p + 'unit-id').value || '').trim();
  const tgw     = (document.getElementById(p + 'tgw').value || '').trim();
  const account = dtAuValues.account;
  const { contract, sysType, config } = dtAuValues;
  if (!unitId || !contract || !sysType || !config) return;

  // Duplicate check
  if (UNITS_DATA.find(u => u.id === unitId)) {
    const idInput = document.getElementById(p + 'unit-id');
    const idErr   = document.getElementById(p + 'unit-id-err');
    idInput.classList.add('error');
    idErr.textContent = `Unit ${unitId} already exists. Pick a different ID.`;
    idErr.classList.add('show');
    idInput.focus();
    idInput.select();
    return;
  }

  UNITS_DATA.push({
    id: unitId,
    status: 'Unlinked Unit',
    truck: '--',
    tgw: tgw || '—',
    contract: contract,
    sysType: sysType,
    config: config,
    firstCommissioned: null, /* set when first linked to a truck */
    assignedToTruck: null,
    decommissioned: null,
  });

  // Close modal first, then re-render and toast
  dtAuClose();
  dtUnitsRender();
  // Trucks header has an Unlinked Units stat — keep it in sync
  const unlinkedEl = document.getElementById('dt-stat-unlinked');
  if (unlinkedEl) unlinkedEl.textContent = UNITS_DATA.filter(u => u.status === 'Unlinked Unit').length;

  // Top-right Trinity Success toast
  dtShowToast({
    title: 'Unit added',
    body: `Unit ${unitId} was created in Unlinked status. Open it to attach to a truck.`,
  });
}

/* ════════════════════════════════════════════════════════════
   TABLET — Where to Start
   Adapts the desktop WTS table and truck drawer for 834px.
   No sidebar — navigation lives in the top nav bar.
   Columns are a curated subset; drawer is full-width.
═══════════════════════════════════════════════════════════ */

let tbActiveTab   = 'wts';
let tbDrawerTruck = null;
let tbExpandedRows = new Set();

const TB_COLS = {
  wts: [
    { id:'truck',    label:'Truck',         width:70  },
    { id:'source',   label:'Source',        width:80  },
    { id:'alerts',   label:'Active alerts', width:100 },
    { id:'age',      label:'Created',       width:70  },
    { id:'ignition', label:'Ignition',      width:85  },
    { id:'maint',    label:'Maint.',        width:70  },
    { id:'plant',    label:'Plant',         width:100 },
  ],
  overview: [
    { id:'truck',    label:'Truck',          width:110 },
    { id:'alerts',   label:'Active alerts',  width:100 },
    { id:'version',  label:'TCG Version',     width:110 },
    { id:'ignition', label:'Ignition',       width:85  },
    { id:'plant',    label:'Plant',          width:100 },
    { id:'conn',     label:'Connection',     width:95  },
    { id:'lastconn', label:'Last Connection',width:130 },
  ],
  cc: [
    { id:'truck',    label:'Truck',         width:110 },
    { id:'plant',    label:'Plant',         width:100 },
    { id:'alerts',   label:'Active alerts', width:100 },
    { id:'clean',    label:'Clean',         width:70  },
    { id:'warn',     label:'Warning',       width:70  },
    { id:'alarm',    label:'Alarm',         width:70  },
  ],
};

function tbSelectTab(tab, el) {
  tbActiveTab = tab;
  tbExpandedRows.clear();
  document.querySelectorAll('.tb-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  var pop = document.getElementById('tb-cols-popover');
  if (pop) pop.classList.remove('open');
  tbRenderTable();
}

function tbToggleExpand(key) {
  if (tbExpandedRows.has(key)) tbExpandedRows.delete(key);
  else tbExpandedRows.add(key);
  tbRenderTable();
}

function tbRenderTable() {
  var allCols = tbGetColState(tbActiveTab);
  var cols  = allCols.filter(function(c) { return !c.hidden; });
  var ncols = cols.length;
  var q     = (document.getElementById('tb-search-input') || {}).value || '';
  var ql    = q.toLowerCase();

  var thead = document.getElementById('tb-thead');
  if (thead) {
    thead.innerHTML = '<tr>' + cols.map(function(c) {
      var sep = ['alerts','version','maint','plant','ignition','unitid','sysver','conn'].indexOf(c.id) >= 0 ? '<span class="tb-th-sep"></span>' : '';
      return '<th class="tb-th" style="width:' + c.width + 'px;min-width:' + c.width + 'px;">' + c.label + sep + '</th>';
    }).join('') + '</tr>';
  }

  function tbBadges(t) {
    var b = '';
    const _tb=getTruckAlerts(t.num);
    if (_tb.err > 0) b += '<span class="dt-badge err"><svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M1.375 0H8.25C9.002 0 9.625.623 9.625 1.375V8.25C9.625 9.023 9.002 9.625 8.25 9.625H1.375C.602 9.625 0 9.023 0 8.25V1.375C0 .623.602 0 1.375 0ZM4.813 2.063c-.3 0-.516.235-.516.515V4.984c0 .301.216.516.516.516.279 0 .515-.215.515-.516V2.578c0-.28-.236-.515-.515-.515ZM4.125 6.875c0 .387.3.688.688.688.365 0 .687-.301.687-.688 0-.365-.322-.688-.687-.688-.388 0-.688.323-.688.688Z" fill="white"/></svg>' + _tb.err + '</span>';
    if (_tb.wrn > 0) b += '<span class="dt-badge wrn"><svg width="11" height="10" viewBox="0 0 12 10" fill="none"><path d="M5.543 0c.3 0 .58.172.73.43l4.641 7.906c.15.279.15.602 0 .86-.15.279-.43.429-.73.429H.902c-.322 0-.601-.15-.751-.43-.15-.257-.15-.58 0-.859L4.793.43C4.942.172 5.221 0 5.543 0ZM5.543 2.75c-.3 0-.516.236-.516.516v2.406c0 .301.216.516.516.516.279 0 .515-.215.515-.516V3.266c0-.28-.236-.516-.515-.516ZM6.23 7.563c0-.366-.322-.688-.687-.688-.387 0-.688.322-.688.688 0 .386.301.687.688.687.365 0 .687-.301.687-.687Z" fill="#36322d"/></svg>' + _tb.wrn + '</span>';
    return b;
  }

  function tbChev(open) {
    return '<svg class="tb-td-chev' + (open ? ' open' : '') + '" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="#36322d9e" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function tbViewBtn(key) {
    return '<div class="tb-expand-view-row"><button class="tb-view-btn-lg" onclick="event.stopPropagation();tbOpenTruck(&#39;' + key + '&#39;)">View Truck</button></div>';
  }

  function tbGroupHdr(group, gi, count, isOpen) {
    var h = '<tr class="tb-group-row" onclick="tbToggleGroup(' + gi + ')"><td colspan="' + ncols + '"><div class="tb-group-cell">';
    h += '<svg width="10" height="6" viewBox="0 0 10 6" fill="none" style="transform:rotate(' + (isOpen ? '0' : '180') + 'deg);flex-shrink:0;transition:transform 0.2s;"><path d="M8.75 4.75L4.75 0.75L0.75 4.75" stroke="#36322D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    h += '<div class="tb-group-badge">' + count + '</div>';
    h += '<span>' + group.account + ' · ' + group.label + ' — Uptime ' + group.uptime + '</span>';
    h += '</div></td></tr>';
    return h;
  }

  function tbTruckRow(t, cols, alt, key, isEx) {
    var r = '<tr class="tb-tr' + (alt ? ' alt' : '') + (isEx ? ' expanded' : '') + '" onclick="tbToggleExpand(&#39;' + key + '&#39;)">';
    cols.forEach(function(col) {
      var c = col.id;
      if (c === 'truck')     r += '<td class="tb-td" onclick="event.stopPropagation();tbToggleExpand(&#39;' + key + '&#39;)"><div class="tb-td-truck">' + tbChev(isEx) + '<span style="color:var(--defined)">' + t.num + '</span></div></td>';
      else if (c === 'alerts')   r += '<td class="tb-td"><div class="dt-badge-wrap">' + (tbBadges(t) || '<span style="color:var(--soft)">—</span>') + '</div></td>';
      else if (c === 'version')  r += '<td class="tb-td">' + dtVerPill(t.ver) + '</td>';
      else if (c === 'ignition') r += '<td class="tb-td">' + t.ign + ' · ' + (t.ignDetail || '—') + '</td>';
      else if (c === 'maint')    r += '<td class="tb-td">' + (t.readyMaint || '—') + '</td>';
      else if (c === 'plant')    r += '<td class="tb-td tb-td-trunc" title="' + (t.plant||'') + '">' + (t.plant || '—') + '</td>';
      else if (c === 'source')   r += '<td class="tb-td">' + (t.source === 'Customer Ticket' ? 'Customer' : (t.source ? 'System' : '—')) + '</td>';
      else if (c === 'swcomp')   { var ok = t.swCompliant !== false; r += '<td class="tb-td">' + (ok ? '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3.5 3.5 5.5-6" stroke="#16a34a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="#d70100" stroke-width="1.6" stroke-linecap="round"/></svg>') + '</td>'; }
      else if (c === 'age')      r += '<td class="tb-td" style="color:var(--soft)">' + (t.age || '—') + '</td>';
      else if (c === 'conn')     r += '<td class="tb-td"><div style="display:flex;align-items:center;gap:5px;">' + (t.conn === 'live' ? '<span class="dt-conn-dot live"></span>Live' : '<span class="dt-conn-dot none"></span><span style="color:var(--soft)">No conn.</span>') + '</div></td>';
      else if (c === 'lastconn') r += '<td class="tb-td" style="color:var(--soft)">' + (t.lastConn || '—') + '</td>';
      else if (c === 'clean' || c === 'warn' || c === 'alarm') {
        var comps = t.components || [];
        var count = comps.filter(function(cp) { return cp.state === c; }).length;
        var dot   = c === 'alarm' ? '#d70100' : c === 'warn' ? '#ffba0d' : '#16a34a';
        var label = count > 0
          ? '<div style="display:inline-flex;align-items:center;gap:5px;"><div style="width:8px;height:8px;border-radius:50%;background:' + dot + ';flex-shrink:0;"></div><span style="font-weight:500;">' + count + '</span></div>'
          : '<span style="color:var(--soft)">—</span>';
        r += '<td class="tb-td">' + label + '</td>';
      }
      else r += '<td class="tb-td">—</td>';
    });
    r += '</tr>';
    return r;
  }

  var rows = '', rowIdx = 0, total = 0;

  if (tbActiveTab === 'wts') {
    truckGroups.forEach(function(group, gi) {
      var pts = group.trucks.filter(function(t) {
        if (t.unlinked || !(getTruckAlerts(t.num).err || getTruckAlerts(t.num).wrn)) return false;
        if (!ql) return true;
        return t.num.includes(ql) || (t.plant||'').toLowerCase().includes(ql) || (t.ver||'').toLowerCase().includes(ql);
      });
      if (!pts.length) return;
      total += pts.length;
      var isOpen = group.open !== false;
      rows += tbGroupHdr(group, gi, pts.length, isOpen);
      if (!isOpen) return;
      pts.forEach(function(t) {
        var alt = rowIdx++ % 2 === 1;
        var key = String(t.num).replace(/[^a-zA-Z0-9_-]/g, '');
        var isEx = tbExpandedRows.has(t.num);
        rows += tbTruckRow(t, cols, alt, key, isEx);
        if (isEx) {
          var wtsL = '<div class="tb-exp-item"><span class="tb-exp-item-label">Account</span><span class="tb-exp-item-val">' + t.account + '</span></div>'
            + '<div class="tb-exp-item"><span class="tb-exp-item-label">Source</span><span class="tb-exp-item-val">' + t.source + '</span></div>'
            + '<div class="tb-exp-item"><span class="tb-exp-item-label">TCG Version</span><span class="tb-exp-item-val">' + t.ver + '</span></div>'
            + '<div class="tb-exp-item"><span class="tb-exp-item-label">SW Compliant</span><span class="tb-exp-item-val">' + (t.swCompliant !== false ? '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3.5 3.5 5.5-6" stroke="#16a34a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="#d70100" stroke-width="1.6" stroke-linecap="round"/></svg>') + '</span></div>'
            + '<div class="tb-exp-item"><span class="tb-exp-item-label">Plant</span><span class="tb-exp-item-val">' + t.plant + '</span></div>'
            + '<div class="tb-exp-item"><span class="tb-exp-item-label">Ignition</span><span class="tb-exp-item-val">' + t.ign + ' — ' + t.ignDetail + '</span></div>';
          var wtsR = '<div class="tb-exp-item"><span class="tb-exp-item-label">Impact</span><span class="tb-exp-item-val">' + (t.impact||'—') + '</span></div>'
            + '<div class="tb-exp-item"><span class="tb-exp-item-label">Created</span><span class="tb-exp-item-val">' + t.age + '</span></div>'
            + '<div class="tb-exp-item"><span class="tb-exp-item-label">Connection</span><span class="tb-exp-item-val">' + (t.conn === 'live' ? 'Live' : 'No connection') + '</span></div>'
            + '<div class="tb-exp-item"><span class="tb-exp-item-label">Last Seen</span><span class="tb-exp-item-val">' + t.lastConn + '</span></div>';
          var exp = '<div class="tb-expand-panel"><div class="tb-exp-grid"><div class="tb-exp-col">' + wtsL + '</div><div class="tb-exp-col">' + wtsR + '</div></div>' + tbViewBtn(key) + '</div>';
          rows += '<tr class="tb-expand-row"><td colspan="' + ncols + '">' + exp + '</td></tr>';
        }
      });
    });
    if (!rows) rows = '<tr><td colspan="' + ncols + '" style="padding:48px;text-align:center;color:var(--soft);font-size:14px;">No trucks with active alerts.</td></tr>';

  } else if (tbActiveTab === 'overview') {
    // No grouping on Overview — flat list of all trucks, same as mobile
    var ovTrucks = trucks.filter(function(t) {
      if (t.unlinked) return false;
      if (!ql) return true;
      return t.num.includes(ql) || (t.plant||'').toLowerCase().includes(ql) || (t.ver||'').toLowerCase().includes(ql);
    });
    total = ovTrucks.length;
    ovTrucks.forEach(function(t) {
      var alt = rowIdx++ % 2 === 1;
      var key = String(t.num).replace(/[^a-zA-Z0-9_-]/g, '');
      var isEx = tbExpandedRows.has(t.num);
      rows += tbTruckRow(t, cols, alt, key, isEx);
      if (isEx) {
        var ovL = '<div class="tb-exp-item"><span class="tb-exp-item-label">Truck</span><span class="tb-exp-item-val">' + t.num + '</span></div>'
          + '<div class="tb-exp-item"><span class="tb-exp-item-label">Active Alerts</span><span class="tb-exp-item-val">' + (getTruckAlerts(t.num).err||'0') + '</span></div>'
          + '<div class="tb-exp-item"><span class="tb-exp-item-label">Unit ID</span><span class="tb-exp-item-val">' + (t.unitId||'—') + '</span></div>'
          + '<div class="tb-exp-item"><span class="tb-exp-item-label">TCG Version</span><span class="tb-exp-item-val">' + t.ver + '</span></div>'
          + '<div class="tb-exp-item"><span class="tb-exp-item-label">Ignition Status</span><span class="tb-exp-item-val">' + t.ign + ' — ' + t.ignDetail + '</span></div>';
        var ovR = '<div class="tb-exp-item"><span class="tb-exp-item-label">Ready for Maint.</span><span class="tb-exp-item-val">' + (t.readyMaint||'—') + '</span></div>'
          + '<div class="tb-exp-item"><span class="tb-exp-item-label">Plant</span><span class="tb-exp-item-val">' + t.plant + '</span></div>'
          + '<div class="tb-exp-item"><span class="tb-exp-item-label">Truck Mode</span><span class="tb-exp-item-val">' + (t.truckMode||'—') + '</span></div>'
          + '<div class="tb-exp-item"><span class="tb-exp-item-label">Connection</span><span class="tb-exp-item-val">' + (t.conn === 'live' ? 'Live' : 'No connection') + '</span></div>'
          + '<div class="tb-exp-item"><span class="tb-exp-item-label">Last Connection</span><span class="tb-exp-item-val">' + t.lastConn + '</span></div>';
        var exp = '<div class="tb-expand-panel"><div class="tb-exp-grid"><div class="tb-exp-col">' + ovL + '</div><div class="tb-exp-col">' + ovR + '</div></div>' + tbViewBtn(key) + '</div>';
        rows += '<tr class="tb-expand-row"><td colspan="' + ncols + '">' + exp + '</td></tr>';
      }
    });
    if (!rows) rows = '<tr><td colspan="' + ncols + '" style="padding:48px;text-align:center;color:var(--soft);font-size:14px;">No trucks to show.</td></tr>';

  } else if (tbActiveTab === 'cc') {
    // Same truck set as Overview — look up component data from CC_TRUCKS by num
    var ccMap = {};
    if (typeof CC_TRUCKS !== 'undefined') {
      CC_TRUCKS.forEach(function(ct) { ccMap[ct.num] = ct; });
    }
    var ccTrucks = trucks.filter(function(t) {
      if (t.unlinked) return false;
      if (!ql) return true;
      return t.num.includes(ql) || (t.plant||'').toLowerCase().includes(ql);
    });
    total = ccTrucks.length;
    ccTrucks.forEach(function(t, i) {
      var alt  = i % 2 === 1;
      var key  = String(t.num).replace(/[^a-zA-Z0-9_-]/g, '');
      var isEx = tbExpandedRows.has(t.num);
      var ccData = ccMap[t.num]; // may be undefined for trucks without CC data
      // Merge component data onto truck object for tbTruckRow column rendering
      var tWithCC = ccData ? Object.assign({}, t, {components: ccData.components}) : t;
      rows += tbTruckRow(tWithCC, cols, alt, key, isEx);
      if (isEx) {
        var exp;
        if (ccData && ccData.components) {
          var ccComps = ccData.components.map(function(comp) {
            var dotColor = comp.state === 'alarm' ? '#d70100' : comp.state === 'warn' ? '#ffba0d' : '#16a34a';
            var evtColor = comp.state === 'alarm' ? '#d70100' : comp.state === 'warn' ? '#b07800' : 'var(--soft)';
            return '<div class="tb-exp-item">'
              + '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">'
              + '<div style="width:8px;height:8px;border-radius:50%;background:' + dotColor + ';flex-shrink:0;"></div>'
              + '<span class="tb-exp-item-label">' + comp.name + '</span>'
              + '</div>'
              + '<span style="font-size:14px;letter-spacing:-0.28px;color:' + evtColor + ';">' + comp.evt + '</span>'
              + '</div>';
          });
          var half = Math.ceil(ccComps.length / 2);
          var ccL = ccComps.slice(0, half).join('');
          var ccR = ccComps.slice(half).join('');
          exp = '<div class="tb-expand-panel"><div class="tb-exp-grid"><div class="tb-exp-col">' + ccL + '</div><div class="tb-exp-col">' + ccR + '</div></div>' + tbViewBtn(key) + '</div>';
        } else {
          // No component data for this truck
          exp = '<div class="tb-expand-panel"><div style="padding:16px 24px;font-size:14px;color:var(--soft);letter-spacing:-0.28px;">No component data available for this truck.</div>' + tbViewBtn(key) + '</div>';
        }
        rows += '<tr class="tb-expand-row"><td colspan="' + ncols + '">' + exp + '</td></tr>';
      }
    });
    if (!rows) rows = '<tr><td colspan="' + ncols + '" style="padding:48px;text-align:center;color:var(--soft);font-size:14px;">No trucks to show.</td></tr>';
  }

  var tbody = document.getElementById('tb-tbody');
  if (tbody) tbody.innerHTML = rows;

  /* Update truck count in header */
  var countEl = document.getElementById('tb-truck-count');
  if (countEl) {
    var label = tbActiveTab === 'wts'     ? (total + ' truck' + (total !== 1 ? 's' : '') + ' with alerts') :
                tbActiveTab === 'cc'      ? (total + ' truck' + (total !== 1 ? 's' : '')) :
                                           (total + ' truck' + (total !== 1 ? 's' : ''));
    countEl.textContent = label;
  }
}
/* ── TABLET COLUMN VISIBILITY ─────────────────────────────── */
var tbColState = {};

function tbGetColState(tab) {
  if (!tbColState[tab]) {
    tbColState[tab] = TB_COLS[tab].map(function(c) { return Object.assign({}, c, {hidden: false}); });
  }
  return tbColState[tab];
}


function tbColsPopRefresh() {
  var list = document.getElementById('tb-cols-pop-list');
  if (!list) return;
  var cols = tbGetColState(tbActiveTab);
  list.innerHTML = cols.map(function(col) {
    var on   = !col.hidden ? 'on' : '';
    var dim  = col.hidden  ? 'hidden' : '';
    return '<div class="dt-cols-pop-row">'
      + '<button class="dt-cols-toggle ' + on + '" onclick="tbColToggle(&#39;' + col.id + '&#39;,this)"'
      + (col.locked ? ' disabled style="opacity:0.4;cursor:default;"' : '') + '></button>'
      + '<span class="dt-cols-pop-label ' + dim + '">' + col.label + '</span>'
      + '</div>';
  }).join('');
}

function tbColToggle(colId, btn) {
  var col = tbGetColState(tbActiveTab).find(function(c) { return c.id === colId; });
  if (!col || col.locked) return;
  col.hidden = !col.hidden;
  btn.classList.toggle('on', !col.hidden);
  btn.nextElementSibling.classList.toggle('hidden', col.hidden);
  tbRenderTable();
}


function tbToggleGroup(gi) {
  if (!truckGroups[gi]) return;
  truckGroups[gi].open = truckGroups[gi].open === false ? true : false;
  tbRenderTable();
}

/* ── TABLET SEARCH — typeahead dropdown matching mobile/desktop ── */

var tbSrchActiveQuery = '';

function tbSrchGetList() {
  if (tbActiveTab === 'wts') return trucks.filter(function(t) { const _a=getTruckAlerts(t.num); return _a.err||_a.wrn; });
  return trucks; // overview and cc both show all trucks
}

function tbSrchHighlight(text, query) {
  if (!query) return '<span style="color:var(--soft)">' + text + '</span>';
  var idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return '<span style="color:var(--soft)">' + text + '</span>';
  var before = text.slice(0, idx);
  var match  = text.slice(idx, idx + query.length);
  var after  = text.slice(idx + query.length);
  return (before ? '<span style="color:var(--soft)">' + before + '</span>' : '') +
         '<span style="background:#C2D7FA;border-radius:2px;padding:0 2px;color:var(--strong);font-weight:500;">' + match + '</span>' +
         (after ? '<span style="color:var(--soft)">' + after + '</span>' : '');
}

function tbSrchOnInput() {
  var q     = document.getElementById('tb-search-input').value.trim();
  var field = document.getElementById('tb-search2-field');
  var clear = document.getElementById('tb-search-clear');
  var drop  = document.getElementById('tb-srch-drop');
  tbSrchActiveQuery = q;

  if (field) field.classList.toggle('active', q.length > 0);
  if (clear) clear.style.display = q.length > 0 ? 'block' : 'none';

  /* Units page mode */
  var onUnitsPage = document.getElementById('tb-page-units') && document.getElementById('tb-page-units').style.display !== 'none';
  if (onUnitsPage) {
    if (!q) { drop.style.display = 'none'; tbUnitsRender(); return; }
    var ql = q.toLowerCase();
    var unitMatches = (typeof UNITS_DATA !== 'undefined') ? UNITS_DATA.filter(function(u) {
      return (u.id + u.status + u.truck + (u.tgw||'') + (u.sysType||'')).toLowerCase().includes(ql);
    }) : [];
    var unitIcon = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="#36322d9e" stroke-width="1.3"/><path d="M5 8h2l1.5-3 2 6L12 8h-1" stroke="#36322d9e" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var resultsEl = document.getElementById('tb-srch-results');
    if (unitMatches.length === 0) {
      resultsEl.innerHTML = '<div style="font-size:14px;color:var(--soft);padding:8px;text-align:center;letter-spacing:-0.28px;">No units match</div>';
      drop.style.display = 'block';
    } else {
      var MAX = 6, shown = unitMatches.slice(0, MAX), extra = unitMatches.length - MAX;
      var html = '<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:2px;">' + unitIcon + '<span style="font-size:14px;font-weight:500;color:var(--strong);letter-spacing:-0.28px;">Units</span></div>';
      shown.forEach(function(u) {
        var primaryRaw = u.id;
        var primary = tbSrchHighlight(primaryRaw, q);
        var secondary = u.status + ' \u00b7 ' + (u.sysType||'—') + (u.truck && u.truck !== '--' ? ' \u00b7 Truck ' + u.truck : '');
        var safeId = u.id.replace(/[^a-zA-Z0-9_-]/g, '');
        html += '<div class="srch-row" onclick="tbSrchSelectUnit(&#39;' + safeId + '&#39;,&#39;' + u.id.replace(/'/g,"\\'") + '&#39;)">'
              + '<span class="srch-match-text">' + primary + '</span>'
              + '<span class="srch-meta">' + secondary + '</span>'
              + '</div>';
      });
      if (extra > 0) html += '<div class="srch-show-more">' + extra + ' more unit' + (extra > 1 ? 's' : '') + '</div>';
      resultsEl.innerHTML = html;
      drop.style.display = 'block';
    }
    /* Filter units table live */
    tbUnitsRenderFiltered(q);
    return;
  }

  if (!q) { drop.style.display = 'none'; tbRenderTable(); return; }

  var list = tbSrchGetList();
  var matches = list.filter(function(t) {
    var ql = q.toLowerCase();
    return t.num.toLowerCase().includes(ql) ||
           (t.plant||'').toLowerCase().includes(ql) ||
           (t.ver||'').toLowerCase().includes(ql) ||
           (t.ign||'').toLowerCase().includes(ql);
  });

  var MAX = 6, shown = matches.slice(0, MAX), extra = matches.length - MAX;
  var resultsEl = document.getElementById('tb-srch-results');
  var truckIcon = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 13C1.94772 13 1.5 12.5523 1.5 12V9.80278C1.5 9.60535 1.55844 9.41234 1.66795 9.24808L3.20313 6.9453C3.3886 6.6671 3.70083 6.5 4.03518 6.5H6V12C6 12.5523 6.44772 13 7 13H11" stroke="#36322d9e" stroke-width="1.2" stroke-linejoin="round"/><circle cx="4" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/><circle cx="12" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/><path d="M12.2242 5.15477L8.65195 6.06584C6.54213 6.60392 5.61922 9.08368 6.86385 10.8702L11.9902 10.8575L14.0825 7.82226C14.204 7.64525 14.204 7.41112 14.0811 7.23472L12.7748 5.35971C12.6519 5.18331 12.4325 5.10164 12.2242 5.15477Z" stroke="#36322d9e" stroke-width="1.2"/></svg>';

  if (matches.length === 0) {
    resultsEl.innerHTML = '<div style="font-size:14px;color:var(--soft);padding:8px;text-align:center;letter-spacing:-0.28px;">No matches found</div>';
    drop.style.display = 'block'; return;
  }

  var html = '<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:2px;">' + truckIcon + '<span style="font-size:14px;font-weight:500;color:var(--strong);letter-spacing:-0.28px;">Trucks</span></div>';
  shown.forEach(function(t) {
    var primary = tbSrchHighlight(t.num, q);
    var secondary = (t.plant||'') + ' \u00b7 ' + (t.ver||'') + ' \u00b7 Ign ' + (t.ign||'');
    var safeNum = String(t.num).replace(/[^a-zA-Z0-9_-]/g, '');
    html += '<div class="srch-row" onclick="tbSrchSelect(&#39;' + safeNum + '&#39;)">'
          + '<span class="srch-match-text">' + primary + '</span>'
          + '<span class="srch-meta">' + secondary + '</span>'
          + '</div>';
  });
  if (extra > 0) {
    html += '<div class="srch-show-more" onclick="tbSrchShowMore()">Show ' + extra + ' more truck' + (extra > 1 ? 's' : '') + '</div>';
  }
  resultsEl.innerHTML = html;
  drop.style.display = 'block';

  /* Also filter table live */
  tbRenderTable();
}

function tbSrchOnFocus() {
  if (tbSrchActiveQuery) tbSrchOnInput();
}

function tbSrchClear() {
  var input = document.getElementById('tb-search-input');
  input.value = '';
  tbSrchActiveQuery = '';
  var field = document.getElementById('tb-search2-field');
  var clear = document.getElementById('tb-search-clear');
  var drop  = document.getElementById('tb-srch-drop');
  if (field) field.classList.remove('active');
  if (clear) clear.style.display = 'none';
  if (drop)  drop.style.display  = 'none';
  var onUnitsPage = document.getElementById('tb-page-units') && document.getElementById('tb-page-units').style.display !== 'none';
  if (onUnitsPage) { tbUnitsRender(); } else { tbRenderTable(); }
  input.focus();
}

function tbSrchSelectUnit(safeId, unitId) {
  var drop = document.getElementById('tb-srch-drop');
  var input = document.getElementById('tb-search-input');
  if (drop) drop.style.display = 'none';
  if (input) input.value = unitId;
  tbUdOpen(unitId);
}

/* Filter units table rows live as user types in the global search */
function tbUnitsRenderFiltered(q) {
  if (typeof UNITS_DATA === 'undefined') return;
  var ql = (q || '').toLowerCase();
  var filtered = UNITS_DATA.filter(function(u) {
    if (!ql) return true;
    return (u.id + u.status + u.truck + (u.tgw||'') + (u.sysType||'')).toLowerCase().includes(ql);
  });
  var subEl = document.getElementById('tb-units-sub');
  if (subEl) subEl.textContent = 'All Units \u00b7 ' + filtered.length + ' unit' + (filtered.length === 1 ? '' : 's');
  var tbody = document.getElementById('tb-units-tbody');
  if (!tbody) return;

  function statusPill(u) {
    var cls = 'unlinked', label = u.status;
    if (u.status === 'Linked Unit')    { cls = 'linked';  label = 'Active Unit'; }
    if (u.status === 'Maintenance')    { cls = 'maint';   label = 'Maintenance'; }
    if (u.status === 'Pending')        { cls = 'pending'; label = 'Pending Config'; }
    if (u.status === 'Pending Return') { cls = 'pending'; label = 'Pending Return'; }
    if (u.status === 'Unlinked Unit')  { cls = 'unlinked'; label = 'Unlinked Unit'; }
    return '<span class="dt-units-status-pill ' + cls + '"><span class="dot"></span>' + label + '</span>';
  }

  var cbVis = tbUnitsSelectMode ? '' : 'visibility:hidden;pointer-events:none;';
  tbody.innerHTML = filtered.map(function(u, i) {
    var canOpen  = ['Unlinked Unit','Pending','Linked Unit'].includes(u.status);
    var eligible = u.status === 'Unlinked Unit';
    var selected = tbUnitsSelected.has(u.id);
    var safeId   = u.id.replace(/'/g, "\\'");
    var onclick  = canOpen && !tbUnitsSelectMode ? 'onclick="tbUdOpen(\'' + safeId + '\')"' : '';
    var cursor   = canOpen && !tbUnitsSelectMode ? 'pointer' : 'default';
    return '<tr class="dt-tr' + (i%2===1?' alt':'') + (selected?' dt-selected':'') + '" data-unit="' + u.id + '" style="cursor:' + cursor + ';" ' + onclick + '>'
      + '<td class="dt-td" style="width:40px;padding:0 8px;"><input type="checkbox" class="dt-units-cb" ' + (selected?'checked':'') + ' ' + (!eligible?'disabled':'') + ' style="' + cbVis + '" onclick="event.stopPropagation();tbUnitsToggleRow(\'' + safeId + '\',this)"></td>'
      + '<td class="dt-td dt-td-strong">' + u.id + '</td>'
      + '<td class="dt-td">' + statusPill(u) + '</td>'
      + '<td class="dt-td">' + (u.truck === '--' ? '<span style="color:var(--soft);">—</span>' : u.truck) + '</td>'
      + '<td class="dt-td" style="font-family:\'DM Mono\',monospace;font-size:12px;">' + (u.tgw||'—') + '</td>'
      + '<td class="dt-td">' + (u.sysType||'—') + '</td>'
      + '<td class="dt-td">' + (u.config||'—') + '</td>'
      + '</tr>';
  }).join('');
}

function tbSrchSelect(truckNum) {
  var drop  = document.getElementById('tb-srch-drop');
  var input = document.getElementById('tb-search-input');
  if (drop) drop.style.display = 'none';
  var t = trucks.find(function(tr) { return String(tr.num).replace(/[^a-zA-Z0-9_-]/g, '') === truckNum; });
  if (!t) return;
  if (input) input.value = t.num;
  /* Open the drawer directly — same as clicking View Truck */
  tbOpenTruck(t.num);
}

function tbSrchShowMore() {
  var q = tbSrchActiveQuery;
  if (!q) return;
  var list = tbSrchGetList();
  var matches = list.filter(function(t) {
    var ql = q.toLowerCase();
    return t.num.toLowerCase().includes(ql) || (t.plant||'').toLowerCase().includes(ql) ||
           (t.ver||'').toLowerCase().includes(ql) || (t.ign||'').toLowerCase().includes(ql);
  });
  var truckIcon = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 13C1.94772 13 1.5 12.5523 1.5 12V9.80278C1.5 9.60535 1.55844 9.41234 1.66795 9.24808L3.20313 6.9453C3.3886 6.6671 3.70083 6.5 4.03518 6.5H6V12C6 12.5523 6.44772 13 7 13H11" stroke="#36322d9e" stroke-width="1.2" stroke-linejoin="round"/><circle cx="4" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/><circle cx="12" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/><path d="M12.2242 5.15477L8.65195 6.06584C6.54213 6.60392 5.61922 9.08368 6.86385 10.8702L11.9902 10.8575L14.0825 7.82226C14.204 7.64525 14.204 7.41112 14.0811 7.23472L12.7748 5.35971C12.6519 5.18331 12.4325 5.10164 12.2242 5.15477Z" stroke="#36322d9e" stroke-width="1.2"/></svg>';
  var html = '<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:2px;">' + truckIcon + '<span style="font-size:14px;font-weight:500;color:var(--strong);letter-spacing:-0.28px;">Trucks</span></div>';
  matches.forEach(function(t) {
    var primary = tbSrchHighlight(t.num, q);
    var secondary = (t.plant||'') + ' \u00b7 ' + (t.ver||'');
    var safeNum = String(t.num).replace(/[^a-zA-Z0-9_-]/g, '');
    html += '<div class="srch-row" onclick="tbSrchSelect(&#39;' + safeNum + '&#39;)">'
          + '<span class="srch-match-text">' + primary + '</span>'
          + '<span class="srch-meta">' + secondary + '</span>'
          + '</div>';
  });
  document.getElementById('tb-srch-results').innerHTML = html;
}

/* Close tablet search on outside click */

function tbOpenTruck(truckNum) {
  let t = truckGroups.flatMap(g => g.trucks).find(x => x.num === truckNum);
  /* Fall back to trucks[] for newly attached trucks not yet in truckGroups */
  if (!t && typeof trucks !== 'undefined') t = trucks.find(x => x.num === truckNum);
  if (!t) return;
  tbDrawerTruck = t;

  /* Truck number + unit subtitle */
  const numEl = document.getElementById('tb-drawer-truck-num');
  if (numEl) numEl.textContent = t.num;
  const unitForTruck = (typeof UNITS_DATA !== 'undefined')
    ? UNITS_DATA.find(u => String(u.truck) === String(t.num)) : null;
  const unitIdEl = document.getElementById('tb-drawer-unit-id');
  if (unitIdEl) unitIdEl.textContent = unitForTruck ? unitForTruck.id : (t.unitId && t.unitId !== '--' ? t.unitId : '—');
  const tbCommEl = document.getElementById('tb-drawer-commissioned');
  if (tbCommEl) tbCommEl.textContent = (unitForTruck && unitForTruck.firstCommissioned) ? unitForTruck.firstCommissioned : '—';

  /* Ignition badge */
  const ignBadge = document.getElementById('tb-drawer-ign-badge');
  const ignText  = document.getElementById('tb-drawer-ign-text');
  const ignOn    = t.ign === 'On';
  if (ignBadge) {
    ignBadge.className = 'dt-drawer-ign-badge' + (ignOn ? '' : ' off');
  }
  if (ignText) ignText.textContent = ignOn ? 'Ignition on' : 'Ignition off';

  /* Unit pill — show if truck has a linked unit */
  const unitPill = document.getElementById('tb-drawer-back-to-unit');
  const unitPillId = document.getElementById('tb-drawer-back-to-unit-id');
  if (unitPill && unitPillId) {
    if (unitForTruck) {
      unitPillId.textContent = unitForTruck.id;
      unitPill.style.display = 'flex';
    } else {
      unitPill.style.display = 'none';
    }
  }

  /* Reset to overview tab */
  document.querySelectorAll('.tb-drawer-tab').forEach(x => x.classList.remove('active'));
  document.querySelector('.tb-drawer-tab')?.classList.add('active');
  tbDrawerTab('overview', null);
  document.getElementById('tb-drawer').classList.add('open');
}

function tbToggleModePopover() {
  const pop = document.getElementById('tb-mode-popover');
  if (!pop) return;
  const open = pop.style.display !== 'none';
  pop.style.display = open ? 'none' : 'block';
  if (!open) {
    /* Close on outside click */
    const handler = (e) => {
      if (!pop.contains(e.target)) { pop.style.display = 'none'; document.removeEventListener('click', handler); }
    };
    setTimeout(() => document.addEventListener('click', handler), 0);
  }
}

function tbSetMode(mode) {
  const ignBadge = document.getElementById('tb-drawer-ign-badge');
  const ignText  = document.getElementById('tb-drawer-ign-text');
  if (!ignBadge || !ignText) return;
  const labels = { live:'Ignition on', maintenance:'Maintenance', offline:'Ignition off' };
  ignText.textContent = labels[mode] || mode;
  ignBadge.className = 'dt-drawer-ign-badge' + (mode === 'offline' ? ' off' : mode === 'maintenance' ? ' maint' : '');
  document.getElementById('tb-mode-popover').style.display = 'none';
}


function tbCloseDrawer() {
  document.getElementById('tb-drawer').classList.remove('open');
  tbDrawerTruck = null;
}

function tbDrawerTab(tab, el) {
  /* Cancel replace mode if active when switching tabs */
  if (coReplaceActive) tbReplaceCancel();
  /* Close any open install bar */
  const installBar = document.getElementById('co-install-bar');
  if (installBar) installBar.remove();

  if (el) {
    document.querySelectorAll('.tb-drawer-tab').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
  }

  if (typeof senStop === 'function') senStop();
  /* Hide logs overlay whenever switching tabs */
  const tbOverlay = document.getElementById('tb-logs-overlay');
  if (tbOverlay) tbOverlay.style.display = 'none';

  const t = tbDrawerTruck;
  if (!t) return;
  const scroll = document.getElementById('tb-drawer-scroll');
  if (!scroll) return;

  if (tab === 'overview') {
    tbBuildOverview(t, scroll);
    return;
  }

  if (tab === 'timeline') {
    scroll.innerHTML = dtBuildTimeline();
    if (typeof dtTimelineRenderRows === 'function') {
      dtTimelineRenderRows(typeof dtTimelineActiveDayIdx !== 'undefined' ? dtTimelineActiveDayIdx : 6);
    }
    /* Append the same side panel content (connectivity, meta, buttons, map)
       that appears at the bottom of the Components Overview tab */
    const ccSection = document.createElement('div');
    ccSection.style.cssText = 'margin-top:24px;';
    ccSection.innerHTML = tbBuildSidePanel(t);
    scroll.appendChild(ccSection);
    return;
  }

  if (tab === 'logs') {
    scroll.innerHTML = `
      <!-- STATE A: LOG LIST -->
      <div id="tb-logs-list" style="display:flex;flex-direction:column;flex:1;overflow:hidden;min-height:0;">
        <!-- Search + filter bar -->
        <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-bottom:1px solid var(--border);flex-shrink:0;background:var(--layer-1);">
          <div style="flex:1;display:flex;align-items:center;gap:8px;background:var(--layer-2);border:1px solid var(--border);border-radius:24px;padding:7px 14px;">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;"><circle cx="6.5" cy="6.5" r="4" stroke="#36322d9e" stroke-width="1.4"/><path d="M10.5 10.5l3 3" stroke="#36322d9e" stroke-width="1.4" stroke-linecap="round"/></svg>
            <input id="tb-log-search" type="text" placeholder="Search logs…" oninput="tbLogsFilter()" style="flex:1;border:none;outline:none;font-size:13px;color:var(--strong);background:none;font-family:var(--font);letter-spacing:-0.26px;min-width:0;">
          </div>
          <button id="tb-log-filter-btn" onclick="tbLogsToggleFilter()" style="display:flex;align-items:center;gap:5px;background:var(--layer-1);border:1px solid var(--border);border-radius:20px;padding:7px 14px;font-size:13px;font-weight:500;color:var(--strong);font-family:var(--font);letter-spacing:-0.26px;cursor:pointer;flex-shrink:0;white-space:nowrap;">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
            Filter
          </button>
        </div>
        <!-- Filter panel (hidden by default) -->
        <div id="tb-log-filter-panel" style="display:none;padding:14px 16px;border-bottom:1px solid var(--border);background:var(--layer-1);flex-shrink:0;gap:16px;flex-wrap:wrap;">
          <!-- Custom time period -->
          <div style="flex:1 1 220px;min-width:200px;">
            <div class="dt-logs-field-label">Custom time period</div>
            <div class="dt-logs-date-row">
              <input class="dt-logs-date-input from" id="tb-logs-from" type="text" placeholder="From: dd/mm/yy"
                     onfocus="this.type='date'" onblur="if(!this.value)this.type='text'"
                     oninput="tbLogsFilters.from=this.value;tbLogsRenderList();">
              <input class="dt-logs-date-input to" id="tb-logs-to" type="text" placeholder="To: dd/mm/yy"
                     onfocus="this.type='date'" onblur="if(!this.value)this.type='text'"
                     oninput="tbLogsFilters.to=this.value;tbLogsRenderList();">
            </div>
          </div>
          <!-- Source -->
          <div style="min-width:140px;">
            <div class="dt-logs-field-label">Source</div>
            <select class="dt-logs-select" id="tb-logs-source" onchange="tbLogsFilters.source=this.value;tbLogsRenderList();">
              <option value="all">All</option>
              <option value="TRUCK">TRUCK</option>
              <option value="ICD">ICD</option>
              <option value="BACKEND">BACKEND</option>
            </select>
          </div>
          <!-- Message Type -->
          <div style="min-width:150px;">
            <div class="dt-logs-field-label">Message Type</div>
            <select class="dt-logs-select" id="tb-logs-msgtype" onchange="tbLogsMsgTypeChange(this.value)">
              <option value="all">All</option>
              <option value="BackendRequest">BackendRequest</option>
              <option value="DeviceBinding">DeviceBinding</option>
              <option value="Event">Event</option>
              <option value="Identity">Identity</option>
            </select>
          </div>
          <!-- Sub Message Type -->
          <div style="min-width:150px;">
            <div class="dt-logs-field-label">Sub Message Type</div>
            <select class="dt-logs-select" id="tb-logs-subtype" disabled onchange="tbLogsFilters.subType=this.value;tbLogsRenderList();">
              <option value="all">All</option>
            </select>
            <div class="dt-logs-field-helper" id="tb-logs-subtype-helper">Select a message type first</div>
          </div>
        </div>
        <div style="display:flex;background:var(--layer-2);border-bottom:1px solid var(--border);flex-shrink:0;">
          <div style="flex:1.4;padding:10px 12px;font-size:12px;font-weight:600;color:var(--soft);letter-spacing:0.3px;text-transform:uppercase;">Message Time</div>
          <div style="flex:1;padding:10px 12px;font-size:12px;font-weight:600;color:var(--soft);letter-spacing:0.3px;text-transform:uppercase;">Type</div>
          <div style="flex:1.2;padding:10px 12px;font-size:12px;font-weight:600;color:var(--soft);letter-spacing:0.3px;text-transform:uppercase;">Sub Type</div>
        </div>
        <div style="flex:1;overflow-y:auto;" id="tb-log-scroll"></div>
      </div>`;

    /* Populate list */
    tbLogsRenderList();
    return;
  }

  if (tab === 'manual') {
    scroll.innerHTML = dtBuildManual();
    if (typeof dtInitManualCards === 'function') dtInitManualCards();
    /* Append the same side panel (connectivity, meta, buttons, map) */
    const sideSection = document.createElement('div');
    sideSection.style.cssText = 'margin-top:24px;';
    sideSection.innerHTML = tbBuildSidePanel(t);
    scroll.appendChild(sideSection);
    return;
  }

  if (tab === 'sensor') {
    scroll.innerHTML = dtBuildSensor();
    if (typeof dtSenRenderCards === 'function') dtSenRenderCards();
    if (typeof senStart === 'function') senStart();
    return;
  }

  if (tab === 'config') {
    dtDrawerTruckNum = t.num;
    scroll.innerHTML = dtBuildConfig();
    const saveBar = document.getElementById('tb-cfg-savebar');
    if (saveBar) saveBar.style.display = 'none';
    return;
  }

  /* Other tabs — coming soon */
  scroll.innerHTML = `
    <div style="padding:48px 0;text-align:center;color:var(--soft);font-size:14px;">
      ${tab.charAt(0).toUpperCase() + tab.slice(1)} — coming soon for tablet
    </div>`;
}

