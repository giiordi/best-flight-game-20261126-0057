export class FlightAudio {
  constructor() { this.context = null; this.engine = null; this.gain = null; }
  start() {
    if (this.context) { this.context.resume(); return; }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context = new AudioContext();
    this.engine = this.context.createOscillator(); this.engine.type = 'sawtooth'; this.engine.frequency.value = 72;
    this.gain = this.context.createGain(); this.gain.gain.value = 0.018;
    const filter = this.context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 280;
    this.engine.connect(filter).connect(this.gain).connect(this.context.destination); this.engine.start();
  }
  update(speed, throttle) {
    if (!this.context) return;
    this.engine.frequency.setTargetAtTime(58 + speed * 0.58 + throttle * 15, this.context.currentTime, 0.12);
    this.gain.gain.setTargetAtTime(0.008 + speed * 0.00012, this.context.currentTime, 0.18);
  }
  chime() {
    if (!this.context) return;
    const now = this.context.currentTime;
    [660, 990, 1320].forEach((hz, i) => {
      const osc = this.context.createOscillator(), gain = this.context.createGain();
      osc.type = 'sine'; osc.frequency.value = hz; gain.gain.setValueAtTime(0.0001, now + i * 0.07); gain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.07 + 0.025); gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.42);
      osc.connect(gain).connect(this.context.destination); osc.start(now + i * 0.07); osc.stop(now + i * 0.07 + 0.45);
    });
  }
  crash() {
    if (!this.context) return;
    const now = this.context.currentTime, osc = this.context.createOscillator(), gain = this.context.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(130, now); osc.frequency.exponentialRampToValueAtTime(36, now + 0.5); gain.gain.setValueAtTime(0.24, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55); osc.connect(gain).connect(this.context.destination); osc.start(now); osc.stop(now + 0.6);
  }
}
