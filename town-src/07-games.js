// Fun: fishing, darts, blackjack, the arcade, the barn dance, odd jobs, shops, the lottery.
let GAME = null;
const GW = 320, GH = 200;
function gameCtx(){ const c = $("tgCv"); const g = c.getContext("2d"); g.imageSmoothingEnabled = false; return g; }
function openGame(title, game){
  closeTalkT(); closeTWindows();
  GAME = game; T.game = game.kind;
  $("tgTitle").textContent = title; $("tgInfo").textContent = game.info || ""; $("tgBtns").textContent = "";
  $("tWinGame").hidden = false; sfx("open");
  if (game.start) game.start();
}
function gameButtons(list){
  const b = $("tgBtns"); b.textContent = "";
  for (const [label, fn, cls] of list){ const el = Object.assign(document.createElement("button"),{type:"button", className:"pbtn"+(cls?" "+cls:""), textContent:label}); el.addEventListener("click", fn); b.append(el); }
}
function closeGame(){
  if (!GAME) return;
  const g = GAME; GAME = null; T.game = null;
  $("tWinGame").hidden = true; sfx("close");
  if (g.onClose) g.onClose();
  renderHotbarT(); saveT();
}
function gameFrame(dt){
  if (!GAME) return;
  GAME.t = (GAME.t||0) + dt;
  if (GAME.update) GAME.update(dt);
  const g = gameCtx(); g.setTransform(1,0,0,1,0,0);
  if (GAME.draw) GAME.draw(g);
}
function gText(g, text, x, y, col, size=10, align="left"){ g.font = `${size}px "Press Start 2P", monospace`; g.textAlign = align; g.textBaseline = "top"; g.fillStyle = PAL.k; g.fillText(text, x+1, y+1); g.fillStyle = col||PAL.w; g.fillText(text, x, y); g.textAlign = "left"; }
function gVT(g, text, x, y, col, size=16, align="left"){ g.font = `${size}px VT323, monospace`; g.textAlign = align; g.textBaseline = "top"; g.fillStyle = col||PAL.w; g.fillText(text, x, y); g.textAlign = "left"; }
function oppReact(n, won, what){
  if (!n) return;
  const comp = n.traits.includes("competitive") || n.traits.includes("proud");
  n.opinion = clamp(n.opinion + (won ? (comp ? -2 : 4) : 6), -100, 100); n.trust = clamp(n.trust+2,0,100);
  relAddT(n.id, n.id, 0);
  rememberT(n, `Played ${what} with the newcomer. ${won ? "They beat me." : "I won."}${comp && won ? " I want a rematch." : ""}`);
  sayT(n, won ? (comp ? pick(["Rematch. Now.","Beginner's luck.","Hmph."]) : pick(["Well played!","You're good at this!","I'll get you next time."])) : pick(["Ha! Better luck next time.","*grins* Pay up.","That was fun."]), 4);
  gossipT(n, `Played ${what} with the newcomer. ${won ? "They're good." : "I whooped 'em."}`);
}

// ---------- fishing ----------
const FISH_TABLE = [["perch",30,.25],["bass",24,.4],["catfish",16,.55],["trout",14,.6],["golden carp",3,.85],["old boot",13,.1]];
function rollFish(){ const night = isNightT(), rain = T.weather==="rain"; const tot = FISH_TABLE.reduce((s,f)=>s+f[1]*(f[0]==="catfish"&&night?2:1)*(f[0]==="golden carp"&&rain?2:1),0); let r = Math.random()*tot; for (const f of FISH_TABLE){ r -= f[1]*(f[0]==="catfish"&&night?2:1)*(f[0]==="golden carp"&&rain?2:1); if (r<=0) return f; } return FISH_TABLE[0]; }
function startFishing(opp){
  if (!T.player.inv.includes("fishing rod")){ toast("You need a fishing rod. Hartley's General sells them ($20).", "bad", 4); return; }
  const G = {kind:"fishing", opp, phase:"cast", t:0, caught:[], oppCaught:0, info:"Wait for a bite, then press E or click. Hold E or the mouse to reel; keep the fish inside the green zone."};
  G.start = () => { G.reset(); gameButtons([["Pack up", closeGame]]); };
  G.reset = () => { G.phase = "wait"; G.biteAt = G.t + 2 + Math.random()*5; G.bob = 0; G.fish = null; };
  G.press = (down) => {
    if (G.phase==="wait" && down){ G.msg = "Too early! You spooked it."; G.msgT = 1.5; G.reset(); sfx("nope"); }
    else if (G.phase==="bite" && down){ G.fish = rollFish(); G.phase = "reel"; G.zone = .35; G.zv = 0; G.fpos = .5; G.fv = 0; G.prog = .3; sfx("alert"); }
    if (G.phase==="reel") G.hold = down;
  };
  G.key = (k, down) => { if (k==="e"||k===" "||k==="enter") G.press(down); };
  G.click = (x,y,down) => G.press(down);
  G.update = (dt) => {
    if (G.msgT) G.msgT = Math.max(0, G.msgT-dt);
    if (G.phase==="wait" && G.t >= G.biteAt){ G.phase = "bite"; G.biteEnd = G.t + .9; sfx("splash"); }
    if (G.phase==="bite" && G.t > G.biteEnd){ G.msg = "It got away."; G.msgT = 1.5; G.reset(); }
    if (G.phase==="reel"){
      const diff = G.fish[2];
      G.fv += (Math.random()-.5) * (3+diff*12) * dt; G.fv *= .96; G.fpos = clamp(G.fpos + G.fv*dt*2, 0, 1); if (G.fpos<=0||G.fpos>=1) G.fv *= -1;
      G.zv += (G.hold ? 2.4 : -2.0) * dt; G.zv *= .92; G.zone = clamp(G.zone + G.zv*dt*2.2, 0, .75); if (G.zone<=0||G.zone>=.75) G.zv = 0;
      const inside = G.fpos >= G.zone && G.fpos <= G.zone+.25;
      G.prog = clamp(G.prog + (inside ? .28 : -.22 - diff*.1) * dt, 0, 1);
      if (Math.random() < dt*3 && inside) Snd.tone({f:900+G.prog*600,dur:.03,vol:.03});
      if (G.prog >= 1) landFish(G);
      else if (G.prog <= 0){ G.msg = "The line snapped. It's gone."; G.msgT = 2; sfx("nope"); advanceTimeT(5); G.reset(); }
    }
    if (G.opp && Math.random() < dt*.03){ G.oppCaught++; G.oppMsg = `${G.opp.first} reels in a ${pick(["perch","bass","catfish"])}!`; G.oppMsgT = 3; }
  };
  G.draw = (g) => {
    const night = isNightT();
    g.fillStyle = night ? "#1a2448" : "#73b8f7"; g.fillRect(0,0,GW,70);
    g.fillStyle = night ? "#29366f" : "#3b5dc9"; g.fillRect(0,70,GW,130);
    for (let i=0;i<14;i++){ g.fillStyle = night ? "#3b5dc9" : "#41a6f6"; g.fillRect((i*37 + Math.floor(G.t*12))%GW, 80+((i*23)%110), 10, 1); }
    g.fillStyle = "#38b764"; g.fillRect(0,60,GW,12); g.fillStyle = "#257179"; for (let x=0;x<GW;x+=9) g.fillRect(x,55+(x*7)%6,4,8);
    g.fillStyle = "#8b5a3c"; g.fillRect(0,150,90,10); g.fillStyle = "#5e3a24"; for (let x=4;x<90;x+=14) g.fillRect(x,160,4,40);
    // you and the rod
    g.fillStyle = PAL.k; g.fillRect(60,128,12,22); g.fillStyle = "#d49a6a"; g.fillRect(62,120,8,8);
    g.strokeStyle = "#c8a374"; g.lineWidth = 2; g.beginPath(); g.moveTo(70,132); g.lineTo(150,96); g.stroke();
    const bx = 200, by = 120 + (G.phase==="bite" ? 6 + Math.sin(G.t*40)*3 : Math.sin(G.t*3)*1.5);
    g.strokeStyle = "rgba(244,244,244,.7)"; g.lineWidth = 1; g.beginPath(); g.moveTo(150,96); g.lineTo(bx,by); g.stroke();
    g.fillStyle = PAL.k; g.fillRect(bx-4,by-4,8,8); g.fillStyle = PAL.r; g.fillRect(bx-3,by-3,6,3); g.fillStyle = PAL.w; g.fillRect(bx-3,by,6,3);
    if (G.phase==="bite") gText(g, "!", bx-4, by-26, PAL.y, 16);
    if (G.opp){ g.fillStyle = PAL.k; g.fillRect(24,128,12,22); g.fillStyle = G.opp.look.skin; g.fillRect(26,120,8,8); gVT(g, `${G.opp.first}: ${G.oppCaught}`, 8, 176, PAL.w); }
    if (G.phase==="reel"){
      g.fillStyle = PAL.k; g.fillRect(280,20,24,160); g.fillStyle = "#333c57"; g.fillRect(283,23,18,154);
      g.fillStyle = "#38b764"; g.fillRect(283, 23+154*(1-G.zone-.25), 18, 154*.25);
      const fy = 23+154*(1-G.fpos); g.fillStyle = G.fish[0]==="golden carp" ? PAL.y : PAL.l; g.fillRect(285, fy-4, 14, 8);
      g.fillStyle = PAL.k; g.fillRect(262,20,10,160); g.fillStyle = PAL.y; g.fillRect(264, 22+156*(1-G.prog), 6, 156*G.prog);
      gVT(g, "HOLD E", 214, 6, PAL.w);
    }
    gVT(g, `Caught: ${G.caught.length ? G.caught.join(", ") : "nothing yet"}`, 8, 4, PAL.w);
    if (G.msgT) gText(g, G.msg, 160, 40, PAL.y, 8, "center");
    if (G.oppMsgT){ G.oppMsgT -= 1/60; gVT(g, G.oppMsg, 160, 186, PAL.c, 14, "center"); }
  };
  G.onClose = () => {
    if (G.opp) oppReact(G.opp, G.caught.length > G.oppCaught, "fishing at the pond");
    if (G.caught.length) newsT(`The newcomer pulled ${G.caught.length} fish out of the pond.`, [], true);
  };
  openGame("Fishing" + (opp ? ` with ${opp.first}` : ""), G);
}
function landFish(G){
  const name = G.fish[0];
  advanceTimeT(10 + Math.floor(Math.random()*10));
  if (!canAddT(T.player.inv, name)){ G.msg = `A ${name}! No room, you let it go.`; G.msgT = 2.5; G.reset(); return; }
  addItemT(name, true); G.caught.push(name); T.stats.fish++;
  G.msg = name==="old boot" ? "…an old boot." : `A ${name}!`; G.msgT = 2.5;
  sfx(name==="golden carp" ? "fanfare" : name==="old boot" ? "sad" : "pickup");
  if (name==="golden carp"){ newsT("The newcomer caught a GOLDEN CARP at the pond! First one in years.", []); T.notoriety = Math.max(0, T.notoriety-5); for (const n of folk) if (alive(n) && n.hobbies.includes("fishing")) { n.opinion = clamp(n.opinion+6,-100,100); rememberT(n, "The newcomer caught a golden carp. Impressive."); } }
  // the pond gives up its secrets
  const sunk = T.bodies.find(b=>b.hidden==="pond" && !b.discovered);
  if (sunk && Math.random()<.06){ G.msg = "Something heavy… a SLEEVE?!"; G.msgT = 3; discoverBody(sunk, null, "snagged on a fishing line"); }
  G.reset();
}

// ---------- darts ----------
const DART_NUMS = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
function dartScore(dx, dy){
  const r = Math.hypot(dx,dy); if (r > 80) return 0;
  if (r < 5) return 50; if (r < 12) return 25;
  let a = Math.atan2(dx, -dy) * 180/Math.PI; if (a < 0) a += 360;
  const n = DART_NUMS[Math.floor(((a + 9) % 360) / 18)];
  if (r >= 44 && r < 50) return n*3; if (r >= 74) return n*2; return n;
}
function startDarts(opp){
  const G = {kind:"darts", opp, round:1, dart:0, mine:[], theirs:[], bet:0, info: opp ? `Three rounds, three darts each. Highest total wins. Press E or click to throw.` : "Practice. Press E or click to throw. Beat the bar record."};
  const skill = opp ? (opp.hobbies.includes("darts") ? .78 : .45) + (opp.tells.includes("chalk") ? .1 : 0) : 0;
  G.start = () => {
    if (opp && T.money >= 5) gameButtons([["Play for fun", ()=>G.go(0)], ["Bet $5", ()=>G.go(5)], ["Bet $20", ()=>G.go(20), T.money>=20?"":""], ["Leave", closeGame]]);
    else { G.go(0); }
  };
  G.go = (bet) => { if (bet > T.money) bet = 0; G.bet = bet; G.started = true; gameButtons([["Quit", closeGame]]); if (bet) toast(`$${bet} on the line.`, "", 2); };
  G.key = (k, down) => { if (down && (k==="e"||k===" "||k==="enter")) G.throw(); };
  G.click = (x,y,down) => { if (down) G.throw(); };
  G.aim = () => { const wob = 1 + (T.drunk||0)*.5; return [Math.sin(G.t*1.9)*46*wob + Math.sin(G.t*4.3)*12*wob, Math.cos(G.t*1.3)*40*wob + Math.sin(G.t*3.1)*14*wob]; };
  G.throw = () => {
    if (!G.started || G.over || (G.cool && G.t < G.cool)) return;
    const [ax, ay] = G.aim(); const s = dartScore(ax, ay); G.mine.push({x:ax, y:ay, s}); G.last = s; sfx("punch"); G.cool = G.t + .4;
    if (++G.dart >= 3){ G.dart = 0; if (opp){ for (let i=0;i<3;i++){ const spread = (1-skill)*85; const dx = (Math.random()-.5)*spread*2, dy = (Math.random()-.5)*spread*2; G.theirs.push({x:dx, y:dy, s:dartScore(dx,dy)}); } }
      if (++G.round > 3) G.finish(); }
  };
  G.finish = () => {
    G.over = true; const me = G.mine.reduce((a,b)=>a+b.s,0), them = G.theirs.reduce((a,b)=>a+b.s,0);
    advanceTimeT(20); T.stats.darts++;
    if (!opp){ G.result = `You scored ${me}.`; if (me > (T.highscores.darts||0)){ T.highscores.darts = me; G.result += " New bar record!"; newsT(`The newcomer set a new darts record at the Rusty Nail: ${me}.`, [], true); sfx("fanfare"); } }
    else { const won = me > them; G.result = won ? `You win, ${me} to ${them}!` : me===them ? `A tie at ${me}.` : `${opp.first} wins, ${them} to ${me}.`;
      if (G.bet){ if (won){ addMoney(Math.min(G.bet, opp.money), `${opp.first} pays up`); opp.money = Math.max(0, opp.money-G.bet); } else if (me!==them){ addMoney(-G.bet, `lost to ${opp.first}`); opp.money += G.bet; } }
      oppReact(opp, won, "darts at the Rusty Nail"); sfx(won ? "fanfare" : "sad"); }
    gameButtons([["Again", ()=>{ closeGame(); startDarts(opp); }], ["Done", closeGame]]);
  };
  G.draw = (g) => {
    g.fillStyle = "#5e3a24"; g.fillRect(0,0,GW,GH); for (let x=0;x<GW;x+=20){ g.fillStyle = "#6b4430"; g.fillRect(x,0,1,GH); }
    const cx = 120, cy = 100;
    g.fillStyle = PAL.k; g.beginPath(); g.arc(cx,cy,88,0,7); g.fill();
    for (let i=0;i<20;i++){ const a0 = (i*18-9-90)*Math.PI/180, a1 = a0+Math.PI/10;
      for (const [r0,r1,c1,c2] of [[12,44,"#f4ecd8","#1a1c2c"],[44,50,"#b13e53","#38b764"],[50,74,"#f4ecd8","#1a1c2c"],[74,80,"#b13e53","#38b764"]]){ g.fillStyle = i%2 ? c1 : c2; g.beginPath(); g.arc(cx,cy,r1,a0,a1); g.arc(cx,cy,r0,a1,a0,true); g.fill(); } }
    g.fillStyle = "#38b764"; g.beginPath(); g.arc(cx,cy,12,0,7); g.fill(); g.fillStyle = PAL.r; g.beginPath(); g.arc(cx,cy,5,0,7); g.fill();
    for (let i=0;i<20;i++){ const a = (i*18-90)*Math.PI/180; gVT(g, String(DART_NUMS[i]), cx+Math.cos(a)*84-4, cy+Math.sin(a)*84-7, PAL.w, 12); }
    const show = G.mine.slice(-3 + (G.dart ? G.dart-3 : 0)).length ? G.mine.slice(G.mine.length - (G.dart || 3)) : [];
    for (const d of (G.over ? G.mine.slice(-3) : show)){ g.fillStyle = PAL.y; g.fillRect(cx+d.x-1, cy+d.y-1, 3, 3); g.fillStyle = PAL.k; g.fillRect(cx+d.x+1, cy+d.y-5, 1, 5); }
    if (!G.over && G.started){ const [ax,ay] = G.aim(); g.strokeStyle = PAL.c; g.lineWidth = 1; g.beginPath(); g.arc(cx+ax, cy+ay, 5, 0, 7); g.moveTo(cx+ax-8, cy+ay); g.lineTo(cx+ax+8, cy+ay); g.moveTo(cx+ax, cy+ay-8); g.lineTo(cx+ax, cy+ay+8); g.stroke(); }
    const me = G.mine.reduce((a,b)=>a+b.s,0), them = G.theirs.reduce((a,b)=>a+b.s,0);
    gText(g, `ROUND ${Math.min(3,G.round)}/3`, 222, 14, PAL.y, 8);
    gVT(g, `You: ${me}`, 222, 34, PAL.w); if (G.last!=null) gVT(g, `last dart: ${G.last}`, 222, 50, PAL.l, 14);
    if (opp) gVT(g, `${opp.first}: ${them}`, 222, 72, PAL.w);
    if (G.bet) gVT(g, `Bet: $${G.bet}`, 222, 92, PAL.g);
    if (!opp) gVT(g, `Record: ${T.highscores.darts||0}`, 222, 92, PAL.l);
    if (G.result) gVT(g, G.result, 222, 120, PAL.y, 15);
    if (!G.started) gVT(g, "Place your bet.", 222, 120, PAL.w);
  };
  openGame(opp ? `Darts with ${opp.first}` : "Darts", G);
}

// ---------- blackjack ----------
const SUITS_C = ["♠","♥","♦","♣"], RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
function handVal(h){ let v = 0, aces = 0; for (const c of h){ const r = c.r; if (r==="A"){ aces++; v += 11; } else if ("JQK".includes(r)) v += 10; else v += Number(r); } while (v > 21 && aces){ v -= 10; aces--; } return v; }
function startCards(opp){
  const dealer = opp || folk.find(n=>alive(n) && n.job==="bartender" && insideOf(n)==="bar") || null;
  const cheat = dealer && /cheats at cards/.test(dealer.secret);
  const G = {kind:"cards", opp:dealer, phase:"bet", bet:5, me:[], them:[], deck:[], won:0, hands:0, info:`Blackjack. Get closer to 21 than ${dealer ? dealer.first : "the house"} without going over.`};
  const deal = () => { if (G.deck.length < 12){ G.deck = []; for (const s of SUITS_C) for (const r of RANKS) G.deck.push({r, s}); shuffle(G.deck); } return G.deck.pop(); };
  G.start = () => G.betUI();
  G.betUI = () => { G.phase = "bet"; const opts = [5,10,25].filter(b=>b<=T.money); gameButtons(opts.map(b=>[`Bet $${b}`, ()=>G.dealHand(b)]).concat([["Leave", closeGame]])); if (!opts.length) G.msg = "You're broke."; };
  G.dealHand = (b) => { G.bet = b; G.me = [deal(), deal()]; G.them = [deal(), deal()]; G.phase = "play"; G.msg = ""; sfx("select");
    if (handVal(G.me)===21) return G.stand();
    gameButtons([["Hit", G.hit, "hot"], ["Stand", G.stand], T.money >= b*2 ? ["Double", G.dbl] : null].filter(Boolean)); };
  G.hit = () => { if (G.phase!=="play") return; G.me.push(deal()); sfx("select"); if (handVal(G.me) > 21) G.end(); };
  G.dbl = () => { if (G.phase!=="play") return; G.bet *= 2; G.me.push(deal()); G.stand(); };
  G.stand = () => { if (G.phase!=="play") return; while (handVal(G.them) < 17) G.them.push(deal());
    if (cheat && handVal(G.them) <= handVal(G.me) && handVal(G.me) <= 21 && Math.random()<.35){
      const target = Math.min(21, handVal(G.me)+1), low = target-10;
      if (target===21) G.them = [{r:"K", s:"♠"}, {r:"A", s:"♣"}]; else if (low >= 2 && low <= 10) G.them = [{r:"K", s:"♠"}, {r:String(low), s:"♣"}];
      if (Math.random()<.5){ G.msg2 = `*you swear a card slid out of ${dealer.first}'s sleeve*`; rememberT(dealer, "I think the newcomer saw me palm a card."); T.clues.push({s:stampT(), text:`${dealer.first} palmed a card at blackjack. A cheat.`}); }
    }
    G.end(); };
  G.end = () => {
    G.phase = "done"; G.hands++; advanceTimeT(5);
    const me = handVal(G.me), them = handVal(G.them);
    let res = 0;
    if (me > 21) res = -1; else if (them > 21 || me > them) res = 1; else if (me < them) res = -1;
    const bj = me===21 && G.me.length===2;
    if (res > 0){ const pay = bj ? Math.round(G.bet*1.5) : G.bet; addMoney(pay, bj ? "Blackjack!" : "won the hand"); if (dealer) dealer.money = Math.max(0, dealer.money - pay); G.won += pay; sfx("coin"); }
    else if (res < 0){ addMoney(-G.bet, "lost the hand"); if (dealer) dealer.money += G.bet; G.won -= G.bet; sfx("nope"); }
    G.msg = me > 21 ? "Bust." : res > 0 ? (bj ? "BLACKJACK!" : "You win.") : res < 0 ? "House wins." : "Push.";
    T.stats.cards++;
    gameButtons([["Deal again", G.betUI, "hot"], ["Leave", closeGame]]);
  };
  G.drawCard = (g, c, x, y, hidden) => {
    g.fillStyle = PAL.k; g.fillRect(x-1,y-1,34,46);
    if (hidden){ g.fillStyle = "#3b5dc9"; g.fillRect(x,y,32,44); g.fillStyle = "#29366f"; for (let i=0;i<44;i+=4) g.fillRect(x, y+i, 32, 2); return; }
    g.fillStyle = PAL.w; g.fillRect(x,y,32,44);
    const red = c.s==="♥"||c.s==="♦";
    gVT(g, c.r, x+3, y+1, red ? PAL.r : PAL.k, 16); gVT(g, c.s, x+12, y+16, red ? PAL.r : PAL.k, 22);
  };
  G.draw = (g) => {
    g.fillStyle = "#257179"; g.fillRect(0,0,GW,GH); g.fillStyle = "#1e5a60"; g.fillRect(8,8,GW-16,GH-16); g.fillStyle = "#257179"; g.fillRect(12,12,GW-24,GH-24);
    gVT(g, dealer ? dealer.first : "House", 20, 16, PAL.w);
    G.them.forEach((c,i)=>G.drawCard(g, c, 20+i*38, 34, G.phase==="play" && i===1));
    gVT(g, "You", 20, 104, PAL.w);
    G.me.forEach((c,i)=>G.drawCard(g, c, 20+i*38, 122));
    if (G.me.length) gVT(g, `${handVal(G.me)}`, 60, 104, PAL.y);
    if (G.phase==="done") gVT(g, `${handVal(G.them)}`, 80, 16, PAL.y);
    gVT(g, `Cash $${Math.round(T.money)}`, 228, 16, PAL.g); gVT(g, `Bet $${G.bet}`, 228, 34, PAL.w);
    gVT(g, `Session ${G.won>=0?"+":"-"}$${Math.abs(G.won)}`, 228, 52, G.won>=0?PAL.g:"#ff8a8a", 14);
    if (G.msg) gText(g, G.msg, 236, 100, PAL.y, 9, "center");
    if (G.msg2) gVT(g, G.msg2, 160, 178, PAL.c, 13, "center");
  };
  G.onClose = () => { if (dealer && G.hands){ oppReact(dealer, G.won > 0, "cards"); if (G.won >= 50) gossipT(dealer, `The newcomer cleaned me out at cards. $${G.won}. Suspiciously good.`); } };
  openGame(`Blackjack${dealer ? ` · ${dealer.first} deals` : ""}`, G);
}

// ---------- arcade: Brick Breaker ----------
function seedScores(){
  if (T.highscores.arcade) return;
  const teen = folk.find(n=>n.teen), owner = folk.find(n=>n.job==="arcade owner");
  T.highscores.arcade = [[teen ? teen.first : "ACE", 4200],[owner ? owner.first : "BOB", 2600],[pick(folk).first, 1500],[pick(folk).first, 900],[pick(folk).first, 400]];
}
function startArcade(opp){
  if (T.money < 1){ toast("A game costs $1.", "bad"); return; }
  seedScores(); addMoney(-1);
  const G = {kind:"arcade", opp, score:0, lives:3, level:1, info:"BRICK BREAKER · ←/→ or the mouse to move · E to launch"};
  G.reset = () => { G.px = 160; G.bx = 160; G.by = 170; G.vx = 0; G.vy = 0; G.stuck = true; };
  G.build = () => { G.bricks = []; for (let r=0;r<5+Math.min(3,G.level-1);r++) for (let c=0;c<12;c++) G.bricks.push({x:16+c*24, y:24+r*10, hp: r<1+Math.floor(G.level/2) ? 2 : 1, col:["#b13e53","#ef7d57","#ffcd75","#38b764","#41a6f6","#5d275d","#e07ab0","#73eff7"][r]}); };
  G.start = () => { G.build(); G.reset(); gameButtons([["Quit", closeGame]]); };
  G.keys = {};
  G.key = (k, down) => { G.keys[k] = down; if (down && (k==="e"||k===" ") && G.stuck && !G.over){ G.stuck = false; G.vx = 90*(Math.random()<.5?-1:1); G.vy = -150 - G.level*12; } };
  G.click = (x,y,down) => { if (down && G.stuck && !G.over){ G.stuck = false; G.vx = 90; G.vy = -150 - G.level*12; } };
  G.move = (x) => { G.px = clamp(x, 20, GW-20); };
  G.update = (dt) => {
    if (G.over) return;
    if (G.keys.arrowleft || G.keys.a) G.px = clamp(G.px - 220*dt, 20, GW-20);
    if (G.keys.arrowright || G.keys.d) G.px = clamp(G.px + 220*dt, 20, GW-20);
    if (G.stuck){ G.bx = G.px; G.by = 178; return; }
    G.bx += G.vx*dt; G.by += G.vy*dt;
    if (G.bx < 4 || G.bx > GW-4){ G.vx *= -1; G.bx = clamp(G.bx, 4, GW-4); Snd.tone({f:400,dur:.03,vol:.04}); }
    if (G.by < 14){ G.vy = Math.abs(G.vy); Snd.tone({f:400,dur:.03,vol:.04}); }
    if (G.by > 180 && G.by < 186 && Math.abs(G.bx-G.px) < 20 && G.vy > 0){ G.vy = -Math.abs(G.vy)*1.02; G.vx = (G.bx-G.px)*7; Snd.tone({f:600,dur:.04,vol:.05}); }
    if (G.by > GH){ G.lives--; sfx("nope"); if (G.lives <= 0) G.finish(); else G.reset(); }
    for (const b of G.bricks){ if (b.hp <= 0) continue; if (G.bx > b.x && G.bx < b.x+22 && G.by > b.y && G.by < b.y+8){ b.hp--; G.vy *= -1; G.score += b.hp ? 20 : 50*G.level; Snd.tone({f:800+Math.random()*400,dur:.05,vol:.05}); break; } }
    if (G.bricks.every(b=>b.hp<=0)){ G.level++; G.build(); G.reset(); sfx("quest"); }
  };
  G.finish = () => {
    G.over = true; advanceTimeT(15); T.stats.arcade++;
    const hs = T.highscores.arcade, beat = hs.filter(([n,s])=>G.score > s);
    hs.push([T.alias.split(" ")[0].toUpperCase().slice(0,8), G.score]); hs.sort((a,b)=>b[1]-a[1]); hs.length = Math.min(hs.length, 8);
    if (hs[0][1]===G.score){ newsT(`The newcomer took the top score on Brick Breaker at the Pixel Palace: ${G.score}.`, []); const teen = folk.find(n=>n.teen && alive(n)); if (teen){ teen.opinion = clamp(teen.opinion+15,-100,100); rememberT(teen, `The newcomer BEAT my Brick Breaker high score. ${G.score}. Respect. Also, rematch.`); } sfx("fanfare"); }
    gameButtons([[T.money>=1 ? "Another $1" : "Out of cash", ()=>{ if (T.money>=1){ closeGame(); startArcade(opp); } }], ["Done", closeGame]]);
  };
  G.draw = (g) => {
    g.fillStyle = "#0d0e18"; g.fillRect(0,0,GW,GH);
    for (const b of G.bricks) if (b.hp > 0){ g.fillStyle = b.col; g.fillRect(b.x,b.y,22,8); g.fillStyle = b.hp>1 ? PAL.w : shade(b.col,.3); g.fillRect(b.x,b.y,22,2); }
    g.fillStyle = PAL.c; g.fillRect(G.px-18, 182, 36, 5); g.fillStyle = PAL.w; g.fillRect(G.bx-2, G.by-2, 4, 4);
    gText(g, `${G.score}`, 6, 4, PAL.y, 8); gText(g, `LV${G.level}`, 150, 4, PAL.g, 8); gText(g, "♥".repeat(G.lives), 280, 4, PAL.r, 8);
    if (G.stuck && !G.over) gText(g, "PRESS E", 160, 120, PAL.w, 8, "center");
    if (G.over){ g.fillStyle = "rgba(13,14,24,.85)"; g.fillRect(60,30,200,150); gText(g, "GAME OVER", 160, 38, PAL.r, 10, "center"); T.highscores.arcade.slice(0,7).forEach(([n,s],i)=>gVT(g, `${i+1}. ${n.padEnd(9," ")} ${String(s).padStart(5," ")}`, 92, 60+i*16, s===G.score ? PAL.y : PAL.w, 16)); }
  };
  G.onClose = () => { if (opp) oppReact(opp, G.score > 1500, "Brick Breaker at the arcade"); };
  openGame("Pixel Palace · Brick Breaker", G);
}

// ---------- the barn dance ----------
function startDance(partner){
  const G = {kind:"dance", opp:partner, notes:[], score:0, combo:0, best:0, hits:0, misses:0, info:"Hit ← ↓ ↑ → (or A S W D) as the arrows reach the line."};
  const lanes = ["arrowleft","arrowdown","arrowup","arrowright"], alt = {a:0, s:1, w:2, d:3}, sym = ["←","↓","↑","→"], bpm = 120, beat = 60/bpm;
  G.start = () => { const rng = E.mulberry(T.day*31+7); let t = 2; while (t < 34){ G.notes.push({t, lane:Math.floor(rng()*4), hit:false}); if (rng()<.3) G.notes.push({t:t+beat/2, lane:Math.floor(rng()*4), hit:false}); t += beat * (rng()<.5 ? 1 : 2); } Snd.track("dance"); gameButtons([["Sit out", closeGame]]); };
  G.key = (k, down) => { if (!down || G.over) return; const lane = lanes.indexOf(k) >= 0 ? lanes.indexOf(k) : alt[k]; if (lane===undefined) return;
    const n = G.notes.find(x=>!x.hit && !x.miss && x.lane===lane && Math.abs(x.t-G.t) < .16);
    if (n){ n.hit = true; const p = Math.abs(n.t-G.t) < .06 ? "PERFECT" : "GOOD"; G.score += p==="PERFECT" ? 100 : 50; G.combo++; G.best = Math.max(G.best, G.combo); G.hits++; G.flash = {lane, p, t:G.t}; Snd.tone({f:[523,587,659,784][lane]*2, dur:.06, vol:.05, type:"triangle"}); }
    else { G.combo = 0; G.misses++; Snd.tone({f:150, dur:.05, vol:.04}); } };
  G.update = () => { for (const n of G.notes) if (!n.hit && !n.miss && G.t - n.t > .18){ n.miss = true; G.combo = 0; G.misses++; } if (!G.over && G.t > 36) G.finish(); };
  G.finish = () => {
    G.over = true; advanceTimeT(30); T.stats.dances++;
    const pct = G.hits / Math.max(1, G.notes.length);
    G.result = pct > .85 ? "You lit up the barn!" : pct > .6 ? "Not bad at all." : pct > .35 ? "You stepped on some toes." : "A disaster. A charming disaster.";
    for (const n of folk) if (alive(n) && insideOf(n)==="barn" && n!==partner){ n.opinion = clamp(n.opinion + (pct > .6 ? 3 : -1), -100, 100); if (Math.random()<.4) rememberT(n, `Watched the newcomer dance at the barn. ${G.result}`); }
    if (partner){ partner.opinion = clamp(partner.opinion + Math.round(pct*14), -100, 100); partner.trust = clamp(partner.trust+4,0,100); rememberT(partner, `Danced with the newcomer at the barn. ${pct > .6 ? "They swept me off my feet." : "They were sweet, if clumsy."}`); sayT(partner, pct > .6 ? "*breathless* Again sometime?" : "*laughs* You're hopeless. I loved it.", 4); }
    newsT(`The newcomer danced${partner ? ` with ${partner.first}` : ""} at the barn. ${G.result}`, partner ? [partner.id] : [], true);
    Snd.track(null);
    gameButtons([["Done", closeGame]]);
  };
  G.draw = (g) => {
    g.fillStyle = "#3e2a1c"; g.fillRect(0,0,GW,GH);
    for (let i=0;i<8;i++){ const on = Math.floor(G.t/beat + i)%2; g.fillStyle = on ? "#ffcd75" : "#b13e53"; g.fillRect(10+i*40, 6, 6, 6); }
    const lx = i => 90 + i*36, hy = 170;
    for (let i=0;i<4;i++){ g.fillStyle = "#5e3a24"; g.fillRect(lx(i)-14, 20, 28, 175); g.fillStyle = G.flash && G.flash.lane===i && G.t-G.flash.t < .15 ? PAL.y : "#8b5a3c"; g.fillRect(lx(i)-14, hy-2, 28, 4); gText(g, sym[i], lx(i), hy+8, PAL.l, 9, "center"); }
    for (const n of G.notes){ if (n.hit || n.miss) continue; const y = hy - (n.t - G.t)*140; if (y < 10 || y > GH) continue; g.fillStyle = PAL.k; g.fillRect(lx(n.lane)-11, y-7, 22, 14); g.fillStyle = ["#e07ab0","#41a6f6","#38b764","#ef7d57"][n.lane]; g.fillRect(lx(n.lane)-10, y-6, 20, 12); gText(g, sym[n.lane], lx(n.lane), y-4, PAL.w, 8, "center"); }
    gText(g, `${G.score}`, 6, 24, PAL.y, 8); gVT(g, `combo ${G.combo}`, 6, 40, PAL.w, 14);
    if (G.flash && G.t - G.flash.t < .4) gText(g, G.flash.p, 250, 90, G.flash.p==="PERFECT" ? PAL.y : PAL.g, 8, "center");
    if (partner){ const sway = Math.sin(G.t*Math.PI*2/beat)*3; g.fillStyle = PAL.k; g.fillRect(262+sway,130,12,20); g.fillStyle = partner.look.skin; g.fillRect(264+sway,122,8,8); gVT(g, partner.first, 248, 154, PAL.w, 14); }
    if (G.over) gText(g, G.result, 160, 90, PAL.y, 8, "center");
  };
  G.onClose = () => { Snd.track(null); };
  openGame(partner ? `Barn dance with ${partner.first}` : "Barn dance", G);
}

// ---------- odd jobs (hold E) ----------
const WORK = [
  {id:"dishes", bid:"diner", tiles:"k", label:"Hold: wash dishes", secs:6, pay:8, mins:45, boss:"diner owner"},
  {id:"stock", bid:"store", tiles:"H", label:"Hold: stock shelves", secs:6, pay:7, mins:40, boss:"shopkeeper"},
  {id:"sweep", bid:"barber", tiles:"c", label:"Hold: sweep up hair", secs:4, pay:5, mins:30, boss:"barber"},
  {id:"harvest", bid:null, tiles:"U", label:"Hold: pick crops", secs:5, pay:6, mins:40, boss:"farmer"},
  {id:"shelve", bid:"library", tiles:"I", label:"Hold: reshelve books", secs:5, pay:5, mins:35, boss:"librarian"},
  {id:"engine", bid:"garage", tiles:"m", label:"Hold: help fix the truck", secs:8, pay:12, mins:60, boss:"mechanic"},
  {id:"pews", bid:"church", tiles:"=", label:"Hold: polish the pews", secs:5, pay:4, mins:30, boss:"pastor"},
  {id:"mail", bid:"post", tiles:"H", label:"Hold: sort the mail", secs:5, pay:6, mins:40, boss:"postmaster"}
];
function workAt(x, y){
  const c = tileT(x,y), bid = buildingAt(x,y);
  const w = WORK.find(j => j.tiles.includes(c) && (j.bid ? bid===j.bid : !bid));
  if (!w) return null;
  const boss = folk.find(n=>alive(n) && n.job===w.boss);
  if (!boss) return null;
  const present = w.bid ? insideOf(boss)===w.bid : distT(boss, T.player) < 14;
  if (!present) return null;
  if ((T.workDone[w.id]||0) >= T.day*3) return null;
  return {w, boss};
}
function finishWork(job){
  const {w, boss} = job;
  T.workDone[w.id] = Math.max(T.workDone[w.id]||0, (T.day-1)*3) + 1;
  const pay = Math.min(w.pay + Math.floor(boss.trust/25), boss.money + 10);
  addMoney(pay, `${boss.first} pays you`); advanceTimeT(w.mins);
  boss.trust = clamp(boss.trust+2,0,100); boss.opinion = clamp(boss.opinion+2,-100,100);
  rememberT(boss, `The newcomer did some work for me (${w.label.replace("Hold: ","")}). ${pick(["Hard worker.","Didn't complain.","Did a fair job."])}`);
  T.stats.jobs++; sayT(boss, pick(["Good work.","Thanks, kid.","Same time tomorrow?","Not bad."]), 3);
  if (Math.random()<.3) gossipT(boss, "The newcomer's a hard worker, I'll say that.");
  if (isDet(boss)) addEvidence("Watched the newcomer work. Works like someone used to labor details.", 2, "work");
}

// ---------- shops ----------
const SHOPS = {
  store:{keeper:"shopkeeper", name:"Hartley's General", sell:["fishing rod","shovel","mop","bleach","rope","matches","flashlight","flowers","newspaper","lottery ticket","chocolate","hat","sunglasses","reading glasses","kitchen knife","baseball bat","book"], buys:true},
  diner:{keeper:"diner owner", alt:"short-order cook", name:"Blue Plate Diner", sell:["burger","sandwich","pie slice","apple pie","donut","coffee","milkshake"]},
  bar:{keeper:"bartender", name:"The Rusty Nail", sell:["beer","whiskey"], services:["round"]},
  barber:{keeper:"barber", name:"Clip Joint", services:["haircut","shave","dye"]},
  clinic:{keeper:"nurse", name:"Millbrook Clinic", services:["treat"]},
  post:{keeper:"postmaster", name:"Post Office", sell:["newspaper"], services:["mail"]},
  station:{keeper:"station master", name:"Millbrook Station", sell:["train ticket"], services:["times"]},
  hotel:{keeper:"hotel keeper", name:"Millbrook Arms", services:["rent"]},
  church:{keeper:"pastor", name:"St. Ambrose", services:["donate","confess"]},
  arcade:{keeper:"arcade owner", name:"Pixel Palace", sell:["milkshake","donut"]},
  garage:{keeper:"mechanic", name:"Rusty's Garage", sell:["wrench","rope","flashlight"]}
};
let shopId = null, shopTab = "buy";
function shopKeeper(id){ const s = SHOPS[id]; return folk.find(n=>alive(n) && (n.job===s.keeper || n.job===s.alt) && insideOf(n)===id && !n.away); }
function openShop(id){
  const s = SHOPS[id]; if (!s) return;
  const k = shopKeeper(id);
  if (!k){ toast(`Nobody's minding ${s.name}.`, "", 3); return; }
  closeTalkT(); closeTWindows(); shopId = id; shopTab = "buy"; $("tWinShop").hidden = false; sfx("open"); renderShop();
}
function priceFor(it, k){ const base = itemT(it).price; const disc = k ? clamp(1 - k.opinion/400 - (k.partner ? .15 : 0), .7, 1.25) : 1; return Math.max(1, Math.round(base*disc)); }
function renderShop(){
  const s = SHOPS[shopId], k = shopKeeper(shopId), body = $("tsBody"); body.textContent = "";
  if (!k){ closeTWindows(); toast("The shopkeeper walked off.", ""); return; }
  $("tsTitle").textContent = `${s.name} · ${k.first} behind the counter · You have $${Math.round(T.money)}`;
  const tabs = $("tsTabs"); tabs.textContent = "";
  for (const t of ["buy", s.buys ? "sell" : null].filter(Boolean)){ const b = Object.assign(document.createElement("button"),{type:"button", textContent:t==="buy"?"Buy":"Sell"}); b.setAttribute("aria-selected", String(shopTab===t)); b.addEventListener("click", ()=>{ shopTab = t; renderShop(); }); tabs.append(b); }
  const row = (icon, name, desc, price, label, fn, disabled) => {
    const r = document.createElement("div"); r.className = "recipe";
    const out = document.createElement("div"); out.className = "out"; const im = new Image(); im.src = icon; im.alt = "";
    const txt = document.createElement("div"); txt.append(Object.assign(document.createElement("b"),{textContent:name}), Object.assign(document.createElement("p"),{textContent:desc}));
    out.append(im, txt);
    const b = Object.assign(document.createElement("button"),{type:"button", className:"pbtn go", textContent:`${label} $${price}`}); b.disabled = !!disabled; b.addEventListener("click", fn);
    r.append(out, b); body.append(r);
  };
  if (shopTab==="sell"){
    const seen = new Set();
    for (const it of T.player.inv){ if (seen.has(it) || it==="room key") continue; seen.add(it); const p = Math.max(1, Math.round(itemT(it).price*.4)); row(iconOfT(it), it, itemT(it).desc, p, "Sell", ()=>sellItem(it, p, k)); }
    if (!seen.size) body.append(Object.assign(document.createElement("p"),{className:"note", textContent:"Nothing to sell."}));
    return;
  }
  for (const it of s.sell||[]){ const p = priceFor(it, k); row(iconOfT(it), it, itemT(it).desc, p, "Buy", ()=>buyItem(it, p, k), T.money < p); }
  for (const sv of s.services||[]){
    const d = SERVICES[sv]; const p = typeof d.price==="function" ? d.price(k) : d.price;
    row(E.iconUrl[d.icon] || iconOfT(d.icon), d.name, d.desc, p, d.verb||"Pay", ()=>{ if (T.money < p && p>0){ sfx("nope"); return; } d.run(k, p); renderShop(); }, (T.money < p && p>0) || (d.ok && !d.ok(k)));
  }
}
function buyItem(it, p, k){
  if (T.money < p){ sfx("nope"); return; }
  if (!canAddT(T.player.inv, it)){ toast("Your pockets are full.", "bad"); sfx("nope"); return; }
  addMoney(-p); k.money += p; addItemT(it, true); sfx("coin");
  k.opinion = clamp(k.opinion+1,-100,100);
  rememberT(k, `The newcomer bought ${it} from me.`);
  if (["shovel","bleach","rope","kitchen knife"].includes(it)){ T.purchases = (T.purchases||[]).concat({it, day:T.day}); const bad = T.purchases.filter(x=>T.day-x.day<=2 && ["shovel","bleach","rope"].includes(x.it)).length; if (bad >= 2){ rememberT(k, "The newcomer bought bleach AND a shovel. Or rope. Strange shopping list."); gossipT(k, "The newcomer's been buying bleach and shovels. What for?"); addEvidenceVia(k, `${k.first} says the newcomer bought ${T.purchases.slice(-2).map(x=>x.it).join(" and ")}.`, 8); } }
  if (it==="train ticket") rememberT(k, "Sold the newcomer a one-way ticket to the city.");
  renderShop(); renderHotbarT();
}
function sellItem(it, p, k){
  const i = T.player.inv.indexOf(it); if (i<0) return;
  T.player.inv.splice(i,1); k.inv.push(it); addMoney(p, `sold ${it}`); k.money = Math.max(0, k.money-p);
  if (/'s wallet$/.test(it) || it==="wallet"){ rememberT(k, `The newcomer sold me a wallet. Whose?`); addEvidenceVia(k, `${k.first} bought a wallet off the newcomer.`, 10); }
  if (PRISON_TELLTALE.has(it)){ rememberT(k, `The newcomer tried to sell me a ${it}. Looks like prison-made junk.`); addEvidenceVia(k, `${k.first} was sold a homemade ${it}. Prison work.`, 14); }
  renderShop(); renderHotbarT();
}
const SERVICES = {
  round:{name:"Buy a round for the bar", desc:"Everyone drinking here likes you a little more.", icon:"beer", price:15, verb:"Buy", run(k, p){ addMoney(-p); k.money += p; for (const n of folk) if (alive(n) && insideOf(n)==="bar"){ n.opinion = clamp(n.opinion+5,-100,100); rememberT(n, "The newcomer bought a round for the whole bar."); } T.drunk = Math.min(6, (T.drunk||0)+1); sfx("deal"); newsT("The newcomer bought a round at the Rusty Nail.", [k.id]); }},
  haircut:{name:"New haircut", desc:"Look less like a certain mugshot.", icon:"hat", price:8, verb:"Cut", run(k, p){ addMoney(-p); k.money += p; const styles = ["neat","buzz","slick","bob","short","curly","messy"]; T.player.look.style = pick(styles.filter(s=>s!==T.player.look.style)); T.player.disguise.cut = T.day; sfx("cut"); toast("Snip snip. You look like someone else.", "good"); rememberT(k, "Gave the newcomer a whole new look. Wanted it very different."); if (isDet(k)) addEvidence("The newcomer asked me to change their look completely.", 8, "disguise"); else addEvidenceVia(k, `${k.first} says the newcomer wanted to look completely different.`, 4); }},
  shave:{name:"Shave", desc:"Clean-shaven. Fresh.", icon:"razor blade", price:4, verb:"Shave", run(k, p){ addMoney(-p); k.money += p; T.player.look.beard = null; T.player.disguise.cut = T.day; toast("Smooth.", "good"); sfx("cut"); }},
  dye:{name:"Dye your hair", desc:"A new color. Harder to recognize.", icon:"hat", price:12, verb:"Dye", run(k, p){ addMoney(-p); k.money += p; T.player.look.hair = pick(["#1a1210","#c8a374","#ffcd75","#b13e53","#8b5a3c","#d8d6cf"].filter(c=>c!==T.player.look.hair)); T.player.disguise.dye = T.day; toast("A whole new you.", "good"); sfx("craft"); rememberT(k, "Dyed the newcomer's hair."); }},
  treat:{name:"Patch you up", desc:"Full health.", icon:"bandage", price:15, verb:"Treat", ok:()=>T.player.hp < 100, run(k, p){ addMoney(-p); k.money += p; T.player.hp = 100; sfx("craft"); toast("Good as new.", "good"); if (T.player.hp < 40) rememberT(k, "Treated the newcomer for a beating. Wouldn't say how."); }},
  mail:{name:"Check your mail", desc:"Anything for Room C?", icon:"letter", price:0, verb:"Check", run(k){ const n = T.mail.shift(); if (!n){ toast("Nothing for you.", ""); return; } addItemT("letter", true); T.letters.push(n); toast(`A letter: ${n.from}`, "news", 4); sfx("news"); }},
  times:{name:"Train times", desc:"8:00, 14:00 and 19:00, every day. One way to the city.", icon:"train ticket", price:0, verb:"Ask", run(k){ startTalkLine(k, `Trains at 8, 2 and 7. Ticket's $${itemT("train ticket").price}. Platform's out the back door.`); }},
  rent:{name:"Pay rent (one night)", desc:"Room C. Keep your key.", icon:"room key", price:15, verb:"Pay", run(k, p){ addMoney(-p); k.money += p; T.rentPaid = Math.max(T.rentPaid, T.day) + 1; toast(`Paid through day ${T.rentPaid}.`, "good"); if (T.evicted){ T.evicted = false; addItemT("room key", true); toast("The hotel keeper hands you a new key.", "good", 3); } k.opinion = clamp(k.opinion+2,-100,100); }},
  donate:{name:"Donate to the church", desc:"The pastor will mention it on Sunday.", icon:"flowers", price:10, verb:"Give", run(k, p){ addMoney(-p); k.money += p; T.notoriety = Math.max(0, T.notoriety-4); k.opinion = clamp(k.opinion+6,-100,100); for (const n of folk) if (n.churchgoer && alive(n)) n.opinion = clamp(n.opinion+1,-100,100); rememberT(k, `The newcomer donated $${p} to St. Ambrose.`); sfx("bell"); if (isDet(k)) addEvidence("Donations to the church. Guilt, or genuine?", -2, "church"); }},
  confess:{name:"Confession", desc:"Unburden yourself. (The pastor is bound to secrecy. Probably.)", icon:"book", price:0, verb:"Confess", run(k){ closeTWindows(); openTalkT(k, {approach:"The newcomer has asked to make a confession. You are bound by the seal of confession, and you take it seriously, unless you're secretly something else. Listen gently and invite them to speak."}); }}
};
function startTalkLine(n, text){ closeTWindows(); openTalkT(n); startTypeT(text, n); logLineT(n, "n", text); }

// ---------- the lottery ----------
function scratchTicket(){
  const pl = T.player, i = pl.inv.indexOf("lottery ticket"); if (i<0) return;
  pl.inv.splice(i,1); T.stats.tickets++;
  const r = Math.random();
  const win = r < .005 ? 500 : r < .03 ? 100 : r < .1 ? 20 : r < .25 ? 4 : 0;
  sfx("cut"); setTimeout(()=>sfx("cut"), 150);
  if (win){ setTimeout(()=>{ addMoney(win, "Scratch ticket!"); if (win >= 100){ banner(`$${win}!`, "The scratch ticket pays out!", false, 4); sfx("fanfare"); newsT(`The newcomer won $${win} on a scratch ticket.`, []); } }, 500); }
  else setTimeout(()=>toast("No luck. Three lemons.", "", 2), 500);
  renderHotbarT();
}
