/* ═══════════════════════════════════════════════════════════════
   AETHEL // JPL — Design Review Diagnostic Engine
   Pure functions evaluating 10 mission-critical engineering rules
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/**
 * Evaluates all 10 engineering diagnostic rules against current design state.
 * @param {Object} state Simulator state (equipped, mission, vehicle, metrics, subsystems, referenceData)
 * @returns {Array<Object>} List of rule findings sorted by blocker -> warning -> info
 */
function evaluateDesignRules(state, subsystemsDb, vehicleSpecs, missionSpecs, refData) {
  const findings = [];
  const equipped = Array.from(state.equipped);
  const vehicle = vehicleSpecs[state.vehicle] || vehicleSpecs.falcon9;
  const mission = missionSpecs[state.mission] || missionSpecs.leo;

  // Aggregate equipped items
  const items = [];
  let totalMass = 0;
  let totalGen = 0;
  let totalLoad = 0;
  let totalCost = vehicle.cost;
  let totalData = 0;
  let batteryWh = 0;
  let hasChassis = false;
  let hasPropulsion = false;
  let propIsp = 0;
  let propFuelMass = 0;
  let powerSourcesCount = 0;
  let antennaCount = 0;
  let hasRtg = false;
  let hasSolar = false;

  for (const catKey of Object.keys(subsystemsDb)) {
    const cat = subsystemsDb[catKey];
    for (const it of cat.items) {
      if (state.equipped.has(it.id)) {
        items.push(it);
        totalMass += it.mass;
        totalCost += it.cost;
        totalData += it.data;

        if (it.power > 0) {
          totalGen += it.power;
          powerSourcesCount++;
          if (it.id.includes('rtg')) hasRtg = true;
          if (it.id.includes('solar')) hasSolar = true;
        } else if (it.power < 0) {
          totalLoad += Math.abs(it.power);
        }

        if (it.id === 'battery-liion') batteryWh += 480; // 40 Ah * 12V = 480 Wh nominal
        if (catKey === 'chassis') hasChassis = true;
        if (catKey === 'comms') antennaCount++;
        if (catKey === 'propulsion') {
          hasPropulsion = true;
          if (it.id === 'thruster-coldgas') { propIsp = 70; propFuelMass = 25; }
          else if (it.id === 'thruster-ion') { propIsp = 4100; propFuelMass = 60; }
          else if (it.id === 'thruster-monoprop') { propIsp = 230; propFuelMass = 55; }
        }
      }
    }
  }

  const netPower = totalGen - totalLoad;
  const budgetCap = 250;

  // ─────────────────────────────────────────────────────────────
  // RULE 1: PAYLOAD MASS (Over Vehicle Capacity)
  // ─────────────────────────────────────────────────────────────
  const maxMass = vehicle.mass;
  if (totalMass > maxMass) {
    const overweightKg = totalMass - maxMass;
    const sortedByMass = [...items].sort((a, b) => b.mass - a.mass);
    const heaviest = sortedByMass[0];

    findings.push({
      id: 'rule-mass-overweight',
      severity: 'blocker',
      title: 'Payload Mass Exceeds Launcher Capacity',
      what_is_wrong: `Total spacecraft mass is ${totalMass.toLocaleString()} kg, which exceeds ${vehicle.name} limit (${maxMass.toLocaleString()} kg) by ${overweightKg.toLocaleString()} kg.`,
      likely_cause: `Heavy instrument or propulsion payloads selected without a Heavy-lift booster.`,
      why_it_matters: `The launch vehicle will not achieve orbital velocity; flight computer will trigger thrust-to-weight abort.`,
      fix: `Upgrade to Falcon Heavy or SLS Block 1, or remove '${heaviest.name}' to save ${heaviest.mass} kg.`,
      data_used: `Mass: ${totalMass} kg, Cap: ${maxMass} kg, Delta: +${overweightKg} kg`,
      autoFix: {
        label: state.vehicle === 'falcon9' ? 'Upgrade to Falcon Heavy' : `Jettison ${heaviest.name}`,
        action: () => {
          if (state.vehicle === 'falcon9') {
            state.vehicle = 'falconheavy';
          } else {
            state.equipped.delete(heaviest.id);
          }
        }
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // RULE 2: POWER GENERATION MARGIN (Load Exceeds Generation)
  // ─────────────────────────────────────────────────────────────
  if (netPower < 0) {
    const deficitW = Math.abs(netPower);
    const loads = items.filter(it => it.power < 0).sort((a, b) => a.power - b.power);
    const biggestLoad = loads[0];

    findings.push({
      id: 'rule-power-deficit',
      severity: 'blocker',
      title: 'Critical Bus Power Deficit',
      what_is_wrong: `Electrical power draw (${totalLoad} W) exceeds generation (${totalGen} W) by ${deficitW} W.`,
      likely_cause: `High-draw instruments (SAR Radar, Transceiver) active without sufficient solar or RTG generation.`,
      why_it_matters: `Spacecraft bus voltage will drop below survival threshold within one orbit, causing permanent bus brownout.`,
      fix: `Equip UltraFlex Solar Wings or Plutonium RTG, or stow ${biggestLoad ? biggestLoad.name : 'loads'}.`,
      data_used: `Gen: ${totalGen} W, Load: ${totalLoad} W, Deficit: -${deficitW} W`,
      autoFix: {
        label: 'Equip UltraFlex Solar Wings (+450W)',
        action: () => {
          state.equipped.add('solar-ultraflex');
        }
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // RULE 3: ECLIPSE BATTERY DEPTH-OF-DISCHARGE (500 km LEO)
  // ─────────────────────────────────────────────────────────────
  if (state.mission === 'leo') {
    // Eclipse fraction: (1/pi)*asin(R/(R+h)) = (1/pi)*asin(6378.137 / 6878.137) ~ 37.8%
    const eclipseMin = 35.8; // minutes
    const eclipseHours = eclipseMin / 60;
    const requiredWh = totalLoad * eclipseHours;
    const maxUsableDodWh = batteryWh * 0.8; // 80% maximum DoD for spaceflight Li-Ion

    if (maxUsableDodWh < requiredWh && totalLoad > 0) {
      const missingWh = Math.round(requiredWh - maxUsableDodWh);
      findings.push({
        id: 'rule-eclipse-battery',
        severity: 'blocker',
        title: 'Battery Buffer Insufficient for Eclipse Window',
        what_is_wrong: `Spacecraft enters a ${eclipseMin} min Earth shadow each 94.6 min orbit. Required energy is ${Math.round(requiredWh)} Wh, but battery buffer provides ${Math.round(maxUsableDodWh)} Wh (at 80% DoD).`,
        likely_cause: `Li-Ion battery pack missing or undersized for current instrument loads.`,
        why_it_matters: `Power generation drops to 0 W in Earth shadow. Spacecraft will deplete bus voltage and freeze during eclipse.`,
        fix: `Equip Li-Ion Battery Buffer (40 Ah) or NextGen RTG (unaffected by eclipse). Shortfall: ${missingWh} Wh.`,
        data_used: `Eclipse: ${eclipseMin} min, Energy Req: ${Math.round(requiredWh)} Wh, Buffer: ${Math.round(maxUsableDodWh)} Wh`,
        autoFix: {
          label: 'Equip Li-Ion Battery Buffer',
          action: () => {
            state.equipped.add('battery-liion');
          }
        }
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RULE 4: DELTA-V CAPABILITY (Tsiolkovsky Shortfall)
  // ─────────────────────────────────────────────────────────────
  const g0 = 9.80665;
  const dryMass = Math.max(10, totalMass - propFuelMass);
  let availableDv = 0;
  if (hasPropulsion && propFuelMass > 0 && dryMass > 0) {
    availableDv = Math.round(propIsp * g0 * Math.log(totalMass / dryMass));
  }
  const reqDv = mission.dvReq || 150;

  if (availableDv < reqDv) {
    const shortfallDv = reqDv - availableDv;
    findings.push({
      id: 'rule-deltav-shortfall',
      severity: 'blocker',
      title: 'Propulsion Delta-V Below Mission Insertion Requirement',
      what_is_wrong: `Delivered delta-V from Tsiolkovsky equation is ${availableDv} m/s, which is below the ${reqDv} m/s requirement for ${mission.name}.`,
      likely_cause: `No propulsion stage equipped or specific impulse (Isp) is too low for trajectory insertion burn.`,
      why_it_matters: `Spacecraft cannot circularize at target periapsis and will fall back into atmospheric re-entry or remain stranded.`,
      fix: `Equip NEXT-C Ion Thruster (Isp: 4,100s) or Hydrazine Monopropellant stage. Delta-V deficit: ${shortfallDv} m/s.`,
      data_used: `Available: ${availableDv} m/s, Req: ${reqDv} m/s, Deficit: -${shortfallDv} m/s`,
      autoFix: {
        label: 'Equip Hydrazine Monopropellant System',
        action: () => {
          state.equipped.delete('thruster-coldgas');
          state.equipped.add('thruster-monoprop');
        }
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // RULE 5: DSN COMMUNICATIONS LINK MARGIN
  // ─────────────────────────────────────────────────────────────
  if (antennaCount === 0) {
    findings.push({
      id: 'rule-comms-missing',
      severity: 'blocker',
      title: 'No Communications Transceiver Equipped',
      what_is_wrong: `Zero antennas equipped on spacecraft bus.`,
      likely_cause: `Comms category left unconfigured during outfitting.`,
      why_it_matters: `Spacecraft will reach orbit but remain completely silent. Zero science data or command telemetry possible.`,
      fix: `Equip Ka-Band High-Gain Antenna (DSN 34m/70m compatible) or X-Band Dish.`,
      data_used: `Antennas: 0, Downlink: 0.0 Mbps, Target: ${mission.targetData} Mbps`,
      autoFix: {
        label: 'Equip Ka-Band High-Gain Antenna',
        action: () => {
          state.equipped.add('antenna-kaband');
        }
      }
    });
  } else if (totalData < mission.targetData) {
    const dataDeficit = (mission.targetData - totalData).toFixed(1);
    findings.push({
      id: 'rule-comms-bandwidth',
      severity: 'warning',
      title: 'DSN Data Throughput Deficit for Mission Profile',
      what_is_wrong: `Equipped throughput (${totalData.toFixed(1)} Mbps) does not satisfy ${mission.name} target (${mission.targetData} Mbps).`,
      likely_cause: `Low-gain omni antenna equipped or high-rate imaging instruments generating data backlog.`,
      why_it_matters: `Instrument buffers will overflow; science data downlinks will face multi-day latency backlogs.`,
      fix: `Upgrade to Ka-Band High-Gain Antenna (+80 Mbps) to meet science requirements.`,
      data_used: `Data: ${totalData.toFixed(1)} Mbps, Req: ${mission.targetData} Mbps, Deficit: -${dataDeficit} Mbps`,
      autoFix: {
        label: 'Upgrade to Ka-Band Antenna (+80 Mbps)',
        action: () => {
          state.equipped.delete('antenna-sband');
          state.equipped.add('antenna-kaband');
        }
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // RULE 6: STRUCTURAL CHASSIS BUS REQUIREMENT
  // ─────────────────────────────────────────────────────────────
  if (!hasChassis) {
    findings.push({
      id: 'rule-bus-missing',
      severity: 'blocker',
      title: 'No Spacecraft Bus Chassis Equipped',
      what_is_wrong: `Spacecraft components lack a structural chassis bus frame.`,
      likely_cause: `Chassis category left unpopulated.`,
      why_it_matters: `Subsystems cannot be physically mounted, wired to MIL-STD-1553B data bus, or survived acoustic launch loads.`,
      fix: `Equip Carbon-Composite Hexagonal Bus or ESPA-Class SmallSat Bus.`,
      data_used: `Chassis: None, Components Mounted: ${items.length}`,
      autoFix: {
        label: 'Equip Carbon-Composite Hexagonal Bus',
        action: () => {
          state.equipped.add('chassis-composite');
        }
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // RULE 7: BUDGET SPENDING CAP ($250M NASA Program Cap)
  // ─────────────────────────────────────────────────────────────
  if (totalCost > budgetCap) {
    const overCost = (totalCost - budgetCap).toFixed(1);
    const sortedCost = [...items].sort((a, b) => b.cost - a.cost);
    const topCost = sortedCost[0];

    findings.push({
      id: 'rule-budget-cap',
      severity: 'blocker',
      title: 'Project Budget Exceeds Authorized Cap',
      what_is_wrong: `Total project cost ($${totalCost.toFixed(1)}M) exceeds authorized NASA cap ($${budgetCap}.0M) by $${overCost}M.`,
      likely_cause: `SLS launch vehicle or high-cost instruments (RTG, SAR Radar) exceed mission budget allocation.`,
      why_it_matters: `Congress and NASA Launch Services Program will terminate project at Preliminary Design Review (PDR).`,
      fix: `Switch to Falcon 9/Heavy or replace '${topCost ? topCost.name : 'components'}' to save $${topCost ? topCost.cost : 0}M.`,
      data_used: `Cost: $${totalCost.toFixed(1)}M, Cap: $${budgetCap}.0M, Breach: +$${overCost}M`,
      autoFix: {
        label: state.vehicle === 'sls' ? 'Switch to Falcon Heavy (-$2,003M)' : 'Stow High-Cost Item',
        action: () => {
          if (state.vehicle === 'sls') {
            state.vehicle = 'falconheavy';
          } else if (topCost) {
            state.equipped.delete(topCost.id);
          }
        }
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // RULE 8: SINGLE POINT OF FAILURE REDUNDANCY (Warning)
  // ─────────────────────────────────────────────────────────────
  if (powerSourcesCount === 1 || antennaCount === 1) {
    findings.push({
      id: 'rule-redundancy-spof',
      severity: 'warning',
      title: 'Single Point of Failure (SPOF) Identified',
      what_is_wrong: `Mission architecture has single points of failure: ${powerSourcesCount === 1 ? '1 power source' : ''} ${antennaCount === 1 ? '1 antenna' : ''}.`,
      likely_cause: `No secondary backup system equipped for housekeeping commands or trickle charge.`,
      why_it_matters: `A single micro-meteoroid strike or mechanism jam in solar deployment will end the mission prematurely.`,
      fix: `Add S-Band Omni Antenna for emergency commanding or secondary battery buffer.`,
      data_used: `Power Units: ${powerSourcesCount}, Comms Units: ${antennaCount}`,
      autoFix: {
        label: 'Equip S-Band Omni Antenna (Backup)',
        action: () => {
          state.equipped.add('antenna-sband');
        }
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // RULE 9: THERMAL RADIATOR BALANCE (Estimate)
  // ─────────────────────────────────────────────────────────────
  const estimatedRadiatorM2 = hasChassis ? 2.4 : 0.8;
  const thermalLoadW = totalLoad + 35; // internal dissipation + solar absorption est.
  const maxDissipationW = estimatedRadiatorM2 * 220; // ~220 W/m^2 radiator rejection capability at 20°C
  if (thermalLoadW > maxDissipationW) {
    findings.push({
      id: 'rule-thermal-margin',
      severity: 'info',
      title: 'Thermal Dissipation Margin Tight [est.]',
      what_is_wrong: `Thermal dissipation estimate (${thermalLoadW} W) approaches estimated radiator capability (${Math.round(maxDissipationW)} W).`,
      likely_cause: `High internal electronics draw in small structural chassis volume.`,
      why_it_matters: `Sensors may require active thermal throttling during prolonged sunlit passes.`,
      fix: `Consider upgrading to Flagship Deep Space Bus with embedded heat pipes.`,
      data_used: `Load: ${thermalLoadW} W [est.], Dissipation: ${Math.round(maxDissipationW)} W [est.]`
    });
  }

  // ─────────────────────────────────────────────────────────────
  // RULE 10: MISSION ARCHITECTURE FIT
  // ─────────────────────────────────────────────────────────────
  if (state.mission === 'leo' && hasRtg) {
    findings.push({
      id: 'rule-fit-rtg-leo',
      severity: 'warning',
      title: 'Inefficient Power Selection for Low Earth Orbit',
      what_is_wrong: `Plutonium-238 RTG is equipped for a 500 km LEO Satellite mission.`,
      likely_cause: `Nuclear power source selected where solar flux is abundant (1,361 W/m^2).`,
      why_it_matters: `RTGs carry severe mass (380 kg) and cost ($95M) penalties, requiring complex NEPA environmental launch clearances.`,
      fix: `Switch to UltraFlex Solar Wings (+450W, 120 kg, $18M) to save 260 kg and $77M.`,
      data_used: `Solar flux at 1 AU: 1,361 W/m^2, RTG Mass: 380 kg, Cost: $95M`,
      autoFix: {
        label: 'Switch RTG to UltraFlex Solar Wings',
        action: () => {
          state.equipped.delete('rtg-plutonium');
          state.equipped.add('solar-ultraflex');
        }
      }
    });
  } else if (state.mission === 'mars' && hasSolar && !hasRtg) {
    findings.push({
      id: 'rule-fit-solar-mars',
      severity: 'info',
      title: 'Solar Intensity Drop at Mars Orbit [est.]',
      what_is_wrong: `Solar flux at Mars (1.52 AU) drops to 43% of Earth levels (590 W/m^2 vs 1,361 W/m^2).`,
      likely_cause: `Standard solar array equipped for deep interplanetary trajectory.`,
      why_it_matters: `Solar array power output degrades from 450 W at Earth departure to ~195 W at Mars capture.`,
      fix: `Add Plutonium-238 RTG for continuous deep-space power independent of solar distance.`,
      data_used: `Inverse-square solar flux: 1 / (1.52)^2 = 0.433`
    });
  }

  // Sort: Blocker first, then Warning, then Info
  const severityRank = { blocker: 0, warning: 1, info: 2 };
  findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return findings;
}

/**
 * Predicts the exact physical post-mortem failure sequence if launch proceeds with blockers.
 */
function evaluateLaunchPostMortem(findings) {
  const blockers = findings.filter(f => f.severity === 'blocker');
  if (blockers.length === 0) return null;

  // Determine earliest physical failure mode
  if (blockers.some(b => b.id === 'rule-mass-overweight')) {
    return {
      time: 'T+00:00:01',
      phase: 'LIFTOFF / PAD ABORT',
      title: 'Thrust-to-Weight Insufficient for Liftoff',
      predicted_by: 'Rule 1: Payload Mass Limit Exceeded',
      explanation: 'Rocket engines ignited at full thrust, but total vehicle wet mass exceeded launcher lift capability. Launch vehicle failed to clear umbilical tower and triggered autonomous pad abort.',
      fix: 'Reduce payload mass or select Falcon Heavy / SLS Block 1.'
    };
  }

  if (blockers.some(b => b.id === 'rule-deltav-shortfall')) {
    return {
      time: 'T+00:09:40',
      phase: 'ORBIT INSERTION BURN',
      title: 'Spacecraft Propulsion Depletion Below Orbital Speed',
      predicted_by: 'Rule 4: Delta-V Insertion Shortfall',
      explanation: 'Upper stage separation was nominal, but spacecraft onboard propulsion exhausted propellant prior to circularizing periapsis. Spacecraft re-entered upper atmosphere on descending node.',
      fix: 'Equip high-Isp ion or monopropellant propulsion system with adequate propellant mass.'
    };
  }

  if (blockers.some(b => b.id === 'rule-power-deficit')) {
    return {
      time: 'T+00:18:25',
      phase: 'BUS INITIALIZATION',
      title: 'Catastrophic Electrical Brownout',
      predicted_by: 'Rule 2: Bus Power Deficit',
      explanation: 'Onboard payload systems drew power faster than generation. Battery voltage collapsed below 8.2V, causing flight computer lockup and total power loss.',
      fix: 'Equip UltraFlex Solar Wings or RTG to generate net positive electrical margin.'
    };
  }

  if (blockers.some(b => b.id === 'rule-eclipse-battery')) {
    return {
      time: 'T+00:58:30',
      phase: 'FIRST ORBITAL ECLIPSE',
      title: 'Spacecraft Depleted Energy in Earth Shadow',
      predicted_by: 'Rule 3: Eclipse Battery Buffer Deficit',
      explanation: 'Spacecraft passed into Earth shadow for 35.8 minutes. Battery capacity was insufficient to sustain thermal heaters and bus systems, resulting in bus freeze.',
      fix: 'Add Li-Ion Battery Buffer (40 Ah) or continuous RTG power source.'
    };
  }

  if (blockers.some(b => b.id === 'rule-comms-missing')) {
    return {
      time: 'T+01:12:00',
      phase: 'FIRST DSN PASS (GOLDSTONE)',
      title: 'No Telemetry Downlink Established',
      predicted_by: 'Rule 5: Communications Transceiver Missing',
      explanation: 'Spacecraft reached target orbit nominally, but ground station DSN-14 detected zero RF carrier signal. Spacecraft is a silent ghost satellite.',
      fix: 'Equip Ka-Band High-Gain Antenna or X-Band Dish.'
    };
  }

  if (blockers.some(b => b.id === 'rule-bus-missing')) {
    return {
      time: 'T+00:01:15',
      phase: 'MAX-Q ACOUSTIC LOADS',
      title: 'Structural Disintegration During Transonic Flight',
      predicted_by: 'Rule 6: Structural Chassis Bus Missing',
      explanation: 'Components unmounted to a structural bus experienced aerodynamic flutter and acoustic shear loads, breaking telemetry harness.',
      fix: 'Equip Carbon-Composite Hexagonal Bus chassis.'
    };
  }

  // Fallback
  return {
    time: 'T+00:00:00',
    phase: 'STAGE-0 INHIBIT',
    title: 'Launch Safety Interlock Abort',
    predicted_by: blockers[0].title,
    explanation: blockers[0].what_is_wrong,
    fix: blockers[0].fix
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { evaluateDesignRules, evaluateLaunchPostMortem };
}
