/* =========================================================
   FUTEBOL PRO PSP - Jogo 3D Mobile
   Inspirado nos clássicos do PSP (FIFA/PES/Pro Evolution)
   ========================================================= */

// =================== ESTADO GLOBAL ===================
const Game = {
  scene: null, camera: null, renderer: null,
  state: 'menu', // menu | career | match
  clock: null,
  delta: 0
};

const Match = {
  active: false,
  time: 0, // segundos de jogo
  duration: 120, // 2min de partida (escala retrô)
  scoreHome: 0, scoreAway: 0,
  players: [],
  ball: null,
  joystick: { x: 0, y: 0 },
  actions: { pass: false, shoot: false, sprint: false },
  lastAction: { pass: false, shoot: false },
  aiTarget: { x: 0, z: 0 },
  goalScored: false, goalCooldown: 0
};

const Career = {
  player: {
    name: 'Ronaldinho', number: 10, position: 'ATT',
    nation: '🇧🇷 Brasil', skin: '#c68642', hair: '#2b1a0e',
    attributes: { speed: 55, shot: 55, pass: 55, dribble: 55, defense: 40, physical: 50 },
    ovr: 60, xp: 0, level: 1, reputation: 0,
    trainPoints: 0,
    club: 'Clube Pequeno FC',
    clubTier: 1, // 1=pequeno, 2=médio, 3=grande
    salary: 1000,
    seasonGoals: 0, seasonAssists: 0, seasonMatches: 0,
    leaguePoints: 0, leaguePlayed: 0
  },
  offers: []
};

const CLUB_TIERS = [
  { name: 'Clube Pequeno FC', tier: 1, salary: 1000 },
  { name: 'Atlético Médio', tier: 2, salary: 5000 },
  { name: 'Real Gigante', tier: 3, salary: 20000 },
  { name: 'FC Estrela', tier: 3, salary: 35000 }
];

const OPPONENTS_TIER1 = ['América FC', 'União B', 'Sport Recife', 'Vila Nova'];
const OPPONENTS_TIER2 = ['Corinthians', 'Santos', 'Fluminense', 'Grêmio'];
const OPPONENTS_TIER3 = ['Barcelona', 'Real Madrid', 'Bayern', 'PSG'];

// =================== NAVEGAÇÃO DE TELAS ===================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  if (id) document.getElementById(id).classList.remove('hidden');
}
function hideAllScreens() {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
}

function showToast(msg, duration = 2000) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), duration);
}

// =================== MENU ===================
document.querySelectorAll('.menu-btn[data-mode]').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    if (mode === 'career') {
      showScreen('career-creation');
    } else if (mode === 'quick') {
      startMatch('quick');
    } else if (mode === 'tournament') {
      showToast('Torneio em breve!');
    } else if (mode === 'options') {
      showToast('Configurações em breve!');
    }
  });
});

document.getElementById('btn-back-creation').addEventListener('click', () => {
  showScreen('main-menu');
});

document.getElementById('btn-create-player').addEventListener('click', () => {
  Career.player.name = document.getElementById('p-name').value || 'Jogador';
  Career.player.number = parseInt(document.getElementById('p-number').value) || 10;
  Career.player.position = document.getElementById('p-position').value;
  Career.player.nation = document.getElementById('p-nation').value;
  Career.player.skin = document.getElementById('p-skin').value;
  Career.player.hair = document.getElementById('p-hair').value;
  Career.player.ovr = calcOVR();
  Career.player.trainPoints = 3;
  Career.player.xp = 0;
  updateCareerHub();
  showScreen('career-hub');
  showToast('Bem-vindo à sua carreira!', 2500);
});

// =================== CAREER HUB ===================
function calcOVR() {
  const a = Career.player.attributes;
  const arr = [a.speed, a.shot, a.pass, a.dribble, a.defense, a.physical];
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

function updateCareerHub() {
  const p = Career.player;
  document.getElementById('hub-avatar').textContent = p.number;
  document.getElementById('hub-name').textContent = p.name;
  document.getElementById('hub-club').textContent = p.club;
  document.getElementById('hub-ovr').textContent = p.ovr;
  document.getElementById('hub-xp').textContent = p.xp;
  document.getElementById('hub-rep').textContent = p.reputation;
  document.getElementById('train-pts').textContent = p.trainPoints;

  // next match
  const oppList = p.clubTier === 1 ? OPPONENTS_TIER1 : p.clubTier === 2 ? OPPONENTS_TIER2 : OPPONENTS_TIER3;
  document.getElementById('next-opponent').textContent = oppList[Math.floor(Math.random() * oppList.length)];

  renderStats();
  renderTrainButtons();
  renderOffers();
  renderLeague();
}

function renderStats() {
  const p = Career.player;
  const labels = {
    speed: '⚡ Velocidade', shot: '🎯 Chute', pass: '👟 Passe',
    dribble: '✨ Drible', defense: '🛡️ Defesa', physical: '💪 Físico'
  };
  let html = '';
  for (const k in p.attributes) {
    const val = p.attributes[k];
    html += `<div class="stat-row">
      <span>${labels[k]}</span>
      <div class="stat-bar"><div class="stat-fill" style="width:${val}%"></div></div>
      <strong style="color:#ffcc00;min-width:26px;text-align:right">${val}</strong>
    </div>`;
  }
  document.getElementById('stats-list').innerHTML = html;
}

function renderTrainButtons() {
  const p = Career.player;
  const labels = { speed: 'Velocidade', shot: 'Chute', pass: 'Passe', dribble: 'Drible', defense: 'Defesa', physical: 'Físico' };
  let html = '';
  for (const k in p.attributes) {
    const disabled = p.trainPoints <= 0 || p.attributes[k] >= 99 ? 'disabled' : '';
    html += `<button class="train-btn" data-stat="${k}" ${disabled}>
      <span>${labels[k]}</span>
      <span>${p.attributes[k]} → ${Math.min(99, p.attributes[k] + 2)}</span>
    </button>`;
  }
  const container = document.getElementById('train-buttons');
  container.innerHTML = html;
  container.querySelectorAll('.train-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const stat = btn.dataset.stat;
      if (p.trainPoints > 0 && p.attributes[stat] < 99) {
        p.trainPoints--;
        p.attributes[stat] = Math.min(99, p.attributes[stat] + 2);
        p.ovr = calcOVR();
        updateCareerHub();
        showToast(`${labels[stat]} +2!`);
      }
    });
  });
}

function renderOffers() {
  const container = document.getElementById('offers-list');
  if (Career.offers.length === 0) {
    container.innerHTML = '<p style="color:#88ddff;font-size:12px;text-align:center;padding:20px">Sem propostas no momento. Jogue bem para chamar atenção!</p>';
    return;
  }
  container.innerHTML = Career.offers.map((off, i) => `
    <div class="offer-card">
      <div class="offer-club">${off.club}</div>
      <div class="offer-details">Salário: $${off.salary.toLocaleString()} / Temporada: ${off.years} anos</div>
      <button class="menu-btn primary" data-accept="${i}">ACEITAR</button>
      <button class="menu-btn" data-reject="${i}" style="margin-top:6px">RECUSAR</button>
    </div>
  `).join('');

  container.querySelectorAll('[data-accept]').forEach(btn => {
    btn.addEventListener('click', () => {
      const offer = Career.offers[parseInt(btn.dataset.accept)];
      const p = Career.player;
      p.club = offer.club;
      p.salary = offer.salary;
      p.clubTier = offer.tier;
      Career.offers = [];
      updateCareerHub();
      showToast(`Transferido para ${offer.club}!`);
    });
  });
  container.querySelectorAll('[data-reject]').forEach(btn => {
    btn.addEventListener('click', () => {
      Career.offers.splice(parseInt(btn.dataset.reject), 1);
      updateCareerHub();
    });
  });
}

function renderLeague() {
  const p = Career.player;
  const html = `
    <div class="league-row"><span>Posição</span><span>${p.leaguePoints > 20 ? '1º' : p.leaguePoints > 10 ? '3º' : '7º'}</span></div>
    <div class="league-row"><span>Pontos</span><span>${p.leaguePoints}</span></div>
    <div class="league-row"><span>Partidas</span><span>${p.leaguePlayed}</span></div>
    <div class="league-row me"><span>${p.club}</span><span>${p.leaguePoints} pts</span></div>
  `;
  document.getElementById('league-table').innerHTML = html;
}

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
  });
});

document.getElementById('btn-career-menu').addEventListener('click', () => {
  showScreen('main-menu');
});

document.getElementById('btn-play-match').addEventListener('click', () => {
  startMatch('career');
});

// =================== THREE.JS SETUP ===================
function initThree() {
  const canvas = document.getElementById('game-canvas');
  Game.scene = new THREE.Scene();
  Game.scene.background = new THREE.Color(0x0a1a2a);
  Game.scene.fog = new THREE.Fog(0x0a1a2a, 60, 120);

  const aspect = window.innerWidth / window.innerHeight;
  Game.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 500);
  Game.camera.position.set(0, 22, 26);
  Game.camera.lookAt(0, 0, 0);

  Game.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  Game.renderer.setSize(window.innerWidth, window.innerHeight);
  Game.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  Game.renderer.shadowMap.enabled = true;
  Game.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Luzes
  const ambient = new THREE.AmbientLight(0x556677, 0.8);
  Game.scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(20, 40, 20);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  dir.shadow.camera.left = -50; dir.shadow.camera.right = 50;
  dir.shadow.camera.top = 50; dir.shadow.camera.bottom = -50;
  Game.scene.add(dir);

  const fill = new THREE.DirectionalLight(0x00ff96, 0.3);
  fill.position.set(-20, 30, -20);
  Game.scene.add(fill);

  window.addEventListener('resize', onResize);
  onResize();
  Game.clock = new THREE.Clock();
}

function onResize() {
  if (!Game.camera) return;
  Game.camera.aspect = window.innerWidth / window.innerHeight;
  Game.camera.updateProjectionMatrix();
  Game.renderer.setSize(window.innerWidth, window.innerHeight);
}

// =================== CONSTRUÇÃO DO CAMPO ===================
const FIELD_W = 40; // largura
const FIELD_H = 60; // comprimento
const GOAL_W = 10;

function buildField() {
  const scene = Game.scene;

  // Grama (listras)
  const stripes = 12;
  const stripeH = FIELD_H / stripes;
  for (let i = 0; i < stripes; i++) {
    const color = i % 2 === 0 ? 0x1a6a2a : 0x155a22;
    const geo = new THREE.PlaneGeometry(FIELD_W, stripeH);
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0, -FIELD_H / 2 + stripeH * (i + 0.5));
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // Linhas do campo
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // Linha de fundo
  addLine(scene, 0, -FIELD_H / 2, FIELD_W, 0.15, lineMat);
  addLine(scene, 0, FIELD_H / 2, FIELD_W, 0.15, lineMat);
  // Laterais
  addLine(scene, -FIELD_W / 2, 0, 0.15, FIELD_H, lineMat);
  addLine(scene, FIELD_W / 2, 0, 0.15, FIELD_H, lineMat);
  // Linha central
  addLine(scene, 0, 0, FIELD_W, 0.15, lineMat);
  // Círculo central
  const circleGeo = new THREE.RingGeometry(4, 4.2, 32);
  const circle = new THREE.Mesh(circleGeo, lineMat);
  circle.rotation.x = -Math.PI / 2;
  circle.position.y = 0.02;
  scene.add(circle);

  // Áreas
  addLine(scene, 0, -FIELD_H / 2 + 8, 22, 0.15, lineMat);
  addLine(scene, 0, FIELD_H / 2 - 8, 22, 0.15, lineMat);

  // Traves
  buildGoal(0, -FIELD_H / 2, 0xffffff);
  buildGoal(0, FIELD_H / 2, 0xffffff);

  // Arquibancadas (caixas ao redor)
  const standMat = new THREE.MeshLambertMaterial({ color: 0x0a2040 });
  const standH = 6;
  // Fundo
  const s1 = new THREE.Mesh(new THREE.BoxGeometry(FIELD_W + 8, standH, 3), standMat);
  s1.position.set(0, standH / 2, -FIELD_H / 2 - 5);
  s1.receiveShadow = true; s1.castShadow = true;
  scene.add(s1);
  const s2 = s1.clone(); s2.position.z = FIELD_H / 2 + 5; scene.add(s2);
  // Laterais
  const s3 = new THREE.Mesh(new THREE.BoxGeometry(3, standH, FIELD_H + 8), standMat);
  s3.position.set(-FIELD_W / 2 - 5, standH / 2, 0);
  s3.receiveShadow = true; scene.add(s3);
  const s4 = s3.clone(); s4.position.x = FIELD_W / 2 + 5; scene.add(s4);

  // Torcida (pontos coloridos)
  for (let i = 0; i < 200; i++) {
    const geo = new THREE.SphereGeometry(0.15, 4, 4);
    const colors = [0xffcc00, 0x00ff96, 0xff5555, 0xffffff, 0x44aaff];
    const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
    const p = new THREE.Mesh(geo, mat);
    const side = i % 4;
    if (side === 0) p.position.set((Math.random() - 0.5) * FIELD_W, 3 + Math.random() * 2.5, -FIELD_H / 2 - 5 + (Math.random() - 0.5) * 2);
    else if (side === 1) p.position.set((Math.random() - 0.5) * FIELD_W, 3 + Math.random() * 2.5, FIELD_H / 2 + 5 + (Math.random() - 0.5) * 2);
    else if (side === 2) p.position.set(-FIELD_W / 2 - 5 + (Math.random() - 0.5) * 2, 3 + Math.random() * 2.5, (Math.random() - 0.5) * FIELD_H);
    else p.position.set(FIELD_W / 2 + 5 + (Math.random() - 0.5) * 2, 3 + Math.random() * 2.5, (Math.random() - 0.5) * FIELD_H);
    scene.add(p);
  }

  // Placar 3D no fundo
  buildScoreboard();
}

function addLine(scene, x, z, w, h, mat) {
  const geo = new THREE.PlaneGeometry(w || 0.15, h || 0.15);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.03, z);
  scene.add(mesh);
}

function buildGoal(x, z, color) {
  const mat = new THREE.MeshLambertMaterial({ color });
  const height = 3;
  const depth = 2;
  // Traves verticais
  const postGeo = new THREE.CylinderGeometry(0.15, 0.15, height, 8);
  const p1 = new THREE.Mesh(postGeo, mat); p1.position.set(x - GOAL_W / 2, height / 2, z); p1.castShadow = true;
  const p2 = new THREE.Mesh(postGeo, mat); p2.position.set(x + GOAL_W / 2, height / 2, z); p2.castShadow = true;
  // Travessão
  const crossGeo = new THREE.CylinderGeometry(0.15, 0.15, GOAL_W, 8);
  const cross = new THREE.Mesh(crossGeo, mat);
  cross.rotation.z = Math.PI / 2;
  cross.position.set(x, height, z);
  cross.castShadow = true;
  Game.scene.add(p1, p2, cross);

  // Rede (semitransparente)
  const netMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
  const netBack = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_W, height), netMat);
  netBack.position.set(x, height / 2, z + (z < 0 ? -depth : depth));
  Game.scene.add(netBack);
  const netTop = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_W, depth), netMat);
  netTop.rotation.x = Math.PI / 2;
  netTop.position.set(x, height, z + (z < 0 ? -depth / 2 : depth / 2));
  Game.scene.add(netTop);
}

function buildScoreboard() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#001a0a'; ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#00ff96'; ctx.lineWidth = 4; ctx.strokeRect(4, 4, 504, 120);
  ctx.fillStyle = '#00ff96'; ctx.font = 'bold 36px monospace'; ctx.textAlign = 'center';
  ctx.fillText('FUTEBOL PRO PSP', 256, 50);
  ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 28px monospace';
  ctx.fillText('★ ARENA ★', 256, 95);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({ map: tex });
  const geo = new THREE.PlaneGeometry(24, 6);
  const board = new THREE.Mesh(geo, mat);
  board.position.set(0, 10, -FIELD_H / 2 - 8);
  Game.scene.add(board);
}

// =================== JOGADORES ===================
function createPlayerMesh(color, skinColor = 0xc68642, hairColor = 0x2b1a0e) {
  const group = new THREE.Group();

  // Corpo (camisa)
  const bodyGeo = new THREE.CylinderGeometry(0.55, 0.6, 1.3, 8);
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.2; body.castShadow = true;
  group.add(body);

  // Shorts
  const shortGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.5, 8);
  const shortMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const shorts = new THREE.Mesh(shortGeo, shortMat);
  shorts.position.y = 0.55; shorts.castShadow = true;
  group.add(shorts);

  // Cabeça
  const headGeo = new THREE.SphereGeometry(0.4, 10, 10);
  const headMat = new THREE.MeshLambertMaterial({ color: skinColor });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 2.15; head.castShadow = true;
  group.add(head);

  // Cabelo
  const hairGeo = new THREE.SphereGeometry(0.42, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const hairMat = new THREE.MeshLambertMaterial({ color: hairColor });
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.y = 2.25;
  group.add(hair);

  // Braços
  const armGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.8, 6);
  const armMat = new THREE.MeshLambertMaterial({ color: skinColor });
  const armL = new THREE.Mesh(armGeo, armMat);
  armL.position.set(-0.68, 1.3, 0); armL.rotation.z = 0.2; armL.castShadow = true;
  const armR = armL.clone(); armR.position.x = 0.68; armR.rotation.z = -0.2;
  group.add(armL, armR);

  // Pernas
  const legGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.9, 6);
  const legMat = new THREE.MeshLambertMaterial({ color: skinColor });
  const legL = new THREE.Mesh(legGeo, legMat);
  legL.position.set(-0.25, -0.45, 0); legL.castShadow = true;
  const legR = legL.clone(); legR.position.x = 0.25;
  group.add(legL, legR);

  group.userData = { armL, armR, legL, legR, body, head };
  return group;
}

// =================== INÍCIO DE PARTIDA ===================
function startMatch(mode) {
  hideAllScreens();
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('touch-controls').classList.remove('hidden');

  // Limpa cena (mantém luzes e câmera)
  const keep = new Set([Game.camera]);
  if (Game.scene) {
    Game.scene.children.slice().forEach(child => {
      if (child.isLight) return;
      if (child.type === 'PerspectiveCamera') return;
      Game.scene.remove(child);
    });
  }

  buildField();

  // Jogador controlado
  const myColor = 0xffcc00;
  const p = Career.player;
  const playerMesh = createPlayerMesh(myColor, hexToInt(p.skin), hexToInt(p.hair));
  playerMesh.position.set(0, 0, 5);
  Game.scene.add(playerMesh);
  Match.playerMesh = playerMesh;

  // Adversários (IA)
  const oppColor = 0xff3333;
  Match.aiPlayers = [];
  for (let i = 0; i < 5; i++) {
    const ai = createPlayerMesh(oppColor, 0xc68642, 0x111111);
    const row = Math.floor(i / 3);
    const col = i % 3;
    ai.position.set((col - 1) * 10, 0, -20 - row * 10);
    Game.scene.add(ai);
    Match.aiPlayers.push({ mesh: ai, target: new THREE.Vector3(ai.position.x, 0, ai.position.z) });
  }

  // Companheiros de time
  Match.teamMates = [];
  for (let i = 0; i < 3; i++) {
    const mate = createPlayerMesh(myColor, 0xc68642, 0x2b1a0e);
    mate.position.set((i - 1) * 8, 0, 15);
    Game.scene.add(mate);
    Match.teamMates.push({ mesh: mate });
  }

  // Bola
  const ballGeo = new THREE.SphereGeometry(0.4, 12, 12);
  const ballMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const ball = new THREE.Mesh(ballGeo, ballMat);
  ball.castShadow = true;
  ball.position.set(0, 0.4, 0);
  Game.scene.add(ball);
  Match.ball = { mesh: ball, velocity: new THREE.Vector3(), radius: 0.4 };

  // Estado
  Match.active = true;
  Match.time = 0;
  Match.scoreHome = 0;
  Match.scoreAway = 0;
  Match.goalCooldown = 0;
  Match.mode = mode;
  Match.playerVelocity = new THREE.Vector3();

  updateScoreboard();
  Game.state = 'match';
}

function hexToInt(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

// =================== INPUT ===================
let joystickActive = false;
let joystickStart = { x: 0, y: 0 };
let joystickPointerId = null;

const joystickBase = document.getElementById('joystick-base');
const joystickStick = document.getElementById('joystick-stick');
const joyZone = document.getElementById('joystick-zone');

joyZone.addEventListener('touchstart', startJoystick, { passive: false });
joyZone.addEventListener('touchmove', moveJoystick, { passive: false });
joyZone.addEventListener('touchend', endJoystick, { passive: false });
joyZone.addEventListener('touchcancel', endJoystick, { passive: false });

joyZone.addEventListener('mousedown', (e) => {
  e.preventDefault();
  startJoystick({ touches: [{ identifier: 'mouse', clientX: e.clientX, clientY: e.clientY }] });
});
window.addEventListener('mousemove', (e) => {
  if (joystickActive && joystickPointerId === 'mouse') {
    moveJoystick({ touches: [{ identifier: 'mouse', clientX: e.clientX, clientY: e.clientY }] });
  }
});
window.addEventListener('mouseup', () => {
  if (joystickPointerId === 'mouse') endJoystick({ touches: [] });
});

function startJoystick(e) {
  e.preventDefault && e.preventDefault();
  const t = e.touches[0];
  const rect = joystickBase.getBoundingClientRect();
  joystickStart = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  joystickPointerId = t.identifier;
  joystickActive = true;
  moveJoystick(e);
}

function moveJoystick(e) {
  if (!joystickActive) return;
  e.preventDefault && e.preventDefault();
  let t;
  for (const touch of e.touches) if (touch.identifier === joystickPointerId) { t = touch; break; }
  if (!t) return;
  let dx = t.clientX - joystickStart.x;
  let dy = t.clientY - joystickStart.y;
  const dist = Math.hypot(dx, dy);
  const max = 40;
  if (dist > max) { dx = dx / dist * max; dy = dy / dist * max; }
  joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
  Match.joystick.x = dx / max;
  Match.joystick.y = dy / max;
}

function endJoystick() {
  joystickActive = false;
  joystickPointerId = null;
  joystickStick.style.transform = 'translate(0, 0)';
  Match.joystick.x = 0; Match.joystick.y = 0;
}

// Botões
function bindActionBtn(id, key) {
  const btn = document.getElementById(id);
  const press = (e) => { e.preventDefault(); Match.actions[key] = true; };
  const release = (e) => { e.preventDefault(); Match.actions[key] = false; };
  btn.addEventListener('touchstart', press, { passive: false });
  btn.addEventListener('touchend', release, { passive: false });
  btn.addEventListener('touchcancel', release, { passive: false });
  btn.addEventListener('mousedown', press);
  btn.addEventListener('mouseup', release);
  btn.addEventListener('mouseleave', release);
}
bindActionBtn('btn-pass', 'pass');
bindActionBtn('btn-shoot', 'shoot');
bindActionBtn('btn-sprint', 'sprint');

// Teclado (para testes em desktop)
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ') { Match.actions.shoot = true; }
  if (e.key.toLowerCase() === 'e') { Match.actions.pass = true; }
});
window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
  if (e.key === ' ') Match.actions.shoot = false;
  if (e.key.toLowerCase() === 'e') Match.actions.pass = false;
});

// =================== UPDATE / LÓGICA ===================
function updateMatch(dt) {
  if (!Match.active) return;

  // Tempo
  Match.time += dt;
  if (Match.time >= Match.duration) { endMatch(); return; }

  if (Match.goalCooldown > 0) Match.goalCooldown -= dt;

  const player = Match.playerMesh;
  if (!player) return;

  // Input (joystick + teclado)
  let ix = Match.joystick.x;
  let iy = Match.joystick.y;
  if (keys['a'] || keys['arrowleft']) ix = -1;
  if (keys['d'] || keys['arrowright']) ix = 1;
  if (keys['w'] || keys['arrowup']) iy = -1;
  if (keys['s'] || keys['arrowdown']) iy = 1;

  // Velocidade do jogador baseada em atributos
  const p = Career.player;
  const baseSpeed = 6 + p.attributes.speed * 0.08;
  const sprint = Match.actions.sprint ? 1.5 : 1;
  const speed = baseSpeed * sprint;

  // Movimento
  player.position.x += ix * speed * dt;
  player.position.z += iy * speed * dt;

  // Limites do campo
  player.position.x = Math.max(-FIELD_W / 2 + 1, Math.min(FIELD_W / 2 - 1, player.position.x));
  player.position.z = Math.max(-FIELD_H / 2 + 1, Math.min(FIELD_H / 2 - 1, player.position.z));

  // Rotação para direção do movimento
  if (Math.abs(ix) > 0.1 || Math.abs(iy) > 0.1) {
    const targetAngle = Math.atan2(ix, iy);
    // Suaviza
    let cur = player.rotation.y;
    let diff = targetAngle - cur;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    player.rotation.y += diff * Math.min(1, dt * 12);
  }

  // Animação simples (pernas)
  const animSpeed = Math.hypot(ix, iy) * (Match.actions.sprint ? 20 : 12);
  Match.animTime = (Match.animTime || 0) + dt * animSpeed;
  const swing = Math.sin(Match.animTime) * 0.4;
  const ud = player.userData;
  if (ud.legL) { ud.legL.rotation.x = swing; ud.legR.rotation.x = -swing; }
  if (ud.armL) { ud.armL.rotation.x = -swing * 0.7; ud.armR.rotation.x = swing * 0.7; }

  // Companheiros seguem jogador (formação simples)
  Match.teamMates.forEach((tm, i) => {
    const offX = (i - 1) * 8;
    const targetX = player.position.x + offX;
    const targetZ = player.position.z + 10;
    tm.mesh.position.x += (targetX - tm.mesh.position.x) * Math.min(1, dt * 2);
    tm.mesh.position.z += (targetZ - tm.mesh.position.z) * Math.min(1, dt * 2);
    tm.mesh.position.x = Math.max(-FIELD_W / 2 + 1, Math.min(FIELD_W / 2 - 1, tm.mesh.position.x));
    tm.mesh.position.z = Math.max(-FIELD_H / 2 + 1, Math.min(FIELD_H / 2 - 1, tm.mesh.position.z));
  });

  // Bola: física
  const ball = Match.ball;
  ball.mesh.position.x += ball.velocity.x * dt;
  ball.mesh.position.z += ball.velocity.z * dt;
  ball.velocity.multiplyScalar(0.985); // atrito

  // Colisão jogador↔bola (driblar)
  const dx = ball.mesh.position.x - player.position.x;
  const dz = ball.mesh.position.z - player.position.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 1.2) {
    // Empurra a bola na direção do movimento
    const power = speed * 0.9;
    if (Math.hypot(ix, iy) > 0.1) {
      ball.velocity.x = ix * power;
      ball.velocity.z = iy * power;
    } else if (dist < 0.8) {
      // Chutinho leve pra frente
      ball.velocity.x += Math.sin(player.rotation.y) * 3;
      ball.velocity.z += Math.cos(player.rotation.y) * 3;
    }
    // Evita sobreposição
    if (dist > 0.01) {
      ball.mesh.position.x = player.position.x + dx / dist * 1.2;
      ball.mesh.position.z = player.position.z + dz / dist * 1.2;
    }
  }

  // Chute
  if (Match.actions.shoot && !Match.lastAction.shoot) {
    const d = Math.hypot(dx, dz);
    if (d < 3) {
      const power = 15 + p.attributes.shot * 0.25;
      const dirX = Math.sin(player.rotation.y);
      const dirZ = Math.cos(player.rotation.y);
      ball.velocity.x = dirX * power;
      ball.velocity.z = dirZ * power;
      ball.mesh.position.y = 0.4;
      showToast('⚽ CHUTE!', 600);
    }
  }
  Match.lastAction.shoot = Match.actions.shoot;

  // Passe
  if (Match.actions.pass && !Match.lastAction.pass) {
    const d = Math.hypot(dx, dz);
    if (d < 3) {
      // Passe para companheiro mais próximo à frente
      let best = null, bestScore = -Infinity;
      Match.teamMates.forEach(tm => {
        const tdx = tm.mesh.position.x - player.position.x;
        const tdz = tm.mesh.position.z - player.position.z;
        const td = Math.hypot(tdx, tdz);
        const forward = -tdz; // atacando para -Z (gol adversário)
        const score = forward * 2 - td;
        if (score > bestScore) { bestScore = score; best = tm; }
      });
      if (best) {
        const tdx = best.mesh.position.x - ball.mesh.position.x;
        const tdz = best.mesh.position.z - ball.mesh.position.z;
        const td = Math.hypot(tdx, tdz) || 1;
        const power = 10 + p.attributes.pass * 0.15;
        ball.velocity.x = (tdx / td) * power;
        ball.velocity.z = (tdz / td) * power;
        showToast('👟 PASSE!', 500);
      }
    }
  }
  Match.lastAction.pass = Match.actions.pass;

  // IA dos adversários
  Match.aiPlayers.forEach((ai, i) => {
    const target = ball.mesh.position;
    const ax = ai.mesh.position.x;
    const az = ai.mesh.position.z;
    const tdx = target.x - ax;
    const tdz = target.z - az;
    const tdist = Math.hypot(tdx, tdz);
    const aiSpeed = 4.5 + i * 0.2;
    if (tdist > 1) {
      ai.mesh.position.x += (tdx / tdist) * aiSpeed * dt;
      ai.mesh.position.z += (tdz / tdist) * aiSpeed * dt;
    }
    // Rotação
    ai.mesh.rotation.y = Math.atan2(tdx, tdz);

    // IA pega a bola
    if (tdist < 1.0) {
      // Chuta em direção ao gol do jogador
      const goalZ = FIELD_H / 2;
      const gdx = 0 - ball.mesh.position.x;
      const gdz = goalZ - ball.mesh.position.z;
      const gd = Math.hypot(gdx, gdz) || 1;
      const power = 12;
      ball.velocity.x = (gdx / gd) * power + (Math.random() - 0.5) * 2;
      ball.velocity.z = (gdz / gd) * power;
    }

    ai.mesh.position.x = Math.max(-FIELD_W / 2 + 1, Math.min(FIELD_W / 2 - 1, ai.mesh.position.x));
    ai.mesh.position.z = Math.max(-FIELD_H / 2 + 1, Math.min(FIELD_H / 2 - 1, ai.mesh.position.z));
  });

  // Bola: limites e gols
  if (Math.abs(ball.mesh.position.x) > FIELD_W / 2 + 1) {
    // Saiu pela lateral
    ball.velocity.set(0, 0, 0);
    ball.mesh.position.x = Math.sign(ball.mesh.position.x) * (FIELD_W / 2 - 1);
  }

  // Gol adversário (norte, z = -FIELD_H/2)
  if (ball.mesh.position.z < -FIELD_H / 2 + 0.5 && Math.abs(ball.mesh.position.x) < GOAL_W / 2) {
    if (Match.goalCooldown <= 0) {
      Match.scoreHome++;
      Match.goalCooldown = 3;
      Match.playerScoreThisMatch = (Match.playerScoreThisMatch || 0) + 1;
      showToast('⚽ GOL!', 1500);
      resetPositions();
    }
  }
  // Gol do jogador (sul, z = FIELD_H/2) - adversário marca
  if (ball.mesh.position.z > FIELD_H / 2 - 0.5 && Math.abs(ball.mesh.position.x) < GOAL_W / 2) {
    if (Match.goalCooldown <= 0) {
      Match.scoreAway++;
      Match.goalCooldown = 3;
      showToast('❌ Gol do adversário', 1500);
      resetPositions();
    }
  }
  if (ball.mesh.position.z < -FIELD_H / 2 || ball.mesh.position.z > FIELD_H / 2) {
    ball.velocity.z *= -0.3;
    ball.mesh.position.z = Math.sign(ball.mesh.position.z) * (FIELD_H / 2 - 0.5);
  }

  // Câmera segue jogador (visão de PSP clássica: meio-campo elevado)
  const camTargetX = player.position.x * 0.6;
  const camTargetZ = player.position.z + 14;
  Game.camera.position.x += (camTargetX - Game.camera.position.x) * Math.min(1, dt * 3);
  Game.camera.position.z += (camTargetZ - Game.camera.position.z) * Math.min(1, dt * 3);
  Game.camera.position.y = 22;
  Game.camera.lookAt(player.position.x * 0.5, 0, player.position.z - 3);

  // Atualiza HUD
  updateScoreboard();
}

function resetPositions() {
  Match.playerMesh.position.set(0, 0, 10);
  Match.ball.mesh.position.set(0, 0.4, 0);
  Match.ball.velocity.set(0, 0, 0);
  Match.aiPlayers.forEach((ai, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    ai.mesh.position.set((col - 1) * 10, 0, -20 - row * 10);
  });
}

function updateScoreboard() {
  const mins = Math.floor(Match.time / 60);
  const secs = Math.floor(Match.time % 60);
  document.getElementById('timer').textContent =
    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  document.getElementById('score').textContent = `${Match.scoreHome} - ${Match.scoreAway}`;
  const p = Career.player;
  document.getElementById('team-home').textContent = (p.club || 'MEU TIME').substring(0, 8).toUpperCase();
  document.getElementById('team-away').textContent = 'ADVERSÁRIO';
}

// =================== FIM DE PARTIDA ===================
function endMatch() {
  Match.active = false;
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('touch-controls').classList.add('hidden');

  const p = Career.player;
  const won = Match.scoreHome > Match.scoreAway;
  const draw = Match.scoreHome === Match.scoreAway;
  const goals = Match.playerScoreThisMatch || 0;

  let xpGain = won ? 150 : draw ? 80 : 40;
  xpGain += goals * 30;

  let repGain = won ? 5 : draw ? 2 : 0;
  repGain += goals * 2;

  let salary = 0;
  if (Match.mode === 'career') {
    p.xp += xpGain;
    p.reputation += repGain;
    p.seasonGoals += goals;
    p.seasonMatches++;
    p.leaguePlayed++;
    p.leaguePoints += won ? 3 : draw ? 1 : 0;
    p.trainPoints += won ? 2 : 1;
    salary = won ? Math.floor(p.salary * 0.1) : 0;

    // Nível
    while (p.xp >= p.level * 200) {
      p.xp -= p.level * 200;
      p.level++;
      p.trainPoints += 2;
      showToast(`🎉 Nível ${p.level}!`);
    }

    // Chance de proposta
    if (p.reputation > 15 && Math.random() < 0.35) {
      generateOffer();
    }
  }

  document.getElementById('result-title').textContent = won ? '🏆 VITÓRIA!' : draw ? '🤝 EMPATE' : '😞 DERROTA';
  document.getElementById('result-score').textContent = `${Match.scoreHome} - ${Match.scoreAway}`;
  document.getElementById('result-rewards').innerHTML =
    `XP: <strong>+${xpGain}</strong><br>
     Reputação: <strong>+${repGain}</strong><br>
     ${salary > 0 ? `Salário: <strong>$${salary}</strong><br>` : ''}
     Gols seus: <strong>${goals}</strong><br>
     ${won ? 'Pontos de treino: <strong>+2</strong>' : 'Pontos de treino: <strong>+1</strong>'}`;

  showScreen('match-result');
  Game.state = 'career';
}

function generateOffer() {
  const p = Career.player;
  const available = CLUB_TIERS.filter(c => c.tier > p.clubTier);
  if (available.length === 0) return;
  const club = available[Math.floor(Math.random() * available.length)];
  const offer = {
    club: club.name,
    tier: club.tier,
    salary: club.salary + Math.floor(Math.random() * 2000),
    years: 2 + Math.floor(Math.random() * 3)
  };
  Career.offers.push(offer);
  showToast(`📨 Proposta de ${club.name}!`, 3000);
}

// =================== BOTÕES DE UI ===================
document.getElementById('btn-result-continue').addEventListener('click', () => {
  if (Match.mode === 'career') {
    updateCareerHub();
    showScreen('career-hub');
  } else {
    showScreen('main-menu');
  }
});

document.getElementById('btn-pause').addEventListener('click', () => {
  if (!Match.active) return;
  Match.paused = true;
  Match.active = false;
  showScreen('pause-menu');
});

document.getElementById('btn-resume').addEventListener('click', () => {
  hideAllScreens();
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('touch-controls').classList.remove('hidden');
  Match.active = true;
});

document.getElementById('btn-quit').addEventListener('click', () => {
  Match.active = false;
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('touch-controls').classList.add('hidden');
  if (Match.mode === 'career') {
    updateCareerHub();
    showScreen('career-hub');
  } else {
    showScreen('main-menu');
  }
  Game.state = 'menu';
});

// =================== LOOP PRINCIPAL ===================
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(Game.clock.getDelta(), 0.05);

  if (Game.state === 'match' && Match.active) {
    updateMatch(dt);
  }

  if (Game.renderer && Game.scene && Game.camera) {
    Game.renderer.render(Game.scene, Game.camera);
  }
}

// =================== INIT ===================
function init() {
  initThree();
  // Cena de fundo do menu (campo leve)
  buildField();
  // Câmera mais distante no menu
  Game.camera.position.set(0, 35, 45);
  Game.camera.lookAt(0, 0, 0);

  animate();
  showScreen('main-menu');
}

// Aguarda Three.js carregar
if (window.THREE) {
  init();
} else {
  window.addEventListener('load', () => {
    if (window.THREE) init();
    else {
      document.getElementById('main-menu').innerHTML =
        '<h2 style="color:#ff5555">Erro: Three.js não carregou</h2><p style="color:#fff">Verifique sua conexão</p>';
    }
  });
}