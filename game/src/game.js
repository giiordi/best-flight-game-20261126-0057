'use strict';
NT.Game = class CarrierLandingGame {
  constructor() {
    this.canvas=document.getElementById('cockpit');this.c=this.canvas.getContext('2d',{alpha:false});
    const params=new URLSearchParams(location.search), raw=Number(params.get('seed')||8);
    this.seed=Number.isFinite(raw)?raw>>>0:8;this.shot=params.get('shot');
    this.keys=new Set();this.mouse={x:0,y:0};this.mouseFlight=false;
    this.sea=new NT.Sea(this.seed);this.carrier=new NT.Carrier();this.instruments=new NT.Instruments();this.audio=new NT.Audio();
    this.state='title';this.sortie=0;this.total=0;this.best=0;this.records=[];this.penalty=0;this.attempts=0;
    this.paused=false;this.stateTime=0;this.clock=0;this.last=0;this.accumulator=0;this.buttons=[];
    try{this.best=Math.max(0,Number(localStorage.getItem('night-trap-best'))||0);}catch{}
    this.jet=new NT.Jet(0,this.seed);this.setScenicApproach();
    if(this.shot==='start'){this.clock=37;this.frozen=true;}
    if(this.shot==='play'){this.state='approach';this.clock=37;this.frozen=true;}
    if(this.shot==='end'){
      this.state='debrief';this.frozen=true;this.clock=37;
      this.records=[{name:'Calm',grade:'S',points:962,wire:3,speed:141,lineup:2,glide:3,reason:'PRECISE RECOVERY'},
        {name:'Crosswind',grade:'A',points:847,wire:3,speed:143,lineup:8,glide:12,reason:'CLEAN TRAP'},
        {name:'Low fuel',grade:'B',points:723,wire:2,speed:137,lineup:12,glide:-17,reason:'SAFE ABOARD'}];
      this.total=2532;
    }
    this.bindInput();requestAnimationFrame(t=>this.frame(t));
  }
  setScenicApproach(){
    this.jet.distance=780;this.jet.altitude=68+780*.1581;this.jet.pitch=-3.2;
    this.jet.fuel=72;this.jet.vsi=-684;this.jet.wind=this.jet.condition.wind;this.jet.updateGuidance();
  }
  gesture(){this.audio.start();this.canvas.focus({preventScroll:true});}
  bindInput(){
    addEventListener('keydown',e=>{
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter','ShiftLeft','ShiftRight','ControlLeft','ControlRight'].includes(e.code))e.preventDefault();
      this.gesture();this.keys.add(e.code);if(e.repeat)return;
      if(e.code==='Enter'||e.code==='Space')this.primaryAction();
      if(e.code==='KeyP'&&this.state!=='title'&&this.state!=='debrief'){this.paused=!this.paused;this.audio.play('click');}
      if(e.code==='KeyR')this.restart();
      if(e.code==='KeyB'&&this.state==='approach'&&!this.paused){this.jet.brake=!this.jet.brake;this.audio.play('click');this.frozen=false;}
      if(e.code==='KeyX'&&this.state==='approach'&&!this.paused)this.waveOff();
      if(e.code==='KeyM'){this.mouseFlight=!this.mouseFlight;this.mouse={x:0,y:0};}
      if(e.code==='KeyV'){this.audio.muted=!this.audio.muted;}
      if(this.state==='approach'&&!['Enter','Space','KeyP'].includes(e.code))this.frozen=false;
    });
    addEventListener('keyup',e=>this.keys.delete(e.code));
    addEventListener('blur',()=>{this.keys.clear();if(this.state==='approach'&&!this.frozen)this.paused=true;});
    this.canvas.addEventListener('pointermove',e=>{
      const p=this.position(e);this.mouse.x=NT.clamp((p.x-640)/260,-1,1);this.mouse.y=NT.clamp((310-p.y)/180,-1,1);
      this.hover=p;
    });
    this.canvas.addEventListener('pointerleave',()=>{this.mouse={x:0,y:0};this.hover=null;});
    this.canvas.addEventListener('pointerdown',e=>{
      this.gesture();const p=this.position(e),button=this.buttons.find(b=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h);
      if(button){this.audio.play('click');button.action();return;}
      if(this.state==='title'||this.state==='debrief'||this.paused||this.state!=='approach')this.primaryAction();
      else if(this.frozen)this.frozen=false;
    });
    this.canvas.addEventListener('wheel',e=>{
      e.preventDefault();this.gesture();if(this.state!=='approach'||this.paused)return;
      this.jet.throttle=NT.clamp(this.jet.throttle-Math.sign(e.deltaY)*.025,0,1);this.frozen=false;
    },{passive:false});
  }
  position(e){const b=this.canvas.getBoundingClientRect();return{x:(e.clientX-b.left)*1280/b.width,y:(e.clientY-b.top)*720/b.height};}
  primaryAction(){
    if(this.state==='title'||this.state==='debrief'){this.restart();return;}
    if(this.paused){this.paused=false;return;}
    if(this.state==='approach'){this.frozen=false;return;}
    this.advance();
  }
  restart(){
    this.sortie=0;this.total=0;this.records=[];this.penalty=0;this.attempts=0;this.frozen=false;this.paused=false;
    this.launch();this.audio.play('click');
  }
  launch(fuel){
    this.jet=new NT.Jet(this.sortie,this.seed+this.sortie*71+this.attempts*19);
    if(fuel!==undefined)this.jet.fuel=Math.max(0,fuel);
    this.state='approach';this.stateTime=0;this.keys.clear();this.mouse={x:0,y:0};
  }
  waveOff(){
    this.frozen=false;if(this.jet.flameout){this.outcome({type:'crashed',reason:'NO POWER FOR A GO-AROUND'});return;}
    this.penalty+=60;this.total-=60;this.attempts++;this.state='waveoff';this.stateTime=0;this.audio.play('waveoff');
  }
  outcome(result){
    this.state=result.type;this.stateTime=0;this.result=result;this.audio.play(result.type);
    if(result.type==='bolter'){this.penalty+=110;this.total-=110;this.attempts++;return;}
    const points=result.type==='trapped'?result.points:0;
    const net=Math.max(0,points-this.penalty);
    const grade=net>=930?'S':net>=800?'A':net>=630?'B':'C';
    this.total+=points;
    this.records.push({name:NT.SORTIES[this.sortie].name,grade,points:net,wire:result.wire||0,speed:result.speed||this.jet.speed,lineup:result.lineup??this.jet.lineup,glide:result.glide??this.jet.glideError,reason:result.reason});
    this.total=this.records.reduce((sum,record)=>sum+record.points,0);
  }
  advance(){
    if(this.state==='bolter'||this.state==='waveoff'){
      const remaining=this.jet.fuel-3;
      if(remaining<=0){this.outcome({type:'crashed',reason:'FUEL EXHAUSTED DURING GO-AROUND'});return;}
      this.launch(remaining);return;
    }
    if(this.sortie<2){this.sortie++;this.penalty=0;this.attempts=0;this.launch();}
    else{
      this.state='debrief';this.stateTime=0;
      this.total=Math.max(0,this.total);
      this.best=Math.max(this.best,this.total);try{localStorage.setItem('night-trap-best',String(this.best));}catch{}
    }
  }
  update(dt){
    if(this.paused||this.frozen)return;
    this.clock+=dt;this.stateTime+=dt;
    if(this.state==='approach'){
      const result=this.jet.update(dt,this.keys,this.mouseFlight?this.mouse:null);
      if(result)this.outcome(result);
    }else if(['bolter','waveoff','trapped','crashed'].includes(this.state)){
      if(this.state==='waveoff'||this.state==='bolter'){
        this.jet.pitch+=(5-this.jet.pitch)*dt*.7;this.jet.altitude+=dt*18;this.jet.distance-=dt*65;
        this.jet.bank*=Math.max(0,1-dt);
      }
      if(this.state==='trapped'){this.jet.speed*=Math.max(0,1-dt*2);this.jet.bank*=Math.max(0,1-dt*4);}
      if(this.stateTime>4.5)this.advance();
    }
  }
  frame(timestamp){
    const dt=Math.min(.1,(timestamp-(this.last||timestamp))/1000);this.last=timestamp;
    this.accumulator+=dt;
    while(this.accumulator>=1/60){this.update(1/60);this.accumulator-=1/60;}
    this.audio.update(this.jet,this.state==='approach'&&!this.paused&&!this.frozen);
    this.render();requestAnimationFrame(t=>this.frame(t));
  }
  button(x,y,w,h,label,action,accent=true){
    const c=this.c,u=this.instruments,hover=this.hover&&this.hover.x>=x&&this.hover.x<=x+w&&this.hover.y>=y&&this.hover.y<=y+h;
    u.box(c,x,y,w,h,accent?(hover?'#ffe1a0':'#efc179'):(hover?'#25453f':'#102923'),accent?'#fff0ba':'#5c8b78',3);
    u.text(c,label,x+w/2,y+h/2+5,13,accent?'#14202a':'#bed6b9','center');this.buttons.push({x,y,w,h,action});
  }
  render(){
    const c=this.c,j=this.jet,u=this.instruments;this.buttons=[];
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,1280,720);
    c.save();c.translate(640,300);c.rotate(-j.bank*Math.PI/180*.23);c.translate(-640,-300);
    this.sea.draw(c,j,this.clock);this.carrier.draw(c,j,this.clock,this.state==='title');c.restore();
    // Subtle lens shading leaves the moon, deck and glass in one night palette.
    const vignette=c.createRadialGradient(640,320,220,640,320,750);
    vignette.addColorStop(0,'#02071100');vignette.addColorStop(1,'#020711b0');c.fillStyle=vignette;c.fillRect(0,0,1280,720);
    if(this.state!=='title'&&this.state!=='debrief')u.hud(c,j,this);
    u.panel(c,j,this);
    if(this.state==='title')this.title();
    else if(this.state==='debrief')this.debrief();
    else {
      this.button(1122,84,119,18,this.paused?'RESUME [P]':'PAUSE [P]',()=>{this.paused=!this.paused;},false);
      if(this.state==='approach'){
        if(this.stateTime<9&&!this.frozen){
          u.box(c,30,175,225,83,'#07131cba','#31545b',3);
          u.text(c,'MARSHAL / FINAL APPROACH',43,195,9,u.amber);
          u.text(c,'140 KT • BALL CENTERED',43,217,12,'#d1dfce');
          u.text(c,'Fly the nose. Trim the power.',43,240,10,'#91aaa8');
        }
        u.text(c,this.mouseFlight?'MOUSE STICK ON • M TO RELEASE':'↑↓ PITCH   ←→ BANK   W/S THROTTLE',640,506,9,'#98b8ab','center');
        if(this.jet.fuel<15)u.text(c,'BINGO FUEL / '+Math.ceil(this.jet.fuel)+'%',1125,177,12,'#ffb06e','center');
      }else this.outcomeOverlay();
      if(this.paused)this.pauseOverlay();
    }
    if(this.state==='crashed'){
      const a=NT.clamp(1-this.stateTime*.5,0,1)*.45;c.fillStyle=`rgba(207,71,41,${a})`;c.fillRect(0,0,1280,720);
    }
  }
  title(){
    const c=this.c,u=this.instruments;
    const shade=c.createLinearGradient(0,0,830,0);shade.addColorStop(0,'#040d19f2');shade.addColorStop(.64,'#05101cda');shade.addColorStop(1,'#05101c00');
    c.fillStyle=shade;c.fillRect(0,0,840,505);
    NT.line(c,76,83,124,83,u.amber,2);
    u.text(c,'NIGHT RECOVERY / NORTH ATLANTIC',139,87,10,'#a7c0bd');
    c.font='800 79px sans-serif';c.textAlign='left';c.fillStyle='#f0ead8';c.fillText('NIGHT TRAP',70,185);
    c.font='300 31px sans-serif';c.fillStyle='#93c7c6';c.fillText('CARRIER LANDING',76,228);
    u.text(c,'A short deck. A dark ocean. One perfect wire.',78,270,14,'#c5cec1');
    u.text(c,'Fly the ball. Hold 140 knots. Bring it home.',78,295,12,'#87aaa8');
    const labels=['01  CALM','02  CROSSWIND','03  LOW FUEL'];
    labels.forEach((label,i)=>{u.box(c,77+i*151,321,140,32,'#15232b9c','#395157',2);u.text(c,label,147+i*151,341,10,i===0?u.amber:'#9ab8b1','center');});
    this.button(77,379,288,51,'BEGIN APPROACH   ↵',()=>this.restart());
    u.text(c,'ENTER / CLICK TO FLY',387,409,9,'#829f9c');
    u.text(c,'↑↓ PITCH   ←→ BANK   W/S THROTTLE',78,459,10,'#adc4b7');
    u.text(c,'B BRAKE   X WAVE OFF   P PAUSE   R RESTART',78,480,9,'#7f9c95');
    u.text(c,'NIGHT QUALIFICATION',1226,38,10,u.amber,'right');
    u.text(c,'3 SORTIES / 4 WIRES / NO SECOND OCEAN',1226,57,8,'#8aa9a6','right');
    u.text(c,'CVN 08 / LANTERN',1090,466,11,'#c7c9af','right');
    u.text(c,'DECK OPEN • BRC 270°',1090,484,9,'#82bdab','right');
  }
  outcomeOverlay(){
    const c=this.c,u=this.instruments;
    const words={trapped:['ARRESTED','WELCOME ABOARD'],bolter:['BOLTER','FULL POWER. FLY THE DECK.'],waveoff:['WAVE OFF','CLIMB. RESET. TRY AGAIN.'],crashed:['SORTIE LOST','THE OCEAN KEEPS NO SCORE.']};
    const pair=words[this.state]||['',''];u.box(c,387,175,506,195,'#06121beb','#688071',5);
    u.text(c,pair[0],640,224,36,this.state==='crashed'?'#ed987c':u.amber,'center','sans-serif');
    u.text(c,pair[1],640,253,11,'#c4d4c1','center');
    const detail=this.state==='trapped'?`WIRE ${this.result.wire}  /  ${this.result.points} POINTS`:this.state==='waveoff'?'−60 POINTS / SAME SORTIE':this.result?.reason||'';
    u.text(c,detail,640,281,13,u.cyan,'center');
    this.button(512,306,256,36,this.state==='bolter'||this.state==='waveoff'?'RETRY APPROACH   ↵':this.sortie===2?'VIEW DEBRIEF   ↵':'NEXT SORTIE   ↵',()=>this.advance(),false);
  }
  pauseOverlay(){
    const c=this.c,u=this.instruments;c.fillStyle='#020812b0';c.fillRect(0,0,1280,720);
    u.box(c,430,190,420,255,'#091a24','#577c77',5);
    u.text(c,'HOLDING PATTERN',640,234,25,'#eee5ce','center','sans-serif');
    ['↑ / ↓  pitch     ← / →  bank','W / S or Shift / Ctrl  throttle','B  speedbrake    X  wave off','M  mouse stick   Wheel  throttle','V  mute audio    R  restart'].forEach((s,i)=>u.text(c,s,640,267+i*23,11,'#9fc3b7','center'));
    this.button(511,393,258,33,'RESUME FLIGHT   P',()=>{this.paused=false;},true);
  }
  debrief(){
    const c=this.c,u=this.instruments;c.fillStyle='#020a13b0';c.fillRect(0,0,1280,535);
    u.box(c,94,72,1092,436,'#091822f2','#486366',6);
    NT.line(c,126,109,164,109,u.amber,2);u.text(c,'NIGHT QUALIFICATION / DEBRIEF',178,113,11,'#a9bfb3');
    u.text(c,'BACK FROM THE DARK.',126,162,33,'#f0e6d2','left','sans-serif');
    const traps=this.records.filter(r=>r.wire).length;
    u.text(c,`${traps} OF 3 AIRCRAFT RECOVERIES  /  CVN 08 LANTERN`,128,189,10,'#8ea9a3');
    u.text(c,String(Math.max(0,this.total)).padStart(4,'0'),1146,158,48,u.amber,'right','sans-serif');
    u.text(c,'TOTAL SCORE',1143,182,10,'#91aba4','right');
    const cols=[131,416,557,732,900,1129];
    ['SORTIE','WIRE','AIRSPEED','LINEUP','GRADE','POINTS'].forEach((label,i)=>u.text(c,label,cols[i],226,9,'#718f8b',i===5?'right':'left'));
    NT.line(c,126,239,1150,239,'#4d706350');
    this.records.forEach((r,i)=>{
      const y=273+i*61;
      u.text(c,'0'+(i+1),131,y,12,u.amber);u.text(c,r.name.toUpperCase(),164,y,14,'#c8d7c4');
      u.text(c,r.wire?'0'+r.wire:'—',429,y,16,'#b6dbbe');
      u.text(c,Math.round(r.speed)+' KT',557,y,13,'#a9c5b6');
      u.text(c,Math.abs(r.lineup).toFixed(0)+' M',732,y,13,'#a9c5b6');
      u.box(c,894,y-23,37,33,'#18342f','#598b72',3);u.text(c,r.grade,912,y+1,23,r.grade==='S'?u.amber:'#b4e5bf','center');
      u.text(c,String(r.points).padStart(3,'0'),1129,y,19,'#e5dec2','right');
      u.text(c,r.reason,164,y+19,8,'#708e88');NT.line(c,126,y+30,1150,y+30,'#4d706329');
    });
    this.button(128,447,252,39,'FLY ANOTHER NIGHT   ↵',()=>this.restart());
    u.text(c,'BEST '+Math.max(this.best,this.total).toString().padStart(4,'0'),1144,461,14,u.amber,'right');
    u.text(c,'WIRE THREE IS ALWAYS WAITING.',1144,481,8,'#7da296','right');
  }
};
NT.game=new NT.Game();
