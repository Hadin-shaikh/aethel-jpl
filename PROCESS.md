# PROCESS.md — Development Log

> AETHEL // JPL — Space Mission Engineering Simulator
> NASA Space Apps Challenge 2026

---

## INFORMATION ARCHITECTURE & HIERARCHY OVERHAUL

### 1. Functional Weight Allocation (Implemented)
- **Weight 5 (Core Tasks — Full Focus):**
  - View 01 (Mission): 3 large trajectory cards + real-time orbit preview canvas.
  - View 02 (Vehicle): Booster cards with capacity comparison bars & incompatibility dimming.
  - View 03 (Build): Chassis CAD wireframe + Subsystem Outfitter with constraint validation.
  - View 05 (Launch): Verification matrix checklist + Hold-to-confirm launch sequencer.
  - Bottom persistent flow bar (`[← Back]` and `[Next: Step →]`).
- **Weight 4 (Design Feasibility — Always Visible):**
  - Persistent slim top vitals bar: Payload Mass vs limit, Net Power margin, Budget vs cap, Delta-V margin & TWR.
- **Weight 3 (Decision Guidance — View Focused):**
  - Dynamic trajectory preview in View 01.
  - Vehicle capacity vs payload mass progress tracks in View 02.
  - Component engineering specs, spring CAD highlights, and constraint failure explanations in View 03.
  - Orbit HUD with Runge-Kutta 4 (RK4) numerical integration and 8-ball Navball in View 04.
- **Weight 2 (Explanatory & Educational — On Demand):**
  - Slide-out Chief Avionics Advisor drawer badged with active warning count and one-click auto-fixes.
  - Interactive Astrodynamics Math Panel in View 04 with live KaTeX derivations (Tsiolkovsky curve, Vis-Viva speed, Kepler's 3rd period, Hohmann transfers, and Kepler's 2nd law equal-area sweep).
  - Toast notification system with Undo stack (`Ctrl+Z`).
- **Weight 1 (Ambient Telemetry — Collapsed):**
  - Collapsible compact Telemetry popover (`[📡 Telemetry ▾]`) containing MET clock, UTC reference, DSN carrier lock, EIRP, and downlink rate.
  - Keyboard shortcuts popover (`?`).
  - Purged decorative jargon: Removed fake "Cipher Secure", fake "Doppler Residual", and decorative bus strings.

### 2. Universal Button System
- Structured states across all buttons: default, hover (lift), active/pressed (scale 0.97, 80ms), focus-visible (2px ring), disabled (with explanatory tooltips), and selected.
- Hold-to-confirm launch button: 1.0s radial SVG circle fill with cancellation on mouseup/touchend.

### 3. Astrodynamics & Animation Engine
- True Runge-Kutta 4th Order (RK4) numerical integrator for orbital motion:
  $$\frac{d\vec{r}}{dt} = \vec{v}, \quad \frac{d\vec{v}}{dt} = -\frac{\mu}{r^3}\vec{r}$$
- Time-warp controls (1x, 100x, 10,000x) that scale physics timestep $\Delta t$.
- Multi-stage cinematic launch sequence: ignition, max-Q, staging, fairing separation, orbit insertion; skippable with `Esc` into the Orbit HUD.
- `prefers-reduced-motion` compliance.

### 4. Mathematical Panel
- Tsiolkovsky Rocket Equation with live mass ratio $m_0/m_f$ and interactive curve.
- Vis-Viva orbital speed calculation with live distance and semi-major axis.
- Kepler's Third Law orbital period derivation.
- Hohmann transfer 2-burn calculations ($\Delta v_1, \Delta v_2$).
- Kepler's Second Law equal-area sweep canvas demonstrating $\frac{dA}{dt} = \text{const}$.
- Power budget sum with breakdown.
- Interactive variable hover highlights (hovering variables pulses corresponding metrics in the vitals bar).
