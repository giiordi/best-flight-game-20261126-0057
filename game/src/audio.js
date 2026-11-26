'use strict';
NT.Audio = class FlightAudio {
  constructor(){this.context=null;this.muted=false;}
  start(){
    if(this.context){this.context.resume().catch(()=>{});return;}
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)return;
    try{
      this.context=new AudioContext();const a=this.context;
      this.master=a.createGain();this.master.gain.value=.22;this.master.connect(a.destination);
      this.engine=a.createOscillator();this.engine.type='sawtooth';this.engine.frequency.value=52;
      const low=a.createBiquadFilter();low.type='lowpass';low.frequency.value=240;
      this.engineGain=a.createGain();this.engineGain.gain.value=.07;
      this.engine.connect(low);low.connect(this.engineGain);this.engineGain.connect(this.master);this.engine.start();
      this.context.resume().catch(()=>{});
    }catch{this.context=null;}
  }
  update(j,active){
    if(!this.context)return;const now=this.context.currentTime;
    this.engine.frequency.setTargetAtTime(39+j.throttle*67,now,.3);
    const volume=active&&!j.flameout&&!this.muted ? .04+j.throttle*.11 : 0;
    this.engineGain.gain.setTargetAtTime(volume,now,.2);
  }
  tone(freq,end,duration,type='sine',volume=.3,delay=0){
    if(!this.context||this.muted)return;
    const a=this.context,t=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(10,end),t+duration);
    g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+duration);
    o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.02);
  }
  noise(duration,volume,lowpass){
    if(!this.context||this.muted)return;const a=this.context,n=a.createBuffer(1,a.sampleRate*duration,a.sampleRate),v=n.getChannelData(0),r=NT.random(311);
    for(let i=0;i<v.length;i++)v[i]=(r()*2-1)*Math.pow(1-i/v.length,1.5);
    const source=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();source.buffer=n;f.type='lowpass';f.frequency.value=lowpass;g.gain.value=volume;
    source.connect(f);f.connect(g);g.connect(this.master);source.start();
  }
  play(name){
    if(name==='click')this.tone(840,600,.07,'sine',.2);
    if(name==='trapped'){this.noise(.35,.8,350);this.tone(210,38,.7,'triangle',.7);this.tone(510,90,1.3,'sine',.22,.07);}
    if(name==='waveoff'){this.tone(310,310,.42,'square',.16);this.tone(249,249,.5,'square',.15,.5);}
    if(name==='bolter'){this.noise(1,.45,1900);this.tone(90,230,1,'sawtooth',.13);}
    if(name==='crashed'){this.noise(1.2,.85,620);this.tone(78,17,1.1,'triangle',.9);}
  }
};
