(function () {
  'use strict';
  // Cockpit HUD drawn in canvas: altimeter, airspeed, vertical speed, compass,
  // fuel gauge, wind indicator, winch status, mission clock, survivors.
  function panel(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(8, 26, 32, .62)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  function label(ctx, text, x, y, color, size) {
    ctx.fillStyle = color || '#cfe8e2';
    ctx.font = 'bold ' + (size || 11) + 'px ui-monospace, monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, x, y);
  }
  function value(ctx, text, x, y, color, size) {
    ctx.fillStyle = color || '#fff';
    ctx.font = 'bold ' + (size || 26) + 'px ui-monospace, monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, x, y);
  }
  function fmtClock(sec) {
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function draw(ctx, s) {
    // top bar
    panel(ctx, 0, 0, 1280, 54);
    label(ctx, s.missionName, 14, 22, '#ffd9a8', 13);
    label(ctx, 'TIME ' + fmtClock(s.clock), 14, 42, '#cfe8e2', 12);
    label(ctx, 'RESCUED ' + s.rescued + '/' + s.total, 1140, 22, '#fff', 12);
    label(ctx, 'BEST ' + (s.best || 0), 1140, 42, '#cfe8e2', 12);
    if (s.message) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(s.message, 640, 33);
    }
    // fuel gauge (top right, below the bar)
    var fw = 150, fx = 1280 - fw - 14, fy = 62;
    panel(ctx, fx - 8, fy - 8, fw + 16, 34);
    label(ctx, 'FUEL', fx, fy + 4, '#cfe8e2', 11);
    ctx.fillStyle = '#22383f'; ctx.fillRect(fx + 44, fy - 2, fw - 44, 12);
    ctx.fillStyle = s.fuelLow ? '#e63946' : (s.fuel < 30 ? '#f5a623' : '#7fd08a');
    ctx.fillRect(fx + 44, fy - 2, Math.max(0, (fw - 44) * s.fuel / 100), 12);
    label(ctx, Math.round(s.fuel) + '%', fx + 44, fy + 26, '#fff', 11);
    // wind indicator (below fuel)
    panel(ctx, fx - 8, fy + 32, fw + 16, 34);
    label(ctx, 'WIND', fx, fy + 48, '#cfe8e2', 11);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillText((s.windKt >= 0 ? '→' : '←') + ' ' + Math.abs(Math.round(s.windKt)) + ' KT ' + (s.windKt >= 0 ? 'E' : 'W'), fx + 44, fy + 52);
    // altimeter (bottom left)
    panel(ctx, 12, 720 - 96, 210, 84);
    label(ctx, 'ALTITUDE', 24, 720 - 74, '#cfe8e2', 11);
    value(ctx, String(Math.round(s.altFt)) + ' FT', 24, 720 - 44, '#fff', 26);
    label(ctx, 'VSI ' + (s.vsi >= 0 ? '+' : '') + Math.round(s.vsi) + ' FT/MIN', 24, 720 - 24, s.vsi > 600 ? '#e63946' : '#cfe8e2', 12);
    // airspeed + heading (bottom right)
    panel(ctx, 1280 - 222, 720 - 96, 210, 84);
    label(ctx, 'AIRSPEED', 1280 - 210, 720 - 74, '#cfe8e2', 11);
    value(ctx, String(Math.round(s.speedKt)) + ' KT', 1280 - 210, 720 - 44, '#fff', 26);
    label(ctx, 'HDG ' + String(Math.round(s.heading)).padStart(3, '0') + '°', 1280 - 210, 720 - 24, '#cfe8e2', 12);
    // winch status (bottom center)
    panel(ctx, 640 - 110, 720 - 52, 220, 40);
    label(ctx, 'WINCH', 640 - 96, 720 - 32, '#cfe8e2', 11);
    var wcol = s.winchState === 'LOCKED' ? '#7fd08a' : (s.winch > 0.05 ? '#f5c542' : '#cfe8e2');
    value(ctx, s.winchState + ' ' + Math.round(s.winch * 100) + '%', 640 - 96, 720 - 14, wcol, 14);
    ctx.textAlign = 'left';
  }
  window.AlpineInstruments = { draw: draw };
})();
