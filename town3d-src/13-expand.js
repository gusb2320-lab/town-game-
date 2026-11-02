// Hallowmere, expanded: the village doubles in every direction. East over the river lies the market quarter,
// the mill, the manor and thirty more homes; south of everything is the Blackwood, with the stone circle,
// the hanging tree, the bog, a wolf's den and, at its edge, Ashcombe House.
// Everything here is laid out with rnd() so the same map comes back when a save is loaded.
const XP = {};
if (HALLOW){
  // ---------- new trades ----------
  // key = the job's own name (they're medieval already); work = a building or place id; lives = sleeps at work
  const NEWJOBS = [
    {job:"baker", work:"bakehouse", hours:[4,14], items:["loaf of bread","loaf of bread"], apron:"#d8d0c0", early:true},
    {job:"baker's wife", work:"bakehouse", hours:[6,16], items:["loaf of bread","apple pie"], apron:"#d8d0c0"},
    {job:"butcher", work:"butcher", hours:[6,16], items:["smoked ham","kitchen knife"], apron:"#7a2a24"},
    {job:"chandler", work:"chandler", hours:[8,18], items:["tallow candles","matches"], apron:"#5a4a3a"},
    {job:"tailor", work:"tailor", hours:[8,17], items:["hat","rope"]},
    {job:"weaver", work:"tailor", hours:[7,16], items:["rope"]},
    {job:"cobbler", work:"cobbler", hours:[8,17], items:["rope"], apron:"#4a3424"},
    {job:"cooper", work:"cooper", hours:[7,16], items:["wrench"], apron:"#4a3424"},
    {job:"potter", work:"potter", hours:[8,17], items:["book"]},
    {job:"miller", work:"mill", hours:[5,17], items:["loaf of bread"], lives:"mill", early:true},
    {job:"miller's boy", work:"mill", hours:[6,15], items:["apple pie"], teen:true},
    {job:"stablemaster", work:"stables", hours:[5,18], items:["rope"], early:true},
    {job:"groom", work:"stables", hours:[6,17], items:["apple pie"]},
    {job:"lord of the manor", work:"manor", hours:[8,22], items:["whiskey","silver coin purse"], lives:"manor", sunday:true},
    {job:"lady of the manor", work:"manor", hours:[8,22], items:["flowers","book"], lives:"manor", sunday:true},
    {job:"steward of the manor", work:"manor", hours:[7,20], items:["letter","book"], lives:"manor"},
    {job:"cook at the manor", work:"manor", hours:[5,19], items:["kitchen knife","smoked ham"], lives:"manor", apron:"#d8d0c0", early:true},
    {job:"chambermaid at the manor", work:"manor", hours:[6,19], items:["bleach"], lives:"manor"},
    {job:"keeper of the Black Lamb", work:"blacklamb", hours:[12,26], items:["beer","whiskey"], lives:"blacklamb", nightOwl:true, sunday:true},
    {job:"serving hand at the Black Lamb", work:"blacklamb", hours:[16,25], items:["beer"], nightOwl:true},
    {job:"gate guard", work:"watchhouse", hours:[6,18], items:["baseball bat"], lives:"watchhouse", guard:true, sunday:true},
    {job:"gate guard", work:"eastgate", hours:[10,22], items:["baseball bat"], lives:"watchhouse", guard:true, sunday:true},
    {job:"watch sergeant", work:"watchhouse", hours:[8,20], items:["revolver"], lives:"watchhouse", guard:true},
    {job:"night watchman", work:"mainst", hours:[19,26], items:["lantern","baseball bat"], nightOwl:true, sunday:true, guard:true},
    {job:"gravedigger", work:"cemetery", hours:[7,17], items:["shovel"], sunday:true},
    {job:"bell-ringer", work:"church", hours:[6,13], items:["book"], early:true},
    {job:"monk of St. Ambrose", work:"church", hours:[5,12], items:["book","holy water"], pious:true, early:true},
    {job:"wise woman of the Blackwood", work:"wisehut", hours:[6,20], items:["wolfsbane","medicine"], lives:"wisehut", sunday:true},
    {job:"hunter", work:"blackwood", hours:[5,15], items:["hunting rifle","bullets"], lives:"lodge", early:true, sunday:true},
    {job:"woodcutter", work:"blackwood", hours:[6,16], items:["wrench"], early:true},
    {job:"woodcutter", work:"blackwood", hours:[7,17], items:["rope"]},
    {job:"charcoal burner", work:"blackwood", hours:[6,18], items:["matches"]},
    {job:"shepherd", work:"farm", hours:[5,16], items:["apple pie"], early:true, sunday:true},
    {job:"goatherd", work:"farm", hours:[6,15], items:["rope"]},
    {job:"beggar", work:"square", hours:[8,20], items:[], sunday:true},
    {job:"wandering minstrel", work:"eastmarket", hours:[11,23], items:["record"], nightOwl:true, sunday:true},
    {job:"washerwoman", work:"pond", hours:[7,15], items:["bleach"]},
    {job:"midwife", work:null, items:["bandage","medicine"]},
    {job:"rat-catcher", work:"mainst", hours:[9,18], items:["rope"]},
    {job:"fishmonger", work:"eastmarket", hours:[6,13], items:["trout","bass"], early:true},
    {job:"cheesemonger", work:"eastmarket", hours:[8,15], items:["sandwich"]},
    {job:"fruit seller", work:"eastmarket", hours:[8,15], items:["flowers"]},
    {job:"spice merchant from the south", work:"eastmarket", hours:[9,17], items:["chocolate"]},
    {job:"fortune teller", work:"eastmarket", hours:[14,24], items:["book"], nightOwl:true},
    {job:"scribe's apprentice", work:"library", hours:[9,17], items:["book"], teen:true},
    {job:"widow who keeps to herself", work:null, items:["flowers"]},
    {job:"widower who drinks", work:null, items:["whiskey"]},
    {job:"old soldier back from the wars", work:null, items:["kitchen knife"]},
    {job:"orphan who sleeps in the tithe barn", work:"square", hours:[8,19], items:[], teen:true}
  ];
  for (const j of NEWJOBS){ j.key = j.job; JOBS.push(j); }

  // ---------- new things to carry ----------
  Object.assign(TITEMS, {
    "loaf of bread":["Dark rye, still warm.",2,{heal:18}], "smoked ham":["A whole smoked ham hock.",6,{heal:28}],
    "tallow candles":["A bundle of smoky tallow candles.",2,{tool:1}], "lantern":["A horn lantern. Lights the way at night and in dark houses.",15,{tool:1}],
    "wolfsbane":["Purple hooded flowers. They say a wolf-touched man can't bear the smell.",8,{}],
    "holy water":["Blessed at St. Ambrose. Cold to the touch.",10,{}],
    "silver dagger":["Elspeth Ashcombe's silver dagger. It hums faintly. Silver bites what steel can't.",0,{weapon:30, silver:1, keep:1}],
    "sacrificial knife":["A curved black blade. Old blood in the grooves.",0,{weapon:24}],
    "silver coin purse":["Heavy with silver.",40,{}],
    // the cult
    "crimson robe":["A hooded robe of deep red wool, stitched inside with a horned moon. EVIDENCE: the cult.",0,{cult:1, evidence:1}],
    "blood ledger":["A ledger bound in stained leather. EVIDENCE: the cult.",0,{cult:1, read:1, evidence:1}],
    "ritual dagger":["Taken from the altar stone. Bone handle, horned-moon pommel. EVIDENCE: the cult.",0,{cult:1, weapon:20, evidence:1}],
    "bone sigil":["A horned moon carved from a finger bone, on a cord. EVIDENCE: the cult.",0,{cult:1, evidence:1}],
    // the house
    "Ashcombe diary":["A lady's diary, the last pages stuck together with something dark.",0,{read:1, keep:1}],
    "porcelain doll":["A cracked porcelain doll in a christening gown. Its eyes follow you.",0,{keep:1}],
    "small bones":["Small bones wrapped in a child's nightdress.",0,{keep:1}],
    // the wolf
    "wolf fur":["Coarse grey fur, longer than any wolf's. Torn from something.",0,{}]
  });
  E.addIcons({
    "loaf of bread":["........","..aaaa..",".aUaUaa.","aaaaaaaa","aUaaUaaa","aaaaaaaa",".uuuuuu.","........"],
    "smoked ham":["......ww","....kkww","..krrrk.",".krrrrrk","krrOrrrk","krrrrrk.",".kkkkk..","........"],
    "tallow candles":["..y..y..","..e..e..",".kek.ek.",".kek.ek.",".kek.ek.",".kek.ek.",".kkk.kk.","........"],
    "lantern":["...kk...","..k..k..",".kkkkkk.",".kyyyyk.",".kyOOyk.",".kyyyyk.",".kkkkkk.","........"],
    "wolfsbane":["..p..p..",".ppp.pp.","..p.ppp.","...pp...","...G....","..GG....","...G....","...G...."],
    "holy water":["...kk...","...ll...","..kBBk..",".kBwBBk.",".kBBBBk.",".kByBBk.",".kBBBBk.","..kkkk.."],
    "silver dagger":[".......w","......wl",".....wl.","....wl..","...wl...","..yy....",".kyk....","kyk....."],
    "sacrificial knife":[".......k","......kd","....kkd.","...kdd..","..kd....","..rr....",".kUk....","kUk....."],
    "silver coin purse":["........","...kk...","..kUUk..",".kUyyUk.",".kUyyUk.",".kUUUUk.","..kkkk..","........"],
    "crimson robe":["...kk...","..krrk..",".krrrrk.",".krkkrk.","krrrrrrk","krrrrrrk","krrrrrrk","kkkkkkkk"],
    "blood ledger":[".kkkkkk.",".kUUUUk.",".kUrrUk.",".kUrUUk.",".kUUrUk.",".kUUUUk.",".kkkkkk.","........"],
    "ritual dagger":[".......w","......wl",".....wl.","....wl..","...wl...","..ee....",".kek....","kek....."],
    "bone sigil":["e......e","ee....ee",".ee..ee.","..eeee..","..eeee..","...ee...","...k....","...k...."],
    "Ashcombe diary":[".kkkkkk.",".kppppk.",".kpyypk.",".kppppk.",".kprppk.",".kppppk.",".kkkkkk.","........"],
    "porcelain doll":["...ee...","..ekke..","..eeee..","...rr...","..wwww..",".wwwwww.",".wwwwww.","..w..w.."],
    "small bones":["........","e.e..e.e",".e....e.","e.eeee.e","..eeee..",".e....e.","e......e","........"],
    "wolf fur":["........",".l..l...","lml.lml.",".lmlmlm.","..lmlml.","...lml..","....l...","........"]
  });
  STACKT.add("loaf of bread"); STACKT.add("tallow candles"); STACKT.add("wolfsbane"); STACKT.add("holy water");

  // ---------- shops and work ----------
  Object.assign(SHOPS, {
    bakehouse:{keeper:"baker", alt:"baker's wife", name:"The Bakehouse", sell:["loaf of bread","apple pie","pie slice"]},
    butcher:{keeper:"butcher", name:"Grisewood's Butchery", sell:["smoked ham","sandwich","kitchen knife"]},
    chandler:{keeper:"chandler", name:"The Chandlery", sell:["tallow candles","lantern","matches"]},
    tailor:{keeper:"tailor", alt:"weaver", name:"The Tailor's", sell:["hat","reading glasses","rope"], buys:true},
    blacklamb:{keeper:"keeper of the Black Lamb", alt:"serving hand at the Black Lamb", name:"The Black Lamb", sell:["beer","whiskey","smoked ham","loaf of bread"]},
    wisehut:{keeper:"wise woman of the Blackwood", name:"the wise woman's hut", sell:["wolfsbane","medicine","bandage","holy water"]},
    lodge:{keeper:"hunter", name:"the hunter's lodge", sell:["hunting rifle","bullets","rope","lantern"], buys:true}
  });
  if (SHOPS.clinic) SHOPS.clinic.sell = (SHOPS.clinic.sell||[]).concat(["wolfsbane","bandage","medicine"]);
  if (SHOPS.church) SHOPS.church.sell = ["holy water"];
  const rename = {store:"Hartley's Provisions", diner:"The Crooked Spoon", bar:"The Hanged Man", barber:"The Barber-Surgeon", clinic:"The Apothecary", post:"The Messenger's House", station:"The Coach House", hotel:"The Millbrook Arms", arcade:"The Dice Cellar", garage:"The Smithy", church:"St. Ambrose"};
  for (const k in rename) if (SHOPS[k]) SHOPS[k].name = rename[k];
  WORK.push(
    {id:"knead", bid:"bakehouse", tiles:"k", label:"Hold: knead dough", secs:6, pay:7, mins:45, boss:"baker"},
    {id:"candles", bid:"chandler", tiles:"C", label:"Hold: dip candles", secs:6, pay:7, mins:45, boss:"chandler"},
    {id:"sacks", bid:"mill", tiles:"h", label:"Hold: haul flour sacks", secs:7, pay:9, mins:50, boss:"miller"},
    {id:"muck", bid:"stables", tiles:"h", label:"Hold: muck out the stalls", secs:6, pay:8, mins:45, boss:"stablemaster"},
    {id:"tables", bid:"blacklamb", tiles:"K", label:"Hold: wipe the tables", secs:4, pay:5, mins:30, boss:"keeper of the Black Lamb"},
    {id:"chop", bid:null, tiles:"t", label:"Hold: chop firewood", secs:7, pay:9, mins:50, boss:"woodcutter"},
    {id:"graves", bid:null, tiles:"v", label:"Hold: tend the graves", secs:5, pay:6, mins:40, boss:"gravedigger"}
  );

  // ---------- the map ----------
  XP.build = () => {
    const R = (x0,y0,x1,y1,c) => { for (let y=y0;y<=y1;y++) for (let x=x0;x<=x1;x++) if (x>=0&&y>=0&&x<TW&&y<TH) tmap[y][x]=c; };
    const S = (x,y,c) => { if (x>=0&&y>=0&&x<TW&&y<TH) tmap[y][x]=c; };
    const B = (id, name, kind, x0,y0,x1,y1, door, extra={}) => {
      R(x0,y0,x1,y1,"#"); R(x0+1,y0+1,x1-1,y1-1, extra.floor||".");
      const b = Object.assign({id, name, kind, x0,y0,x1,y1, door, residents:[], roof:extra.roof||"#5e3a24", hours:extra.hours||null}, extra);
      S(door[0],door[1],"D"); DOOR_AT[door.join(",")] = id;
      BUILDINGS.push(b); PLACES[id] = {label:name || "a house", building:id}; return b;
    };
    const win = list => { for (const [x,y] of list) if (tileT(x,y)==="#") S(x,y,"x"); };
    const winsAlong = b => { for (let x=b.x0+2; x<b.x1-1; x+=3){ win([[x,b.y0],[x,b.y1]]); } for (let y=b.y0+2; y<b.y1-1; y+=3){ win([[b.x0,y],[b.x1,y]]); } if (tileT(b.door[0],b.door[1])!=="D") S(b.door[0],b.door[1],"D"); for (const [dx,dy] of DIRS4){ const x = b.door[0]+dx, y = b.door[1]+dy; if (tileT(x,y)==="x") S(x,y,"#"); } };
    const house = (id, x0, y0, doorSide) => {
      const x1 = x0+9, y1 = y0+8;
      const door = doorSide==="S" ? [x0+4,y1] : [x0+4,y0];
      const h = B(id, "", "home", x0,y0,x1,y1, door, {floor:".", roof:["#8b4b3c","#5e3a24","#3e4c63","#6b3a5c","#4a6b3a","#7a5a3c","#5a4a6a"][parseInt(id.slice(4))%7]});
      const top = doorSide!=="N", ix = x0+1, iy = y0+1, yb = top ? iy : y1-1, yf = top ? y1-1 : iy, dy = top ? 1 : -1;
      S(ix, yb, "B"); S(ix+1, yb, "O"); S(ix+6, yb, "F"); S(ix+7, yb, "k"); S(ix+3, yb, "W");
      S(ix+5, yb+3*dy, "K"); S(ix+4, yb+3*dy, "c"); S(ix+6, yb+3*dy, "c");
      S(ix+6, yb+5*dy, "S"); S(ix+7, yb+5*dy, "S"); S(ix, yf, "P");
      for (let y=iy+1;y<=y1-2;y++) for (let x=ix+1;x<=ix+3;x++) if (tileT(x,y)===".") S(x,y,":");
      win([[x0+2,y0],[x0+7,y0],[x0+2,y1],[x0+7,y1]].filter(p=>!(p[0]===door[0]&&p[1]===door[1])));
      S(door[0]+2, doorSide==="S" ? y1+1 : y0-1, "M");
      return h;
    };
    // the far edges are forest
    for (let y=0;y<TH;y++) for (let x=0;x<TW;x++){ if (x<2 || y<3 || x>=TW-2 || y>=TH-2) tmap[y][x] = rnd(x,y,1)>.5 ? "T" : "t"; }
    for (let y=3;y<84;y++) for (let x=102;x<TW-2;x++) if (tmap[y][x]==="t"||tmap[y][x]==="T") tmap[y][x] = "g";
    // the river, with bridges
    for (let y=3;y<=124;y++){ const w = Math.round(Math.sin(y*.13)*1.2); for (let x=103+w; x<=105+w; x++) S(x,y,"w"); S(102+w,y, tileT(102+w,y)==="g" ? "b" : tileT(102+w,y)); S(106+w,y, tileT(106+w,y)==="g" ? "b" : tileT(106+w,y)); }
    // roads east: Main Street and Elm Street run on across the river; a road north to south on the far side
    R(102,29,TW-3,29,"s"); R(102,30,TW-3,31,"r"); R(102,32,TW-3,32,"s");
    R(102,57,TW-3,57,"s"); R(102,58,TW-3,59,"r"); R(102,60,TW-3,60,"s");
    for (let y=29;y<=32;y++) for (let x=100;x<=108;x++) if (tileT(x,y)==="w"||tileT(x,y)==="b") S(x,y,"d");
    for (let y=57;y<=60;y++) for (let x=100;x<=108;x++) if (tileT(x,y)==="w"||tileT(x,y)==="b") S(x,y,"d");
    R(139,3,139,84,"s"); R(140,3,141,84,"r"); R(142,3,142,84,"s"); R(140,29,141,32,"r"); R(140,57,141,60,"r");
    // lamps east
    for (let x=111;x<=176;x+=9){ if (tileT(x,28)==="g") S(x,28,"l"); if (tileT(x,33)==="g") S(x,33,"l"); S(x,56,"l"); S(x,61,"l"); }
    // north of Main Street, east
    let b;
    b = B("mill","The Mill","mill",110,6,118,14,[114,14],{floor:",",hours:[5,19],sign:"THE MILL"}); R(111,7,113,8,"h"); R(116,7,117,8,"h"); S(111,12,"O"); S(117,12,"K"); S(117,10,"B"); winsAlong(b); R(114,15,114,28,"p");
    b = B("stables","The Stables","stables",121,5,131,13,[126,13],{floor:".",hours:[5,20],sign:"STABLES"}); for (const x of [122,124,128,130]) S(x,7,"h"); R(122,10,123,11,"h"); winsAlong(b); R(126,14,126,28,"p");
    b = B("bakehouse","The Bakehouse","shop",109,19,117,28,[113,28],{floor:",",hours:[5,18],sign:"BAKEHOUSE"}); S(110,20,"k"); S(111,20,"k"); S(116,20,"F"); R(111,25,115,25,"C"); S(110,23,"H"); S(116,23,"K"); winsAlong(b);
    b = B("butcher","Grisewood's Butchery","shop",119,20,126,28,[122,28],{floor:",",hours:[6,17],sign:"BUTCHER"}); R(120,25,125,25,"C"); S(120,21,"Z"); S(125,21,"Z"); S(122,21,"H"); winsAlong(b);
    b = B("chandler","The Chandlery","shop",129,21,136,28,[132,28],{floor:".",hours:[8,18],sign:"CHANDLER"}); R(130,25,134,25,"C"); S(130,22,"H"); S(135,22,"I"); S(133,22,"W"); winsAlong(b);
    b = B("tailor","The Tailor's","shop",145,20,152,28,[148,28],{floor:":",hours:[8,17],sign:"TAILOR"}); R(146,25,150,25,"C"); S(146,21,"O"); S(151,21,"O"); S(148,21,"H"); winsAlong(b);
    b = B("blacklamb","The Black Lamb","tavern",155,17,168,28,[161,28],{floor:".",hours:[12,26],sign:"BLACK LAMB"});
    R(157,20,163,20,"e"); R(157,18,159,18,"H"); R(164,18,166,18,"I"); for (const [x,y] of [[158,23],[162,23],[166,23],[158,26],[166,26]]){ S(x,y,"K"); S(x-1,y,"c"); S(x+1,y,"c"); } S(167,19,"k"); S(156,19,"B"); winsAlong(b);
    b = B("watchhouse","The Watch House","watch",171,20,179,28,[175,28],{floor:",",hours:[0,24],sign:"WATCH"}); R(172,21,174,21,"B"); S(178,21,"O"); S(176,24,"W"); S(172,26,"K"); winsAlong(b);
    // the manor, behind its own wall
    b = B("manor","Ravensworth Manor","manor",150,3,172,14,[161,14],{floor:":",hours:[7,21],sign:"RAVENSWORTH"});
    R(158,4,158,13,"#"); R(164,4,164,13,"#"); S(158,9,"."); S(164,9,"."); S(158,11,"."); S(164,11,".");
    for (const x of [151,153,155]) S(x,4,"B"); S(157,4,"O"); S(151,8,"W"); S(156,8,"H"); S(151,12,"Z"); S(156,12,"k");
    S(160,5,"&"); R(160,8,162,8,"K"); S(159,8,"c"); S(163,8,"c"); S(161,12,"P"); S(159,12,"P");
    for (const x of [166,168,170]) S(x,4,"B"); S(171,6,"O"); S(166,9,"W"); S(170,9,"I"); S(170,12,"k"); S(166,12,"F");
    winsAlong(b); R(161,15,161,16,"p"); R(143,16,161,16,"p");
    for (const [x,y] of [[148,4],[148,8],[148,12],[174,5],[174,9],[174,13]]) S(x,y,"t");
    // south of Main Street, east
    b = B("cobbler","The Cobbler's","shop",109,33,115,40,[112,33],{floor:".",hours:[8,17],sign:"COBBLER"}); R(110,36,114,36,"C"); S(110,39,"H"); winsAlong(b);
    b = B("cooper","The Cooperage","shop",118,33,125,41,[121,33],{floor:".",hours:[7,16],sign:"COOPER"}); for (const [x,y] of [[119,38],[121,38],[123,38],[119,40]]) S(x,y,"j"); S(124,35,"W"); winsAlong(b);
    b = B("potter","The Potter's","shop",128,33,135,40,[131,33],{floor:",",hours:[8,17],sign:"POTTER"}); R(129,36,134,36,"C"); S(129,39,"I"); S(134,39,"k"); winsAlong(b);
    // the market: open stalls on cobbles
    R(145,34,171,46,"q");
    for (let x=147;x<=169;x+=4){ S(x,36,"8"); S(x,44,"8"); }
    for (const [x,y] of [[150,40],[166,40],[158,40]]) S(x,y,"n"); S(146,34,"N");
    PLACES.eastmarket = {label:"the market", rect:[145,34,171,46]};
    // east gate: an arch where Main Street leaves town
    S(TW-3,28,"#"); S(TW-3,33,"#");
    // homes east: two rows on Elm Street and a lane behind
    let hn = 100;
    for (const x0 of [110,121,132,145,156,167]) house("home"+(hn++), x0, 48, "S");
    for (const x0 of [110,121,132,145,156,167]) house("home"+(hn++), x0, 61, "N");
    R(108,71,178,71,"p");
    for (const x0 of [110,121,132,145,156,167]) house("home"+(hn++), x0, 72, "N");
    XP.homeCount = hn - 100;
    // ---------- the Blackwood ----------
    const W0 = 84;
    for (let y=W0;y<TH-2;y++) for (let x=2;x<TW-2;x++){
      if (tmap[y][x]!=="g" && tmap[y][x]!=="G" && tmap[y][x]!=="t" && tmap[y][x]!=="T") continue;
      const v = rnd(x,y,21), edge = y < W0+3 ? .35 : .62;
      tmap[y][x] = v < edge ? (rnd(x,y,22) > .55 ? "T" : "t") : v > .97 ? "u" : "g";
    }
    // paths through the trees
    const path = (pts) => { for (let i=0;i<pts.length-1;i++){ let [x,y] = pts[i]; const [tx,ty] = pts[i+1]; while (x!==tx || y!==ty){ if (x!==tx && (y===ty || rnd(x,y,23) > .5)) x += Math.sign(tx-x); else y += Math.sign(ty-y); for (const [dx,dy] of [[0,0],[1,0]]) if ("tTgu".includes(tileT(x+dx,y+dy))) S(x+dx,y+dy,"p"); } } };
    path([[50,82],[52,96],[48,110],[56,122],[62,130]]);
    path([[10,81],[14,96],[26,103]]);
    path([[8,120],[30,118],[56,122],[90,118],[120,116],[144,111],[176,116]]);
    path([[140,84],[142,100],[144,110]]);
    path([[90,118],[94,132],[95,139]]);
    path([[120,116],[124,138],[122,148]]);
    path([[179,61],[179,86],[168,87]]);
    path([[62,141],[70,152],[100,150],[122,148]]);
    // a plank bridge where the forest path crosses the river
    for (let y=115;y<=119;y++) for (let x=99;x<=110;x++) if ("wb".includes(tileT(x,y))) S(x,y,"d");
    for (let x=99;x<=110;x++) if (tileT(x,117)==="d" || "tTgu".includes(tileT(x,117))) S(x,117, tileT(x,117)==="d" ? "d" : "p");
    // clearings
    const clear = (cx, cy, r, c="g") => { for (let y=cy-r;y<=cy+r;y++) for (let x=cx-r;x<=cx+r;x++) if (Math.hypot(x-cx,y-cy) <= r + .3 && "tTgu".includes(tileT(x,y))) S(x,y,c); };
    // the stone circle
    clear(62, 136, 7);
    for (let k=0;k<9;k++){ const a = k/9*Math.PI*2; S(Math.round(62 + Math.cos(a)*5), Math.round(136 + Math.sin(a)*5), "5"); }
    S(62,136,"6"); XP.altar = [62,136];
    PLACES.stonecircle = {label:"the stone circle", rect:[57,131,67,141]};
    // the hanging tree
    clear(90, 112, 3); S(90,112,"9"); XP.hangTree = [90,112];
    PLACES.hangingtree = {label:"the hanging tree", rect:[87,109,93,115]};
    // the bog
    for (let y=118;y<=136;y++) for (let x=100;x<=118;x++){ const d = Math.hypot((x-109)/9, (y-127)/8) + (rnd(x,y,31)-.5)*.35; if (d < .75) S(x,y,"w"); else if (d < 1) S(x,y,"b"); }
    PLACES.bog = {label:"the bog", rect:[100,118,118,136]};
    // the wolf's den
    clear(150, 146, 5, "u");
    for (let k=0;k<14;k++){ const a = k/14*Math.PI*2 + .2; if (k%5===0) continue; S(Math.round(150 + Math.cos(a)*5), Math.round(146 + Math.sin(a)*4.4), "7"); }
    S(150,142,"7"); S(151,142,"7"); S(149,142,"7"); S(152,147,"J"); XP.den = [150,146];
    path([[122,148],[138,147],[146,144]]); S(146,144,"u"); S(147,144,"u");
    PLACES.wolfden = {label:"the wolf's den", rect:[145,142,155,150]};
    // huts and lodges
    clear(27, 106, 5);
    b = B("oldhut","the abandoned woodcutter's hut","hut",24,104,30,109,[27,104],{floor:".",hours:[0,24],roof:"#3a2a1a"}); S(25,105,"B"); S(29,108,"Z"); S(29,105,"W"); win([[24,106],[30,106]]);
    clear(95, 142, 5);
    b = B("wisehut","the wise woman's hut","hut",92,140,98,145,[95,140],{floor:".",hours:[6,21],roof:"#3a4a2a"}); S(93,141,"B"); S(97,141,"k"); R(93,144,97,144,"H"); S(97,143,"C"); win([[92,142],[98,142]]);
    clear(144, 113, 6);
    b = B("lodge","the hunter's lodge","hut",140,110,148,116,[144,110],{floor:".",hours:[6,20],roof:"#4a3020"}); S(141,111,"B"); S(147,111,"k"); S(141,115,"O"); S(146,115,"C"); S(147,115,"%"); win([[140,113],[148,113]]);
    clear(13, 132, 4); S(13,132,"4"); clear(40, 150, 3); S(40,150,"4"); clear(118, 100, 3); S(118,100,"4"); clear(170, 132, 4); S(170,132,"4"); clear(78, 98, 3); S(78,98,"4");
    clear(32, 140, 3); S(32,140,"4"); clear(132, 156, 3); S(132,156,"4");
    XP.caches = [[13,132],[40,150],[118,100],[170,132],[78,98],[32,140],[132,156]];
    // the forest graves nobody tends
    for (const [x,y] of [[70,96],[72,96],[74,97]]) S(x,y,"V");
    PLACES.blackwood = {label:"the Blackwood", rect:[4,88,180,159]};
    // ---------- Ashcombe House ----------
    clear(168, 95, 12, "g");
    b = B("ashcombe","Ashcombe House","haunted",158,89,178,101,[168,89],{floor:":",hours:[0,24],roof:"#222428",sign:"ASHCOMBE"});
    R(167,90,167,100,"#"); S(167,92,":"); S(167,98,":");
    R(168,95,177,95,"#"); S(172,95,":");
    // hall
    S(159,90,"&"); S(166,90,"O"); S(160,95,"S"); S(161,95,"S"); S(163,97,"K"); S(162,97,"c"); S(164,97,"c"); S(159,100,"k"); S(166,100,"%"); S(160,92,"P");
    // study
    S(176,90,"H"); S(175,90,"H"); S(172,92,"W"); S(171,92,"c"); S(169,90,"I"); S(176,93,"O");
    // nursery
    S(169,100,"B"); S(176,96,"Z"); S(170,96,"P"); S(177,99,"4"); S(173,100,"c");
    winsAlong(b);
    for (const [x,y] of [[160,88],[163,87],[174,88],[177,103],[160,103],[156,95],[180,96]]) S(x,y, "t");
    for (const [x,y] of [[158,103],[160,104],[162,103]]) S(x,y,"V");
    R(158,87,178,87,"f"); R(168,86,179,86,"p"); S(168,87,"p"); S(168,88,"p");
    XP.nursery = [177,99]; XP.house = b;
    // a path from the town to the forest's edge
    R(50,82,51,84,"p");
    PLACES.farmlane = {label:"the farm lane", rect:[4,69,38,71]};
    // new places need spots
    for (const k in PLACES){ const p = PLACES[k]; if (p.rect && !p.spots){ p.spots = []; for (let y=p.rect[1];y<=p.rect[3];y++) for (let x=p.rect[0];x<=p.rect[2];x++) if (WALK_T.has(tileT(x,y)) && tileT(x,y)!=="D") p.spots.push([x,y]); } }
    for (const k of ["mainst","elmst"]){ const p = PLACES[k]; p.rect = [p.rect[0], p.rect[1], TW-4, p.rect[3]]; p.spots = []; for (let y=p.rect[1];y<=p.rect[3];y++) for (let x=p.rect[0];x<=p.rect[2];x++) if (WALK_T.has(tileT(x,y))) p.spots.push([x,y]); }
    // the woods were a stand of trees; now they're the start of the Blackwood
    PLACES.woods.rect = [40,70,100,100]; PLACES.woods.spots = []; for (let y=70;y<=100;y++) for (let x=40;x<=100;x++) if (WALK_T.has(tileT(x,y))) PLACES.woods.spots.push([x,y]);
    PLACES.eastgate = {label:"the east gate", rect:[172,29,180,32]}; PLACES.eastgate.spots = []; for (let y=29;y<=32;y++) for (let x=172;x<=180;x++) PLACES.eastgate.spots.push([x,y]);
  };
  // chain onto the Hallowmere renames
  const before = onTownBuilt;
  onTownBuilt = () => { XP.build(); if (before) before(); };
  // free time: the east has its own haunts
  const fp0 = freePlace;
  freePlace = n => {
    const east = (bById(n.home) || {x0:0}).x0 > 100 || (n.work && ["eastmarket","blacklamb","bakehouse","butcher","chandler","tailor","cobbler","cooper","potter","manor","watchhouse","mill","stables"].includes(n.work));
    const r = Math.random();
    if (east && r < .45) return {place:pick(["eastmarket","eastmarket","blacklamb","blacklamb","mainst",n.home])};
    if (r < .12) return {place:pick(["eastmarket","blacklamb","cemetery","mill"])};
    return fp0(n);
  };
}
