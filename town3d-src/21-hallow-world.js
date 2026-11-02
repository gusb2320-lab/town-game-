// Hallowmere in 3D: the same tile map built as a medieval village. Timber-framed and stone buildings under thatch
// and slate, torches instead of street lamps, a gallows and a bonfire in the square, a well, a graveyard behind iron.
// People are rebuilt with tunics, belts, boots, cloaks and hoods, painted faces, and masks after dark.
const HWS = {lampAt:-1, gutter:1, blink:0, nextBlink:0, grinUntil:0, bodies:0, moonAt:0, blood:0, grin:0};
// ---------- merged geometry: many coloured boxes, one draw call ----------
const HG = {};
function hGeo(){
  if (!HG.box){
    HG.box = new THREE.BoxGeometry(1,1,1);
    HG.cyl = new THREE.CylinderGeometry(.5,.5,1,10);
    HG.cone = new THREE.ConeGeometry(.5,1,8);
    HG.ball = new THREE.SphereGeometry(.5,10,7);
    HG.disc = new THREE.CylinderGeometry(.5,.5,1,12).rotateX(Math.PI/2);
    HG.wedge = prismGeo();
  }
  return HG;
}
function mergeParts(parts){
  hGeo();
  const pos = [], nor = [], colr = [], idx = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), nm = new THREE.Matrix3(), v = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  let off = 0;
  for (const p of parts){
    const g = HG[p.geo || "box"];
    e.set(p.rx||0, p.ry||0, p.rz||0, "YXZ"); q.setFromEuler(e); m.compose(new THREE.Vector3(p.x, p.y, p.z), q, s.set(p.w, p.h, p.d)); nm.getNormalMatrix(m);
    const P = g.attributes.position, N = g.attributes.normal; c.set(p.col);
    for (let i=0;i<P.count;i++){ v.fromBufferAttribute(P, i).applyMatrix4(m); pos.push(v.x, v.y, v.z); v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z); colr.push(c.r, c.g, c.b); }
    const I = g.index; if (I) for (let i=0;i<I.count;i++) idx.push(I.getX(i) + off); else for (let i=0;i<P.count;i++) idx.push(i + off);
    off += P.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colr, 3));
  geo.setIndex(idx);
  return geo;
}
const hMat = (key, make) => { let m = T3.mats.get("h:"+key); if (!m){ m = make(); T3.mats.set("h:"+key, m); } return m; };
const vcMat = () => hMat("vc", () => new THREE.MeshLambertMaterial({vertexColors:true}));
const texMat = (key, tex, opt={}) => hMat(key, () => new THREE.MeshLambertMaterial(Object.assign({map:tex}, opt)));

// ---------- building styles ----------
const PLASTERS = ["#c8b898","#b8a888","#a89a80","#c0a888","#9a9080","#b4a48e","#c2b090"];
function hwStyle(b){
  if (!b) return {wall:"stone", base:"#5a5650", roof:"slate", slate:"#3a3e46"};
  if (b.kind==="home"){ const i = parseInt(b.id.slice(4))||0; return {wall:"timber", plaster:PLASTERS[i%PLASTERS.length], beam:i%3===1 ? "#3a2618" : "#24180f", roof:i%4===3 ? "slate" : "thatch", slate:"#3a3c44", chimney:true}; }
  const S = {
    diner:{wall:"timber", plaster:"#bfae8e", beam:"#2a1a10", roof:"thatch", chimney:true},
    store:{wall:"timber", plaster:"#b8aa90", beam:"#2e2014", roof:"slate", slate:"#3e4450"},
    barber:{wall:"timber", plaster:"#c4b49a", beam:"#3a1a14", roof:"slate", slate:"#40383a"},
    clinic:{wall:"stone", base:"#6a6458", roof:"slate", slate:"#3a4046", chimney:true},
    sheriff:{wall:"stone", base:"#4e4a44", roof:"slate", slate:"#2e3036"},
    post:{wall:"timber", plaster:"#a89a80", beam:"#24180f", roof:"thatch"},
    hotel:{wall:"timber", plaster:"#b8a684", beam:"#1e140c", roof:"slate", slate:"#34363e", chimney:true},
    station:{wall:"stone", base:"#5e5850", roof:"slate", slate:"#3a3c44"},
    bar:{wall:"timber", plaster:"#8e8068", beam:"#1a100a", roof:"thatch", chimney:true},
    library:{wall:"stone", base:"#6e6858", roof:"slate", slate:"#383c44"},
    arcade:{wall:"stone", base:"#3e3a36", roof:"slate", slate:"#2a2c30"},
    church:{wall:"stone", base:"#6a6660", roof:"slate", slate:"#363a42"},
    garage:{wall:"stone", base:"#4a4640", roof:"slate", slate:"#2e2e30", chimney:true, forge:true},
    barn:{wall:"planks", base:"#4a2e22", roof:"thatch"}
  };
  return S[b.id] || {wall:"timber", plaster:"#b0a088", beam:"#2a1a10", roof:"thatch"};
}
function hwWallMat(b, variant){
  const st = hwStyle(b), seed = b ? [...b.id].reduce((s,c)=>s+c.charCodeAt(0),0) : 1;
  if (st.wall==="timber") return texMat(`wall:${b.id}:${variant}`, texTimber(st.plaster, st.beam, variant, seed));
  if (st.wall==="planks") return texMat(`wall:planks:${st.base}`, texPlanks(st.base, seed));
  return texMat(`wall:stone:${st.base}:${seed%2}`, texStone(st.base, seed));
}

// ---------- the world ----------
function hwBuildWorld3D(){
  if (tmapDirty) rebuildTownMap();
  hGeo();
  if (T3.world){ T3.scene.remove(T3.world); T3.world.traverse(o=>{ if (o.geometry && !Object.values(HG).includes(o.geometry)) o.geometry.dispose(); }); }
  const W = new THREE.Group(); T3.world = W; T3.scene.add(W);
  T3.hw = {fires:[], jacks:[], smokes:[], scarecrows:[], noose:null, graves:[], perches:[], cem:[80,34,100,50]};
  // ground
  const gcv = hwPaintGround(), tex = hTex(gcv); tex.anisotropy = 8;
  T3.groundTex = tex;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(TW, TH), new THREE.MeshLambertMaterial({map:tex}));
  ground.rotation.x = -Math.PI/2; ground.position.set(TW/2, 0, TH/2); ground.receiveShadow = true; W.add(ground);
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat3("#22241a")); outer.rotation.x = -Math.PI/2; outer.position.set(TW/2, -.02, TH/2); outer.receiveShadow = true; W.add(outer);
  // collectors: [x,y,z, sx,sy,sz, col, rx,ry,rz]
  const L = {box:[], glow:[], cyl:[], cone:[], ball:[], ico:[], disc:[], water:[], jack0:[], jack1:[], jack2:[], pine:[], wedge:[]};
  const put = (list, x,y,z, sx,sy,sz, col, rx=0,ry=0,rz=0) => L[list].push([x,y,z,sx,sy,sz,col,rx,ry,rz]);
  const bx = (...a) => put("box", ...a);
  const tilt = (dx, dz, th) => [th, Math.atan2(dx, dz)];
  const walls = new Map(), glass = new Map(), doors = [];
  const wallBox = (b, x,z, y0,h, v) => { const k = (b ? b.id : "_") + "|" + v; if (!walls.has(k)) walls.set(k, []); walls.get(k).push([x,y0,z,1,h,1]); };
  const glassBox = (b, x,z, y0,h, alongX) => { const k = b ? b.id : "_"; if (!glass.has(k)) glass.set(k, []); glass.get(k).push([x,y0,z, alongX?1:.14, h, alongX?.14:1]); };
  const fire = (x,y,z,s,when,kind) => T3.hw.fires.push({x,y,z,s,when,kind});
  const jack = (x,z,s,yaw,y=0) => { const v = ((x*7+z*13)|0) % 3; put("jack"+v, x, y + .2*s, z, .5*s, .4*s, .5*s, null, 0, yaw, 0); T3.hw.jacks.push([x, y + .25*s, z]); };
  const candle = (x,y,z,when="night") => { bx(x, y, z, .05, .14, .05, "#d8ccaa"); fire(x, y + .2, z, .16, when, "candle"); };
  T3.lampPos = [];
  const inRect = (x,y,r) => x>=r[0] && x<=r[2] && y>=r[1] && y<=r[3];
  const outward = (b, x, y) => !b ? null : y===b.y0 ? [0,-1] : y===b.y1 ? [0,1] : x===b.x0 ? [-1,0] : x===b.x1 ? [1,0] : null;
  const woodC = ["#3a2616","#2e1e12","#4a3020","#34241a"];
  for (let y=0;y<TH;y++) for (let x=0;x<TW;x++){
    const c = tmap[y][x], cx = x+.5, cz = y+.5, b = bldgOf(x,y), bid = buildingAt(x,y);
    const rr = s => rnd(x,y,s), wv = (x*3 + y*5) % 3;
    switch (c){
      case "#": wallBox(b, cx, cz, 0, WALL_H, wv); break;
      case "x": {
        const alongX = "#xD".includes(tileT(x-1,y)) || "#xD".includes(tileT(x+1,y));
        wallBox(b, cx, cz, 0, .95, wv); wallBox(b, cx, cz, 1.85, WALL_H-1.85, wv); glassBox(b, cx, cz, .95, .9, alongX);
        const o = outward(b, x, y);
        if (o){
          const ox = o[0]*.56, oz = o[1]*.56, ax = alongX ? 1 : 0, az = alongX ? 0 : 1;
          bx(cx + ox*1.05, .9, cz + oz*1.05, alongX ? 1.04 : .14, .07, alongX ? .14 : 1.04, "#3a2a1c");
          for (const sd of [-1, 1]){ const sx = cx + ax*sd*.66 + ox, sz = cz + az*sd*.66 + oz; bx(sx, .92, sz, alongX ? .3 : .05, .96, alongX ? .05 : .3, rr(7) > .5 ? "#2e3a2c" : "#3a2a1e", 0, 0, rr(8) > .8 ? sd*.06 : 0); }
          if (rr(9) > .62) candle(cx + ox*.7, .97, cz + oz*.7);
          else if (rr(9) < .16) jack(cx + ox*.9, cz + oz*.9, .55, Math.atan2(o[0], o[1]), .94);
        }
        break;
      }
      case "D": {
        wallBox(b, cx, cz, 2.15, WALL_H-2.15, wv);
        const alongX = "#x".includes(tileT(x-1,y)) || "#x".includes(tileT(x+1,y));
        doors.push({x, y, cx, cz, alongX, b});
        bx(cx, 0, cz, alongX?1:.14, .03, alongX?.14:1, "#2a1c12");
        const o = outward(b, x, y);
        if (o && b){
          // door frame and lintel
          bx(cx + o[0]*.52, 2.1, cz + o[1]*.52, alongX ? 1.1 : .1, .14, alongX ? .1 : 1.1, "#24180f");
          if (b.kind!=="home"){
            for (const sd of [-1, 1]){
              const tx = cx + (alongX ? sd*.95 : 0) + o[0]*.62, tz = cz + (alongX ? 0 : sd*.95) + o[1]*.62;
              bx(tx - o[0]*.08, 1.75, tz - o[1]*.08, .06, .06, .06, "#18181a"); bx(tx, 1.62, tz, .07, .34, .07, "#2a1a10", ...tilt(o[0], o[1], .35));
              bx(tx + o[0]*.08, 1.95, tz + o[1]*.08, .12, .1, .12, "#ff9a40", 0, 0, 0); L.glow.push(L.box.pop());
              fire(tx + o[0]*.08, 2.15, tz + o[1]*.08, .42, "dusk", "torch"); T3.lampPos.push([tx + o[0]*.3, 2.2, tz + o[1]*.3]);
            }
          } else {
            const sx = cx + (alongX ? 1.2 : 0) + o[0]*.95, sz = cz + (alongX ? 0 : 1.2) + o[1]*.95;
            if (rr(3) > .3) jack(sx, sz, .75, Math.atan2(o[0], o[1]));
            if (rr(4) > .55) jack(sx + (alongX ? .45 : o[0]*.3), sz + (alongX ? o[1]*.3 : .45), .5, Math.atan2(o[0], o[1]) + .4);
            // a bundle of rowan and a nailed horseshoe against what walks at night
            bx(cx + o[0]*.53, 2.22, cz + o[1]*.53, .2, .12, .05, "#5a5a5e");
          }
        }
        break;
      }
      case "|": for (let i=0;i<4;i++) bx(x+.15+i*.23, 0, cz, .05, WALL_H*.9, .05, i%2 ? "#2a2a2e" : "#3a302a"); bx(cx, WALL_H*.85, cz, 1, .08, .08, "#26262a"); bx(cx, .1, cz, 1, .08, .08, "#26262a"); break;
      case "t": case "T": {
        const s = .85 + rr(3)*.5, tx = cx + (rr(4)-.5)*.3, tz = cz + (rr(5)-.5)*.3;
        if (c==="T"){
          put("cyl", tx, .5*s, tz, .2, 1.0*s, .2, "#2a1e16");
          for (let k=0;k<3;k++) put("pine", tx, (.7 + k*.75)*s, tz, (1.7 - k*.42)*s, (1.5 - k*.2)*s, (1.7 - k*.42)*s, ["#18241a","#1c2a1e","#141e16"][(k + x)%3]);
        } else if (rr(6) < .58 || inRect(x,y,[31,33,47,47])){
          // dead tree: a crooked trunk and grasping branches
          const h = (2.1 + rr(7)*1.2)*s, lean = (rr(8)-.5)*.22;
          bx(tx, 0, tz, .2*s, h, .2*s, "#2a221c", lean, rr(9)*3, 0);
          bx(tx, 0, tz, .3*s, .3, .3*s, "#221a14");
          const nb = 4 + ((rr(10)*3)|0);
          for (let k=0;k<nb;k++){
            const a = k/nb*Math.PI*2 + rr(11+k), by = h*(.45 + rr(20+k)*.45), len = (.7 + rr(30+k)*.8)*s, th = .7 + rr(40+k)*.5;
            const [rx, ry] = tilt(Math.cos(a), Math.sin(a), th);
            bx(tx + Math.sin(lean)*by*.0, by, tz, .07*s, len, .07*s, "#241c16", rx, ry, 0);
            const ex = tx + Math.cos(a)*Math.sin(th)*len, ez = tz + Math.sin(a)*Math.sin(th)*len, ey = by + Math.cos(th)*len;
            const [rx2, ry2] = tilt(Math.cos(a+.6), Math.sin(a+.6), th*.6);
            bx(ex, ey - .05, ez, .04*s, len*.55, .04*s, "#241c16", rx2, ry2, 0);
            if (k===0 && rr(50) > .7) T3.hw.perches.push([ex, ey + .02, ez]);
          }
        } else {
          put("cyl", tx, .7*s, tz, .2*s, 1.4*s, .2*s, "#3a2a1e");
          for (let k=0;k<2+((rr(12)*2)|0);k++) put("ico", tx + (rr(13+k)-.5)*.7, (1.3 + rr(15+k)*.6)*s, tz + (rr(17+k)-.5)*.7, (1.1 + rr(19+k)*.5)*s, (.9 + rr(21+k)*.4)*s, (1.1 + rr(23+k)*.5)*s, ["#6a3012","#7a4a16","#5a2a10","#4e3214"][(k + x + y)%4]);
        }
        break;
      }
      case "l": {
        // a torch post: oak post, iron basket, pitch-soaked rags
        const lean = (rr(2)-.5)*.06;
        bx(cx, 0, cz, .14, 2.25, .14, "#2e1e12", lean, 0, 0); bx(cx, 0, cz, .26, .2, .26, "#3a3a3a");
        for (const [a, b2] of [[-1,-1],[1,-1],[-1,1],[1,1]]) bx(cx + a*.1, 2.2, cz + b2*.1, .025, .32, .025, "#1a1a1c");
        bx(cx, 2.2, cz, .26, .03, .26, "#1a1a1c"); bx(cx, 2.48, cz, .28, .025, .28, "#1a1a1c");
        bx(cx, 2.24, cz, .16, .14, .16, "#ff7a20"); L.glow.push(L.box.pop());
        fire(cx, 2.42, cz, .65, "dusk", "torch"); T3.lampPos.push([cx, 2.6, cz]);
        if (rr(3) > .6) T3.hw.perches.push([cx, 2.52, cz]);
        break;
      }
      case "f": {
        const h = "fp".includes(tileT(x-1,y)) || "fp".includes(tileT(x+1,y));
        if (inRect(x,y,T3.hw.cem)){
          // wrought iron with spear points
          for (let i=0;i<3;i++){ const ox = h ? -.33 + i*.33 : 0, oz = h ? 0 : -.33 + i*.33; bx(cx+ox, 0, cz+oz, .04, 1.45, .04, "#16161a"); put("cone", cx+ox, 1.52, cz+oz, .07, .16, .07, "#26262a"); }
          for (const yy of [.25, 1.2]) bx(cx, yy, cz, h ? 1 : .05, .05, h ? .05 : 1, "#1e1e22");
          if (tileT(x-1,y)==="p" || tileT(x+1,y)==="p" || tileT(x,y-1)==="p" || tileT(x,y+1)==="p"){ bx(cx, 0, cz, .5, 2.1, .5, "#5a5850"); bx(cx, 2.1, cz, .6, .12, .6, "#4a4840"); put("ball", cx, 2.34, cz, .32, .34, .3, "#d8d0b8"); bx(cx-.06, 2.34, cz+.15, .06, .06, .02, "#000"); bx(cx+.06, 2.34, cz+.15, .06, .06, .02, "#000"); }
        } else {
          bx(cx, 0, cz, .13, .95, .13, "#3a2a1c", (rr(1)-.5)*.12, 0, (rr(2)-.5)*.12);
          if (h){ bx(cx, .35, cz, 1, .07, .06, "#4a3424", 0, 0, (rr(3)-.5)*.1); bx(cx, .72, cz, 1, .07, .06, "#4a3424", 0, 0, (rr(4)-.5)*.1); }
          else { bx(cx, .35, cz, .06, .07, 1, "#4a3424", (rr(3)-.5)*.1); bx(cx, .72, cz, .06, .07, 1, "#4a3424", (rr(4)-.5)*.1); }
        }
        break;
      }
      case "V": {
        const v = rr(1), col = ["#6a6a62","#5a5c54","#7a766a","#4e5048"][(rr(2)*4)|0], rz = (rr(3)-.5)*.24, rx = (rr(4)-.5)*.18;
        if (v < .4){ bx(cx, 0, cz, .55, .62, .12, col, rx, 0, rz); put("disc", cx + Math.sin(-rz)*.62, .62, cz + Math.sin(rx)*.62, .55, .55, .12, col, rx, 0, rz); }
        else if (v < .7){ bx(cx, 0, cz, .12, 1.05, .1, col, rx, 0, rz); bx(cx, .62, cz, .5, .11, .1, col, rx, 0, rz); }
        else { bx(cx, 0, cz, .48, .95, .16, col, rx, 0, rz); bx(cx, .95, cz, .54, .08, .2, hJit(col, .2, .3), rx, 0, rz); }
        bx(cx, 0, cz+.38, .6, .08, .5, "#2a2018");
        if (rr(5) > .7) candle(cx + .2, .08, cz + .3, "night");
        if (rr(6) > .8) for (let k=0;k<3;k++) bx(cx - .2 + k*.08, .08, cz + .25, .02, .18, .02, "#3a2a20", .3, 0, (k-1)*.3);
        T3.hw.graves.push([cx, cz]);
        if (rr(7) > .85) T3.hw.perches.push([cx, v < .4 ? .92 : v < .7 ? 1.08 : 1.06, cz]);
        break;
      }
      case "v": bx(cx, 0, cz, .8, .2, .9, "#2a1e14"); bx(cx, .2, cz, .6, .08, .7, "#33261a"); break;
      case "U": {
        for (let i=0;i<3;i++) bx(x+.2+i*.3, 0, cz + (rr(i)-.5)*.3, .05, .6 + rr(i)*.5, .05, rr(i+3)>.4 ? "#8a7a4a" : "#6a5a34", (rr(i+5)-.5)*.5, 0, (rr(i+6)-.5)*.5);
        if (rr(9) > .6){ put("ball", cx + (rr(10)-.5)*.4, .14, cz + (rr(11)-.5)*.4, .42, .28, .42, rr(12) > .3 ? "#b8581a" : "#6a5a2a"); bx(cx, .26, cz, .03, .1, .03, "#3a4a20"); }
        break;
      }
      case "G": {
        if (inRect(x,y,[31,33,47,47])){ jack(cx - .2, cz, .8, (rr(1)-.5)*.6); if (rr(2) > .4) jack(cx + .25, cz + .1, .55, (rr(3)-.5)); candle(cx + .3, 0, cz - .25, "night"); }
        else for (let i=0;i<3;i++) bx(x+.2+rr(i)*.6, 0, y+.2+rr(i+5)*.6, .04, .3, .04, "#3a3020", (rr(i+7)-.5)*.6, 0, (rr(i+8)-.5)*.6);
        break;
      }
      case "n": { bx(cx, .32, cz, .95, .1, .4, "#4a3424"); bx(cx, .38, cz, .9, .04, .34, "#5a3e28"); for (const sx of [-.36, .36]) put("cyl", cx + sx, .16, cz, .2, .32, .2, "#3a2a1c"); if (rr(2) > .7) candle(cx + .3, .42, cz, "night"); break; }
      case "N": {
        bx(cx-.42, 0, cz, .12, 1.7, .12, "#2a1c12"); bx(cx+.42, 0, cz, .12, 1.7, .12, "#2a1c12"); bx(cx, .75, cz, .98, .8, .08, "#3e2a1a"); put("wedge", cx, 1.7, cz, 1.2, .3, .5, "#24180f");
        for (const [px, py, w, h] of [[-.25, 1.0, .3, .38], [.15, .95, .32, .42], [-.05, .82, .2, .22], [.32, 1.2, .2, .2]]) bx(cx + px, py, cz + .05, w, h, .02, hJit("#d8c8a0", rnd(x, py*10, 3), .15));
        bx(cx - .25, 1.15, cz + .062, .16, .13, .01, "#4a3020"); bx(cx + .15, 1.18, cz + .062, .2, .03, .01, "#6a0a0a");
        break;
      }
      case "M": { bx(cx, 0, cz, .1, 1.05, .1, "#2e1e12"); bx(cx, 1.0, cz, .32, .32, .26, "#3a2818"); bx(cx, 1.04, cz + .12, .22, .22, .03, "#0a0806"); put("cone", cx, 1.42, cz, .5, .26, .42, "#24180f", 0, Math.PI/4, 0); candle(cx, 1.04, cz + .02, "night"); break; }
      case "Y": { for (const [ox, oz] of [[-.22, 0], [.22, .05]]) { put("cyl", cx + ox, .32, cz + oz, .42, .64, .42, "#4a3020"); put("cyl", cx + ox, .5, cz + oz, .44, .04, .44, "#2a2a2c"); put("cyl", cx + ox, .14, cz + oz, .44, .04, .44, "#2a2a2c"); } bx(cx, 0, cz - .32, .4, .32, .28, "#5a3e26", 0, .3, 0); break; }
      case "J": {
        put("disc", cx - .1, .1, cz, .8, .8, .08, "#3a2a1a", Math.PI/2 - .1, rr(1)*3, 0);
        put("cyl", cx + .25, .3, cz + .2, .4, .6, .4, "#4a3020", 0, 0, rr(2) > .5 ? Math.PI/2 : 0);
        for (let i=0;i<3;i++) bx(x + .2 + rr(i+3)*.6, .05, y + .2 + rr(i+4)*.6, .5, .05, .1, "#5a4a3a", 0, rr(i+5)*3, 0);
        for (let i=0;i<3;i++) bx(x + .3 + rr(i+8)*.4, .02, y + .3 + rr(i+9)*.4, .2, .04, .04, "#d8d0b8", 0, rr(i+10)*3, 0);
        if (rr(12) > .5) put("ball", cx - .2, .1, cz + .3, .2, .2, .2, "#d8d0b8");
        break;
      }
      case "h": bx(cx, 0, cz, .92, .55, .72, "#8a7038"); bx(cx, .55, cz, .88, .04, .68, "#a08848"); bx(cx, .25, cz, .94, .03, .74, "#5a4a24"); break;
      case "o": if (x===39 && y===40){
        // the village well
        const wx = 39.5, wz = 40.5;
        for (let k=0;k<14;k++){ const a = k/14*Math.PI*2; bx(wx + Math.cos(a)*1.15, 0, wz + Math.sin(a)*1.15, .55, .78 + (k%2)*.06, .42, hJit("#5e5a52", k/14, .3), 0, -a + Math.PI/2, 0); }
        put("water", wx, .2, wz, 2.0, .02, 2.0);
        for (const s of [-1, 1]) bx(wx + s*1.05, 0, wz, .16, 2.5, .16, "#2e1e12");
        bx(wx, 2.0, wz, 2.3, .1, .1, "#3a2616"); bx(wx + 1.25, 1.95, wz + .15, .06, .3, .06, "#3a2616");
        put("wedge", wx, 2.5, wz, 2.7, .7, 1.5, "#24180f");
        bx(wx, .9, wz, .02, 1.1, .02, "#8a7a5a"); put("cyl", wx, .8, wz, .26, .26, .26, "#3a2a1a");
      } break;
      case "w": put("water", cx, -.02, cz, 1, .05, 1); break;
      case "d": bx(cx, .05, cz, 1, .1, 1, "#3a2a1c"); if (x%2) put("cyl", cx, -.2, cz-.45, .14, .6, .14, "#2a1c12"); break;
      // furniture, reworked for a village with no electricity
      case "B": { bx(cx, 0, cz, .92, .36, .96, "#3a2818"); bx(cx, 0, cz - .47, .92, .9, .08, "#2e1e12"); bx(cx, .36, cz, .86, .12, .88, "#a8925a"); bx(cx, .44, cz + .12, .86, .1, .62, ["#5a2a24","#3a4a34","#4a3a2a","#2e3440"][(x*7+y)%4]); bx(cx, .5, cz - .3, .52, .1, .22, "#cfc4a4"); break; }
      case "O": { bx(cx, 0, cz, .85, 1.9, .55, "#3a2616"); bx(cx, .05, cz + .28, .02, 1.8, .01, "#1a100a"); for (const yy of [.4, 1.4]) for (const s of [-.3, .3]) bx(cx + s, yy, cz + .28, .12, .04, .01, "#1a1a1c"); bx(cx, 1.9, cz, .9, .08, .6, "#2a1a10"); break; }
      case "F": { bx(cx, 0, cz, .85, 1.75, .5, "#3e2a1a"); for (let r=0;r<3;r++){ bx(cx, .45 + r*.5, cz, .82, .04, .48, "#2a1a10"); for (let i=0;i<3;i++) put("cyl", cx - .25 + i*.25, .58 + r*.5, cz + .05, .14, .22, .14, ["#7a5a3a","#5a6a4a","#8a7a6a","#4a3a2a"][(x+i+r)%4]); } break; }
      case "Z": { bx(cx, 0, cz, .9, .55, .6, "#4a3020"); bx(cx, .55, cz, .92, .06, .62, "#3a2616"); for (const s of [-.3, 0, .3]) bx(cx + s, 0, cz, .05, .62, .64, "#26262a"); break; }
      case "C": { bx(cx, 0, cz, 1, 1, .9, "#3e2a1a"); bx(cx, 1, cz, 1.02, .07, .94, "#5a3e26"); if ((x+y)%3===0) candle(cx + .25, 1.07, cz, "night"); if (bid==="diner" && x%2) put("ball", cx - .2, 1.12, cz, .3, .16, .22, "#a8783a"); if (bid==="store" && x===21){ bx(cx, 1.07, cz, .5, .04, .14, "#8a7040"); put("cone", cx - .2, 1.11, cz, .14, .06, .14, "#8a7040"); put("cone", cx + .2, 1.11, cz, .14, .06, .14, "#8a7040"); } break; }
      case "e": { bx(cx, 0, cz, 1, 1.05, .9, "#2e1e12"); bx(cx, 1.05, cz, 1.04, .07, .96, "#4a3020"); if (x%2) put("cyl", cx, 1.2, cz, .12, .18, .12, "#7a7468"); else candle(cx, 1.12, cz, "always"); break; }
      case "k": {
        bx(cx, 0, cz, .95, 1.05, .8, "#5a5650"); bx(cx, 1.05, cz, 1.0, .1, .85, "#4a4640"); bx(cx, 0, cz, .55, .55, .82, "#0a0806");
        bx(cx, 1.15, cz - .2, .45, 1.4, .4, "#4e4a44"); put("ball", cx, .32, cz + .05, .3, .26, .3, "#1a1a1c");
        fire(cx, .18, cz + .25, .45, "always", "hearth");
        break;
      }
      case "K": { bx(cx, .7, cz, .95, .08, .9, "#5a3e26"); for (const s of [-.38, .38]){ bx(cx + s, 0, cz, .08, .7, .7, "#3a2616"); } bx(cx, .2, cz, .76, .06, .08, "#3a2616"); candle(cx, .78, cz, "night"); if ((x+y)%2) put("cyl", cx + .25, .82, cz + .15, .14, .08, .14, "#6a5a48"); break; }
      case "c": { bx(cx, .42, cz, .42, .07, .42, "#4a3020"); bx(cx, .42, cz - .19, .42, .55, .06, "#3a2616"); for (const [a,b2] of [[-.17,-.17],[.17,-.17],[-.17,.17],[.17,.17]]) bx(cx+a, 0, cz+b2, .05, .42, .05, "#2a1a10"); break; }
      case "S": { bx(cx, 0, cz, .95, .45, .7, "#3a2818"); bx(cx, .45, cz - .3, .95, .55, .12, "#2e1e12"); bx(cx, .45, cz + .02, .8, .06, .6, "#6a5a48"); break; }
      case "P": { put("cyl", cx, .17, cz, .32, .34, .32, "#7a3a20"); for (let i=0;i<4;i++) bx(cx + (rr(i)-.5)*.15, .3, cz + (rr(i+4)-.5)*.15, .03, .45, .03, "#5a5a3a", (rr(i+1)-.5)*.6, 0, (rr(i+2)-.5)*.6); if (rr(9) > .75) put("ball", cx, .45, cz, .2, .2, .2, "#d8d0b8"); break; }
      case "W": { bx(cx, 0, cz, .95, .78, .6, "#4a3020"); bx(cx, .78, cz, .98, .05, .62, "#3a2616"); bx(cx - .15, .83, cz, .36, .02, .26, "#d8ccaa"); bx(cx - .15, .84, cz, .01, .02, .26, "#6a5a3a"); bx(cx + .22, .83, cz - .1, .02, .22, .02, "#e8e0d0", .4); candle(cx + .3, .83, cz + .12, "night"); break; }
      case "H": case "I": { bx(cx, 0, cz, .95, 1.9, .45, "#2e1e12"); const cols = ["#5a2a24","#3a4a34","#6a5a3a","#2e3440","#7a6a4a","#4a2a3a"]; for (let r2=0;r2<3;r2++){ bx(cx, .18 + r2*.58, cz, .92, .03, .44, "#1e140c"); for (let i=0;i<5;i++) bx(x+.14+i*.18, .21+r2*.58, cz+.04, .12, .28 + ((x+i+r2)%3)*.04, .3, cols[(x+i+r2*2)%6]); } break; }
      case "A": { put("cyl", cx, .7, cz, .8, .08, .8, "#2a3a2a"); put("cyl", cx, .35, cz, .2, .7, .2, "#3a2616"); bx(cx - .1, .74, cz, .06, .06, .06, "#e8e0d0"); bx(cx + .08, .74, cz + .1, .06, .06, .06, "#e8e0d0"); put("cyl", cx + .2, .8, cz - .15, .1, .12, .1, "#4a3020"); candle(cx - .25, .74, cz - .2, "always"); break; }
      case "j": { put("cyl", cx, .5, cz, .8, .9, .8, "#4a3020", 0, 0, Math.PI/2); for (const s of [-.3, .3]) put("cyl", cx + s, .5, cz, .82, .05, .82, "#26262a", 0, 0, Math.PI/2); bx(cx, 0, cz, .8, .14, .6, "#2a1a10"); break; }
      case "Q": { bx(cx, .7, cz, .95, .06, .95, "#3a1a1a"); bx(cx, 0, cz, .2, .7, .2, "#2a1a10"); bx(cx - .2, .76, cz - .1, .12, .01, .18, "#e8e0d0"); bx(cx + .2, .76, cz + .1, .12, .01, .18, "#e8e0d0"); candle(cx, .76, cz, "always"); break; }
      case "%": { const zz = y + .5; bx(cx, 1.2, zz + .02, .5, .5, .06, "#3a2616"); put("ball", cx, 1.45, zz + .14, .22, .26, .28, "#d8d0b8"); for (const s of [-1, 1]){ bx(cx + s*.1, 1.55, zz + .14, .04, .4, .04, "#c8c0a8", 0, 0, -s*.7); bx(cx + s*.28, 1.75, zz + .14, .03, .2, .03, "#c8c0a8", 0, 0, -s*.2); } break; }
      case "=": bx(cx, 0, cz, 1, .45, .45, "#3a2616"); bx(cx, .45, cz - .18, 1, .5, .08, "#2e1e12"); break;
      case "+": { bx(cx, 0, cz, .95, 1, .6, "#7a766a"); bx(cx, .98, cz, .97, .04, .62, "#5a1018"); bx(cx, .3, cz + .31, .5, .7, .01, "#5a1018"); for (const s of [-.35, .35]){ bx(cx + s, 1, cz, .08, .38, .08, "#d8ccaa"); fire(cx + s, 1.45, cz, .22, "always", "candle"); } bx(cx, 1, cz - .1, .06, .7, .06, "#2a2a2e"); bx(cx, 1.5, cz - .1, .34, .06, .06, "#2a2a2e"); break; }
      case "&": { bx(cx, 0, cz, 1, 1.4, .6, "#2a1a10"); for (let i=0;i<7;i++) put("cyl", x + .1 + i*.13, 1.4 + (.3 + Math.abs(3-i)*.18)/2, cz - .1, .08, .3 + Math.abs(3-i)*.18 + .3, .08, "#8a8478"); break; }
      case "m": { const left = tileT(x-1,y)!=="m", top = tileT(x,y-1)!=="m"; if (left && top){
        bx(x + 1.5, .5, y + 1, 2.6, .12, 1.5, "#4a3020"); for (const s of [-.72, .72]) bx(x + 1.5, .6, y + 1 + s, 2.6, .4, .06, "#3a2616"); bx(x + .22, .6, y + 1, .06, .4, 1.5, "#3a2616");
        for (const [wx2, wz2] of [[.7, .15], [.7, 1.85], [2.3, .15], [2.3, 1.85]]) put("disc", x + wx2, .42, y + wz2, .84, .84, .08, "#2a1c12");
        bx(x + 2.8, .5, y + .7, 1.4, .06, .06, "#3a2616", 0, 0, -.1); bx(x + 2.8, .5, y + 1.3, 1.4, .06, .06, "#3a2616", 0, 0, -.1);
        for (let i=0;i<3;i++) bx(x + 1 + i*.5, .62, y + 1, .4, .3, .5, ["#5a4a3a","#4a3020","#6a5a3a"][i]);
      } break; }
    }
  }
  // the square: gallows, bonfire, a gibbet, skulls on pikes at the edges of town
  const gw = HW.gallows || [36,43];
  if (gw){
    const gx = gw[0] + .5, gz = gw[1] + .5;
    for (const s of [-1, 1]){ bx(gx + s, 0, gz, .22, 3.5, .22, "#2a1c12"); bx(gx + s, 0, gz, .5, .14, .5, "#3a2a1c"); bx(gx + s*.85, 2.85, gz, .1, .75, .1, "#2a1c12", 0, 0, -s*.75); }
    bx(gx, 3.45, gz, 2.5, .22, .24, "#2e1e12");
    const noose = new THREE.Group(); noose.position.set(gx, 3.45, gz);
    const rope = new THREE.Mesh(hGeo().box, mat3("#8a7a5a")); rope.scale.set(.035, 1.0, .035); rope.position.y = -.5; noose.add(rope);
    const loop = new THREE.Mesh(new THREE.TorusGeometry(.12, .025, 5, 10), mat3("#8a7a5a")); loop.position.y = -1.12; noose.add(loop);
    const knot = new THREE.Mesh(hGeo().cyl, mat3("#7a6a4a")); knot.scale.set(.07, .16, .07); knot.position.y = -.95; noose.add(knot);
    noose.traverse(o=>{ o.castShadow = true; }); W.add(noose); T3.hw.noose = noose;
    T3.hw.perches.push([gx - .9, 3.58, gz], [gx + .7, 3.58, gz]);
  }
  const bf = HW.bonfire || [42,44];
  if (bf){
    const fx0 = bf[0] + .5, fz0 = bf[1] + .5;
    for (let k=0;k<11;k++){ const a = k/11*Math.PI*2; put("ball", fx0 + Math.cos(a)*.55, .08, fz0 + Math.sin(a)*.55, .26, .2, .24, hJit("#5a5650", k/11, .4)); }
    for (let k=0;k<7;k++){ const a = k/7*Math.PI*2, [rx, ry] = tilt(-Math.cos(a), -Math.sin(a), .42); bx(fx0 + Math.cos(a)*.45, 0, fz0 + Math.sin(a)*.45, .1, 1.25, .1, "#2a1a10", rx, ry, 0); }
    bx(fx0, 0, fz0, .5, .12, .5, "#ff6a18"); L.glow.push(L.box.pop());
    fire(fx0, .4, fz0, 1.5, "bonfire", "bonfire"); fire(fx0 + .15, .35, fz0 - .1, 1.1, "bonfire", "bonfire"); fire(fx0 - .15, .3, fz0 + .12, 1.0, "bonfire", "bonfire");
    T3.lampPos.push([fx0, 1.4, fz0]); T3.hw.bonfirePos = [fx0, 1.4, fz0];
  }
  const gib = [46, 38];
  if (tileT(gib[0], gib[1])==="q"){
    const gx = gib[0] + .5, gz = gib[1] + .5;
    bx(gx, 0, gz, .2, 3.4, .2, "#2a1c12"); bx(gx - .5, 3.3, gz, 1.2, .14, .14, "#2a1c12");
    const cage = new THREE.Group(); cage.position.set(gx - .9, 3.25, gz);
    const parts = [];
    for (let k=0;k<8;k++){ const a = k/8*Math.PI*2; parts.push({geo:"box", w:.03, h:1.2, d:.03, col:"#1a1a1c", x:Math.cos(a)*.28, y:-1.0, z:Math.sin(a)*.28}); }
    for (const yy of [-.42, -1.0, -1.58]) parts.push({geo:"cyl", w:.6, h:.03, d:.6, col:"#1a1a1c", x:0, y:yy, z:0});
    parts.push({geo:"box", w:.02, h:.36, d:.02, col:"#1a1a1c", x:0, y:-.22, z:0});
    parts.push({geo:"ball", w:.2, h:.24, d:.22, col:"#c8c0a8", x:.04, y:-.66, z:0});
    for (let k=0;k<5;k++) parts.push({geo:"box", w:.24, h:.03, d:.03, col:"#c8c0a8", x:0, y:-.85 - k*.07, z:0, ry:k*.2});
    parts.push({geo:"box", w:.04, h:.5, d:.04, col:"#c8c0a8", x:.06, y:-1.2, z:.03, rz:.15}); parts.push({geo:"box", w:.04, h:.5, d:.04, col:"#c8c0a8", x:-.06, y:-1.25, z:-.03, rz:-.2});
    const cm = new THREE.Mesh(mergeParts(parts), vcMat()); cm.castShadow = true; cage.add(cm); W.add(cage); T3.hw.cage = cage;
  }
  for (const [px, pz] of [[1.5, 29.2], [1.5, 32.8], [102.5, 29.2], [102.5, 32.8]]){
    bx(px, 0, pz, .07, 2.3, .07, "#2a1c12", (rnd(px, pz, 1)-.5)*.15); put("ball", px, 2.35, pz, .26, .3, .3, "#d8d0b8");
    bx(px - .06, 2.36, pz + (pz < 31 ? .15 : -.15), .07, .07, .02, "#000"); bx(px + .06, 2.36, pz + (pz < 31 ? .15 : -.15), .07, .07, .02, "#000");
  }
  // scarecrows in the fields
  for (const [sx, sy] of [[8,74],[14,77],[11,72],[5,79]]){
    if (!"Up".includes(tileT(sx, sy))) continue;
    const g = new THREE.Group(); g.position.set(sx + .5, 0, sy + .5); g.rotation.y = rnd(sx, sy, 2)*6;
    const body = [
      {w:.1, h:2.2, d:.1, col:"#3a2a1c", x:0, y:1.1, z:0}, {w:1.5, h:.08, d:.08, col:"#3a2a1c", x:0, y:1.6, z:0},
      {w:.5, h:.7, d:.28, col:"#3a3a2a", x:0, y:1.35, z:0}, {w:.56, h:.2, d:.3, col:"#2e2e22", x:0, y:1.0, z:0},
      {w:.62, h:.14, d:.16, col:"#3a3a2a", x:-.42, y:1.6, z:0, rz:.1}, {w:.62, h:.14, d:.16, col:"#3a3a2a", x:.42, y:1.6, z:0, rz:-.1},
      {w:.08, h:.18, d:.04, col:"#a08848", x:-.74, y:1.52, z:0, rz:.3}, {w:.08, h:.18, d:.04, col:"#a08848", x:.74, y:1.52, z:0, rz:-.3},
      {w:.1, h:.2, d:.04, col:"#a08848", x:.1, y:.94, z:.05, rz:.2}, {w:.08, h:.22, d:.04, col:"#a08848", x:-.12, y:.92, z:-.05, rz:-.3}
    ];
    const bm = new THREE.Mesh(mergeParts(body), vcMat()); bm.castShadow = true; g.add(bm);
    const head = new THREE.Group(); head.position.y = 1.88; g.add(head);
    const hb = new THREE.Mesh(hGeo().box, [mat3("#8a7650"), mat3("#8a7650"), mat3("#8a7650"), mat3("#8a7650"), texMat("burlap", texBurlap()), mat3("#8a7650")]); hb.scale.set(.36, .4, .34); hb.castShadow = true; head.add(hb);
    const hat = new THREE.Mesh(mergeParts([{geo:"cyl", w:.7, h:.03, d:.7, col:"#2a2018", x:0, y:.22, z:0, rz:.08}, {geo:"cone", w:.36, h:.36, d:.36, col:"#2a2018", x:0, y:.4, z:0, rz:.25}]), vcMat()); hat.castShadow = true; head.add(hat);
    W.add(g); T3.hw.scarecrows.push({g, head, x:sx + .5, z:sy + .5, yaw:0});
    T3.hw.perches.push([sx + .5 + Math.cos(g.rotation.y)*.7, 1.68, sy + .5 - Math.sin(g.rotation.y)*.7]);
  }
  // instanced meshes
  const addInst = (list, geo, material, shadow=true) => {
    if (!list.length) return null;
    const m = new THREE.InstancedMesh(geo, material, list.length), o = new THREE.Object3D(), col = new THREE.Color();
    list.forEach((p,i)=>{ o.position.set(p[0],p[1],p[2]); o.scale.set(p[3],p[4],p[5]); o.rotation.set(p[7]||0, p[8]||0, p[9]||0, "YXZ"); o.updateMatrix(); m.setMatrixAt(i, o.matrix); if (p[6]){ col.set(p[6]); m.setColorAt(i, col); } });
    m.castShadow = shadow; m.receiveShadow = true; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    W.add(m); return m;
  };
  const bg = boxGeo();
  addInst(L.box, bg, new THREE.MeshLambertMaterial({color:0xffffff}));
  T3.glowMesh = addInst(L.glow, bg, new THREE.MeshBasicMaterial({color:0xffffff}), false);
  const base = g => g.clone().translate(0, .5, 0);
  addInst(L.cyl, HG.cyl, new THREE.MeshLambertMaterial({color:0xffffff}));
  addInst(L.cone, HG.cone, new THREE.MeshLambertMaterial({color:0xffffff}));
  addInst(L.ball, HG.ball, new THREE.MeshLambertMaterial({color:0xffffff}));
  addInst(L.disc, HG.disc, new THREE.MeshLambertMaterial({color:0xffffff}));
  addInst(L.ico, new THREE.IcosahedronGeometry(.5, 0), new THREE.MeshLambertMaterial({color:0xffffff, flatShading:true}));
  addInst(L.pine, base(new THREE.ConeGeometry(.5, 1, 7)), new THREE.MeshLambertMaterial({color:0xffffff, flatShading:true}));
  addInst(L.wedge, HG.wedge, new THREE.MeshLambertMaterial({color:0xffffff, side:THREE.DoubleSide}));
  T3.water = addInst(L.water, bg, new THREE.MeshLambertMaterial({color:0x0a1416, transparent:true, opacity:.88}), false);
  T3.hw.jackMats = [];
  for (let v=0; v<3; v++){ const mt = new THREE.MeshLambertMaterial({map:texJack(false, v), emissiveMap:texJack(true, v), emissive:0x000000}); T3.hw.jackMats.push(mt); addInst(L["jack"+v], new THREE.SphereGeometry(.5, 12, 8), mt); }
  // walls, windows and roofs by building
  T3.bld = new Map();
  const byB = new Map();
  for (const [k, list] of walls){ const [id, v] = k.split("|"); if (!byB.has(id)) byB.set(id, []); byB.get(id).push([+v, list]); }
  for (const [id, sets] of byB){
    const b = BUILDINGS.find(q=>q.id===id) || null, st = hwStyle(b);
    const group = new THREE.Group(); W.add(group);
    const wmeshes = [];
    for (const [v, list] of sets){ const wm = addInst(list.map(p=>p.concat([null])), bg, hwWallMat(b, v)); W.remove(wm); group.add(wm); wmeshes.push(wm); }
    const tops = [].concat(...sets.map(s=>s[1])).filter(p=>p[1]+p[4] >= WALL_H-.01).map(p=>[p[0], WALL_H, p[2], 1.06, .14, 1.06, null]);
    const trim = addInst(tops, bg, mat3(st.wall==="timber" ? st.beam : "#3a3632"));
    const gl = glass.get(id) ? addInst(glass.get(id).map(p=>p.concat([null])), bg, new THREE.MeshLambertMaterial({map:texGlass(false), emissiveMap:texGlass(true), emissive:0x000000, color:0xc0c8c0})) : null;
    T3.bld.set(id, {b, walls:group, trim, glass:gl, roof:null});
  }
  for (const b of BUILDINGS){
    const rec = T3.bld.get(b.id); if (!rec) continue;
    const st = hwStyle(b), seed = [...b.id].reduce((s,c)=>s+c.charCodeAt(0),0);
    const Wd = b.x1-b.x0+1, Dp = b.y1-b.y0+1, g = new THREE.Group();
    const along = Wd >= Dp, Lr = along ? Wd : Dp, Dr = along ? Dp : Wd, h = Math.min(Wd, Dp) * (st.roof==="thatch" ? .5 : .42);
    const roofTex = st.roof==="thatch" ? texThatch(seed) : texSlate(st.slate || "#3a3e46");
    const roofMat = hMat(`roof:${st.roof}:${st.slate||""}:${seed%2}`, () => { const t = roofTex.clone(); t.needsUpdate = true; t.repeat.set(st.roof==="thatch" ? .5 : .6, st.roof==="thatch" ? .9 : 1.2); return new THREE.MeshLambertMaterial({map:t, side:THREE.DoubleSide}); });
    const gableMat = hwWallMat(b, 2);
    const roof = new THREE.Mesh(gableGeo(Lr, Dr, h, st.roof==="thatch" ? .55 : .4), [roofMat, gableMat]);
    if (!along) roof.rotation.y = Math.PI/2;
    roof.castShadow = true; roof.receiveShadow = true; g.add(roof);
    // ridge
    const ridge = new THREE.Mesh(st.roof==="thatch" ? hGeo().cyl : hGeo().box, mat3(st.roof==="thatch" ? "#4a3a20" : "#24262a"));
    if (st.roof==="thatch"){ ridge.scale.set(.32, Lr + 1.1, .32); ridge.rotation.z = Math.PI/2; } else ridge.scale.set(Lr + .8, .1, .16);
    ridge.position.y = h + .02; if (!along) ridge.rotation.y = Math.PI/2; if (!along && st.roof==="thatch"){ ridge.rotation.set(Math.PI/2, 0, 0); }
    ridge.castShadow = true; g.add(ridge);
    const slab = new THREE.Mesh(bg, mat3("#1e1610")); slab.scale.set(Wd+.1, .12, Dp+.1); slab.position.y = -.06; g.add(slab);
    if (st.chimney){
      const chx = (along ? Wd*.28 : Wd*.15), chz = (along ? -Dp*.12 : Dp*.28);
      const chm = new THREE.Mesh(bg, texMat(`chim:${seed%2}`, texStone("#4e4a44", seed))); chm.scale.set(.62, h + .9, .62); chm.position.set(chx, 0, chz); chm.castShadow = true; g.add(chm);
      const cap = new THREE.Mesh(bg, mat3("#2e2c28")); cap.scale.set(.74, .12, .74); cap.position.set(chx, h + .9, chz); g.add(cap);
      T3.hw.smokes.push({x:b.x0 + Wd/2 + chx, y:WALL_H + h + 1.05, z:b.y0 + Dp/2 + chz, heavy:!!st.forge});
    }
    if (b.id==="church"){
      const tw = new THREE.Mesh(bg, texMat("tower", texStone("#5e5a54", 9))); tw.scale.set(2.4, h + 4.6, 2.4); tw.castShadow = true; g.add(tw);
      for (const [ox, oz] of [[-.9,-.9],[.9,-.9],[-.9,.9],[.9,.9],[0,-.9],[0,.9],[-.9,0],[.9,0]]){ const cr = new THREE.Mesh(bg, mat3("#56524c")); cr.scale.set(.5, .45, .5); cr.position.set(ox, h + 4.6, oz); cr.castShadow = true; g.add(cr); }
      for (const [ox, oz, ry] of [[0, 1.21, 0], [0, -1.21, 0], [1.21, 0, Math.PI/2], [-1.21, 0, Math.PI/2]]){ const ar = new THREE.Mesh(bg, mat3("#0a0808")); ar.scale.set(.6, 1.1, .04); ar.position.set(ox, h + 3.1, oz); ar.rotation.y = ry; g.add(ar); }
      const sp = new THREE.Mesh(new THREE.ConeGeometry(1.3, 4.2, 4).translate(0, 2.1, 0), texMat("spire", (() => { const t = texSlate("#30343c").clone(); t.needsUpdate = true; t.repeat.set(2, 3); return t; })())); sp.rotation.y = Math.PI/4; sp.position.y = h + 4.6; sp.castShadow = true; g.add(sp);
      const cr1 = new THREE.Mesh(bg, mat3("#1e1e22")); cr1.scale.set(.12, 1.1, .12); cr1.position.y = h + 8.7; g.add(cr1);
      const cr2 = new THREE.Mesh(bg, mat3("#1e1e22")); cr2.scale.set(.6, .12, .12); cr2.position.y = h + 9.35; g.add(cr2);
      T3.hw.perches.push([b.x0 + Wd/2 + .9, WALL_H + h + 5.1, b.y0 + Dp/2 + .9], [b.x0 + Wd/2 - .9, WALL_H + h + 5.1, b.y0 + Dp/2 - .9]);
      T3.hw.belfry = [b.x0 + Wd/2, WALL_H + h + 3.2, b.y0 + Dp/2];
    }
    g.position.set(b.x0 + Wd/2, WALL_H, b.y0 + Dp/2);
    W.add(g); rec.roof = g;
    if (b.sign){
      const sg = hwSignMesh(b.name && b.name.length <= 18 ? b.name.replace(/^The /, "") : b.sign); const [dx,dy] = b.door; const front = dy===b.y1 ? 1 : dy===b.y0 ? -1 : 0;
      sg.position.set(dx+.5, WALL_H-.25, front ? (front>0 ? b.y1+1.07 : b.y0-.07) : dy+.5);
      if (!front){ sg.rotation.y = b.door[0]===b.x0 ? -Math.PI/2 : Math.PI/2; sg.position.x = b.door[0]===b.x0 ? b.x0-.07 : b.x1+1.07; } else if (front<0) sg.rotation.y = Math.PI;
      W.add(sg);
    }
    // ridge perches for crows
    if (b.kind!=="home" || seed % 2) T3.hw.perches.push([b.x0 + Wd/2 + (along ? (seed%5-2)*.6 : 0), WALL_H + h + .14, b.y0 + Dp/2 + (along ? 0 : (seed%5-2)*.6)]);
  }
  // doors that open and close
  const doorMat = texMat("door", texDoor());
  T3.doors = doors.map(d => { const m = new THREE.Mesh(bg, doorMat); m.scale.set(d.alongX ? .96 : .1, 2.12, d.alongX ? .1 : .96); m.position.set(d.cx, 0, d.cz); m.castShadow = true; W.add(m); const kb = new THREE.Mesh(new THREE.TorusGeometry(.06, .015, 4, 8), mat3("#3a3a40")); kb.position.set(d.cx + (d.alongX ? .3 : .07), 1.0, d.cz + (d.alongX ? .07 : .3)); if (!d.alongX) kb.rotation.y = Math.PI/2; W.add(kb); return Object.assign(d, {mesh:m, knob:kb}); });
  // stars and rain (shared with the plain 3D build)
  if (!T3.stars){ const pts = []; for (let i=0;i<500;i++){ const th = Math.random()*Math.PI*2, ph = Math.random()*Math.PI*.45; pts.push(Math.cos(th)*Math.cos(ph)*180, Math.sin(ph)*180+10, Math.sin(th)*Math.cos(ph)*180); } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts,3)); T3.stars = new THREE.Points(g, new THREE.PointsMaterial({color:0xd8e0ff, size:1.1, sizeAttenuation:false, transparent:true, opacity:0, fog:false})); T3.scene.add(T3.stars); }
  if (!T3.rain){ const pts = []; for (let i=0;i<1600;i++) pts.push((Math.random()-.5)*40, Math.random()*18, (Math.random()-.5)*40); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts,3)); T3.rain = new THREE.Points(g, new THREE.PointsMaterial({color:0x8a9aa8, size:.07, transparent:true, opacity:.6})); T3.rain.visible = false; T3.scene.add(T3.rain); }
  T3.dyn = new THREE.Group(); W.add(T3.dyn);
  T3.chars.clear(); T3.dynObj = null;
  T3.builtFor = tmap;
  if (typeof HWFX !== "undefined") HWFX.onBuild(W);
}

// ---------- people ----------
const HW_TUNIC = c => hMix(c, "#3e3226", .5);
function hwMakeChar3D(L){
  hGeo();
  const g = new THREE.Group(), [suitC, suitD] = suitCols(L), big = L.big ? 1.12 : 1;
  const seed = [...JSON.stringify(L)].reduce((s,ch)=>(s*31 + ch.charCodeAt(0)) >>> 0, 7);
  const tunic = L.suit==="o" ? "#7a4424" : HW_TUNIC(suitC), tunicD = hMix(tunic, "#000", .25);
  const hose = hMix(L.pants || suitD, "#2a241e", .55), boot = ["#2a1e16","#1e1812","#3a2618"][seed%3], skin = L.skin || "#d49a6a";
  const linen = "#cfc4a8", leather = "#3a2616", brass = "#a08848";
  const cloakCol = ["#22201e","#2e2420","#24302a","#2a2632","#3a2a22"][seed%5], hasCloak = seed % 3 !== 0 || L.style==="hat" || L.style==="beanie";
  const hoodUp = L.style==="beanie" || (L.style==="hat" && seed%2===0);
  const B = [], LL = [], LR = [], AL = [], AR = [], H = [];
  const p = (list, w,h,d, col, x,y,z, extra={}) => list.push(Object.assign({w,h,d,col,x,y,z}, extra));
  // legs (pivot at hip, .62 up)
  for (const list of [LL, LR]){
    p(list, .16,.36,.19, hose, 0,-.18,0); p(list, .19,.3,.23, boot, 0,-.47,.01); p(list, .21,.07,.25, hMix(boot, "#fff", .12), 0,-.33,.01); p(list, .2,.04,.29, "#120c08", 0,-.6,.03);
  }
  // body
  const tw = .46*big;
  p(B, tw,.56,.27*big, tunic, 0,.9,0);
  p(B, tw+.06,.2,.31*big, tunicD, 0,.58,0);
  p(B, tw+.02,.06,.29*big, leather, 0,.7,0); p(B, .07,.06,.03, brass, 0,.7,.15*big);
  p(B, .1,.12,.06, leather, .2*big,.62,.12); p(B, .03,.24,.04, "#2a2a2a", -.2*big,.56,.1, {rz:.15});
  p(B, .16,.07,.02, linen, 0,1.13,.137*big);
  if (L.tie || seed%4===1) for (let i=0;i<3;i++) p(B, .08,.012,.01, "#1a120c", 0,1.06 - i*.06,.14*big, {rz:i%2 ? .5 : -.5});
  if (L.collar) p(B, .34,.06,.3, linen, 0,1.16,0);
  if (L.apron) p(B, .38,.62,.02, L.apron==="#f4f4f4" ? "#bfb49a" : "#4a3424", 0,.62,.15*big);
  if (L.badge){ for (let i=-2;i<=2;i++) p(B, .05,.04,.02, brass, i*.06,1.12 - Math.abs(i)*.04 - .08,.14*big); p(B, .09,.09,.02, "#d8b860", 0,.95,.145*big); p(B, tw+.12,.18,.34, "#1e2a3a", 0,1.12,0); }
  if (hasCloak){ p(B, tw+.06,1.05,.05, cloakCol, 0,.64,-.165*big); p(B, tw+.12,.12,.34*big, cloakCol, 0,1.14,0); if (!hoodUp) p(B, .32,.14,.12, cloakCol, 0,1.2,-.15); }
  p(B, .14,.08,.14, skin, 0,1.2,0);
  // arms (pivot at shoulder)
  for (const list of [AL, AR]){
    p(list, .15,.28,.17, tunic, 0,-.12,0); p(list, .125,.22,.145, L.suit==="o" ? tunicD : linen, 0,-.36,0); p(list, .14,.05,.16, tunicD, 0,-.46,0); p(list, .1,.1,.11, skin, 0,-.53,0); p(list, .03,.06,.08, skin, .05,-.55,.02);
  }
  // head (pivot at the neck, 1.18 up)
  p(H, .34,.36,.32, skin, 0,.18,0);
  p(H, .05,.09,.07, hMix(skin, "#000", .1), -.18,.17,0); p(H, .05,.09,.07, hMix(skin, "#000", .1), .18,.17,0);
  p(H, .06,.08,.05, hMix(skin, "#000", .06), 0,.14,.18);
  const HC = L.hair || "#3f2616", st = L.style;
  if (L.glasses || L.shades){ const lens = L.shades ? "#0a0a0a" : "#8a9a9a"; p(H, .09,.07,.015, lens, -.08,.22,.168); p(H, .09,.07,.015, lens, .08,.22,.168); p(H, .06,.012,.01, "#2a2a2a", 0,.23,.17); }
  if (L.beard) p(H, .3,.12,.06, L.beard, 0,.03,.16);
  if (hoodUp){
    const hc = L.hatColor ? hMix(L.hatColor, "#2a2420", .5) : cloakCol;
    p(H, .42,.08,.38, hc, 0,.4,-.01); p(H, .06,.36,.36, hc, -.2,.2,-.01); p(H, .06,.36,.36, hc, .2,.2,-.01); p(H, .42,.4,.06, hc, 0,.2,-.18); p(H, .3,.2,.12, hc, 0,.12,-.24, {rx:.5}); p(H, .42,.05,.04, hMix(hc, "#000", .3), 0,.38,.17);
  } else if (st==="hat"){
    const hc = L.hatColor ? hMix(L.hatColor, "#2a2420", .4) : "#2a2018";
    p(H, .62,.03,.62, hc, 0,.37,0, {geo:"cyl", rz:.06}); p(H, .34,.26,.34, hc, 0,.5,0, {geo:"cyl"}); p(H, .35,.04,.35, "#1a120c", 0,.41,0, {geo:"cyl"});
    p(H, .38,.1,.36, HC, 0,.33,0); p(H, .38,.26,.06, HC, 0,.22,-.17);
  } else if (st==="cap"){
    // the reeve's men wear iron
    p(H, .44,.04,.44, "#4a4a50", 0,.36,0, {geo:"cyl"}); p(H, .38,.22,.38, "#5a5a62", 0,.42,0, {geo:"ball"}); p(H, .04,.18,.04, "#3a3a40", 0,.2,.18);
    p(H, .38,.28,.06, HC, 0,.22,-.17);
  } else if (st==="bald"){ p(H, .37,.1,.2, HC, 0,.2,-.1); }
  else if (st==="afro"){ p(H, .5,.3,.48, HC, 0,.4,-.02, {geo:"ball"}); }
  else if (st==="mohawk"){ p(H, .08,.18,.38, HC, 0,.42,0); }
  else if (st==="buzz"){ p(H, .37,.04,.35, HC, 0,.37,0); }
  else {
    p(H, .38,.1,.36, HC, 0,.39,0); p(H, .38,.3,.06, HC, 0,.24,-.17); p(H, .04,.14,.1, HC, -.18,.26,.1); p(H, .04,.14,.1, HC, .18,.26,.1);
    if (st==="long"){ p(H, .4,.55,.1, HC, 0,.04,-.18); p(H, .06,.36,.3, HC, -.19,.16,0); p(H, .06,.36,.3, HC, .19,.16,0); }
    if (st==="bob"){ p(H, .07,.26,.34, HC, -.19,.22,0); p(H, .07,.26,.34, HC, .19,.22,0); }
    if (st==="ponytail" || L.bun){ p(H, .12,.25,.1, HC, 0,.15,-.25); p(H, .06,.06,.06, "#3a2616", 0,.27,-.22); }
    if (st==="curly"){ p(H, .42,.14,.4, HC, 0,.42,0); for (let i=0;i<5;i++) p(H, .1,.1,.1, hMix(HC, "#000", .15), -.16 + i*.08,.46,.12 - (i%2)*.24, {geo:"ball"}); }
    if (st==="slick" || st==="neat"){ p(H, .38,.04,.1, hMix(HC, "#fff", .1), 0,.44,.12); }
  }
  const mk = (list, parent, px, py, pz) => { const m = new THREE.Mesh(mergeParts(list), vcMat()); m.castShadow = true; m.receiveShadow = false; const pv = new THREE.Group(); pv.position.set(px, py, pz); pv.add(m); parent.add(pv); return [pv, m]; };
  const [legL] = mk(LL, g, -.11, .62, 0), [legR] = mk(LR, g, .11, .62, 0);
  const torsoMesh = new THREE.Mesh(mergeParts(B), vcMat()); torsoMesh.castShadow = true; g.add(torsoMesh);
  const [armL] = mk(AL, g, -.29*big, 1.12, 0), [armR] = mk(AR, g, .29*big, 1.12, 0);
  const [head, headMesh] = mk(H, g, 0, 1.18, 0);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(.34, .36), texMat(`face:${seed}`, texFace(L, seed % 997)));
  face.position.set(0, .18, .1615); head.add(face);
  const tag = new THREE.Object3D(); tag.position.y = 1.9; g.add(tag);
  const c = {g, legL, legR, armL, armR, head, torso:torsoMesh, tag, face, masks:{}, mask:null, key:JSON.stringify(L)};
  c.setMask = type => {
    if (c.mask === type) return;
    if (c.mask && c.masks[c.mask]) c.masks[c.mask].visible = false;
    c.mask = type; face.visible = !type;
    if (type){ if (!c.masks[type]){ c.masks[type] = hwMask(type); head.add(c.masks[type]); } c.masks[type].visible = true; }
  };
  return c;
}
// masks, built from a few boxes and a painted front
function hwMask(type){
  const g = new THREE.Group(), parts = [];
  const front = (w, h, z, y=.18) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), texMat("mask:"+type, texMask(type))); m.position.set(0, y, z); g.add(m); };
  const p = (w,h,d,col,x,y,z,extra={}) => parts.push(Object.assign({w,h,d,col,x,y,z}, extra));
  if (type==="skull"){ p(.36,.36,.04,"#c8c0a8",0,.18,.165); p(.3,.08,.06,"#b8b0a0",0,-.01,.15); front(.36, .36, .188); }
  if (type==="porcelain"){ p(.32,.34,.03,"#ddd6cc",0,.19,.17); front(.32, .34, .187, .19); p(.44,.5,.4,"#0e0c0e",0,.22,-.03); }
  if (type==="plague"){ p(.36,.32,.05,"#2a1e16",0,.2,.165); p(.11,.36,.11,"#2a1e16",0,.1,.33,{geo:"cone", rx:Math.PI/2}); p(.66,.03,.66,"#141012",0,.38,0,{geo:"cyl"}); p(.36,.24,.36,"#141012",0,.52,0,{geo:"cyl"}); p(.42,.32,.08,"#1a1414",0,.08,-.16); front(.36, .32, .192, .2); }
  if (type==="goat"){ p(.36,.36,.05,"#2a221c",0,.18,.165); for (const s of [-1,1]){ p(.07,.42,.07,"#3a3228",s*.13,.42,-.02,{geo:"cone", rx:-.6, rz:-s*.5}); p(.14,.05,.06,"#2a221c",s*.24,.24,.04,{rz:s*.4}); } p(.14,.16,.08,"#2a221c",0,-.02,.2); front(.36, .36, .193); }
  if (type==="sack"){ p(.42,.46,.4,"#8a7650",0,.2,0); p(.4,.05,.36,"#4a3a20",0,-.02,0); front(.42, .46, .201, .2); }
  if (type==="crow"){ p(.37,.36,.05,"#121014",0,.18,.165); p(.1,.44,.12,"#0a0a0c",0,.12,.36,{geo:"cone", rx:Math.PI/2+.15}); p(.46,.12,.44,"#121014",0,-.02,0); for (let i=0;i<5;i++) p(.08,.22,.04,"#18161c",-.16+i*.08,.42,-.08,{rx:-.4}); front(.37, .36, .192); }
  if (parts.length){ const m = new THREE.Mesh(mergeParts(parts), vcMat()); m.castShadow = true; g.add(m); }
  return g;
}

// ---------- sky, light and the moon ----------
function hwSky(dt, now, attract){
  const t = attract ? 1350 : T.t, dk = darknessT(t), night = dk > .25;
  const rain = !attract && T && T.weather==="rain";
  const hallows = !attract && T && T.event && T.event.kind==="hallows" && (T.event.day===T.day || (T.event.day===T.day-1 && t < 360));
  const susp = !attract && T && T.det ? T.det.suspicion : 0;
  const wantBlood = attract ? 0 : (T.mode==="slasher" || hallows || susp >= 80) ? 1 : 0;
  HWS.blood += (wantBlood - HWS.blood) * Math.min(1, dt*.5);
  const dawn = t > 300 && t < 450, dusk = t > 1080 && t < 1260;
  const day = new THREE.Color(rain ? "#5a5e60" : "#8a8476"), nightC = new THREE.Color(HWS.blood > .5 ? "#140608" : "#06070b"), warm = new THREE.Color("#8a3420");
  const col = day.clone().lerp(nightC, Math.min(1, dk/.7));
  if (dawn || dusk) col.lerp(warm, .45 * Math.max(0, 1 - Math.abs(dawn ? (t-375)/75 : (t-1170)/90)));
  const fogC = col.clone().lerp(new THREE.Color(HWS.blood > .5 ? "#2a1012" : "#1a2224"), night ? .55 : .15);
  T3.scene.background = col; T3.scene.fog.color.copy(fogC);
  const insideB = !attract && T && insideOf(T.player);
  T3.scene.fog.near = night ? (insideB ? 9 : 5) : 14; T3.scene.fog.far = night ? (insideB ? 34 : 28) : (rain ? 46 : 66);
  if (attract){ T3.scene.fog.near = 12; T3.scene.fog.far = 70; }
  const cam = T3.camera.position;
  // the sun crosses the south, low and weak
  const sunA = (t - 360) / 720 * Math.PI, sunDir = new THREE.Vector3(Math.cos(sunA)*.9, Math.sin(sunA)*.55 + .04, .45).normalize();
  const moonA = (((t - 1080) + 1440) % 1440) / 720 * Math.PI, moonDir = new THREE.Vector3(Math.cos(moonA)*.6, .1 + Math.max(0, Math.sin(moonA))*.22, -1).normalize();
  if (attract){ const f = new THREE.Vector3(); T3.camera.getWorldDirection(f); f.y = 0; f.normalize(); const r = new THREE.Vector3(-f.z, 0, f.x); moonDir.copy(f).addScaledVector(r, .32); moonDir.y = .2; moonDir.normalize(); }
  if (!T3.sunSpr){
    T3.sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({map:texSun(), fog:false, depthWrite:false, transparent:true, blending:THREE.AdditiveBlending})); T3.sunSpr.scale.set(46, 46, 1); T3.scene.add(T3.sunSpr);
    T3.moonSpr = new THREE.Sprite(new THREE.SpriteMaterial({map:moonTex(), fog:false, depthWrite:false, transparent:true})); T3.moonSpr.scale.set(60, 60, 1); T3.scene.add(T3.moonSpr);
    T3.moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({map:texGlow("#c8d0d8"), fog:false, depthWrite:false, transparent:true, blending:THREE.AdditiveBlending, opacity:.5})); T3.moonHalo.scale.set(130, 130, 1); T3.scene.add(T3.moonHalo);
    T3.sunSpr.renderOrder = T3.moonSpr.renderOrder = T3.moonHalo.renderOrder = -1;
  }
  const sunUp = Math.max(0, Math.sin(sunA)), inside = !attract && insideOf(T.player);
  T3.sunSpr.visible = sunUp > 0 && dk < .6 && !inside; T3.sunSpr.position.copy(cam).addScaledVector(sunDir, 160); T3.sunSpr.material.opacity = rain ? .25 : .85;
  const moonVis = Math.min(1, Math.max(0, (dk - .15) * 2.2));
  T3.moonSpr.visible = T3.moonHalo.visible = moonVis > 0;
  T3.moonSpr.position.copy(cam).addScaledVector(moonDir, 160); T3.moonHalo.position.copy(T3.moonSpr.position);
  T3.moonSpr.material.opacity = moonVis * (rain ? .55 : 1); T3.moonHalo.material.opacity = moonVis * .45; T3.moonHalo.material.color.set(HWS.blood > .5 ? "#ff3020" : "#c8d0d8");
  // the face
  if (T3.moonSpr.visible && now > HWS.moonAt){
    HWS.moonAt = now + 70;
    if (now > HWS.nextBlink){ HWS.blink = now; HWS.nextBlink = now + 2500 + Math.random()*5000; }
    const bt = (now - HWS.blink) / 180, lid = bt < 1 ? Math.sin(bt*Math.PI) : 0;
    let look = [0, .6];
    if (!attract && T){
      const [px, py] = rposT(T.player);
      const a = new THREE.Vector3(px+.5, 1.2, py+.5).project(T3.camera), bm = T3.moonSpr.position.clone().project(T3.camera);
      const dx = a.x - bm.x, dy = -(a.y - bm.y), d = Math.hypot(dx, dy) || 1;
      look = T3.cam.fp ? [0, 0] : [dx/d * Math.min(1, d*1.4), dy/d * Math.min(1, d*1.4)];
      if (T.bodies.length > HWS.bodies) HWS.grinUntil = now + 30000;
      HWS.bodies = T.bodies.length;
    } else { look = [Math.sin(now/1900)*.6, .5]; }
    const wantGrin = attract ? .25 : now < HWS.grinUntil ? 1 : (T && T.mode==="slasher") ? 1 : HWS.blood > .5 ? .5 : 0;
    HWS.grin += (wantGrin - HWS.grin) * .08;
    drawMoon(look, lid, HWS.grin, HWS.blood, now/400);
  }
  // light: a cold sun by day; by night, the moon throws the shadows
  if (night){
    T3.sun.position.copy(new THREE.Vector3(T3.cam.x || 52, 0, T3.cam.z || 42)).addScaledVector(moonDir, 40);
    T3.sun.target.position.set(T3.cam.x || 52, 0, T3.cam.z || 42);
    T3.sun.intensity = (attract ? .5 : .28 + HWS.blood*.08) * moonVis * (rain ? .4 : 1); T3.sun.color.set(HWS.blood > .5 ? "#d06050" : "#9fb4cc");
    T3.hemi.intensity = attract ? .3 : .14; T3.hemi.color.set(HWS.blood > .5 ? "#402028" : "#28344a"); T3.hemi.groundColor.set("#0a0806");
  } else {
    T3.sun.intensity = (.3 + sunUp*.55) * (rain ? .5 : 1); T3.sun.color.set(sunUp < .3 ? "#ffb070" : "#ffdcb0");
    T3.hemi.intensity = .42 + sunUp*.12; T3.hemi.color.set("#b0a890"); T3.hemi.groundColor.set("#3a3020");
  }
  T3.stars.material.opacity = Math.max(0, (dk-.35)*1.1) * (rain ? 0 : 1);
  // torches flicker; candles gutter when something passes
  if (T3.lampAt !== HWS.lampAt){ HWS.lampAt = T3.lampAt; for (const l of T3.lamps){ l.userData.base = l.intensity * (l.distance < 8 ? 1 : 1.25); l.color.set(l.distance < 8 ? "#ffb060" : "#ff8a34"); if (l.distance >= 8) l.distance = 10; } }
  T3.lamps.forEach((l, i) => { const b = l.userData.base || 0; l.intensity = b * HWS.gutter * (.82 + Math.sin(now/90 + i*2.1)*.08 + Math.sin(now/37 + i*5.3)*.06 + (Math.random()-.5)*.05); });
  for (const [k, r] of T3.bld) if (r.glass) r.glass.material.color.set(r.lit && night ? "#ffe0b0" : night ? "#3a4044" : "#b0b8b0");
  const jackOn = dk > .15 || hallows;
  if (T3.hw && T3.hw.jackMats) for (const m of T3.hw.jackMats) m.emissive.setRGB(jackOn ? 1 * HWS.gutter * (.85 + Math.sin(now/120)*.1) : 0, jackOn ? .55 * HWS.gutter : 0, jackOn ? .15 : 0);
  if (T3.glowMesh) T3.glowMesh.material.color.set(dk > .15 ? "#ffffff" : "#5a4a3a");
  T3.pLight.color.set("#ffb070");
  return {dk, night, hallows};
}
// attract mode: a slow, low drift over the torches at night
function hwAttract(now){
  const t = now/1000;
  T3.camera.position.set(52 + Math.cos(t*.04)*30, 13 + Math.sin(t*.07)*2, 44 + Math.sin(t*.04)*24); T3.camera.lookAt(46, 2, 40);
  if (!HWS.attractLit){
    HWS.attractLit = true;
    const near = T3.lampPos.map(p=>({p, d:Math.hypot(p[0]-44, p[2]-40)})).sort((a,b)=>a.d-b.d);
    T3.lamps.forEach((l,i)=>{ const L2 = near[i]; if (L2){ l.position.set(...L2.p); l.intensity = 1.6; l.distance = 10; l.userData.base = 1.6; } });
    HWS.lampAt = T3.lampAt;
  }
}

if (HALLOW){
  buildWorld3D = hwBuildWorld3D;
  makeChar3D = hwMakeChar3D;
  T3.stainMake = s => new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), new THREE.MeshLambertMaterial({map:texBlood((s.x*7 + s.y*3)|0), transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2}));
  T3.nameOf = (n, near) => (HW.masked && HW.masked(n) && near > 2.2) ? "?" : n.met ? n.first : n.job;
  T3.pre = (dt, now, attract) => {
    if (attract) hwAttract(now); else HWS.attractLit = false;
    const sky = hwSky(dt, now, attract);
    if (!attract && T){
      for (const n of folk){ const c = T3.chars.get(n.id); if (c && c.setMask) c.setMask(!n.dead && HW.masked(n) ? HW.maskType(n) : null); }
    }
    if (typeof HWFX !== "undefined") HWFX.update(dt, now, attract, sky);
  };
}
