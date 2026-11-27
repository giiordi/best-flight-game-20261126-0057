/* Oscillators, envelopes and a generated noise buffer; nothing is loaded from disk. */
'use strict';
(() => {
  class FlightAudio {
    constructor() { this.context = null; this.muted = false; }
    start() {
      if (this.context) { this.context.resume().catch(() => {}); return; }
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      try {
        const a = this.context = new Audio();
        this.master = a.createGain(); this.master.gain.value = .25; this.master.connect(a.destination);
        this.engineGain = a.createGain(); this.engineGain.gain.value = 0; this.engineGain.connect(this.master);
        const filter = a.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 420; filter.connect(this.engineGain);
        this.engine = a.createOscillator(); this.engine.type = 'sawtooth'; this.engine.frequency.value = 65; this.engine.connect(filter); this.engine.start();
        this.harmonic = a.createOscillator(); this.harmonic.type = 'triangle'; this.harmonic.frequency.value = 131; this.harmonic.connect(filter); this.harmonic.start();
        this.noise = a.createBuffer(1, a.sampleRate, a.sampleRate);
        const channel = this.noise.getChannelData(0);
        let v = 773;
        for (let i = 0; i < channel.length; i++) { v = (v * 16807) % 2147483647; channel[i] = v / 1073741824 - 1; }
        this.roar = a.createBufferSource(); this.roar.buffer = this.noise; this.roar.loop = true;
        this.roarGain = a.createGain(); this.roarGain.gain.value = 0;
        const roarFilter = a.createBiquadFilter(); roarFilter.type = 'lowpass'; roarFilter.frequency.value = 680;
        this.roar.connect(roarFilter); roarFilter.connect(this.roarGain); this.roarGain.connect(this.master); this.roar.start();
        a.resume().catch(() => {});
      } catch (_) { this.context = null; }
    }
    toggle() {
      this.muted = !this.muted;
      if (this.context) this.master.gain.setTargetAtTime(this.muted ? 0 : .25, this.context.currentTime, .1);
    }
    update(plane, flying) {
      const a = this.context; if (!a) return;
      this.engine.frequency.setTargetAtTime(37 + plane.speed * .32 + (plane.boosting ? 15 : 0), a.currentTime, .12);
      this.harmonic.frequency.setTargetAtTime(75 + plane.speed * .64, a.currentTime, .12);
      this.engineGain.gain.setTargetAtTime(flying ? .13 : .015, a.currentTime, .25);
      this.roarGain.gain.setTargetAtTime(flying && plane.boosting ? .13 : 0, a.currentTime, .12);
    }
    tone(frequency, duration, delay = 0, type = 'sine', volume = .2) {
      const a = this.context; if (!a) return;
      const t = a.currentTime + delay, o = a.createOscillator(), e = a.createGain();
      o.type = type; o.frequency.setValueAtTime(frequency, t);
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(volume, t + .009); e.gain.exponentialRampToValueAtTime(.001, t + duration);
      o.connect(e); e.connect(this.master); o.start(t); o.stop(t + duration + .02);
    }
    noiseBurst(duration, frequency, volume) {
      const a = this.context; if (!a || !this.noise) return;
      const n = a.createBufferSource(), f = a.createBiquadFilter(), e = a.createGain();
      n.buffer = this.noise; f.type = 'bandpass'; f.frequency.value = frequency;
      e.gain.setValueAtTime(volume, a.currentTime); e.gain.exponentialRampToValueAtTime(.001, a.currentTime + duration);
      n.connect(f); f.connect(e); e.connect(this.master); n.start(); n.stop(a.currentTime + duration);
    }
    effect(name) {
      if (!this.context || this.muted) return;
      if (name === 'arch') { this.tone(660, .18); this.tone(990, .24, .07); }
      if (name === 'near') this.noiseBurst(.45, 1600, .4);
      if (name === 'scrape') { this.noiseBurst(.3, 480, .6); this.tone(80, .25, 0, 'sawtooth', .18); }
      if (name === 'crash') { this.noiseBurst(.7, 110, .8); this.tone(48, .8, 0, 'triangle', .65); }
      if (name === 'click') this.tone(420, .08, 0, 'triangle', .15);
      if (name === 'finish') [440, 554, 660, 880].forEach((f, i) => this.tone(f, .4, i * .11));
    }
  }
  window.CR.FlightAudio = FlightAudio;
})();
