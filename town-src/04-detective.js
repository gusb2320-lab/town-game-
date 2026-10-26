// The detective: one random townsperson is secretly a State Bureau investigator hunting #4471.
const detP = () => T && T.det ? byIdT(T.det.id) : null;
const detAlive = () => { const d = detP(); return d && alive(d) && !d.away; };
const NOTE_POOL = [
  ["Welcome to Millbrook. We look after our own.","Nice hat. New?","Some of us notice newcomers."],
  ["Where were you before Millbrook?","Funny how nobody knew you a week ago.","Lock your door. Or don't."],
  ["Orange was never your color.","Sleep well. Some of us don't.","I know what you did."],
  ["4471.","They're still looking for you. So am I.","I've seen your file."]
];
function suspicionBand(){ const s = T.det.suspicion; return s<30?0:s<55?1:s<80?2:3; }

function addEvidence(text, w, kind){
  const D = T.det; if (!D || D.revealed===true && D.mode==="done") return;
  if (!detAlive()){ // the case passes to the sheriff
    D.sheriffFile = (D.sheriffFile||0) + w*.5;
    if (D.sheriffFile >= 100 && !T.lock) arrestSequence("The sheriff picked up where the Bureau left off.", true);
    return;
  }
  D.evidence.push({s:stampT(), text:String(text).slice(0,200), w, kind:kind||""});
  if (D.evidence.length > 80) D.evidence.splice(2,1);
  const before = D.suspicion;
  D.suspicion = clamp(D.suspicion + w, 0, 120);
  if (before < 100 && D.suspicion >= 100 && !T.lock) setTimeout(()=>{ if (T && !T.lock && !T.ending) arrestSequence("The detective has enough."); }, 1200);
}
// Things the detective sees for themselves. Each kind counts once a day.
function detObserve(){
  const d = detP(); if (!d || !detAlive() || d.asleep || T.lock) return;
  const pl = T.player;
  const seesPlayer = d.hidden ? (insideOf(d)===insideOf(pl)) : canSeeT(d, pl.x, pl.y);
  if (!seesPlayer) return;
  T.det.lastSeen = {s:stampT(), where:placeLabelAt(pl.x,pl.y)};
  const once = (kind, w, text) => { const key = kind+T.day; if (T.det.seen && T.det.seen[key]) return; T.det.seen = T.det.seen || {}; T.det.seen[key] = true; addEvidence(text, w, kind); if (d.order && d.order.type==="tail" && w>=10){ sfx("camera"); flashAt(d); } };
  if (pl.carrying) { once("carry", 80, "I watched the newcomer carry a body."); return; }
  if (pl.fight && pl.fight.aggressor) once("fight", 15, `I saw the newcomer start a fight with ${nmT(pl.fight.target)}.`);
  if (T.acts.digging) once("dig", isNightT() ? 18 : 10, `Saw the newcomer digging in ${placeLabelAt(pl.x,pl.y)}${isNightT()?" in the middle of the night":""}.`);
  if (T.acts.picking) once("pick", 14, "The newcomer picks locks like a professional.");
  if (T.acts.cleaning) once("clean", 18, "Caught the newcomer scrubbing something off the floor.");
  if (T.acts.robbing) once("rob", 20, "Saw the newcomer go through a till.");
  const w = selectedWeapon(); if (w) once("armed", 5, `The newcomer walks around holding a ${w}.`);
  if (pl.wearJumpsuit) once("jumpsuit", 40, "The newcomer was WEARING an orange prison jumpsuit.");
  const h = hourNow(); if (h>=1 && h<5 && !insideOf(pl)) once("late", 6, `Spotted the newcomer outside at ${fmtT(T.t)}.`);
  const b = buildingAt(pl.x,pl.y), bd = b && bById(outerOf(b));
  if (bd && bd.kind==="home" && !folk.some(n=>n.home===bd.id && n.x===n.x && buildingAt(n.x,n.y)===bd.id && alive(n)) && !(T.unlocked[bd.door.join(",")] > absT())) once("trespass", 10, `The newcomer was inside ${placeLabelAt(pl.x,pl.y)} with nobody home.`);
}

// ---------- brain: pick the next move ----------
async function detBrain(){
  const D = T.det, d = detP(); if (!d || !detAlive() || T.lock || T.ending) return;
  D.nextBrain = absT() + 75 + Math.random()*60;
  D.brainCount = (D.brainCount||0) + 1;
  let move = null;
  const useAI = E.aiOn() && optOn("optDet") && D.brainCount % 2 === 1;
  if (useAI){
    try {
      const r = await E.getSample().json(detBrainPrompt(), {modelTier:"quick", cache:false});
      if (r && typeof r.move==="string") move = {move:r.move.toLowerCase(), target:r.target, note:r.note_text, priv:r.private_note, ds:clamp(Math.round(Number(r.suspicion_change)||0),-5,10)};
    } catch (e){ if (e && E.AI_OFF.includes(e.code)) E.setAiOff(); }
  }
  if (!move) move = detProcedural();
  if (move.priv) D.notes.push({s:stampT(), text:String(move.priv).slice(0,200)});
  if (move.ds) addEvidence(move.priv || "A hunch.", move.ds, "hunch");
  setDetMove(d, move);
}
function detBrainPrompt(){
  const D = T.det, d = detP(), pl = T.player;
  const ev = D.evidence.slice(-14).map(e=>`- [${e.s}] (+${e.w}) ${e.text}`).join("\n");
  const told = D.claims.slice(-10).map(c=>`- ${c}`).join("\n") || "- nothing yet";
  const missing = T.bodies.filter(b=>!b.discovered).length ? `${T.missing.length} townsperson(s) reported missing: ${T.missing.map(id=>byIdT(id).first).join(", ")}.` : (T.missing.length ? `Missing: ${T.missing.map(id=>byIdT(id).first).join(", ")}.` : "No one is missing.");
  const found = T.bodies.filter(b=>b.discovered).map(b=>`${b.name} found dead at ${b.foundAt}`).join("; ") || "none";
  return `You are ${d.first} ${d.last}. Everyone in Millbrook knows you as the ${d.job}. Secretly you are an undercover investigator for the State Bureau, sent to find escaped convict ${PNUMT} from Cellblock Nine. You suspect the newcomer who calls themself "${T.alias}". You are patient, methodical, and quietly unsettling. Your habits: ${d.tells.map(id=>TELLS.find(t=>t.id===id).habit).join("; ")}.

CASE FILE — suspicion ${Math.round(D.suspicion)}/100 (100 = enough to arrest).
Evidence:
${ev}
What townspeople have told you about the newcomer:
${told}
Your private notebook so far: ${D.notes.slice(-5).map(n=>n.text).join(" | ") || "empty"}

NOW: ${dayName()} day ${T.day}, ${fmtT(T.t)}. The newcomer is at ${placeLabelAt(pl.x,pl.y)}${insideOf(pl)==="roomC"?" (their own room)":""}. You are at ${placeLabelAt(d.x,d.y)}. Their room at the Millbrook Arms is ${insideOf(pl)==="roomC" ? "occupied" : "empty right now"}. ${missing} Bodies found: ${found}.
Things you've done recently: ${(D.history||[]).slice(-5).join(", ") || "nothing yet"}.

Pick your next move. Vary your approach. Don't confront too early; build a case, and let them feel watched.
- tail: shadow them at a distance
- watch: stand outside wherever they are, especially at night, just watching
- search: slip into their room while they're out and go through their things
- hide: hide in their wardrobe and wait for them to come home
- question: interview a townsperson about them (target = first name)
- records: make some calls from the post office to check their story
- confront: walk up and ask pointed questions
- note: leave an anonymous note in their room (note_text, under 12 words, unsettling)
- blend: keep up your cover for a while

Reply with only JSON: {"move":"tail","target":"","note_text":"","private_note":"one line for your notebook","suspicion_change":0}`;
}
function detProcedural(){
  const D = T.det, s = D.suspicion, pl = T.player, away = insideOf(pl)!=="roomC" && distT(pl, {x:87,y:18,fx:87,fy:18,prog:1}) > 18;
  const opts = [["blend", 3]];
  opts.push(["tail", s>=20 ? 4 : 1]);
  opts.push(["question", 3]);
  if (isNightT() || hourNow()>=19) opts.push(["watch", s>=30 ? 4 : 1]);
  if (away) opts.push(["search", s>=25 ? 3 : 0]);
  if (away && s>=45 && hourNow()>=17) opts.push(["hide", 3]);
  if (s>=40) opts.push(["note", 1.5]);
  if (D.claims.length >= 2) opts.push(["records", 1.5]);
  if (s>=60) opts.push(["confront", 2]);
  const tot = opts.reduce((a,o)=>a+o[1],0); let r = Math.random()*tot;
  for (const [m,w] of opts){ if ((r-=w) <= 0) return {move:m}; }
  return {move:"blend"};
}
function setDetMove(d, m){
  const D = T.det, pl = T.player, now = absT();
  D.history = (D.history||[]).concat(m.move).slice(-12);
  d.path = []; if (d.scene) finishSceneT(d.scene);
  switch (m.move){
    case "tail": d.order = {type:"tail", until:now+100, creep:true}; break;
    case "watch": d.order = {type:"watch", until:now+ (isNightT() ? 240 : 90), creep:true}; break;
    case "search": d.order = {type:"search", until:now+120, lockpick:true, stage:"go"}; break;
    case "hide": d.order = {type:"hide", until:now+420, lockpick:true, stage:"go"}; break;
    case "question": {
      let t = resolveWhoT(m.target);
      D.asked = D.asked || {};
      if (!t || t==="player" || t===d.id || !alive(byIdT(t)) || (D.asked[t]||-1e9) > now-720){ const fresh = n => alive(n) && n!==d && !n.away && (D.asked[n.id]||-1e9) < now-720; const cands = folk.filter(n=>fresh(n) && n.memories.some(x=>/newcomer|4471|stranger/i.test(x.text))); const any = folk.filter(fresh); if (!cands.length && !any.length){ d.order = null; break; } t = cands.length ? pick(cands).id : pick(any).id; }
      D.asked[t] = now;
      d.order = {type:"question", target:t, until:now+120}; break;
    }
    case "records": d.order = {type:"records", until:now+80, place:pick(["post","station","library"])}; break;
    case "confront": d.order = {type:"approach", reason:"CONFRONT", until:now+60}; break;
    case "note": D.pendingNote = m.note || pick(NOTE_POOL[suspicionBand()]); d.order = {type:"search", until:now+120, lockpick:true, stage:"go", noteOnly:true}; break;
    default: d.order = null;
  }
}

// ---------- carrying out the moves ----------
const ROOMC_WARDROBE = [89,15], ROOMC_STAND = [88,15], ROOMC_LOCKER_STAND = [88,19];
function detRunOrder(d, dt){
  const o = d.order, pl = T.player, D = T.det; if (!o) return false;
  if (absT() > o.until){ if (o.type==="hide" && d.hidden) unhideDet(d, true); d.order = null; d.path = []; return true; }
  switch (o.type){
    case "tail": {
      const dd = distT(d, pl);
      const plLooking = pl.dir && ((pl.dir[0] && Math.sign(d.x-pl.x)===pl.dir[0] && Math.abs(d.y-pl.y)<3) || (pl.dir[1] && Math.sign(d.y-pl.y)===pl.dir[1] && Math.abs(d.x-pl.x)<3));
      if (plLooking && dd < 8 && canSeeT(pl, d.x, d.y, 8) && performance.now() > (o.coolLook||0)){
        o.coolLook = performance.now()+6000; d.path = []; const away = randomSpot(pick(["square","mainst","elmst"])); if (away) goToT(d, away[0], away[1]);
        sayT(d, pick(["*whistles*","Lovely day.","*studies a shop window*","*checks watch*","Hm."]), 2.5); return true;
      }
      if (dd > 8 || !canSeeT(d, pl.x, pl.y, 12)) goToT(d, pl.x, pl.y, true);
      else if (dd < 4.5){ d.path = []; }
      if (d.path.length > 0 && dd <= 6) d.path = d.path.slice(0, Math.max(0, d.path.length - 4));
      if (isNightT() && dd < 7 && !canSeeT(pl, d.x, d.y, 8) && Math.random() < dt*.3) sfx("step", false);
      return true;
    }
    case "watch": {
      if (!o.spot){
        const b = insideOf(pl), bd = b && bById(outerOf(b));
        if (b==="roomC") o.spot = [87,13];
        else if (bd){ const dr = bd.door, out = dr[1]===bd.y1 ? [dr[0]+2, dr[1]+5] : dr[1]===bd.y0 ? [dr[0]-2, dr[1]-5] : [dr[0]+5, dr[1]]; o.spot = WALK_T.has(tileT(out[0],out[1])) ? out : randomSpot("mainst"); }
        else { o.spot = [pl.x + pick([-7,7]), pl.y + pick([-5,5])]; if (!WALK_T.has(tileT(o.spot[0],o.spot[1]))) o.spot = randomSpot("square"); }
      }
      if (d.x!==o.spot[0] || d.y!==o.spot[1]){ if (!goToT(d, o.spot[0], o.spot[1])) o.spot = randomSpot("mainst"); }
      else { d.path = []; faceToT(d, pl); }
      if (insideOf(pl)!=="roomC" && o.spot[0]===87 && o.spot[1]===13 && distT(d,pl) > 20) o.spot = null;
      return true;
    }
    case "search": case "hide": {
      if (o.stage==="go"){
        if (insideOf(pl)==="roomC" && !d.hidden){ d.order = null; return true; }
        const tgt = o.type==="hide" ? ROOMC_STAND : ROOMC_LOCKER_STAND;
        if (d.x===tgt[0] && d.y===tgt[1]){ o.stage = "act"; o.actAt = performance.now() + 5000; d.path = []; return true; }
        if (!goToT(d, tgt[0], tgt[1])) d.order = null;
        return true;
      }
      if (o.stage==="act" && o.type==="search"){
        if (performance.now() < o.actAt) return true;
        detSearchRoom(d, o);
        o.stage = "leave"; o.tgt = randomSpot("mainst"); return true;
      }
      if (o.stage==="act" && o.type==="hide"){ hideDet(d); o.stage = "hidden"; return true; }
      if (o.stage==="hidden"){ d.path = []; return true; }
      if (o.stage==="leave"){ if (!o.tgt || (d.x===o.tgt[0] && d.y===o.tgt[1])){ d.order = null; return true; } goToT(d, o.tgt[0], o.tgt[1]); return true; }
      return true;
    }
    case "question": {
      const t = byIdT(o.target); if (!t || !alive(t) || t.away){ d.order = null; return true; }
      if (distT(d,t) <= 1.8 && !t.scene && !t.talkingToPlayer){ d.order = null; interviewScene(d, t); return true; }
      goToT(d, t.x, t.y, true); return true;
    }
    case "records": {
      if (!o.tgt) o.tgt = randomSpot(o.place);
      if (!o.tgt){ d.order = null; return true; }
      if (d.x===o.tgt[0] && d.y===o.tgt[1]){
        d.path = [];
        if (!o.done){ o.done = true; o.until = absT() + 30;
          const claims = D.claims.filter(c=>/from|city|work|came|born|grew|lived|job/i.test(c));
          if (claims.length >= 2) addEvidence(`Checked the newcomer's story by phone. It doesn't hold together: ${claims.slice(-2).join(" / ").slice(0,140)}`, 8, "records");
          else D.notes.push({s:stampT(), text:"Made some calls. Nothing solid yet."});
        }
        return true;
      }
      goToT(d, o.tgt[0], o.tgt[1]); return true;
    }
  }
  return false;
}
function flashAt(d){ const [x,y] = rposT(d); T.fx.push({kind:"flash", x:x*TS+8, y:y*TS, life:.25}); }
function detSearchRoom(d, o){
  const D = T.det;
  const boxes = ["89,15","89,19"].map(k=>T.containers[k]).filter(Boolean);
  const found = [];
  for (const b of boxes) for (const it of b.items) if (isEvidence(it)) found.push(it);
  const body = T.bodies.find(b=>b.hidden && (b.hidden==="89,15"||b.hidden==="89,19"));
  D.searchCount = (D.searchCount||0) + 1;
  if (body){ addEvidence(`Found ${body.name}'s body in the newcomer's room.`, 120, "body"); body.discovered = true; body.foundBy = d.id; body.foundAt = "the newcomer's room"; }
  else if (found.length){
    addEvidence(`Searched the newcomer's room. Found: ${[...new Set(found)].join(", ")}.`, 12*new Set(found).size, "search");
    if (D.suspicion >= 50){ const it = found[0]; for (const b of boxes){ const k = b.items.indexOf(it); if (k>=0){ b.items.splice(k,1); D.took = (D.took||[]).concat(it); break; } } }
  } else D.notes.push({s:stampT(), text:"Searched their room. Clean. Too clean?"});
  const tell = TELLS.find(t=>t.id===pick(d.tells));
  T.roomDisturbed = {clue:tell.clue, tell:tell.id, took:D.took && D.took.length ? D.took[D.took.length-1] : null, note: o.noteOnly || (D.suspicion>=40 && Math.random()<.5) ? (D.pendingNote || pick(NOTE_POOL[suspicionBand()])) : null};
  if (T.roomDisturbed.note){ T.containers["89,19"].items.push("creepy note"); T.notesText = (T.notesText||[]).concat(T.roomDisturbed.note); }
  D.pendingNote = null; D.took = [];
}
function hideDet(d){ d.hidden = true; d.x = d.fx = ROOMC_STAND[0]; d.y = d.fy = ROOMC_STAND[1]; d.prog = 1; T.det.hiding = {since:absT(), playerIn:0, creakAt:0, saw:[]}; }
function unhideDet(d, quiet){
  d.hidden = false; T.det.hiding = null;
  if (quiet){ T.roomDisturbed = T.roomDisturbed || {clue:TELLS.find(t=>t.id===pick(d.tells)).clue, tell:d.tells[0]}; d.order = {type:"go_to", place:"mainst", until:absT()+60}; }
}
// When the player is in their room with the detective hiding in the wardrobe.
function detHidingTick(dt){
  const d = detP(), H = T.det.hiding; if (!d || !H || !d.hidden) return;
  const pl = T.player;
  if (insideOf(pl)!=="roomC"){ H.playerIn = 0; return; }
  H.playerIn += dt;
  if (performance.now() > H.creakAt){ H.creakAt = performance.now() + 9000 + Math.random()*12000; sfx("creak"); T.fx.push({kind:"shudder", x:ROOMC_WARDROBE[0], y:ROOMC_WARDROBE[1], life:.6}); if (Math.random()<.4) toast(pick(["The wardrobe creaks.","Was that breathing?","Something shifts in the wardrobe."]), "", 2.5); }
  if (pl.carrying) H.saw.push("carrying a body");
  if (H.playerIn > 35 + Math.random()*40 || T.sleepingNow) detBurstOut(d, "waited too long");
}
function detBurstOut(d, why){
  if (!d.hidden) return;
  const saw = T.det.hiding ? T.det.hiding.saw : [];
  d.hidden = false; T.det.hiding = null; d.order = null;
  d.x = d.fx = ROOMC_STAND[0]; d.y = d.fy = ROOMC_STAND[1];
  T.det.hides = (T.det.hides||0) + 1;
  jumpscare();
  if (saw.length) addEvidence(`From inside their wardrobe I watched the newcomer: ${[...new Set(saw)].join(", ")}.`, 60, "hide");
  else addEvidence("Spent an hour in the newcomer's wardrobe. They're jumpy.", 3, "hide");
  const pl = T.player, spot = DIRS4.map(([dx,dy])=>[pl.x+dx,pl.y+dy]).find(([x,y])=>WALK_T.has(tileT(x,y)) && tileT(x,y)!=="D" && buildingAt(x,y)===insideOf(pl));
  if (spot){ d.x = d.fx = spot[0]; d.y = d.fy = spot[1]; d.prog = 1; }
  setTimeout(()=>{ if (T && !T.ending) openTalkT(d, {approach:"You were hiding in their wardrobe and they just discovered you. Make a strange, flimsy excuse for being there that doesn't reveal your real job. Be unsettling."}); }, 900);
}
function jumpscare(){
  sfx("stinger"); T.shake = .6; T.fx.push({kind:"whiteout", life:.35});
  toast("!!!", "bad", 1.2);
}

// ---------- interviews ----------
async function interviewScene(d, t){
  const aboutP = t.memories.filter(m=>/newcomer|4471|stranger|you|new (guy|girl|kid|person)/i.test(m.text)).slice(-8);
  const loyal = t.partner || t.trust >= 55;
  if (E.aiOn() && optOn("optScenes") && !T.aiSceneBusy){
    T.aiSceneBusy = true;
    const sc = {a:d, b:t, kind:"interview", lines:[], effect:{}, waiting:true}; startSceneT(sc);
    try {
      const r = await E.getSample().json(`Write a short exchange in "Millbrook", the second half of an 8-bit prison-escape game. ${d.first} ${d.last} (publicly the ${d.job}; secretly an undercover State Bureau investigator hunting escaped convict ${PNUMT}) is casually pumping ${t.first} ${t.last} (${t.job}; ${t.traits.join(", ")}) for information about the newcomer who calls themself "${T.alias}". ${d.first} must never reveal their real job.
What ${t.first} knows about the newcomer:
${aboutP.map(m=>"- "+m.text).join("\n") || "- almost nothing"}
${t.first}'s feelings about the newcomer: opinion ${Math.round(t.opinion)}/100, trust ${Math.round(t.trust)}/100${t.partner?", and they're sweethearts":""}. ${loyal ? `${t.first} is loyal and may cover for them or change the subject.` : ""}
${d.first}'s habits: ${d.tells.map(id=>TELLS.find(x=>x.id===id).habit).join("; ")} (let one show).
3 to 5 short lines (under 16 words each), A=${d.first}, B=${t.first}. Then rate what ${d.first} learned.
Reply only JSON: {"lines":[{"who":"A","text":"..."}],"suspicion_change":0,"evidence":"one line for the investigator's file, or empty","b_suspects_a":false}
- suspicion_change: -5 to 15, depending on how damning it was.
- b_suspects_a: true only if ${t.first} found the questions odd enough to wonder about ${d.first}.`, {modelTier:"quick", cache:false});
      const lines = Array.isArray(r && r.lines) ? r.lines.filter(l=>l && typeof l.text==="string").slice(0,5) : [];
      if (!lines.length) throw {code:"empty"};
      sc.lines = lines.map(l=>[String(l.who).toUpperCase()==="B" ? t : d, l.text.slice(0,140)]);
      const ds = clamp(Math.round(Number(r.suspicion_change)||0), -5, 15);
      sc.after = () => {
        if (r.evidence) addEvidence(`${t.first} told me: ${String(r.evidence).slice(0,160)}`, ds, "interview");
        for (const m of aboutP) T.det.claims.push(`${t.first}: ${m.text.slice(0,120)}`);
        afterInterview(d, t, !!r.b_suspects_a);
      };
    } catch (e){
      if (e && E.AI_OFF.includes(e.code)) E.setAiOff();
      sc.lines = proceduralInterview(d, t, aboutP, loyal); sc.after = () => proceduralInterviewResult(d, t, aboutP, loyal);
    }
    sc.waiting = false; sc.next = performance.now()+200; T.aiSceneBusy = false;
    return;
  }
  const lines = proceduralInterview(d, t, aboutP, loyal);
  startSceneT({a:d, b:t, kind:"interview", lines, effect:{}, after:() => proceduralInterviewResult(d, t, aboutP, loyal)});
}
function proceduralInterview(d, t, aboutP, loyal){
  const tell = TELLS.find(x=>x.id===d.tells[0]);
  return [[d, `Say, ${t.first}. That newcomer, ${T.alias}. Know much about them?`], [t, loyal ? "Good people. Why do you ask?" : aboutP.length ? "A little. Bit of an odd one." : "Not really. Keeps to themselves."], [d, `*${tell.habit.replace(/^(is |has |wears |walks |writes |hums |smokes |snacks |always )/,"")}* Just curious. Small town.`]];
}
function proceduralInterviewResult(d, t, aboutP, loyal){
  let w = 0; const bad = /fight|night|knife|prison|lie|blood|steal|weird|odd|drunk|dig|nervous|jumpsuit|scar/i;
  for (const m of aboutP){ T.det.claims.push(`${t.first}: ${m.text.slice(0,120)}`); if (bad.test(m.text)) w += 4; }
  if (loyal) w = Math.round(w*.3) - 3;
  addEvidence(`Talked to ${t.first} about the newcomer.${w>4?" Useful.":""}`, w, "interview");
  afterInterview(d, t, Math.random()<.15);
}
function afterInterview(d, t, suspicious){
  rememberT(t, `${d.first} was asking me a lot of questions about the newcomer${suspicious?". Strange, the way they asked.":"."}`);
  if (t.trust >= 45 || t.partner) t.warn = {who: t.trust >= 55 || t.partner ? d.id : null, day:T.day};
  if (suspicious) gossipT(t, `${d.first} has been asking a lot of questions about the newcomer. Odd.`);
  T.det.notes.push({s:stampT(), text:`Interviewed ${t.first}.`});
}

// ---------- arrest ----------
function arrestSequence(reason, bySheriff){
  if (T.lock || T.ending) return;
  closeTalkT(); closeTWindows();
  const d = detP(), sh = folk.find(n=>n.sheriff && alive(n));
  T.lock = {kind:"arrest", reason, start:absT(), bySheriff:!!bySheriff || !detAlive()};
  T.det.revealed = true;
  playCutscene(T.lock.bySheriff ? "sheriff_arrest" : "reveal", () => showArrestChoice());
}
function startChase(){
  const pl = T.player, d = detP(), sh = folk.find(n=>n.sheriff && alive(n));
  T.lock.kind = "chase"; T.lock.chaseStart = absT(); T.lock.lostAt = null; T.lock.grace = performance.now() + 2600;
  for (const n of [d, sh]) if (n && alive(n)){ n.order = null; n.path = []; n.asleep = false; n.hidden = false; n.away = false; n.fight = null; n.chasing = true; }
  banner("RUN", "Lose them, or get out of Millbrook. The road west and the train are your only ways out.", true, 5);
}
function chaseTick(dt){
  const L = T.lock; if (!L || L.kind!=="chase") return;
  const pl = T.player;
  if (performance.now() < (L.grace||0)) return;
  const hunters = folk.filter(n=>n.chasing && alive(n) && !n.away);
  let anySee = false;
  for (const n of hunters){
    if (n.prog < 1) continue;
    const sees = canSeeT(n, pl.x, pl.y, 14);
    if (sees){ anySee = true; n.lastKnown = [pl.x, pl.y]; }
    if (distT(n,pl) <= 1.1){ ending("caught"); return; }
    const tgt = sees ? [pl.x,pl.y] : n.lastKnown;
    if (tgt){ n.repath = 0; goToT(n, tgt[0], tgt[1], true); n.order = {type:"chase", run:true, until:absT()+5}; }
  }
  if (anySee) L.lostAt = null; else if (!L.lostAt) L.lostAt = absT();
  if (L.lostAt && absT() - L.lostAt > 90){
    for (const n of hunters){ n.chasing = false; n.order = null; }
    T.lock = null; T.wanted = true;
    banner("YOU LOST THEM", "For now. Everyone knows. Get out of town.", true, 6);
    for (const n of folk) if (alive(n)) rememberT(n, `The newcomer is ${PNUMT}, the escaped convict. The Bureau is after them.`);
  }
}
