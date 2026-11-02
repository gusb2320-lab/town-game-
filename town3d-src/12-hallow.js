// Hallowmere: the Halloween edition. Millbrook becomes a fog-bound medieval village during All Hallows' week.
// The rules of the game don't change; the names, the tone, the nights and the things in the fog do.
const HW = {};
if (HALLOW){
  THEME_NOTE = `SETTING (Halloween edition, overrides any modern detail below): Millbrook is a fog-bound medieval village in the week of All Hallows' Eve. Thatch and timber, torches and tallow candles, a gallows in the square, a graveyard that is too full. Shops are period trades (the Crooked Spoon cookhouse, the Hanged Man tavern, the apothecary, the smithy, the Reeve's gaol). Coins are silver. People speak plainly with old touches ("aye", "ye", "the Reeve", "God keep you"), are superstitious, and are frightened of the dark, of wolves, of the thing that walks at the edge of the fog, and of strangers. The tone is adult folk horror: dread, grief, paranoia and dark humor, never camp. Keep every rule and fact you are given.\n\n`;
  const NAMES = {diner:["The Crooked Spoon","COOKHOUSE"], store:["Hartley's Provisions","PROVISIONS"], barber:["The Barber-Surgeon","SURGEON"], clinic:["The Apothecary","APOTHECARY"], sheriff:["The Reeve's Gaol","GAOL"], post:["The Messenger's House","MESSENGERS"], hotel:["The Millbrook Arms","INN"], station:["The Coach House","COACHES"], bar:["The Hanged Man","HANGED MAN"], library:["The Scriptorium","SCRIPTORIUM"], arcade:["The Dice Cellar","DICE"], church:["St. Ambrose","ST AMBROSE"], garage:["The Smithy","SMITHY"], barn:["The Tithe Barn","TITHE BARN"]};
  const JOBS_H = {"diner owner":"keeper of the Crooked Spoon", "short-order cook":"cook at the Crooked Spoon", "shopkeeper":"provisioner", "bartender":"tapster at the Hanged Man", "barber":"barber-surgeon", "nurse":"apothecary", "postmaster":"messenger", "hotel keeper":"innkeeper", "station master":"coachman", "librarian":"scribe", "arcade owner":"keeper of the dice cellar", "pastor":"priest", "mechanic":"blacksmith", "farmer":"farmer", "fisherman":"fisherman", "painter":"painter of portraits", "retired schoolteacher":"old schoolmistress", "retiree who walks everywhere":"widow who walks the lanes", "teenager who lives at the arcade":"orphan who haunts the dice cellar", "traveling salesman who arrived last month":"traveling peddler who came last month"};
  for (const j of JOBS){ j.key = j.job; j.job = JOBS_H[j.job] || j.job; }
  onTownBuilt = () => {
    for (const b of BUILDINGS){ const nm = NAMES[b.id]; if (nm){ b.name = nm[0]; b.sign = nm[1]; } if (PLACES[b.id] && nm) PLACES[b.id].label = nm[0]; }
    // a gallows in the square: two posts that nothing walks through
    for (const [x,y] of [[35,43],[37,43]]) if (tmap[y] && tmap[y][x]==="q") tmap[y][x] = "X";
    // a bonfire pit
    if (tmap[44] && tmap[44][42]==="q") tmap[44][42] = "X";
    HW.gallows = [36,43]; HW.bonfire = [42,44];
    // nobody is sent to stand in the fire or between the posts
    for (const k in PLACES){ const pl = PLACES[k]; if (pl.spots) pl.spots = pl.spots.filter(([x,y]) => tileT(x,y)!=="X"); }
  };
  onNewDay = () => {
    if (T.day % 7 === 3){
      T.event = {day:T.day, kind:"hallows", label:"ALL HALLOWS' EVE", text:"All Hallows' Eve. Masks after dark, lanterns in every window, and a fire in the square to keep the dead in the ground."};
      newsT(T.event.text, [], true, "event"); banner("ALL HALLOWS' EVE", "Masks after dark. Lanterns in every window.", true, 6);
      for (const n of folk) if (alive(n)) rememberT(n, "It's All Hallows' Eve. Everyone wears a mask after dark. The dead are restless tonight, they say.");
    }
  };
  // masks after dark: who wears what, decided by who they are
  HW.MASKS = ["skull","plague","goat","porcelain","sack","crow"];
  HW.maskType = n => HW.MASKS[[...n.id].reduce((s,c)=>s*31+c.charCodeAt(0),7) % HW.MASKS.length];
  HW.masked = n => {
    if (!T || !n || n.dead) return false;
    const h = hourNow(), dark = h >= 19 || h < 6;
    if (!dark) return false;
    if (T.event && T.event.kind==="hallows" && T.event.day===T.day) return true;
    if (h < 6 && T.event && T.event.kind==="hallows" && T.event.day===T.day-1) return true;
    return rnd(parseInt(n.id.slice(1))||1, T.day, 77) < (isDet(n) ? .6 : .3);
  };
  // the medieval road to Millbrook
  Object.assign(CUTS, {intro(){
    const L = {suit:"o", skin:"#d49a6a", hair:"#3f2616", style:"short"};
    const moon = (g,x,y,r,t) => { g.fillStyle = "#e8e0c8"; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); g.fillStyle = "#c8bfa0"; g.beginPath(); g.arc(x-r*.35,y-r*.2,r*.12,0,7); g.fill(); g.beginPath(); g.arc(x+r*.3,y+r*.35,r*.09,0,7); g.fill(); const look = Math.sin(t*.8)*r*.06; g.fillStyle = "#1a1418"; g.fillRect(x-r*.42+look, y-r*.15, r*.22, r*.12); g.fillRect(x+r*.18+look, y-r*.15, r*.22, r*.12); g.fillRect(x-r*.3, y+r*.3, r*.6, r*.06); };
    return [
      {dur:4.5, sfx:"stinger", cap:"Cellblock Nine. A keep of black stone on a black hill. You drop from the wall into the moat at the hour of the wolf.", draw(g,t){
        sky(g,"#06050a","#16101a"); moon(g, 250, 40, 22, t); for (let i=0;i<40;i++) R_(g,(i*73)%CW,(i*37)%80,1,1,"#c8c0b0");
        R_(g,0,64,CW,90,"#1e1a22"); for (let x=0;x<CW;x+=14) R_(g,x,58,9,7,"#1e1a22"); R_(g,40,24,30,40,"#16131a"); R_(g,36,18,38,8,"#16131a"); R_(g,230,30,24,34,"#16131a");
        const fl = .6 + Math.sin(t*20)*.2; g.fillStyle = `rgba(255,140,40,${fl})`; g.fillRect(52,34,6,8); g.fillRect(240,42,5,7);
        R_(g,0,150,CW,30,"#0a1418"); for (let i=0;i<8;i++) R_(g,(i*41+t*20)%CW,156+(i%3)*5,10,1,"#1a3038");
        runner(g, 40 + t*40, 130, t, L);
      }},
      {dur:5, sfx:"grr", cap:"Hounds behind you. You run through the dead wood until your lungs burn and the trees stop looking like trees.", draw(g,t){
        sky(g,"#08080c","#141818"); R_(g,0,140,CW,40,"#0e1410");
        for (let i=0;i<12;i++){ const x = ((i*53 - t*80) % (CW+60) + CW+60) % (CW+60) - 30; R_(g,x,40+(i%3)*10,5,110,"#0c0a0c"); R_(g,x-12,60+(i%2)*14,14,3,"#0c0a0c"); R_(g,x+4,74+(i%3)*8,16,3,"#0c0a0c"); }
        g.fillStyle = "rgba(160,170,180,.12)"; for (let i=0;i<5;i++) g.fillRect(((i*90 - t*30) % 400 + 400) % 400 - 40, 120+i*6, 120, 14);
        runner(g, 150, 118, t, L);
        if (t > 3) { g.fillStyle = "#c01020"; g.fillRect(20, 110, 3, 2); g.fillRect(28, 110, 3, 2); }
      }},
      {dur:5.5, cap:"Dawn, grey as ash. A cart creaks along the road. The carter does not ask your name. *\"Millbrook's yonder. Lanterns are already up. It's Hallows' week.\"*", draw(g,t){
        sky(g,"#6a6460","#a8a090"); R_(g,0,110,CW,70,"#4a4a30"); R_(g,0,124,CW,22,"#5a4a38");
        const cx = Math.max(150, 330 - t*80);
        R_(g,cx,108,50,14,"#4a3020"); R_(g,cx,104,50,4,"#6a4830"); for (const wx of [10,40]){ g.fillStyle = "#2a1a10"; g.beginPath(); g.arc(cx+wx,124,8,0,7); g.fill(); g.fillStyle = "#6a4830"; g.beginPath(); g.arc(cx+wx,124,5,0,7); g.fill(); }
        R_(g,cx+52,100,24,14,"#2a2420"); R_(g,cx+70,94,8,10,"#2a2420"); R_(g,cx+56,114,3,12,"#2a2420"); R_(g,cx+70,114,3,12,"#2a2420");
        R_(g,cx+20,92,10,12,"#3a3a40"); R_(g,cx+20,86,10,7,"#c8a080"); R_(g,cx+17,84,16,4,"#2a2420");
        drawPerson(g, 120, 108, L, t > 2.4 ? [1,0] : [0,1], 0, {});
      }},
      {dur:5.5, cap:"Fields of rotting pumpkins. Crows on every post. A scarecrow turns its head as you pass. You tell yourself it didn't.", draw(g,t){
        sky(g,"#7a6a58","#b0a088"); R_(g,0,96,CW,84,"#3a3020");
        for (let r=0;r<6;r++) for (let i=0;i<14;i++){ const x = i*24 + (r%2)*12, y = 104 + r*12; R_(g,x,y,8,6,"#c86a18"); R_(g,x+3,y-2,2,2,"#3a5a20"); }
        R_(g,200,50,4,60,"#4a3020"); R_(g,184,62,36,4,"#4a3020"); R_(g,194,40,16,14,"#c8b080"); R_(g,190,36,24,4,"#2a2018");
        const turn = t > 3 ? 1 : 0; R_(g,197+turn*3,44,3,3,"#1a1010"); R_(g,204+turn*3,44,3,3,"#1a1010");
        for (let i=0;i<5;i++) R_(g,40+i*60,90,6,4,"#141014");
        drawPerson(g, 60 + t*20, 120, L, [1,0], Math.floor(t*6)%4, {});
      }},
      {dur:5, sfx:"bell", cap:"MILLBROOK, says the sign. Below it, carved deep with a knife: GO BACK.", draw(g,t){
        sky(g,"#5a5048","#8a8070"); R_(g,0,124,CW,56,"#3a3428");
        for (const [x,h,c] of [[30,30,"#5a4030"],[70,24,"#4a3a2a"],[110,36,"#5a4a3a"],[160,26,"#4a3020"],[200,30,"#5a4030"],[250,24,"#3a3020"]]){ R_(g,x,100-h,34,h,"#c8b898"); R_(g,x,100-h,34,3,"#3a2a1e"); R_(g,x,100-h,3,h,"#3a2a1e"); R_(g,x+31,100-h,3,h,"#3a2a1e"); g.fillStyle = c; g.beginPath(); g.moveTo(x-4,100-h); g.lineTo(x+17,84-h); g.lineTo(x+38,100-h); g.fill(); }
        R_(g,140,28,6,72,"#6a6a70"); g.fillStyle = "#6a6a70"; g.beginPath(); g.moveTo(134,30); g.lineTo(143,8); g.lineTo(152,30); g.fill();
        const sx = Math.max(60, 330 - t*110); R_(g,sx+30,76,4,50,"#3a2a1e"); R_(g,sx,60,70,30,"#4a3424"); gVT(g,"MILLBROOK",sx+6,62,"#e8d8b0",14); gVT(g,"GO BACK",sx+10,76,"#8a1020",13);
      }},
      {dur:4, hold:true, cap:"The Millbrook Arms. A room up a crooked stair. You have forty silver, a stolen life, and no name. Everyone here will want to know who you are.", enter(){ aliasPrompt(""); }, draw(g,t){
        sky(g,"#2a2420","#3a3028"); R_(g,0,40,CW,90,"#c8b898"); for (let x=0;x<CW;x+=40){ R_(g,x,40,4,90,"#3a2a1e"); } R_(g,0,40,CW,4,"#3a2a1e"); R_(g,0,86,CW,4,"#3a2a1e");
        for (let x=20;x<CW;x+=50){ R_(g,x,56,20,22,"#1a1410"); const fl = .7+Math.sin(t*9+x)*.2; g.fillStyle = `rgba(255,170,60,${fl})`; g.fillRect(x+2,58,16,18); R_(g,x+9,56,2,22,"#1a1410"); }
        R_(g,130,90,40,40,"#2a1a10"); R_(g,134,94,32,36,"#5a3a20"); gVT(g,"THE MILLBROOK ARMS",96,44,"#2a1a10",14);
        R_(g,0,130,CW,50,"#4a4440"); drawPerson(g, 148, 136, L, [0,-1], 0, {});
      }}
    ];
  }});
}
