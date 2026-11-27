/* Momentum, energy management, damage and the hand-painted chase-view aircraft. */
'use strict';
(() => {
  const C = window.CR;
  class StuntPlane {
    constructor(canyon) { this.canyon = canyon; this.reset(); }
    reset() {
      this.z = 0; this.x = this.canyon.center(0); this.y = 235;
      this.vx = 0; this.vy = 0; this.bank = 0; this.pitch = 0;
      this.speed = 145; this.hull = 100; this.boost = 100;
      this.boosting = false; this.damageCooldown = 0; this.shake = 0; this.propeller = 0;
      this.wind = 0; this.previousZ = 0;
    }
    damage(amount, race, audio) {
      if (this.damageCooldown > 0) return;
      this.hull = Math.max(0, this.hull - amount);
      this.damageCooldown = 1.25; this.shake = 1;
      this.speed *= .8;
      race.notify(amount === 25 ? 'WALL CLIP  /  −25 HULL' : 'HARD SCRAPE  /  −10 HULL', '#ff9778');
      audio.effect(this.hull ? 'scrape' : 'crash');
    }
    update(dt, input, race, audio) {
      this.previousZ = this.z;
      this.damageCooldown = Math.max(0, this.damageCooldown - dt);
      this.shake = Math.max(0, this.shake - dt * 1.8);
      const cfg = race.config;
      const phase = this.z / 580 + this.canyon.seed;
      this.wind = (Math.sin(phase) * .7 + Math.sin(phase * 2.31) * .3) * cfg.wind;
      const steer = C.clamp(input.right - input.left + input.mouseX, -1, 1);
      const pitch = C.clamp(input.up - input.down - input.mouseY, -1, 1);
      this.bank = C.mix(this.bank, steer * .63, 1 - Math.exp(-dt * 5));
      this.pitch = C.mix(this.pitch, pitch, 1 - Math.exp(-dt * 4));
      this.vx = C.mix(this.vx, steer * 205 + this.wind * 3.2, 1 - Math.exp(-dt * 2.1));
      this.vy = C.mix(this.vy, pitch * 115, 1 - Math.exp(-dt * 2.8));
      this.boosting = !!input.boost && this.boost > .5;
      if (this.boosting) this.boost = Math.max(0, this.boost - dt * 24);
      const target = cfg.speed + (this.boosting ? 83 : 0) - Math.abs(this.bank) * 47 - Math.max(0, this.pitch) * 15;
      this.speed = C.mix(this.speed, target, 1 - Math.exp(-dt * .9));
      this.x += this.vx * dt; this.y += this.vy * dt; this.z += this.speed * 2.15 * dt;
      this.propeller += dt * (this.speed * .6);
      const center = this.canyon.center(this.z);
      const bound = this.canyon.width(this.z, race.courseIndex) * .8 - 25;
      const offset = this.x - center;
      if (Math.abs(offset) > bound) {
        this.damage(Math.abs(this.vx) > 120 ? 25 : 10, race, audio);
        this.x = center + Math.sign(offset) * bound; this.vx *= -.25;
      }
      if (this.y < 45 || this.y > 440) {
        this.damage(10, race, audio); this.y = C.clamp(this.y, 45, 440); this.vy *= -.2;
      }
    }
    draw(g, time, crashed = false) {
      const cx = 640 + this.vx * .065, cy = 490 + this.pitch * 9;
      if (this.boosting && !crashed) {
        g.save();
        for (const side of [-1, 1]) {
          const x = cx + side * 127;
          const trail = g.createLinearGradient(x, cy + 8, x + side * 100, 760);
          trail.addColorStop(0, '#fff4c8d0'); trail.addColorStop(.35, '#ffc36b90'); trail.addColorStop(1, '#f08d5500');
          g.strokeStyle = trail; g.lineWidth = 4;
          g.beginPath(); g.moveTo(x, cy + side * this.bank * 120); g.quadraticCurveTo(x + side * 20, 610, x + side * 110, 760); g.stroke();
        }
        g.restore();
      }
      g.save(); g.translate(cx, cy); g.rotate(this.bank + (crashed ? .7 : 0));
      const poly = (pts, fill, stroke = '#533c3e', w = 1) => C.poly(g, pts.map(p => ({ x: p[0], y: p[1] })), fill, stroke, w);
      g.fillStyle = '#281d2d20'; g.beginPath(); g.ellipse(10, 65, 146, 20, 0, 0, Math.PI * 2); g.fill();
      // The far wing edge, ribs and swept cream wings are distinct from the tailplane.
      poly([[-165, 5], [-153, -10], [-30, -27], [26, -27], [156, -10], [168, 5], [30, 21], [-27, 21]], '#723a3a');
      const wing = g.createLinearGradient(0, -27, 0, 24);
      wing.addColorStop(0, '#fff0c6'); wing.addColorStop(.48, '#f5dfb2'); wing.addColorStop(.55, '#ddbb8c'); wing.addColorStop(1, '#edce9b');
      poly([[-165, 1], [-153, -15], [-29, -33], [27, -33], [157, -15], [168, 1], [28, 14], [-28, 14]], wing);
      for (const side of [-1, 1]) {
        poly([[side * 117, -20], [side * 138, -17], [side * 147, 3], [side * 125, 5]], '#bf493b', null);
        poly([[side * 148, -16], [side * 157, -15], [side * 168, 1], [side * 159, 2]], '#903e38', null);
        g.strokeStyle = '#9b75566b'; g.lineWidth = .8;
        for (let n = 1; n < 7; n++) {
          g.beginPath(); g.moveTo(side * (30 + n * 16), -28 + n * 2.1); g.lineTo(side * (35 + n * 16), 12 - n * 1.3); g.stroke();
        }
        g.strokeStyle = '#715848'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(side * 17, -9); g.lineTo(side * 103, -11); g.stroke();
        g.fillStyle = side < 0 ? '#ff5a43' : '#f7d77b'; g.shadowColor = g.fillStyle; g.shadowBlur = 12;
        g.beginPath(); g.arc(side * 163, -1, 2.1, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
      }
      poly([[-59, 70], [-52, 58], [-9, 46], [10, 46], [55, 58], [61, 70], [8, 76], [-8, 76]], '#eed6a7');
      poly([[-59, 70], [-52, 58], [-37, 54], [-38, 73]], '#c94b3b', null);
      poly([[59, 70], [52, 58], [37, 54], [38, 73]], '#c94b3b', null);
      const body = g.createLinearGradient(-22, 0, 25, 0);
      body.addColorStop(0, '#842f31'); body.addColorStop(.3, '#df6850'); body.addColorStop(.65, '#f48c60'); body.addColorStop(1, '#aa3d36');
      poly([[-12, 78], [-25, 0], [-18, -51], [-9, -64], [9, -64], [18, -51], [25, 0], [12, 78], [0, 88]], body, '#61383a', 1.5);
      poly([[-4, 79], [-7, -49], [0, -58], [7, -49], [4, 79]], '#ffe6b0', null);
      const glass = g.createLinearGradient(-15, -33, 16, 13);
      glass.addColorStop(0, '#a4c4be'); glass.addColorStop(.4, '#4d747a'); glass.addColorStop(1, '#253d50');
      g.fillStyle = glass; g.strokeStyle = '#e4bf8b'; g.lineWidth = 2;
      g.beginPath(); g.ellipse(0, -10, 14, 27, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.strokeStyle = '#d4e1c48a'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-8, -26); g.quadraticCurveTo(-11, -12, -6, -3); g.stroke();
      poly([[-3, 74], [-4, 39], [0, 18], [5, 40], [6, 75], [0, 89]], '#e47450');
      g.fillStyle = '#332e35'; g.beginPath(); g.ellipse(0, -59, 16, 7, 0, 0, Math.PI * 2); g.fill();
      g.save(); g.translate(0, -64); g.globalAlpha = .22;
      g.strokeStyle = '#fff0bb'; g.lineWidth = 5;
      g.beginPath(); g.ellipse(0, 0, 46, 10, 0, 0, Math.PI * 2); g.stroke();
      g.rotate(Math.sin(this.propeller) * .12);
      g.fillStyle = '#fff0c7'; g.fillRect(-46, -1.4, 92, 2.8); g.restore();
      g.fillStyle = '#eec898'; g.beginPath(); g.arc(0, -66, 4, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#6d4540'; g.font = 'bold 10px Arial'; g.textAlign = 'center';
      g.fillText('07', -79, 1); g.fillText('07', 79, 1);
      if (this.hull < 60 || crashed) {
        for (let i = 0; i < 8; i++) {
          g.fillStyle = `rgba(47,33,40,${.3 - i * .03})`;
          g.beginPath(); g.arc(17 + Math.sin(time * 4 + i) * 8, 35 + i * 13, 5 + i * 2, 0, Math.PI * 2); g.fill();
        }
      }
      g.restore();
    }
  }
  C.StuntPlane = StuntPlane;
})();
