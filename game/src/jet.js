'use strict';
NT.SORTIES = [
  {name:'Calm',wind:1.4,gust:1.1,fuel:100,brief:'A quiet deck. Learn the ball. Catch wire three.'},
  {name:'Crosswind',wind:8,gust:4.2,fuel:100,brief:'Wind from port. Bank into it, then level for the trap.'},
  {name:'Low fuel',wind:-6,gust:7,fuel:50,brief:'Half tanks. Strong gusts. Every throttle correction counts.'}
];
NT.Jet = class FlightModel {
  constructor(sortie=0, seed=1) {
    this.sortie=sortie;this.seed=seed;this.condition=NT.SORTIES[sortie];
    this.distance=4630;this.altitude=800;this.speed=140;this.throttle=.58;
    this.pitch=-3.2;this.bank=0;this.headingError=0;this.lineup=0;
    this.fuel=this.condition.fuel;this.brake=false;this.vsi=-690;this.wind=0;
    this.time=0;this.flameout=false;this.touchdown=null;this.previousAltitude=800;
    this.updateGuidance();
  }
  updateGuidance() {
    // An eight-foot hook-to-eye margin puts a trimmed approach on wire three.
    this.idealAltitude=68+Math.max(0,this.distance)*.1581;
    this.glideError=this.altitude-this.idealAltitude;
    this.aoa=8.1+(140-this.speed)*.15+Math.max(0,this.pitch+3.2)*.25;
    this.heading=(360+270+this.headingError)%360;
  }
  update(dt, keys, mouse=null) {
    this.time+=dt;
    const axis=(plus,minus)=>(keys.has(plus)?1:0)-(keys.has(minus)?1:0);
    const power=axis('KeyW','KeyS')+axis('ShiftLeft','ControlLeft')+axis('ShiftRight','ControlRight');
    this.throttle=NT.clamp(this.throttle+power*dt*.22,0,1);
    const pitchInput=axis('ArrowDown','ArrowUp');
    // Stick release holds pitch trim; bank gently returns to wings level.
    this.pitch=NT.clamp(this.pitch-pitchInput*dt*2.1+(mouse?mouse.y*dt*2:0),-11,7);
    const roll=axis('ArrowRight','ArrowLeft')+(mouse?mouse.x:0);
    this.bank+= (roll*25-this.bank)*Math.min(1,dt*2.3);
    this.fuel=Math.max(0,this.fuel-dt*(.12+this.throttle*this.throttle*1.05));
    this.flameout=this.fuel<=0;
    const target=this.flameout?68:94+this.throttle*79-(this.brake?25:0)-Math.max(-3,this.pitch+3.2)*1.4;
    this.speed+=(target-this.speed)*dt*.22;
    this.speed=NT.clamp(this.speed,50,220);
    const phase=this.seed*.731;
    const gust=(Math.sin(this.time*.39+phase)*.55+Math.sin(this.time*1.13+phase*2)*.3+Math.sin(this.time*2.2+phase)*.15)*this.condition.gust;
    this.wind=this.condition.wind+gust;
    this.headingError=NT.clamp(this.headingError+this.bank*dt*.12,-35,35);
    const ms=this.speed*.514444;
    this.lineup+=(Math.sin(this.headingError*Math.PI/180)*ms+this.wind*.51444)*dt;
    this.distance-=Math.max(15,ms*Math.cos(this.headingError*Math.PI/180))*dt;
    const descent=ms*Math.tan(this.pitch*Math.PI/180)*2.828;
    const stall=Math.max(0,115-this.speed)*.43;
    const sink=descent-stall-(this.flameout?2.2:0);
    this.vsi+=(sink*60-this.vsi)*Math.min(1,dt*3);
    this.previousAltitude=this.altitude;this.altitude+=sink*dt;
    this.updateGuidance();
    if(this.touchdown)return this.touchdown;
    if(this.altitude<=5) {
      return this.finish('crashed','DITCHED IN THE SEA');
    }
    if(this.distance>0&&this.distance<110&&this.altitude<58&&Math.abs(this.lineup)<80) {
      return this.finish('crashed','RAMP STRIKE — BELOW THE BALL');
    }
    // The stern is distance zero; four wires lie 20 m apart on the deck.
    if(this.distance<=0 && this.altitude<=60) {
      if(Math.abs(this.lineup)>58)return this.finish('crashed','MISSED THE FLIGHT DECK');
      if(this.speed>169||this.vsi< -1080||Math.abs(this.bank)>19||this.speed<103) {
        return this.finish('crashed',this.speed>169?'TOO FAST AT TOUCHDOWN':this.speed<103?'STALL AT THE RAMP':'HARD DECK IMPACT');
      }
      const travel=-this.distance;
      const wire=1+Math.round((travel-8)/20);
      if(wire>=1&&wire<=4&&Math.abs(this.lineup)<29&&Math.abs(this.headingError)<11) {
        const accuracy=NT.clamp(100-Math.abs(this.glideError)*.7-Math.abs(this.lineup)*1.2-Math.abs(this.speed-140)*1.7,0,100);
        const wireBonus=[0,100,180,300,140][wire];
        return this.finish('trapped','WIRE '+wire+' CAUGHT',{wire,accuracy,points:Math.round(accuracy*7+wireBonus),speed:this.speed,lineup:this.lineup,glide:this.glideError,sink:this.vsi});
      }
      return this.finish('bolter','NO WIRE — ADD POWER');
    }
    if(this.distance< -105)return this.finish('bolter','HIGH OVER THE WIRES');
    return null;
  }
  finish(type,reason,extra={}) { this.touchdown={type,reason,...extra};return this.touchdown; }
};
