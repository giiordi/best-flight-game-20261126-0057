/* State flow, gesture-bound sound, fixed-step flight and deterministic screenshot views. */
'use strict';
(() => {
  const C = window.CR;
  class CanyonRushGame {
    constructor(canvas) {
      this.canvas = canvas; this.g = canvas.getContext('2d', { alpha: false });
      const params = new URLSearchParams(location.search);
      const requestedSeed = Number(params.get('seed') || 7);
      this.seed = Number.isFinite(requestedSeed) ? Math.abs(requestedSeed) % 100000 : 7;
      this.shot = ['start', 'play', 'end'].includes(params.get('shot')) ? params.get('shot') : null;
      this.canyon = new C.CanyonLandscape(this.seed);
      this.plane = new C.StuntPlane(this.canyon);
      this.race = new C.CanyonRace(this.canyon);
      this.hud = new C.FlightInstruments(); this.audio = new C.FlightAudio();
      this.keys = new Set(); this.pointer = null; this.mouseX = 0; this.mouseY = 0;
      this.state = 'title'; this.paused = false; this.time = 18; this.best = 0; this.failure = '';
      try { const v = Number(localStorage.getItem('canyon-rush-best')); if (Number.isFinite(v)) this.best = C.clamp(v, 0, 99999999); } catch (_) { /* Storage is optional. */ }
      this.setupInput(); this.applyScreenshotHook();
      this.last = null; this.accumulator = 0;
      requestAnimationFrame(t => this.frame(t));
    }
    setupInput() {
      const controlled = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight', 'Enter', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyP', 'KeyR', 'KeyM'];
      window.addEventListener('keydown', event => {
        if (controlled.includes(event.code)) event.preventDefault();
        this.audio.start();
        if (!event.repeat) {
          if (event.code === 'Enter' || event.code === 'Space') this.activate();
          if (event.code === 'KeyP') this.togglePause();
          if (event.code === 'KeyR') this.restart();
          if (event.code === 'KeyM') this.audio.toggle();
        }
        this.keys.add(event.code);
      });
      window.addEventListener('keyup', event => this.keys.delete(event.code));
      this.canvas.addEventListener('pointerdown', event => {
        event.preventDefault(); this.canvas.focus(); this.audio.start();
        if (this.state !== 'flying' || this.paused) { this.activate(); return; }
        if (this.shot) this.releaseScreenshotHook();
        this.pointer = { x: event.clientX, y: event.clientY };
        this.canvas.setPointerCapture(event.pointerId);
      });
      this.canvas.addEventListener('pointermove', event => {
        if (!this.pointer) return;
        const scale = 1280 / this.canvas.getBoundingClientRect().width;
        this.mouseX = C.clamp((event.clientX - this.pointer.x) * scale / 120, -1, 1);
        this.mouseY = C.clamp((event.clientY - this.pointer.y) * scale / 100, -1, 1);
      });
      const release = () => { this.pointer = null; this.mouseX = 0; this.mouseY = 0; };
      window.addEventListener('pointerup', release);
      this.canvas.addEventListener('pointercancel', release);
      window.addEventListener('blur', () => {
        this.keys.clear(); release(); if (this.state === 'flying' && !this.shot) this.paused = true;
      });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.state === 'flying' && !this.shot) { this.paused = true; this.keys.clear(); }
      });
    }
    setState(value) {
      this.state = value;
      document.getElementById('flight-status').textContent = `${value}. Course ${this.race.courseIndex + 1}: ${this.race.config.name}.`;
    }
    restart() {
      this.shot = null; this.race = new C.CanyonRace(this.canyon);
      this.plane.reset(); this.keys.clear(); this.pointer = null; this.mouseX = this.mouseY = 0;
      this.paused = false; this.accumulator = 0;
      this.setState('flying'); this.audio.effect('click');
    }
    activate() {
      this.audio.effect('click');
      if (this.shot && this.shot === 'play') { this.releaseScreenshotHook(); return; }
      if (this.state === 'title' || this.state === 'crashed' || this.state === 'debrief') { this.restart(); return; }
      if (this.paused) { this.paused = false; this.keys.clear(); return; }
      if (this.state === 'finished') {
        if (this.race.courseIndex === 2) this.finishRun();
        else {
          this.race.startCourse(this.race.courseIndex + 1); this.plane.reset();
          this.plane.speed = this.race.config.speed; this.keys.clear(); this.setState('flying');
        }
      }
    }
    togglePause() {
      if (this.state !== 'flying') return;
      if (this.shot) this.releaseScreenshotHook();
      this.paused = !this.paused; this.keys.clear();
    }
    releaseScreenshotHook() { this.shot = null; this.last = null; this.accumulator = 0; this.plane.boosting = false; }
    finishRun() {
      this.setState('debrief');
      if (!this.shot && this.race.totalScore > this.best) {
        this.best = this.race.totalScore;
        try { localStorage.setItem('canyon-rush-best', String(this.best)); } catch (_) { /* No dependency on persistence. */ }
      }
    }
    applyScreenshotHook() {
      if (this.shot === 'play') {
        this.race.startCourse(1);
        const r = this.race, p = this.plane;
        r.nextArch = 5; r.hits = 5; r.nearMisses = 2; r.gatePoints = 3450; r.elapsed = 18.4;
        r.arches.forEach((arch, i) => { arch.resolved = i < r.nextArch; });
        const gate = r.arches[r.nextArch];
        p.z = gate.z - 210; p.previousZ = p.z; p.x = gate.x - 38; p.y = gate.y + 12;
        p.bank = -.22; p.vx = -25; p.vy = 12; p.speed = 259; p.boost = 64; p.hull = 100; p.boosting = true; p.wind = -11;
        r.notify('ON THE EDGE  /  NEAR MISS +350', '#ffe0a0', 8);
        this.setState('flying');
      }
      if (this.shot === 'end') {
        // Explicit screenshot fixture only; ordinary racing earns every row through race.update.
        this.race.results = [
          { name: 'Dusk Run', grade: 'S', score: 12380, time: 30.2, hits: 10, count: 10, near: 3, hull: 100 },
          { name: 'Needle Gap', grade: 'A', score: 13240, time: 34.6, hits: 11, count: 12, near: 4, hull: 90 },
          { name: 'Golden Hour', grade: 'S', score: 15160, time: 37.1, hits: 14, count: 14, near: 5, hull: 100 }
        ];
        this.race.courseIndex = 2; this.setState('debrief');
      }
    }
    input() {
      const k = this.keys;
      return {
        left: +(k.has('KeyA') || k.has('ArrowLeft')), right: +(k.has('KeyD') || k.has('ArrowRight')),
        up: +(k.has('KeyW') || k.has('ArrowUp')), down: +(k.has('KeyS') || k.has('ArrowDown')),
        boost: k.has('ShiftLeft') || k.has('ShiftRight'), mouseX: this.mouseX, mouseY: this.mouseY
      };
    }
    update(dt) {
      if (this.shot || this.paused || this.state !== 'flying') return;
      this.time += dt;
      this.plane.update(dt, this.input(), this.race, this.audio);
      this.race.update(dt, this.plane, this.audio);
      if (this.plane.hull <= 0 || this.race.remaining <= 0) {
        this.failure = this.plane.hull <= 0 ? 'Aircraft lost.' : 'The light ran out.';
        this.setState('crashed'); this.audio.effect('crash');
      } else if (this.race.complete) {
        if (this.race.courseIndex === 2) this.finishRun(); else this.setState('finished');
      }
    }
    drawSpeedLines(g) {
      if (!this.plane.boosting || this.state !== 'flying') return;
      g.save();
      for (let i = 0; i < 28; i++) {
        const a = C.hash(i + 150, this.seed) * Math.PI * 2;
        const phase = (this.time * 1.4 + C.hash(i, this.seed)) % 1;
        const r = 330 + phase * 500, length = 22 + phase * 65;
        const x = Math.cos(a), y = Math.sin(a) * .67;
        g.strokeStyle = `rgba(255,219,161,${.03 + phase * .19})`; g.lineWidth = 1 + phase;
        g.beginPath(); g.moveTo(640 + x * r, 355 + y * r); g.lineTo(640 + x * (r + length), 355 + y * (r + length)); g.stroke();
      }
      g.restore();
    }
    render() {
      const g = this.g, p = this.plane;
      g.save();
      if (this.state === 'flying' && !this.paused) {
        const shake = p.shake * 6 + (p.boosting ? 1.1 : 0);
        g.translate(Math.sin(this.time * 47) * shake, Math.cos(this.time * 59) * shake * .65);
      }
      this.canyon.draw(g, p, this.race, this.time); this.drawSpeedLines(g);
      if (this.state === 'title') {
        g.save(); g.translate(233, -30); g.scale(1.05, 1.05); p.draw(g, this.time); g.restore();
      } else p.draw(g, this.time, this.state === 'crashed');
      g.restore();
      if (this.state === 'title') this.hud.title(g, this);
      else if (this.state === 'debrief') this.hud.debrief(g, this);
      else {
        this.hud.draw(g, this);
        if (this.paused) this.hud.transition(g, this, 'paused');
        else if (this.state === 'finished' || this.state === 'crashed') this.hud.transition(g, this, this.state);
      }
      if (this.audio.muted && this.state === 'flying') {
        g.fillStyle = '#ffdeb0'; g.font = '10px monospace'; g.textAlign = 'left'; g.fillText('SOUND MUTED · M', 39, 581);
      }
    }
    frame(timestamp) {
      const elapsed = this.last === null ? 0 : Math.min(.1, (timestamp - this.last) / 1000);
      this.last = timestamp;
      if (!this.shot && !this.paused && this.state === 'flying') {
        this.accumulator += elapsed;
        while (this.accumulator >= 1 / 120) { this.update(1 / 120); this.accumulator -= 1 / 120; }
      } else this.accumulator = 0;
      if (!this.shot && !this.paused && this.state === 'title') { this.time += elapsed * .35; this.plane.propeller += elapsed * 17; }
      this.audio.update(this.plane, this.state === 'flying' && !this.paused && !this.shot);
      this.render(); requestAnimationFrame(t => this.frame(t));
    }
  }
  C.CanyonRushGame = CanyonRushGame;
  C.game = new CanyonRushGame(document.getElementById('flight'));
})();
