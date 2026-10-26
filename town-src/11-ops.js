// Part three's doorway and part four: LEAVE NO EVIDENCE.
const SNAP_KEY = "cellblock9-town-snap", SLASH_INFO = "cellblock9-slasher-info";

// ---------- leaving Millbrook with a dead agent's badge ----------
function startOperation(){
  if (!T || T.ending) return;
  closeTalkT(); closeTWindows();
  const snap = JSON.stringify(T, (k,v)=>SKIP_SAVE.has(k) ? undefined : v);
  try { localStorage.setItem(SNAP_KEY, snap); localStorage.removeItem(TSAVE); } catch {}
  const opts = {alias:T.alias, badgeName:T.det.realName, look:{skin:T.player.look.skin, hair:T.player.look.hair, beard:T.player.look.beard||null}, disguise:Object.assign({}, T.player.disguise), townDay:T.day};
  playCutscene("spyreveal", () => {
    TOWN.active = false; document.body.classList.remove("in-town");
    showTownDom(false); $("tScreen").hidden = true;
    if (window.__cb9 && window.__cb9.startOps) window.__cb9.startOps(opts);
  });
}

// ---------- part four ----------
let SLASH = null;   // runtime only: music timer
function beginSlasher(info){
  Snd.init();
  try { localStorage.setItem(SLASH_INFO, JSON.stringify(info||{})); } catch {}
  let snap = null; try { snap = JSON.parse(localStorage.getItem(SNAP_KEY)||"null"); } catch {}
  if (snap){ T = snap; buildTown(); folk = T.folk; for (const n of folk){ if (n.suitCols) E.SUITS["t_"+n.id] = n.suitCols; n.scene = null; n.path = []; n.talkingToPlayer = false; n.bubble = null; n.emote = null; n.order = null; n.fight = null; n.away = false; n.hidden = false; n.chasing = false; } E.SUITS.t_player = T.player.suitCols || ["#7a6a5a","#5a4a3a","#9a8a7a"]; }
  else { T = freshState(); buildTown(); genTown(); T.containers = makeContainers(); for (const n of folk) n.suitCols = E.SUITS["t_"+n.id]; E.SUITS.t_player = ["#7a6a5a","#5a4a3a","#9a8a7a"]; T.player = {x:2, y:30, fx:2, fy:30, prog:1, dir:[1,0], walkT:0, inv:["kitchen knife","room key"], hp:100, fight:null, carrying:null, disguise:{}, wearJumpsuit:false, look:{suit:"t_player", civ:true, skin:"#d49a6a", hair:"#3f2616", style:"short", pants:"#29366f"}, baseStyle:"short", suitCols:E.SUITS.t_player}; T.det.dead = true; const dd = detP(); if (dd){ dd.dead = true; T.bodies.push({id:dd.id, name:fullT(dd), x:60, y:76, hidden:"grave:60,76", carried:false, diedAt:0, discovered:false, inside:null, killer:"player"}); } T.alias = (info && info.alias) || "Sam Ellis"; }
  tmapDirty = true;
  const sp = (info && info.spy) || {short:"Nadia", name:"Nadia Petrova", look:{suit:"o", skin:"#f2d0b8", hair:"#ffcd75", style:"long"}, voice:{base:240,wave:"square",range:3,len:.06,slide:.92,formant:1.1,speed:1.1}};
  E.SUITS.t_spy = ["#3e4c63","#29366f","#566c86"];
  T.mode = "slasher"; T.ending = null; T.lock = null; T.wanted = false; T.talkId = null; T.cutscene = null; T.game = null; T.fx = [];
  T.day += 14; T.t = 22*60 + 40; T.event = {day:T.day, kind:"none", text:""}; T.weather = "clear";
  T.panic = 0; T.police = null; T.phonesCut = false; T.escaped = []; T.slashKills = 0; T.startAlive = folk.filter(alive).length; T.slashStart = absT();
  T.det.dead = true;
  T.spyE = {id:"spy", met:true, name:sp.name, short:sp.short, x:2, y:31, fx:2, fy:31, prog:1, dir:[1,0], walkT:0, path:[], hidden:false, hideKey:null, follow:true, look:Object.assign({}, sp.look, {suit:"t_spy", civ:true, pants:"#1a1c2c"}), voice:sp.voice||{base:200,wave:"square",range:3,len:.06,slide:.95,formant:1,speed:1}, hp:100};
  const pl = T.player; pl.x = pl.fx = 2; pl.y = pl.fy = 30; pl.prog = 1; pl.dir = [1,0]; pl.carrying = null; pl.fight = null; pl.hp = 100; pl.wearJumpsuit = false;
  pl.inv = pl.inv.filter(i=>i!=="detective's badge" && i!=="case file");
  if (!pl.inv.includes("lockpick") && canAddT(pl.inv, "lockpick")) pl.inv.push("lockpick");
  if (!pl.inv.some(i=>weaponDmg(i))){ if (canAddT(pl.inv, "kitchen knife")) pl.inv.push("kitchen knife"); }
  T.stats.kills = T.stats.kills || 0; T.slashLog = [];
  // the town remembers
  for (const n of folk) if (alive(n)){
    rememberT(n, "The newcomer left Millbrook without a word two weeks ago. Never paid the last of their rent.");
    if (Math.random() < .5) rememberT(n, `Read in the Gazette: two people walked out of Cellblock Nine, an inmate called ${sp.name} and a new guard. The State Bureau won't say anything.`);
  }
  T.gazette.push({day:T.day, headline:"TWO WALK OUT OF CELLBLOCK NINE", stories:[`An inmate, ${sp.name}, and a newly hired officer are missing from Cellblock Nine. Officials deny reports of a 'foreign connection'.`, "Sheriff urges residents to lock their doors. 'Nothing to worry about,' he adds."], weather:"Cold, clear, a full moon."});
  closeTWindows(); showTownDom(true);
  TOWN.active = true; document.body.classList.add("in-town"); document.body.classList.add("slasher");
  playCutscene("nobodies", () => {
    lastHourT = hourNow();
    banner("LEAVE NO EVIDENCE", `${folk.filter(alive).length} people left in Millbrook.`, true, 6);
    const stillHere = () => TOWN.active && T && T.mode==="slasher" && !T.ending;
    setTimeout(()=>stillHere() && toast(`${sp.short} is with you. Nobody can see them, ever. Hide them somewhere safe (talk to them).`, "bad", 9), 6500);
    setTimeout(()=>stillHere() && toast("Sleeping people die quietly. So do people looking the other way. Guns wake the whole street.", "", 9), 16000);
    setTimeout(()=>stillHere() && toast("If anyone reaches a phone, the state police come. If anyone reaches the road or the train, it's over. Cut the phones at the post office.", "", 10), 26000);
    renderHotbarT(); slasherMusic(true); saveT();
  });
}
function cleanupSlasherDom(){ document.body.classList.remove("slasher"); slasherMusic(false); }

// ---------- the spy, kept out of sight ----------
function spyWalkable(x,y){ return walkPlayer(x,y); }
function updateSpyE(dt){
  const s = T.spyE; if (!s || s.dead) return;
  if (s.prog < 1){ s.prog = Math.min(1, s.prog + dt*5); s.walkT += dt*5; return; }
  if (s.hidden) return;
  const pl = T.player;
  if (s.follow){
    const d = Math.hypot(pl.x-s.x, pl.y-s.y);
    if (d > 1.5){ if (!s.path.length || performance.now() > (s.repath||0)){ s.repath = performance.now()+500; const p = bfsT(s.x, s.y, pl.x, pl.y, spyWalkable, 4000); s.path = p ? p.slice(0, Math.max(0, p.length-1)) : []; if (!p && d > 12){ s.x = s.fx = pl.x - pl.dir[0]; s.y = s.fy = pl.y - pl.dir[1]; } } }
    else s.path = [];
  }
  if (s.path.length){ const [x,y] = s.path.shift(); if (Math.abs(x-s.x)+Math.abs(y-s.y)===1 && spyWalkable(x,y)) stepT(s, x-s.x, y-s.y); else s.path = []; }
}
function spySeenCheck(){
  const s = T.spyE; if (!s || s.hidden || s.dead) return;
  for (const n of folk){
    if (!alive(n) || n.asleep || n.away || n.alarmed==="spy") continue;
    if (!canSeeT(n, s.x, s.y, 7)) continue;
    sayT(n, pick([`Who's THAT? …Wait. I've seen that face. In the paper!`, "That's the escaped convict! From the Gazette!", "Oh my God. OH MY GOD."]), 3.5); sfx("scream"); emoteT(n, "!", 3);
    rememberT(n, `I saw ${s.name}, the escaped inmate from the Gazette, with the newcomer!`);
    slasherAlarm(n, "spy", `saw ${s.name} with the newcomer`);
  }
}
function spyMenu(){
  const s = T.spyE, pl = T.player, here = insideOf(pl), spot = hideSpotFacing();
  closeTWindows();
  $("trTitle").textContent = `${s.short} · codename BIRCH`; const b = $("trBody"); b.textContent = "";
  b.append(Object.assign(document.createElement("p"),{textContent: pick([`*barely above a whisper* ${folk.filter(alive).length} left. Then home, Sparrow.`, "*watching the window* They lock their doors now. Good. Locks are only wood.", "Leave nothing. Not a print, not a name.", "*cleaning a blade on their sleeve* Davai. Faster."])}));
  const row = document.createElement("div"); row.className = "row";
  const btn = (label, fn) => { const x = Object.assign(document.createElement("button"),{type:"button", className:"pbtn", textContent:label}); x.addEventListener("click", ()=>{ fn(); closeTWindows(); }); row.append(x); };
  if (s.hidden) btn("Come out, follow me", () => { s.hidden = false; s.hideKey = null; s.follow = true; s.x = s.fx = pl.x - pl.dir[0] || pl.x; s.y = s.fy = pl.y - pl.dir[1]; if (!spyWalkable(s.x, s.y)){ s.x = s.fx = pl.x; s.y = s.fy = pl.y; } toast(`${s.short} slips out after you.`, "", 2.5); });
  else {
    btn(s.follow ? "Wait here" : "Follow me", () => { s.follow = !s.follow; s.path = []; toast(s.follow ? `${s.short} follows.` : `${s.short} waits.`, "", 2); });
    const safe = spot ? spot.name.toLowerCase() : (here==="roomC" || here==="barn" || (here && bById(outerOf(here)) && bById(outerOf(here)).kind==="home" && !residentsOf(outerOf(here)).some(alive))) ? placeLabelAt(pl.x,pl.y) : null;
    if (safe) btn(`Hide in ${spot ? "the "+safe : "here ("+safe+")"}`, () => { s.hidden = true; s.follow = false; s.hideKey = spot ? spot.key : here; s.x = s.fx = pl.x; s.y = s.fy = pl.y; toast(`${s.short} disappears into ${spot ? "the "+safe : safe}.`, "good", 3); saveT(); });
  }
  b.append(row);
  b.append(Object.assign(document.createElement("p"),{className:"note", textContent:"Safe places: wardrobes, freezers and dumpsters (face one), your room, the barn, or a house whose owners are dead."}));
  $("tWinRead").hidden = false; sfx("open");
}

// ---------- panic, phones and running ----------
const PHONES = [{bid:"post", at:[69,23]}, {bid:"sheriff", at:[59,25]}, {bid:"hotel", at:[80,25]}, {bid:"station", at:[95,24]}, {bid:"diner", at:[9,22]}];
function slasherAlarm(n, kind, why){
  if (!alive(n) || n.dead) return;
  T.panic = clamp((T.panic||0) + (kind==="murder" ? 30 : kind==="spy" ? 20 : kind==="body" ? 25 : 8), 0, 100);
  if (n.alarmed && n.alarmed!=="shot") return;
  n.alarmed = kind; n.asleep = false;
  if (n.sheriff){ n.hunting = true; n.order = null; sayT(n, "That's it. I'm getting the rifle out.", 3); if (!T.phonesCut) n.order = {type:"callhelp", until:absT()+400, run:true, radio:true}; return; }
  n.fight = null; n.scene && finishSceneT(n.scene);
  n.order = {type: T.phonesCut ? "escape" : "callhelp", until:absT()+600, run:true, why};
  if (Math.random() < .5) gossipT(n, `The newcomer is back and something is very wrong.`);
}
function slasherHearShot(n, x, y, shooter){
  if (shooter!==T.player) return;
  const d = Math.hypot(n.x-x, n.y-y);
  if (d < 10 && canSeeT(n, Math.round(x), Math.round(y), 10)) slasherAlarm(n, "murder", "saw the newcomer shooting");
  else { T.panic = clamp((T.panic||0) + 3, 0, 100); if (d < 16 && !n.alarmed && Math.random() < .35) slasherAlarm(n, "shot", "heard gunfire"); }
}
function nearestPhone(n){ let best = null, bd = 1e9; for (const p of PHONES){ const d = Math.hypot(p.at[0]-n.x, p.at[1]-n.y); if (d < bd){ bd = d; best = p; } } return best; }
function runSlasherOrder(n, dt){
  const o = n.order; if (!o) return false;
  if (o.type==="callhelp"){
    if (T.phonesCut && !o.radio){ n.order = {type:"escape", until:absT()+600, run:true}; sayT(n, "The phone's dead! THE PHONE'S DEAD!", 3); return true; }
    const ph = o.radio ? PHONES[1] : (o.ph || (o.ph = nearestPhone(n)));
    if (Math.hypot(ph.at[0]-n.x, ph.at[1]-n.y) <= 1.5){ callPolice(n); n.order = {type:"hide", until:absT()+900}; return true; }
    if (!goToT(n, ph.at[0], ph.at[1], true)){ const alt = PHONES.find(p=>p!==ph && bfsT(n.x,n.y,p.at[0],p.at[1],(a,b)=>npcWalkT(a,b,n),3000)); if (alt) o.ph = alt; else n.order = {type:"escape", until:absT()+600, run:true}; }
    return true;
  }
  if (o.type==="escape"){
    const train = TRAINS.find(dp => T.t >= dp-40 && T.t <= dp+3);
    const tgt = train !== undefined ? (o.plat || (o.plat = randomSpot("platform"))) : [1, 30];
    if (Math.abs(n.x-tgt[0]) + Math.abs(n.y-tgt[1]) <= 1){
      if (train !== undefined && T.t < train-12){ n.path = []; return true; }
      escapedTown(n, train !== undefined ? "the train" : "the road west"); return true;
    }
    goToT(n, tgt[0], tgt[1]); return true;
  }
  if (o.type==="hide"){ if (buildingAt(n.x,n.y)!==n.home){ const s = randomSpot(n.home); if (s) goToT(n, s[0], s[1]); } else n.path = []; return true; }
  return false;
}
function callPolice(n){
  if (T.police) return;
  T.police = {arrive: absT() + 420, caller:n.id};
  sayT(n, "Hello? State police? Millbrook. Please hurry!", 4);
  banner("SOMEONE GOT TO A PHONE", `${n.first} called the state police. Sirens by ${fmtT(T.police.arrive)}.`, true, 6);
  sfx("stinger");
  for (const o of folk) if (alive(o)) rememberT(o, `${n.first} called the state police.`);
}
function escapedTown(n, how){
  if (T.ending) return;
  T.escaped.push(n.id); n.away = true; n.order = null;
  banner("ONE GOT AWAY", `${n.first} made it out by ${how}.`, true, 4);
  setTimeout(()=>ending("slasher_escaped", {who:n.first, how}), 2600);
}
function cutPhones(){
  T.phonesCut = true; sfx("snap"); T.shake = .2;
  banner("THE LINES ARE DEAD", "Every phone in Millbrook just went quiet.", true, 4);
  for (const n of folk) if (alive(n) && n.order && n.order.type==="callhelp" && !n.order.radio){ n.order = {type:"escape", until:absT()+600, run:true}; }
}

// ---------- killing quietly ----------
function stealthKillT(){
  const pl = T.player, [fx,fy] = facingT();
  const t = folk.find(n=>alive(n) && !n.away && !n.hidden && Math.round(rposT(n)[0])===fx && Math.round(rposT(n)[1])===fy) || nearestFolk(1.2);
  if (!t) return false;
  const w = selectedWeapon() || (pl.inv.includes("rope") ? "rope" : null);
  if (!w) return false;
  const behind = t.dir && (Math.sign(pl.x - t.x)===-t.dir[0] && t.dir[0]!==0 || Math.sign(pl.y - t.y)===-t.dir[1] && t.dir[1]!==0);
  const unaware = t.asleep || (!t.fight && !t.alarmed && (behind || t.scene || t.talkingToPlayer));
  if (!unaware) return false;
  faceToT(pl, t);
  T.fx.push({kind:"sparks", x:t.x*TS+8, y:t.y*TS+4, life:.4});
  sfx("cut"); setTimeout(()=>sfx("snap"), 120);
  closeTalkT();
  killPerson(t, pl, {silent:true});
  toast(pick([`${t.first} never saw you.`, `${t.first} doesn't make a sound.`, `Quiet. Like you were taught.`]), "bad", 3);
  return true;
}
function slasherWitness(o, n, by){
  if (by!==T.player) return;
  rememberT(o, `I SAW THE NEWCOMER KILL ${n.first.toUpperCase()}.`);
  sayT(o, pick(["AAAAH!","MURDERER!","No no no no no","RUN!"]), 3); sfx("scream");
  slasherAlarm(o, "murder", `saw the newcomer kill ${n.first}`);
}

// ---------- each second ----------
function slasherSecond(){
  if (!T || T.mode!=="slasher" || T.ending) return;
  spySeenCheck();
  const left = folk.filter(alive);
  if (!left.length){ winSlasher(); return; }
  if (T.police && absT() >= T.police.arrive){ ending("slasher_police"); return; }
  // panic changes how the town behaves
  if (T.panic > 0) T.panic = Math.max(0, T.panic - .015);
  for (const n of left){
    if (n.alarmed==="shot" && !n.order && Math.random() < .02) n.alarmed = null;
    if (T.panic >= 40 && !n.order && !n.fight && !n.sheriff && Math.random() < .05) n.order = {type:"hide", until:absT()+240};
    if (n.hunting && !n.fight && canSeeT(n, T.player.x, T.player.y, 10)){ sayT(n, "FREEZE!", 2); startFightT(n, T.player); }
  }
  if (T.spyE && T.spyE.dead && !T.ending) ending("slasher_spy");
}
function winSlasher(){
  if (T.ending) return;
  T.ending = "russia_pending";
  slasherMusic(false);
  setTimeout(() => { T.ending = null; playCutscene("russia", () => ending("russia")); }, 2500);
  banner("MILLBROOK IS QUIET", "Nobody left to tell.", true, 3);
}

// ---------- music: an original, slasher-style 5/4 ostinato ----------
function slasherMusic(on){
  if (SLASH && SLASH.timer){ clearInterval(SLASH.timer); SLASH = null; }
  if (!on) return;
  Snd.track(null);
  const ac = Snd.ac; if (!ac) return;
  const dest = Snd.nodes.mus, step = 60/178;
  const motif = [69,64,64,69,64, 70,64,64,70,64, 69,64,64,69,64, 67,63,63,67,63];
  let n = 0, next = Snd.now() + .1;
  SLASH = {timer: setInterval(() => {
    if (!Snd.musicOn) return;
    while (next < Snd.now() + .25){
      const at = next - Snd.now(), m = motif[n % motif.length], bar = Math.floor(n/5);
      Snd.tone({f:Snd.mf(m+12), type:"triangle", dur:step*.9, vol:.05, at, dest});
      Snd.tone({f:Snd.mf(m), type:"square", dur:step*.5, vol:.018, at, dest, filter:{f:1400}});
      if (n % 5 === 0){ Snd.tone({f:Snd.mf(bar%4===3 ? 43 : 45), type:"sawtooth", dur:step*5, vol:.05, at, dest, filter:{f:300}}); Snd.kick(next, .25); }
      if (n % 40 === 30) Snd.tone({f:Snd.mf(81), f2:Snd.mf(80), type:"sine", dur:step*8, vol:.03, at, dest});
      next += step; n++;
    }
  }, 40)};
}
function evilLaugh(){
  const v = {base:95, wave:"sawtooth", range:1, len:.13, slide:.8, formant:.78, speed:.7, vib:true};
  for (let i=0;i<7;i++){ const t = i*.2 + (i>3 ? .15 : 0); Snd.voice(v, "h", {at:t, vol:.9, contour:1.25 - i*.06}); Snd.voice(v, "a", {at:t+.05, vol:1, contour:1.25 - i*.06}); }
  for (let i=0;i<4;i++) Snd.voice(Object.assign({}, v, {base:70}), "a", {at:1.7 + i*.24, vol:.5, contour:1 - i*.05});
}

// ---------- cutscenes for part three and four ----------
Object.assign(CUTS, {
  spyreveal(){
    const D = T.det, badge = D.realName;
    return [
      {dur:4, sfx:"creak", cap:`Room C, 2 a.m. The badge lies on the bed. ${badge}, State Bureau of Investigation. The photo could be you, if the light is bad.`, draw(g,t){
        sky(g,"#140c18","#1f1424"); R_(g,0,110,CW,70,"#5e2a3c"); for (let x=0;x<CW;x+=24) R_(g,x,110,1,70,"#4a2030");
        R_(g,60,96,120,40,"#f4f4f4"); R_(g,60,108,120,28,"#b13e53"); R_(g,64,92,40,12,"#ffffff");
        const gl = (Math.sin(t*3)+1)/2; R_(g,128,100,22,26,"#3e2a1c"); R_(g,134,104,12,14,"#ffcd75"); g.fillStyle = `rgba(255,240,180,${.3*gl})`; g.beginPath(); g.arc(140,111,16,0,7); g.fill();
        R_(g,250,30,40,50,"#29366f"); R_(g,252,32,36,46,"#0d0e18"); g.fillStyle = "#f4ecd8"; g.beginPath(); g.arc(270,50,7,0,7); g.fill();
      }},
      {dur:3.5, sfx:"bell", cap:"The phone in the hall rings. Nobody has ever called Room C.", enter(){ let i=0; const r = setInterval(()=>{ Snd.tone({f:880,dur:.12,vol:.06}); Snd.tone({f:1100,dur:.12,vol:.05,at:.13}); if (++i>4) clearInterval(r); }, 600); }, draw(g,t){
        sky(g,"#1a1c2c","#2a1c2c"); R_(g,0,120,CW,60,"#7a3045"); R_(g,140,60,40,60,"#3e2a1c"); R_(g,146,66,28,22,"#1a1c2c");
        const sh = Math.floor(t*14)%2 ? 1 : -1; R_(g,150+sh,70,20,8,"#b13e53"); R_(g,152+sh,92,16,16,"#b13e53");
      }},
      {dur:5, cap:"A man's voice, through static. *“Vorobey. Sparrow. It is time.”*", enter(){ setTimeout(()=>evilVoice("vorobey sparrow it is time"), 300); }, draw(g,t){
        sky(g,"#0d0e18","#2a0a10"); g.fillStyle = "#b13e53"; for (let x=0;x<CW;x+=2){ const h = Math.sin(x*.15+t*20)*Math.sin(t*3+x*.02)*24*(Math.sin(t*1.7)+1.2); g.fillRect(x, 90-h/2, 1, Math.abs(h)+1); }
        R_(g,0,0,CW,CH,`rgba(0,0,0,${.15+.1*Math.sin(t*30)})`);
      }},
      {dur:5.5, sfx:"stinger", cap:`You were never just ${PNUMT}. Moscow put you inside Cellblock Nine on purpose. The escape was the plan. Millbrook was the wait.`, draw(g,t){
        sky(g,"#2a0a10","#5a1018"); for (let i=0;i<60;i++){ R_(g,(i*53+t*20)%CW,(i*37+t*30)%CH,1,1,"#f4f4f4"); }
        g.fillStyle = "#1a0a0e"; g.beginPath(); g.moveTo(40,150); for (const [x,y] of [[60,150],[60,110],[70,100],[80,110],[80,150],[110,150],[110,90],[118,70],[126,90],[126,150],[160,150],[160,120],[175,95],[190,120],[190,150],[230,150],[230,100],[245,80],[260,100],[260,150],[290,150]]) g.lineTo(x,y); g.lineTo(290,CH); g.lineTo(40,CH); g.fill();
        g.fillStyle = "#e0303a"; const sx = 175, sy = 60, r = 14 + Math.sin(t*2); g.beginPath(); for (let i=0;i<10;i++){ const a = -Math.PI/2 + i*Math.PI/5, rr = i%2 ? r*.42 : r; g.lineTo(sx+Math.cos(a)*rr, sy+Math.sin(a)*rr); } g.fill();
      }},
      {dur:5.5, cap:"Operation BIRCH: one of ours is held in Cellblock Nine under a false name. They don't know your face. They know one sentence.", draw(g,t){
        sky(g,"#2a1c14","#1a120c"); R_(g,50,20,220,140,"#c8a374"); R_(g,54,24,212,132,"#e8d4a8"); gText(g,"СОВЕРШЕННО СЕКРЕТНО",160,30,"#b13e53",7,"center");
        for (let i=0;i<12;i++){ const x = 66+(i%6)*32, y = 48+Math.floor(i/6)*50; R_(g,x,y,26,32,"#94b0c2"); R_(g,x+8,y+6,10,10,"#566c86"); R_(g,x+5,y+18,16,12,"#566c86"); R_(g,x,y+34,26,3,"#1a1c2c"); }
        if (t > 2){ gText(g,"?",160,150,"#b13e53",14,"center"); }
      }},
      {dur:5.5, cap:`*“${CODE_PHRASE_T}”* They will answer: *“${COUNTER_T}”*`, draw(g,t){
        sky(g,"#94b0c2","#e8f0f4"); R_(g,0,140,CW,40,"#f4f4f4");
        for (let i=0;i<9;i++){ const x = 20+i*34+(i%2)*6, h = 90+(i*13)%30; R_(g,x,140-h,5,h,"#f4f4f4"); for (let k=0;k<h;k+=9) R_(g,x+(k%2),140-h+k,3,2,"#1a1c2c"); g.fillStyle = "rgba(167,240,112,.6)"; g.beginPath(); g.arc(x+2,140-h,12,0,7); g.fill(); }
        for (let i=0;i<40;i++) R_(g,(i*41+t*15)%CW,(i*29+t*25)%CH,1,1,"#ffffff");
      }},
      {dur:5, cap:`Find Birch. Make contact. Get them out. You'll walk in as Officer ${badge}, and you will not get caught.`, draw(g,t){
        sky(g,"#ef7d57","#29366f"); R_(g,0,120,CW,60,"#4a4e5c"); R_(g,0,60,CW,60,"#333c57"); for (let x=0;x<CW;x+=12) R_(g,x,56,8,6,"#333c57");
        const bx = Math.min(130, -80 + t*70); R_(g,bx,100,80,26,"#ffcd75"); for (let w=0;w<5;w++) R_(g,bx+6+w*14,104,10,8,"#73eff7"); R_(g,bx+8,124,10,8,"#1a1c2c"); R_(g,bx+58,124,10,8,"#1a1c2c");
        gText(g,"OPERATION BIRCH",160,20,"#ffffff",11,"center");
      }}
    ];
  },
  nobodies(){
    const sp = T.spyE;
    return [
      {dur:3, cap:"TWO WEEKS LATER", enter(){ Snd.noise({dur:2.5,vol:.05,type:"highpass",f:3000}); }, draw(g,t){ R_(g,0,0,CW,CH,"#000"); for (let y=0;y<CH;y+=3) R_(g,0,y,CW,1,`rgba(255,255,255,${.03+.03*Math.random()})`); R_(g,0,(t*90)%CH,CW,6,"rgba(255,255,255,.08)"); gText(g,"▶ PLAY",20,14,"#f4f4f4",7); }},
      {dur:5, cap:`A stolen car, lights off on the county road. ${sp.short} in the passenger seat, not speaking.`, enter(){ slasherMusic(true); }, draw(g,t){
        sky(g,"#05050a","#140810"); g.fillStyle = "#f4ecd8"; g.beginPath(); g.arc(250,40,16,0,7); g.fill(); g.fillStyle = "#05050a"; g.beginPath(); g.arc(258,36,14,0,7); g.fill();
        R_(g,0,120,CW,60,"#0a0a10"); for (let i=0;i<8;i++){ const x = ((i*70 - t*140) % (CW+70) + CW+70) % (CW+70) - 30; treeC(g, x, 118, 2.2, "#06100a"); }
        R_(g,110,112,70,16,"#1a1c2c"); R_(g,124,104,40,10,"#1a1c2c"); R_(g,128,106,12,6,"#333c57"); R_(g,146,106,12,6,"#333c57"); R_(g,178,116,4,3,"#b13e53");
      }},
      {dur:5.5, cap:"WELCOME TO MILLBROOK", draw(g,t){
        sky(g,"#05050a","#1a0810"); R_(g,0,130,CW,50,"#0a0a10");
        R_(g,120,90,4,50,"#3e2a1c"); R_(g,80,70,90,34,"#0a0a10"); R_(g,82,72,86,30,"#1f3a24"); gVT(g,"WELCOME TO",90,72,"#94b0c2",12); gVT(g,"MILLBROOK",90,82,"#c8a374",14);
        const pop = Math.max(T.startAlive||20, 1) - Math.floor(Math.max(0, t-1.5)*3); gVT(g,`POP. ${t < 1.5 ? 212 : pop}`,124,92,t < 1.5 ? "#94b0c2" : "#ff3040",12);
        if (Math.random()<.08) R_(g,0,0,CW,CH,"rgba(255,0,0,.12)");
      }},
      {dur:4, enter(){ evilLaugh(); }, cap:"", draw(g,t){
        R_(g,0,0,CW,CH,"#000"); g.save(); g.translate(160,90); g.rotate(-.6); R_(g,-70,-6,120,12,"#c2d3dc"); R_(g,-70,-6,120,3,"#ffffff"); R_(g,50,-8,40,16,"#3e2a1c"); g.restore();
        const gl = (Math.sin(t*6)+1)/2; g.fillStyle = `rgba(255,255,255,${gl*.5})`; g.beginPath(); g.arc(120,70,3+gl*3,0,7); g.fill();
      }},
      {dur:5, hold:false, enter(){ setTimeout(evilLaugh, 400); sfx("stinger"); }, cap:"", draw(g,t){
        R_(g,0,0,CW,CH,"#000");
        const txt = ["LEAVE", "NO", "EVIDENCE"];
        txt.forEach((w,i)=>{ gText(g, w, 160, 40+i*36, "#c0141e", 20, "center"); for (let k=0;k<w.length;k++){ const x = 160 - w.length*10 + k*20 + 6, len = Math.min(26, Math.max(0, (t - .3*i)*12 + (k*7)%9)); R_(g, x, 40+i*36+20, 2, len, "#8a0a12"); } });
        if (Math.random()<.1) R_(g,0,0,CW,CH,"rgba(255,0,0,.08)");
      }}
    ];
  },
  russia(){
    const sp = T.spyE;
    return [
      {dur:5, enter(){ slasherMusic(false); Snd.track("soviet"); }, cap:"A private plane out of a county airstrip at dawn. Below, the Atlantic. Behind you, a town with no one left to tell it.", draw(g,t){
        sky(g,"#ffcd75","#73b8f7"); R_(g,0,130,CW,50,"#3b5dc9"); for (let i=0;i<20;i++) R_(g,(i*37 - t*30 + 400)%CW, 140+(i*11)%36, 10, 1, "#41a6f6");
        for (let i=0;i<4;i++){ const x = (i*90 - t*20 + 400)%400 - 40; R_(g,x,40+i*14,40,8,"#ffffff"); R_(g,x+8,34+i*14,22,6,"#ffffff"); }
        const px = 120 + Math.sin(t)*6, py = 80 + Math.sin(t*1.3)*4; R_(g,px,py,60,10,"#f4f4f4"); R_(g,px+50,py-4,14,6,"#f4f4f4"); R_(g,px+16,py-12,8,34,"#d8d6cf"); R_(g,px+4,py+2,46,3,"#b13e53"); for (let w=0;w<5;w++) R_(g,px+12+w*7,py+3,3,3,"#29366f");
      }},
      {dur:5.5, cap:"Moscow. The snow is early this year.", draw(g,t){
        sky(g,"#566c86","#c2d3dc"); R_(g,0,140,CW,40,"#f4f4f4");
        const dome = (x,y,r,c) => { g.fillStyle = c; g.beginPath(); g.arc(x,y,r,Math.PI,0); g.lineTo(x,y-r*1.9); g.fill(); R_(g,x-r,y,r*2,40,"#b13e53"); R_(g,x-1,y-r*2.4,2,6,"#ffcd75"); };
        dome(70,110,14,"#38b764"); dome(110,100,18,"#ffcd75"); dome(150,110,14,"#3b5dc9"); dome(190,95,20,"#b13e53"); dome(230,110,14,"#38b764");
        R_(g,40,140,240,4,"#b13e53"); for (let i=0;i<80;i++) R_(g,(i*41+t*10)%CW,(i*29+t*40)%CH,1,1,"#ffffff");
      }},
      {dur:6, cap:`A room without windows. Two medals, two glasses of something clear. ${sp ? sp.short : "Birch"} raises a glass to you. *“Za nas. To us, Sparrow. And to Millbrook.”*`, draw(g,t){
        sky(g,"#2a1c14","#140c0a"); R_(g,0,120,CW,60,"#3e2a1c"); R_(g,60,100,200,10,"#5e3a24");
        drawPerson(g, 120, 82, T.player.look, [1,0], 0, {}); if (sp) drawPerson(g, 180, 82, sp.look, [-1,0], 0, {});
        R_(g,138,90,3,6,"#c2f0ff"); R_(g,176,90,3,6,"#c2f0ff"); R_(g,124,86,4,4,"#ffcd75"); R_(g,184,86,4,4,"#ffcd75");
        g.fillStyle = "#e0303a"; const sx = 160, sy = 40; g.beginPath(); for (let i=0;i<10;i++){ const a = -Math.PI/2 + i*Math.PI/5, rr = i%2 ? 5 : 12; g.lineTo(sx+Math.cos(a)*rr, sy+Math.sin(a)*rr); } g.fill();
      }},
      {dur:4, cap:"MISSION COMPLETE", enter(){ sfx("fanfare"); }, draw(g,t){ R_(g,0,0,CW,CH,"#5a1018"); gText(g,"MISSION COMPLETE",160,70,"#ffcd75",14,"center"); gVT(g,`${T.slashKills||0} in Millbrook · ${T.stats.kills||0} in all`,160,100,"#f4ecd8",16,"center"); }}
    ];
  }
});
const CODE_PHRASE_T = "The birch trees are early this year.", COUNTER_T = "Only in Leningrad.";
function evilVoice(text){ const v = {base:88, wave:"sawtooth", range:3, len:.08, slide:.9, formant:.8, speed:.8}; let t = 0; for (let i=0;i<text.length;i++){ const ch = text[i]; if (/[a-z]/.test(ch)) Snd.voice(v, ch, {at:t, vol:.8, contour:contourAt(text, i)}); t += ch===" " ? .06 : .07; } }
Object.assign(Snd.TRACKS, {
  soviet:{bpm:96, prog:[[57,60,64],[52,55,59],[53,57,60],[52,56,59]], lead:"square", bass:"triangle", drums:"soft", rest:.3, seed:917, oct:12, arp:true, vol:.9}
});

// ---------- how part four ends ----------
function slasherEnding(kind, opt={}){
  T.ending = kind; closeTalkT(); closeTWindows(); if (GAME) closeGame(); slasherMusic(false); Snd.track(null);
  const won = kind==="russia";
  sfx(won ? "fanfare" : "sad");
  const sp = T.spyE ? T.spyE.short : "Birch";
  const txt = {
    russia:["HERO OF NOTHING", `Millbrook is empty. No witnesses, no phone calls, no one to say a newcomer ever came back. In Moscow, two people who never existed are given medals in a room with no windows. ${sp} keeps theirs in a drawer. You wear yours.`],
    slasher_escaped:["ONE GOT AWAY", `${opt.who || "Someone"} made it out by ${opt.how || "the road"}. By dawn the state police are at the town line, and by noon your face is on every television in the country. ${sp} is taken at a roadblock. You are taken at the pond, still holding the knife.`],
    slasher_police:["SIRENS", `The state police roll into Millbrook just before dawn. They find the bodies before they find you, but not by much. ${sp} is pulled out of a hiding place without a fight.`],
    slasher_spy:["BIRCH IS DEAD", "They found the one person you were supposed to keep safe. Moscow will not ask what happened. Moscow already knows."],
    slasher_caught:["CUFFED IN THE DIRT", `The sheriff's knee is in your back and his revolver is in your ear. The last thing you hear before the car door slams is ${sp}, somewhere behind you, saying your real name.`]
  }[kind] || ["IT'S OVER", ""];
  const sc = $("tScreen"); sc.textContent = ""; sc.hidden = false;
  const box = document.createElement("div"); box.className = "ending";
  box.append(Object.assign(document.createElement("div"),{className:"eyebrow", textContent:`${won ? "MISSION COMPLETE" : "MISSION FAILED"} · LEAVE NO EVIDENCE`}), Object.assign(document.createElement("h1"),{className:"title", textContent:txt[0]}), Object.assign(document.createElement("p"),{textContent:txt[1]}));
  const note = document.createElement("div"); note.className = "note2";
  note.append(Object.assign(document.createElement("b"),{textContent:"MILLBROOK"}));
  const left = folk.filter(alive);
  note.append(Object.assign(document.createElement("span"),{textContent:`${T.slashKills||0} on this visit. ${T.stats.kills||0} in all. ${left.length} left alive${left.length ? ": "+left.map(n=>n.first).join(", ") : ""}.`}));
  for (const k of (T.slashLog||[]).slice(-14)) note.append(Object.assign(document.createElement("span"),{textContent:`${k.name}, the ${k.job} · ${k.where}`}));
  box.append(note);
  const row = document.createElement("div"); row.className = "row";
  if (!won){ const again = Object.assign(document.createElement("button"),{type:"button", className:"bigbtn", textContent:"Try again"}); again.addEventListener("click", ()=>{ let info = {}; try { info = JSON.parse(localStorage.getItem(SLASH_INFO)||"{}"); } catch {} sc.hidden = true; T.ending = null; beginSlasher(info); }); row.append(again); }
  const title = Object.assign(document.createElement("button"),{type:"button", className:"bigbtn alt", textContent:"Title screen"}); title.addEventListener("click", ()=>{ if (won){ try { localStorage.removeItem(SNAP_KEY); localStorage.removeItem(SLASH_INFO); } catch {} } clearSaveT(); toTitle(); });
  row.append(title); box.append(row); sc.append(box);
  if (won){ try { localStorage.removeItem(SNAP_KEY); } catch {} }
  clearSaveT();
  document.body.classList.remove("slasher");
}
