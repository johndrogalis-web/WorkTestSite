/* app-06-desktop-core.js — Desktop core (dt), view switching, init. Loads 6th (last).
   Part of the app.js split. All six app-*.js files share one global
   scope and MUST load in numeric order (see index.html). */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const ud = document.getElementById('dt-ud-drawer');
  if (!ud || !ud.classList.contains('open')) return;
  const confirm = ud.querySelector('.dt-attach-confirm');
  if (confirm) { confirm.remove(); return; }
  dtUdClose();
});

function dtSelectTab(tab, el) {
  dtActiveTab = tab;
  document.querySelectorAll('.dt-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  /* Territory selector is a Where to Start affordance only — it lets the FST
     scan trucks across all their accounts at once. On Overview and Components
     Condition we scope strictly to the master active account, so the selector
     is hidden. */
  const dtTerritory = document.getElementById('dt-territory');
  if (dtTerritory) dtTerritory.style.display = (tab === 'wts') ? '' : 'none';
  const ccKey = document.getElementById('dt-cc-key');
  if (ccKey) ccKey.style.display = (tab === 'cc') ? '' : 'none';
  dtBuildHeaders(tab);
  if (tab === 'overview') dtRenderOverview();
  else if (tab === 'cc')  dtRenderCC();
  else                    dtRenderTable();
}

/* ══════════════════════════════════════════════════════════
   COLUMN MANAGEMENT — resize, reorder, hide/show
   Shared across WTS, Overview, CC tabs
══════════════════════════════════════════════════════════ */

/* Column definitions per tab */
const COL_DEFS = {
  wts: [
    { id:'truck',    label:'Truck',           width:80,  locked:true },
    { id:'source',   label:'Source',          width:90  },
    { id:'alerts',   label:'Active Alerts',   width:120 },
    { id:'swcomp',   label:'SW Compliant',    width:130 },
    { id:'age',      label:'Created',         width:100 },
    { id:'ignition', label:'Ignition',        width:90  },
    { id:'version',  label:'TCG Version',     width:120 },
    { id:'impact',   label:'Impact',          width:130 },
    { id:'plant',    label:'Plant',           width:130 },
    { id:'account',  label:'Account',         width:110 },
    { id:'conn',     label:'Connection',      width:100 },
    { id:'lastconn', label:'Last Connection', width:160 },
  ],
  overview: [
    { id:'truck',    label:'Truck',           width:80,  locked:true },
    { id:'alerts',   label:'Active Alerts',   width:120 },
    { id:'unitid',   label:'Unit ID',         width:155 },
    { id:'sysver',   label:'TCG Version',      width:120 },
    { id:'ignition', label:'Ignition',        width:120 },
    { id:'impact',   label:'Impact',          width:130 },
    { id:'plant',    label:'Plant',           width:130 },
    { id:'account',  label:'Account',         width:110 },
    { id:'conn',     label:'Connection',      width:100 },
    { id:'lastconn', label:'Last Connection', width:160 },
  ],
  cc: [
    { id:'truck',    label:'Truck',           width:78,  locked:true },
    { id:'sysver',   label:'TCG Version',     width:110 },
    { id:'ignition', label:'Ign. status',     width:110 },
    { id:'startups', label:'Startups',        width:90  },
    { id:'buspower', label:'Bus power',       width:90,  dot:true },
    { id:'iox',      label:'Iox/Roboteq',     width:100, dot:true },
    { id:'charge',   label:'Charge',          width:100, dot:true },
    { id:'discharge',label:'Discharge',       width:100, dot:true },
    { id:'drum',     label:'Drum',            width:90,  dot:true },
    { id:'intdisp',  label:'Int. Display',    width:100, dot:true },
    { id:'extdisp',  label:'Ext. Display',    width:100, dot:true },
    { id:'cwr',      label:'CWR',             width:70,  dot:true },
    { id:'wds',      label:'WDS',             width:70,  dot:true },
  ],
  units: [
    { id:'unitid',     label:'Unit ID',               width:120, locked:true },
    { id:'status',     label:'Unit Status',           width:170 },
    { id:'truck',      label:'Assigned Truck',        width:130 },
    { id:'tgw',        label:'TCG ID',                width:150 },
    { id:'contract',   label:'Contract',              width:120 },
    { id:'sysType',    label:'System Type',           width:160 },
    { id:'config',     label:'Configuration',         width:220 },
    { id:'firstComm',  label:'First Commission Date', width:180 },
  ],
};

/* Runtime state — cloned from COL_DEFS on first use */
let colState = { wts: null, overview: null, cc: null, units: null };
let colDragSrc = null;
let colResizing = null;

function getColState(tab) {
  if (!colState[tab]) {
    colState[tab] = COL_DEFS[tab].map(c => ({ ...c, hidden: false }));
  }
  return colState[tab];
}

function visibleCols(tab) {
  return getColState(tab).filter(c => !c.hidden);
}

/* ── Render header row with resize + drag + menu ── */
/* ── Sort state ── */
let dtSortState = { tab: null, col: null, dir: 0 }; // dir: 0=none, 1=asc, -1=desc

function dtSortArrow(colId, tab) {
  const active = dtSortState.tab === tab && dtSortState.col === colId && dtSortState.dir !== 0;
  const rot = dtSortState.dir === -1 ? 'rotate(180deg)' : 'rotate(0deg)';
  const op  = active ? '0.7' : '0.18';
  const sty = active ? `opacity:${op};transform:${rot};transition:transform 0.15s;` : `opacity:${op};`;
  return `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="flex-shrink:0;${sty}"><path d="M5 2v6M2 5l3-3 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function dtSortBy(colId, tab) {
  if (dtSortState.tab === tab && dtSortState.col === colId) {
    dtSortState.dir = dtSortState.dir === 1 ? -1 : dtSortState.dir === -1 ? 0 : 1;
  } else {
    dtSortState = { tab, col: colId, dir: 1 };
  }
  dtRefreshTable(tab);
}

function dtSortTrucks(arr, tab) {
  if (!dtSortState.col || dtSortState.tab !== tab || dtSortState.dir === 0) return arr;
  const col = dtSortState.col;
  const dir = dtSortState.dir;
  const val = t => {
    if (col === 'truck')    return String(t.num);
    if (col === 'alerts')   return (t.err || 0) + (t.wrn || 0);
    if (col === 'swcomp')   return t.swCompliant === false ? 1 : 0;
    if (col === 'age')      return t.age || '';
    if (col === 'ignition') return t.ign === 'On' ? 0 : 1;
    if (col === 'version' || col === 'sysver') return t.ver || '';
    if (col === 'source')   return t.source || '';
    if (col === 'impact')   return t.impact || '';
    if (col === 'plant')    return t.plant || '';
    if (col === 'account')  return t.account || '';
    if (col === 'conn')     return t.conn === 'live' ? 0 : 1;
    if (col === 'lastconn') return t.lastConn || '';
    if (col === 'maint')    return t.readyMaint || '';
    if (col === 'unitid')   return t.unitId || '';
    return '';
  };
  return [...arr].sort((a, b) => {
    const av = val(a), bv = val(b);
    if (typeof av === 'number' && typeof bv === 'number') return dir * (av - bv);
    return dir * String(av).localeCompare(String(bv));
  });
}

function dtBuildHeaders(tab) {
  const cols = visibleCols(tab);
  const ths = cols.map((col, i) => {
    const locked = col.locked ? 'data-locked="1"' : '';
    const dotClass = col.dot ? ' dt-th--dot' : '';
    return `
      <th class="dt-th${dotClass}" style="width:${col.width}px;min-width:${col.width}px;max-width:${col.width}px;"
          data-col="${col.id}" data-tab="${tab}" data-idx="${i}" ${locked}
          draggable="${col.locked ? 'false' : 'true'}"
          ondragstart="dtColDragStart(event)"
          ondragover="dtColDragOver(event)"
          ondrop="dtColDrop(event)"
          ondragend="dtColDragEnd(event)">
        <div class="dt-th-inner">
          <span class="dt-th-label" onclick="dtSortBy('${col.id}','${tab}')" style="cursor:pointer;display:flex;align-items:center;gap:4px;user-select:none;">
            ${col.label} ${dtSortArrow(col.id, tab)}
          </span>
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
  document.getElementById('dt-thead').innerHTML = `<tr>${ths}</tr>`;
}

/* ── Column menu ── */
let openColMenu = null;
function dtColMenuOpen(e, colId, tab) {
  e.stopPropagation();
  if (openColMenu && openColMenu !== colId) {
    const prev = document.getElementById('dt-th-menu-' + openColMenu);
    if (prev) prev.classList.remove('open');
  }
  const menu = document.getElementById('dt-th-menu-' + colId);
  if (!menu) return;
  const isOpen = menu.classList.contains('open');
  menu.classList.toggle('open', !isOpen);
  openColMenu = isOpen ? null : colId;
}
document.addEventListener('click', () => {
  if (openColMenu) {
    const m = document.getElementById('dt-th-menu-' + openColMenu);
    if (m) m.classList.remove('open');
    openColMenu = null;
  }
  /* Also close cols popover */
  const pop = document.getElementById('dt-cols-popover');
  if (pop && pop.classList.contains('open')) pop.classList.remove('open');
});

/* ── Hide column ── */
function dtColHide(colId, tab) {
  const col = getColState(tab).find(c => c.id === colId);
  if (col) col.hidden = true;
  dtRefreshTable(tab);
  dtColsPopRefresh(tab);
  if (openColMenu) {
    const m = document.getElementById('dt-th-menu-' + openColMenu);
    if (m) m.classList.remove('open');
    openColMenu = null;
  }
}

/* ── Drag to reorder ── */
function dtColDragStart(e) {
  const th = e.currentTarget;
  if (th.dataset.locked) { e.preventDefault(); return; }
  colDragSrc = { colId: th.dataset.col, tab: th.dataset.tab };
  th.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function dtColDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const th = e.currentTarget;
  if (th.dataset.locked) return;
  document.querySelectorAll('.dt-th.drag-over').forEach(el => el.classList.remove('drag-over'));
  th.classList.add('drag-over');
}
function dtColDrop(e) {
  e.preventDefault();
  const th = e.currentTarget;
  if (!colDragSrc || th.dataset.col === colDragSrc.colId) return;
  const tab = colDragSrc.tab;
  const cols = getColState(tab);
  const srcIdx = cols.findIndex(c => c.id === colDragSrc.colId);
  const dstIdx = cols.findIndex(c => c.id === th.dataset.col);
  if (srcIdx === -1 || dstIdx === -1) return;
  /* Don't drop before locked Truck column */
  if (dstIdx === 0) return;
  const [moved] = cols.splice(srcIdx, 1);
  cols.splice(dstIdx, 0, moved);
  dtRefreshTable(tab);
}
function dtColDragEnd(e) {
  document.querySelectorAll('.dt-th').forEach(el => {
    el.classList.remove('dragging', 'drag-over');
  });
  colDragSrc = null;
}

/* ── Resize ── */
function dtResizeStart(e, colId, tab) {
  e.preventDefault();
  e.stopPropagation();
  const startX = e.clientX;
  const col = getColState(tab).find(c => c.id === colId);
  const startW = col.width;
  const handle = e.currentTarget;
  handle.classList.add('resizing');

  function onMove(ev) {
    const delta = ev.clientX - startX;
    col.width = Math.max(50, startW + delta);
    /* Update the th width live */
    const th = document.querySelector(`.dt-th[data-col="${colId}"]`);
    if (th) {
      th.style.width = col.width + 'px';
      th.style.minWidth = col.width + 'px';
      th.style.maxWidth = col.width + 'px';
    }
  }
  function onUp() {
    handle.classList.remove('resizing');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

/* Tracks which tab the cols popover is currently displaying.
   Trucks pages set this to dtActiveTab; Units page sets it to 'units'. */
let dtColsCurrentTab = null;

/* ── Columns popover ── */
function dtColsToggle(e, forTab) {
  e.stopPropagation();
  const pop = document.getElementById('dt-cols-popover');
  const isOpen = pop.classList.contains('open');
  pop.classList.toggle('open', !isOpen);
  if (!isOpen) {
    dtColsCurrentTab = forTab || dtActiveTab;
    // Position popover relative to the button that opened it
    const btn = e.currentTarget;
    if (btn) {
      const wrap = pop.parentElement;
      // If popover is in a different position context, move it next to the trigger
      if (wrap && !wrap.contains(btn)) {
        btn.parentElement.appendChild(pop);
      }
    }
    dtColsPopRefresh(dtColsCurrentTab);
  }
}
function dtColsPopRefresh(tab) {
  const list = document.getElementById('dt-cols-pop-list');
  if (!list) return;
  const cols = getColState(tab);
  list.innerHTML = cols.map(col => `
    <div class="dt-cols-pop-row">
      <button class="dt-cols-toggle ${col.hidden ? '' : 'on'}"
        onclick="dtColToggle('${col.id}','${tab}',this)"
        ${col.locked ? 'disabled style="opacity:0.4;cursor:default;"' : ''}></button>
      <span class="dt-cols-pop-label ${col.hidden ? 'hidden' : ''}">${col.label}</span>
    </div>`).join('');
}
function dtColToggle(colId, tab, btn) {
  const col = getColState(tab).find(c => c.id === colId);
  if (!col || col.locked) return;
  col.hidden = !col.hidden;
  btn.classList.toggle('on', !col.hidden);
  btn.nextElementSibling.classList.toggle('hidden', col.hidden);
  dtRefreshTable(tab);
}
function dtColsReset() {
  const tab = dtColsCurrentTab || dtActiveTab;
  colState[tab] = COL_DEFS[tab].map(c => ({ ...c, hidden: false }));
  dtColsPopRefresh(tab);
  dtRefreshTable(tab);
}

/* ── Central refresh — rebuilds headers + rows for active tab ── */
function dtRefreshTable(tab) {
  if (tab === 'units') {
    dtUnitsBuildHeaders();
    dtUnitsRender();
    return;
  }
  dtBuildHeaders(tab);
  if (tab === 'wts')           dtRenderTable();
  else if (tab === 'overview') dtRenderOverview();
  else if (tab === 'cc')       dtRenderCC();
}


function dtCCDot(state) {
  const colors = { clean:'#16a34a', warn:'#ffba0d', alarm:'#d70100', grey:'rgba(54,50,45,0.25)' };
  const c = colors[state] || colors.grey;
  if (state === 'alarm') {
    return `<svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2.5 2.5l9 9M11.5 2.5l-9 9" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  }
  return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};flex-shrink:0;"></span>`;
}

function dtRenderCC() {
  const tbody = document.getElementById('dt-tbody');
  if (!tbody) return;
  const cols = visibleCols('cc');
  const ncols = cols.length;

  /* Map col.id to component name in CC_TRUCKS */
  const compMap = { buspower:'Bus Power', iox:'Iox/Robotex', charge:'Charge',
    discharge:'Discharge', drum:'Drum', intdisp:'Int. Display',
    extdisp:'Ext. Display', cwr:'CWR', wds:'WDS' };

  function ccCell(col, t, cc) {
    const c = col.id;
    const dim = '<span style="color:var(--soft)">--</span>';
    if (c === 'truck')    return `<td class="dt-td dt-td-strong">${t.num}</td>`;
    if (c === 'sysver')   return `<td class="dt-td">${t.unlinked ? dim : dtVerPill(t.ver)}</td>`;
    if (c === 'ignition') return `<td class="dt-td">${t.unlinked ? dim : t.ign}</td>`;
    if (c === 'startups') return `<td class="dt-td dt-td-soft">—</td>`;
    if (compMap[c]) {
      // Unlinked trucks have no unit reporting component states — show grey dots
      const state = t.unlinked ? 'grey' : (cc ? (cc.components.find(cp => cp.name === compMap[c])?.state || 'grey') : 'grey');
      return `<td class="dt-td dt-td--dot"><div>${dtCCDot(state)}</div></td>`;
    }
    return `<td class="dt-td">—</td>`;
  }

  let allTrucks = [];
  truckGroups.forEach(group => {
    /* Components Condition is scoped to the master active account — the
       territory selector is a Where to Start affordance only. */
    if (group.account !== activeAccount) return;
    // Include unlinked trucks. They'll render with grey dots across all
    // component columns since there's no unit reporting state for them.
    group.trucks.forEach(t => {
      if (dtTruckMatchesSearch(t) && filterMatch(t)) {
        const cc = CC_TRUCKS.find(c => c.num === t.num);
        allTrucks.push({ t, cc });
      }
    });
  });

  if (allTrucks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${ncols}" style="padding:40px;text-align:center;color:var(--soft);font-size:14px;">No trucks in ${activeAccount}.</td></tr>`;
    return;
  }

  let rows = '';
  /* Sort: errors first, then warnings, then healthy/offline */
  allTrucks.sort((a, b) => {
    const rank = t => t.err > 0 ? 0 : t.wrn > 0 ? 1 : 2;
    return rank(a.t) - rank(b.t);
  });
  /* Apply column sort on top of severity sort if active */
  if (dtSortState.tab === 'cc' && dtSortState.col && dtSortState.dir !== 0) {
    const sorted = dtSortTrucks(allTrucks.map(x => x.t), 'cc');
    allTrucks = sorted.map(t => allTrucks.find(x => x.t === t));
  }
  allTrucks.forEach(({ t, cc }, idx) => {
    const alt = idx % 2 === 1;
    rows += `<tr class="dt-tr${alt ? ' alt' : ''}" data-truck="${t.num}" onclick="dtOpenTruck('${t.num}')">
      ${cols.map(col => ccCell(col, t, cc)).join('')}
    </tr>`;
  });

  tbody.innerHTML = rows;
  const sub = document.getElementById('dt-page-sub');
  if (sub) sub.textContent = `All Trucks · ${allTrucks.length} truck${allTrucks.length !== 1 ? 's' : ''}`;
  const info = document.getElementById('dt-page-info');
  if (info) info.textContent = `1 - ${allTrucks.length} of ${allTrucks.length} Records`;
}


function dtRenderOverview() {
  const tbody = document.getElementById('dt-tbody');
  if (!tbody) return;
  const cols = visibleCols('overview');
  const ncols = cols.length;

  function ovCell(col, t, badges, connDot) {
    const cl = 'dt-td';
    const c = col.id;
    const dim = '<span style="color:var(--soft)">--</span>';
    if (c === 'truck')    return `<td class="dt-td dt-td-strong">${t.num}</td>`;
    if (c === 'alerts')   return `<td class="${cl}"><div class="dt-badge-wrap">${badges || '<span style="color:var(--soft)">—</span>'}</div></td>`;
    // Live-data cells show -- for unlinked trucks (no unit reporting, so no data)
    if (c === 'unitid')   return `<td class="dt-td dt-td-soft">${t.unlinked ? '--' : (t.unitId || '—')}</td>`;
    if (c === 'sysver')   return `<td class="${cl}">${t.unlinked ? dim : dtVerPill(t.ver)}</td>`;
    if (c === 'ignition') return `<td class="${cl}">${t.unlinked ? dim : `${t.ign} · ${t.ignDetail}`}</td>`;
    if (c === 'impact')   return `<td class="${cl}">${t.unlinked ? dim : (t.impact || '—')}</td>`;
    if (c === 'plant')    return `<td class="dt-td dt-td-strong">${t.plant}</td>`;
    if (c === 'account')  return `<td class="${cl}">${t.account}</td>`;
    if (c === 'conn')     return `<td class="${cl}">${connDot}</td>`;
    if (c === 'lastconn') return `<td class="dt-td dt-td-soft">${t.unlinked ? '--' : t.lastConn}</td>`;
    return `<td class="${cl}">—</td>`;
  }

  let allTrucks = [];
  truckGroups.forEach(group => {
    /* Overview is scoped to the master active account — the territory
       selector is a Where to Start affordance only. */
    if (group.account !== activeAccount) return;
    // Include unlinked trucks too — they show with an "Unlinked" tag instead
    // of err/wrn badges and a grey "Unlinked Truck" pill in the Connection
    // column, matching the mobile rendering pattern.
    group.trucks.forEach(t => { if (dtTruckMatchesSearch(t) && filterMatch(t)) allTrucks.push(t); });
  });

  if (allTrucks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${ncols}" style="padding:40px;text-align:center;color:var(--soft);font-size:14px;">No trucks in ${activeAccount}.</td></tr>`;
    return;
  }

  let rows = '';
  dtSortTrucks(allTrucks, 'overview').forEach((t, idx) => {
    const alt = idx % 2 === 1;
    let badges, connDot;
    if (t.unlinked) {
      badges  = `<span class="dt-badge-unlinked">Unlinked</span>`;
      connDot = `<span class="dt-units-status-pill unlinked"><span class="dot"></span>Unlinked Truck</span>`;
    } else {
      badges = [
        t.err > 0 ? `<span class="dt-badge err"><svg width="11" height="11" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.375 0H8.25C9.00195 0 9.625 0.623047 9.625 1.375V8.25C9.625 9.02344 9.00195 9.625 8.25 9.625H1.375C0.601562 9.625 0 9.02344 0 8.25V1.375C0 0.623047 0.601562 0 1.375 0ZM4.8125 2.0625C4.51172 2.0625 4.29688 2.29883 4.29688 2.57812V4.98438C4.29688 5.28516 4.51172 5.5 4.8125 5.5C5.0918 5.5 5.32812 5.28516 5.32812 4.98438V2.57812C5.32812 2.29883 5.0918 2.0625 4.8125 2.0625ZM4.125 6.875C4.125 7.26172 4.42578 7.5625 4.8125 7.5625C5.17773 7.5625 5.5 7.26172 5.5 6.875C5.5 6.50977 5.17773 6.1875 4.8125 6.1875C4.42578 6.1875 4.125 6.50977 4.125 6.875Z" fill="white"/></svg>${t.err}</span>` : '',
        t.wrn > 0 ? `<span class="dt-badge wrn"><svg width="11" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.54297 0C5.84375 0 6.12305 0.171875 6.27344 0.429688L10.9141 8.33594C11.0645 8.61523 11.0645 8.9375 10.9141 9.19531C10.7637 9.47461 10.4844 9.625 10.1836 9.625H0.902344C0.580078 9.625 0.300781 9.47461 0.150391 9.19531C0 8.9375 0 8.61523 0.150391 8.33594L4.79102 0.429688C4.94141 0.171875 5.2207 0 5.54297 0ZM5.54297 2.75C5.24219 2.75 5.02734 2.98633 5.02734 3.26562V5.67188C5.02734 5.97266 5.24219 6.1875 5.54297 6.1875C5.82227 6.1875 6.05859 5.97266 6.05859 5.67188V3.26562C6.05859 2.98633 5.82227 2.75 5.54297 2.75ZM6.23047 7.5625C6.23047 7.19727 5.9082 6.875 5.54297 6.875C5.15625 6.875 4.85547 7.19727 4.85547 7.5625C4.85547 7.94922 5.15625 8.25 5.54297 8.25C5.9082 8.25 6.23047 7.94922 6.23047 7.5625Z" fill="#36322d"/></svg>${t.wrn}</span>` : '',
      ].join('');
      connDot = t.conn === 'live'
        ? `<span class="dt-conn-dot live"></span>Live`
        : `<span class="dt-conn-dot none"></span><span style="color:var(--soft)">No connection</span>`;
    }
    rows += `<tr class="dt-tr${alt ? ' alt' : ''}" data-truck="${t.num}" onclick="dtOpenTruck('${t.num}')">
      ${cols.map(col => ovCell(col, t, badges, connDot)).join('')}
    </tr>`;
  });

  tbody.innerHTML = rows;
  const sub = document.getElementById('dt-page-sub');
  if (sub) sub.textContent = `All Trucks · ${allTrucks.length} truck${allTrucks.length !== 1 ? 's' : ''}`;
  const info = document.getElementById('dt-page-info');
  if (info) info.textContent = `1 - ${allTrucks.length} of ${allTrucks.length} Records`;
}

/* ── DESKTOP TRUCK DRAWER ──────────────────────────────── */
let dtDrawerTruckNum = null;

function dtOpenTruck(truckNum) {
  dtDrawerTruckNum = truckNum;
  const t = trucks.find(t => t.num === truckNum);
  const cc = CC_TRUCKS.find(c => c.num === truckNum);
  if (!t) return;

  const drawer = document.getElementById('dt-drawer');

  /* Show the unit pill in the header whenever the truck has a linked unit.
     - Arrived via unit pivot (dtTruckOpenedFromUnit set): "← Back to Unit X"
     - Arrived directly from All Trucks: "Unit X →"
     Either way the pill opens the unit drawer; dtBackToUnit handles both. */
  const backPill       = document.getElementById('dt-drawer-back-to-unit');
  const backId         = document.getElementById('dt-drawer-back-to-unit-id');
  const backLabel      = document.getElementById('dt-drawer-back-to-unit-label');
  const arrowLeft      = document.getElementById('dt-drawer-back-to-unit-arrow-left');
  const arrowRight     = document.getElementById('dt-drawer-back-to-unit-arrow-right');
  if (backPill && backId) {
    const unitId = dtTruckOpenedFromUnit ||
      (typeof UNITS_DATA !== 'undefined' && UNITS_DATA.find(u => u.status === 'Linked Unit' && u.truck === truckNum)?.id) ||
      (t.unitId && t.unitId !== '--' ? t.unitId : null);
    if (unitId) {
      backId.textContent = unitId;
      if (dtTruckOpenedFromUnit) {
        // Back navigation — left arrow, "Back to Unit X"
        if (backLabel)  backLabel.textContent = 'Back to Unit ';
        if (arrowLeft)  arrowLeft.style.display  = '';
        if (arrowRight) arrowRight.style.display = 'none';
      } else {
        // Forward navigation — right arrow, "Unit X"
        if (backLabel)  backLabel.textContent = 'Unit ';
        if (arrowLeft)  arrowLeft.style.display  = 'none';
        if (arrowRight) arrowRight.style.display = '';
      }
      backPill.style.display = 'flex';
    } else {
      backPill.style.display = 'none';
    }
  }

  /* Unlink Unit button — only meaningful if there's actually a linked unit on
     this truck. Hide otherwise so users don't try to unlink nothing.
     A truck has a linked unit if either the truck record's own unitId is
     populated (most fleet trucks) or there's a UNITS_DATA registry entry
     pointing at this truck (recently attached / unlink-cycled units). */
  const unlinkBtn = document.getElementById('dt-drawer-unlink-btn');
  if (unlinkBtn) {
    const hasLinkedUnit = !t.unlinked && (
      (t.unitId && t.unitId !== '--') ||
      ((typeof UNITS_DATA !== 'undefined') &&
        UNITS_DATA.some(u => u.status === 'Linked Unit' && u.truck === truckNum))
    );
    unlinkBtn.style.display = hasLinkedUnit ? '' : 'none';
  }
  /* Restore Ping Truck + Fleet map for any drawer open path — they get hidden
     by dtTruckDrawerApplyUnlinkedState, so we put them back any time we
     start opening a truck. The unlinked branch below will re-hide them. */
  const pingBtn = document.getElementById('dt-drawer-ping-btn');
  if (pingBtn) pingBtn.style.display = '';
  const fleetMap = document.getElementById('dt-drawer-map');
  if (fleetMap) fleetMap.style.display = '';

  /* Branch: if the truck is in unlinked state, reshape the drawer to the
     "Truck Not Connected" empty state and stop here. The full Linked drawer
     (Overview, Sensor, etc.) doesn't apply when nothing's attached.

     Source of truth is t.unlinked on the truck record itself — that flag is
     set/cleared by attach/unlink mutations. Don't cross-check UNITS_DATA
     here: UNITS_DATA is the unit registry (units with full lifecycle history),
     and most fleet trucks have synthetic unitId references without a UNITS_DATA
     row. Cross-checking would falsely flag those as unlinked. */
  if (t.unlinked) {
    /* Header label */
    document.getElementById('dt-drawer-truck-num').textContent = t.num;
    /* Reshape into empty state (tabs, side panel, scroll content all swapped) */
    dtTruckDrawerApplyUnlinkedState(truckNum);
    /* Open the drawer */
    document.getElementById('dt-drawer-scrim').classList.add('open');
    requestAnimationFrame(() => drawer.classList.add('open'));
    return;
  }

  /* Linked-truck path: ensure tabs are restored to the full set. If we're
     coming back from a previously-shown empty state, the tabs container was
     overwritten. Rebuild it. */
  const tabsEl = document.getElementById('dt-drawer-tabs');
  if (tabsEl && !tabsEl.querySelector('[onclick*="overview"]')) {
    tabsEl.innerHTML = `
      <button class="dt-drawer-tab active" onclick="dtDrawerTab('overview', this)">Overview</button>
      <button class="dt-drawer-tab" onclick="dtDrawerTab('timeline', this)">Timeline</button>
      <button class="dt-drawer-tab" onclick="dtDrawerTab('logs', this)">Trucks Logs</button>
      <button class="dt-drawer-tab" onclick="dtDrawerTab('manual', this)">Manual Control</button>
      <button class="dt-drawer-tab" onclick="dtDrawerTab('sensor', this)">Sensor</button>
      <button class="dt-drawer-tab" onclick="dtDrawerTab('config', this)">Configuration</button>`;
  }

  /* Ensure the drawer is reset to Overview before populating cards.
     Without this, reopening the drawer after the user left it on a different
     tab would leave the scroll area showing that tab's content, and the card
     grid lookups below would crash with `Cannot set properties of null`. */
  if (!document.getElementById('dt-drawer-mcs-cards')) {
    const scroll = document.getElementById('dt-drawer-scroll');
    if (scroll) {
      scroll.innerHTML = `
        <div id="dt-overview-toolbar" style="display:flex;align-items:center;justify-content:space-between;padding:0 0 16px;">
          <span id="dt-replace-hint" style="font-size:13px;color:#92400e;letter-spacing:-0.26px;display:none;">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="vertical-align:middle;margin-right:4px;"><path d="M7 1v6M7 10h.01" stroke="#92400e" stroke-width="1.4" stroke-linecap="round"/><circle cx="7" cy="7" r="6" stroke="#92400e" stroke-width="1.2"/></svg>
            Tap components to select them
          </span>
          <button class="co-replace-btn" id="dt-replace-btn" onclick="dtReplaceToggle()" style="margin-left:auto;">
            ${CO_REPLACE_BTN_HTML}
          </button>
        </div>
        <div class="dt-drawer-section-hdr" onclick="dtDrawerToggleSection('mcs',this)">
          <svg class="dt-section-chev" width="14" height="14" viewBox="0 0 14 14" fill="none" style="transition:transform 0.2s;"><path d="M3 5l4 4 4-4" stroke="#36322d" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Measurement Component Status
        </div>
        <div class="dt-drawer-cards" id="dt-drawer-mcs-cards"></div>
        <div class="dt-drawer-section-hdr" onclick="dtDrawerToggleSection('fdm',this)" style="margin-top:8px;">
          <svg class="dt-section-chev" width="14" height="14" viewBox="0 0 14 14" fill="none" style="transition:transform 0.2s;"><path d="M3 5l4 4 4-4" stroke="#36322d" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          V3 FDM
        </div>
        <div class="dt-drawer-cards" id="dt-drawer-fdm-cards"></div>`;
    }
    /* Reset the active tab indicator to Overview */
    document.querySelectorAll('.dt-drawer-tab').forEach((b, i) => b.classList.toggle('active', i === 0));
    /* Clear logs-mode if the drawer was last left on the Logs tab */
    const sidePanel = document.querySelector('#dt-drawer .dt-drawer-side');
    if (sidePanel) sidePanel.classList.remove('logs-mode');
    /* Stop sensor ticker if it was running */
    if (typeof senStop === 'function') senStop();
  }

  /* Header */
  document.getElementById('dt-drawer-truck-num').textContent = t.num;
  /* Unit ID + TCG ID subtitle — look up the unit linked to this truck. */
  const unitForTruck = (typeof UNITS_DATA !== 'undefined')
    ? UNITS_DATA.find(u => String(u.truck) === String(t.num))
    : null;
  const udUnitEl = document.getElementById('dt-drawer-unit-id');
  const udTcgEl  = document.getElementById('dt-drawer-tcg-id');
  if (udUnitEl) udUnitEl.textContent = unitForTruck ? unitForTruck.id : (t.unitId && t.unitId !== '--' ? t.unitId : '—');
  if (udTcgEl)  udTcgEl.textContent  = (unitForTruck && unitForTruck.tgw && unitForTruck.tgw !== '--') ? unitForTruck.tgw : '—';
  const ignBadge = document.getElementById('dt-drawer-ign-badge');
  const ignText  = document.getElementById('dt-drawer-ign-text');
  const ignOn    = t.ign === 'On';
  ignBadge.className = 'dt-drawer-ign-badge' + (ignOn ? '' : ' off');
  ignText.textContent = ignOn ? 'Ignition on' : 'Ignition off';

  /* Side panel meta */
  document.getElementById('dt-drawer-conn').textContent = t.conn === 'live' ? 'Connected' : 'No connection';
  document.getElementById('dt-drawer-conn').style.color = t.conn === 'live' ? '#295ccc' : 'var(--soft)';
  // Truck Mode (Live / Active / Standby / Inactive) — uses truckMode from the data
  const modeEl = document.getElementById('dt-drawer-mode');
  if (modeEl) modeEl.textContent = t.truckMode === 'Active' ? 'Live' : (t.truckMode || 'Live');

  // Convert "1:16 PM 07/23/25" → "Jul 23, 2025, 1:16:38 PM" (Figma-style display)
  const formatTs = (s) => {
    if (!s || s === '—') return '—';
    const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)\s+(\d{2})\/(\d{2})\/(\d{2,4})$/i);
    if (!m) return s;
    const [, hh, mm, ap, mo, da, yy] = m;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monIdx = parseInt(mo, 10) - 1;
    const year = yy.length === 2 ? '20' + yy : yy;
    // Synthesize seconds for prototype display
    const sec = '38';
    return `${months[monIdx]} ${parseInt(da,10)}, ${year}, ${parseInt(hh,10)}:${mm}:${sec} ${ap.toUpperCase()}`;
  };

  // Code version: map "V3"/"V4"/"V5" to plausible semver strings
  document.getElementById('dt-drawer-ver').textContent = t.ver || '—';

  // Last connect / system status — formatted timestamps
  const lastTs = formatTs(t.lastConn);
  document.getElementById('dt-drawer-last-conn').textContent = lastTs;
  document.getElementById('dt-drawer-last-status').textContent = lastTs;

  // Last reboot — slightly earlier timestamp for prototype realism
  const lastReboot = document.getElementById('dt-drawer-last-reboot');
  if (lastReboot) lastReboot.textContent = lastTs;

  // Static prototype values for fields not in the truck record
  const commissioned = document.getElementById('dt-drawer-commissioned');
  if (commissioned) commissioned.textContent = (unitForTruck && unitForTruck.firstCommissioned) ? unitForTruck.firstCommissioned : '—';
  const drumMfg = document.getElementById('dt-drawer-drum-mfg');
  if (drumMfg) drumMfg.textContent = 'Schwing, 2022';
  const drumSize = document.getElementById('dt-drawer-drum-size');
  if (drumSize) drumSize.innerHTML = '10yd<sup class="dt-drawer-sup">3</sup>';
  const loads = document.getElementById('dt-drawer-loads');
  if (loads) loads.textContent = '15,000';

  document.getElementById('dt-drawer-map-pin').textContent = 'Truck ' + t.num;

  /* Config from linked unit — drives which cards to show */
  const unitConfig = unitForTruck ? unitForTruck.config : 'Measured Only';
  const isManaged  = unitConfig === 'Temp+ Admix' || unitConfig === 'Winter Water';
  const waterLabel = unitConfig === 'Winter Water' ? 'Winter Water' : 'Temperate Water';

  /* Build component cards */
  const mcsCards = [
    { name:'TCG',           label:'Telematics Control Gateway', value:'Active', unit:'', startup:null, err:'--', extra:{label:'Status', val:'Connected'}, fw:t.ver||'' },
    { name:'DPS pressure',  label:'Drum Pressure Sensor',     value:'196',  unit:'psi',    startup:2,  err:'--', extra:null },
    { name:'CPS',           label:'Charge Pressure Sensor',   value:'204',  unit:'psi',    startup:2,  err:'--', extra:null },
    { name:'WDS',           label:'Water Drum Sensor',               value:'12', unit:'rpm', startup:2, err:'--', extra:{label:'Drum Temp', val:'91 °F'}, flipBack:{ lastSeen:'Mar 23 · 08:24 AM', lastVoltage:'2.4', voltageUnit:'V' }, fw:'v2.1.4' },
    { name:'DRS',           label:'Drum Rotation Speed',      value:String(DRS_RPM[String(t.num)] || 8), unit:'rpm',    startup:2,  err:'--', extra:null, fw:'v1.0.8' },
    { name:'CWR', label:'Cold Weather Relay', value:'91', unit:'°F', startup:2, err:'--', extra:{label:'FW v35.0 · Tilt', val:'1°'}, fw:'v35.0' },
    { name:'ICD',           label:'In-Cab Display',   value:'Active', unit:'',       startup:2,  err:'--', extra:{label:'Firmware', val:'v1468'}, fw:'v1468' },
    ...(isManaged ? [
      { name:'Water Pump',    label:waterLabel, value:String(WATER_GPM[String(t.num)] || 17), unit:'gal/min', startup:1, err:'0', fw:'v4.2.1' },
            { name:'Admix Pump', label:'Admixture Pump', value:String(ADMIX_MLS[String(t.num)] || 165), unit:'ml/s', startup:1, err:'0', fw:'v4.2.1', warnCard:ADMIX_MLS[String(t.num)] < 120 && ADMIX_MLS[String(t.num)] >= 80, forceAlarm:ADMIX_MLS[String(t.num)] < 80 },
    ] : []),
    { name:'ED',            label:'External Display', value:'Active', unit:'', startup:2, err:'--', extra:{label:'Firmware', val:'v8195'}, fw:'v8195' },
  ];
  const fdmCards = [
    { name:'IOX supply voltage',    label:'Onboard Power Supply',  value:'12.9', unit:'V',       startup:1, err:'--', extra:{label:'Temperature', val:'113 ºF'} },
    ...(isManaged ? [
      { name:'Water meter flow rate', label:waterLabel + ' flow to drum', value:String(WATER_GPM[String(t.num)] || 17), unit:'gal/min', startup:null, err:null, flowExtra:{error:1, noStop:0, rate:String(WATER_GPM[String(t.num)] || 17)+' gal/min'}, warnCard:WATER_GPM[String(t.num)] < 16 && WATER_GPM[String(t.num)] >= 10, forceAlarm:WATER_GPM[String(t.num)] < 10 },
      { name:'Admix meter flow rate', label:'Admixture Dosing meter', value:'145', unit:'ml/s', startup:null, err:null, flowExtra:{error:0, noStop:0, rate:'142 ml/s'} },
    ] : []),
  ];
  /* Expose so dtReplaceDoRemove can mutate them */
  window._dtMcsCards = mcsCards;
  window._dtFdmCards = fdmCards;

  /* Map WDS alarm state from CC data if available */
  function getCardState(cardName) {
    if (!cc) return 'clean';
    const ccName = CC_NAME_MAP[cardName] || cardName;
    const comp = cc.components.find(c => c.name === ccName);
    return comp ? comp.state : 'clean';
  }

  function buildCard(card) {
    if (!card) return '';
    /* Confirmed operational — clear all override flags, fall through to normal green render */
    if (window.dtConfirmedComponents && window.dtConfirmedComponents[card.name]) {
      var confirmedData = window.dtConfirmedComponents[card.name];
      var overrides = { state: null, forceAlarm: false, greyDot: false, warnCard: false, flipBack: null };
      if (typeof confirmedData === 'object') Object.assign(overrides, confirmedData);
      card = Object.assign({}, card, overrides);
    }
    /* Check if this component was removed this session */
    else if (window.dtRemovedComponents && window.dtRemovedComponents[card.name]) {
      card = { name: card.name, state: 'empty', removedDate: window.dtRemovedComponents[card.name] };
    }
    /* Check if a replacement was installed this session */
    else if (window.dtPendingComponents && window.dtPendingComponents[card.name]) {
      var p = window.dtPendingComponents[card.name];
      card = { name: card.name, state: 'pending', value: p.serial, unit: '', label: 'Installed ' + p.installedDate };
    }
    /* Empty slot state */
    if (card.state === 'empty' && !(window.dtConfirmedComponents && window.dtConfirmedComponents[card.name])) {
      return `
        <div class="dt-co-card empty" onclick="if(!coReplaceActive) dtInstallOpen('${card.name}','${card.removedDate||''}')">
          <div class="dt-co-card-body">
            <div class="dt-co-card-head">
              <div class="dt-empty-slot-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="rgba(54,50,45,0.3)" stroke-width="1.4" stroke-dasharray="3 2"/></svg>
              </div>
              <span class="dt-co-card-name">${card.name}</span>
            </div>
            <div class="dt-empty-label">No component installed</div>
            <div class="dt-empty-date">Removed ${card.removedDate || '—'}</div>
            <div style="flex:1;"></div>
            <div class="dt-empty-action">Install replacement →</div>
          </div>
          <div class="dt-co-card-strip">
            <span class="dt-co-card-strip-label">Not installed</span>
          </div>
        </div>`;
    }
    /* Pending verification state */
    if (card.state === 'pending' && !(window.dtConfirmedComponents && window.dtConfirmedComponents[card.name])) {
      return `
        <div class="dt-co-card pending">
          <div class="dt-co-card-body">
            <div class="dt-co-card-head">
              <span class="dt-co-card-dot" style="background:#d97706;"></span>
              <span class="dt-co-card-name">${card.name}</span>
            </div>
            <div class="dt-co-card-value-row">
              <span class="dt-co-card-value" style="font-size:22px;letter-spacing:-0.44px;line-height:26px;">${card.value}</span>
            </div>
            <div class="dt-co-card-desc">
              <span>Pending verification</span>
              <span>Reset errors to confirm</span>
            </div>
          </div>
          <div class="dt-co-card-strip">
            <span class="dt-co-card-strip-dot"></span>
            <span class="dt-co-card-strip-label">Pending verification</span>
          </div>
        </div>`;
    }


    let state = card.forceAlarm ? 'alarm' : (card.greyDot ? 'grey' : getCardState(card.name));
    if (card.warnCard) state = 'warn';
    /* WDS in alarm state — override label and value */
    if (card.name === 'WDS' && state === 'alarm') {
      card = Object.assign({}, card, { label:'Water Drum Sensor', value:'--', err:'14' });
    }

    const dotColor = state === 'alarm' ? '#d70100' : state === 'warn' ? '#ffba0d' : state === 'grey' ? 'rgba(54,50,45,0.3)' : '#2ecf1d';
    const faultReason = coFaultReason(card.name, state);
    const stripLabel = state === 'alarm' ? ('Alarm · ' + faultReason)
                     : state === 'warn'  ? ('Warning · ' + faultReason)
                     : state === 'grey'  ? 'Not active'
                     : 'Operating normally';
    const stripDot = (state === 'alarm' || state === 'warn') ? `<span class="dt-co-card-strip-dot"></span>` : '';

    const descLines = (card.label || '').split('\n').filter(Boolean);
    const descHtml = descLines.map(l => `<span>${l}</span>`).join('');

    let metaHtml = '';
    if (card.extra) {
      metaHtml += `<div class="dt-co-card-meta-row"><span class="dt-co-card-meta-label">${card.extra.label}:</span><span>${card.extra.val}</span></div>`;
    }
    if (card.startup !== null && card.startup !== undefined) {
      metaHtml += `<div class="dt-co-card-meta-row"><span class="dt-co-card-meta-label">Startup Count:</span><span>${card.startup}</span></div>`;
    }
    if (card.err !== null && card.err !== undefined) {
      metaHtml += `<div class="dt-co-card-meta-row"><span class="dt-co-card-meta-label">Error Count:</span><span>${card.err}</span></div>`;
    }
    if (card.flowExtra) {
      metaHtml += `<div class="dt-co-card-meta-row"><span class="dt-co-card-meta-label">Flow Error:</span><span>${card.flowExtra.error}</span></div>`;
      metaHtml += `<div class="dt-co-card-meta-row"><span class="dt-co-card-meta-label">No Stop:</span><span>${card.flowExtra.noStop}</span></div>`;
      metaHtml += `<div class="dt-co-card-meta-row"><span class="dt-co-card-meta-label">Flow Rate</span><span>${card.flowExtra.rate}</span></div>`;
    }

    const isTcg = card.name === 'TCG';
    const valueDisplay = isTcg
      ? `<span class="dt-co-card-value" style="font-size:22px;letter-spacing:-0.44px;line-height:26px;">${card.value || 'TCG-1042'}</span>`
      : `<span class="dt-co-card-value">${card.value || '\u2014'}</span>${card.unit ? `<span class="dt-co-card-unit">${card.unit}</span>` : ''}`;

    const tcgBtn = isTcg
      ? `<button class="dt-co-tcg-replace-btn" onclick="event.stopPropagation();coOpenTcgReplace(true);" title="Replace TCG" aria-label="Replace TCG"><svg width="14" height="14" viewBox="0 0 21 21" fill="none"><path d="M12.4513 5.05364C12.2681 5.24057 12.1655 5.49189 12.1655 5.75364C12.1655 6.01539 12.2681 6.26671 12.4513 6.45364L14.0513 8.05364C14.2382 8.23687 14.4896 8.3395 14.7513 8.3395C15.0131 8.3395 15.2644 8.23687 15.4513 8.05364L19.2213 4.28364C19.7242 5.39483 19.8764 6.63288 19.6578 7.83279C19.4392 9.0327 18.86 10.1375 17.9976 10.9999C17.1352 11.8624 16.0304 12.4415 14.8305 12.6601C13.6306 12.8787 12.3925 12.7265 11.2813 12.2236L4.37132 19.1336C3.9735 19.5315 3.43393 19.755 2.87132 19.755C2.30871 19.755 1.76914 19.5315 1.37132 19.1336C0.973496 18.7358 0.75 18.1962 0.75 17.6336C0.75 17.071 0.973496 16.5315 1.37132 16.1336L8.28132 9.22364C7.77848 8.11245 7.62624 6.87441 7.84486 5.6745C8.06349 4.47459 8.64261 3.3698 9.50504 2.50736C10.3675 1.64493 11.4723 1.06581 12.6722 0.847184C13.8721 0.628558 15.1101 0.780807 16.2213 1.28364L12.4613 5.04364L12.4513 5.05364Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`
      : '';

    return `
      <div class="dt-co-card ${state}${isTcg ? ' dt-co-card-tcg' : ''}" data-comp="${card.name}" onclick="dtReplaceCardTap(this,'${card.name}')">
        <div class="dt-co-card-body">
          <div class="dt-co-card-head">
            <span class="dt-co-card-dot" style="background:${dotColor};"></span>
            <span class="dt-co-card-name">${card.name}</span>
            ${card.fw ? `<span class="dt-ver-pill">${card.fw}</span>` : ''}
            ${tcgBtn}
          </div>
          <div class="dt-co-card-value-row">${valueDisplay}</div>
          <div class="dt-co-card-desc">${descHtml}</div>
          <div class="dt-co-card-meta">${metaHtml}</div>
          ${isTcg ? `<div class="dt-co-tcg-lock-hint">Replace separately</div>` : ''}
        </div>
        <div class="dt-co-card-strip">
          ${stripDot}
          <span class="dt-co-card-strip-label">${stripLabel}</span>
        </div>
      </div>`;
  }

  /* buildCardFront/buildFlipCard stubs — no longer used in main flow */
  function buildCardFront(card, state, dotColor, descHtml, metaHtml) { return buildCard(card); }
  function buildFlipCard(card, state, dotColor, descHtml, metaHtml) { return buildCard(card); }


  document.getElementById('dt-drawer-mcs-cards').innerHTML = mcsCards.map(buildCard).join('');
  document.getElementById('dt-drawer-fdm-cards').innerHTML = fdmCards.map(buildCard).join('');

  /* Newly linked truck: start with skeleton cards, resolve to healthy after 2s */
  if (t.newlyLinked) {
    const skeletonCard = () => `
      <div class="dt-co-card skeleton">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <div class="dt-skel-line" style="width:8px;height:8px;border-radius:50%;flex-shrink:0;"></div>
          <div class="dt-skel-line" style="width:80px;height:10px;"></div>
        </div>
        <div class="dt-skel-line" style="width:60%;height:32px;margin-top:4px;"></div>
        <div class="dt-skel-line" style="width:90%;height:10px;"></div>
        <div class="dt-skel-line" style="width:70%;height:10px;"></div>
        <div style="margin-top:auto;">
          <div class="dt-skel-line" style="width:100%;height:10px;margin-bottom:6px;"></div>
          <div class="dt-skel-line" style="width:100%;height:10px;"></div>
        </div>
      </div>`;
    const skeletons = Array(9).fill(null).map(skeletonCard).join('');
    document.getElementById('dt-drawer-mcs-cards').innerHTML = skeletons;
    document.getElementById('dt-drawer-fdm-cards').innerHTML = Array(3).fill(null).map(skeletonCard).join('');

    /* Resolve to healthy clean cards after 2s */
    setTimeout(function() {
      /* Martin's order at the post-commission readout — this is exactly the
         moment he watches components come up green:
           TCG → DPS / CPS → WDS → component readings → Admix → ED last
         WDS reads drum speed + temperature, not gallons (Brandon's callout). */
      const cleanMcs = [
        { name:'TCG',         label:'Telematics Control Gateway', value:'Active',  unit:'',        startup:null, err:'--', extra:{label:'Status', val:'Connected'}, fw:t.ver||'' },
        { name:'DPS pressure',label:'Drum Pressure Sensor',       value:'194',     unit:'psi',     startup:0, err:'--', extra:null },
        { name:'CPS',         label:'Charge Pressure Sensor',     value:'201',     unit:'psi',     startup:0, err:'--', extra:null },
        { name:'WDS',         label:'Water Drum Sensor',          value:'0',       unit:'rpm',     startup:0, err:'--', extra:{label:'Drum Temp', val:'72 °F'}, fw:'v2.1.4' },
        { name:'DRS',         label:'Drum Rotation Speed',        value:'0',       unit:'rpm',     startup:0, err:'--', extra:null, fw:'v1.0.8' },
        { name:'CWR', label:'Cold Weather Relay', value:'72', unit:'°F', startup:0, err:'--', extra:{label:'FW v35.0 · Tilt', val:'0°'}, fw:'v35.0' },
        { name:'ICD',         label:'Input Current Detector',     value:'1441',    unit:'mA',     startup:0, err:'--', extra:null },
        { name:'Water Pump',  label:'Water Delivery System',      value:'2.0',     unit:'gal/min', startup:0, err:'--', extra:null, fw:'v4.2.1' },
        { name:'ED',          label:'Electrical Signal value',    value:'8012',    unit:'counts', startup:0, err:'--', extra:null },
      ];
      const cleanFdm = [
        { name:'IOX supply voltage',    label:'Onboard Power Supply',      value:'12.8', unit:'V',       startup:0, err:'--', extra:{label:'Temperature', val:'98 °F'} },
        { name:'Water meter flow rate', label:'Active Water flow to drum', value:'0.0',  unit:'gal/min', startup:0, err:'--', extra:null },
        { name:'Admix meter flow rate', label:'Admixture Dosing meter',    value:'0',    unit:'ml/s', startup:0, err:'--', extra:null },
      ];
      if (document.getElementById('dt-drawer-mcs-cards')) {
        document.getElementById('dt-drawer-mcs-cards').innerHTML = cleanMcs.map(buildCard).join('');
        document.getElementById('dt-drawer-fdm-cards').innerHTML = cleanFdm.map(buildCard).join('');
        t.newlyLinked = false; /* don't repeat on next open */
      }
    }, 2000);
  }

  /* Open + wire tab-bar fade affordance.
     dtInitTabsFade() is called immediately so the listener is registered,
     but the drawer width is still 0 at rAF time (CSS transition is 0.38s).
     We fire a second update() after the transition settles so the fade
     reflects the real scrollWidth of the fully-open drawer. */
  requestAnimationFrame(() => {
    drawer.classList.add('open');
    document.getElementById('dt-drawer-scrim').classList.add('open');
    dtInitTabsFade();
    // Re-check overflow state once transition completes (~400ms)
    setTimeout(function() {
      var tabs = document.getElementById('dt-drawer-tabs');
      var wrap = document.getElementById('dt-drawer-tabs-wrap');
      if (!tabs || !wrap) return;
      var atEnd = tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 4;
      wrap.classList.toggle('scrolled-end', atEnd);
    }, 420);
  });
}

/* Adds a right-edge fade to the tab bar when there are hidden tabs,
   and removes it once the user scrolls to the end. Safe to call
   multiple times — it checks before adding the listener. */
function dtInitTabsFade() {
  var wrap = document.getElementById('dt-drawer-tabs-wrap');
  var tabs = document.getElementById('dt-drawer-tabs');
  if (!wrap || !tabs || tabs._fadeWired) return;
  tabs._fadeWired = true;
  function update() {
    var atEnd = tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 4;
    wrap.classList.toggle('scrolled-end', atEnd);
  }
  tabs.addEventListener('scroll', update, { passive: true });
  // Also update on resize (drawer width changes)
  new ResizeObserver(update).observe(tabs);
  update();
}

/* ── WDS card flip + jump to Truck Logs ────────────────
   Mirrors the mobile flow: tapping the WDS alarm card flips it to a
   "Last seen / Last battery voltage" panel with a "View Truck Logs"
   button that switches to the Logs tab and selects the WDS event row.
   Also reused by Component Timeline alarm/warning pills. */


/* Generic helper — switch to the Logs tab and pre-select a row by id. */
function dtJumpToLogRow(rowId) {
  const logsTabBtn = document.querySelector('.dt-drawer-tab[onclick*="\'logs\'"]');
  if (logsTabBtn) dtDrawerTab('logs', logsTabBtn);
  // Two RAFs so the tab content has rendered before we try to select a row
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dtLogsSelectRow(rowId, { scrollIntoView: true });
    });
  });
}


/* Component Timeline alert click → jump to the most relevant log row.
   Prototype mapping: alarm pills → WDS No Connection (row 15),
   warning pills → FluidError (row 4). */
function dtTimelineOpenLog(severity) {
  const rowId = severity === 'alarm' ? 15 : 4;
  dtJumpToLogRow(rowId);
}

/* Unit pivot — opens the unit linked to the current truck. Handles both:
   - Back navigation: user arrived via a unit pivot, returns to that unit
   - Forward navigation: user arrived from All Trucks, opens the linked unit */
function dtBackToUnit() {
  const truckNum = dtDrawerTruckNum;
  // Back path: we know exactly which unit to return to
  if (dtTruckOpenedFromUnit) {
    dtUdJumpToUnitFromTruck(dtTruckOpenedFromUnit);
    return;
  }
  // Forward path: find the linked unit from the truck record
  let unitId = null;
  if (typeof UNITS_DATA !== 'undefined') {
    const u = UNITS_DATA.find(x => x.status === 'Linked Unit' && x.truck === truckNum);
    if (u) unitId = u.id;
  }
  if (!unitId && typeof trucks !== 'undefined') {
    const t = trucks.find(x => x.num === truckNum);
    if (t && t.unitId && t.unitId !== '--') unitId = t.unitId;
  }
  if (unitId) dtUdJumpToUnitFromTruck(unitId);
}

/* ════════════════════════════════════════════════════════════
   TRUCK DRAWER → UNLINK UNIT
   Mirrors the mobile workflow:
   - Confirm dialog (centered overlay inside the drawer, red icon, danger CTA)
   - On confirm, mutate the data: revert unit to Unlinked, push truck back into
     UNLINKED_TRUCKS pool, mark truck.unlinked in trucks[] / CC_TRUCKS so all
     surfaces reflect the change, update headers + tables
   - Success state replaces the scroll content with two CTAs: Back to Trucks /
     Go to Unit (pivots into the now-unlinked unit drawer)
═══════════════════════════════════════════════════════════ */

function dtTruckDrawerUnlinkUnit() {
  const truckNum = dtDrawerTruckNum;
  if (!truckNum) return;
  const u = (typeof UNITS_DATA !== 'undefined')
    ? UNITS_DATA.find(x => x.status === 'Linked Unit' && x.truck === truckNum)
    : null;
  if (!u) return; // nothing to unlink

  // Render the inline confirm panel right below the Unlink Unit button.
  // No modal — the user can still see the components view, side panel, and
  // header context while reading the confirmation.
  const panel = document.getElementById('dt-drawer-unlink-confirm');
  if (!panel) return;
  panel.innerHTML = `
    <div class="dt-inline-confirm-head">
      <div class="dt-inline-confirm-icon">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <path d="M8 12a4.5 4.5 0 006 0l2.5-2.5a4.5 4.5 0 00-6-6L9 5" stroke="#d70100" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 8a4.5 4.5 0 00-6 0L3.5 10.5a4.5 4.5 0 006 6L11 15" stroke="#d70100" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 3l14 14" stroke="#d70100" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="dt-inline-confirm-text">
        <div class="dt-inline-confirm-title">Confirm unlink</div>
        <div class="dt-inline-confirm-body" id="dt-drawer-unlink-body">
          The unit becomes inactive and will need to be reattached before it can collect data again.
        </div>
      </div>
    </div>
    <label style="display:flex; align-items:center; gap:8px; margin:10px 0 12px; cursor:pointer; font-size:13px; color:var(--strong); user-select:none;">
      <input type="checkbox" class="dt-units-cb" id="dt-drawer-unlink-return-cb"
             onchange="dtTruckDrawerUnlinkToggleReturn(this)">
      Return to Verify
    </label>
    <div class="dt-inline-confirm-btns">
      <button class="dt-inline-confirm-btn cancel" onclick="dtTruckDrawerUnlinkCancel()">Cancel</button>
      <button class="dt-inline-confirm-btn danger" onclick="dtTruckDrawerUnlinkDo(document.getElementById('dt-drawer-unlink-return-cb').checked)">Confirm Unlink</button>
    </div>`;
  panel.style.display = 'block';

  // Disable the trigger button while the confirm is showing — re-clicking it
  // would re-trigger the same panel; this also signals "we heard you, decide now."
  const btn = document.getElementById('dt-drawer-unlink-btn');
  if (btn) btn.setAttribute('aria-pressed', 'true');
}

function dtTruckDrawerUnlinkCancel() {
  const panel = document.getElementById('dt-drawer-unlink-confirm');
  if (panel) { panel.style.display = 'none'; panel.innerHTML = ''; }
  const btn = document.getElementById('dt-drawer-unlink-btn');
  if (btn) btn.removeAttribute('aria-pressed');
}

/* Body copy swaps based on the Return to Verify checkbox. The two states
   describe genuinely different end states — unchecked leaves the unit in
   the customer's Unlinked pool (reattachable), checked routes it to
   Pending Return (ships back, stays visible until Verify confirms receipt). */
function dtTruckDrawerUnlinkToggleReturn(cb) {
  const body = document.getElementById('dt-drawer-unlink-body');
  if (!body) return;
  body.textContent = cb.checked
    ? 'The unit will be marked Pending Return and stay visible until Verify confirms receipt.'
    : 'The unit becomes inactive and will need to be reattached before it can collect data again.';
}

function dtTruckDrawerUnlinkDo(andReturn) {
  dtTruckDrawerUnlinkCancel();
  const truckNum = dtDrawerTruckNum;
  if (!truckNum) return;
  const u = (typeof UNITS_DATA !== 'undefined')
    ? UNITS_DATA.find(x => x.status === 'Linked Unit' && x.truck === truckNum)
    : null;
  if (!u) return;

  const unitId = u.id;

  // 1. Set the unit's end state. Two paths share the same truck-side cleanup,
  //    only the unit-side destination differs:
  //    - andReturn=true:  unit ships back to Verify → 'Pending Return'.
  //      Stays visible in the Pending Return tab until Verify confirms receipt.
  //      This is the workflow that prevents the $90K-loss problem (Brandon VOC).
  //    - andReturn=false: unit stays in the customer account → 'Unlinked Unit'.
  //      Available in the unlinked pool, ready to attach to another truck.
  if (andReturn) {
    const now = new Date();
    const dateStr = (now.getMonth()+1) + '/' + now.getDate() + '/' + now.getFullYear();
    u.status = 'Pending Return';
    u.returnDate = dateStr;
  } else {
    u.status = 'Unlinked Unit';
  }
  u.truck  = '--';
  u.assignedToTruck = null;

  // 2. Add truck back into UNLINKED_TRUCKS pool if not already there.
  //    Synthesize defaults if we don't have detailed metadata.
  if (typeof UNLINKED_TRUCKS !== 'undefined') {
    const exists = UNLINKED_TRUCKS.find(t => t.number === truckNum);
    if (!exists) {
      UNLINKED_TRUCKS.push({
        number: truckNum,
        type:   'Front',
        drum:   '--',
        water:  '--',
        mixer:  '--',
      });
    }
  }

  // 3. Mark the truck as unlinked in main trucks[] and CC_TRUCKS so other
  //    surfaces (All Trucks page, Conditions, Overview) all reflect it.
  if (typeof trucks !== 'undefined') {
    const tMain = trucks.find(t => t.num === truckNum);
    if (tMain) {
      tMain.unlinked = true;
      tMain.err = 0;
      tMain.wrn = 0;
      tMain.truckMode = 'Non Active';
      tMain.unitId = '--';
    }
  }
  if (typeof CC_TRUCKS !== 'undefined') {
    const tCC = CC_TRUCKS.find(t => t.num === truckNum);
    if (tCC) {
      tCC.unlinked = true;
      tCC.err = 0;
      tCC.wrn = 0;
    }
  }

  // 4. Update Trucks-page Unlinked Units stat live so the header counter
  //    reflects the change immediately.
  const unlinkedEl = document.getElementById('dt-stat-unlinked');
  if (unlinkedEl && typeof UNITS_DATA !== 'undefined') {
    unlinkedEl.textContent = UNITS_DATA.filter(x => x.status === 'Unlinked Unit').length;
  }

  // 5. Re-render any visible tables so the change shows immediately.
  if (typeof dtRefreshTable === 'function' && typeof dtActiveTab !== 'undefined') {
    dtRefreshTable(dtActiveTab);
  }
  if (typeof dtUnitsRender === 'function') dtUnitsRender();
  // Pending Return tab is hidden when empty — make sure it shows up + counter
  // increments the moment we send a unit there.
  if (andReturn && typeof dtUnitsUpdateTabs === 'function') {
    dtUnitsUpdateTabs();
  }
  if (andReturn && typeof dtUnitsPendingRender === 'function') {
    dtUnitsPendingRender();
  }

  // 6. Reshape the truck drawer for the unlinked state.
  //    The drawer becomes the "Truck Not Connected" view: only Logs + Attach Unit
  //    tabs, grey status pill, empty side panel, illustration + "Connect Unit"
  //    CTA in the scroll area. Matches Figma node 608:38407.
  dtTruckDrawerApplyUnlinkedState(truckNum);
  // Clear the cross-drawer breadcrumb — it's stale once the unit is detached.
  dtTruckOpenedFromUnit = null;

  // 7. Trinity toast — wording differs by end state so the user sees where
  //    the unit actually went, not just that the truck got unlinked.
  if (andReturn) {
    dtShowToast({
      title: 'Unit flagged for return',
      body: `Unit ${unitId} removed from Truck ${truckNum}. Pending Return · Verify will confirm receipt.`,
      variant: 'warning',
    });
  } else {
    dtShowToast({
      title: 'Unit unlinked',
      body: `Unit ${unitId} was removed from Truck ${truckNum}. Connect a new unit to bring this truck back online.`,
    });
  }
}

/* ════════════════════════════════════════════════════════════
   TRUCK DRAWER — UNLINKED STATE RENDERER
   Reshapes the truck drawer to the empty-state view used when the truck
   has no unit attached. Called from dtTruckDrawerUnlinkDo (immediately
   after unlink) and from dtOpenTruck (whenever opening an unlinked truck).
═══════════════════════════════════════════════════════════ */

function dtTruckDrawerApplyUnlinkedState(truckNum) {
  // Tabs — only Logs + Attach Unit. Default to Logs (active).
  // Logs in the unlinked state is essentially "no activity to show" — we render
  // the empty state directly. Routing to dtDrawerTab('logs') would render the
  // full Linked-truck logs analyzer, which doesn't apply here.
  const tabsEl = document.getElementById('dt-drawer-tabs');
  if (tabsEl) {
    tabsEl.innerHTML = `
      <button class="dt-drawer-tab active" onclick="dtTruckDrawerShowUnlinkedLogs()">Logs</button>
      <button class="dt-drawer-tab" onclick="dtTruckDrawerOpenAttachUnit()">Attach Unit</button>`;
  }

  // Status pill — grey "Not Connected" (no green ignition)
  const ignBadge = document.getElementById('dt-drawer-ign-badge');
  const ignText  = document.getElementById('dt-drawer-ign-text');
  if (ignBadge) ignBadge.classList.add('off');
  if (ignText)  ignText.textContent = 'Not Connected';

  // Hide the Unlink Unit button (nothing to unlink) and the Back-to-Unit pill
  const unlinkBtn = document.getElementById('dt-drawer-unlink-btn');
  if (unlinkBtn) unlinkBtn.style.display = 'none';
  const backPill = document.getElementById('dt-drawer-back-to-unit');
  if (backPill)  backPill.style.display = 'none';
  // Hide Ping Truck — nothing live to ping. Hide Fleet map — no GPS without a unit.
  const pingBtn = document.getElementById('dt-drawer-ping-btn');
  if (pingBtn) pingBtn.style.display = 'none';
  const fleetMap = document.getElementById('dt-drawer-map');
  if (fleetMap) fleetMap.style.display = 'none';
  // Also collapse the inline confirm panel if it was somehow open
  const inlineConfirm = document.getElementById('dt-drawer-unlink-confirm');
  if (inlineConfirm) { inlineConfirm.style.display = 'none'; inlineConfirm.innerHTML = ''; }

  // Side panel — Connectivity + Truck Mode chips become "--"
  const connEl = document.getElementById('dt-drawer-conn');
  if (connEl) { connEl.textContent = '--'; connEl.style.color = 'var(--soft)'; }
  const modeEl = document.getElementById('dt-drawer-mode');
  if (modeEl) modeEl.textContent = '--';
  // Side panel meta — most fields go to "--". Drum manufacturer/size/loads
  // remain because they're physical truck properties that survive a unit swap.
  ['dt-drawer-ver','dt-drawer-commissioned','dt-drawer-last-conn',
   'dt-drawer-last-status','dt-drawer-last-reboot'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '--';
  });

  // Scroll area — illustration + copy + "Connect Unit" CTA
  const scroll = document.getElementById('dt-drawer-scroll');
  if (scroll) {
    scroll.innerHTML = `
      <div class="dt-truck-empty">
        <div class="dt-truck-empty-illust">${dtTruckEmptyIllustrationSvg()}</div>
        <div class="dt-truck-empty-title">Truck Not Connected</div>
        <div class="dt-truck-empty-sub">Attach Verifi hardware to have a connected truck.</div>
        <button class="dt-truck-empty-cta" onclick="dtTruckDrawerOpenAttachUnit()">Connect Unit</button>
      </div>`;
  }
}

/* Illustration matches the Figma's broken-plug graphic — soft blue blob
   background with two unplugged connectors and spark marks. Inline SVG so
   we don't depend on an asset URL that might expire. Sourced from Trinity
   Design System (illustration node), preserving the original viewBox. */
function dtTruckEmptyIllustrationSvg() {
  return `
    <svg width="340" height="340" viewBox="0 0 395 395" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M119.285 104.232C119.285 104.232 161.64 136.374 226.03 76.2745C283.215 22.9019 329.908 107.112 330.235 147.439C330.658 199.677 273.049 241.477 301.007 275.788C328.964 310.099 245.563 366.758 200.615 317.724C144.7 256.726 129.552 306.286 97.6813 306.286C74.8071 306.286 27.8442 249.45 59.5577 207.165C86.2443 171.583 71.6899 159.775 64.6418 147.439C54.4747 129.648 78.6196 81.358 119.285 104.232Z" fill="#DEE9FF"/>
      <path d="M289.326 175.26C291.603 176.106 294.091 176.162 296.458 175.619C306.375 173.343 340.476 167.315 334.55 193.74C333.26 198.983 313.288 228.345 341.731 239.063C343.815 239.858 346.019 240.292 348.249 240.346C357.006 240.527 374.36 238.459 381.623 231.066C390.396 222.135 380.811 226.37 380.811 226.37C380.811 226.37 347.456 240.926 335.674 225.483C334.363 223.765 333.528 221.269 333.289 219.121C332.875 215.396 334.529 210.474 336.701 206.189C339.642 200.389 353.76 174.301 323.108 166.702C316.047 165.02 305.791 163.51 292.568 169.077C284.854 172.324 286.563 174.233 289.326 175.26Z" fill="#BDD6F9"/>
      <path d="M296.152 165.521L287.274 168.844C284.209 169.991 282.654 173.405 283.801 176.47L284.242 177.645C285.389 180.71 288.803 182.265 291.867 181.118L300.745 177.795C303.81 176.648 305.365 173.234 304.218 170.169L303.778 168.993C302.631 165.929 299.216 164.374 296.152 165.521Z" fill="#0E84E5"/>
      <path d="M241.656 175.136L212.377 186.094C210.845 186.667 210.067 188.374 210.641 189.907L210.756 190.215C211.33 191.747 213.037 192.524 214.569 191.951L243.848 180.993C245.381 180.419 246.158 178.712 245.584 177.18L245.469 176.872C244.896 175.339 243.189 174.562 241.656 175.136Z" fill="white"/>
      <path d="M249.828 196.969L220.549 207.927C219.016 208.501 218.239 210.208 218.813 211.74L218.928 212.048C219.501 213.581 221.209 214.358 222.741 213.784L252.02 202.826C253.553 202.253 254.33 200.546 253.756 199.013L253.641 198.705C253.067 197.173 251.36 196.396 249.828 196.969Z" fill="white"/>
      <path d="M276.86 160.235L253.13 169.117C250.065 170.264 248.511 173.678 249.658 176.743L257.759 198.39C258.906 201.455 262.321 203.01 265.385 201.863L289.116 192.981C292.18 191.834 293.735 188.42 292.588 185.355L284.486 163.708C283.339 160.643 279.925 159.088 276.86 160.235Z" fill="#5895F9"/>
      <path d="M255.581 165.915L231.851 174.796C228.786 175.943 227.232 179.357 228.379 182.422L238.045 208.248C239.192 211.313 242.606 212.868 245.671 211.721L269.401 202.839C272.466 201.692 274.02 198.278 272.873 195.213L263.207 169.387C262.06 166.322 258.646 164.768 255.581 165.915Z" fill="#699CFF"/>
      <path d="M259.296 160.673L259.11 160.743C257.067 161.508 256.031 163.784 256.795 165.827L270.336 202.007C271.101 204.05 273.377 205.086 275.42 204.322L275.606 204.252C277.649 203.487 278.686 201.211 277.921 199.168L264.38 162.988C263.615 160.945 261.339 159.909 259.296 160.673Z" fill="#208AF2"/>
      <path d="M17.3259 183.805C17.3259 183.805 64.9842 170.412 58.065 201.269C56.8634 206.151 39.5666 231.291 60.1698 243.361C64.5938 245.953 69.6992 247.101 74.8261 247.074C84.0183 247.026 98.5908 245.257 105.137 238.594C113.911 229.662 104.326 233.898 104.326 233.898C104.326 233.898 76.9551 245.157 62.8737 236.182C58.0656 233.117 55.8862 227.184 57.1919 221.634C57.8592 218.877 58.8755 216.216 60.216 213.716C63.2784 207.981 77.2745 181.829 46.6225 174.229C39.5614 172.548 29.3059 171.037 16.0822 176.605C2.85863 182.172 17.3259 183.805 17.3259 183.805Z" fill="#BDD6F9"/>
      <path d="M111.546 226.993L102.668 230.316C99.6032 231.463 98.0486 234.877 99.1956 237.942L99.6356 239.117C100.783 242.182 104.197 243.737 107.262 242.59L116.14 239.267C119.204 238.12 120.759 234.706 119.612 231.641L119.172 230.465C118.025 227.401 114.61 225.846 111.546 226.993Z" fill="#0E84E5"/>
      <path d="M126.545 212.386L113.388 217.311C110.323 218.458 108.769 221.872 109.916 224.936L116.26 241.889C117.407 244.953 120.821 246.508 123.886 245.361L137.044 240.436C140.108 239.289 141.663 235.875 140.516 232.811L134.171 215.858C133.024 212.794 129.61 211.239 126.545 212.386Z" fill="#5895F9"/>
      <path d="M148.45 199.334L128.828 206.678C125.764 207.825 124.209 211.239 125.356 214.304L135.022 240.131C136.169 243.195 139.583 244.75 142.648 243.603L162.27 236.259C165.334 235.112 166.889 231.698 165.742 228.633L156.076 202.807C154.929 199.742 151.515 198.187 148.45 199.334Z" fill="#699CFF"/>
      <path d="M152.606 193.986L152.42 194.056C150.377 194.82 149.341 197.096 150.105 199.139L163.646 235.319C164.411 237.363 166.687 238.399 168.73 237.634L168.916 237.565C170.959 236.8 171.996 234.524 171.231 232.481L157.69 196.301C156.925 194.258 154.649 193.221 152.606 193.986Z" fill="#208AF2"/>
      <path d="M202.711 170.936C202.005 170.858 201.356 170.508 200.902 169.961C200.448 169.414 200.224 168.712 200.277 168.003L201.741 141.262C201.828 139.665 203.177 138.451 204.708 138.592L206.841 138.79C208.371 138.931 209.467 140.37 209.253 141.956L205.656 168.5C205.573 169.207 205.221 169.855 204.672 170.309C204.124 170.762 203.421 170.987 202.711 170.936Z" fill="#418DF9"/>
      <path d="M190.07 173.242C189.85 173.307 189.62 173.327 189.392 173.303C189.164 173.278 188.943 173.209 188.742 173.1C188.541 172.99 188.364 172.841 188.22 172.663C188.076 172.485 187.969 172.28 187.904 172.06L182.676 155.425C182.524 154.952 182.566 154.438 182.793 153.996C183.019 153.554 183.412 153.219 183.885 153.066L185.238 152.658C185.47 152.59 185.714 152.571 185.954 152.602C186.194 152.634 186.425 152.714 186.632 152.839C186.839 152.964 187.018 153.13 187.158 153.328C187.298 153.526 187.395 153.75 187.443 153.987L191.318 171.03C191.426 171.488 191.358 171.97 191.126 172.38C190.895 172.79 190.518 173.098 190.07 173.242Z" fill="#418DF9"/>
      <path d="M183.015 182.835C182.078 183.995 180.194 183.982 178.744 182.803L152.996 161.884C151.458 160.634 151.004 158.566 151.998 157.335L153.383 155.62C154.377 154.388 156.418 154.489 157.873 155.841L182.236 178.477C183.608 179.752 183.951 181.674 183.015 182.835Z" fill="#418DF9"/>
      <path d="M194.917 236.868C195.58 237.124 196.118 237.628 196.417 238.272C196.716 238.917 196.754 239.653 196.522 240.325L188.277 265.805C187.784 267.327 186.17 268.155 184.726 267.629L182.713 266.893C181.269 266.366 180.576 264.694 181.189 263.216L191.447 238.471C191.707 237.809 192.213 237.272 192.86 236.973C193.506 236.674 194.243 236.636 194.917 236.868Z" fill="#418DF9"/>
      <path d="M207.728 237.867C207.957 237.861 208.185 237.9 208.399 237.981C208.613 238.063 208.809 238.186 208.975 238.344C209.141 238.501 209.275 238.69 209.368 238.899C209.462 239.108 209.513 239.334 209.52 239.563L210.326 256.981C210.352 257.477 210.181 257.964 209.849 258.334C209.517 258.703 209.052 258.926 208.555 258.954L207.142 259.003C206.9 259.009 206.66 258.965 206.436 258.874C206.212 258.782 206.009 258.645 205.841 258.472C205.672 258.298 205.541 258.091 205.457 257.864C205.372 257.638 205.336 257.396 205.349 257.154L205.956 239.687C205.969 239.216 206.158 238.768 206.486 238.431C206.815 238.094 207.258 237.892 207.728 237.867Z" fill="#418DF9"/>
      <path d="M216.999 230.394C218.201 229.511 220.019 230.006 221.12 231.515L240.672 258.316C241.839 259.917 241.75 262.032 240.474 262.969L238.697 264.274C237.422 265.21 235.474 264.591 234.412 262.912L216.637 234.805C215.638 233.223 215.796 231.277 216.999 230.394Z" fill="#418DF9"/>
    </svg>`;
}

/* Connect Unit / Attach Unit tab handler — placeholder for the truck-side
   attach flow (pick a unit to attach to this truck). For now, surfaces a
   helpful message so users understand what to do; full picker comes next. */
/* Logs tab handler in the unlinked state — re-renders the empty state.
   Used when the user navigates back to Logs after visiting Attach Unit.
   Routing through dtDrawerTab('logs') would render the full Linked-truck
   logs analyzer, which doesn't apply when there's no unit reporting. */
function dtTruckDrawerShowUnlinkedLogs() {
  // Update tab active state — Logs is index 0
  document.querySelectorAll('#dt-drawer-tabs .dt-drawer-tab').forEach(t => t.classList.remove('active'));
  const tabs = document.querySelectorAll('#dt-drawer-tabs .dt-drawer-tab');
  if (tabs.length >= 1) tabs[0].classList.add('active');

  const scroll = document.getElementById('dt-drawer-scroll');
  if (!scroll) return;
  scroll.innerHTML = `
    <div class="dt-truck-empty">
      <div class="dt-truck-empty-illust">${dtTruckEmptyIllustrationSvg()}</div>
      <div class="dt-truck-empty-title">Truck Not Connected</div>
      <div class="dt-truck-empty-sub">Attach Verifi hardware to have a connected truck.</div>
      <button class="dt-truck-empty-cta" onclick="dtTruckDrawerOpenAttachUnit()">Connect Unit</button>
    </div>`;
}

/* ════════════════════════════════════════════════════════════
   TRUCK DRAWER → ATTACH UNIT (truck-side picker)
   Mirror of the unit-side Attach to Truck flow. From an unlinked truck,
   the user picks a unit out of all the Unlinked Unit candidates. Same UX
   patterns: table of options with search, click-to-select, toolbar-row
   inline confirm. On confirm, the unit goes to Pending and the user is
   pivoted into the unit drawer's Configuration tab in edit mode — same
   completion path as the unit-side flow, so we have one source of truth
   for the Pending → Linked workflow.
═══════════════════════════════════════════════════════════ */

let dtTrAttachSelected = null;  // currently-selected unit id (null = none)
let dtTrAttachQuery    = '';    // search query

function dtTruckDrawerOpenAttachUnit() {
  // Reset state on each open so a previous selection doesn't carry over
  dtTrAttachSelected = null;
  dtTrAttachQuery    = '';

  // Tab active state
  document.querySelectorAll('#dt-drawer-tabs .dt-drawer-tab').forEach(t => t.classList.remove('active'));
  const tabs = document.querySelectorAll('#dt-drawer-tabs .dt-drawer-tab');
  if (tabs.length >= 2) tabs[1].classList.add('active');

  dtTruckDrawerRenderAttachUnit();
}

function dtTruckDrawerRenderAttachUnit() {
  const truckNum = dtDrawerTruckNum;
  if (!truckNum) return;

  const allUnits = (typeof UNITS_DATA !== 'undefined') ? UNITS_DATA : [];
  // Only Unlinked Units belonging to the active account are valid candidates.
  // Units from other accounts are not visible to this customer.
  const candidates = allUnits.filter(u =>
    u.status === 'Unlinked Unit' &&
    u.contract === ACTIVE_ACCOUNT
  );
  const q = (dtTrAttachQuery || '').toLowerCase();
  const filtered = candidates.filter(u =>
    !q ||
    String(u.id).toLowerCase().includes(q) ||
    (u.contract || '').toLowerCase().includes(q) ||
    (u.sysType  || '').toLowerCase().includes(q) ||
    (u.config   || '').toLowerCase().includes(q) ||
    (u.tgw      || '').toLowerCase().includes(q)
  );

  const cols = [
    { id:'id',         label:'Unit ID',       width:140 },
    { id:'contract',   label:'Contract',      width:130 },
    { id:'sysType',    label:'System Type',   width:160 },
    { id:'config',     label:'Config',        width:220 },
    { id:'firstComm',  label:'Commissioned',  width:140 },
    { id:'status',     label:'Status',        width:140 },
  ];

  const headerCells = cols.map((c, i) => {
    const isLast = i === cols.length - 1;
    return `
      <div class="dt-attach-th" style="width:${c.width}px;${isLast ? 'flex:1;' : ''}">
        <span class="dt-attach-th-label">${c.label}</span>
        <div class="dt-attach-th-menu">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="3" r="1.2" fill="#36322d"/>
            <circle cx="8" cy="8" r="1.2" fill="#36322d"/>
            <circle cx="8" cy="13" r="1.2" fill="#36322d"/>
          </svg>
        </div>
        ${isLast ? '' : '<div class="dt-attach-th-divider"></div>'}
      </div>`;
  }).join('');

  const rows = filtered.map((u, i) => {
    const sel  = dtTrAttachSelected === u.id;
    const safe = String(u.id).split("'").join("\\'");
    const alt  = i % 2 === 1;
    return `
      <div class="dt-attach-row${sel ? ' selected' : ''}${alt ? ' alt' : ''}" onclick="dtTrAttachSelect('${safe}')">
        <div class="dt-attach-cell" style="width:${cols[0].width}px;">${u.id}</div>
        <div class="dt-attach-cell" style="width:${cols[1].width}px;">${u.contract || '—'}</div>
        <div class="dt-attach-cell" style="width:${cols[2].width}px;">${u.sysType || '—'}</div>
        <div class="dt-attach-cell" style="width:${cols[3].width}px;">${u.config || '—'}</div>
        <div class="dt-attach-cell" style="width:${cols[4].width}px;">${u.firstCommissioned || '—'}</div>
        <div class="dt-attach-cell" style="flex:1;">Unlinked Unit</div>
      </div>`;
  }).join('');

  const empty = filtered.length === 0
    ? `<div class="dt-attach-empty">${candidates.length === 0 ? 'No unlinked units available. Add a new unit from the Units page.' : 'No unlinked units match your search.'}</div>`
    : '';

  const btnDisabled = !dtTrAttachSelected;

  const scroll = document.getElementById('dt-drawer-scroll');
  if (!scroll) return;
  scroll.innerHTML = `
    <div class="dt-attach-title">${candidates.length} Unit${candidates.length === 1 ? '' : 's'} Unlinked</div>

    <div class="dt-attach-toolbar" id="dt-tr-attach-toolbar">
      <div class="dt-attach-search">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="#36322d9e" stroke-width="1.4"/><path d="M11 11l2.5 2.5" stroke="#36322d9e" stroke-width="1.4" stroke-linecap="round"/></svg>
        <input id="dt-tr-attach-search" placeholder="Search" autocomplete="off"
               value="${dtTrAttachQuery.split('"').join('&quot;')}"
               oninput="dtTrAttachSearch()" />
      </div>
      <button class="dt-attach-cta" ${btnDisabled ? 'disabled' : ''} onclick="dtTrAttachConfirm()">
        Attach Unit
      </button>
    </div>

    <!-- Inline link-confirm — replaces the toolbar row when the user clicks
         Attach Unit. Same height + horizontal position, so the unit table
         below doesn't shift and the selected row stays exactly in place. -->
    <div id="dt-tr-attach-confirm" class="dt-inline-confirm informational toolbar-row" style="display:none;"></div>

    <div class="dt-attach-table">
      <div class="dt-attach-table-hdr">
        ${headerCells}
      </div>
      <div class="dt-attach-table-body" id="dt-tr-attach-table-body">
        ${rows}${empty}
      </div>
    </div>
  `;
}

function dtTrAttachSelect(unitId) {
  dtTrAttachSelected = dtTrAttachSelected === unitId ? null : unitId;
  // Update row selection without re-rendering (preserves search focus)
  document.querySelectorAll('#dt-tr-attach-table-body .dt-attach-row').forEach(r => r.classList.remove('selected'));
  if (dtTrAttachSelected) {
    const safe = String(dtTrAttachSelected).split("'").join("\\'");
    const row = document.querySelector(`#dt-tr-attach-table-body .dt-attach-row[onclick*="${safe}"]`);
    if (row) row.classList.add('selected');
  }
  // Toggle the Attach Unit CTA
  const cta = document.querySelector('#dt-drawer-scroll .dt-attach-cta');
  if (cta) cta.disabled = !dtTrAttachSelected;
}

function dtTrAttachSearch() {
  dtTrAttachQuery = document.getElementById('dt-tr-attach-search').value;
  dtTruckDrawerRenderAttachUnit();
  // Restore focus + caret since we re-rendered the input
  const input = document.getElementById('dt-tr-attach-search');
  if (input) {
    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }
}

function dtTrAttachConfirm() {
  if (!dtTrAttachSelected || !dtDrawerTruckNum) return;
  const panel = document.getElementById('dt-tr-attach-confirm');
  if (!panel) return;
  panel.innerHTML = `
    <div class="dt-inline-confirm-head">
      <div class="dt-inline-confirm-icon">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 3.5" stroke="#3069e3" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" stroke="#3069e3" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="dt-inline-confirm-text">
        <div class="dt-inline-confirm-title">Link Unit ${dtTrAttachSelected} to Truck ${dtDrawerTruckNum}?</div>
        <div class="dt-inline-confirm-body">Unit moves to Pending Configuration — fill in config, then save to finalize.</div>
      </div>
    </div>
    <div class="dt-inline-confirm-btns">
      <button class="dt-inline-confirm-btn cancel" onclick="dtTrAttachCancel()">Cancel</button>
      <button class="dt-inline-confirm-btn primary" onclick="dtTrAttachDo()">Link to unit</button>
    </div>`;
  panel.style.display = 'flex';
  const toolbar = document.getElementById('dt-tr-attach-toolbar');
  if (toolbar) toolbar.style.display = 'none';
}

function dtTrAttachCancel() {
  const panel = document.getElementById('dt-tr-attach-confirm');
  if (panel) { panel.style.display = 'none'; panel.innerHTML = ''; }
  const toolbar = document.getElementById('dt-tr-attach-toolbar');
  if (toolbar) toolbar.style.display = '';
  const cta = document.querySelector('#dt-drawer-scroll .dt-attach-cta');
  if (cta) cta.disabled = !dtTrAttachSelected;
}

function dtTrAttachDo() {
  dtTrAttachCancel();
  if (!dtTrAttachSelected || !dtDrawerTruckNum) return;

  const truckNum = dtDrawerTruckNum;
  const u = UNITS_DATA.find(x => x.id === dtTrAttachSelected);
  if (!u) return;

  // Stage 1 of the link — set Pending, claim the truck. This mirrors the
  // mutations in dtUdAttachDo so the Pending state is identical regardless
  // of which side initiated. Capture original state for revert-on-cancel.
  dtUdPendingPrevState = {
    unitId: u.id,
    prevStatus: u.status,        // 'Unlinked Unit'
    prevTruck:  u.truck,          // '--'
    prevAssigned: u.assignedToTruck || null,
    truckSnapshot: (typeof UNLINKED_TRUCKS !== 'undefined')
      ? UNLINKED_TRUCKS.find(t => t.number === truckNum)
      : null,
  };

  u.status = 'Pending';
  u.truck  = truckNum;
  u.assignedToTruck = new Date().toLocaleDateString('en-US', {month:'2-digit',day:'2-digit',year:'numeric'});

  // Remove the truck from the unlinked pool while pending — if the user
  // cancels mid-config we'll put it back via dtUdRevertPending.
  const idx = (typeof UNLINKED_TRUCKS !== 'undefined')
    ? UNLINKED_TRUCKS.findIndex(t => t.number === truckNum) : -1;
  if (idx > -1) UNLINKED_TRUCKS.splice(idx, 1);

  // Refresh the units table so the unit's status reflects Pending immediately
  if (typeof dtUnitsRender === 'function') dtUnitsRender();

  // Pivot to the unit drawer. dtUdOpen detects status === 'Pending' and
  // routes to Configuration tab in edit mode automatically — same completion
  // path as the unit-side flow, so the rest of the workflow (Save & Link
  // → Linked) is shared logic.
  dtTruckOpenedFromUnit = null;  // we're going TO the unit, not FROM it
  dtUdJumpToUnitFromTruck(u.id);
}


function dtCloseDrawer() {  const drawer = document.getElementById('dt-drawer');
  drawer.classList.remove('open');
  document.getElementById('dt-drawer-scrim').classList.remove('open');
  dtDrawerTruckNum = null;
  // Reset Logs tab state so a stale selection doesn't survive into a fresh open
  if (typeof dtLogsSelectedId !== 'undefined') dtLogsSelectedId = null;
  if (typeof dtLogsEdTab !== 'undefined') dtLogsEdTab = 'structured';
  // Stop sensor ticker if it was running
  if (typeof senStop === 'function') senStop();
  // Closing normally clears any cross-drawer breadcrumb — a future truck open
  // shouldn't show "Back to Unit" unless the user pivoted in fresh.
  dtTruckOpenedFromUnit = null;
}

function dtDrawerNav(dir) {
  /* Navigate to prev/next truck in the current filtered list */
  const allNums = [];
  truckGroups.forEach(g => g.trucks.forEach(t => { if (!t.unlinked) allNums.push(t.num); }));
  const idx = allNums.indexOf(dtDrawerTruckNum);
  if (idx === -1) return;
  const next = allNums[idx + dir];
  if (next) dtOpenTruck(next);
}

/* ── COMPONENT TIMELINE ─────────────────────────────────── */
/* ══════════════════════════════════════════════════════════
   DESKTOP COMPONENT TIMELINE — data + interaction
══════════════════════════════════════════════════════════ */

/* Segments defined in MINUTES (out of 1440 = 24hrs).
   flex value = minutes so proportions are always correct.
   Types: g=ignition-on, x=ignition-off, w=warning pill, a=alarm pill, T=tall alarm pill */
const DT_TIMELINE_DAYS = (() => {
  const G = (m) => ({ m, t:'g' });
  const X = (m) => ({ m, t:'x' });
  const W = (m, l) => ({ m, t:'w', label:l });
  const A = (m, l) => ({ m, t:'a', label:l });
  const T = (m, l) => ({ m, t:'T', label:l });

  const day0 = [
    [G(500),W(15,'15 m'),G(925)],
    [G(1440)],[G(1440)],[G(1440)],[G(1440)],[G(1440)],[G(1440)],[G(1440)],[G(1440)],
  ];
  const day1 = [
    [G(1440)],
    [G(480),W(30,'30 m'),G(930)],
    [G(960),W(15,'15 m'),G(465)],
    [G(1440)],[G(1440)],[G(1440)],[G(1440)],[G(1440)],[G(1440)],
  ];
  const day2 = [
    [G(1440)],[G(1440)],[G(1440)],[G(1440)],[G(1440)],[G(1440)],[G(1440)],
    [G(600),A(15,'15 m'),G(825)],
    [G(1440)],
  ];
  const day3 = [
    [G(1440)],[G(1440)],[G(1440)],
    [G(240),A(15,'15 m'),G(60),A(15,'15 m'),G(1110)],
    [G(1440)],[G(1440)],[G(1440)],
    [G(240),A(15,'15 m'),G(60),A(15,'15 m'),G(1110)],
    [G(1440)],
  ];
  const day4 = [
    [G(1440)],[G(1440)],[G(1440)],
    [G(240),A(15,'15 m'),G(60),A(15,'15 m'),G(60),A(15,'15 m'),G(1035)],
    [G(1440)],[G(1440)],
    [G(480),W(15,'15 m'),G(945)],
    [G(240),A(15,'15 m'),G(60),A(15,'15 m'),G(60),A(15,'15 m'),G(1035)],
    [G(480),W(15,'15 m'),G(945)],
  ];
  const day5 = [
    [G(460),W(15,'15 m'),G(965)],
    [G(460),W(30,'30 m'),G(950)],
    [G(1440)],
    [G(240),A(15,'15 m'),G(60),A(15,'15 m'),G(60),A(15,'15 m'),G(60),A(15,'15 m'),G(960)],
    [G(460),W(15,'15 m'),G(965)],
    [G(1440)],
    [G(460),W(15,'15 m'),G(965)],
    [G(240),A(15,'15 m'),G(60),A(15,'15 m'),G(60),A(15,'15 m'),G(60),A(15,'15 m'),G(960)],
    [G(460),W(15,'15 m'),G(965)],
  ];
  const day6 = [
    [G(460),W(15,'15 m'),G(192),T(300,'5h'),G(54),W(15,'15 m'),X(50),G(46),X(50),G(258)],
    [G(460),W(30,'30 m'),G(524),X(50),G(46),X(50),G(280)],
    [G(1134),X(50),G(46),X(50),W(15,'15 m'),G(145)],
    [G(240),A(15,'15 m'),G(66),A(15,'15 m'),G(66),A(15,'15 m'),G(66),A(15,'15 m'),G(66),A(15,'15 m'),G(74),X(50),G(46),X(50),G(28),A(30,'30 m'),G(583)],
    [G(448),W(15,'15 m'),G(140),T(270,'4h 30m'),G(82),A(15,'15 m'),X(50),G(46),X(50),G(324)],
    [G(1134),X(50),G(46),X(50),G(160)],
    [G(460),W(15,'15 m'),G(240),T(240,'4h'),G(138),X(50),G(46),X(50),G(28),A(30,'30 m'),G(143)],
    [G(240),A(15,'15 m'),G(66),A(15,'15 m'),G(66),A(15,'15 m'),G(66),A(15,'15 m'),G(66),A(15,'15 m'),G(74),X(50),G(46),X(50),G(28),A(30,'30 m'),G(583)],
    [A(1440,'24h')],
  ];

  return [day0, day1, day2, day3, day4, day5, day6];
})();

let dtTimelineActiveDayIdx = 6;

function dtTimelineSelectDay(idx) {
  dtTimelineActiveDayIdx = idx;
  for (let i = 0; i < 7; i++) {
    const cell = document.getElementById('dt-day-' + i);
    if (!cell) continue;
    const inner = cell.querySelector('div');
    if (!inner) continue;
    if (i === idx) {
      cell.style.padding = '4px';
      inner.style.background = document.body.classList.contains('dark') ? 'var(--layer-1)' : 'white';
      inner.style.borderRadius = '12px';
      inner.style.padding = '8px 12px';
      inner.style.display = 'inline-flex';
      inner.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
    } else {
      cell.style.padding = '0';
      inner.style.background = 'transparent';
      inner.style.borderRadius = '0';
      inner.style.padding = '0';
      inner.style.boxShadow = 'none';
    }
  }
  const today = new Date();
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const d = new Date(today);
  d.setDate(today.getDate() - (6 - idx));
  const isToday = idx === 6;
  const label = isToday
    ? `Today ${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`
    : `${DAY_NAMES[d.getDay()]} ${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
  const el = document.getElementById('dt-timeline-date-label');
  if (el) el.textContent = label;
  dtTimelineRenderRows(idx);
}

function dtTimelineNav(dir) {
  const next = Math.max(0, Math.min(6, dtTimelineActiveDayIdx + dir));
  dtTimelineSelectDay(next);
}

function dtTimelineRenderRows(idx) {
  const container = document.getElementById('dt-timeline-rows');
  if (!container) return;

  const ALARM_SVG = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.375 0H8.25C9.00195 0 9.625 0.623047 9.625 1.375V8.25C9.625 9.02344 9.00195 9.625 8.25 9.625H1.375C0.601562 9.625 0 9.02344 0 8.25V1.375C0 0.623047 0.601562 0 1.375 0ZM4.8125 2.0625C4.51172 2.0625 4.29688 2.29883 4.29688 2.57812V4.98438C4.29688 5.28516 4.51172 5.5 4.8125 5.5C5.0918 5.5 5.32812 5.28516 5.32812 4.98438V2.57812C5.32812 2.29883 5.0918 2.0625 4.8125 2.0625ZM4.125 6.875C4.125 7.26172 4.42578 7.5625 4.8125 7.5625C5.17773 7.5625 5.5 7.26172 5.5 6.875C5.5 6.50977 5.17773 6.1875 4.8125 6.1875C4.42578 6.1875 4.125 6.50977 4.125 6.875Z" fill="white"/></svg>`;
  const WARN_SVG  = `<svg width="10" height="10" viewBox="0 0 12 10" fill="none"><path d="M5.54297 0C5.84375 0 6.12305 0.171875 6.27344 0.429688L10.9141 8.33594C11.0645 8.61523 11.0645 8.9375 10.9141 9.19531C10.7637 9.47461 10.4844 9.625 10.1836 9.625H0.902344C0.580078 9.625 0.300781 9.47461 0.150391 9.19531C0 8.9375 0 8.61523 0.150391 8.33594L4.79102 0.429688C4.94141 0.171875 5.2207 0 5.54297 0ZM5.54297 2.75C5.24219 2.75 5.02734 2.98633 5.02734 3.26562V5.67188C5.02734 5.97266 5.24219 6.1875 5.54297 6.1875C5.82227 6.1875 6.05859 5.97266 6.05859 5.67188V3.26562C6.05859 2.98633 5.82227 2.75 5.54297 2.75ZM6.23047 7.5625C6.23047 7.19727 5.9082 6.875 5.54297 6.875C5.15625 6.875 4.85547 7.19727 4.85547 7.5625C4.85547 7.94922 5.15625 8.25 5.54297 8.25C5.9082 8.25 6.23047 7.94922 6.23047 7.5625Z" fill="#894F18"/></svg>`;

  const dayRows = DT_TIMELINE_DAYS[idx] || DT_TIMELINE_DAYS[6];
  const ROW_H = 64;

  function seg(s, isLast) {
    const thin = s.t === 'g' || s.t === 'x';
    const _dark = document.body.classList.contains('dark');
    const ignOn  = _dark ? 'rgba(46,207,29,0.45)' : '#afdbb3';
    const ignOff = _dark ? 'rgba(255,255,255,0.18)' : '#d9d9d9';
    const bg   = s.t==='g' ? ignOn : s.t==='x' ? ignOff : s.t==='w' ? '#ffba0d' : '#d70100';
    const op   = s.t==='g' ? 'opacity:0.5;' : '';
    const h    = thin ? 'height:5px;' : s.t==='T' ? 'align-self:stretch;' : 'height:28px;';
    /* Proportional flex based on minutes; last segment fills remaining space */
    const flexVal = isLast ? '1 1 0' : `${s.m} 0 0`;
    /* Min-width: just enough to show the icon + label for alarm/warning pills.
       A flat 40px floor for all durations — the flex proportions do the
       positioning work. A 15-min bar and a 75-min bar both need ~40px to be
       readable; scaling min-width with duration caused longer bars to stretch
       far beyond their actual time span on the axis. */
    const minW = thin ? 'min-width:0;' : 'min-width:40px;';
    let inner = '';
    let interactive = '';
    if (!thin) {
      const textColor = s.t==='w' ? '#894f18' : 'white';
      const icon = s.t==='w' ? WARN_SVG : ALARM_SVG;
      /* Icon hidden via overflow when pill is very narrow; text always visible */
      inner = `<span style="display:inline-flex;align-items:center;gap:2px;font-size:10px;font-weight:600;color:${textColor};white-space:nowrap;overflow:hidden;max-width:100%;">
        <span class="dt-pill-icon" style="display:inline-flex;flex-shrink:0;">${icon}</span>
        <span style="flex-shrink:0;">${s.label}</span>
      </span>`;
      /* Make alarm/warning pills clickable — jump to relevant Truck Log entry */
      const sevType = (s.t === 'w') ? 'warn' : 'alarm';
      interactive = ` class="dt-tl-alert" onclick="dtTimelineOpenLog('${sevType}')" title="View triggering log entry"`;
    }
    return `<div${interactive} style="flex:${flexVal};${minW}background:${bg};${op}${h}border-radius:5px;display:flex;align-items:center;justify-content:center;overflow:hidden;${!thin ? 'cursor:pointer;' : ''}">${inner}</div>`;
  }

  container.innerHTML = dayRows.map((segs, ri) => {
    const _rowDark = document.body.classList.contains('dark');
    const bg = ri % 2 === 0 ? (_rowDark ? 'var(--layer-1)' : 'white') : (_rowDark ? 'var(--layer-2)' : '#f6f4f2');
    return `<div style="height:${ROW_H}px;display:flex;align-items:center;background:${bg};padding:0 12px;width:100%;">
      <div style="flex:1;display:flex;align-items:center;height:28px;gap:2px;overflow:hidden;">${segs.map((s,si) => seg(s, si===segs.length-1)).join('')}</div>
    </div>`;
  }).join('');

  /* After render: hide icon only when the pill is truly too narrow for it
     (text alone fits ~28px; icon + gap needs another ~14px). */
  requestAnimationFrame(() => {
    container.querySelectorAll('.dt-pill-icon').forEach(iconEl => {
      const pill = iconEl.closest('[style*="border-radius:5px"]');
      if (pill) iconEl.style.display = pill.getBoundingClientRect().width < 38 ? 'none' : 'inline-flex';
    });
  });
}

/* ════════════════════════════════════════════════════════════
   DESKTOP TRUCK LOGS TAB
   Two-pane layout: filters + search + table on left, Event
   Details inspector swapped into the existing .dt-drawer-side
   on the right. Selecting a row updates the side panel in place.
   ──────────────────────────────────────────────────────────── */

/* ── Extended log dataset — adds source, sentTime, and a SystemStatus snapshot
      for use in Structured / Raw JSON. Keeps the original `logs` array intact
      for the mobile flow; this is a desktop-side enrichment. ── */
/* Real-world rows. Message Type matches the protobuf message_type values
   from the dropdown screenshot: BackendRequest, DeviceBinding, Event, Identity.
   For Event rows, `sub` is the event_type within the Event message. */
/* DT_LOGS_ROWS and DT_LOGS_SUB_TYPES now point to the unified TL_ROWS dataset */
const DT_LOGS_ROWS = TL_ROWS;

const DT_LOGS_SUB_TYPES = {
  'Event':              ['CalculatedArriveSite','ConcreteStatus','DriverAction','FluidAdd','FluidDoseSummary','FluidError','GPSLocation','IgnitionChange','NetworkChange','OperatingMode','Shutdown','SpeedChangeData','StartUp','SystemStatus','TicketReceived','TruckHealth'],
  'BackendRequest':     ['ALL_PLANTS_GEOFENCES','WEATHER','ConfigurationSync','SoftwareUpdate'],
  'DeviceBinding':      ['DrumSensor','WaterModule','WDS','IOX'],
  'WirelessDrumBinding':['UnboundTC3Notification','BoundNotification'],
  'Identity':           ['Identity'],
};

/* Logs filter / selection state */
let dtLogsFilters = {
  from: '', to: '',
  source: 'all',
  msgType: 'all',
  subType: 'all',
  search: ''
};
let dtLogsSelectedId = null;
let dtLogsEdTab = 'structured';

/* ── Build the Logs tab markup (left pane) ── */
function dtBuildLogs() {
  return `
    <div id="dt-state-logs">
      <!-- Filter row -->
      <div class="dt-logs-filters">
        <div class="dt-logs-field dt-logs-field-date">
          <div class="dt-logs-field-label">Custom time period</div>
          <div class="dt-logs-date-row">
            <input class="dt-logs-date-input from" id="dt-logs-from" type="text" placeholder="From: dd/mm/yy"
                   onfocus="this.type='date'" onblur="if(!this.value)this.type='text'"
                   oninput="dtLogsFilters.from=this.value;dtLogsRender();">
            <input class="dt-logs-date-input to"   id="dt-logs-to"   type="text" placeholder="To: dd/mm/yy"
                   onfocus="this.type='date'" onblur="if(!this.value)this.type='text'"
                   oninput="dtLogsFilters.to=this.value;dtLogsRender();">
          </div>
        </div>

        <div class="dt-logs-field dt-logs-field-source">
          <div class="dt-logs-field-label">Source</div>
          <select class="dt-logs-select" id="dt-logs-source" onchange="dtLogsFilters.source=this.value;dtLogsRender();">
            <option value="all">All</option>
            <option value="TRUCK">TRUCK</option>
            <option value="ICD">ICD</option>
            <option value="BACKEND">BACKEND</option>
          </select>
        </div>

        <div class="dt-logs-field dt-logs-field-msgtype">
          <div class="dt-logs-field-label">Message Type</div>
          <select class="dt-logs-select" id="dt-logs-msgtype" onchange="dtLogsOnMsgTypeChange(this.value)">
            <option value="all">All</option>
            <option value="BackendRequest">BackendRequest</option>
            <option value="DeviceBinding">DeviceBinding</option>
            <option value="Event">Event</option>
            <option value="Identity">Identity</option>
          </select>
        </div>

        <div class="dt-logs-field dt-logs-field-subtype">
          <div class="dt-logs-field-label">Sub Message Type</div>
          <select class="dt-logs-select" id="dt-logs-subtype" disabled
                  onchange="dtLogsFilters.subType=this.value;dtLogsRender();">
            <option value="all">All</option>
          </select>
          <div class="dt-logs-field-helper" id="dt-logs-subtype-helper">Select a message type first</div>
        </div>
      </div>

      <!-- Search + Refresh -->
      <div class="dt-logs-search-wrap">
        <div class="dt-logs-search">
          <svg class="dt-logs-search-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="2.5" width="12" height="15" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <path d="M7 7h6M7 10.5h6M7 14h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <input class="dt-logs-search-input" id="dt-logs-search" type="text" placeholder="Search"
                 oninput="dtLogsFilters.search=this.value;dtLogsRender();">
        </div>
        <button class="dt-logs-refresh-btn" id="dt-logs-refresh-btn" onclick="dtLogsRefresh()" title="Refresh logs">
          <svg id="dt-logs-refresh-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.8 0 3.4.87 4.4 2.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M12 2v3h-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span id="dt-logs-refresh-label">Refresh</span>
        </button>
      </div>

      <!-- Table -->
      <div class="dt-logs-table-wrap">
        <table class="dt-logs-table">
          <thead>
            <tr>
              ${['Message Time','Sent Time','Source','Message Type','Message Sub Type'].map(h => `
                <th><div class="dt-logs-th-inner">
                  <span>${h}</span>
                  <span class="dt-logs-th-menu" title="Column options">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="3" r="1.1" fill="#36322d"/><circle cx="7" cy="7" r="1.1" fill="#36322d"/><circle cx="7" cy="11" r="1.1" fill="#36322d"/></svg>
                  </span>
                </div></th>
              `).join('')}
            </tr>
          </thead>
          <tbody id="dt-logs-tbody"></tbody>
        </table>
      </div>
    </div>
  `;
}

/* Dependent dropdown — Sub Message Type unlocks once a Message Type is picked */
function dtLogsOnMsgTypeChange(val) {
  dtLogsFilters.msgType = val;
  dtLogsFilters.subType = 'all';
  const sub = document.getElementById('dt-logs-subtype');
  const helper = document.getElementById('dt-logs-subtype-helper');
  if (val === 'all') {
    sub.disabled = true;
    sub.innerHTML = `<option value="all">All</option>`;
    helper.textContent = 'Select a message type first';
  } else {
    sub.disabled = false;
    const options = DT_LOGS_SUB_TYPES[val] || [];
    sub.innerHTML = `<option value="all">All</option>` +
      options.map(o => `<option value="${o}">${o}</option>`).join('');
    helper.textContent = '';
  }
  dtLogsRender();
}

/* Apply filters and render the table body */
function dtLogsRefresh() {
  const btn   = document.getElementById('dt-logs-refresh-btn');
  const icon  = document.getElementById('dt-logs-refresh-icon');
  const label = document.getElementById('dt-logs-refresh-label');
  if (!btn) return;

  // Phase 1 — spinning
  btn.classList.add('refreshing');
  if (label) label.textContent = 'Refreshing…';

  setTimeout(() => {
    // Re-render the log table (simulates fresh data arriving)
    dtLogsRender();

    // Phase 2 — done
    btn.classList.remove('refreshing');
    btn.classList.add('refreshed');
    if (icon) icon.innerHTML = `<path d="M3 8l3.5 3.5L13 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (label) label.textContent = 'Updated';

    // Phase 3 — settle back
    setTimeout(() => {
      btn.classList.remove('refreshed');
      if (icon) icon.innerHTML = `<path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.8 0 3.4.87 4.4 2.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 2v3h-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (label) label.textContent = 'Refresh';
    }, 1800);
  }, 900);
}

function dtLogsRender() {
  const tbody = document.getElementById('dt-logs-tbody');
  if (!tbody) return;

  const f = dtLogsFilters;
  const search = (f.search || '').trim().toLowerCase();

  // Convert MM/DD/YYYY -> Date for range checks
  const toDate = (str) => {
    const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? new Date(+m[3], +m[1] - 1, +m[2]) : null;
  };
  const fromDate = f.from ? new Date(f.from) : null;
  const toDateF  = f.to   ? new Date(f.to)   : null;

  const rows = DT_LOGS_ROWS.filter(r => {
    if (f.source !== 'all' && r.source !== f.source) return false;
    if (f.msgType !== 'all' && r.type !== f.msgType) return false;
    if (f.subType !== 'all' && r.sub !== f.subType) return false;
    const d = toDate(r.date);
    if (fromDate && d && d < fromDate) return false;
    if (toDateF && d && d > toDateF) return false;
    if (search) {
      const hay = `${r.date} ${r.time} ${r.sentTime} ${r.source} ${r.type} ${r.sub}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="dt-logs-empty">No logs match the current filters</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr data-id="${r.id}" class="${r.id === dtLogsSelectedId ? 'active' : ''}" onclick="dtLogsSelectRow(${r.id})">
      <td>${r.date} ${r.time}</td>
      <td>${r.sentTime}</td>
      <td>${r.source}</td>
      <td>${r.type}</td>
      <td>${r.sub}</td>
    </tr>
  `).join('');
}

/* Selecting a row populates the side panel Event Details inspector */
function dtLogsSelectRow(id, opts) {
  dtLogsSelectedId = id;
  const tbody = document.getElementById('dt-logs-tbody');
  if (!tbody) return;
  // visual selection
  let activeTr = null;
  tbody.querySelectorAll('tr').forEach(tr => {
    const isActive = +tr.dataset.id === id;
    tr.classList.toggle('active', isActive);
    if (isActive) activeTr = tr;
  });
  // scroll into view if needed (only when invoked via keyboard)
  if (activeTr && opts && opts.scrollIntoView) {
    activeTr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  dtLogsRenderEventDetails();
}

/* Keyboard navigation — ↑/↓ walk the currently-rendered rows.
   Active only when the Logs tab is showing and focus is not in a form field. */
function dtLogsKeyNav(e) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  // Logs tab must be active (has a tbody in the DOM)
  const tbody = document.getElementById('dt-logs-tbody');
  if (!tbody) return;
  // Don't hijack typing/cursor movement in form fields
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;

  const rows = Array.from(tbody.querySelectorAll('tr[data-id]'));
  if (rows.length === 0) return;

  e.preventDefault();
  const ids = rows.map(r => +r.dataset.id);
  let idx = ids.indexOf(dtLogsSelectedId);
  if (idx === -1) {
    // No prior selection: ↓ picks first, ↑ picks last
    idx = e.key === 'ArrowDown' ? 0 : ids.length - 1;
  } else {
    if (e.key === 'ArrowDown') idx = Math.min(idx + 1, ids.length - 1);
    else                       idx = Math.max(idx - 1, 0);
  }
  dtLogsSelectRow(ids[idx], { scrollIntoView: true });
}

// Wire keyboard nav once. Safe to attach on every Logs build because we guard.
if (typeof window !== 'undefined' && !window.__dtLogsKeyNavBound) {
  document.addEventListener('keydown', dtLogsKeyNav);
  window.__dtLogsKeyNavBound = true;
}

/* ════════════════════════════════════════════════════════════
   STRUCTURED + RAW renderers — prototype version.
   The Structured layout matches the Figma design literally:
     - "System Status Event" chip with timestamp
     - "Online (7)" section with expandable component cards
     - Components / Status table at the bottom
   For prototype purposes the same dummy content renders for every
   selected row. Wiring real data per event type is a future task.
   ──────────────────────────────────────────────────────────── */

/* DT_LOGS_DUMMY_PAYLOAD removed — desktop Raw tab now uses tlGetPayload(row) for real data */

/* Render the Event Details inspector for the current selection */
function dtLogsRenderEventDetails() {
  const empty   = document.getElementById('dt-side-ed-empty');
  const content = document.getElementById('dt-side-ed-content');
  const sub     = document.getElementById('dt-side-ed-sub');
  const tabs    = document.getElementById('dt-side-ed-tabs');
  const foot    = document.getElementById('dt-side-ed-foot');
  const footT   = document.getElementById('dt-side-ed-foot-time');
  if (!empty || !content) return;

  if (dtLogsSelectedId === null) {
    empty.style.display = 'flex';
    content.style.display = 'none';
    sub.textContent = 'Select a row to inspect';
    tabs.style.display = 'none';
    foot.style.display = 'none';
    return;
  }

  const row = DT_LOGS_ROWS.find(r => r.id === dtLogsSelectedId);
  if (!row) return;

  empty.style.display = 'none';
  content.style.display = 'block';
  tabs.style.display = 'flex';
  foot.style.display = 'block';

  sub.textContent = `${row.sub} — ${row.type}`;
  footT.textContent = '1 min ago';

  content.innerHTML = dtLogsBuildEdContent(row);

  // Scroll Event Details body back to top on selection change
  const body = document.getElementById('dt-side-ed-body');
  if (body) body.scrollTop = 0;
}

/* Switch between Structured / Raw */
function dtLogsSetEdTab(which, btn) {
  dtLogsEdTab = which;
  document.querySelectorAll('.dt-side-ed-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (dtLogsSelectedId !== null) {
    document.getElementById('dt-side-ed-content').innerHTML =
      dtLogsBuildEdContent(DT_LOGS_ROWS.find(r => r.id === dtLogsSelectedId));
  }
}

/* Tab dispatcher */
function dtLogsBuildEdContent(row) {
  if (dtLogsEdTab === 'structured') return dtLogsRenderStructured(row);
  return dtLogsRenderRaw();
}

/* ── Raw JSON tab — with search ── */
let dtLogsRawSearch = { query: '', matches: [], active: 0 };

function dtLogsRenderRaw() {
  // Reset search state every time Raw is rendered (fresh tab switch / row change)
  dtLogsRawSearch = { query: '', matches: [], active: 0 };
  const row = DT_LOGS_ROWS.find(r => r.id === dtLogsSelectedId);
  const json = JSON.stringify(row ? tlGetPayload(row) : {}, null, 2);
  return `
    <div class="dt-raw-wrap">
      <div class="dt-raw-search">
        <svg class="dt-raw-search-icon" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="rgba(54,50,45,0.5)" stroke-width="1.4"/>
          <line x1="11" y1="11" x2="14" y2="14" stroke="rgba(54,50,45,0.5)" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        <input type="text" id="dt-raw-search-input" class="dt-raw-search-input"
               placeholder="Search JSON" autocomplete="off"
               oninput="dtLogsRawSearchUpdate(this.value)"
               onkeydown="dtLogsRawSearchKey(event)">
        <span class="dt-raw-search-count" id="dt-raw-search-count"></span>
        <button class="dt-raw-search-nav" onclick="dtLogsRawSearchStep(-1)" title="Previous match">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 7.5L6 4.5L9 7.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="dt-raw-search-nav" onclick="dtLogsRawSearchStep(1)" title="Next match">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <div class="dt-side-ed-raw" id="dt-side-ed-raw">${dtLogsHighlightJson(json)}</div>
    </div>
  `;
}

function dtLogsRawSearchUpdate(query) {
  dtLogsRawSearch.query = query;
  dtLogsRawSearch.active = 0;
  dtLogsRawApplySearch();
}

function dtLogsRawApplySearch() {
  const raw = document.getElementById('dt-side-ed-raw');
  const countEl = document.getElementById('dt-raw-search-count');
  if (!raw || !countEl) return;

  // Clear any prior search marks: replace them with their text content
  raw.querySelectorAll('mark.dt-raw-mark').forEach(m => {
    const txt = document.createTextNode(m.textContent);
    m.parentNode.replaceChild(txt, m);
  });
  // Normalize so adjacent text nodes merge — keeps matching reliable
  raw.normalize();

  const q = (dtLogsRawSearch.query || '').toLowerCase();
  if (!q) {
    dtLogsRawSearch.matches = [];
    countEl.textContent = '';
    return;
  }

  // Walk text nodes and wrap matches in <mark>
  const walker = document.createTreeWalker(raw, NodeFilter.SHOW_TEXT, null);
  const toProcess = [];
  let n;
  while ((n = walker.nextNode())) toProcess.push(n);

  const marks = [];
  toProcess.forEach(textNode => {
    const text = textNode.nodeValue;
    const lower = text.toLowerCase();
    let idx = 0, found;
    const frag = document.createDocumentFragment();
    let lastEnd = 0;
    while ((found = lower.indexOf(q, idx)) !== -1) {
      if (found > lastEnd) frag.appendChild(document.createTextNode(text.slice(lastEnd, found)));
      const mark = document.createElement('mark');
      mark.className = 'dt-raw-mark';
      mark.textContent = text.slice(found, found + q.length);
      frag.appendChild(mark);
      marks.push(mark);
      lastEnd = found + q.length;
      idx = lastEnd;
    }
    if (lastEnd > 0) {
      if (lastEnd < text.length) frag.appendChild(document.createTextNode(text.slice(lastEnd)));
      textNode.parentNode.replaceChild(frag, textNode);
    }
  });

  dtLogsRawSearch.matches = marks;
  if (marks.length === 0) {
    countEl.textContent = 'No results';
    return;
  }
  // Clamp active in case query shrank
  if (dtLogsRawSearch.active >= marks.length) dtLogsRawSearch.active = 0;
  dtLogsRawSearchHighlightActive();
}

function dtLogsRawSearchHighlightActive() {
  const { matches, active } = dtLogsRawSearch;
  const countEl = document.getElementById('dt-raw-search-count');
  matches.forEach((m, i) => m.classList.toggle('active', i === active));
  if (matches.length > 0) {
    countEl.textContent = `${active + 1} of ${matches.length}`;
    matches[active].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function dtLogsRawSearchStep(dir) {
  const { matches } = dtLogsRawSearch;
  if (!matches.length) return;
  dtLogsRawSearch.active = (dtLogsRawSearch.active + dir + matches.length) % matches.length;
  dtLogsRawSearchHighlightActive();
}

function dtLogsRawSearchKey(e) {
  if (e.key === 'Enter')      { e.preventDefault(); dtLogsRawSearchStep(e.shiftKey ? -1 : 1); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); dtLogsRawSearchStep(1); }
  else if (e.key === 'ArrowUp')   { e.preventDefault(); dtLogsRawSearchStep(-1); }
  else if (e.key === 'Escape')    { e.target.value = ''; dtLogsRawSearchUpdate(''); }
}

/* ── Structured page — literal match to the Figma design ── */
const DT_LOGS_ONLINE_COMPONENTS = [
  { name: 'Wireless Drum',      value: '3.54V',     expanded: true,
    detail: [['Last Seen:', '13:49:59'], ['Start Up Count:', '1'], ['Error Count:', '0']] },
  { name: 'IOX',                value: '12.92 V' },
  { name: 'In-Cab Dsplay',      value: 'Active'   },
  { name: 'External Display',   value: 'Active'   },
  { name: 'Bus Power',          value: '12.76V'   },
  { name: 'Discharge Pressure', value: 'Connected' },
  { name: 'Charge Pressure',    value: 'Connected' },
  { name: 'CWR',                value: '45° C'    }
];

const DT_LOGS_OFFLINE_COMPONENTS = [
  'Wired Drum', 'Roboteq', 'Power Module', 'FDM Heater', 'Jacket Heater',
  'Admix Board', 'Sensor Board', 'Water Board', 'AWAS', 'Air V4',
  'Air vNext', 'Water Main', 'Smartwatch', 'Air Purifier', 'Gaming Console'
];

function dtLogsRenderStructured(row) {
  /* Delegate to shared tl render engine */
  return tlRenderStructured(row);
}

/* Card expand toggle */


/* JSON syntax highlighter for the Raw tab */
function dtLogsHighlightJson(jsonStr) {
  const escaped = jsonStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(
    /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'json-num';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'json-key' : 'json-str';
      } else if (/true|false/.test(match)) {
        cls = 'json-bool';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}


function dtBuildTimeline() {
  const today = new Date();
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const M = today.getMonth() + 1, D = today.getDate(), Y = today.getFullYear();
  const dark = document.body.classList.contains('dark');

  const surfaceBg    = dark ? 'var(--layer-2)' : '#f6f4f2';
  const todayCardBg  = dark ? 'var(--layer-1)' : 'white';
  const timeColor    = dark ? 'rgba(255,255,255,0.5)' : 'rgba(54,50,45,0.76)';
  const chevStroke   = dark ? 'rgba(255,255,255,0.7)' : '#36322d';
  const ignOnColor   = dark ? 'rgba(46,207,29,0.5)' : '#afdbb3';
  const ignOffColor  = dark ? 'rgba(255,255,255,0.2)' : '#d9d9d9';

  const ALARM_SVG = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.375 0H8.25C9.00195 0 9.625 0.623047 9.625 1.375V8.25C9.625 9.02344 9.00195 9.625 8.25 9.625H1.375C0.601562 9.625 0 9.02344 0 8.25V1.375C0 0.623047 0.601562 0 1.375 0ZM4.8125 2.0625C4.51172 2.0625 4.29688 2.29883 4.29688 2.57812V4.98438C4.29688 5.28516 4.51172 5.5 4.8125 5.5C5.0918 5.5 5.32812 5.28516 5.32812 4.98438V2.57812C5.32812 2.29883 5.0918 2.0625 4.8125 2.0625ZM4.125 6.875C4.125 7.26172 4.42578 7.5625 4.8125 7.5625C5.17773 7.5625 5.5 7.26172 5.5 6.875C5.5 6.50977 5.17773 6.1875 4.8125 6.1875C4.42578 6.1875 4.125 6.50977 4.125 6.875Z" fill="white"/></svg>`;
  const WARN_SVG  = `<svg width="10" height="10" viewBox="0 0 12 10" fill="none"><path d="M5.54297 0C5.84375 0 6.12305 0.171875 6.27344 0.429688L10.9141 8.33594C11.0645 8.61523 11.0645 8.9375 10.9141 9.19531C10.7637 9.47461 10.4844 9.625 10.1836 9.625H0.902344C0.580078 9.625 0.300781 9.47461 0.150391 9.19531C0 8.9375 0 8.61523 0.150391 8.33594L4.79102 0.429688C4.94141 0.171875 5.2207 0 5.54297 0ZM5.54297 2.75C5.24219 2.75 5.02734 2.98633 5.02734 3.26562V5.67188C5.02734 5.97266 5.24219 6.1875 5.54297 6.1875C5.82227 6.1875 6.05859 5.97266 6.05859 5.67188V3.26562C6.05859 2.98633 5.82227 2.75 5.54297 2.75ZM6.23047 7.5625C6.23047 7.19727 5.9082 6.875 5.54297 6.875C5.15625 6.875 4.85547 7.19727 4.85547 7.5625C4.85547 7.94922 5.15625 8.25 5.54297 8.25C5.9082 8.25 6.23047 7.94922 6.23047 7.5625Z" fill="#894F18"/></svg>`;

  /* ── Day strip — matches Figma SVG spec ── */
  const dayBars = ['#2ecf1d','#ffba0d','#d70100','#d70100','#d70100','#d70100','#d70100'];
  const dayCards = Array.from({length:7}, (_,i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const isToday = i === 6;
    const lbl = isToday ? 'Today' : DAY_NAMES[d.getDay()];
    const num = `${d.getMonth()+1}/${d.getDate()}`;
    const bar = dayBars[i];

    /* Badge sits inline with the date */
    const badge = bar === '#2ecf1d'
      ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#2ecf1d;flex-shrink:0;"></span>`
      : bar === '#ffba0d'
      ? `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:#ffba0d;border-radius:3px;flex-shrink:0;">${WARN_SVG}</span>`
      : `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:#d70100;border-radius:3px;flex-shrink:0;">${ALARM_SVG}</span>`;

    /* Content — fluid, centered in cell */
    const leftBox = `<div style="display:flex;flex-direction:column;justify-content:center;min-width:0;">
      <div style="font-size:14px;font-weight:500;color:var(--strong);letter-spacing:-0.28px;line-height:1.3;white-space:nowrap;">${lbl}</div>
      <div style="font-size:12px;color:var(--defined);letter-spacing:-0.24px;opacity:0.75;line-height:1.3;white-space:nowrap;">${num}</div>
    </div>`;

    const rightBox = `<div style="display:flex;align-items:center;justify-content:center;padding:0 6px;flex-shrink:0;">${badge}</div>`;

    const content = `<div style="display:flex;align-items:center;gap:0;">${leftBox}${rightBox}</div>`;

    /* Today: white card hugs content with comfortable inset. Others: transparent */
    if (isToday) {
      return `<div id="dt-day-${i}" style="flex:1;display:flex;align-items:center;justify-content:center;border-left:1px solid var(--border);padding:4px;cursor:pointer;" onclick="dtTimelineSelectDay(${i})">
        <div style="background:${todayCardBg};border-radius:12px;padding:8px 12px;display:inline-flex;align-items:center;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          ${content}
        </div>
      </div>`;
    }
    return `<div id="dt-day-${i}" style="flex:1;display:flex;align-items:center;justify-content:center;${i > 0 ? 'border-left:1px solid var(--border);' : ''}cursor:pointer;" onclick="dtTimelineSelectDay(${i})">
      ${content}
    </div>`;
  }).join('');

  /* Label column */
  const ROW_H = 64;
  const COMP_NAMES = ['Iox / Robotex','Charge','Discharge','Drum','Internal Display','External Display','Bus power','CWR','WDS'];
  const labelsHtml = COMP_NAMES.map(n =>
    `<div style="height:${ROW_H}px;display:flex;align-items:center;font-size:14px;color:var(--strong);letter-spacing:-0.28px;padding-right:16px;white-space:nowrap;">${n}</div>`
  ).join('');

  /* Time axis */
  const timeAxis = `<div style="display:flex;justify-content:space-between;font-size:12px;color:${timeColor};letter-spacing:-0.24px;padding:0 8px 8px;">
    <span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>24:00</span>
  </div>`;

  /* Legend */
  const legend = `<div style="display:flex;gap:24px;align-items:center;padding:12px 0 4px;flex-wrap:wrap;">
    <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--strong);letter-spacing:-0.24px;"><span style="display:inline-block;width:20px;height:4px;background:${ignOnColor};border-radius:2px;opacity:0.7;"></span>Ignition on</span>
    <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--strong);letter-spacing:-0.24px;"><span style="display:inline-block;width:20px;height:4px;background:${ignOffColor};border-radius:2px;"></span>Ignition off</span>
    <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--strong);letter-spacing:-0.24px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:#d70100;border-radius:3px;">${ALARM_SVG}</span>Alarm</span>
    <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--strong);letter-spacing:-0.24px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:#ffba0d;border-radius:3px;">${WARN_SVG}</span>Warning</span>
  </div>`;

  /* Label column width — fluid: fits longest label, min 100px */
  const LABEL_W = 'max-content';
  const html = `
    <div style="display:flex;flex-direction:column;gap:16px;">

      <!-- Day strip — Figma pill style -->
      <div id="dt-ct-strip" style="display:flex;height:73px;background:${surfaceBg};border:1px solid var(--border);border-radius:24px;overflow:hidden;box-shadow:0 1px 0 rgba(0,0,0,0.1);">${dayCards}</div>

      <!-- Header row — sits above the container -->
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:16px;font-weight:500;color:var(--strong);letter-spacing:-0.32px;">Component Status History</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span id="dt-timeline-date-label" style="font-size:14px;font-weight:500;color:var(--strong);letter-spacing:-0.28px;">Today ${M}/${D}/${Y}</span>
          <button style="width:28px;height:28px;border-radius:50%;border:1px solid var(--border);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;" onclick="dtTimelineNav(-1)">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 10L4 6l4-4" stroke="${chevStroke}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button style="width:28px;height:28px;border-radius:50%;border:1px solid var(--border);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;" onclick="dtTimelineNav(1)">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 10l4-4-4-4" stroke="${chevStroke}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>

      <!-- rounded container — time axis + rows + legend only -->
      <div style="background:${surfaceBg};border:1px solid var(--border);border-radius:16px;padding:16px 20px;display:flex;flex-direction:column;gap:8px;">

        <!-- Single CSS grid: label col auto-sizes to content, track col takes rest -->
        <!-- Time axis, rows, and legend all share the same 2-col grid -->
        <div style="display:grid;grid-template-columns:max-content 1fr;gap:0;">

          <!-- Time axis: empty label cell + axis over tracks only -->
          <div></div>
          <div>${timeAxis}</div>

          <!-- Label column + grid rows -->
          <div style="display:flex;flex-direction:column;">${labelsHtml}</div>
          <div style="background:${surfaceBg};border:1px solid var(--border);border-radius:16px;overflow:hidden;">
            <div id="dt-timeline-rows"></div>
          </div>

          <!-- Legend: empty label cell + legend over tracks only -->
          <div></div>
          <div>${legend}</div>

        </div>

      </div>

    </div>`;

  dtTimelineActiveDayIdx = 6;
  setTimeout(() => dtTimelineRenderRows(6), 0);
  return html;
}

/* ── DESKTOP MANUAL CONTROL TAB ─────────────────────────── */
function dtBuildManual() {
  const sections = [
    { label:'Diagnostics', ids:['ping','restart','canerrors','sensors'] },
    { label:'Calibration', ids:['tilt'] },
    { label:'Water',       ids:['water','waterstate','waterprop','waterflow'] },
    { label:'Admix',       ids:['admix','admixstate','admixprop','admixflow'] },
  ];
  const CHEV = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0;opacity:0.5;transition:transform 0.25s;"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const sectionsHtml = sections.map(sec => {
    const cardsHtml = sec.ids.map(id => {
      const def = MC_CARD_DEFS.find(d => d.id === id);
      if (!def) return '';
      return `<div id="dt-mc-unit-${id}"></div>`;
    }).join('');
    return `
      <div class="dt-mc-section">
        <div class="dt-mc-section-hdr" onclick="this.parentElement.classList.toggle('collapsed');this.querySelector('svg').style.transform=this.parentElement.classList.contains('collapsed')?'rotate(-90deg)':'';">
          <span>${sec.label}</span>${CHEV}
        </div>
        <div class="dt-mc-section-cards">${cardsHtml}</div>
      </div>`;
  }).join('');
  /* Wrap in id="state-manual" so all #state-manual scoped MC card CSS applies */
  return `<div id="dt-state-manual">${sectionsHtml}</div>`;
}

function dtInitManualCards() {
  /* Clear any previous render */
  document.querySelectorAll('[id^="dt-mc-unit-"]').forEach(el => el.innerHTML = '');

  MC_CARD_DEFS.forEach(def => {
    const mountEl = document.getElementById(`dt-mc-unit-${def.id}`);
    if (!mountEl) return;
    const cardWrap = document.createElement('div');
    cardWrap.innerHTML = `<div class="mc-card ${def.hasInput ? 'mc-input-card' : ''}"><div class="progress-track"><div class="progress-fill"></div></div></div>`;
    mountEl.appendChild(cardWrap);
    const inst = new CardInstance(def, cardWrap);
    /* Flip-grow cards — wire tap and hint icon */
    const flipMapDt = {
      canerrors: { fn: canFlipOpen,     store: '_canCardInst' },
      sensors:   { fn: sensorsFlipOpen, store: null },
    };
    const flipCfgDt = flipMapDt[def.id];
    if (flipCfgDt) {
      if (flipCfgDt.store) window[flipCfgDt.store] = inst;
      const card = cardWrap.querySelector('.mc-card');
      if (card) card.addEventListener('click', function(e) {
        if (e.target.closest('button')) return;
        flipCfgDt.fn();
      });
      canInjectFlipHint(mountEl, flipCfgDt.fn);
    }
  });
}

/* ── DESKTOP CONFIGURATION TAB ──────────────────────────── */
let dtCfgEditMode = false;
let dtCfgOrigValues = {};

function dtBuildConfig(isNewUnit) {
  const CHEV  = `<svg class="cfg-chev" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M10.5 6L6 1.5 1.5 6" stroke="#36322d9e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const CARET = `<svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#36322d" stroke-width="1.3" stroke-linecap="round"/></svg>`;

  /* Read-only text field */
  const fi = (id, label, val) => `
    <div class="cfg-field" data-field-id="${id}">
      <label style="font-size:13px;color:var(--soft);font-weight:500;letter-spacing:-0.2px;">${label}</label>
      <div class="cfg-ro-val" style="font-size:14px;color:var(--strong);letter-spacing:-0.28px;padding:9px 0;">${val}</div>
      <input type="text" value="${val}" class="cfg-edit-input" style="display:none;box-sizing:border-box;" data-orig="${val}">
    </div>`;

  /* Read-only dropdown */
  const fd = (id, label, val) => `
    <div class="cfg-field" data-field-id="${id}">
      <label style="font-size:13px;color:var(--soft);font-weight:500;letter-spacing:-0.2px;">${label}</label>
      <div class="cfg-ro-val" style="font-size:14px;color:var(--strong);letter-spacing:-0.28px;padding:9px 0;">${val}</div>
      <div class="cfg-select cfg-edit-input" style="display:none;" data-orig="${val}">${val} ${CARET}</div>
    </div>`;

  /* Read-only toggle */
  const ft = (id, label, on) => `
    <div class="cfg-field" data-field-id="${id}">
      <label style="font-size:13px;color:var(--soft);font-weight:500;letter-spacing:-0.2px;">${label}</label>
      <div class="cfg-toggle-ro" style="margin-top:4px;">
        <div class="cfg-toggle${on?' on':''} cfg-edit-toggle" style="pointer-events:none;opacity:0.6;" onclick="if(dtCfgEditMode)toggleCfgSwitch(this)" data-orig="${on?'on':'off'}"><div class="cfg-toggle-knob"></div></div>
      </div>
    </div>`;

  /* Section sub-label */
  const sl = (label) => `<div style="grid-column:1/-1;font-size:13px;font-weight:600;color:var(--strong);letter-spacing:0.1px;padding-top:4px;">${label}</div>`;

  /* 3-col grid */
  const g3 = (html) => `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px 20px;">${html}</div>`;

  /* Accordion */
  const acc = (title, sub, body, open=false) => `
    <div class="cfg-acc${open?' open':''}">
      <div class="cfg-acc-hdr" onclick="this.parentElement.classList.toggle('open');var b=this.nextElementSibling;b.style.display=this.parentElement.classList.contains('open')?'':'none';">
        <div class="cfg-acc-text">
          <div class="cfg-acc-title">${title}</div>
          <div class="cfg-acc-sub">${sub}</div>
        </div>
        ${CHEV}
      </div>
      <div class="cfg-acc-body" ${open?'':'style="display:none;"'}>${body}</div>
    </div>`;

  const s1 = g3(`
    ${fi('name','Name','')}
    ${fd('mixer','Mixer Type',(function(){ var uid = typeof dtUdCurrentUnitId !== 'undefined' ? dtUdCurrentUnitId : null; var u = uid ? UNITS_DATA.find(function(x){ return x.id===uid; }) : null; return (u && u.mixerType) ? u.mixerType : 'McNeilus'; })())}
    ${fi('bsc','Batch System Code','')}
    ${fd('contract','Contract','Cemex AZ')}
    ${fi('vin','VIN','')}
    ${fd('mode','Mode','Live')}
    ${fd('oos','OOS Reason','In Service')}
  `);
  const s2 = g3(`
    ${fi('magnets','Number of Drum Magnets','')}
    ${fi('drumsize','Drum Size (yd³)','')}
    ${ft('frontdisc','Front Discharge',true)}
    ${ft('cwr','CWR Watchdog Enabled',false)}
    ${ft('bluewtr','Using Blue Water Meter',true)}
    ${ft('blueadmix','Using Blue Admix Meter',true)}
    ${ft('metrics','Display Metrics Units',true)}
  `);
  const s3 = g3(`
    ${fi('minbatch','Min Batch Revolutions','')}
    ${fi('minagit','Min Agitation Speed (RPM)','')}
    ${fi('minmix','Min Mixing Speed (RPM)','')}
    ${fi('maxmix','Max Mixing Speed (RPM)','')}
  `);
  const s4 = g3(`
    ${fi('slumpsec','Slump Expiration In Seconds','0')}
    ${fi('slumprev','Slump Expiration In Revs','0')}
    ${fi('slumpmin','Slump Min Mixing Speed','0')}
    ${fi('slumpmax','Slump Max Mixing Speed','0')}
  `);
  const s5 = g3(`
    ${sl('Slump Adjustment')}
    ${fi('slumpstep','Target Slump Step','1 inch')}
    ${fi('maxslump','Max Slump for Display','8 inch')}
    ${sl('Timing &amp; Operational Thresholds')}
    ${fi('minsleave','Minutes to Leave Plant','5 min')}
    ${fi('minliters','Min Liters for Back Flush','5 Liters')}
    ${sl('Display Preferences')}
    ${ft('dispunits','Display Units (Imperial)',true)}
    ${ft('noflow','Display No-Flow Errors',true)}
  `);
  const s6 = g3(`
    ${fi('wtrqc','Water Hose: Quick Connect to Nozzle (ft)','')}
    ${fi('wtrfdm','Water Hose: FDM to Quick Connect (ft)','')}
    ${fi('admixhose','Admix Hose Length (ft)','')}
  `);
  const sTilt = isNewUnit ? `
    <div class="cfg-tilt-wrap">
      <div class="cfg-tilt-readout">
        <div class="cfg-tilt-readout-row">
          <div class="cfg-tilt-stat">
            <div class="cfg-tilt-stat-label">Sensor Reading</div>
            <div class="cfg-tilt-stat-val" id="cfg-tilt-current">−0.4°</div>
          </div>
          <div class="cfg-tilt-stat">
            <div class="cfg-tilt-stat-label">Frame Rail Angle</div>
            <div class="cfg-tilt-stat-val cfg-tilt-stat-val--unset" id="cfg-tilt-baseline">—</div>
          </div>
          <div class="cfg-tilt-stat">
            <div class="cfg-tilt-stat-label">Offset Applied</div>
            <div class="cfg-tilt-stat-val cfg-tilt-stat-val--unset" id="cfg-tilt-comp">—</div>
          </div>
        </div>
      </div>
      <div class="cfg-tilt-instructions">
        <div class="cfg-tilt-step">
          <div class="cfg-tilt-step-num">1</div>
          <div class="cfg-tilt-step-text">Park the truck on level ground. Use a digital level gauge on the frame rail to measure the angle.</div>
        </div>
        <div class="cfg-tilt-step">
          <div class="cfg-tilt-step-num">2</div>
          <div class="cfg-tilt-step-text">Enter the measured frame rail angle below. The system will calculate the difference between the sensor and the frame and apply it as an offset.</div>
        </div>
      </div>
      <div class="cfg-tilt-inline-recal" style="margin-top:4px;">
        <div class="cfg-tilt-inline-label">Set initial frame rail angle</div>
        <div class="cfg-tilt-inline-row">
          <input class="cfg-tilt-inline-input" type="number" step="0.1" min="-45" max="45"
            placeholder="e.g. −0.2" id="cfg-tilt-inline-val">
          <span class="cfg-tilt-inline-unit">°</span>
          <button class="cfg-tilt-inline-apply" onclick="cfgTiltApplyAngle(this)">Apply</button>
        </div>
      </div>
    </div>` : `
    <div class="cfg-tilt-wrap">
      <div class="cfg-tilt-readout">
        <div class="cfg-tilt-readout-row">
          <div class="cfg-tilt-stat">
            <div class="cfg-tilt-stat-label">Sensor Reading</div>
            <div class="cfg-tilt-stat-val" id="cfg-tilt-current">−0.4°</div>
          </div>
          <div class="cfg-tilt-stat">
            <div class="cfg-tilt-stat-label">Frame Rail Angle</div>
            <div class="cfg-tilt-stat-val" id="cfg-tilt-baseline">−0.2°</div>
          </div>
          <div class="cfg-tilt-stat">
            <div class="cfg-tilt-stat-label">Offset Applied</div>
            <div class="cfg-tilt-stat-val cfg-tilt-stat-val--ok" id="cfg-tilt-comp">+0.2°</div>
          </div>
        </div>
      </div>
      <div class="cfg-tilt-instructions">
        <div class="cfg-tilt-step">
          <div class="cfg-tilt-step-num">1</div>
          <div class="cfg-tilt-step-text">Park the truck on level ground. Use a digital level gauge on the frame rail to measure the angle.</div>
        </div>
        <div class="cfg-tilt-step">
          <div class="cfg-tilt-step-num">2</div>
          <div class="cfg-tilt-step-text">Enter the measured frame rail angle below. The system will calculate the difference between the sensor and the frame and apply it as an offset.</div>
        </div>
      </div>
      ${fi('tiltangle','Measured Frame Rail Angle (degrees)','-0.2')}
      <div class="cfg-tilt-reset-row">
        <div class="cfg-tilt-reset-text">
          <div class="cfg-tilt-reset-label">Reset Baseline to Zero</div>
          <div class="cfg-tilt-reset-sub">Use when the unit has drifted out of calibration. Clears the current offset — then re-enter the measured frame rail angle to recalibrate.</div>
        </div>
        <button class="cfg-tilt-reset-btn" onclick="cfgTiltResetBaseline(this)">Reset</button>
      </div>
    </div>`;
  const s7 = g3(`
    ${fi('slumptol','Slump Tolerance (in)','')}
    ${fi('initwtr','Initial Water Ratio','')}
    ${fi('initadmix','Initial Admix Ratio','')}
    ${fi('minwtr','Min Water Ratio','')}
    ${fi('maxwtr','Max Water Ratio','')}
    ${fi('minadmix','Min Admix Ratio','')}
    ${fi('maxadmix','Max Admix Ratio','')}
  `);
  const s8 = g3(`
    ${fi('awaydist','Away Distance Signal Meters','0')}
  `);

  dtCfgEditMode = false;

  return `
    <div style="display:flex;flex-direction:column;gap:0;">

      <!-- Search + Edit bar -->
      <div id="dt-cfg-topbar" style="display:flex;align-items:center;gap:10px;padding:0 0 14px;">
        <!-- Search -->
        <div style="flex:1;display:flex;align-items:center;gap:8px;background:var(--layer-2);border:1px solid var(--border);border-radius:24px;padding:8px 14px;">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;"><circle cx="6.5" cy="6.5" r="4" stroke="#36322d9e" stroke-width="1.3"/><path d="M10.5 10.5l3 3" stroke="#36322d9e" stroke-width="1.3" stroke-linecap="round"/></svg>
          <input id="dt-cfg-search" type="text" placeholder="Search settings…"
            oninput="dtCfgSearch(this.value)"
            onkeydown="dtCfgSearchKey(event)"
            style="flex:1;border:none;outline:none;font-size:13px;color:var(--strong);background:none;letter-spacing:-0.26px;font-family:var(--font);">
          <!-- Match counter + nav arrows — hidden when no query -->
          <div id="dt-cfg-search-nav" style="display:none;align-items:center;gap:4px;flex-shrink:0;">
            <span id="dt-cfg-search-count" style="font-size:12px;color:var(--soft);letter-spacing:-0.2px;white-space:nowrap;"></span>
            <button onclick="dtCfgSearchStep(-1)" title="Previous" style="background:none;border:none;padding:2px 4px;cursor:pointer;color:var(--soft);display:flex;align-items:center;">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 8L6 5l-3 3" stroke="#36322d9e" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button onclick="dtCfgSearchStep(1)" title="Next" style="background:none;border:none;padding:2px 4px;cursor:pointer;color:var(--soft);display:flex;align-items:center;">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4l3 3 3-3" stroke="#36322d9e" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>
        <!-- Edit button -->
        <button onclick="dtCfgStartEdit()" style="flex-shrink:0;background:var(--layer-1);border:1px solid var(--border);border-radius:20px;padding:8px 16px;font-size:13px;font-weight:500;color:var(--strong);font-family:var(--font);letter-spacing:-0.26px;cursor:pointer;">Update</button>
      </div>

      <!-- Clone banner — only shown for new/pending units -->
      ${isNewUnit ? `
      <div class="clone-card" id="dt-clone-banner">
        <div class="clone-card-header">
          <div class="clone-card-text">
            <div class="clone-card-title">Clone setting from a similar truck <span id="dt-clone-applied-badge" style="display:none;" class="clone-applied-badge"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg> Applied</span></div>
            <div class="clone-card-sub" id="dt-clone-sub">Prefill equipment &amp; Mixing setting from a commissioned truck</div>
          </div>
          <div class="clone-card-controls">
            <div class="clone-selector-wrap">
              <div class="clone-selector" id="dt-clone-selector" onclick="dtCloneToggleDropdown()">
                <span class="clone-selector-label" id="dt-clone-selector-label">Truck Number</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#36322d9e" stroke-width="1.3" stroke-linecap="round"/></svg>
              </div>
              <div class="clone-dropdown" id="dt-clone-dropdown">
                <div class="clone-dropdown-search">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="#36322d9e" stroke-width="1.3"/><path d="M10 10l2.5 2.5" stroke="#36322d9e" stroke-width="1.3" stroke-linecap="round"/></svg>
                  <input id="dt-clone-search" type="text" placeholder="Search truck Number" oninput="dtCloneSearch(this.value)" autocomplete="off">
                </div>
                <div class="clone-truck-list" id="dt-clone-list"></div>
              </div>
            </div>
            <button class="clone-apply-btn" id="dt-clone-apply-btn" onclick="dtApplyClone()" disabled>Apply Settings</button>
          </div>
        </div>
        <!-- Preview expands below when truck selected -->
        <div class="clone-preview" id="dt-clone-preview">
          <div class="clone-preview-label">Fields That will be Prefilled</div>
          <div class="clone-preview-row"><span class="clone-preview-key">Drum Magnets</span><span class="clone-preview-val">4</span></div>
          <div class="clone-preview-row"><span class="clone-preview-key">Drum Size</span><span class="clone-preview-val">8 yd³</span></div>
          <div class="clone-preview-row"><span class="clone-preview-key">Min Batch Revolutions</span><span class="clone-preview-val">70</span></div>
          <div class="clone-preview-row"><span class="clone-preview-key">Min Agitation Speed</span><span class="clone-preview-val">2 RPM</span></div>
          <div class="clone-preview-row"><span class="clone-preview-key">Min Mixing Speed</span><span class="clone-preview-val">8 RPM</span></div>
          <div class="clone-preview-row"><span class="clone-preview-key">Max Mixing Speed</span><span class="clone-preview-val">18 RPM</span></div>
          <div class="clone-preview-row"><span class="clone-preview-key">Slump Tolerance</span><span class="clone-preview-val">0.5 in</span></div>
          <div class="clone-preview-row"><span class="clone-preview-key">Water Hose (QC→Nozzle)</span><span class="clone-preview-val">12 ft</span></div>
        </div>
      </div>` : ''}

      <!-- Accordions -->
      <div id="dt-cfg-accs" style="display:flex;flex-direction:column;gap:10px;">
        ${acc('Information','Defines how this truck is registered and configured within the system for tracking and reporting.',s1,true)}
        ${acc('Equipment Settings','Manage system-level settings that control how this equipment behaves and reports data.',s2)}
        ${acc('Mixing Settings','Control how the drum mixes, agitates, and rotates during transit and discharge.',s3)}
        ${acc('Fluid Hose Length Settings','Define hose lengths used for water and admixture delivery calculations.',s6)}
        ${acc('Tilt Calibration','Set the inclinometer offset so slump readings are accurate for this truck\'s frame angle.',sTilt)}
        ${acc('Workability Calculator Settings','Configure the time, rev, and drum speed limits that determine slump validity.',s4)}
        ${acc('In-Cab Display Settings','Configure what drivers see in the cab, including slump step increments, limits, and display alerts.',s5)}
        ${acc('Adjustment Manager Settings','Control how the system adjusts water and admixtures within defined limits.',s7)}
        ${acc('Location Monitor Settings','Define how far a truck must move before the system marks it as away.',s8)}
      </div>

    </div>`;
}

let dtCfgMatches = [];
let dtCfgMatchIdx = -1;

function dtCfgSearch(query) {
  const q = query.trim().toLowerCase();
  const accs = document.querySelectorAll('#dt-cfg-accs .cfg-acc');
  const nav = document.getElementById('dt-cfg-search-nav');
  const counter = document.getElementById('dt-cfg-search-count');

  dtCfgMatches = [];
  dtCfgMatchIdx = -1;

  if (!q) {
    /* Clear: restore default state */
    accs.forEach((acc, i) => {
      const body = acc.querySelector('.cfg-acc-body');
      const isFirst = i === 0;
      acc.classList.toggle('open', isFirst);
      if (body) body.style.display = isFirst ? '' : 'none';
      acc.querySelectorAll('.cfg-field').forEach(f => {
        f.style.background = '';
        f.style.borderRadius = '';
        f.style.outline = '';
        f.style.padding = '';
      });
    });
    if (nav) nav.style.display = 'none';
    return;
  }

  accs.forEach(acc => {
    const fields = acc.querySelectorAll('.cfg-field');
    let hasMatch = false;

    fields.forEach(field => {
      const label = field.querySelector('label');
      if (!label) return;
      const match = label.textContent.toLowerCase().includes(q);
      if (match) {
        hasMatch = true;
        dtCfgMatches.push(field);
        /* Dim highlight — active match will be brighter */
        field.style.background = 'rgba(21,148,239,0.06)';
        field.style.borderRadius = '8px';
        field.style.outline = '1.5px solid rgba(21,148,239,0.2)';
        field.style.padding = '5px';
      } else {
        field.style.background = '';
        field.style.borderRadius = '';
        field.style.outline = '';
        field.style.padding = '';
      }
    });

    const body = acc.querySelector('.cfg-acc-body');
    if (hasMatch) {
      acc.classList.add('open');
      if (body) body.style.display = '';
    } else {
      acc.classList.remove('open');
      if (body) body.style.display = 'none';
    }
  });

  /* Show counter + nav */
  if (nav) nav.style.display = dtCfgMatches.length ? 'flex' : 'none';

  if (dtCfgMatches.length) {
    dtCfgMatchIdx = 0;
    dtCfgHighlightActive();
    if (counter) counter.textContent = `1 of ${dtCfgMatches.length}`;
  } else {
    if (counter) counter.textContent = '0 results';
    if (nav) nav.style.display = 'flex';
  }
}

function dtCfgHighlightActive() {
  const counter = document.getElementById('dt-cfg-search-count');
  dtCfgMatches.forEach((f, i) => {
    if (i === dtCfgMatchIdx) {
      f.style.background = 'rgba(21,148,239,0.12)';
      f.style.outline = '2px solid rgba(21,148,239,0.5)';
      f.scrollIntoView({ block:'nearest', behavior:'smooth' });
    } else {
      f.style.background = 'rgba(21,148,239,0.06)';
      f.style.outline = '1.5px solid rgba(21,148,239,0.2)';
    }
  });
  if (counter && dtCfgMatches.length) {
    counter.textContent = `${dtCfgMatchIdx + 1} of ${dtCfgMatches.length}`;
  }
}

function dtCfgSearchStep(dir) {
  if (!dtCfgMatches.length) return;
  dtCfgMatchIdx = (dtCfgMatchIdx + dir + dtCfgMatches.length) % dtCfgMatches.length;
  dtCfgHighlightActive();
}

function dtCfgSearchKey(e) {
  if (e.key === 'ArrowDown') { e.preventDefault(); dtCfgSearchStep(1); }
  if (e.key === 'ArrowUp')   { e.preventDefault(); dtCfgSearchStep(-1); }
}

/* Returns the IDs of the save-bar elements + topbar for whichever drawer
   is currently active. Truck drawer and unit drawer each have their own
   save bar pinned to the bottom of their drawer-main; the topbar (with
   the "Update" button) only exists in the truck drawer.

   We detect the active drawer by the application's logical state — is a
   unit currently open? — rather than the DOM `.open` class. The DOM check
   was unreliable during pivot animations: when pivoting truck → unit, the
   render pass runs before the unit drawer gets its `.open` class added,
   so the active-context check resolved to the truck drawer instead and
   the save bar appeared in the (now-closed) truck drawer. */
function dtCfgActiveContext() {
  const isUd = !!dtUdCurrentUnitId;
  if (document.body.classList.contains('view-tablet')) {
    /* Tablet unit drawer — tbUdCurrentUnitId is set when unit drawer is open */
    if (typeof tbUdCurrentUnitId !== 'undefined' && tbUdCurrentUnitId) {
      return { saveBarId:'tb-ud-cfg-savebar', saveBtnId:'tb-ud-cfg-save-btn', topbarId:'dt-cfg-topbar' };
    }
    /* Tablet truck drawer */
    return { saveBarId:'tb-cfg-savebar', saveBtnId:'tb-cfg-save-btn', topbarId:'dt-cfg-topbar' };
  }
  return isUd
    ? { saveBarId:'dt-ud-cfg-savebar', saveBtnId:'dt-ud-cfg-save-btn', topbarId:null }
    : { saveBarId:'dt-cfg-savebar',    saveBtnId:'dt-cfg-save-btn',    topbarId:'dt-cfg-topbar' };
}

function cfgTiltResetBaseline(btn) {
  btn.textContent = 'Resetting…';
  btn.disabled = true;
  btn.style.opacity = '0.5';
  setTimeout(() => {
    /* Reset Frame Rail and Offset stats to 0 — Sensor Reading stays live */
    const stats = btn.closest('.cfg-tilt-wrap')?.querySelectorAll('.cfg-tilt-stat-val');
    if (stats && stats[1]) stats[1].textContent = '0.0°'; /* Frame Rail Angle */
    if (stats && stats[2]) { stats[2].textContent = '0.0°'; stats[2].className = 'cfg-tilt-stat-val cfg-tilt-stat-val--ok'; } /* Offset Applied */
    /* Flash reset button green briefly */
    btn.textContent = 'Reset';
    btn.disabled = false;
    btn.style.opacity = '';
    btn.style.background = 'rgba(22,163,74,0.12)';
    btn.style.borderColor = 'rgba(22,163,74,0.3)';
    btn.style.color = '#16a34a';
    setTimeout(() => {
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 1200);

    /* Reveal inline recalibration input after reset */
    const wrap = btn.closest('.cfg-tilt-wrap');
    if (!wrap) return;
    const existingInline = wrap.querySelector('.cfg-tilt-inline-recal');
    if (existingInline) return; /* already showing */
    const inlineEl = document.createElement('div');
    inlineEl.className = 'cfg-tilt-inline-recal';
    inlineEl.innerHTML = `
      <div class="cfg-tilt-inline-label">Enter new measured frame angle</div>
      <div class="cfg-tilt-inline-row">
        <input class="cfg-tilt-inline-input" type="number" step="0.1" min="-45" max="45"
          placeholder="e.g. −0.2" id="cfg-tilt-inline-val">
        <span class="cfg-tilt-inline-unit">°</span>
        <button class="cfg-tilt-inline-apply" onclick="cfgTiltApplyAngle(this)">Apply</button>
      </div>`;
    /* Insert before the reset row */
    const resetRow = wrap.querySelector('.cfg-tilt-reset-row');
    wrap.insertBefore(inlineEl, resetRow);
    setTimeout(() => inlineEl.querySelector('input').focus(), 50);
  }, 800);
}

function cfgTiltApplyAngle(btn) {
  const wrap = btn.closest('.cfg-tilt-wrap');
  const input = wrap ? wrap.querySelector('#cfg-tilt-inline-val') : null;
  if (!input) return;
  const frameAngle = parseFloat(input.value);
  if (isNaN(frameAngle)) { input.style.borderColor = '#d70100'; return; }

  /* Sensor reading stays fixed — it's what the inclinometer physically reads.
     Frame rail angle is what the FST measured with a level gauge.
     Offset applied = frame rail - sensor (what the system compensates by). */
  const sensorReading = -0.4; /* fixed sensor raw reading */
  const offset = frameAngle - sensorReading;
  const fmt = v => (v >= 0 ? '+' : '') + v.toFixed(1) + '°';

  /* Update stats within this wrap by position */
  const stats = wrap.querySelectorAll('.cfg-tilt-stat-val');
  if (stats[0]) stats[0].textContent = fmt(sensorReading); /* Sensor Reading — unchanged */
  if (stats[1]) stats[1].textContent = fmt(frameAngle);    /* Frame Rail Angle */
  if (stats[2]) { stats[2].textContent = fmt(offset); stats[2].className = 'cfg-tilt-stat-val cfg-tilt-stat-val--ok'; } /* Offset Applied */

  /* Update the cfg-field read-only val */
  const roVal = wrap.querySelector('[data-field-id="tiltangle"] .cfg-ro-val');
  if (roVal) roVal.textContent = fmt(frameAngle);

  /* Remove inline recal block */
  const inlineEl = wrap.querySelector('.cfg-tilt-inline-recal');
  if (inlineEl) { inlineEl.style.opacity = '0'; setTimeout(() => inlineEl.remove(), 200); }

  btn.textContent = 'Saved ✓';
  btn.style.background = 'rgba(22,163,74,0.15)';
  btn.style.color = '#16a34a';
}

function dtCfgStartEdit() {
  dtCfgEditMode = true;

  /* Open accordions — in the unit drawer only open the first 4;
     in the truck drawer open all */
  const isUnitDrawer = !!document.getElementById('dt-ud-drawer')?.classList.contains('open')
    || (document.body.classList.contains('view-tablet') && typeof tbUdCurrentUnitId !== 'undefined' && !!tbUdCurrentUnitId);
  document.querySelectorAll('#dt-cfg-accs .cfg-acc').forEach((acc, idx) => {
    const unitDrawerOpen = new Set([0,1,2,3,4]); /* Info, Equipment, Mixing, Fluid Hose, Tilt */
    if (isUnitDrawer && !unitDrawerOpen.has(idx)) return;
    acc.classList.add('open');
    const body = acc.querySelector('.cfg-acc-body');
    if (body) body.style.display = '';
  });

  /* Show inputs, hide read-only values */
  document.querySelectorAll('#dt-cfg-accs .cfg-ro-val').forEach(el => el.style.display = 'none');
  document.querySelectorAll('#dt-cfg-accs .cfg-edit-input').forEach(el => el.style.display = '');

  /* Enable toggles */
  document.querySelectorAll('#dt-cfg-accs .cfg-edit-toggle').forEach(el => {
    el.style.pointerEvents = 'auto';
    el.style.opacity = '1';
  });

  /* Hide only the Update button inside the topbar — keep search bar visible.
     The topbar itself stays so the FST can still search while editing. */
  const ctx = dtCfgActiveContext();
  if (ctx.topbarId) {
    const tb = document.getElementById(ctx.topbarId);
    if (tb) {
      const updateBtn = tb.querySelector('button[onclick*="dtCfgStartEdit"]');
      if (updateBtn) updateBtn.style.display = 'none';
    }
  }
  const bar = document.getElementById(ctx.saveBarId);
  if (bar) bar.style.display = 'block';
}

function dtCfgSave() {
  /* Commit: update read-only values from inputs */
  document.querySelectorAll('#dt-cfg-accs .cfg-edit-input').forEach(el => {
    const ro = el.previousElementSibling;
    if (ro && ro.classList.contains('cfg-ro-val')) ro.textContent = el.value || el.textContent;
    el.dataset.orig = el.value || el.dataset.orig;
  });
  document.querySelectorAll('#dt-cfg-accs .cfg-edit-toggle').forEach(el => {
    el.dataset.orig = el.classList.contains('on') ? 'on' : 'off';
  });

  /* Brief confirmation flash on whichever save button is visible */
  const ctx = dtCfgActiveContext();
  const saveBtn = document.getElementById(ctx.saveBtnId);
  const originalLabel = saveBtn ? saveBtn.textContent : 'Save changes';
  if (saveBtn) {
    saveBtn.textContent = 'Saved ✓';
    setTimeout(() => {
      saveBtn.textContent = originalLabel;
      dtCfgExitEdit();
    }, 1000);
  } else {
    dtCfgExitEdit();
  }
}

function dtCfgCancel() {
  /* Revert inputs to orig values */
  document.querySelectorAll('#dt-cfg-accs .cfg-edit-input').forEach(el => {
    if (el.tagName === 'INPUT') el.value = el.dataset.orig;
  });
  document.querySelectorAll('#dt-cfg-accs .cfg-edit-toggle').forEach(el => {
    const wasOn = el.dataset.orig === 'on';
    el.classList.toggle('on', wasOn);
  });
  dtCfgExitEdit();
}

function dtCfgExitEdit() {
  dtCfgEditMode = false;

  /* Hide inputs, show read-only values */
  document.querySelectorAll('#dt-cfg-accs .cfg-ro-val').forEach(el => el.style.display = '');
  document.querySelectorAll('#dt-cfg-accs .cfg-edit-input').forEach(el => el.style.display = 'none');

  /* Disable toggles */
  document.querySelectorAll('#dt-cfg-accs .cfg-edit-toggle').forEach(el => {
    el.style.pointerEvents = 'none';
    el.style.opacity = '0.6';
  });

  /* Clear search */
  const searchEl = document.getElementById('dt-cfg-search');
  if (searchEl) { searchEl.value = ''; dtCfgSearch(''); }
  dtCfgMatches = []; dtCfgMatchIdx = -1;
  const nav = document.getElementById('dt-cfg-search-nav');
  if (nav) nav.style.display = 'none';

  /* Restore the Update button inside the topbar */
  const ctx = dtCfgActiveContext();
  if (ctx.topbarId) {
    const tb = document.getElementById(ctx.topbarId);
    if (tb) {
      const updateBtn = tb.querySelector('button[onclick*="dtCfgStartEdit"]');
      if (updateBtn) updateBtn.style.display = '';
    }
  }
  const truckBar = document.getElementById('dt-cfg-savebar');
  if (truckBar) truckBar.style.display = 'none';
  const udBar = document.getElementById('dt-ud-cfg-savebar');
  if (udBar) udBar.style.display = 'none';
  const tbBar = document.getElementById('tb-cfg-savebar');
  if (tbBar) tbBar.style.display = 'none';
}
  const CHEV = `<svg class="cfg-chev" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M10.5 6L6 1.5 1.5 6" stroke="#36322d9e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const CARET = `<svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#36322d" stroke-width="1.3" stroke-linecap="round"/></svg>`;

  const fi = (label, val) => `
    <div class="cfg-field">
      <label style="font-size:13px;color:var(--soft);font-weight:500;letter-spacing:-0.2px;">${label}</label>
      <input type="text" value="${val}" style="box-sizing:border-box;">
    </div>`;

  const fd = (label, val) => `
    <div class="cfg-field">
      <label style="font-size:13px;color:var(--soft);font-weight:500;letter-spacing:-0.2px;">${label}</label>
      <div class="cfg-select">${val} ${CARET}</div>
    </div>`;

  const ft = (label, on) => `
    <div class="cfg-field">
      <label style="font-size:13px;color:var(--soft);font-weight:500;letter-spacing:-0.2px;">${label}</label>
      <div class="cfg-toggle${on?' on':''}" onclick="toggleCfgSwitch(this)" style="margin-top:2px;"><div class="cfg-toggle-knob"></div></div>
    </div>`;

  const sl = (label) => `<div style="grid-column:1/-1;font-size:13px;font-weight:600;color:var(--strong);letter-spacing:0.1px;padding-top:4px;">${label}</div>`;

  const g3 = (html) => `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px 20px;">${html}</div>`;


/* ── DESKTOP SENSOR TAB ─────────────────────────────────── */
function dtBuildSensor() {
  const chips = [
    { key:'slump',    label:'Slump',         liveId:'sv-slump' },
    { key:'water',    label:'Water Add.',     liveId:'sv-water' },
    { key:'pressure', label:'Pressure',       liveId:'sv-pressure' },
    { key:'drum',     label:'Drum Speed',     liveId:'sv-drum' },
    { key:'cell',     label:'Cell Coverage',  liveId:'sv-cell' },
    { key:'sat',      label:'Satellite',      liveId:'sv-sat' },
  ];

  const chipsHtml = chips.map(c => {
    const isActive = senSelected.has(c.key);
    const cfg = SEN_CONFIGS[c.key];
    const val = cfg.type === 'line'
      ? `<span class="sen-chip-val" id="dt-sv-${c.key}">${cfg.liveBase.toFixed(cfg.liveDecimals)}<span class="sen-chip-unit"> ${cfg.liveUnit}</span></span>`
      : `<span class="sen-chip-val" id="dt-sv-${c.key}">${cfg.statusLabel}</span>`;
    return `<div class="sen-chip${isActive ? ' active' : ''}" data-sensor="${c.key}" onclick="dtSenToggle(this)">
      <div class="sen-chip-label">${c.label}</div>
      ${val}
    </div>`;
  }).join('');

  return `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <!-- Chip filter row -->
      <div id="dt-sen-chips" style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;">
        ${chipsHtml}
      </div>
      <!-- Chart cards — 2-col grid -->
      <div id="dt-sen-charts" style="display:grid;grid-template-columns:1fr;gap:12px;"></div>
    </div>`;
}

function dtSenToggle(el) {
  const key = el.dataset.sensor;
  if (senSelected.has(key)) {
    if (senSelected.size <= 1) return;
    senSelected.delete(key);
    el.classList.remove('active');
  } else {
    senSelected.add(key);
    el.classList.add('active');
  }
  dtSenRenderCards();
}

function dtSenRenderCards() {
  const container = document.getElementById('dt-sen-charts');
  if (!container) return;
  container.innerHTML = '';

  function lineCard(key, cfg, wrapId, h) {
    return `<div class="sen-card-hdr">
          <div class="sen-card-left">
            <div class="sen-card-title">${cfg.title}</div>
            <div>
              <span class="sen-card-bigval" id="dt-sc-val-${key}">${cfg.liveBase.toFixed(cfg.liveDecimals)}</span>
              <span class="sen-card-unit">${cfg.unit}</span>
            </div>
          </div>
          <div class="sen-live-badge"><div class="sen-live-dot"></div><div class="sen-live-txt">Live</div></div>
        </div>
        <div class="sen-canvas-wrap" id="${wrapId}" style="height:${h}px;"></div>`;
  }

  senSelected.forEach(key => {
    const cfg = SEN_CONFIGS[key];
    const card = document.createElement('div');
    card.className = 'sen-card';
    card.id = 'dt-sen-card-' + key;
    card.innerHTML = lineCard(key, cfg, 'dt-' + key + '-svg-wrap', 180);
    container.appendChild(card);
  });

  /* Slump: inject target pill */
  const slumpCard = document.getElementById('dt-sen-card-slump');
  if (slumpCard) {
    const cfg = SEN_CONFIGS.slump;
    const valRow = slumpCard.querySelector('#dt-sc-val-slump')?.parentElement;
    if (valRow) valRow.insertAdjacentHTML('afterend', `<div style="display:flex;align-items:center;gap:4px;padding:2px 8px;background:rgba(21,148,239,0.08);border-radius:20px;margin-top:2px;">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="1" y1="5" x2="9" y2="5" stroke="#1594ef" stroke-width="1.5" stroke-dasharray="2.5,2"/></svg>
        <span style="font-size:11px;color:rgba(54,50,45,0.6);letter-spacing:-0.22px;">Target</span>
        <span style="font-size:11px;font-weight:600;color:#1594ef;letter-spacing:-0.22px;font-family:'DM Mono',monospace;">${cfg.target.toFixed(1)} ${cfg.unit}</span>
      </div>`);
  }

  requestAnimationFrame(() => {
    if (senSelected.has('slump'))    senDrawSlumpSVG('dt-slump-svg-wrap', true);
    if (senSelected.has('water'))    senDrawWaterSVG('dt-water-svg-wrap', true);
    if (senSelected.has('drum'))     senDrawDrumSVG('dt-drum-svg-wrap', true);
    if (senSelected.has('pressure')) senDrawLineSVG('dt-pressure-svg-wrap', true, 'pressure');
    if (senSelected.has('cell'))     senDrawLineSVG('dt-cell-svg-wrap', true, 'cell');
    if (senSelected.has('sat'))      senDrawLineSVG('dt-sat-svg-wrap', true, 'sat');
    if (senSelected.has('admix'))    senDrawLineSVG('dt-admix-svg-wrap', true, 'admix');
    if (senSelected.has('revs'))     senDrawLineSVG('dt-revs-svg-wrap', true, 'revs');
    if (senSelected.has('temp'))     senDrawLineSVG('dt-temp-svg-wrap', true, 'temp');
  });
}

/* ── DESKTOP CONFIGURATION TAB ──────────────────────────── */
function dtDrawerToggleSection(section, el) {
  el.classList.toggle('collapsed');
}

function dtDrawerTab(tab, el) {
  document.querySelectorAll('.dt-drawer-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');

  /* Stop sensor animation whenever leaving sensor tab */
  senStop();

  /* Toggle side panel between default (overview/timeline) and logs-mode (Event Details) */
  const sidePanel = document.querySelector('#dt-drawer .dt-drawer-side');
  if (sidePanel) sidePanel.classList.toggle('logs-mode', tab === 'logs');

  const scroll = document.getElementById('dt-drawer-scroll');
  if (tab === 'timeline') {
    scroll.innerHTML = dtBuildTimeline();
  } else if (tab === 'lifespan') {
    // Render Unit Lifespan content for the unit installed on this truck.
    // Looks up UNITS_DATA by truck number; falls back to a default if no link.
    scroll.innerHTML = dtBuildLifespanForTruck(dtDrawerTruckNum);
  } else if (tab === 'overview') {
    scroll.innerHTML = `
      <div id="dt-overview-toolbar" style="display:flex;align-items:center;justify-content:space-between;padding:0 0 16px;">
        <span id="dt-replace-hint" style="font-size:13px;color:#92400e;letter-spacing:-0.26px;display:none;">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="vertical-align:middle;margin-right:4px;"><path d="M7 1v6M7 10h.01" stroke="#92400e" stroke-width="1.4" stroke-linecap="round"/><circle cx="7" cy="7" r="6" stroke="#92400e" stroke-width="1.2"/></svg>
          Tap components to select them
        </span>
        <button class="co-replace-btn" id="dt-replace-btn" onclick="dtReplaceToggle()" style="margin-left:auto;">
          ${CO_REPLACE_BTN_HTML}
        </button>
      </div>
      <div class="dt-drawer-section-hdr" onclick="dtDrawerToggleSection('mcs',this)">
        <svg class="dt-section-chev" width="14" height="14" viewBox="0 0 14 14" fill="none" style="transition:transform 0.2s;"><path d="M3 5l4 4 4-4" stroke="#36322d" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Measurement Component Status
      </div>
      <div class="dt-drawer-cards" id="dt-drawer-mcs-cards"></div>
      <div class="dt-drawer-section-hdr" onclick="dtDrawerToggleSection('fdm',this)" style="margin-top:8px;">
        <svg class="dt-section-chev" width="14" height="14" viewBox="0 0 14 14" fill="none" style="transition:transform 0.2s;"><path d="M3 5l4 4 4-4" stroke="#36322d" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        V3 FDM
      </div>
      <div class="dt-drawer-cards" id="dt-drawer-fdm-cards"></div>`;
    if (dtDrawerTruckNum) dtOpenTruck(dtDrawerTruckNum);
  } else if (tab === 'config') {
    scroll.innerHTML = dtBuildConfig();
  } else if (tab === 'manual') {
    scroll.innerHTML = dtBuildManual();
    dtInitManualCards();
  } else if (tab === 'sensor') {
    scroll.innerHTML = dtBuildSensor();
    document.querySelectorAll('#dt-sen-chips .sen-chip').forEach(el => {
      el.classList.toggle('active', senSelected.has(el.dataset.sensor));
    });
    dtSenRenderCards();
    senStart();
  } else if (tab === 'logs') {
    scroll.innerHTML = dtBuildLogs();
    dtLogsRender();
    dtLogsRenderEventDetails();
  } else {
    scroll.innerHTML = `<div style="padding:40px 0;text-align:center;color:var(--soft);font-size:14px;">Coming soon</div>`;
  }
}

/* Desktop territory selector — mirrors mobile selectedAccounts/selectedLocations */
function dtTsToggle(which) {
  const accDD   = document.getElementById('dt-ts-account-dd');
  const locDD   = document.getElementById('dt-ts-location-dd');
  const accChev = document.getElementById('dt-ts-account-chev');
  const locChev = document.getElementById('dt-ts-location-chev');
  if (which === 'account') {
    const opening = !accDD.classList.contains('open');
    accDD.classList.toggle('open', opening);
    locDD.classList.remove('open');
    accChev.style.transform = opening ? 'rotate(180deg)' : '';
    locChev.style.transform = '';
    if (opening) dtTsRenderAccountOptions();
  } else {
    const opening = !locDD.classList.contains('open');
    locDD.classList.toggle('open', opening);
    accDD.classList.remove('open');
    locChev.style.transform = opening ? 'rotate(180deg)' : '';
    accChev.style.transform = '';
    if (opening) dtTsRenderLocationOptions();
  }
}

function dtTsRenderAccountOptions() {
  const el = document.getElementById('dt-ts-account-options');
  if (!el) return;
  el.innerHTML = ALL_ACCOUNTS.map(a => {
    const checked = selectedAccounts.has(a);
    return `
      <div onclick="dtTsToggleAccount('${a}')" style="display:flex;align-items:center;gap:10px;padding:10px 8px;border-radius:8px;cursor:pointer;" onmouseenter="this.style.background='var(--layer-2)'" onmouseleave="this.style.background=''">
        <div style="width:16px;height:16px;border-radius:4px;border:1.5px solid ${checked ? 'var(--blue)' : 'var(--border-mid)'};background:${checked ? 'var(--blue)' : 'none'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          ${checked ? `<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}
        </div>
        <span style="font-size:14px;color:var(--strong);letter-spacing:-0.28px;">${a}</span>
      </div>`;
  }).join('');
}

function dtTsRenderLocationOptions() {
  const el = document.getElementById('dt-ts-location-options');
  if (!el) return;
  let html = '';
  ALL_ACCOUNTS.forEach(acct => {
    if (!selectedAccounts.has(acct)) return;
    html += `<div style="font-size:11px;font-weight:600;color:var(--soft);letter-spacing:0.4px;text-transform:uppercase;padding:8px 8px 4px;">${acct}</div>`;
    (ACCOUNT_PLANTS[acct] || []).forEach(p => {
      const checked = selectedLocations.has(p);
      html += `
        <div onclick="dtTsToggleLocation('${p}')" style="display:flex;align-items:center;gap:10px;padding:8px 8px;border-radius:8px;cursor:pointer;" onmouseenter="this.style.background='var(--layer-2)'" onmouseleave="this.style.background=''">
          <div style="width:16px;height:16px;border-radius:4px;border:1.5px solid ${checked ? 'var(--blue)' : 'var(--border-mid)'};background:${checked ? 'var(--blue)' : 'none'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${checked ? `<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}
          </div>
          <span style="font-size:14px;color:var(--strong);letter-spacing:-0.28px;">${p}</span>
        </div>`;
    });
  });
  el.innerHTML = html;
}

function dtTsToggleAccount(acct) {
  if (selectedAccounts.has(acct)) {
    if (selectedAccounts.size === 1) return;
    selectedAccounts.delete(acct);
    (ACCOUNT_PLANTS[acct] || []).forEach(p => selectedLocations.delete(p));
  } else {
    selectedAccounts.add(acct);
    (ACCOUNT_PLANTS[acct] || []).forEach(p => selectedLocations.add(p));
  }
  dtTsRenderAccountOptions();
  dtTsRenderLocationOptions();
  dtTsUpdateLabels();
  tsUpdateLabels(); /* keep mobile in sync */
  renderTrucks();
  dtRefreshTable(dtActiveTab);
}

function dtTsToggleLocation(plant) {
  if (selectedLocations.has(plant)) {
    if (selectedLocations.size === 1) return;
    selectedLocations.delete(plant);
  } else {
    selectedLocations.add(plant);
  }
  dtTsRenderLocationOptions();
  dtTsUpdateLabels();
  tsUpdateLabels();
  renderTrucks();
  dtRefreshTable(dtActiveTab);
}

function dtTsUpdateLabels() {
  const acctEl = document.getElementById('dt-ts-account-label');
  if (acctEl) {
    if (selectedAccounts.size === ALL_ACCOUNTS.length) {
      acctEl.textContent = ALL_ACCOUNTS[0] + ', +' + (ALL_ACCOUNTS.length - 1);
    } else if (selectedAccounts.size === 1) {
      acctEl.textContent = [...selectedAccounts][0];
    } else {
      acctEl.textContent = [...selectedAccounts][0] + ', +' + (selectedAccounts.size - 1);
    }
  }
  const locEl = document.getElementById('dt-ts-location-label');
  if (locEl) {
    const allLocs = Object.values(ACCOUNT_PLANTS).flat().filter(p => {
      const acct = Object.entries(ACCOUNT_PLANTS).find(([a, pl]) => pl.includes(p));
      return acct && selectedAccounts.has(acct[0]);
    });
    locEl.textContent = selectedLocations.size >= allLocs.length
      ? 'All locations'
      : selectedLocations.size === 1
        ? [...selectedLocations][0]
        : [...selectedLocations][0] + ', +' + (selectedLocations.size - 1);
  }
}

/* Close desktop territory dropdowns on outside click */
document.addEventListener('click', function(e) {
  const accBtn = document.getElementById('dt-ts-account-btn');
  const locBtn = document.getElementById('dt-ts-location-btn');
  const accDD  = document.getElementById('dt-ts-account-dd');
  const locDD  = document.getElementById('dt-ts-location-dd');
  if (accBtn && accDD && !accBtn.contains(e.target)) {
    accDD.classList.remove('open');
    const ch = document.getElementById('dt-ts-account-chev');
    if (ch) ch.style.transform = '';
  }
  if (locBtn && locDD && !locBtn.contains(e.target)) {
    locDD.classList.remove('open');
    const ch = document.getElementById('dt-ts-location-chev');
    if (ch) ch.style.transform = '';
  }
});

/* ══════════════════════════════════════════════════
   TOP BAR OPTIONS DROPDOWN
   Role (External/Internal) + Version (Final/MVP)
   collapsed into a single three-dot button.
═══════════════════════════════════════════════════ */
function vpOptsToggle() {
  var btn = document.getElementById('vp-opts-btn');
  var dd  = document.getElementById('vp-opts-dd');
  if (!btn || !dd) return;
  var isOpen = dd.classList.contains('open');
  if (isOpen) {
    dd.classList.remove('open');
    btn.classList.remove('open');
  } else {
    vpOptsUpdateState();
    dd.classList.add('open');
    btn.classList.add('open');
  }
}

/* Sync checkmarks and row highlight with current role + version state */
function vpOptsUpdateState() {
  /* Role checkmarks */
  var checkExt  = document.getElementById('vp-check-external');
  var checkInt  = document.getElementById('vp-check-internal');
  var rowExt    = document.getElementById('vp-opt-external');
  var rowInt    = document.getElementById('vp-opt-internal');
  if (checkExt) checkExt.style.opacity = dtCurrentRole === 'external' ? '1' : '0';
  if (checkInt) checkInt.style.opacity = dtCurrentRole === 'internal' ? '1' : '0';
  if (rowExt)   rowExt.style.fontWeight  = dtCurrentRole === 'external' ? '600' : '500';
  if (rowInt)   rowInt.style.fontWeight  = dtCurrentRole === 'internal' ? '600' : '500';
  /* Version checkmarks */
  var checkFinal = document.getElementById('vp-check-final');
  var checkMvp   = document.getElementById('vp-check-mvp');
  var rowFinal   = document.getElementById('vp-opt-final');
  var rowMvp     = document.getElementById('vp-opt-mvp');
  if (checkFinal) checkFinal.style.opacity = dtCurrentVersion === 'final' ? '1' : '0';
  if (checkMvp)   checkMvp.style.opacity   = dtCurrentVersion === 'mvp'   ? '1' : '0';
  if (rowFinal)   rowFinal.style.fontWeight  = dtCurrentVersion === 'final' ? '600' : '500';
  if (rowMvp)     rowMvp.style.fontWeight    = dtCurrentVersion === 'mvp'   ? '600' : '500';
  /* Badge — show a dot if anything is non-default (Internal or MVP) */
  var badge = document.getElementById('vp-opts-badge');
  if (badge) badge.style.display = (dtCurrentRole === 'internal' || dtCurrentVersion === 'mvp') ? 'block' : 'none';
}

/* Close dropdown on outside click */
document.addEventListener('click', function(e) {
  var wrap = document.getElementById('vp-opts-wrap');
  if (!wrap || wrap.contains(e.target)) return;
  var dd  = document.getElementById('vp-opts-dd');
  var btn = document.getElementById('vp-opts-btn');
  if (dd)  dd.classList.remove('open');
  if (btn) btn.classList.remove('open');
});

function setView(view) {
  const isDark = document.body.classList.contains('dark');
  document.body.className = 'view-' + view + (isDark ? ' dark' : '');
  document.querySelectorAll('.vp-pill').forEach(p => p.classList.remove('active'));
  document.querySelector(`.vp-pill[onclick="setView('${view}')"]`).classList.add('active');
  const title = document.getElementById('cs-title');
  if (title) title.textContent = view === 'tablet' ? 'Tablet View' : 'Desktop View';
  if (view === 'desktop') { dtTsUpdateLabels(); dtBuildHeaders('wts'); dtRenderTable(); }
  if (view === 'tablet')  { setTimeout(tbRenderTable, 50); }
}

/* ── INIT ──────────────────────────────────────── */

/* Auto-detect viewport size on first load and switch to the matching view.
   Real device width determines initial mode — phone users land on mobile,
   tablets on tablet, big screens on desktop. The user can still override
   via the top-bar pills. Resize doesn't re-trigger this — we don't want
   to rip people out of a view they're using mid-task. */
(function autoDetectView() {
  var w = window.innerWidth;
  var view;
  if (w < 700) view = 'mobile';
  else if (w < 1100) view = 'tablet';
  else view = 'desktop';
  /* Skip if already on the right view (default body class is view-desktop) */
  var current = document.body.className.replace('view-', '').trim();
  if (current !== view) {
    const isDark = document.body.classList.contains('dark');
    document.body.className = 'view-' + view + (isDark ? ' dark' : '');
    document.querySelectorAll('.vp-pill').forEach(function(p) { p.classList.remove('active'); });
    var sel = document.querySelector('.vp-pill[onclick="setView(\'' + view + '\')"]');
    if (sel) sel.classList.add('active');
    var title = document.getElementById('cs-title');
    if (title) title.textContent = view === 'tablet' ? 'Tablet View' : 'Desktop View';
  }
})();

tsUpdateLabels();
renderTrucks();
renderOverview();
/* Desktop init — runs on load since desktop is the default view */
if (document.body.classList.contains('view-desktop')) {
  dtTsUpdateLabels();
  dtBuildHeaders('wts');
  dtRenderTable();
}


/* ══════════════════════════════════════════════════════════════
   DEEP LINK — hash-based URL routing for prototype
   ──────────────────────────────────────────────────────────────
   Every meaningful state has a unique URL so Jira tickets can
   link directly to the exact screen being specced. Developers
   can copy the URL from the browser bar at any point — the hash
   updates automatically as you navigate.

   HASH FORMAT
   ───────────
   #view/section[/subview][/id][/tab]

   VIEW       → mobile | desktop   (which prototype mode)
   SECTION    → trucks | units     (main nav section)
   SUBVIEW    → wts | overview | cc  (desktop WTS sub-tabs only)
   ID         → truck number or unit id (when a drawer is open)
   TAB        → drawer tab slug

   EXAMPLES
   ───────────────────────────────────────────────────────────────
   #mobile/trucks                          All Trucks list
   #mobile/trucks/45689                    Truck drawer, default tab
   #mobile/trucks/45689/components         Truck drawer, Components tab
   #mobile/trucks/45689/logs               Truck drawer, Logs tab
   #mobile/trucks/45689/sensor             Truck drawer, Sensor tab
   #mobile/trucks/45689/manual             Truck drawer, Manual Control tab
   #mobile/trucks/45689/config             Truck drawer, Config tab
   #mobile/trucks/45689/timeline           Truck drawer, Timeline tab
   #mobile/units                           Units list
   #mobile/units/83651024                  Unit drawer, default tab
   #mobile/units/83651024/lifespan         Unit drawer, Lifespan tab
   #mobile/units/83651024/config           Unit drawer, Config tab
   #mobile/units/83651024/attach           Unit drawer, Attach to Truck tab

   #desktop/trucks                         All Trucks (WTS default)
   #desktop/trucks/wts                     All Trucks — Where to Start
   #desktop/trucks/overview                All Trucks — Overview
   #desktop/trucks/cc                      All Trucks — Component Conditions
   #desktop/trucks/45689                   Truck drawer open (default tab)
   #desktop/trucks/45689/logs              Truck drawer — Logs
   #desktop/trucks/45689/overview          Truck drawer — Overview
   #desktop/trucks/45689/timeline          Truck drawer — Timeline
   #desktop/trucks/45689/manual            Truck drawer — Manual Control
   #desktop/trucks/45689/sensor            Truck drawer — Sensor
   #desktop/trucks/45689/config            Truck drawer — Configuration
   #desktop/units                          Units page
   #desktop/units/83651024                 Unit drawer open (default tab)
   #desktop/units/83651024/lifespan        Unit drawer — Lifespan
   #desktop/units/83651024/config          Unit drawer — Configuration
   #desktop/units/83651024/attach          Unit drawer — Attach to Truck

═══════════════════════════════════════════════════════════════ */

/* ── Write / Read hash ─────────────────────────────────────── */

function setHash(parts) {
  const hash = parts.filter(x => x !== null && x !== undefined && x !== '').join('/');
  try { history.replaceState(null, '', '#' + hash); } catch(e) { location.hash = hash; }
}

function readHashParts() {
  return location.hash.replace(/^#/, '').split('/').filter(Boolean);
}

/* ── Determine current view name from body class ───────────── */


/* ── MOBILE hash writers ────────────────────────────────────── */

/* Patch setView to write view into hash */
const _origSetView = setView;
setView = function(view) {
  _origSetView(view);
  /* Preserve the rest of the hash if already set, just swap the view segment */
  const parts = readHashParts();
  if (parts.length > 0) {
    parts[0] = view;
    setHash(parts);
  } else {
    setHash([view, 'trucks']);
  }
};

const _origSelectWts = selectWts;
selectWts = function(label, el) {
  _origSelectWts(label, el);
  const map = { 'Where to start': 'wts', 'Overview': 'overview', 'Components Condition': 'cc' };
  setHash(['mobile', 'trucks', map[label] || 'wts']);
};

const _origOpenUnits = openUnits;
openUnits = function() {
  _origOpenUnits();
  setHash(['mobile', 'units']);
};

const _origGoToAllTrucks = goToAllTrucks;
goToAllTrucks = function() {
  _origGoToAllTrucks();
  setHash(['mobile', 'trucks']);
};

/* Mobile truck drawer — openDrawer(idx, context) */
const _origOpenDrawer = openDrawer;
openDrawer = function(i, context) {
  _origOpenDrawer(i, context);
  const truckNum = trucks[i] ? trucks[i].num : '';
  if (truckNum) setHash(['mobile', 'trucks', truckNum, 'overview']);
};

const _origCloseDrawer = closeDrawer;
closeDrawer = function() {
  _origCloseDrawer();
  setHash(['mobile', 'trucks']);
};

/* Mobile drawer tab nav */
const _origSelectDrawerNav = selectDrawerNav;
selectDrawerNav = function(label, el) {
  _origSelectDrawerNav(label, el);
  const truckNumEl = document.getElementById('drawer-truck-num');
  const truckNum   = truckNumEl ? truckNumEl.textContent.replace('Truck:','').trim() : '';
  const tabMap = {
    'Components Overview': 'components',
    'Component Timeline':  'timeline',
    'Manual Control':      'manual',
    'Sensor':              'sensor',
    'Configuration':       'config',
    'Truck Logs':          'logs',
  };
  const tab = tabMap[label] || 'overview';
  if (truckNum) setHash(['mobile', 'trucks', truckNum, tab]);
};

/* Mobile unit detail */
const _origOpenUnitDetail = openUnitDetail;
openUnitDetail = function(unitId) {
  _origOpenUnitDetail(unitId);
  setHash(['mobile', 'units', unitId, 'lifespan']);
};

const _origCloseUnitDetail = closeUnitDetail;
closeUnitDetail = function() {
  _origCloseUnitDetail();
  setHash(['mobile', 'units']);
};

/* Mobile unit nav (Lifespan / Attach to Truck) */
const _origUdSelectNav = typeof udSelectNav !== 'undefined' ? udSelectNav : null;
if (_origUdSelectNav) {
  udSelectNav = function(label, el) {
    _origUdSelectNav(label, el);
    const unitId = udCurrentUnit ? udCurrentUnit.id : '';
    const tabMap = { 'Life Span': 'lifespan', 'Attach to Truck': 'attach', 'Configuration': 'config' };
    const tab = tabMap[label] || 'lifespan';
    if (unitId) setHash(['mobile', 'units', unitId, tab]);
  };
}

/* ── DESKTOP hash writers ───────────────────────────────────── */

/* Patch dtNavGo to keep hash in sync */
const _origDtNavGo = dtNavGo;
dtNavGo = function(page) {
  _origDtNavGo(page);
  setHash(['desktop', page]);
};

/* Patch dtOpenTruck */
const _origDtOpenTruck = dtOpenTruck;
dtOpenTruck = function(truckNum) {
  _origDtOpenTruck(truckNum);
  setHash(['desktop', 'trucks', truckNum, 'overview']);
};

/* Patch dtCloseDrawer */
const _origDtCloseDrawer = dtCloseDrawer;
dtCloseDrawer = function() {
  _origDtCloseDrawer();
  /* Return to the current desktop sub-page (wts / overview / cc) */
  const wtsEl = document.getElementById('dt-wts-label');
  const subMap = { 'Where to start': 'wts', 'Overview': 'overview', 'Component Conditions': 'cc' };
  const sub = wtsEl ? (subMap[wtsEl.textContent.trim()] || 'wts') : 'wts';
  setHash(['desktop', 'trucks', sub]);
};

/* Patch dtDrawerTab (truck drawer tabs on desktop) */
const _origDtDrawerTab = dtDrawerTab;
dtDrawerTab = function(tab, el) {
  _origDtDrawerTab(tab, el);
  const parts = readHashParts();
  /* Preserve view + section + truckNum, just swap the tab slug */
  const truckNum = parts[3] && parts[3].length <= 6 ? parts[3] : (parts[2] && parts[2].length <= 6 ? parts[2] : '');
  if (truckNum) setHash(['desktop', 'trucks', truckNum, tab]);
};

/* Patch dtUdOpen (unit drawer open on desktop) */
const _origDtUdOpen = dtUdOpen;
dtUdOpen = function(unitId) {
  _origDtUdOpen(unitId);
  setHash(['desktop', 'units', unitId, 'lifespan']);
};

/* Patch dtUdSelectTab (unit drawer tab switches on desktop) */
const _origDtUdSelectTab = dtUdSelectTab;
dtUdSelectTab = function(tab) {
  _origDtUdSelectTab(tab);
  const unitId = dtUdCurrentUnitId || '';
  if (unitId) setHash(['desktop', 'units', unitId, tab]);
};

/* Desktop WTS sub-tab switch (selectWts is mobile-only; desktop uses selectDtTab) */
const _origSelectDtTab = typeof selectDtTab !== 'undefined' ? selectDtTab : null;
if (_origSelectDtTab) {
  selectDtTab = function(tab, el) {
    _origSelectDtTab(tab, el);
    const tabMap = { 'Where to start': 'wts', 'Overview': 'overview', 'Components Condition': 'cc' };
    setHash(['desktop', 'trucks', tabMap[tab] || 'wts']);
  };
}

/* ── RESTORE from hash on page load ─────────────────────────── */

(function restoreFromHash() {
  const parts = readHashParts();
  if (!parts.length) {
    /* No hash — default to tablet */
    setHash(['desktop', 'trucks']);
    return;
  }

  const view    = parts[0]; // mobile | desktop | tablet
  const section = parts[1]; // trucks | units
  const p2      = parts[2]; // subview (wts/overview/cc) OR id OR tab
  const p3      = parts[3]; // id or tab
  const p4      = parts[4]; // tab

  /* Set view mode first */
  if (view === 'desktop' || view === 'tablet' || view === 'mobile') {
    /* Call the original to avoid double hash write */
    _origSetView(view);
  }

  if (view === 'desktop') {
    /* ── Desktop restore ── */
    if (section === 'units') {
      /* Open units page */
      setTimeout(() => {
        dtNavGo('units');
        if (p2 && p2.length > 4) {
          /* Unit drawer */
          setTimeout(() => {
            _origDtUdOpen(p2);
            const tab = p3 || 'lifespan';
            setTimeout(() => {
              if (typeof dtUdSelectTab === 'function') _origDtUdSelectTab(tab);
            }, 80);
          }, 60);
        }
      }, 60);
    } else {
      /* trucks page (default) */
      setTimeout(() => {
        /* Sub-tab: wts / overview / cc */
        const subTabs = { 'wts': 'Where to start', 'overview': 'Overview', 'cc': 'Components Condition' };
        if (p2 && subTabs[p2]) {
          /* Sub-tab only, no drawer */
          const label = subTabs[p2];
          const el = document.querySelector(`.dt-sub-tab[data-label="${label}"]`);
          if (el && typeof selectDtTab === 'function') selectDtTab(label, el);
        } else if (p2 && !subTabs[p2]) {
          /* p2 is a truck number — open its drawer */
          const truckNum = p2;
          const tab = p3 || 'overview';
          setTimeout(() => {
            _origDtOpenTruck(truckNum);
            setTimeout(() => {
              if (tab !== 'overview') _origDtDrawerTab(tab, null);
            }, 80);
          }, 80);
        }
      }, 80);
    }
  } else {
    /* ── Mobile / tablet restore ── */
    if (section === 'units') {
      _origOpenUnits();
      if (p2 && p2.length > 4) {
        setTimeout(() => {
          _origOpenUnitDetail(p2);
          const tab = p3 || 'lifespan';
          if (tab === 'attach') {
            setTimeout(() => {
              const attachEl = document.querySelector('#ud-nav-dropdown .wts-option:nth-child(2)');
              if (attachEl && _origUdSelectNav) _origUdSelectNav('Attach to Truck', attachEl);
            }, 80);
          }
        }, 60);
      }
    } else {
      /* trucks page */
      const subMap = { 'wts': 'Where to start', 'overview': 'Overview', 'cc': 'Components Condition' };
      if (p2 && subMap[p2]) {
        const label = subMap[p2];
        const el = document.querySelector(`#wts-dropdown .wts-option[data-label="${label}"]`);
        if (el) _origSelectWts(label, el);
      } else if (p2 && !subMap[p2]) {
        /* p2 is a truck number — open drawer */
        const truckNum = p2;
        const tab = p3 || 'overview';
        const truckIdx = trucks.findIndex(t => t.num === truckNum);
        if (truckIdx > -1) {
          setTimeout(() => {
            _origOpenDrawer(truckIdx);
            const tabLabelMap = {
              'components': 'Components Overview',
              'timeline':   'Component Timeline',
              'manual':     'Manual Control',
              'sensor':     'Sensor',
              'config':     'Configuration',
              'logs':       'Truck Logs',
            };
            const navLabel = tabLabelMap[tab] || 'Components Overview';
            if (navLabel !== 'Components Overview') {
              setTimeout(() => {
                const navOpts = document.querySelectorAll('#drawer-nav-dropdown .wts-option');
                navOpts.forEach(o => {
                  if (o.textContent.trim() === navLabel) _origSelectDrawerNav(navLabel, o);
                });
              }, 80);
            }
          }, 60);
        }
      }
    }
  }
})();

/* Init tablet territory labels on load */
tbTsUpdateLabels();



/* ════════════════════════════════════════════════════════════
   DC ONBOARDING TOUR — v6.8.52
   Welcome card + two spotlight chapters, per breakpoint.

   Entry point: dcTourLaunch() — called from the Options dropdown
   today; a production help affordance would call the same function.
   Launches for whichever breakpoint is CURRENTLY active
   (body.view-desktop / view-tablet / view-mobile — body classes,
   never DOM presence, since all three layouts exist in the DOM).

   Chapter model per breakpoint:
     'hub'    — around the trucks list. Desktop/tablet: 5 stops.
                Mobile: 4 (its view-switcher pill collapses the
                desktop tab stops into one). Ends by pointing at a
                row/card; the user's own tap bridges to chapter 2.
     'drawer' — 3 stops inside the truck drawer, fired once after
                open when the pending flag is armed.

   Flag semantics (session only — resets on reload, no persistence,
   so every customer demo starts clean):
     - Finishing the hub chapter arms the drawer chapter.
     - "Explore on my own" also arms it — a user who skips still
       gets contextual help on first open.
     - Dismissing via X or Esc kills everything pending.
   ════════════════════════════════════════════════════════════ */

let dcTour = { active:false, bp:'desktop', chapter:null, step:0, drawerArmed:false };

function dcTourBp() {
  if (document.body.classList.contains('view-mobile'))  return 'mobile';
  if (document.body.classList.contains('view-tablet'))  return 'tablet';
  return 'desktop';
}

/* ── Step definitions ─────────────────────────────────────────
   anchor() returns an element or an array of elements (spotlight
   covers their union). Resolved lazily so DOM state at show-time
   wins. `place` is a hint; the placer flips when out of room. */
function dcTourDtTab(i) {
  return document.querySelectorAll('#dt-page-trucks .dt-tabs .dt-tab')[i] || null;
}
function dcTourTbTab(i) {
  return document.querySelectorAll('#tb-tabs-row .tb-tab')[i] || null;
}

const DC_TOUR_CHAPTERS = {
  desktop: {
    hub: [
      { anchor: () => document.getElementById('dt-nav-dc-group'), place:'right',
        title: 'One hub for the fleet',
        body:  'Everything lives here now — All Trucks, Map, Units, and Software Update, one click apart.' },
      { anchor: () => dcTourDtTab(0), place:'below',
        title: 'Where To Start',
        body:  'Your triage list. Only trucks with active alerts, grouped by plant, worst first. If a truck isn\u2019t here, it doesn\u2019t need you today.' },
      { anchor: () => [dcTourDtTab(1), dcTourDtTab(2)], place:'below',
        title: 'The other two views',
        body:  'Overview shows the full fleet. Components Condition is a per-component health matrix across every truck.' },
      { anchor: () => document.querySelector('#dt-page-trucks .dt-toolbar'), place:'below',
        title: 'Make the table yours',
        body:  'Filter, pick columns, search, and scope to your territory \u2014 the same table, arranged your way.' },
      { anchor: () => document.querySelector('#dt-tbody tr.dt-tr'), place:'below',
        title: 'Open a truck',
        body:  'Click any row to open that truck\u2019s diagnostic drawer. Try it when we\u2019re done \u2014 the tour picks up in there.' },
    ],
    drawer: [
      { anchor: () => document.querySelector('#dt-drawer .dt-drawer-title-row'), place:'below',
        title: 'The truck at a glance',
        body:  'Truck number, its linked unit, and the mode badge. Click the badge to switch between Live, Maintenance, and Offline.' },
      { anchor: () => document.getElementById('dt-drawer-tabs'), place:'below',
        title: 'Every tab, one truck',
        body:  'Timeline, logs, manual control, sensors, and configuration \u2014 everything about this truck without leaving the page.' },
      { anchor: () => document.getElementById('dt-overview-toolbar'), place:'below',
        title: 'Act from here',
        body:  'Component cards below show health at a glance, and Replace starts a hardware swap right from the drawer.' },
    ],
  },

  tablet: {
    hub: [
      { anchor: () => document.querySelector('.tb-nav-ham'), place:'below',
        title: 'Everything else is behind the menu',
        body:  'All Trucks, Map, Units, and Software Update \u2014 the whole Diagnostic Center, one tap away.' },
      { anchor: () => dcTourTbTab(0), place:'below',
        title: 'Where To Start',
        body:  'Your triage list. Only trucks with active alerts, grouped by plant, worst first. If a truck isn\u2019t here, it doesn\u2019t need you today.' },
      { anchor: () => [dcTourTbTab(1), dcTourTbTab(2)], place:'below',
        title: 'The other two views',
        body:  'Overview shows the full fleet. Component Conditions is a per-component health matrix across every truck.' },
      { anchor: () => document.getElementById('tb-search-row'), place:'below',
        title: 'Find it or add it',
        body:  'Search by truck, plant, or version \u2014 or bring a new truck into the fleet from right here.' },
      { anchor: () => document.querySelector('#tb-content tr.tb-group-row'), place:'below',
        title: 'Open a truck',
        body:  'Trucks group by plant. Tap a group to expand it, then View Truck opens the full drawer \u2014 try it when we\u2019re done.' },
    ],
    drawer: [
      { anchor: () => document.querySelector('#tb-drawer .dt-drawer-title-row'), place:'below',
        title: 'The truck at a glance',
        body:  'Truck number, its linked unit, and the mode badge. Tap the badge to switch between Live, Maintenance, and Offline.' },
      { anchor: () => document.querySelector('#tb-drawer .tb-drawer-tabs'), place:'below',
        title: 'Every tab, one truck',
        body:  'Timeline, logs, manual control, sensors, and configuration \u2014 everything about this truck without leaving the page.' },
      { anchor: () => document.querySelector('#tb-drawer-scroll > *'), place:'below',
        title: 'Act from here',
        body:  'Component cards show health at a glance, and Replace starts a hardware swap right from the drawer.' },
    ],
  },

  mobile: {
    hub: [
      { anchor: () => document.querySelector('#s-main .top-nav button'), place:'below',
        title: 'Everything else is behind the menu',
        body:  'Map, Units, Software Update, and the rest of the Diagnostic Center \u2014 one tap away.' },
      { anchor: () => document.getElementById('wts-btn'), place:'below',
        title: 'Where To Start',
        body:  'Your triage list \u2014 only trucks with active alerts, worst first. This pill also switches views: Overview and Components Condition live here too.' },
      { anchor: () => [document.querySelector('#s-main .filter-row'), document.getElementById('srch-wrap')], place:'below',
        title: 'Narrow it down',
        body:  'Filter the list, switch layouts, and search by truck, plant, or version.' },
      { anchor: () => document.querySelector('#page-where-to-start .truck-row'), place:'below',
        title: 'Open a truck',
        body:  'Tap a truck to expand it, then View Truck opens the full picture \u2014 try it when we\u2019re done.' },
    ],
    drawer: [
      { anchor: () => document.querySelector('#drawer .d-chrome-row1'), place:'below',
        title: 'The truck at a glance',
        body:  'Truck number, its linked unit, and the mode pill. Tap the pill to switch between Live, Maintenance, and Offline.' },
      { anchor: () => document.getElementById('drawer-nav-btn'), place:'below',
        title: 'Every section, one truck',
        body:  'Switch sections here \u2014 components overview, timeline, and the rest of this truck\u2019s story.' },
      { anchor: () => document.querySelector('#drawer-body > *'), place:'below',
        title: 'Health at a glance',
        body:  'Component cards show what\u2019s working and what needs attention \u2014 no digging required.' },
    ],
  },
};

function dcTourSteps() {
  const bp = DC_TOUR_CHAPTERS[dcTour.bp];
  return (bp && bp[dcTour.chapter]) || null;
}

/* ── Entry ──────────────────────────────────────────────────── */
function dcTourLaunch() {
  /* Close the options dropdown if it's open */
  const dd  = document.getElementById('vp-opts-dd');
  const btn = document.getElementById('vp-opts-btn');
  if (dd)  dd.classList.remove('open');
  if (btn) btn.classList.remove('open');

  const bp = dcTourBp();
  dcTourForceState(bp);

  dcTourTeardown();               /* restart-safe */
  dcTour = { active:true, bp:bp, chapter:null, step:0, drawerArmed:false };
  dcTourBuildOverlay(true);
  dcTourRenderWelcome();
}

/* Force the page/tab state every hub anchor depends on, and close
   any open truck drawer so the spotlight isn't fighting it. */
function dcTourForceState(bp) {
  if (bp === 'desktop') {
    if (typeof dtNavGo === 'function') dtNavGo('trucks');
    const t = dcTourDtTab(0);
    if (t && typeof dtSelectTab === 'function') dtSelectTab('wts', t);
    const dtDrawer = document.getElementById('dt-drawer');
    if (dtDrawer && dtDrawer.classList.contains('open') && typeof dtCloseDrawer === 'function') dtCloseDrawer();

  } else if (bp === 'tablet') {
    /* Inverse of tbNavMap()/tbNavUnits() — the tablet nav has no
       "back to All Trucks" restore, so the tour does it. */
    const show = (id, val) => { const el = document.getElementById(id); if (el) el.style.display = val; };
    show('tb-content', '');
    show('tb-page-units', 'none');
    show('tb-page-update', 'none');
    show('tb-page-map', 'none');
    show('tb-search-row', '');
    show('tb-tabs-row', '');
    show('tb-page-header', '');
    const title = document.querySelector('#tb-page .tb-page-title');
    if (title) title.textContent = 'Diagnostic Center';
    if (typeof tbNavClose === 'function') tbNavClose();
    if (typeof tbNavSetActive === 'function') tbNavSetActive('tb-nav-alltrucks');
    const t = dcTourTbTab(0);
    if (t && typeof tbSelectTab === 'function') tbSelectTab('wts', t);
    const tbDrawer = document.getElementById('tb-drawer');
    if (tbDrawer && tbDrawer.classList.contains('open') && typeof tbCloseDrawer === 'function') tbCloseDrawer();

  } else { /* mobile */
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === 's-main'));
    const cond = document.getElementById('s-conditions');
    if (cond) cond.style.display = 'none';
    const wtsOpt = document.querySelector('#wts-dropdown .wts-option');
    if (wtsOpt && typeof selectWts === 'function') selectWts('Where to start', wtsOpt);
    if (typeof closeDrawer === 'function') closeDrawer();
  }
}

/* ── Welcome card ───────────────────────────────────────────── */
function dcTourRenderWelcome() {
  const overlay = document.getElementById('dc-tour-overlay');
  if (!overlay) return;
  overlay.classList.add('dc-tour-welcome-mode');
  overlay.innerHTML = `
    <div class="dc-tour-welcome">
      <button class="dc-tour-close" onclick="dcTourDismiss()" title="Close">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
      <div class="dc-tour-eyebrow">New</div>
      <div class="dc-tour-title">Welcome to the new Diagnostic Center</div>
      <div class="dc-tour-body">
        Redesigned around one question: which truck needs you next.
        Take a two-minute walkthrough of what moved and why \u2014 or dive
        straight in. You can replay this anytime.
      </div>
      <div class="dc-tour-welcome-btns">
        <button class="dc-tour-btn dc-tour-btn-primary" onclick="dcTourBegin()">Show me around</button>
        <button class="dc-tour-btn dc-tour-btn-ghost" onclick="dcTourExplore()">Explore on my own</button>
      </div>
    </div>`;
  /* Mobile: the welcome card becomes a bottom sheet docked inside
     the phone frame instead of a viewport-centered modal. */
  if (dcTour.bp === 'mobile') {
    const w = overlay.querySelector('.dc-tour-welcome');
    if (w) { w.classList.add('dc-tour-sheet'); dcTourPositionSheet(w, 'bottom'); }
  }
}

function dcTourBegin() {
  dcTour.chapter = 'hub';
  dcTour.step = 0;
  const overlay = document.getElementById('dc-tour-overlay');
  if (overlay) overlay.classList.remove('dc-tour-welcome-mode');
  dcTourShowStep();
}

function dcTourExplore() {
  /* Soft skip — no guided tour, but arm the drawer chapter so the
     first drawer open still orients them in context. */
  dcTourClose({ armDrawer:true });
}

/* ── Overlay scaffolding ────────────────────────────────────── */
function dcTourBuildOverlay(welcomeMode) {
  let overlay = document.getElementById('dc-tour-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'dc-tour-overlay';
    overlay.className = 'dc-tour-overlay';
    document.body.appendChild(overlay);
  }
  overlay.classList.toggle('dc-tour-welcome-mode', !!welcomeMode);
  window.addEventListener('resize', dcTourReposition);
  window.addEventListener('scroll', dcTourReposition, true);
  document.addEventListener('keydown', dcTourKeydown);
}

function dcTourTeardown() {
  const overlay = document.getElementById('dc-tour-overlay');
  if (overlay) overlay.remove();
  window.removeEventListener('resize', dcTourReposition);
  window.removeEventListener('scroll', dcTourReposition, true);
  document.removeEventListener('keydown', dcTourKeydown);
}

function dcTourKeydown(e) {
  if (!dcTour.active) return;
  if (e.key === 'Escape') dcTourDismiss();
  else if (e.key === 'ArrowRight' && dcTour.chapter) dcTourNext();
  else if (e.key === 'ArrowLeft'  && dcTour.chapter) dcTourBack();
}

/* ── Step rendering ─────────────────────────────────────────── */
function dcTourResolveAnchor(step) {
  let a = step.anchor();
  if (Array.isArray(a)) { a = a.filter(Boolean); if (a.length === 0) return null; }
  if (!a) return null;
  return a;
}

function dcTourAnchorRect(a) {
  const els = Array.isArray(a) ? a : [a];
  let top = Infinity, left = Infinity, right = -Infinity, bottom = -Infinity;
  els.forEach(el => {
    const r = el.getBoundingClientRect();
    top = Math.min(top, r.top); left = Math.min(left, r.left);
    right = Math.max(right, r.right); bottom = Math.max(bottom, r.bottom);
  });
  return { top, left, width: right - left, height: bottom - top };
}

function dcTourShowStep() {
  const steps = dcTourSteps();
  if (!steps) return;
  /* Skip forward past any stop whose anchor doesn't exist right now
     (e.g. empty triage table \u2192 no first row). If nothing is left,
     finish the chapter gracefully. */
  while (dcTour.step < steps.length && !dcTourResolveAnchor(steps[dcTour.step])) {
    dcTour.step++;
  }
  if (dcTour.step >= steps.length) { dcTourFinishChapter(); return; }

  const step   = steps[dcTour.step];
  const anchor = dcTourResolveAnchor(step);
  const firstEl = Array.isArray(anchor) ? anchor[0] : anchor;
  if (firstEl.scrollIntoView) firstEl.scrollIntoView({ block:'nearest', inline:'nearest' });

  const overlay = document.getElementById('dc-tour-overlay');
  if (!overlay) return;
  overlay.classList.remove('dc-tour-welcome-mode');

  const isLast = dcTour.step === steps.length - 1;
  const dots   = steps.map((_, i) =>
    `<span class="dc-tour-dot${i === dcTour.step ? ' active' : ''}"></span>`).join('');

  /* Reuse nodes when possible so the cutout + card animate between
     stops instead of popping. */
  let cutout = overlay.querySelector('.dc-tour-cutout');
  let card   = overlay.querySelector('.dc-tour-card');
  if (!cutout) {
    overlay.innerHTML = '<div class="dc-tour-cutout"></div><div class="dc-tour-card"></div>';
    cutout = overlay.querySelector('.dc-tour-cutout');
    card   = overlay.querySelector('.dc-tour-card');
  }
  card.innerHTML = `
    <button class="dc-tour-close" onclick="dcTourDismiss()" title="End tour">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    </button>
    <div class="dc-tour-eyebrow">${dcTour.chapter === 'drawer' ? 'Truck drawer' : 'Walkthrough'} \u00b7 ${dcTour.step + 1} of ${steps.length}</div>
    <div class="dc-tour-title">${step.title}</div>
    <div class="dc-tour-body">${step.body}</div>
    <div class="dc-tour-foot">
      <div class="dc-tour-dots">${dots}</div>
      <div class="dc-tour-btns">
        ${dcTour.step > 0 ? '<button class="dc-tour-btn dc-tour-btn-ghost" onclick="dcTourBack()">Back</button>' : ''}
        <button class="dc-tour-btn dc-tour-btn-primary" onclick="dcTourNext()">${isLast ? 'Done' : 'Next'}</button>
      </div>
    </div>`;

  /* Mobile sheets don't transition position (see CSS) — replay the
     slide-up on each step change instead. First step skips this:
     the class isn't on yet, so adding it plays the animation. */
  if (dcTour.bp === 'mobile' && card.classList.contains('dc-tour-sheet')) {
    card.style.animation = 'none';
    void card.offsetWidth;      /* force reflow to restart it */
    card.style.animation = '';
  }

  dcTourReposition();
}

/* Clamp bounds: the browser viewport on desktop, the device frame
   on tablet/mobile so cards visually stay with the phone. */
function dcTourPhoneRect() {
  const phone = document.querySelector('.phone');
  if (!phone) return { left:0, top:0, right:window.innerWidth, bottom:window.innerHeight, width:window.innerWidth };
  return phone.getBoundingClientRect();
}

/* Dock a sheet inside the phone frame — bottom by default, top when
   the spotlight target would sit underneath it. Width is set before
   height is measured so wrap-dependent height is correct. The +52px
   top offset clears the notch. */
function dcTourPositionSheet(el, dock) {
  const p = dcTourPhoneRect(), m = 10;
  el.style.left  = (p.left + m) + 'px';
  el.style.width = (p.width - m * 2) + 'px';
  if (dock === 'top') {
    el.style.top    = (p.top + 52) + 'px';
    el.style.bottom = 'auto';
  } else {
    el.style.top    = 'auto';
    el.style.bottom = (window.innerHeight - p.bottom + m) + 'px';
  }
}

function dcTourBounds() {
  if (dcTour.bp !== 'desktop') {
    const phone = document.querySelector('.phone');
    if (phone) {
      const r = phone.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    }
  }
  return { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
}

/* Position the cutout over the anchor and the card beside it.
   Runs on step change, resize, and any scroll (capture). */
function dcTourReposition() {
  if (!dcTour.active) return;
  /* Welcome card showing (no chapter yet) — keep the mobile sheet
     docked through resizes; desktop/tablet welcome is CSS-centered. */
  if (!dcTour.chapter) {
    if (dcTour.bp === 'mobile') {
      const w = document.querySelector('#dc-tour-overlay .dc-tour-welcome');
      if (w) dcTourPositionSheet(w, 'bottom');
    }
    return;
  }
  const steps = dcTourSteps();
  const step  = steps && steps[dcTour.step];
  if (!step) return;
  const anchor  = dcTourResolveAnchor(step);
  const overlay = document.getElementById('dc-tour-overlay');
  if (!anchor || !overlay) return;
  const cutout = overlay.querySelector('.dc-tour-cutout');
  const card   = overlay.querySelector('.dc-tour-card');
  if (!cutout || !card) return;

  const r = dcTourAnchorRect(anchor);
  /* Anchor got hidden (e.g. breakpoint switched mid-tour) — bail
     cleanly instead of spotlighting a zero rect at the origin. */
  if (r.width === 0 && r.height === 0) { dcTourDismiss(); return; }

  const pad = 8;
  cutout.style.top    = (r.top - pad) + 'px';
  cutout.style.left   = (r.left - pad) + 'px';
  cutout.style.width  = (r.width + pad * 2) + 'px';
  cutout.style.height = (r.height + pad * 2) + 'px';

  /* Mobile: caption is a docked sheet, not a floating card.
     Bottom by default; flip to the top of the frame when the
     spotlighted element would sit underneath the sheet. */
  if (dcTour.bp === 'mobile') {
    card.classList.add('dc-tour-sheet');
    const p = dcTourPhoneRect(), m = 10;
    card.style.left  = (p.left + m) + 'px';
    card.style.width = (p.width - m * 2) + 'px';
    const ch2 = card.offsetHeight || 200;
    const sheetTop = p.bottom - m - ch2;
    const dockTop = (r.top + r.height) > (sheetTop - 12);
    dcTourPositionSheet(card, dockTop ? 'top' : 'bottom');
    return;
  }

  /* Card placement — honor the hint, flip when out of room, clamp. */
  const gap = 14, m = 12;
  const b  = dcTourBounds();
  const cw = card.offsetWidth || 330, ch = card.offsetHeight || 180;
  let top, left;
  let place = step.place || 'below';
  if (place === 'right' && r.left + r.width + gap + cw > b.right - m)  place = 'below';
  if (place === 'below' && r.top + r.height + gap + ch > b.bottom - m) place = 'above';
  if (place === 'above' && r.top - gap - ch < b.top + m)               place = 'right';

  if (place === 'right') {
    left = r.left + r.width + pad + gap;
    top  = r.top;
  } else if (place === 'above') {
    left = r.left;
    top  = r.top - pad - gap - ch;
  } else { /* below */
    left = r.left;
    top  = r.top + r.height + pad + gap;
  }
  left = Math.max(b.left + m, Math.min(left, b.right - cw - m));
  top  = Math.max(b.top + m,  Math.min(top,  b.bottom - ch - m));
  card.style.left = left + 'px';
  card.style.top  = top + 'px';
}

/* ── Navigation ─────────────────────────────────────────────── */
function dcTourNext() {
  const steps = dcTourSteps();
  if (!steps) return;
  if (dcTour.step >= steps.length - 1) { dcTourFinishChapter(); return; }
  dcTour.step++;
  dcTourShowStep();
}

function dcTourBack() {
  if (dcTour.step === 0) return;
  dcTour.step--;
  dcTourShowStep();
}

function dcTourFinishChapter() {
  /* Completing the hub chapter arms the drawer chapter; completing
     the drawer chapter ends onboarding. */
  dcTourClose({ armDrawer: dcTour.chapter === 'hub' });
}

function dcTourDismiss() {
  /* Hard dismiss (X / Esc) — kills everything pending. */
  dcTourClose({ armDrawer:false });
}

function dcTourClose(opts) {
  const arm = !!(opts && opts.armDrawer);
  const bp  = dcTour.bp;
  dcTourTeardown();
  dcTour = { active:false, bp:bp, chapter:null, step:0, drawerArmed:arm };
}

/* ── Drawer chapter bridge ──────────────────────────────────────
   Wrap the drawer-open entry point on each breakpoint instead of
   editing them: any path into the truck drawer (row tap, search,
   unit pivot, map card) triggers the pending chapter exactly once.
   The 480ms delay lets the open transition settle so anchor rects
   are final. The wrapper only fires when the CURRENT breakpoint
   matches the one it wraps — body classes, not DOM presence. */
function dcTourMaybeDrawerChapter(bpExpected, prep) {
  if (!dcTour.drawerArmed || dcTour.active) return;
  if (dcTourBp() !== bpExpected) return;
  dcTour.drawerArmed = false;   /* consume the flag — fires once */
  setTimeout(() => {
    if (typeof prep === 'function') prep();
    dcTour = { active:true, bp:bpExpected, chapter:'drawer', step:0, drawerArmed:false };
    dcTourBuildOverlay(false);
    dcTourShowStep();
  }, 480);
}

/* Desktop */
const dcTourOrigDtOpenTruck = dtOpenTruck;
dtOpenTruck = function (...args) {
  const out = dcTourOrigDtOpenTruck.apply(this, args);
  dcTourMaybeDrawerChapter('desktop', () => {
    const ovTab = document.querySelector('#dt-drawer-tabs .dt-drawer-tab');
    if (ovTab && typeof dtDrawerTab === 'function') dtDrawerTab('overview', ovTab);
  });
  return out;
};

/* Tablet */
if (typeof tbOpenTruck === 'function') {
  const dcTourOrigTbOpenTruck = tbOpenTruck;
  tbOpenTruck = function (...args) {
    const out = dcTourOrigTbOpenTruck.apply(this, args);
    dcTourMaybeDrawerChapter('tablet', () => {
      const ovTab = document.querySelector('#tb-drawer .tb-drawer-tab');
      if (ovTab && typeof tbDrawerTab === 'function') tbDrawerTab('overview', ovTab);
    });
    return out;
  };
}

/* Mobile — openDrawer is the universal mobile drawer entry
   (list rows, CC view, map cards all route through it). */
if (typeof openDrawer === 'function') {
  const dcTourOrigOpenDrawer = openDrawer;
  openDrawer = function (...args) {
    const out = dcTourOrigOpenDrawer.apply(this, args);
    dcTourMaybeDrawerChapter('mobile', null);
    return out;
  };
}
