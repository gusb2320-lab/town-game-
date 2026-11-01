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
document.body.classList.add("in-town");
buildTown();
setTimeout(mbTitleRefresh, 800);
mbTitleRefresh();
requestAnimationFrame(mbFrame);
window.__town3d = {get T3(){ return T3; }};
