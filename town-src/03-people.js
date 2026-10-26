// People: a fresh cast every game, their looks and voices, homes, jobs, routines and errands.
const JOBS = [
  {job:"diner owner", work:"diner", hours:[7,20], items:["coffee","pie slice"], sunday:true},
  {job:"short-order cook", work:"diner", hours:[6,15], items:["kitchen knife","burger"], apron:"#f4f4f4"},
  {job:"shopkeeper", work:"store", hours:[8,18], items:["newspaper","lottery ticket"], apron:"#3b5dc9"},
  {job:"bartender", work:"bar", hours:[15,26], items:["whiskey","beer"], lives:"barback", nightOwl:true, sunday:true},
  {job:"barber", work:"barber", hours:[9,17], items:["razor blade","hat"], apron:"#f4f4f4"},
  {job:"nurse", work:"clinic", hours:[8,17], items:["bandage","medicine"], collar:"#f4f4f4"},
  {job:"postmaster", work:"post", hours:[8,16], items:["letter","newspaper"], tie:"#b13e53"},
  {job:"hotel keeper", work:"hotel", hours:[7,22], items:["coffee","book"], lives:"roomA", sunday:true},
  {job:"station master", work:"station", hours:[7,19], items:["train ticket"], tie:"#29366f", sunday:true},
  {job:"librarian", work:"library", hours:[9,17], items:["book","reading glasses"]},
  {job:"arcade owner", work:"arcade", hours:[12,23], items:["lottery ticket","milkshake"], nightOwl:true, sunday:true},
  {job:"pastor", work:"church", hours:[8,16], items:["book","flowers"], collar:"#f4f4f4", pious:true, sunday:true},
  {job:"mechanic", work:"garage", hours:[8,17], items:["wrench","rope"]},
  {job:"farmer", work:"farm", hours:[5,16], items:["shovel","apple pie"], early:true, sunday:true},
  {job:"fisherman", work:"pond", hours:[5,12], items:["fishing rod","perch"], early:true, sunday:true},
  {job:"painter", work:"park", hours:[10,16], items:["flowers","book"]},
  {job:"retired schoolteacher", work:null, items:["book","chocolate"]},
  {job:"retiree who walks everywhere", work:null, items:["newspaper","donut"]},
  {job:"teenager who lives at the arcade", work:"arcade", hours:[15,22], items:["lottery ticket","donut"], teen:true},
  {job:"traveling salesman who arrived last month", work:"square", hours:[10,17], items:["record","sunglasses","wallet"], lives:"roomB", sunday:true}
];
const SKINS = ["#f4c7a1","#e8b48a","#d49a6a","#c58d68","#a8714f","#8a5a3c","#6b4430","#5e3b28","#4a2e1e","#f0d0b8"];
const HAIRS = ["#1a1210","#3f2616","#5e3a24","#8b5a3c","#c8a374","#ffcd75","#b13e53","#94b0c2","#d8d6cf","#efefef","#2a1a14"];
const SHIRTS = ["#3b5dc9","#38b764","#b13e53","#ef7d57","#ffcd75","#5d275d","#257179","#94b0c2","#8b5a3c","#e07ab0","#41a6f6","#a7f070","#f4ecd8","#566c86"];
const STYLES_HE = ["short","bald","neat","messy","buzz","slick","afro","curly","hat","beanie"];
const STYLES_SHE = ["long","bob","ponytail","curly","afro","bun","short","hat"];

function genVoice(p){
  const base = p.pron==="he" ? 85+Math.random()*80 : p.pron==="she" ? 200+Math.random()*130 : 150+Math.random()*90;
  return {base: base + (p.teen?60:0), wave: pick(["sawtooth","square","triangle","sawtooth"]), range: 2+Math.random()*6, len: .05+Math.random()*.05,
    slide: .88+Math.random()*.16, formant: p.pron==="he" ? .8+Math.random()*.15 : p.pron==="she" ? 1.05+Math.random()*.18 : .95+Math.random()*.12,
    speed: .8+Math.random()*.55, vib: Math.random()<.15};
}
function genLook(p){
  const shirt = pick(SHIRTS);
  E.SUITS["t_"+p.id] = [shirt, shade(shirt,-.3), shade(shirt,.25)];
  let style = pick(p.pron==="he" ? STYLES_HE : p.pron==="she" ? STYLES_SHE : STYLES_HE.concat(STYLES_SHE));
  if (style==="bun") style = "ponytail";
  const old = p.age > 60;
  const L = {suit:"t_"+p.id, civ:true, skin:pick(SKINS), hair: old ? pick(["#d8d6cf","#efefef","#94b0c2"]) : pick(HAIRS), style,
    pants: pick(["#29366f","#3e2a1c","#333c57","#566c86","#5e3a24","#1a1c2c"]), hatColor: pick(["#3e2a1c","#29366f","#b13e53","#566c86","#5d275d"]),
    glasses: Math.random() < (old ? .45 : .15), beard: p.pron==="he" && Math.random()<.3 ? null : null};
  if (p.pron==="he" && Math.random()<.3) L.beard = shade(L.hair, -.1);
  if (p.pron==="he" && !L.beard && Math.random()<.2) L.mustache = shade(L.hair, -.1);
  if (p.jobDef.apron) L.apron = p.jobDef.apron;
  if (p.jobDef.collar) L.collar = p.jobDef.collar;
  if (p.jobDef.tie) L.tie = p.jobDef.tie;
  if (p.sheriff){ E.SUITS["t_"+p.id] = ["#8b5a3c","#5e3a24","#a87048"]; L.badge = true; L.style = "hat"; L.hatColor = "#5e3a24"; L.pants = "#3e2a1c"; }
  return L;
}
function newPerson(i, jobDef){
  const pron = jobDef.teen ? pick(["he","she","they"]) : Math.random()<.46 ? "he" : Math.random()<.9 ? "she" : "they";
  const p = {
    id:"p"+i, first:pick(FIRST), last:pick(LAST), pron, age: jobDef.teen ? 16 : jobDef.job.includes("retire") ? 66+Math.floor(Math.random()*14) : 24+Math.floor(Math.random()*40),
    job:jobDef.job, jobDef, work:jobDef.work, hours:jobDef.hours||null, sheriff:!!jobDef.sheriff, teen:!!jobDef.teen,
    traits:shuffle(TRAITS.slice()).slice(0, 2+Math.floor(Math.random()*2)), hobbies:shuffle(HOBBIES.slice()).slice(0,2), likes:shuffle(LIKES.slice()).slice(0,3),
    dislikes:shuffle(["loud people","liars","the city","cats","rain","newcomers","the sheriff","gossip","church","card cheats"].slice()).slice(0,2),
    secret:"", tells:[], bio:"", style:"", quirk:"",
    home:null, x:0, y:0, fx:0, fy:0, prog:1, dir:[0,1], walkT:0, path:[], wait:Math.random()*3, routine:null, freeChoice:null, freeUntil:0,
    opinion: Math.round(Math.random()*16-4), trust: Math.round(Math.random()*8), mood:"fine", inv:(jobDef.items||[]).slice(), money: 20+Math.floor(Math.random()*180),
    memories:[], log:[], gossip:[], bubble:null, emote:null, barkAt:0, hp:100, maxHp:100, dead:false, order:null, fight:null, scene:null, chatCd:0, approachCd:0,
    met:false, seenPoster:false, partner:false, spouse:null, asleep:false, strength: 7+Math.floor(Math.random()*8), timid: Math.random()<.4, lastSeenWithPlayer:0, lunchOut: Math.random()<.45
  };
  if (pron==="he" && Math.random()<.5) p.strength += 3;
  if (jobDef.pious || Math.random()<.35) p.churchgoer = true;
  if (p.sheriff){ p.first = pick(["Wade","Della","Boone","Marlene","Hank","Ruth"]); p.strength = 15; p.timid = false; p.maxHp = p.hp = 150; p.inv = ["baseball bat","coffee"]; }
  p.look = genLook(p); p.voice = genVoice(p);
  p.likes.push(pick(["coffee","apple pie","flowers","whiskey"]));
  return p;
}
function genTown(){
  const homes = BUILDINGS.filter(b=>b.kind==="home");
  const people = JOBS.map((j,i)=>newPerson(i, j));
  people.push(newPerson(JOBS.length, {job:"sheriff", work:"sheriff", hours:[7,19], sheriff:true, items:[]}));
  // unique first names
  const used = new Set();
  for (const p of people){ while (used.has(p.first)) p.first = pick(FIRST); used.add(p.first); }
  // homes: some live at work, the rest share 12 houses
  const free = shuffle(homes.slice());
  const homeless = [];
  for (const p of people){ if (p.jobDef.lives) p.home = p.jobDef.lives; else homeless.push(p); }
  shuffle(homeless);
  const teen = homeless.find(p=>p.teen);
  const adults = homeless.filter(p=>p!==teen);
  // three married couples, a parent and teen, and roommates if needed
  const pairs = [];
  for (let i=0;i<3;i++){ const a = adults.shift(), b = adults.shift(); if (a && b){ pairs.push([a,b,"married"]); } }
  if (teen){ const parent = adults.shift(); if (parent) pairs.push([parent, teen, "parent"]); }
  for (const [a,b,kind] of pairs){ const h = free.shift(); a.home = b.home = h.id; if (kind==="married"){ a.spouse = b.id; b.spouse = a.id; b.last = a.last; } else { b.last = a.last; b.parent = a.id; a.child = b.id; } }
  while (adults.length){ const a = adults.shift(); const h = free.shift(); if (h) a.home = h.id; else { const b2 = adults.length ? adults.shift() : null; a.home = pairs[0][0].home; if (b2) adults.unshift(b2); } }
  for (const p of people) if (!p.home) p.home = pick(homes).id;
  // relationships
  T.rel = {};
  for (let i=0;i<people.length;i++) for (let j=i+1;j<people.length;j++) T.rel[relKeyT(people[i].id, people[j].id)] = Math.round(Math.random()*26-8);
  for (const p of people){ if (p.spouse) T.rel[relKeyT(p.id,p.spouse)] = 65+Math.floor(Math.random()*25); if (p.child) T.rel[relKeyT(p.id,p.child)] = 55; }
  const adultsAll = people.filter(p=>!p.teen);
  for (let i=0;i<3;i++){ const [a,b] = shuffle(adultsAll.slice()).slice(0,2); if (a.spouse!==b.id) T.rel[relKeyT(a.id,b.id)] = 45+Math.floor(Math.random()*20); }
  for (let i=0;i<3;i++){ const [a,b] = shuffle(adultsAll.slice()).slice(0,2); if (a.spouse!==b.id) T.rel[relKeyT(a.id,b.id)] = -35-Math.floor(Math.random()*25); }
  // secrets
  for (const p of people){
    if (p.teen){ p.secret = pick(["has been sneaking out at night to the woods","took money from a parent's wallet","has a crush on someone way too old for them"]); continue; }
    const others = people.filter(o=>o!==p && !o.teen);
    let tpl = pick(SECRETS), X = pick(others);
    if (tpl.includes("affair")){ const cand = others.filter(o=>o.id!==p.spouse); X = pick(cand); T.rel[relKeyT(p.id,X.id)] = Math.max(relGetT(p.id,X.id), 40); }
    p.secret = tpl.replace("{X}", `${X.first} ${X.last}`);
    if (tpl.includes("{X}")) p.secretAbout = X.id;
  }
  // nosy neighbor: a red herring who also watches people
  const nosy = pick(people.filter(p=>!p.sheriff && !p.teen)); nosy.nosy = true; if (!nosy.traits.includes("nosy")) nosy.traits.push("nosy");
  // the detective
  const cands = people.filter(p=>!p.sheriff && !p.teen && p!==nosy);
  const det = pick(cands);
  const tells = shuffle(TELLS.slice());
  det.tells = [tells[0].id, tells[1].id];
  const herrings = shuffle(people.filter(p=>p!==det && !p.teen)).slice(0,3);
  herrings[0].tells = [tells[0].id]; herrings[1].tells = [tells[1].id]; herrings[2].tells = [tells[2].id];
  folk = T.folk = people;
  T.det = {id:det.id, suspicion:8, evidence:[{s:"before you arrived", text:"A newcomer shows up the same week #4471 broke out of Cellblock Nine.", w:8, kind:"timing"}],
    notes:[], mode:"blend", modeUntil:0, nextBrain:0, revealed:false, dead:false, lastSeen:null, claims:[], searchCount:0, notesLeft:0, hides:0, agency:"State Bureau of Investigation", realName:`${pick(FIRST.filter(f=>!used.has(f)))} ${pick(LAST.filter(l=>l!==det.last))}`, accusations:0};
  // starting places: everyone at home or work
  for (const p of people){ const r = routinePlace(p); const s = randomSpot(r ? r.place : p.home) || randomSpot(p.home) || [50,40]; p.x = p.fx = s[0]; p.y = p.fy = s[1]; }
  for (const b of BUILDINGS) b.residents = people.filter(p=>p.home===b.id).map(p=>p.id);
  return people;
}
// Fallback text for backstories when Claude isn't available.
function proceduralBios(){
  for (const p of folk){
    const t = p.traits.join(", ");
    p.bio = p.bio || `${p.first} ${p.last}, ${p.age}, ${p.job} in Millbrook. ${cap(p.pron)} ${p.pron==="they"?"are":"is"} ${t}. ${p.spouse ? `Married to ${nmT(p.spouse)}.` : ""}${p.child ? ` Parent of ${nmT(p.child)}.` : ""}`;
    p.style = p.style || pick(["Talks fast and laughs at their own jokes.","Short sentences. Doesn't waste words.","Old-fashioned manners, lots of 'dear'.","Rambles and changes the subject.","Dry and deadpan.","Warm and nosy, asks lots of questions."]);
    p.quirk = p.quirk || pick(["collects bottle caps","talks to their plants","hums hymns","is never without a toothpick","keeps a lucky coin","counts things out loud"]);
  }
}
const cap = s => s.charAt(0).toUpperCase()+s.slice(1);
const they = p => p.pron==="he" ? "he" : p.pron==="she" ? "she" : "they";
const them = p => p.pron==="he" ? "him" : p.pron==="she" ? "her" : "them";
const their = p => p.pron==="he" ? "his" : p.pron==="she" ? "her" : "their";

// ---------- geometry ----------
const rposT = e => [e.fx+(e.x-e.fx)*e.prog, e.fy+(e.y-e.fy)*e.prog];
const distT = (a,b) => { const [ax,ay]=rposT(a),[bx,by]=rposT(b); return Math.hypot(ax-bx,ay-by); };
function canSeeT(n, tx, ty, range){
  if (n.asleep || n.dead || n.hidden) return false;
  const [nx,ny] = n.fx!==undefined ? rposT(n) : [n.x,n.y];
  const r = range || (isNightT() && !lit(nx,ny) ? 5 : 9);
  const d = Math.hypot(nx-tx, ny-ty); if (d > r) return false;
  const steps = Math.ceil(d*4);
  for (let i=1;i<steps;i++){ const x = Math.round(nx+(tx-nx)*i/steps), y = Math.round(ny+(ty-ny)*i/steps); if (SIGHT_T.has(tileT(x,y))) return false; if (tileT(x,y)==="D" && doorLockedT(x,y,null) && !(x===Math.round(tx)&&y===Math.round(ty))) return false; }
  return true;
}
function lit(x,y){ return tileT(Math.round(x),Math.round(y))==="l" || [[0,1],[1,0],[0,-1],[-1,0],[0,2],[2,0]].some(([dx,dy])=>tileT(Math.round(x)+dx,Math.round(y)+dy)==="l"); }
function bfsT(sx,sy,tx,ty,walk,limit=9000){
  if (sx===tx && sy===ty) return [];
  const prev = new Int32Array(TW*TH).fill(-1), start = sy*TW+sx, goal = ty*TW+tx, q = [start]; prev[start] = start;
  for (let h=0;h<q.length && h<limit;h++){ const c = q[h]; if (c===goal) break; const cx = c%TW, cy = (c/TW)|0;
    for (const [dx,dy] of DIRS4){ const nx=cx+dx, ny=cy+dy; if (nx<0||ny<0||nx>=TW||ny>=TH) continue; const ni = ny*TW+nx; if (prev[ni]!==-1 || (ni!==goal && !walk(nx,ny))) continue; prev[ni]=c; q.push(ni); } }
  if (prev[goal]===-1) return null;
  const path = []; let c = goal; while (c!==start){ path.push([c%TW,(c/TW)|0]); c = prev[c]; } return path.reverse();
}
function stepT(e,dx,dy){ e.fx=e.x; e.fy=e.y; e.x+=dx; e.y+=dy; e.prog=0; e.dir=[dx,dy]; }
function faceToT(n, o){ const dx = o.x-n.x, dy = o.y-n.y; n.dir = Math.abs(dx)>=Math.abs(dy) ? [Math.sign(dx)||1,0] : [0,Math.sign(dy)||1]; }
function goToT(n, x, y, stopShort){
  if (n.path.length && performance.now() < (n.repath||0)) return true;
  n.repath = performance.now()+700;
  const p = bfsT(n.x,n.y,x,y,(a,b)=>npcWalkT(a,b,n));
  if (p){ n.path = stopShort ? p.slice(0, Math.max(0,p.length-1)) : p; return true; }
  return false;
}
function sayT(n, text, secs=4){ n.bubble = {text, until:performance.now()+secs*1000}; }
function emoteT(n, ch, secs=1.6){ n.emote = {ch, until:performance.now()+secs*1000}; }
const insideOf = e => buildingAt(Math.round(rposT(e)[0]), Math.round(rposT(e)[1]));

// ---------- routines ----------
function worksToday(n){ return dayName()!=="Sunday" || n.jobDef.sunday; }
function bestFriendT(n){ let best=null, bv=25; for (const o of folk){ if (o===n || !alive(o)) continue; const v = relGetT(n.id,o.id); if (v>bv){ bv=v; best=o; } } return best; }
function freePlace(n){
  const opts = [];
  for (const h of n.hobbies){
    if (["darts","cards","drinking"].includes(h)) opts.push("bar","bar");
    else if (h==="arcade") opts.push("arcade");
    else if (h==="fishing") opts.push("pond");
    else if (h==="reading") opts.push("library");
    else if (["gardening","walks in the park","painting"].includes(h)) opts.push("park","square");
    else if (h==="church choir") opts.push("church");
    else if (h==="dancing") opts.push("bar");
    else if (h==="gossip") opts.push("diner","square");
  }
  opts.push(n.home, n.home, "square", "diner");
  const f = bestFriendT(n);
  if (f && Math.random()<.3) return {place:f.home, visit:f.id};
  if (n.nosy && Math.random()<.4) return {place:"elmst", nosy:true};
  return {place:pick(opts)};
}
function routinePlace(n){
  if (n.dead) return null;
  const h = hourNow(), hh = h < 4 ? h+24 : h;
  const sleepAt = n.jobDef.nightOwl ? 26 : n.teen ? 23 : 22, wake = n.jobDef.early ? 5 : 7;
  if (hh >= sleepAt || h < wake) return {place:n.home, sleep:true};
  const ev = T.event && T.event.day===T.day ? T.event : null;
  if (ev && ev.kind==="curfew" && h>=20) return {place:n.home, sleep:h>=22};
  if (dayName()==="Sunday" && h>=9 && h<11 && (n.churchgoer || n.jobDef.pious)) return {place:"church"};
  if (ev && ev.kind==="dance" && h>=20 && h<23 && (n.hobbies.includes("dancing") || n.traits.includes("romantic") || Math.random()<.5)) return {place:"barn"};
  if (ev && ev.kind==="market" && h>=9 && h<13 && Math.random()<.6) return {place:"square"};
  if (ev && ev.kind==="funeral" && h>=10 && h<12) return {place:"cemetery"};
  if (n.work && n.hours && worksToday(n) && hh>=n.hours[0] && hh<n.hours[1]){
    if (h===12 && n.work!=="diner" && n.lunchOut) return {place:"diner"};
    return {place:n.work};
  }
  if (performance.now() > n.freeUntil || !n.freeChoice){ n.freeChoice = freePlace(n); n.freeUntil = performance.now() + 50000 + Math.random()*40000; }
  return n.freeChoice;
}
function sleepSpot(n){
  const bid = n.home, r = roomRect(bid), bd = bById(outerOf(bid));
  const [x0,y0,x1,y1] = r ? r : [bd.x0+1,bd.y0+1,bd.x1-1,bd.y1-1];
  const spots = [];
  for (let y=y0;y<=y1;y++) for (let x=x0;x<=x1;x++){ const c = tileT(x,y); if (c==="B") spots.unshift([x,y]); else if (c==="S") spots.push([x,y]); }
  const taken = folk.filter(o=>o!==n && o.home===n.home && o.asleep).map(o=>o.x+","+o.y);
  return spots.find(s=>!taken.includes(s.join(","))) || randomSpot(bid);
}
function updateFolk(n, dt){
  if (n.dead || n.away) return;
  const pl = T.player;
  if (n.prog < 1){ const sp = (n.fight || (n.order && n.order.run)) ? 4.6 : n.order && n.order.creep ? 2.2 : 3; n.prog = Math.min(1, n.prog+dt*sp); n.walkT += dt*sp; return; }
  if (n.scene) return;
  if (n.talkingToPlayer) return;
  if (n.fight){}
  else if (n.order){ if (isDet(n) && detRunOrder(n, dt)) {} else runOrderT(n, dt); }
  if (n.path.length){
    const [x,y] = n.path.shift();
    if (Math.abs(x-n.x)+Math.abs(y-n.y)===1 && npcWalkT(x,y,n)){ stepT(n, x-n.x, y-n.y); n.asleep = false; }
    else n.path = [];
    return;
  }
  if (n.fight || n.order) return;
  n.wait -= dt; if (n.wait > 0) return;
  const r = routinePlace(n);
  n.routine = r;
  if (r && r.sleep && buildingAt(n.x,n.y)===n.home){
    const s = sleepSpot(n);
    if (s && (n.x!==s[0] || n.y!==s[1])){ goToT(n, s[0], s[1]); n.wait = 2; return; }
    n.asleep = true; n.wait = 6; return;
  }
  n.asleep = false;
  const here = buildingAt(n.x,n.y);
  const target = r ? r.place : n.home;
  const inPlace = PLACES[target] && PLACES[target].building ? here===PLACES[target].building : (() => { const p = PLACES[target]; return p && p.rect && n.x>=p.rect[0]&&n.x<=p.rect[2]&&n.y>=p.rect[1]&&n.y<=p.rect[3]; })();
  const spot = randomSpot(target);
  if (spot && (!inPlace || Math.random()<.5)){
    if (!goToT(n, spot[0], spot[1])){
      // locked out: wait by the door, or give up and go home
      const bd = PLACES[target] && PLACES[target].building && bById(outerOf(PLACES[target].building));
      if (bd && Math.random()<.5){ const d = bd.door; goToT(n, d[0], d[1]+(d[1]===bd.y1?1:-1)); }
      else { n.freeChoice = {place:n.home}; }
    }
  }
  n.wait = inPlace ? 3+Math.random()*9 : 1;
}

// ---------- errands people agree to ----------
const ORDER_WORDS_T = {follow:"sticking close to you", go_to:"heading somewhere", deliver:"delivering something", bring:"bringing you something", approach:"coming to talk", flee:"running away", fetch:"looking for something", steal:"sneaking somewhere", attack:"going after someone", meet:"waiting to meet you", report:"running to the sheriff", investigate:"looking into something", tail:"going for a walk", watch:"standing around", search:"running an errand", hide:"somewhere", question:"chatting with a neighbor", confront:"coming to talk", visit:"visiting a friend", distract:"chatting someone up"};
function orderWordT(o){
  if (!o) return "";
  if (o.type==="go_to") return `heading to ${PLACES[o.place] ? PLACES[o.place].label : "somewhere"}`;
  if (o.type==="attack") return `going after ${o.target==="player" ? "you" : nmT(o.target)}`;
  if (o.type==="bring"||o.type==="fetch") return `${o.type==="fetch"?"looking for":"bringing you"} ${o.item}`;
  return ORDER_WORDS_T[o.type] || o.type;
}
function finishOrderT(n, msg){ n.order = null; n.path = []; if (msg) sayT(n, msg, 4); }
function handOverT(n, item){
  const i = n.inv.indexOf(item); if (i<0){ sayT(n, "Lost it. Sorry."); return; }
  n.inv.splice(i,1); addItemT(item);
  sayT(n, pick(["Here you go.","Like I said.","Don't tell anyone where you got it."]), 3.5);
  toast(`${n.first} gave you: ${item}`, "good", 4); logLineT(n, "e", `${n.first} brought you the ${item}.`); rememberT(n, `I brought the newcomer the ${item}.`);
  n.trust = clamp(n.trust+2, 0, 100);
}
function runOrderT(n, dt){
  const o = n.order, pl = T.player;
  if (absT() > o.until){ finishOrderT(n, o.type==="follow" ? "I'd better get going." : null); return; }
  switch (o.type){
    case "approach":
      if (T.talkId || anyTWindow() || T.lock){ finishOrderT(n); return; }
      if (distT(n,pl) <= 1.5){ n.path = []; const reason = o.reason; n.order = null; faceToT(n, pl); openTalkT(n, {approach:reason}); return; }
      goToT(n, pl.x, pl.y, true); return;
    case "bring":
      if (distT(n,pl) <= 1.5 && !T.talkId){ n.path = []; faceToT(n,pl); handOverT(n, o.item); n.order = null; return; }
      goToT(n, pl.x, pl.y, true); return;
    case "follow":
      if (distT(n,pl) > 2.4) goToT(n, pl.x, pl.y, true); else n.path = [];
      for (const e of folk) if (e!==n && e.fight && e.fight.target==="player" && !n.fight && distT(n,e)<6){ sayT(n, "Hey! Back off!"); startFightT(n, e); break; }
      return;
    case "go_to": case "meet": case "visit":
      if (!o.tgt) o.tgt = randomSpot(o.place);
      if (!o.tgt){ finishOrderT(n); return; }
      if (n.x===o.tgt[0] && n.y===o.tgt[1]){ n.path = []; if (!o.arrived){ o.arrived = true; } }
      else if (!goToT(n, o.tgt[0], o.tgt[1])) o.tgt = null;
      return;
    case "flee": {
      if (!o.tgt) o.tgt = randomSpot(o.place || n.home) || randomSpot("square");
      if (!o.tgt || (n.x===o.tgt[0] && n.y===o.tgt[1])){ finishOrderT(n); return; }
      goToT(n, o.tgt[0], o.tgt[1]); return;
    }
    case "report": {
      const sh = folk.find(p=>p.sheriff && alive(p));
      if (!sh){ finishOrderT(n); return; }
      if (distT(n, sh) <= 1.6){ n.order = null; deliverReport(n, sh, o); return; }
      goToT(n, sh.x, sh.y, true); return;
    }
    case "attack": {
      const t = o.target==="player" ? pl : byIdT(o.target);
      if (!t || (t!==pl && !alive(t))){ finishOrderT(n); return; }
      if (distT(n,t) <= 1.3){ n.order = null; startFightT(n, t); return; }
      goToT(n, t.x, t.y, true); return;
    }
    case "deliver": {
      const t = o.target==="player" ? pl : byIdT(o.target);
      if (!t){ finishOrderT(n); return; }
      if (t===pl){ n.order = {type:"bring", item:o.item, until:o.until}; return; }
      if (distT(n,t) <= 1.5){ const k = n.inv.indexOf(o.item); if (k>=0){ n.inv.splice(k,1); t.inv.push(o.item); relAddT(n.id,t.id,4); rememberT(t, `${n.first} brought me ${o.item}${o.from ? " from the newcomer" : ""}.`); sayT(n, "This is for you."); } finishOrderT(n); return; }
      goToT(n, t.x, t.y, true); return;
    }
    case "fetch": {
      const want = String(o.item||"").toLowerCase();
      const have = n.inv.find(x=>x.toLowerCase()===want);
      if (have){ n.order = {type:"bring", item:have, until:absT()+180}; return; }
      if (!o.box){
        const keys = Object.keys(T.containers).filter(k => { const b = T.containers[k]; return !b.mine && !b.staff && (!b.home || b.home===n.home) && b.items.some(x=>x.toLowerCase()===want); });
        if (!keys.length){ finishOrderT(n, `Couldn't find any ${o.item}.`); return; }
        o.box = keys.sort((a,b)=>{ const [ax,ay]=a.split(",").map(Number),[bx,by]=b.split(",").map(Number); return Math.hypot(ax-n.x,ay-n.y)-Math.hypot(bx-n.x,by-n.y); })[0];
        const [bx,by] = o.box.split(",").map(Number); o.stand = DIRS4.map(([dx,dy])=>[bx+dx,by+dy]).find(([x,y])=>WALK_T.has(tileT(x,y)) && tileT(x,y)!=="D");
        if (!o.stand){ finishOrderT(n); return; }
      }
      if (n.x===o.stand[0] && n.y===o.stand[1]){ const b = T.containers[o.box], k = b.items.findIndex(x=>x.toLowerCase()===want); if (k<0){ o.box = null; return; } const it = b.items.splice(k,1)[0]; n.inv.push(it); n.order = {type:"bring", item:it, until:absT()+180}; return; }
      goToT(n, o.stand[0], o.stand[1]); return;
    }
    case "steal": {
      const owner = byIdT(o.target); if (!owner){ finishOrderT(n); return; }
      const key = Object.keys(T.containers).find(k => T.containers[k].home===owner.home && T.containers[k].name==="Wardrobe") || Object.keys(T.containers).find(k => T.containers[k].home===owner.home);
      if (!key){ finishOrderT(n, "Couldn't get in."); return; }
      const [bx,by] = key.split(",").map(Number), stand = DIRS4.map(([dx,dy])=>[bx+dx,by+dy]).find(([x,y])=>WALK_T.has(tileT(x,y)) && tileT(x,y)!=="D");
      if (!stand){ finishOrderT(n); return; }
      o.lockpick = true;
      if (n.x===stand[0] && n.y===stand[1]){
        const box = T.containers[key]; const it = box.items.length ? box.items.splice(Math.floor(Math.random()*box.items.length),1)[0] : null;
        if (!it){ finishOrderT(n, "Nothing worth taking."); return; }
        n.inv.push(it); rememberT(n, `I took ${it} from ${owner.first}'s house.`); rememberT(owner, `Someone took my ${it}.`);
        if (o.self){ finishOrderT(n); return; } n.order = {type:"bring", item:it, until:absT()+200}; return;
      }
      if (!goToT(n, stand[0], stand[1])) finishOrderT(n, "Couldn't get in.");
      return;
    }
    case "distract": {
      const g = byIdT(o.target); if (!g || !alive(g)){ finishOrderT(n); return; }
      if (distT(n,g) <= 1.6){ g.distractedUntil = absT()+60; startSceneT({a:n, b:g, kind:"distract", lines:[[n,`${g.first}! Got a minute? It's important.`],[g,"Make it quick."],[n,"So there's this thing with my neighbor's fence, right…"],[g,"*sighs* Go on."],[n,"…and THEN she says…"]], effect:{}}); n.order = null; toast(`${n.first} is keeping ${g.first} busy.`, "good", 4); return; }
      goToT(n, g.x, g.y, true); return;
    }
  }
}
function perceiveT(n){
  const pl = T.player, around = [];
  for (const o of folk){
    if (o===n || o.dead || distT(o,n) > 9 || !canSeeT(n, o.x, o.y, 9)) continue;
    const doing = o.fight ? `fighting ${o.fight.target==="player"?"the newcomer":nmT(o.fight.target)}` : o.scene ? `talking with ${(o.scene.a===o?o.scene.b:o.scene.a).first}` : o.asleep ? "asleep" : o.order ? orderWordT(o.order) : "";
    around.push(o.first + (doing ? ` (${doing})` : ""));
  }
  for (const b of T.bodies) if (!b.hidden && !b.carried && canSeeT(n, b.x, b.y, 7)) around.push(`${b.name}, lying motionless on the ground`);
  const me = [];
  if (pl.hp < 50) me.push("bruised and bleeding");
  const w = selectedWeapon(); if (w) me.push(`holding a ${w} in plain sight`);
  if (pl.carrying) me.push(`CARRYING A BODY over their shoulder`);
  if (pl.inv.includes("prison jumpsuit") && pl.wearJumpsuit) me.push("wearing an orange prison jumpsuit");
  if (T.drunk > 0) me.push("visibly drunk");
  if (pl.disguise.hat) me.push("wearing a brimmed hat low"); if (pl.disguise.glasses) me.push("wearing thick glasses"); if (pl.disguise.shades) me.push("wearing sunglasses");
  if (T.stains.some(s=>Math.hypot(s.x-pl.x,s.y-pl.y)<1.5 && !s.cleaned)) me.push("standing near what looks like dried blood");
  return {around, me};
}
