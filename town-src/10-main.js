// Main: starting a new life, the clock, the player, interactions, events, rendering, input.
const MIN_PER_SEC = 2.2;   // a Millbrook day lasts about 11 real minutes
const TRAINS = [8*60, 14*60, 19*60];

// ---------- extra sounds and music for town ----------
Object.assign(Snd.fx, {
  camera(){ Snd.noise({dur:.03,vol:.12,type:"highpass",f:4000}); Snd.tone({f:1800,dur:.04,vol:.04,at:.03}); Snd.noise({dur:.08,vol:.06,type:"bandpass",f:900,at:.06}); },
  creak(){ Snd.tone({f:180,f2:120,dur:.5,vol:.05,type:"sawtooth",filter:{f:700,q:6}}); Snd.tone({f:230,f2:160,dur:.35,vol:.035,type:"sawtooth",filter:{f:900,q:8},at:.4}); },
  scream(){ Snd.tone({f:700,f2:1100,dur:.25,vol:.07,type:"sawtooth",filter:{f:2400}}); Snd.tone({f:1100,f2:600,dur:.5,vol:.06,type:"sawtooth",filter:{f:2000},at:.22}); },
  splash(){ Snd.noise({dur:.5,vol:.18,type:"lowpass",f:1600,f2:300}); Snd.tone({f:300,f2:90,dur:.3,vol:.06,type:"sine"}); },
  stinger(){ Snd.tone({f:Snd.mf(70),dur:1.2,vol:.1,type:"sawtooth",filter:{f:1800}}); Snd.tone({f:Snd.mf(71),dur:1.2,vol:.08,type:"sawtooth",filter:{f:1800}}); Snd.tone({f:Snd.mf(46),dur:1.4,vol:.14,type:"square",filter:{f:400}}); Snd.noise({dur:.6,vol:.1,type:"highpass",f:3000}); },
  train(){ Snd.tone({f:Snd.mf(69),dur:.9,vol:.06,type:"square",filter:{f:1200}}); Snd.tone({f:Snd.mf(73),dur:.9,vol:.05,type:"square",filter:{f:1200}}); Snd.tone({f:Snd.mf(76),dur:.9,vol:.04,type:"square",filter:{f:1200}}); },
  gunshot(){ Snd.noise({dur:.35,vol:.4,type:"lowpass",f:2400,f2:200}); Snd.noise({dur:.06,vol:.35,type:"highpass",f:1500}); Snd.tone({f:90,f2:40,dur:.3,vol:.2,type:"sine"}); Snd.noise({dur:1.2,vol:.05,type:"bandpass",f:500,at:.15}); },
  knock(){ for (let i=0;i<3;i++) Snd.noise({dur:.05,vol:.16,f:600,at:i*.16}); },
  church(){ for (let i=0;i<3;i++){ Snd.tone({f:392,dur:2,vol:.08,type:"sine",at:i*1.2}); Snd.tone({f:392*2.76,dur:.8,vol:.02,type:"sine",at:i*1.2}); } }
});
Object.assign(Snd.TRACKS, {
  town:{bpm:96, prog:[[60,64,67],[65,69,72],[57,60,64],[62,65,69]], lead:"triangle", bass:"triangle", drums:"soft", rest:.4, seed:41, oct:12, vol:1},
  townnight:{bpm:66, prog:[[57,60,64],[53,57,60],[55,59,62],[52,55,59]], lead:"sine", bass:"sine", drums:"none", rest:.6, seed:53, oct:12, arp:true, pad:true, vol:1.1},
  tense:{bpm:84, prog:[[57,60,64],[56,60,63],[53,57,60],[52,56,59]], lead:"sine", bass:"sine", drums:"heart", rest:.72, seed:61, oct:0, pad:true, vol:1.1},
  dance:{bpm:120, prog:[[55,59,62],[60,64,67],[62,66,69],[55,59,62]], lead:"square", bass:"square", drums:"pop", rest:.2, seed:71, oct:12, arp:true, vol:.8},
  cutscene:{bpm:80, prog:[[57,60,64],[53,57,60],[60,64,67],[55,59,62]], lead:"triangle", bass:"sine", drums:"none", rest:.45, seed:83, oct:12, pad:true, arp:true, vol:1}
});

// ---------- starting out ----------
const TOWN = window.TOWN = {active:false, begin, cont, frame, beginSlasher};
function freshState(){
  return {v:1, day:1, t:7*60+30, alias:"Sam Ellis", money:40, rel:{}, folk:[], det:null, containers:{}, news:[], tasks:[], appts:[], debts:[], secrets:[], warnings:[], clues:[], suspects:{}, seenHabits:{}, gazette:[], mail:[], letters:[], highscores:{}, workDone:{},
    stains:[], bodies:[], graves:[], missing:[], litter:[], unlocked:{}, fx:[], acts:{}, notoriety:0, drunk:0, weather:"clear", event:null, rentPaid:3, lock:null, wanted:false, ending:null,
    stats:{kills:0, gifts:0, lines:0, trades:0, favors:0, fish:0, darts:0, cards:0, arcade:0, dances:0, jobs:0, tickets:0, dates:0, burned:0, looted:0, stolen:0},
    player:null, sel:null, talkId:null, openBox:null};
}
function begin(){
  Snd.init();
  const prison = E.prisonState();
  T = freshState();
  buildTown(); tmapDirty = true;
  genTown();
  T.containers = makeContainers();
  // the traveling salesman can get you papers, for a price
  const sales = folk.find(n=>n.job.includes("salesman")); if (sales) sales.inv.push("fake ID");
  const junk = Object.keys(T.containers).filter(k=>T.containers[k].name==="Junk pile"); if (junk.length) T.containers[pick(junk)].items.push("lockpick");
  const back = Object.keys(T.containers).find(k=>T.containers[k].bid==="barback" && T.containers[k].name==="Wardrobe"); if (back) T.containers[back].items.push("shotgun","bullets","bullets","bullets");
  for (const n of folk) n.suitCols = E.SUITS["t_"+n.id];
  // you: a borrowed shirt off a clothesline, and the jumpsuit stuffed in a bag
  E.SUITS.t_player = ["#7a6a5a","#5a4a3a","#9a8a7a"];
  const look = {suit:"t_player", civ:true, skin:"#d49a6a", hair:"#3f2616", style:"short", pants:"#29366f"};
  const carry = [];
  if (prison && prison.player){ for (const it of prison.player.inv){ if (it==="cigarettes"){ T.money += 1; continue; } if (["dirt","toilet paper","bedsheet","dummy"].includes(it)) continue; carry.push(it); } }
  T.player = {x:82, y:30, fx:82, fy:30, prog:1, dir:[0,-1], walkT:0, inv:["prison jumpsuit","room key"], hp:100, fight:null, carrying:null, disguise:{}, wearJumpsuit:false, look, baseStyle:"short", suitCols:E.SUITS.t_player};
  for (const it of carry) if (canAddT(T.player.inv, it)) T.player.inv.push(it);
  T.mail.push({from:"A friend", text:`I heard you made it out. Don't write back. They read everything. Burn this. — R.`});
  writeBiosT();
  showTownDom(true);
  TOWN.active = true; document.body.classList.add("in-town");
  playCutscene("intro", () => {
    if (T.usedRealName) toast("The hotel keeper writes your real name in the ledger in neat capitals.", "bad", 6);
    banner("MILLBROOK", `${dayName()} morning. Population 212. Plus you.`, false, 5);
    const tip = (txt, ms, secs) => setTimeout(()=>{ if (TOWN.active && T && !T.mode && !T.ending) toast(txt, "", secs); }, ms);
    tip("Talk to anyone (E). Make friends, take odd jobs, play games. Someone in town is not who they say they are.", 5200, 9);
    tip("Get rid of that jumpsuit. Watch for habits. Keep your story straight.", 15000, 7);
    const hk = folk.find(n=>n.job==="hotel keeper"); if (hk){ hk.x = hk.fx = 82; hk.y = hk.fy = 26; hk.order = {type:"approach", reason:"Welcome the new guest of Room C to the Millbrook Arms. Their first two nights are paid; rent is $15 a night after that, at the front desk. Ask their name for the ledger.", until:absT()+40}; }
    lastHourT = hourNow(); saveT(); renderHotbarT();
  });
}
function cont(){
  Snd.init();
  const s = loadSavedT(); if (!s) return false;
  T = s; buildTown(); tmapDirty = true; folk = T.folk;
  for (const n of folk){ if (n.suitCols) E.SUITS["t_"+n.id] = n.suitCols; n.scene = null; n.path = []; n.talkingToPlayer = false; n.bubble = null; n.emote = null; n.repath = 0; n.chatCd = 0; n.approachCd = 0; n.freeUntil = 0; }
  E.SUITS.t_player = T.player.suitCols || ["#7a6a5a","#5a4a3a","#9a8a7a"];
  T.talkId = null; T.game = null; T.cutscene = null; T.aiSceneBusy = false; T.fx = []; T.openBox = null;
  scenesT.length = 0;
  showTownDom(true);
  TOWN.active = true; document.body.classList.add("in-town");
  lastHourT = hourNow();
  if (T.mode==="slasher"){ document.body.classList.add("slasher"); slasherMusic(true); banner("LEAVE NO EVIDENCE", `${folk.filter(alive).length} left.`, true, 3); renderHotbarT(); return true; }
  banner(dayName().toUpperCase(), `Day ${T.day} in Millbrook`, false, 3);
  if (T.lock && T.lock.kind==="arrest") setTimeout(()=>showArrestChoice(), 600);
  renderHotbarT();
  return true;
}
function showTownDom(on){
  for (const id of ["tHud","tHotbar"]) $(id).hidden = !on;
  for (const id of ["scrTitle","scrWin","scrSolitary","winMenu"]) if ($(id)) $(id).hidden = true;
  $("dialog").hidden = true; document.body.classList.remove("talking");
}
function leaveTown(newSentence){
  TOWN.active = false; clearSaveT();
  if (newSentence){ try { localStorage.removeItem("cellblock9-save-v4"); } catch {} }
  location.reload();
}

// ---------- the clock ----------
let lastHourT = -1;
function advanceTimeT(mins){
  let left = mins;
  while (left > 0){
    const step = Math.min(left, 60 - (T.t % 60) || 60);
    T.t += step; left -= step;
    if (T.t >= 1440){ T.t -= 1440; T.day += 1; }
    const h = hourNow(); if (h !== lastHourT){ lastHourT = h; onHourT(h); }
  }
}
function tickClock(dt){
  T.t += dt * MIN_PER_SEC;
  if (T.t >= 1440){ T.t -= 1440; T.day += 1; }
  const h = hourNow(); if (h !== lastHourT){ lastHourT = h; onHourT(h); }
}
function onHourT(h){
  if (T.ending) return;
  if (h===6) newDayT();
  if (h===7 && T.mode!=="slasher") printGazette();
  if (h===8){ missingCheck(); if (T.mode!=="slasher"){ rentCheck(); if (T.day >= 12 && !T.lock && !T.ending) dayTwelve(); } }
  if (h===9 && dayName()==="Sunday") sfx("church");
  crimeHourTick(); if (T.mode!=="slasher"){ townLifeTick(); recognitionTick(); }
  if (T.drunk > 0) T.drunk = Math.max(0, T.drunk-1);
  if (T.notoriety > 0 && !T.wanted) T.notoriety = Math.max(0, T.notoriety - .5);
  // the case goes cold if you give it nothing
  const D = T.det; if (D && detAlive()){ const recent = D.evidence.filter(e=>e.kind!=="timing").slice(-1)[0]; if (h===23 && (!recent || !String(recent.s).includes(`day ${T.day})`))) D.suspicion = Math.max(0, D.suspicion - 3); }
  if (T.debts.some(d=>!d.paid && T.day-d.day >= 4) && h===12){ const d = T.debts.find(x=>!x.paid && T.day-x.day >= 4); const n = byIdT(d.who); if (n && alive(n)){ n.opinion = clamp(n.opinion-5,-100,100); gossipT(n, `The newcomer owes me $${d.amount} and won't pay up.`); } }
  saveT();
}
function newDayT(){
  const dn = dayName();
  T.weather = Math.random() < .22 ? "rain" : "clear";
  let ev = null;
  if (T.funeral && T.funeral.day===T.day) ev = {kind:"funeral", label:"FUNERAL", text:`Funeral for ${nmT(T.funeral.who)} at St. Ambrose, 10am.`};
  else if (T.day===2) ev = {kind:"poster", label:"WANTED", text:`WANTED posters went up in the square and the post office: escaped convict ${PNUMT}.`};
  else if (dn==="Wednesday") ev = {kind:"market", label:"MARKET DAY", text:"Market day in the square, nine till one."};
  else if (dn==="Thursday") ev = {kind:"garbage", label:"BIN DAY", text:"The garbage truck comes through at seven. Dumpsters get emptied."};
  else if (dn==="Saturday") ev = {kind:"dance", label:"BARN DANCE", text:"Barn dance tonight at the old barn, 8pm. Everybody's going."};
  else if (dn==="Sunday") ev = {kind:"church", label:"SUNDAY", text:"Sunday service at St. Ambrose at nine."};
  if (T.bodies.some(b=>b.discovered && T.day - (b.foundDay||0) <= 1)) ev = {kind:"curfew", label:"CURFEW", text:"The sheriff has called a curfew: everyone indoors after 8pm."};
  T.event = ev ? Object.assign({day:T.day}, ev) : {day:T.day, kind:"none", text:""};
  if (ev) { newsT(ev.text, [], true, "event"); banner(ev.label, ev.text, ev.kind==="curfew", 5); }
  if (T.weather==="rain") toast("Rain drums on the roof of the Millbrook Arms.", "", 4);
  if (Math.random() < .35) T.mail.push(pick([{from:"Millbrook Library", text:"A reminder that your library card application is 'pending'. Please bring two forms of identification."},{from:"Unknown", text:"We know you're there. Stay low. — a friend from the inside"},{from:"Hartley's General", text:"COUPON: 10% off bleach and rope this week! (Not valid with other offers.)"},{from:"The Millbrook Arms", text:"Kindly note: rent is payable nightly at the front desk."}]));
  for (const n of folk) if (alive(n)){ n.mood = n.mood==="grieving" && Math.random()<.5 ? "grieving" : pick(["fine","cheerful","tired","busy","chatty","grumpy","fine"]); n.habitKnow = null; }
  // creepy: sometimes you wake up and something has moved
  const D = T.det; if (D && detAlive() && D.suspicion >= 55 && insideOf(T.player)==="roomC" && Math.random() < .3){ const tell = TELLS.find(t=>t.id===pick(detP().tells)); setTimeout(()=>{ toast(`You wake up. The chair has been turned to face your bed. ${tell.clue} on the seat.`, "bad", 8); sfx("stinger"); T.clues.push({s:stampT(), text:`Morning: the chair turned to face my bed. ${tell.clue}.`, tell:tell.id}); }, 1500); D.notes.push({s:stampT(), text:"Watched them sleep. They talk in their sleep. Numbers."}); addEvidence("They mumble a prison number in their sleep.", 6, "sleep"); }
}
function rentCheck(){
  if (T.day <= T.rentPaid) return;
  const hk = folk.find(n=>n.job==="hotel keeper" && alive(n));
  if (T.day > T.rentPaid + 2 && T.player.inv.includes("room key")){
    removeItemT("room key"); T.evicted = true; toast("The hotel keeper changed your lock. Pay what you owe at the front desk to get back in.", "bad", 7);
    for (const k of ["89,15","89,19"]){ const box = T.containers[k]; if (hk && box) for (const it of box.items.splice(0)) hk.inv.push(it); }
    newsT("The newcomer was locked out of Room C for not paying rent.", hk ? [hk.id] : []);
    if (hk) addEvidenceVia(hk, `${hk.first} cleared out Room C. Found: ${hk.inv.filter(isEvidence).join(", ") || "nothing odd"}.`, hk.inv.some(isEvidence) ? 15 : 2);
  } else if (hk && !hk.order) hk.order = {type:"approach", reason:`The newcomer is behind on rent ($15 a night, owed since day ${T.rentPaid+1}). Remind them, politely or not.`, until:absT()+120};
}
function dayTwelve(){
  const D = T.det;
  if (!detAlive()) { ending("dark"); return; }
  if (D.suspicion < 50){ ending("new_life"); return; }
  arrestSequence("Day twelve. The Bureau wants an answer, and the answer is you.");
}
// People who saw the WANTED poster may recognize you.
function recognitionTick(){
  if (T.day < 2 || T.wanted) return;
  const pl = T.player, disg = (pl.disguise.hat?1:0) + (pl.disguise.glasses||pl.disguise.shades?1:0) + (pl.disguise.cut ? 1 : 0) + (pl.disguise.dye ? 1 : 0);
  for (const n of folk){
    if (!alive(n) || n.asleep || !n.seenPoster || n.recognized || n.partner) continue;
    if (distT(n, pl) > 4 || !canSeeT(n, pl.x, pl.y, 5)) continue;
    const ch = Math.max(0, .1 - disg*.03) * (n.traits.includes("nosy") || n.nosy ? 2 : 1) * (pl.wearJumpsuit ? 4 : 1);
    if (Math.random() > ch) continue;
    n.recognized = true; rememberT(n, "The newcomer looks a LOT like the face on that WANTED poster.");
    sayT(n, "*squints at you* …Huh.", 3); emoteT(n, "!", 2);
    if (n.opinion < 30 && !n.coverFor){ n.order = {type:"report", what:"poster", about:"player", until:absT()+150}; gossipT(n, "The newcomer looks just like that escaped convict on the poster. I'm telling the sheriff."); }
    else gossipT(n, "Funny, the newcomer looks a bit like that man on the poster. Can't be, though.");
    addEvidenceVia(n, `${n.first} thinks the newcomer matches the WANTED poster.`, n.opinion < 30 ? 12 : 5);
  }
}
function trainHere(){ const t = T.t; return TRAINS.find(d => t >= d-12 && t <= d+3); }

// ---------- the player ----------
const heldT = [];
let actionHeldT = false, holdT = null, hintAtT = 0, stepAlt = 0;
const KEYDIR_T = {arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0],up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
function updatePlayerT(dt){
  const pl = T.player;
  const speed = (pl.carrying ? 2.6 : 5.4) * (T.drunk >= 5 ? .8 : 1) * (T.lock && T.lock.kind==="chase" ? 1.08 : 1);
  if (pl.prog < 1){ pl.prog = Math.min(1, pl.prog + dt*speed); pl.walkT += dt*speed; if (pl.prog >= 1) arrivedT(); return; }
  T.acts = {};
  if (actionHeldT && !T.talkId){ const tg = interactTargetT(); if (tg && tg.hold){ holdTick(tg, dt); return; } }
  holdT = null;
  if (!heldT.length) return;
  let d = KEYDIR_T[heldT[heldT.length-1]];
  if (T.drunk >= 4 && Math.random() < .12*T.drunk/8) d = pick(DIRS4);
  pl.dir = d;
  const nx = pl.x+d[0], ny = pl.y+d[1], c = tileT(nx,ny);
  if (c==="D" && doorLockedT(nx,ny,pl)){
    if (performance.now() > hintAtT){ hintAtT = performance.now()+2600; sfx("door"); const bid = DOOR_AT[nx+","+ny], bd = bById(outerOf(bid)); toast(bid==="roomC" ? (T.evicted ? "Your key doesn't fit anymore." : "Locked. You need your room key.") : bd && bd.kind==="home" ? "Locked. Knock (E), or pick it." : bd && bd.hours ? `Closed. Open ${bd.hours[0]}:00 to ${bd.hours[1]%24}:00.` : "Locked."); }
    return;
  }
  if (WALK_T.has(c)){ stepT(pl, d[0], d[1]); stepAlt++; if (stepAlt%2) sfx("step", "gGuvpUb".includes(c)); }
}
function arrivedT(){
  const pl = T.player, here = insideOf(pl);
  if (here!==T.lastInside){
    const prev = T.lastInside; T.lastInside = here;
    if (here==="roomC") enteredRoom();
    if (here && SHOPS[here] && !prev) { const k = shopKeeper(here); if (k && Math.random()<.5) sayT(k, pick(["Welcome in!","Afternoon.","Let me know if you need anything.","Oh, hello."]), 2.5); }
  }
  if (pl.carrying && Math.random() < .25) addStain(pl.x, pl.y);
  // the platform and the edge of the world
  if (pl.x <= 1 && pl.y >= 29 && pl.y <= 32 && !T.edgeWarned){ T.edgeWarned = true; toast("The road west. Press E to walk out of Millbrook for good.", "", 4); }
  if (pl.x > 3) T.edgeWarned = false;
  // seeing the poster
  if (T.day >= 2) for (const n of folk) if (!n.seenPoster && alive(n) && (insideOf(n)==="post" || (n.x>=32&&n.x<=46&&n.y>=34&&n.y<=46))) n.seenPoster = true;
}
function enteredRoom(){
  const d = detP();
  if (T.roomDisturbed){
    const r = T.roomDisturbed; T.roomDisturbed = null;
    setTimeout(()=>{
      sfx("stinger"); T.shake = .25;
      toast(`Someone has been in your room. ${r.clue}.`, "bad", 7);
      T.clues.push({s:stampT(), text:`My room was searched. ${r.clue}.`, tell:r.tell});
      if (r.took) setTimeout(()=>toast(`Your ${r.took} is gone.`, "bad", 6), 2500);
      if (r.note) setTimeout(()=>toast("A folded note sits on your footlocker.", "bad", 6), 4500);
    }, 400);
  }
  if (d && d.hidden && T.det.hiding){ setTimeout(()=>{ if (d.hidden) toast(pick(["The wardrobe door is open a crack. You closed it this morning. Didn't you?","It smells faintly of "+TELLS.find(t=>t.id===d.tells[0]).clue.toLowerCase().replace(/^a |^the |^someone /,"")+" in here.","You have the strangest feeling you're not alone."]), "", 6); }, 1200); }
}
function holdTick(tg, dt){
  if (!holdT || holdT.key!==tg.key){ holdT = {key:tg.key, prog:0, fxT:0}; }
  holdT.prog += dt / tg.secs; holdT.fxT -= dt;
  if (tg.act) T.acts[tg.act] = true;
  if (holdT.fxT <= 0){ holdT.fxT = tg.fxEvery || .35; if (tg.sound) sfx(tg.sound); }
  if (holdT.prog >= 1){ holdT = null; actionHeldT = false; tg.done(); saveT(); }
}

// ---------- what E does right now ----------
function interactTargetT(){
  const pl = T.player, [fx,fy] = facingT(), c = tileT(fx,fy), here = insideOf(pl), k = fx+","+fy;
  const box = T.containers[k];
  // carrying a body
  if (pl.carrying){
    const b = T.bodies.find(x=>x.id===pl.carrying), first = b ? b.name.split(" ")[0] : "them";
    const spot = hideSpotFacing();
    if (spot) return {kind:"hidebody", label:`Hide ${first} in the ${spot.name.toLowerCase()}`, run:()=>dropBody(spot)};
    const grave = T.graves.find(g=>g.x===fx && g.y===fy && g.open);
    if (grave) return {kind:"bury", key:"bury"+k, label:`Hold: bury ${first}`, hold:true, secs:4, act:"digging", sound:"dig", done:()=>{ grave.open = false; grave.body = b.id; dropBody({key:"grave:"+fx+","+fy, name:"grave"}); }};
    return {kind:"drop", label:`Put ${first} down (Q)`, run:()=>dropBody(null)};
  }
  // people
  const n = folk.find(o=>alive(o) && !o.away && !o.hidden && Math.round(rposT(o)[0])===fx && Math.round(rposT(o)[1])===fy) || nearestFolk(1.15);
  if (n && !(T.lock && T.lock.kind==="chase")){
    if (n.asleep) return {kind:"wake", label:`Wake ${n.met ? n.first : "them"}`, run:()=>openTalkT(n)};
    if (n.scene && n.scene.kind==="interview") return {kind:"listen", label:"Eavesdrop", run:()=>toast(`${n.first} goes quiet when you walk up.`, "", 3)};
    return {kind:"talk", npc:n, label:`Talk to ${n.met ? n.first : "the "+n.job}`, run:()=>openTalkT(n)};
  }
  // bodies on the ground
  const body = T.bodies.find(b=>!b.hidden && !b.carried && ((b.x===fx && b.y===fy) || (b.x===pl.x && b.y===pl.y)));
  if (body) return {kind:"body", label:`Search ${body.name.split(" ")[0]}`, run:()=>openBoxT("body:"+body.id)};
  // blood
  const st = stainHere();
  if (st && (pl.inv.includes("mop") || pl.inv.includes("bleach"))) return {kind:"clean", key:"clean"+st.x+","+st.y, label:"Hold: scrub the stain", hold:true, secs:pl.inv.includes("bleach") ? 3 : 5, act:"cleaning", sound:"cut", done:()=>{ st.cleaned = true; if (pl.inv.includes("bleach") && Math.random()<.5) removeItemT("bleach"); toast("Clean. Mostly.", "good", 2); T.stats.cleaned = (T.stats.cleaned||0)+1; }};
  // doors
  if (c==="D" && doorLockedT(fx,fy,pl)){
    const bid = DOOR_AT[k], bd = bById(outerOf(bid));
    if (bid==="roomC" && T.evicted) return {kind:"locked", label:"Locked out", run:()=>toast("Pay your rent at the front desk.", "", 3)};
    const tool = pl.inv.includes("lockpick") ? "lockpick" : pl.inv.includes("wire") ? "wire" : pl.inv.includes("paperclip") ? "paperclip" : null;
    if (tool && bid!=="jail") return {kind:"pick", key:"pick"+k, label:`Hold: pick the lock`, hold:true, secs:tool==="lockpick" ? 3 : 6, act:"picking", sound:"pick", fxEvery:.18, done:()=>{ T.unlocked[k] = absT()+120; sfx("unlock"); toast("Click.", "good", 2); if (Math.random() < (tool==="lockpick" ? .2 : .5)){ removeItemT(tool); sfx("snap"); toast(`Your ${tool} snapped.`, "bad", 3); } const res = bd && residentsOf(bd.id).find(r=>alive(r) && buildingAt(r.x,r.y)===bd.id && !r.asleep); if (res){ rememberT(res, "Someone was picking my front door lock!"); res.order = {type:"report", what:"theft", about:"player", text:"someone tried to break into my house", until:absT()+120}; } }};
    if (bd && bd.kind==="home") return {kind:"knock", label:"Knock", run:()=>knockT(bd, k)};
    return null;
  }
  if (T.mode==="slasher"){
    const s = T.spyE;
    if (s && !s.hidden && !s.dead && ((Math.round(rposT(s)[0])===fx && Math.round(rposT(s)[1])===fy) || Math.hypot(s.x-pl.x, s.y-pl.y) < 1.2)) return {kind:"spy", label:`Talk to ${s.short}`, run:spyMenu};
    if (s && s.hidden && s.hideKey && (s.hideKey===k || (s.hideKey===here && Math.hypot(s.x-pl.x, s.y-pl.y) < 2))) return {kind:"spy", label:`Whisper to ${s.short}`, run:spyMenu};
    if (here==="post" && !T.phonesCut && "CH".includes(c)) return {kind:"cut", key:"cutphones", label:"Hold: rip out the phone exchange", hold:true, secs:4, act:"robbing", sound:"cut", done:cutPhones};
    if (here==="sheriff" && fx===59 && fy===24 && !T.radioSmashed) return {kind:"radio", key:"radio", label:"Hold: smash the sheriff's radio", hold:true, secs:3, sound:"punch", done:()=>{ T.radioSmashed = true; toast("Sparks, then nothing. The sheriff can't call anyone now.", "good", 4); sfx("snap"); }};
  }
  // furniture
  if (box) return {kind:"box", label: box.mine ? "Open your footlocker" : `Open the ${box.name.toLowerCase()}`, run:()=>openBoxT(k)};
  if (here==="roomC" && fx===86 && fy===15) return {kind:"sleep", label: hourNow()>=20 || hourNow()<6 ? "Sleep until morning" : "Nap for two hours", run:sleepT};
  if (c==="%" && here==="bar") return {kind:"darts", label:"Throw darts", run:()=>startDarts(null)};
  if (c==="Q" && here==="bar") return {kind:"cards", label:"Play blackjack", run:()=>startCards(null)};
  if (c==="A" && here==="arcade") return {kind:"arcade", label:"Play Brick Breaker ($1)", run:()=>startArcade(null)};
  if (c==="w" && pl.inv.includes("fishing rod")) return {kind:"fish", label:"Fish", run:()=>startFishing(folk.find(o=>alive(o) && o.hobbies.includes("fishing") && distT(o,pl) < 4 && o.opinion >= 10) || null)};
  if (c==="N") return {kind:"board", label: T.day >= 2 && !T.posterDown ? "Read the notice board (WANTED poster)" : "Read the notice board", run:readBoard};
  if (c==="o") return {kind:"fountain", label:"Toss a coin in the fountain ($1)", run:()=>{ if (T.money < 1) return; addMoney(-1); sfx("splash"); toast(pick(["Plink. You wish for a quiet life.","Plink. You wish nobody looks too closely.","Plink. You wish you'd never had to run."]), "", 4); if (Math.random()<.1){ T.player.hp = 100; toast("You feel oddly lucky.", "good"); } }};
  if (c==="+" && here==="church") return {kind:"pray", label:"Pray", run:()=>{ advanceTimeT(10); toast(pick(["The candles flicker. You feel a little lighter.","You ask for forgiveness. The silence doesn't answer.","For a moment, nobody is looking for you."]), "", 4); T.notoriety = Math.max(0, T.notoriety-1); }};
  if (c==="j") return {kind:"juke", label:"Play the jukebox ($1)", run:()=>{ if (T.money < 1) return; addMoney(-1); sfx("fanfare"); for (const o of folk) if (alive(o) && insideOf(o)===here) o.mood = "cheerful"; toast("The jukebox plays an old love song.", "good", 3); }};
  // dancing on dance night
  if (here==="barn" && T.event && T.event.kind==="dance" && hourNow() >= 20 && hourNow() < 24) return {kind:"dance", label:"Dance!", run:()=>startDance(folk.find(o=>o.partner && alive(o) && insideOf(o)==="barn") || folk.find(o=>alive(o) && insideOf(o)==="barn" && o.opinion >= 30 && !o.teen) || null)};
  // shops and counters
  if (here && SHOPS[here] && "CeHW".includes(c) && shopKeeper(here)) return {kind:"shop", label:`Shop at ${SHOPS[here].name}`, run:()=>openShop(here)};
  if (here && SHOPS[here] && c==="C" && !shopKeeper(here)) return {kind:"rob", key:"rob"+here+T.day, label:"Hold: empty the till", hold:true, secs:4, act:"robbing", sound:"coin", done:()=>robTill(here)};
  // work
  const job = workAt(fx,fy) || workAt(pl.x,pl.y);
  if (job) return {kind:"work", key:"work"+job.w.id, label:`${job.w.label} ($${job.w.pay})`, hold:true, secs:job.w.secs, sound:"cut", fxEvery:.5, done:()=>finishWork(job)};
  // digging
  if (pl.inv.includes("shovel") && diggable(fx,fy) && !T.graves.find(g=>g.x===fx&&g.y===fy)) return {kind:"dig", key:"dig"+k, label:"Hold: dig a hole", hold:true, secs:7, act:"digging", sound:"dig", fxEvery:.45, done:()=>{ T.graves.push({x:fx, y:fy, open:true, day:T.day}); toast("A hole, about the right size for… something.", "", 4); if (Math.random()<.15){ const loot = pick(["old boot","wallet","record","matches"]); if (addItemT(loot, true)) toast(`You dig up: ${loot}.`, "good", 3); } }};
  // the train
  const dep = trainHere();
  if (dep && pl.x>=91 && pl.x<=101 && pl.y>=17 && pl.y<=20) return {kind:"train", label: pl.inv.includes("train ticket") ? `Board the ${fmtT(dep)} train` : "The train's here (you need a ticket)", run:boardTrain};
  // the road out
  if (pl.x <= 2 && pl.y >= 29 && pl.y <= 32 && T.mode!=="slasher") return {kind:"wild", label:"Walk out of Millbrook for good", run:()=>confirmT("Leave Millbrook on foot and never come back?", "Walk away", ()=>ending("wild"))};
  return null;
}
function actionPressT(){
  if (T.cutscene || T.ending) return;
  const tg = interactTargetT(); if (!tg || tg.hold) return;
  tg.run();
}
function knockT(bd, k){
  sfx("knock");
  const res = residentsOf(bd.id).filter(r=>alive(r) && buildingAt(r.x,r.y)===bd.id);
  if (!res.length){ setTimeout(()=>toast("No answer.", "", 2), 700); return; }
  const r = res.find(x=>!x.asleep) || res[0];
  setTimeout(()=>{
    if (r.asleep){ r.asleep = false; r.opinion = clamp(r.opinion-6,-100,100); rememberT(r, `The newcomer knocked on my door at ${fmtT(T.t)} and woke me up.`); sayT(r, "Who's there?! It's the middle of the night!", 3); if (isNightT()) gossipT(r, "The newcomer came knocking on my door in the middle of the night. Creepy."); return; }
    if (r.opinion >= 15 || r.partner){ T.unlocked[k] = absT() + 60; sayT(r, pick(["Oh! Come in, come in.","It's open!","Well, look who it is."]), 3); rememberT(r, "Let the newcomer into my house."); sfx("door"); }
    else { sayT(r, pick(["Who is it? …No thanks.","We're not buying.","Go away."]), 3); r.opinion = clamp(r.opinion-1,-100,100); }
  }, 900);
}
function readBoard(){
  const lines = [];
  if (T.day >= 2 && !T.posterDown) lines.push(`WANTED: ESCAPED CONVICT ${PNUMT} — CELLBLOCK NINE. Considered dangerous. If you see this person, contact Sheriff ${(folk.find(n=>n.sheriff)||{last:""}).last}. (The mugshot looks a lot like you. Less sleep, worse hair.)`);
  if (T.event && T.event.text) lines.push(T.event.text);
  lines.push("Lost cat: answers to Biscuit.", "Piano lessons, ask at the church.", `Barn dance every Saturday, 8pm.`, "Trains to the city: 8:00, 14:00, 19:00.");
  if (T.missing.length) lines.push(`HAVE YOU SEEN: ${T.missing.map(id=>fullT(byIdT(id))).join(", ")}?`);
  $("trTitle").textContent = "Town notice board"; const b = $("trBody"); b.textContent = "";
  for (const l of lines) b.append(Object.assign(document.createElement("p"),{textContent:"• "+l}));
  if (T.day >= 2 && !T.posterDown){ const btn = Object.assign(document.createElement("button"),{type:"button", className:"pbtn hot", textContent:"Tear down the WANTED poster"}); btn.addEventListener("click", ()=>{ T.posterDown = true; closeTWindows(); sfx("cut"); toast("You tear it down and stuff it in a pocket… then think better of it and shred it.", "", 4); const pl = T.player; for (const n of folk) if (alive(n) && canSeeT(n, pl.x, pl.y, 9)){ rememberT(n, "I saw the newcomer tear down the WANTED poster in the square."); gossipT(n, "The newcomer tore down that WANTED poster. Why would they do that?"); if (isDet(n)) addEvidence("Tore down the WANTED poster in broad daylight.", 25, "poster"); else addEvidenceVia(n, `${n.first} saw the newcomer tear down the WANTED poster.`, 15); } }); b.append(btn); }
  closeTWindows(); $("tWinRead").hidden = false; sfx("open");
}
function robTill(bid){
  const amt = 20 + Math.floor(Math.random()*50); addMoney(amt, "from the till"); T.stats.robbed = (T.stats.robbed||0)+1;
  newsT(`Somebody emptied the till at ${SHOPS[bid].name}.`, [], true);
  for (const n of folk) if (alive(n) && n.work===bid) rememberT(n, `Someone emptied my till. $${amt} gone.`);
  const pl = T.player; for (const n of folk) if (alive(n) && !n.asleep && canSeeT(n, pl.x, pl.y, 8)){ rememberT(n, `I SAW the newcomer empty the till at ${SHOPS[bid].name}!`); n.order = {type:"report", what:"theft", about:"player", text:`they robbed the till at ${SHOPS[bid].name}`, until:absT()+150}; T.notoriety = clamp(T.notoriety+20,0,100); }
}
function sleepT(){
  const night = hourNow() >= 20 || hourNow() < 6;
  T.sleepingNow = true; detHidingTick(0); T.sleepingNow = false;
  if (T.lock) return;
  fadeT(2.4, () => {
    let mins = night ? ((7*60 - T.t + 1440) % 1440) : 120; if (mins < 30) mins = 30;
    advanceTimeT(mins); T.player.hp = Math.min(100, T.player.hp + (night ? 60 : 20)); T.drunk = 0;
    for (const n of folk){ n.path = []; n.wait = Math.random()*2; }
    toast(night ? `You sleep. ${pick(["You dream of the yard.","You dream of nothing at all.","You dream about the searchlights.","You wake once, sure you heard footsteps."])}` : "A short, restless nap.", "", 4);
  }, night ? "Z z z…" : "z z…");
}
function boardTrain(){
  const pl = T.player;
  if (!pl.inv.includes("train ticket")){ toast("Tickets are sold inside the station ($120).", "bad", 3); return; }
  if (pl.carrying){ toast("Not with a body over your shoulder.", "bad", 3); return; }
  removeItemT("train ticket");
  const d = detP(), D = T.det;
  const followed = d && detAlive() && !pl.inv.includes("fake ID") && (D.suspicion >= 50 || T.wanted || (T.lock && T.lock.kind==="chase"));
  sfx("train");
  fadeT(2.4, () => ending(followed ? "followed" : "train"), "All aboard…");
}

// ---------- the world, every frame ----------
let secAcc = 0, hudAcc = 0, ambAcc = 0;
function frame(dt){
  if (!T) return;
  if (CUT){ cutFrame(dt); return; }
  if (T.ending){ return; }
  const menu = !$("tWinMenu").hidden;
  const paused = menu || (anyTWindow() && !GAME) || !!T.cutscene;
  if (GAME) gameFrame(dt);
  else if (!paused && !tFade){
    if (!T.talkId){
      tickClock(dt);
      for (const n of folk) updateFolk(n, dt);
      updateFightsT(dt); updateScenesT(dt); detHidingTick(dt); chaseTick(dt);
      if (T.mode==="slasher") updateSpyE(dt);
      if (T.lock && T.lock.kind==="brawl"){ const foe = byIdT(T.lock.foe); if (!foe || !alive(foe)){ T.lock = null; banner("SILENCE", "It's over. Now someone has to deal with the body.", true, 5); Snd.track(null); } }
      secAcc += dt; if (secAcc >= 1){ secAcc = 0; perSecondT(); }
    }
    updatePlayerT(dt);
  }
  updateDialogT(dt);
  hudAcc += dt; if (hudAcc > .1){ hudAcc = 0; renderHudT(); }
  ambAcc += dt; if (ambAcc > 1){ ambAcc = 0; musicT(); }
  renderTown(dt);
}
function perSecondT(){
  const pl = T.player, D = T.det;
  crimeSecondTick(); detObserve(); tellTick(); apptTick(); considerApproachT();
  if (T.mode==="slasher"){ slasherSecond(); if (T.ending) return; }
  if (D && detAlive() && absT() >= D.nextBrain && !T.lock && T.mode!=="slasher") detBrain();
  for (const n of folk) if (alive(n) && !n.hidden && distT(n,pl) < 5 && canSeeT(pl, n.x, n.y, 6)) n.lastSeenWithPlayer = absT();
  // the face at the window
  const d = detP();
  if (d && detAlive() && d.order && d.order.type==="watch" && d.x===87 && d.y===13 && insideOf(pl)==="roomC" && isNightT() && !T.windowFace){ T.windowFace = absT(); setTimeout(()=>{ toast("There's a face at your window.", "bad", 4); sfx("stinger"); T.shake = .2; T.clues.push({s:stampT(), text:`A face at my window at night. ${TELLS.find(t=>t.id===d.tells[0]).clue} on the sill in the morning.`, tell:d.tells[0]}); }, 300); }
  if (T.windowFace && absT() - T.windowFace > 600) T.windowFace = 0;
  // the town when you're wanted
  if (T.wanted){ const sh = sheriff(); if (sh && !sh.order && canSeeT(sh, pl.x, pl.y, 10)){ sayT(sh, `${PNUMT}! STOP!`, 3); T.lock = {kind:"chase", reason:"Spotted.", start:absT()}; startChase(); } }
  if (T.lock && T.lock.kind==="chase" && pl.x <= 1 && pl.y >= 28 && pl.y <= 33) ending("wild");
  if (T.mode==="slasher" && T.wanted) T.wanted = false;
  if (T.money < 0) T.money = 0;
}
function musicT(){
  const pl = T.player, inside = insideOf(pl), night = isNightT();
  Snd.setAmbient(inside ? "indoor" : "outside", night, false);
  if (T.mode==="slasher"){ if (!SLASH && !GAME) slasherMusic(true); if (Math.random() < .08) Snd.tone({f:Snd.mf(40), dur:2, vol:.04, type:"sine", dest:Snd.nodes.amb}); return; }
  if (T.weather==="rain" && !inside && Math.random() < .9) for (let i=0;i<6;i++) Snd.noise({dur:.04,vol:.012,type:"highpass",f:5000,at:Math.random()*.9,dest:Snd.nodes.amb});
  if (GAME && GAME.kind==="dance") return;
  const fighting = pl.fight || folk.some(n=>n.fight && n.fight.target==="player");
  const watched = !$("tEye").hidden && !$("tEye").classList.contains("faint");
  Snd.track(T.lock ? "lockdown" : fighting ? "lockdown" : pl.carrying || watched ? "tense" : (inside==="barn" && T.event && T.event.kind==="dance" && hourNow()>=20) ? "dance" : night ? "townnight" : "town");
}

// ---------- drawing the town ----------
const LAMPS_T = [];
function collectLamps(){ LAMPS_T.length = 0; for (let y=0;y<TH;y++) for (let x=0;x<TW;x++) if (tmap[y][x]==="l") LAMPS_T.push([x,y]); }
const lightCvT = document.createElement("canvas"), lcT = lightCvT.getContext("2d");
function renderTown(dt){
  const cv = E.cv, ctx = E.ctx, {zoom:z, dpr} = E.view();
  if (tmapDirty){ rebuildTownMap(); collectLamps(); }
  const LW = Math.ceil(cv.width/2), LH = Math.ceil(cv.height/2); if (lightCvT.width !== LW || lightCvT.height !== LH){ lightCvT.width = LW; lightCvT.height = LH; }
  const W = cv.width, H = cv.height, pl = T.player, now = performance.now();
  ctx.setTransform(1,0,0,1,0,0); ctx.imageSmoothingEnabled = false; ctx.fillStyle = "#0d0e18"; ctx.fillRect(0,0,W,H);
  const [ppx, ppy] = rposT(pl), vw = W/z, vh = H/z;
  let camX = clamp(ppx*TS+8-vw/2, 0, TW*TS-vw), camY = clamp(ppy*TS+8-vh/2, 0, TH*TS-vh);
  if (T.shake > 0){ T.shake = Math.max(0, T.shake - dt); camX += (Math.random()-.5)*6*T.shake*4; camY += (Math.random()-.5)*6*T.shake*4; }
  camX = Math.round(camX*z)/z; camY = Math.round(camY*z)/z;
  ctx.setTransform(z,0,0,z,-camX*z,-camY*z);
  ctx.drawImage(tmapCv, 0, 0);
  const here = insideOf(pl);
  // ground details
  for (const s of T.stains){ if (s.cleaned) continue; const X = s.x*TS, Y = s.y*TS; ctx.fillStyle = "rgba(110,20,30,.75)"; ctx.fillRect(X+3,Y+6,9,5); ctx.fillRect(X+5,Y+4,5,9); ctx.fillStyle = "rgba(80,10,20,.8)"; ctx.fillRect(X+6,Y+7,3,3); }
  for (const g of T.graves){ const X = g.x*TS, Y = g.y*TS; if (g.open){ ctx.fillStyle = "#1a1210"; ctx.fillRect(X+2,Y+2,12,12); ctx.fillStyle = "#6e4e30"; ctx.fillRect(X+1,Y+1,14,2); } else { ctx.fillStyle = "#6e4e30"; ctx.fillRect(X+2,Y+3,12,10); ctx.fillStyle = "#8b6440"; ctx.fillRect(X+3,Y+3,10,3); } }
  for (const k in T.containers){ const b = T.containers[k]; if (!b.items.length) continue; const [bx,by] = k.split(",").map(Number); if (Math.hypot(bx-ppx,by-ppy) > 3.5) continue; const ph = (now/120 + bx*7 + by*3) % 40; if (ph < 6){ const s = ph<3?ph:6-ph; ctx.fillStyle = "#fff6d0"; ctx.fillRect(bx*TS+12, by*TS+2-s, 1, 1+s*2); ctx.fillRect(bx*TS+12-s, by*TS+2, 1+s*2, 1); } }
  // the train
  const dep = trainHere();
  if (dep !== undefined){ const p = (T.t - (dep-12)) / 15; const tx = p < .4 ? TW*TS - (p/.4)*(TW*TS-84*TS) : p < .8 ? 84*TS : 84*TS - (p-.8)/.2*(84*TS+300); drawTrain(ctx, tx, 15*TS-6); }
  // bodies
  for (const b of T.bodies){ if (b.hidden || b.carried) continue; const n = byIdT(b.id); ctx.save(); ctx.translate(b.x*TS+8, b.y*TS+10); ctx.rotate(Math.PI/2); drawPerson(ctx, -8, -6, n.look, [0,1], 0, {blink:true}); ctx.restore(); }
  // people
  const ents = folk.filter(n=>!n.dead && !n.away && !n.hidden).map(n=>({e:n, L:n.look})).concat([{e:pl, L:playerLookT(), me:true}]);
  if (T.mode==="slasher" && T.spyE && !T.spyE.hidden && !T.spyE.dead) ents.push({e:T.spyE, L:T.spyE.look, spy:true});
  ents.sort((a,b)=>rposT(a.e)[1]-rposT(b.e)[1]);
  for (const {e,L,me} of ents){
    const [ex,ey] = rposT(e), moving = e.prog < 1, frame = moving ? Math.floor(e.walkT*2.2)%4 : 0;
    const sx = Math.round(ex*TS), sy = Math.round(ey*TS);
    if (sx < camX-32 || sx > camX+vw+32 || sy < camY-32 || sy > camY+vh+32) continue;
    ctx.fillStyle = "rgba(15,16,30,.35)"; ctx.beginPath(); ctx.ellipse(sx+8, sy+15, 6, 2, 0, 0, 7); ctx.fill();
    const inBed = !me && e.asleep && tileT(e.x,e.y)==="B";
    const blink = ((now/1000 + (me?0:e.id.length*.7)) % 3.7) < .13 || e.asleep;
    const talking = !me && ((T.talkId===e.id && !TD.done) || (e.bubble && e.scene)) && Math.floor(now/110)%2===0;
    drawPerson(ctx, sx, sy - (moving && frame%2 ? 1 : 0), L, inBed ? [0,1] : e.dir, frame, {blink, talk:talking});
    if (e.hitT && now - e.hitT < 130){ ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.fillRect(sx+2, sy-5, 12, 20); }
    if (inBed){ ctx.fillStyle = "#41608a"; ctx.fillRect(sx+2, sy+5, 12, 10); ctx.fillStyle = "#5a7aa8"; ctx.fillRect(sx+2,sy+5,12,1); }
    if (me && pl.carrying){ const b = T.bodies.find(x=>x.id===pl.carrying), bn = b && byIdT(b.id); if (bn){ ctx.save(); ctx.translate(sx+8, sy-6); ctx.rotate(-Math.PI/2); drawPerson(ctx, -8, -8, bn.look, [0,1], 0, {blink:true}); ctx.restore(); } }
    if (!me && e.order && e.order.type==="follow"){ ctx.fillStyle = PAL.g; ctx.fillRect(sx+7, sy+17, 2, 2); }
  }
  // the face at your window
  const d = detP();
  if (d && detAlive() && here==="roomC" && d.x===87 && d.y===13 && !d.hidden){ const X = 87*TS, Y = 14*TS; ctx.fillStyle = "rgba(20,20,30,.9)"; ctx.fillRect(X+4, Y+7, 8, 6); const gl = .6 + .4*Math.sin(now/300); ctx.fillStyle = `rgba(255,240,200,${gl})`; ctx.fillRect(X+5, Y+9, 2, 1); ctx.fillRect(X+9, Y+9, 2, 1); }
  // effects that sit in the world
  for (let i=T.fx.length-1;i>=0;i--){ const f = T.fx[i]; f.life -= dt; if (f.life <= 0){ T.fx.splice(i,1); continue; }
    if (f.kind==="sparks"){ ctx.fillStyle = PAL.y; for (let k=0;k<4;k++) ctx.fillRect(f.x + Math.cos(k*1.7+f.life*20)*(8*(1-f.life)), f.y + Math.sin(k*1.7)*(6*(1-f.life)), 1, 1); }
    else if (f.kind==="splash"){ ctx.strokeStyle = `rgba(200,240,255,${f.life})`; ctx.beginPath(); ctx.arc(f.x, f.y, (1-f.life)*14, 0, 7); ctx.stroke(); }
    else if (f.kind==="smoke"){ for (let k=0;k<5;k++){ ctx.fillStyle = `rgba(160,160,170,${f.life*.12})`; ctx.fillRect(f.x - 3 + Math.sin(f.life*3+k)*4, f.y - (4-f.life)*8 - k*5, 6, 6); } ctx.fillStyle = `rgba(255,150,60,${Math.min(1,f.life)})`; ctx.fillRect(f.x-2, f.y+8, 4, 4); }
    else if (f.kind==="shudder"){ const X = f.x*TS, Y = f.y*TS; ctx.fillStyle = "rgba(26,28,44,.6)"; ctx.fillRect(X + Math.sin(now/20)*1.5, Y, 1, 16); }
  }
  // roofs over everywhere you aren't
  drawRoofs(ctx, here);
  const outB = here ? bById(outerOf(here)) : null;
  if (outB){ ctx.fillStyle = "rgba(13,14,24,.45)"; const X0 = outB.x0*TS, Y0 = outB.y0*TS - 6, X1 = (outB.x1+1)*TS, Y1 = (outB.y1+1)*TS; ctx.fillRect(camX, camY, vw, Y0-camY); ctx.fillRect(camX, Y1, vw, camY+vh-Y1); ctx.fillRect(camX, Y0, X0-camX, Y1-Y0); ctx.fillRect(X1, Y0, camX+vw-X1, Y1-Y0); }
  // rain
  if (T.weather==="rain" && !here){ ctx.fillStyle = "rgba(160,190,230,.35)"; for (let i=0;i<120;i++){ const rx = camX + ((i*53 + now*.25) % vw), ry = camY + ((i*97 + now*.6) % vh); ctx.fillRect(rx, ry, 1, 4); } }
  ctx.setTransform(1,0,0,1,0,0);
  const toS = (wx,wy) => [(wx-camX)*z, (wy-camY)*z];
  // night
  const dk = darknessT(T.t);
  if (dk > 0){
    lcT.setTransform(.5,0,0,.5,0,0); lcT.globalCompositeOperation = "source-over"; lcT.clearRect(0,0,W,H);
    lcT.fillStyle = `rgba(10,12,34,${dk})`; lcT.fillRect(0,0,W,H);
    lcT.globalCompositeOperation = "destination-out";
    const lights = [];
    for (const [x,y] of LAMPS_T) lights.push([x*TS+8, y*TS+2, 4.2]);
    if (outB){ for (let y=outB.y0+1;y<outB.y1;y+=3) for (let x=outB.x0+1;x<outB.x1;x+=3) lights.push([x*TS+8, y*TS+8, 2.6]); }
    for (const b of BUILDINGS){ if (b===outB) continue; const awake = folk.some(n=>alive(n) && !n.asleep && insideOf(n) && outerOf(insideOf(n))===b.id); if (!awake) continue; for (let y=b.y0;y<=b.y1;y++) for (let x=b.x0;x<=b.x1;x++) if (tmap[y][x]==="x") lights.push([x*TS+8, y*TS+12, 1.6]); }
    lights.push([ppx*TS+8, ppy*TS+8, pl.inv.includes("flashlight") ? 4.6 : 2.2]);
    for (const [wx,wy,r] of lights){ const [sx,sy] = toS(wx,wy), R = r*TS*z; if (sx<-R||sy<-R||sx>W+R||sy>H+R) continue; const gr = lcT.createRadialGradient(sx,sy,R*.15,sx,sy,R); gr.addColorStop(0,"rgba(0,0,0,1)"); gr.addColorStop(1,"rgba(0,0,0,0)"); lcT.fillStyle = gr; lcT.beginPath(); lcT.arc(sx,sy,R,0,7); lcT.fill(); }
    ctx.imageSmoothingEnabled = true; ctx.drawImage(lightCvT, 0, 0, W, H); ctx.imageSmoothingEnabled = false;
    ctx.globalCompositeOperation = "lighter";
    for (const [wx,wy,r] of lights){ const [sx,sy] = toS(wx,wy), R = r*TS*z*.8; if (sx<-R||sy<-R||sx>W+R||sy>H+R) continue; const gr = ctx.createRadialGradient(sx,sy,0,sx,sy,R); gr.addColorStop(0, `rgba(255,205,117,${.12*dk})`); gr.addColorStop(1,"rgba(0,0,0,0)"); ctx.fillStyle = gr; ctx.fillRect(sx-R,sy-R,R*2,R*2); }
    ctx.globalCompositeOperation = "source-over";
  }
  if (T.lock && (T.lock.kind==="chase" || T.lock.kind==="brawl")){ const pulse = (Math.sin(now/240)+1)/2; ctx.fillStyle = `rgba(${Math.floor(now/400)%2 ? "177,62,83" : "59,93,201"},${.06+.12*pulse})`; ctx.fillRect(0,0,W,H); }
  if (pl.carrying){ ctx.fillStyle = "rgba(120,0,20,.08)"; ctx.fillRect(0,0,W,H); }
  if (T.mode==="slasher"){ const gr = ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.75); gr.addColorStop(0,"rgba(0,0,0,0)"); gr.addColorStop(1,`rgba(70,0,10,${.45 + (T.police ? .15*Math.sin(now/200) : 0)})`); ctx.fillStyle = gr; ctx.fillRect(0,0,W,H); if (T.police && Math.floor(now/400)%2){ ctx.fillStyle = "rgba(59,93,201,.06)"; ctx.fillRect(0,0,W,H); } }
  // labels, bubbles, emotes
  const fpx = Math.round(Math.max(15*dpr, 5.5*z));
  ctx.font = `${fpx}px VT323, monospace`; ctx.textBaseline = "top"; ctx.textAlign = "left";
  for (const {e, me, spy} of ents){
    const [ex,ey] = rposT(e), [sx,sy] = toS(ex*TS+8, ey*TS-6);
    if (spy){ if (Math.hypot(ex-ppx,ey-ppy) < 4.5){ const tw = ctx.measureText(e.short).width; ctx.fillStyle = "rgba(60,0,10,.85)"; ctx.fillRect(sx-tw/2-4*dpr, sy-fpx-6*dpr, tw+8*dpr, fpx+2*dpr); ctx.fillStyle = "#ff8a8a"; ctx.textAlign = "center"; ctx.fillText(e.short, sx, sy-fpx-5*dpr); ctx.textAlign = "left"; } continue; }
    if (sx<-300||sx>W+300||sy<-200||sy>H+200) continue;
    if (!me){ const inB = insideOf(e); if (inB && outerOf(inB)!==(here?outerOf(here):null)) continue; }
    const near = Math.hypot(ex-ppx, ey-ppy);
    if (me){ const b = Math.sin(now/200)*2*dpr; ctx.fillStyle = PAL.k; E.tri(sx, sy-4*dpr+b, 6*dpr); ctx.fillStyle = PAL.y; E.tri(sx, sy-5*dpr+b, 4.5*dpr); continue; }
    if (near < 4.5 && !e.bubble){ const label = e.met ? e.first : e.job; const tw = ctx.measureText(label).width; ctx.fillStyle = "rgba(26,28,44,.85)"; ctx.fillRect(sx-tw/2-4*dpr, sy-fpx-6*dpr, tw+8*dpr, fpx+2*dpr); ctx.fillStyle = e.sheriff ? "#ffcd75" : e.partner ? "#ffb0d0" : "#ffb08f"; ctx.textAlign = "center"; ctx.fillText(label, sx, sy-fpx-5*dpr); ctx.textAlign = "left";
      if (T.tasks.some(t=>t.giver===e.id && t.status==="ready")) E.drawEmote(sx+(tw/2+12*dpr), sy-fpx-6*dpr, "✓", fpx*.8); }
    if (e.asleep){ const zz = (now/700 + e.id.length)%3; ctx.fillStyle = "#c2d3dc"; ctx.font = `${Math.round(fpx*(.7+zz*.15))}px VT323, monospace`; ctx.fillText("z", sx+6*dpr+zz*4*dpr, sy-zz*8*dpr); ctx.font = `${fpx}px VT323, monospace`; }
    if (e.emote){ if (now > e.emote.until) e.emote = null; else E.drawEmote(sx, sy-fpx-8*dpr, e.emote.ch, fpx); }
    if (e.bubble){
      if (now > e.bubble.until){ e.bubble = null; continue; }
      if (near > 12) continue;
      const lines = E.wrap(e.bubble.text, 26), lh = fpx*.95;
      const lw = Math.max(...lines.map(l=>ctx.measureText(l).width)) + 14*dpr, bh = lines.length*lh + 10*dpr;
      const bx = clamp(sx-lw/2, 6, W-lw-6), by = sy - fpx - 14*dpr - bh;
      ctx.globalAlpha = near > 8 ? .6 : 1;
      ctx.fillStyle = PAL.k; ctx.fillRect(bx-2*dpr, by-2*dpr, lw+4*dpr, bh+4*dpr);
      ctx.fillStyle = e.scene ? "#e6f0f4" : PAL.e; ctx.fillRect(bx, by, lw, bh);
      ctx.fillStyle = PAL.k; E.tri(sx, by+bh+8*dpr, 7*dpr, true); ctx.fillStyle = e.scene ? "#e6f0f4" : PAL.e; E.tri(sx, by+bh+5*dpr, 5*dpr, true);
      ctx.fillStyle = PAL.k; lines.forEach((l,i)=>ctx.fillText(l, bx+7*dpr, by+5*dpr+i*lh));
      ctx.globalAlpha = 1;
    }
  }
  // floating numbers and flashes
  ctx.textAlign = "center";
  for (const f of T.fx){
    if (f.kind==="float"){ const [x,y] = toS(f.x, f.y - (1.1-f.life)*14); ctx.globalAlpha = Math.min(1, f.life*2); ctx.fillStyle = PAL.k; ctx.fillText(f.text, x+2*dpr, y+2*dpr); ctx.fillStyle = f.col; ctx.fillText(f.text, x, y); ctx.globalAlpha = 1; }
    if (f.kind==="tracer"){ const [a,b] = toS(f.x, f.y), [c2,d2] = toS(f.x2, f.y2); ctx.strokeStyle = `rgba(255,230,140,${Math.min(1,f.life*7)})`; ctx.lineWidth = 2*dpr; ctx.beginPath(); ctx.moveTo(a,b); ctx.lineTo(c2,d2); ctx.stroke(); ctx.lineWidth = 1; }
    if (f.kind==="flash"){ const [x,y] = toS(f.x, f.y); ctx.globalCompositeOperation = "lighter"; const R = 40*dpr*f.life*4; const gr = ctx.createRadialGradient(x,y,0,x,y,R); gr.addColorStop(0,"rgba(255,255,255,.9)"); gr.addColorStop(1,"rgba(0,0,0,0)"); ctx.fillStyle = gr; ctx.fillRect(x-R,y-R,R*2,R*2); ctx.globalCompositeOperation = "source-over"; }
    if (f.kind==="whiteout"){ ctx.fillStyle = `rgba(255,255,255,${f.life*2})`; ctx.fillRect(0,0,W,H); }
  }
  ctx.textAlign = "left";
  // what E would do
  if (!T.talkId && !anyTWindow() && !T.cutscene){
    const t = interactTargetT();
    if (t){
      let wx, wy;
      if (t.kind==="talk"||t.kind==="wake"){ const [ex,ey] = rposT(t.npc || nearestFolk(1.6) || pl); wx = ex*TS+8; wy = ey*TS+22; } else { const [fx,fy] = facingT(); wx = fx*TS+8; wy = fy*TS+20; }
      const [sx,sy] = toS(wx,wy);
      let label = t.label; if (t.hold && holdT && holdT.key===t.key) label = label.replace(/^Hold: /,"") + ` ${Math.round(holdT.prog*100)}%`;
      const key = document.body.classList.contains("touch") ? "A" : "E";
      const tw = ctx.measureText(label).width, kw = fpx*1.1;
      const bx = clamp(sx-(tw+kw+14*dpr)/2, 6, W-tw-kw-20*dpr), by = Math.min(sy, H-fpx-60*dpr);
      ctx.fillStyle = PAL.k; ctx.fillRect(bx, by, tw+kw+14*dpr, fpx+8*dpr);
      ctx.fillStyle = PAL.o; ctx.fillRect(bx+3*dpr, by+3*dpr, kw, fpx+2*dpr);
      ctx.fillStyle = PAL.k; ctx.textAlign = "center"; ctx.fillText(key, bx+3*dpr+kw/2, by+3*dpr); ctx.textAlign = "left";
      ctx.fillStyle = PAL.w; ctx.fillText(label, bx+kw+9*dpr, by+3*dpr);
    }
  }
  if (tFade){
    tFade.t += dt; const f = tFade, half = f.secs/2;
    const a = f.t < half ? f.t/half : Math.max(0, 1-(f.t-half)/half);
    if (!f.fired && f.t >= half){ f.fired = true; try { f.mid && f.mid(); } catch (e){ console.error(e); } }
    ctx.fillStyle = `rgba(13,14,24,${a})`; ctx.fillRect(0,0,W,H);
    if (f.text){ ctx.fillStyle = `rgba(244,244,244,${a})`; ctx.font = `${fpx*2}px VT323, monospace`; ctx.textAlign = "center"; ctx.fillText(f.text, W/2, H/2-fpx); ctx.textAlign = "left"; }
    if (f.t >= f.secs) tFade = null;
  }
}
function playerLookT(){ const pl = T.player; if (pl.wearJumpsuit) return Object.assign({}, pl.look, {suit:"o", civ:false, pants:null}); return pl.look; }
function drawTrain(c, x, y){
  for (let car=0; car<4; car++){
    const X = x + car*70;
    c.fillStyle = PAL.k; c.fillRect(X-1, y-1, 66, 30);
    c.fillStyle = car===0 ? "#b13e53" : "#29366f"; c.fillRect(X, y, 64, 28);
    c.fillStyle = car===0 ? "#e07ab0" : "#3b5dc9"; c.fillRect(X, y, 64, 3);
    for (let w=0; w<4; w++){ c.fillStyle = "#73eff7"; c.fillRect(X+6+w*15, y+6, 10, 8); }
    c.fillStyle = PAL.k; c.fillRect(X+8, y+26, 8, 6); c.fillRect(X+48, y+26, 8, 6);
    if (car===0){ c.fillStyle = "#566c86"; c.fillRect(X+2, y-8, 8, 8); c.fillStyle = "rgba(220,220,230,.5)"; c.fillRect(X+2, y-16-((performance.now()/80)%8), 8, 6); }
  }
}

// ---------- input ----------
const typingT = e => e.target && (e.target.tagName==="INPUT" && e.target.type!=="checkbox" || e.target.tagName==="TEXTAREA");
document.addEventListener("keydown", e => {
  if (!TOWN.active || !T) return;
  const k = e.key.toLowerCase();
  if (typingT(e)){
    if (k==="escape"){ if (T.talkId) closeTalkT(); else e.target.blur(); }
    else if (/^arrow/.test(k) && !e.target.value && T.talkId){ e.preventDefault(); e.target.blur(); closeTalkT(); if (!heldT.includes(k)) heldT.push(k); }
    return;
  }
  if (CUT){ if (k===" " || k==="enter" || k==="e"){ e.preventDefault(); nextShot(); } return; }
  if (T.ending || (T.cutscene && T.cutscene!=="choice")) return;
  if (GAME){ e.preventDefault(); if (k==="escape"){ closeGame(); return; } if (!e.repeat) GAME.key && GAME.key(k, true); return; }
  if (k==="escape"){ e.preventDefault(); if (!$("tWinTrade").hidden) closeTWindows(); else if (T.talkId) closeTalkT(); else if (anyTWindow()) closeTWindows(); else { $("tWinMenu").hidden = false; sfx("open"); } return; }
  if (k==="m"){ Snd.init(); Snd.setMuted(!Snd.muted); syncTownSound(); return; }
  if (k==="n"){ Snd.init(); Snd.setMusic(!Snd.musicOn); syncTownSound(); return; }
  if (k==="i"){ if (!$("tWinInv").hidden) closeTWindows(); else if (!T.talkId) openInvT(); return; }
  if (k==="j"){ if (!$("tWinJournal").hidden) closeTWindows(); else if (!T.talkId) openJournalT(); return; }
  if (k==="tab"){ e.preventDefault(); if (!$("tWinMap").hidden) closeTWindows(); else if (!T.talkId) openMapT(); return; }
  if (/^[1-6]$/.test(k)){ selectSlotT(Number(k)-1); return; }
  if (anyTWindow()) return;
  if (k==="f"){ e.preventDefault(); playerAttackT(); return; }
  if (k==="q"){ if (T.player.carrying) dropBody(null); return; }
  if (KEYDIR_T[k] && !["up","down","left","right"].includes(k)){ e.preventDefault(); if (T.talkId) closeTalkT(); if (!heldT.includes(k)) heldT.push(k); }
  else if (k==="e" || k===" " || k==="enter"){ e.preventDefault(); if (T.talkId){ if (!TD.done){ TD.shown = TD.full.length; TD.done = true; renderTDText(); } else $("tdInput").focus(); return; } if (!e.repeat) actionPressT(); actionHeldT = true; }
});
document.addEventListener("keyup", e => { if (!TOWN.active) return; const k = e.key.toLowerCase(); if (GAME){ GAME.key && GAME.key(k, false); return; } const i = heldT.indexOf(k); if (i>=0) heldT.splice(i,1); if (k==="e"||k===" "||k==="enter") actionHeldT = false; });
window.addEventListener("blur", () => { heldT.length = 0; actionHeldT = false; });
function syncTownSound(){ $("tMuteBtn").classList.toggle("off", Snd.muted); $("tMuteBtn").textContent = Snd.muted ? "×" : "♪"; $("tMusicBtn").classList.toggle("off", !Snd.musicOn); $("toptMusic").checked = Snd.musicOn; }
function wireTownDom(){
  for (const b of document.querySelectorAll("#tpad button")){
    const d = b.dataset.d, off = () => { const i = heldT.indexOf(d); if (i>=0) heldT.splice(i,1); };
    b.addEventListener("pointerdown", e => { e.preventDefault(); Snd.init(); if (!heldT.includes(d)) heldT.push(d); if (b.setPointerCapture) b.setPointerCapture(e.pointerId); });
    b.addEventListener("pointerup", off); b.addEventListener("pointercancel", off); b.addEventListener("lostpointercapture", off);
  }
  const aB = $("taBtn");
  aB.addEventListener("pointerdown", e => { e.preventDefault(); if (CUT) { nextShot(); return; } actionPressT(); actionHeldT = true; });
  for (const ev of ["pointerup","pointercancel","pointerleave"]) aB.addEventListener(ev, () => { actionHeldT = false; });
  $("tfBtn").addEventListener("pointerdown", e => { e.preventDefault(); playerAttackT(); });
  $("tdForm").addEventListener("submit", e => {
    e.preventDefault(); const v = $("tdInput").value;
    if (!v.trim()){ if (!TD.done){ TD.shown = TD.full.length; TD.done = true; renderTDText(); } return; }
    if (TD.busy) return; $("tdInput").value = ""; const n = byIdT(T.talkId); if (n) askTownNpc(n, {said:v.trim()});
  });
  $("tdGive").addEventListener("click", () => { const it = T.sel; if (!it || TD.busy || !T.player.inv.includes(it)) return; const v = $("tdInput").value; $("tdInput").value = ""; const n = byIdT(T.talkId); if (n) askTownNpc(n, {said:v.trim(), gave:it}); });
  $("tdTrade").addEventListener("click", openTradeT);
  $("tdPay").addEventListener("click", () => {
    const n = byIdT(T.talkId); if (!n || TD.busy) return;
    if (T.money < 5){ toast("You don't have $5.", "bad"); return; }
    T.money -= 5; n.money += 5; sfx("coin"); logLineT(n, "e", `You hand ${n.first} $5.`);
    const debt = T.debts.find(d=>d.who===n.id && !d.paid); let note = "*hands them $5*";
    if (debt){ debt.amount -= 5; if (debt.amount <= 0){ debt.paid = true; note = "*hands them $5, paying back the last of what you owe*"; n.trust = clamp(n.trust+6,0,100); } else note = `*hands them $5 toward the $${debt.amount+5} you owe*`; }
    const v = $("tdInput").value.trim(); $("tdInput").value = "";
    askTownNpc(n, {said: v ? `${note} ${v}` : note});
  });
  $("tdFavor").addEventListener("click", () => { const n = byIdT(T.talkId); if (!n || TD.busy) return; const ready = T.tasks.find(t=>t.giver===n.id && t.status==="ready"); if (ready){ payFavorT(ready, n); startTypeT("*counts out the money* As promised.", n); return; } if (n.opinion < -15){ startTypeT("From you? No thanks.", n); return; } offerFavorT(n); });
  $("tdAccuse").addEventListener("click", () => {
    const n = byIdT(T.talkId); if (!n || TD.busy) return;
    confirmT(`Accuse ${n.first} of being the undercover detective? If you're wrong, word will get around.`, "Accuse", () => doAccuse(n));
  });
  function doAccuse(n){
    T.det.accusations = (T.det.accusations||0) + 1;
    if (isDet(n)){ T.det.accusedRight = true; T.suspects[n.id] = true; }
    else { T.notoriety = clamp(T.notoriety+8,0,100); }
    const v = $("tdInput").value.trim(); $("tdInput").value = "";
    askTownNpc(n, {said: v || "I know what you are. You're the detective. The one they sent after me.", accuse:true});
  }
  $("tdLog").addEventListener("click", () => { const id = T.talkId; closeTalkT(); openJournalT("people", id); });
  $("tdLeave").addEventListener("click", closeTalkT);
  $("ttGo").addEventListener("click", doTradeT);
  $("ttLess").addEventListener("click", () => { tCash -= 5; renderTradeT(); });
  $("ttMore").addEventListener("click", () => { tCash += 5; renderTradeT(); });
  for (const b of document.querySelectorAll("[data-tclose]")) b.addEventListener("click", closeTWindows);
  for (const id of TWINS){ const w = $(id); w.addEventListener("pointerdown", e => { if (e.target===w && id!=="tWinMenu" && id!=="tWinGame") closeTWindows(); }); }
  $("tgClose").addEventListener("click", closeGame);
  const gc = $("tgCv");
  const gpos = e => { const r = gc.getBoundingClientRect(); return [(e.clientX-r.left)/r.width*GW, (e.clientY-r.top)/r.height*GH]; };
  gc.addEventListener("pointerdown", e => { if (GAME && GAME.click){ const [x,y] = gpos(e); GAME.click(x,y,true); } });
  gc.addEventListener("pointerup", e => { if (GAME && GAME.click){ const [x,y] = gpos(e); GAME.click(x,y,false); } });
  gc.addEventListener("pointermove", e => { if (GAME && GAME.move){ const [x] = gpos(e); GAME.move(x); } });
  $("tInvBtn").addEventListener("click", () => { if (T && !T.talkId) openInvT(); });
  $("tJBtn").addEventListener("click", () => { if (T && !T.talkId) openJournalT(); });
  $("tMapBtn").addEventListener("click", () => { if (T && !T.talkId) openMapT(); });
  $("tMenuBtn").addEventListener("click", () => { if (!T) return; closeTalkT(); $("tWinMenu").hidden = false; sfx("open"); });
  $("tMuteBtn").addEventListener("click", () => { Snd.init(); Snd.setMuted(!Snd.muted); syncTownSound(); });
  $("tMusicBtn").addEventListener("click", () => { Snd.init(); Snd.setMusic(!Snd.musicOn); syncTownSound(); });
  $("toptMusic").addEventListener("change", e => { if (e.target.checked !== Snd.musicOn){ Snd.setMusic(e.target.checked); syncTownSound(); } });
  $("tResume").addEventListener("click", () => { $("tWinMenu").hidden = true; sfx("close"); });
  $("tQuit").addEventListener("click", () => { saveT(); location.reload(); });
  E.cv.addEventListener("pointerdown", () => { if (TOWN.active && document.activeElement===$("tdInput")) $("tdInput").blur(); });
  // from the prison
  $("townBtn").addEventListener("click", () => { $("scrWin").hidden = true; begin(); });
  // title screen
  const row = $("startBtn").parentElement;
  const contB = Object.assign(document.createElement("button"),{type:"button", className:"bigbtn alt", id:"townContBtn", textContent:"Continue in Millbrook"});
  const skipB = Object.assign(document.createElement("button"),{type:"button", className:"bigbtn alt", id:"townSkipBtn", textContent:"Skip to Millbrook (phase two)"});
  contB.addEventListener("click", () => { $("scrTitle").hidden = true; if (!cont()) { $("scrTitle").hidden = false; toast("That save is gone.", "bad"); } });
  skipB.addEventListener("click", () => { const go = () => { clearSaveT(); $("scrTitle").hidden = true; begin(); }; if (loadSavedT()) confirmT("Start a new life in Millbrook? Your current Millbrook save will be lost.", "Start over", go); else go(); });
  row.append(contB, skipB);
  const opsCont = Object.assign(document.createElement("button"),{type:"button", className:"bigbtn alt", textContent:"Continue Operation Birch"});
  opsCont.addEventListener("click", () => { Snd.init(); if (!window.__cb9.continueOps()) toast("That save is gone.", "bad"); });
  let opsSave = null; try { opsSave = JSON.parse(localStorage.getItem("cellblock9-ops-v1")||"null"); } catch {}
  opsCont.hidden = !opsSave; if (opsSave) opsCont.textContent = `Continue Operation Birch · Day ${opsSave.day}`;
  row.append(opsCont);
  const det = document.createElement("details"); det.className = "chapters"; det.style.cssText = "width:100%;font-size:20px;color:var(--l)";
  det.append(Object.assign(document.createElement("summary"),{textContent:"Chapter select", style:"cursor:pointer;font-family:var(--px);font-size:10px;color:var(--y)"}));
  const crow = document.createElement("div"); crow.className = "row"; crow.style.marginTop = "10px";
  const chap = (label, fn) => { const b = Object.assign(document.createElement("button"),{type:"button", className:"pbtn", textContent:label}); b.addEventListener("click", fn); crow.append(b); };
  chap("1 · Cellblock Nine", () => $("startBtn").click());
  chap("2 · Millbrook", () => skipB.click());
  chap("3 · Operation Birch", () => { Snd.init(); let snap = null; try { snap = JSON.parse(localStorage.getItem(SNAP_KEY)||"null"); } catch {} const o = snap ? {alias:snap.alias, badgeName:snap.det.realName, look:{skin:snap.player.look.skin, hair:snap.player.look.hair}, disguise:snap.player.disguise, townDay:snap.day} : {alias:"Sam Ellis", badgeName:`${pick(FIRST)} ${pick(LAST)}`}; $("scrTitle").hidden = true; window.__cb9.startOps(o); });
  chap("4 · Leave No Evidence", () => { $("scrTitle").hidden = true; const cast = E.prisonCast().filter(c=>c.kind==="inmate"); const c = pick(cast); beginSlasher({spy:{id:c.id, name:c.name, short:c.short, look:c.look, voice:c.voice}}); });
  det.append(crow, Object.assign(document.createElement("p"),{className:"note", textContent:"Each chapter can be started on its own. Playing straight through carries your choices, your kills and your name forward."}));
  row.after(det);
  const s = loadSavedT(); contB.hidden = !(s && !s.ending); if (s && !s.ending) contB.textContent = `Continue in Millbrook · Day ${s.day}`;
}
buildTownDom();
wireTownDom();
syncTownSound();
if (matchMedia("(pointer:coarse)").matches){ $("taBtn").style.display = ""; $("tfBtn").style.display = ""; }
window.__town = {bById, doorLockedT, walkPlayer, get T(){ return T; }, get folk(){ return folk; }, begin, cont, openTalkT, askTownNpc, applyTownAction, detBrain, setDetMove, arrestSequence, killPerson, startFishing, startDarts, startCards, startArcade, startDance, openShop, advanceTimeT, ending, playCutscene, discoverBody, interactTargetT, nextShot};
