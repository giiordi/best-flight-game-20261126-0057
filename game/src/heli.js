(function () {
  'use strict';
  // Flight model and drawing for the orange rescue helicopter.
  // Canvas coords: x right, y down. Collective lifts, cyclic slides, wind shoves.
  var GRAV = 240;      // px/s^2 pulling down
  var THRUST = 560;    // px/s^2 upward while collective is held
  var DESCEND = 300;   // extra px/s^2 while collective is pushed down
  var CYCLIC = 380;    // px/s^2 sideways
  var MAXVX = 300, MAXVY = 260;

  function create(x, y, fuel) {
    return { x: x, y: y, vx: 0, vy: 0, fuel: fuel, tilt: 0, rotor: 0,
      winch: 0, winchHook: false, aboard: 0 };
  }

  // input: {up, down, left, right} booleans. windAcc: px/s^2 sideways (wind + gusts).
  // Returns 1 while climbing on collective, -1 while pushing down, 0 otherwise.
  function update(h, dt, input, windAcc) {
    var ay = GRAV, collective = 0;
    if (input.up) { ay -= THRUST; collective = 1; }
    if (input.down) { ay += DESCEND; collective = -1; }
    var ax = windAcc;
    if (input.left) ax -= CYCLIC;
    if (input.right) ax += CYCLIC;
    h.vx += ax * dt;
    h.vy += ay * dt;
    h.vx *= Math.max(0, 1 - 0.55 * dt);   // drag steadies the hover
    h.vy *= Math.max(0, 1 - 0.35 * dt);
    h.vx = Math.max(-MAXVX, Math.min(MAXVX, h.vx));
    h.vy = Math.max(-MAXVY, Math.min(MAXVY, h.vy));
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    h.x = Math.max(30, Math.min(1250, h.x));
    h.y = Math.max(48, Math.min(700, h.y));
    h.tilt = Math.max(-0.32, Math.min(0.32, h.vx * 0.0011));
    h.rotor += dt * (6 + 14 * Math.max(0, collective) + Math.abs(h.vx) * 0.01);
    var burn = (collective === 1 ? 1.15 : 0.32) + (h.winch > 0 && h.winch < 1 ? 0.25 : 0);
    h.fuel = Math.max(0, h.fuel - burn * dt);
    return collective;
  }

  function draw(ctx, h, time) {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.tilt);
    // skids
    ctx.strokeStyle = '#33302c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-26, 14); ctx.lineTo(26, 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-18, 14); ctx.lineTo(-14, 6); ctx.moveTo(18, 14); ctx.lineTo(14, 6); ctx.stroke();
    // tail boom and fin
    ctx.fillStyle = '#e86a2c';
    ctx.beginPath(); ctx.moveTo(-16, -2); ctx.lineTo(-52, -8); ctx.lineTo(-52, -2); ctx.lineTo(-16, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f08a51';
    ctx.beginPath(); ctx.moveTo(-52, -8); ctx.lineTo(-58, -22); ctx.lineTo(-50, -20); ctx.lineTo(-46, -8); ctx.closePath(); ctx.fill();
    // tail rotor (spinning cross)
    var tr = time * 22;
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-54, -14 + Math.sin(tr) * 7); ctx.lineTo(-54, -14 - Math.sin(tr) * 7); ctx.stroke();
    // body
    ctx.fillStyle = '#f47a35';
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd9a8';
    ctx.beginPath(); ctx.ellipse(2, -1, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
    // cockpit glass
    ctx.fillStyle = '#bfe9f2';
    ctx.beginPath(); ctx.ellipse(16, -3, 9, 6, -0.15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7cc4d4';
    ctx.beginPath(); ctx.ellipse(16, -3, 9, 6, -0.15, 0, Math.PI); ctx.fill();
    // white rescue cross on the flank
    ctx.fillStyle = '#fff';
    ctx.fillRect(-6, -7, 4, 10); ctx.fillRect(-9, -4, 10, 4);
    // mast and main rotor (blurred second blade for spin)
    ctx.fillStyle = '#33302c'; ctx.fillRect(-2, -16, 4, 6);
    ctx.strokeStyle = 'rgba(40,40,40,.85)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-52, -16); ctx.lineTo(52, -16); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,40,40,.25)'; ctx.lineWidth = 7;
    var bx = Math.cos(h.rotor) * 52;
    ctx.beginPath(); ctx.moveTo(-bx, -16); ctx.lineTo(bx, -16); ctx.stroke();
    ctx.restore();
    // winch cable hangs straight down (gravity, not the tilt)
    if (h.winch > 0.02) {
      var len = h.winch * 110;
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(h.x, h.y + 12); ctx.lineTo(h.x, h.y + 12 + len); ctx.stroke();
      ctx.fillStyle = '#f5c542';
      ctx.beginPath(); ctx.arc(h.x, h.y + 12 + len, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a6d00'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(h.x, h.y + 12 + len + 5, 5, 0, Math.PI); ctx.stroke();
    }
  }

  window.AlpineHeli = { create: create, update: update, draw: draw };
})();
