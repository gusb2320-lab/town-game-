// Map: layout, buildings, furniture, containers, doors, tile art and roofs.
let tmap = [];
const BUILDINGS = [];
const DOOR_AT = {};       // "x,y" -> building id
const PLACES = {};        // routine destinations
const WALK_T = new Set(["g","G","r","s","p","q","d","b",".",",",":","y","D","u","v","U","z","B","c","S","n"]);
const SIGHT_T = new Set(["#","t","T","O","F","H","I","m","h","J"]);
const tileT = (x,y) => (x<0||y<0||x>=TW||y>=TH) ? "t" : tmap[y][x];

function buildTown(){
  tmap = []; for (let y=0;y<TH;y++) tmap.push(Array(TW).fill("g"));
  BUILDINGS.length = 0; for (const k in DOOR_AT) delete DOOR_AT[k]; for (const k in PLACES) delete PLACES[k];
  const R = (x0,y0,x1,y1,c) => { for (let y=y0;y<=y1;y++) for (let x=x0;x<=x1;x++) if (x>=0&&y>=0&&x<TW&&y<TH) tmap[y][x]=c; };
  const S = (x,y,c) => { if (x>=0&&y>=0&&x<TW&&y<TH) tmap[y][x]=c; };
  // wild edges
  for (let y=0;y<TH;y++) for (let x=0;x<TW;x++){
    const edge = x<2 || y<3 || x>=TW-2 || y>=TH-2;
    if (edge) tmap[y][x] = rnd(x,y,1)>.5 ? "T" : "t";
    else if (rnd(x,y,2)>.985) tmap[y][x] = "G";
  }
  // roads
  R(0,29,101,29,"s"); R(0,30,101,31,"r"); R(0,32,101,32,"s");
  R(49,3,49,81,"s"); R(50,3,51,81,"r"); R(52,3,52,81,"s");
  R(2,57,101,57,"s"); R(2,58,101,59,"r"); R(2,60,101,60,"s");
  R(50,29,51,32,"r"); R(50,57,51,60,"r");
  R(37,61,38,69,"p"); R(4,69,38,69,"p");
  // north-west woods with clearings
  for (let y=4;y<=15;y++) for (let x=3;x<=37;x++){ const v = rnd(x,y,7); tmap[y][x] = v>.55 ? (v>.8?"T":"t") : v<.12 ? "u" : "g"; }
  R(14,8,18,11,"u"); R(26,5,29,7,"u");
  // southern woods
  for (let y=70;y<=81;y++) for (let x=40;x<=76;x++){ const v = rnd(x,y,9); tmap[y][x] = v>.5 ? (v>.78?"T":"t") : v<.15 ? "u" : "g"; }
  R(56,74,60,77,"u"); R(44,72,47,74,"u"); R(66,78,70,80,"u");
  R(40,75,76,75,"p");
  // tracks and platform
  R(84,15,103,16,"z"); R(91,17,101,20,"q");
  // town square
  R(31,33,47,47,"q");
  R(38,39,40,41,"o"); S(39,34,"N");
  for (const [x,y] of [[33,36],[45,36],[33,44],[45,44]]) S(x,y,"n");
  for (const [x,y] of [[31,33],[47,33],[31,47],[47,47]]) S(x,y,"t");
  R(34,46,37,46,"G"); R(41,46,44,46,"G");
  // cemetery
  R(80,34,100,34,"f"); R(80,50,100,50,"f"); R(80,34,80,50,"f"); R(100,34,100,50,"f"); S(90,34,"p");
  for (let y=37;y<=48;y+=3) for (let x=83;x<=97;x+=3){ S(x,y, rnd(x,y,4)>.25 ? "V" : "v"); S(x,y+1, tileT(x,y)==="v" ? "v" : "g"); }
  R(84,47,88,48,"v");
  // junkyard
  R(66,5,80,5,"f"); R(66,12,80,12,"f"); R(66,5,66,12,"f"); R(80,5,80,12,"f"); S(66,9,"p");
  for (const [x,y] of [[69,7],[72,9],[75,7],[78,10],[70,11],[76,6]]) S(x,y,"J");
  // farm fields
  for (let y=71;y<=80;y++) for (let x=4;x<=18;x++) tmap[y][x] = (y%2) ? "U" : "p";
  // park and pond
  R(78,61,101,81,"g");
  for (let y=61;y<=81;y++) for (let x=78;x<=101;x++){
    const d = Math.hypot((x-90)/8.5, (y-71)/6.5);
    if (d < 1) tmap[y][x] = "w"; else if (d < 1.25) tmap[y][x] = "b"; else if (rnd(x,y,5)>.9) tmap[y][x] = "t"; else if (rnd(x,y,6)>.93) tmap[y][x] = "G";
  }
  R(89,63,90,68,"d");
  for (const [x,y] of [[82,62],[98,63],[81,78],[99,79]]) S(x,y,"n");
  // lamp posts
  for (let x=6;x<=98;x+=9){ if (tileT(x,28)!=="#") S(x,28,"l"); if (tileT(x,33)!=="#") S(x,33,"l"); }
  for (let x=8;x<=96;x+=11){ S(x,56,"l"); S(x,61,"l"); }

  // ---------- buildings ----------
  const B = (id, name, kind, x0,y0,x1,y1, door, extra={}) => {
    R(x0,y0,x1,y1,"#");
    R(x0+1,y0+1,x1-1,y1-1, extra.floor||".");
    const b = Object.assign({id, name, kind, x0,y0,x1,y1, door, residents:[], roof:extra.roof||"#8b4b3c", hours:extra.hours||null}, extra);
    S(door[0],door[1],"D"); DOOR_AT[door.join(",")] = id;
    BUILDINGS.push(b); return b;
  };
  const win = (b, list) => { for (const [x,y] of list) if (tileT(x,y)==="#") S(x,y,"x"); };
  // north side of Main Street
  let b;
  b = B("diner","Blue Plate Diner","diner",3,17,16,28,[9,28],{floor:",",roof:"#b13e53",hours:[6,21],sign:"DINER"});
  R(5,21,12,21,"C"); S(6,18,"k"); S(7,18,"k"); S(9,18,"F"); S(12,18,"Z"); S(10,18,"C"); S(15,18,"O");
  for (const x of [5,9,13]){ S(x,24,"K"); S(x,25,"S"); S(x,23,"S"); }
  S(15,26,"j"); win(b,[[5,28],[13,28],[3,23],[16,23]]); S(5,16,"Y"); S(6,16,"Y");
  b = B("store","Hartley's General","store",18,18,28,28,[23,28],{floor:",",roof:"#3b5dc9",hours:[8,19],sign:"GENERAL STORE"});
  R(20,26,22,26,"C"); R(20,20,22,20,"H"); R(24,20,26,20,"H"); R(20,23,22,23,"H"); R(24,23,26,23,"H"); S(27,19,"O"); win(b,[[20,28],[26,28]]); S(24,17,"Y");
  b = B("barber","Clip Joint","barber",30,21,36,28,[33,28],{floor:",",roof:"#ef7d57",hours:[9,18],sign:"BARBER"});
  S(32,23,"c"); S(34,23,"c"); R(31,22,35,22,"C"); S(31,26,"n"); S(35,26,"n"); win(b,[[31,28],[35,28]]);
  b = B("clinic","Millbrook Clinic","clinic",38,20,46,28,[42,28],{floor:",",roof:"#f4f4f4",hours:[8,18],sign:"CLINIC"});
  S(39,21,"B"); S(41,21,"B"); S(43,21,"B"); S(45,21,"O"); S(44,25,"W"); S(39,26,"P"); win(b,[[39,28],[45,28]]);
  b = B("sheriff","Sheriff's Office","sheriff",54,18,64,28,[58,28],{floor:",",roof:"#29366f",hours:[7,20],sign:"SHERIFF"});
  R(55,21,63,21,"|"); S(57,21,"D"); S(61,21,"D"); S(56,19,"n"); S(62,19,"n"); S(59,24,"W"); S(63,23,"O"); S(55,25,"O"); S(62,27,"P");
  DOOR_AT["57,21"] = "jail"; DOOR_AT["61,21"] = "jail"; win(b,[[56,28],[62,28],[54,25],[64,25]]);
  b = B("post","Post Office","post",66,21,73,28,[69,28],{floor:",",roof:"#5d275d",hours:[8,17],sign:"POST"});
  R(67,24,71,24,"C"); R(67,22,72,22,"H"); win(b,[[67,28],[72,28]]);
  b = B("hotel","Millbrook Arms","hotel",75,14,90,28,[82,28],{floor:":",roof:"#5e3a24",hours:[0,24],sign:"MILLBROOK ARMS"});
  R(76,22,89,22,"#"); S(80,15,"#"); for (let y=15;y<=21;y++){ S(80,y,"#"); S(85,y,"#"); }
  S(78,22,"D"); S(83,22,"D"); S(88,22,"D");
  DOOR_AT["78,22"] = "roomA"; DOOR_AT["83,22"] = "roomB"; DOOR_AT["88,22"] = "roomC";
  R(79,24,81,24,"C"); S(76,27,"S"); S(77,27,"S"); S(89,23,"P"); S(76,23,"P");
  for (const [x0,x1] of [[76,79],[81,84],[86,89]]){ S(x0,15,"B"); S(x1,15,"O"); S(x1,19,"W"); S(x0,20,"y"); win(b,[[x0+1,14]]); }
  win(b,[[77,28],[87,28]]);
  b = B("station","Millbrook Station","station",92,21,100,28,[96,28],{floor:",",roof:"#566c86",hours:[6,22],sign:"STATION"});
  S(96,21,"D"); DOOR_AT["96,21"] = "station"; R(94,23,96,23,"C"); for (const x of [93,95,97,99]) S(x,26,"n");
  // south side of Main Street
  b = B("bar","The Rusty Nail","bar",3,33,17,44,[10,33],{floor:".",roof:"#8b5a3c",hours:[14,26],sign:"RUSTY NAIL"});
  R(5,36,12,36,"e"); R(5,34,12,34,"H"); for (let x=5;x<=12;x+=2) S(x,37,"c");
  S(6,40,"K"); S(5,40,"c"); S(7,40,"c"); S(10,40,"K"); S(9,40,"c"); S(11,40,"c"); S(14,38,"Q"); S(16,35,"%"); S(4,43,"j");
  R(13,41,13,43,"#"); S(13,42,"D"); DOOR_AT["13,42"] = "barback"; S(16,43,"B"); S(14,43,"O");
  win(b,[[5,33],[15,33]]); S(8,45,"Y");
  b = B("library","Library","library",19,33,29,42,[24,33],{floor:":",roof:"#38b764",hours:[9,18],sign:"LIBRARY"});
  for (const y of [35,38]){ R(20,y,22,y,"I"); R(26,y,28,y,"I"); }
  S(21,40,"K"); S(25,40,"K"); S(27,41,"W"); win(b,[[20,33],[28,33]]);
  b = B("arcade","Pixel Palace","arcade",54,33,63,42,[58,33],{floor:":",roof:"#5d275d",hours:[11,23],sign:"ARCADE"});
  for (const x of [55,57,60,62]) S(x,35,"A"); S(55,39,"A"); S(57,39,"A"); R(60,40,62,40,"C"); win(b,[[55,33],[62,33]]);
  b = B("church","St. Ambrose","church",66,33,78,46,[72,33],{floor:".",roof:"#94b0c2",hours:[7,21],sign:"CHURCH"});
  for (const y of [37,39,41,43]){ R(68,y,71,y,"="); R(73,y,76,y,"="); }
  S(72,45,"+"); S(68,45,"&"); S(77,45,"O"); win(b,[[67,38],[67,42],[78,38],[78,42]]);
  // north
  b = B("garage","Rusty's Garage","garage",54,5,64,13,[54,9],{floor:",",roof:"#ef7d57",hours:[8,18],sign:"GARAGE"});
  R(57,8,59,9,"m"); S(63,6,"O"); R(61,12,63,12,"H"); win(b,[[58,5],[62,5]]);
  b = B("barn","Old Barn","barn",22,70,33,79,[27,70],{floor:".",roof:"#b13e53",hours:[0,24],sign:"BARN"});
  for (const [x,y] of [[23,71],[24,71],[31,71],[32,71],[23,78],[32,78],[24,78]]) S(x,y,"h");
  // homes
  const HOMES = [];
  const house = (id, x0, y0, doorSide) => {
    const x1 = x0+9, y1 = y0+8;
    const door = doorSide==="S" ? [x0+4,y1] : doorSide==="N" ? [x0+4,y0] : doorSide==="E" ? [x1,y0+4] : [x0,y0+4];
    const h = B(id, "", "home", x0,y0,x1,y1, door, {floor:".", roof:["#8b4b3c","#5e3a24","#3e4c63","#6b3a5c","#4a6b3a","#7a5a3c","#5a4a6a"][parseInt(id.slice(4))%7]});
    const top = doorSide!=="N", ix = x0+1, iy = y0+1;
    const yb = top ? iy : y1-1, yf = top ? y1-1 : iy, dy = top ? 1 : -1;
    S(ix, yb, "B"); S(ix+1, yb, "O"); S(ix+6, yb, "F"); S(ix+7, yb, "k"); S(ix+3, yb, "W");
    S(ix+5, yb+3*dy, "K"); S(ix+4, yb+3*dy, "c"); S(ix+6, yb+3*dy, "c");
    S(ix+6, yb+5*dy, "S"); S(ix+7, yb+5*dy, "S"); S(ix, yf, "P");
    for (let y=iy+1;y<=y1-2;y++) for (let x=ix+1;x<=ix+3;x++) if (tileT(x,y)===".") S(x,y,":");
    win(h, [[x0+2,y0],[x0+7,y0],[x0+2,y1],[x0+7,y1]].filter(p=>!(p[0]===door[0]&&p[1]===door[1])));
    if (doorSide==="S") S(door[0]+2, y1+1, "M"); else if (doorSide==="N") S(door[0]+2, y0-1, "M");
    HOMES.push(h); return h;
  };
  let hn = 0;
  for (const x0 of [4,15,26,54,65]) house("home"+(hn++), x0, 48, "S");
  for (const x0 of [4,15,26,54,65]) house("home"+(hn++), x0, 61, "N");
  house("home"+(hn++), 38, 5, "E");
  house("home"+(hn++), 84, 5, "S");
  // paths to the out-of-the-way homes
  R(48,9,48,9,"p"); R(88,14,88,14,"p"); R(88,13,88,13,"p");
  // places for routines
  for (const bd of BUILDINGS) PLACES[bd.id] = {label:bd.name||"a house", building:bd.id};
  Object.assign(PLACES, {roomA:{label:"Room A at the Millbrook Arms", building:"roomA"}, roomB:{label:"Room B at the Millbrook Arms", building:"roomB"}, roomC:{label:"your room at the Millbrook Arms", building:"roomC"}, barback:{label:"the back room of the Rusty Nail", building:"barback"}});
  Object.assign(PLACES, {
    square:{label:"Town Square", rect:[32,34,46,46]}, park:{label:"the park", rect:[79,61,100,80]}, pond:{label:"the pond", spots:[[89,66],[90,67],[89,67],[90,66],[82,70],[98,71],[90,77]]},
    farm:{label:"the fields", rect:[4,70,18,80]}, woods:{label:"the woods", rect:[40,70,76,81]}, cemetery:{label:"the cemetery", rect:[81,35,99,49]},
    junkyard:{label:"the junkyard", rect:[67,6,79,11]}, mainst:{label:"Main Street", rect:[2,29,100,32]}, elmst:{label:"Elm Street", rect:[3,57,100,60]},
    platform:{label:"the platform", rect:[91,17,101,20]}
  });
  for (const k in PLACES){ const p = PLACES[k]; if (p.rect && !p.spots){ p.spots = []; for (let y=p.rect[1];y<=p.rect[3];y++) for (let x=p.rect[0];x<=p.rect[2];x++) if (WALK_T.has(tileT(x,y)) && tileT(x,y)!=="D") p.spots.push([x,y]); } }
  // the player's room key opens Room C
  return HOMES;
}
function roomRect(id){
  if (id==="roomA") return [76,15,79,21];
  if (id==="roomB") return [81,15,84,21];
  if (id==="roomC") return [86,15,89,21];
  if (id==="barback") return [14,41,16,43];
  if (id==="jail") return [55,19,63,20];
  return null;
}
// Which building (or hotel room) a tile belongs to. Doors count as inside.
function buildingAt(x,y){
  const k = x+","+y; if (DOOR_AT[k]) return DOOR_AT[k]==="station" ? "station" : DOOR_AT[k];
  for (const id of ["roomA","roomB","roomC","barback","jail"]){ const r = roomRect(id); if (x>=r[0]&&x<=r[2]&&y>=r[1]&&y<=r[3]) return id; }
  for (const b of BUILDINGS) if (x>b.x0 && x<b.x1 && y>b.y0 && y<b.y1) return b.id;
  return null;
}
const bById = id => BUILDINGS.find(b=>b.id===id);
// The outer building a room belongs to, for roofs and light.
const outerOf = id => ["roomA","roomB","roomC"].includes(id) ? "hotel" : id==="barback" ? "bar" : id==="jail" ? "sheriff" : id;
function placeLabelAt(x,y){
  const b = buildingAt(x,y);
  if (b){ if (b==="roomC") return "Room C at the Millbrook Arms"; if (b.startsWith("room")) return "a hotel room"; if (b==="jail") return "the jail cells"; const bd = bById(outerOf(b)); if (bd.kind==="home"){ const r = folk.filter(n=>n.home===bd.id); return r.length ? `${r[0].first}'s house` : "an empty house"; } return bd.name; }
  for (const k of ["square","park","pond","cemetery","junkyard","farm","woods","platform","mainst","elmst"]){ const p = PLACES[k]; if (p.rect && x>=p.rect[0]&&x<=p.rect[2]&&y>=p.rect[1]&&y<=p.rect[3]) return p.label; }
  return "around town";
}
function randomSpot(placeId){
  const p = PLACES[placeId]; if (!p) return null;
  if (p.building){
    const id = p.building, r = roomRect(id), bd = bById(outerOf(id));
    const [x0,y0,x1,y1] = r ? r : [bd.x0+1, bd.y0+1, bd.x1-1, bd.y1-1];
    for (let i=0;i<50;i++){ const x = x0+Math.floor(Math.random()*(x1-x0+1)), y = y0+Math.floor(Math.random()*(y1-y0+1)); if (WALK_T.has(tileT(x,y)) && tileT(x,y)!=="D" && buildingAt(x,y)===id) return [x,y]; }
    return null;
  }
  return p.spots && p.spots.length ? pick(p.spots) : null;
}

// ---------- doors ----------
function residentsOf(bid){ return folk.filter(n => n.home===bid); }
function occupied(bid){ return folk.some(n => alive(n) && n.home===bid && buildingAt(n.x,n.y)===bid); }
function doorLockedT(x,y, who){
  const k = x+","+y, bid = DOOR_AT[k]; if (!bid) return false;
  if (T.unlocked[k] && T.unlocked[k] > absT()) return false;
  const h = hourNow(), pl = T.player;
  if (bid==="jail") return true;
  // you can always let yourself out of a building you're standing in
  if (who===pl && pl && buildingAt(pl.x,pl.y)===bid) return false;
  if (bid==="roomC") return !(who===pl ? pl.inv.includes("room key") : who && isDet(who) && who.order && who.order.lockpick);
  if (bid==="roomA"||bid==="roomB"||bid==="barback"){ if (who && who!==pl && who.home===bid) return false; if (who && isDet(who) && who.order && who.order.lockpick) return false; return true; }
  const bd = bById(bid);
  if (who && who!==pl){ if (who.home===bid || (who.work===bid)) return false; if (who.sheriff) return false; if (isDet(who) && who.order && who.order.lockpick) return false; }
  if (bd.kind==="home"){ if (T.mode==="slasher" && (T.panic||0) >= 40 && (!who || who===pl)) return true; const night = h>=21 || h<8; return night || !occupied(bid); }
  if (bd.hours){ const [o,c] = bd.hours; const hh = h < 4 ? h+24 : h; return !(hh>=o && hh<c); }
  return false;
}
const walkPlayer = (x,y) => WALK_T.has(tileT(x,y)) && !(tileT(x,y)==="D" && doorLockedT(x,y,T.player));
function npcWalkT(x,y,n){ const c = tileT(x,y); if (!WALK_T.has(c)) return false; if (c==="D") return !doorLockedT(x,y,n); return true; }

// ---------- containers ----------
const LOOT = {
  wardrobe:["hat","reading glasses","rope","flashlight","book","record","letter","sunglasses","matches"],
  fridge:["apple pie","sandwich","beer","milkshake","pie slice","coffee"],
  desk:["letter","book","matches","lottery ticket","newspaper","flashlight","record"],
  kitchen:["kitchen knife","coffee","matches","bleach"],
  junk:["wrench","rope","old boot","matches","shovel","metal scrap","wire"],
  dumpster:["old boot","newspaper","matches"],
  toolbox:["wrench","shovel","rope","flashlight","crowbar"],
  cabinet:["bandage","medicine","painkillers","vitamins"],
  crate:["bleach","mop","rope","shovel"],
  freezer:["burger","sandwich"]
};
function makeContainers(){
  const C = {};
  for (let y=0;y<TH;y++) for (let x=0;x<TW;x++){
    const c = tileT(x,y), bid = buildingAt(x,y), bd = bid && bById(outerOf(bid)), k = x+","+y;
    const home = bd && bd.kind==="home" ? bd.id : bid && (bid.startsWith("room")||bid==="barback") ? bid : null;
    const add = (name, loot, extra={}) => { C[k] = Object.assign({name, items:[], loot, home, bid}, extra); const n = Math.floor(Math.random()*3); for (let i=0;i<n && loot.length;i++) C[k].items.push(pick(loot)); };
    if (c==="O"){ if (bid==="clinic") add("Medicine cabinet", LOOT.cabinet); else if (bid==="garage") add("Toolbox", LOOT.toolbox); else if (bid==="store") add("Stock crate", LOOT.crate); else if (bid==="sheriff") add("Filing cabinet", ["letter"], {staff:true}); else if (bid==="church") add("Vestry closet", ["book","matches"]); else if (bid==="diner") add("Supply closet", LOOT.crate); else add("Wardrobe", LOOT.wardrobe, {hide:true}); }
    else if (c==="F") add("Fridge", LOOT.fridge);
    else if (c==="Z") add("Chest freezer", LOOT.freezer, {hide:true, cold:true});
    else if (c==="Y") add("Dumpster", LOOT.dumpster, {hide:true, dump:true});
    else if (c==="W"){ if (bid==="sheriff") add("Sheriff's desk", [], {staff:true}); else if (bid==="roomC") add("Your footlocker", [], {mine:true}); else add("Desk", LOOT.desk); }
    else if (c==="k" || (c==="C" && bid==="diner" && y===18)) add("Kitchen drawer", LOOT.kitchen);
    else if (c==="J") add("Junk pile", LOOT.junk);
    else if (c==="M") add("Mailbox", ["letter"]);
  }
  C["59,24"].items = ["case file","letter"];
  return C;
}
function boxKeyT(x,y){ return T.containers[x+","+y] ? x+","+y : null; }

// ---------- tile art ----------
const tmapCv = document.createElement("canvas"); tmapCv.width = TW*TS; tmapCv.height = TH*TS;
const tg = tmapCv.getContext("2d");
let tmapDirty = true;
const TF = (x,y,w,h,c) => { tg.fillStyle = c; tg.fillRect(x,y,w,h); };
function grassT(X,Y,x,y,dark){
  TF(X,Y,TS,TS, dark ? "#3d6e3c" : "#5a9a4e");
  for (let i=0;i<8;i++){ const px = (rnd(x,y,i+3)*15)|0, py = (rnd(x,y,i+13)*14)|0; TF(X+px,Y+py,1,2, rnd(x,y,i)>.55 ? "#7cc062" : "#4a8040"); }
}
function floorT(X,Y,x,y,c,bid){
  const bd = bid && bById(outerOf(bid));
  if (c===":"){ TF(X,Y,TS,TS,"#7a3045"); if ((x+y)%2===0) TF(X+6,Y+6,4,4,"#8e3a52"); TF(X,Y,TS,1,"#6a2a3c"); return; }
  if (c==="y"){ TF(X,Y,TS,TS,"#3b5dc9"); TF(X+2,Y+2,12,12,"#41a6f6"); TF(X+5,Y+5,6,6,"#3b5dc9"); return; }
  if (c===","){ const a = (x+y)&1; TF(X,Y,TS,TS, bd && bd.kind==="diner" ? (a?"#f4f4f4":"#b13e53") : bd && bd.id==="clinic" ? "#dce6ec" : (a?"#c2c8cc":"#aab2b8")); TF(X,Y,TS,1,"rgba(0,0,0,.1)"); return; }
  TF(X,Y,TS,TS,"#a87048"); TF(X,Y+((x*5)%4)*4,TS,1,"#8b5a3c"); TF(X+((y*7)%TS),Y,1,TS,"#93603c");
  if (rnd(x,y,3)>.8) TF(X+3,Y+9,3,1,"#8b5a3c");
}
function drawTileT(x,y){
  const c = tmap[y][x], X = x*TS, Y = y*TS, K = PAL.k, bid = buildingAt(x,y);
  switch (c){
    case "g": grassT(X,Y,x,y); return;
    case "G": grassT(X,Y,x,y); for (let i=0;i<4;i++) TF(X+2+((rnd(x,y,i)*12)|0), Y+2+((rnd(x,y,i+7)*12)|0), 2, 2, ["#ffcd75","#ef7d57","#f4f4f4","#e07ab0"][(x+y+i)%4]); return;
    case "r": TF(X,Y,TS,TS,"#4a4e5c"); for (let i=0;i<4;i++) TF(X+((rnd(x,y,i)*15)|0),Y+((rnd(x,y,i+5)*15)|0),1,1,"#5a5e6a");
      if ((y===30||y===58) && x%3===0) TF(X+2,Y+15,9,2,PAL.y); if ((x===50) && y%3===0) TF(X+15,Y+2,2,9,PAL.y); return;
    case "s": TF(X,Y,TS,TS,"#b8b0a0"); TF(X,Y,TS,1,"#9a9282"); TF(X,Y,1,TS,"#9a9282"); TF(X+8,Y,1,TS,"#a8a090"); return;
    case "p": TF(X,Y,TS,TS,"#9a7650"); for (let i=0;i<6;i++) TF(X+((rnd(x,y,i)*15)|0),Y+((rnd(x,y,i+5)*15)|0),1,1,rnd(x,y,i+2)>.5?"#b08a5e":"#7d5e3e"); return;
    case "u": TF(X,Y,TS,TS,"#6e4e30"); for (let i=0;i<8;i++) TF(X+((rnd(x,y,i)*15)|0),Y+((rnd(x,y,i+5)*15)|0),1,1,rnd(x,y,i+2)>.5?"#8b6440":"#4e3420"); return;
    case "v": grassT(X,Y,x,y); TF(X+3,Y+3,10,10,"#6e4e30"); TF(X+3,Y+3,10,1,"#8b6440"); return;
    case "U": TF(X,Y,TS,TS,"#7d5e3e"); for (let i=0;i<4;i++){ TF(X+1+i*4,Y+4,2,8,"#38b764"); TF(X+i*4,Y+3,1,2,"#a7f070"); TF(X+2+i*4,Y+2,1,2,"#ffcd75"); } return;
    case "q": TF(X,Y,TS,TS,"#c8b8a0"); TF(X,Y,TS,1,"#a89880"); TF(X,Y,1,TS,"#a89880"); TF(X,Y+8,8,1,"#a89880"); TF(X+8,Y+8,1,8,"#a89880"); return;
    case "d": TF(X,Y,TS,TS,"#41a6f6"); TF(X+1,Y,14,TS,"#a87048"); for (let i=3;i<TS;i+=4) TF(X+1,Y+i,14,1,"#8b5a3c"); TF(X+1,Y,1,TS,"#5e3a24"); TF(X+14,Y,1,TS,"#5e3a24"); return;
    case "b": TF(X,Y,TS,TS,"#e8d8a8"); for (let i=0;i<5;i++) TF(X+((rnd(x,y,i)*15)|0),Y+((rnd(x,y,i+5)*15)|0),1,1,"#c8b888"); return;
    case "w": { TF(X,Y,TS,TS,"#3b5dc9"); const sh = (x*3+y*5)%7; TF(X+sh,Y+4,5,1,"#41a6f6"); TF(X+((sh+7)%12),Y+11,4,1,"#41a6f6"); return; }
    case "z": TF(X,Y,TS,TS,"#7d7466"); TF(X,Y+3,TS,2,"#94b0c2"); TF(X,Y+11,TS,2,"#94b0c2"); for (let i=1;i<TS;i+=5) TF(X+i,Y+1,2,14,"#5e3a24"); return;
    case "t": case "T": grassT(X,Y,x,y,true); TF(X+6,Y+9,4,7,K); TF(X+7,Y+10,2,6,"#5e3a24");
      tg.fillStyle = K; tg.beginPath(); tg.arc(X+8,Y+6,7.5,0,7); tg.fill(); tg.fillStyle = c==="T" ? "#1f5a34" : "#2a7a3a"; tg.beginPath(); tg.arc(X+8,Y+6,6.5,0,7); tg.fill();
      tg.fillStyle = c==="T" ? "#2a6a3a" : "#38b764"; tg.beginPath(); tg.arc(X+6,Y+4,3.5,0,7); tg.fill(); return;
    case "f": grassT(X,Y,x,y); TF(X,Y+5,TS,2,"#8b5a3c"); TF(X,Y+10,TS,2,"#8b5a3c"); TF(X+2,Y+2,2,12,"#a87048"); TF(X+12,Y+2,2,12,"#a87048"); return;
    case "o": TF(X,Y,TS,TS,"#94b0c2"); TF(X+1,Y+1,14,14,"#41a6f6"); if (x===39&&y===40){ TF(X+5,Y+2,6,12,"#c2d3dc"); TF(X+7,Y,2,4,"#73eff7"); } return;
    case "N": TF(X,Y,TS,TS,"#c8b8a0"); TF(X+1,Y+1,14,11,K); TF(X+2,Y+2,12,9,"#a87048"); TF(X+3,Y+3,4,5,"#f4ecd8"); TF(X+9,Y+3,4,6,"#f4ecd8"); TF(X+3,Y+12,2,4,K); TF(X+11,Y+12,2,4,K); return;
    case "V": grassT(X,Y,x,y); TF(X+4,Y+3,8,11,K); TF(X+5,Y+4,6,9,"#94b0c2"); TF(X+5,Y+4,6,1,"#c2d3dc"); TF(X+7,Y+6,2,4,"#566c86"); TF(X+6,Y+7,4,1,"#566c86"); return;
    case "J": TF(X,Y,TS,TS,"#7d7466"); tg.fillStyle = K; tg.beginPath(); tg.arc(X+8,Y+10,7,Math.PI,0); tg.fill(); TF(X+3,Y+6,4,3,"#b13e53"); TF(X+8,Y+4,5,3,"#566c86"); TF(X+5,Y+9,6,2,"#8b5a3c"); return;
    case "l": TF(X,Y,TS,TS, y===28||y===33 ? "#b8b0a0" : "#b8b0a0"); TF(X+7,Y+3,2,13,K); TF(X+5,Y,6,4,K); TF(X+6,Y+1,4,2,PAL.y); return;
    case "M": grassT(X,Y,x,y); TF(X+7,Y+8,2,8,"#5e3a24"); TF(X+4,Y+3,8,6,K); TF(X+5,Y+4,6,4,"#3b5dc9"); TF(X+11,Y+2,1,4,PAL.r); return;
    case "Y": TF(X,Y,TS,TS,"#7d7466"); TF(X+1,Y+3,14,12,K); TF(X+2,Y+4,12,10,"#38734a"); TF(X+2,Y+4,12,2,"#4a8a5a"); TF(X+4,Y+8,8,1,"#2a5a3a"); return;
    case "n": TF(X,Y,TS,TS, tileT(x,y+1)==="q"||tileT(x,y-1)==="q" ? "#c8b8a0" : bid ? "#a87048" : "#5a9a4e"); TF(X,Y+5,TS,6,K); TF(X,Y+6,TS,3,"#a87048"); TF(X,Y+6,TS,1,"#c08a5a"); TF(X+2,Y+9,1,3,K); TF(X+13,Y+9,1,3,K); return;
    case "#": {
      const below = tileT(x,y+1);
      TF(X,Y,TS,TS,"#3a3446"); TF(X+1,Y+1,TS-2,TS-2,"#463e52");
      if (!"#x".includes(below)){ TF(X,Y+6,TS,10,"#c8a374"); for (let r=0;r<3;r++) TF(X,Y+8+r*3,TS,1,"#a8844e"); TF(X,Y+6,TS,1,"#e8d0a0"); TF(X,Y+15,TS,1,K); }
      return;
    }
    case "x": { TF(X,Y,TS,TS,"#3a3446"); TF(X,Y+6,TS,10,"#c8a374"); TF(X+3,Y+7,10,7,K); TF(X+4,Y+8,8,5,"#73eff7"); TF(X+4,Y+8,3,2,"#c2f0ff"); TF(X+8,Y+8,1,5,K); return; }
    case "D": floorT(X,Y,x,y,".",bid); TF(X,Y,2,TS,K); TF(X+14,Y,2,TS,K); TF(X+2,Y+14,12,2,"#5e3a24"); return;
    case "|": floorT(X,Y,x,y,",",bid); for (let i=1;i<TS;i+=3){ TF(X+i,Y,1,TS,K); TF(X+i+1,Y,1,TS,"#94b0c2"); } TF(X,Y+7,TS,2,"#566c86"); return;
  }
  // indoor floor under furniture
  const fl = bid ? (bById(outerOf(bid)).floor || ".") : ".";
  if (".,:y".includes(c)) { floorT(X,Y,x,y,c,bid); if (tileT(x,y-1)==="#"||tileT(x,y-1)==="x") TF(X,Y,TS,3,"rgba(15,16,30,.3)"); return; }
  floorT(X,Y,x,y, bid==="roomC"||bid==="roomA"||bid==="roomB" ? ":" : fl, bid);
  switch (c){
    case "B": TF(X+1,Y,14,16,K); TF(X+2,Y+1,12,14,"#f4f4f4"); TF(X+3,Y+2,10,3,"#ffffff"); TF(X+2,Y+6,12,9,["#b13e53","#3b5dc9","#38b764","#ef7d57"][(x*7+y)%4]); TF(X+2,Y+6,12,1,"rgba(255,255,255,.3)"); break;
    case "O": TF(X+1,Y,14,16,K); TF(X+2,Y+1,12,14,"#8b5a3c"); TF(X+8,Y+1,1,14,K); TF(X+6,Y+7,1,2,PAL.y); TF(X+10,Y+7,1,2,PAL.y); TF(X+2,Y+1,12,1,"#a87048"); break;
    case "F": TF(X+1,Y,14,16,K); TF(X+2,Y+1,12,14,"#e8ecf0"); TF(X+2,Y+6,12,1,K); TF(X+11,Y+2,1,3,PAL.m); TF(X+11,Y+8,1,4,PAL.m); break;
    case "Z": TF(X,Y+3,TS,12,K); TF(X+1,Y+4,14,10,"#e8ecf0"); TF(X+1,Y+4,14,3,"#c2d3dc"); TF(X+6,Y+8,4,1,PAL.m); break;
    case "C": case "e": TF(X,Y+1,TS,14,K); TF(X,Y+2,TS,7, c==="e" ? "#8b5a3c" : "#c2c8cc"); TF(X,Y+2,TS,1,"#ffffff55"); TF(X,Y+9,TS,5, c==="e" ? "#5e3a24" : "#8b9298");
      if (bid==="store" && x===21) { TF(X+4,Y+3,8,5,K); TF(X+5,Y+4,6,2,PAL.g); } if (c==="e" && x%2) { TF(X+5,Y,3,4,"#a7f070"); } break;
    case "k": TF(X+1,Y+1,14,14,K); TF(X+2,Y+2,12,12,"#566c86"); for (const [a,b2] of [[5,5],[11,5],[5,11],[11,11]]){ TF(X+a-2,Y+b2-2,4,4,K); TF(X+a-1,Y+b2-1,2,2,"#b13e53"); } break;
    case "K": TF(X,Y+12,TS,3,"rgba(15,16,30,.3)"); TF(X+1,Y+2,14,11,K); TF(X+2,Y+3,12,8,"#c08a5a"); TF(X+2,Y+3,12,1,"#e0aa70"); TF(X+5,Y+5,4,3,"#f4f4f4"); break;
    case "c": TF(X+4,Y+4,8,9,K); TF(X+5,Y+5,6,7,"#8b5a3c"); TF(X+5,Y+5,6,2,"#a87048"); break;
    case "S": TF(X,Y+3,TS,11,K); TF(X+1,Y+4,14,9,"#5d275d"); TF(X+1,Y+4,14,3,"#7a3a7a"); break;
    case "P": tg.fillStyle = K; tg.beginPath(); tg.arc(X+8,Y+6,5.5,0,7); tg.fill(); tg.fillStyle = PAL.G; tg.beginPath(); tg.arc(X+8,Y+6,4.5,0,7); tg.fill(); TF(X+5,Y+10,6,5,K); TF(X+6,Y+11,4,3,"#b85c3c"); break;
    case "W": TF(X,Y+1,TS,14,K); TF(X+1,Y+2,14,7,"#a87048"); TF(X+1,Y+9,14,5,"#5e3a24"); TF(X+3,Y+3,5,4,PAL.w); TF(X+10,Y+4,1,4,PAL.y); break;
    case "H": TF(X,Y,TS,15,K); TF(X+1,Y+1,14,13,"#8b5a3c"); TF(X+1,Y+7,14,1,K); for (let i=0;i<4;i++){ TF(X+2+i*3,Y+3,2,4,["#b13e53","#ffcd75","#38b764","#3b5dc9","#ef7d57"][(x+i)%5]); TF(X+2+i*3,Y+9,2,4,["#f4f4f4","#41a6f6","#a7f070","#c8a374"][(y+i)%4]); } break;
    case "I": TF(X,Y,TS,15,K); TF(X+1,Y+1,14,13,"#5e3a24"); TF(X+1,Y+7,14,1,K); for (let i=0;i<6;i++){ TF(X+2+i*2,Y+2,2,5,["#b13e53","#3b5dc9","#38b764","#ffcd75","#ef7d57","#94b0c2"][(x+i)%6]); TF(X+2+i*2,Y+8,2,5,["#41a6f6","#5d275d","#a7f070","#c8a374","#b13e53","#f4f4f4"][(x*3+i)%6]); } break;
    case "A": TF(X+1,Y,14,16,K); TF(X+2,Y+1,12,14,"#5d275d"); TF(X+3,Y+2,10,7,K); TF(X+4,Y+3,8,5,"#29366f"); TF(X+5,Y+4,2,2,PAL.y); TF(X+8,Y+5,3,1,PAL.c); TF(X+4,Y+11,2,2,PAL.r); TF(X+8,Y+11,2,2,PAL.g); break;
    case "j": TF(X+2,Y+1,12,15,K); TF(X+3,Y+2,10,13,"#b13e53"); TF(X+4,Y+3,8,5,PAL.y); TF(X+5,Y+9,6,4,"#ffcd75"); break;
    case "Q": TF(X,Y+2,TS,12,K); TF(X+1,Y+3,14,10,"#257179"); TF(X+3,Y+5,3,4,PAL.w); TF(X+9,Y+6,3,4,PAL.w); break;
    case "%": TF(X,Y,TS,TS,"#a87048"); tg.fillStyle = K; tg.beginPath(); tg.arc(X+8,Y+8,7,0,7); tg.fill(); tg.fillStyle = "#f4ecd8"; tg.beginPath(); tg.arc(X+8,Y+8,6,0,7); tg.fill(); tg.fillStyle = "#b13e53"; tg.beginPath(); tg.arc(X+8,Y+8,4,0,7); tg.fill(); tg.fillStyle = "#38b764"; tg.beginPath(); tg.arc(X+8,Y+8,2,0,7); tg.fill(); break;
    case "=": TF(X,Y+4,TS,9,K); TF(X,Y+5,TS,6,"#8b5a3c"); TF(X,Y+5,TS,1,"#a87048"); break;
    case "+": TF(X+1,Y+3,14,12,K); TF(X+2,Y+4,12,10,"#f4f4f4"); TF(X+7,Y+5,2,7,PAL.y); TF(X+5,Y+7,6,2,PAL.y); break;
    case "&": TF(X,Y+2,TS,13,K); TF(X+1,Y+3,14,6,"#1a1c2c"); for (let i=1;i<15;i+=2) TF(X+i,Y+9,1,5,"#f4f4f4"); break;
    case "m": { const left = tileT(x-1,y)!=="m", top = tileT(x,y-1)!=="m"; TF(X,Y,TS,TS,"#7d7466"); TF(X,Y+(top?2:0),TS,top?14:13,"#b13e53"); if (top) TF(X+(left?3:0),Y+3,left?13:16,5,"#73eff7"); TF(X,Y+(top?2:0),TS,1,K); if (!top){ TF(X+(left?3:9),Y+11,4,4,K); } break; }
    case "h": TF(X+1,Y+2,14,13,K); TF(X+2,Y+3,12,11,"#ffcd75"); TF(X+2,Y+6,12,1,"#c8a374"); TF(X+2,Y+10,12,1,"#c8a374"); break;
  }
}
function rebuildTownMap(){ tg.clearRect(0,0,tmapCv.width,tmapCv.height); for (let y=0;y<TH;y++) for (let x=0;x<TW;x++) drawTileT(x,y); tmapDirty = false; }

// ---------- roofs ----------
function roofRect(b){
  // the front wall (the side with the door) stays visible below the roof
  let {x0,y0,x1,y1} = b;
  if (b.door[1]===y1) y1 -= 1; else if (b.door[1]===y0) y0 += 1; else if (b.door[0]===x0) x0 += 1; else if (b.door[0]===x1) x1 -= 1;
  return [x0,y0,x1,y1];
}
function drawRoofs(c, insideId){
  const inside = insideId ? outerOf(insideId) : null;
  for (const b of BUILDINGS){
    if (b.id===inside) continue;
    const [x0,y0,x1,y1] = roofRect(b), X = x0*TS, Y = y0*TS - 6, W = (x1-x0+1)*TS, H = (y1-y0+1)*TS;
    const base = b.roof, dark = shade(base,-.3), light = shade(base,.2);
    c.fillStyle = PAL.k; c.fillRect(X-1,Y-1,W+2,H+2);
    c.fillStyle = base; c.fillRect(X,Y,W,H);
    c.fillStyle = dark; for (let yy=Y+4; yy<Y+H; yy+=5) c.fillRect(X,yy,W,1);
    for (let yy=Y+2, r=0; yy<Y+H; yy+=5, r++) for (let xx=X+(r%2?3:0); xx<X+W; xx+=7) c.fillRect(xx,yy,1,3);
    c.fillStyle = light; c.fillRect(X, Y+Math.floor(H/2)-1, W, 2);
    c.fillStyle = dark; c.fillRect(X, Y+H-2, W, 2);
    if (b.kind==="home"){ c.fillStyle = PAL.k; c.fillRect(X+W-14, Y+3, 8, 10); c.fillStyle = "#8b5a3c"; c.fillRect(X+W-13, Y+4, 6, 8); }
    if (b.id==="church"){ c.fillStyle = PAL.k; c.fillRect(X+W/2-4, Y-10, 8, 14); c.fillStyle = PAL.y; c.fillRect(X+W/2-1, Y-8, 2, 8); c.fillRect(X+W/2-3, Y-6, 6, 2); }
  }
}
