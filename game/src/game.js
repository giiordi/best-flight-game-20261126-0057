(function () {
  'use strict';
  // Alpine Rescue — main loop, states, input, missions, scoring, screenshot hooks.
  var canvas = document.getElementById('flight-canvas');
  var ctx = canvas.getContext('2d');
  var params = new URLSearchParams(location.search);
  var seed = (Number(params.get('seed')) >>> 0) || 7;
  var shot = params.get('shot');
  var mountain = AlpineMountain.make(seed);
  var groundHeight = mountain.groundHeight;
  var keys = {};
  var state = 'title';            // title | fly | missionDone | crashed | debrief
  var paused = false;
  var missionIdx = 0, mission = null, heli = null;
  var time = 0, clock = 0, total = 0, best = 0, records = [];
  var message = '', messageUntil = 0, crashReason = '', shotMode = false, resting = false, poseY = 0;
  var gustPhase = (seed % 100) / 10;
  try { best = Math.max(0, Number(localStorage.getItem('alpine-rescue-best')) || 0); } catch (e) {}

  function say(text, secs) { message = text; messageUntil = time + (secs || 3); }
  function startMission(idx) {
    missionIdx = idx;
    mission = AlpineRescue.createMission(idx, groundHeight);
    heli = AlpineHeli.create(176, 587, mission.config.fuel);
    clock = 0; message = ''; state = 'fly'; paused = false;
    say(mission.config.name + ' — ' + mission.config.brief, 4);
  }
  function windNow() {
    var cfg = mission.config;
    var gust = cfg.gust * (0.6 * Math.sin(time * 0.9 + gustPhase) + 0.4 * Math.sin(time * 2.3 + gustPhase * 2));
    return cfg.wind + gust;   // px/s^2 sideways
  }
  function hookPos() { return { x: heli.x, y: heli.y + 12 + heli.winch * 110 }; }

  function update(dt) {
    if (state !== 'fly') return;
    if (paused) { AlpineAudio.stopRotor(); AlpineAudio.winch(false); return; }
    mission.time += dt; clock = mission.time;
    var input = {
      up: !!(keys['KeyW'] || keys['ArrowUp']),
      down: !!(keys['KeyS'] || keys['ArrowDown']),
      left: !!(keys['KeyA'] || keys['ArrowLeft']),
      right: !!(keys['KeyD'] || keys['ArrowRight']),
    };
    if (shotMode) {
      // Screenshot pose: hold a steady hover over the hiker until the player acts.
      heli.vx = 0; heli.vy = 0;
      if (input.up || input.down || input.left || input.right || keys['Space']) shotMode = false;
    }
    var eff = input;
    if (heli.fuel <= 0) eff = { up: false, down: input.down, left: input.left, right: input.right };
    var collective = AlpineHeli.update(heli, dt, eff, windNow());
    if (shotMode) { heli.vx = 0; heli.vy = 0; heli.y = poseY; }
    AlpineAudio.rotor(collective, true);
    // winch (frozen while the play screenshot holds its pose)
    var space = !!keys['Space'];
    if (!shotMode) {
      if (space) heli.winch = Math.min(1, heli.winch + dt / 1.2);
      else heli.winch = Math.max(0, heli.winch - dt / 0.9);
    }
    AlpineAudio.winch(!shotMode && space && heli.winch > 0.02 && heli.winch < 1);
    // pickup: steady hover in the zone with the hook at the hiker
    var hook = hookPos();
    if (!shotMode) {
      mission.hikers.forEach(function (h) {
      if (h.state !== 'waiting') return;
      var steady = Math.abs(heli.vx) < 25 && Math.abs(heli.vy) < 25;
      if (Math.abs(heli.x - h.x) < 30 && hook.y >= h.y - 16 && hook.y <= h.y + 12 && steady && heli.winch > 0.8) {
        h.state = 'hooked'; heli.winchHook = true;
        say('HIKER ON THE HOOK — RELEASE SPACE TO LIFT', 4);
        AlpineAudio.chime();
      }
      if (heli.winch > 0.8 && Math.abs(heli.x - h.x) < 46) {
        mission.steadySamples++;
        mission.steadySum += Math.max(0, 1 - (Math.abs(heli.vx) + Math.abs(heli.vy)) / 60);
      }
    });
    }
    // hooked hiker dangles from the hook
    mission.hikers.forEach(function (h) {
      if (h.state === 'hooked') { h.x = hook.x; h.y = hook.y + 8; }
    });
    // release the winch to lift the hooked hiker aboard
    if (!space && heli.winchHook && heli.winch < 0.15) {
      mission.hikers.forEach(function (h) {
        if (h.state === 'hooked') { h.state = 'aboard'; mission.picked++; }
      });
      heli.winchHook = false;
      AlpineAudio.chime();
      say(AlpineRescue.allAboard(mission) ? 'ALL ABOARD — RETURN TO BASE' : 'HIKER ABOARD — ' + (mission.hikers.length - mission.picked) + ' MORE TO GO', 4);
    }
    // low fuel warning
    if (heli.fuel < 15 && heli.fuel > 0) AlpineAudio.beep();
    if (heli.fuel < 15) say('LOW FUEL', 1);
    // ground contact
    var bottom = heli.y + 14, gy = groundHeight(heli.x), onPad = heli.x >= 95 && heli.x <= 257 && gy === 601;
    if (bottom >= gy) {
      var impactVy = heli.vy, impactVx = heli.vx;
      if (onPad && Math.abs(impactVy) < 55 && Math.abs(impactVx) < 40) {
        if (!resting) { AlpineAudio.thud(); resting = true; }
        heli.y = gy - 14; heli.vy = 0; heli.vx = 0;
        if (AlpineRescue.allAboard(mission)) return completeMission(1 - Math.abs(impactVy) / 55);
        say('ON THE PAD — ' + (mission.hikers.length - mission.picked) + ' HIKER(S) STILL WAITING', 2);
      } else {
        return crash(onPad ? 'HARD LANDING ON THE PAD' : 'CRASHED INTO THE MOUNTAIN');
      }
    } else {
      resting = false;
    }
    // contextual hint
    if (!message || time > messageUntil) {
      var near = mission.hikers.some(function (h) { return h.state === 'waiting' && Math.abs(heli.x - h.x) < 60; });
      if (near) say('HOVER STEADY OVER THE HIKER — HOLD SPACE TO LOWER THE WINCH', 2);
      else if (AlpineRescue.allAboard(mission)) say('RETURN TO THE HELIPAD', 2);
      else message = '';
    }
  }
  function completeMission(softness) {
    var steady = mission.steadySamples ? mission.steadySum / mission.steadySamples : 0.5;
    var res = AlpineRescue.grade(mission.time, steady, heli.fuel / 100, softness);
    records.push({ name: mission.config.name, grade: res.grade, score: res.score });
    total += res.score;
    if (missionIdx < 2) { state = 'missionDone'; say('', 0); }
    else finishCampaign();
  }
  function finishCampaign() {
    state = 'debrief';
    if (total > best) {
      best = total;
      try { localStorage.setItem('alpine-rescue-best', String(best)); } catch (e) {}
    }
  }
  function crash(reason) {
    crashReason = reason;
    state = 'crashed';
    AlpineAudio.stopRotor(); AlpineAudio.winch(false); AlpineAudio.thud();
  }
  function draw() {
    ctx.clearRect(0, 0, 1280, 720);
    var dusk = mission ? mission.config.dusk : false;
    mountain.draw(ctx, { shade: state === 'crashed' ? 0.3 : 0 }, { dusk: dusk }, time);
    if (mission) {
      // soft shadow under the helicopter
      var gy = groundHeight(heli.x);
      var alt = Math.max(0, gy - heli.y);
      ctx.fillStyle = 'rgba(20,40,30,' + Math.max(0.05, 0.28 - alt * 0.0009) + ')';
      ctx.beginPath(); ctx.ellipse(heli.x, gy + 5, 34, 7, 0, 0, Math.PI * 2); ctx.fill();
      AlpineRescue.draw(ctx, mission, time);
      AlpineHeli.draw(ctx, heli, time);
      // hooked hiker dangling from the hook
      var hook = hookPos();
      mission.hikers.forEach(function (h) {
        if (h.state !== 'hooked') return;
        ctx.strokeStyle = '#1d3557'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(hook.x, hook.y - 14); ctx.lineTo(hook.x, hook.y); ctx.stroke();
        ctx.fillStyle = '#e63946';
        ctx.beginPath(); ctx.arc(hook.x, hook.y - 18, 5, 0, Math.PI * 2); ctx.fill();
      });
    }
    if (state === 'fly' || state === 'missionDone' || state === 'crashed') {
      var groundY = groundHeight(heli.x);
      AlpineInstruments.draw(ctx, {
        missionName: mission.config.name, clock: clock, rescued: mission.picked, total: mission.hikers.length,
        best: best, message: time < messageUntil ? message : '',
        fuel: heli.fuel, fuelLow: heli.fuel < 15,
        windKt: windNow() * 0.35, altFt: Math.max(0, (groundY - heli.y) * 2),
        speedKt: Math.abs(heli.vx) * 0.35, vsi: -heli.vy * 120,
        heading: heli.vx >= 0 ? 90 : 270,
        winch: heli.winch, winchState: heli.winchHook ? 'LOCKED' : (heli.winch > 0.05 ? 'DOWN' : 'UP'),
      });
    }
    if (state === 'title') drawTitle();
    if (state === 'missionDone') drawMissionDone();
    if (state === 'crashed') drawCrashed();
    if (state === 'debrief') drawDebrief();
    if (paused && state === 'fly') {
      ctx.fillStyle = 'rgba(8,26,32,.55)'; ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 44px ui-monospace, monospace'; ctx.textAlign = 'center';
      ctx.fillText('PAUSED', 640, 340);
      ctx.font = 'bold 16px ui-monospace, monospace';
      ctx.fillText('P TO RESUME  •  R TO RESTART', 640, 380);
    }
  }
  function overlay() {
    ctx.fillStyle = 'rgba(8,26,32,.45)'; ctx.fillRect(0, 0, 1280, 720);
  }
  function drawTitle() {
    overlay();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px ui-monospace, monospace';
    ctx.fillText('ALPINE RESCUE', 640, 210);
    ctx.fillStyle = '#ffd9a8';
    ctx.font = 'bold 20px ui-monospace, monospace';
    ctx.fillText('A MOUNTAIN RESCUE HELICOPTER GAME', 640, 248);
    ctx.fillStyle = '#eaf6f0';
    ctx.font = '16px ui-monospace, monospace';
    ctx.fillText('Three missions. Hover steady, lower the winch, lift the hikers home.', 640, 300);
    ctx.fillText('Watch the wind. Mind the fuel. Land soft.', 640, 326);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px ui-monospace, monospace';
    ctx.fillText('W / S COLLECTIVE  •  A / D CYCLIC  •  SPACE WINCH  •  P PAUSE  •  R RESTART', 640, 400);
    ctx.fillStyle = '#7fd08a';
    ctx.font = 'bold 20px ui-monospace, monospace';
    ctx.fillText('PRESS ENTER OR CLICK TO FLY', 640, 460);
    ctx.fillStyle = '#cfe8e2';
    ctx.font = '13px ui-monospace, monospace';
    ctx.fillText('MISSION 1 FIRST CALL  •  MISSION 2 GUSTING RIDGE  •  MISSION 3 LAST LIGHT', 640, 500);
    ctx.textAlign = 'left';
  }
  function drawMissionDone() {
    var r = records[records.length - 1];
    overlay();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px ui-monospace, monospace';
    ctx.fillText('MISSION COMPLETE', 640, 280);
    ctx.fillStyle = '#7fd08a';
    ctx.font = 'bold 64px ui-monospace, monospace';
    ctx.fillText('GRADE ' + r.grade, 640, 360);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px ui-monospace, monospace';
    ctx.fillText(r.name + '  •  ' + r.score + ' PTS  •  TOTAL ' + total, 640, 410);
    ctx.fillStyle = '#ffd9a8';
    ctx.font = 'bold 18px ui-monospace, monospace';
    ctx.fillText('PRESS ENTER FOR THE NEXT MISSION', 640, 470);
    ctx.textAlign = 'left';
  }
  function drawCrashed() {
    overlay();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e63946';
    ctx.font = 'bold 44px ui-monospace, monospace';
    ctx.fillText(crashReason, 640, 300);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px ui-monospace, monospace';
    ctx.fillText('THE RESCUE TEAM WILL TRY AGAIN', 640, 350);
    ctx.fillStyle = '#ffd9a8';
    ctx.font = 'bold 18px ui-monospace, monospace';
    ctx.fillText('PRESS R TO RETRY THIS MISSION', 640, 410);
    ctx.textAlign = 'left';
  }
  function drawDebrief() {
    overlay();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px ui-monospace, monospace';
    ctx.fillText('RESCUE COMPLETE', 640, 170);
    var y = 240;
    records.forEach(function (r) {
      ctx.fillStyle = '#eaf6f0';
      ctx.font = 'bold 20px ui-monospace, monospace';
      ctx.fillText(r.name + '   —   GRADE ' + r.grade + '   •   ' + r.score + ' PTS', 640, y);
      y += 44;
    });
    ctx.fillStyle = '#ffd9a8';
    ctx.font = 'bold 30px ui-monospace, monospace';
    ctx.fillText('TOTAL  ' + total + '   •   BEST  ' + best, 640, y + 20);
    ctx.fillStyle = '#7fd08a';
    ctx.font = 'bold 18px ui-monospace, monospace';
    ctx.fillText('PRESS R TO FLY AGAIN', 640, y + 70);
    ctx.textAlign = 'left';
  }
  function loop(ts) {
    var now = ts / 1000;
    var dt = Math.min(0.05, now - (loop.last || now));
    loop.last = now;
    time += dt;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  function start() {
    AlpineAudio.ensure(); AlpineAudio.click();
    if (state === 'title') { startMission(0); return; }
    if (state === 'missionDone') { startMission(missionIdx + 1); return; }
    if (state === 'crashed') { startMission(missionIdx); return; }
    if (state === 'debrief') { total = 0; records = []; startMission(0); return; }
  }
  window.addEventListener('keydown', function (e) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) >= 0) e.preventDefault();
    AlpineAudio.ensure();
    keys[e.code] = true;
    if (e.code === 'Enter') start();
    if (e.code === 'KeyP' && state === 'fly') paused = !paused;
    if (e.code === 'KeyR') { total = 0; records = []; startMission(state === 'fly' || state === 'crashed' ? missionIdx : 0); }
    if (e.code === 'KeyM') { /* mute reserved */ }
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  canvas.addEventListener('click', function () { AlpineAudio.ensure(); start(); });
  // Screenshot hooks (?shot=start|play|end, ?seed=n). Normal play starts at the title.
  startMission(0);
  if (shot === 'start') { state = 'title'; heli = AlpineHeli.create(176, 587, 100); }
  if (shot === 'play') {
    state = 'fly'; shotMode = true;
    var h0 = mission.hikers[0];
    heli = AlpineHeli.create(h0.x, h0.y - 111, 100);
    heli.winch = 0.9; poseY = heli.y; mission.time = 42; clock = 42;
    say('STEADY HOVER — KEEP THE HOOK ON THE HIKER', 999);
  }
  if (shot === 'end') {
    state = 'debrief';
    records = [
      { name: 'Mission 1 — First Call', grade: 'S', score: 1480 },
      { name: 'Mission 2 — Gusting Ridge', grade: 'A', score: 1240 },
      { name: 'Mission 3 — Last Light', grade: 'B', score: 1010 },
    ];
    total = 3730; best = 3730;   // display only; never written to localStorage
  }
  requestAnimationFrame(loop);
})();
