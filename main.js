// ✦ Kathis Nagelstudio — VR-Spiel für Meta Quest 3 (WebXR, läuft auch am Computer)
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ---------- Grundgerüst ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf7d9ec);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.01, 50);
camera.position.set(0, 1.5, 0.45);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.xr.enabled = true;
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.0, -0.6);
controls.update();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- Licht ----------
scene.add(new THREE.HemisphereLight(0xfff0fa, 0xc080a0, 0.5));
const spot = new THREE.SpotLight(0xffffff, 6, 8, Math.PI / 5, 0.4);
spot.position.set(0, 2.6, -0.2);
spot.target.position.set(0, 0.9, -0.65);
spot.castShadow = true;
scene.add(spot, spot.target);
const fill = new THREE.PointLight(0xff9ad5, 1.5, 6);
fill.position.set(-1.5, 1.8, 0.5);
scene.add(fill);

// ---------- Hilfen: Text-Schilder ----------
function makePanel(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = Math.round(512 * h / w);
  const ctx = c.getContext('2d');
  draw(ctx, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  mesh.userData.redraw = (d) => { d(ctx, c.width, c.height); tex.needsUpdate = true; };
  return mesh;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------- Raum ----------
const room = new THREE.Group();
scene.add(room);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(4, 48),
  new THREE.MeshStandardMaterial({ color: 0xe8b7d8, roughness: 0.9 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
room.add(floor);

// rosa Rundwand
const wall = new THREE.Mesh(
  new THREE.CylinderGeometry(4, 4, 3.2, 48, 1, true),
  new THREE.MeshStandardMaterial({ color: 0xf6c6e4, roughness: 1, side: THREE.BackSide })
);
wall.position.y = 1.6;
room.add(wall);

// Deko-Herzen an der Wand
const heartShape = new THREE.Shape();
heartShape.moveTo(0, -0.5).bezierCurveTo(-0.9, 0.3, -0.4, 1.0, 0, 0.55)
  .bezierCurveTo(0.4, 1.0, 0.9, 0.3, 0, -0.5);
const heartGeo = new THREE.ExtrudeGeometry(heartShape, { depth: 0.06, bevelEnabled: false });
for (let i = 0; i < 8; i++) {
  const a = (i / 8) * Math.PI * 2;
  const heart = new THREE.Mesh(heartGeo, new THREE.MeshStandardMaterial({
    color: [0xff6fb5, 0xff4d9e, 0xffa3d1, 0xe93d8c][i % 4], roughness: 0.4
  }));
  heart.scale.setScalar(0.18 + (i % 3) * 0.05);
  heart.position.set(Math.sin(a) * 3.85, 1.5 + Math.sin(i * 2.7) * 0.7, -Math.cos(a) * 3.85);
  heart.lookAt(0, heart.position.y, 0);
  room.add(heart);
}

// großes Schild
const sign = makePanel(2.2, 0.55, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  roundRect(ctx, 4, 4, w - 8, h - 8, 40);
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, '#ff4d9e'); grad.addColorStop(1, '#b03dd9');
  ctx.fillStyle = grad; ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('💅 Kathis Nagelstudio ✦', w / 2, h / 2);
});
sign.position.set(0, 2.35, -3.8);
room.add(sign);

// ---------- Tisch ----------
const tableTop = new THREE.Mesh(
  new THREE.BoxGeometry(1.7, 0.05, 0.85),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 })
);
tableTop.position.set(0, 0.88, -0.65);
tableTop.castShadow = true; tableTop.receiveShadow = true;
room.add(tableTop);
for (const sx of [-0.75, 0.75]) {
  const leg = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.88, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xf2a3cd, roughness: 0.5 })
  );
  leg.position.set(sx, 0.44, -0.65);
  room.add(leg);
}
const TABLE_Y = 0.905; // Oberkante Tisch

// ---------- Die riesige Hand ----------
const skinMat = new THREE.MeshStandardMaterial({ color: 0xf0b9a0, roughness: 0.75 });
const hand = new THREE.Group();
hand.position.set(0, TABLE_Y, -0.78);
scene.add(hand);

// Handteller
const palm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 18), skinMat);
palm.scale.set(1.15, 0.42, 1.25);
palm.position.set(0, 0.067, -0.1);
palm.castShadow = true;
hand.add(palm);

// Handgelenk / Arm-Andeutung
const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.3, 20), skinMat);
wrist.rotation.x = Math.PI / 2;
wrist.position.set(0, 0.06, -0.38);
wrist.castShadow = true;
hand.add(wrist);

// Finger + Nägel
const NAIL_W = 0.085, NAIL_L = 0.115;
const nails = []; // { mesh, ctx, tex, shine, glitter, mat }

function makeNailCanvas() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 340;
  return c;
}
function ovalPath(ctx, w, h) {
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, w / 2 - 6, h / 2 - 6, 0, 0, Math.PI * 2);
}
function resetNail(n) {
  const { ctx, canvas } = n;
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ovalPath(ctx, w, h); ctx.clip();
  const g = ctx.createLinearGradient(0, h, 0, 0);
  g.addColorStop(0, '#f6cdbd'); g.addColorStop(0.75, '#f9ddd1'); g.addColorStop(1, '#fdf3ee');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // heller Halbmond unten
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.ellipse(w / 2, h - 28, 52, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  n.tex.needsUpdate = true;
  n.shine = 0;
  n.glitter = 0;
  n.mat.roughness = 0.55;
  n.mat.clearcoat = 0.1;
}

function makeNail() {
  // leicht gewölbte Platte
  const geo = new THREE.PlaneGeometry(NAIL_W, NAIL_L, 12, 12);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const acrossCurve = 0.014 * (1 - (x / (NAIL_W / 2)) ** 2);
    const alongCurve = 0.008 * (1 - (y / (NAIL_L / 2)) ** 2);
    pos.setZ(i, acrossCurve + alongCurve);
  }
  geo.computeVertexNormals();
  const canvas = makeNailCanvas();
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshPhysicalMaterial({
    map: tex, transparent: true, side: THREE.DoubleSide,
    roughness: 0.55, clearcoat: 0.1, clearcoatRoughness: 0.25
  });
  const mesh = new THREE.Mesh(geo, mat);
  const n = { mesh, canvas, ctx, tex, mat, shine: 0, glitter: 0 };
  resetNail(n);
  return n;
}

// Fingerdaten: [xOffset, zOffset, Länge, Drehung um Y, Dicke]
const fingerData = [
  [-0.21, -0.18, 0.24, 1.0, 0.042], // Daumen — seitlich abgespreizt
  [-0.075, 0.0, 0.42, 0.10, 0.042], // Zeigefinger
  [0.0,    0.0, 0.46, 0.0,  0.044], // Mittelfinger
  [0.075,  0.0, 0.43, -0.08, 0.042], // Ringfinger
  [0.145,  0.0, 0.34, -0.20, 0.038], // kleiner Finger
];

for (const [x, z, len, rotY, r] of fingerData) {
  const finger = new THREE.Group();
  finger.position.set(x, 0.05, z);
  finger.rotation.y = rotY;
  hand.add(finger);

  const seg = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 16), skinMat);
  seg.rotation.x = Math.PI / 2;
  seg.position.z = len / 2;
  seg.castShadow = true;
  finger.add(seg);

  // Fingerkuppe
  const tip = new THREE.Mesh(new THREE.SphereGeometry(r * 0.98, 16, 12), skinMat);
  tip.position.z = len + r * 0.3;
  finger.add(tip);

  // Nagel oben auf der Kuppe, leicht zum Spieler geneigt
  const n = makeNail();
  n.mesh.position.set(0, r * 0.78, len + r * 0.25);
  n.mesh.rotation.x = -Math.PI / 2 + 0.32;
  finger.add(n.mesh);
  nails.push(n);
}

// ---------- Aufträge (Kundenwünsche) ----------
const ORDERS = [
  { name: 'Mia',   color: '#ff4d9e', label: 'Knallpink', glitter: true },
  { name: 'Lena',  color: '#d92626', label: 'Feuerrot', glitter: false },
  { name: 'Sofia', color: '#7a2bd9', label: 'Lila', glitter: true },
  { name: 'Emma',  color: '#1f8fff', label: 'Himmelblau', glitter: false },
  { name: 'Kathi', color: '#13c27a', label: 'Grün', glitter: true },
  { name: 'Lina',  color: '#ff8c1a', label: 'Orange', glitter: false },
  { name: 'Nora',  color: '#111111', label: 'Schwarz', glitter: true },
  { name: 'Paula', color: '#ffd400', label: 'Sonnengelb', glitter: false },
];
let order = null;
let piczel = parseInt(localStorage.getItem('piczel') || '0', 10);

const orderSign = makePanel(0.85, 0.42, () => {});
orderSign.position.set(-0.62, 1.45, -1.15);
orderSign.rotation.y = 0.35;
scene.add(orderSign);

const scoreSign = makePanel(0.7, 0.26, () => {});
scoreSign.position.set(0.62, 1.5, -1.15);
scoreSign.rotation.y = -0.35;
scene.add(scoreSign);

function drawOrder() {
  orderSign.userData.redraw((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    roundRect(ctx, 4, 4, w - 8, h - 8, 30);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.strokeStyle = '#ff4d9e'; ctx.lineWidth = 8; ctx.stroke();
    ctx.fillStyle = '#b03dd9';
    ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`Kundin: ${order.name}`, w / 2, 58);
    ctx.fillStyle = '#333';
    ctx.font = '34px sans-serif';
    ctx.fillText('wünscht sich:', w / 2, 105);
    ctx.fillStyle = order.color;
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(order.label + (order.glitter ? ' + Glitzer ✨' : ''), w / 2, 160);
    ctx.fillStyle = '#888';
    ctx.font = '26px sans-serif';
    ctx.fillText('Alle 5 Nägel, dann ⭐-Knopf!', w / 2, 205);
  });
}
function drawScore(extra) {
  scoreSign.userData.redraw((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    roundRect(ctx, 4, 4, w - 8, h - 8, 26);
    ctx.fillStyle = '#3a1f4d'; ctx.fill();
    ctx.fillStyle = '#ffd400';
    ctx.font = 'bold 52px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`✦ ${piczel} Piczel`, w / 2, extra ? 70 : 105);
    if (extra) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText(extra, w / 2, 135);
    }
  });
}
function newOrder() {
  let next;
  do { next = ORDERS[Math.floor(Math.random() * ORDERS.length)]; } while (next === order);
  order = next;
  drawOrder();
}
newOrder();
drawScore('');

// ---------- Werkzeuge ----------
const tools = []; // { group, type, color?, tip(Vector3 lokal), home{pos,quat} }
const toolShelf = new THREE.Group();
scene.add(toolShelf);

function registerTool(group, type, tipLocal, color) {
  group.userData.tool = { type, color, tip: tipLocal };
  group.traverse(o => { o.userData.toolRoot = group; });
  tools.push(group);
  toolShelf.add(group);
}

// Nagellack-Fläschchen mit Pinsel
const POLISH = ['#ff4d9e', '#d92626', '#7a2bd9', '#1f8fff', '#13c27a', '#ff8c1a', '#111111', '#ffd400'];
POLISH.forEach((hex, i) => {
  const g = new THREE.Group();
  const bottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.025, 0.06, 16),
    new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.1, clearcoat: 1 })
  );
  bottle.position.y = 0.03;
  bottle.castShadow = true;
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.05, 12),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 })
  );
  cap.position.y = 0.085;
  const brushTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.006, 0.02, 10),
    new THREE.MeshStandardMaterial({ color: hex, roughness: 0.3 })
  );
  brushTip.position.y = 0.12;
  g.add(bottle, cap, brushTip);
  const x = -0.72 + (i % 4) * 0.085;
  const z = -0.95 + Math.floor(i / 4) * 0.1;
  g.position.set(x, TABLE_Y, z);
  registerTool(g, 'polish', new THREE.Vector3(0, 0.125, 0), hex);
});

// Feile
{
  const g = new THREE.Group();
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 0.008, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xffb3d9, roughness: 1 })
  );
  board.castShadow = true;
  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.012, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xb03dd9, roughness: 0.5 })
  );
  grip.position.z = 0.1;
  g.add(board, grip);
  g.position.set(0.45, TABLE_Y + 0.01, -0.95);
  registerTool(g, 'file', new THREE.Vector3(0, 0, -0.07));
}

// Glitzer-Streuer
{
  const g = new THREE.Group();
  const jar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.07, 16),
    new THREE.MeshPhysicalMaterial({ color: 0xffe680, metalness: 0.6, roughness: 0.2 })
  );
  jar.position.y = 0.035;
  jar.castShadow = true;
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.015, 16),
    new THREE.MeshStandardMaterial({ color: 0xc09010, metalness: 0.8, roughness: 0.3 })
  );
  lid.position.y = 0.078;
  g.add(jar, lid);
  g.position.set(0.56, TABLE_Y, -0.95);
  registerTool(g, 'glitter', new THREE.Vector3(0, 0.09, 0));
}

// Schwamm (Entferner)
{
  const g = new THREE.Group();
  const sponge = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.035, 0.045),
    new THREE.MeshStandardMaterial({ color: 0xfff176, roughness: 1 })
  );
  sponge.position.y = 0.018;
  sponge.castShadow = true;
  g.add(sponge);
  g.position.set(0.68, TABLE_Y, -0.95);
  registerTool(g, 'sponge', new THREE.Vector3(0, 0.018, -0.03));
}

// Heimpositionen merken
for (const t of tools) {
  t.userData.tool.home = { pos: t.position.clone(), quat: t.quaternion.clone() };
}

// ---------- Fertig-Knopf ----------
const buttonGroup = new THREE.Group();
const btnBase = new THREE.Mesh(
  new THREE.CylinderGeometry(0.06, 0.07, 0.025, 24),
  new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.4 })
);
const btnTop = new THREE.Mesh(
  new THREE.CylinderGeometry(0.045, 0.045, 0.03, 24),
  new THREE.MeshStandardMaterial({ color: 0xffd400, roughness: 0.3, emissive: 0x664f00 })
);
btnTop.position.y = 0.025;
buttonGroup.add(btnBase, btnTop);
buttonGroup.position.set(0.3, TABLE_Y + 0.012, -0.55);
scene.add(buttonGroup);
const btnLabel = makePanel(0.22, 0.08, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#b03dd9';
  ctx.font = 'bold 70px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('⭐ Fertig!', w / 2, h / 2 + 25);
});
btnLabel.position.set(0.3, TABLE_Y + 0.1, -0.55);
btnLabel.rotation.x = -0.3;
scene.add(btnLabel);

// ---------- Sounds (klein & selbstgemacht) ----------
let audio = null;
function ensureAudio() {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === 'suspended') audio.resume();
}
function beep(freq, dur, vol = 0.15, type = 'sine') {
  if (!audio) return;
  const o = audio.createOscillator(), g = audio.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
  o.connect(g).connect(audio.destination);
  o.start(); o.stop(audio.currentTime + dur);
}
function fanfare(stars) {
  if (!audio) return;
  const notes = [523, 659, 784, 1047, 1319];
  for (let i = 0; i < Math.max(2, stars + 1); i++) {
    setTimeout(() => beep(notes[i % notes.length], 0.25, 0.18, 'triangle'), i * 140);
  }
  // danach: DER PICZEL-KLANG für die ✦-Gutschrift
  setTimeout(piczelKlang, Math.max(2, stars + 1) * 140 + 150);
}

// DER PICZEL-KLANG — offizieller PICZEL-Sound, wenn ✦ auftauchen
// (8-Bit-Arpeggio C6→E6→G6→C7, 60% Rechteck + 40% Sinus, Glitzer C8 auf dem Schlusston)
function piczelKlang() {
  if (!audio) return;
  const t0 = audio.currentTime;
  const tones = [
    { f: 1046.5, t: 0.0,   decay: 18 },
    { f: 1318.5, t: 0.055, decay: 18 },
    { f: 1568.0, t: 0.110, decay: 18 },
    { f: 2093.0, t: 0.165, decay: 7 },
  ];
  const AMP = 0.17;
  for (const { f, t, decay } of tones) {
    const end = t0 + t + Math.min(0.55 - t, 5 / decay);
    for (const [type, share] of [['square', 0.6], ['sine', 0.4]]) {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(AMP * share, t0 + t);
      g.gain.setTargetAtTime(0.0001, t0 + t, 1 / decay);
      o.connect(g).connect(audio.destination);
      o.start(t0 + t); o.stop(end);
    }
    if (f === 2093.0) { // Glitzer auf dem Schlusston
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = 'sine'; o.frequency.value = 4186;
      g.gain.setValueAtTime(AMP * 0.3, t0 + t);
      g.gain.setTargetAtTime(0.0001, t0 + t, 1 / 9);
      o.connect(g).connect(audio.destination);
      o.start(t0 + t); o.stop(end);
    }
  }
}

// ---------- Konfetti ----------
const confetti = [];
function spawnConfetti(center) {
  const count = 120;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const vel = [];
  const palette = [0xff4d9e, 0xffd400, 0x1f8fff, 0x13c27a, 0xb03dd9, 0xffffff];
  for (let i = 0; i < count; i++) {
    positions.set([center.x, center.y, center.z], i * 3);
    const col = new THREE.Color(palette[i % palette.length]);
    colors.set([col.r, col.g, col.b], i * 3);
    vel.push(new THREE.Vector3(
      (Math.random() - 0.5) * 1.6, Math.random() * 2.2 + 0.6, (Math.random() - 0.5) * 1.6
    ));
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.02, vertexColors: true, transparent: true, opacity: 1
  }));
  scene.add(pts);
  confetti.push({ pts, vel, life: 2.5 });
}
function updateConfetti(dt) {
  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i];
    c.life -= dt;
    const pos = c.pts.geometry.attributes.position;
    for (let j = 0; j < c.vel.length; j++) {
      c.vel[j].y -= 3.2 * dt;
      pos.setXYZ(j,
        pos.getX(j) + c.vel[j].x * dt,
        Math.max(0.02, pos.getY(j) + c.vel[j].y * dt),
        pos.getZ(j) + c.vel[j].z * dt);
    }
    pos.needsUpdate = true;
    c.pts.material.opacity = Math.min(1, c.life);
    if (c.life <= 0) { scene.remove(c.pts); confetti.splice(i, 1); }
  }
}

// ---------- Malen auf Nägeln ----------
const _v = new THREE.Vector3();
const _local = new THREE.Vector3();

function applyToolToNails(tipWorld, tool, speed, controller) {
  let hit = false;
  for (const n of nails) {
    _local.copy(tipWorld);
    n.mesh.worldToLocal(_local);
    const inX = Math.abs(_local.x) < NAIL_W / 2 + 0.012;
    const inY = Math.abs(_local.y) < NAIL_L / 2 + 0.012;
    const inZ = _local.z > -0.03 && _local.z < 0.05;
    if (!(inX && inY && inZ)) continue;
    hit = true;
    const { canvas, ctx } = n;
    const u = (_local.x / NAIL_W + 0.5) * canvas.width;
    const v = (1 - (_local.y / NAIL_L + 0.5)) * canvas.height;

    ctx.save();
    ovalPath(ctx, canvas.width, canvas.height);
    ctx.clip();
    if (tool.type === 'polish') {
      ctx.fillStyle = tool.color;
      ctx.beginPath(); ctx.arc(u, v, 26, 0, Math.PI * 2); ctx.fill();
      n.tex.needsUpdate = true;
    } else if (tool.type === 'glitter' && speed > 0.15) {
      for (let s = 0; s < 7; s++) {
        const gx = u + (Math.random() - 0.5) * 70;
        const gy = v + (Math.random() - 0.5) * 70;
        ctx.fillStyle = ['#fff', '#ffe680', '#ffd0ef'][s % 3];
        ctx.beginPath(); ctx.arc(gx, gy, 1.5 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
      }
      n.glitter += 7;
      n.tex.needsUpdate = true;
    } else if (tool.type === 'file' && speed > 0.1) {
      n.shine = Math.min(1, n.shine + speed * 0.04);
      n.mat.roughness = 0.55 - n.shine * 0.45;
      n.mat.clearcoat = 0.1 + n.shine * 0.9;
    } else if (tool.type === 'sponge') {
      resetNail(n);
    }
    ctx.restore();

    // Vibration im Controller
    const gp = controller?.userData?.inputSource?.gamepad;
    gp?.hapticActuators?.[0]?.pulse?.(tool.type === 'file' ? 0.5 : 0.25, 40);
  }
  return hit;
}

// ---------- Bewertung ----------
function rateNails() {
  const want = new THREE.Color(order.color);
  let coverSum = 0, glitterTotal = 0;
  for (const n of nails) {
    const { canvas, ctx } = n;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let painted = 0, total = 0;
    for (let i = 0; i < data.length; i += 32) { // jeden 8. Pixel prüfen
      const a = data[i + 3];
      if (a < 100) continue;
      total++;
      const dr = data[i] / 255 - want.r;
      const dg = data[i + 1] / 255 - want.g;
      const db = data[i + 2] / 255 - want.b;
      if (dr * dr + dg * dg + db * db < 0.16) painted++;
    }
    coverSum += total ? painted / total : 0;
    glitterTotal += n.glitter;
  }
  const coverage = coverSum / nails.length;
  let stars = coverage > 0.82 ? 5 : coverage > 0.6 ? 4 : coverage > 0.35 ? 3 : coverage > 0.12 ? 2 : 1;
  if (order.glitter && glitterTotal < 60) stars = Math.max(1, stars - 1);
  if (!order.glitter && glitterTotal > 200) stars = Math.max(1, stars - 1);
  return stars;
}

let buttonCooldown = 0;
function pressButton() {
  if (buttonCooldown > 0) return;
  buttonCooldown = 2.5;
  ensureAudio();
  const stars = rateNails();
  const earned = stars * 10;
  piczel += earned;
  localStorage.setItem('piczel', String(piczel));
  drawScore(`${'⭐'.repeat(stars)}  +${earned} ✦`);
  fanfare(stars);
  spawnConfetti(new THREE.Vector3(0, 1.4, -0.8));
  btnTop.position.y = 0.012;
  setTimeout(() => { btnTop.position.y = 0.025; }, 250);
  setTimeout(() => {
    for (const n of nails) resetNail(n);
    newOrder();
    drawScore('Neue Kundin ist da!');
  }, 2600);
}

// ---------- VR-Controller ----------
const controllers = [];
for (let i = 0; i < 2; i++) {
  const ctrl = renderer.xr.getController(i);
  scene.add(ctrl);

  // sichtbare "Hand": pinke Kugel + kleiner Zeigekegel
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xff79c1, roughness: 0.4 })
  );
  const pointer = new THREE.Mesh(
    new THREE.ConeGeometry(0.008, 0.03, 10),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  pointer.rotation.x = -Math.PI / 2;
  pointer.position.z = -0.04;
  ctrl.add(ball, pointer);

  ctrl.userData.held = null;
  ctrl.userData.prevTip = new THREE.Vector3();

  ctrl.addEventListener('connected', (e) => { ctrl.userData.inputSource = e.data; });
  ctrl.addEventListener('disconnected', () => { ctrl.userData.inputSource = null; });

  const grab = () => {
    ensureAudio();
    if (ctrl.userData.held) return;
    // Knopf in Reichweite?
    ctrl.getWorldPosition(_v);
    if (_v.distanceTo(buttonGroup.getWorldPosition(new THREE.Vector3())) < 0.12) {
      pressButton();
      return;
    }
    // nächstes Werkzeug suchen
    let best = null, bestD = 0.16;
    for (const t of tools) {
      if (t.userData.heldBy) continue;
      const d = _v.distanceTo(t.getWorldPosition(new THREE.Vector3()));
      if (d < bestD) { bestD = d; best = t; }
    }
    if (best) {
      ctrl.attach(best);
      best.position.set(0, -0.01, -0.06);
      best.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2.4, 0, 0));
      best.userData.heldBy = ctrl;
      ctrl.userData.held = best;
      beep(660, 0.08, 0.12);
    }
  };
  const release = () => {
    const t = ctrl.userData.held;
    if (!t) return;
    scene.attach(t);
    const home = t.userData.tool.home;
    t.position.copy(home.pos);
    t.quaternion.copy(home.quat);
    toolShelf.attach(t);
    t.userData.heldBy = null;
    ctrl.userData.held = null;
    beep(440, 0.08, 0.1);
  };
  ctrl.addEventListener('selectstart', grab);
  ctrl.addEventListener('selectend', release);
  ctrl.addEventListener('squeezestart', grab);
  ctrl.addEventListener('squeezeend', release);
  controllers.push(ctrl);
}

// ---------- Desktop-Steuerung (zum Testen am Computer) ----------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let desktopTool = null;
let desktopPainting = false;
const cursorRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.018, 0.004, 8, 24),
  new THREE.MeshBasicMaterial({ color: 0xff4d9e })
);
cursorRing.visible = false;
scene.add(cursorRing);

function pickAt(clientX, clientY, objects) {
  mouse.x = (clientX / innerWidth) * 2 - 1;
  mouse.y = -(clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(objects, true)[0] || null;
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (renderer.xr.isPresenting) return;
  ensureAudio();
  // Knopf?
  const hitBtn = pickAt(e.clientX, e.clientY, [buttonGroup]);
  if (hitBtn) { pressButton(); return; }
  // Werkzeug anklicken = auswählen
  const hitTool = pickAt(e.clientX, e.clientY, tools);
  if (hitTool) {
    desktopTool = hitTool.object.userData.toolRoot;
    cursorRing.visible = true;
    const col = desktopTool.userData.tool.color;
    cursorRing.material.color.set(col || '#ffffff');
    beep(660, 0.08, 0.12);
    return;
  }
  // mit gewähltem Werkzeug auf Nagel malen
  if (desktopTool) {
    desktopPainting = true;
    controls.enabled = false;
    paintAtPointer(e);
  }
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (renderer.xr.isPresenting) return;
  if (desktopPainting) paintAtPointer(e);
});
addEventListener('pointerup', () => { desktopPainting = false; controls.enabled = true; });

function paintAtPointer(e) {
  const hit = pickAt(e.clientX, e.clientY, nails.map(n => n.mesh));
  if (!hit) return;
  cursorRing.position.copy(hit.point);
  cursorRing.lookAt(camera.position);
  applyToolToNails(hit.point, desktopTool.userData.tool, 0.5, null);
}

// ---------- Hauptschleife ----------
const clock = new THREE.Clock();
const _tipNow = new THREE.Vector3();

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  buttonCooldown = Math.max(0, buttonCooldown - dt);

  for (const ctrl of controllers) {
    const t = ctrl.userData.held;
    if (!t) continue;
    const tipLocal = t.userData.tool.tip;
    _tipNow.copy(tipLocal);
    t.localToWorld(_tipNow);
    const speed = _tipNow.distanceTo(ctrl.userData.prevTip) / Math.max(dt, 0.001);
    applyToolToNails(_tipNow, t.userData.tool, speed, ctrl);
    ctrl.userData.prevTip.copy(_tipNow);
  }

  updateConfetti(dt);
  renderer.render(scene, camera);
});

// Debug-Haken für automatische Tests (stört das Spiel nicht)
window.__nagel = { nails, tools, applyToolToNails, pressButton, rateNails, order: () => order };
