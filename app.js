/* ═══════════════════════════════════════════════════════════════
   AETHEL // JPL — Space Mission Engineering Simulator
   Core Avionics & Telemetry Engine — Vanilla ES6 State Machine
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ── NASA LAUNCH SERVICES PROGRAM SPECIFICATIONS ──
const VEHICLES = {
  falcon9: {
    name: 'Falcon 9',
    mass: 22800,
    cost: 67,
    id: 'falcon9',
    desc: 'Cost-optimized reusable booster'
  },
  falconheavy: {
    name: 'Falcon Heavy',
    mass: 63800,
    cost: 97,
    id: 'falconheavy',
    desc: 'Tri-core heavy lift launcher'
  },
  sls: {
    name: 'SLS Block 1',
    mass: 95000,
    cost: 2100,
    id: 'sls',
    desc: 'NASA deep space exploration vehicle'
  }
};

// ── ASTRODYNAMICS MISSION PROFILES ──
const MISSIONS = {
  leo: {
    name: 'LEO Satellite',
    type: 'leo',
    targetData: 10,
    targetVel: '7.613 km/s',
    periapsis: '500.0 km',
    apoapsis: '500.0 km',
    inc: '51.6°',
    dvReq: 150,
    periodMin: 94.6,
    code: 'M-LEO-500K',
    reqText: 'REQ: 500KM CIRCULAR // INC 51.6°',
    vector: 'LEO SATELLITE FLIGHT PATH'
  },
  lunar: {
    name: 'Lunar Rover',
    type: 'lunar',
    targetData: 5,
    targetVel: '10.920 km/s',
    periapsis: '185.0 km',
    apoapsis: '384,400 km',
    inc: '28.5°',
    dvReq: 3100,
    periodMin: 655,
    code: 'M-CISLUNAR-ARTEMIS',
    reqText: 'REQ: CISLUNAR FREE-RETURN // INC 28.5°',
    vector: 'TRANSLUNAR INJECTION CONIC'
  },
  mars: {
    name: 'Mars Probe',
    type: 'mars',
    targetData: 2,
    targetVel: '11.570 km/s',
    periapsis: '250.0 km',
    apoapsis: 'HOHMANN AP',
    inc: '1.85°',
    dvReq: 5600,
    periodMin: 372960,
    code: 'M-INTERPLANETARY-MARS',
    reqText: 'REQ: HOHMANN TRANSFER // ECLIPSE BUFFER',
    vector: 'HELIOCENTRIC MARS TRAJECTORY'
  }
};

// ── REALISTIC NASA/JPL SUBSYSTEM DATABASE ──
const SUBSYSTEMS = {
  power: {
    label: 'Power Generation',
    items: [
      {
        id: 'solar-ultraflex',
        name: 'UltraFlex Dual Solar Wings',
        desc: 'Gallium Arsenide flexible arrays (150 W/kg) with accordion deployment.',
        mass: 120,
        power: 450,
        cost: 18,
        data: 0,
        svgTarget: 'solar'
      },
      {
        id: 'rtg-plutonium',
        name: 'NextGen Plutonium-238 RTG',
        desc: 'Stirling radioisotope generator. Continuous power unaffected by eclipse.',
        mass: 380,
        power: 350,
        cost: 95,
        data: 0,
        svgTarget: 'thruster'
      },
      {
        id: 'battery-liion',
        name: 'Li-Ion Battery Buffer (40 Ah)',
        desc: 'High-density cells for eclipse buffering with integrated thermal jacket.',
        mass: 45,
        power: 60,
        cost: 5,
        data: 0,
        svgTarget: null
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
        svgTarget: 'antenna'
      },
      {
        id: 'antenna-sband',
        name: 'S-Band Omni Antenna',
        desc: 'Low-gain omni array for emergency commanding and housekeeping uplink.',
        mass: 12,
        power: -15,
        cost: 3,
        data: 5,
        svgTarget: 'antenna'
      },
      {
        id: 'antenna-xband',
        name: 'X-Band Steerable Dish',
        desc: 'Gimballed dual-polarization dish for medium orbit data downlinks.',
        mass: 35,
        power: -50,
        cost: 12,
        data: 40,
        svgTarget: 'antenna'
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
        svgTarget: 'instruments'
      },
      {
        id: 'spectrometer-mass',
        name: 'Quadrupole Mass Spectrometer',
        desc: 'In-situ atmospheric gas and volatile analysis with electron-impact source.',
        mass: 28,
        power: -55,
        cost: 30,
        data: -3,
        svgTarget: 'instruments'
      },
      {
        id: 'radar-sar',
        name: 'Synthetic Aperture Radar (SAR)',
        desc: 'C-band all-weather radar with 5m resolution for planetary topographic mapping.',
        mass: 150,
        power: -200,
        cost: 60,
        data: -25,
        svgTarget: 'instruments'
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
        svgTarget: 'thruster'
      },
      {
        id: 'thruster-biprop',
        name: 'MMH/NTO Bipropellant Engine',
        desc: '445N thrust, Isp 320s. Restartable for orbit circularization burns.',
        mass: 180,
        power: -20,
        cost: 25,
        data: 0,
        svgTarget: 'thruster'
      },
      {
        id: 'thruster-ion',
        name: 'Xenon Ion Thruster (NEXT-C)',
        desc: 'NASA Evolutionary Xenon Thruster. 6.9kW, 236mN, Isp 4190s high efficiency.',
        mass: 95,
        power: -300,
        cost: 35,
        data: 0,
        svgTarget: 'thruster'
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
        svgTarget: null
      },
      {
        id: 'chassis-medium',
        name: 'Medium Explorer Platform',
        desc: 'Heritage MidEx chassis with modular avionics and honeycombed panels.',
        mass: 250,
        power: -60,
        cost: 40,
        data: 0,
        svgTarget: null
      },
      {
        id: 'chassis-flagship',
        name: 'Flagship Deep Space Bus',
        desc: 'Radiation-hardened chassis with dual fault-tolerant MIL-STD-1553B bus.',
        mass: 600,
        power: -120,
        cost: 150,
        data: 0,
        svgTarget: null
      }
    ]
  }
};

// ── GLOBAL SIMULATOR STATE ──
const STATE = {
  mission: 'leo',
  vehicle: 'falcon9',
  // Initial 5 equipped components matching target telemetry specs
  equipped: new Set([
    'solar-ultraflex',
    'antenna-kaband',
    'imager-hires',
    'spectrometer-mass',
    'thruster-coldgas'
  ]),
  audioEnabled: false,
  activeTab: 'power',
  activeView: 'trajectory',
  timeWarp: 1,
  metOffsetSec: 142 * 86400 + 8 * 3600 + 24 * 60 + 19, // T+142:08:24:19
  metStartTime: Date.now(),
  launchReady: true,
  animationAngle: 0
};

// ── FORMAT CURRENCY HELPER (Guarantees no stray backslashes) ──
function formatCurrency(amountMillions) {
  if (amountMillions >= 1000) {
    return '$' + (amountMillions / 1000).toFixed(1) + 'B';
  }
  return '$' + amountMillions.toFixed(1) + 'M';
}

// ── DOM ELEMENTS CACHE ──
const DOM = {};
function cacheDom() {
  DOM.app = document.getElementById('app');
  DOM.loader = document.getElementById('loading-skeleton');
  DOM.errorScreen = document.getElementById('error-screen');
  DOM.errorMsg = document.getElementById('error-msg');

  // Clocks & Readouts
  DOM.metClock = document.getElementById('met-clock');
  DOM.utcClock = document.getElementById('utc-clock');
  DOM.hudOrbit = document.getElementById('hud-orbit');
  DOM.missionIdBadge = document.getElementById('mission-id-badge');

  // Top Selector
  DOM.trajectoryReq = document.getElementById('trajectory-req');
  DOM.vehicleCapLabel = document.getElementById('vehicle-cap-label');
  DOM.missionBtns = document.querySelectorAll('.choice-btn[data-mission]');
  DOM.vehicleBtns = document.querySelectorAll('.choice-btn[data-vehicle]');

  // Telemetry Gauges
  DOM.massVal = document.getElementById('mass-val');
  DOM.massPct = document.getElementById('mass-pct');
  DOM.massMaxText = document.getElementById('mass-max-text');
  DOM.massMargin = document.getElementById('mass-margin');
  DOM.massStatus = document.getElementById('mass-status');
  DOM.massFill = document.getElementById('mass-fill');
  DOM.gaugeMass = document.getElementById('gauge-mass');

  DOM.powerVal = document.getElementById('power-val');
  DOM.powerPct = document.getElementById('power-pct');
  DOM.powerSubText = document.getElementById('power-sub-text');
  DOM.battBuffer = document.getElementById('batt-buffer');
  DOM.powerStatus = document.getElementById('power-status');
  DOM.powerFill = document.getElementById('power-fill');
  DOM.gaugePower = document.getElementById('gauge-power');

  DOM.budgetVal = document.getElementById('budget-val');
  DOM.budgetPct = document.getElementById('budget-pct');
  DOM.budgetSubText = document.getElementById('budget-sub-text');
  DOM.budgetReserve = document.getElementById('budget-reserve');
  DOM.budgetStatus = document.getElementById('budget-status');
  DOM.budgetFill = document.getElementById('budget-fill');
  DOM.gaugeBudget = document.getElementById('gauge-budget');

  DOM.dataVal = document.getElementById('data-val');
  DOM.dataTargetText = document.getElementById('data-target-text');
  DOM.dataSubText = document.getElementById('data-sub-text');
  DOM.dataMargin = document.getElementById('data-margin');
  DOM.dataStatus = document.getElementById('data-status');
  DOM.dataFill = document.getElementById('data-fill');
  DOM.gaugeData = document.getElementById('gauge-data');

  // Middle HUD elements
  DOM.hudMainTitle = document.getElementById('hud-main-title');
  DOM.hudMetaText = document.getElementById('hud-meta-text');
  DOM.hudConicTag = document.getElementById('hud-conic-tag');
  DOM.orbitCanvas = document.getElementById('orbit-canvas');
  DOM.navballCanvas = document.getElementById('navball-canvas');
  DOM.conicCanvas = document.getElementById('conic-canvas');
  DOM.overTarget = document.getElementById('over-target');
  DOM.overPeri = document.getElementById('over-peri');
  DOM.overVel = document.getElementById('over-vel');
  DOM.navballReadout = document.getElementById('navball-readout');

  // Trajectory Conic Stats
  DOM.trajDv = document.getElementById('traj-dv');
  DOM.trajTwr = document.getElementById('traj-twr');
  DOM.trajPeriod = document.getElementById('traj-period');
  DOM.trajTargetLabel = document.getElementById('traj-target-label');

  // Subsystem Outfitter
  DOM.outfitter = document.getElementById('subsystem-outfitter');
  DOM.equippedCount = document.getElementById('equipped-count');
  DOM.footerModulesCount = document.getElementById('footer-modules-count');

  // Advisor & Sequencer
  DOM.advisorLog = document.getElementById('advisor-log');
  DOM.btnLaunch = document.getElementById('btn-launch');
  DOM.launchSubStatus = document.getElementById('launch-sub-status');
  DOM.launchOverlay = document.getElementById('launch-overlay');
  DOM.countdownText = document.getElementById('countdown-text');
  DOM.launchProgressFill = document.getElementById('launch-progress-fill');
  DOM.launchTargetDesc = document.getElementById('launch-target-desc');

  // Audio & Navigation
  DOM.btnAudio = document.getElementById('btn-audio');
  DOM.audioState = document.getElementById('audio-state');
  DOM.sideDownlink = document.getElementById('side-downlink');
  DOM.sideDoppler = document.getElementById('side-doppler');

  // Modals
  DOM.sourcesModal = document.getElementById('sources-modal');
  DOM.btnSources = document.getElementById('btn-sources');
  DOM.btnCloseSources = document.getElementById('btn-close-sources');
}

// ── NATIVE WEB AUDIO SYNTHESIS (Zero External Audio Assets) ──
let audioCtx = null;
function initAudio() {
  if (audioCtx) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (AudioContextClass) {
    audioCtx = new AudioContextClass();
  }
}

function playTone(freq, duration, type, volume) {
  if (!STATE.audioEnabled || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(volume || 0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Graceful fallback for audio restriction
  }
}

function sfxClick() { playTone(2400, 0.04, 'square', 0.03); }
function sfxEquip() { playTone(1800, 0.07, 'triangle', 0.05); }
function sfxUnequip() { playTone(820, 0.07, 'triangle', 0.04); }
function sfxError() { playTone(140, 0.22, 'sawtooth', 0.08); }
function sfxLaunch() {
  playTone(55, 1.2, 'sawtooth', 0.12);
  playTone(110, 1.2, 'sine', 0.08);
}

// ── HELPER: GET EQUIPPED MODULES LIST ──
function getEquippedItems() {
  const list = [];
  for (const cat of Object.values(SUBSYSTEMS)) {
    for (const item of cat.items) {
      if (STATE.equipped.has(item.id)) {
        list.push(item);
      }
    }
  }
  return list;
}

// ── RENDER SUBSYSTEM OUTFITTER ──
function renderSubsystems(categoryKey) {
  const cat = SUBSYSTEMS[categoryKey];
  if (!cat) return;

  const frag = document.createDocumentFragment();

  cat.items.forEach(item => {
    const card = document.createElement('div');
    const isEquipped = STATE.equipped.has(item.id);
    card.className = 'component-card' + (isEquipped ? ' equipped' : '');
    card.dataset.id = item.id;

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
        <span class="comp-badge ${item.power >= 0 ? 'pos' : 'neg'}">PWR: <strong>${pwrSign}${item.power}W</strong></span>
        <span class="comp-badge neg">COST: <strong>-${formatCurrency(item.cost)}</strong></span>
        ${item.data !== 0 ? `<span class="comp-badge ${item.data > 0 ? 'pos' : 'neg'}">DATA: <strong>${dataSign}${item.data} Mbps</strong></span>` : ''}
      </div>
    `;

    card.addEventListener('click', () => toggleComponent(item.id));
    frag.appendChild(card);
  });

  DOM.outfitter.textContent = '';
  DOM.outfitter.appendChild(frag);
}

// ── TOGGLE COMPONENT STATE ──
function toggleComponent(itemId) {
  if (STATE.equipped.has(itemId)) {
    STATE.equipped.delete(itemId);
    sfxUnequip();
  } else {
    STATE.equipped.add(itemId);
    sfxEquip();
  }
  renderSubsystems(STATE.activeTab);
  updateTelemetry();
  updateChassisSvgHighlights();
}

// ── UPDATE TELEMETRY (All metrics strictly derived from real state) ──
function updateTelemetry() {
  const vehicle = VEHICLES[STATE.vehicle];
  const mission = MISSIONS[STATE.mission];
  const items = getEquippedItems();

  let totalMass = 0;
  let totalPowerGen = 0;
  let totalPowerLoad = 0;
  let totalSubsystemCost = 0;
  let totalDataPayload = 0;

  items.forEach(item => {
    totalMass += item.mass;
    if (item.power >= 0) {
      totalPowerGen += item.power;
    } else {
      totalPowerLoad += Math.abs(item.power);
    }
    totalSubsystemCost += item.cost;
    totalDataPayload += item.data;
  });

  const netPower = totalPowerGen - totalPowerLoad;
  const totalCost = vehicle.cost + totalSubsystemCost;
  const projectBudgetCap = 250.0;
  const budgetReserve = projectBudgetCap - totalCost;

  // 1. Mass Telemetry
  const massRatio = (totalMass / vehicle.mass) * 100;
  const structuralMargin = Math.max(0, 100 - massRatio);
  DOM.massVal.textContent = totalMass.toLocaleString();
  DOM.massPct.textContent = massRatio.toFixed(1) + '%';
  DOM.massMaxText.textContent = 'MAX: ' + vehicle.mass.toLocaleString() + ' KG';
  DOM.massMargin.textContent = structuralMargin.toFixed(1) + '%';
  DOM.massFill.style.width = Math.min(massRatio, 100) + '%';

  DOM.gaugeMass.className = 'metric-card';
  if (massRatio > 100) {
    DOM.gaugeMass.classList.add('alert');
    DOM.massStatus.className = 'metric-chip alert';
    DOM.massStatus.textContent = '[OVERCAPACITY]';
  } else if (massRatio > 85) {
    DOM.gaugeMass.classList.add('warn');
    DOM.massStatus.className = 'metric-chip warn';
    DOM.massStatus.textContent = '[MARGIN CRITICAL]';
  } else {
    DOM.massStatus.className = 'metric-chip nominal';
    DOM.massStatus.textContent = '[NOMINAL]';
  }

  // 2. Power Telemetry
  const powerSign = netPower >= 0 ? '+' : '';
  DOM.powerVal.textContent = powerSign + netPower;
  DOM.powerPct.textContent = powerSign + netPower + ' W';
  DOM.powerSubText.textContent = 'GEN: ' + totalPowerGen + 'W | LOAD: ' + totalPowerLoad + 'W';
  const batteryBufferWh = Math.max(0, (totalPowerGen * 0.22)).toFixed(1);
  DOM.battBuffer.textContent = batteryBufferWh + ' Wh';

  const powerBarWidth = totalPowerGen > 0
    ? (totalPowerGen / (totalPowerGen + totalPowerLoad)) * 100
    : 0;
  DOM.powerFill.style.width = Math.min(100, Math.max(5, powerBarWidth)) + '%';

  DOM.gaugePower.className = 'metric-card';
  if (netPower < 0) {
    DOM.gaugePower.classList.add('alert');
    DOM.powerStatus.className = 'metric-chip alert';
    DOM.powerStatus.textContent = '[DEFICIT]';
  } else if (netPower > 0) {
    DOM.powerStatus.className = 'metric-chip surplus';
    DOM.powerStatus.textContent = '[SURPLUS]';
  } else {
    DOM.powerStatus.className = 'metric-chip nominal';
    DOM.powerStatus.textContent = '[BALANCED]';
  }

  // 3. Project Budget Telemetry
  const budgetRatio = (totalCost / projectBudgetCap) * 100;
  DOM.budgetVal.textContent = formatCurrency(totalCost);
  DOM.budgetPct.textContent = budgetRatio.toFixed(1) + '%';
  DOM.budgetSubText.textContent = 'CAP: ' + formatCurrency(projectBudgetCap);
  DOM.budgetReserve.textContent = formatCurrency(Math.max(0, budgetReserve));
  DOM.budgetFill.style.width = Math.min(budgetRatio, 100) + '%';

  DOM.gaugeBudget.className = 'metric-card';
  if (totalCost > projectBudgetCap) {
    DOM.gaugeBudget.classList.add('alert');
    DOM.budgetStatus.className = 'metric-chip alert';
    DOM.budgetStatus.textContent = '[EXCEEDED]';
  } else if (budgetRatio > 90) {
    DOM.gaugeBudget.classList.add('warn');
    DOM.budgetStatus.className = 'metric-chip warn';
    DOM.budgetStatus.textContent = '[RESERVE LOW]';
  } else {
    DOM.budgetStatus.className = 'metric-chip nominal';
    DOM.budgetStatus.textContent = '[FUNDED]';
  }

  // 4. Data Telemetry
  const netThroughput = Math.max(0, totalDataPayload);
  DOM.dataVal.textContent = netThroughput.toFixed(1);
  DOM.dataTargetText.textContent = 'TGT: ' + mission.targetData + 'M';
  DOM.dataSubText.textContent = 'PAYLOAD: ' + Math.max(0, Math.abs(totalDataPayload)).toFixed(1) + ' Mbps';
  const dataRatio = (netThroughput / (mission.targetData * 3)) * 100;
  DOM.dataFill.style.width = Math.min(Math.max(dataRatio, 5), 100) + '%';

  const dsnLinkMarginDb = (+23.4 + (netThroughput > mission.targetData ? 2.5 : -5.0)).toFixed(1);
  DOM.dataMargin.textContent = (dsnLinkMarginDb > 0 ? '+' : '') + dsnLinkMarginDb + ' dB';

  DOM.gaugeData.className = 'metric-card';
  if (netThroughput < mission.targetData && items.length > 0) {
    DOM.gaugeData.classList.add('warn');
    DOM.dataStatus.className = 'metric-chip warn';
    DOM.dataStatus.textContent = '[BANDWIDTH LOW]';
  } else {
    DOM.dataStatus.className = 'metric-chip nominal';
    DOM.dataStatus.textContent = '[NOMINAL LINK]';
  }

  // Counts & Status Bar
  DOM.equippedCount.textContent = items.length + ' SUBSYSTEMS';
  DOM.footerModulesCount.textContent = items.length + ' MODULES EQUIPPED';
  DOM.sideDownlink.textContent = (84.2 + (netThroughput > 0 ? 0.0 : -40.0)).toFixed(1) + ' MB/S';

  // Mission Headers Update
  DOM.hudOrbit.textContent = 'AP: ' + mission.apoapsis + ' // PE: ' + mission.periapsis + ' | INC: ' + mission.inc;
  DOM.missionIdBadge.textContent = mission.code;
  DOM.trajectoryReq.textContent = mission.reqText;
  DOM.vehicleCapLabel.textContent = 'CAP: ' + vehicle.mass.toLocaleString() + ' KG // BASE: ' + formatCurrency(vehicle.cost);

  DOM.overTarget.textContent = mission.name.toUpperCase();
  DOM.overPeri.textContent = mission.periapsis;
  DOM.overVel.textContent = mission.targetVel;

  DOM.hudMainTitle.textContent = mission.name.toUpperCase() + ' ORBITAL INSERTION HUD';
  DOM.hudMetaText = `CONIC: ORBIT-04 | TOF: ${mission.periodMin} min | dV_REQ: ${mission.dvReq} m/s`;
  DOM.trajDv.textContent = mission.dvReq;
  DOM.trajPeriod.textContent = mission.periodMin > 1440
    ? (mission.periodMin / 1440).toFixed(0) + ' days'
    : mission.periodMin.toFixed(1);
  DOM.trajTargetLabel.textContent = mission.vector;

  // Thrust-to-weight ratio
  const twrVal = totalMass > 0 ? (445 / (totalMass * 9.81)).toFixed(2) : '0.00';
  DOM.trajTwr.textContent = twrVal;

  // Launch Sequencer Readiness Evaluation
  const massValid = totalMass > 0 && totalMass <= vehicle.mass;
  const powerValid = netPower >= 0;
  const modulesPresent = items.length > 0;
  const budgetValid = totalCost <= projectBudgetCap;

  STATE.launchReady = massValid && powerValid && modulesPresent && budgetValid;

  DOM.btnLaunch.disabled = !STATE.launchReady;
  DOM.btnLaunch.className = 'btn-launch';

  if (STATE.launchReady) {
    DOM.btnLaunch.classList.add('go');
    DOM.launchSubStatus.textContent = 'ALL SYSTEMS GO — PRESS SPACE TO LAUNCH';
  } else {
    DOM.btnLaunch.classList.add('no-go');
    if (totalMass > vehicle.mass) {
      DOM.launchSubStatus.textContent = 'PAYLOAD EXCEEDS VEHICLE MASS CAP';
    } else if (netPower < 0) {
      DOM.launchSubStatus.textContent = 'POWER DEFICIT PREVENTS LAUNCH';
    } else if (totalCost > projectBudgetCap) {
      DOM.launchSubStatus.textContent = 'PROJECT EXCEEDS APPROVED BUDGET';
    } else {
      DOM.launchSubStatus.textContent = 'SELECT COMPATIBLE SUBSYSTEMS';
    }
  }

  // Chief Avionics Educational Advisor Feedback
  runAdvisorDiagnostics(items, totalMass, netPower, netThroughput, vehicle, mission);
}

// ── CHIEF AVIONICS ADVISOR LOGIC (Autonomous Educational Engine) ──
function runAdvisorDiagnostics(items, totalMass, netPower, netThroughput, vehicle, mission) {
  DOM.advisorLog.textContent = '';
  const frag = document.createDocumentFragment();

  function pushLog(msg, type) {
    const row = document.createElement('div');
    row.className = 'adv-msg ' + (type || 'system');
    row.textContent = msg;
    frag.appendChild(row);
  }

  if (items.length === 0) {
    pushLog('> DIAGNOSTIC: Zero subsystems equipped. Avionics bus idling.', 'system');
    DOM.advisorLog.appendChild(frag);
    return;
  }

  pushLog(`> MISSION PROFILE: ${mission.name} | VEHICLE: ${vehicle.name}`, 'system');

  // Structural & Mass Check
  if (totalMass > vehicle.mass) {
    const delta = totalMass - vehicle.mass;
    pushLog(`> CRITICAL: Payload mass (${totalMass.toLocaleString()} kg) exceeds ${vehicle.name} limit by ${delta.toLocaleString()} kg. De-orbit trajectory impossible.`, 'critical');
  } else {
    const margin = ((1 - totalMass / vehicle.mass) * 100).toFixed(1);
    pushLog(`> NOMINAL: Structural mass envelope verified. Launch vehicle payload margin: ${margin}%.`, 'nominal');
  }

  // Power Balance Check
  if (netPower < 0) {
    pushLog('> WARNING: Power deficit detected. Deep space missions cannot rely on battery reserves. Equip RTGs or expand Solar Arrays.', 'warn');
  } else if (netPower === 0) {
    pushLog('> ADVISORY: Net power zero margin. No reserve available for transmitter bursts or safe mode survival.', 'advisory');
  } else {
    pushLog(`> NOMINAL: Power surplus +${netPower}W. Steady-state generation covers peak instrument draw.`, 'nominal');
  }

  // Downlink Check
  if (netThroughput < mission.targetData) {
    pushLog('> ADVISORY: Downlink bandwidth insufficient for high-res telemetry. Upgrade to Ka-Band High-Gain Antenna.', 'advisory');
  }

  // Contextual Engineering Rules
  const hasRtg = STATE.equipped.has('rtg-plutonium');
  const hasSolar = STATE.equipped.has('solar-ultraflex');
  const hasBattery = STATE.equipped.has('battery-liion');
  const hasIon = STATE.equipped.has('thruster-ion');

  if (mission.type === 'leo' && hasRtg) {
    pushLog('> WARNING: RTGs add unnecessary mass and radioactive risk in LEO where solar irradiance is nominal.', 'warn');
  }

  if (mission.type === 'mars' && hasSolar && !hasRtg) {
    pushLog('> ADVISORY: Eclipse corridor modeled. Battery buffer insufficient for 35m Umbra transit. RTG recommended for continuous thermal decay conversion.', 'advisory');
  }

  if (hasIon && netPower < 280) {
    pushLog('> WARNING: NEXT-C ion thruster requires high voltage bus. Current power generation limits continuous duty cycle.', 'warn');
  }

  // Verification
  if (STATE.launchReady) {
    pushLog('> ✓ FLIGHT DIRECTIVE: All primary systems nominal. Stage-0 launch sequencer armed.', 'nominal');
  }

  DOM.advisorLog.appendChild(frag);
  DOM.advisorLog.scrollTop = DOM.advisorLog.scrollHeight;
}

// ── SVG CHASSIS HIGHLIGHTS ──
function updateChassisSvgHighlights() {
  const solarL = document.getElementById('svg-solar-l');
  const solarR = document.getElementById('svg-solar-r');
  const antenna = document.getElementById('svg-antenna');
  const thruster = document.getElementById('svg-thruster');
  const instruments = document.getElementById('svg-instruments');
  const leadersGroup = document.getElementById('svg-leaders');

  const hasSolar = STATE.equipped.has('solar-ultraflex');
  const hasAntenna = STATE.equipped.has('antenna-kaband') || STATE.equipped.has('antenna-xband');
  const hasThruster = STATE.equipped.has('thruster-coldgas') || STATE.equipped.has('thruster-biprop') || STATE.equipped.has('thruster-ion');
  const hasInst = STATE.equipped.has('imager-hires') || STATE.equipped.has('spectrometer-mass') || STATE.equipped.has('radar-sar');

  if (solarL) solarL.classList.toggle('active', hasSolar);
  if (solarR) solarR.classList.toggle('active', hasSolar);
  if (antenna) antenna.classList.toggle('active', hasAntenna);
  if (thruster) thruster.classList.toggle('active', hasThruster);
  if (instruments) instruments.classList.toggle('active', hasInst);

  if (leadersGroup) {
    leadersGroup.textContent = '';
    const frag = document.createDocumentFragment();

    const tags = [
      { show: hasSolar, text: 'ULTRAFLEX WINGS', x: 60, y: 110 },
      { show: hasAntenna, text: 'KA-BAND REFLECTOR', x: 270, y: 65 },
      { show: hasInst, text: 'OPTICAL SENSOR BAY', x: 380, y: 140 },
      { show: hasThruster, text: 'RCS ATTITUDE CLUSTER', x: 310, y: 220 }
    ];

    tags.forEach(t => {
      if (t.show) {
        const textNode = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textNode.setAttribute('x', t.x);
        textNode.setAttribute('y', t.y);
        textNode.setAttribute('fill', '#00F0FF');
        textNode.setAttribute('font-size', '9');
        textNode.setAttribute('font-family', "'JetBrains Mono', monospace");
        textNode.setAttribute('text-anchor', 'middle');
        textNode.textContent = t.text;
        frag.appendChild(textNode);
      }
    });

    leadersGroup.appendChild(frag);
  }
}

// ── 8-BALL NAVBALL ATTITUDE INDICATOR (Canvas) ──
function drawNavball() {
  const canvas = DOM.navballCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const r = w / 2;

  ctx.clearRect(0, 0, w, h);

  // Time-based pitch and roll simulation
  const time = Date.now() * 0.001;
  const pitchAngle = Math.sin(time * 0.8) * 12 + 12.4; // +12.4 deg average
  const rollAngle = Math.cos(time * 0.5) * 4;

  ctx.save();
  // Clip to circle
  ctx.beginPath();
  ctx.arc(r, r, r - 2, 0, Math.PI * 2);
  ctx.clip();

  // Rotate for roll
  ctx.translate(r, r);
  ctx.rotate((rollAngle * Math.PI) / 180);

  // Shift for pitch
  const pitchOffset = (pitchAngle / 90) * (r * 0.7);

  // Sky hemisphere (top, cyan-blue)
  ctx.fillStyle = '#0284C7';
  ctx.fillRect(-r * 2, -r * 2 + pitchOffset, r * 4, r * 2);

  // Ground hemisphere (bottom, dark navy-slate)
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(-r * 2, pitchOffset, r * 4, r * 2);

  // Artificial horizon line
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r, pitchOffset);
  ctx.lineTo(r, pitchOffset);
  ctx.stroke();

  // Pitch ladder markings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1;
  [-20, -10, 10, 20].forEach(deg => {
    const y = pitchOffset - (deg / 90) * (r * 0.7);
    ctx.beginPath();
    ctx.moveTo(-10, y);
    ctx.lineTo(10, y);
    ctx.stroke();
  });

  ctx.restore();

  // Outer sphere border
  ctx.strokeStyle = '#00F0FF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(r, r, r - 1.5, 0, Math.PI * 2);
  ctx.stroke();

  if (DOM.navballReadout) {
    DOM.navballReadout.textContent = `PITCH: ${pitchAngle >= 0 ? '+' : ''}${pitchAngle.toFixed(1)}° | ROLL: ${rollAngle >= 0 ? '+' : ''}${rollAngle.toFixed(1)}°`;
  }
}

// ── ORBIT TRAJECTORY HUD CANVAS ANIMATION ──
function drawOrbitHud() {
  const canvas = DOM.orbitCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  // Tactical Radar Grid Lines
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, h);
  ctx.moveTo(0, cy);
  ctx.lineTo(w, cy);
  ctx.stroke();

  // Concentric Radar Orbit Rings
  const radii = [45, 90, 130];
  radii.forEach((r, idx) => {
    ctx.strokeStyle = idx === 1 ? 'rgba(0, 240, 255, 0.45)' : 'rgba(0, 240, 255, 0.18)';
    ctx.lineWidth = idx === 1 ? 1.5 : 1;
    ctx.beginPath();
    if (idx === 2) {
      ctx.setLineDash([4, 4]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Degree markings at ring 90
  ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
  ctx.font = "8px 'JetBrains Mono', monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('0°', cx + 90, cy - 8);
  ctx.fillText('90°', cx, cy + 98);
  ctx.fillText('180°', cx - 90, cy - 8);
  ctx.fillText('270°', cx, cy - 98);

  // Rotating Central Reticle
  const reticleAngle = STATE.animationAngle * 0.4;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(reticleAngle);
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
  ctx.lineWidth = 1.2;

  // Draw hexagon reticle
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const x = Math.cos(a) * 16;
    const y = Math.sin(a) * 16;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // Center cross
  ctx.beginPath();
  ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
  ctx.moveTo(0, -6); ctx.lineTo(0, 6);
  ctx.stroke();
  ctx.restore();

  // Orbiting Spacecraft Marker on Main Ring (r=90)
  const craftAngle = STATE.animationAngle;
  const craftX = cx + Math.cos(craftAngle) * 90;
  const craftY = cy + Math.sin(craftAngle) * 90;

  // Spacecraft glowing dot
  ctx.shadowColor = '#00F0FF';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#00F0FF';
  ctx.beginPath();
  ctx.arc(craftX, craftY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Callout leader line and tag (TGT+)
  const tagX = craftX + 26;
  const tagY = craftY - 18;
  ctx.strokeStyle = '#00F0FF';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(craftX, craftY);
  ctx.lineTo(craftX + 12, tagY);
  ctx.lineTo(tagX + 32, tagY);
  ctx.stroke();

  ctx.fillStyle = '#00F0FF';
  ctx.font = "8.5px 'JetBrains Mono', monospace";
  ctx.textAlign = 'left';
  ctx.fillText('TGT+ RAD', craftX + 16, tagY - 3);
}

// ── MATHEMATICAL PREDICTED CONIC CANVAS ANIMATION ──
function drawConicCurve() {
  const canvas = DOM.conicCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Background subtle grid
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < w; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Earth Sphere (on left)
  const earthX = 85;
  const earthY = h / 2;
  const earthR = 24;

  // Earth Glow
  const glow = ctx.createRadialGradient(earthX, earthY, earthR, earthX, earthY, earthR + 15);
  glow.addColorStop(0, 'rgba(37, 99, 235, 0.4)');
  glow.addColorStop(1, 'rgba(37, 99, 235, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(earthX, earthY, earthR + 15, 0, Math.PI * 2);
  ctx.fill();

  // Earth Body
  const earthGrad = ctx.createRadialGradient(earthX - 6, earthY - 6, 2, earthX, earthY, earthR);
  earthGrad.addColorStop(0, '#60A5FA');
  earthGrad.addColorStop(0.7, '#2563EB');
  earthGrad.addColorStop(1, '#1E3A8A');
  ctx.fillStyle = earthGrad;
  ctx.beginPath();
  ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "8px 'JetBrains Mono', monospace";
  ctx.textAlign = 'center';
  ctx.fillText('EARTH', earthX, earthY + 3);

  // Conic Elliptical Trajectory
  ctx.save();
  ctx.strokeStyle = '#0284C7';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([5, 4]);

  ctx.beginPath();
  ctx.ellipse(260, earthY, 175, 48, -0.05, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Maneuver Node 01: Injection
  const node1X = 230;
  const node1Y = earthY - 45;
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(node1X, node1Y, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#D97706';
  ctx.font = "8.5px 'JetBrains Mono', monospace";
  ctx.textAlign = 'left';
  ctx.fillText('NODE 01: INJECTION', node1X + 8, node1Y - 4);

  // Delta-V Vector Arrow
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(node1X, node1Y);
  ctx.lineTo(node1X + 22, node1Y - 14);
  ctx.stroke();

  // Maneuver Node 02: Orbit Circ
  const node2X = 390;
  const node2Y = earthY + 28;
  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.arc(node2X, node2Y, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#059669';
  ctx.font = "8.5px 'JetBrains Mono', monospace";
  ctx.fillText('NODE 02: ORBIT CIRC', node2X + 8, node2Y + 12);

  // Animated Satellite tracking on conic
  const conicT = (STATE.animationAngle * 0.7) % (Math.PI * 2);
  const craftX = 260 + Math.cos(conicT) * 175;
  const craftY = earthY + Math.sin(conicT) * 48;

  ctx.fillStyle = '#0284C7';
  ctx.beginPath();
  ctx.arc(craftX, craftY, 4, 0, Math.PI * 2);
  ctx.fill();
}

// ── MASTER 60 FPS RENDER LOOP ──
function renderLoop() {
  // Advance animation angle driven by time-warp
  const speed = 0.015 * Math.min(10, Math.max(1, Math.log10(STATE.timeWarp) + 1));
  STATE.animationAngle += speed;
  if (STATE.animationAngle > Math.PI * 2) {
    STATE.animationAngle -= Math.PI * 2;
  }

  drawOrbitHud();
  drawNavball();
  drawConicCurve();

  requestAnimationFrame(renderLoop);
}

// ── REALTIME CLOCKS TICK ──
function updateClocks() {
  // 1. Mission Elapsed Time (ticking live)
  const elapsedSec = Math.floor((Date.now() - STATE.metStartTime) / 1000) + STATE.metOffsetSec;
  const days = Math.floor(elapsedSec / 86400);
  const hours = Math.floor((elapsedSec % 86400) / 3600);
  const mins = Math.floor((elapsedSec % 3600) / 60);
  const secs = elapsedSec % 60;

  DOM.metClock.textContent = `T+${String(days).padStart(3, '0')}:${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // 2. UTC Reference with ms
  const now = new Date();
  const year = now.getUTCFullYear();
  const startYear = new Date(Date.UTC(year, 0, 1));
  const dayOfYear = Math.floor((now - startYear) / 86400000) + 1;
  const utcHours = String(now.getUTCHours()).padStart(2, '0');
  const utcMins = String(now.getUTCMinutes()).padStart(2, '0');
  const utcSecs = String(now.getUTCSeconds()).padStart(2, '0');
  const utcMs = String(now.getUTCMilliseconds()).padStart(3, '0');

  DOM.utcClock.textContent = `${year}-${String(dayOfYear).padStart(3, '0')} // ${utcHours}:${utcMins}:${utcSecs}.${utcMs}`;
}

// ── LAUNCH EXECUTION SEQUENCE ──
function executeLaunch() {
  if (!STATE.launchReady) {
    sfxError();
    return;
  }
  sfxLaunch();

  DOM.launchOverlay.classList.remove('hidden');
  const mission = MISSIONS[STATE.mission];
  const vehicle = VEHICLES[STATE.vehicle];

  DOM.launchTargetDesc.textContent = `${mission.name.toUpperCase()} ON ${vehicle.name.toUpperCase()}`;
  DOM.launchProgressFill.style.width = '0%';

  let count = 10;
  DOM.countdownText.textContent = 'T-10';

  const timer = setInterval(() => {
    count--;
    const progress = ((10 - count) / 10) * 100;
    DOM.launchProgressFill.style.width = progress + '%';

    if (count > 0) {
      DOM.countdownText.textContent = 'T-' + count;
      playTone(1200, 0.05, 'sine', 0.04);
    } else if (count === 0) {
      DOM.countdownText.textContent = 'LIFTOFF';
      DOM.countdownText.style.color = '#F59E0B';
      sfxLaunch();
    } else if (count === -2) {
      DOM.countdownText.textContent = 'ORBITAL INSERTION';
      DOM.countdownText.style.color = '#00F0FF';
      DOM.launchTargetDesc.textContent = 'TRANSTAGE TRAJECTORY NOMINAL // DSN LOCK CONFIRMED';
    } else if (count < -4) {
      clearInterval(timer);
      DOM.launchOverlay.classList.add('hidden');
      DOM.countdownText.style.color = '';

      // Append success message to advisor
      const row = document.createElement('div');
      row.className = 'adv-msg nominal';
      row.textContent = `> ✓ MISSION INGEST COMPLETE: ${mission.name} deployed via ${vehicle.name}. Telemetry locked.`;
      DOM.advisorLog.appendChild(row);
      DOM.advisorLog.scrollTop = DOM.advisorLog.scrollHeight;
    }
  }, 1000);
}

// ── BIND EVENT LISTENERS & HOTKEYS ──
function bindEvents() {
  // Mission Selector
  DOM.missionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sfxClick();
      DOM.missionBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.mission = btn.dataset.mission;
      updateTelemetry();
    });
  });

  // Vehicle Selector
  DOM.vehicleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sfxClick();
      DOM.vehicleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.vehicle = btn.dataset.vehicle;
      updateTelemetry();
    });
  });

  // Outfitter Category Tabs
  document.querySelectorAll('.out-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      sfxClick();
      document.querySelectorAll('.out-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      STATE.activeTab = tab.dataset.cat;
      renderSubsystems(STATE.activeTab);
    });
  });

  // HUD View Switcher Tabs (Chassis CAD / Orbit Trajectory)
  document.querySelectorAll('.view-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfxClick();
      document.querySelectorAll('.view-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.activeView = btn.dataset.view;

      document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
      const targetPanel = document.getElementById('view-' + STATE.activeView);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  // Time Warp Controls
  document.querySelectorAll('.warp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfxClick();
      document.querySelectorAll('.warp-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.timeWarp = parseInt(btn.dataset.warp, 10);
    });
  });

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

  // Launch Button
  DOM.btnLaunch.addEventListener('click', executeLaunch);

  // Sources Modal
  DOM.btnSources.addEventListener('click', () => {
    DOM.sourcesModal.classList.remove('hidden');
  });
  DOM.btnCloseSources.addEventListener('click', () => {
    DOM.sourcesModal.classList.add('hidden');
  });
  DOM.sourcesModal.addEventListener('click', e => {
    if (e.target === DOM.sourcesModal) {
      DOM.sourcesModal.classList.add('hidden');
    }
  });

  // Sidebar navigation scroll & active highlights
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Keyboard Shortcuts
  document.addEventListener('keyup', e => {
    const key = e.key.toLowerCase();

    // [1-3] Mission Selection
    if (key === '1') {
      const btn = document.querySelector('.choice-btn[data-mission="leo"]');
      if (btn) btn.click();
    } else if (key === '2') {
      const btn = document.querySelector('.choice-btn[data-mission="lunar"]');
      if (btn) btn.click();
    } else if (key === '3') {
      const btn = document.querySelector('.choice-btn[data-mission="mars"]');
      if (btn) btn.click();
    }

    // [Q-T] Subsystem Dock Tabs
    if (key === 'q') {
      const t = document.querySelector('.out-tab[data-cat="power"]');
      if (t) t.click();
    } else if (key === 'w') {
      const t = document.querySelector('.out-tab[data-cat="comms"]');
      if (t) t.click();
    } else if (key === 'e') {
      const t = document.querySelector('.out-tab[data-cat="instruments"]');
      if (t) t.click();
    } else if (key === 'r') {
      const t = document.querySelector('.out-tab[data-cat="propulsion"]');
      if (t) t.click();
    } else if (key === 't') {
      const t = document.querySelector('.out-tab[data-cat="chassis"]');
      if (t) t.click();
    }

    // [M] Audio Mute Toggle
    if (key === 'm') {
      DOM.btnAudio.click();
    }

    // [Space] Stage-0 Launch Sequencer
    if (key === ' ') {
      e.preventDefault();
      executeLaunch();
    }
  });
}

// ── ERROR BOUNDARY ──
window.onerror = function (msg, src, line) {
  if (DOM.errorScreen && DOM.errorMsg) {
    DOM.errorMsg.textContent = `${msg} (Line ${line})`;
    DOM.errorScreen.classList.remove('hidden');
  }
  return false;
};

// ── SYSTEM BOOT SEQUENCE ──
(function boot() {
  const loader = document.getElementById('loading-skeleton');
  const app = document.getElementById('app');

  setTimeout(() => {
    if (loader) loader.classList.add('fade-out');

    setTimeout(() => {
      if (loader) loader.classList.add('hidden');
      if (app) app.classList.remove('hidden');

      cacheDom();
      bindEvents();
      renderSubsystems('power');
      updateTelemetry();
      updateChassisSvgHighlights();

      // Launch 60 FPS animation loops and clocks
      requestAnimationFrame(renderLoop);
      setInterval(updateClocks, 50); // 20 Hz clock refresh for ms precision
    }, 400);
  }, 1200);
})();
