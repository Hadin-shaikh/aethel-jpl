# AETHEL // JPL — Design Brief & Interaction Architecture

> **Document Version:** 2.0  
> **Audience:** Aerospace engineering students, systems engineers, and space enthusiasts.  
> **Tone:** Calm, precise, understated, highly useful. No sci-fi theatrics, no decorative particles on static pages.

---

## 1. Visual Hierarchy & Design Tokens

### Color System (Strict High-Contrast Palette)
- **Application Background:** `#F6F7F9` (Calm neutral off-white)
- **Card / Surface Background:** `#FFFFFF` (Pure white)
- **Container / Divider Borders:** `#E1E4E8` (1px solid crisp border)
- **Primary Text:** `#14181F` (Contrast ratio > 12:1 against surface)
- **Muted / Secondary Text:** `#5B6472` (Contrast ratio > 4.8:1 against surface, WCAG AA compliant)
- **Primary Accent:** `#0B6E99` (Muted deep blue-teal, non-neon, professional engineering tone)
- **Status - Nominal (OK):** `#1A7F4B` (Deep forest green)
- **Status - Warning:** `#B45309` (Warm amber brown)
- **Status - Danger / Blocker:** `#B42318` (Deep crimson)
- **Dark Tactical Viewport:** `#070B14` (Exclusively permitted within the 3D Earth canvas container)

*Rule: Status is never conveyed by color alone. Every status indicator must feature an accompanying text label (`OK`, `WARN`, `BLOCK`) or descriptive icon.*

### Typography & Spacing Scale
- **UI Typeface:** System clean sans (`system-ui`, `-apple-system`, `BlinkMacSystemFont`, `'Segoe UI'`, `Roboto`, `'IBM Plex Sans'`, `sans-serif`).
- **Telemetry & Numerical Typeface:** Tabular numbers monospace (`'JetBrains Mono'`, `'SFMono-Regular'`, `Consolas`, `monospace`).
- **Scale:** 4px baseline grid / 8px spacing increments (4px, 8px, 12px, 16px, 24px, 32px).
- **Corner Radii:** Standardized single 6px border-radius across cards, buttons, and inputs.
- **Borders:** Consistent 1px solid stroke (`#E1E4E8`). Zero heavy multi-stroke frames.

---

## 2. Five-View Information Architecture

The application is structured into five focused views driven by the persistent left sidebar:

1. **View 01: Mission Selection**
   - Target trajectory profiles (LEO 500 km, Lunar Relay, Mars Interplanetary).
   - Live 3D / 2D orbit preview.
   - Requirement constraints checklist (altitude, inclination, required delta-V).

2. **View 02: Launch Vehicle Selection**
   - Comparison of verified NASA LSP & vendor rockets (Falcon 9, Falcon Heavy, SLS Block 1).
   - Real capacity limits vs current spacecraft wet mass.
   - Fairing volumetric envelope checks.

3. **View 03: Payload Outfitter (Build Workspace)**
   - Five realistic subsystem categories: Power, Communications, Science Instruments, Propulsion, Spacecraft Chassis.
   - Subsystem cards with mass, power draw/generation, cost, and data throughput.
   - Live constraint calculation with spring-based equip/stow transitions.

4. **View 04: Orbital & Trajectory Analysis**
   - Interactive 3D Earth Globe powered by Three.js with real Blue Marble textures, terminator line, and RK4 satellite orbit.
   - Ground track 2D map.
   - "Show the math" disclosure drawers displaying Vis-Viva, Kepler's 3rd Law, Tsiolkovsky rocket equation, and Eclipse fraction.

5. **View 05: Stage-0 Launch Sequencer**
   - Hold-to-confirm ignition actuator.
   - Step-by-step launch timeline (Liftoff, Max-Q, Staging, Fairing jettison, Orbital insertion).
   - Physical Post-Mortem system diagnosing the exact cause of any failed mission.

---

## 3. Design Review & Diagnostic Rules Engine

The persistent Chief Advisor slide-out drawer evaluates 10 mission-critical engineering rules:
1. **Payload Mass Limit** (structural margin check)
2. **Power Generation Margin** (bus load vs solar/RTG generation)
3. **Eclipse Battery Depth-of-Discharge** (eclipse duration energy shortfall)
4. **Delta-V Capability** (Tsiolkovsky delta-V vs mission requirement)
5. **DSN Communications Link Margin** (antenna gain & frequency band compatibility)
6. **Structural Bus Allocation** (bus chassis requirement for payloads)
7. **Budget Spending Cap** (cost vs NASA project cap)
8. **Single-Point-of-Failure Redundancy** (single power/antenna source warning)
9. **Thermal Radiator Balance** (sunlit load vs dissipation area estimate)
10. **Mission Profile Fit** (RTG in LEO or solar-only in deep space)

Every finding provides:
- Severity level: `Blocker`, `Warning`, or `Info`.
- Plain-English explanation with exact numbers cited.
- One-click `Auto-Fix` button with undo capability.
