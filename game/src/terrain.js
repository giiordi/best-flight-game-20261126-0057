const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function seededRandom(seed) {
  let state = (Number(seed) >>> 0) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export class RidgeWorld {
  constructor(seed = 1) {
    this.seed = seed;
    this.random = seededRandom(seed);
    this.peaks = Array.from({ length: 13 }, (_, i) => ({
      x: i * 178 - 120,
      h: 75 + this.random() * 145,
      shoulder: 45 + this.random() * 65,
    }));
    this.trees = Array.from({ length: 78 }, (_, i) => ({
      x: this.random() * 2800 - 650,
      z: 180 + this.random() * 2100,
      h: 12 + this.random() * 24,
      tone: Math.floor(this.random() * 3),
    }));
    this.clouds = Array.from({ length: 19 }, (_, i) => ({
      x: this.random() * 1500 - 100,
      y: 80 + this.random() * 225,
      s: 0.65 + this.random() * 1.1,
      drift: this.random() * 0.4 + 0.08,
    }));
  }

  heightAt(x, z) {
    const ridge = Math.sin(x * 0.0024 + z * 0.0008) * 135 + Math.sin(x * 0.006 + z * 0.002) * 43;
    const basin = Math.exp(-Math.pow((x - 120) / 280, 2)) * 76;
    const near = 38 + ridge - basin + Math.sin(z * 0.0014) * 24;
    const runway = Math.abs(x - 120) < 47 && z < 530;
    return runway ? 24 : Math.max(10, near);
  }

  drawSky(ctx, time) {
    const sky = ctx.createLinearGradient(0, 0, 0, 500);
    sky.addColorStop(0, '#79b8d1');
    sky.addColorStop(0.47, '#f6bb78');
    sky.addColorStop(1, '#ef8057');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1280, 720);
    const glow = ctx.createRadialGradient(985, 180, 5, 985, 180, 350);
    glow.addColorStop(0, '#fff2bdcc');
    glow.addColorStop(0.12, '#ffd68880');
    glow.addColorStop(1, '#ffc77b00');
    ctx.fillStyle = glow;
    ctx.fillRect(620, 0, 660, 500);
    ctx.fillStyle = '#fff1bd';
    ctx.beginPath(); ctx.arc(985, 180, 37, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.78;
    for (const cloud of this.clouds) this.drawCloud(ctx, (cloud.x + time * cloud.drift) % 1450 - 80, cloud.y, cloud.s);
    ctx.globalAlpha = 1;
  }

  drawCloud(ctx, x, y, s) {
    ctx.fillStyle = '#fff1d4';
    ctx.beginPath();
    ctx.ellipse(x, y + 11 * s, 48 * s, 13 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 20 * s, y + 3 * s, 24 * s, 16 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 3 * s, y - 7 * s, 28 * s, 23 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 29 * s, y + 2 * s, 24 * s, 17 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#edb58f';
    ctx.beginPath(); ctx.ellipse(x + 6 * s, y + 12 * s, 37 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
  }

  drawRidges(ctx, horizon, bank, altitude) {
    const layers = [
      { shift: -28, scale: 0.52, color: '#9b8790', light: '#c8a092' },
      { shift: 9, scale: 0.72, color: '#687d7d', light: '#a3a17f' },
      { shift: 54, scale: 1, color: '#526e65', light: '#a88c62' },
    ];
    layers.forEach((layer, li) => {
      const points = [];
      for (let x = -100; x <= 1380; x += 22) {
        const worldX = x + bank * (1.2 + li * 0.4);
        const wave = Math.sin(worldX * 0.0041 + li * 1.7) * 42 + Math.sin(worldX * 0.012 + li) * 13;
        const peak = Math.pow(Math.max(0, Math.sin(worldX * 0.0023 + li * 1.1)), 3) * this.peaks[(Math.floor((worldX + 800) / 178) % 13 + 13) % 13].h * layer.scale;
        points.push({ x, y: horizon + layer.shift + wave - peak + altitude * 0.055 });
      }
      ctx.beginPath(); ctx.moveTo(points[0].x, 540);
      for (const p of points) ctx.lineTo(p.x, p.y);
      ctx.lineTo(1380, 570); ctx.closePath(); ctx.fillStyle = layer.color; ctx.fill();
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = layer.light; ctx.globalAlpha = li === 2 ? 0.42 : 0.26; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
      if (li === 2) this.drawValley(ctx, points, horizon, bank);
    });
  }

  drawValley(ctx, points, horizon, bank) {
    const ground = ctx.createLinearGradient(0, horizon, 0, 650);
    ground.addColorStop(0, '#778266'); ground.addColorStop(0.35, '#65745c'); ground.addColorStop(1, '#354b48');
    ctx.beginPath(); ctx.moveTo(0, points[0].y);
    for (const p of points) ctx.lineTo(p.x, p.y);
    ctx.lineTo(1280, 720); ctx.lineTo(0, 720); ctx.closePath(); ctx.fillStyle = ground; ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.strokeStyle = '#a6cfbc'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const y = horizon + 28 + i * 18;
      const x = 665 + Math.sin(i * 0.39 + bank * 0.005) * (55 + i * 8);
      if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.strokeStyle = '#daf0d5'; ctx.globalAlpha = 0.5; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    this.drawForest(ctx, horizon, bank);
    this.drawAirfield(ctx, horizon, bank);
  }

  drawForest(ctx, horizon, bank) {
    for (const tree of this.trees) {
      const depth = tree.z;
      const scale = clamp(150 / depth, 0.08, 0.72);
      const x = 640 + (tree.x - bank * 0.3) * scale;
      const y = horizon + 75 + (depth / 22) + (tree.x * 0.015);
      if (x < -30 || x > 1310 || y > 690 || y < horizon + 32) continue;
      const h = tree.h * scale * 1.8;
      ctx.fillStyle = '#384d3f'; ctx.fillRect(x - 1.4 * scale, y - h * 0.28, 3 * scale, h * 0.33);
      ctx.fillStyle = ['#365b4b', '#426d53', '#587451'][tree.tone];
      ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x - h * 0.36, y - h * 0.22); ctx.lineTo(x + h * 0.38, y - h * 0.22); ctx.closePath(); ctx.fill();
    }
  }

  drawAirfield(ctx, horizon, bank) {
    const scale = clamp(150 / 500, 0.2, 0.5);
    const x = 640 + (120 - bank * 0.3) * scale;
    const y = horizon + 91;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale * 0.58);
    ctx.fillStyle = '#353c40'; ctx.beginPath(); ctx.moveTo(-58, 0); ctx.lineTo(58, 0); ctx.lineTo(165, 275); ctx.lineTo(-165, 275); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f7e8b7'; ctx.lineWidth = 5; ctx.setLineDash([18, 14]);
    ctx.beginPath(); ctx.moveTo(0, 7); ctx.lineTo(0, 272); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#f5f0d6'; ctx.font = 'bold 19px Arial'; ctx.textAlign = 'center'; ctx.fillText('09', 0, 53);
    ctx.fillStyle = '#be8058'; ctx.fillRect(-260, 125, 32, 75); ctx.fillStyle = '#f4d48a'; ctx.fillRect(-249, 139, 10, 22);
    ctx.fillStyle = '#414f4b'; ctx.fillRect(-295, 204, 50, 35); ctx.fillStyle = '#cf9f68'; ctx.fillRect(-286, 190, 32, 18);
    ctx.restore();
  }

  drawRunway(ctx, horizon, bank) { this.drawAirfield(ctx, horizon, bank); }
}
