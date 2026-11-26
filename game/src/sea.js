'use strict';
window.NT = window.NT || {};
NT.clamp = (n, a, b) => Math.max(a, Math.min(b, n));
NT.random = function randomSeed(seed) {
  let n = seed >>> 0;
  return () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
};
NT.poly = function polygon(c, points, fill, stroke, width = 1) {
  c.beginPath(); points.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
};
NT.line = function line(c, x, y, xx, yy, color, width = 1) {
  c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy); c.strokeStyle = color; c.lineWidth = width; c.stroke();
};
NT.light = function light(c, x, y, radius, color, bloom = 10) {
  c.save(); c.shadowColor = color; c.shadowBlur = bloom; c.fillStyle = color;
  c.beginPath(); c.arc(x, y, Math.max(.4, radius), 0, Math.PI * 2); c.fill(); c.restore();
};
NT.Sea = class NightSea {
  constructor(seed) {
    const r = NT.random(seed);
    this.stars = Array.from({length: 155}, () => ({x:r()*1500-110,y:28+r()*205,r:.3+r()*1.1,a:.15+r()*.65}));
    this.waves = Array.from({length: 640}, () => ({x:r()*1550-130,z:r(),w:3+r()*29,a:r(),phase:r()*6.28}));
    this.reflection = Array.from({length: 165}, () => ({z:r(),x:r()-.5,w:r(),a:r()}));
  }
  draw(c, jet, t) {
    const h = 242 + (jet.pitch + 3.2) * 5.5;
    const sky = c.createLinearGradient(0, 0, 0, h + 70);
    sky.addColorStop(0, '#030a19'); sky.addColorStop(.65, '#0c1a30'); sky.addColorStop(1, '#263b50');
    c.fillStyle = sky; c.fillRect(-250,-200,1800,h+200);
    for (const s of this.stars) {
      c.globalAlpha = s.a * (.85 + .15 * Math.sin(t * .4 + s.x));
      c.fillStyle = '#c4ddec'; c.fillRect(s.x, s.y, s.r, s.r);
    }
    c.globalAlpha = 1;
    const moonX = 1030 - jet.headingError * 9, moonY = 112 + (jet.pitch + 3.2) * 4;
    const halo = c.createRadialGradient(moonX,moonY,12,moonX,moonY,126);
    halo.addColorStop(0,'#cce4db24'); halo.addColorStop(.4,'#91bdcf0b'); halo.addColorStop(1,'#91bdcf00');
    c.fillStyle=halo; c.fillRect(moonX-130,moonY-130,260,260);
    NT.light(c,moonX,moonY,21,'#d3ded1',20);
    c.save(); c.beginPath(); c.arc(moonX,moonY,21,0,Math.PI*2); c.clip();
    c.fillStyle='#81989b42';
    for (let i=0;i<11;i++) { c.beginPath(); c.arc(moonX+Math.sin(i*8)*18,moonY+Math.cos(i*9)*17,2+i%4,0,7);c.fill(); }
    c.restore();
    const sea = c.createLinearGradient(0,h,0,560);
    sea.addColorStop(0,'#182c3d'); sea.addColorStop(.25,'#0a1c2c'); sea.addColorStop(1,'#030c18');
    c.fillStyle=sea; c.fillRect(-250,h,1800,650);
    NT.line(c,-200,h,1480,h,'#69859838');
    const mist=c.createLinearGradient(0,h-15,0,h+40);
    mist.addColorStop(0,'#6f91a000'); mist.addColorStop(.45,'#9bb4b71b'); mist.addColorStop(1,'#8bb5b600');
    c.fillStyle=mist;c.fillRect(-200,h-15,1700,55);
    for (const p of this.reflection) {
      const depth=p.z*p.z, y=h+5+depth*310;
      const x=moonX+p.x*(25+depth*310)+Math.sin(t*.8+p.z*40)*8*depth;
      c.fillStyle=`rgba(188,212,190,${(.035+p.a*.12)*(1-depth*.65)})`;
      c.fillRect(x,y,3+p.w*(9+depth*68),.5+depth*1.7);
    }
    for (const w of this.waves) {
      const d=w.z*w.z, y=h+4+d*380;
      const x=w.x+Math.sin(t*.45+w.phase)*d*14;
      const yy=y+Math.sin(t*.7+w.phase)*d*3;
      c.strokeStyle=`rgba(90,144,163,${.025+w.a*.13})`;c.lineWidth=.5+d*1.1;
      c.beginPath();c.moveTo(x,yy);c.quadraticCurveTo(x+w.w*d,yy-2*d,x+w.w*(.4+d*2),yy);c.stroke();
    }
    // Distant cloud banks are translucent and stay below the star field.
    c.fillStyle='#09152670';
    c.beginPath();c.moveTo(-200,h-10);
    for(let x=-200;x<1500;x+=25)c.lineTo(x,h-16-Math.sin(x*.013)*5-Math.sin(x*.031)*3);
    c.lineTo(1500,h+2);c.lineTo(-200,h+2);c.fill();
  }
};
