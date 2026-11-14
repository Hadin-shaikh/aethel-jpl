/* ═══════════════════════════════════════════════════════════════
   AETHEL // JPL — Space Mission Engineering Simulator
   Hierarchical State Machine, RK4 Astrodynamics, Math & UX Engine
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ── NASA LAUNCH SERVICES PROGRAM FLEET SPECIFICATIONS ──
const VEHICLES = {
  falcon9: {
    id: 'falcon9',
    name: 'Falcon 9',
    mass: 22800,
    cost: 67,
    maxPayloadKg: 22800,
    desc: 'Cost-optimized reusable two-stage booster'
  },
  falconheavy: {
    id: 'falconheavy',
    name: 'Falcon Heavy',
    mass: 63800,
    cost: 97,
    maxPayloadKg: 63800,
    desc: 'Heavy-lift tri-core configuration with cross-feed'
  },
  sls: {
    id: 'sls',
    name: 'SLS Block 1',
    mass: 95000,
    cost: 2100,
    maxPayloadKg: 95000,
    desc: 'NASA deep space exploration super heavy vehicle'
  }
};

// ── ASTRODYNAMICS MISSION SPECIFICATIONS ──
const MISSIONS = {
  leo: {
    id: 'leo',
    name: 'LEO Satellite',
    sub: '500 KM CIRCULAR',
    periapsisKm: 500,
    apoapsisKm: 500,
    r1Km: 6871, // 6371 + 500
    r2Km: 6871,
    semiMajorAxisKm: 6871,
    inclination: '51.6°',
    targetVelKms: 7.613,
    dvReq: 150,
    targetDataMbps: 10,
    periodMin: 94.6,
    vectorDesc: 'LEO SATELLITE FLIGHT PATH',
    previewConicTag: 'LEO 500KM CIRCULAR'
  },
  lunar: {
    id: 'lunar',
    name: 'Lunar Rover & Relay',
    sub: 'CISLUNAR TRANSFER',
    periapsisKm: 185,
    apoapsisKm: 384400,
    r1Km: 6556,
    r2Km: 384400,
    semiMajorAxisKm: 195478,
    inclination: '28.5°',
    targetVelKms: 10.920,
    dvReq: 3100,
    targetDataMbps: 5,
    periodMin: 655,
    vectorDesc: 'TRANSLUNAR INJECTION CONIC',
    previewConicTag: 'CISLUNAR FREE-RETURN'
  },
  mars: {
    id: 'mars',
    name: 'Mars Exploration Probe',
    sub: 'HOHMANN CRUISE',
    periapsisKm: 250,
    apoapsisKm: 227900000,
    r1Km: 149600000, // 1 AU
    r2Km: 227900000, // 1.52 AU
    semiMajorAxisKm: 188750000,
    inclination: '1.85°',
    targetVelKms: 11.570,
    dvReq: 5600,
    targetDataMbps: 2,
    periodMin: 372960,
    vectorDesc: 'HELIOCENTRIC MARS TRAJECTORY',
    previewConicTag: 'HOHMANN TRANSFER ELLIPSE'
  }
};

// ── REALISTIC COMPONENT DATABASE ──
const SUBSYSTEMS = {
  power: {
    label: 'Power Generation',
    items: [
      {
        id: 'solar-ultraflex',
        name: 'UltraFlex Dual Solar Wings',
        desc: 'Gallium Arsenide flexible arrays (150 W/kg) with accordion mast.',
        mass: 120,
        power: 450,
        cost: 18,
        data: 0,
        svgPartId: 'cad-solar'
      },
      {
        id: 'rtg-plutonium',
        name: 'NextGen Plutonium-238 RTG',
        desc: 'Stirling radioisotope generator. Continuous power independent of shadow.',
        mass: 380,
        power: 350,
        cost: 95,
        data: 0,
        svgPartId: 'cad-thruster'
      },
      {
        id: 'battery-liion',
        name: 'Li-Ion Battery Buffer (40 Ah)',
        desc: 'High-density cells for eclipse buffering with automated thermal jacket.',
        mass: 45,
        power: 60,
        cost: 5,
        data: 0,
        svgPartId: null
      }
    ]
  },
  comms: {
    label: 'Communications',
    items: [
      {
        id: 'antenna-kaband',
        name: 'Ka-Band High-Gain Antenna',
        desc: '2.5m deployable mesh reflector with 100W TWTA for Deep Space Network.',
        mass: 85,
        power: -100,
        cost: 22,
        data: 80,
        svgPartId: 'cad-antenna'
      },
      {
        id: 'antenna-sband',
        name: 'S-Band Omni Antenna',
        desc: 'Low-gain omni array for emergency commanding and housekeeping uplink.',
        mass: 12,
        power: -15,
        cost: 3,
        data: 5,
        svgPartId: 'cad-antenna'
      },
      {
        id: 'antenna-xband',
        name: 'X-Band Steerable Dish',
        desc: 'Gimballed dual-polarization dish for medium orbit data downlinks.',
        mass: 35,
        power: -50,
        cost: 12,
        data: 40,
        svgPartId: 'cad-antenna'
      }
    ]
  },
  instruments: {
    label: 'Science Instruments',
    items: [
      {
        id: 'imager-hires',
        name: 'HiRES Multispectral Imager',
        desc: 'Pushbroom scanner with 0.5m GSD from 500km. 12-band VNIR/SWIR sensor.',
        mass: 65,
        power: -90,
        cost: 45,
        data: -15,
        svgPartId: 'cad-instrument'
      },
      {
        id: 'spectrometer-mass',
        name: 'Quadrupole Mass Spectrometer',
        desc: 'In-situ atmospheric gas and volatile analysis with electron-impact source.',
        mass: 28,
        power: -55,
        cost: 30,
        data: -3,
        svgPartId: 'cad-instrument'
      },
      {
        id: 'radar-sar',
        name: 'Synthetic Aperture Radar (SAR)',
        desc: 'C-band all-weather radar with 5m resolution for planetary surface mapping.',
        mass: 150,
        power: -200,
        cost: 60,
        data: -25,
        svgPartId: 'cad-instrument'
      }
    ]
  },
  propulsion: {
    label: 'Propulsion',
    items: [
      {
        id: 'thruster-coldgas',
        name: 'Cold Gas RCS Attitude Array',
        desc: 'High-purity nitrogen micro-thrusters for 3-axis precision fine stabilization.',
        mass: 162,
        power: -40,
        cost: 10,
        data: 0,
        thrustN: 15,
        ispS: 68,
        svgPartId: 'cad-thruster'
      },
      {
        id: 'thruster-biprop',
        name: 'MMH/NTO Bipropellant Engine',
        desc: '445N thrust, Isp 320s. Restartable for orbit circularization burns.',
        mass: 180,
        power: -20,
        cost: 25,
        data: 0,
        thrustN: 445,
        ispS: 320,
        svgPartId: 'cad-thruster'
      },
      {
        id: 'thruster-ion',
        name: 'Xenon Ion Thruster (NEXT-C)',
        desc: 'NASA Evolutionary Xenon Thruster. 6.9kW, 236mN, Isp 4190s high efficiency.',
        mass: 95,
        power: -300,
        cost: 35,
        data: 0,
        thrustN: 0.236,
        ispS: 4190,
        svgPartId: 'cad-thruster'
      }
    ]
  },
  chassis: {
    label: 'Spacecraft Bus / Chassis',
    items: [
      {
        id: 'chassis-small',
        name: 'SmallSat Bus (ESPA-Class)',
        desc: 'Secondary payload adapter compatible. Integrated avionics and battery bay.',
        mass: 90,
        power: -30,
        cost: 15,
        data: 0,
        svgPartId: null
      },
      {
        id: 'chassis-medium',
        name: 'Medium Explorer Platform',
        desc: 'Heritage MidEx chassis with modular avionics and honeycombed panels.',
        mass: 250,
        power: -60,
        cost: 40,
        data: 0,
        svgPartId: null
      },
      {
        id: 'chassis-flagship',
        name: 'Flagship Deep Space Bus',
        desc: 'Radiation-hardened chassis with dual fault-tolerant MIL-STD-1553B bus.',
        mass: 600,
        power: -120,
        cost: 150,
        data: 0,
        svgPartId: null
      }
    ]
  }
};

// ── GLOBAL APPLICATION STATE ──
const STATE = {
  currentView: '01',
  mission: 'leo',
  vehicle: 'falcon9',
  equipped: new Set([
    'solar-ultraflex',
    'antenna-kaband',
    'imager-hires',
    'spectrometer-mass',
    'thruster-coldgas'
  ]),
  activeCategory: 'power',
  audioEnabled: false,
  timeWarp: 1,
  actionHistory: [], // Undo stack
  advisorWarnings: [],
  launchReady: true,

  // Astrodynamics Simulation State (RK4)
  rk4State: {
    r: [6871000, 0], // x, y (meters)
    v: [0, 7613],     // vx, vy (m/s)
    trail: []
  },

  // Animation & Clock Timers
  simAngle: 0,
  metOffsetSec: 142 * 86400 + 8 * 3600 + 24 * 60 + 19,
  metStartTime: Date.now(),
  lastFrameTime: performance.now()
};

// ── FORMAT CURRENCY HELPER ──
function formatCurrency(valMillions) {
  if (valMillions >= 1000) {
    return '$' + (valMillions / 1000).toFixed(1) + 'B';
  }
  return '$' + valMillions.toFixed(1) + 'M';
}

// ── DOM CACHE ──
const DOM = {};
function cacheDom() {
  DOM.app = document.getElementById('app');
  DOM.loader = document.getElementById('loading-skeleton');
  DOM.toastContainer = document.getElementById('toast-container');

  // Vitals Bar
  DOM.vitalMass = document.getElementById('vital-mass');
  DOM.vitalMassCap = document.getElementById('vital-mass-cap');
  DOM.vitalMassChip = document.getElementById('vital-mass-chip');

  DOM.vitalPower = document.getElementById('vital-power');
  DOM.vitalPowerCap = document.getElementById('vital-power-cap');
  DOM.vitalPowerChip = document.getElementById('vital-power-chip');

  DOM.vitalBudget = document.getElementById('vital-budget');
  DOM.vitalBudgetCap = document.getElementById('vital-budget-cap');
  DOM.vitalBudgetChip = document.getElementById('vital-budget-chip');

  DOM.vitalDv = document.getElementById('vital-dv');
  DOM.vitalTwr = document.getElementById('vital-twr');
  DOM.vitalDvChip = document.getElementById('vital-dv-chip');

  // Navigation Buttons
  DOM.navBtns = document.querySelectorAll('.nav-btn');
  DOM.views = document.querySelectorAll('.focused-view');
  DOM.btnFlowPrev = document.getElementById('btn-flow-prev');
  DOM.btnFlowNext = document.getElementById('btn-flow-next');
  DOM.stepDots = document.querySelectorAll('.step-dot');

  // View 01 Mission
  DOM.missionCards = document.querySelectorAll('.choice-card[data-mission]');
  DOM.missionPreviewCanvas = document.getElementById('mission-preview-canvas');
  DOM.missionPreviewTag = document.getElementById('mission-preview-tag');
  DOM.previewPeriod = document.getElementById('preview-period');
  DOM.previewVector = document.getElementById('preview-vector');

  // View 02 Vehicle
  DOM.vehicleCards = document.querySelectorAll('.vehicle-card[data-vehicle]');
  DOM.f9Fill = document.getElementById('f9-cap-fill');
  DOM.fhFill = document.getElementById('fh-cap-fill');
  DOM.slsFill = document.getElementById('sls-cap-fill');
  DOM.f9Sub = document.getElementById('f9-status-sub');
  DOM.fhSub = document.getElementById('fh-status-sub');
  DOM.slsSub = document.getElementById('sls-status-sub');

  // View 03 Build
  DOM.subsystemList = document.getElementById('subsystem-cards-list');
  DOM.outfitterBadge = document.getElementById('outfitter-equipped-badge');
  DOM.cadActiveCount = document.getElementById('cad-active-count');
  DOM.categoryTabs = document.querySelectorAll('.seg-btn[data-cat]');

  // View 04 Analyze
  DOM.orbitHudCanvas = document.getElementById('orbit-hud-canvas');
  DOM.navballCanvas = document.getElementById('navball-canvas');
  DOM.conicTransferCanvas = document.getElementById('conic-transfer-canvas');
  DOM.tsiolkovskyCanvas = document.getElementById('tsiolkovsky-canvas');
  DOM.hudOrbitTitle = document.getElementById('hud-orbit-title');
  DOM.teleTarget = document.getElementById('tele-target');
  DOM.telePeri = document.getElementById('tele-peri');
  DOM.teleVel = document.getElementById('tele-vel');
  DOM.navballReadout = document.getElementById('navball-readout');

  // KaTeX equation elements
  DOM.katexTsiolkovsky = document.getElementById('katex-tsiolkovsky');
  DOM.katexVisviva = document.getElementById('katex-visviva');
  DOM.katexKepler3 = document.getElementById('katex-kepler3');
  DOM.katexHohmann = document.getElementById('katex-hohmann');
  DOM.katexPower = document.getElementById('katex-power');

  // Math live tags
  DOM.mathM0 = document.getElementById('math-m0');
  DOM.mathMf = document.getElementById('math-mf');
  DOM.mathIsp = document.getElementById('math-isp');
  DOM.mathDvRes = document.getElementById('math-dv-res');
  DOM.mathR = document.getElementById('math-r');
  DOM.mathVorb = document.getElementById('math-vorb');
  DOM.mathSma = document.getElementById('math-sma');
  DOM.mathPeriod = document.getElementById('math-period');
  DOM.mathDv1 = document.getElementById('math-dv1');
  DOM.mathDv2 = document.getElementById('math-dv2');
  DOM.mathDvTot = document.getElementById('math-dv-tot');
  DOM.mathPowerBreakdown = document.getElementById('math-power-breakdown');

  // View 05 Launch
  DOM.checklistBadge = document.getElementById('checklist-overall-badge');
  DOM.chkMass = document.getElementById('chk-mass');
  DOM.chkPower = document.getElementById('chk-power');
  DOM.chkBudget = document.getElementById('chk-budget');
  DOM.chkDv = document.getElementById('chk-dv');
  DOM.chkComms = document.getElementById('chk-comms');
  DOM.btnHoldLaunch = document.getElementById('btn-hold-launch');
  DOM.holdRingFill = document.getElementById('hold-ring-fill');
  DOM.launchHint = document.getElementById('launch-hint');
  DOM.sumMissionName = document.getElementById('sum-mission-name');
  DOM.sumVehicleName = document.getElementById('sum-vehicle-name');
  DOM.sumVectorDesc = document.getElementById('sum-vector-desc');

  // Advisor Drawer
  DOM.advisorDrawer = document.getElementById('advisor-drawer');
  DOM.advisorBadge = document.getElementById('advisor-badge');
  DOM.btnAdvisorToggle = document.getElementById('btn-advisor-toggle');
  DOM.btnCloseAdvisor = document.getElementById('btn-close-advisor');
  DOM.advisorSummary = document.getElementById('advisor-summary-text');
  DOM.advisorAlertsList = document.getElementById('advisor-alerts-list');

  // Ambient Telemetry Popover
  DOM.telemetryPopover = document.getElementById('telemetry-popover');
  DOM.btnTelemetryPopover = document.getElementById('btn-telemetry-popover');
  DOM.btnCloseTelemetry = document.getElementById('btn-close-telemetry');
  DOM.ambientMet = document.getElementById('ambient-met');
  DOM.ambientUtc = document.getElementById('ambient-utc');
  DOM.ambientDownlink = document.getElementById('ambient-downlink');

  // Shortcuts Popover
  DOM.shortcutsPopover = document.getElementById('shortcuts-popover');
  DOM.btnShortcutsPopover = document.getElementById('btn-shortcuts-popover');
  DOM.btnCloseShortcuts = document.getElementById('btn-close-shortcuts');

  // Sources Modal
  DOM.sourcesModal = document.getElementById('sources-modal');
  DOM.btnSources = document.getElementById('btn-sources');
  DOM.btnCloseSources = document.getElementById('btn-close-sources');

  // Audio Toggle
  DOM.btnAudio = document.getElementById('btn-audio');
  DOM.audioState = document.getElementById('audio-state');

  // Cinematic Overlay
  DOM.cinematicOverlay = document.getElementById('cinematic-overlay');
  DOM.cineStageLabel = document.getElementById('cine-stage-label');
  DOM.cineMainText = document.getElementById('cine-main-text');
  DOM.cineSubText = document.getElementById('cine-sub-text');
  DOM.cineFill = document.getElementById('cine-fill');
}

// ── NATIVE AUDIO SYNTHESIS (Zero External Assets) ──
let audioCtx = null;
function initAudio() {
  if (audioCtx) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (AudioCtx) audioCtx = new AudioCtx();
}

function playTone(freq, dur, type, vol) {
  if (!STATE.audioEnabled || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(vol || 0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}

function sfxClick() { playTone(2400, 0.04, 'square', 0.03); }
function sfxEquip() { playTone(1800, 0.06, 'triangle', 0.05); }
function sfxUnequip() { playTone(820, 0.06, 'triangle', 0.04); }
function sfxWarn() { playTone(180, 0.25, 'sawtooth', 0.08); }
function sfxLaunch() {
  playTone(55, 1.4, 'sawtooth', 0.12);
  playTone(110, 1.4, 'sine', 0.08);
}

// ── TOAST WITH UNDO SYSTEM (Step 3) ──
function showToast(message, undoCallback) {
  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.innerHTML = `<span>${message}</span>`;

  if (undoCallback) {
    const btn = document.createElement('button');
    btn.className = 'toast-undo-btn';
    btn.textContent = 'UNDO';
    btn.addEventListener('click', () => {
      undoCallback();
      toast.remove();
    });
    toast.appendChild(btn);
  }

  DOM.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

function undoLastAction() {
  if (STATE.actionHistory.length === 0) return;
  const action = STATE.actionHistory.pop();
  if (action.type === 'toggle') {
    if (action.wasEquipped) {
      STATE.equipped.add(action.itemId);
    } else {
      STATE.equipped.delete(action.itemId);
    }
    renderSubsystems(STATE.activeCategory);
    updateAll();
    showToast(`Undone: ${action.name} state restored.`);
  }
}

// ── VIEW SWITCHING (250ms Animated Slide / Fade) ──
function switchView(viewId) {
  if (STATE.currentView === viewId) return;
  sfxClick();

  const prevViewEl = document.getElementById('view-' + STATE.currentView);
  const nextViewEl = document.getElementById('view-' + viewId);

  if (prevViewEl) {
    prevViewEl.classList.remove('active');
  }

  STATE.currentView = viewId;

  if (nextViewEl) {
    nextViewEl.classList.add('active');
  }

  // Update navigation buttons
  DOM.navBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewId);
  });

  // Update step dots
  DOM.stepDots.forEach(dot => {
    dot.classList.toggle('active', dot.dataset.step === viewId);
  });

  // Update flow buttons text
  const stepNum = parseInt(viewId, 10);
  DOM.btnFlowPrev.disabled = (stepNum === 1);

  const nextLabels = {
    1: 'Next: Select Vehicle →',
    2: 'Next: Configure Chassis →',
    3: 'Next: Analyze Dynamics →',
    4: 'Next: Pre-Flight Checklist →',
    5: 'Launch Readiness Complete'
  };
  DOM.btnFlowNext.textContent = nextLabels[stepNum] || 'Next →';
  DOM.btnFlowNext.disabled = (stepNum === 5);
}

// ── GET EQUIPPED MODULES LIST ──
function getEquippedItems() {
  const list = [];
  for (const cat of Object.values(SUBSYSTEMS)) {
    for (const item of cat.items) {
      if (STATE.equipped.has(item.id)) list.push(item);
    }
  }
  return list;
}

// ── CONSTRAINT VERIFICATION LOGIC ──
function checkModuleConstraint(item) {
  const vehicle = VEHICLES[STATE.vehicle];
  const items = getEquippedItems();

  let massSum = 0;
  let powerGen = 0;
  let powerLoad = 0;
  let costSum = vehicle.cost;

  items.forEach(i => {
    massSum += i.mass;
    if (i.power >= 0) powerGen += i.power;
    else powerLoad += Math.abs(i.power);
    costSum += i.cost;
  });

  if (!STATE.equipped.has(item.id)) {
    // Testing equip constraint
    const testMass = massSum + item.mass;
    const testCost = costSum + item.cost;
    const testLoad = item.power < 0 ? powerLoad + Math.abs(item.power) : powerLoad;
    const testGen = item.power > 0 ? powerGen + item.power : powerGen;

    if (testMass > vehicle.maxPayloadKg) {
      return {
        allowed: false,
        reason: `Exceeds ${vehicle.name} limit (+${(testMass - vehicle.maxPayloadKg)} kg)`,
        suggestFix: 'Switch to Falcon Heavy'
      };
    }
    if (testCost > 250) {
      return {
        allowed: false,
        reason: `Exceeds budget ceiling ($${testCost.toFixed(1)}M > $250M)`,
        suggestFix: 'Reduce high-cost modules'
      };
    }
  }
  return { allowed: true };
}

// ── RENDER SUBSYSTEM OUTFITTER (Step 3) ──
function renderSubsystems(catKey) {
  STATE.activeCategory = catKey;
  const cat = SUBSYSTEMS[catKey];
  if (!cat || !DOM.subsystemList) return;

  const frag = document.createDocumentFragment();

  cat.items.forEach(item => {
    const isEquipped = STATE.equipped.has(item.id);
    const constraint = checkModuleConstraint(item);

    const card = document.createElement('div');
    card.className = 'component-card' + (isEquipped ? ' equipped' : '');
    card.dataset.id = item.id;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    const pwrSign = item.power >= 0 ? '+' : '';
    const dataSign = item.data > 0 ? '+' : '';

    card.innerHTML = `
      <div class="comp-header">
        <span class="comp-name">${item.name}</span>
        <span class="comp-tag ${isEquipped ? 'equipped' : 'stowed'}">[${isEquipped ? 'EQUIPPED' : 'STOWED'}]</span>
      </div>
      <div class="comp-desc">${item.desc}</div>
      <div class="comp-badges">
        <span class="comp-badge">MASS: <strong>+${item.mass} KG</strong></span>
        <span class="comp-badge ${item.power >= 0 ? 'pos' : ''}">PWR: <strong>${pwrSign}${item.power}W</strong></span>
        <span class="comp-badge">COST: <strong>-${formatCurrency(item.cost)}</strong></span>
        ${item.data !== 0 ? `<span class="comp-badge ${item.data > 0 ? 'pos' : ''}">DATA: <strong>${dataSign}${item.data} Mbps</strong></span>` : ''}
      </div>
    `;

    card.addEventListener('click', () => toggleComponent(item));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleComponent(item);
      }
    });

    frag.appendChild(card);
  });

  DOM.subsystemList.textContent = '';
  DOM.subsystemList.appendChild(frag);

  // Update tabs active state
  DOM.categoryTabs.forEach(t => {
    t.classList.toggle('active', t.dataset.cat === catKey);
  });
}

// ── TOGGLE COMPONENT WITH CONSTRAINTS & TOAST ──
function toggleComponent(item) {
  const wasEquipped = STATE.equipped.has(item.id);

  if (wasEquipped) {
    STATE.equipped.delete(item.id);
    sfxUnequip();
    showToast(`Stowed: ${item.name}`, () => {
      STATE.equipped.add(item.id);
      renderSubsystems(STATE.activeCategory);
      updateAll();
    });
  } else {
    const check = checkModuleConstraint(item);
    if (!check.allowed) {
      sfxWarn();
      showToast(`Warning: ${check.reason}. Suggested: ${check.suggestFix}`);
    }
    STATE.equipped.add(item.id);
    sfxEquip();
    showToast(`Equipped: ${item.name}`, () => {
      STATE.equipped.delete(item.id);
      renderSubsystems(STATE.activeCategory);
      updateAll();
    });
  }

  STATE.actionHistory.push({
    type: 'toggle',
    itemId: item.id,
    name: item.name,
    wasEquipped
  });

  renderSubsystems(STATE.activeCategory);
  updateAll();
}

// ── UPDATE TELEMETRY & ADVISOR STATE ──
function updateAll() {
  const vehicle = VEHICLES[STATE.vehicle];
  const mission = MISSIONS[STATE.mission];
  const items = getEquippedItems();

  let massSum = 0;
  let powerGen = 0;
  let powerLoad = 0;
  let costSum = vehicle.cost;
  let dataThroughput = 0;
  let ispAvg = 320;

  items.forEach(i => {
    massSum += i.mass;
    if (i.power >= 0) powerGen += i.power;
    else powerLoad += Math.abs(i.power);
    costSum += i.cost;
    dataThroughput += i.data;
    if (i.ispS) ispAvg = i.ispS;
  });

  const netPower = powerGen - powerLoad;
  const projectCap = 250.0;
  const massRatio = (massSum / vehicle.maxPayloadKg) * 100;
  const structuralMargin = Math.max(0, 100 - massRatio);

  // 1. Vitals Bar Updates
  DOM.vitalMass.textContent = massSum.toLocaleString() + ' KG';
  DOM.vitalMassCap.textContent = '/ ' + vehicle.maxPayloadKg.toLocaleString() + ' KG';
  DOM.vitalMassChip.textContent = structuralMargin.toFixed(1) + '% MARGIN';
  DOM.vitalMassChip.className = 'vital-chip ' + (massRatio > 100 ? 'alert' : massRatio > 85 ? 'warn' : 'nominal');

  const pwrSign = netPower >= 0 ? '+' : '';
  DOM.vitalPower.textContent = pwrSign + netPower + ' W';
  DOM.vitalPowerCap.textContent = `${powerGen}W GEN │ ${powerLoad}W LOAD`;
  DOM.vitalPowerChip.textContent = netPower < 0 ? 'DEFICIT' : 'SURPLUS';
  DOM.vitalPowerChip.className = 'vital-chip ' + (netPower < 0 ? 'alert' : 'surplus');

  DOM.vitalBudget.textContent = formatCurrency(costSum);
  DOM.vitalBudgetCap.textContent = '/ ' + formatCurrency(projectCap);
  DOM.vitalBudgetChip.textContent = costSum > projectCap ? 'EXCEEDED' : 'FUNDED';
  DOM.vitalBudgetChip.className = 'vital-chip ' + (costSum > projectCap ? 'alert' : 'nominal');

  const twr = massSum > 0 ? (445 / (massSum * 9.81)).toFixed(2) : '0.00';
  DOM.vitalDv.textContent = '+' + mission.dvReq + ' m/s';
  DOM.vitalTwr.textContent = 'TWR ' + twr;

  // 2. Outfitter & CAD Counts
  DOM.outfitterBadge.textContent = items.length + ' EQUIPPED';
  DOM.cadActiveCount.textContent = `${items.length} / 15`;

  // 3. Vehicle View Gauges
  const f9Pct = Math.min(100, (massSum / 22800) * 100);
  const fhPct = Math.min(100, (massSum / 63800) * 100);
  const slsPct = Math.min(100, (massSum / 95000) * 100);

  DOM.f9Fill.style.width = f9Pct.toFixed(1) + '%';
  DOM.fhFill.style.width = fhPct.toFixed(1) + '%';
  DOM.slsFill.style.width = slsPct.toFixed(1) + '%';

  DOM.f9Sub.textContent = `${massSum} kg equipped (${f9Pct.toFixed(1)}% of capacity)`;
  DOM.fhSub.textContent = `${massSum} kg equipped (${fhPct.toFixed(1)}% of capacity)`;
  DOM.slsSub.textContent = `${massSum} kg equipped (${slsPct.toFixed(1)}% of capacity)`;

  // Incompatibility dimming
  DOM.vehicleCards.forEach(card => {
    const vId = card.dataset.vehicle;
    const vObj = VEHICLES[vId];
    const isOver = massSum > vObj.maxPayloadKg;
    card.classList.toggle('disabled', isOver);
  });

  // 4. Mission View Preview Text
  DOM.missionPreviewTag.textContent = mission.previewConicTag;
  DOM.previewPeriod.textContent = mission.periodMin > 1440
    ? (mission.periodMin / 1440).toFixed(0) + ' days'
    : mission.periodMin.toFixed(1) + ' min';
  DOM.previewVector.textContent = mission.vectorDesc;

  // 5. Checklist View Evaluator
  const isMassOk = massSum > 0 && massSum <= vehicle.maxPayloadKg;
  const isPowerOk = netPower >= 0;
  const isBudgetOk = costSum <= projectCap;
  const isDvOk = mission.dvReq > 0;
  const isCommsOk = STATE.equipped.has('antenna-kaband') || STATE.equipped.has('antenna-xband') || STATE.equipped.has('antenna-sband');

  updateCheckItem('chk-mass', isMassOk, `Payload ${massSum} kg is within ${vehicle.name} limit (${vehicle.maxPayloadKg.toLocaleString()} kg).`, `Mass ${massSum} kg exceeds ${vehicle.name} ceiling.`);
  updateCheckItem('chk-power', isPowerOk, `Surplus +${netPower}W generated. Steady-state bus is positive.`, `Power deficit of ${Math.abs(netPower)}W detected.`);
  updateCheckItem('chk-budget', isBudgetOk, `Total cost ${formatCurrency(costSum)} is within approved ${formatCurrency(projectCap)} ceiling.`, `Cost ${formatCurrency(costSum)} exceeds approved ${formatCurrency(projectCap)} cap.`);
  updateCheckItem('chk-dv', isDvOk, `${mission.dvReq} m/s meets orbital insertion requirement.`, 'No propulsion budget defined.');
  updateCheckItem('chk-comms', isCommsOk, 'Antenna equipped for telemetry downlink.', 'No telecommunications antenna equipped.');

  const allPassed = isMassOk && isPowerOk && isBudgetOk && isDvOk && isCommsOk;
  STATE.launchReady = allPassed;

  DOM.checklistBadge.textContent = allPassed ? 'ALL CHECKS PASSED' : 'ACTION REQUIRED';
  DOM.checklistBadge.className = 'checklist-status-badge ' + (allPassed ? 'nominal' : 'alert');
  DOM.btnHoldLaunch.disabled = !allPassed;

  DOM.sumMissionName.textContent = mission.name.toUpperCase();
  DOM.sumVehicleName.textContent = vehicle.name.toUpperCase();
  DOM.sumVectorDesc.textContent = mission.vectorDesc;

  // 6. Advisor Findings (Step 2 Drawer)
  updateAdvisorDrawer(items, massSum, netPower, vehicle, mission, isCommsOk);

  // 7. Update Live Math Equations (Step 5)
  updateMathPanel(massSum, vehicle, mission, ispAvg, netPower, items);

  // 8. Update Chassis Part Highlighting
  updateCadHighlights();
}

function updateCheckItem(elementId, passed, passText, failText) {
  const row = document.getElementById(elementId);
  if (!row) return;
  const icon = row.querySelector('.check-icon');
  const sub = row.querySelector('.check-sub');
  const pill = row.querySelector('.check-pill');

  icon.textContent = passed ? '✓' : '✕';
  icon.style.color = passed ? 'var(--status-nominal)' : 'var(--alert-red)';
  sub.textContent = passed ? passText : failText;
  pill.textContent = passed ? 'PASS' : 'FAIL';
  pill.className = 'check-pill ' + (passed ? 'nominal' : 'fail');
}

// ── CHIEF AVIONICS ADVISOR DRAWER ──
function updateAdvisorDrawer(items, massSum, netPower, vehicle, mission, isCommsOk) {
  STATE.advisorWarnings = [];

  if (massSum > vehicle.maxPayloadKg) {
    STATE.advisorWarnings.push({
      type: 'critical',
      title: 'Structural Mass Exceeded',
      desc: `Total mass (${massSum.toLocaleString()} kg) exceeds ${vehicle.name} payload limit.`,
      action: 'Upgrade to Falcon Heavy',
      fix: () => {
        STATE.vehicle = 'falconheavy';
        DOM.vehicleCards.forEach(c => c.classList.toggle('active', c.dataset.vehicle === 'falconheavy'));
        updateAll();
      }
    });
  }

  if (netPower < 0) {
    STATE.advisorWarnings.push({
      type: 'critical',
      title: 'Power Bus Deficit',
      desc: `Net deficit of ${Math.abs(netPower)}W. In deep space this depletes battery buffers.`,
      action: 'Equip UltraFlex Wings',
      fix: () => {
        STATE.equipped.add('solar-ultraflex');
        renderSubsystems(STATE.activeCategory);
        updateAll();
      }
    });
  }

  if (mission.id === 'leo' && STATE.equipped.has('rtg-plutonium')) {
    STATE.advisorWarnings.push({
      type: 'warn',
      title: 'RTG Unnecessary in LEO',
      desc: 'Plutonium-238 adds radioactive launch risk and mass penalty in Earth orbit where solar irradiance is nominal.',
      action: 'Replace with UltraFlex Solar Wings',
      fix: () => {
        STATE.equipped.delete('rtg-plutonium');
        STATE.equipped.add('solar-ultraflex');
        renderSubsystems(STATE.activeCategory);
        updateAll();
      }
    });
  }

  if (mission.id === 'mars' && STATE.equipped.has('solar-ultraflex') && !STATE.equipped.has('rtg-plutonium')) {
    STATE.advisorWarnings.push({
      type: 'warn',
      title: 'Solar Degradation at Mars Distance',
      desc: 'Solar flux drops to 43% at 1.52 AU. Umbra shadow transit will deplete battery buffers.',
      action: 'Equip Plutonium RTG',
      fix: () => {
        STATE.equipped.add('rtg-plutonium');
        renderSubsystems(STATE.activeCategory);
        updateAll();
      }
    });
  }

  if (!isCommsOk) {
    STATE.advisorWarnings.push({
      type: 'warn',
      title: 'No Telecommunications Antenna',
      desc: 'Ground stations cannot establish carrier lock or receive high-resolution instrument telemetry.',
      action: 'Equip Ka-Band Antenna',
      fix: () => {
        STATE.equipped.add('antenna-kaband');
        renderSubsystems(STATE.activeCategory);
        updateAll();
      }
    });
  }

  // Update Badge
  const count = STATE.advisorWarnings.length;
  DOM.advisorBadge.textContent = count;
  DOM.advisorBadge.style.display = count > 0 ? 'inline-block' : 'none';

  if (count === 0) {
    DOM.advisorSummary.textContent = 'All subsystems verified nominal. No constraint violations.';
  } else {
    DOM.advisorSummary.textContent = `${count} unresolved flight advisory ${count === 1 ? 'warning' : 'warnings'}.`;
  }

  // Render Alerts
  DOM.advisorAlertsList.textContent = '';
  const frag = document.createDocumentFragment();

  STATE.advisorWarnings.forEach(w => {
    const card = document.createElement('div');
    card.className = `advisor-alert-card ${w.type}`;
    card.innerHTML = `
      <div class="alert-title">${w.type === 'critical' ? 'CRITICAL' : 'WARNING'}: ${w.title}</div>
      <div class="alert-desc">${w.desc}</div>
    `;
    if (w.action && w.fix) {
      const fixBtn = document.createElement('button');
      fixBtn.className = 'btn btn-secondary btn-xs alert-fix-btn';
      fixBtn.textContent = `⚡ Auto-Fix: ${w.action}`;
      fixBtn.addEventListener('click', () => {
        w.fix();
        showToast(`Auto-fix applied: ${w.action}`);
      });
      card.appendChild(fixBtn);
    }
    frag.appendChild(card);
  });

  DOM.advisorAlertsList.appendChild(frag);
}

// ── LIVE MATHEMATICAL DERIVATIONS & KATEX (Step 5) ──
function updateMathPanel(massSum, vehicle, mission, ispAvg, netPower, items) {
  const g0 = 9.80665;
  const m0 = vehicle.mass + massSum;
  const mf = massSum > 0 ? massSum : 1;
  const massRatio = (m0 / mf);
  const tsiolkovskyDv = Math.round(ispAvg * g0 * Math.log(massRatio));

  const muEarth = 3.986004418e14; // m^3/s^2
  const rMeters = mission.semiMajorAxisKm * 1000;
  const vOrb = Math.sqrt(muEarth / rMeters); // for circular
  const keplerPeriodSec = 2 * Math.PI * Math.sqrt(Math.pow(rMeters, 3) / muEarth);
  const keplerPeriodMin = (keplerPeriodSec / 60).toFixed(1);

  // Update Live Text Values
  DOM.mathM0.textContent = m0.toLocaleString() + ' kg';
  DOM.mathMf.textContent = mf.toLocaleString() + ' kg';
  DOM.mathIsp.textContent = ispAvg + ' s';
  DOM.mathDvRes.textContent = tsiolkovskyDv.toLocaleString() + ' m/s';
  DOM.mathR.textContent = mission.semiMajorAxisKm.toLocaleString() + ' km';
  DOM.mathVorb.textContent = (vOrb / 1000).toFixed(3) + ' km/s';
  DOM.mathSma.textContent = mission.semiMajorAxisKm.toLocaleString() + ' km';
  DOM.mathPeriod.textContent = keplerPeriodMin + ' min';

  // KaTeX live rendering (with offline text fallback)
  if (window.katex) {
    try {
      katex.render(`\\Delta v = I_{\\text{sp}} g_0 \\ln\\left(\\frac{m_0}{m_f}\\right) = ${ispAvg} \\times 9.81 \\times \\ln\\left(${massRatio.toFixed(1)}\\right) = ${tsiolkovskyDv}\\text{ m/s}`, DOM.katexTsiolkovsky, { throwOnError: false });
      katex.render(`v = \\sqrt{\\mu \\left(\\frac{2}{r} - \\frac{1}{a}\\right)} = ${(vOrb/1000).toFixed(3)}\\text{ km/s}`, DOM.katexVisviva, { throwOnError: false });
      katex.render(`T = 2\\pi \\sqrt{\\frac{a^3}{\\mu}} = ${keplerPeriodMin}\\text{ minutes}`, DOM.katexKepler3, { throwOnError: false });
      katex.render(`\\Delta v_{\\text{tot}} = \\Delta v_1 + \\Delta v_2 = ${mission.dvReq}\\text{ m/s}`, DOM.katexHohmann, { throwOnError: false });
      katex.render(`P_{\\text{net}} = \\sum P_{\\text{gen}} - \\sum P_{\\text{load}} = ${netPower}\\text{ W}`, DOM.katexPower, { throwOnError: false });
    } catch (e) {}
  }

  // Draw Tsiolkovsky curve canvas
  drawTsiolkovskyCurve(massRatio, ispAvg * g0);

  // Power breakdown table
  DOM.mathPowerBreakdown.textContent = '';
  const pFrag = document.createDocumentFragment();

  items.forEach(i => {
    if (i.power !== 0) {
      const row = document.createElement('div');
      row.className = 'power-item ' + (i.power > 0 ? 'gen' : 'load');
      row.innerHTML = `<span>${i.power > 0 ? '+' : '-'} ${i.name}:</span><strong class="mono">${i.power > 0 ? '+' : ''}${i.power} W</strong>`;
      pFrag.appendChild(row);
    }
  });

  const totRow = document.createElement('div');
  totRow.className = 'power-item total';
  totRow.innerHTML = `<span>NET POWER MARGIN:</span><strong class="mono">${netPower >= 0 ? '+' : ''}${netPower} W</strong>`;
  pFrag.appendChild(totRow);

  DOM.mathPowerBreakdown.appendChild(pFrag);
}

// ── TSIOLKOVSKY MASS-RATIO CURVE ──
function drawTsiolkovskyCurve(currentRatio, ve) {
  const canvas = DOM.tsiolkovskyCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Axes
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 10); ctx.lineTo(30, h - 20);
  ctx.lineTo(w - 10, h - 20);
  ctx.stroke();

  // Curve (ln curve)
  ctx.strokeStyle = '#0284C7';
  ctx.lineWidth = 1.8;
  ctx.beginPath();

  for (let px = 30; px <= w - 10; px += 2) {
    const ratio = 1 + ((px - 30) / (w - 40)) * 50; // 1 to 50
    const dvVal = Math.log(ratio);
    const py = (h - 20) - (dvVal / Math.log(50)) * (h - 30);
    if (px === 30) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Mark current design
  const clampRatio = Math.min(50, Math.max(1, currentRatio));
  const curX = 30 + ((clampRatio - 1) / 49) * (w - 40);
  const curY = (h - 20) - (Math.log(clampRatio) / Math.log(50)) * (h - 30);

  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.arc(curX, curY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#64748B';
  ctx.font = "8px 'JetBrains Mono', monospace";
  ctx.fillText('m0/mf = ' + currentRatio.toFixed(1), curX - 15, Math.max(12, curY - 8));
}

// ── CHASSIS CAD HIGHLIGHTS ──
function updateCadHighlights() {
  const hasSolar = STATE.equipped.has('solar-ultraflex');
  const hasAntenna = STATE.equipped.has('antenna-kaband') || STATE.equipped.has('antenna-xband');
  const hasThruster = STATE.equipped.has('thruster-coldgas') || STATE.equipped.has('thruster-biprop') || STATE.equipped.has('thruster-ion');
  const hasInst = STATE.equipped.has('imager-hires') || STATE.equipped.has('spectrometer-mass') || STATE.equipped.has('radar-sar');

  const solarL = document.getElementById('cad-solar-l');
  const solarR = document.getElementById('cad-solar-r');
  const antenna = document.getElementById('cad-antenna');
  const thruster = document.getElementById('cad-thruster');
  const inst = document.getElementById('cad-instrument');

  if (solarL) solarL.classList.toggle('active', hasSolar);
  if (solarR) solarR.classList.toggle('active', hasSolar);
  if (antenna) antenna.classList.toggle('active', hasAntenna);
  if (thruster) thruster.classList.toggle('active', hasThruster);
  if (inst) inst.classList.toggle('active', hasInst);
}

// ── RUNGE-KUTTA 4TH ORDER ORBITAL PROPAGATOR (Step 4) ──
function rk4Step(dt) {
  const mu = 3.986004418e14; // m^3/s^2 Earth gravity parameter

  function accel(pos) {
    const rMag = Math.hypot(pos[0], pos[1]);
    const factor = -mu / Math.pow(rMag, 3);
    return [pos[0] * factor, pos[1] * factor];
  }

  const s = STATE.rk4State;
  const p0 = s.r;
  const v0 = s.v;

  // k1
  const k1_v = accel(p0);
  const k1_p = v0;

  // k2
  const p1 = [p0[0] + 0.5 * dt * k1_p[0], p0[1] + 0.5 * dt * k1_p[1]];
  const v1 = [v0[0] + 0.5 * dt * k1_v[0], v0[1] + 0.5 * dt * k1_v[1]];
  const k2_v = accel(p1);
  const k2_p = v1;

  // k3
  const p2 = [p0[0] + 0.5 * dt * k2_p[0], p0[1] + 0.5 * dt * k2_p[1]];
  const v2 = [v0[0] + 0.5 * dt * k2_v[0], v0[1] + 0.5 * dt * k2_v[1]];
  const k3_v = accel(p2);
  const k3_p = v2;

  // k4
  const p3 = [p0[0] + dt * k3_p[0], p0[1] + dt * k3_p[1]];
  const v3 = [v0[0] + dt * k3_v[0], v0[1] + dt * k3_v[1]];
  const k4_v = accel(p3);
  const k4_p = v3;

  // Final update
  s.r = [
    p0[0] + (dt / 6) * (k1_p[0] + 2 * k2_p[0] + 2 * k3_p[0] + k4_p[0]),
    p0[1] + (dt / 6) * (k1_p[1] + 2 * k2_p[1] + 2 * k3_p[1] + k4_p[1])
  ];
  s.v = [
    v0[0] + (dt / 6) * (k1_v[0] + 2 * k2_v[0] + 2 * k3_v[0] + k4_v[0]),
    v0[1] + (dt / 6) * (k1_v[1] + 2 * k2_v[1] + 2 * k3_v[1] + k4_v[1])
  ];

  // Record trail
  s.trail.push([s.r[0], s.r[1]]);
  if (s.trail.length > 90) s.trail.shift();
}

// ── ORBIT HUD CANVAS RENDER ──
function drawOrbitHud() {
  const canvas = DOM.orbitHudCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  // Concentric radar grid
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 40, 0, Math.PI * 2);
  ctx.arc(cx, cy, 85, 0, Math.PI * 2);
  ctx.stroke();

  // Outer dashed ring
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, 120, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Cross axes
  ctx.beginPath();
  ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
  ctx.moveTo(0, cy); ctx.lineTo(w, cy);
  ctx.stroke();

  // Earth body (Center)
  ctx.fillStyle = '#2563EB';
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fill();

  // Fading trail from RK4 simulation
  const scale = 85 / 6871000;
  if (STATE.rk4State.trail.length > 1) {
    ctx.lineWidth = 1.5;
    for (let i = 1; i < STATE.rk4State.trail.length; i++) {
      const alpha = (i / STATE.rk4State.trail.length) * 0.7;
      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.beginPath();
      const p1 = STATE.rk4State.trail[i - 1];
      const p2 = STATE.rk4State.trail[i];
      ctx.moveTo(cx + p1[0] * scale, cy + p1[1] * scale);
      ctx.lineTo(cx + p2[0] * scale, cy + p2[1] * scale);
      ctx.stroke();
    }
  }

  // Active Spacecraft marker
  const sPos = STATE.rk4State.r;
  const craftX = cx + sPos[0] * scale;
  const craftY = cy + sPos[1] * scale;

  ctx.shadowColor = '#00F0FF';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#00F0FF';
  ctx.beginPath();
  ctx.arc(craftX, craftY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Rotating Reticle
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(STATE.simAngle * 0.5);
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const x = Math.cos(a) * 14;
    const y = Math.sin(a) * 14;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// ── NAVBALL 8-BALL CANVAS ──
function drawNavball() {
  const canvas = DOM.navballCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const r = w / 2;

  ctx.clearRect(0, 0, w, h);

  const t = Date.now() * 0.001;
  const pitch = Math.sin(t * 0.8) * 10 + 12.4;
  const roll = Math.cos(t * 0.5) * 3;

  ctx.save();
  ctx.beginPath();
  ctx.arc(r, r, r - 2, 0, Math.PI * 2);
  ctx.clip();

  ctx.translate(r, r);
  ctx.rotate((roll * Math.PI) / 180);
  const pOffset = (pitch / 90) * (r * 0.7);

  // Sky (blue)
  ctx.fillStyle = '#0284C7';
  ctx.fillRect(-r * 2, -r * 2 + pOffset, r * 4, r * 2);

  // Ground (slate)
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(-r * 2, pOffset, r * 4, r * 2);

  // Horizon
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r, pOffset);
  ctx.lineTo(r, pOffset);
  ctx.stroke();

  ctx.restore();

  ctx.strokeStyle = '#00F0FF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(r, r, r - 1.5, 0, Math.PI * 2);
  ctx.stroke();

  if (DOM.navballReadout) {
    DOM.navballReadout.textContent = `PITCH: ${pitch.toFixed(1)}°`;
  }
}

// ── KEPLER'S 2ND LAW & CONIC CANVAS ──
function drawKeplerConic() {
  const canvas = DOM.conicTransferCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = 100;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  // Earth
  ctx.fillStyle = '#2563EB';
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();

  // Equal-area sweep sector (Kepler's 2nd law visual demonstration)
  const sweepAngle = (STATE.simAngle * 0.8) % (Math.PI * 2);
  const deltaA = 0.35; // sector angle
  ctx.fillStyle = 'rgba(2, 132, 199, 0.18)';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, 140, sweepAngle, sweepAngle + deltaA);
  ctx.closePath();
  ctx.fill();

  // Dashed transfer ellipse
  ctx.strokeStyle = '#0284C7';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.ellipse(280, cy, 180, 50, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Spacecraft traveling on ellipse
  const sX = 280 + Math.cos(sweepAngle) * 180;
  const sY = cy + Math.sin(sweepAngle) * 50;

  ctx.fillStyle = '#0284C7';
  ctx.beginPath();
  ctx.arc(sX, sY, 4, 0, Math.PI * 2);
  ctx.fill();
}

// ── MISSION VIEW PREVIEW CANVAS ──
function drawMissionPreview() {
  const canvas = DOM.missionPreviewCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  // Center Earth
  ctx.fillStyle = '#2563EB';
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fill();

  // Orbit path depending on mission
  ctx.strokeStyle = '#00F0FF';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();

  if (STATE.mission === 'leo') {
    ctx.arc(cx, cy, 75, 0, Math.PI * 2);
  } else if (STATE.mission === 'lunar') {
    ctx.ellipse(cx, cy, 150, 65, 0, 0, Math.PI * 2);
  } else {
    ctx.ellipse(cx, cy, 175, 55, 0, 0, Math.PI * 2);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Craft
  const a = STATE.simAngle;
  let craftX, craftY;
  if (STATE.mission === 'leo') {
    craftX = cx + Math.cos(a) * 75;
    craftY = cy + Math.sin(a) * 75;
  } else if (STATE.mission === 'lunar') {
    craftX = cx + Math.cos(a) * 150;
    craftY = cy + Math.sin(a) * 65;
  } else {
    craftX = cx + Math.cos(a) * 175;
    craftY = cy + Math.sin(a) * 55;
  }

  ctx.fillStyle = '#00F0FF';
  ctx.beginPath();
  ctx.arc(craftX, craftY, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

// ── MASTER 60 FPS ANIMATION & PHYSICS INTEGRATION LOOP ──
function masterLoop(now) {
  if (document.hidden) {
    requestAnimationFrame(masterLoop);
    return;
  }

  const dtSec = Math.min(0.1, (now - STATE.lastFrameTime) / 1000);
  STATE.lastFrameTime = now;

  // Fixed-timestep integration for astrodynamics
  const effectiveDt = dtSec * STATE.timeWarp * 5;
  rk4Step(effectiveDt);

  STATE.simAngle += dtSec * 0.8 * Math.min(8, Math.max(1, Math.log10(STATE.timeWarp) + 1));

  // Render active canvases
  if (STATE.currentView === '01') {
    drawMissionPreview();
  } else if (STATE.currentView === '04') {
    drawOrbitHud();
    drawNavball();
    drawKeplerConic();
  }

  requestAnimationFrame(masterLoop);
}

// ── LIVE MET & UTC CLOCK UPDATES ──
function tickClocks() {
  const elapsedSec = Math.floor((Date.now() - STATE.metStartTime) / 1000) + STATE.metOffsetSec;
  const days = Math.floor(elapsedSec / 86400);
  const hours = Math.floor((elapsedSec % 86400) / 3600);
  const mins = Math.floor((elapsedSec % 3600) / 60);
  const secs = elapsedSec % 60;
  const metStr = `T+${String(days).padStart(3, '0')}:${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  if (DOM.ambientMet) DOM.ambientMet.textContent = metStr;

  const now = new Date();
  const year = now.getUTCFullYear();
  const start = new Date(Date.UTC(year, 0, 1));
  const doy = Math.floor((now - start) / 86400000) + 1;
  const utcStr = `${year}-${String(doy).padStart(3, '0')} // ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`;

  if (DOM.ambientUtc) DOM.ambientUtc.textContent = utcStr;
}

// ── HOLD-TO-CONFIRM LAUNCH CONTROLLER (Step 3) ──
let holdTimer = null;
let holdStart = 0;
const HOLD_DURATION = 1000; // 1 second

function startHoldLaunch(e) {
  if (!STATE.launchReady) {
    sfxWarn();
    showToast('Cannot launch: resolve pre-flight checklist violations.');
    return;
  }
  e.preventDefault();
  holdStart = Date.now();
  holdTimer = requestAnimationFrame(stepHoldLaunch);
}

function stepHoldLaunch() {
  const elapsed = Date.now() - holdStart;
  const ratio = Math.min(1, elapsed / HOLD_DURATION);

  // Circumference = 2 * PI * 54 = 339.29
  const offset = 339.29 * (1 - ratio);
  DOM.holdRingFill.style.strokeDashoffset = offset;

  if (ratio >= 1) {
    cancelAnimationFrame(holdTimer);
    holdTimer = null;
    DOM.holdRingFill.style.strokeDashoffset = 339.29;
    executeCinematicLaunch();
  } else {
    holdTimer = requestAnimationFrame(stepHoldLaunch);
  }
}

function cancelHoldLaunch() {
  if (holdTimer) {
    cancelAnimationFrame(holdTimer);
    holdTimer = null;
  }
  DOM.holdRingFill.style.strokeDashoffset = 339.29;
}

// ── CINEMATIC LAUNCH SEQUENCE (Step 4) ──
function executeCinematicLaunch() {
  sfxLaunch();
  DOM.cinematicOverlay.classList.remove('hidden');

  const mission = MISSIONS[STATE.mission];
  const vehicle = VEHICLES[STATE.vehicle];

  const stages = [
    { label: 'STAGE-0 IGNITION', text: 'T-10', sub: `${vehicle.name} MAIN ENGINES START`, progress: 10 },
    { label: 'LIFTOFF', text: 'T-00', sub: 'TOWER CLEARED // ROLL PROGRAM COMMENCED', progress: 30 },
    { label: 'MAX-Q', text: 'T+01:12', sub: 'MAXIMUM AERODYNAMIC DYNAMIC PRESSURE', progress: 55 },
    { label: 'MECO & STAGING', text: 'T+02:34', sub: 'STAGE 1 SEPARATION // VACUUM ENGINE IGNITION', progress: 75 },
    { label: 'PAYLOAD FAIRING JETTISON', text: 'T+03:15', sub: 'FAIRINGS SEPARATED // ATMOSPHERE CLEARED', progress: 90 },
    { label: 'ORBIT ACHIEVED', text: 'INSERTION', sub: `${mission.name} INSERTED INTO ${mission.vectorDesc}`, progress: 100 }
  ];

  let curStage = 0;

  function advanceStage() {
    if (curStage < stages.length) {
      const s = stages[curStage];
      DOM.cineStageLabel.textContent = s.label;
      DOM.cineMainText.textContent = s.text;
      DOM.cineSubText.textContent = s.sub;
      DOM.cineFill.style.width = s.progress + '%';
      playTone(800 + curStage * 150, 0.08, 'triangle', 0.04);
      curStage++;
      setTimeout(advanceStage, 1100);
    } else {
      setTimeout(() => {
        closeCinematicLaunch();
        switchView('04'); // Camera pull-back into Orbit HUD
        showToast('Launch Successful: Nominal Orbit Achieved.');
      }, 900);
    }
  }

  advanceStage();
}

function closeCinematicLaunch() {
  DOM.cinematicOverlay.classList.add('hidden');
}

// ── BIND EVENT LISTENERS & SHORTCUTS ──
function bindEvents() {
  // Navigation sidebar buttons
  DOM.navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Flow back / next buttons
  DOM.btnFlowPrev.addEventListener('click', () => {
    const cur = parseInt(STATE.currentView, 10);
    if (cur > 1) switchView(String(cur - 1).padStart(2, '0'));
  });

  DOM.btnFlowNext.addEventListener('click', () => {
    const cur = parseInt(STATE.currentView, 10);
    if (cur < 5) switchView(String(cur + 1).padStart(2, '0'));
  });

  // Step dots
  DOM.stepDots.forEach(dot => {
    dot.addEventListener('click', () => switchView(dot.dataset.step));
  });

  // Mission selection cards
  DOM.missionCards.forEach(card => {
    card.addEventListener('click', () => {
      sfxClick();
      DOM.missionCards.forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('active');
      card.setAttribute('aria-pressed', 'true');
      STATE.mission = card.dataset.mission;
      updateAll();
    });
  });

  // Vehicle selection cards
  DOM.vehicleCards.forEach(card => {
    card.addEventListener('click', () => {
      if (card.classList.contains('disabled')) {
        sfxWarn();
        showToast('Vehicle cannot lift current payload mass. Reduce mass first.');
        return;
      }
      sfxClick();
      DOM.vehicleCards.forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('active');
      card.setAttribute('aria-pressed', 'true');
      STATE.vehicle = card.dataset.vehicle;
      updateAll();
    });
  });

  // Subsystem category tabs
  DOM.categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sfxClick();
      renderSubsystems(tab.dataset.cat);
    });
  });

  // Time warp buttons
  document.querySelectorAll('.warp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfxClick();
      document.querySelectorAll('.warp-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.timeWarp = parseInt(btn.dataset.warp, 10);
    });
  });

  // Hold-to-confirm launch button
  DOM.btnHoldLaunch.addEventListener('mousedown', startHoldLaunch);
  DOM.btnHoldLaunch.addEventListener('touchstart', startHoldLaunch, { passive: false });
  window.addEventListener('mouseup', cancelHoldLaunch);
  window.addEventListener('touchend', cancelHoldLaunch);

  // Popover Toggles
  DOM.btnTelemetryPopover.addEventListener('click', () => DOM.telemetryPopover.classList.remove('hidden'));
  DOM.btnCloseTelemetry.addEventListener('click', () => DOM.telemetryPopover.classList.add('hidden'));

  DOM.btnShortcutsPopover.addEventListener('click', () => DOM.shortcutsPopover.classList.remove('hidden'));
  DOM.btnCloseShortcuts.addEventListener('click', () => DOM.shortcutsPopover.classList.add('hidden'));

  DOM.btnSources.addEventListener('click', () => DOM.sourcesModal.classList.remove('hidden'));
  DOM.btnCloseSources.addEventListener('click', () => DOM.sourcesModal.classList.add('hidden'));

  // Advisor Drawer Toggle
  DOM.btnAdvisorToggle.addEventListener('click', () => DOM.advisorDrawer.classList.remove('hidden'));
  DOM.btnCloseAdvisor.addEventListener('click', () => DOM.advisorDrawer.classList.add('hidden'));

  // Audio Toggle
  DOM.btnAudio.addEventListener('click', () => {
    STATE.audioEnabled = !STATE.audioEnabled;
    if (STATE.audioEnabled) {
      initAudio();
      DOM.audioState.textContent = 'ON';
      DOM.btnAudio.classList.add('active');
      sfxClick();
    } else {
      DOM.audioState.textContent = 'OFF';
      DOM.btnAudio.classList.remove('active');
    }
  });

  // Equation derivation toggles
  document.querySelectorAll('.eq-expand-toggle').forEach(btn => {
    btn.addEventListener('click', e => {
      const box = e.target.closest('.equation-box');
      const deriv = box.querySelector('.eq-derivation');
      if (deriv) {
        const isHidden = deriv.classList.toggle('hidden');
        btn.textContent = isHidden ? 'Derivation ▾' : 'Hide ▴';
      }
    });
  });

  // Interactive Equation Variable Hover Pulse
  document.querySelectorAll('.eq-val-tag').forEach(tag => {
    tag.addEventListener('mouseenter', () => {
      const target = tag.dataset.target;
      if (target === 'mass') DOM.vitalMass.style.color = '#00F0FF';
      if (target === 'dv') DOM.vitalDv.style.color = '#00F0FF';
    });
    tag.addEventListener('mouseleave', () => {
      DOM.vitalMass.style.color = '';
      DOM.vitalDv.style.color = '';
    });
  });

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();

    // Ctrl + Z (Undo)
    if ((e.ctrlKey || e.metaKey) && key === 'z') {
      e.preventDefault();
      undoLastAction();
      return;
    }

    // Esc closes modals & drawers or skips cinematic launch
    if (key === 'escape') {
      DOM.telemetryPopover.classList.add('hidden');
      DOM.shortcutsPopover.classList.add('hidden');
      DOM.sourcesModal.classList.add('hidden');
      DOM.advisorDrawer.classList.add('hidden');
      if (!DOM.cinematicOverlay.classList.contains('hidden')) {
        closeCinematicLaunch();
        switchView('04');
      }
      return;
    }

    // Stage switching [1-5]
    if (['1', '2', '3', '4', '5'].includes(key)) {
      switchView('0' + key);
      return;
    }

    // Category tabs [Q-T]
    const catMap = { q: 'power', w: 'comms', e: 'instruments', r: 'propulsion', t: 'chassis' };
    if (catMap[key]) {
      renderSubsystems(catMap[key]);
      return;
    }

    // Audio toggle [M]
    if (key === 'm') {
      DOM.btnAudio.click();
      return;
    }

    // Shortcuts help [?]
    if (key === '?' || (e.shiftKey && key === '/')) {
      DOM.shortcutsPopover.classList.toggle('hidden');
      return;
    }

    // Spacebar to trigger launch if on view 05
    if (key === ' ' && STATE.currentView === '05' && !holdTimer) {
      e.preventDefault();
      startHoldLaunch(e);
    }
  });

  document.addEventListener('keyup', e => {
    if (e.key === ' ' && holdTimer) {
      cancelHoldLaunch();
    }
  });
}

// ── INITIAL BOOT SEQUENCE ──
(function boot() {
  setTimeout(() => {
    const loader = document.getElementById('loading-skeleton');
    const app = document.getElementById('app');

    if (loader) loader.classList.add('fade-out');

    setTimeout(() => {
      if (loader) loader.classList.add('hidden');
      if (app) app.classList.remove('hidden');

      cacheDom();
      bindEvents();
      renderSubsystems('power');
      updateAll();

      // Launch physics engine & tick loops
      requestAnimationFrame(masterLoop);
      setInterval(tickClocks, 200);
    }, 350);
  }, 1000);
})();
