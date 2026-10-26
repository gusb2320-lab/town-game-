// Guns: loud, fast, final. Everyone within earshot hears a shot.
function gunshotHeard(x, y, shooter){
  T.fx.push({kind:"flash", x:x*TS+8, y:y*TS+6, life:.12});
  sfx("gunshot"); T.shake = Math.max(T.shake||0, .18);
  const where = placeLabelAt(Math.round(x), Math.round(y));
  for (const n of folk){
    if (!alive(n) || n===shooter || n.away) continue;
    const d = Math.hypot(n.x-x, n.y-y);
    if (d > 24) continue;
    if (n.asleep && d < 14){ n.asleep = false; emoteT(n, "!", 2); }
    rememberT(n, `Heard a gunshot near ${where} at ${fmtT(T.t)}.`);
    if (d < 12 && !n.fight && !n.order && !n.sheriff){ emoteT(n, "!", 1.5); if (Math.random() < .5) sayT(n, pick(["Was that a GUNSHOT?!","Get down!","Oh my God!"]), 2.5); }
    if (T.mode==="slasher") slasherHearShot(n, x, y, shooter);
  }
  if (shooter===T.player){
    T.notoriety = clamp(T.notoriety + 6, 0, 100);
    const d = detP(); if (d && detAlive() && Math.hypot(d.x-x, d.y-y) < 24) addEvidence(`A gunshot near ${where}, and the newcomer was right there.`, Math.hypot(d.x-x, d.y-y) < 10 ? 14 : 6, "gunshot");
  }
}
// Walk the line of fire from the shooter and hit the first person in it.
function rayTarget(sx, sy, dir, range, from, spread){
  let best = null, bd = 1e9;
  const cands = folk.filter(n=>alive(n) && !n.away && !n.hidden && n!==from).concat(from===T.player ? [] : [T.player]);
  for (const n of cands){
    const [nx, ny] = rposT(n), dx = nx - sx, dy = ny - sy;
    const along = dx*dir[0] + dy*dir[1], side = Math.abs(dx*dir[1] - dy*dir[0]);
    if (along <= 0 || along > range || side > (spread ? .5 + along*.18 : .6)) continue;
    let blocked = false; for (let k=1;k<along;k+=.5){ const tx = Math.round(sx+dir[0]*k), ty = Math.round(sy+dir[1]*k); if (SIGHT_T.has(tileT(tx,ty)) || (tileT(tx,ty)==="#")){ blocked = true; break; } }
    if (!blocked && along < bd){ bd = along; best = n; }
  }
  return best;
}
function playerShootT(gun){
  const pl = T.player, g = gunOf(gun), now = performance.now();
  if (now < (T.shotAt||0)) return; T.shotAt = now + g.cd;
  if (!pl.inv.includes("bullets")){ sfx("pick"); toast("Click. No bullets. (Hartley's sells them.)", "bad", 2.5); return; }
  pl.inv.splice(pl.inv.indexOf("bullets"), 1); renderHotbarT();
  const [sx, sy] = rposT(pl), t = rayTarget(sx, sy, pl.dir, g.range, pl, g.spread);
  const ex = t ? rposT(t) : [sx + pl.dir[0]*g.range, sy + pl.dir[1]*g.range];
  T.fx.push({kind:"tracer", x:sx*TS+8, y:sy*TS+6, x2:ex[0]*TS+8, y2:ex[1]*TS+6, life:.15});
  gunshotHeard(sx, sy, pl);
  T.stats.shots = (T.stats.shots||0) + 1;
  if (!t) return;
  if (t===pl) return;
  faceToT(pl, t);
  if (!pl.fight || pl.fight.target!==t.id) startFightT(pl, t);
  pl.fight.last = now;
  const dmg = Math.round(g.dmg * (.85 + Math.random()*.3) * (Math.hypot(ex[0]-sx, ex[1]-sy) > g.range*.7 ? .75 : 1));
  hitT(pl, t, dmg);
}
function npcShootT(n, t, gun){
  const g = gunOf(gun), [sx, sy] = rposT(n), [tx, ty] = rposT(t);
  const miss = Math.random() < .3;
  T.fx.push({kind:"tracer", x:sx*TS+8, y:sy*TS+6, x2:tx*TS+8+(miss?20:0), y2:ty*TS+6+(miss?-12:0), life:.15});
  gunshotHeard(sx, sy, n);
  sayT(n, pick(["FREEZE!","DROP IT!","Stay down!"]), 1.5);
  if (!miss) hitT(n, t, Math.round(g.dmg * .55 * (.8 + Math.random()*.4)));
}
