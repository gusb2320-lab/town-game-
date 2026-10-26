// Town life without you: conversations between neighbors, storylines, people coming up to you, plans, the Gazette.
const scenesT = [];
let sceneScanT = 0, aiSceneNextT = 0;
const LINES_T = {
  friendly:[["{B}! Just who I wanted to see.","Uh oh. What now?","*laughs* Nothing! Coffee later?"],["How's the family, {B}?","Can't complain. Well, I can.","*laughs*"],["You look tired, {B}.","Long day at the {JOB}.","Come by tonight, I'll cook."],["Did you hear about the {NEWS}?","Who hasn't?","This town, I swear."],["Save me a seat Sunday?","Always do."]],
  neutral:[["Morning, {B}.","Morning."],["Weather's turning.","Always does this time of year."],["Seen the newcomer around?","{P}? Here and there."],["Busy day?","Same as ever."],["You still at the {JOB}?","Where else would I be?"]],
  tense:[["Well, if it isn't {B}.","Don't start, {A}."],["You've got some nerve.","Excuse me?","You heard me."],["Still haven't forgotten, {B}.","Neither have I."],["Stay off my porch.","Gladly."]],
  romance:[["You look nice today, {B}.","*blushes* Stop it.","I mean it."],["Dinner tonight?","…Only if you're paying.","Deal."],["Thinking about you all day.","*smiles* Same."]],
  spouses:[["Did you remember the milk?","…Which milk?","*sighs*"],["Home for dinner?","Wouldn't miss it."],["Love you, {B}.","Love you too, you old fool."],["Your mother called.","Of course she did."]],
  secretive:[["*glances around* Not here.","Then where?","Later. Behind the church."],["Did anyone see you?","No. I was careful.","Good."]],
  nosy:[["Did you see who came out of {X}'s house last night?","No! Who?","*whispers*"],["That newcomer keeps odd hours.","I've noticed.","Somebody ought to keep an eye out."]],
  kids:[["Can I have five bucks?","For what?","…Stuff."],["Be home by nine.","Ugh, fine."]],
  sheriff:[["Everything quiet, {B}?","Quiet as ever, Sheriff."],["Keep your doors locked, {B}.","Something going on?","Just a feeling."]]
};
function sceneForT(a, b){
  const r = relGetT(a.id,b.id), pl = T.player;
  const lastNews = T.news.length ? T.news[T.news.length-1].text.replace(/\.$/,"").slice(0,40).toLowerCase() : "fair";
  const fill = s => s.replace(/\{A\}/g,a.first).replace(/\{B\}/g,b.first).replace(/\{P\}/g,T.alias.split(" ")[0]).replace(/\{JOB\}/g, b.work ? placeName(b.work).replace(/^the /i,"") : "house").replace(/\{NEWS\}/g, lastNews).replace(/\{X\}/g, pick(folk.filter(o=>o!==a&&o!==b)).first);
  let kind = "neutral", effect = {rel:1};
  // gossip first: about the newcomer, or about each other
  const g = a.gossip.find(x=>!x.to.includes(b.id));
  if (g && r > -30 && Math.random()<.65){
    g.to.push(b.id); rememberT(b, `Heard from ${a.first}: ${g.text}`);
    if (/newcomer/i.test(g.text)) b.opinion = clamp(b.opinion + (/(good|kind|reliable|nice|lovely|helped|generous|sweet)/i.test(g.text) ? 3 : /(dangerous|odd|strange|liar|weird|creepy|blood|thief|paranoid)/i.test(g.text) ? -4 : 0), -100, 100);
    return {a, b, kind:"gossip", lines:[[a,`You heard about the newcomer?`],[b,"What about 'em?"],[a,g.text.slice(0,90)],[b,pick(["You don't say.","Huh. Good to know.","I had a feeling."])]], effect:{rel:2}};
  }
  if (a.spouse===b.id) kind = "spouses";
  else if ((a.parent===b.id || a.child===b.id)) kind = "kids";
  else if (a.sheriff || b.sheriff){ kind = "sheriff"; if (b.sheriff){ const t=a; a=b; b=t; } }
  else if (a.romance===b.id || (a.secretAbout===b.id && /affair|love/.test(a.secret))) { kind = a.secretAbout===b.id && /affair/.test(a.secret) ? "secretive" : "romance"; effect.rel = 3; }
  else if (a.nosy || b.nosy) kind = "nosy";
  else if (r >= 25) kind = "friendly";
  else if (r <= -25){ kind = "tense"; effect.rel = -3; }
  // trading favorite things
  if (r > -15 && Math.random()<.25){
    const want = a.likes.find(w => b.inv.includes(w));
    if (want){ const pay = Math.min(a.money, Math.max(2, Math.round(itemT(want).price))); if (pay > 0) return {a, b, kind:"trade", lines:[[a,`Is that ${want}? I'd buy it off you.`],[b,`For $${pay}, it's yours.`],[a,"Done."]], effect:{rel:3, give:{from:b, to:a, item:want}, pay}}; }
  }
  // fights between bitter enemies
  if (kind==="tense" && r <= -55 && Math.random()<.2) return {a, b, kind:"fight", lines:[[a,"I've had it with you!"],[b,"Then do something about it!"],[a,"*shoves*"]], effect:{rel:-15, fight:true}};
  const set = pick(LINES_T[kind]);
  return {a, b, kind, lines:set.map((t,i)=>[i%2===0 ? a : b, fill(t)]), effect};
}
function startSceneT(sc){
  sc.i = 0; sc.next = sc.next || performance.now()+300;
  for (const n of [sc.a, sc.b]){ if (n.scene && n.scene!==sc) finishSceneT(n.scene); n.scene = sc; n.path = []; }
  faceToT(sc.a, sc.b); faceToT(sc.b, sc.a);
  scenesT.push(sc);
}
function finishSceneT(sc){
  if (!sc || sc.done) return; sc.done = true;
  const i = scenesT.indexOf(sc); if (i>=0) scenesT.splice(i,1);
  if (sc.a.scene===sc) sc.a.scene = null; if (sc.b.scene===sc) sc.b.scene = null;
  sc.a.chatCd = performance.now() + 35000 + Math.random()*35000; sc.b.chatCd = sc.a.chatCd;
  sc.a.wait = 1+Math.random()*2; sc.b.wait = 1+Math.random()*2;
  if (sc.cut) return;
  const e = sc.effect || {}, A = sc.a.first, B = sc.b.first, where = placeLabelAt(sc.a.x,sc.a.y);
  if (e.rel) relAddT(sc.a.id, sc.b.id, e.rel);
  if (e.give){ const {from, to, item} = e.give, k = from.inv.indexOf(item); if (k>=0){ from.inv.splice(k,1); to.inv.push(item); if (e.pay){ const p = Math.min(to.money, e.pay); to.money -= p; from.money += p; } newsT(`${to.first} bought ${item} from ${from.first}.`, [sc.a.id, sc.b.id], true); rememberT(to, `I got ${item} from ${from.first}.`); rememberT(from, `I sold ${item} to ${to.first}.`); } }
  if (sc.summary) newsT(sc.summary, [sc.a.id, sc.b.id]);
  if (sc.memA) rememberT(sc.a, sc.memA); else if (!["neutral","gossip","distract","interview"].includes(sc.kind)) rememberT(sc.a, `${sc.kind==="tense"?"Had words with":"Spent some time with"} ${B} at ${where}.`);
  if (sc.memB) rememberT(sc.b, sc.memB); else if (!["neutral","gossip","distract","interview"].includes(sc.kind)) rememberT(sc.b, `${sc.kind==="tense"?"Had words with":"Spent some time with"} ${A} at ${where}.`);
  if (sc.kind==="tense" && !sc.summary) newsT(`${A} and ${B} had words at ${where}.`, [sc.a.id, sc.b.id], true);
  if (sc.kind==="secretive" && !sc.summary) witnessSecretT(sc);
  if (sc.kind==="romance" && !sc.summary && Math.random()<.4) newsT(`${A} and ${B} were seen getting cozy at ${where}.`, [sc.a.id, sc.b.id], true);
  if (e.fight) startFightT(sc.a, sc.b);
  if (sc.plan) applyTownAction(sc.plan.n, sc.plan.action, {self:true, scene:true});
  if (sc.after) try { sc.after(); } catch (err){ console.warn(err); }
}
// Secret meetings can be spotted, and affairs come out.
function witnessSecretT(sc){
  const spouse = folk.find(o=>alive(o) && (o.spouse===sc.a.id || o.spouse===sc.b.id) && canSeeT(o, sc.a.x, sc.a.y, 8));
  const wit = spouse || folk.find(o=>alive(o) && o!==sc.a && o!==sc.b && !o.asleep && canSeeT(o, sc.a.x, sc.a.y, 7));
  if (!wit) return;
  rememberT(wit, `I saw ${sc.a.first} and ${sc.b.first} sneaking around together at ${placeLabelAt(sc.a.x,sc.a.y)}.`);
  gossipT(wit, `${sc.a.first} and ${sc.b.first} are sneaking around together. I saw them.`);
  if (spouse){
    const cheat = spouse.spouse===sc.a.id ? sc.a : sc.b, other = cheat===sc.a ? sc.b : sc.a;
    relAddT(spouse.id, cheat.id, -40); relAddT(spouse.id, other.id, -50);
    sayT(spouse, `${cheat.first}?! With ${other.first}?!`, 4); emoteT(spouse, "#", 3);
    newsT(`SCANDAL: ${spouse.first} caught ${cheat.first} with ${other.first}.`, [spouse.id, cheat.id, other.id]);
    for (const o of folk) if (alive(o) && Math.random()<.6) rememberT(o, `Word is ${cheat.first} has been having an affair with ${other.first}. ${spouse.first} caught them.`);
    if (relGetT(spouse.id, other.id) <= -60 && Math.random()<.5) spouse.order = {type:"attack", target:other.id, until:absT()+120};
  }
}
function updateScenesT(dt){
  const now = performance.now(), pl = T.player;
  for (const sc of scenesT.slice()){
    if (sc.waiting) continue;
    if (!alive(sc.a) || !alive(sc.b) || sc.a.fight || sc.b.fight || sc.a.away || sc.b.away || sc.a.talkingToPlayer || sc.b.talkingToPlayer){ sc.cut = !sc.lines || sc.i < sc.lines.length-1; finishSceneT(sc); continue; }
    if (now < sc.next) continue;
    if (sc.i >= sc.lines.length){ finishSceneT(sc); continue; }
    const [n, text] = sc.lines[sc.i++];
    sayT(n, text, Math.max(2.4, text.length*.07));
    const d = distT(n, pl);
    if (d < 11 && !T.talkId && !n.hidden) speakLineT(n, text, clamp(1-(d-2)/9, .08, .8), (n.x-pl.x)/9);
    if (d < 8 && /newcomer|4471|stranger/i.test(text)) T.overheard = (T.overheard||[]).concat({s:stampT(), a:n.first, text}).slice(-40);
    sc.next = now + Math.max(2200, text.length*65);
  }
  sceneScanT += dt;
  if (sceneScanT < 1 || (T.lock && T.lock.kind==="chase")) return; sceneScanT = 0;
  const idle = folk.filter(n => alive(n) && !n.away && !n.hidden && !n.asleep && !n.fight && !n.order && !n.scene && !n.path.length && now > (n.chatCd||0) && T.talkId!==n.id);
  for (const a of idle){
    if (a.scene) continue;
    const b = idle.find(o => o!==a && !o.scene && distT(o,a) <= 2.6 && canSeeT(a, o.x, o.y, 3));
    if (!b || Math.random() > .55) continue;
    const near = distT(a, pl) < 9;
    if (near && E.aiOn() && optOn("optScenes") && !T.aiSceneBusy && now > aiSceneNextT && !T.talkId){ aiSceneT(a, b); continue; }
    startSceneT(sceneForT(a, b));
  }
}
function speakLineT(n, text, vol, pan){
  const v = n.voice, dt = .055/(v.speed||1); let t = 0;
  const clean = text.replace(/\*[^*]*\*/g,"").slice(0,70);
  for (let i=0;i<clean.length;i++){ const ch = clean[i]; if (/[a-z0-9]/i.test(ch)) Snd.voice(v, ch, {at:t, vol, pan, contour:contourAt(clean, i)}); t += ch===" " ? dt*.6 : /[,.!?]/.test(ch) ? dt*3 : dt; }
}
function townScenePrompt(a, b){
  const r = relGetT(a.id,b.id), pl = T.player;
  const memOf = (n, o) => n.memories.filter(m => m.text.includes(o.first)).slice(-6).map(m=>`  - [${m.s}] ${m.text}`).join("\n") || "  - nothing notable";
  const aboutP = n => n.memories.filter(m=>/newcomer/i.test(m.text)).slice(-3).map(m=>m.text).join(" | ") || "barely knows them";
  const who = (n) => `${fullT(n)}, ${n.age}, the ${n.job}. ${n.bio} Personality: ${n.traits.join(", ")}. Talks: ${n.style} ${n.tells.length ? "Habits: "+n.tells.map(id=>TELLS.find(t=>t.id===id).habit).join("; ")+"." : ""} Family: ${familyLine(n)}. Carries: ${n.inv.join(", ")||"nothing"}, $${Math.round(n.money)}. Private secret (hint at most): ${n.secret}.${isDet(n) ? ` SECRETLY an undercover State Bureau investigator hunting escaped convict ${PNUMT}; suspects the newcomer (suspicion ${Math.round(T.det.suspicion)}/100). Never reveals it; may steer talk toward the newcomer.` : ""}`;
  const near = distT(a, pl) < 6;
  return `Write a short in-character exchange between two neighbors in "Millbrook", a small nosy town in the 8-bit game "Cellblock Nine". These are ongoing lives with their own storylines: romances, feuds, debts, affairs, rivalries, friendships. The player (a newcomer called "${T.alias}") is not part of this conversation.

A = ${who(a)}
B = ${who(b)}

THEIR RELATIONSHIP: ${r}/100 (${relWordT(r)}).${a.spouse===b.id ? " They are married." : ""}${a.parent===b.id||a.child===b.id ? " Parent and child." : ""}
What A remembers involving B:
${memOf(a,b)}
What B remembers involving A:
${memOf(b,a)}
About the newcomer: A — ${aboutP(a)}. B — ${aboutP(b)}.

TOWN NEWS (recent):
${T.news.slice(-8).map(x=>`- [${x.s}] ${x.text}`).join("\n") || "- quiet so far"}

NOW: ${nowLineT(a)}
AROUND THEM: ${perceiveT(a).around.join(", ")||"nobody else"}. ${near ? "The newcomer is within earshot, so they may lower their voices or glance over." : ""}

Write 3 to 6 short lines (under 16 words each). Make it specific to who they are and what has happened. Move their relationship or a storyline forward a little: a plan, a deal, a confession, a warning, a jab, a flirtation, a favor, a suspicion about the newcomer. Never resolve big secrets outright.

Reply with only JSON:
{"lines":[{"who":"A","text":"..."}],"relationship_change":0,"summary":"one sentence for the town grapevine, or empty if nothing notable","a_remembers":"first-person note","b_remembers":"first-person note","give":{"from":"none","item":""},"romance":false,"plan":{"who":"none","type":"none","target":"","item":"","place":"","text":""}}
- relationship_change -10..10. romance: true only if this is the moment they become a couple.
- give: optionally one item changes hands; from "A" or "B", item must be something they carry.
- plan: usually none. If the talk leads one of them to DO something right after, set who and type: steal (target), attack (target, or newcomer), spread_rumor (target + text), go_to (place), fetch (item), report (they go to the sheriff about the newcomer, text).`;
}
async function aiSceneT(a, b){
  T.aiSceneBusy = true; aiSceneNextT = performance.now() + 55000;
  const sc = {a, b, kind:"ai", lines:[], effect:{}, waiting:true};
  startSceneT(sc); emoteT(a, "…", 3);
  try {
    const r = await E.getSample().json(townScenePrompt(a, b), {modelTier:"quick", cache:false});
    const lines = Array.isArray(r && r.lines) ? r.lines.filter(l=>l && typeof l.text==="string" && l.text.trim()).slice(0,6) : [];
    if (!lines.length) throw {code:"empty"};
    sc.lines = lines.map(l => [String(l.who).toUpperCase()==="B" ? b : a, l.text.trim().slice(0,140)]);
    sc.effect = {rel: clamp(Math.round(Number(r.relationship_change)||0), -10, 10)};
    if (typeof r.summary==="string" && r.summary.trim()) sc.summary = r.summary.trim().slice(0,200);
    if (typeof r.a_remembers==="string" && r.a_remembers.trim()) sc.memA = r.a_remembers.trim();
    if (typeof r.b_remembers==="string" && r.b_remembers.trim()) sc.memB = r.b_remembers.trim();
    if (r.romance===true && !a.teen && !b.teen && relGetT(a.id,b.id) >= 35) sc.after = () => becomeCoupleT(a, b);
    const p = r.plan && typeof r.plan==="object" ? r.plan : null;
    if (p && /^(A|B)$/i.test(String(p.who)) && ["steal","attack","spread_rumor","go_to","fetch","report"].includes(p.type)) sc.plan = {n: String(p.who).toUpperCase()==="A" ? a : b, action: p};
    const gv = r.give && typeof r.give==="object" ? r.give : null;
    if (gv && typeof gv.item==="string" && /^(A|B)$/i.test(String(gv.from))){ const from = String(gv.from).toUpperCase()==="A" ? a : b, to = from===a ? b : a, it = from.inv.find(x=>x.toLowerCase()===gv.item.trim().toLowerCase()); if (it && !weaponDmg(it)) sc.effect.give = {from, to, item:it}; }
  } catch (e){
    if (e && E.AI_OFF.includes(e.code)) E.setAiOff();
    const f = sceneForT(a, b); sc.lines = f.lines; sc.effect = f.effect; sc.kind = f.kind;
  }
  sc.waiting = false; sc.next = performance.now()+200; T.aiSceneBusy = false;
}
function becomeCoupleT(a, b){
  if (a.romance || b.romance) return;
  a.romance = b.id; b.romance = a.id; relAddT(a.id, b.id, 15);
  newsT(`${a.first} and ${b.first} are officially an item!`, [a.id, b.id]);
  for (const o of folk) if (alive(o) && o!==a && o!==b && Math.random()<.5) rememberT(o, `${a.first} and ${b.first} are a couple now.`);
  for (const x of [a,b]) if (x.spouse && alive(byIdT(x.spouse))){ const sp = byIdT(x.spouse); rememberT(sp, `I've heard ${x.first} is seeing ${(x===a?b:a).first}.`); relAddT(sp.id, x.id, -35); }
}

// ---------- background storylines ----------
// Every in-game hour a little something happens between people, so the town has a life of its own.
function townLifeTick(){
  const live = folk.filter(n=>alive(n) && !n.away);
  if (live.length < 4) return;
  const r = Math.random(), a = pick(live), others = live.filter(o=>o!==a);
  const b = pick(others), v = relGetT(a.id, b.id), h = hourNow();
  if (h < 7 || h > 22) return;
  if (r < .12 && v <= -30){
    // a prank or petty theft between rivals
    const box = Object.values(T.containers).find(c=>c.home===b.home && c.items.length && !c.mine);
    if (box){ const it = box.items.splice(Math.floor(Math.random()*box.items.length),1)[0]; a.inv.push(it); rememberT(a, `I took ${b.first}'s ${it}. Serves them right.`); rememberT(b, `Somebody took my ${it}. I bet it was ${a.first}.`); relAddT(a.id,b.id,-5); newsT(`${b.first} says someone stole their ${it}. Fingers are pointing at ${a.first}.`, [a.id,b.id], true); }
  } else if (r < .22 && v >= 45 && !a.romance && !b.romance && !a.spouse && !b.spouse && !a.teen && !b.teen && Math.random()<.4){
    becomeCoupleT(a, b);
  } else if (r < .3 && a.secretAbout===b.id && /owes/.test(a.secret)){
    rememberT(b, `${a.first} still owes me money. I'm losing patience.`); relAddT(a.id,b.id,-6);
    if (relGetT(a.id,b.id) < -40) newsT(`${b.first} was overheard demanding ${a.first} pay what they owe.`, [a.id,b.id], true);
  } else if (r < .38 && v >= 20){
    relAddT(a.id, b.id, 3); rememberT(a, `${b.first} and I ${pick(["had lunch together","played cards","went for a walk","talked for hours","fixed my porch together"])}.`);
  } else if (r < .44){
    const w = pick(live); const amt = pick([20,50,100]);
    if (Math.random()<.15){ w.money += amt; w.mood = "lucky"; newsT(`${w.first} won $${amt} on a scratch ticket from Hartley's.`, [w.id], true); for (const o of live) if (Math.random()<.3) rememberT(o, `${w.first} won $${amt} on the lottery.`); }
  } else if (r < .5 && v <= -45 && Math.random()<.3){
    const sc = {a, b, kind:"tense", lines:[[a,`${b.first}! We need to talk.`],[b,"Not now."],[a,"Yes, NOW."]], effect:{rel:-6}};
    if (distT(a,b) < 3) startSceneT(sc); else { relAddT(a.id,b.id,-4); newsT(`${a.first} and ${b.first} are feuding again.`, [a.id,b.id], true); }
  } else if (r < .55){
    const sick = pick(live); if (!sick.sheriff && !isDet(sick) && Math.random()<.2){ sick.mood = "sick"; sick.freeChoice = {place:sick.home}; sick.freeUntil = performance.now()+120000; newsT(`${sick.first} is home sick today.`, [sick.id], true); }
  } else if (r < .62 && a.secret && Math.random()<.15){
    // secrets leak
    const knower = pick(others); rememberT(knower, `I heard a rumor that ${a.first} ${a.secret}.`); gossipT(knower, `Don't tell anyone, but I heard ${a.first} ${a.secret}.`); relAddT(a.id, knower.id, -3);
  } else if (r < .7 && a.romance && byIdT(a.romance) && relGetT(a.id,a.romance) < 10){
    const ex = byIdT(a.romance); a.romance = null; ex.romance = null; relAddT(a.id, ex.id, -20);
    newsT(`${a.first} and ${ex.first} have split up.`, [a.id, ex.id]);
  }
  // relationships drift a little toward what people have in common
  for (let i=0;i<3;i++){ const x = pick(live), y = pick(live); if (x===y) continue; const common = x.hobbies.filter(hh=>y.hobbies.includes(hh)).length + (x.work && x.work===y.work ? 1 : 0); relAddT(x.id, y.id, common ? 1 : Math.random()<.5 ? -1 : 0); }
}

// ---------- people walk up to you ----------
let approachNextT = performance.now()+20000;
function approachReasonT(n){
  const pl = T.player, today = `day ${T.day})`;
  if (T.tasks.find(t=>t.giver===n.id && t.status==="ready")) return "They came through on the favor you asked. Thank them and pay them.";
  const ap = T.appts.find(a=>a.who===n.id && a.status==="pending" && Math.abs(absT()-a.at) <= 60 && insideOf(pl)===insideOf(n));
  if (ap) return `You had plans with them right about now (${apptText(ap)}). Greet them and get started.`;
  if (n.warn && !n.warn.told && n.warn.day >= T.day-1 && n.trust >= 45){ n.warn.told = true; return n.warn.who ? `Warn them quietly: ${byIdT(n.warn.who).first} has been asking you a lot of questions about them. Include a warn action.` : "Warn them quietly: someone has been asking questions about them. Include a warn action."; }
  if (n.sheriff){ if (T.notoriety >= 40 && Math.random()<.5) return "There's been talk about this newcomer. Ask them some questions, sheriff to citizen. Maybe tell them to keep their nose clean."; return null; }
  if (n.opinion <= -40 && Math.random()<.4) return "You have a grudge against them. Make it clear. You might threaten them or start something.";
  const fresh = n.memories.slice(-6).filter(m => /newcomer/i.test(m.text) && m.s.includes(today) && !m.talked);
  if (fresh.length && Math.random()<.5){ fresh[0].talked = true; return `Bring this up with them: ${fresh[0].text}`; }
  const want = n.likes.find(w => pl.inv.includes(w));
  if (want && Math.random()<.4) return `You noticed they're carrying ${want}, which you love. Make them a trade_offer (money is fine).`;
  const debt = T.debts.find(d=>d.who===n.id && !d.paid && T.day - d.day >= 2);
  if (debt && Math.random()<.6) return `They owe you $${debt.amount}. Ask for it back.`;
  if (n.partner && Math.random()<.5) return "You're sweethearts. Be affectionate, maybe suggest a date (invite).";
  if (!favorFor(n) && n.opinion >= 5 && Math.random()<.25) return "FAVOR";
  if (n.opinion >= 25 && Math.random()<.35) return `You like them. Invite them to do something (${n.hobbies.join(" or ")}) with an invite action.`;
  if (n.nosy && Math.random()<.5) return "You're the town busybody. Pry into the newcomer's business: where they're from, what they do all day.";
  if (n.teen && Math.random()<.3) return "You're bored. Ask them for money, or dare them to do something.";
  if (n.job.includes("salesman") && Math.random()<.4) return "Try to sell them something you carry with a trade_offer.";
  const recent = T.news.slice(-4).filter(x=>!x.who.includes(n.id));
  if (recent.length && Math.random()<.3) return `Share your take on this news: ${pick(recent).text}`;
  if (!n.met && Math.random()<.35) return "Introduce yourself to the new face in town.";
  return null;
}
function considerApproachT(){
  const now = performance.now();
  if (now < approachNextT || T.lock || T.talkId || anyTWindow() || T.cutscene || !optOn("optApproach")) return;
  approachNextT = now + 4000;
  const pl = T.player, cands = [];
  for (const n of folk){
    if (!alive(n) || n.away || n.hidden || n.asleep || n.fight || n.scene || n.order || now < (n.approachCd||0) || isDet(n)) continue;
    if (distT(n,pl) > 10 || !canSeeT(n, pl.x, pl.y, 10)) continue;
    const r = approachReasonT(n); if (r) cands.push([n, r]);
  }
  if (!cands.length) return;
  const urgent = cands.find(([n,r])=>/^Warn|plans with/.test(r));
  const [n, reason] = urgent || pick(cands);
  n.order = {type:"approach", reason, until:absT()+30}; n.path = [];
  n.approachCd = now + 140000; approachNextT = now + 45000 + Math.random()*40000;
  emoteT(n, "…", 2);
}

// ---------- plans and dates ----------
function apptTick(){
  const t = absT(), pl = T.player;
  for (const a of T.appts){
    if (a.status!=="pending") continue;
    const n = byIdT(a.who);
    if (!n || !alive(n)){ a.status = "cancelled"; continue; }
    if (t >= a.at - 30 && t < a.at + 90 && !n.order && !n.fight && !n.away) n.order = {type:"meet", place:a.place, until:a.at+90, appt:a.id};
    const here = buildingAt(pl.x,pl.y)===(PLACES[a.place] && PLACES[a.place].building) || (PLACES[a.place] && PLACES[a.place].rect && (()=>{ const r = PLACES[a.place].rect; return pl.x>=r[0]&&pl.x<=r[2]&&pl.y>=r[1]&&pl.y<=r[3]; })());
    if (t >= a.at - 20 && t <= a.at + 90 && here && distT(n, pl) < 6 && !T.talkId && !anyTWindow()){
      a.status = "met"; keepApptT(a, n); continue;
    }
    if (t > a.at + 90){
      a.status = "missed"; n.opinion = clamp(n.opinion - (a.kind==="date" ? 15 : 8), -100, 100); n.trust = clamp(n.trust-5,0,100);
      rememberT(n, `The newcomer stood me up (${apptText(a)}).`); gossipT(n, "The newcomer stood me up. Unreliable.");
      toast(`You missed your plans with ${n.first}.`, "bad", 4);
      if (n.order && n.order.appt===a.id) n.order = null;
    }
  }
}
function keepApptT(a, n){
  n.order = null; T.stats.dates++;
  n.opinion = clamp(n.opinion + (a.kind==="date" ? 10 : 6), -100, 100); n.trust = clamp(n.trust + 5, 0, 100);
  rememberT(n, `The newcomer kept our plans: ${apptText(a)}. ${a.kind==="date" ? "It was lovely." : "Good time."}`);
  gossipT(n, a.kind==="date" ? "Went out with the newcomer. *sighs*" : `Had a nice time with the newcomer at ${placeName(a.place)}.`);
  sfx("love"); emoteT(n, "♥", 3);
  const act = a.activity;
  if (["darts","cards","fishing","arcade","dance"].includes(act)){
    toast(`${n.first} is here for ${act}.`, "good", 3);
    setTimeout(()=>{ if (!T || T.talkId || anyTWindow()) return; if (act==="darts") startDarts(n); else if (act==="cards") startCards(n); else if (act==="fishing") startFishing(n); else if (act==="arcade") startArcade(n); else if (act==="dance") startDance(n); }, 800);
  } else {
    if (act==="dinner" || a.kind==="date"){ fadeT(1.6, () => { T.t = Math.min(T.t+75, 1439); T.player.hp = Math.min(100, T.player.hp+25); toast(`You spend an evening with ${n.first}. ${pick(["You laugh more than you have in years.","They tell you about growing up here.","Somewhere in it, you forget to be afraid."])}`, "good", 6); if (n.opinion >= 60 && !n.partner && !n.teen && Math.random()<.5) setTimeout(()=>openTalkT(n, {approach:"You had a wonderful evening together and you're falling for them. Tell them how you feel."}), 1800); }, `An evening with ${n.first}…`); }
    else openTalkT(n, {approach:`You had plans (${apptText(a)}). You're both here now. Enjoy it together and chat.`});
  }
}

// ---------- the Millbrook Gazette ----------
async function printGazette(){
  const y = T.day - 1;
  const items = T.news.filter(x=>x.day===y || (x.day===T.day && x.kind)).slice(-12);
  const issue = {day:T.day, headline:"", stories:[], weather: T.weather==="rain" ? "Showers all day." : pick(["Clear and mild.","Sunny, light breeze.","Overcast, clearing by noon.","Cool morning, warm afternoon."])};
  const big = items.find(x=>x.kind==="body") || items.find(x=>x.kind==="missing") || items.find(x=>/SCANDAL|item|fight|stole|beat/i.test(x.text));
  issue.headline = big ? big.text.replace(/^(BODY FOUND|MISSING|SCANDAL): /,"").toUpperCase().slice(0,80) : pick(["QUIET WEEK IN MILLBROOK","COUNCIL DEBATES NEW STOP SIGN","PIE CONTEST ENTRIES OPEN","FISH ARE BITING AT THE POND"]);
  issue.stories = items.slice(-6).map(x=>x.text);
  if (T.day===2) issue.stories.unshift(`ESCAPED CONVICT STILL AT LARGE: State police say inmate ${PNUMT} broke out of Cellblock Nine last week. Considered dangerous. Report strangers to the sheriff.`);
  if (E.aiOn() && optOn("optEvents")){
    try {
      const r = await E.getSample().json(`Write today's front page of the Millbrook Gazette, a tiny small-town paper, in its cozy, gossipy voice. Day ${T.day}, ${dayName()}.
Yesterday's events:\n${items.map(x=>"- "+x.text).join("\n") || "- nothing much"}
${T.day===2 ? `Include a short item: escaped convict ${PNUMT} from Cellblock Nine is still at large; report strangers.` : ""}
${T.missing.length ? `Missing: ${T.missing.map(nmT).join(", ")}.` : ""}
Reply only JSON: {"headline":"under 8 words","stories":["2 to 4 short items, each 1-2 sentences"],"personal":"one small classified or letter to the editor, signed with a townsperson's first name"}
Townspeople you may mention: ${folk.filter(alive).map(n=>`${n.first} (${n.job})`).join(", ")}.`, {modelTier:"quick", cache:false});
      if (r && typeof r.headline==="string") issue.headline = r.headline.toUpperCase().slice(0,80);
      if (r && Array.isArray(r.stories)) issue.stories = r.stories.filter(s=>typeof s==="string").slice(0,4).map(s=>s.slice(0,300));
      if (r && typeof r.personal==="string") issue.personal = r.personal.slice(0,240);
    } catch (e){ if (e && E.AI_OFF.includes(e.code)) E.setAiOff(); }
  }
  T.gazette.push(issue); if (T.gazette.length > 20) T.gazette.shift();
  for (const n of folk) if (alive(n) && Math.random()<.5) rememberT(n, `Read in the Gazette: ${issue.headline.toLowerCase()}.`);
  toast(`📰 The Gazette: ${issue.headline}`, "news", 6); sfx("news");
}

// ---------- startup: Claude writes everybody's life ----------
async function writeBiosT(){
  if (!E.aiOn()){ proceduralBios(); return; }
  try {
    const list = folk.map(n=>`${n.id}: ${fullT(n)}, ${n.age}, ${n.pron}, ${n.job}. Traits: ${n.traits.join(", ")}. Hobbies: ${n.hobbies.join(", ")}. Family: ${familyLine(n)}. Secret: ${n.secret}.${n.nosy?" The town busybody.":""}`).join("\n");
    const r = await E.getSample().json(`Invent the townspeople of Millbrook, a small, sleepy, gossipy American town with a train station, a diner, a bar called the Rusty Nail, a church, an arcade and a pond. For each person write a vivid 2-3 sentence backstory consistent with the facts given (no detectives, no crime-solving pasts), a one-sentence speaking style, and a small quirk.
${list}
Reply only JSON: {"people":[{"id":"p0","bio":"...","style":"...","quirk":"..."}]}`, {modelTier:"default", cache:false});
    for (const p of (r && Array.isArray(r.people) ? r.people : [])){ const n = byIdT(p.id); if (!n) continue; if (typeof p.bio==="string") n.bio = p.bio.slice(0,500); if (typeof p.style==="string") n.style = p.style.slice(0,200); if (typeof p.quirk==="string") n.quirk = p.quirk.slice(0,120); }
  } catch (e){ if (e && E.AI_OFF.includes(e.code)) E.setAiOff(); }
  proceduralBios(); saveT();
}

// ---------- habits on display (the clue trail) ----------
const TELL_SHOW = {mint:["*unwraps a peppermint*","*crunch* Mint?","*sucks a peppermint thoughtfully*"], pipe:["*puffs a cherry-scented pipe*","*taps out a pipe*"], ink:["*jots something in green ink*","*caps a fountain pen*"], hum:["*hums a few bars of an old jazz tune*","♪ hm-hm-hmm ♪"], cologne:["*a whiff of sandalwood*","*straightens a cologne-scented collar*"], limp:["*limps a step*","*rubs an old knee injury*"], seeds:["*spits a sunflower seed shell*","*cracks a sunflower seed*"], chalk:["*dusts blue chalk off their fingers*","*blue chalk on their sleeve*"]};
function tellTick(){
  const pl = T.player;
  for (const n of folk){
    if (!alive(n) || n.hidden || n.asleep || !n.tells.length || n.scene || n.bubble || distT(n,pl) > 7 || !canSeeT(pl, n.x, n.y, 8)) continue;
    if (Math.random() > (isDet(n) ? .05 : .035)) continue;
    const id = pick(n.tells); sayT(n, pick(TELL_SHOW[id]), 3);
    T.seenHabits[n.id] = [...new Set((T.seenHabits[n.id]||[]).concat(id))];
    break;
  }
}
