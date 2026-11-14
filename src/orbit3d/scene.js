/* ═══════════════════════════════════════════════════════════════
   AETHEL // JPL — 3D Earth Orbit Visualization Engine
   Three.js Realtime Astrodynamics Viewport (Refined Photorealistic Earth)
   ═══════════════════════════════════════════════════════════════ */

'use strict';

class Orbit3DScene {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.options = options;
    this.isWebGLAvailable = this.checkWebGL();
    this.currentMission = 'leo';
    this.timeWarp = 1;
    this.activeTab = '3d';
    this.state = options.state || null;

    this.userInteracting = false;
    this.idleTimer = null;
    this.autoRotateSpeed = 0.05;

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

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070B14); // Dark navy void

    // 2. Camera (Framing Earth at 55% - 65% of viewport height)
    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 1000);
    this.camera.position.set(5.0, 2.2, 5.8);

    // 3. Renderer with sRGB encoding & ACESFilmic tone mapping
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // Three.js r128 color space encoding
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
      this.controls.minDistance = 2.8;
      this.controls.maxDistance = 20.0;
      this.controls.maxPolarAngle = Math.PI - 0.05;

      this.controls.addEventListener('start', () => {
        this.userInteracting = true;
        if (this.idleTimer) clearTimeout(this.idleTimer);
      });

      this.controls.addEventListener('end', () => {
        if (this.idleTimer) clearTimeout(this.idleTimer);
        // Resume auto-rotation after 5 seconds of idle
        this.idleTimer = setTimeout(() => {
          this.userInteracting = false;
        }, 5000);
      });
    }

    // 5. Lighting (Directional upper-right so 65%-75% of disc is lit + Hemisphere fill)
    // Hemisphere fill ensures night side is soft deep blue-navy, never pitch black
    this.hemiLight = new THREE.HemisphereLight(0xBCD6FF, 0x0B1220, 0.55);
    this.scene.add(this.hemiLight);

    // Key sunlight placed upper-right
    this.sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.45);
    this.sunLight.position.set(8.0, 3.5, 6.0);
    this.scene.add(this.sunLight);

    // 6. Subtle Starfield
    this.createStarfield();

    // 7. Earth Globe + Clouds + Atmosphere
    this.createEarth();

    // 8. 2px Orbit Line
    this.createOrbitLine();

    // 9. 4x Scaled Satellite Model
    this.createSatellite();

    // 10. Fading Orbit Trail
    this.createTrail();

    // 11. High-Readability 14px HTML HUD Badge
    this.createHudOverlay();

    // ResizeObserver
    this.setupResize();

    // Animation Loop
    this.clock = new THREE.Clock();
    this.orbitAngle = 0;
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
    const starCount = 1200;
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

  createEarth() {
    const radius = 2.0;
    const segments = 64;
    this.earthRadius = radius;

    const textureLoader = new THREE.TextureLoader();
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy() || 8;

    // Load NASA Blue Marble day texture (2048x1024)
    const dayTexture = textureLoader.load('assets/textures/earth_day_2048.jpg', (tex) => {
      if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = maxAnisotropy;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.needsUpdate = true;
    }, undefined, () => {
      this.showTextureError('NASA Blue Marble map could not be loaded; using standard fallback.');
    });

    const earthGeo = new THREE.SphereGeometry(radius, segments, segments);
    const earthMat = new THREE.MeshStandardMaterial({
      map: dayTexture,
      roughness: 0.65,
      metalness: 0.05
    });

    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.scene.add(this.earthMesh);

    // Subtle Cloud Sphere (slightly larger R=2.018, opacity 0.35)
    const cloudTexture = textureLoader.load('assets/textures/earth_clouds.png', (tex) => {
      if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = maxAnisotropy;
      tex.needsUpdate = true;
    });

    const cloudGeo = new THREE.SphereGeometry(radius * 1.012, segments, segments);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      roughness: 0.9
    });

    this.cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    this.scene.add(this.cloudMesh);

    // Soft Fresnel Atmosphere Rim Glow (soft blue #5aa9ff at 40% alpha)
    const atmoGeo = new THREE.SphereGeometry(radius * 1.025, segments, segments);
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
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
          gl_FragColor = vec4(0.35, 0.66, 1.0, 1.0) * intensity * 0.40;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });

    this.atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    this.scene.add(this.atmoMesh);
  }

  showTextureError(msg) {
    const errBox = document.createElement('div');
    errBox.className = 'vp-texture-err';
    errBox.textContent = msg;
    this.container.appendChild(errBox);
  }

  createOrbitLine() {
    const pointsCount = 128;
    this.orbitRadius = 2.22; // 500 km at R=2.0
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
      color: 0x0B6E99, // Accent deep blue-teal
      linewidth: 2.0,
      transparent: true,
      opacity: 0.90
    });

    this.orbitLine = new THREE.Line(geometry, material);
    this.scene.add(this.orbitLine);
  }

  updateOrbitTrajectory(missionType) {
    this.currentMission = missionType;
    let r = 2.22;
    let incDeg = 51.6;

    if (missionType === 'lunar') {
      r = 3.6;
      incDeg = 28.5;
    } else if (missionType === 'mars') {
      r = 4.4;
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

    // 4X LARGER SCALE MODEL
    // Central Bus Frame
    const busGeo = new THREE.BoxGeometry(0.36, 0.36, 0.48);
    const busMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, metalness: 0.85, roughness: 0.2 });
    this.satBus = new THREE.Mesh(busGeo, busMat);
    this.satGroup.add(this.satBus);

    // Bright Satellite Position Marker (Visible dot)
    const markerGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    this.marker = new THREE.Mesh(markerGeo, markerMat);
    this.satGroup.add(this.marker);

    // Left Solar Panel Array (UltraFlex)
    const wingGeo = new THREE.BoxGeometry(1.0, 0.32, 0.03);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x0B6E99, metalness: 0.9, roughness: 0.15 });
    this.wingL = new THREE.Mesh(wingGeo, wingMat);
    this.wingL.position.set(-0.72, 0, 0);
    this.satGroup.add(this.wingL);

    // Right Solar Panel Array
    this.wingR = new THREE.Mesh(wingGeo, wingMat);
    this.wingR.position.set(0.72, 0, 0);
    this.satGroup.add(this.wingR);

    // High Gain Antenna Dish
    const dishGeo = new THREE.CylinderGeometry(0.22, 0.04, 0.12, 16);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, metalness: 0.7, roughness: 0.3 });
    this.antennaDish = new THREE.Mesh(dishGeo, dishMat);
    this.antennaDish.rotation.x = Math.PI / 2;
    this.antennaDish.position.set(0, 0.28, 0.18);
    this.satGroup.add(this.antennaDish);

    // Engine Nozzle
    const nozzleGeo = new THREE.ConeGeometry(0.12, 0.20, 14);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.4 });
    this.nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    this.nozzle.rotation.x = Math.PI;
    this.nozzle.position.set(0, 0, -0.32);
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
    this.trailMax = 72;
    this.trailPoints = [];
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.trailMax * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0x38BDF8,
      transparent: true,
      opacity: 0.75,
      linewidth: 2.0
    });

    this.trailLine = new THREE.Line(geometry, material);
    this.scene.add(this.trailLine);
  }

  createHudOverlay() {
    this.hudBadge = document.createElement('div');
    this.hudBadge.className = 'satellite-label-pill';
    this.hudBadge.innerHTML = `
      <div class="pill-dot"></div>
      <div class="pill-text">
        <span class="pill-title" id="hud-pill-name">LEO SAT</span>
        <span class="pill-meta" id="hud-pill-meta">500 km • 51.6°</span>
      </div>
    `;
    this.container.appendChild(this.hudBadge);
  }

  animate() {
    if (document.hidden) {
      requestAnimationFrame(() => this.animate());
      return;
    }

    const dt = this.clock.getDelta();

    // Slow automatic rotation until user drags, then resume after idle
    if (!this.userInteracting) {
      if (this.earthMesh) this.earthMesh.rotation.y += this.autoRotateSpeed * dt * this.timeWarp;
      if (this.cloudMesh) this.cloudMesh.rotation.y += (this.autoRotateSpeed * 1.25) * dt * this.timeWarp;
    }

    // Satellite progression along orbit path
    this.orbitAngle += (0.35 / (this.orbitRadius * 0.75)) * dt * this.timeWarp;

    const sx = Math.cos(this.orbitAngle) * this.orbitRadius;
    const sy = Math.sin(this.orbitAngle) * this.orbitRadius * Math.sin(this.orbitInclination);
    const sz = Math.sin(this.orbitAngle) * this.orbitRadius * Math.cos(this.orbitInclination);

    if (this.satGroup) {
      this.satGroup.position.set(sx, sy, sz);

      const vx = -Math.sin(this.orbitAngle);
      const vy = Math.cos(this.orbitAngle) * Math.sin(this.orbitInclination);
      const vz = Math.cos(this.orbitAngle) * Math.cos(this.orbitInclination);
      this.satGroup.lookAt(new THREE.Vector3(sx + vx, sy + vy, sz + vz));
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

    // Project Satellite 14px Pill Badge
    this.updatePillBadge(sx, sy, sz);

    // Render Scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    requestAnimationFrame(() => this.animate());
  }

  updatePillBadge(x, y, z) {
    if (!this.hudBadge || !this.camera) return;
    const vector = new THREE.Vector3(x, y, z);
    vector.project(this.camera);

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const screenX = (vector.x * 0.5 + 0.5) * w;
    const screenY = (-(vector.y * 0.5) + 0.5) * h;

    this.hudBadge.style.transform = `translate3d(${screenX + 16}px, ${screenY - 18}px, 0)`;

    // Check if satellite is occluded behind the Earth sphere
    if (vector.z > 0.99) {
      this.hudBadge.style.opacity = '0';
    } else {
      this.hudBadge.style.opacity = '1';
    }
  }

  resetCamera() {
    if (this.camera && this.controls) {
      this.camera.position.set(5.0, 2.2, 5.8);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
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
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Orbit3DScene };
}
