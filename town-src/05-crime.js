// Crime: fights, permanent knockouts, bodies, hiding, stains, discovery, the sheriff and the jail.
const nameOfT = e => e===T.player ? "the newcomer" : e.first;
const idOfT = e => e===T.player ? "player" : e.id;
const entT = id => id==="player" ? T.player : byIdT(id);
function selectedWeapon(){ const it = T.sel; return it && T.player.inv.includes(it) && weaponDmg(it) ? it : null; }
function weaponOfT(e){ if (e===T.player) return selectedWeapon(); return e.inv.find(i=>weaponDmg(i)) || (e.sheriff ? "baseball bat" : null); }
function floatT(e, text, col){ const [x,y] = rposT(e); T.fx.push({kind:"float", x:x*TS+8, y:y*TS-6, text, col, life:1.1}); }
function sheriff(){ return folk.find(n=>n.sheriff && alive(n) && !n.away); }

function startFightT(a, b){
  if (!a || !b || a===b) return;
  const pl = T.player, fresh = !a.fight && !(b.fight && b.fight.target===idOfT(a));
  a.fight = {target:idOfT(b), next:performance.now()+250, aggressor:true, since:absT(), last:performance.now()};
  if (b!==pl && alive(b)){
    if (b.scene) finishSceneT(b.scene);
    b.order = null; b.asleep = false; b.talkingToPlayer = false;
    const brave = !b.timid || b.sheriff || isDet(b);
    if (brave) b.fight = {target:idOfT(a), next:performance.now()+700, aggressor:false, since:absT(), last:performance.now()};
    else { b.order = {type:"report", what:a===pl ? "attacked" : "fight", about:idOfT(a), until:absT()+120, run:true}; sayT(b, pick(["HELP!","Somebody call the sheriff!","Get away from me!"]), 3); sfx("scream"); }
  }
  if (b===pl && !pl.fight) toast(`${a.first} is attacking you! F to fight back, or run.`, "bad", 4);
  if (fresh){
    const where = placeLabelAt(a.x,a.y);
    for (const o of folk){
      if (!alive(o) || o===a || o===b || o.asleep || !canSeeT(o, a.x, a.y, 9)) continue;
      rememberT(o, `I saw ${nameOfT(a)} attack ${nameOfT(b)} at ${where}.`);
      if (Math.random()<.6) sayT(o, pick(["Whoa!","Stop it!","Somebody do something!","Sheriff!"]), 2.5);
      emoteT(o, "!", 1.5);
      if (a===pl){ o.opinion = clamp(o.opinion-10,-100,100); if (b!==pl && relGetT(o.id,b.id) >= 30){ o.opinion = clamp(o.opinion-15,-100,100); o.trust = clamp(o.trust-10,0,100); } }
      if (a===pl && !o.sheriff && !o.order && Math.random()<.5) o.order = {type:"report", what:"fight", about:"player", until:absT()+120, run:true};
    }
    if (b!==pl) rememberT(b, `${nameOfT(a)} attacked me at ${where}.`);
    if (a===pl){ T.notoriety = clamp(T.notoriety+12, 0, 100); if (b!==pl){ b.opinion = clamp(b.opinion-50,-100,100); b.trust = 0; gossipT(b, "The newcomer jumped me. Out of nowhere. Dangerous."); } }
  }
}
function hitT(att, vic){
  const pl = T.player, w = weaponOfT(att), base = att===pl ? 9 : att.strength;
  const dmg = Math.round((base + (w ? weaponDmg(w) : 0)) * (.75 + Math.random()*.5) * (att===pl && T.drunk>0 ? .8 : 1));
  vic.hp = Math.max(0, vic.hp - dmg); vic.hitT = performance.now();
  floatT(vic, "-"+dmg, vic===pl ? "#ff6b7f" : "#ffcd75");
  sfx("punch"); const [vx,vy] = rposT(vic); T.fx.push({kind:"sparks", x:vx*TS+8, y:vy*TS+2, life:.4});
  if (att.fight) att.fight.last = performance.now();
  if (vic!==pl && !vic.fight && alive(vic) && !(vic.order && vic.order.type==="report")) startFightT(vic, att);
  if (vic.hp <= 0){ if (vic===pl) playerDownT(att); else if (att===pl) killPerson(vic, att); else beaten(vic, att); }
  else if (att!==pl && vic!==pl && vic.hp <= 15) beaten(vic, att);
}
function beaten(vic, att){
  vic.fight = null; att.fight = null; vic.hp = Math.max(vic.hp, 10);
  sayT(vic, "Okay! Okay! I give!", 3); vic.order = {type:"flee", place:vic.home, until:absT()+60};
  newsT(`${att.first} beat up ${vic.first} at ${placeLabelAt(vic.x,vic.y)}.`, [att.id, vic.id]);
  relAddT(att.id, vic.id, -25);
  const sh = sheriff(); if (sh && sh!==att) { att.away = true; att.awayUntil = (T.t>=360 ? (T.day+1)*1440 : T.day*1440) + 480; rememberT(att, `I spent a night in the cells for fighting ${vic.first}.`); }
}
function playerAttackT(){
  if (!T || T.ending || anyTWindow() || T.talkId || T.cutscene) return;
  const now = performance.now(); if (now < (T.swingAt||0)) return; T.swingAt = now + 420;
  const pl = T.player; if (pl.carrying){ toast("Put the body down first.", "", 2); return; }
  const [fx,fy] = facingT();
  let t = folk.find(n=>alive(n) && !n.away && !n.hidden && Math.round(rposT(n)[0])===fx && Math.round(rposT(n)[1])===fy);
  if (!t){ const n = nearestFolk(1.45); if (n) t = n; }
  sfx("cut");
  if (!t) return;
  faceToT(pl, t);
  if (!pl.fight || pl.fight.target!==t.id) startFightT(pl, t);
  pl.fight.last = now;
  hitT(pl, t);
}
function updateFightsT(dt){
  const now = performance.now(), pl = T.player;
  if (pl.fight && now - pl.fight.last > 8000) pl.fight = null;
  for (const n of folk){
    if (!alive(n) || !n.fight || n.away) continue;
    const t = entT(n.fight.target);
    if (!t || (t!==pl && !alive(t)) || absT()-n.fight.since > 90){ n.fight = null; continue; }
    const d = distT(n,t);
    if (d <= 1.3){ n.path = []; faceToT(n, t); if (now >= n.fight.next){ n.fight.next = now + 700 + Math.random()*450; hitT(n, t); } }
    else if (d > 14){ n.fight = null; }
    else goToT(n, t.x, t.y, true);
  }
  // the sheriff steps in
  const sh = sheriff();
  if (sh && !sh.fight && !sh.asleep && !(T.lock)){
    if (pl.fight && pl.fight.aggressor && canSeeT(sh, pl.x, pl.y, 10)){
      sayT(sh, "THAT'S ENOUGH!"); sfx("alert");
      sh.order = {type:"arrestPlayer", until:absT()+60, run:true};
    }
    const brawl = folk.find(n=>n!==sh && alive(n) && n.fight && n.fight.target!=="player" && canSeeT(sh, n.x, n.y, 10));
    if (brawl && !sh.order){ sayT(sh, "Break it up!"); beaten(entT(brawl.fight.target), brawl); }
  }
  if (sh && sh.order && sh.order.type==="arrestPlayer"){
    if (absT() > sh.order.until){ sh.order = null; }
    else if (distT(sh, pl) <= 1.4){ sh.order = null; jailT("assault"); }
    else { sh.repath = 0; goToT(sh, pl.x, pl.y, true); }
  }
  if (pl.hp < 100 && !pl.fight) pl.hp = Math.min(100, pl.hp + dt*.4);
}
function playerDownT(by){
  const pl = T.player; pl.fight = null; pl.carrying = null;
  for (const o of folk) if (o.fight && o.fight.target==="player") o.fight = null;
  if (by && (by.sheriff || isDet(by)) && T.lock){ ending("caught"); return; }
  if (by && by.sheriff){ pl.hp = 40; jailT("assault"); return; }
  let stolen = null;
  if (by && pl.inv.length && Math.random()<.6){ stolen = pick(pl.inv.filter(i=>i!=="room key")); if (stolen){ pl.inv.splice(pl.inv.indexOf(stolen),1); by.inv.push(stolen); rememberT(by, `I knocked the newcomer out and took their ${stolen}.`); if (isEvidence(stolen)) addEvidenceVia(by, `${by.first} took a ${stolen} off the newcomer.`, 15); } }
  fadeT(1.6, () => {
    T.t += 180; if (T.t >= 1440){ T.t -= 1440; T.day += 1; }
    pl.x=pl.fx=40; pl.y=pl.fy=24; pl.prog=1; pl.hp = 50;
    addMoney(-Math.min(T.money, 30), "Clinic bill");
    newsT(`${by ? by.first : "Someone"} knocked the newcomer out cold.`, by ? [by.id] : []);
    toast(`You wake up in the clinic.${stolen ? ` Your ${stolen} is gone.` : ""}`, "bad", 6);
    T.notoriety = clamp(T.notoriety+5,0,100); saveT();
  }, "K . O .");
  sfx("sad");
}
// Evidence reaches the detective through gossip and the sheriff, not instantly.
function addEvidenceVia(n, text, w){ T.pendingEvidence = (T.pendingEvidence||[]).concat({at:absT()+30+Math.random()*60, text, w}); }

// ---------- deaths and bodies ----------
function killPerson(n, by){
  const pl = T.player, where = placeLabelAt(n.x, n.y);
  n.dead = true; n.hp = 0; n.fight = null; n.order = null; n.asleep = false; n.hidden = false; n.talkingToPlayer = false;
  if (n.scene) finishSceneT(n.scene);
  if (pl.fight && pl.fight.target===n.id) pl.fight = null;
  for (const o of folk) if (o.fight && o.fight.target===n.id) o.fight = null;
  T.bodies.push({id:n.id, name:fullT(n), x:n.x, y:n.y, hidden:null, carried:false, diedAt:absT(), discovered:false, inside:buildingAt(n.x,n.y), killer:by===pl ? "player" : by.id});
  for (const [dx,dy] of [[0,0],[1,0],[0,1]]) addStain(n.x+dx, n.y+dy);
  T.stats.kills++;
  sfx("snap"); T.shake = .4; emoteT(n, "✶", 3);
  toast(`${n.first} goes still. They won't be getting up again.`, "bad", 4);
  if (isDet(n)){ T.det.dead = true; toast("Something about them was different. A badge glints inside their coat.", "", 6); n.inv.push("case file"); }
  // witnesses
  const wits = folk.filter(o=>alive(o) && !o.away && !o.asleep && o!==n && canSeeT(o, n.x, n.y, 9));
  for (const o of wits){
    rememberT(o, by===pl ? `I SAW THE NEWCOMER KILL ${n.first.toUpperCase()} at ${where}.` : `I saw ${by.first} kill ${n.first}.`);
    sayT(o, pick(["AAAAH!","Oh my God!","MURDER!","No no no no"]), 3); sfx("scream");
    if (o.sheriff){ arrestSequence(`The sheriff watched you kill ${n.first}.`, true); return; }
    if (isDet(o)){ addEvidence(`I watched the newcomer kill ${n.first} at ${where}.`, 100, "murder"); return; }
    o.order = {type:"report", what:"murder", about:by===pl?"player":by.id, victim:n.id, until:absT()+180, run:true}; o.fight = null;
  }
  if (wits.length) T.notoriety = 100;
}
function addStain(x,y){ if (!WALK_T.has(tileT(x,y)) && tileT(x,y)!=="D") return; if (T.stains.some(s=>s.x===x&&s.y===y&&!s.cleaned)) return; T.stains.push({x,y,day:T.day,inside:!!buildingAt(x,y),cleaned:false,seenBy:[]}); }
function bodyNear(maxd=1.5){
  const pl = T.player; let best = null, bd = maxd;
  for (const b of T.bodies){ if (b.hidden || b.carried) continue; const d = Math.hypot(b.x-pl.x, b.y-pl.y); if (d <= bd){ bd = d; best = b; } }
  return best;
}
function pickUpBody(b){
  const pl = T.player; if (pl.carrying) return;
  b.carried = true; pl.carrying = b.id; sfx("dig"); toast(`You heave ${b.name.split(" ")[0]} over your shoulder. Slow and heavy.`, "", 3);
  T.lastDrag = [pl.x, pl.y];
}
function dropBody(where){
  const pl = T.player, b = T.bodies.find(x=>x.id===pl.carrying); if (!b) return;
  b.carried = false; pl.carrying = null;
  if (!where){ b.x = pl.x; b.y = pl.y; b.hidden = null; b.inside = buildingAt(pl.x,pl.y); sfx("punch"); return; }
  b.hidden = where.key; b.hiddenDay = T.day; b.cold = !!where.cold; b.dump = !!where.dump;
  if (where.key==="pond"){ sfx("splash"); T.fx.push({kind:"splash", x:where.x*TS+8, y:where.y*TS+8, life:1}); toast("The pond swallows it. Ripples, then nothing.", "", 4); }
  else if (where.key.startsWith("grave")){ toast("You tamp down the earth. A fresh mound.", "", 4); }
  else toast(`You stuff ${b.name.split(" ")[0]} into the ${where.name.toLowerCase()} and shut it.`, "", 4);
  if (T.det.hiding && insideOf(pl)==="roomC") T.det.hiding.saw.push(`hiding a body in their ${where.name||"room"}`);
  saveT();
}
function hideSpotFacing(){
  const pl = T.player, [fx,fy] = facingT(), k = fx+","+fy, c = T.containers[k];
  if (c && c.hide) return {key:k, name:c.name, cold:c.cold, dump:c.dump};
  if (tileT(fx,fy)==="w" && "dbg".includes(tileT(pl.x,pl.y))) return {key:"pond", name:"pond", x:fx, y:fy};
  return null;
}
function diggable(x,y){ return "uv".includes(tileT(x,y)) && !T.graves.some(g=>g.x===x&&g.y===y); }

// ---------- discovery ----------
function discoverBody(b, finder, how){
  if (b.discovered) return;
  b.discovered = true; b.foundBy = finder ? finder.id : null; b.foundDay = T.day;
  if (b.hidden){
    const k = b.hidden; let pos = null;
    if (k==="pond"){ pos = PLACES.pond.spots.find(s=>tileT(s[0],s[1])==="b") || [82,70]; }
    else if (k.startsWith("grave:")){ pos = k.slice(6).split(",").map(Number); }
    else { const [cx,cy] = k.split(",").map(Number); pos = DIRS4.map(([dx,dy])=>[cx+dx,cy+dy]).find(([x,y])=>WALK_T.has(tileT(x,y))) || [cx,cy+1]; }
    b.x = pos[0]; b.y = pos[1]; b.hidden = null;
  }
  b.foundAt = placeLabelAt(b.x,b.y);
  const victim = byIdT(b.id);
  if (finder){ sayT(finder, pick(["AAAAH!","Oh my God… it's "+victim.first+"!","SOMEBODY HELP!"]), 4); sfx("scream"); emoteT(finder,"!",3); }
  newsT(`BODY FOUND: ${b.name} was found dead at ${b.foundAt}${how ? ` (${how})` : ""}.`, [], false, "body");
  banner("A BODY HAS BEEN FOUND", `${b.name}, at ${b.foundAt}. The town is shaken.`, true, 6);
  T.missing = T.missing.filter(id=>id!==b.id);
  for (const o of folk) if (alive(o)){ rememberT(o, `${victim.first} was found dead at ${b.foundAt}. Murdered.`); o.mood = pick(["shaken","scared","grim","furious"]); if (relGetT(o.id,b.id) >= 40) o.mood = "grieving"; }
  T.event = {day:T.day, kind:"curfew", text:`Curfew after 8pm. ${victim.first} was murdered.`};
  T.funeral = {day:T.day+1, who:b.id};
  // linking it to you
  let w = 18;
  const seen = victim.lastSeenWithPlayer && b.diedAt - victim.lastSeenWithPlayer < 240;
  if (seen) w += 22;
  if (b.inside==="roomC" || (b.hidden||"").startsWith("89,")) w += 80;
  const trail = T.stains.filter(s=>!s.cleaned && buildingAt(s.x,s.y)==="roomC").length; if (trail) w += 30;
  addEvidence(`${b.name} found dead at ${b.foundAt}.${seen?" Last seen with the newcomer.":""}${trail?" Blood in the newcomer's room.":""}`, w, "body");
  const d = detP(); if (d && detAlive() && !T.lock){ d.order = {type:"go_to", place:nearestPlaceId(b.x,b.y), until:absT()+80}; }
  T.notoriety = clamp(T.notoriety + (seen ? 20 : 8), 0, 100);
  sfx("stinger");
}
function nearestPlaceId(x,y){ const b = buildingAt(x,y); if (b) return b; let best = "square", bd = 1e9; for (const k in PLACES){ const p = PLACES[k]; if (!p.rect) continue; const cx = (p.rect[0]+p.rect[2])/2, cy = (p.rect[1]+p.rect[3])/2; const d = Math.hypot(cx-x,cy-y); if (d<bd){ bd=d; best=k; } } return best; }
function crimeSecondTick(){
  const pl = T.player;
  // visible bodies get found
  for (const b of T.bodies){
    if (b.discovered || b.hidden || b.carried) continue;
    for (const o of folk) if (alive(o) && !o.away && !o.asleep && !o.hidden && canSeeT(o, b.x, b.y, 7)){ discoverBody(b, o); o.order = {type:"report", what:"body", until:absT()+120, run:true}; break; }
  }
  // someone sees you carrying a body
  if (pl.carrying){
    for (const o of folk) if (alive(o) && !o.away && !o.asleep && !o.hidden && canSeeT(o, pl.x, pl.y, 8)){
      const b = T.bodies.find(x=>x.id===pl.carrying);
      if (o.sheriff){ arrestSequence(`The sheriff caught you carrying ${b.name}.`, true); return; }
      if (isDet(o)){ addEvidence(`I watched the newcomer carry ${b.name}'s body.`, 120, "carry"); return; }
      if (!o.order || o.order.type!=="report"){ sayT(o, "Is that… is that a BODY?!", 3); sfx("scream"); rememberT(o, `I saw the newcomer carrying ${b.name}'s body!`); o.order = {type:"report", what:"carry", about:"player", victim:b.id, until:absT()+150, run:true}; T.notoriety = 100; }
    }
  }
  // stains get noticed
  for (const s of T.stains){
    if (s.cleaned) continue;
    for (const o of folk){
      if (!alive(o) || o.asleep || o.away || s.seenBy.includes(o.id) || !canSeeT(o, s.x, s.y, 4)) continue;
      s.seenBy.push(o.id);
      rememberT(o, `I noticed a dark stain, like dried blood, at ${placeLabelAt(s.x,s.y)}.`);
      if (Math.random()<.5) sayT(o, "Is that… blood?", 2.5);
      if (isDet(o)) addEvidence(`Blood at ${placeLabelAt(s.x,s.y)}.${buildingAt(s.x,s.y)==="roomC"?" In the newcomer's room.":""}`, buildingAt(s.x,s.y)==="roomC" ? 35 : 6, "stain");
      else gossipT(o, `There's blood at ${placeLabelAt(s.x,s.y)}. I'm not imagining it.`);
    }
  }
  // drag marks
  if (pl.carrying && T.lastDrag && (Math.abs(pl.x-T.lastDrag[0])+Math.abs(pl.y-T.lastDrag[1]) >= 3)){ if (Math.random()<.5) addStain(pl.x, pl.y); T.lastDrag = [pl.x, pl.y]; }
  // delayed evidence
  if (T.pendingEvidence && T.pendingEvidence.length){ const due = T.pendingEvidence.filter(e=>e.at <= absT()); T.pendingEvidence = T.pendingEvidence.filter(e=>e.at > absT()); for (const e of due) addEvidence(e.text, e.w, "report"); }
}
// Hourly: smells, the garbage truck, the freezer, the pond.
function crimeHourTick(){
  const h = hourNow();
  for (const b of T.bodies){
    if (b.discovered || !b.hidden) continue;
    const ageDays = (absT() - b.diedAt) / 1440;
    if (b.hidden==="pond"){ if (h===6 && ageDays >= 2 && Math.random()<.35){ discoverBody(b, null, "washed up on the shore of the pond"); } continue; }
    if (b.hidden.startsWith("grave:")){
      const D = T.det; if (detAlive() && D.suspicion >= 60 && D.evidence.some(e=>e.kind==="dig") && Math.random()<.08){ const d = detP(); discoverBody(b, d, "dug up from a fresh mound"); addEvidence(`Dug up ${b.name} where the newcomer was digging.`, 60, "body"); }
      continue;
    }
    const c = T.containers[b.hidden]; if (!c) continue;
    if (b.dump && dayName()==="Thursday" && h===7){ discoverBody(b, null, "the garbage collector found it in a dumpster"); continue; }
    if (b.cold){ if (Math.random()<.025 && folk.some(n=>alive(n) && (n.work==="diner") && buildingAt(n.x,n.y)==="diner")) discoverBody(b, folk.find(n=>n.work==="diner" && alive(n)), "in the diner's freezer"); continue; }
    if (ageDays >= 1.2){
      const [cx,cy] = b.hidden.split(",").map(Number);
      const near = folk.filter(n=>alive(n) && !n.asleep && Math.hypot(n.x-cx,n.y-cy) < 5);
      for (const n of near){ if (Math.random() < .18 + ageDays*.06){ sayT(n, "What is that SMELL?", 3); rememberT(n, `Something stinks horribly at ${placeLabelAt(cx,cy)}.`); if (Math.random()<.5){ discoverBody(b, n, `found because of the smell`); break; } } }
    }
  }
}
// Each morning, people notice who's gone.
function missingCheck(){
  for (const b of T.bodies){
    if (b.discovered || T.missing.includes(b.id) || absT() - b.diedAt < 500) continue;
    const v = byIdT(b.id);
    T.missing.push(b.id);
    const reporter = folk.find(n=>alive(n) && (n.spouse===v.id || n.home===v.home || n.parent===v.id || n.child===v.id)) || folk.find(n=>alive(n) && relGetT(n.id,v.id) >= 30);
    newsT(`MISSING: ${b.name} hasn't been seen since ${dayName(Math.floor(b.diedAt/1440))}.${reporter ? ` ${reporter.first} is worried sick.` : ""}`, [], false, "missing");
    banner("MISSING PERSON", `${b.name} hasn't been seen in a day.`, false, 5);
    for (const o of folk) if (alive(o)) rememberT(o, `${v.first} has gone missing. Nobody's seen them since ${dayName(Math.floor(b.diedAt/1440))}.`);
    const seen = v.lastSeenWithPlayer && b.diedAt - v.lastSeenWithPlayer < 300;
    addEvidence(`${v.first} has gone missing.${seen ? " The newcomer was the last one seen with them." : ""}`, seen ? 15 : 4, "missing");
  }
}
function deliverReport(n, sh, o){
  sayT(n, o.what==="murder" ? "Sheriff! I saw it! The newcomer—" : o.what==="body" ? "Sheriff, there's a body!" : "Sheriff, you've got to do something!", 4);
  rememberT(sh, `${n.first} reported: ${o.what} ${o.about==="player" ? "by the newcomer" : ""}.`);
  if (o.about==="player"){
    const w = o.what==="murder" ? 70 : o.what==="carry" ? 70 : o.what==="attacked" ? 15 : o.what==="poster" ? 12 : 6;
    addEvidence(`${n.first} told the sheriff the newcomer ${o.what==="murder" ? `killed ${nmT(o.victim)}` : o.what==="carry" ? "was carrying a body" : "attacked someone"}.`, w, "witness");
    if (o.what==="murder" || o.what==="carry"){ T.notoriety = 100; if (!T.lock) arrestSequence(`${n.first} went to the sheriff about what you did.`, !detAlive()); }
    else if (["poster","talk","theft"].includes(o.what)){ sh.order = {type:"approach", reason:`${n.first} came to you about the newcomer: ${o.text || (o.what==="poster" ? "they look like the man on the WANTED poster" : o.what==="theft" ? "they were caught going through someone's things" : "something they said")}. Question them firmly. You might search them.`, until:absT()+90}; }
    else { sh.order = {type:"arrestPlayer", until:absT()+80, run:true}; }
  }
}
function jailT(why){
  const pl = T.player;
  closeTalkT(); closeTWindows(); pl.carrying = null; pl.fight = null;
  const taken = pl.inv.filter(i=>weaponDmg(i) || isEvidence(i));
  for (const it of taken){ pl.inv.splice(pl.inv.indexOf(it),1); }
  if (taken.some(i=>PRISON_TELLTALE.has(i))) addEvidence(`The sheriff booked the newcomer and took: ${taken.join(", ")}. Some of it looks like prison issue.`, 25, "booking");
  addEvidence(`The newcomer spent a night in the sheriff's cells for ${why}. Fingerprints on file now.`, 12, "booking");
  T.notoriety = clamp(T.notoriety+15,0,100);
  fadeT(1.8, () => {
    if (T.t >= 360) T.day += 1; T.t = 8*60;
    pl.x=pl.fx=57; pl.y=pl.fy=22; pl.prog=1; pl.hp = Math.max(pl.hp, 60);
    addMoney(-Math.min(T.money, 25), "Fine");
    newsT(`The newcomer spent a night in the sheriff's cells for ${why}.`, []);
    toast(`A night in the cells. They confiscated: ${taken.length ? taken.join(", ") : "nothing"}.`, "bad", 6); if (!pl.inv.includes(T.sel)) T.sel = null; pl.wearJumpsuit = pl.wearJumpsuit && pl.inv.includes("prison jumpsuit"); renderHotbarT();
    saveT();
  }, "One night in the cells…");
}
// Cleaning blood.
function stainHere(){ const pl = T.player, [fx,fy] = facingT(); return T.stains.find(s=>!s.cleaned && ((s.x===pl.x&&s.y===pl.y)||(s.x===fx&&s.y===fy))); }
