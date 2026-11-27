(function () {
  'use strict';
  // Tiny WebAudio synth — every sound generated in code, no audio files.
  // Nothing starts until the first user gesture calls ensure().
  var ctx = null, master = null, rotorNodes = null, winchNodes = null, lastBeep = 0;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.4;
      master.connect(ctx.destination);
      return true;
    } catch (e) { return false; }
  }
  function tone(freq, dur, type, vol, when) {
    if (!ctx) return;
    var t0 = ctx.currentTime + (when || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  // Rotor whomp-whomp; rate follows collective (0..1). Call every frame.
  function rotor(collective, flying) {
    if (!ctx) return;
    if (!flying || collective <= 0) { stopRotor(); return; }
    if (!rotorNodes) {
      var o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 46 + collective * 14;
      lfo.frequency.value = 7 + collective * 6; lg.gain.value = 0.05;
      lfo.connect(lg); lg.connect(g.gain);
      g.gain.value = 0.09;
      o.connect(g); g.connect(master);
      o.start(); lfo.start();
      rotorNodes = { o: o, g: g, lfo: lfo };
    }
    rotorNodes.o.frequency.value = 46 + collective * 14;
    rotorNodes.lfo.frequency.value = 7 + collective * 6;
  }
  function stopRotor() {
    if (!rotorNodes) return;
    try { rotorNodes.o.stop(); rotorNodes.lfo.stop(); } catch (e) {}
    rotorNodes = null;
  }
  function winch(on) {
    if (!ctx) return;
    if (!on) {
      if (winchNodes) { try { winchNodes.o.stop(); winchNodes.lfo.stop(); } catch (e) {} winchNodes = null; }
      return;
    }
    if (winchNodes) return;
    var o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 880;
    lfo.frequency.value = 28; lg.gain.value = 22;
    lfo.connect(lg); lg.connect(o.frequency);
    g.gain.value = 0.045;
    o.connect(g); g.connect(master);
    o.start(); lfo.start();
    winchNodes = { o: o, lfo: lfo };
  }
  function chime() { tone(880, 0.16, 'sine', 0.22); tone(1318, 0.22, 'sine', 0.2, 0.1); }
  function beep() {
    if (!ctx) return;
    var now = ctx.currentTime;
    if (now - lastBeep < 0.9) return;
    lastBeep = now;
    tone(1250, 0.07, 'square', 0.12);
  }
  function thud() { tone(65, 0.3, 'sine', 0.5); tone(42, 0.22, 'triangle', 0.35, 0.02); }
  function click() { tone(1800, 0.035, 'square', 0.08); }
  window.AlpineAudio = { ensure: ensure, rotor: rotor, stopRotor: stopRotor, winch: winch, chime: chime, beep: beep, thud: thud, click: click };
})();
