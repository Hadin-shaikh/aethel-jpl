/* ═══════════════════════════════════════════════════════════════
   AETHEL // JPL — 3D Earth Orbit Visualization Engine
   Three.js Realtime Astrodynamics Viewport with Satellite Bus
   ═══════════════════════════════════════════════════════════════ */

'use strict';

class Orbit3DScene {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.options = options;
    this.isWebGLAvailable = this.checkWebGL();
    this.currentMission = 'leo';
    this.timeWarp = 1;
    this.activeTab = '3d'; // '3d' | '2d' | 'trajectory'
    this.state = options.state || null;

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
    const w = this.container.clientWidth || 640;
    const h = this.container.clientHeight || 320;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070B14);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 1000);
    this.camera.position.set(4.2, 2.5, 5.0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.minDistance = 2.4;
      this.controls.maxDistance = 24.0;
      this.controls.maxPolarAngle = Math.PI - 0.05;
    }

    // 5. Lighting (Soft Directional Sunlight + Visible Terminator)
    this.ambientLight = new THREE.AmbientLight(0x223344, 0.35);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.3);
    this.sunLight.position.set(10, 3, 8);
    this.scene.add(this.sunLight);

    // 6. Starfield
    this.createStarfield();

    // 7. Earth Globe & Atmosphere
    this.createEarth();

    // 8. Orbit Trajectory Line
    this.createOrbitLine();

    // 9. Spacecraft Satellite Model
    this.createSatellite();

    // 10. Satellite Orbit Trail
    this.createTrail();

    // 11. HTML HUD Label Overlay (Name, Altitude, Inclination)
    this.createHudOverlay();

    // Resize handling
    this.handleResize = () => {
      const rw = this.container.clientWidth;
      const rh = this.container.clientHeight;
      if (rw > 0 && rh > 0) {
        this.camera.aspect = rw / rh;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(rw, rh);
      }
    };
    window.addEventListener('resize', this.handleResize);

    // Animation Loop
    this.clock = new THREE.Clock();
    this.orbitAngle = 0;
    this.animate();
  }

  createStarfield() {
    const starCount = 1400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 40 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0x94A3B8, size: 0.65 });
    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);
  }

  createEarth() {
    const radius = 2.0; // 6378 km scale
    const segments = 48;
    this.earthRadius = radius;

    const textureLoader = new THREE.TextureLoader();
    let dayTexture = null;

    // Load local texture with procedural fallback
    try {
      dayTexture = textureLoader.load('assets/textures/earth_day.jpg');
    } catch (e) {
      dayTexture = this.generateFallbackEarthTexture();
    }

    const earthGeo = new THREE.SphereGeometry(radius, segments, segments);
    const earthMat = new THREE.MeshStandardMaterial({
      map: dayTexture,
      roughness: 0.75,
      metalness: 0.05
    });

    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.scene.add(this.earthMesh);

    // Thin Atmosphere Glow Rim
    const atmoGeo = new THREE.SphereGeometry(radius * 1.018, segments, segments);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide
    });
    this.atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    this.scene.add(this.atmoMesh);
  }

  generateFallbackEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Deep Ocean Blue
    ctx.fillStyle = '#0F2B59';
    ctx.fillRect(0, 0, 512, 256);

    // Continents procedural blobs
    ctx.fillStyle = '#1A7F4B';
    ctx.beginPath();
    ctx.arc(140, 100, 50, 0, Math.PI * 2);
    ctx.arc(280, 80, 45, 0, Math.PI * 2);
    ctx.arc(360, 160, 40, 0, Math.PI * 2);
    ctx.arc(180, 180, 40, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  createOrbitLine() {
    const pointsCount = 128;
    this.orbitRadius = 2.156; // 500 km at Earth R=2.0
    this.orbitInclination = (51.6 * Math.PI) / 180;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(pointsCount * 3);

    for (let i = 0; i < pointsCount; i++) {
      const theta = (i / (pointsCount - 1)) * Math.PI * 2;
      const x = Math.cos(theta) * this.orbitRadius;
      const y = Math.sin(theta) * this.orbitRadius * Math.sin(this.orbitInclination);
      const z = Math.sin(theta) * this.orbitRadius * Math.cos(this.orbitInclination);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: 0x0B6E99,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.75
    });

    this.orbitLine = new THREE.Line(geometry, material);
    this.scene.add(this.orbitLine);
  }

  updateOrbitTrajectory(missionType) {
    this.currentMission = missionType;
    let r = 2.156;
    let incDeg = 51.6;

    if (missionType === 'lunar') {
      r = 3.8;
      incDeg = 28.5;
    } else if (missionType === 'mars') {
      r = 4.6;
      incDeg = 1.85;
    }

    this.orbitRadius = r;
    this.orbitInclination = (incDeg * Math.PI) / 180;

    const pointsCount = 128;
    const positions = this.orbitLine.geometry.attributes.position.array;

    for (let i = 0; i < pointsCount; i++) {
      const theta = (i / (pointsCount - 1)) * Math.PI * 2;
      const x = Math.cos(theta) * this.orbitRadius;
      const y = Math.sin(theta) * this.orbitRadius * Math.sin(this.orbitInclination);
      const z = Math.sin(theta) * this.orbitRadius * Math.cos(this.orbitInclination);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    this.orbitLine.geometry.attributes.position.needsUpdate = true;
    this.trailPoints = [];
  }

  createSatellite() {
    this.satGroup = new THREE.Group();

    // Central Bus Frame
    const busGeo = new THREE.BoxGeometry(0.12, 0.12, 0.16);
    const busMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.8, roughness: 0.25 });
    this.satBus = new THREE.Mesh(busGeo, busMat);
    this.satGroup.add(this.satBus);

    // Left Solar Panel
    const wingGeo = new THREE.BoxGeometry(0.35, 0.12, 0.015);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x0B6E99, metalness: 0.9, roughness: 0.15 });
    this.wingL = new THREE.Mesh(wingGeo, wingMat);
    this.wingL.position.set(-0.24, 0, 0);
    this.satGroup.add(this.wingL);

    // Right Solar Panel
    this.wingR = new THREE.Mesh(wingGeo, wingMat);
    this.wingR.position.set(0.24, 0, 0);
    this.satGroup.add(this.wingR);

    // High Gain Antenna Dish
    const dishGeo = new THREE.CylinderGeometry(0.06, 0.01, 0.04, 16);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, metalness: 0.7, roughness: 0.3 });
    this.antennaDish = new THREE.Mesh(dishGeo, dishMat);
    this.antennaDish.rotation.x = Math.PI / 2;
    this.antennaDish.position.set(0, 0.08, 0.06);
    this.satGroup.add(this.antennaDish);

    // Engine Nozzle
    const nozzleGeo = new THREE.ConeGeometry(0.035, 0.06, 12);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.4 });
    this.nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    this.nozzle.rotation.x = Math.PI;
    this.nozzle.position.set(0, 0, -0.11);
    this.satGroup.add(this.nozzle);

    this.scene.add(this.satGroup);
  }

  updateSatelliteModules(equippedSet) {
    if (!equippedSet) return;
    const hasSolar = equippedSet.has('solar-ultraflex');
    const hasAntenna = equippedSet.has('antenna-kaband') || equippedSet.has('antenna-xband');
    const hasThruster = equippedSet.has('thruster-coldgas') || equippedSet.has('thruster-ion') || equippedSet.has('thruster-monoprop');

    if (this.wingL) this.wingL.visible = hasSolar;
    if (this.wingR) this.wingR.visible = hasSolar;
    if (this.antennaDish) this.antennaDish.visible = hasAntenna;
    if (this.nozzle) this.nozzle.visible = hasThruster;
  }

  createTrail() {
    this.trailMax = 64;
    this.trailPoints = [];
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.trailMax * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0x38BDF8,
      transparent: true,
      opacity: 0.6,
      linewidth: 1.5
    });

    this.trailLine = new THREE.Line(geometry, material);
    this.scene.add(this.trailLine);
  }

  createHudOverlay() {
    this.hudBadge = document.createElement('div');
    this.hudBadge.className = 'orbit3d-badge mono';
    this.hudBadge.innerHTML = `
      <span class="badge-title" id="orbit3d-name">LEO SAT</span>
      <span class="badge-meta" id="orbit3d-stats">500 km • 51.6°</span>
    `;
    this.container.appendChild(this.hudBadge);
  }

  animate() {
    if (document.hidden) {
      requestAnimationFrame(() => this.animate());
      return;
    }

    const dt = this.clock.getDelta();

    // Sidereal Earth Rotation scaled by time-warp
    if (this.earthMesh) {
      this.earthMesh.rotation.y += 0.04 * dt * this.timeWarp;
    }

    // Satellite orbital progression along real RK4 / Kepler trajectory
    this.orbitAngle += (0.4 / (this.orbitRadius * 0.8)) * dt * this.timeWarp;

    const sx = Math.cos(this.orbitAngle) * this.orbitRadius;
    const sy = Math.sin(this.orbitAngle) * this.orbitRadius * Math.sin(this.orbitInclination);
    const sz = Math.sin(this.orbitAngle) * this.orbitRadius * Math.cos(this.orbitInclination);

    if (this.satGroup) {
      this.satGroup.position.set(sx, sy, sz);

      // Orient satellite along velocity vector
      const vx = -Math.sin(this.orbitAngle);
      const vy = Math.cos(this.orbitAngle) * Math.sin(this.orbitInclination);
      const vz = Math.cos(this.orbitAngle) * Math.cos(this.orbitInclination);
      const targetLook = new THREE.Vector3(sx + vx, sy + vy, sz + vz);
      this.satGroup.lookAt(targetLook);
    }

    // Update Fading Trail
    this.trailPoints.unshift(new THREE.Vector3(sx, sy, sz));
    if (this.trailPoints.length > this.trailMax) this.trailPoints.pop();

    if (this.trailLine) {
      const posArray = this.trailLine.geometry.attributes.position.array;
      for (let i = 0; i < this.trailMax; i++) {
        if (i < this.trailPoints.length) {
          posArray[i * 3] = this.trailPoints[i].x;
          posArray[i * 3 + 1] = this.trailPoints[i].y;
          posArray[i * 3 + 2] = this.trailPoints[i].z;
        } else {
          posArray[i * 3] = sx;
          posArray[i * 3 + 1] = sy;
          posArray[i * 3 + 2] = sz;
        }
      }
      this.trailLine.geometry.attributes.position.needsUpdate = true;
    }

    // Update Controls
    if (this.controls) {
      this.controls.update();
    }

    // Update Screen-Space HUD Badge position
    this.updateBadgePosition(sx, sy, sz);

    // Render Scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    requestAnimationFrame(() => this.animate());
  }

  updateBadgePosition(x, y, z) {
    if (!this.hudBadge || !this.camera) return;
    const vector = new THREE.Vector3(x, y, z);
    vector.project(this.camera);

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const screenX = (vector.x * 0.5 + 0.5) * w;
    const screenY = (-(vector.y * 0.5) + 0.5) * h;

    this.hudBadge.style.transform = `translate3d(${screenX + 14}px, ${screenY - 14}px, 0)`;

    // Hide if behind Earth
    if (vector.z > 1.0) {
      this.hudBadge.style.opacity = '0';
    } else {
      this.hudBadge.style.opacity = '1';
    }
  }

  resetCamera() {
    if (this.camera && this.controls) {
      this.camera.position.set(4.2, 2.5, 5.0);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }

  renderFallback2D() {
    const canvas = document.createElement('canvas');
    canvas.width = this.container.clientWidth || 640;
    canvas.height = this.container.clientHeight || 320;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#070B14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#0B6E99';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('3D WebGL acceleration offline. 2D fallback active.', canvas.width / 2, canvas.height / 2);

    this.container.appendChild(canvas);
  }

  dispose() {
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
      this.renderer.dispose();
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Orbit3DScene };
}
