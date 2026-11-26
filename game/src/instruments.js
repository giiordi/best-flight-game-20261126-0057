'use strict';
NT.Instruments = class CockpitInstruments {
  constructor() { this.cyan='#7ae6d8';this.muted='#68918f';this.amber='#efbb70'; }
  text(c, text, x, y, size=12, color=this.cyan, align='left', face='monospace') {
    c.font=`${size}px ${face}`;c.fillStyle=color;c.textAlign=align;c.fillText(text,x,y);
  }
  box(c,x,y,w,h,fill='#07151c',stroke='#385051',radius=5) {
    c.beginPath();c.roundRect(x,y,w,h,radius);c.fillStyle=fill;c.fill();
    if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
  }
  hud(c,j,g) {
    const cyan=this.cyan;
    c.save();c.shadowColor='#42dacc';c.shadowBlur=5;
    this.text(c,'NIGHT TRAP',34,37,19,'#e3e6d8','left','sans-serif');
    this.text(c,'C A R R I E R   L A N D I N G',35,56,8,'#8bafb0');
    this.text(c,'RECOVERY / 08',640,33,11,cyan,'center');
    this.text(c,`SORTIE 0${g.sortie+1} / 03`,1239,33,13,'#e5e4d2','right');
    this.text(c,NT.SORTIES[g.sortie].name.toUpperCase(),1239,53,10,this.amber,'right');
    NT.line(c,34,70,1246,70,'#608d8a40');
    // Clearly labelled speed, heading and altitude on the head-up display.
    this.text(c,'AIRSPEED',390,148,9,cyan,'center');
    this.box(c,351,158,79,38,'#08222566','#7ae6d887',1);
    this.text(c,Math.round(j.speed).toString().padStart(3,'0'),389,184,25,cyan,'center');
    this.text(c,'KNOTS',390,211,9,cyan,'center');
    this.text(c,'ALTITUDE',891,148,9,cyan,'center');
    this.box(c,851,158,80,38,'#08222566','#7ae6d887',1);
    this.text(c,Math.max(0,Math.round(j.altitude)).toString().padStart(3,'0'),891,184,25,cyan,'center');
    this.text(c,'FEET',891,211,9,cyan,'center');
    this.text(c,'HDG',640,87,9,cyan,'center');
    this.box(c,610,93,60,27,'#08222555','#7ae6d887',1);
    this.text(c,Math.round(j.heading).toString().padStart(3,'0')+'°',640,113,17,cyan,'center');
    for(let d=-30;d<=30;d+=5){
      const x=640+d*6.2-j.headingError*6.2;
      if(x<440||x>840)continue;
      NT.line(c,x,125,x,125+(d%10===0?11:6),'#7ae6d888');
      if(d%10===0)this.text(c,((270+d+360)%360).toString(),x,148,9,cyan,'center');
    }
    NT.poly(c,[[635,122],[645,122],[640,127]],cyan);
    // Pitch ladder is banked; the flight-path marker remains easy to acquire.
    c.save();c.translate(640,269);c.rotate(-j.bank*Math.PI/180*.8);
    c.setLineDash([5,5]);NT.line(c,-171,0,171,0,'#7ae6d855');c.setLineDash([]);
    for(let p=-10;p<=10;p+=5){
      if(p===0)continue;const y=(j.pitch-p)*10;
      if(y< -90||y>115)continue;
      NT.line(c,-64,y,-20,y,'#7ae6d877');NT.line(c,20,y,64,y,'#7ae6d877');
      NT.line(c,-64,y,-64,y+(p>0?5:-5),'#7ae6d877');NT.line(c,64,y,64,y+(p>0?5:-5),'#7ae6d877');
      this.text(c,String(p),-74,y+3,10,cyan,'right');this.text(c,String(p),74,y+3,10,cyan);
    }
    c.restore();
    const fy=306+(j.pitch+3.2)*8;
    c.strokeStyle=cyan;c.lineWidth=1.6;c.beginPath();c.arc(640,fy,10,0,7);c.stroke();
    NT.line(c,614,fy,630,fy,cyan,1.6);NT.line(c,650,fy,666,fy,cyan,1.6);NT.line(c,640,fy-20,640,fy-10,cyan,1.6);
    NT.line(c,625,fy+33,655,fy+33,'#7ae6d866');
    this.text(c,(Math.max(0,j.distance)/1852).toFixed(2)+' NM',640,386,14,cyan,'center');
    this.text(c,'TACAN 08X  /  BRC 270',640,405,9,'#8fc4b6','center');
    // Vertical landing cues at left and right of the combiner glass.
    this.text(c,'AoA',308,267,10,cyan,'center');this.aoa(c,308,300,j,1);
    this.text(c,'BALL',973,267,10,cyan,'center');this.ball(c,973,304,j,1);
    const advice=j.flameout?'FLAMEOUT / GLIDE':j.speed<123?'POWER — LOW AIRSPEED':Math.abs(j.glideError)>38?(j.glideError>0?'HIGH — EASE THE NOSE DOWN':'LOW — RAISE THE NOSE'):Math.abs(j.lineup)>32?'CORRECT YOUR LINEUP':'ON GLIDE SLOPE';
    this.text(c,advice,640,422,11,j.flameout||j.speed<123?'#ff8d75':Math.abs(j.glideError)>38?this.amber:cyan,'center');
    c.shadowBlur=0;
    this.text(c,`WIND ${Math.abs(j.wind).toFixed(0).padStart(2,'0')} KT ${j.wind<0?'←':'→'}`,35,115,12,'#b8d2cc');
    this.text(c,`DECK 270°  •  WIRE 3`,35,135,10,'#92aaa9');
    this.text(c,`SCORE ${g.total.toString().padStart(4,'0')}`,1240,115,13,this.amber,'right');
    this.text(c,`BEST ${g.best.toString().padStart(4,'0')}`,1240,135,10,'#92aaa9','right');
    if(j.brake)this.text(c,'SPEEDBRAKE',891,235,10,this.amber,'center');
    c.restore();
  }
  aoa(c,x,y,j,s) {
    const on=Math.abs(j.speed-140)<=7,slow=j.speed<133,fast=j.speed>147;
    c.save();c.translate(x,y);c.scale(s,s);c.lineWidth=3;
    c.strokeStyle=slow?'#ff726b':'#452b2b';c.beginPath();c.moveTo(-7,-19);c.lineTo(0,-11);c.lineTo(7,-19);c.stroke();
    c.strokeStyle=on?'#8df2b8':'#264b40';c.shadowColor=c.strokeStyle;c.shadowBlur=on?10:0;
    c.beginPath();c.arc(0,0,6,0,7);c.stroke();c.shadowBlur=0;
    c.strokeStyle=fast?'#ffbd61':'#51442d';c.beginPath();c.moveTo(-7,19);c.lineTo(0,11);c.lineTo(7,19);c.stroke();
    c.restore();
  }
  ball(c,x,y,j,s) {
    c.save();c.translate(x,y);c.scale(s,s);
    this.box(c,-9,-31,18,62,'#04130e','#405a4b',2);
    for(let i=-2;i<=2;i++)NT.light(c,0,i*11,2,'#4b4931',0);
    for(let i=0;i<3;i++){NT.light(c,-18-i*7,0,1.7,'#81e4aa',5);NT.light(c,18+i*7,0,1.7,'#81e4aa',5);}
    NT.light(c,0,-NT.clamp(j.glideError/20,-2,2)*11,4,'#ffc86b',13);
    c.restore();
  }
  bezel(c,x,y,r) {
    c.save();c.shadowColor='#000';c.shadowBlur=12;
    const rim=c.createRadialGradient(x-20,y-30,10,x,y,r+8);rim.addColorStop(0,'#526063');rim.addColorStop(.8,'#1a292e');rim.addColorStop(1,'#071116');
    NT.light(c,x,y,r+7,rim,0);c.shadowBlur=0;NT.light(c,x,y,r,'#050f17',0);
    c.strokeStyle='#72838255';c.lineWidth=1;c.beginPath();c.arc(x,y,r-3,0,7);c.stroke();
    for(let a=0;a<4;a++){const an=a*Math.PI/2+.77;const xx=x+Math.cos(an)*(r+1),yy=y+Math.sin(an)*(r+1);NT.light(c,xx,yy,2.1,'#85908a',0);NT.line(c,xx-1.5,yy+.5,xx+1.5,yy-.5,'#17252b');}
    c.restore();
  }
  dial(c,x,y,r,value,min,max,label,unit,major) {
    this.bezel(c,x,y,r);c.save();c.translate(x,y);
    for(let i=0;i<=40;i++){
      const a=(-225+i/40*270)*Math.PI/180;
      const outer=r-11,inner=r-(i%5===0?20:15);
      NT.line(c,Math.cos(a)*inner,Math.sin(a)*inner,Math.cos(a)*outer,Math.sin(a)*outer,i%5===0?'#bdd8c6':'#557d77',i%5===0?1.4:.6);
      if(i%10===0){const n=min+(max-min)*i/40;this.text(c,String(Math.round(n/major)),Math.cos(a)*(r-31),Math.sin(a)*(r-31)+3,9,'#b9d5c4','center');}
    }
    this.text(c,label,0,-21,9,'#94b5aa','center');
    this.box(c,-30,14,60,23,'#0b211f','#315e50',2);
    this.text(c,String(Math.round(value)).padStart(3,'0'),0,31,19,'#afe6ca','center');
    this.text(c,unit,0,47,8,'#699e8d','center');
    const angle=(-225+NT.clamp((value-min)/(max-min),0,1)*270)*Math.PI/180;
    c.save();c.rotate(angle);NT.poly(c,[[-12,-2],[r-18,0],[-12,2]],'#edce8a');c.restore();
    NT.light(c,0,0,5,'#243c3d',0);NT.light(c,0,0,2,'#a5beaa',0);c.restore();
  }
  attitude(c,x,y,r,j) {
    this.bezel(c,x,y,r);c.save();c.beginPath();c.arc(x,y,r-7,0,7);c.clip();
    c.translate(x,y);c.rotate(-j.bank*Math.PI/180);const dy=j.pitch*2.5;
    const sky=c.createLinearGradient(0,-r,0,r);sky.addColorStop(0,'#26516b');sky.addColorStop(1,'#102b40');
    c.fillStyle=sky;c.fillRect(-r*2,-r*2,r*4,r*4);
    c.fillStyle='#5a4734';c.fillRect(-r*2,dy,r*4,r*3);NT.line(c,-r*2,dy,r*2,dy,'#e1d6b4',1.5);
    for(let k=-30;k<=30;k+=10){if(!k)continue;const yy=dy+k*2.5;NT.line(c,-16,yy,16,yy,'#d3dbc5a0');this.text(c,String(Math.abs(k)),25,yy+3,8,'#d3dbc5');}
    c.restore();c.save();c.translate(x,y);
    NT.line(c,-43,0,-14,0,'#f5ce7d',3);NT.line(c,14,0,43,0,'#f5ce7d',3);
    NT.line(c,-14,0,-14,7,'#f5ce7d',3);NT.line(c,14,0,14,7,'#f5ce7d',3);NT.light(c,0,0,3,'#f5ce7d',4);
    NT.poly(c,[[-5,-r+13],[5,-r+13],[0,-r+22]],'#efcf8b');
    this.text(c,'ATT',0,r-17,8,'#d3dbc5','center');c.restore();
  }
  panel(c,j,g) {
    // Curved coaming, heavy canopy rails and a visible aircraft nose.
    NT.poly(c,[[0,439],[127,468],[275,499],[408,511],[494,488],[640,464],[786,488],[872,511],[1005,499],[1153,468],[1280,439],[1280,720],[0,720]],'#03080d','#263a44',3);
    NT.poly(c,[[491,488],[569,438],[640,427],[711,438],[789,488]],'#101b26','#3e535d',1.4);
    NT.line(c,640,432,640,481,'#39525a',1);
    const panel=c.createLinearGradient(0,500,0,720);panel.addColorStop(0,'#26363d');panel.addColorStop(.18,'#14232b');panel.addColorStop(1,'#071119');
    NT.poly(c,[[0,522],[170,536],[328,527],[464,515],[816,515],[952,527],[1110,536],[1280,522],[1280,720],[0,720]],panel,'#52615c',1.5);
    NT.line(c,0,538,306,552,'#d3953944',1);NT.line(c,974,552,1280,538,'#d3953944',1);
    // Glass HUD combiner supports and the canopy's structural frame.
    c.save();c.lineCap='round';
    NT.line(c,-13,53,161,469,'#02080f',23);NT.line(c,1293,53,1119,469,'#02080f',23);
    NT.line(c,-6,53,167,468,'#3e5360',3);NT.line(c,1286,53,1113,468,'#3e5360',3);
    NT.line(c,267,493,365,433,'#243641',10);NT.line(c,1013,493,915,433,'#243641',10);
    c.strokeStyle='#73c3b84a';c.lineWidth=1;c.beginPath();c.moveTo(361,435);c.lineTo(345,151);c.quadraticCurveTo(640,108,935,151);c.lineTo(919,435);c.stroke();
    c.restore();
    for(const x of [24,298,981,1257])for(const y of [552,702]){NT.light(c,x,y,3,'#6c7c77',0);NT.line(c,x-2,y,x+2,y,'#15232b');}
    this.navigationDisplay(c,53,558,j);
    this.dial(c,428,619,69,j.speed,60,220,'AIRSPEED','KNOTS',1);
    this.attitude(c,640,614,76,j);
    this.dial(c,851,619,69,j.altitude,0,1000,'ALTITUDE','FEET',1);
    this.engineDisplay(c,1002,558,j);
    // Compact secondary instruments between the large dials.
    this.text(c,'AoA',533,558,8,'#9cae9e','center');this.aoa(c,533,591,j,.75);
    this.text(c,'LENS',747,558,8,'#9cae9e','center');this.ball(c,747,594,j,.68);
    this.box(c,497,638,75,43,'#08191c','#38534f',3);
    this.text(c,'V/S FT/M',534,650,8,'#86a797','center');this.text(c,Math.round(j.vsi/10)*10,534,670,15,'#b5ddbd','center');
    this.box(c,709,638,75,43,'#08191c','#38534f',3);
    this.text(c,'LINEUP M',746,650,8,'#86a797','center');this.text(c,(j.lineup<0?'L ':'R ')+Math.abs(j.lineup).toFixed(0),746,670,15,'#b5ddbd','center');
    this.text(c,Math.round(j.heading).toString().padStart(3,'0'),640,705,14,'#c8d8c0','center');
    for(let i=-5;i<=5;i++)NT.line(c,640+i*14,689,640+i*14,693+(i%2===0?3:0),'#759d8a');
    NT.poly(c,[[636,682],[644,682],[640,688]],this.amber);
    this.text(c,'GEAR',319,580,8,'#89a99b','center');
    for(let i=0;i<3;i++)NT.light(c,310+i*9,594,2.5,'#82e4a7',5);
    this.text(c,'DOWN',319,611,8,'#a8c7ac','center');
    this.text(c,'HOOK',961,580,8,'#89a99b','center');NT.light(c,961,595,3,'#82e4a7',6);
    this.text(c,'ARMED',961,612,8,'#a8c7ac','center');
    this.text(c,'08 / NIGHT RECOVERY',53,698,8,'#728e87');
    this.text(c,'P PAUSE   B BRAKE   X WAVE OFF',1225,698,8,'#728e87','right');
  }
  navigationDisplay(c,x,y,j) {
    this.box(c,x-9,y-9,236,132,'#061017','#3d5157',6);
    this.box(c,x,y,218,111,'#071d20','#41635c',1);
    c.save();c.beginPath();c.rect(x,y,218,111);c.clip();
    for(let i=1;i<4;i++){c.strokeStyle='#42796a39';c.beginPath();c.arc(x+109,y+126,i*38,Math.PI,Math.PI*2);c.stroke();}
    NT.line(c,x+109,y,x+109,y+108,'#70b59a55');
    for(let i=0;i<4;i++)NT.line(c,x+20,y+20+i*24,x+198,y+20+i*24,'#42796a25');
    NT.poly(c,[[x+103,y+20],[x+113,y+20],[x+119,y+46],[x+102,y+46]],'#70c4a36b','#92dbc3');
    const p=NT.clamp(j.lineup*.16,-70,70);NT.poly(c,[[x+109+p,y+78],[x+103+p,y+92],[x+109+p,y+89],[x+115+p,y+92]],'#acf2c9');
    this.text(c,'ILS / 08X',x+8,y+15,9,'#9ed5b6');
    this.text(c,(Math.max(0,j.distance)/1852).toFixed(2)+' NM',x+208,y+101,10,'#c0e8bd','right');
    this.text(c,'270°',x+8,y+101,10,'#c0e8bd');c.restore();
    this.text(c,'APPROACH RADAR',x+109,y+125,8,'#9cbaab','center');
  }
  engineDisplay(c,x,y,j) {
    this.box(c,x-9,y-9,236,132,'#061017','#3d5157',6);
    this.box(c,x,y,218,111,'#071b1c','#41635c',1);
    this.text(c,j.flameout?'ENGINE / FLAMEOUT':'ENGINE / NOMINAL',x+10,y+16,9,j.flameout?'#ff8673':'#a0c8ae');
    for(let i=0;i<2;i++){
      const yy=y+36+i*41,val=i?j.fuel:j.throttle*100;
      this.text(c,i?'FUEL':'THR',x+10,yy+3,10,'#8eae9d');
      this.text(c,Math.round(val)+'%',x+207,yy+3,15,i&&val<20?'#ffc16b':'#d0dfba','right');
      for(let n=0;n<23;n++){c.fillStyle=n<val/100*23?(i?'#b6c778':'#70c2a7'):'#1e3a34';c.fillRect(x+49+n*6,yy+10,4,9);}
    }
    this.text(c,'POWER / ENDURANCE',x+109,y+125,8,'#9cbaab','center');
  }
};
