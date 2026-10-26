// Talking: the town dialog box, what each person knows, what they can do, trade offers in conversation.
const TD = {full:"", shown:0, acc:0, done:true, think:0, busy:false, ctl:null, offer:null, npc:null};
const INCRIMINATING = /\b(prison|jail(?:bird)?|escaped?|escaping|cellblock|cell block|4471|convict|inmate|warden|on the run|broke out|busted out|fugitive|killed|murder(?:ed)?|dead body|bodies|corpse|buried)\b/i;
const optOn = id => { const el = $("t"+id) || $(id); return !el || el.checked; };
const isSheriff = n => n && n.sheriff;

// ---------- who / where ----------
function resolveWhoT(s){
  if (!s) return null;
  const q = String(s).trim().toLowerCase().replace(/^(officer|sheriff|mr\.?|mrs\.?|ms\.?|miss|old|dr\.?|pastor|reverend)\s+/,"");
  if (!q) return null;
  if (/^(player|me|you|the newcomer|newcomer|stranger|#?4471)$/.test(q) || q===String(T.alias||"").toLowerCase() || q===String(T.alias||"").toLowerCase().split(" ")[0]) return "player";
  let n = folk.find(p => p.first.toLowerCase()===q || fullT(p).toLowerCase()===q);
  if (!n) n = folk.find(p => q.startsWith(p.first.toLowerCase()+" ") || q.endsWith(" "+p.last.toLowerCase()) || p.last.toLowerCase()===q);
  if (!n) n = folk.find(p => p.job.toLowerCase()===q || (q.length>3 && p.job.toLowerCase().includes(q)));
  if (!n && q==="sheriff") n = folk.find(p=>p.sheriff);
  return n ? n.id : null;
}
const PLACE_WORDS = [
  [/diner|blue plate|breakfast|lunch|eat/,"diner"],[/store|general|hartley|shop/,"store"],[/barber|clip/,"barber"],[/clinic|doctor|nurse|hospital/,"clinic"],
  [/sheriff|police|station house|jail/,"sheriff"],[/post|mail/,"post"],[/hotel|millbrook arms|lobby/,"hotel"],[/train|station|railway/,"station"],[/platform/,"platform"],
  [/bar\b|rusty nail|saloon|tavern|pub/,"bar"],[/library|books/,"library"],[/arcade|pixel/,"arcade"],[/church|st\.? ambrose|chapel/,"church"],[/garage|mechanic/,"garage"],
  [/barn|dance/,"barn"],[/square|fountain|notice/,"square"],[/park/,"park"],[/pond|lake|dock|fish/,"pond"],[/farm|field/,"farm"],[/wood|forest|trees/,"woods"],
  [/cemetery|graveyard|grave/,"cemetery"],[/junk/,"junkyard"],[/main st/,"mainst"],[/elm/,"elmst"]
];
function resolvePlaceT(s, n){
  if (!s) return null;
  const q = String(s).toLowerCase().trim();
  if (PLACES[q]) return q;
  if (n && /^(my|our) (house|home|place)|^home$|^my room$/.test(q)) return n.home;
  if (/(your|the newcomer'?s|player'?s) room|room c/.test(q)) return "roomC";
  const poss = q.match(/^([a-z]+)'s (house|home|place|room)/);
  if (poss){ const id = resolveWhoT(poss[1]); if (id && id!=="player") return byIdT(id).home; if (id==="player") return "roomC"; }
  for (const [re, id] of PLACE_WORDS) if (re.test(q)) return id;
  return null;
}
const artT = it => /s$|^bleach|^coffee|^rope|^matches/.test(it) ? "some" : /^[aeiou]/.test(it) ? "an" : "a";
const placeName = id => id==="roomC" ? "your room" : PLACES[id] ? (PLACES[id].building && bById(PLACES[id].building) && bById(PLACES[id].building).kind==="home" ? `${(folk.find(f=>f.home===id)||{first:"someone"}).first}'s house` : PLACES[id].label) : "somewhere";

// ---------- the dialog box ----------
function logLineT(n, who, text){ n.log.push({s:stampT(), d:T.day, who, text:String(text).slice(0,500)}); if (n.log.length > 400) n.log.splice(0,1); }
function openTalkT(n, opts={}){
  if (!n || !alive(n) || T.ending || T.cutscene) return;
  if (T.talkId && T.talkId!==n.id) closeTalkT();
  if (n.scene) finishSceneT(n.scene);
  if (n.order && (n.order.type==="approach" || n.order.type==="confront")) n.order = null;
  if (n.asleep){ n.asleep = false; emoteT(n, "!", 1.4); rememberT(n, "The newcomer woke me up."); n.opinion = clamp(n.opinion-3,-100,100); }
  closeTWindows();
  T.talkId = n.id; n.talkingToPlayer = true; n.path = [];
  TD.offer = null; renderOfferT();
  const pl = T.player; faceToT(n, pl); pl.dir = [-n.dir[0], -n.dir[1]];
  document.body.classList.add("talking");
  $("tDialog").hidden = false; sfx("talk");
  const first = !n.met; n.met = true;
  $("tdName").textContent = "";
  $("tdName").append((n.metName || first ? n.first : n.first).toUpperCase(), Object.assign(document.createElement("small"),{textContent: n.knownJob===false ? "" : n.job}));
  $("tdName").style.background = n.sheriff ? "#5e3a24" : n.partner ? "#e07ab0" : "#ef7d57";
  $("tdYou").textContent = "";
  renderTStats(n);
  const fav = T.tasks.find(t=>t.giver===n.id && t.status==="active");
  const appt = T.appts.find(a=>a.who===n.id && a.status==="pending");
  $("tdMem").textContent = n.order ? `${n.first} is ${orderWordT(n.order)}.` : appt ? `Plans: ${apptText(appt)}.` : fav ? `Favor: ${fav.text}` : n.memories.length ? `${n.first} remembers ${n.memories.length} thing${n.memories.length>1?"s":""} about this town and you.` : `${n.first} doesn't know you yet.`;
  renderGiveT();
  if (opts.approach){
    if (opts.approach==="FAVOR") offerFavorT(n);
    else askTownNpc(n, {approach:opts.approach});
  } else {
    const ready = T.tasks.find(t=>t.giver===n.id && t.status==="ready");
    if (ready){ startTypeT("*smiles* You actually did it.", n); payFavorT(ready, n); }
    else if (first) startTypeT(greetingT(n), n);
    else { const last = [...n.log].reverse().find(l=>l.who==="n"); startTypeT(last && last.d===T.day ? last.text : greetingT(n), n); }
  }
  if (!opts.approach && !document.body.classList.contains("touch")) setTimeout(()=>{ if (T && T.talkId===n.id) $("tdInput").focus(); }, 0);
}
function greetingT(n){
  const h = hourNow(), part = h<12 ? "morning" : h<17 ? "afternoon" : "evening";
  if (!n.met || !n.log.length){
    if (n.sheriff) return `*tips hat* Sheriff ${n.last}. Don't believe we've met. Passing through?`;
    if (n.job==="hotel keeper") return `Ah, our guest in Room C. Everything to your liking?`;
    if (n.teen) return pick(["*looks up from a gameboy* …Who are you?","Whoa. A new person. Nobody new ever comes here.","You're the one staying at the hotel, right?"]);
    if (n.nosy) return `Well! You must be the new face everyone's talking about. I'm ${n.first}. ${n.first} ${n.last}. And you are?`;
    return pick([`Good ${part}. Don't think I know you.`, `*looks you up and down* New in town?`, `Hello there. I'm ${n.first}.`, `Oh! Hi. You're the one at the Millbrook Arms?`]);
  }
  if (n.partner) return pick(["*brightens* There you are.","Hey, you. I was hoping I'd run into you.","*squeezes your hand* Hi."]);
  if (n.opinion <= -40) return pick(["What do you want.","*crosses arms*","Make it quick."]);
  if (n.opinion >= 40) return pick([`${T.alias.split(" ")[0]}! Good ${part}!`, "Hey, friend.", "*waves* Just the person."]);
  return pick([`Good ${part}.`, "Oh, hello again.", "*nods*", "Hm? Yes?"]);
}
function renderTStats(n){
  const el = $("tdStats"); el.textContent = "";
  const h = document.createElement("canvas"); h.width = 9; h.height = 9; E.drawHeart(h.getContext("2d"), n.opinion>=10);
  const l = document.createElement("canvas"); l.width = 9; l.height = 9; E.drawLock(l.getContext("2d"));
  el.append(h, n.partner ? "Sweetheart" : opWordT(n.opinion), l, `Trust ${Math.round(n.trust)}`, ` · ${tierOf(n)}`);
  el.title = `Opinion ${Math.round(n.opinion)}/100 · Trust ${Math.round(n.trust)}/100`;
}
function closeTalkT(){
  if (!T || !T.talkId) return;
  if (TD.ctl) TD.ctl.abort();
  const n = byIdT(T.talkId); if (n){ n.talkingToPlayer = false; n.wait = 1+Math.random()*2; n.approachCd = performance.now() + 60000; }
  T.talkId = null; TD.busy = false; TD.done = true; TD.offer = null; renderOfferT();
  $("tDialog").hidden = true; document.body.classList.remove("talking");
  if (document.activeElement===$("tdInput")) $("tdInput").blur();
  renderHotbarT();
}
function startTypeT(text, n){ TD.full = text; TD.shown = 0; TD.acc = 0; TD.done = false; TD.npc = n; renderTDText(); }
function renderTDText(){
  const el = $("tdText"); el.textContent = "";
  if (TD.busy && TD.done){ el.append(".".repeat(1+Math.floor(performance.now()/350)%3)); return; }
  const s = TD.full.slice(0, TD.shown);
  for (const part of s.split(/(\*[^*]*\*?)/)){ if (!part) continue; if (part[0]==="*") el.append(Object.assign(document.createElement("em"),{textContent:part.replace(/\*/g,"")})); else el.append(part); }
  el.scrollTop = el.scrollHeight;
}
function updateDialogT(dt){
  if (!T || !T.talkId) return;
  const n = byIdT(T.talkId); if (!n){ closeTalkT(); return; }
  if (!alive(n) || distT(n, T.player) > 3.2){ closeTalkT(); return; }
  const v = n.voice;
  if (!TD.done){
    TD.acc += dt*34*(v.speed||1);
    let changed = false;
    while (TD.acc >= 1 && TD.shown < TD.full.length){
      TD.acc -= 1; TD.shown++; changed = true;
      const ch = TD.full[TD.shown-1];
      if (/[,.!?]/.test(ch)) TD.acc -= 2.2;
      if (/[a-z0-9]/i.test(ch)){
        const inAction = (TD.full.slice(0,TD.shown).match(/\*/g)||[]).length%2===1;
        if (!inAction) Snd.voice(v, ch, {vol:.9, contour:contourAt(TD.full, TD.shown-1)});
      }
    }
    if (TD.shown >= TD.full.length) TD.done = true;
    if (changed) renderTDText();
  } else if (TD.busy){
    TD.think += dt;
    if (TD.think > .5){ TD.think = 0; Snd.voice(v, pick(["h","m","u"]), {vol:.3, contour:.9}); renderTDText(); }
  }
}
function renderGiveT(){
  const b = $("tdGive"), it = T.sel && T.player.inv.includes(T.sel) ? T.sel : null;
  b.textContent = "";
  if (it){ const im = new Image(); im.src = iconOfT(it); im.alt = ""; b.append("Give", im, it); b.disabled = TD.busy; }
  else { b.append("Give (pick a slot)"); b.disabled = true; }
  for (const id of ["tdSend","tdFavor","tdTrade","tdPay","tdAccuse"]) $(id).disabled = TD.busy;
}

// ---------- what a person knows ----------
function knownHabitsT(n){
  // people notice the habits of those they spend time with
  if (!n.habitKnow){
    const others = folk.filter(o=>o!==n && o.tells.length);
    n.habitKnow = others.filter(o => relGetT(n.id,o.id) >= 15 || o.home===n.home || o.work===n.work || Math.random()<.45).map(o=>o.id);
  }
  return n.habitKnow.map(byIdT).filter(Boolean).map(o => `${o.first} ${o.tells.map(id=>TELLS.find(t=>t.id===id).habit).join(" and ")}`);
}
function familyLine(n){
  const out = [];
  if (n.spouse) out.push(`married to ${fullT(byIdT(n.spouse))}${!alive(byIdT(n.spouse)) ? " (now dead)" : ""}`);
  if (n.child) out.push(`parent of ${byIdT(n.child).first} (${byIdT(n.child).age})`);
  if (n.parent) out.push(`child of ${fullT(byIdT(n.parent))}`);
  const mates = folk.filter(o=>o!==n && o.home===n.home && o.id!==n.spouse && o.id!==n.child && o.id!==n.parent);
  if (mates.length) out.push(`shares a house with ${mates.map(m=>m.first).join(", ")}`);
  if (n.romance && byIdT(n.romance)) out.push(`seeing ${byIdT(n.romance).first} romantically`);
  return out.join("; ") || "lives alone";
}
function homeLine(n){
  if (n.home==="roomA") return "a room at the Millbrook Arms (Room A)";
  if (n.home==="roomB") return "a rented room at the Millbrook Arms (Room B)";
  if (n.home==="barback") return "the back room of the Rusty Nail";
  const bd = bById(n.home); return bd ? `a house on ${bd.y0 < 57 ? "the north side of Elm Street" : bd.y0 > 57 && bd.y0 < 70 ? "the south side of Elm Street" : "the edge of town"}` : "somewhere in town";
}
function relLinesT(n){
  const rows = folk.filter(o=>o!==n).map(o=>({o, v:relGetT(n.id,o.id)}));
  rows.sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));
  return rows.slice(0,10).map(({o,v}) => `- ${fullT(o)}, ${o.job}${o.dead ? (T.bodies.find(b=>b.id===o.id && b.discovered) ? " [DEAD, murdered]" : " [nobody has seen them lately]") : ""}: you're ${relWordT(v)} (${v}).`).join("\n");
}
function favorFor(n){ return T.tasks.find(t=>t.giver===n.id && t.status!=="done" && t.status!=="failed"); }
const apptText = a => `${a.kind==="date" ? "a date" : a.kind} at ${placeName(a.place)}, ${dayName(Math.floor(a.at/1440))} ${fmtT(a.at)}`;
function nowLineT(n){
  const pl = T.player, w = T.weather==="rain" ? " It's raining." : "";
  const ev = T.event && T.event.day===T.day ? ` Today: ${T.event.text}` : "";
  return `${dayName()} (day ${T.day} since the newcomer arrived), ${fmtT(T.t)}, at ${placeLabelAt(n.x,n.y)}.${w}${ev}${T.lock && T.lock.kind==="chase" ? " The newcomer is being chased by the law!" : ""}${T.wanted ? " Everyone knows the newcomer is escaped convict "+PNUMT+"." : ""}`;
}
const TOWN_ACTIONS_DOC = `ACTIONS: things you actually DO, right now, in the world. Include one only if you genuinely decide to (you may refuse, haggle, ask for money first, stall, lie, or agree and do it). If you agree to help, include the action; don't promise without acting. Anything can happen; stay in character.
{"type":"give_item","item":"x"} hand them something you carry
{"type":"give_money","amount":10} hand them cash (you have $MONEY)
{"type":"trade_offer","give":["your items"],"want":["their items"],"give_money":0,"want_money":0} propose a deal; they see Accept/Decline. Use it for selling, buying, swapping or asking a price.
{"type":"invite","activity":"darts|cards|fishing|dinner|dance|arcade|walk|drinks|church|visit","place":"place","hour":19} make a plan to meet later today or tomorrow (hour 0-23)
{"type":"follow","minutes":90} walk with them / have their back
{"type":"go_to","place":"PLACES","minutes":60} go somewhere and wait
{"type":"let_in","minutes":120} leave your front door unlocked for them
{"type":"fetch","item":"x"} go find an item and bring it to them
{"type":"deliver","item":"x you carry","target":"name"} carry something to someone
{"type":"steal","target":"name","item":"optional"} sneak into that person's house and bring them what you find
{"type":"distract","target":"name"} go keep someone busy talking for a while
{"type":"attack","target":"name or newcomer"} go start a fight
{"type":"spread_rumor","target":"name or newcomer","text":"the rumor"} whisper it around town
{"type":"offer_task","item":"thing you want brought","target":"optional person to deliver to","reward":20} ask them a favor, for a cash reward
{"type":"tell_secret","text":"a secret you share"} confide something (yours or someone else's)
{"type":"warn","text":"what you warn them about"} quietly warn them
{"type":"cover_for","minutes":1440} agree to lie for them if anyone asks (an alibi)
{"type":"become_partner"} only if you are truly in love with them and they've asked or clearly want it
{"type":"break_up"} end your romance with them
{"type":"report","text":"what you tell the sheriff"} go to the sheriff about them
{"type":"other","text":"anything else you do, in a few words"}`;
const SHERIFF_DOC = `SHERIFF ACTIONS: {"type":"arrest","reason":"x"} take them to the cells (only for a real crime you know about) {"type":"fine","amount":20} {"type":"search"} pat down their pockets`;
const DET_DOC = `INVESTIGATOR ACTIONS (only you): {"type":"search"} ask to look in their pockets and do it if they let you (or insist) {"type":"close_case"} only if you are now convinced they are NOT ${PNUMT}: you'll quietly leave Millbrook {"type":"arrest"} only if suspicion is 85+ and you're ready to blow your cover`;

function townPrompt(n, said, gave, approach, extra={}){
  const pl = T.player, det = isDet(n), D = T.det;
  const mems = n.memories.slice(-90).map(m=>`- [${m.s}] ${m.text}`).join("\n") || "- Nothing. You've never dealt with them.";
  const recent = n.log.slice(-24).map(l => l.who==="p" ? `Newcomer: ${l.text}` : l.who==="n" ? `You: ${l.text}` : `[${l.text}]`).join("\n") || "(You haven't spoken before.)";
  const sees = perceiveT(n);
  const now = approach ? `[You walk up to the newcomer and start the conversation yourself. Why: ${approach}]`
    : extra.accuse ? `The newcomer leans in and says quietly: "${said || "I know what you really are. You're a cop. A detective."}" [They are accusing YOU of being an undercover detective.]`
    : gave && !said ? `[The newcomer hands you: ${gave}]` : gave ? `[The newcomer hands you: ${gave}] and says: "${said}"` : `The newcomer says: "${said}"`;
  const fav = favorFor(n), appts = T.appts.filter(a=>a.who===n.id && a.status==="pending");
  const habits = n.tells.map(id=>TELLS.find(t=>t.id===id).habit);
  const knows = knownHabitsT(n);
  const name = n.memories.some(m=>m.text.includes(T.alias)) || n.log.some(l=>l.who==="p" && l.text.toLowerCase().includes(T.alias.toLowerCase().split(" ")[0])) ? `They told you their name is ${T.alias}.` : `You don't know their name unless it appears in your memories or the conversation (they go by "${T.alias}").`;
  const notor = T.notoriety >= 70 ? "Half the town is whispering that the newcomer is dangerous." : T.notoriety >= 35 ? "There's some talk around town about the newcomer." : "";
  const romance = n.partner ? `You and the newcomer are SWEETHEARTS. You love them. ${n.spouse && alive(byIdT(n.spouse)) ? `(You're still married to ${byIdT(n.spouse).first}. It's an affair.)` : ""}` : (n.opinion >= 45 && n.age >= 18 && !n.teen ? `You're fond of them${n.traits.includes("romantic")||n.traits.includes("flirtatious") ? ", maybe more than fond" : ""}.` : "");
  const secretRole = det ? `
YOUR REAL IDENTITY — NEVER REVEAL IT UNLESS ALL IS LOST: you are ${D.realName}, an undercover investigator with the ${D.agency}. Your cover as the ${n.job} has held for months. Escaped convict ${PNUMT} broke out of Cellblock Nine prison two days' walk from here, and you strongly suspect the newcomer is ${PNUMT}. You are patient, polite, a little too interested, and quietly unsettling. Steer conversations toward their past: where they came from, what they did before, why Millbrook, old scars, family. Notice contradictions with what they told others. Let your habits show in *actions* (${habits.join("; ")}). You may be creepy in small ways: knowing things you shouldn't, mentioning their room, their hours, a detail from their past.
YOUR CASE FILE: suspicion ${Math.round(D.suspicion)}/100 (100 = enough to arrest). Recent evidence:
${D.evidence.slice(-8).map(e=>`- ${e.text}`).join("\n")}
What townsfolk have told you about the newcomer: ${D.claims.slice(-8).join(" | ") || "nothing yet"}.
${extra.accuse ? (D.suspicion >= 70 ? "They've unmasked you, and you have nearly enough. You may drop the act coldly, or keep lying with a thin smile." : "They've guessed right. Deny it smoothly, laugh it off, or turn it around on them. Being accused is itself suspicious; note it.") : ""}
EXTRA JSON FIELDS FOR YOU: "suspicion_change" (-10..15: how much more or less this conversation makes you think they're ${PNUMT}) and "evidence" (one line for your file, or empty). Lies that contradict what they told others, nervousness, knowing prison slang, or mentions of prison all raise it. Openness, consistent detail and warmth lower it a little.` : "";
  const sheriffRole = n.sheriff ? `You are the town sheriff. You know nothing about any undercover investigator. You keep the peace and you're proud of this town. ${T.det.sheriffFile ? `You've been building your own file on the newcomer (${Math.round(T.det.sheriffFile)}/100).` : ""}` : "";
  const warn = n.warn && n.warn.day >= T.day-2 ? `You recently noticed ${n.warn.who ? byIdT(n.warn.who).first+" asking a lot of pointed questions about the newcomer" : "someone asking questions about the newcomer"}. ${n.trust >= 45 ? "You like them enough that you might warn them." : ""}` : "";
  const cover = n.coverFor && n.coverFor > absT() ? "You promised to cover for the newcomer if anyone asks." : "";
  return `You are voicing ${fullT(n)} in "Millbrook", the second half of the 8-bit game "Cellblock Nine". It's a small, sleepy, nosy town where anything can happen. Stay completely in character. Never mention AI, games or players.

WHO YOU ARE: ${n.bio}
AGE ${n.age}. JOB: ${n.job}${n.work ? ` (you work at ${placeName(n.work)}${n.hours ? `, ${n.hours[0]}:00 to ${n.hours[1]%24}:00` : ""})` : ""}. HOME: ${homeLine(n)}. FAMILY: ${familyLine(n)}.
PERSONALITY: ${n.traits.join(", ")}. HOBBIES: ${n.hobbies.join(", ")}. YOU LIKE: ${n.likes.join(", ")}. YOU DISLIKE: ${n.dislikes.join(", ")}.
HOW YOU TALK: ${n.style} QUIRK: ${n.quirk}.${habits.length ? ` YOUR HABITS: ${habits.join("; ")} (let them show in *actions* now and then).` : ""}
YOUR SECRET (guard it; hint at most, unless you deeply trust them): ${n.secret}.
YOU CARRY: ${n.inv.join(", ") || "nothing"}, and $${Math.round(n.money)}.${sheriffRole ? "\n"+sheriffRole : ""}${secretRole}
PEOPLE IN TOWN AND HOW YOU FEEL ABOUT THEM:
${relLinesT(n)}
HABITS YOU'VE NOTICED IN NEIGHBORS (share if asked): ${knows.slice(0,6).join("; ") || "none in particular"}.

THE NEWCOMER: arrived in Millbrook on day 1 and rents Room C at the Millbrook Arms. ${name}
YOU AND THEM: opinion ${Math.round(n.opinion)}/100, trust ${Math.round(n.trust)}/100 (${tierOf(n)}). Mood: ${n.mood}. ${romance} ${warn} ${cover} ${notor}
Trust: below 20 you risk nothing for them. 30+ small favors, invitations. 50+ secrets, lending money, risky favors (stealing, letting them in, lying for them). 70+ you'd fight for them. Money can stand in for trust if you're greedy.
${fav ? `A FAVOR YOU ASKED OF THEM: ${fav.text} (status: ${fav.status}).\n` : ""}${appts.length ? `PLANS YOU HAVE WITH THEM: ${appts.map(apptText).join("; ")}.\n` : ""}${n.order ? `WHAT YOU'RE DOING RIGHT NOW: ${orderWordT(n.order)}.\n` : ""}
EVERYTHING YOU REMEMBER (oldest first):
${mems}

RIGHT NOW: ${nowLineT(n)}
AROUND YOU: ${sees.around.join(", ") || "nobody else"}.
THE NEWCOMER LOOKS: ${sees.me.join(", ") || "ordinary enough"}.
TOWN NEWS: ${T.news.slice(-6).map(x=>x.text).join(" | ") || "quiet"}

RECENT CONVERSATION, WORD FOR WORD:
${recent}

NEW: ${now}

Answer as ${n.first}. React to what's actually around you and what you remember. You have your own life and agenda: ask for things, gossip, invite them places, make deals, refuse, flirt, warn, or surprise them. Under 45 words; a short *action* is fine.

${TOWN_ACTIONS_DOC.replace("$MONEY", "$"+Math.round(n.money)).replace("PLACES", Object.keys(PLACES).filter(k=>!/^home\d|^room|barback/.test(k)).join("|")+"|someone's house")}
${n.sheriff ? SHERIFF_DOC : ""}${det ? DET_DOC : ""}

Reply with only this JSON:
{"reply":"what you say","mood":"one word","opinion_change":0,"trust_change":0,"remember":"","gossip":"","actions":[]${det ? ',"suspicion_change":0,"evidence":""' : ""}}
- opinion_change -15..15; trust_change -20..10.
- remember: first-person note of anything worth remembering (their name, what they claim about their past, promises, plans, lies, gifts, threats). Empty if nothing new.
- gossip: something you'd pass on about the newcomer, or empty.`;
}

// ---------- asking ----------
async function askTownNpc(n, {said="", gave=null, approach=null, accuse=false} = {}){
  if (TD.busy) return;
  const pl = T.player;
  if (gave){
    const k = pl.inv.lastIndexOf(gave); if (k<0) return;
    pl.inv.splice(k,1); n.inv.push(gave); logLineT(n, "e", `You hand ${n.first} the ${gave}.`); sfx("stash");
    n.gifts = (n.gifts||0)+1; T.stats.gifts++;
    const handled = checkFavorOnGiveT(n, gave);
    if (!handled && n.likes.includes(gave)) n.trust = clamp(n.trust+2,0,100);
    if (isEvidence(gave) && isDet(n)) addEvidence(`The newcomer handed me a ${gave}.`, 10, "gift");
    renderHotbarT();
  }
  if (said){
    logLineT(n, "p", said); T.stats.lines++;
    if (isDet(n)) T.det.claims.push(`Told me: "${said.slice(0,120)}"`);
    if (INCRIMINATING.test(said)){ rememberT(n, `The newcomer said something strange about ${said.match(INCRIMINATING)[0].toLowerCase()}: "${said.slice(0,120)}"`); if (!isDet(n)) addEvidenceVia(n, `${n.first} heard the newcomer mention "${said.match(INCRIMINATING)[0]}".`, 4); }
    checkVisitFavorT(n);
  }
  $("tdYou").textContent = (gave ? `[gave ${gave}] ` : "") + (said ? `You: ${said}` : "");
  $("tdMem").textContent = "";
  TD.busy = true; TD.done = true; TD.think = 0; renderTDText(); renderGiveT();
  let res = null;
  const sample = E.getSample();
  if (E.aiOn() && sample){
    TD.ctl = new AbortController();
    try { res = await sample.json(townPrompt(n, said, gave, approach, {accuse}), {modelTier: optOn("optDeep") ? "default" : "quick", cache:false, signal:TD.ctl.signal}); }
    catch (e){
      const code = e && e.code;
      if (code==="cancelled"){ TD.busy = false; return; }
      if (E.AI_OFF.includes(code)){ E.setAiOff(); res = fallbackTown(n, said, gave, approach, accuse); }
      else if (code==="refused"){ TD.busy = false; startTypeT("*stares at you and says nothing*", n); renderGiveT(); return; }
      else { res = fallbackTown(n, said, gave, approach, accuse); if (!T.aiWarned){ T.aiWarned = true; toast(code==="rate_limited" ? "Claude is busy right now; people are using stock lines for a moment." : "Couldn't reach Claude just then; using stock lines.", "", 4); } }
    }
  } else res = fallbackTown(n, said, gave, approach, accuse);
  TD.busy = false;
  if (!res || T.talkId!==n.id) return;
  applyTownResult(n, res, said, accuse);
  renderGiveT(); renderTStats(n); saveT();
}
function applyTownResult(n, r, said, accuse){
  const reply = typeof r.reply==="string" && r.reply.trim() ? r.reply.trim().slice(0,500) : "*nods*";
  logLineT(n, "n", reply);
  startTypeT(reply, n);
  if (typeof r.mood==="string" && r.mood.trim()) n.mood = r.mood.trim().split(/\s+/)[0].toLowerCase().slice(0,16);
  const dOp = clamp(Math.round(Number(r.opinion_change)||0), -15, 15), dTr = clamp(Math.round(Number(r.trust_change)||0), -20, 10);
  n.opinion = clamp(n.opinion+dOp, -100, 100); n.trust = clamp(n.trust+dTr, 0, 100);
  if (dOp >= 3 || dTr >= 3){ emoteT(n,"♥"); sfx("love"); } else if (dOp <= -3 || dTr <= -5){ emoteT(n,"#"); sfx("grr"); }
  const memos = [];
  if (typeof r.remember==="string" && r.remember.trim()){ rememberT(n, r.remember.trim()); memos.push(`✎ ${n.first} will remember that.`); sfx("memo"); if (/name is|called|goes by/i.test(r.remember)) n.metName = true; }
  else if (said) rememberT(n, `The newcomer said to me: "${said.slice(0,160)}"`);
  if (dTr) memos.push(`Trust ${dTr>0?"+":""}${dTr}.`);
  if (typeof r.gossip==="string" && r.gossip.trim()) gossipT(n, r.gossip.trim());
  if (isDet(n)){
    const ds = clamp(Math.round(Number(r.suspicion_change)||0), -10, 15);
    const ev = typeof r.evidence==="string" ? r.evidence.trim() : "";
    if (ds || ev) addEvidence(ev || (ds>0 ? "Something in how they talked." : "They seemed open enough."), ds, "talk");
    if (accuse) addEvidence("The newcomer accused me of being a detective. How would an innocent drifter guess that?", 12, "accused");
  } else if (accuse){
    rememberT(n, "The newcomer accused me of being some kind of undercover cop. Bizarre.");
    gossipT(n, "The newcomer is paranoid. Asked me if I was a detective, of all things.");
    n.opinion = clamp(n.opinion-6,-100,100);
    const d = detP(); if (d && detAlive()) addEvidenceVia(n, `The newcomer has been asking people if they're undercover cops. ${n.first} told me.`, 8);
  }
  const acts = (Array.isArray(r.actions) ? r.actions : r.action ? [r.action] : []).slice(0,3);
  for (const a of acts){ const m = applyTownAction(n, a, {said}); if (m) memos.push(m); }
  $("tdMem").textContent = memos.join(" ");
}

// ---------- fallback lines when Claude isn't around ----------
function fallbackTown(n, said, gave, approach, accuse){
  const r = {reply:"", mood:n.mood, opinion_change:0, trust_change:0, remember:"", gossip:"", actions:[]};
  const s = (said||"").toLowerCase(), first = T.alias.split(" ")[0];
  if (approach){
    if (/CONFRONT/.test(approach)) r.reply = pick(["Funny. I was just thinking about you. Where did you say you came from, again?","You keep odd hours for a drifter.","*smiles thinly* You look like someone I read about once."]);
    else if (/hiding in their wardrobe/i.test(approach)) r.reply = pick(["*steps out of the wardrobe* Oh! The… the hotel asked me to check the hinges.","*brushes off coat* I must have the wrong room. Terribly sorry.","Ah. You're home early. I was… looking for a cat."]);
    else if (/warn/i.test(approach)) { const d = n.warn && n.warn.who ? byIdT(n.warn.who) : null; r.reply = d ? `*leans in* Watch yourself. ${d.first} has been asking all kinds of questions about you.` : "*quietly* Somebody's been asking about you. Thought you should know."; }
    else if (/plans|appointment|You had plans/i.test(approach)) r.reply = pick(["There you are! Ready?","You came! Let's go.","*waves you over* Right on time."]);
    else if (/favor|FAVOR/.test(approach)) r.reply = "Could I ask you something?";
    else if (/trade/i.test(approach)) r.reply = "Say, what would you want for that?";
    else if (/grudge/i.test(approach)) r.reply = "*blocks your way* I've got a bone to pick with you.";
    else if (n.partner) r.reply = pick(["*takes your arm* Walk with me a while?","I missed you today.","Come here, you."]);
    else r.reply = pick([`Oh, ${n.metName ? first : "hello"}! Got a minute?`, "Hey, you hear the news?", "Say, newcomer. How are you finding Millbrook?", "*waves* Wait up!"]);
    return r;
  }
  if (gave){
    const liked = n.likes.includes(gave);
    r.reply = liked ? `*eyes light up* ${gave}! You remembered. Thank you.` : `*takes the ${gave}* Oh. That's kind of you.`;
    r.opinion_change = liked ? 10 : 4; r.trust_change = liked ? 4 : 2; r.remember = `The newcomer gave me ${gave}.`;
    if (isEvidence(gave)){ r.reply = `*frowns at the ${gave}* Where did you get this?`; r.opinion_change = -2; r.remember = `The newcomer gave me a ${gave}. Odd thing to have.`; }
    return r;
  }
  if (accuse){
    if (isDet(n)) r.reply = pick(["*laughs a little too long* A detective? Me? That's a new one.", "*sucks a tooth* What would a detective want with you, I wonder?", "Me? I'm just the "+n.job+". Why? Have you done something?"]);
    else r.reply = pick(["A what? Are you feeling all right?","*stares* I've lived here my whole life.","Ha! Wait till I tell everyone."]);
    if (isDet(n)){ r.suspicion_change = 4; if (T.det.suspicion < 30){ r.reply = "*long pause* …You're sharper than you look. And cleaner than I thought. *pockets the notebook* I think I've wasted my time here."; r.actions = [{type:"close_case"}]; } }
    return r;
  }
  const tellHit = TELLS.find(t => t.words.some(w => s.includes(w)));
  if (tellHit){
    const who = folk.filter(o=>alive(o) && o!==n && o.tells.includes(tellHit.id) && (n.habitKnow ? n.habitKnow.includes(o.id) : true));
    knownHabitsT(n);
    const known = who.filter(o=>n.habitKnow.includes(o.id));
    if (n.tells.includes(tellHit.id)) r.reply = `*shifts* Well, I ${tellHit.habit.replace(/^is |^has |^always /,"")} myself. Why do you ask?`;
    else if (known.length) r.reply = `${tellHit.clue.replace(/^A |^The |^Someone /,"")}? That sounds like ${known.map(o=>o.first).join(" or ")} to me.`;
    else r.reply = "Hm. Can't say I've noticed anyone like that.";
    r.remember = `The newcomer asked me about ${tellHit.words[0]}.`;
    return r;
  }
  if (/\b(what do you do|your job|work)\b/.test(s)){ r.reply = `I'm the ${n.job}. ${n.work ? `You'll find me at ${placeName(n.work)} most days.` : "Retired, mostly."}`; return r; }
  if (/where.*(from|before)|your past|grow up/.test(s)){ r.reply = pick(["Born and raised. Never left.","Came here thirty years ago and never looked back.","Here and there. Why?"]); return r; }
  for (const o of folk){ if (o===n || !s.includes(o.first.toLowerCase())) continue; const v = relGetT(n.id,o.id); r.reply = o.dead ? `${o.first}? *goes pale* Don't.` : v >= 40 ? `${o.first}? One of the good ones. We're ${relWordT(v)}.` : v <= -25 ? `${o.first}. *scowls* Don't get me started.` : `${o.first}? The ${o.job}. ${pick(["Decent enough.","Keeps to themself.","Bit of a busybody.","Hard to read."])}`; return r; }
  const act = ["darts","cards","fishing","fish","dinner","dance","arcade","walk","drink"].find(w=>s.includes(w));
  if (act && /(want|wanna|let's|lets|join|come|play|how about|would you)/.test(s)){
    if (n.opinion >= 5 || n.hobbies.some(h=>h.includes(act.replace("fish","fishing")))){ const kind = act==="fish"?"fishing":act==="drink"?"drinks":act; const place = {darts:"bar",cards:"bar",fishing:"pond",dinner:"diner",dance:"barn",arcade:"arcade",walk:"park",drinks:"bar"}[kind]; const hr = Math.min(22, Math.max(hourNow()+1, kind==="dance"?20:18)); r.reply = `I'd like that. ${placeName(place)} around ${hr}:00?`; r.actions = [{type:"invite", activity:kind, place, hour:hr}]; r.opinion_change = 3; }
    else r.reply = "Maybe some other time.";
    return r;
  }
  if (/my name is|i'm |i am |call me/.test(s)){ r.reply = pick(["Nice to meet you properly.","Well, welcome to Millbrook.",`Pleasure. I'm ${n.first}.`]); r.remember = `The newcomer introduced themself: "${said.slice(0,80)}"`; r.opinion_change = 2; n.metName = true; return r; }
  if (/follow|come with|walk with|protect/.test(s)){ if (n.trust >= 30 || n.partner){ r.reply = "Sure, I'll tag along."; r.actions = [{type:"follow", minutes:90}]; } else r.reply = "I hardly know you."; return r; }
  if (/love you|be mine|go out with|date|kiss/.test(s)){
    if (n.partner) r.reply = "*blushes* You know I do.";
    else if (n.opinion >= 55 && n.trust >= 35 && !n.teen){ r.reply = "*takes your hand* I was hoping you'd say that."; r.actions = [{type:"become_partner"}]; }
    else if (n.opinion >= 25) { r.reply = "*laughs nervously* Slow down, stranger."; r.opinion_change = 1; }
    else { r.reply = "Excuse me?!"; r.opinion_change = -4; }
    return r;
  }
  if (/money|cash|loan|lend|dollars|\$/.test(s)){ if (n.trust >= 50 && n.money > 30){ r.reply = "Just this once. Pay me back."; r.actions = [{type:"give_money", amount:20}]; r.remember = "I lent the newcomer $20."; } else r.reply = "*pats pockets* Not for you, friend."; return r; }
  if (/favor|help|job|work for/.test(s)){ return {...r, reply:"Funny you ask.", actions:[{type:"offer_task"}]}; }
  if (/secret/.test(s)){ if (n.trust >= 55){ r.reply = `*glances around* Fine. I ${n.secret}. Not a word.`; r.actions = [{type:"tell_secret", text:`I ${n.secret}`}]; } else r.reply = "Everybody's got secrets. Mine stay mine."; return r; }
  if (/detective|cop|investigat|police/.test(s)){ r.reply = n.sheriff ? "I'm the only law in Millbrook." : pick(["A detective? In Millbrook? Ha.","Why, you expecting one?","*squints* Strange question."]); if (isDet(n)) r.suspicion_change = 3; return r; }
  if (isDet(n) && Math.random()<.5){ r.reply = pick(["Where did you say you were from?","You've got calloused hands for a salesman.","Funny, I've seen your face somewhere. Can't place it.","Sleeping all right at the hotel? Room C, isn't it?","Must be nice, starting fresh somewhere nobody knows you."]); r.suspicion_change = INCRIMINATING.test(s) ? 8 : 0; return r; }
  r.reply = pick(n.opinion <= -30 ? ["Hmph.","I've got nothing to say to you.","*turns away*"] : n.partner ? ["You always know what to say.","*laughs* You're trouble.","Stay a while?"] : ["Is that so.","Huh. Well, this is Millbrook. Nothing much happens.","*nods* Mm-hm.","You don't say.","Ha! Funny.","Well, I should get back to it."]);
  if (INCRIMINATING.test(s)){ r.reply = "*stares at you* …That's an odd thing to say."; r.opinion_change = -3; r.gossip = `The newcomer said something odd about ${s.match(INCRIMINATING)[0]}.`; }
  return r;
}

// ---------- doing things ----------
function applyTownAction(n, a, ctx={}){
  if (!a || typeof a!=="object") return "";
  const pl = T.player, type = String(a.type||"").toLowerCase().replace(/[\s-]/g,"_");
  const item = typeof a.item==="string" ? a.item.trim().toLowerCase() : "";
  const mins = clamp(Math.round(Number(a.minutes)||60), 10, 1440);
  const findIn = (inv, name) => inv.find(x=>x.toLowerCase()===name);
  const self = !!ctx.self, tgtId = resolveWhoT(a.target);
  switch (type){
    case "give_item": {
      const it = findIn(n.inv, item); if (!it) return "";
      n.inv.splice(n.inv.indexOf(it),1);
      if (ctx.to){ ctx.to.inv.push(it); return ""; }
      addItemT(it); logLineT(n, "e", `${n.first} gives you the ${it}.`); toast(`${n.first} gave you: ${it}`, "good", 4);
      return `${n.first} gave you the ${it}.`;
    }
    case "give_money": case "lend_money": {
      const amt = clamp(Math.round(Number(a.amount)||10), 1, Math.max(0, Math.round(n.money)));
      if (!amt) return "";
      n.money -= amt; if (ctx.to){ ctx.to.money += amt; return ""; }
      addMoney(amt, `from ${n.first}`); logLineT(n, "e", `${n.first} hands you $${amt}.`);
      rememberT(n, `I gave the newcomer $${amt}${type==="lend_money"?" as a loan. They owe me.":"."}`);
      if (type==="lend_money") T.debts.push({who:n.id, amount:amt, day:T.day});
      return `${n.first} gave you $${amt}.`;
    }
    case "trade_offer": {
      const norm = v => (Array.isArray(v) ? v : v ? [v] : []).map(x=>String(x).trim().toLowerCase()).filter(Boolean);
      const pool1 = n.inv.slice(), give = []; for (const g of norm(a.give)){ const it = findIn(pool1, g); if (it){ give.push(it); pool1.splice(pool1.indexOf(it),1); } }
      const pool2 = pl.inv.slice(), want = []; for (const w of norm(a.want)){ const it = findIn(pool2, w); if (it){ want.push(it); pool2.splice(pool2.indexOf(it),1); } }
      const gm = clamp(Math.round(Number(a.give_money)||0), 0, Math.round(n.money)), wm = clamp(Math.round(Number(a.want_money)||0), 0, 9999);
      if (!give.length && !want.length && !gm && !wm) return "";
      TD.offer = {npc:n.id, give, want, giveMoney:gm, wantMoney:wm}; renderOfferT(); sfx("quest");
      return "";
    }
    case "invite": case "meet": {
      const kind = String(a.activity||a.kind||"meet").toLowerCase().replace(/^drink$/,"drinks");
      const place = resolvePlaceT(a.place, n) || {darts:"bar",cards:"bar",drinks:"bar",fishing:"pond",dinner:"diner",dance:"barn",arcade:"arcade",walk:"park",church:"church",visit:n.home}[kind] || "square";
      let hr = Math.round(Number(a.hour)); if (!isFinite(hr)) hr = Math.min(22, hourNow()+2);
      hr = clamp(hr, 0, 23);
      let day = T.day; if (hr*60 <= T.t + 20) day += 1;
      const at = day*1440 + hr*60;
      if (T.appts.some(x=>x.who===n.id && x.status==="pending" && Math.abs(x.at-at) < 120)) return "";
      const kindWord = {dinner:"date", dance:"date", walk:"date"}[kind] && (n.partner || n.opinion >= 40) ? "date" : kind;
      const ap = {id:Math.random().toString(36).slice(2,8), who:n.id, kind:kindWord, activity:kind, place, at, status:"pending", made:absT()};
      T.appts.push(ap); sfx("quest");
      rememberT(n, `I made plans with the newcomer: ${apptText(ap)}.`);
      return `Plans: ${n.first}, ${apptText(ap)}. (J → Plans & favors)`;
    }
    case "follow": n.order = {type:"follow", until:absT()+Math.min(mins,240)}; rememberT(n, "I agreed to stick with the newcomer for a while."); return `${n.first} is walking with you.`;
    case "go_to": {
      const place = resolvePlaceT(a.place, n); if (!place) return "";
      n.order = {type:"go_to", place, until:absT()+Math.min(mins,240)}; return self ? "" : `${n.first} is heading to ${placeName(place)}.`;
    }
    case "let_in": {
      const bd = bById(n.home) || null; const door = bd ? bd.door.join(",") : n.home==="roomA" ? "78,22" : n.home==="roomB" ? "83,22" : n.home==="barback" ? "13,42" : null;
      if (!door) return "";
      T.unlocked[door] = absT() + Math.min(mins, 600); rememberT(n, "I left my door unlocked for the newcomer.");
      return `${n.first} left their front door unlocked for you.`;
    }
    case "distract": {
      if (!tgtId || tgtId==="player" || tgtId===n.id) return "";
      n.order = {type:"distract", target:tgtId, until:absT()+90};
      return `${n.first} is going to keep ${nmT(tgtId)} busy.`;
    }
    case "attack": {
      if (!tgtId || tgtId===n.id) return "";
      if (tgtId!=="player" && !alive(byIdT(tgtId))) return "";
      n.order = {type:"attack", target:tgtId, until:absT()+120};
      rememberT(n, `I decided to go after ${tgtId==="player"?"the newcomer":nmT(tgtId)}.`);
      if (tgtId==="player" && !self){ sayT(n, pick(["You asked for it.","That's it!","Put 'em up!"]), 2.5); setTimeout(()=>closeTalkT(), 1400); return ""; }
      return self ? "" : `${n.first} is going after ${nmT(tgtId)}.`;
    }
    case "steal": {
      if (!tgtId || tgtId==="player" || tgtId===n.id) return "";
      n.order = {type:"steal", target:tgtId, item:a.item, self, until:absT()+200};
      return self ? "" : `${n.first} is going to sneak into ${nmT(tgtId)}'s place for you.`;
    }
    case "fetch": { if (!item) return ""; n.order = {type:"fetch", item, self, until:absT()+200}; return self ? "" : `${n.first} went to find ${item}.`; }
    case "deliver": {
      const it = findIn(n.inv, item); if (!it || !tgtId) return "";
      n.order = {type:"deliver", item:it, target:tgtId, from:!self, until:absT()+200};
      return self ? "" : `${n.first} will take the ${it} to ${tgtId==="player"?"you":nmT(tgtId)}.`;
    }
    case "spread_rumor": {
      const text = String(a.text||"").slice(0,180); if (!tgtId || !text) return "";
      const victim = tgtId==="player" ? "the newcomer" : nmT(tgtId);
      for (const o of folk) if (o!==n && alive(o) && Math.random()<.45){ rememberT(o, `Rumor from ${n.first}: ${text}`); if (tgtId!=="player") relAddT(o.id, tgtId, -6); else o.opinion = clamp(o.opinion-4,-100,100); }
      if (tgtId==="player") T.notoriety = clamp(T.notoriety+6,0,100);
      newsT(`A rumor about ${victim} is going around town.`, [n.id]);
      return self ? "" : `${n.first} is spreading the word about ${victim}.`;
    }
    case "offer_task": return offerFavorT(n, {item, target:tgtId, reward:Number(a.reward)||0, quiet:true});
    case "tell_secret": {
      const text = String(a.text||n.secret).slice(0,200);
      T.secrets.push({who:n.id, text, s:stampT()}); rememberT(n, "I told the newcomer a secret. I hope I can trust them.");
      n.trust = clamp(n.trust+3,0,100); sfx("memo");
      return `Secret noted in your journal.`;
    }
    case "warn": {
      const text = String(a.text||"").slice(0,200); if (!text) return "";
      T.warnings.push({who:n.id, text, s:stampT()}); if (n.warn) n.warn.told = true;
      return `${n.first}'s warning noted in your journal.`;
    }
    case "cover_for": n.coverFor = absT() + Math.min(mins, 2880); rememberT(n, "I promised to cover for the newcomer if anyone asks."); return `${n.first} will cover for you.`;
    case "become_partner": {
      if (n.teen || n.opinion < 35) return "";
      for (const o of folk) if (o.partner && o!==n){ o.partner = false; o.opinion = clamp(o.opinion-40,-100,100); rememberT(o, `The newcomer threw me over for ${n.first}.`); gossipT(o, `The newcomer broke my heart. Took up with ${n.first}.`); }
      n.partner = true; n.trust = clamp(n.trust+10,0,100); n.opinion = clamp(n.opinion+10,-100,100);
      rememberT(n, "The newcomer and I are together now. Sweethearts.");
      sfx("fanfare"); emoteT(n, "♥", 3);
      newsT(`${n.first} and the newcomer are an item.`, [n.id]);
      if (n.spouse && alive(byIdT(n.spouse))){ const sp = byIdT(n.spouse); rememberT(sp, "I think my spouse is seeing the newcomer."); sp.opinion = clamp(sp.opinion-25,-100,100); }
      if (isDet(n)) addEvidence("I'm romantically involved with the suspect. Close enough to see everything.", 5, "partner");
      return `♥ You and ${n.first} are sweethearts now.`;
    }
    case "break_up": {
      if (!n.partner) return "";
      n.partner = false; n.opinion = clamp(n.opinion-30,-100,100); n.trust = clamp(n.trust-25,0,100);
      rememberT(n, "The newcomer and I are over."); gossipT(n, "Me and the newcomer? Done. Don't ask."); sfx("sad");
      return `${n.first} ended things with you.`;
    }
    case "report": {
      if (n.sheriff) return "";
      const text = String(a.text || (ctx.said ? `The newcomer told me: "${ctx.said.slice(0,120)}"` : "The newcomer is up to something.")).slice(0,200);
      n.order = {type:"report", what:"talk", about:"player", text, until:absT()+150};
      addEvidenceVia(n, `${n.first} went to the sheriff: ${text}`, INCRIMINATING.test(text) ? 12 : 5);
      return "";
    }
    case "arrest": {
      if (n.sheriff){ if (T.notoriety >= 30 || INCRIMINATING.test(ctx.said||"")){ setTimeout(()=>{ if (T && !T.lock) jailT(String(a.reason||"disturbing the peace").slice(0,60)); }, 1200); return "The sheriff is taking you in."; } return ""; }
      if (isDet(n) && T.det.suspicion >= 85){ setTimeout(()=>{ if (T && !T.lock) arrestSequence(`${n.first} dropped the act.`); }, 1200); return ""; }
      return "";
    }
    case "fine": {
      if (!n.sheriff) return "";
      const amt = clamp(Math.round(Number(a.amount)||10), 1, 50); addMoney(-Math.min(T.money, amt), "Fine"); return "";
    }
    case "search": {
      if (!n.sheriff && !isDet(n)) return "";
      setTimeout(()=>{ if (T && T.talkId===n.id) patDownT(n); }, 700); return "";
    }
    case "close_case": {
      if (!isDet(n) || T.det.suspicion > 45) return "";
      setTimeout(()=>{ if (T && !T.ending) ending("bluff"); }, 3500);
      return "";
    }
    case "other": {
      const text = String(a.text||"").slice(0,160); if (!text) return "";
      if (!self) toast(`${n.first}: ${text}`, "news", 4);
      rememberT(n, `I ${text.replace(/^(i |they |he |she )/i,"")}`);
      return "";
    }
  }
  return "";
}
function patDownT(n){
  const pl = T.player, bad = pl.inv.filter(isEvidence);
  logLineT(n, "e", `${n.first} pats down your pockets.`); sfx("cut");
  if (!bad.length){ startTypeT(pick(["*pats you down* Clean. Hm.","Nothing. Well. Can't blame a person for being careful."]), n); if (isDet(n)) addEvidence("Patted them down. Nothing.", -4, "search"); return; }
  const it = bad[0];
  startTypeT(`*pulls out the ${it}* And what's this?`, n);
  if (isDet(n)) addEvidence(`Found a ${it} in the newcomer's pockets.`, PRISON_TELLTALE.has(it) ? 30 : 15, "search");
  if (n.sheriff){ pl.inv.splice(pl.inv.indexOf(it),1); toast(`The sheriff took your ${it}.`, "bad", 4); addEvidenceVia(n, `The sheriff confiscated a ${it} from the newcomer.`, 12); }
  renderHotbarT();
}

// ---------- trade offers made in conversation ----------
function renderOfferT(){
  const el = $("tdOffer"); if (!el) return; el.textContent = "";
  if (!TD.offer){ el.hidden = true; return; }
  el.hidden = false;
  const o = TD.offer, n = byIdT(o.npc);
  const list = (items, money) => { const w = document.createElement("span"); w.className = "its"; const g = {}; items.forEach(i=>g[i]=(g[i]||0)+1); for (const k in g){ const im = new Image(); im.src = iconOfT(k); im.alt = ""; w.append(im, `${k}${g[k]>1?" ×"+g[k]:""} `); } if (money) w.append(`$${money} `); if (!items.length && !money) w.append("nothing"); return w; };
  el.append(Object.assign(document.createElement("b"),{textContent:`${n.first.toUpperCase()} OFFERS`}), list(o.give, o.giveMoney), Object.assign(document.createElement("b"),{textContent:"FOR YOUR"}), list(o.want, o.wantMoney));
  const sp = document.createElement("span"); sp.className = "sp";
  const yes = Object.assign(document.createElement("button"),{type:"button",className:"pbtn go",textContent:"Accept"}); yes.addEventListener("click", acceptOfferT);
  const no = Object.assign(document.createElement("button"),{type:"button",className:"pbtn",textContent:"Decline"}); no.addEventListener("click", declineOfferT);
  sp.append(yes, no); el.append(sp);
}
function hasAllT(inv, list){ const pool = inv.slice(); for (const it of list){ const i = pool.indexOf(it); if (i<0) return false; pool.splice(i,1); } return true; }
function acceptOfferT(){
  const o = TD.offer; if (!o) return; const n = byIdT(o.npc), pl = T.player;
  if (!hasAllT(n.inv, o.give) || !hasAllT(pl.inv, o.want) || n.money < o.giveMoney){ toast("That deal doesn't add up anymore.", "bad"); TD.offer = null; renderOfferT(); return; }
  if (T.money < o.wantMoney){ toast(`You don't have $${o.wantMoney}.`, "bad"); sfx("nope"); return; }
  const after = pl.inv.slice(); for (const it of o.want) after.splice(after.indexOf(it),1); after.push(...o.give);
  if (slotsT(after).length > CAP){ toast("Your pockets can't hold all that.", "bad"); return; }
  for (const it of o.want){ pl.inv.splice(pl.inv.indexOf(it),1); n.inv.push(it); }
  for (const it of o.give){ n.inv.splice(n.inv.indexOf(it),1); pl.inv.push(it); }
  if (o.wantMoney){ T.money -= o.wantMoney; n.money += o.wantMoney; }
  if (o.giveMoney){ n.money -= o.giveMoney; T.money += o.giveMoney; }
  for (const it of o.want) checkFavorOnGiveT(n, it);
  n.trust = clamp(n.trust+3,0,100); n.opinion = clamp(n.opinion+3,-100,100);
  const mine = o.give.concat(o.giveMoney ? [`$${o.giveMoney}`] : []), theirs = o.want.concat(o.wantMoney ? [`$${o.wantMoney}`] : []);
  logLineT(n, "e", `Deal: you got ${mine.join(", ")||"nothing"} for ${theirs.join(", ")||"nothing"}.`);
  rememberT(n, `Made a deal with the newcomer: my ${mine.join(", ")||"nothing"} for their ${theirs.join(", ")||"nothing"}.`);
  if (o.want.some(isEvidence)){ rememberT(n, `The newcomer sold me a ${o.want.find(isEvidence)}. Where'd they get that?`); if (isDet(n)) addEvidence(`Bought a ${o.want.find(isEvidence)} off the newcomer.`, 15, "trade"); }
  sfx("deal"); emoteT(n,"♥"); TD.offer = null; renderOfferT(); renderGiveT(); renderTStats(n); renderHotbarT();
  startTypeT(pick(["Pleasure doing business.","Deal.","Nice doing business with you.","You drive a fair bargain."]), n);
  T.stats.trades++; saveT();
}
function declineOfferT(){
  const o = TD.offer; if (!o) return; const n = byIdT(o.npc);
  logLineT(n, "e", "You turned down their offer."); n.opinion = clamp(n.opinion-1,-100,100);
  TD.offer = null; renderOfferT(); sfx("nope");
}

// ---------- favors ----------
function offerFavorT(n, opt={}){
  if (favorFor(n)){ if (!opt.quiet) startTypeT(`Still waiting on that thing: ${favorFor(n).text.toLowerCase()}`, n); return ""; }
  const others = folk.filter(o=>alive(o) && o!==n && !o.away);
  let f = null;
  const reward = clamp(Math.round(opt.reward || 8 + Math.random()*22), 3, 150);
  if (opt.item && !opt.target) f = {type:"fetch", item:opt.item, text:`Bring ${n.first} ${artT(opt.item)} ${opt.item}.`};
  else if (opt.target && opt.target!=="player"){ const t = byIdT(opt.target); f = opt.item ? {type:"deliver", item:opt.item, to:t.id, text:`Take a ${opt.item} to ${t.first}.`} : {type:"visit", to:t.id, text:`Go talk to ${t.first} for ${n.first}.`}; }
  else {
    const r = Math.random(), friend = bestFriendT(n), rival = others.find(o=>relGetT(n.id,o.id) <= -25);
    if (r < .3){ const it = pick(n.likes.filter(x=>TITEMS[x])) || "coffee"; f = {type:"fetch", item:it, text:`Bring ${n.first} ${artT(it)} ${it}.`}; }
    else if (r < .45 && n.hobbies.includes("fishing")){ f = {type:"fetch", item:pick(["bass","trout","catfish"]), text:""}; f.text = `Catch ${n.first} ${artT(f.item)} ${f.item}.`; }
    else if (r < .65 && friend){ const it = pick(["flowers","letter","apple pie","record","book"]); f = {type:"deliver", item:it, to:friend.id, text:`Take ${it==="letter"?"a letter":"some "+it} to ${friend.first}.`, giveNow: it==="letter"}; }
    else if (r < .8 && rival){ f = {type:"visit", to:rival.id, text:`Go tell ${rival.first} that ${n.first} wants to make peace.`, peace:true}; }
    else if (r < .9){ const t = pick(others); f = {type:"visit", to:t.id, text:`Find out what ${t.first} has been up to.`}; }
    else { const it = pick(["newspaper","coffee","donut","bleach","rope","matches","flowers"]); f = {type:"fetch", item:it, text:`Pick up ${it} for ${n.first}.`}; }
  }
  if (f.type==="deliver" && (f.giveNow || !T.player.inv.includes(f.item))){
    if (f.giveNow || f.item==="letter"){ if (!canAddT(T.player.inv, f.item)){ if (!opt.quiet) startTypeT("Your pockets are full. Come back when you've room.", n); return ""; } addItemT(f.item==="letter" ? "letter" : f.item, true); f.handed = true; }
  }
  const t = Object.assign({id:Math.random().toString(36).slice(2,8), giver:n.id, status:"active", day:T.day, reward}, f);
  T.tasks.push(t); sfx("quest"); renderHotbarT();
  rememberT(n, `I asked the newcomer for a favor: ${t.text} I offered $${reward}.`);
  if (!opt.quiet){ startTypeT(`Would you ${t.text.charAt(0).toLowerCase()+t.text.slice(1).replace(/\.$/,"")}? There's $${reward} in it.${f.handed ? " *hands you a sealed letter*" : ""}`, n); logLineT(n, "n", TD.full); }
  return `New favor: ${t.text} ($${reward})`;
}
function payFavorT(t, n){
  t.status = "done";
  const amt = Math.min(t.reward, Math.max(5, Math.round(n.money)));
  n.money = Math.max(0, n.money - amt); addMoney(amt, `${n.first}'s favor`);
  n.trust = clamp(n.trust+12,0,100); n.opinion = clamp(n.opinion+8,-100,100);
  rememberT(n, `The newcomer came through on the favor (${t.text}). Paid them $${amt}.`);
  logLineT(n, "e", `${n.first} pays you $${amt}.`); sfx("quest"); emoteT(n,"♥");
  T.stats.favors++; gossipT(n, "The newcomer's reliable. Did me a real favor.");
}
function checkFavorOnGiveT(n, item){
  for (const t of T.tasks){
    if (t.status!=="active") continue;
    if (t.type==="fetch" && t.giver===n.id && item.toLowerCase()===t.item.toLowerCase()){ t.status = "ready"; setTimeout(()=>{ if (T.talkId===n.id) payFavorT(t, n); }, 200); return true; }
    if (t.type==="deliver" && t.to===n.id && item.toLowerCase()===t.item.toLowerCase()){
      t.status = "ready"; const g = byIdT(t.giver); relAddT(g.id, n.id, t.item==="letter" ? 8 : 5);
      rememberT(n, `The newcomer brought me ${t.item} from ${g.first}.`); toast(`Delivered. Go see ${g.first} to get paid.`, "good", 4);
      if (t.item==="letter" && g.secretAbout===n.id && /love|affair/.test(g.secret)){ rememberT(n, `${g.first} sent me a love letter.`); relAddT(g.id, n.id, 15); }
      return true;
    }
  }
  return false;
}
function checkVisitFavorT(n){
  for (const t of T.tasks){
    if (t.status!=="active" || t.type!=="visit" || t.to!==n.id) continue;
    t.status = "ready"; const g = byIdT(t.giver);
    if (t.peace) relAddT(g.id, n.id, 15);
    rememberT(n, `The newcomer came by on behalf of ${g.first}.`);
    toast(`Done. Go back to ${g.first}.`, "good", 4);
  }
}
