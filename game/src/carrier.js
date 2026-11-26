'use strict';
NT.Carrier = class CarrierDeck {
  draw(c, jet, t, cinematic = false) {
    const s=NT.clamp(1100/(Math.max(-160,jet.distance)+500),.2,3.25);
    const cx=(cinematic?885:690)-jet.lineup*s*.8-jet.headingError*10;
    const cy=291+104*s+(jet.altitude-jet.idealAltitude)*.15*s+(jet.pitch+3.2)*5.5;
    const P=(x,y)=>[cx+x*s,cy+y*s];
    const poly=(ps,fill,stroke,w=1)=>NT.poly(c,ps.map(p=>P(...p)),fill,stroke,w);
    const line=(x,y,xx,yy,color,w=1)=>{const a=P(x,y),b=P(xx,yy);NT.line(c,...a,...b,color,w*s);};
    const lamp=(x,y,r,color)=>{const p=P(x,y);NT.light(c,...p,r*s,color,10*s);};
    c.save();
    // A broken wake ties the ship to the water, rather than floating in space.
    for(let i=0;i<48;i++) {
      const f=i/48, spread=210+f*260, y=54+f*155;
      const alpha=(1-f)*.18;
      line(-spread,y,-spread+18+f*50,y+2,`rgba(150,194,196,${alpha})`,1+f*2);
      line(spread*.8,y,spread*.8+20+f*30,y+2,`rgba(150,194,196,${alpha})`,1+f*2);
    }
    poly([[-214,16],[-182,68],[120,73],[235,-63],[167,-144],[53,-149]],'#060e17','#365264',1);
    poly([[-182,68],[-174,94],[111,94],[120,73]],'#030910','#203949',1);
    poly([[120,73],[111,94],[222,-48],[235,-63]],'#07121d','#2a4657',1);
    const deck=c.createLinearGradient(cx,cy-160*s,cx,cy+70*s);
    deck.addColorStop(0,'#24303b');deck.addColorStop(.55,'#27333b');deck.addColorStop(1,'#344047');
    poly([[-214,16],[-161,-73],[-57,-155],[138,-155],[184,-125],[235,-63],[120,73],[-150,73]],deck,'#61727a',1.4);
    // Wet non-skid plates catch tiny warm pools from the edge lamps.
    for(let row=0;row<10;row++) {
      const f=row/10,yy=55-f*196;
      line(-153+f*108,yy,110+f*35,yy,'#a9b8af0d',.65);
      for(let col=0;col<7;col++) {
        const x=-134+f*90+col*(32-f*13);
        line(x-1,yy-4,x+1,yy-4,'#a4b3a52a',.6);
      }
    }
    for(let i=0;i<8;i++) {
      const f=i/7,x=-191+f*139,y=18-f*164;
      poly([[x,y],[x+15,y-6],[x+20,y+5],[x+6,y+8]],'#e0a7520a');
    }
    poly([[-176,22],[-59,-141],[40,-141],[79,54]],'#18232c','#aeb8a680',1);
    // Angled landing area. Interpolated deck markings share its perspective.
    const center=f=>[-48+(f*63),52-f*185];
    for(let i=0;i<14;i++) {
      const f=i/14,[x,y]=center(f); const [xx,yy]=center(f+.032);
      line(x,y,xx,yy,'#dfdfc4',2.6*(1-f*.55));
      lamp(x,y,1.4*(1-f*.4),'#e6f5df');
    }
    line(-139,45,-55,-135,'#e7dfbd99',1.2);
    line(47,60,47,-131,'#e7dfbd99',1.2);
    line(73,52,91,-111,'#c29337',1.5);
    line(80,54,100,-110,'#c2933770',.8);
    // Four physical arrestor wires, with the third painted amber at its ends.
    for(let i=0;i<4;i++) {
      const y=31-i*14, left=-133+i*6, right=47;
      line(left,y,right,y-1,'#03070c',3);
      line(left,y-1,right,y-2,i===2?'#cbbd88':'#879797',.9);
      lamp(left-3,y,1.5,i===2?'#ffc15e':'#8ca9a9');
    }
    const wireTag=P(-144,3);c.save();c.translate(...wireTag);c.scale(s,s);
    c.font='bold 10px monospace';c.fillStyle='#d4ba7b';c.textAlign='right';c.fillText('3',0,0);c.restore();
    for(let side=0;side<2;side++) {
      for(let i=0;i<18;i++) {
        const f=i/17;
        const x=side?120+f*50:-192+f*143;
        const y=side?64-f*204:18-f*169;
        lamp(x,y,1.5-f*.6,'#ffbc60');
        if(i%3===0)line(x,y+4,x+3,y+14,'#d9922930',2);
      }
    }
    for(let i=0;i<10;i++)lamp(-149+i*29,72,1.6,'#ffb65b');
    // Bow catapult tracks, deck hatching, parked deck equipment.
    line(100,-40,125,-133,'#81909b66',1.5);
    line(112,-40,134,-133,'#81909b66',1.5);
    for(let i=0;i<9;i++)line(-146+i*12,-61-i*5,-137+i*12,-70-i*5,'#9e9c7d55',1);
    for(let i=0;i<5;i++) {
      const x=119+i*10,y=-95+i*13;
      poly([[x,y],[x+8,y-5],[x+20,y],[x+12,y+4]],'#64717a','#81949b',.5);
      line(x+8,y-5,x+9,y-12,'#99a1a4',1);
    }
    // The island has stacked planes, luminous bridge windows and a radar mast.
    poly([[97,-61],[122,-83],[153,-67],[133,-39]],'#101d29','#66818a',1);
    poly([[97,-61],[97,-113],[133,-103],[133,-39]],'#182a38','#365565',1);
    poly([[133,-103],[153,-119],[153,-67],[133,-39]],'#0b1825','#294454',1);
    poly([[90,-115],[112,-130],[158,-119],[135,-102]],'#3c4c54','#7b8e90',.8);
    poly([[90,-115],[90,-136],[135,-125],[135,-102]],'#142531','#658190',.8);
    poly([[135,-125],[158,-138],[158,-119],[135,-102]],'#0c1925','#375262',.8);
    poly([[90,-136],[112,-149],[158,-138],[135,-125]],'#31424d','#70808b',.8);
    for(let i=0;i<5;i++) {
      const x=95+i*8;poly([[x,-130+(x-95)*.23],[x+5,-129+(x-95)*.23],[x+5,-122+(x-95)*.23],[x,-123+(x-95)*.23]],'#f1c77a');
    }
    for(let i=0;i<3;i++)lamp(139+i*6,-123-i*3,1.2,'#e3b86c');
    line(120,-143,120,-211,'#80979d',1.8);
    line(104,-176,141,-176,'#8d9da3',1);
    line(110,-191,135,-188,'#8d9da3',1.5);
    line(120,-211,129,-202,'#7f939c',1);
    lamp(120,-211,1.8,Math.sin(t*2)>0?'#ff6961':'#9b403c');
    lamp(158,-60,1.6,'#6ff0be');
    // Port-side optical landing system: fixed green datum, moving amber ball.
    poly([[-201,-14],[-201,-54],[-183,-54],[-183,-14]],'#05141a','#506963',.8);
    for(let i=0;i<5;i++)lamp(-192,-48+i*7,1.7,'#42432c');
    for(let i=0;i<3;i++){lamp(-211-i*6,-34,1.3,'#82eab6');lamp(-180+i*6,-34,1.3,'#82eab6');}
    const ball=NT.clamp(jet.glideError/16,-2,2);
    lamp(-192,-34-ball*7,2.8,'#ffbd58');
    // Flight-deck number, aligned with the deck itself.
    c.save();const n=P(116,-16);c.translate(...n);c.rotate(.13);c.scale(s,s*.65);
    c.font='bold 29px monospace';c.fillStyle='#acb9af66';c.fillText('08',0,0);c.restore();
    c.restore();
  }
};
