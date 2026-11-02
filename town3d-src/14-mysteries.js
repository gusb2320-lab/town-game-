// Hallowmere mysteries, questlines and respect.
//  - The Children of the Horned Moon: a cult hidden among the villagers. Find three pieces of evidence and show the
//    Reeve (the sheriff). If they learn what you know, one of them comes for you in a red robe.
//  - Ashcombe House: find out why it's haunted, then lay the dead child to rest. Her silver dagger is the reward.
//  - The werewolf: every third night someone in the village becomes a beast. Work out who, and name them.
//  - Everyone has a three-part story you can help them with. Solving things earns the village's respect.
const MX = {};
if (HALLOW){
  FIRST.push("Aldous","Beatrix","Cuthbert","Edwina","Godric","Hester","Ivo","Jocosa","Leofric","Mabel","Osric","Petronella","Roland","Sabine","Tobias","Ursula","Wystan","Ysolde","Ambrose","Cecily","Drogo","Elspeth","Fulk","Gunnora","Hamon","Isolde","Jasper","Lettice","Maud","Nicolas","Odo","Rohese","Silas","Tibby","Walter","Wymond","Agatha","Bartholomew","Constance","Eudo","Griselda","Humphrey","Joan","Lambert","Mercy","Piers","Rosamund","Thurstan");
  LAST.push("Ashdown","Blackthorn","Cobb","Dimmock","Fenwick","Gall","Harrow","Kettle","Lark","Marrow","Nettles","Pryor","Quill","Rook","Sallow","Thorne","Underhill","Vane","Whitlock","Yew");
  // ---------- state ----------
  const M = () => T.myst;
  const fresh = () => ({rep:0, notes:[], cult:{members:[], heat:0, seen:false, solved:false, lastHunt:-1, got:{}, ritual:false}, ww:{id:null, solved:false, kills:0, prints:[], accused:[], victims:[], found:0, wolfsbane:null}, haunt:{diary:false, doll:false, bones:false, panel:false, solved:false, visits:0}});
  const note = (kind, text) => { const m = M(); if (m.notes.some(x=>x.text===text)) return; m.notes.push({kind, text, s:stampT()}); toast(`Journal: ${text}`, "", 5); sfx("quest"); };
  const addRep = (v, why) => { const m = M(); m.rep = clamp(m.rep + v, 0, 100); if (v > 0){ for (const n of folk) if (alive(n)){ n.opinion = clamp(n.opinion + v*.5, -100, 100); n.trust = clamp(n.trust + v*.3, 0, 100); } toast(`+${v} respect · ${why}`, "good", 5); } else toast(`${v} respect · ${why}`, "bad", 5); };
  MX.addRep = addRep; MX.note = (k, t) => note(k, t);
  const CULT_ITEMS = ["crimson robe","blood ledger","ritual dagger","bone sigil"];
  const wolfP = () => byIdT(M().ww.id);
  const ritualNight = () => T.day % 2 === 1;
  const wolfNight = () => T.day % 3 === 2 || (T.event && T.event.kind==="hallows" && T.event.day===T.day);

  // ---------- setting up a new game ----------
  const gt0 = genTown;
  genTown = () => {
    const people = gt0();
    T.myst = fresh();
    const adults = people.filter(p=>!p.teen && !p.sheriff && !isDet(p) && !p.jobDef.guard);
    // the cult: five, one of them from the manor if possible
    const manor = shuffle(adults.filter(p=>p.work==="manor"));
    const cult = [];
    if (manor.length) cult.push(manor[0]);
    for (const p of shuffle(adults.slice())) if (cult.length < 5 && !cult.includes(p)) cult.push(p);
    M().cult.members = cult.map(p=>p.id);
    for (const p of cult){ p.cult = true; p.inv.push("bone sigil"); p.dislikes.push("questions about the old ways"); }
    // the werewolf: someone ordinary
    const ww = pick(adults.filter(p=>!p.cult && p.work!=="manor"));
    M().ww.id = ww.id; ww.isWolf = true;
    // what people half-saw: two true sightings, two false ones
    const others = shuffle(people.filter(p=>p!==ww && !p.teen));
    const herr = shuffle(adults.filter(p=>p!==ww && !p.cult)).slice(0,2);
    const seen = [
      [others[0], `Weeks ago I saw ${ww.first} ${ww.last} coming home at dawn, barefoot, soaked to the knees and covered in mud. ${cap(they(ww))} didn't see me.`],
      [others[1], `Once I heard something heavy moving inside ${ww.first}'s house at three in the morning, and growling. Next day ${they(ww)} acted like nothing happened.`],
      [others[2], `I've seen ${herr[0].first} walking toward the Blackwood after dark more than once. Odd hour for a walk.`],
      [others[3], `${herr[1].first} had a nasty scratch on ${their(herr[1])} arm last week and wouldn't say how.`]
    ];
    for (const [p, text] of seen) if (p) rememberT(p, text);
    // a couple of people have noticed the robes, or the comings and goings at night
    const cw = shuffle(people.filter(p=>!p.cult && !p.teen)).slice(0,3);
    if (cw[0]) rememberT(cw[0], `I've seen lights out in the Blackwood near the old standing stones, late, on odd nights. People in red.`);
    if (cw[1]) rememberT(cw[1], `${byIdT(cult[1].id).first} came back from the woods at two in the morning with something red bundled under ${their(cult[1])} arm.`);
    if (cw[2]) rememberT(cw[2], `Three people have gone missing from Millbrook in two years. The Reeve calls it wolves. I don't think it's wolves.`);
    // everyone's story
    for (const p of people) p.quest = {stage:0, done:false, specs:null};
    return people;
  };
  const mc0 = makeContainers;
  makeContainers = () => {
    const C = mc0(), m = M();
    const boxIn = (home, name) => Object.keys(C).find(k => C[k].home===home && (!name || C[k].name===name));
    // cult evidence
    const cult = m.cult.members.map(byIdT);
    const robeAt = boxIn(cult[1] ? cult[1].home : null, "Wardrobe") || boxIn(cult[2] ? cult[2].home : null);
    if (robeAt) C[robeAt].items.push("crimson robe");
    const desk = Object.keys(C).find(k => C[k].bid==="manor" && C[k].name==="Desk") || boxIn(cult[0] ? cult[0].home : null, "Desk") || boxIn(cult[3] ? cult[3].home : null);
    if (desk) C[desk].items.push("blood ledger");
    m.cult.ledgerAt = desk; m.cult.robeAt = robeAt;
    // the altar stone and the den
    const [ax, ay] = XP.altar; C[`${ax},${ay}`] = {name:"Altar stone", items:["ritual dagger"], loot:[], home:null, bid:null};
    const denJ = Object.keys(C).find(k => { const [x,y] = k.split(",").map(Number); return Math.hypot(x-XP.den[0], y-XP.den[1]) < 7; });
    if (denJ){ C[denJ].name = "Bone pile"; C[denJ].items = ["wolf fur","old boot"]; }
    // hollow stumps in the forest
    for (const [x,y] of XP.caches) C[`${x},${y}`] = {name:"Hollow stump", items:[pick(["wolfsbane","rope","matches","bullets","old boot","tallow candles"])], loot:[], home:null, bid:null};
    // Ashcombe House
    for (const k of Object.keys(C)){ if (C[k].bid!=="ashcombe") continue; C[k].items = []; if (C[k].name==="Wardrobe") C[k].items.push(pick(["tallow candles","holy water","lantern"])); if (C[k].name==="Chest freezer"){ C[k].name = "Linen chest"; C[k].hide = false; } }
    if (C["173,92"]){ C["173,92"].name = "Writing desk"; C["173,92"].items = ["Ashcombe diary"]; }
    if (C["178,104"]){ C["178,104"].name = "Toy chest"; C["178,104"].items = ["porcelain doll"]; }
    return C;
  };

  // ---------- the cult ----------
  const ritualTick = h => {
    const c = M().cult; if (c.solved) return;
    if (h===23 && ritualNight()){
      c.ritual = true;
      // each takes a place in a ring around the altar stone
      const [ax, ay] = XP.altar, ring = [];
      for (let k=0;k<10;k++){ const a = k/10*Math.PI*2; const x = Math.round(ax + Math.cos(a)*3), y = Math.round(ay + Math.sin(a)*3); if (WALK_T.has(tileT(x,y)) && !ring.some(r=>r[0]===x&&r[1]===y)) ring.push([x,y]); }
      c.members.forEach((id, i) => { const n = byIdT(id); if (!n || !alive(n) || n.away || n.wolf) return; robe(n, true); n.timid = false; n.order = {type:"go_to", place:"stonecircle", until:absT()+200, tgt:ring[i % ring.length], ritual:true}; n.asleep = false; });
      c.attacked = null;
    }
    if (h===2){ c.ritual = false; for (const id of c.members){ const n = byIdT(id); if (!n || !alive(n)) continue; if (!n.cultHunter) robe(n, false); if (n.order && n.order.place==="stonecircle") n.order = null; } }
    // the hunt
    if ((h>=21 || h<=3) && c.heat >= 50 && c.lastHunt !== T.day && !T.lock && Math.random() < .55){
      const cands = c.members.map(byIdT).filter(n=>n && alive(n) && !n.away && !n.wolf);
      const n = pick(cands); if (!n) return;
      c.lastHunt = T.day; c.heat = Math.max(30, c.heat - 25);
      robe(n, true); n.cultHunter = true; n.strength = Math.max(n.strength, 17); n.timid = false;
      if (!n.inv.includes("sacrificial knife")) n.inv.unshift("sacrificial knife");
      n.order = {type:"attack", target:"player", until:absT()+240, creep:true}; n.asleep = false; n.huntWarned = false;
      rememberT(n, "The Circle sent me for the newcomer. They know too much.");
    }
  };
  const robe = (n, on) => { if (!!n.look.robe === on) return; n.look = Object.assign({}, n.look, {robe:on || undefined}); if (!on) delete n.look.robe; };
  const cultSecond = () => {
    const c = M().cult, pl = T.player; if (c.solved) return;
    // seeing the ritual
    if (c.ritual){
      const [ax, ay] = XP.altar, d = Math.hypot(pl.x-ax, pl.y-ay);
      if (d < 30){
        const robed = c.members.map(byIdT).filter(n=>n && alive(n) && n.look.robe && canSeeT(pl, n.x, n.y, 15));
        const hidden = tileT(pl.x, pl.y)==="0";
        if (robed.length && c.seenTonight !== T.day){
          c.seenTonight = T.day; c.seen = true;
          note("cult", `You watched robed figures chanting at the stone circle in the Blackwood, around midnight. ${robed.length} of them.`);
          banner("THE STONE CIRCLE", hidden ? "From the thicket you watch red robes circle the altar stone." : "Red robes. Chanting. If they see you, they'll kill you. Get into the thickets.", true, 6); sfx("stinger");
        }
        if (hidden && !MX.toldHide){ MX.toldHide = true; toast("You crouch in the thicket. Nobody can see you in here.", "good", 4); }
        // they see you watching: the whole Circle turns on you
        const spotter = c.members.map(byIdT).find(n => n && alive(n) && n.look.robe && !n.fight && canSeeT(n, pl.x, pl.y, 11) && (!hidden || distT(n, pl) < 2.2));
        if (spotter && c.attacked !== T.day){
          c.attacked = T.day; c.heat += 40;
          sayT(spotter, pick(["THERE! An eye in the dark!","Seize the watcher!","The Horned One wants a witness. Take them!"]), 4);
          banner("THEY'VE SEEN YOU", "The chanting stops. Every hood turns toward you. RUN.", true, 6); sfx("stinger"); HSFX.scream(.5);
          for (const id of c.members){ const n = byIdT(id); if (!n || !alive(n) || n.away || !n.look.robe || distT(n, pl) > 40) continue; n.cultHunter = true; n.timid = false; n.strength = Math.max(n.strength, 15); if (!n.inv.includes("sacrificial knife")) n.inv.unshift("sacrificial knife"); n.order = {type:"attack", target:"player", until:absT()+240, run:true}; }
        }
        // the ones in the ring face the altar
        if (!c.attacked) for (const id of c.members){ const n = byIdT(id); if (n && alive(n) && n.order && n.order.ritual && n.path.length===0 && !n.fight){ const dx = ax - n.x, dy = ay - n.y; n.dir = Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx)||1, 0] : [0, Math.sign(dy)||1]; } }
        if (!MX.chantAt || performance.now() > MX.chantAt){ MX.chantAt = performance.now() + 3800; try { if (hqInit()){ const t0 = HQ.ac.currentTime, out = HQ.out; HQ.out = HQ.comp; const v = Math.max(.12, 1 - d/30) * (1 + (MX.ritualPower||0)); for (const nn of ["D3","A3","D4"]) INST.choir(t0, NOTE(nn) - (Math.random()<.5 ? 0 : 1), 3.5, .5*v); HQ.out = out; } } catch {} }
      }
    }
    // the hunter closing in
    for (const id of c.members){
      const n = byIdT(id); if (!n || !n.cultHunter || !alive(n)) continue;
      if (!n.huntWarned && distT(n, pl) < 14){ n.huntWarned = true; toast("A figure in a red robe is walking straight toward you.", "bad", 5); HSFX.whisper(); }
      if (!n.order && !n.fight){ n.cultHunter = false; robe(n, false); }
    }
    // picking up evidence
    for (const it of CULT_ITEMS){
      if (pl.inv.includes(it) && !c.got[it]){
        c.got[it] = true; c.heat += it==="bone sigil" ? 10 : 22;
        note("cult", {"crimson robe":"Found a red hooded robe, stitched with a horned moon, hidden in a villager's wardrobe.", "blood ledger":"Found a ledger of names and dates, written in something brown. Read it.", "ritual dagger":"Took a bone-handled dagger from the altar stone in the Blackwood.", "bone sigil":"Got a horned-moon sigil carved from bone. The cult members wear them."}[it]);
      }
    }
  };
  const presentEvidence = sh => {
    const c = M().cult, pl = T.player, have = CULT_ITEMS.filter(it=>pl.inv.includes(it));
    closeTWindows();
    if (c.solved){ startTypeT("It's done. Let it rest.", sh); return; }
    if (have.length < 3){
      startTypeT(have.length ? `*turns the ${have[0]} over in ${their(sh)} hands* This is something. It isn't proof. Bring me more than one strange thing, and I'll act. (${have.length} of 3)` : "Evidence of what? Bring me something I can hold.", sh);
      logLineT(sh, "n", TD.full); rememberT(sh, `The newcomer showed me ${have.join(", ")} and spoke of a cult.`); return;
    }
    for (const it of have) removeItemT(it);
    c.solved = true; c.ritual = false;
    const names = [];
    for (const id of c.members){ const n = byIdT(id); if (!n || !alive(n)) continue; names.push(n.first+" "+n.last); n.away = true; n.awayUntil = 1e12; n.jailed = true; n.order = null; n.fight = null; robe(n, false); }
    startTypeT(`*goes pale reading the ledger* ${names.slice(0,3).join(", ")}… God help us. Guards! *to you* You've done this village a service it won't forget.`, sh);
    logLineT(sh, "n", TD.full);
    banner("THE CULT IS BROKEN", `${names.length} members of the Children of the Horned Moon are in the Reeve's gaol.`, false, 8);
    newsT(`ARRESTS: The Reeve has gaoled ${names.join(", ")} as members of a blood cult that met at the standing stones.`, [], false, "event");
    for (const n of folk) if (alive(n) && !n.jailed) rememberT(n, `The newcomer exposed the cult of the Horned Moon. ${names.join(", ")} were taken to the gaol. The newcomer did that.`);
    note("cult", "SOLVED: you showed the Reeve the evidence. The cult is in the gaol.");
    addRep(25, "you broke the cult");
    saveT();
  };

  // ---------- the werewolf ----------
  const becomeWolf = (n, on) => {
    if (on){
      if (n.wolf) return;
      n.wolf = true; n.humanLook = n.look; n.look = Object.assign({}, n.look, {wolf:true}); delete n.look.bandage;
      n.hpHuman = n.hp; n.hp = n.maxHp = 230; n.str0 = n.strength; n.strength = 24; n.breaksDoors = true; n.timid = false;
      n.asleep = false; if (n.scene) finishSceneT(n.scene); n.talkingToPlayer = false;
      HSFX.howl(); setTimeout(()=>HSFX.howl(), 2500);
    } else {
      if (!n.wolf) return;
      const hurt = n.hp < 200;
      n.wolf = false; n.look = n.humanLook || n.look; delete n.look.wolf; n.maxHp = 100; n.hp = Math.min(100, Math.max(30, n.hpHuman || 100) - (hurt ? 30 : 0));
      n.strength = n.str0 || n.strength; n.breaksDoors = false; n.order = null; n.fight = null;
      if (hurt){ n.wounded = T.day; rememberT(n, "I woke with deep cuts on my arm and blood under my nails. I told no one. I'll say I fell in the woodshed."); }
      else rememberT(n, "Another night I can't remember. Mud on my feet again. Dear God.");
    }
  };
  const wolfHour = h => {
    const w = M().ww, n = wolfP(); if (!n || w.solved || !alive(n)) return;
    if (h===0 && wolfNight() && !n.away){ becomeWolf(n, true); n.order = {type:"hunt", until:absT()+260, kills:0}; w.nights = (w.nights||0) + 1; }
    if (h===4 && n.wolf && !w.revealed) becomeWolf(n, false);
    if (h===6){
      for (const p of folk){ if (p.look.bandage && T.day - (p.bandageDay||0) >= 2){ p.look = Object.assign({}, p.look); delete p.look.bandage; } }
      if (n.wounded === T.day){ n.look = Object.assign({}, n.look, {bandage:true}); n.bandageDay = T.day; }
      // red herrings bandage up too
      for (const p of folk) if (alive(p) && !p.look.bandage && ["butcher","woodcutter","cooper","hunter","groom"].includes(jobKey(p)) && Math.random() < .15){ p.look = Object.assign({}, p.look, {bandage:true}); p.bandageDay = T.day; rememberT(p, "Cut my arm at work. Nothing to it."); }
      // anyone wrongly gaoled is let out once the beast kills again
      if (w.killedWhileJailed) for (const id of w.accused){ const p = byIdT(id); if (p && p.jailed && !p.cult){ p.jailed = false; p.away = false; p.awayUntil = 0; rememberT(p, "The beast killed while I sat in the gaol. They let me out. I won't forget who put me there."); p.opinion = clamp(p.opinion - 40, -100, 100); newsT(`${p.first} ${p.last} has been released from the gaol. The beast killed again while ${they(p)} sat in a cell.`, [], false, "event"); } }
      w.killedWhileJailed = false;
    }
  };
  const wolfKill = (v, wolf) => {
    const pl = T.player, where = placeLabelAt(v.x, v.y);
    v.dead = true; v.hp = 0; v.fight = null; v.order = null; v.asleep = false; v.talkingToPlayer = false; if (v.scene) finishSceneT(v.scene);
    if (!v.inv.includes("wolf fur")) v.inv.push("wolf fur");
    T.bodies.push({id:v.id, name:fullT(v), x:v.x, y:v.y, hidden:null, carried:false, diedAt:absT(), discovered:false, inside:buildingAt(v.x,v.y), killer:"beast", wolf:true});
    for (const [dx,dy] of [[0,0],[1,0],[0,1],[-1,0],[0,-1]]) addStain(v.x+dx, v.y+dy);
    const w = M().ww; w.kills++; w.victims.push({id:v.id, day:T.day, at:where}); if (w.accused.some(id=>byIdT(id) && byIdT(id).jailed)) w.killedWhileJailed = true;
    sfx("scream"); HSFX.scream();
    if (Math.hypot(pl.x-v.x, pl.y-v.y) < 30) toast(Math.hypot(pl.x-v.x, pl.y-v.y) < 10 ? `The beast tears into ${v.first}.` : "A scream, somewhere close, cut short.", "bad", 5);
    for (const o of folk){ if (!alive(o) || o===wolf || o.asleep || !canSeeT(o, v.x, v.y, 10)) continue; rememberT(o, `I saw a beast on two legs, taller than a man, tear ${v.first} apart at ${where}. Grey fur. Eyes like lamps.`); sayT(o, pick(["AAAAH!","GOD SAVE US!","The beast! THE BEAST!"]), 3); o.order = {type:"flee", place:o.home, until:absT()+60, run:true}; }
  };
  // the hunt itself
  const ro0 = runOrderT;
  runOrderT = (n, dt) => {
    const o = n.order;
    if (o && o.type==="hunt") return wolfHunt(n, o);
    if (o && o.type==="wolfhome"){ if (insideOf(n)===n.home || absT() > o.until){ n.order = null; return; } goToT(n, ...(sleepSpot(n) || [n.x, n.y])); return; }
    return ro0(n, dt);
  };
  const wolfHunt = (n, o) => {
    const pl = T.player, now = performance.now();
    if (absT() > o.until || (hourNow() >= 4 && hourNow() < 20)){ n.order = {type:"wolfhome", until:absT()+120}; return; }
    if (!o.at || now > o.at){
      o.at = now + 1800;
      const plIn = insideOf(pl), dpl = distT(n, pl);
      if (dpl < 13 && (!plIn || plIn===insideOf(n) || o.revealed)) o.tgt = "player";
      else if ((o.kills||0) >= 1 && !o.revealed){ n.order = {type:"wolfhome", until:absT()+120}; return; }
      else {
        const prey = folk.filter(p=>alive(p) && p!==n && !p.away && !p.wolf && !p.hidden);
        const out = prey.filter(p=>!insideOf(p)).sort((a,b)=>distT(a,n)-distT(b,n));
        o.tgt = (out[0] && distT(out[0], n) < 50 ? out[0] : pick(prey.filter(p=>bById(outerOf(p.home)) && bById(outerOf(p.home)).kind==="home"))) ?.id || null;
      }
    }
    if (o.tgt==="player"){
      if (distT(n, pl) <= 1.3){ if (!n.fight) startFightT(n, pl); return; }
      goToT(n, pl.x, pl.y, true); return;
    }
    const t = byIdT(o.tgt); if (!t || !alive(t)){ o.at = 0; return; }
    if (distT(n, t) <= 1.3){ wolfKill(t, n); o.kills = (o.kills||0) + 1; o.at = 0; return; }
    goToT(n, t.x, t.y, true);
  };
  // fights with the beast
  const hit0 = hitT;
  hitT = (att, vic, forced) => {
    if (!vic || !vic.wolf || vic.dead) return hit0(att, vic, forced);
    const before = vic.hp, w = att===T.player ? selectedWeapon() : weaponOfT(att), silver = w && itemT(w).silver;
    const save = vic.hp; hit0(att, vic, forced); if (vic.dead) return;
    const d = Math.max(0, save - vic.hp);
    if (silver){ vic.hp = Math.max(0, vic.hp - d*2); floatT(vic, "SILVER", "#e8f0ff"); }
    else if (vic.hp > 0) vic.hp = Math.min(vic.maxHp, vic.hp + d*.55);
    if (!silver && att===T.player && !MX.toldSilver){ MX.toldSilver = true; toast("Your blows close up as you watch. Steel won't do it. Silver might.", "bad", 6); }
    if (vic.hp <= 0) wolfSlain(vic, att);
  };
  const beaten0 = beaten;
  beaten = (vic, att) => { if (vic.wolf){ if (vic.hp <= 0) wolfSlain(vic, att); else { vic.hp = Math.max(vic.hp, 40); vic.fight = null; att.fight = null; } return; } return beaten0(vic, att); };
  const kill0 = killPerson;
  killPerson = (n, by, kopt={}) => {
    if (n.wolf) return wolfSlain(n, by);
    if (n.cultHunter && by===T.player){
      n.dead = true; n.hp = 0; n.fight = null; n.order = null;
      if (!n.inv.includes("bone sigil")) n.inv.push("bone sigil");
      T.bodies.push({id:n.id, name:fullT(n), x:n.x, y:n.y, hidden:null, carried:false, diedAt:absT(), discovered:true, foundDay:T.day, inside:buildingAt(n.x,n.y), killer:"selfdefense"});
      addStain(n.x, n.y); sfx("snap"); T.shake = .4;
      toast(`${n.first} falls. Under the red hood, a face you know.`, "bad", 6);
      note("cult", `${n.first} ${n.last} came for you in a red robe. Search the body.`);
      newsT(`${n.first} ${n.last} was killed in the night by the newcomer, who says ${they(n)} attacked in a red robe with a black knife. The knife was found.`, [], false, "event");
      for (const o of folk) if (alive(o)) rememberT(o, `${n.first} attacked the newcomer at night wearing a red robe and was killed. Some say it was self-defense. Some say there's a cult.`);
      return;
    }
    return kill0(n, by, kopt);
  };
  const wolfSlain = (n, by) => {
    const w = M().ww; if (n.dead) return;
    n.dead = true; n.hp = 0; n.fight = null; n.order = null;
    for (const o of folk) if (o.fight && o.fight.target===n.id) o.fight = null;
    if (T.player.fight && T.player.fight.target===n.id) T.player.fight = null;
    T.bodies.push({id:n.id, name:fullT(n), x:n.x, y:n.y, hidden:null, carried:false, diedAt:absT(), discovered:true, foundDay:T.day, inside:buildingAt(n.x,n.y), killer:"hero"});
    addStain(n.x, n.y); HSFX.howl(); T.shake = .7;
    n.look = Object.assign({}, n.humanLook || n.look); delete n.look.wolf; n.wolf = false;
    w.solved = true; w.revealed = true;
    banner("THE BEAST IS DEAD", `As it dies, the fur falls away. It's ${n.first} ${n.last}.`, false, 8);
    newsT(`THE BEAST IS DEAD. It was ${n.first} ${n.last}, the ${n.job}, cursed. ${by===T.player ? "The newcomer struck the killing blow." : ""}`, [], false, "event");
    for (const o of folk) if (alive(o)) rememberT(o, `The beast that killed ${w.kills} of us was ${n.first} ${n.last}. ${by===T.player ? "The newcomer killed it." : "It's dead."}`);
    note("wolf", `SOLVED: the werewolf was ${n.first} ${n.last}.`);
    if (by===T.player) addRep(25, "you killed the beast"); else addRep(12, "the beast is dead");
    for (const id of w.accused){ const p = byIdT(id); if (p && p.jailed && !p.cult){ p.jailed = false; p.away = false; p.awayUntil = 0; } }
    saveT();
  };
  // the town finds the bodies
  const disc0 = discoverBody;
  discoverBody = (b, finder, how) => {
    if (!b.wolf) return disc0(b, finder, how);
    if (b.discovered) return;
    b.discovered = true; b.foundBy = finder ? finder.id : null; b.foundDay = T.day; b.foundAt = placeLabelAt(b.x, b.y);
    const v = byIdT(b.id);
    if (finder){ sayT(finder, pick(["Oh God… oh God, what did this?","SOMEONE HELP!","It's "+v.first+"… what's left of "+them(v)+"."]), 4); sfx("scream"); }
    newsT(`TORN APART: ${b.name} was found at ${b.foundAt}, savaged by something with claws. Grey fur in the wounds.`, [], false, "body");
    banner("TORN APART", `${b.name}, at ${b.foundAt}. Claw marks. Grey fur.`, true, 6);
    for (const o of folk) if (alive(o)){ rememberT(o, `${v.first} was found torn apart at ${b.foundAt}. Claws. The beast is back.`); o.mood = pick(["terrified","shaken","grim"]); }
    T.event = {day:T.day, kind:"curfew", text:`Curfew after dark. The beast killed ${v.first}.`}; T.funeral = {day:T.day+1, who:b.id};
    M().ww.found++;
    note("wolf", `${v.first} ${v.last} was killed by the beast at ${b.foundAt}. Look for grey fur on the body, and tracks.`);
    sfx("stinger");
  };
  // naming the beast
  const accuseWolf = (sh, who) => {
    const w = M().ww, n = byIdT(who); closeTWindows();
    if (!n) return;
    if (w.solved){ startTypeT("The beast is dead. Let the dead lie.", sh); return; }
    if (who===w.id){
      startTypeT(`*stares at you a long moment* ${n.first}. The fur on the bodies, the tracks… God help me, it fits. Guards!`, sh); logLineT(sh, "n", TD.full);
      setTimeout(() => {
        if (!T || !alive(n)) return; closeTalkT();
        becomeWolf(n, true); w.revealed = true; n.away = false; n.jailed = false;
        n.order = {type:"hunt", until:absT()+600, revealed:true}; n.order.tgt = "player";
        banner("THE BEAST", `${n.first}'s body breaks and stretches. Fur bursts through the skin. Fight it. Silver bites.`, true, 7);
        sfx("stinger"); T.shake = .8;
        for (const g of folk) if (alive(g) && !g.away && (g.sheriff || g.jobDef.guard) && distT(g, n) < 40){ g.order = {type:"attack", target:n.id, until:absT()+300}; }
      }, 2500);
    } else {
      startTypeT(`${n.first}? *sighs* If you're sure. I'll hold ${them(n)} in the gaol until we know.`, sh); logLineT(sh, "n", TD.full);
      n.away = true; n.awayUntil = 1e12; n.jailed = true; w.accused.push(n.id);
      rememberT(n, "The newcomer accused me of being the beast. I was dragged to the gaol in front of everyone.");
      for (const o of folk) if (alive(o) && relGetT(o.id, n.id) > 30) o.opinion = clamp(o.opinion - 15, -100, 100);
      newsT(`${n.first} ${n.last} has been taken to the gaol on the newcomer's word, accused of being the beast.`, [], false, "event");
      note("wolf", `You named ${n.first} ${n.last}. ${cap(they(n))} ${n.pron==="they"?"are":"is"} in the gaol. If the beast kills again, you were wrong.`);
      addRep(-6, "a heavy accusation");
    }
    saveT();
  };
  // the wolfsbane test
  onGaveHook = (n, gave) => {
    if (gave!=="wolfsbane") return;
    const w = M().ww;
    if (n.id===w.id && !w.solved){ w.wolfsbane = n.id; setTimeout(()=>{ if (T.talkId===n.id){ sayT(n, "*recoils, gagging*", 3); } }, 300); note("wolf", `${n.first} ${n.last} reeled back from the wolfsbane like it burned, eyes watering, and threw it away.`); n.inv.splice(n.inv.indexOf("wolfsbane"), 1); }
  };

  // ---------- Ashcombe House ----------
  READ_EXTRA["Ashcombe diary"] = () => {
    const h = M().haunt; if (!h.diary){ h.diary = true; note("house", "Read Lady Ashcombe's diary. The child, Elspeth, didn't die of fever. Something is behind the nursery wall."); }
    return ["The diary of Lady Margery Ashcombe", "March. Elspeth will not stop singing to the doll. The same three notes. Edmund says she has a devil in her and the priest agrees, God forgive them both.\nApril. She saw the thing in the wood, she says, the tall pale one that stands and watches. She told the whole village. Edmund struck her for it.\nMay. Edmund has had the mason in. He says we will tell them it was the fever. He says no one will look behind the nursery panel. I can hear her. I can still hear her.\nJune. The singing stopped today.\n(The rest is stuck together. On the last page, in a different hand, a child's letters: LET ME OUT. LAY ME IN THE CHAPEL WITH MY DOLLY.)"];
  };
  READ_EXTRA["blood ledger"] = () => {
    const c = M().cult, mem = c.members.map(byIdT).filter(Boolean);
    const lines = mem.slice(0, 4).map((n, i) => `${n.first[0]}. ${n.last[0]}., ${["the hand","the tongue","the eye","the knife"][i]} — ${n.job.split(" ")[0]}`);
    return ["A ledger, stained brown", `THE CHILDREN OF THE HORNED MOON. We meet at the stones when the moon is horned (every odd night), at midnight.\nWhat was given: a lamb. A lamb. A traveller. A lamb. The Fenwick boy.\nThe Circle:\n${lines.join("\n")}\n…and one more, whose name is not written.`];
  };
  const restElspeth = () => {
    const h = M().haunt; h.solved = true;
    removeItemT("small bones"); removeItemT("porcelain doll");
    addItemT("silver dagger");
    banner("SHE CAN REST", "The screaming in the walls stops. A small cold hand slips into yours, and then it's gone. On the altar, a silver dagger that wasn't there before.", false, 9);
    note("house", "SOLVED: you laid Elspeth Ashcombe's bones in the family chapel with her doll. The house is quiet. She left you her silver dagger.");
    newsT("The bones of Elspeth Ashcombe, missing for forty years, were laid to rest in the Ashcombe family chapel. The newcomer found her.", [], false, "event");
    for (const o of folk) if (alive(o)) rememberT(o, "The newcomer found little Elspeth Ashcombe's bones in the walls of Ashcombe House and laid her to rest in the family chapel. They say the house is quiet now.");
    addRep(20, "you laid Elspeth to rest");
    try { if (hqInit()){ const t0 = HQ.ac.currentTime; ["D5","F5","A5","D6"].forEach((m,i)=>INST.musicbox(t0 + i*.45, NOTE(m), 1, 1.2)); } } catch {}
    saveT();
  };
  const hauntSecond = () => {
    const h = M().haunt, pl = T.player;
    if (pl.inv.includes("porcelain doll") && !h.doll){ h.doll = true; note("house", "Took the porcelain doll from the toy chest in the nursery. It's very cold."); if (HWO.jump){ setTimeout(()=>{ if (typeof hwJumpscare==="function" && !h.solved) hwJumpscare("ghost"); }, 700); } }
    if (pl.inv.includes("small bones") && !h.bones){ h.bones = true; note("house", "Found small bones behind the nursery panel, wrapped in a nightdress. The family chapel is in this house, south of the great hall."); }
    if (insideOf(pl)==="ashcombe" && !h.inNow){ h.inNow = true; h.visits++; if (h.visits===1) note("house", "You went into Ashcombe House. It feels like something is standing just behind you."); }
    if (insideOf(pl)!=="ashcombe") h.inNow = false;
  };
  const dl0 = doorLockedT;
  doorLockedT = (x, y, who) => { if (T && M() && DOOR_AT[x+","+y]==="ashcombe" && who===T.player && (MX.hauntLock||0) > performance.now()) return true; return dl0(x, y, who); };

  // ---------- questlines ----------
  const HEIR = ["locket","wedding ring","prayer beads","father's knife","carved wooden horse","silver thimble","mother's comb","lucky coin","rosary","seal ring","little bell"];
  const WANT = ["loaf of bread","smoked ham","tallow candles","flowers","beer","whiskey","apple pie","book","rope","wolfsbane","holy water","lantern","trout","matches"];
  const WHY = ["for a wake tomorrow","for my mother, who's poorly","to keep the dark out","for an offering","because I promised someone","for the long winter","and don't ask me why"];
  const TOPIC = ["the night the mill burned","a debt from last winter","what they saw in the Blackwood","the lights at Ashcombe House","the missing sheep","the old feud between our families","the stranger who came through in spring"];
  const REWARD = ["lantern","wolfsbane","holy water","silver coin purse","smoked ham","lockpick","hunting rifle","bullets"];
  const specsFor = n => {
    const others = folk.filter(o=>alive(o) && o!==n && !o.away);
    const o1 = pick(others), o2 = pick(others.filter(o=>o!==o1)) || o1;
    const heir = `${n.first}'s ${pick(HEIR)}`;
    const order = shuffle([["find"],["fetch"],[Math.random()<.5 ? "deliver" : "visit"]]).map(x=>x[0]);
    return order.map(type => type==="find" ? {type, item:heir} : type==="fetch" ? {type, item:pick(WANT), why:pick(WHY)} : type==="deliver" ? {type, to:o1.id} : {type, to:o2.id, topic:pick(TOPIC)});
  };
  const regHeir = it => { if (!TITEMS[it]) TITEMS[it] = ["Someone's lost keepsake. They'll want it back.",0,{keep:1}]; };
  const questAvail = n => HALLOW && n && n.quest && !n.quest.done && !T.tasks.some(t=>t.giver===n.id && (t.status==="active" || t.status==="ready")) && !n.jailed && !n.wolf;
  const offerQuest = n => {
    const q = n.quest; if (!q.specs) q.specs = specsFor(n);
    const sp = q.specs[q.stage]; if (!sp) return;
    let f, line;
    const reward = 10 + q.stage*8 + Math.floor(Math.random()*10);
    if (sp.type==="find"){
      regHeir(sp.item);
      const spots = XP.caches.map(([x,y])=>`${x},${y}`).concat(Object.keys(T.containers).filter(k=>["oldhut","mill","stables","ashcombe"].includes(T.containers[k].bid)));
      const k = pick(spots), box = T.containers[k]; if (box) box.items.push(sp.item);
      const [bx, by] = k.split(",").map(Number), where = box && box.bid ? (PLACES[box.bid] ? PLACES[box.bid].label : placeLabelAt(bx, by)) : `the Blackwood (a hollow stump, ${bx < 60 ? "west" : bx > 120 ? "east" : "in the middle"} of the wood)`;
      f = {type:"fetch", item:sp.item, text:`Find ${sp.item} (lost near ${where}) and bring it back.`};
      line = `*quietly* I lost my ${sp.item.split("'s ")[1]} out by ${where}. I can't go back there. Not after dark, not ever. Would you?`;
    } else if (sp.type==="fetch"){
      f = {type:"fetch", item:sp.item, text:`Bring ${n.first} ${artT(sp.item)} ${sp.item}.`};
      line = `I need ${artT(sp.item)} ${sp.item}, ${sp.why}. Bring me one?`;
    } else if (sp.type==="deliver"){
      const t = byIdT(sp.to) || pick(folk.filter(o=>alive(o) && o!==n));
      if (!canAddT(T.player.inv, "letter")){ startTypeT("Your pockets are full. Come back with room.", n); return; }
      addItemT("letter", true);
      f = {type:"deliver", item:"letter", to:t.id, text:`Carry ${n.first}'s sealed letter to ${t.first} ${t.last}.`, handed:true};
      line = `*presses a sealed letter into your hand* For ${t.first} ${t.last}. Into ${their(t)} hands, no one else's. Don't open it.`;
    } else {
      const t = byIdT(sp.to) || pick(folk.filter(o=>alive(o) && o!==n));
      f = {type:"visit", to:t.id, text:`Talk to ${t.first} ${t.last} about ${sp.topic}, for ${n.first}.`};
      line = `Go and see ${t.first} ${t.last}. Ask about ${sp.topic}. ${cap(they(t))}'ll know what I mean.`;
    }
    const task = Object.assign({id:Math.random().toString(36).slice(2,8), giver:n.id, status:"active", day:T.day, reward, quest:true, stage:q.stage}, f);
    T.tasks.push(task); sfx("quest"); renderHotbarT();
    rememberT(n, `I asked the newcomer to help me (part ${q.stage+1} of my trouble): ${task.text}`);
    startTypeT(`${line} (${q.stage+1}/3 · ${reward} silver)`, n); logLineT(n, "n", TD.full);
  };
  const pay0 = payFavorT;
  payFavorT = (t, n) => {
    pay0(t, n);
    if (!t.quest || !n.quest) return;
    n.quest.stage = Math.max(n.quest.stage, t.stage + 1);
    if (n.quest.stage >= 3 && !n.quest.done){
      n.quest.done = true;
      const it = pick(REWARD); if (canAddT(T.player.inv, it)) addItemT(it); addMoney(25 + Math.floor(Math.random()*30), `${n.first}'s thanks`);
      n.trust = clamp(n.trust + 20, 0, 100); n.opinion = clamp(n.opinion + 15, -100, 100);
      rememberT(n, "The newcomer saw my whole trouble through, start to end. I owe them. I'd stand up for them now.");
      gossipT(n, "The newcomer helped me when nobody else would. You can trust them.");
      setTimeout(()=>{ if (T.talkId===n.id) startTypeT(`That's the end of it. *grips your hand* Take this${it ? ` — the ${it}` : ""}. You've a friend in me now.`, n); }, 600);
      addRep(4, `you finished ${n.first}'s story`);
      M().questsDone = (M().questsDone||0) + 1;
    } else if (T.talkId===n.id) setTimeout(()=>{ if (T.talkId===n.id) $("tdFavor").textContent = `Their story (${n.quest.stage+1}/3)`; }, 300);
  };

  // ---------- talking: hidden roles, buttons ----------
  personNote = n => {
    const m = M(); if (!m) return "";
    let s = "";
    if (n.cult && !m.cult.solved) s += `\nYOUR DEEPEST SECRET (never admit it, deny it coldly): you are one of the Children of the Horned Moon, a blood cult that meets at the standing stones in the Blackwood at midnight on odd nights. ${n.cultHunter ? "Tonight the Circle sent you after the newcomer." : ""} If the newcomer asks about cults, robes, rituals, the stones or the missing people, you go cold and change the subject, and you will tell the Circle. You think the others are ${m.cult.members.filter(id=>id!==n.id).map(byIdT).filter(Boolean).map(o=>o.first).join(", ")}.`;
    if (n.isWolf && !m.ww.solved) s += `\nYOUR CURSE (never admit it unless utterly cornered and trusting): on some nights you become a beast and kill. You barely remember. You're terrified and ashamed, and very tired the morning after. You can't stand the smell of wolfsbane, you flinch at silver, and you bolt your door at night.${n.wounded && T.day - n.wounded <= 2 ? " Your arm is bandaged; if asked, you say you fell in the woodshed." : ""} The beast has killed ${m.ww.kills} so far.`;
    if (n.jailed) s += "\nYOU ARE LOCKED IN THE GAOL.";
    if (n.sheriff) s += `\nAS THE REEVE: ${m.cult.solved ? "You broke the Horned Moon cult thanks to the newcomer." : "You've heard whispers of a cult, but rumor isn't proof; you'd act on three solid pieces of evidence (a robe, the ledger, the altar dagger, a bone sigil)."} ${m.ww.solved ? "The beast is dead." : `Something has killed ${m.ww.kills} people; you'll lock up whoever the newcomer names as the beast if they make a case (use the Name the beast button).`}`;
    if (jobKey(n)==="hunter") s += "\nYou've found tracks in the Blackwood: something on two legs, with claws. It goes back toward the village, not away from it.";
    if (jobKey(n).startsWith("wise woman")) s += "\nYou know the old cures: wolfsbane makes the wolf-touched gag; silver wounds what steel can't; the dead child of Ashcombe House wants to be buried in holy ground.";
    if (n.age > 60) s += "\nYou remember Elspeth Ashcombe, the little girl at Ashcombe House forty years ago, who 'died of fever' and was never buried. Lord Edmund Ashcombe was a cruel man.";
    if (n.quest && !n.quest.done) s += `\nYOUR OWN TROUBLE (you'd ask a trusted newcomer for help with it, in three parts; you're on part ${n.quest.stage+1}).`;
    s += `\nTHE NEWCOMER'S STANDING IN THE VILLAGE: respect ${Math.round(m.rep)}/100.${m.rep >= 40 ? " People speak well of them." : ""}`;
    return s;
  };
  const CULT_WORDS = /\b(cult|ritual|robe|sigil|horned moon|standing stones|stone circle|sacrifice|the circle)\b/i;
  const WOLF_WORDS = /\b(werewolf|beast|wolf|claws?|fur)\b/i;
  onSaidHook = (n, said) => {
    const m = M();
    if (CULT_WORDS.test(said) && !m.cult.solved){
      if (n.cult){ m.cult.heat += 20; rememberT(n, `The newcomer asked about the Circle: "${said.slice(0,100)}". The others must know.`); }
      else { m.cult.heat += 4; if (Math.random() < .3) for (const id of m.cult.members){ const c = byIdT(id); if (c && relGetT(c.id, n.id) > 20) rememberT(c, `${n.first} says the newcomer has been asking about cults.`); } }
    }
  };
  // buttons in the talk window
  const dRow = $("tdLeave").parentElement;
  const mkBtn = (id, label) => { const b = Object.assign(document.createElement("button"), {className:"pbtn", id, type:"button", textContent:label}); b.hidden = true; dRow.insertBefore(b, $("tdLeave")); return b; };
  const evBtn = mkBtn("tdEvidence", "Show evidence"), wolfBtn = mkBtn("tdBeast", "Name the beast");
  evBtn.addEventListener("click", () => { const n = byIdT(T.talkId); if (n && !TD.busy) presentEvidence(n); });
  wolfBtn.addEventListener("click", () => { const n = byIdT(T.talkId); if (n && !TD.busy) openPicker(n); });
  $("tdFavor").addEventListener("click", e => { const n = byIdT(T.talkId); if (!n || TD.busy) return; if (questAvail(n)){ e.stopImmediatePropagation(); offerQuest(n); } }, true);
  onTalkOpenHook = n => {
    const m = M(); if (!m) return;
    evBtn.hidden = !(n.sheriff && !m.cult.solved && CULT_ITEMS.some(it=>T.player.inv.includes(it)));
    wolfBtn.hidden = !(n.sheriff && !m.ww.solved && m.ww.kills > 0);
    $("tdFavor").textContent = questAvail(n) ? `Their story (${n.quest.stage+1}/3)` : "Favor?";
  };
  // a small window for naming someone
  const pick0 = document.createElement("div"); pick0.className = "win"; pick0.id = "mxPick"; pick0.hidden = true;
  pick0.innerHTML = `<div class="wbox" style="width:min(620px,100%)"><div class="whead"><h2>Name the beast</h2><button class="pbtn" data-tclose type="button">Close</button></div><div class="wbody"><p class="note">Who becomes the beast? Name the wrong person and an innocent goes to the gaol.</p><div id="mxPickList" style="display:flex;flex-wrap:wrap;gap:6px"></div></div></div>`;
  $("game").append(pick0); TWINS.push("mxPick");
  pick0.querySelector("[data-tclose]").addEventListener("click", () => { pick0.hidden = true; });
  const openPicker = sh => {
    const list = $("mxPickList"); list.textContent = "";
    for (const p of folk.filter(o=>alive(o) && o.met && !o.sheriff && !o.jailed)){
      const b = Object.assign(document.createElement("button"), {className:"pbtn", type:"button", textContent:`${p.first} ${p.last}`});
      b.title = p.job; b.addEventListener("click", () => { pick0.hidden = true; accuseWolf(sh, p.id); });
      list.append(b);
    }
    if (!list.children.length) list.append("You haven't met anyone yet.");
    pick0.hidden = false;
  };

  // ---------- things to do with your hands ----------
  EXTRA_INTERACT = (fx, fy, c, here, k) => {
    const m = M(), pl = T.player; if (!m) return null;
    if (c==="4" && here==="ashcombe" && !m.haunt.panel){
      if (!m.haunt.diary) return {kind:"knock", label:"Knock on the wall panel", run:()=>{ sfx("knock"); toast("Hollow. And then, from inside, something knocks back.", "bad", 4); HSFX.knock(); }};
      return {kind:"pry", key:"pry"+k, label:"Hold: pry open the nursery panel", hold:true, secs:4, act:"picking", sound:"pick", done:()=>{ m.haunt.panel = true; T.containers[k] = {name:"Space behind the panel", items:["small bones"], loot:[], home:null, bid:"ashcombe"}; toast("The panel gives. Cold air breathes out of the dark.", "bad", 5); if (HWO.jump && typeof hwJumpscare==="function") setTimeout(()=>hwJumpscare("ghost"), 400); else HSFX.whisper(); }};
    }
    if (c==="+" && (here==="church" || here==="ashcombe") && pl.inv.includes("small bones") && !m.haunt.solved){
      const ok = pl.inv.includes("porcelain doll") && m.haunt.diary;
      if (!ok) return {kind:"rest", label:"Lay the bones on the altar", run:()=>toast(m.haunt.diary ? "She won't rest without her doll." : "You don't know who these bones belong to yet.", "", 4)};
      return {kind:"rest", key:"rest", label:"Hold: lay Elspeth to rest, with her doll", hold:true, secs:6, act:"praying", sound:"bell", done:restElspeth};
    }
    if (c==="+" && here==="ashcombe" && !m.haunt.solved){
      return {kind:"look", label:"Look at the chapel altar", run:()=>toast(m.haunt.diary ? "A child's name has been scratched into the altar cloth, over and over: ELSPETH. Bring her here, with what she loved." : "The family chapel. The altar cloth is grey with dust, except where small handprints have pressed into it.", "", 5)};
    }
    if (c==="9") return {kind:"look", label:"Look at the hanging tree", run:()=>toast(pick(["Three ropes. One of them still holds something wrapped in sacking. It turns slowly, though there's no wind.","Names are carved into the bark, dozens, the oldest grown over.","Somebody has left fresh flowers at the roots."]), "", 5)};
    if (c==="5") return {kind:"look", label:"Touch the standing stone", run:()=>{ toast(pick(["The stone is warm, like skin.","Horned moons are cut into the stone, and something dark has run down the grooves.","Your hand comes away sticky."]), "", 4); if (!m.cult.solved) note("cult", "The standing stones in the Blackwood are carved with horned moons. Someone uses this place."); }};
    if (c==="7" && Math.hypot(fx-XP.den[0], fy-XP.den[1]) < 7) return {kind:"look", label:"Search the den", run:()=>{ toast("Bones. Cracked for the marrow. Some of them aren't animal bones.", "bad", 5); note("wolf", "The wolf's den in the Blackwood is full of bones, some of them human. Whatever lairs here isn't a normal wolf."); }};
    return null;
  };

  // ---------- clocks ----------
  onHourHook = h => {
    if (!M()) return;
    ritualTick(h); wolfHour(h);
  };
  let lastPrint = null;
  onSecondHook = () => {
    if (!M()) T.myst = fresh();
    for (const n of folk) if (n.quest && n.quest.specs) for (const sp of n.quest.specs) if (sp.type==="find") regHeir(sp.item);
    cultSecond(); hauntSecond();
    // tracks: the beast leaves bloody prints from the kill to its door
    const w = wolfP();
    // nothing distracts the beast: no reporting bodies, no running home, no small talk
    if (w && w.wolf && alive(w) && !w.fight && (!w.order || !["hunt","wolfhome"].includes(w.order.type))){
      w.order = {type:"hunt", until:absT() + (M().ww.revealed ? 600 : 200), revealed:!!M().ww.revealed, kills:M().ww.revealed ? 0 : 1};
      if (M().ww.revealed) w.order.tgt = "player";
      w.scene = null; w.talkingToPlayer = false;
    }
    if (w && w.wolf && alive(w)){ const key = w.x+","+w.y; if (key!==lastPrint){ lastPrint = key; M().ww.prints.push({x:w.x, y:w.y, d:w.dir.slice(), day:T.day, t:absT()}); if (M().ww.prints.length > 500) M().ww.prints.splice(0, 100); } }
    const pr = M().ww.prints; if (pr.length && absT() - pr[0].t > 1440*1.5){ const i = pr.findIndex(p=>absT() - p.t <= 1440*1.5); pr.splice(0, i < 0 ? pr.length : i); }
    // first time you stand on fresh tracks
    if (!M().ww.solved && pr.some(p=>p.x===T.player.x && p.y===T.player.y && absT()-p.t < 1200) && !M().ww.toldPrints){ M().ww.toldPrints = true; note("wolf", "Big clawed prints in blood, walking on two legs. Follow them: they lead somewhere."); }
    // you follow the tracks to a door
    for (const p of pr){ if (absT() - p.t > 1200) continue; const b = buildingAt(p.x, p.y); if (b && Math.hypot(T.player.x - p.x, T.player.y - p.y) < 2 && !M().ww.solved){ const bd = bById(outerOf(b)); const who = folk.filter(o=>o.home===b && !o.dead).map(o=>o.first).join(" and "); if (bd && who) note("wolf", `The bloody prints go right inside ${bd.kind==="home" ? `the house where ${who} live${who.includes(" and ") ? "" : "s"}` : bd.name}.`); break; } }
  };

  // ---------- HUD: respect ----------
  const hud0 = renderHudT;
  renderHudT = () => {
    hud0();
    const m = M(); if (!m) return;
    let el = $("mxRep"); if (!el){ el = Object.assign(document.createElement("div"), {id:"mxRep", className:"px money"}); $("tMoney").after(el); }
    el.textContent = `Respect ${Math.round(m.rep)}`;
    $("tMoney").textContent = `${Math.round(T.money)} silver`;
  };

  // ---------- journal ----------
  JOURNAL_EXTRA.push({id:"myst", label:"Mysteries", render(body, H, P){
    const m = M(); if (!m){ body.append(P("Nothing yet.")); return; }
    body.append(H(`Respect in Millbrook: ${Math.round(m.rep)}/100`));
    const sec = (title, kind, status, hint) => {
      const h = document.createElement("h3"); h.textContent = `${title} · ${status}`; h.style.margin = "10px 0 4px"; body.append(h);
      const ns = m.notes.filter(x=>x.kind===kind);
      if (!ns.length) body.append(P(hint)); else for (const x of ns) body.append(P(`· ${x.text}`));
    };
    sec("The Horned Moon", "cult", m.cult.solved ? "SOLVED" : `${CULT_ITEMS.filter(it=>m.cult.got[it]).length}/4 pieces found`, "People go missing. Lights in the Blackwood on odd nights. Ask around, carefully. Show the Reeve three pieces of evidence.");
    sec("Ashcombe House", "house", m.haunt.solved ? "SOLVED" : "unsolved", "The big house at the Blackwood's edge, east past the last homes. Nobody goes in. Find out why.");
    sec("The Beast", "wolf", m.ww.solved ? "SOLVED" : `${m.ww.kills} dead`, "Every third night, something walks out of the village on two legs. Watch who's missing at night, follow tracks, try wolfsbane. Name them to the Reeve.");
    const h = document.createElement("h3"); h.textContent = "Stories you're helping with"; h.style.margin = "12px 0 4px"; body.append(h);
    const qs = folk.filter(n=>n.quest && (n.quest.stage > 0 || T.tasks.some(t=>t.giver===n.id && t.quest)));
    if (!qs.length) body.append(P("Everyone has a story. Talk to people and press \"Their story\" to help."));
    for (const n of qs){ const t = T.tasks.find(x=>x.giver===n.id && x.quest && x.status==="active"); body.append(P(`${n.first} ${n.last}: ${n.quest.done ? "done" : `part ${n.quest.stage+1}/3`}${t ? ` · ${t.text}` : ""}`)); }
  }});
  // a word to the wise, once you've settled in
  const begin0 = begin;
  begin = () => { begin0(); setTimeout(() => { if (TOWN.active && T && !T.ending) toast("Millbrook keeps worse secrets than yours: a cult, a house nobody enters, and something that walks on two legs every third night. Your journal (J) has a Mysteries page.", "", 10); }, 26000); };
  window.__myst = {get M(){ return T && T.myst; }, accuseWolf, presentEvidence, becomeWolf, wolfKill, restElspeth, offerQuest, ritualTick, wolfHour};
}
