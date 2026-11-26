const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function panel(ctx) {
  const g = ctx.createLinearGradient(0, 584, 0, 720); g.addColorStop(0, '#172a35ee'); g.addColorStop(0.16, '#101c27f5'); g.addColorStop(1, '#09131dfc');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 594); ctx.quadraticCurveTo(640, 572, 1280, 594); ctx.lineTo(1280, 720); ctx.lineTo(0, 720); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e1ad70'; ctx.globalAlpha = 0.65; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 594); ctx.quadraticCurveTo(640, 572, 1280, 594); ctx.stroke(); ctx.globalAlpha = 1;
}

function dial(ctx, x, y, r, label, value, max, suffix, color = '#87d8d1') {
  ctx.save(); ctx.translate(x, y);
  ctx.shadowColor = color; ctx.shadowBlur = 13; ctx.fillStyle = '#0b1620'; ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = '#69818b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r + 2, 0, TAU); ctx.stroke();
  for (let i = 0; i <= 10; i++) { const a = -Math.PI * 0.78 + i * Math.PI * 1.56 / 10; const inner = r - 7; ctx.strokeStyle = i % 2 ? '#849ba0' : '#f1d9a5'; ctx.lineWidth = i % 2 ? 1 : 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner); ctx.lineTo(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2)); ctx.stroke(); }
  const a = -Math.PI * 0.78 + clamp(value / max, 0, 1) * Math.PI * 1.56;
  ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.strokeStyle = '#f4d993'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * (r - 12), Math.sin(a) * (r - 12)); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#f6e9c9'; ctx.textAlign = 'center'; ctx.font = 'bold 15px Arial'; ctx.fillText(Math.round(value), 0, 8);
  ctx.fillStyle = '#91a6ad'; ctx.font = 'bold 8px Arial'; ctx.fillText(label, 0, r + 17);
  ctx.fillStyle = '#b0c1be'; ctx.font = '8px Arial'; ctx.fillText(suffix, 0, r + 28);
  ctx.restore();
}

function horizonGauge(ctx, x, y, bank, pitch) {
  ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.arc(0, 0, 47, 0, TAU); ctx.clip();
  ctx.fillStyle = '#46839a'; ctx.fillRect(-55, -55, 110, 110); ctx.fillStyle = '#a56b4d'; ctx.fillRect(-55, 1, 110, 55);
  ctx.save(); ctx.rotate(-bank); ctx.translate(0, pitch * 65); ctx.strokeStyle = '#f2dfb1'; ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) { const yy = i * 13; ctx.beginPath(); ctx.moveTo(-22 + Math.abs(i) * 4, yy); ctx.lineTo(22 - Math.abs(i) * 4, yy); ctx.stroke(); }
  ctx.restore(); ctx.strokeStyle = '#ffe9b5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-9, 0); ctx.lineTo(0, 6); ctx.lineTo(9, 0); ctx.lineTo(26, 0); ctx.stroke();
  ctx.restore(); ctx.strokeStyle = '#d4c49c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 48, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#91a6ad'; ctx.textAlign = 'center'; ctx.font = 'bold 8px Arial'; ctx.fillText('ATTITUDE', x, y + 64);
}

function compassStrip(ctx, heading) {
  const x = 436, y = 614, w = 408;
  ctx.fillStyle = '#0a141c'; ctx.fillRect(x, y, w, 28); ctx.strokeStyle = '#50636b'; ctx.strokeRect(x, y, w, 28);
  for (let i = -8; i <= 8; i++) { const h = (Math.round(heading / 5) * 5 + i * 5 + 360) % 360; const px = 640 + i * 24; ctx.strokeStyle = '#9eb2b0'; ctx.beginPath(); ctx.moveTo(px, y + 2); ctx.lineTo(px, y + (h % 10 === 0 ? 12 : 7)); ctx.stroke(); if (h % 10 === 0) { ctx.fillStyle = '#e9d7af'; ctx.font = 'bold 8px Arial'; ctx.textAlign = 'center'; ctx.fillText(({0:'N',90:'E',180:'S',270:'W'})[h] || String(h), px, y + 23); } }
  ctx.fillStyle = '#ffcb78'; ctx.beginPath(); ctx.moveTo(640, y - 1); ctx.lineTo(633, y - 8); ctx.lineTo(647, y - 8); ctx.closePath(); ctx.fill();
}

export function drawInstruments(ctx, p, game, message = '') {
  panel(ctx);
  horizonGauge(ctx, 267, 653, p.bank, p.pitch);
  dial(ctx, 402, 660, 43, 'ALTITUDE', p.y * 32.8, 12000, 'FEET');
  dial(ctx, 878, 660, 43, 'AIRSPEED', p.speed * 1.32, 260, 'KNOTS', '#f0b16d');
  dial(ctx, 1013, 660, 43, 'VERT SPEED', p.pitch * 800 + (p.airborne ? 180 : 0), 1200, 'FT / MIN', '#e59b71');
  compassStrip(ctx, p.heading);
  const fuelColor = p.fuel < 25 ? '#f16e5e' : '#76d4af';
  ctx.fillStyle = '#87999c'; ctx.font = 'bold 9px Arial'; ctx.fillText('FUEL', 1092, 626);
  ctx.fillStyle = '#17242a'; ctx.fillRect(1090, 635, 145, 12); ctx.fillStyle = fuelColor; ctx.shadowColor = fuelColor; ctx.shadowBlur = 9; ctx.fillRect(1092, 637, 141 * p.fuel / 100, 8); ctx.shadowBlur = 0;
  ctx.fillStyle = '#f5e3b9'; ctx.font = 'bold 10px Arial'; ctx.fillText(Math.round(p.fuel) + '%', 1240, 645);
  ctx.fillStyle = '#8da2a6'; ctx.font = 'bold 8px Arial'; ctx.fillText('HULL', 1092, 674);
  ctx.fillStyle = '#19272d'; ctx.fillRect(1090, 680, 145, 8); ctx.fillStyle = p.health < 35 ? '#ed6e59' : '#79c99d'; ctx.fillRect(1092, 682, 141 * p.health / 100, 4);
  ctx.fillStyle = '#f7e8c4'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'left'; ctx.fillText('SCORE ' + String(game.score).padStart(5, '0'), 39, 637);
  ctx.fillStyle = '#a9c1c0'; ctx.font = 'bold 10px Arial'; ctx.fillText('TIME  ' + formatTime(game.time), 39, 655);
  ctx.fillText('GATES ' + String(game.gate + 1).padStart(2, '0') + ' / 08', 39, 673);
  ctx.fillStyle = '#f6d08a'; ctx.textAlign = 'center'; ctx.font = 'bold 11px Arial'; if (message) ctx.fillText(message, 640, 613);
}

export function drawStatus(ctx, text, sub, action) {
  ctx.fillStyle = '#07131c88'; ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'center'; ctx.shadowColor = '#131a22'; ctx.shadowBlur = 14;
  ctx.fillStyle = '#ffe3ad'; ctx.font = 'bold 56px Georgia'; ctx.fillText(text, 640, 275);
  ctx.shadowBlur = 0; ctx.fillStyle = '#f1e2c4'; ctx.font = '17px Arial'; ctx.fillText(sub, 640, 318);
  ctx.fillStyle = '#ffd08a'; ctx.font = 'bold 12px Arial'; ctx.fillText(action, 640, 365);
}

export function formatTime(seconds) { return Math.floor(seconds / 60).toString().padStart(2, '0') + ':' + Math.floor(seconds % 60).toString().padStart(2, '0'); }
