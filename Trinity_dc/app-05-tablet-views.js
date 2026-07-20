/* app-05-tablet-views.js — Tablet viewport logic (tb), mobile variants. Loads 5th.
   Part of the app.js split. All six app-*.js files share one global
   scope and MUST load in numeric order (see index.html). */
function tbBuildOverview(t, scroll) {
  const cc = (typeof CC_TRUCKS !== 'undefined') ? CC_TRUCKS.find(c => c.num === t.num) : null;

  /* Config from linked unit — drives which cards to show */
  const linkedUnit = UNITS_DATA.find(u => String(u.truck) === String(t.num));
  const unitConfig = linkedUnit ? linkedUnit.config : 'Measured Only';
  const isManaged  = unitConfig === 'Temp+ Admix' || unitConfig === 'Winter Water';
  const waterLabel = unitConfig === 'Winter Water' ? 'Winter Water' : 'Temperate Water';

  /* ── Card state helper ───────────────────────────────────── */
  function tbGetState(cardName) {
    if (!cc) return 'clean';
    const ccName = CC_NAME_MAP[cardName] || cardName;
    const comp = cc.components.find(c => c.name === ccName);
    return comp ? comp.state : 'clean';
  }

  /* ── Build a single card using the same dt-co-card pattern as desktop ── */
  function tbCard(card) {
    /* Check session state overrides */
    if (window.dtConfirmedComponents && window.dtConfirmedComponents[card.name]) {
      const cd = window.dtConfirmedComponents[card.name];
      card = Object.assign({}, card, { state:null, forceAlarm:false, greyDot:false, warnCard:false, flipBack:null }, (typeof cd === 'object' ? cd : {}));
    } else if (window.dtRemovedComponents && window.dtRemovedComponents[card.name]) {
      card = { name:card.name, state:'empty', removedDate:window.dtRemovedComponents[card.name] };
    } else if (window.dtPendingComponents && window.dtPendingComponents[card.name]) {
      const p = window.dtPendingComponents[card.name];
      card = { name:card.name, state:'pending', value:p.serial, unit:'', label:'Installed '+p.installedDate };
    }

    if (card.state === 'empty') {
      return `<div class="dt-co-card empty" onclick="if(!coReplaceActive) tbInstallOpen('${card.name}','${card.removedDate||''}')">
        <div class="dt-co-card-body">
          <div class="dt-co-card-head">
            <div class="dt-empty-slot-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="rgba(54,50,45,0.3)" stroke-width="1.4" stroke-dasharray="3 2"/></svg></div>
            <span class="dt-co-card-name">${card.name}</span>
          </div>
          <div class="dt-empty-label">No component installed</div>
          <div class="dt-empty-date">Removed ${card.removedDate||'\u2014'}</div>
          <div style="flex:1;"></div>
          <div class="dt-empty-action">Install replacement \u2192</div>
        </div>
        <div class="dt-co-card-strip">
          <span class="dt-co-card-strip-label">Not installed</span>
        </div>
      </div>`;
    }
    if (card.state === 'pending') {
      return `<div class="dt-co-card pending">
        <div class="dt-co-card-body">
          <div class="dt-co-card-head">
            <span class="dt-co-card-dot" style="background:#d97706;"></span>
            <span class="dt-co-card-name">${card.name}</span>
          </div>
          <div class="dt-co-card-value-row">
            <span class="dt-co-card-value" style="font-size:22px;letter-spacing:-0.44px;line-height:26px;">${card.value}</span>
          </div>
          <div class="dt-co-card-desc"><span>Pending verification</span><span>Reset errors to confirm</span></div>
        </div>
        <div class="dt-co-card-strip">
          <span class="dt-co-card-strip-dot"></span>
          <span class="dt-co-card-strip-label">Pending verification</span>
        </div>
      </div>`;
    }

    let state = card.forceAlarm ? 'alarm' : (card.warnCard ? 'warn' : (card.greyDot ? 'grey' : tbGetState(card.name)));
    if (card.name === 'WDS' && state === 'alarm') {
      card = Object.assign({}, card, { label:'Water Drum Sensor', value:'--', err:'14' });
    }
    const dotColor = state==='alarm' ? '#d70100' : state==='warn' ? '#ffba0d' : state==='grey' ? 'rgba(54,50,45,0.3)' : '#2ecf1d';
    const faultReason = coFaultReason(card.name, state);
    const stripLabel = state === 'alarm' ? ('Alarm \u00b7 ' + faultReason)
                     : state === 'warn'  ? ('Warning \u00b7 ' + faultReason)
                     : state === 'grey'  ? 'Not active'
                     : 'Operating normally';
    const stripDot = (state === 'alarm' || state === 'warn') ? `<span class="dt-co-card-strip-dot"></span>` : '';
    const descLines = (card.label||'').split('\n').filter(Boolean);
    const descHtml = descLines.map(l => `<span>${l}</span>`).join('');
    let metaHtml = '';
    if (card.extra) metaHtml += `<div class="dt-co-card-meta-row"><span class="dt-co-card-meta-label">${card.extra.label}:</span><span>${card.extra.val}</span></div>`;
    if (card.startup!=null) metaHtml += `<div class="dt-co-card-meta-row"><span class="dt-co-card-meta-label">Startup Count:</span><span>${card.startup}</span></div>`;
    if (card.err!=null)     metaHtml += `<div class="dt-co-card-meta-row"><span class="dt-co-card-meta-label">Error Count:</span><span>${card.err}</span></div>`;

    const safeName = card.name.replace(/'/g, "\\'");
    const isTcg = card.name === 'TCG';
    const valueDisplay = isTcg
      ? `<span class="dt-co-card-value" style="font-size:22px;letter-spacing:-0.44px;line-height:26px;">${card.value || 'TCG-1042'}</span>`
      : `<span class="dt-co-card-value">${card.value||'\u2014'}</span>${card.unit ? `<span class="dt-co-card-unit">${card.unit}</span>` : ''}`;
    const tcgBtn = isTcg
      ? `<button class="dt-co-tcg-replace-btn" onclick="event.stopPropagation();coOpenTcgReplace(false);" title="Replace TCG" aria-label="Replace TCG"><svg width="14" height="14" viewBox="0 0 21 21" fill="none"><path d="M12.4513 5.05364C12.2681 5.24057 12.1655 5.49189 12.1655 5.75364C12.1655 6.01539 12.2681 6.26671 12.4513 6.45364L14.0513 8.05364C14.2382 8.23687 14.4896 8.3395 14.7513 8.3395C15.0131 8.3395 15.2644 8.23687 15.4513 8.05364L19.2213 4.28364C19.7242 5.39483 19.8764 6.63288 19.6578 7.83279C19.4392 9.0327 18.86 10.1375 17.9976 10.9999C17.1352 11.8624 16.0304 12.4415 14.8305 12.6601C13.6306 12.8787 12.3925 12.7265 11.2813 12.2236L4.37132 19.1336C3.9735 19.5315 3.43393 19.755 2.87132 19.755C2.30871 19.755 1.76914 19.5315 1.37132 19.1336C0.973496 18.7358 0.75 18.1962 0.75 17.6336C0.75 17.071 0.973496 16.5315 1.37132 16.1336L8.28132 9.22364C7.77848 8.11245 7.62624 6.87441 7.84486 5.6745C8.06349 4.47459 8.64261 3.3698 9.50504 2.50736C10.3675 1.64493 11.4723 1.06581 12.6722 0.847184C13.8721 0.628558 15.1101 0.780807 16.2213 1.28364L12.4613 5.04364L12.4513 5.05364Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`
      : '';
    return `<div class="dt-co-card ${state}${isTcg ? ' dt-co-card-tcg' : ''}" onclick="tbReplaceCardTap(this,'${safeName}')" style="cursor:pointer;">
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


  /* Use the same card data as desktop */
  const mcsCards = [
    { name:'TCG',           label:'Telematics Control Gateway', value:'Active', unit:'', startup:null, err:'--', extra:{label:'Status', val:'Connected'}, fw:t.ver||'' },
    { name:'DPS pressure',  label:'Drum Pressure Sensor',     value:'196',  unit:'psi',    startup:2,  err:'--' },
    { name:'CPS',           label:'Charge Pressure Sensor',   value:'204',  unit:'psi',    startup:2,  err:'--' },
    { name:'WDS',           label:'Water Drum Sensor',               value:'12', unit:'rpm', startup:2, err:'--', extra:{label:'Drum Temp', val:'91 °F'}, fw:'v2.1.4' },
    { name:'DRS',           label:'Drum Rotation Speed',      value:String(DRS_RPM[String(t.num)] || 8), unit:'rpm',    startup:2,  err:'--', fw:'v1.0.8' },
    { name:'CWR', label:'Cold Weather Relay', value:'91', unit:'°F', startup:2, err:'--', extra:{label:'FW v35.0 · Tilt', val:'1°'}, fw:'v35.0' },
    { name:'ICD',           label:'In-Cab Display',   value:'Active', unit:'',       startup:2,  err:'--', extra:{label:'Firmware', val:'v1468'}, fw:'v1468' },
    ...(isManaged ? [
      { name:'Water Pump',    label:waterLabel, value:String(WATER_GPM[String(t.num)] || 17), unit:'gal/min', startup:1, err:'0', fw:'v4.2.1' },
            { name:'Admix Pump', label:'Admixture Pump', value:String(ADMIX_MLS[String(t.num)] || 165), unit:'ml/s', startup:1, err:'0', fw:'v4.2.1', warnCard:ADMIX_MLS[String(t.num)] < 120 && ADMIX_MLS[String(t.num)] >= 80, forceAlarm:ADMIX_MLS[String(t.num)] < 80 },
    ] : []),
    { name:'ED',            label:'External Display',  value:'Active', unit:'', startup:2, err:'--', extra:{label:'Firmware', val:'v8195'}, fw:'v8195' },
  ];
  const fdmCards = [
    { name:'IOX supply voltage',    label:'Onboard Power Supply',  value:'12.9', unit:'V',       startup:1, err:'--', extra:{label:'Temperature', val:'113 ºF'} },
    ...(isManaged ? [
      { name:'Water meter flow rate', label:waterLabel + ' flow to drum', value:String(WATER_GPM[String(t.num)] || 17), unit:'gal/min', warnCard:WATER_GPM[String(t.num)] < 16 && WATER_GPM[String(t.num)] >= 10, forceAlarm:WATER_GPM[String(t.num)] < 10 },
      { name:'Admix meter flow rate', label:'Admixture Dosing meter', value:'145', unit:'ml/s' },
    ] : []),
  ];

  /* ── Meta rows matching desktop side panel ───────────────── */
  scroll.innerHTML = `
    <!-- Replace Components toolbar -->
    <div id="dt-overview-toolbar" style="display:flex;align-items:center;justify-content:flex-end;padding:0 0 16px;">
      <button class="co-replace-btn" id="tb-replace-btn" onclick="tbReplaceToggle()" style="margin-left:auto;">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2v10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Replace Components
      </button>
    </div>

    <!-- MCS cards -->
    <div class="dt-drawer-section-hdr">
      <svg class="dt-section-chev" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="#36322d" stroke-width="1.4" stroke-linecap="round"/></svg>
      Measurement Component Status
    </div>
    <div class="dt-drawer-cards" style="grid-template-columns:repeat(3,1fr);">
      ${mcsCards.map(tbCard).join('')}
    </div>

    <!-- FDM cards -->
    <div class="dt-drawer-section-hdr" style="margin-top:8px;">
      <svg class="dt-section-chev" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="#36322d" stroke-width="1.4" stroke-linecap="round"/></svg>
      V3 FDM
    </div>
    <div class="dt-drawer-cards" style="grid-template-columns:repeat(3,1fr);">
      ${fdmCards.map(tbCard).join('')}
    </div>

    <!-- Connectivity + Truck Mode -->
    ${tbBuildSidePanel(t)}`;
}

/* ── Tablet truck drawer — De-install unit flow ──────────────────────────
   Mirrors dtTruckDrawerUnlink* exactly: inline confirm panel (no modal),
   "Return to Verify" checkbox, two-state toast, then reshape the drawer.  */

function tbTruckDrawerUnlinkUnit() {
  if (!tbDrawerTruck) return;
  const truckNum = tbDrawerTruck.num;
  const u = (typeof UNITS_DATA !== 'undefined')
    ? UNITS_DATA.find(x => x.status === 'Linked Unit' && String(x.truck) === String(truckNum))
    : null;
  if (!u) return;

  const panel = document.getElementById('tb-drawer-unlink-confirm');
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
        <div class="dt-inline-confirm-body" id="tb-drawer-unlink-body">
          The unit becomes inactive and will need to be reattached before it can collect data again.
        </div>
      </div>
    </div>
    <label style="display:flex;align-items:center;gap:8px;margin:10px 0 12px;cursor:pointer;font-size:13px;color:var(--strong);user-select:none;">
      <input type="checkbox" class="dt-units-cb" id="tb-drawer-unlink-return-cb"
             onchange="tbTruckDrawerUnlinkToggleReturn(this)">
      Return to Verify
    </label>
    <div class="dt-inline-confirm-btns">
      <button class="dt-inline-confirm-btn cancel" onclick="tbTruckDrawerUnlinkCancel()">Cancel</button>
      <button class="dt-inline-confirm-btn danger" onclick="tbTruckDrawerUnlinkDo(document.getElementById('tb-drawer-unlink-return-cb').checked)">Confirm Unlink</button>
    </div>`;
  panel.style.display = 'block';

  const btn = document.getElementById('tb-drawer-unlink-btn');
  if (btn) btn.setAttribute('aria-pressed', 'true');
}

function tbTruckDrawerUnlinkCancel() {
  const panel = document.getElementById('tb-drawer-unlink-confirm');
  if (panel) { panel.style.display = 'none'; panel.innerHTML = ''; }
  const btn = document.getElementById('tb-drawer-unlink-btn');
  if (btn) btn.removeAttribute('aria-pressed');
}

function tbTruckDrawerUnlinkToggleReturn(cb) {
  const body = document.getElementById('tb-drawer-unlink-body');
  if (!body) return;
  body.textContent = cb.checked
    ? 'The unit will be marked Pending Return and stay visible until Verify confirms receipt.'
    : 'The unit becomes inactive and will need to be reattached before it can collect data again.';
}

function tbTruckDrawerUnlinkDo(andReturn) {
  tbTruckDrawerUnlinkCancel();
  if (!tbDrawerTruck) return;
  const truckNum = tbDrawerTruck.num;
  const u = (typeof UNITS_DATA !== 'undefined')
    ? UNITS_DATA.find(x => x.status === 'Linked Unit' && String(x.truck) === String(truckNum))
    : null;
  if (!u) return;
  const unitId = u.id;

  /* 1. Set unit end state */
  if (andReturn) {
    const now = new Date();
    u.status = 'Pending Return';
    u.returnDate = (now.getMonth()+1) + '/' + now.getDate() + '/' + now.getFullYear();
  } else {
    u.status = 'Unlinked Unit';
  }
  u.truck = '--';
  u.assignedToTruck = null;

  /* 2. Add truck back to UNLINKED_TRUCKS pool */
  if (typeof UNLINKED_TRUCKS !== 'undefined') {
    const exists = UNLINKED_TRUCKS.find(t => t.number === truckNum);
    if (!exists) {
      UNLINKED_TRUCKS.push({ number: truckNum, type: 'Front', drum: '--', water: '--', mixer: '--' });
    }
  }

  /* 3. Mark truck unlinked across shared data */
  if (typeof trucks !== 'undefined') {
    const tMain = trucks.find(t => t.num === truckNum);
    if (tMain) { tMain.unlinked = true; tMain.err = 0; tMain.wrn = 0; tMain.truckMode = 'Non Active'; tMain.unitId = '--'; }
  }
  if (typeof CC_TRUCKS !== 'undefined') {
    const tCC = CC_TRUCKS.find(t => t.num === truckNum);
    if (tCC) { tCC.unlinked = true; tCC.err = 0; tCC.wrn = 0; }
  }

  /* 4. Re-render visible tables */
  if (typeof dtRefreshTable === 'function' && typeof dtActiveTab !== 'undefined') dtRefreshTable(dtActiveTab);
  if (typeof dtUnitsRender === 'function') dtUnitsRender();
  if (andReturn && typeof dtUnitsUpdateTabs === 'function') dtUnitsUpdateTabs();
  if (andReturn && typeof dtUnitsPendingRender === 'function') dtUnitsPendingRender();

  /* 5. Reshape the tablet drawer to the unlinked empty state */
  tbTruckDrawerApplyUnlinkedState(truckNum);

  /* 6. Toast — wording differs by end state */
  if (andReturn) {
    dtShowToast({
      title: 'Unit flagged for return',
      body: 'Unit ' + unitId + ' removed from Truck ' + truckNum + '. Pending Return · Verify will confirm receipt.',
      variant: 'warning',
    });
  } else {
    dtShowToast({
      title: 'Unit unlinked',
      body: 'Unit ' + unitId + ' was removed from Truck ' + truckNum + '. Connect a new unit to bring this truck back online.',
    });
  }
}

function tbTruckDrawerApplyUnlinkedState(truckNum) {
  /* Reshape the tablet truck drawer to the "Truck Not Connected" empty state —
     mirrors dtTruckDrawerApplyUnlinkedState exactly. */

  /* 1. Replace tab bar — only Logs + Attach Unit */
  const tabsEl = document.querySelector('#tb-drawer .tb-drawer-tabs');
  if (tabsEl) {
    tabsEl.innerHTML =
      '<button class="tb-drawer-tab active" onclick="tbTruckDrawerShowUnlinkedLogs()">Logs</button>' +
      '<button class="tb-drawer-tab" onclick="tbTruckDrawerOpenAttachUnit()">Attach Unit</button>';
  }

  /* 2. Status pill — grey "Not Connected" */
  const ignBadge = document.getElementById('tb-drawer-ign-badge');
  const ignText  = document.getElementById('tb-drawer-ign-text');
  if (ignBadge) ignBadge.classList.add('off');
  if (ignText)  ignText.textContent = 'Not Connected';

  /* 3. Unit ID subtitle → dash */
  const unitIdEl = document.getElementById('tb-drawer-unit-id');
  if (unitIdEl) unitIdEl.textContent = '—';

  /* 4. Collapse inline confirm if somehow open */
  const inlineConfirm = document.getElementById('tb-drawer-unlink-confirm');
  if (inlineConfirm) { inlineConfirm.style.display = 'none'; inlineConfirm.innerHTML = ''; }

  /* 5. Scroll area — shared illustration + copy + CTA */
  const scroll = document.getElementById('tb-drawer-scroll');
  if (scroll) {
    scroll.innerHTML =
      '<div class="dt-truck-empty">' +
        '<div class="dt-truck-empty-illust">' + dtTruckEmptyIllustrationSvg() + '</div>' +
        '<div class="dt-truck-empty-title">Truck Not Connected</div>' +
        '<div class="dt-truck-empty-sub">Attach Verifi hardware to have a connected truck.</div>' +
        '<button class="dt-truck-empty-cta" onclick="tbTruckDrawerOpenAttachUnit()">Connect Unit</button>' +
      '</div>';
  }
}

function tbTruckDrawerShowUnlinkedLogs() {
  /* Keep Logs tab active, re-render the empty state */
  var tbTabs = document.querySelectorAll('#tb-drawer .tb-drawer-tab');
  tbTabs.forEach(function(t) { t.classList.remove('active'); });
  if (tbTabs.length >= 1) tbTabs[0].classList.add('active');
  var scroll = document.getElementById('tb-drawer-scroll');
  if (!scroll) return;
  scroll.innerHTML =
    '<div class="dt-truck-empty">' +
      '<div class="dt-truck-empty-illust">' + dtTruckEmptyIllustrationSvg() + '</div>' +
      '<div class="dt-truck-empty-title">Truck Not Connected</div>' +
      '<div class="dt-truck-empty-sub">Attach Verifi hardware to have a connected truck.</div>' +
      '<button class="dt-truck-empty-cta" onclick="tbTruckDrawerOpenAttachUnit()">Connect Unit</button>' +
    '</div>';
}

function tbTruckDrawerOpenAttachUnit() {
  /* Switch Attach Unit tab active */
  var tbTabs = document.querySelectorAll('#tb-drawer .tb-drawer-tab');
  tbTabs.forEach(function(t) { t.classList.remove('active'); });
  if (tbTabs.length >= 2) tbTabs[1].classList.add('active');

  /* Reset desktop attach state — we reuse dtTrAtt* functions but point
     them at tb-drawer-scroll by temporarily aliasing dtDrawerTruckNum */
  dtTrAttachSelected = null;
  dtTrAttachQuery    = '';

  tbTruckDrawerRenderAttachUnit();
}

function tbTruckDrawerRenderAttachUnit() {
  /* Identical logic to dtTruckDrawerRenderAttachUnit but targets
     tb-drawer-scroll and uses tbDrawerTruck for the truck number. */
  var truckNum = tbDrawerTruck ? tbDrawerTruck.num : null;
  if (!truckNum) return;

  var allUnits   = (typeof UNITS_DATA !== 'undefined') ? UNITS_DATA : [];
  var candidates = allUnits.filter(function(u) {
    return u.status === 'Unlinked Unit' && u.contract === ACTIVE_ACCOUNT;
  });
  var q = (dtTrAttachQuery || '').toLowerCase();
  var filtered = candidates.filter(function(u) {
    return !q ||
      String(u.id).toLowerCase().includes(q) ||
      (u.contract || '').toLowerCase().includes(q) ||
      (u.sysType  || '').toLowerCase().includes(q) ||
      (u.config   || '').toLowerCase().includes(q) ||
      (u.tgw      || '').toLowerCase().includes(q);
  });

  var rows = filtered.map(function(u, i) {
    var sel  = dtTrAttachSelected === u.id;
    var safe = String(u.id).split("'").join("\'");
    return '<div class="dt-attach-row' + (sel ? ' selected' : '') + (i%2===1?' alt':'') + '" onclick="tbTrAttachSelect(\'' + safe + '\')">' +
      '<div class="dt-attach-cell" style="flex:1;">' + u.id + '</div>' +
      '<div class="dt-attach-cell" style="width:110px;">' + (u.sysType||'—') + '</div>' +
      '<div class="dt-attach-cell" style="width:140px;">' + (u.config||'—') + '</div>' +
    '</div>';
  }).join('');

  var empty = filtered.length === 0
    ? '<div class="dt-attach-empty">' + (candidates.length === 0 ? 'No unlinked units available.' : 'No units match your search.') + '</div>'
    : '';

  var btnDisabled = !dtTrAttachSelected;

  var scroll = document.getElementById('tb-drawer-scroll');
  if (!scroll) return;
  scroll.innerHTML =
    '<div class="dt-attach-title">' + candidates.length + ' Unit' + (candidates.length===1?'':'s') + ' Unlinked</div>' +
    '<div class="dt-attach-toolbar" id="tb-tr-attach-toolbar">' +
      '<div class="dt-attach-search">' +
        '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="#36322d9e" stroke-width="1.4"/><path d="M11 11l2.5 2.5" stroke="#36322d9e" stroke-width="1.4" stroke-linecap="round"/></svg>' +
        '<input id="tb-tr-attach-search" placeholder="Search" autocomplete="off" value="' + (dtTrAttachQuery||'').split('"').join('&quot;') + '" oninput="tbTrAttachSearch()" />' +
      '</div>' +
      '<button class="dt-attach-cta"' + (btnDisabled?' disabled':'') + ' onclick="tbTrAttachConfirm()">Attach Unit</button>' +
    '</div>' +
    '<div id="tb-tr-attach-confirm" class="dt-inline-confirm informational toolbar-row" style="display:none;"></div>' +
    '<div class="dt-attach-table">' +
      '<div class="dt-attach-table-hdr">' +
        '<div class="dt-attach-th" style="flex:1;"><span class="dt-attach-th-label">Unit ID</span><div class="dt-attach-th-divider"></div></div>' +
        '<div class="dt-attach-th" style="width:110px;"><span class="dt-attach-th-label">System Type</span><div class="dt-attach-th-divider"></div></div>' +
        '<div class="dt-attach-th" style="width:140px;flex:0 0 140px;"><span class="dt-attach-th-label">Config</span></div>' +
      '</div>' +
      '<div class="dt-attach-table-body" id="tb-tr-attach-table-body">' + rows + empty + '</div>' +
    '</div>';
}

function tbTrAttachSelect(unitId) {
  dtTrAttachSelected = dtTrAttachSelected === unitId ? null : unitId;
  document.querySelectorAll('#tb-tr-attach-table-body .dt-attach-row').forEach(function(r) { r.classList.remove('selected'); });
  if (dtTrAttachSelected) {
    var safe = String(dtTrAttachSelected).split("'").join("\'");
    var row = document.querySelector('#tb-tr-attach-table-body .dt-attach-row[onclick*="' + safe + '"]');
    if (row) row.classList.add('selected');
  }
  var cta = document.querySelector('#tb-tr-attach-toolbar .dt-attach-cta');
  if (cta) cta.disabled = !dtTrAttachSelected;
}

function tbTrAttachSearch() {
  dtTrAttachQuery = document.getElementById('tb-tr-attach-search').value;
  tbTruckDrawerRenderAttachUnit();
  var input = document.getElementById('tb-tr-attach-search');
  if (input) { input.focus(); var len = input.value.length; input.setSelectionRange(len, len); }
}

function tbTrAttachConfirm() {
  if (!dtTrAttachSelected || !tbDrawerTruck) return;
  var truckNum = tbDrawerTruck.num;
  var panel = document.getElementById('tb-tr-attach-confirm');
  if (!panel) return;
  panel.innerHTML =
    '<div class="dt-inline-confirm-head">' +
      '<div class="dt-inline-confirm-icon">' +
        '<svg width="12" height="12" viewBox="0 0 16 16" fill="none">' +
          '<path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 3.5" stroke="#3069e3" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" stroke="#3069e3" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
      '</div>' +
      '<div class="dt-inline-confirm-text">' +
        '<div class="dt-inline-confirm-title">Link Unit ' + dtTrAttachSelected + ' to Truck ' + truckNum + '?</div>' +
        '<div class="dt-inline-confirm-body">Unit moves to Pending Configuration — fill in config, then save to finalize.</div>' +
      '</div>' +
    '</div>' +
    '<div class="dt-inline-confirm-btns">' +
      '<button class="dt-inline-confirm-btn cancel" onclick="tbTrAttachCancel()">Cancel</button>' +
      '<button class="dt-inline-confirm-btn primary" onclick="tbTrAttachDo()">Link to unit</button>' +
    '</div>';
  panel.style.display = 'flex';
  var toolbar = document.getElementById('tb-tr-attach-toolbar');
  if (toolbar) toolbar.style.display = 'none';
}

function tbTrAttachCancel() {
  var panel = document.getElementById('tb-tr-attach-confirm');
  if (panel) { panel.style.display = 'none'; panel.innerHTML = ''; }
  var toolbar = document.getElementById('tb-tr-attach-toolbar');
  if (toolbar) toolbar.style.display = '';
  var cta = document.querySelector('#tb-tr-attach-toolbar .dt-attach-cta');
  if (cta) cta.disabled = !dtTrAttachSelected;
}

function tbTrAttachDo() {
  tbTrAttachCancel();
  if (!dtTrAttachSelected || !tbDrawerTruck) return;

  var truckNum = tbDrawerTruck.num;
  var u = UNITS_DATA.find(function(x) { return x.id === dtTrAttachSelected; });
  if (!u) return;

  /* Mirror desktop dtTrAttachDo mutations exactly */
  dtUdPendingPrevState = {
    unitId:        u.id,
    prevStatus:    u.status,
    prevTruck:     u.truck,
    prevAssigned:  u.assignedToTruck || null,
    truckSnapshot: (typeof UNLINKED_TRUCKS !== 'undefined')
      ? UNLINKED_TRUCKS.find(function(t) { return t.number === truckNum; })
      : null,
  };

  u.status          = 'Pending';
  u.truck           = truckNum;
  u.assignedToTruck = new Date().toLocaleDateString('en-US', {month:'2-digit', day:'2-digit', year:'numeric'});

  var idx = (typeof UNLINKED_TRUCKS !== 'undefined')
    ? UNLINKED_TRUCKS.findIndex(function(t) { return t.number === truckNum; }) : -1;
  if (idx > -1) UNLINKED_TRUCKS.splice(idx, 1);

  if (typeof dtUnitsRender === 'function') dtUnitsRender();

  /* Pivot: close truck drawer, open unit drawer at Configuration tab —
     tbUdOpen detects status === 'Pending' and routes to config automatically */
  dtTrAttachSelected = null;
  tbUdOpen(u.id);
}

/* Side panel content — Connectivity, meta table, action buttons, fleet map.
   Shared between the Components Overview and Component Timeline tabs. */
function tbBuildSidePanel(t) {
  const unitForTruck = (typeof UNITS_DATA !== 'undefined')
    ? UNITS_DATA.find(u => String(u.truck) === String(t.num)) : null;
  const connColor = t.conn === 'live' ? '#295ccc' : 'var(--soft)';
  const connText  = t.conn === 'live' ? 'Connected' : 'No connection';
  const modeText  = t.truckMode === 'Active' ? 'Live' : (t.truckMode || 'Live');
  const tcgId     = (unitForTruck && unitForTruck.tgw && unitForTruck.tgw !== '--') ? unitForTruck.tgw : '—';
  const formatTs  = (s) => {
    if (!s || s === '—') return '—';
    const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)\s+(\d{2})\/(\d{2})\/(\d{2,4})$/i);
    if (!m) return s;
    const [, hh, mm, ap, mo, da, yy] = m;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(mo,10)-1]} ${parseInt(da,10)}, ${yy.length===2?'20'+yy:yy}, ${parseInt(hh,10)}:${mm}:38 ${ap.toUpperCase()}`;
  };
  const lastTs = formatTs(t.lastConn);
  const metaRows = [
    ['TCG ID',             tcgId,          true],
    ['Code version',       t.ver||'—',     false],
    ['Commissioned',       '--',            true],
    ['Last Connect',       lastTs,          false],
    ['Last System Status', lastTs,          true],
    ['Last Reboot',        lastTs,          false],
    ['Drum Manufacturer',  'Schwing, 2022', true],
    ['Drum Size',          '10yd³',         false],
    ['Number of Loads',    '15,000',        true],
  ];
  const metaHtml = metaRows.map(([label, val, alt]) => `
    <div class="dt-drawer-meta-row${alt?' alt':''}">
      <span class="dt-drawer-meta-label">${label}</span>
      <span class="dt-drawer-meta-val" style="${label==='TCG ID'?'font-family:\'DM Mono\',monospace;font-size:12px;':''}">${val}</span>
    </div>`).join('');

  return `
    <div class="dt-drawer-summary-row" style="margin-top:8px;">
      <div class="dt-drawer-summary-card">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 10a8 8 0 0112 0M5 13a4.5 4.5 0 016 0M8 16h.01" stroke="#36322d" stroke-width="1.4" stroke-linecap="round"/></svg>
        <div>
          <div style="font-size:14px;font-weight:500;color:var(--strong);letter-spacing:-0.28px;">Connectivity</div>
          <div style="font-size:14px;color:${connColor};letter-spacing:-0.28px;">${connText}</div>
        </div>
      </div>
      <div class="dt-drawer-summary-card">
        <svg width="16" height="13" viewBox="0 0 16 13" fill="none"><circle cx="8" cy="6.5" r="5.5" stroke="#36322d" stroke-width="1.4"/><circle cx="8" cy="6.5" r="2" stroke="#36322d" stroke-width="1.4"/></svg>
        <div>
          <div style="font-size:14px;font-weight:500;color:var(--strong);letter-spacing:-0.28px;">Truck Mode</div>
          <div style="font-size:14px;color:var(--defined);letter-spacing:-0.28px;">${modeText}</div>
        </div>
      </div>
    </div>
    <div class="dt-drawer-meta">${metaHtml}</div>
    <div class="dt-drawer-actions" id="tb-drawer-actions">
      <button class="dt-drawer-action-btn" onclick="tbPingTruck()">Ping Truck</button>
      <button class="dt-drawer-action-btn danger" id="tb-drawer-unlink-btn" onclick="tbTruckDrawerUnlinkUnit()">De-install unit</button>
    </div>
    <div id="tb-drawer-unlink-confirm" class="dt-inline-confirm" style="display:none;"></div>
    <div style="margin:16px 8px 8px;background:white;border:1px solid var(--border);border-radius:16px;overflow:hidden;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--border);">
        <span style="font-size:14px;font-weight:500;color:var(--strong);letter-spacing:-0.28px;">Fleet map</span>
        <button style="background:transparent;border:1px solid var(--border);border-radius:20px;padding:6px 12px;font-size:13px;font-weight:500;color:var(--strong);font-family:var(--font);letter-spacing:-0.26px;cursor:pointer;display:flex;align-items:center;gap:4px;">
          Go to the map <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <div style="height:160px;background:#e8e8e8;display:flex;align-items:center;justify-content:center;position:relative;">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style="opacity:0.25;"><rect width="40" height="40" rx="4" fill="#999"/><path d="M4 36l10-20 10 10 8-14 8 24H4z" fill="white"/></svg>
        <div style="position:absolute;bottom:28px;left:50%;transform:translateX(-50%);">
          <svg width="24" height="32" viewBox="0 0 24 32" fill="none"><path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20S24 21 24 12C24 5.37 18.63 0 12 0z" fill="#3069e3"/><circle cx="12" cy="12" r="5" fill="white"/></svg>
        </div>
        <div style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:white;border:1px solid var(--border);border-radius:20px;padding:4px 10px;font-size:12px;font-weight:500;color:var(--strong);font-family:var(--font);box-shadow:0 2px 8px rgba(0,0,0,0.12);white-space:nowrap;">
          Truck ${t.num}
        </div>
      </div>
    </div>`;
}

/* Builds the Component Conditions table for a single truck —
   mirrors the desktop CC page: component columns with coloured dots. */


/* ── TABLET TRUCK LOGS — mobile in-place navigation pattern ──────────────
   State A: log list. Tap a row → State B: detail with back button.
   Reuses the mobile `logs` data and renderDetailContent function. */
let tbLogsActiveIdx = 0;
let tbLogsActiveTab = 'structured';
let tbLogSearchVal  = '';
let tbLogsFilters = { from:'', to:'', source:'all', msgType:'all', subType:'all', search:'' };

function tbLogsFilter() {
  tbLogsFilters.search = (document.getElementById('tb-log-search')?.value || '').toLowerCase();
  tbLogsRenderList();
}

function tbLogsToggleFilter() {
  const panel = document.getElementById('tb-log-filter-panel');
  const btn   = document.getElementById('tb-log-filter-btn');
  if (!panel) return;
  const open = panel.style.display === 'flex';
  panel.style.display = open ? 'none' : 'flex';
  panel.style.flexWrap = 'wrap';
  btn.style.background = open ? 'var(--layer-1)' : 'var(--strong)';
  btn.style.color      = open ? 'var(--strong)'  : 'white';
  btn.style.borderColor = open ? 'var(--border)' : 'var(--strong)';
}

function tbLogsMsgTypeChange(val) {
  tbLogsFilters.msgType = val;
  tbLogsFilters.subType = 'all';
  const sub    = document.getElementById('tb-logs-subtype');
  const helper = document.getElementById('tb-logs-subtype-helper');
  if (val === 'all') {
    sub.disabled = true;
    sub.innerHTML = `<option value="all">All</option>`;
    if (helper) helper.textContent = 'Select a message type first';
  } else {
    sub.disabled = false;
    const options = (typeof DT_LOGS_SUB_TYPES !== 'undefined' && DT_LOGS_SUB_TYPES[val]) || [];
    sub.innerHTML = `<option value="all">All</option>` +
      options.map(o => `<option value="${o}">${o}</option>`).join('');
    if (helper) helper.textContent = '';
  }
  tbLogsRenderList();
}

function tbLogsRenderList() {
  const container = document.getElementById('tb-log-scroll');
  if (!container || typeof logs === 'undefined') return;
  const f = tbLogsFilters;
  const search = (f.search || '').toLowerCase();

  const filtered = logs.filter(l => {
    if (f.source  !== 'all' && l.source  !== f.source)  return false;
    if (f.msgType !== 'all' && l.type    !== f.msgType)  return false;
    if (f.subType !== 'all' && l.sub     !== f.subType)  return false;
    if (f.from) {
      const from = new Date(f.from);
      const lDate = new Date(l.date);
      if (!isNaN(from) && !isNaN(lDate) && lDate < from) return false;
    }
    if (f.to) {
      const to = new Date(f.to);
      const lDate = new Date(l.date);
      if (!isNaN(to) && !isNaN(lDate) && lDate > to) return false;
    }
    if (search && !`${l.date} ${l.time} ${l.type} ${l.sub}`.toLowerCase().includes(search)) return false;
    return true;
  });

  container.innerHTML = filtered.length === 0
    ? `<div style="padding:32px 16px;text-align:center;font-size:13px;color:var(--soft);">No matching logs</div>`
    : filtered.map(l => {
        const i = logs.indexOf(l);
        return `<div onclick="tbLogsOpenDetail(${i})" style="display:flex;cursor:pointer;border-bottom:1px solid var(--border);${i%2===0?'background:var(--layer-1);':'background:var(--layer-2);'}">
          <div style="flex:1.4;padding:10px 12px;">
            <div style="font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.26px;">${l.date}</div>
            <div style="font-size:11px;color:var(--soft);letter-spacing:-0.22px;margin-top:2px;">${l.time}</div>
          </div>
          <div style="flex:1;padding:10px 12px;font-size:13px;color:var(--defined);letter-spacing:-0.26px;align-self:center;">${l.type}</div>
          <div style="flex:1.2;padding:10px 12px;font-size:13px;color:var(--defined);letter-spacing:-0.26px;align-self:center;">${l.sub}</div>
        </div>`;
      }).join('');
}

function tbLogsOpenDetail(i) {
  tbLogsActiveIdx = i;
  const l = logs[i];
  const titleEl = document.getElementById('tb-det-title');
  const metaEl  = document.getElementById('tb-det-meta');
  if (titleEl) titleEl.textContent = l.sub + ' — ' + l.type;
  if (metaEl)  metaEl.textContent  = l.date + ' ' + l.time + ' · TRUCK';
  document.getElementById('tb-logs-list').style.display   = 'none';
  const overlay = document.getElementById('tb-logs-overlay');
  if (overlay) { overlay.style.display = 'flex'; }
  ['structured','raw'].forEach(tab => {
    const el = document.getElementById('tb-det-tab-' + tab);
    if (!el) return;
    const active = tab === 'structured';
    el.style.color        = active ? 'var(--blue)' : 'var(--soft)';
    el.style.borderBottom = active ? '2px solid var(--blue)' : '2px solid transparent';
    el.style.fontWeight   = active ? '500' : '400';
  });
  tbLogsRenderDetail('structured');
}

function tbLogsShowList() {
  document.getElementById('tb-logs-list').style.display   = 'flex';
  const overlay = document.getElementById('tb-logs-overlay');
  if (overlay) overlay.style.display = 'none';
}

function tbLogsTab(tab, el) {
  tbLogsActiveTab = tab;
  ['structured','raw'].forEach(t => {
    const tabEl = document.getElementById('tb-det-tab-' + t);
    if (!tabEl) return;
    const active = t === tab;
    tabEl.style.color        = active ? 'var(--blue)' : 'var(--soft)';
    tabEl.style.borderBottom = active ? '2px solid var(--blue)' : '2px solid transparent';
    tabEl.style.fontWeight   = active ? '500' : '400';
  });
  tbLogsRenderDetail(tab);
}

function tbLogsRenderDetail(tab) {
  /* Temporarily swap detail-scroll ID so mobile renderDetailContent writes
     into the tablet detail area instead of the (hidden) mobile one. */
  const tbArea   = document.getElementById('tb-det-scroll');
  if (!tbArea) return;
  const mobArea  = document.getElementById('detail-scroll');
  if (mobArea)  mobArea.id = '__mob-det-hidden';
  tbArea.id = 'detail-scroll';
  const prevIdx  = typeof activeLogIdx !== 'undefined' ? activeLogIdx : 0;
  if (typeof activeLogIdx !== 'undefined') activeLogIdx = tbLogsActiveIdx;
  if (typeof renderDetailContent === 'function') renderDetailContent(tab);
  /* Restore */
  tbArea.id = 'tb-det-scroll';
  if (mobArea)  mobArea.id = 'detail-scroll';
  if (typeof activeLogIdx !== 'undefined') activeLogIdx = prevIdx;
}

function tbNavMenu() {
  const panel = document.getElementById('tb-nav-panel');
  const scrim  = document.getElementById('tb-nav-scrim');
  if (!panel) return;
  panel.style.transform = 'translateX(0)';
  scrim.style.display   = 'block';
}

function tbNavClose() {
  const panel = document.getElementById('tb-nav-panel');
  const scrim  = document.getElementById('tb-nav-scrim');
  if (!panel) return;
  panel.style.transform = 'translateX(-100%)';
  scrim.style.display   = 'none';
}

/* ── TABLET REPLACE COMPONENTS ────────────────────────────────────
   Mirrors the desktop dtReplace* flow but targets tb-drawer-* IDs.
   Uses the same coReplaceEnter/Exit/UpdateBar machinery.
────────────────────────────────────────────────────────────────── */
function tbReplaceToggle() {
  if (coReplaceActive) { tbReplaceCancel(); return; }
  coReplaceActive = true;
  coSelectedCards.clear();
  const btn = document.getElementById('tb-replace-btn');
  if (btn) { btn.classList.add('active'); btn.innerHTML = '✕&nbsp; Cancel'; }
  /* Add dt-replace-mode to the scroll container — this is what the CSS keys off
     to style cards as selectable (checkboxes, hover states, selected highlight) */
  const scroll = document.getElementById('tb-drawer-scroll');
  if (scroll) scroll.classList.add('dt-replace-mode');
  /* Show save bar */
  const bar = document.getElementById('tb-replace-bar');
  if (bar) bar.style.display = '';
  tbReplaceUpdateBar();
}

function tbReplaceCancel() {
  coReplaceActive = false;
  coSelectedCards.clear();
  const btn = document.getElementById('tb-replace-btn');
  if (btn) { btn.classList.remove('active'); btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2v10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> Replace Components'; }
  /* Remove replace mode class from scroll */
  const scroll = document.getElementById('tb-drawer-scroll');
  if (scroll) scroll.classList.remove('dt-replace-mode');
  /* Hide save bar */
  const bar = document.getElementById('tb-replace-bar');
  if (bar) bar.style.display = 'none';
  /* Clear selected state from cards */
  document.querySelectorAll('#tb-drawer-scroll .dt-co-card.co-selected').forEach(card => {
    card.classList.remove('co-selected');
  });
}

function tbReplaceCardTap(el, compName) {
  if (!coReplaceActive) return;
  if (compName === 'TCG') return;
  el.classList.toggle('co-selected');
  if (el.classList.contains('co-selected')) coSelectedCards.add(compName);
  else coSelectedCards.delete(compName);
  tbReplaceUpdateBar();
}

function tbReplaceUpdateBar() {
  const n = coSelectedCards.size;
  const confirmBtn = document.getElementById('tb-replace-confirm');
  const hint = document.getElementById('tb-replace-hint');
  if (confirmBtn) { confirmBtn.disabled = n === 0; confirmBtn.style.opacity = n > 0 ? '1' : '0.4'; }
  if (hint) hint.textContent = n > 0 ? n + ' component' + (n > 1 ? 's' : '') + ' selected' : 'Select components to remove';
}

function tbReplaceConfirm() {
  if (coSelectedCards.size === 0) return;
  const names   = Array.from(coSelectedCards);
  const bullets = typeof makeBulletList === 'function' ? makeBulletList(names) : names.map(n => '<div>• ' + n + '</div>').join('');
  const existing = document.getElementById('tb-remove-confirm-overlay');
  if (existing) existing.remove();
  const main = document.getElementById('tb-drawer-main');
  if (!main) return;
  const overlay = document.createElement('div');
  overlay.id = 'tb-remove-confirm-overlay';
  overlay.style.cssText = 'position:absolute;left:0;right:0;bottom:0;z-index:50;background:var(--layer-1);border-top:1px solid var(--border);padding:16px 24px 24px;box-shadow:0 -8px 24px rgba(54,50,45,0.1);';
  overlay.innerHTML = '<div style="font-size:14px;font-weight:500;color:var(--strong);letter-spacing:-0.28px;margin-bottom:4px;">Remove components?</div>'
    + '<div style="font-size:13px;color:var(--soft);letter-spacing:-0.26px;margin-bottom:8px;">Are these physically off the truck?</div>'
    + '<div style="border-top:1px solid var(--border);padding-top:6px;margin-bottom:12px;">' + bullets + '</div>'
    + '<div style="display:flex;gap:8px;">'
    + '<button onclick="document.getElementById(\'tb-remove-confirm-overlay\').remove()" style="flex:1;background:none;border:1px solid var(--border);border-radius:32px;padding:9px 16px;font-size:13px;font-weight:500;font-family:var(--font);color:var(--strong);cursor:pointer;">Cancel</button>'
    + '<button onclick="tbReplaceDoRemove()" style="flex:2;background:#d97706;color:white;border:none;border-radius:32px;padding:9px 16px;font-size:13px;font-weight:500;font-family:var(--font);cursor:pointer;">Yes, remove from system</button>'
    + '</div>';
  main.appendChild(overlay);
}

function tbReplaceDoRemove() {
  const el = document.getElementById('tb-remove-confirm-overlay');
  if (el) el.remove();

  const now = new Date();
  const dateStr = (now.getMonth()+1) + '/' + now.getDate() + '/' + String(now.getFullYear()).slice(-2)
    + ' · ' + now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});

  /* Capture selected BEFORE tbReplaceCancel clears coSelectedCards */
  const removed = Array.from(coSelectedCards);

  /* Write to dtRemovedComponents so tbBuildOverview applyOverrides renders empty slots */
  if (!window.dtRemovedComponents) window.dtRemovedComponents = {};
  removed.forEach(name => {
    window.dtRemovedComponents[name] = dateStr;
    /* Also update CC_TRUCKS for consistency with desktop flow */
    CC_TRUCKS.forEach(function(t) {
      if (!t.components) return;
      const comp = t.components.find(function(c) { return c.name === name; });
      if (comp) { comp.state = 'empty'; comp.evt = 'Not installed'; comp.dot = 'rgba(54,50,45,0.2)'; comp.removedDate = dateStr; }
    });
  });

  /* Exit replace mode */
  tbReplaceCancel();

  /* Re-render overview to show empty slots */
  const scroll = document.getElementById('tb-drawer-scroll');
  if (tbDrawerTruck && scroll) tbBuildOverview(tbDrawerTruck, scroll);

  /* Auto-open install panel for the first removed component */
  if (removed.length > 0) {
    setTimeout(() => dtInstallOpen(removed[0], dateStr), 300);
  }
}

function tbInstallOpen(compName, removedDate) {
  /* dtInstallOpen now detects view-tablet and targets tb-drawer-main directly */
  dtInstallOpen(compName, removedDate);
}

/* ── TABLET UNITS PAGE ──────────────────────────────────────────────
   Chunk 1: List view — stat row, toolbar, tab strip, units table,
   pending return table, select mode, return-to-Verifi workflow.
   All reads directly from UNITS_DATA (same source as desktop).
   Uses tb- prefixed IDs to avoid conflicts with dt- desktop elements.
────────────────────────────────────────────────────────────────── */

let tbUnitsSelectMode = false;
let tbUnitsPendingSelected = new Set();
let tbUnitsActiveTab  = 'units';

/* Restore the search row + tab strip that tbNavMap hides */
function tbRestoreChrome() {
  const srchRow = document.getElementById('tb-search-row');
  if (srchRow) srchRow.style.display = '';
  const tabsRow = document.getElementById('tb-tabs-row');
  if (tabsRow) tabsRow.style.display = '';
  const hdr = document.getElementById('tb-page-header');
  if (hdr) hdr.style.display = '';
}

function tbHideChrome() {
  const srchRow = document.getElementById('tb-search-row');
  if (srchRow) srchRow.style.display = 'none';
  const tabsRow = document.getElementById('tb-tabs-row');
  if (tabsRow) tabsRow.style.display = 'none';
}

function tbNavUnits() {
  /* Switch tablet page to Units view */
  tbNavClose();
  /* Hide All Trucks chrome — header, search row, tabs row */
  tbHideChrome();
  const pageHdr = document.getElementById('tb-page-header');
  if (pageHdr) pageHdr.style.display = 'none';
  /* Ensure mobile s-units screen is hidden */
  var sUnits = document.getElementById('s-units');
  if (sUnits) sUnits.classList.remove('active');
  document.getElementById('tb-content').style.display      = 'none';
  document.getElementById('tb-page-units').style.display   = 'flex';
  document.getElementById('tb-page-units').style.flexDirection = 'column';
  const tbUp = document.getElementById('tb-page-update');
  if (tbUp) tbUp.style.display = 'none';
  const tbMp = document.getElementById('tb-page-map');
  if (tbMp) tbMp.style.display = 'none';
  const drop = document.getElementById('tb-srch-drop');
  if (drop) drop.style.display = 'none';
  tbSrchActiveQuery = '';
  tbNavSetActive('tb-nav-units');
  /* Show Add Unit if internal role */
  const addWrap = document.getElementById('tb-units-add-btn-wrap');
  if (addWrap) addWrap.style.display = dtCurrentRole === 'internal' ? '' : 'none';
  tbUnitsRender();
}

/* ── Tablet Software Update — state ──────────────────────────
   Independent from the desktop swu* system. Shares the same
   truck data (SWU_TRUCKS) but manages its own selections and
   dropdown state so the two views don't collide.              */
/* ── TABLET SOFTWARE UPDATE — UI state only ───────────────────
   All selection / send / retry logic runs through the shared
   desktop engine (window.swuState, swuExecuteSend, etc.).
   This object tracks only dropdown open/close state.           */
var tbSwuUI = {
  trucksOpen: false,
  verOpen:    false,
  commitOpen: false,
  pillOpen:   false,
  currentTab: 'updates',
  built:      false
};

function tbSwuInit() {
  /* Always re-sync the truck list so newly added trucks appear */
  tbSwuBuildTruckList();
  tbSwuSyncFromState();
  /* Render status table once */
  tbSwuRenderStatusTab();
  /* Sync send button state */
  tbSwuSyncSendBtn();
}

function tbSwuBuildTruckList() {
  var list = document.getElementById('tb-swu-trucks-list');
  if (!list) return;
  list.innerHTML = '';
  var trucks = window.SWU_TRUCKS || [];
  var allCountEl = document.getElementById('tb-swu-trucks-all-count');
  if (allCountEl) allCountEl.textContent = trucks.length + ' trucks';
  trucks.forEach(function(t) {
    var row = document.createElement('div');
    row.dataset.truck = t.num;
    row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:9px 12px;cursor:pointer;';
    row.onmouseenter = function(){ this.style.background='rgba(54,50,45,0.04)'; };
    row.onmouseleave = function(){ this.style.background=''; };
    row.onclick      = function(){ tbSwuTruckToggle(t.num); };
    row.innerHTML =
      '<div id="tb-swu-tc-chk-'+t.num+'" style="width:16px;height:16px;border-radius:4px;border:1.5px solid rgba(54,50,45,0.30);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:background 0.1s;"></div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-family:var(--font);font-size:13px;color:var(--strong);letter-spacing:-0.26px;">Truck '+t.num+'</div>' +
        (t.driver ? '<div style="font-family:var(--font);font-size:11px;color:var(--soft);letter-spacing:-0.22px;">'+t.driver+'</div>' : '') +
      '</div>' +
      '<div style="font-family:var(--font);font-size:11px;color:var(--soft);letter-spacing:-0.22px;font-family:\'DM Mono\',monospace;">'+(t.currentVer||t.version||'')+'</div>';
    list.appendChild(row);
  });
  tbSwuUI.built = true;
}

/* Sync the truck checkboxes to match swuState.selected */
function tbSwuSyncFromState() {
  var trucks = window.SWU_TRUCKS || [];
  var s = window.swuState || {};
  var sel   = s.selected   || new Set();
  var inflight = s.inFlight || new Set();
  var completed = s.completed || new Map();
  trucks.forEach(function(t) {
    var chk = document.getElementById('tb-swu-tc-chk-'+t.num);
    if (!chk) return;
    var isSelected = sel.has(t.num);
    var isLocked   = inflight.has(t.num) || completed.has(t.num);
    chk.style.background  = isSelected ? '#3069e3' : '';
    chk.style.borderColor = isSelected ? '#3069e3' : 'rgba(54,50,45,0.30)';
    chk.innerHTML = isSelected
      ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '';
    /* Grey out locked trucks */
    var row = chk.closest('[data-truck]');
    if (row) row.style.opacity = isLocked ? '0.4' : '1';
  });
  /* Update trucks pill label */
  var n = sel.size;
  var lbl = document.getElementById('tb-swu-trucks-label');
  if (lbl) {
    if (n === 0) { lbl.textContent = 'Select trucks'; lbl.style.color = 'var(--soft)'; }
    else if (n === trucks.length) { lbl.textContent = 'All trucks ('+n+')'; lbl.style.color = 'var(--strong)'; }
    else { lbl.textContent = n + (n===1?' truck':' trucks') + ' selected'; lbl.style.color = 'var(--strong)'; }
  }
  /* Select-all checkbox */
  var eligible = trucks.filter(function(t){ return !inflight.has(t.num) && !completed.has(t.num); });
  var allSel = eligible.length > 0 && eligible.every(function(t){ return sel.has(t.num); });
  var allChk = document.getElementById('tb-swu-trucks-all-check');
  if (allChk) {
    allChk.style.background  = allSel ? '#3069e3' : '';
    allChk.style.borderColor = allSel ? '#3069e3' : 'rgba(54,50,45,0.30)';
    allChk.innerHTML = allSel
      ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '';
  }
}

function tbSwuTruckToggle(num) {
  var s = window.swuState;
  if (!s) return;
  /* Respect same lock rules as desktop */
  if (s.inFlight.has(num) || s.completed.has(num)) return;
  if (s.selected.has(num)) s.selected.delete(num);
  else s.selected.add(num);
  tbSwuSyncFromState();
  tbSwuSyncSendBtn();
  tbSwuRenderOverviewTablet();
}

function tbSwuTrucksSelectAll() {
  var s = window.swuState;
  if (!s) return;
  var trucks = window.SWU_TRUCKS || [];
  var eligible = trucks.filter(function(t){ return !s.inFlight.has(t.num) && !s.completed.has(t.num); });
  var allSel = eligible.every(function(t){ return s.selected.has(t.num); });
  if (allSel) { eligible.forEach(function(t){ s.selected.delete(t.num); }); }
  else        { eligible.forEach(function(t){ s.selected.add(t.num);    }); }
  tbSwuSyncFromState();
  tbSwuSyncSendBtn();
  tbSwuRenderOverviewTablet();
}

function tbSwuTrucksToggle() {
  tbSwuUI.trucksOpen = !tbSwuUI.trucksOpen;
  var menu = document.getElementById('tb-swu-trucks-menu');
  if (menu) menu.style.display = tbSwuUI.trucksOpen ? 'block' : 'none';
  if (tbSwuUI.trucksOpen) {
    tbSwuUI.verOpen = false; tbSwuUI.commitOpen = false;
    var v=document.getElementById('tb-swu-ver-menu');    if(v) v.style.display='none';
    var c=document.getElementById('tb-swu-commit-menu'); if(c) c.style.display='none';
  }
}

function tbSwuTrucksClose() {
  tbSwuUI.trucksOpen = false;
  var m = document.getElementById('tb-swu-trucks-menu');
  if (m) m.style.display = 'none';
}

function tbSwuDdToggle(which) {
  var isOpen = (which === 'ver') ? tbSwuUI.verOpen : tbSwuUI.commitOpen;
  tbSwuUI.verOpen = false; tbSwuUI.commitOpen = false; tbSwuUI.trucksOpen = false;
  var vm=document.getElementById('tb-swu-ver-menu');    if(vm) vm.style.display='none';
  var cm=document.getElementById('tb-swu-commit-menu'); if(cm) cm.style.display='none';
  var tm=document.getElementById('tb-swu-trucks-menu'); if(tm) tm.style.display='none';
  if (!isOpen) {
    if (which==='ver') { tbSwuUI.verOpen=true;    if(vm) vm.style.display='block'; }
    else               { tbSwuUI.commitOpen=true; if(cm) cm.style.display='block'; }
  }
}

function tbSwuDdSelect(which, value) {
  /* Mirror into shared swuDdState so desktop engine sees it */
  window.swuDdState = window.swuDdState || {};
  if (which === 'ver') {
    window.swuDdState.version = value;
    var lbl = document.getElementById('tb-swu-ver-label');
    if (lbl) { lbl.textContent = value; lbl.style.color = 'var(--strong)'; }
    tbSwuUI.verOpen = false;
    var m = document.getElementById('tb-swu-ver-menu'); if(m) m.style.display='none';
  } else {
    window.swuDdState.commit = value;
    var lbl2 = document.getElementById('tb-swu-commit-label');
    if (lbl2) { lbl2.textContent = value; lbl2.style.color = 'var(--strong)'; }
    tbSwuUI.commitOpen = false;
    var m2 = document.getElementById('tb-swu-commit-menu'); if(m2) m2.style.display='none';
  }
  tbSwuSyncSendBtn();
  tbSwuRenderOverviewTablet();
}

function tbSwuSyncSendBtn() {
  var btn  = document.getElementById('tb-swu-send-btn');
  var meta = document.getElementById('tb-swu-send-meta');
  var s    = window.swuState || {};
  var dd   = window.swuDdState || {};
  var n    = (s.selected && s.selected.size) || 0;
  var canSend = n > 0 && !!dd.version && !!dd.commit;
  if (btn) {
    btn.style.opacity      = canSend ? '1' : '0.4';
    btn.style.pointerEvents = canSend ? 'auto' : 'none';
  }
  if (meta) {
    if (n === 0)       meta.textContent = 'No trucks selected';
    else if (!dd.version) meta.textContent = n + (n===1?' truck':' trucks') + ' selected — choose a version';
    else               meta.textContent = n + (n===1?' truck':' trucks') + ' · ' + dd.version + ' · ' + (dd.commit||'On Next Startup');
  }
}

function tbSwuSend() {
  /* Delegate entirely to shared engine */
  if (typeof swuSendUpdates === 'function') {
    swuSendUpdates();
    /* Patch: after engine runs, re-render the tablet overview and sync UI */
    setTimeout(function(){ tbSwuSyncFromState(); tbSwuRenderOverviewTablet(); tbSwuSyncSendBtn(); }, 50);
    setTimeout(function(){ tbSwuSyncFromState(); tbSwuRenderOverviewTablet(); tbSwuSyncSendBtn(); }, 2700);
  }
}

/* ── TABLET PACKAGE OVERVIEW ──────────────────────────────────
   Mirrors the desktop swuRenderOverview() but targets the
   tablet DOM IDs. Status pills, expand/collapse, retry button,
   and component detail rows all work identically.             */
function tbSwuRenderOverviewTablet() {
  var empty    = document.getElementById('tb-swu-overview-empty');
  var pop      = document.getElementById('tb-swu-overview-populated');
  var tbody    = document.getElementById('tb-swu-ovt-tbody');
  var footL    = document.getElementById('tb-swu-foot-left');
  var footR    = document.getElementById('tb-swu-foot-right');
  if (!empty || !pop || !tbody) return;

  var s = window.swuState;
  if (!s) { empty.style.display='flex'; pop.style.display='none'; return; }
  var orderedNums = (window.SWU_TRUCKS||[]).map(function(t){ return t.num; });

  var pendingRows=[], inFlightRows=[], failedRows=[], completedRows=[];
  orderedNums.forEach(function(num) {
    if (s.inFlight.has(num)) {
      inFlightRows.push({ num:num, status:'progress', data:{ version: s.inFlight._pkg } });
    } else if (s.selected.has(num)) {
      var truck = (window.SWU_TRUCKS||[]).find(function(t){ return t.num===num; });
      pendingRows.push({ num:num, status:'pending', data:{ version: truck ? truck.currentVer : '' } });
    }
  });
  failedRows = Array.from(s.failed.entries())
    .map(function(e){ return { num:e[0], status:'failed',   data:e[1], _at:e[1]._at||0 }; })
    .sort(function(a,b){ return b._at-a._at; });
  completedRows = Array.from(s.completed.entries())
    .map(function(e){ return { num:e[0], status:'complete', data:e[1], _at:e[1]._at||0 }; })
    .sort(function(a,b){ return b._at-a._at; });

  var rows = pendingRows.concat(inFlightRows, failedRows, completedRows);

  if (rows.length === 0) {
    empty.style.display = 'flex'; pop.style.display = 'none';
    if (footL) footL.textContent = 'Awaiting selection';
    if (footR) footR.style.display = 'none';
    return;
  }
  empty.style.display = 'none'; pop.style.display = 'flex';
  if (footL) footL.textContent = '';
  if (footR) { footR.style.display='inline'; footR.textContent='1 – '+rows.length+' of '+rows.length+' Records'; }

  function pill(status) {
    if (status==='pending')  return '<span style="font-size:11px;font-weight:500;color:#b46e00;background:#fff0d4;padding:2px 8px;border-radius:20px;letter-spacing:-0.2px;">Pending</span>';
    if (status==='progress') return '<span style="font-size:11px;font-weight:500;color:#3069e3;background:#e8effe;padding:2px 8px;border-radius:20px;letter-spacing:-0.2px;display:inline-flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border:1.5px solid #3069e3;border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin 0.8s linear infinite;"></span>In Progress</span>';
    if (status==='complete') return '<span style="font-size:11px;font-weight:500;color:#1e6252;background:#d5f1d2;padding:2px 8px;border-radius:20px;letter-spacing:-0.2px;">Complete</span>';
    if (status==='failed')   return '<span style="font-size:11px;font-weight:500;color:#c13c2d;background:#fde8e6;padding:2px 8px;border-radius:20px;letter-spacing:-0.2px;">Failed</span>';
    return '';
  }

  function expandedBody(num, data, status) {
    var banner = '';
    if (status==='failed' && data.failedComponent) {
      var retryVer = data.version||'';
      banner = '<div style="background:#fde8e6;border:1px solid #f5c6c2;border-radius:8px;padding:10px 12px;margin-bottom:10px;display:flex;flex-direction:column;gap:8px;">' +
        '<span style="font-family:var(--font);font-size:12px;color:#c13c2d;line-height:1.45;">'+data.failedComponent+' update failed. Remaining components were skipped to prevent partial state. Re-run the update or contact support.</span>' +
        '<button onclick="tbSwuRetry(\''+num+'\',\''+retryVer+'\');event.stopPropagation();" style="align-self:flex-start;display:inline-flex;align-items:center;gap:6px;background:#c13c2d;color:white;border:none;border-radius:20px;padding:6px 14px;font-family:var(--font);font-size:12px;font-weight:500;cursor:pointer;">' +
          '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 2v3h-3M2 10v-3h3M9.5 7a4 4 0 0 1-7-1M2.5 5a4 4 0 0 1 7 1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          'Retry update</button>' +
        '</div>';
    }
    var compRows = '';
    var title = 'Component update results';
    if (status==='pending') {
      var fw = (window.SWU_STATUS_FIRMWARE && window.SWU_STATUS_FIRMWARE[num]) || {};
      var comps = [{name:'TCG',cur:fw.tcg},{name:'ICD',cur:fw.icd},{name:'ED',cur:fw.ed},{name:'WDS',cur:fw.wds},{name:'CWR',cur:fw.cwr}];
      title = 'Current firmware on this truck';
      compRows = comps.map(function(c){
        return '<div style="display:grid;grid-template-columns:60px 1fr auto;gap:0 8px;padding:5px 0;border-bottom:1px solid var(--border);">'+
          '<span style="font-family:var(--font);font-size:12px;font-weight:500;color:var(--strong);">'+c.name+'</span>'+
          '<span style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--soft);">'+(c.cur||'—')+'</span>'+
          '<span style="font-size:11px;color:#b46e00;background:#fff0d4;padding:1px 6px;border-radius:10px;">Awaiting</span>'+
          '</div>';
      }).join('');
    } else {
      var comps2 = data.components || [];
      compRows = comps2.map(function(c){
        var versHtml = (c.fromVer&&c.toVer) ? c.fromVer+' → '+c.toVer : (c.toVer||'');
        var sColor = c.status==='complete' ? '#1e6252' : (c.status==='failed' ? '#c13c2d' : 'var(--soft)');
        var sBg    = c.status==='complete' ? '#d5f1d2' : (c.status==='failed' ? '#fde8e6' : 'rgba(54,50,45,0.07)');
        var sLabel = c.status==='complete' ? 'Complete' : (c.status==='failed' ? 'Failed' : 'Skipped');
        return '<div style="display:grid;grid-template-columns:60px 1fr auto;gap:0 8px;padding:5px 0;border-bottom:1px solid var(--border);">'+
          '<span style="font-family:var(--font);font-size:12px;font-weight:500;color:var(--strong);">'+c.name+'</span>'+
          '<span style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--soft);">'+versHtml+'</span>'+
          '<span style="font-size:11px;font-weight:500;color:'+sColor+';background:'+sBg+';padding:1px 6px;border-radius:10px;">'+sLabel+'</span>'+
          '</div>';
      }).join('');
    }
    return '<div style="padding:10px 12px 4px;background:rgba(54,50,45,0.02);border-top:1px solid var(--border);">'+
      banner+
      '<div style="font-family:var(--font);font-size:11px;font-weight:500;color:var(--soft);letter-spacing:-0.22px;margin-bottom:6px;text-transform:uppercase;">'+title+'</div>'+
      compRows+'</div>';
  }

  tbody.innerHTML = rows.map(function(r, i) {
    var isExpandable = r.status==='complete' || r.status==='failed' || r.status==='pending';
    var isExpanded   = isExpandable && s.expanded.has(r.num);
    var bgStyle = i%2===1 ? 'background:rgba(54,50,45,0.02);' : '';
    var cursor  = isExpandable ? 'cursor:pointer;' : '';
    var onClick = isExpandable ? ' onclick="tbSwuToggleExpand(\''+r.num+'\')"' : '';
    var chevron = isExpandable
      ? '<svg width="10" height="6" viewBox="0 0 10 6" fill="none" style="flex-shrink:0;transition:transform 0.15s;transform:'+(isExpanded?'rotate(180deg)':'rotate(0deg)')+'"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<span style="width:10px;display:inline-block;"></span>';
    var html =
      '<div'+onClick+' style="display:grid;grid-template-columns:20px 1fr auto auto;align-items:center;gap:4px;padding:9px 0;border-bottom:1px solid var(--border);'+bgStyle+cursor+'">'+
        '<div>'+chevron+'</div>'+
        '<div style="font-family:var(--font);font-size:13px;color:var(--strong);letter-spacing:-0.26px;font-weight:500;">Truck '+r.num+'</div>'+
        '<div style="padding-right:10px;">'+pill(r.status)+'</div>'+
        '<div style="font-family:\'DM Mono\',monospace;font-size:12px;color:var(--soft);">'+(r.data.version||'—')+'</div>'+
      '</div>';
    if (isExpandable && isExpanded) html += expandedBody(r.num, r.data, r.status);
    return html;
  }).join('');
}

function tbSwuToggleExpand(num) {
  var s = window.swuState;
  if (!s) return;
  if (s.expanded.has(num)) s.expanded.delete(num);
  else s.expanded.add(num);
  tbSwuRenderOverviewTablet();
}

function tbSwuRetry(num, version) {
  if (typeof swuRetryFailed === 'function') {
    swuRetryFailed(num, version);
    setTimeout(function(){ tbSwuSyncFromState(); tbSwuRenderOverviewTablet(); tbSwuSyncSendBtn(); }, 50);
    setTimeout(function(){ tbSwuSyncFromState(); tbSwuRenderOverviewTablet(); tbSwuSyncSendBtn(); }, 2700);
  }
}

function tbSwuRenderStatusTab() {
  var thead = document.getElementById('tb-swu-status-thead');
  var tbody = document.getElementById('tb-swu-status-tbody');
  var meta  = document.getElementById('tb-swu-status-meta');
  if (!thead || !tbody) return;
  var trucks = window.SWU_TRUCKS || [];
  if (meta) meta.textContent = trucks.length + ' trucks';
  var cols = [
    { id:'num',    label:'Truck'       },
    { id:'driver', label:'Driver'      },
    { id:'system', label:'System'      },
    { id:'tcg',    label:'TCG'         },
    { id:'icd',    label:'ICD'         },
    { id:'ed',     label:'ED'          },
    { id:'wds',    label:'WDS'         },
    { id:'cwr',    label:'CWR'         },
    { id:'comp',   label:'Compliance'  }
  ];
  var trH = thead.querySelector('tr');
  if (!trH) { trH=document.createElement('tr'); thead.appendChild(trH); }
  trH.innerHTML = '';
  cols.forEach(function(c){
    var th=document.createElement('th');
    th.textContent=c.label;
    th.style.cssText='font-family:var(--font);font-size:11px;font-weight:500;color:var(--soft);letter-spacing:-0.22px;text-align:left;padding:6px 10px 8px;border-bottom:1px solid var(--border);white-space:nowrap;';
    trH.appendChild(th);
  });
  tbody.innerHTML='';
  trucks.forEach(function(t,i){
    var fw = (window.SWU_STATUS_FIRMWARE && window.SWU_STATUS_FIRMWARE[t.num]) || {};
    var compliance = t.compliance || (t.currentVer === (window.SWU_TRUCKS||[]).reduce(function(a,x){ return x.currentVer||x.version; },'') ? 'latest' : 'outdated');
    var compColor = compliance==='latest' ? '#1e6252' : '#b46e00';
    var compBg    = compliance==='latest' ? '#d5f1d2' : '#fff0d4';
    var compText  = compliance==='latest' ? 'Current' : 'Outdated';
    var td = 'font-family:var(--font);font-size:13px;color:var(--strong);letter-spacing:-0.26px;padding:9px 10px;border-bottom:1px solid var(--border);white-space:nowrap;';
    var tr=document.createElement('tr');
    if (i%2===1) tr.style.background='rgba(54,50,45,0.02)';
    tr.innerHTML=
      '<td style="'+td+'font-weight:500;">'+t.num+'</td>'+
      '<td style="'+td+'color:var(--soft);">'+(t.driver||'—')+'</td>'+
      '<td style="'+td+'color:var(--soft);">'+(fw.system||'V5')+'</td>'+
      '<td style="'+td+'font-family:\'DM Mono\',monospace;font-size:12px;">'+(fw.tcg||'—')+'</td>'+
      '<td style="'+td+'font-family:\'DM Mono\',monospace;font-size:12px;">'+(fw.icd||'—')+'</td>'+
      '<td style="'+td+'font-family:\'DM Mono\',monospace;font-size:12px;">'+(fw.ed||'—')+'</td>'+
      '<td style="'+td+'font-family:\'DM Mono\',monospace;font-size:12px;">'+(fw.wds||'—')+'</td>'+
      '<td style="'+td+'font-family:\'DM Mono\',monospace;font-size:12px;">'+(fw.cwr||'—')+'</td>'+
      '<td style="'+td+'"><span style="font-size:11px;font-weight:500;color:'+compColor+';background:'+compBg+';padding:2px 8px;border-radius:20px;">'+compText+'</span></td>';
    tbody.appendChild(tr);
  });
}

function tbSwuPillToggle() {
  tbSwuUI.pillOpen = !tbSwuUI.pillOpen;
  var m = document.getElementById('tb-swu-pill-menu');
  if (m) m.style.display = tbSwuUI.pillOpen ? 'block' : 'none';
}

function tbSwuSetTab(tab) {
  tbSwuUI.currentTab = tab;
  tbSwuUI.pillOpen = false;
  var m = document.getElementById('tb-swu-pill-menu'); if(m) m.style.display='none';
  var lbl = document.getElementById('tb-swu-pill-label');
  if (lbl) lbl.textContent = tab==='updates' ? 'Software Updates' : 'Software Status';
  var u=document.getElementById('tb-swu-tab-updates');
  var s2=document.getElementById('tb-swu-tab-status');
  if (u) u.style.display = tab==='updates' ? 'flex' : 'none';
  if (s2) s2.style.display = tab==='status' ? 'flex' : 'none';
}

/* Close tablet swu dropdowns when clicking outside */
document.addEventListener('click', function(e) {
  if (!e.target.closest('#tb-swu-trucks-wrap') && tbSwuUI.trucksOpen) { tbSwuTrucksClose(); }
  if (!e.target.closest('#tb-swu-ver-wrap')    && tbSwuUI.verOpen)    { tbSwuUI.verOpen=false; var m=document.getElementById('tb-swu-ver-menu'); if(m) m.style.display='none'; }
  if (!e.target.closest('#tb-swu-commit-wrap') && tbSwuUI.commitOpen) { tbSwuUI.commitOpen=false; var m2=document.getElementById('tb-swu-commit-menu'); if(m2) m2.style.display='none'; }
  if (!e.target.closest('#tb-swu-pill-wrap')   && tbSwuUI.pillOpen)   { tbSwuUI.pillOpen=false; var m3=document.getElementById('tb-swu-pill-menu'); if(m3) m3.style.display='none'; }
});

/* ── MOBILE SOFTWARE UPDATE ───────────────────────────────────
   Identical logic to tbSwu* but targets mob-swu-* IDs.
   Shares window.swuState and swuExecuteSend exactly.          */
var mobSwuUI = { trucksOpen:false, verOpen:false, commitOpen:false, pillOpen:false, currentTab:'updates' };

function mobSwuOpen() {
  moMapBack();
  var el = document.getElementById('mob-page-update');
  if (el) el.style.display = 'flex';
  mobSwuBuildTruckList();
  mobSwuSyncFromState();
  mobSwuRenderStatusTab();
  mobSwuSyncSendBtn();
  /* Mark Software Updates active in sidenav */
  document.querySelectorAll('.sn-sub-item').forEach(function(i) { i.classList.remove('active'); });
  document.querySelectorAll('.sn-sub-item').forEach(function(i) {
    if (i.textContent.trim() === 'Software Updates') i.classList.add('active');
  });
  if (typeof closeNav === 'function') closeNav();
}

function mobSwuClose() {
  var el = document.getElementById('mob-page-update');
  if (el) el.style.display = 'none';
}

function mobSwuBuildTruckList() {
  var list = document.getElementById('mob-swu-trucks-list');
  if (!list) return;
  list.innerHTML = '';
  var trucks = window.SWU_TRUCKS || [];
  var cnt = document.getElementById('mob-swu-trucks-all-count');
  if (cnt) cnt.textContent = trucks.length + ' trucks';
  trucks.forEach(function(t) {
    var row = document.createElement('div');
    row.dataset.truck = t.num;
    row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:9px 12px;cursor:pointer;';
    row.onmouseenter = function(){ this.style.background='rgba(54,50,45,0.04)'; };
    row.onmouseleave = function(){ this.style.background=''; };
    row.onclick      = function(){ mobSwuTruckToggle(t.num); };
    row.innerHTML =
      '<div id="mob-swu-tc-chk-'+t.num+'" style="width:16px;height:16px;border-radius:4px;border:1.5px solid rgba(54,50,45,0.30);flex-shrink:0;display:flex;align-items:center;justify-content:center;"></div>' +
      '<div style="flex:1;min-width:0;"><div style="font-family:var(--font);font-size:13px;color:var(--strong);letter-spacing:-0.26px;">Truck '+t.num+'</div>' +
        (t.driver ? '<div style="font-family:var(--font);font-size:11px;color:var(--soft);">'+t.driver+'</div>' : '') +
      '</div>' +
      '<div style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--soft);">'+(t.currentVer||t.version||'')+'</div>';
    list.appendChild(row);
  });
}

function mobSwuSyncFromState() {
  var trucks = window.SWU_TRUCKS || [];
  var s = window.swuState || {};
  var sel = s.selected || new Set();
  var inflight = s.inFlight || new Set();
  var completed = s.completed || new Map();
  trucks.forEach(function(t) {
    var chk = document.getElementById('mob-swu-tc-chk-'+t.num);
    if (!chk) return;
    var isSel = sel.has(t.num);
    chk.style.background  = isSel ? '#3069e3' : '';
    chk.style.borderColor = isSel ? '#3069e3' : 'rgba(54,50,45,0.30)';
    chk.innerHTML = isSel ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '';
    var row = chk.closest('[data-truck]');
    if (row) row.style.opacity = (inflight.has(t.num)||completed.has(t.num)) ? '0.4' : '1';
  });
  var n = sel.size;
  var lbl = document.getElementById('mob-swu-trucks-label');
  if (lbl) {
    if (n===0)               { lbl.textContent='Select trucks'; lbl.style.color='var(--soft)'; }
    else if (n===trucks.length) { lbl.textContent='All trucks ('+n+')'; lbl.style.color='var(--strong)'; }
    else                     { lbl.textContent=n+(n===1?' truck':' trucks')+' selected'; lbl.style.color='var(--strong)'; }
  }
  var eligible = trucks.filter(function(t){ return !inflight.has(t.num)&&!completed.has(t.num); });
  var allSel = eligible.length>0 && eligible.every(function(t){ return sel.has(t.num); });
  var allChk = document.getElementById('mob-swu-trucks-all-check');
  if (allChk) {
    allChk.style.background  = allSel ? '#3069e3' : '';
    allChk.style.borderColor = allSel ? '#3069e3' : 'rgba(54,50,45,0.30)';
    allChk.innerHTML = allSel ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '';
  }
}

function mobSwuTruckToggle(num) {
  var s = window.swuState; if(!s) return;
  if (s.inFlight.has(num)||s.completed.has(num)) return;
  if (s.selected.has(num)) s.selected.delete(num); else s.selected.add(num);
  mobSwuSyncFromState(); mobSwuSyncSendBtn(); mobSwuRenderOverview();
}

function mobSwuTrucksSelectAll() {
  var s = window.swuState; if(!s) return;
  var trucks = window.SWU_TRUCKS||[];
  var eligible = trucks.filter(function(t){ return !s.inFlight.has(t.num)&&!s.completed.has(t.num); });
  var allSel = eligible.every(function(t){ return s.selected.has(t.num); });
  if (allSel) eligible.forEach(function(t){ s.selected.delete(t.num); });
  else        eligible.forEach(function(t){ s.selected.add(t.num); });
  mobSwuSyncFromState(); mobSwuSyncSendBtn(); mobSwuRenderOverview();
}

function mobSwuTrucksToggle() {
  mobSwuUI.trucksOpen = !mobSwuUI.trucksOpen;
  var m = document.getElementById('mob-swu-trucks-menu');
  if (m) m.style.display = mobSwuUI.trucksOpen ? 'block' : 'none';
  if (mobSwuUI.trucksOpen) {
    mobSwuUI.verOpen=false; mobSwuUI.commitOpen=false;
    var v=document.getElementById('mob-swu-ver-menu');    if(v) v.style.display='none';
    var c=document.getElementById('mob-swu-commit-menu'); if(c) c.style.display='none';
  }
}

function mobSwuTrucksClose() {
  mobSwuUI.trucksOpen=false;
  var m=document.getElementById('mob-swu-trucks-menu'); if(m) m.style.display='none';
}

function mobSwuDdToggle(which) {
  var isOpen = which==='ver' ? mobSwuUI.verOpen : mobSwuUI.commitOpen;
  mobSwuUI.verOpen=false; mobSwuUI.commitOpen=false; mobSwuUI.trucksOpen=false;
  var vm=document.getElementById('mob-swu-ver-menu');    if(vm) vm.style.display='none';
  var cm=document.getElementById('mob-swu-commit-menu'); if(cm) cm.style.display='none';
  var tm=document.getElementById('mob-swu-trucks-menu'); if(tm) tm.style.display='none';
  if (!isOpen) {
    if (which==='ver') { mobSwuUI.verOpen=true;    if(vm) vm.style.display='block'; }
    else               { mobSwuUI.commitOpen=true; if(cm) cm.style.display='block'; }
  }
}

function mobSwuDdSelect(which, value) {
  window.swuDdState = window.swuDdState||{};
  if (which==='ver') {
    window.swuDdState.version = value;
    var lbl=document.getElementById('mob-swu-ver-label');
    if(lbl){ lbl.textContent=value; lbl.style.color='var(--strong)'; }
    mobSwuUI.verOpen=false;
    var m=document.getElementById('mob-swu-ver-menu'); if(m) m.style.display='none';
  } else {
    window.swuDdState.commit = value;
    var lbl2=document.getElementById('mob-swu-commit-label');
    if(lbl2){ lbl2.textContent=value; lbl2.style.color='var(--strong)'; }
    mobSwuUI.commitOpen=false;
    var m2=document.getElementById('mob-swu-commit-menu'); if(m2) m2.style.display='none';
  }
  mobSwuSyncSendBtn(); mobSwuRenderOverview();
}

function mobSwuSyncSendBtn() {
  var btn=document.getElementById('mob-swu-send-btn');
  var meta=document.getElementById('mob-swu-send-meta');
  var s=window.swuState||{}; var dd=window.swuDdState||{};
  var n=(s.selected&&s.selected.size)||0;
  var canSend=n>0&&!!dd.version&&!!dd.commit;
  if(btn){ btn.style.opacity=canSend?'1':'0.4'; btn.style.pointerEvents=canSend?'auto':'none'; }
  if(meta){
    if(n===0)        meta.textContent='No trucks selected';
    else if(!dd.version) meta.textContent=n+(n===1?' truck':' trucks')+' selected — choose a version';
    else             meta.textContent=n+(n===1?' truck':' trucks')+' · '+dd.version+' · '+(dd.commit||'On Next Startup');
  }
}

function mobSwuSend() {
  if (typeof swuSendUpdates==='function') {
    swuSendUpdates();
    setTimeout(function(){ mobSwuSyncFromState(); mobSwuRenderOverview(); mobSwuSyncSendBtn(); }, 50);
    setTimeout(function(){ mobSwuSyncFromState(); mobSwuRenderOverview(); mobSwuSyncSendBtn(); }, 2700);
  }
}

function mobSwuRenderOverview() {
  var empty=document.getElementById('mob-swu-overview-empty');
  var pop=document.getElementById('mob-swu-overview-populated');
  var tbody=document.getElementById('mob-swu-ovt-tbody');
  var footL=document.getElementById('mob-swu-foot-left');
  var footR=document.getElementById('mob-swu-foot-right');
  if(!empty||!pop||!tbody) return;
  var s=window.swuState;
  if(!s){ empty.style.display='flex'; pop.style.display='none'; return; }
  var orderedNums=(window.SWU_TRUCKS||[]).map(function(t){ return t.num; });
  var pendingRows=[],inFlightRows=[],failedRows=[],completedRows=[];
  orderedNums.forEach(function(num){
    if(s.inFlight.has(num)) inFlightRows.push({num:num,status:'progress',data:{version:s.inFlight._pkg}});
    else if(s.selected.has(num)){ var t=(window.SWU_TRUCKS||[]).find(function(x){ return x.num===num; }); pendingRows.push({num:num,status:'pending',data:{version:t?t.currentVer:''}}); }
  });
  failedRows=Array.from(s.failed.entries()).map(function(e){ return {num:e[0],status:'failed',data:e[1],_at:e[1]._at||0}; }).sort(function(a,b){ return b._at-a._at; });
  completedRows=Array.from(s.completed.entries()).map(function(e){ return {num:e[0],status:'complete',data:e[1],_at:e[1]._at||0}; }).sort(function(a,b){ return b._at-a._at; });
  var rows=pendingRows.concat(inFlightRows,failedRows,completedRows);
  if(rows.length===0){ empty.style.display='flex'; pop.style.display='none'; if(footL) footL.textContent='Awaiting selection'; if(footR) footR.style.display='none'; return; }
  empty.style.display='none'; pop.style.display='flex';
  if(footL) footL.textContent='';
  if(footR){ footR.style.display='inline'; footR.textContent='1 – '+rows.length+' of '+rows.length+' Records'; }
  function pill(st){
    if(st==='pending')  return '<span style="font-size:11px;font-weight:500;color:#b46e00;background:#fff0d4;padding:2px 7px;border-radius:20px;">Pending</span>';
    if(st==='progress') return '<span style="font-size:11px;font-weight:500;color:#3069e3;background:#e8effe;padding:2px 7px;border-radius:20px;display:inline-flex;align-items:center;gap:3px;"><span style="width:7px;height:7px;border:1.5px solid #3069e3;border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin 0.8s linear infinite;"></span>In Progress</span>';
    if(st==='complete') return '<span style="font-size:11px;font-weight:500;color:#1e6252;background:#d5f1d2;padding:2px 7px;border-radius:20px;">Complete</span>';
    if(st==='failed')   return '<span style="font-size:11px;font-weight:500;color:#c13c2d;background:#fde8e6;padding:2px 7px;border-radius:20px;">Failed</span>';
    return '';
  }
  function expandedBody(num,data,status){
    var banner='';
    if(status==='failed'&&data.failedComponent){
      var rv=data.version||'';
      banner='<div style="background:#fde8e6;border:1px solid #f5c6c2;border-radius:8px;padding:10px 12px;margin-bottom:10px;display:flex;flex-direction:column;gap:8px;">' +
        '<span style="font-family:var(--font);font-size:12px;color:#c13c2d;line-height:1.45;">'+data.failedComponent+' update failed. Re-run the update or contact support.</span>' +
        '<button onclick="mobSwuRetry(\''+num+'\',\''+rv+'\');event.stopPropagation();" style="align-self:flex-start;display:inline-flex;align-items:center;gap:6px;background:#c13c2d;color:white;border:none;border-radius:20px;padding:6px 14px;font-family:var(--font);font-size:12px;font-weight:500;cursor:pointer;">' +
          '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 2v3h-3M2 10v-3h3M9.5 7a4 4 0 0 1-7-1M2.5 5a4 4 0 0 1 7 1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Retry update</button>' +
        '</div>';
    }
    var compRows='';
    var title='Component update results';
    if(status==='pending'){
      var fw=(window.SWU_STATUS_FIRMWARE&&window.SWU_STATUS_FIRMWARE[num])||{};
      var comps=[{name:'TCG',cur:fw.tcg},{name:'ICD',cur:fw.icd},{name:'ED',cur:fw.ed},{name:'WDS',cur:fw.wds},{name:'CWR',cur:fw.cwr}];
      title='Current firmware';
      compRows=comps.map(function(c){ return '<div style="display:grid;grid-template-columns:50px 1fr auto;gap:0 6px;padding:5px 0;border-bottom:1px solid var(--border);"><span style="font-family:var(--font);font-size:12px;font-weight:500;color:var(--strong);">'+c.name+'</span><span style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--soft);">'+(c.cur||'—')+'</span><span style="font-size:11px;color:#b46e00;background:#fff0d4;padding:1px 6px;border-radius:10px;">Awaiting</span></div>'; }).join('');
    } else {
      var comps2=data.components||[];
      compRows=comps2.map(function(c){
        var vh=(c.fromVer&&c.toVer)?c.fromVer+' → '+c.toVer:(c.toVer||'');
        var sc=c.status==='complete'?'#1e6252':(c.status==='failed'?'#c13c2d':'var(--soft)');
        var sb=c.status==='complete'?'#d5f1d2':(c.status==='failed'?'#fde8e6':'rgba(54,50,45,0.07)');
        var sl=c.status==='complete'?'Complete':(c.status==='failed'?'Failed':'Skipped');
        return '<div style="display:grid;grid-template-columns:50px 1fr auto;gap:0 6px;padding:5px 0;border-bottom:1px solid var(--border);"><span style="font-family:var(--font);font-size:12px;font-weight:500;color:var(--strong);">'+c.name+'</span><span style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--soft);">'+vh+'</span><span style="font-size:11px;font-weight:500;color:'+sc+';background:'+sb+';padding:1px 6px;border-radius:10px;">'+sl+'</span></div>';
      }).join('');
    }
    return '<div style="padding:10px 12px 4px;background:rgba(54,50,45,0.02);border-top:1px solid var(--border);">'+banner+'<div style="font-family:var(--font);font-size:11px;font-weight:500;color:var(--soft);letter-spacing:-0.22px;margin-bottom:6px;text-transform:uppercase;">'+title+'</div>'+compRows+'</div>';
  }
  tbody.innerHTML=rows.map(function(r,i){
    var isExp=r.status==='complete'||r.status==='failed'||r.status==='pending';
    var expanded=isExp&&s.expanded.has(r.num);
    var bg=i%2===1?'background:rgba(54,50,45,0.02);':'';
    var onClick=isExp?' onclick="mobSwuToggleExpand(\''+r.num+'\')"':'';
    var chev=isExp?'<svg width="10" height="6" viewBox="0 0 10 6" fill="none" style="flex-shrink:0;transition:transform 0.15s;transform:'+(expanded?'rotate(180deg)':'rotate(0deg)')+'"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>':'<span style="width:10px;display:inline-block;"></span>';
    var html='<div'+onClick+' style="display:grid;grid-template-columns:20px 1fr auto auto;align-items:center;gap:4px;padding:9px 0;border-bottom:1px solid var(--border);'+bg+(isExp?'cursor:pointer;':'')+'">'+
      '<div>'+chev+'</div>'+
      '<div style="font-family:var(--font);font-size:13px;color:var(--strong);letter-spacing:-0.26px;font-weight:500;">Truck '+r.num+'</div>'+
      '<div style="padding-right:6px;">'+pill(r.status)+'</div>'+
      '<div style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--soft);">'+(r.data.version||'—')+'</div>'+
      '</div>';
    if(isExp&&expanded) html+=expandedBody(r.num,r.data,r.status);
    return html;
  }).join('');
}

function mobSwuToggleExpand(num) {
  var s=window.swuState; if(!s) return;
  if(s.expanded.has(num)) s.expanded.delete(num); else s.expanded.add(num);
  mobSwuRenderOverview();
}

function mobSwuRetry(num,version) {
  if(typeof swuRetryFailed==='function'){
    swuRetryFailed(num,version);
    setTimeout(function(){ mobSwuSyncFromState(); mobSwuRenderOverview(); mobSwuSyncSendBtn(); },50);
    setTimeout(function(){ mobSwuSyncFromState(); mobSwuRenderOverview(); mobSwuSyncSendBtn(); },2700);
  }
}

function mobSwuRenderStatusTab() {
  var thead=document.getElementById('mob-swu-status-thead');
  var tbody=document.getElementById('mob-swu-status-tbody');
  var meta=document.getElementById('mob-swu-status-meta');
  if(!thead||!tbody) return;
  var trucks=window.SWU_TRUCKS||[];
  if(meta) meta.textContent=trucks.length+' trucks';
  var cols=['Truck','Driver','System','TCG','ICD','ED','WDS','CWR','Compliance'];
  var trH=thead.querySelector('tr'); if(!trH){trH=document.createElement('tr');thead.appendChild(trH);}
  trH.innerHTML='';
  cols.forEach(function(c){ var th=document.createElement('th'); th.textContent=c; th.style.cssText='font-family:var(--font);font-size:11px;font-weight:500;color:var(--soft);letter-spacing:-0.22px;text-align:left;padding:6px 10px 8px;border-bottom:1px solid var(--border);white-space:nowrap;'; trH.appendChild(th); });
  tbody.innerHTML='';
  trucks.forEach(function(t,i){
    var fw=(window.SWU_STATUS_FIRMWARE&&window.SWU_STATUS_FIRMWARE[t.num])||{};
    var compColor=t.compliance==='latest'?'#1e6252':'#b46e00';
    var compBg=t.compliance==='latest'?'#d5f1d2':'#fff0d4';
    var compText=t.compliance==='latest'?'Current':'Outdated';
    var td='font-family:var(--font);font-size:13px;color:var(--strong);letter-spacing:-0.26px;padding:8px 10px;border-bottom:1px solid var(--border);white-space:nowrap;';
    var tr=document.createElement('tr'); if(i%2===1) tr.style.background='rgba(54,50,45,0.02)';
    tr.innerHTML='<td style="'+td+'font-weight:500;">'+t.num+'</td><td style="'+td+'color:var(--soft);">'+(t.driver||'—')+'</td><td style="'+td+'color:var(--soft);">'+(fw.system||'V5')+'</td><td style="'+td+'font-family:\'DM Mono\',monospace;font-size:12px;">'+(fw.tcg||'—')+'</td><td style="'+td+'font-family:\'DM Mono\',monospace;font-size:12px;">'+(fw.icd||'—')+'</td><td style="'+td+'font-family:\'DM Mono\',monospace;font-size:12px;">'+(fw.ed||'—')+'</td><td style="'+td+'font-family:\'DM Mono\',monospace;font-size:12px;">'+(fw.wds||'—')+'</td><td style="'+td+'font-family:\'DM Mono\',monospace;font-size:12px;">'+(fw.cwr||'—')+'</td><td style="'+td+'"><span style="font-size:11px;font-weight:500;color:'+compColor+';background:'+compBg+';padding:2px 7px;border-radius:20px;">'+compText+'</span></td>';
    tbody.appendChild(tr);
  });
}

function mobSwuPillToggle() {
  mobSwuUI.pillOpen=!mobSwuUI.pillOpen;
  var m=document.getElementById('mob-swu-pill-menu'); if(m) m.style.display=mobSwuUI.pillOpen?'block':'none';
}

function mobSwuSetTab(tab) {
  mobSwuUI.currentTab=tab; mobSwuUI.pillOpen=false;
  var m=document.getElementById('mob-swu-pill-menu'); if(m) m.style.display='none';
  var lbl=document.getElementById('mob-swu-pill-label'); if(lbl) lbl.textContent=tab==='updates'?'Software Updates':'Software Status';
  var u=document.getElementById('mob-swu-tab-updates');
  var s=document.getElementById('mob-swu-tab-status');
  if(u) u.style.display=tab==='updates'?'flex':'none';
  if(s) s.style.display=tab==='status'?'flex':'none';
}

document.addEventListener('click', function(e) {
  if(!e.target.closest('#mob-swu-trucks-wrap') && mobSwuUI.trucksOpen) mobSwuTrucksClose();
  if(!e.target.closest('#mob-swu-ver-wrap')    && mobSwuUI.verOpen)    { mobSwuUI.verOpen=false;    var m=document.getElementById('mob-swu-ver-menu');    if(m) m.style.display='none'; }
  if(!e.target.closest('#mob-swu-commit-wrap') && mobSwuUI.commitOpen) { mobSwuUI.commitOpen=false; var m2=document.getElementById('mob-swu-commit-menu'); if(m2) m2.style.display='none'; }
  if(!e.target.closest('#mob-swu-pill-wrap')   && mobSwuUI.pillOpen)   { mobSwuUI.pillOpen=false;   var m3=document.getElementById('mob-swu-pill-menu');   if(m3) m3.style.display='none'; }
});

function tbNavUpdate() {
  /* Switch tablet page to Software Update placeholder */
  tbNavClose();
  tbHideChrome();
  document.getElementById('tb-content').style.display      = 'none';
  document.getElementById('tb-page-units').style.display   = 'none';
  const tbUp = document.getElementById('tb-page-update');
  if (tbUp) { tbUp.style.display = 'flex'; tbUp.style.flexDirection = 'column'; }
  const tbMp = document.getElementById('tb-page-map');
  if (tbMp) tbMp.style.display = 'none';
  /* Update page header */
  const titleEl = document.querySelector('#tb-page .tb-page-title');
  if (titleEl) titleEl.textContent = 'Software Update';
  /* Clear search — not relevant on this page */
  const searchInput = document.getElementById('tb-search-input');
  if (searchInput) { searchInput.placeholder = 'Search\u2026'; searchInput.value = ''; }
  const drop = document.getElementById('tb-srch-drop');
  if (drop) drop.style.display = 'none';
  tbSrchActiveQuery = '';
  tbNavSetActive('tb-nav-update');
  /* Init the software update page on first visit */
  tbSwuInit();
}

/* ── Tablet nav active state helper ──────────────────────────
   Swaps the active pill highlight between DC sub-nav items.
   IDs: tb-nav-alltrucks, tb-nav-map, tb-nav-units, tb-nav-update */
function tbNavSetActive(activeId) {
  var items = [
    { id: 'tb-nav-alltrucks' },
    { id: 'tb-nav-map'       },
    { id: 'tb-nav-units'     },
    { id: 'tb-nav-update'    }
  ];
  items.forEach(function(item) {
    var el = document.getElementById(item.id);
    if (!el) return;
    var span = el.querySelector('span');
    if (el.id === activeId) {
      el.style.background = '#3069e3';
      el.dataset.active = '1';
      if (span) { span.style.color = '#ffffff'; span.style.fontWeight = '500'; }
    } else {
      el.style.background = '';
      el.dataset.active = '';
      if (span) { span.style.color = 'rgba(54,50,45,0.5)'; span.style.fontWeight = ''; }
    }
  });
}

function tbNavMap() {
  /* Switch tablet/mobile page to Leaflet Map */
  tbNavClose();
  document.getElementById('tb-content').style.display      = 'none';
  document.getElementById('tb-page-units').style.display   = 'none';
  const tbUp = document.getElementById('tb-page-update');
  if (tbUp) tbUp.style.display = 'none';
  const tbMp = document.getElementById('tb-page-map');
  if (tbMp) { tbMp.style.display = 'flex'; tbMp.style.flexDirection = 'column'; }
  /* Hide outer search row + tab strip — map has its own */
  const srchRow = document.getElementById('tb-search-row');
  if (srchRow) srchRow.style.display = 'none';
  const tabsRow = document.getElementById('tb-tabs-row');
  if (tabsRow) tabsRow.style.display = 'none';
  const pageHdr = document.getElementById('tb-page-header');
  if (pageHdr) pageHdr.style.display = 'none';
  /* Update page header */
  const titleEl = document.querySelector('#tb-page .tb-page-title');
  if (titleEl) titleEl.textContent = 'Map';
  /* Clear search */
  const searchInput = document.getElementById('tb-search-input');
  if (searchInput) { searchInput.placeholder = 'Search\u2026'; searchInput.value = ''; }
  const drop = document.getElementById('tb-srch-drop');
  if (drop) drop.style.display = 'none';
  tbSrchActiveQuery = '';
  /* Mark Map as active in tablet nav + sidenav */
  tbNavSetActive('tb-nav-map');
  document.querySelectorAll('.sn-sub-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.sn-sub-item').forEach(i => {
    if (i.textContent.trim() === 'Map') i.classList.add('active');
  });
  /* Boot the Leaflet map */
  if (typeof tbMapInit === 'function') tbMapInit();
}

function tbNavTrucks() {
  /* Switch back to trucks (All Trucks) view */
  tbRestoreChrome();
  const pageHdr = document.getElementById('tb-page-header');
  if (pageHdr) pageHdr.style.display = '';
  document.getElementById('tb-content').style.display      = '';
  document.getElementById('tb-page-units').style.display   = 'none';
  const tbUp = document.getElementById('tb-page-update');
  if (tbUp) tbUp.style.display = 'none';
  const tbMp = document.getElementById('tb-page-map');
  if (tbMp) tbMp.style.display = 'none';
  const titleEl = document.querySelector('#tb-page .tb-page-title');
  if (titleEl) titleEl.textContent = 'Diagnostic Center';
  /* Restore search placeholder to trucks */
  const searchInput = document.getElementById('tb-search-input');
  if (searchInput) { searchInput.placeholder = 'Search trucks\u2026'; searchInput.value = ''; }
  const drop = document.getElementById('tb-srch-drop');
  if (drop) drop.style.display = 'none';
  tbSrchActiveQuery = '';
}

function tbUnitsRender() {
  if (typeof UNITS_DATA === 'undefined') return;

  /* Stat counts — kept for tab badge logic */
  const linked   = UNITS_DATA.filter(u => u.status === 'Linked Unit').length;
  const unlinked = UNITS_DATA.filter(u => u.status === 'Unlinked Unit').length;
  const maint    = UNITS_DATA.filter(u => u.status === 'Maintenance').length;
  const pending  = UNITS_DATA.filter(u => u.status === 'Pending Return').length;

  /* Update sub-label */
  const subEl = document.getElementById('tb-units-sub');

  /* Tab visibility */
  tbUnitsUpdateTabs();

  /* Filter — reads from global search bar when on units page */
  const q = ((document.getElementById('tb-search-input') || {}).value || '').toLowerCase();
  const filtered = UNITS_DATA.filter(u => {
    if (!q) return true;
    return (u.id + u.status + u.truck + (u.tgw||'') + (u.contract||'') + (u.sysType||'')).toLowerCase().includes(q);
  });
  if (subEl) subEl.textContent = `All Units · ${filtered.length} unit${filtered.length === 1 ? '' : 's'}`;

  /* Build headers */
  const thead = document.getElementById('tb-units-thead');
  if (thead) {
    const cbTh = `<th style="width:40px;padding:0 8px;background:var(--layer-1);position:sticky;top:0;z-index:1;border-bottom:1px solid var(--border);"></th>`;
    const ths = ['Unit ID','Status','Truck','TCG ID','System','Config'].map(label =>
      `<th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:var(--soft);letter-spacing:0.3px;text-transform:uppercase;background:var(--layer-1);position:sticky;top:0;z-index:1;border-bottom:1px solid var(--border);white-space:nowrap;">${label}</th>`
    ).join('');
    thead.innerHTML = `<tr>${cbTh}${ths}</tr>`;
  }

  /* Build rows */
  function statusPill(u) {
    let cls = 'unlinked', label = u.status;
    if (u.status === 'Linked Unit')     { cls = 'linked';  label = 'Active Unit'; }
    if (u.status === 'Maintenance')     { cls = 'maint';   label = 'Maintenance'; }
    if (u.status === 'Pending')         { cls = 'pending'; label = 'Pending Config'; }
    if (u.status === 'Pending Return')  { cls = 'pending'; label = 'Pending Return'; }
    if (u.status === 'Unlinked Unit')   { cls = 'unlinked'; label = 'Unlinked Unit'; }
    return `<span class="dt-units-status-pill ${cls}"><span class="dot"></span>${label}</span>`;
  }

  const tbody = document.getElementById('tb-units-tbody');
  if (!tbody) return;
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding:40px;text-align:center;color:var(--soft);font-size:14px;">No units match.</td></tr>`;
    return;
  }
  const cbVis = tbUnitsSelectMode ? '' : 'visibility:hidden;pointer-events:none;';
  tbody.innerHTML = filtered.map((u, i) => {
    const canOpen  = ['Unlinked Unit','Pending','Linked Unit'].includes(u.status);
    const eligible = u.status === 'Unlinked Unit';
    const selected = tbUnitsSelected.has(u.id);
    const safeId   = u.id.replace(/'/g, "\\'");
    const onclick  = canOpen && !tbUnitsSelectMode ? `onclick="tbUdOpen('${safeId}')"` : '';
    const cursor   = canOpen && !tbUnitsSelectMode ? 'pointer' : 'default';
    return `<tr class="dt-tr${i%2===1?' alt':''}${selected?' dt-selected':''}"
        data-unit="${u.id}" style="cursor:${cursor};" ${onclick}>
      <td class="dt-td" style="width:40px;padding:0 8px;">
        <input type="checkbox" class="dt-units-cb" ${selected?'checked':''} ${!eligible?'disabled':''}
          style="${cbVis}" onclick="event.stopPropagation();tbUnitsToggleRow('${safeId}',this)">
      </td>
      <td class="dt-td dt-td-strong">${u.id}</td>
      <td class="dt-td">${statusPill(u)}</td>
      <td class="dt-td">${u.truck === '--' ? '<span style="color:var(--soft);">—</span>' : u.truck}</td>
      <td class="dt-td" style="font-family:'DM Mono',monospace;font-size:12px;">${u.tgw||'—'}</td>
      <td class="dt-td">${u.sysType||'—'}</td>
      <td class="dt-td">${u.config||'—'}</td>
    </tr>`;
  }).join('');
}

function tbUnitsUpdateTabs() {
  if (typeof UNITS_DATA === 'undefined') return;
  const pending = UNITS_DATA.filter(u => u.status === 'Pending Return').length;
  const tabPending = document.getElementById('tb-units-tab-pending');
  const countEl   = document.getElementById('tb-units-pending-count');
  if (tabPending) tabPending.style.display = pending > 0 ? '' : 'none';
  if (countEl) countEl.textContent = pending > 0 ? pending : '';
  /* If pending tab was active but now empty, switch back to units */
  if (pending === 0 && tbUnitsActiveTab === 'pending') tbUnitsTabSwitch('units');
}

function tbUnitsTabSwitch(tab) {
  tbUnitsActiveTab = tab;
  var tUnits   = document.getElementById('tb-units-tab-units');
  var tPending = document.getElementById('tb-units-tab-pending');
  if (tUnits)   { tUnits.style.borderBottomColor   = tab==='units'   ? 'var(--strong)' : 'transparent'; tUnits.style.color   = tab==='units'   ? 'var(--strong)' : 'var(--soft)'; }
  if (tPending) { tPending.style.borderBottomColor = tab==='pending' ? 'var(--strong)' : 'transparent'; tPending.style.color = tab==='pending' ? 'var(--strong)' : 'var(--soft)'; }
  document.getElementById('tb-units-tab-content-units').style.display   = tab === 'units'   ? '' : 'none';
  document.getElementById('tb-units-tab-content-pending').style.display = tab === 'pending' ? '' : 'none';
  /* Hide Return Units button on pending tab */
  const selBtn = document.getElementById('tb-units-select-btn');
  if (selBtn) selBtn.style.display = tab === 'pending' ? 'none' : '';
  if (tab === 'pending') tbPendingRender();
}

/* ── Select mode ─────────────────────────────────────────────── */
function tbUnitsSelectToggle() {
  tbUnitsSelectMode = !tbUnitsSelectMode;
  tbUnitsSelected.clear();
  const bar = document.getElementById('tb-units-bulk-bar');
  if (bar) { bar.style.display = tbUnitsSelectMode ? 'flex' : 'none'; bar.classList.toggle('visible', tbUnitsSelectMode); }
  const btn = document.getElementById('tb-units-select-btn');
  if (btn) {
    if (tbUnitsSelectMode) {
      btn.style.background  = 'rgba(48,105,227,0.1)';
      btn.style.borderColor = 'rgba(48,105,227,0.4)';
      btn.style.color       = 'var(--blue)';
    } else {
      btn.style.background  = '';
      btn.style.borderColor = '';
      btn.style.color       = '';
    }
  }
  tbUnitsRender();
  /* Reset bulk count */
  const countEl = document.getElementById('tb-units-bulk-count');
  if (countEl) countEl.textContent = '0 selected';
  const retBtn = document.getElementById('tb-units-bulk-return-btn');
  if (retBtn) retBtn.disabled = true;
}

function tbUnitsToggleRow(id, cb) {
  if (cb.checked) tbUnitsSelected.add(id);
  else tbUnitsSelected.delete(id);
  const countEl = document.getElementById('tb-units-bulk-count');
  if (countEl) countEl.textContent = tbUnitsSelected.size + ' selected';
  const retBtn = document.getElementById('tb-units-bulk-return-btn');
  if (retBtn) { retBtn.disabled = tbUnitsSelected.size === 0; }
  /* Highlight row */
  const row = document.querySelector(`#tb-units-tbody tr[data-unit="${id}"]`);
  if (row) row.classList.toggle('dt-selected', cb.checked);
}

function tbUnitsSelectAll() {
  if (typeof UNITS_DATA === 'undefined') return;
  UNITS_DATA.filter(u => u.status === 'Unlinked Unit').forEach(u => tbUnitsSelected.add(u.id));
  const countEl = document.getElementById('tb-units-bulk-count');
  if (countEl) countEl.textContent = tbUnitsSelected.size + ' selected';
  const retBtn = document.getElementById('tb-units-bulk-return-btn');
  if (retBtn) retBtn.disabled = tbUnitsSelected.size === 0;
  tbUnitsRender();
}

/* ── Return to Verifi workflow ───────────────────────────────── */
function tbUnitsReturnConfirm() {
  if (tbUnitsSelected.size === 0) return;
  const ids = [...tbUnitsSelected];
  const unitRows = ids.map(id => `<div class="dt-return-modal-unit-row">${id}</div>`).join('');
  const overlay = document.createElement('div');
  overlay.className = 'dt-return-overlay';
  overlay.id = 'tb-return-overlay';
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
        <button class="dt-return-modal-cancel" onclick="tbUnitsReturnCancel()">Cancel</button>
        <button class="dt-return-modal-confirm" onclick="tbUnitsReturnDo()">Return to Verifi</button>
      </div>
    </div>`;
  const mount = document.getElementById('tb-page-units') || document.getElementById('s-tablet');
  if (mount) { mount.style.position = 'relative'; mount.appendChild(overlay); }
}

function tbUnitsReturnCancel() {
  document.getElementById('tb-return-overlay')?.remove();
}

function tbUnitsReturnDo() {
  const ids = [...tbUnitsSelected];
  const now = new Date();
  const dateStr = (now.getMonth()+1) + '/' + now.getDate() + '/' + now.getFullYear();
  ids.forEach(id => {
    const u = UNITS_DATA.find(u => u.id === id);
    if (u) { u.status = 'Pending Return'; u.returnDate = dateStr; }
  });
  tbUnitsReturnCancel();
  tbUnitsSelectMode = false;
  tbUnitsSelected.clear();
  const btn = document.getElementById('tb-units-select-btn');
  if (btn) { btn.style.background = ''; btn.style.borderColor = ''; btn.style.color = ''; }
  const bar = document.getElementById('tb-units-bulk-bar');
  if (bar) { bar.style.display = 'none'; bar.classList.remove('visible'); }
  tbUnitsRender();
  tbPendingRender();
  tbUnitsUpdateTabs();
  dtShowToast({
    title: `${ids.length} unit${ids.length === 1 ? '' : 's'} flagged for return`,
    body: `Pending Return · Verifi will confirm receipt`,
    variant: 'warning'
  });
}

/* ── Pending Return table ────────────────────────────────────── */
function tbPendingRender() {
  if (typeof UNITS_DATA === 'undefined') return;
  const pending = UNITS_DATA.filter(u => u.status === 'Pending Return');
  const isInternal = dtCurrentRole === 'internal';

  /* Bulk bar visibility — internal only */
  const bulkBar = document.getElementById('tb-pending-bulk-bar');
  if (bulkBar) bulkBar.style.display = isInternal ? 'flex' : 'none';

  const thead = document.getElementById('tb-pending-thead');
  if (thead) {
    const cbTh = isInternal ? `<th style="width:40px;padding:0 8px;background:var(--layer-1);position:sticky;top:0;z-index:1;border-bottom:1px solid var(--border);"></th>` : '';
    const ths = ['Unit ID','Status','Truck','TCG ID','Days Pending'].map(label =>
      `<th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:var(--soft);letter-spacing:0.3px;text-transform:uppercase;background:var(--layer-1);position:sticky;top:0;z-index:1;border-bottom:1px solid var(--border);white-space:nowrap;">${label}</th>`
    ).join('');
    thead.innerHTML = `<tr>${cbTh}${ths}</tr>`;
  }

  const tbody = document.getElementById('tb-pending-tbody');
  if (!tbody) return;
  if (pending.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:40px;text-align:center;color:var(--soft);font-size:14px;">No pending returns.</td></tr>`;
    return;
  }

  function daysSince(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    return isNaN(diff) ? '—' : diff;
  }
  function daysColor(days) {
    if (typeof days !== 'number') return 'var(--soft)';
    if (days > 14) return 'var(--red)';
    if (days > 7)  return 'var(--amber)';
    return '#16a34a';
  }

  tbody.innerHTML = pending.map((u, i) => {
    const days = daysSince(u.returnDate);
    const col  = daysColor(typeof days === 'number' ? days : -1);
    const sel  = tbUnitsPendingSelected.has(u.id);
    const cbTd = isInternal
      ? `<td style="width:40px;padding:0 8px;"><input type="checkbox" class="dt-units-cb" ${sel?'checked':''} onclick="event.stopPropagation();tbPendingToggleRow('${u.id}',this)"></td>`
      : '';
    return `<tr class="dt-tr${i%2===1?' alt':''}${sel?' dt-selected':''}">
      ${cbTd}
      <td class="dt-td dt-td-strong">${u.id}</td>
      <td class="dt-td"><span class="dt-units-status-pill pending"><span class="dot"></span>Pending Return</span></td>
      <td class="dt-td">${u.truck === '--' ? '<span style="color:var(--soft);">—</span>' : u.truck}</td>
      <td class="dt-td" style="font-family:'DM Mono',monospace;font-size:12px;">${u.tgw||'—'}</td>
      <td class="dt-td" style="font-weight:600;color:${col};">${typeof days === 'number' ? days + 'd' : '—'}</td>
    </tr>`;
  }).join('');
}

function tbPendingToggleRow(id, cb) {
  if (cb.checked) tbUnitsPendingSelected.add(id);
  else tbUnitsPendingSelected.delete(id);
  const countEl = document.getElementById('tb-pending-bulk-count');
  if (countEl) countEl.textContent = tbUnitsPendingSelected.size + ' selected';
  const btn = document.getElementById('tb-pending-mark-btn');
  if (btn) { btn.disabled = tbUnitsPendingSelected.size === 0; btn.style.opacity = tbUnitsPendingSelected.size > 0 ? '1' : '0.4'; }
  const row = document.querySelector(`#tb-pending-tbody tr[data-unit="${id}"]`);
  if (row) row.classList.toggle('dt-selected', cb.checked);
}

function tbPendingSelectAll() {
  if (typeof UNITS_DATA === 'undefined') return;
  UNITS_DATA.filter(u => u.status === 'Pending Return').forEach(u => tbUnitsPendingSelected.add(u.id));
  const countEl = document.getElementById('tb-pending-bulk-count');
  if (countEl) countEl.textContent = tbUnitsPendingSelected.size + ' selected';
  const btn = document.getElementById('tb-pending-mark-btn');
  if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
  tbPendingRender();
}

function tbPendingCancelSelect() {
  tbUnitsPendingSelected.clear();
  tbPendingRender();
}

function tbPendingMarkReceived() {
  if (tbUnitsPendingSelected.size === 0) return;
  /* Reuse desktop logic — temporarily swap selected set */
  const prev = dtPendingSelected;
  if (typeof dtPendingSelected !== 'undefined') dtPendingSelected = tbUnitsPendingSelected;
  if (typeof dtPendingMarkReceived === 'function') dtPendingMarkReceived();
  if (typeof dtPendingSelected !== 'undefined') dtPendingSelected = prev;
  tbUnitsPendingSelected.clear();
  tbUnitsUpdateTabs();
  tbPendingRender();
  tbUnitsRender();
}

/* ── TABLET UNIT DRAWER — Chunk 2 ─────────────────────────────────
   Full unit drawer for tablet. Uses same data + render functions as
   desktop by temporarily swapping element IDs so dtUdRender* functions
   write into tablet elements instead of desktop ones.
────────────────────────────────────────────────────────────────── */

let tbUdCurrentUnitId = null;
let tbUdActiveTab     = 'lifespan';

function tbUdOpen(unitId) {
  const u = UNITS_DATA.find(x => x.id === unitId);
  if (!u) return;
  if (u.status !== 'Unlinked Unit' && u.status !== 'Pending' && u.status !== 'Linked Unit') return;

  tbUdCurrentUnitId = unitId;
  tbUdActiveTab = u.status === 'Pending' ? 'config' : 'lifespan';

  /* Header */
  document.getElementById('tb-ud-id').textContent = u.id;
  const truckEl = document.getElementById('tb-ud-truck-num');
  if (truckEl) truckEl.textContent = (u.truck && u.truck !== '--') ? u.truck : 'Unlinked';

  /* Status pill */
  const pill = document.getElementById('tb-ud-status-pill');
  if (pill) {
    let cls = 'unlinked', label = 'Unlinked';
    if (u.status === 'Linked Unit') { cls = 'linked';  label = 'Active'; }
    if (u.status === 'Pending')     { cls = 'pending'; label = 'Pending Configuration'; }
    pill.innerHTML = `<span class="dt-drawer-ign-badge ${cls}"><span class="dt-drawer-ign-dot"></span>${label}</span>`;
  }

  /* Build tabs */
  tbUdBuildTabs();

  /* Render content into tb-ud-scroll via ID swap */
  tbUdRenderActiveTab();

  /* Scrim + slide in */
  const scrim  = document.getElementById('tb-ud-scrim');
  const drawer = document.getElementById('tb-ud-drawer');
  if (scrim)  scrim.style.display = 'block';
  if (drawer) requestAnimationFrame(() => drawer.style.transform = 'translateX(0)');
}

function tbUdClose() {
  /* If unit was Pending and user cancels — revert */
  if (typeof dtUdPendingPrevState !== 'undefined' && dtUdPendingPrevState && tbUdCurrentUnitId === dtUdCurrentUnitId) {
    if (typeof dtUdRevertPending === 'function') dtUdRevertPending();
  }
  const scrim  = document.getElementById('tb-ud-scrim');
  const drawer = document.getElementById('tb-ud-drawer');
  if (drawer) drawer.style.transform = 'translateX(100%)';
  if (scrim)  scrim.style.display = 'none';
  /* Hide save bar */
  const saveBar = document.getElementById('tb-ud-cfg-savebar');
  if (saveBar) saveBar.style.display = 'none';
  if (typeof senStop === 'function') senStop();
  tbUdCurrentUnitId = null;
  /* Re-render units list to reflect any state changes */
  if (document.getElementById('tb-page-units')?.style.display !== 'none') tbUnitsRender();
}

function tbUdBuildTabs() {
  const u = UNITS_DATA.find(x => x.id === tbUdCurrentUnitId);
  if (!u) return;
  let tabs;
  if (u.status === 'Pending') {
    tabs = [{ id:'lifespan', label:'Unit Lifespan' }, { id:'config', label:'Configuration' }];
  } else if (u.status === 'Linked Unit') {
    tabs = [
      { id:'lifespan',  label:'Unit Lifespan' },
      { id:'timeline',  label:'Timeline' },
      { id:'logs',      label:'Truck Logs' },
      { id:'manual',    label:'Manual Control' },
      { id:'sensor',    label:'Sensor' },
      { id:'config',    label:'Configuration' },
    ];
  } else {
    tabs = [{ id:'lifespan', label:'Unit Lifespan' }, { id:'attach', label:'Attach to Truck' }];
  }
  const tabsEl = document.getElementById('tb-ud-tabs');
  if (tabsEl) tabsEl.innerHTML = tabs.map(t =>
    `<button class="dt-drawer-tab${t.id === tbUdActiveTab ? ' active' : ''}" onclick="tbUdSelectTab('${t.id}')">${t.label}</button>`
  ).join('');
}

function tbUdSelectTab(tab) {
  if (typeof senStop === 'function') senStop();
  tbUdActiveTab = tab;
  tbUdBuildTabs();
  tbUdRenderActiveTab();
}

/* ── ID swap helper ──────────────────────────────────────────────
   Desktop render functions write into dt-ud-scroll, dt-ud-tabs,
   dt-ud-side-body and read dtUdCurrentUnitId / dtUdActiveTab.
   We temporarily remap those so the same functions write into our
   tablet elements instead.                                       */
function tbUdWithSwap(fn) {
  /* Save desktop state */
  const prevUnitId  = typeof dtUdCurrentUnitId !== 'undefined' ? dtUdCurrentUnitId : null;
  const prevTab     = typeof dtUdActiveTab     !== 'undefined' ? dtUdActiveTab     : null;

  /* Point globals at our unit */
  if (typeof dtUdCurrentUnitId !== 'undefined') dtUdCurrentUnitId = tbUdCurrentUnitId;
  if (typeof dtUdActiveTab     !== 'undefined') dtUdActiveTab     = tbUdActiveTab;

  /* Swap scroll element — rename desktop scroll away, rename ours in */
  const desktopScroll = document.getElementById('dt-ud-scroll');
  const tbScroll      = document.getElementById('tb-ud-scroll');
  if (desktopScroll) desktopScroll.id = '__dt-ud-scroll-hidden';
  if (tbScroll)      tbScroll.id      = 'dt-ud-scroll';

  /* Swap side-body too for side panel renders */
  const desktopSide = document.getElementById('dt-ud-side-body');
  const tbSide      = document.getElementById('tb-ud-side-body');
  if (desktopSide) desktopSide.id = '__dt-ud-side-hidden';
  if (tbSide)      tbSide.id      = 'dt-ud-side-body';

  try { fn(); } finally {
    /* Restore */
    const swappedScroll = document.getElementById('dt-ud-scroll');
    const hiddenScroll  = document.getElementById('__dt-ud-scroll-hidden');
    if (swappedScroll) swappedScroll.id = 'tb-ud-scroll';
    if (hiddenScroll)  hiddenScroll.id  = 'dt-ud-scroll';

    const swappedSide = document.getElementById('dt-ud-side-body');
    const hiddenSide  = document.getElementById('__dt-ud-side-hidden');
    if (swappedSide) swappedSide.id = 'tb-ud-side-body';
    if (hiddenSide)  hiddenSide.id  = 'dt-ud-side-body';

    if (typeof dtUdCurrentUnitId !== 'undefined') dtUdCurrentUnitId = prevUnitId;
    if (typeof dtUdActiveTab     !== 'undefined') dtUdActiveTab     = prevTab;
  }
}

function tbUdRenderActiveTab() {
  const tab = tbUdActiveTab;
  tbUdWithSwap(() => {
    if (tab === 'attach')       dtUdRenderAttach();
    else if (tab === 'config')  dtUdRenderConfig();
    else if (tab === 'timeline') dtUdRenderTimeline();
    else if (tab === 'logs')    dtUdRenderLogs();
    else if (tab === 'manual')  dtUdRenderManual();
    else if (tab === 'sensor')  dtUdRenderSensor();
    else                        dtUdRenderLifespan();
  });

  /* After rendering lifespan/config, also render side panel below scroll */
  if (['lifespan','config','attach'].includes(tab)) {
    tbUdRenderSidePanelSection();
  }

  /* Config: show tablet save bar, patch dtCfgActiveContext */
  if (tab === 'config') {
    const saveBar = document.getElementById('tb-ud-cfg-savebar');
    if (saveBar) saveBar.style.display = 'none'; /* shown by dtCfgStartEdit */
  }
}

function tbUdRenderSidePanelSection() {
  /* Append side panel content (chips + meta) after the scroll content */
  const scroll = document.getElementById('tb-ud-scroll');
  if (!scroll) return;
  /* Build side panel HTML using desktop logic */
  const u = UNITS_DATA.find(x => x.id === tbUdCurrentUnitId);
  if (!u) return;
  const isLinked  = u.status === 'Linked Unit';
  const isPending = u.status === 'Pending';

  /* Reuse dtUdRenderSidePanel logic inline */
  let chip1label, chip1val, chip1cls = '';
  let chip2label, chip2val;
  if (isLinked) {
    chip1label = 'Connectivity'; chip1val = 'Connected'; chip1cls = 'linkish';
    chip2label = 'Truck Mode';   chip2val = 'Live';
  } else if (isPending) {
    chip1label = 'Status';    chip1val = 'Pending Configuration';
    chip2label = 'Account';   chip2val = 'Cemex AZ';
  } else {
    chip1label = 'Status';  chip1val = 'Not attached'; chip1cls = 'dim';
    chip2label = 'Account'; chip2val = 'Cemex AZ';
  }

  const metaRows = isLinked ? [
    ['TCG ID',             u.tgw && u.tgw !== '--' ? u.tgw : '—'],
    ['Code version',       u.sysType === 'Spark' ? '5.01.003' : u.sysType === 'V4' ? '4.02.011' : '3.04.029'],
    ['Commissioned',       u.firstCommissioned || '—'],
    ['Last Connect',       'Mar 24, 2025, 1:16:38 PM'],
    ['Last System Status', 'Mar 24, 2025, 1:16:38 PM'],
    ['Last Reboot',        'Mar 24, 2025, 1:16 PM'],
    ['Configuration',      u.config || '—'],
    ['Contract',           u.contract || '—'],
  ] : [
    ['TCG ID',             u.tgw && u.tgw !== '--' ? u.tgw : '—'],
    ['Code version',       '—'],
    ['Commissioned',       u.firstCommissioned || '—'],
    ['Last Connect',       '—'],
    ['Last System Status', '—'],
    ['Last Reboot',        '—'],
    ['Configuration',      u.config || '—'],
    ['Contract',           u.contract || '—'],
  ];

  const metaHtml = metaRows.map(([k, v], i) => `
    <div class="dt-drawer-meta-row${i%2===1?' alt':''}">
      <span class="dt-drawer-meta-label">${k}</span>
      <span class="dt-drawer-meta-val" style="${k==='TCG ID'?'font-family:\'DM Mono\',monospace;font-size:12px;':''}">${v}</span>
    </div>`).join('');

  /* Append side panel as a section at the bottom of scroll */
  let sideSec = document.getElementById('tb-ud-side-section');
  if (!sideSec) {
    sideSec = document.createElement('div');
    sideSec.id = 'tb-ud-side-section';
    sideSec.style.cssText = 'border-top:1px solid var(--border);margin-top:8px;padding-top:20px;padding-bottom:32px;';
    scroll.appendChild(sideSec);
  }
  sideSec.innerHTML = `
    <div class="dt-drawer-summary-row" style="margin-bottom:16px;">
      <div class="dt-drawer-summary-card">
        <div>
          <div style="font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.26px;">${chip1label}</div>
          <div class="dt-ud-side-chip-val ${chip1cls}" style="font-size:13px;letter-spacing:-0.26px;margin-top:2px;">${chip1val}</div>
        </div>
      </div>
      <div class="dt-drawer-summary-card">
        <div>
          <div style="font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.26px;">${chip2label}</div>
          <div style="font-size:13px;color:var(--defined);letter-spacing:-0.26px;margin-top:2px;">${chip2val}</div>
        </div>
      </div>
    </div>
    <div class="dt-drawer-meta">${metaHtml}</div>
    ${isLinked ? `<button class="dt-ud-side-gps-btn" onclick="dtUdGpsPlaceholder()" style="margin-top:16px;">GPS Location</button>` : ''}`;
}

/* ── CHUNK 4 — ATTACH TO TRUCK (tablet) ────────────────────────────
   The Attach to Truck tab renders via the ID-swap in tbUdRenderActiveTab,
   so dtUdRenderAttach writes correctly into tb-ud-scroll already.
   The canonical dtUdAttachDo, dtUdCfgSaveAndLink, and dtUdRevertPending
   functions have been patched directly to handle both desktop and tablet.
────────────────────────────────────────────────────────────────── */

/* ── TABLET ADD UNIT — Chunk 3 ───────────────────────────────────
   Full-screen overlay that reuses all dt-au-* form IDs and logic.
   dtAuOpen/dtAuClose are patched to route to the tablet overlay
   when in tablet mode, so the Add Unit button wires up for free.
────────────────────────────────────────────────────────────────── */

function tbAuOpen() {
  /* Reset form state */
  if (typeof dtAuValues !== 'undefined') {
    dtAuValues.contract = 'Cemex AZ';
    dtAuValues.sysType  = '';
    dtAuValues.config   = '';
  }
  /* Populate contract dropdown */
  const contracts = (typeof DT_AU_CONTRACTS_BY_ACCOUNT !== 'undefined' && typeof dtAuValues !== 'undefined')
    ? (DT_AU_CONTRACTS_BY_ACCOUNT[dtAuValues.account] || []) : ['Cemex AZ'];
  const contractMenu = document.getElementById('tb-au-contract-menu');
  if (contractMenu) contractMenu.innerHTML = contracts.map(c => {
    const sel  = c === 'Cemex AZ' ? ' selected' : '';
    const safe = c.replace(/'/g, "\\'");
    return `<div class="dt-au-dd-item${sel}" onclick="dtAuSelectDd('contract','${safe}')">${c}</div>`;
  }).join('');
  const contractVal = document.getElementById('tb-au-contract-val');
  if (contractVal) { contractVal.textContent = 'Cemex AZ'; contractVal.className = ''; }

  /* Reset sysType and config */
  ['sysType','config'].forEach(key => {
    const valEl = document.getElementById('tb-au-' + key + '-val');
    const menuEl = document.getElementById('tb-au-' + key + '-menu');
    const chevEl = document.getElementById('tb-au-' + key + '-chev');
    const btnEl  = document.getElementById('tb-au-' + key + '-btn');
    if (valEl)  { valEl.textContent = key === 'sysType' ? 'Select type' : 'Select config'; valEl.className = 'placeholder'; }
    if (menuEl) { menuEl.classList.remove('open'); menuEl.querySelectorAll('.dt-au-dd-item').forEach(el => el.classList.remove('selected')); }
    if (chevEl) chevEl.classList.remove('open');
    if (btnEl)  btnEl.classList.remove('open');
  });

  /* Reset inputs */
  ['tb-au-unit-id','tb-au-tgw'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.classList.remove('error'); }
  });
  const idErr = document.getElementById('tb-au-unit-id-err');
  if (idErr) idErr.classList.remove('show');

  if (typeof dtAuValidate === 'function') dtAuValidate();

  /* Show overlay */
  const overlay = document.getElementById('tb-au-overlay');
  if (overlay) overlay.style.display = 'flex';

  setTimeout(() => document.getElementById('tb-au-unit-id')?.focus(), 200);
}

function tbAuClose() {
  const overlay = document.getElementById('tb-au-overlay');
  if (overlay) overlay.style.display = 'none';
  /* Close any open dropdown */
  ['contract','sysType','config'].forEach(key => {
    document.getElementById('tb-au-' + key + '-menu')?.classList.remove('open');
    document.getElementById('tb-au-' + key + '-chev')?.classList.remove('open');
    document.getElementById('tb-au-' + key + '-btn')?.classList.remove('open');
  });
}

/* Patch dtAuOpen and dtAuClose — tablet routing is now inlined in the canonical definitions above */

/* Re-render Life Span if it's the active tab after Replace Components */
const _origCoWriteLifespanHistory = typeof coWriteLifespanHistory === 'function' ? coWriteLifespanHistory : null;

/* Initialize tablet table on first load */
(function tbInit() {
  if (typeof truckGroups !== 'undefined') {
    setTimeout(tbRenderTable, 100);
  }
})();


/* ════════════════════════════════════════════════════════════
   ADD TRUCK DRAWER — per Figma 608:38283
   Same pattern as Add Unit. Truck Number is required;
   all other fields are optional and can be filled later.
═══════════════════════════════════════════════════════════ */

const dtAtValues = { discharge: 'Front Discharge', 'drum-mfr': null };

function dtAtOpen() {
  // Reset all fields
  ['dt-at-truck-num','dt-at-vin','dt-at-drum-size','dt-at-min-mix',
   'dt-at-max-mix','dt-at-min-agit']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  // Reset dropdowns
  dtAtValues.discharge  = 'Front Discharge';
  dtAtValues['drum-mfr'] = null;
  const dv = document.getElementById('dt-at-discharge-val');
  if (dv) { dv.textContent = 'Front Discharge'; dv.className = ''; }
  const mv = document.getElementById('dt-at-drum-mfr-val');
  if (mv) { mv.textContent = 'Select manufacturer'; mv.className = 'placeholder'; }
  // Clear errors
  ['dt-at-truck-num-err','dt-at-vin-err'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.classList.remove('show'); }
  });
  dtAtValidate();
  // On tablet reuse the tb-au-overlay container
  if (document.body.classList.contains('view-tablet')) {
    const overlay = document.getElementById('tb-au-overlay');
    if (overlay) {
      overlay.innerHTML = document.getElementById('dt-at-drawer').innerHTML;
      overlay.style.display = 'flex';
      overlay.classList.add('open');
      setTimeout(() => overlay.querySelector('#dt-at-truck-num')?.focus(), 300);
    }
    return;
  }
  // Open the drawer
  const drawer = document.getElementById('dt-at-drawer');
  if (drawer) drawer.classList.add('open');
  document.getElementById('dt-drawer-scrim').classList.add('open');
  setTimeout(() => document.getElementById('dt-at-truck-num')?.focus(), 300);
}

function dtAtClose() {
  // On tablet close the overlay
  if (document.body.classList.contains('view-tablet')) {
    const overlay = document.getElementById('tb-au-overlay');
    if (overlay) {
      overlay.style.animation = 'tbAuSlideIn 0.24s cubic-bezier(0.4,0,0.2,1) reverse both';
      setTimeout(() => { overlay.style.display = 'none'; overlay.style.animation = ''; overlay.classList.remove('open'); }, 240);
    }
    return;
  }
  document.getElementById('dt-at-drawer')?.classList.remove('open');
  // Only close scrim if no other drawer is open
  const auOpen = dtAuQ('dt-au-drawer')?.classList.contains('open');
  const dtOpen = document.getElementById('dt-drawer')?.classList.contains('open');
  if (!auOpen && !dtOpen) document.getElementById('dt-drawer-scrim')?.classList.remove('open');
}

function dtAtToggleDd(key) {
  const menuEl = document.getElementById('dt-at-' + key + '-menu');
  const chevEl = document.getElementById('dt-at-' + key + '-chev');
  const btnEl  = document.getElementById('dt-at-' + key + '-btn');
  // Close all other dt-at dropdowns first
  ['discharge','drum-mfr'].forEach(k => {
    if (k !== key) {
      document.getElementById('dt-at-' + k + '-menu')?.classList.remove('open');
      document.getElementById('dt-at-' + k + '-chev')?.classList.remove('open');
      document.getElementById('dt-at-' + k + '-btn')?.classList.remove('open');
    }
  });
  const isOpen = menuEl?.classList.contains('open');
  menuEl?.classList.toggle('open', !isOpen);
  chevEl?.classList.toggle('open', !isOpen);
  btnEl?.classList.toggle('open',  !isOpen);
}

function dtAtSelectDd(key, value) {
  dtAtValues[key] = value;
  const valEl  = document.getElementById('dt-at-' + key + '-val');
  const menuEl = document.getElementById('dt-at-' + key + '-menu');
  const chevEl = document.getElementById('dt-at-' + key + '-chev');
  const btnEl  = document.getElementById('dt-at-' + key + '-btn');
  if (valEl) { valEl.textContent = value; valEl.className = ''; }
  if (menuEl) {
    menuEl.querySelectorAll('.dt-au-dd-item').forEach(el => {
      el.classList.toggle('selected', el.textContent.trim() === value);
    });
    menuEl.classList.remove('open');
  }
  if (chevEl) chevEl.classList.remove('open');
  if (btnEl)  btnEl.classList.remove('open');
  dtAtValidate();
}

function dtAtValidate() {
  const truckNum  = (document.getElementById('dt-at-truck-num')?.value || '').trim();
  const vin       = (document.getElementById('dt-at-vin')?.value || '').trim();
  const drumSize  = (document.getElementById('dt-at-drum-size')?.value || '').trim();
  const minMix    = (document.getElementById('dt-at-min-mix')?.value || '').trim();
  const maxMix    = (document.getElementById('dt-at-max-mix')?.value || '').trim();
  const minAgit   = (document.getElementById('dt-at-min-agit')?.value || '').trim();
  const mixerType = dtAtValues['drum-mfr'];

  const vinOk  = vin.length === 0 || vin.length === 17;
  const valid  = !!truckNum && !!drumSize && !!minMix && !!maxMix && !!minAgit && !!mixerType && vinOk;

  const submit = document.getElementById('dt-at-submit');
  const hint   = document.getElementById('dt-at-foot-hint');
  if (submit) submit.disabled = !valid;
  if (hint) {
    if (valid) {
      hint.textContent = 'Ready to add';
      hint.classList.add('valid');
    } else {
      const missing = [];
      if (!truckNum)  missing.push('Truck Number');
      if (!drumSize)  missing.push('Drum Size');
      if (!minMix)    missing.push('Min Mixing Speed');
      if (!maxMix)    missing.push('Max Mixing Speed');
      if (!minAgit)   missing.push('Min Agitation Speed');
      if (!mixerType) missing.push('Mixer Type');
      if (!vinOk)     missing.push('VIN must be 17 characters');
      hint.textContent = missing.length ? `Required: ${missing.join(', ')}` : 'Fill required fields to add';
      hint.classList.remove('valid');
    }
  }
  // VIN inline error
  const vinInput = document.getElementById('dt-at-vin');
  const vinErr   = document.getElementById('dt-at-vin-err');
  if (vinInput && vinErr) {
    if (vin.length > 0 && vin.length !== 17) {
      vinInput.classList.add('error');
      vinErr.textContent = `VIN must be exactly 17 characters (${vin.length} entered).`;
      vinErr.classList.add('show');
    } else {
      vinInput.classList.remove('error');
      vinErr.classList.remove('show');
    }
  }
}

function dtAtSubmit() {
  const truckNum  = (document.getElementById('dt-at-truck-num')?.value || '').trim();
  if (!truckNum) return;

  // Duplicate check
  if (trucks.find(t => t.num === truckNum)) {
    const numInput = document.getElementById('dt-at-truck-num');
    const numErr   = document.getElementById('dt-at-truck-num-err');
    if (numInput) numInput.classList.add('error');
    if (numErr)   { numErr.textContent = `Truck ${truckNum} already exists.`; numErr.classList.add('show'); }
    numInput?.focus(); numInput?.select();
    return;
  }

  const drumSize = (document.getElementById('dt-at-drum-size')?.value || '').trim();
  const drumMfr  = dtAtValues['drum-mfr'];
  const drumLabel = drumMfr || '--';

  // Add to trucks array as an unlinked truck
  const newTruck = {
    num:       truckNum,
    type:      'Rear Discharge',  // default
    drum:      drumLabel,
    water:     '--',
    mixer:     '--',
    unlinked:  true,
    truckMode: 'Non Active',
    unitId:    '--',
    ign:       'off',
    err:       0,
    wrn:       0,
    plant:     'Unassigned',
    ver:       '--',
  };

  trucks.push(newTruck);

  // Also add to UNLINKED_TRUCKS pool so it appears in the unit attach picker
  if (typeof UNLINKED_TRUCKS !== 'undefined') {
    UNLINKED_TRUCKS.push({
      number: truckNum,
      type:   dtAtValues['discharge'] || 'Standard',
      drum:   drumSize || '--',
      water:  '--',
      mixer:  '--',
    });
  }

  dtAtClose();

  // Re-render any visible truck table
  if (typeof dtRefreshTable === 'function' && typeof dtActiveTab !== 'undefined') {
    dtRefreshTable(dtActiveTab);
  }
  if (typeof tbRenderTable === 'function') tbRenderTable();

  dtShowToast({
    title: 'Truck added',
    body: `Truck ${truckNum} was added as Unlinked. Open it to attach a unit.`,
  });
}

/* Trinity-styled toast helper — Success variant by default.
   Pass `variant: 'info' | 'warning' | 'error'` to use the other treatments. */
function dtShowToast({ title, body, variant }) {
  /* Mobile: show inline toast inside phone-wrap, position:absolute */
  if (document.body.classList.contains('view-mobile')) {
    var existing = document.getElementById('mo-toast');
    if (existing) existing.remove();
    var t = document.createElement('div');
    t.id = 'mo-toast';
    var stripe = variant === 'success' ? '#2ecf1d' : variant === 'warning' ? '#ffba0d' : variant === 'error' ? '#d70100' : '#41a8f2';
    var toastBg = document.body.classList.contains('dark') ? 'var(--layer-2)' : 'white';
    t.style.cssText = 'position:absolute;top:70px;left:16px;right:16px;z-index:10000;'
      + 'background:' + toastBg + ';border:1px solid var(--border);border-radius:12px;'
      + 'padding:12px 14px;display:flex;align-items:flex-start;gap:10px;'
      + 'box-shadow:0 8px 24px rgba(0,0,0,0.18);font-family:var(--font);'
      + 'border-top:3px solid ' + stripe + ';'
      + 'animation:dtAuToastIn 0.25s cubic-bezier(0.4,0,0.2,1);';
    t.innerHTML = '<div style="flex:1;min-width:0;">'
      + '<div style="font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.26px;margin-bottom:2px;">' + title + '</div>'
      + '<div style="font-size:12px;color:var(--defined);letter-spacing:-0.24px;">' + body + '</div>'
      + '</div>';
    t.addEventListener('click', function() {
      t.style.animation = 'dtAuToastOut 0.25s ease-in forwards';
      setTimeout(function() { t.remove(); }, 250);
    });
    var pw = document.getElementById('phone-wrap');
    (pw || document.body).appendChild(t);
    setTimeout(function() {
      if (!t.parentNode) return;
      t.style.animation = 'dtAuToastOut 0.25s ease-in forwards';
      setTimeout(function() { t.remove(); }, 250);
    }, 3200);
    return;
  }

  /* Tablet: anchor inside #s-tablet so toast stays within the wrapper */
  if (document.body.classList.contains('view-tablet')) {
    const existing = document.getElementById('tb-toast');
    if (existing) existing.remove();
    const stripe = variant === 'success' ? '#2ecf1d' : variant === 'warning' ? '#ffba0d' : variant === 'error' ? '#d70100' : '#41a8f2';
    const t = document.createElement('div');
    t.id = 'tb-toast';
    const toastBg = document.body.classList.contains('dark') ? 'var(--layer-2)' : 'white';
    t.style.cssText = 'position:absolute;bottom:32px;left:50%;transform:translateX(-50%);z-index:10000;'
      + 'background:' + toastBg + ';border:1px solid var(--border);border-radius:12px;'
      + 'padding:12px 16px;display:flex;align-items:flex-start;gap:10px;min-width:280px;max-width:420px;'
      + 'box-shadow:0 8px 24px rgba(0,0,0,0.18);font-family:var(--font);'
      + 'border-top:3px solid ' + stripe + ';'
      + 'animation:dtAuToastIn 0.25s cubic-bezier(0.4,0,0.2,1);';
    t.innerHTML = '<div style="flex:1;min-width:0;">'
      + '<div style="font-size:13px;font-weight:500;color:var(--strong);letter-spacing:-0.26px;margin-bottom:2px;">' + title + '</div>'
      + '<div style="font-size:12px;color:var(--defined);letter-spacing:-0.24px;">' + body + '</div>'
      + '</div>';
    t.addEventListener('click', () => {
      t.style.animation = 'dtAuToastOut 0.25s ease-in forwards';
      setTimeout(() => t.remove(), 250);
    });
    const container = document.getElementById('s-tablet') || document.body;
    container.appendChild(t);
    setTimeout(() => {
      if (!t.parentNode) return;
      t.style.animation = 'dtAuToastOut 0.25s ease-in forwards';
      setTimeout(() => t.remove(), 250);
    }, 3200);
    return;
  }

  /* Desktop: original fixed toast */
  const toast = document.createElement('div');
  toast.className = 'dt-au-toast' + (variant && variant !== 'success' ? ' toast-' + variant : '');
  toast.innerHTML = `
    <div class="dt-au-toast-content">
      <div class="dt-au-toast-title">${title}</div>
      <div class="dt-au-toast-body">${body}</div>
    </div>
    <svg class="dt-au-toast-chev" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  toast.addEventListener('click', () => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 250);
  });
  document.body.appendChild(toast);
  setTimeout(() => { toast.classList.add('out'); setTimeout(() => toast.remove(), 250); }, 3200);
}

// Click outside any open dropdown inside the drawer closes it
document.addEventListener('click', (e) => {
  const drawer = dtAuQ('dt-au-drawer');
  if (!drawer || !drawer.classList.contains('open')) return;
  ['contract','sysType','config'].forEach(key => {
    const wrap = dtAuQ('dt-au-' + key + '-wrap');
    const menu = dtAuQ('dt-au-' + key + '-menu');
    if (wrap && menu && menu.classList.contains('open') && !wrap.contains(e.target)) {
      menu.classList.remove('open');
      dtAuQ('dt-au-' + key + '-chev')?.classList.remove('open');
      dtAuQ('dt-au-' + key + '-btn')?.classList.remove('open');
    }
  });
});

/* Scrim helper — close whichever drawer is open. The scrim is shared
   between the truck drawer and the Add Unit drawer. */
function dtScrimClose() {
  const auDrawer    = dtAuQ('dt-au-drawer');
  const udDrawer    = document.getElementById('dt-ud-drawer');
  const truckDrawer = document.getElementById('dt-drawer');
  if (auDrawer && auDrawer.classList.contains('open')) {
    dtAuClose();
  } else if (udDrawer && udDrawer.classList.contains('open')) {
    dtUdClose();
  } else if (truckDrawer && truckDrawer.classList.contains('open')) {
    dtCloseDrawer();
  }
}

/* ════════════════════════════════════════════════════════════
   DESKTOP UNIT DRAWER — Unlinked units (Linked comes later)
   Two tabs: Unit Lifespan + Attach to Truck.
   Re-uses the truck drawer's chrome + scrim. The Lifespan tab is
   a desktop-scaled version of the mobile component-history accordion.
   The Attach tab is the mobile flow expanded into a wider table with
   inline confirm.
═══════════════════════════════════════════════════════════ */

let dtUdCurrentUnitId = null;
let dtUdActiveTab     = 'lifespan'; // 'lifespan' | 'attach' | 'config' | 'timeline' | 'logs' | 'manual' | 'sensor'
let dtUdAttachSelected = null;
let dtUdAttachQuery    = '';
/* Snapshot of pre-Pending state, used to revert the link if the user
   closes the drawer or cancels Configuration during the Pending stage. */
let dtUdPendingPrevState = null;

function dtUdOpen(unitId) {
  const u = UNITS_DATA.find(x => x.id === unitId);
  if (!u) return;
  // Only Unlinked / Pending / Linked open the unit drawer for now.
  // (Maintenance not wired in this iteration.)
  if (u.status !== 'Unlinked Unit' && u.status !== 'Pending' && u.status !== 'Linked Unit') return;

  dtUdCurrentUnitId = unitId;
  // Default tab depends on status
  if (u.status === 'Pending')      dtUdActiveTab = 'config';
  else                              dtUdActiveTab = 'lifespan';
  dtUdAttachSelected = null;
  dtUdAttachQuery = '';

  document.getElementById('dt-ud-id').textContent = u.id;
  /* Truck subtitle — shows which truck this unit is on */
  const udTruckNum = document.getElementById('dt-ud-truck-num');
  if (udTruckNum) udTruckNum.textContent = (u.truck && u.truck !== '--') ? u.truck : 'Unlinked';
  dtUdApplyStatusUI(u);

  dtUdBuildTabs();
  dtUdRenderActiveTab();
  dtUdRenderSidePanel();
  dtUdUpdateNavArrows();

  // Slide drawer in over the units page; reuse the existing scrim
  document.getElementById('dt-drawer-scrim').classList.add('open');
  const drawer = document.getElementById('dt-ud-drawer');
  requestAnimationFrame(() => drawer.classList.add('open'));
}

/* Render the header status pill + linked-truck label based on current status */
function dtUdApplyStatusUI(u) {
  let badgeCls = 'unlinked', label = u.status;
  if (u.status === 'Linked Unit')      { badgeCls = 'linked';   label = 'Active'; }
  else if (u.status === 'Pending')     { badgeCls = 'pending';  label = 'Pending Configuration'; }
  else if (u.status === 'Maintenance') { badgeCls = 'maint';    label = 'Maintenance Mode'; }
  else                                 { badgeCls = 'unlinked'; label = 'Unlinked'; }

  const pill = document.getElementById('dt-ud-status-pill');
  if (pill) {
    pill.innerHTML = `
      <span class="dt-drawer-ign-badge ${badgeCls}">
        <span class="dt-drawer-ign-dot"></span>${label}
      </span>`;
  }
}

function dtUdClose() {
  // If the user is closing the drawer while their unit is Pending,
  // they didn't finish — revert the entire link attempt.
  if (dtUdPendingPrevState) {
    dtUdRevertPending();
  }
  const drawer = document.getElementById('dt-ud-drawer');
  if (drawer) drawer.classList.remove('open');
  document.getElementById('dt-drawer-scrim')?.classList.remove('open');
  // Clear any pending attach confirm overlay
  document.querySelector('#dt-ud-drawer .dt-attach-confirm')?.remove();
  // Stop sensor animation if it was running
  if (typeof senStop === 'function') senStop();
  dtUdCurrentUnitId = null;
}

function dtUdNav(dir) {
  // Walk only across Unlinked units in the currently rendered table order
  const rows = Array.from(document.querySelectorAll('#dt-units-tbody tr[data-unit]'));
  const ids  = rows.map(r => r.dataset.unit).filter(id => {
    const u = UNITS_DATA.find(x => x.id === id);
    return u && u.status === 'Unlinked Unit';
  });
  const idx = ids.indexOf(dtUdCurrentUnitId);
  if (idx === -1) return;
  const next = Math.min(Math.max(idx + dir, 0), ids.length - 1);
  if (next === idx) return;
  dtUdOpen(ids[next]);
}

function dtUdUpdateNavArrows() {
  const rows = Array.from(document.querySelectorAll('#dt-units-tbody tr[data-unit]'));
  const ids  = rows.map(r => r.dataset.unit).filter(id => {
    const u = UNITS_DATA.find(x => x.id === id);
    return u && u.status === 'Unlinked Unit';
  });
  const idx = ids.indexOf(dtUdCurrentUnitId);
  document.getElementById('dt-ud-prev').disabled = idx <= 0;
  document.getElementById('dt-ud-next').disabled = idx === -1 || idx >= ids.length - 1;
}

function dtUdBuildTabs() {
  const u = UNITS_DATA.find(x => x.id === dtUdCurrentUnitId);
  if (!u) return;
  let tabs;
  if (u.status === 'Pending') {
    tabs = [
      { id:'lifespan', label:'Unit Lifespan' },
      { id:'config',   label:'Configuration' },
    ];
  } else if (u.status === 'Linked Unit') {
    tabs = [
      { id:'lifespan', label:'Unit Lifespan' },
      { id:'timeline', label:'Timeline' },
      { id:'logs',     label:'Trucks Logs' },
      { id:'manual',   label:'Manual Control' },
      { id:'sensor',   label:'Sensor' },
      { id:'config',   label:'Configuration' },
    ];
  } else {
    // Unlinked
    tabs = [
      { id:'lifespan', label:'Unit Lifespan' },
      { id:'attach',   label:'Attach to Truck' },
    ];
  }
  document.getElementById('dt-ud-tabs').innerHTML = tabs.map(t => `
    <button class="dt-drawer-tab${t.id === dtUdActiveTab ? ' active' : ''}"
            onclick="dtUdSelectTab('${t.id}')">${t.label}</button>
  `).join('');
}

function dtUdSelectTab(tab) {
  // Stop sensor animation if leaving sensor tab (mirrors truck drawer behavior)
  if (typeof senStop === 'function') senStop();
  dtUdActiveTab = tab;
  dtUdBuildTabs();
  dtUdRenderActiveTab();
}

function dtUdRenderActiveTab() {
  if (dtUdActiveTab === 'attach')        dtUdRenderAttach();
  else if (dtUdActiveTab === 'config')   dtUdRenderConfig();
  else if (dtUdActiveTab === 'timeline') dtUdRenderTimeline();
  else if (dtUdActiveTab === 'logs')     dtUdRenderLogs();
  else if (dtUdActiveTab === 'manual')   dtUdRenderManual();
  else if (dtUdActiveTab === 'sensor')   dtUdRenderSensor();
  else                                    dtUdRenderLifespan();
}

/* ── Pending/Linked-state tab adapters ──
   These render the same content the truck drawer's tabs render, but
   mounted into the unit drawer's scroll. Tabs share the same Configuration
   helpers (dtCfgStartEdit / dtCfgSave / dtCfgCancel) so saves work identically. */
function dtUdRenderConfig() {
  const u = UNITS_DATA.find(x => x.id === dtUdCurrentUnitId);
  if (!u) return;
  const scroll = document.getElementById('dt-ud-scroll');
  const isNewUnit = u.status === 'Pending' || !u.firstCommissioned;
  scroll.innerHTML = dtBuildConfig(isNewUnit);
  const topbar = scroll.querySelector('#dt-cfg-topbar');
  if (topbar) topbar.style.display = 'none';

  /* Pre-populate Information fields from unit/truck data */
  requestAnimationFrame(() => {
    /* Truck number → Name field (first input in Information accordion) */
    const truckNum = u.truck && u.truck !== '--' ? u.truck : (attachSelectedTruck || '');
    const nameInput = scroll.querySelector('#dt-cfg-acc-0 .cfg-field input, .cfg-acc-body .cfg-field input');
    if (nameInput && truckNum) { nameInput.value = truckNum; nameInput.dataset.orig = truckNum; }

    /* Populate any inputs that have matching labels */
    scroll.querySelectorAll('.cfg-field').forEach(function(field) {
      const label = (field.querySelector('label') || {}).textContent || '';
      const input = field.querySelector('input');
      if (!input) return;
      if (label === 'Name' && truckNum) { input.value = truckNum; input.dataset.orig = truckNum; }
    });

    /* Open accordions: 0=Information, 1=Equipment, 2=Mixing, 5=Fluid Hose */
    [0, 1, 2, 5].forEach(function(idx) {
      const acc = scroll.querySelector('.cfg-acc:nth-child(' + (idx+1) + ')');
      if (!acc) return;
      acc.classList.add('open');
      const body = acc.querySelector('.cfg-acc-body');
      if (body) body.style.display = '';
    });
    /* Close the rest */
    [3, 4, 6, 7].forEach(function(idx) {
      const acc = scroll.querySelectorAll('.cfg-acc')[idx];
      if (!acc) return;
      acc.classList.remove('open');
      const body = acc.querySelector('.cfg-acc-body');
      if (body) body.style.display = 'none';
    });
  });

  // For Pending state, immediately enter edit mode so the FST can fill the unit's config.
  // dtCfgStartEdit opens the unit drawer's save bar (#dt-ud-cfg-savebar) because
  // dtCfgActiveContext detects the open unit drawer. We then re-label and rebind
  // the buttons so saving completes the link transition.
  if (u.status === 'Pending') {
    requestAnimationFrame(() => {
      dtCfgStartEdit();
      /* Resolve correct save/cancel IDs — tablet uses tb-ud-* IDs */
      const isTablet = document.body.classList.contains('view-tablet');
      const saveBtnId    = isTablet ? 'tb-ud-cfg-save-btn'    : 'dt-ud-cfg-save-btn';
      const cancelBtnId  = isTablet ? 'tb-ud-cfg-cancel-btn'  : 'dt-ud-cfg-cancel-btn';
      const msgElId      = isTablet ? 'tb-ud-cfg-savebar-msg' : 'dt-ud-cfg-savebar-msg';
      const saveBtn = document.getElementById(saveBtnId);
      if (saveBtn) {
        saveBtn.textContent = 'Save & Link Unit';
        saveBtn.dataset.role = 'pending-link';
        saveBtn.onclick = dtUdCfgSaveAndLink;
      }
      // Cancel during pending = cancel the entire link attempt → revert to Unlinked.
      const cancelBtn = document.getElementById(cancelBtnId);
      if (cancelBtn) {
        cancelBtn.textContent = 'Cancel attach';
        cancelBtn.onclick = dtUdCfgCancelLink;
      }
      // Update the savebar message text to match the linking context
      const msgEl = document.getElementById(msgElId);
      if (msgEl) msgEl.textContent = 'Fill in the configuration to finalize this link';

      /* Force close accordions 5+ — keep 0-4 open (Info, Equipment, Mixing, Fluid Hose, Tilt) */
      const accs = document.querySelectorAll('#dt-cfg-accs .cfg-acc');
      accs.forEach(function(acc, idx) {
        if (idx >= 5) {
          acc.classList.remove('open');
          const body = acc.querySelector('.cfg-acc-body');
          if (body) body.style.display = 'none';
        }
      });
    });
  }
}

/* When user saves config during Pending state — finalize the link */
function dtUdCfgSaveAndLink() {
  const isTablet  = document.body.classList.contains('view-tablet');
  const currentId = isTablet ? tbUdCurrentUnitId : dtUdCurrentUnitId;

  dtCfgSave();

  const u = UNITS_DATA.find(x => x.id === currentId);
  if (!u) return;
  u.status = 'Linked Unit';
  if (!u.firstCommissioned) {
    const _n = new Date(), _h = _n.getHours(), _m = _n.getMinutes();
    const _ap = _h >= 12 ? 'PM' : 'AM', _h12 = _h % 12 || 12;
    const _mo = String(_n.getMonth()+1).padStart(2,'0'), _d = String(_n.getDate()).padStart(2,'0'), _y = _n.getFullYear();
    u.firstCommissioned = _h12+':'+String(_m).padStart(2,'0')+' '+_ap+' '+_mo+'/'+_d+'/'+_y;
  }

  if (typeof trucks !== 'undefined' && u.truck && u.truck !== '--') {
    const t = trucks.find(x => x.num === u.truck);
    if (t) { t.unlinked = false; t.truckMode = 'Active'; t.unitId = u.id; }
    if (typeof CC_TRUCKS !== 'undefined') {
      const tCC = CC_TRUCKS.find(x => x.num === u.truck);
      if (tCC) tCC.unlinked = false;
    }
  }

  dtShowToast({
    title: 'Unit linked successfully',
    body: `Unit ${u.id} is now linked to Truck ${u.truck} and ready for deployment.`,
  });

  const truckNum = u.truck;

  if (isTablet) {
    if (typeof tbUnitsRender === 'function') tbUnitsRender();
    if (typeof tbRenderTable === 'function') tbRenderTable();
    dtUdPendingPrevState = null;
    /* Add truck to trucks[] if not already there */
    if (truckNum && truckNum !== '--') {
      dtEnsureTruckRecord(truckNum);
      if (!CC_TRUCKS.find(x => x.num === truckNum)) {
        CC_TRUCKS.push({ num: truckNum, unlinked: false, components: [] });
      }
    }
    setTimeout(() => {
      tbUdClose();
      /* Switch to trucks page */
      if (typeof tbNavTrucks === 'function') tbNavTrucks();
      if (truckNum && truckNum !== '--') {
        setTimeout(() => { if (typeof tbOpenTruck === 'function') tbOpenTruck(truckNum); }, 150);
      }
    }, 1300);
  } else {
    setTimeout(function() {
      if (truckNum && truckNum !== '--') {
        let t = trucks.find(function(x) { return x.num === truckNum; });
        if (!t) {
          t = {
            num: truckNum, ver:'v3.04.029', ign:'On', ignOff:false,
            err:0, wrn:0, ignDetail:'Just linked', plant:'Phoenix Central',
            lastConn:'Just now', conn:'live', unlinked:false,
            truckMode:'Active', unitId:u.id,
            account:'Cemex AZ', age:'0 min', source:'Unit Link',
            impact:'Not Managing', issue:'None', readyMaint:'Yes',
            newlyLinked:true
          };
          trucks.push(t);
        }
        if (!CC_TRUCKS.find(function(x) { return x.num === truckNum; })) {
          CC_TRUCKS.push({ num:truckNum, unlinked:false, components:[] });
        }
      }
      dtUdPendingPrevState = null;
      dtUdClose();
      setTimeout(function() {
        if (truckNum && truckNum !== '--') {
          dtOpenTruck(truckNum);
          setTimeout(function() {
            const overviewTab = document.querySelector('.dt-drawer-tab[onclick*="overview"]');
            if (overviewTab) dtDrawerTab('overview', overviewTab);
          }, 200);
        }
      }, 100);
    }, 1300);
    if (typeof dtUnitsRender === 'function') dtUnitsRender();
    if (typeof dtRefreshTable === 'function' && typeof dtActiveTab !== 'undefined') dtRefreshTable(dtActiveTab);
    const unlinkedEl = document.getElementById('dt-stat-unlinked');
    if (unlinkedEl && typeof UNITS_DATA !== 'undefined') {
      unlinkedEl.textContent = UNITS_DATA.filter(x => x.status === 'Unlinked Unit').length;
    }
  }
}

/* When user cancels config during Pending state — revert the entire link attempt */
function dtUdCfgCancelLink() {
  dtUdRevertPending();
}

function dtUdRenderTimeline() {
  const scroll = document.getElementById('dt-ud-scroll');
  scroll.innerHTML = dtBuildTimeline();
  if (typeof dtTimelineRenderRows === 'function') dtTimelineRenderRows();
}

function dtUdRenderLogs() {
  const scroll = document.getElementById('dt-ud-scroll');
  scroll.innerHTML = dtBuildLogs();
  if (typeof dtLogsRender === 'function') dtLogsRender();
  if (typeof dtLogsRenderEventDetails === 'function') dtLogsRenderEventDetails();
}

function dtUdRenderManual() {
  const scroll = document.getElementById('dt-ud-scroll');
  scroll.innerHTML = dtBuildManual();
  if (typeof dtInitManualCards === 'function') dtInitManualCards();
}

function dtUdRenderSensor() {
  const scroll = document.getElementById('dt-ud-scroll');
  scroll.innerHTML = dtBuildSensor();
  document.querySelectorAll('#dt-sen-chips .sen-chip').forEach(el => {
    el.classList.toggle('active', senSelected.has(el.dataset.sensor));
  });
  if (typeof dtSenRenderCards === 'function') dtSenRenderCards();
  if (typeof senStart === 'function') senStart();
}

/* ── Lifespan tab — per-component accordion ── */
/* ── Lifespan content builder. Pure HTML output so both drawers can use it.
   `targetUnitId`: which unit's lifespan to render
   `linkedTruckNum`: optional — when set, shows the "Currently installed on Truck X"
                     banner. Falls back to the unit's truck if not provided.
   `showOpenTruckLink`: when true, the banner has an "Open Truck" button.
                       Used by the unit drawer; suppressed by the truck drawer. */
function dtBuildLifespanHTML(targetUnitId, linkedTruckNum, showOpenTruckLink) {
  const u = UNITS_DATA.find(x => x.id === targetUnitId);
  if (!u) {
    return `<div style="padding:48px;text-align:center;color:var(--soft);font-size:14px;">No unit found.</div>`;
  }
  const truckNum = linkedTruckNum || (u.truck && u.truck !== '--' ? u.truck : null);
  const isLinked = !!truckNum;

  const comps = (typeof UNIT_HISTORY !== 'undefined')
    ? (UNIT_HISTORY[u.id] || UNIT_HISTORY['_default'] || [])
    : [];
  const activeComps  = comps.filter(c => !c.removed);
  const removedComps = comps.filter(c => c.removed);

  const iconLinked  = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 3.5" stroke="#16a34a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" stroke="#16a34a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const iconRemoved = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 3.5" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 3l10 10" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round"/></svg>`;

  function buildEntries(comp) {
    /* Strip date:'Current' placeholder — header-only. Reverse so oldest is first,
       most recent Replaced at bottom matches the serial in the card header. */
    const hist = comp.history.filter(h => h.date !== 'Current');
    return hist.map((h, hi) => {
      const isFirst = hi === 0;               /* originally installed = top */
      const isLast  = hi === hist.length - 1; /* most recent = bottom = currently installed */
      const isRemoved = comp.removed;
      let dotCls = 'middle';
      if (isFirst && !isRemoved)        dotCls = 'current';
      else if (isFirst && isRemoved)    dotCls = 'removed';
      else if (isLast && !isFirst)      dotCls = 'original';
      const connector = !isLast ? `<div class="dt-ls-entry-connector"></div>` : '';
      const dateLabel = isFirst && isRemoved
        ? `${h.date} <span class="dt-ls-entry-removed-tag">· removed ${comp.removedDate}</span>`
        : h.date;
      const tag = !isLast
        ? `<span class="dt-ls-entry-tag replaced">Replaced</span>`
        : `<span class="dt-ls-entry-tag original">Originally installed</span>`;
      return `
        <div class="dt-ls-entry">
          <div class="dt-ls-entry-rail">
            <div class="dt-ls-entry-dot ${dotCls}"></div>
            ${connector}
          </div>
          <div class="dt-ls-entry-date">${dateLabel}</div>
          <div class="dt-ls-entry-mac ${isFirst && isRemoved ? 'dim' : ''}">${h.mac}</div>
          ${tag}
        </div>`;
    }).join('');
  }

  function buildCard(comp, ci, isRemoved) {
    /* Use first real dated serial for the card header */
    const realHist = comp.history.filter(h => h.date !== 'Current');
    const current  = realHist.length > 0 ? realHist[0] : comp.history[0];
    const hasHistory = comp.history.length > 1;
    const icon       = isRemoved ? iconRemoved : iconLinked;
    const changesTxt = hasHistory
      ? `<span class="dt-ls-changes">${comp.history.length - 1} change${comp.history.length > 2 ? 's' : ''}</span>`
      : '';
    return `
      <div class="dt-ls-card${isRemoved ? ' removed' : ''}" id="dt-ls-card-${ci}">
        <div class="dt-ls-card-hdr" onclick="dtUdLsToggle(${ci})">
          <div class="dt-ls-card-left">
            <div class="dt-ls-name-row">
              ${icon}
              <span class="dt-ls-comp-name${isRemoved ? ' dim' : ''}">${comp.name}</span>
            </div>
            <div class="dt-ls-comp-mac${isRemoved ? ' dim' : ''}">${current.mac}${!isRemoved ? dcAgeInfo(current.mac) : ''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            ${changesTxt}
            <svg class="dt-ls-chev" width="11" height="7" viewBox="0 0 10 6" fill="none"><path d="M8.75 4.75L4.75 0.75L0.75 4.75" stroke="#36322d9e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>
        <div class="dt-ls-history">${buildEntries(comp)}</div>
      </div>`;
  }

  let html = '';
  if (isLinked) {
    const safeTruck = truckNum.split("'").join("\\'");
    const openLink = showOpenTruckLink
      ? `<button class="dt-ls-context-link" onclick="dtUdJumpToTruck('${safeTruck}')">
          Open Truck
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M6.5 2.5l3.5 3.5-3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>`
      : '';
    html += `
      <div class="dt-ls-context-banner">
        <div class="dt-ls-context-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="4" width="9" height="7" rx="1" stroke="#3069e3" stroke-width="1.4"/>
            <circle cx="5" cy="12" r="1.4" stroke="#3069e3" stroke-width="1.2"/>
            <circle cx="11" cy="12" r="1.4" stroke="#3069e3" stroke-width="1.2"/>
          </svg>
        </div>
        <div class="dt-ls-context-text">
          <div class="dt-ls-context-title">Currently installed on Truck ${truckNum}</div>
          <div class="dt-ls-context-sub">Live diagnostics for this truck live in the truck view.</div>
        </div>
        ${openLink}
      </div>`;
  }
  if (comps.length === 0) {
    return html + `<div style="padding:48px;text-align:center;color:var(--soft);font-size:14px;">No component history available for this unit yet.</div>`;
  }
  html += `<div class="dt-ls-section-label">Components · ${activeComps.length} active${removedComps.length ? ` · <span style="color:#9ca3af;">${removedComps.length} removed</span>` : ''}</div>`;
  html += activeComps.map((c, i) => buildCard(c, i, false)).join('');
  if (removedComps.length) {
    html += `<div class="dt-ls-section-label removed-section">Removed · ${removedComps.length}</div>`;
    html += removedComps.map((c, i) => buildCard(c, activeComps.length + i, true)).join('');
  }

  return html;
}

/* Builder used by the truck drawer's Unit Lifespan tab.
   Looks up which unit is installed on this truck. If nothing is installed,
   shows an empty state so the tab still works.
   Suppresses the lifespan banner — we add our own header showing the unit ID
   with an "Open Unit" pivot link. */
function dtBuildLifespanForTruck(truckNum) {
  const u = UNITS_DATA.find(x => x.status === 'Linked Unit' && x.truck === truckNum);
  if (!u) {
    return `<div style="padding:48px;text-align:center;color:var(--soft);font-size:14px;">No unit installed on this truck yet.</div>`;
  }
  const inner = dtBuildLifespanHTML(u.id, null, false); // no banner — we render our own
  const safeId = u.id.split("'").join("\\'");
  return `
    <div class="dt-ls-context-banner">
      <div class="dt-ls-context-icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="3" width="10" height="10" rx="1.5" stroke="#3069e3" stroke-width="1.4"/>
          <path d="M5.5 6h5M5.5 9h3" stroke="#3069e3" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="dt-ls-context-text">
        <div class="dt-ls-context-title">Unit ${u.id}</div>
        <div class="dt-ls-context-sub">Component lifespan for the unit installed on this truck.</div>
      </div>
      <button class="dt-ls-context-link" onclick="dtUdJumpToUnitFromTruck('${safeId}')">
        Open Unit
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M6.5 2.5l3.5 3.5-3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
    ${inner}
  `;
}

function dtUdRenderLifespan() {
  const u = UNITS_DATA.find(x => x.id === dtUdCurrentUnitId);
  if (!u) return;
  document.getElementById('dt-ud-scroll').innerHTML = dtBuildLifespanHTML(u.id, null, true);
}

/* Open the unit linked to the currently-open truck drawer. Pivots using the
   same cross-drawer animation as the existing dtUdJumpToTruck flow (in reverse).
   The unit drawer opens on the Lifespan tab; the "Also viewing → Components
   Overview" footer in the lifespan view lets the user come back. */


let dtTruckOpenedFromUnit = null;

function dtUdJumpToTruck(truckNum) {
  if (!dtUdCurrentUnitId) return;
  // Remember which unit we came from so the truck drawer can pivot back
  dtTruckOpenedFromUnit = dtUdCurrentUnitId;
  // Close the unit drawer instantly (no slide-out) so the only animation
  // the user sees is the truck drawer sliding in. Closing with the standard
  // animation while the target also animates in produces the jarring two-
  // drawer-fighting effect.
  const ud = document.getElementById('dt-ud-drawer');
  if (ud) {
    ud.classList.add('no-anim');
    ud.classList.remove('open');
    // Reset state without firing the close animation
    document.querySelector('#dt-ud-drawer .dt-attach-confirm')?.remove();
    if (typeof senStop === 'function') senStop();
    dtUdCurrentUnitId = null;
    // Clean up no-anim on next tick so future opens animate normally
    requestAnimationFrame(() => requestAnimationFrame(() => ud.classList.remove('no-anim')));
  }
  // Keep the scrim visible the whole time — no flicker
  document.getElementById('dt-drawer-scrim')?.classList.add('open');
  // Make sure the truck record exists. Newly-linked trucks aren't in the static
  // trucks array; synthesize one if needed so dtOpenTruck can render.
  dtEnsureTruckRecord(truckNum);
  // Wait one frame so the no-anim hide commits, then slide the truck drawer in.
  requestAnimationFrame(() => {
    if (typeof dtOpenTruck === 'function') dtOpenTruck(truckNum);
  });
}

function dtUdJumpToUnitFromTruck(unitId) {
  // Reverse pivot: hide truck drawer instantly, slide unit drawer in.
  const td = document.getElementById('dt-drawer');
  if (td) {
    td.classList.add('no-anim');
    td.classList.remove('open');
    dtDrawerTruckNum = null;
    if (typeof dtLogsSelectedId !== 'undefined') dtLogsSelectedId = null;
    if (typeof dtLogsEdTab !== 'undefined') dtLogsEdTab = 'structured';
    if (typeof senStop === 'function') senStop();
    requestAnimationFrame(() => requestAnimationFrame(() => td.classList.remove('no-anim')));
  }
  // Pivoting back to unit clears the cross-drawer breadcrumb
  dtTruckOpenedFromUnit = null;
  document.getElementById('dt-drawer-scrim')?.classList.add('open');
  requestAnimationFrame(() => dtUdOpen(unitId));
}

/* Ensure the trucks array has a record for the given truck number. When a unit
   is linked to a truck that originated from UNLINKED_TRUCKS, the truck isn't in
   the main trucks list — synthesize a minimal record using the unit's data so
   the truck drawer can render. */
function dtEnsureTruckRecord(truckNum) {
  if (typeof trucks === 'undefined') return;
  if (trucks.find(t => t.num === truckNum)) return;
  // Find the unit that's linked to this truck so we can pull contextual data
  const u = (typeof UNITS_DATA !== 'undefined')
    ? UNITS_DATA.find(x => x.truck === truckNum && x.status === 'Linked Unit')
    : null;
  trucks.push({
    num: truckNum,
    ver: u?.sysType || 'V4',
    ign: 'On', ignDetail: '—',
    source: 'Newly linked',
    plant: 'Phoenix Central',
    impact: 'None', issue: '',
    account: 'Cemex AZ',
    age: 'Just now',
    conn: 'live',
    err: 0, wrn: 0,
    unitId: u?.id || '',
    readyMaint: 'No',
    truckMode: 'Active',
    lastConn: new Date().toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'}) + ' today',
  });
}

function dtUdLsToggle(ci) {
  document.getElementById('dt-ls-card-' + ci)?.classList.toggle('open');
}

/* ── Attach tab — pick an unlinked truck and confirm.
   Layout matches Figma 378:32882: title row, search left + Attach Unit
   button right, 6-column table with zebra stripes, no bottom selected card. */
function dtUdRenderAttach() {
  const trucks = (typeof UNLINKED_TRUCKS !== 'undefined') ? UNLINKED_TRUCKS : [];
  const q = (dtUdAttachQuery || '').toLowerCase();
  const filtered = trucks.filter(t =>
    !q ||
    t.number.toLowerCase().includes(q) ||
    (t.type   || '').toLowerCase().includes(q) ||
    (t.drum   || '').toLowerCase().includes(q) ||
    (t.water  || '').toLowerCase().includes(q) ||
    (t.mixer  || '').toLowerCase().includes(q)
  );

  const cols = [
    { id:'number', label:'Truck Number',     width:160 },
    { id:'type',   label:'Truck Type',       width:120 },
    { id:'drum',   label:'Drum Size',        width:140 },
    { id:'water',  label:'Water propulsion', width:160 },
    { id:'mixer',  label:'Mixer Type',       width:140 },
    { id:'status', label:'Unit Status',      width:140 },
  ];

  const headerCells = cols.map((c, i) => {
    const isLast = i === cols.length - 1;
    const showDivider = !isLast;
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
        ${showDivider ? '<div class="dt-attach-th-divider"></div>' : ''}
      </div>`;
  }).join('');

  const rows = filtered.map((t, i) => {
    const sel  = dtUdAttachSelected === t.number;
    const safe = t.number.split("'").join("\\'");
    const alt  = i % 2 === 1;
    return `
      <div class="dt-attach-row${sel ? ' selected' : ''}${alt ? ' alt' : ''}" onclick="dtUdAttachSelect('${safe}')">
        <div class="dt-attach-cell" style="width:${cols[0].width}px;">${t.number}</div>
        <div class="dt-attach-cell" style="width:${cols[1].width}px;">${t.type}</div>
        <div class="dt-attach-cell" style="width:${cols[2].width}px;">${t.drum}</div>
        <div class="dt-attach-cell" style="width:${cols[3].width}px;">${t.water}</div>
        <div class="dt-attach-cell" style="width:${cols[4].width}px;">${t.mixer}</div>
        <div class="dt-attach-cell" style="flex:1;">Unlinked Unit</div>
      </div>`;
  }).join('');

  const empty = filtered.length === 0
    ? `<div class="dt-attach-empty">No unlinked trucks match your search.</div>`
    : '';

  const btnDisabled = !dtUdAttachSelected;

  document.getElementById('dt-ud-scroll').innerHTML = `
    <div class="dt-attach-title">${trucks.length} Trucks Unlinked</div>

    <div class="dt-attach-toolbar" id="dt-ud-attach-toolbar">
      <div class="dt-attach-search">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="#36322d9e" stroke-width="1.4"/><path d="M11 11l2.5 2.5" stroke="#36322d9e" stroke-width="1.4" stroke-linecap="round"/></svg>
        <input id="dt-attach-search" placeholder="Search" autocomplete="off"
               value="${dtUdAttachQuery.split('"').join('&quot;')}"
               oninput="dtUdAttachSearch()" />
      </div>
      <button class="dt-attach-cta" ${btnDisabled ? 'disabled' : ''} onclick="dtUdAttachConfirm()">
        Attach Unit
      </button>
    </div>

    <!-- Inline link-confirm — replaces the toolbar row when the user clicks
         Attach Unit. Same height + horizontal position, so the truck table
         below doesn't shift and the selected row stays exactly in place. -->
    <div id="dt-ud-attach-confirm" class="dt-inline-confirm informational toolbar-row" style="display:none;"></div>

    <div class="dt-attach-table">
      <div class="dt-attach-table-hdr">
        ${headerCells}
      </div>
      <div class="dt-attach-table-body" id="dt-attach-table-body">
        ${rows}${empty}
      </div>
    </div>
  `;
}

function dtUdAttachSelect(truckNum) {
  dtUdAttachSelected = dtUdAttachSelected === truckNum ? null : truckNum;
  // Update row selection state without re-rendering the whole panel (keeps search focus)
  document.querySelectorAll('#dt-attach-table-body .dt-attach-row').forEach(r => r.classList.remove('selected'));
  if (dtUdAttachSelected) {
    const safe = dtUdAttachSelected.split("'").join("\\'");
    const row = document.querySelector(`#dt-attach-table-body .dt-attach-row[onclick*="${safe}"]`);
    if (row) row.classList.add('selected');
  }
  // Toggle the Attach Unit button — on tablet the content lives in tb-ud-scroll
  const scrollId = (document.body.classList.contains('view-tablet') && document.getElementById('tb-ud-scroll'))
    ? 'tb-ud-scroll' : 'dt-ud-scroll';
  const cta = document.querySelector('#' + scrollId + ' .dt-attach-cta');
  if (cta) cta.disabled = !dtUdAttachSelected;
}

function dtUdAttachSearch() {
  dtUdAttachQuery = document.getElementById('dt-attach-search').value;
  const trucks = (typeof UNLINKED_TRUCKS !== 'undefined') ? UNLINKED_TRUCKS : [];
  const q = dtUdAttachQuery.toLowerCase();
  const filtered = trucks.filter(t =>
    !q ||
    t.number.toLowerCase().includes(q) ||
    (t.type || '').toLowerCase().includes(q) ||
    (t.drum || '').toLowerCase().includes(q) ||
    (t.water|| '').toLowerCase().includes(q) ||
    (t.mixer|| '').toLowerCase().includes(q)
  );
  const body = document.getElementById('dt-attach-table-body');
  if (!body) return;
  if (filtered.length === 0) {
    body.innerHTML = `<div class="dt-attach-empty">No unlinked trucks match your search.</div>`;
    return;
  }
  const cols = [160,120,140,160,140];
  body.innerHTML = filtered.map((t, i) => {
    const sel  = dtUdAttachSelected === t.number;
    const safe = t.number.split("'").join("\\'");
    const alt  = i % 2 === 1;
    return `
      <div class="dt-attach-row${sel ? ' selected' : ''}${alt ? ' alt' : ''}" onclick="dtUdAttachSelect('${safe}')">
        <div class="dt-attach-cell" style="width:${cols[0]}px;">${t.number}</div>
        <div class="dt-attach-cell" style="width:${cols[1]}px;">${t.type}</div>
        <div class="dt-attach-cell" style="width:${cols[2]}px;">${t.drum}</div>
        <div class="dt-attach-cell" style="width:${cols[3]}px;">${t.water}</div>
        <div class="dt-attach-cell" style="width:${cols[4]}px;">${t.mixer}</div>
        <div class="dt-attach-cell" style="flex:1;">Unlinked Unit</div>
      </div>`;
  }).join('');
}

function dtUdAttachConfirm() {
  // On tablet dtUdCurrentUnitId is null — use tbUdCurrentUnitId instead
  const currentUnitId = (document.body.classList.contains('view-tablet') && typeof tbUdCurrentUnitId !== 'undefined')
    ? tbUdCurrentUnitId : dtUdCurrentUnitId;
  if (!dtUdAttachSelected || !currentUnitId) return;
  const panel = document.getElementById('dt-ud-attach-confirm');
  if (!panel) return;
  const unitObj = (typeof UNITS_DATA !== 'undefined') ? UNITS_DATA.find(u => u.id === currentUnitId) : null;
  const tcgId = (unitObj && unitObj.tgw && unitObj.tgw !== '--') ? unitObj.tgw : '—';
  // Tighter, single-line copy — toolbar-row variant has no vertical room for
  // a multi-line body, so we keep the title self-explanatory.
  panel.innerHTML = `
    <div class="dt-inline-confirm-head">
      <div class="dt-inline-confirm-icon">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 3.5" stroke="#3069e3" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" stroke="#3069e3" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="dt-inline-confirm-text">
        <div class="dt-inline-confirm-title">Link Unit ${currentUnitId} to Truck ${dtUdAttachSelected}?</div>
        <div class="dt-inline-confirm-body" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:11px;font-weight:600;color:var(--soft);letter-spacing:0.3px;text-transform:uppercase;">TCG&nbsp;ID</span>
          <span style="font-family:'DM Mono',monospace;color:var(--strong);font-size:12px;letter-spacing:0.2px;">${tcgId}</span>
          <span style="color:var(--border-mid);">·</span>
          <span style="color:var(--soft);">Unit moves to Pending Configuration after link.</span>
        </div>
      </div>
    </div>
    <div class="dt-inline-confirm-btns">
      <button class="dt-inline-confirm-btn cancel" onclick="dtUdAttachCancel()">Cancel</button>
      <button class="dt-inline-confirm-btn primary" onclick="dtUdAttachDo()">Link to truck</button>
    </div>`;
  panel.style.display = 'flex';
  // Hide the toolbar row — the confirm row takes its slot, so layout doesn't shift.
  const toolbar = document.getElementById('dt-ud-attach-toolbar');
  if (toolbar) toolbar.style.display = 'none';
}

function dtUdAttachCancel() {
  const panel = document.getElementById('dt-ud-attach-confirm');
  if (panel) { panel.style.display = 'none'; panel.innerHTML = ''; }
  // Restore the toolbar row
  const toolbar = document.getElementById('dt-ud-attach-toolbar');
  if (toolbar) toolbar.style.display = '';
  // Re-enable the toolbar Attach Unit CTA based on current selection
  const cta = document.querySelector('.dt-attach-cta');
  if (cta) cta.disabled = !dtUdAttachSelected;
}

function dtUdAttachDo() {
  dtUdAttachCancel();

  /* On tablet, use tbUdCurrentUnitId — dtUdCurrentUnitId is null */
  const isTablet  = document.body.classList.contains('view-tablet');
  const currentId = isTablet ? tbUdCurrentUnitId : dtUdCurrentUnitId;
  if (!dtUdAttachSelected || !currentId) return;

  const u = UNITS_DATA.find(x => x.id === currentId);
  if (!u) return;

  dtUdPendingPrevState = {
    unitId: u.id,
    prevStatus: u.status,
    prevTruck:  u.truck,
    prevAssigned: u.assignedToTruck || null,
    truckSnapshot: (typeof UNLINKED_TRUCKS !== 'undefined')
      ? UNLINKED_TRUCKS.find(t => t.number === dtUdAttachSelected)
      : null,
  };

  u.status = 'Pending';
  u.truck  = dtUdAttachSelected;
  u.assignedToTruck = new Date().toLocaleDateString('en-US', {month:'2-digit',day:'2-digit',year:'numeric'});

  const truckForMixer = (typeof UNLINKED_TRUCKS !== 'undefined')
    ? UNLINKED_TRUCKS.find(t => t.number === dtUdAttachSelected) : null;
  u.mixerType = truckForMixer ? truckForMixer.mixer : '';

  const idx = (typeof UNLINKED_TRUCKS !== 'undefined')
    ? UNLINKED_TRUCKS.findIndex(t => t.number === dtUdAttachSelected) : -1;
  if (idx > -1) UNLINKED_TRUCKS.splice(idx, 1);

  if (isTablet) {
    /* Reshape tablet drawer for Pending */
    tbUdActiveTab = 'config';
    const pill = document.getElementById('tb-ud-status-pill');
    if (pill) pill.innerHTML = `<span class="dt-drawer-ign-badge pending"><span class="dt-drawer-ign-dot"></span>Pending Configuration</span>`;
    tbUdBuildTabs();
    tbUdRenderActiveTab();
    tbUdRenderSidePanelSection();
    if (typeof tbUnitsRender === 'function') tbUnitsRender();
  } else {
    dtUdActiveTab = 'config';
    dtUdApplyStatusUI(u);
    dtUdBuildTabs();
    dtUdRenderActiveTab();
    dtUdRenderSidePanel();
    if (typeof dtUnitsRender === 'function') dtUnitsRender();
  }
}

/* Revert a pending unit back to Unlinked. Called when user closes the drawer
   mid-configuration, or hits Cancel on the configuration save bar. */
function dtUdRevertPending() {
  const snap = dtUdPendingPrevState;
  if (!snap) return;
  const u = UNITS_DATA.find(x => x.id === snap.unitId);
  if (u && u.status === 'Pending') {
    u.status = snap.prevStatus;
    u.truck  = snap.prevTruck;
    u.assignedToTruck = snap.prevAssigned;
    if (snap.truckSnapshot && typeof UNLINKED_TRUCKS !== 'undefined') {
      const exists = UNLINKED_TRUCKS.find(t => t.number === snap.truckSnapshot.number);
      if (!exists) UNLINKED_TRUCKS.push(snap.truckSnapshot);
    }
  }
  dtUdPendingPrevState = null;
  if (typeof dtUnitsRender === 'function') dtUnitsRender();
  if (typeof tbUnitsRender === 'function') tbUnitsRender();

  const isTablet = document.body.classList.contains('view-tablet');
  if (isTablet) {
    if (u && tbUdCurrentUnitId === u.id) {
      tbUdActiveTab = 'lifespan';
      const pill = document.getElementById('tb-ud-status-pill');
      if (pill) pill.innerHTML = `<span class="dt-drawer-ign-badge unlinked"><span class="dt-drawer-ign-dot"></span>Unlinked</span>`;
      tbUdBuildTabs();
      tbUdRenderActiveTab();
      tbUdRenderSidePanelSection();
    }
  } else {
    if (u && dtUdCurrentUnitId === u.id) {
      dtUdActiveTab = 'lifespan';
      dtUdApplyStatusUI(u);
      dtUdBuildTabs();
      dtUdRenderActiveTab();
      dtUdRenderSidePanel();
    }
  }
}

/* ── Side panel ── */
function dtUdRenderSidePanel() {
  const u = UNITS_DATA.find(x => x.id === dtUdCurrentUnitId);
  if (!u) return;
  const isLinked  = u.status === 'Linked Unit';
  const isPending = u.status === 'Pending';

  // Top row chips: Linked → Connectivity / Truck Mode (mirroring truck drawer).
  // Pending → Pending / Account. Unlinked → Status / Account.
  let chip1, chip2;
  if (isLinked) {
    chip1 = {
      icon: `<svg class="dt-ud-side-chip-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6.5a8 8 0 0112 0M4.5 9a4.5 4.5 0 017 0M7 11.5a1.5 1.5 0 012 0" stroke="#36322d" stroke-width="1.4" stroke-linecap="round"/></svg>`,
      label: 'Connectivity',
      val: 'Connected',
      valClass: 'linkish',
    };
    chip2 = {
      icon: `<svg class="dt-ud-side-chip-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="#36322d" stroke-width="1.4"/><circle cx="8" cy="8" r="2" stroke="#36322d" stroke-width="1.4"/></svg>`,
      label: 'Truck Mode',
      val: 'Live',
      valClass: '',
    };
  } else if (isPending) {
    chip1 = {
      icon: `<svg class="dt-ud-side-chip-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#e8851a" stroke-width="1.4"/><path d="M8 5v3.2L10 10" stroke="#e8851a" stroke-width="1.4" stroke-linecap="round"/></svg>`,
      label: 'Status',
      val: 'Pending Configuration',
      valClass: '',
    };
    chip2 = {
      icon: `<svg class="dt-ud-side-chip-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="#36322d" stroke-width="1.4"/><path d="M2 6h12" stroke="#36322d" stroke-width="1.4"/></svg>`,
      label: 'Account',
      val: 'Cemex AZ',
      valClass: '',
    };
  } else {
    chip1 = {
      icon: `<svg class="dt-ud-side-chip-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="#36322d" stroke-width="1.4"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="#36322d" stroke-width="1.4" stroke-linecap="round"/></svg>`,
      label: 'Status',
      val: 'Not attached',
      valClass: 'dim',
    };
    chip2 = {
      icon: `<svg class="dt-ud-side-chip-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="#36322d" stroke-width="1.4"/><path d="M2 6h12" stroke="#36322d" stroke-width="1.4"/></svg>`,
      label: 'Account',
      val: 'Cemex AZ',
      valClass: '',
    };
  }

  // Meta rows — when Linked, fill in real-ish data. When Unlinked/Pending, mostly "—".
  const metaRows = isLinked ? [
    { k:'TCG ID',             v: u.tgw && u.tgw !== '--' ? u.tgw : '—' },
    { k:'Code version',       v: u.sysType === 'Spark' ? '5.01.003' : u.sysType === 'V4' ? '4.02.011' : '3.04.029' },
    { k:'Commissioned',       v: u.firstCommissioned || '—' },
    { k:'Last Connect',       v: 'Mar 24, 2025, 1:16:38 PM' },
    { k:'Last System Status', v: 'Mar 24, 2025, 1:16:38 PM' },
    { k:'Last Reboot',        v: 'Mar 24, 2025, 1:16 PM' },
    { k:'Configuration',      v: u.config || '—' },
    { k:'Contract',           v: u.contract || '—' },
  ] : [
    { k:'TCG ID',             v: u.tgw && u.tgw !== '--' ? u.tgw : '—' },
    { k:'Code version',       v: '—' },
    { k:'Commissioned',       v: u.firstCommissioned || '—' },
    { k:'Last Connect',       v: '—' },
    { k:'Last System Status', v: '—' },
    { k:'Last Reboot',        v: '—' },
    { k:'Configuration',      v: u.config || '—' },
    { k:'Contract',           v: u.contract || '—' },
  ];

  // Linked also gets a GPS Location button at the bottom (matches Figma)
  const gpsBtn = isLinked
    ? `<button class="dt-ud-side-gps-btn" onclick="dtUdGpsPlaceholder()">GPS Location</button>`
    : '';

  document.getElementById('dt-ud-side-body').innerHTML = `
    <div class="dt-ud-side-chips">
      <div class="dt-ud-side-chip">
        ${chip1.icon}
        <div class="dt-ud-side-chip-label">${chip1.label}</div>
        <div class="dt-ud-side-chip-val ${chip1.valClass}">${chip1.val}</div>
      </div>
      <div class="dt-ud-side-chip">
        ${chip2.icon}
        <div class="dt-ud-side-chip-label">${chip2.label}</div>
        <div class="dt-ud-side-chip-val ${chip2.valClass}">${chip2.val}</div>
      </div>
    </div>
    <div class="dt-ud-meta">
      ${metaRows.map((r, i) => `
        <div class="dt-ud-meta-row${i % 2 === 1 ? ' alt' : ''}" style="display:contents;">
          <div class="dt-ud-meta-cell" style="${i % 2 === 1 ? 'background:var(--layer-1);border-radius:4px 0 0 4px;' : ''}">${r.k}</div>
          <div class="dt-ud-meta-cell val" style="${i % 2 === 1 ? 'background:var(--layer-1);border-radius:0 4px 4px 0;' : ''}">${r.v}</div>
        </div>
      `).join('')}
    </div>
    ${gpsBtn}
  `;
}

function dtUdGpsPlaceholder() {
  // Placeholder — GPS Location flow comes later
  alert('GPS Location — coming soon');
}

// Esc closes drawer (or just the open dropdown if one is open)
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const drawer = dtAuQ('dt-au-drawer');
  if (!drawer || !drawer.classList.contains('open')) return;
  // First close any open dropdown
  let closedDd = false;
  ['contract','sysType','config'].forEach(key => {
    const menu = dtAuQ('dt-au-' + key + '-menu');
    if (menu && menu.classList.contains('open')) {
      menu.classList.remove('open');
      dtAuQ('dt-au-' + key + '-chev')?.classList.remove('open');
      dtAuQ('dt-au-' + key + '-btn')?.classList.remove('open');
      closedDd = true;
    }
  });
  if (!closedDd) dtAuClose();
});

// Esc on the unit drawer — close the confirm overlay first if open, else the drawer
