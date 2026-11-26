export function buildRoute(seed = 1) {
  const turns = [0.13, -0.22, -0.12, 0.25, 0.03, -0.28, 0.2];
  const rings = [];
  let x = 90;
  let z = 620;
  for (let i = 0; i < 8; i++) {
    x += turns[(i + seed) % turns.length] * 800;
    z += 540 + (i % 3) * 80;
    rings.push({ x, z, y: 170 + Math.sin(i * 1.8 + seed) * 45, radius: 74, passed: false });
  }
  return rings;
}

export function activeRing(rings) { return rings.findIndex(r => !r.passed); }

export function checkRing(p, rings) {
  const index = activeRing(rings);
  if (index < 0) return null;
  const ring = rings[index];
  const dx = p.x - ring.x;
  const dz = p.z - ring.z;
  const dy = p.y - ring.y;
  if (Math.hypot(dx, dz) < ring.radius * 0.62 && Math.abs(dy) < 78) {
    ring.passed = true;
    p.fuel = Math.min(100, p.fuel + 24);
    return { index: index + 1, bonus: Math.round(350 + Math.max(0, 70 - Math.abs(dy)) * 2) };
  }
  return null;
}

export function drawTargetRing(ctx, point, ring, gateNumber) {
  const { x, y, radius } = point;
  ctx.save(); ctx.shadowColor = '#fff4ab'; ctx.shadowBlur = 25; ctx.strokeStyle = '#ffed91'; ctx.lineWidth = Math.max(2, radius * 0.09);
  ctx.beginPath(); ctx.ellipse(x, y, radius, radius * 0.78, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = '#fffbe4'; ctx.lineWidth = Math.max(1, radius * 0.025); ctx.beginPath(); ctx.ellipse(x, y, radius * 0.78, radius * 0.61, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fff5bf'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.fillText('GATE ' + String(gateNumber).padStart(2, '0'), x, y - radius - 13);
  ctx.restore();
}
