(function () {
  'use strict';
  // Missions, hiker ledges, pickup zones and per-mission grading.
  var MISSIONS = [
    { name: 'Mission 1 — First Call', brief: 'Calm air. One hiker on the east ledge. Full fuel.',
      wind: 0, gust: 0, fuel: 100, dusk: false, hikers: [980] },
    { name: 'Mission 2 — Gusting Ridge', brief: 'Steady crosswind plus gusts. Hold your hover.',
      wind: 55, gust: 90, fuel: 100, dusk: false, hikers: [1080] },
    { name: 'Mission 3 — Last Light', brief: 'Half fuel, stronger gusts, two hikers. Dusk is falling.',
      wind: 70, gust: 130, fuel: 50, dusk: true, hikers: [900, 1150] },
  ];

  function createMission(idx, groundHeight) {
    var cfg = MISSIONS[idx];
    return {
      index: idx, config: cfg,
      hikers: cfg.hikers.map(function (x) {
        return { x: x, y: groundHeight(x), state: 'waiting' };
      }),
      time: 0, picked: 0, steadySamples: 0, steadySum: 0,
    };
  }

  function allAboard(m) {
    return m.hikers.every(function (h) { return h.state === 'aboard'; });
  }

  // timeSec: mission time. steadiness 0..1 (1 = rock steady while hooking).
  // fuelFrac 0..1, softness 0..1 (1 = feather landing). Max 1600.
  function grade(timeSec, steadiness, fuelFrac, softness) {
    var timeScore = Math.max(0, 400 - Math.max(0, timeSec - 45) * 8);
    var score = Math.round(400 + timeScore + steadiness * 300 + fuelFrac * 300 + softness * 200);
    var grade = score >= 1450 ? 'S' : score >= 1150 ? 'A' : score >= 850 ? 'B' : 'C';
    return { grade: grade, score: score };
  }

  function draw(ctx, mission, time) {
    mission.hikers.forEach(function (h) {
      // rock ledge the hiker stands on
      ctx.fillStyle = '#6b6f66';
      ctx.beginPath(); ctx.ellipse(h.x, h.y + 4, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a8f85';
      ctx.beginPath(); ctx.ellipse(h.x, h.y + 1, 20, 5, 0, 0, Math.PI * 2); ctx.fill();
      if (h.state !== 'waiting') return;
      // hiker figure, waving one arm
      var wave = Math.sin(time * 5) * 0.35;
      ctx.strokeStyle = '#1d3557'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(h.x, h.y - 16); ctx.lineTo(h.x, h.y - 2); ctx.stroke();
      ctx.fillStyle = '#e63946';
      ctx.beginPath(); ctx.arc(h.x, h.y - 20, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1d3557';
      ctx.beginPath(); ctx.moveTo(h.x, h.y - 14); ctx.lineTo(h.x - 8, h.y - 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(h.x, h.y - 14); ctx.lineTo(h.x + 8, h.y - 22 + wave * 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(h.x, h.y - 2); ctx.lineTo(h.x - 5, h.y + 8); ctx.moveTo(h.x, h.y - 2); ctx.lineTo(h.x + 5, h.y + 8); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px ui-monospace, monospace'; ctx.textAlign = 'center';
      ctx.fillText('!', h.x, h.y - 30);
      // faint pickup-zone ring above the hiker
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.arc(h.x, h.y - 60, 34, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  window.AlpineRescue = { MISSIONS: MISSIONS, createMission: createMission, allAboard: allAboard, grade: grade, draw: draw };
})();
