# PROCESS.md — Development Log

> AETHEL // JPL — Space Mission Engineering Simulator
> NASA Space Apps Challenge 2026

---

## WHAT WE BUILT

### ✅ Phase 1: Foundation & Architecture
- Initialized project with 5-file structure: `index.html`, `style.css`, `app.js`, `README.md`, `PROCESS.md`
- Zero-dependency vanilla HTML5/CSS3/ES6 architecture
- Static SPA — no backend, no build step, inherently secure

### ✅ Phase 2: Design System & Terminal-First UI
- Implemented CSS variable design tokens (void black, panel gray, cyan accent, amber warn, red alert)
- Built full cockpit layout: top HUD bar, mission/vehicle selector, telemetry gauges, dual-view workspace, subsystem outfitter, advisor console, launch sequencer
- Loading skeleton with glowing "UPLINK ESTABLISHED" text and 1.5s fade-out
- Error boundary with "REBOOT SYSTEM" crash recovery
- Hardware-accelerated CSS animations with `will-change` hints

### ✅ Phase 3: NASA Data Integration
- Hardcoded 3 launch vehicles with real NASA LSP specs (Falcon 9, Falcon Heavy, SLS Block 1)
- Defined 3 mission profiles (LEO Satellite, Lunar Rover, Mars Probe)
- Each vehicle has accurate mass capacity and cost parameters

### ✅ Phase 4: Subsystem Database & State Mutators
- Created `SUBSYSTEMS` dictionary with 5 categories: Power, Comms, Instruments, Propulsion, Chassis
- 2-3 realistic components per category (15 total), each with mass/power/cost/data specs
- DocumentFragment-based rendering — zero `.innerHTML` loops
- Click-to-toggle equip/unequip with immediate telemetry recalculation
- Global state machine tracks equipped set, active mission, vehicle selection

### ✅ Phase 5: Telemetry Engine
- 4 real-time gauges: Mass, Power, Budget, Data Throughput
- Dynamic color states: nominal (cyan), warning (amber), critical (red)
- Percentage fill bars with smooth CSS transitions
- Launch button state: disabled → no-go (red) → go (pulsing cyan)
- Mass overflow detection disables launch sequencer

### ✅ Phase 6: Educational Feedback Loop (Chief Advisor)
- Autonomous advisor engine runs on every telemetry update
- Contextual warnings based on mission/component combinations:
  - Power deficit detection with RTG/solar recommendation
  - LEO + RTG unnecessary mass warning
  - Mars + solar-only eclipse corridor advisory
  - Insufficient data throughput bandwidth alerts
  - Missing propulsion/chassis/comms advisories
  - Ion thruster power requirement warnings
- Terminal auto-scrolls to latest message
- Color-coded severity: system (gray), nominal (dim), advisory (cyan), warn (amber), critical (red)

### ✅ Phase 7: Interactive Features
- Web Audio API synthesizer (zero dependencies): clicks, thuds, bass pulses
- Toggleable via AUDIO [M] button
- Hotkey system: [1-3] missions, [Q-T] tabs, [M] mute, [Space] launch
- Chassis CAD SVG with dynamic module highlighting and leader line labels
- Orbital trajectory visualization with mission-specific paths (circular, elliptical, Hohmann)
- Spacecraft dot animation via requestAnimationFrame at 60 FPS
- Launch countdown sequence (T-10 to LIFTOFF) with full-screen overlay

### ✅ Phase 8: MET Clock & Status Bar
- Running Mission Elapsed Time clock (T+DDD:HH:MM:SS format)
- Status bar with downlink rate, active module count, ground station node

---

## CURRENTLY WORKING ON

All core systems are built and functional. Ready for:
- Final UI polish and testing
- Slide deck preparation for 7 PM presentation
- Optional: Enhanced trajectory math (Runge-Kutta propagator visualization)

---

## ARCHITECTURE DECISIONS

| Decision | Rationale |
|----------|-----------|
| Zero dependencies | Eliminates supply-chain risk, reduces load time to ~50KB |
| DocumentFragment rendering | Avoids expensive `.innerHTML` reflows — single DOM write per render |
| CSS `will-change` hints | Tells GPU to pre-composite animated elements |
| `requestAnimationFrame` | Syncs orbital animation to display refresh rate |
| Event delegation | Single listener on parent containers, not per-button |
| Hardcoded NASA data | No API calls = no latency, no failure modes, works offline |
| Global state object | Simple, debuggable, no framework overhead |

---

## JUDGING CRITERIA MAPPING

| Criterion | How We Score |
|-----------|-------------|
| **Validity** | Mathematical constraint enforcement — mass ≤ vehicle capacity, power balance, real physics |
| **Relevance** | Real NASA LSP vehicles, JPL-heritage subsystem specs, actual mission profiles |
| **Impact** | Chief Advisor teaches engineering trade-offs: why RTGs in LEO are wasteful, why ion thrusters need power |
| **Presentation** | JPL mission control aesthetic, responsive gauges, smooth 60 FPS animations, launch sequence |
