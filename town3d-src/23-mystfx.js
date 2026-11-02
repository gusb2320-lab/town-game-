// Hallowmere mysteries, seen and heard: the girl in Ashcombe House, the beast's tracks, and the Blackwood at night.
const MYFX = {ready:false};
function texPaw(){
  return hOnce("paw", () => {
    const [c, g] = hCanvas(32, 32);
    g.fillStyle = "rgba(70,8,8,.85)";
    g.beginPath(); g.ellipse(16, 20, 6, 5, 0, 0, Math.PI*2); g.fill();
    for (const [x, y] of [[8,11],[13,8],[19,8],[24,11]]){ g.beginPath(); g.ellipse(x, y, 2.4, 3, 0, 0, Math.PI*2); g.fill(); g.fillRect(x-.5, y-6, 1, 3); }
    return hTex(c);
  });
}
function drawGhostFace(g, w, h, t){
  g.imageSmoothingEnabled = false;
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
  const z = 1 + Math.min(1, t*2.2)*.55, s = Math.min(w, h)/64*z, cx = w/2 + Math.sin(t*61)*1.5, cy = h/2 + 6*z + Math.cos(t*47)*1.2;
  const E = (x, y, rx, ry, col, rot=0) => { g.fillStyle = col; g.beginPath(); g.ellipse(cx + x*s, cy + y*s, rx*s, ry*s, rot, 0, Math.PI*2); g.fill(); };
  // hair hanging down both sides
  g.fillStyle = "#050404"; g.fillRect(cx - 34*s, cy - 40*s, 68*s, 80*s);
  // the face: long, grey-blue, wet
  E(0, -2, 20, 30, "#9aa4b4"); E(0, -6, 18, 25, "#b8c0cc"); E(-6, -14, 6, 9, "rgba(255,255,255,.18)");
  // cracks
  g.strokeStyle = "rgba(40,40,60,.8)"; g.lineWidth = Math.max(1, s*.6); g.beginPath(); g.moveTo(cx + 8*s, cy - 30*s); g.lineTo(cx + 4*s, cy - 18*s); g.lineTo(cx + 9*s, cy - 10*s); g.lineTo(cx + 5*s, cy); g.stroke();
  g.beginPath(); g.moveTo(cx - 14*s, cy - 22*s); g.lineTo(cx - 10*s, cy - 14*s); g.stroke();
  // eyes: holes that go back forever, leaking
  for (const sx of [-1, 1]){ E(sx*8, -10, 6, 8, "#000"); E(sx*8, -10, 2.2, 2.6, "#d8e0ff"); E(sx*8 + .4, -10, .9, 1.1, "#000"); g.fillStyle = "#000"; g.fillRect(cx + (sx*8 - 1.2)*s, cy - 3*s, 2.4*s, (10 + t*20)*s); }
  // the mouth: stretched open far too long
  E(0, 16, 7 + Math.sin(t*30)*.6, 15 + t*4, "#000");
  g.fillStyle = "#d8d0bc"; for (const [x, y] of [[-4,4],[-1,3],[2,4],[5,5],[-5,28],[0,30],[4,28]]) g.fillRect(cx + x*s, cy + y*s, 1.6*s, 3*s);
  g.fillStyle = "rgba(90,0,0,.85)"; g.fillRect(cx - 2*s, cy + 30*s, 4*s, 14*s);
  // strands across the face
  g.strokeStyle = "#050404"; g.lineWidth = Math.max(1, s*.9);
  for (const x0 of [-17, -12, 13, 18]){ g.beginPath(); g.moveTo(cx + x0*s, cy - 34*s); g.quadraticCurveTo(cx + x0*.6*s, cy, cx + x0*.9*s, cy + 34*s); g.stroke(); }
  // a red flash at the very start
  if (t < .08){ g.fillStyle = "rgba(160,0,0,.5)"; g.fillRect(0, 0, w, h); }
}
function texGetOut(){
  return hOnce("getout", () => {
    const [c, g] = hCanvas(128, 48); g.imageSmoothingEnabled = true;
    g.font = "bold 34px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = "rgba(110,6,6,.9)"; g.fillText("GET OUT", 64, 24);
    for (let i=0;i<10;i++){ const x = 12 + Math.random()*104; g.fillRect(x, 30, 2, 6 + Math.random()*12); }
    return hTex(c, false, true);
  });
}
MYFX.init = () => {
  if (MYFX.ready) return; MYFX.ready = true;
  const sc = T3.scene;
  // the girl: a child in a nightdress, black hair to her waist
  const gp = [
    {w:.34,h:.9,d:.24,col:"#e4e6ee",x:0,y:.62,z:0}, {w:.44,h:.4,d:.3,col:"#d8dae4",x:0,y:.26,z:0}, {w:.1,h:.5,d:.1,col:"#e4e6ee",x:-.21,y:.82,z:.02,rz:.08}, {w:.1,h:.5,d:.1,col:"#e4e6ee",x:.21,y:.82,z:.02,rz:-.08},
    {w:.07,h:.08,d:.08,col:"#c8ccd8",x:-.23,y:.55,z:.03}, {w:.07,h:.08,d:.08,col:"#c8ccd8",x:.23,y:.55,z:.03},
    {w:.26,h:.28,d:.24,col:"#d0d4e0",x:0,y:1.22,z:0}, {w:.3,h:.62,d:.08,col:"#0a0808",x:0,y:1.02,z:-.14}, {w:.3,h:.1,d:.28,col:"#0a0808",x:0,y:1.38,z:0},
    {w:.07,h:.36,d:.26,col:"#0a0808",x:-.14,y:1.12,z:0}, {w:.07,h:.36,d:.26,col:"#0a0808",x:.14,y:1.12,z:0},
    {w:.06,h:.06,d:.02,col:"#000000",x:-.06,y:1.25,z:.125}, {w:.06,h:.06,d:.02,col:"#000000",x:.06,y:1.25,z:.125}, {w:.06,h:.04,d:.02,col:"#1a0000",x:0,y:1.15,z:.125}
  ];
  MYFX.ghost = new THREE.Mesh(mergeParts(gp), new THREE.MeshBasicMaterial({vertexColors:true, transparent:true, opacity:.6, depthWrite:false}));
  MYFX.ghost.visible = false; MYFX.ghost.renderOrder = 5; sc.add(MYFX.ghost);
  MYFX.ghostGlow = new THREE.Sprite(new THREE.SpriteMaterial({map:texGlow("#a0b8ff"), transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, opacity:.35})); MYFX.ghostGlow.scale.set(1.6, 2, 1); MYFX.ghostGlow.position.y = .8; MYFX.ghost.add(MYFX.ghostGlow);
  // paw prints
  MYFX.paws = new THREE.InstancedMesh(new THREE.PlaneGeometry(.38, .38).rotateX(-Math.PI/2), new THREE.MeshLambertMaterial({map:texPaw(), transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-3}), 520);
  MYFX.paws.count = 0; MYFX.paws.frustumCulled = false; sc.add(MYFX.paws);
  // eyes between the trees
  MYFX.eyes = [];
  for (let i=0;i<6;i++){
    const grp = new THREE.Group();
    for (const s of [-1,1]){ const e = new THREE.Sprite(new THREE.SpriteMaterial({map:texGlow(i%3===0 ? "#ffd040" : "#ff3020"), transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, fog:false})); e.scale.set(.16, .16, 1); e.position.x = s*.11; grp.add(e); }
    grp.visible = false; sc.add(grp); MYFX.eyes.push({g:grp, until:0, next:0});
  }
  // the writing on the floor
  MYFX.getOut = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .6).rotateX(-Math.PI/2), new THREE.MeshBasicMaterial({map:texGetOut(), transparent:true, depthWrite:false}));
  MYFX.getOut.visible = false; sc.add(MYFX.getOut);
  MYFX.g = {next:performance.now() + 4000, until:0, mode:null};
  // the ritual: sigil, fire on the stones, a vortex, a red light, and the thing that comes up out of the altar
  const [ax, ay] = XP.altar, AX = ax + .5, AZ = ay + .5;
  const R = MYFX.rit = {grp:new THREE.Group(), AX, AZ};
  R.sigil = new THREE.Mesh(new THREE.PlaneGeometry(10, 10).rotateX(-Math.PI/2), new THREE.MeshBasicMaterial({map:texSigil(), transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, opacity:0}));
  R.sigil.position.set(AX, .05, AZ); R.grp.add(R.sigil);
  R.light = new THREE.PointLight(0xff2010, 0, 18, 1.6); R.light.position.set(AX, 2.5, AZ); R.grp.add(R.light);
  R.stones = []; for (let k=0;k<9;k++){ const a = k/9*Math.PI*2; R.stones.push([Math.round(ax + Math.cos(a)*5) + .5, Math.round(ay + Math.sin(a)*5) + .5]); }
  R.fire = pSys(9, texFlame(), {add:true, frames:4, flick:1.4, order:3}); R.stones.forEach(([x, z], i) => { R.fire.pos.set([x, 2.6, z], i*3); R.fire.size[i] = 0; R.fire.tint.set([1, .45, .3], i*3); }); R.fire.dirty(); R.grp.add(R.fire.pts);
  R.vortex = pSys(160, texGlow("#ffffff"), {order:3}); for (let i=0;i<160;i++){ R.vortex.life[i] = Math.random(); R.vortex.tint.set([.5, .05, .04], i*3); } R.grp.add(R.vortex.pts);
  R.devil = hwMakeDevil(); R.devil.g.position.set(AX, -8, AZ); R.devil.g.visible = false; R.grp.add(R.devil.g);
  sc.add(R.grp); R.grp.visible = false;
  MYFX.snd = {next:performance.now() + 6000};
};
const _mv = new THREE.Vector3(), _mo = new THREE.Object3D();
MYFX.update = (dt, now, attract, sky) => {
  if (!T3.hw) return;
  MYFX.init();
  const t = now/1000;
  if (T3.hw.millWheel) T3.hw.millWheel.rotation.x += dt*.7;
  if (T3.hw.dolls) T3.hw.dolls.forEach((g, i) => { g.rotation.y = Math.sin(t*.4 + i*1.7)*1.2 + (T && T.myst && !T.myst.haunt.solved && Math.random() < .002 ? Math.PI : 0); g.rotation.z = Math.sin(t*.9 + i)*.05; });
  { const r = T3.bld && T3.bld.get("ashcombe"); if (r && r.glass && T && T.myst && !T.myst.haunt.solved) r.glass.material.emissive.setRGB(0, 0, 0); }
  if (T3.hw.hangGroups) T3.hw.hangGroups.forEach((g, i) => { g.rotation.z = Math.sin(t*.8 + i*2)*.06; g.rotation.y = Math.sin(t*.3 + i)*.4; });
  if (attract || !T){ MYFX.ghost.visible = false; for (const e of MYFX.eyes) e.g.visible = false; return; }
  const pl = T.player, [px, py] = rposT(pl), P = {x:px+.5, z:py+.5}, inside = insideOf(pl), m = T.myst;
  const cam = T3.camera.position, fwd = new THREE.Vector3(); T3.camera.getWorldDirection(fwd);
  const looking = (x, z, y=1) => { _mv.set(x - cam.x, y - cam.y, z - cam.z).normalize(); return fwd.dot(_mv); };
  // ---------- the Blackwood ----------
  const forest = !inside && py >= 86, deep = forest && py >= 100;
  HWS.forest = forest; HWS.forestDeep = deep;
  T3.minPitch = forest ? .9 : 0; T3.maxDist = forest ? 9 : 99;
  // any roof between the camera and you gets out of the way
  if (!T3.cam.fp && !attract) for (const [k, r] of T3.bld){
    const b = r.b; if (!b || !r.roof || !r.roof.visible || (k==="ashcombe" && inside==="ashcombe")) continue;
    for (let i=1;i<9;i++){ const f = i/9, sx = cam.x + (P.x - cam.x)*f, sy = cam.y + (1.2 - cam.y)*f, sz = cam.z + (P.z - cam.z)*f;
      if (sx > b.x0 - .4 && sx < b.x1 + 1.4 && sz > b.y0 - .4 && sz < b.y1 + 1.4 && sy < (r.topY || 6) && sy > WALL_H - .2){ r.roof.visible = false; break; } }
  }
  // a roof the camera has sunk into gets out of the way
  for (const [k, r] of T3.bld){ const b = r.b; if (!b || !r.roof || !r.roof.visible || (k==="ashcombe" && inside==="ashcombe")) continue; if (cam.x > b.x0 - .8 && cam.x < b.x1 + 1.8 && cam.z > b.y0 - .8 && cam.z < b.y1 + 1.8 && cam.y < (r.topY || WALL_H + Math.min(b.x1-b.x0, b.y1-b.y0)*.55 + 1)) r.roof.visible = false; }
  if (forest){
    const f = T3.scene.fog, night = sky.dk > .3;
    f.near = Math.min(f.near, night ? 2.5 : 5); f.far = Math.min(f.far, night ? 17 : deep ? 26 : 34);
    T3.hemi.intensity *= night ? .55 : .7; T3.sun.intensity *= .6;
    if (HWS.wNext && HWS.wNext - now > 45000) HWS.wNext = now + 20000 + Math.random()*25000;
  }
  // eyes in the dark
  for (const e of MYFX.eyes){
    if (!(forest && sky.dk > .3)){ e.g.visible = false; continue; }
    if (e.g.visible){
      const d = Math.hypot(e.x - P.x, e.z - P.z);
      if (now > e.until || d < 6){ e.g.visible = false; e.next = now + 2000 + Math.random()*7000; if (d < 6 && Math.random() < .5) HSFX.whisper(); }
      else { const blink = Math.sin(t*2.3 + e.x) > .96; e.g.scale.y = blink ? .1 : 1; e.g.lookAt(cam.x, e.y, cam.z); }
    } else if (now > e.next){
      for (let k=0;k<6;k++){
        const a = Math.random()*Math.PI*2, d = 9 + Math.random()*8, x = Math.floor(P.x + Math.cos(a)*d), z = Math.floor(P.z + Math.sin(a)*d);
        if (!"tT".includes(tileT(x, z))) continue;
        e.x = x + .5; e.z = z + .5; e.y = .9 + Math.random()*1.1; e.g.position.set(e.x, e.y, e.z); e.g.visible = true; e.until = now + 3000 + Math.random()*6000;
        if (Math.random() < .4){ try { if (hqInit()) noiseHit(HQ.ac.currentTime, "highpass", 2400, .9, .07, .25); } catch {} }
        break;
      }
      e.next = now + 1500;
    }
  }
  // forest sounds: snapping twigs, something big moving, very far away a scream
  if (forest && now > MYFX.snd.next){
    MYFX.snd.next = now + 5000 + Math.random()*11000;
    try { if (hqInit()){ const t0 = HQ.ac.currentTime; const r = Math.random();
      if (r < .5){ noiseHit(t0, "highpass", 2200, .8, .06, .3); noiseHit(t0+.09, "highpass", 1800, .8, .05, .2); }
      else if (r < .8){ for (let i=0;i<4;i++) noiseHit(t0 + i*.42, "lowpass", 260, 1, .14, .35); }
      else if (sky.dk > .3) HSFX.scream();
      else HSFX.crow(); } } catch {}
  }
  // ---------- the ritual ----------
  {
    const R = MYFX.rit, c = m && m.cult, on = c && c.ritual && !c.solved, dAlt = Math.hypot(R.AX - P.x, R.AZ - P.z);
    R.grp.visible = !!on && dAlt < 70;
    MX.ritualPower = 0;
    if (R.grp.visible){
      const mins = T.t >= 1380 ? T.t - 1380 : T.t + 60;            // minutes since 23:00
      const rite = Math.min(1, Math.max(0, (mins - 30) / 30)), sum = mins >= 85 && mins < 160, rise = sum ? Math.min(1, (mins - 85) / 25) : mins >= 160 ? Math.max(0, 1 - (mins - 160)/20) : 0;
      MX.ritualPower = rite*.6 + rise*.8;
      R.sigil.material.opacity = (.25 + rite*.75) * (.75 + Math.sin(t*3)*.25); R.sigil.rotation.y = t*.15;
      R.light.intensity = (rite*2.2 + rise*3) * (.8 + Math.sin(t*11)*.15 + Math.random()*.1);
      for (let i=0;i<9;i++) R.fire.size[i] = rite * (1.6 + Math.sin(t*4 + i)*.2); R.fire.dirty();
      const u = R.fire.mat.uniforms, sc2 = T3.renderer.domElement.height / (2*Math.tan(T3.camera.fov*Math.PI/360));
      for (const s3 of [R.fire, R.vortex]){ s3.mat.uniforms.uScale.value = sc2; s3.mat.uniforms.uTime.value = t; s3.mat.uniforms.uNear.value = T3.scene.fog.near; s3.mat.uniforms.uFar.value = T3.scene.fog.far; }
      // the vortex winds up out of the sigil
      const V = R.vortex;
      for (let i=0;i<V.n;i++){ V.life[i] += dt*(.12 + rite*.25); if (V.life[i] > 1) V.life[i] -= 1; const k = V.life[i], a = k*12 + i*.7 + t*(1 + rise*2), r = 4.4*(1-k) + .3; V.pos[i*3] = R.AX + Math.cos(a)*r; V.pos[i*3+1] = .2 + k*(4 + rise*6); V.pos[i*3+2] = R.AZ + Math.sin(a)*r; V.size[i] = .6 + k*1.4; V.alpha[i] = rite * (1-k) * .55; }
      V.dirty();
      // the summoning
      const D = R.devil;
      D.g.visible = rise > 0;
      if (D.g.visible){
        D.g.position.y = -8.5 + rise*8.5;
        D.g.rotation.y = Math.atan2(P.x - R.AX, P.z - R.AZ) * .6 + Math.sin(t*.3)*.2;
        D.torso.scale.set(1 + Math.sin(t*1.6)*.03, 1, 1 + Math.sin(t*1.6)*.05);
        D.head.rotation.x = Math.sin(t*.7)*.1 - .1; D.head.rotation.y = Math.sin(t*.5)*.3;
        D.armL.rotation.x = -.4 + Math.sin(t*.8)*.2; D.armR.rotation.x = -.4 + Math.sin(t*.8 + 1)*.2; D.armL.rotation.z = -.3; D.armR.rotation.z = .3;
        for (const [pv, sx] of D.wings) pv.rotation.y = sx*(.5 + Math.sin(t*1.3)*.35);
        if (!R.roared && rise > .3){ R.roared = true; HSFX.roar(); T.shake = .8; }
        if (!R.flashAt || now > R.flashAt){ R.flashAt = now + 3500 + Math.random()*5000; R.flash = now; setTimeout(()=>HSFX.thunder(), 300); }
        if (dAlt < 32 && !m.cult.sawDevil){ m.cult.sawDevil = true; banner("SOMETHING ANSWERS", "The altar splits. Horns, then a head, then eyes like coals, rising out of the ground. The Circle falls to its knees.", true, 8); if (typeof MX.note==="function") MX.note("cult", "At the height of the rite something rose from the altar stone: horned, winged, three times a man's height. They are calling something up."); }
      } else R.roared = false;
      if (R.flash && now - R.flash < 260){ T3.hemi.color.set("#ff3020"); T3.hemi.intensity += (now - R.flash < 90 || now - R.flash > 170) ? 2.5 : 0; }
    }
    // robed figures in the ring raise their arms to it
    if (on) for (const id of c.members){ const n = byIdT(id); if (!n || !alive(n) || n.fight || !n.order || !n.order.ritual) continue; const ch = T3.chars.get(n.id); if (!ch) continue; const [nx, ny] = rposT(n); if (Math.hypot(nx + .5 - R.AX, ny + .5 - R.AZ) > 4.5) continue; const k = Math.sin(t*2.2 + n.x)*.25; ch.armL.rotation.x = ch.armR.rotation.x = -2.7 + k; ch.armL.rotation.z = .35; ch.armR.rotation.z = -.35; ch.head.rotation.x = -.35 + k*.3; ch.g.position.y += Math.abs(Math.sin(t*2.2 + n.x))*.04; }
    // the beast breathes, snarls and swings its tail
    for (const ch of T3.chars.values()){ if (!ch.wolf || !ch.g.visible) continue; const k = t*2.4 + ch.g.position.x; ch.jaw.rotation.x = .25 + Math.max(0, Math.sin(k*.7))*.35 + (Math.random() < .02 ? .3 : 0); ch.torso.scale.set(1 + Math.sin(k)*.04, 1, 1 + Math.sin(k)*.06); ch.tail.rotation.z = Math.sin(t*3 + k)*.3; ch.head.rotation.z = Math.sin(t*1.7)*.08; ch.armL.rotation.z = .25; ch.armR.rotation.z = -.25; }
    // crouching in a thicket; during the rite you peer out over the thorns
    const inThicket = tileT(pl.x, pl.y)==="0";
    if (inThicket && on && dAlt < 16){ if (!R.peek){ R.peek = {fp:T3.cam.fp}; T3.cam.yaw = Math.atan2(-(R.AX - P.x), -(R.AZ - P.z)); T3.cam.fpPitch = -.05; } T3.cam.fp = true; }
    else if (R.peek){ T3.cam.fp = R.peek.fp; R.peek = null; }
    const pc = T3.chars.get("player"); if (pc && inThicket && !T3.cam.fp){ pc.g.position.y -= .5; }
  }
  // ---------- the beast's tracks ----------
  const pr = m && m.ww ? m.ww.prints : [];
  if (pr.length !== MYFX.pawN || (MYFX.pawAt||0) < now){
    MYFX.pawN = pr.length; MYFX.pawAt = now + 3000;
    let n = 0;
    for (const q of pr){
      if (n >= 520) break;
      for (const side of [-1, 1]){
        if (n >= 520) break;
        const dx = q.d[0], dz = q.d[1], ox = -dz*.16*side, oz = dx*.16*side;
        _mo.position.set(q.x + .5 + ox + dx*(side>0 ? .2 : -.2), .02, q.y + .5 + oz + dz*(side>0 ? .2 : -.2)); _mo.rotation.set(0, Math.atan2(-dx, -dz), 0); _mo.scale.set(1,1,1); _mo.updateMatrix();
        MYFX.paws.setMatrixAt(n++, _mo.matrix);
      }
    }
    MYFX.paws.count = n; MYFX.paws.instanceMatrix.needsUpdate = true;
  }
  // ---------- Ashcombe House ----------
  const G = MYFX.g, gh = MYFX.ghost, solved = !m || m.haunt.solved;
  const inHouse = inside==="ashcombe" && !solved;
  T3.darkInside = inHouse;
  // inside the house the roof stays on and you see through your own eyes
  if (inside==="ashcombe"){
    const r = T3.bld.get("ashcombe"); if (r){ if (r.roof) r.roof.visible = true; if (r.walls) r.walls.scale.y = 1; if (r.trim) r.trim.visible = true; if (r.glass) r.glass.visible = true; }
    if (!G.fpSaved){ G.fpSaved = {fp:T3.cam.fp}; const d = pl.dir; T3.cam.yaw = Math.atan2(-d[0], -d[1]); T3.cam.fpPitch = 0; }
    T3.cam.fp = true;
  } else if (G.fpSaved){ T3.cam.fp = G.fpSaved.fp; G.fpSaved = null; }
  if (inHouse){
    const dim = now < (G.darkUntil||0);
    T3.room.color.set("#4a64b0"); T3.room.intensity = dim ? 0 : .3 + Math.sin(t*13)*.07 + (Math.random() < .03 ? -.25 : 0);
    T3.pLight.intensity = dim ? .05 : .2; T3.pLight.color.set("#8090c0"); T3.hemi.intensity *= .35; T3.sun.intensity *= .3;
    if (!G.inside){ G.inside = true; G.next = now + 2500; G.slammed = false; G.wrote = false; G.jumpNext = now + 14000 + Math.random()*10000; G.rooms = {}; HSFX.whisper(); }
    const room = (() => { const b = XP.house; if (px >= 171 && py >= 104) return "nursery"; if (px >= 161 && px <= 169 && py >= 99) return "chapel"; if (px >= 171 && py <= 97) return "study"; if (px <= 159 && py >= 99) return "dining"; if (px <= 159) return "parlour"; return "hall"; })();
    if (!G.rooms[room]){ G.rooms[room] = true; if (room==="nursery" && HWO.jump && !G.nurseryDone){ G.nurseryDone = true; G.rushAt = now + 900; } }
    const spotsAt = (lo, hi, front) => { const b = XP.house, out = []; for (let y=b.y0+1;y<b.y1;y++) for (let x=b.x0+1;x<b.x1;x++){ if (!WALK_T.has(tileT(x,y))) continue; const d = Math.hypot(x+.5-P.x, y+.5-P.z); if (d < lo || d > hi) continue; const L = looking(x+.5, y+.5); if (front===true && L < .75) continue; if (front===false && L > -.3) continue; out.push([x+.5, y+.5]); } return out; };
    // the rush: she stands at the end of the room, then comes at you
    if (HWO.jump && !G.mode && (now > G.jumpNext || (G.rushAt && now > G.rushAt))){
      const s2 = pick(spotsAt(4, 9, true));
      if (s2){ gh.position.set(s2[0], 0, s2[1]); gh.visible = true; G.mode = "rush"; G.until = now + 1600; G.rushStart = now + 700; G.rushFrom = s2; G.rushAt = 0; try { if (hqInit()){ const t0 = HQ.ac.currentTime; ["D5","F5","A5"].forEach((nn,i)=>INST.musicbox(t0 + i*.22, NOTE(nn), 1, 1)); } } catch {} }
      G.jumpNext = now + 22000 + Math.random()*20000;
    }
    if (G.mode==="rush"){
      gh.rotation.y = Math.atan2(cam.x - gh.position.x, cam.z - gh.position.z);
      gh.material.opacity = .75;
      if (now > G.rushStart){ const k = Math.min(1, (now - G.rushStart)/420); gh.position.x = G.rushFrom[0] + (cam.x - G.rushFrom[0])*k*.92; gh.position.z = G.rushFrom[1] + (cam.z - G.rushFrom[1])*k*.92; gh.position.y = k*.4; if (k >= 1){ gh.visible = false; G.mode = null; G.next = now + 7000; G.darkUntil = now + 1800; hwJumpscare("ghost"); } }
    }
    // she shows herself, and then she isn't there
    else {
      if (G.mode && now > G.until){ gh.visible = false; G.mode = null; G.next = now + 5000 + Math.random()*8000; }
      if (gh.visible){
        const d = Math.hypot(gh.position.x - P.x, gh.position.z - P.z);
        gh.material.opacity = .45 + Math.sin(t*30)*.12; gh.position.y = 0;
        gh.rotation.y = Math.atan2(P.x - gh.position.x, P.z - gh.position.z);
        if (d < 1.8){ gh.visible = false; G.mode = null; G.next = now + 5000; T.shake = .3; HSFX.whisper(); }
        // turn around while she's right behind you
        if (G.mode==="behind" && looking(gh.position.x, gh.position.z) > .8){ if (HWO.jump && d < 4.5){ gh.visible = false; G.mode = null; G.next = now + 8000; hwJumpscare("ghost"); } else G.until = Math.min(G.until, now + 350); }
      } else if (now > G.next){
        const behind = Math.random() < .4, pool = behind ? spotsAt(1.6, 3.5, false) : spotsAt(3, 9, true);
        const s2 = pick(pool);
        if (s2){ gh.position.set(s2[0], 0, s2[1]); gh.visible = true; G.mode = behind ? "behind" : "front"; G.until = now + (behind ? 7000 : 1200 + Math.random()*1600); if (behind){ HSFX.whisper(); HSFX.heartbeat(); } }
        else G.next = now + 1500;
      }
    }
    // the house does things
    if (now > (G.sndNext||0)){
      G.sndNext = now + 6000 + Math.random()*10000;
      const r = Math.random();
      try {
        if (r < .2 && !G.slammed){ G.slammed = true; MX.hauntLock = now + 6000; sfx("door"); T.shake = .5; toast("Behind you, the front door slams. It won't open.", "bad", 4); }
        else if (r < .35){ G.darkUntil = now + 2500; HSFX.whisper(); toast(pick(["Every candle in the house goes out at once.","The light dies. Something breathes, close."]), "bad", 3); }
        else if (r < .5 && hqInit()){ const t0 = HQ.ac.currentTime; for (let i=0;i<7;i++) noiseHit(t0 + i*.34, "lowpass", 200, 1, .12, .45); }
        else if (r < .65 && hqInit()){ const t0 = HQ.ac.currentTime; ["D5","F5","A5","F5","D5"].forEach((nn,i)=>INST.musicbox(t0 + i*.42, NOTE(nn), 1, .8)); }
        else if (r < .78) HSFX.knock();
        else if (r < .88 && HWO.jump) HSFX.scream(.35);
        else HSFX.whisper();
      } catch {}
    }
    if (!G.wrote && G.inside && now - (G.enterAt || (G.enterAt = now)) > 9000){
      G.wrote = true; MYFX.getOut.position.set(P.x + fwd.x*2.2, .03, P.z + fwd.z*2.2); MYFX.getOut.rotation.y = Math.atan2(-fwd.x, -fwd.z) + Math.PI; MYFX.getOut.visible = true;
    }
  } else {
    if (G.inside){ G.inside = false; G.enterAt = 0; if (G.mode==="front" || G.mode==="behind"){ gh.visible = false; G.mode = null; } }
    T3.room.color.set("#ffd9a0");
    // at night she stands in a window and watches the road
    const b = XP.house, wins = T3.hw.hauntWins;
    const dh = b ? Math.hypot((b.x0+b.x1)/2 - P.x, (b.y0+b.y1)/2 - P.z) : 999;
    if (!solved && sky.dk > .4 && dh < 32 && dh > 9 && wins.length){
      if (G.mode!=="window" || now > G.until){ const w = pick(wins); gh.position.set(w[0], .2, w[1]); gh.rotation.y = w[2]; G.mode = "window"; G.until = now + 15000 + Math.random()*15000; }
      gh.visible = Math.sin(t*1.7) > -.6; gh.material.opacity = .55;
    } else if (G.mode==="window"){ gh.visible = false; G.mode = null; }
    if (solved || dh > 40) MYFX.getOut.visible = false;
  }
};
