import * as THREE from 'three';
import { finishes } from './catalog.js';

const box = new THREE.BoxGeometry(1, 1, 1);
const ball = new THREE.SphereGeometry(1, 24, 14);
const cylinder = new THREE.CylinderGeometry(1, 1, 1, 28);
const taper = new THREE.CylinderGeometry(1, .72, 1, 24);
const ring = new THREE.TorusGeometry(1, .18, 12, 48);
const materials = new Map();

function material(color, glow = false) {
  const key = color + glow;
  if (!materials.has(key)) {
    materials.set(key, new THREE.MeshStandardMaterial({
      color, roughness: .72, emissive: glow ? color : '#000000', emissiveIntensity: glow ? .7 : 0
    }));
  }
  return materials.get(key);
}

function waveFins(group, width, height, surface) {
  const count = Math.ceil(width / .135);
  const pitch = width / count;
  const points = [];
  const faces = [];
  const steps = 32;
  const corners = [[-1,-1], [1,-1], [1,1], [-1,1]];
  for (let fin = 0; fin < count; fin++) {
    const base = points.length / 3;
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      const phase = fin * .115 + t * Math.PI * 2.15;
      const x = -width / 2 + (fin + .5) * pitch + .075 * Math.sin(phase) * Math.sin(Math.PI * t);
      const depth = .11 + .135 * (Math.sin(phase) + 1) / 2;
      for (const [dx, dz] of corners) points.push(x + dx * pitch * .31, t * height, .02 + (dz + 1) * depth / 2);
      if (!step) continue;
      for (let side = 0; side < 4; side++) {
        const a = base + (step - 1) * 4 + side;
        const b = base + (step - 1) * 4 + (side + 1) % 4;
        faces.push(a, a + 4, b, b, a + 4, b + 4);
      }
    }
    const top = base + steps * 4;
    faces.push(base, base + 1, base + 2, base, base + 2, base + 3,
      top, top + 2, top + 1, top, top + 3, top + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setIndex(faces);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, surface);
  mesh.userData.disposable = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}

export function buildModel(item) {
  const group = new THREE.Group();
  const main = finishes[item.finish].color;
  const dark = '#3a342c';
  const wood = '#805e40';
  const gold = '#a58a58';
  function part(shape, color, x, y, z, w, h, d, glow = false) {
    const mesh = new THREE.Mesh(shape, material(color, glow));
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.castShadow = !glow;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  const block = (color, x, y, z, w, h, d) => part(box, color, x, y, z, w, h, d);
  const round = (color, x, y, z, r, h, glow = false) => part(cylinder, color, x, y, z, r, h, r, glow);
  const cushion = (color, x, y, z, w, h, d) => part(ball, color, x, y, z, w / 2, h / 2, d / 2);
  function legs(width, depth, height, color = wood) {
    for (const x of [-width / 2, width / 2]) {
      for (const z of [-depth / 2, depth / 2]) round(color, x, height / 2, z, .027, height);
    }
  }
  function bulb(x, y, z) {
    part(ball, item.on ? '#fff0c4' : '#b9ad94', x, y, z, .08, .055, .08, item.on);
    if (item.on) {
      const light = new THREE.PointLight('#ffd29b', 13, 4.5, 2);
      light.position.set(x, y - .08, z);
      light.userData.fixture = true;
      group.add(light);
    }
  }

  switch (item.design) {
    case 'wave':
      block(main, 0, item.height / 2, 0, item.width, item.height, .16);
      waveFins(group, item.width, item.height, material(main));
      break;
    case 'plaster':
      block(main, 0, item.height / 2, 0, item.width, item.height, .17);
      block('#544e41', 0, .035, 0, item.width, .07, .18);
      break;
    case 'slats': {
      const count = Math.ceil(item.width / .14);
      const pitch = item.width / count;
      block(main, 0, .07, 0, item.width, .14, .15);
      block(main, 0, item.height - .065, 0, item.width, .13, .15);
      for (let i = 0; i < count; i++) block(main, -item.width / 2 + (i + .5) * pitch, item.height / 2, 0, pitch * .51, item.height, .095);
      break;
    }
    case 'lounge':
      legs(.64, .68, .29);
      cushion(main, 0, .42, .04, .98, .43, .94);
      cushion(main, 0, .63, -.3, 1.01, .72, .36).rotation.x = -.2;
      for (const x of [-.39, .39]) cushion(main, x, .54, -.015, .24, .31, .77);
      break;
    case 'chair':
      legs(.54, .52, .49, dark);
      block(main, 0, .46, .04, .69, .115, .68);
      for (const x of [-.29,.29]) round(dark, x, .67, -.28, .028, .46);
      cushion(main, 0, .84, -.29, .72, .25, .16);
      break;
    case 'sofa':
      legs(2.17, .72, .23, dark);
      block(main, 0, .28, .025, 2.48, .27, .91);
      for (const x of [-.76, 0, .76]) {
        cushion(main, x, .41, .11, .86, .28, .82);
        cushion(main, x, .69, -.285, .88, .54, .36);
      }
      for (const x of [-1.15, 1.15]) cushion(main, x, .53, -.015, .33, .4, .96);
      break;
    case 'bench':
      legs(1.52, .46, .43, dark);
      block(main, 0, .46, 0, 2, .13, .63);
      break;
    case 'coffee':
      round(dark, 0, .18, 0, .265, .35);
      round(main, 0, .37, 0, .64, .09);
      break;
    case 'side':
      part(taper, main, 0, .24, 0, .22, .45, .22);
      round(main, 0, .48, 0, .325, .055);
      break;
    case 'reception':
      block(dark, 0, .075, 0, 2.35, .15, .7);
      block(main, 0, .53, 0, 2.46, .91, .79);
      for (let i = 0; i < 26; i++) block(main, -1.19 + i * .094, .53, .42, .053, .88, .07);
      block('#c8b79d', 0, 1.02, 0, 2.55, .085, .88);
      break;
    case 'pendant':
      round(dark, 0, 2.63, 0, .015, .9);
      cushion(main, 0, 2.27, 0, .81, .32, .81);
      round(main, 0, 2.17, 0, .4, .038);
      bulb(0, 2.115, 0);
      break;
    case 'floorLamp':
      round(main, 0, .035, 0, .245, .07);
      round(main, 0, .88, 0, .025, 1.71);
      part(taper, '#d2c2a4', 0, 1.68, 0, .27, .35, .27).rotation.x = Math.PI;
      bulb(0, 1.48, 0);
      break;
    case 'track':
      block(main, 0, 2.91, 0, 1.7, .065, .09);
      for (const x of [-.6,0,.6]) {
        round(main, x, 2.79, 0, .08, .22);
        bulb(x, 2.655, 0);
      }
      break;
    case 'planter':
      part(taper, main, 0, .26, 0, .38, .52, .38);
      round('#564539', 0, .525, 0, .32, .025);
      round('#685440', 0, .96, 0, .052, 1.04);
      for (let i = 0; i < 14; i++) {
        const angle = i * 2.4;
        const spread = .23 + (i % 3) * .1;
        const y = 1.35 + i * .044;
        cushion(i % 2 ? '#63714a' : '#46573d', Math.sin(angle) * spread, y, Math.cos(angle) * spread, .39, .38, .37);
      }
      break;
    case 'vase':
      cushion(main, 0, .29, 0, .43, .56, .43);
      round(main, 0, .545, 0, .11, .16);
      round(dark, 0, .629, 0, .082, .012);
      break;
    case 'rug':
      block(main, 0, .012, 0, 3.8, .024, 2.55);
      for (const z of [-1.19,1.19]) block('#ded1b2', 0, .026, z, 3.68, .008, .028);
      break;
    case 'sculpture':
      block('#bfb4a0', 0, .2, 0, .85, .4, .75);
      part(ring, main, 0, 1.07, 0, .34, .6, .36).rotation.set(.14, .42, -.3);
      break;
    case 'display':
      block(main, 0, .51, 0, .73, 1.02, .73);
      block('#c8b79d', 0, 1.04, 0, .75, .05, .75);
      part(ball, gold, 0, 1.25, 0, .19, .19, .19);
      break;
    case 'screen':
      block(main, 0, .06, 0, 1.55, .12, .42);
      block(main, 0, 1.14, 0, 1.7, 2.18, .13);
      block('#dbd4be', 0, 1.18, .076, 1.45, 1.87, .025);
      block('#52624e', 0, 1.48, .096, 1.24, .81, .017);
      for (let i = 0; i < 3; i++) block('#766d5e', -.18, .91 - i * .11, .097, .85 - i * .12, .034, .016);
      break;
  }
  return group;
}
