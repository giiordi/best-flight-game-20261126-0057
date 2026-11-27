(function () {
  'use strict';
  const rand = (seed) => { let x = seed >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; };
  function make(seed) {
    const random = rand(seed || 17);
    const clouds = Array.from({ length: 8 }, (_, i) => ({ x: random() * 1500 - 100, y: 42 + random() * 170, s: 0.45 + random() * 0.8, phase: i * 3 }));
    const pines = Array.from({ length: 54 }, (_, i) => ({ x: random() * 1520 - 120, y: 410 + random() * 220, s: 0.45 + random() * 0.8, dark: random() > 0.48 }));
    function polygon(ctx, points, fill) { ctx.fillStyle = fill; ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); }
    function drawPeak(ctx, x, base, width, height, shade) {
      polygon(ctx, [[x-width/2,base],[x-width*.18,base-height*.55],[x,base-height],[x+width*.16,base-height*.52],[x+width/2,base]], shade);
      polygon(ctx, [[x,base-height],[x+width*.16,base-height*.52],[x+width*.28,base-height*.34],[x+width/2,base]], shade === '#7899a2' ? '#688892' : '#83a1a5');
      polygon(ctx, [[x,base-height],[x-width*.18,base-height*.55],[x-width*.08,base-height*.61],[x+width*.015,base-height*.78],[x+width*.16,base-height*.52],[x+width*.08,base-height*.58]], '#f6fbf5');
      polygon(ctx, [[x+width*.015,base-height*.78],[x+width*.16,base-height*.52],[x+width*.08,base-height*.58],[x+width*.20,base-height*.62]], '#d9e9e7');
    }
    function drawTree(ctx, x, y, s, dark) {
      ctx.fillStyle = '#6d573e'; ctx.fillRect(x-2*s, y-12*s, 4*s, 18*s);
      polygon(ctx, [[x,y-54*s],[x-17*s,y-27*s],[x-9*s,y-27*s],[x-23*s,y-7*s],[x+23*s,y-7*s],[x+9*s,y-27*s],[x+17*s,y-27*s]], dark ? '#28594b' : '#36745a');
      ctx.fillStyle = 'rgba(202,233,194,.45)'; ctx.fillRect(x-2*s, y-35*s, 2*s, 17*s);
    }
    function drawHelipad(ctx, x, y) {
      ctx.fillStyle = '#52635d'; ctx.beginPath(); ctx.ellipse(x,y,93,16,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#f8f1d9'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x,y,83,12,0,0,Math.PI*2); ctx.stroke();
      ctx.font = 'bold 21px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff8de'; ctx.fillText('H',x,y+7);
      ctx.strokeStyle = '#43544e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x+88,y-7); ctx.lineTo(x+88,y-76); ctx.stroke();
      ctx.strokeStyle = '#fff4d7'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x+89,y-75); ctx.lineTo(x+131,y-65); ctx.stroke();
      polygon(ctx, [[x+90,y-76],[x+112,y-71],[x+106,y-65],[x+90,y-68]], '#f08a51');
      polygon(ctx, [[x+112,y-71],[x+132,y-66],[x+106,y-65]], '#fff4d7');
    }
    // Walkable ground: the lowest slope ridge, with the helipad cut flat at y 601.
    const SLOPE = [[0,616],[155,572],[268,596],[407,544],[560,617],[716,565],[856,619],[1007,555],[1161,605],[1280,570]];
    function groundHeight(x) {
      if (x >= 80 && x <= 272) return 601;
      const cx = Math.max(0, Math.min(1280, x));
      for (let i = 0; i < SLOPE.length - 1; i++) {
        const a = SLOPE[i], b = SLOPE[i + 1];
        if (cx >= a[0] && cx <= b[0]) {
          const t = (cx - a[0]) / (b[0] - a[0]);
          return a[1] + t * (b[1] - a[1]);
        }
      }
      return 616;
    }
    function draw(ctx, camera, mission, time) {
      const dusk = mission && mission.dusk ? 1 : 0;
      const sky = ctx.createLinearGradient(0,0,0,500);
      sky.addColorStop(0, dusk ? '#da9a78' : '#72c9e2'); sky.addColorStop(.62, dusk ? '#f4c293' : '#b8e8ed'); sky.addColorStop(1, '#e1f2e9');
      ctx.fillStyle = sky; ctx.fillRect(0,0,1280,720);
      ctx.fillStyle = dusk ? 'rgba(255,226,164,.95)' : '#fff4c7'; ctx.beginPath(); ctx.arc(1040,119,42,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      clouds.forEach(c => { const x = ((c.x + time*5 + c.phase*19) % 1500 + 1500) % 1500 - 100; ctx.beginPath(); ctx.ellipse(x,c.y,c.s*58,c.s*13,0,0,Math.PI*2); ctx.ellipse(x-23*c.s,c.y+4,c.s*31,c.s*12,0,0,Math.PI*2); ctx.ellipse(x+25*c.s,c.y+2,c.s*35,c.s*14,0,0,Math.PI*2); ctx.fill(); });
      drawPeak(ctx,190,477,360,326,'#7899a2'); drawPeak(ctx,498,490,450,385,'#91aeb2'); drawPeak(ctx,865,475,390,322,'#718f9a'); drawPeak(ctx,1165,495,360,296,'#91aaac');
      polygon(ctx, [[0,430],[128,390],[240,429],[361,355],[486,428],[603,383],[742,433],[850,367],[1004,431],[1129,387],[1280,435],[1280,720],[0,720]], '#83b88b');
      polygon(ctx, [[0,526],[132,462],[257,507],[382,445],[520,520],[671,466],[822,525],[968,454],[1114,518],[1280,458],[1280,720],[0,720]], '#5c9c73');
      polygon(ctx, [[0,616],[155,572],[268,596],[407,544],[560,617],[716,565],[856,619],[1007,555],[1161,605],[1280,570],[1280,720],[0,720]], '#477f64');
      ctx.strokeStyle = 'rgba(229,244,213,.7)'; ctx.lineWidth = 4;
      [[80,479,274,498],[650,487,776,502],[955,480,1114,499],[353,566,510,577]].forEach(a => { ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.quadraticCurveTo((a[0]+a[2])/2,a[3]-20,a[2],a[3]); ctx.stroke(); });
      // The silver river winds through the valley and leads the eye toward the base.
      ctx.strokeStyle = '#4aaabd'; ctx.lineWidth = 31; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-20,689); ctx.bezierCurveTo(230,624,254,692,472,634); ctx.bezierCurveTo(669,582,624,661,825,613); ctx.bezierCurveTo(1032,562,1070,615,1305,550); ctx.stroke();
      ctx.strokeStyle = '#b5e6e2'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-20,684); ctx.bezierCurveTo(230,619,254,687,472,629); ctx.bezierCurveTo(669,577,624,656,825,608); ctx.bezierCurveTo(1032,557,1070,610,1305,545); ctx.stroke();
      pines.forEach(p => drawTree(ctx, p.x, p.y, p.s, p.dark));
      drawHelipad(ctx, 176, 601);
      ctx.fillStyle = 'rgba(29,67,56,.18)'; ctx.beginPath(); ctx.ellipse(176,624,104,10,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#244b43'; ctx.font = 'bold 12px ui-monospace, monospace'; ctx.textAlign = 'left'; ctx.fillText('ALPINE BASE  •  1,420 FT', 84, 647);
      if (camera && camera.shade) { ctx.fillStyle = `rgba(22,42,53,${camera.shade})`; ctx.fillRect(0,0,1280,720); }
    }
    return { draw, groundHeight };
  }
  window.AlpineMountain = { make };
})();
