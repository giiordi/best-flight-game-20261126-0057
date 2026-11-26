export function createPlane() {
  return { x: 120, z: 0, y: 25, speed: 0, heading: 0, pitch: 0, bank: 0, health: 100, fuel: 100, airborne: false, stall: false, landed: false };
}

export function updatePlane(p, input, dt, world) {
  const throttle = (input.throttle || 0) - (input.brake || 0);
  const steer = input.steer || 0;
  const pitchInput = input.pitch || 0;
  p.speed = Math.max(0, Math.min(245, p.speed + throttle * 42 * dt - (p.airborne ? 5 : 1.4) * dt));
  if (!p.airborne && p.speed > 72 && p.pitch > 0.03) p.airborne = true;
  p.bank += (steer * 0.78 - p.bank * 1.9 - p.bank * Math.abs(p.bank) * 0.55) * dt;
  p.bank = Math.max(-0.72, Math.min(0.72, p.bank));
  p.heading = (p.heading + p.bank * (0.42 + p.speed / 190) * 60 * dt + 360) % 360;
  p.pitch += (pitchInput * 0.86 - p.pitch * 1.4) * dt;
  p.pitch = Math.max(-0.38, Math.min(0.42, p.pitch));
  const lift = Math.max(0, p.speed - 34) * (p.speed < 68 ? 0.012 : 0.021);
  p.stall = p.airborne && p.speed < 54;
  const climb = p.airborne ? (lift + p.pitch * 36 - (p.stall ? 17 : 0)) : 0;
  p.y += climb * dt;
  p.z += p.speed * 0.43 * dt;
  p.x += Math.sin(p.heading * Math.PI / 180) * p.speed * 0.31 * dt;
  p.fuel = Math.max(0, p.fuel - (0.08 + Math.max(0, throttle) * 0.24) * dt);
  const floor = world.heightAt(p.x, p.z);
  if (p.airborne && p.y < floor + 11) {
    if (p.speed < 72 && p.pitch < -0.04 && Math.abs(p.bank) < 0.24) { p.landed = true; p.airborne = false; p.y = floor + 4; }
    else { p.health = Math.max(0, p.health - dt * 95); p.y = floor + 10; }
  }
  return { impact: p.health <= 0, floor };
}

export function drawAircraft(ctx, bank, pitch, time, damage = 0) {
  ctx.save(); ctx.translate(640, 497 + pitch * 105); ctx.rotate(-bank * 0.45);
  ctx.shadowColor = '#f4a25a'; ctx.shadowBlur = 20;
  ctx.fillStyle = '#243441'; ctx.strokeStyle = '#d8e2d5'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-7, 3); ctx.lineTo(-188, 22); ctx.lineTo(-179, 33); ctx.lineTo(-13, 22); ctx.lineTo(-11, 58); ctx.lineTo(-45, 75); ctx.lineTo(-43, 82); ctx.lineTo(0, 70); ctx.lineTo(43, 82); ctx.lineTo(45, 75); ctx.lineTo(11, 58); ctx.lineTo(13, 22); ctx.lineTo(179, 33); ctx.lineTo(188, 22); ctx.lineTo(7, 3); ctx.lineTo(7, -28); ctx.lineTo(22, -44); ctx.lineTo(22, -50); ctx.lineTo(0, -37); ctx.lineTo(-22, -50); ctx.lineTo(-22, -44); ctx.lineTo(-7, -28); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#d98a4f'; ctx.beginPath(); ctx.moveTo(-7, 4); ctx.lineTo(-164, 22); ctx.lineTo(-13, 16); ctx.lineTo(-8, -25); ctx.lineTo(0, -35); ctx.lineTo(8, -25); ctx.lineTo(13, 16); ctx.lineTo(164, 22); ctx.lineTo(7, 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#89c9d0'; ctx.beginPath(); ctx.ellipse(0, -9, 8, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f2dfaa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18, -28); ctx.lineTo(18, -28); ctx.stroke();
  const spin = Math.sin(time * 38) * 0.5;
  ctx.strokeStyle = '#e5e9dd'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-16 + spin * 10, -45); ctx.lineTo(16 - spin * 10, -45); ctx.stroke();
  ctx.shadowBlur = 13; ctx.fillStyle = '#f06358'; ctx.beginPath(); ctx.arc(-180, 26, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#73e0c0'; ctx.beginPath(); ctx.arc(180, 26, 4, 0, Math.PI * 2); ctx.fill();
  if (damage > 0) { ctx.shadowColor = '#ff704d'; ctx.fillStyle = `rgba(255,90,55,${damage * 0.55})`; ctx.fillRect(-205, -65, 410, 155); }
  ctx.restore();
}
