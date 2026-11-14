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

- **100% Vanilla HTML5, CSS3, ES6 JavaScript** — zero external dependencies
- **Web Audio API** — synthesized UI sounds (no audio files)
- **DocumentFragment** rendering, `requestAnimationFrame` animation
- **~66 KB total** — loads instantly on any connection

## Controls

| Key | Action |
|-----|--------|
| `1` `2` `3` | Select mission (LEO / Lunar / Mars) |
| `Q` `W` `E` `R` `T` | Switch subsystem tab |
| `M` | Toggle audio |
| `Space` | Launch (when all systems nominal) |

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
