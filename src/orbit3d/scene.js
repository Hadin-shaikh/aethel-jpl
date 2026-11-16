/* ═══════════════════════════════════════════════════════════════
   AETHEL // JPL — 3D Celestial Astrodynamics Viewport
   Multi-Body System: Earth, Moon & Mars with Physical Kepler III Propagation
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ── 1. CELESTIAL BODY CLASS ──
class CelestialBody {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.radius_km = config.radius_km;
    this.mu = config.mu; // km^3/s^2
    this.axial_tilt_deg = config.axial_tilt_deg;
    this.rotation_period_h = config.rotation_period_h;
    this.texture_url = config.texture_url;
    this.clouds_url = config.clouds_url || null;
    this.atmosphere = config.atmosphere || { has_atmosphere: false };
    this.roughness = config.roughness || 0.75;
    this.metalness = config.metalness || 0.05;

    this.mesh = null;
    this.cloudMesh = null;
    this.atmoMesh = null;
    this.texture = null;
    this.isLoaded = false;
  }

  // Calculate circular orbital speed: v = sqrt(mu / r)
  orbitalVelocity(altitudeKm) {
    const r = this.radius_km + altitudeKm;
    return Math.sqrt(this.mu / r);
  }

  // Calculate circular orbital period via Kepler III: T = 2 * pi * sqrt(a^3 / mu) in minutes
  orbitalPeriodMin(altitudeKm) {
    const a = this.radius_km + altitudeKm;
    const periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / this.mu);
    return periodSeconds / 60.0;
  }

  // Calculate parabolic escape velocity: v_esc = sqrt(2 * mu / r)
  escapeVelocity(altitudeKm) {
    const r = this.radius_km + altitudeKm;
    return Math.sqrt((2 * this.mu) / r);
  }

  // Asynchronously load texture with fallback
  loadTextures(renderer, onComplete) {
    if (this.isLoaded) {
      if (onComplete) onComplete();
      return;
    }

    const textureLoader = new THREE.TextureLoader();
    const maxAnisotropy = renderer && renderer.capabilities ? renderer.capabilities.getMaxAnisotropy() : 8;

    this.texture = textureLoader.load(
      this.texture_url,
      (tex) => {
        if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
        tex.anisotropy = maxAnisotropy;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        this.isLoaded = true;
        if (this.mesh && this.mesh.material) {
          this.mesh.material.map = tex;
          this.mesh.material.color.setHex(0xFFFFFF);
          this.mesh.material.needsUpdate = true;
        }
        if (onComplete) onComplete();
      },
      undefined,
      (err) => {
        console.warn(`[CelestialBody] Texture load failed for ${this.name}: ${this.texture_url}. Using neutral gray fallback.`);
        this.texture = null;
        this.isLoaded = true;
        if (onComplete) onComplete();
      }
    );

    if (this.clouds_url) {
      this.cloudTexture = textureLoader.load(this.clouds_url, (tex) => {
        if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
        tex.anisotropy = maxAnisotropy;
        if (this.cloudMesh && this.cloudMesh.material) {
          this.cloudMesh.material.map = tex;
          this.cloudMesh.material.needsUpdate = true;
        }
      });
    }
  }

  // Instantiate 3D Mesh synchronously
  createMesh(visualRadius = 2.0) {
    this.visualRadius = visualRadius;
    const segments = 64;
    const geometry = new THREE.SphereGeometry(visualRadius, segments, segments);

    const fallbackColor = this.id === 'mars' ? 0xC2410C : (this.id === 'moon' ? 0x94A3B8 : 0x2A628F);
    const material = new THREE.MeshStandardMaterial({
      map: this.texture || null,
      color: this.texture ? 0xFFFFFF : fallbackColor,
      roughness: this.roughness,
      metalness: this.metalness
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.z = (this.axial_tilt_deg * Math.PI) / 180;

    // Optional Cloud Layer (Earth only)
    if (this.clouds_url && this.cloudTexture) {
      const cloudGeo = new THREE.SphereGeometry(visualRadius * 1.012, segments, segments);
      const cloudMat = new THREE.MeshStandardMaterial({
        map: this.cloudTexture,
        transparent: true,
        opacity: 0.38,
        blending: THREE.AdditiveBlending,
        roughness: 0.9
      });
      this.cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      this.mesh.add(this.cloudMesh);
    }

    // Optional Atmospheric Rim Glow
    if (this.atmosphere && this.atmosphere.has_atmosphere) {
      const atmoColor = new THREE.Color(this.atmosphere.color || 0x5AA9FF);
      const atmoScale = this.atmosphere.scale || 1.025;
      const atmoOpacity = this.atmosphere.opacity || 0.35;

      const atmoGeo = new THREE.SphereGeometry(visualRadius * atmoScale, segments, segments);
      const atmoMat = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          uniform vec3 uColor;
          uniform float uOpacity;
          void main() {
            float intensity = pow(0.68 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
            gl_FragColor = vec4(uColor, 1.0) * intensity * uOpacity;
          }
        `,
        uniforms: {
          uColor: { value: atmoColor },
          uOpacity: { value: atmoOpacity }
        },
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
      });
      this.atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
      this.mesh.add(this.atmoMesh);
    }

    return this.mesh;
  }

  // Sidereal axial rotation update
  update(dt, timeWarp = 1) {
    if (!this.mesh) return;
    // Rotation rate: 2*pi radians in rotation_period_h hours
    const rotSpeed = (2 * Math.PI) / (this.rotation_period_h * 3600);
    this.mesh.rotation.y += rotSpeed * dt * timeWarp * 180;

    if (this.cloudMesh) {
      this.cloudMesh.rotation.y += rotSpeed * 1.2 * dt * timeWarp * 180;
    }
  }

  dispose() {
    if (this.mesh) {
      if (this.mesh.geometry) this.mesh.geometry.dispose();
      if (this.mesh.material) this.mesh.material.dispose();
      this.mesh = null;
    }
    if (this.cloudMesh) {
      if (this.cloudMesh.geometry) this.cloudMesh.geometry.dispose();
      if (this.cloudMesh.material) this.cloudMesh.material.dispose();
      this.cloudMesh = null;
    }
    if (this.atmoMesh) {
      if (this.atmoMesh.geometry) this.atmoMesh.geometry.dispose();
      if (this.atmoMesh.material) this.atmoMesh.material.dispose();
      this.atmoMesh = null;
    }
  }
}

// ── 2. 3D ASTRODYNAMICS SCENE ENGINE ──
class Orbit3DScene {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.options = options;
    this.isWebGLAvailable = this.checkWebGL();
    
    this.currentMission = 'leo'; // 'leo' | 'lunar' | 'mars'
    this.currentStage = 'orbit'; // depends on mission
    this.timeWarp = 1;
    this.state = options.state || null;

    this.userInteracting = false;
    this.idleTimer = null;
    this.autoRotateSpeed = 0.04;
    this.orbitAngle = 0.85;

    // Camera animation morphing state
    this.cameraTransition = {
      isTransitioning: false,
      startTime: 0,
      duration: 800, // ms
      startPos: new THREE.Vector3(),
      targetPos: new THREE.Vector3(),
      startLook: new THREE.Vector3(),
      targetLook: new THREE.Vector3()
    };

    // Instantiate Celestial Bodies from NASA reference specifications
    this.bodies = {
      earth: new CelestialBody({
        id: 'earth',
        name: 'Earth',
        radius_km: 6378.137,
        mu: 398600.4418,
        axial_tilt_deg: 23.44,
        rotation_period_h: 23.934,
        texture_url: 'assets/textures/earth_day_2048.jpg',
        clouds_url: 'assets/textures/earth_clouds.png',
        atmosphere: { has_atmosphere: true, color: '#5aa9ff', opacity: 0.40, scale: 1.025 },
        roughness: 0.65,
        metalness: 0.05
      }),
      moon: new CelestialBody({
        id: 'moon',
        name: 'Moon',
        radius_km: 1737.4,
        mu: 4902.80,
        axial_tilt_deg: 6.68,
        rotation_period_h: 655.728, // 27.322 days, tidally locked
        texture_url: 'assets/textures/moon_color.jpg',
        atmosphere: { has_atmosphere: false },
        roughness: 0.88,
        metalness: 0.02
      }),
      mars: new CelestialBody({
        id: 'mars',
        name: 'Mars',
        radius_km: 3389.5,
        mu: 42828.3,
        axial_tilt_deg: 25.19,
        rotation_period_h: 24.623,
        texture_url: 'assets/textures/mars_color.jpg',
        atmosphere: { has_atmosphere: true, color: '#e07a48', opacity: 0.22, scale: 1.018 },
        roughness: 0.78,
        metalness: 0.08
      })
    };

    // Mission stages mapping
    this.stagesPerMission = {
      leo: [
        { id: 'orbit', label: 'LEO Orbit' }
      ],
      lunar: [
        { id: 'transfer', label: 'Trans-Lunar Arc' },
        { id: 'lunar_orbit', label: 'Lunar Orbit' },
        { id: 'landing_site', label: 'Landing Site' }
      ],
      mars: [
        { id: 'interplanetary', label: 'Hohmann Transfer' },
        { id: 'arrival', label: 'Capture & Braking' },
        { id: 'mars_orbit', label: 'Mars Science Orbit' }
      ]
    };

    if (!this.isWebGLAvailable) {
      this.renderFallback2D();
      return;
    }

    this.initThree();
  }

  checkWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  initThree() {
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 450;

    // 1. Three.js Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070B14);

    // 2. Camera: Framing body at ~55% - 65% of viewport height
    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 1000);
    this.camera.position.set(5.0, 2.2, 5.8);

    // 3. Renderer with sRGB Encoding & ACESFilmic Tone Mapping
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    if (THREE.sRGBEncoding) {
      this.renderer.outputEncoding = THREE.sRGBEncoding;
    }
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.minDistance = 2.4;
      this.controls.maxDistance = 25.0;
      this.controls.maxPolarAngle = Math.PI - 0.05;

      this.controls.addEventListener('start', () => {
        this.userInteracting = true;
        if (this.idleTimer) clearTimeout(this.idleTimer);
      });

      this.controls.addEventListener('end', () => {
        if (this.idleTimer) clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => {
          this.userInteracting = false;
        }, 5000);
      });
    }

    // 5. Lighting: Upper-right Directional Sunlight + Soft Hemisphere Fill
    // Hemisphere fill ensures the dark side of the Moon/Mars is visible, never pitch black
    this.hemiLight = new THREE.HemisphereLight(0xCCD6E8, 0x141824, 0.48);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.45);
    this.sunLight.position.set(8.0, 3.5, 6.0);
    this.scene.add(this.sunLight);

    // 6. Deep-Space Starfield
    this.createStarfield();

    // 7. Celestial Objects Root Groups
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    this.schematicGroup = new THREE.Group();
    this.scene.add(this.schematicGroup);

    // 8. Satellite Model & Trailing Orbit Line
    this.createSatellite();
    this.createOrbitLine();
    this.createTrail();

    // 9. Overlay Badges (HUD Pill & "NOT TO SCALE" Stamp)
    this.createHudOverlay();
    this.createStageTabsUI();

    // ResizeObserver
    this.setupResize();

    // Load initial Earth textures & build LEO scene
    this.setMission('leo');

    // Animation Loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  setupResize() {
    if (window.ResizeObserver) {
      this.ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const w = entry.contentRect.width;
          const h = entry.contentRect.height;
          if (w > 0 && h > 0) {
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
          }
        }
      });
      this.ro.observe(this.container);
    }
  }

  createStarfield() {
    const starCount = 1400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 50 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0x94A3B8, size: 0.75 });
    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);
  }

  // Satellite Assembly (4x scale model)
  createSatellite() {
    this.satGroup = new THREE.Group();

    // Central Avionics Bus
    const busGeo = new THREE.BoxGeometry(0.36, 0.36, 0.48);
    const busMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, metalness: 0.85, roughness: 0.2 });
    this.satBus = new THREE.Mesh(busGeo, busMat);
    this.satGroup.add(this.satBus);

    // Bright Position Dot
    const markerGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    this.marker = new THREE.Mesh(markerGeo, markerMat);
    this.satGroup.add(this.marker);

    // Left Solar Panel Array
    const wingGeo = new THREE.BoxGeometry(1.0, 0.32, 0.03);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x0B6E99, metalness: 0.9, roughness: 0.1 });
    this.wingL = new THREE.Mesh(wingGeo, wingMat);
    this.wingL.position.set(-0.72, 0, 0);
    this.satGroup.add(this.wingL);

    // Right Solar Panel Array
    this.wingR = new THREE.Mesh(wingGeo, wingMat);
    this.wingR.position.set(0.72, 0, 0);
    this.satGroup.add(this.wingR);

    // Parabolic High-Gain Dish
    const dishGeo = new THREE.ConeGeometry(0.24, 0.10, 24, 1, true);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xDDE2E7, metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide });
    this.dish = new THREE.Mesh(dishGeo, dishMat);
    this.dish.position.set(0, 0.28, 0);
    this.dish.rotation.x = Math.PI;
    this.satGroup.add(this.dish);

    // RTG Cylinder (Stowed by default)
    const rtgGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.30, 16);
    const rtgMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.6, roughness: 0.4 });
    this.rtg = new THREE.Mesh(rtgGeo, rtgMat);
    this.rtg.position.set(0, -0.28, 0);
    this.rtg.visible = false;
    this.satGroup.add(this.rtg);

    this.scene.add(this.satGroup);
  }

  // Update satellite modules visually based on user outfitter loadout
  updateSatelliteModules(equippedSet) {
    if (!equippedSet) return;
    const hasSolar = equippedSet.has('solar-ultraflex') || equippedSet.has('solar-bodymount');
    const hasRTG = equippedSet.has('rtg-plutonium');
    const hasDish = equippedSet.has('comm-kaband') || equippedSet.has('comm-xband') || equippedSet.has('comm-optical');

    if (this.wingL && this.wingR) {
      this.wingL.visible = hasSolar;
      this.wingR.visible = hasSolar;
    }
    if (this.rtg) {
      this.rtg.visible = hasRTG;
    }
    if (this.dish) {
      this.dish.visible = hasDish;
    }
  }

  createOrbitLine() {
    const pointsCount = 128;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(pointsCount * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0x0B6E99,
      transparent: true,
      opacity: 0.85,
      linewidth: 2
    });

    this.orbitLine = new THREE.LineLoop(geometry, material);
    this.scene.add(this.orbitLine);
  }

  createTrail() {
    this.trailLength = 40;
    this.trailPoints = [];
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.trailLength * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0x38BDF8,
      transparent: true,
      opacity: 0.7
    });

    this.trailLine = new THREE.Line(geometry, material);
    this.scene.add(this.trailLine);
  }

  // Floating HUD Badge & "NOT TO SCALE" Stamp
  createHudOverlay() {
    // 1. Satellite Pill Badge
    this.hudBadge = document.createElement('div');
    this.hudBadge.className = 'satellite-label-pill';
    this.hudBadge.style.opacity = '0';
    this.hudBadge.innerHTML = `
      <div class="pill-dot"></div>
      <div class="pill-text">
        <span class="pill-title" id="hud-pill-name">LEO SAT</span>
        <span class="pill-meta" id="hud-pill-meta">500 km • 51.6° • 94.6 min</span>
      </div>
    `;
    this.container.appendChild(this.hudBadge);

    // 2. "NOT TO SCALE" schematic badge
    this.notToScaleBadge = document.createElement('div');
    this.notToScaleBadge.className = 'not-to-scale-badge hidden';
    this.notToScaleBadge.innerHTML = `<span>⚠️ SCHEMATIC VIEW — DISTANCES NOT TO SCALE</span>`;
    this.container.appendChild(this.notToScaleBadge);
  }

  // Viewport Stage Stepper Tabs (Transfer, Orbit, Landing, etc.)
  createStageTabsUI() {
    this.stageTabsContainer = document.createElement('div');
    this.stageTabsContainer.className = 'viewport-stage-stepper';
    this.container.appendChild(this.stageTabsContainer);
  }

  renderStageTabs() {
    if (!this.stageTabsContainer) return;
    const stages = this.stagesPerMission[this.currentMission] || [];

    if (stages.length <= 1) {
      this.stageTabsContainer.style.display = 'none';
      return;
    }

    this.stageTabsContainer.style.display = 'flex';
    this.stageTabsContainer.innerHTML = stages.map(st => `
      <button class="stage-step-btn ${st.id === this.currentStage ? 'active' : ''}" data-stage="${st.id}">
        <span>${st.label}</span>
      </button>
    `).join('');

    this.stageTabsContainer.querySelectorAll('.stage-step-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setStage(btn.dataset.stage);
      });
    });
  }

  // ── 3. MISSION & STAGE TRANSITIONS ──
  setMission(missionType) {
    if (this.currentMission === missionType) return;
    this.currentMission = missionType;

    // Reset default stage for this mission
    const availableStages = this.stagesPerMission[missionType] || [{ id: 'orbit' }];
    this.currentStage = availableStages[0].id;
    this.renderStageTabs();

    this.buildCurrentScene();
  }

  setStage(stageId) {
    if (this.currentStage === stageId) return;
    this.currentStage = stageId;
    this.renderStageTabs();
    this.buildCurrentScene();
  }

  // Construct Scene for Active Mission & Stage
  buildCurrentScene() {
    // Clear dynamic objects in groups
    while (this.worldGroup.children.length > 0) {
      this.worldGroup.remove(this.worldGroup.children[0]);
    }
    while (this.schematicGroup.children.length > 0) {
      this.schematicGroup.remove(this.schematicGroup.children[0]);
    }

    if (this.landingMarker) {
      this.landingMarker.removeFromParent();
      this.landingMarker = null;
    }

    const mission = this.currentMission;
    const stage = this.currentStage;

    // Toggle "NOT TO SCALE" badge
    const isSchematic = (mission === 'lunar' && stage === 'transfer') || (mission === 'mars' && stage === 'interplanetary');
    if (this.notToScaleBadge) {
      this.notToScaleBadge.classList.toggle('hidden', !isSchematic);
    }

    if (mission === 'leo') {
      this.buildLeoScene();
    } else if (mission === 'lunar') {
      if (stage === 'transfer') {
        this.buildLunarTransferScene();
      } else if (stage === 'lunar_orbit') {
        this.buildLunarOrbitScene();
      } else if (stage === 'landing_site') {
        this.buildLunarLandingScene();
      }
    } else if (mission === 'mars') {
      if (stage === 'interplanetary') {
        this.buildMarsInterplanetaryScene();
      } else if (stage === 'arrival') {
        this.buildMarsArrivalScene();
      } else if (stage === 'mars_orbit') {
        this.buildMarsOrbitScene();
      }
    }
  }

  // 1. LEO Mission Scene: Earth close-up + Orbit + Satellite
  buildLeoScene() {
    const body = this.bodies.earth;
    this.activeBody = body;

    const mesh = body.createMesh(2.0);
    this.worldGroup.add(mesh);
    this.activeBodyMesh = mesh;
    body.loadTextures(this.renderer);

    this.orbitRadius = 2.22; // ~500 km altitude representation
    this.orbitInclination = (51.6 * Math.PI) / 180;
    this.updateOrbitRingGeometry(this.orbitRadius, this.orbitInclination);

    this.orbitLine.visible = true;
    this.satGroup.visible = true;
    this.trailLine.visible = true;

    // Camera target position
    this.morphCamera(new THREE.Vector3(5.0, 2.2, 5.8), new THREE.Vector3(0, 0, 0));

    // Update HUD Pill
    this.updateHudLabel('LEO SAT', '500 km • 51.6° • T: 94.6 min');
  }

  // 2a. Lunar Mission: Trans-Lunar Transfer Arc (Schematic)
  buildLunarTransferScene() {
    const earth = this.bodies.earth;
    const moon = this.bodies.moon;
    this.activeBody = earth;

    // Earth at Center (R=1.4)
    const earthMesh = earth.createMesh(1.4);
    this.worldGroup.add(earthMesh);
    earth.loadTextures(this.renderer);

    // Moon on Outer Ring (R=0.45 at distance 7.5)
    const moonMesh = moon.createMesh(0.45);
    moonMesh.position.set(7.5, 0, 0);
    this.schematicGroup.add(moonMesh);
    moon.loadTextures(this.renderer);

    // Thin Moon Orbit Ring
    const moonOrbitGeo = new THREE.BufferGeometry();
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push(Math.cos(a) * 7.5, 0, Math.sin(a) * 7.5);
    }
    moonOrbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const moonOrbitMat = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.5 });
    const moonRing = new THREE.Line(moonOrbitGeo, moonOrbitMat);
    this.schematicGroup.add(moonRing);

    // Trans-Lunar Injection Transfer Ellipse (Earth to Moon)
    this.orbitRadius = 4.5;
    this.orbitInclination = (28.5 * Math.PI) / 180;
    this.updateTransferArcGeometry(1.4, 7.5);

    this.orbitLine.visible = true;
    this.satGroup.visible = true;
    this.trailLine.visible = true;

    this.morphCamera(new THREE.Vector3(6.5, 6.0, 8.5), new THREE.Vector3(3.5, 0, 0));
    this.updateHudLabel('TRANS-LUNAR RELAY', 'TLI Burn: +3,100 m/s • Trans-Lunar Cruise');
  }

  // 2b. Lunar Mission: Lunar Close-Up Orbit
  buildLunarOrbitScene() {
    const moon = this.bodies.moon;
    this.activeBody = moon;

    const mesh = moon.createMesh(2.0); // Fills 55% - 65% of viewport
    this.worldGroup.add(mesh);
    this.activeBodyMesh = mesh;
    moon.loadTextures(this.renderer);

    // 100 km lunar orbit (Keplerian calculation)
    this.orbitRadius = 2.20;
    this.orbitInclination = (86.0 * Math.PI) / 180;
    this.updateOrbitRingGeometry(this.orbitRadius, this.orbitInclination);

    this.orbitLine.visible = true;
    this.satGroup.visible = true;
    this.trailLine.visible = true;

    this.morphCamera(new THREE.Vector3(4.8, 2.0, 5.2), new THREE.Vector3(0, 0, 0));
    this.updateHudLabel('LUNAR RELAY', '100 km • 86.0° • T: 118.4 min');
  }

  // 2c. Lunar Mission: Rover Landing Site (Shackleton Crater)
  buildLunarLandingScene() {
    const moon = this.bodies.moon;
    this.activeBody = moon;

    const mesh = moon.createMesh(2.2);
    this.worldGroup.add(mesh);
    this.activeBodyMesh = mesh;
    moon.loadTextures(this.renderer);

    // Landing Site Target Marker at South Pole (89.9° S)
    const targetGeo = new THREE.RingGeometry(0.12, 0.16, 32);
    const targetMat = new THREE.MeshBasicMaterial({ color: 0x38BDF8, side: THREE.DoubleSide });
    const targetMesh = new THREE.Mesh(targetGeo, targetMat);
    targetMesh.position.set(0, -2.21, 0.05);
    targetMesh.rotation.x = Math.PI / 2;
    this.worldGroup.add(targetMesh);
    this.landingMarker = targetMesh;

    this.orbitLine.visible = false;
    this.satGroup.visible = false;
    this.trailLine.visible = false;

    // Angle camera down towards South Pole
    this.morphCamera(new THREE.Vector3(0.5, -3.8, 3.2), new THREE.Vector3(0, -2.0, 0));
    this.updateHudLabel('LANDING SITE: SHACKLETON CRATER (89.9° S)', 'Permanently Shadowed Water-Ice Deposit');
  }

  // 3a. Mars Mission: Interplanetary Hohmann Transfer (Sun View)
  buildMarsInterplanetaryScene() {
    const sunGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xFDB813 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.schematicGroup.add(sunMesh);

    // Earth Orbit (R=3.5)
    const earthRing = this.createSchematicRing(3.5, 0x38BDF8);
    this.schematicGroup.add(earthRing);

    // Mars Orbit (R=5.3)
    const marsRing = this.createSchematicRing(5.3, 0xE07A48);
    this.schematicGroup.add(marsRing);

    // Hohmann Transfer Ellipse Arc (from R=3.5 to R=5.3)
    this.updateHohmannTransferArcGeometry(3.5, 5.3);

    this.orbitLine.visible = true;
    this.satGroup.visible = true;
    this.trailLine.visible = true;

    this.morphCamera(new THREE.Vector3(0, 11.0, 0.01), new THREE.Vector3(0, 0, 0));
    this.updateHudLabel('MARS HOHMANN TRANSFER', '259 Days Transit • TMI: +3.6 km/s • MOI: -2.1 km/s');
  }

  // 3b. Mars Mission: Arrival & Capture Braking Burn
  buildMarsArrivalScene() {
    const mars = this.bodies.mars;
    this.activeBody = mars;

    const mesh = mars.createMesh(2.0);
    this.worldGroup.add(mesh);
    this.activeBodyMesh = mesh;
    mars.loadTextures(this.renderer);

    // Capture trajectory hyperbola with braking burn indicator
    this.orbitRadius = 2.45;
    this.orbitInclination = (92.8 * Math.PI) / 180;
    this.updateOrbitRingGeometry(this.orbitRadius, this.orbitInclination);

    this.orbitLine.visible = true;
    this.satGroup.visible = true;
    this.trailLine.visible = true;

    this.morphCamera(new THREE.Vector3(5.2, 2.5, 5.5), new THREE.Vector3(0, 0, 0));
    this.updateHudLabel('MARS ORBIT INSERTION (MOI)', 'Retrograde Braking Burn: Δv -2,100 m/s');
  }

  // 3c. Mars Mission: Mars Science Circular Orbit
  buildMarsOrbitScene() {
    const mars = this.bodies.mars;
    this.activeBody = mars;

    const mesh = mars.createMesh(2.0); // 55% - 65% of viewport
    this.worldGroup.add(mesh);
    this.activeBodyMesh = mesh;
    mars.loadTextures(this.renderer);

    // 250 km circular polar science orbit
    this.orbitRadius = 2.30;
    this.orbitInclination = (92.8 * Math.PI) / 180;
    this.updateOrbitRingGeometry(this.orbitRadius, this.orbitInclination);

    this.orbitLine.visible = true;
    this.satGroup.visible = true;
    this.trailLine.visible = true;

    this.morphCamera(new THREE.Vector3(4.8, 2.2, 5.4), new THREE.Vector3(0, 0, 0));
    this.updateHudLabel('MARS PROBE', '250 km • 92.8° • T: 118.2 min');
  }

  // ── 4. GEOMETRY UTILITIES ──
  createSchematicRing(radius, colorHex) {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.6 });
    return new THREE.Line(geo, mat);
  }

  updateOrbitRingGeometry(radius, incRad) {
    const pointsCount = 128;
    const positions = this.orbitLine.geometry.attributes.position.array;

    for (let i = 0; i < pointsCount; i++) {
      const theta = (i / (pointsCount - 1)) * Math.PI * 2;
      const x = Math.cos(theta) * radius;
      const y = Math.sin(theta) * radius * Math.sin(incRad);
      const z = Math.sin(theta) * radius * Math.cos(incRad);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    this.orbitLine.geometry.attributes.position.needsUpdate = true;
    this.trailPoints = [];
  }

  updateTransferArcGeometry(r1, r2) {
    const pointsCount = 128;
    const positions = this.orbitLine.geometry.attributes.position.array;
    const a = (r1 + r2) / 2;
    const c = a - r1;

    for (let i = 0; i < pointsCount; i++) {
      const theta = (i / (pointsCount - 1)) * Math.PI; // Half-ellipse
      const x = Math.cos(theta) * a + c;
      const z = Math.sin(theta) * Math.sqrt(r1 * r2);
      positions[i * 3] = x;
      positions[i * 3 + 1] = Math.sin(theta) * 0.4;
      positions[i * 3 + 2] = z;
    }
    this.orbitLine.geometry.attributes.position.needsUpdate = true;
    this.trailPoints = [];
  }

  updateHohmannTransferArcGeometry(rEarth, rMars) {
    const pointsCount = 128;
    const positions = this.orbitLine.geometry.attributes.position.array;
    const a = (rEarth + rMars) / 2;
    const b = Math.sqrt(rEarth * rMars);
    const c = (rMars - rEarth) / 2;

    for (let i = 0; i < pointsCount; i++) {
      const theta = (i / (pointsCount - 1)) * Math.PI;
      positions[i * 3] = -(Math.cos(theta) * a - c);
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(theta) * b;
    }
    this.orbitLine.geometry.attributes.position.needsUpdate = true;
    this.trailPoints = [];
  }

  // Camera morphing transition with cubic easing (600 - 900 ms)
  morphCamera(targetPos, targetLook, duration = 800) {
    if (!this.camera || !this.controls) return;
    this.cameraTransition.isTransitioning = true;
    this.cameraTransition.startTime = performance.now();
    this.cameraTransition.duration = duration;
    this.cameraTransition.startPos.copy(this.camera.position);
    this.cameraTransition.targetPos.copy(targetPos);
    this.cameraTransition.startLook.copy(this.controls.target);
    this.cameraTransition.targetLook.copy(targetLook);
  }

  updateHudLabel(title, meta) {
    const titleEl = document.getElementById('hud-pill-name');
    const metaEl = document.getElementById('hud-pill-meta');
    if (titleEl) titleEl.textContent = title;
    if (metaEl) metaEl.textContent = meta;
  }

  // Compatibility hook for external app.js callers
  updateOrbitTrajectory(missionType) {
    this.setMission(missionType);
  }

  // ── 5. ANIMATION LOOP ──
  animate() {
    const dt = Math.min(this.clock.getDelta(), 0.1);

    // 1. Camera Morphing Interpolation
    if (this.cameraTransition.isTransitioning) {
      const elapsed = performance.now() - this.cameraTransition.startTime;
      const progress = Math.min(1.0, elapsed / this.cameraTransition.duration);
      // Smooth cubic ease-in-out
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.camera.position.lerpVectors(this.cameraTransition.startPos, this.cameraTransition.targetPos, ease);
      this.controls.target.lerpVectors(this.cameraTransition.startLook, this.cameraTransition.targetLook, ease);

      if (progress >= 1.0) {
        this.cameraTransition.isTransitioning = false;
      }
    }

    // 2. Active Body Sidereal Axial Rotation
    if (this.activeBody && !this.userInteracting) {
      this.activeBody.update(dt, this.timeWarp);
    }

    // 3. Satellite Progression
    if (this.satGroup && this.satGroup.visible) {
      const speedScale = (this.currentMission === 'leo' ? 0.35 : (this.currentMission === 'lunar' ? 0.28 : 0.20));
      this.orbitAngle += (speedScale / (this.orbitRadius * 0.75)) * dt * this.timeWarp;

      let sx, sy, sz;
      if (this.currentStage === 'transfer') {
        const a = (1.4 + 7.5) / 2;
        const c = a - 1.4;
        const theta = ((Math.sin(this.orbitAngle * 0.5) + 1) / 2) * Math.PI;
        sx = Math.cos(theta) * a + c;
        sy = Math.sin(theta) * 0.4;
        sz = Math.sin(theta) * Math.sqrt(1.4 * 7.5);
      } else if (this.currentStage === 'interplanetary') {
        const a = (3.5 + 5.3) / 2;
        const b = Math.sqrt(3.5 * 5.3);
        const c = (5.3 - 3.5) / 2;
        const theta = ((Math.sin(this.orbitAngle * 0.4) + 1) / 2) * Math.PI;
        sx = -(Math.cos(theta) * a - c);
        sy = 0;
        sz = Math.sin(theta) * b;
      } else {
        sx = Math.cos(this.orbitAngle) * this.orbitRadius;
        sy = Math.sin(this.orbitAngle) * this.orbitRadius * Math.sin(this.orbitInclination);
        sz = Math.sin(this.orbitAngle) * this.orbitRadius * Math.cos(this.orbitInclination);
      }

      this.satGroup.position.set(sx, sy, sz);

      // Orientation along velocity tangent
      const vx = -Math.sin(this.orbitAngle);
      const vy = Math.cos(this.orbitAngle) * Math.sin(this.orbitInclination);
      const vz = Math.cos(this.orbitAngle) * Math.cos(this.orbitInclination);
      this.satGroup.lookAt(new THREE.Vector3(sx + vx, sy + vy, sz + vz));

      // Fading Trail
      this.trailPoints.unshift(new THREE.Vector3(sx, sy, sz));
      if (this.trailPoints.length > this.trailLength) {
        this.trailPoints.pop();
      }

      if (this.trailLine) {
        const positions = this.trailLine.geometry.attributes.position.array;
        for (let i = 0; i < this.trailPoints.length; i++) {
          positions[i * 3] = this.trailPoints[i].x;
          positions[i * 3 + 1] = this.trailPoints[i].y;
          positions[i * 3 + 2] = this.trailPoints[i].z;
        }
        this.trailLine.geometry.attributes.position.needsUpdate = true;
      }

      // Update Screen-Space HUD Badge Position
      this.updatePillBadge(sx, sy, sz);
    } else if (this.hudBadge) {
      if (this.currentStage === 'landing_site' && this.landingMarker) {
        this.updatePillBadge(0, -2.21, 0.05);
      } else {
        this.hudBadge.style.opacity = '0';
      }
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    requestAnimationFrame(() => this.animate());
  }

  updatePillBadge(x, y, z) {
    if (!this.hudBadge || !this.camera) return;
    const vector = new THREE.Vector3(x, y, z);
    vector.project(this.camera);

    const w = this.container.clientWidth || this.width || 600;
    const h = this.container.clientHeight || this.height || 440;

    const screenX = (vector.x * 0.5 + 0.5) * w;
    const screenY = (-(vector.y * 0.5) + 0.5) * h;

    if (isNaN(screenX) || isNaN(screenY) || w <= 0 || h <= 0) return;

    // If point is behind the camera or off-screen, hide badge gracefully
    if (vector.z > 0.99 || vector.z < -1.0 || screenX < 30 || screenX > w - 220 || screenY < 55 || screenY > h - 40) {
      this.hudBadge.style.opacity = '0';
      return;
    }

    this.hudBadge.style.opacity = '1';
    this.hudBadge.style.transform = `translate3d(${Math.round(screenX + 16)}px, ${Math.round(screenY - 18)}px, 0)`;
  }

  resetCamera() {
    if (this.camera && this.controls) {
      this.morphCamera(new THREE.Vector3(5.0, 2.2, 5.8), new THREE.Vector3(0, 0, 0), 600);
    }
  }

  renderFallback2D() {
    const canvas = document.createElement('canvas');
    canvas.width = this.container.clientWidth || 800;
    canvas.height = this.container.clientHeight || 450;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#070B14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#0B6E99';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 90, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('3D WebGL acceleration offline. Flat 2D map active.', canvas.width / 2, canvas.height / 2);

    this.container.appendChild(canvas);
  }

  dispose() {
    if (this.ro) this.ro.disconnect();
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
      this.renderer.dispose();
    }
    Object.values(this.bodies).forEach(b => b.dispose());
  }
}

// Attach to window
window.CelestialBody = CelestialBody;
window.Orbit3DScene = Orbit3DScene;
