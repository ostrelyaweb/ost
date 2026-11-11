import { categories, designs, finishes, floors, lighting, room, createItem, starterRoom, footprint } from './catalog.js';

const byId = (id) => document.getElementById(id);
const storageKey = 'vanguard-room-studio-v1';
const plan = byId('plan');
const stage = plan.parentElement;
const planItems = byId('plan-items');
const objectEditor = byId('object-editor');
const status = byId('status');
const save = byId('save');
const undo = [];
const redo = [];
const svg = 'http://www.w3.org/2000/svg';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round = (value) => Math.round(value * 10) / 10;
const angle = (value) => ((Math.round(value) % 360) + 360) % 360;
let state = loadRoom();
let selectedId = null;
let scene = null;
let drag = null;
let planPointer = null;
let choseView = false;
let viewMode = 'plan';

function loadRoom() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved || !Object.hasOwn(floors, saved.floor) || !Object.hasOwn(lighting, saved.light) || !Array.isArray(saved.items)) return starterRoom();
    const ids = new Set();
    const items = saved.items.slice(0, room.maxItems).filter((item) => {
      if (!item || typeof item.id !== 'string' || ids.has(item.id) || !Object.hasOwn(categories, item.category)) return false;
      const category = categories[item.category];
      if (!category.designs.includes(item.design) || !category.finishes.includes(item.finish)) return false;
      if (![item.x, item.z, item.angle, item.width, item.height].every(Number.isFinite)) return false;
      ids.add(item.id);
      return true;
    }).map((item) => ({
      ...item, x: clamp(item.x, -5, 5), z: clamp(item.z, -4, 4), angle: angle(item.angle),
      width: clamp(item.width, .6, 10), height: clamp(item.height, 1, 4), on: item.on !== false
    }));
    return { floor: saved.floor, light: saved.light, items };
  } catch {
    return starterRoom();
  }
}

function markUnsaved() {
  save.disabled = false;
  status.textContent = 'Unsaved changes';
}

function persist() {
  if (drag) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    save.disabled = true;
    status.textContent = 'Saved in this browser';
  } catch {
    status.textContent = 'Could not save. Changes are kept in this tab.';
  }
}

function options(select, values, selected) {
  select.replaceChildren(...values.map(([key, label]) => new Option(label, key)));
  select.value = selected;
}

function entries(collection) {
  return Object.entries(collection).map(([key, value]) => [key, value.label]);
}

function selectedItem() {
  return state.items.find((item) => item.id === selectedId);
}

function pick(id) {
  selectedId = id || null;
  render();
}

function remember(previous) {
  undo.push(previous);
  if (undo.length > 40) undo.shift();
  redo.length = 0;
}

function change(next, id = selectedId) {
  if (drag) return;
  remember(state);
  state = next;
  selectedId = id;
  markUnsaved();
  render();
}

function restore(from, to) {
  if (!from.length || drag) return;
  to.push(state);
  state = from.pop();
  if (!selectedItem()) selectedId = null;
  markUnsaved();
  render();
}

function setItem(id, changes) {
  return { ...state, items: state.items.map((item) => item.id === id ? { ...item, ...changes } : item) };
}

function edit(changes) {
  const item = selectedItem();
  if (!item || !Object.entries(changes).some(([key, value]) => value !== item[key])) {
    updateInspector();
    return;
  }
  change(setItem(item.id, changes));
}

function place(item, x = item.x, z = item.z) {
  return {
    ...item,
    x: round(clamp(x, -room.width / 2, room.width / 2)),
    z: round(clamp(z, -room.depth / 2, room.depth / 2))
  };
}

function add(category, design) {
  if (state.items.length >= room.maxItems) {
    status.textContent = 'The room holds up to ' + room.maxItems + ' objects.';
    return;
  }
  const type = categories[category];
  const item = createItem(category, design, type.finishes[0], .2, 2.35);
  change({ ...state, items: [...state.items, item] }, item.id);
}

function duplicate() {
  const original = selectedItem();
  if (!original || state.items.length >= room.maxItems) return;
  const item = place({ ...original, id: crypto.randomUUID() }, original.x + (original.x > 4.4 ? -.55 : .55), original.z + (original.z > 3.5 ? -.4 : .4));
  change({ ...state, items: [...state.items, item] }, item.id);
}

function drawCatalog() {
  const key = byId('category').value;
  const category = categories[key];
  byId('catalog').replaceChildren(...category.designs.map((design) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', 'Add ' + designs[design].label);
    const icon = document.createElement('span');
    icon.className = 'room-catalog-icon';
    icon.textContent = category.icon;
    icon.setAttribute('aria-hidden', 'true');
    const sign = document.createElement('span');
    sign.className = 'room-add-sign';
    sign.textContent = '+';
    sign.setAttribute('aria-hidden', 'true');
    button.append(icon, designs[design].label, sign);
    button.addEventListener('click', () => add(key, design));
    return button;
  }));
}

function drawPlan() {
  byId('plan-floor').setAttribute('fill', floors[state.floor].color);
  const rugs = state.items.filter((item) => item.design === 'rug');
  const otherItems = state.items.filter((item) => item.design !== 'rug');
  planItems.replaceChildren(...[...rugs, ...otherItems].map((item) => {
    const [width, depth] = footprint(item);
    const group = document.createElementNS(svg, 'g');
    group.dataset.id = item.id;
    group.setAttribute('transform', 'translate(' + item.x + ' ' + item.z + ') rotate(' + item.angle + ')');
    const shape = document.createElementNS(svg, designs[item.design].round ? 'ellipse' : 'rect');
    const title = document.createElementNS(svg, 'title');
    title.textContent = designs[item.design].label;
    if (shape.localName === 'ellipse') {
      shape.setAttribute('rx', width / 2);
      shape.setAttribute('ry', depth / 2);
    } else {
      shape.setAttribute('x', -width / 2);
      shape.setAttribute('y', -depth / 2);
      shape.setAttribute('width', width);
      shape.setAttribute('height', depth);
      shape.setAttribute('rx', Math.min(.09, depth / 4));
    }
    const active = item.id === selectedId;
    shape.setAttribute('fill', item.category === 'light' && item.on ? '#f2ce79' : finishes[item.finish].color);
    shape.setAttribute('stroke', active ? '#d9ef83' : '#413e34');
    shape.setAttribute('stroke-width', active ? '.085' : '.035');
    group.append(title, shape);
    return group;
  }));
}

function updatePosition(item) {
  for (const key of ['x', 'z', 'angle', 'width', 'height']) byId(key).value = item[key];
}

function updateInspector() {
  const item = selectedItem();
  objectEditor.hidden = !item;
  byId('deselect').hidden = !item;
  byId('selection-help').hidden = Boolean(item);
  byId('selection-title').textContent = item ? designs[item.design].label : 'Object properties';
  if (!item) return;
  const category = categories[item.category];
  options(byId('variant'), category.designs.map((key) => [key, designs[key].label]), item.design);
  options(byId('finish'), category.finishes.map((key) => [key, finishes[key].label]), item.finish);
  byId('wall-fields').hidden = item.category !== 'wall';
  byId('lamp-field').hidden = item.category !== 'light';
  byId('lamp').checked = item.on;
  byId('duplicate').disabled = state.items.length >= room.maxItems;
  updatePosition(item);
}

function renderVisuals() {
  drawPlan();
  scene?.sync(state, selectedId);
}

function render() {
  byId('floor').value = state.floor;
  byId('light').value = state.light;
  const labels = new Map();
  const list = state.items.map((item) => {
    const label = designs[item.design].label;
    const count = (labels.get(label) || 0) + 1;
    labels.set(label, count);
    return [item.id, label + ' · ' + count];
  });
  options(byId('objects'), [['', 'Select an object'], ...list], selectedId || '');
  byId('object-count').textContent = state.items.length + ' objects in the room';
  byId('undo').disabled = !undo.length;
  byId('redo').disabled = !redo.length;
  updateInspector();
  renderVisuals();
}

const interaction = {
  start(id, position) {
    if (drag) return false;
    const item = state.items.find((entry) => entry.id === id);
    if (!item) return false;
    drag = { id, initial: state, xOffset: item.x - position.x, zOffset: item.z - position.z };
    pick(id);
    stage.classList.add('is-dragging');
    return true;
  },
  move(position) {
    if (!drag) return;
    const item = selectedItem();
    if (!item) return;
    const next = place(item, position.x + drag.xOffset, position.z + drag.zOffset);
    if (next.x === item.x && next.z === item.z) return;
    state = setItem(drag.id, { x: next.x, z: next.z });
    updatePosition(next);
    renderVisuals();
  },
  end() {
    if (!drag) return;
    const initial = drag.initial;
    const original = initial.items.find((item) => item.id === drag.id);
    const item = state.items.find((entry) => entry.id === drag.id);
    drag = null;
    stage.classList.remove('is-dragging');
    if (original.x !== item.x || original.z !== item.z) {
      remember(initial);
      markUnsaved();
    }
    render();
  },
  unavailable() {
    setView('plan');
    byId('mode-3d').disabled = true;
    byId('view-help').textContent = '3D is unavailable in this browser. Use the floor plan to edit the room.';
  }
};

function planPoint(event) {
  const matrix = plan.getScreenCTM();
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  return { x: point.x, z: point.y };
}

plan.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || !event.isPrimary) return;
  const id = event.target.closest('[data-id]')?.dataset.id;
  if (!id) {
    pick(null);
    return;
  }
  if (!interaction.start(id, planPoint(event))) return;
  planPointer = event.pointerId;
  plan.setPointerCapture(planPointer);
  event.preventDefault();
});
plan.addEventListener('pointermove', (event) => {
  if (planPointer === event.pointerId) interaction.move(planPoint(event));
});
function endPlanDrag(event) {
  if (planPointer !== event.pointerId) return;
  planPointer = null;
  interaction.end();
}
plan.addEventListener('pointerup', endPlanDrag);
plan.addEventListener('pointercancel', endPlanDrag);
plan.addEventListener('lostpointercapture', endPlanDrag);

function setView(mode) {
  viewMode = mode;
  const three = mode === '3d';
  byId('scene-3d').hidden = !three;
  plan.toggleAttribute('hidden', three);
  byId('camera-reset').hidden = !three;
  byId('mode-3d').setAttribute('aria-pressed', String(three));
  byId('mode-plan').setAttribute('aria-pressed', String(!three));
  byId('view-help').textContent = three
    ? 'Drag an object to move it. Drag empty space to orbit. Scroll or pinch to zoom.'
    : 'Drag objects in the plan, or use the position fields to place them precisely.';
  scene?.show(three);
}

options(byId('category'), entries(categories), 'furniture');
options(byId('floor'), entries(floors), state.floor);
options(byId('light'), entries(lighting), state.light);
drawCatalog();
render();
status.textContent = 'Changes stay in this tab until you save.';
save.addEventListener('click', persist);
byId('reset').disabled = false;

byId('category').addEventListener('change', drawCatalog);
byId('objects').addEventListener('change', (event) => { if (!drag) pick(event.target.value); });
byId('deselect').addEventListener('click', () => { if (!drag) pick(null); });
for (const key of ['floor', 'light']) {
  byId(key).addEventListener('change', (event) => change({ ...state, [key]: event.target.value }));
}
for (const key of ['variant', 'finish']) {
  byId(key).addEventListener('change', (event) => edit({ [key === 'variant' ? 'design' : key]: event.target.value }));
}
for (const key of ['x', 'z', 'angle', 'width', 'height']) {
  byId(key).addEventListener('change', (event) => {
    const input = event.target;
    const number = input.valueAsNumber;
    if (!Number.isFinite(number)) { updateInspector(); return; }
    const value = key === 'angle' ? angle(number) : round(clamp(number, Number(input.min), Number(input.max)));
    edit({ [key]: value });
  });
}
byId('lamp').addEventListener('change', (event) => edit({ on: event.target.checked }));
byId('rotate').addEventListener('click', () => edit({ angle: angle(selectedItem().angle + 45) }));
byId('duplicate').addEventListener('click', duplicate);
byId('remove').addEventListener('click', () => change({ ...state, items: state.items.filter((item) => item.id !== selectedId) }, null));
byId('undo').addEventListener('click', () => restore(undo, redo));
byId('redo').addEventListener('click', () => restore(redo, undo));
byId('reset').addEventListener('click', () => change(starterRoom(), null));
byId('mode-3d').addEventListener('click', () => { if (!drag) { choseView = true; setView('3d'); } });
byId('mode-plan').addEventListener('click', () => { if (!drag) { choseView = true; setView('plan'); } });
byId('camera-reset').addEventListener('click', () => scene?.resetCamera());

try {
  const { createRoomScene } = await import('./scene.js');
  scene = createRoomScene(byId('scene-3d'), interaction);
  byId('mode-3d').disabled = false;
  scene.sync(state, selectedId);
  setView(choseView || drag ? viewMode : '3d');
} catch {
  interaction.unavailable();
}
