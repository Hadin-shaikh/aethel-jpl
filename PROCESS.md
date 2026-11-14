# PROCESS.md — Development Log

> AETHEL // JPL — Space Mission Engineering Simulator
> NASA Space Apps Challenge 2026

---

## AUDIT & DE-SLOPPIFICATION (Image 1 Target Match)

### Root Causes Identified & Addressed:
1. **Shell Theme & Sidebar:**
   - *Previous:* The app had collapsed into a single, dark 100vh frame with no sidebar.
   - *Fix:* Restored the crisp, light-themed engineering workspace shell (`#F3F5F8`) with the 195px left sidebar, system console status `[DSN: ONLINE]`, 5 nav items with clean geometric SVG icons, and telemetry footer (Downlink rate, Doppler residual, Node Goldstone).
2. **Escaping Bug:**
   - *Previous:* Literal backslashes (`\$85`, `\$67M`) were appearing across budget gauges and component tags.
   - *Fix:* Built a dedicated `formatCurrency()` helper and eradicated all literal backslashes from template strings and HTML.
3. **Orbit HUD & Realtime Canvas:**
   - *Previous:* Static, blank/broken display.
   - *Fix:* Re-engineered with high-performance `requestAnimationFrame` render loop running at 60 FPS. Added concentric radar range rings, degree ticks, rotating reticle crosshair, and real-time orbiting spacecraft dot with callout tags. Integrated time-warp buttons (`1x`, `100x`, `10k x`).
4. **Navball (8-Ball Attitude Indicator):**
   - *Previous:* Missing.
   - *Fix:* Built a canvas-based 8-ball attitude indicator widget showing artificial horizon (sky vs ground), pitch ladder, and dynamic roll/pitch readouts.
5. **Mathematical Predicted Trajectory Conic:**
   - *Previous:* Incomplete or missing.
   - *Fix:* Added high-contrast conic canvas featuring glowing Earth sphere, dashed orbital transfer ellipse, Maneuver Node 01 (Injection) with burn vector arrow, and Maneuver Node 02 (Orbit Circ).
6. **Data & Telemetry Engine:**
   - *Previous:* Hardcoded/zero initial state.
   - *Fix:* Every gauge (Mass, Power, Budget, Data) strictly derived from real state. Default initial equipped set reproduces the exact target numbers from Image 1: 460 KG mass (2.0%), +165W net power, $192.0M budget (76.8%), 62.0 Mbps data throughput.
7. **Chief Avionics Educational Advisor:**
   - *Previous:* Generic or clipped.
   - *Fix:* Contextual engineering feedback: deep space power deficit warnings, LEO RTG risk advisories, Mars Umbra battery buffer alerts, and rocket capacity limits.
8. **Typography & Styling:**
   - *Fix:* De-sloppified fonts: clean system sans-serif for UI labels and headings; monospace reserved exclusively for telemetry, clocks, IDs, and terminal output.

---

## CURRENT STATUS

- Production-ready, zero-dependency static Single Page Application.
- Works 100% offline.
- Total asset weight ~70 KB.
