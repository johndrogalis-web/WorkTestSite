/* app-01-tickets-trucklogs.js — Tickets page, truck logs (tl, tk), mobile flows. Loads 1st.
   Part of the app.js split. All six app-*.js files share one global
   scope and MUST load in numeric order (see index.html). */
/* Page logic — data lives in shared-data.js */

/* Derive err/wrn counts from CC_TRUCKS component states for consistency */
function getTruckAlerts(truckNum) {
  const cc = CC_TRUCKS.find(c => String(c.num) === String(truckNum));
  if (!cc || !cc.components) return { err: 0, wrn: 0 };
  let err = 0, wrn = 0;
  cc.components.forEach(function(comp) {
    if (comp.state === 'alarm' || comp.state === 'empty') err++;
    else if (comp.state === 'warn') wrn++;
  });
  return { err, wrn };
}


/* ═══ Ping / Restart / Sensors flip-grow data ══════════════════════════════ */
const PING_DATA = {
  networkChange: { label:'Network Change', value:'LTE · -72 dBm', status:'ok' },
  identity:      { label:'Identity',       value:'TCG-38291 · v5.01.008', status:'ok' },
  systemStatus:  { label:'System Status',  value:'Online · Active', status:'ok' },
};

const RESTART_EVENTS = [
  { label:'Shutdown Event', value:'Logged · just now', status:'ok' },
  { label:'Startup Event',  value:'Accomplished · 12s later', status:'ok' },
];

const SENSOR_DATA = [
  { device:'WDS',       status:'responding' },
  { device:'TCG',       status:'responding' },
  { device:'CPS',       status:'responding' },
  { device:'DRS',       status:'responding' },
  { device:'ICD',       status:'responding' },
  { device:'CWR',       status:'not-responding' },
  { device:'Charge',    status:'responding' },
  { device:'Discharge', status:'responding' },
];

/* ═══ Shared flip-grow helpers for Ping / Restart / Sensors ════════════════ */

/* Generic flip open — same mechanic as canFlipOpen */
function isMobile() {
  return !document.body.classList.contains('view-desktop') &&
         !document.body.classList.contains('view-tablet');
}

function canInsertGhost(mountEl) {
  if (mountEl.dataset.ghostId) return;
  const ghost = document.createElement('div');
  ghost.id = 'can-ghost-' + mountEl.id;
  ghost.style.cssText = `width:${mountEl.offsetWidth}px;height:${mountEl.offsetHeight}px;flex-shrink:0;`;
  mountEl.parentElement.insertBefore(ghost, mountEl);
  mountEl.dataset.ghostId = ghost.id;
}

function canRemoveGhost(mountEl) {
  const id = mountEl.dataset.ghostId;
  if (!id) return;
  const ghost = document.getElementById(id);
  if (ghost) ghost.remove();
  delete mountEl.dataset.ghostId;
}

function gFlipOpen(mountId, backHTML, afterExpandCb) {
  const mountEl = document.getElementById(mountId);
  if (!mountEl || mountEl.dataset.flipBuilt) return;
  mountEl.dataset.flipBuilt = '1';
  mountEl.style.perspective = '1000px';

  const inner = document.createElement('div');
  inner.id = mountId + '-flip-inner';
  inner.style.cssText = 'width:100%;height:100%;position:relative;transform-style:preserve-3d;transition:transform 0.5s cubic-bezier(0.4,0,0.2,1);';

  const front = document.createElement('div');
  front.style.cssText = 'position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:inherit;';
  while (mountEl.firstChild) front.appendChild(mountEl.firstChild);
  const mcCard = front.querySelector('.mc-card');
  if (mcCard) mcCard.style.overflow = 'visible';

  const back = document.createElement('div');
  back.id = mountId + '-back';
  back.style.cssText = 'position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;transform:rotateY(180deg);background:var(--layer-1);border:1px solid var(--border);border-radius:16px;display:flex;flex-direction:column;overflow:hidden;';
  back.innerHTML = backHTML;

  inner.appendChild(front);
  inner.appendChild(back);
  mountEl.appendChild(inner);

  /* Phase 1 — flip */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      inner.style.transform = 'rotateY(180deg)';

      /* Phase 2 — expand to full row width */
      setTimeout(() => {
        const parent = mountEl.closest('.dt-mc-section-cards') || mountEl.closest('.mc-grid') || mountEl.parentElement;
        if (!parent) return;
        const mRect = mountEl.getBoundingClientRect();
        const pRect = parent.getBoundingClientRect();
        mountEl.dataset.natTop  = mRect.top  - pRect.top;
        mountEl.dataset.natLeft = mRect.left - pRect.left;
        mountEl.dataset.natW    = mRect.width;
        mountEl.dataset.natH    = mRect.height;
        parent.style.position = 'relative';
        canInsertGhost(mountEl);
        mountEl.style.cssText = `position:absolute;z-index:500;top:${mRect.top-pRect.top}px;left:${mRect.left-pRect.left}px;width:${mRect.width}px;height:${mRect.height}px;border-radius:16px;transition:none;perspective:1000px;`;
        mountEl.getBoundingClientRect();
        mountEl.style.transition = 'left 0.4s cubic-bezier(0.22,1,0.36,1),width 0.4s cubic-bezier(0.22,1,0.36,1),height 0.4s cubic-bezier(0.22,1,0.36,1),box-shadow 0.4s ease';
        mountEl.style.left      = '0px';
        mountEl.style.width     = parent.offsetWidth + 'px';
        mountEl.style.height    = '260px';
        mountEl.style.boxShadow = '0 8px 32px rgba(54,50,45,0.14)';

        /* Mobile: scroll so expanded card is visible */
        if (isMobile()) {
          const scrollEl = mountEl.closest('.co-scroll');
          if (scrollEl) setTimeout(() => {
            const cr = mountEl.getBoundingClientRect();
            const sr = scrollEl.getBoundingClientRect();
            scrollEl.scrollTo({ top: scrollEl.scrollTop + (cr.top - sr.top) - 16, behavior:'smooth' });
          }, 440);
        }

        /* Phase 3 — after expand, load content */
        setTimeout(() => { if (afterExpandCb) afterExpandCb(back); }, 420);
      }, 480);
    });
  });
}

/* Generic flip close — same mechanic as canFlipClose */
function gFlipClose(mountId, cardDef) {
  const mountEl = document.getElementById(mountId);
  if (!mountEl) return;

  /* Clear back face content */
  const back = document.getElementById(mountId + '-back');
  if (back) { back.innerHTML = ''; }

  const natLeft = parseFloat(mountEl.dataset.natLeft || 0);
  const natW    = parseFloat(mountEl.dataset.natW    || 200);
  const natH    = parseFloat(mountEl.dataset.natH    || 200);

  /* Collapse */
  mountEl.style.transition = 'left 0.4s cubic-bezier(0.22,1,0.36,1),width 0.4s cubic-bezier(0.22,1,0.36,1),height 0.4s cubic-bezier(0.22,1,0.36,1)';
  mountEl.style.left   = natLeft + 'px';
  mountEl.style.width  = natW + 'px';
  mountEl.style.height = natH + 'px';

  /* Flip back */
  setTimeout(() => {
    const inner = document.getElementById(mountId + '-flip-inner');
    if (inner) inner.style.transform = '';

    /* Teardown */
    setTimeout(() => {
      canRemoveGhost(mountEl);
      mountEl.style.cssText = '';
      mountEl.style.perspective = '';
      delete mountEl.dataset.flipBuilt;
      /* Restore overflow on clip containers */
      const drawerBodyR = mountEl.closest ? mountEl.closest('.drawer-body') : null;
      if (drawerBodyR) drawerBodyR.style.overflow = '';
      const stateManualR = mountEl.closest ? mountEl.closest('#state-manual') : null;
      if (stateManualR) stateManualR.style.overflow = '';
      /* Rebuild card fresh */
      if (cardDef) {
        const def = MC_CARD_DEFS.find(d => d.id === cardDef.id);
        if (def) {
          mountEl.innerHTML = '';
          const cw = document.createElement('div');
          cw.innerHTML = '<div class="mc-card"><div class="progress-track"><div class="progress-fill"></div></div></div>';
          mountEl.appendChild(cw);
          const newInst = new CardInstance(def, cw);
          if (cardDef.store) window[cardDef.store] = newInst;
          const card = cw.querySelector('.mc-card');
          if (card) card.addEventListener('click', function(e) {
            if (e.target.closest('button')) return;
            if (cardDef.flipOpenFn) cardDef.flipOpenFn();
          });
          if (cardDef.hintFn) setTimeout(() => cardDef.hintFn(mountEl, cardDef.flipOpenFn), 400);
        }
      }
    }, 520);
  }, 420);
}

/* Back face close button SVG */
const CLOSE_BTN_SVG = '<svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1l6 6M7 1L1 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';


/* ═══ Ping Truck flip-grow ══════════════════════════════════════════════════ */
function pingFlipOpen() {
  const backHTML = `
    <div class="can-back-progress" id="ping-back-progress"><div class="can-back-progress-fill" id="ping-back-progress-fill"></div></div>
    <div class="can-back-hdr">
      <span class="can-back-title">Ping Truck</span>
      <span class="can-back-badge cleared" id="ping-back-badge">Responded</span>
      <button class="can-back-close" onclick="pingFlipClose()">${CLOSE_BTN_SVG}</button>
    </div>
    <div class="can-back-list" id="ping-back-list"></div>
    <div class="can-back-ftr" id="ping-back-ftr" style="opacity:0;pointer-events:none;">
      <button class="can-back-btn primary" onclick="pingFlipClose()">Done</button>
      <button class="can-back-btn" onclick="pingViewLogs()">View Truck Logs</button>
    </div>`;

  gFlipOpen('mc-unit-ping', backHTML, (back) => {
    const list = document.getElementById('ping-back-list');
    const ftr  = document.getElementById('ping-back-ftr');
    const rows = [
      { label:'Network Change', value:'LTE · -72 dBm',         status:'ok' },
      { label:'Identity',       value:'TCG-38291 · v5.01.008', status:'ok' },
      { label:'System Status',  value:'Online · Active',        status:'ok' },
    ];
    if (list) list.innerHTML = rows.map((r, i) => `
      <div class="can-err-row" style="grid-template-columns:130px 1fr;animation-delay:${i*180}ms;">
        <div class="can-err-device"><span class="can-err-dot" style="background:${r.status==='ok'?'#16a34a':'#d70100'};"></span>${r.label}</div>
        <div class="can-err-desc">${r.value}</div>
      </div>`).join('');
    setTimeout(() => {
      if (ftr) { ftr.style.opacity = ''; ftr.style.pointerEvents = ''; }
    }, rows.length * 180 + 300);
  });

  /* Also wire up the dt (desktop) mount */
  const dtMount = document.getElementById('dt-mc-unit-ping');
  if (dtMount && !dtMount.dataset.flipBuilt) {
    const backHTML2 = backHTML.replace(/id="ping-back-/g, 'id="dt-ping-back-').replace(/id="ping-back-/g, 'id="dt-ping-back-').replace(/\(this\)/g, '()');
    gFlipOpen('dt-mc-unit-ping', backHTML2, (back) => {
      const list = document.getElementById('dt-ping-back-list');
      const ftr  = document.getElementById('dt-ping-back-ftr');
      const rows = [
        { label:'Network Change', value:'LTE · -72 dBm', status:'ok' },
        { label:'Identity',       value:'TCG-38291 · v5.01.008', status:'ok' },
        { label:'System Status',  value:'Online · Active', status:'ok' },
      ];
      if (list) list.innerHTML = rows.map((r, i) => `
        <div class="can-err-row" style="grid-template-columns:130px 1fr;animation-delay:${i*180}ms;">
          <div class="can-err-device"><span class="can-err-dot" style="background:${r.status==='ok'?'#16a34a':'#d70100'};"></span>${r.label}</div>
          <div class="can-err-desc">${r.value}</div>
        </div>`).join('');
      setTimeout(() => { if (ftr) { ftr.style.opacity=''; ftr.style.pointerEvents=''; } }, rows.length*180+300);
    });
  }
}

function pingFlipClose() {
  gFlipClose('mc-unit-ping', { id:'ping', flipOpenFn: pingFlipOpen, hintFn: canInjectFlipHint });
  gFlipClose('dt-mc-unit-ping', { id:'ping', flipOpenFn: pingFlipOpen, hintFn: canInjectFlipHint });
}

function pingViewLogs() {
  pingFlipClose();
  setTimeout(() => {
    const t = document.querySelector('.dt-tab[data-tab="logs"]');
    if (t && typeof dtDrawerTab === 'function') dtDrawerTab('logs', t);
  }, 500);
}

/* ═══ Restart System flip-grow ══════════════════════════════════════════════ */
function restartFlipOpen() {
  const backHTML = `
    <div class="can-back-progress" id="restart-back-progress"><div class="can-back-progress-fill" id="restart-back-progress-fill"></div></div>
    <div class="can-back-hdr">
      <span class="can-back-title">Restart System</span>
      <span class="can-back-badge cleared" id="restart-back-badge">Restarting…</span>
      <button class="can-back-close" onclick="restartFlipClose()">${CLOSE_BTN_SVG}</button>
    </div>
    <div class="can-back-list" id="restart-back-list"></div>
    <div class="can-back-ftr" id="restart-back-ftr" style="opacity:0;pointer-events:none;">
      <button class="can-back-btn primary" onclick="restartFlipClose()">Done</button>
    </div>`;

  const mountId = document.body.classList.contains('view-desktop') || document.body.classList.contains('view-tablet')
    ? 'dt-mc-unit-restart' : 'mc-unit-restart';

  gFlipOpen(mountId, backHTML, (back) => {
    const list  = document.getElementById('restart-back-list');
    const badge = document.getElementById('restart-back-badge');
    const ftr   = document.getElementById('restart-back-ftr');

    /* Terminal-style boot log — lines appear sequentially */
    const bootLog = [
      { dot:'#3069e3', label:'Shutdown Signal',  value:'Sent to TCG · 0s',     delay:0    },
      { dot:'#3069e3', label:'CAN Bus',           value:'Flushing errors…',      delay:600  },
      { dot:'#f59e0b', label:'System',            value:'Rebooting · 4s',        delay:1300 },
      { dot:'#16a34a', label:'Startup Complete',  value:'All systems online',    delay:2400 },
    ];

    bootLog.forEach((entry, i) => {
      setTimeout(() => {
        if (!list) return;
        const row = document.createElement('div');
        row.className = 'can-err-row';
        row.style.cssText = 'grid-template-columns:140px 1fr;animation-delay:0ms;';
        row.innerHTML = `<div class="can-err-device"><span class="can-err-dot" style="background:${entry.dot};"></span>${entry.label}</div><div class="can-err-desc">${entry.value}</div>`;
        list.appendChild(row);
        /* Update badge on last entry */
        if (i === bootLog.length - 1) {
          if (badge) { badge.textContent = 'Online'; badge.className = 'can-back-badge cleared'; }
          setTimeout(() => { if (ftr) { ftr.style.opacity=''; ftr.style.pointerEvents=''; } }, 400);
        }
      }, entry.delay);
    });
  });
}

function restartFlipClose() {
  const mountId = document.body.classList.contains('view-desktop') || document.body.classList.contains('view-tablet')
    ? 'dt-mc-unit-restart' : 'mc-unit-restart';
  gFlipClose(mountId, { id:'restart', flipOpenFn: restartFlipOpen, hintFn: canInjectFlipHint });
}

/* ═══ Reset Sensors flip-grow ══════════════════════════════════════════════ */
let sensorsResetCount = 0;

function sensorsFlipOpen() {
  sensorsResetCount = 0;
  const mountId = document.body.classList.contains('view-desktop') || document.body.classList.contains('view-tablet')
    ? 'dt-mc-unit-sensors' : 'mc-unit-sensors';

  const backHTML = `
    <div class="can-back-progress" id="sensors-back-progress"><div class="can-back-progress-fill" id="sensors-back-progress-fill"></div></div>
    <div class="can-back-hdr">
      <span class="can-back-title">Reset Sensors</span>
      <span class="can-back-badge" id="sensors-back-badge">8 sensors</span>
      <button class="can-back-close" onclick="sensorsFlipClose()">${CLOSE_BTN_SVG}</button>
    </div>
    <div class="can-back-list" id="sensors-back-list"></div>
    <div class="can-back-ftr" id="sensors-back-ftr" style="opacity:0;pointer-events:none;"></div>`;

  gFlipOpen(mountId, backHTML, (back) => {
    sensorsDoReset(mountId);
  });
}

function sensorErrRow(s, i, animated) {
  const ok = s.status === 'responding';
  const dot = ok ? '#16a34a' : '#d70100';
  const val = ok ? 'Responding' : 'Not responding';
  const style = animated ? `animation-delay:${i*200}ms` : 'opacity:1;transform:none;animation:none;';
  return `<div class="can-err-row" style="${style};grid-template-columns:100px 1fr;">
    <div class="can-err-device"><span class="can-err-dot" style="background:${dot};"></span>${s.device}</div>
    <div class="can-err-desc" style="color:${ok?'var(--defined)':'#d70100'};">${val}</div>
  </div>`;
}

function sensorsDoReset(mountId) {
  const list  = document.getElementById('sensors-back-list');
  const badge = document.getElementById('sensors-back-badge');
  const ftr   = document.getElementById('sensors-back-ftr');
  if (!list || !badge) return;

  sensorsResetCount++;
  const thisReset = sensorsResetCount;

  /* Run progress bar */
  const progTrack = document.getElementById('sensors-back-progress');
  const progFill  = document.getElementById('sensors-back-progress-fill');
  if (progTrack && progFill) {
    progFill.style.transition = 'none'; progFill.style.width = '0%';
    progFill.className = 'can-back-progress-fill';
    progTrack.classList.add('visible');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      progFill.style.transition = 'width 1200ms cubic-bezier(0.4,0,0.2,1)';
      progFill.style.width = '92%';
      setTimeout(() => {
        progFill.style.transition = 'width 200ms ease';
        progFill.style.width = '100%';
        progFill.classList.add('success');
        setTimeout(() => {
          progTrack.classList.remove('visible');
          progFill.style.width = '0%';
          progFill.classList.remove('success');

          if (thisReset >= 2) {
            /* Second reset — all sensors responding, fade out then close */
            badge.textContent = 'All responding';
            badge.className = 'can-back-badge cleared';
            if (ftr) { ftr.style.opacity = '0'; ftr.style.pointerEvents = 'none'; }
            const rows = list.querySelectorAll('.can-err-row');
            rows.forEach((row, i) => {
              setTimeout(() => {
                row.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
                row.style.opacity = '0';
                row.style.transform = 'scale(0.93) translateY(-4px)';
              }, i * 50);
            });
            setTimeout(() => sensorsFlipClose(), rows.length * 50 + 320);
            sensorsResetCount = 0;
          } else {
            /* First reset — show sensor status list */
            list.innerHTML = '<div class="can-back-empty">Resetting sensors…</div>';
            badge.textContent = '0 / 8';
            badge.className = 'can-back-badge';
            if (ftr) { ftr.style.opacity = '0'; ftr.style.pointerEvents = 'none'; }

            let showing = [];
            SENSOR_DATA.forEach((s, i) => {
              setTimeout(() => {
                showing.push(s);
                const ok = showing.filter(x => x.status === 'responding').length;
                badge.textContent = ok + ' / ' + SENSOR_DATA.length;
                badge.className = ok === SENSOR_DATA.length ? 'can-back-badge cleared' : 'can-back-badge';
                list.innerHTML = showing.map((x, idx) => sensorErrRow(x, idx, true)).join('');
                if (i === SENSOR_DATA.length - 1 && ftr) {
                  setTimeout(() => {
                    ftr.style.opacity = '';
                    ftr.style.pointerEvents = '';
                    ftr.innerHTML = '<button class="can-back-btn primary" onclick="sensorsDoReset(\''+mountId+'\')">Retry Reset</button>' +
                      '<button class="can-back-btn" onclick="sensorsFlipClose()">Done</button>';
                  }, 400);
                }
              }, 400 + i * 220);
            });
          }
        }, 300);
      }, 1200);
    }));
  }
}

function sensorsFlipClose() {
  const mountId = document.body.classList.contains('view-desktop') || document.body.classList.contains('view-tablet')
    ? 'dt-mc-unit-sensors' : 'mc-unit-sensors';
  gFlipClose(mountId, { id:'sensors', flipOpenFn: sensorsFlipOpen, hintFn: canInjectFlipHint });
}

/* ═══ CAN Errors flip-grow card ════════════════════════════════════════════ */
const CAN_ERRORS_DATA = [
  { device:'WDS',        code:'ERR-0x14', desc:'No signal detected' },
  { device:'TCG',        code:'ERR-0x02', desc:'Heartbeat timeout' },
  { device:'CPS',        code:'ERR-0x08', desc:'Pressure out of range' },
  { device:'Bus Power',  code:'ERR-0x11', desc:'Voltage drop' },
  { device:'DRS',        code:'ERR-0x09', desc:'Sensor not responding' },
  { device:'ICD',        code:'ERR-0x1A', desc:'Display comm lost' },
  { device:'CWR',        code:'ERR-0x06', desc:'Temp sensor fault' },
  { device:'Charge',     code:'ERR-0x03', desc:'CAN bus timeout' },
  { device:'Discharge',  code:'ERR-0x07', desc:'Signal lost' },
  { device:'WDS',        code:'ERR-0x15', desc:'Battery low' },
];

let canResetCount = 0;
let canRepopTimer = null;

function canMountId() {
  return (document.body.classList.contains('view-desktop') || document.body.classList.contains('view-tablet'))
    ? 'dt-mc-unit-canerrors' : 'mc-unit-canerrors';
}

function canErrRow(e, i, animated) {
  const style = animated ? `animation-delay:${i*300}ms` : 'opacity:1;transform:none;animation:none;';
  return `<div class="can-err-row" style="${style}">
    <div class="can-err-device"><span class="can-err-dot"></span>${e.device}</div>
    <div class="can-err-code">${e.code}</div>
    <div class="can-err-desc">${e.desc}</div>
  </div>`;
}

function canFlipOpen() {
  canResetCount = 0;
  const mountId = canMountId();

  const backHTML = `
    <div class="can-back-progress" id="can-back-progress"><div class="can-back-progress-fill" id="can-back-progress-fill"></div></div>
    <div class="can-back-hdr">
      <span class="can-back-title">CAN Errors</span>
      <span class="can-back-badge" id="can-back-badge">3 active</span>
      <button class="can-back-close" onclick="canFlipClose()">${CLOSE_BTN_SVG}</button>
    </div>
    <div class="can-back-list" id="can-back-list"></div>
    <div class="can-back-ftr" id="can-back-ftr" style="opacity:0;pointer-events:none;"></div>`;

  gFlipOpen(mountId, backHTML, () => {
    /* Load current 3 errors on view, show Reset + View Truck Logs */
    const list  = document.getElementById('can-back-list');
    const ftr   = document.getElementById('can-back-ftr');
    const badge = document.getElementById('can-back-badge');
    if (list) list.innerHTML = CAN_ERRORS_DATA.slice(0,3).map((e,i) => canErrRow(e,i,true)).join('');
    if (badge) badge.textContent = '3 active';
    if (ftr) {
      setTimeout(() => {
        ftr.style.opacity = '';
        ftr.style.pointerEvents = '';
        ftr.innerHTML = `
          <button class="can-back-btn primary" onclick="canDoReset()">Reset</button>
          <button class="can-back-btn" onclick="canViewLogs()">View Truck Logs</button>`;
      }, CAN_ERRORS_DATA.slice(0,3).length * 300 + 300);
    }
  });
}

function canDoReset() {
  if (canRepopTimer) { clearTimeout(canRepopTimer); canRepopTimer = null; }
  const list  = document.getElementById('can-back-list');
  const badge = document.getElementById('can-back-badge');
  const ftr   = document.getElementById('can-back-ftr');
  if (!list || !badge) return;

  canResetCount++;
  const thisReset = canResetCount;

  /* Run progress bar */
  const progTrack = document.getElementById('can-back-progress');
  const progFill  = document.getElementById('can-back-progress-fill');
  if (progTrack && progFill) {
    progFill.style.transition = 'none'; progFill.style.width = '0%';
    progFill.className = 'can-back-progress-fill';
    progTrack.classList.add('visible');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      progFill.style.transition = 'width 1200ms cubic-bezier(0.4,0,0.2,1)';
      progFill.style.width = '92%';
      setTimeout(() => {
        progFill.style.transition = 'width 200ms ease';
        progFill.style.width = '100%';
        progFill.classList.add('success');
        setTimeout(() => {
          progTrack.classList.remove('visible');
          progFill.style.width = '0%';
          progFill.classList.remove('success');

          if (thisReset >= 2) {
            /* Second reset — all cleared, stagger fade-out then close */
            badge.textContent = 'All cleared';
            badge.className = 'can-back-badge cleared';
            if (ftr) { ftr.style.opacity = '0'; ftr.style.pointerEvents = 'none'; }
            const rows = list.querySelectorAll('.can-err-row');
            rows.forEach((row, i) => {
              setTimeout(() => {
                row.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
                row.style.opacity = '0';
                row.style.transform = 'scale(0.93) translateY(-4px)';
              }, i * 50);
            });
            setTimeout(() => canFlipClose(), rows.length * 50 + 320);
            canResetCount = 0;

          } else {
            /* First reset — clear then repopulate all 10 errors one by one */
            list.innerHTML = '<div class="can-back-empty">Errors cleared — waiting for truck response…</div>';
            badge.textContent = '0 cleared';
            badge.className = 'can-back-badge cleared';
            if (ftr) { ftr.style.opacity = '0'; ftr.style.pointerEvents = 'none'; }

            let showing = [];
            CAN_ERRORS_DATA.forEach((err, i) => {
              canRepopTimer = setTimeout(() => {
                showing.push(err);
                badge.textContent = showing.length + (showing.length === 1 ? ' error' : ' errors');
                badge.className = 'can-back-badge';
                list.innerHTML = showing.map((e, idx) => canErrRow(e, idx, true)).join('');
                if (i === CAN_ERRORS_DATA.length - 1 && ftr) {
                  setTimeout(() => {
                    ftr.style.opacity = '';
                    ftr.style.pointerEvents = '';
                    ftr.innerHTML = `
                      <button class="can-back-btn primary" onclick="canDoReset()">Retry Reset</button>
                      <button class="can-back-btn" onclick="canViewLogs()">View Truck Logs</button>`;
                  }, 400);
                }
              }, 500 + i * 300);
            });
          }
        }, 300);
      }, 1200);
    }));
  }
}

function canFlipClose() {
  if (canRepopTimer) { clearTimeout(canRepopTimer); canRepopTimer = null; }
  canResetCount = 0;
  gFlipClose(canMountId(), { id:'canerrors', flipOpenFn: canFlipOpen, hintFn: canInjectFlipHint, store:'_canCardInst' });
}

function canViewLogs() {
  canFlipClose();
  setTimeout(() => {
    const t = document.querySelector('.dt-tab[data-tab="logs"]');
    if (t && typeof dtDrawerTab === 'function') dtDrawerTab('logs', t);
  }, 500);
}

/* Called from CardInstance.resolveCard — flip open then immediately run reset */
function canAfterReset() {
  canResetCount = 0;
  const mountId = canMountId();

  const backHTML = `
    <div class="can-back-progress" id="can-back-progress"><div class="can-back-progress-fill" id="can-back-progress-fill"></div></div>
    <div class="can-back-hdr">
      <span class="can-back-title">CAN Errors</span>
      <span class="can-back-badge cleared" id="can-back-badge">Resetting…</span>
      <button class="can-back-close" onclick="canFlipClose()">${CLOSE_BTN_SVG}</button>
    </div>
    <div class="can-back-list" id="can-back-list"></div>
    <div class="can-back-ftr" id="can-back-ftr" style="opacity:0;pointer-events:none;"></div>`;

  gFlipOpen(mountId, backHTML, () => {
    /* Go straight to reset — skip view-errors step */
    canDoReset();
  });
}
function canInjectFlipHint(mountEl, openFn) {
  const card = mountEl.querySelector('.mc-card');
  if (!card || card.querySelector('.can-flip-hint')) return;
  const fn = openFn || canFlipOpen;
  const btn = document.createElement('button');
  btn.className = 'can-flip-hint';
  btn.title = 'Tap to view';
  btn.addEventListener('click', function(e) { e.stopPropagation(); fn(); });
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 23L3 19L7 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 13V15C21 16.0609 20.5786 17.0783 19.8284 17.8284C19.0783 18.5786 18.0609 19 17 19H3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 1L21 5L17 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 11V9C3 7.93913 3.42143 6.92172 4.17157 6.17157C4.92172 5.42143 5.93913 5 7 5H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  card.appendChild(btn);
}


/* Close tickets cols popover on outside click */
document.addEventListener('click', function(e) {
  const pop = document.getElementById('tk-cols-popover');
  if (pop && pop.classList.contains('open') && !e.target.closest('#tk-cols-popover') && !e.target.closest('#tk-cols-btn'))
    pop.classList.remove('open');
});

/* ============================================================================
   TICKETS PAGE
============================================================================ */

const TK_PHASES = {
  'Waiting to Load': { bg:'#644325', label:'Waiting to load' },
  'Loading':         { bg:'#9a1f1e', label:'Loading' },
  'Loaded':          { bg:'#887f13', label:'Loaded' },
  'In Transit':      { bg:'#1e6252', label:'To job' },
  'On Site':         { bg:'#872781', label:'On site' },
  'Pouring':         { bg:'#101010', label:'Pouring' },
  'Ignition Off':    { bg:'#525252', label:'Ignition off' },
  'Washing':         { bg:'#126886', label:'Washing' },
  'Return to Plant': { bg:'#9c0f5a', label:'Return to plant' },
};

const TK_COL_DEFS = [
  { id:'truck',    label:'Truck',           hidden:false, locked:true },
  { id:'phase',    label:'Phase',           hidden:false },
  { id:'ticket',   label:'Ticket',          hidden:false },
  { id:'customer', label:'Customer',        hidden:false },
  { id:'alerts',   label:'Active Alerts',   hidden:false },
  { id:'order',    label:'Order',           hidden:false },
  { id:'location', label:'Location',        hidden:false },
  { id:'date',     label:'Date & Time',     hidden:false },
  { id:'mix',      label:'Mix Code',        hidden:false },
  { id:'size',     label:'Size',            hidden:false },
  { id:'slump',    label:'Ticketed Slump',  hidden:false },
];
let tkColState = TK_COL_DEFS.map(c => ({...c}));

const TK_DATA = [
  { truck:'45689', ticket:'TKT-10482', phase:'Pouring',         customer:'Cemex AZ', order:'ORD-8841', mix:'MC-4000', location:'Phoenix Central', date:'Today, 8:14 AM', size:'8 yd³', alerts:1, plant:'Plant 1', driver:'R. Martinez', slump:'4.5 in', water:'22 gal', temp:'78°F' },
  { truck:'12457', ticket:'TKT-10481', phase:'On Site',         customer:'Cemex AZ', order:'ORD-8841', mix:'MC-4000', location:'Phoenix Central', date:'Today, 8:02 AM', size:'10 yd³', alerts:2, plant:'Plant 1', driver:'D. Ochoa',    slump:'4.0 in', water:'20 gal', temp:'76°F' },
  { truck:'33201', ticket:'TKT-10480', phase:'In Transit',      customer:'Cemex AZ', order:'ORD-8839', mix:'MC-3500', location:'Mesa Eastside',   date:'Today, 7:55 AM', size:'9 yd³',  alerts:0, plant:'Plant 2', driver:'J. Torres',   slump:'3.5 in', water:'18 gal', temp:'75°F' },
  { truck:'77840', ticket:'TKT-10479', phase:'Loaded',          customer:'Vulcan AZ', order:'ORD-8838', mix:'MC-5000', location:'Scottsdale N',  date:'Today, 7:48 AM', size:'7 yd³',  alerts:0, plant:'Plant 3', driver:'A. Reyes',    slump:'5.0 in', water:'24 gal', temp:'74°F' },
  { truck:'55120', ticket:'TKT-10478', phase:'Loading',         customer:'Vulcan AZ', order:'ORD-8838', mix:'MC-5000', location:'Scottsdale N',  date:'Today, 7:40 AM', size:'10 yd³', alerts:1, plant:'Plant 3', driver:'M. Fuentes',  slump:'—',      water:'—',      temp:'72°F' },
  { truck:'98302', ticket:'TKT-10477', phase:'Return to Plant', customer:'Cemex AZ', order:'ORD-8835', mix:'MC-3000', location:'Phoenix Central', date:'Today, 7:22 AM', size:'8 yd³',  alerts:0, plant:'Plant 1', driver:'C. Gomez',    slump:'3.0 in', water:'16 gal', temp:'71°F' },
  { truck:'14520', ticket:'TKT-10476', phase:'Pouring',         customer:'Cemex AZ', order:'ORD-8833', mix:'MC-4500', location:'Tempe South',    date:'Today, 7:10 AM', size:'9 yd³',  alerts:0, plant:'Plant 2', driver:'F. Herrera',  slump:'4.5 in', water:'22 gal', temp:'70°F' },
  { truck:'66478', ticket:'TKT-10475', phase:'On Site',         customer:'Cemex AZ', order:'ORD-8833', mix:'MC-4500', location:'Tempe South',    date:'Today, 6:58 AM', size:'8 yd³',  alerts:1, plant:'Plant 2', driver:'L. Vargas',   slump:'4.0 in', water:'20 gal', temp:'69°F' },
  { truck:'22190', ticket:'TKT-10474', phase:'In Transit',      customer:'Vulcan AZ', order:'ORD-8830', mix:'MC-3500', location:'Gilbert SW',    date:'Today, 6:45 AM', size:'10 yd³', alerts:0, plant:'Plant 4', driver:'P. Sanchez',  slump:'3.5 in', water:'18 gal', temp:'68°F' },
  { truck:'40031', ticket:'TKT-10473', phase:'Return to Plant', customer:'Vulcan AZ', order:'ORD-8828', mix:'MC-3000', location:'Gilbert SW',    date:'Today, 6:30 AM', size:'7 yd³',  alerts:0, plant:'Plant 4', driver:'R. Cruz',     slump:'3.0 in', water:'16 gal', temp:'67°F' },
  { truck:'51204', ticket:'TKT-10472', phase:'Pouring',         customer:'Cemex AZ', order:'ORD-8825', mix:'MC-4000', location:'Chandler E',     date:'Today, 6:18 AM', size:'9 yd³',  alerts:0, plant:'Plant 1', driver:'B. Lopez',    slump:'4.5 in', water:'22 gal', temp:'66°F' },
  { truck:'87655', ticket:'TKT-10471', phase:'Loaded',          customer:'Cemex AZ', order:'ORD-8825', mix:'MC-4000', location:'Chandler E',     date:'Today, 6:05 AM', size:'8 yd³',  alerts:1, plant:'Plant 1', driver:'G. Ramos',    slump:'—',      water:'—',      temp:'65°F' },
];

let tkCurrentIdx = -1;
let tkCurrentTicket = null;

function tkPhasePill(phase) {
  const p = TK_PHASES[phase] || { bg:'#525252', label:phase };
  return '<span class="tk-phase-pill" style="background:' + p.bg + '">' + p.label + '</span>';
}

function tkAlertBadge(n) {
  if (!n) return '<span style="color:var(--soft);font-size:13px;">—</span>';
  return '<span class="badge err"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="white" stroke-width="1"/><path d="M5 3v2.2M5 6.8h.01" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg>' + n + '</span>';
}

function tkColsToggle(e) {
  e.stopPropagation();
  const pop = document.getElementById('tk-cols-popover');
  const isOpen = pop.classList.contains('open');
  pop.classList.toggle('open', !isOpen);
  if (!isOpen) tkColsPopRefresh();
}

function tkColsPopRefresh() {
  const list = document.getElementById('tk-cols-pop-list');
  if (!list) return;
  list.innerHTML = tkColState.map(col =>
    '<div class="dt-cols-pop-row">' +
    '<button class="dt-cols-toggle ' + (col.hidden ? '' : 'on') + '" onclick="tkColToggle(\'' + col.id + '\',this)"' +
    (col.locked ? ' disabled style="opacity:0.4;cursor:default;"' : '') + '></button>' +
    '<span class="dt-cols-pop-label ' + (col.hidden ? 'hidden' : '') + '">' + col.label + '</span>' +
    '</div>'
  ).join('');
}

function tkColToggle(colId, btn) {
  const col = tkColState.find(c => c.id === colId);
  if (!col || col.locked) return;
  col.hidden = !col.hidden;
  btn.classList.toggle('on', !col.hidden);
  btn.nextElementSibling.classList.toggle('hidden', col.hidden);
  tkRebuildTable();
}

function tkColsReset() {
  tkColState = TK_COL_DEFS.map(c => ({...c}));
  tkColsPopRefresh();
  tkRebuildTable();
}

function tkRebuildTable() {
  const table = document.getElementById('tk-table');
  if (!table) return;
  const visible = tkColState.filter(c => !c.hidden);
  const thead = document.getElementById('tk-thead-row');
  if (thead) thead.innerHTML = visible.map(c => '<th>' + c.label + '</th>').join('');
  const q = (document.getElementById('tk-search-input')?.value || '').toLowerCase();
  const data = q ? TK_DATA.filter(t =>
    t.truck.includes(q) || t.ticket.toLowerCase().includes(q) ||
    t.customer.toLowerCase().includes(q) || t.order.toLowerCase().includes(q) ||
    t.mix.toLowerCase().includes(q) || t.location.toLowerCase().includes(q) ||
    t.phase.toLowerCase().includes(q)
  ) : TK_DATA;
  const cellMap = {
    truck:    t => '<td class="truck-link" onclick="event.stopPropagation();tkGoTruck(\'' + t.truck + '\')">' + t.truck + '</td>',
    ticket:   t => '<td style="color:var(--strong);font-weight:500;">' + t.ticket + '</td>',
    phase:    t => '<td>' + tkPhasePill(t.phase) + '</td>',
    customer: t => '<td>' + t.customer + '</td>',
    alerts:   t => '<td>' + tkAlertBadge(t.alerts) + '</td>',
    order:    t => '<td>' + t.order + '</td>',
    location: t => '<td>' + t.location + '</td>',
    date:     t => '<td style="color:var(--soft);font-size:13px;">' + t.date + '</td>',
    mix:      t => '<td>' + t.mix + '</td>',
    size:     t => '<td>' + t.size + '</td>',
    slump:    t => '<td>' + t.slump + '</td>',
  };
  const tbody = document.getElementById('tk-tbody');
  if (tbody) tbody.innerHTML = data.map((t) => {
    const idx = TK_DATA.indexOf(t);
    return '<tr onclick="tkOpenDrawer(' + idx + ')">' + visible.map(c => (cellMap[c.id] || (() => '<td></td>'))(t)).join('') + '</tr>';
  }).join('');
}

function tkSegSelect(el) {
  el.closest('.tk-seg').querySelectorAll('.tk-seg-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
}

function tkOpenDrawer(idx) {
  const t = TK_DATA[idx];
  if (!t) return;
  tkCurrentTicket = t;
  tkCurrentIdx = idx;
  document.getElementById('tk-drawer-id').textContent = 'Ticket: ' + t.ticket;
  const pill = document.getElementById('tk-drawer-phase-pill');
  if (pill) pill.innerHTML = tkPhasePill(t.phase);
  /* Build side panel */
  tkBuildSidePanel(t);
  /* Open on Status tab */
  const firstTab = document.querySelector('#dt-ticket-drawer .dt-drawer-tab[data-tab="status"]');
  if (firstTab) tkTab(firstTab, 'status');
  document.getElementById('dt-ticket-drawer').classList.add('open');
  document.getElementById('dt-ticket-scrim').classList.add('open');
}

function tkNavTicket(dir) {
  const next = tkCurrentIdx + dir;
  if (next >= 0 && next < TK_DATA.length) tkOpenDrawer(next);
}

function tkCloseDrawer() {
  senStop();
  document.getElementById('dt-ticket-drawer').classList.remove('open');
  document.getElementById('dt-ticket-scrim').classList.remove('open');
  tkCurrentTicket = null;
  tkCurrentIdx = -1;
}

function tkBuildSidePanel(t) {
  const side = document.getElementById('tk-side-body');
  if (!side) return;

  const chip = (icon, label, value, linked) =>
    '<div class="tk-summary-chip">' +
      '<div class="tk-chip-icon">' + icon + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
        '<div class="tk-chip-label">' + label + '</div>' +
        '<div class="tk-chip-value' + (linked ? ' linked' : '') + '"' + (linked ? ' onclick="' + linked + '"' : '') + '>' + value + '</div>' +
      '</div>' +
    '</div>';

  const iconOrder  = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.66675 1.83301H9.33374C9.55464 1.83309 9.7664 1.92094 9.92261 2.07715C10.0788 2.23335 10.1667 2.44512 10.1667 2.66602V3.16602H11.3337C11.7314 3.1661 12.1131 3.32424 12.3943 3.60547C12.6755 3.8867 12.8337 4.26831 12.8337 4.66602V12.666C12.8337 13.0637 12.6754 13.4453 12.3943 13.7266C12.1131 14.0078 11.7314 14.1659 11.3337 14.166H4.66675C4.26892 14.166 3.88751 14.0079 3.6062 13.7266C3.325 13.4453 3.16675 13.0638 3.16675 12.666V4.66602C3.16683 4.26831 3.32497 3.8867 3.6062 3.60547C3.88749 3.32427 4.269 3.16602 4.66675 3.16602H5.83374V2.66602C5.83383 2.44512 5.92168 2.23335 6.07788 2.07715C6.23415 1.92097 6.44581 1.83301 6.66675 1.83301ZM4.66675 3.5C4.35733 3.5 4.06034 3.623 3.84155 3.8418C3.62304 4.06048 3.49984 4.35687 3.49976 4.66602V12.666C3.49976 12.9754 3.62286 13.2724 3.84155 13.4912C4.06035 13.71 4.35733 13.833 4.66675 13.833H11.3337C11.643 13.8329 11.9393 13.7098 12.158 13.4912C12.3768 13.2724 12.4998 12.9754 12.4998 12.666V4.66602C12.4997 4.35671 12.3767 4.06051 12.158 3.8418C11.9392 3.62308 11.643 3.50009 11.3337 3.5H10.1667V4C10.1667 4.2209 10.0788 4.43266 9.92261 4.58887C9.7664 4.74507 9.55464 4.83292 9.33374 4.83301H6.66675C6.44581 4.83301 6.23415 4.74505 6.07788 4.58887C5.92168 4.43266 5.83383 4.2209 5.83374 4V3.5H4.66675ZM6.16675 4.5H9.83374V2.16602H6.16675V4.5Z" stroke="currentColor"/></svg>';
  const iconMix    = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h10v12H3z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M5 6h6M5 9h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
  const iconTruck  = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.5 11V9.5c0-.8.7-2 2-2.5l2-1V4c0-.8.8-1.5 2-1.5h1c1.2 0 2 .7 2 1.5v2l2 1c1.3.5 2 1.7 2 2.5V11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="4" cy="12.5" r="1.2" stroke="currentColor" stroke-width="1.3"/><circle cx="12" cy="12.5" r="1.2" stroke="currentColor" stroke-width="1.3"/></svg>';
  const iconDriver = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';

  const alertItem = (errType, label, desc, truckNum) => {
    const badge = errType === 'err'
      ? '<div style="width:20px;height:20px;border-radius:4px;background:#d70100;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="white" stroke-width="1"/><path d="M5 3v2.2M5 6.8h.01" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg></div>'
      : '<div style="width:20px;height:20px;border-radius:4px;background:rgba(250,30,30,0.23);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1.5L9.5 8.5H.5L5 1.5z" stroke="#d97706" stroke-width="1" stroke-linejoin="round"/><path d="M5 4.5v1.5M5 7.5h.01" stroke="#d97706" stroke-width="1" stroke-linecap="round"/></svg></div>';
    return '<div class="tk-alert-item">' +
      '<div class="tk-alert-item-hdr">' + badge + '<span class="tk-alert-label">' + label + '</span></div>' +
      '<div class="tk-alert-desc">' + desc + '</div>' +
      '<button class="tk-msg-btn">Message driver</button>' +
    '</div>';
  };

  side.innerHTML =
    /* Summary chips — 2 rows of 2, icon + bold label + underlined value */
    '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;">' +
      '<div style="display:flex;gap:8px;">' +
        chip(iconOrder,  'Order number', t.order,  false) +
        chip(iconMix,    'Mix code',     t.mix,    false) +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        chip(iconTruck,  'Truck number', t.truck,  'tkGoTruck(\'' + t.truck + '\')') +
        chip(iconDriver, 'Driver',       t.driver, false) +
      '</div>' +
    '</div>' +

    /* KV table — two plain flex cols, no border box */
    '<div style="display:flex;margin-bottom:24px;">' +
      '<div style="flex:1;display:flex;flex-direction:column;">' +
        '<div class="tk-kv-key">Load size</div>' +
        '<div class="tk-kv-key">Mix code instruction</div>' +
        '<div class="tk-kv-key">Customer</div>' +
        '<div class="tk-kv-key">Current location</div>' +
        '<div class="tk-kv-key">Destination</div>' +
      '</div>' +
      '<div style="flex:1;display:flex;flex-direction:column;">' +
        '<div class="tk-kv-val">' + t.size + '</div>' +
        '<div class="tk-kv-val">Manage to Allowable Water</div>' +
        '<div class="tk-kv-val">' + t.customer + '</div>' +
        '<div class="tk-kv-val">' + t.location + '</div>' +
        '<div class="tk-kv-val">' + t.plant + '</div>' +
      '</div>' +
    '</div>' +

    /* Alerts card */
    '<div class="tk-alerts-card">' +
      '<div class="tk-alerts-title">Alerts</div>' +
      (t.alerts > 0
        ? alertItem('err', 'Slump deviation: Above target', 'Consistent slump deviations above target for certain drivers.', t.truck)
          + alertItem('wrn', 'Driver exceeding time at plant', 'Truck ' + t.truck + ' has been at Lockhart for over 60 minutes.', t.truck)
        : '<div style="padding:0 16px 14px;font-size:13px;color:var(--soft);">No active alerts</div>'
      ) +
    '</div>';
}

/* Status tab — phase-grouped data table (Figma node 3121:21674) */
var tkStatusCollapsed = {};

function tkStatusToggleGroup(phase) {
  tkStatusCollapsed[phase] = !tkStatusCollapsed[phase];
  tkRenderStatus(tkCurrentTicket);
}

function tkSlumpBadge(val, target) {
  if (!val || val === '-') return '<span style="color:var(--soft);font-size:14px;">-</span>';
  var num = parseFloat(val);
  var tgt = parseFloat(target) || 4.0;
  var bad = Math.abs(num - tgt) > 1.5;
  if (bad) return '<span style="display:inline-flex;align-items:center;justify-content:center;background:#d70100;color:white;font-size:12px;letter-spacing:-0.24px;padding:2px 6px;border-radius:2px;white-space:nowrap;">' + val + '</span>';
  return '<span style="font-size:14px;color:var(--defined);">' + val + '</span>';
}

function tkRenderStatus(t) {
  const scroll = document.getElementById('tk-drawer-scroll');
  if (!scroll) return;

  const COLS = [
    { key:'date',    label:'Date & Time',   w:110 },
    { key:'status',  label:'Status',        w:90  },
    { key:'slump',   label:'Actual Slump',  w:110 },
    { key:'fluid',   label:'Fluid event',   w:90  },
    { key:'target',  label:'Target Slump',  w:100 },
    { key:'water',   label:'Water added',   w:100 },
    { key:'admix',   label:'Admix added',   w:100 },
    { key:'revs',    label:'Total revs',    w:90  },
    { key:'temp',    label:'Temp',          w:80  },
    { key:'size',    label:'Load size',     w:80  },
  ];

  /* Mock phase groups for this ticket */
  const PHASE_GROUPS = [
    { phase:'In Transit', elapsed:'24m 18s', rows:[
      { date:'1:16 PM', dateD:'07/23/2025', status:'Loading', slump:'9.75 in', fluid:'-', target:'8.00 in', water:'0.5 gal/yd³', admix:'-', revs:'-', temp:'100°F', size:'-' },
    ]},
    { phase:'Loaded', elapsed:'', rows:[
      { date:'1:16 PM', dateD:'07/23/2025', status:'Loading', slump:'9.75 in', fluid:'-', target:'8.00 in', water:'0.5 gal/yd³', admix:'-', revs:'-', temp:'100°F', size:'-' },
    ]},
    { phase:'Loading', elapsed:'', rows:[
      { date:'1:16 PM', dateD:'07/23/2025', status:'Loading', slump:'9.75 in', fluid:'-', target:'8.00 in', water:'0.5 gal/yd³', admix:'-', revs:'-', temp:'100°F', size:'-' },
      { date:'1:16 PM', dateD:'07/23/2025', status:'Loading', slump:'9.75 in', fluid:'-', target:'8.00 in', water:'0.5 gal/yd³', admix:'-', revs:'-', temp:'100°F', size:'-' },
    ]},
    { phase:'Waiting to Load', elapsed:'', rows:[
      { date:'1:16 PM', dateD:'07/23/2025', status:'Loading', slump:'9.75 in', fluid:'-', target:'8.00 in', water:'0.5 gal/yd³', admix:'-', revs:'-', temp:'100°F', size:'-' },
      { date:'1:16 PM', dateD:'07/23/2025', status:'Loading', slump:'9.75 in', fluid:'-', target:'8.00 in', water:'0.5 gal/yd³', admix:'-', revs:'-', temp:'100°F', size:'-' },
      { date:'1:16 PM', dateD:'07/23/2025', status:'Loading', slump:'9.75 in', fluid:'-', target:'8.00 in', water:'0.5 gal/yd³', admix:'-', revs:'-', temp:'100°F', size:'-' },
      { date:'1:16 PM', dateD:'07/23/2025', status:'Loading', slump:'9.75 in', fluid:'-', target:'8.00 in', water:'0.5 gal/yd³', admix:'-', revs:'-', temp:'100°F', size:'-' },
    ]},
  ];

  const cellStyle = 'display:flex;align-items:flex-start;padding:8px;height:46px;box-sizing:border-box;';

  function makeRow(row, alt) {
    const bg = alt ? 'background:var(--layer-2);' : '';
    return '<div style="display:flex;align-items:flex-start;padding-left:20px;' + bg + '">' +
      COLS.map(c => {
        let val = '';
        if (c.key === 'date') {
          val = '<div style="display:flex;flex-direction:column;justify-content:center;height:46px;">' +
            '<span style="font-size:14px;color:var(--defined);letter-spacing:-0.28px;line-height:1.3;">' + row.date + '</span>' +
            '<span style="font-size:14px;color:var(--soft);letter-spacing:-0.28px;line-height:1.3;">' + row.dateD + '</span>' +
          '</div>';
        } else if (c.key === 'slump') {
          val = '<div style="display:flex;align-items:center;height:46px;">' + tkSlumpBadge(row.slump, row.target) + '</div>';
        } else {
          var v = row[c.key] || '-';
          val = '<div style="display:flex;align-items:center;height:46px;font-size:14px;color:var(--defined);letter-spacing:-0.28px;">' + v + '</div>';
        }
        return '<div style="width:' + c.w + 'px;flex-shrink:0;padding:0 8px;">' + val + '</div>';
      }).join('') +
    '</div>';
  }

  const headerRow =
    '<div style="display:flex;align-items:center;padding-left:20px;position:sticky;top:0;background:var(--layer-1);z-index:2;border-bottom:1px solid var(--border);">' +
      COLS.map(c =>
        '<div style="width:' + c.w + 'px;flex-shrink:0;padding:8px;font-size:14px;font-weight:500;color:var(--strong);letter-spacing:-0.28px;white-space:nowrap;height:41px;display:flex;align-items:center;">' + c.label + '</div>'
      ).join('') +
    '</div>';

  const groups = PHASE_GROUPS.map(g => {
    const collapsed = tkStatusCollapsed[g.phase];
    const pill = tkPhasePill(g.phase);
    const phaseRow =
      '<div style="display:flex;align-items:center;gap:10px;padding:12px 20px;cursor:pointer;" onclick="tkStatusToggleGroup(\'' + g.phase.replace(/'/g,"\\'") + '\')">' +
        '<svg width="12" height="8" viewBox="0 0 12 8" fill="none" style="transition:transform 0.2s;transform:' + (collapsed ? 'rotate(-90deg)' : 'rotate(0deg)') + ';flex-shrink:0;"><path d="M1 1.5l5 5 5-5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>' +
        pill +
      '</div>';
    const rows = collapsed ? '' : g.rows.map((r, i) => makeRow(r, i % 2 === 1)).join('');
    return phaseRow + rows;
  }).join('');

  scroll.style.overflowX = 'auto';
  scroll.innerHTML =
    '<div style="min-width:1100px;">' +
      headerRow +
      groups +
    '</div>';
}

function tkTab(el, tab) {
  if (!el) return;
  const tabsEl = el.closest('.dt-drawer-tabs');
  if (tabsEl) tabsEl.querySelectorAll('.dt-drawer-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const scroll = document.getElementById('tk-drawer-scroll');
  if (!scroll) return;
  /* Reset scroll styles — each tab sets what it needs */
  scroll.style.cssText = 'flex:1;overflow-y:auto;';

  if (tab === 'status') {
    senStop();
    tkStatusCollapsed = {};
    tkRenderStatus(tkCurrentTicket);
  } else if (tab === 'messaging') {
    senStop();
    tkRenderMessaging(scroll);
  } else if (tab === 'charts') {
    senStop();
    senSelected.clear();
    senSelected.add('slump');
    senSelected.add('water');
    scroll.style.padding = '16px';
    scroll.innerHTML = tkBuildSensor();
    requestAnimationFrame(function() {
      dtSenRenderCards();
      if (!senAnimId) setTimeout(function(){ senTick(); }, 300);
    });
  } else {
    senStop();
    scroll.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--soft);font-size:14px;">' +
        tab.charAt(0).toUpperCase() + tab.slice(1).replace(/-/g,' ') + ' — coming soon' +
      '</div>';
  }
}


/* ── Text Messaging Tab ─────────────────────────────── */
var tkMsgHistory = [
  { type:'date', text:'November 18, 2026' },
  { type:'user', sender:'Emily Carter', text:'I need you to come back to the plant.', time:'03:36pm' },
  { type:'driver', sender:'John D Ramsey', text:'10-4, will do.', time:'03:45pm' },
  { type:'date', text:'November 21, 2026' },
  { type:'user', sender:'Emily Carter', text:'When you get back to the plant, can you wash out the truck? Let\'s talk after.', time:'04:02pm' },
  { type:'driver', sender:'John D Ramsey', text:'10-4, will do.', time:'04:12pm' },
];

var TK_QUICK_REPLIES = ['10-4', 'K', 'On my way', 'Give me 5 min', 'Almost there'];

function tkNow() {
  var d = new Date();
  var h = d.getHours(), m = d.getMinutes();
  var ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return h + ':' + (m < 10 ? '0'+m : m) + ampm;
}

function tkMsgBubble(msg) {
  if (msg.type === 'date') {
    return '<div class="tk-msg-date-divider">' + msg.text + '</div>';
  }
  if (msg.type === 'user') {
    return '<div class="tk-msg-row-user">' +
      '<div class="tk-msg-sender">' + msg.sender + '</div>' +
      '<div class="tk-msg-bubble-user">' + msg.text + '</div>' +
      '<div class="tk-msg-time">' + msg.time + '</div>' +
    '</div>';
  }
  if (msg.type === 'driver') {
    return '<div class="tk-msg-row-driver">' +
      '<div class="tk-msg-sender">' + msg.sender + '</div>' +
      '<div class="tk-msg-bubble-driver">' + msg.text + '</div>' +
      '<div class="tk-msg-time">' + msg.time + '</div>' +
    '</div>';
  }
  return '';
}

function tkMsgRender() {
  var scroll = document.getElementById('tk-msg-scroll');
  if (!scroll) return;
  scroll.innerHTML = tkMsgHistory.map(tkMsgBubble).join('');
  scroll.scrollTop = scroll.scrollHeight;
}


function tkMsgSend() {
  var input = document.getElementById('tk-msg-input');
  if (!input) return;
  var text = input.value.trim();
  if (!text) return;
  input.value = '';

  /* Add user message */
  tkMsgHistory.push({ type:'user', sender:'Emily Carter', text:text, time:tkNow() });
  var scroll = document.getElementById('tk-msg-scroll');
  if (!scroll) return;
  /* Remove old quick row if present */
  var qr = document.getElementById('tk-quick-row');
  if (qr) qr.remove();
  var el = document.createElement('div');
  el.innerHTML = tkMsgBubble(tkMsgHistory[tkMsgHistory.length-1]);
  scroll.appendChild(el.firstChild);
  scroll.scrollTop = scroll.scrollHeight;

  /* Show typing indicator then driver auto-replies */
  var typingEl = document.createElement('div');
  typingEl.className = 'tk-msg-row-driver';
  typingEl.id = 'tk-msg-typing';
  typingEl.innerHTML = '<div class="tk-msg-sender">' + (tkCurrentTicket ? tkCurrentTicket.driver : 'Driver') + '</div>' +
    '<div class="tk-msg-typing"><span></span><span></span><span></span></div>';
  scroll.appendChild(typingEl);
  scroll.scrollTop = scroll.scrollHeight;

  /* After 1.5s auto-send a driver response */
  setTimeout(function() {
    var typing = document.getElementById('tk-msg-typing');
    if (typing) typing.remove();
    var replies = ['10-4', 'K', 'On my way', 'Give me 5 min', 'Almost there', 'Roger that', 'Copy'];
    var reply = replies[Math.floor(Math.random() * replies.length)];
    var driver = tkCurrentTicket ? tkCurrentTicket.driver : 'Driver';
    tkMsgHistory.push({ type:'driver', sender:driver, text:reply, time:tkNow() });
    var el = document.createElement('div');
    el.innerHTML = tkMsgBubble(tkMsgHistory[tkMsgHistory.length-1]);
    scroll.appendChild(el.firstChild);
    scroll.scrollTop = scroll.scrollHeight;
  }, 1500);
}

function tkRenderMessaging(scroll) {
  scroll.style.padding = '0';
  scroll.style.overflow = 'hidden';
  scroll.style.display = 'flex';
  scroll.style.flexDirection = 'column';
  scroll.innerHTML =
    '<div class="tk-msg-wrap">' +
      '<div class="tk-msg-scroll" id="tk-msg-scroll"></div>' +
      '<div class="tk-msg-input-bar">' +
        '<div class="tk-msg-input-inner">' +
          '<input class="tk-msg-input-field" id="tk-msg-input" placeholder="Send a message..." ' +
            'onkeydown="if(event.key===\'Enter\')tkMsgSend()" />' +
          '<button class="tk-msg-send-btn" onclick="tkMsgSend()" title="Send">' +
            '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12.5 1.5L6.5 7.5M12.5 1.5L8.5 12.5L6.5 7.5L1.5 5.5L12.5 1.5Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  tkMsgRender();
}

function tkBuildSensor() {
  const chips = [
    { key:'slump',    label:'Slump',         },
    { key:'water',    label:'Water Add.',     },
    { key:'admix',    label:'Admix',          },
    { key:'revs',     label:'Total Revs',     },
    { key:'drum',     label:'Drum Speed',     },
    { key:'temp',     label:'Temperature',    },
  ];

  const chipsHtml = chips.map(c => {
    const isActive = senSelected.has(c.key);
    const cfg = SEN_CONFIGS[c.key];
    if (!cfg) return '';
    const val = `<span class="sen-chip-val" id="dt-sv-${c.key}">${cfg.liveBase.toFixed(cfg.liveDecimals)}<span class="sen-chip-unit"> ${cfg.liveUnit}</span></span>`;
    return `<div class="sen-chip${isActive ? ' active' : ''}" data-sensor="${c.key}" onclick="dtSenToggle(this)">
      <div class="sen-chip-label">${c.label}</div>
      ${val}
    </div>`;
  }).join('');

  return `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div id="dt-sen-chips" style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;">
        ${chipsHtml}
      </div>
      <div id="dt-sen-charts" style="display:grid;grid-template-columns:1fr;gap:12px;"></div>
    </div>`;
}

function tkGoTruck(truckNum) {
  tkCloseDrawer();
  setTimeout(() => {
    if (typeof dtNavGo === 'function') dtNavGo('trucks');
    if (typeof dtOpenTruck === 'function') setTimeout(() => dtOpenTruck(truckNum), 150);
  }, 100);
}

function tkInit() {
  tkColState = TK_COL_DEFS.map(c => ({...c}));
  tkRebuildTable();
  const sub = document.getElementById('tk-subtitle');
  if (sub) {
    const now = new Date();
    sub.textContent = 'Last updated: Today, ' + now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});
  }
}

/* Maps component card names → CC_TRUCKS component names */
const CC_NAME_MAP = {
  'DPS pressure':  'Charge',
  'CPS':           'Discharge',
  'WDS':           'WDS',
  'DRS':           'Drum',
  'ICD':           'Int. Display',
  'ED':            'Ext. Display',
  'CWR':           'CWR',
  'TCG':           'TCG',
  'Water Pump':    'Water Pump',
  'Admix Pump':    'Admix Pump',
  'IOX supply voltage': 'Bus Power',
};

/* ── Component fault/warning reason lookup ───────────────────────────────
   Returns a short, believable reason string for the bottom status strip.
   Groups: signal-based, power-based, mechanical.
   Trinity will replace this with real fault codes when available.        */
function coFaultReason(compName, state) {
  var ALARM_REASONS = {
    'WDS':                  'No signal',
    'CWR':                  'No signal',
    'TCG':                  'No signal',
    'ICD':                  'No connection',
    'ED':                   'No connection',
    'DPS pressure':         'Voltage fault',
    'CPS':                  'Voltage fault',
    'IOX supply voltage':   'Voltage fault',
    'Bus Power':            'Voltage fault',
    'DRS':                  'Out of range',
    'Water Pump':           'Out of range',
    'Admix Pump':           'Out of range',
    'Water meter flow rate':'Out of range',
    'Admix meter flow rate':'Out of range',
  };
  var WARN_REASONS = {
    'WDS':                  'Signal degraded',
    'CWR':                  'Signal degraded',
    'TCG':                  'Signal degraded',
    'ICD':                  'Signal degraded',
    'ED':                   'Signal degraded',
    'DPS pressure':         'Approaching limit',
    'CPS':                  'Approaching limit',
    'IOX supply voltage':   'Approaching limit',
    'Bus Power':            'Approaching limit',
    'DRS':                  'Approaching limit',
    'Water Pump':           'Approaching limit',
    'Admix Pump':           'Approaching limit',
    'Water meter flow rate':'Approaching limit',
    'Admix meter flow rate':'Approaching limit',
  };
  if (state === 'alarm') return ALARM_REASONS[compName] || 'Fault detected';
  if (state === 'warn')  return WARN_REASONS[compName]  || 'Out of range';
  return '';
}


/* Per-truck Admix flow rate (ml/s) — Good: 120-300, Warning: 80-119, Alert: <80 */
const ADMIX_MLS = {
  '45689': 165, '12457': 142, '39821':  88, '53127': 198, '61042': 155,
  '77391': 210, '67234': 178, '84760':  65, '98214': 190, '21348':  95,
  '33501': 230, '44892': 160, '55120': 175, '55667': 145, '66783': 220,
  '72914': 185, '81056': 155, '90237': 170, '30471': 195, '41852': 110,
  '52963': 240, '64074': 160, '75185': 215, '86296': 180, '97307': 155,
  '10841': 170, '21952': 200, '32063': 185, '43174': 145, '54285': 225,
  '65396': 160, '76407': 190, '87518': 155, '11223': 175, '22334': 200,
  '33445': 215, '44556': 185, '66778': 155, '77889': 170,
};

/* Per-truck Water Meter flow rate (gal/min) — Good: 16-20, Warning: 10-16, Alert: <10 */
const WATER_GPM = {
  '45689': 18, '12457': 17, '39821': 11, '53127': 19, '61042': 16,
  '77391': 20, '67234': 17, '84760':  8, '98214': 18, '21348': 15,
  '33501': 19, '44892': 16, '55120': 17, '55667': 18, '66783': 20,
  '72914': 19, '81056': 16, '90237': 17, '30471': 18, '41852': 12,
  '52963': 19, '64074': 17, '75185': 20, '86296': 18, '97307': 16,
  '10841': 17, '21952': 19, '32063': 18, '43174': 16, '54285': 20,
  '65396': 17, '76407': 19, '87518': 16, '11223': 18, '22334': 17,
  '33445': 20, '44556': 19, '66778': 16, '77889': 17,
};

/* Per-truck DRS RPM values — all within good range (2–18 RPM) */
const DRS_RPM = {
  '45689': 8,  '12457': 14, '39821': 6,  '53127': 11, '61042': 3,
  '77391': 16, '67234': 9,  '84760': 13, '98214': 5,  '21348': 17,
  '33501': 7,  '44892': 4,  '55120': 12, '55667': 10, '66783': 15,
  '72914': 6,  '81056': 8,  '90237': 11, '30471': 14, '41852': 7,
  '52963': 3,  '64074': 16, '75185': 9,  '86296': 13, '97307': 5,
  '10841': 18, '21952': 12, '32063': 6,  '43174': 15, '54285': 8,
  '65396': 11,
};

/* ── UNIFIED LOG DATA — single source of truth for mobile, tablet, desktop ── */
const TL_ROWS = [
  { id:0,  date:'02/17/2026', time:'04:14 PM', sentTime:'00:00', source:'TRUCK', type:'Event',              sub:'StartUp',                sev:'info'  },
  { id:1,  date:'02/17/2026', time:'03:49 PM', sentTime:'00:01', source:'TRUCK', type:'Event',              sub:'TicketReceived',          sev:'info'  },
  { id:2,  date:'02/18/2026', time:'09:30 AM', sentTime:'00:00', source:'TRUCK', type:'Identity',           sub:'Identity',               sev:'info'  },
  { id:3,  date:'02/18/2026', time:'11:00 AM', sentTime:'00:01', source:'TRUCK', type:'Event',              sub:'TruckHealth',            sev:'warn'  },
  { id:4,  date:'02/19/2026', time:'02:15 PM', sentTime:'00:00', source:'TRUCK', type:'Event',              sub:'FluidError',             sev:'warn'  },
  { id:5,  date:'02/19/2026', time:'03:00 PM', sentTime:'00:01', source:'TRUCK', type:'Event',              sub:'IgnitionChange',         sev:'info'  },
  { id:6,  date:'02/20/2026', time:'10:00 AM', sentTime:'00:00', source:'TRUCK', type:'Event',              sub:'GPSLocation',            sev:'info'  },
  { id:7,  date:'02/20/2026', time:'01:45 PM', sentTime:'00:01', source:'TRUCK', type:'Event',              sub:'FluidAdd',               sev:'warn'  },
  { id:8,  date:'02/21/2026', time:'04:30 PM', sentTime:'00:00', source:'TRUCK', type:'Event',              sub:'ConcreteStatus',         sev:'info'  },
  { id:9,  date:'02/21/2026', time:'05:15 PM', sentTime:'00:01', source:'TRUCK', type:'Event',              sub:'DriverAction',           sev:'info'  },
  { id:10, date:'02/22/2026', time:'09:00 AM', sentTime:'00:00', source:'TRUCK', type:'Event',              sub:'OperatingMode',          sev:'info'  },
  { id:11, date:'02/22/2026', time:'12:00 PM', sentTime:'00:01', source:'TRUCK', type:'BackendRequest',     sub:'ALL_PLANTS_GEOFENCES',   sev:'info'  },
  { id:12, date:'02/23/2026', time:'08:30 AM', sentTime:'00:00', source:'TRUCK', type:'DeviceBinding',      sub:'DeviceBinding',          sev:'info'  },
  { id:13, date:'02/23/2026', time:'02:30 PM', sentTime:'00:01', source:'TRUCK', type:'Event',              sub:'CalculatedArriveSite',   sev:'info'  },
  { id:14, date:'02/24/2026', time:'03:00 PM', sentTime:'00:00', source:'TRUCK', type:'Event',              sub:'TruckHealth',            sev:'info'  },
  { id:15, date:'03/23/2026', time:'08:24 AM', sentTime:'00:01', source:'TRUCK', type:'Event',              sub:'TruckHealth',            sev:'alarm' },
  { id:16, date:'03/23/2026', time:'10:42 AM', sentTime:'00:00', source:'TRUCK', type:'Event',              sub:'FluidDoseSummary',       sev:'info'  },
  { id:17, date:'03/23/2026', time:'11:30 AM', sentTime:'00:01', source:'TRUCK', type:'Event',              sub:'SpeedChangeData',        sev:'info'  },
  { id:18, date:'03/24/2026', time:'08:40 AM', sentTime:'00:00', source:'TRUCK', type:'Event',              sub:'Shutdown',               sev:'info'  },
  { id:19, date:'03/24/2026', time:'09:12 AM', sentTime:'00:00', source:'TRUCK', type:'BackendRequest',     sub:'ALL_PLANTS_GEOFENCES',   sev:'info'  },
  { id:20, date:'03/24/2026', time:'09:45 AM', sentTime:'00:00', source:'TRUCK', type:'DeviceBinding',      sub:'DrumSensor',             sev:'info'  },
  { id:21, date:'03/24/2026', time:'10:03 AM', sentTime:'00:00', source:'TRUCK', type:'WirelessDrumBinding',sub:'UnboundTC3Notification', sev:'warn'  },
  { id:22, date:'03/24/2026', time:'10:31 AM', sentTime:'00:00', source:'TRUCK', type:'Event',              sub:'ConcreteStatus',         sev:'info'  },
  { id:23, date:'03/25/2026', time:'07:15 AM', sentTime:'00:00', source:'TRUCK', type:'DeviceBinding',      sub:'WaterModule',            sev:'info'  },
  { id:24, date:'03/25/2026', time:'08:00 AM', sentTime:'00:01', source:'TRUCK', type:'BackendRequest',     sub:'WEATHER',                sev:'info'  },
  { id:25, date:'03/25/2026', time:'09:30 AM', sentTime:'00:00', source:'TRUCK', type:'Event',              sub:'SystemStatus',           sev:'info'  },
  { id:26, date:'03/26/2026', time:'11:22 AM', sentTime:'00:00', source:'TRUCK', type:'Event',              sub:'SystemStatus',           sev:'warn'  },
];

/* Alias used by mobile and tablet code that references `logs` by name */
const logs = TL_ROWS;

/* ── PAYLOADS — real JSON keyed by row id ── */
const TL_PAYLOADS = {
  26: { message_type:'Event', time:{seconds:1781111769,microseconds:882283}, sender_mac_id:'125765154369', accountId:'26', truckId:'7876', truckName:'2084', event:{ event_type:'SystemStatus', lastLoadingTime:{seconds:0,microseconds:0}, location:{status:'VALID',latitude:21.37427583,longitude:-157.90896283}, lastLoadingLocationId:'-1', locationStatus:{}, system_status:{ timeBootSeconds:1781111006.03, ignitionOnEventCount:1, sensorPowerOnCount:1, wifiSNR:0, pressureCharge:{alive:true,lastContactSeconds:1781111769.83,errorMessageReceived:true,lastErrorCondition:33024,startupMessageCount:1,errorMessageCount:174}, pressureDischarge:{alive:true,lastContactSeconds:1781111769.83,errorMessageReceived:true,lastErrorCondition:33024,startupMessageCount:1,errorMessageCount:139}, iox:{alive:true,lastContactSeconds:1781111769.28,errorMessageReceived:true,lastErrorCondition:33024,startupMessageCount:1,errorMessageCount:44,temperatureCelsius:35,supplyVoltage:13.84}, wiredDrum:{alive:true,lastContactSeconds:1781111769.17,startupMessageCount:1,version:304}, externalDisplay:{alive:true,lastContactSeconds:1781111769.20,startupMessageCount:1,version:8195}, powerModule:{alive:false}, wirelessDrum:{alive:false}, inCabDisplay:{alive:true,lastContactSeconds:1781111768.90,startupMessageCount:1,version:1468}, cwr:{alive:true,lastContactSeconds:1781111766.88,startupMessageCount:1,temperatureCelsius:45.23,microS08:{versionMajor:35,versionMinor:0}}, jacketHeater:{alive:false}, fdmHeater:{alive:false}, ignition:true, sensorPower:true, ghostMode:false, offMode:false, operatingMode:{mode:'LIVE',localMode:'DRIVER_ON',coldWeatherMode:'COLD_WEATHER_OFF',fdmMode:'FDM_V3_IOX'}, vnextSensorBoard:{alive:false}, vnextAdmixBoard:{alive:false}, vnextWaterBoard:{alive:false}, roboteq:{alive:false} } } },
  23: { message_type:'DeviceBinding', time:{seconds:1781010299,microseconds:725705}, sender_mac_id:'125765210720', accountId:'24', truckId:'11531', truckName:'1838', pbversion:4, device_binding:{ bindingType:'Seen', deviceType:'WaterModule', signalStrength:'-62', macId:'141704516048573' } },
  25: { message_type:'Event', time:{seconds:1781010492,microseconds:231872}, sender_mac_id:'125765273411', accountId:'24', truckId:'13024', truckName:'2550', pbversion:4, event:{ event_type:'SystemStatus', lastLoadingTime:{seconds:1781008749,microseconds:707052}, location:{status:'VALID',latitude:25.79684033,longitude:-80.36183233}, lastLoadingLocationId:'625', locationStatus:{status:'PLANT_OUTSIDE_FENCE',locationId:'625',locationName:''}, system_status:{ timeBootSeconds:1780983404.03, ignitionOnEventCount:1, sensorPowerOnCount:1, wifiSNR:0, pressureCharge:{alive:true,lastContactSeconds:1781010492.04}, pressureDischarge:{alive:true,lastContactSeconds:1781010492.04}, iox:{alive:false}, wiredDrum:{alive:false}, externalDisplay:{alive:true,lastContactSeconds:1781010491.24,startupMessageCount:1,version:8195}, powerModule:{alive:false}, wirelessDrum:{alive:true,lastContactSeconds:1781010490.63,batteryVoltage:3.51,temperatureCelsius:32.74}, inCabDisplay:{alive:true,lastContactSeconds:1781010490.49,startupMessageCount:1,version:1468}, cwr:{alive:true,lastContactSeconds:1781010490.55,startupMessageCount:1,temperatureCelsius:0,microS08:{versionMajor:44,versionMinor:0}}, jacketHeater:{alive:false}, fdmHeater:{alive:false}, ignition:true, sensorPower:true, ghostMode:false, offMode:false, operatingMode:{mode:'LIVE',localMode:'DRIVER_ON',coldWeatherMode:'COLD_WEATHER_OFF',fdmMode:'FDM_VNEXT'}, vnextSensorBoard:{alive:true,lastContactSeconds:1781010491.65,version:44,hardwareVersion:129}, vnextSensorBoardDevices:{pressureCharge:{pressurePascal:6560800.5},pressureDischarge:{pressurePascal:1801910},can1:{voltageV:11.95},can2:{voltageV:11.86},battPowerVoltage:{voltageV:13.37}}, vnextAdmixBoard:{alive:false}, vnextWaterBoard:{alive:true,lastContactSeconds:1781010491.78,version:23,hardwareVersion:6}, vnextWaterBoardDevices:{flowMeter:{pulseCount:30849},ambientTemp:{temperatureCelsius:53.9},battPowerVoltage:{voltageV:1.02}}, kzValveVnextAir:{alive:true,lastContactSeconds:1781010491.44,valveRequiredPositionDegrees:180,valveReportedPositionDegrees:179}, kzValveVnextTemperateWaterMain:{alive:true,lastContactSeconds:1781010491.30,valveRequiredPositionDegrees:0,valveReportedPositionDegrees:0} } } },
  14: { message_type:'Event', time:{seconds:1781009702,microseconds:167380}, sender_mac_id:'125765276177', accountId:'83', truckId:'10258', truckName:'75523', pbversion:4, event:{ event_type:'TruckHealth', lastLoadingTime:{seconds:1781005150,microseconds:537372}, location:{status:'VALID',latitude:29.103703,longitude:-82.19526467}, lastLoadingLocationId:'1137', locationStatus:{status:'PLANT_OUTSIDE_FENCE',locationId:'1137',locationName:''}, truck_health:{ eventType:'RPM_DECREASE_SLUMP_INCREASE' } } },
  4:  { message_type:'Event', time:{seconds:1781009416,microseconds:933583}, sender_mac_id:'125765146235', accountId:'83', truckId:'10187', truckName:'70147', pbversion:4, event:{ event_type:'FluidError', lastLoadingTime:{seconds:1781003259,microseconds:277103}, location:{status:'VALID',latitude:28.66199783,longitude:-81.53805617}, lastLoadingLocationId:'1133', locationStatus:{status:'PLANT_OUTSIDE_FENCE',locationId:'1133',locationName:''}, fluid_error:{ error:'FDM_ERROR', fluid:'WATER' } } },
  2:  { message_type:'Identity', time:{seconds:1781009455,microseconds:340280}, sender_mac_id:'125765292552', accountId:'83', truckId:'10090', truckName:'67038', pbversion:4, identity:{ macId:'125765292552', imsi:'310170877383180', serialNo:'220000519631', version:'26.2.3', commissioned:true, truckId:'67038', wirelessDrumSensorBound:true, wirelessDrumSensorMacId:'141704507334621', bspVersion:'1.01', deviceType:'TCG4', deviceVariant:'104400' } },
  0:  { message_type:'Event', time:{seconds:1781009405,microseconds:444636}, sender_mac_id:'125765292552', accountId:'83', truckId:'10090', truckName:'67038', pbversion:4, event:{ event_type:'Startup', lastLoadingTime:{seconds:0,microseconds:0}, location:{status:'INVALID'}, lastLoadingLocationId:'-1', locationStatus:{}, startup:{ previousShutdownType:'DIRTY' } } },
  18: { message_type:'Event', time:{seconds:1780988400,microseconds:0}, sender_mac_id:'125765292552', accountId:'83', truckId:'10090', truckName:'67038', pbversion:4, event:{ event_type:'Shutdown', lastLoadingTime:{seconds:1780985000}, location:{status:'VALID',latitude:29.175,longitude:-82.143}, lastLoadingLocationId:'1139', locationStatus:{status:'PLANT_OUTSIDE_FENCE'}, shutdown:{ shutdownType:'CLEAN' } } },
  1:  { message_type:'Event', time:{seconds:1781009629,microseconds:941719}, sender_mac_id:'125765259653', accountId:'83', truckId:'10163', truckName:'75527', pbversion:4, event:{ event_type:'TicketReceived', lastLoadingTime:{seconds:1781009473,microseconds:298053}, location:{status:'VALID',latitude:29.17227683,longitude:-82.14356583}, lastLoadingLocationId:'1139', locationStatus:{status:'UNKNOWN'}, ticket_received:{ receivedTicket:{ loadSizeCubicMeters:7.646, dischargeSlumpMillimeters:127, batchSlumpMillimeters:127, transitSlumpMillimeters:127, minDischargeSlumpMillimeters:6.350013, maxDischargeSlumpMillimeters:254.0005, autoAddWater:true, maxWaterLitersPerCubicMeter:5.598, allowWaterBeyondMax:false, autoAddAdmix:false, admixName:'', mixRevsAfterLoading:70, postBatchAdditions:false, ticketType:'NORMAL', maxMinutesInPlant:12, displayTicketNumber:'41233410', verifiInstructionName:'Manage to Allowable Water', verifiInstructionId:'1030', batchAdjustmentFluids:'WATER_ONLY', allowDriverWaterAddsOnSite:true, doNotManageLoad:false, customerName:'MAXTER ENTERPRISES', customerAddress:'3171 NW 44TH AVE', driverId:'70724', driverCode:'Perez, Jonathan', plantId:'1277', plantName:'Dry', locationName:'Ocala', locationId:'1139', jobId:'976033', jobName:'LOADINGDOCK/WALL', orderNumber:'402', mixCodeName:'1595570', mixCodeId:'236232', accountName:'Cemex Orlando', azureTicketId:'45986252', slumpCurveName:'cis_wc50-55' } } } },
  9:  { message_type:'Event', time:{seconds:1780937807,microseconds:606967}, sender_mac_id:'125765259860', accountId:'83', truckId:'10153', truckName:'69703', pbversion:4, event:{ event_type:'DriverAction', lastLoadingTime:{seconds:1780924028,microseconds:933127}, location:{status:'VALID',latitude:29.20740583,longitude:-82.14746033}, lastLoadingLocationId:'1139', locationStatus:{status:'PLANT_OUTSIDE_FENCE',locationId:'1139',locationName:''}, driver_action:{ action:'DRIVER_REQUESTED_WATER', parameterRaw:3975 } } },
  8:  { message_type:'Event', time:{seconds:1780927836,microseconds:439050}, sender_mac_id:'125765259863', accountId:'83', truckId:'10113', truckName:'45689', pbversion:4, event:{ event_type:'ConcreteStatus', lastLoadingTime:{seconds:1780919183}, location:{status:'VALID',latitude:29.02696233,longitude:-82.23808433}, lastLoadingLocationId:'1137', locationStatus:{status:'PLANT_OUTSIDE_FENCE',locationId:'1137',locationName:''}, concrete_status:{ concreteStatus:'VALUE_CHANGED', targetSlumpMillimeters:127, slumpMillimeters:-1, targetMinDrumSpeedRpm:2, targetMaxDrumSpeedRpm:6, drumSpeedRpm:-1, cumulativeRevolutionsSinceLoad:0, remainingWaterLiters:0, slumpReason:'SLUMP_NOT_YET_VALID', estimatedWaterToSlumpLiters:-1, estimatedAdmixToSlumpMilliliters:-1, mixingRevolutionsSinceLoad:-1, agitationRevolutionsSinceLoad:-1, revolutionsDischargingMaterial:0, loadSizeCubicMeters:-1, chargePressurePascals:8980983, dischargePressurePascals:1419466, truckTiltDegrees:0.286, slumpIsStable:false, standardSlumpMm:-1, threeStageSlumpMm:-1, continuousSlumpMm:-1, ambientTempCelsius:59.78, probBuildup:0, loadedTriggeredFromBackend:true, probBadChargeSensor:0, probBadMagnet:0, chargePressureMax:9390000, chargePressureMin:8650000, dischargePressureMax:1450000, dischargePressureMin:1380000, instantaneousSlumpMm:-1, estimatedBuildupPounds:1037.19, deliveryState:'LOADED_STATE', deliveryPhase:'PHASE_ON_SITE', locationId:'1137', loadedTriggerStatus:'POST_TICKET_TIMEOUT_NOT_MANAGED', slumpDisplay:'NO_DISPLAY_SMALL_LOAD', totalWaterAddedLiters:83.12256, totalAdmixAddedMilliliters:0, totalWaterAddedLitersPerCubicMeter:10.871, active_load:true, azureTicketId:'45970263', ticketId:'-1', drumWaterAddedLiters:0 } } },
  22: { message_type:'Event', time:{seconds:1780927836,microseconds:818790}, sender_mac_id:'125765292548', accountId:'83', truckId:'10135', truckName:'45689', pbversion:4, event:{ event_type:'ConcreteStatus', lastLoadingTime:{seconds:1780918798}, location:{status:'VALID',latitude:28.615418,longitude:-80.8080995}, lastLoadingLocationId:'1480', locationStatus:{status:'PLANT_OUTSIDE_FENCE',locationId:'1480',locationName:''}, concrete_status:{ concreteStatus:'VALUE_CHANGED', targetSlumpMillimeters:-1, slumpMillimeters:448.01205, targetMinDrumSpeedRpm:2, targetMaxDrumSpeedRpm:6, drumSpeedRpm:2.3, cumulativeRevolutionsSinceLoad:988.93, remainingWaterLiters:0, concreteTempCelsius:31.32, slumpReason:'DRUM_NOT_IN_CHARGE', estimatedWaterToSlumpLiters:0, estimatedAdmixToSlumpMilliliters:0, mixingRevolutionsSinceLoad:798.68, agitationRevolutionsSinceLoad:189.83, revolutionsDischargingMaterial:16.67, loadSizeCubicMeters:0, chargePressurePascals:1795100, dischargePressurePascals:1526816, truckTiltDegrees:-2.364, slumpIsStable:false, standardSlumpMm:444.16, threeStageSlumpMm:469.37, continuousSlumpMm:472.43, ambientTempCelsius:56.47, probSlumpIncrease:1, probSlumpDecrease:0, probRpmIncrease:1, probRpmDecrease:0, probBuildup:0, loadedTriggeredFromBackend:false, probBadChargeSensor:0, probBadMagnet:1, chargePressureMax:2980000, chargePressureMin:1370000, dischargePressureMax:2740000, dischargePressureMin:1290000, instantaneousSlumpMm:619.54, estimatedBuildupPounds:1731.95, slumpNormPressurePascals:556000, slumpDrumSpeedRpm:13.3, cumulativeRevolutionsSinceLoaded:941.16, deliveryState:'IDLE', deliveryPhase:'PHASE_RETURN_TO_PLANT', locationId:'1480', loadedTriggerStatus:'SENSORS_MANAGED', slumpDisplay:'NO_DISPLAY_SMALL_LOAD', totalWaterAddedLiters:109.73, totalAdmixAddedMilliliters:0, totalWaterAddedLitersPerCubicMeter:13.67, active_load:false, azureTicketId:'45968508', ticketId:'-1', drumWaterAddedLiters:0, underAgitationRevolutionsSinceLoad:0.087, overMixingRevolutionsSinceLoad:0 } } },
  11: { message_type:'BackendRequest', time:{seconds:1780927500,microseconds:117652}, sender_mac_id:'125765276178', accountId:'83', truckId:'10206', truckName:'45689', pbversion:4, backend_request:{ requestType:'ALL_PLANTS_GEOFENCES', location:{status:'VALID',latitude:28.61317667,longitude:-81.43043633} } },
  19: { message_type:'BackendRequest', time:{seconds:1780927500,microseconds:117652}, sender_mac_id:'125765276178', accountId:'83', truckId:'10206', truckName:'45689', pbversion:4, backend_request:{ requestType:'ALL_PLANTS_GEOFENCES', location:{status:'VALID',latitude:28.61317667,longitude:-81.43043633} } },
  12: { message_type:'DeviceBinding', time:{seconds:1780927799,microseconds:247769}, sender_mac_id:'125765199888', accountId:'83', truckId:'10049', truckName:'45689', pbversion:4, device_binding:{ bindingType:'Seen', deviceType:'DrumSensor', signalStrength:'-84', macId:'141704494042636' } },
  20: { message_type:'DeviceBinding', time:{seconds:1780927799,microseconds:247769}, sender_mac_id:'125765199888', accountId:'83', truckId:'10049', truckName:'45689', pbversion:4, device_binding:{ bindingType:'Seen', deviceType:'DrumSensor', signalStrength:'-84', macId:'141704494042636' } },
  21: { message_type:'WirelessDrumBinding', time:{seconds:1780927346,microseconds:622410}, sender_mac_id:'125765370241', accountId:'83', truckId:'10257', truckName:'45689', wireless_drum_binding:{ wirelessDrumBindingType:'UnboundTC3Notification' } },
  7:  { message_type:'Event', time:{seconds:1777316790,microseconds:271117}, sender_mac_id:'125765200636', accountId:'83', truckId:'9171', truckName:'45689', pbversion:4, event:{ event_type:'FluidAdd', lastLoadingTime:{seconds:1777314613}, location:{status:'VALID',latitude:32.91751967,longitude:-111.51281633}, lastLoadingLocationId:'578', locationStatus:{status:'PLANT_OUTSIDE_FENCE',locationId:'578',locationName:''}, fluid_add:{ fluidAddEvent:'STEALTH_WATER_DETECTED', maxFluidReached:false, waterAddedLiters:67.247, admixAddedMilliliters:0, fluidFlowRateMillilitersPerSecond:-1, fluidRequestedLiters:0, waterAdaptationPercent:-1, admixAdaptationPercent:-1, startTime:{seconds:1777316697}, waterAddedLitersPerCubicMeter:8.795, admixAddedMillilitersPerCubicMeter:0 } } },
};

/* ── STATE ──────────────────────────────────────── */
let expanded = {};
let activeLogIdx = 0;
let activeTab = 'structured';

/* ── FILTER STATE (declared early — referenced by all render functions) ── */
const filterState = { ignition: new Set(), alerts: new Set(), plant: new Set(), version: new Set() };

/* ── TERRITORY SELECTOR STATE ── */
const ALL_ACCOUNTS = ['Cemex AZ', 'Vulcan AZ'];
const ACCOUNT_PLANTS = {
  'Cemex AZ':   ['Phoenix Central', 'Mesa South', 'Tempe East'],
  'Vulcan AZ':  ['Scottsdale North', 'Gilbert East'],
};
let selectedAccounts  = new Set(['Cemex AZ', 'Vulcan AZ']); /* all selected by default */
let selectedLocations = new Set(['Phoenix Central','Mesa South','Tempe East','Scottsdale North','Gilbert East']);

/* ── ACTIVE ACCOUNT (for drawer context + side nav) ── */
let activeAccount = 'Cemex AZ';

function filterMatch(t) {
  const { ignition, alerts, plant, version } = filterState;
  if (ignition.size > 0 && !ignition.has(t.ign)) return false;
  if (alerts.size > 0) {
    const _fa=getTruckAlerts(t.num);
    const hasErr  = _fa.err > 0;
    const hasWrn  = _fa.wrn > 0;
    const isClean = !hasErr && !hasWrn;
    const pass = (alerts.has('errors') && hasErr) ||
                 (alerts.has('warnings') && hasWrn) ||
                 (alerts.has('clean') && isClean);
    if (!pass) return false;
  }
  if (plant.size > 0 && !plant.has(t.plant)) return false;
  if (version.size > 0 && ![...version].some(v => t.ver.toLowerCase().startsWith(v.toLowerCase()))) return false;
  return true;
}

/* ── TRUCK LIST ─────────────────────────────────── */
function renderTrucks() {
  let html = '';
  let globalIdx = 0;
  let anyVisible = false;

  truckGroups.forEach((group, gi) => {
    /* Territory filter: skip group if account or plant not selected */
    if (!selectedAccounts.has(group.account)) {
      globalIdx += group.trucks.length;
      return;
    }
    if (!selectedLocations.has(group.label)) {
      globalIdx += group.trucks.length;
      return;
    }

    /* Count trucks with issues in this group that pass filters */
    const problemTrucks = group.trucks.filter(t =>
      !t.unlinked && (getTruckAlerts(t.num).err || getTruckAlerts(t.num).wrn) && filterMatch(t)
    );

    /* Hide entire group if no problem trucks — this is WTS logic */
    if (problemTrucks.length === 0) {
      globalIdx += group.trucks.length;
      return;
    }

    anyVisible = true;
    const isGroupOpen = group.open !== false;
    const isVulcan = group.account === 'Vulcan AZ';
    const acctBadge = isVulcan
      ? `<span style="font-size:10px;font-weight:500;background:rgba(255,186,13,0.15);color:#7a5800;border-radius:4px;padding:1px 5px;letter-spacing:-0.1px;flex-shrink:0;">${group.account}</span>`
      : '';

    html += `
      <div class="group-header" onclick="toggleGroup(${gi})">
        ${chevSvg(isGroupOpen ? 0 : 180)}
        <div class="group-badge">${problemTrucks.length}</div>
        <span class="group-label">${group.account} · ${group.label} — Uptime ${group.uptime}</span>
      </div>`;

    if (!isGroupOpen) {
      globalIdx += group.trucks.length;
      return;
    }

    group.trucks.forEach(t => {
      const i = globalIdx++;
      /* WHERE TO START: skip trucks with no alerts/warnings and skip unlinked trucks */
      if (t.unlinked || (!getTruckAlerts(t.num).err && !getTruckAlerts(t.num).wrn)) return;
      /* Apply active filters */
      if (!filterMatch(t)) return;
      const isOpen = !!expanded[i];
      const badges = [
        (()=>{const _a=getTruckAlerts(t.num);return _a.err>0?`<span class="badge err"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="white" stroke-width="1"/><path d="M5 3v2.2M5 6.8h.01" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg>${_a.err}</span>`:''})(),
        (()=>{const _a=getTruckAlerts(t.num);return _a.wrn>0?`<span class="badge wrn"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1.5L9.5 8.5H.5L5 1.5z" stroke="#36322d" stroke-width="1" stroke-linejoin="round"/><path d="M5 4.5v1.5M5 7.5h.01" stroke="#36322d" stroke-width="1" stroke-linecap="round"/></svg>${_a.wrn}</span>`:''})(),
      ].join('');
      const emptyAlert = (getTruckAlerts(t.num).err===0 && getTruckAlerts(t.num).wrn===0) ? `<span style="color:var(--soft);font-size:13px;">—</span>` : '';
      const rowBg = i%2===0 ? 'background:var(--layer-1)' : 'background:var(--layer-2)';

      const connIcon = t.conn === 'live'
        ? `<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="11.5" r="1" fill="#16a34a"/><path d="M5 9A3.5 3.5 0 017.5 8 3.5 3.5 0 0110 9" stroke="#16a34a" stroke-width="1.2" stroke-linecap="round"/><path d="M2.5 6.5A7 7 0 017.5 5a7 7 0 015 1.5" stroke="#16a34a" stroke-width="1.2" stroke-linecap="round"/></svg> Live`
        : `<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 2l11 11" stroke="#9ca3af" stroke-width="1.3" stroke-linecap="round"/><circle cx="7.5" cy="11.5" r="1" fill="#9ca3af"/><path d="M5 9A3.5 3.5 0 017.5 8 3.5 3.5 0 0110 9" stroke="#9ca3af" stroke-width="1.2" stroke-linecap="round"/></svg> <span style="color:var(--soft)">No connection</span>`;

      /* View Truck — show account switch confirmation if truck is from non-active account */
      const viewTruckAction = t.account !== activeAccount
        ? `showAccountSwitchConfirm('${t.account}', ${i}, 'wts')`
        : `openDrawerFromList('wts', ${i})`;

      const expHtml = isOpen ? `
        <div class="exp-wrap open" data-truck-idx="${i}">
          <div class="exp-row"><div class="exp-label">Account</div><div class="exp-val" style="font-weight:500;color:${t.account !== activeAccount ? '#7a5800' : 'var(--defined)'};">${t.account}</div></div>
          <div class="exp-row"><div class="exp-label">Source</div><div class="exp-val">${t.source}</div></div>
          <div class="exp-row"><div class="exp-label">TCG Version</div><div class="exp-val">${t.ver}</div></div>
          <div class="exp-row"><div class="exp-label">SW Compliant</div><div class="exp-val">${t.swCompliant !== false ? '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3.5 3.5 5.5-6" stroke="#16a34a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="#d70100" stroke-width="1.6" stroke-linecap="round"/></svg>'}</div></div>
          <div class="exp-row"><div class="exp-label">Plant</div><div class="exp-val">${t.plant}</div></div>
          <div class="exp-row"><div class="exp-label">Ignition</div><div class="exp-val">${t.ign} — ${t.ignDetail}</div></div>
          <div class="exp-row"><div class="exp-label">Impact</div><div class="exp-val">${t.impact}</div></div>
          <div class="exp-row"><div class="exp-label">Created</div><div class="exp-val">${t.age}</div></div>
          <div class="exp-row"><div class="exp-label">Connection</div><div class="exp-val" style="gap:5px;display:flex;align-items:center;">${connIcon}</div></div>
          <div class="exp-row"><div class="exp-label">Last Seen</div><div class="exp-val">${t.lastConn}</div></div>
          <button class="view-truck-btn" onclick="${viewTruckAction}">View Truck</button>
        </div>` : `<div class="exp-wrap"></div>`;

      html += `
        <div>
          <div class="truck-row" style="${rowBg}" onclick="toggleTruck(${i})">
            <div class="td truck-num">
              ${chevSvg(isOpen ? 180 : 90)}
              ${t.num}
            </div>
            <div class="td src-cell">${t.source === 'Customer Ticket' ? 'Customer' : 'System'}</div>
            <div class="td">${t.ign}</div>
            <div class="td age-cell">${t.age}</div>
            <div class="td">${badges}${emptyAlert}</div>
          </div>
          ${expHtml}
        </div>`;
    });
  });

  if (!anyVisible) {
    html = `<div style="padding:40px 24px;text-align:center;font-size:14px;color:var(--soft);letter-spacing:-0.28px;">No trucks with issues in your selected territory.</div>`;
  }

  document.getElementById('truck-list').innerHTML = html;
  const visibleCount = truckGroups.reduce((n, g) => {
    if (!selectedAccounts.has(g.account) || !selectedLocations.has(g.label)) return n;
    return n + g.trucks.filter(t => !t.unlinked && (getTruckAlerts(t.num).err || getTruckAlerts(t.num).wrn) && filterMatch(t)).length;
  }, 0);
  const subEl = document.getElementById('main-count-label');
  if (subEl) subEl.textContent = `All Trucks · ${visibleCount} truck${visibleCount !== 1 ? 's' : ''}`;
}

function toggleGroup(gi) {
  truckGroups[gi].open = truckGroups[gi].open === false ? true : false;
  renderTrucks();
}

function toggleTruck(i) {
  expanded[i] = !expanded[i];
  renderTrucks();
  /* if expanding, scroll so the full expanded row is visible */
  if (expanded[i]) {
    setTimeout(() => {
      const row = document.querySelector(`[data-truck-idx="${i}"]`);
      if (row) {
        const scrollBody = document.querySelector('#s-main .scroll-body');
        const rowBottom = row.getBoundingClientRect().bottom;
        const containerBottom = scrollBody.getBoundingClientRect().bottom;
        const gap = 10;
        if (rowBottom > containerBottom - gap) {
          scrollBody.scrollBy({ top: rowBottom - containerBottom + gap, behavior: 'smooth' });
        }
      }
    }, 50);
  }
}

/* ── OVERVIEW PAGE (flat list, different columns) ── */
const expandedOv = {};

function renderOverview() {
  let html = '';

  trucks.forEach((t, i) => {
    if (!filterMatch(t)) return;
    const isOpen = !!expandedOv[i];
    const rowBg = i % 2 === 0 ? '#ffffff' : '#f6f4f2';
    const badges = t.unlinked
      ? UNLINKED_TRUCK_PILL
      : (()=>{const _a=getTruckAlerts(t.num);return (_a.err?`<span class="badge err"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="white" stroke-width="1"/><path d="M5 3v2.2M5 6.8h.01" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg>${_a.err}</span>`:'') + (_a.wrn?`<span class="badge wrn"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1.5L9.5 8.5H.5L5 1.5z" stroke="#36322d" stroke-width="1" stroke-linejoin="round"/><path d="M5 4.5v1.5M5 7.5h.01" stroke="#36322d" stroke-width="1" stroke-linecap="round"/></svg>${_a.wrn}</span>`:'');})();

    const connectionVal = t.unlinked
      ? `<span class="ustatus ustatus-unlinked"><span class="ustatus-dot"></span>Unlinked Truck</span>`
      : (t.conn === 'live' ? 'Live' : 'No connection');

    const expHtml = isOpen ? `
      <div class="exp-wrap open" data-ov-idx="${i}" style="padding-bottom:15px;background:${rowBg};">
        <div class="exp-row"><div class="exp-label">Truck</div><div class="exp-val">${t.num}</div></div>
        <div class="exp-row"><div class="exp-label">Active Alerts</div><div class="exp-val">${getTruckAlerts(t.num).err || '0'}</div></div>
        <div class="exp-row"><div class="exp-label">Unit ID</div><div class="exp-val">${t.unitId}</div></div>
        <div class="exp-row"><div class="exp-label">TCG Version</div><div class="exp-val">${t.ver}</div></div>
        <div class="exp-row"><div class="exp-label">Ignition Status</div><div class="exp-val">${t.ign} — ${t.ignDetail}</div></div>
        <div class="exp-row"><div class="exp-label">Ready for Maint.</div><div class="exp-val">${t.readyMaint}</div></div>
        <div class="exp-row"><div class="exp-label">Plant</div><div class="exp-val">${t.plant}</div></div>
        <div class="exp-row"><div class="exp-label">Truck Mode</div><div class="exp-val">${t.truckMode}</div></div>
        <div class="exp-row"><div class="exp-label">Connection</div><div class="exp-val">${connectionVal}</div></div>
        <div class="exp-row"><div class="exp-label">Last Connection</div><div class="exp-val">${t.lastConn}</div></div>
        <button class="view-truck-btn" onclick="openDrawerFromList('overview', ${i})">View Truck</button>
      </div>` : '';

    html += `
      <div class="truck-wrap" style="background:${rowBg};">
        <div class="truck-row ov-row" onclick="toggleOv(${i})" style="grid-template-columns:74px 1fr 90px 82px;background:${rowBg};">
          <div class="td truck-num">
            ${chevSvg(isOpen ? 180 : 90)}
            ${t.num}
          </div>
          <div class="td" style="font-size:12px;line-height:1.25;">${t.plant}</div>
          <div class="td" style="font-size:13px;color:var(--strong);">${t.ign} · ${t.ignDetail}</div>
          <div class="td">${badges}</div>
        </div>
        ${expHtml}
      </div>`;
  });

  document.getElementById('truck-list-overview').innerHTML = html;
  const ovCount = trucks.filter(t => filterMatch(t)).length;
  const subElOv = document.getElementById('main-count-label');
  if (subElOv) subElOv.textContent = `All Trucks · ${ovCount} truck${ovCount !== 1 ? 's' : ''}`;
}

function toggleOv(i) {
  expandedOv[i] = !expandedOv[i];
  renderOverview();
  if (expandedOv[i]) {
    setTimeout(() => {
      const row = document.querySelector(`[data-ov-idx="${i}"]`);
      if (row) {
        const scrollBody = document.querySelector('#s-main .scroll-body');
        const rowBottom = row.getBoundingClientRect().bottom;
        const containerBottom = scrollBody.getBoundingClientRect().bottom;
        const gap = 10;
        if (rowBottom > containerBottom - gap) {
          scrollBody.scrollBy({ top: rowBottom - containerBottom + gap, behavior: 'smooth' });
        }
      }
    }, 50);
  }
}
/* rotate(0) = up (open group), rotate(180) = down (closed group), rotate(90) = right (collapsed truck row) */
const chevSvg = (deg) => `<svg width="10" height="6" viewBox="0 0 10 6" fill="none" style="transform:rotate(${deg}deg);flex-shrink:0;"><path d="M8.75 4.75L4.75 0.75L0.75 4.75" stroke="#36322D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
/* Track which list opened the drawer and position within it */
let drawerContext = { list: [], idx: 0 };

function openDrawer(i, context) {
  if (context) {
    drawerContext = context;
  } else if (drawerContext.list.length === 0) {
    /* fallback: treat trucks[] as the list */
    drawerContext = { list: trucks.map((_, n) => n), idx: i };
  } else {
    drawerContext.idx = drawerContext.list.indexOf(i);
  }
  updateArrows();
  const t = trucks[i];
  const truckNum = t.num;
  document.getElementById('drawer-truck-num').textContent = 'Truck: ' + truckNum;
  /* Populate Unit ID + TCG ID subtitle — look up the unit linked to this truck. */
  const unitForTruck = (typeof UNITS_DATA !== 'undefined')
    ? UNITS_DATA.find(u => String(u.truck) === String(truckNum))
    : null;
  /* Fallback — if no UNITS_DATA entry, use the unitId from the truck record */
  const truckRecord = trucks.find(t => String(t.num) === String(truckNum));
  const fallbackUnitId = truckRecord && truckRecord.unitId && truckRecord.unitId !== '--' ? truckRecord.unitId : null;
  const moUnitEl = document.getElementById('drawer-unit-id');
  const moTcgEl  = document.getElementById('drawer-tcg-id');
  const moCommEl = document.getElementById('mo-drawer-commissioned');
  if (moUnitEl) moUnitEl.textContent = unitForTruck ? unitForTruck.id : (fallbackUnitId || '—');
  if (moTcgEl)  moTcgEl.textContent  = (unitForTruck && unitForTruck.tgw && unitForTruck.tgw !== '--') ? unitForTruck.tgw : '—';
  if (moCommEl) moCommEl.textContent = (unitForTruck && unitForTruck.firstCommissioned) ? unitForTruck.firstCommissioned : '—';

  /* Hide all states first */
  document.getElementById('state-list').style.display       = 'none';
  document.getElementById('state-detail').style.display     = 'none';
  document.getElementById('state-components').style.display = 'none';
  document.getElementById('state-manual').style.display     = 'none';
  document.getElementById('state-timeline').style.display   = 'none';
  document.getElementById('state-config').style.display     = 'none';
  document.getElementById('state-sensor').style.display     = 'none';
  document.getElementById('state-unlinked').style.display   = 'none';

  if (t.unlinked) {
    /* Unlinked truck — show empty state, hide nav pill, update status pill */
    document.getElementById('state-unlinked').style.display = 'flex';
    document.querySelector('.d-nav-row').style.display = 'none';
    /* Update ignition pill to grey Not Connected */
    const ignPill = document.getElementById('mo-ign-pill');
    if (ignPill) ignPill.className = 'd-ign-pill off';
    document.getElementById('filters-pill').style.display = 'none';
    document.getElementById('ping-pill').style.display    = 'none';
    document.getElementById('update-pill').style.display  = 'none';
    /* Reset to Logs tab whenever drawer opens on an unlinked truck */
    switchUnlinkedTab('logs');
  } else {
    /* Normal connected truck */
    renderLogRows();
    document.getElementById('state-components').style.display = 'flex';
    renderMobileCards();
    document.querySelector('.d-nav-row').style.display = 'flex';
    document.getElementById('drawer-nav-label').textContent   = 'Components Overview';
    document.getElementById('filters-pill').style.display = 'none';
    document.getElementById('ping-pill').style.display    = 'flex';
    document.getElementById('update-pill').style.display  = 'none';
    /* Reset ignition pill to green */
    const ignPill = document.getElementById('mo-ign-pill');
    if (ignPill) ignPill.className = 'd-ign-pill';
    renderTimeline(truckNum);
  }

  document.getElementById('drawer').classList.add('open');
}

/* ════════════════════════════════════════════════════════════
   PING TRUCK ANIMATION — shared helper for mobile + desktop
   Three-phase: Pinging (request) → Receiving (shimmer + timestamps) →
   Connected (brief green flash) → Settled.

   We don't fabricate sensor values — the data is the same data, we just
   communicate that it WAS refreshed. Faking different numbers would create
   confusing prototypes. We DO refresh timestamps (Last Connect / Last
   System Status) since those genuinely move with each ping. */

function runPingAnimation(opts) {
  const {
    btnEl,                  // the Ping button to animate
    chipEl,                 // optional: connection/ignition chip to pulse
    refreshSelectors = [],  // CSS selectors of elements to apply shimmer to
    timestampIds   = [],    // element IDs whose textContent should refresh to "now"
    onComplete,             // optional callback after settle
  } = opts;
  if (!btnEl) return;

  // Capture original button content so we can restore it
  const origHTML = btnEl.innerHTML;

  // ── Phase 1: Pinging (0–700ms) ────────────────────────────
  btnEl.classList.add('pinging');
  btnEl.disabled = true;
  btnEl.innerHTML = `<span class="dt-ping-content">
    <span class="dt-ping-spinner"></span>
    <span>Pinging…</span>
  </span>`;
  if (chipEl) chipEl.classList.add('pinging');

  // ── Phase 2: Receiving (700–1500ms) ───────────────────────
  // Apply shimmer to data elements + refresh timestamps to "now".
  setTimeout(() => {
    refreshSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.classList.add('dt-refreshing');
        // Self-clean after the sweep finishes (matches CSS animation duration)
        setTimeout(() => el.classList.remove('dt-refreshing'), 950);
      });
    });
    // Refresh timestamps. Format like the existing dt-drawer last-conn cells:
    // "MMM D, YYYY, h:mm:ss A"
    if (timestampIds.length) {
      const now = new Date();
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const ts = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}, ` +
        `${((now.getHours() % 12) || 12)}:${String(now.getMinutes()).padStart(2,'0')}:` +
        `${String(now.getSeconds()).padStart(2,'0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
      timestampIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = ts;
      });
    }
  }, 700);

  // ── Phase 3: Connected (1500–2100ms) ──────────────────────
  setTimeout(() => {
    btnEl.classList.remove('pinging');
    btnEl.classList.add('pinged');
    btnEl.innerHTML = `<span class="dt-ping-content">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M3.5 8.5L6.5 11.5L12.5 5.5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Connected</span>
    </span>`;
    if (chipEl) chipEl.classList.remove('pinging');
  }, 1500);

  // ── Phase 4: Settle (2100ms+) ─────────────────────────────
  setTimeout(() => {
    btnEl.classList.remove('pinged');
    btnEl.disabled = false;
    btnEl.innerHTML = origHTML;
    if (typeof onComplete === 'function') onComplete();
  }, 2200);
}

/* Mobile entry point */
function pingTruck() {
  const btn = document.getElementById('ping-pill');
  if (!btn) return;
  // Mobile drawer's ignition chip is the live status badge in the chrome row
  const chip = document.querySelector('#drawer .d-ign-pill');
  runPingAnimation({
    btnEl: btn,
    chipEl: chip,
    // Refresh sensor cards in the components state, plus the meta info table
    refreshSelectors: [
      '#state-components .co-card',
      '#state-components .co-info-block',
    ],
    // Mobile doesn't expose the same timestamp IDs as desktop; the meta table
    // shimmer sells the "data refreshed" feel without needing the literal swap.
    timestampIds: [],
  });
}

/* Desktop entry point — wires the truck-drawer ping button.
   Refreshes the components-overview cards, the side panel chips, and the
   timestamp meta rows. */
function dtPingTruck() {
  const btn = document.getElementById('dt-drawer-ping-btn');
  if (!btn) return;
  const chip = document.getElementById('dt-drawer-ign-badge');
  runPingAnimation({
    btnEl: btn,
    chipEl: chip,
    refreshSelectors: [
      // Component cards in the overview tab
      '#dt-drawer-mcs-cards .dt-co-card',
      '#dt-drawer-fdm-cards .dt-co-card',
      // Side panel chips (Connectivity, Truck Mode)
      '.dt-drawer-side .dt-drawer-summary-row',
      // Side panel meta rows
      '.dt-drawer-side .dt-drawer-meta-row',
    ],
    // Last Connect / Last System Status / Last Reboot all move with each
    // successful ping — refresh them to "now".
    timestampIds: [
      'dt-drawer-last-conn',
      'dt-drawer-last-status',
      'dt-drawer-last-reboot',
    ],
  });
}

function closeDrawer() {
  const drawerEl = document.getElementById('drawer');
  drawerEl.classList.add('closing');
  drawerEl.classList.remove('open');
  setTimeout(() => drawerEl.classList.remove('closing'), 280);
  document.querySelector('.d-chrome').style.display = 'flex';
  document.querySelector('.d-nav-row').style.display = 'flex';
  /* Clean up unlink success state if present */
  const s = document.getElementById('state-unlink-success');
  if (s) s.remove();
  /* If drawer was opened from the mobile map page, restore Map active state in sidenav */
  if (window._drawerOpenedFromMap) {
    window._drawerOpenedFromMap = false;
    document.querySelectorAll('.sn-sub-item').forEach(function(i) { i.classList.remove('active'); });
    document.querySelectorAll('.sn-sub-item').forEach(function(i) {
      if (i.textContent.trim() === 'Map') i.classList.add('active');
    });
  }
}


let utabSelectedUnit = null;
let utabSearchQuery  = '';
let utabCurrentTruck = null;

function utabToggleNav() {
  const dd   = document.getElementById('utab-nav-dropdown');
  const chev = document.getElementById('utab-nav-chev');
  const open = dd.style.display === 'none';
  dd.style.display  = open ? 'block' : 'none';
  chev.style.transform = open ? 'rotate(180deg)' : '';
}

function switchUnlinkedTab(tab) {
  /* Close dropdown */
  const dd   = document.getElementById('utab-nav-dropdown');
  const chev = document.getElementById('utab-nav-chev');
  if (dd) dd.style.display = 'none';
  if (chev) chev.style.transform = '';

  /* Update pill label and checkmarks */
  const label = document.getElementById('utab-nav-label');
  const opts  = document.querySelectorAll('#utab-nav-dropdown .wts-option');
  opts.forEach(o => {
    o.classList.remove('wts-active');
    o.querySelector('.wts-check').style.visibility = 'hidden';
  });
  if (tab === 'logs') {
    if (label) label.textContent = 'Logs';
    if (opts[0]) { opts[0].classList.add('wts-active'); opts[0].querySelector('.wts-check').style.visibility = 'visible'; }
    document.getElementById('utab-logs-body').style.display   = 'flex';
    document.getElementById('utab-attach-body').style.display = 'none';
  } else {
    if (label) label.textContent = 'Attach to Unit';
    if (opts[1]) { opts[1].classList.add('wts-active'); opts[1].querySelector('.wts-check').style.visibility = 'visible'; }
    document.getElementById('utab-logs-body').style.display   = 'none';
    document.getElementById('utab-attach-body').style.display = 'flex';
    utabSelectedUnit = null;
    utabSearchQuery  = '';
    utabRenderUnits();
  }
}

function utabRenderUnits() {
  const q        = utabSearchQuery.toLowerCase();
  const unlinked = UNITS_DATA.filter(u => u.status === 'Unlinked Unit');
  const filtered = unlinked.filter(u =>
    !q || u.id.includes(q) || u.sysType.toLowerCase().includes(q) ||
    u.config.toLowerCase().includes(q)
  );

  const countEl = document.getElementById('utab-unit-count');
  if (countEl) countEl.textContent = `${unlinked.length} Unit${unlinked.length !== 1 ? 's' : ''} Unlinked`;

  const rows = filtered.map((u, i) => {
    const sel = utabSelectedUnit === u.id;
    /* Shorten config for narrow column */
    const configShort = u.config.length > 10 ? u.config.substring(0, 9) + '…' : u.config;
    /* Shorten commissioned year only */
    const year = u.firstCommissioned ? u.firstCommissioned.split('/')[2] || '--' : '--';
    return `
      <div onclick="utabSelectUnit('${u.id}')" style="
        display:grid;grid-template-columns:1fr 58px 80px 78px;
        min-height:50px;align-items:center;cursor:pointer;
        background:${sel ? 'rgba(48,105,227,0.06)' : i%2===0 ? 'var(--layer-1)' : 'var(--base)'};
        border-bottom:1px solid var(--border);
        border-left:${sel ? '3px solid var(--blue)' : '3px solid transparent'};
        -webkit-tap-highlight-color:transparent;
      ">
        <div style="padding:10px 8px 10px 11px;font-size:13px;color:var(--defined);letter-spacing:-0.2px;font-weight:${sel?'500':'400'};">${u.id}</div>
        <div style="padding:10px 6px;font-size:13px;color:var(--defined);letter-spacing:-0.2px;">${u.sysType}</div>
        <div style="padding:10px 6px;font-size:12px;color:var(--defined);letter-spacing:-0.2px;">${configShort}</div>
        <div style="padding:10px 8px;font-size:13px;color:var(--defined);letter-spacing:-0.2px;">${year}</div>
      </div>`;
  }).join('');

  const noResults = filtered.length === 0
    ? `<div style="padding:32px 16px;text-align:center;font-size:14px;color:var(--soft);">No unlinked units match your search.</div>` : '';

  document.getElementById('utab-unit-rows').innerHTML = rows + noResults;
  utabUpdateBtn();
}

function utabSelectUnit(id) {
  utabSelectedUnit = utabSelectedUnit === id ? null : id;
  utabRenderUnits();
}

function utabSearch() {
  utabSearchQuery = document.getElementById('utab-search').value.trim();
  utabRenderUnits();
}

function utabUpdateBtn() {
  const btn = document.getElementById('utab-attach-btn');
  if (!btn) return;
  const enabled = !!utabSelectedUnit;
  const dark = document.body.classList.contains('dark');
  btn.style.background    = enabled ? (dark ? '#e3f200' : 'var(--blue)') : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(54,50,45,0.15)');
  btn.style.color         = enabled ? (dark ? '#000000' : 'white') : 'var(--soft)';
  btn.style.cursor        = enabled ? 'pointer' : 'default';
  btn.style.pointerEvents = enabled ? 'auto' : 'none';
}

function utabConfirmAttach() {
  if (!utabSelectedUnit) return;
  const truckLabel = document.getElementById('drawer-truck-num');
  const truckId = truckLabel ? truckLabel.textContent.replace('Truck: ', '').trim() : '--';

  /* Look up the unit's TCG ID for the confirmation surface — Martin flagged
     this as the field FSTs need to verify before committing. */
  const unitObj = (typeof UNITS_DATA !== 'undefined') ? UNITS_DATA.find(u => u.id === utabSelectedUnit) : null;
  const tcgId = (unitObj && unitObj.tgw && unitObj.tgw !== '--') ? unitObj.tgw : '—';

  /* Show confirm overlay on the drawer */
  const existing = document.getElementById('utab-confirm-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.id = 'utab-confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-sheet">
      <div style="width:44px;height:44px;border-radius:50%;background:rgba(48,105,227,0.1);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10h12M10 4l6 6-6 6" stroke="#3069e3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="confirm-title">Attach Unit to Truck</div>
      <div style="background:var(--layer-2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin:8px 0 14px;display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;">
          <span style="color:var(--soft);letter-spacing:-0.26px;">Unit ID</span>
          <span style="color:var(--strong);font-family:'DM Mono',monospace;letter-spacing:0.2px;">${utabSelectedUnit}</span>
        </div>
        <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;">
          <span style="color:var(--soft);letter-spacing:-0.26px;">TCG ID</span>
          <span style="color:var(--strong);font-family:'DM Mono',monospace;letter-spacing:0.2px;">${tcgId}</span>
        </div>
        <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;">
          <span style="color:var(--soft);letter-spacing:-0.26px;">Truck</span>
          <span style="color:var(--strong);font-weight:500;letter-spacing:-0.26px;">${truckId}</span>
        </div>
      </div>
      <div class="confirm-btns">
        <button class="confirm-btn-primary" onclick="utabDoAttach('${utabSelectedUnit}','${truckId}')">Confirm Attachment</button>
        <button class="confirm-btn-cancel" onclick="document.getElementById('utab-confirm-overlay').remove()">Cancel</button>
      </div>
    </div>
  `;
  document.getElementById('drawer').appendChild(overlay);
}

function utabDoAttach(unitId, truckId) {
  const overlay = document.getElementById('utab-confirm-overlay');
  if (overlay) overlay.remove();

  const u = UNITS_DATA.find(u => u.id === unitId);
  if (!u) return;

  /* Mirror desktop dtTrAttachDo — set Pending, capture revert state */
  dtUdPendingPrevState = {
    unitId:        u.id,
    prevStatus:    u.status,
    prevTruck:     u.truck,
    prevAssigned:  u.assignedToTruck || null,
    truckSnapshot: (typeof UNLINKED_TRUCKS !== 'undefined')
      ? UNLINKED_TRUCKS.find(t => t.number === truckId)
      : null,
  };

  u.status          = 'Pending';
  u.truck           = truckId;
  u.assignedToTruck = new Date().toLocaleDateString('en-US', {month:'2-digit', day:'2-digit', year:'numeric'});

  /* Remove truck from unlinked pool while pending */
  const poolIdx = (typeof UNLINKED_TRUCKS !== 'undefined')
    ? UNLINKED_TRUCKS.findIndex(t => t.number === truckId) : -1;
  if (poolIdx > -1) UNLINKED_TRUCKS.splice(poolIdx, 1);

  if (typeof renderUnits === 'function') renderUnits();

  /* Close truck drawer, then open unit detail at Configuration tab.
     openUnitDetail detects status === 'Pending' and routes to config. */
  closeDrawer();
  setTimeout(function() {
    openUnits();
    setTimeout(function() { openUnitDetail(unitId); }, 150);
  }, 250);
}


function openDrawerFromList(source, truckIdx) {
  let list;
  if (source === 'wts') {
    /* Where to Start: only trucks with alerts/warnings, in trucks[] order */
    list = trucks.map((t, i) => { const _a=getTruckAlerts(t.num); return _a.err||_a.wrn ? i : -1; }).filter(n => n >= 0);
  } else {
    /* Overview: all trucks in order */
    list = trucks.map((_, i) => i);
  }
  const pos = list.indexOf(truckIdx);
  openDrawer(truckIdx, { list, idx: pos >= 0 ? pos : 0 });
}

function updateArrows() {
  const prev = document.getElementById('drawer-prev');
  const next = document.getElementById('drawer-next');
  if (!prev || !next) return;
  const atStart = drawerContext.idx <= 0;
  const atEnd   = drawerContext.idx >= drawerContext.list.length - 1;
  prev.style.opacity = atStart ? '0.3' : '1';
  prev.style.pointerEvents = atStart ? 'none' : 'auto';
  next.style.opacity = atEnd ? '0.3' : '1';
  next.style.pointerEvents = atEnd ? 'none' : 'auto';
}

/* ── LOG LIST ────────────────────────────────────── */
let mobLogSearchVal = '';
let mobLogActiveTypes = new Set();

function mobLogsFilter() {
  mobLogSearchVal = (document.getElementById('mob-log-search')?.value || '').toLowerCase();
  renderLogRows();
}

function mobLogsToggleFilter() {
  const panel = document.getElementById('mob-log-filter-panel');
  const btn   = document.getElementById('mob-log-filter-btn');
  if (!panel) return;
  const open = panel.style.display === 'flex';
  panel.style.display = open ? 'none' : 'flex';
  panel.style.flexDirection = 'column';
  if (!open) mobLogsRenderChips();
  btn.style.background = open ? 'var(--layer-1)' : 'var(--strong)';
  btn.style.color      = open ? 'var(--strong)'  : 'white';
}

function mobLogsRenderChips() {
  const types = [...new Set(logs.map(l => l.type))];
  const wrap  = document.getElementById('mob-log-type-chips');
  if (!wrap) return;
  wrap.innerHTML = types.map(type => {
    const active = mobLogActiveTypes.has(type);
    return `<button onclick="mobLogsToggleType('${type}')" id="mob-chip-${type.replace(/\s/g,'_')}"
      style="padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;font-family:var(--font);letter-spacing:-0.24px;cursor:pointer;border:1px solid ${active?'var(--blue)':'var(--border)'};background:${active?'var(--blue)':'var(--layer-1)'};color:${active?'white':'var(--strong)'};">
      ${type}
    </button>`;
  }).join('');
}

function mobLogsToggleType(type) {
  if (mobLogActiveTypes.has(type)) mobLogActiveTypes.delete(type);
  else mobLogActiveTypes.add(type);
  mobLogsRenderChips();
  renderLogRows();
}

function renderLogRows() {
  const query   = mobLogSearchVal;
  const filtered = logs.filter((l, i) => {
    if (mobLogActiveTypes.size > 0 && !mobLogActiveTypes.has(l.type)) return false;
    if (query && !`${l.date} ${l.time} ${l.type} ${l.sub}`.toLowerCase().includes(query)) return false;
    return true;
  });
  document.getElementById('log-scroll').innerHTML = filtered.length === 0
    ? `<div style="padding:32px 16px;text-align:center;font-size:13px;color:var(--soft);">No matching logs</div>`
    : filtered.map((l) => {
        const i = logs.indexOf(l);
        return `<div class="log-row" id="lr-${i}" onclick="openDetail(${i})"
             style="${i%2===0?'background:var(--layer-1)':'background:var(--layer-2)'}">
          <div class="log-td time"><span class="t-main">${l.date}</span><span class="t-sub">${l.time}</span></div>
          <div class="log-td">${l.type}</div>
          <div class="log-td">${l.sub}</div>
        </div>`;
      }).join('');
}

function showLogList() {
  document.getElementById('state-list').style.display = 'flex';
  document.getElementById('state-detail').style.display = 'none';
  document.querySelector('.d-chrome').style.display = 'flex';
  document.querySelector('.d-nav-row').style.display = 'flex';
}

/* ── LOG DETAIL ─────────────────────────────────── */
function openDetail(i) {
  document.querySelectorAll('.log-row').forEach(r => r.style.background = '');
  const row = document.getElementById('lr-'+i);
  if (row) row.style.background = 'rgba(48,105,227,0.07)';

  const logRow = TL_ROWS[i];
  if (logRow) {
    document.getElementById('det-title').textContent = logRow.sub + ' — ' + logRow.type;
    const meta = logRow.date + ' ' + logRow.time + ' · TRUCK';
    document.getElementById('det-meta').textContent = meta.length > 40 ? meta.substring(0, 38) + '...' : meta;
  }

  activeLogIdx = i;
  activeTab = 'structured';
  document.querySelectorAll('.det-tab').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.det-tab')[0].classList.add('on');
  renderDetailContent('structured');

  /* hide chrome + nav, show detail */
  document.querySelector('.d-chrome').style.display = 'none';
  document.querySelector('.d-nav-row').style.display = 'none';
  document.getElementById('state-list').style.display = 'none';
  document.getElementById('state-detail').style.display = 'flex';
}

/* ── DETAIL TABS ─────────────────────────────────── */
function switchTab(tab, el) {
  activeTab = tab;
  document.querySelectorAll('.det-tab').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
  renderDetailContent(tab);
}

/* ════════════════════════════════════════════════════════════════
   SHARED LOG RENDER ENGINE — used by mobile, tablet, and desktop.
   Ported from logs-test.html. All tl* functions are the single
   source of truth for structured + raw detail views.
   ════════════════════════════════════════════════════════════════ */

function tlEsc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function tlFmtDT(sec) { return new Date(sec*1000).toLocaleString('en-US',{month:'2-digit',day:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}); }
function tlKpa(pa) { return (pa/1000).toFixed(1)+' kPa'; }
function tlIn(mm)  { return (mm/25.4).toFixed(1)+'"'; }
function tlOk(v)   { return v !== -1 && v !== null && v !== undefined && String(v) !== 'NaN' && !Number.isNaN(v); }

var TL_PHASES = {PHASE_WAITING_TO_LOAD:'Waiting to load',PHASE_LOADING:'Loading',PHASE_LOADED:'Loaded',PHASE_TO_JOB:'In transit to job',PHASE_ON_SITE:'On site',PHASE_POURING:'Pouring',PHASE_WASHING:'Washing',PHASE_RETURN_TO_PLANT:'Returning to plant',PHASE_IGNITION_OFF:'Ignition off'};
var TL_STATES = {LOADED_STATE:'Loaded',IDLE:'Idle',LOADING_STATE:'Loading',DISCHARGING_STATE:'Discharging'};
var TL_SLUMP = {SLUMP_NOT_YET_VALID:'Drum not spinning long enough yet',DRUM_NOT_IN_CHARGE:'Drum not in charge position',SLUMP_IS_VALID:'Valid reading',LOAD_TOO_SMALL:'Load too small',NO_LOAD:'No active load'};
var TL_FLUID = {STEALTH_WATER_DETECTED:'Stealth water detected',NORMAL_ADD:'Normal addition',MAX_FLUID_REACHED:'Max fluid limit reached',ADMIX_ONLY:'Admix only'};

function tlSigQ(dbm) { var v=parseInt(dbm); return v>=-70?{l:'Strong',c:''}:v>=-85?{l:'Moderate',c:'val-warn'}:{l:'Weak',c:'val-alarm'}; }


function tlCard(opts) {
  var label=opts.label, value=opts.value, vcls=opts.vcls||'', dot=opts.dot||'', detail=opts.detail||[], mono=opts.mono||false;
  var cid='tlc'+Math.random().toString(36).slice(2);
  var dotH=dot?'<span class="tl-card-dot" style="background:'+dot+';"></span>':'';
  var hasD=detail.length>0;
  var valStyle=mono?' style="font-family:var(--font-mono);font-size:12px;"':'';
  var detH=detail.map(function(d){var k=d[0],v=d[1],c=d[2]||'';return '<div class="tl-detail-row"><span class="tl-detail-k">'+tlEsc(k)+'</span><span class="tl-detail-v '+c+'">'+tlEsc(String(v))+'</span></div>';}).join('');
  var chevH=hasD?'<svg class="tl-card-chev" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>':'';
  var onclickAttr=hasD?'onclick="tlToggleCard(\'' +cid+ '\')"':'disabled';
  return '<div class="tl-card'+(hasD?' open':'') +'" id="'+cid+'">'+
    '<button class="tl-card-row'+(hasD?' xp':'')+'" '+onclickAttr+'>'+
    '<span class="tl-card-left">'+dotH+'<span class="tl-card-label">'+tlEsc(label)+'</span></span>'+
    '<span class="tl-card-right"><span class="tl-card-value '+vcls+'"'+valStyle+'>'+tlEsc(String(value))+'</span>'+chevH+'</span>'+
    '</button>'+(hasD?'<div class="tl-card-body">'+detH+'</div>':'')+
    '</div>';
}
function tlFlag(msg, type) {
  return '<div class="tl-flag '+type+'">'+msg+'</div>';
}


function tlGetPayload(row) {
  return TL_PAYLOADS[row.id]||{message_type:row.type,time:{seconds:1780927000},sender_mac_id:'n/a',accountId:'83',truckId:'10000',truckName:'45689',pbversion:4,_note:'No payload for '+row.type+' \u003e '+row.sub};
}

/* ── Structured templates ── */
function tlRenderConcreteStatus(row, p) {
  if(!p.event||!p.event.concrete_status) return tlRenderGeneric(row);
  var cs=p.event.concrete_status, ts=tlFmtDT(p.time.seconds);
  var phase=TL_PHASES[cs.deliveryPhase]||cs.deliveryPhase, state=TL_STATES[cs.deliveryState]||cs.deliveryState;
  var sOk=tlOk(cs.slumpMillimeters)&&cs.slumpMillimeters>0;
  var sDisp=sOk?cs.slumpMillimeters.toFixed(0)+' mm ('+tlIn(cs.slumpMillimeters)+')':'—';
  var rOk=tlOk(cs.drumSpeedRpm)&&cs.drumSpeedRpm>0;
  var rDisp=rOk?cs.drumSpeedRpm.toFixed(1)+' RPM':'—';
  var rInR=rOk&&cs.drumSpeedRpm>=cs.targetMinDrumSpeedRpm&&cs.drumSpeedRpm<=cs.targetMaxDrumSpeedRpm;
  var cpOk=cs.chargePressurePascals>=cs.chargePressureMin&&cs.chargePressurePascals<=cs.chargePressureMax;
  var dpOk=cs.dischargePressurePascals>=cs.dischargePressureMin&&cs.dischargePressurePascals<=cs.dischargePressureMax;
  var flags=[];
  if(cs.probBadMagnet===1) flags.push(tlFlag('Bad magnet probability high — drum speed may be unreliable','warn'));
  if(!cpOk) flags.push(tlFlag('Charge pressure out of range ('+tlKpa(cs.chargePressureMin)+' – '+tlKpa(cs.chargePressureMax)+')','alarm'));
  if(!dpOk) flags.push(tlFlag('Discharge pressure out of range ('+tlKpa(cs.dischargePressureMin)+' – '+tlKpa(cs.dischargePressureMax)+')','alarm'));
  if(cs.estimatedBuildupPounds>1500) flags.push(tlFlag('Estimated buildup: '+cs.estimatedBuildupPounds.toFixed(0)+' lbs','warn'));
  var h='<div class="tl-chip"><div class="tl-chip-left"><span class="tl-chip-dot" style="background:#3069e3;"></span><span class="tl-chip-label">Concrete Status</span></div><span class="tl-chip-time">'+tlEsc(ts)+'</span></div>';
  h+=flags.join('');
  h+='<div class="tl-section-group"><div class="tl-section-hdr">Key signals</div><div class="tl-card-stack">';
  h+=tlCard({label:'Delivery phase',value:phase,dot:cs.deliveryPhase==='PHASE_ON_SITE'?'#2ecf1d':'#3069e3'});
  h+=tlCard({label:'Delivery state',value:state,dot:cs.active_load?'#2ecf1d':'#3069e3'});
  h+=tlCard({label:'Slump reading',value:sDisp,vcls:sOk?'':'val-muted',dot:sOk?'#2ecf1d':'#ffba0d',detail:sOk?[['Target',tlOk(cs.targetSlumpMillimeters)?cs.targetSlumpMillimeters+' mm':'—'],['Standard',tlOk(cs.standardSlumpMm)&&cs.standardSlumpMm>0?cs.standardSlumpMm.toFixed(0)+' mm':'—'],['3-stage',tlOk(cs.threeStageSlumpMm)&&cs.threeStageSlumpMm>0?cs.threeStageSlumpMm.toFixed(0)+' mm':'—'],['Stable',cs.slumpIsStable?'Yes':'No']]:[['Reason',TL_SLUMP[cs.slumpReason]||cs.slumpReason]]});
  h+=tlCard({label:'Drum speed',value:rDisp,vcls:rOk?(!rInR?'val-warn':''):'',dot:rOk?(rInR?'#2ecf1d':'#ffba0d'):'',detail:rOk?[['Target range',cs.targetMinDrumSpeedRpm+' – '+cs.targetMaxDrumSpeedRpm+' RPM'],['In range',rInR?'Yes':'No',rInR?'':'val-warn']]:[['Target',cs.targetMinDrumSpeedRpm+' – '+cs.targetMaxDrumSpeedRpm+' RPM']]});
  h+=tlCard({label:'Charge pressure',value:tlKpa(cs.chargePressurePascals),vcls:cpOk?'':'val-alarm',dot:cpOk?'#2ecf1d':'#d70100',detail:[['Expected',tlKpa(cs.chargePressureMin)+' – '+tlKpa(cs.chargePressureMax)],['In range',cpOk?'Yes':'No',cpOk?'':'val-alarm']]});
  h+=tlCard({label:'Discharge pressure',value:tlKpa(cs.dischargePressurePascals),vcls:dpOk?'':'val-alarm',dot:dpOk?'#2ecf1d':'#d70100',detail:[['Expected',tlKpa(cs.dischargePressureMin)+' – '+tlKpa(cs.dischargePressureMax)],['In range',dpOk?'Yes':'No',dpOk?'':'val-alarm']]});
  h+=tlCard({label:'Total water added',dot:'#3069e3',value:cs.totalWaterAddedLiters.toFixed(1)+' L',detail:[['Per m³',cs.totalWaterAddedLitersPerCubicMeter.toFixed(2)+' L/m³'],['Admix',cs.totalAdmixAddedMilliliters>0?cs.totalAdmixAddedMilliliters.toFixed(0)+' mL':'None']]});
  h+='</div></div>';
  return h;
}

function tlRenderFluidAdd(row, p) {
  if(!p.event||!p.event.fluid_add) return tlRenderGeneric(row);
  var fa=p.event.fluid_add, ts=tlFmtDT(p.time.seconds);
  var isS=fa.fluidAddEvent==='STEALTH_WATER_DETECTED';
  var flowOk=tlOk(fa.fluidFlowRateMillilitersPerSecond)&&fa.fluidFlowRateMillilitersPerSecond>0;
  var h='<div class="tl-chip"><div class="tl-chip-left"><span class="tl-chip-dot" style="background:'+(isS?'#d70100':'#3069e3')+';"></span><span class="tl-chip-label">Fluid Add</span></div><span class="tl-chip-time">'+tlEsc(ts)+'</span></div>';
  if(isS) h+=tlFlag('Stealth water detected — water added without being requested','alarm');
  if(fa.maxFluidReached) h+=tlFlag('Maximum fluid limit was reached','warn');
  h+='<div class="tl-section-group"><div class="tl-section-hdr">Key signals</div><div class="tl-card-stack">';
  h+=tlCard({label:'Event type',value:TL_FLUID[fa.fluidAddEvent]||fa.fluidAddEvent,vcls:isS?'val-alarm':'',dot:isS?'#d70100':'#2ecf1d'});
  h+=tlCard({label:'Water added',value:fa.waterAddedLiters.toFixed(2)+' L',detail:[['Per m³',fa.waterAddedLitersPerCubicMeter.toFixed(3)+' L/m³']]});
  h+=tlCard({label:'Admix added',value:fa.admixAddedMilliliters>0?fa.admixAddedMilliliters.toFixed(0)+' mL':'None'});
  h+=tlCard({label:'Flow rate',value:flowOk?fa.fluidFlowRateMillilitersPerSecond.toFixed(1)+' mL/s':'—',vcls:flowOk?'':'val-muted',dot:flowOk?'#2ecf1d':''});
  h+='</div></div>';
  return h;
}

function tlRenderBackend(row, p) {
  if(!p.backend_request) return tlRenderGeneric(row);
  var br=p.backend_request, ts=tlFmtDT(p.time.seconds);
  var locOk=br.location&&br.location.status==='VALID';
  var h='<div class="tl-chip"><div class="tl-chip-left"><span class="tl-chip-dot" style="background:#3069e3;"></span><span class="tl-chip-label">Backend Request</span></div><span class="tl-chip-time">'+tlEsc(ts)+'</span></div>';
  h+=tlFlag('System housekeeping message. No action required.','info');
  h+='<div class="tl-section-group"><div class="tl-section-hdr">Key signals</div><div class="tl-card-stack">';
  h+=tlCard({label:'Request type',value:br.requestType.replace(/_/g,' ').toLowerCase().replace(/\b\w/g,function(c){return c.toUpperCase();}),dot:'#3069e3'});
  h+=tlCard({label:'GPS at request',value:locOk?'Valid fix':'No fix',vcls:locOk?'':'val-warn',dot:locOk?'#2ecf1d':'#ffba0d',detail:locOk?[['Lat',br.location.latitude.toFixed(6)],['Lng',br.location.longitude.toFixed(6)]]:[]});
  h+='</div></div>';
  return h;
}

function tlRenderDeviceBinding(row, p) {
  if(!p.device_binding) return tlRenderGeneric(row);
  var db=p.device_binding, ts=tlFmtDT(p.time.seconds);
  var sq=tlSigQ(db.signalStrength), isBound=db.bindingType==='Bound';
  var h='<div class="tl-chip"><div class="tl-chip-left"><span class="tl-chip-dot" style="background:#3069e3;"></span><span class="tl-chip-label">Device Binding</span></div><span class="tl-chip-time">'+tlEsc(ts)+'</span></div>';
  if(!isBound) h+=tlFlag(db.deviceType+' detected nearby but not yet bound to this truck','info');
  h+='<div class="tl-section-group"><div class="tl-section-hdr">Key signals</div><div class="tl-card-stack">';
  h+=tlCard({label:'Device',value:db.deviceType,dot:'#3069e3'});
  h+=tlCard({label:'Binding status',value:isBound?'Bound':'Detected nearby (not bound)',vcls:isBound?'':'val-warn',dot:isBound?'#2ecf1d':'#ffba0d'});
  h+=tlCard({label:'Signal strength',value:sq.l+' ('+db.signalStrength+' dBm)',vcls:sq.c,detail:[['Raw dBm',db.signalStrength],['Quality',sq.l,sq.c]]});
  h+=tlCard({label:'MAC ID',value:db.macId,mono:true});
  h+='</div></div>';
  return h;
}

function tlRenderWireless(row, p) {
  if(!p.wireless_drum_binding) return tlRenderGeneric(row);
  var wb=p.wireless_drum_binding, ts=tlFmtDT(p.time.seconds);
  var isU=wb.wirelessDrumBindingType==='UnboundTC3Notification';
  var h='<div class="tl-chip"><div class="tl-chip-left"><span class="tl-chip-dot" style="background:'+(isU?'#ffba0d':'#2ecf1d')+';"></span><span class="tl-chip-label">Wireless Drum Binding</span></div><span class="tl-chip-time">'+tlEsc(ts)+'</span></div>';
  h+=isU?tlFlag('Wireless drum not bound to TCG. Physical inspection may be required.','warn'):tlFlag('Wireless drum successfully bound to TCG.','info');
  h+='<div class="tl-section-group"><div class="tl-section-hdr">Key signals</div><div class="tl-card-stack">';
  h+=tlCard({label:'Binding status',value:isU?'Unbound from TCG':'Bound to TCG',vcls:isU?'val-warn':'',dot:isU?'#ffba0d':'#2ecf1d'});
  if(isU) h+=tlCard({label:'Action needed',value:'Check drum sensor and TCG pairing',vcls:'val-warn'});
  h+='</div></div>';
  return h;
}

function tlRenderTicketReceived(row, p) {
  if(!p.event||!p.event.ticket_received) return tlRenderGeneric(row);
  var ts  = tlFmtDT(p.time.seconds);
  var tr  = p.event.ticket_received.receivedTicket;

  // Slump conversion helpers
  function mmToIn(mm) { return (mm / 25.4).toFixed(1); }
  function slumpDisp(mm) {
    if(!tlOk(mm)||mm<0) return '—';
    return mm + ' mm / ' + mmToIn(mm) + '"';
  }

  var targetSlump  = slumpDisp(tr.dischargeSlumpMillimeters);
  var slumpOk      = tlOk(tr.dischargeSlumpMillimeters) && tr.dischargeSlumpMillimeters > 0;
  var loadSize     = tlOk(tr.loadSizeCubicMeters) ? tr.loadSizeCubicMeters.toFixed(2) + ' m³' : '—';
  var maxWater     = tlOk(tr.maxWaterLitersPerCubicMeter) ? tr.maxWaterLitersPerCubicMeter.toFixed(2) + ' L/m³' : '—';
  var autoWater    = tr.autoAddWater ? 'Enabled' : 'Disabled';
  var autoWaterDot = tr.autoAddWater ? '#2ecf1d' : '#ffba0d';
  var job          = tr.jobName || '—';
  var customer     = tr.customerName || '—';
  var ticketNum    = tr.displayTicketNumber || '—';
  var instruction  = tr.verifiInstructionName || '—';

  var h = '';
  h += '<div class="tl-chip"><div class="tl-chip-left"><span class="tl-chip-dot" style="background:#2ecf1d;"></span><span class="tl-chip-label">Ticket Received</span></div><span class="tl-chip-time">'+tlEsc(ts)+'</span></div>';

  h += '<div class="tl-section-group"><div class="tl-section-hdr">Key signals</div><div class="tl-card-stack">';

  h += tlCard({
    label:'Ticket',
    value:ticketNum,
    dot:'#3069e3',
    mono:true,
    detail:[
      ['Order',        tr.orderNumber||'—'],
      ['Account',      tr.accountName||'—'],
      ['Plant',        tr.plantName+' — '+tr.locationName],
      ['Driver',       tr.driverCode||'—'],
    ]
  });

  h += tlCard({
    label:'Job',
    value:job,
    dot:'#3069e3',
    detail:[
      ['Customer',     customer],
      ['Address',      tr.customerAddress||'—'],
      ['Mix code',     tr.mixCodeName||'—'],
    ]
  });

  h += tlCard({
    label:'Load size',
    value:loadSize,
    dot:'#2ecf1d',
    detail:[
      ['Target slump', targetSlump],
      ['Min discharge',slumpDisp(tr.minDischargeSlumpMillimeters)],
      ['Max discharge',slumpDisp(tr.maxDischargeSlumpMillimeters)],
      ['Mix revs after load', tr.mixRevsAfterLoading||'—'],
    ]
  });

  h += tlCard({
    label:'Auto-add water',
    value:autoWater,
    dot:autoWaterDot,
    detail:[
      ['Max water',      maxWater],
      ['Beyond max',     tr.allowWaterBeyondMax?'Allowed':'Not allowed'],
      ['Driver adds on site', tr.allowDriverWaterAddsOnSite?'Allowed':'Not allowed'],
      ['Instruction',    instruction],
    ]
  });

  h += '</div></div>';
  return h;
}

function tlRenderDriverAction(row, p) {
  if(!p.event||!p.event.driver_action) return tlRenderGeneric(row);
  var da=p.event.driver_action, ts=tlFmtDT(p.time.seconds);
  var locOk=p.event.location&&p.event.location.status==='VALID';

  // Translate action enum to plain English
  var TL_DRIVER_ACTIONS = {
    'DRIVER_REQUESTED_WATER':  'Driver requested water',
    'DRIVER_REQUESTED_ADMIX':  'Driver requested admix',
    'DRIVER_CANCEL_WATER':     'Driver cancelled water request',
    'DRIVER_CANCEL_ADMIX':     'Driver cancelled admix request',
    'DRIVER_CONFIRMED_EMPTY':  'Driver confirmed truck empty',
    'DRIVER_STARTED_DISCHARGE':'Driver started discharge',
  };
  var actionLabel = TL_DRIVER_ACTIONS[da.action] || da.action.replace(/_/g,' ').toLowerCase().replace(/\b\w/g,function(c){return c.toUpperCase();});

  // parameterRaw is likely mL of water requested — convert to L
  var paramLabel = '';
  if(da.action.indexOf('WATER') !== -1 && da.parameterRaw > 0) {
    paramLabel = (da.parameterRaw / 1000).toFixed(2) + ' L requested';
  } else if(da.parameterRaw > 0) {
    paramLabel = da.parameterRaw + ' (raw)';
  }

  var isWater = da.action.indexOf('WATER') !== -1;
  var chipDot  = isWater ? '#3069e3' : '#3069e3';

  var h = '';
  h += '<div class="tl-chip"><div class="tl-chip-left"><span class="tl-chip-dot" style="background:'+chipDot+';"></span><span class="tl-chip-label">Driver Action</span></div><span class="tl-chip-time">'+tlEsc(ts)+'</span></div>';

  h += '<div class="tl-section-group"><div class="tl-section-hdr">Key signals</div><div class="tl-card-stack">';
  h += tlCard({label:'Action', value:actionLabel, dot:'#3069e3'});
  if(paramLabel) {
    h += tlCard({label:'Amount', value:paramLabel, dot:'#3069e3'});
  }
  h += tlCard({
    label:'Truck location',
    value: locOk ? 'Valid fix' : 'No fix',
    dot:   locOk ? '#2ecf1d' : '#ffba0d',
    vcls:  locOk ? '' : 'val-warn',
    detail: locOk ? [
      ['Lat', p.event.location.latitude.toFixed(6)],
      ['Lng', p.event.location.longitude.toFixed(6)],
    ] : []
  });
  h += '</div></div>';
  return h;
}

function tlRenderSystemStatusReal(row, p) {
  if(!p.event||!p.event.system_status) return tlRenderGeneric(row);
  var ss = p.event.system_status;
  var ts = tlFmtDT(p.time.seconds);

  // Map of component key → display name + how to get a reading value
  var COMP_MAP = [
    { key:'wirelessDrum',     label:'Wireless Drum',      reading: function(c){ return c.batteryVoltage ? c.batteryVoltage.toFixed(2)+'V' : 'Active'; } },
    { key:'iox',              label:'IOX',                reading: function(){ return 'Active'; } },
    { key:'inCabDisplay',     label:'In-Cab Display',     reading: function(c){ return c.version ? 'v'+c.version : 'Active'; } },
    { key:'externalDisplay',  label:'External Display',   reading: function(c){ return c.version ? 'v'+c.version : 'Active'; } },
    { key:'vnextSensorBoard', label:'Sensor Board',       reading: function(c){ return c.version ? 'v'+c.version : 'Active'; } },
    { key:'vnextWaterBoard',  label:'Water Board',        reading: function(c){ return c.version ? 'v'+c.version : 'Active'; } },
    { key:'pressureCharge',   label:'Charge Pressure',    reading: function(){ var d=ss.vnextSensorBoardDevices; return d&&d.pressureCharge ? tlKpa(d.pressureCharge.pressurePascal) : 'Connected'; } },
    { key:'pressureDischarge',label:'Discharge Pressure', reading: function(){ var d=ss.vnextSensorBoardDevices; return d&&d.pressureDischarge ? tlKpa(d.pressureDischarge.pressurePascal) : 'Connected'; } },
    { key:'cwr',              label:'CWR',                reading: function(c){ return c.temperatureCelsius !== undefined ? c.temperatureCelsius+'° C' : 'Active'; } },
    { key:'kzValveVnextAir',  label:'Air Valve',          reading: function(c){ return c.valveReportedPositionDegrees !== undefined ? c.valveReportedPositionDegrees+'°' : 'Active'; } },
    { key:'kzValveVnextTemperateWaterMain', label:'Water Valve', reading: function(c){ return c.valveReportedPositionDegrees !== undefined ? c.valveReportedPositionDegrees+'°' : 'Active'; } },
    { key:'wiredDrum',        label:'Wired Drum',         reading: function(){ return '—'; } },
    { key:'powerModule',      label:'Power Module',       reading: function(){ return '—'; } },
    { key:'jacketHeater',     label:'Jacket Heater',      reading: function(){ return '—'; } },
    { key:'fdmHeater',        label:'FDM Heater',         reading: function(){ return '—'; } },
    { key:'vnextAdmixBoard',  label:'Admix Board',        reading: function(){ return '—'; } },
    { key:'roboteq',          label:'Roboteq',            reading: function(){ return '—'; } },
  ];

  var online = [], offline = [];
  COMP_MAP.forEach(function(cm) {
    var comp = ss[cm.key];
    if(!comp) return;
    if(comp.alive) {
      online.push({ label: cm.label, reading: cm.reading(comp), lastSeen: comp.lastContactSeconds ? new Date(comp.lastContactSeconds*1000).toISOString().substr(11,8) : '—', errors: comp.errorMessageCount || 0 });
    } else {
      offline.push(cm.label);
    }
  });

  // Status flags
  var flags = [];
  if(!ss.ignition)    flags.push('Ignition off');
  if(!ss.sensorPower) flags.push('Sensor power off');
  if(ss.ghostMode)    flags.push('Ghost mode active');
  if(ss.offMode)      flags.push('Off mode active');

  var totalErrors = online.reduce(function(sum, c){ return sum + c.errors; }, 0);
  if(totalErrors > 0) flags.push(totalErrors + ' component error' + (totalErrors > 1 ? 's' : '') + ' active');
  var flagType = flags.length ? 'warn' : 'info';
  var summaryMsg = flags.length
    ? flags.join(' — ')
    : online.length + ' of ' + (online.length+offline.length) + ' components online — '
      + (ss.operatingMode ? ss.operatingMode.mode : '') + ' / ' + (ss.operatingMode ? ss.operatingMode.localMode : '');

  var h = '';
  h += '<div class="tl-chip"><div class="tl-chip-left"><span class="tl-chip-dot" style="background:#3069e3;"></span><span class="tl-chip-label">System Status</span></div><span class="tl-chip-time">'+tlEsc(ts)+'</span></div>';
  h += tlFlag(summaryMsg, flagType);

  // Unified component table
  h += '<div class="tl-section-group">';
  h += '<div class="tl-section-hdr">Components ('+online.length+' online, '+offline.length+' no contact)</div>';
  h += '<div class="tl-comp-table">';
  h += '<div class="tl-comp-thead"><span style="flex:1;">Component</span><span style="width:68px;flex-shrink:0;text-align:right;">Last seen</span><span style="width:44px;flex-shrink:0;text-align:center;">Errors</span><span style="width:80px;flex-shrink:0;text-align:right;">Reading</span></div>';

  online.forEach(function(c, i) {
    var dotH = c.errors > 0
      ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="flex-shrink:0;margin-right:2px;" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="5" r="5" fill="#d70100" fill-opacity="0.12"/><path d="M3 3L7 7M7 3L3 7" stroke="#d70100" stroke-width="1.4" stroke-linecap="round"/></svg>'
      : '<span class="tl-card-dot" style="background:#2ecf1d;flex-shrink:0;"></span>';
    h += '<div class="tl-comp-row'+(i%2===1?' alt':'')+'">';
    h += '<span class="tl-comp-name">'+dotH+tlEsc(c.label)+'</span>';
    h += '<span class="tl-comp-seen">'+tlEsc(c.lastSeen)+'</span>';
    var errH = c.errors > 0
      ? '<button class="tl-err-link" onclick="tlDrillErrors(\''+c.label+'\')">' + c.errors + '</button>'
      : '0';
    h += '<span class="tl-comp-errors '+(c.errors>0?'has-errors':'no-errors')+'">'+errH+'</span>';
    h += '<span class="tl-comp-status" style="color:var(--strong);font-weight:500;">'+tlEsc(c.reading)+'</span>';
    h += '</div>';
  });
  offline.forEach(function(name, i) {
    var alt = (online.length + i) % 2 === 1;
    h += '<div class="tl-comp-row'+(alt?' alt':'')+'">';
    h += '<span class="tl-comp-name"><span class="tl-card-dot" style="background:rgba(54,50,45,0.18);flex-shrink:0;"></span>'+tlEsc(name)+'</span>';
    h += '<span class="tl-comp-seen" style="color:rgba(54,50,45,0.25);">—</span>';
    h += '<span class="tl-comp-errors no-errors" style="color:rgba(54,50,45,0.25);">—</span>';
    h += '<span class="tl-comp-status no-contact">No Contact</span>';
    h += '</div>';
  });
  h += '</div></div>';
  return h;
}

function tlRenderTruckHealth(row, p) {
  if(!p.event||!p.event.truck_health) return tlRenderGeneric(row);
  var th = p.event.truck_health;
  var ts = tlFmtDT(p.time.seconds);
  var locOk = p.event.location && p.event.location.status === 'VALID';

  // TruckHealth events are behavioral pattern detections, not hardware faults.
  // Translate eventType to plain English + explain what it means for the FST.
  var TL_TRUCK_HEALTH_EVENTS = {
    'RPM_DECREASE_SLUMP_INCREASE': {
      label:   'RPM decrease, slump increase',
      meaning: 'Drum slowed while slump rose — possible buildup, over-wet mix, or sensor issue.',
      sev:     'warn',
    },
    'RPM_INCREASE_SLUMP_DECREASE': {
      label:   'RPM increase, slump decrease',
      meaning: 'Drum sped up while slump dropped — mix may be stiffening faster than expected.',
      sev:     'warn',
    },
    'SLUMP_OUT_OF_RANGE': {
      label:   'Slump out of range',
      meaning: 'Slump reading outside acceptable limits for this load.',
      sev:     'alarm',
    },
    'DRUM_NOT_RESPONDING': {
      label:   'Drum not responding',
      meaning: 'No drum speed signal detected. Check WDS connection and magnet alignment.',
      sev:     'alarm',
    },
    'PRESSURE_ANOMALY': {
      label:   'Pressure anomaly',
      meaning: 'Charge or discharge pressure reading outside expected range.',
      sev:     'warn',
    },
    'CAN_BUS_ERROR': {
      label:   'CAN bus error',
      meaning: 'Communication error on the CAN bus. May affect multiple components.',
      sev:     'alarm',
    },
  };

  var def    = TL_TRUCK_HEALTH_EVENTS[th.eventType] || {
    label:   th.eventType.replace(/_/g,' ').toLowerCase().replace(/\w/g,function(c){return c.toUpperCase();}),
    meaning: 'Behavioral pattern detected. Review recent ConcreteStatus and sensor readings.',
    sev:     'warn',
  };
  var isAlarm = def.sev === 'alarm';
  var chipDot = isAlarm ? '#d70100' : '#ffba0d';

  var h = '';
  h += '<div class="tl-chip"><div class="tl-chip-left"><span class="tl-chip-dot" style="background:'+chipDot+';"></span><span class="tl-chip-label">Truck Health</span></div><span class="tl-chip-time">'+tlEsc(ts)+'</span></div>';
  h += tlFlag(def.meaning, def.sev === 'alarm' ? 'alarm' : 'warn');

  h += '<div class="tl-section-group"><div class="tl-section-hdr">Key signals</div><div class="tl-card-stack">';

  h += tlCard({
    label: 'Pattern detected',
    value: def.label,
    dot:   chipDot,
    vcls:  isAlarm ? 'val-alarm' : 'val-warn',
  });

  h += tlCard({
    label: 'Truck location',
    value: locOk ? 'Valid fix' : 'No fix',
    dot:   locOk ? '#2ecf1d' : '#ffba0d',
    vcls:  locOk ? '' : 'val-warn',
    detail: locOk ? [
      ['Lat', p.event.location.latitude.toFixed(6)],
      ['Lng', p.event.location.longitude.toFixed(6)],
    ] : []
  });

  h += '</div></div>';
  return h;
}

function tlRenderFluidError(row, p) {
  if(!p.event||!p.event.fluid_error) return tlRenderGeneric(row);
  var fe = p.event.fluid_error;
  var ts = tlFmtDT(p.time.seconds);
  var locOk = p.event.location && p.event.location.status === 'VALID';

  // Translate error codes to plain English
  var TL_FLUID_ERRORS = {
    'FDM_ERROR':          'FDM hardware failure',
    'FLOW_TOO_LOW':       'Flow rate too low',
    'FLOW_TOO_HIGH':      'Flow rate too high',
    'VALVE_STUCK_OPEN':   'Valve stuck open',
    'VALVE_STUCK_CLOSED': 'Valve stuck closed',
    'TIMEOUT':            'Fluid add timed out',
    'TANK_EMPTY':         'Tank empty',
  };
  var TL_FLUID_NAMES = {
    'WATER': 'Water', 'ADMIX': 'Admix', 'AIR': 'Air',
  };

  var errorLabel = TL_FLUID_ERRORS[fe.error] || fe.error.replace(/_/g,' ').toLowerCase().replace(/\w/g,function(c){return c.toUpperCase();});
  var fluidLabel = TL_FLUID_NAMES[fe.fluid] || fe.fluid;

  var h = '';
  h += '<div class="tl-chip"><div class="tl-chip-left"><span class="tl-chip-dot" style="background:#d70100;"></span><span class="tl-chip-label">Fluid Error</span></div><span class="tl-chip-time">'+tlEsc(ts)+'</span></div>';
  h += tlFlag(fluidLabel+' add failed — '+errorLabel+'. Check FDM wiring and valve.', 'alarm');

  h += '<div class="tl-section-group"><div class="tl-section-hdr">Key signals</div><div class="tl-card-stack">';

  h += tlCard({
    label: 'Error',
    value: errorLabel,
    dot:   '#d70100',
    vcls:  'val-alarm',
  });

  h += tlCard({
    label: 'Fluid affected',
    value: fluidLabel,
    dot:   '#d70100',
  });

  h += tlCard({
    label: 'Truck location',
    value: locOk ? 'Valid fix' : 'No fix',
    dot:   locOk ? '#2ecf1d' : '#ffba0d',
    vcls:  locOk ? '' : 'val-warn',
    detail: locOk ? [
      ['Lat', p.event.location.latitude.toFixed(6)],
      ['Lng', p.event.location.longitude.toFixed(6)],
    ] : []
  });

  h += '</div></div>';
  return h;
}

function tlRenderIdentity(row, p) {
  if(!p.identity) return tlRenderGeneric(row);
  var id = p.identity;
  var ts = tlFmtDT(p.time.seconds);

  var commissioned   = id.commissioned === true;
  var drumBound      = id.wirelessDrumSensorBound === true;
  var commDot        = commissioned ? '#2ecf1d' : '#d70100';
  var commVal        = commissioned ? 'Yes' : 'No';
  var commVcls       = commissioned ? '' : 'val-alarm';
  var drumDot        = drumBound ? '#2ecf1d' : '#ffba0d';
  var drumVal        = drumBound ? 'Bound' : 'Not bound';
  var drumVcls       = drumBound ? '' : 'val-warn';

  var h = '';
  h += '<div class="tl-chip"><div class="tl-chip-left"><span class="tl-chip-dot" style="background:#3069e3;"></span><span class="tl-chip-label">Identity</span></div><span class="tl-chip-time">'+tlEsc(ts)+'</span></div>';

  if (!commissioned) {
    h += tlFlag('TCG is not commissioned — unit will not report data until commissioned.', 'warn');
  }

  h += '<div class="tl-section-group"><div class="tl-section-hdr">Key signals</div><div class="tl-card-stack">';

  h += tlCard({
    label: 'Device',
    value: (id.deviceType||'—'),
    dot: '#3069e3',
    detail: [
      ['Serial',        id.serialNo||'—'],
      ['MAC ID',        id.macId||'—'],
      ['Variant',       id.deviceVariant||'—'],
    ]
  });

  h += tlCard({
    label: 'Software version',
    value: (id.version||'—'),
    dot: '#3069e3',
    mono: true,
    detail: [
      ['BSP version',   id.bspVersion||'—'],
      ['Protocol',      'v'+p.pbversion],
    ]
  });

  h += tlCard({
    label: 'Commissioned',
    value: commVal,
    dot: commDot,
    vcls: commVcls,
  });

  h += tlCard({
    label: 'Wireless drum sensor',
    value: drumVal,
    dot: drumDot,
    vcls: drumVcls,
    detail: drumBound ? [
      ['Drum MAC ID', id.wirelessDrumSensorMacId||'—'],
    ] : []
  });

  h += '</div></div>';
  return h;
}

function tlRenderGeneric(row) {
  var p   = tlGetPayload(row);
  var ts  = tlFmtDT(p.time ? p.time.seconds : 0);

  // Extract top-level keys from the payload to give devs a field list to work from
  var payloadKeys = Object.keys(p).filter(function(k) {
    return ['message_type','time','sender_mac_id','accountId','truckId','truckName','pbversion','_note'].indexOf(k) === -1;
  });
  // Drill into the event sub-object if present
  var eventKeys = [];
  if (p.event) {
    eventKeys = Object.keys(p.event).filter(function(k) { return k !== 'event_type'; });
    // If there's a typed sub-object (driver_action, fluid_add, etc.) drill one more level
    eventKeys.forEach(function(k) {
      if (typeof p.event[k] === 'object' && p.event[k] !== null && !Array.isArray(p.event[k])) {
        Object.keys(p.event[k]).forEach(function(sub) {
          eventKeys.push(k + '.' + sub);
        });
      }
    });
  }
  var allKeys = payloadKeys.concat(eventKeys);

  var h = '';

  // Chip — same as every other template
  h += '<div class="tl-chip">';
  h += '<div class="tl-chip-left"><span class="tl-chip-dot" style="background:#3069e3;"></span><span class="tl-chip-label">'+tlEsc(row.sub)+'</span></div>';
  h += '<span class="tl-chip-time">'+tlEsc(ts)+'</span>';
  h += '</div>';

  // Dev contract notice — styled differently from a warning, more like a spec annotation
  h += '<div style="background:rgba(48,105,227,0.06);border:1px dashed rgba(48,105,227,0.3);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:6px;">';
  h += '<div style="font-size:12px;font-weight:600;color:#2355c4;letter-spacing:0.3px;text-transform:uppercase;">Template needed — '+tlEsc(row.type)+' › '+tlEsc(row.sub)+'</div>';
  h += '<div style="font-size:13px;color:var(--defined);letter-spacing:-0.26px;line-height:1.5;">Pick 2–4 key signals from the fields below. Each becomes a card with a label, value, status dot, and optional expand rows.</div>';
  h += '</div>';

  // Field list — shows devs exactly what's available in the payload
  if(allKeys.length > 0) {
    h += '<div class="tl-section-group">';
    h += '<div class="tl-section-hdr">Available fields</div>';
    h += '<div class="tl-comp-table">';
    h += '<div class="tl-comp-thead"><span style="flex:1;">Field</span><span style="flex:1;text-align:right;">Sample value</span></div>';
    allKeys.forEach(function(key, i) {
      // Resolve nested value
      var val = p;
      key.split('.').forEach(function(part) {
        val = val && typeof val === 'object' ? (val[part] !== undefined ? val[part] : val.event ? val.event[part] : '—') : '—';
      });
      if (typeof val === 'object') val = JSON.stringify(val);
      var muted = !tlOk(val) || val === '—' || val === null;
      h += '<div class="tl-comp-row'+(i%2===1?' alt':'')+'" style="min-height:36px;">';
      h += '<span style="flex:1;font-family:var(--font-mono);font-size:12px;color:var(--soft);">'+tlEsc(key)+'</span>';
      h += '<span style="flex:1;text-align:right;font-size:13px;'+(muted?'color:var(--subtle);font-style:italic;':'color:var(--strong);font-weight:500;')+'">'+tlEsc(muted?'—':String(val))+'</span>';
      h += '</div>';
    });
    h += '</div></div>';
  } else {
    // No payload captured yet — show the skeleton with question marks
    h += '<div class="tl-section-group">';
    h += '<div class="tl-section-hdr">Key signals — to be defined</div>';
    h += '<div class="tl-card-stack">';
    h += tlCard({label:'Signal 1', value:'?', dot:'rgba(54,50,45,0.2)'});
    h += tlCard({label:'Signal 2', value:'?', dot:'rgba(54,50,45,0.2)'});
    h += tlCard({label:'Signal 3', value:'?', dot:'rgba(54,50,45,0.2)'});
    h += '</div></div>';
  }

  return h;
}

/* ── SystemStatus template — matches Figma node 3472:20202 ── */
var TL_ONLINE_COMPONENTS = [
  { name:'Wireless Drum',     value:'3.54V',    dot:'#2ecf1d', detail:[['Last Seen:','13:49:59'],['Start Up Count:','1'],['Error Count:','0']] },
  { name:'IOX',               value:'12.92 V',  dot:'#2ecf1d', detail:[['Last Seen:','13:49:58'],['Start Up Count:','1'],['Error Count:','0']] },
  { name:'In-Cab Display',    value:'Active',   dot:'#2ecf1d', detail:[['Last Seen:','13:49:57'],['Start Up Count:','1'],['Error Count:','0']] },
  { name:'External Display',  value:'Active',   dot:'#2ecf1d', detail:[['Last Seen:','13:49:57'],['Start Up Count:','1'],['Error Count:','0']] },
  { name:'Bus Power',         value:'12.76V',   dot:'#2ecf1d', detail:[['Last Seen:','13:49:59'],['Start Up Count:','1'],['Error Count:','0']] },
  { name:'Discharge Pressure',value:'Connected',dot:'#2ecf1d', detail:[['Last Seen:','13:49:56'],['Start Up Count:','1'],['Error Count:','0']] },
  { name:'Charge Pressure',   value:'Connected',dot:'#2ecf1d', detail:[['Last Seen:','13:49:56'],['Start Up Count:','1'],['Error Count:','0']] },
  { name:'CWR',               value:'45° C',    dot:'#2ecf1d', detail:[['Last Seen:','13:49:55'],['Start Up Count:','1'],['Error Count:','2']] },
];
var TL_OFFLINE_COMPONENTS = [
  'Wired Drum','Roboteq','Power Module','FDM Heater','Jacket Heater',
  'Admix Board','Sensor Board','Water Board','AWAS','Air V4','Air vNext','Water Main',
];

function tlRenderSystemStatus(row, ts, shutdownType) {
  var online  = TL_ONLINE_COMPONENTS.length;
  var offline = TL_OFFLINE_COMPONENTS.length;
  var total   = online + offline;
  var errored = TL_ONLINE_COMPONENTS.filter(function(c){ return c.detail && parseInt(c.detail[2][1]) > 0; }).length;
  var isShutdown = row.sub === 'Shutdown';

  // Shutdown type flag — only meaningful on StartUp (tells us how last session ended)
  var shutdownFlagH = '';
  if (!isShutdown && shutdownType) {
    if (shutdownType === 'DIRTY') {
      shutdownFlagH = tlFlag('Previous shutdown was unclean — power may have been cut unexpectedly. Previous session data may be incomplete.', 'warn');
    } else if (shutdownType === 'CLEAN') {
      shutdownFlagH = tlFlag('Previous shutdown was clean.', 'info');
    }
  }

  // Component summary flag
  var flagType, flagMsg;
  if (errored > 0) {
    flagType = 'warn';
    flagMsg  = errored + ' component' + (errored > 1 ? 's' : '') + ' reporting errors — ' + online + ' of ' + total + ' online at ' + (isShutdown ? 'shutdown' : 'startup');
  } else if (offline > 0) {
    flagType = 'info';
    flagMsg  = online + ' of ' + total + ' components online at ' + (isShutdown ? 'shutdown' : 'startup') + ' — ' + offline + ' no contact';
  } else {
    flagType = 'info';
    flagMsg  = 'All ' + total + ' components online at ' + (isShutdown ? 'shutdown' : 'startup') + ' — no errors';
  }

  var h = '';
  h += '<div class="tl-chip"><div class="tl-chip-left"><span class="tl-chip-dot" style="background:#3069e3;"></span><span class="tl-chip-label">'+(isShutdown ? 'Shutdown' : 'StartUp')+' Event</span></div><span class="tl-chip-time">'+tlEsc(ts)+'</span></div>';
  h += shutdownFlagH;
  h += tlFlag(flagMsg, flagType);

  h += '<div class="tl-section-group">';
  h += '<div class="tl-section-hdr">Components ('+TL_ONLINE_COMPONENTS.length+' online, '+TL_OFFLINE_COMPONENTS.length+' no contact)</div>';
  h += '<div class="tl-comp-table">';

  // Header
  h += '<div class="tl-comp-thead">';
  h += '<span style="flex:1;">Component</span>';
  h += '<span style="width:68px;flex-shrink:0;text-align:right;">Last seen</span>';
  h += '<span style="width:44px;flex-shrink:0;text-align:center;">Errors</span>';
  h += '<span style="width:80px;flex-shrink:0;text-align:right;">Reading</span>';
  h += '</div>';

  // Online rows
  TL_ONLINE_COMPONENTS.forEach(function(c, i) {
    var lastSeen = c.detail ? c.detail[0][1] : '—';
    var errors   = c.detail ? parseInt(c.detail[2][1]) : 0;
    var errCls   = errors > 0 ? 'has-errors' : 'no-errors';
    h += '<div class="tl-comp-row'+(i%2===1?' alt':'')+'">';
    h += '<span class="tl-comp-name"><span class="tl-card-dot" style="background:'+c.dot+';flex-shrink:0;"></span>'+tlEsc(c.name)+'</span>';
    h += '<span class="tl-comp-seen">'+tlEsc(lastSeen)+'</span>';
    h += '<span class="tl-comp-errors '+errCls+'">';
    if (errors > 0) {
      h += '<button class="tl-err-link" onclick="tlDrillErrors(\''+tlEsc(c.name)+'\')">'+errors+'</button>';
    } else {
      h += '0';
    }
    h += '</span>';
    h += '<span class="tl-comp-status" style="color:var(--strong);font-weight:500;">'+tlEsc(c.value)+'</span>';
    h += '</div>';
  });

  // Offline rows
  TL_OFFLINE_COMPONENTS.forEach(function(name, i) {
    var alt = (TL_ONLINE_COMPONENTS.length + i) % 2 === 1;
    h += '<div class="tl-comp-row'+(alt?' alt':'')+'">';
    h += '<span class="tl-comp-name"><span class="tl-card-dot" style="background:rgba(54,50,45,0.18);flex-shrink:0;"></span>'+tlEsc(name)+'</span>';
    h += '<span class="tl-comp-seen" style="color:rgba(54,50,45,0.25);">—</span>';
    h += '<span class="tl-comp-errors no-errors" style="color:rgba(54,50,45,0.25);">—</span>';
    h += '<span class="tl-comp-status no-contact">No Contact</span>';
    h += '</div>';
  });

  h += '</div></div>';
  return h;
}

function tlRenderStructured(row) {
  var p = tlGetPayload(row);
  var inner;
  if (row.type==='Event' && row.sub==='SystemStatus' && p.event && p.event.system_status) {
    inner = tlRenderSystemStatusReal(row, p);
  } else if (row.type==='Event' && (row.sub==='StartUp'||row.sub==='Shutdown'||row.sub==='SystemStatus')) {
    var shutdownType = p.event && p.event.startup ? p.event.startup.previousShutdownType
                     : p.event && p.event.shutdown ? p.event.shutdown.shutdownType
                     : null;
    inner = tlRenderSystemStatus(row, tlFmtDT(p.time.seconds), shutdownType);
  } else if (row.type==='Event' && row.sub==='TruckHealth')     { inner = tlRenderTruckHealth(row, p); }
  else if (row.type==='Event' && row.sub==='FluidError')        { inner = tlRenderFluidError(row, p); }
  else if (row.type==='Identity')                               { inner = tlRenderIdentity(row, p); }
  else if (row.type==='Event' && row.sub==='TicketReceived')    { inner = tlRenderTicketReceived(row, p); }
  else if (row.type==='Event' && row.sub==='DriverAction')      { inner = tlRenderDriverAction(row, p); }
  else if (row.type==='Event' && row.sub==='ConcreteStatus')    { inner = tlRenderConcreteStatus(row, p); }
  else if (row.type==='Event' && row.sub==='FluidAdd')          { inner = tlRenderFluidAdd(row, p); }
  else if (row.type==='BackendRequest')                         { inner = tlRenderBackend(row, p); }
  else if (row.type==='DeviceBinding')                          { inner = tlRenderDeviceBinding(row, p); }
  else if (row.type==='WirelessDrumBinding')                    { inner = tlRenderWireless(row, p); }
  else { inner = tlRenderGeneric(row); }
  return '<div class="tl-detail-body">' + inner + '</div>';
}

/* ── Raw JSON ── */
var tlRS={q:'',m:[],a:0};
function tlHlJson(j){var e=j.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');return e.replace(/(\"(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*\"(\s*:)?|\b(true|false|null)\b|-?[\d.]+([eE][+-]?\d+)?)/g,function(m){var c='jn';if(/^"/.test(m))c=/:$/.test(m)?'jk':'js';else if(/true|false/.test(m))c='jb';else if(/null/.test(m))c='jnu';return'<span class="'+c+'">'+m+'</span>';});}
function tlRenderRaw(row){tlRS={q:'',m:[],a:0};var j=JSON.stringify(tlGetPayload(row),null,2);return '<div class="tl-detail-body" style="flex:1;min-height:0;"><div class="tl-raw-wrap"><div class="tl-raw-search"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="rgba(54,50,45,0.5)" stroke-width="1.3"/><line x1="8.5" y1="8.5" x2="11.5" y2="11.5" stroke="rgba(54,50,45,0.5)" stroke-width="1.3" stroke-linecap="round"/></svg><input type="text" placeholder="Search JSON" autocomplete="off" oninput="tlRSUpdate(this.value)" onkeydown="tlRSKey(event)"><span class="tl-raw-count" id="tl-rc"></span><button class="tl-raw-nav" onclick="tlRSStep(-1)"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 7.5L6 4.5L9 7.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="tl-raw-nav" onclick="tlRSStep(1)"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div><div class="tl-raw-block" id="tl-rb">'+tlHlJson(j)+'</div></div></div>';}
function tlRSUpdate(q){tlRS.q=q;tlRS.a=0;tlRSApply();}
function tlRSApply(){var b=document.getElementById('tl-rb'),c=document.getElementById('tl-rc');if(!b||!c)return;b.querySelectorAll('mark.tl-hi').forEach(function(m){m.replaceWith(document.createTextNode(m.textContent));});b.normalize();var q=tlRS.q.toLowerCase();if(!q){tlRS.m=[];c.textContent='';return;}var w=document.createTreeWalker(b,NodeFilter.SHOW_TEXT);var ns=[];var n;while((n=w.nextNode()))ns.push(n);var ms=[];ns.forEach(function(tn){var t=tn.nodeValue,l=t.toLowerCase(),i=0,f,e=0,fr=document.createDocumentFragment();while((f=l.indexOf(q,i))!==-1){if(f>e)fr.appendChild(document.createTextNode(t.slice(e,f)));var m=document.createElement('mark');m.className='tl-hi';m.textContent=t.slice(f,f+q.length);fr.appendChild(m);ms.push(m);e=f+q.length;i=e;}if(e>0){if(e<t.length)fr.appendChild(document.createTextNode(t.slice(e)));tn.parentNode.replaceChild(fr,tn);}});tlRS.m=ms;if(!ms.length){c.textContent='No results';return;}if(tlRS.a>=ms.length)tlRS.a=0;tlRSHL();}
function tlRSHL(){var ms=tlRS.m,a=tlRS.a,c=document.getElementById('tl-rc');ms.forEach(function(m,i){m.classList.toggle('active',i===a);});if(ms.length){c.textContent=(a+1)+' of '+ms.length;ms[a].scrollIntoView({block:'nearest',behavior:'smooth'});}}
function tlRSStep(d){if(!tlRS.m.length)return;tlRS.a=(tlRS.a+d+tlRS.m.length)%tlRS.m.length;tlRSHL();}
function tlRSKey(e){if(e.key==='Enter'){e.preventDefault();tlRSStep(e.shiftKey?-1:1);}else if(e.key==='Escape'){e.target.value='';tlRSUpdate('');}}


/* tlToggleCard — shared expand/collapse for tl-card elements */
function tlToggleCard(id) {
  var c = document.getElementById(id);
  if (c) c.classList.toggle('open');
}

/* ════════════════════════════════════════════════════════════════ */

function renderDetailContent(tab) {
  const area = document.getElementById('detail-scroll');
  if (!area) return;
  area.scrollTop = 0;
  const row = TL_ROWS[activeLogIdx];
  if (!row) return;
  if (tab === 'structured') {
    area.innerHTML = tlRenderStructured(row);
  } else {
    area.innerHTML = tlRenderRaw(row);
  }
}

function toggleDrawerNav() {
  const dd = document.getElementById('drawer-nav-dropdown');
  const chevron = document.getElementById('drawer-nav-chevron');
  const isOpen = dd.style.display === 'none';
  dd.style.display = isOpen ? 'block' : 'none';
  chevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
}

function selectDrawerNav(label, el) {
  document.getElementById('drawer-nav-label').textContent = label;
  document.querySelectorAll('#drawer-nav-dropdown .wts-option').forEach(o => {
    o.classList.remove('wts-active');
    o.querySelector('.wts-check').style.visibility = 'hidden';
  });
  /* el may be omitted when called programmatically — find matching option by text */
  const target = el || Array.from(document.querySelectorAll('#drawer-nav-dropdown .wts-option'))
    .find(o => o.textContent.trim().includes(label));
  if (target) {
    target.classList.add('wts-active');
    target.querySelector('.wts-check').style.visibility = 'visible';
  }
  document.getElementById('drawer-nav-dropdown').style.display = 'none';
  document.getElementById('drawer-nav-chevron').style.transform = 'rotate(0deg)';

  /* switch drawer content state */
  const showList       = label === 'Truck Logs';
  const showComponents = label === 'Components Overview';
  const showManual     = label === 'Manual Control';
  const showTimeline   = label === 'Component Timeline';
  const showConfig     = label === 'Configuration';
  const showSensor     = label === 'Sensor';
  document.getElementById('state-list').style.display       = showList       ? 'flex' : 'none';
  document.getElementById('state-detail').style.display     = 'none';
  document.getElementById('state-components').style.display = showComponents ? 'flex' : 'none';
  if (showComponents) renderMobileCards();
  document.getElementById('state-manual').style.display     = showManual     ? 'flex' : 'none';
  if (showManual) initMcCards();
  document.getElementById('state-timeline').style.display   = showTimeline   ? 'flex' : 'none';
  document.getElementById('state-config').style.display     = showConfig     ? 'flex' : 'none';
  document.getElementById('state-sensor').style.display     = showSensor     ? 'flex' : 'none';
  document.getElementById('state-unlinked').style.display   = 'none';
  if (showSensor) { senStart(); } else { senStop(); }

  /* swap right pill */
  document.getElementById('filters-pill').style.display = showList                                       ? 'flex' : 'none';
  document.getElementById('ping-pill').style.display    = (showComponents || showManual || showTimeline) ? 'flex' : 'none';
  document.getElementById('update-pill').style.display  = showConfig                                     ? 'flex' : 'none';
}

/* close drawer nav dropdown on outside click */
document.addEventListener('click', function(e) {
  const btn = document.getElementById('drawer-nav-btn');
  const dd  = document.getElementById('drawer-nav-dropdown');
  if (btn && dd && !btn.contains(e.target) && !dd.contains(e.target)) {
    dd.style.display = 'none';
    const ch = document.getElementById('drawer-nav-chevron');
    if (ch) ch.style.transform = 'rotate(0deg)';
  }
  /* also close utab dropdown */
  const ubtn = document.getElementById('utab-nav-btn');
  const udd  = document.getElementById('utab-nav-dropdown');
  if (ubtn && udd && !ubtn.contains(e.target) && !udd.contains(e.target)) {
    udd.style.display = 'none';
    const uch = document.getElementById('utab-nav-chev');
    if (uch) uch.style.transform = '';
  }
});


/* ── COMPONENT TIMELINE DATA ────────────────────── */
const TIMELINE_DATA = {
  /* Truck 6456 — full 7-day history */
  '6456': {
    days: [
      { lbl:'Mon', num:'13', bar:'#ffba0d' },
      { lbl:'Tue', num:'14', bar:'#ffba0d' },
      { lbl:'Wed', num:'14', bar:'#d70100' },
      { lbl:'Thu', num:'15', bar:'#d70100' },
      { lbl:'Fri', num:'16', bar:'#d70100' },
      { lbl:'Sat', num:'17', bar:'#d70100' },
      { lbl:'Today', num:'18', bar:'#d70100' },
    ],
    activeDay: 6,
    dates: ['Mon 3/13/2026','Tue 3/14/2026','Wed 3/14/2026','Thu 3/15/2026','Fri 3/16/2026','Sat 3/17/2026','Today 3/24/2026'],
    /* Per-day component data — index matches days array */
    byDay: [
      /* 0: Mon 13 — mostly clean, one Iox warning resolved */
      [
        { name:'TCG', dot:'#ffba0d', events:[
          { type:'warn', time:'11:20 - 11:45', sub:'Warning · 25 min (resolved)' },
        ]},
        { name:'Charge',      dot:'#2ecf1d', events:[] },
        { name:'Discharge',   dot:'#2ecf1d', events:[] },
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#2ecf1d', events:[] },
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#2ecf1d', events:[] },
        { name:'CWR',         dot:'#2ecf1d', events:[] },
        { name:'WDS',         dot:'#2ecf1d', events:[] },
      ],
      /* 1: Tue 14 — warnings on Charge + Discharge, both resolved */
      [
        { name:'TCG', dot:'#2ecf1d', events:[] },
        { name:'Charge',      dot:'#ffba0d', events:[
          { type:'warn', time:'08:30 - 09:15', sub:'Warning · 45 min (resolved)' },
          { type:'warn', time:'13:00 - 13:30', sub:'Warning · 30 min (resolved)' },
        ]},
        { name:'Discharge',   dot:'#ffba0d', events:[
          { type:'warn', time:'10:00 - 10:20', sub:'Warning · 20 min (resolved)' },
        ]},
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#2ecf1d', events:[] },
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#2ecf1d', events:[] },
        { name:'CWR',         dot:'#2ecf1d', events:[] },
        { name:'WDS',         dot:'#2ecf1d', events:[] },
      ],
      /* 2: Wed 14 — CWR first alarm + Iox warning */
      [
        { name:'TCG', dot:'#ffba0d', events:[
          { type:'warn', time:'07:50 - 08:30', sub:'Warning · 40 min (resolved)' },
        ]},
        { name:'Charge',      dot:'#2ecf1d', events:[] },
        { name:'Discharge',   dot:'#2ecf1d', events:[] },
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#2ecf1d', events:[] },
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#2ecf1d', events:[] },
        { name:'CWR',         dot:'#d70100', events:[
          { type:'alarm', time:'14:10 - 16:55', sub:'Alarm · 2h 45m (resolved)' },
        ]},
        { name:'WDS',         dot:'#2ecf1d', events:[] },
      ],
      /* 3: Thu 15 — CWR alarm resumes + WDS alarm first appears + Bus Power warnings */
      [
        { name:'TCG', dot:'#ffba0d', events:[
          { type:'warn', time:'09:00 - 09:25', sub:'Warning · 25 min (resolved)' },
        ]},
        { name:'Charge',      dot:'#ffba0d', events:[
          { type:'warn', time:'07:30 - 08:15', sub:'Warning · 45 min (resolved)' },
        ]},
        { name:'Discharge',   dot:'#2ecf1d', events:[] },
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#2ecf1d', events:[] },
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#ffba0d', events:[
          { type:'warn', time:'11:00 - 11:40', sub:'Warning · 40 min (resolved)' },
          { type:'warn', time:'14:30 - 15:05', sub:'Warning · 35 min (resolved)' },
        ]},
        { name:'CWR',         dot:'#d70100', events:[
          { type:'alarm', time:'05:30 - 09:45', sub:'Alarm · 4h 15m (resolved)' },
          { type:'alarm', time:'12:00 - 13:20', sub:'Alarm · 1h 20m (resolved)' },
        ]},
        { name:'WDS',         dot:'#d70100', events:[
          { type:'alarm', time:'08:24 - 16:00', sub:'Alarm · 7h 36m (resolved)' },
        ]},
      ],
      /* 4: Fri 16 — escalating: Int. Display + Bus Power alarms, CWR all day, WDS persists */
      [
        { name:'TCG', dot:'#ffba0d', events:[
          { type:'warn', time:'08:10 - 08:30', sub:'Warning · 20 min' },
          { type:'warn', time:'13:45 - 14:05', sub:'Warning · 20 min' },
        ]},
        { name:'Charge',      dot:'#ffba0d', events:[
          { type:'warn', time:'06:00 - 07:30', sub:'Warning · 1h 30m' },
        ]},
        { name:'Discharge',   dot:'#ffba0d', events:[
          { type:'warn', time:'09:15 - 10:00', sub:'Warning · 45 min' },
        ]},
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#d70100', events:[
          { type:'alarm', time:'09:00 - 11:30', sub:'Alarm · 2h 30m' },
          { type:'alarm', time:'13:00 - 16:45', sub:'Alarm · 3h 45m' },
        ]},
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#d70100', events:[
          { type:'alarm', time:'07:15 - 17:00', sub:'Alarm · 9h 45m (all day)' },
        ]},
        { name:'CWR',         dot:'#d70100', events:[
          { type:'alarm', time:'05:00 - 17:00', sub:'Alarm · 12h (all day)' },
        ]},
        { name:'WDS',         dot:'#d70100', events:[
          { type:'alarm', time:'08:24 - 17:00', sub:'Alarm · 8h 36m' },
        ]},
      ],
      /* 5: Sat 17 — sustained alarms, all major components affected */
      [
        { name:'TCG', dot:'#ffba0d', events:[
          { type:'warn', time:'08:10 - 08:30', sub:'Warning · 20 min' },
          { type:'warn', time:'13:45 - 14:05', sub:'Warning · 20 min' },
        ]},
        { name:'Charge',      dot:'#ffba0d', events:[
          { type:'warn', time:'06:00 - 07:30', sub:'Warning · 1h 30m' },
        ]},
        { name:'Discharge',   dot:'#ffba0d', events:[
          { type:'warn', time:'09:15 - 10:00', sub:'Warning · 45 min' },
        ]},
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#d70100', events:[
          { type:'alarm', time:'07:00 - 09:45', sub:'Alarm · 2h 45m' },
          { type:'alarm', time:'11:00 - 12:30', sub:'Alarm · 1h 30m' },
          { type:'alarm', time:'14:00 - 17:00', sub:'Alarm · 3h' },
        ]},
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#d70100', events:[
          { type:'alarm', time:'06:30 - 09:00', sub:'Alarm · 2h 30m' },
          { type:'alarm', time:'10:00 - 12:00', sub:'Alarm · 2h' },
          { type:'alarm', time:'13:00 - 17:00', sub:'Alarm · 4h' },
        ]},
        { name:'CWR',         dot:'#d70100', events:[
          { type:'alarm', time:'05:00 - 17:00', sub:'Alarm · 12h (all day)' },
        ]},
        { name:'WDS',         dot:'#d70100', events:[
          { type:'alarm', time:'08:24 - 17:00', sub:'Alarm · 8h 36m' },
        ]},
      ],
      /* 6: Today 18 — full active state, WDS unresolved + ongoing */
      [
        { name:'TCG', dot:'#ffba0d', events:[
          { type:'warn', time:'08:10 - 08:30', sub:'Warning · 20 min' },
          { type:'warn', time:'13:45 - 14:05', sub:'Warning · 20 min' },
        ]},
        { name:'Charge',      dot:'#ffba0d', events:[
          { type:'warn', time:'06:00 - 07:30', sub:'Warning · 1h 30m' },
        ]},
        { name:'Discharge',   dot:'#ffba0d', events:[
          { type:'warn', time:'09:15 - 10:00', sub:'Warning · 45 min' },
        ]},
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#d70100', events:[
          { type:'alarm', time:'07:00 - 09:45', sub:'Alarm · 2h 45m' },
          { type:'alarm', time:'11:00 - 12:30', sub:'Alarm · 1h 30m' },
          { type:'alarm', time:'14:00 - 15:00', sub:'Alarm · 1h' },
        ]},
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#d70100', events:[
          { type:'alarm', time:'06:30 - 09:00', sub:'Alarm · 2h 30m' },
          { type:'alarm', time:'10:00 - 12:00', sub:'Alarm · 2h' },
          { type:'alarm', time:'13:00 - 14:44', sub:'Alarm · 1h 44m' },
        ]},
        { name:'CWR',         dot:'#d70100', events:[
          { type:'alarm', time:'05:00 - 06:10', sub:'Alarm · 1h 10m' },
          { type:'alarm', time:'07:00 - 08:30', sub:'Alarm · 1h 30m' },
          { type:'alarm', time:'09:00 - 10:06', sub:'Alarm · 1h 6m' },
          { type:'alarm', time:'11:00 - 12:00', sub:'Alarm · 1h' },
          { type:'alarm', time:'13:00 - 13:45', sub:'Alarm · 45m' },
          { type:'alarm', time:'14:30 - 15:25', sub:'Alarm · 55m' },
          { type:'alarm', time:'16:00 - 16:30', sub:'Alarm · 30m' },
        ]},
        { name:'WDS',         dot:'#d70100', events:[
          { type:'alarm', time:'08:24 - ongoing', sub:'Alarm · ongoing — no signal' },
        ]},
      ],
    ]  // end byDay
  },
  /* Default for any other truck — clean today, some warnings earlier in week */
  /* ── Truck 39821 — WDS ongoing, CWR intermittent, mostly stable */
  '39821': {
    days: [
      { lbl:'Mon', num:'13', bar:'#2ecf1d' },
      { lbl:'Tue', num:'14', bar:'#2ecf1d' },
      { lbl:'Wed', num:'14', bar:'#2ecf1d' },
      { lbl:'Thu', num:'15', bar:'#ffba0d' },
      { lbl:'Fri', num:'16', bar:'#ffba0d' },
      { lbl:'Sat', num:'17', bar:'#2ecf1d' },
      { lbl:'Today', num:'18', bar:'#d70100' },
    ],
    activeDay: 6,
    dates: ['Mon 3/13/2026','Tue 3/14/2026','Wed 3/14/2026','Thu 3/15/2026','Fri 3/16/2026','Sat 3/17/2026','Today 3/24/2026'],
    byDay: [
      /* 0: Mon — clean */
      [
        { name:'TCG', dot:'#2ecf1d', events:[] },
        { name:'Charge',      dot:'#2ecf1d', events:[] },
        { name:'Discharge',   dot:'#2ecf1d', events:[] },
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#2ecf1d', events:[] },
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#2ecf1d', events:[] },
        { name:'CWR',         dot:'#2ecf1d', events:[] },
        { name:'WDS',         dot:'#2ecf1d', events:[] },
      ],
      /* 1: Tue — clean */
      [
        { name:'TCG', dot:'#2ecf1d', events:[] },
        { name:'Charge',      dot:'#2ecf1d', events:[] },
        { name:'Discharge',   dot:'#2ecf1d', events:[] },
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#2ecf1d', events:[] },
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#2ecf1d', events:[] },
        { name:'CWR',         dot:'#2ecf1d', events:[] },
        { name:'WDS',         dot:'#2ecf1d', events:[] },
      ],
      /* 2: Wed — clean */
      [
        { name:'TCG', dot:'#2ecf1d', events:[] },
        { name:'Charge',      dot:'#2ecf1d', events:[] },
        { name:'Discharge',   dot:'#2ecf1d', events:[] },
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#2ecf1d', events:[] },
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#2ecf1d', events:[] },
        { name:'CWR',         dot:'#2ecf1d', events:[] },
        { name:'WDS',         dot:'#2ecf1d', events:[] },
      ],
      /* 3: Thu — Drum RPM warnings */
      [
        { name:'TCG', dot:'#2ecf1d', events:[] },
        { name:'Charge',      dot:'#2ecf1d', events:[] },
        { name:'Discharge',   dot:'#2ecf1d', events:[] },
        { name:'Drum',        dot:'#ffba0d', events:[
          { type:'warn', time:'07:15 - 08:00', sub:'Warning · 45 min (resolved)' },
          { type:'warn', time:'11:30 - 12:10', sub:'Warning · 40 min (resolved)' },
        ]},
        { name:'Int. Display',dot:'#2ecf1d', events:[] },
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#2ecf1d', events:[] },
        { name:'CWR',         dot:'#2ecf1d', events:[] },
        { name:'WDS',         dot:'#2ecf1d', events:[] },
      ],
      /* 4: Fri — Drum warning continues, CWR brief warning */
      [
        { name:'TCG', dot:'#2ecf1d', events:[] },
        { name:'Charge',      dot:'#2ecf1d', events:[] },
        { name:'Discharge',   dot:'#2ecf1d', events:[] },
        { name:'Drum',        dot:'#ffba0d', events:[
          { type:'warn', time:'09:00 - 09:45', sub:'Warning · 45 min (resolved)' },
        ]},
        { name:'Int. Display',dot:'#2ecf1d', events:[] },
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#2ecf1d', events:[] },
        { name:'CWR',         dot:'#ffba0d', events:[
          { type:'warn', time:'13:20 - 13:55', sub:'Warning · 35 min (resolved)' },
        ]},
        { name:'WDS',         dot:'#2ecf1d', events:[] },
      ],
      /* 5: Sat — clean */
      [
        { name:'TCG', dot:'#2ecf1d', events:[] },
        { name:'Charge',      dot:'#2ecf1d', events:[] },
        { name:'Discharge',   dot:'#2ecf1d', events:[] },
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#2ecf1d', events:[] },
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#2ecf1d', events:[] },
        { name:'CWR',         dot:'#2ecf1d', events:[] },
        { name:'WDS',         dot:'#2ecf1d', events:[] },
      ],
      /* 6: Today — WDS alarm active, no other issues */
      [
        { name:'TCG', dot:'#2ecf1d', events:[] },
        { name:'Charge',      dot:'#2ecf1d', events:[] },
        { name:'Discharge',   dot:'#2ecf1d', events:[] },
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#2ecf1d', events:[] },
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#2ecf1d', events:[] },
        { name:'CWR',         dot:'#2ecf1d', events:[] },
        { name:'WDS',         dot:'#d70100', events:[
          { type:'alarm', time:'08:24 - ongoing', sub:'Alarm · ongoing — no signal' },
        ]},
      ],
    ]
  },

  /* ── Truck 45689 — major water system issues all week */
  '45689': {
    days: [
      { lbl:'Mon', num:'13', bar:'#ffba0d' },
      { lbl:'Tue', num:'14', bar:'#d70100' },
      { lbl:'Wed', num:'14', bar:'#d70100' },
      { lbl:'Thu', num:'15', bar:'#d70100' },
      { lbl:'Fri', num:'16', bar:'#d70100' },
      { lbl:'Sat', num:'17', bar:'#d70100' },
      { lbl:'Today', num:'18', bar:'#d70100' },
    ],
    activeDay: 6,
    dates: ['Mon 3/13/2026','Tue 3/14/2026','Wed 3/14/2026','Thu 3/15/2026','Fri 3/16/2026','Sat 3/17/2026','Today 3/24/2026'],
    byDay: [
      /* 0: Mon — Charge warnings, early signs */
      [
        { name:'TCG', dot:'#2ecf1d', events:[] },
        { name:'Charge',      dot:'#ffba0d', events:[
          { type:'warn', time:'09:00 - 09:40', sub:'Warning · 40 min (resolved)' },
          { type:'warn', time:'14:15 - 15:00', sub:'Warning · 45 min (resolved)' },
        ]},
        { name:'Discharge',   dot:'#2ecf1d', events:[] },
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#2ecf1d', events:[] },
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#2ecf1d', events:[] },
        { name:'CWR',         dot:'#2ecf1d', events:[] },
        { name:'WDS',         dot:'#2ecf1d', events:[] },
      ],
      /* 1: Tue — Charge alarm starts, Discharge warning */
      [
        { name:'TCG', dot:'#2ecf1d', events:[] },
        { name:'Charge',      dot:'#d70100', events:[
          { type:'alarm', time:'06:00 - 17:00', sub:'Alarm · 11h (all day)' },
        ]},
        { name:'Discharge',   dot:'#ffba0d', events:[
          { type:'warn', time:'10:30 - 11:15', sub:'Warning · 45 min (resolved)' },
        ]},
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#2ecf1d', events:[] },
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#2ecf1d', events:[] },
        { name:'CWR',         dot:'#2ecf1d', events:[] },
        { name:'WDS',         dot:'#2ecf1d', events:[] },
      ],
      /* 2: Wed — Charge + Discharge both alarming */
      [
        { name:'TCG', dot:'#2ecf1d', events:[] },
        { name:'Charge',      dot:'#d70100', events:[
          { type:'alarm', time:'05:30 - 17:00', sub:'Alarm · 11h 30m (all day)' },
        ]},
        { name:'Discharge',   dot:'#d70100', events:[
          { type:'alarm', time:'08:00 - 14:30', sub:'Alarm · 6h 30m' },
        ]},
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#2ecf1d', events:[] },
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#ffba0d', events:[
          { type:'warn', time:'11:00 - 11:30', sub:'Warning · 30 min (resolved)' },
        ]},
        { name:'CWR',         dot:'#2ecf1d', events:[] },
        { name:'WDS',         dot:'#2ecf1d', events:[] },
      ],
      /* 3: Thu — escalating */
      [
        { name:'TCG', dot:'#ffba0d', events:[
          { type:'warn', time:'07:00 - 07:40', sub:'Warning · 40 min' },
        ]},
        { name:'Charge',      dot:'#d70100', events:[
          { type:'alarm', time:'05:30 - 17:00', sub:'Alarm · 11h 30m (all day)' },
        ]},
        { name:'Discharge',   dot:'#d70100', events:[
          { type:'alarm', time:'06:00 - 17:00', sub:'Alarm · 11h (all day)' },
        ]},
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#d70100', events:[
          { type:'alarm', time:'09:30 - 12:00', sub:'Alarm · 2h 30m' },
        ]},
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#ffba0d', events:[
          { type:'warn', time:'10:00 - 10:45', sub:'Warning · 45 min' },
          { type:'warn', time:'14:00 - 14:30', sub:'Warning · 30 min' },
        ]},
        { name:'CWR',         dot:'#2ecf1d', events:[] },
        { name:'WDS',         dot:'#2ecf1d', events:[] },
      ],
      /* 4: Fri */
      [
        { name:'TCG', dot:'#ffba0d', events:[
          { type:'warn', time:'08:10 - 08:50', sub:'Warning · 40 min' },
        ]},
        { name:'Charge',      dot:'#d70100', events:[
          { type:'alarm', time:'05:30 - 17:00', sub:'Alarm · 11h 30m (all day)' },
        ]},
        { name:'Discharge',   dot:'#d70100', events:[
          { type:'alarm', time:'06:00 - 17:00', sub:'Alarm · 11h (all day)' },
        ]},
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#d70100', events:[
          { type:'alarm', time:'07:00 - 09:30', sub:'Alarm · 2h 30m' },
          { type:'alarm', time:'11:00 - 13:00', sub:'Alarm · 2h' },
        ]},
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#d70100', events:[
          { type:'alarm', time:'09:00 - 17:00', sub:'Alarm · 8h (all day)' },
        ]},
        { name:'CWR',         dot:'#2ecf1d', events:[] },
        { name:'WDS',         dot:'#2ecf1d', events:[] },
      ],
      /* 5: Sat */
      [
        { name:'TCG', dot:'#ffba0d', events:[
          { type:'warn', time:'08:10 - 08:50', sub:'Warning · 40 min' },
        ]},
        { name:'Charge',      dot:'#d70100', events:[
          { type:'alarm', time:'05:30 - 17:00', sub:'Alarm · 11h 30m (all day)' },
        ]},
        { name:'Discharge',   dot:'#d70100', events:[
          { type:'alarm', time:'06:00 - 17:00', sub:'Alarm · 11h (all day)' },
        ]},
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#d70100', events:[
          { type:'alarm', time:'07:00 - 09:30', sub:'Alarm · 2h 30m' },
          { type:'alarm', time:'11:00 - 13:00', sub:'Alarm · 2h' },
          { type:'alarm', time:'15:00 - 17:00', sub:'Alarm · 2h' },
        ]},
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#d70100', events:[
          { type:'alarm', time:'06:30 - 17:00', sub:'Alarm · 10h 30m (all day)' },
        ]},
        { name:'CWR',         dot:'#2ecf1d', events:[] },
        { name:'WDS',         dot:'#2ecf1d', events:[] },
      ],
      /* 6: Today */
      [
        { name:'TCG', dot:'#ffba0d', events:[
          { type:'warn', time:'07:30 - 08:10', sub:'Warning · 40 min' },
          { type:'warn', time:'12:00 - 12:25', sub:'Warning · 25 min' },
        ]},
        { name:'Charge',      dot:'#d70100', events:[
          { type:'alarm', time:'05:30 - ongoing', sub:'Alarm · ongoing (all day)' },
        ]},
        { name:'Discharge',   dot:'#d70100', events:[
          { type:'alarm', time:'06:00 - ongoing', sub:'Alarm · ongoing (all day)' },
        ]},
        { name:'Drum',        dot:'#2ecf1d', events:[] },
        { name:'Int. Display',dot:'#d70100', events:[
          { type:'alarm', time:'07:00 - 09:30', sub:'Alarm · 2h 30m' },
          { type:'alarm', time:'11:00 - 12:30', sub:'Alarm · 1h 30m' },
          { type:'alarm', time:'14:00 - ongoing', sub:'Alarm · ongoing' },
        ]},
        { name:'Ext. Display',dot:'#2ecf1d', events:[] },
        { name:'Bus Power',   dot:'#d70100', events:[
          { type:'alarm', time:'06:30 - ongoing', sub:'Alarm · ongoing (all day)' },
        ]},
        { name:'CWR',         dot:'#2ecf1d', events:[] },
        { name:'WDS',         dot:'#2ecf1d', events:[] },
      ],
    ]
  },

  /* ── Default for any other truck — minor issues mid-week, clean today */
  'default': {
    days: [
      { lbl:'Mon', num:'13', bar:'#2ecf1d' },
      { lbl:'Tue', num:'14', bar:'#2ecf1d' },
      { lbl:'Wed', num:'14', bar:'#ffba0d' },
      { lbl:'Thu', num:'15', bar:'#ffba0d' },
      { lbl:'Fri', num:'16', bar:'#2ecf1d' },
      { lbl:'Sat', num:'17', bar:'#2ecf1d' },
      { lbl:'Today', num:'18', bar:'#2ecf1d' },
    ],
    activeDay: 6,
    dates: ['Mon 3/13/2026','Tue 3/14/2026','Wed 3/14/2026','Thu 3/15/2026','Fri 3/16/2026','Sat 3/17/2026','Today 3/24/2026'],
    byDay: [
      /* 0 */ [
        { name:'TCG', dot:'#2ecf1d', events:[] },{ name:'Charge', dot:'#2ecf1d', events:[] },
        { name:'Discharge', dot:'#2ecf1d', events:[] },{ name:'Drum', dot:'#2ecf1d', events:[] },
        { name:'Int. Display', dot:'#2ecf1d', events:[] },{ name:'Ext. Display', dot:'#2ecf1d', events:[] },
        { name:'Bus Power', dot:'#2ecf1d', events:[] },{ name:'CWR', dot:'#2ecf1d', events:[] },{ name:'WDS', dot:'#2ecf1d', events:[] },
      ],
      /* 1 */ [
        { name:'TCG', dot:'#2ecf1d', events:[] },{ name:'Charge', dot:'#2ecf1d', events:[] },
        { name:'Discharge', dot:'#2ecf1d', events:[] },{ name:'Drum', dot:'#2ecf1d', events:[] },
        { name:'Int. Display', dot:'#2ecf1d', events:[] },{ name:'Ext. Display', dot:'#2ecf1d', events:[] },
        { name:'Bus Power', dot:'#2ecf1d', events:[] },{ name:'CWR', dot:'#2ecf1d', events:[] },{ name:'WDS', dot:'#2ecf1d', events:[] },
      ],
      /* 2 */ [
        { name:'TCG', dot:'#ffba0d', events:[{ type:'warn', time:'10:00 - 10:35', sub:'Warning · 35 min (resolved)' }]},
        { name:'Charge', dot:'#2ecf1d', events:[] },{ name:'Discharge', dot:'#2ecf1d', events:[] },
        { name:'Drum', dot:'#2ecf1d', events:[] },{ name:'Int. Display', dot:'#2ecf1d', events:[] },
        { name:'Ext. Display', dot:'#2ecf1d', events:[] },{ name:'Bus Power', dot:'#2ecf1d', events:[] },
        { name:'CWR', dot:'#2ecf1d', events:[] },{ name:'WDS', dot:'#2ecf1d', events:[] },
      ],
      /* 3 */ [
        { name:'TCG', dot:'#ffba0d', events:[{ type:'warn', time:'09:00 - 09:30', sub:'Warning · 30 min (resolved)' }]},
        { name:'Charge', dot:'#ffba0d', events:[{ type:'warn', time:'11:00 - 11:45', sub:'Warning · 45 min (resolved)' }]},
        { name:'Discharge', dot:'#2ecf1d', events:[] },{ name:'Drum', dot:'#2ecf1d', events:[] },
        { name:'Int. Display', dot:'#2ecf1d', events:[] },{ name:'Ext. Display', dot:'#2ecf1d', events:[] },
        { name:'Bus Power', dot:'#2ecf1d', events:[] },{ name:'CWR', dot:'#2ecf1d', events:[] },{ name:'WDS', dot:'#2ecf1d', events:[] },
      ],
      /* 4 */ [
        { name:'TCG', dot:'#2ecf1d', events:[] },{ name:'Charge', dot:'#2ecf1d', events:[] },
        { name:'Discharge', dot:'#2ecf1d', events:[] },{ name:'Drum', dot:'#2ecf1d', events:[] },
        { name:'Int. Display', dot:'#2ecf1d', events:[] },{ name:'Ext. Display', dot:'#2ecf1d', events:[] },
        { name:'Bus Power', dot:'#2ecf1d', events:[] },{ name:'CWR', dot:'#2ecf1d', events:[] },{ name:'WDS', dot:'#2ecf1d', events:[] },
      ],
      /* 5 */ [
        { name:'TCG', dot:'#2ecf1d', events:[] },{ name:'Charge', dot:'#2ecf1d', events:[] },
        { name:'Discharge', dot:'#2ecf1d', events:[] },{ name:'Drum', dot:'#2ecf1d', events:[] },
        { name:'Int. Display', dot:'#2ecf1d', events:[] },{ name:'Ext. Display', dot:'#2ecf1d', events:[] },
        { name:'Bus Power', dot:'#2ecf1d', events:[] },{ name:'CWR', dot:'#2ecf1d', events:[] },{ name:'WDS', dot:'#2ecf1d', events:[] },
      ],
      /* 6: Today — clean */ [
        { name:'TCG', dot:'#2ecf1d', events:[] },{ name:'Charge', dot:'#2ecf1d', events:[] },
        { name:'Discharge', dot:'#2ecf1d', events:[] },{ name:'Drum', dot:'#2ecf1d', events:[] },
        { name:'Int. Display', dot:'#2ecf1d', events:[] },{ name:'Ext. Display', dot:'#2ecf1d', events:[] },
        { name:'Bus Power', dot:'#2ecf1d', events:[] },{ name:'CWR', dot:'#2ecf1d', events:[] },{ name:'WDS', dot:'#2ecf1d', events:[] },
      ],
    ]
  }
};

let ctActiveDayIdx = 6;
let ctCurrentTruck = '6456';

function renderTimeline(truckNum) {
  ctCurrentTruck = truckNum;
  const data = TIMELINE_DATA[truckNum] || TIMELINE_DATA['default'];
  ctActiveDayIdx = data.activeDay;

  /* Day strip */
  const strip = document.getElementById('ct-strip');
  strip.innerHTML = data.days.map((d, i) => `
    <div class="ct-day ${i === ctActiveDayIdx ? 'ct-day-active' : ''}" onclick="ctSelectDay(${i})">
      <div class="ct-day-inner">
        <div class="ct-day-lbl">${d.lbl}</div>
        <div class="ct-day-num">${d.num}</div>
        <div class="ct-bar-wrap"><div class="ct-bar" style="background:${d.bar};"></div></div>
      </div>
    </div>`).join('');

  document.getElementById('ct-date-label').textContent = data.dates[ctActiveDayIdx];
  /* Use byDay if available, else fall back to components */
  const components = data.byDay ? data.byDay[ctActiveDayIdx] : data.components;
  renderCtList(components);
}

function ctSelectDay(idx) {
  const data = TIMELINE_DATA[ctCurrentTruck] || TIMELINE_DATA['default'];
  ctActiveDayIdx = idx;
  document.querySelectorAll('#ct-strip .ct-day').forEach((el, i) => {
    el.classList.toggle('ct-day-active', i === idx);
    /* resize bar on active: full width vs fixed 20px handled by CSS */
  });
  document.getElementById('ct-date-label').textContent = data.dates[idx];
  /* Use per-day data if available */
  const components = data.byDay ? data.byDay[idx] : data.components;
  renderCtList(components);
}

function ctNavDay(dir) {
  const data = TIMELINE_DATA[ctCurrentTruck] || TIMELINE_DATA['default'];
  const next = Math.max(0, Math.min(data.days.length - 1, ctActiveDayIdx + dir));
  ctSelectDay(next);
}

function renderCtList(components) {
  const list = document.getElementById('ct-list');
  list.innerHTML = components.map((comp, ci) => {
    const count = comp.events.length;
    const isAlarm = comp.events.some(e => e.type === 'alarm');
    const summary = count === 0 ? 'No Events' : ctSummary(comp.events);
    const eventsHtml = count === 0
      ? `<div class="ct-no-events">No events recorded for this component today.</div>`
      : comp.events.map((e, ei) => `
        <div class="ct-event" onclick="ctOpenEvent(${ci},${ei})">
          <div class="ct-event-left">
            <div class="ct-event-icon ${e.type === 'warn' ? 'ct-icon-warn' : 'ct-icon-alarm'}">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                ${e.type === 'warn'
                  ? '<path d="M5 1.5L9 8.5H1L5 1.5z" fill="none" stroke="#894f18" stroke-width="1" stroke-linejoin="round"/><path d="M5 4.5v1.5M5 7.2h.01" stroke="#894f18" stroke-width="1" stroke-linecap="round"/>'
                  : '<rect x="1" y="1" width="8" height="8" rx="1.5" stroke="#efadac" stroke-width="1"/><path d="M5 3.5v2M5 7h.01" stroke="#efadac" stroke-width="1" stroke-linecap="round"/>'}
              </svg>
            </div>
            <div>
              <div class="ct-event-time">${e.time}</div>
              <div class="ct-event-sub">${e.sub}</div>
            </div>
          </div>
          <svg class="ct-event-arrow" width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M1 1l6 6-6 6" stroke="#36322d9e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>`).join('');

    return `
      <div class="ct-row" id="ct-row-${ci}">
        <div class="ct-row-hdr" onclick="ctToggleRow(${ci})">
          <div class="ct-row-left">
            <div class="ct-row-dot" style="background:${comp.dot};"></div>
            <div class="ct-row-name">${comp.name}</div>
          </div>
          <div class="ct-row-right">
            <div class="ct-row-summary">${summary}</div>
            <svg class="ct-chev" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M10.5 6L6 1.5 1.5 6" stroke="#36322d9e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>
        <div class="ct-events" id="ct-events-${ci}">${eventsHtml}</div>
      </div>`;
  }).join('');

  /* Auto-expand first row that has events */
  const firstWithEvents = components.findIndex(c => c.events.length > 0);
  if (firstWithEvents >= 0) ctToggleRow(firstWithEvents, true);
}

function ctSummary(events) {
  const alarms  = events.filter(e => e.type === 'alarm').length;
  const warns   = events.filter(e => e.type === 'warn').length;
  /* parse total duration from sub strings */
  let totalMins = 0;
  events.forEach(e => {
    const m = e.sub.match(/(\d+)h\s*(\d+)?m?|(\d+)m/);
    if (m) {
      if (m[1]) totalMins += parseInt(m[1]) * 60 + parseInt(m[2] || 0);
      else if (m[3]) totalMins += parseInt(m[3]);
    }
  });
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const dur = hrs > 0 ? (mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`) : `${mins}m`;
  if (alarms > 0 && warns > 0) return `${alarms+warns} Events · ${dur} total`;
  if (alarms > 0) return `${alarms} ${alarms === 1 ? 'Alarm' : 'Alarms'} · ${dur} total`;
  return `${warns} ${warns === 1 ? 'Warning' : 'Warnings'} · ${dur} total`;
}

function ctToggleRow(ci, forceOpen) {
  const events = document.getElementById('ct-events-' + ci);
  const chev   = document.querySelector('#ct-row-' + ci + ' .ct-chev');
  if (!events) return;
  const open = forceOpen !== undefined ? forceOpen : !events.classList.contains('open');
  events.classList.toggle('open', open);
  chev.classList.toggle('open', open);
}

function ctOpenEvent(ci, ei) {
  /* Jump to Truck Logs showing the WDS log detail as a proxy */
  const logsOption = document.querySelector('#drawer-nav-dropdown .wts-option:nth-child(3)');
  selectDrawerNav('Truck Logs', logsOption);
  renderLogRows();
  setTimeout(() => openDetail(15), 50);
}


function toggleCfgAcc(idx) {
  const acc = document.getElementById('cfg-acc-' + idx);
  const body = acc.querySelector('.cfg-acc-body');
  const isOpen = acc.classList.contains('open');
  acc.classList.toggle('open', !isOpen);
  body.style.display = isOpen ? 'none' : 'block';
}

/* ── Mobile Config Edit/Save/Search ── */
let mobCfgMatches = [];
let mobCfgMatchIdx = -1;

function mobCfgStartEdit() {
  const container = document.getElementById('state-config');
  container.classList.add('mob-cfg-editing');
  /* Open all accordions */
  for (let i = 0; i < 8; i++) {
    const acc = document.getElementById('cfg-acc-' + i);
    if (!acc) continue;
    const body = acc.querySelector('.cfg-acc-body');
    acc.classList.add('open');
    if (body) body.style.display = 'block';
  }
  /* Hide the blue Update pill while editing */
  const pill = document.getElementById('update-pill');
  if (pill) pill.style.display = 'none';
  document.getElementById('mob-cfg-savebar').style.display = 'block';
}

function mobCfgSave() {
  mobCfgExitEdit();
  const btn = document.getElementById('mob-cfg-save-btn');
  if (btn) { btn.textContent = 'Saved ✓'; setTimeout(() => { btn.textContent = 'Save changes'; }, 1000); }
}

function mobCfgCancel() {
  /* Revert inputs to original values */
  document.querySelectorAll('#state-config .cfg-field input').forEach(el => {
    if (el.dataset.orig !== undefined) el.value = el.dataset.orig;
  });
  mobCfgExitEdit();
}

function mobCfgExitEdit() {
  const container = document.getElementById('state-config');
  container.classList.remove('mob-cfg-editing');
  /* Store orig values for future cancel */
  document.querySelectorAll('#state-config .cfg-field input').forEach(el => {
    el.dataset.orig = el.value;
  });
  /* Restore the blue Update pill */
  const pill = document.getElementById('update-pill');
  if (pill) pill.style.display = 'flex';
  document.getElementById('mob-cfg-savebar').style.display = 'none';
  /* Clear search */
  const searchEl = document.getElementById('mob-cfg-search');
  if (searchEl && searchEl.value) { searchEl.value = ''; mobCfgSearch(''); }
}

function mobCfgSearch(query) {
  const q = query.trim().toLowerCase();
  const nav = document.getElementById('mob-cfg-search-nav');
  const counter = document.getElementById('mob-cfg-search-count');
  mobCfgMatches = [];
  mobCfgMatchIdx = -1;

  /* Clear all highlights */
  document.querySelectorAll('#state-config .cfg-field').forEach(f => {
    f.classList.remove('mob-cfg-match', 'mob-cfg-match-active');
  });

  if (!q) {
    /* Restore default — only Information open */
    for (let i = 0; i < 8; i++) {
      const acc = document.getElementById('cfg-acc-' + i);
      if (!acc) continue;
      const body = acc.querySelector('.cfg-acc-body');
      const isFirst = i === 0;
      acc.classList.toggle('open', isFirst);
      if (body) body.style.display = isFirst ? 'block' : 'none';
    }
    if (nav) nav.style.display = 'none';
    return;
  }

  /* Search fields */
  for (let i = 0; i < 8; i++) {
    const acc = document.getElementById('cfg-acc-' + i);
    if (!acc) continue;
    const fields = acc.querySelectorAll('.cfg-field');
    let hasMatch = false;
    fields.forEach(field => {
      const label = field.querySelector('label');
      if (!label) return;
      if (label.textContent.toLowerCase().includes(q)) {
        hasMatch = true;
        field.classList.add('mob-cfg-match');
        mobCfgMatches.push(field);
      }
    });
    const body = acc.querySelector('.cfg-acc-body');
    if (hasMatch) { acc.classList.add('open'); if (body) body.style.display = 'block'; }
    else          { acc.classList.remove('open'); if (body) body.style.display = 'none'; }
  }

  if (nav) nav.style.display = mobCfgMatches.length ? 'flex' : 'none';
  if (mobCfgMatches.length) {
    mobCfgMatchIdx = 0;
    mobCfgHighlightActive();
    if (counter) counter.textContent = `1 of ${mobCfgMatches.length}`;
  } else {
    if (counter) counter.textContent = '0 results';
    if (nav) nav.style.display = 'flex';
  }
}

function mobCfgHighlightActive() {
  const counter = document.getElementById('mob-cfg-search-count');
  mobCfgMatches.forEach((f, i) => {
    f.classList.remove('mob-cfg-match-active');
    f.classList.add('mob-cfg-match');
    if (i === mobCfgMatchIdx) {
      f.classList.add('mob-cfg-match-active');
      f.scrollIntoView({ block:'nearest', behavior:'smooth' });
    }
  });
  if (counter && mobCfgMatches.length) counter.textContent = `${mobCfgMatchIdx + 1} of ${mobCfgMatches.length}`;
}

function mobCfgSearchStep(dir) {
  if (!mobCfgMatches.length) return;
  mobCfgMatchIdx = (mobCfgMatchIdx + dir + mobCfgMatches.length) % mobCfgMatches.length;
  mobCfgHighlightActive();
}

function mobCfgSearchKey(e) {
  if (e.key === 'ArrowDown') { e.preventDefault(); mobCfgSearchStep(1); }
  if (e.key === 'ArrowUp')   { e.preventDefault(); mobCfgSearchStep(-1); }
}

function toggleCfgSwitch(el) {
  el.classList.toggle('on');
}


function toggleCoSection(id, hdr) {
  const section = document.getElementById('co-section-' + id);
  const chev = hdr.querySelector('.co-acc-chev');
  const isOpen = section.style.display !== 'none';
  section.style.display = isOpen ? 'none' : 'block';
  chev.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
}

/* ════════════════════════════════════════
   MANUAL CONTROL — CARD SYSTEM
════════════════════════════════════════ */

/* ── CardInstance class ── */
class CardInstance {
  constructor(def, container) { this.def=def; this.container=container; this.activeScenarioIdx=0; this.phase='idle'; this.inputVal=''; this.render(); }
  get scenario() { return this.def.scenarios[this.activeScenarioIdx]; }
  selectScenario(idx) { this.activeScenarioIdx=idx; this.reset(); }
  reset() { this.phase='idle'; this.inputVal=''; this.render(); }
  render() {
    const card=this.container.querySelector('.mc-card'); const sc=this.scenario;
    card.style.transition='border-color 0.4s ease, box-shadow 0.4s ease';
    let content=card.querySelector('.card-content');
    if(!content){content=document.createElement('div');content.className='card-content';content.style.cssText='display:contents;';card.appendChild(content);}
    if(sc.isDisabled){card.className='mc-card state-disabled';content.innerHTML=this.buildDisabledHTML(sc.resolve());return;}
    const isOffStart=sc.isOffStart;
    const idleMetric=isOffStart?'Off':this.def.idleMetric;
    const idleBtnLabel=isOffStart?(this.def.title.includes('Propulsion')?'Turn On Propulsion':`Turn On ${this.def.title.replace('Reset ','').replace(' State','').replace(' Propulsion','')}`) :this.def.idleBtnLabel;
    const confirmBtnLabel=isOffStart?'Yes':this.def.confirmBtnLabel;
    const confirmLabel=isOffStart?this.def.confirmLabel.replace('turning off','turning on').replace('off','on'):this.def.confirmLabel;
    card.className='mc-card';content.innerHTML=this.buildIdleHTML(idleMetric,idleBtnLabel);this.wireIdle(idleBtnLabel,confirmLabel,confirmBtnLabel);
  }
  buildDisabledHTML(result){const def=this.def;return`<div class="card-header"><div class="signal-dot ${result.dotClass} anim-in"></div><span class="card-title anim-in anim-in-delay-1">${def.title}</span><span class="header-badge ${result.badge.cls} anim-in anim-in-delay-1">${result.badge.label}</span></div><div class="card-input-zone anim-in anim-in-delay-2"><span class="slot-pill ${result.inputContent.cls}"><span class="pdot"></span>${result.inputContent.label}</span></div><div class="card-metric-zone anim-in anim-in-delay-2"><div class="metric-row"><span class="mv-lg mv-muted">${result.metric}</span></div><div class="metric-sub">${result.metricSub}</div></div><div class="card-status anim-in anim-in-delay-3"><span class="sk">${result.statusKey}</span><span class="sv">${result.statusVal}</span></div><div class="card-btn-zone anim-in anim-in-delay-4"><button class="mc-btn btn-primary" disabled>${result.btn.label}</button></div>`;}
  buildIdleHTML(idleMetric,idleBtnLabel){const def=this.def;const metric=idleMetric!==undefined?idleMetric:def.idleMetric;const btnLabel=idleBtnLabel||def.idleBtnLabel;const inputZoneHTML=def.hasInput?`<div class="card-input-zone anim-in anim-in-delay-2"><input class="slot-input" type="number" step="${def.inputAllowDecimal?'0.1':'1'}" min="${def.inputAllowDecimal?'-45':'1'}" max="${def.inputMax}" placeholder="${def.inputPlaceholder}" id="input-${def.id}" /></div>`:'';const isDash=metric==='—';const isWord=isNaN(metric)&&metric!=='—';const metricClass=isDash?(def.hasInput?'mv-sm mv-muted':'mv-lg mv-muted'):isWord?(def.hasInput?'mv-word-sm':'mv-word-lg'):(def.hasInput?'mv-sm':'mv-lg');const unitClass=def.hasInput?'mv-sm-unit':'mv-lg-unit';return`<div class="card-header"><div class="signal-dot dot-green anim-in"></div><span class="card-title anim-in anim-in-delay-1">${def.title}</span><span class="header-badge badge-hidden">–</span></div>${inputZoneHTML}<div class="card-metric-zone anim-in anim-in-delay-2"><div class="metric-row"><span class="${metricClass}" id="metric-val-${def.id}">${metric}</span>${def.idleUnit?`<span class="${unitClass}">${def.idleUnit}</span>`:''}</div><div class="metric-sub" id="metric-sub-${def.id}">${def.idleMetricSub}</div></div><div class="card-status anim-in anim-in-delay-3"><span class="sk">${def.idleStatusKey}</span><span class="sv" id="status-val-${def.id}">${def.idleStatusVal}</span></div><div class="card-btn-zone anim-in anim-in-delay-4" id="btnzone-${def.id}"><button class="mc-btn btn-primary" id="main-btn-${def.id}" ${def.hasInput?'disabled':''}>${btnLabel}</button></div>`;}
  wireIdle(idleBtnLabel,confirmLabel,confirmBtnLabel){const def=this.def;const btn=this.container.querySelector(`#main-btn-${def.id}`);if(!btn)return;if(def.hasInput){const input=this.container.querySelector(`#input-${def.id}`);input.addEventListener('input',()=>{const raw=def.inputAllowDecimal?parseFloat(input.value):parseInt(input.value);if(input.value===''||isNaN(raw)){input.classList.remove('has-val');btn.disabled=true;btn.textContent=idleBtnLabel||def.idleBtnLabel;this.inputVal='';}else{input.classList.add('has-val');btn.disabled=false;if(def.inputAllowDecimal){btn.textContent=`Calibrate ${raw>0?'+':''}${raw}°`;}else{const unit=def.id==='admix'?'oz':'L';btn.textContent=`Add ${raw}${unit}`;}this.inputVal=raw;}});btn.addEventListener('click',()=>{if(!btn.disabled&&this.inputVal!==''){if(def.id==='water'||def.id==='admix'){this.showInputConfirm();}else{this.startPending();}}});}else if(def.hasConfirm){btn.addEventListener('click',()=>this.showConfirm(confirmLabel,confirmBtnLabel));}else{btn.addEventListener('click',()=>this.startPending());}}
  showInputConfirm(){this.phase='confirm';const card=this.container.querySelector('.mc-card');const def=this.def;const unit=def.id==='admix'?'oz':'L';card.className='mc-card state-confirm';const dot=card.querySelector('.signal-dot');dot.className='signal-dot dot-amber';const inputZone=card.querySelector('.card-input-zone');if(inputZone){inputZone.innerHTML=`<span class="slot-pill pill-warning"><span class="pdot"></span>Confirm before adding ${this.inputVal}${unit}</span>`;}const btnZone=card.querySelector('.card-btn-zone');btnZone.innerHTML=`<button class="mc-btn btn-ghost confirm-split" id="cancel-confirm-${def.id}">Cancel</button><button class="mc-btn btn-danger confirm-split" id="yes-confirm-${def.id}">Yes, Add ${this.inputVal}${unit}</button>`;btnZone.querySelector(`#cancel-confirm-${def.id}`).addEventListener('click',()=>this.reset());btnZone.querySelector(`#yes-confirm-${def.id}`).addEventListener('click',()=>this.startPending());}
  showConfirm(confirmLabel,confirmBtnLabel){this.phase='confirm';const card=this.container.querySelector('.mc-card');card.className='mc-card state-confirm';const badge=card.querySelector('.header-badge');badge.className='header-badge badge-warn';badge.textContent='Confirm?';const dot=card.querySelector('.signal-dot');dot.className='signal-dot dot-amber';const mzone=card.querySelector('.card-metric-zone');/* Hide the metric row and sub to make room for the confirm pill */const metricRow=mzone.querySelector('.metric-row');const metricSub=mzone.querySelector('.metric-sub');if(metricRow)metricRow.style.display='none';if(metricSub)metricSub.style.display='none';const existing=mzone.querySelector('.pill-wrap');if(!existing){const pillWrap=document.createElement('div');pillWrap.className='pill-wrap';pillWrap.style.marginBottom='8px';pillWrap.innerHTML=`<span class="slot-pill pill-warning"><span class="pdot"></span>${confirmLabel||'Confirm before proceeding'}</span>`;mzone.insertBefore(pillWrap,metricRow);mzone.style.justifyContent='flex-start';}const btnZone=card.querySelector('.card-btn-zone');btnZone.innerHTML=`<button class="mc-btn btn-ghost confirm-split" id="cancel-btn-${this.def.id}">Cancel</button><button class="mc-btn btn-danger confirm-split" id="confirm-btn-${this.def.id}">${confirmBtnLabel||'Confirm'}</button>`;btnZone.querySelector(`#cancel-btn-${this.def.id}`).addEventListener('click',()=>this.reset());btnZone.querySelector(`#confirm-btn-${this.def.id}`).addEventListener('click',()=>this.startPending());}
  startPending(){this.phase='pending';const card=this.container.querySelector('.mc-card');const sc=this.scenario;card.className='mc-card state-pending';const dot=card.querySelector('.signal-dot');if(dot)dot.className='signal-dot dot-blue pulsing';const badge=card.querySelector('.header-badge');if(badge){badge.className='header-badge badge-hidden';badge.textContent='';}const btnZone=card.querySelector('.card-btn-zone');if(btnZone)btnZone.innerHTML=`<button class="mc-btn btn-primary" disabled>Sending…</button>`;const input=card.querySelector('.slot-input');if(input)input.disabled=true;const confirmPillWrap=card.querySelector('.card-metric-zone .pill-wrap');if(confirmPillWrap){confirmPillWrap.remove();const mzoneReset=card.querySelector('.card-metric-zone');if(mzoneReset)mzoneReset.style.justifyContent='flex-end';}const mzonePending=card.querySelector('.card-metric-zone');if(mzonePending)mzonePending.style.justifyContent='flex-end';const track=card.querySelector('.progress-track');const fill=card.querySelector('.progress-fill');if(!track||!fill){this.resolveCard();return;}track.classList.add('visible');fill.style.background=document.body.classList.contains('dark')?'#e3f200':'#1594ef';fill.style.transition='none';fill.style.width='0%';if(sc.retract){setTimeout(()=>{fill.style.transition=`width ${sc.progressDuration}ms cubic-bezier(0.4,0,0.6,1)`;fill.style.width=sc.progressTo+'%';setTimeout(()=>{fill.style.transition='width 0.5s cubic-bezier(0.4,0,1,1)';fill.style.background='#c13c2d';fill.style.width='0%';setTimeout(()=>{track.classList.remove('visible');this.resolveCard();},520);},sc.progressDuration+100);},20);}else if(sc.stutter){setTimeout(()=>{fill.style.transition=`width ${sc.progressDuration}ms cubic-bezier(0.4,0,0.2,1)`;fill.style.width=sc.progressTo+'%';setTimeout(()=>{fill.style.transition='width 0.1s ease';fill.style.width=(sc.progressTo-3)+'%';setTimeout(()=>{fill.style.width=(sc.progressTo+1)+'%';setTimeout(()=>{fill.style.width=(sc.progressTo-1)+'%';setTimeout(()=>{setTimeout(()=>{track.classList.remove('visible');this.resolveCard();},sc.progressStall||600);},100);},100);},100);},sc.progressDuration);},20);}else{setTimeout(()=>{fill.style.transition=`width ${sc.progressDuration}ms cubic-bezier(0.4,0,0.2,1)`;fill.style.width=sc.progressTo+'%';setTimeout(()=>{setTimeout(()=>{track.classList.remove('visible');this.resolveCard();},200);},sc.progressDuration);},20);}}
  resolveCard(){this.phase='resolved';const card=this.container.querySelector('.mc-card');const result=this.scenario.resolve(this.inputVal);this.applyResult(result,card);/* Log to command history */if(typeof logCommand==='function'){const def=this.def;let value='—';if(def.hasInput&&this.inputVal!==''){const unit=def.id==='admix'?'oz':def.id==='tilt'?'°':'L';value=`${this.inputVal}${unit}`;}else if(result.metric&&result.metric!=='—'){value=result.metric+(result.unit?' '+result.unit:'');}logCommand(def.title,value,result.badge.label);}
  /* Flip-grow cards — open panel after progress bar completes */
  if(this.def.id==='canerrors'){
    setTimeout(canAfterReset, 150);
    return;
  }
  if(this.def.id==='ping'){
    setTimeout(pingFlipOpen, 150);
    return;
  }
  if(this.def.id==='restart'){
    setTimeout(restartFlipOpen, 150);
    return;
  }
  if(this.def.id==='sensors'){
    const mid = document.body.classList.contains('view-desktop')||document.body.classList.contains('view-tablet') ? 'dt-mc-unit-sensors' : 'mc-unit-sensors';
    setTimeout(() => { sensorsFlipOpen(); }, 150);
    return;
  }
  /* Auto-reset: hold green for 3s, then fade out and reset to idle */
  if(result.cardClass==='state-success'){
    setTimeout(()=>{
      if(this.phase!=='resolved')return;
      card.style.transition='opacity 0.5s ease';
      card.style.opacity='0.4';
      setTimeout(()=>{
        card.style.transition='';
        card.style.opacity='';
        this.reset();
      },500);
    },3000);
  }}
  applyResult(result,card){const def=this.def;card.className=`mc-card ${result.cardClass}`;const dot=card.querySelector('.signal-dot');dot.className=`signal-dot ${result.dotClass}`;dot.classList.remove('pulsing');const badge=card.querySelector('.header-badge');badge.className='header-badge badge-hidden';badge.textContent=result.badge.label;const inputZone=card.querySelector('.card-input-zone');if(inputZone){if(result.inputContent.type==='pill'){inputZone.innerHTML=`<span class="slot-pill ${result.inputContent.cls}"><span class="pdot"></span>${result.inputContent.label}</span>`;inputZone.style.height='auto';inputZone.style.border='none';inputZone.style.background='none';const mzoneInput=card.querySelector('.card-metric-zone');if(mzoneInput)mzoneInput.style.justifyContent='flex-start';}else if(result.inputContent.type==='input'){inputZone.innerHTML=`<input class="slot-input has-val" type="number" value="${result.inputContent.val}" ${result.inputContent.locked?'disabled':''} />`;}}else if(result.inputContent.type==='pill'){const mzone=card.querySelector('.card-metric-zone');const oldPill=mzone.querySelector('.pill-wrap');if(oldPill)oldPill.remove();const pillWrap=document.createElement('div');pillWrap.className='pill-wrap';pillWrap.style.marginBottom='8px';pillWrap.innerHTML=`<span class="slot-pill ${result.inputContent.cls}"><span class="pdot"></span>${result.inputContent.label}</span>`;const metricRow=mzone.querySelector('.metric-row');/* Restore metric visibility in case it was hidden during confirm */if(metricRow)metricRow.style.display='';const metricSub=mzone.querySelector('.metric-sub');if(metricSub)metricSub.style.display='';mzone.insertBefore(pillWrap,metricRow);mzone.style.justifyContent='flex-start';}const metricEl=card.querySelector('[class*="mv-"]');const unitEl=card.querySelector('.mv-lg-unit, .mv-sm-unit');if(metricEl){metricEl.style.opacity='0';if(unitEl){unitEl.style.opacity='0';unitEl.textContent='';}metricEl.style.transform='translateY(-8px)';metricEl.style.transition='opacity 0.15s, transform 0.15s';setTimeout(()=>{const m=result.metric;const isDash=m==='—';const isWord=isNaN(m.replace('°','').replace('just now','x'))&&m!=='—';const isDeg=m.includes('°')&&m!=='—';const isTimedOut=m==='Timed Out';const isJustNow=m==='just now'||m==='Just Now';if(isTimedOut){metricEl.className='mv-timed-out';}else if(isDeg){metricEl.className='mv-degree';if(result.cardClass==='state-warn')metricEl.classList.add('mv-degree-warn');if(result.cardClass==='state-major')metricEl.classList.add('mv-degree-major');}else if(isDash){metricEl.className=def.hasInput?'mv-sm mv-muted':'mv-lg mv-muted';}else if(isWord||isJustNow){metricEl.className=def.hasInput?'mv-word-sm':'mv-word-lg';}else{metricEl.className=def.hasInput?'mv-sm':'mv-lg';}metricEl.textContent=m;if(unitEl){if(result.unit&&!isJustNow&&!isTimedOut&&!isDash){unitEl.textContent=result.unit;unitEl.style.transition='opacity 0.25s';unitEl.style.opacity='1';}else{unitEl.style.opacity='0';}}metricEl.style.transition='opacity 0.25s, transform 0.25s';metricEl.style.opacity='1';metricEl.style.transform='translateY(0)';},160);}const metricSub=card.querySelector('.metric-sub');if(metricSub){setTimeout(()=>{metricSub.style.opacity='0';setTimeout(()=>{metricSub.textContent=result.metricSub;metricSub.style.transition='opacity 0.2s';metricSub.style.opacity='1';},120);},200);}const sv=card.querySelector('.sv');if(sv){const sk=card.querySelector('.sk');if(sk)sk.textContent=result.statusKey;setTimeout(()=>{sv.style.opacity='0';setTimeout(()=>{sv.textContent=result.statusVal;sv.style.transition='opacity 0.2s';sv.style.opacity='1';},100);},300);}const btnZone=card.querySelector('.card-btn-zone');setTimeout(()=>{btnZone.style.opacity='0';btnZone.style.transform='translateY(4px)';btnZone.style.transition='opacity 0.15s, transform 0.15s';setTimeout(()=>{btnZone.innerHTML=`<button class="mc-btn ${result.btn.cls}" ${result.btn.disabled?'disabled':''}>${result.btn.label}</button>`;const newBtn=btnZone.querySelector('.mc-btn');if(newBtn&&!result.btn.disabled){if((def.id==='water'&&result.btn.label==='Add More Water')||(def.id==='admix'&&result.btn.label==='Add More Admix')){newBtn.addEventListener('click',()=>this.reset());}else if(def.hasConfirm){const sc=this.scenario;newBtn.addEventListener('click',()=>{this.reset();setTimeout(()=>{const confirmLabel=sc.isOffStart?this.def.confirmLabel.replace('turning off','turning on'):this.def.confirmLabel;const confirmBtnLabel=sc.isOffStart?'Yes, Turn On':this.def.confirmBtnLabel;this.showConfirm(confirmLabel,confirmBtnLabel);},50);});}else{newBtn.addEventListener('click',()=>{if(this.phase==='resolved')this.startPending();});}}btnZone.style.transition='opacity 0.25s, transform 0.25s';btnZone.style.opacity='1';btnZone.style.transform='translateY(0)';},160);},180);}
}

/* ── Command history table for Manual Control ── */
