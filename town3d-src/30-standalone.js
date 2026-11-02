// Standalone Millbrook: its own title screen, its own game loop, and a few 3D-only options.
function mbTitleRefresh(){
  const s = loadSavedT(), b = $("mbCont");
  const ok = s && !s.ending && s.mode!=="slasher";
  b.hidden = !ok; if (ok) b.textContent = `Continue · ${DAYS[(s.day-1)%7]}, day ${s.day}`;
  $("mbAi").textContent = E.aiOn() ? "Everyone in town is voiced live by Claude." : "Claude isn't connected here, so people use stock lines.";
}
window.MB3D = {showTitle(){ $("mbTitle").hidden = false; mbTitleRefresh(); }};
function mbStart(){ Snd.init(); $("mbTitle").hidden = true; clearSaveT(); begin(); }
function mbContinue(){ Snd.init(); $("mbTitle").hidden = true; if (!cont()){ $("mbTitle").hidden = false; toast("That save is gone.", "bad"); } }
$("mbNew").addEventListener("click", () => { if (loadSavedT() && !$("mbCont").hidden) confirmT("Start a new life? Your saved Millbrook will be lost.", "Start over", mbStart); else mbStart(); });
$("mbCont").addEventListener("click", mbContinue);
// 3D options in the pause menu
(() => {
  const opts = $("tWinMenu").querySelector(".opts");
  const lab = document.createElement("label"); lab.innerHTML = `<input type="checkbox" id="mbPixel"> Chunky retro pixels (faster)`;
  opts.append(lab);
  const box = lab.querySelector("input"); box.checked = T3.pixel !== false;
  box.addEventListener("change", () => { T3.pixel = box.checked; try { localStorage.setItem("mb3d-pixel", box.checked ? "1" : "0"); } catch {} resize3D(); });
  // camera feel
  const sl = document.createElement("label"); sl.className = "mbSlider";
  sl.innerHTML = `Camera sensitivity <input type="range" id="mbSens" min="0.2" max="3" step="0.05"> <output id="mbSensV"></output>`;
  opts.append(sl);
  const sens = sl.querySelector("input"), sv = sl.querySelector("output");
  const showSens = () => { sv.textContent = (+sens.value).toFixed(2) + "×"; };
  sens.value = T3.sens || 1; showSens();
  sens.addEventListener("input", () => { T3.sens = +sens.value; showSens(); try { localStorage.setItem("mb3d-sens", sens.value); } catch {} });
  const iv = document.createElement("label"); iv.innerHTML = `<input type="checkbox" id="mbInvY"> Invert camera up and down`; opts.append(iv);
  const ivb = iv.querySelector("input"); ivb.checked = !!T3.invY;
  ivb.addEventListener("change", () => { T3.invY = ivb.checked; try { localStorage.setItem("mb3d-invy", ivb.checked ? "1" : "0"); } catch {} });
  if (HALLOW){
    for (const [id, key, label, get, set] of [["hwJump", "hw-jump", "Jumpscares", () => HWO.jump, v => { HWO.jump = v; }], ["hwGrainOpt", "hw-grain", "Film grain", () => HWO.grain, v => { HWO.grain = v; }]]){
      const lb = document.createElement("label"); lb.innerHTML = `<input type="checkbox" id="${id}"> ${label}`; opts.append(lb);
      const bx = lb.querySelector("input"); bx.checked = get();
      bx.addEventListener("change", () => { set(bx.checked); try { localStorage.setItem(key, bx.checked ? "1" : "0"); } catch {} });
    }
  }
  const keys = $("tWinMenu").querySelector(".keys");
  keys.insertAdjacentHTML("beforeend", `<b>DRAG · WHEEL</b><span>turn the camera · zoom</span><b>V</b><span>first person / third person</span><b>[ ]</b><span>turn the camera in 45° steps</span>`);
})();
// the loop
let mbLast = performance.now();
function mbFrame(now){
  const dt = Math.min(.05, (now - mbLast)/1000); mbLast = now;
  try {
    if (TOWN.active && T) TOWN.frame(dt);
    else if (!$("mbTitle").hidden) renderAttract3D(dt);
  } catch (e){ console.error(e); if (!mbFrame.warned){ mbFrame.warned = true; toast(`Something broke: ${e.message}`, "bad", 8); } }
  requestAnimationFrame(mbFrame);
}
if (matchMedia("(pointer:coarse)").matches) document.body.classList.add("touch");
if (HALLOW){
  document.body.classList.add("hallow");
  document.title = "Millbrook: Hallowmere";
  const ttl = $("mbTitle");
  ttl.querySelector(".eyebrow").textContent = "A CELLBLOCK NINE STORY · ALL HALLOWS' WEEK";
  ttl.querySelector(".title").innerHTML = `MILLBROOK<span class="hwSub">Hallowmere</span>`;
  ttl.querySelector("p").textContent = "You went over the wall of Cellblock Nine and ran until the trees stopped looking like trees. Now you need a new name in a village that hangs strangers. Twenty-one neighbors, a masked festival, and someone among them who has been sent to find you. The moon is watching too.";
  $("mbNew").textContent = "Enter the village";
  ttl.insertAdjacentHTML("beforeend", `<p class="hwWarn">For adults. Contains violence, gore, and frightening images. Jumpscares can be turned off in the pause menu.</p>`);
  // the title theme starts on the first touch (browsers keep audio asleep until then)
  const wake = () => { removeEventListener("pointerdown", wake); removeEventListener("keydown", wake); Snd.init(); if (!$("mbTitle").hidden && !TOWN.active) Snd.track("title"); };
  addEventListener("pointerdown", wake); addEventListener("keydown", wake);
  const showT = window.MB3D.showTitle; window.MB3D.showTitle = () => { showT(); if (Snd.ac) Snd.track("title"); };
}
document.body.classList.add("in-town");
buildTown();
setTimeout(mbTitleRefresh, 800);
mbTitleRefresh();
requestAnimationFrame(mbFrame);
window.__town3d = {get T3(){ return T3; }};
