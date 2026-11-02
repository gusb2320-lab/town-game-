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
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
  const s = Math.min(w, h) / 64, cx = w/2 + Math.sin(t*55)*s*.6, cy = h/2;
  const F = (x,y,ww,hh,col) => { g.fillStyle = col; g.fillRect(cx + x*s, cy + y*s, ww*s, hh*s); };
  F(-26,-32,52,64,"#0a0808"); F(-16,-24,32,44,"#d8dce4"); F(-18,-16,36,30,"#c8ccd8");
  F(-12,-10,9,11,"#000"); F(3,-10,9,11,"#000"); F(-9,-6,2,2,"#fff"); F(6,-6,2,2,"#fff");
  F(-5,8,10,12,"#000"); F(-3,10,6,8,"#200000");
  F(-12,1,2,14,"rgba(40,0,0,.8)"); F(10,1,2,16,"rgba(40,0,0,.8)");
  F(-26,-32,8,64,"#050404"); F(18,-32,8,64,"#050404");
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
  MYFX.snd = {next:performance.now() + 6000};
};
const _mv = new THREE.Vector3(), _mo = new THREE.Object3D();
MYFX.update = (dt, now, attract, sky) => {
  if (!T3.hw) return;
  MYFX.init();
  const t = now/1000;
  if (T3.hw.millWheel) T3.hw.millWheel.rotation.x += dt*.7;
  if (T3.hw.hangGroups) T3.hw.hangGroups.forEach((g, i) => { g.rotation.z = Math.sin(t*.8 + i*2)*.06; g.rotation.y = Math.sin(t*.3 + i)*.4; });
  if (attract || !T){ MYFX.ghost.visible = false; for (const e of MYFX.eyes) e.g.visible = false; return; }
  const pl = T.player, [px, py] = rposT(pl), P = {x:px+.5, z:py+.5}, inside = insideOf(pl), m = T.myst;
  const cam = T3.camera.position, fwd = new THREE.Vector3(); T3.camera.getWorldDirection(fwd);
  const looking = (x, z, y=1) => { _mv.set(x - cam.x, y - cam.y, z - cam.z).normalize(); return fwd.dot(_mv); };
  // ---------- the Blackwood ----------
  const forest = !inside && py >= 86, deep = forest && py >= 100;
  HWS.forest = forest; HWS.forestDeep = deep;
  T3.minPitch = forest ? .9 : 0; T3.maxDist = forest ? 9 : 99;
  // a roof the camera has sunk into gets out of the way
  for (const [k, r] of T3.bld){ const b = r.b; if (!b || !r.roof || !r.roof.visible) continue; if (cam.x > b.x0 - .8 && cam.x < b.x1 + 1.8 && cam.z > b.y0 - .8 && cam.z < b.y1 + 1.8 && cam.y < WALL_H + Math.min(b.x1-b.x0, b.y1-b.y0)*.55 + 1) r.roof.visible = false; }
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
  if (inHouse){
    T3.room.color.set("#5070c0"); T3.room.intensity = .35 + Math.sin(t*13)*.08 + (Math.random() < .03 ? -.3 : 0);
    T3.pLight.intensity = .22; T3.hemi.intensity *= .5;
    if (!G.inside){ G.inside = true; G.next = now + 2500; G.slammed = false; G.wrote = false; HSFX.whisper(); }
    // she shows herself, and then she isn't there
    if (G.mode && now > G.until){ gh.visible = false; G.mode = null; G.next = now + 6000 + Math.random()*9000; }
    if (gh.visible){
      const d = Math.hypot(gh.position.x - P.x, gh.position.z - P.z);
      gh.material.opacity = .45 + Math.sin(t*30)*.12;
      gh.rotation.y = Math.atan2(P.x - gh.position.x, P.z - gh.position.z);
      if (d < 1.8){ gh.visible = false; G.mode = null; G.next = now + 5000; T.shake = .3; HSFX.whisper(); }
      if (G.mode==="behind" && looking(gh.position.x, gh.position.z) > .8){ G.until = Math.min(G.until, now + 350); }
    } else if (now > G.next){
      const b = XP.house, spots = [];
      for (let y=b.y0+1;y<b.y1;y++) for (let x=b.x0+1;x<b.x1;x++){ if (!WALK_T.has(tileT(x,y))) continue; const d = Math.hypot(x+.5-P.x, y+.5-P.z); if (d > 3 && d < 9) spots.push([x+.5, y+.5]); }
      const behind = Math.random() < .3, pool = spots.filter(([x,z]) => behind ? looking(x, z) < -.3 : looking(x, z) > .5);
      const s = pick(pool.length ? pool : spots);
      if (s){ gh.position.set(s[0], 0, s[1]); gh.visible = true; G.mode = behind ? "behind" : "front"; G.until = now + (behind ? 6000 : 1200 + Math.random()*1600); if (behind) HSFX.whisper(); else if (Math.random() < .5) try { if (hqInit()){ const t0 = HQ.ac.currentTime; ["D5","F5","A5"].forEach((nn,i)=>INST.musicbox(t0 + i*.5, NOTE(nn), 1, .9)); } } catch {} }
      else G.next = now + 2000;
    }
    // the house does things
    if (now > (G.sndNext||0)){
      G.sndNext = now + 7000 + Math.random()*12000;
      const r = Math.random();
      try {
        if (r < .25 && !G.slammed && Math.random() < .7){ G.slammed = true; MX.hauntLock = now + 5000; sfx("door"); T.shake = .4; toast("Behind you, the front door slams. It won't open.", "bad", 4); }
        else if (r < .5 && hqInit()){ const t0 = HQ.ac.currentTime; for (let i=0;i<6;i++) noiseHit(t0 + i*.38, "lowpass", 200, 1, .12, .4); }
        else if (r < .7 && hqInit()){ const t0 = HQ.ac.currentTime; ["D5","F5","A5","F5","D5"].forEach((nn,i)=>INST.musicbox(t0 + i*.42, NOTE(nn), 1, .8)); }
        else if (r < .85) HSFX.knock();
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
