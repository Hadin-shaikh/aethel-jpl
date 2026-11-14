# PROCESS.md — Development Log

> AETHEL // JPL — Space Mission Engineering Simulator
> NASA Space Apps Challenge 2026

---

## COCKPIT HIERARCHY & SOLID WORKING SURFACES PASS

### 1. Unified Cockpit Dashboard Restored
- Reverted the multi-step pagination back to the unified, rich mission-control cockpit view (matching Target Image 1).
- All operational panels (Sidebar, Top HUD, Trajectory & Vehicle Selectors, 4 Telemetry Gauges, Primary Flight Display & Conic, Payload Outfitter, Chief Advisor Console, and Stage-0 Launch Sequencer) are simultaneously visible in one commanding flight deck.

### 2. Cockpit Visual Hierarchy ("Steering Wheel" Principle)
- **Primary Flight Display (Center Instrument):**
  - Framed as a solid avionics unit with a solid dark cockpit bezel (`border: 2px solid #0F172A`).
  - High-visibility vector lines (`#00E5FF` solid cyan), concentric radar range rings, rotating crosshair reticle, active spacecraft marker, and the 8-Ball attitude indicator (Navball).
- **Primary Telemetry Gauges (Vitals):**
  - 4 solid, high-contrast cards right in the upper line of sight (Payload Mass, Power Margin, Project Budget, Data Throughput).
  - Prominent 22px bold monospace values with solid, non-translucent progress bars and crisp status chips (`[NOMINAL]`, `[SURPLUS]`, `[FUNDED]`, `[NOMINAL LINK]`).
- **Cockpit Switches (Trajectory 01 & Launch Vehicle 02):**
  - Solid tactile buttons with rigid borders (`2px solid #0284C7`), high-contrast active states, and immediate feedback.
- **Master Launch Sequencer (Primary Actuator):**
  - Styled as the unmistakable Master Arm / Ignition switch: solid dark frame, prominent border, glowing readiness indicator, and tactile press response.
- **Payload Outfitter Dock:**
  - Solid module cards with high-contrast `[EQUIPPED]` vs `[STOWED]` indicators and clear category tabs (`PWR`, `COMM`, `INST`, `PROP`, `CHAS`).
- **Chief Avionics Advisor Console:**
  - Solid terminal box with high-contrast, color-coded engineering diagnostics (amber warnings, red criticals, green nominals).

### 3. Removal of Translucent Washouts
- Eliminated weak `rgba(...)` translucent washes.
- Applied rigid, solid, working colors with sharp contrast (`#FFFFFF`, `#F1F5F9`, `#EAEFF5`, `#0F172A`, `#1E293B`, `#070B14`).
- All panel borders are crisp, rigid 1.5px and 2px solid strokes.
