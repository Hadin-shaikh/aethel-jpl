# AETHEL // JPL — Space Mission Engineering Simulator

An interactive, browser-native spacecraft engineering simulator built for the **NASA Space Apps Challenge 2026**. Players select a mission profile (LEO Satellite, Lunar Rover, or Mars Probe), choose a launch vehicle (Falcon 9, Falcon Heavy, or SLS Block 1), and configure real subsystems across five categories — with real-time telemetry gauges enforcing mass, power, budget, and data constraints based on actual NASA/JPL specifications. An autonomous Chief Advisor teaches the *why* behind every engineering trade-off.

## How to Run

Open `index.html` in any modern browser. No server, no build step, no install required.

```
Double-click index.html
```

Or serve locally:
```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Tech Stack

- **Vanilla HTML5, CSS3, ES6 JavaScript** — zero framework bloat, fast 60 FPS performance
- **Three.js (r128)** — 3D Earth globe with Blue Marble textures, orbital inclination lines, and satellite model
- **Runge-Kutta 4th Order Astrodynamics** — numerical orbital integration
- **Design Review Diagnostic Engine** — 10 mission-critical engineering rules with one-click Auto-Fix
- **Web Audio API** — synthesized cockpit audio sounds
- **Verified Data Store** — `/data/reference.json` citing NASA LSP, JPL DSN, and SpaceX sources
- **Offline Capable** — local vendor bundles in `/assets/vendor/` and textures in `/assets/textures/`

## Five-View Architecture

1. **01 Mission:** Target Trajectory Profile (LEO Satellite, Lunar Rover, Mars Probe) with live 3D Earth view and subsystem dock.
2. **02 Vehicle:** Launch vehicle comparison (Falcon 9, Falcon Heavy, SLS Block 1) with payload capacity vs mass limits.
3. **03 Build:** Dedicated full-width Payload Outfitter workspace across Power, Comms, Instruments, Propulsion, and Chassis.
4. **04 Analyze:** In-depth astrodynamics, Keplerian orbital elements ($a, e, i, T, v$), and mathematical equations.
5. **05 Launch:** Stage-0 Launch Sequencer with 1.5s Hold-to-Confirm ignition and physical Post-Mortem failure analysis.

## Controls

| Key | Action |
|-----|--------|
| `1` `2` `3` | Select mission profile (LEO / Lunar / Mars) |
| `M` | Toggle synthesized audio |
| `Esc` | Close Advisor Drawer or formula modals |
| `Hold Launch` | Hold for 1.5 seconds to confirm ignition sequence |


## Data Sources

All specifications are derived from publicly available NASA and spaceflight data:

- [NASA Launch Services Program](https://www.nasa.gov/launch-services-program) — Vehicle performance data
- [SpaceX Falcon 9 & Heavy](https://www.spacex.com/vehicles/falcon-9/) — Payload capacity and cost
- [NASA SLS Program](https://www.nasa.gov/exploration/systems/sls/index.html) — SLS Block 1 specs
- [NASA JPL Solar System Dynamics](https://ssd.jpl.nasa.gov/) — Orbital mechanics
- [NASA Glenn NEXT-C Ion Thruster](https://www1.grc.nasa.gov/space/sep/next-c/) — Electric propulsion
- [JPL Mars MMRTG](https://mars.nasa.gov/msl/spacecraft/rover/power/) — RTG power systems
- [NASA InSight UltraFlex Arrays](https://mars.nasa.gov/insight/spacecraft/about-the-lander/) — Solar power
- [NASA Deep Space Network](https://www.jpl.nasa.gov/missions/dsn) — Communications

## AI Use Statement

Code was written with AI assistance (Antigravity / Claude) and reviewed, tested, and iterated by the author. All NASA data was verified against the public sources listed above. UI wireframe generated with v0.dev.

## Team

**Shaikh Mo. Hadin** — Team Rust Planet
NASA Space Apps Challenge 2026
