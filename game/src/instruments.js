/* Amber-lit flight instruments and restrained race overlays, all native canvas. */
'use strict';
(() => {
  const C = window.CR;
  const cream = '#ffebbf', muted = '#c9a986', amber = '#ffc876', ink = '#261f2a';
  function text(g, value, x, y, size = 14, color = cream, align = 'left', weight = '') {
    g.fillStyle = color; g.font = `${weight} ${size}px ${size < 17 ? 'monospace' : 'Arial, sans-serif'}`;
    g.textAlign = align; g.fillText(value, x, y);
  }
  function line(g, x1, y1, x2, y2, color = '#ebc29155', width = 1) {
    g.strokeStyle = color; g.lineWidth = width; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  }
  function panel(g, x, y, w, h, opacity = .82) {
    g.fillStyle = `rgba(31,25,35,${opacity})`; g.fillRect(x, y, w, h);
    g.strokeStyle = '#f2c89140'; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, w - 1, h - 1);
  }
  function button(g, label, x, y, w = 270, h = 52) {
    g.fillStyle = '#ffdfa5'; g.fillRect(x, y, w, h);
    text(g, label, x + 23, y + h / 2 + 6, 17, '#3b2930', 'left', 'bold');
    text(g, '↗', x + w - 23, y + h / 2 + 7, 24, '#6d4138', 'right');
  }
  class FlightInstruments {
    compass(g, heading) {
      g.save(); g.beginPath(); g.rect(451, 22, 378, 65); g.clip();
      const grad = g.createLinearGradient(451, 0, 829, 0);
      grad.addColorStop(0, '#271d2900'); grad.addColorStop(.2, '#271d2980'); grad.addColorStop(.8, '#271d2980'); grad.addColorStop(1, '#271d2900');
      g.fillStyle = grad; g.fillRect(451, 22, 378, 65);
      const base = Math.floor(heading / 10) * 10;
      for (let i = -7; i <= 7; i++) {
        const deg = base + i * 10, x = 640 + (deg - heading) * 4.2;
        line(g, x, 35, x, deg % 30 ? 42 : 47, '#ffe2b699');
        if (deg % 30 === 0) text(g, ({ 0: 'N', 90: 'E', 180: 'S', 270: 'W' })[(deg + 360) % 360] || String((deg + 360) % 360).padStart(3, '0'), x, 62, 11, cream, 'center');
      }
      g.restore();
      C.poly(g, [{ x: 635, y: 28 }, { x: 645, y: 28 }, { x: 640, y: 34 }], amber);
      panel(g, 613, 67, 54, 24, .85);
      text(g, `${String(Math.round(heading)).padStart(3, '0')}°`, 640, 84, 13, cream, 'center');
    }
    gauge(g, x, y, radius, label, value, max, unit) {
      g.save(); g.translate(x, y);
      const bezel = g.createRadialGradient(0, 0, radius - 9, 0, 0, radius + 1);
      bezel.addColorStop(0, '#171b23'); bezel.addColorStop(.68, '#3b3540'); bezel.addColorStop(.83, '#9a8070'); bezel.addColorStop(1, '#24242e');
      g.fillStyle = bezel; g.beginPath(); g.arc(0, 0, radius, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#20202a'; g.beginPath(); g.arc(0, 0, radius - 6, 0, Math.PI * 2); g.fill();
      for (let i = 0; i <= 20; i++) {
        const angle = Math.PI * (.75 + i / 20 * 1.5);
        const a = radius - 10, b = radius - (i % 5 ? 14 : 18);
        line(g, Math.cos(angle) * a, Math.sin(angle) * a, Math.cos(angle) * b, Math.sin(angle) * b, i % 5 ? '#e3bc8566' : '#f5d69d', i % 5 ? .7 : 1.2);
      }
      const angle = Math.PI * (.75 + C.clamp(value / max, 0, 1) * 1.5);
      g.shadowColor = '#ffbd6a'; g.shadowBlur = 5;
      line(g, 0, 0, Math.cos(angle) * (radius - 18), Math.sin(angle) * (radius - 18), amber, 2);
      g.shadowBlur = 0; g.fillStyle = '#dab480'; g.beginPath(); g.arc(0, 0, 3, 0, Math.PI * 2); g.fill();
      text(g, label, 0, -9, 9, muted, 'center');
      g.fillStyle = '#141820'; g.fillRect(-23, 11, 46, 19);
      text(g, String(Math.round(value)), 0, 25, 15, cream, 'center');
      text(g, unit, 0, radius - 9, 8, muted, 'center');
      g.restore();
    }
    draw(g, game) {
      const { plane: p, race: r } = game;
      const heading = (284 + p.vx * .1 + Math.sin(p.z / 1400) * 12 + 360) % 360;
      const altitude = Math.round(p.y * 3.28 + 680);
      // Top corners use large numerals so speed, altitude and heading survive a contact sheet.
      const top = g.createLinearGradient(0, 0, 0, 135);
      top.addColorStop(0, '#201925c9'); top.addColorStop(1, '#20192500');
      g.fillStyle = top; g.fillRect(0, 0, 1280, 135);
      text(g, 'CANYON / RUSH', 34, 47, 20, cream, 'left', 'bold');
      text(g, 'SUNSET AIR RACING', 35, 68, 10, muted);
      line(g, 230, 27, 230, 73);
      text(g, `0${r.courseIndex + 1} / 03`, 250, 43, 11, amber);
      text(g, r.config.name.toUpperCase(), 250, 68, 18, cream, 'left', 'bold');
      this.compass(g, heading);
      text(g, 'COURSE TIME', 1245, 30, 10, muted, 'right');
      const seconds = Math.ceil(r.remaining), timer = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
      text(g, timer, 1247, 72, 43, r.remaining < 12 ? '#ff9977' : cream, 'right', 'bold');
      text(g, `ARCHES  ${String(r.nextArch).padStart(2, '0')} / ${r.config.arches}`, 1036, 58, 13, cream, 'right');
      const progress = r.nextArch / r.config.arches;
      line(g, 34, 95, 1246, 95, '#ffe2b321'); line(g, 34, 95, 34 + progress * 1212, 95, amber, 2);
      text(g, 'AIRSPEED', 38, 237, 11, muted);
      text(g, String(Math.round(p.speed)), 34, 283, 51, cream, 'left', 'bold');
      text(g, 'KNOTS', 39, 305, 11, amber);
      for (let i = 0; i < 7; i++) line(g, 38, 327 + i * 9, 38 + (i % 3 ? 13 : 23), 327 + i * 9, '#f5d5a465');
      text(g, 'ALTITUDE', 1241, 237, 11, muted, 'right');
      text(g, altitude.toLocaleString('en-US'), 1246, 283, 48, cream, 'right', 'bold');
      text(g, 'FEET MSL', 1241, 305, 11, amber, 'right');
      text(g, `V/S ${p.vy >= 0 ? '+' : '−'}${Math.round(Math.abs(p.vy * 19.68))}`, 1242, 331, 12, cream, 'right');
      this.wind(g, p.wind, 1176, 166);
      // A subtle pitch ladder and fixed flight-path marker.
      g.save(); g.translate(640, 401 + p.pitch * 22); g.rotate(p.bank * .15);
      for (let i = -2; i <= 2; i++) {
        if (!i) continue;
        const y = i * 25;
        line(g, -51, y, -21, y, '#fff0be50'); line(g, 21, y, 51, y, '#fff0be50');
        text(g, String(Math.abs(i) * 5), 61, y + 4, 9, '#fff0be70');
      }
      g.strokeStyle = '#ffe3a8aa'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, 6, 0, Math.PI * 2); g.stroke();
      line(g, -21, 0, -7, 0, '#ffe3a8aa'); line(g, 7, 0, 21, 0, '#ffe3a8aa'); line(g, 0, -14, 0, -7, '#ffe3a8aa');
      g.restore();
      text(g, 'RACE SCORE', 38, 493, 10, muted);
      text(g, (r.totalScore + r.gatePoints).toLocaleString('en-US'), 36, 526, 30, cream, 'left', 'bold');
      text(g, `NEAR MISSES  ${String(r.nearMisses).padStart(2, '0')}`, 38, 551, 11, amber);
      if (p.boosting) {
        panel(g, 546, 122, 188, 30, .7);
        text(g, '»  BOOST ENGAGED  »', 640, 142, 12, '#ffe4a1', 'center');
      }
      if (r.messageTime > 0) {
        g.save(); g.globalAlpha = Math.min(1, r.messageTime * 2);
        panel(g, 399, 556, 482, 31, .65);
        text(g, r.message, 640, 577, 12, r.messageColor, 'center'); g.restore();
      }
      if (p.damageCooldown > .85) {
        g.strokeStyle = '#ec705477'; g.lineWidth = 9; g.strokeRect(5, 5, 1270, 710);
      }
      this.dashboard(g, p, r, altitude);
    }
    wind(g, wind, x, y) {
      text(g, 'CROSSWIND', x + 65, y - 25, 10, muted, 'right');
      const direction = wind < 0 ? -1 : 1;
      line(g, x - 25, y, x + 20, y, '#ffda9a', 1.5);
      C.poly(g, [{ x: x + direction * 30, y }, { x: x + direction * 19, y: y - 5 }, { x: x + direction * 19, y: y + 5 }], amber);
      text(g, `${Math.abs(wind).toFixed(0)} KT ${wind < 0 ? '←' : '→'}`, x + 65, y + 22, 13, cream, 'right');
    }
    dashboard(g, p, r, altitude) {
      const bg = g.createLinearGradient(0, 605, 0, 720);
      bg.addColorStop(0, '#393039'); bg.addColorStop(.07, '#26232c'); bg.addColorStop(1, '#171b23');
      C.poly(g, [{ x: 0, y: 625 }, { x: 320, y: 625 }, { x: 360, y: 607 }, { x: 920, y: 607 }, { x: 960, y: 625 }, { x: 1280, y: 625 }, { x: 1280, y: 720 }, { x: 0, y: 720 }], bg, '#c19b704d');
      for (const x of [19, 306, 970, 1261]) {
        g.fillStyle = '#9f8872'; g.beginPath(); g.arc(x, 640, 2.2, 0, Math.PI * 2); g.fill();
        line(g, x - 1, 639, x + 1, 641, '#3e3640');
      }
      this.gauge(g, 447, 663, 48, 'AIRSPEED', p.speed, 300, 'KNOTS');
      this.gauge(g, 562, 663, 48, 'ALTITUDE', altitude, 2500, 'FT MSL');
      this.gauge(g, 678, 663, 48, 'VARIO', 1500 + p.vy * 10, 3000, 'VERTICAL SPEED');
      // Artificial horizon is banked against an upright instrument bezel.
      g.save(); g.translate(792, 663);
      g.fillStyle = '#997c65'; g.beginPath(); g.arc(0, 0, 47, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(0, 0, 42, 0, Math.PI * 2); g.clip(); g.rotate(-p.bank);
      g.fillStyle = '#5b7480'; g.fillRect(-65, -65, 130, 65 + p.pitch * 13);
      g.fillStyle = '#aa744f'; g.fillRect(-65, p.pitch * 13, 130, 80);
      line(g, -65, p.pitch * 13, 65, p.pitch * 13, '#edce95', 2);
      for (let i = -2; i <= 2; i++) line(g, -15, i * 12 + p.pitch * 13, 15, i * 12 + p.pitch * 13, '#f0d9ac60');
      g.restore(); line(g, 769, 663, 785, 663, '#ffe7b4', 2); line(g, 799, 663, 815, 663, '#ffe7b4', 2);
      text(g, 'ATTITUDE', 792, 695, 8, cream, 'center');
      this.meter(g, 'BOOST', p.boost, 42, 653, 228, amber);
      this.meter(g, 'HULL', p.hull, 42, 691, 228, p.hull <= 35 ? '#f38168' : '#b3c4ad');
      text(g, 'SHIFT', 309, 652, 9, muted, 'right');
      text(g, '07 / EXPERIMENTAL', 890, 648, 8, muted, 'center');
      text(g, 'PROP  2,800', 890, 670, 10, cream, 'center');
      text(g, 'RPM', 890, 688, 8, muted, 'center');
      text(g, 'COURSE LINE', 999, 652, 9, muted);
      for (let i = 0; i < r.config.arches; i++) {
        const x = 1003 + i * 16;
        g.fillStyle = i < r.nextArch ? amber : '#f2cd9738';
        g.fillRect(x, 665, 9, 6);
        if (i === r.nextArch) { g.strokeStyle = cream; g.strokeRect(x - 2, 663, 13, 10); }
      }
      text(g, 'P PAUSE  ·  R RESTART', 999, 701, 10, muted);
    }
    meter(g, label, value, x, y, width, color) {
      text(g, label, x, y, 10, muted);
      text(g, `${Math.round(value)}%`, x + width, y, 11, cream, 'right');
      g.fillStyle = '#0f1820'; g.fillRect(x, y + 7, width, 5);
      g.fillStyle = color; g.fillRect(x, y + 7, width * value / 100, 5);
      for (let i = 1; i < 10; i++) { g.fillStyle = '#25232c'; g.fillRect(x + width * i / 10, y + 7, 2, 5); }
    }
    title(g, game) {
      const shade = g.createLinearGradient(0, 0, 920, 0);
      shade.addColorStop(0, '#251e2bf2'); shade.addColorStop(.5, '#251e2bc9'); shade.addColorStop(1, '#251e2b00');
      g.fillStyle = shade; g.fillRect(0, 0, 1280, 720);
      text(g, '07   /   THE RED ROCK INVITATIONAL', 65, 69, 12, amber);
      line(g, 65, 90, 521, 90, '#ffd49c55');
      text(g, 'CANYON', 57, 218, 99, '#ffe9bf', 'left', '900');
      text(g, 'RUSH', 55, 330, 137, '#ffb875', 'left', '900');
      text(g, 'CHASE THE LAST LIGHT.', 66, 375, 20, cream, 'left', 'bold');
      text(g, 'Three canyons. One aircraft. No room for hesitation.', 67, 409, 13, '#e4c1a0');
      text(g, 'Thread the arches. Ride the crosswind. Bring it home.', 67, 431, 13, '#e4c1a0');
      button(g, 'ENTER  /  TAKE FLIGHT', 66, 475, 307, 57);
      text(g, 'OR CLICK ANYWHERE TO FLY', 67, 553, 10, muted);
      text(g, 'WASD / ARROWS', 67, 613, 11, cream); text(g, 'PITCH + BANK', 67, 634, 10, muted);
      text(g, 'SHIFT', 260, 613, 11, cream); text(g, 'BOOST', 260, 634, 10, muted);
      text(g, 'P / R', 376, 613, 11, cream); text(g, 'PAUSE / RESTART', 376, 634, 10, muted);
      text(g, 'A SUNSET AIR RACE', 1228, 67, 12, '#ffe8bb', 'right');
      text(g, '36° 18′ N   /   112° 09′ W', 1228, 89, 10, '#f3cba3', 'right');
      line(g, 726, 585, 1222, 585, '#ffdc9b66');
      ['DUSK RUN', 'NEEDLE GAP', 'GOLDEN HOUR'].forEach((name, i) => {
        const x = 726 + i * 173;
        text(g, `0${i + 1}`, x, 612, 11, '#ffdc9d');
        text(g, name, x, 636, 13, cream, 'left', 'bold');
        text(g, ['FIND YOUR LINE', 'TRUST THE BANK', 'OUTRUN THE SUN'][i], x, 655, 9, '#e6bd9b');
      });
      text(g, 'ORIGINAL CANVAS FLIGHT EXPERIENCE', 66, 694, 9, '#b68e7d');
      text(g, 'SOUND ON AFTER TAKEOFF   /   M TO MUTE', 1227, 694, 9, '#e0b496', 'right');
    }
    transition(g, game, kind) {
      const r = game.race;
      g.fillStyle = '#1b182a88'; g.fillRect(0, 0, 1280, 720);
      panel(g, 345, 166, 590, 350, .94);
      const paused = kind === 'paused', failed = kind === 'crashed';
      text(g, paused ? 'FLIGHT PAUSED' : failed ? 'SORTIE ENDED' : 'COURSE COMPLETE', 640, 214, 12, amber, 'center');
      text(g, paused ? 'Hold your line.' : failed ? game.failure : r.config.name, 640, 280, failed ? 37 : 46, cream, 'center', 'bold');
      let subtitle = 'Take a breath. The canyon can wait.';
      if (failed) subtitle = 'A fresh aircraft and a new sunset are waiting.';
      if (!paused && !failed) {
        const result = r.results[r.results.length - 1];
        subtitle = `GRADE ${result.grade}   /   ${result.hits}/${result.count} ARCHES   /   ${result.hull}% HULL`;
      }
      text(g, subtitle, 640, 325, 13, muted, 'center');
      button(g, paused ? 'ENTER / RESUME' : failed ? 'ENTER / FLY AGAIN' : r.courseIndex === 2 ? 'ENTER / DEBRIEF' : 'ENTER / NEXT COURSE', 473, 365, 334, 54);
      text(g, paused ? 'P TO RESUME · R TO RESTART' : failed ? 'R ALSO RESTARTS THE RACE' : 'BOOST + HULL RESTORED BETWEEN COURSES', 640, 462, 11, muted, 'center');
    }
    debrief(g, game) {
      const r = game.race;
      g.fillStyle = '#211b29af'; g.fillRect(0, 0, 1280, 720);
      panel(g, 169, 58, 942, 600, .93);
      text(g, 'CANYON / RUSH', 206, 101, 16, amber, 'left', 'bold');
      text(g, 'FLIGHT DEBRIEF  /  03 COURSES', 1071, 99, 11, muted, 'right');
      line(g, 207, 119, 1073, 119);
      text(g, 'You outran the sunset.', 207, 180, 45, cream, 'left', 'bold');
      text(g, 'THE RED ROCK INVITATIONAL  /  RACE COMPLETE', 210, 209, 11, muted);
      const xs = [209, 545, 666, 791, 902, 1040];
      ['COURSE', 'TIME', 'ARCHES', 'NEAR', 'HULL', 'GRADE'].forEach((s, i) => text(g, s, xs[i], 252, 10, muted, i ? 'center' : 'left'));
      r.results.forEach((row, i) => {
        const y = 292 + i * 66;
        line(g, 208, y + 25, 1072, y + 25, '#f2c89127');
        text(g, `0${i + 1}`, 210, y, 11, amber);
        text(g, row.name, 247, y, 22, cream, 'left', 'bold');
        text(g, `${row.time.toFixed(1)}s`, xs[1], y, 16, cream, 'center');
        text(g, `${row.hits}/${row.count}`, xs[2], y, 16, cream, 'center');
        text(g, `+${row.near}`, xs[3], y, 16, amber, 'center');
        text(g, `${row.hull}%`, xs[4], y, 16, cream, 'center');
        text(g, row.grade, xs[5], y + 4, 34, amber, 'center', 'bold');
      });
      text(g, 'TOTAL RACE SCORE', 210, 498, 11, muted);
      text(g, r.totalScore.toLocaleString('en-US'), 205, 553, 56, cream, 'left', 'bold');
      text(g, 'PERSONAL BEST', 550, 498, 11, muted);
      text(g, Math.max(game.best, r.totalScore).toLocaleString('en-US'), 548, 537, 30, amber, 'left', 'bold');
      button(g, 'ENTER / RACE AGAIN', 770, 497, 301, 57);
      text(g, 'TIME + ARCHES + EDGE BONUSES + AIRCRAFT BROUGHT HOME', 210, 614, 10, muted);
      text(g, game.shot ? 'SCREENSHOT PREVIEW' : 'THREE CANYONS. ONE CLEAN RUN.', 1070, 614, 9, muted, 'right');
    }
  }
  C.FlightInstruments = FlightInstruments;
})();
