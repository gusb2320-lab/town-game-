// Hand-written end of the standalone engine: Claude connection, icons, and window.CB9 for the town code.
function addIcons(obj){
  Object.assign(ICONS, obj);
  const c = document.createElement("canvas"); c.width = 10; c.height = 10; const g2 = c.getContext("2d");
  for (const k in obj){
    g2.clearRect(0,0,10,10); const rows = obj[k];
    g2.fillStyle = "rgba(0,0,0,.35)";
    rows.forEach((r,y)=>[...r].forEach((ch,x)=>{ if (ch!=="."&&ch!==" ") g2.fillRect(x+2,y+2,1,1); }));
    rows.forEach((r,y)=>[...r].forEach((ch,x)=>{ if (ch!=="."&&ch!==" "){ g2.fillStyle = PAL[ch]||"#f0f"; g2.fillRect(x+1,y+1,1,1); } }));
    iconUrl[k] = c.toDataURL();
  }
}
const cv = $("cv");
let sample = null, aiMode = "checking";
const AI_OFF = ["not_granted","sampling_disabled","not_declared","capability_disabled","capability_removed"];
async function connectClaude(){
  try { sample = window.claude && window.claude.use ? await window.claude.use("sample") : null; } catch { sample = null; }
  aiMode = sample ? "on" : "off";
}
// 2D-only helpers the town code can reach for; the 3D renderer draws these itself.
function tri(){}
function drawEmote(){}
buildIcons();
window.CB9 = {Snd, sfx, PAL, SUITS, ICONS, iconUrl, iconOf, ITEMS, addIcons, drawPerson, shade, wrap, contourAt, toast, banner, $, clamp, pick, rnd, mulberry, shuffle,
  cv, ctx:null, view:()=>({zoom:3, dpr:window.devicePixelRatio||1}), resize(){}, getSample:()=>sample, aiOn:()=>!!sample && aiMode==="on", setAiOff:()=>{ sample = null; aiMode = "off"; }, AI_OFF,
  drawHeart, drawLock, tri, drawEmote, slotsOf, STACKS, STACK_MAX, WEAPONS, HEALS, CONTRA, prisonState:()=>null, prisonCast:()=>[], fmtClock:t=>t, opWord, relWord,
  showTitle:()=>{ if (window.MB3D) window.MB3D.showTitle(); }};
connectClaude();
