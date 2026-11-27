/* Three progressively tighter courses; crossing-plane tests make every arch count once. */
'use strict';
(() => {
  const C = window.CR;
  const COURSES = [
    { name: 'Dusk Run', subtitle: 'Find your line.', arches: 10, radius: 150, time: 61, speed: 166, wind: 3, spacing: 1050 },
    { name: 'Needle Gap', subtitle: 'Trust the bank.', arches: 12, radius: 119, time: 64, speed: 185, wind: 12, spacing: 1090 },
    { name: 'Golden Hour', subtitle: 'Outrun the last light.', arches: 14, radius: 102, time: 65, speed: 204, wind: 21, spacing: 1130 }
  ];
  class CanyonRace {
    constructor(canyon) { this.canyon = canyon; this.results = []; this.startCourse(0); }
    get config() { return COURSES[this.courseIndex]; }
    get totalScore() { return this.results.reduce((sum, row) => sum + row.score, 0); }
    startCourse(index) {
      this.courseIndex = index; this.elapsed = 0; this.penalty = 0;
      this.hits = 0; this.misses = 0; this.nearMisses = 0; this.gatePoints = 0;
      this.nextArch = 0; this.message = ''; this.messageTime = 0; this.complete = false;
      const cfg = this.config;
      this.arches = Array.from({ length: cfg.arches }, (_, i) => {
        const z = 1050 + i * cfg.spacing;
        return { index: i, z, x: this.canyon.center(z) + Math.sin(i * 1.9 + index) * (index ? 95 : 60), y: 220 + Math.sin(i * 1.3) * (30 + index * 14), radius: cfg.radius, boost: i % 3 === 2, resolved: false };
      });
      this.notify(cfg.subtitle.toUpperCase(), '#ffe1a0', 3);
    }
    get remaining() { return Math.max(0, this.config.time - this.elapsed - this.penalty); }
    notify(text, color = '#ffe4a2', duration = 2) {
      this.message = text; this.messageColor = color; this.messageTime = duration;
    }
    update(dt, plane, audio) {
      this.elapsed += dt; this.messageTime = Math.max(0, this.messageTime - dt);
      const gate = this.arches[this.nextArch];
      if (gate && plane.z >= gate.z) {
        const f = C.clamp((gate.z - plane.previousZ) / Math.max(.001, plane.z - plane.previousZ), 0, 1);
        const x = plane.x - plane.vx * dt * (1 - f), y = plane.y - plane.vy * dt * (1 - f);
        const distance = Math.hypot((x - gate.x) / gate.radius, (y - gate.y) / (gate.radius * .88));
        gate.resolved = true; this.nextArch++;
        if (distance < .9) {
          this.hits++; this.gatePoints += 500; audio.effect('arch');
          if (gate.boost) { plane.boost = Math.min(100, plane.boost + 58); this.gatePoints += 250; this.notify('BOOST GATE  /  +250  /  TANK REFILLED'); }
          else this.notify('CLEAN ARCH  /  +500', '#ffe4a2', 1.3);
          if (distance > .63) { this.nearMisses++; this.gatePoints += 350; audio.effect('near'); this.notify('ON THE EDGE  /  NEAR MISS +350', '#ffe7ae'); }
        } else {
          this.misses++; this.penalty += 4;
          this.notify('ARCH MISSED  /  +4 SEC', '#ff9a7a');
          if (distance < 1.2) plane.damage(10, this, audio);
        }
      }
      if (this.nextArch === this.arches.length && !this.complete && this.remaining > 0 && plane.hull > 0) {
        this.complete = true;
        const score = Math.round(this.gatePoints + this.remaining * 100 + plane.hull * 20);
        const grade = this.grade(this.hits / this.config.arches, plane.hull, this.remaining / this.config.time);
        this.results.push({ name: this.config.name, grade, score, time: this.elapsed + this.penalty, hits: this.hits, count: this.config.arches, near: this.nearMisses, hull: plane.hull });
        audio.effect('finish');
      }
    }
    grade(ratio, hull, reserve) {
      const merit = ratio * .6 + hull / 100 * .22 + reserve * .18;
      return merit >= .86 ? 'S' : merit >= .73 ? 'A' : merit >= .56 ? 'B' : 'C';
    }
    drawArch(g, arch, camera, canyon, time) {
      const center = canyon.project(arch.x, arch.y, arch.z, camera);
      const r = arch.radius, count = 24;
      const point = (angle, radius, depth = 0) => canyon.project(arch.x + Math.cos(angle) * radius, arch.y + Math.sin(angle) * radius * .88, arch.z + depth, camera);
      const inner = [], outer = [], back = [];
      for (let i = 0; i < count; i++) {
        const a = i / count * Math.PI * 2;
        const rough = 1.27 + C.hash(i + arch.index * 71, canyon.seed) * .16;
        inner.push(point(a, r)); outer.push(point(a, r * rough)); back.push(point(a, r * rough, 58));
      }
      const fog = C.clamp((arch.z - camera.z) / 6800, 0, .65);
      for (let i = 0; i < count; i++) {
        const j = (i + 1) % count;
        C.poly(g, [outer[i], outer[j], back[j], back[i]], C.tint([109, 59, 64], [223, 153, 123], fog));
      }
      for (let i = 0; i < count; i++) {
        const j = (i + 1) % count;
        const light = .68 + Math.sin(i / count * Math.PI * 2) * .24 + C.hash(i + 30, canyon.seed) * .15;
        C.poly(g, [outer[i], outer[j], inner[j], inner[i]], C.tint([223 * light, 124 * light, 77 * light], [232, 162, 126], fog), '#f4b27b22', .5);
      }
      // The inset luminous race markers trace a genuine opening in the rock.
      g.save(); g.lineJoin = 'round';
      g.strokeStyle = arch.boost ? '#ffe9a5' : '#ffbd62';
      g.shadowColor = arch.boost ? '#ffe9a5' : '#ff992e';
      g.shadowBlur = Math.min(20, 10 * center.scale);
      g.lineWidth = C.clamp(center.scale * 4, 1, 5);
      g.beginPath(); inner.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.closePath(); g.stroke();
      g.shadowBlur = 0;
      for (let i = 0; i < count; i += 3) {
        const a = i / count * Math.PI * 2;
        const p = point(a, r * 1.1), q = point(a, r * 1.2);
        g.strokeStyle = '#ffe9b8'; g.lineWidth = Math.max(1, center.scale * 2);
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
      }
      if (arch.index === this.nextArch && center.depth < 4200 && center.depth > 260) {
        const top = point(Math.PI * .5, r * 1.65);
        const size = C.clamp(15 * center.scale, 12, 21);
        g.font = `bold ${size}px monospace`; g.textAlign = 'center'; g.fillStyle = '#fff0c9';
        const label = arch.boost ? 'BOOST' : `ARCH ${String(arch.index + 1).padStart(2, '0')}`;
        g.fillText(label, top.x, top.y - 6);
        g.font = '11px monospace'; g.fillStyle = '#ffe1a2';
        g.fillText(`${Math.max(0, Math.round(arch.z - (camera.z + 220)))} M`, top.x, top.y + 11);
      }
      if (arch.boost && center.depth < 2400) {
        const p = point(0, r * .5), q = point(Math.PI, r * .5);
        g.strokeStyle = '#ffdf9270'; g.setLineDash([4, 12]); g.lineWidth = 1;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
      }
      g.restore();
    }
  }
  C.COURSES = COURSES; C.CanyonRace = CanyonRace;
})();
