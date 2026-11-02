// Hallowmere effects and scares: fire and embers, chimney smoke, ground mist, graveyard wisps, falling leaves,
// bats and crows, lightning, blood, and the things that happen at night: the Watcher at the edge of the fog,
// whispers, the midnight bell, three knocks at the hour of the wolf.
const HWFX = {sys:{}, ready:false, fires:null};
const HWO = {jump:true, grain:true};
try { HWO.jump = localStorage.getItem("hw-jump")!=="0"; HWO.grain = localStorage.getItem("hw-grain")!=="0"; } catch {}
const PVS = `
attribute float size; attribute float alpha; attribute vec3 tint; attribute float seed;
uniform float uScale; uniform float uTime; uniform float uFlick;
varying float vA; varying vec3 vC; varying float vF;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float fl = 1.0 + uFlick * (sin(uTime*11.0 + seed*17.0)*.09 + sin(uTime*23.0 + seed*5.0)*.06);
  gl_PointSize = min(900.0, size * fl * uScale / max(.1, -mv.z));
  gl_Position = projectionMatrix * mv;
  vA = alpha; vC = tint; vF = floor(mod(uTime*9.0 + seed*4.0, 4.0));
}`;
const PFS = `
uniform sampler2D map; uniform float uFrames; uniform float uNear; uniform float uFar; uniform float uFog;
varying float vA; varying vec3 vC; varying float vF;
void main(){
  vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
  if (uFrames > 1.0){ if (uv.x < .25 || uv.x > .75) discard; uv.x = (vF + (uv.x - .25) * 2.0) / uFrames; }
  vec4 c = texture2D(map, uv);
  float depth = gl_FragCoord.z / gl_FragCoord.w;
  float f = uFog > .5 ? 1.0 - smoothstep(uNear, uFar, depth) : 1.0 - smoothstep(uFar*1.6, uFar*2.4, depth);
  gl_FragColor = vec4(c.rgb * vC, c.a * vA * f);
  if (gl_FragColor.a < .01) discard;
}`;
function pSys(n, tex, opt={}){
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n*3), size = new Float32Array(n), alpha = new Float32Array(n), tint = new Float32Array(n*3).fill(1), seed = new Float32Array(n);
  for (let i=0;i<n;i++) seed[i] = Math.random();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("size", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("alpha", new THREE.BufferAttribute(alpha, 1)); geo.setAttribute("tint", new THREE.BufferAttribute(tint, 3)); geo.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({uniforms:{map:{value:tex}, uScale:{value:500}, uTime:{value:0}, uFlick:{value:opt.flick||0}, uFrames:{value:opt.frames||1}, uNear:{value:10}, uFar:{value:40}, uFog:{value:opt.fog?1:0}},
    vertexShader:PVS, fragmentShader:PFS, transparent:true, depthWrite:false, blending:opt.add ? THREE.AdditiveBlending : THREE.NormalBlending});
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = opt.order || 2;
  const S = {pts, pos, size, alpha, tint, seed, n, geo, mat, life:new Float32Array(n), vel:new Float32Array(n*3),
    dirty(){ geo.attributes.position.needsUpdate = true; geo.attributes.size.needsUpdate = true; geo.attributes.alpha.needsUpdate = true; geo.attributes.tint.needsUpdate = true; }};
  return S;
}
function texLeaf(){ return hOnce("leaf", () => { const [c, g] = hCanvas(8, 8); g.fillStyle = "#fff"; g.fillRect(2,1,4,6); g.fillRect(1,2,6,4); g.fillRect(3,0,1,8); return hTex(c); }); }
function texDot(){ return hOnce("dot", () => { const [c, g] = hCanvas(4, 4); g.fillStyle = "#fff"; g.fillRect(1,0,2,4); g.fillRect(0,1,4,2); return hTex(c); }); }

HWFX.onBuild = (W) => {
  // fires belong to the world (rebuilt with it)
  const F = T3.hw.fires, n = F.length;
  const fire = pSys(Math.max(1, n), texFlame(), {add:true, frames:4, flick:1, order:3});
  const glow = pSys(Math.max(1, n), texGlow("#ff8a30"), {add:true, flick:.6, order:2});
  F.forEach((f, i) => { fire.pos.set([f.x, f.y + f.s*.3, f.z], i*3); glow.pos.set([f.x, f.y + f.s*.2, f.z], i*3); fire.size[i] = f.s*1.25; glow.size[i] = f.s*(f.kind==="candle" ? 3 : 4.2); glow.tint.set(f.kind==="candle" ? [1, .8, .55] : [1, .7, .45], i*3); });
  fire.dirty(); glow.dirty(); W.add(glow.pts, fire.pts);
  HWFX.fire = fire; HWFX.glow = glow; HWFX.fireAt = 0;
  if (HWFX.ready) return;
  HWFX.ready = true;
  const S = HWFX.sys, sc = T3.scene;
  S.ember = pSys(160, texDot(), {add:true, order:4});
  S.smoke = pSys(150, texGlow("#ffffff"), {fog:true, order:1});
  S.mist = pSys(40, texMist(), {fog:true, order:1});
  S.wisp = pSys(12, texGlow("#a0ffd0"), {add:true, flick:.8, order:4});
  S.leaf = pSys(80, texLeaf(), {fog:true, order:2});
  S.blood = pSys(90, texDot(), {fog:true, order:4});
  for (const k in S) sc.add(S[k].pts);
  for (let i=0;i<S.mist.n;i++){ S.mist.life[i] = -1; }
  // bats
  HWFX.bats = [];
  for (let i=0;i<9;i++){
    const g = new THREE.Group(), body = new THREE.Mesh(hGeo().box, mat3("#0c0a0c")); body.scale.set(.1, .08, .2); g.add(body);
    const wings = [];
    for (const s of [-1, 1]){ const pv = new THREE.Group(); const w = new THREE.Mesh(new THREE.PlaneGeometry(.34, .2).translate(s*.17, 0, 0), new THREE.MeshBasicMaterial({color:0x0a080a, side:THREE.DoubleSide})); w.rotation.x = -Math.PI/2; pv.add(w); g.add(pv); wings.push([pv, s]); }
    g.visible = false; sc.add(g); HWFX.bats.push({g, wings, a:Math.random()*6, r:5 + Math.random()*9, h:6 + Math.random()*6, sp:.6 + Math.random()*.6, ph:Math.random()*6});
  }
  // crows
  HWFX.crows = [];
  const crowGeo = mergeParts([{w:.13,h:.13,d:.26,col:"#0e0c10",x:0,y:.1,z:0}, {w:.1,h:.1,d:.1,col:"#121016",x:0,y:.2,z:.13}, {w:.03,h:.03,d:.1,col:"#2a2a2a",x:0,y:.19,z:.22}, {w:.1,h:.03,d:.14,col:"#0a080c",x:0,y:.1,z:-.18,rx:-.3}, {w:.02,h:.08,d:.02,col:"#2a2a2a",x:-.03,y:.02,z:0}, {w:.02,h:.08,d:.02,col:"#2a2a2a",x:.03,y:.02,z:0}]);
  for (let i=0;i<12;i++){
    const g = new THREE.Group(), m = new THREE.Mesh(crowGeo, vcMat()); g.add(m);
    const wings = []; for (const s of [-1, 1]){ const pv = new THREE.Group(); pv.position.set(s*.06, .14, 0); const w = new THREE.Mesh(hGeo().box, mat3("#0a080c")); w.scale.set(.28, .02, .16); w.position.x = s*.14; pv.add(w); g.add(pv); wings.push([pv, s]); }
    g.visible = false; sc.add(g); HWFX.crows.push({g, wings, state:"off", t:0, perch:null, vx:0, vy:0, vz:0});
  }
  // the Watcher
  const wp = [
    {w:.34,h:1.5,d:.2,col:"#0a0a0c",x:0,y:1.55,z:0}, {w:.24,h:1.0,d:.16,col:"#08080a",x:-.1,y:.5,z:0}, {w:.24,h:1.0,d:.16,col:"#08080a",x:.1,y:.5,z:0},
    {w:.1,h:1.45,d:.1,col:"#0a0a0c",x:-.28,y:1.48,z:.02,rz:-.06}, {w:.1,h:1.45,d:.1,col:"#0a0a0c",x:.28,y:1.48,z:.02,rz:.06},
    {w:.06,h:.26,d:.04,col:"#b8b0a0",x:-.31,y:.68,z:.03}, {w:.06,h:.26,d:.04,col:"#b8b0a0",x:.31,y:.68,z:.03},
    {w:.1,h:.14,d:.1,col:"#0a0a0c",x:0,y:2.36,z:.02}, {w:.26,h:.34,d:.24,col:"#c8c0b0",x:0,y:2.58,z:.06,rx:.2},
    {w:.07,h:.08,d:.02,col:"#000000",x:-.06,y:2.62,z:.19}, {w:.07,h:.08,d:.02,col:"#000000",x:.06,y:2.62,z:.19}, {w:.12,h:.03,d:.02,col:"#000000",x:0,y:2.48,z:.18},
    {w:.5,h:.6,d:.3,col:"#060608",x:0,y:2.1,z:-.04}
  ];
  HWFX.watcher = new THREE.Mesh(mergeParts(wp), new THREE.MeshBasicMaterial({vertexColors:true, fog:false, transparent:true, opacity:.92}));
  HWFX.watcher.visible = false; sc.add(HWFX.watcher);
  // overlays: grain and the face
  const gr = document.createElement("canvas"); gr.id = "hwGrain"; gr.width = 160; gr.height = 100; HWFX.grain = gr; HWFX.grainG = gr.getContext("2d");
  const vg = document.createElement("div"); vg.id = "hwVignette";
  $("ovVignette").after(vg, gr);
  const sf = document.createElement("canvas"); sf.id = "hwScare"; sf.width = 128; sf.height = 96; sf.hidden = true; document.getElementById("game").append(sf); HWFX.scare = sf;
  HWS.wNext = performance.now() + 50000 + Math.random()*40000; HWS.wCount = 0;
  HWS.amb = {howl:performance.now() + 30000, crow:performance.now() + 15000, whisper:performance.now() + 60000};
};

// ---------- per frame ----------
const _fv = new THREE.Vector3();
HWFX.update = (dt, now, attract, sky) => {
  if (!HWFX.ready || !HWFX.fire) return;
  const t = now/1000, S = HWFX.sys, fog = T3.scene.fog, cam = T3.camera.position, dk = sky.dk;
  const scale = T3.renderer.domElement.height / (2*Math.tan(T3.camera.fov*Math.PI/360));
  for (const s of [HWFX.fire, HWFX.glow, ...Object.values(S)]){ const u = s.mat.uniforms; u.uScale.value = scale; u.uTime.value = t; u.uNear.value = fog.near; u.uFar.value = fog.far; }
  const inside = !attract && T && insideOf(T.player);
  const rain = !attract && T && T.weather==="rain";
  const P = attract ? new THREE.Vector3(46, 0, 40) : (() => { const [px, py] = rposT(T.player); return new THREE.Vector3(px+.5, 0, py+.5); })();
  // fires: which are lit
  if (now > HWFX.fireAt){
    HWFX.fireAt = now + 400;
    const F = T3.hw.fires, A = HWFX.fire.alpha, G = HWFX.glow.alpha;
    F.forEach((f, i) => {
      const on = f.when==="always" ? true : f.when==="dusk" ? (dk > .06 || rain) : f.when==="bonfire" ? (dk > .1 || sky.hallows) : dk > .2;
      const near = Math.hypot(f.x - cam.x, f.z - cam.z) < (f.kind==="candle" ? 26 : 60);
      A[i] = on && near ? 1 : 0; G[i] = on && near ? (f.kind==="bonfire" ? .55 : f.kind==="candle" ? .35 : .42) : 0;
    });
    HWFX.fire.geo.attributes.alpha.needsUpdate = true; HWFX.glow.geo.attributes.alpha.needsUpdate = true;
  }
  HWFX.glow.mat.uniforms.uFlick.value = .6 * HWS.gutter;
  // embers rise from the nearest fires
  {
    const E2 = S.ember, F = T3.hw.fires, lit = [];
    for (let i=0;i<F.length;i++) if (HWFX.fire.alpha[i] > 0 && (F[i].kind==="torch" || F[i].kind==="bonfire") && Math.abs(F[i].x - P.x) < 18 && Math.abs(F[i].z - P.z) < 18) lit.push(F[i]);
    for (let i=0;i<E2.n;i++){
      if (E2.life[i] <= 0){
        if (!lit.length || Math.random() < .6){ E2.alpha[i] = 0; continue; }
        const f = Math.random() < .5 && T3.hw.bonfirePos && lit.find(q=>q.kind==="bonfire") || lit[(Math.random()*lit.length)|0];
        E2.pos.set([f.x + (Math.random()-.5)*f.s*.3, f.y + f.s*.4, f.z + (Math.random()-.5)*f.s*.3], i*3);
        E2.vel.set([(Math.random()-.5)*.3, .5 + Math.random()*(f.kind==="bonfire" ? 1.6 : .7), (Math.random()-.5)*.3], i*3);
        E2.life[i] = 1 + Math.random()*(f.kind==="bonfire" ? 2.5 : 1.2); E2.size[i] = .05 + Math.random()*.05; E2.tint.set([1, .5 + Math.random()*.3, .15], i*3);
      }
      E2.life[i] -= dt;
      E2.pos[i*3] += (E2.vel[i*3] + Math.sin(t*3 + i)*.25) * dt; E2.pos[i*3+1] += E2.vel[i*3+1] * dt; E2.pos[i*3+2] += (E2.vel[i*3+2] + Math.cos(t*2.6 + i)*.25) * dt;
      E2.alpha[i] = Math.max(0, Math.min(1, E2.life[i])) * (Math.sin(t*20 + i) > -.6 ? 1 : .3);
    }
    E2.dirty();
  }
  // chimney smoke
  {
    const Sm = S.smoke, srcs = T3.hw.smokes.filter(s=>Math.hypot(s.x - P.x, s.z - P.z) < 40);
    for (let i=0;i<Sm.n;i++){
      if (Sm.life[i] <= 0){
        if (!srcs.length || Math.random() < .97){ Sm.alpha[i] = 0; if (Sm.life[i] > -9) Sm.life[i] = -1; continue; }
        const s = srcs[(Math.random()*srcs.length)|0];
        Sm.pos.set([s.x, s.y, s.z], i*3); Sm.vel.set([.25 + Math.random()*.2, .45 + Math.random()*.3, (Math.random()-.5)*.15], i*3);
        Sm.life[i] = 5 + Math.random()*3; Sm.seed[i] = s.heavy ? 1 : 0;
      }
      Sm.life[i] -= dt; const age = 1 - Sm.life[i]/7;
      for (let k=0;k<3;k++) Sm.pos[i*3+k] += Sm.vel[i*3+k]*dt;
      Sm.size[i] = .5 + age*2.4; Sm.alpha[i] = Math.max(0, Math.min(.38, Sm.life[i]*.12)) * (Sm.seed[i] > .5 ? 1.4 : 1);
      const c = dk > .3 ? .16 : .42; Sm.tint.set([c, c*.97, c*.95], i*3);
    }
    Sm.dirty();
  }
  // ground mist drifting around you
  {
    const M = S.mist, a = inside ? 0 : (dk > .3 ? .2 : rain ? .12 : .09) * (sky.hallows ? 1.4 : 1);
    for (let i=0;i<M.n;i++){
      let x = M.pos[i*3], z = M.pos[i*3+2];
      if (M.life[i] < 0 || Math.abs(x - P.x) > 20 || Math.abs(z - P.z) > 20){ x = P.x + (Math.random()-.5)*38; z = P.z + (Math.random()-.5)*38; M.life[i] = 1; M.size[i] = 5 + Math.random()*5; M.pos[i*3+1] = .25 + Math.random()*.7; }
      x += (.35 + Math.sin(i)*.15) * dt; z += Math.cos(t*.1 + i) * .1 * dt;
      M.pos[i*3] = x; M.pos[i*3+2] = z; M.alpha[i] = a * (.6 + .4*Math.sin(t*.3 + i*1.7));
      M.tint.set(HWS.blood > .5 && dk > .3 ? [.9, .6, .6] : [.75, .8, .82], i*3);
    }
    M.dirty();
  }
  // wisps in the graveyard after dark
  {
    const Wp = S.wisp, cem = T3.hw.cem, on = dk > .45 && !inside;
    for (let i=0;i<Wp.n;i++){
      if (!on){ Wp.alpha[i] = 0; continue; }
      if (Wp.life[i] <= 0){ Wp.pos.set([cem[0] + 1 + Math.random()*(cem[2]-cem[0]-2), .6 + Math.random()*.8, cem[1] + 1 + Math.random()*(cem[3]-cem[1]-2)], i*3); Wp.life[i] = 6 + Math.random()*8; Wp.size[i] = .5 + Math.random()*.4; }
      Wp.life[i] -= dt;
      const dx = P.x - Wp.pos[i*3], dz = P.z - Wp.pos[i*3+2], d = Math.hypot(dx, dz);
      if (d < 2.5) Wp.life[i] = Math.min(Wp.life[i], .4);
      const drawn = d < 9 ? .25 : 0;
      Wp.pos[i*3] += (Math.sin(t*.7 + i*3)*.3 + dx/d*drawn) * dt; Wp.pos[i*3+1] = .7 + Math.sin(t*1.3 + i)*.25; Wp.pos[i*3+2] += (Math.cos(t*.6 + i*2)*.3 + dz/d*drawn) * dt;
      Wp.alpha[i] = Math.max(0, Math.min(1, Wp.life[i]*.6, (6 + 8 - Wp.life[i])*.5)) * .8;
      Wp.tint.set(HWS.blood > .5 ? [1, .4, .3] : [.6, 1, .85], i*3);
    }
    Wp.dirty();
  }
  // leaves
  {
    const Lf = S.leaf, on = !inside, LC = [[.36,.16,.06],[.42,.22,.08],[.28,.12,.05],[.46,.28,.1],[.3,.22,.08]];
    for (let i=0;i<Lf.n;i++){
      if (!on){ Lf.alpha[i] = 0; continue; }
      if (Lf.life[i] <= 0 || Lf.pos[i*3+1] < .02){ Lf.pos.set([P.x + (Math.random()-.5)*28, 3 + Math.random()*6, P.z + (Math.random()-.5)*28], i*3); Lf.life[i] = 20; Lf.size[i] = .16 + Math.random()*.1; Lf.tint.set(LC[i%5], i*3); }
      Lf.life[i] -= dt;
      Lf.pos[i*3] += (.6 + Math.sin(t*1.7 + i)*.5) * dt; Lf.pos[i*3+1] -= (.35 + Math.sin(t*3 + i)*.2) * dt; Lf.pos[i*3+2] += Math.cos(t*1.3 + i*2)*.4*dt;
      Lf.alpha[i] = dk > .4 ? .5 : .95;
    }
    Lf.dirty();
  }
  // blood: when someone is hit, it shows
  if (!attract && T){
    const B = S.blood;
    for (const n of folk){
      if (n.hitT && n.hitT !== n._hwHit){ n._hwHit = n.hitT; const [nx, ny] = rposT(n); let k = 0; for (let i=0;i<B.n && k<14;i++) if (B.life[i] <= 0){ B.pos.set([nx+.5, 1.1 + Math.random()*.4, ny+.5], i*3); B.vel.set([(Math.random()-.5)*2.4, 1 + Math.random()*1.6, (Math.random()-.5)*2.4], i*3); B.life[i] = 1.6; B.size[i] = .05 + Math.random()*.06; B.tint.set([.45 + Math.random()*.2, .02, .03], i*3); k++; } }
    }
    for (let i=0;i<B.n;i++){
      if (B.life[i] <= 0){ B.alpha[i] = 0; continue; }
      B.life[i] -= dt;
      if (B.pos[i*3+1] > .02){ B.vel[i*3+1] -= 9 * dt; for (let k=0;k<3;k++) B.pos[i*3+k] += B.vel[i*3+k]*dt; } else B.pos[i*3+1] = .02;
      B.alpha[i] = Math.min(1, B.life[i]);
    }
    B.dirty();
  }
  // bats
  const batsOn = dk > .4 && !inside;
  const centre = T3.hw.belfry && Math.hypot(T3.hw.belfry[0] - P.x, T3.hw.belfry[2] - P.z) < 30 ? T3.hw.belfry : [P.x, 6, P.z];
  for (const b of HWFX.bats){
    b.g.visible = batsOn; if (!batsOn) continue;
    b.a += dt * b.sp; const x = centre[0] + Math.cos(b.a)*b.r + Math.sin(b.a*2.3 + b.ph)*1.5, z = centre[2] + Math.sin(b.a)*b.r*.8 + Math.cos(b.a*1.7)*1.2, y = (centre[1] > 6 ? centre[1] : 0) + b.h*.5 + Math.sin(b.a*3 + b.ph)*1.2;
    b.g.position.set(x, y, z); b.g.rotation.y = -b.a - Math.PI/2*Math.sign(b.sp);
    const f = Math.sin(t*28 + b.ph) * .9; for (const [pv, s] of b.wings) pv.rotation.z = s*f;
  }
  // crows: they perch where you are not, and leave when you come close
  if (!attract && T){
    if (!HWFX.crowAt || now > HWFX.crowAt){
      HWFX.crowAt = now + 600;
      const want = inside ? 0 : dk > .4 ? 3 : 9, active = HWFX.crows.filter(c=>c.state==="perch").length;
      if (active < want){
        const taken = new Set(HWFX.crows.filter(c=>c.perch).map(c=>c.perch));
        const free = T3.hw.perches.filter(pp => !taken.has(pp) && Math.hypot(pp[0]-P.x, pp[2]-P.z) > 5 && Math.hypot(pp[0]-P.x, pp[2]-P.z) < 24);
        const c = HWFX.crows.find(q=>q.state==="off");
        if (c && free.length){ const pp = free[(Math.random()*free.length)|0]; c.perch = pp; c.state = "perch"; c.g.position.set(pp[0], pp[1], pp[2]); c.g.rotation.y = Math.random()*6; c.g.visible = true; for (const [pv] of c.wings) pv.rotation.z = 0; }
      }
    }
    for (const c of HWFX.crows){
      if (c.state==="perch"){
        const d = Math.hypot(c.g.position.x - P.x, c.g.position.z - P.z);
        c.g.rotation.y += Math.sin(t*1.3 + c.g.position.x) * dt * .6;
        if (d < 3.4 || d > 30){ if (d > 30){ c.state = "off"; c.g.visible = false; c.perch = null; continue; } c.state = "fly"; c.t = 0; const ax = c.g.position.x - P.x, az = c.g.position.z - P.z, l = Math.hypot(ax, az) || 1; c.vx = ax/l*4; c.vz = az/l*4; c.vy = 2.5; c.g.rotation.y = Math.atan2(c.vx, c.vz); if (!HWFX.cawAt || now > HWFX.cawAt){ HWFX.cawAt = now + 3500; HSFX.crow(); } }
      } else if (c.state==="fly"){
        c.t += dt; c.g.position.x += c.vx*dt; c.g.position.y += c.vy*dt; c.g.position.z += c.vz*dt; c.vy = Math.max(.6, c.vy - dt);
        const f = Math.sin(t*30 + c.g.position.x) * .9; for (const [pv, s] of c.wings) pv.rotation.z = s*f;
        if (c.t > 6){ c.state = "off"; c.g.visible = false; c.perch = null; }
      }
    }
  }
  // the noose sways, the cage creaks, scarecrows look at you when you look away
  if (T3.hw.noose){ T3.hw.noose.rotation.z = Math.sin(t*.9)*.05; T3.hw.noose.rotation.x = Math.sin(t*.7 + 1)*.04; }
  if (T3.hw.cage){ T3.hw.cage.rotation.z = Math.sin(t*.6)*.06; T3.hw.cage.rotation.y = Math.sin(t*.25)*.3; }
  if (!attract && T){
    const fwd = new THREE.Vector3(); T3.camera.getWorldDirection(fwd);
    for (const s of T3.hw.scarecrows){
      _fv.set(s.x - cam.x, 1.8 - cam.y, s.z - cam.z); const d = _fv.length(); _fv.normalize();
      const seen = fwd.dot(_fv) > .55 && d < 30;
      if (!seen && d < 22){ const want = Math.atan2(P.x - s.x, P.z - s.z) - s.g.rotation.y; let dd = want - s.yaw; while (dd > Math.PI) dd -= Math.PI*2; while (dd < -Math.PI) dd += Math.PI*2; s.yaw += dd * Math.min(1, dt*2); s.head.rotation.y = s.yaw; s.head.rotation.z = Math.sin(t*.5)*.08 + .12; }
    }
  }
  // lightning in the rain
  if (!attract && rain && !inside){
    if (!HWS.boltAt) HWS.boltAt = now + 6000 + Math.random()*14000;
    if (now > HWS.boltAt){ HWS.boltAt = now + 7000 + Math.random()*18000; HWS.bolt = now; setTimeout(() => HSFX.thunder(), 400 + Math.random()*1800); }
  }
  if (HWS.bolt && now - HWS.bolt < 500){
    const k = now - HWS.bolt, f = (k < 70 || (k > 150 && k < 230)) ? 1 : 0;
    T3.hemi.intensity += f * 2.2; T3.hemi.color.set(f ? "#c8d8ff" : T3.hemi.color); $("ovWhite").style.opacity = f * .35;
  }
  // grain
  if (HWFX.grain){
    HWFX.grain.hidden = !HWO.grain;
    if (HWO.grain && (!HWFX.grainAt || now > HWFX.grainAt)){
      HWFX.grainAt = now + 70;
      const g = HWFX.grainG, img = g.createImageData(160, 100), d = img.data;
      for (let i=0;i<d.length;i+=4){ const v = Math.random()*255; d[i] = d[i+1] = d[i+2] = v; d[i+3] = 26 + Math.random()*20; }
      g.putImageData(img, 0, 0);
    }
  }
  document.body.classList.toggle("hw-night", dk > .4);
  if (!attract && T) hwScares(dt, now, sky, P, inside);
  else { HWFX.watcher.visible = false; HWS.gutter = 1; }
};

// ---------- scares ----------
function hwCanScare(){ return T && !T.ending && !CUT && !GAME && !T.talkId && !T.cutscene && !anyTWindow() && T.mode!=="slasher" && !(T.lock && (T.lock.kind==="chase" || T.lock.kind==="brawl")); }
function hwScares(dt, now, sky, P, inside){
  const W = HWFX.watcher, dk = sky.dk, h = hourNow();
  // the bell and the knocking
  if (HWS.hour !== h){
    if (HWS.hour !== undefined){
      if (h === 0) HSFX.toll(4);
      if (h === 3){
        HSFX.toll(1);
        if (HWS.knockDay !== T.day && inside && (inside==="roomC" || (bById(outerOf(inside)) || {}).kind==="home")){
          HWS.knockDay = T.day;
          setTimeout(() => { if (!T || T.ending) return; HSFX.knock(); toast("Three knocks at the door. Nobody is there.", "", 4); }, 4500);
          setTimeout(() => { if (!T || T.ending) return; HSFX.knock(); }, 11000);
        }
      }
    }
    HWS.hour = h;
  }
  // ambience
  const A = HWS.amb, inCem = P.x >= 80 && P.x <= 101 && P.z >= 34 && P.z <= 51;
  if (now > A.howl){ A.howl = now + 45000 + Math.random()*70000; if (dk > .4 && !inside) HSFX.howl(); }
  if (now > A.crow){ A.crow = now + 20000 + Math.random()*30000; if (dk < .3 && !inside) HSFX.crow(); }
  if (now > A.whisper){ A.whisper = now + (inCem ? 15000 : 55000) + Math.random()*40000; if (dk > .4 || inCem) HSFX.whisper(); }
  hwWind(inside, dk, sky);
  // the Watcher
  const yaw = T3.cam.yaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const can = hwCanScare() && (dk > .5 || HWS.forestDeep) && !inside;
  if (!HWS.w && can && now > HWS.wNext){
    const behind = HWO.jump && T.day >= 2 && HWS.jumpDay !== T.day && HWS.wCount >= 1 && (Math.random() < .35 || window.__hw.forceBehind);
    if (behind){
      HWS.w = {kind:"behind", t:now, yaw0:yaw}; HWS.jumpDay = T.day; HSFX.heartbeat(); setTimeout(()=>HSFX.heartbeat(), 900); setTimeout(()=>HSFX.whisper(), 1600);
    } else {
      const d = Math.max(12.5, 21 - HWS.wCount*1.6);
      for (let k=0;k<8;k++){
        const a = (Math.random()-.5)*1.1, wx = P.x + (fx*Math.cos(a) - fz*Math.sin(a))*d, wz = P.z + (fz*Math.cos(a) + fx*Math.sin(a))*d;
        const tx = Math.floor(wx), tz = Math.floor(wz);
        if (tx < 1 || tz < 1 || tx >= TW-1 || tz >= TH-1 || bldgOf(tx, tz)) continue;
        HWS.w = {kind:"far", t:now, x:wx, z:wz}; W.position.set(wx, 0, wz); W.visible = true; HWS.wCount++;
        if (Math.random() < .6) setTimeout(()=>HSFX.whisper(), 600);
        break;
      }
    }
    HWS.wNext = now + (sky.hallows ? 45000 : 80000) + Math.random()*90000;
  }
  const w = HWS.w;
  if (w && w.kind==="far"){
    W.rotation.y = Math.atan2(P.x - w.x, P.z - w.z);
    W.position.y = Math.sin(now/700)*.02;
    const d = Math.hypot(P.x - w.x, P.z - w.z), age = now - w.t;
    _fv.set(w.x - T3.camera.position.x, 1.5 - T3.camera.position.y, w.z - T3.camera.position.z).normalize();
    const fwd = new THREE.Vector3(); T3.camera.getWorldDirection(fwd); const looking = fwd.dot(_fv) > .75;
    if (d < 10.5 || !can || age > 16000 || (age > 7000 && !looking)){ W.visible = false; HWS.w = null; if (d < 10.5 && can) { HWS.gutter = .2; sfx("door"); } }
  }
  if (w && w.kind==="behind"){
    let dy = yaw - w.yaw0; while (dy > Math.PI) dy -= Math.PI*2; while (dy < -Math.PI) dy += Math.PI*2;
    const fpTurn = T3.cam.fp && Math.abs(dy) > 2.2, tpTurn = !T3.cam.fp && Math.abs(dy) > 2.4;
    if (!can){ HWS.w = null; }
    else if (fpTurn || tpTurn){
      // it was right behind you
      const c = T3.camera.position, f2 = new THREE.Vector3(); T3.camera.getWorldDirection(f2);
      W.position.set(c.x + f2.x*1.6, Math.max(0, c.y - 2.45), c.z + f2.z*1.6); W.rotation.y = Math.atan2(-f2.x, -f2.z); W.visible = true;
      HWS.w = {kind:"jump", t:now}; hwJumpscare();
    } else if (now - w.t > 11000){ HWS.w = null; }
  }
  if (w && w.kind==="jump" && now - w.t > 700){ W.visible = false; HWS.w = null; }
  const want = W.visible ? .45 : 1; HWS.gutter += (want - HWS.gutter) * Math.min(1, dt*3);
}
function hwJumpscare(kind){
  const c = HWFX.scare, g = c.getContext("2d");
  if (HWS.lastJump && performance.now() - HWS.lastJump < 4000) return;
  HWS.lastJump = performance.now();
  c.hidden = false; c.style.opacity = 1; T.shake = 1;
  try { HSFX.scream(1.2); } catch {}
  try { if (hqInit()){ const t0 = HQ.ac.currentTime, out = HQ.out; HQ.out = HQ.comp; for (const m of ["C3","C#3","G3","Ab3"]) INST.stab(t0, NOTE(m), 1, 1.6); INST.kick(t0, 0, 1, 1.2); HQ.out = out; noiseHit(t0, "highpass", 1500, .6, 1.2, .25); } } catch {}
  const start = performance.now();
  const step = () => { const k = performance.now() - start; (kind==="ghost" && typeof drawGhostFace==="function" ? drawGhostFace : drawScareFace)(g, 128, 96, k/1000); c.style.opacity = k < 650 ? 1 : Math.max(0, 1 - (k-650)/300); if (k < 960) requestAnimationFrame(step); else c.hidden = true; };
  step();
}
// wind: a filtered noise bed that rises outdoors at night
function hwWind(inside, dk, sky){
  if (!Snd.ac || !hqInit() || !Snd.nodes.noiseBuf) return;
  if (!HWS.wind){
    const ac = HQ.ac, s = ac.createBufferSource(); s.buffer = Snd.nodes.noiseBuf; s.loop = true;
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 420; bp.Q.value = .7;
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = .07; lg.gain.value = 260; lfo.connect(lg); lg.connect(bp.frequency); lfo.start();
    const g = ac.createGain(); g.gain.value = 0; s.connect(bp); bp.connect(g); g.connect(HQ.comp); s.start();
    HWS.wind = {g, s};
  }
  const target = Snd.musicOn === false || Snd.muted ? 0 : inside ? .006 : (dk > .4 ? .05 : .022) * (sky.hallows ? 1.3 : 1);
  HWS.wind.g.gain.setTargetAtTime(target, HQ.ac.currentTime, 1.2);
}
window.__hw = {HWS, HWFX, HWO, forceBehind:false};
