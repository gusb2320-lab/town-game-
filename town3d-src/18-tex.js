// Hallowmere textures: everything is painted at load time on small canvases, kept crisp with nearest-neighbour
// filtering so the medieval village still reads as pixel art up close.
const HT = {cache:new Map(), redraw:[]};
function hCanvas(w, h){ const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.imageSmoothingEnabled = false; return [c, g]; }
function hTex(c, repeat, smooth){
  const t = new THREE.CanvasTexture(c);
  t.magFilter = smooth ? THREE.LinearFilter : THREE.NearestFilter; t.minFilter = THREE.LinearMipMapLinearFilter;
  t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  if (repeat){ t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
const hOnce = (key, make) => { let v = HT.cache.get(key); if (!v){ v = make(); HT.cache.set(key, v); } return v; };
const hRng = seed => E.mulberry ? E.mulberry(seed) : (() => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
// colour helpers
function hMix(a, b, t){ const A = new THREE.Color(a), B = new THREE.Color(b); return "#" + A.lerp(B, t).getHexString(); }
function hJit(col, r, amt){ const c = new THREE.Color(col), k = 1 + (r - .5) * amt; c.r = Math.min(1, c.r*k); c.g = Math.min(1, c.g*k); c.b = Math.min(1, c.b*k); return "#" + c.getHexString(); }
function hSpeck(g, x, y, w, h, base, cols, n, R){ g.fillStyle = base; g.fillRect(x, y, w, h); for (let i=0;i<n;i++){ g.fillStyle = cols[(R()*cols.length)|0]; g.fillRect(x + ((R()*w)|0), y + ((R()*h)|0), 1 + (R()<.3?1:0), 1); } }

// ---------- walls ----------
// a timber-framed panel the size of one wall tile (1 x 2.6): stone plinth, plaster, dark oak frame
function texTimber(plaster, beam, variant, seed){
  return hOnce(`timber:${plaster}:${beam}:${variant}:${seed%3}`, () => {
    const [c, g] = hCanvas(64, 166), R = hRng(seed*97 + variant*13 + 5);
    hSpeck(g, 0, 0, 64, 166, plaster, [hJit(plaster, .9, .14), hJit(plaster, .1, .18), hJit(plaster, .5, .3)], 900, R);
    // damp and soot
    const gr = g.createLinearGradient(0, 166, 0, 90); gr.addColorStop(0, "rgba(40,30,20,.45)"); gr.addColorStop(1, "rgba(40,30,20,0)"); g.fillStyle = gr; g.fillRect(0, 90, 64, 76);
    const gt = g.createLinearGradient(0, 0, 0, 30); gt.addColorStop(0, "rgba(20,16,14,.4)"); gt.addColorStop(1, "rgba(20,16,14,0)"); g.fillStyle = gt; g.fillRect(0, 0, 64, 30);
    // cracks
    g.strokeStyle = "rgba(50,40,30,.55)"; g.lineWidth = 1;
    for (let k=0;k<3;k++){ let x = 10 + R()*44, y = 50 + R()*80; g.beginPath(); g.moveTo(x, y); for (let s=0;s<5;s++){ x += (R()-.5)*8; y += 2 + R()*5; g.lineTo(x|0, y|0); } g.stroke(); }
    // frame
    const wood = (x, y, w, h) => { g.fillStyle = beam; g.fillRect(x, y, w, h); g.fillStyle = hJit(beam, .9, .5); for (let i=0;i<(w*h)/14;i++) g.fillRect(x + ((R()*w)|0), y + ((R()*h)|0), w > h ? 3 : 1, w > h ? 1 : 3); g.fillStyle = "rgba(0,0,0,.35)"; if (w > h) g.fillRect(x, y+h-1, w, 1); else g.fillRect(x+w-1, y, 1, h); };
    wood(0, 0, 64, 7); wood(0, 84, 64, 6); wood(0, 0, 6, 166); wood(58, 0, 6, 166);
    if (variant === 0){ g.save(); g.beginPath(); g.rect(6, 90, 52, 40); g.clip(); g.translate(6, 130); g.rotate(-.65); wood(0, -3, 72, 6); g.restore(); }
    if (variant === 1){ g.save(); g.beginPath(); g.rect(6, 7, 52, 77); g.clip(); g.translate(6, 84); g.rotate(-.98); wood(0, -3, 100, 6); g.restore(); g.save(); g.beginPath(); g.rect(6, 7, 52, 77); g.clip(); g.translate(58, 84); g.rotate(-2.16); wood(0, -3, 100, 6); g.restore(); }
    if (variant === 2){ wood(29, 7, 6, 77); }
    // pegs
    g.fillStyle = "#1a120c"; for (const [x,y] of [[2,3],[60,3],[2,87],[60,87]]) g.fillRect(x, y, 2, 2);
    // stone plinth
    texStonePaint(g, 0, 130, 64, 36, "#5a5650", R, 9);
    g.fillStyle = beam; g.fillRect(0, 128, 64, 3);
    return hTex(c);
  });
}
function texStonePaint(g, X, Y, W, H, base, R, rowH=14, moss=true){
  g.fillStyle = "#24221f"; g.fillRect(X, Y, W, H);
  for (let y = Y, row = 0; y < Y+H; y += rowH, row++){
    let x = X - (row % 2 ? (rowH*.8)|0 : 0);
    while (x < X+W){
      const w = (rowH*1.1 + R()*rowH*1.1)|0, col = hJit(base, R(), .35);
      g.fillStyle = col; g.fillRect(Math.max(X, x+1), y+1, Math.min(w-1, X+W-Math.max(X, x+1)), Math.min(rowH-1, Y+H-y-1));
      g.fillStyle = "rgba(255,255,240,.12)"; g.fillRect(Math.max(X, x+1), y+1, Math.max(0, Math.min(w-2, X+W-x-2)), 1);
      g.fillStyle = "rgba(0,0,0,.22)"; g.fillRect(Math.max(X, x+1), y+rowH-2, Math.max(0, Math.min(w-1, X+W-x-1)), 1);
      for (let i=0;i<6;i++){ g.fillStyle = R() < .5 ? "rgba(0,0,0,.15)" : "rgba(255,255,255,.07)"; g.fillRect(x + ((R()*w)|0), y + 1 + ((R()*(rowH-2))|0), 1, 1); }
      x += w;
    }
  }
  if (moss) for (let i=0;i<W*1.4;i++){ const yy = Y + H - ((R()*R()*H*.6)|0); g.fillStyle = R() < .5 ? "rgba(70,90,40,.6)" : "rgba(50,70,30,.5)"; g.fillRect(X + ((R()*W)|0), yy, 1 + (R()<.4?1:0), 1); }
}
function texStone(base, seed){
  return hOnce(`stone:${base}:${seed%2}`, () => {
    const [c, g] = hCanvas(64, 166), R = hRng(seed*31 + 7);
    texStonePaint(g, 0, 0, 64, 166, base, R, 14);
    // streaks of soot and water
    for (let i=0;i<5;i++){ const x = (R()*60)|0, gr = g.createLinearGradient(0, 0, 0, 166); gr.addColorStop(0, "rgba(10,10,10,.35)"); gr.addColorStop(1, "rgba(10,10,10,0)"); g.fillStyle = gr; g.fillRect(x, 0, 2 + (R()*3|0), 60 + R()*100); }
    return hTex(c);
  });
}
function texPlanks(base, seed){
  return hOnce(`planks:${base}:${seed%2}`, () => {
    const [c, g] = hCanvas(64, 166), R = hRng(seed*11 + 3);
    let x = 0; while (x < 64){ const w = 9 + (R()*4|0), col = hJit(base, R(), .3); g.fillStyle = col; g.fillRect(x, 0, w, 166); g.fillStyle = hJit(col, .2, .4); for (let i=0;i<40;i++) g.fillRect(x + 1 + ((R()*(w-2))|0), (R()*166)|0, 1, 4 + (R()*10|0)); g.fillStyle = "#120c08"; g.fillRect(x+w-1, 0, 1, 166); g.fillStyle = "#2a2a2a"; g.fillRect(x+2, 20, 1, 1); g.fillRect(x+2, 140, 1, 1); x += w; }
    const gr = g.createLinearGradient(0, 166, 0, 110); gr.addColorStop(0, "rgba(20,16,10,.5)"); gr.addColorStop(1, "rgba(20,16,10,0)"); g.fillStyle = gr; g.fillRect(0, 110, 64, 56);
    return hTex(c);
  });
}
function texDoor(){
  return hOnce("door", () => {
    const [c, g] = hCanvas(48, 96), R = hRng(42);
    let x = 0; while (x < 48){ const w = 8 + (R()*3|0); g.fillStyle = hJit("#4a3020", R(), .3); g.fillRect(x, 0, w, 96); g.fillStyle = "rgba(0,0,0,.25)"; for (let i=0;i<20;i++) g.fillRect(x + 1 + ((R()*(w-2))|0), (R()*96)|0, 1, 5); g.fillStyle = "#170e08"; g.fillRect(x+w-1, 0, 1, 96); x += w; }
    for (const y of [16, 74]){ g.fillStyle = "#26262a"; g.fillRect(0, y, 40, 5); g.fillStyle = "#4a4a50"; g.fillRect(0, y, 40, 1); for (let sx=3; sx<40; sx+=7){ g.fillStyle = "#5a5a60"; g.fillRect(sx, y+1, 2, 2); } }
    g.strokeStyle = "#3a3a40"; g.lineWidth = 2; g.beginPath(); g.arc(38, 50, 4, 0, Math.PI*2); g.stroke(); g.fillStyle = "#26262a"; g.fillRect(36, 44, 4, 3);
    return hTex(c);
  });
}
// leaded glass: lattice of diamonds; the glow map lights only the panes
function texGlass(glow){
  return hOnce("glass:"+glow, () => {
    const [c, g] = hCanvas(32, 32), R = hRng(glow ? 9 : 8);
    g.fillStyle = glow ? "#000" : "#283430"; g.fillRect(0, 0, 32, 32);
    for (let j=-1;j<5;j++) for (let i=-1;i<5;i++){
      const cx = i*8 + (j%2 ? 4 : 0), cy = j*8;
      g.fillStyle = glow ? hMix("#ffb050", "#ffe0a0", R()) : hJit("#4a5a54", R(), .5);
      g.beginPath(); g.moveTo(cx, cy-4); g.lineTo(cx+4, cy); g.lineTo(cx, cy+4); g.lineTo(cx-4, cy); g.fill();
    }
    g.strokeStyle = "#141414"; g.lineWidth = 1;
    for (let k=-32;k<64;k+=8){ g.beginPath(); g.moveTo(k, 0); g.lineTo(k+32, 32); g.stroke(); g.beginPath(); g.moveTo(k, 32); g.lineTo(k+32, 0); g.stroke(); }
    g.fillStyle = "#141414"; g.fillRect(0, 0, 32, 2); g.fillRect(0, 30, 32, 2); g.fillRect(0, 0, 2, 32); g.fillRect(30, 0, 2, 32); g.fillRect(15, 0, 2, 32);
    return hTex(c);
  });
}

// ---------- roofs ----------
function texThatch(seed){
  return hOnce("thatch:"+(seed%2), () => {
    const [c, g] = hCanvas(128, 64), R = hRng(seed + 101);
    g.fillStyle = "#5a4a2c"; g.fillRect(0, 0, 128, 64);
    for (let row=0; row<4; row++){
      const y0 = row*16;
      for (let i=0;i<520;i++){ const x = (R()*128)|0, y = y0 + ((R()*16)|0), len = 3 + (R()*6|0); g.fillStyle = ["#7a6436","#8a7444","#4a3a20","#6a5630","#9a8450","#3a2e1a"][(R()*6)|0]; g.fillRect(x, y, 1, Math.min(len, y0+16-y)); }
      g.fillStyle = "rgba(20,14,8,.55)"; g.fillRect(0, y0+14, 128, 2);
      g.fillStyle = "rgba(255,230,160,.08)"; g.fillRect(0, y0, 128, 2);
    }
    for (let i=0;i<14;i++){ const x = R()*128, y = R()*64, r = 3 + R()*7; for (let k=0;k<r*r;k++){ g.fillStyle = R() < .5 ? "rgba(60,80,30,.45)" : "rgba(40,50,24,.4)"; g.fillRect((x + (R()-.5)*r*2)|0, (y + (R()-.5)*r)|0, 1, 1); } }
    return hTex(c, true);
  });
}
function texSlate(base){
  return hOnce("slate:"+base, () => {
    const [c, g] = hCanvas(64, 64), R = hRng(77);
    g.fillStyle = "#16181c"; g.fillRect(0, 0, 64, 64);
    for (let row=0; row<8; row++){
      const y = row*8, off = row%2 ? 5 : 0;
      for (let x=-off; x<64; x+=10){
        if (R() < .03) continue;
        const col = hJit(base, R(), .35);
        g.fillStyle = col; g.fillRect(x+1, y, 9, 7);
        g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(x+1, y, 9, 1);
        g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(x+1, y+6, 9, 1);
        if (R() < .15){ g.fillStyle = "rgba(150,160,90,.5)"; g.fillRect(x+2 + (R()*6|0), y+2 + (R()*3|0), 2, 1); }
      }
    }
    return hTex(c, true);
  });
}
// A gable roof with real UVs (in world units, so textures repeat at a steady scale) and wall-textured gable ends.
// Ridge along x, length L; depth D; height h; eaves overhang `ov`.
function gableGeo(L, D, h, ov){
  const Lo = L/2 + ov, Do = D/2 + ov, ye = -ov * h / (D/2), slope = Math.hypot(Do, h - ye);
  const P = [], U = [], idx = [];
  const quad = (a, b, c2, d, ua, ub, uc, ud) => { const i = P.length/3; P.push(...a, ...b, ...c2, ...d); U.push(...ua, ...ub, ...uc, ...ud); idx.push(i, i+1, i+2, i, i+2, i+3); };
  // north slope (z < 0) and south slope (z > 0)
  quad([-Lo, ye, -Do], [-Lo, h, 0], [Lo, h, 0], [Lo, ye, -Do], [0, 0], [0, slope], [L+2*ov, slope], [L+2*ov, 0]);
  quad([Lo, ye, Do], [Lo, h, 0], [-Lo, h, 0], [-Lo, ye, Do], [0, 0], [0, slope], [L+2*ov, slope], [L+2*ov, 0]);
  const slopeCount = idx.length;
  // gable ends
  const tri = (a, b, c2, ua, ub, uc) => { const i = P.length/3; P.push(...a, ...b, ...c2); U.push(...ua, ...ub, ...uc); idx.push(i, i+1, i+2); };
  tri([-L/2, 0, D/2], [-L/2, h, 0], [-L/2, 0, -D/2], [0, 0], [D/2, h/2.6], [D, 0]);
  tri([L/2, 0, -D/2], [L/2, h, 0], [L/2, 0, D/2], [0, 0], [D/2, h/2.6], [D, 0]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  geo.addGroup(0, slopeCount, 0); geo.addGroup(slopeCount, idx.length - slopeCount, 1);
  return geo;
}

// ---------- the ground ----------
// A medieval repaint of the town map: mud and cobbles, dead grass and leaves, flagstones, black water.
function hwPaintGround(){
  const [c, g] = hCanvas(TW*TS, TH*TS);
  const F = (x,y,w,h,col) => { g.fillStyle = col; g.fillRect(x,y,w,h); };
  const LEAF = ["#7a3a14","#8e4a18","#5e2a10","#a0601c","#6a4a1a"];
  const grass = (X, Y, x, y, dark) => {
    F(X, Y, TS, TS, dark ? "#2e3120" : hJit("#4a4a2c", rnd(x,y,1), .12));
    for (let i=0;i<10;i++){ const px = (rnd(x,y,i+3)*15)|0, py = (rnd(x,y,i+13)*14)|0; F(X+px, Y+py, 1, 2, rnd(x,y,i) > .5 ? (dark ? "#3e4228" : "#6a6438") : (dark ? "#22251a" : "#3a3a22")); }
    for (let i=0;i<3;i++) if (rnd(x,y,i+40) > .55) F(X + ((rnd(x,y,i+41)*14)|0), Y + ((rnd(x,y,i+42)*14)|0), 2, 1, LEAF[(rnd(x,y,i+43)*5)|0]);
  };
  const cobble = (X, Y, x, y, base, size) => {
    F(X, Y, TS, TS, "#1e1c1a");
    const s = size || 4;
    for (let j=0;j<TS;j+=s) for (let i=-(j/s%2 ? s/2 : 0); i<TS; i+=s){
      const v = rnd(x*TS+i, y*TS+j, 5);
      F(X + Math.max(0, i), Y + j, Math.min(s-1, TS - Math.max(0, i)) - (i < 0 ? s/2 : 0) + (i < 0 ? s/2 : 0), s-1, hJit(base, v, .4));
      F(X + Math.max(0, i), Y + j, Math.max(1, s-2), 1, "rgba(255,250,230,.1)");
    }
    if (rnd(x,y,9) > .86){ F(X+3, Y+6, 7, 4, "rgba(14,18,22,.8)"); F(X+4, Y+6, 3, 1, "rgba(160,170,180,.25)"); }
    if (rnd(x,y,10) > .7) F(X + ((rnd(x,y,11)*12)|0), Y + ((rnd(x,y,12)*12)|0), 2, 1, LEAF[(rnd(x,y,13)*5)|0]);
  };
  const mud = (X, Y, x, y, base) => { F(X, Y, TS, TS, hJit(base, rnd(x,y,2), .1)); for (let i=0;i<9;i++) F(X + ((rnd(x,y,i)*15)|0), Y + ((rnd(x,y,i+5)*15)|0), 2, 1, rnd(x,y,i+2) > .5 ? hJit(base, .9, .5) : hJit(base, .1, .5)); if (rnd(x,y,7) > .85){ F(X+4, Y+5, 6, 3, "rgba(14,14,12,.6)"); } };
  const flag = (X, Y, x, y, base) => { F(X, Y, TS, TS, "#262420"); const a = (x+y)%2; F(X+1, Y+1, 14, a ? 6 : 9, hJit(base, rnd(x,y,1), .25)); F(X+1, Y + (a ? 8 : 11), 14, a ? 7 : 4, hJit(base, rnd(x,y,2), .25)); if (rnd(x,y,3) > .7){ F(X+5, Y+3, 1, 4, "#1e1c18"); F(X+6, Y+6, 1, 3, "#1e1c18"); } };
  const planks = (X, Y, x, y, base) => { F(X, Y, TS, TS, hJit(base, rnd(0,y,1), .15)); for (let j=0;j<TS;j+=4){ F(X, Y+j+3, TS, 1, "rgba(0,0,0,.45)"); const cut = (x*7 + j*3 + y) % 16; F(X + cut, Y+j, 1, 3, "rgba(0,0,0,.4)"); } for (let i=0;i<5;i++) F(X + ((rnd(x,y,i)*15)|0), Y + ((rnd(x,y,i+5)*15)|0), 2, 1, "rgba(255,230,190,.08)"); if (rnd(x,y,4) > .85) F(X+3, Y+9, 4, 2, "rgba(80,0,0,.25)"); };
  const rug = (X, Y, x, y) => { F(X, Y, TS, TS, "#4a1a1e"); F(X, Y, TS, 1, "#2a0e10"); if ((x+y)%2===0){ F(X+5, Y+5, 6, 6, "#6a2a24"); F(X+7, Y+7, 2, 2, "#a08040"); } for (let i=0;i<4;i++) F(X + ((rnd(x,y,i)*15)|0), Y + ((rnd(x,y,i+5)*15)|0), 1, 1, "#2a0e10"); };
  const floorOf = (X, Y, x, y, ch, bid) => {
    const bd = bid && bById(outerOf(bid));
    if (bd && bd.id==="ashcombe"){ planks(X, Y, x, y, "#2a1e16"); if (rnd(x,y,71) > .6) F(X + ((rnd(x,y,72)*10)|0), Y + ((rnd(x,y,73)*10)|0), 5, 3, "rgba(10,6,4,.6)"); if (rnd(x,y,74) > .93) F(X+2, Y+4, 10, 6, "rgba(70,4,4,.5)"); return; }
    if (ch === ":") return rug(X, Y, x, y);
    if (ch === "y") return flag(X, Y, x, y, "#3a4248");
    if (ch === ","){ if (bd && ["sheriff","clinic","church","library","station","arcade","garage"].includes(bd.id)) return flag(X, Y, x, y, "#6a645a"); return planks(X, Y, x, y, "#4a3424"); }
    return planks(X, Y, x, y, "#3e2a1c");
  };
  const inCem = (x,y) => x>=80 && x<=100 && y>=34 && y<=50;
  for (let y=0;y<TH;y++) for (let x=0;x<TW;x++){
    const ch = tmap[y][x], X = x*TS, Y = y*TS, bid = buildingAt(x,y);
    if (bid || ch === "D"){ const fl = bid ? (bById(outerOf(bid)) || {}).floor || "." : "."; floorOf(X, Y, x, y, ".,:y".includes(ch) ? ch : (bid==="roomA"||bid==="roomB"||bid==="roomC" ? ":" : fl), bid); if (bid && (tileT(x,y-1)==="#" || tileT(x,y-1)==="x")) F(X, Y, TS, 4, "rgba(5,4,8,.4)"); continue; }
    switch (ch){
      case "g": case "G": case "M": case "V": case "f": case "P": case "4": case "5": case "9": case "0": grass(X, Y, x, y, inCem(x,y) || y >= 86); if (y >= 86 && rnd(x,y,60) > .7) F(X + ((rnd(x,y,61)*12)|0), Y + ((rnd(x,y,62)*12)|0), 3, 2, "#1e1a14"); break;
      case "6": case "7": mud(X, Y, x, y, "#2a241c"); break;
      case "8": cobble(X, Y, x, y, "#5a544a", 4); break;
      case "t": case "T": grass(X, Y, x, y, true); for (let i=0;i<4;i++) F(X + ((rnd(x,y,i+50)*14)|0), Y + ((rnd(x,y,i+51)*14)|0), 3, 1, LEAF[i%5]); break;
      case "r": cobble(X, Y, x, y, "#4a443c", 4); { const ry = y % 5; if (ry===1 || ry===3) for (let i=0;i<TS;i+=2) F(X+i, Y+7, 2, 2, "rgba(20,16,12,.5)"); } break;
      case "s": case "l": flag(X, Y, x, y, "#5a564c"); break;
      case "q": case "N": case "n": case "X": case "Y": cobble(X, Y, x, y, "#5a544a", 4); break;
      case "o": cobble(X, Y, x, y, "#4a4640", 4); break;
      case "p": case "z": mud(X, Y, x, y, "#3a2c1e"); if (ch==="z"){ F(X, Y+3, TS, 2, "#20160e"); F(X, Y+11, TS, 2, "#20160e"); } break;
      case "u": case "J": case "h": mud(X, Y, x, y, "#33261a"); break;
      case "v": mud(X, Y, x, y, "#2a1e14"); F(X+3, Y+2, 10, 12, "#3a2a1a"); F(X+3, Y+2, 10, 1, "#4a3a26"); break;
      case "U": F(X, Y, TS, TS, "#2a1e12"); for (let i=0;i<TS;i+=4) F(X, Y+i, TS, 2, "#3a2a18"); break;
      case "b": mud(X, Y, x, y, "#2e2c22"); for (let i=0;i<4;i++) F(X + ((rnd(x,y,i)*14)|0), Y + ((rnd(x,y,i+5)*10)|0), 1, 5, "#4a4a2a"); break;
      case "w": { F(X, Y, TS, TS, "#0a1214"); if (rnd(x,y,3) > .7) F(X + ((rnd(x,y,4)*10)|0), Y + ((rnd(x,y,5)*14)|0), 5, 1, "#1a2a2c"); break; }
      case "d": F(X, Y, TS, TS, "#0a1214"); F(X+1, Y, 14, TS, "#3a2a1c"); for (let i=3;i<TS;i+=4) F(X+1, Y+i, 14, 1, "#1e140c"); break;
      case "m": cobble(X, Y, x, y, "#4a443c"); break;
      default: grass(X, Y, x, y, false);
    }
  }
  return c;
}

// ---------- people ----------
// The front of a head: eyes with whites, brows, a shadowed nose, a mouth, stubble or a beard painted in.
function texFace(L, seed){
  const key = `face:${L.skin}:${L.hair}:${L.beard||""}:${L.mustache||""}:${L.eye||""}:${seed%5}`;
  return hOnce(key, () => {
    const [c, g] = hCanvas(32, 32), R = hRng(seed + 3), sk = L.skin || "#d49a6a";
    const F = (x,y,w,h,col) => { g.fillStyle = col; g.fillRect(x,y,w,h); };
    F(0, 0, 32, 32, sk);
    F(0, 0, 3, 32, hJit(sk, .1, .3)); F(29, 0, 3, 32, hJit(sk, .1, .3)); F(0, 27, 32, 5, hJit(sk, .2, .25));
    const hair = L.hair || "#3f2616", brow = hMix(hair, "#000", .3);
    const browY = 10 + (seed%3===0 ? 1 : 0), slant = seed % 4;
    F(6, browY + (slant===1 ? 1 : 0), 7, 2, brow); F(19, browY + (slant===2 ? 1 : 0), 7, 2, brow);
    if (slant===3){ F(11, browY+1, 2, 1, brow); F(19, browY+1, 2, 1, brow); }
    const eye = L.eye || ["#3a2a1a","#2a4a6a","#3a5a3a","#5a4a2a","#2a2a2a"][seed % 5];
    for (const ex of [7, 19]){ F(ex, 13, 6, 3, "#e8e0d0"); F(ex+2, 13, 3, 3, eye); F(ex+3, 14, 1, 1, "#000"); F(ex, 12, 6, 1, hMix(sk, "#000", .45)); F(ex, 16, 6, 1, hMix(sk, "#000", .2)); }
    F(15, 14, 2, 7, hMix(sk, "#000", .15)); F(14, 20, 4, 2, hMix(sk, "#000", .3)); F(17, 15, 1, 5, hMix(sk, "#fff", .15));
    F(5, 19, 4, 3, hMix(sk, "#c03030", .18)); F(23, 19, 4, 3, hMix(sk, "#c03030", .18));
    const mouth = hMix(sk, "#401010", .55); F(11, 24, 10, 2, mouth); F(12, 26, 8, 1, hMix(sk, "#000", .15));
    if (seed % 6 === 1){ F(10, 23, 1, 1, mouth); F(21, 23, 1, 1, mouth); }
    if (seed % 7 === 2){ F(8, 22, 3, 1, hMix(sk, "#000", .2)); F(21, 22, 3, 1, hMix(sk, "#000", .2)); }
    if (seed % 5 === 4){ g.strokeStyle = "rgba(120,40,40,.7)"; g.beginPath(); g.moveTo(22, 8); g.lineTo(26, 20); g.stroke(); }
    if (L.mustache){ F(9, 21, 14, 3, L.mustache); F(8, 23, 2, 2, L.mustache); F(22, 23, 2, 2, L.mustache); }
    if (L.beard){ F(4, 22, 24, 10, L.beard); F(10, 24, 12, 2, mouth); for (let i=0;i<30;i++) F(4 + ((R()*24)|0), 22 + ((R()*10)|0), 1, 1, hMix(L.beard, "#000", .3)); }
    else if (seed % 3 === 1) for (let i=0;i<40;i++) F(5 + ((R()*22)|0), 22 + ((R()*9)|0), 1, 1, hMix(sk, hair, .4));
    return hTex(c);
  });
}
const MASK_ART = {
  skull(g, F){ F(0,0,32,32,"#d8d0b8"); F(0,0,3,32,"#b0a890"); F(29,0,3,32,"#b0a890"); for (const ex of [5,18]){ F(ex,10,9,8,"#0a0808"); F(ex+1,9,7,1,"#0a0808"); F(ex+3,13,2,2,"#600"); } F(14,19,4,4,"#0a0808"); F(15,18,2,1,"#0a0808"); F(7,25,18,5,"#1a1410"); for (let x=8;x<25;x+=3) F(x,25,2,4,"#e8e0c8"); F(4,6,4,1,"#9a9078"); F(22,4,1,6,"#7a7060"); },
  plague(g, F){ F(0,0,32,32,"#2a1e16"); for (let i=0;i<60;i++) F((Math.random()*32)|0,(Math.random()*32)|0,1,1,"#3a2a1e"); for (const ex of [6,18]){ F(ex,10,8,8,"#141010"); F(ex+1,11,6,6,"#6a7a70"); F(ex+2,12,2,2,"#b0c0b0"); } F(4,22,24,2,"#1a120c"); },
  goat(g, F){ F(0,0,32,32,"#2a221c"); for (let i=0;i<90;i++) F((Math.random()*32)|0,(Math.random()*32)|0,1,2,"#3a3028"); for (const ex of [5,20]){ F(ex,12,7,4,"#c0a020"); F(ex+2,13,3,2,"#000"); } F(12,18,8,10,"#1a1410"); F(13,26,2,2,"#000"); F(17,26,2,2,"#000"); F(14,29,4,3,"#5a4a3a"); },
  porcelain(g, F){ F(0,0,32,32,"#ece6dc"); F(0,0,2,32,"#cfc8bc"); F(30,0,2,32,"#cfc8bc"); for (const ex of [7,19]){ F(ex,12,6,4,"#000"); F(ex+1,11,4,1,"#000"); F(ex-1,10,8,1,"#8a8070"); } F(5,18,4,2,"#e0a0a0"); F(23,18,4,2,"#e0a0a0"); F(13,23,6,3,"#901018"); F(12,24,8,1,"#901018"); F(15,20,2,2,"#d0c8bc"); g.strokeStyle = "#5a5048"; g.lineWidth = 1; g.beginPath(); g.moveTo(20,0); g.lineTo(18,6); g.lineTo(21,10); g.lineTo(19,15); g.stroke(); F(19,16,1,6,"#600"); },
  sack(g, F){ F(0,0,32,32,"#8a7650"); for (let i=0;i<220;i++) F((Math.random()*32)|0,(Math.random()*32)|0,1,1,Math.random()<.5?"#6a5838":"#a08a60"); for (let y=0;y<32;y+=2) F(0,y,32,1,"rgba(0,0,0,.08)"); for (const [ex,ey] of [[7,11],[20,11]]){ F(ex,ey,5,1,"#1a1008"); F(ex+2,ey-2,1,5,"#1a1008"); F(ex,ey-2,1,1,"#1a1008"); F(ex+4,ey+2,1,1,"#1a1008"); } for (let x=8;x<25;x+=2){ F(x,23,1,1,"#1a1008"); F(x,22 + (x%4===0?-1:1),1,3,"#3a2a18"); } F(8,23,16,1,"#2a1a0c"); },
  crow(g, F){ F(0,0,32,32,"#121014"); for (let i=0;i<80;i++) F((Math.random()*32)|0,(Math.random()*32)|0,2,1,"#22202a"); for (const ex of [6,20]){ F(ex,12,6,5,"#000"); F(ex+2,13,2,2,"#c01010"); } }
};
function texMask(type){
  return hOnce("mask:"+type, () => { const [c, g] = hCanvas(32, 32); const F = (x,y,w,h,col) => { g.fillStyle = col; g.fillRect(x,y,w,h); }; (MASK_ART[type] || MASK_ART.skull)(g, F); return hTex(c); });
}
function texBurlap(){ return hOnce("burlap", () => { const [c, g] = hCanvas(32, 32); const F = (x,y,w,h,col) => { g.fillStyle = col; g.fillRect(x,y,w,h); }; MASK_ART.sack(g, F); return hTex(c); }); }
// fabric with weave or wear for tunics and cloaks
function texCloth(base, kind){
  return hOnce(`cloth:${base}:${kind}`, () => {
    const [c, g] = hCanvas(16, 16), R = hRng(base.length*13 + (kind||"").length);
    hSpeck(g, 0, 0, 16, 16, base, [hJit(base, .1, .35), hJit(base, .9, .25)], 50, R);
    if (kind === "weave") for (let i=0;i<16;i+=2){ g.fillStyle = "rgba(0,0,0,.1)"; g.fillRect(0, i, 16, 1); }
    if (kind === "worn"){ g.fillStyle = "rgba(0,0,0,.2)"; g.fillRect(0, 13, 16, 3); g.fillStyle = hJit(base, .95, .3); g.fillRect((R()*12)|0, (R()*10)|0, 3, 2); }
    return hTex(c);
  });
}

// ---------- sky ----------
function texSun(){
  return hOnce("sun", () => {
    const [c, g] = hCanvas(128, 128);
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, "rgba(255,240,200,1)"); gr.addColorStop(.18, "rgba(255,220,150,1)"); gr.addColorStop(.24, "rgba(255,170,90,.6)"); gr.addColorStop(.5, "rgba(255,140,70,.18)"); gr.addColorStop(1, "rgba(255,120,60,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return hTex(c, false, true);
  });
}
function texGlow(col){
  return hOnce("glow:"+col, () => {
    const [c, g] = hCanvas(64, 64), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    const cc = new THREE.Color(col), rgb = `${(cc.r*255)|0},${(cc.g*255)|0},${(cc.b*255)|0}`;
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.3, `rgba(${rgb},.45)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return hTex(c, false, true);
  });
}
// The moon: a cratered face that watches the player, blinks, and grins after a death.
const MOON = {cv:null, g:null, tex:null};
// The moon: a fat grinning crescent with one ringed eye that follows you and a mouth full of teeth.
const MOON_S = 192;
function moonTex(){
  if (!MOON.tex){ const [c, g] = hCanvas(MOON_S, MOON_S); g.imageSmoothingEnabled = true; MOON.cv = c; MOON.g = g; MOON.tex = hTex(c, false, true); }
  return MOON.tex;
}
// the crescent: a big disc with a bite taken out of the upper right
const MOON_O = [90, 100, 80], MOON_I = [142, 22, 72];
function moonPath(g, grow){ g.beginPath(); g.arc(MOON_O[0], MOON_O[1], MOON_O[2] + grow, 0, Math.PI*2); g.arc(MOON_I[0], MOON_I[1], Math.max(1, MOON_I[2] - grow), 0, Math.PI*2, true); }
// look: [-1..1, -1..1] where the pupil points; lid: 0 open .. 1 shut; grin: 0..1; blood: 0..1
function drawMoon(look, lid, grin, blood, t){
  moonTex(); const g = MOON.g, S = MOON_S;
  g.clearRect(0, 0, S, S);
  // thick black outline, then the body (the bite is cut out at the end)
  g.fillStyle = "#0a0604"; g.beginPath(); g.arc(MOON_O[0], MOON_O[1], MOON_O[2] + 4, 0, Math.PI*2); g.fill();
  g.save(); g.beginPath(); g.arc(MOON_O[0], MOON_O[1], MOON_O[2], 0, Math.PI*2); g.clip();
  const body = g.createRadialGradient(70, 90, 10, 92, 100, 82);
  body.addColorStop(0, blood > .5 ? "#ff9a50" : "#ffe46a"); body.addColorStop(.55, blood > .5 ? "#e8501a" : "#f6c02a"); body.addColorStop(1, blood > .5 ? "#7a1004" : "#c0700c");
  g.fillStyle = body; g.fillRect(0, 0, S, S);
  // mottling and the shadowed rim
  const R = hRng(77); for (let i=0;i<70;i++){ g.fillStyle = `rgba(${blood > .5 ? "120,20,0" : "150,80,0"},${.08 + R()*.12})`; g.beginPath(); g.arc(20 + R()*150, 30 + R()*150, 2 + R()*8, 0, Math.PI*2); g.fill(); }
  g.strokeStyle = "rgba(90,40,0,.45)"; g.lineWidth = 10; g.beginPath(); g.arc(MOON_O[0], MOON_O[1], MOON_O[2] - 3, .2, 2.9); g.stroke();
  g.fillStyle = "rgba(255,255,220,.35)"; g.beginPath(); g.ellipse(48, 74, 9, 22, -.5, 0, Math.PI*2); g.fill();
  // the eye: a black ring with dark petals around it, a white iris and a pupil that tracks
  const ex = 54, ey = 80;
  for (let k=0;k<11;k++){ const a = k/11*Math.PI*2; g.fillStyle = blood > .5 ? "#5a0a00" : "#6a3006"; g.beginPath(); g.ellipse(ex + Math.cos(a)*23, ey + Math.sin(a)*23, 7, 5, a, 0, Math.PI*2); g.fill(); g.fillStyle = "rgba(0,0,0,.55)"; g.beginPath(); g.arc(ex + Math.cos(a)*23, ey + Math.sin(a)*23, 3, 0, Math.PI*2); g.fill(); }
  g.fillStyle = "#0a0604"; g.beginPath(); g.arc(ex, ey, 17, 0, Math.PI*2); g.fill();
  g.fillStyle = "#f4f0e0"; g.beginPath(); g.arc(ex + look[0]*4, ey + look[1]*3.5, 9, 0, Math.PI*2); g.fill();
  g.fillStyle = blood > .5 ? "#a00000" : "#0a0604"; g.beginPath(); g.arc(ex + look[0]*6.5, ey + look[1]*5.5, 4, 0, Math.PI*2); g.fill();
  g.fillStyle = "#fff"; g.fillRect(ex + look[0]*6.5 + 1, ey + look[1]*5.5 - 3, 2, 2);
  if (lid > 0){ g.save(); g.beginPath(); g.arc(ex, ey, 18, 0, Math.PI*2); g.clip(); g.fillStyle = blood > .5 ? "#e05a20" : "#f0b828"; g.fillRect(ex - 19, ey - 19, 38, 38*lid); g.fillStyle = "#0a0604"; g.fillRect(ex - 19, ey - 19 + 38*lid - 1.5, 38, 3); g.restore(); }
  // the brow ridge over the eye
  g.strokeStyle = "#0a0604"; g.lineWidth = 4; g.beginPath(); g.moveTo(28, 56 - grin*3); g.quadraticCurveTo(54, 40 - grin*5, 80, 52); g.stroke();
  // the grin: a wide crescent mouth following the moon's lower curve
  const open = 10 + grin*14;
  const mouth = (grow) => { g.beginPath(); g.moveTo(34 - grow, 118); g.quadraticCurveTo(92, 168 + open + grow, 160 + grow, 92); g.quadraticCurveTo(102, 128 + grow*.2, 34 - grow, 118); g.closePath(); };
  g.fillStyle = "#0a0604"; mouth(3.5); g.fill();
  g.fillStyle = "#3a0606"; mouth(0); g.fill();
  g.save(); mouth(0); g.clip();
  // teeth: an upper row hanging from the top lip, a lower row standing on the bottom lip
  const topAt = x => { const u = (x - 34)/126; return (1-u)*(1-u)*118 + 2*(1-u)*u*128 + u*u*92; };
  const botAt = x => { const u = (x - 34)/126; return (1-u)*(1-u)*118 + 2*(1-u)*u*(168 + open) + u*u*92; };
  for (let x = 38; x < 158; x += 13){
    const yt = topAt(x + 6.5), yb = botAt(x + 6.5), gap = yb - yt;
    if (gap < 4) continue;
    g.fillStyle = "#f6f2e6"; g.fillRect(x, yt - 2, 12, gap*.46); g.fillRect(x + 1, yb - gap*.44, 11.5, gap*.44 + 3);
    g.fillStyle = "rgba(160,150,130,.6)"; g.fillRect(x, yt + gap*.46 - 4, 12, 3); g.fillRect(x + 1, yb - gap*.44, 11.5, 2.5);
    g.fillStyle = "#0a0604"; g.fillRect(x + 12, yt - 2, 1.5, gap*.46); g.fillRect(x + 12.5, yb - gap*.44, 1.5, gap*.44 + 3);
  }
  // gums and what drips from them
  g.fillStyle = blood > .5 ? "#8a0000" : "#a01818";
  for (const [dx, len] of [[64, 16], [86, 26], [104, 12], [122, 20]]){ const yb = botAt(dx); g.fillRect(dx, yb - 3, 4, (len + grin*14) * .5); }
  g.restore();
  // drool past the lip
  g.fillStyle = blood > .5 ? "#a00000" : "#b81c1c";
  for (const [dx, len] of [[82, 14], [100, 22]]){ const yb = botAt(dx) + 2; const L = len*(.5 + grin*.7) + Math.sin(t*2 + dx)*2; g.fillRect(dx, yb, 4, L); g.beginPath(); g.arc(dx + 2, yb + L, 3, 0, Math.PI*2); g.fill(); }
  g.restore();
  // take the bite out, then ink its edge so the horns are crisp
  g.globalCompositeOperation = "destination-out"; g.beginPath(); g.arc(MOON_I[0], MOON_I[1], MOON_I[2], 0, Math.PI*2); g.fill(); g.globalCompositeOperation = "source-over";
  g.save(); g.beginPath(); g.arc(MOON_O[0], MOON_O[1], MOON_O[2] + 4, 0, Math.PI*2); g.clip();
  g.strokeStyle = "#0a0604"; g.lineWidth = 8; g.beginPath(); g.arc(MOON_I[0], MOON_I[1], MOON_I[2], 0, Math.PI*2); g.stroke(); g.restore();
  // a glow behind it all
  g.globalCompositeOperation = "destination-over";
  const halo = g.createRadialGradient(90, 100, 70, 90, 100, 96); halo.addColorStop(0, blood > .5 ? "rgba(255,60,30,.45)" : "rgba(255,210,90,.35)"); halo.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = halo; g.fillRect(0, 0, S, S);
  g.globalCompositeOperation = "destination-out"; g.beginPath(); g.arc(MOON_I[0], MOON_I[1], MOON_I[2] - 4, 0, Math.PI*2); g.fill();
  g.globalCompositeOperation = "source-over";
  MOON.tex.needsUpdate = true;
}
// a 4-frame flame, laid out in a strip
function texFlame(){
  return hOnce("flame", () => {
    const [c, g] = hCanvas(64, 32), R = hRng(5);
    for (let f=0; f<4; f++){
      const ox = f*16;
      for (let y=0; y<32; y++){
        const k = y/32, w = Math.sin(k*Math.PI*.9 + .2) * (5.5 - k*2) * (1 - k*.6) * (k < .2 ? k*5 : 1), sway = Math.sin(k*6 + f*1.6) * k * 2.2;
        for (let x=-8; x<8; x++){
          const d = Math.abs(x + .5 - sway);
          if (d < w*(.85 + R()*.25)){ const core = d < w*.45 && k > .25; g.fillStyle = core ? (k > .55 ? "#fff6c0" : "#ffd060") : k > .7 ? "#ff8a20" : k > .4 ? "#ff6018" : "#c8300c"; g.fillRect(ox + 8 + x, 31 - y, 1, 1); }
        }
      }
    }
    // the strip is drawn bottom-up as y grows, so the base is at the bottom of each frame
    const t = hTex(c, false, false); t.repeat.set(.25, 1); return t;
  });
}
function texMist(){
  return hOnce("mist", () => {
    const [c, g] = hCanvas(128, 128), R = hRng(66);
    for (let i=0;i<60;i++){ const x = R()*128, y = R()*128, r = 10 + R()*30, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,255,255,.18)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
    const vg = g.createRadialGradient(64, 64, 30, 64, 64, 64); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,1)");
    g.globalCompositeOperation = "destination-out"; g.fillStyle = vg; g.fillRect(0, 0, 128, 128); g.globalCompositeOperation = "source-over";
    return hTex(c, false, true);
  });
}
function texBlood(seed){
  return hOnce("blood:"+(seed%4), () => {
    const [c, g] = hCanvas(48, 48), R = hRng(seed*7 + 1);
    g.fillStyle = "#4a0608"; g.beginPath(); g.arc(24, 24, 11 + R()*4, 0, Math.PI*2); g.fill();
    for (let i=0;i<9;i++){ const a = R()*Math.PI*2, d = 10 + R()*12, r = 1.5 + R()*3.5; g.fillStyle = R() < .5 ? "#5a0a0c" : "#3a0406"; g.beginPath(); g.arc(24 + Math.cos(a)*d, 24 + Math.sin(a)*d, r, 0, Math.PI*2); g.fill(); g.fillRect(24 + Math.cos(a)*d*.6, 24 + Math.sin(a)*d*.6, 2, 2); }
    g.fillStyle = "rgba(160,30,30,.4)"; g.beginPath(); g.arc(21, 21, 4, 0, Math.PI*2); g.fill();
    return hTex(c);
  });
}
// a carved pumpkin: orange skin, the face cut through (glow map shows only the cuts)
function texJack(glow, seed){
  return hOnce(`jack:${glow}:${seed%3}`, () => {
    const [c, g] = hCanvas(64, 32), F = (x,y,w,h,col) => { g.fillStyle = col; g.fillRect(x,y,w,h); };
    if (glow) F(0, 0, 64, 32, "#000"); else { F(0, 0, 64, 32, "#c8601a"); for (let x=0;x<64;x+=5) F(x, 0, 1, 32, "#9a4410"); F(0, 0, 64, 3, "#7a3a10"); F(0, 29, 64, 3, "#7a3a10"); }
    // the face sits around u = .25 (the +z side)
    const cut = glow ? "#ffb040" : "#2a0e04", cx = 16, v = seed % 3;
    g.fillStyle = cut;
    const triEye = (x) => { g.beginPath(); g.moveTo(x-3, 15); g.lineTo(x, 9 + (v===1?2:0)); g.lineTo(x+3, 15); g.fill(); };
    triEye(cx-5); triEye(cx+5);
    g.beginPath(); g.moveTo(cx-1, 18); g.lineTo(cx, 16); g.lineTo(cx+1, 18); g.fill();
    if (v === 0){ F(cx-7, 21, 14, 3, cut); F(cx-5, 20, 2, 1, cut); F(cx+3, 24, 2, 1, cut); }
    else if (v === 1){ g.beginPath(); g.moveTo(cx-8, 20); g.quadraticCurveTo(cx, 28, cx+8, 20); g.quadraticCurveTo(cx, 24, cx-8, 20); g.fill(); }
    else { for (let i=-3;i<=3;i++) F(cx + i*2, 21 + (i%2?1:0), 1, 2, cut); F(cx-7, 22, 14, 2, cut); }
    return hTex(c);
  });
}
// a carved wooden sign board. Text is drawn again once the gothic font arrives.
function hwSignMesh(text){
  const [c, g] = hCanvas(256, 64);
  const paint = () => {
    const R = hRng(text.length*7);
    g.fillStyle = "#2a1c12"; g.fillRect(0, 0, 256, 64);
    for (let y=4; y<60; y+=8){ g.fillStyle = hJit("#5a3e26", R(), .25); g.fillRect(4, y, 248, 7); g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(4, y+7, 248, 1); }
    g.fillStyle = "#1a120c"; for (const [x,y] of [[8,8],[244,8],[8,52],[244,52]]) g.fillRect(x, y, 4, 4);
    const f = document.fonts && document.fonts.check && document.fonts.check('30px "Pirata One"') ? '"Pirata One"' : '"IM Fell English", Georgia, serif';
    g.font = `34px ${f}`; g.textAlign = "center"; g.textBaseline = "middle";
    const label = text.length > 16 ? text.slice(0, 16) : text, title = label.toLowerCase().replace(/(^|\s)\S/g, s => s.toUpperCase());
    g.fillStyle = "#120a06"; g.fillText(title, 129, 35, 236);
    g.fillStyle = "#d8b060"; g.fillText(title, 128, 33, 236);
  };
  paint();
  const t = hTex(c); t.magFilter = THREE.LinearFilter;
  HT.redraw.push(() => { paint(); t.needsUpdate = true; });
  const w = Math.min(4.2, text.length*.32 + 1.1);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, .75), new THREE.MeshLambertMaterial({map:t}));
  return m;
}
if (HALLOW && document.fonts && document.fonts.load){
  Promise.all([document.fonts.load('30px "Pirata One"'), document.fonts.load('20px "IM Fell English"')]).then(() => { for (const f of HT.redraw) f(); }).catch(()=>{});
}
// the face that comes for you
function drawScareFace(g, w, h, t){
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
  const s = Math.min(w, h) / 64, cx = w/2, cy = h/2 + Math.sin(t*40)*s;
  const F = (x,y,ww,hh,col) => { g.fillStyle = col; g.fillRect(cx + x*s, cy + y*s, ww*s, hh*s); };
  F(-20,-28,40,56,"#c8c0b0"); F(-22,-20,44,40,"#b8b0a0"); F(-18,-30,36,4,"#a8a090");
  F(-16,-12,12,14,"#000"); F(4,-12,12,14,"#000"); F(-12,-8,3,3,"#fff"); F(8,-8,3,3,"#fff");
  F(-2,4,4,6,"#3a3028"); F(-14,14,28,14,"#000");
  for (let i=-12;i<12;i+=4){ F(i,14,3,4,"#d8d0b8"); F(i+1,24,3,4,"#d8d0b8"); }
  F(-20,-20,2,30,"#8a8070"); F(18,-24,2,26,"#8a8070");
  g.fillStyle = "rgba(120,0,0,.5)"; g.fillRect(cx - 16*s, cy + 2*s, 2*s, 18*s); g.fillRect(cx + 12*s, cy + 2*s, 2*s, 24*s);
}
// ---------- Ashcombe House ----------
function texPortrait(seed){
  return hOnce("portrait:"+(seed%5), () => {
    const [c, g] = hCanvas(48, 64), R = hRng(seed*13 + 3), v = seed % 5;
    g.fillStyle = "#3a2a10"; g.fillRect(0, 0, 48, 64); g.fillStyle = "#8a6a20"; g.fillRect(2, 2, 44, 60); g.fillStyle = "#4a3410"; g.fillRect(4, 4, 40, 56);
    const bg = g.createLinearGradient(0, 6, 0, 58); bg.addColorStop(0, "#1a1410"); bg.addColorStop(1, "#0a0806"); g.fillStyle = bg; g.fillRect(6, 6, 36, 52);
    g.fillStyle = ["#1a1a22","#2a1414","#141e18","#20180e","#181818"][v]; g.beginPath(); g.ellipse(24, 58, 16, 18, 0, Math.PI, 0); g.fill();
    g.fillStyle = "#c8bca8"; g.beginPath(); g.ellipse(24, 28, 8, 11, 0, 0, Math.PI*2); g.fill();
    g.fillStyle = "#1a1210"; g.beginPath(); g.ellipse(24, 20, 10, 6, 0, Math.PI, 0); g.fill();
    if (v===0){ g.fillStyle = "#000"; g.fillRect(19, 25, 4, 3); g.fillRect(26, 25, 4, 3); }
    else if (v===1){ g.strokeStyle = "rgba(20,10,10,.9)"; g.lineWidth = 2; for (let i=0;i<6;i++){ g.beginPath(); g.moveTo(15 + R()*4, 18 + R()*4); g.lineTo(30 + R()*4, 34 + R()*6); g.stroke(); } }
    else if (v===2){ g.fillStyle = "#000"; g.beginPath(); g.ellipse(24, 28, 8, 11, 0, 0, Math.PI*2); g.fill(); }
    else { g.fillStyle = "#2a1a14"; g.fillRect(20, 26, 2, 2); g.fillRect(26, 26, 2, 2); g.fillRect(22, 34, 4, 1); if (v===4){ g.fillStyle = "#6a0000"; g.fillRect(20, 28, 1, 8); g.fillRect(27, 28, 1, 10); } }
    for (let i=0;i<120;i++){ g.fillStyle = `rgba(0,0,0,${R()*.25})`; g.fillRect(6 + R()*36, 6 + R()*52, 1, 1); }
    return hTex(c);
  });
}
function texWeb(){
  return hOnce("web", () => {
    const [c, g] = hCanvas(64, 64); g.imageSmoothingEnabled = true;
    g.strokeStyle = "rgba(220,220,230,.55)"; g.lineWidth = 1;
    for (let k=0;k<7;k++){ const a = k/6*Math.PI/2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a)*64, Math.sin(a)*64); g.stroke(); }
    for (let r=8;r<64;r+=7){ g.beginPath(); for (let k=0;k<=6;k++){ const a = k/6*Math.PI/2, rr = r + Math.sin(k*2.3)*2; const x = Math.cos(a)*rr, y = Math.sin(a)*rr; if (k) g.quadraticCurveTo(Math.cos(a - .13)*(rr-3), Math.sin(a - .13)*(rr-3), x, y); else g.moveTo(x, y); } g.stroke(); }
    return hTex(c, false, true);
  });
}
function texHand(seed){
  return hOnce("hand:"+(seed%3), () => {
    const [c, g] = hCanvas(32, 32), R = hRng(seed + 9);
    g.fillStyle = "rgba(90,6,6,.85)"; g.beginPath(); g.ellipse(16, 21, 6, 7, 0, 0, Math.PI*2); g.fill();
    for (const [x, a] of [[9,-.5],[12,-.2],[16,0],[20,.2],[24,.6]]){ g.save(); g.translate(x, 15); g.rotate(a); g.fillRect(-1.5, -10, 3, 10); g.restore(); }
    for (let i=0;i<4;i++) g.fillRect(12 + R()*8, 26, 1.5, 3 + R()*6);
    return hTex(c);
  });
}

// the Circle's sigil: rings, runes, a five-pointed star and a horned moon
function texSigil(){
  return hOnce("sigil", () => {
    const [c, g] = hCanvas(256, 256); g.imageSmoothingEnabled = true;
    const C = 128; g.strokeStyle = "#ff3010"; g.fillStyle = "#ff3010"; g.lineCap = "round";
    g.lineWidth = 5; g.beginPath(); g.arc(C, C, 118, 0, Math.PI*2); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.arc(C, C, 100, 0, Math.PI*2); g.stroke();
    g.font = "bold 14px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
    const runes = "ᚦᚨᛗᛟᛞᚱᛁᚾᚷᛉᛏᛋᚹᚺᛚᛜ";
    for (let k=0;k<32;k++){ const a = k/32*Math.PI*2; g.save(); g.translate(C + Math.cos(a)*109, C + Math.sin(a)*109); g.rotate(a + Math.PI/2); g.fillText(runes[k % runes.length], 0, 0); g.restore(); }
    g.lineWidth = 4; g.beginPath(); for (let k=0;k<=5;k++){ const a = -Math.PI/2 + k*4*Math.PI/5; const x = C + Math.cos(a)*98, y = C + Math.sin(a)*98; if (k) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
    g.lineWidth = 6; g.beginPath(); g.arc(C, C + 8, 30, .15*Math.PI, .85*Math.PI); g.stroke();
    g.beginPath(); g.moveTo(C - 28, C + 16); g.quadraticCurveTo(C - 44, C - 18, C - 30, C - 40); g.stroke();
    g.beginPath(); g.moveTo(C + 28, C + 16); g.quadraticCurveTo(C + 44, C - 18, C + 30, C - 40); g.stroke();
    return hTex(c, false, true);
  });
}
