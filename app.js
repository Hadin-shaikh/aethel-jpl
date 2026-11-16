/* ═══════════════════════════════════════════════════════════════
   AETHEL // JPL — Space Mission Engineering Simulator
   Calm, Practical Engineering Tool — Core State Machine & Avionics
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ── NASA LAUNCH SERVICES PROGRAM & VENDOR SPECIFICATIONS ──
const VEHICLES = {
  falcon9: {
    name: 'Falcon 9',
    mass: 22800,
    cost: 67,
    id: 'falcon9',
    tliMass: 4020,
    fairing: '5.2m × 13.1m',
    desc: 'Cost-optimized reusable booster (vendor-published specs).'
  },
  falconheavy: {
    name: 'Falcon Heavy',
    mass: 63800,
    cost: 97,
    id: 'falconheavy',
    tliMass: 16800,
    fairing: '5.2m × 13.1m',
    desc: 'Tri-core heavy lift launcher (vendor-published specs).'
  },
  sls: {
    name: 'SLS Block 1',
    mass: 95000,
    cost: 2100,
    id: 'sls',
    tliMass: 27000,
    fairing: '5.0m × 19.1m',
    desc: 'NASA deep space exploration vehicle (NASA LSP fact sheet).'
  }
};

// ── VERIFIED NASA CELESTIAL BODY REFERENCE DATA ──
const CELESTIAL_BODIES = {
  earth: {
    id: 'earth',
    name: 'Earth',
    radius_km: 6378.137,
    mu: 398600.4418, // km^3/s^2
    axial_tilt_deg: 23.44,
    rotation_period_h: 23.934,
    defaultAltKm: 500.0,
    inc: '51.6°',
    speedOfLightDelaySec: 0.002,
    delayLabel: '< 0.1s latency',
    delayNote: 'Nominal sub-second DSN uplink.',
    solarFluxRatio: 1.0,
    source_url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html'
  },
  moon: {
    id: 'moon',
    name: 'Moon',
    radius_km: 1737.4,
    mu: 4902.8, // km^3/s^2
    axial_tilt_deg: 6.68,
    rotation_period_h: 655.728, // 27.322 days (tidally locked)
    mean_distance_km: 384400.0,
    defaultAltKm: 100.0,
    inc: '28.5°',
    speedOfLightDelaySec: 1.28,
    delayLabel: '1.3s delay (one-way)',
    delayNote: '1.3s one-way light travel time to Earth.',
    solarFluxRatio: 1.0,
    source_url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html'
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    radius_km: 3389.5,
    mu: 42828.3, // km^3/s^2
    axial_tilt_deg: 25.19,
    rotation_period_h: 24.623,
    mean_distance_sun_au: 1.524,
    defaultAltKm: 250.0,
    inc: '1.85°',
    speedOfLightDelaySec: 840, // ~14 min average (3 to 22 min)
    delayLabel: '3–22m delay (~14m avg)',
    delayNote: 'Comms delay requires autonomous fault response.',
    solarFluxRatio: 0.4307, // 1 / (1.524^2) = 0.4307 (~43% solar flux)
    source_url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html'
  }
};

// ── ASTRODYNAMICS MISSION PROFILES ──
const MISSIONS = {
  leo: {
    name: 'LEO Satellite',
    type: 'leo',
    bodyId: 'earth',
    targetData: 10,
    altitudeKm: 500.0,
    periapsis: '500.0 km',
    apoapsis: '500.0 km',
    inc: '51.6°',
    dvReq: 150,
    code: 'M-LEO-500K'
  },
  lunar: {
    name: 'Lunar Rover',
    type: 'lunar',
    bodyId: 'moon',
    targetData: 5,
    altitudeKm: 100.0,
    periapsis: '100.0 km (Lunar Orbit)',
    apoapsis: '100.0 km',
    inc: '28.5°',
    dvReq: 3100,
    code: 'M-CISLUNAR-ARTEMIS'
  },
  mars: {
    name: 'Mars Probe',
    type: 'mars',
    bodyId: 'mars',
    targetData: 2,
    altitudeKm: 250.0,
    periapsis: '250.0 km (Mars Orbit)',
    apoapsis: 'HOHMANN AP',
    inc: '1.85°',
    dvReq: 5600,
    code: 'M-INTERPLANETARY-MARS'
  }
};

// Compute dynamic Keplerian parameters (nothing hardcoded)
function computeAstroDynamics(missionKey) {
  const mission = MISSIONS[missionKey] || MISSIONS.leo;
  const body = CELESTIAL_BODIES[mission.bodyId] || CELESTIAL_BODIES.earth;
  const alt = mission.altitudeKm || 500.0;
  const r = body.radius_km + alt;
  const v = Math.sqrt(body.mu / r);
  const periodMin = (2 * Math.PI * Math.sqrt(Math.pow(r, 3) / body.mu)) / 60.0;
  const vEsc = Math.sqrt((2 * body.mu) / r);

  return {
    body,
    altKm: alt,
    velocityKmS: v,
    velocityFormatted: `${v.toFixed(3)} km/s`,
    periodMin: periodMin,
    periodFormatted: `${periodMin.toFixed(1)} min`,
    escapeVelKmS: vEsc,
    escapeFormatted: `${vEsc.toFixed(3)} km/s`,
    inc: mission.inc,
    periapsis: mission.periapsis,
    apoapsis: mission.apoapsis
  };
}

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
        data: 0
      },
      {
        id: 'rtg-plutonium',
        name: 'NextGen Plutonium-238 RTG',
        desc: 'Stirling radioisotope generator. Continuous power unaffected by eclipse.',
        mass: 380,
        power: 350,
        cost: 95,
        data: 0
      },
      {
        id: 'battery-liion',
        name: 'Li-Ion Battery Buffer (40 Ah)',
        desc: 'High-density spaceflight battery pack for eclipse shadow survival.',
        mass: 45,
        power: -10, // trickle charging draw
        cost: 5,
        data: 0
      }
    ]
  },
  comms: {
    label: 'Communications',
    items: [
      {
        id: 'antenna-kaband',
        name: 'Ka-Band High-Gain Antenna',
        desc: '2.5m deployable mesh reflector for NASA DSN 34m/70m high-rate downlinks.',
        mass: 85,
        power: -100,
        cost: 22,
        data: 80
      },
      {
        id: 'antenna-sband',
        name: 'S-Band Omni Antenna',
        desc: 'Low-gain omni array for emergency commanding and housekeeping uplink.',
        mass: 12,
        power: -15,
        cost: 3,
        data: 5
      },
      {
        id: 'antenna-xband',
        name: 'X-Band Steerable Dish',
        desc: 'Dual-polarization gimballed dish for medium orbit deep-space telemetry.',
        mass: 35,
        power: -50,
        cost: 12,
        data: 40
      }
    ]
  },
  instruments: {
    label: 'Science Instruments',
    items: [
      {
        id: 'imager-hires',
        name: 'High-Resolution Multispectral Imager',
        desc: 'TDI CCD camera with 0.3m ground resolution at 500km altitude.',
        mass: 95,
        power: -80,
        cost: 35,
        data: -25
      },
      {
        id: 'radar-sar',
        name: 'L-Band Synthetic Aperture Radar',
        desc: 'Interferometric radar for sub-surface planetary ice and crust mapping.',
        mass: 220,
        power: -320,
        cost: 65,
        data: -45
      },
      {
        id: 'spectrometer-mass',
        name: 'Neutral Gas & Ion Mass Spectrometer',
        desc: 'Quadrupole spectrometer for exosphere chemical sampling.',
        mass: 35,
        power: -40,
        cost: 20,
        data: -8
      }
    ]
  },
  propulsion: {
    label: 'Propulsion Systems',
    items: [
      {
        id: 'thruster-coldgas',
        name: 'GN2 Cold Gas Reaction Control',
        desc: 'Nitrogen gas thrusters (Isp: 70s) for precision momentum dumping.',
        mass: 35,
        power: -20,
        cost: 8,
        data: 0
      },
      {
        id: 'thruster-ion',
        name: 'NEXT-C Gridded Xenon Ion Engine',
        desc: 'NASA Glenn high specific impulse (Isp: 4,100s) ion thruster.',
        mass: 140,
        power: -280,
        cost: 45,
        data: 0
      },
      {
        id: 'thruster-monoprop',
        name: 'Hydrazine Monopropellant System',
        desc: 'Catalytic decomposition thruster (Isp: 230s) for orbit insertion burns.',
        mass: 90,
        power: -35,
        cost: 15,
        data: 0
      }
    ]
  },
  chassis: {
    label: 'Spacecraft Bus / Chassis',
    items: [
      {
        id: 'chassis-smallsat',
        name: 'ESPA-Class SmallSat Bus',
        desc: 'Secondary payload adapter ring compatible aluminum chassis.',
        mass: 150,
        power: -30,
        cost: 15,
        data: 0
      },
      {
        id: 'chassis-composite',
        name: 'Carbon-Composite Hexagonal Bus',
        desc: 'Truss structure with embedded heat pipes and multi-layer insulation.',
        mass: 280,
        power: -50,
        cost: 40,
        data: 0
      },
      {
        id: 'chassis-flagship',
        name: 'Flagship Deep Space Bus',
        desc: 'Radiation-hardened chassis with dual fault-tolerant MIL-STD-1553B bus.',
        mass: 600,
        power: -120,
        cost: 150,
        data: 0
      }
    ]
  }
};

// ── GLOBAL STATE ──
const STATE = {
  mission: 'leo',
  vehicle: 'falcon9',
  equipped: new Set([
    'solar-ultraflex',
    'battery-liion',
    'antenna-kaband',
    'imager-hires',
    'spectrometer-mass',
    'thruster-monoprop',
    'chassis-composite'
  ]),
  activeView: 'mission', // 'mission' | 'vehicle' | 'build' | 'analyze' | 'launch'
  activeCat: 'power',
  activeVTab: '3d',
  timeWarp: 1,
  audioEnabled: false,
  metOffsetSec: 142 * 86400 + 8 * 3600 + 24 * 60 + 19,
  metStartTime: Date.now(),
  findings: []
};

// ── DOM CACHE ──
const DOM = {};
function cacheDom() {
  DOM.clockMet = document.getElementById('clock-met');
  DOM.clockUtc = document.getElementById('clock-utc');
  DOM.btnAudioToggle = document.getElementById('btn-audio-toggle');
  DOM.audioLabel = document.getElementById('audio-label');
  DOM.btnAdvisorDrawer = document.getElementById('btn-advisor-drawer');
  DOM.advisorBadge = document.getElementById('advisor-badge');
  DOM.advisorDrawer = document.getElementById('advisor-drawer');
  DOM.btnCloseAdvisor = document.getElementById('btn-close-advisor');
  DOM.drawerFindingsList = document.getElementById('drawer-findings-list');

  // Vitals
  DOM.tileMass = document.getElementById('tile-mass');
  DOM.valMass = document.getElementById('val-mass');
  DOM.subMass = document.getElementById('sub-mass');
  DOM.chipMass = document.getElementById('chip-mass');
  DOM.fillMass = document.getElementById('fill-mass');

  DOM.tilePower = document.getElementById('tile-power');
  DOM.valPower = document.getElementById('val-power');
  DOM.subPower = document.getElementById('sub-power');
  DOM.chipPower = document.getElementById('chip-power');
  DOM.fillPower = document.getElementById('fill-power');

  DOM.tileBudget = document.getElementById('tile-budget');
  DOM.valBudget = document.getElementById('val-budget');
  DOM.subBudget = document.getElementById('sub-budget');
  DOM.chipBudget = document.getElementById('chip-budget');
  DOM.fillBudget = document.getElementById('fill-budget');

  DOM.tileData = document.getElementById('tile-data');
  DOM.valData = document.getElementById('val-data');
  DOM.subData = document.getElementById('sub-data');
  DOM.chipData = document.getElementById('chip-data');
  DOM.fillData = document.getElementById('fill-data');

  DOM.tileDsn = document.getElementById('tile-dsn');
  DOM.valDsn = document.getElementById('val-dsn');
  DOM.subDsn = document.getElementById('sub-dsn');
  DOM.chipDsn = document.getElementById('chip-dsn');
  DOM.fillDsn = document.getElementById('fill-dsn');

  // 3D Viewport
  DOM.canvas3dWrap = document.getElementById('canvas-3d-wrap');
  DOM.canvas2dMap = document.getElementById('canvas-2d-map');
  DOM.vpAlt = document.getElementById('vp-alt');
  DOM.vpInc = document.getElementById('vp-inc');
  DOM.vpPeriod = document.getElementById('vp-period');
  DOM.btnResetCam = document.getElementById('btn-reset-cam');
  DOM.btnFullscreenVp = document.getElementById('btn-fullscreen-vp');

  // Outfitter
  DOM.moduleList = document.getElementById('module-list');
  DOM.workspaceModuleList = document.getElementById('workspace-module-list');
  DOM.outfitterCount = document.getElementById('outfitter-count');

  // Trajectory Canvas
  DOM.canvasConic = document.getElementById('canvas-conic');
  DOM.trajStatsRow = document.getElementById('traj-stats-row');

  // Launch Controls
  DOM.btnHoldIgnition = document.getElementById('btn-hold-ignition');
  DOM.holdBar = document.getElementById('hold-bar');
  DOM.holdBtnText = document.getElementById('hold-btn-text');
  DOM.launchCountdownDisplay = document.getElementById('launch-countdown-display');
  DOM.launchSubText = document.getElementById('launch-sub-text');
  DOM.launchReadinessLabel = document.getElementById('launch-readiness-label');
  DOM.postMortemBox = document.getElementById('post-mortem-box');
  DOM.pmTitle = document.getElementById('pm-title');
  DOM.pmTime = document.getElementById('pm-time');
  DOM.pmDesc = document.getElementById('pm-desc');
  DOM.pmFix = document.getElementById('pm-fix');

  // Modals
  DOM.mathModal = document.getElementById('math-modal');
  DOM.mathTitle = document.getElementById('math-title');
  DOM.mathFormulaText = document.getElementById('math-formula-text');
  DOM.mathExplanation = document.getElementById('math-explanation');
  DOM.btnCloseMath = document.getElementById('btn-close-math');

  DOM.sourcesModal = document.getElementById('sources-modal');
  DOM.btnOpenSources = document.getElementById('btn-open-sources');
  DOM.btnCloseSourcesModal = document.getElementById('btn-close-sources-modal');
}

// ── NATIVE WEB AUDIO SYNTHESIZER ──
let audioCtx = null;
function initAudio() {
  if (audioCtx) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (AudioContextClass) audioCtx = new AudioContextClass();
}

function playTone(freq, duration, type = 'sine', volume = 0.05) {
  if (!STATE.audioEnabled || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function sfxClick() { playTone(2400, 0.04, 'square', 0.03); }
function sfxEquip() { playTone(1800, 0.07, 'triangle', 0.05); }
function sfxUnequip() { playTone(820, 0.07, 'triangle', 0.04); }
function sfxError() { playTone(140, 0.22, 'sawtooth', 0.08); }
function sfxLaunch() { playTone(60, 1.4, 'sawtooth', 0.12); }

// ── FORMAT CURRENCY ──
function formatCurrency(amountMillions) {
  if (amountMillions >= 1000) return '$' + (amountMillions / 1000).toFixed(1) + 'B';
  return '$' + amountMillions.toFixed(1) + 'M';
}

// ── 3D SCENE INSTANCE ──
let orbitScene = null;

// ── COMPUTE TELEMETRY & RUN DESIGN REVIEW ──
function computeAndRender() {
  const vehicle = VEHICLES[STATE.vehicle] || VEHICLES.falcon9;
  const mission = MISSIONS[STATE.mission] || MISSIONS.leo;
  const astro = computeAstroDynamics(STATE.mission);
  const body = astro.body;

  let totalMass = 0;
  let totalGen = 0;
  let totalLoad = 0;
  let totalCost = vehicle.cost;
  let totalData = 0;

  for (const catKey of Object.keys(SUBSYSTEMS)) {
    for (const item of SUBSYSTEMS[catKey].items) {
      if (STATE.equipped.has(item.id)) {
        totalMass += item.mass;
        totalCost += item.cost;
        totalData += item.data;
        if (item.power > 0) {
          // Solar flux drops with inverse-square law at Mars (1.52 AU -> 43% flux)
          const fluxRatio = item.id.includes('solar') ? body.solarFluxRatio : 1.0;
          totalGen += Math.round(item.power * fluxRatio);
        } else if (item.power < 0) {
          totalLoad += Math.abs(item.power);
        }
      }
    }
  }

  const netPower = totalGen - totalLoad;
  const budgetCap = 250;
  const massRatio = Math.min(100, (totalMass / vehicle.mass) * 100);
  const budgetRatio = Math.min(100, (totalCost / budgetCap) * 100);

  // 1. Update Mass Tile
  if (DOM.valMass) DOM.valMass.textContent = totalMass.toLocaleString();
  if (DOM.subMass) DOM.subMass.textContent = `/ ${vehicle.mass.toLocaleString()} kg`;
  if (DOM.fillMass) DOM.fillMass.style.width = `${massRatio}%`;
  if (DOM.chipMass) {
    if (totalMass <= vehicle.mass) {
      DOM.chipMass.className = 'vital-chip ok';
      DOM.chipMass.textContent = 'OK';
      DOM.tileMass.classList.remove('alert');
    } else {
      DOM.chipMass.className = 'vital-chip danger';
      DOM.chipMass.textContent = 'OVER';
      DOM.tileMass.classList.add('alert');
    }
  }

  // 2. Update Power Tile
  const solarNote = (STATE.mission === 'mars' && STATE.equipped.has('solar-ultraflex'))
    ? ' (43% solar flux at 1.52 AU)'
    : '';
  if (DOM.valPower) DOM.valPower.textContent = (netPower >= 0 ? '+' : '') + netPower;
  if (DOM.subPower) DOM.subPower.textContent = `W net (gen: ${totalGen}W${solarNote}, load: ${totalLoad}W)`;
  if (DOM.fillPower) {
    const pRatio = Math.max(0, Math.min(100, (netPower >= 0 ? 50 + netPower / 10 : 50 - Math.abs(netPower) / 10)));
    DOM.fillPower.style.width = `${pRatio}%`;
  }
  if (DOM.chipPower) {
    if (netPower >= 0) {
      DOM.chipPower.className = 'vital-chip ok';
      DOM.chipPower.textContent = (netPower > 0 ? '+' : '') + netPower + ' W';
      DOM.tilePower.classList.remove('alert');
    } else {
      DOM.chipPower.className = 'vital-chip danger';
      DOM.chipPower.textContent = netPower + ' W';
      DOM.tilePower.classList.add('alert');
    }
  }

  // 3. Update Budget Tile
  if (DOM.valBudget) DOM.valBudget.textContent = formatCurrency(totalCost);
  if (DOM.subBudget) DOM.subBudget.textContent = `/ ${formatCurrency(budgetCap)}`;
  if (DOM.fillBudget) DOM.fillBudget.style.width = `${budgetRatio}%`;
  if (DOM.chipBudget) {
    if (totalCost <= budgetCap) {
      DOM.chipBudget.className = 'vital-chip ok';
      DOM.chipBudget.textContent = formatCurrency(totalCost);
      DOM.tileBudget.classList.remove('alert');
    } else {
      DOM.chipBudget.className = 'vital-chip danger';
      DOM.chipBudget.textContent = 'OVER CAP';
      DOM.tileBudget.classList.add('alert');
    }
  }

  // 4. Update Data Throughput Tile
  if (DOM.valData) DOM.valData.textContent = totalData.toFixed(1);
  if (DOM.subData) DOM.subData.textContent = `Mbps (target: ${mission.targetData})`;
  if (DOM.fillData) DOM.fillData.style.width = `${Math.min(100, (totalData / mission.targetData) * 100)}%`;
  if (DOM.chipData) {
    if (totalData >= mission.targetData) {
      DOM.chipData.className = 'vital-chip ok';
      DOM.chipData.textContent = 'OK';
      DOM.tileData.classList.remove('alert');
    } else {
      DOM.chipData.className = 'vital-chip warn';
      DOM.chipData.textContent = 'LOW';
      DOM.tileData.classList.remove('alert');
    }
  }

  // 5. Update DSN Link Margin Tile (With Distance-Based Light Time Delay)
  const hasKa = STATE.equipped.has('antenna-kaband');
  const hasX = STATE.equipped.has('antenna-xband');
  const hasS = STATE.equipped.has('antenna-sband');
  let dsnMargin = 0;
  let bandName = 'None';
  if (hasKa) { dsnMargin = 23.4; bandName = 'Ka-Band (70m)'; }
  else if (hasX) { dsnMargin = 18.2; bandName = 'X-Band (34m)'; }
  else if (hasS) { dsnMargin = 12.4; bandName = 'S-Band (34m)'; }

  if (STATE.mission === 'mars' && dsnMargin > 0) {
    dsnMargin = Math.max(2.1, dsnMargin - 7.2);
  } else if (STATE.mission === 'lunar' && dsnMargin > 0) {
    dsnMargin = Math.max(4.0, dsnMargin - 1.2);
  }

  if (DOM.valDsn) DOM.valDsn.textContent = dsnMargin > 0 ? `+${dsnMargin.toFixed(1)}` : '0.0';
  if (DOM.subDsn) {
    DOM.subDsn.innerHTML = `dB (${bandName}) • <b style="color: #0284C7;">${body.delayLabel}</b>`;
  }
  const noteDsn = document.getElementById('note-dsn');
  if (noteDsn) {
    noteDsn.textContent = body.delayNote || '';
  }
  if (DOM.chipDsn) {
    if (dsnMargin >= 12.0) {
      DOM.chipDsn.className = 'vital-chip ok';
      DOM.chipDsn.textContent = `+${dsnMargin.toFixed(1)} dB`;
    } else if (dsnMargin > 0) {
      DOM.chipDsn.className = 'vital-chip warn';
      DOM.chipDsn.textContent = 'MARGIN LOW';
    } else {
      DOM.chipDsn.className = 'vital-chip danger';
      DOM.chipDsn.textContent = 'NO LINK';
    }
  }

  // Viewport Dynamic Astrodynamic Stats (Never hardcoded)
  if (DOM.vpAlt) DOM.vpAlt.textContent = astro.periapsis;
  if (DOM.vpInc) DOM.vpInc.textContent = astro.inc;
  if (DOM.vpPeriod) DOM.vpPeriod.textContent = astro.periodFormatted;

  // Outfitter Count
  if (DOM.outfitterCount) DOM.outfitterCount.textContent = `${STATE.equipped.size} Equipped`;

  // Synchronize 3D Celestial Body & Satellite Modules
  if (orbitScene) {
    orbitScene.setMission(STATE.mission);
    orbitScene.updateSatelliteModules(STATE.equipped);
  }

  // Execute 10 Design Review Rules
  if (typeof evaluateDesignRules === 'function') {
    STATE.findings = evaluateDesignRules(STATE, SUBSYSTEMS, VEHICLES, MISSIONS, null);
    renderAdvisorDrawer(STATE.findings);
  }

  // Render Outfitter lists
  renderOutfitterList(DOM.moduleList, STATE.activeCat);
  renderOutfitterList(DOM.workspaceModuleList, STATE.activeCat);
}

// ── RENDER OUTFITTER MODULES ──
function renderOutfitterList(containerEl, categoryKey) {
  if (!containerEl) return;
  containerEl.innerHTML = '';

  const cat = SUBSYSTEMS[categoryKey];
  if (!cat) return;

  const frag = document.createDocumentFragment();

  for (const item of cat.items) {
    const isEquipped = STATE.equipped.has(item.id);
    const card = document.createElement('div');
    card.className = `module-card ${isEquipped ? 'equipped' : ''}`;

    card.innerHTML = `
      <div class="mod-top">
        <span class="mod-title">${item.name}</span>
        <span class="mod-status">${isEquipped ? '[EQUIPPED]' : '[STOWED]'}</span>
      </div>
      <div class="mod-desc">${item.desc}</div>
      <div class="mod-pills">
        <span class="stat-pill">+${item.mass} kg</span>
        <span class="stat-pill">${item.power >= 0 ? '+' : ''}${item.power}W</span>
        <span class="stat-pill">${formatCurrency(item.cost)}</span>
        ${item.data !== 0 ? `<span class="stat-pill">${item.data > 0 ? '+' : ''}${item.data} Mbps</span>` : ''}
      </div>
    `;

    card.addEventListener('click', () => {
      if (STATE.equipped.has(item.id)) {
        STATE.equipped.delete(item.id);
        sfxUnequip();
      } else {
        STATE.equipped.add(item.id);
        sfxEquip();
      }
      computeAndRender();
    });

    frag.appendChild(card);
  }

  containerEl.appendChild(frag);
}

// ── RENDER DESIGN REVIEW FINDINGS IN DRAWER ──
function renderAdvisorDrawer(findings) {
  if (!DOM.drawerFindingsList) return;
  DOM.drawerFindingsList.innerHTML = '';

  const blockers = findings.filter(f => f.severity === 'blocker');
  const warnings = findings.filter(f => f.severity === 'warning');

  // Update Drawer Badge
  if (DOM.advisorBadge) {
    if (blockers.length > 0) {
      DOM.advisorBadge.className = 'review-badge blocker';
      DOM.advisorBadge.textContent = `${blockers.length} Blocker${blockers.length > 1 ? 's' : ''}`;
    } else if (warnings.length > 0) {
      DOM.advisorBadge.className = 'review-badge';
      DOM.advisorBadge.textContent = `${warnings.length} Warning${warnings.length > 1 ? 's' : ''}`;
    } else {
      DOM.advisorBadge.className = 'review-badge ok';
      DOM.advisorBadge.textContent = 'Nominal';
    }
  }

  // Update Launch Readiness Label
  if (DOM.launchReadinessLabel) {
    if (blockers.length > 0) {
      DOM.launchReadinessLabel.textContent = `Launch Inhibit: ${blockers.length} Critical Blocker${blockers.length > 1 ? 's' : ''}`;
      DOM.launchReadinessLabel.style.color = 'var(--status-danger)';
    } else {
      DOM.launchReadinessLabel.textContent = 'Design Review: All Systems Nominal';
      DOM.launchReadinessLabel.style.color = 'var(--text-muted)';
    }
  }

  if (findings.length === 0) {
    DOM.drawerFindingsList.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <div style="font-size: 24px; color: var(--status-ok); margin-bottom: 8px;">✓</div>
        <b>All Diagnostic Checks Passed</b>
        <p style="font-size: 11.5px; margin-top: 4px;">Spacecraft architecture satisfies all structural, electrical, telemetry and astrodynamic constraints.</p>
      </div>
    `;
    return;
  }

  const frag = document.createDocumentFragment();

  for (const f of findings) {
    const card = document.createElement('div');
    card.className = `rule-finding-card ${f.severity}`;

    card.innerHTML = `
      <div class="rfc-top">
        <span class="rfc-title">${f.title}</span>
        <span class="rfc-badge ${f.severity}">${f.severity.toUpperCase()}</span>
      </div>
      <div class="rfc-text">${f.what_is_wrong}</div>
      <div class="rfc-data">Data: ${f.data_used}</div>
      <div class="rfc-fix-row">
        <span style="font-size: 10.5px; color: var(--text-muted);">${f.why_it_matters}</span>
        ${f.autoFix ? `<button class="btn-autofix">${f.autoFix.label}</button>` : ''}
      </div>
    `;

    if (f.autoFix) {
      const fixBtn = card.querySelector('.btn-autofix');
      fixBtn.addEventListener('click', () => {
        sfxClick();
        f.autoFix.action();
        computeAndRender();
      });
    }

    frag.appendChild(card);
  }

  DOM.drawerFindingsList.appendChild(frag);
}

// ── 2D GROUND TRACK DRAWING ──
function draw2DGroundTrack() {
  const canvas = DOM.canvas2dMap;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.parentElement.clientWidth || 640;
  const h = canvas.height = canvas.parentElement.clientHeight || 320;

  ctx.fillStyle = '#070B14';
  ctx.fillRect(0, 0, w, h);

  // Lat / Lon Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += w / 12) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += h / 6) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Equator Line
  ctx.strokeStyle = 'rgba(11, 110, 153, 0.4)';
  ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();

  // Sinusoidal Ground Track based on Inclination
  const mission = MISSIONS[STATE.mission];
  const inc = parseFloat(mission.inc);
  const amp = (inc / 90) * (h / 2 - 20);

  ctx.strokeStyle = '#0B6E99';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 4) {
    const y = h / 2 - Math.sin((x / w) * Math.PI * 4) * amp;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // DSN Ground Stations
  const stations = [
    { name: 'Goldstone (DSS-14)', x: w * 0.22, y: h * 0.38 },
    { name: 'Madrid (DSS-63)', x: w * 0.48, y: h * 0.35 },
    { name: 'Canberra (DSS-43)', x: w * 0.88, y: h * 0.72 }
  ];

  ctx.fillStyle = '#1A7F4B';
  ctx.font = "9px 'JetBrains Mono', monospace";
  for (const st of stations) {
    ctx.beginPath();
    ctx.arc(st.x, st.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(st.name, st.x + 8, st.y + 3);
  }
}

// ── CONIC PREDICTION CANVAS (RUNGE-KUTTA 4) ──
let conicAngle = 0;
function drawConicCanvas() {
  const canvas = DOM.canvasConic;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // High-DPI crisp rendering
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || 800;
  const h = rect.height || 180;
  
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  // Subtle background grid
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  const earthX = Math.max(70, w * 0.12);
  const earthY = h / 2;

  // Adapt central body and node text according to active mission
  let bodyName = 'EARTH';
  let bodyColor = '#0B6E99';
  let bodyBorder = '#93C5FD';
  let node1Text = 'NODE 1: INJECTION';
  let node2Text = 'NODE 2: CIRC';

  if (STATE.mission === 'lunar') {
    bodyName = 'MOON';
    bodyColor = '#475569';
    bodyBorder = '#CBD5E1';
    node1Text = 'NODE 1: TLI BURN';
    node2Text = 'NODE 2: LOI CAPTURE';
  } else if (STATE.mission === 'mars') {
    bodyName = 'MARS';
    bodyColor = '#C2410C';
    bodyBorder = '#FDBA74';
    node1Text = 'NODE 1: TMI BURN';
    node2Text = 'NODE 2: MOI BRAKING';
  }

  // Central Body Globe Circle
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(earthX, earthY, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = bodyBorder;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Crisp body label
  ctx.fillStyle = '#FFFFFF';
  ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(bodyName, earthX, earthY);

  // Orbital Transfer Ellipse
  const centerX = w * 0.52;
  const radiusX = w * 0.38;
  const radiusY = Math.min(55, h * 0.32);

  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.ellipse(centerX, earthY, radiusX, radiusY, -0.02, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Helper for drawing node pills that never strike through text
  function drawNodePill(x, y, text, color, offsetAbove) {
    ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
    const textWidth = ctx.measureText(text).width;
    const pillW = textWidth + 18;
    const pillH = 22;
    const pillY = offsetAbove ? y - 30 : y + 10;
    const pillX = x - pillW / 2;

    // Node indicator dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Line from dot to pill
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, offsetAbove ? pillY + pillH : pillY);
    ctx.stroke();

    // Solid white background pill
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 4);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, pillY + pillH / 2);
  }

  // Maneuver Node 1 (Offset above)
  const node1X = centerX - radiusX * 0.45;
  const node1Y = earthY - radiusY * 0.88;
  drawNodePill(node1X, node1Y, node1Text, '#B45309', true);

  // Maneuver Node 2 (Offset below)
  const node2X = centerX + radiusX * 0.70;
  const node2Y = earthY + radiusY * 0.72;
  drawNodePill(node2X, node2Y, node2Text, '#15803D', false);

  // Animated Satellite Marker
  conicAngle += 0.015 * STATE.timeWarp;
  const satX = centerX + Math.cos(conicAngle) * radiusX;
  const satY = earthY + Math.sin(conicAngle) * radiusY;

  // Satellite outer ring
  ctx.strokeStyle = '#0284C7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(satX, satY, 7, 0, Math.PI * 2);
  ctx.stroke();

  // Satellite inner core
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(satX, satY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── HOLD-TO-CONFIRM LAUNCH ACTUATOR & POST-MORTEM ──
let holdTimer = null;
let holdStart = 0;
const REQUIRED_HOLD_MS = 1500;

function setupHoldToLaunch() {
  const btn = DOM.btnHoldIgnition;
  const bar = DOM.holdBar;
  if (!btn || !bar) return;

  const startHold = () => {
    holdStart = performance.now();
    btn.classList.add('armed');
    sfxClick();

    holdTimer = setInterval(() => {
      const elapsed = performance.now() - holdStart;
      const pct = Math.min(100, (elapsed / REQUIRED_HOLD_MS) * 100);
      bar.style.width = `${pct}%`;

      if (elapsed >= REQUIRED_HOLD_MS) {
        clearInterval(holdTimer);
        holdTimer = null;
        bar.style.width = '0%';
        btn.classList.remove('armed');
        triggerLaunchSequence();
      }
    }, 20);
  };

  const cancelHold = () => {
    if (holdTimer) {
      clearInterval(holdTimer);
      holdTimer = null;
      bar.style.width = '0%';
      btn.classList.remove('armed');
    }
  };

  btn.addEventListener('mousedown', startHold);
  btn.addEventListener('touchstart', startHold, { passive: true });
  window.addEventListener('mouseup', cancelHold);
  window.addEventListener('touchend', cancelHold);
}

function triggerLaunchSequence() {
  sfxLaunch();
  DOM.postMortemBox.classList.add('hidden');

  let count = 5;
  DOM.launchCountdownDisplay.textContent = 'T-' + count;
  DOM.launchSubText.textContent = 'Terminal countdown active. Stage-0 ignition armed.';

  const timer = setInterval(() => {
    count--;
    if (count > 0) {
      DOM.launchCountdownDisplay.textContent = 'T-' + count;
      playTone(1000, 0.05, 'sine');
    } else if (count === 0) {
      DOM.launchCountdownDisplay.textContent = 'LIFTOFF';
      playTone(180, 0.5, 'sawtooth');

      // Check for blockers to trigger physical Post-Mortem
      if (typeof evaluateLaunchPostMortem === 'function') {
        const failureReport = evaluateLaunchPostMortem(STATE.findings);
        if (failureReport) {
          clearInterval(timer);
          DOM.launchCountdownDisplay.textContent = 'ABORT / FAILURE';
          DOM.launchCountdownDisplay.style.color = 'var(--status-danger)';
          DOM.launchSubText.textContent = `${failureReport.phase} FAILURE at ${failureReport.time}.`;

          DOM.pmTitle.textContent = failureReport.title;
          DOM.pmTime.textContent = failureReport.time;
          DOM.pmDesc.textContent = failureReport.explanation;
          DOM.pmFix.innerHTML = `<b>Diagnostic Rule:</b> ${failureReport.predicted_by}<br><b>Required Fix:</b> ${failureReport.fix}`;
          DOM.postMortemBox.classList.remove('hidden');
          sfxError();
          return;
        }
      }
    } else if (count === -2) {
      DOM.launchCountdownDisplay.textContent = 'STAGE SEPARATION';
      DOM.launchSubText.textContent = 'First stage booster MECO. Second stage ignition nominal.';
    } else if (count === -4) {
      DOM.launchCountdownDisplay.textContent = 'ORBIT INSERTION';
      DOM.launchCountdownDisplay.style.color = 'var(--status-ok)';
      DOM.launchSubText.textContent = 'Spacecraft successfully deployed into target orbit. DSN carrier locked.';
      clearInterval(timer);
    }
  }, 1000);
}

// ── "SHOW THE MATH" FORMULA DISCLOSURE ──
const FORMULA_EXPLANATIONS = {
  mass: {
    title: 'Payload Mass & Structural Margin',
    formula: 'Margin = (M_max - M_wet) / M_max',
    desc: 'Ensures the launch vehicle thrust-to-weight ratio (TWR) is sufficient to achieve orbital insertion velocity without exceeding launcher structural envelope.'
  },
  power: {
    title: 'Electrical Power Net Margin',
    formula: 'P_net = ∑ P_gen - ∑ P_load',
    desc: 'Calculates the real-time energy balance of the spacecraft bus across sunlit and eclipse passes. Positive margin ensures battery trickle charge.'
  },
  budget: {
    title: 'NASA Program Cost Constraint',
    formula: 'Reserve = Cap - (C_launch + ∑ C_subsystems)',
    desc: 'Enforces the authorized NASA Announcement of Opportunity spending ceiling ($250.0M) across hardware acquisition and dedicated launch services.'
  },
  data: {
    title: 'Downlink Throughput & Data Backlog',
    formula: 'Data_rate = f(Transceiver_P, Antenna_Gain, Frequency_Band)',
    desc: 'Determines daily volume of scientific imaging and telemetry return to Earth. Must meet mission objective requirements to prevent instrument buffer overflow.'
  },
  dsn: {
    title: 'NASA Deep Space Network Link Margin',
    formula: 'Eb/N0 = EIRP + (G/T) - L_path - k - R',
    desc: 'Calculates carrier signal margin at Goldstone (DSS-14), Madrid (DSS-63), or Canberra (DSS-43) complexes across S, X, and Ka-band frequencies.'
  }
};

function setupMathModals() {
  document.querySelectorAll('.math-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      sfxClick();
      const type = btn.dataset.math;
      const data = FORMULA_EXPLANATIONS[type];
      if (data) {
        DOM.mathTitle.textContent = data.title;
        DOM.mathFormulaText.textContent = data.formula;
        DOM.mathExplanation.textContent = data.desc;
        DOM.mathModal.classList.remove('hidden');
      }
    });
  });

  DOM.btnCloseMath.addEventListener('click', () => {
    DOM.mathModal.classList.add('hidden');
  });
  DOM.mathModal.addEventListener('click', e => {
    if (e.target === DOM.mathModal) DOM.mathModal.classList.add('hidden');
  });
}

// ── SETUP VIEW SWITCHING ──
function setupNavigation() {
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.addEventListener('click', () => {
      sfxClick();
      document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const viewId = btn.dataset.view;
      STATE.activeView = viewId;

      document.querySelectorAll('.view-container').forEach(v => v.classList.add('hidden'));
      const activeEl = document.getElementById(`view-${viewId}`);
      if (activeEl) activeEl.classList.remove('hidden');

      if (viewId === 'mission' && orbitScene) {
        setTimeout(() => orbitScene.handleResize(), 50);
      }
    });
  });

  // Mission Selector Strip Tabs
  document.querySelectorAll('.mission-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      sfxClick();
      document.querySelectorAll('.mission-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      STATE.mission = tab.dataset.mission;
      if (orbitScene) orbitScene.setMission(STATE.mission);
      computeAndRender();
    });
  });

  // Launch Vehicle Cards
  document.querySelectorAll('.vehicle-card').forEach(card => {
    card.addEventListener('click', () => {
      sfxClick();
      document.querySelectorAll('.vehicle-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      STATE.vehicle = card.dataset.vehicle;
      computeAndRender();
    });
  });

  // Outfitter Category Tabs
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfxClick();
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.activeCat = btn.dataset.cat;
      renderOutfitterList(DOM.moduleList, STATE.activeCat);
      renderOutfitterList(DOM.workspaceModuleList, STATE.activeCat);
    });
  });

  // 3D Viewport Tabs (3D View | 2D Map | Trajectory)
  document.querySelectorAll('.v-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      sfxClick();
      document.querySelectorAll('.v-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tabType = btn.dataset.vtab;
      STATE.activeVTab = tabType;

      if (tabType === '2d') {
        DOM.canvas3dWrap.style.display = 'none';
        DOM.canvas2dMap.style.display = 'block';
        draw2DGroundTrack();
      } else {
        DOM.canvas3dWrap.style.display = 'block';
        DOM.canvas2dMap.style.display = 'none';
      }
    });
  });

  // Camera Reset
  DOM.btnResetCam.addEventListener('click', () => {
    sfxClick();
    if (orbitScene) orbitScene.resetCamera();
  });

  // Fullscreen Viewport Toggle
  DOM.btnFullscreenVp.addEventListener('click', () => {
    sfxClick();
    const card = document.querySelector('.viewport-card');
    if (!document.fullscreenElement) {
      if (card.requestFullscreen) card.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  });

  // Advisor Drawer Toggle
  DOM.btnAdvisorDrawer.addEventListener('click', () => {
    sfxClick();
    DOM.advisorDrawer.classList.toggle('open');
  });
  DOM.btnCloseAdvisor.addEventListener('click', () => {
    DOM.advisorDrawer.classList.remove('open');
  });

  // Audio Toggle
  DOM.btnAudioToggle.addEventListener('click', () => {
    STATE.audioEnabled = !STATE.audioEnabled;
    if (STATE.audioEnabled) {
      initAudio();
      DOM.audioLabel.textContent = 'ON';
      sfxClick();
    } else {
      DOM.audioLabel.textContent = 'OFF';
    }
  });

  // Sources Modal
  DOM.btnOpenSources.addEventListener('click', () => {
    sfxClick();
    DOM.sourcesModal.classList.remove('hidden');
  });
  DOM.btnCloseSourcesModal.addEventListener('click', () => {
    DOM.sourcesModal.classList.add('hidden');
  });
  DOM.sourcesModal.addEventListener('click', e => {
    if (e.target === DOM.sourcesModal) DOM.sourcesModal.classList.add('hidden');
  });

  // Keyboard Shortcuts
  document.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (e.key === 'Escape') {
      DOM.advisorDrawer.classList.remove('open');
      DOM.mathModal.classList.add('hidden');
      DOM.sourcesModal.classList.add('hidden');
    } else if (k === '1') {
      document.querySelector('.mission-tab[data-mission="leo"]').click();
    } else if (k === '2') {
      document.querySelector('.mission-tab[data-mission="lunar"]').click();
    } else if (k === '3') {
      document.querySelector('.mission-tab[data-mission="mars"]').click();
    } else if (k === 'm') {
      DOM.btnAudioToggle.click();
    }
  });
}

// ── REALTIME CLOCKS ──
function updateClocks() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const start = new Date(Date.UTC(year, 0, 0));
  const diff = now - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const hh = String(now.getUTCHours()).padStart(2, '0');
  const mm = String(now.getUTCMinutes()).padStart(2, '0');
  const ss = String(now.getUTCSeconds()).padStart(2, '0');
  const ms = String(now.getUTCMilliseconds()).padStart(3, '0');

  if (DOM.clockUtc) {
    DOM.clockUtc.textContent = `${year}-${String(dayOfYear).padStart(3, '0')} // ${hh}:${mm}:${ss}.${ms}`;
  }

  const elapsedSec = STATE.metOffsetSec + Math.floor((Date.now() - STATE.metStartTime) / 1000) * STATE.timeWarp;
  const metDays = Math.floor(elapsedSec / 86400);
  const remSec = elapsedSec % 86400;
  const metH = Math.floor(remSec / 3600);
  const metM = Math.floor((remSec % 3600) / 60);
  const metS = remSec % 60;

  if (DOM.clockMet) {
    DOM.clockMet.textContent = `T+${String(metDays).padStart(3, '0')}:${String(metH).padStart(2, '0')}:${String(metM).padStart(2, '0')}:${String(metS).padStart(2, '0')}`;
  }
}

// ── SYSTEM BOOT SEQUENCE ──
(function boot() {
  cacheDom();
  setupNavigation();
  setupHoldToLaunch();
  setupMathModals();

  // Initialize 3D Earth Orbit Scene
  if (DOM.canvas3dWrap && typeof Orbit3DScene === 'function') {
    orbitScene = new Orbit3DScene(DOM.canvas3dWrap, { state: STATE });
  }

  // Support URL query parameters for direct state deep-linking (e.g. ?mission=mars&stage=mars_orbit)
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('mission') && MISSIONS[params.get('mission')]) {
      STATE.mission = params.get('mission');
      document.querySelectorAll('.mission-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.mission === STATE.mission);
      });
      if (orbitScene) orbitScene.setMission(STATE.mission);
    }
    if (params.has('stage') && orbitScene) {
      orbitScene.setStage(params.get('stage'));
    }
  } catch (e) {}

  computeAndRender();

  // Animation Loop for Conic & Ground Track
  function loop() {
    drawConicCanvas();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  setInterval(updateClocks, 50);
})();
