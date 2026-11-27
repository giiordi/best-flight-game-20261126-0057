/* The canyon is a projected ribbon of hand-shaped strata, painted back to front. */
'use strict';
window.CR = {};
(() => {
  const C = window.CR;
  C.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  C.mix = (a, b, t) => a + (b - a) * t;
  C.hash = (n, seed = 1) => {
    const v = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  C.poly = (g, points, fill, stroke, width = 1) => {
    g.beginPath();
    points.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y));
    g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(); }
  };
  C.tint = (a, b, t) => {
    const rgb = a.map((v, i) => Math.round(C.mix(v, b[i], C.clamp(t, 0, 1))));
    return `rgb(${rgb.join(',')})`;
  };
  class CanyonLandscape {
    constructor(seed) { this.seed = seed; this.focal = 700; this.horizon = 270; }
    center(z) {
      return 200 * Math.sin(z / 2100 + this.seed * .17) + 95 * Math.sin(z / 970);
    }
    width(z, course = 0) {
      return 450 - course * 55 + Math.sin(z / 860 + .8) * 42;
    }
    river(z) { return this.center(z) + Math.sin(z / 790) * 65; }
    height(z, side) {
      return 430 + Math.sin(z / 670 + side * 1.6) * 70 + Math.sin(z / 250 + side) * 22;
    }
    camera(plane) {
      return { x: plane.x, y: plane.y + 70, z: plane.z - 220 };
    }
    project(x, y, z, camera) {
      const depth = Math.max(24, z - camera.z);
      const scale = this.focal / depth;
      return { x: 640 + (x - camera.x) * scale, y: this.horizon + (camera.y - y) * scale, scale, depth };
    }
    sky(g, plane, time, course) {
      const dark = course === 2 ? .15 : 0;
      const sky = g.createLinearGradient(0, 0, 0, 420);
      sky.addColorStop(0, course === 2 ? '#694464' : '#9b626c');
      sky.addColorStop(.46, '#e99878');
      sky.addColorStop(1, '#ffe2a0');
      g.fillStyle = sky; g.fillRect(0, 0, 1280, 720);
      const sx = 870 - plane.x * .026;
      const glow = g.createRadialGradient(sx, 200, 12, sx, 200, 270);
      glow.addColorStop(0, '#fff5bcaa'); glow.addColorStop(.5, '#ffd28336'); glow.addColorStop(1, '#ffd28300');
      g.fillStyle = glow; g.fillRect(400, 0, 880, 500);
      g.fillStyle = '#ffe8ad'; g.beginPath(); g.arc(sx, 197, 60, 0, Math.PI * 2); g.fill();
      g.save();
      g.beginPath(); g.arc(sx, 197, 60, 0, Math.PI * 2); g.clip();
      g.fillStyle = '#e9a277';
      for (let i = 0; i < 5; i++) g.fillRect(sx - 65, 219 + i * 10, 130, 2 + i);
      g.restore();
      for (let i = 0; i < 11; i++) {
        const x = C.hash(i + 7, this.seed) * 1450 - 80;
        const y = 40 + C.hash(i + 40, this.seed) * 140;
        const w = 80 + C.hash(i + 14, this.seed) * 180;
        g.fillStyle = i % 2 ? '#ffd5a42b' : '#6c496a20';
        g.beginPath(); g.ellipse(x + Math.sin(time * .025 + i) * 6, y, w, 4 + i % 4, -.06, 0, Math.PI * 2); g.fill();
      }
      for (let layer = 0; layer < 4; layer++) {
        const points = [{ x: -10, y: 420 }];
        const baseline = 280 + layer * 19;
        for (let i = -1; i < 23; i++) {
          const x = i * 67 - plane.x * (.025 + layer * .017);
          const h = 12 + C.hash(i + layer * 83, this.seed) * (22 + layer * 14);
          points.push({ x, y: baseline - h }, { x: x + 39, y: baseline - h }, { x: x + 49, y: baseline - 4 });
        }
        points.push({ x: 1350, y: 420 });
        C.poly(g, points, ['#b67c81', '#a86d79', '#8d5c70', '#765064'][layer]);
      }
      if (dark) { g.fillStyle = `rgba(40,20,57,${dark})`; g.fillRect(0, 0, 1280, 720); }
      g.fillStyle = '#b47569'; g.fillRect(0, 330, 1280, 390);
    }
    wallPoint(z, side, level, course) {
      const height = this.height(z, side);
      const ledge = [0, .06, .02, .12, .07, .18, .15, .24, .27][level];
      const x = this.center(z) + side * (this.width(z, course) * (.77 + ledge) + Math.sin(z / 190 + level) * 13);
      return { x, y: height * level / 8, z };
    }
    drawSegment(g, a, b, cam, course) {
      const project = p => this.project(p.x, p.y, p.z, cam);
      const fog = Math.pow(C.clamp((a - cam.z) / 6600, 0, 1), .75) * .8;
      const quad = (p, color) => C.poly(g, p.map(project), C.tint(color, [220, 151, 126], fog));
      const ca = this.center(a), cb = this.center(b);
      const wa = this.width(a, course), wb = this.width(b, course);
      quad([{ x: ca - wa, y: 0, z: a }, { x: ca + wa, y: 0, z: a }, { x: cb + wb, y: 0, z: b }, { x: cb - wb, y: 0, z: b }], [192, 127, 86]);
      const ra = this.river(a), rb = this.river(b);
      quad([{ x: ra - 79, y: 1, z: a }, { x: ra + 79, y: 1, z: a }, { x: rb + 79, y: 1, z: b }, { x: rb - 79, y: 1, z: b }], [230, 173, 104]);
      quad([{ x: ra - 58, y: 2, z: a }, { x: ra + 58, y: 2, z: a }, { x: rb + 58, y: 2, z: b }, { x: rb - 58, y: 2, z: b }], [96, 110, 113]);
      quad([{ x: ra - 25, y: 3, z: a }, { x: ra + 33, y: 3, z: a }, { x: rb + 33, y: 3, z: b }, { x: rb - 25, y: 3, z: b }], [191, 153, 111]);
      const bands = [[100, 58, 65], [142, 69, 63], [165, 77, 62], [183, 94, 66], [154, 72, 63], [201, 111, 72], [176, 82, 64], [223, 136, 86]];
      for (const side of [-1, 1]) {
        for (let level = 0; level < 8; level++) {
          const p = [this.wallPoint(a, side, level, course), this.wallPoint(b, side, level, course), this.wallPoint(b, side, level + 1, course), this.wallPoint(a, side, level + 1, course)];
          const color = bands[level].map(v => v * (side === -1 ? 1.13 : .74));
          quad(p, color);
          const q = p.map(project);
          g.strokeStyle = C.tint(side === -1 ? [245, 157, 96] : [151, 86, 84], [219, 152, 129], fog);
          g.lineWidth = C.clamp(q[0].scale * 1.4, .35, 2.2);
          g.beginPath(); g.moveTo(q[2].x, q[2].y); g.lineTo(q[3].x, q[3].y); g.stroke();
          if (level % 2 && Math.floor(a / 130) % 3 === 0) {
            C.poly(g, [q[0], q[2], q[3]], C.tint(side < 0 ? [168, 79, 62] : [90, 54, 68], [218, 151, 126], fog), null);
          }
          if (level > 1 && Math.floor(a / 130 + level) % 4 === 0) {
            g.strokeStyle = C.tint([85, 49, 58], [215, 148, 123], fog); g.lineWidth = .8;
            g.beginPath(); g.moveTo(C.mix(q[0].x, q[1].x, .6), C.mix(q[0].y, q[1].y, .6));
            g.lineTo(C.mix(q[2].x, q[3].x, .45), C.mix(q[2].y, q[3].y, .45)); g.stroke();
          }
        }
        const topA = this.wallPoint(a, side, 8, course), topB = this.wallPoint(b, side, 8, course);
        quad([topA, topB, { x: topB.x + side * 1200, y: topB.y + 15, z: b }, { x: topA.x + side * 1200, y: topA.y + 15, z: a }], side < 0 ? [234, 147, 90] : [135, 78, 78]);
      }
      if (a - cam.z < 1800) {
        const p = this.project(ra, 3, a, cam);
        g.strokeStyle = '#f8c68270'; g.lineWidth = Math.max(1, p.scale);
        for (let j = 0; j < 3; j++) {
          const px = p.x + Math.sin(a * .06 + j) * p.scale * 42;
          g.beginPath(); g.moveTo(px - p.scale * 8, p.y + j * p.scale * 4); g.lineTo(px + p.scale * 8, p.y + j * p.scale * 4); g.stroke();
        }
      }
    }
    draw(g, plane, race, time) {
      const cam = this.camera(plane), course = race.courseIndex;
      this.sky(g, plane, time, course);
      const far = Math.floor((cam.z + 6500) / 130) * 130;
      for (let z = far; z > cam.z + 60; z -= 130) {
        const near = Math.max(z - 130, cam.z + 60);
        this.drawSegment(g, near, z, cam, course);
        for (const arch of race.arches) {
          if (arch.z >= near && arch.z < z && arch.z > cam.z + 65 && !arch.resolved) race.drawArch(g, arch, cam, this, time);
        }
      }
      const mist = g.createLinearGradient(0, 280, 0, 620);
      mist.addColorStop(0, '#ffd09b00'); mist.addColorStop(.32, '#ffd09b0c'); mist.addColorStop(1, '#d8967500');
      g.fillStyle = mist; g.fillRect(0, 280, 1280, 340);
      for (let i = 0; i < 42; i++) {
        const phase = (time * (12 + i % 8) + C.hash(i, this.seed) * 1300) % 1300;
        const x = (C.hash(i + 50, this.seed) * 1550 - phase * .26 + 1500) % 1400 - 60;
        const y = 315 + C.hash(i + 100, this.seed) * 400;
        g.fillStyle = `rgba(255,210,151,${.06 + i % 3 * .035})`;
        g.beginPath(); g.ellipse(x, y, 1 + i % 3, .8, 0, 0, Math.PI * 2); g.fill();
      }
      const vignette = g.createRadialGradient(640, 300, 230, 640, 350, 790);
      vignette.addColorStop(0, '#22142000'); vignette.addColorStop(1, '#22142083');
      g.fillStyle = vignette; g.fillRect(0, 0, 1280, 720);
    }
  }
  C.CanyonLandscape = CanyonLandscape;
})();
