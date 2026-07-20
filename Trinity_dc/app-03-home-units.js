/* app-03-home-units.js — Home dashboard, unit drawer (ud), units table. Loads 3rd.
   Part of the app.js split. All six app-*.js files share one global
   scope and MUST load in numeric order (see index.html). */
function coSetNavDot(show) {
  /* Amber dot on "Components Overview" nav item — signals unfinished business */
  var navOpts = document.querySelectorAll('#drawer-nav-dropdown .wts-option');
  navOpts.forEach(function(opt) {
    if (opt.textContent.trim().startsWith('Components Overview')) {
      var dot = opt.querySelector('.co-nav-dot');
      if (show && !dot) {
        dot = document.createElement('span');
        dot.className = 'co-nav-dot';
        dot.style.cssText = 'display:inline-block;width:7px;height:7px;border-radius:50%;background:#d97706;margin-left:auto;flex-shrink:0;';
        opt.style.display = 'flex';
        opt.style.alignItems = 'center';
        opt.appendChild(dot);
      } else if (!show && dot) {
        dot.remove();
      }
    }
  });
  /* Also show dot on the nav pill label when in another tab */
  var navLabel = document.getElementById('drawer-nav-label');
  var existingDot = document.getElementById('co-nav-label-dot');
  if (show && !existingDot && navLabel) {
    var ldot = document.createElement('span');
    ldot.id = 'co-nav-label-dot';
    ldot.style.cssText = 'display:inline-block;width:7px;height:7px;border-radius:50%;background:#d97706;margin-left:6px;vertical-align:middle;flex-shrink:0;';
    navLabel.parentNode.insertBefore(ldot, navLabel.nextSibling);
  } else if (!show && existingDot) {
    existingDot.remove();
  }
}

/* ── MAINTENANCE MODE / TRUCK MODE POPOVER ──────────────
   Tapping the live pill on desktop or mobile shows an inline
   popover to switch between Live / Maintenance / Offline.    */

var dtCurrentMode = 'live'; /* shared state */

function dtApplyMode(mode) {
  dtCurrentMode = mode;
  var badge  = document.getElementById('dt-drawer-ign-badge');
  var dot    = badge ? badge.querySelector('.dt-drawer-ign-dot') : null;
  var text   = document.getElementById('dt-drawer-ign-text');

  /* Update desktop badge */
  if (badge) {
    badge.className = 'dt-drawer-ign-badge' + (mode === 'maintenance' ? ' maint' : mode === 'offline' ? ' off' : '');
  }
  if (dot) {
    dot.style.background = mode === 'live' ? '#2ecf1d' : mode === 'maintenance' ? '#f59e0b' : 'rgba(54,50,45,0.3)';
  }
  if (text) {
    text.textContent = mode === 'live' ? 'Ignition on' : mode === 'maintenance' ? 'Maintenance' : 'Offline';
  }

  /* Update mobile pill */
  var moPill = document.getElementById('mo-ign-pill');
  var moDot  = document.getElementById('mo-ign-dot');
  if (moPill) {
    moPill.className = 'd-ign-pill' + (mode === 'offline' ? ' off' : mode === 'maintenance' ? ' maint' : '');
  }
  if (moDot) {
    moDot.style.background = '';  /* controlled by CSS class */
  }

  /* Update active state on all popovers */
  ['dt-mode-opt-live','dt-mode-opt-maintenance','dt-mode-opt-offline'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('active', id.endsWith(mode));
  });
  ['mo-mode-opt-live','mo-mode-opt-maintenance','mo-mode-opt-offline'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('active', id.endsWith(mode));
  });

  /* If switching back to Live and there was an unresolved case — reshow banner */
  if (mode === 'live') {
    var dtBanner = document.getElementById('dt-error-banner');
    /* If banner was populated before maintenance, it will reappear since it persists */
  }

  /* Update truck data */
  if (dtDrawerTruckNum) {
    var t = trucks.find(function(tr) { return String(tr.num) === String(dtDrawerTruckNum); });
    if (t) t.truckMode = mode === 'live' ? 'Active' : mode === 'maintenance' ? 'Maintenance' : 'Offline';
  }
}

/* Desktop popover */
function dtToggleModePopover() {
  var pop = document.getElementById('dt-mode-popover');
  if (!pop) return;
  var isOpen = pop.style.display !== 'none';
  pop.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    /* Mark current mode */
    ['live','maintenance','offline'].forEach(function(m) {
      var el = document.getElementById('dt-mode-opt-' + m);
      if (el) el.classList.toggle('active', m === dtCurrentMode);
    });
  }
}
function dtSetMode(mode) {
  var pop = document.getElementById('dt-mode-popover');
  if (pop) pop.style.display = 'none';
  dtApplyMode(mode);
  /* If going to maintenance, also clear the error banner via coSetMaintenanceDirect logic */
  /* Banner and nav dot persist in maintenance — case still open */
}

/* Mobile popover */
function moToggleModePopover() {
  var pop = document.getElementById('mo-mode-popover');
  if (!pop) return;
  var isOpen = pop.style.display !== 'none';
  pop.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    ['live','maintenance','offline'].forEach(function(m) {
      var el = document.getElementById('mo-mode-opt-' + m);
      if (el) el.classList.toggle('active', m === dtCurrentMode);
    });
  }
}
function moSetMode(mode) {
  var pop = document.getElementById('mo-mode-popover');
  if (pop) pop.style.display = 'none';
  dtApplyMode(mode);
  if (mode === 'maintenance') coSetNavDot(false);
}

/* Close popovers on outside click */

function coViewTruckLogs() {
  /* Pre-filter desktop logs to WdsNoConnection alarm from replacement date */
  if (typeof dtLogsFilters !== 'undefined') {
    dtLogsFilters.msgType = 'Event';
    dtLogsFilters.subType = 'WdsNoConnection';
    dtLogsFilters.from    = '2026-03-23';
    dtLogsFilters.to      = '';
    dtLogsFilters.source  = 'all';
    dtLogsFilters.search  = '';
  }

  /* Mobile — navigate to Truck Logs and open the WDS alarm entry */
  var logsOption = document.querySelector('#drawer-nav-dropdown .wts-option:nth-child(3)');
  if (logsOption) {
    selectDrawerNav('Truck Logs', logsOption);
    renderLogRows();
    setTimeout(function() { openDetail(15); }, 80);
  }

  /* Desktop — switch tab, sync filter UI, select WDS alarm row */
  var logsTabBtn = document.querySelector(".dt-drawer-tab[onclick*=\"'logs'\"]");
  if (logsTabBtn) {
    dtDrawerTab('logs', logsTabBtn);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        var msgSel = document.getElementById('dt-logs-msgtype');
        var subSel = document.getElementById('dt-logs-subtype');
        var fromEl = document.querySelector('.dt-logs-field-date input');
        if (msgSel) { msgSel.value = 'Event'; dtLogsOnMsgTypeChange('Event'); }
        if (subSel) { subSel.value = 'WdsNoConnection'; }
        if (fromEl) { fromEl.value = '2026-03-23'; dtLogsFilters.from = '2026-03-23'; }
        dtLogsRender();
        setTimeout(function() { dtLogsSelectRow(15, { scrollIntoView:true }); }, 80);
      });
    });
  }
}

/* ══════════════════════════════════════════════════
   VERSION TOGGLE — Final Version / MVP
═══════════════════════════════════════════════════ */
var dtCurrentVersion = 'final';

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('verifi-dark', isDark ? '1' : '0');
  const toggle = document.getElementById('vp-dark-toggle');
  const icon   = document.getElementById('vp-dark-icon');
  if (toggle) toggle.style.background = isDark ? '#6492f1' : 'rgba(255,255,255,0.15)';
  if (icon) {
    icon.innerHTML = isDark
      ? '<path d="M13.5 8A5.5 5.5 0 016 2.5a6 6 0 100 11A5.5 5.5 0 0113.5 8z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'
      : '<path d="M8 1v1M8 14v1M1 8h1M14 8h1M3.05 3.05l.7.7M12.25 12.25l.7.7M3.05 12.95l.7-.7M12.25 3.75l.7-.7M11 8a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>';
  }
  /* Refresh nav active state colors */
  if (typeof dtNavGo === 'function' && typeof dtUnitsActivePage !== 'undefined') {
    dtNavGo(dtUnitsActivePage);
  }
  if (typeof senRedrawSlump    === 'function') senRedrawSlump();
  if (typeof senRedrawWater    === 'function') senRedrawWater();
  if (typeof senRedrawDrum     === 'function') senRedrawDrum();
  if (typeof senRedrawPressure === 'function') senRedrawPressure();
  if (typeof senRedrawCell     === 'function') senRedrawCell();
  if (typeof senRedrawSat      === 'function') senRedrawSat();
}

/* Restore dark mode on load */
(function() {
  if (localStorage.getItem('verifi-dark') === '1') {
    document.body.classList.add('dark');
  }
})();

function setVersion(version) {
  dtCurrentVersion = version;
  /* Sync dropdown checkmarks */
  vpOptsUpdateState();

  var overlay = document.getElementById('mvp-overlay');
  if (version === 'mvp') {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'mvp-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:var(--base);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:var(--font);';
      overlay.innerHTML = ''
        + '<div style="width:56px;height:56px;border-radius:16px;background:var(--layer-1);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;">'
        + '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--strong)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        + '</div>'
        + '<div style="text-align:center;">'
        + '<div style="font-size:22px;font-weight:500;color:var(--strong);letter-spacing:-0.66px;margin-bottom:6px;">MVP — Coming Soon</div>'
        + '<div style="font-size:14px;color:var(--soft);letter-spacing:-0.28px;max-width:320px;line-height:1.5;">The MVP scope is still being defined.<br>Switch back to Final Version to explore<br>the full prototype.</div>'
        + '</div>'
        + '<button onclick="setVersion(\'final\')" style="margin-top:8px;background:var(--strong);color:white;border:none;border-radius:32px;padding:10px 24px;font-size:14px;font-weight:500;font-family:var(--font);letter-spacing:-0.28px;cursor:pointer;">View Final Version</button>';
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
  } else {
    if (overlay) overlay.style.display = 'none';
  }
}

/* ══════════════════════════════════════════════════
   ROLE TOGGLE — External / Internal
═══════════════════════════════════════════════════ */
var dtCurrentRole = 'external';

function setRole(role) {
  dtCurrentRole = role;
  /* Sync dropdown checkmarks */
  vpOptsUpdateState();
  var show = role === 'internal' ? '' : 'none';
  /* Desktop + mobile share the same wrapper ID; tablet has its own */
  var addWrap = document.getElementById('dt-units-add-btn-wrap');
  if (addWrap) addWrap.style.display = show;
  var tbAddWrap = document.getElementById('tb-units-add-btn-wrap');
  if (tbAddWrap) tbAddWrap.style.display = show;
  dtUnitsUpdateTabs();
  dtUnitsPendingRender();
}

/* ══════════════════════════════════════════════════
   UNITS PAGE — TAB STRIP
═══════════════════════════════════════════════════ */
var dtUnitsActiveTab = 'units';

function dtUnitsUpdateTabs() {
  var pending = UNITS_DATA.filter(function(u) { return u.status === 'Pending Return'; });
  var tab = document.getElementById('dt-units-tab-pending');
  var badge = document.getElementById('dt-units-pending-count');
  if (tab) { tab.style.display = pending.length > 0 ? '' : 'none'; }
  if (badge) badge.textContent = pending.length;
  if (pending.length === 0 && dtUnitsActiveTab === 'pending') dtUnitsTabSwitch('units');
}

function dtUnitsTabSwitch(tab) {
  dtUnitsActiveTab = tab;
  document.getElementById('dt-units-tab-units').classList.toggle('active', tab === 'units');
  document.getElementById('dt-units-tab-pending').classList.toggle('active', tab === 'pending');
  var uc = document.getElementById('dt-units-tab-content-units');
  var pc = document.getElementById('dt-units-tab-content-pending');
  if (uc) uc.style.display = tab === 'units' ? '' : 'none';
  if (pc) { pc.style.display = tab === 'pending' ? 'flex' : 'none'; pc.style.flexDirection='column'; pc.style.flex='1'; pc.style.minWidth='0'; pc.style.overflow='hidden'; }
  /* Hide Return Units button on Pending Return tab */
  var editBtn = document.getElementById('dt-units-select-btn');
  if (editBtn) editBtn.style.display = tab === 'units' ? '' : 'none';
  if (tab === 'pending') dtUnitsPendingRender();
}

/* ══════════════════════════════════════════════════
   PENDING RETURN TAB
═══════════════════════════════════════════════════ */
var dtPendingSelected = new Set();
var dtPendingSelectMode = false;

function dtUnitsPendingRender() {
  var pending = UNITS_DATA.filter(function(u) { return u.status === 'Pending Return'; });
  dtUnitsUpdateTabs();
  var thead = document.getElementById('dt-pending-thead');
  if (!thead) return;
  thead.innerHTML = '<tr>'
    + '<th class="dt-th" style="width:40px;min-width:40px;padding:0 8px;"></th>'
    + '<th class="dt-th">Unit ID</th><th class="dt-th">TCG ID</th>'
    + '<th class="dt-th">Contract</th><th class="dt-th">System Type</th>'
    + '<th class="dt-th">Return Requested</th><th class="dt-th">Days Pending</th></tr>';
  var tbody = document.getElementById('dt-pending-tbody');
  if (!tbody) return;
  if (pending.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--soft);font-size:14px;">No units pending return</td></tr>';
    return;
  }
  var now = new Date();
  tbody.innerHTML = pending.map(function(u, i) {
    var days = '--';
    if (u.returnDate) { var rd = new Date(u.returnDate); days = Math.max(0, Math.floor((now-rd)/86400000)); }
    var isSelected = dtPendingSelected.has(u.id);
    var cbVis = (dtCurrentRole==='internal') ? '' : 'visibility:hidden;pointer-events:none;';
    var safeId = u.id.replace(/'/g,"\\'");
    var daysColor = days!=='--' ? (days>14?'#d70100':days>7?'#d97706':'var(--soft)') : 'var(--soft)';
    var daysFw = days!=='--' && days>7 ? '500' : '400';
    return '<tr class="dt-tr'+(i%2===1?' alt':'')+(isSelected?' dt-selected':'')+'" data-unit="'+u.id+'">'
      +'<td class="dt-td" style="width:40px;min-width:40px;padding:0 8px;"><input type="checkbox" '+(isSelected?'checked':'')+' style="'+cbVis+'" onclick="event.stopPropagation();dtPendingToggleRow(\''+safeId+'\',this)"/></td>'
      +'<td class="dt-td"><strong>'+u.id+'</strong></td>'
      +'<td class="dt-td" style="font-family:monospace;font-size:12px;">'+(u.tgw||'--')+'</td>'
      +'<td class="dt-td">'+(u.contract||'--')+'</td>'
      +'<td class="dt-td">'+(u.sysType||'--')+'</td>'
      +'<td class="dt-td">'+(u.returnDate||'--')+'</td>'
      +'<td class="dt-td"><span style="color:'+daysColor+';font-weight:'+daysFw+';">'+(days!=='--'?days+' days':'--')+'</span></td>'
      +'</tr>';
  }).join('');
  var bulkBar = document.getElementById('dt-pending-bulk-bar');
  if (bulkBar) bulkBar.style.display = (dtCurrentRole==='internal') ? 'flex' : 'none';
}

function dtPendingToggleRow(id, cb) {
  if (cb.checked) dtPendingSelected.add(id); else dtPendingSelected.delete(id);
  var count = dtPendingSelected.size;
  var countEl = document.getElementById('dt-pending-bulk-count');
  if (countEl) countEl.textContent = count===0?'0 selected':count+' unit'+(count===1?'':'s')+' selected';
  var btn = document.getElementById('dt-pending-mark-btn');
  if (btn) { btn.disabled=count===0; btn.style.opacity=count===0?'0.4':'1'; }
}

function dtPendingSelectAll() {
  UNITS_DATA.filter(function(u){return u.status==='Pending Return';}).forEach(function(u){dtPendingSelected.add(u.id);});
  dtUnitsPendingRender();
  dtPendingToggleRow('', {checked:false}); /* trigger count update */
  var count = dtPendingSelected.size;
  var countEl = document.getElementById('dt-pending-bulk-count');
  if (countEl) countEl.textContent = count+' unit'+(count===1?'':'s')+' selected';
  var btn = document.getElementById('dt-pending-mark-btn');
  if (btn) { btn.disabled=false; btn.style.opacity='1'; }
}

function dtPendingCancelSelect() {
  dtPendingSelected.clear();
  dtUnitsPendingRender();
  var countEl = document.getElementById('dt-pending-bulk-count');
  if (countEl) countEl.textContent = '0 selected';
  var btn = document.getElementById('dt-pending-mark-btn');
  if (btn) { btn.disabled=true; btn.style.opacity='0.4'; }
}

function dtPendingMarkReceived() {
  if (dtCurrentRole !== 'internal') return;
  var ids = [...dtPendingSelected];
  ids.forEach(function(id) {
    var idx = UNITS_DATA.findIndex(function(u){return u.id===id;});
    if (idx!==-1) UNITS_DATA.splice(idx,1);
  });
  dtPendingSelected.clear();
  dtUnitsPendingRender();
  dtUnitsRender();
  dtUnitsUpdateTabs();
  dtShowToast({ title:ids.length+' unit'+(ids.length===1?'':'s')+' marked received', body:'Removed from Pending Return', variant:'success' });
}

/* ══════════════════════════════════════════════════
   UNITS SCREEN
═══════════════════════════════════════════════════ */


const unitsFilterState = { status: new Set(), sysType: new Set(), assigned: new Set() };
let unitsSearchQuery = '';

function statusClass(s) {
  if (s === 'Linked Unit')      return 'ustatus-linked';
  if (s === 'Unlinked Unit')    return 'ustatus-unlinked';
  if (s === 'Maintenance') return 'ustatus-maint';
  return 'ustatus-unlinked';
}

function statusPill(s) {
  const cls = statusClass(s);
  const label = s === 'Linked Unit' ? 'Active Unit' : s;
  return `<span class="ustatus ${cls}"><span class="ustatus-dot"></span>${label}</span>`;
}

const UNLINKED_TRUCK_PILL = `<span style="font-size:12px;color:var(--soft);font-weight:500;letter-spacing:-0.2px;">Unlinked</span>`;

function unitsFilterMatch(u) {
  const { status, sysType, assigned } = unitsFilterState;
  if (status.size   > 0 && !status.has(u.status))   return false;
  if (sysType.size  > 0 && !sysType.has(u.sysType)) return false;
  if (assigned.size > 0) {
    const hasT = u.truck !== '--';
    if (assigned.has('yes') && !hasT) return false;
    if (assigned.has('no')  &&  hasT) return false;
    if (assigned.has('yes') && assigned.has('no')) { /* both = show all */ }
  }
  return true;
}

let mobUnitsSelectMode = false;
let mobUnitsSelected = new Set();

/* Mobile units status text (plain, not pill) */
function mobUnitStatusText(status) {
  const map = {
    'Linked Unit':    'Active Unit',
    'Unlinked Unit':  'Unlinked Unit',
    'Pending Return': 'Pending Return',
    'Maintenance':    'Maintenance',
  };
  return map[status] || status;
}

function renderUnits() {
  const q = unitsSearchQuery.toLowerCase();
  const filtered = UNITS_DATA.filter(u => {
    if (!unitsFilterMatch(u)) return false;
    if (q) return u.id.toLowerCase().includes(q) ||
                  u.status.toLowerCase().includes(q) ||
                  (u.truck || '').toLowerCase().includes(q);
    return true;
  });

  const countEl = document.getElementById('units-count-label');
  if (countEl) countEl.textContent = `All Units \xb7 ${filtered.length} unit${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    document.getElementById('units-list').innerHTML =
      `<div style="padding:40px 16px;text-align:center;font-size:14px;color:var(--soft);">No units match your filters.</div>`;
    return;
  }

  const chevSvg = `<svg class="mob-units-chev" width="8" height="13" viewBox="0 0 8 14" fill="none" style="flex-shrink:0;"><path d="M1 1l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const eligible = u => u.status === 'Unlinked Unit';

  document.getElementById('units-list').innerHTML = filtered.map((u, i) => {
    const isSelected = mobUnitsSelected.has(u.id);
    const safeId = u.id.replace(/'/g, "\\'");
    const canSelect = eligible(u);
    const statusTxt = mobUnitStatusText(u.status);
    const sysVal  = u.sysType  || u.system     || 'Spark';
    const cfgVal  = u.config   || u.configType  || 'Temp + Admix';
    const cfgShort = cfgVal === 'Measured Only' ? 'Measure' : 'Manage';
    const isOpen = mobUnitsExpandedId === u.id;

    /* Checkbox cell */
    const cbCell = mobUnitsSelectMode
      ? `<div class="mob-units-td mob-units-td-cb">` +
        `<input type="checkbox" class="dt-units-cb" ${isSelected?'checked':''} ${!canSelect?'disabled':''}` +
        ` style="${canSelect?'':'visibility:hidden;pointer-events:none;'}"` +
        ` onclick="event.stopPropagation();mobUnitsToggleRow('${safeId}',this)">` +
        `</div>`
      : `<div class="mob-units-td mob-units-td-cb"></div>`;

    const clickHandler = mobUnitsSelectMode
      ? (canSelect ? `onclick="mobUnitsRowClick('${safeId}')"` : '')
      : `onclick="mobUnitsToggleExpand('${safeId}')"`;
    const cursor = mobUnitsSelectMode ? (canSelect ? 'pointer' : 'default') : 'pointer';

    /* Expand panel rows */
    const truckVal = (u.truck && u.truck !== '--') ? u.truck : '\u2014';
    const tgwVal   = u.tgw || '\u2014';
    const viewBtn  = (u.truck && u.truck !== '--')
      ? `<div class="mob-units-expand-cta"><button class="mob-units-expand-btn" onclick="event.stopPropagation();openUnitDetail('${safeId}')">View Unit</button></div>`
      : `<div class="mob-units-expand-cta"><button class="mob-units-expand-btn" onclick="event.stopPropagation();openUnitDetail('${safeId}')">View Unit</button></div>`;

    const rowBg = i % 2 === 0 ? 'var(--layer-1)' : 'var(--base)';
    const expandPanel = `<div class="mob-units-expand${isOpen?' open':''}" id="mob-exp-${u.id.replace(/[^a-z0-9]/gi,'_')}" style="background:${rowBg}">` +
      `<div class="mob-units-expand-row"><span class="mob-units-expand-label">Unit ID</span><span class="mob-units-expand-value">${u.id}</span></div>` +
      `<div class="mob-units-expand-row"><span class="mob-units-expand-label">Status</span><span class="mob-units-expand-value">${statusPill(u.status)}</span></div>` +
      `<div class="mob-units-expand-row"><span class="mob-units-expand-label">Trucks</span><span class="mob-units-expand-value">${truckVal}</span></div>` +
      `<div class="mob-units-expand-row"><span class="mob-units-expand-label">TCG ID</span><span class="mob-units-expand-value" style="font-family:'DM Mono',monospace;font-size:12px;">${tgwVal}</span></div>` +
      `<div class="mob-units-expand-row"><span class="mob-units-expand-label">System</span><span class="mob-units-expand-value">${sysVal}</span></div>` +
      `<div class="mob-units-expand-row"><span class="mob-units-expand-label">Config</span><span class="mob-units-expand-value">${cfgVal}</span></div>` +
      viewBtn +
      `</div>`;

    return `<div>` +
      `<div class="mob-units-row${isSelected?' dt-selected':''}${isOpen?' mob-row-open':''}" ${clickHandler} style="cursor:${cursor};background:${rowBg};" data-unit="${u.id}">` +
        cbCell +
        `<div class="mob-units-td mob-units-td-id">${chevSvg} ${u.id}</div>` +
        `<div class="mob-units-td">${statusTxt}</div>` +
        `<div class="mob-units-td">${sysVal}</div>` +
      `</div>` +
      expandPanel +
      `</div>`;
  }).join('');
}

let mobUnitsExpandedId = null;

function mobUnitsToggleExpand(id) {
  mobUnitsExpandedId = mobUnitsExpandedId === id ? null : id;
  renderUnits();
}

function mobUnitsSelectToggle() {
  mobUnitsSelectMode = !mobUnitsSelectMode;
  mobUnitsSelected.clear();
  const bar = document.getElementById('mob-units-bulk-bar');
  if (bar) { bar.style.display = mobUnitsSelectMode ? 'flex' : 'none'; bar.style.flexDirection = 'column'; }
  const btn = document.getElementById('mob-units-select-btn');
  if (btn) {
    btn.style.background  = mobUnitsSelectMode ? 'rgba(48,105,227,0.1)' : '';
    btn.style.borderColor = mobUnitsSelectMode ? 'rgba(48,105,227,0.4)' : '';
    btn.style.color       = mobUnitsSelectMode ? 'var(--blue)' : '';
  }
  const thCb = document.getElementById('mob-units-th-cb');
  if (thCb) thCb.style.visibility = mobUnitsSelectMode ? 'visible' : 'hidden';
  const countEl = document.getElementById('mob-units-bulk-count');
  if (countEl) countEl.textContent = '0 selected';
  const retBtn = document.getElementById('mob-units-bulk-return-btn');
  if (retBtn) retBtn.disabled = true;
  renderUnits();
}

function mobUnitsRowClick(id) {
  if (mobUnitsSelected.has(id)) {
    mobUnitsSelected.delete(id);
  } else {
    mobUnitsSelected.add(id);
  }
  mobUnitsUpdateBulkBar();
  renderUnits();
}


function mobUnitsToggleRow(id, cb) {
  if (cb.checked) mobUnitsSelected.add(id);
  else mobUnitsSelected.delete(id);
  mobUnitsUpdateBulkBar();
}

function mobUnitsUpdateBulkBar() {
  const count = mobUnitsSelected.size;
  const countEl = document.getElementById('mob-units-bulk-count');
  if (countEl) countEl.textContent = count === 0 ? '0 selected' : `${count} unit${count===1?'':'s'} selected`;
  const retBtn = document.getElementById('mob-units-bulk-return-btn');
  if (retBtn) retBtn.disabled = count === 0;
}

function mobUnitsSelectAll() {
  UNITS_DATA.filter(u => u.status === 'Unlinked Unit').forEach(u => mobUnitsSelected.add(u.id));
  mobUnitsUpdateBulkBar();
  renderUnits();
}

function mobUnitsReturnConfirm() {
  if (mobUnitsSelected.size === 0) return;
  const ids = [...mobUnitsSelected];
  const unitRows = ids.map(id => `<div class="dt-return-modal-unit-row">${id}</div>`).join('');
  const overlay = document.createElement('div');
  overlay.className = 'dt-return-overlay';
  overlay.id = 'mob-return-overlay';
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
        <button class="dt-return-modal-cancel" onclick="mobUnitsReturnCancel()">Cancel</button>
        <button class="dt-return-modal-confirm" onclick="mobUnitsReturnDo()">Return to Verifi</button>
      </div>
    </div>`;
  const mount = document.getElementById('s-units');
  if (mount) { mount.style.position = 'relative'; mount.appendChild(overlay); }
}

function mobUnitsReturnCancel() {
  document.getElementById('mob-return-overlay')?.remove();
}

function mobUnitsReturnDo() {
  const ids = [...mobUnitsSelected];
  const now = new Date();
  const dateStr = (now.getMonth()+1) + '/' + now.getDate() + '/' + now.getFullYear();
  ids.forEach(id => {
    const u = UNITS_DATA.find(u => u.id === id);
    if (u) { u.status = 'Pending Return'; u.returnDate = dateStr; }
  });
  mobUnitsReturnCancel();
  mobUnitsSelectMode = false;
  mobUnitsSelected.clear();
  const btn = document.getElementById('mob-units-select-btn');
  if (btn) { btn.style.background = ''; btn.style.borderColor = ''; btn.style.color = ''; }
  const bar = document.getElementById('mob-units-bulk-bar');
  if (bar) bar.style.display = 'none';
  renderUnits();
  dtShowToast({
    title: `${ids.length} unit${ids.length === 1 ? '' : 's'} flagged for return`,
    body: `Pending Return · Verifi will confirm receipt`,
    variant: 'warning'
  });
}

function goToAllTrucks() {
  mobSwuClose();
  moMapBack();
  /* Switch to s-main and close the nav */
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('s-main').classList.add('active');
  /* Mark All trucks as active in sidenav */
  document.querySelectorAll('.sn-sub-item').forEach(i => i.classList.remove('active'));
  document.querySelector('.sn-sub-item').classList.add('active');
  closeNav();
}

function openUnits() {
  mobSwuClose();
  moMapBack();
  closeNav();
  /* Switch active screen */
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('s-units').classList.add('active');
  /* Update sidenav active state */
  document.querySelectorAll('.sn-sub-item').forEach(i => i.classList.remove('active'));
  const items = document.querySelectorAll('.sn-sub-item');
  items.forEach(i => { if (i.textContent.trim() === 'Units') i.classList.add('active'); });
  renderUnits();
}


/* Contract options per account */
const AU_CONTRACTS = {
  'Cemex AZ': [
    'Cemex San Diego',
    'Cemex San Antonio',
    'Cemex Ocala',
    'Cemex Orlando',
    'Cemex Miami',
    'Cemex AZ',
    'Cemex Phoenix',
    'Cemex Tucson',
  ],
  'Readymix ABC':  ['Standard Service', 'Premium Service', 'Full Fleet'],
  'SRM Tennessee': ['SRM Standard', 'SRM Extended'],
  'SRM Texas':     ['SRM Standard', 'SRM Extended'],
  'Vulcan':        ['Vulcan Core', 'Vulcan Plus'],
};

/* Active account — scopes unit pickers so only units belonging to this
   account appear when attaching to a truck. In production this would come
   from the authenticated session; in the prototype it is fixed to Cemex AZ.
   The contract label "Cemex AZ" is used as the umbrella — any unit whose
   contract value is "Cemex AZ" belongs to this account. */
const ACTIVE_ACCOUNT = 'Cemex AZ';

/* Track custom dropdown values */
const auValues = { account: '', contract: '', 'sys-type': '', config: '' };

/* Dropdown open/close/select */
function auToggleDd(key) {
  const btn  = document.getElementById('au-' + key + '-btn');
  const menu = document.getElementById('au-' + key + '-menu');
  const chev = document.getElementById('au-' + key + '-chev');
  if (!menu || btn.disabled) return;
  const open = menu.style.display === 'block';
  /* Close all other dropdowns first */
  ['account','contract','sys-type','config'].forEach(k => {
    const m = document.getElementById('au-' + k + '-menu');
    const c = document.getElementById('au-' + k + '-chev');
    const b = document.getElementById('au-' + k + '-btn');
    if (m) m.style.display = 'none';
    if (c) c.classList.remove('open');
    if (b) b.classList.remove('au-dd-open');
  });
  if (!open) {
    menu.style.display = 'block';
    chev.classList.add('open');
    btn.classList.add('au-dd-open');
  }
}

function auSelectDd(key, value) {
  auValues[key] = value;
  const val  = document.getElementById('au-' + key + '-val');
  const menu = document.getElementById('au-' + key + '-menu');
  const chev = document.getElementById('au-' + key + '-chev');
  const btn  = document.getElementById('au-' + key + '-btn');
  if (val) { val.textContent = value; val.style.color = 'var(--strong)'; }
  if (menu) {
    /* Mark selected */
    menu.querySelectorAll('.au-dd-item').forEach(el => {
      el.classList.toggle('selected', el.textContent.trim() === value);
    });
    menu.style.display = 'none';
  }
  if (chev) chev.classList.remove('open');
  if (btn)  btn.classList.remove('au-dd-open');
  if (key === 'account') auAccountChanged(value);
  auValidate();
}

function auAccountChanged(account) {
  const contractMenu = document.getElementById('au-contract-menu');
  const contractBtn  = document.getElementById('au-contract-btn');
  const contractVal  = document.getElementById('au-contract-val');
  /* Reset contract */
  auValues.contract = '';
  if (contractVal) { contractVal.textContent = 'Select a contract type'; contractVal.style.color = 'var(--soft)'; }
  if (contractMenu) {
    const contracts = AU_CONTRACTS[account] || [];
    contractMenu.innerHTML = contracts.map(c =>
      `<div class="au-dd-item" onclick="auSelectDd('contract','${c}')">${c}</div>`
    ).join('');
  }
  if (contractBtn) {
    contractBtn.disabled = !account;
    contractBtn.classList.toggle('au-dd-disabled', !account);
  }
}

function openAddUnit() {
  /* Reset all custom dropdowns */
  ['contract','sys-type','config'].forEach(key => {
    auValues[key] = '';
    const val  = document.getElementById('au-' + key + '-val');
    const menu = document.getElementById('au-' + key + '-menu');
    const chev = document.getElementById('au-' + key + '-chev');
    const btn  = document.getElementById('au-' + key + '-btn');
    if (val) { val.style.color = 'var(--soft)'; }
    if (menu) { menu.style.display = 'none'; menu.querySelectorAll('.au-dd-item').forEach(el => el.classList.remove('selected')); }
    if (chev) chev.classList.remove('open');
    if (btn)  btn.classList.remove('au-dd-open');
  });
  /* Reset contract label */
  const contractVal = document.getElementById('au-contract-val');
  if (contractVal) contractVal.textContent = 'Select a contract type';
  const contractBtn = document.getElementById('au-contract-btn');
  if (contractBtn) { contractBtn.disabled = false; contractBtn.classList.remove('au-dd-disabled'); }
  /* Reset text inputs */
  ['au-unit-id','au-tgw'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.style.borderColor = ''; el.style.color = ''; }
  });
  /* Account is always pre-set to the current session account */
  auValues.account = 'Cemex AZ';
  auAccountChanged('Cemex AZ');
  auValidate();

  /* Open sheet */
  document.getElementById('add-unit-overlay').style.display = 'block';
  const sheet = document.getElementById('add-unit-sheet');
  requestAnimationFrame(() => sheet.style.transform = 'translateX(0)');
}

function closeAddUnit() {
  const sheet = document.getElementById('add-unit-sheet');
  sheet.style.transform = 'translateX(100%)';
  setTimeout(() => {
    document.getElementById('add-unit-overlay').style.display = 'none';
  }, 300);
}


function auValidate() {
  const unitId = (document.getElementById('au-unit-id').value || '').trim();
  const btn    = document.getElementById('au-submit-btn');
  const valid  = unitId && auValues.contract && auValues['sys-type'] && auValues.config;
  btn.disabled = !valid;
  btn.style.background = valid ? 'var(--blue)' : 'rgba(54,50,45,0.15)';
  btn.style.color      = valid ? 'white' : 'var(--soft)';
  btn.style.cursor     = valid ? 'pointer' : 'default';
}

function submitAddUnit() {
  const account  = auValues.account;
  const contract = auValues.contract;
  const unitId   = (document.getElementById('au-unit-id').value || '').trim();
  const sysType  = auValues['sys-type'];
  const config   = auValues.config;
  const tgw      = (document.getElementById('au-tgw').value || '').trim();

  if (!account || !contract || !unitId || !sysType || !config) return;

  /* Check for duplicate unit ID */
  if (UNITS_DATA.find(u => u.id === unitId)) {
    const idInput = document.getElementById('au-unit-id');
    idInput.style.borderColor = 'var(--red)';
    idInput.style.color = 'var(--red)';
    idInput.placeholder = 'Unit ID already exists';
    idInput.value = '';
    setTimeout(() => {
      idInput.style.borderColor = '';
      idInput.style.color = '';
      idInput.placeholder = 'Enter unit ID';
    }, 2500);
    return;
  }

  /* Add to UNITS_DATA as Unlinked */
  UNITS_DATA.push({
    id: unitId,
    status: 'Unlinked Unit',
    truck: '--',
    tgw: tgw,
    contract: contract,
    sysType: sysType,
    config: config,
    firstCommissioned: null, /* set when first linked to a truck */
    assignedToTruck: null,
    decommissioned: null,
  });

  closeAddUnit();
  renderUnits();

  /* Brief success toast */
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:#1e6252;color:white;padding:12px 20px;border-radius:32px;font-size:14px;font-weight:500;font-family:var(--font);letter-spacing:-0.28px;z-index:100;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,0.2);';
  toast.textContent = `Unit ${unitId} added`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

/* ── Unit detail ── */
/* ══════════════════════════════════════════════════
   UNIT COMPOSITION HISTORY
   Each component entry is one slot in the unit.
   history[] = dated MAC ID snapshots, newest first.
   A component that was ADDED later simply has a later
   first date. One that was REMOVED has a null mac after
   its last known date.
═══════════════════════════════════════════════════ */
const UNIT_HISTORY = {

  /* U-101337 — V5 Measured Only, Temperate Water + Admix removed 2024 */
  'U-101337': [
    { name: 'Bluetooth Radio', history: [{ date: 'Current', mac: 'JJJ-210107919' }] },
    { name: 'Sensor', history: [
      { date: 'Current',   mac: 'BBB-203712457' },
      { date: '3/22/2021', mac: 'BBB-203700221' },
    ]},
    { name: 'External Display', history: [{ date: 'Current', mac: 'ED-820012' }] },
    { name: 'WDS', history: [
      { date: 'Current',   mac: 'WWW-601912457' },
      { date: '3/22/2021', mac: 'WWW-601900101' },
    ]},
    { name: 'Temperate Water', removed: true, removedDate: '2/14/2024', history: [
      { date: '2/14/2024', mac: 'RRR-109012457' },
      { date: '3/22/2021', mac: 'RRR-109000221' },
    ]},
    { name: 'Admix', removed: true, removedDate: '2/14/2024', history: [
      { date: '2/14/2024', mac: 'AP-124570' },
    ]},
  ],

  /* U-112033 — V5 Measured Only, Winter Water removed 2023, Admix never added */
  'U-112033': [
    { name: 'Bluetooth Radio', history: [{ date: 'Current', mac: 'JJJ-210121348' }] },
    { name: 'Sensor', history: [
      { date: 'Current',   mac: 'BBB-203721348' },
      { date: '2/28/2021', mac: 'BBB-203700348' },
    ]},
    { name: 'External Display', history: [{ date: 'Current', mac: 'ED-820021' }] },
    { name: 'WDS', history: [
      { date: 'Current',   mac: 'WWW-601921348' },
      { date: '2/28/2021', mac: 'WWW-601900348' },
    ]},
    { name: 'Winter Water', removed: true, removedDate: '8/30/2023', history: [
      { date: '8/30/2023', mac: 'EEE-301821348' },
      { date: '2/28/2021', mac: 'EEE-301800348' },
    ]},
  ],

  /* U-121392 — V5 Measured Only, Temperate Water + Admix removed 2022 */
  'U-121392': [
    { name: 'Bluetooth Radio', history: [{ date: 'Current', mac: 'JJJ-210190237' }] },
    { name: 'Sensor', history: [{ date: 'Current', mac: 'BBB-203790237' }] },
    { name: 'External Display', history: [{ date: 'Current', mac: 'ED-820090' }] },
    { name: 'WDS', history: [
      { date: 'Current',   mac: 'WWW-601990237' },
      { date: '6/14/2020', mac: 'WWW-601900237' },
    ]},
    { name: 'Temperate Water', removed: true, removedDate: '11/05/2022', history: [
      { date: '11/05/2022', mac: 'RRR-109090237' },
      { date: '6/14/2020',  mac: 'RRR-109000237' },
    ]},
    { name: 'Admix', removed: true, removedDate: '11/05/2022', history: [
      { date: '11/05/2022', mac: 'AP-902370' },
      { date: '6/14/2020',  mac: 'AP-902300' },
    ]},
  ],


  /* U-102674 — V5 Winter Water (truck 39821) */
  'U-102674': [
    { name: 'Bluetooth Radio', history: [{ date: 'Current', mac: 'JJJ-210139821' }] },
    { name: 'Sensor', history: [
      { date: 'Current',   mac: 'BBB-203739821' },
      { date: '8/14/2020', mac: 'BBB-203700821' },
    ]},
    { name: 'External Display', history: [{ date: 'Current', mac: 'ED-820039' }] },
    { name: 'WDS', history: [
      { date: 'Current',   mac: 'WWW-601939821' },
      { date: '8/14/2020', mac: 'WWW-601900821' },
    ]},
    { name: 'Winter Water', history: [
      { date: 'Current',   mac: 'EEE-301839821' },
      { date: '8/14/2020', mac: 'EEE-301800821' },
    ]},
    { name: 'Admix', history: [
      { date: 'Current',   mac: 'AP-398210' },
      { date: '8/14/2020', mac: 'AP-398200' },
    ]},
  ],

  'U-473829': [
    { name: 'Bluetooth Radio', history: [
      { date: 'Current', mac: 'JJJ-210095269' },
      { date: '5/23/2023', mac: 'JJJ-210082341' },
      { date: '3/6/2021',  mac: 'RRR-109034821' },
    ]},
    { name: 'Sensor', history: [
      { date: 'Current', mac: 'BBB-203719811' },
      { date: '5/23/2023', mac: 'BBB-203701042' },
      { date: '3/6/2021',  mac: 'RRR-109020034' },
    ]},
    { name: 'Temperate Water', history: [
      { date: 'Current', mac: 'RRR-109041822' },
      { date: '3/6/2021',  mac: 'RRR-109000192' },
    ]},
    { name: 'Winter Water', history: [
      { date: 'Current', mac: 'EEE-301820042' },
      { date: '5/23/2023', mac: 'EEE-301801193' },
    ]},
    { name: 'Admix', history: [
      { date: 'Current', mac: 'RRR-109044018' },
      { date: '1/3/2022',  mac: 'RRR-109028811' },
      { date: '3/6/2021',  mac: 'JJJ-210011029' },
    ]},
    { name: 'External Displays', history: [
      { date: 'Current', mac: 'NNN-401820091' },
      { date: '3/6/2021',  mac: 'UUU-501820013' },
    ]},
    { name: 'WDS', history: [
      { date: 'Current', mac: 'WWW-601920044' },
      { date: '3/6/2021',  mac: 'WWW-601900012' },
    ]},
  ],

  /* 83651024 — Winter Water removed, Admix never added */
  'U-836510': [
    { name: 'Bluetooth Radio', history: [
      { date: 'Current', mac: 'JJJ-210093801' },
      { date: '4/11/2022', mac: 'RRR-109028831' },
    ]},
    { name: 'Sensor', history: [
      { date: 'Current', mac: 'BBB-203714290' },
      { date: '4/11/2022', mac: 'BBB-203700881' },
    ]},
    { name: 'Temperate Water', history: [
      { date: 'Current',   mac: 'RRR-109040011' },
    ]},
    { name: 'Winter Water', removed: true, removedDate: '9/14/2023', history: [
      { date: '6/1/2022',  mac: 'EEE-301809922' },
    ]},
    { name: 'WDS', history: [
      { date: 'Current',   mac: 'WWW-601911203' },
    ]},
  ],

  /* 12039487 — Admix recently added, Winter Water never installed */
  'U-120394': [
    { name: 'Bluetooth Radio', history: [
      { date: 'Current', mac: 'JJJ-210091144' },
      { date: '2/2/2023',  mac: 'JJJ-210077832' },
      { date: '5/1/2021',  mac: 'RRR-109019204' },
    ]},
    { name: 'Sensor', history: [
      { date: 'Current', mac: 'BBB-203708811' },
      { date: '5/1/2021',  mac: 'RRR-109011003' },
    ]},
    { name: 'Temperate Water', history: [
      { date: 'Current', mac: 'RRR-109038820' },
      { date: '5/1/2021',  mac: 'RRR-109002901' },
    ]},
    { name: 'Admix', history: [
      { date: 'Current', mac: 'RRR-109042018' },
      { date: '3/15/2024', mac: 'RRR-109039100' },
    ]},
    { name: 'External Displays', history: [
      { date: 'Current',   mac: 'NNN-401814088' },
    ]},
    { name: 'WDS', history: [
      { date: 'Current', mac: 'WWW-601908831' },
      { date: '5/1/2021',  mac: 'WWW-601899204' },
    ]},
  ],

  /* 55512378 — both Winter Water & Admix removed */
  'U-555123': [
    { name: 'Bluetooth Radio', history: [
      { date: 'Current',   mac: 'JJJ-210088923' },
    ]},
    { name: 'Sensor', history: [
      { date: 'Current',   mac: 'BBB-203702941' },
    ]},
    { name: 'Temperate Water', history: [
      { date: 'Current',   mac: 'RRR-109035500' },
    ]},
    { name: 'Winter Water', removed: true, removedDate: '11/2/2023', history: [
      { date: '7/20/2022', mac: 'EEE-301815044' },
    ]},
    { name: 'Admix', removed: true, removedDate: '11/2/2023', history: [
      { date: '7/20/2022', mac: 'RRR-109031810' },
    ]},
    { name: 'WDS', history: [
      { date: 'Current',   mac: 'WWW-601905510' },
    ]},
  ],

  /* Default — base config, neither Winter Water nor Admix */
  '_default': [
    { name: 'Bluetooth Radio', history: [{ date: 'Current', mac: 'JJJ-210095001' }] },
    { name: 'Sensor',          history: [
      { date: 'Current',   mac: 'BBB-203719811' },
      { date: '1/14/2020', mac: 'BBB-203700193' },
    ]},
    { name: 'External Display', history: [{ date: 'Current', mac: 'ED-820001' }] },
    { name: 'WDS', history: [
      { date: 'Current',   mac: 'WWW-601920044' },
      { date: '3/12/2023', mac: 'WWW-601901193' },
      { date: '1/14/2020', mac: 'WWW-601900012' },
    ]},
    { name: 'Temperate Water', history: [{ date: 'Current', mac: 'RRR-109041099' }] },
    { name: 'Admix Pump', history: [{ date: 'Current', mac: 'AP-33001' }] },
  ],
};

let udCurrentUnit = null;
let udCurrentTab  = 'lifespan';

function openUnitDetail(unitId) {
  udCurrentUnit = UNITS_DATA.find(u => u.id === unitId);
  if (!udCurrentUnit) return;

  /* Pending units land directly on Configuration tab — same as desktop/tablet */
  const isPending = udCurrentUnit.status === 'Pending';
  udCurrentTab = isPending ? 'config' : 'lifespan';

  /* Status pill */
  const pill = document.getElementById('ud-status-pill');
  const cls  = statusClass(udCurrentUnit.status);
  pill.className = '';
  pill.style.cssText = '';
  const pillLabel = udCurrentUnit.status === 'Linked Unit' ? 'Active'
    : udCurrentUnit.status === 'Pending' ? 'Pending Configuration'
    : udCurrentUnit.status;
  pill.innerHTML = `<span class="ustatus ${cls}"><span class="ustatus-dot"></span>${pillLabel}</span>`;

  document.getElementById('ud-unit-id').textContent = unitId;

  /* Build nav and set label */
  const navLabel = isPending ? 'Configuration' : 'Unit Life Span';
  document.getElementById('ud-nav-label').textContent = navLabel;
  document.getElementById('ud-nav-chev').style.transform = '';
  udBuildNavDropdown(udCurrentTab);

  /* Arrow state */
  udUpdateArrows();

  if (isPending) {
    udRenderConfig();
  } else {
    udRenderLifespan();
  }

  const drawer = document.getElementById('units-drawer');
  drawer.style.display = 'flex';
  drawer.style.pointerEvents = 'auto';
  requestAnimationFrame(() => drawer.style.transform = 'translateX(0)');
}

/* Nav options for each unit state */
const UD_NAV_UNLINKED = [
  { label: 'Unit Life Span',  tab: 'lifespan' },
  { label: 'Attach to Truck', tab: 'attach'   },
];
const UD_NAV_PENDING = [
  { label: 'Unit Life Span',  tab: 'lifespan' },
  { label: 'Configuration',   tab: 'config'   },
];
const UD_NAV_LINKED = [
  { label: 'Unit Life Span',       tab: 'lifespan'  },
  { label: 'Component Timeline',   tab: 'timeline'  },
  { label: 'Truck Logs',           tab: 'logs'      },
  { label: 'Manual Control',       tab: 'manual'    },
  { label: 'Sensor',               tab: 'sensor'    },
  { label: 'Configuration',        tab: 'config'    },
];

function udNavItems(u) {
  if (!u) return UD_NAV_UNLINKED;
  if (u.status === 'Linked Unit') return UD_NAV_LINKED;
  if (u.status === 'Pending')     return UD_NAV_PENDING;
  return UD_NAV_UNLINKED;
}

function udBuildNavDropdown(activeTab) {
  const u    = udCurrentUnit;
  const items = udNavItems(u);
  const dd   = document.getElementById('ud-nav-dropdown');
  if (!dd) return;
  dd.innerHTML = items.map(item => {
    const active = item.tab === activeTab;
    return `<div class="wts-option${active ? ' wts-active' : ''}" onclick="udSelectNavTab('${item.tab}', this)">
      <span class="wts-check" style="${active ? '' : 'visibility:hidden'}">✓</span>${item.label}
    </div>`;
  }).join('');
}

function udSwitchTab(tab) {
  udCurrentTab = tab;
  /* Update pill label */
  const u    = udCurrentUnit;
  const items = udNavItems(u);
  const item  = items.find(i => i.tab === tab);
  if (item) document.getElementById('ud-nav-label').textContent = item.label;
  udBuildNavDropdown(tab);
  /* Render content */
  /* Config gets zero padding — accordion handles its own spacing */
  const wrap = document.getElementById('ud-body-wrap');
  if (wrap) {
    wrap.style.padding  = tab === 'config' ? '0' : '16px';
    wrap.style.background = 'var(--layer-2)';
  }
  if      (tab === 'lifespan')  udRenderLifespan();
  else if (tab === 'attach')    udRenderAttach();
  else if (tab === 'timeline')  udRenderStub('Component Timeline', 'Timeline data will appear here once the unit is actively monitoring the truck.');
  else if (tab === 'logs')      udRenderStub('Truck Logs', 'Live truck log entries will stream here during an active diagnostic session.');
  else if (tab === 'manual')    udRenderStub('Manual Control', 'Manual control options are available during an active diagnostic session.');
  else if (tab === 'sensor')    udRenderStub('Sensor', 'Sensor readings will appear here once the unit is calibrated and active.');
  else if (tab === 'config')    udRenderConfig();
}

function udSelectNavTab(tab, el) {
  document.getElementById('ud-nav-dropdown').style.display = 'none';
  document.getElementById('ud-nav-chev').style.transform = '';
  udSwitchTab(tab);
}

function udRenderStub(title, msg) {
  document.getElementById('ud-body').innerHTML = `
    <div style="padding:32px 16px;text-align:center;">
      <div style="font-size:14px;font-weight:500;color:var(--strong);letter-spacing:-0.3px;margin-bottom:8px;">${title}</div>
      <div style="font-size:13px;color:var(--soft);letter-spacing:-0.2px;line-height:1.6;">${msg}</div>
    </div>`;
}

function udRenderConfig() {
  /* Render the same full Configuration accordion view as the truck drawer.
     Uses ud-cfg-N IDs to avoid conflicts with the truck drawer cfg-acc-N IDs. */
  const u = udCurrentUnit;

  document.getElementById('ud-body').style.padding = '0';
  document.getElementById('ud-body').style.background = 'var(--layer-2)';

  /* Build clone source pool: same plant, other commissioned trucks */
  var allTrucks = [];
  (truckGroups || []).forEach(function(g) { allTrucks = allTrucks.concat(g.trucks || []); });
  /* Find the plant of the unit's linked truck */
  var linkedTruckNum = (u.truck && u.truck !== '--') ? String(u.truck) : (attachSelectedTruck ? String(attachSelectedTruck) : '');
  var linkedTruck = allTrucks.find(function(t) { return String(t.num) === linkedTruckNum; });
  /* If truck not in truckGroups (came from UNLINKED_TRUCKS pool), fall back to first plant */
  var unitPlant = linkedTruck ? linkedTruck.plant : (allTrucks.length > 0 ? allTrucks[0].plant : '');
  var clonePool = allTrucks.filter(function(t) {
    return t.plant === unitPlant && String(t.num) !== linkedTruckNum;
  }).slice(0, 6);

  /* Prototype clone settings — what we'll apply */
  const cloneSettings = [
    { key: 'Drum Magnets', field: 'numDrumMagnets', val: '4' },
    { key: 'Drum Size', field: 'drumSize', val: '8 yd³' },
    { key: 'Min Batch Revolutions', field: 'minBatch', val: '70' },
    { key: 'Min Agitation Speed', field: 'minAgi', val: '2 RPM' },
    { key: 'Min Mixing Speed', field: 'minMix', val: '8 RPM' },
    { key: 'Max Mixing Speed', field: 'maxMix', val: '18 RPM' },
    { key: 'Slump Tolerance', field: 'slumpTol', val: '0.5 in' },
    { key: 'Water Hose (QC→Nozzle)', field: 'waterHose1', val: '12 ft' },
  ];

  document.getElementById('ud-body').innerHTML = `
    <!-- Toolbar -->
    <div class="cfg-toolbar" style="position:sticky;top:0;z-index:10;">
      <div class="cfg-search">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke="#36322d9e" stroke-width="1.3"/><path d="M10.5 10.5l3 3" stroke="#36322d9e" stroke-width="1.3" stroke-linecap="round"/></svg>
        <input type="text" placeholder="Search" class="cfg-search-input">
      </div>
    </div>

    <!-- Clone card — persistent, no toggle -->
    <div class="clone-card" id="ud-clone-banner" style="margin:10px 12px;">
      <div class="clone-card-header">
        <div class="clone-card-text">
          <div class="clone-card-title">Clone setting from a similar truck <span id="ud-clone-applied-badge" style="display:none;" class="clone-applied-badge"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg> Applied</span></div>
          <div class="clone-card-sub">Prefill equipment &amp; Mixing setting from a commissioned truck</div>
        </div>
        <div class="clone-card-controls">
          <div class="clone-selector-wrap">
            <div class="clone-selector" id="ud-clone-selector" onclick="udCloneToggleDropdown()">
              <span class="clone-selector-label" id="ud-clone-selector-label">Truck Number</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#36322d9e" stroke-width="1.3" stroke-linecap="round"/></svg>
            </div>
            <div class="clone-dropdown" id="ud-clone-dropdown">
              <div class="clone-dropdown-search">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="#36322d9e" stroke-width="1.3"/><path d="M10 10l2.5 2.5" stroke="#36322d9e" stroke-width="1.3" stroke-linecap="round"/></svg>
                <input id="ud-clone-search" type="text" placeholder="Search truck Number" oninput="udCloneSearch(this.value)" autocomplete="off">
              </div>
              <div class="clone-truck-list" id="ud-clone-list"></div>
            </div>
          </div>
          <button class="clone-apply-btn" id="ud-clone-apply-btn" onclick="udApplyClone()" disabled>Apply Settings</button>
        </div>
      </div>
      <!-- Preview expands below when truck selected -->
      <div class="clone-preview" id="ud-clone-preview">
        <div class="clone-preview-label">Fields That will be Prefilled</div>
        ${cloneSettings.map(function(s) {
          return `<div class="clone-preview-row"><span class="clone-preview-key">${s.key}</span><span class="clone-preview-val">${s.val}</span></div>`;
        }).join('')}
      </div>
    </div>

    <div class="cfg-scroll" style="flex:none;overflow:visible;">
      <div class="cfg-list">

        <div class="cfg-acc open" id="ud-cfg-acc-0">
          <div class="cfg-acc-hdr" onclick="udToggleCfgAcc(0)">
            <div class="cfg-acc-text">
              <div class="cfg-acc-title">Information</div>
              <div class="cfg-acc-sub">Defines how this truck is registered and configured within the system for tracking and reporting.</div>
            </div>
            <svg class="cfg-chev" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M10.5 6L6 1.5 1.5 6" stroke="#36322d9e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="cfg-acc-body">
            <div class="cfg-fields">
              <div class="cfg-field"><label>Name</label><input type="text" value="${u.truck !== '--' ? u.truck : ''}" placeholder="e.g. Truck 45689 — Phoenix Central"></div>
              <div class="cfg-field"><label>Mixer Type</label><div class="cfg-select">${u.mixerType || 'Select mixer type'} <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#36322d" stroke-width="1.3" stroke-linecap="round"/></svg></div></div>
              <div class="cfg-field"><label>Batch System Code</label><input type="text" value="" placeholder="e.g. 234-2981-8373"></div>
              <div class="cfg-field"><label>Contract</label><div class="cfg-select">${u.contract || 'Select contract'} <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#36322d" stroke-width="1.3" stroke-linecap="round"/></svg></div></div>
              <div class="cfg-field"><label>System Type</label><div class="cfg-select">${u.sysType || 'Select system type'} <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#36322d" stroke-width="1.3" stroke-linecap="round"/></svg></div></div>
              <div class="cfg-field"><label>Configuration</label><div class="cfg-select">${u.config || 'Select configuration'} <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#36322d" stroke-width="1.3" stroke-linecap="round"/></svg></div></div>
              <div class="cfg-field"><label>TCG ID</label><input type="text" value="${u.tgw || ''}" placeholder="e.g. 210000381924" style="font-family:monospace;"></div>
              <div class="cfg-field"><label>VIN</label><input type="text" value="" placeholder="e.g. 1HGCM82633A123456"></div>
              <div class="cfg-field"><label>Mode</label><div class="cfg-select">Live <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#36322d" stroke-width="1.3" stroke-linecap="round"/></svg></div></div>
            </div>
          </div>
        </div>

<div class="cfg-acc" id="ud-cfg-acc-1">
          <div class="cfg-acc-hdr" onclick="udToggleCfgAcc(1)">
            <div class="cfg-acc-text">
              <div class="cfg-acc-title">Equipment Settings</div>
              <div class="cfg-acc-sub">Manage system-level settings that control how this equipment behaves and reports data.</div>
            </div>
            <svg class="cfg-chev" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M10.5 6L6 1.5 1.5 6" stroke="#36322d9e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="cfg-acc-body">
            <div class="cfg-fields">
              <div class="cfg-field"><label>Number of Drum Magnets</label><input type="number" value="" placeholder="e.g. 4"></div>
              <div class="cfg-field"><label>Drum Size (yd³)</label><input type="number" value="" placeholder="e.g. 8"></div>
              <div class="cfg-field cfg-field-toggle"><label>Front Discharge</label><div class="cfg-toggle on" onclick="toggleCfgSwitch(this)"><div class="cfg-toggle-knob"></div></div></div>
              <div class="cfg-field cfg-field-toggle"><label>CWR Watchdog Enabled</label><div class="cfg-toggle" onclick="toggleCfgSwitch(this)"><div class="cfg-toggle-knob"></div></div></div>
              <div class="cfg-field cfg-field-toggle"><label>Using Blue Water Meter</label><div class="cfg-toggle on" onclick="toggleCfgSwitch(this)"><div class="cfg-toggle-knob"></div></div></div>
              <div class="cfg-field cfg-field-toggle"><label>Using Blue Admix Meter</label><div class="cfg-toggle on" onclick="toggleCfgSwitch(this)"><div class="cfg-toggle-knob"></div></div></div>
              <div class="cfg-field cfg-field-toggle"><label>Display Metrics Units</label><div class="cfg-toggle on" onclick="toggleCfgSwitch(this)"><div class="cfg-toggle-knob"></div></div></div>
            </div>
          </div>
        </div>

<div class="cfg-acc" id="ud-cfg-acc-2">
          <div class="cfg-acc-hdr" onclick="udToggleCfgAcc(2)">
            <div class="cfg-acc-text">
              <div class="cfg-acc-title">Mixing Settings</div>
              <div class="cfg-acc-sub">Control how the drum mixes, agitates, and rotates during transit and discharge.</div>
            </div>
            <svg class="cfg-chev" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M10.5 6L6 1.5 1.5 6" stroke="#36322d9e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="cfg-acc-body">
            <div class="cfg-fields">
              <div class="cfg-field"><label>Min Batch Revolutions</label><input type="number" value="" placeholder="e.g. 70"></div>
              <div class="cfg-field"><label>Min Agitation Speed (RPM)</label><input type="number" value="" placeholder="e.g. 2"></div>
              <div class="cfg-field"><label>Min Mixing Speed (RPM)</label><input type="number" value="" placeholder="e.g. 8"></div>
              <div class="cfg-field"><label>Max Mixing Speed (RPM)</label><input type="number" value="" placeholder="e.g. 18"></div>
            </div>
          </div>
        </div>

<div class="cfg-acc" id="ud-cfg-acc-3">
          <div class="cfg-acc-hdr" onclick="udToggleCfgAcc(3)">
            <div class="cfg-acc-text">
              <div class="cfg-acc-title">Fluid Hose Length Settings</div>
              <div class="cfg-acc-sub">Define hose lengths used for water and admixture delivery calculations.</div>
            </div>
            <svg class="cfg-chev" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M10.5 6L6 1.5 1.5 6" stroke="#36322d9e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="cfg-acc-body">
            <div class="cfg-fields">
              <div class="cfg-field"><label>Water Hose: Quick Connect to Nozzle (ft)</label><input type="text" value="" placeholder="e.g. 12"></div>
              <div class="cfg-field"><label>Water Hose: FDM to Quick Connect (ft)</label><input type="text" value="" placeholder="e.g. 6"></div>
              <div class="cfg-field"><label>Admix Hose Length (ft)</label><input type="text" value="" placeholder="e.g. 8"></div>
            </div>
          </div>
        </div>


<div class="cfg-acc" id="ud-cfg-acc-4">
          <div class="cfg-acc-hdr" onclick="udToggleCfgAcc(4)">
            <div class="cfg-acc-text">
              <div class="cfg-acc-title">Tilt Calibration</div>
              <div class="cfg-acc-sub">Set the inclinometer offset so slump readings are accurate for this truck's frame angle.</div>
            </div>
            <svg class="cfg-chev" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M10.5 6L6 1.5 1.5 6" stroke="#36322d9e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="cfg-acc-body" style="display:none;">
            <div class="cfg-tilt-wrap">
              <div class="cfg-tilt-readout">
                <div class="cfg-tilt-readout-row">
                  <div class="cfg-tilt-stat">
                    <div class="cfg-tilt-stat-label">Current Tilt</div>
                    <div class="cfg-tilt-stat-val" id="ud-tilt-current">−0.4°</div>
                  </div>
                  <div class="cfg-tilt-stat">
                    <div class="cfg-tilt-stat-label">Baseline Offset</div>
                    <div class="cfg-tilt-stat-val" id="ud-tilt-baseline">−0.2°</div>
                  </div>
                  <div class="cfg-tilt-stat">
                    <div class="cfg-tilt-stat-label">Compensated</div>
                    <div class="cfg-tilt-stat-val cfg-tilt-stat-val--ok" id="ud-tilt-comp">−0.2°</div>
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
                  <div class="cfg-tilt-step-text">Enter the measured frame angle below. The system will compensate for the difference between the frame and the sensor.</div>
                </div>
              </div>
              <div class="cfg-fields">
                <div class="cfg-field">
                  <label>Measured Frame Angle (degrees)</label>
                  <div class="cfg-ro-val">−0.2°</div>
                  <input class="cfg-edit-input" type="number" step="0.1" min="-45" max="45" placeholder="e.g. −0.2" style="display:none;">
                </div>
              </div>
              <div class="cfg-tilt-reset-row">
                <div class="cfg-tilt-reset-text">
                  <div class="cfg-tilt-reset-label">Reset Baseline to Zero</div>
                  <div class="cfg-tilt-reset-sub">Use before recalibrating a unit that has drifted. Clears the current offset so you can set a fresh measurement.</div>
                </div>
                <button class="cfg-tilt-reset-btn" onclick="cfgTiltResetBaseline(this)">Reset</button>
              </div>
            </div>
          </div>
        </div>

<div class="cfg-acc" id="ud-cfg-acc-5">
            <div class="cfg-acc-text">
              <div class="cfg-acc-title">Workability Calculator Settings</div>
              <div class="cfg-acc-sub">Configure the time, rev, and drum speed limits that determine slump validity.</div>
            </div>
            <svg class="cfg-chev" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M10.5 6L6 1.5 1.5 6" stroke="#36322d9e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="cfg-acc-body" style="display:none;">
            <div class="cfg-fields">
              <div class="cfg-field"><label>Slump Expiration In Seconds</label><input type="number" value="0"></div>
              <div class="cfg-field"><label>Slump Expiration In Revs</label><input type="number" value="0"></div>
              <div class="cfg-field"><label>Slump Min Mixing Speed</label><input type="number" value="0"></div>
              <div class="cfg-field"><label>Slump Max Mixing Speed</label><input type="number" value="0"></div>
            </div>
          </div>
        </div>

<div class="cfg-acc" id="ud-cfg-acc-6">
          <div class="cfg-acc-hdr" onclick="udToggleCfgAcc(6)">
            <div class="cfg-acc-text">
              <div class="cfg-acc-title">In-Cab Display Settings</div>
              <div class="cfg-acc-sub">Configure what drivers see in the cab, including slump step increments, limits, and display alerts.</div>
            </div>
            <svg class="cfg-chev" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M10.5 6L6 1.5 1.5 6" stroke="#36322d9e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="cfg-acc-body" style="display:none;">
            <div class="cfg-fields">
              <div class="cfg-section-label">Slump Adjustment</div>
              <div class="cfg-field"><label>Target Slump Step</label><input type="text" value="1 inch"></div>
              <div class="cfg-field"><label>Max Slump for Display</label><input type="text" value="8 inch"></div>
              <div class="cfg-section-label">Timing &amp; Operational Thresholds</div>
              <div class="cfg-field"><label>Minutes to Leave Plant</label><input type="text" value="5 min"></div>
              <div class="cfg-field"><label>Min Liters for Back Flush</label><input type="text" value="5 Liters"></div>
              <div class="cfg-section-label">Display Preferences</div>
              <div class="cfg-field cfg-field-toggle"><label>Display Units (Imperial)</label><div class="cfg-toggle on" onclick="toggleCfgSwitch(this)"><div class="cfg-toggle-knob"></div></div></div>
              <div class="cfg-field cfg-field-toggle"><label>Display No-Flow Errors</label><div class="cfg-toggle on" onclick="toggleCfgSwitch(this)"><div class="cfg-toggle-knob"></div></div></div>
            </div>
          </div>
        </div>

<div class="cfg-acc" id="ud-cfg-acc-7">
          <div class="cfg-acc-hdr" onclick="udToggleCfgAcc(7)">
            <div class="cfg-acc-text">
              <div class="cfg-acc-title">Adjustment Manager Settings</div>
              <div class="cfg-acc-sub">Control how the system adjusts water and admixtures within defined limits.</div>
            </div>
            <svg class="cfg-chev" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M10.5 6L6 1.5 1.5 6" stroke="#36322d9e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="cfg-acc-body" style="display:none;">
            <div class="cfg-fields">
              <div class="cfg-field"><label>Slump Tolerance (in)</label><input type="text" value=""></div>
              <div class="cfg-field"><label>Initial Water Ratio</label><input type="text" value=""></div>
              <div class="cfg-field"><label>Initial Admix Ratio</label><input type="text" value=""></div>
              <div class="cfg-field"><label>Min Water Ratio</label><input type="text" value=""></div>
              <div class="cfg-field"><label>Max Water Ratio</label><input type="text" value=""></div>
              <div class="cfg-field"><label>Min Admix Ratio</label><input type="text" value=""></div>
              <div class="cfg-field"><label>Max Admix Ratio</label><input type="text" value=""></div>
            </div>
          </div>
        </div>

<div class="cfg-acc" id="ud-cfg-acc-8">
          <div class="cfg-acc-hdr" onclick="udToggleCfgAcc(8)">
            <div class="cfg-acc-text">
              <div class="cfg-acc-title">Location Monitor Settings</div>
              <div class="cfg-acc-sub">Define how far a truck must move before the system marks it as away.</div>
            </div>
            <svg class="cfg-chev" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M10.5 6L6 1.5 1.5 6" stroke="#36322d9e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="cfg-acc-body" style="display:none;">
            <div class="cfg-fields">
              <div class="cfg-field"><label>Away Distance Signal Meters</label><input type="number" value="0"></div>
            </div>
          </div>
        </div>

      </div><!-- /cfg-list -->

      <!-- Info block matching truck drawer -->
      <div class="cfg-info-block">
        <div class="co-info-row2">
          <div class="co-info-item"><div class="co-info-label">Connectivity</div><div class="co-info-val co-info-val--link">Connected</div></div>
          <div class="co-info-item"><div class="co-info-label">Truck Mode</div><div class="co-info-val">Live</div></div>
        </div>
        <div class="co-tbl-row"><div class="co-tbl-k">First Commissioned</div><div class="co-tbl-v">${u.firstCommissioned || '--'}</div></div>
        <div class="co-tbl-row co-tbl-row--alt"><div class="co-tbl-k">Assigned to Truck</div><div class="co-tbl-v">${u.assignedToTruck || '--'}</div></div>
        <div class="co-tbl-row"><div class="co-tbl-k">TCG ID</div><div class="co-tbl-v" style="font-family:monospace;">${u.tgw}</div></div>
        <div class="co-tbl-row co-tbl-row--alt"><div class="co-tbl-k">Contract</div><div class="co-tbl-v">${u.contract}</div></div>

        <!-- Also viewing toggle -->
        ${u.truck !== '--' ? `
        <div class="also-viewing">
          <span class="also-viewing-label">Also viewing</span>
          <button class="also-viewing-link" onclick="unitDrawerGoToComponentsOverview('${u.truck}')">
            Components Overview
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M6.5 2.5l3.5 3.5-3.5 3.5" stroke="var(--blue)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>` : ''}
      </div>

      <!-- Save button -->
      <div style="padding:16px 12px 24px;">
        <button onclick="udSaveConfig()" style="width:100%;background:${coPrimaryBtnBg()};color:${coPrimaryBtnColor()};border:none;border-radius:32px;padding:14px;font-size:15px;font-weight:500;font-family:var(--font);letter-spacing:-0.3px;cursor:pointer;">Save Configuration</button>
      </div>

    </div>
  `;

  /* Open 0-4: Info, Equipment, Mixing, Fluid Hose, Tilt Calibration — close 5+ */
  [1, 2, 3].forEach(function(n) {
    var acc = document.getElementById('ud-cfg-acc-' + n);
    if (!acc) return;
    acc.classList.add('open');
    var body = acc.querySelector('.cfg-acc-body');
    if (body) body.style.display = 'block';
  });
  [4, 5, 6, 7].forEach(function(n) {
    var acc = document.getElementById('ud-cfg-acc-' + n);
    if (!acc) return;
    acc.classList.remove('open');
    var body = acc.querySelector('.cfg-acc-body');
    if (body) body.style.display = 'none';
  });
}

/* ── Desktop + Tablet clone from truck ── */
var dtCloneSelectedIdx = -1;
var dtClonePool = [];

function dtBuildClonePool() {
  var u = UNITS_DATA.find(function(x) { return x.id === dtUdCurrentUnitId; });
  var linkedTruckNum = u ? String(u.truck) : '';
  var allTrucks = [];
  (truckGroups || []).forEach(function(g) { allTrucks = allTrucks.concat(g.trucks || []); });
  var linkedTruck = allTrucks.find(function(t) { return String(t.num) === linkedTruckNum; });
  var unitPlant = linkedTruck ? linkedTruck.plant : (allTrucks[0] ? allTrucks[0].plant : '');
  dtClonePool = allTrucks.filter(function(t) {
    return t.plant === unitPlant && String(t.num) !== linkedTruckNum;
  });
  dtRenderCloneList('');
}

function dtCloneToggleDropdown() {
  var dd = document.getElementById('dt-clone-dropdown');
  if (!dd) return;
  var opening = !dd.classList.contains('open');
  dd.classList.toggle('open');
  if (opening) {
    if (dtClonePool.length === 0) dtBuildClonePool();
    else dtRenderCloneList('');
    var inp = document.getElementById('dt-clone-search');
    if (inp) { inp.value = ''; setTimeout(function() { inp.focus(); }, 40); }
  }
}

function dtCloneSearch(val) {
  dtRenderCloneList(val);
}

function dtRenderCloneList(query) {
  var list = document.getElementById('dt-clone-list');
  if (!list) return;
  var q = query.trim().toLowerCase();
  var filtered = q ? dtClonePool.filter(function(t) { return String(t.num).toLowerCase().includes(q); }) : dtClonePool;
  if (filtered.length === 0) {
    list.innerHTML = '<div class="clone-no-results">No trucks match</div>';
    return;
  }
  list.innerHTML = filtered.map(function(t) {
    var realIdx = dtClonePool.indexOf(t);
    var isSel = realIdx === dtCloneSelectedIdx;
    return '<div class="clone-truck-row' + (isSel ? ' selected' : '') + '" onclick="dtPickCloneTruck(' + realIdx + ')">' +
      '<span class="clone-truck-num">Truck ' + t.num + '</span>' +
      (isSel ? '<span class="clone-truck-check"><svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1.5 5l3 3L10.5 1.5" stroke="var(--blue)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' : '') +
    '</div>';
  }).join('');
}

function dtPickCloneTruck(idx) {
  dtCloneSelectedIdx = idx;
  var t = dtClonePool[idx];
  if (!t) return;
  /* Update selector label */
  var label = document.getElementById('dt-clone-selector-label');
  if (label) label.textContent = 'Truck ' + t.num;
  /* Close dropdown */
  var dd = document.getElementById('dt-clone-dropdown');
  if (dd) dd.classList.remove('open');
  /* Show preview panel */
  var preview = document.getElementById('dt-clone-preview');
  if (preview) preview.classList.add('visible');
  /* Enable apply button */
  var btn = document.getElementById('dt-clone-apply-btn');
  if (btn) btn.disabled = false;
}

function dtApplyClone() {
  if (dtCloneSelectedIdx < 0) return;
  var fieldMap = [
    { label: 'Number of Drum Magnets', val: '4' },
    { label: 'Drum Size (yd³)', val: '8' },
    { label: 'Min Batch Revolutions', val: '70' },
    { label: 'Min Agitation Speed (RPM)', val: '2' },
    { label: 'Min Mixing Speed (RPM)', val: '8' },
    { label: 'Max Mixing Speed (RPM)', val: '18' },
    { label: 'Water Hose: Quick Connect to Nozzle (ft)', val: '12' },
    { label: 'Water Hose: FDM to Quick Connect (ft)', val: '6' },
    { label: 'Admix Hose Length (ft)', val: '8' },
    { label: 'Slump Tolerance (in)', val: '0.5' },
    { label: 'Initial Water Ratio', val: '1.05' },
    { label: 'Initial Admix Ratio', val: '0.95' },
    { label: 'Min Water Ratio', val: '0.85' },
    { label: 'Max Water Ratio', val: '1.20' },
  ];
  var accs = document.querySelectorAll('#dt-cfg-accs .cfg-acc');
  fieldMap.forEach(function(item) {
    accs.forEach(function(acc) {
      acc.querySelectorAll('.cfg-field').forEach(function(field) {
        var lbl = field.querySelector('label');
        if (!lbl || lbl.textContent.trim() !== item.label) return;
        var inp = field.querySelector('.cfg-edit-input');
        if (inp) {
          inp.value = item.val;
          inp.style.background = 'rgba(48,105,227,0.07)';
          inp.style.borderColor = 'rgba(48,105,227,0.3)';
          var ro = field.querySelector('.cfg-ro-val');
          if (ro) ro.textContent = item.val;
        }
        if (!acc.classList.contains('open')) {
          acc.classList.add('open');
          var body = acc.querySelector('.cfg-acc-body');
          if (body) body.style.display = '';
        }
      });
    });
  });
  var badge = document.getElementById('dt-clone-applied-badge');
  if (badge) badge.style.display = 'inline-flex';
  var preview = document.getElementById('dt-clone-preview');
  if (preview) preview.classList.remove('visible');
  var btn = document.getElementById('dt-clone-apply-btn');
  if (btn) { btn.textContent = 'Applied ✓'; btn.disabled = true; btn.style.opacity = '0.5'; }
  /* Allow re-selection — reset after short delay so FST sees confirmation */
  setTimeout(function() {
    dtCloneSelectedIdx = -1;
    var label = document.getElementById('dt-clone-selector-label');
    if (label) label.textContent = 'Truck Number';
    if (btn) { btn.textContent = 'Apply Settings'; btn.disabled = true; btn.style.opacity = ''; }
  }, 1500);
}


var udCloneSelectedIdx = -1;
var udClonePool = [];

function udBuildClonePool() {
  var u = udCurrentUnit;
  var allTrucks = [];
  (truckGroups || []).forEach(function(g) { allTrucks = allTrucks.concat(g.trucks || []); });
  var linkedTruckNum = (u && u.truck && u.truck !== '--') ? String(u.truck) : (attachSelectedTruck ? String(attachSelectedTruck) : '');
  var linkedTruck = allTrucks.find(function(t) { return String(t.num) === linkedTruckNum; });
  var unitPlant = linkedTruck ? linkedTruck.plant : (allTrucks.length > 0 ? allTrucks[0].plant : '');
  udClonePool = allTrucks.filter(function(t) {
    return t.plant === unitPlant && String(t.num) !== linkedTruckNum;
  });
  udRenderCloneList('');
}

function udCloneToggleDropdown() {
  var dd = document.getElementById('ud-clone-dropdown');
  if (!dd) return;
  var opening = !dd.classList.contains('open');
  dd.classList.toggle('open');
  if (opening) {
    if (udClonePool.length === 0) udBuildClonePool();
    else udRenderCloneList('');
    var inp = document.getElementById('ud-clone-search');
    if (inp) { inp.value = ''; setTimeout(function() { inp.focus(); }, 40); }
  }
}

function udCloneSearch(val) {
  udRenderCloneList(val);
}

function udRenderCloneList(query) {
  var list = document.getElementById('ud-clone-list');
  if (!list) return;
  var q = query.trim().toLowerCase();
  var filtered = q ? udClonePool.filter(function(t) { return String(t.num).toLowerCase().includes(q); }) : udClonePool;
  if (filtered.length === 0) {
    list.innerHTML = '<div class="clone-no-results">No trucks match</div>';
    return;
  }
  list.innerHTML = filtered.map(function(t) {
    var realIdx = udClonePool.indexOf(t);
    var isSel = realIdx === udCloneSelectedIdx;
    return '<div class="clone-truck-row' + (isSel ? ' selected' : '') + '" ontouchstart="" onclick="udPickCloneTruck(' + realIdx + ')">' +
      '<span class="clone-truck-num">Truck ' + t.num + '</span>' +
      (isSel ? '<span class="clone-truck-check"><svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1.5 5l3 3L10.5 1.5" stroke="var(--blue)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' : '') +
    '</div>';
  }).join('');
}

function udPickCloneTruck(idx) {
  udCloneSelectedIdx = idx;
  var t = udClonePool[idx];
  if (!t) return;
  var label = document.getElementById('ud-clone-selector-label');
  if (label) label.textContent = 'Truck ' + t.num;
  var dd = document.getElementById('ud-clone-dropdown');
  if (dd) dd.classList.remove('open');
  var preview = document.getElementById('ud-clone-preview');
  if (preview) preview.classList.add('visible');
  var btn = document.getElementById('ud-clone-apply-btn');
  if (btn) btn.disabled = false;
}

function udApplyClone() {
  if (udCloneSelectedIdx < 0) return;
  var fieldMap = [
    { accIdx: 1, label: 'Number of Drum Magnets', val: '4' },
    { accIdx: 1, label: 'Drum Size (yd³)', val: '8' },
    { accIdx: 2, label: 'Min Batch Revolutions', val: '70' },
    { accIdx: 2, label: 'Min Agitation Speed (RPM)', val: '2' },
    { accIdx: 2, label: 'Min Mixing Speed (RPM)', val: '8' },
    { accIdx: 2, label: 'Max Mixing Speed (RPM)', val: '18' },
    { accIdx: 3, label: 'Water Hose: Quick Connect to Nozzle (ft)', val: '12' },
    { accIdx: 3, label: 'Water Hose: FDM to Quick Connect (ft)', val: '6' },
    { accIdx: 3, label: 'Admix Hose Length (ft)', val: '8' },
    { accIdx: 7, label: 'Slump Tolerance (in)', val: '0.5' },
    { accIdx: 7, label: 'Initial Water Ratio', val: '1.05' },
    { accIdx: 7, label: 'Initial Admix Ratio', val: '0.95' },
    { accIdx: 7, label: 'Min Water Ratio', val: '0.85' },
    { accIdx: 7, label: 'Max Water Ratio', val: '1.20' },
  ];
  fieldMap.forEach(function(item) {
    var acc = document.getElementById('ud-cfg-acc-' + item.accIdx);
    if (!acc) return;
    acc.querySelectorAll('input[type="text"], input[type="number"]').forEach(function(inp) {
      var lbl = inp.closest('.cfg-field') && inp.closest('.cfg-field').querySelector('label');
      if (lbl && lbl.textContent.trim() === item.label) {
        inp.value = item.val;
        inp.style.background = 'rgba(48,105,227,0.07)';
        inp.style.borderColor = 'rgba(48,105,227,0.3)';
      }
    });
    if (!acc.classList.contains('open')) {
      acc.classList.add('open');
      var body = acc.querySelector('.cfg-acc-body');
      if (body) body.style.display = 'block';
    }
  });
  var badge = document.getElementById('ud-clone-applied-badge');
  if (badge) badge.style.display = 'inline-flex';
  var preview = document.getElementById('ud-clone-preview');
  if (preview) preview.classList.remove('visible');
  var btn = document.getElementById('ud-clone-apply-btn');
  if (btn) { btn.textContent = 'Applied ✓'; btn.disabled = true; btn.style.opacity = '0.5'; }
  /* Allow re-selection — reset after short delay so FST sees confirmation */
  setTimeout(function() {
    udCloneSelectedIdx = -1;
    var label = document.getElementById('ud-clone-selector-label');
    if (label) label.textContent = 'Truck Number';
    if (btn) { btn.textContent = 'Apply Settings'; btn.disabled = true; btn.style.opacity = ''; }
  }, 1500);
}

function udToggleCfgAcc(n) {
  const acc = document.getElementById('ud-cfg-acc-' + n);
  if (!acc) return;
  const isOpen = acc.classList.contains('open');
  acc.classList.toggle('open', !isOpen);
  const body = acc.querySelector('.cfg-acc-body');
  if (body) body.style.display = isOpen ? 'none' : 'block';
}

function udSaveConfig() {
  if (udCurrentUnit) {
    udCurrentUnit.status = 'Linked Unit';
    if (!udCurrentUnit.firstCommissioned) {
      const _n = new Date(), _h = _n.getHours(), _m = _n.getMinutes();
      const _ap = _h >= 12 ? 'PM' : 'AM', _h12 = _h % 12 || 12;
      const _mo = String(_n.getMonth()+1).padStart(2,'0'), _d = String(_n.getDate()).padStart(2,'0'), _y = _n.getFullYear();
      udCurrentUnit.firstCommissioned = `${_h12}:${String(_m).padStart(2,'0')} ${_ap} ${_mo}/${_d}/${_y}`;
    }
    renderUnits();
  }

  const truckNum = attachSelectedTruck || (udCurrentUnit && udCurrentUnit.truck);

  /* Add the newly attached truck to trucks[] so the drawer can open */
  if (truckNum) {
    const alreadyIn = trucks.find(function(t) { return String(t.num) === String(truckNum); });
    if (!alreadyIn) {
      trucks.push({
        num: truckNum, ver: 'v3.04.029', ign: 'On', ignDetail: '0 hr',
        source: '', plant: 'Phoenix Central', impact: 'None', issue: '',
        account: 'Cemex AZ', age: 'just now', conn: 'live',
        err: 0, wrn: 0, unitId: udCurrentUnit ? udCurrentUnit.id : '',
        readyMaint: 'No', truckMode: 'Active', lastConn: 'just now',
        unlinked: false
      });
      CC_TRUCKS.push({ num: truckNum, unlinked: false, components: [] });
    } else {
      alreadyIn.unlinked = false;
      alreadyIn.truckMode = 'Active';
    }
  }

  closeUnitDetail();

  setTimeout(function() {
    goToAllTrucks();
    renderTrucks();

    if (truckNum) {
      const idx = trucks.findIndex(function(t) { return String(t.num) === String(truckNum); });
      if (idx > -1) {
        openDrawer(idx, { list: trucks.map(function(_, n) { return n; }), idx: idx });
      }
    }
  }, 320);

  dtShowToast({ title: 'Configuration saved', body: 'Unit is now active', variant: 'success' });
}

function udToggleNav() {
  const dd   = document.getElementById('ud-nav-dropdown');
  const chev = document.getElementById('ud-nav-chev');
  const open = dd.style.display === 'block';
  dd.style.display   = open ? 'none' : 'block';
  chev.style.transform = open ? '' : 'rotate(180deg)';
}

function udSelectNav(label, el) {
  /* Map label to tab key */
  const map = {
    'Unit Life Span': 'lifespan', 'Attach to Truck': 'attach',
    'Component Timeline': 'timeline', 'Truck Logs': 'logs',
    'Manual Control': 'manual', 'Sensor': 'sensor', 'Configuration': 'config',
  };
  const tab = map[label] || 'lifespan';
  document.getElementById('ud-nav-dropdown').style.display = 'none';
  document.getElementById('ud-nav-chev').style.transform = '';
  udSwitchTab(tab);
}


function udUpdateArrows() {
  const allIds = UNITS_DATA.map(u => u.id);
  const idx = udCurrentUnit ? allIds.indexOf(udCurrentUnit.id) : 0;
  const prev = document.getElementById('ud-prev');
  const next = document.getElementById('ud-next');
  if (prev) { prev.style.opacity = idx <= 0 ? '0.3' : '1'; prev.style.pointerEvents = idx <= 0 ? 'none' : 'auto'; }
  if (next) { next.style.opacity = idx >= allIds.length-1 ? '0.3' : '1'; next.style.pointerEvents = idx >= allIds.length-1 ? 'none' : 'auto'; }
}

function udRenderLifespan() {
  const u   = udCurrentUnit;
  let comps = UNIT_HISTORY[u.id] || UNIT_HISTORY['_default'];

  /* Filter components based on unit config — Measured Only units never
     show active Temperate Water, Winter Water, Water Pump, or Admix Pump
     BUT do show them if they were removed (to tell the V5 downgrade story) */
  const isManaged = u.config === 'Temp+ Admix' || u.config === 'Winter Water';
  const managedOnly = ['Temperate Water', 'Winter Water', 'Water Pump', 'Admix Pump'];
  if (!isManaged) {
    comps = comps.filter(c => !managedOnly.includes(c.name) || c.removed);
  } else {
    /* Keep only the correct water type — not both */
    const keepWater = u.config === 'Winter Water' ? 'Winter Water' : 'Temperate Water';
    comps = comps.filter(c => c.name !== 'Temperate Water' && c.name !== 'Winter Water' || c.name === keepWater);
  }

  /* Split into active and removed */
  const activeComps  = comps.filter(c => !c.removed);
  const removedComps = comps.filter(c => c.removed);

  /* Icon SVGs */
  const iconLinked   = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 3.5" stroke="#16a34a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" stroke="#16a34a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const iconRemoved  = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 3.5" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 3l10 10" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round"/></svg>`;

  function buildEntries(comp) {
    /* Strip the date:'Current' placeholder — it belongs in the card header only.
       Reverse so Originally installed is at top, most recent Replaced at bottom.
       The bottom (most recent) entry = the serial shown in the card header. */
    const hist = comp.history.filter(h => h.date !== 'Current');
    return hist.map((h, hi) => {
      const isLast  = hi === hist.length - 1; /* most recent = bottom = current */
      const isFirst = hi === 0;               /* originally installed = top */
      const connector = !isLast
        ? `<div style="width:1px;background:var(--border);flex-grow:1;margin:4px 0;min-height:12px;"></div>` : '';
      const isRemoved = comp.removed;
      const dotStyle = isFirst && !isRemoved
        ? 'background:#16a34a;border:2px solid white;box-shadow:0 0 0 1px #16a34a;'
        : isFirst && isRemoved
          ? 'background:#9ca3af;border:2px solid white;box-shadow:0 0 0 1px #9ca3af;'
          : isLast
            ? 'background:var(--blue);border:2px solid white;box-shadow:0 0 0 1px var(--blue);'
            : 'background:var(--border-mid);border:2px solid white;';
      const dateLabel = isFirst && isRemoved
        ? `${h.date} <span style="color:#9ca3af;font-size:10px;">· removed ${comp.removedDate}</span>`
        : h.date;
      return `
        <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);${isLast?'border-bottom:none;':''}">
          <div style="display:flex;flex-direction:column;align-items:center;width:16px;flex-shrink:0;padding-top:2px;">
            <div style="width:10px;height:10px;border-radius:50%;flex-shrink:0;${dotStyle}"></div>
            ${connector}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:11px;color:var(--soft);letter-spacing:-0.1px;margin-bottom:3px;">${dateLabel}</div>
            <div style="font-size:13px;font-weight:500;color:${isFirst && isRemoved ? '#9ca3af' : 'var(--strong)'};letter-spacing:-0.2px;font-family:monospace;">${h.mac}</div>
            ${!isLast ? '<div style="font-size:11px;color:#d97706;font-weight:500;margin-top:2px;">Replaced</div>' : ''}
            ${isLast ? '<div style="font-size:11px;color:var(--blue);font-weight:500;margin-top:2px;">Originally installed</div>' : ''}
          </div>
        </div>`;
    }).join('');
  }

  function buildCard(comp, ci, isRemoved) {
    /* Card header shows the most recent real serial — skip the 'Current' placeholder */
    const realHist   = comp.history.filter(h => h.date !== 'Current');
    const current    = realHist.length > 0 ? realHist[0] : comp.history[0];
    const hasHistory = realHist.length > 1;
    const cardBg     = isRemoved ? 'background:var(--base);' : '';
    const nameColor  = isRemoved ? 'color:#9ca3af;' : '';
    const macColor   = isRemoved ? 'color:#9ca3af;' : 'color:var(--soft);';
    const icon       = isRemoved ? iconRemoved : iconLinked;
    const changesTxt = hasHistory
      ? `<span style="font-size:11px;color:var(--soft);letter-spacing:-0.1px;">${realHist.length - 1} change${realHist.length > 2 ? 's' : ''}</span>` : '';

    return `
      <div class="ls-card" style="${cardBg}">
        <div class="ls-card-hdr" onclick="lsToggle(${ci})">
          <div class="ls-card-left">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
              ${icon}
              <div class="ls-comp-name" style="${nameColor}">${comp.name}</div>
            </div>
            <div style="font-size:12px;${macColor}letter-spacing:-0.2px;font-family:monospace;padding-left:18px;">${current.mac}${!isRemoved ? dcAgeInfo(current.mac) : ''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            ${changesTxt}
            <svg id="ls-chev-${ci}" width="10" height="6" viewBox="0 0 10 6" fill="none" style="transition:transform 0.2s;flex-shrink:0;"><path d="M8.75 4.75L4.75 0.75L0.75 4.75" stroke="#36322d9e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>
        <div id="ls-hist-${ci}" style="display:none;padding:0 14px;border-top:1px solid var(--border);">
          ${buildEntries(comp)}
        </div>
      </div>`;
  }

  /* Component accordion cards */
  const cards = [
    ...activeComps.map((comp, i) => buildCard(comp, i, false)),
    ...(removedComps.length > 0 ? [
      `<div style="font-size:11px;font-weight:600;color:var(--soft);letter-spacing:0.4px;text-transform:uppercase;margin:14px 0 8px;padding:0 2px;">Removed · ${removedComps.length}</div>`,
      ...removedComps.map((comp, i) => buildCard(comp, activeComps.length + i, true))
    ] : [])
  ].join('');

  /* Duration helper — how long since a MM/DD/YYYY date */
  function sinceDate(dateStr) {
    if (!dateStr) return null;
    const [m, d, y] = dateStr.split('/').map(Number);
    const then = new Date(y, m - 1, d);
    const now  = new Date('2025-04-20'); /* prototype reference date */
    const months = (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
    if (months < 1)  return 'Less than a month';
    if (months < 12) return `${months} month${months > 1 ? 's' : ''}`;
    const yrs = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${yrs} yr${yrs > 1 ? 's' : ''}, ${rem} mo` : `${yrs} year${yrs > 1 ? 's' : ''}`;
  }

  const assignedDuration = u.assignedToTruck ? sinceDate(u.assignedToTruck) : null;
  const firstDuration    = u.firstCommissioned ? sinceDate(u.firstCommissioned) : null;

  /* Info card */
  const info = `
    <div class="ud-section-label" style="margin-top:6px;">Unit Details</div>
    <div class="ls-info-grid">
      <div class="ls-info-cell"><div class="ls-info-label">System Type</div><div class="ls-info-val">${u.sysType}</div></div>
      <div class="ls-info-cell"><div class="ls-info-label">Configuration</div><div class="ls-info-val">${u.config}</div></div>
    </div>
    <div class="ud-card">
      <div class="ud-row">
        <span class="ud-key">First Commissioned</span>
        <span class="ud-val" style="text-align:right;">
          ${u.firstCommissioned || '--'}
          ${firstDuration ? `<div style="font-size:11px;color:var(--soft);font-weight:400;margin-top:2px;">${firstDuration} ago</div>` : ''}
        </span>
      </div>
      <div class="ud-row">
        <span class="ud-key">Assigned to Truck</span>
        <span class="ud-val" style="text-align:right;">
          ${u.assignedToTruck || '--'}
          ${assignedDuration ? `<div style="font-size:11px;color:var(--soft);font-weight:400;margin-top:2px;">${assignedDuration} on this truck</div>` : ''}
        </span>
      </div>
      <div class="ud-row"><span class="ud-key">Decommissioned</span><span class="ud-val">${u.decommissioned || '--'}</span></div>
    </div>
    <div class="ud-card">
      <div class="ud-row"><span class="ud-key">TCG ID</span><span class="ud-val" style="font-family:monospace;font-size:13px;">${u.tgw}</span></div>
      <div class="ud-row"><span class="ud-key">Contract</span><span class="ud-val">${u.contract}</span></div>
      <div class="ud-row"><span class="ud-key">Assigned Truck</span><span class="ud-val">${u.truck}</span></div>
      ${u.truck !== '--' ? `<div class="also-viewing">
        <span class="also-viewing-label">Also viewing</span>
        <button class="also-viewing-link" onclick="unitDrawerGoToComponentsOverview('${u.truck}')">
          Components Overview
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M6.5 2.5l3.5 3.5-3.5 3.5" stroke="var(--blue)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>` : ''}
    </div>
    ${u.truck !== '--' ? `
    <button onclick="unitDrawerShowUnlink()" style="width:100%;margin-top:6px;background:none;border:1.5px solid var(--red);color:var(--red);border-radius:32px;padding:13px;font-size:14px;font-weight:500;font-family:var(--font);letter-spacing:-0.28px;cursor:pointer;">De-install unit</button>
    ` : ''}`;

  document.getElementById('ud-body').innerHTML = `
    <div style="margin-bottom:6px;">
      <div style="font-size:11px;font-weight:600;color:var(--soft);letter-spacing:0.4px;text-transform:uppercase;margin-bottom:10px;">Components · ${activeComps.length} active${removedComps.length > 0 ? ` <span style="font-weight:400;color:#9ca3af;">· ${removedComps.length} removed</span>` : ''}</div>
      ${cards}
    </div>
    ${info}
  `;
}

function lsToggle(ci) {
  const hist = document.getElementById('ls-hist-' + ci);
  const chev = document.getElementById('ls-chev-' + ci);
  if (!hist) return;
  const open = hist.style.display === 'block';
  hist.style.display = open ? 'none' : 'block';
  chev.style.transform = open ? '' : 'rotate(180deg)';
}

/* ── Unlinked trucks available to attach ── */

let attachSelectedTruck = null;
let attachSearchQuery   = '';

function udRenderAttach() {
  attachSelectedTruck = null;
  attachSearchQuery   = '';
  renderAttachBody();
}

function renderAttachBody() {
  const q = attachSearchQuery.toLowerCase();
  const filtered = UNLINKED_TRUCKS.filter(t =>
    !q || t.number.toLowerCase().includes(q) || t.type.toLowerCase().includes(q) ||
    t.drum.toLowerCase().includes(q) || t.mixer.toLowerCase().includes(q)
  );

  const chevSvg = `<svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M8.75 4.75L4.75 0.75L0.75 4.75" stroke="#36322d9e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const rows = filtered.map((t, i) => {
    const sel = attachSelectedTruck === t.number;
    return `
      <div onclick="attachSelectTruck('${t.number}')" style="
        display:grid;grid-template-columns:1fr 60px 55px 80px 80px;
        min-height:50px;align-items:center;cursor:pointer;
        background:${sel ? 'rgba(48,105,227,0.06)' : i%2===0 ? 'var(--layer-1)' : 'var(--base)'};
        border-bottom:1px solid var(--border);
        border-left:${sel ? '3px solid var(--blue)' : '3px solid transparent'};
        -webkit-tap-highlight-color:transparent;
      ">
        <div style="padding:10px 8px 10px 11px;font-size:13px;color:var(--defined);letter-spacing:-0.2px;font-weight:${sel?'500':'400'};">${t.number}</div>
        <div style="padding:10px 6px;font-size:13px;color:var(--defined);letter-spacing:-0.2px;">${t.type}</div>
        <div style="padding:10px 6px;font-size:13px;color:var(--defined);letter-spacing:-0.2px;">${t.drum}</div>
        <div style="padding:10px 6px;font-size:13px;color:var(--defined);letter-spacing:-0.2px;">${t.water}</div>
        <div style="padding:10px 8px;font-size:13px;color:var(--defined);letter-spacing:-0.2px;">${t.mixer}</div>
      </div>`;
  }).join('');

  const noResults = filtered.length === 0
    ? `<div style="padding:32px 16px;text-align:center;font-size:14px;color:var(--soft);">No unlinked trucks match your search.</div>` : '';

  const btnEnabled = !!attachSelectedTruck;

  document.getElementById('ud-body').innerHTML = `
    <div style="margin-bottom:12px;">
      <div style="font-size:18px;font-weight:500;color:var(--strong);letter-spacing:-0.5px;margin-bottom:12px;">${UNLINKED_TRUCKS.length} Trucks Unlinked</div>

      <!-- Search + Attach Unit button row -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <div style="flex:1;display:flex;align-items:center;gap:8px;background:var(--base);border:1px solid var(--border);border-radius:24px;padding:9px 12px;">
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none" style="flex-shrink:0;">
            <circle cx="8" cy="8" r="5" stroke="#36322d9e" stroke-width="1.4"/>
            <path d="M12.5 12.5l3 3" stroke="#36322d9e" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          <input id="attach-search" placeholder="Search trucks…" autocomplete="off"
            style="flex:1;border:none;outline:none;font-size:14px;color:var(--strong);background:none;letter-spacing:-0.28px;font-family:var(--font);"
            value="${attachSearchQuery}"
            oninput="attachSearch()" />
        </div>
        <button id="attach-unit-btn" onclick="confirmAttach()" style="
          background:${btnEnabled ? coPrimaryBtnBg() : 'rgba(54,50,45,0.15)'};
          color:${btnEnabled ? coPrimaryBtnColor() : 'var(--soft)'};
          border:none;border-radius:32px;padding:10px 16px;
          font-size:14px;font-weight:500;font-family:var(--font);
          letter-spacing:-0.28px;cursor:${btnEnabled ? 'pointer' : 'default'};
          flex-shrink:0;white-space:nowrap;
          pointer-events:${btnEnabled ? 'auto' : 'none'};
        ">Attach Unit</button>
      </div>

      <!-- Table header -->
      <div style="display:grid;grid-template-columns:1fr 60px 55px 80px 80px;border-bottom:1.5px solid var(--border);background:var(--layer-1);position:sticky;top:0;z-index:2;">
        <div style="padding:9px 8px 9px 14px;font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.2px;">Truck No.</div>
        <div style="padding:9px 6px;font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.2px;">Type</div>
        <div style="padding:9px 6px;font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.2px;">Drum</div>
        <div style="padding:9px 6px;font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.2px;">Water</div>
        <div style="padding:9px 8px;font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.2px;">Mixer</div>
      </div>

      <!-- Rows -->
      <div id="attach-rows" style="border-radius:0 0 8px 8px;overflow:hidden;border:1px solid var(--border);border-top:none;">
        ${rows}${noResults}
      </div>

      ${attachSelectedTruck ? `
        <div style="margin-top:12px;background:rgba(48,105,227,0.06);border:1px solid rgba(48,105,227,0.2);border-radius:12px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:11px;color:var(--blue);font-weight:600;letter-spacing:0.2px;text-transform:uppercase;margin-bottom:3px;">Selected</div>
            <div style="font-size:14px;font-weight:500;color:var(--strong);letter-spacing:-0.28px;">${attachSelectedTruck}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 3.5" stroke="var(--blue)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" stroke="var(--blue)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>` : ''}
    </div>
  `;

  /* Re-bind search input value after re-render */
  const inp = document.getElementById('attach-search');
  if (inp) { inp.value = attachSearchQuery; inp.focus(); }
}

function attachSelectTruck(number) {
  attachSelectedTruck = attachSelectedTruck === number ? null : number;
  renderAttachBody();
  /* Update mixer type in mobile static config */
  var mixerSpan = document.getElementById('mob-cfg-mixer-type');
  if (mixerSpan) {
    var t = attachSelectedTruck ? UNLINKED_TRUCKS.find(function(x){ return x.number === attachSelectedTruck; }) : null;
    mixerSpan.textContent = (t && t.mixer) ? t.mixer : 'McNeilus';
  }
}

function attachSearch() {
  attachSearchQuery = document.getElementById('attach-search').value;
  renderAttachBody();
}

function confirmAttach() {
  if (!attachSelectedTruck || !udCurrentUnit) return;

  /* Show confirmation modal */
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.id = 'attach-confirm-overlay';
  /* Pull TCG ID from the unit so the FST can verify it before committing —
     per Martin: "TCG should be at the top, under the truck name" on every
     screen where you're about to commit a configuration. */
  const tcgId = (udCurrentUnit && udCurrentUnit.tgw && udCurrentUnit.tgw !== '--') ? udCurrentUnit.tgw : '—';
  overlay.innerHTML = `
    <div class="confirm-sheet">
      <div class="confirm-title">Attach Unit to Truck</div>
      <div style="background:var(--layer-2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin:8px 0 14px;display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;">
          <span style="color:var(--soft);letter-spacing:-0.26px;">Unit ID</span>
          <span style="color:var(--strong);font-family:'DM Mono',monospace;letter-spacing:0.2px;">${udCurrentUnit.id}</span>
        </div>
        <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;">
          <span style="color:var(--soft);letter-spacing:-0.26px;">TCG ID</span>
          <span style="color:var(--strong);font-family:'DM Mono',monospace;letter-spacing:0.2px;">${tcgId}</span>
        </div>
        <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;">
          <span style="color:var(--soft);letter-spacing:-0.26px;">Truck</span>
          <span style="color:var(--strong);font-weight:500;letter-spacing:-0.26px;">${attachSelectedTruck}</span>
        </div>
      </div>
      <div class="confirm-body">
        This will make the unit active and ready for deployment.
      </div>
      <div class="confirm-btns">
        <button class="confirm-btn-primary" onclick="doAttach()">Confirm Attachment</button>
        <button class="confirm-btn-cancel" onclick="cancelAttach()">Cancel</button>
      </div>
    </div>
  `;
  document.getElementById('units-drawer').appendChild(overlay);
}

function cancelAttach() {
  const el = document.getElementById('attach-confirm-overlay');
  if (el) el.remove();
}

function doAttach() {
  cancelAttach();
  if (!attachSelectedTruck || !udCurrentUnit) return;

  /* Commit the attachment */
  const u = UNITS_DATA.find(u => u.id === udCurrentUnit.id);
  /* Grab mixer type BEFORE we splice the truck out of UNLINKED_TRUCKS */
  const attachedTruckData = UNLINKED_TRUCKS.find(t => t.number === attachSelectedTruck);
  if (u) {
    u.status          = 'Linked Unit';
    u.truck           = attachSelectedTruck;
    u.assignedToTruck = new Date().toLocaleDateString('en-US', {month:'2-digit',day:'2-digit',year:'numeric'});
    u.mixerType       = attachedTruckData ? attachedTruckData.mixer : '';
    if (!u.firstCommissioned) {
      const _n = new Date(), _h = _n.getHours(), _m = _n.getMinutes();
      const _ap = _h >= 12 ? 'PM' : 'AM', _h12 = _h % 12 || 12;
      u.firstCommissioned = `${_h12}:${String(_m).padStart(2,'0')} ${_ap} ${u.assignedToTruck}`;
    }
  }
  const idx = UNLINKED_TRUCKS.findIndex(t => t.number === attachSelectedTruck);
  if (idx > -1) UNLINKED_TRUCKS.splice(idx, 1);

  /* Mark truck as re-linked — without this, a previously-unlinked truck
     stays marked unlinked in trucks[]/CC_TRUCKS even after the unit attaches,
     and reopening the truck drawer routes back to the empty state. Mirrors
     the truck-side utabDoAttach mutations so both flows produce identical
     post-link state. */
  const t = trucks.find(t => t.num === attachSelectedTruck);
  if (t) { t.unlinked = false; t.truckMode = 'Active'; t.unitId = u.id; }
  const tCC = CC_TRUCKS.find(t => t.num === attachSelectedTruck);
  if (tCC) { tCC.unlinked = false; }

  udCurrentUnit = u;

  /* Update status pill */
  const pill = document.getElementById('ud-status-pill');
  if (pill) {
    pill.className = '';
    pill.style.cssText = '';
    pill.innerHTML = `<span class="ustatus ustatus-linked"><span class="ustatus-dot"></span>Active</span>`;
  }
  udBuildNavDropdown('lifespan');

  /* Success state — CTA goes to Configuration to complete setup */
  document.getElementById('ud-body').innerHTML = `
    <div style="padding:32px 16px;text-align:center;">
      <div style="width:52px;height:52px;border-radius:50%;background:#d5f1d2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 12l6 6 10-10" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div style="font-size:18px;font-weight:500;color:var(--strong);letter-spacing:-0.4px;margin-bottom:8px;">Unit Attached</div>
      <div style="font-size:14px;color:var(--soft);letter-spacing:-0.28px;line-height:1.6;margin-bottom:4px;">
        Unit <strong style="color:var(--strong);">${u.id}</strong> is now linked to
      </div>
      <div style="font-size:15px;font-weight:500;color:var(--strong);letter-spacing:-0.3px;margin-bottom:6px;">${attachSelectedTruck}</div>
      <div style="font-size:13px;color:var(--soft);letter-spacing:-0.2px;line-height:1.5;margin-bottom:28px;">Complete the setup by filling out the configuration details.</div>
      <button onclick="udSwitchTab('config')" style="background:${coPrimaryBtnBg()};color:${coPrimaryBtnColor()};border:none;border-radius:32px;padding:14px 32px;font-size:15px;font-weight:500;font-family:var(--font);letter-spacing:-0.3px;cursor:pointer;width:100%;margin-bottom:10px;">Complete Setup</button>
      <button onclick="udSwitchTab('lifespan')" style="background:none;border:1px solid var(--border-mid);border-radius:32px;padding:14px 32px;font-size:15px;font-weight:500;font-family:var(--font);letter-spacing:-0.3px;cursor:pointer;width:100%;color:var(--strong);">View Unit Life Span</button>
    </div>
  `;

  renderUnits();
  /* Truck tables and conditions reflect t.unlinked — refresh so the truck
     moves out of the "Unlinked" tag treatment immediately. Mirrors the
     truck-side utabDoAttach which already does this. */
  if (typeof renderTrucks === 'function')    renderTrucks();
  if (typeof renderOverview === 'function')  renderOverview();
  if (typeof renderConditions === 'function') renderConditions();
}

function closeUnitDetail() {
  document.getElementById('ud-nav-dropdown').style.display = 'none';
  const overlay = document.getElementById('attach-confirm-overlay');
  if (overlay) overlay.remove();
  const drawer = document.getElementById('units-drawer');
  drawer.style.transform = 'translateX(100%)';
  drawer.style.pointerEvents = 'none';
  setTimeout(() => drawer.style.display = 'none', 280);
}

/* Cross-navigation helpers */
function unitDrawerGoToComponentsOverview(truckNumber) {
  /* Close the unit drawer, go to All Trucks, open that truck's drawer */
  closeUnitDetail();
  setTimeout(() => {
    goToAllTrucks();
    /* Find the truck in the data and open its drawer */
    const TRUCKS = typeof TRUCK_DATA !== 'undefined' ? TRUCK_DATA : null;
    /* Fall back: find truck by number across wts/overview lists */
    const allTrucks = document.querySelectorAll('.truck-row');
    /* Use the truck number to open the drawer if possible */
    if (typeof openDrawerByTruckId === 'function') {
      openDrawerByTruckId(truckNumber);
    }
  }, 320);
}

function truckDrawerGoToLifespan() {
  const truckLabel = document.getElementById('drawer-truck-num');
  if (!truckLabel) return;
  const truckId = truckLabel.textContent.replace('Truck: ', '').trim();
  const unit = UNITS_DATA.find(u => u.truck === truckId);
  if (!unit) {
    /* No unit linked to this truck yet */
    openUnits();
    closeDrawer();
    return;
  }
  closeDrawer();
  setTimeout(() => {
    openUnits();
    setTimeout(() => openUnitDetail(unit.id), 150);
  }, 250);
}

/* ── UNLINK WORKFLOW ─────────────────────────────────────
   Works from both the unit drawer and the truck drawer.
   Both call showUnlinkConfirm(unitId, truckId, source)
   source = 'unit' | 'truck'
═════════════════════════════════════════════════════── */

function unitDrawerShowUnlink() {
  if (!udCurrentUnit) return;
  showUnlinkConfirm(udCurrentUnit.id, udCurrentUnit.truck, 'unit');
}

function truckDrawerUnlinkUnit() {
  const truckLabel = document.getElementById('drawer-truck-num');
  if (!truckLabel) return;
  const truckId = truckLabel.textContent.replace('Truck: ', '').trim();
  const unit = UNITS_DATA.find(u => u.truck === truckId);
  showUnlinkConfirm(unit ? unit.id : '--', truckId, 'truck');
}

function showUnlinkConfirm(unitId, truckId, source) {
  /* Pick which drawer to attach the overlay to */
  const drawerEl = source === 'unit'
    ? document.getElementById('units-drawer')
    : document.getElementById('drawer');

  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.id = 'unlink-confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-sheet">
      <div style="width:44px;height:44px;border-radius:50%;background:rgba(216,59,58,0.1);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M8 12a4.5 4.5 0 006 0l2.5-2.5a4.5 4.5 0 00-6-6L9 5" stroke="#d83b3a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 8a4.5 4.5 0 00-6 0L3.5 10.5a4.5 4.5 0 006 6L11 15" stroke="#d83b3a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 3l14 14" stroke="#d83b3a" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="confirm-title">Confirm unlink</div>
      <div class="confirm-body" id="unlink-confirm-body">
        The unit will become inactive and will need to be reattached before it can collect data again.
      </div>
      <label style="display:flex;align-items:center;gap:10px;margin:14px 0 4px;cursor:pointer;user-select:none;">
        <input type="checkbox" id="unlink-return-cb" onchange="unlinkToggleReturn(this)" style="width:18px;height:18px;accent-color:var(--blue);cursor:pointer;">
        <span style="font-size:14px;color:var(--strong);letter-spacing:-0.28px;">Return to Verify</span>
      </label>
      <div class="confirm-btns" style="margin-top:14px;">
        <button class="confirm-btn-primary" style="background:var(--red);" onclick="doUnlink('${unitId}', '${truckId}', '${source}', document.getElementById('unlink-return-cb').checked)">Confirm Unlink</button>
        <button class="confirm-btn-cancel" onclick="cancelUnlink()">Cancel</button>
      </div>
    </div>
  `;
  drawerEl.appendChild(overlay);
}

function unlinkToggleReturn(cb) {
  var body = document.getElementById('unlink-confirm-body');
  if (!body) return;
  body.textContent = cb.checked
    ? 'The unit will be marked Pending Return and stay visible until Verify confirms receipt.'
    : 'The unit will become inactive and will need to be reattached before it can collect data again.';
}

function cancelUnlink() {
  const el = document.getElementById('unlink-confirm-overlay');
  if (el) el.remove();
}

function doUnlink(unitId, truckId, source, andReturn) {
  cancelUnlink();

  /* Revert the unit */
  const u = UNITS_DATA.find(u => u.id === unitId);
  if (u) {
    u.status          = andReturn ? 'Pending Return' : 'Unlinked Unit';
    u.truck           = '--';
    u.assignedToTruck = null;
  }

  /* Add truck back to available pool */
  const alreadyThere = UNLINKED_TRUCKS.find(t => t.number === truckId);
  if (!alreadyThere) {
    UNLINKED_TRUCKS.push({ number: truckId, type: 'Front', drum: '--', water: '--', mixer: '--' });
  }

  /* Mark truck as unlinked in trucks[] and CC_TRUCKS so all pages reflect it */
  const tMain = trucks.find(t => t.num === truckId);
  if (tMain) { tMain.unlinked = true; tMain.err = 0; tMain.wrn = 0; tMain.truckMode = 'Non Active'; tMain.unitId = '--'; }
  const tCC = CC_TRUCKS.find(t => t.num === truckId);
  if (tCC) { tCC.unlinked = true; tCC.err = 0; tCC.wrn = 0; }

  renderUnits();
  renderTrucks();
  renderOverview();
  renderConditions();

  if (source === 'unit') {
    /* Update unit drawer — collapse nav back to unlinked set, show success */
    udCurrentUnit = u;

    /* Update status pill */
    const pill = document.getElementById('ud-status-pill');
    if (pill) {
      pill.className = '';
      pill.style.cssText = '';
      pill.innerHTML = `<span class="ustatus ustatus-unlinked"><span class="ustatus-dot"></span>Unlinked</span>`;
    }

    /* Rebuild nav for unlinked state */
    udCurrentTab = 'lifespan';
    document.getElementById('ud-nav-label').textContent = 'Unit Life Span';
    document.getElementById('ud-nav-chev').style.transform = '';
    udBuildNavDropdown('lifespan');

    /* Show unlink success state */
    document.getElementById('ud-body').innerHTML = `
      <div style="padding:32px 16px;text-align:center;">
        <div style="width:52px;height:52px;border-radius:50%;background:rgba(216,59,58,0.1);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M7 13a4.5 4.5 0 006 0l2.5-2.5a4.5 4.5 0 00-6-6L8 6" stroke="#d83b3a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 9a4.5 4.5 0 00-6 0L6.5 11.5a4.5 4.5 0 006 6L14 16" stroke="#d83b3a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 4l14 14" stroke="#d83b3a" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </div>
        <div style="font-size:18px;font-weight:500;color:var(--strong);letter-spacing:-0.4px;margin-bottom:8px;">Unit Unlinked</div>
        <div style="font-size:14px;color:var(--soft);letter-spacing:-0.28px;line-height:1.6;margin-bottom:28px;">
          Unit <strong style="color:var(--strong);">${unitId}</strong> has been removed from Truck ${truckId} and is now unlinked.
        </div>
        <button onclick="udSwitchTab('lifespan')" style="background:${coPrimaryBtnBg()};color:${coPrimaryBtnColor()};border:none;border-radius:32px;padding:14px 32px;font-size:15px;font-weight:500;font-family:var(--font);letter-spacing:-0.3px;cursor:pointer;width:100%;margin-bottom:10px;">View Unit Life Span</button>
        <button onclick="udSwitchTab('attach')" style="background:none;border:1px solid var(--border-mid);border-radius:32px;padding:14px 32px;font-size:15px;font-weight:500;font-family:var(--font);letter-spacing:-0.3px;cursor:pointer;width:100%;color:var(--strong);">Attach to a New Truck</button>
      </div>
    `;
  } else {
    /* Show success state inside the truck drawer */

    /* Hide all drawer states */
    ['state-list','state-detail','state-components','state-manual','state-timeline','state-sensor','state-config'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    /* Remove any existing success state */
    const existing = document.getElementById('state-unlink-success');
    if (existing) existing.remove();

    /* Build and inject success state */
    const successDiv = document.createElement('div');
    successDiv.id = 'state-unlink-success';
    successDiv.style.cssText = 'display:flex;flex-direction:column;flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;';
    successDiv.innerHTML = `
      <div style="padding:48px 24px 32px;text-align:center;display:flex;flex-direction:column;align-items:center;">
        <div style="width:52px;height:52px;border-radius:50%;background:rgba(216,59,58,0.1);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M7 13a4.5 4.5 0 006 0l2.5-2.5a4.5 4.5 0 00-6-6L8 6" stroke="#d83b3a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 9a4.5 4.5 0 00-6 0L6.5 11.5a4.5 4.5 0 006 6L14 16" stroke="#d83b3a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 4l14 14" stroke="#d83b3a" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </div>
        <div style="font-size:18px;font-weight:500;color:var(--strong);letter-spacing:-0.4px;margin-bottom:8px;">Unit Unlinked</div>
        <div style="font-size:14px;color:var(--soft);letter-spacing:-0.28px;line-height:1.6;margin-bottom:28px;">
          Unit <strong style="color:var(--strong);">${unitId}</strong> has been removed from Truck ${truckId} and is now unlinked.
        </div>
        <button onclick="closeDrawer()" style="background:${coPrimaryBtnBg()};color:${coPrimaryBtnColor()};border:none;border-radius:32px;padding:14px 32px;font-size:15px;font-weight:500;font-family:var(--font);letter-spacing:-0.3px;cursor:pointer;width:100%;margin-bottom:10px;">Back to Trucks</button>
        <button onclick="truckDrawerGoToUnit('${unitId}')" style="background:none;border:1px solid var(--border-mid);border-radius:32px;padding:14px 32px;font-size:15px;font-weight:500;font-family:var(--font);letter-spacing:-0.3px;cursor:pointer;width:100%;color:var(--strong);">Go to Unit</button>
      </div>
    `;

    document.getElementById('drawer-body').appendChild(successDiv);

    /* Update the ignition pill in the chrome row to reflect unlinked state */
    const pill = document.querySelector('#drawer .d-ign-pill');
    if (pill) {
      pill.style.cssText = 'display:flex;align-items:center;gap:5px;background:rgba(54,50,45,0.08);border-radius:20px;padding:5px 10px;font-size:13px;font-weight:500;color:var(--soft);';
      pill.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:var(--soft);flex-shrink:0;display:inline-block;"></span>Unlinked`;
    }
  }
}

/* Navigate from truck drawer directly to unit detail */
function truckDrawerGoToUnit(unitId) {
  closeDrawer();
  setTimeout(() => {
    openUnits();
    setTimeout(() => openUnitDetail(unitId), 150);
  }, 250);
}

/* ── Units search ── */
const unitIcon = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="path-1-inside-1_1844_4774" fill="white"><path d="M4.66667 9.99749C4.53481 9.99749 4.40592 10.0366 4.29629 10.1098C4.18665 10.1831 4.10121 10.2872 4.05075 10.409C4.00029 10.5308 3.98709 10.6649 4.01281 10.7942C4.03853 10.9235 4.10203 11.0423 4.19526 11.1356C4.2885 11.2288 4.40729 11.2923 4.53661 11.318C4.66593 11.3437 4.79997 11.3305 4.92179 11.2801C5.04361 11.2296 5.14773 11.1442 5.22098 11.0345C5.29423 10.9249 5.33333 10.796 5.33333 10.6642C5.33333 10.4873 5.2631 10.3178 5.13807 10.1927C5.01305 10.0677 4.84348 9.99749 4.66667 9.99749ZM2.66667 9.99749C2.53481 9.99749 2.40592 10.0366 2.29629 10.1098C2.18665 10.1831 2.10121 10.2872 2.05075 10.409C2.00029 10.5308 1.98709 10.6649 2.01281 10.7942C2.03853 10.9235 2.10203 11.0423 2.19526 11.1356C2.2885 11.2288 2.40729 11.2923 2.53661 11.318C2.66593 11.3437 2.79997 11.3305 2.92179 11.2801C3.04361 11.2296 3.14773 11.1442 3.22098 11.0345C3.29423 10.9249 3.33333 10.796 3.33333 10.6642C3.33333 10.4873 3.2631 10.3178 3.13807 10.1927C3.01305 10.0677 2.84348 9.99749 2.66667 9.99749ZM6.66667 9.99749C6.53481 9.99749 6.40592 10.0366 6.29629 10.1098C6.18665 10.1831 6.10121 10.2872 6.05075 10.409C6.00029 10.5308 5.98709 10.6649 6.01281 10.7942C6.03853 10.9235 6.10203 11.0423 6.19526 11.1356C6.2885 11.2288 6.40729 11.2923 6.53661 11.318C6.66593 11.3437 6.79997 11.3305 6.92179 11.2801C7.04361 11.2296 7.14773 11.1442 7.22098 11.0345C7.29423 10.9249 7.33333 10.796 7.33333 10.6642C7.33333 10.4873 7.2631 10.3178 7.13807 10.1927C7.01305 10.0677 6.84348 9.99749 6.66667 9.99749ZM8.73333 4.33082C8.79194 4.22979 8.87605 4.14594 8.97726 4.08764C9.07846 4.02935 9.19321 3.99867 9.31 3.99867C9.42679 3.99867 9.54154 4.02935 9.64274 4.08764C9.74395 4.14594 9.82806 4.22979 9.88667 4.33082C9.97461 4.48331 10.1193 4.59482 10.2892 4.64103C10.459 4.68725 10.6403 4.6644 10.7933 4.57749C10.872 4.53621 10.9416 4.47964 10.998 4.4111C11.0545 4.34255 11.0967 4.26341 11.1222 4.17833C11.1476 4.09325 11.1558 4.00394 11.1463 3.91564C11.1368 3.82734 11.1097 3.74184 11.0667 3.66415C10.8913 3.35951 10.6387 3.10647 10.3344 2.93052C10.0301 2.75457 9.68484 2.66193 9.33333 2.66193C8.98182 2.66193 8.63652 2.75457 8.33222 2.93052C8.02792 3.10647 7.77536 3.35951 7.6 3.66415C7.54371 3.81141 7.54143 3.97384 7.59355 4.12262C7.64567 4.2714 7.74883 4.39689 7.88471 4.47682C8.02059 4.55675 8.18039 4.58594 8.33575 4.55921C8.49112 4.53248 8.63198 4.45156 8.73333 4.33082ZM13.4 2.33082C12.9902 1.62208 12.4012 1.03361 11.6921 0.624489C10.983 0.21537 10.1787 0 9.36 0C8.54132 0 7.73705 0.21537 7.02792 0.624489C6.3188 1.03361 5.72978 1.62208 5.32 2.33082C5.27592 2.40691 5.24733 2.49097 5.23587 2.57815C5.22442 2.66534 5.23033 2.75393 5.25325 2.83882C5.27618 2.92372 5.31568 3.00324 5.36947 3.0728C5.42326 3.14236 5.49028 3.2006 5.56667 3.24415C5.6584 3.29639 5.76122 3.32609 5.86667 3.33082C5.98414 3.33129 6.09965 3.3007 6.2015 3.24217C6.30336 3.18363 6.38793 3.09922 6.44667 2.99749C6.73924 2.4908 7.16003 2.07004 7.66674 1.77751C8.17345 1.48497 8.74824 1.33097 9.33333 1.33097C9.91843 1.33097 10.4932 1.48497 10.9999 1.77751C11.5066 2.07004 11.9274 2.4908 12.22 2.99749C12.2636 3.07388 12.3218 3.1409 12.3914 3.19469C12.4609 3.24848 12.5404 3.28797 12.6253 3.3109C12.7102 3.33383 12.7988 3.33974 12.886 3.32828C12.9732 3.31682 13.0572 3.28823 13.1333 3.24415C13.2114 3.2023 13.2804 3.14531 13.3362 3.07651C13.3919 3.0077 13.4335 2.92847 13.4583 2.84344C13.4831 2.7584 13.4908 2.66928 13.4807 2.58126C13.4707 2.49325 13.4433 2.40811 13.4 2.33082ZM10.6667 7.99749H10V5.99749C10 5.82068 9.92976 5.65111 9.80474 5.52608C9.67971 5.40106 9.51014 5.33082 9.33333 5.33082C9.15652 5.33082 8.98695 5.40106 8.86193 5.52608C8.7369 5.65111 8.66667 5.82068 8.66667 5.99749V7.99749H2C1.46957 7.99749 0.960859 8.2082 0.585786 8.58327C0.210714 8.95835 0 9.46705 0 9.99749V11.3308C0 11.8613 0.210714 12.37 0.585786 12.745C0.960859 13.1201 1.46957 13.3308 2 13.3308H10.6667C11.1971 13.3308 11.7058 13.1201 12.0809 12.745C12.456 12.37 12.6667 11.8613 12.6667 11.3308V9.99749C12.6667 9.46705 12.456 8.95835 12.0809 8.58327C11.7058 8.2082 11.1971 7.99749 10.6667 7.99749ZM11.3333 11.3308C11.3333 11.5076 11.2631 11.6772 11.1381 11.8022C11.013 11.9273 10.8435 11.9975 10.6667 11.9975H2C1.82319 11.9975 1.65362 11.9273 1.5286 11.8022C1.40357 11.6772 1.33333 11.5076 1.33333 11.3308V9.99749C1.33333 9.82068 1.40357 9.65111 1.5286 9.52608C1.65362 9.40106 1.82319 9.33082 2 9.33082H10.6667C10.8435 9.33082 11.013 9.40106 11.1381 9.52608C11.2631 9.65111 11.3333 9.82068 11.3333 9.99749V11.3308Z"/></mask><path d="M4.66667 9.99749C4.53481 9.99749 4.40592 10.0366 4.29629 10.1098C4.18665 10.1831 4.10121 10.2872 4.05075 10.409C4.00029 10.5308 3.98709 10.6649 4.01281 10.7942C4.03853 10.9235 4.10203 11.0423 4.19526 11.1356C4.2885 11.2288 4.40729 11.2923 4.53661 11.318C4.66593 11.3437 4.79997 11.3305 4.92179 11.2801C5.04361 11.2296 5.14773 11.1442 5.22098 11.0345C5.29423 10.9249 5.33333 10.796 5.33333 10.6642C5.33333 10.4873 5.2631 10.3178 5.13807 10.1927C5.01305 10.0677 4.84348 9.99749 4.66667 9.99749ZM2.66667 9.99749C2.53481 9.99749 2.40592 10.0366 2.29629 10.1098C2.18665 10.1831 2.10121 10.2872 2.05075 10.409C2.00029 10.5308 1.98709 10.6649 2.01281 10.7942C2.03853 10.9235 2.10203 11.0423 2.19526 11.1356C2.2885 11.2288 2.40729 11.2923 2.53661 11.318C2.66593 11.3437 2.79997 11.3305 2.92179 11.2801C3.04361 11.2296 3.14773 11.1442 3.22098 11.0345C3.29423 10.9249 3.33333 10.796 3.33333 10.6642C3.33333 10.4873 3.2631 10.3178 3.13807 10.1927C3.01305 10.0677 2.84348 9.99749 2.66667 9.99749ZM6.66667 9.99749C6.53481 9.99749 6.40592 10.0366 6.29629 10.1098C6.18665 10.1831 6.10121 10.2872 6.05075 10.409C6.00029 10.5308 5.98709 10.6649 6.01281 10.7942C6.03853 10.9235 6.10203 11.0423 6.19526 11.1356C6.2885 11.2288 6.40729 11.2923 6.53661 11.318C6.66593 11.3437 6.79997 11.3305 6.92179 11.2801C7.04361 11.2296 7.14773 11.1442 7.22098 11.0345C7.29423 10.9249 7.33333 10.796 7.33333 10.6642C7.33333 10.4873 7.2631 10.3178 7.13807 10.1927C7.01305 10.0677 6.84348 9.99749 6.66667 9.99749ZM8.73333 4.33082C8.79194 4.22979 8.87605 4.14594 8.97726 4.08764C9.07846 4.02935 9.19321 3.99867 9.31 3.99867C9.42679 3.99867 9.54154 4.02935 9.64274 4.08764C9.74395 4.14594 9.82806 4.22979 9.88667 4.33082C9.97461 4.48331 10.1193 4.59482 10.2892 4.64103C10.459 4.68725 10.6403 4.6644 10.7933 4.57749C10.872 4.53621 10.9416 4.47964 10.998 4.4111C11.0545 4.34255 11.0967 4.26341 11.1222 4.17833C11.1476 4.09325 11.1558 4.00394 11.1463 3.91564C11.1368 3.82734 11.1097 3.74184 11.0667 3.66415C10.8913 3.35951 10.6387 3.10647 10.3344 2.93052C10.0301 2.75457 9.68484 2.66193 9.33333 2.66193C8.98182 2.66193 8.63652 2.75457 8.33222 2.93052C8.02792 3.10647 7.77536 3.35951 7.6 3.66415C7.54371 3.81141 7.54143 3.97384 7.59355 4.12262C7.64567 4.2714 7.74883 4.39689 7.88471 4.47682C8.02059 4.55675 8.18039 4.58594 8.33575 4.55921C8.49112 4.53248 8.63198 4.45156 8.73333 4.33082ZM13.4 2.33082C12.9902 1.62208 12.4012 1.03361 11.6921 0.624489C10.983 0.21537 10.1787 0 9.36 0C8.54132 0 7.73705 0.21537 7.02792 0.624489C6.3188 1.03361 5.72978 1.62208 5.32 2.33082C5.27592 2.40691 5.24733 2.49097 5.23587 2.57815C5.22442 2.66534 5.23033 2.75393 5.25325 2.83882C5.27618 2.92372 5.31568 3.00324 5.36947 3.0728C5.42326 3.14236 5.49028 3.2006 5.56667 3.24415C5.6584 3.29639 5.76122 3.32609 5.86667 3.33082C5.98414 3.33129 6.09965 3.3007 6.2015 3.24217C6.30336 3.18363 6.38793 3.09922 6.44667 2.99749C6.73924 2.4908 7.16003 2.07004 7.66674 1.77751C8.17345 1.48497 8.74824 1.33097 9.33333 1.33097C9.91843 1.33097 10.4932 1.48497 10.9999 1.77751C11.5066 2.07004 11.9274 2.4908 12.22 2.99749C12.2636 3.07388 12.3218 3.1409 12.3914 3.19469C12.4609 3.24848 12.5404 3.28797 12.6253 3.3109C12.7102 3.33383 12.7988 3.33974 12.886 3.32828C12.9732 3.31682 13.0572 3.28823 13.1333 3.24415C13.2114 3.2023 13.2804 3.14531 13.3362 3.07651C13.3919 3.0077 13.4335 2.92847 13.4583 2.84344C13.4831 2.7584 13.4908 2.66928 13.4807 2.58126C13.4707 2.49325 13.4433 2.40811 13.4 2.33082ZM10.6667 7.99749H10V5.99749C10 5.82068 9.92976 5.65111 9.80474 5.52608C9.67971 5.40106 9.51014 5.33082 9.33333 5.33082C9.15652 5.33082 8.98695 5.40106 8.86193 5.52608C8.7369 5.65111 8.66667 5.82068 8.66667 5.99749V7.99749H2C1.46957 7.99749 0.960859 8.2082 0.585786 8.58327C0.210714 8.95835 0 9.46705 0 9.99749V11.3308C0 11.8613 0.210714 12.37 0.585786 12.745C0.960859 13.1201 1.46957 13.3308 2 13.3308H10.6667C11.1971 13.3308 11.7058 13.1201 12.0809 12.745C12.456 12.37 12.6667 11.8613 12.6667 11.3308V9.99749C12.6667 9.46705 12.456 8.95835 12.0809 8.58327C11.7058 8.2082 11.1971 7.99749 10.6667 7.99749ZM11.3333 11.3308C11.3333 11.5076 11.2631 11.6772 11.1381 11.8022C11.013 11.9273 10.8435 11.9975 10.6667 11.9975H2C1.82319 11.9975 1.65362 11.9273 1.5286 11.8022C1.40357 11.6772 1.33333 11.5076 1.33333 11.3308V9.99749C1.33333 9.82068 1.40357 9.65111 1.5286 9.52608C1.65362 9.40106 1.82319 9.33082 2 9.33082H10.6667C10.8435 9.33082 11.013 9.40106 11.1381 9.52608C11.2631 9.65111 11.3333 9.82068 11.3333 9.99749V11.3308Z" stroke="#36322D" stroke-width="2" mask="url(#path-1-inside-1_1844_4774)"/></svg>`;

function unitsSearch() {
  const q = document.getElementById('units-search').value.trim();
  unitsSearchQuery = q;

  const clearBtn = document.getElementById('units-srch-clear');
  if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

  const drop      = document.getElementById('units-srch-drop');
  const resultsEl = document.getElementById('units-srch-results');

  if (!q) {
    if (drop) drop.style.display = 'none';
    renderUnits();
    return;
  }

  const matches = UNITS_DATA.filter(u =>
    u.id.toLowerCase().includes(q.toLowerCase()) ||
    u.status.toLowerCase().includes(q.toLowerCase()) ||
    (u.truck && String(u.truck).toLowerCase().includes(q.toLowerCase())) ||
    u.sysType.toLowerCase().includes(q.toLowerCase())
  );

  if (matches.length === 0) {
    resultsEl.innerHTML = `<div class="srch-no-hits">No units found</div>`;
  } else {
    const MAX   = 5;
    const shown = matches.slice(0, MAX);
    const extra = matches.length - MAX;

    let html = `<div class="srch-section-hdr">${unitIcon}<span class="srch-section-label">Units</span></div>`;

    shown.forEach(u => {
      const primary   = srchHighlight(u.id, q);
      const secondary = `${u.status} · ${u.sysType}${u.truck ? ' · Truck ' + u.truck : ''}`;
      html += `
        <div class="srch-row" onclick="unitsSrchSelect('${u.id}')">
          <span class="srch-match-text">${primary}</span>
          <span class="srch-meta">${secondary}</span>
        </div>`;
    });

    if (extra > 0) {
      html += `<div class="srch-show-more">+${extra} more unit${extra > 1 ? 's' : ''}</div>`;
    }
    resultsEl.innerHTML = html;
  }

  /* Position and show */
  const field   = document.getElementById('units-srch-field');
  const pagePad = document.querySelector('#s-units .page-pad') || drop.parentElement;
  if (field && drop && pagePad) {
    const fieldRect = field.getBoundingClientRect();
    const padRect   = pagePad.getBoundingClientRect();
    drop.style.top  = (fieldRect.bottom - padRect.top + 6) + 'px';
    drop.style.left  = '16px';
    drop.style.right = '16px';
    drop.style.position = 'absolute';
  }
  drop.style.display = 'block';
  renderUnits();
}

function unitsSrchSelect(unitId) {
  unitsCloseDrop();
  openUnitDetail(unitId);
}

function unitsCloseDrop() {
  const drop = document.getElementById('units-srch-drop');
  if (drop) drop.style.display = 'none';
}

function unitsSearchClear() {
  const input = document.getElementById('units-search');
  if (input) input.value = '';
  const clearBtn = document.getElementById('units-srch-clear');
  if (clearBtn) clearBtn.style.display = 'none';
  unitsSearchQuery = '';
  unitsCloseDrop();
  renderUnits();
}

/* ── Units filter sheet ── */


function unitsFilterClose() {
  const sheet = document.getElementById('units-filter-sheet');
  sheet.style.transform = 'translateY(110%)';
  setTimeout(() => {
    document.getElementById('units-filter-overlay').style.display = 'none';
  }, 300);
}

function unitsFilterToggle(el) {
  const group = el.dataset.ufgroup;
  const val   = el.dataset.ufval;
  const set   = unitsFilterState[group];
  if (set.has(val)) { set.delete(val); el.classList.remove('active'); }
  else              { set.add(val);    el.classList.add('active'); }
}

function unitsFilterReset() {
  Object.values(unitsFilterState).forEach(s => s.clear());
  document.querySelectorAll('#units-filter-sheet .flt-chip').forEach(c => c.classList.remove('active'));
  unitsFilterUpdateCount();
}

function unitsFilterApply() {
  unitsFilterClose();
  unitsFilterUpdateCount();
  renderUnits();
}

function unitsFilterUpdateCount() {
  const total = Object.values(unitsFilterState).reduce((n, s) => n + s.size, 0);
  const badge = document.getElementById('units-filter-count');
  const btn   = document.getElementById('units-filter-btn');
  if (total > 0) {
    badge.textContent = total;
    badge.style.display = 'inline-block';
    btn.style.borderColor = 'var(--blue)';
    btn.style.color = 'var(--blue)';
    btn.style.background = 'rgba(48,105,227,0.08)';
  } else {
    badge.style.display = 'none';
    btn.style.borderColor = '';
    btn.style.color = '';
    btn.style.background = '';
  }
}


/* ════════════════════════════════════════
   DESKTOP WHERE TO START
════════════════════════════════════════ */
let dtSearchQuery = '';
let dtActiveTab   = 'wts';

/* Version pill — renders a clean monospace version badge.
   Formats 'V3' style shorthand as 'v3.04.029' if no dots present,
   otherwise renders the full version string as-is. */
function dtVerPill(ver) {
  if (!ver || ver === '--' || ver === '—') return '<span style="color:var(--soft)">—</span>';
  return `<span class="dt-ver-pill">${ver}</span>`;
}

function dtRenderTable() {
  const tbody = document.getElementById('dt-tbody');
  if (!tbody) return;
  const cols = visibleCols('wts');
  const ncols = cols.length;

  /* Cell builder — maps col.id to truck data */
  function wtsCell(col, t, badges, connDot) {
    const c = col.id;
    const cl = col.dot ? 'dt-td dt-td--dot' : 'dt-td';
    if (c === 'truck')    return `<td class="dt-td dt-td-strong">${t.num}</td>`;
    if (c === 'alerts')   return `<td class="${cl}"><div class="dt-badge-wrap">${badges || '<span style="color:var(--soft)">—</span>'}</div></td>`;
    if (c === 'source')   return `<td class="${cl}">${t.source === 'Customer Ticket' ? 'Customer' : 'System'}</td>`;
    if (c === 'ignition') return `<td class="${cl}">${t.ign} · ${t.ignDetail}</td>`;
    if (c === 'version')  return `<td class="${cl}">${dtVerPill(t.ver)}</td>`;
    if (c === 'impact')   return `<td class="${cl}">${t.impact || '—'}</td>`;
    if (c === 'plant')    return `<td class="dt-td dt-td-strong">${t.plant}</td>`;
    if (c === 'account')  return `<td class="${cl}">${t.account}</td>`;
    if (c === 'swcomp')   { const ok = t.swCompliant !== false; return `<td class="dt-td" style="text-align:left;">${ok ? '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3.5 3.5 5.5-6" stroke="#16a34a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="#d70100" stroke-width="1.6" stroke-linecap="round"/></svg>'}</td>`; }
    if (c === 'age')      return `<td class="dt-td dt-td-soft">${t.age}</td>`;
    if (c === 'conn')     return `<td class="${cl}">${connDot}</td>`;
    if (c === 'lastconn') return `<td class="dt-td dt-td-soft">${t.lastConn}</td>`;
    return `<td class="${cl}">—</td>`;
  }

  let rows = '', count = 0, rowIdx = 0;
  truckGroups.forEach((group, gi) => {
    if (!selectedAccounts.has(group.account)) return;
    if (!selectedLocations.has(group.label)) return;
    const problemTrucks = group.trucks.filter(t => !t.unlinked && (getTruckAlerts(t.num).err || getTruckAlerts(t.num).wrn) && dtTruckMatchesSearch(t) && filterMatch(t));
    if (problemTrucks.length === 0) return;
    const isOpen = group.open !== false;
    rows += `
      <tr class="dt-group-row" onclick="dtToggleGroup(${gi})" style="cursor:pointer;">
        <td colspan="${ncols}" style="padding:0;">
          <div class="dt-group-cell">
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style="transform:${isOpen ? 'rotate(0deg)' : 'rotate(180deg)'};transition:transform 0.2s;flex-shrink:0;"><path d="M10 6L6 2 2 6" stroke="#36322d9e" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <div class="dt-group-badge">${problemTrucks.length}</div>
            <span>${group.account} · ${group.label} — Uptime ${group.uptime}</span>
          </div>
        </td>
      </tr>`;
    if (!isOpen) return;
    dtSortTrucks(problemTrucks, 'wts').forEach(t => {
      count++;
      const alt = rowIdx++ % 2 === 1;
      const _wa=getTruckAlerts(t.num);
  const badges = [
        _wa.err > 0 ? `<span class="dt-badge err"><svg width="11" height="11" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.375 0H8.25C9.00195 0 9.625 0.623047 9.625 1.375V8.25C9.625 9.02344 9.00195 9.625 8.25 9.625H1.375C0.601562 9.625 0 9.02344 0 8.25V1.375C0 0.623047 0.601562 0 1.375 0ZM4.8125 2.0625C4.51172 2.0625 4.29688 2.29883 4.29688 2.57812V4.98438C4.29688 5.28516 4.51172 5.5 4.8125 5.5C5.0918 5.5 5.32812 5.28516 5.32812 4.98438V2.57812C5.32812 2.29883 5.0918 2.0625 4.8125 2.0625ZM4.125 6.875C4.125 7.26172 4.42578 7.5625 4.8125 7.5625C5.17773 7.5625 5.5 7.26172 5.5 6.875C5.5 6.50977 5.17773 6.1875 4.8125 6.1875C4.42578 6.1875 4.125 6.50977 4.125 6.875Z" fill="white"/></svg>${_wa.err}</span>` : '',
        _wa.wrn > 0 ? `<span class="dt-badge wrn"><svg width="11" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.54297 0C5.84375 0 6.12305 0.171875 6.27344 0.429688L10.9141 8.33594C11.0645 8.61523 11.0645 8.9375 10.9141 9.19531C10.7637 9.47461 10.4844 9.625 10.1836 9.625H0.902344C0.580078 9.625 0.300781 9.47461 0.150391 9.19531C0 8.9375 0 8.61523 0.150391 8.33594L4.79102 0.429688C4.94141 0.171875 5.2207 0 5.54297 0ZM5.54297 2.75C5.24219 2.75 5.02734 2.98633 5.02734 3.26562V5.67188C5.02734 5.97266 5.24219 6.1875 5.54297 6.1875C5.82227 6.1875 6.05859 5.97266 6.05859 5.67188V3.26562C6.05859 2.98633 5.82227 2.75 5.54297 2.75ZM6.23047 7.5625C6.23047 7.19727 5.9082 6.875 5.54297 6.875C5.15625 6.875 4.85547 7.19727 4.85547 7.5625C4.85547 7.94922 5.15625 8.25 5.54297 8.25C5.9082 8.25 6.23047 7.94922 6.23047 7.5625Z" fill="#36322d"/></svg>${_wa.wrn}</span>` : '',
      ].join('');
      const connDot = t.conn === 'live'
        ? `<span class="dt-conn-dot live"></span>Live`
        : `<span class="dt-conn-dot none"></span><span style="color:var(--soft)">No connection</span>`;
      rows += `<tr class="dt-tr${alt ? ' alt' : ''}" data-truck="${t.num}" onclick="dtOpenTruckChecked('${t.num}')">
        ${cols.map(col => wtsCell(col, t, badges, connDot)).join('')}
      </tr>`;
    });
  });

  if (!rows) rows = `<tr><td colspan="${ncols}" style="padding:40px;text-align:center;color:var(--soft);font-size:14px;">No trucks with active issues in selected territory.</td></tr>`;
  tbody.innerHTML = rows;
  const sub = document.getElementById('dt-page-sub');
  if (sub) sub.textContent = `All Trucks · ${count} truck${count !== 1 ? 's' : ''}`;
  const info = document.getElementById('dt-page-info');
  if (info) info.textContent = `1 - ${count} of ${count} Records`;
}

function dtToggleGroup(gi) {
  truckGroups[gi].open = !truckGroups[gi].open;
  dtRenderTable();
  /* Keep mobile in sync */
  renderTrucks();
}

function dtTruckMatchesSearch(t) {
  if (!dtSearchQuery) return true;
  const q = dtSearchQuery.toLowerCase();
  return t.num.toLowerCase().includes(q) ||
         t.plant.toLowerCase().includes(q) ||
         t.account.toLowerCase().includes(q) ||
         t.ver.toLowerCase().includes(q);
}

/* ── DESKTOP TRUCK SEARCH TYPEAHEAD ──────────────────────
   Mirrors mobile's srch-* flow: type → grouped dropdown of trucks with
   highlighted matches and meta. Click a row to fill the input, scroll
   the table to that truck, and flash-highlight the row.
   Search still also filters the table inline (preserves pre-existing
   behavior). */
let dtSrchActiveQuery = '';
let dtSrchActiveIdx   = -1;   /* keyboard nav index into shown results */
let dtSrchShownTrucks = [];   /* current shown rows for ↑/↓/Enter */

function dtSrchHighlight(text, query) {
  if (!query) return `<span class="dt-srch-soft">${text}</span>`;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return `<span class="dt-srch-soft">${text}</span>`;
  const before = text.slice(0, idx);
  const match  = text.slice(idx, idx + query.length);
  const after  = text.slice(idx + query.length);
  return `${before ? `<span class="dt-srch-soft">${before}</span>` : ''}<span class="dt-srch-chip">${match}</span>${after ? `<span class="dt-srch-soft">${after}</span>` : ''}`;
}

function dtSrchOnInput() {
  const input = document.getElementById('dt-search-input');
  const q = input.value.trim();
  dtSrchActiveQuery = q;
  dtSrchActiveIdx = -1;

  document.getElementById('dt-srch-field').classList.toggle('active', q.length > 0);
  document.getElementById('dt-srch-clear').style.display = q.length > 0 ? 'block' : 'none';

  // Keep the existing inline table filter behavior
  dtSearchQuery = q;
  dtRenderTable();

  const drop = document.getElementById('dt-srch-drop');
  if (!q) { drop.style.display = 'none'; return; }

  // Search across all visible trucks (respects current territory selection)
  const all = [];
  truckGroups.forEach(g => g.trucks.forEach(t => { if (!t.unlinked) all.push(t); }));
  const ql = q.toLowerCase();
  const matches = all.filter(t =>
    String(t.num).toLowerCase().includes(ql) ||
    (t.plant || '').toLowerCase().includes(ql) ||
    (t.ver || '').toLowerCase().includes(ql) ||
    (t.ign || '').toLowerCase().includes(ql)
  );

  const MAX = 6;
  const shown = matches.slice(0, MAX);
  const extra = matches.length - MAX;
  dtSrchShownTrucks = shown;

  const resultsEl = document.getElementById('dt-srch-results');
  if (matches.length === 0) {
    resultsEl.innerHTML = `<div class="dt-srch-no-hits">No matches found</div>`;
    drop.style.display = 'block';
    return;
  }

  const truckIcon = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 13C1.94772 13 1.5 12.5523 1.5 12V9.80278C1.5 9.60535 1.55844 9.41234 1.66795 9.24808L3.20313 6.9453C3.3886 6.6671 3.70083 6.5 4.03518 6.5H6V12C6 12.5523 6.44772 13 7 13H11" stroke="#36322d9e" stroke-width="1.2" stroke-linejoin="round"/><circle cx="4" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/><circle cx="12" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/><path d="M12.2242 5.15477L8.65195 6.06584C6.54213 6.60392 5.61922 9.08368 6.86385 10.8702L11.9902 10.8575L14.0825 7.82226C14.204 7.64525 14.204 7.41112 14.0811 7.23472L12.7748 5.35971C12.6519 5.18331 12.4325 5.10164 12.2242 5.15477Z" stroke="#36322d9e" stroke-width="1.2"/></svg>`;

  let html = `
    <div class="dt-srch-section-hdr">
      ${truckIcon}
      <span class="dt-srch-section-label">Trucks</span>
    </div>`;

  shown.forEach((t, i) => {
    const primary   = dtSrchHighlight(String(t.num), q);
    const secondary = `${t.plant || '—'} · ${t.ver || '—'} · Ign ${t.ign || '—'}`;
    html += `
      <div class="dt-srch-row" data-idx="${i}" onclick="dtSrchSelect(${i})">
        <span class="dt-srch-match-text">${primary}</span>
        <span class="dt-srch-meta">${secondary}</span>
      </div>`;
  });

  if (extra > 0) {
    html += `<div class="dt-srch-show-more" onclick="dtSrchShowMore()">Show ${extra} more truck${extra > 1 ? 's' : ''}</div>`;
  }

  resultsEl.innerHTML = html;
  drop.style.display = 'block';
}

function dtSrchOnFocus() {
  if (dtSrchActiveQuery) dtSrchOnInput();
}

function dtSrchClear() {
  const input = document.getElementById('dt-search-input');
  input.value = '';
  dtSrchActiveQuery = '';
  dtSrchActiveIdx = -1;
  document.getElementById('dt-srch-field').classList.remove('active');
  document.getElementById('dt-srch-clear').style.display = 'none';
  document.getElementById('dt-srch-drop').style.display = 'none';
  dtSearchQuery = '';
  dtRenderTable();
  input.focus();
}

function dtSrchSelect(idx) {
  const t = dtSrchShownTrucks[idx];
  if (!t) return;
  document.getElementById('dt-srch-drop').style.display = 'none';
  document.getElementById('dt-search-input').value = t.num;
  dtSrchActiveQuery = String(t.num);
  // Filter the table to this truck so it's the obvious focus
  dtSearchQuery = String(t.num);
  dtRenderTable();
  // Scroll & flash-highlight the row
  requestAnimationFrame(() => {
    const tr = document.querySelector(`#dt-tbody tr[data-truck="${t.num}"]`);
    if (tr) {
      tr.scrollIntoView({ block:'center', behavior:'smooth' });
      tr.classList.remove('dt-srch-flash');
      // Force reflow so animation re-fires
      void tr.offsetWidth;
      tr.classList.add('dt-srch-flash');
    }
  });
}

function dtSrchShowMore() {
  // Re-render with no MAX cap
  const q = dtSrchActiveQuery;
  if (!q) return;
  const all = [];
  truckGroups.forEach(g => g.trucks.forEach(t => { if (!t.unlinked) all.push(t); }));
  const ql = q.toLowerCase();
  const matches = all.filter(t =>
    String(t.num).toLowerCase().includes(ql) ||
    (t.plant || '').toLowerCase().includes(ql) ||
    (t.ver || '').toLowerCase().includes(ql) ||
    (t.ign || '').toLowerCase().includes(ql)
  );
  dtSrchShownTrucks = matches;
  const truckIcon = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 13C1.94772 13 1.5 12.5523 1.5 12V9.80278C1.5 9.60535 1.55844 9.41234 1.66795 9.24808L3.20313 6.9453C3.3886 6.6671 3.70083 6.5 4.03518 6.5H6V12C6 12.5523 6.44772 13 7 13H11" stroke="#36322d9e" stroke-width="1.2" stroke-linejoin="round"/><circle cx="4" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/><circle cx="12" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/><path d="M12.2242 5.15477L8.65195 6.06584C6.54213 6.60392 5.61922 9.08368 6.86385 10.8702L11.9902 10.8575L14.0825 7.82226C14.204 7.64525 14.204 7.41112 14.0811 7.23472L12.7748 5.35971C12.6519 5.18331 12.4325 5.10164 12.2242 5.15477Z" stroke="#36322d9e" stroke-width="1.2"/></svg>`;
  let html = `<div class="dt-srch-section-hdr">${truckIcon}<span class="dt-srch-section-label">Trucks</span></div>`;
  matches.forEach((t, i) => {
    const primary   = dtSrchHighlight(String(t.num), q);
    const secondary = `${t.plant || '—'} · ${t.ver || '—'} · Ign ${t.ign || '—'}`;
    html += `<div class="dt-srch-row" data-idx="${i}" onclick="dtSrchSelect(${i})"><span class="dt-srch-match-text">${primary}</span><span class="dt-srch-meta">${secondary}</span></div>`;
  });
  document.getElementById('dt-srch-results').innerHTML = html;
}

function dtSrchKey(e) {
  const drop = document.getElementById('dt-srch-drop');
  const open = drop && drop.style.display === 'block';
  if (!open) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    dtSrchActiveIdx = Math.min(dtSrchActiveIdx + 1, dtSrchShownTrucks.length - 1);
    dtSrchUpdateActive();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    dtSrchActiveIdx = Math.max(dtSrchActiveIdx - 1, 0);
    dtSrchUpdateActive();
  } else if (e.key === 'Enter') {
    if (dtSrchActiveIdx >= 0) {
      e.preventDefault();
      dtSrchSelect(dtSrchActiveIdx);
    }
  } else if (e.key === 'Escape') {
    drop.style.display = 'none';
  }
}

function dtSrchUpdateActive() {
  document.querySelectorAll('.dt-srch-row').forEach((el, i) => {
    el.classList.toggle('active', i === dtSrchActiveIdx);
  });
  const activeEl = document.querySelector(`.dt-srch-row[data-idx="${dtSrchActiveIdx}"]`);
  if (activeEl) activeEl.scrollIntoView({ block:'nearest' });
}

// Click-outside closes the dropdown
document.addEventListener('click', (e) => {
  const wrap = document.getElementById('dt-srch-wrap');
  const drop = document.getElementById('dt-srch-drop');
  if (!wrap || !drop) return;
  if (drop.style.display === 'block' && !wrap.contains(e.target)) {
    drop.style.display = 'none';
  }
});

/* Close clone dropdown when clicking outside */
document.addEventListener('click', function(e) {
  var dtWrap = document.getElementById('dt-clone-selector') && document.getElementById('dt-clone-selector').closest('.clone-selector-wrap');
  var dtDd = document.getElementById('dt-clone-dropdown');
  if (dtDd && dtDd.classList.contains('open') && dtWrap && !dtWrap.contains(e.target)) {
    dtDd.classList.remove('open');
  }
  var udWrap = document.getElementById('ud-clone-selector') && document.getElementById('ud-clone-selector').closest('.clone-selector-wrap');
  var udDd = document.getElementById('ud-clone-dropdown');
  if (udDd && udDd.classList.contains('open') && udWrap && !udWrap.contains(e.target)) {
    udDd.classList.remove('open');
  }
});

/* Legacy entrypoint kept for backwards compat — table inline filter only */


/* ── DESKTOP FILTER POPOVER ──────────────────────────────
   Shares the existing filterState model with mobile so that any change
   on either side affects the same set. Differences from mobile:
   - Renders as an anchored popover (not a bottom sheet)
   - Live updates the table as you toggle (no Apply step)
   - Shows active filters as removable chips above the table
   - Esc to close, click-outside to dismiss
   - Result count in the popover footer reassures user the filter is working
   2026 conventions: popover + live filtering + inline removable chips.
*/
function dtFilterToggle(e) {
  if (e) e.stopPropagation();
  const pop = document.getElementById('dt-filter-pop');
  const open = pop.classList.contains('open');
  if (open) dtFilterClose();
  else dtFilterOpen();
}

function dtFilterOpen() {
  const pop = document.getElementById('dt-filter-pop');
  const btn = document.getElementById('dt-filter-btn');
  if (!pop) return;
  pop.classList.add('open');
  btn.setAttribute('aria-expanded', 'true');
  // Sync chip active states to current filterState
  document.querySelectorAll('.dt-flt-chip').forEach(chip => {
    const grp = chip.dataset.group;
    const val = chip.dataset.value;
    chip.classList.toggle('active', filterState[grp] && filterState[grp].has(val));
  });
  dtFilterUpdateFootCount();
  dtFilterUpdateResetState();
}

function dtFilterClose() {
  const pop = document.getElementById('dt-filter-pop');
  const btn = document.getElementById('dt-filter-btn');
  if (!pop) return;
  pop.classList.remove('open');
  btn.setAttribute('aria-expanded', 'false');
}

function dtFilterToggleChip(el) {
  const grp = el.dataset.group;
  const val = el.dataset.value;
  const set = filterState[grp];
  if (!set) return;
  if (set.has(val)) { set.delete(val); el.classList.remove('active'); }
  else              { set.add(val);    el.classList.add('active'); }
  // Live update: re-render the active page and the strip + count + foot
  dtFilterReapply();
}

function dtFilterReset() {
  Object.values(filterState).forEach(s => s.clear());
  document.querySelectorAll('.dt-flt-chip').forEach(c => c.classList.remove('active'));
  // Mobile chips share the same state — clear their active class too
  document.querySelectorAll('.flt-chip').forEach(c => c.classList.remove('active'));
  dtFilterReapply();
}

function dtFilterReapply() {
  // Re-render whichever page is active
  const tab = (typeof dtActiveTab !== 'undefined') ? dtActiveTab : 'wts';
  if (tab === 'overview')      dtRenderOverview();
  else if (tab === 'cc')       dtRenderCC();
  else                         dtRenderTable();
  // Mobile renderers also pick up the change next time they run; no need to call them here
  dtFilterUpdateBadge();
  dtFilterUpdateStrip();
  dtFilterUpdateFootCount();
  dtFilterUpdateResetState();
  // Mobile button count badge if present
  if (typeof filterUpdateCount === 'function') filterUpdateCount();
}

function dtFilterTotalCount() {
  return Object.values(filterState).reduce((n, s) => n + s.size, 0);
}

function dtFilterUpdateBadge() {
  const total = dtFilterTotalCount();
  const btn   = document.getElementById('dt-filter-btn');
  const badge = document.getElementById('dt-filter-count');
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

function dtFilterUpdateResetState() {
  const btn = document.getElementById('dt-filter-pop-reset');
  if (!btn) return;
  btn.disabled = dtFilterTotalCount() === 0;
}

const DT_FILTER_GROUP_LABELS = {
  ignition: 'Ignition',
  alerts:   'Alerts',
  plant:    'Plant',
  version:  'TCG Version',
};
const DT_FILTER_VALUE_LABELS = {
  errors:   'Has Errors',
  warnings: 'Has Warnings',
  clean:    'Clean',
};

function dtFilterUpdateStrip() {
  const strip = document.getElementById('dt-active-filters');
  if (!strip) return;
  const total = dtFilterTotalCount();
  if (total === 0) { strip.style.display = 'none'; strip.innerHTML = ''; return; }

  let html = '';
  Object.keys(filterState).forEach(grp => {
    const set = filterState[grp];
    if (!set || set.size === 0) return;
    const grpLabel = DT_FILTER_GROUP_LABELS[grp] || grp;
    set.forEach(val => {
      const valLabel = DT_FILTER_VALUE_LABELS[val] || val;
      const safeGrp = grp.split("'").join("\\'");
      const safeVal = String(val).split("'").join("\\'");
      html += `
        <span class="dt-active-filter-pill">
          <span class="dt-active-filter-pill-grp">${grpLabel}:</span>
          ${valLabel}
          <button class="dt-active-filter-pill-x"
                  aria-label="Remove ${grpLabel} ${valLabel} filter"
                  onclick="dtFilterRemove('${safeGrp}','${safeVal}')">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </button>
        </span>`;
    });
  });
  if (total > 1) {
    html += `<button class="dt-active-filter-clear" onclick="dtFilterReset()">Clear all</button>`;
  }
  strip.innerHTML = html;
  strip.style.display = 'flex';
}

function dtFilterRemove(grp, val) {
  if (!filterState[grp]) return;
  filterState[grp].delete(val);
  // Sync the chip in the popover too
  const chip = document.querySelector(`.dt-flt-chip[data-group="${grp}"][data-value="${val}"]`);
  if (chip) chip.classList.remove('active');
  dtFilterReapply();
}

function dtFilterUpdateFootCount() {
  const el = document.getElementById('dt-filter-pop-foot-count');
  if (!el) return;
  const total = dtFilterTotalCount();
  if (total === 0) { el.textContent = 'All trucks shown'; return; }
  // Count visible trucks under current filter + territory selection
  let count = 0;
  truckGroups.forEach(g => {
    if (typeof selectedAccounts !== 'undefined' && !selectedAccounts.has(g.account)) return;
    if (typeof selectedLocations !== 'undefined' && !selectedLocations.has(g.label)) return;
    g.trucks.forEach(t => {
      if (!t.unlinked && filterMatch(t)) count++;
    });
  });
  el.textContent = `${count} truck${count === 1 ? '' : 's'} match`;
}

// Click outside closes the popover
document.addEventListener('click', (e) => {
  const pop = document.getElementById('dt-filter-pop');
  const wrap = document.getElementById('dt-filter-wrap');
  if (!pop || !wrap) return;
  if (pop.classList.contains('open') && !wrap.contains(e.target)) {
    dtFilterClose();
  }
});

// Esc to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const pop = document.getElementById('dt-filter-pop');
    if (pop && pop.classList.contains('open')) dtFilterClose();
  }
});

// Initialize badge + strip on first run (filterState may already have values from mobile)
if (typeof window !== 'undefined') {
  requestAnimationFrame(() => {
    dtFilterUpdateBadge();
    dtFilterUpdateStrip();
    // Live count Unlinked Units from the shared UNITS_DATA so trucks header stays in sync with units page
    const unlinkedEl = document.getElementById('dt-stat-unlinked');
    if (unlinkedEl && typeof UNITS_DATA !== 'undefined') {
      unlinkedEl.textContent = UNITS_DATA.filter(u => u.status === 'Unlinked Unit').length;
    }
    // Units Active — units currently linked to a truck
    const activeEl = document.getElementById('dt-stat-commissioned');
    if (activeEl && typeof UNITS_DATA !== 'undefined') {
      activeEl.textContent = '250';
    }
    // Total Units — all units in the system for this account
    const totalEl = document.getElementById('dt-stat-total');
    if (totalEl && typeof UNITS_DATA !== 'undefined') {
      totalEl.textContent = UNITS_DATA.length;
    }
  });
}

/* ════════════════════════════════════════════════════════════
   DESKTOP UNITS PAGE
   Renders per Figma 600:37658, but with the mobile pill treatment
   for status (statusPill helper). Sidenav switches between Trucks
   and Units pages by toggling display on the page wrappers.
═══════════════════════════════════════════════════════════ */

let dtUnitsActivePage = 'home';
let dtUnitsSearchQuery = '';

/* ============================================================================
   HOME DASHBOARD
============================================================================ */

