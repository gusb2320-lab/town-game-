// Millbrook in 3D: the same town, people and rules, drawn with Three.js instead of on a 2D canvas.
// Tiles are 1 unit; tile (x,y) sits at world (x+.5, 0, y+.5). North is -z.
const T3 = {ready:false};
const WALL_H = 2.6;
const C3 = c => new THREE.Color(c);

// ---------- setup ----------
function init3D(){
  if (T3.ready) return;
  const canvas = E.cv;
  const r = new THREE.WebGLRenderer({canvas, antialias:false, powerPreference:"high-performance"});
  r.shadowMap.enabled = true; r.shadowMap.type = HALLOW ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  r.outputEncoding = THREE.sRGBEncoding;
  T3.renderer = r;
  T3.scene = new THREE.Scene();
  T3.camera = new THREE.PerspectiveCamera(55, 1, .1, 400);
  T3.hemi = new THREE.HemisphereLight(0xcfe8ff, 0x5a7a4e, .55); T3.scene.add(T3.hemi);
  T3.sun = new THREE.DirectionalLight(0xfff1d6, 1); T3.sun.castShadow = true;
  T3.sun.shadow.mapSize.set(2048, 2048); const sc = T3.sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 120; T3.sun.shadow.bias = -.0008;
  T3.scene.add(T3.sun, T3.sun.target);
  T3.lamps = []; for (let i=0;i<10;i++){ const l = new THREE.PointLight(0xffc878, 0, 9, 2); T3.scene.add(l); T3.lamps.push(l); }
  T3.pLight = new THREE.PointLight(0xffe0b0, 0, 6, 2); T3.scene.add(T3.pLight);
  T3.flash = new THREE.SpotLight(0xfff4d0, 0, 16, .45, .5, 1.2); T3.scene.add(T3.flash, T3.flash.target);
  T3.room = new THREE.PointLight(0xffd9a0, 0, 12, 1.6); T3.scene.add(T3.room);
  T3.burst = new THREE.PointLight(0xfff0c0, 0, 14, 2); T3.scene.add(T3.burst);
  T3.scene.fog = new THREE.Fog(0x8fc8ff, 30, 80);
  T3.cam = {yaw:0, pitch:1.02, dist:10, fp:false, x:0, y:0, z:0, init:false, fpPitch:0};
  T3.chars = new Map(); T3.mats = new Map();
  T3.ov = $("ov3d"); T3.ovEls = new Map();
  T3.pixel = (()=>{ try { const v = localStorage.getItem("mb3d-pixel"); return v===null ? !HALLOW : v!=="0"; } catch { return !HALLOW; } })();
  T3.sens = (()=>{ try { const v = parseFloat(localStorage.getItem("mb3d-sens")); return v > 0 ? v : 1; } catch { return 1; } })();
  T3.invY = (()=>{ try { return localStorage.getItem("mb3d-invy")==="1"; } catch { return false; } })();
  resize3D(); addEventListener("resize", resize3D);
  wireCamera3D();
  T3.ready = true;
}
function resize3D(){
  if (!T3.renderer) return;
  const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio||1, 2);
  T3.renderer.setPixelRatio(T3.pixel ? Math.max(.35, dpr*.42) : Math.min(dpr, 1.5));
  T3.renderer.setSize(w, h, false);
  E.cv.style.width = w+"px"; E.cv.style.height = h+"px"; E.cv.style.imageRendering = T3.pixel ? "pixelated" : "auto";
  T3.camera.aspect = w/h; T3.camera.updateProjectionMatrix();
}
const mat3 = (col, opt={}) => { const k = col + JSON.stringify(opt); let m = T3.mats.get(k); if (!m){ m = new THREE.MeshLambertMaterial(Object.assign({color:col}, opt)); T3.mats.set(k, m); } return m; };

// ---------- the static world ----------
// Props are boxes: one instanced mesh draws all of them.
function boxGeo(){ const g = new THREE.BoxGeometry(1,1,1); g.translate(0,.5,0); return g; }
function prismGeo(){
  // a gable roof 1 x 1 x 1: ridge along x at the top, eaves at z = ±.5
  const v = [-.5,0,-.5, .5,0,-.5, .5,1,0,  -.5,0,-.5, .5,1,0, -.5,1,0,   -.5,0,.5, -.5,1,0, .5,1,0,  -.5,0,.5, .5,1,0, .5,0,.5,
    -.5,0,-.5, -.5,1,0, -.5,0,.5,   .5,0,-.5, .5,0,.5, .5,1,0,   -.5,0,-.5, -.5,0,.5, .5,0,.5,  -.5,0,-.5, .5,0,.5, .5,0,-.5];
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
}
function bldgOf(x,y){ for (const b of BUILDINGS) if (x>=b.x0 && x<=b.x1 && y>=b.y0 && y<=b.y1) return b; return null; }
function wallColor(b){ if (!b) return "#9a8a7a"; if (b.kind==="home") return shade(b.roof, .55); return {diner:"#f4ecd8", store:"#c2d3dc", barber:"#f4ecd8", clinic:"#f4f4f4", sheriff:"#c8a374", post:"#d8c8b0", hotel:"#c8a374", station:"#b8b0a0", bar:"#8b5a3c", library:"#c8b890", arcade:"#3e2a5c", church:"#e8e8e0", garage:"#94a0a8", barn:"#b13e53"}[b.kind] || shade(b.roof, .5); }
function buildWorld3D(){
  if (tmapDirty) rebuildTownMap();
  if (T3.world) { T3.scene.remove(T3.world); T3.world.traverse(o=>{ if (o.geometry) o.geometry.dispose(); }); }
  const W = new THREE.Group(); T3.world = W; T3.scene.add(W);
  // ground: the 2D pixel map is the ground texture
  const tex = new THREE.CanvasTexture(tmapCv); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearMipMapLinearFilter; tex.anisotropy = 4; tex.encoding = THREE.sRGBEncoding;
  T3.groundTex = tex;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(TW, TH), new THREE.MeshLambertMaterial({map:tex}));
  ground.rotation.x = -Math.PI/2; ground.position.set(TW/2, 0, TH/2); ground.receiveShadow = true; W.add(ground);
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat3("#3d6e3c")); outer.rotation.x = -Math.PI/2; outer.position.set(TW/2, -.02, TH/2); outer.receiveShadow = true; W.add(outer);
  // collectors
  const props = [], glow = [], trunks = [], crowns = [], pines = [], waters = [];
  const box = (x,y,z,sx,sy,sz,col,list=props) => list.push([x,y,z,sx,sy,sz,col]);
  const walls = new Map(), glass = new Map(), doors = [];
  const wallBox = (b, x,z, y0,h) => { const k = b ? b.id : "_"; if (!walls.has(k)) walls.set(k, []); walls.get(k).push([x,y0,z,1,h,1]); };
  const glassBox = (b, x,z, y0,h, alongX) => { const k = b ? b.id : "_"; if (!glass.has(k)) glass.set(k, []); glass.get(k).push([x,y0,z, alongX?1:.18, h, alongX?.18:1]); };
  T3.lampPos = [];
  for (let y=0;y<TH;y++) for (let x=0;x<TW;x++){
    const c = tmap[y][x], cx = x+.5, cz = y+.5, b = bldgOf(x,y), bid = buildingAt(x,y);
    const rr = (s)=>rnd(x,y,s);
    switch (c){
      case "#": wallBox(b, cx, cz, 0, WALL_H); break;
      case "x": { const alongX = tileT(x-1,y)==="#"||tileT(x+1,y)==="#"||tileT(x-1,y)==="x"||tileT(x+1,y)==="x"; wallBox(b, cx, cz, 0, .95); wallBox(b, cx, cz, 1.85, WALL_H-1.85); glassBox(b, cx, cz, .95, .9, alongX); break; }
      case "D": { wallBox(b, cx, cz, 2.15, WALL_H-2.15); const alongX = "#x".includes(tileT(x-1,y)) || "#x".includes(tileT(x+1,y)); doors.push({x, y, cx, cz, alongX, b}); box(cx, 0, cz, alongX?1:.12, .02, alongX?.12:1, "#5e3a24"); break; }
      case "|": for (let i=0;i<4;i++) box(x+.15+i*.23, 0, cz, .06, WALL_H*.9, .06, "#94b0c2"); box(cx, WALL_H*.85, cz, 1, .08, .08, "#566c86"); break;
      case "t": case "T": { const s = .8 + rr(3)*.5; trunks.push([cx+(rr(4)-.5)*.3, 0, cz+(rr(5)-.5)*.3, .22, 1.1*s, .22, "#5e3a24"]); (c==="T" ? pines : crowns).push([cx, 1.0*s, cz, (c==="T"?1.5:1.6)*s, (c==="T"?2.6:1.5)*s, (c==="T"?1.5:1.6)*s, c==="T" ? (rr(6)>.5?"#1f5a34":"#235f3a") : (rr(6)>.5?"#38b764":"#2f9a52")]); break; }
      case "l": box(cx, 0, cz, .12, 2.7, .12, "#1a1c2c"); box(cx, 2.7, cz, .34, .1, .34, "#1a1c2c"); box(cx, 2.45, cz, .22, .25, .22, "#ffe6a0", glow); T3.lampPos.push([cx, 2.5, cz]); break;
      case "f": { box(cx, 0, cz, .12, .9, .12, "#8b5a3c"); const h = "f".includes(tileT(x-1,y)) || "f".includes(tileT(x+1,y)) || tileT(x-1,y)==="p" || tileT(x+1,y)==="p"; if (h){ box(cx, .35, cz, 1, .08, .06, "#a87048"); box(cx, .7, cz, 1, .08, .06, "#a87048"); } else { box(cx, .35, cz, .06, .08, 1, "#a87048"); box(cx, .7, cz, .06, .08, 1, "#a87048"); } break; }
      case "V": box(cx, 0, cz, .6, .9, .18, "#94b0c2"); box(cx, .9, cz, .4, .12, .18, "#c2d3dc"); box(cx, .45, cz-.1, .1, .3, .02, "#566c86"); break;
      case "v": box(cx, 0, cz, .8, .14, .9, "#6e4e30"); break;
      case "U": for (let i=0;i<3;i++) box(x+.2+i*.3, 0, cz, .12, .35+rr(i)*.25, .12, rr(i+3)>.4 ? "#38b764" : "#a7f070"); break;
      case "G": for (let i=0;i<3;i++) box(x+.2+rr(i)*.6, 0, y+.2+rr(i+5)*.6, .08, .25, .08, ["#ffcd75","#ef7d57","#f4f4f4","#e07ab0"][(x+y+i)%4]); break;
      case "n": box(cx, .35, cz, .95, .1, .4, "#a87048"); box(cx, .35, cz-.18, .95, .45, .08, "#8b5a3c"); box(cx-.4, 0, cz, .08, .35, .35, "#1a1c2c"); box(cx+.4, 0, cz, .08, .35, .35, "#1a1c2c"); break;
      case "N": box(cx-.4, 0, cz, .1, 1.4, .1, "#3e2a1c"); box(cx+.4, 0, cz, .1, 1.4, .1, "#3e2a1c"); box(cx, .7, cz, 1, .8, .08, "#a87048"); box(cx-.18, .85, cz+.05, .3, .4, .02, "#f4ecd8"); box(cx+.2, .8, cz+.05, .28, .45, .02, "#f4ecd8"); break;
      case "M": box(cx, 0, cz, .08, .9, .08, "#5e3a24"); box(cx, .9, cz, .3, .25, .45, "#3b5dc9"); box(cx+.17, 1.0, cz, .02, .25, .04, "#b13e53"); break;
      case "Y": box(cx, 0, cz, .95, .9, .8, "#38734a"); box(cx, .9, cz, .98, .08, .82, "#2a5a3a"); break;
      case "J": for (let i=0;i<4;i++) box(x+.2+rr(i)*.6, 0, y+.2+rr(i+2)*.6, .3+rr(i+4)*.4, .2+rr(i+6)*.5, .3+rr(i+8)*.3, ["#b13e53","#566c86","#8b5a3c","#7d7466"][i]); break;
      case "h": box(cx, 0, cz, .9, .55, .7, "#ffcd75"); box(cx, .55, cz, .85, .04, .65, "#c8a374"); break;
      case "o": box(cx, 0, cz, 1, .3, 1, "#94b0c2"); waters.push([cx, .26, cz, .9, .02, .9]); if (x===39 && y===40){ box(cx, 0, cz, .4, 1.4, .4, "#c2d3dc"); box(cx, 1.4, cz, .7, .15, .7, "#94b0c2"); } break;
      case "w": waters.push([cx, -.02, cz, 1, .06, 1]); break;
      case "d": box(cx, .05, cz, 1, .12, 1, "#a87048"); if (x%2) box(cx, -.3, cz-.45, .12, .45, .12, "#5e3a24"); break;
      case "z": box(cx, 0, z0(y), 1, .06, .1, "#94b0c2"); break;
      // furniture
      case "B": box(cx, 0, cz, .9, .45, .95, "#5e3a24"); box(cx, .45, cz, .86, .14, .9, "#f4f4f4"); box(cx, .5, cz+.12, .84, .13, .62, ["#b13e53","#3b5dc9","#38b764","#ef7d57"][(x*7+y)%4]); box(cx, .59, cz-.3, .5, .1, .22, "#ffffff"); break;
      case "O": box(cx, 0, cz, .85, 1.9, .55, "#8b5a3c"); box(cx, .05, cz, .02, 1.8, .57, "#5e3a24"); break;
      case "F": box(cx, 0, cz, .8, 1.8, .7, "#e8ecf0"); box(cx+.3, .9, cz+.36, .04, .5, .03, "#566c86"); break;
      case "Z": box(cx, 0, cz, .95, .8, .7, "#e8ecf0"); box(cx, .8, cz, .97, .06, .72, "#c2d3dc"); break;
      case "C": box(cx, 0, cz, 1, 1, .9, bid==="store"||bid==="post" ? "#8b9298" : bid==="diner" ? "#c2c8cc" : "#a87048"); box(cx, 1, cz, 1.02, .06, .94, bid==="diner" ? "#b13e53" : "#c8a374"); if (bid==="store" && x===21){ box(cx, 1.06, cz, .4, .3, .3, "#1a1c2c"); box(cx, 1.1, cz+.16, .3, .18, .02, "#38b764", glow); } break;
      case "e": box(cx, 0, cz, 1, 1.05, .9, "#5e3a24"); box(cx, 1.05, cz, 1.04, .07, .96, "#8b5a3c"); if (x%2) box(cx, 1.12, cz, .12, .3, .12, "#a7f070"); break;
      case "k": box(cx, 0, cz, .9, .9, .8, "#566c86"); for (const [a,b2] of [[-.2,-.18],[.2,-.18],[-.2,.18],[.2,.18]]) box(cx+a, .9, cz+b2, .22, .03, .22, "#1a1c2c"); break;
      case "K": box(cx, .7, cz, .9, .08, .9, "#c08a5a"); for (const [a,b2] of [[-.38,-.38],[.38,-.38],[-.38,.38],[.38,.38]]) box(cx+a, 0, cz+b2, .07, .7, .07, "#5e3a24"); box(cx, .78, cz, .2, .12, .2, "#f4f4f4"); break;
      case "c": box(cx, .42, cz, .45, .07, .45, "#a87048"); box(cx, .42, cz-.2, .45, .5, .06, "#8b5a3c"); for (const [a,b2] of [[-.18,-.18],[.18,-.18],[-.18,.18],[.18,.18]]) box(cx+a, 0, cz+b2, .05, .42, .05, "#5e3a24"); break;
      case "S": box(cx, 0, cz, .95, .45, .8, "#5d275d"); box(cx, .45, cz-.3, .95, .45, .2, "#7a3a7a"); break;
      case "P": box(cx, 0, cz, .35, .35, .35, "#b85c3c"); crowns.push([cx, .35, cz, .55, .6, .55, "#38b764"]); break;
      case "W": box(cx, 0, cz, .95, .78, .6, "#a87048"); box(cx, .78, cz, .98, .05, .62, "#8b5a3c"); box(cx-.2, .83, cz, .3, .02, .22, "#f4f4f4"); box(cx+.25, .83, cz-.1, .08, .25, .08, "#ffcd75"); break;
      case "H": case "I": { box(cx, 0, cz, .95, 1.9, .45, c==="I" ? "#5e3a24" : "#8b5a3c"); const cols = c==="I" ? ["#b13e53","#3b5dc9","#38b764","#ffcd75","#ef7d57","#94b0c2"] : ["#b13e53","#ffcd75","#38b764","#3b5dc9","#ef7d57","#f4f4f4"]; for (let r2=0;r2<3;r2++) for (let i=0;i<4;i++) box(x+.18+i*.21, .2+r2*.58, cz+.05, .15, .35, .32, cols[(x+i+r2*2)%6]); break; }
      case "A": box(cx, 0, cz, .8, 1.75, .7, "#5d275d"); box(cx, 1.05, cz+.3, .62, .45, .1, "#29366f", glow); box(cx, .85, cz+.36, .6, .1, .2, "#1a1c2c"); break;
      case "j": box(cx, 0, cz, .8, 1.5, .6, "#b13e53"); box(cx, .8, cz+.28, .6, .5, .06, "#ffcd75", glow); break;
      case "Q": box(cx, .7, cz, .95, .06, .95, "#257179"); box(cx, 0, cz, .2, .7, .2, "#3e2a1c"); box(cx-.2, .76, cz-.1, .15, .01, .2, "#f4f4f4"); box(cx+.2, .76, cz+.1, .15, .01, .2, "#f4f4f4"); break;
      case "%": box(cx, 1.2, z0(y)+.05, .7, .7, .08, "#1a1c2c"); box(cx, 1.25, z0(y)+.1, .55, .55, .04, "#f4ecd8"); box(cx, 1.4, z0(y)+.13, .2, .2, .03, "#b13e53"); break;
      case "=": box(cx, 0, cz, 1, .45, .45, "#8b5a3c"); box(cx, .45, cz-.18, 1, .5, .08, "#5e3a24"); break;
      case "+": box(cx, 0, cz, .95, 1, .6, "#f4f4f4"); box(cx, 1, cz, .08, .6, .08, "#ffcd75"); box(cx, 1.38, cz, .35, .08, .08, "#ffcd75"); box(cx-.3, 1, cz, .08, .3, .08, "#f4ecd8", glow); box(cx+.3, 1, cz, .08, .3, .08, "#f4ecd8", glow); break;
      case "&": box(cx, 0, cz, 1, 1.6, .6, "#3e2a1c"); for (let i=0;i<6;i++) box(x+.1+i*.16, 1.6, cz-.1, .08, .4+i%3*.25, .08, "#c8a374"); break;
      case "m": { const left = tileT(x-1,y)!=="m", top = tileT(x,y-1)!=="m"; if (left && top){ box(x+1.5, .25, y+1, 2.8, .8, 1.8, "#b13e53"); box(x+1.2, 1.05, y+1, 1.4, .6, 1.6, "#73eff7"); for (const [a,b2] of [[.6,.15],[.6,1.85],[2.4,.15],[2.4,1.85]]) box(x+a, 0, y+b2, .45, .45, .2, "#1a1c2c"); } break; }
      case "y": break;
    }
  }
  function z0(y){ return y+.5; }
  // instanced boxes
  const addInst = (list, geo, material, shadow=true) => {
    if (!list.length) return null;
    const m = new THREE.InstancedMesh(geo, material, list.length), o = new THREE.Object3D(), col = new THREE.Color();
    list.forEach((p,i)=>{ o.position.set(p[0],p[1],p[2]); o.scale.set(p[3],p[4],p[5]); o.rotation.set(0,0,0); o.updateMatrix(); m.setMatrixAt(i, o.matrix); if (p[6]){ col.set(p[6]); m.setColorAt(i, col); } });
    m.castShadow = shadow; m.receiveShadow = true; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    W.add(m); return m;
  };
  const bg = boxGeo();
  addInst(props, bg, new THREE.MeshLambertMaterial({color:0xffffff}));
  T3.glowMesh = addInst(glow, bg, new THREE.MeshBasicMaterial({color:0xffffff}), false);
  addInst(trunks, new THREE.CylinderGeometry(.5,.6,1,6).translate(0,.5,0), new THREE.MeshLambertMaterial({color:0xffffff}));
  addInst(crowns, new THREE.IcosahedronGeometry(.5, 0).translate(0,.5,0), new THREE.MeshLambertMaterial({color:0xffffff, flatShading:true}));
  addInst(pines, new THREE.ConeGeometry(.5, 1, 6).translate(0,.5,0), new THREE.MeshLambertMaterial({color:0xffffff, flatShading:true}));
  T3.water = addInst(waters, bg, new THREE.MeshLambertMaterial({color:0x41a6f6, transparent:true, opacity:.55}), false);
  // walls, windows and roofs, building by building, so the one you're in can open up
  T3.bld = new Map();
  for (const [k, list] of walls){
    const b = BUILDINGS.find(q=>q.id===k) || null;
    const wm = addInst(list.map(p=>p.concat([null])), bg, mat3(wallColor(b)));
    const trim = addInst(list.filter(p=>p[1]+p[4] >= WALL_H-.01).map(p=>[p[0], WALL_H, p[2], 1.04, .12, 1.04, null]), bg, mat3(b ? shade(b.roof, -.25) : "#3a3446"));
    const gl = glass.get(k) ? addInst(glass.get(k).map(p=>p.concat([null])), bg, new THREE.MeshLambertMaterial({color:0x73b8d8, emissive:0x000000})) : null;
    T3.bld.set(k, {b, walls:wm, trim, glass:gl, roof:null});
  }
  const prism = prismGeo();
  for (const b of BUILDINGS){
    const rec = T3.bld.get(b.id); if (!rec) continue;
    const Wd = b.x1-b.x0+1, Dp = b.y1-b.y0+1, g = new THREE.Group();
    const along = Wd >= Dp, h = Math.min(Wd, Dp) * .32;
    const roof = new THREE.Mesh(prism, mat3(b.roof, {flatShading:true, side:THREE.DoubleSide}));
    roof.scale.set((along ? Wd : Dp) + .5, h, (along ? Dp : Wd) + .5); if (!along) roof.rotation.y = Math.PI/2;
    roof.castShadow = true; roof.receiveShadow = true; g.add(roof);
    const slab = new THREE.Mesh(bg, mat3(shade(b.roof, -.3))); slab.scale.set(Wd+.5, .12, Dp+.5); slab.position.y = -.06; slab.castShadow = true; g.add(slab);
    if (b.kind==="home"){ const ch = new THREE.Mesh(bg, mat3("#8b5a3c")); ch.scale.set(.6, h+.6, .6); ch.position.set(Wd*.25, 0, -Dp*.15); ch.castShadow = true; g.add(ch); }
    if (b.id==="church"){ const st = new THREE.Mesh(bg, mat3("#e8e8e0")); st.scale.set(1.6, h+3.5, 1.6); g.add(st); const sp = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.5, 4).translate(0,1.25,0), mat3("#94b0c2", {flatShading:true})); sp.position.y = h+3.5; g.add(sp); const cr = new THREE.Mesh(bg, mat3("#ffcd75")); cr.scale.set(.15, 1.2, .15); cr.position.y = h+6; g.add(cr); const cr2 = new THREE.Mesh(bg, mat3("#ffcd75")); cr2.scale.set(.7, .15, .15); cr2.position.y = h+6.7; g.add(cr2); }
    g.position.set(b.x0 + Wd/2, WALL_H, b.y0 + Dp/2);
    W.add(g); rec.roof = g;
    if (b.sign){ const sg = signMesh(b.sign, b.roof); const [dx,dy] = b.door; const front = dy===b.y1 ? 1 : dy===b.y0 ? -1 : 0; sg.position.set(dx+.5, WALL_H-.2, front ? (front>0 ? b.y1+1.08 : b.y0-.08) : dy+.5); if (!front){ sg.rotation.y = b.door[0]===b.x0 ? -Math.PI/2 : Math.PI/2; sg.position.x = b.door[0]===b.x0 ? b.x0-.08 : b.x1+1.08; } else if (front<0) sg.rotation.y = Math.PI; W.add(sg); }
  }
  // doors that can be closed
  T3.doors = doors.map(d => { const m = new THREE.Mesh(bg, mat3("#8b5a3c")); m.scale.set(d.alongX ? .96 : .1, 2.12, d.alongX ? .1 : .96); m.position.set(d.cx, 0, d.cz); m.castShadow = true; W.add(m); const kb = new THREE.Mesh(bg, mat3("#ffcd75")); kb.scale.set(.08,.08,.08); kb.position.set(d.cx + (d.alongX ? .3 : .07), 1.0, d.cz + (d.alongX ? .07 : .3)); W.add(kb); return Object.assign(d, {mesh:m, knob:kb}); });
  // stars
  if (!T3.stars){ const pts = []; for (let i=0;i<700;i++){ const th = Math.random()*Math.PI*2, ph = Math.random()*Math.PI*.45; pts.push(Math.cos(th)*Math.cos(ph)*180, Math.sin(ph)*180+10, Math.sin(th)*Math.cos(ph)*180); } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts,3)); T3.stars = new THREE.Points(g, new THREE.PointsMaterial({color:0xffffff, size:1.2, sizeAttenuation:false, transparent:true, opacity:0, fog:false})); T3.scene.add(T3.stars); }
  if (!T3.rain){ const pts = []; for (let i=0;i<1400;i++) pts.push((Math.random()-.5)*40, Math.random()*18, (Math.random()-.5)*40); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts,3)); T3.rain = new THREE.Points(g, new THREE.PointsMaterial({color:0xa0c0ff, size:.08, transparent:true, opacity:.7})); T3.rain.visible = false; T3.scene.add(T3.rain); }
  // dynamic layers
  T3.dyn = new THREE.Group(); W.add(T3.dyn);
  T3.chars.clear(); T3.dynObj = null;
  T3.builtFor = tmap;
}
function signMesh(text, col){
  const c = document.createElement("canvas"); c.width = 256; c.height = 48; const g = c.getContext("2d");
  g.fillStyle = "#1a1c2c"; g.fillRect(0,0,256,48); g.fillStyle = col; g.fillRect(4,4,248,40); g.fillStyle = "#1a1c2c"; g.fillRect(8,8,240,32);
  g.fillStyle = "#ffcd75"; g.font = "bold 24px 'Press Start 2P', monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text.slice(0,14), 128, 25, 236);
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.encoding = THREE.sRGBEncoding;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(5, text.length*.42+.8), .7), new THREE.MeshBasicMaterial({map:t}));
  return m;
}

// ---------- people ----------
function suitCols(L){ return E.SUITS[L.suit] || E.SUITS.o || ["#ef7d57","#b85c3c","#ffa07a"]; }
function makeChar3D(L){
  const g = new THREE.Group(), [suit, suitD] = suitCols(L), pants = L.pants || suitD, big = L.big ? 1.12 : 1;
  const part = (w,h,d,col,x,y,z,parent=g) => { const m = new THREE.Mesh(boxGeoC(), mat3(col)); m.scale.set(w,h,d); m.position.set(x,y,z); m.castShadow = true; parent.add(m); return m; };
  const pivot = (x,y,z) => { const p = new THREE.Group(); p.position.set(x,y,z); g.add(p); return p; };
  const legL = pivot(-.11, .62, 0), legR = pivot(.11, .62, 0), armL = pivot(-.29*big, 1.12, 0), armR = pivot(.29*big, 1.12, 0);
  part(.17,.6,.2, pants, 0,-.3,0, legL); part(.17,.6,.2, pants, 0,-.3,0, legR);
  part(.18,.08,.26, "#1a1c2c", 0,-.6,.03, legL); part(.18,.08,.26, "#1a1c2c", 0,-.6,.03, legR);
  const torso = part(.46*big,.55,.26*big, suit, 0,.9,0);
  part(.13,.5,.15, suit, 0,-.22,0, armL); part(.13,.5,.15, suit, 0,-.22,0, armR);
  part(.11,.1,.12, L.skin, 0,-.5,0, armL); part(.11,.1,.12, L.skin, 0,-.5,0, armR);
  if (L.apron) part(.36,.4,.02, L.apron, 0,.78,.14);
  if (L.collar) part(.3,.06,.02, L.collar, 0,1.14,.14);
  if (L.tie) part(.07,.32,.02, L.tie, 0,.98,.14);
  if (L.badge) part(.07,.07,.02, "#ffcd75", .12,1.02,.14);
  if (L.suit==="o") part(.2,.12,.02, "#f4f4f4", 0,1.0,.14);
  const head = new THREE.Group(); head.position.set(0, 1.18, 0); g.add(head);
  part(.36,.36,.34, L.skin, 0,.18,0, head);
  part(.05,.06,.02, "#1a1c2c", -.08,.21,.175, head); part(.05,.06,.02, "#1a1c2c", .08,.21,.175, head);
  if (L.glasses){ part(.12,.08,.02, "#94b0c2", -.08,.21,.18, head); part(.12,.08,.02, "#94b0c2", .08,.21,.18, head); }
  if (L.shades) part(.3,.08,.02, "#1a1c2c", 0,.21,.18, head);
  if (L.beard) part(.3,.12,.04, L.beard, 0,.05,.17, head);
  if (L.mustache) part(.18,.04,.03, L.mustache, 0,.11,.18, head);
  const H = L.hair || "#3f2616", st = L.style;
  if (st==="hat"){ part(.5,.04,.5, L.hatColor||"#3e2a1c", 0,.37,0, head); part(.36,.16,.36, L.hatColor||"#3e2a1c", 0,.45,0, head); part(.37,.03,.37, "#1a1c2c", 0,.4,0, head); }
  else if (st==="cap"){ part(.38,.12,.38, "#1d2654", 0,.38,0, head); part(.3,.03,.16, "#1d2654", 0,.33,.24, head); part(.08,.06,.02, "#ffcd75", 0,.4,.19, head); }
  else if (st==="beanie"){ part(.39,.18,.38, L.hatColor||"#b13e53", 0,.38,0, head); }
  else if (st==="bald"){ part(.37,.1,.2, H, 0,.2,-.1, head); }
  else if (st==="afro"){ part(.5,.3,.48, H, 0,.4,-.02, head); }
  else if (st==="mohawk"){ part(.08,.18,.38, H, 0,.42,0, head); }
  else if (st==="buzz"){ part(.37,.04,.35, H, 0,.37,0, head); }
  else {
    part(.38,.1,.36, H, 0,.39,0, head); part(.38,.3,.06, H, 0,.24,-.17, head);
    if (st==="long"){ part(.4,.5,.1, H, 0,.05,-.18, head); part(.06,.3,.3, H, -.19,.18,0, head); part(.06,.3,.3, H, .19,.18,0, head); }
    if (st==="bob"){ part(.07,.26,.34, H, -.19,.22,0, head); part(.07,.26,.34, H, .19,.22,0, head); }
    if (st==="ponytail" || L.bun){ part(.12,.25,.1, H, 0,.15,-.25, head); }
    if (st==="curly"){ part(.42,.14,.4, H, 0,.42,0, head); }
    if (st==="slick" || st==="neat"){ part(.38,.04,.1, shade(H,.15), 0,.44,.12, head); }
  }
  const tag = new THREE.Object3D(); tag.position.y = 1.85; g.add(tag);
  return {g, legL, legR, armL, armR, head, torso, tag, key:JSON.stringify(L)};
}
let _boxC = null; function boxGeoC(){ return _boxC || (_boxC = new THREE.BoxGeometry(1,1,1)); }
function charFor(id, L){
  let c = T3.chars.get(id);
  const key = JSON.stringify(L);
  if (c && c.key !== key){ T3.dyn.remove(c.g); c = null; }
  if (!c){ c = makeChar3D(L); c.key = key; c.yaw = 0; T3.chars.set(id, c); T3.dyn.add(c.g); }
  c.used = true; return c;
}
function poseChar(c, e, dt, opt={}){
  const [x, y] = rposT(e), moving = e.prog < 1;
  c.g.visible = !opt.hide;
  c.g.position.set(x+.5, opt.y||0, y+.5);
  const dir = e.dir || [0,1], target = Math.atan2(dir[0], dir[1]);
  let d = target - c.yaw; while (d > Math.PI) d -= Math.PI*2; while (d < -Math.PI) d += Math.PI*2;
  c.yaw += d * Math.min(1, dt*12); c.g.rotation.set(0, c.yaw, 0);
  const ph = (e.walkT||0) * Math.PI, sw = moving ? Math.sin(ph)*.7 : 0;
  c.legL.rotation.x = sw; c.legR.rotation.x = -sw; c.armL.rotation.x = -sw*.8; c.armR.rotation.x = sw*.8;
  c.g.position.y += moving ? Math.abs(Math.sin(ph))*.05 : 0;
  c.head.rotation.x = opt.talk ? Math.sin(performance.now()/90)*.08 : 0;
  if (opt.fight){ c.armR.rotation.x = -1.4 + Math.sin(performance.now()/80)*.5; }
  if (opt.lie){ c.g.rotation.set(-Math.PI/2, c.yaw, 0, "YXZ"); c.g.position.y = opt.y || .12; c.legL.rotation.x = c.legR.rotation.x = c.armL.rotation.x = c.armR.rotation.x = 0; }
  if (opt.hit) c.torso.material = mat3("#ffffff"); else if (c.torsoMat) c.torso.material = c.torsoMat;
  if (!c.torsoMat) c.torsoMat = c.torso.material;
}

// ---------- overlays: names, speech, emotes, numbers ----------
const _v3 = new THREE.Vector3();
function ovAt(key, cls, wx, wy, wz, html, maxDist=22){
  _v3.set(wx, wy, wz);
  const dcam = _v3.distanceTo(T3.camera.position);
  _v3.project(T3.camera);
  let el = T3.ovEls.get(key);
  if (_v3.z > 1 || dcam > maxDist){ if (el) el.style.display = "none"; if (el) el.used = true; return; }
  if (!el){ el = document.createElement("div"); el.className = cls; T3.ov.append(el); T3.ovEls.set(key, el); el.html = null; }
  if (el.html !== html){ el.innerHTML = html; el.html = html; }
  el.used = true; el.style.display = "";
  const sx = (_v3.x*.5+.5)*innerWidth, sy = (-_v3.y*.5+.5)*innerHeight;
  el.style.transform = `translate(${Math.round(sx)}px, ${Math.round(sy)}px) translate(-50%, -100%)`;
  el.style.opacity = dcam > maxDist*.7 ? .6 : 1;
}
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
function bubbleHtml(text){ return esc(text).replace(/\*([^*]*)\*?/g, "<em>$1</em>"); }

// ---------- camera ----------
function wireCamera3D(){
  const cvs = E.cv; let drag = null;
  cvs.addEventListener("pointerdown", e => { if (!TOWN.active) return; drag = {x:e.clientX, y:e.clientY, id:e.pointerId}; try { cvs.setPointerCapture(e.pointerId); } catch {} });
  cvs.addEventListener("pointermove", e => { if (!drag || drag.id!==e.pointerId) return; const dx = e.clientX-drag.x, dy = e.clientY-drag.y; drag.x = e.clientX; drag.y = e.clientY; const sn = T3.sens || 1, iy = T3.invY ? -1 : 1; T3.cam.yaw -= dx*.006*sn; if (T3.cam.fp) T3.cam.fpPitch = clamp(T3.cam.fpPitch - dy*.004*sn*iy, -1.1, .9); else T3.cam.pitch = clamp(T3.cam.pitch + dy*.004*sn*iy, .25, 1.45); });
  const end = () => { drag = null; }; cvs.addEventListener("pointerup", end); cvs.addEventListener("pointercancel", end);
  cvs.addEventListener("wheel", e => { if (!TOWN.active || T3.cam.fp) return; e.preventDefault(); T3.cam.dist = clamp(T3.cam.dist * (e.deltaY > 0 ? 1.1 : .9), 3.5, 22); }, {passive:false});
  document.addEventListener("keydown", e => {
    if (!TOWN.active || !T || T.ending || CUT || GAME || anyTWindow() || T.talkId) return;
    if (e.target && e.target.tagName==="INPUT") return;
    const k = e.key.toLowerCase();
    if (k==="v"){ T3.cam.fp = !T3.cam.fp; T3.cam.fpPitch = 0; if (T3.cam.fp){ const d = T.player.dir; T3.cam.yaw = Math.atan2(-d[0], -d[1]); } toast(T3.cam.fp ? "First person. Drag to look around. V to switch back." : "Third person.", "", 2); }
    if (k==="[" ) T3.cam.yaw += Math.PI/4; if (k==="]") T3.cam.yaw -= Math.PI/4;
  });
}
// Keys move you relative to where the camera looks, snapped to the grid.
mapDir = d => {
  if (!T3.ready) return d;
  const yaw = T3.cam.yaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const wx = fx*(-d[1]) + rx*d[0], wz = fz*(-d[1]) + rz*d[0];
  return Math.abs(wx) >= Math.abs(wz) ? [Math.sign(wx), 0] : [0, Math.sign(wz)];
};
function updateCamera3D(dt){
  const cam = T3.camera, c = T3.cam, pl = T.player, [px, py] = rposT(pl);
  const inside = insideOf(pl);
  const tx = px+.5, tz = py+.5;
  if (!c.init){ c.x = tx; c.z = tz; c.init = true; }
  c.x += (tx - c.x) * Math.min(1, dt*10); c.z += (tz - c.z) * Math.min(1, dt*10);
  const sh = T.shake > 0 ? T.shake*.25 : 0, jx = (Math.random()-.5)*sh, jy = (Math.random()-.5)*sh;
  if (c.fp){
    cam.position.set(c.x + jx, 1.55 + jy, c.z);
    const look = new THREE.Vector3(c.x - Math.sin(c.yaw)*Math.cos(c.fpPitch), 1.55 + Math.sin(c.fpPitch), c.z - Math.cos(c.yaw)*Math.cos(c.fpPitch));
    cam.lookAt(look);
  } else {
    const pitch = Math.max(inside ? Math.max(c.pitch, 1.0) : c.pitch, T3.minPitch || 0), dist = inside ? Math.min(c.dist, 9) : Math.min(c.dist, T3.maxDist || 99);
    const want = new THREE.Vector3(c.x + Math.sin(c.yaw)*Math.cos(pitch)*dist, 1 + Math.sin(pitch)*dist, c.z + Math.cos(c.yaw)*Math.cos(pitch)*dist);
    cam.position.lerp(want, Math.min(1, dt*8)); cam.position.x += jx; cam.position.y += jy;
    cam.lookAt(c.x, 1, c.z);
  }
}

// ---------- the frame ----------
function sky3D(){
  const t = T ? T.t : 720, dk = darknessT(t);
  const dawn = t > 330 && t < 450, dusk = t > 1110 && t < 1290;
  const day = new THREE.Color(T && T.weather==="rain" ? "#8a9aa8" : "#8fc8ff"), night = new THREE.Color("#0b1026"), warm = new THREE.Color("#ef7d57");
  const col = day.clone().lerp(night, Math.min(1, dk/.78));
  if (dawn || dusk) col.lerp(warm, .35 * (1 - Math.abs(((dawn ? (t-390)/60 : (t-1200)/90)))));
  return {col, dk};
}
function renderTown(dt){
  init3D();
  if (!T3.world || T3.builtFor !== tmap || tmapDirty) buildWorld3D();
  const pl = T.player, now = performance.now(), inside = insideOf(pl), outer = inside ? outerOf(inside) : null;
  updateCamera3D(dt);
  // sky and light
  const {col, dk} = sky3D(), night = dk > .25;
  T3.scene.background = col; T3.scene.fog.color.copy(col); T3.scene.fog.near = night ? 14 : 30; T3.scene.fog.far = night ? 45 : 90;
  const t = T.t, sunUp = Math.max(0, Math.sin(Math.PI * (t-330) / 900));
  const ang = (t/1440)*Math.PI*2 - Math.PI/2;
  T3.sun.position.set(T3.cam.x + Math.cos(ang)*40, 10 + sunUp*50, T3.cam.z + 18);
  T3.sun.target.position.set(T3.cam.x, 0, T3.cam.z);
  T3.sun.intensity = night ? .18 : .25 + sunUp*.85 * (T.weather==="rain" ? .55 : 1);
  T3.sun.color.set(night ? "#8fa8ff" : sunUp < .35 ? "#ffc890" : "#fff1d6");
  T3.hemi.intensity = night ? .22 : .45 + sunUp*.25;
  T3.hemi.color.set(night ? "#5060a0" : "#cfe8ff");
  T3.stars.material.opacity = Math.max(0, (dk-.3)*1.6); T3.stars.position.set(T3.cam.x, 0, T3.cam.z);
  // nearest lamps light up at night
  if (!T3.lampAt || now > T3.lampAt){
    T3.lampAt = now + 400;
    const lights = night ? T3.lampPos.map(p=>({p, d:Math.hypot(p[0]-T3.cam.x, p[2]-T3.cam.z)})) : [];
    if (night) for (const [k, r] of T3.bld){ if (!r.b || !r.glass) continue; const awake = folk.some(n=>alive(n) && !n.asleep && insideOf(n) && outerOf(insideOf(n))===r.b.id); r.lit = awake || outer===r.b.id; if (r.lit){ const cx = (r.b.x0+r.b.x1)/2+.5, cz = (r.b.y0+r.b.y1)/2+.5; lights.push({p:[cx, 1.8, cz], d:Math.hypot(cx-T3.cam.x, cz-T3.cam.z)+3, win:true}); } } else for (const [k, r] of T3.bld) r.lit = false;
    lights.sort((a,b)=>a.d-b.d);
    T3.lamps.forEach((l,i)=>{ const L = lights[i]; if (L){ l.position.set(L.p[0], L.p[1], L.p[2]); l.intensity = L.win ? .9 : 1.4; l.distance = L.win ? 7 : 9; } else l.intensity = 0; });
    for (const [k, r] of T3.bld) if (r.glass){ r.glass.material.emissive.set(r.lit && night ? "#ffb04a" : "#000000"); r.glass.material.color.set(r.lit && night ? "#ffd27a" : night ? "#1d2a44" : "#73b8d8"); }
    for (const d of T3.doors){ const locked = doorLockedT(d.x, d.y, T.player), occ = (pl.x===d.x && pl.y===d.y) || folk.some(n=>alive(n) && n.x===d.x && n.y===d.y); const open = !locked || occ; d.mesh.visible = !open; d.knob.visible = !open; }
  }
  T3.glowMesh && (T3.glowMesh.material.color.set(night ? "#ffffff" : "#d8d8c8"));
  const [ppx, ppy] = rposT(pl);
  T3.pLight.position.set(ppx+.5, 1.6, ppy+.5); T3.pLight.intensity = night ? .7 : 0;
  const hasLight = (pl.inv.includes("flashlight") || pl.inv.includes("lantern")) && (night || (T3.darkInside && inside));
  T3.flash.intensity = hasLight ? 2.2 : 0;
  if (hasLight){ T3.flash.position.set(ppx+.5, 1.4, ppy+.5); T3.flash.target.position.set(ppx+.5+pl.dir[0]*6, 0, ppy+.5+pl.dir[1]*6); }
  T3.room.intensity = outer && night ? 1.1 : 0;
  if (outer){ const b = bById(outer); if (b) T3.room.position.set((b.x0+b.x1)/2+.5, 2.2, (b.y0+b.y1)/2+.5); }
  // the building you're in opens up: roof off, walls cut down
  for (const [k, r] of T3.bld){
    const open = r.b && r.b.id===outer;
    if (r.roof) r.roof.visible = !open;
    const s = open && !T3.cam.fp ? .32 : 1;
    if (r.walls) r.walls.scale.y = s; if (r.trim) r.trim.visible = !open || T3.cam.fp; if (r.glass) r.glass.visible = !open || T3.cam.fp;
  }
  // weather
  const raining = T.weather==="rain" && !inside;
  T3.rain.visible = raining;
  if (raining){ T3.rain.position.set(T3.cam.x, 0, T3.cam.z); const a = T3.rain.geometry.attributes.position; for (let i=0;i<a.count;i++){ let y = a.getY(i) - dt*14; if (y < 0) y += 18; a.setY(i, y); } a.needsUpdate = true; }
  if (T3.water) T3.water.material.opacity = .45 + Math.sin(now/700)*.08;
  // people
  for (const c of T3.chars.values()) c.used = false;
  for (const n of folk){
    if (n.dead || n.away) continue;
    { const [qx, qy] = rposT(n); if (Math.hypot(qx + .5 - T3.cam.x, qy + .5 - T3.cam.z) > (T3.cullDist || 1e9)) continue; }
    const L = n.look, c = charFor(n.id, L);
    const inBed = n.asleep && tileT(n.x,n.y)==="B";
    poseChar(c, n, dt, {hide:n.hidden, lie:inBed || n.asleep, y:inBed ? .58 : .1, talk:(T.talkId===n.id && !TD.done) || (n.bubble && n.scene), fight:!!n.fight, hit:n.hitT && now - n.hitT < 130});
  }
  const pc = charFor("player", playerLookT());
  poseChar(pc, pl, dt, {hide:T3.cam.fp, fight:!!pl.fight});
  // bodies
  for (const b of T.bodies){
    if (b.hidden || b.carried) continue;
    const n = byIdT(b.id); if (!n) continue;
    const c = charFor("body:"+b.id, n.look); c.g.visible = true; c.g.position.set(b.x+.5, .12, b.y+.5); c.g.rotation.set(-Math.PI/2, (b.x*7+b.y)%6, 0, "YXZ"); c.legL.rotation.x = .2; c.armR.rotation.x = -.6;
  }
  if (pl.carrying){ const b = T.bodies.find(x=>x.id===pl.carrying), n = b && byIdT(b.id); if (n){ const c = charFor("carry", n.look); c.g.visible = !T3.cam.fp; const ux = Math.cos(pc.yaw), uz = -Math.sin(pc.yaw); c.g.position.set(ppx+.5 + ux*.75, 1.45, ppy+.5 + uz*.75); c.g.rotation.set(0, pc.yaw, Math.PI/2, "YXZ"); c.legL.rotation.x = c.legR.rotation.x = .3; c.armL.rotation.x = c.armR.rotation.x = .9; } }
  for (const [id, c] of T3.chars) if (!c.used){ c.g.visible = false; }
  if (T.mode==="slasher" && T.spyE && !T.spyE.hidden && !T.spyE.dead){ const c = charFor("spy", T.spyE.look); poseChar(c, T.spyE, dt, {}); }
  // ground details: stains, graves, train, effects
  dynLayer3D(dt, now);
  // overlays
  for (const el of T3.ovEls.values()) el.used = false;
  for (const n of folk){
    if (n.dead || n.away || n.hidden) continue;
    const inB = insideOf(n); if (inB && outerOf(inB)!==outer) continue;
    const [nx, ny] = rposT(n), near = Math.hypot(nx-ppx, ny-ppy), top = n.asleep ? .9 : 1.95;
    if (n.bubble){ if (now > n.bubble.until) n.bubble = null; else if (near < 14) ovAt("b:"+n.id, "ov-bubble"+(n.scene?" scene":""), nx+.5, top+.15, ny+.5, bubbleHtml(n.bubble.text), 26); }
    if (!n.bubble && near < 5.5) ovAt("l:"+n.id, "ov-name"+(n.sheriff?" sheriff":n.partner?" partner":""), nx+.5, top, ny+.5, esc(T3.nameOf ? T3.nameOf(n, near) : n.met ? n.first : n.job) + (T.tasks.some(t=>t.giver===n.id && t.status==="ready") ? " ✓" : ""), 12);
    if (n.emote){ if (now > n.emote.until) n.emote = null; else ovAt("e:"+n.id, "ov-emote", nx+.5, top+.55, ny+.5, esc(n.emote.ch==="#" ? "✶" : n.emote.ch), 26); }
    if (n.asleep && near < 10) ovAt("z:"+n.id, "ov-z", nx+.5, 1.1, ny+.5, "z<small>z</small>", 14);
  }
  if (T.mode==="slasher" && T.spyE && !T.spyE.hidden){ const [sx, sy] = rposT(T.spyE); ovAt("l:spy", "ov-name spy", sx+.5, 1.95, sy+.5, esc(T.spyE.short), 10); }
  T.fx.forEach((f,i)=>{ if (f.kind==="float") ovAt("f:"+i+":"+f.text, "ov-float", f.x/TS, 2.2 + (1.1-f.life)*.8, f.y/TS+.5, `<span style="color:${f.col}">${esc(f.text)}</span>`, 30); });
  for (const [k, el] of T3.ovEls) if (!el.used){ el.remove(); T3.ovEls.delete(k); }
  // what E does
  const pr = $("ovPrompt");
  if (!T.talkId && !anyTWindow() && !T.cutscene){
    const tg = interactTargetT();
    if (tg){ let label = tg.label; if (tg.hold && holdT && holdT.key===tg.key) label = label.replace(/^Hold: /,"") + ` ${Math.round(holdT.prog*100)}%`; pr.hidden = false; pr.innerHTML = `<b>${document.body.classList.contains("touch") ? "A" : "E"}</b>${esc(label)}`; }
    else pr.hidden = true;
  } else pr.hidden = true;
  // fades and flashes
  const fd = $("ovFade");
  if (tFade){
    tFade.t += dt; const f = tFade, half = f.secs/2, a = f.t < half ? f.t/half : Math.max(0, 1-(f.t-half)/half);
    if (!f.fired && f.t >= half){ f.fired = true; try { f.mid && f.mid(); } catch (e){ console.error(e); } }
    fd.hidden = false; fd.style.opacity = a; fd.textContent = f.text || "";
    if (f.t >= f.secs) tFade = null;
  } else fd.hidden = true;
  const wo = T.fx.find(f=>f.kind==="whiteout"); $("ovWhite").style.opacity = wo ? Math.min(1, wo.life*2) : 0;
  const vg = $("ovVignette"); vg.className = T.mode==="slasher" ? "slasher" : pl.carrying ? "carry" : (T.lock && (T.lock.kind==="chase" || T.lock.kind==="brawl")) ? "chase" : "";
  if (T.shake > 0) T.shake = Math.max(0, T.shake - dt);
  if (T3.pre) T3.pre(dt, now, false);
  T3.renderer.render(T3.scene, T3.camera);
}
function dynLayer3D(dt, now){
  const D = T3.dyn, keep = new Set();
  const get = (key, make) => { let o = T3.dynObj && T3.dynObj.get(key); if (!o){ o = make(); D.add(o); (T3.dynObj || (T3.dynObj = new Map())).set(key, o); } keep.add(key); return o; };
  const bg = boxGeoC();
  for (const s of T.stains){ if (s.cleaned) continue; const o = get(`st:${s.x},${s.y}`, () => { const m = T3.stainMake ? T3.stainMake(s) : new THREE.Mesh(new THREE.CircleGeometry(.38, 7), new THREE.MeshLambertMaterial({color:0x6e0e1c, transparent:true, opacity:.85})); m.rotation.x = -Math.PI/2; return m; }); o.position.set(s.x+.5, .015, s.y+.5); }
  for (const g of T.graves){ const o = get(`gr:${g.x},${g.y}:${g.open}`, () => { const m = new THREE.Mesh(bg, mat3(g.open ? "#1a1210" : "#6e4e30")); m.scale.set(.85, g.open ? .02 : .3, .9); m.castShadow = true; return m; }); o.position.set(g.x+.5, g.open ? .01 : 0, g.y+.5); }
  const dep = trainHere();
  if (dep !== undefined){
    const o = get("train", T3.trainMake || (() => { const gp = new THREE.Group(); for (let car=0;car<4;car++){ const m = new THREE.Mesh(bg, mat3(car===0 ? "#b13e53" : "#29366f")); m.scale.set(4, 1.8, 1.6); m.position.set(car*4.3, .2, 0); m.castShadow = true; gp.add(m); for (let w=0;w<3;w++){ const win = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({color:0xffd27a})); win.scale.set(.7,.5,1.62); win.position.set(car*4.3-1.2+w*1.2, 1.1, 0); gp.add(win); } } const st = new THREE.Mesh(bg, mat3("#566c86")); st.scale.set(.6,.9,.6); st.position.set(-1.2, 2, 0); gp.add(st); return gp; }));
    const p = (T.t - (dep-12)) / 15, xx = p < .4 ? TW + 20 - (p/.4)*(TW+20-84) : p < .8 ? 84 : 84 - (p-.8)/.2*120;
    o.position.set(xx, 0, 16);
  }
  T.fx.forEach((f,i) => {
    if (f.kind==="tracer"){ const o = get("tr:"+i+":"+f.x, () => { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(f.x/TS, 1.3, f.y/TS), new THREE.Vector3(f.x2/TS, 1.2, f.y2/TS)]); return new THREE.Line(g, new THREE.LineBasicMaterial({color:0xfff0a0, transparent:true})); }); o.material.opacity = Math.min(1, f.life*7); }
    if (f.kind==="flash"){ T3.burst.position.set(f.x/TS, 1.5, f.y/TS+.5); T3.burst.intensity = 4 * Math.min(1, f.life*6); }
    if (f.kind==="sparks"){ for (let k=0;k<4;k++){ const o = get(`sp:${i}:${k}:${f.x}`, () => { const m = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({color:0xffcd75})); m.scale.set(.06,.06,.06); return m; }); const a = k*1.7, r = (1-f.life/.4)*.6; o.position.set(f.x/TS + Math.cos(a)*r, 1.1 + Math.sin(a*2)*r*.5, f.y/TS + .5 + Math.sin(a)*r); } }
    if (f.kind==="splash"){ const o = get("spl:"+i+":"+f.x, () => { const m = new THREE.Mesh(new THREE.RingGeometry(.3,.45,16), new THREE.MeshBasicMaterial({color:0xc8f0ff, transparent:true, side:THREE.DoubleSide})); m.rotation.x = -Math.PI/2; return m; }); o.position.set(f.x/TS, .05, f.y/TS); o.scale.setScalar(1 + (1-f.life)*4); o.material.opacity = f.life; }
    if (f.kind==="smoke"){ for (let k=0;k<4;k++){ const o = get(`sm:${i}:${k}:${f.x}`, () => new THREE.Mesh(bg, new THREE.MeshLambertMaterial({color:0x9a9aa8, transparent:true}))); o.scale.setScalar(.3+(4-f.life)*.1); o.position.set(f.x/TS + Math.sin(f.life*3+k)*.3, .8 + (4-f.life)*.6 + k*.3, f.y/TS + .5); o.material.opacity = Math.min(.6, f.life*.15); } }
  });
  if (!T.fx.some(f=>f.kind==="flash")) T3.burst.intensity = 0;
  if (T3.dynObj) for (const [k, o] of T3.dynObj) if (!keep.has(k)){ D.remove(o); if (o.geometry && o.geometry!==bg) o.geometry.dispose(); T3.dynObj.delete(k); }
  // the 2D renderer ages these effects; here they age too
  for (let i=T.fx.length-1;i>=0;i--){ const f = T.fx[i]; f.life -= dt; if (f.life <= 0) T.fx.splice(i,1); }
}
// Title screen backdrop: a slow flight over the empty town.
function renderAttract3D(dt){
  init3D();
  if (!T3.world || T3.builtFor !== tmap){ if (!tmap.length) buildTown(); buildWorld3D(); }
  const t = performance.now()/1000;
  T3.scene.background = C3("#e8a070"); T3.scene.fog.color.set("#e8a070"); T3.scene.fog.near = 30; T3.scene.fog.far = 110;
  T3.sun.position.set(20, 30, 60); T3.sun.target.position.set(52, 0, 40); T3.sun.intensity = .9; T3.sun.color.set("#ffc890"); T3.hemi.intensity = .55;
  T3.stars.material.opacity = 0; T3.rain.visible = false; for (const l of T3.lamps) l.intensity = 0;
  for (const [k, r] of T3.bld){ if (r.roof) r.roof.visible = true; if (r.walls) r.walls.scale.y = 1; }
  T3.camera.position.set(52 + Math.cos(t*.05)*38, 26, 42 + Math.sin(t*.05)*30); T3.camera.lookAt(52, 0, 42);
  for (const c of T3.chars.values()) c.g.visible = false;
  for (const [k, el] of T3.ovEls){ el.remove(); T3.ovEls.delete(k); }
  if (T3.pre) T3.pre(dt, performance.now(), true);
  T3.renderer.render(T3.scene, T3.camera);
}
