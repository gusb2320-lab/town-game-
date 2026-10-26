// Cutscenes: the ride to Millbrook, the detective's reveal, the arrest, and every way it can end.
const CW = 320, CH = 180;
let CUT = null;
function cutCanvas(){
  const sc = $("tScreen"); sc.textContent = ""; sc.hidden = false;
  const c = Object.assign(document.createElement("canvas"), {width:CW, height:CH}); sc.append(c);
  const cap = Object.assign(document.createElement("div"), {className:"cap"}); sc.append(cap);
  const row = Object.assign(document.createElement("div"), {className:"row"}); sc.append(row);
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  return {c, g, cap, row};
}
function playCutscene(name, done){
  T.cutscene = name; closeTalkT(); closeTWindows();
  const shots = CUTS[name](); const ui = cutCanvas();
  CUT = {name, shots, i:0, t:0, ui, done, typed:0};
  const skip = Object.assign(document.createElement("button"), {type:"button", className:"pbtn", textContent:"Skip ▸▸"});
  skip.addEventListener("click", () => nextShot(true)); ui.row.append(skip);
  ui.c.addEventListener("pointerdown", () => nextShot());
  Snd.track(name==="intro" ? "cutscene" : "tense");
  startShot();
}
function startShot(){ const s = CUT.shots[CUT.i]; CUT.t = 0; CUT.typed = 0; if (s.sfx) sfx(s.sfx); if (s.enter) s.enter(); }
function nextShot(all){
  if (!CUT) return;
  const s = CUT.shots[CUT.i];
  if (!all && s.cap && CUT.typed < s.cap.length){ CUT.typed = s.cap.length; return; }
  if (s.hold && !all) return;
  if (all){ CUT.i = CUT.shots.length; } else CUT.i++;
  if (CUT.i >= CUT.shots.length){ const d = CUT.done; endCut(); if (d) d(); return; }
  startShot();
}
function endCut(){ CUT = null; T.cutscene = null; $("tScreen").hidden = true; $("tScreen").textContent = ""; Snd.track(null); }
function cutFrame(dt){
  if (!CUT) return;
  const s = CUT.shots[CUT.i]; if (!s) return;
  CUT.t += dt;
  const g = CUT.ui.g; g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,CW,CH);
  s.draw(g, CUT.t);
  if (s.cap){
    const before = Math.floor(CUT.typed);
    CUT.typed = Math.min(s.cap.length, CUT.typed + dt*38);
    if (Math.floor(CUT.typed) > before && /[a-z]/i.test(s.cap[Math.floor(CUT.typed)-1]||"")) Snd.tone({f:520+Math.random()*80, dur:.02, vol:.025, type:"square"});
    const shown = s.cap.slice(0, Math.floor(CUT.typed)); CUT.ui.cap.textContent = "";
    for (const part of shown.split(/(\*[^*]*\*?)/)){ if (!part) continue; if (part[0]==="*") CUT.ui.cap.append(Object.assign(document.createElement("em"),{textContent:part.replace(/\*/g,"")})); else CUT.ui.cap.append(part); }
  } else CUT.ui.cap.textContent = "";
  if (!s.hold && CUT.t >= s.dur && (!s.cap || CUT.typed >= s.cap.length)) { if (CUT.t >= s.dur + (s.cap ? 1.4 : 0)) nextShot(); }
}

// ---------- drawing bits ----------
const R_ = (g,x,y,w,h,c) => { g.fillStyle = c; g.fillRect(Math.round(x),Math.round(y),w,h); };
function sky(g, top, bot){ const gr = g.createLinearGradient(0,0,0,CH); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0,0,CW,CH); }
function stars(g, t, n=40){ for (let i=0;i<n;i++){ const x = (i*73)%CW, y = (i*37)%90, tw = Math.sin(t*2+i)>.6; R_(g,x,y,1,1, tw ? "#ffffff" : "#94b0c2"); } }
function treeC(g, x, y, s, col){ R_(g, x-1*s, y, 2*s, 6*s, "#3e2a1c"); g.fillStyle = col||"#1f5a34"; g.beginPath(); g.moveTo(x, y-12*s); g.lineTo(x+6*s, y+1*s); g.lineTo(x-6*s, y+1*s); g.fill(); }
function runner(g, x, y, t, L, dir=[1,0]){ drawPerson(g, x, y, L, dir, Math.floor(t*8)%4, {}); }
function hills(g, off, y, col, amp=10, f=.02){ g.fillStyle = col; g.beginPath(); g.moveTo(0,CH); for (let x=0;x<=CW;x+=4) g.lineTo(x, y + Math.sin((x+off)*f)*amp + Math.sin((x+off)*f*2.3)*amp*.4); g.lineTo(CW,CH); g.fill(); }
function truck(g, x, y){ R_(g,x,y+6,46,12,"#b13e53"); R_(g,x+30,y,16,10,"#b13e53"); R_(g,x+32,y+2,10,6,"#73eff7"); R_(g,x,y+6,46,2,"#e07ab0"); R_(g,x+2,y+3,26,4,"#8b5a3c"); for (const wx of [8,36]){ R_(g,x+wx-4,y+15,9,9,"#1a1c2c"); R_(g,x+wx-2,y+17,5,5,"#566c86"); } }
function plLook(){ return T && T.player && T.player.look ? T.player.look : {suit:"o", skin:"#d49a6a", hair:"#3f2616", style:"short"}; }

const CUTS = {
  intro(){
    const prisonName = (E.prisonState() && E.prisonState().name) || "You";
    const route = E.prisonState() && E.prisonState().won ? E.prisonState().won.route : "wall";
    const L = {suit:"o", skin:"#d49a6a", hair:"#3f2616", style:"short"};
    return [
      {dur:4, sfx:"alert", cap: route==="gate" ? "Cellblock Nine. Behind you, the front gate swings shut on its own." : route==="tunnel" ? "Cellblock Nine. You claw out of the tunnel into cold, wet air." : "Cellblock Nine. You drop from the outer wall into the dark.", draw(g,t){
        sky(g,"#0d0e18","#1a1c2c"); stars(g,t);
        R_(g,0,60,CW,90,"#333c57"); for (let x=0;x<CW;x+=12) R_(g,x,56,8,6,"#333c57"); R_(g,0,60,CW,2,"#566c86");
        for (const tx of [40,250]){ R_(g,tx,20,24,40,"#29366f"); R_(g,tx-4,16,32,6,"#29366f"); R_(g,tx+8,26,8,6,"#ffcd75"); }
        const a = Math.sin(t*.9)*.7; g.fillStyle = "rgba(255,240,180,.18)"; g.beginPath(); g.moveTo(52,26); g.lineTo(52+Math.cos(a+1)*400, 26+Math.sin(a+1)*400); g.lineTo(52+Math.cos(a+1.25)*400, 26+Math.sin(a+1.25)*400); g.fill();
        R_(g,0,150,CW,30,"#1f3a24"); runner(g, 40 + t*42, 128, t, L);
      }},
      {dur:4.5, sfx:"snap", cap:"Dogs, somewhere behind. You run until your lungs are fire.", enter(){ setTimeout(()=>sfx("grr"),600); setTimeout(()=>sfx("grr"),1700); }, draw(g,t){
        sky(g,"#0d0e18","#1a2a24");
        for (let i=0;i<14;i++){ const x = ((i*53 - t*90) % (CW+60) + CW+60) % (CW+60) - 30; treeC(g, x, 120 + (i%3)*8, 1.6+(i%2)*.4, i%2 ? "#1f5a34" : "#2a6a3a"); }
        R_(g,0,140,CW,40,"#1f3a24"); runner(g, 150, 118, t, L);
        for (let i=0;i<10;i++){ const x = ((i*71 - t*160) % (CW+40) + CW+40) % (CW+40) - 20; treeC(g, x, 170, 3, "#0f2a1a"); }
      }},
      {dur:5, cap:"Dawn. A red pickup slows on the county road. The driver doesn't ask questions. *\"Need a lift? Heading to Millbrook.\"*", enter(){ sfx("door"); }, draw(g,t){
        sky(g,"#ef7d57","#ffcd75"); R_(g,0,110,CW,70,"#5a9a4e"); R_(g,0,124,CW,22,"#4a4e5c"); for (let x=0;x<CW;x+=24) R_(g,x+((t*0)%24),134,12,2,"#ffcd75");
        g.fillStyle = "#fff1b8"; g.beginPath(); g.arc(250,110,18,Math.PI,0); g.fill();
        const tx = Math.max(150, 330 - t*90); truck(g, tx, 110);
        drawPerson(g, 120, 108, L, t > 2.4 ? [1,0] : [0,1], 0, {});
      }},
      {dur:5.5, cap:"Fields roll past. Telephone poles count the miles. Nobody is following. Not yet.", draw(g,t){
        sky(g,"#73b8f7","#c2e8ff"); hills(g, t*10, 90, "#7cc062", 12, .015); hills(g, t*30, 112, "#5a9a4e", 8, .03);
        for (let i=0;i<6;i++){ const x = ((i*70 - t*120) % (CW+70) + CW+70) % (CW+70) - 20; R_(g,x,70,2,60,"#5e3a24"); R_(g,x-6,74,14,2,"#5e3a24"); }
        g.strokeStyle = "#1a1c2c"; g.beginPath(); g.moveTo(0,76); g.quadraticCurveTo(CW/2,84,CW,76); g.stroke();
        R_(g,0,140,CW,40,"#4a4e5c"); truck(g, 110, 126);
        drawPerson(g, 116, 120, L, [1,0], 0, {});
        for (let i=0;i<3;i++){ const x = 300 - ((t*70 + i*120) % 360); R_(g,x,24+i*10,22,6,"#ffffff"); R_(g,x+4,20+i*10,12,4,"#ffffff"); }
      }},
      {dur:5, sfx:"bell", cap:"WELCOME TO MILLBROOK · POP. 212. A church steeple. A water tower. A diner sign buzzing pink in the morning.", draw(g,t){
        sky(g,"#94d0ff","#e8f6ff"); hills(g, 0, 100, "#7cc062", 6, .02);
        for (const [x,h,c] of [[30,30,"#8b4b3c"],[70,22,"#5e3a24"],[110,36,"#3b5dc9"],[160,26,"#b13e53"],[200,30,"#5e3a24"],[250,24,"#3e4c63"]]) { R_(g,x,100-h,34,h,c); R_(g,x+4,104-h,6,6,"#ffcd75"); R_(g,x+20,104-h,6,6,"#ffcd75"); }
        R_(g,140,40,6,60,"#94b0c2"); R_(g,134,34,18,8,"#94b0c2"); R_(g,141,26,4,8,"#ffcd75"); R_(g,139,28,8,2,"#ffcd75");
        R_(g,270,40,4,60,"#566c86"); R_(g,258,30,28,14,"#94b0c2"); gVT(g,"MB",262,30,"#29366f",14);
        R_(g,0,124,CW,56,"#4a4e5c");
        const sx = Math.max(40, 330 - t*120); R_(g,sx,74,4,50,"#5e3a24"); R_(g,sx-30,60,70,26,"#1a1c2c"); R_(g,sx-28,62,66,22,"#38b764"); gVT(g,"WELCOME TO",sx-22,62,"#f4f4f4",12); gVT(g,"MILLBROOK",sx-24,72,"#ffcd75",14);
        truck(g, 140, 112);
      }},
      {dur:4, hold:true, cap:"The truck drops you outside the Millbrook Arms. You have forty dollars, a stolen life, and no name. Everyone here will want to know who you are.", enter(){ aliasPrompt(prisonName); }, draw(g,t){
        sky(g,"#c2e8ff","#e8f6ff"); R_(g,0,40,CW,90,"#5e3a24"); R_(g,0,40,CW,6,"#3e2a1c");
        for (let x=20;x<CW;x+=50){ R_(g,x,60,20,22,"#1a1c2c"); R_(g,x+2,62,16,18,"#73eff7"); }
        R_(g,130,90,40,40,"#1a1c2c"); R_(g,134,94,32,36,"#8b5a3c"); gVT(g,"MILLBROOK ARMS",104,46,"#ffcd75",16);
        R_(g,0,130,CW,50,"#b8b0a0"); drawPerson(g, 148, 136, L, [0,-1], 0, {});
      }}
    ];
  },
  reveal(){
    const d = detP(), L = d ? d.look : plLook();
    const tell = d ? TELLS.find(x=>x.id===d.tells[0]) : null;
    return [
      {dur:3, sfx:"stinger", cap: d ? `${d.first} ${d.last}. The ${d.job}. ${tell ? tell.habit.replace(/^is |^has /,"")[0].toUpperCase()+tell.habit.replace(/^is |^has /,"").slice(1)+"." : ""}` : "Someone steps out of the crowd.", draw(g,t){
        sky(g,"#1a1c2c","#333c57"); const s = 4 + Math.min(2, t*.8); g.save(); g.translate(CW/2-8*s, 40); g.scale(s,s); drawPerson(g, 0, 5, L, [0,1], 0, {}); g.restore();
        g.fillStyle = `rgba(13,14,24,${Math.max(0,.8-t*.3)})`; g.fillRect(0,0,CW,CH);
      }},
      {dur:3.5, sfx:"clank", cap: `*A badge on a leather fold.* STATE BUREAU OF INVESTIGATION. "My real name is ${T.det.realName}."`, draw(g,t){
        sky(g,"#0d0e18","#1a1c2c");
        const fl = Math.min(1, t*1.4);
        R_(g,100,50,120*fl,80,"#3e2a1c"); if (fl>.6){ R_(g,166,60,44,58,"#ffcd75"); R_(g,176,72,24,30,"#c8a374"); g.fillStyle = "#ffcd75"; g.beginPath(); g.moveTo(188,64); g.lineTo(200,72); g.lineTo(196,96); g.lineTo(188,104); g.lineTo(180,96); g.lineTo(176,72); g.fill(); R_(g,110,64,46,6,"#f4ecd8"); R_(g,110,76,40,4,"#94b0c2"); R_(g,110,86,44,4,"#94b0c2"); }
      }},
      {dur:3.5, cap: `"${T.det.suspicion >= 100 ? "I've got enough to put you back in Cellblock Nine for the rest of your life" : "That's enough playing house"}, ${PNUMT}."`, draw(g,t){
        sky(g,"#29366f","#1a1c2c"); R_(g,0,130,CW,50,"#333c57");
        drawPerson(g, 120, 104, L, [1,0], 0, {}); drawPerson(g, 180, 104, plLook(), [-1,0], 0, {});
        if (Math.floor(t*2)%2) { R_(g,140,90,8,4,"#94b0c2"); R_(g,150,90,8,4,"#94b0c2"); R_(g,147,91,4,2,"#566c86"); }
      }}
    ];
  },
  sheriff_arrest(){
    const sh = folk.find(n=>n.sheriff) || {look:plLook(), first:"The sheriff", last:""};
    return [
      {dur:3, sfx:"alert", cap:`Sheriff ${sh.last}'s hand is on the holster. "Don't move."`, draw(g,t){
        sky(g,"#b13e53","#1a1c2c"); const pulse = (Math.sin(t*8)+1)/2; g.fillStyle = `rgba(59,93,201,${.3*pulse})`; g.fillRect(0,0,CW,CH);
        R_(g,0,130,CW,50,"#333c57"); drawPerson(g, 110, 104, sh.look, [1,0], 0, {}); drawPerson(g, 190, 104, plLook(), [-1,0], 0, {});
      }},
      {dur:3.5, cap:`"Your face matches the poster, friend. ${PNUMT}. Hands where I can see them."`, draw(g,t){
        sky(g,"#1a1c2c","#333c57"); R_(g,90,30,140,110,"#f4ecd8"); gText(g,"WANTED",160,38,"#b13e53",12,"center"); R_(g,130,58,60,60,"#c8a374"); g.save(); g.translate(136,58); g.scale(3,3); drawPerson(g,0,6,{suit:"o", skin:"#d49a6a", hair:"#3f2616", style:"short"},[0,1],0,{}); g.restore(); gVT(g,PNUMT+" · CELLBLOCK NINE",160,120,"#1a1c2c",14,"center");
      }}
    ];
  }
};
function aliasPrompt(prisonName){
  const ui = CUT.ui;
  ui.row.textContent = "";
  const form = document.createElement("form"); form.className = "intake"; form.style.width = "min(560px,100%)";
  const lbl = Object.assign(document.createElement("span"),{className:"lbl", textContent:"New name"});
  const inp = Object.assign(document.createElement("input"),{maxLength:24, value:pick(["Sam Ellis","Jo Carver","Alex Moore","Rae Dawson","Lee Hart","Casey Bloom","Max Rowan"]), ariaLabel:"Your new name"});
  form.append(lbl, inp);
  const go = Object.assign(document.createElement("button"),{type:"submit", className:"bigbtn", textContent:"Check in at the Millbrook Arms →"});
  const hint = Object.assign(document.createElement("p"),{className:"note", textContent:`Your real name is ${prisonName}. Using it here would be… a choice.`});
  form.addEventListener("submit", e => { e.preventDefault(); const v = inp.value.trim() || "Sam Ellis"; T.alias = v.slice(0,24);
    if (prisonName && v.toLowerCase()===String(prisonName).toLowerCase()){ T.usedRealName = true; T.det.suspicion += 15; T.det.evidence.push({s:"day 1", text:`The newcomer checked in under the name "${v}". That's ${PNUMT}'s real name.`, w:15, kind:"name"}); }
    const d = CUT.done; endCut(); if (d) d(); });
  form.append(go); ui.row.append(form, hint);
  setTimeout(()=>inp.focus(), 50);
}

// ---------- the arrest: three choices ----------
function showArrestChoice(){
  const sc = $("tScreen"); sc.textContent = ""; sc.hidden = false; T.cutscene = "choice";
  const box = document.createElement("div"); box.className = "ending";
  const by = T.lock && T.lock.bySheriff ? "the sheriff" : (detP() ? detP().first : "the detective");
  box.append(Object.assign(document.createElement("div"),{className:"eyebrow", textContent:"IT'S OVER · OR IS IT"}), Object.assign(document.createElement("h1"),{className:"title", textContent:"CORNERED"}),
    Object.assign(document.createElement("p"),{textContent:`${T.lock ? T.lock.reason : ""} ${cap(by)} is three steps away, and there are handcuffs. What do you do?`}));
  const row = document.createElement("div"); row.className = "row";
  const b = (label, cls, fn) => { const el = Object.assign(document.createElement("button"),{type:"button", className:"bigbtn"+(cls?" "+cls:""), textContent:label}); el.addEventListener("click", fn); row.append(el); };
  b("Surrender", "alt", () => ending("caught", {surrendered:true}));
  b("Run", "", () => { sc.hidden = true; T.cutscene = null; placeHunters(); startChase(); });
  b("Fight", "alt", () => { sc.hidden = true; T.cutscene = null; placeHunters(); const d = T.lock.bySheriff ? folk.find(n=>n.sheriff && alive(n)) : detP(); T.lock.kind = "brawl"; T.lock.foe = d ? d.id : null; if (d){ d.hp = d.maxHp = Math.max(d.maxHp, 140); d.strength = Math.max(d.strength, 14); startFightT(d, T.player); } banner("FIGHT", "Only one of you walks away.", true, 3); });
  box.append(row); sc.append(box);
  Snd.track("lockdown");
}
function placeHunters(){
  const pl = T.player;
  for (const n of [detP(), folk.find(x=>x.sheriff && alive(x))]){
    if (!n || !alive(n)) continue;
    n.hidden = false; n.away = false; n.asleep = false; n.scene = null; n.talkingToPlayer = false;
    if (distT(n, pl) > 6){
      for (const [dx,dy] of [[5,0],[-5,0],[0,5],[0,-5],[4,3],[-4,-3],[3,0],[0,3]]){ const x = pl.x+dx, y = pl.y+dy; if (npcWalkT(x,y,n) && bfsT(pl.x,pl.y,x,y,(a,b)=>npcWalkT(a,b,n), 400)){ n.x = n.fx = x; n.y = n.fy = y; n.prog = 1; break; } }
    }
  }
}

// ---------- endings ----------
function ending(kind, opt={}){
  if (T.ending && T.ending!=="russia_pending") return;
  if (kind.startsWith("slasher") || kind==="russia"){ slasherEnding(kind, opt); return; }
  T.ending = kind; closeTalkT(); closeTWindows(); if (GAME) closeGame();
  Snd.track(null); sfx(["caught","dark"].includes(kind) ? "sad" : "fanfare");
  const d = detP(), D = T.det, pl = T.player;
  const partner = folk.find(n=>n.partner && alive(n));
  const T_ = {
    caught:["BACK TO CELLBLOCK NINE", opt.surrendered ? "You hold out your wrists. The cuffs are cold. The ride back is long and quiet, and the town watches you go from behind its curtains." : "They drag you down Main Street in cuffs. Curtains twitch. By evening the whole town is telling the story, and every version is wrong.", "CAUGHT"],
    bluff:["CASE CLOSED", `${d ? d.first : "The detective"} snaps the notebook shut. "Wrong drifter," they tell the Bureau. On the 8:00 train, a seat by the window stays empty. You're just ${T.alias} now.`, "CLEARED"],
    train:["ONE WAY TO THE CITY", `${T.alias} steps onto the ${fmtT(T.t)} train with a one-way ticket${pl.inv.includes("fake ID") ? " and a laminated new life" : ""}. Millbrook slides away behind the glass.${partner && partner.trust>=55 ? ` ${partner.first} squeezes your hand and doesn't look back.` : ""}`, "GONE"],
    followed:["THE NEXT CARRIAGE", `The train pulls out. You let yourself breathe. Then a familiar ${d ? TELLS.find(t=>t.id===d.tells[0]).clue.toLowerCase().replace(/^a |^the /,"") : "smell"} drifts through from the next carriage. Without papers, you were easy to follow. The city is big. Maybe big enough.`, "ESCAPED?"],
    wild:["INTO THE TREES", "You walk west off the edge of the map, out past the last fencepost, with nothing but what's in your pockets. It's not a life. But it's not a cell.", "ON THE RUN"],
    new_life:["A NEW LIFE", `${D.realName} files a two-word report: NOT HERE. ${d ? d.first+" leaves town on the 8:00 train" : "The Bureau stops calling"}. Nobody in Millbrook ever learns who ${T.alias} used to be.${partner ? ` You and ${partner.first} paint the porch that summer.` : ""}`, "FREE"],
    dark:["MILLBROOK KEEPS ITS SECRETS", `The Bureau's agent never reports in. ${T.stats.kills > 1 ? `Neither do ${T.stats.kills-1} others.` : ""} The town mourns, gossips, and slowly forgets. You stay. You smile at the neighbors. Some nights you can't sleep.`, "GOT AWAY WITH IT"]
  }[kind];
  clearSaveT();
  const sc = $("tScreen"); sc.textContent = ""; sc.hidden = false;
  const box = document.createElement("div"); box.className = "ending";
  box.append(Object.assign(document.createElement("div"),{className:"eyebrow", textContent:`${T_[2]} · ${dayName().toUpperCase()}, DAY ${T.day}, ${fmtT(T.t)}`}), Object.assign(document.createElement("h1"),{className:"title", textContent:T_[0]}), Object.assign(document.createElement("p"),{textContent:T_[1]}));
  // who the detective was
  const reveal = document.createElement("div"); reveal.className = "note2";
  reveal.append(Object.assign(document.createElement("b"),{textContent:"THE DETECTIVE"}));
  if (d){ reveal.append(`It was ${fullT(d)}, the ${d.job}. Real name ${D.realName}, ${D.agency}. ${cap(their(d))} habits: ${d.tells.map(id=>TELLS.find(t=>t.id===id).habit.replace(/^is |^has /,"")).join(", and ")}.`);
    const fooled = Object.entries(T.suspects).filter(([id,v])=>v).map(([id])=>id); reveal.append(Object.assign(document.createElement("span"),{textContent: fooled.includes(d.id) ? "You had them marked as a suspect." : fooled.length ? `You suspected ${fooled.map(nmT).join(", ")}.` : "You never worked it out."})); }
  reveal.append(Object.assign(document.createElement("b"),{textContent:`FINAL SUSPICION: ${Math.round(D.suspicion)}/100 · SEARCHED YOUR ROOM ${D.searchCount||0}× · HID IN YOUR WARDROBE ${D.hides||0}×`}));
  reveal.append(Object.assign(document.createElement("b"),{textContent:"FROM THE NOTEBOOK"}));
  for (const e of D.evidence.slice(-8)) reveal.append(Object.assign(document.createElement("span"),{textContent:`[${e.s}] ${e.text}`}));
  for (const n of D.notes.slice(-4)) reveal.append(Object.assign(document.createElement("span"),{textContent:`“${n.text}”`}));
  box.append(reveal);
  // what became of everyone
  const ul = document.createElement("ul"); ul.className = "mems";
  for (const n of folk.filter(x=>x.met || x.dead).sort((a,b)=>(b.opinion+b.trust)-(a.opinion+a.trust)).slice(0,10)){
    const li = document.createElement("li");
    const fate = n.dead ? (T.bodies.find(b=>b.id===n.id && b.discovered) ? "Buried at St. Ambrose." : T.missing.includes(n.id) ? "Still listed as missing." : "Nobody knows yet.") : n.partner ? (kind==="caught" ? "Writes to you every week." : "Never stopped loving you.") : n.opinion >= 50 ? "Tells people you were the best thing that happened to Millbrook." : n.opinion <= -30 ? "Always said there was something off about you." : "Remembers you as the quiet one at the hotel.";
    const last = n.memories.filter(m=>/newcomer/i.test(m.text)).slice(-1)[0];
    li.append(Object.assign(document.createElement("small"),{textContent:`${fullT(n)} · ${n.job} · ${n.dead ? "dead" : tierOf(n)} · ${fate}`}), last ? `“${last.text}”` : "");
    ul.append(li);
  }
  box.append(ul);
  const s = T.stats;
  box.append(Object.assign(document.createElement("p"),{className:"note", textContent:`${T.day} days in Millbrook · ${s.favors} favors · ${s.dates} plans kept · ${s.fish} fish · ${s.jobs} odd jobs · ${s.kills} people put to sleep for good`}));
  const row = document.createElement("div"); row.className = "row";
  const again = Object.assign(document.createElement("button"),{type:"button", className:"bigbtn", textContent:"New sentence"}); again.addEventListener("click", ()=>leaveTown(true));
  const title = Object.assign(document.createElement("button"),{type:"button", className:"bigbtn alt", textContent:"Title screen"}); title.addEventListener("click", ()=>leaveTown(false));
  row.append(again, title); box.append(row); sc.append(box);
}
