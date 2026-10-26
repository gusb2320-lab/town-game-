// Town UI: on-screen readouts, hotbar, pockets, containers, bodies, journal, map and menu. Same 8-bit look as the prison.
const TCSS = `
body.in-town .game > .hud, body.in-town #hotbar, body.in-town #dialog, body.in-town #pad, body.in-town #aBtn, body.in-town #fBtn{display:none!important}
body:not(.in-town) .town-only{display:none!important}
.thud{position:absolute;top:max(12px,env(safe-area-inset-top,0px));left:max(16px,env(safe-area-inset-left,0px));right:max(16px,env(safe-area-inset-right,0px));display:flex;justify-content:space-between;align-items:flex-start;gap:10px;pointer-events:none}
.thud>*{pointer-events:auto}
.thud .place{font-size:20px;color:var(--y);margin-top:4px}
.thud .money{font-family:var(--px);font-size:11px;color:var(--g)}
.rumor{display:flex;align-items:center;gap:10px}
.eye{font-family:var(--px);font-size:9px;color:var(--r);display:flex;align-items:center;gap:8px;padding:6px 10px}
.eye canvas{width:24px;height:12px;image-rendering:pixelated}
.eye.faint{opacity:.45}
.tpad{position:absolute;left:max(16px,env(safe-area-inset-left,0px));bottom:max(16px,env(safe-area-inset-bottom,0px));display:none;grid-template-columns:repeat(3,50px);grid-template-rows:repeat(3,50px);gap:4px}
.tpad button{background:rgba(26,28,44,.75);border:3px solid var(--k);box-shadow:inset 0 0 0 3px var(--d);font-family:var(--px);font-size:12px;touch-action:none}
.tpad .u{grid-area:1/2}.tpad .l{grid-area:2/1}.tpad .r{grid-area:2/3}.tpad .dn{grid-area:3/2}
body.touch.in-town .tpad{display:grid}
body.touch.in-town #taBtn, body.touch.in-town #tfBtn{display:block}
body.talking #tpad, body.talking #taBtn, body.talking #tfBtn, body.talking #tHotbar{display:none!important}
body.touch #tHotbar{bottom:auto;top:calc(max(12px,env(safe-area-inset-top,0px)) + 110px)}
#tgCv{width:min(640px,100%);aspect-ratio:320/200;image-rendering:pixelated;background:#0d0e18;display:block;margin:0 auto;touch-action:none}
.tscreen{position:absolute;inset:0;background:#0d0e18;display:flex;align-items:center;justify-content:flex-start;flex-direction:column;gap:14px;padding:max(16px,env(safe-area-inset-top,0px)) 16px;overflow-y:auto}
.tscreen>:first-child{margin-top:auto}.tscreen>:last-child{margin-bottom:auto}
.tscreen canvas{width:min(960px,100%);aspect-ratio:16/9;image-rendering:pixelated;background:#000}
.tscreen .cap{font-size:24px;max-width:60ch;text-align:center;min-height:2.4em}
.tscreen .cap em{color:var(--y);font-style:normal}
.ending{width:min(720px,100%);display:flex;flex-direction:column;gap:14px;margin:auto}
.ending .note2{background:var(--paper);color:var(--ink);padding:12px 14px;border:4px solid var(--k);box-shadow:inset 0 0 0 4px var(--paper2);font-size:20px;display:flex;flex-direction:column;gap:4px;max-height:40vh;overflow-y:auto}
.ending .note2 b{font-family:var(--px);font-size:9px;color:#6b5a48}
.clue{background:var(--k);padding:6px 10px;font-size:19px;display:flex;gap:10px;align-items:baseline}
.clue small{color:var(--m);font-size:16px;white-space:nowrap}
.suspect{display:grid;grid-template-columns:28px 1fr auto;gap:8px;align-items:center;background:var(--k);padding:4px 8px}
.suspect canvas{width:24px;height:30px;image-rendering:pixelated}
.suspect .tl{display:flex;gap:4px;flex-wrap:wrap}
.suspect .tl span{font-size:15px;padding:0 6px;background:var(--d)}
.suspect .tl span.hit{background:var(--r)}
.gz{background:var(--paper);color:var(--ink);padding:12px 14px;border:4px solid var(--k);display:flex;flex-direction:column;gap:6px}
.gz h4{font-family:var(--px);font-size:11px;margin:0;line-height:1.5}
.gz small{color:#6b5a48;font-size:16px}
.gz p{margin:0;font-size:19px}
#tmCv{width:100%;image-rendering:pixelated;background:#0d0e18}
.tsk{background:var(--k);padding:6px 10px;font-size:19px;display:flex;justify-content:space-between;gap:10px}
.tsk.ready{box-shadow:inset 3px 0 0 var(--g)} .tsk.done{opacity:.5}
`;
function buildTownDom(){
  const st = document.createElement("style"); st.textContent = TCSS; document.head.append(st);
  const game = $("game");
  const html = `
  <div class="thud town-only" id="tHud" hidden>
    <div class="left">
      <div class="clock px"><canvas id="tSun" width="12" height="12"></canvas><div><div class="day" id="tDay">MONDAY · DAY 1</div><div class="time" id="tClock">08:00</div><div class="place" id="tPlace">Main Street</div></div></div>
      <div class="hp px"><span>HP</span><div class="bar"><i id="tHp"></i></div><em id="tWeapon">Fists</em></div>
      <div class="px money" id="tMoney">$40</div>
      <div class="favors px" id="tPlans" hidden></div>
    </div>
    <div class="right">
      <div class="heat px rumor" title="How much the town is whispering about you"><span class="lbl">Rumors</span><div class="segs" id="tRumor"></div></div>
      <div class="eye px" id="tEye" hidden title="Someone is watching you"><canvas id="tEyeCv" width="12" height="6"></canvas><span id="tEyeTxt">WATCHED</span></div>
      <div class="icons">
        <span class="ai" id="tAi"><i></i><span>…</span></span>
        <button class="ib" id="tInvBtn" type="button" title="Pockets (I)">I</button>
        <button class="ib" id="tJBtn" type="button" title="Journal (J)">J</button>
        <button class="ib" id="tMapBtn" type="button" title="Map (Tab)">▦</button>
        <button class="ib" id="tMusicBtn" type="button" title="Music (N)">♫</button>
        <button class="ib" id="tMuteBtn" type="button" title="Sound (M)">♪</button>
        <button class="ib" id="tMenuBtn" type="button" title="Menu (Esc)">≡</button>
      </div>
    </div>
  </div>
  <div class="hotbar town-only" id="tHotbar" hidden></div>
  <div class="dialog" id="tDialog" hidden>
    <div class="nametag" id="tdName">NAME</div>
    <div class="dstats" id="tdStats"></div>
    <div class="youline" id="tdYou"></div>
    <div class="dtext" id="tdText"></div>
    <div class="dmem" id="tdMem"></div>
    <div class="offer" id="tdOffer" hidden></div>
    <form class="dform" id="tdForm" autocomplete="off"><span>▶</span><input id="tdInput" maxlength="300" placeholder="Say anything. Ask them anything, invite them, flirt, lie…" aria-label="What you say"><button class="pbtn hot" id="tdSend" type="submit">Say</button></form>
    <div class="drow">
      <button class="pbtn" id="tdGive" type="button">Give</button>
      <button class="pbtn" id="tdTrade" type="button">Trade</button>
      <button class="pbtn" id="tdPay" type="button">Pay $5</button>
      <button class="pbtn" id="tdFavor" type="button">Favor?</button>
      <button class="pbtn" id="tdAccuse" type="button" title="Accuse them of being the undercover detective">Accuse</button>
      <button class="pbtn" id="tdLog" type="button">File</button>
      <button class="pbtn sp" id="tdLeave" type="button">Bye (Esc)</button>
    </div>
  </div>
  <div class="win" id="tWinInv" hidden><div class="wbox" style="width:min(640px,100%)">
    <div class="whead"><h2>Pockets</h2><button class="pbtn" data-tclose type="button">Close</button></div>
    <div class="wbody"><div class="invwrap"><div style="display:flex;flex-direction:column;gap:8px"><span class="lbl">Pockets · 6 slots</span><div class="invgrid" id="tiGrid"></div><span class="lbl">Wearing</span><div id="tiWear" class="note"></div></div><div class="idetail" id="tiDetail"></div></div></div>
  </div></div>
  <div class="win" id="tWinBox" hidden><div class="wbox">
    <div class="whead"><h2 id="tbTitle">Box</h2><button class="pbtn" data-tclose type="button">Close</button></div>
    <div class="wbody"><div id="tbExtra"></div><div class="cols"><div><span class="lbl" id="tbLbl">Inside</span><div class="grid6" id="tbSlots"></div></div><div><span class="lbl">Your pockets</span><div class="grid6" id="tbPockets"></div></div></div><p class="note" id="tbNote">Click to move one item. Shift-click moves the stack.</p></div>
  </div></div>
  <div class="win" id="tWinTrade" hidden><div class="wbox">
    <div class="whead"><h2 id="ttTitle">Trade</h2><button class="pbtn" data-tclose type="button">Close</button></div>
    <div class="wbody">
      <div class="cols"><div><span class="lbl" id="ttTheirLbl">They have</span><div class="grid6" id="ttTheirs"></div></div><div><span class="lbl">You have</span><div class="grid6" id="ttMine"></div></div></div>
      <div class="row"><span class="lbl">Cash</span><button class="pbtn" id="ttLess" type="button">−$5</button><span id="ttCash" style="min-width:12ch;text-align:center">$0</span><button class="pbtn" id="ttMore" type="button">+$5</button></div>
      <div><span class="lbl">Will they take it?</span><div class="meter" style="margin-top:8px"><i id="ttMeter"></i></div></div>
      <p class="note" id="ttNote"></p>
      <div class="row"><button class="bigbtn" id="ttGo" type="button">Offer deal</button></div>
    </div>
  </div></div>
  <div class="win" id="tWinShop" hidden><div class="wbox">
    <div class="whead"><h2 id="tsTitle">Shop</h2><div class="tabs2" id="tsTabs"></div><button class="pbtn" data-tclose type="button">Close</button></div>
    <div class="wbody" id="tsBody"></div>
  </div></div>
  <div class="win" id="tWinGame" hidden><div class="wbox" style="width:min(700px,100%)">
    <div class="whead"><h2 id="tgTitle">Game</h2><button class="pbtn" id="tgClose" type="button">Close</button></div>
    <div class="wbody"><canvas id="tgCv" width="320" height="200"></canvas><p class="note" id="tgInfo"></p><div class="row" id="tgBtns"></div></div>
  </div></div>
  <div class="win" id="tWinJournal" hidden><div class="wbox" style="width:min(940px,100%)">
    <div class="whead"><h2>Journal</h2><div class="tabs2" id="tjTabs"></div><button class="pbtn" data-tclose type="button">Close</button></div>
    <div class="wbody" id="tjBody"></div>
  </div></div>
  <div class="win" id="tWinMap" hidden><div class="wbox" style="width:min(980px,100%)">
    <div class="whead"><h2>Millbrook</h2><button class="pbtn" data-tclose type="button">Close</button></div>
    <div class="wbody"><canvas id="tmCv"></canvas><p class="note" id="tmNote"></p></div>
  </div></div>
  <div class="win" id="tWinRead" hidden><div class="wbox" style="width:min(560px,100%)">
    <div class="whead"><h2 id="trTitle">Note</h2><button class="pbtn" data-tclose type="button">Close</button></div>
    <div class="wbody"><div class="gz" id="trBody"></div></div>
  </div></div>
  <div class="win" id="tWinMenu" hidden><div class="wbox" style="width:min(520px,100%)">
    <div class="whead"><h2>Paused · Millbrook</h2></div>
    <div class="wbody">
      <div class="opts">
        <label><input type="checkbox" id="toptMusic" checked> Music</label>
        <label><input type="checkbox" id="toptScenes" checked> Neighbors talk to each other with Claude when you're nearby</label>
        <label><input type="checkbox" id="toptApproach" checked> People walk up and start conversations</label>
        <label><input type="checkbox" id="toptDet" checked> The detective plans their moves with Claude</label>
        <label><input type="checkbox" id="toptEvents" checked> Claude writes the morning Gazette</label>
        <label><input type="checkbox" id="toptDeep"> People think longer before answering (slower)</label>
      </div>
      <div class="keys"><b>WASD</b><span>walk</span><b>E</b><span>talk, use, pick up, hide a body</span><b>F</b><span>fight (with the selected weapon)</span><b>Q</b><span>drop a body you're carrying</span><b>1-6</b><span>pick a pocket slot (again to use it)</span><b>I · J · TAB</b><span>pockets · journal · map</span></div>
      <div class="row"><button class="bigbtn" id="tResume" type="button">Resume</button><button class="bigbtn alt" id="tQuit" type="button">Title screen</button></div>
      <p class="note">The town saves itself as you play.</p>
    </div>
  </div></div>
  <div class="tpad" id="tpad"><button class="u" data-d="up" type="button">▲</button><button class="l" data-d="left" type="button">◀</button><button class="r" data-d="right" type="button">▶</button><button class="dn" data-d="down" type="button">▼</button></div>
  <button class="fbtn" id="tfBtn" type="button" aria-label="Fight" style="display:none">HIT</button>
  <button class="abtn" id="taBtn" type="button" aria-label="Interact" style="display:none">A</button>
  <div class="tscreen" id="tScreen" hidden></div>`;
  game.insertAdjacentHTML("beforeend", html);
  for (let i=0;i<10;i++) $("tRumor").append(document.createElement("i"));
}
const TWINS = ["tWinInv","tWinBox","tWinTrade","tWinShop","tWinGame","tWinJournal","tWinMap","tWinRead","tWinMenu"];
const anyTWindow = () => TWINS.some(id=>!$(id).hidden) || !$("tScreen").hidden;
function closeTWindows(){
  const was = TWINS.some(id=>!$(id).hidden), tr = !$("tWinTrade").hidden;
  if (GAME) closeGame();
  for (const id of TWINS) $(id).hidden = true;
  if (T) T.openBox = null;
  if (tr && T && T.talkId) $("tDialog").hidden = false;
  if (was) sfx("close");
}

// ---------- helpers ----------
const facingT = () => { const pl = T.player; return [pl.x+pl.dir[0], pl.y+pl.dir[1]]; };
function nearestFolk(maxd=1.6){ let best = null, bd = maxd; for (const n of folk){ if (!alive(n) || n.away || n.hidden) continue; const d = distT(n, T.player); if (d <= bd){ bd = d; best = n; } } return best; }
function addItemT(it, quiet){
  const pl = T.player;
  if (!canAddT(pl.inv, it)){ toast(`No room for the ${it}. Your pockets are full.`, "bad", 3); return false; }
  pl.inv.push(it); if (!quiet){ sfx("pickup"); toast(`Got: ${it}`, "good", 2.2); }
  renderHotbarT(); return true;
}
function removeItemT(it){ const pl = T.player, i = pl.inv.lastIndexOf(it); if (i<0) return false; pl.inv.splice(i,1); if (!pl.inv.includes(T.sel)) T.sel = null; if (it==="prison jumpsuit" && !pl.inv.includes(it)) pl.wearJumpsuit = false; for (const k of ["hat","glasses","shades"]) if (pl.disguise[k]===it && !pl.inv.includes(it)) pl.disguise[k] = null; renderHotbarT(); return true; }
let tFade = null;
function fadeT(secs, mid, text){ tFade = {t:0, secs, mid, text, fired:false}; }

// ---------- HUD ----------
function renderHudT(){
  const pl = T.player;
  $("tDay").textContent = `${dayName().toUpperCase()} · DAY ${T.day}${T.event && T.event.day===T.day && T.event.label ? " · "+T.event.label : ""}`;
  $("tClock").textContent = fmtT(T.t);
  const lock = T.lock && T.lock.kind==="chase";
  $("tPlace").textContent = lock ? "RUN · lose them" : T.wanted ? "WANTED · get out of town" : (insideOf(pl)==="roomC" ? "Your room" : placeLabelAt(pl.x,pl.y)) + (T.drunk > 0 ? " · tipsy" : "") + (pl.carrying ? " · carrying a body" : "");
  $("tPlace").style.color = lock || T.wanted || pl.carrying ? "#ff6b7f" : "";
  const hp = Math.round(pl.hp); $("tHp").style.width = hp+"%"; $("tHp").className = hp < 35 ? "low" : "";
  const w = selectedWeapon(); $("tWeapon").textContent = w ? `${w} (${weaponDmg(w)})` : "Fists";
  $("tMoney").textContent = `$${Math.round(T.money)}`;
  const on = Math.ceil(T.notoriety/10);
  [...$("tRumor").children].forEach((s,i)=>{ s.className = i<on ? (T.notoriety>=60?"on hot":"on") : ""; });
  // the feeling of being watched: you never learn by whom
  const d = detP(), watched = d && detAlive() && !d.asleep && T.det.suspicion >= 25 && (d.hidden ? insideOf(d)===insideOf(pl) : canSeeT(d, pl.x, pl.y, 12)) && !(T.talkId===d.id);
  const nosy = folk.find(n=>n.nosy && alive(n) && !n.asleep && canSeeT(n, pl.x, pl.y, 8));
  const show = watched || (nosy && Math.random()<.02) || (T.eyeHold && performance.now() < T.eyeHold);
  if ((watched || nosy) && !T.eyeHold) T.eyeHold = performance.now() + 2500;
  if (T.eyeHold && performance.now() > T.eyeHold && !watched) T.eyeHold = 0;
  $("tEye").hidden = !show; $("tEye").classList.toggle("faint", !watched);
  $("tEyeTxt").textContent = watched && d.hidden ? "NOT ALONE" : watched ? "WATCHED" : "EYES ON YOU";
  if (show){ const c = $("tEyeCv").getContext("2d"); c.clearRect(0,0,12,6); c.fillStyle = PAL.w; c.fillRect(2,1,8,4); c.fillRect(1,2,10,2); c.fillStyle = PAL.r; const look = Math.floor(performance.now()/700)%3; c.fillRect(4+look,1,2,4); c.fillStyle = PAL.k; c.fillRect(5+look-1+1,2,1,2); }
  const plans = T.appts.filter(a=>a.status==="pending").sort((a,b)=>a.at-b.at).slice(0,2), favs = T.tasks.filter(t=>t.status==="active"||t.status==="ready").slice(0,2);
  const pb = $("tPlans"); pb.textContent = "";
  if (plans.length || favs.length){
    pb.hidden = false;
    if (plans.length){ pb.append(Object.assign(document.createElement("b"),{textContent:"PLANS"})); for (const a of plans) pb.append(Object.assign(document.createElement("span"),{textContent:`${fmtT(a.at)} ${nmT(a.who)} · ${a.activity} @ ${placeName(a.place).replace(/^the /i,"")}`})); }
    if (favs.length){ pb.append(Object.assign(document.createElement("b"),{textContent:"FAVORS"})); for (const t of favs) pb.append(Object.assign(document.createElement("span"),{textContent:`${t.status==="ready"?"✓ ":""}${t.text}`, className:t.status==="ready"?"ready":""})); }
  } else pb.hidden = true;
  const c = $("tSun").getContext("2d"); c.clearRect(0,0,12,12);
  if (T.t>=360 && T.t<1200){ c.fillStyle = PAL.y; c.fillRect(4,2,4,8); c.fillRect(2,4,8,4); c.fillStyle = "#fff1b8"; c.fillRect(5,4,2,2); }
  else { c.fillStyle = "#c2d3dc"; c.fillRect(4,2,5,8); c.fillRect(3,3,2,6); c.fillStyle = "#1a1c2c"; c.fillRect(6,2,3,6); }
  const ai = $("tAi"), on2 = E.aiOn(); ai.className = "ai " + (on2 ? "on" : "off"); ai.querySelector("span").textContent = on2 ? "Claude" : "Stock lines";
}

// ---------- hotbar & pockets ----------
function tItemTitle(it){ const d = itemT(it); return `${it}${isEvidence(it)?" (incriminating)":""}${d.weapon?` · weapon ${d.weapon} dmg`:""}${d.heal?` · +${d.heal} HP`:""} — ${d.desc}`; }
function tSlotEl(slot, opts={}){
  const it = slot && slot.item;
  const b = document.createElement("button"); b.type = "button";
  b.className = "slot" + (opts.sel?" sel":"") + (it && isEvidence(it)?" contra":"") + (it && weaponDmg(it)?" weapon":"") + (opts.cls?" "+opts.cls:"");
  if (opts.num) b.append(Object.assign(document.createElement("span"),{className:"num",textContent:opts.num}));
  if (it){ const im = new Image(); im.src = iconOfT(it); im.alt = it; b.append(im); b.title = opts.title || tItemTitle(it); } else b.title = "Empty";
  const badge = opts.badge || (slot && slot.count > 1 ? "×"+slot.count : null);
  if (badge) b.append(Object.assign(document.createElement("span"),{className:"cnt",textContent:badge}));
  if (opts.onclick) b.addEventListener("click", opts.onclick);
  return b;
}
function renderHotbarT(){
  if (!T || !TOWN.active) return;
  const hb = $("tHotbar"); hb.textContent = "";
  const pl = T.player, slots = slotsT(pl.inv);
  if (T.sel && !pl.inv.includes(T.sel)) T.sel = null;
  let selShown = false;
  for (let i=0;i<CAP;i++){ const s = slots[i]; const sel = s && s.item===T.sel && !selShown; if (sel) selShown = true; hb.append(tSlotEl(s, {num:String(i+1), sel, onclick:()=>selectSlotT(i)})); }
  const worn = pl.wearJumpsuit ? "prison jumpsuit" : pl.disguise.hat || pl.disguise.shades || pl.disguise.glasses;
  hb.append(tSlotEl(worn ? {item:worn, count:1} : null, {num:"WEAR", cls:"wear", onclick:()=>{ openInvT(); }}));
  const it = T.sel;
  if (it){ const d = itemT(it), n = document.createElement("div"); n.className = "selname"; n.textContent = it + (d.weapon ? " · F to fight" : d.heal || d.drink ? " · again to eat/drink" : d.wear ? " · again to wear" : d.scratch ? " · again to scratch" : d.read ? " · again to read" : ""); hb.append(n); }
  if (T.talkId) renderGiveT();
  if (!$("tWinBox").hidden) renderBoxT();
  if (!$("tWinInv").hidden) renderInvT();
  if (!$("tWinTrade").hidden) renderTradeT();
}
function selectSlotT(i){
  const s = slotsT(T.player.inv)[i];
  if (!s){ T.sel = null; renderHotbarT(); return; }
  if (T.sel===s.item && !T.talkId){ useItemT(s.item); }
  T.sel = T.player.inv.includes(s.item) ? s.item : null; sfx("select"); renderHotbarT();
}
function useItemT(it){
  const pl = T.player, d = itemT(it);
  if (d.heal){ removeItemT(it); pl.hp = Math.min(100, pl.hp + d.heal); sfx("pickup"); toast(`You eat the ${it}. +${d.heal} HP`, "good", 2); return; }
  if (d.drink){ removeItemT(it); T.drunk = Math.min(8, (T.drunk||0) + d.drink); pl.hp = Math.min(100, pl.hp+3); sfx("pickup"); toast(T.drunk >= 5 ? "The world tilts pleasantly." : "Warm all the way down.", "", 2.5); if (T.drunk >= 5){ for (const n of folk) if (alive(n) && canSeeT(n, pl.x, pl.y, 7)) rememberT(n, "Saw the newcomer stumbling drunk."); } return; }
  if (d.wear){ toggleWear(it); return; }
  if (it==="prison jumpsuit"){ pl.wearJumpsuit = !pl.wearJumpsuit; toast(pl.wearJumpsuit ? "You pull on the orange jumpsuit. Bold." : "You take the jumpsuit off.", pl.wearJumpsuit ? "bad" : "", 3); renderHotbarT(); return; }
  if (d.scratch){ scratchTicket(); return; }
  if (d.read){ readItem(it); return; }
  if (it==="matches") { burnSomething(); return; }
  toast(d.desc || it, "", 3);
}
function toggleWear(it){
  const pl = T.player, slot = itemT(it).wear;
  pl.disguise[slot] = pl.disguise[slot]===it ? null : it;
  pl.look.style = pl.disguise.hat ? "hat" : pl.baseStyle; pl.look.hatColor = "#3e2a1c";
  pl.look.glasses = pl.disguise.glasses ? true : false; pl.look.shades = !!pl.disguise.shades;
  sfx("stash"); toast(pl.disguise[slot] ? `You put on the ${it}.` : `You take off the ${it}.`, "", 2); renderHotbarT();
}
function burnSomething(){
  const pl = T.player, burnable = pl.inv.filter(i=>["prison jumpsuit","letter","creepy note","case file","wallet"].includes(i) || /'s wallet$/.test(i));
  if (!burnable.length){ toast("Nothing worth burning.", "", 2); return; }
  const it = burnable[0];
  removeItemT(it); removeItemT("matches"); sfx("craft");
  const [x,y] = rposT(pl); T.fx.push({kind:"smoke", x:x*TS+8, y:y*TS, life:4});
  toast(`The ${it} curls up in flames. Gone.`, "good", 3); T.stats.burned++;
  const wits = folk.filter(n=>alive(n) && !n.asleep && canSeeT(n, pl.x, pl.y, 8));
  for (const n of wits){ rememberT(n, `Saw the newcomer burning a ${it==="prison jumpsuit" ? "bundle of orange cloth" : it} at ${placeLabelAt(pl.x,pl.y)}.`); if (isDet(n)) addEvidence(`The newcomer burned ${it==="prison jumpsuit" ? "something ORANGE" : "a "+it}.`, it==="prison jumpsuit" ? 35 : 10, "burn"); }
}
function readItem(it){
  let title = it, body = "";
  if (it==="newspaper"){ openJournalT("gazette"); return; }
  if (it==="creepy note"){ title = "Unsigned note"; body = (T.notesText && T.notesText.length ? T.notesText[T.notesText.length-1] : "I see you.") + "\n\n(The handwriting is neat. Green ink? You can't be sure.)"; if (T.det.tells && detP() && detP().tells.includes("ink")) body = body.replace("Green ink? You can't be sure.", "Definitely green ink."); }
  else if (it==="case file"){ const d = detP(); title = "STATE BUREAU · CONFIDENTIAL"; body = `RE: Escaped inmate ${PNUMT}, Cellblock Nine.\nAgent in place under civilian cover since spring.\nAgent profile, for local liaison only: ${d ? TELLS.find(t=>t.id===d.tells[1]).habit.replace(/^is |^has /,"") : "redacted"}.\nSubject believed to be in Millbrook. Do not approach. Await agent's word.\n\n${T.det.dead ? "Agent's name: "+T.det.realName+". (A pencil note: 'Not heard from in days.')" : ""}`; T.clues.push({s:stampT(), text:`Case file: the agent ${d ? TELLS.find(t=>t.id===d.tells[1]).habit.replace(/^is |^has /,"") : "?"}`, tell: d ? d.tells[1] : null}); }
  else if (it==="letter"){ const L = T.letters[T.letters.length-1]; title = L ? `From ${L.from}` : "A sealed letter"; body = L ? L.text : "It's sealed. It isn't addressed to you. Reading it would be wrong.\n\n…It's a love letter, mostly. Underlined twice."; }
  else body = itemT(it).desc;
  $("trTitle").textContent = title; const b = $("trBody"); b.textContent = "";
  for (const p of body.split("\n")) b.append(Object.assign(document.createElement("p"),{textContent:p}));
  closeTWindows(); $("tWinRead").hidden = false; sfx("open");
}
let invSelT = null;
function openInvT(){ closeTalkT(); closeTWindows(); invSelT = T.sel || T.player.inv[0] || null; $("tWinInv").hidden = false; sfx("open"); renderInvT(); }
function renderInvT(){
  const pl = T.player, g = $("tiGrid"); g.textContent = "";
  const slots = slotsT(pl.inv);
  for (let i=0;i<CAP;i++){ const s = slots[i]; g.append(tSlotEl(s, {sel:s && s.item===invSelT, onclick: s ? ()=>{ invSelT = s.item; T.sel = s.item; sfx("select"); renderInvT(); renderHotbarT(); } : null})); }
  const wear = [pl.wearJumpsuit ? "prison jumpsuit" : null, pl.disguise.hat, pl.disguise.glasses, pl.disguise.shades].filter(Boolean);
  $("tiWear").textContent = wear.length ? wear.join(", ") : "Plain clothes";
  const d = $("tiDetail"); d.textContent = "";
  if (!invSelT || !pl.inv.includes(invSelT)){ d.append(Object.assign(document.createElement("p"),{className:"note", textContent:`Cash: $${Math.round(T.money)}. Pick an item.`})); return; }
  const it = invSelT, info = itemT(it);
  const top = document.createElement("div"); top.className = "top"; const im = new Image(); im.src = iconOfT(it); top.append(im, Object.assign(document.createElement("h3"),{textContent:it}));
  const tags = document.createElement("div"); tags.className = "tags";
  if (isEvidence(it)) tags.append(Object.assign(document.createElement("span"),{className:"c", textContent:"incriminating"}));
  if (info.weapon) tags.append(Object.assign(document.createElement("span"),{className:"w", textContent:`weapon ${info.weapon}`}));
  if (info.heal) tags.append(Object.assign(document.createElement("span"),{className:"f", textContent:`+${info.heal} HP`}));
  tags.append(Object.assign(document.createElement("span"),{textContent:`worth ~$${info.price}`}));
  const row = document.createElement("div"); row.className = "row";
  const btn = (label, fn) => { const b = Object.assign(document.createElement("button"),{type:"button", className:"pbtn", textContent:label}); b.addEventListener("click", fn); row.append(b); };
  if (info.heal || info.drink) btn(info.drink ? "Drink" : "Eat", ()=>{ useItemT(it); renderInvT(); });
  if (info.wear || it==="prison jumpsuit") btn("Wear / remove", ()=>{ useItemT(it); renderInvT(); });
  if (info.read) btn("Read", ()=>useItemT(it));
  if (info.scratch) btn("Scratch", ()=>{ useItemT(it); renderInvT(); });
  if (pl.inv.includes("matches") && ["prison jumpsuit","letter","creepy note","case file","wallet"].includes(it)) btn("Burn it", ()=>{ burnSomething(); renderInvT(); });
  if (it!=="room key") btn("Throw away", ()=>{ removeItemT(it); if (isEvidence(it)){ const [x,y] = [pl.x,pl.y]; T.litter.push({it, x, y, day:T.day}); } invSelT = null; sfx("stash"); renderInvT(); });
  d.append(top, tags, Object.assign(document.createElement("p"),{textContent:info.desc || ""}), row);
}

// ---------- containers and bodies ----------
function getBoxT(k){
  if (!k) return null;
  if (k.startsWith("body:")){ const n = byIdT(k.slice(5)); return n ? {name:`${n.first}'s pockets`, items:n.inv, body:n} : null; }
  return T.containers[k];
}
function openBoxT(k){
  const box = getBoxT(k); if (!box) return;
  closeTalkT(); closeTWindows(); T.openBox = k; $("tWinBox").hidden = false; sfx("open");
  if (!box.body && box.home && box.home!=="roomC"){
    const owner = folk.find(n=>n.home===box.home); const pl = T.player;
    const seen = folk.filter(n=>alive(n) && !n.asleep && !n.hidden && canSeeT(n, pl.x, pl.y, 6));
    for (const n of seen){ rememberT(n, `I caught the newcomer going through ${owner && owner.home===n.home ? "MY" : (owner ? owner.first+"'s" : "someone's")} ${box.name.toLowerCase()}!`); if (owner && n.home===owner.home){ sayT(n, "HEY! That's mine!", 3); n.opinion = clamp(n.opinion-25,-100,100); n.trust = clamp(n.trust-20,0,100); if (n.trust < 20 && Math.random()<.5) n.order = {type:"report", what:"theft", about:"player", until:absT()+120}; } else sayT(n, "What are you doing?", 3); T.notoriety = clamp(T.notoriety+6,0,100); if (isDet(n)) addEvidence(`Saw the newcomer rifling through ${owner ? owner.first+"'s" : "someone's"} things.`, 12, "theft"); }
  }
  renderBoxT();
}
function renderBoxT(){
  const box = getBoxT(T.openBox); if (!box){ closeTWindows(); return; }
  $("tbTitle").textContent = box.name;
  const ex = $("tbExtra"); ex.textContent = "";
  const hidden = T.bodies.find(b=>b.hidden===T.openBox && !b.discovered);
  if (box.body){
    const b = T.bodies.find(x=>x.id===box.body.id);
    const row = document.createElement("div"); row.className = "row";
    row.append(Object.assign(document.createElement("span"),{className:"note", textContent:`${box.body.first} isn't breathing.${box.body.money > 0 ? ` $${Math.round(box.body.money)} in their wallet.` : ""}`}));
    if (box.body.money > 0){ const m = Object.assign(document.createElement("button"),{type:"button", className:"pbtn", textContent:`Take $${Math.round(box.body.money)}`}); m.addEventListener("click", ()=>{ addMoney(box.body.money, "from the body"); box.body.money = 0; T.stats.looted++; renderBoxT(); }); row.append(m); }
    if (b && !b.carried){ const c = Object.assign(document.createElement("button"),{type:"button", className:"pbtn hot", textContent:"Pick up the body"}); c.addEventListener("click", ()=>{ closeTWindows(); pickUpBody(b); }); row.append(c); }
    ex.append(row);
  } else if (hidden){
    const row = document.createElement("div"); row.className = "row";
    row.append(Object.assign(document.createElement("span"),{className:"note", textContent:`${hidden.name.split(" ")[0]} is stuffed in here.`}));
    const c = Object.assign(document.createElement("button"),{type:"button", className:"pbtn hot", textContent:"Take the body out"}); c.addEventListener("click", ()=>{ if (T.player.carrying){ toast("You're already carrying someone.", "bad"); return; } hidden.hidden = null; hidden.x = T.player.x; hidden.y = T.player.y; closeTWindows(); pickUpBody(hidden); }); row.append(c);
    ex.append(row);
  }
  const bs = $("tbSlots"), ps = $("tbPockets"); bs.textContent = ""; ps.textContent = "";
  const bsl = slotsT(box.items), psl = slotsT(T.player.inv);
  for (let i=0;i<Math.max(CAP, bsl.length);i++){ const s = bsl[i]; bs.append(tSlotEl(s, {onclick: s ? (e)=>takeItemT(s.item, e.shiftKey ? s.count : 1) : null})); }
  for (let i=0;i<CAP;i++){ const s = psl[i]; ps.append(tSlotEl(s, {onclick: s && s.item!=="room key" ? (e)=>stashItemT(s.item, e.shiftKey ? s.count : 1) : null})); }
  $("tbLbl").textContent = box.mine ? "Your footlocker" : box.body ? "Their pockets" : "Inside";
}
function takeItemT(it, count=1){
  const box = getBoxT(T.openBox); if (!box) return;
  for (let i=0;i<count;i++){ const k = box.items.indexOf(it); if (k<0) break; if (!canAddT(T.player.inv, it)){ toast("Pockets full.", "bad"); break; } box.items.splice(k,1); T.player.inv.push(it);
    if (box.body && it==="case file"){ T.clues.push({s:stampT(), text:`${box.body.first} was carrying a STATE BUREAU case file. They were the detective.`}); toast(`${box.body.first} was the detective.`, "bad", 5); }
    if (box.home && box.home!=="roomC" && !box.body){ const owner = folk.find(n=>n.home===box.home); if (owner && alive(owner)){ rememberT(owner, `My ${it} went missing from my ${box.name.toLowerCase()}.`); owner.missingItems = (owner.missingItems||[]).concat(it); } T.stats.stolen++; }
  }
  sfx("pickup"); renderBoxT(); renderHotbarT();
}
function stashItemT(it, count=1){
  const box = getBoxT(T.openBox); if (!box) return;
  for (let i=0;i<count;i++){ const k = T.player.inv.indexOf(it); if (k<0) break; T.player.inv.splice(k,1); box.items.push(it); }
  if (!T.player.inv.includes(T.sel)) T.sel = null;
  if (it==="prison jumpsuit" && !T.player.inv.includes(it)) T.player.wearJumpsuit = false;
  if (box.body && isEvidence(it)){ T.planted = (T.planted||[]).concat({on:box.body.id, it}); }
  if (box.home && box.home!=="roomC" && isEvidence(it)) T.planted = (T.planted||[]).concat({home:box.home, it});
  sfx("stash"); renderBoxT(); renderHotbarT();
}

// ---------- trade window ----------
let tradeWithT = null, tGetT = [], tGiveT = [], tCash = 0;
function openTradeT(){
  const n = byIdT(T.talkId); if (!n) return;
  if (n.opinion < -30){ startTypeT("*turns away* Not doing business with you.", n); sfx("nope"); return; }
  tradeWithT = n; tGetT = []; tGiveT = []; tCash = 0;
  $("tDialog").hidden = true; $("tWinTrade").hidden = false; sfx("open"); renderTradeT();
}
function tradeCalcT(){
  const n = tradeWithT;
  const ask = tGetT.reduce((s,it)=>s+itemT(it).price,0) * (1.3 - n.trust/250 - n.opinion/500 - (n.partner?.2:0)) + Math.max(0, -tCash);
  const give = tGiveT.reduce((s,it)=>s + itemT(it).price*(n.likes.includes(it)?1.6:1)*(isEvidence(it)?.2:1),0) + Math.max(0, tCash);
  return {ask, give};
}
function pickToggleT(list, it, max){ const c = countIn(list, it); if (c < max) list.push(it); else { for (let i=list.length-1;i>=0;i--) if (list[i]===it) list.splice(i,1); } }
function renderTradeT(){
  const n = tradeWithT; if (!n) return;
  $("ttTitle").textContent = `Trade with ${n.first}`; $("ttTheirLbl").textContent = `${n.first} has · $${Math.round(n.money)}`;
  const th = $("ttTheirs"), mi = $("ttMine"); th.textContent = ""; mi.textContent = "";
  const theirs = slotsT(n.inv), mine = slotsT(T.player.inv);
  for (let i=0;i<Math.max(CAP,theirs.length);i++){ const s = theirs[i]; const it = s && s.item; const picked = it ? countIn(tGetT, it) : 0;
    th.append(tSlotEl(s, {cls:picked?"pick":"", badge: picked ? `${picked}/${countIn(n.inv,it)}` : null, onclick: it ? ()=>{ pickToggleT(tGetT, it, countIn(n.inv,it)); sfx("select"); renderTradeT(); } : null})); }
  for (let i=0;i<CAP;i++){ const s = mine[i]; const it = s && s.item; const picked = it ? countIn(tGiveT, it) : 0;
    mi.append(tSlotEl(s, {cls:picked?"pick":"", badge: picked ? `${picked}/${countIn(T.player.inv,it)}` : null, onclick: it && it!=="room key" ? ()=>{ pickToggleT(tGiveT, it, countIn(T.player.inv,it)); sfx("select"); renderTradeT(); } : null})); }
  $("ttCash").textContent = tCash > 0 ? `you pay $${tCash}` : tCash < 0 ? `they pay $${-tCash}` : "$0";
  const {ask, give} = tradeCalcT();
  const empty = !tGetT.length && !tGiveT.length && !tCash;
  const pct = (!tGetT.length && tCash >= 0) ? (empty ? 0 : 100) : clamp(give/Math.max(.1,ask)*100, 0, 100);
  $("ttMeter").style.width = pct+"%"; $("ttMeter").className = pct>=100 ? "ok" : "";
  $("ttNote").textContent = empty ? `Click to add one; click past the stack size to clear. ${n.first} likes: ${n.likes.join(", ")}.` : pct>=100 ? ((tGetT.length || tCash<0) ? "They'd take that." : "That's a gift. They'll appreciate it.") : `Not enough. ${n.first} likes: ${n.likes.join(", ")}. Or haggle out loud.`;
  $("ttGo").disabled = empty;
}
function doTradeT(){
  const n = tradeWithT, {ask, give} = tradeCalcT();
  if ((tGetT.length || tCash < 0) && give < ask){ sfx("nope"); $("ttNote").textContent = `${n.first} shakes their head. "${pick(["You're kidding.","Try harder.","Not for that.","I wasn't born yesterday."])}"`; return; }
  if (tCash > T.money){ $("ttNote").textContent = "You don't have that much."; sfx("nope"); return; }
  if (-tCash > n.money){ $("ttNote").textContent = `${n.first} doesn't have that much.`; sfx("nope"); return; }
  const after = T.player.inv.slice(); for (const it of tGiveT) after.splice(after.indexOf(it),1); after.push(...tGetT);
  if (slotsT(after).length > CAP){ $("ttNote").textContent = "Your pockets can't hold all that."; sfx("nope"); return; }
  for (const it of tGetT) n.inv.splice(n.inv.indexOf(it),1);
  for (const it of tGiveT){ T.player.inv.splice(T.player.inv.indexOf(it),1); n.inv.push(it); }
  T.player.inv.push(...tGetT);
  T.money -= tCash; n.money += tCash;
  n.opinion = clamp(n.opinion + (tGetT.length ? 2 : 6), -100, 100); n.trust = clamp(n.trust + (tGetT.length ? 2 : 3), 0, 100);
  for (const it of tGiveT) checkFavorOnGiveT(n, it);
  const desc = `${tGiveT.join(", ")||""}${tCash>0?` $${tCash}`:""} for ${tGetT.join(", ")||""}${tCash<0?` $${-tCash}`:""}`;
  logLineT(n, "e", `Traded ${desc}.`);
  rememberT(n, `The newcomer traded with me: ${desc}.`);
  if (tGiveT.some(isEvidence)){ rememberT(n, `The newcomer gave me a ${tGiveT.find(isEvidence)}. Strange thing to have.`); if (isDet(n)) addEvidence(`The newcomer traded me a ${tGiveT.find(isEvidence)}.`, 15, "trade"); }
  sfx("deal"); emoteT(n,"♥"); T.stats.trades++;
  tradeWithT = null; closeTWindows(); openTalkT(n); startTypeT(pick(["Pleasure doing business.","Deal.","Nice doing business.","We're square."]), n);
  saveT();
}

// ---------- journal ----------
let tjTab = "people", tjSel = null;
function openJournalT(tab, sel){ closeTalkT(); closeTWindows(); if (tab) tjTab = tab; if (sel) tjSel = sel; $("tWinJournal").hidden = false; sfx("open"); renderJournalT(); }
function portraitT(n){ const c = document.createElement("canvas"); c.width = 16; c.height = 20; const g = c.getContext("2d"); g.fillStyle = "#333c57"; g.fillRect(0,0,16,20); drawPerson(g, 0, 4, n.look, [0,1], 0, {}); return c; }
function renderJournalT(){
  const tabs = $("tjTabs"); tabs.textContent = "";
  for (const [id, label] of [["people","People"],["clues","Clues & suspects"],["plans","Plans & favors"],["gazette","Gazette"],["town","Town"]]){
    const b = Object.assign(document.createElement("button"),{type:"button", textContent:label}); b.setAttribute("aria-selected", String(tjTab===id)); b.addEventListener("click", ()=>{ tjTab = id; renderJournalT(); }); tabs.append(b);
  }
  const body = $("tjBody"); body.textContent = "";
  const H = (t) => Object.assign(document.createElement("span"),{className:"lbl", textContent:t});
  const P = (t, cls) => Object.assign(document.createElement("p"),{className:cls||"note", textContent:t});
  if (tjTab==="people"){
    const met = folk.filter(n=>n.met || n.log.length);
    if (!met.length){ body.append(P("You haven't met anyone yet. Walk up to someone and press E.")); return; }
    if (!tjSel || !met.find(n=>n.id===tjSel)) tjSel = met[0].id;
    const wrap = document.createElement("div"); wrap.className = "people";
    const list = document.createElement("div"); list.className = "plist";
    for (const n of met){ const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-selected", String(n.id===tjSel)); if (n.dead) b.className = "away"; b.append(portraitT(n), Object.assign(document.createElement("span"),{textContent:`${n.first}${n.dead?" †":""}${n.partner?" ♥":""}`})); b.addEventListener("click", ()=>{ tjSel = n.id; renderJournalT(); }); list.append(b); }
    const n = byIdT(tjSel), det = document.createElement("div"); det.className = "pdetail";
    det.append(Object.assign(document.createElement("h3"),{textContent:`${fullT(n)}${n.dead?" (dead)":""}`}));
    const st = document.createElement("div"); st.className = "stats";
    st.append(`${n.job} · ${n.age} · ${tierOf(n)} · ${n.partner ? "Sweetheart" : opWordT(n.opinion)} · trust ${Math.round(n.trust)}`); det.append(st);
    if (n.met && n.bio) det.append(P(n.bio, "note"));
    det.append(P(`${homeLine(n)}. ${cap(familyLine(n))}.${n.work ? ` Works at ${placeName(n.work)}${n.hours ? ` ${n.hours[0]}:00–${n.hours[1]%24}:00` : ""}.` : ""}`));
    det.append(P(`Likes: ${n.likes.join(", ")}. Hobbies: ${n.hobbies.join(", ")}.`));
    const habits = (T.seenHabits[n.id]||[]).map(id=>TELLS.find(t=>t.id===id).habit);
    if (habits.length) det.append(P(`You've noticed: ${n.first} ${habits.join(", and ")}.`));
    const sec = T.secrets.filter(s=>s.who===n.id); if (sec.length) det.append(P(`Told you in confidence: ${sec.map(s=>s.text).join(" / ")}`));
    det.append(H("Who they're close to"));
    const rels = document.createElement("div"); rels.className = "rels";
    for (const o of folk.filter(o=>o!==n && Math.abs(relGetT(n.id,o.id)) >= 15).sort((a,b)=>relGetT(n.id,b.id)-relGetT(n.id,a.id)).slice(0,12)){ const v = relGetT(n.id,o.id); const d = document.createElement("div"); d.append(o.first, Object.assign(document.createElement("span"),{className:v>=10?"pos":v<=-10?"neg":"", textContent:relWordT(v)})); rels.append(d); }
    det.append(rels);
    det.append(H("What they remember about you"));
    const ul = document.createElement("ul"); ul.className = "mems";
    const mems = n.memories.filter(m=>/newcomer/i.test(m.text)).slice(-10).reverse();
    if (!mems.length) ul.append(Object.assign(document.createElement("li"),{textContent:"Nothing yet."}));
    for (const m of mems){ const li = document.createElement("li"); li.append(Object.assign(document.createElement("small"),{textContent:m.s}), m.text); ul.append(li); }
    det.append(ul);
    det.append(H("Conversation"));
    const log = document.createElement("div"); log.className = "chatlog";
    for (const l of n.log.slice(-16)) log.append(Object.assign(document.createElement("p"),{className:l.who==="p"?"p":l.who==="e"?"e":"", textContent:(l.who==="p"?"You: ":l.who==="n"?n.first+": ":"")+l.text}));
    det.append(log);
    wrap.append(list, det); body.append(wrap); return;
  }
  if (tjTab==="clues"){
    body.append(P("Someone in Millbrook is not who they say they are. The Bureau doesn't send uniforms. Watch for habits that match the traces left behind. When you're sure, accuse them to their face, from the talk box."));
    body.append(H("Traces left behind"));
    const clues = T.clues.slice().reverse();
    if (!clues.length) body.append(P("Nothing yet. Keep your eyes open, especially in your own room."));
    for (const c of clues){ const d = document.createElement("div"); d.className = "clue"; d.append(Object.assign(document.createElement("small"),{textContent:c.s}), c.text); body.append(d); }
    const clueTells = new Set(T.clues.map(c=>c.tell).filter(Boolean));
    body.append(H("People and their habits"));
    const ppl = folk.filter(n=>(T.seenHabits[n.id]||[]).length || T.suspects[n.id]);
    if (!ppl.length) body.append(P("You haven't noticed anyone's habits yet. Spend time near people."));
    for (const n of ppl){
      const row = document.createElement("div"); row.className = "suspect";
      const tl = document.createElement("div"); tl.className = "tl";
      tl.append(Object.assign(document.createElement("b"),{textContent:`${n.first} (${n.job})${n.dead?" †":""} `}));
      for (const id of (T.seenHabits[n.id]||[])){ const t = TELLS.find(x=>x.id===id); tl.append(Object.assign(document.createElement("span"),{className:clueTells.has(id)?"hit":"", textContent:t.words[0]})); }
      const mark = Object.assign(document.createElement("button"),{type:"button", className:"pbtn", textContent: T.suspects[n.id] ? "★ Suspect" : "☆ Mark"});
      mark.addEventListener("click", ()=>{ T.suspects[n.id] = !T.suspects[n.id]; renderJournalT(); });
      row.append(portraitT(n), tl, mark); body.append(row);
    }
    if (T.warnings.length){ body.append(H("Warnings")); for (const w of T.warnings.slice().reverse()){ const d = document.createElement("div"); d.className = "clue"; d.append(Object.assign(document.createElement("small"),{textContent:`${w.s} · ${nmT(w.who)}`}), w.text); body.append(d); } }
    if (T.overheard && T.overheard.length){ body.append(H("Overheard")); for (const o of T.overheard.slice(-10).reverse()){ const d = document.createElement("div"); d.className = "clue"; d.append(Object.assign(document.createElement("small"),{textContent:`${o.s} · ${o.a}`}), o.text); body.append(d); } }
    if (T.secrets.length){ body.append(H("Secrets you've been told")); for (const s of T.secrets.slice().reverse()){ const d = document.createElement("div"); d.className = "clue"; d.append(Object.assign(document.createElement("small"),{textContent:nmT(s.who)}), s.text); body.append(d); } }
    return;
  }
  if (tjTab==="plans"){
    body.append(H("Appointments"));
    const ap = T.appts.slice().sort((a,b)=>b.at-a.at).slice(0,14);
    if (!ap.length) body.append(P("No plans. Ask someone to play darts, go fishing, get dinner, or dance on Saturday."));
    for (const a of ap){ const d = document.createElement("div"); d.className = "tsk"+(a.status==="met"?" done":a.status==="pending"?" ready":""); d.append(`${nmT(a.who)} · ${apptText(a)}`, Object.assign(document.createElement("span"),{textContent:a.status})); body.append(d); }
    body.append(H("Favors"));
    if (!T.tasks.length) body.append(P("No favors. Ask people if they need a hand."));
    for (const t of T.tasks.slice().reverse()){ const d = document.createElement("div"); d.className = "tsk"+(t.status==="ready"?" ready":t.status==="done"?" done":""); d.append(`${nmT(t.giver)}: ${t.text}`, Object.assign(document.createElement("span"),{textContent:`$${t.reward} · ${t.status}`})); body.append(d); }
    if (T.debts.length){ body.append(H("Money you owe")); for (const d0 of T.debts){ const d = document.createElement("div"); d.className = "tsk"+(d0.paid?" done":""); d.append(`${nmT(d0.who)}: $${d0.amount}`, Object.assign(document.createElement("span"),{textContent:d0.paid?"paid":`since day ${d0.day}`})); body.append(d); } }
    body.append(P(`Rent at the Millbrook Arms is paid through day ${T.rentPaid}. Trains leave at 8:00, 14:00 and 19:00.`));
    return;
  }
  if (tjTab==="gazette"){
    if (!T.gazette.length) body.append(P("The Gazette comes out every morning at seven."));
    for (const g of T.gazette.slice().reverse()){
      const d = document.createElement("div"); d.className = "gz";
      d.append(Object.assign(document.createElement("small"),{textContent:`THE MILLBROOK GAZETTE · ${dayName(g.day).toUpperCase()}, DAY ${g.day} · ${g.weather}`}), Object.assign(document.createElement("h4"),{textContent:g.headline}));
      for (const s of g.stories) d.append(Object.assign(document.createElement("p"),{textContent:"• "+s}));
      if (g.personal) d.append(Object.assign(document.createElement("p"),{textContent:g.personal, style:"font-style:italic"}));
      body.append(d);
    }
    return;
  }
  if (tjTab==="town"){
    if (T.missing.length) body.append(P(`MISSING: ${T.missing.map(nmT).join(", ")}`, "status"));
    const found = T.bodies.filter(b=>b.discovered); if (found.length) body.append(P(`Dead: ${found.map(b=>`${b.name} (found at ${b.foundAt})`).join("; ")}`, "status"));
    body.append(H("What you've heard around town"));
    const ul = document.createElement("ul"); ul.className = "mems";
    for (const x of T.news.slice(-40).reverse()){ const li = document.createElement("li"); if (x.seen) li.className = "seen"; li.append(Object.assign(document.createElement("small"),{textContent:x.s}), x.text); ul.append(li); }
    if (!T.news.length) ul.append(Object.assign(document.createElement("li"),{textContent:"Quiet so far."}));
    body.append(ul);
    body.append(H("Your stay"));
    const s = T.stats; body.append(P(`Days in Millbrook: ${T.day}. Fish caught: ${s.fish}. Favors done: ${s.favors}. Dates kept: ${s.dates}. Odd jobs: ${s.jobs}. Games: ${s.darts+s.cards+s.arcade} . ${s.kills ? `People who won't wake up: ${s.kills}.` : ""}`));
  }
}

// ---------- map ----------
function openMapT(){
  closeTalkT(); closeTWindows(); $("tWinMap").hidden = false; sfx("open");
  const c = $("tmCv"), sc = 2; c.width = TW*TS/sc; c.height = TH*TS/sc;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  if (tmapDirty) rebuildTownMap();
  g.drawImage(tmapCv, 0, 0, c.width, c.height);
  g.setTransform(1/sc,0,0,1/sc,0,0); drawRoofs(g, null); g.setTransform(1,0,0,1,0,0);
  g.font = "16px VT323, monospace"; g.textAlign = "center"; g.textBaseline = "middle";
  const lab = (text, x, y, col) => { const w = g.measureText(text).width; g.fillStyle = "rgba(26,28,44,.85)"; g.fillRect(x-w/2-3, y-8, w+6, 15); g.fillStyle = col||PAL.w; g.fillText(text, x, y); };
  for (const b of BUILDINGS){ const cx = (b.x0+b.x1+1)/2*TS/sc, cy = (b.y0+b.y1+1)/2*TS/sc; const name = b.kind==="home" ? (residentsOf(b.id).filter(n=>n.met).map(n=>n.first).join(" & ") || "") : b.name; if (name) lab(name, cx, cy, b.kind==="home" ? PAL.l : PAL.y); }
  for (const k of ["square","park","pond","cemetery","junkyard","farm","woods"]){ const r = PLACES[k].rect || [85,64,95,74]; lab(PLACES[k].label.replace(/^the /,""), (r[0]+r[2]+1)/2*TS/sc, (r[1]+r[3]+1)/2*TS/sc, PAL.g); }
  for (const a of T.appts.filter(a=>a.status==="pending")){ const s = PLACES[a.place] && (PLACES[a.place].building ? (()=>{ const bd = bById(outerOf(PLACES[a.place].building)); return [(bd.x0+bd.x1)/2, bd.y1]; })() : PLACES[a.place].rect ? [(PLACES[a.place].rect[0]+PLACES[a.place].rect[2])/2, PLACES[a.place].rect[1]] : null); if (s) lab(`♥ ${fmtT(a.at)} ${nmT(a.who)}`, s[0]*TS/sc, s[1]*TS/sc+14, "#ffd6e0"); }
  const pl = T.player; g.fillStyle = PAL.k; g.fillRect(pl.x*TS/sc-1, pl.y*TS/sc-1, 10, 10); g.fillStyle = PAL.y; g.fillRect(pl.x*TS/sc, pl.y*TS/sc, 8, 8);
  lab("YOU", pl.x*TS/sc+4, pl.y*TS/sc-10, PAL.y);
  $("tmNote").textContent = `The road west out of town is the only way out on foot. Trains leave at 8, 14 and 19. ${T.wanted ? "Everyone knows who you are now." : ""}`;
}
