/* ═══════════════════════════════════════════════════════════════
   AETHEL // JPL — Space Mission Engineering Simulator
   Pass B: Kinetic Particle Engine, Reactive Flow Fields & Avionics
   100% Vanilla ES6 JavaScript — Single rAF Loop & Spring Physics
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
        name: 'High-Resolution Multispectral Imager',
        desc: 'TDI CCD camera with 0.3m ground resolution at 500km altitude.',
        mass: 95,
        power: -80,
        cost: 35,
        data: -25,
        svgTarget: null
      },
      {
        id: 'radar-sar',
        name: 'L-Band Synthetic Aperture Radar',
        desc: 'Interferometric radar for sub-surface planetary ice and crust mapping.',
        mass: 220,
        power: -320,
        cost: 65,
        data: -45,
        svgTarget: null
      },
      {
        id: 'spectrometer-mass',
        name: 'Neutral Gas & Ion Mass Spectrometer',
        desc: 'Quadrupole spectrometer for exosphere chemical sampling.',
        mass: 35,
        power: -40,
        cost: 20,
        data: -8,
        svgTarget: null
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
        data: 0,
        svgTarget: 'thruster'
      },
      {
        id: 'thruster-ion',
        name: 'NEXT-C Gridded Xenon Ion Engine',
        desc: 'High specific impulse (Isp: 4,100s) electro-hydrodynamic thruster.',
        mass: 140,
        power: -280,
        cost: 45,
        data: 0,
        svgTarget: 'thruster'
      },
      {
        id: 'thruster-monoprop',
        name: 'Hydrazine Monopropellant System',
        desc: 'Catalytic decomposition thruster (Isp: 230s) for orbital insertion burns.',
        mass: 90,
        power: -35,
        cost: 15,
        data: 0,
        svgTarget: 'thruster'
      }
    ]
  },
  chassis: {
    label: 'Spacecraft Bus / Chassis',
    items: [
      {
        id: 'chassis-smallsat',
        name: 'ESPA-Class SmallSat Bus',
        desc: 'Standardized secondary payload adapter ring compatible chassis.',
        mass: 150,
        power: -30,
        cost: 15,
        data: 0,
        svgTarget: null
      },
      {
        id: 'chassis-composite',
        name: 'Carbon-Composite Hexagonal Bus',
        desc: 'Ultra-lightweight truss structure with embedded heat pipes and MLI.',
        mass: 280,
        power: -50,
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
  equipped: new Set([
    'solar-ultraflex',
    'antenna-kaband',
    'imager-hires',
    'spectrometer-mass',
    'thruster-coldgas'
  ]),
  audioEnabled: false,
  motionMode: 'full', // 'full' | 'reduced' | 'off'
  activeTab: 'power',
  activeView: 'trajectory', // 'cad' | 'trajectory' | 'vehicle'
  timeWarp: 1,
  metOffsetSec: 142 * 86400 + 8 * 3600 + 24 * 60 + 19,
  metStartTime: Date.now(),
  launchReady: true,
  animationAngle: 0,
  metrics: {
    mass: 460,
    power: 165,
    cost: 192,
    data: 62
  }
};

// ── FORMAT CURRENCY HELPER ──
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
  DOM.fxCanvas = document.getElementById('fx-canvas');
  DOM.introOverlay = document.getElementById('intro-overlay');
  DOM.btnSkipIntro = document.getElementById('btn-skip-intro');

  // Clocks & Readouts
  DOM.metClock = document.getElementById('met-clock');
  DOM.utcClock = document.getElementById('utc-clock');
  DOM.hudOrbit = document.getElementById('hud-orbit');
  DOM.missionIdBadge = document.getElementById('mission-id-badge');

  // Controls & Action Buttons
  DOM.btnAudio = document.getElementById('btn-audio');
  DOM.audioState = document.getElementById('audio-state');
  DOM.btnMotionMode = document.getElementById('btn-motion-mode');
  DOM.motionState = document.getElementById('motion-state');
  DOM.btnPlayIntro = document.getElementById('btn-play-intro');
  DOM.fpsBadge = document.getElementById('fps-badge');
  DOM.fpsDot = document.getElementById('fps-dot');
  DOM.fpsVal = document.getElementById('fps-val');
  DOM.fpsMeta = document.getElementById('fps-meta');

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

  // Marquee Ribbon
  DOM.marqueeTrack = document.getElementById('marquee-track');
  DOM.marqueeContent = document.getElementById('marquee-content');
  DOM.marqueeChips = document.querySelectorAll('.marquee-chip');

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

  // Modals
  DOM.sourcesModal = document.getElementById('sources-modal');
  DOM.btnSources = document.getElementById('btn-sources');
  DOM.btnCloseSources = document.getElementById('btn-close-sources');
}

// ── NATIVE WEB AUDIO SYNTHESIS ──
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
    // Audio restriction fallback
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

// ── SECOND-ORDER SPRING PHYSICS SOLVER ──
class Spring {
  constructor({ stiffness = 180, damping = 14, mass = 1, value = 0 } = {}) {
    this.stiffness = stiffness;
    this.damping = damping;
    this.mass = mass;
    this.val = value;
    this.target = value;
    this.vel = 0;
  }
  set(target) {
    this.target = target;
  }
  update(dt = 0.016) {
    const fSpring = -this.stiffness * (this.val - this.target);
    const fDamper = -this.damping * this.vel;
    const accel = (fSpring + fDamper) / this.mass;
    this.vel += accel * dt;
    this.val += this.vel * dt;
    return this.val;
  }
}

// UI Springs for smooth gauge bar motion
const GAUGE_SPRINGS = {
  mass: new Spring({ stiffness: 140, damping: 15, value: 2.0 }),
  power: new Spring({ stiffness: 140, damping: 15, value: 50.0 }),
  budget: new Spring({ stiffness: 140, damping: 15, value: 76.8 }),
  data: new Spring({ stiffness: 140, damping: 15, value: 100.0 })
};

// ═══════════════════════════════════════════════════════════════
// PARTICLE ENGINE (PHYSICAL, REACTIVE & ORIENTED DASHES)
// ═══════════════════════════════════════════════════════════════
class ParticleField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.maxCount = 12000;
    this.minCount = 3000;
    this.activeCount = 7500;

    // Typed arrays for high-performance contiguous memory
    this.x = new Float32Array(this.maxCount);
    this.y = new Float32Array(this.maxCount);
    this.vx = new Float32Array(this.maxCount);
    this.vy = new Float32Array(this.maxCount);
    this.homeX = new Float32Array(this.maxCount);
    this.homeY = new Float32Array(this.maxCount);
    this.oldHomeX = new Float32Array(this.maxCount);
    this.oldHomeY = new Float32Array(this.maxCount);
    this.targetHomeX = new Float32Array(this.maxCount);
    this.targetHomeY = new Float32Array(this.maxCount);
    this.speed = new Float32Array(this.maxCount);
    this.dashLen = new Float32Array(this.maxCount);
    this.cosA = new Float32Array(this.maxCount);
    this.sinA = new Float32Array(this.maxCount);
    this.bucket = new Uint8Array(this.maxCount);
    this.layer = new Uint8Array(this.maxCount); // 0: background slow depth, 1: foreground flow
    this.phase = new Float32Array(this.maxCount);

    // Pre-allocated bucket lists for zero-GC single draw pass
    this.bucketLists = Array.from({ length: 8 }, () => new Int32Array(this.maxCount));
    this.bucketLengths = new Int32Array(8);

    // 8 Pre-computed color buckets (accent cyan -> solar amber -> rocket flame)
    this.bucketColors = [
      'rgba(0, 229, 255, 0.40)', // 0: Deep Cyan (flow field base)
      'rgba(56, 189, 248, 0.65)', // 1: Electric Cyan (moderate flow)
      'rgba(96, 165, 250, 0.80)', // 2: Azure Horizon (high speed)
      'rgba(255, 255, 255, 0.95)', // 3: Brilliant White (hypersonic / core)
      'rgba(253, 224, 71, 0.85)', // 4: Solar Gold (payload / energy)
      'rgba(245, 158, 11, 0.90)', // 5: Amber Flare (maneuver nodes)
      'rgba(249, 115, 22, 0.95)', // 6: Rocket Flame (combustion)
      'rgba(239, 68, 68, 0.95)'  // 7: Crimson Thrust (high energy / alarm)
    ];

    // Interaction state
    this.cursorX = -9999;
    this.cursorY = -9999;
    this.cursorActive = false;
    this.shockwaves = []; // { x, y, radius, maxRadius, strength }

    // Morphing state
    this.morphProgress = 1.0;
    this.morphStartTime = 0;
    this.morphDuration = 750; // ms

    // Simulation time & mode
    this.simTime = 0;
    this.currentShape = 'leo';
    this.motionMode = 'full'; // 'full' | 'reduced' | 'off'

    // Kepler sweep & body trail
    this.satAngle = 0;
    this.trailPoints = [];

    // Launch plume & debris state
    this.isLaunching = false;
    this.launchPhase = 0;
    this.launchTimer = 0;
    this.plumeParticles = [];
    this.debrisParticles = [];
    this.screenShake = 0;

    // Viewport scaling with dpr
    this.dpr = window.devicePixelRatio || 1;
    this.width = canvas.width;
    this.height = canvas.height;

    this.setupResizeObserver();
    this.setupInteractivity();
    this.initParticles();
    this.buildShape('leo', true);
  }

  setupResizeObserver() {
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const rect = entry.contentRect;
          if (rect.width > 0 && rect.height > 0) {
            this.resize(rect.width, rect.height);
          }
        }
      });
      ro.observe(this.canvas.parentElement || this.canvas);
    }
  }

  resize(w, h) {
    this.dpr = window.devicePixelRatio || 1;
    this.width = Math.floor(w);
    this.height = Math.floor(h);
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.ctx.scale(this.dpr, this.dpr);
    this.buildShape(this.currentShape, true);
  }

  setupInteractivity() {
    const getPos = e => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    this.canvas.addEventListener('mousemove', e => {
      const pos = getPos(e);
      this.cursorX = pos.x;
      this.cursorY = pos.y;
      this.cursorActive = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.cursorActive = false;
      this.cursorX = -9999;
      this.cursorY = -9999;
    });

    this.canvas.addEventListener('click', e => {
      const pos = getPos(e);
      this.emitShockwave(pos.x, pos.y);
      sfxClick();
    });

    // Touch support
    this.canvas.addEventListener('touchmove', e => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.cursorX = touch.clientX - rect.left;
        this.cursorY = touch.clientY - rect.top;
        this.cursorActive = true;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      this.cursorActive = false;
    });
  }

  emitShockwave(x, y, maxR = 260, strength = 1.0) {
    this.shockwaves.push({
      x,
      y,
      radius: 0,
      maxRadius: maxR,
      strength
    });
  }

  initParticles() {
    const N = this.maxCount;
    const w = this.width || 620;
    const h = this.height || 290;

    for (let i = 0; i < N; i++) {
      this.x[i] = Math.random() * w;
      this.y[i] = Math.random() * h;
      this.vx[i] = (Math.random() - 0.5) * 15;
      this.vy[i] = (Math.random() - 0.5) * 15;
      this.homeX[i] = this.x[i];
      this.homeY[i] = this.y[i];
      this.oldHomeX[i] = this.x[i];
      this.oldHomeY[i] = this.y[i];
      this.targetHomeX[i] = this.x[i];
      this.targetHomeY[i] = this.y[i];
      this.speed[i] = 1.0;
      this.dashLen[i] = 4.0;
      this.cosA[i] = 1.0;
      this.sinA[i] = 0.0;
      this.bucket[i] = 0;
      this.layer[i] = Math.random() < 0.15 ? 0 : 1; // 15% slow background parallax layer
      this.phase[i] = Math.random() * Math.PI * 2;
    }
  }

  buildShape(shapeName, immediate = false) {
    this.currentShape = shapeName;
    const w = this.width || 620;
    const h = this.height || 290;
    const cx = w / 2;
    const cy = h / 2;
    const N = this.maxCount;

    if (!immediate) {
      for (let i = 0; i < N; i++) {
        this.oldHomeX[i] = this.homeX[i];
        this.oldHomeY[i] = this.homeY[i];
      }
      this.morphProgress = 0.0;
      this.morphStartTime = performance.now();
    }

    if (shapeName === 'leo') {
      // ── LEO SATELLITE: Circular Orbit Ring + Altitude Shells + Earth Core ──
      for (let i = 0; i < N; i++) {
        const u = i / N;
        if (u < 0.65) {
          // Primary Orbit Ring (500 km)
          const angle = (u / 0.65) * Math.PI * 2;
          const r = 85 + (Math.random() - 0.5) * 8;
          this.targetHomeX[i] = cx + Math.cos(angle) * r;
          this.targetHomeY[i] = cy + Math.sin(angle) * r;
        } else if (u < 0.85) {
          // Central Earth Core Sphere
          const r = Math.sqrt(Math.random()) * 26;
          const angle = Math.random() * Math.PI * 2;
          this.targetHomeX[i] = cx + Math.cos(angle) * r;
          this.targetHomeY[i] = cy + Math.sin(angle) * r;
        } else {
          // Outer Altitude Shells (GEO & DSN Links)
          const shellR = Math.random() < 0.5 ? 122 : 148;
          const angle = Math.random() * Math.PI * 2;
          this.targetHomeX[i] = cx + Math.cos(angle) * (shellR + (Math.random() - 0.5) * 6);
          this.targetHomeY[i] = cy + Math.sin(angle) * (shellR + (Math.random() - 0.5) * 6);
        }
      }
    } else if (shapeName === 'lunar') {
      // ── LUNAR ROVER: Earth-Moon Trans-Lunar Injection (TLI) Conic Arc ──
      const earthX = cx - 170;
      const earthY = cy;
      const moonX = cx + 180;
      const moonY = cy;

      for (let i = 0; i < N; i++) {
        const u = i / N;
        if (u < 0.20) {
          // Earth Sphere
          const r = Math.sqrt(Math.random()) * 24;
          const angle = Math.random() * Math.PI * 2;
          this.targetHomeX[i] = earthX + Math.cos(angle) * r;
          this.targetHomeY[i] = earthY + Math.sin(angle) * r;
        } else if (u < 0.30) {
          // Moon Sphere
          const r = Math.sqrt(Math.random()) * 14;
          const angle = Math.random() * Math.PI * 2;
          this.targetHomeX[i] = moonX + Math.cos(angle) * r;
          this.targetHomeY[i] = moonY + Math.sin(angle) * r;
        } else {
          // TLI Free-Return Transfer Arc (Bézier Trajectory)
          const t = (u - 0.30) / 0.70;
          const p0x = earthX + 15, p0y = earthY - 20;
          const p1x = cx - 40, p1y = cy - 85;
          const p2x = cx + 60, p2y = cy - 70;
          const p3x = moonX - 10, p3y = moonY - 15;

          const omt = 1 - t;
          const bx = omt*omt*omt*p0x + 3*omt*omt*t*p1x + 3*omt*t*t*p2x + t*t*t*p3x;
          const by = omt*omt*omt*p0y + 3*omt*omt*t*p1y + 3*omt*t*t*p2y + t*t*t*p3y;
          const jitter = (Math.random() - 0.5) * 14;
          this.targetHomeX[i] = bx + jitter * 0.4;
          this.targetHomeY[i] = by + jitter;
        }
      }
    } else if (shapeName === 'mars') {
      // ── MARS PROBE: Interplanetary Hohmann Transfer Semi-Ellipse ──
      const sunX = cx - 80;
      const sunY = cy;

      for (let i = 0; i < N; i++) {
        const u = i / N;
        if (u < 0.15) {
          // Central Sun Flare
          const r = Math.sqrt(Math.random()) * 18;
          const angle = Math.random() * Math.PI * 2;
          this.targetHomeX[i] = sunX + Math.cos(angle) * r;
          this.targetHomeY[i] = sunY + Math.sin(angle) * r;
        } else if (u < 0.35) {
          // Earth 1 AU Orbit Arc
          const angle = (u - 0.15) / 0.20 * Math.PI * 1.5 - Math.PI * 0.5;
          const r = 62 + (Math.random() - 0.5) * 5;
          this.targetHomeX[i] = sunX + Math.cos(angle) * r;
          this.targetHomeY[i] = sunY + Math.sin(angle) * r;
        } else if (u < 0.55) {
          // Mars 1.52 AU Orbit Arc
          const angle = (u - 0.35) / 0.20 * Math.PI * 1.5 - Math.PI * 0.5;
          const r = 185 + (Math.random() - 0.5) * 6;
          this.targetHomeX[i] = sunX + Math.cos(angle) * r;
          this.targetHomeY[i] = sunY + Math.sin(angle) * r;
        } else {
          // Hohmann Semi-Elliptical Transfer Conic
          const t = (u - 0.55) / 0.45;
          const angle = -Math.PI * 0.5 + t * Math.PI;
          const a = 124; // semi-major
          const b = 88;  // semi-minor
          const ex = sunX + Math.cos(angle) * a + 40;
          const ey = sunY + Math.sin(angle) * b;
          const jitter = (Math.random() - 0.5) * 12;
          this.targetHomeX[i] = ex + jitter * 0.5;
          this.targetHomeY[i] = ey + jitter;
        }
      }
    } else if (shapeName === 'vehicle') {
      // ── VEHICLE VIEW: Rocket Silhouette with Dynamic Payload Mass Column ──
      const vehicle = VEHICLES[STATE.vehicle] || VEHICLES.falcon9;
      const heightScale = STATE.vehicle === 'sls' ? 1.25 : (STATE.vehicle === 'falconheavy' ? 1.1 : 1.0);
      const totalH = 200 * heightScale;
      const botY = cy + totalH * 0.45;
      const topY = cy - totalH * 0.45;
      const coreW = STATE.vehicle === 'falconheavy' ? 70 : 28;

      const payloadRatio = Math.min(1.0, STATE.metrics.mass / vehicle.mass);
      const fairingTop = topY;
      const fairingBot = topY + 45;
      const fillHeight = (fairingBot - fairingTop) * payloadRatio;

      for (let i = 0; i < N; i++) {
        const u = i / N;
        if (u < 0.30) {
          // Payload Bay Dynamic Particle Fill (Solar Gold Column)
          const fillY = fairingBot - Math.random() * fillHeight;
          const span = 16 * (1 - (fairingBot - fillY) / 50);
          this.targetHomeX[i] = cx + (Math.random() - 0.5) * span;
          this.targetHomeY[i] = fillY;
        } else if (u < 0.60) {
          // Booster Structural Shell
          const y = fairingBot + Math.random() * (botY - fairingBot);
          const edge = Math.random() < 0.5 ? -coreW / 2 : coreW / 2;
          this.targetHomeX[i] = cx + edge + (Math.random() - 0.5) * 4;
          this.targetHomeY[i] = y;
        } else if (u < 0.85) {
          // Booster Internal Grid & Stringers
          const y = fairingBot + Math.random() * (botY - fairingBot);
          this.targetHomeX[i] = cx + (Math.random() - 0.5) * coreW;
          this.targetHomeY[i] = y;
        } else {
          // Engine Bells & Landing Legs Base
          const legSide = Math.random() < 0.5 ? -1 : 1;
          const legT = Math.random();
          this.targetHomeX[i] = cx + legSide * (coreW / 2 + legT * 28);
          this.targetHomeY[i] = botY - (1 - legT) * 35;
        }
      }
    }

    if (immediate) {
      for (let i = 0; i < N; i++) {
        this.homeX[i] = this.targetHomeX[i];
        this.homeY[i] = this.targetHomeY[i];
        this.x[i] = this.homeX[i];
        this.y[i] = this.homeY[i];
      }
    }
  }

  update(dt) {
    if (this.motionMode === 'off') return;

    const N = this.activeCount;
    this.simTime += dt;

    // Handle Eased Morphing
    if (this.morphProgress < 1.0) {
      const elapsed = performance.now() - this.morphStartTime;
      this.morphProgress = Math.min(1.0, elapsed / this.morphDuration);
      const t = this.morphProgress;
      const ease = 1 - Math.pow(1 - t, 3); // Cubic ease out
      for (let i = 0; i < N; i++) {
        this.homeX[i] = this.oldHomeX[i] + (this.targetHomeX[i] - this.oldHomeX[i]) * ease;
        this.homeY[i] = this.oldHomeY[i] + (this.targetHomeY[i] - this.oldHomeY[i]) * ease;
      }
    }

    // Reduced motion freeze
    if (this.motionMode === 'reduced') {
      for (let i = 0; i < N; i++) {
        this.x[i] = this.homeX[i];
        this.y[i] = this.homeY[i];
        this.vx[i] = 0;
        this.vy[i] = 0;
        this.speed[i] = 1.0;
        this.dashLen[i] = 4.0;
        this.cosA[i] = 1.0;
        this.sinA[i] = 0.0;
        this.bucket[i] = 0;
      }
      return;
    }

    // Full Kinetic Flow Integration
    const time = this.simTime * 0.75;
    const k1 = 0.008;
    const k2 = 0.016;
    const springK = 65.0;
    const damping = 4.5;
    const curlStrength = 34.0;

    const cx = this.cursorX;
    const cy = this.cursorY;
    const cursorActive = this.cursorActive;
    const shockwaves = this.shockwaves;

    // Advance shockwaves
    for (let s = shockwaves.length - 1; s >= 0; s--) {
      const sw = shockwaves[s];
      sw.radius += 380 * dt;
      sw.strength *= (1 - 1.8 * dt);
      if (sw.radius > sw.maxRadius || sw.strength < 0.02) {
        shockwaves.splice(s, 1);
      }
    }

    // Main particle physics loop
    for (let i = 0; i < N; i++) {
      const px = this.x[i];
      const py = this.y[i];
      let vx = this.vx[i];
      let vy = this.vy[i];
      const hx = this.homeX[i];
      const hy = this.homeY[i];
      const layer = this.layer[i];

      // Analytical Divergence-Free Curl Noise
      const arg1x = k1 * px + time;
      const arg1y = k1 * py + time;
      const arg2x = k2 * px - 1.2 * time;
      const arg2y = k2 * py + 0.9 * time;

      const curlX = -k1 * Math.sin(arg1x) * Math.sin(arg1y) - 0.5 * k2 * Math.sin(arg2x) * Math.sin(arg2y);
      const curlY = -k1 * Math.cos(arg1x) * Math.cos(arg1y) - 0.5 * k2 * Math.cos(arg2x) * Math.cos(arg2y);

      const layerMult = layer === 0 ? 0.35 : 1.0;

      // Spring force tethered to structural home
      const fxSpring = -springK * (px - hx);
      const fySpring = -springK * (py - hy);

      let ax = fxSpring - damping * vx + curlX * curlStrength * layerMult;
      let ay = fySpring - damping * vy + curlY * curlStrength * layerMult;

      // Cursor Swirl & Push
      if (cursorActive) {
        const dx = px - cx;
        const dy = py - cy;
        const distSq = dx * dx + dy * dy;
        if (distSq < 14400) { // 120px radius
          const dist = Math.sqrt(distSq) + 0.001;
          const w = (1 - dist / 120);
          const w2 = w * w;
          ax += (dx / dist) * 260 * w2;
          ay += (dy / dist) * 260 * w2;
          ax += (-dy / dist) * 190 * w2;
          ay += (dx / dist) * 190 * w2;
        }
      }

      // Radial Shockwave Kick
      for (let s = 0; s < shockwaves.length; s++) {
        const sw = shockwaves[s];
        const dx = px - sw.x;
        const dy = py - sw.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const diff = Math.abs(dist - sw.radius);
        if (diff < 35) {
          const swPulse = (1 - diff / 35) * sw.strength * 480;
          ax += (dx / dist) * swPulse;
          ay += (dy / dist) * swPulse;
        }
      }

      vx += ax * dt;
      vy += ay * dt;

      const spdSq = vx * vx + vy * vy;
      const maxSpd = 360;
      if (spdSq > maxSpd * maxSpd) {
        const s = maxSpd / Math.sqrt(spdSq);
        vx *= s;
        vy *= s;
      }

      this.vx[i] = vx;
      this.vy[i] = vy;
      this.x[i] = px + vx * dt;
      this.y[i] = py + vy * dt;

      const spd = Math.sqrt(spdSq);
      this.speed[i] = spd;
      const len = Math.max(3.0, Math.min(8.5, 3.2 + spd * 0.025));
      this.dashLen[i] = len;

      if (spd > 0.001) {
        this.cosA[i] = vx / spd;
        this.sinA[i] = vy / spd;
      } else {
        this.cosA[i] = 1.0;
        this.sinA[i] = 0.0;
      }

      // Color bucket assignment
      let b = 0;
      if (layer === 0) {
        b = 0;
      } else if (spd < 35) {
        b = 0;
      } else if (spd < 75) {
        b = 1;
      } else if (spd < 130) {
        b = 2;
      } else if (spd < 190) {
        b = 3;
      } else if (spd < 250) {
        b = 4;
      } else if (spd < 310) {
        b = 5;
      } else {
        b = 6;
      }
      this.bucket[i] = b;
    }

    // Satellite body trail & Kepler wedge tracking
    this.satAngle += dt * 0.9;
    if (this.currentShape === 'leo' || this.currentShape === 'mars') {
      const rx = this.currentShape === 'leo' ? 85 : 140;
      const ry = this.currentShape === 'leo' ? 85 : 55;
      const sx = (this.width / 2) + Math.cos(this.satAngle) * rx;
      const sy = (this.height / 2) + Math.sin(this.satAngle) * ry;
      this.trailPoints.push({ x: sx, y: sy, age: 0 });
      if (this.trailPoints.length > 50) this.trailPoints.shift();
      for (let p = 0; p < this.trailPoints.length; p++) {
        this.trailPoints[p].age += dt * 1.5;
      }
    }

    // Launch plume & debris update
    if (this.isLaunching) {
      this.updateLaunchPhysics(dt);
    }
  }

  triggerLaunchSequence() {
    this.isLaunching = true;
    this.launchPhase = 1;
    this.launchTimer = 0;
    this.screenShake = 14;
    this.plumeParticles = [];
    this.debrisParticles = [];
  }

  updateLaunchPhysics(dt) {
    this.launchTimer += dt;
    const w = this.width || 620;
    const h = this.height || 290;
    const cx = w / 2;
    const cy = h / 2 + 50;

    // Emit Engine Plume from Nozzle
    for (let p = 0; p < 18; p++) {
      const angle = (Math.random() - 0.5) * 0.45 + Math.PI * 0.5;
      const v = 380 + Math.random() * 320;
      this.plumeParticles.push({
        x: cx + (Math.random() - 0.5) * 14,
        y: cy,
        vx: Math.cos(angle) * v * 0.35,
        vy: Math.sin(angle) * v,
        age: 0,
        maxAge: 0.8 + Math.random() * 0.6,
        size: 2 + Math.random() * 4
      });
    }

    // Max-Q Transonic Vapor Ring at 3.0s
    if (this.launchTimer > 3.0 && this.launchPhase === 1) {
      this.launchPhase = 2;
      this.emitShockwave(cx, cy - 60, 320, 1.8);
    }

    // Stage Separation Debris at 5.0s
    if (this.launchTimer > 5.0 && this.launchPhase === 2) {
      this.launchPhase = 3;
      for (let d = 0; d < 40; d++) {
        this.debrisParticles.push({
          x: cx + (Math.random() - 0.5) * 20,
          y: cy - 20,
          vx: (Math.random() - 0.5) * 180,
          vy: 80 + Math.random() * 140,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 8,
          len: 4 + Math.random() * 8,
          age: 0,
          maxAge: 3.0
        });
      }
    }

    // Update Plume Particles
    for (let i = this.plumeParticles.length - 1; i >= 0; i--) {
      const p = this.plumeParticles[i];
      p.age += dt;
      if (p.age >= p.maxAge) {
        this.plumeParticles.splice(i, 1);
        continue;
      }
      p.vx *= (1 - 1.2 * dt); // Drag
      p.vy *= (1 - 0.9 * dt);
      p.vy -= 120 * dt;       // Buoyancy upward drift
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size += dt * 10;
    }

    // Update Debris Particles
    for (let i = this.debrisParticles.length - 1; i >= 0; i--) {
      const d = this.debrisParticles[i];
      d.age += dt;
      if (d.age >= d.maxAge) {
        this.debrisParticles.splice(i, 1);
        continue;
      }
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.rot += d.vrot * dt;
    }

    // Orbital insertion bloom at 7.5s
    if (this.launchTimer > 7.5 && this.isLaunching) {
      this.isLaunching = false;
      this.emitShockwave(cx, cy, 380, 2.0);
      this.buildShape('leo');
    }
  }

  draw() {
    if (this.motionMode === 'off') return;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const N = this.activeCount;

    ctx.save();

    // Procedural screen shake
    if (this.screenShake > 0.1) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
      this.screenShake *= 0.94;
    }

    // Solid dark tactical HUD background
    ctx.fillStyle = '#070B14';
    ctx.fillRect(0, 0, w, h);

    // Tactical Radar Crosshairs
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // 1. Kepler Swept Wedge (Analyze View)
    if (this.currentShape === 'leo' && this.trailPoints.length > 2) {
      const cx = w / 2;
      const cy = h / 2;
      const last = this.trailPoints[this.trailPoints.length - 1];
      const prev = this.trailPoints[Math.max(0, this.trailPoints.length - 14)];

      ctx.save();
      ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(prev.x, prev.y);
      ctx.lineTo(last.x, last.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 229, 255, 0.65)';
      ctx.font = "8.5px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillText('KEPLER II: EQUAL AREA SWEEP', (cx + last.x) / 2, (cy + last.y) / 2 - 6);
      ctx.restore();
    }

    // 2. Fading Satellite Trail
    if (this.trailPoints.length > 1) {
      ctx.save();
      ctx.lineWidth = 2.0;
      for (let p = 1; p < this.trailPoints.length; p++) {
        const p1 = this.trailPoints[p - 1];
        const p2 = this.trailPoints[p];
        const alpha = Math.max(0, 1 - p2.age);
        if (alpha <= 0) continue;
        ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.75})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      const head = this.trailPoints[this.trailPoints.length - 1];
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(head.x, head.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 6 + Math.sin(this.simTime * 8) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Reset Bucket Lengths
    for (let b = 0; b < 8; b++) {
      this.bucketLengths[b] = 0;
    }

    // Populate Buckets
    for (let i = 0; i < N; i++) {
      const b = this.bucket[i];
      const len = this.bucketLengths[b];
      this.bucketLists[b][len] = i;
      this.bucketLengths[b] = len + 1;
    }

    // 4. BATCHED DRAW PASS: 8 Stroke Calls for 10,000+ Dashes
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    for (let b = 0; b < 8; b++) {
      const count = this.bucketLengths[b];
      if (count === 0) continue;

      ctx.strokeStyle = this.bucketColors[b];
      ctx.beginPath();

      const list = this.bucketLists[b];
      for (let j = 0; j < count; j++) {
        const idx = list[j];
        const px = this.x[idx];
        const py = this.y[idx];
        const halfL = this.dashLen[idx] * 0.5;
        const dx = halfL * this.cosA[idx];
        const dy = halfL * this.sinA[idx];

        ctx.moveTo(px - dx, py - dy);
        ctx.lineTo(px + dx, py + dy);
      }
      ctx.stroke();
    }

    // 5. Engine Plume & Debris Rendering
    if (this.isLaunching) {
      this.drawLaunchFX(ctx);
    }

    ctx.restore();
  }

  drawLaunchFX(ctx) {
    // Engine Plume with thermal cooling gradient
    for (let i = 0; i < this.plumeParticles.length; i++) {
      const p = this.plumeParticles[i];
      const prog = p.age / p.maxAge;
      let col = '#FFFFFF';
      if (prog > 0.7) col = 'rgba(71, 85, 105, 0.4)';
      else if (prog > 0.45) col = 'rgba(220, 38, 38, 0.8)';
      else if (prog > 0.2) col = 'rgba(249, 115, 22, 0.9)';
      else col = 'rgba(253, 224, 71, 0.95)';

      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tumbling Stage Separation Debris
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.8;
    for (let i = 0; i < this.debrisParticles.length; i++) {
      const d = this.debrisParticles[i];
      const cos = Math.cos(d.rot) * d.len * 0.5;
      const sin = Math.sin(d.rot) * d.len * 0.5;
      ctx.beginPath();
      ctx.moveTo(d.x - cos, d.y - sin);
      ctx.lineTo(d.x + cos, d.y + sin);
      ctx.stroke();
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL FX ENGINE (CROSS-PANEL PARTICLE STREAMS & 6S INTRO)
// ═══════════════════════════════════════════════════════════════
class FxEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.streams = [];
    this.alerts = [];
    this.introActive = false;
    this.introTimer = 0;
    this.introParticles = [];
    this.onIntroComplete = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  streamCardToChassis(sourceEl, targetX, targetY) {
    if (STATE.motionMode === 'off') return;
    const rect = sourceEl.getBoundingClientRect();
    const sx = rect.left + rect.width / 2;
    const sy = rect.top + rect.height / 2;

    const count = STATE.motionMode === 'reduced' ? 15 : 60;
    for (let i = 0; i < count; i++) {
      this.streams.push({
        p0x: sx,
        p0y: sy,
        p1x: sx + (targetX - sx) * 0.3 + (Math.random() - 0.5) * 80,
        p1y: sy - 120 + (Math.random() - 0.5) * 60,
        p2x: sx + (targetX - sx) * 0.7 + (Math.random() - 0.5) * 80,
        p2y: targetY - 60 + (Math.random() - 0.5) * 60,
        p3x: targetX,
        p3y: targetY,
        t: -Math.random() * 0.25,
        speed: 1.4 + Math.random() * 0.6,
        color: Math.random() < 0.2 ? '#FFFFFF' : '#00E5FF',
        size: 2.0 + Math.random() * 2.5
      });
    }
  }

  alertConstraintViolation(gaugeEl) {
    if (STATE.motionMode === 'off') return;
    const rect = gaugeEl.getBoundingClientRect();
    const gx = rect.left + rect.width / 2;
    const gy = rect.top + rect.height / 2;

    gaugeEl.classList.add('spring-shake');
    setTimeout(() => gaugeEl.classList.remove('spring-shake'), 460);

    const count = STATE.motionMode === 'reduced' ? 20 : 70;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 120 + Math.random() * 280;
      this.alerts.push({
        x: gx,
        y: gy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        age: 0,
        maxAge: 0.5 + Math.random() * 0.4
      });
    }
  }

  playIntro(onComplete) {
    this.introActive = true;
    this.introTimer = 0;
    this.onIntroComplete = onComplete;
    this.introParticles = [];

    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    // 4,000 Cosmic Dash Particles for Intro Assembly
    for (let i = 0; i < 4000; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 80 + Math.random() * 600;
      this.introParticles.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: 0,
        vy: 0,
        homeX: cx + (Math.random() - 0.5) * 360,
        homeY: cy + (Math.random() - 0.5) * 120,
        targetAngle: angle,
        targetR: 160 + (Math.random() - 0.5) * 30
      });
    }
  }

  skipIntro() {
    if (!this.introActive) return;
    this.introActive = false;
    if (this.onIntroComplete) this.onIntroComplete();
  }

  updateAndDraw(dt) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Active Module Stream Particles
    for (let i = this.streams.length - 1; i >= 0; i--) {
      const s = this.streams[i];
      s.t += s.speed * dt;
      if (s.t >= 1.0) {
        this.streams.splice(i, 1);
        continue;
      }
      if (s.t < 0) continue;

      const t = s.t;
      const omt = 1 - t;
      const x = omt*omt*omt*s.p0x + 3*omt*omt*t*s.p1x + 3*omt*t*t*s.p2x + t*t*t*s.p3x;
      const y = omt*omt*omt*s.p0y + 3*omt*omt*t*s.p1y + 3*omt*t*t*s.p2y + t*t*t*s.p3y;

      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Draw Constraint Alerts (Red Alarm Sparks)
    for (let i = this.alerts.length - 1; i >= 0; i--) {
      const a = this.alerts[i];
      a.age += dt;
      if (a.age >= a.maxAge) {
        this.alerts.splice(i, 1);
        continue;
      }
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      const alpha = 1 - a.age / a.maxAge;
      ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
      ctx.fillRect(a.x - 2, a.y - 2, 4, 4);
    }

    // 3. Draw 6s Kinetic Intro Assembly
    if (this.introActive) {
      this.introTimer += dt;
      const cx = w / 2;
      const cy = h / 2;

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#00E5FF';
      ctx.beginPath();

      for (let i = 0; i < this.introParticles.length; i++) {
        const p = this.introParticles[i];
        if (this.introTimer < 3.0) {
          // Flock into central AETHEL logo geometry
          p.x += (p.homeX - p.x) * dt * 2.5;
          p.y += (p.homeY - p.y) * dt * 2.5;
        } else if (this.introTimer < 5.0) {
          // Sweep into orbital trajectory ring
          const tx = cx + Math.cos(p.targetAngle + this.introTimer * 1.5) * p.targetR;
          const ty = cy + Math.sin(p.targetAngle + this.introTimer * 1.5) * p.targetR * 0.45;
          p.x += (tx - p.x) * dt * 4.0;
          p.y += (ty - p.y) * dt * 4.0;
        } else {
          // Bloom outward revealing app
          p.x += (p.x - cx) * dt * 3.5;
          p.y += (p.y - cy) * dt * 3.5;
        }

        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + 4, p.y);
      }
      ctx.stroke();

      if (this.introTimer > 6.0) {
        this.skipIntro();
      }
    }
  }
}

// ── GLOBAL ENGINE INSTANCES ──
let particleEngine = null;
let fxEngine = null;

// ── TELEMETRY & STATE MUTATION ENGINE ──
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

function computeMetrics() {
  const vehicle = VEHICLES[STATE.vehicle] || VEHICLES.falcon9;
  const mission = MISSIONS[STATE.mission] || MISSIONS.leo;
  const equipped = getEquippedItems();

  let totalMass = 0;
  let totalPower = 0;
  let totalCost = vehicle.cost;
  let totalData = 0;

  for (const item of equipped) {
    totalMass += item.mass;
    totalPower += item.power;
    totalCost += item.cost;
    totalData += item.data;
  }

  const budgetCap = 250;
  const massValid = totalMass <= vehicle.mass;
  const powerValid = totalPower >= 0;
  const budgetValid = totalCost <= budgetCap;
  const dataValid = totalData >= mission.targetData;
  const isNominal = massValid && powerValid && budgetValid && dataValid;

  STATE.metrics = {
    mass: totalMass,
    power: totalPower,
    cost: totalCost,
    data: totalData
  };

  return {
    mass: totalMass,
    maxMass: vehicle.mass,
    massValid,
    massPct: Math.min(100, (totalMass / vehicle.mass) * 100),
    power: totalPower,
    powerValid,
    cost: totalCost,
    budgetCap,
    budgetValid,
    budgetPct: Math.min(100, (totalCost / budgetCap) * 100),
    data: totalData,
    targetData: mission.targetData,
    dataValid,
    isNominal,
    vehicle,
    mission,
    equippedCount: equipped.length
  };
}

function updateTelemetry() {
  const m = computeMetrics();

  // Top Selector Status Labels
  if (DOM.trajectoryReq) DOM.trajectoryReq.textContent = m.mission.reqText;
  if (DOM.vehicleCapLabel) {
    DOM.vehicleCapLabel.textContent = `CAP: ${m.vehicle.mass.toLocaleString()} KG // BASE: $${m.vehicle.cost}M`;
  }
  if (DOM.missionIdBadge) DOM.missionIdBadge.textContent = m.mission.code;

  // Mass Metric Card
  if (DOM.massVal) DOM.massVal.textContent = m.mass.toLocaleString();
  if (DOM.massPct) DOM.massPct.textContent = `${m.massPct.toFixed(1)}%`;
  if (DOM.massMaxText) DOM.massMaxText.textContent = `MAX: ${m.maxMass.toLocaleString()} KG`;
  if (DOM.massMargin) DOM.massMargin.textContent = `${(100 - m.massPct).toFixed(1)}%`;

  GAUGE_SPRINGS.mass.set(m.massPct);
  if (DOM.massStatus) {
    if (m.massValid) {
      DOM.massStatus.className = 'metric-chip nominal';
      DOM.massStatus.textContent = '[NOMINAL]';
      DOM.gaugeMass.classList.remove('alert');
    } else {
      DOM.massStatus.className = 'metric-chip alert';
      DOM.massStatus.textContent = '[OVERWEIGHT]';
      DOM.gaugeMass.classList.add('alert');
    }
  }

  // Power Metric Card
  if (DOM.powerVal) {
    DOM.powerVal.textContent = (m.power >= 0 ? '+' : '') + m.power;
  }
  if (DOM.powerPct) {
    DOM.powerPct.textContent = (m.power >= 0 ? '+' : '') + m.power + ' W';
  }
  GAUGE_SPRINGS.power.set(m.power >= 0 ? 50 + Math.min(50, m.power / 10) : Math.max(0, 50 + m.power / 10));
  if (DOM.powerStatus) {
    if (m.power > 0) {
      DOM.powerStatus.className = 'metric-chip surplus';
      DOM.powerStatus.textContent = '[SURPLUS]';
      DOM.gaugePower.classList.remove('alert');
    } else if (m.power === 0) {
      DOM.powerStatus.className = 'metric-chip nominal';
      DOM.powerStatus.textContent = '[BALANCED]';
      DOM.gaugePower.classList.remove('alert');
    } else {
      DOM.powerStatus.className = 'metric-chip alert';
      DOM.powerStatus.textContent = '[DEFICIT]';
      DOM.gaugePower.classList.add('alert');
    }
  }

  // Budget Metric Card
  if (DOM.budgetVal) DOM.budgetVal.textContent = formatCurrency(m.cost);
  if (DOM.budgetPct) DOM.budgetPct.textContent = `${m.budgetPct.toFixed(1)}%`;
  if (DOM.budgetReserve) DOM.budgetReserve.textContent = formatCurrency(Math.max(0, m.budgetCap - m.cost));

  GAUGE_SPRINGS.budget.set(m.budgetPct);
  if (DOM.budgetStatus) {
    if (m.budgetValid) {
      DOM.budgetStatus.className = 'metric-chip nominal';
      DOM.budgetStatus.textContent = '[FUNDED]';
      DOM.gaugeBudget.classList.remove('alert');
    } else {
      DOM.budgetStatus.className = 'metric-chip alert';
      DOM.budgetStatus.textContent = '[DEFICIT]';
      DOM.gaugeBudget.classList.add('alert');
    }
  }

  // Data Throughput Card
  if (DOM.dataVal) DOM.dataVal.textContent = m.data.toFixed(1);
  if (DOM.dataTargetText) DOM.dataTargetText.textContent = `TGT: ${m.targetData}M`;

  const dataFillPct = Math.min(100, (m.data / m.targetData) * 100);
  GAUGE_SPRINGS.data.set(dataFillPct);
  if (DOM.dataStatus) {
    if (m.dataValid) {
      DOM.dataStatus.className = 'metric-chip nominal';
      DOM.dataStatus.textContent = '[NOMINAL LINK]';
      DOM.gaugeData.classList.remove('alert');
    } else {
      DOM.dataStatus.className = 'metric-chip alert';
      DOM.dataStatus.textContent = '[LINK MARGIN LOW]';
      DOM.gaugeData.classList.add('alert');
    }
  }

  // HUD Main Titles
  if (DOM.hudMainTitle) DOM.hudMainTitle.textContent = `${m.mission.name.toUpperCase()} ORBITAL INSERTION HUD`;
  if (DOM.hudMetaText) {
    DOM.hudMetaText.textContent = `CONIC: ${m.mission.code} | TOF: ${m.mission.periodMin} min | dV_REQ: ${m.mission.dvReq} m/s`;
  }
  if (DOM.overTarget) DOM.overTarget.textContent = m.mission.name.toUpperCase();
  if (DOM.overPeri) DOM.overPeri.textContent = m.mission.periapsis;
  if (DOM.overVel) DOM.overVel.textContent = m.mission.targetVel;

  if (DOM.trajDv) DOM.trajDv.textContent = `${m.mission.dvReq} m/s`;
  if (DOM.trajTwr) DOM.trajTwr.textContent = (1.4 + Math.random() * 0.1).toFixed(2);
  if (DOM.trajPeriod) DOM.trajPeriod.textContent = `${m.mission.periodMin} min`;
  if (DOM.trajTargetLabel) DOM.trajTargetLabel.textContent = m.mission.vector;

  // Outfitter Counts
  if (DOM.equippedCount) DOM.equippedCount.textContent = `${m.equippedCount} EQUIPPED`;
  if (DOM.footerModulesCount) DOM.footerModulesCount.textContent = `${m.equippedCount} MODULES EQUIPPED`;

  // Master Launch Sequencer Readiness
  STATE.launchReady = m.isNominal;
  if (DOM.btnLaunch) {
    DOM.btnLaunch.disabled = !m.isNominal;
    if (m.isNominal) {
      DOM.btnLaunch.classList.add('nominal');
      if (DOM.launchSubStatus) DOM.launchSubStatus.textContent = 'ALL SYSTEMS GO // CLICK TO LAUNCH';
    } else {
      DOM.btnLaunch.classList.remove('nominal');
      if (DOM.launchSubStatus) {
        if (!m.massValid) DOM.launchSubStatus.textContent = 'ABORT: PAYLOAD MASS EXCEEDED';
        else if (!m.powerValid) DOM.launchSubStatus.textContent = 'ABORT: CRITICAL POWER DEFICIT';
        else if (!m.budgetValid) DOM.launchSubStatus.textContent = 'ABORT: PROJECT BUDGET BREACH';
        else DOM.launchSubStatus.textContent = 'ABORT: DSN DATA LINK MARGIN DEFICIT';
      }
    }
  }

  // Synchronize Particle Field with Active View and State
  if (particleEngine) {
    if (STATE.activeView === 'vehicle') {
      particleEngine.buildShape('vehicle');
    } else {
      particleEngine.buildShape(STATE.mission);
    }
  }

  runAutonomousAdvisor(m);
}

// ── CHIEF AUTONOMOUS AVIONICS ADVISOR CONSOLE ──
function runAutonomousAdvisor(m) {
  if (!DOM.advisorLog) return;
  DOM.advisorLog.innerHTML = '';

  const messages = [];

  // Directive 1: Mass Check
  if (m.massValid) {
    messages.push({
      type: 'nominal',
      text: `> ✓ MASS MARGIN NOMINAL: ${m.mass} kg within ${m.vehicle.name} limit (${m.maxMass.toLocaleString()} kg). Structural margin: ${(100 - m.massPct).toFixed(1)}%.`
    });
  } else {
    messages.push({
      type: 'critical',
      text: `> ⚠ MASS BREACH: ${m.mass} kg exceeds ${m.vehicle.name} limit by ${(m.mass - m.maxMass).toLocaleString()} kg. Switch to Heavy launcher or jettison modules.`
    });
  }

  // Directive 2: Power Check
  if (m.power > 0) {
    messages.push({
      type: 'nominal',
      text: `> ✓ POWER POSITIVE: Net surplus of +${m.power} W. Battery trickle charge active. Eclipse survival window open.`
    });
  } else if (m.power === 0) {
    messages.push({
      type: 'warning',
      text: `> ⚡ POWER BALANCED: Net margin is 0 W. Zero reserve buffer for attitude maneuvers or telemetry bursts.`
    });
  } else {
    messages.push({
      type: 'critical',
      text: `> ⚡ POWER DEFICIT: Bus draw exceeds generation by ${Math.abs(m.power)} W. Spacecraft will suffer brownout within 1 orbit.`
    });
  }

  // Directive 3: Budget Check
  if (m.budgetValid) {
    messages.push({
      type: 'nominal',
      text: `> ✓ BUDGET APPROVED: Project cost ${formatCurrency(m.cost)} within ${formatCurrency(m.budgetCap)} NASA cap. Reserve: ${formatCurrency(m.budgetCap - m.cost)}.`
    });
  } else {
    messages.push({
      type: 'critical',
      text: `> ⚠ FISCAL BREACH: Mission cost exceeds authorized NASA spending cap by ${formatCurrency(m.cost - m.budgetCap)}.`
    });
  }

  // Directive 4: Data Check
  if (m.dataValid) {
    messages.push({
      type: 'nominal',
      text: `> ✓ DSN DATA LINK: Throughput ${m.data.toFixed(1)} Mbps satisfies ${m.mission.name} science requirements (≥ ${m.targetData} Mbps).`
    });
  } else {
    messages.push({
      type: 'warning',
      text: `> 📡 DATA DEFICIT: Throughput ${m.data.toFixed(1)} Mbps is below required ${m.targetData} Mbps downlink threshold.`
    });
  }

  // Master Readiness Assessment
  if (m.isNominal) {
    messages.push({
      type: 'nominal',
      text: `> ◈ FLIGHT READINESS REVIEW: ALL SYSTEMS NOMINAL. Ready for Stage-0 terminal countdown.`
    });
  } else {
    messages.push({
      type: 'critical',
      text: `> ✖ LAUNCH INHIBIT ACTIVE: Resolve critical flight safety violations above prior to ignition.`
    });
  }

  // Inject into Advisor Console
  const frag = document.createDocumentFragment();
  for (const item of messages) {
    const row = document.createElement('div');
    row.className = `adv-msg ${item.type}`;
    row.textContent = item.text;
    frag.appendChild(row);
  }
  DOM.advisorLog.appendChild(frag);
  DOM.advisorLog.scrollTop = DOM.advisorLog.scrollHeight;
}

// ── RENDER SUBSYSTEM OUTFITTER PANEL ──
function renderSubsystems(category) {
  if (!DOM.outfitter) return;
  DOM.outfitter.innerHTML = '';

  const catData = SUBSYSTEMS[category];
  if (!catData) return;

  const frag = document.createDocumentFragment();

  for (const item of catData.items) {
    const isEquipped = STATE.equipped.has(item.id);

    const card = document.createElement('div');
    card.className = `module-card ${isEquipped ? 'equipped' : ''}`;
    card.dataset.id = item.id;

    card.innerHTML = `
      <div class="module-header">
        <div class="module-title">${item.name}</div>
        <div class="module-badge ${isEquipped ? 'badge-equipped' : 'badge-stowed'}">
          ${isEquipped ? '[EQUIPPED]' : '[STOWED]'}
        </div>
      </div>
      <div class="module-desc">${item.desc}</div>
      <div class="module-stats">
        <span class="stat-pill">+${item.mass} KG</span>
        <span class="stat-pill">${item.power >= 0 ? '+' : ''}${item.power}W GEN</span>
        <span class="stat-pill">${formatCurrency(item.cost)}</span>
        ${item.data !== 0 ? `<span class="stat-pill">${item.data > 0 ? '+' : ''}${item.data} Mbps</span>` : ''}
      </div>
    `;

    card.addEventListener('click', () => {
      toggleComponent(item.id, card);
    });

    frag.appendChild(card);
  }

  DOM.outfitter.appendChild(frag);
}

// ── COMPONENT TOGGLE WITH PHYSICAL PARTICLE STREAMS ──
function toggleComponent(itemId, cardEl) {
  const willEquip = !STATE.equipped.has(itemId);

  if (willEquip) {
    STATE.equipped.add(itemId);
    sfxEquip();

    // Stream particles from outfitter card across the screen to HUD
    if (fxEngine && DOM.orbitCanvas) {
      const hudRect = DOM.orbitCanvas.getBoundingClientRect();
      fxEngine.streamCardToChassis(cardEl, hudRect.left + hudRect.width / 2, hudRect.top + hudRect.height / 2);
    }
  } else {
    STATE.equipped.delete(itemId);
    sfxUnequip();
  }

  // Recalculate metrics
  updateTelemetry();
  renderSubsystems(STATE.activeTab);
  updateChassisSvgHighlights();

  // If a violation occurred, send red alarm particles to offending vital
  const m = computeMetrics();
  if (fxEngine) {
    if (!m.massValid && DOM.gaugeMass) fxEngine.alertConstraintViolation(DOM.gaugeMass);
    if (!m.powerValid && DOM.gaugePower) fxEngine.alertConstraintViolation(DOM.gaugePower);
    if (!m.budgetValid && DOM.gaugeBudget) fxEngine.alertConstraintViolation(DOM.gaugeBudget);
  }
}

// ── SVG CHASSIS SCHEMATIC ACTIVE MODULE HIGHLIGHTS ──
function updateChassisSvgHighlights() {
  const solarL = document.getElementById('svg-solar-l');
  const solarR = document.getElementById('svg-solar-r');
  const antenna = document.getElementById('svg-antenna');
  const thruster = document.getElementById('svg-thruster');

  const hasSolar = STATE.equipped.has('solar-ultraflex');
  const hasAntenna = STATE.equipped.has('antenna-kaband') || STATE.equipped.has('antenna-xband');
  const hasThruster = STATE.equipped.has('thruster-coldgas') || STATE.equipped.has('thruster-ion') || STATE.equipped.has('thruster-monoprop');

  if (solarL) solarL.style.opacity = hasSolar ? '1' : '0.2';
  if (solarR) solarR.style.opacity = hasSolar ? '1' : '0.2';
  if (antenna) antenna.style.opacity = hasAntenna ? '1' : '0.2';
  if (thruster) thruster.style.opacity = hasThruster ? '1' : '0.2';
}

// ── 8-BALL NAVBALL ATTITUDE INDICATOR ──
function drawNavball() {
  const canvas = DOM.navballCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const r = w / 2;

  ctx.clearRect(0, 0, w, h);

  const time = performance.now() * 0.001;
  const pitchAngle = Math.sin(time * 0.6) * 12.4;
  const rollAngle = Math.cos(time * 0.4) * 4.0;

  ctx.save();
  ctx.beginPath();
  ctx.arc(r, r, r - 2, 0, Math.PI * 2);
  ctx.clip();

  ctx.translate(r, r);
  ctx.rotate((rollAngle * Math.PI) / 180);

  const pitchOffset = (pitchAngle / 90) * (r * 0.7);

  // Blue Sky Hemisphere
  ctx.fillStyle = '#0284C7';
  ctx.fillRect(-r * 2, -r * 2 + pitchOffset, r * 4, r * 2);

  // Dark Ground Hemisphere
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(-r * 2, pitchOffset, r * 4, r * 2);

  // Artificial Horizon
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r, pitchOffset);
  ctx.lineTo(r, pitchOffset);
  ctx.stroke();

  // Pitch Ladder Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1;
  [-20, -10, 10, 20].forEach(deg => {
    const y = pitchOffset - (deg / 90) * (r * 0.7);
    ctx.beginPath();
    ctx.moveTo(-10, y);
    ctx.lineTo(10, y);
    ctx.stroke();
  });

  ctx.restore();

  // Outer Sphere Rim
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(r, r, r - 1.5, 0, Math.PI * 2);
  ctx.stroke();

  if (DOM.navballReadout) {
    DOM.navballReadout.textContent = `PITCH: ${pitchAngle >= 0 ? '+' : ''}${pitchAngle.toFixed(1)}° | ROLL: ${rollAngle >= 0 ? '+' : ''}${rollAngle.toFixed(1)}°`;
  }
}

// ── MATHEMATICAL CONIC TRAJECTORY PREDICTOR ──
function drawConicTrajectory() {
  const canvas = DOM.conicCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Tactical Grid Lines
  ctx.strokeStyle = 'rgba(2, 132, 199, 0.12)';
  ctx.lineWidth = 0.8;
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // Central Earth Body (left side)
  const earthX = 85;
  const earthY = h / 2;
  const earthR = 22;

  const glow = ctx.createRadialGradient(earthX, earthY, earthR, earthX, earthY, earthR + 14);
  glow.addColorStop(0, 'rgba(2, 132, 199, 0.4)');
  glow.addColorStop(1, 'rgba(2, 132, 199, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(earthX, earthY, earthR + 14, 0, Math.PI * 2);
  ctx.fill();

  const earthGrad = ctx.createRadialGradient(earthX - 5, earthY - 5, 2, earthX, earthY, earthR);
  earthGrad.addColorStop(0, '#60A5FA');
  earthGrad.addColorStop(0.7, '#2563EB');
  earthGrad.addColorStop(1, '#0F172A');
  ctx.fillStyle = earthGrad;
  ctx.beginPath();
  ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = "8px 'JetBrains Mono', monospace";
  ctx.textAlign = 'center';
  ctx.fillText('EARTH', earthX, earthY + 3);

  // Conic Elliptical Orbital Path
  ctx.save();
  ctx.strokeStyle = '#0284C7';
  ctx.lineWidth = 1.5;
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
  ctx.textAlign = 'left';
  ctx.fillText('NODE 02: ORBIT CIRC', node2X + 8, node2Y + 4);

  // Dynamic Animated Satellite Marker
  STATE.animationAngle += 0.015 * STATE.timeWarp;
  const satX = 260 + Math.cos(STATE.animationAngle) * 175;
  const satY = earthY + Math.sin(STATE.animationAngle) * 48;

  ctx.fillStyle = '#0284C7';
  ctx.beginPath();
  ctx.arc(satX, satY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(satX, satY, 8, 0, Math.PI * 2);
  ctx.stroke();
}

// ── MARQUEE DRIFT & OSCILLATION ENGINE ──
let marqueeOffset = 0;
function updateMarquee(dt) {
  if (!DOM.marqueeContent) return;
  marqueeOffset += dt * 25;
  const y = Math.sin(performance.now() * 0.002) * 2.5;
  DOM.marqueeContent.style.transform = `translate3d(${- (marqueeOffset % 180)}px, ${y}px, 0)`;
}

// ── EXECUTE STAGE-0 MASTER LAUNCH SEQUENCE ──
function executeLaunch() {
  if (!STATE.launchReady) {
    sfxError();
    return;
  }

  sfxClick();
  DOM.launchOverlay.classList.remove('hidden');

  let count = 10;
  DOM.countdownText.textContent = 'T-' + count;
  DOM.launchTargetDesc.textContent = 'TERMINAL COUNTDOWN INITIATED // ENGINES ARMED';

  const mission = MISSIONS[STATE.mission];
  const vehicle = VEHICLES[STATE.vehicle];

  const timer = setInterval(() => {
    count--;

    const pct = ((10 - Math.max(0, count)) / 10) * 100;
    DOM.launchProgressFill.style.width = pct + '%';

    if (count > 0) {
      DOM.countdownText.textContent = 'T-' + count;
      playTone(1200, 0.05, 'sine', 0.04);
    } else if (count === 0) {
      DOM.countdownText.textContent = 'LIFTOFF';
      DOM.countdownText.style.color = '#F59E0B';
      sfxLaunch();

      // Trigger High-Velocity Engine Plume & Debris on Particle Engine
      if (particleEngine) {
        particleEngine.triggerLaunchSequence();
      }
    } else if (count === -2) {
      DOM.countdownText.textContent = 'MAX-Q TRANSONIC';
      DOM.countdownText.style.color = '#00E5FF';
      DOM.launchTargetDesc.textContent = 'VAPOR CONE DETECTED // VEHICLE PASSING SOUND BARRIER';
    } else if (count === -4) {
      DOM.countdownText.textContent = 'STAGE SEPARATION';
      DOM.countdownText.style.color = '#38BDF8';
      DOM.launchTargetDesc.textContent = 'FIRST STAGE MECO // VACUUM MERLIN IGNITION';
    } else if (count === -6) {
      DOM.countdownText.textContent = 'ORBITAL INSERTION';
      DOM.countdownText.style.color = '#10B981';
      DOM.launchTargetDesc.textContent = 'TRANSTAGE TRAJECTORY NOMINAL // DSN LOCK CONFIRMED';
    } else if (count < -7) {
      clearInterval(timer);
      DOM.launchOverlay.classList.add('hidden');
      DOM.countdownText.style.color = '';

      const row = document.createElement('div');
      row.className = 'adv-msg nominal';
      row.textContent = `> ✓ MISSION DEPLOYMENT SUCCESS: ${mission.name} inserted into ${mission.periapsis} orbit via ${vehicle.name}. Telemetry nominal.`;
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

  // HUD View Switcher Tabs (Chassis CAD / Orbit Trajectory / Vehicle Silhouette)
  document.querySelectorAll('.view-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfxClick();
      document.querySelectorAll('.view-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.activeView = btn.dataset.view;

      // Handle CAD vs Particle Canvas display
      const viewCad = document.getElementById('view-cad');
      const viewTraj = document.getElementById('view-trajectory');

      if (STATE.activeView === 'cad') {
        if (viewCad) viewCad.classList.add('active');
        if (viewTraj) viewTraj.classList.remove('active');
      } else {
        if (viewCad) viewCad.classList.remove('active');
        if (viewTraj) viewTraj.classList.add('active');

        if (particleEngine) {
          if (STATE.activeView === 'vehicle') {
            particleEngine.buildShape('vehicle');
          } else {
            particleEngine.buildShape(STATE.mission);
          }
        }
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

  // Motion Mode Toggle: Full -> Reduced -> Off
  if (DOM.btnMotionMode) {
    DOM.btnMotionMode.addEventListener('click', () => {
      sfxClick();
      if (STATE.motionMode === 'full') {
        STATE.motionMode = 'reduced';
      } else if (STATE.motionMode === 'reduced') {
        STATE.motionMode = 'off';
      } else {
        STATE.motionMode = 'full';
      }
      DOM.motionState.textContent = STATE.motionMode.toUpperCase();
      if (particleEngine) particleEngine.motionMode = STATE.motionMode;
    });
  }

  // Play / Replay 6s Intro
  if (DOM.btnPlayIntro) {
    DOM.btnPlayIntro.addEventListener('click', () => {
      sfxClick();
      if (fxEngine && DOM.introOverlay) {
        DOM.introOverlay.classList.remove('hidden', 'fade-out');
        fxEngine.playIntro(() => {
          DOM.introOverlay.classList.add('fade-out');
          setTimeout(() => DOM.introOverlay.classList.add('hidden'), 600);
        });
      }
    });
  }

  // Skip Intro Button
  if (DOM.btnSkipIntro) {
    DOM.btnSkipIntro.addEventListener('click', () => {
      if (fxEngine) fxEngine.skipIntro();
    });
  }

  // Subsystem Marquee Chips Rapid Selection
  DOM.marqueeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      sfxClick();
      const cat = chip.dataset.cat;
      const targetTab = document.querySelector(`.out-tab[data-cat="${cat}"]`);
      if (targetTab) targetTab.click();

      // Smooth scroll to outfitter card
      const outfitterCard = document.getElementById('outfitter-card');
      if (outfitterCard) {
        outfitterCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        outfitterCard.classList.add('spring-shake');
        setTimeout(() => outfitterCard.classList.remove('spring-shake'), 450);
      }
    });
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

  // Keyboard Shortcuts
  document.addEventListener('keyup', e => {
    const key = e.key.toLowerCase();

    if (e.key === 'Escape') {
      if (fxEngine) fxEngine.skipIntro();
      if (DOM.sourcesModal) DOM.sourcesModal.classList.add('hidden');
    }

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

    if (key === 'm') {
      DOM.btnAudio.click();
    }

    if (key === ' ') {
      e.preventDefault();
      executeLaunch();
    }
  });
}

// ── REALTIME CLOCKS ──
function updateClocks() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const start = new Date(Date.UTC(year, 0, 0));
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const hh = String(now.getUTCHours()).padStart(2, '0');
  const mm = String(now.getUTCMinutes()).padStart(2, '0');
  const ss = String(now.getUTCSeconds()).padStart(2, '0');
  const ms = String(now.getUTCMilliseconds()).padStart(3, '0');

  if (DOM.utcClock) {
    DOM.utcClock.textContent = `${year}-${String(dayOfYear).padStart(3, '0')} // ${hh}:${mm}:${ss}.${ms}`;
  }

  const elapsedSec = STATE.metOffsetSec + Math.floor((Date.now() - STATE.metStartTime) / 1000) * STATE.timeWarp;
  const metDays = Math.floor(elapsedSec / 86400);
  const remSec = elapsedSec % 86400;
  const metH = Math.floor(remSec / 3600);
  const metM = Math.floor((remSec % 3600) / 60);
  const metS = remSec % 60;

  if (DOM.metClock) {
    DOM.metClock.textContent = `T+${String(metDays).padStart(3, '0')}:${String(metH).padStart(2, '0')}:${String(metM).padStart(2, '0')}:${String(metS).padStart(2, '0')}`;
  }
}

// ── UNIFIED 60 FPS RENDER & PERFORMANCE TELEMETRY LOOP ──
let lastLoopTime = performance.now();
const frameHistory = [];

function renderLoop(now) {
  const dt = Math.min(0.05, (now - lastLoopTime) * 0.001);
  const frameDeltaMs = now - lastLoopTime;
  lastLoopTime = now;

  // Track FPS and frame time
  frameHistory.push(frameDeltaMs);
  if (frameHistory.length > 30) frameHistory.shift();

  let sum = 0;
  for (let i = 0; i < frameHistory.length; i++) sum += frameHistory[i];
  const avgDelta = sum / frameHistory.length;
  const fps = Math.min(60.0, 1000 / Math.max(1, avgDelta));

  // Auto-throttle particle engine for 60 FPS guarantee
  if (particleEngine) {
    if (avgDelta > 16.6 && particleEngine.activeCount > particleEngine.minCount) {
      particleEngine.activeCount = Math.max(particleEngine.minCount, particleEngine.activeCount - 250);
    } else if (avgDelta < 13.0 && particleEngine.activeCount < particleEngine.maxCount) {
      particleEngine.activeCount = Math.min(particleEngine.maxCount, particleEngine.activeCount + 100);
    }
  }

  // Update Telemetry FPS Badge
  if (DOM.fpsVal && DOM.fpsMeta) {
    DOM.fpsVal.textContent = `${fps.toFixed(1)} FPS`;
    const pCount = particleEngine ? `${(particleEngine.activeCount / 1000).toFixed(1)}k P` : '';
    DOM.fpsMeta.textContent = `| ${avgDelta.toFixed(1)}ms | ${pCount}`;
    if (DOM.fpsDot) {
      DOM.fpsDot.className = fps >= 55 ? 'fps-dot' : (fps >= 40 ? 'fps-dot warn' : 'fps-dot alert');
    }
  }

  // 1. Update Gauge Spring Physics (Smooth bounce & settle)
  if (DOM.massFill) DOM.massFill.style.width = `${Math.min(100, Math.max(0, GAUGE_SPRINGS.mass.update(dt)))}%`;
  if (DOM.powerFill) DOM.powerFill.style.width = `${Math.min(100, Math.max(0, GAUGE_SPRINGS.power.update(dt)))}%`;
  if (DOM.budgetFill) DOM.budgetFill.style.width = `${Math.min(100, Math.max(0, GAUGE_SPRINGS.budget.update(dt)))}%`;
  if (DOM.dataFill) DOM.dataFill.style.width = `${Math.min(100, Math.max(0, GAUGE_SPRINGS.data.update(dt)))}%`;

  // 2. Update Kinetic Particle Engine
  if (particleEngine) {
    particleEngine.update(dt);
    particleEngine.draw();
  }

  // 3. Update Global Screen-Wide FX Engine
  if (fxEngine) {
    fxEngine.updateAndDraw(dt);
  }

  // 4. Update Navball & Trajectory Conic
  drawNavball();
  drawConicTrajectory();

  // 5. Update Marquee Ribbon Drift
  updateMarquee(dt);

  requestAnimationFrame(renderLoop);
}

// ── SYSTEM BOOT SEQUENCE ──
(function boot() {
  cacheDom();

  // Respect system prefers-reduced-motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    STATE.motionMode = 'reduced';
    if (DOM.motionState) DOM.motionState.textContent = 'REDUCED';
  }

  // Initialize Particle Engine on Tactical HUD canvas
  if (DOM.orbitCanvas) {
    particleEngine = new ParticleField(DOM.orbitCanvas);
    particleEngine.motionMode = STATE.motionMode;
  }

  // Initialize Screen-Wide FX Engine
  if (DOM.fxCanvas) {
    fxEngine = new FxEngine(DOM.fxCanvas);
  }

  bindEvents();
  renderSubsystems('power');
  updateTelemetry();
  updateChassisSvgHighlights();

  // Handle Tab Visibility to Save Battery & GPU
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (particleEngine) particleEngine.motionMode = 'off';
    } else {
      if (particleEngine) particleEngine.motionMode = STATE.motionMode;
    }
  });

  // Fade out loader & Reveal Cockpit
  setTimeout(() => {
    if (DOM.loader) DOM.loader.classList.add('fade-out');

    setTimeout(() => {
      if (DOM.loader) DOM.loader.classList.add('hidden');
      if (DOM.app) DOM.app.classList.remove('hidden');

      // Staggered arrival animation across cockpit panels
      const panels = [
        document.getElementById('sidebar'),
        document.querySelector('.hud-header'),
        document.getElementById('sub-header'),
        document.getElementById('selector-section'),
        document.getElementById('telemetry-grid'),
        document.getElementById('subsystem-marquee-strip'),
        document.getElementById('middle-section'),
        document.getElementById('bottom-section')
      ];

      panels.forEach((p, idx) => {
        if (p) {
          p.classList.add('stagger-item');
          p.style.animationDelay = `${idx * 45}ms`;
        }
      });

      // Start 60 FPS Render Loop & Clocks
      requestAnimationFrame(renderLoop);
      setInterval(updateClocks, 50);

      // Play 6s Kinetic Particle Intro on First Load
      if (fxEngine && DOM.introOverlay) {
        DOM.introOverlay.classList.remove('hidden');
        fxEngine.playIntro(() => {
          DOM.introOverlay.classList.add('fade-out');
          setTimeout(() => DOM.introOverlay.classList.add('hidden'), 600);
        });
      }
    }, 400);
  }, 1000);
})();
