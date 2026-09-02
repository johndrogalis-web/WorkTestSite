/* ============================================================================
   app-17-account.js
   ACCOUNT MANAGEMENT + the Settings menu
   ----------------------------------------------------------------------------
   The Settings row in the nav carries a chevron and opens two choices: Log out,
   which returns to the login screen, and Go to settings, which lands on this
   page. Seven tabs: Company, Units, Trucks, Users, Plants, Permissions,
   Software Download.

   Tables are declared once as column definitions and rendered two ways: a real
   table on desktop and tablet, a stack of key/value cards on mobile. One
   source of truth per tab rather than three hand-built layouts.

   Departures from the mocks, all deliberate:
     - Primary buttons (Add truck, Add user, the download buttons) are lime in
       the file. Lime is the outdated accent: blue in light mode, lime only on
       dark. Handled through --am-select so it flips on its own.
     - The pink/red plant and role tags in the mocks are classification labels,
       not severity. Per the tag grammar, red is reserved for errors and amber
       for warnings, so those render as neutral info tags. Genuine severity
       still uses the red and amber tags.

   Load order: after app-14 (calls lgShow to log out) and app-16.
   ========================================================================== */

/* ── Data ─────────────────────────────────────────────────────────────────── */

var AM_COMPANY = {
  name: (typeof VF_COMPANY !== 'undefined') ? VF_COMPANY : 'Cemex AZ',
  address: '2201 East Camelback Road, Phoenix, AZ, 85016',
  phone: '602-298-8373',
  website: 'http://cemexusa.com',
  offset: '11 hours',
  rounding: 'Ten_MM'
};

var AM_STATS = [
  { label:'Verifi Unit', lines:[['32', 'Linked Units'], ['3', 'Unlinked Units']], tab:'units' },
  { label:'Users',       lines:[['115', 'Users'], ['42', 'Contractor']],           tab:'users' },
  { label:'Plants',      lines:[['12', 'Active Plants']],                          tab:'plants' },
  { label:'Fleet',       lines:[['40', 'Trucks']],                                 tab:'trucks' }
];

/* The suite's seven Arizona plants first (they match the truck data), then
   five more to fill out the account. */
var AM_PLANT_NAMES = ['Phoenix Central','Mesa South','Mesa Gateway','Chandler West','Gilbert East',
  'Scottsdale North','Tempe East','Glendale West','Peoria North','Goodyear','Surprise','Tucson Central'];

var AM_PLANT_ADDR = ['2201 E Camelback Rd, Phoenix, AZ 85016','1460 S Country Club Dr, Mesa, AZ 85210',
  '5850 S Sossaman Rd, Mesa, AZ 85212','3125 W Chandler Blvd, Chandler, AZ 85226',
  '1550 E Williams Field Rd, Gilbert, AZ 85295','7350 E Frank Lloyd Wright Blvd, Scottsdale, AZ 85260',
  '1150 E Apache Blvd, Tempe, AZ 85281','5951 W Glendale Ave, Glendale, AZ 85301',
  '8380 W Bell Rd, Peoria, AZ 85382','1500 N Litchfield Rd, Goodyear, AZ 85395',
  '13000 W Bell Rd, Surprise, AZ 85378','4650 S Park Ave, Tucson, AZ 85714'];

var AM_USER_NAMES = ['Carlos Medina','Laura S\u00e1nchez','Javier Torres','Monica Rivera','Daniel Herrera',
  'Ana Gutierrez','Roberto Castillo','Patricia Rojas','Miguel Alvarez','Sofia Delgado','Hector Jimenez',
  'Natalia Flores','Luis Cabrera','Gabriela Pineda','Sergio Lozano','Elena Morales','Andres Ruiz',
  'Fernanda Vega','Ricardo Salas','Julieta Navarro'];

var AM_USER_ROLES = [['QC','Batch'],['Batch'],['Operations','Batch'],['Dispatch'],['Management'],['Dispatch'],
  ['Dispatch'],['Dispatch'],['Driver'],['Batch','QC'],['Driver'],['Dispatch','QC'],['Driver'],['Driver'],
  ['Management'],['Batch'],['Batch'],['Batch'],['Batch'],['Batch','QC']];

var AM_ROLES = [
  ['Plant Supervisor','Oversees batching, crew flow, and daily production.','20','July 2, 2024'],
  ['Dispatcher','Runs the board, assigns trucks, keeps the day moving.','15','August 15, 2024'],
  ['QC Technician','Monitors slump, temps, water adds, and mix adjustments.','30','September 9, 2024'],
  ['Fleet Manager','Owns the trucks, maintenance, and availability.','5','October 21, 2024'],
  ['Operations Manager','Keeps the whole operation aligned across plants, people, and schedules.','5','November 5, 2024'],
  ['Contractor','Can only view the tickets assigned to them. Nothing else.','325','December 12, 2024']
];

function amEsc(s) { return (typeof dbEsc === 'function') ? dbEsc(s) : String(s == null ? '' : s); }
function amH(s) { return (typeof dbHash === 'function') ? dbHash(s) : 7; }

/* Tag helpers. Red is errors, amber is warnings; everything classificatory is
   a neutral info tag. */
function amTag(txt, kind) { return '<span class="am-tag' + (kind ? ' am-tag-' + kind : '') + '">' + amEsc(txt) + '</span>'; }
function amTags(arr, kind, cap) {
  cap = cap || 2;
  var shown = arr.slice(0, cap).map(function (t) { return amTag(t, kind); }).join('');
  if (arr.length > cap) shown += '<span class="am-tag-more">+' + (arr.length - cap) + '</span>';
  return '<span class="am-tag-row">' + shown + '</span>';
}

/* ── Row builders ─────────────────────────────────────────────────────────── */

function amUnitRows() {
  var plants = ['Allentown Plant','Bethlehem Plant','Easton Plant','Reading Plant','Lancaster Plant'];
  var status = ['Installed','Installed','Installed','Maintenance','Pending Install','Inactive'];
  var unitSt = ['Linked Unit','Linked Unit','Linked Unit','Unlinked Unit','Maintenance Mode'];
  var sys = ['V5','V5','Spark','V4','Neo'];
  var cfg = ['Measure Only','Winter Water','Temp + Admix','Color Blend Ratio'];
  var out = [];
  for (var i = 1; i <= 20; i++) {
    var id = 'U-' + (1000 + i), h = amH(id);
    var st = status[h % status.length];
    var pending = (st === 'Pending Install' || st === 'Inactive');
    out.push({
      unit: id, status: st, ustatus: unitSt[h % unitSt.length],
      plant: plants[Math.floor((i - 1) / 4) % plants.length],
      truck: pending ? '\u2014' : 'T-' + (100 + (h % 420)),
      sys: sys[h % sys.length], cfg: cfg[h % cfg.length],
      date: ['Dec 16, 2025 6:05 AM','Jan 11, 2025 8:45 PM','Feb 24, 2025 4:10 PM','Sept 20, 2025 10:15 AM','Jan 7, 2026 10:45 AM'][h % 5]
    });
  }
  return out;
}

function amTruckRows() {
  var trucks = (typeof dbTrucks === 'function') ? dbTrucks() : [];
  var unitSt = ['Linked Unit','Linked Unit','Linked Unit','Unlinked Unit','Maintenance Mode'];
  var stat = ['Live','Live','Live','Mid Transfer','Decommissions','New Install Pending'];
  var mixer = ['McNeilus','Schwing'];
  var base = trucks.length ? trucks.map(function (t) { return t.num; }) : ['23687','23696','24474','24494','64565'];
  var out = [];
  base.forEach(function (num, i) {
    var h = amH('tk' + num);
    out.push({
      truck: num, batch: String(10023687 + h % 41000),
      ustatus: unitSt[h % unitSt.length], status: stat[h % stat.length],
      mixer: mixer[h % 2], version: (h % 2) ? '5.0.3176' : '4.8.0021'
    });
  });
  return out;
}

function amUserRows() {
  return AM_USER_NAMES.map(function (n, i) {
    var h = amH(n);
    var allLoc = (h % 3 !== 0);
    var plants = allLoc ? ['All locations'] : [AM_PLANT_NAMES[h % 12], AM_PLANT_NAMES[(h + 5) % 12]];
    if (!allLoc && h % 7 === 0) plants = plants.concat(['x','x','x','x','x']);
    return {
      name: n, email: n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ /g, '.') + '@cemex.com',
      plants: amTags(plants, null, 2), role: amTags(AM_USER_ROLES[i] || ['Batch'], null, 2), org: AM_COMPANY.name
    };
  });
}

function amPlantRows() {
  return AM_PLANT_NAMES.map(function (n, i) {
    var h = amH(n);
    return {
      plant: n, tz: 'US/Arizona', addr: AM_PLANT_ADDR[i],
      tags: amTags(['Valley', (h % 2) ? 'East Valley' : 'West Valley'], null, 2),
      account: AM_COMPANY.name, code: (i < 5) ? '5.0.3176' : '4.8.0021'
    };
  });
}

/* ── Tab definitions ──────────────────────────────────────────────────────── */

var AM_TABS = [
  { id:'company',  label:'Company' },
  { id:'units',    label:'Units' },
  { id:'trucks',   label:'Trucks' },
  { id:'users',    label:'Users' },
  { id:'plants',   label:'Plants' },
  { id:'perms',    label:'Permissions' },
  { id:'software', label:'Software Download' }
];

/* Column defs drive both the desktop table and the mobile card stack. */
var AM_TABLES = {
  units: {
    check: true, search:'Units, truck, Plants', total:32,
    cols:[ {k:'unit', label:'Unit Id', w:1, mono:true}, {k:'status', label:'Status', w:1.1},
           {k:'ustatus', label:'Unit Status', w:1.3}, {k:'plant', label:'Assigned Plant', w:1.5},
           {k:'truck', label:'Truck Number', w:1.1, mono:true}, {k:'sys', label:'System Type', w:1},
           {k:'cfg', label:'Configuration', w:1.4}, {k:'date', label:'Commission Date', w:1.7} ],
    rows: amUnitRows
  },
  trucks: {
    search:'Ticket, truck, order, mix, etc.', action:'Add truck', total:40,
    rowClick:'amTruckOpen', actionFn:'amAddTruckOpen',
    cols:[ {k:'truck', label:'Trucks', w:1, mono:true}, {k:'batch', label:'Batch code', w:1.2, mono:true},
           {k:'ustatus', label:'Unit Status', w:1.3}, {k:'status', label:'Status', w:1.5},
           {k:'mixer', label:'Mixer Type', w:1.3}, {k:'version', label:'Version', w:1, mono:true} ],
    rows: amTruckRows
  },
  users: {
    search:'Name, email, plant, role', action:'Add user', menu:'User Actions', total:115,
    rowClick:'amUserOpen', actionFn:'amAddUserOpen',
    cols:[ {k:'name', label:'Names', w:1.2}, {k:'email', label:'Email Address', w:1.7},
           {k:'plants', label:'Plants', w:1.8, raw:true}, {k:'role', label:'Role', w:1.2, raw:true},
           {k:'org', label:'Organization', w:1.2} ],
    rows: amUserRows
  },
  plants: {
    search:'Plants', action:'Add plant', total:12,
    rowClick:'amPlantOpen', actionFn:'amPlantNew',
    cols:[ {k:'plant', label:'Plants Name', w:1.4}, {k:'tz', label:'Timezone', w:1},
           {k:'addr', label:'Address', w:2}, {k:'tags', label:'Tags', w:1.5, raw:true},
           {k:'account', label:'Accounts', w:1.2}, {k:'code', label:'Batch Source Code', w:1.2, mono:true} ],
    rows: amPlantRows
  },
  perms: {
    search:'Roles', action:'Add role', total:6,
    rowClick:'amRoleOpen', actionFn:'amRoleNew',
    cols:[ {k:'role', label:'Role Name', w:1.3}, {k:'desc', label:'Descriptions', w:3},
           {k:'users', label:'Assign Users', w:1}, {k:'updated', label:'Last Updated', w:1.3} ],
    rows: function () {
      return AM_ROLES.map(function (r) { return { role:r[0], desc:r[1], users:r[2], updated:r[3] }; });
    }
  }
};

/* ── State ────────────────────────────────────────────────────────────────── */

var amTab = 'company';
var amPerPage = 20;

function amGoTab(t) { amTab = t; amRenderAll(); }

function amSetPerPage(v) { amPerPage = parseInt(v && v.value !== undefined ? v.value : v, 10) || 20; amRenderAll(); }

/* ── Chrome ───────────────────────────────────────────────────────────────── */

function amIconSearch() { return '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.8" stroke="currentColor" stroke-width="1.3"/><path d="M10.6 10.6 14 14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'; }
function amIconFilter() { return '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6.5 12h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'; }
function amIconDl()     { return '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2v7.5M5 7l3 3 3-3M3 13h10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
function amIconEye()    { return '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.4-3.6 6-3.6S14 8 14 8s-2.4 3.6-6 3.6S2 8 2 8z" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="1.7" stroke="currentColor" stroke-width="1.2"/></svg>'; }
function amCaret()      { return '<svg width="11" height="7" viewBox="0 0 12 8" fill="none"><path d="M1 1.5l5 5 5-5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'; }
function amArrow()      { return '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7h9M7.5 3l4 4-4 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }

function amToolbar(def) {
  var right = '';
  if (def.menu)   right += '<button class="am-pill">' + def.menu + ' ' + amCaret() + '</button>';
  if (def.action) {
    right += '<button class="am-primary"' + (def.actionFn ? ' onclick="' + def.actionFn + '()"' : '')
      + '>' + def.action + ' <span class="am-plus">+</span></button>';
  }
  return '<div class="am-toolbar">'
    + '<div class="am-search">' + amIconSearch() + '<input placeholder="' + amEsc(def.search || 'Search') + '"></div>'
    + '<button class="am-pill">' + amIconFilter() + ' Filters</button>'
    + '<span class="am-tb-div"></span>'
    + '<button class="am-icon-btn" title="Export">' + amIconDl() + '</button>'
    + '<button class="am-pill">' + amIconEye() + ' Columns ' + amCaret() + '</button>'
    + (right ? '<div class="am-tb-right">' + right + '</div>' : '')
    + '</div>';
}

function amTableHtml(def, rows) {
  var grid = (def.check ? '34px ' : '') + def.cols.map(function (c) { return c.w + 'fr'; }).join(' ');
  var head = '<div class="am-tr am-th" style="grid-template-columns:' + grid + ';">'
    + (def.check ? '<span><span class="am-check"></span></span>' : '')
    + def.cols.map(function (c) { return '<span>' + c.label + '</span>'; }).join('') + '</div>';
  var body = rows.map(function (r, i) {
    var click = def.rowClick
      ? ' onclick="' + def.rowClick + '(\'' + amEsc(r[def.cols[0].k]) + '\')"' : '';
    return '<div class="am-tr' + (i % 2 ? ' zebra' : '') + (def.rowClick ? ' am-tr-click' : '')
      + '"' + click + ' style="grid-template-columns:' + grid + ';">'
      + (def.check ? '<span><span class="am-check"></span></span>' : '')
      + def.cols.map(function (c) {
          var v = r[c.k];
          var cls = (c.mono ? 'am-mono' : '') + (v === '\u2014' ? ' am-dim' : '');
          return '<span class="' + cls + '">' + (c.raw ? v : amEsc(v)) + '</span>';
        }).join('') + '</div>';
  }).join('');
  return '<div class="am-table-wrap"><div class="am-table">' + head + body + '</div></div>' + amPager(def, rows.length);
}

/* Mobile: same column defs, rendered as a stack of key/value cards. */
function amCardsHtml(def, rows) {
  return '<div class="am-cards">' + rows.map(function (r) {
    var lead = def.cols[0];
    var click = def.rowClick ? ' onclick="' + def.rowClick + '(\'' + amEsc(r[lead.k]) + '\')"' : '';
    return '<div class="am-card' + (def.rowClick ? ' am-tr-click' : '') + '"' + click
      + '><div class="am-card-head' + (lead.mono ? ' am-mono' : '') + '">'
      + (lead.raw ? r[lead.k] : amEsc(r[lead.k])) + '</div>'
      + def.cols.slice(1).map(function (c) {
          return '<div class="am-card-row"><span class="am-card-k">' + c.label + '</span>'
            + '<span class="am-card-v' + (c.mono ? ' am-mono' : '') + '">' + (c.raw ? r[c.k] : amEsc(r[c.k])) + '</span></div>';
        }).join('') + '</div>';
  }).join('') + '</div>' + amPager(def, rows.length);
}

function amPager(def, shown) {
  return '<div class="am-pager">'
    + '<div class="am-perpage">' + vfDd({ id:'am-dd-perpage', options:[20, 50, 100], value:amPerPage, search:false, onChange:'amSetPerPage', cls:'vf-dd-sm' })
      + '<span>Rows per page</span></div>'
    + '<div class="am-records"><span>1 - ' + shown + ' of ' + (def.total || shown) + ' Records</span>'
      + '<span class="am-pag-btns"><button disabled>&#171;</button><button disabled>&#8249;</button>'
      + '<button>&#8250;</button><button>&#187;</button></span></div>'
    + '</div>';
}

/* ── Tab bodies ───────────────────────────────────────────────────────────── */

function amCompanyBody() {
  return '<div class="am-h2">Company Overview</div>'
    + '<div class="am-stats">' + AM_STATS.map(function (s) {
        return '<div class="am-stat" onclick="amGoTab(\'' + s.tab + '\')">'
          + '<div class="am-stat-lbl">' + s.label + '</div>'
          + s.lines.map(function (l) {
              return '<div class="am-stat-line"><span class="am-stat-n">' + l[0] + '</span><span>' + l[1] + '</span></div>';
            }).join('')
          + '<button class="am-stat-go">' + amArrow() + '</button></div>';
      }).join('') + '</div>'

    + '<div class="am-h2">Contact Info</div>'
    + '<div class="am-cgrid">'
      + '<div><div class="am-flabel">Company Name</div><div class="am-fstatic">' + AM_COMPANY.name + '</div></div>'
      + '<div><div class="am-flabel">Company Address</div><div class="am-fstatic">' + AM_COMPANY.address + '</div></div>'
      + amField('Phone', AM_COMPANY.phone)
      + amField('Website', AM_COMPANY.website)
      + amField('Off Set', AM_COMPANY.offset)
      + amField('Slump Rounding Method', AM_COMPANY.rounding)
    + '</div>';
}

function amField(label, val) {
  return '<div><div class="am-flabel">' + label + '</div>'
    + '<div class="am-frow"><input class="am-input" value="' + amEsc(val) + '"><button class="am-link">Update</button></div></div>';
}

function amSoftwareBody() {
  return [['Batching Agent', 'Download the Batching Agent installer.', 'Download Batching Agent'],
          ['GPS Interface Agent', 'Download the GPS Interface Agent installer.', 'Download GPS Interface Agent'],
          ['Batching Agent Documentation', 'Read or download the documentation.', 'Download Documentation']]
    .map(function (b) {
      return '<div class="am-dl"><div class="am-dl-title">' + b[0] + '</div>'
        + '<div class="am-dl-sub">' + b[1] + '</div>'
        + '<button class="am-primary">' + b[2] + '</button></div>';
    }).join('');
}

function amBody(dev) {
  if (amTab === 'company')  return amCompanyBody();
  if (amTab === 'software') return amSoftwareBody();
  var def = AM_TABLES[amTab];
  if (!def) return '';
  var rows = def.rows().slice(0, amPerPage);
  var head = (amTab === 'units')
    ? '<div class="am-h2">32 Linked Units / 3 Unlinked Units</div>' : '';
  return head + amToolbar(def) + (dev === 'm' ? amCardsHtml(def, rows) : amTableHtml(def, rows));
}

/* ── Render ───────────────────────────────────────────────────────────────── */

function amShellHtml(dev) {
  return '<div class="am-scroll">'
    + '<div class="am-title">Account management</div>'
    + '<div class="am-tabs">' + AM_TABS.map(function (t) {
        return '<button class="am-tab' + (amTab === t.id ? ' on' : '') + '" onclick="amGoTab(\'' + t.id + '\')">' + t.label + '</button>';
      }).join('') + '</div>'
    + '<div class="am-body">' + amBody(dev) + '</div>'
    + '</div>';
}

function amRenderAll() {
  var d = document.getElementById('dt-page-account');
  if (d && d.style.display && d.style.display !== 'none') d.innerHTML = amShellHtml('d');
  var t = document.getElementById('am-tb-mount');
  if (t && t.offsetParent) t.innerHTML = amShellHtml('t');
  var m = document.getElementById('am-mob-mount');
  if (m && m.offsetParent) m.innerHTML = amShellHtml('m');
}

/* ── Desktop routing ──────────────────────────────────────────────────────── */

function amDeskShow() {
  if (typeof dbOrigNavGo === 'function') dbOrigNavGo('__am__');
  if (typeof dbNavLight === 'function') dbNavLight(false);
  var dash = document.getElementById('dt-page-dashboard');
  if (dash) dash.style.display = 'none';
  var page = document.getElementById('dt-page-account');
  if (page) { page.style.display = 'flex'; page.innerHTML = amShellHtml('d'); }
  if (typeof setHash === 'function') setHash(['desktop', 'account']);
  try { if (typeof dtUnitsActivePage !== 'undefined') dtUnitsActivePage = 'account'; } catch (e) {}
}

/* Claim the route so a refresh and the theme repaint both land back here. */
var amOrigNavGo = (typeof dtNavGo === 'function') ? dtNavGo : null;
window.dtNavGo = function (key) {
  if (key === 'account') { amDeskShow(); return; }
  var page = document.getElementById('dt-page-account');
  if (page) page.style.display = 'none';
  if (amOrigNavGo) amOrigNavGo(key);
};

/* ── Tablet + mobile ──────────────────────────────────────────────────────── */

var AM_TB_SIBLINGS = ['tb-content','tb-page-units','tb-page-update','tb-page-map','tb-page-tickets',
  'tb-page-dashboard','tb-page-header','tb-search-row','tb-tabs-row'];
var amTbSnap = null;

function amTabletOpen() {
  if (typeof tbNavClose === 'function') tbNavClose();
  if (typeof ttkClose === 'function') ttkClose();
  if (typeof dbTabletClose === 'function') dbTabletClose();
  if (amTbSnap === null) {
    amTbSnap = {};
    AM_TB_SIBLINGS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { amTbSnap[id] = el.style.display; el.style.display = 'none'; }
    });
  }
  var page = document.getElementById('tb-page-account');
  if (page) page.style.display = 'flex';
  var mount = document.getElementById('am-tb-mount');
  if (mount) mount.innerHTML = amShellHtml('t');
}

function amTabletClose() {
  var page = document.getElementById('tb-page-account');
  if (page) page.style.display = 'none';
  if (amTbSnap) {
    Object.keys(amTbSnap).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = amTbSnap[id];
    });
    amTbSnap = null;
  }
}

function amMobileOpen() {
  if (typeof closeNav === 'function') closeNav();
  if (typeof mtkClose === 'function') mtkClose();
  if (typeof mobSwuClose === 'function') mobSwuClose();
  if (typeof dbMobileClose === 'function') dbMobileClose();
  var el = document.getElementById('mob-page-account');
  if (el) el.style.display = 'flex';
  var mount = document.getElementById('am-mob-mount');
  if (mount) mount.innerHTML = amShellHtml('m');
}

function amMobileClose() {
  var el = document.getElementById('mob-page-account');
  if (el) el.style.display = 'none';
}

/* Any other destination closes these first. */
(function amHook() {
  ['tbNavSetActive','ttkOpen','dbTabletNav','dbTabletOpen'].forEach(function (fn) {
    if (typeof window[fn] === 'function' && !window[fn].__amWrapped) {
      var orig = window[fn];
      window[fn] = function () { amTabletClose(); return orig.apply(this, arguments); };
      window[fn].__amWrapped = true;
    }
  });
  ['mtkOpen','mobSwuOpen','goToAllTrucks','snGoMap','dbMobileNav','dbMobileOpen'].forEach(function (fn) {
    if (typeof window[fn] === 'function' && !window[fn].__amWrapped) {
      var orig = window[fn];
      window[fn] = function () { amMobileClose(); return orig.apply(this, arguments); };
      window[fn].__amWrapped = true;
    }
  });
})();

/* ── Settings menu ────────────────────────────────────────────────────────── */

function stMenuToggle(e, scope) {
  if (e) e.stopPropagation();
  var id = 'st-menu-' + scope;
  var el = document.getElementById(id);
  if (!el) return;
  var open = el.classList.toggle('open');
  if (open) {
    setTimeout(function () {
      document.addEventListener('click', function close() {
        el.classList.remove('open');
        document.removeEventListener('click', close);
      }, { once:true });
    }, 0);
  }
}

function stGoSettings(scope) {
  var el = document.getElementById('st-menu-' + scope);
  if (el) el.classList.remove('open');
  amTab = 'company';
  if (scope === 'mob') amMobileOpen();
  else if (scope === 'tb') amTabletOpen();
  else if (typeof dtNavGo === 'function') dtNavGo('account');
}

function stLogout(scope) {
  var el = document.getElementById('st-menu-' + scope);
  if (el) el.classList.remove('open');
  amTabletClose();
  amMobileClose();
  if (typeof pfClose === 'function') pfClose();
  if (typeof closeNav === 'function') closeNav();
  if (typeof lgShow === 'function') lgShow();
}

/* Re-render on theme flip: the primary buttons and selection tints are
   token-driven, but the tables rebuild cheaply and this keeps any inline
   state honest. */
(function amWatchTheme() {
  var was = document.body.classList.contains('dark');
  new MutationObserver(function () {
    var is = document.body.classList.contains('dark');
    if (is === was) return;
    was = is;
    amRenderAll();
  }).observe(document.body, { attributes:true, attributeFilter:['class'] });
})();

/* Refresh restore. */
(function amBootRoute() {
  var parts = (typeof readHashParts === 'function') ? readHashParts() : [];
  if (parts[1] !== 'account') return;
  setTimeout(function () {
    try {
      if (parts[0] === 'mobile') amMobileOpen();
      else if (parts[0] === 'tablet') amTabletOpen();
      else amDeskShow();
    } catch (e) {}
  }, 200);
})();


/* ── Truck detail drawer ──────────────────────────────────────────────────────
   Opens from a row in the Trucks tab. Two tabs, Truck Details and Truck
   History, in the same right-hand drawer pattern as My Profile.

   One correction to the mock: the status badge is drawn orange there. Orange
   is not in the tag grammar, and Mid Transfer is a lifecycle status rather
   than a severity, so it renders as a neutral tag. Red stays for errors and
   amber for warnings.
   ========================================================================== */

var AM_TRUCK_STATUSES = ['Live','Mid Transfer','Decommissions','New Install Pending','Maintenance Mode'];
var amTruckNum = null;
var amTruckTab = 'details';

function amTruckData(num) {
  var h = amH('td' + num);
  var st = AM_TRUCK_STATUSES[h % AM_TRUCK_STATUSES.length];
  return {
    num: num, status: st, company: AM_COMPANY.name,
    lastTicket: 'November 17, 2025 - 9:11am',
    model: 'Verifi Sensor Module V' + (3 + (h % 2)),
    platform: (h % 3 === 0) ? 'Water' : (h % 3 === 1) ? 'Water + Admix' : 'Measure Only',
    commission: ['Feb 14, 2024','Mar 2, 2024','Aug 19, 2023','Jan 8, 2025'][h % 4],
    decommission: (st === 'Decommissions') ? 'Jan 30, 2026' : '---',
    unitStatus: (st === 'Decommissions') ? 'Retired' : 'Live',
    unitId: String(23156462432 + (h * 977) % 900000),
    software: '7.1.' + (4000 + h % 900),
    firmware: (h % 2) ? '4.8.0021' : '5.0.3176',
    vin: String(32514106541369 + (h * 613) % 90000),
    magnets: (2 + h % 4) + ' magnets installed',
    drum: (9 + (h % 4)) + '.5 yd\u00b3',
    frontDischarge: (h % 3 === 0) ? 'Disabled' : 'Enabled',
    tablet: ['Samsung Tab Active3','Samsung Tab Active4','Zebra ET40'][h % 3],
    pump: 'Pump Model WP-2200, ' + (40 + h % 15) + ' PSI'
  };
}

function amTruckHistory(num) {
  var who = ['Laura S\u00e1nchez','Carlos Medina','Monica Rivera'][amH('w' + num) % 3];
  return [
    { day:'Today Wed April 23th 2023', rows:[
      { num:num, txt:'Was reactivated at 5:40Pm by ' + who },
      { num:num, txt:'Maintenance was complete at 4:30 pm', note:{
          title:'Maintenance Updates',
          body:'This truck triggered a maintenance check after several buildup alerts. The system flagged residue levels rising past the plant\u2019s threshold, suggesting the drum may need cleaning or inspection soon.' } },
      { num:num, txt:'Was deactivated at 3:40Pm by ' + who }
    ] },
    { day:'Yesterday Tuesday April 22th 2023', rows:[
      { num:num, txt:'Was deactivated at 3:40Pm by ' + who },
      { num:num, txt:'Was deactivated at 3:40Pm by ' + who }
    ] }
  ];
}

function amTdIcon(kind) {
  var p = {
    model:'<rect x="2" y="3.5" width="12" height="8" rx="1.4" stroke="currentColor" stroke-width="1.3"/><path d="M5 14h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
    gauge:'<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M8 8l3-2.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
    box:'<path d="M3 3h3M10 3h3M13 3v3M13 10v3M13 13h-3M6 13H3M3 13v-3M3 6V3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
    archive:'<rect x="2.5" y="3" width="11" height="3" rx="1" stroke="currentColor" stroke-width="1.3"/><path d="M4 6v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6" stroke="currentColor" stroke-width="1.3"/>',
    router:'<rect x="2.5" y="9" width="11" height="4" rx="1.2" stroke="currentColor" stroke-width="1.3"/><path d="M8 9V7M6 4.6a3 3 0 0 1 4 0M4.4 2.8a5.4 5.4 0 0 1 7.2 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
    branch:'<circle cx="5" cy="4" r="1.6" stroke="currentColor" stroke-width="1.3"/><circle cx="5" cy="12" r="1.6" stroke="currentColor" stroke-width="1.3"/><circle cx="11" cy="8" r="1.6" stroke="currentColor" stroke-width="1.3"/><path d="M5 5.6v4.8M6.5 11l3-1.8M6.5 5l3 1.8" stroke="currentColor" stroke-width="1.3"/>',
    truck:'<path d="M1.5 5.5h7v5h-7zM8.5 7.5h3l2 2v1h-5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><circle cx="4" cy="12" r="1.3" stroke="currentColor" stroke-width="1.2"/><circle cx="11" cy="12" r="1.3" stroke="currentColor" stroke-width="1.2"/>'
  };
  return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none">' + (p[kind] || p.box) + '</svg>';
}

function amTruckOpen(num) {
  amTruckNum = num;
  amTruckTab = 'details';
  var host = document.getElementById('am-truck-drawer');
  if (!host) return;
  host.style.display = 'flex';
  amTruckRender();
}

function amTruckClose() {
  var host = document.getElementById('am-truck-drawer');
  if (!host) return;
  host.classList.add('am-out');
  setTimeout(function () { host.style.display = 'none'; host.classList.remove('am-out'); }, 220);
}

function amTruckGoTab(t) {
  amTruckTab = t;
  var body = document.getElementById('am-dr-body');
  if (!body) { amTruckRender(); return; }
  body.innerHTML = amTruckBody();
  body.scrollTop = 0;
  var host = document.getElementById('am-truck-drawer');
  if (host) {
    host.querySelectorAll('.am-dr-tabs .am-tab').forEach(function (el) {
      el.classList.toggle('on', el.dataset.tab === t);
    });
  }
}

function amTruckRender() {
  var host = document.getElementById('am-truck-drawer');
  if (!host || !amTruckNum) return;
  var t = amTruckData(amTruckNum);
  var body = amTruckBody();

  host.innerHTML = '<div class="am-scrim" onclick="amTruckClose()"></div>'
    + '<div class="am-drawer">'
      + '<div class="am-dr-head"><div>'
        + '<div class="am-dr-title">Truck- ' + amEsc(t.num) + amTag(t.status) + '</div>'
        + '<div class="am-dr-sub">' + amEsc(t.company) + '</div>'
        + '<div class="am-dr-sub am-dim">Last Ticket was: ' + t.lastTicket + '</div>'
      + '</div><button class="am-dr-x" onclick="amTruckClose()">&#215;</button></div>'
      + '<div class="am-tabs am-dr-tabs">'
        + '<button class="am-tab' + (amTruckTab === 'details' ? ' on' : '') + '" data-tab="details" onclick="amTruckGoTab(\'details\')">Truck Details</button>'
        + '<button class="am-tab' + (amTruckTab === 'history' ? ' on' : '') + '" data-tab="history" onclick="amTruckGoTab(\'history\')">Truck History</button>'
      + '</div>'
      + '<div class="am-dr-body" id="am-dr-body">' + body + '</div>'
    + '</div>';
}

/* Tab content only — the drawer shell around it stays put. */
function amTruckBody() {
  var t = amTruckData(amTruckNum);
  var fields = [
    ['model','Model', t.model], ['gauge','Platform', t.platform],
    ['box','Commission Date', t.commission], ['archive','Decommission Date', t.decommission],
    ['router','Unit Status', t.unitStatus], ['router','Unit Identifier', t.unitId],
    ['branch','Software Version', t.software], ['box','Firmware Version', t.firmware],
    ['truck','Vin Number', t.vin]
  ];
  var equip = [['Number of Drum Magnets', t.magnets], ['Drum Size', t.drum],
    ['Front Discharge', t.frontDischarge], ['Icd Tablet', t.tablet],
    ['Water Propulsion Diaphragm Pump', t.pump]];

  var body;
  if (amTruckTab === 'details') {
    body = '<div class="am-td-top">'
      + '<div class="am-h2 am-h2-flush">Truck Details</div>'
      + '<div class="am-td-status"><div class="am-flabel">Truck Status</div>'
        + vfDd({ id:'am-dd-truck-status', options:AM_TRUCK_STATUSES, value:t.status, search:false }) + '</div>'
      + '</div>'
      + '<div class="am-td-grid">' + fields.map(function (f) {
          return '<div class="am-td-field"><span class="am-td-icon">' + amTdIcon(f[0]) + '</span>'
            + '<div class="am-td-k">' + f[1] + '</div>'
            + '<div class="am-td-v' + (f[2] === '---' ? ' am-dim' : '') + '">' + amEsc(f[2]) + '</div></div>';
        }).join('') + '</div>'
      + '<div class="am-h2 am-td-h2">Equipment Settings</div>'
      + '<div class="am-eq">' + equip.map(function (e) {
          return '<div class="am-eq-row"><span class="am-eq-k">' + e[0] + '</span>'
            + '<span class="am-eq-v">' + amEsc(e[1]) + '</span></div>';
        }).join('') + '</div>';
  } else {
    body = amTruckHistory(amTruckNum).map(function (g) {
      return '<div class="am-hist-day"><span>' + g.day + '</span></div>'
        + g.rows.map(function (r) {
            return '<div class="am-hist-row"><span class="am-hist-num">Truck- ' + amEsc(r.num) + '</span>'
              + '<span class="am-hist-txt">' + amEsc(r.txt) + '</span></div>'
              + (r.note ? '<div class="am-hist-note"><div class="am-hist-note-t">' + r.note.title + '</div>'
                  + '<div class="am-hist-note-b">' + amEsc(r.note.body) + '</div></div>' : '');
          }).join('');
    }).join('');
  }
  return body;
}


/* ── Add Truck ────────────────────────────────────────────────────────────────
   Same right-hand drawer as the truck detail view, so adding and inspecting a
   truck read as one surface. Add To Fleet is the commit moment, so it is the
   only solid button here; Cancel stays a quiet outline pill. Both take their
   colour from --am-select, which is blue in light mode and lime on dark.

   Nothing is persisted: submitting closes the drawer and shows a toast. The
   Trucks list is generated from the suite's own truck data, so injecting a
   fabricated row would put the table and its record count out of step.
   ========================================================================== */

var AM_ADD_FIELDS = [
  { k:'vin',    label:'Vin Number',         ph:'VIN (17 characters)' },
  { k:'drum',   label:'Drum Size',          ph:'Example: 10 yd\u00b3' },
  { k:'minmix', label:'Min Mixing Speed',   ph:'Min mixing RPM' },
  { k:'maxmix', label:'Max Mixing Speed',   ph:'Max mixing RPM' },
  { k:'year',   label:'Drum Year',          ph:'2007' },
  { k:'dtype',  label:'Drum Type',          ph:'Type of drum' },
  { k:'minag',  label:'Min Agitation Speed', ph:'Typical range: 2\u20136 RPM' },
  { k:'disch',  label:'Discharge Location', select:['Front Discharge','Rear Discharge'] }
];

function amAddTruckOpen() {
  var host = document.getElementById('am-add-truck');
  if (!host) return;
  host.style.display = 'flex';
  host.innerHTML = '<div class="am-scrim" onclick="amAddTruckClose()"></div>'
    + '<div class="am-drawer">'
      + '<div class="am-dr-head"><div class="am-dr-title">Add Truck</div>'
        + '<button class="am-dr-x" onclick="amAddTruckClose()">&#215;</button></div>'
      + '<div class="am-dr-body">'
        + '<div class="am-h2 am-add-h2">Truck Information</div>'
        + '<div class="am-add-grid">' + AM_ADD_FIELDS.map(function (f) {
            var input = f.select
              ? vfDd({ id:'am-dd-add-' + f.k, options:f.select, value:f.select[0], search:false })
              : '<input class="am-input" placeholder="' + f.ph + '">';
            return '<div class="am-add-field"><label class="am-flabel">' + f.label + '</label>' + input + '</div>';
          }).join('') + '</div>'
      + '</div>'
      + '<div class="am-dr-foot">'
        + '<button class="am-pill am-foot-btn" onclick="amAddTruckClose()">Cancel</button>'
        + '<button class="am-primary am-foot-btn" onclick="amAddTruckSubmit()">Add To Fleet</button>'
      + '</div>'
    + '</div>';
}

function amAddTruckClose() {
  var host = document.getElementById('am-add-truck');
  if (!host) return;
  host.classList.add('am-out');
  setTimeout(function () { host.style.display = 'none'; host.classList.remove('am-out'); }, 220);
}

function amAddTruckSubmit() {
  var vin = document.querySelector('#am-add-truck .am-input');
  var label = (vin && vin.value.trim()) ? 'Truck ' + vin.value.trim().slice(-6) : 'Truck';
  amAddTruckClose();
  amToast(label + ' added to the fleet');
}

function amToast(msg) {
  var el = document.getElementById('am-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'am-toast';
    var phone = document.querySelector('.phone') || document.body;
    phone.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(amToast._t);
  amToast._t = setTimeout(function () { el.classList.remove('on'); }, 2600);
}


/* ── User drawers ─────────────────────────────────────────────────────────────
   Two surfaces on the Users tab: Add user opens the New User form, and
   clicking a row opens that user's record with User Information and User
   access tabs.

   Departures from the mocks:
     - Invite user is lime in the file. Blue in light mode, lime on dark, via
       --am-select. Cancel stays a quiet outline pill.
     - The pink role and plant tags are classification, not severity, so they
       render as neutral tags. Red is errors, amber is warnings.
     - The record drawer is titled "My Profile" in the file. That is the name
       of the logged-in user's own panel, and reusing it for someone else's
       record reads as a copy slip, so the header carries the user's name and
       role instead — same shape as the truck drawer.
     - The New User first and last name fields have "Truck Number" as their
       placeholder in the file. Also a slip; they say First name / Last name.
   ========================================================================== */

var AM_ROLE_OPTIONS = ['Dispatch','Batch','QC','Operations','Management','Driver'];
var amUserName = null;
var amUserTab = 'info';

function amUserData(name) {
  var h = amH('usr' + name);
  var i = AM_USER_NAMES.indexOf(name);
  var roles = (i >= 0 && AM_USER_ROLES[i]) ? AM_USER_ROLES[i] : ['Dispatch'];
  var parts = name.split(' ');
  var allLoc = (h % 3 !== 0);
  return {
    name: name, first: parts[0], last: parts.slice(1).join(' '), roles: roles,
    phone: '302-298-' + (1000 + h % 8999),
    email: name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ /g, '.') + '@cemex.com',
    account: AM_COMPANY.name,
    plants: allLoc ? ['All locations'] : [AM_PLANT_NAMES[h % 12], AM_PLANT_NAMES[(h + 5) % 12]],
    lastConn: 'Dec 4, 2025, 8:00 am', lastUpd: 'Dec 4, 2025, 8:17 am',
    created: 'May 22, 2024, 3:53 pm', status: (h % 9 === 0) ? 'Inactive' : 'Active'
  };
}

function amUserOpen(name) {
  amUserName = name;
  amUserTab = 'info';
  var host = document.getElementById('am-user-drawer');
  if (!host) return;
  host.style.display = 'flex';
  amUserRender();
}

function amUserClose() {
  var host = document.getElementById('am-user-drawer');
  if (!host) return;
  host.classList.add('am-out');
  setTimeout(function () { host.style.display = 'none'; host.classList.remove('am-out'); }, 220);
}

/* Tab switch swaps the body only; the drawer shell stays mounted. */
function amUserGoTab(t) {
  amUserTab = t;
  var body = document.getElementById('am-user-body');
  if (!body) { amUserRender(); return; }
  body.innerHTML = amUserBody();
  body.scrollTop = 0;
  var host = document.getElementById('am-user-drawer');
  if (host) {
    host.querySelectorAll('.am-dr-tabs .am-tab').forEach(function (el) {
      el.classList.toggle('on', el.dataset.tab === t);
    });
  }
}

function amFieldUpd(label, val) {
  return '<div class="am-add-field"><label class="am-flabel">' + label + '</label>'
    + '<div class="am-frow"><input class="am-input" value="' + amEsc(val) + '">'
    + '<button class="am-link">Update</button></div></div>';
}

/* A control that holds tags rather than a single value. */
function amTagField(label, tags, options, id) {
  var all = (options || tags).slice();
  tags.forEach(function (t) { if (all.indexOf(t) < 0) all.unshift(t); });
  return '<div class="am-add-field"><label class="am-flabel">' + label + '</label>'
    + vfDd({ id:id || ('am-dd-' + label.toLowerCase().replace(/\W+/g, '-')), options:all, value:tags, multi:true, tags:true, placeholder:'Select ' + label.toLowerCase() })
    + '</div>';
}

function amUserBody() {
  var u = amUserData(amUserName);
  if (amUserTab === 'info') {
    return '<div class="am-h2 am-add-h2">User Information</div>'
      + '<div class="am-usr-col">' + amFieldUpd('First Name', u.first) + amFieldUpd('Last name', u.last) + '</div>'
      + '<div class="am-h2 am-td-h2">Contact Information</div>'
      + '<div class="am-usr-col">' + amFieldUpd('Phone number', u.phone) + amFieldUpd('Email', u.email) + '</div>'
      + '<div class="am-h2 am-td-h2">Additional Information</div>'
      + '<div class="am-eq">'
        + [['Last connection Date', u.lastConn], ['Last Updated Date', u.lastUpd],
           ['Created Date', u.created], ['Status', u.status]].map(function (r) {
            return '<div class="am-eq-row"><span class="am-eq-k">' + r[0] + '</span>'
              + '<span class="am-eq-v">' + amEsc(r[1]) + '</span></div>';
          }).join('')
      + '</div>';
  }
  return '<div class="am-h2 am-add-h2">User Access</div>'
    + '<div class="am-add-grid">'
      + '<div class="am-add-field"><label class="am-flabel">Accounts</label>'
        + vfDd({ id:'am-dd-user-account', options:[u.account, 'Cemex NV', 'Cemex TX'], value:u.account, search:false }) + '</div>'
      + amTagField('Plant Access', u.plants, ['All locations'].concat(AM_PLANT_NAMES), 'am-dd-user-plants')
      + amTagField('Role', u.roles, AM_ROLE_OPTIONS, 'am-dd-user-roles')
    + '</div>';
}

function amUserRender() {
  var host = document.getElementById('am-user-drawer');
  if (!host || !amUserName) return;
  var u = amUserData(amUserName);
  host.innerHTML = '<div class="am-scrim" onclick="amUserClose()"></div>'
    + '<div class="am-drawer">'
      + '<div class="am-dr-head"><div>'
        + '<div class="am-dr-title">' + amEsc(u.name) + amTag(u.roles[0]) + '</div>'
        + '<div class="am-dr-sub">' + amEsc(u.account) + '</div>'
        + '<div class="am-dr-sub am-dim">Last connection: ' + u.lastConn + '</div>'
      + '</div><button class="am-dr-x" onclick="amUserClose()">&#215;</button></div>'
      + '<div class="am-tabs am-dr-tabs">'
        + '<button class="am-tab' + (amUserTab === 'info' ? ' on' : '') + '" data-tab="info" onclick="amUserGoTab(\'info\')">User Information</button>'
        + '<button class="am-tab' + (amUserTab === 'access' ? ' on' : '') + '" data-tab="access" onclick="amUserGoTab(\'access\')">User access</button>'
      + '</div>'
      + '<div class="am-dr-body" id="am-user-body">' + amUserBody() + '</div>'
    + '</div>';
}

/* ── New user ─────────────────────────────────────────────────────────────── */

function amAddUserOpen() {
  var host = document.getElementById('am-add-user');
  if (!host) return;
  host.style.display = 'flex';
  var sel = function (label, ph, opts, multi) {
    return '<div class="am-add-field"><label class="am-flabel">' + label + '</label>'
      + vfDd({ id:'am-dd-new-' + label.toLowerCase().replace(/\W+/g, '-'), options:opts, placeholder:ph, multi:!!multi, tags:!!multi }) + '</div>';
  };
  var txt = function (label, ph) {
    return '<div class="am-add-field"><label class="am-flabel">' + label + '</label>'
      + '<input class="am-input" placeholder="' + ph + '"></div>';
  };
  host.innerHTML = '<div class="am-scrim" onclick="amAddUserClose()"></div>'
    + '<div class="am-drawer">'
      + '<div class="am-dr-head"><div class="am-dr-title">New User</div>'
        + '<button class="am-dr-x" onclick="amAddUserClose()">&#215;</button></div>'
      + '<div class="am-dr-body">'
        + '<div class="am-h2 am-add-h2">User Information</div>'
        + '<div class="am-add-grid">'
          + txt('First Name', 'First name') + txt('Last Name', 'Last name')
          + txt('Preferred Name', 'Preferred name') + txt('Email', '@cemex.com')
          + '<div class="am-add-field"><label class="am-flabel">Phone</label>'
            + '<div class="am-phone"><span class="am-phone-flag">\u{1F1FA}\u{1F1F8}</span>'
            + '<input class="am-input am-phone-input" placeholder="(1) 302 298 1498"></div></div>'
        + '</div>'
        + '<div class="am-h2 am-td-h2">User Access</div>'
        + '<div class="am-add-grid">'
          + sel('Accounts', 'Accounts Access', [AM_COMPANY.name, 'Cemex NV', 'Cemex TX'])
          + sel('Plant Access', 'Plant Access', ['All locations'].concat(AM_PLANT_NAMES), true)
          + sel('Role', 'Choose Roles', AM_ROLE_OPTIONS, true)
        + '</div>'
      + '</div>'
      + '<div class="am-dr-foot">'
        + '<button class="am-pill am-foot-btn" onclick="amAddUserClose()">Cancel</button>'
        + '<button class="am-primary am-foot-btn" onclick="amAddUserSubmit()">Invite user</button>'
      + '</div>'
    + '</div>';
}

function amAddUserClose() {
  var host = document.getElementById('am-add-user');
  if (!host) return;
  host.classList.add('am-out');
  setTimeout(function () { host.style.display = 'none'; host.classList.remove('am-out'); }, 220);
}

function amAddUserSubmit() {
  var inputs = document.querySelectorAll('#am-add-user input.am-input');
  var first = inputs[0] && inputs[0].value.trim();
  amAddUserClose();
  amToast('Invitation sent' + (first ? ' to ' + first : ''));
}


/* ── Plant drawer ─────────────────────────────────────────────────────────────
   One drawer serves both paths: Add plant opens it empty, clicking a row opens
   it filled in and editable. Two tabs, Plant Information and Spill Limit.

   The geofence is real, not a picture. Hitting the polygon tool puts the map
   in trace mode: each click drops a vertex, clicking the first vertex again
   closes the shape. Hand-rolled on plain Leaflet rather than pulling in
   leaflet-draw, since the suite already loads Leaflet and nothing else here
   needs the rest of that plugin.

   Departures from the mocks:
     - Finish Setup is lime in the file. Blue in light, lime on dark, via
       --am-select. Cancel stays a quiet outline pill.
     - The pink plant tags are classification, not severity, so they are
       neutral tags.
     - "New {Company Name} Plant" is a placeholder in the file; it resolves to
       the actual account name, and an existing plant shows its own name.
   ========================================================================== */

var AM_TZ = ['US/Eastern','US/Central','US/Mountain','US/Pacific','US/Arizona','US/Hawaii'];
var AM_PLANT_TAGS = ['Valley','East Valley','West Valley','North','South','Tucson'];

var amPlantName = null;        /* null = creating a new plant */
var amPlantTab = 'info';
var amPlantMap = null;
var amGeo = { drawing:false, pts:[], layer:null, line:null, marks:[] };
var amSpill = {};              /* plant name -> [[loadSize, maxSlump], ...] */

function amPlantData(name) {
  var i = AM_PLANT_NAMES.indexOf(name);
  var h = amH('pl' + name);
  return {
    name: name,
    address: (i >= 0) ? AM_PLANT_ADDR[i] : '',
    tz: 'US/Arizona',
    code: 'BS-' + (1000 + h % 8999),
    tags: ['Valley', (h % 2) ? 'East Valley' : 'West Valley'],
    altMix: (h % 3 === 0), partial: (h % 4 === 0),
    lat: 33.48 + ((h % 60) - 30) / 300,
    lng: -112.02 + ((h % 47) - 23) / 300
  };
}

function amSpillRows(key) {
  if (!amSpill[key]) amSpill[key] = (key === '__new__') ? [] : [[2, 9.5], [4, 8], [6, 7], [8, 6], [10, 5]];
  return amSpill[key];
}
function amSpillKey() { return amPlantName || '__new__'; }

function amPlantNew() { amPlantOpenInner(null); }
function amPlantOpen(name) { amPlantOpenInner(name); }

function amPlantOpenInner(name) {
  amPlantName = name;
  amPlantTab = 'info';
  amGeo = { drawing:false, pts:[], layer:null, line:null, marks:[] };
  var host = document.getElementById('am-plant-drawer');
  if (!host) return;
  host.style.display = 'flex';
  amPlantRender();
}

function amPlantClose() {
  amGeoDestroy();
  var host = document.getElementById('am-plant-drawer');
  if (!host) return;
  host.classList.add('am-out');
  setTimeout(function () { host.style.display = 'none'; host.classList.remove('am-out'); }, 220);
}

function amPlantGoTab(t) {
  amPlantTab = t;
  var body = document.getElementById('am-plant-body');
  if (!body) { amPlantRender(); return; }
  if (t !== 'info') amGeoDestroy();
  body.innerHTML = amPlantBody();
  body.scrollTop = 0;
  var host = document.getElementById('am-plant-drawer');
  if (host) {
    host.querySelectorAll('.am-dr-tabs .am-tab').forEach(function (el) {
      el.classList.toggle('on', el.dataset.tab === t);
    });
  }
  if (t === 'info') amGeoInit();
}

/* ── Geofence ── */

function amGeoDestroy() {
  if (amPlantMap) { try { amPlantMap.remove(); } catch (e) {} }
  amPlantMap = null;
  amGeo.layer = null; amGeo.line = null; amGeo.marks = [];
}

function amGeoInit() {
  var el = document.getElementById('am-geo-map');
  if (!el) return;
  if (typeof L === 'undefined') { setTimeout(amGeoInit, 150); return; }
  amGeoDestroy();
  var p = amPlantName ? amPlantData(amPlantName) : { lat:33.48, lng:-112.02 };
  amPlantMap = L.map(el, { zoomControl:false, attributionControl:false, doubleClickZoom:false });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19 }).addTo(amPlantMap);
  amPlantMap.setView([p.lat, p.lng], 16);
  L.control.zoom({ position:'bottomright' }).addTo(amPlantMap);

  /* An existing plant arrives with a fence already traced. */
  if (amPlantName) {
    var d = 0.0016;
    amGeo.pts = [[p.lat + d, p.lng - d], [p.lat + d, p.lng + d], [p.lat - d, p.lng + d], [p.lat - d, p.lng - d]];
    amGeoDrawPolygon();
  }

  amPlantMap.on('click', function (e) {
    if (!amGeo.drawing) return;
    amGeo.pts.push([e.latlng.lat, e.latlng.lng]);
    amGeoDrawTrace();
  });
  setTimeout(function () { if (amPlantMap) amPlantMap.invalidateSize(); }, 120);
}

function amGeoClear() {
  amGeo.pts = [];
  amGeoWipe();
  amGeoStatus('Tap the polygon icon, then click points on the map to trace the outline of your plant. Close the shape to finish.');
}

function amGeoWipe() {
  if (!amPlantMap) return;
  if (amGeo.layer) { amPlantMap.removeLayer(amGeo.layer); amGeo.layer = null; }
  if (amGeo.line)  { amPlantMap.removeLayer(amGeo.line);  amGeo.line = null; }
  amGeo.marks.forEach(function (m) { amPlantMap.removeLayer(m); });
  amGeo.marks = [];
}

function amGeoDrawTrace() {
  if (!amPlantMap) return;
  amGeoWipe();
  amGeo.line = L.polyline(amGeo.pts, { color:'var(--blue)', weight:2.5, dashArray:'5 5' }).addTo(amPlantMap);
  amGeo.pts.forEach(function (pt, i) {
    var m = L.circleMarker(pt, { radius:5, color:'#1d3f8f', fillColor:'#ffffff', fillOpacity:1, weight:2 }).addTo(amPlantMap);
    if (i === 0) m.on('click', function (ev) { if (ev.originalEvent) ev.originalEvent.stopPropagation(); amGeoFinish(); });
    amGeo.marks.push(m);
  });
  amGeoStatus(amGeo.pts.length < 3
    ? 'Keep clicking to add points. ' + amGeo.pts.length + ' placed \u2014 three minimum.'
    : 'Click the first point to close the shape, or press Close shape.');
}

function amGeoDrawPolygon() {
  if (!amPlantMap || amGeo.pts.length < 3) return;
  amGeoWipe();
  amGeo.layer = L.polygon(amGeo.pts, {
    color:'#1d3f8f', weight:2.5, fillColor:'#3069e3', fillOpacity:0.22
  }).addTo(amPlantMap);
  amGeo.pts.forEach(function (pt) {
    amGeo.marks.push(L.circleMarker(pt, { radius:5, color:'#1d3f8f', fillColor:'#ffffff', fillOpacity:1, weight:2 }).addTo(amPlantMap));
  });
}

function amGeoFinish() {
  if (amGeo.pts.length < 3) { amGeoStatus('A fence needs at least three points.'); return; }
  amGeo.drawing = false;
  amGeoDrawPolygon();
  amGeoToolState();
  amGeoStatus('Geofence set with ' + amGeo.pts.length + ' points. Trace again to replace it.');
}

function amGeoToggle() {
  amGeo.drawing = !amGeo.drawing;
  if (amGeo.drawing) { amGeo.pts = []; amGeoWipe();
    amGeoStatus('Trace mode on. Click the map to drop points.'); }
  else { amGeoStatus('Trace mode off.'); }
  amGeoToolState();
}

function amGeoToolState() {
  var b = document.getElementById('am-geo-poly');
  if (b) b.classList.toggle('on', amGeo.drawing);
  var c = document.getElementById('am-geo-close');
  if (c) c.style.display = amGeo.drawing ? '' : 'none';
  var el = document.getElementById('am-geo-map');
  if (el) el.classList.toggle('am-geo-tracing', amGeo.drawing);
}

function amGeoStatus(msg) {
  var el = document.getElementById('am-geo-status');
  if (el) el.textContent = msg;
}

/* ── Spill limits ── */

function amSpillAdd() {
  var size = document.getElementById('am-sp-size');
  var slump = document.getElementById('am-sp-slump');
  var s = parseFloat(size && size.value), m = parseFloat(slump && slump.value);
  if (!(s > 0) || !(m >= 0)) { amToast('Enter a load size and a max slump'); return; }
  var rows = amSpillRows(amSpillKey());
  var at = -1;
  rows.forEach(function (r, i) { if (r[0] === s) at = i; });
  if (at >= 0) rows[at][1] = m; else rows.push([s, m]);
  rows.sort(function (a, b) { return a[0] - b[0]; });
  if (size) size.value = ''; if (slump) slump.value = '';
  amSpillRefresh();
}

function amSpillClearInputs() {
  ['am-sp-size','am-sp-slump'].forEach(function (id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
}

function amSpillRemove(i) {
  amSpillRows(amSpillKey()).splice(i, 1);
  amSpillRefresh();
}

function amSpillRefresh() {
  var host = document.getElementById('am-spill-live');
  if (host) host.innerHTML = amSpillTableHtml() + amSpillChartHtml();
}

function amSpillTableHtml() {
  var rows = amSpillRows(amSpillKey());
  if (!rows.length) return '<div class="am-sp-empty">No limits set yet. Add a load size and its max slump above.</div>';
  return '<div class="am-sp-table">'
    + '<div class="am-sp-tr am-sp-th"><span>Load Size</span><span>Max Slump</span><span>Action</span></div>'
    + rows.map(function (r, i) {
        return '<div class="am-sp-tr"><span>' + r[0] + '</span><span>' + r[1] + '</span>'
          + '<span><button class="am-link" onclick="amSpillRemove(' + i + ')">Remove</button></span></div>';
      }).join('') + '</div>';
}

/* Line chart drawn from the entered rows. Two points minimum, otherwise
   there is no line to draw and the panel says so. */
function amSpillChartHtml() {
  var rows = amSpillRows(amSpillKey());
  if (rows.length < 2) return '';
  var W = 700, H = 260, PAD = { t:14, r:16, b:34, l:44 };
  var cW = W - PAD.l - PAD.r, cH = H - PAD.t - PAD.b;
  var xs = rows.map(function (r) { return r[0]; });
  var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
  if (maxX === minX) maxX = minX + 1;
  var maxY = 20;
  var toX = function (v) { return PAD.l + ((v - minX) / (maxX - minX)) * cW; };
  var toY = function (v) { return PAD.t + cH - (v / maxY) * cH; };
  var grid = [0, 5, 10, 15, 20].map(function (v) {
    var y = toY(v).toFixed(1);
    return '<line x1="' + PAD.l + '" y1="' + y + '" x2="' + (PAD.l + cW) + '" y2="' + y + '" stroke="var(--border)"/>'
      + '<text x="' + (PAD.l - 8) + '" y="' + (parseFloat(y) + 4) + '" text-anchor="end" class="db-svg-lbl">' + v + '</text>';
  }).join('');
  var path = rows.map(function (r, i) {
    return (i ? 'L' : 'M') + toX(r[0]).toFixed(1) + ',' + toY(r[1]).toFixed(1);
  }).join(' ');
  var dots = rows.map(function (r) {
    return '<circle cx="' + toX(r[0]).toFixed(1) + '" cy="' + toY(r[1]).toFixed(1) + '" r="3.5" fill="var(--blue)"/>';
  }).join('');
  var xl = rows.map(function (r) {
    return '<text x="' + toX(r[0]).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" class="db-svg-lbl">'
      + r[0].toFixed(1) + '</text>';
  }).join('');
  return '<div class="am-sp-chart"><div class="am-sp-chart-t">Max Slump</div>'
    + '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" class="db-svg">'
    + grid + '<path d="' + path + '" stroke="var(--blue)" stroke-width="2.5" fill="none" stroke-linejoin="round"/>'
    + dots + xl + '</svg></div>';
}

/* ── Body + shell ── */

function amPlantBody() {
  var isNew = !amPlantName;
  var p = isNew
    ? { name:'', address:'', tz:'', code:'', tags:[], altMix:false, partial:false }
    : amPlantData(amPlantName);

  if (amPlantTab === 'info') {
    return '<div class="am-h2 am-add-h2">Plant Information</div>'
      + '<div class="am-add-grid">'
        + '<div class="am-add-field"><label class="am-flabel">Name</label>'
          + '<input class="am-input" placeholder="Enter plant name" value="' + amEsc(p.name) + '"></div>'
        + '<div class="am-add-field"><label class="am-flabel">Batch System code</label>'
          + '<input class="am-input" placeholder="Example: BS-1042" value="' + amEsc(p.code) + '"></div>'
        + '<div class="am-add-field"><label class="am-flabel">Address</label>'
          + '<input class="am-input" placeholder="Plant street address" value="' + amEsc(p.address) + '"></div>'
        + '<div class="am-add-field"><label class="am-flabel">Time zone</label>'
          + vfDd({ id:'am-dd-plant-tz', options:AM_TZ, value:p.tz || null, placeholder:'Select time zone', search:false }) + '</div>'
        + amTagField('Plant Tags', p.tags, AM_PLANT_TAGS, 'am-dd-plant-tags')
        + '<div class="am-add-field am-checks">'
          + '<label class="am-check-row"><input type="checkbox"' + (p.altMix ? ' checked' : '')
            + '><span class="am-check-box"></span><span>Use alternative Mix code Command batch</span></label>'
          + '<label class="am-check-row"><input type="checkbox"' + (p.partial ? ' checked' : '')
            + '><span class="am-check-box"></span><span>Send Partial Tickets</span></label>'
        + '</div>'
      + '</div>'
      + '<div class="am-h2 am-td-h2">Create Your Geofence</div>'
      + '<div class="am-geo-help" id="am-geo-status">Tap the polygon icon, then click points on the map to trace the outline of your plant. Close the shape to finish.</div>'
      + '<div class="am-geo-wrap"><div id="am-geo-map" class="am-geo-map"></div>'
        + '<div class="am-geo-tools">'
          + '<button class="am-geo-btn" id="am-geo-poly" onclick="amGeoToggle()" title="Trace a polygon">'
            + '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2 14 6.5 11.5 13.5h-7L2 6.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg></button>'
          + '<button class="am-geo-btn" id="am-geo-close" onclick="amGeoFinish()" style="display:none;" title="Close the shape">'
            + '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
          + '<button class="am-geo-btn" onclick="amGeoClear()" title="Clear the fence">'
            + '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>'
        + '</div></div>';
  }

  /* Spill Limit */
  return '<div class="am-h2 am-add-h2">Plant Details</div>'
    + '<div class="am-geo-help">This spill limit profile applies to all trucks at this location unless a different profile is assigned to a specific truck.</div>'
    + '<div class="am-add-field am-sp-narrow"><label class="am-flabel">Max Load Size (yd\u00b3)</label>'
      + '<input class="am-input" placeholder="Enter 1\u201320"></div>'
    + '<div class="am-h2 am-td-h2">Spill Limits by Load Size</div>'
    + '<div class="am-geo-help">Set the highest slump allowed for each load size. Bigger loads should have a lower slump.</div>'
    + '<div class="am-add-grid">'
      + '<div class="am-add-field"><label class="am-flabel">Load Size</label>'
        + '<input class="am-input" id="am-sp-size" type="number" min="1" max="20" placeholder="Enter 1\u201320"></div>'
      + '<div class="am-add-field"><label class="am-flabel">Max. Slump (in)</label>'
        + '<input class="am-input" id="am-sp-slump" type="number" min="0" max="10" step="0.5" placeholder="0\u201310 in"></div>'
    + '</div>'
    + '<div class="am-sp-actions"><button class="am-pill" onclick="amSpillAdd()">Add</button>'
      + '<button class="am-pill" onclick="amSpillClearInputs()">Clear</button></div>'
    + '<div id="am-spill-live">' + amSpillTableHtml() + amSpillChartHtml() + '</div>';
}

function amPlantRender() {
  var host = document.getElementById('am-plant-drawer');
  if (!host) return;
  var isNew = !amPlantName;
  var title = isNew ? 'New ' + AM_COMPANY.name + ' Plant' : amEsc(amPlantName);
  var tagHtml = isNew ? '' : amTag(amPlantData(amPlantName).tags[0]);
  host.innerHTML = '<div class="am-scrim" onclick="amPlantClose()"></div>'
    + '<div class="am-drawer">'
      + '<div class="am-dr-head"><div>'
        + '<div class="am-dr-title">' + title + tagHtml + '</div>'
        + (isNew ? '' : '<div class="am-dr-sub">' + amEsc(AM_COMPANY.name) + '</div>')
      + '</div><button class="am-dr-x" onclick="amPlantClose()">&#215;</button></div>'
      + '<div class="am-tabs am-dr-tabs">'
        + '<button class="am-tab' + (amPlantTab === 'info' ? ' on' : '') + '" data-tab="info" onclick="amPlantGoTab(\'info\')">Plant Information</button>'
        + '<button class="am-tab' + (amPlantTab === 'spill' ? ' on' : '') + '" data-tab="spill" onclick="amPlantGoTab(\'spill\')">Spill Limit</button>'
      + '</div>'
      + '<div class="am-dr-body" id="am-plant-body">' + amPlantBody() + '</div>'
      + '<div class="am-dr-foot">'
        + '<button class="am-pill am-foot-btn" onclick="amPlantClose()">Cancel</button>'
        + '<button class="am-primary am-foot-btn" onclick="amPlantSubmit()">' + (isNew ? 'Finish Setup' : 'Save changes') + '</button>'
      + '</div>'
    + '</div>';
  if (amPlantTab === 'info') amGeoInit();
}

function amPlantSubmit() {
  var isNew = !amPlantName;
  var name = amPlantName;
  var fence = amGeo.pts.length >= 3 ? ' with a ' + amGeo.pts.length + '-point geofence' : '';
  amPlantClose();
  amToast(isNew ? 'Plant created' + fence : name + ' updated' + fence);
}


/* ── Role drawer ──────────────────────────────────────────────────────────────
   Add role opens Create Role empty; clicking a row opens that role with its
   name, description, and permission grid filled in and editable.

   The grid is a live matrix: four access levels per capability, grouped by
   area. Search filters rows as you type and Sort flips the row order, both
   without rebuilding the drawer. Group headers select or clear a whole column
   for that area, which is the part that makes a twenty-row matrix usable.

   Departures from the mock: Create Role is lime in the file, so it renders
   blue in light and lime on dark via --am-select; Cancel stays a quiet pill.
   ========================================================================== */

var AM_PERM_LEVELS = ['Menu', 'Viewer', 'Admin', 'Cross'];

var AM_PERM_GROUPS = [
  { group:'Trucks', caps:['Chat with drivers','Driver Management','Truck Settings','Trucks Management',
      'Route Optimization','Fuel Tracking','Maintenance Scheduling','Load Assignment','Driver Performance',
      'Compliance Monitoring','Incident Reporting','GPS Tracking','Dashboard Analytics'] },
  { group:'Customer Accounts', caps:['Contractors management','Account management','Billing and Invoicing',
      'Inventory Tracking'] },
  { group:'Plants', caps:['Plant management','Batch system settings','Spill limits','Geofences'] },
  { group:'Tickets', caps:['Ticket list','Manual control','Water adds','Returned concrete'] }
];

var amRoleName = null;         /* null = creating */
var amRoleQuery = '';
var amRoleSortAsc = true;
var amRolePerms = {};          /* "group|cap|level" -> true */

function amRoleKey(g, c, l) { return g + '|' + c + '|' + l; }

/* An existing role arrives with a plausible grid rather than an empty one. */
function amRoleSeed(name) {
  amRolePerms = {};
  if (!name) return;
  AM_PERM_GROUPS.forEach(function (grp) {
    grp.caps.forEach(function (cap) {
      var h = amH(name + grp.group + cap);
      AM_PERM_LEVELS.forEach(function (lvl, li) {
        var on = (li === 0 && h % 3 !== 0) || (li === 1 && h % 4 !== 0) || (li === 2 && h % 7 === 0) || (li === 3 && h % 11 === 0);
        if (on) amRolePerms[amRoleKey(grp.group, cap, lvl)] = true;
      });
    });
  });
}

function amRoleNew() { amRoleOpenInner(null); }
function amRoleOpen(name) { amRoleOpenInner(name); }

function amRoleOpenInner(name) {
  amRoleName = name;
  amRoleQuery = '';
  amRoleSortAsc = true;
  amRoleSeed(name);
  var host = document.getElementById('am-role-drawer');
  if (!host) return;
  host.style.display = 'flex';
  amRoleRender();
}

function amRoleClose() {
  var host = document.getElementById('am-role-drawer');
  if (!host) return;
  host.classList.add('am-out');
  setTimeout(function () { host.style.display = 'none'; host.classList.remove('am-out'); }, 220);
}

function amRoleTogglePerm(g, c, l, el) {
  var k = amRoleKey(g, c, l);
  if (amRolePerms[k]) delete amRolePerms[k]; else amRolePerms[k] = true;
  if (el) el.classList.toggle('on', !!amRolePerms[k]);
}

/* Group header cell selects or clears that level across the whole area. */
function amRoleToggleCol(gi, l) {
  var grp = AM_PERM_GROUPS[gi];
  if (!grp) return;
  var allOn = grp.caps.every(function (c) { return amRolePerms[amRoleKey(grp.group, c, l)]; });
  grp.caps.forEach(function (c) {
    var k = amRoleKey(grp.group, c, l);
    if (allOn) delete amRolePerms[k]; else amRolePerms[k] = true;
  });
  amRoleGridRefresh();
}

function amRoleSearch(v) { amRoleQuery = (v || '').toLowerCase(); amRoleGridRefresh(); }
function amRoleSort() { amRoleSortAsc = !amRoleSortAsc; amRoleGridRefresh(); }

function amRoleGridRefresh() {
  var host = document.getElementById('am-role-grid');
  if (host) host.innerHTML = amRoleGridHtml();
  var s = document.getElementById('am-role-sort-lbl');
  if (s) s.textContent = amRoleSortAsc ? 'Sort' : 'Sort Z\u2013A';
}

function amRoleGridHtml() {
  var out = '';
  var any = false;
  AM_PERM_GROUPS.forEach(function (grp, gi) {
    var caps = grp.caps.filter(function (c) {
      return !amRoleQuery || c.toLowerCase().indexOf(amRoleQuery) >= 0
        || grp.group.toLowerCase().indexOf(amRoleQuery) >= 0;
    });
    if (!caps.length) return;
    any = true;
    caps = caps.slice().sort(function (a, b) {
      return amRoleSortAsc ? a.localeCompare(b) : b.localeCompare(a);
    });
    out += '<div class="am-pm-row am-pm-grp"><span class="am-pm-name">' + grp.group + '</span>'
      + AM_PERM_LEVELS.map(function (l) {
          var allOn = grp.caps.every(function (c) { return amRolePerms[amRoleKey(grp.group, c, l)]; });
          return '<span class="am-pm-cell"><button class="am-pm-lvl' + (allOn ? ' on' : '') + '"'
            + ' onclick="amRoleToggleCol(' + gi + ',\'' + l + '\')" title="Toggle ' + l + ' for all of ' + grp.group + '">'
            + l + '</button></span>';
        }).join('') + '</div>';
    caps.forEach(function (cap) {
      out += '<div class="am-pm-row"><span class="am-pm-name am-pm-cap">' + amEsc(cap) + '</span>'
        + AM_PERM_LEVELS.map(function (l) {
            var on = !!amRolePerms[amRoleKey(grp.group, cap, l)];
            return '<span class="am-pm-cell"><button class="am-pm-box' + (on ? ' on' : '') + '"'
              + ' onclick="amRoleTogglePerm(\'' + grp.group + '\',\'' + cap.replace(/'/g, "\\'") + '\',\'' + l + '\',this)"'
              + ' aria-label="' + amEsc(cap) + ' ' + l + '"></button></span>';
          }).join('') + '</div>';
    });
  });
  if (!any) out = '<div class="am-sp-empty">No permissions match that search.</div>';
  return out;
}

function amRoleRender() {
  var host = document.getElementById('am-role-drawer');
  if (!host) return;
  var isNew = !amRoleName;
  var seed = null;
  if (!isNew) {
    AM_ROLES.forEach(function (r) { if (r[0] === amRoleName) seed = r; });
  }
  host.innerHTML = '<div class="am-scrim" onclick="amRoleClose()"></div>'
    + '<div class="am-drawer">'
      + '<div class="am-dr-head"><div class="am-dr-title">' + (isNew ? 'Create Role' : amEsc(amRoleName)) + '</div>'
        + '<button class="am-dr-x" onclick="amRoleClose()">&#215;</button></div>'
      + '<div class="am-dr-body">'
        + '<div class="am-h2 am-add-h2">Information</div>'
        + '<div class="am-add-field"><label class="am-flabel">Name</label>'
          + '<input class="am-input" placeholder="Name this Role" value="' + amEsc(isNew ? '' : amRoleName) + '"></div>'
        + '<div class="am-add-field am-rl-desc"><label class="am-flabel">Description</label>'
          + '<textarea class="am-input am-textarea" placeholder="Add a short summary for this role">'
          + amEsc(seed ? seed[1] : '') + '</textarea></div>'
        + '<div class="am-pm-head"><div class="am-h2 am-h2-flush">Permission</div>'
          + '<div class="am-pm-tools">'
            + '<div class="am-search"><span>' + amIconSearch() + '</span>'
              + '<input placeholder="Search permissions" oninput="amRoleSearch(this.value)"></div>'
            + '<button class="am-pill" onclick="amRoleSort()">' + amIconFilter()
              + ' <span id="am-role-sort-lbl">Sort</span></button>'
          + '</div></div>'
        + '<div class="am-pm-grid" id="am-role-grid">' + amRoleGridHtml() + '</div>'
      + '</div>'
      + '<div class="am-dr-foot">'
        + '<button class="am-pill am-foot-btn" onclick="amRoleClose()">Cancel</button>'
        + '<button class="am-primary am-foot-btn" onclick="amRoleSubmit()">'
          + (isNew ? 'Create Role' : 'Save changes') + '</button>'
      + '</div>'
    + '</div>';
}

function amRoleSubmit() {
  var isNew = !amRoleName;
  var input = document.querySelector('#am-role-drawer input.am-input');
  var name = (input && input.value.trim()) || amRoleName || 'Role';
  var n = Object.keys(amRolePerms).length;
  amRoleClose();
  amToast(isNew ? name + ' created with ' + n + ' permissions' : name + ' updated \u2014 ' + n + ' permissions');
}
