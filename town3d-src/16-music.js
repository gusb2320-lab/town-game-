// Hallowmere's score: composed, not generated. A small synth rig (harpsichord, lute, recorder, fiddle, choir,
// strings, brass, bells, music box, drums) played through reverb, delay and a compressor, so it sounds like
// a big retro game intro rather than bare beeps. Only used in the Halloween edition.
const HQ = {on:false, name:null, timer:null};
const NOTE = (() => { const map = {C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11}; return s => { const m = /^([A-G][#b]?)(-?\d)$/.exec(s); return m ? 12*(+m[2]+1) + map[m[1]] : null; }; })();
const hz = m => 440*Math.pow(2,(m-69)/12);
function hqInit(){
  const ac = Snd.ac; if (!ac) return false;
  if (HQ.out) return true;
  const dest = Snd.nodes.mus;
  HQ.out = ac.createGain(); HQ.out.gain.value = 1.15;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .25;
  const dry = ac.createGain(); dry.gain.value = .85;
  const conv = ac.createConvolver(); conv.buffer = impulse(ac, 3.6, 2.4);
  const wet = ac.createGain(); wet.gain.value = .42;
  const del = ac.createDelay(1.5); del.delayTime.value = .42; const fb = ac.createGain(); fb.gain.value = .3; const dlp = ac.createBiquadFilter(); dlp.type = "lowpass"; dlp.frequency.value = 2400;
  const delIn = ac.createGain(); delIn.gain.value = .22;
  HQ.out.connect(dry); dry.connect(comp);
  HQ.out.connect(conv); conv.connect(wet); wet.connect(comp);
  HQ.out.connect(delIn); delIn.connect(del); del.connect(dlp); dlp.connect(fb); fb.connect(del); dlp.connect(wet);
  comp.connect(dest);
  HQ.ac = ac; HQ.del = del; HQ.comp = comp;
  return true;
}
function impulse(ac, secs, decay){
  const len = Math.floor(ac.sampleRate*secs), buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch=0; ch<2; ch++){ const d = buf.getChannelData(ch); for (let i=0;i<len;i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, decay) * (i < 200 ? i/200 : 1); }
  return buf;
}
// ---------- instruments ----------
function env(g, t, a, peak, d, sus, rel, end){ const p = g.gain; p.setValueAtTime(.0001, t); p.exponentialRampToValueAtTime(Math.max(.0002,peak), t+a); p.exponentialRampToValueAtTime(Math.max(.0002, peak*sus), t+a+d); p.setValueAtTime(Math.max(.0002, peak*sus), end); p.exponentialRampToValueAtTime(.0001, end+rel); }
function osc(type, f, t, end, detune=0){ const o = HQ.ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune; o.start(t); o.stop(end+.05); return o; }
function filt(type, f, q=1){ const b = HQ.ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
function vib(o, t, rate, depth, delay=.15){ const l = HQ.ac.createOscillator(), g = HQ.ac.createGain(); l.frequency.value = rate; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(depth, t+delay+.2); l.connect(g); g.connect(o.frequency); l.start(t); l.stop(t+8); }
const INST = {
  harpsi(t, m, dur, v){ const f = hz(m), end = t+.05, g = HQ.ac.createGain(), lp = filt("lowpass", 5200, .7); lp.frequency.setValueAtTime(5200, t); lp.frequency.exponentialRampToValueAtTime(900, t+.6);
    for (const [ty, dt] of [["sawtooth", -4], ["square", 5]]) osc(ty, f, t, t+1.6, dt).connect(lp);
    lp.connect(g); g.connect(HQ.out); const p = g.gain; p.setValueAtTime(.0001,t); p.exponentialRampToValueAtTime(.09*v, t+.004); p.exponentialRampToValueAtTime(.0001, t+1.5); },
  lute(t, m, dur, v){ const f = hz(m), g = HQ.ac.createGain(), lp = filt("lowpass", 2600, 1.2); lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(700, t+.5);
    osc("triangle", f, t, t+1.2).connect(lp); osc("sawtooth", f*2, t, t+.4, 3).connect(lp); lp.connect(g); g.connect(HQ.out);
    const p = g.gain; p.setValueAtTime(.0001,t); p.exponentialRampToValueAtTime(.11*v, t+.005); p.exponentialRampToValueAtTime(.0001, t+1.1); },
  flute(t, m, dur, v){ const f = hz(m), end = t+dur, g = HQ.ac.createGain(), lp = filt("lowpass", 3200); const o = osc("sine", f, t, end+.3); vib(o, t, 5.2, f*.012); o.connect(lp); const o2 = osc("triangle", f*2, t, end+.3); const g2 = HQ.ac.createGain(); g2.gain.value = .18; o2.connect(g2); g2.connect(lp);
    lp.connect(g); g.connect(HQ.out); env(g, t, .04, .11*v, .1, .8, .18, end); },
  lead(t, m, dur, v){ const f = hz(m), end = t+dur, g = HQ.ac.createGain(), lp = filt("lowpass", 3400); const o = osc("square", f, t, end+.3); vib(o, t, 5.6, f*.014, .2); const o2 = osc("square", f, t, end+.3, 9); const g2 = HQ.ac.createGain(); g2.gain.value = .5; o.connect(lp); o2.connect(g2); g2.connect(lp);
    lp.connect(g); g.connect(HQ.out); env(g, t, .01, .06*v, .15, .75, .2, end); },
  fiddle(t, m, dur, v){ const f = hz(m), end = t+dur, g = HQ.ac.createGain(), bp = filt("bandpass", 1800, .6), lp = filt("lowpass", 4200); const o = osc("sawtooth", f, t, end+.3); vib(o, t, 6, f*.01, .1); o.connect(bp); bp.connect(lp); osc("sawtooth", f, t, end+.3, 7).connect(lp);
    lp.connect(g); g.connect(HQ.out); env(g, t, .03, .06*v, .08, .7, .12, end); },
  choir(t, m, dur, v){ const f = hz(m), end = t+dur, g = HQ.ac.createGain(), sum = HQ.ac.createGain(); sum.gain.value = .5;
    for (const dt of [-9, 0, 8]){ const o = osc("sawtooth", f, t, end+1, dt); vib(o, t, 4.6+Math.random(), f*.006, .3); o.connect(sum); }
    for (const [ff, q, gg] of [[700, 6, 1], [1150, 7, .7], [2600, 9, .35]]){ const b = filt("bandpass", ff, q), bg = HQ.ac.createGain(); bg.gain.value = gg; sum.connect(b); b.connect(bg); bg.connect(g); }
    g.connect(HQ.out); env(g, t, .5, .16*v, .3, .85, 1.2, end); },
  oo(t, m, dur, v){ const f = hz(m), end = t+dur, g = HQ.ac.createGain(), sum = HQ.ac.createGain(); sum.gain.value = .6;
    for (const dt of [-6, 6]){ const o = osc("triangle", f, t, end+1.5, dt); vib(o, t, 4.2, f*.008, .4); o.connect(sum); }
    const b = filt("bandpass", 420, 3); sum.connect(b); b.connect(g); const lp = filt("lowpass", 900); sum.connect(lp); lp.connect(g);
    g.connect(HQ.out); env(g, t, .9, .2*v, .4, .9, 1.6, end); },
  strings(t, m, dur, v){ const f = hz(m), end = t+dur, g = HQ.ac.createGain(), lp = filt("lowpass", 1600, .8);
    for (const dt of [-7, 7]){ const o = osc("sawtooth", f, t, end+.4, dt); vib(o, t, 5.5, f*.005, .25); o.connect(lp); }
    lp.connect(g); g.connect(HQ.out); env(g, t, .08, .07*v, .1, .85, .25, end); },
  stab(t, m, dur, v){ const f = hz(m), g = HQ.ac.createGain(), lp = filt("lowpass", 2000); for (const dt of [-10, 0, 10]) osc("sawtooth", f, t, t+.5, dt).connect(lp); lp.connect(g); g.connect(HQ.out); const p = g.gain; p.setValueAtTime(.0001,t); p.exponentialRampToValueAtTime(.08*v, t+.01); p.exponentialRampToValueAtTime(.0001, t+.45); },
  brass(t, m, dur, v){ const f = hz(m), end = t+dur, g = HQ.ac.createGain(), lp = filt("lowpass", 600, 2); lp.frequency.setValueAtTime(600, t); lp.frequency.exponentialRampToValueAtTime(2600, t+.08); lp.frequency.exponentialRampToValueAtTime(1500, t+.4);
    for (const dt of [-6, 6]) osc("sawtooth", f, t, end+.3, dt).connect(lp); lp.connect(g); g.connect(HQ.out); env(g, t, .03, .085*v, .15, .7, .15, end); },
  bass(t, m, dur, v){ const f = hz(m), end = t+dur, g = HQ.ac.createGain(), lp = filt("lowpass", 700); osc("triangle", f, t, end+.2).connect(lp); osc("sine", f/2, t, end+.2).connect(lp); osc("sawtooth", f, t, end+.2, 4).connect(filt("lowpass", 400)).connect(lp);
    lp.connect(g); g.connect(HQ.out); env(g, t, .01, .16*v, .2, .6, .12, end); },
  drone(t, m, dur, v){ const f = hz(m), end = t+dur, g = HQ.ac.createGain(), lp = filt("lowpass", 300, 4); const l = HQ.ac.createOscillator(), lg = HQ.ac.createGain(); l.frequency.value = .09; lg.gain.value = 180; l.connect(lg); lg.connect(lp.frequency); l.start(t); l.stop(end+2);
    for (const dt of [-5, 5]) osc("sawtooth", f, t, end+2, dt).connect(lp); lp.connect(g); g.connect(HQ.out); env(g, t, 1.5, .12*v, .5, .9, 2, end); },
  bell(t, m, dur, v){ const f = hz(m); for (const [r, a, d] of [[1, .12, 4], [2.76, .05, 2], [5.4, .03, 1.2], [8.93, .015, .6], [.5, .05, 5]]){ const g = HQ.ac.createGain(); osc("sine", f*r, t, t+d).connect(g); g.connect(HQ.out); const p = g.gain; p.setValueAtTime(.0001,t); p.exponentialRampToValueAtTime(a*v, t+.005); p.exponentialRampToValueAtTime(.0001, t+d); } },
  musicbox(t, m, dur, v){ const f = hz(m); for (const [r, a, d] of [[1, .09, 1.8], [4, .02, .4], [2, .025, .9]]){ const g = HQ.ac.createGain(); osc("sine", f*r, t, t+d).connect(g); g.connect(HQ.out); const p = g.gain; p.setValueAtTime(.0001,t); p.exponentialRampToValueAtTime(a*v, t+.002); p.exponentialRampToValueAtTime(.0001, t+d); } },
  kick(t, m, dur, v){ const g = HQ.ac.createGain(), o = osc("sine", 120, t, t+.4); o.frequency.exponentialRampToValueAtTime(38, t+.16); o.connect(g); g.connect(HQ.out); const p = g.gain; p.setValueAtTime(.0001,t); p.exponentialRampToValueAtTime(.45*v, t+.004); p.exponentialRampToValueAtTime(.0001, t+.38); },
  snare(t, m, dur, v){ noiseHit(t, "bandpass", 1800, .7, .2, .22*v); const g = HQ.ac.createGain(), o = osc("triangle", 190, t, t+.15); o.frequency.exponentialRampToValueAtTime(120, t+.1); o.connect(g); g.connect(HQ.out); const p = g.gain; p.setValueAtTime(.0001,t); p.exponentialRampToValueAtTime(.12*v, t+.003); p.exponentialRampToValueAtTime(.0001, t+.13); },
  hat(t, m, dur, v){ noiseHit(t, "highpass", 7000, .7, .05, .05*v); },
  shaker(t, m, dur, v){ noiseHit(t, "bandpass", 5000, 1.5, .08, .04*v); },
  frame(t, m, dur, v){ const g = HQ.ac.createGain(), o = osc("sine", 95, t, t+.5); o.frequency.exponentialRampToValueAtTime(62, t+.3); o.connect(g); g.connect(HQ.out); const p = g.gain; p.setValueAtTime(.0001,t); p.exponentialRampToValueAtTime(.32*v, t+.005); p.exponentialRampToValueAtTime(.0001, t+.45); noiseHit(t, "bandpass", 400, 2, .12, .08*v); },
  tom(t, m, dur, v){ const g = HQ.ac.createGain(), o = osc("sine", 140, t, t+.6); o.frequency.exponentialRampToValueAtTime(70, t+.4); o.connect(g); g.connect(HQ.out); const p = g.gain; p.setValueAtTime(.0001,t); p.exponentialRampToValueAtTime(.3*v, t+.005); p.exponentialRampToValueAtTime(.0001, t+.55); }
};
function noiseHit(t, type, f, q, dur, vol){ const s = HQ.ac.createBufferSource(); s.buffer = Snd.nodes.noiseBuf; const b = filt(type, f, q), g = HQ.ac.createGain(); s.connect(b); b.connect(g); g.connect(HQ.out); const p = g.gain; p.setValueAtTime(.0001,t); p.exponentialRampToValueAtTime(vol, t+.003); p.exponentialRampToValueAtTime(.0001, t+dur); s.start(t, Math.random()*1.5); s.stop(t+dur+.05); }

// ---------- the compositions ----------
const HCH = {Dm:["D3","F3","A3"], Bb:["Bb2","D3","F3"], Gm:["G2","Bb2","D3"], A:["A2","C#3","E3"], A7:["A2","C#3","G3"], F:["F2","A2","C3"], C:["C3","E3","G3"], Am:["A2","C3","E3"], G:["G2","B2","D3"], Bbmaj7:["Bb2","D3","F3","A3"], Gm9:["G2","Bb2","D3","A3"], A7b9:["A2","C#3","G3","Bb3"], Eb:["Eb3","G3","Bb3"]};
const chordM = c => HCH[c].map(NOTE);
// a melody line: one token per step; "-" holds, "." rests
function line(str){ const toks = str.trim().split(/\s+/), out = []; for (let i=0;i<toks.length;i++){ const tk = toks[i]; if (tk==="." || tk==="-" || tk==="|") continue; let len = 1; while (toks[i+len]==="-") len++; out.push([i, NOTE(tk), len]); } return out; }
const lineSteps = str => str.trim().split(/\s+/).filter(t=>t!=="|").length;
function seqLine(str){ const toks = str.trim().split(/\s+/).filter(t=>t!=="|"); return line(toks.join(" ")); }
const SONGS = {
  title:{bpm:84, spb:2, bar:6, chords:"Dm Dm Bb Bb Gm Gm A A7 Dm Dm F C Bb Gm A A",
    lead:{inst:"lead", v:1, notes:"D5 - - F5 E5 D5 | A4 - - - - . | Bb4 - C5 D5 - F5 | E5 - - D5 - . | G5 - F5 E5 - D5 | C#5 - - A4 - . | Bb4 - A4 G4 - E4 | A4 - - - - . | D5 - - F5 A5 D6 | C6 - - A5 - . | C6 - Bb5 A5 - G5 | G5 - - E5 - . | F5 - E5 D5 - F5 | E5 - D5 Bb4 - G4 | A4 - C#5 E5 - G5 | F5 - E5 C#5 - ."},
    acc(bar, step, c, play){ const ch = chordM(c); if (step===0){ play("bass", ch[0]-12, 2, .9); play(bar%2 ? "oo" : "choir", ch[0]+12, 6, .7); play("choir", ch[2]+12, 6, .45); } if (step===2 || step===4) for (const m of ch.slice(1)) play("harpsi", m+12, 1, .55);
      if (step===0 && (bar===0 || bar===8)){ play("bell", NOTE("D6"), 6, .8); play("bell", NOTE("A5"), 6, .5); } if (step===0) play("frame", 0, 1, .55); if (bar%8===7 && step===3) play("tom", 0, 1, .6); }},
  town:{bpm:100, spb:3, bar:6, chords:"Dm C Dm Am Dm C G Am",
    lead:{inst:"flute", v:1, notes:"D5 E5 F5 A5 G5 F5 | E5 D5 C5 E5 - C5 | D5 E5 F5 G5 A5 G5 | E5 - C5 A4 - . | F5 G5 A5 C6 A5 G5 | E5 G5 E5 C5 D5 E5 | D5 - B4 G4 A4 B4 | A4 - - - - ."},
    acc(bar, step, c, play){ const ch = chordM(c); const arp = [ch[0], ch[2], ch[0]+12, ch[1]+12, ch[2], ch[1]+12]; play("lute", arp[step]+12, 1, .7); if (step===0 || step===3) play("bass", ch[0]-12, 2, .8); if (step===0) play("frame", 0, 1, .7); if (step===3) play("frame", 0, 1, .35); if (step===2 || step===5) play("shaker", 0, 1, .8); }},
  townnight:{bpm:58, spb:2, bar:8, chords:"Dm Bbmaj7 Gm9 A7b9 Dm Bbmaj7 Gm9 A7b9",
    lead:{inst:"musicbox", v:1, notes:"A5 . . F5 . . E5 . | D5 . . . . . . . | Bb5 . . A5 . . G5 . | C#6 . A5 . . Eb6 . . | D6 . . C6 . . A5 . | Bb5 . . A5 . . F5 . | G5 . . E5 . . Bb4 . | A4 . . . . . . ."},
    acc(bar, step, c, play){ const ch = chordM(c); if (step===0){ play("oo", ch[0]+12, 8, .8); play("oo", ch[ch.length-1]+12, 8, .5); if (bar%4===0) play("drone", NOTE("D2"), 32, .9); if (bar===0) play("bell", NOTE("D4"), 8, .6); } if (step===6 && bar%2===1) play("harpsi", ch[1]+24, 1, .25); }},
  tense:{bpm:112, spb:4, bar:16, chords:"Dm Dm Bb A Dm Dm Bb A7b9",
    lead:{inst:"strings", v:.6, notes:"D5 - - - - - - - Eb5 - - - - - - - | D5 - - - - - - - C#5 - - - - - - - | D5 - - - F5 - - - Eb5 - - - D5 - - - | C#5 - - - - - - - . . . . . . . . | D5 - - - - - - - Eb5 - - - - - - - | F5 - - - - - Eb5 - D5 - - - - - - - | Bb4 - - - - - - - A4 - - - - - - - | C#5 - - - - - - - Bb4 - - - - - - -"},
    acc(bar, step, c, play){ const ch = chordM(c); const pat = [0, 0, 1, 0]; play("strings", ch[0] + (pat[step%4] ? 1 : 0), 1, .55); if (step===0) play("kick", 0, 1, .9); if (step===3) play("kick", 0, 1, .6); if (step===0 && bar%2===0) play("choir", ch[0]+12, 16, .5); if (bar%4===3 && step>=12) play("tom", 0, 1, .4 + (step-12)*.12); }},
  lockdown:{bpm:150, spb:4, bar:16, chords:"Dm Dm Bb C Dm Dm Gm A",
    lead:{inst:"brass", v:1, notes:"D5 - - - - - F5 - E5 - D5 - C5 - A4 - | Bb4 - - - C5 - D5 - E5 - - - A4 - - - | D5 - - - - - F5 - G5 - A5 - G5 - F5 - | E5 - - - C5 - - - E5 - G5 - C6 - - - | A5 - - - - - G5 - F5 - E5 - D5 - C5 - | D5 - - - A4 - - - D5 - F5 - A5 - - - | Bb5 - - - A5 - G5 - F5 - - - D5 - - - | C#5 - - - E5 - - - A4 - - - - - - -"},
    acc(bar, step, c, play){ const ch = chordM(c); if (step%2===0) play("bass", ch[0]-12 + ((step/2)%4===2 ? 12 : 0), 1, .85); if ([0,4,8,10,12].includes(step)) play("kick", 0, 1, .9); if (step===4 || step===12) play("snare", 0, 1, .9); if (step%2===1) play("hat", 0, 1, .7); if (step===0) play("stab", ch[0]+12, 1, .7); if (step===8) for (const m of ch) play("stab", m+12, 1, .45); }},
  dance:{bpm:132, spb:3, bar:6, chords:"Dm C Dm C Bb C Dm Dm",
    lead:{inst:"fiddle", v:1, notes:"D5 F5 A5 D6 A5 F5 | E5 G5 C6 E6 C6 G5 | F5 A5 D6 F6 D6 A5 | E5 G5 C6 G5 E5 C5 | D5 F5 Bb5 D6 Bb5 F5 | E5 G5 C6 E5 G5 C6 | A5 F5 D5 A4 D5 F5 | D5 - - - - ."},
    acc(bar, step, c, play){ const ch = chordM(c); if (step===0 || step===3) play("bass", ch[0]-12, 2, .85); if (step===1 || step===4) for (const m of ch) play("lute", m+12, 1, .5); if ([0,2,3,5].includes(step)) play("frame", 0, 1, step%3===0 ? .8 : .45); }},
  cutscene:{bpm:66, spb:2, bar:8, chords:"Dm Bb F A Dm Bb Gm A",
    lead:{inst:"oo", v:.9, notes:"A4 - - - - - - - | F4 - - - - - - - | A4 - - - C5 - - - | C#5 - - - - - - - | D5 - - - - - - - | D5 - - - F5 - - - | D5 - - - Bb4 - - - | A4 - - - - - - -"},
    acc(bar, step, c, play){ const ch = chordM(c); if (step===0){ play("strings", ch[0], 8, .7); play("strings", ch[2], 8, .5); play("bass", ch[0]-12, 8, .6); if (bar%4===0) play("bell", ch[0]+24, 8, .6); } if (step%2===1) play("harpsi", ch[(step>>1)%3]+12, 1, .25); }}
};
for (const k in SONGS){ const s = SONGS[k]; s.chordList = s.chords.split(/\s+/); s.leadNotes = seqLine(s.lead.notes); s.loop = s.chordList.length * s.bar; }
function hqStop(){ if (HQ.timer){ clearInterval(HQ.timer); HQ.timer = null; } if (HQ.bus){ const b = HQ.bus; try { b.gain.setTargetAtTime(.0001, HQ.ac.currentTime, .4); setTimeout(()=>{ try { b.disconnect(); } catch {} }, 2500); } catch {} HQ.bus = null; } HQ.name = null; }
function hqPlay(name){
  if (HQ.name===name) return;
  hqStop(); if (!name || !SONGS[name] || !hqInit()) return;
  const S2 = SONGS[name], ac = HQ.ac, stepT = 60/S2.bpm/S2.spb;
  const bus = ac.createGain(); bus.gain.setValueAtTime(.0001, ac.currentTime); bus.gain.exponentialRampToValueAtTime(1, ac.currentTime+1.2); bus.connect(HQ.out); HQ.bus = bus;
  HQ.name = name; let n = 0, next = ac.currentTime + .15;
  const leadAt = new Map(); for (const [i, m, len] of S2.leadNotes) leadAt.set(i, [m, len]);
  HQ.timer = setInterval(() => {
    if (!Snd.musicOn || Snd.muted){ next = ac.currentTime + .1; return; }
    while (next < ac.currentTime + .25){
      const i = n % S2.loop, bar = Math.floor(i / S2.bar), step = i % S2.bar, chord = S2.chordList[bar];
      const out = HQ.out; HQ.out = bus;
      const play = (inst, m, lenSteps, v) => { try { INST[inst](next, m, lenSteps*stepT, v); } catch {} };
      const L = leadAt.get(i); if (L) play(S2.lead.inst, L[0], L[1], S2.lead.v);
      S2.acc(bar, step, chord, play);
      HQ.out = out;
      next += stepT; n++;
    }
  }, 30);
}
// The Halloween edition routes every track through the composed score.
if (HALLOW){
  const orig = Snd.track;
  Snd.track = name => { if (name && SONGS[name]){ orig(null); hqPlay(name); } else { hqStop(); orig(name); } };
}

// ---------- horror sound design ----------
const SCREAM = {buf:null, tried:false};
function loadScream(){
  if (SCREAM.tried || !Snd.ac) return; SCREAM.tried = true;
  const names = ["scream.mp3","scream.m4a","scream.wav","scream.ogg","scream.webm"];
  (async () => { for (const n of names){ try { const r = await fetch("millbrook3d/" + n); if (!r.ok) continue; const ab = await r.arrayBuffer(); SCREAM.buf = await Snd.ac.decodeAudioData(ab); return; } catch {} } })();
}
const HSFX = {
  thunder(){ if (!hqInit()) return; const t = HQ.ac.currentTime; noiseHit(t, "lowpass", 300, .5, 3.5, .6); noiseHit(t+.05, "bandpass", 120, .8, 2.5, .5); INST.kick(t, 0, 1, .9); },
  howl(){ if (!hqInit()) return; const t = HQ.ac.currentTime, f = 380 + Math.random()*80, g = HQ.ac.createGain(), bp = filt("bandpass", 900, 2); const o = osc("sawtooth", f, t, t+3.4); o.frequency.linearRampToValueAtTime(f*1.6, t+.8); o.frequency.linearRampToValueAtTime(f*1.5, t+2.2); o.frequency.exponentialRampToValueAtTime(f*.9, t+3.2); vib(o, t, 5, 6, .6); o.connect(bp); bp.connect(g); const pan = HQ.ac.createStereoPanner ? HQ.ac.createStereoPanner() : null; if (pan){ pan.pan.value = Math.random()*1.6-.8; g.connect(pan); pan.connect(HQ.comp); } else g.connect(HQ.comp); env(g, t, .6, .05, .4, .8, .8, t+2.4); },
  crow(){ if (!hqInit()) return; const t = HQ.ac.currentTime; for (let i=0;i<2+Math.floor(Math.random()*2);i++){ const tt = t + i*.32, g = HQ.ac.createGain(), bp = filt("bandpass", 1200, 4); const o = osc("sawtooth", 520, tt, tt+.25); o.frequency.exponentialRampToValueAtTime(380, tt+.22); o.connect(bp); bp.connect(g); g.connect(HQ.comp); const p = g.gain; p.setValueAtTime(.0001,tt); p.exponentialRampToValueAtTime(.05, tt+.02); p.exponentialRampToValueAtTime(.0001, tt+.24); noiseHit(tt, "bandpass", 1600, 3, .2, .03); } },
  toll(times=1){ if (!hqInit()) return; const t = HQ.ac.currentTime; for (let i=0;i<times;i++){ const out = HQ.out; HQ.out = HQ.comp; INST.bell(t + i*2.2, NOTE("D3"), 1, 1.4); HQ.out = out; } },
  whisper(){ if (!hqInit()) return; const t = HQ.ac.currentTime; const pan = HQ.ac.createStereoPanner ? HQ.ac.createStereoPanner() : null; const g = HQ.ac.createGain(); g.gain.value = 1; if (pan){ pan.pan.value = Math.random() < .5 ? -.9 : .9; g.connect(pan); pan.connect(HQ.comp); } else g.connect(HQ.comp);
    for (let i=0;i<9;i++){ const tt = t + i*.11 + Math.random()*.05, s = HQ.ac.createBufferSource(); s.buffer = Snd.nodes.noiseBuf; const b = filt("bandpass", 1800 + Math.random()*2400, 6), gg = HQ.ac.createGain(); s.connect(b); b.connect(gg); gg.connect(g); const p = gg.gain; p.setValueAtTime(.0001, tt); p.exponentialRampToValueAtTime(.05, tt+.03); p.exponentialRampToValueAtTime(.0001, tt+.12); s.start(tt, Math.random()); s.stop(tt+.15); } },
  roar(){ if (!hqInit()) return; const ac = HQ.ac, t = ac.currentTime, g = ac.createGain(), lp = filt("lowpass", 700, 2);
    for (const [f, dt] of [[46,0],[47,-20],[69,10],[92,5]]){ const o = osc("sawtooth", f, t, t+3.6, dt); o.frequency.setValueAtTime(f*.8, t); o.frequency.linearRampToValueAtTime(f*1.15, t+.6); o.frequency.exponentialRampToValueAtTime(f*.7, t+3.4); vib(o, t, 6, f*.06, 0); o.connect(lp); }
    lp.connect(g); g.connect(HQ.comp); env(g, t, .25, .5, .6, .8, 1.2, t+2.4); noiseHit(t, "lowpass", 500, .7, 3, .3); },
  heartbeat(){ if (!hqInit()) return; const t = HQ.ac.currentTime, out = HQ.out; HQ.out = HQ.comp; INST.kick(t, 0, 1, .8); INST.kick(t+.22, 0, 1, .5); HQ.out = out; },
  knock(){ if (!hqInit()) return; const t = HQ.ac.currentTime; for (let i=0;i<3;i++) noiseHit(t + i*.55, "lowpass", 500, 1, .12, .5); },
  // a real scream if one has been recorded (millbrook3d/scream.*), otherwise a harsh synthesized shriek
  scream(vol=1){
    if (!hqInit()) return; loadScream();
    const ac = HQ.ac, t = ac.currentTime;
    if (SCREAM.buf){ const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = SCREAM.buf; src.playbackRate.value = .92 + Math.random()*.16; g.gain.value = 1.3*vol; src.connect(g); g.connect(HQ.comp); src.start(t); return; }
    const out = ac.createGain(), shaper = ac.createWaveShaper(), curve = new Float32Array(1024);
    for (let i=0;i<1024;i++){ const x = i/512 - 1; curve[i] = Math.tanh(x*3.2); } shaper.curve = curve;
    const f1 = filt("bandpass", 1150, 3), f2 = filt("bandpass", 2700, 4), f3 = filt("bandpass", 3900, 5), mix = ac.createGain(); mix.gain.value = 1;
    shaper.connect(f1); shaper.connect(f2); shaper.connect(f3); f1.connect(mix); f2.connect(mix); f3.connect(mix); mix.connect(out); out.connect(HQ.comp);
    const base = 760 + Math.random()*180;
    for (const [dt, w] of [[-35,"sawtooth"],[0,"sawtooth"],[28,"square"],[12,"sawtooth"]]){
      const o = osc(w, base, t, t+1.9, dt); o.frequency.setValueAtTime(base*.8, t); o.frequency.exponentialRampToValueAtTime(base*1.55, t+.18); o.frequency.linearRampToValueAtTime(base*1.4, t+1.0); o.frequency.exponentialRampToValueAtTime(base*.75, t+1.8);
      vib(o, t, 9 + Math.random()*3, 70, 0); const og = ac.createGain(); og.gain.value = .5; o.connect(og); og.connect(shaper);
    }
    const p = out.gain; p.setValueAtTime(.0001, t); p.exponentialRampToValueAtTime(.42*vol, t+.03); p.setValueAtTime(.42*vol, t+1.1); p.exponentialRampToValueAtTime(.0001, t+1.9);
    noiseHit(t, "bandpass", 2400, .6, 1.3, .14*vol); noiseHit(t, "highpass", 4000, .5, .5, .1*vol);
  },
  riser(){ if (!hqInit()) return; const t = HQ.ac.currentTime, g = HQ.ac.createGain(); for (const dt of [-20, 0, 15]){ const o = osc("sawtooth", 80, t, t+2.2, dt); o.frequency.exponentialRampToValueAtTime(420, t+2); o.connect(g); } const lp = filt("lowpass", 1400); g.connect(lp); lp.connect(HQ.comp); const p = g.gain; p.setValueAtTime(.0001, t); p.exponentialRampToValueAtTime(.07, t+1.9); p.exponentialRampToValueAtTime(.0001, t+2.1); }
};
if (HALLOW){
  // the stingers and screams in the town code get the bigger versions
  const fx = Snd.fx;
  fx.stinger = () => { HSFX.riser(); setTimeout(()=>{ if (!hqInit()) return; const t = HQ.ac.currentTime, out = HQ.out; HQ.out = HQ.comp; for (const m of ["D3","Eb3","A3","Bb3"]) INST.stab(t, NOTE(m), 1, 1.2); INST.kick(t, 0, 1, 1); HQ.out = out; noiseHit(t, "highpass", 3000, .7, .8, .12); }, 1900); };
  fx.scream = () => HSFX.scream();
  fx.knock = () => HSFX.knock();
  fx.bell = () => HSFX.toll(1);
  fx.church = () => HSFX.toll(3);
}
