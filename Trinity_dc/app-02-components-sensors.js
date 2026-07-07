/* app-02-components-sensors.js — Component cards (co), sensors (sen), search (srch). Loads 2nd.
   Part of the app.js split. All six app-*.js files share one global
   scope and MUST load in numeric order (see index.html). */
const mcCommandLog = [];

function formatMcTime() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit', hour12:true});
}

function logCommand(title, value, result) {
  mcCommandLog.unshift({ title, value, result, time: formatMcTime() });
  mcRenderTable();
}

function mcRenderTable() {
  const body    = document.getElementById('mc-table-body');
  const empty   = document.getElementById('mc-table-empty');
  const updated = document.getElementById('mc-table-updated');
  if (!body) return;

  if (mcCommandLog.length === 0) {
    if (empty) empty.style.display = '';
    if (updated) updated.textContent = 'No commands yet';
    const count = document.getElementById('mc-table-count');
    if (count) count.style.display = 'none';
    return;
  }

  if (empty) empty.style.display = 'none';
  if (updated) updated.textContent = `Last updated ${mcCommandLog[0].time}`;
  const count = document.getElementById('mc-table-count');
  if (count) { count.style.display = ''; count.textContent = `${mcCommandLog.length} record${mcCommandLog.length !== 1 ? 's' : ''}`; }

  /* Remove old rows (keep empty placeholder) */
  Array.from(body.children).forEach(c => { if (c.id !== 'mc-table-empty') c.remove(); });

  mcCommandLog.forEach(entry => {
    const row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;padding:8px 16px;border-bottom:1px solid rgba(54,50,45,0.08);animation:mc-row-in 0.25s cubic-bezier(0.22,1,0.36,1) both;align-items:center;';
    row.innerHTML = `
      <span style="font-size:12px;font-weight:500;color:#1a1814;letter-spacing:-0.2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:6px;">${entry.title}</span>
      <span style="font-size:12px;color:rgba(40,36,30,0.5);letter-spacing:-0.2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:6px;">${entry.value}</span>
      <span style="font-size:11px;color:rgba(40,36,30,0.5);letter-spacing:-0.1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${entry.result}</span>`;
    body.appendChild(row);
  });
}

function mcClearTable() {
  mcCommandLog.length = 0;
  const body = document.getElementById('mc-table-body');
  if (body) Array.from(body.children).forEach(c => { if (c.id !== 'mc-table-empty') c.remove(); });
  mcRenderTable();
}

/* ── Initialize all manual control cards ── */
let mcCardsInitialized = false;
function initMcCards() {
  if (mcCardsInitialized) return;
  mcCardsInitialized = true;
  MC_CARD_DEFS.forEach(def => {
    const mountEl = document.getElementById(`mc-unit-${def.id}`);
    if (!mountEl) return;
    const isInput = def.hasInput;
    const cardWrap = document.createElement('div');
    cardWrap.innerHTML = `<div class="mc-card ${isInput ? 'mc-input-card' : ''}"><div class="progress-track"><div class="progress-fill"></div></div></div>`;
    mountEl.appendChild(cardWrap);
    const inst = new CardInstance(def, cardWrap);
    /* Flip-grow cards — wire tap and hint icon */
    const flipMap = {
      canerrors: { fn: canFlipOpen,     store: '_canCardInst' },
      sensors:   { fn: sensorsFlipOpen, store: null },
    };
    const flipCfg = flipMap[def.id];
    if (flipCfg) {
      if (flipCfg.store) window[flipCfg.store] = inst;
      const card = cardWrap.querySelector('.mc-card');
      if (card) card.addEventListener('click', function(e) {
        if (e.target.closest('button')) return;
        flipCfg.fn();
      });
      canInjectFlipHint(mountEl, flipCfg.fn);
    }
  });
}

function toggleWtsDropdown() {
  const dd = document.getElementById('wts-dropdown');
  const chevron = document.getElementById('wts-chevron');
  const isOpen = dd.style.display === 'none';
  dd.style.display = isOpen ? 'block' : 'none';
  chevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
}


function selectWts(label, el) {
  document.getElementById('wts-label').textContent = label;
  document.querySelectorAll('.wts-option').forEach(o => {
    o.classList.remove('wts-active');
    o.querySelector('.wts-check').style.visibility = 'hidden';
  });
  el.classList.add('wts-active');
  el.querySelector('.wts-check').style.visibility = 'visible';
  document.getElementById('wts-dropdown').style.display = 'none';
  document.getElementById('wts-chevron').style.transform = 'rotate(0deg)';

  document.getElementById('page-where-to-start').style.display      = label === 'Where to start'       ? 'block' : 'none';
  document.getElementById('page-overview').style.display             = label === 'Overview'              ? 'block' : 'none';
  document.getElementById('page-components-condition').style.display = label === 'Components Condition'  ? 'block' : 'none';

  /* Render conditions rows when that page is selected */
  if (label === 'Components Condition') setTimeout(renderConditions, 0);
}

document.addEventListener('click', function(e) {
  const btn = document.getElementById('wts-btn');
  const dd  = document.getElementById('wts-dropdown');
  if (btn && dd && !btn.contains(e.target) && !dd.contains(e.target)) {
    dd.style.display = 'none';
    const ch = document.getElementById('wts-chevron');
    if (ch) ch.style.transform = 'rotate(0deg)';
  }
  // Tablet dropdown
  const tbBtn = document.getElementById('tb-wts-btn');
  const tbDd  = document.getElementById('tb-wts-dropdown');
  if (tbBtn && tbDd && !tbBtn.contains(e.target) && !tbDd.contains(e.target)) {
    tbDd.style.display = 'none';
    const tbCh = document.getElementById('tb-wts-chevron');
    if (tbCh) tbCh.style.transform = 'rotate(0deg)';
  }
});

/* ══════════════════════════════════════════════════
   TERRITORY SELECTOR
═══════════════════════════════════════════════════ */

function tsUpdateLabels() {
  /* Account label */
  const acctEl = document.getElementById('ts-account-label');
  if (acctEl) {
    const all = ALL_ACCOUNTS;
    if (selectedAccounts.size === all.length) {
      acctEl.textContent = all[0] + ', +' + (all.length - 1);
    } else if (selectedAccounts.size === 1) {
      acctEl.textContent = [...selectedAccounts][0];
    } else {
      acctEl.textContent = [...selectedAccounts][0] + ', +' + (selectedAccounts.size - 1);
    }
  }
  /* Location label */
  const locEl = document.getElementById('ts-location-label');
  if (locEl) {
    const allLocs = Object.values(ACCOUNT_PLANTS).flat();
    const visibleLocs = allLocs.filter(p => {
      const acct = Object.entries(ACCOUNT_PLANTS).find(([a, plants]) => plants.includes(p));
      return acct && selectedAccounts.has(acct[0]);
    });
    if (selectedLocations.size >= visibleLocs.length) {
      locEl.textContent = 'All locations';
    } else if (selectedLocations.size === 1) {
      locEl.textContent = [...selectedLocations][0];
    } else {
      locEl.textContent = [...selectedLocations][0] + ', +' + (selectedLocations.size - 1);
    }
  }
}

function tsRenderAccountOptions() {
  const el = document.getElementById('ts-account-options');
  if (!el) return;
  el.innerHTML = ALL_ACCOUNTS.map(a => {
    const checked = selectedAccounts.has(a);
    return `
      <div onclick="tsToggleAccount('${a}')" style="display:flex;align-items:center;gap:10px;padding:10px 8px;border-radius:8px;cursor:pointer;-webkit-tap-highlight-color:transparent;" onmouseenter="this.style.background='var(--layer-2)'" onmouseleave="this.style.background=''">
        <div style="width:16px;height:16px;border-radius:4px;border:1.5px solid ${checked ? 'var(--blue)' : 'var(--border-mid)'};background:${checked ? 'var(--blue)' : 'none'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          ${checked ? `<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}
        </div>
        <span style="font-size:14px;color:var(--strong);letter-spacing:-0.28px;">${a}</span>
      </div>`;
  }).join('');
}

function tsRenderLocationOptions() {
  const el = document.getElementById('ts-location-options');
  if (!el) return;
  let html = '';
  ALL_ACCOUNTS.forEach(acct => {
    if (!selectedAccounts.has(acct)) return;
    const plants = ACCOUNT_PLANTS[acct];
    html += `<div style="font-size:11px;font-weight:600;color:var(--soft);letter-spacing:0.4px;text-transform:uppercase;padding:8px 8px 4px;">${acct}</div>`;
    plants.forEach(p => {
      const checked = selectedLocations.has(p);
      html += `
        <div onclick="tsToggleLocation('${p}')" style="display:flex;align-items:center;gap:10px;padding:8px 8px;border-radius:8px;cursor:pointer;-webkit-tap-highlight-color:transparent;" onmouseenter="this.style.background='var(--layer-2)'" onmouseleave="this.style.background=''">
          <div style="width:16px;height:16px;border-radius:4px;border:1.5px solid ${checked ? 'var(--blue)' : 'var(--border-mid)'};background:${checked ? 'var(--blue)' : 'none'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${checked ? `<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}
          </div>
          <span style="font-size:14px;color:var(--strong);letter-spacing:-0.28px;">${p}</span>
        </div>`;
    });
  });
  el.innerHTML = html;
}

function tsToggle(which) {
  const accDD   = document.getElementById('ts-account-dd');
  const locDD   = document.getElementById('ts-location-dd');
  const accChev = document.getElementById('ts-account-chev');
  const locChev = document.getElementById('ts-location-chev');
  if (which === 'account') {
    const opening = !accDD.classList.contains('open');
    accDD.classList.toggle('open', opening);
    locDD.classList.remove('open');
    accChev.style.transform = opening ? 'rotate(180deg)' : '';
    locChev.style.transform = '';
    if (opening) tsRenderAccountOptions();
  } else {
    const opening = !locDD.classList.contains('open');
    locDD.classList.toggle('open', opening);
    accDD.classList.remove('open');
    locChev.style.transform = opening ? 'rotate(180deg)' : '';
    accChev.style.transform = '';
    if (opening) tsRenderLocationOptions();
  }
}

function tsToggleAccount(acct) {
  if (selectedAccounts.has(acct)) {
    if (selectedAccounts.size === 1) return; /* keep at least one */
    selectedAccounts.delete(acct);
    /* remove locations belonging to this account */
    (ACCOUNT_PLANTS[acct] || []).forEach(p => selectedLocations.delete(p));
  } else {
    selectedAccounts.add(acct);
    /* auto-select all locations for newly added account */
    (ACCOUNT_PLANTS[acct] || []).forEach(p => selectedLocations.add(p));
  }
  tsRenderAccountOptions();
  tsRenderLocationOptions();
  tsUpdateLabels();
  renderTrucks();
}

function tsToggleLocation(plant) {
  if (selectedLocations.has(plant)) {
    if (selectedLocations.size === 1) return; /* keep at least one */
    selectedLocations.delete(plant);
  } else {
    selectedLocations.add(plant);
  }
  tsRenderLocationOptions();
  tsUpdateLabels();
  renderTrucks();
  /* also update tablet if visible */
  tbTsUpdateLabels();
  tbTsRenderAccountOptions();
  tbTsRenderLocationOptions();
  tbRenderTable();
}

/* ── TABLET TERRITORY SELECTOR ─────────────────────────
   Shares selectedAccounts / selectedLocations with mobile.
   Calls tbRenderTable() instead of renderTrucks().        */

function tbTsUpdateLabels() {
  var all = ALL_ACCOUNTS;
  var acctEl = document.getElementById('tb-ts-account-label');
  if (acctEl) {
    if (selectedAccounts.size === all.length) {
      acctEl.textContent = all[0] + ', +' + (all.length - 1);
    } else if (selectedAccounts.size === 1) {
      acctEl.textContent = [...selectedAccounts][0];
    } else {
      acctEl.textContent = [...selectedAccounts][0] + ', +' + (selectedAccounts.size - 1);
    }
  }
  var locEl = document.getElementById('tb-ts-location-label');
  if (locEl) {
    var allLocs = Object.values(ACCOUNT_PLANTS).flat();
    var visibleLocs = allLocs.filter(function(p) {
      var acct = Object.entries(ACCOUNT_PLANTS).find(function(e) { return e[1].includes(p); });
      return acct && selectedAccounts.has(acct[0]);
    });
    if (selectedLocations.size >= visibleLocs.length) {
      locEl.textContent = 'All locations';
    } else if (selectedLocations.size === 1) {
      locEl.textContent = [...selectedLocations][0];
    } else {
      locEl.textContent = [...selectedLocations][0] + ', +' + (selectedLocations.size - 1);
    }
  }
}

function tbTsCheckbox(checked) {
  return '<div style="width:16px;height:16px;border-radius:4px;border:1.5px solid ' + (checked ? 'var(--blue)' : 'var(--border-mid)') + ';background:' + (checked ? 'var(--blue)' : 'none') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + (checked ? '<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') + '</div>';
}

function tbTsMakeRow(label, clickFn, checked) {
  var div = document.createElement('div');
  div.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 8px;border-radius:8px;cursor:pointer;';
  div.addEventListener('mouseenter', function() { this.style.background = 'var(--layer-2)'; });
  div.addEventListener('mouseleave', function() { this.style.background = ''; });
  div.addEventListener('click', function() { clickFn(label); });
  div.innerHTML = tbTsCheckbox(checked) + '<span style="font-size:14px;color:var(--strong);letter-spacing:-0.28px;">' + label + '</span>';
  return div;
}

function tbTsRenderAccountOptions() {
  var el = document.getElementById('tb-ts-account-options');
  if (!el) return;
  el.innerHTML = '';
  ALL_ACCOUNTS.forEach(function(a) {
    el.appendChild(tbTsMakeRow(a, tbTsToggleAccount, selectedAccounts.has(a)));
  });
}

function tbTsRenderLocationOptions() {
  var el = document.getElementById('tb-ts-location-options');
  if (!el) return;
  el.innerHTML = '';
  ALL_ACCOUNTS.forEach(function(acct) {
    if (!selectedAccounts.has(acct)) return;
    var hdr = document.createElement('div');
    hdr.style.cssText = 'font-size:11px;font-weight:600;color:var(--soft);letter-spacing:0.4px;text-transform:uppercase;padding:8px 8px 4px;';
    hdr.textContent = acct;
    el.appendChild(hdr);
    (ACCOUNT_PLANTS[acct] || []).forEach(function(p) {
      var row = tbTsMakeRow(p, tbTsToggleLocation, selectedLocations.has(p));
      row.style.padding = '8px 8px';
      el.appendChild(row);
    });
  });
}


function tbTsToggleAccount(acct) {
  if (selectedAccounts.has(acct)) {
    if (selectedAccounts.size === 1) return;
    selectedAccounts.delete(acct);
    (ACCOUNT_PLANTS[acct] || []).forEach(function(p) { selectedLocations.delete(p); });
  } else {
    selectedAccounts.add(acct);
    (ACCOUNT_PLANTS[acct] || []).forEach(function(p) { selectedLocations.add(p); });
  }
  tbTsRenderAccountOptions();
  tbTsRenderLocationOptions();
  tbTsUpdateLabels();
  tsUpdateLabels();
  tbRenderTable();
}

function tbTsToggleLocation(plant) {
  if (selectedLocations.has(plant)) {
    if (selectedLocations.size === 1) return;
    selectedLocations.delete(plant);
  } else {
    selectedLocations.add(plant);
  }
  tbTsRenderLocationOptions();
  tbTsUpdateLabels();
  tsUpdateLabels();
  tbRenderTable();
}

/* Close territory dropdowns on outside click */
document.addEventListener('click', function(e) {
  const accBtn = document.getElementById('ts-account-btn');
  const locBtn = document.getElementById('ts-location-btn');
  const accDD  = document.getElementById('ts-account-dd');
  const locDD  = document.getElementById('ts-location-dd');
  if (accBtn && accDD && !accBtn.contains(e.target) && !accDD.contains(e.target)) {
    accDD.classList.remove('open');
    const ch = document.getElementById('ts-account-chev');
    if (ch) ch.style.transform = '';
  }
  // Close mode popovers on outside click
  var dtModePop = document.getElementById('dt-mode-popover');
  var dtIgnBadge = document.getElementById('dt-drawer-ign-badge');
  if (dtModePop && dtIgnBadge && !dtIgnBadge.contains(e.target)) {
    dtModePop.style.display = 'none';
  }
  var moModePop = document.getElementById('mo-mode-popover');
  var moIgnPill = document.getElementById('mo-ign-pill');
  if (moModePop && moIgnPill && !moIgnPill.contains(e.target)) {
    moModePop.style.display = 'none';
  }
  var tbAccBtn = document.getElementById('tb-ts-account-btn');
  var tbLocBtn = document.getElementById('tb-ts-location-btn');
  var tbAccDD  = document.getElementById('tb-ts-account-dd');
  var tbLocDD  = document.getElementById('tb-ts-location-dd');
  if (tbAccBtn && tbAccDD && !tbAccBtn.contains(e.target) && !tbAccDD.contains(e.target)) {
    tbAccDD.classList.remove('open');
    var tac = document.getElementById('tb-ts-account-chev');
    if (tac) tac.style.transform = '';
  }
  if (tbLocBtn && tbLocDD && !tbLocBtn.contains(e.target) && !tbLocDD.contains(e.target)) {
    tbLocDD.classList.remove('open');
    var tlc = document.getElementById('tb-ts-location-chev');
    if (tlc) tlc.style.transform = '';
  }
  // Tablet search dropdown
  var tbSrchInput = document.getElementById('tb-search-input');
  var tbSrchDrop  = document.getElementById('tb-srch-drop');
  if (tbSrchInput && tbSrchDrop && !tbSrchInput.contains(e.target) && !tbSrchDrop.contains(e.target)) {
    tbSrchDrop.style.display = 'none';
  }
  // Tablet columns popover
  var tbColsBtn = document.getElementById('tb-cols-btn');
  var tbColsPop = document.getElementById('tb-cols-popover');
  if (tbColsBtn && tbColsPop && !tbColsBtn.contains(e.target) && !tbColsPop.contains(e.target)) {
    tbColsPop.classList.remove('open');
  }
});

/* ══════════════════════════════════════════════════
   ACCOUNT SWITCH CONFIRMATION
═══════════════════════════════════════════════════ */

function showAccountSwitchConfirm(targetAccount, truckIdx, source) {
  const existing = document.getElementById('acct-switch-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.id = 'acct-switch-overlay';
  overlay.innerHTML = `
    <div class="confirm-sheet">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:44px;height:44px;border-radius:50%;background:rgba(255,186,13,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2C5.6 2 2 5.6 2 10s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12.5c-.4 0-.75-.35-.75-.75s.35-.75.75-.75.75.35.75.75-.35.75-.75.75zm.75-4h-1.5V5.5h1.5V10.5z" fill="#b07800"/>
          </svg>
        </div>
        <div>
          <div class="confirm-title" style="margin-bottom:2px;">Switch to ${targetAccount}?</div>
          <div style="font-size:12px;color:var(--soft);letter-spacing:-0.2px;">You're currently in <strong style="color:var(--strong);">${activeAccount}</strong></div>
        </div>
      </div>
      <div class="confirm-body">
        This truck belongs to <strong>${targetAccount}</strong>. Switching will update your active account across the app. You can switch back anytime from the territory selector.
      </div>
      <div class="confirm-btns">
        <button class="confirm-btn-primary" onclick="doAccountSwitch('${targetAccount}', ${truckIdx}, '${source}')">Switch to ${targetAccount}</button>
        <button class="confirm-btn-cancel" onclick="document.getElementById('acct-switch-overlay').remove()">Stay in ${activeAccount}</button>
      </div>
    </div>
  `;
  document.getElementById('s-main').appendChild(overlay);
}

function doAccountSwitch(targetAccount, truckIdx, source) {
  const overlay = document.getElementById('acct-switch-overlay');
  if (overlay) overlay.remove();

  setActiveAccount(targetAccount);

  /* Open the truck drawer */
  openDrawerFromList(source, truckIdx);
}

/* ══════════════════════════════════════════════════
   MASTER ACCOUNT PICKER (desktop sidebar)
   ──────────────────────────────────────────────────
   Single-select. Sets the data scope for the whole session.
   Mobile shows the same value at the top of the main nav (read-
   only today, the cross-account confirmation modal is the picker
   on mobile). Desktop has a real picker dropdown.
═══════════════════════════════════════════════════ */

/* Single source of truth for changing the master account.
   Updates the global, all reflective UI surfaces, and re-renders. */
function setActiveAccount(acct) {
  if (!acct) return;
  activeAccount = acct;
  /* Mobile side-nav label */
  const mobileEl = document.querySelector('.sn-account-val');
  if (mobileEl) mobileEl.textContent = acct;
  /* Desktop sidebar picker label */
  const dtEl = document.getElementById('dt-acct-current');
  if (dtEl) dtEl.textContent = acct;
  /* Re-render everything that's account-scoped */
  if (typeof renderTrucks === 'function') renderTrucks();
  if (typeof dtRefreshTable === 'function' && typeof dtActiveTab !== 'undefined') {
    dtRefreshTable(dtActiveTab);
  }
  /* Re-render picker dropdown if open so the active checkmark moves */
  if (document.getElementById('dt-acct-dd')?.style.display === 'block') {
    dtAcctRenderOptions();
  }
}

function dtAcctToggle() {
  const picker = document.getElementById('dt-acct-picker');
  const dd = document.getElementById('dt-acct-dd');
  if (!dd) return;
  const isOpen = dd.style.display === 'block';
  if (isOpen) {
    dd.style.display = 'none';
    picker?.classList.remove('open');
  } else {
    dtAcctRenderOptions();
    dd.style.display = 'block';
    picker?.classList.add('open');
  }
}

/* Close picker when clicking outside */
document.addEventListener('click', function(e) {
  const picker = document.getElementById('dt-acct-picker');
  if (!picker) return;
  if (picker.contains(e.target)) return;
  const dd = document.getElementById('dt-acct-dd');
  if (dd && dd.style.display === 'block') {
    dd.style.display = 'none';
    picker.classList.remove('open');
  }
});

function dtAcctRenderOptions() {
  const opts = document.getElementById('dt-acct-options');
  if (!opts) return;
  /* Pull the canonical account list from ACCOUNT_PLANTS */
  const accounts = (typeof ACCOUNT_PLANTS !== 'undefined') ? Object.keys(ACCOUNT_PLANTS) : ['Cemex AZ'];
  opts.innerHTML = accounts.map(acct => {
    const isActive = acct === activeAccount;
    const check = isActive
      ? '<svg class="dt-acct-opt-check" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3 3 7-7" stroke="#3069e3" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<span class="dt-acct-opt-check"></span>';
    return `
      <div class="dt-acct-opt ${isActive ? 'active' : ''}" onclick="dtAcctSelect('${acct}')">
        ${check}
        <span class="dt-acct-opt-label">${acct}</span>
      </div>`;
  }).join('');
}

function dtAcctSelect(acct) {
  /* Close dropdown */
  const dd = document.getElementById('dt-acct-dd');
  const picker = document.getElementById('dt-acct-picker');
  if (dd) dd.style.display = 'none';
  if (picker) picker.classList.remove('open');
  /* Apply */
  if (acct === activeAccount) return;
  setActiveAccount(acct);
}

/* Desktop wrapper for opening a truck — checks cross-account first.
   Used by Where to Start, where the table can show trucks across all the
   FST's accounts. Overview and Components Condition are scoped to the
   active account so they never need this check. */
function dtOpenTruckChecked(truckNum) {
  const t = (typeof trucks !== 'undefined') ? trucks.find(tr => String(tr.num) === String(truckNum)) : null;
  if (!t) { dtOpenTruck(truckNum); return; }
  if (t.account && t.account !== activeAccount) {
    dtShowAccountSwitchConfirm(t.account, truckNum);
    return;
  }
  dtOpenTruck(truckNum);
}

/* Desktop cross-account confirmation modal — mirrors the mobile one but
   appends to the desktop content area and routes to dtOpenTruck after switch. */
function dtShowAccountSwitchConfirm(targetAccount, truckNum) {
  const existing = document.getElementById('dt-acct-switch-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.id = 'dt-acct-switch-overlay';
  overlay.innerHTML = `
    <div class="confirm-sheet">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:44px;height:44px;border-radius:50%;background:rgba(255,186,13,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2C5.6 2 2 5.6 2 10s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12.5c-.4 0-.75-.35-.75-.75s.35-.75.75-.75.75.35.75.75-.35.75-.75.75zm.75-4h-1.5V5.5h1.5V10.5z" fill="#b07800"/>
          </svg>
        </div>
        <div>
          <div class="confirm-title" style="margin-bottom:2px;">Switch to ${targetAccount}?</div>
          <div style="font-size:12px;color:var(--soft);letter-spacing:-0.2px;">You're currently in <strong style="color:var(--strong);">${activeAccount}</strong></div>
        </div>
      </div>
      <div class="confirm-body">
        This truck belongs to <strong>${targetAccount}</strong>. Switching will update your active account across the app. You can switch back anytime from the account picker in the sidebar.
      </div>
      <div class="confirm-btns">
        <button class="confirm-btn-primary" onclick="dtDoAccountSwitch('${targetAccount}', '${truckNum}')">Switch to ${targetAccount}</button>
        <button class="confirm-btn-cancel" onclick="document.getElementById('dt-acct-switch-overlay').remove()">Stay in ${activeAccount}</button>
      </div>
    </div>
  `;
  /* Append to dt-content so it overlays the desktop work area */
  const host = document.querySelector('.dt-content') || document.body;
  host.appendChild(overlay);
}

function dtDoAccountSwitch(targetAccount, truckNum) {
  const overlay = document.getElementById('dt-acct-switch-overlay');
  if (overlay) overlay.remove();
  setActiveAccount(targetAccount);
  dtOpenTruck(truckNum);
}

/* ─── SENSOR PAGE ───────────────────────────────────── */
const SEN_CONFIGS = {
  slump: {
    title:'Slump', unit:'in', color:'#1594ef',
    type:'line', min:0, max:12,
    seed:[5.25,5.30,5.22,5.35,5.28,5.40,5.25,5.18,5.30,5.45,5.38,5.25,5.20,5.32,5.28],
    liveKey:'sv-slump', liveUnit:' in', liveDecimals:2,
    liveBase:5.25, liveRange:0.3,
    target: 5.0,            /* target/spec value — shown as dashed line */
    targetTolerance: 0.5,   /* ± tolerance band */
    phases: ['LP','AS','BP'],
    phaseIdxs: [4, 15, 26],  /* which point index each phase starts at (out of 40) */
    /* Time labels for X-axis — 5 evenly spaced */
    timeLabels: ['01:25','01:30','01:40','02:10','02:15']
  },
  water: {
    title:'Water Addition', unit:'gal/yd³', color:'#3069e3',
    type:'line', min:0, max:2,
    /* Seed is monotonically increasing — water only goes up */
    seed:[0.00,0.02,0.05,0.08,0.10,0.13,0.16,0.20,0.23,0.27,0.30,0.33,0.36,0.38,0.40,
          0.42,0.43,0.45,0.47,0.48,0.50,0.52,0.53,0.55,0.56,0.57,0.58,0.59,0.60,0.61],
    liveKey:'sv-water', liveUnit:' gal', liveDecimals:2,
    liveBase:0.5, liveRange:0.02,
    allowable: 0.75,       /* max allowable water — dashed ceiling line */
    phases: ['LP','AS','BP'],
    phaseIdxs: [4, 15, 26],
    timeLabels: ['01:25','01:30','01:40','02:10','02:15'],
    stepped: true,
    cumulative: true       /* never decreases — only monotonically increases */
  },
  pressure: {
    title:'Pressure', unit:'PSI', color:'#ffba0d',
    type:'line', min:0, max:60,
    seed:[32,33,31,34,32,35,31,33,36,32,30,34,33,32,31,32,34,31,35,33,32,31,34,32,33,35,32,30,33,32],
    liveKey:'sv-pressure', liveUnit:' PSI', liveDecimals:0,
    liveBase:32, liveRange:4,
    minPressure: 20,   /* lower dashed limit */
    maxPressure: 45,   /* upper dashed limit */
    phases: ['LP','AS','BP'],
    phaseIdxs: [4, 15, 26],
    timeLabels: ['01:25','01:30','01:40','02:10','02:15'],
    ySteps: [0, 15, 30, 45, 60],
    tooltipLabel: 'Pressure'
  },
  drum: {
    title:'Drum Speed', unit:'RPM', color:'#7ab8f5',
    type:'line', min:0, max:20,
    seed:[18,13,10,5,18,17,5,5,12,5,12,12,12,13,16,13,12,16,14,12,17,5,5,18,5,5,5,5,5,5],
    liveKey:'sv-drum', liveUnit:' RPM', liveDecimals:0,
    liveBase:10, liveRange:8,
    phases: ['LP','AS','BP'],
    phaseIdxs: [4, 15, 26],
    timeLabels: ['01:25','01:30','01:40','02:10','02:15'],
    ySteps: [0, 5, 10, 15, 20],
    tooltipLabel: 'Speed'
  },
  cell: {
    title:'Cell Coverage', unit:'%', color:'#2ecf1d',
    type:'line', min:0, max:100,
    seed:[95,95,92,96,95,94,95,96,93,95,96,94,95,92,96,95,94,96,95,93,95,96,95,94,95,96,93,95,94,96],
    liveKey:'sv-cell', liveUnit:'%', liveDecimals:0,
    liveBase:95, liveRange:4,
    threshold: 60,    /* dashed minimum — below this signal is weak */
    phases: ['LP','AS','BP'],
    phaseIdxs: [4, 15, 26],
    timeLabels: ['01:25','01:30','01:40','02:10','02:15'],
    ySteps: [0, 25, 50, 75, 100],
    tooltipLabel: 'Signal'
  },
  sat: {
    title:'Satellite Count', unit:'', color:'#1594ef',
    type:'line', min:0, max:14,
    seed:[8,8,9,8,9,10,9,8,9,10,9,8,9,8,9,8,10,9,8,9,8,9,10,9,8,8,9,8,9,9],
    liveKey:'sv-sat', liveUnit:' sats', liveDecimals:0,
    liveBase:8, liveRange:2,
    threshold: 4,
    phases: ['LP','AS','BP'],
    phaseIdxs: [4, 15, 26],
    timeLabels: ['01:25','01:30','01:40','02:10','02:15'],
    ySteps: [0, 4, 8, 12, 14],
    tooltipLabel: 'Satellites'
  },
  temp: {
    title:'Temperature', unit:'°F', color:'#d70100',
    type:'line', min:40, max:120,
    seed:[78,79,80,80,81,82,83,83,84,85,86,86,87,88,88,89,90,91,91,92,93,94,94,95,96,97,97,98,99,100],
    liveKey:'sv-temp', liveUnit:'°F', liveDecimals:0,
    liveBase:91, liveRange:3,
    phases: ['LP','AS','BP'],
    phaseIdxs: [4, 15, 26],
    timeLabels: ['01:25','01:30','01:40','02:10','02:15'],
    ySteps: [40, 60, 80, 100, 120],
    tooltipLabel: 'Temp'
  },
  admix: {
    title:'Admix Addition', unit:'oz', color:'#7c3aed',
    type:'line', min:0, max:200,
    seed:[0,5,10,18,25,35,48,62,75,88,100,112,122,132,140,148,155,161,166,170,174,177,179,181,183,184,185,186,187,188],
    liveKey:'sv-admix', liveUnit:' oz', liveDecimals:1,
    liveBase:130, liveRange:5,
    phases: ['LP','AS','BP'],
    phaseIdxs: [4, 15, 26],
    timeLabels: ['01:25','01:30','01:40','02:10','02:15'],
    ySteps: [0, 50, 100, 150, 200],
    tooltipLabel: 'Admix'
  },
  revs: {
    title:'Total Revolutions', unit:'rev', color:'#059669',
    type:'line', min:0, max:250,
    seed:[0,10,22,36,52,70,90,112,130,148,163,176,187,196,204,210,215,219,222,224,226,227,228,229,230,231,231,232,232,233],
    liveKey:'sv-revs', liveUnit:' rev', liveDecimals:0,
    liveBase:200, liveRange:5,
    phases: ['LP','AS','BP'],
    phaseIdxs: [4, 15, 26],
    timeLabels: ['01:25','01:30','01:40','02:10','02:15'],
    ySteps: [0, 50, 100, 150, 200, 250],
    tooltipLabel: 'Revolutions'
  }
};

/* Which sensors are selected */

/* Ring buffer per sensor — pre-filled with seed data */
const senData = {};
const SEN_POINTS = 40;
Object.entries(SEN_CONFIGS).forEach(([k, cfg]) => {
  if (cfg.type !== 'line') return;
  const buf = [];
  if (cfg.cumulative) {
    /* Water: seed already monotonic, extend to SEN_POINTS by holding last value */
    for (let i = 0; i < SEN_POINTS; i++) {
      const seedVal = cfg.seed[Math.min(i, cfg.seed.length - 1)];
      buf.push(seedVal);
    }
  } else {
    for (let i = 0; i < SEN_POINTS; i++) {
      buf.push(cfg.seed[i % cfg.seed.length] + (Math.random()-0.5)*cfg.liveRange*0.4);
    }
  }
  senData[k] = buf;
});

/* Canvas refs */
let senCanvases = {};
let senAnimId = null;

function senToggle(el) {
  const key = el.dataset.sensor;
  if (senSelected.has(key)) {
    if (senSelected.size <= 1) return; // keep at least 1
    senSelected.delete(key);
    el.classList.remove('active');
  } else {
    senSelected.add(key);
    el.classList.add('active');
  }
  senRenderCards();
}

function senRenderCards() {
  const container = document.getElementById('sen-charts');
  container.innerHTML = '';
  senCanvases = {};

  /* Helper: generic line chart card HTML */
  function lineCard(key, cfg, wrapId, h) {
    return `<div class="sen-card-hdr">
          <div class="sen-card-left">
            <div class="sen-card-title">${cfg.title}</div>
            <div>
              <span class="sen-card-bigval" id="sc-val-${key}">${cfg.liveBase.toFixed(cfg.liveDecimals)}</span>
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
    card.id = 'sen-card-' + key;
    card.innerHTML = lineCard(key, cfg, key + '-svg-wrap', 130);
    container.appendChild(card);
  });

  /* Slump needs target pill in header */
  const slumpCard = document.getElementById('sen-card-slump');
  if (slumpCard) {
    const cfg = SEN_CONFIGS.slump;
    const hdr = slumpCard.querySelector('.sen-card-hdr .sen-card-left div:last-child');
    if (hdr) {
      hdr.insertAdjacentHTML('afterend', `<div style="display:flex;align-items:center;gap:4px;padding:2px 8px;background:rgba(21,148,239,0.08);border-radius:20px;margin-top:2px;">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="1" y1="5" x2="9" y2="5" stroke="#1594ef" stroke-width="1.5" stroke-dasharray="2.5,2"/></svg>
        <span style="font-size:11px;color:rgba(54,50,45,0.6);letter-spacing:-0.22px;">Target</span>
        <span style="font-size:11px;font-weight:600;color:#1594ef;letter-spacing:-0.22px;font-family:'DM Mono',monospace;">${cfg.target.toFixed(1)} ${cfg.unit}</span>
      </div>`);
    }
  }

  /* Init all SVG charts */
  requestAnimationFrame(() => {
    if (senSelected.has('slump'))    senDrawSlumpSVG('slump-svg-wrap', false);
    if (senSelected.has('water'))    senDrawWaterSVG('water-svg-wrap', false);
    if (senSelected.has('drum'))     senDrawDrumSVG('drum-svg-wrap', false);
    if (senSelected.has('pressure')) senDrawLineSVG('pressure-svg-wrap', false, 'pressure');
    if (senSelected.has('cell'))     senDrawLineSVG('cell-svg-wrap', false, 'cell');
    if (senSelected.has('sat'))      senDrawLineSVG('sat-svg-wrap', false, 'sat');
  });
}

function senDrawChart(canvasKey, dataKey) {
  if (dataKey === undefined) dataKey = canvasKey; /* backwards compat */
  const canvas = senCanvases[canvasKey];
  if (!canvas) return;
  const cfg = SEN_CONFIGS[dataKey];
  const buf = senData[dataKey];
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight || 80;
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  /* Grid lines */
  const cc = senChartColors();
  ctx.strokeStyle = cc.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = Math.round(h * i / 3) + 0.5;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  /* Gradient fill */
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, cfg.color + '30');
  grad.addColorStop(1, cfg.color + '00');

  const range = cfg.max - cfg.min;
  const xStep = w / (SEN_POINTS - 1);

  const toY = v => h - ((v - cfg.min) / range) * h * 0.85 - h * 0.05;

  /* Fill */
  ctx.beginPath();
  ctx.moveTo(0, h);
  buf.forEach((v, i) => {
    const x = i * xStep;
    const y = toY(v);
    i === 0 ? ctx.lineTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo((SEN_POINTS - 1) * xStep, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  /* Line — smooth with bezier */
  ctx.beginPath();
  buf.forEach((v, i) => {
    const x = i * xStep;
    const y = toY(v);
    if (i === 0) { ctx.moveTo(x, y); return; }
    const px = (i - 1) * xStep;
    const py = toY(buf[i - 1]);
    const cpx = (px + x) / 2;
    ctx.bezierCurveTo(cpx, py, cpx, y, x, y);
  });
  ctx.strokeStyle = cfg.color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  /* Live dot at end */
  const lastX = (SEN_POINTS - 1) * xStep;
  const lastY = toY(buf[SEN_POINTS - 1]);
  ctx.beginPath();
  ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
  ctx.fillStyle = cfg.color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
  ctx.fillStyle = cfg.color + '30';
  ctx.fill();
}

/* ── SLUMP SVG CHART ─────────────────────────────────────────────
   Builds a rich SVG chart matching the Figma Trinity design:
   - Solid teal line = current live slump value
   - Dashed teal line = target spec value
   - Phase markers (LP / AS / BP) as vertical dashed dividers
   - Y-axis labels, X-axis timestamps, hover tooltip + crosshair
   - Runs in both mobile (#slump-svg-chart) and desktop (#dt-slump-svg-chart)
──────────────────────────────────────────────────────────────── */
/* Returns chart grid/label colors based on current mode */
function senChartColors() {
  const dark = document.body.classList.contains('dark');
  return {
    grid:    dark ? 'rgba(255,255,255,0.06)' : 'rgba(54,50,45,0.07)',
    label:   dark ? 'rgba(255,255,255,0.45)' : 'rgba(54,50,45,0.5)',
    phase:   dark ? 'rgba(255,255,255,0.18)' : 'rgba(54,50,45,0.2)',
    phaseLbl:dark ? 'rgba(255,255,255,0.4)'  : 'rgba(54,50,45,0.5)',
    tooltip: dark ? '#2f2d28' : 'white',
    tooltipBorder: dark ? 'rgba(255,255,255,0.1)' : 'rgba(54,50,45,0.14)',
    tooltipStrong: dark ? '#ffffff' : '#101010',
    tooltipSoft:   dark ? 'rgba(255,255,255,0.5)' : 'rgba(54,50,45,0.5)',
    tooltipDivider:dark ? 'rgba(255,255,255,0.08)' : 'rgba(54,50,45,0.1)',
  };
}

function senDrawSlumpSVG(containerId, isDesktop) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  const cfg  = SEN_CONFIGS.slump;
  const buf  = senData.slump;
  const W    = wrap.offsetWidth  || (isDesktop ? 520 : 300);
  const H    = isDesktop ? 180 : 130;
  const PAD  = { top:24, right:12, bottom:30, left:28 };
  const cW   = W - PAD.left - PAD.right;
  const cH   = H - PAD.top  - PAD.bottom;
  const n    = buf.length;
  const range = cfg.max - cfg.min;

  const toX = i  => PAD.left + (i / (n - 1)) * cW;
  const toY = v  => PAD.top  + cH - ((v - cfg.min) / range) * cH * 0.88 - cH * 0.04;

  /* Build SVG path string from data array */
  const cc = senChartColors();

  function makePath(data) {
    return data.map((v, i) => {
      const x = toX(i), y = toY(v);
      if (i === 0) return `M${x.toFixed(1)},${y.toFixed(1)}`;
      const px = toX(i-1), py = toY(data[i-1]);
      const cpx = ((px + x) / 2).toFixed(1);
      return `C${cpx},${py.toFixed(1)} ${cpx},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  /* Target line — flat at target value */
  const targetY = toY(cfg.target).toFixed(1);
  const targetPath = `M${PAD.left},${targetY} L${(PAD.left + cW).toFixed(1)},${targetY}`;

  /* Phase lines */
  const phaseLines = (cfg.phaseIdxs || []).map((idx, pi) => {
    const x = toX(idx).toFixed(1);
    return `<line x1="${x}" y1="${PAD.top}" x2="${x}" y2="${PAD.top + cH}"
      stroke="${cc.phase}" stroke-width="1" stroke-dasharray="3,3"/>
    <text x="${x}" y="${PAD.top - 6}" text-anchor="middle"
      font-family="ABC Repro,-apple-system,sans-serif" font-size="10"
      fill="${cc.phaseLbl}">${cfg.phases[pi]}</text>`;
  }).join('');

  /* Y-axis labels */
  const ySteps = [0,3,6,9,12];
  const yLabels = ySteps.map(v => {
    const y = toY(v).toFixed(1);
    return `<text x="${PAD.left - 5}" y="${y}" text-anchor="end" dominant-baseline="middle"
      font-family="ABC Repro,-apple-system,sans-serif" font-size="10"
      fill="${cc.label}">${v}</text>`;
  }).join('');

  /* Y-axis grid lines */
  const gridLines = ySteps.map(v => {
    const y = toY(v).toFixed(1);
    return `<line x1="${PAD.left}" y1="${y}" x2="${PAD.left + cW}" y2="${y}"
      stroke="${cc.grid}" stroke-width="1"/>`;
  }).join('');

  /* X-axis time labels — 5 evenly spaced */
  const labels = cfg.timeLabels || [];
  const xLabels = labels.map((lbl, i) => {
    const x = (PAD.left + (i / (labels.length - 1)) * cW).toFixed(1);
    return `<text x="${x}" y="${H - 4}" text-anchor="middle"
      font-family="ABC Repro,-apple-system,sans-serif" font-size="10"
      fill="${cc.label}">${lbl}</text>`;
  }).join('');

  /* Gradient fill under solid line */
  const gradId = containerId + '-grad';
  const fillPath = makePath(buf) +
    ` L${toX(n-1).toFixed(1)},${(PAD.top+cH).toFixed(1)} L${PAD.left},${(PAD.top+cH).toFixed(1)} Z`;

  /* Live dot */
  const lastX = toX(n - 1).toFixed(1);
  const lastY = toY(buf[n - 1]).toFixed(1);

  /* Legend */
  const legend = `
    <g transform="translate(${PAD.left},${H - 4})">
      <line x1="0" y1="-2" x2="14" y2="-2" stroke="${cfg.color}" stroke-width="1.5"/>
      <text x="18" y="0" dominant-baseline="middle" font-family="ABC Repro,-apple-system,sans-serif"
        font-size="10" fill="rgba(54,50,45,0.6)">Current</text>
      <line x1="68" y1="-2" x2="82" y2="-2" stroke="${cfg.color}" stroke-width="1.5" stroke-dasharray="4,3"/>
      <text x="86" y="0" dominant-baseline="middle" font-family="ABC Repro,-apple-system,sans-serif"
        font-size="10" fill="rgba(54,50,45,0.6)">Target ${cfg.target} in</text>
    </g>`;

  wrap.innerHTML = `
  <svg id="${containerId}-svg" width="100%" height="${H}" viewBox="0 0 ${W} ${H}"
    style="display:block;overflow:visible;cursor:crosshair;"
    onmousemove="senSlumpHover(event,'${containerId}')"
    onmouseleave="senSlumpHoverOut('${containerId}')">
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${cfg.color}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${cfg.color}" stop-opacity="0"/>
      </linearGradient>
      <clipPath id="${containerId}-clip">
        <rect x="${PAD.left}" y="${PAD.top}" width="${cW}" height="${cH}"/>
      </clipPath>
    </defs>

    ${gridLines}
    ${yLabels}

    <g clip-path="url(#${containerId}-clip)">
      <!-- Gradient fill -->
      <path d="${fillPath}" fill="url(#${gradId})"/>
      <!-- Phase dividers -->
      ${phaseLines}
      <!-- Target dashed line -->
      <path d="${targetPath}" stroke="${cfg.color}" stroke-width="1.5"
        stroke-dasharray="6,4" fill="none" opacity="0.7"/>
      <!-- Current solid line -->
      <path d="${makePath(buf)}" stroke="${cfg.color}" stroke-width="2"
        fill="none" stroke-linejoin="round" stroke-linecap="round"/>
      <!-- Live dot -->
      <circle cx="${lastX}" cy="${lastY}" r="3.5" fill="${cfg.color}"/>
      <circle cx="${lastX}" cy="${lastY}" r="7" fill="${cfg.color}" opacity="0.2"/>
    </g>

    ${xLabels}

    <!-- Tooltip group (hidden by default) -->
    <g id="${containerId}-tip" style="display:none;">
      <line id="${containerId}-tip-line" x1="0" y1="${PAD.top}" x2="0" y2="${PAD.top + cH}"
        stroke="${cc.phase}" stroke-width="1"/>
      <circle id="${containerId}-tip-dot" cx="0" cy="0" r="4.5" fill="${cc.tooltip}"
        stroke="${cfg.color}" stroke-width="2"/>
      <!-- Tooltip box — sized for content -->
      <g id="${containerId}-tip-box" transform="translate(0,0)">
        <rect rx="10" ry="10" width="148" height="82"
          fill="${cc.tooltip}" stroke="${cc.tooltipBorder}" stroke-width="1"
          filter="drop-shadow(0 4px 12px rgba(0,0,0,0.18))"/>
        <text x="10" y="22" font-family="ABC Repro,-apple-system,sans-serif"
          font-size="12" font-weight="600" fill="${cc.tooltipStrong}">Slump</text>
        <text id="${containerId}-tip-time" x="138" y="22" text-anchor="end"
          font-family="ABC Repro,-apple-system,sans-serif" font-size="11"
          fill="${cc.tooltipSoft}">--:--</text>
        <line x1="10" y1="32" x2="138" y2="32" stroke="${cc.tooltipDivider}" stroke-width="1"/>
        <text x="10" y="50" font-family="ABC Repro,-apple-system,sans-serif"
          font-size="11" fill="${cc.tooltipSoft}">Current:</text>
        <text id="${containerId}-tip-cur" x="138" y="50" text-anchor="end"
          font-family="ABC Repro,-apple-system,sans-serif" font-size="11" fill="${cc.tooltipStrong}">--</text>
        <line x1="10" y1="60" x2="138" y2="60" stroke="${cc.tooltipDivider}" stroke-width="1"/>
        <text x="10" y="75" font-family="ABC Repro,-apple-system,sans-serif"
          font-size="11" fill="${cc.tooltipSoft}">Target:</text>
        <text id="${containerId}-tip-tgt" x="138" y="75" text-anchor="end"
          font-family="ABC Repro,-apple-system,sans-serif" font-size="11" fill="${cc.tooltipStrong}">${cfg.target.toFixed(1)} in</text>
      </g>
    </g>
  </svg>`;
}

function senSlumpHover(evt, containerId) {
  const cfg = SEN_CONFIGS.slump;
  const buf = senData.slump;
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  const svg = document.getElementById(containerId + '-svg');
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const W = rect.width;
  const H = parseInt(svg.getAttribute('height')) || rect.height;
  const PAD = { top:24, right:12, bottom:30, left:28 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const n = buf.length;
  const range = cfg.max - cfg.min;

  const mx = evt.clientX - rect.left;
  /* Clamp to chart area */
  const cx = Math.max(PAD.left, Math.min(PAD.left + cW, mx));
  const idx = Math.round((cx - PAD.left) / cW * (n - 1));
  const safeIdx = Math.max(0, Math.min(n - 1, idx));
  const val = buf[safeIdx];
  const x = PAD.left + (safeIdx / (n - 1)) * cW;
  const y = PAD.top + cH - ((val - cfg.min) / range) * cH * 0.88 - cH * 0.04;

  /* Time label interpolation */
  const labels = cfg.timeLabels || [];
  const tIdx = safeIdx / (n - 1) * (labels.length - 1);
  const tLow = labels[Math.floor(tIdx)] || '';
  const timeLbl = tLow;

  /* Show tooltip group */
  const tipGroup = document.getElementById(containerId + '-tip');
  if (!tipGroup) return;
  tipGroup.style.display = '';

  const tipLine = document.getElementById(containerId + '-tip-line');
  const tipDot  = document.getElementById(containerId + '-tip-dot');
  const tipBox  = document.getElementById(containerId + '-tip-box');
  const tipTime = document.getElementById(containerId + '-tip-time');
  const tipCur  = document.getElementById(containerId + '-tip-cur');

  if (tipLine) { tipLine.setAttribute('x1', x.toFixed(1)); tipLine.setAttribute('x2', x.toFixed(1)); }
  if (tipDot)  { tipDot.setAttribute('cx', x.toFixed(1)); tipDot.setAttribute('cy', y.toFixed(1)); }
  if (tipTime) tipTime.textContent = timeLbl;
  if (tipCur)  tipCur.textContent  = val.toFixed(2) + ' in';

  /* Position tooltip box — flip left if near right edge */
  if (tipBox) {
    const boxW = 148, boxH = 82;
    let bx = x + 10, by = Math.max(PAD.top, y - boxH / 2);
    if (bx + boxW > W - PAD.right) bx = x - boxW - 10;
    tipBox.setAttribute('transform', `translate(${bx.toFixed(1)},${by.toFixed(1)})`);
  }
}

function senSlumpHoverOut(containerId) {
  const tipGroup = document.getElementById(containerId + '-tip');
  if (tipGroup) tipGroup.style.display = 'none';
}

/* Redraw slump SVG charts on every tick */
function senRedrawSlump() {
  senDrawSlumpSVG('slump-svg-wrap', false);
  senDrawSlumpSVG('dt-slump-svg-wrap', true);
}

/* ── WATER ADDITION SVG CHART ────────────────────────────────────
   Stepped solid blue line = current water addition (cumulative)
   Dashed blue line = allowable water baseline
   Phase markers LP / AS / BP
   Tooltip: Added (last step delta) + Current (total)
──────────────────────────────────────────────────────────────── */
function senDrawWaterSVG(containerId, isDesktop) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  const cfg = SEN_CONFIGS.water;
  const buf = senData.water;
  const W   = wrap.offsetWidth || (isDesktop ? 520 : 300);
  const H   = isDesktop ? 180 : 130;
  const PAD = { top:24, right:12, bottom:30, left:32 };
  const cW  = W - PAD.left - PAD.right;
  const cH  = H - PAD.top  - PAD.bottom;
  const n   = buf.length;
  const range = cfg.max - cfg.min;

  const toX = i => PAD.left + (i / (n - 1)) * cW;
  const toY = v => PAD.top  + cH - ((v - cfg.min) / range) * cH * 0.88 - cH * 0.04;

  /* Stepped path — horizontal then vertical */
  function makeSteppedPath(data) {
    let d = '';
    data.forEach((v, i) => {
      const x = toX(i), y = toY(v);
      if (i === 0) { d += 'M' + x.toFixed(1) + ',' + y.toFixed(1); return; }
      const px = toX(i - 1);
      d += ' H' + x.toFixed(1) + ' V' + y.toFixed(1);
    });
    return d;
  }

  /* Allowable ceiling — flat dashed line, hard limit water cannot exceed */
  const cc = senChartColors();
  const allowY = toY(cfg.allowable).toFixed(1);
  const allowPath = 'M' + PAD.left + ',' + allowY + ' L' + (PAD.left + cW).toFixed(1) + ',' + allowY;
  /* Label on the right edge */
  const allowLabel = '<text x="' + (PAD.left + cW + 3) + '" y="' + allowY + '" dominant-baseline="middle" font-family="ABC Repro,-apple-system,sans-serif" font-size="9" fill="' + cfg.color + '" opacity="0.7">max</text>';

  /* Phase lines */
  const phaseLines = (cfg.phaseIdxs || []).map(function(idx, pi) {
    const x = toX(idx).toFixed(1);
    return '<line x1="' + x + '" y1="' + PAD.top + '" x2="' + x + '" y2="' + (PAD.top + cH) + '" stroke="' + cc.phase + '" stroke-width="1" stroke-dasharray="3,3"/>'
      + '<text x="' + x + '" y="' + (PAD.top - 6) + '" text-anchor="middle" font-family="ABC Repro,-apple-system,sans-serif" font-size="10" fill="' + cc.phaseLbl + '">' + cfg.phases[pi] + '</text>';
  }).join('');

  /* Y-axis */
  const ySteps = [0, 0.5, 1, 1.5, 2];
  const yLabels = ySteps.map(function(v) {
    const y = toY(v).toFixed(1);
    return '<text x="' + (PAD.left - 5) + '" y="' + y + '" text-anchor="end" dominant-baseline="middle" font-family="ABC Repro,-apple-system,sans-serif" font-size="10" fill="' + cc.label + '">' + v + '</text>';
  }).join('');
  const gridLines = ySteps.map(function(v) {
    const y = toY(v).toFixed(1);
    return '<line x1="' + PAD.left + '" y1="' + y + '" x2="' + (PAD.left + cW).toFixed(1) + '" y2="' + y + '" stroke="' + cc.grid + '" stroke-width="1"/>';
  }).join('');

  /* X-axis labels */
  const labels = cfg.timeLabels || [];
  const xLabels = labels.map(function(lbl, i) {
    const x = (PAD.left + (i / (labels.length - 1)) * cW).toFixed(1);
    return '<text x="' + x + '" y="' + (H - 4) + '" text-anchor="middle" font-family="ABC Repro,-apple-system,sans-serif" font-size="10" fill="' + cc.label + '">' + lbl + '</text>';
  }).join('');

  /* Gradient fill */
  const gradId = containerId + '-grad';
  const steppedPath = makeSteppedPath(buf);
  const fillPath = steppedPath + ' V' + (PAD.top + cH).toFixed(1) + ' H' + PAD.left + ' Z';

  /* Live dot */
  const lastX = toX(n - 1).toFixed(1);
  const lastY = toY(buf[n - 1]).toFixed(1);

  /* Last delta — difference between last two points */
  const lastAdded = n > 1 ? Math.max(0, buf[n - 1] - buf[n - 2]) : 0;

  wrap.innerHTML = '<svg id="' + containerId + '-svg" width="100%" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="display:block;overflow:visible;cursor:crosshair;" onmousemove="senWaterHover(event,\'' + containerId + '\')" onmouseleave="senWaterHoverOut(\'' + containerId + '\')">'
    + '<defs>'
    + '<linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="' + cfg.color + '" stop-opacity="0.15"/>'
    + '<stop offset="100%" stop-color="' + cfg.color + '" stop-opacity="0"/>'
    + '</linearGradient>'
    + '<clipPath id="' + containerId + '-clip"><rect x="' + PAD.left + '" y="' + PAD.top + '" width="' + cW + '" height="' + cH + '"/></clipPath>'
    + '</defs>'
    + gridLines + yLabels
    + '<g clip-path="url(#' + containerId + '-clip)">'
    + '<path d="' + fillPath + '" fill="url(#' + gradId + ')"/>'
    + phaseLines
    + '<path d="' + allowPath + '" stroke="' + cfg.color + '" stroke-width="1.5" stroke-dasharray="6,4" fill="none" opacity="0.6"/>'
    + allowLabel
    + '<path d="' + steppedPath + '" stroke="' + cfg.color + '" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>'
    + '<circle cx="' + lastX + '" cy="' + lastY + '" r="3.5" fill="' + cfg.color + '"/>'
    + '<circle cx="' + lastX + '" cy="' + lastY + '" r="7" fill="' + cfg.color + '" opacity="0.2"/>'
    + '</g>'
    + xLabels
    + '<g id="' + containerId + '-tip" style="display:none;">'
    + '<line id="' + containerId + '-tip-line" x1="0" y1="' + PAD.top + '" x2="0" y2="' + (PAD.top + cH) + '" stroke="' + cc.phase + '" stroke-width="1"/>'
    + '<circle id="' + containerId + '-tip-dot" cx="0" cy="0" r="4.5" fill="' + cc.tooltip + '" stroke="' + cfg.color + '" stroke-width="2"/>'
    + '<g id="' + containerId + '-tip-box" transform="translate(0,0)">'
    + '<rect rx="10" ry="10" width="164" height="90" fill="' + cc.tooltip + '" stroke="' + cc.tooltipBorder + '" stroke-width="1" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.18))"/>'
    + '<text x="10" y="22" font-family="ABC Repro,-apple-system,sans-serif" font-size="12" font-weight="600" fill="' + cc.tooltipStrong + '">Water</text>'
    + '<text id="' + containerId + '-tip-time" x="154" y="22" text-anchor="end" font-family="ABC Repro,-apple-system,sans-serif" font-size="11" fill="' + cc.tooltipSoft + '">--:--</text>'
    + '<line x1="10" y1="32" x2="154" y2="32" stroke="' + cc.tooltipDivider + '" stroke-width="1"/>'
    + '<text x="10" y="50" font-family="ABC Repro,-apple-system,sans-serif" font-size="11" fill="' + cc.tooltipSoft + '">Added:</text>'
    + '<text id="' + containerId + '-tip-added" x="154" y="50" text-anchor="end" font-family="ABC Repro,-apple-system,sans-serif" font-size="11" fill="' + cc.tooltipStrong + '">--</text>'
    + '<line x1="10" y1="62" x2="154" y2="62" stroke="' + cc.tooltipDivider + '" stroke-width="1"/>'
    + '<text x="10" y="78" font-family="ABC Repro,-apple-system,sans-serif" font-size="11" fill="' + cc.tooltipSoft + '">Current:</text>'
    + '<text id="' + containerId + '-tip-cur" x="154" y="78" text-anchor="end" font-family="ABC Repro,-apple-system,sans-serif" font-size="11" fill="' + cc.tooltipStrong + '">--</text>'
    + '</g></g>'
    + '</svg>';
}

function senWaterHover(evt, containerId) {
  const cfg = SEN_CONFIGS.water;
  const buf = senData.water;
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  const svg = document.getElementById(containerId + '-svg');
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const W = rect.width;
  const H = parseInt(svg.getAttribute('height')) || rect.height;
  const PAD = { top:24, right:12, bottom:30, left:32 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const n = buf.length;
  const range = cfg.max - cfg.min;

  const cx = Math.max(PAD.left, Math.min(PAD.left + cW, evt.clientX - rect.left));
  const idx = Math.round((cx - PAD.left) / cW * (n - 1));
  const safeIdx = Math.max(0, Math.min(n - 1, idx));
  const val = buf[safeIdx];
  const added = safeIdx > 0 ? Math.max(0, val - buf[safeIdx - 1]) : 0;
  const x = PAD.left + (safeIdx / (n - 1)) * cW;
  const y = PAD.top + cH - ((val - cfg.min) / range) * cH * 0.88 - cH * 0.04;

  const labels = cfg.timeLabels || [];
  const tIdx = safeIdx / (n - 1) * (labels.length - 1);
  const timeLbl = labels[Math.floor(tIdx)] || '';

  const tipGroup = document.getElementById(containerId + '-tip');
  if (!tipGroup) return;
  tipGroup.style.display = '';

  const tipLine = document.getElementById(containerId + '-tip-line');
  const tipDot  = document.getElementById(containerId + '-tip-dot');
  const tipBox  = document.getElementById(containerId + '-tip-box');
  const tipTime = document.getElementById(containerId + '-tip-time');
  const tipAdded = document.getElementById(containerId + '-tip-added');
  const tipCur  = document.getElementById(containerId + '-tip-cur');

  if (tipLine) { tipLine.setAttribute('x1', x.toFixed(1)); tipLine.setAttribute('x2', x.toFixed(1)); }
  if (tipDot)  { tipDot.setAttribute('cx', x.toFixed(1)); tipDot.setAttribute('cy', y.toFixed(1)); }
  if (tipTime)  tipTime.textContent  = timeLbl;
  if (tipAdded) tipAdded.textContent = added.toFixed(2) + ' (gal/yd³)';
  if (tipCur)   tipCur.textContent   = val.toFixed(2) + ' (gal/yd³)';

  if (tipBox) {
    const boxW = 164, boxH = 90;
    let bx = x + 10, by = Math.max(PAD.top, y - boxH / 2);
    if (bx + boxW > W - PAD.right) bx = x - boxW - 10;
    tipBox.setAttribute('transform', 'translate(' + bx.toFixed(1) + ',' + by.toFixed(1) + ')');
  }
}

function senWaterHoverOut(containerId) {
  const tipGroup = document.getElementById(containerId + '-tip');
  if (tipGroup) tipGroup.style.display = 'none';
}

function senRedrawWater() {
  senDrawWaterSVG('water-svg-wrap', false);
  senDrawWaterSVG('dt-water-svg-wrap', true);
}

/* ── DRUM SPEED SVG CHART ────────────────────────────────────────
   Sharp angular light-blue line — volatile RPM, no smoothing,
   no reference line. Single tooltip row: "Speed: N"
──────────────────────────────────────────────────────────────── */
function senDrawDrumSVG(containerId, isDesktop) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  const cfg = SEN_CONFIGS.drum;
  const buf = senData.drum;
  const W   = wrap.offsetWidth || (isDesktop ? 520 : 300);
  const H   = isDesktop ? 180 : 130;
  const PAD = { top:24, right:12, bottom:30, left:28 };
  const cW  = W - PAD.left - PAD.right;
  const cH  = H - PAD.top  - PAD.bottom;
  const n   = buf.length;
  const range = cfg.max - cfg.min;

  const toX = i => PAD.left + (i / (n - 1)) * cW;
  const toY = v => PAD.top  + cH - ((v - cfg.min) / range) * cH * 0.88 - cH * 0.04;

  /* Sharp straight-line path */
  const cc = senChartColors();
  const linePath = buf.map(function(v, i) {
    return (i === 0 ? 'M' : 'L') + toX(i).toFixed(1) + ',' + toY(v).toFixed(1);
  }).join(' ');

  /* Fill path */
  const fillPath = linePath + ' L' + toX(n-1).toFixed(1) + ',' + (PAD.top+cH).toFixed(1) + ' L' + PAD.left + ',' + (PAD.top+cH).toFixed(1) + ' Z';

  /* Y-axis */
  const ySteps = cfg.ySteps || [0,5,10,15,20];
  const yLabels = ySteps.map(function(v) {
    const y = toY(v).toFixed(1);
    return '<text x="' + (PAD.left-5) + '" y="' + y + '" text-anchor="end" dominant-baseline="middle" font-family="ABC Repro,-apple-system,sans-serif" font-size="10" fill="' + cc.label + '">' + v + '</text>';
  }).join('');
  const gridLines = ySteps.map(function(v) {
    const y = toY(v).toFixed(1);
    return '<line x1="' + PAD.left + '" y1="' + y + '" x2="' + (PAD.left+cW).toFixed(1) + '" y2="' + y + '" stroke="' + cc.grid + '" stroke-width="1"/>';
  }).join('');

  /* Phase lines */
  const phaseLines = (cfg.phaseIdxs || []).map(function(idx, pi) {
    const x = toX(idx).toFixed(1);
    return '<line x1="' + x + '" y1="' + PAD.top + '" x2="' + x + '" y2="' + (PAD.top+cH) + '" stroke="' + cc.phase + '" stroke-width="1" stroke-dasharray="3,3"/>'
      + '<text x="' + x + '" y="' + (PAD.top-6) + '" text-anchor="middle" font-family="ABC Repro,-apple-system,sans-serif" font-size="10" fill="' + cc.phaseLbl + '">' + cfg.phases[pi] + '</text>';
  }).join('');

  /* X-axis labels */
  const labels = cfg.timeLabels || [];
  const xLabels = labels.map(function(lbl, i) {
    const x = (PAD.left + (i / (labels.length-1)) * cW).toFixed(1);
    return '<text x="' + x + '" y="' + (H-4) + '" text-anchor="middle" font-family="ABC Repro,-apple-system,sans-serif" font-size="10" fill="' + cc.label + '">' + lbl + '</text>';
  }).join('');

  const gradId = containerId + '-grad';
  const lastX = toX(n-1).toFixed(1);
  const lastY = toY(buf[n-1]).toFixed(1);

  wrap.innerHTML = '<svg id="' + containerId + '-svg" width="100%" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="display:block;overflow:visible;cursor:crosshair;" onmousemove="senDrumHover(event,\'' + containerId + '\')" onmouseleave="senDrumHoverOut(\'' + containerId + '\')">'
    + '<defs>'
    + '<linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="' + cfg.color + '" stop-opacity="0.18"/>'
    + '<stop offset="100%" stop-color="' + cfg.color + '" stop-opacity="0"/>'
    + '</linearGradient>'
    + '<clipPath id="' + containerId + '-clip"><rect x="' + PAD.left + '" y="' + PAD.top + '" width="' + cW + '" height="' + cH + '"/></clipPath>'
    + '</defs>'
    + gridLines + yLabels
    + '<g clip-path="url(#' + containerId + '-clip)">'
    + '<path d="' + fillPath + '" fill="url(#' + gradId + ')"/>'
    + phaseLines
    + '<path d="' + linePath + '" stroke="' + cfg.color + '" stroke-width="1.8" fill="none" stroke-linejoin="miter" stroke-linecap="square"/>'
    + '<circle cx="' + lastX + '" cy="' + lastY + '" r="3" fill="' + cfg.color + '"/>'
    + '</g>'
    + xLabels
    + '<g id="' + containerId + '-tip" style="display:none;">'
    + '<line id="' + containerId + '-tip-line" x1="0" y1="' + PAD.top + '" x2="0" y2="' + (PAD.top+cH) + '" stroke="' + cc.phase + '" stroke-width="1"/>'
    + '<circle id="' + containerId + '-tip-dot" cx="0" cy="0" r="4.5" fill="' + cc.tooltip + '" stroke="' + cfg.color + '" stroke-width="2"/>'
    + '<g id="' + containerId + '-tip-box" transform="translate(0,0)">'
    + '<rect rx="10" ry="10" width="148" height="66" fill="' + cc.tooltip + '" stroke="' + cc.tooltipBorder + '" stroke-width="1" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.18))"/>'
    + '<text x="10" y="20" font-family="ABC Repro,-apple-system,sans-serif" font-size="12" font-weight="600" fill="' + cc.tooltipStrong + '">Drum speed</text>'
    + '<text id="' + containerId + '-tip-time" x="138" y="20" text-anchor="end" font-family="ABC Repro,-apple-system,sans-serif" font-size="11" fill="' + cc.tooltipSoft + '">--:--</text>'
    + '<line x1="10" y1="30" x2="138" y2="30" stroke="' + cc.tooltipDivider + '" stroke-width="1"/>'
    + '<text x="10" y="50" font-family="ABC Repro,-apple-system,sans-serif" font-size="11" fill="' + cc.tooltipSoft + '">Speed:</text>'
    + '<text id="' + containerId + '-tip-val" x="138" y="50" text-anchor="end" font-family="ABC Repro,-apple-system,sans-serif" font-size="11" fill="' + cc.tooltipStrong + '">--</text>'
    + '</g></g>'
    + '</svg>';
}

function senDrumHover(evt, containerId) {
  const cfg = SEN_CONFIGS.drum;
  const buf = senData.drum;
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  const svg = document.getElementById(containerId + '-svg');
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const W = rect.width;
  const H = parseInt(svg.getAttribute('height')) || rect.height;
  const PAD = { top:24, right:12, bottom:30, left:28 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const n = buf.length;
  const range = cfg.max - cfg.min;

  const cx = Math.max(PAD.left, Math.min(PAD.left + cW, evt.clientX - rect.left));
  const idx = Math.round((cx - PAD.left) / cW * (n - 1));
  const safeIdx = Math.max(0, Math.min(n - 1, idx));
  const val = buf[safeIdx];
  const x = PAD.left + (safeIdx / (n - 1)) * cW;
  const y = PAD.top + cH - ((val - cfg.min) / range) * cH * 0.88 - cH * 0.04;
  const labels = cfg.timeLabels || [];
  const timeLbl = labels[Math.floor(safeIdx / (n-1) * (labels.length-1))] || '';

  const tipGroup = document.getElementById(containerId + '-tip');
  if (!tipGroup) return;
  tipGroup.style.display = '';

  const tipLine = document.getElementById(containerId + '-tip-line');
  const tipDot  = document.getElementById(containerId + '-tip-dot');
  const tipBox  = document.getElementById(containerId + '-tip-box');
  const tipTime = document.getElementById(containerId + '-tip-time');
  const tipVal  = document.getElementById(containerId + '-tip-val');

  if (tipLine) { tipLine.setAttribute('x1', x.toFixed(1)); tipLine.setAttribute('x2', x.toFixed(1)); }
  if (tipDot)  { tipDot.setAttribute('cx', x.toFixed(1)); tipDot.setAttribute('cy', y.toFixed(1)); }
  if (tipTime) tipTime.textContent = timeLbl;
  if (tipVal)  tipVal.textContent  = Math.round(val) + ' RPM';

  if (tipBox) {
    const boxW = 148, boxH = 66;
    let bx = x + 10, by = Math.max(PAD.top, y - boxH / 2);
    if (bx + boxW > W - PAD.right) bx = x - boxW - 10;
    tipBox.setAttribute('transform', 'translate(' + bx.toFixed(1) + ',' + by.toFixed(1) + ')');
  }
}

function senDrumHoverOut(containerId) {
  const tipGroup = document.getElementById(containerId + '-tip');
  if (tipGroup) tipGroup.style.display = 'none';
}

function senRedrawDrum() {
  senDrawDrumSVG('drum-svg-wrap', false);
  senDrawDrumSVG('dt-drum-svg-wrap', true);
}

/* ── GENERIC SVG LINE CHART ──────────────────────────────────────
   Reusable for pressure, cell, sat — smooth bezier, optional
   threshold dashed line(s), configurable Y-axis, phase markers.
──────────────────────────────────────────────────────────────── */
function senDrawLineSVG(containerId, isDesktop, key) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  const cfg  = SEN_CONFIGS[key];
  const buf  = senData[key];
  const W    = wrap.offsetWidth || (isDesktop ? 520 : 300);
  const H    = isDesktop ? 180 : 130;
  const PAD  = { top:24, right:12, bottom:30, left:32 };
  const cW   = W - PAD.left - PAD.right;
  const cH   = H - PAD.top  - PAD.bottom;
  const n    = buf.length;
  const range = cfg.max - cfg.min;

  const toX = i => PAD.left + (i / (n - 1)) * cW;
  const toY = v => PAD.top  + cH - ((v - cfg.min) / range) * cH * 0.88 - cH * 0.04;

  /* Smooth bezier path */
  function makePath(data) {
    return data.map(function(v, i) {
      const x = toX(i), y = toY(v);
      if (i === 0) return 'M' + x.toFixed(1) + ',' + y.toFixed(1);
      const px = toX(i-1), py = toY(data[i-1]);
      const cpx = ((px + x) / 2).toFixed(1);
      return 'C' + cpx + ',' + py.toFixed(1) + ' ' + cpx + ',' + y.toFixed(1) + ' ' + x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
  }

  const linePath = makePath(buf);
  const cc = senChartColors();
  const fillPath = linePath + ' L' + toX(n-1).toFixed(1) + ',' + (PAD.top+cH).toFixed(1) + ' L' + PAD.left + ',' + (PAD.top+cH).toFixed(1) + ' Z';

  /* Threshold lines */
  let thresholdSVG = '';
  if (cfg.threshold !== undefined) {
    const ty = toY(cfg.threshold).toFixed(1);
    thresholdSVG += '<line x1="' + PAD.left + '" y1="' + ty + '" x2="' + (PAD.left+cW).toFixed(1) + '" y2="' + ty + '" stroke="' + cfg.color + '" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.55"/>'
      + '<text x="' + (PAD.left+cW+3) + '" y="' + ty + '" dominant-baseline="middle" font-family="ABC Repro,-apple-system,sans-serif" font-size="9" fill="' + cfg.color + '" opacity="0.65">min</text>';
  }
  if (cfg.minPressure !== undefined) {
    const ty = toY(cfg.minPressure).toFixed(1);
    thresholdSVG += '<line x1="' + PAD.left + '" y1="' + ty + '" x2="' + (PAD.left+cW).toFixed(1) + '" y2="' + ty + '" stroke="' + cfg.color + '" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.5"/>'
      + '<text x="' + (PAD.left+cW+3) + '" y="' + ty + '" dominant-baseline="middle" font-family="ABC Repro,-apple-system,sans-serif" font-size="9" fill="' + cfg.color + '" opacity="0.65">min</text>';
  }
  if (cfg.maxPressure !== undefined) {
    const ty = toY(cfg.maxPressure).toFixed(1);
    thresholdSVG += '<line x1="' + PAD.left + '" y1="' + ty + '" x2="' + (PAD.left+cW).toFixed(1) + '" y2="' + ty + '" stroke="' + cfg.color + '" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.5"/>'
      + '<text x="' + (PAD.left+cW+3) + '" y="' + ty + '" dominant-baseline="middle" font-family="ABC Repro,-apple-system,sans-serif" font-size="9" fill="' + cfg.color + '" opacity="0.65">max</text>';
  }

  /* Y-axis */
  const ySteps = cfg.ySteps || [cfg.min, cfg.max];
  const yLabels = ySteps.map(function(v) {
    const y = toY(v).toFixed(1);
    return '<text x="' + (PAD.left-5) + '" y="' + y + '" text-anchor="end" dominant-baseline="middle" font-family="ABC Repro,-apple-system,sans-serif" font-size="10" fill="' + cc.label + '">' + v + '</text>';
  }).join('');
  const gridLines = ySteps.map(function(v) {
    const y = toY(v).toFixed(1);
    return '<line x1="' + PAD.left + '" y1="' + y + '" x2="' + (PAD.left+cW).toFixed(1) + '" y2="' + y + '" stroke="' + cc.grid + '" stroke-width="1"/>';
  }).join('');

  /* Phase lines */
  const phaseLines = (cfg.phaseIdxs || []).map(function(idx, pi) {
    const x = toX(idx).toFixed(1);
    return '<line x1="' + x + '" y1="' + PAD.top + '" x2="' + x + '" y2="' + (PAD.top+cH) + '" stroke="' + cc.phase + '" stroke-width="1" stroke-dasharray="3,3"/>'
      + '<text x="' + x + '" y="' + (PAD.top-6) + '" text-anchor="middle" font-family="ABC Repro,-apple-system,sans-serif" font-size="10" fill="' + cc.phaseLbl + '">' + cfg.phases[pi] + '</text>';
  }).join('');

  /* X-axis labels */
  const labels = cfg.timeLabels || [];
  const xLabels = labels.map(function(lbl, i) {
    const x = (PAD.left + (i / (labels.length-1)) * cW).toFixed(1);
    return '<text x="' + x + '" y="' + (H-4) + '" text-anchor="middle" font-family="ABC Repro,-apple-system,sans-serif" font-size="10" fill="' + cc.label + '">' + lbl + '</text>';
  }).join('');

  const gradId = containerId + '-grad';
  const lastX  = toX(n-1).toFixed(1);
  const lastY  = toY(buf[n-1]).toFixed(1);
  const tipLabel = cfg.tooltipLabel || cfg.title;
  const tipUnit  = cfg.unit ? ' ' + cfg.unit : '';

  wrap.innerHTML = '<svg id="' + containerId + '-svg" width="100%" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="display:block;overflow:visible;cursor:crosshair;" onmousemove="senLineHover(event,\'' + containerId + '\',\'' + key + '\')" onmouseleave="senLineHoverOut(\'' + containerId + '\')">'
    + '<defs>'
    + '<linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="' + cfg.color + '" stop-opacity="0.18"/>'
    + '<stop offset="100%" stop-color="' + cfg.color + '" stop-opacity="0"/>'
    + '</linearGradient>'
    + '<clipPath id="' + containerId + '-clip"><rect x="' + PAD.left + '" y="' + PAD.top + '" width="' + cW + '" height="' + cH + '"/></clipPath>'
    + '</defs>'
    + gridLines + yLabels
    + '<g clip-path="url(#' + containerId + '-clip)">'
    + '<path d="' + fillPath + '" fill="url(#' + gradId + ')"/>'
    + phaseLines
    + thresholdSVG
    + '<path d="' + linePath + '" stroke="' + cfg.color + '" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>'
    + '<circle cx="' + lastX + '" cy="' + lastY + '" r="3.5" fill="' + cfg.color + '"/>'
    + '<circle cx="' + lastX + '" cy="' + lastY + '" r="7" fill="' + cfg.color + '" opacity="0.2"/>'
    + '</g>'
    + xLabels
    + '<g id="' + containerId + '-tip" style="display:none;">'
    + '<line id="' + containerId + '-tip-line" x1="0" y1="' + PAD.top + '" x2="0" y2="' + (PAD.top+cH) + '" stroke="' + cc.phase + '" stroke-width="1"/>'
    + '<circle id="' + containerId + '-tip-dot" cx="0" cy="0" r="4.5" fill="' + cc.tooltip + '" stroke="' + cfg.color + '" stroke-width="2"/>'
    + '<g id="' + containerId + '-tip-box" transform="translate(0,0)">'
    + '<rect rx="10" ry="10" width="148" height="66" fill="' + cc.tooltip + '" stroke="' + cc.tooltipBorder + '" stroke-width="1" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.18))"/>'
    + '<text x="10" y="20" font-family="ABC Repro,-apple-system,sans-serif" font-size="12" font-weight="600" fill="' + cc.tooltipStrong + '">' + cfg.title + '</text>'
    + '<text id="' + containerId + '-tip-time" x="138" y="20" text-anchor="end" font-family="ABC Repro,-apple-system,sans-serif" font-size="11" fill="' + cc.tooltipSoft + '">--:--</text>'
    + '<line x1="10" y1="30" x2="138" y2="30" stroke="' + cc.tooltipDivider + '" stroke-width="1"/>'
    + '<text x="10" y="50" font-family="ABC Repro,-apple-system,sans-serif" font-size="11" fill="' + cc.tooltipSoft + '">' + tipLabel + ':</text>'
    + '<text id="' + containerId + '-tip-val" x="138" y="50" text-anchor="end" font-family="ABC Repro,-apple-system,sans-serif" font-size="11" fill="' + cc.tooltipStrong + '">--</text>'
    + '</g></g>'
    + '</svg>';
}

function senLineHover(evt, containerId, key) {
  const cfg = SEN_CONFIGS[key];
  const buf = senData[key];
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  const svg = document.getElementById(containerId + '-svg');
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const W = rect.width;
  const H = parseInt(svg.getAttribute('height')) || rect.height;
  const PAD = { top:24, right:12, bottom:30, left:32 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const n = buf.length;
  const range = cfg.max - cfg.min;

  const cx = Math.max(PAD.left, Math.min(PAD.left + cW, evt.clientX - rect.left));
  const idx = Math.round((cx - PAD.left) / cW * (n - 1));
  const safeIdx = Math.max(0, Math.min(n - 1, idx));
  const val = buf[safeIdx];
  const x = PAD.left + (safeIdx / (n - 1)) * cW;
  const y = PAD.top + cH - ((val - cfg.min) / range) * cH * 0.88 - cH * 0.04;
  const labels = cfg.timeLabels || [];
  const timeLbl = labels[Math.floor(safeIdx / (n-1) * (labels.length-1))] || '';

  const tipGroup = document.getElementById(containerId + '-tip');
  if (!tipGroup) return;
  tipGroup.style.display = '';

  const tl = document.getElementById(containerId + '-tip-line');
  const td = document.getElementById(containerId + '-tip-dot');
  const tb = document.getElementById(containerId + '-tip-box');
  const tt = document.getElementById(containerId + '-tip-time');
  const tv = document.getElementById(containerId + '-tip-val');

  if (tl) { tl.setAttribute('x1', x.toFixed(1)); tl.setAttribute('x2', x.toFixed(1)); }
  if (td) { td.setAttribute('cx', x.toFixed(1)); td.setAttribute('cy', y.toFixed(1)); }
  if (tt) tt.textContent = timeLbl;
  if (tv) tv.textContent = val.toFixed(cfg.liveDecimals) + (cfg.unit ? ' ' + cfg.unit : '');

  if (tb) {
    const boxW = 148, boxH = 66;
    let bx = x + 10, by = Math.max(PAD.top, y - boxH / 2);
    if (bx + boxW > W - PAD.right) bx = x - boxW - 10;
    tb.setAttribute('transform', 'translate(' + bx.toFixed(1) + ',' + by.toFixed(1) + ')');
  }
}

function senLineHoverOut(containerId) {
  const g = document.getElementById(containerId + '-tip');
  if (g) g.style.display = 'none';
}

function senRedrawPressure() {
  senDrawLineSVG('pressure-svg-wrap', false, 'pressure');
  senDrawLineSVG('dt-pressure-svg-wrap', true, 'pressure');
}
function senRedrawCell() {
  senDrawLineSVG('cell-svg-wrap', false, 'cell');
  senDrawLineSVG('dt-cell-svg-wrap', true, 'cell');
}
function senRedrawSat() {
  senDrawLineSVG('sat-svg-wrap', false, 'sat');
  senDrawLineSVG('dt-sat-svg-wrap', true, 'sat');
}

function senTick() {
  Object.entries(SEN_CONFIGS).forEach(([key, cfg]) => {
    if (cfg.type !== 'line') return;
    const buf = senData[key];
    const last = buf[buf.length - 1];
    let clamped;

    if (cfg.cumulative) {
      /* Water: only ever increases in small steps, hard cap at allowable */
      const increment = Math.random() < 0.6
        ? (Math.random() * cfg.liveRange)   /* add a small amount */
        : 0;                                  /* hold steady */
      clamped = Math.min(cfg.allowable, last + increment);
    } else {
      const next = last + (Math.random() - 0.48) * cfg.liveRange * 0.25;
      clamped = Math.max(cfg.min + (cfg.max-cfg.min)*0.05, Math.min(cfg.max * 0.95, next));
    }
    buf.shift();
    buf.push(clamped);

    /* Update chip value */
    const chipVal = document.getElementById(cfg.liveKey);
    if (chipVal) {
      chipVal.innerHTML = clamped.toFixed(cfg.liveDecimals) + '<span class="sen-chip-unit">' + cfg.liveUnit + '</span>';
    }
    /* Update card big value — mobile + desktop */
    const cardVal = document.getElementById('sc-val-' + key);
    if (cardVal) cardVal.textContent = clamped.toFixed(cfg.liveDecimals);
    const dtCardVal = document.getElementById('dt-sc-val-' + key);
    if (dtCardVal) dtCardVal.textContent = clamped.toFixed(cfg.liveDecimals);
    const dtChipVal = document.getElementById('dt-sv-' + key);
    if (dtChipVal) dtChipVal.innerHTML = clamped.toFixed(cfg.liveDecimals) + '<span class="sen-chip-unit"> ' + cfg.liveUnit + '</span>';

    if (senSelected.has(key)) {
      if (key === 'slump') {
        senRedrawSlump();
      } else if (key === 'water') {
        senRedrawWater();
      } else if (key === 'drum') {
        senRedrawDrum();
      } else if (key === 'pressure') {
        senRedrawPressure();
      } else if (key === 'cell') {
        senRedrawCell();
      } else if (key === 'sat') {
        senRedrawSat();
      } else if (key === 'admix' || key === 'revs' || key === 'temp') {
        const wrap = document.getElementById('dt-' + key + '-svg-wrap');
        if (wrap) senDrawLineSVG('dt-' + key + '-svg-wrap', false, key);
      } else {
        senDrawChart(key);
        senDrawChart('dt-' + key, key);
      }
    }
  });

  /* satellite count is now handled by the main senTick loop above */

  senAnimId = setTimeout(senTick, 1200);
}

function senStart() {
  if (senAnimId) return;
  senRenderCards();
  setTimeout(() => { senTick(); }, 300);
}

function senStop() {
  clearTimeout(senAnimId);
  senAnimId = null;
}


function openNav() {
  document.getElementById('sidenav').classList.add('open');
  document.getElementById('sidenav-overlay').classList.add('open');
}
function closeNav() {
  const nav = document.getElementById('sidenav');
  nav.classList.add('closing');
  nav.classList.remove('open');
  setTimeout(() => nav.classList.remove('closing'), 260);
  document.getElementById('sidenav-overlay').classList.remove('open');
}
function toggleNavItem(itemId, subId) {
  const item = document.getElementById(itemId);
  const sub  = document.getElementById(subId);
  const isOpen = sub.classList.contains('open');
  item.classList.toggle('expanded', !isOpen);
  sub.classList.toggle('open', !isOpen);
}


/* ─── COMPONENT CONDITIONS DATA ─────────────────── */

const ccExpanded = {};

/* ══════════════════════════════════════════════════
   FILTER SHEET
═══════════════════════════════════════════════════ */

function filterOpen() {
  document.getElementById('filter-overlay').style.display = 'block';
  const sheet = document.getElementById('filter-sheet');
  sheet.style.display = 'block';
  requestAnimationFrame(() => sheet.style.transform = 'translateY(0)');
}

function filterClose() {
  const sheet = document.getElementById('filter-sheet');
  sheet.style.transform = 'translateY(110%)';
  setTimeout(() => {
    document.getElementById('filter-overlay').style.display = 'none';
  }, 300);
}

function filterToggle(el) {
  const group = el.dataset.group;
  const val   = el.dataset.value;
  const set   = filterState[group];
  if (set.has(val)) { set.delete(val); el.classList.remove('active'); }
  else              { set.add(val);    el.classList.add('active'); }
}

function filterReset() {
  Object.values(filterState).forEach(s => s.clear());
  document.querySelectorAll('.flt-chip').forEach(c => c.classList.remove('active'));
  filterUpdateCount();
}

function filterApply() {
  filterClose();
  filterUpdateCount();
  const page = typeof srchGetActivePage === 'function' ? srchGetActivePage() : 'wts';
  if (page === 'overview') renderOverview();
  else if (page === 'cc')  renderConditions();
  else                     renderTrucks();
}

function filterUpdateCount() {
  const total = Object.values(filterState).reduce((n, s) => n + s.size, 0);
  const badge = document.getElementById('filter-count');
  const btn   = document.getElementById('filter-btn');
  if (total > 0) {
    badge.textContent = total;
    badge.style.display = 'inline-block';
    btn.style.background = 'rgba(48,105,227,0.08)';
    btn.style.borderColor = 'var(--blue)';
    btn.style.color = 'var(--blue)';
  } else {
    badge.style.display = 'none';
    btn.style.background = '';
    btn.style.borderColor = '';
    btn.style.color = '';
  }
}

/* ══════════════════════════════════════════════════
   SEARCH
   Searches trucks[] by: num, plant, ver, ign state
   Scoped to whichever page is currently active
═══════════════════════════════════════════════════ */

let srchActiveQuery = '';

function srchGetActivePage() {
  const wts = document.getElementById('wts-label').textContent;
  if (wts === 'Overview') return 'overview';
  if (wts === 'Components Condition') return 'cc';
  return 'wts'; /* Where to start */
}

function srchGetList() {
  const page = srchGetActivePage();
  if (page === 'wts') {
    /* Where to Start: only trucks with alerts */
    return trucks.filter(t => { const _a=getTruckAlerts(t.num); return _a.err||_a.wrn; });
  }
  if (page === 'cc') {
    /* Components Condition: trucks in CC_TRUCKS */
    return CC_TRUCKS.map(ct => trucks.find(t => t.num === ct.num)).filter(Boolean);
  }
  /* Overview: all trucks */
  return trucks;
}

function srchHighlight(text, query) {
  if (!query) return `<span class="srch-soft">${text}</span>`;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return `<span class="srch-soft">${text}</span>`;
  const before = text.slice(0, idx);
  const match  = text.slice(idx, idx + query.length);
  const after  = text.slice(idx + query.length);
  return `${before ? `<span class="srch-soft">${before}</span>` : ''}<span class="srch-chip">${match}</span>${after ? `<span class="srch-soft">${after}</span>` : ''}`;
}

function srchOnInput() {
  const input = document.getElementById('srch-input');
  const q = input.value.trim();
  srchActiveQuery = q;
  const field = document.getElementById('srch-field');
  const clear = document.getElementById('srch-clear');
  const drop  = document.getElementById('srch-drop');

  field.classList.toggle('active', q.length > 0);
  clear.style.display = q.length > 0 ? 'block' : 'none';

  if (!q) { drop.style.display = 'none'; return; }

  const list = srchGetList();
  const matches = list.filter(t =>
    t.num.toLowerCase().includes(q.toLowerCase()) ||
    t.plant.toLowerCase().includes(q.toLowerCase()) ||
    t.ver.toLowerCase().includes(q.toLowerCase()) ||
    t.ign.toLowerCase().includes(q.toLowerCase())
  );

  const MAX = 5;
  const shown = matches.slice(0, MAX);
  const extra = matches.length - MAX;

  const resultsEl = document.getElementById('srch-results');

  if (matches.length === 0) {
    resultsEl.innerHTML = `<div class="srch-no-hits">No matches found</div>`;
    srchPositionDrop();
    drop.style.display = 'block';
    return;
  }

  /* Truck icon SVG */
  const truckIcon = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 13C1.94772 13 1.5 12.5523 1.5 12V9.80278C1.5 9.60535 1.55844 9.41234 1.66795 9.24808L3.20313 6.9453C3.3886 6.6671 3.70083 6.5 4.03518 6.5H6V12C6 12.5523 6.44772 13 7 13H11" stroke="#36322d9e" stroke-width="1.2" stroke-linejoin="round"/><circle cx="4" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/><circle cx="12" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/><path d="M12.2242 5.15477L8.65195 6.06584C6.54213 6.60392 5.61922 9.08368 6.86385 10.8702L11.9902 10.8575L14.0825 7.82226C14.204 7.64525 14.204 7.41112 14.0811 7.23472L12.7748 5.35971C12.6519 5.18331 12.4325 5.10164 12.2242 5.15477Z" stroke="#36322d9e" stroke-width="1.2"/></svg>`;

  let html = `
    <div class="srch-section-hdr">
      ${truckIcon}
      <span class="srch-section-label">Trucks</span>
    </div>`;

  shown.forEach(t => {
    /* Primary: truck number. Secondary: plant · ver */
    const primary   = srchHighlight(t.num, q);
    const secondary = `${t.plant} · ${t.ver} · Ign ${t.ign}`;
    const truckIdx  = trucks.indexOf(t);
    html += `
      <div class="srch-row" onclick="srchSelect(${truckIdx})">
        <span class="srch-match-text">${primary}</span>
        <span class="srch-meta">${secondary}</span>
      </div>`;
  });

  if (extra > 0) {
    html += `<div class="srch-show-more" onclick="srchShowMore()">Show ${extra} more truck${extra > 1 ? 's' : ''}</div>`;
  }

  resultsEl.innerHTML = html;
  srchPositionDrop();
  drop.style.display = 'block';
}

function srchPositionDrop() {
  const field   = document.getElementById('srch-field');
  const drop    = document.getElementById('srch-drop');
  const pagePad = drop && drop.parentElement;
  if (!field || !drop || !pagePad) return;
  const fieldRect   = field.getBoundingClientRect();
  const padRect     = pagePad.getBoundingClientRect();
  drop.style.top    = (fieldRect.bottom - padRect.top + 6) + 'px';
}

function srchOnFocus() {
  /* If there's already a query, re-show results */
  if (srchActiveQuery) srchOnInput();
}

function srchClear() {
  const input = document.getElementById('srch-input');
  input.value = '';
  srchActiveQuery = '';
  document.getElementById('srch-field').classList.remove('active');
  document.getElementById('srch-clear').style.display = 'none';
  document.getElementById('srch-drop').style.display = 'none';
  /* Restore full list */
  srchRestoreAll();
  input.focus();
}

function srchRestoreAll() {
  /* Re-render whichever page is active without any filter */
  const page = srchGetActivePage();
  if (page === 'wts')      renderTrucks();
  else if (page === 'overview') renderOverview();
  else                     renderConditions();
}

function srchSelect(truckIdx) {
  /* Close dropdown */
  document.getElementById('srch-drop').style.display = 'none';
  const t = trucks[truckIdx];
  const page = srchGetActivePage();

  /* Update input to show selected truck */
  const input = document.getElementById('srch-input');
  input.value = t.num;

  if (page === 'wts') {
    /* Render only the matching truck in WTS */
    srchFilterWts(truckIdx);
  } else if (page === 'overview') {
    srchFilterOverview(truckIdx);
  } else {
    srchFilterCC(t.num);
  }
}

function srchShowMore() {
  /* Expand results to show all matches */
  const q = srchActiveQuery;
  if (!q) return;
  const list = srchGetList();
  const matches = list.filter(t =>
    t.num.toLowerCase().includes(q.toLowerCase()) ||
    t.plant.toLowerCase().includes(q.toLowerCase()) ||
    t.ver.toLowerCase().includes(q.toLowerCase()) ||
    t.ign.toLowerCase().includes(q.toLowerCase())
  );
  const truckIcon = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 13C1.94772 13 1.5 12.5523 1.5 12V9.80278C1.5 9.60535 1.55844 9.41234 1.66795 9.24808L3.20313 6.9453C3.3886 6.6671 3.70083 6.5 4.03518 6.5H6V12C6 12.5523 6.44772 13 7 13H11" stroke="#36322d9e" stroke-width="1.2" stroke-linejoin="round"/><circle cx="4" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/><circle cx="12" cy="13" r="1.4" stroke="#36322d9e" stroke-width="1.2"/><path d="M12.2242 5.15477L8.65195 6.06584C6.54213 6.60392 5.61922 9.08368 6.86385 10.8702L11.9902 10.8575L14.0825 7.82226C14.204 7.64525 14.204 7.41112 14.0811 7.23472L12.7748 5.35971C12.6519 5.18331 12.4325 5.10164 12.2242 5.15477Z" stroke="#36322d9e" stroke-width="1.2"/></svg>`;
  let html = `<div class="srch-section-hdr">${truckIcon}<span class="srch-section-label">Trucks</span></div>`;
  matches.forEach(t => {
    const primary = srchHighlight(t.num, q);
    const secondary = `${t.plant} · ${t.ver} · Ign ${t.ign}`;
    const truckIdx = trucks.indexOf(t);
    html += `<div class="srch-row" onclick="srchSelect(${truckIdx})"><span class="srch-match-text">${primary}</span><span class="srch-meta">${secondary}</span></div>`;
  });
  document.getElementById('srch-results').innerHTML = html;
}

function srchFilterWts(truckIdx) {
  const t = trucks[truckIdx];
  /* Temporarily override renderTrucks to show only this truck */
  const el = document.getElementById('truck-list');
  if (!el) return;
  const i = truckIdx;
  const isOpen = !!expanded[i];
  const badges = [
    (()=>{const _a=getTruckAlerts(t.num);return _a.err>0?`<span class="badge err"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="white" stroke-width="1"/><path d="M5 3v2.2M5 6.8h.01" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg>${_a.err}</span>`:''})(),
    (()=>{const _a=getTruckAlerts(t.num);return _a.wrn>0?`<span class="badge wrn"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1.5L9.5 8.5H.5L5 1.5z" stroke="#36322d" stroke-width="1" stroke-linejoin="round"/><path d="M5 4.5v1.5M5 7.5h.01" stroke="#36322d" stroke-width="1" stroke-linecap="round"/></svg>${_a.wrn}</span>`:''})(),
  ].join('');
  el.innerHTML = `<div>
    <div class="truck-row" style="background:var(--layer-1)" onclick="toggleTruck(${i})">
      <div class="td truck-num">${chevSvg(isOpen ? 180 : 90)}${t.num}</div>
      <div class="td src-cell">${t.source === 'Customer Ticket' ? 'Customer' : 'System'}</div>
      <div class="td">${t.ign}</div>
      <div class="td age-cell">${t.age}</div>
      <div class="td">${badges}</div>
    </div>
    <div class="exp-wrap"></div>
  </div>`;
}

function srchFilterOverview(truckIdx) {
  const t = trucks[truckIdx];
  const i = truckIdx;
  const isOpen = !!expandedOv[i];
  const _ca=getTruckAlerts(t.num);
  const badges = (_ca.err ? `<span class="badge err"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="white" stroke-width="1"/><path d="M5 3v2.2M5 6.8h.01" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg>${_ca.err}</span>` : '') +
                 (_ca.wrn ? `<span class="badge wrn"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1.5L9.5 8.5H.5L5 1.5z" stroke="#36322d" stroke-width="1" stroke-linejoin="round"/><path d="M5 4.5v1.5M5 7.5h.01" stroke="#36322d" stroke-width="1" stroke-linecap="round"/></svg>${_ca.wrn}</span>` : '');
  document.getElementById('truck-list-overview').innerHTML = `
    <div class="truck-wrap" style="background:var(--layer-1);">
      <div class="truck-row ov-row" onclick="toggleOv(${i})" style="grid-template-columns:74px 1fr 90px 82px;background:var(--layer-1);">
        <div class="td truck-num">${chevSvg(isOpen ? 180 : 90)}${t.num}</div>
        <div class="td" style="font-size:12px;line-height:1.25;">${t.plant}</div>
        <div class="td" style="font-size:13px;color:var(--strong);">${t.ign} · ${t.ignDetail}</div>
        <div class="td">${badges || '<span style="font-size:12px;color:var(--soft);">—</span>'}</div>
      </div>
    </div>`;
}

function srchFilterCC(truckNum) {
  const el = document.getElementById('cc-rows');
  if (!el) return;
  const ccIdx = CC_TRUCKS.findIndex(t => t.num === truckNum);
  if (ccIdx === -1) return;
  /* Temporarily render just this one row */
  const t = CC_TRUCKS[ccIdx];
  const i = ccIdx;
  const rowBg = '#ffffff';
  const _ca=getTruckAlerts(t.num);
  const badges = (_ca.err ? `<span class="badge err"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="white" stroke-width="1"/><path d="M5 3v2.2M5 6.8h.01" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg>${_ca.err}</span>` : '') +
                 (_ca.wrn ? `<span class="badge wrn"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1.5L9.5 8.5H.5L5 1.5z" stroke="#36322d" stroke-width="1" stroke-linejoin="round"/><path d="M5 4.5v1.5M5 7.5h.01" stroke="#36322d" stroke-width="1" stroke-linecap="round"/></svg>${_ca.wrn}</span>` : '');
  el.innerHTML = `
    <div class="truck-wrap" style="background:${rowBg};">
      <div class="truck-row ov-row" onclick="ccToggle(${i})" style="grid-template-columns:74px 1fr 1.4fr 90px;background:${rowBg};">
        <div class="td truck-num">${chevSvg(90)}${t.num}</div>
        <div class="td" style="font-size:13px;">${t.ver}</div>
        <div class="td" style="font-size:13px;color:var(--strong);">${t.ign} · ${t.ignDetail || '—'}</div>
        <div class="td">${badges || '<span style="font-size:12px;color:var(--soft);">—</span>'}</div>
      </div>
    </div>`;
}

/* Close dropdown on outside click */
document.addEventListener('click', function(e) {
  const wrap = document.getElementById('srch-wrap');
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById('srch-drop').style.display = 'none';
  }
});

/* ── MOBILE COMPONENT CARDS ─────────────────────────────────────────
   Dynamically renders the grid cards in #co-grid-mcs and #co-grid-fdm
   based on CC_TRUCKS data for the currently open truck. Called from
   renderConditions() so card state reflects replacement workflow.    */

function renderMobileCards() {
  var gridMcs = document.getElementById('co-grid-mcs');
  var gridFdm = document.getElementById('co-grid-fdm');
  if (!gridMcs) return;

  /* Find the open truck from the drawer header */
  var truckLabel = document.getElementById('drawer-truck-num');
  var truckNum = truckLabel ? truckLabel.textContent.replace('Truck: ', '').trim() : null;
  var cc = truckNum ? CC_TRUCKS.find(function(t) { return String(t.num) === String(truckNum); }) : null;

  /* Determine config from linked unit — drives which cards to show */
  var linkedUnit = truckNum ? UNITS_DATA.find(function(u) { return String(u.truck) === String(truckNum); }) : null;
  var unitConfig = linkedUnit ? linkedUnit.config : 'Measured Only';
  var isManaged  = unitConfig === 'Temp+ Admix' || unitConfig === 'Winter Water';
  var waterLabel = unitConfig === 'Winter Water' ? 'Winter Water' : 'Temperate Water';

  function buildMobileCard(card) {
    var state = card.forceAlarm ? 'alarm' : (card.warnCard ? 'warn' : (card.greyDot ? 'grey' : 'clean'));

    /* Check CC_TRUCKS state if not already overridden */
    if (!card.forceAlarm && !card.warnCard && !card.greyDot && card.state !== 'empty' && card.state !== 'pending') {
      if (cc && cc.components) {
        var ccName = CC_NAME_MAP[card.name] || card.name;
        var comp = cc.components.find(function(c){ return c.name===ccName; });
        if (comp) {
          if (comp.state === 'alarm') state = 'alarm';
          else if (comp.state === 'warn') state = 'warn';
        }
      }
    }

    /* Empty slot */
    if (card.state === 'empty') {
      return '<div class="co-card co-card--empty" onclick="if(!coReplaceActive) coInstallOpen(\'' + card.name + '\',\'' + (card.removedDate||'') + '\')" style="cursor:pointer;">'
        + '<div class="co-card-body">'
        + '<div class="co-card-head"><div style="width:14px;height:14px;flex-shrink:0;"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="2" stroke="rgba(54,50,45,0.3)" stroke-width="1.2" stroke-dasharray="3 2"/></svg></div><span style="color:var(--soft);">' + card.name + '</span></div>'
        + '<div class="co-desc-text" style="color:var(--soft);font-size:12px;">No component installed</div>'
        + (card.removedDate ? '<div class="co-desc-text" style="color:rgba(54,50,45,0.4);font-size:11px;">Removed ' + card.removedDate + '</div>' : '')
        + '<div style="flex:1;"></div>'
        + '<div style="color:var(--blue);font-weight:500;font-size:12px;letter-spacing:-0.24px;">Install replacement \u2192</div>'
        + '</div>'
        + '<div class="co-card-strip co-strip--empty"><span class="co-strip-label">Not installed</span></div>'
        + '</div>';
    }

    /* Pending verification */
    if (card.state === 'pending') {
      var serial = card.serial || (card.value || '--');
      return '<div class="co-card co-card--pending">'
        + '<div class="co-card-body">'
        + '<div class="co-card-head"><div style="width:12px;height:12px;border-radius:50%;background:#d97706;flex-shrink:0;"></div><span>' + card.name + '</span></div>'
        + '<div class="co-val-row"><span class="co-value" style="font-size:18px;letter-spacing:-0.36px;line-height:22px;">' + serial + '</span></div>'
        + '<div class="co-desc-text">Pending verification</div>'
        + '</div>'
        + '<div class="co-card-strip co-strip--pending"><span class="co-strip-dot"></span><span class="co-strip-label">Pending verification</span></div>'
        + '</div>';
    }

    /* All other states — unified new card */
    var dotColor = state === 'alarm' ? '#d70100' : state === 'warn' ? '#ffba0d' : state === 'grey' ? 'rgba(54,50,45,0.3)' : '#2ecf1d';
    var faultReason = coFaultReason(card.name, state);
    var stripLabel = state === 'alarm' ? ('Alarm \u00b7 ' + faultReason)
                   : state === 'warn'  ? ('Warning \u00b7 ' + faultReason)
                   : state === 'grey'  ? 'Not active'
                   : 'Operating normally';
    var stripDot = (state === 'alarm' || state === 'warn') ? '<span class="co-strip-dot"></span>' : '';
    var stripClass = 'co-strip--' + (state === 'clean' ? 'normal' : state);

    /* WDS alarm — value blank */
    if (card.name === 'WDS' && state === 'alarm') {
      card = Object.assign({}, card, { value:'--', err:'14' });
    }

    var isTcg = card.name === 'TCG';
    var valueHtml;
    if (isTcg) {
      valueHtml = '<span class="co-value" style="font-size:18px;letter-spacing:-0.36px;line-height:22px;">' + (card.value || 'TCG-1042') + '</span>';
    } else {
      var valColor = state === 'alarm' ? '#d70100' : state === 'warn' ? '#894f18' : 'var(--strong)';
      valueHtml = '<span class="co-value" style="color:' + valColor + ';">' + (card.value||'--') + '</span>'
        + (card.unit ? '<span class="co-unit">' + card.unit + '</span>' : '');
    }

    var cardClass = 'co-card' + (isTcg ? ' co-card-tcg' : '');
    var tcgBtn = isTcg
      ? '<button class="co-tcg-replace-btn" onclick="event.stopPropagation();coOpenTcgReplace(false);" title="Replace TCG" aria-label="Replace TCG"><svg width="13" height="13" viewBox="0 0 21 21" fill="none"><path d="M12.4513 5.05364C12.2681 5.24057 12.1655 5.49189 12.1655 5.75364C12.1655 6.01539 12.2681 6.26671 12.4513 6.45364L14.0513 8.05364C14.2382 8.23687 14.4896 8.3395 14.7513 8.3395C15.0131 8.3395 15.2644 8.23687 15.4513 8.05364L19.2213 4.28364C19.7242 5.39483 19.8764 6.63288 19.6578 7.83279C19.4392 9.0327 18.86 10.1375 17.9976 10.9999C17.1352 11.8624 16.0304 12.4415 14.8305 12.6601C13.6306 12.8787 12.3925 12.7265 11.2813 12.2236L4.37132 19.1336C3.9735 19.5315 3.43393 19.755 2.87132 19.755C2.30871 19.755 1.76914 19.5315 1.37132 19.1336C0.973496 18.7358 0.75 18.1962 0.75 17.6336C0.75 17.071 0.973496 16.5315 1.37132 16.1336L8.28132 9.22364C7.77848 8.11245 7.62624 6.87441 7.84486 5.6745C8.06349 4.47459 8.64261 3.3698 9.50504 2.50736C10.3675 1.64493 11.4723 1.06581 12.6722 0.847184C13.8721 0.628558 15.1101 0.780807 16.2213 1.28364L12.4613 5.04364L12.4513 5.05364Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
      : '';

    var descLine = (card.label || '').split('\n')[0] || '';
    var metaHtml = '';
    if (card.extra) metaHtml += '<div class="co-meta-row"><span>' + card.extra.label + ':</span><span>' + card.extra.val + '</span></div>';
    if (card.startup != null) metaHtml += '<div class="co-meta-row"><span>Startup Count:</span><span>' + card.startup + '</span></div>';
    if (card.err != null)     metaHtml += '<div class="co-meta-row"><span>Error Count:</span><span>' + card.err + '</span></div>';
    if (card.flowExtra) {
      metaHtml += '<div class="co-meta-row"><span>Flow Error:</span><span>' + card.flowExtra.error + '</span></div>'
        + '<div class="co-meta-row"><span>No Stop:</span><span>' + card.flowExtra.noStop + '</span></div>'
        + '<div class="co-meta-row"><span>Flow Rate:</span><span>' + card.flowExtra.rate + '</span></div>';
    }

    return '<div class="' + cardClass + '" data-comp="' + card.name + '">'
      + '<div class="co-card-body">'
      + '<div class="co-card-head"><div style="width:12px;height:12px;border-radius:50%;background:' + dotColor + ';flex-shrink:0;"></div><span>' + card.name + '</span>'
      + (!isTcg && card.fw ? '<span class="dt-ver-pill">' + card.fw + '</span>' : '')
      + tcgBtn
      + '</div>'
      + '<div class="co-val-row">' + valueHtml + '</div>'
      + '<div class="co-desc-group">'
      + (descLine ? '<div class="co-desc-text">' + descLine + '</div>' : '')
      + '<div class="co-meta">' + metaHtml + '</div>'
      + '</div>'
      + '</div>'
      + '<div class="co-card-strip ' + stripClass + (isTcg ? ' co-tcg-strip' : '') + '">' + stripDot
      + '<span class="co-strip-label co-tcg-strip-normal">' + stripLabel + '</span>'
      + (isTcg ? '<span class="co-strip-label co-tcg-strip-replace" style="display:none;">Replace separately</span>' : '')
      + '</div>'
      + '</div>';
  }


  /* MCS cards data — matches the hardcoded defaults + session state */
  var mcsCards = [
    /* Component order — per Martin's stated hierarchy at the post-commission
       readout (he ranked these without being asked, which means it's how he
       genuinely scans the screen in the field):
         TCG → DPS / CPS → WDS → component readings → Admix → ED last */
    { name:'TCG',           label:'Telematics Control Gateway', value:'Active', unit:'', startup:null, err:'--', extra:{label:'Status', val:'Connected'}, fw:(trucks.find(function(x){return String(x.num)===String(truckNum);})||{}).ver||'' },
    { name:'DPS pressure',  label:'Drum Pressure Sensor',     value:'196',  unit:'psi',    startup:2,  err:'--', extra:null },
    { name:'CPS',           label:'Charge Pressure Sensor',   value:'204',  unit:'psi',    startup:2,  err:'--', extra:null },
    { name:'WDS', label:'Water Drum Sensor', value:'12', unit:'rpm', startup:2, err:'--', flipBack:{ lastSeen:'Mar 23 · 08:24 AM' }, fw:'v2.1.4' },
    { name:'DRS',           label:'Drum Rotation Speed',      value:String(DRS_RPM[String(truckNum)] || 8), unit:'rpm',    startup:2,  err:'--', extra:null, fw:'v1.0.8' },
    { name:'CWR', label:'Cold Weather Relay',  value:'91', unit:'°F', startup:2, err:'--', extra:{label:'FW v35.0 · Tilt', val:'1°'}, fw:'v35.0' },
    { name:'ICD', label:'In-Cab Display', value:'Active', unit:'', startup:2, err:'--', extra:{label:'Firmware', val:'v1468'}, fw:'v1468' },
  ];
  if (isManaged) {
    mcsCards.push({ name:'Water Pump', label:waterLabel, value:String(WATER_GPM[String(truckNum)] || 17), unit:'gal/min', startup:1, err:'0', fw:'v4.2.1' });
    mcsCards.push({ name:'Admix Pump', label:'Admixture Pump', value:'145', unit:'ml/s', startup:1, err:'0', fw:'v4.2.1' });
  }
  mcsCards.push({ name:'ED', label:'External Display', value:'Active', unit:'', startup:2, err:'--', extra:{label:'Firmware', val:'v8195'}, fw:'v8195' });
  var fdmCards = [
    { name:'IOX supply voltage',    label:'Onboard Power Supply',  value:'12.9', unit:'V', startup:1, err:'--', extra:{label:'Temperature', val:'113 °F'} },
  ];
  if (isManaged) {
    fdmCards.push({ name:'Water meter flow rate', label:waterLabel + ' flow to drum', value:String(WATER_GPM[String(truckNum)] || 17), unit:'gal/min', startup:null, err:null, flowExtra:{error:1, noStop:0, rate:String(WATER_GPM[String(truckNum)] || 17)+' gal/min'}, warnCard:WATER_GPM[String(truckNum)] < 16 && WATER_GPM[String(truckNum)] >= 10, forceAlarm:WATER_GPM[String(truckNum)] < 10 });
    fdmCards.push({ name:'Admix meter flow rate', label:'Admixture Dosing meter', value:'145', unit:'ml/s', startup:null, err:null, flowExtra:{error:0, noStop:0, rate:'142 ml/s'} });
  }

  /* Apply session state overrides — same logic as desktop buildCard */
  function applyOverrides(card) {
    var name = card.name;
    /* Confirmed — clear all overrides */
    if (window.dtConfirmedComponents && window.dtConfirmedComponents[name]) {
      var def = window.dtConfirmedComponents[name];
      return Object.assign({}, card, {
        state:null, forceAlarm:false, greyDot:false, warnCard:false, flipBack:null,
        value: (typeof def==='object' && def.value) ? def.value : card.value,
        unit:  (typeof def==='object' && def.unit)  ? def.unit  : card.unit,
        label: (typeof def==='object' && def.label) ? def.label : card.label,
      });
    }
    /* Session removed */
    if (window.dtRemovedComponents && window.dtRemovedComponents[name]) {
      return { name:name, state:'empty', removedDate:window.dtRemovedComponents[name] };
    }
    if (window.moRemovedCards && window.moRemovedCards[name]) {
      return { name:name, state:'empty', removedDate:window.moRemovedCards[name] };
    }
    /* Session pending install */
    if (window.dtPendingComponents && window.dtPendingComponents[name]) {
      var p = window.dtPendingComponents[name];
      return { name:name, state:'pending', value:p.serial, unit:'', label:'Installed '+p.installedDate };
    }
    if (window.moPendingCards && window.moPendingCards[name]) {
      var p = window.moPendingCards[name];
      return { name:name, state:'pending', value:p.serial, unit:'', label:'Installed '+p.installedDate };
    }
    /* CC_TRUCKS state lookup — apply to all cards via name map */
    if (cc && cc.components) {
      var ccName = CC_NAME_MAP[name] || name;
      var comp = cc.components.find(function(c){ return c.name===ccName; });
      if (comp) {
        if (comp.state==='empty')   return Object.assign({},card,{state:'empty',   removedDate:comp.removedDate});
        if (comp.state==='pending') return Object.assign({},card,{state:'pending', value:comp.serial||card.value, label:card.label});
        if (comp.state==='alarm')   return Object.assign({},card,{forceAlarm:true,  warnCard:false, label: name==='WDS' ? 'Water Drum Sensor\nNo connection' : card.label, value: name==='WDS' ? '--' : card.value, err: name==='WDS' ? '14' : card.err });
        if (comp.state==='warn')    return Object.assign({},card,{forceAlarm:false, warnCard:true});
        if (comp.state==='clean')   return Object.assign({},card,{forceAlarm:false, warnCard:false});
      }
    }
    return card;
  }

  gridMcs.innerHTML = mcsCards.map(function(c){ return buildMobileCard(applyOverrides(c)); }).join('');
  if (gridFdm) gridFdm.innerHTML = fdmCards.map(function(c){ return buildMobileCard(applyOverrides(c)); }).join('');

  /* Re-wire replace mode handlers if active */
  if (coReplaceActive) {
    document.querySelectorAll('#co-scroll .co-card').forEach(function(card) {
      var nameEl = card.querySelector('.co-card-head span');
      if (!nameEl) return;
      var compName = nameEl.textContent.trim();
      card._coReplaceHandler = function(e) { e.stopPropagation(); e.preventDefault(); coMobileCardTap(card, compName); };
      card.addEventListener('click', card._coReplaceHandler, true);
      card.style.cursor = 'pointer';
    });
  }
}

function renderConditions() {
  const el = document.getElementById('cc-rows');
  if (!el) return;
  let html = '';

  CC_TRUCKS.forEach((t, i) => {
    /* find matching truck for filter check */
    const truckData = trucks.find(tr => tr.num === t.num);
    if (truckData && !filterMatch(truckData)) return;
    const isOpen = !!ccExpanded[i];
    const rowBg  = i % 2 === 0 ? '#ffffff' : '#f6f4f2';
    const isUnlinked = truckData && truckData.unlinked;
    const badges = isUnlinked
      ? UNLINKED_TRUCK_PILL
      : (()=>{const _a=getTruckAlerts(t.num);return (_a.err?`<span class="badge err"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="white" stroke-width="1"/><path d="M5 3v2.2M5 6.8h.01" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg>${_a.err}</span>`:'') + (_a.wrn?`<span class="badge wrn"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1.5L9.5 8.5H.5L5 1.5z" stroke="#36322d" stroke-width="1" stroke-linejoin="round"/><path d="M5 4.5v1.5M5 7.5h.01" stroke="#36322d" stroke-width="1" stroke-linecap="round"/></svg>${_a.wrn}</span>`:'');})();

    // Build component status rows for the expanded section
    const compRows = t.components.map(c => {
      if (c.state === 'empty') {
        return `<div class="cc-comp-row cc-comp-row--empty" onclick="if(!coReplaceActive) coInstallOpen('${c.name}','${c.removedDate||''}')" style="cursor:pointer;">
          <div class="cc-comp-row-left">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style="flex-shrink:0;margin-top:1px;"><rect x="0.5" y="0.5" width="7" height="7" rx="1.5" stroke="rgba(54,50,45,0.3)" stroke-width="1" stroke-dasharray="2 1.5"/></svg>
            <span class="cc-comp-row-name" style="color:var(--soft);">${c.name}</span>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:1px;">
            <span class="cc-comp-row-evt" style="color:var(--blue);font-weight:500;">Tap to install →</span>
            ${c.removedDate ? `<span style="font-size:10px;color:rgba(54,50,45,0.4);">Removed ${c.removedDate}</span>` : ''}
          </div>
        </div>`;
      }
      if (c.state === 'pending') {
        const _dark = document.body.classList.contains('dark');
        const pendDot = _dark ? '#ffba0d' : '#d97706';
        const pendTxt = _dark ? '#ffffff' : '#92400e';
        const pendSub = _dark ? 'rgba(255,255,255,0.4)' : 'rgba(54,50,45,0.5)';
        return `<div class="cc-comp-row cc-comp-row--pending">
          <div class="cc-comp-row-left">
            <div style="width:8px;height:8px;border-radius:50%;background:${pendDot};flex-shrink:0;margin-top:1px;"></div>
            <span class="cc-comp-row-name">${c.name}</span>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:1px;">
            <span class="cc-comp-row-evt" style="color:${pendTxt};font-weight:500;">Pending verification</span>
            ${c.serial ? `<span style="font-size:10px;color:${pendSub};">${c.serial}</span>` : ''}
          </div>
        </div>`;
      }
      const evtColor = c.state === 'alarm' ? '#d70100' :
                       c.state === 'warn'  ? '#b07800' : 'var(--soft)';
      const evtWeight = c.state !== 'clean' ? '500' : '400';
      return `<div class="cc-comp-row">
        <div class="cc-comp-row-left">
          <div style="width:8px;height:8px;border-radius:50%;background:${c.dot};flex-shrink:0;margin-top:1px;"></div>
          <span class="cc-comp-row-name">${c.name}</span>
        </div>
        <span class="cc-comp-row-evt" style="color:${evtColor};font-weight:${evtWeight};">${c.evt}</span>
      </div>`;
    }).join('');

    const expHtml = isOpen ? `
      <div class="exp-wrap open" data-cc-idx="${i}" style="padding-bottom:15px;background:${rowBg};">
        <div class="exp-row"><div class="exp-label">Plant</div><div class="exp-val">${t.plant || 'Phoenix Central'}</div></div>
        <div class="exp-row"><div class="exp-label">Last Connection</div><div class="exp-val">${t.lastConn || '1:16 PM 07/23/25'}</div></div>
        <div class="cc-comp-section-hdr">Components</div>
        <div class="cc-comp-list">${compRows}</div>
        <button class="view-truck-btn" onclick="openDrawerFromCC(event,${i})">View Truck</button>
      </div>` : '';

    html += `
      <div class="truck-wrap" style="background:${rowBg};">
        <div class="truck-row ov-row" onclick="ccToggle(${i})" style="grid-template-columns:74px 1fr 1.4fr 90px;background:${rowBg};">
          <div class="td truck-num">
            ${chevSvg(isOpen ? 180 : 90)}
            ${t.num}
          </div>
          <div class="td" style="font-size:13px;">${t.ver}</div>
          <div class="td" style="font-size:13px;color:var(--strong);">${t.ign} · ${t.ignDetail || '—'}</div>
          <div class="td">${badges || '<span style="font-size:12px;color:var(--soft);">—</span>'}</div>
        </div>
        ${expHtml}
      </div>`;
  });

  el.innerHTML = html;
  el.innerHTML = html;
  /* Also refresh mobile grid cards */
  renderMobileCards();
}

function ccToggle(i) {
  ccExpanded[i] = !ccExpanded[i];
  renderConditions();
  if (ccExpanded[i]) {
    setTimeout(() => {
      const row = document.querySelector(`[data-cc-idx="${i}"]`);
      if (row) {
        const scrollBody = document.querySelector('#s-main .scroll-body');
        if (scrollBody) {
          const rowBottom = row.getBoundingClientRect().bottom;
          const containerBottom = scrollBody.getBoundingClientRect().bottom;
          if (rowBottom > containerBottom - 10) {
            scrollBody.scrollBy({ top: rowBottom - containerBottom + 10, behavior: 'smooth' });
          }
        }
      }
    }, 50);
  }
}

function openDrawerFromCC(e, ccIdx) {
  e.stopPropagation();
  /* Map CC_TRUCKS index to trucks[] index by truck number */
  const truckNum = CC_TRUCKS[ccIdx].num;
  const truckIdx = trucks.findIndex(t => t.num === truckNum);
  const idx = truckIdx >= 0 ? truckIdx : 0;
  /* Build CC list: all CC_TRUCKS mapped to their trucks[] indices */
  const ccList = CC_TRUCKS.map(ct => trucks.findIndex(t => t.num === ct.num)).filter(n => n >= 0);
  const posInList = ccList.indexOf(idx);
  openDrawer(idx, { list: ccList, idx: posInList >= 0 ? posInList : 0 });
}


/* ══════════════════════════════════════════════════
   CHUNK 2 — REPLACE COMPONENTS MODE
   Shared state; mobile uses co- prefix, desktop dt- prefix
   Both call the same underlying logic. No data mutation yet.
═══════════════════════════════════════════════════ */

var coReplaceActive = false;
var coSelectedCards = new Set();

function coReplaceUpdateBar() {
  var count  = coSelectedCards.size;
  var plural = count === 1 ? '' : 's';
  var hasAny = count > 0;

  // Mobile bar
  var bar   = document.getElementById('co-replace-bar');
  var cntEl = document.getElementById('co-replace-count');
  var plEl  = document.getElementById('co-replace-plural');
  var conf  = document.getElementById('co-replace-confirm');
  if (bar)   bar.classList.toggle('visible', coReplaceActive);
  if (cntEl) cntEl.textContent = count;
  if (plEl)  plEl.textContent  = plural;
  if (conf)  { conf.classList.toggle('enabled', hasAny); conf.style.opacity = hasAny ? '1' : '0.4'; }

  // Desktop bar
  var dtBar  = document.getElementById('dt-replace-bar');
  var dtCnt  = document.getElementById('dt-replace-count');
  var dtPl   = document.getElementById('dt-replace-plural');
  var dtConf = document.getElementById('dt-replace-confirm');
  if (dtBar)  dtBar.classList.toggle('visible', coReplaceActive);
  if (dtCnt)  dtCnt.textContent = count;
  if (dtPl)   dtPl.textContent  = plural;
  if (dtConf) dtConf.style.opacity = hasAny ? '1' : '0.4';
}

function coReplaceEnter(btnId, scrollId, cardSelector) {
  coReplaceActive = true;
  coSelectedCards.clear();
  var btn    = document.getElementById(btnId);
  var scroll = document.getElementById(scrollId);
  if (btn)    { btn.classList.add('active'); btn.textContent = '✕  Cancel'; }
  if (scroll) scroll.classList.add(scrollId === 'co-scroll' ? 'co-replace-mode' : 'dt-replace-mode');
  // Show hint
  var hint = document.getElementById(btnId === 'co-replace-btn' ? 'co-replace-hint' : 'dt-replace-hint');
  if (hint) hint.style.display = 'inline-flex';
  // Wire click handlers on mobile co-cards
  if (scrollId === 'co-scroll') {
    document.querySelectorAll('#co-scroll .co-card').forEach(function(card) {
      /* Extract component name */
      var nameEl = card.querySelector('.co-card-head span')
                || card.querySelector('.co-card-front .co-card-head span');
      if (!nameEl) return;
      var compName = nameEl.textContent.trim();
      card._coReplaceHandler = function(e) {
        e.stopPropagation();
        e.preventDefault();
        coMobileCardTap(card, compName);
      };
      card.addEventListener('click', card._coReplaceHandler, true);
      card.style.cursor = 'pointer';
    });
  }
  coReplaceUpdateBar();
}

function coMobileCardTap(card, compName) {
  if (!coReplaceActive) return;
  /* TCG is the unit's brain — it has its own dedicated replace flow.
     Never folded into a multi-component swap. */
  if (compName === 'TCG') return;
  card.classList.toggle('co-selected');
  if (card.classList.contains('co-selected')) coSelectedCards.add(compName);
  else coSelectedCards.delete(compName);
  coReplaceUpdateBar();
}

function coReplaceExit(btnId, scrollId, cardSelector, btnOrigHTML) {
  coReplaceActive = false;
  coSelectedCards.clear();
  var btn    = document.getElementById(btnId);
  var scroll = document.getElementById(scrollId);
  if (btn)    { btn.classList.remove('active'); btn.innerHTML = btnOrigHTML; }
  if (scroll) { scroll.classList.remove('co-replace-mode'); scroll.classList.remove('dt-replace-mode'); }
  document.querySelectorAll(cardSelector).forEach(function(c) { c.classList.remove('co-selected'); });
  // Unwire mobile card click handlers
  if (scrollId === 'co-scroll') {
    document.querySelectorAll('#co-scroll .co-card').forEach(function(card) {
      if (card._coReplaceHandler) {
        card.removeEventListener('click', card._coReplaceHandler, true);
        delete card._coReplaceHandler;
        card.style.cursor = '';
      }
    });
  }
  // Hide hint
  var hint = document.getElementById(btnId === 'co-replace-btn' ? 'co-replace-hint' : 'dt-replace-hint');
  if (hint) hint.style.display = 'none';
  coReplaceUpdateBar();
}


var CO_REPLACE_BTN_HTML = '<svg width="14" height="14" viewBox="0 0 21 21" fill="none"><path d="M12.4513 5.05364C12.2681 5.24057 12.1655 5.49189 12.1655 5.75364C12.1655 6.01539 12.2681 6.26671 12.4513 6.45364L14.0513 8.05364C14.2382 8.23687 14.4896 8.3395 14.7513 8.3395C15.0131 8.3395 15.2644 8.23687 15.4513 8.05364L19.2213 4.28364C19.7242 5.39483 19.8764 6.63288 19.6578 7.83279C19.4392 9.0327 18.86 10.1375 17.9976 10.9999C17.1352 11.8624 16.0304 12.4415 14.8305 12.6601C13.6306 12.8787 12.3925 12.7265 11.2813 12.2236L4.37132 19.1336C3.9735 19.5315 3.43393 19.755 2.87132 19.755C2.30871 19.755 1.76914 19.5315 1.37132 19.1336C0.973496 18.7358 0.75 18.1962 0.75 17.6336C0.75 17.071 0.973496 16.5315 1.37132 16.1336L8.28132 9.22364C7.77848 8.11245 7.62624 6.87441 7.84486 5.6745C8.06349 4.47459 8.64261 3.3698 9.50504 2.50736C10.3675 1.64493 11.4723 1.06581 12.6722 0.847184C13.8721 0.628558 15.1101 0.780807 16.2213 1.28364L12.4613 5.04364L12.4513 5.05364Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Replace Components';

/* Mobile */
function coReplaceToggle() {
  if (coReplaceActive) { coReplaceCancel(); return; }
  coReplaceEnter('co-replace-btn', 'co-scroll', '#co-scroll .co-card');
}

function coReplaceCancel() {
  coReplaceExit('co-replace-btn', 'co-scroll', '#co-scroll .co-card', CO_REPLACE_BTN_HTML);
}
function makeBulletList(names) {
  return names.map(function(n){
    return '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;">'
      + '<div style="width:6px;height:6px;border-radius:50%;background:#d97706;flex-shrink:0;"></div>'
      + '<span style="font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.26px;">' + n + '</span>'
      + '</div>';
  }).join('');
}

function coReplaceConfirm() {
  if (coSelectedCards.size === 0) return;
  var names = Array.from(coSelectedCards);
  var bullets = makeBulletList(names);
  var existing = document.getElementById('co-remove-confirm-overlay');
  if (existing) existing.remove();
  var bar = document.createElement('div');
  bar.id = 'co-remove-confirm-overlay';
  bar.style.cssText = 'position:absolute;left:0;right:0;bottom:0;z-index:50;background:var(--layer-1);border-top:1px solid var(--border);padding:16px 16px 36px;box-shadow:0 -8px 24px rgba(54,50,45,0.12);animation:dtInlineConfirmIn 0.2s cubic-bezier(0.4,0,0.2,1);';
  bar.innerHTML = '<div style="font-size:15px;font-weight:500;color:var(--strong);letter-spacing:-0.3px;margin-bottom:4px;">Remove components?</div>'
    + '<div style="font-size:13px;color:var(--soft);letter-spacing:-0.26px;margin-bottom:8px;">Are these physically off the truck?</div>'
    + '<div style="border-top:1px solid var(--border);padding-top:8px;margin-bottom:16px;">' + bullets + '</div>'
    + '<div style="display:flex;flex-direction:column;gap:8px;">'
    + '<button onclick="coReplaceDoRemove()" style="background:#d97706;color:white;border:none;border-radius:32px;padding:13px;font-size:14px;font-weight:500;font-family:var(--font);letter-spacing:-0.28px;cursor:pointer;width:100%;">Yes, remove from system</button>'
    + '<button onclick="document.getElementById(&#39;co-remove-confirm-overlay&#39;).remove()" style="background:none;border:1px solid var(--border-mid);border-radius:32px;padding:13px;font-size:14px;font-weight:500;font-family:var(--font);letter-spacing:-0.28px;color:var(--strong);cursor:pointer;width:100%;">Cancel</button>'
    + '</div>';
  var sc = document.getElementById('state-components');
  if (sc) { sc.style.position = 'relative'; sc.appendChild(bar); }
}

function coReplaceDoRemove() {
  var overlay = document.getElementById('co-remove-confirm-overlay');
  if (overlay) overlay.remove();

  var now = new Date();
  var dateStr = (now.getMonth()+1) + '/' + now.getDate() + '/' + String(now.getFullYear()).slice(-2)
    + ' · ' + now.toLocaleTimeString('en-US', {hour:'numeric',minute:'2-digit'});

  if (!window.moRemovedCards) window.moRemovedCards = {};

  coSelectedCards.forEach(function(compName) {
    /* Track in session state so renderMobileCards picks it up */
    window.moRemovedCards[compName] = dateStr;
    /* Also update CC_TRUCKS where component exists */
    CC_TRUCKS.forEach(function(t) {
      if (!t.components) return;
      var comp = t.components.find(function(c) { return c.name === compName; });
      if (comp) {
        comp.state = 'empty'; comp.evt = 'Not installed';
        comp.dot = 'rgba(54,50,45,0.2)'; comp.removedDate = dateStr;
      }
    });
  });

  coReplaceCancel();
  renderConditions();
}

/* Desktop */
function dtReplaceToggle() {
  if (coReplaceActive) { dtReplaceCancel(); return; }
  coReplaceEnter('dt-replace-btn', 'dt-drawer-scroll', '#dt-drawer-scroll .dt-co-card');
}
function dtReplaceCardTap(el, idx) {
  if (!coReplaceActive) return;
  /* TCG is the unit's brain — replaced through its own dedicated flow */
  if (idx === 'TCG') return;
  el.classList.toggle('co-selected');
  if (el.classList.contains('co-selected')) coSelectedCards.add(idx);
  else coSelectedCards.delete(idx);
  coReplaceUpdateBar();
}
function dtReplaceCancel() {
  coReplaceExit('dt-replace-btn', 'dt-drawer-scroll', '#dt-drawer-scroll .dt-co-card', CO_REPLACE_BTN_HTML);
}

function dtReplaceConfirm() {
  if (coSelectedCards.size === 0) return;
  var names = Array.from(coSelectedCards);
  var bullets = makeBulletList(names);
  var existing = document.getElementById('dt-remove-confirm-overlay');
  if (existing) existing.remove();
  var main = document.getElementById('dt-drawer-main');
  if (!main) return;
  var bar = document.createElement('div');
  bar.id = 'dt-remove-confirm-overlay';
  bar.style.cssText = 'position:absolute;left:0;right:0;bottom:0;z-index:50;background:var(--layer-1);border-top:1px solid var(--border);padding:16px 24px 24px;box-shadow:0 -8px 24px rgba(54,50,45,0.1);animation:dtInlineConfirmIn 0.2s cubic-bezier(0.4,0,0.2,1);';
  bar.innerHTML = '<div style="font-size:14px;font-weight:500;color:var(--strong);letter-spacing:-0.28px;margin-bottom:4px;">Remove components?</div>'
    + '<div style="font-size:13px;color:var(--soft);letter-spacing:-0.26px;margin-bottom:8px;">Are these physically off the truck?</div>'
    + '<div style="border-top:1px solid var(--border);padding-top:6px;margin-bottom:12px;">' + bullets + '</div>'
    + '<div style="display:flex;gap:8px;">'
    + '<button onclick="document.getElementById(&#39;dt-remove-confirm-overlay&#39;).remove()" style="flex:1;background:none;border:1px solid var(--border-mid);border-radius:32px;padding:9px 16px;font-size:13px;font-weight:500;font-family:var(--font);letter-spacing:-0.26px;color:var(--strong);cursor:pointer;">Cancel</button>'
    + '<button onclick="dtReplaceDoRemove()" style="flex:2;background:#d97706;color:white;border:none;border-radius:32px;padding:9px 16px;font-size:13px;font-weight:500;font-family:var(--font);letter-spacing:-0.26px;cursor:pointer;">Yes, remove from system</button>'
    + '</div>';
  main.style.position = 'relative';
  main.appendChild(bar);
}

/* Track desktop component removals so they persist across dtOpenTruck rebuilds */
var dtRemovedComponents = {}; /* { compName: removedDate } */

function dtReplaceDoRemove() {
  var el = document.getElementById('dt-remove-confirm-overlay');
  if (el) el.remove();

  var now = new Date();
  var dateStr = (now.getMonth()+1) + '/' + now.getDate() + '/' + String(now.getFullYear()).slice(-2)
    + ' · ' + now.toLocaleTimeString('en-US', {hour:'numeric',minute:'2-digit'});

  coSelectedCards.forEach(function(compName) {
    // Store removal so buildCard uses empty state on next rebuild
    dtRemovedComponents[compName] = dateStr;
    // Also update CC_TRUCKS for consistency across views
    CC_TRUCKS.forEach(function(t) {
      if (!t.components) return;
      var comp = t.components.find(function(c) { return c.name === compName; });
      if (comp) {
        comp.state = 'empty'; comp.evt = 'Not installed';
        comp.dot = 'rgba(54,50,45,0.2)'; comp.removedDate = dateStr;
      }
    });
  });

  dtReplaceCancel();
  // Rebuild overview — buildCard will check dtRemovedComponents
  if (dtDrawerTruckNum) dtOpenTruck(dtDrawerTruckNum);
}

/* Reset replace mode on drawer tab switch */
(function() {
  var _orig = window.dtDrawerTab;
  if (typeof _orig === 'function') {
    window.dtDrawerTab = function(tab, el) {
      if (coReplaceActive) dtReplaceCancel();
      _orig(tab, el);
    };
  }
})();

/* ══════════════════════════════════════════════════
   CHUNK 4 — INSTALL REPLACEMENT FLOW
═══════════════════════════════════════════════════ */

/* ── Install replacement panel ─────────────────────────────────────────────
   Persistent frame: header + body + Cancel/Confirm footer.
   Body swaps between three states without rebuilding the frame:
     1. scanning  (default — TCG looks for nearby component, ~2.5s)
     2. found     (serial auto-populates, Confirm enables)
     3. manual    (user typed serial, accessed via small "+" link)

   Per Martin: "nearby" is the explicit terminology — auto-discovery is the
   norm, manual is the secondary fallback path.
──────────────────────────────────────────────────────────────────────────── */
var MOCK_SERIALS = {
  'WDS':            'WDS-48291',
  'CPS':            'CPS-73042',
  'DPS pressure':   'DPS-19204',
  'DRS':            'DRS-55817',
  'CWR (35.0) temperature': 'CWR-30042',
  'ICD (1468)':     'ICD-14680',
  'ED (8195)':      'ED-81950',
  'Water Pump':     'WP-44210',
  'Admix Pump':     'AP-22834',
  'TCG':            'TCG-38291',
};

/* Build the persistent panel frame. Body slot is empty — filled by state functions. */
function coBuildInstallFrame(compName, isMobile) {
  return ''
    /* Header */
    + '<div style="margin-bottom:14px;">'
    +   '<div style="font-size:15px;font-weight:500;color:var(--strong);letter-spacing:-0.3px;margin-bottom:3px;">Install replacement</div>'
    +   '<div style="font-size:13px;color:var(--soft);letter-spacing:-0.26px;">Installing new <strong style="color:var(--strong);font-weight:600;">' + compName + '</strong></div>'
    + '</div>'
    /* Body — swappable */
    + '<div id="co-install-body" style="margin-bottom:14px;"></div>'
    /* Footer — Cancel + Confirm side-by-side, persistent */
    + '<div style="display:flex;gap:8px;">'
    +   '<button onclick="coInstallCancel()" style="flex:0 0 auto;min-width:110px;background:none;border:1px solid var(--border);border-radius:32px;padding:12px 20px;font-size:14px;font-weight:500;font-family:var(--font);letter-spacing:-0.28px;color:var(--strong);cursor:pointer;">Cancel</button>'
    +   '<button id="co-install-confirm-btn" onclick="coInstallConfirmClick(' + (isMobile?'true':'false') + ')" disabled style="flex:1;background:'+coPrimaryBtnBg()+';color:'+coPrimaryBtnColor()+';border:none;border-radius:32px;padding:12px;font-size:14px;font-weight:500;font-family:var(--font);letter-spacing:-0.28px;cursor:pointer;opacity:0.4;transition:opacity 0.15s;">Confirm Installation</button>'
    + '</div>';
}

/* ── State 1: scanning ── */
function coRenderScanning(compName) {
  var body = document.getElementById('co-install-body');
  if (!body) return;
  body.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:center;gap:32px;padding:8px 0;">'
      /* Radar — left */
    + '<div style="position:relative;width:64px;height:64px;flex-shrink:0;">'
    +   '<div class="co-scan-ring co-scan-ring-1"></div>'
    +   '<div class="co-scan-ring co-scan-ring-2"></div>'
    +   '<div class="co-scan-ring co-scan-ring-3"></div>'
    +   '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">'
    +     '<div style="width:10px;height:10px;border-radius:50%;background:'+coPrimaryBtnBg()+';"></div>'
    +   '</div>'
    + '</div>'
      /* Text stack — right */
    + '<div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;">'
    +   '<div style="font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.26px;">Scanning for nearby ' + compName + '…</div>'
    +   '<div style="font-size:12px;color:var(--soft);letter-spacing:-0.24px;">TCG is looking nearby</div>'
    +   '<button onclick="coRenderManual()" style="background:none;border:none;padding:0;margin-top:4px;font-size:12px;font-weight:500;font-family:var(--font);letter-spacing:-0.24px;color:var(--blue-link);cursor:pointer;">+ Enter serial manually</button>'
    + '</div>'
    + '</div>';
  coSetConfirmEnabled(false);
}

/* ── State 2: found ── */
function coRenderFound(compName, serial) {
  var body = document.getElementById('co-install-body');
  if (!body) return;
  var dark = document.body.classList.contains('dark');
  var cardBg     = dark ? 'rgba(46,207,29,0.12)'  : 'rgba(22,163,74,0.06)';
  var cardBorder = dark ? 'rgba(46,207,29,0.3)'   : 'rgba(22,163,74,0.25)';
  var iconBg     = dark ? 'rgba(46,207,29,0.18)'  : 'rgba(22,163,74,0.15)';
  var iconStroke = dark ? '#2ecf1d'               : '#16a34a';
  var labelColor = dark ? '#5de054'               : '#16a34a';
  body.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;padding:14px 14px;background:'+cardBg+';border:1px solid '+cardBorder+';border-radius:10px;">'
    + '<div style="width:32px;height:32px;border-radius:50%;background:'+iconBg+';display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
    +   '<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="'+iconStroke+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    + '</div>'
    + '<div style="flex:1;min-width:0;">'
    +   '<div style="font-size:11px;font-weight:600;color:'+labelColor+';letter-spacing:0.3px;text-transform:uppercase;margin-bottom:2px;">Found nearby</div>'
    +   '<div style="font-size:14px;font-weight:600;color:var(--strong);font-family:\'DM Mono\', monospace;letter-spacing:0.2px;" id="co-scan-serial">' + serial + '</div>'
    + '</div>'
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:0 4px;">'
    +   '<button onclick="coRenderScanning(\'' + compName.replace(/'/g,"\\'") + '\');coStartScanTimer(\'' + compName.replace(/'/g,"\\'") + '\')" style="background:none;border:none;padding:0;font-size:12px;font-weight:500;font-family:var(--font);letter-spacing:-0.24px;color:var(--soft);cursor:pointer;">Not this one? Scan again</button>'
    +   '<button onclick="coRenderManual()" style="background:none;border:none;padding:0;font-size:12px;font-weight:500;font-family:var(--font);letter-spacing:-0.24px;color:var(--blue-link);cursor:pointer;">Enter manually</button>'
    + '</div>';
  body.dataset.serial = serial;
  body.dataset.mode = 'scanned';
  coSetConfirmEnabled(true);
}

/* ── State 3: manual ── */
function coRenderManual() {
  var body = document.getElementById('co-install-body');
  if (!body) return;
  var bar = document.getElementById('co-install-bar');
  var compName = bar ? bar.dataset.compName : '';
  var isTcg = coIsTcgReplaceMode();
  body.innerHTML =
    '<label style="font-size:11px;font-weight:600;color:var(--soft);letter-spacing:0.3px;text-transform:uppercase;display:block;margin-bottom:6px;">' + (isTcg ? 'TCG Serial Number' : 'Serial Number') + '</label>'
    + '<input id="co-install-serial" type="text" placeholder="' + (isTcg ? 'e.g. TCG-38291' : 'e.g. WP-4421') + '" autocomplete="off" maxlength="20" oninput="coManualInput(this)" style="width:100%;box-sizing:border-box;padding:11px 13px;border:1px solid var(--border);border-radius:8px;font-size:14px;font-family:var(--font);color:var(--strong);letter-spacing:-0.28px;outline:none;"/>'
    + (isTcg
        ? '<div style="font-size:11px;color:var(--subtle);letter-spacing:-0.22px;margin-top:8px;padding:0 4px;">TCG serials must be entered manually — the new unit can\'t scan for itself.</div>'
        : '<div style="margin-top:10px;padding:0 4px;">'
          +   '<button onclick="coRenderScanning(\'' + compName.replace(/'/g,"\\'") + '\');coStartScanTimer(\'' + compName.replace(/'/g,"\\'") + '\')" style="background:none;border:none;padding:0;font-size:12px;font-weight:500;font-family:var(--font);letter-spacing:-0.24px;color:var(--blue-link);cursor:pointer;">← Scan for nearby ' + compName + '</button>'
          + '</div>'
      );
  body.dataset.mode = 'manual';
  body.dataset.serial = '';
  coSetConfirmEnabled(false);
  setTimeout(function(){ var i = document.getElementById('co-install-serial'); if (i) i.focus(); }, 80);
}

/* Manual input handler — enables Confirm when value present */
function coManualInput(inp) {
  var body = document.getElementById('co-install-body');
  var v = inp.value.trim();
  if (body) body.dataset.serial = v;
  coSetConfirmEnabled(v.length > 0);
}

function coSetConfirmEnabled(on) {
  var btn = document.getElementById('co-install-confirm-btn');
  if (!btn) return;
  btn.disabled = !on;
  btn.style.opacity = on ? '1' : '0.4';
}

/* Kick off the scan timer — runs only once per scan, finds on first try */
function coStartScanTimer(compName) {
  /* Clear any existing timer */
  if (window._coScanTimer) { clearTimeout(window._coScanTimer); window._coScanTimer = null; }
  var serial = MOCK_SERIALS[compName] || (compName.replace(/\s+/g,'-').toUpperCase() + '-00001');
  window._coScanTimer = setTimeout(function() {
    var body = document.getElementById('co-install-body');
    if (!body) return;
    /* Only render found if we're still in scanning state (user may have switched to manual) */
    var scanning = body.querySelector('.co-scan-ring');
    if (!scanning) return;
    coRenderFound(compName, serial);
  }, 2500);
}

/* Confirm button — works for both scanned and manual modes */
function coInstallConfirmClick(isMobile) {
  var body = document.getElementById('co-install-body');
  if (!body) return;
  var serial = (body.dataset.serial || '').trim();
  if (!serial) return;
  /* TCG replace mode — route to reconnection animation instead of regular install */
  if (coIsTcgReplaceMode()) {
    coTcgConfirmInstall(serial, !isMobile);
    return;
  }
  if (isMobile) coInstallConfirmScanned(serial);
  else dtInstallConfirmScanned(serial);
}

/* Cancel — close the panel and clear scan timer */
function coInstallCancel() {
  if (window._coScanTimer) { clearTimeout(window._coScanTimer); window._coScanTimer = null; }
  var bar = document.getElementById('co-install-bar');
  if (bar) bar.remove();
}

/* Entry point — opens the panel in scanning state */
function coStartScan(compName, isMobile) {
  var bar = document.getElementById('co-install-bar');
  if (!bar) return;
  bar.dataset.compName = compName;
  bar.innerHTML = coBuildInstallFrame(compName, isMobile);
  coRenderScanning(compName);
  coStartScanTimer(compName);
}

/* Mobile — open from empty comp row */
function coInstallOpen(compName, removedDate) {
  var existing = document.getElementById('co-install-bar');
  if (existing) existing.remove();
  window._coScanAttempt = 0;

  var sc = document.getElementById('co-scroll');
  if (!sc) return;
  var bar = document.createElement('div');
  bar.id = 'co-install-bar';
  bar.dataset.compName = compName;
  bar.style.cssText = 'background:var(--layer-1);border-bottom:1px solid var(--border);padding:16px 16px 20px;animation:dtInlineConfirmIn 0.2s cubic-bezier(0.4,0,0.2,1);flex-shrink:0;margin-bottom:8px;';
  sc.insertBefore(bar, sc.firstChild);
  sc.scrollTop = 0;
  coStartScan(compName, true);
}

function coInstallConfirmScanned(serial) {
  var bar = document.getElementById('co-install-bar');
  if (!bar) return;
  var compName = bar.dataset.compName;
  bar.remove();
  var now = new Date();
  var dateStr = (now.getMonth()+1)+'/'+now.getDate()+'/'+String(now.getFullYear()).slice(-2)+' · '+now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  if (!window._dtSessionInstalls) window._dtSessionInstalls = {};
  window._dtSessionInstalls[compName] = serial;
  if (!window.moPendingCards) window.moPendingCards = {};
  window.moPendingCards[compName] = { serial: serial, installedDate: dateStr };
  if (window.moRemovedCards) delete window.moRemovedCards[compName];
  CC_TRUCKS.forEach(function(t) {
    if (!t.components) return;
    var comp = t.components.find(function(c){ return c.name===compName; });
    if (comp) { comp.state='pending'; comp.evt='Replacement recorded'; comp.dot='#d97706'; comp.serial=serial; comp.installedDate=dateStr; }
  });
  renderConditions();
  coCheckComponentFirmware(compName, 'mobile');
}


/* Desktop — open from empty slot card */
function dtInstallOpen(compName, removedDate) {
  var existing = document.getElementById('co-install-bar');
  if (existing) existing.remove();
  window._coScanAttempt = 0;

  /* On tablet route to tb-drawer-main; on desktop use dt-drawer-main */
  var mainId = document.body.classList.contains('view-tablet') ? 'tb-drawer-main' : 'dt-drawer-main';
  var main = document.getElementById(mainId);
  if (!main) return;
  main.style.position = 'relative';
  var bar = document.createElement('div');
  bar.id = 'co-install-bar';
  bar.dataset.compName = compName;
  bar.style.cssText = 'position:absolute;left:0;right:0;bottom:0;z-index:50;background:var(--layer-1);border-top:1px solid var(--border);padding:16px 24px 24px;box-shadow:0 -8px 24px rgba(54,50,45,0.1);animation:dtInlineConfirmIn 0.2s cubic-bezier(0.4,0,0.2,1);';
  main.appendChild(bar);
  coStartScan(compName, false);
}

function dtInstallConfirmScanned(serial) {
  var bar = document.getElementById('co-install-bar');
  if (!bar) return;
  var compName = bar.dataset.compName;
  bar.remove();
  var now = new Date();
  var dateStr = (now.getMonth()+1)+'/'+now.getDate()+'/'+String(now.getFullYear()).slice(-2)+' · '+now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  if (!window._dtSessionInstalls) window._dtSessionInstalls = {};
  window._dtSessionInstalls[compName] = serial;
  if (!window.dtPendingComponents) window.dtPendingComponents = {};
  window.dtPendingComponents[compName] = { serial: serial, installedDate: dateStr };
  if (window.dtRemovedComponents) delete window.dtRemovedComponents[compName];
  CC_TRUCKS.forEach(function(t) {
    if (!t.components) return;
    var comp = t.components.find(function(c){ return c.name===compName; });
    if (comp) { comp.state='pending'; comp.evt='Replacement recorded'; comp.dot='#d97706'; comp.serial=serial.trim(); comp.installedDate=dateStr; }
  });

  if (document.body.classList.contains('view-tablet')) {
    /* Tablet — re-render overview in place, then sync firmware before error reset becomes available */
    coCheckComponentFirmware(compName, 'tablet');
    var scroll = document.getElementById('tb-drawer-scroll');
    if (scroll && typeof tbDrawerTruck !== 'undefined' && tbDrawerTruck) {
      tbBuildOverview(tbDrawerTruck, scroll);
    }
  } else {
    coCheckComponentFirmware(compName, 'desktop');
    if (dtDrawerTruckNum) dtOpenTruck(dtDrawerTruckNum);
  }
}


/* ══════════════════════════════════════════════════
   CHUNK 4.5 — REPLACE TCG FLOW
   ──────────────────────────────────────────────────
   Per Brandon + Martin: TCG replacement is its own workflow.
   Unit ID stays the same. Other components stay on the truck.
   What happens: unit goes offline briefly while the new TCG syncs
   with installed components, then everything reconnects.

   Three stages:
     A. Confirmation sheet (red icon, explains the consequence)
     B. Scan for new TCG (reuses install panel scan UI)
     C. Reconnection animation (components flip back to green one by one)
═══════════════════════════════════════════════════ */

/* Flag set on the install bar so the confirm handler knows to route
   to the TCG completion path instead of regular component install. */
function coIsTcgReplaceMode() {
  var bar = document.getElementById('co-install-bar');
  return !!(bar && bar.dataset.tcgReplace === '1');
}

/* Get the live component names for the current truck (for the "will reconnect" list) */
function coGetTruckCompList(isDesktop) {
  var truckNum;
  if (document.body.classList.contains('view-tablet')) {
    truckNum = (typeof tbDrawerTruck !== 'undefined' && tbDrawerTruck) ? tbDrawerTruck.num : null;
  } else if (isDesktop) {
    truckNum = typeof dtDrawerTruckNum !== 'undefined' ? dtDrawerTruckNum : null;
  } else {
    var lab = document.getElementById('drawer-truck-num');
    truckNum = lab ? lab.textContent.replace('Truck:', '').trim() : null;
  }
  if (!truckNum) return [];
  var t = CC_TRUCKS.find(function(tr){ return String(tr.num) === String(truckNum); });
  if (!t || !t.components) return [];
  return t.components
    .filter(function(c){ return c.name !== 'TCG' && c.state !== 'empty'; })
    .map(function(c){ return c.name; });
}

/* Stage A — entry point. Renders the confirmation sheet. */
function coOpenTcgReplace(isDesktop) {
  var existing = document.getElementById('co-install-bar');
  if (existing) existing.remove();

  var bar = document.createElement('div');
  bar.id = 'co-install-bar';
  bar.dataset.tcgReplace = '1';
  bar.dataset.compName = 'TCG';

  /* Tablet — route to tb-drawer-main */
  if (document.body.classList.contains('view-tablet')) {
    var main = document.getElementById('tb-drawer-main');
    if (!main) return;
    main.style.position = 'relative';
    bar.style.cssText = 'position:absolute;left:0;right:0;bottom:0;z-index:50;background:var(--layer-1);border-top:1px solid var(--border);padding:18px 24px 24px;box-shadow:0 -8px 24px rgba(54,50,45,0.1);animation:dtInlineConfirmIn 0.2s cubic-bezier(0.4,0,0.2,1);max-height:calc(100% - 60px);overflow-y:auto;';
    main.appendChild(bar);
    coRenderTcgConfirmStage(true); /* pass true so confirm routes back through desktop/tablet path */
    return;
  }

  if (isDesktop) {
    var main = document.getElementById('dt-drawer-main');
    if (!main) return;
    main.style.position = 'relative';
    bar.style.cssText = 'position:absolute;left:0;right:0;bottom:0;z-index:50;background:var(--layer-1);border-top:1px solid var(--border);padding:18px 24px 24px;box-shadow:0 -8px 24px rgba(54,50,45,0.1);animation:dtInlineConfirmIn 0.2s cubic-bezier(0.4,0,0.2,1);max-height:calc(100% - 60px);overflow-y:auto;';
    main.appendChild(bar);
  } else {
    var sc = document.getElementById('state-components');
    if (!sc) return;
    sc.style.position = 'relative';
    bar.style.cssText = 'position:absolute;left:0;right:0;bottom:0;z-index:50;background:var(--layer-1);border-top:1px solid var(--border);padding:18px 16px 36px;box-shadow:0 -8px 24px rgba(54,50,45,0.12);animation:dtInlineConfirmIn 0.2s cubic-bezier(0.4,0,0.2,1);max-height:calc(100% - 60px);overflow-y:auto;';
    sc.appendChild(bar);
  }

  coRenderTcgConfirmStage(isDesktop);
}

/* Stage A render */
function coRenderTcgConfirmStage(isDesktop) {
  var bar = document.getElementById('co-install-bar');
  if (!bar) return;
  var comps = coGetTruckCompList(isDesktop);
  var bullets = comps.length
    ? comps.map(function(n){
        return '<div style="display:flex;align-items:center;gap:8px;padding:3px 0;">'
          + '<div style="width:5px;height:5px;border-radius:50%;background:var(--soft);flex-shrink:0;"></div>'
          + '<span style="font-size:13px;color:var(--strong);letter-spacing:-0.26px;">' + n + '</span>'
          + '</div>';
      }).join('')
    : '<div style="font-size:12px;color:var(--soft);font-style:italic;">No other components currently installed.</div>';

  bar.innerHTML =
    /* Header — red icon, title */
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">'
    +   '<div style="width:36px;height:36px;border-radius:50%;background:rgba(216,59,58,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
    +     '<svg width="18" height="18" viewBox="0 0 20 20" fill="none">'
    +       '<path d="M10 2v3M10 15v3M2 10h3M15 10h3M4.2 4.2l2.1 2.1M13.7 13.7l2.1 2.1M4.2 15.8l2.1-2.1M13.7 6.3l2.1-2.1" stroke="var(--red)" stroke-width="1.4" stroke-linecap="round"/>'
    +       '<circle cx="10" cy="10" r="3" stroke="var(--red)" stroke-width="1.4"/>'
    +     '</svg>'
    +   '</div>'
    +   '<div>'
    +     '<div style="font-size:16px;font-weight:600;color:var(--strong);letter-spacing:-0.32px;">Replace TCG</div>'
    +     '<div style="font-size:12px;color:var(--soft);letter-spacing:-0.24px;">Telematics Control Gateway</div>'
    +   '</div>'
    + '</div>'
    /* Body — explain consequence */
    + '<div style="font-size:13px;color:var(--strong);letter-spacing:-0.26px;line-height:1.5;margin-bottom:14px;">'
    +   'The unit will go offline briefly while the new TCG installs and re-syncs with your other components. '
    +   '<strong>The unit ID stays the same</strong>, and you don\'t need to remove anything else from the truck.'
    + '</div>'
    /* Reconnect list */
    + (comps.length
        ? '<div style="font-size:11px;font-weight:600;color:var(--soft);letter-spacing:0.3px;text-transform:uppercase;margin-bottom:4px;">These will reconnect to the new TCG</div>'
          + '<div style="border-top:1px solid var(--border);padding:6px 0;margin-bottom:18px;">' + bullets + '</div>'
        : '<div style="margin-bottom:18px;">' + bullets + '</div>'
      )
    /* Buttons — Cancel + Continue (continues to scan) */
    + '<div style="display:flex;gap:8px;">'
    +   '<button onclick="coInstallCancel()" style="flex:0 0 auto;min-width:110px;background:none;border:1px solid var(--border);border-radius:32px;padding:12px 20px;font-size:14px;font-weight:500;font-family:var(--font);letter-spacing:-0.28px;color:var(--strong);cursor:pointer;">Cancel</button>'
    +   '<button onclick="coTcgContinueToScan(' + (isDesktop?'true':'false') + ')" style="flex:1;background:'+coPrimaryBtnBg()+';color:'+coPrimaryBtnColor()+';border:none;border-radius:32px;padding:12px;font-size:14px;font-weight:500;font-family:var(--font);letter-spacing:-0.28px;cursor:pointer;">Continue</button>'
    + '</div>';
}

/* Stage B — TCG cannot be auto-discovered by scan (it IS the radio that would
   do the discovering). Skip scanning entirely and drop straight into manual
   serial entry. tcgReplace flag stays set on the bar so the confirm handler
   routes correctly afterward. */
function coTcgContinueToScan(isDesktop) {
  var bar = document.getElementById('co-install-bar');
  if (!bar) return;
  bar.dataset.compName = 'TCG';
  bar.innerHTML = coBuildInstallFrame('TCG', !isDesktop);
  coRenderManual();
}

/* TCG's own target firmware for this prototype — the version every new TCG
   gets verified/updated against before it becomes the source of truth for
   the components reconnecting to it. */
var TCG_LATEST_FW = 'v5.01.008';

/* Stage C — called when user confirms the new TCG install.
   Two-step per [user]: 1) confirm/update the TCG itself to latest software
   (it has to be current before it can be trusted as the reference point),
   2) only once that's confirmed, each component reconnects AND syncs to
   its own latest version — TCG is the trigger event, not a literal version
   match (TCG and component firmware are different numbering schemes). */
function coTcgConfirmInstall(serial, isDesktop) {
  var bar = document.getElementById('co-install-bar');
  if (!bar) return;
  coShowTcgFirmwareCheck(serial, isDesktop);
}

function coShowTcgFirmwareCheck(serial, isDesktop) {
  var bar = document.getElementById('co-install-bar');
  if (!bar) return;
  var DURATION = 2400;
  bar.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">'
    +   '<div style="width:36px;height:36px;border-radius:50%;background:rgba(48,105,227,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
    +     '<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2v3M10 15v3M2 10h3M15 10h3" stroke="#3069e3" stroke-width="1.6" stroke-linecap="round"/><circle cx="10" cy="10" r="3.5" stroke="#3069e3" stroke-width="1.6"/></svg>'
    +   '</div>'
    +   '<div>'
    +     '<div style="font-size:15px;font-weight:600;color:var(--strong);letter-spacing:-0.3px;">New TCG installed</div>'
    +     '<div style="font-size:12px;font-family:\'DM Mono\', monospace;color:var(--soft);letter-spacing:0.2px;">' + serial + '</div>'
    +   '</div>'
    + '</div>'
    + '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px;">'
    +   '<div style="font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.26px;">Updating TCG software\u2026</div>'
    +   '<div id="co-tcg-fw-pct" style="font-size:12px;font-weight:600;color:#3069e3;font-family:\'DM Mono\', monospace;letter-spacing:0.2px;flex-shrink:0;">0%</div>'
    + '</div>'
    + '<div style="width:100%;height:5px;border-radius:3px;background:var(--border);overflow:hidden;margin-bottom:7px;">'
    +   '<div id="co-tcg-fw-bar" style="width:0%;height:100%;background:#3069e3;border-radius:3px;transition:width 0.12s linear;"></div>'
    + '</div>'
    + '<div style="font-size:12px;color:var(--soft);letter-spacing:-0.26px;">Syncing to ' + TCG_LATEST_FW + ' before components reconnect</div>';

  var start = Date.now();
  var timer = setInterval(function() {
    if (!document.getElementById('co-tcg-fw-bar')) { clearInterval(timer); return; }
    var pct = Math.min(100, Math.round((Date.now() - start) / DURATION * 100));
    var barEl = document.getElementById('co-tcg-fw-bar');
    var pctEl = document.getElementById('co-tcg-fw-pct');
    if (barEl) barEl.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
    if (pct >= 100) {
      clearInterval(timer);
      coShowTcgFirmwareSuccess(serial, isDesktop);
    }
  }, 60);
}

function coShowTcgFirmwareSuccess(serial, isDesktop) {
  var bar = document.getElementById('co-install-bar');
  if (!bar) return;
  var successSubColor = document.body.classList.contains('dark') ? '#ffffff' : '#166534';
  bar.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;">'
    +   '<div style="width:36px;height:36px;border-radius:50%;background:rgba(22,163,74,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
    +     '<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    +   '</div>'
    +   '<div>'
    +     '<div style="font-size:15px;font-weight:600;color:var(--strong);letter-spacing:-0.3px;">TCG software updated</div>'
    +     '<div style="font-size:12px;color:'+successSubColor+';letter-spacing:-0.24px;">Now running ' + TCG_LATEST_FW + ' \u2014 reconnecting components next</div>'
    +   '</div>'
    + '</div>';

  /* TCG is now the source of truth — record its version on the truck */
  CC_TRUCKS.forEach(function(t) {
    if (!t.components) return;
    var comp = t.components.find(function(c){ return c.name === 'TCG'; });
    if (comp) comp.fw = TCG_LATEST_FW;
  });

  setTimeout(function() { coTcgRenderReconnect(serial, isDesktop); }, 1300);
}

/* Stage D — reconnection list. Each component now also syncs to its own
   latest firmware as it reconnects, using the TCG update as the trigger. */
function coTcgRenderReconnect(serial, isDesktop) {
  var bar = document.getElementById('co-install-bar');
  if (!bar) return;
  var comps = coGetTruckCompList(isDesktop);

  /* Replace the install frame with the reconnection panel */
  bar.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">'
    +   '<div style="width:36px;height:36px;border-radius:50%;background:rgba(22,163,74,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
    +     '<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    +   '</div>'
    +   '<div>'
    +     '<div style="font-size:15px;font-weight:600;color:var(--strong);letter-spacing:-0.3px;">New TCG installed</div>'
    +     '<div style="font-size:12px;font-family:\'DM Mono\', monospace;color:var(--soft);letter-spacing:0.2px;">' + serial + '</div>'
    +   '</div>'
    + '</div>'
    + '<div style="font-size:13px;color:var(--soft);letter-spacing:-0.26px;margin-bottom:12px;">Reconnecting components and syncing software\u2026</div>'
    + '<div id="co-tcg-reconnect-list" style="border-top:1px solid var(--border);padding-top:6px;margin-bottom:14px;">'
    +   comps.map(function(n, i){
          return '<div class="co-tcg-reconnect-row" data-comp="' + n + '" data-idx="' + i + '" style="display:flex;align-items:center;gap:10px;padding:6px 0;">'
            +   '<div class="co-tcg-reconnect-dot" style="width:14px;height:14px;border-radius:50%;background:var(--layer-2);border:1.5px solid var(--border-mid);flex-shrink:0;position:relative;">'
            +   '</div>'
            +   '<span style="flex:1;font-size:13px;color:var(--strong);letter-spacing:-0.26px;">' + n + '</span>'
            +   '<span class="co-tcg-reconnect-status" style="font-size:11px;font-weight:500;color:var(--soft);letter-spacing:-0.22px;">Waiting</span>'
            + '</div>';
        }).join('')
    + '</div>'
    + '<button id="co-tcg-done-btn" disabled onclick="coTcgFinish(' + (isDesktop?'true':'false') + ')" style="width:100%;background:'+coPrimaryBtnBg()+';color:'+coPrimaryBtnColor()+';border:none;border-radius:32px;padding:12px;font-size:14px;font-weight:500;font-family:var(--font);letter-spacing:-0.28px;cursor:pointer;opacity:0.4;transition:opacity 0.2s;">Reconnecting…</button>';

  /* Animate each component reconnecting + syncing in sequence */
  comps.forEach(function(name, i) {
    setTimeout(function() {
      var row = document.querySelector('.co-tcg-reconnect-row[data-idx="' + i + '"]');
      if (!row) return;
      /* Pending state */
      var dot = row.querySelector('.co-tcg-reconnect-dot');
      var status = row.querySelector('.co-tcg-reconnect-status');
      var hasFw = !!COMPONENT_LATEST_FW[name];
      if (dot) {
        dot.style.background = 'rgba(48,105,227,0.15)';
        dot.style.borderColor = '#3069e3';
        dot.innerHTML = '<div style="position:absolute;inset:1px;border-radius:50%;border:1.5px solid #3069e3;border-top-color:transparent;animation:tcgSpin 0.7s linear infinite;"></div>';
      }
      if (status) { status.textContent = hasFw ? 'Syncing software' : 'Connecting'; status.style.color = '#3069e3'; }

      /* Connected state ~700ms later */
      setTimeout(function() {
        if (!row) return;
        if (dot) {
          dot.style.background = '#16a34a';
          dot.style.borderColor = '#16a34a';
          dot.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="position:absolute;inset:1px;"><path d="M2 5l2 2 4-5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        }
        if (status) { status.textContent = hasFw ? 'Up to date' : 'Connected'; status.style.color = '#16a34a'; }
        /* Component now matches its latest firmware, with the TCG update as the trigger */
        if (hasFw && typeof CC_TRUCKS !== 'undefined') {
          CC_TRUCKS.forEach(function(t) {
            if (!t.components) return;
            var comp = t.components.find(function(c){ return c.name === name; });
            if (comp) comp.fw = COMPONENT_LATEST_FW[name];
          });
        }
        /* If this is the last one, move to the final confirmation stage
           instead of enabling Done directly off the reconnect list */
        if (i === comps.length - 1) {
          setTimeout(function() { coTcgRenderFinalConfirm(serial, isDesktop, comps); }, 500);
        }
      }, 700);
    }, 350 + i * 600);
  });

  /* Edge case: no components — skip straight to final confirmation */
  if (comps.length === 0) {
    setTimeout(function() { coTcgRenderFinalConfirm(serial, isDesktop, comps); }, 400);
  }
}

/* Stage E — explicit confirmation that every reconnected component is
   verified on its current firmware, with the TCG's own version as the
   reference point. This is the step that was missing: the reconnect list
   shows the work happening, but the FST needs a clear "verified" beat
   before they can close out the replacement. */
function coTcgRenderFinalConfirm(serial, isDesktop, comps) {
  var bar = document.getElementById('co-install-bar');
  if (!bar) return;
  var successSubColor = document.body.classList.contains('dark') ? '#ffffff' : '#166534';
  var fwRows = comps.map(function(name) {
    var fw = COMPONENT_LATEST_FW[name];
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;">'
      +   '<span style="font-size:13px;color:var(--strong);letter-spacing:-0.26px;">' + name + '</span>'
      +   '<span style="font-size:12px;font-family:\'DM Mono\', monospace;color:'+(fw?'#16a34a':'var(--soft)')+';letter-spacing:0.2px;">' + (fw ? fw + ' \u2713' : 'Connected') + '</span>'
      + '</div>';
  }).join('');

  bar.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">'
    +   '<div style="width:36px;height:36px;border-radius:50%;background:rgba(22,163,74,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
    +     '<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    +   '</div>'
    +   '<div>'
    +     '<div style="font-size:15px;font-weight:600;color:var(--strong);letter-spacing:-0.3px;">All components verified</div>'
    +     '<div style="font-size:12px;color:'+successSubColor+';letter-spacing:-0.24px;">Matched to TCG ' + serial + ' \u00b7 ' + TCG_LATEST_FW + '</div>'
    +   '</div>'
    + '</div>'
    + (comps.length
        ? '<div style="font-size:11px;font-weight:600;color:var(--soft);letter-spacing:0.3px;text-transform:uppercase;margin-bottom:2px;">Component software</div>'
          + '<div style="border-top:1px solid var(--border);padding:4px 0 0;margin-bottom:16px;">' + fwRows + '</div>'
        : '<div style="font-size:13px;color:var(--soft);letter-spacing:-0.26px;margin-bottom:16px;">No other components were installed on this truck.</div>'
      )
    + '<button onclick="coTcgFinish(' + (isDesktop?'true':'false') + ')" style="width:100%;background:'+coPrimaryBtnBg()+';color:'+coPrimaryBtnColor()+';border:none;border-radius:32px;padding:12px;font-size:14px;font-weight:500;font-family:var(--font);letter-spacing:-0.28px;cursor:pointer;">Done</button>';
}

/* Stage C completion — close the panel, refresh views */
function coTcgFinish(isDesktop) {
  var bar = document.getElementById('co-install-bar');
  if (bar) bar.remove();
  /* Tablet — re-render overview in place */
  if (document.body.classList.contains('view-tablet')) {
    var scroll = document.getElementById('tb-drawer-scroll');
    if (scroll && typeof tbDrawerTruck !== 'undefined' && tbDrawerTruck) {
      tbBuildOverview(tbDrawerTruck, scroll);
    }
    return;
  }
  /* For prototype: TCG card stays "Connected" — no destructive data updates needed */
  if (isDesktop) {
    if (dtDrawerTruckNum) dtOpenTruck(dtDrawerTruckNum);
  } else {
    if (typeof renderConditions === 'function') renderConditions();
  }
}

/* ── CHUNK 5: Error Reset prompt ──────────────────────────
   Appears only when all removed components have been replaced
   (no empty slots remaining). Direct jump to Error Reset card.  */

function coHasEmptySlots() {
  var hasEmpty = false;
  CC_TRUCKS.forEach(function(t) {
    if (!t.components) return;
    t.components.forEach(function(c) { if (c.state === 'empty') hasEmpty = true; });
  });
  if (window.dtRemovedComponents && Object.keys(window.dtRemovedComponents).length > 0) hasEmpty = true;
  if (window.moRemovedCards && Object.keys(window.moRemovedCards).length > 0) hasEmpty = true;
  return hasEmpty;
}

function coGetErrorCount() {
  /* Resolve active truck number — desktop uses dtDrawerTruckNum, tablet uses tbDrawerTruck */
  var truckNum = document.body.classList.contains('view-tablet')
    ? (typeof tbDrawerTruck !== 'undefined' && tbDrawerTruck ? tbDrawerTruck.num : null)
    : (typeof dtDrawerTruckNum !== 'undefined' ? dtDrawerTruckNum : null);
  var t = trucks.find(function(tr) { return String(tr.num) === String(truckNum); });
  return t ? (getTruckAlerts(t.num).err + getTruckAlerts(t.num).wrn) : 0;
}

/* ── Component firmware sync ───────────────────────────────────────────────
   Runs automatically the moment a component install is confirmed, before
   the error-reset prompt becomes available. Replaced parts ship at whatever
   firmware they shipped with — they need to be auto-updated to the current
   target version before the FST is allowed to run the error test, the same
   way a fresh TCG re-syncs its components on a TCG swap. Only components
   that carry a firmware/version field are checked; sensors with no fw value
   (e.g. CPS, DPS — value-only readouts) skip straight through.
──────────────────────────────────────────────────────────────────────────── */
var COMPONENT_LATEST_FW = {
  'WDS':         'v2.1.4',
  'DRS':         'v1.0.8',
  'CWR':         'v35.0',
  'ICD':         'v1468',
  'Water Pump':  'v4.2.1',
  'Admix Pump':  'v4.2.1',
  'ED':          'v8195'
};

function coCheckComponentFirmware(compName, view) {
  var latest = COMPONENT_LATEST_FW[compName];
  /* No firmware field for this component type — nothing to sync */
  if (!latest) { coCheckShowErrorResetPrompt(view); return; }
  coShowFirmwareSyncBanner(compName, latest, view);
}

function coFirmwareBannerSlot(view) {
  if (view === 'tablet')  return document.getElementById('tb-error-banner');
  if (view === 'desktop') return document.getElementById('dt-error-banner');
  return document.getElementById('co-replace-toolbar');
}

function coShowFirmwareSyncBanner(compName, latest, view) {
  var slot = coFirmwareBannerSlot(view);
  if (!slot) { coCheckShowErrorResetPrompt(view); return; }
  var isMobile = (view !== 'tablet' && view !== 'desktop');
  var pad      = view === 'desktop' ? '12px 24px' : view === 'tablet' ? '12px 20px' : '12px 16px';
  var border   = isMobile ? 'border-bottom' : 'border-top';
  var DURATION = 2400; /* slowed down from the old 1.8s timer so the bar reads clearly */

  slot.style.cssText = 'flex-shrink:0;background:var(--layer-2);'+border+':1px solid var(--border);padding:'+pad+';display:flex;flex-direction:column;gap:7px;animation:dtInlineConfirmIn 0.2s cubic-bezier(0.4,0,0.2,1);';
  slot.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">'
    +   '<div style="font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.26px;">Updating ' + compName + ' software\u2026</div>'
    +   '<div id="co-fw-sync-pct" style="font-size:12px;font-weight:600;color:#3069e3;font-family:\'DM Mono\', monospace;letter-spacing:0.2px;flex-shrink:0;">0%</div>'
    + '</div>'
    + '<div style="width:100%;height:5px;border-radius:3px;background:var(--border);overflow:hidden;">'
    +   '<div id="co-fw-sync-bar" style="width:0%;height:100%;background:#3069e3;border-radius:3px;transition:width 0.12s linear;"></div>'
    + '</div>'
    + '<div style="font-size:12px;color:var(--soft);letter-spacing:-0.24px;">Syncing to ' + latest + ' before error test</div>';
  if (isMobile) slot.dataset.bannerActive = '1';

  var start = Date.now();
  var timer = setInterval(function() {
    /* If the banner slot got reused/overwritten by something else, stop ticking */
    if (!document.getElementById('co-fw-sync-bar')) { clearInterval(timer); return; }
    var pct = Math.min(100, Math.round((Date.now() - start) / DURATION * 100));
    var bar = document.getElementById('co-fw-sync-bar');
    var pctEl = document.getElementById('co-fw-sync-pct');
    if (bar) bar.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
    if (pct >= 100) {
      clearInterval(timer);
      if (typeof CC_TRUCKS !== 'undefined') {
        CC_TRUCKS.forEach(function(t) {
          if (!t.components) return;
          var comp = t.components.find(function(c){ return c.name === compName; });
          if (comp) comp.fw = latest;
        });
      }
      coShowFirmwareSyncSuccess(compName, latest, view);
    }
  }, 60);
}

/* Brief confirmation beat so the bar finishing doesn't read as a fail-and-
   recover cycle right before the error-reset banner appears. */
function coShowFirmwareSyncSuccess(compName, latest, view) {
  var slot = coFirmwareBannerSlot(view);
  if (!slot) { coCheckShowErrorResetPrompt(view); return; }
  var isMobile = (view !== 'tablet' && view !== 'desktop');
  var pad      = view === 'desktop' ? '12px 24px' : view === 'tablet' ? '12px 20px' : '12px 16px';
  var border   = isMobile ? 'border-bottom' : 'border-top';
  slot.style.cssText = 'flex-shrink:0;background:'+coSuccessBannerBg()+';'+border+':1px solid '+coSuccessBannerBorder()+';padding:'+pad+';display:flex;align-items:center;gap:10px;animation:dtInlineConfirmIn 0.2s cubic-bezier(0.4,0,0.2,1);';
  var successSubColor = document.body.classList.contains('dark') ? '#ffffff' : '#166534';
  slot.innerHTML = '<div style="width:28px;height:28px;border-radius:50%;background:rgba(22,163,74,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
    +   '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    + '</div>'
    + '<div style="flex:1;min-width:0;">'
    +   '<div style="font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.26px;">' + compName + ' software updated</div>'
    +   '<div style="font-size:12px;color:'+successSubColor+';letter-spacing:-0.24px;">Now running ' + latest + ' \u2014 running error test next</div>'
    + '</div>';
  if (isMobile) slot.dataset.bannerActive = '1';

  setTimeout(function() { coCheckShowErrorResetPrompt(view); }, 1300);
}

function coCheckShowErrorResetPrompt(view) {
  if (coHasEmptySlots()) return;
  var errCount = coGetErrorCount();
  if (view === 'tablet') {
    coShowErrorResetBannerTablet(errCount);
  } else if (view === 'desktop') {
    coShowErrorResetBannerDesktop(errCount);
  } else {
    coShowErrorResetBannerMobile(errCount);
  }
}

function coPrimaryBtnBg()    { return document.body.classList.contains('dark') ? '#e3f200' : '#3069e3'; }
function coPrimaryBtnColor() { return document.body.classList.contains('dark') ? '#000000' : 'white'; }

function coBannerBg() {
  return document.body.classList.contains('dark') ? '#2b1f08' : '#fffbeb';
}
function coBannerBorder() {
  return document.body.classList.contains('dark') ? 'rgba(255,186,13,0.2)' : 'rgba(180,130,0,0.2)';
}
function coFailBannerBg() {
  return document.body.classList.contains('dark') ? '#2b0d0d' : '#fff5f5';
}
function coFailBannerBorder() {
  return document.body.classList.contains('dark') ? 'rgba(215,1,0,0.25)' : 'rgba(215,1,0,0.15)';
}
function coSuccessBannerBg() {
  return document.body.classList.contains('dark') ? '#0d2b1a' : '#f0fdf4';
}
function coSuccessBannerBorder() {
  return document.body.classList.contains('dark') ? 'rgba(22,163,74,0.25)' : 'rgba(22,163,74,0.2)';
}

function coShowErrorResetBannerTablet(errCount) {
  /* Write to #tb-error-banner — same persistent slot pattern as desktop.
     Also restore the Replace Components button in the toolbar and
     hide the replace save bar since all slots are now filled. */
  var slot = document.getElementById('tb-error-banner');
  if (!slot) return;
  slot.style.cssText = 'flex-shrink:0;background:'+coBannerBg()+';border-top:1px solid '+coBannerBorder()+';padding:12px 20px;display:flex;align-items:center;gap:10px;animation:dtInlineConfirmIn 0.2s cubic-bezier(0.4,0,0.2,1);';
  slot.innerHTML = '<div style="width:28px;height:28px;border-radius:50%;background:rgba(217,119,6,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
    + '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v5M8 10h.01" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="8" r="6.5" stroke="#d97706" stroke-width="1.2"/></svg>'
    + '</div>'
    + coErrorResetBannerHTML(errCount, false);

  /* Hide replace save bar — no more empty slots to fill */
  var replaceBar = document.getElementById('tb-replace-bar');
  if (replaceBar) replaceBar.style.display = 'none';

  /* Restore Replace Components button */
  var btn = document.getElementById('tb-replace-btn');
  if (btn) {
    btn.classList.remove('active');
    btn.innerHTML = CO_REPLACE_BTN_HTML;
  }
  coReplaceActive = false;
  coSelectedCards.clear();
}

function coErrorResetBannerHTML(errCount, isMobile) {
  var errText = errCount > 0
    ? errCount + ' active error' + (errCount > 1 ? 's' : '') + ' detected'
    : 'No errors detected — verify with Error Reset';
  var btnPad = isMobile ? '7px 10px' : '7px 14px';
  var subColor = document.body.classList.contains('dark') ? '#ffffff' : '#92400e';
  if (isMobile) {
    /* Mobile: stacked layout — text on top, buttons below */
    return '<div style="flex:1;min-width:0;">'
      + '<div style="font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.26px;margin-bottom:2px;">All components replaced</div>'
      + '<div style="font-size:12px;color:'+subColor+';letter-spacing:-0.24px;margin-bottom:10px;">' + errText + '</div>'
      + '<div style="display:flex;gap:6px;">'
      + '<button onclick="coRunErrorResetInline()" id="co-er-run-btn" style="flex:1;background:#d97706;color:white;border:none;border-radius:20px;padding:' + btnPad + ';font-size:12px;font-weight:500;font-family:var(--font);letter-spacing:-0.24px;cursor:pointer;">Run Error Reset</button>'
      + '<button onclick="coSetMaintenanceDirect()" style="flex:1;background:none;border:1px solid var(--border-mid);border-radius:20px;padding:' + btnPad + ';font-size:12px;font-weight:500;font-family:var(--font);letter-spacing:-0.24px;color:var(--strong);cursor:pointer;">Set to Maintenance</button>'
      + '</div>'
      + '</div>';
  }
  /* Desktop: single row */
  return '<div style="flex:1;min-width:0;">'
    + '<div style="font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.26px;">All components replaced</div>'
    + '<div style="font-size:12px;color:'+subColor+';letter-spacing:-0.24px;">' + errText + '</div>'
    + '</div>'
    + '<div style="display:flex;gap:6px;flex-shrink:0;align-items:center;">'
    + '<button onclick="coRunErrorResetInline()" id="co-er-run-btn" style="background:#d97706;color:white;border:none;border-radius:20px;padding:' + btnPad + ';font-size:12px;font-weight:500;font-family:var(--font);letter-spacing:-0.24px;cursor:pointer;white-space:nowrap;">Run Error Reset</button>'
    + '<button onclick="coSetMaintenanceDirect()" style="background:none;border:1px solid var(--border-mid);border-radius:20px;padding:' + btnPad + ';font-size:12px;font-weight:500;font-family:var(--font);letter-spacing:-0.24px;color:var(--strong);cursor:pointer;white-space:nowrap;">Set to Maintenance</button>'
    + '</div>';
}

function coShowErrorResetBannerMobile(errCount) {
  /* Replace the Replace Components button with the banner — same slot */
  var toolbar = document.getElementById('co-replace-toolbar');
  if (!toolbar) return;
  toolbar.style.cssText = 'background:'+coBannerBg()+';border-bottom:1px solid '+coBannerBorder()+';padding:12px 16px;display:flex;align-items:flex-start;gap:10px;flex-shrink:0;';
  toolbar.innerHTML = '<div style="width:28px;height:28px;border-radius:50%;background:rgba(217,119,6,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">'
    + '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v5M8 10h.01" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="8" r="6.5" stroke="#d97706" stroke-width="1.2"/></svg>'
    + '</div>'
    + coErrorResetBannerHTML(errCount, true);
  toolbar.dataset.bannerActive = '1';
}

function coShowErrorResetBannerDesktop(errCount) {
  /* Use the persistent banner slot — survives tab switches */
  var slot = document.getElementById('dt-error-banner');
  if (!slot) return;
  slot.style.cssText = 'flex-shrink:0;background:'+coBannerBg()+';border-top:1px solid '+coBannerBorder()+';padding:12px 24px;display:flex;align-items:center;gap:10px;animation:dtInlineConfirmIn 0.2s cubic-bezier(0.4,0,0.2,1);';
  slot.innerHTML = '<div style="width:28px;height:28px;border-radius:50%;background:rgba(217,119,6,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
    + '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v5M8 10h.01" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="8" r="6.5" stroke="#d97706" stroke-width="1.2"/></svg>'
    + '</div>'
    + coErrorResetBannerHTML(errCount, false);
  /* Also restore the overview toolbar button since banner is now in its own slot */
  var toolbar = document.getElementById('dt-overview-toolbar');
  if (toolbar) {
    toolbar.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;padding:0 0 16px;';
    toolbar.innerHTML = '<button class="co-replace-btn" id="dt-replace-btn" onclick="dtReplaceToggle()" style="margin-left:auto;">'
      + CO_REPLACE_BTN_HTML + '</button>';
  }
}

function coRunErrorResetInline() {
  /* Disable button, show progress */
  var btn = document.getElementById('co-er-run-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Running…'; btn.style.opacity = '0.6'; }

  /* Simulate Error Reset — 1.8s progress then resolve */
  setTimeout(function() {
    var errCount = coGetErrorCount();
    /* Prototype: first attempt always fails so FST can view logs, second attempt clears */
    if (!window.coResetAttemptCount) window.coResetAttemptCount = 0;
    window.coResetAttemptCount++;
    var cleared = window.coResetAttemptCount >= 2;

    var isTablet = document.body.classList.contains('view-tablet');
    var moToolbar = document.getElementById('co-replace-toolbar');
    var dtBanner  = document.getElementById('dt-error-banner');
    var tbBanner  = document.getElementById('tb-error-banner');

    if (cleared) {
      var icon = '<div style="width:28px;height:28px;border-radius:50%;background:rgba(22,163,74,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
        + '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        + '</div>';
      var successSubColor = document.body.classList.contains('dark') ? '#ffffff' : '#166534';
      var successMo = icon
        + '<div style="flex:1;min-width:0;">'
        + '<div style="font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.26px;margin-bottom:2px;">All errors cleared</div>'
        + '<div style="font-size:12px;color:'+successSubColor+';letter-spacing:-0.24px;">Truck is operational</div>'
        + '</div>';
      var successDt = icon
        + '<div style="flex:1;min-width:0;">'
        + '<div style="font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.26px;">All errors cleared</div>'
        + '<div style="font-size:12px;color:'+successSubColor+';letter-spacing:-0.24px;">Truck is operational</div>'
        + '</div>';
      if (moToolbar) { moToolbar.style.cssText = 'background:'+coSuccessBannerBg()+';border-bottom:1px solid '+coSuccessBannerBorder()+';padding:12px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;'; moToolbar.innerHTML = successMo; }
      if (dtBanner)  { dtBanner.style.cssText  = 'flex-shrink:0;background:'+coSuccessBannerBg()+';border-top:1px solid '+coSuccessBannerBorder()+';padding:12px 24px;display:flex;align-items:center;gap:10px;'; dtBanner.innerHTML = successDt; }
      if (tbBanner)  { tbBanner.style.cssText  = 'flex-shrink:0;background:'+coSuccessBannerBg()+';border-top:1px solid '+coSuccessBannerBorder()+';padding:12px 20px;display:flex;align-items:center;gap:10px;'; tbBanner.innerHTML = successDt; }
      coSetNavDot(false);
      setTimeout(function() {
        /* Desktop: navigate back to overview tab */
        if (!isTablet) {
          var coOpt = document.querySelector('#drawer-nav-dropdown .wts-option:nth-child(1)');
          if (coOpt) { selectDrawerNav('Components Overview', coOpt); }
          var overviewTab = document.querySelector('.dt-drawer-tab[onclick*="overview"]');
          if (overviewTab) overviewTab.click();
        } else {
          /* Tablet: switch to overview tab in the truck drawer */
          var tbOverviewTab = document.querySelector('.tb-drawer-tab[onclick*="overview"]');
          if (tbOverviewTab) tbOverviewTab.click();
        }
        coConfirmOperational();
      }, 1400);
    } else {
      var remaining = Math.max(1, Math.floor(errCount * 0.6));
      var failIcon = '<div style="width:28px;height:28px;border-radius:50%;background:rgba(215,1,0,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
        + '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3v4M7 9h.01" stroke="#d70100" stroke-width="1.5" stroke-linecap="round"/><circle cx="7" cy="7" r="6" stroke="#d70100" stroke-width="1.2"/></svg>'
        + '</div>';
      var failText = remaining + ' error' + (remaining > 1 ? 's' : '') + ' still active';
      var failSub  = 'Go to Truck Logs to investigate · come back here to retry';
      var failSubColor = document.body.classList.contains('dark') ? '#ffffff' : '#991b1b';
      /* Mobile: stacked */
      var failMo = failIcon
        + '<div style="flex:1;min-width:0;">'
        + '<div style="font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.26px;margin-bottom:2px;">' + failText + '</div>'
        + '<div style="font-size:12px;color:'+failSubColor+';letter-spacing:-0.24px;margin-bottom:10px;">' + failSub + '</div>'
        + '<div style="display:flex;gap:6px;">'
        + '<button onclick="coRunErrorResetInline()" id="co-er-run-btn" style="flex:1;background:#d70100;color:white;border:none;border-radius:20px;padding:8px 10px;font-size:12px;font-weight:500;font-family:var(--font);letter-spacing:-0.24px;cursor:pointer;">Retry Reset</button>'
        + '<button onclick="coViewTruckLogs()" style="flex:1;background:none;border:1px solid var(--border-mid);border-radius:20px;padding:8px 10px;font-size:12px;font-weight:500;font-family:var(--font);letter-spacing:-0.24px;color:var(--strong);cursor:pointer;">View Truck Logs</button>'
        + '</div></div>';
      /* Desktop/Tablet: single row */
      var failDt = failIcon
        + '<div style="flex:1;min-width:0;">'
        + '<div style="font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.26px;">' + failText + '</div>'
        + '<div style="font-size:12px;color:'+failSubColor+';letter-spacing:-0.24px;">' + failSub + '</div>'
        + '</div>'
        + '<div style="display:flex;gap:6px;flex-shrink:0;align-items:center;">'
        + '<button onclick="coRunErrorResetInline()" id="co-er-run-btn" style="background:#d70100;color:white;border:none;border-radius:20px;padding:7px 12px;font-size:12px;font-weight:500;font-family:var(--font);letter-spacing:-0.24px;cursor:pointer;white-space:nowrap;">Retry Reset</button>'
        + '<button onclick="coViewTruckLogs()" style="background:none;border:1px solid var(--border-mid);border-radius:20px;padding:7px 12px;font-size:12px;font-weight:500;font-family:var(--font);letter-spacing:-0.24px;color:var(--strong);cursor:pointer;white-space:nowrap;">View Truck Logs</button>'
        + '</div>';
      if (moToolbar) { moToolbar.style.cssText = 'background:'+coFailBannerBg()+';border-bottom:1px solid '+coFailBannerBorder()+';padding:12px 16px;display:flex;align-items:flex-start;gap:10px;flex-shrink:0;'; moToolbar.innerHTML = failMo; }
      if (dtBanner)  { dtBanner.style.cssText  = 'flex-shrink:0;background:'+coFailBannerBg()+';border-top:1px solid '+coFailBannerBorder()+';padding:12px 24px;display:flex;align-items:center;gap:10px;'; dtBanner.innerHTML = failDt; }
      if (tbBanner)  { tbBanner.style.cssText  = 'flex-shrink:0;background:'+coFailBannerBg()+';border-top:1px solid '+coFailBannerBorder()+';padding:12px 20px;display:flex;align-items:center;gap:10px;'; tbBanner.innerHTML = failDt; }
      coSetNavDot(true);
    }
  }, 1800);
}

function coSetMaintenanceDirect() {
  dtSetMode('maintenance');
  var subColor = document.body.classList.contains('dark') ? '#ffffff' : '#92400e';
  var maintInner = '<div style="width:28px;height:28px;border-radius:50%;background:rgba(217,119,6,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
    + '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v5M8 10h.01" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="8" r="6.5" stroke="#d97706" stroke-width="1.2"/></svg>'
    + '</div>'
    + '<div style="flex:1;min-width:0;">'
    + '<div style="font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.26px;">Maintenance mode set</div>'
    + '<div style="font-size:12px;color:'+subColor+';letter-spacing:-0.24px;">Truck is in manual operation · return here once new parts arrive</div>'
    + '</div>'
    + '<div style="flex-shrink:0;">'
    + '<button onclick="coRunErrorResetInline()" id="co-er-run-btn" style="background:#d97706;color:white;border:none;border-radius:20px;padding:7px 12px;font-size:12px;font-weight:500;font-family:var(--font);letter-spacing:-0.24px;cursor:pointer;white-space:nowrap;">Run Error Reset</button>'
    + '</div>';

  /* Update mobile toolbar banner */
  var moToolbarBanner = document.getElementById('co-replace-toolbar');
  if (moToolbarBanner) {
    moToolbarBanner.style.cssText = 'background:'+coBannerBg()+';border-bottom:1px solid '+coBannerBorder()+';padding:12px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;';
    moToolbarBanner.innerHTML = maintInner;
  }

  /* Update desktop persistent banner */
  var dtBanner = document.getElementById('dt-error-banner');
  if (dtBanner) {
    dtBanner.style.cssText = 'flex-shrink:0;background:'+coBannerBg()+';border-top:1px solid '+coBannerBorder()+';padding:12px 24px;display:flex;align-items:center;gap:10px;';
    dtBanner.innerHTML = maintInner;
  }

  /* Update tablet banner */
  var tbBanner = document.getElementById('tb-error-banner');
  if (tbBanner) {
    tbBanner.style.cssText = 'flex-shrink:0;background:'+coBannerBg()+';border-top:1px solid '+coBannerBorder()+';padding:12px 20px;display:flex;align-items:center;gap:10px;';
    tbBanner.innerHTML = maintInner;
  }

  /* Keep nav dot — case still open */
  var moToolbar = document.getElementById('co-replace-toolbar');
  if (moToolbar) {
    moToolbar.removeAttribute('style');
    moToolbar.innerHTML = '<button class="co-replace-btn" id="co-replace-btn" onclick="coReplaceToggle()">'
      + CO_REPLACE_BTN_HTML + '</button>';
  }
  var dtToolbar = document.getElementById('dt-overview-toolbar');
  if (dtToolbar) {
    dtToolbar.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;padding:0 0 16px;';
    dtToolbar.innerHTML = '<button class="co-replace-btn" id="dt-replace-btn" onclick="dtReplaceToggle()" style="margin-left:auto;">'
      + CO_REPLACE_BTN_HTML + '</button>';
  }
}

/* ── CHUNK 7: Write replacement to Unit Life Span ────────────────────
   Called from coConfirmOperational. Finds the unit linked to the
   active truck and prepends a new history entry for each replaced
   component. Uses the serial number recorded during installation.
   If no UNIT_HISTORY entry exists for the unit, creates one.        */

function coWriteLifespanHistory() {
  var truckNum = null;
  if (document.body.classList.contains('view-tablet')) {
    truckNum = (typeof tbDrawerTruck !== 'undefined' && tbDrawerTruck) ? tbDrawerTruck.num : null;
  } else {
    truckNum = dtDrawerTruckNum || (typeof openTruckNum !== 'undefined' ? openTruckNum : null);
  }
  if (!truckNum) return;

  var unit = UNITS_DATA.find(function(u) {
    return String(u.truck) === String(truckNum) && u.status === 'Linked Unit';
  });
  if (!unit) return;

  var now = new Date();
  var dateStr = (now.getMonth()+1) + '/' + now.getDate() + '/' + now.getFullYear();

  /* Ensure unit has its own history entry */
  if (!UNIT_HISTORY[unit.id]) {
    UNIT_HISTORY[unit.id] = JSON.parse(JSON.stringify(UNIT_HISTORY['_default'] || []));
  }

  /* Collect replaced components — session installs first (have real serials) */
  var replacedComponents = [];
  if (window._dtSessionInstalls) {
    Object.keys(window._dtSessionInstalls).forEach(function(name) {
      replacedComponents.push({ name: name, serial: window._dtSessionInstalls[name] });
    });
  }

  /* Hardcoded pending/empty cards — use prototype serials */
  var demoSerials = {
    'WDS':        'WDS-4421A',
    'Water Pump': 'WP-88210',
    'Admix Pump': 'AP-33041',
  };
  /* Check CC_TRUCKS for components that were pending/empty */
  CC_TRUCKS.forEach(function(t) {
    if (String(t.num) !== String(truckNum)) return;
    if (!t.components) return;
    t.components.forEach(function(c) {
      if (c.state === 'pending' || c.state === 'empty') {
        var alreadyTracked = replacedComponents.some(function(r) { return r.name === c.name; });
        if (!alreadyTracked) {
          replacedComponents.push({
            name:   c.name,
            serial: c.serial || demoSerials[c.name] || ('SN-' + Math.floor(Math.random()*90000+10000))
          });
        }
      }
    });
  });

  /* Write to UNIT_HISTORY */
  replacedComponents.forEach(function(r) {
    var comp = UNIT_HISTORY[unit.id].find(function(c) {
      return c.name === r.name;
    });
    if (comp) {
      /* Move old "Current" label to a date */
      if (comp.history[0] && comp.history[0].date === 'Current') {
        comp.history[0].date = 'Previous';
      }
      comp.history.unshift({ date: dateStr, mac: r.serial });
    } else {
      UNIT_HISTORY[unit.id].push({
        name: r.name,
        history: [{ date: dateStr, mac: r.serial }]
      });
    }
  });
}

function coConfirmOperational() {
  var isTablet = document.body.classList.contains('view-tablet');

  /* Reset ignition pill to live/green */
  if (!isTablet) dtApplyMode('live');
  else {
    /* On tablet update the drawer's ign badge */
    var ignBadge = document.getElementById('tb-drawer-ign-badge');
    var ignText  = document.getElementById('tb-drawer-ign-text');
    if (ignBadge) ignBadge.className = 'dt-drawer-ign-badge';
    if (ignText)  ignText.textContent = 'Ignition on';
  }

  /* Case closed — restore toolbar to Replace Components */
  var moToolbar = document.getElementById('co-replace-toolbar');
  if (moToolbar) {
    moToolbar.removeAttribute('style');
    moToolbar.innerHTML = '<button class="co-replace-btn" id="co-replace-btn" onclick="coReplaceToggle()">'
      + CO_REPLACE_BTN_HTML + '</button>';
  }
  var dtToolbar = document.getElementById('dt-overview-toolbar');
  if (dtToolbar) {
    dtToolbar.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;padding:0 0 16px;';
    dtToolbar.innerHTML = '<button class="co-replace-btn" id="dt-replace-btn" onclick="dtReplaceToggle()" style="margin-left:auto;">'
      + CO_REPLACE_BTN_HTML + '</button>';
  }
  /* Tablet: restore replace btn and hide replace bar */
  var tbBtn = document.getElementById('tb-replace-btn');
  if (tbBtn) { tbBtn.classList.remove('active'); tbBtn.innerHTML = CO_REPLACE_BTN_HTML; }
  var tbReplaceBar = document.getElementById('tb-replace-bar');
  if (tbReplaceBar) tbReplaceBar.style.display = 'none';
  var tbScroll = document.getElementById('tb-drawer-scroll');
  if (tbScroll) tbScroll.classList.remove('dt-replace-mode');
  coReplaceActive = false;
  coSelectedCards.clear();

  /* Mark all session-tracked components as confirmed */
  if (!window.dtConfirmedComponents) window.dtConfirmedComponents = {};
  if (window.dtPendingComponents) {
    Object.keys(window.dtPendingComponents).forEach(function(k) { window.dtConfirmedComponents[k] = true; });
    window.dtPendingComponents = {};
  }
  if (window.moPendingCards) {
    Object.keys(window.moPendingCards).forEach(function(k) { window.dtConfirmedComponents[k] = true; });
    window.moPendingCards = {};
  }
  if (window.dtRemovedComponents) {
    Object.keys(window.dtRemovedComponents).forEach(function(k) { window.dtConfirmedComponents[k] = true; });
    window.dtRemovedComponents = {};
  }
  if (window.moRemovedCards) {
    Object.keys(window.moRemovedCards).forEach(function(k) { window.dtConfirmedComponents[k] = true; });
    window.moRemovedCards = {};
  }
  /* Also capture hardcoded pending/empty cards */
  var confirmedDefaults = {
    'Water Pump':  { label:'Water Delivery System', value:'17',  unit:'gal/min', startup:1, err:'0' },
    'Admix Pump':  { label:'Admixture Pump',         value:'165',  unit:'ml/s',    startup:1, err:'0' },
  };
  var allCards = (window._dtMcsCards || []).concat(window._dtFdmCards || []);
  allCards.forEach(function(card) {
    if (card && (card.state === 'pending' || card.state === 'empty')) {
      window.dtConfirmedComponents[card.name] = confirmedDefaults[card.name] || true;
    }
  });

  /* Write replacement events to UNIT_HISTORY */
  coWriteLifespanHistory();

  /* Re-render Life Span tab if it's currently open */
  if (typeof dtUdActiveTab !== 'undefined' && dtUdActiveTab === 'lifespan') {
    if (typeof dtUdRenderLifespan === 'function') dtUdRenderLifespan();
  }
  if (typeof dtActiveTab !== 'undefined' && dtActiveTab === 'overview') {
    var lsScroll = document.getElementById('dt-ls-scroll');
    if (lsScroll && dtDrawerTruckNum) {
      lsScroll.innerHTML = dtBuildLifespanForTruck(dtDrawerTruckNum);
    }
  }

  /* Clear all banners */
  var dtBannerClr = document.getElementById('dt-error-banner');
  if (dtBannerClr) { dtBannerClr.style.display = 'none'; dtBannerClr.innerHTML = ''; }
  var tbBannerClr = document.getElementById('tb-error-banner');
  if (tbBannerClr) { tbBannerClr.style.display = 'none'; tbBannerClr.innerHTML = ''; }

  coSetNavDot(false);
  window.coResetAttemptCount = 0;
  window._dtSessionInstalls = {};
  window.moRemovedCards = {};
  window.moPendingCards = {};

  /* Reset CC_TRUCKS components to clean */
  CC_TRUCKS.forEach(function(t) {
    if (!t.components) return;
    t.components.forEach(function(c) {
      if (c.state === 'pending' || c.state === 'empty') {
        c.state = 'clean'; c.dot = '#2ecf1d'; c.evt = 'No Events';
        delete c.serial; delete c.installedDate; delete c.removedDate;
      }
    });
  });

  /* Reset truck error count — desktop uses dtDrawerTruckNum, tablet uses tbDrawerTruck */
  var activeTruckNum = isTablet
    ? (typeof tbDrawerTruck !== 'undefined' && tbDrawerTruck ? tbDrawerTruck.num : null)
    : dtDrawerTruckNum;
  if (activeTruckNum) {
    var t = trucks.find(function(tr) { return String(tr.num) === String(activeTruckNum); });
    if (t) { t.err = 0; t.wrn = 0; }
  }

  renderConditions();
  renderTrucks();

  if (isTablet) {
    /* Re-render tablet overview to show all cards clean */
    var scroll = document.getElementById('tb-drawer-scroll');
    if (scroll && typeof tbDrawerTruck !== 'undefined' && tbDrawerTruck) {
      tbBuildOverview(tbDrawerTruck, scroll);
    }
  } else if (document.body.classList.contains('view-mobile')) {
    /* Re-render mobile component cards to show healthy state */
    if (typeof renderMobileCards === 'function') renderMobileCards();
  } else {
    if (dtDrawerTruckNum) dtOpenTruck(dtDrawerTruckNum);
  }

  /* Toast fires after the re-render has settled */
  setTimeout(function() {
    dtShowToast({
      title: 'Truck marked operational',
      body:  'Replacement logged in Unit Life Span tab',
      variant: 'success'
    });
  }, 200);
}

