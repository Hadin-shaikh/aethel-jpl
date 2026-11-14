/* ═══════════════════════════════════════════════════════════════
   AETHEL // JPL — Space Mission Engineering Simulator
   Core Application Logic — Vanilla ES6 State Machine
   Zero dependencies. Real NASA parameters. 60 FPS target.
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ── LAUNCH VEHICLES (NASA Launch Services Program Data) ──
const VEHICLES = {
  falcon9:     { name: 'Falcon 9',      mass: 22800,  cost: 67,   id: 'falcon9' },
  falconheavy: { name: 'Falcon Heavy',  mass: 63800,  cost: 97,   id: 'falconheavy' },
  sls:         { name: 'SLS Block 1',   mass: 95000,  cost: 2100, id: 'sls' }
};

// ── MISSION PROFILES ──
const MISSIONS = {
  leo:   { name: 'LEO Satellite',  type: 'leo',   targetData: 10, desc: 'Earth Observation — 500km Circular' },
  lunar: { name: 'Lunar Rover',    type: 'lunar', targetData: 5,  desc: 'Artemis Relay — Cislunar Transfer' },
  mars:  { name: 'Mars Probe',     type: 'mars',  targetData: 2,  desc: 'Interplanetary — Hohmann Transfer' }
};

// ── SUBSYSTEM DATABASE (Real NASA Component Specs) ──
const SUBSYSTEMS = {
  power: {
    label: 'Power Generation',
    items: [
      {
        id: 'solar-ultraflex',
        name: 'UltraFlex Dual Solar Wings',
        desc: 'Gallium Arsenide flexible arrays. High specific power (150 W/kg) with rapid deployment accordion mast.',
        mass: 120, power: 450, cost: 18, data: 0,
        svgTarget: 'solar'
      },
      {
        id: 'rtg-plutonium',
        name: 'NextGen Plutonium-238 RTG',
        desc: 'Stirling radioisotope generator. Continuous decay heat conversion unaffected by planetary shadows or solar distance.',
        mass: 380, power: 350, cost: 95, data: 0,
        svgTarget: 'thruster'
      },
      {
        id: 'battery-liion',
        name: 'Li-Ion Battery Module (40 Ah)',
        desc: 'High-density lithium-ion cells for eclipse buffering. 28V nominal bus with integrated charge controller.',
        mass: 45, power: 60, cost: 5, data: 0,
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
        desc: '2.5m deployable mesh reflector. 100W TWTA for deep space downlink via DSN Goldstone/Canberra/Madrid.',
        mass: 85, power: -100, cost: 22, data: 80,
        svgTarget: 'antenna'
      },
      {
        id: 'antenna-sband',
        name: 'S-Band Omni Antenna',
        desc: 'Low-gain omnidirectional. Reliable backup link for command uplink and low-rate housekeeping telemetry.',
        mass: 12, power: -15, cost: 3, data: 5,
        svgTarget: 'antenna'
      },
      {
        id: 'antenna-xband',
        name: 'X-Band Steerable Dish',
        desc: 'Medium-gain gimballed antenna. Standard for LEO/MEO data relay and Earth observation downlink.',
        mass: 35, power: -50, cost: 12, data: 40,
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
        desc: 'Pushbroom scanner, 0.5m GSD from 500km. 12-band VNIR/SWIR with onboard lossless compression.',
        mass: 65, power: -90, cost: 45, data: -15,
        svgTarget: 'instruments'
      },
      {
        id: 'spectrometer-mass',
        name: 'Quadrupole Mass Spectrometer',
        desc: 'In-situ atmospheric and surface volatile analysis. 1-300 AMU range with electron-impact ionization.',
        mass: 28, power: -55, cost: 30, data: -3,
        svgTarget: 'instruments'
      },
      {
        id: 'radar-sar',
        name: 'Synthetic Aperture Radar (SAR)',
        desc: 'C-band SAR for all-weather surface mapping. 5m resolution, 40km swath at stripmap mode.',
        mass: 150, power: -200, cost: 60, data: -25,
        svgTarget: 'instruments'
      }
    ]
  },
  propulsion: {
    label: 'Propulsion',
    items: [
      {
        id: 'thruster-biprop',
        name: 'MMH/NTO Bipropellant Engine',
        desc: '445N thrust, Isp 320s. Restartable for orbit insertion, station-keeping, and deorbit maneuvers.',
        mass: 180, power: -20, cost: 25, data: 0,
        svgTarget: 'thruster'
      },
      {
        id: 'thruster-ion',
        name: 'Xenon Ion Thruster (NEXT-C)',
        desc: 'NASA Evolutionary Xenon Thruster. 6.9kW, 236mN, Isp 4190s. Optimized for deep space cruise phases.',
        mass: 95, power: -300, cost: 35, data: 0,
        svgTarget: 'thruster'
      },
      {
        id: 'thruster-coldgas',
        name: 'Cold Gas RCS Thruster Array',
        desc: 'Nitrogen cold-gas micro-thrusters for fine attitude control. 16-thruster redundant configuration.',
        mass: 22, power: -5, cost: 4, data: 0,
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
        desc: 'EELV Secondary Payload Adapter compatible. 180kg dry mass limit. Ideal for LEO technology demos.',
        mass: 90, power: -30, cost: 15, data: 0,
        svgTarget: null
      },
      {
        id: 'chassis-medium',
        name: 'Medium Explorer Platform',
        desc: 'Heritage MidEx chassis. Modular avionics bay with standardized payload interfaces. 3-axis stabilized.',
        mass: 250, power: -60, cost: 40, data: 0,
        svgTarget: null
      },
      {
        id: 'chassis-flagship',
        name: 'Flagship Deep Space Bus',
        desc: 'Cassini-heritage design. Redundant avionics, integrated propulsion module, radiation-hardened electronics.',
        mass: 600, power: -120, cost: 150, data: 0,
        svgTarget: null
      }
    ]
  }
};

// ── GLOBAL STATE ──
const STATE = {
  mission: 'leo',
  vehicle: 'falcon9',
  equipped: new Set(),
  audioEnabled: false,
  activeTab: 'power',
  activeView: 'cad',
  metStart: Date.now(),
  launchReady: false
};

// ── DOM CACHE (query once, reuse forever) ──
const DOM = {};
function cacheDom() {
  DOM.app = document.getElementById('app');
  DOM.loader = document.getElementById('loading-skeleton');
  DOM.errorScreen = document.getElementById('error-screen');
  DOM.errorMsg = document.getElementById('error-msg');

  // Telemetry
  DOM.massVal = document.getElementById('mass-val');
  DOM.massPct = document.getElementById('mass-pct');
  DOM.massMax = document.getElementById('mass-max');
  DOM.massFill = document.getElementById('mass-fill');
  DOM.massStatus = document.getElementById('mass-status');
  DOM.gaugeMass = document.getElementById('gauge-mass');

  DOM.powerVal = document.getElementById('power-val');
  DOM.powerPct = document.getElementById('power-pct');
  DOM.powerGen = document.getElementById('power-gen');
  DOM.powerLoad = document.getElementById('power-load');
  DOM.powerFill = document.getElementById('power-fill');
  DOM.powerStatus = document.getElementById('power-status');
  DOM.gaugePower = document.getElementById('gauge-power');

  DOM.budgetVal = document.getElementById('budget-val');
  DOM.budgetPct = document.getElementById('budget-pct');
  DOM.budgetMax = document.getElementById('budget-max');
  DOM.budgetFill = document.getElementById('budget-fill');
  DOM.budgetStatus = document.getElementById('budget-status');
  DOM.gaugeBudget = document.getElementById('gauge-budget');

  DOM.dataVal = document.getElementById('data-val');
  DOM.dataPct = document.getElementById('data-pct');
  DOM.dataPayload = document.getElementById('data-payload');
  DOM.dataFill = document.getElementById('data-fill');
  DOM.dataStatus = document.getElementById('data-status');
  DOM.gaugeData = document.getElementById('gauge-data');

  // Panels
  DOM.outfitter = document.getElementById('subsystem-outfitter');
  DOM.advisorLog = document.getElementById('advisor-log');
  DOM.btnLaunch = document.getElementById('btn-launch');
  DOM.equippedCount = document.getElementById('equipped-count');

  // Status bar
  DOM.statDownlink = document.getElementById('stat-downlink');
  DOM.statModules = document.getElementById('stat-modules');

  // MET
  DOM.metClock = document.getElementById('met-clock');

  // Audio
  DOM.btnAudio = document.getElementById('btn-audio');
  DOM.audioState = document.getElementById('audio-state');

  // Trajectory
  DOM.trajDv = document.getElementById('traj-dv');
  DOM.trajTwr = document.getElementById('traj-twr');
  DOM.trajPeriod = document.getElementById('traj-period');
  DOM.orbitPath = document.getElementById('orbit-path');
  DOM.orbitCraft = document.getElementById('orbit-craft');
  DOM.trajTarget = document.getElementById('traj-target');
  DOM.trajTargetLabel = document.getElementById('traj-target-label');
  DOM.umbraShadow = document.getElementById('umbra-shadow');

  // SVG elements
  DOM.svgSolarL = document.getElementById('svg-solar-l');
  DOM.svgSolarR = document.getElementById('svg-solar-r');
  DOM.svgAntenna = document.getElementById('svg-antenna');
  DOM.svgThruster = document.getElementById('svg-thruster');
  DOM.svgInstruments = document.getElementById('svg-instruments');
  DOM.svgLeaders = document.getElementById('svg-leaders');
}

// ── AUDIO ENGINE (Web Audio API — Zero Dependencies) ──
let audioCtx = null;
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playTone(freq, duration, type, vol) {
  if (!STATE.audioEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  gain.gain.value = vol || 0.08;
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function sfxClick()  { playTone(2400, 0.05, 'square', 0.04); }
function sfxError()  { playTone(120, 0.25, 'sine', 0.12); }
function sfxLaunch() { playTone(60, 1.5, 'sine', 0.15); playTone(80, 1.5, 'sawtooth', 0.06); }
function sfxEquip()  { playTone(1800, 0.08, 'triangle', 0.06); }
function sfxUnequip(){ playTone(800, 0.08, 'triangle', 0.04); }

// ── HELPER: Get all equipped items flat ──
function getEquippedItems() {
  const items = [];
  for (const cat of Object.values(SUBSYSTEMS)) {
    for (const item of cat.items) {
      if (STATE.equipped.has(item.id)) items.push(item);
    }
  }
  return items;
}

// ── HELPER: Find item by ID ──
function findItem(id) {
  for (const cat of Object.values(SUBSYSTEMS)) {
    for (const item of cat.items) {
      if (item.id === id) return item;
    }
  }
  return null;
}

// ── RENDER: Subsystem Cards (DocumentFragment) ──
function renderSubsystems(category) {
  const cat = SUBSYSTEMS[category];
  if (!cat) return;

  const frag = document.createDocumentFragment();

  for (const item of cat.items) {
    const card = document.createElement('div');
    card.className = 'component-card' + (STATE.equipped.has(item.id) ? ' equipped' : '');
    card.dataset.id = item.id;

    const isEquipped = STATE.equipped.has(item.id);
    const powerPrefix = item.power >= 0 ? '+' : '';
    const dataPrefix = item.data > 0 ? '+' : '';

    // Build card innerHTML once per render (not in a loop of innerHTML +=)
    card.innerHTML =
      '<div class="comp-name"><span>' + item.name + '</span>' +
      '<span class="comp-status ' + (isEquipped ? '' : 'stowed') + '">[' + (isEquipped ? 'EQUIPPED' : 'STOWED') + ']</span></div>' +
      '<div class="comp-desc">' + item.desc + '</div>' +
      '<div class="comp-stats">' +
        '<div class="comp-stat"><span class="comp-stat-label">MASS</span><span class="comp-stat-val">+' + item.mass + ' KG</span></div>' +
        '<div class="comp-stat"><span class="comp-stat-label">POWER</span><span class="comp-stat-val ' + (item.power >= 0 ? 'positive' : 'negative') + '">' + powerPrefix + item.power + 'W</span></div>' +
        '<div class="comp-stat"><span class="comp-stat-label">COST</span><span class="comp-stat-val negative">-$' + item.cost + 'M</span></div>' +
        (item.data !== 0 ? '<div class="comp-stat"><span class="comp-stat-label">DATA</span><span class="comp-stat-val ' + (item.data > 0 ? 'positive' : 'negative') + '">' + dataPrefix + item.data + ' Mbps</span></div>' : '') +
      '</div>';

    card.addEventListener('click', function() { toggleComponent(item.id); });
    frag.appendChild(card);
  }

  // Single DOM write
  DOM.outfitter.textContent = '';
  DOM.outfitter.appendChild(frag);
}

// ── TOGGLE COMPONENT ──
function toggleComponent(id) {
  if (STATE.equipped.has(id)) {
    STATE.equipped.delete(id);
    sfxUnequip();
  } else {
    STATE.equipped.add(id);
    sfxEquip();
  }
  renderSubsystems(STATE.activeTab);
  updateTelemetry();
  updateChassisSVG();
}

// ── UPDATE TELEMETRY (Core Engine) ──
function updateTelemetry() {
  const vehicle = VEHICLES[STATE.vehicle];
  const mission = MISSIONS[STATE.mission];
  const items = getEquippedItems();

  // Calculate totals
  let totalMass = 0, totalPowerGen = 0, totalPowerDraw = 0, totalCost = vehicle.cost, totalData = 0;
  for (const item of items) {
    totalMass += item.mass;
    if (item.power >= 0) totalPowerGen += item.power;
    else totalPowerDraw += Math.abs(item.power);
    totalCost += item.cost;
    totalData += item.data;
  }
  const netPower = totalPowerGen - totalPowerDraw;

  // ── Mass Gauge ──
  const massPct = vehicle.mass > 0 ? (totalMass / vehicle.mass) * 100 : 0;
  DOM.massVal.textContent = totalMass.toLocaleString();
  DOM.massPct.textContent = massPct.toFixed(1) + '%';
  DOM.massMax.textContent = vehicle.mass.toLocaleString();
  DOM.massFill.style.width = Math.min(massPct, 100) + '%';

  DOM.gaugeMass.className = 'gauge';
  if (massPct > 100) {
    DOM.gaugeMass.classList.add('alert');
    DOM.massStatus.textContent = '[OVER CAPACITY]';
  } else if (massPct > 80) {
    DOM.gaugeMass.classList.add('warn');
    DOM.massStatus.textContent = '[WARNING]';
  } else {
    DOM.massStatus.textContent = '[NOMINAL]';
  }

  // ── Power Gauge ──
  const powerSign = netPower >= 0 ? '+' : '';
  DOM.powerVal.textContent = powerSign + netPower;
  DOM.powerPct.textContent = powerSign + netPower + ' W';
  DOM.powerGen.textContent = totalPowerGen;
  DOM.powerLoad.textContent = totalPowerDraw;
  const powerPct = totalPowerGen > 0 ? (totalPowerGen / (totalPowerGen + totalPowerDraw)) * 100 : (totalPowerDraw > 0 ? 0 : 50);
  DOM.powerFill.style.width = Math.min(powerPct, 100) + '%';

  DOM.gaugePower.className = 'gauge';
  if (netPower < 0) {
    DOM.gaugePower.classList.add('alert');
    DOM.powerStatus.textContent = '[DEFICIT]';
  } else if (netPower > 0) {
    DOM.gaugePower.classList.add('surplus');
    DOM.powerStatus.textContent = '[SURPLUS]';
  } else {
    DOM.powerStatus.textContent = '[BALANCED]';
  }

  // ── Budget Gauge ──
  const budgetCap = vehicle.cost * 3; // Arbitrary max display
  const budgetPct = (totalCost / budgetCap) * 100;
  DOM.budgetVal.textContent = totalCost.toLocaleString();
  DOM.budgetPct.textContent = ((totalCost / budgetCap) * 100).toFixed(1) + '%';
  DOM.budgetMax.textContent = budgetCap.toLocaleString();
  DOM.budgetFill.style.width = Math.min(budgetPct, 100) + '%';

  DOM.gaugeBudget.className = 'gauge';
  if (budgetPct > 90) {
    DOM.gaugeBudget.classList.add('alert');
    DOM.budgetStatus.textContent = '[OVERBUDGET]';
  } else if (budgetPct > 70) {
    DOM.gaugeBudget.classList.add('warn');
    DOM.budgetStatus.textContent = '[CAUTION]';
  } else {
    DOM.budgetStatus.textContent = '[FUNDED]';
  }

  // ── Data Gauge ──
  DOM.dataVal.textContent = totalData.toFixed(1);
  DOM.dataPayload.textContent = totalData.toFixed(1);
  const dataPct = mission.targetData > 0 ? (Math.max(totalData, 0) / (mission.targetData * 3)) * 100 : 50;
  DOM.dataFill.style.width = Math.min(Math.max(dataPct, 0), 100) + '%';

  DOM.gaugeData.className = 'gauge';
  if (totalData < mission.targetData && items.length > 0) {
    DOM.gaugeData.classList.add('warn');
    DOM.dataStatus.textContent = '[LOW BANDWIDTH]';
  } else {
    DOM.dataStatus.textContent = '[NOMINAL]';
  }

  // ── Status Bar ──
  DOM.statDownlink.textContent = Math.max(totalData, 0).toFixed(1);
  DOM.statModules.textContent = items.length;
  DOM.equippedCount.textContent = items.length + ' SUBSYSTEMS';

  // ── Launch Button Logic ──
  const massOk = totalMass <= vehicle.mass && totalMass > 0;
  const powerOk = netPower >= 0;
  const hasItems = items.length > 0;

  STATE.launchReady = massOk && powerOk && hasItems;

  DOM.btnLaunch.disabled = !STATE.launchReady;
  DOM.btnLaunch.className = '';
  if (STATE.launchReady) {
    DOM.btnLaunch.classList.add('go');
    DOM.btnLaunch.querySelector('.launch-sub').textContent = 'ALL SYSTEMS GO — PRESS SPACE TO LAUNCH';
  } else if (totalMass > vehicle.mass) {
    DOM.btnLaunch.classList.add('no-go');
    DOM.btnLaunch.querySelector('.launch-sub').textContent = 'PAYLOAD EXCEEDS VEHICLE CAPACITY';
  } else if (netPower < 0) {
    DOM.btnLaunch.classList.add('no-go');
    DOM.btnLaunch.querySelector('.launch-sub').textContent = 'POWER DEFICIT — RESOLVE BEFORE LAUNCH';
  } else {
    DOM.btnLaunch.querySelector('.launch-sub').textContent = 'SELECT SUBSYSTEMS TO CONFIGURE';
  }

  // ── Trajectory Update ──
  updateTrajectory(totalMass, netPower);

  // ── Chief Advisor Engine (Educational Feedback) ──
  runAdvisor(items, totalMass, netPower, totalData, vehicle, mission);
}

// ── CHIEF ADVISOR — EDUCATIONAL FEEDBACK ENGINE ──
function runAdvisor(items, totalMass, netPower, totalData, vehicle, mission) {
  // Clear advisor
  DOM.advisorLog.textContent = '';
  const frag = document.createDocumentFragment();

  function log(msg, type) {
    const div = document.createElement('div');
    div.className = 'advisor-msg ' + type;
    div.textContent = msg;
    frag.appendChild(div);
  }

  // System status
  if (items.length === 0) {
    log('> SYSTEM: Awaiting subsystem configuration. Select components from the Payload Outfitter.', 'system');
    DOM.advisorLog.appendChild(frag);
    return;
  }

  log('> AETHEL ADVISOR v4.9 — Mission: ' + mission.name + ' | Vehicle: ' + vehicle.name, 'system');

  // ── Mass Checks ──
  if (totalMass > vehicle.mass) {
    const excess = totalMass - vehicle.mass;
    log('> CRITICAL: Payload mass (' + totalMass.toLocaleString() + ' kg) exceeds ' + vehicle.name + ' capacity (' + vehicle.mass.toLocaleString() + ' kg) by ' + excess.toLocaleString() + ' kg. Reduce payload or upgrade launch vehicle.', 'critical');
  } else {
    const margin = ((1 - totalMass / vehicle.mass) * 100).toFixed(1);
    log('> NOMINAL: Structural margin ' + margin + '%. Mass budget within ' + vehicle.name + ' envelope.', 'nominal');
  }

  // ── Power Checks ──
  if (netPower < 0) {
    log('> CRITICAL: Power deficit detected (' + netPower + 'W). Deep space missions cannot rely on battery reserves. Equip RTGs or expand Solar Arrays.', 'critical');
  } else if (netPower === 0) {
    log('> WARNING: Power margin is zero. No reserve for transient loads or safe mode. Add generation capacity.', 'warn');
  } else {
    log('> NOMINAL: Power surplus +' + netPower + 'W. Battery buffer: ' + (netPower * 0.6).toFixed(0) + ' Wh estimated.', 'nominal');
  }

  // ── Data Throughput Checks ──
  if (totalData < mission.targetData && totalData >= 0) {
    log('> ADVISORY: Downlink bandwidth (' + totalData.toFixed(1) + ' Mbps) insufficient for ' + mission.name + ' telemetry requirements (' + mission.targetData + ' Mbps). Upgrade to Ka-Band High-Gain Antenna.', 'advisory');
  } else if (totalData < 0) {
    log('> WARNING: Net data throughput is negative. Instrument data generation exceeds downlink capacity. Risk of onboard buffer overflow.', 'warn');
  }

  // ── Mission-Specific Advisories ──
  const hasRTG = STATE.equipped.has('rtg-plutonium');
  const hasSolar = STATE.equipped.has('solar-ultraflex');
  const hasIon = STATE.equipped.has('thruster-ion');
  const hasBattery = STATE.equipped.has('battery-liion');

  // LEO + RTG warning
  if (mission.type === 'leo' && hasRTG) {
    log('> WARNING: RTGs add unnecessary mass and radioactive risk in LEO where solar irradiance is nominal. UltraFlex Solar Wings are the standard for Earth orbit missions.', 'warn');
  }

  // Mars/Lunar + no RTG, only solar
  if ((mission.type === 'mars') && hasSolar && !hasRTG) {
    log('> ADVISORY: Solar arrays degrade significantly beyond 2 AU. Mars missions historically prefer RTG power (Curiosity, Perseverance). Consider switching to Plutonium-238 RTG.', 'advisory');
  }

  // Deep space + ion thruster + insufficient power
  if (hasIon && netPower < 300) {
    log('> WARNING: NEXT-C Ion Thruster requires 6.9kW nominal. Current power margin insufficient for continuous thrust. Deep space cruise phase will be intermittent.', 'warn');
  }

  // Mars + battery depletion in umbra
  if (mission.type === 'mars' && hasBattery && hasSolar && !hasRTG) {
    log('> ADVISORY: Eclipse corridor modeled. Battery buffer insufficient for 35-minute Umbra transit at Mars distance. RTG recommended for continuous power.', 'advisory');
  }

  // Lunar + no propulsion
  const hasProp = STATE.equipped.has('thruster-biprop') || STATE.equipped.has('thruster-ion') || STATE.equipped.has('thruster-coldgas');
  if (mission.type !== 'leo' && !hasProp) {
    log('> CRITICAL: No propulsion system equipped. Cislunar and interplanetary missions require ΔV for trajectory correction maneuvers and orbit insertion.', 'critical');
  }

  // No chassis
  const hasChassis = STATE.equipped.has('chassis-small') || STATE.equipped.has('chassis-medium') || STATE.equipped.has('chassis-flagship');
  if (!hasChassis) {
    log('> ADVISORY: No spacecraft bus selected. Instruments and subsystems require a structural chassis for integration.', 'advisory');
  }

  // No comms
  const hasComms = STATE.equipped.has('antenna-kaband') || STATE.equipped.has('antenna-sband') || STATE.equipped.has('antenna-xband');
  if (!hasComms) {
    log('> WARNING: No communications antenna equipped. Mission data cannot be downlinked to ground stations.', 'warn');
  }

  // All systems go
  if (STATE.launchReady) {
    log('> ✓ ALL SYSTEMS NOMINAL — Launch sequencer armed. Press SPACE or click STAGE-0 to initiate.', 'advisory');
  }

  // Single DOM write
  DOM.advisorLog.appendChild(frag);
  // Auto-scroll to bottom
  DOM.advisorLog.scrollTop = DOM.advisorLog.scrollHeight;
}

// ── CHASSIS SVG UPDATE ──
function updateChassisSVG() {
  // Reset all modules to dim
  const modules = [DOM.svgSolarL, DOM.svgSolarR, DOM.svgAntenna, DOM.svgThruster, DOM.svgInstruments];
  for (const el of modules) {
    if (el) el.classList.remove('module-active');
  }

  // Clear leader lines
  DOM.svgLeaders.textContent = '';

  const frag = document.createDocumentFragment();
  const items = getEquippedItems();

  for (const item of items) {
    if (!item.svgTarget) continue;

    // Highlight the SVG element
    if (item.svgTarget === 'solar') {
      DOM.svgSolarL.classList.add('module-active');
      DOM.svgSolarR.classList.add('module-active');
    } else if (item.svgTarget === 'antenna') {
      DOM.svgAntenna.classList.add('module-active');
    } else if (item.svgTarget === 'thruster') {
      DOM.svgThruster.classList.add('module-active');
    } else if (item.svgTarget === 'instruments') {
      DOM.svgInstruments.classList.add('module-active');
    }

    // Add leader line label
    const labelPositions = {
      solar:       { x: 60, y: 168 },
      antenna:     { x: 320, y: 125 },
      thruster:    { x: 320, y: 260 },
      instruments: { x: 320, y: 195 }
    };
    const pos = labelPositions[item.svgTarget];
    if (pos) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', pos.x);
      text.setAttribute('y', pos.y);
      text.setAttribute('fill', 'var(--accent-cyan)');
      text.setAttribute('font-size', '9');
      text.setAttribute('font-family', 'Courier New, monospace');
      text.setAttribute('opacity', '0.8');
      text.textContent = item.name.substring(0, 20);
      frag.appendChild(text);
    }
  }

  DOM.svgLeaders.appendChild(frag);
}

// ── TRAJECTORY UPDATE ──
function updateTrajectory(totalMass, netPower) {
  const mission = MISSIONS[STATE.mission];

  // Orbital mechanics calculations
  let semiMajorKm, periodMin, dvReq;
  const MU_EARTH = 3.986e14; // m^3/s^2

  if (mission.type === 'leo') {
    semiMajorKm = 6871; // 500km altitude
    const a = semiMajorKm * 1000;
    periodMin = (2 * Math.PI * Math.sqrt(a * a * a / MU_EARTH)) / 60;
    dvReq = 150;
    // Circular orbit
    DOM.orbitPath.setAttribute('rx', '120');
    DOM.orbitPath.setAttribute('ry', '120');
    DOM.orbitPath.setAttribute('cx', '300');
    DOM.orbitPath.setAttribute('cy', '175');
    DOM.trajTarget.setAttribute('opacity', '0');
    DOM.trajTargetLabel.setAttribute('opacity', '0');
    DOM.umbraShadow.setAttribute('opacity', '0');
  } else if (mission.type === 'lunar') {
    semiMajorKm = 200000;
    periodMin = 655; // ~10.9 hours one-way
    dvReq = 3100;
    // Elliptical free-return
    DOM.orbitPath.setAttribute('rx', '200');
    DOM.orbitPath.setAttribute('ry', '100');
    DOM.orbitPath.setAttribute('cx', '280');
    DOM.orbitPath.setAttribute('cy', '175');
    DOM.trajTarget.setAttribute('cx', '480');
    DOM.trajTarget.setAttribute('cy', '175');
    DOM.trajTarget.setAttribute('opacity', '0.7');
    DOM.trajTargetLabel.setAttribute('x', '480');
    DOM.trajTargetLabel.setAttribute('y', '160');
    DOM.trajTargetLabel.textContent = 'MOON';
    DOM.trajTargetLabel.setAttribute('opacity', '0.7');
    DOM.umbraShadow.setAttribute('opacity', '0');
  } else {
    // Mars Hohmann
    semiMajorKm = 188500000;
    periodMin = 365 * 24 * 60; // ~8.5 months
    dvReq = 5600;
    DOM.orbitPath.setAttribute('rx', '220');
    DOM.orbitPath.setAttribute('ry', '80');
    DOM.orbitPath.setAttribute('cx', '260');
    DOM.orbitPath.setAttribute('cy', '175');
    DOM.trajTarget.setAttribute('cx', '520');
    DOM.trajTarget.setAttribute('cy', '175');
    DOM.trajTarget.setAttribute('opacity', '0.7');
    DOM.trajTarget.setAttribute('r', '10');
    DOM.trajTargetLabel.setAttribute('x', '510');
    DOM.trajTargetLabel.setAttribute('y', '155');
    DOM.trajTargetLabel.textContent = 'MARS';
    DOM.trajTargetLabel.setAttribute('opacity', '0.7');
    // Umbra shadow wedge
    DOM.umbraShadow.setAttribute('d', 'M260,175 L220,145 L220,205 Z');
    DOM.umbraShadow.setAttribute('opacity', '0.4');
  }

  // TWR calculation (rough)
  const thrustN = STATE.equipped.has('thruster-biprop') ? 445 :
                  STATE.equipped.has('thruster-ion') ? 0.236 :
                  STATE.equipped.has('thruster-coldgas') ? 0.5 : 0;
  const twr = totalMass > 0 ? (thrustN / (totalMass * 9.81)).toFixed(3) : '0.000';

  DOM.trajDv.textContent = dvReq;
  DOM.trajTwr.textContent = twr;
  DOM.trajPeriod.textContent = mission.type === 'mars' ? '259 days' : periodMin.toFixed(1) + ' min';
}

// ── ORBIT ANIMATION (requestAnimationFrame for 60 FPS) ──
let orbitAngle = 0;
function animateOrbit() {
  orbitAngle += 0.008;
  if (orbitAngle > Math.PI * 2) orbitAngle -= Math.PI * 2;

  const path = DOM.orbitPath;
  if (!path) { requestAnimationFrame(animateOrbit); return; }

  const cx = parseFloat(path.getAttribute('cx'));
  const cy = parseFloat(path.getAttribute('cy'));
  const rx = parseFloat(path.getAttribute('rx'));
  const ry = parseFloat(path.getAttribute('ry'));

  const x = cx + rx * Math.cos(orbitAngle);
  const y = cy + ry * Math.sin(orbitAngle);

  DOM.orbitCraft.setAttribute('cx', x);
  DOM.orbitCraft.setAttribute('cy', y);

  requestAnimationFrame(animateOrbit);
}

// ── MET CLOCK ──
function updateMET() {
  const elapsed = Date.now() - STATE.metStart;
  const totalSec = Math.floor(elapsed / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  DOM.metClock.textContent = 'T+' +
    String(d).padStart(3, '0') + ':' +
    String(h).padStart(2, '0') + ':' +
    String(m).padStart(2, '0') + ':' +
    String(s).padStart(2, '0');
}

// ── LAUNCH SEQUENCE ──
function executeLaunch() {
  if (!STATE.launchReady) {
    sfxError();
    return;
  }
  sfxLaunch();

  // Create overlay
  let overlay = document.getElementById('launch-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'launch-overlay';
    overlay.innerHTML = '<div class="launch-seq-text" id="countdown-text">T-10</div>' +
      '<div class="launch-seq-sub">IGNITION SEQUENCE INITIATED</div>';
    document.body.appendChild(overlay);
  }

  overlay.classList.add('active');
  const countEl = document.getElementById('countdown-text');

  const mission = MISSIONS[STATE.mission];
  const vehicle = VEHICLES[STATE.vehicle];
  let count = 10;

  const interval = setInterval(function() {
    count--;
    if (count > 0) {
      countEl.textContent = 'T-' + count;
    } else if (count === 0) {
      countEl.textContent = 'LIFTOFF';
      countEl.style.color = 'var(--warn-amber)';
      countEl.style.textShadow = '0 0 60px rgba(255,122,0,0.8)';
    } else if (count === -2) {
      countEl.textContent = mission.name.toUpperCase();
      countEl.style.color = 'var(--accent-cyan)';
      countEl.style.textShadow = '0 0 40px rgba(0,240,255,0.5)';
      overlay.querySelector('.launch-seq-sub').textContent =
        vehicle.name + ' — NOMINAL ASCENT TRAJECTORY';
    } else if (count < -5) {
      clearInterval(interval);
      overlay.classList.remove('active');
      countEl.style.color = '';
      countEl.style.textShadow = '';

      // Log to advisor
      const div = document.createElement('div');
      div.className = 'advisor-msg advisory';
      div.textContent = '> ✓ LAUNCH SUCCESSFUL — ' + mission.name + ' on ' + vehicle.name + '. Godspeed.';
      DOM.advisorLog.appendChild(div);
      DOM.advisorLog.scrollTop = DOM.advisorLog.scrollHeight;
    }
  }, 1000);
}

// ── EVENT BINDING ──
function bindEvents() {
  // Mission buttons
  document.getElementById('mission-btns').addEventListener('click', function(e) {
    const btn = e.target.closest('.mission-btn');
    if (!btn) return;
    sfxClick();
    document.querySelectorAll('.mission-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    STATE.mission = btn.dataset.mission;
    updateTelemetry();
  });

  // Vehicle buttons
  document.getElementById('vehicle-btns').addEventListener('click', function(e) {
    const btn = e.target.closest('.vehicle-btn');
    if (!btn) return;
    sfxClick();
    document.querySelectorAll('.vehicle-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    STATE.vehicle = btn.dataset.vehicle;
    updateTelemetry();
  });

  // Subsystem tabs
  document.getElementById('subsystem-tabs').addEventListener('click', function(e) {
    const tab = e.target.closest('.sub-tab');
    if (!tab) return;
    sfxClick();
    document.querySelectorAll('.sub-tab').forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');
    STATE.activeTab = tab.dataset.cat;
    renderSubsystems(STATE.activeTab);
  });

  // View tabs (CAD / Trajectory)
  document.querySelectorAll('.view-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      sfxClick();
      document.querySelectorAll('.view-tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.view-content').forEach(function(v) { v.classList.remove('active'); });
      tab.classList.add('active');
      const view = tab.dataset.view;
      STATE.activeView = view;
      document.getElementById('view-' + view).classList.add('active');
    });
  });

  // Audio toggle
  DOM.btnAudio.addEventListener('click', function() {
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

  // Launch button
  DOM.btnLaunch.addEventListener('click', executeLaunch);

  // Sources modal
  var srcModal = document.getElementById('sources-modal');
  document.getElementById('btn-sources').addEventListener('click', function() {
    srcModal.classList.remove('hidden');
  });
  document.getElementById('btn-close-sources').addEventListener('click', function() {
    srcModal.classList.add('hidden');
  });
  srcModal.addEventListener('click', function(e) {
    if (e.target === srcModal) srcModal.classList.add('hidden');
  });

  // ── HOTKEYS ──
  document.addEventListener('keyup', function(e) {
    const key = e.key.toLowerCase();

    // [1-3] Mission select
    if (key === '1') clickBtn('.mission-btn[data-mission="leo"]');
    if (key === '2') clickBtn('.mission-btn[data-mission="lunar"]');
    if (key === '3') clickBtn('.mission-btn[data-mission="mars"]');

    // [Q-T] Subsystem tabs
    if (key === 'q') clickBtn('.sub-tab[data-cat="power"]');
    if (key === 'w') clickBtn('.sub-tab[data-cat="comms"]');
    if (key === 'e') clickBtn('.sub-tab[data-cat="instruments"]');
    if (key === 'r') clickBtn('.sub-tab[data-cat="propulsion"]');
    if (key === 't') clickBtn('.sub-tab[data-cat="chassis"]');

    // [M] Audio mute
    if (key === 'm') DOM.btnAudio.click();

    // [Space] Launch
    if (key === ' ') executeLaunch();
  });
}

function clickBtn(selector) {
  const el = document.querySelector(selector);
  if (el) el.click();
}

// ── ERROR BOUNDARY ──
window.onerror = function(msg, src, line, col, err) {
  const errorScreen = document.getElementById('error-screen');
  const errorMsg = document.getElementById('error-msg');
  if (errorScreen && errorMsg) {
    errorMsg.textContent = msg + ' (Line ' + line + ')';
    errorScreen.classList.remove('hidden');
  }
  return true;
};

// ── BOOT SEQUENCE ──
(function boot() {
  const loader = document.getElementById('loading-skeleton');
  const app = document.getElementById('app');

  // Phase 1: Loading screen for 1.5s
  setTimeout(function() {
    loader.classList.add('fade-out');

    setTimeout(function() {
      loader.classList.add('hidden');
      app.classList.remove('hidden');

      // Phase 2: Initialize
      cacheDom();
      bindEvents();
      renderSubsystems('power');
      updateTelemetry();
      updateChassisSVG();

      // Start animations
      requestAnimationFrame(animateOrbit);
      setInterval(updateMET, 1000);

    }, 500); // Wait for fade-out transition
  }, 1500);
})();
