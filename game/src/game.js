import { RidgeWorld, seededRandom } from './terrain.js';
import { createPlane, updatePlane, drawAircraft } from './plane.js';
import { buildRoute, activeRing, checkRing, drawTargetRing } from './rings.js';
import { drawInstruments, drawStatus, formatTime } from './instruments.js';
import { FlightAudio } from './audio.js';

const canvas = document.querySelector('#flight');
const ctx = canvas.getContext('2d');
const query = new URLSearchParams(location.search);
const seed = Number(query.get('seed')) || 1;
const world = new RidgeWorld(seed);
const rings = buildRoute(seed);
const audio = new FlightAudio();
const keys = new Set();
const game = { state: 'title', score: 0, time: 0, gate: 0, paused: false, best: 0, message: '', messageUntil: 0, hook: query.get('shot') };
let plane = createPlane();
let pointer = { x: 640, y: 360, active: false };
let boost = 0;
let last = performance.now();
let elapsed = 0;

try { game.best = Number(localStorage.getItem('skydrift-best')) || 0; } catch {}

function setState(state) { game.state = state; game.paused = false; }

function resetFlight(startAirborne = false) {
  plane = createPlane(); game.score = 0; game.time = 0; game.gate = 0; game.message = '';
  for (const ring of rings) ring.passed = false;
  if (startAirborne) {
    plane.z = rings[0].z - 360; plane.x = rings[0].x - 35; plane.y = rings[0].y - 18;
    plane.speed = 126; plane.heading = Math.atan2(rings[0].x - plane.x, rings[0].z - plane.z) * 180 / Math.PI;
    plane.airborne = true; plane.pitch = 0.04;
  }
}

function begin() { resetFlight(false); setState('playing'); audio.start(); }

function handleHook() {
  if (game.hook === 'play') { resetFlight(true); setState('playing'); }
  if (game.hook === 'end') {
    resetFlight(true); game.score = 4820; game.time = 164;
    for (const ring of rings) ring.passed = true;
    game.gate = rings.length; game.message = 'RIDGE RUN COMPLETE'; setState('complete');
  }
  if (game.hook === 'start') setState('title');
}

function steerInput() {
  let steer = (keys.has('ArrowRight') || keys.has('d') || keys.has('D') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('a') || keys.has('A') ? 1 : 0);
  let pitch = (keys.has('ArrowUp') || keys.has('w') || keys.has('W') ? 1 : 0) - (keys.has('ArrowDown') || keys.has('s') || keys.has('S') ? 1 : 0);
  if (pointer.active) {
    steer = Math.max(-1, Math.min(1, (pointer.x - 640) / 280));
    pitch = Math.max(-0.72, Math.min(0.72, (360 - pointer.y) / 220));
  }
  const throttle = (keys.has('Shift') ? 1 : 0) + boost;
  const brake = keys.has('Control') ? 1 : (keys.has('s') || keys.has('S') ? 0.2 : 0);
  return { steer, pitch, throttle, brake };
}

function projectRing(ring) {
  const forward = Math.cos(plane.heading * Math.PI / 180);
  const side = Math.sin(plane.heading * Math.PI / 180);
  const dx = ring.x - plane.x, dz = ring.z - plane.z;
  const depth = dx * side + dz * forward;
  if (depth <= 70 || depth > 2500) return null;
  const lateral = dx * forward - dz * side;
  const scale = 410 / depth;
  return { x: 640 + lateral * scale - plane.bank * depth * 0.42 * scale, y: 340 - (ring.y - plane.y) * scale * 0.52 + plane.pitch * 180, scale, depth };
}

function drawRouteMarker() {
  const i = activeRing(rings);
  if (i < 0) return;
  const ring = rings[i], point = projectRing(ring);
  if (point && point.x > 60 && point.x < 1220 && point.y > 70 && point.y < 535) {
    const radius = Math.max(12, Math.min(90, ring.radius * point.scale));
    drawTargetRing(ctx, { ...point, radius }, ring, i + 1);
  }
  const arrowX = Math.max(44, Math.min(1236, point?.x ?? 640 + Math.sign(ring.x - plane.x) * 420));
  const arrowY = point ? Math.max(92, Math.min(540, point.y)) : 155;
  const angle = point ? Math.atan2(point.y - 300, point.x - 640) : 0;
  ctx.save(); ctx.translate(arrowX, arrowY); ctx.rotate(angle); ctx.fillStyle = '#ffe391'; ctx.shadowColor = '#ffdf7c'; ctx.shadowBlur = 13;
  ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-7, -9); ctx.lineTo(-3, 0); ctx.lineTo(-7, 9); ctx.closePath(); ctx.fill(); ctx.restore();
}

function drawHorizonAndWorld() {
  const horizon = 350 + plane.pitch * 185 + plane.y * 0.01;
  ctx.save(); ctx.translate(640, horizon); ctx.rotate(-plane.bank * 0.58); ctx.translate(-640, -horizon);
  world.drawSky(ctx, elapsed);
  world.drawRidges(ctx, horizon, plane.x + Math.sin(elapsed * 0.1) * 14, plane.y);
  ctx.restore();
  if (!plane.airborne && plane.z < 560) world.drawRunway(ctx, 360 + plane.pitch * 180, plane.x - 120);
}

function drawTitle() {
  ctx.fillStyle = '#0b17217a'; ctx.fillRect(0, 0, 1280, 720);
  const vignette = ctx.createRadialGradient(640, 310, 50, 640, 310, 650);
  vignette.addColorStop(0, '#10192300'); vignette.addColorStop(1, '#101923aa'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'center'; ctx.shadowColor = '#603c35'; ctx.shadowBlur = 18;
  ctx.fillStyle = '#fff0c9'; ctx.font = 'bold 64px Georgia'; ctx.fillText('SKYDRIFT', 640, 219);
  ctx.fillStyle = '#ffc980'; ctx.font = 'bold 22px Arial'; ctx.fillText('RIDGE RUN', 640, 255); ctx.shadowBlur = 0;
  ctx.fillStyle = '#f0e1c7'; ctx.font = '15px Arial'; ctx.fillText('A golden-hour flight across the Cinderback valley', 640, 296);
  ctx.fillStyle = '#ffe2aa'; ctx.font = 'bold 12px Arial'; ctx.fillText('MISSION 01     /     THE RIVER GATES', 640, 354);
  ctx.fillStyle = '#e2dac5'; ctx.font = '13px Arial'; ctx.fillText('Lift off. Thread eight beacons. Bring the little redtail home.', 640, 380);
  ctx.fillStyle = '#f4dfb7'; ctx.font = '12px Arial';
  ctx.fillText('ARROWS / WASD  FLY      SHIFT / CTRL  THROTTLE      MOUSE  STEER      CLICK  BOOST', 640, 435);
  ctx.fillStyle = '#ffe1a0'; ctx.font = 'bold 14px Arial'; ctx.fillText('PRESS ENTER OR CLICK TO TAXI', 640, 491);
  ctx.fillStyle = '#fff1ccaa'; ctx.font = '10px Arial'; ctx.fillText('P PAUSE  /  R RESTART', 640, 518);
}

function render() {
  ctx.clearRect(0, 0, 1280, 720);
  drawHorizonAndWorld();
  const i = activeRing(rings);
  if (i >= 0 && plane.airborne) drawRouteMarker();
  drawAircraft(ctx, plane.bank, plane.pitch, elapsed, 1 - plane.health / 100);
  const nav = i >= 0 ? `GATE ${String(i + 1).padStart(2, '0')}  /  ${Math.round(Math.max(0, rings[i].z - plane.z))} FT TO BEACON` : 'RETURN TO RUNWAY 09';
  drawInstruments(ctx, plane, game, '');
  if (game.state === 'playing') {
    const msg = game.message || nav;
    ctx.save(); ctx.fillStyle = '#f6d08a'; ctx.textAlign = 'center'; ctx.font = 'bold 12px Arial'; ctx.shadowColor = '#131a22'; ctx.shadowBlur = 6; ctx.fillText(msg, 640, 92); ctx.restore();
  }
  ctx.fillStyle = '#fff0ce'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'right'; ctx.fillText(String(Math.round(plane.heading)).padStart(3, '0') + ' DEG', 1236, 37);
  ctx.fillStyle = '#fff1d0bb'; ctx.font = 'bold 9px Arial'; ctx.fillText('HDG', 1236, 52);
  if (game.paused) drawStatus(ctx, 'FLIGHT PAUSED', `SCORE  ${game.score}     TIME  ${formatTime(game.time)}`, 'PRESS P TO RETURN TO THE VALLEY');
  if (game.state === 'title') drawTitle();
  if (game.state === 'crashed') drawStatus(ctx, 'FLIGHT ENDED', `SCORE  ${game.score}     GATES  ${game.gate} / 08`, 'PRESS R TO FLY AGAIN');
  if (game.state === 'landed') drawStatus(ctx, 'SAFE LANDING', `SCORE  ${game.score}     TIME  ${formatTime(game.time)}`, 'THE REDTAIL IS HOME  /  PRESS R TO FLY AGAIN');
  if (game.state === 'complete') drawStatus(ctx, 'RIDGE RUN COMPLETE', `SCORE  ${game.score}     TIME  ${formatTime(game.time)}     BEST  ${game.best}`, 'ALL EIGHT RIVER GATES CLEARED  /  PRESS R TO FLY AGAIN');
}

function frame(now) {
  const dt = Math.min(0.04, (now - last) / 1000); last = now; elapsed += dt;
  if (game.state === 'playing' && !game.paused) {
    const input = steerInput();
    const result = updatePlane(plane, input, dt, world);
    game.time += dt;
    audio.update(plane.speed, input.throttle);
    const cleared = checkRing(plane, rings);
    if (cleared) { game.score += cleared.bonus; game.gate = cleared.index; game.message = `BEACON ${cleared.index}  +${cleared.bonus}  /  FUEL TOP-UP`; game.messageUntil = elapsed + 1.8; audio.chime(); }
    if (elapsed > game.messageUntil) game.message = '';
    if (result.impact) { setState('crashed'); audio.crash(); }
    if (plane.fuel <= 0 && plane.speed < 30) setState('crashed');
    if (plane.landed) {
      if (game.gate === rings.length) {
        game.score += 1500; game.best = Math.max(game.best, game.score);
        try { localStorage.setItem('skydrift-best', String(game.best)); } catch {}
        setState('complete');
      } else {
        setState('landed');
      }
    }
  }
  render(); requestAnimationFrame(frame);
}

window.addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
  keys.add(event.key);
  if (event.key === 'Enter' && game.state === 'title') begin();
  if ((event.key === 'r' || event.key === 'R') && game.state !== 'title') begin();
  if ((event.key === 'p' || event.key === 'P') && game.state === 'playing') game.paused = !game.paused;
}, { passive: false });
window.addEventListener('keyup', event => keys.delete(event.key));
canvas.addEventListener('pointermove', event => {
  const rect = canvas.getBoundingClientRect(); pointer.x = (event.clientX - rect.left) * 1280 / rect.width; pointer.y = (event.clientY - rect.top) * 720 / rect.height; pointer.active = true;
});
canvas.addEventListener('pointerleave', () => { pointer.active = false; });
canvas.addEventListener('pointerdown', () => {
  audio.start();
  if (game.state === 'title') begin();
  else { boost = 1; window.setTimeout(() => { boost = 0; }, 850); }
});

handleHook();
requestAnimationFrame(frame);
