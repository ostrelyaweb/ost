import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { buildModel } from './models.js';
import { floors, lighting, room } from './catalog.js';

function floorTexture(finish) {
  const image = document.createElement('canvas');
  image.width = 1024;
  image.height = 832;
  const ctx = image.getContext('2d');
  ctx.fillStyle = finish.color;
  ctx.fillRect(0, 0, image.width, image.height);
  if (finish.pattern === 'planks') {
    for (let y = 0; y < image.height; y += 24) {
      ctx.fillStyle = y % 48 ? '#d8b58b44' : '#66412025';
      ctx.fillRect(0, y, image.width, 24);
      ctx.fillStyle = '#5d432d64';
      ctx.fillRect(0, y, image.width, 1);
      for (let x = (y * 5) % 210; x < image.width; x += 210) ctx.fillRect(x, y, 1, 24);
    }
    for (let i = 0; i < 1600; i++) {
      ctx.fillStyle = i % 2 ? '#d8b58b54' : '#66412030';
      ctx.fillRect(i * 59 % 1024, i * 83 % 832, 10 + i % 77, 1);
    }
  } else if (finish.pattern === 'tiles') {
    ctx.strokeStyle = '#8f88755c';
    ctx.lineWidth = 2;
    for (let y = 0; y < 832; y += 83) {
      for (let x = y % 2 ? -52 : 0; x < 1024; x += 104) ctx.strokeRect(x, y, 104, 83);
    }
  } else {
    for (let i = 0; i < 4500; i++) {
      ctx.fillStyle = i % 2 ? '#c4c6be32' : '#4547412e';
      ctx.fillRect(i * 67 % 1024, i * 53 % 832, 1 + i % 3, 1 + i % 2);
    }
  }
  const texture = new THREE.CanvasTexture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createRoomScene(container, interaction) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Interactive 3D view of the hotel lobby');
  container.append(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d6d5c8');
  const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, .1, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.minPolarAngle = .12;
  controls.maxPolarAngle = Math.PI / 2.12;
  controls.minZoom = .68;
  controls.maxZoom = 2.7;
  controls.enablePan = false;

  const hemisphere = new THREE.HemisphereLight('#fff3df', '#737769', 1.55);
  const sun = new THREE.DirectionalLight('#fff2db', 2.35);
  sun.position.set(2.6, 8, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, far: 24 });
  sun.shadow.bias = -.00018;
  sun.shadow.normalBias = .018;
  scene.add(hemisphere, sun);

  const floorMaterial = new THREE.MeshStandardMaterial({ roughness: .86 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(room.width, room.depth), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(room.width, .19, room.depth), new THREE.MeshStandardMaterial({ color: '#535548' }));
  slab.position.y = -.101;
  slab.receiveShadow = true;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#d6d5c8', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.199;
  ground.receiveShadow = true;
  scene.add(ground, slab, floor);

  const outline = new THREE.Box3Helper(new THREE.Box3(), '#93ad38');
  outline.visible = false;
  outline.material.depthTest = false;
  outline.renderOrder = 10;
  scene.add(outline);

  const objects = new Map();
  let floorKey;
  let lightingKey;
  let active = false;
  let frame = 0;
  let dragging = null;

  function draw() {
    if (!active || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (active) renderer.render(scene, camera);
    });
  }

  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    const aspect = width / height;
    const span = Math.max(9.7, 13.7 / aspect);
    camera.top = span / 2;
    camera.bottom = -span / 2;
    camera.left = -span * aspect / 2;
    camera.right = span * aspect / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    draw();
  }

  function resetCamera() {
    camera.position.set(10, 8.4, 13);
    controls.target.set(0, .55, 0);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    controls.update();
    draw();
  }

  controls.addEventListener('change', draw);
  new ResizeObserver(resize).observe(container);
  resetCamera();

  function discard(model) {
    scene.remove(model);
    model.traverse((child) => {
      if (child.userData.disposable) child.geometry.dispose();
    });
  }

  function sync(state, selectedId) {
    const remaining = new Set(objects.keys());
    let fixtureCount = 0;
    for (const item of state.items) {
      remaining.delete(item.id);
      const signature = [item.design, item.finish, item.width, item.height, item.on].join(':');
      let entry = objects.get(item.id);
      if (entry?.signature !== signature) {
        if (entry) discard(entry.model);
        const model = buildModel(item);
        model.userData.itemId = item.id;
        const fixtures = model.children.filter((child) => child.userData.fixture);
        entry = { signature, model, fixtures };
        objects.set(item.id, entry);
        scene.add(model);
      }
      entry.model.position.set(item.x, 0, item.z);
      entry.model.rotation.y = -item.angle * Math.PI / 180;
      for (const fixture of entry.fixtures) fixture.visible = fixtureCount++ < 6;
    }
    for (const id of remaining) {
      discard(objects.get(id).model);
      objects.delete(id);
    }

    if (floorKey !== state.floor) {
      floorMaterial.map?.dispose();
      floorMaterial.map = floorTexture(floors[state.floor]);
      floorMaterial.needsUpdate = true;
      floorKey = state.floor;
    }
    if (lightingKey !== state.light) {
      const light = lighting[state.light];
      hemisphere.color.set(light.sky);
      hemisphere.intensity = light.fill;
      sun.color.set(light.sun);
      sun.intensity = light.strength;
      lightingKey = state.light;
    }

    const selected = objects.get(selectedId)?.model;
    outline.visible = Boolean(selected);
    if (selected) outline.box.setFromObject(selected);
    draw();
  }

  const raycaster = new THREE.Raycaster();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  function rayAt(event) {
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    ), camera);
  }
  function floorPoint() {
    const hit = raycaster.ray.intersectPlane(floorPlane, new THREE.Vector3());
    return hit && { x: hit.x, z: hit.z };
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !event.isPrimary || event.altKey) return;
    rayAt(event);
    const hit = raycaster.intersectObjects([...objects.values()].map(({ model }) => model), true)[0];
    let model = hit?.object;
    while (model && !model.userData.itemId) model = model.parent;
    const position = floorPoint();
    if (!model || !position || !interaction.start(model.userData.itemId, position)) return;
    event.stopImmediatePropagation();
    event.preventDefault();
    controls.enabled = false;
    dragging = event.pointerId;
    canvas.setPointerCapture(dragging);
  }, true);
  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId !== dragging) return;
    rayAt(event);
    const position = floorPoint();
    if (position) interaction.move(position);
  });
  function stop(event) {
    if (event.pointerId !== dragging) return;
    dragging = null;
    controls.enabled = true;
    interaction.end();
  }
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  canvas.addEventListener('lostpointercapture', stop);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    if (dragging !== null) {
      dragging = null;
      interaction.end();
    }
    interaction.unavailable();
  });

  return { sync, resetCamera, show(visible) { active = visible; if (visible) resize(); } };
}
