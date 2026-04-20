import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="app-shell">
    <div class="hud">
      <h1>Simulasi Tabrakan Benda 3D</h1>
      <p>
        Ubah massa dan kecepatan awal tiap benda, lalu amati tumbukan, vektor momentum,
        serta perubahan geraknya di arena 3D.
      </p>

      <div class="stats">
        <div class="stat-card">
          <span class="stat-label">Status</span>
          <span class="stat-value" data-status>Memuat...</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Jumlah tabrakan</span>
          <span class="stat-value" data-collision-count>0</span>
        </div>
        <div class="stat-card wide">
          <span class="stat-label">Tumbukan terakhir</span>
          <span class="stat-value small" data-last-collision>-</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Mode waktu</span>
          <span class="stat-value" data-time-mode>Normal</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Momentum total</span>
          <span class="stat-value small" data-system-momentum>0.00 kg·m/s</span>
        </div>
      </div>

      <div class="controls">
        <button data-apply>Terapkan parameter</button>
        <button class="secondary" data-relaunch>Luncurkan ulang</button>
        <button class="secondary" data-pause>Pause</button>
        <button class="secondary" data-slowmo>Slow motion</button>
      </div>

      <div class="slider-panel">
        <div class="slider-card slider-blue">
          <h2>Bola kiri</h2>
          <label>
            Massa <span data-value="left-mass">1.60 kg</span>
            <input data-input="left-mass" type="range" min="0.5" max="5" step="0.1" value="1.6" />
          </label>
          <label>
            Kecepatan awal <span data-value="left-speed">9.00 m/s</span>
            <input data-input="left-speed" type="range" min="0" max="18" step="0.1" value="9" />
          </label>
        </div>

        <div class="slider-card slider-orange">
          <h2>Bola kanan</h2>
          <label>
            Massa <span data-value="right-mass">1.60 kg</span>
            <input data-input="right-mass" type="range" min="0.5" max="5" step="0.1" value="1.6" />
          </label>
          <label>
            Kecepatan awal <span data-value="right-speed">9.00 m/s</span>
            <input data-input="right-speed" type="range" min="0" max="18" step="0.1" value="9" />
          </label>
        </div>

        <div class="slider-card slider-green">
          <h2>Kubus tengah</h2>
          <label>
            Massa <span data-value="center-mass">2.20 kg</span>
            <input data-input="center-mass" type="range" min="0.5" max="6" step="0.1" value="2.2" />
          </label>
          <label>
            Kecepatan awal <span data-value="center-speed">0.00 m/s</span>
            <input data-input="center-speed" type="range" min="0" max="12" step="0.1" value="0" />
          </label>
        </div>
      </div>

      <div class="toggle-row">
        <label class="toggle-pill">
          <input data-toggle="show-vectors" type="checkbox" checked />
          <span>Tampilkan vektor momentum</span>
        </label>
        <label class="toggle-pill">
          <input data-toggle="show-labels" type="checkbox" checked />
          <span>Tampilkan label momentum</span>
        </label>
      </div>

      <div class="legend">
        Drag untuk memutar kamera. Scroll untuk zoom. Tekan <strong>Terapkan parameter</strong>
        setelah mengubah slider agar simulasi dibuat ulang dengan massa dan kecepatan baru.
      </div>
    </div>

    <div class="momentum-overlay" data-overlay></div>
    <canvas class="webgl"></canvas>
    <div class="credit">Vite + Three.js + Rapier + requestAnimationFrame</div>
  </div>
`;

const canvas = document.querySelector('.webgl');
const overlay = document.querySelector('[data-overlay]');
const statusValue = document.querySelector('[data-status]');
const collisionCountValue = document.querySelector('[data-collision-count]');
const lastCollisionValue = document.querySelector('[data-last-collision]');
const timeModeValue = document.querySelector('[data-time-mode]');
const systemMomentumValue = document.querySelector('[data-system-momentum]');
const applyButton = document.querySelector('[data-apply]');
const relaunchButton = document.querySelector('[data-relaunch]');
const pauseButton = document.querySelector('[data-pause]');
const slowMoButton = document.querySelector('[data-slowmo]');
const sliderInputs = [...document.querySelectorAll('[data-input]')];
const sliderValues = Object.fromEntries(
  [...document.querySelectorAll('[data-value]')].map((node) => [node.dataset.value, node]),
);
const vectorToggle = document.querySelector('[data-toggle="show-vectors"]');
const labelToggle = document.querySelector('[data-toggle="show-labels"]');

const parameters = {
  leftMass: 1.6,
  leftSpeed: 9.0,
  rightMass: 1.6,
  rightSpeed: 9.0,
  centerMass: 2.2,
  centerSpeed: 0.0,
  showVectors: true,
  showLabels: true,
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071018);
scene.fog = new THREE.Fog(0x071018, 18, 42);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(9.5, 7.2, 11.5);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 2, 0);
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 6;
controls.maxDistance = 28;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
directionalLight.position.set(8, 13, 7);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(2048, 2048);
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 40;
directionalLight.shadow.camera.left = -16;
directionalLight.shadow.camera.right = 16;
directionalLight.shadow.camera.top = 16;
directionalLight.shadow.camera.bottom = -16;
scene.add(directionalLight);

const gridHelper = new THREE.GridHelper(22, 22, 0x5b9cff, 0x27405e);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x16314d,
  metalness: 0.08,
  roughness: 0.85,
});
const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 18), floorMaterial);
floorMesh.position.set(0, -0.3, 0);
floorMesh.receiveShadow = true;
scene.add(floorMesh);

const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0x0f1c2b,
  metalness: 0.05,
  roughness: 0.9,
});
const wallGeometryA = new THREE.BoxGeometry(18, 2.6, 0.5);
const wallGeometryB = new THREE.BoxGeometry(0.5, 2.6, 18);
[
  { geometry: wallGeometryA, position: [0, 1, -9.25] },
  { geometry: wallGeometryA, position: [0, 1, 9.25] },
  { geometry: wallGeometryB, position: [-9.25, 1, 0] },
  { geometry: wallGeometryB, position: [9.25, 1, 0] },
].forEach(({ geometry, position }) => {
  const mesh = new THREE.Mesh(geometry, wallMaterial);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
});

const bodyEntries = [];
const colliderLabels = new Map();
const tmpVec = new THREE.Vector3();
const tmpDir = new THREE.Vector3();
const clock = new THREE.Clock();
const fixedStep = 1 / 60;
const launchDirections = {
  left: new THREE.Vector3(1, 0.03, 0.22).normalize(),
  right: new THREE.Vector3(-1, 0.03, -0.22).normalize(),
  center: new THREE.Vector3(0.18, 0, -1).normalize(),
};

let collisionCount = 0;
let isPaused = false;
let slowMotion = false;
let accumulator = 0;
let world = null;
let eventQueue = null;

const RAPIER = (await import('@dimforge/rapier3d-compat')).default;

function formatNumber(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function updateSliderReadouts() {
  sliderValues['left-mass'].textContent = `${formatNumber(parameters.leftMass, 2)} kg`;
  sliderValues['left-speed'].textContent = `${formatNumber(parameters.leftSpeed, 2)} m/s`;
  sliderValues['right-mass'].textContent = `${formatNumber(parameters.rightMass, 2)} kg`;
  sliderValues['right-speed'].textContent = `${formatNumber(parameters.rightSpeed, 2)} m/s`;
  sliderValues['center-mass'].textContent = `${formatNumber(parameters.centerMass, 2)} kg`;
  sliderValues['center-speed'].textContent = `${formatNumber(parameters.centerSpeed, 2)} m/s`;
}

function setOverlayVisibility() {
  overlay.classList.toggle('hide-labels', !parameters.showLabels);
  bodyEntries.forEach((entry) => {
    entry.arrow.visible = parameters.showVectors;
    entry.labelEl.classList.toggle('hidden', !parameters.showLabels);
  });
}

function updateStats() {
  statusValue.textContent = isPaused ? 'Pause' : 'Berjalan';
  collisionCountValue.textContent = String(collisionCount);
  timeModeValue.textContent = slowMotion ? 'Lambat' : 'Normal';
  pauseButton.textContent = isPaused ? 'Lanjutkan' : 'Pause';
  slowMoButton.textContent = slowMotion ? 'Waktu normal' : 'Slow motion';
}

function registerStaticArena() {
  const floorBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.3, 0));
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(9, 0.3, 9)
      .setFriction(0.65)
      .setRestitution(0.25),
    floorBody,
  );

  const wallSpecs = [
    { size: [9, 1.3, 0.25], pos: [0, 1, -9.25] },
    { size: [9, 1.3, 0.25], pos: [0, 1, 9.25] },
    { size: [0.25, 1.3, 9], pos: [-9.25, 1, 0] },
    { size: [0.25, 1.3, 9], pos: [9.25, 1, 0] },
  ];

  wallSpecs.forEach(({ size, pos }) => {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(...pos));
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(...size)
        .setFriction(0.35)
        .setRestitution(0.8),
      body,
    );
  });
}

function createMomentumLabel(colorHex) {
  const el = document.createElement('div');
  el.className = 'momentum-label';
  el.style.setProperty('--label-accent', `#${colorHex.toString(16).padStart(6, '0')}`);
  overlay.appendChild(el);
  return el;
}

function createDynamicBody({ label, kind, color, geometry, colliderDesc, translation, speed, mass }) {
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.12,
    roughness: kind === 'cube' ? 0.28 : 0.22,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const rigidBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(translation.x, translation.y, translation.z)
      .setLinearDamping(0.08)
      .setAngularDamping(0.08),
  );
  const collider = world.createCollider(
    colliderDesc
      .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
      .setFriction(0.2)
      .setRestitution(0.92),
    rigidBody,
  );
  collider.setMass(mass);
  rigidBody.recomputeMassPropertiesFromColliders();
  colliderLabels.set(collider.handle, label);

  const arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 0.001, color, 0.35, 0.18);
  arrow.visible = parameters.showVectors;
  scene.add(arrow);

  const labelEl = createMomentumLabel(color);

  const entry = {
    label,
    kind,
    mesh,
    rigidBody,
    collider,
    arrow,
    labelEl,
    baseColor: new THREE.Color(color),
    flash: 0,
    launchSpeed: speed,
    launchDirection: launchDirections[kind].clone(),
    initialTranslation: translation.clone(),
    initialRotation: new THREE.Quaternion(),
  };

  bodyEntries.push(entry);
  return entry;
}

function clearDynamicBodies() {
  while (bodyEntries.length) {
    const entry = bodyEntries.pop();
    scene.remove(entry.mesh);
    scene.remove(entry.arrow);
    entry.mesh.geometry.dispose();
    entry.mesh.material.dispose();
    entry.arrow.line.geometry.dispose();
    entry.arrow.line.material.dispose();
    entry.arrow.cone.geometry.dispose();
    entry.arrow.cone.material.dispose();
    entry.labelEl.remove();
  }
  colliderLabels.clear();
}

function buildPhysicsWorld() {
  clearDynamicBodies();

  if (eventQueue) {
    eventQueue.free();
  }
  if (world) {
    world.free();
  }

  eventQueue = new RAPIER.EventQueue(true);
  world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  registerStaticArena();

  createDynamicBody({
    label: 'Bola kiri',
    kind: 'left',
    color: 0x38bdf8,
    geometry: new THREE.SphereGeometry(0.7, 48, 48),
    colliderDesc: RAPIER.ColliderDesc.ball(0.7),
    translation: new THREE.Vector3(-5.4, 1.45, -1.4),
    speed: parameters.leftSpeed,
    mass: parameters.leftMass,
  });

  createDynamicBody({
    label: 'Bola kanan',
    kind: 'right',
    color: 0xf97316,
    geometry: new THREE.SphereGeometry(0.7, 48, 48),
    colliderDesc: RAPIER.ColliderDesc.ball(0.7),
    translation: new THREE.Vector3(5.4, 1.45, 1.3),
    speed: parameters.rightSpeed,
    mass: parameters.rightMass,
  });

  createDynamicBody({
    label: 'Kubus tengah',
    kind: 'center',
    color: 0x22c55e,
    geometry: new THREE.BoxGeometry(1.35, 1.35, 1.35),
    colliderDesc: RAPIER.ColliderDesc.cuboid(0.675, 0.675, 0.675),
    translation: new THREE.Vector3(0, 1.8, 0),
    speed: parameters.centerSpeed,
    mass: parameters.centerMass,
  });

  collisionCount = 0;
  accumulator = 0;
  lastCollisionValue.textContent = '-';
  updateStats();
  setOverlayVisibility();
  launchBodies();
}

function launchBodies() {
  collisionCount = 0;
  lastCollisionValue.textContent = '-';
  accumulator = 0;

  bodyEntries.forEach((entry) => {
    entry.flash = 0;
    entry.mesh.material.color.copy(entry.baseColor);
    entry.rigidBody.setTranslation(entry.initialTranslation, true);
    entry.rigidBody.setRotation(entry.initialRotation, true);
    entry.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    entry.rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
    entry.rigidBody.resetForces(true);
    entry.rigidBody.resetTorques(true);

    const mass = entry.rigidBody.mass();
    const direction = entry.launchDirection;
    const speed = entry.launchSpeed;
    const impulse = {
      x: direction.x * speed * mass,
      y: direction.y * speed * mass,
      z: direction.z * speed * mass,
    };
    entry.rigidBody.applyImpulse(impulse, true);
    entry.rigidBody.applyTorqueImpulse(
      {
        x: (Math.random() - 0.5) * 1.8,
        y: (Math.random() - 0.5) * 1.8,
        z: (Math.random() - 0.5) * 1.8,
      },
      true,
    );
  });

  updateStats();
}

function markCollision(labelA, labelB) {
  collisionCount += 1;
  const timestamp = new Date().toLocaleTimeString('id-ID');
  lastCollisionValue.textContent = `${labelA} × ${labelB} • ${timestamp}`;

  bodyEntries.forEach((entry) => {
    if (entry.label === labelA || entry.label === labelB) {
      entry.flash = 0.55;
    }
  });

  updateStats();
}

function updateEntryVisual(entry) {
  const position = entry.rigidBody.translation();
  const rotation = entry.rigidBody.rotation();
  const velocity = entry.rigidBody.linvel();
  const mass = entry.rigidBody.mass();
  const momentum = {
    x: velocity.x * mass,
    y: velocity.y * mass,
    z: velocity.z * mass,
  };

  entry.mesh.position.set(position.x, position.y, position.z);
  entry.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);

  if (entry.flash > 0) {
    entry.flash = Math.max(0, entry.flash - 0.025);
    const highlight = entry.baseColor.clone().lerp(new THREE.Color(0xffffff), Math.min(1, entry.flash * 1.7));
    entry.mesh.material.color.copy(highlight);
  } else {
    entry.mesh.material.color.copy(entry.baseColor);
  }

  const magnitude = Math.hypot(momentum.x, momentum.y, momentum.z);
  tmpDir.set(momentum.x, momentum.y, momentum.z);
  if (magnitude > 0.0001) {
    tmpDir.normalize();
  } else {
    tmpDir.set(1, 0, 0);
  }

  const origin = new THREE.Vector3(position.x, position.y + 0.95, position.z);
  entry.arrow.position.copy(origin);
  entry.arrow.setDirection(tmpDir);
  entry.arrow.setLength(Math.max(0.2, Math.min(4.6, 0.16 * magnitude + 0.25)), 0.35, 0.18);

  tmpVec.copy(origin).add(new THREE.Vector3(0, 0.35, 0));
  tmpVec.project(camera);
  const x = (tmpVec.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-tmpVec.y * 0.5 + 0.5) * window.innerHeight;
  const isBehindCamera = tmpVec.z > 1;

  entry.labelEl.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
  entry.labelEl.style.opacity = isBehindCamera ? '0' : '1';
  entry.labelEl.innerHTML = `
    <strong>${entry.label}</strong>
    <span>m = ${formatNumber(mass)} kg</span>
    <span>v = ${formatNumber(Math.hypot(velocity.x, velocity.y, velocity.z))} m/s</span>
    <span>p = ${formatNumber(magnitude)} kg·m/s</span>
  `;

  return momentum;
}

function syncPhysicsToGraphics() {
  const totalMomentum = { x: 0, y: 0, z: 0 };
  bodyEntries.forEach((entry) => {
    const momentum = updateEntryVisual(entry);
    totalMomentum.x += momentum.x;
    totalMomentum.y += momentum.y;
    totalMomentum.z += momentum.z;
  });
  const resultant = Math.hypot(totalMomentum.x, totalMomentum.y, totalMomentum.z);
  systemMomentumValue.textContent = `${formatNumber(resultant)} kg·m/s`;
}

function stepPhysics(delta) {
  if (isPaused || !world || !eventQueue) {
    return;
  }

  const scaledDelta = Math.min(0.05, delta) * (slowMotion ? 0.28 : 1);
  accumulator += scaledDelta;

  while (accumulator >= fixedStep) {
    world.step(eventQueue);

    eventQueue.drainCollisionEvents((handleA, handleB, started) => {
      if (!started) {
        return;
      }
      const labelA = colliderLabels.get(handleA);
      const labelB = colliderLabels.get(handleB);
      if (labelA && labelB) {
        markCollision(labelA, labelB);
      }
    });

    accumulator -= fixedStep;
  }
}

sliderInputs.forEach((input) => {
  input.addEventListener('input', (event) => {
    const value = Number(event.currentTarget.value);
    switch (event.currentTarget.dataset.input) {
      case 'left-mass':
        parameters.leftMass = value;
        break;
      case 'left-speed':
        parameters.leftSpeed = value;
        break;
      case 'right-mass':
        parameters.rightMass = value;
        break;
      case 'right-speed':
        parameters.rightSpeed = value;
        break;
      case 'center-mass':
        parameters.centerMass = value;
        break;
      case 'center-speed':
        parameters.centerSpeed = value;
        break;
      default:
        break;
    }
    updateSliderReadouts();
  });
});

vectorToggle.addEventListener('change', () => {
  parameters.showVectors = vectorToggle.checked;
  setOverlayVisibility();
});

labelToggle.addEventListener('change', () => {
  parameters.showLabels = labelToggle.checked;
  setOverlayVisibility();
});

applyButton.addEventListener('click', () => {
  buildPhysicsWorld();
});

relaunchButton.addEventListener('click', () => {
  launchBodies();
});

pauseButton.addEventListener('click', () => {
  isPaused = !isPaused;
  updateStats();
});

slowMoButton.addEventListener('click', () => {
  slowMotion = !slowMotion;
  updateStats();
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener('beforeunload', () => {
  if (eventQueue) {
    eventQueue.free();
  }
  if (world) {
    world.free();
  }
});

await RAPIER.init();
updateSliderReadouts();
updateStats();
buildPhysicsWorld();

function animate() {
  const delta = clock.getDelta();
  stepPhysics(delta);
  syncPhysicsToGraphics();
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
}

animate();
