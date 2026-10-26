// Core: engine hooks from the prison game, constants, pools, items, state helpers.
const E = window.CB9;
if (!E) throw new Error("Cellblock Nine engine not loaded");
const { Snd, sfx, PAL, $, clamp, pick, rnd, shuffle, toast, banner, drawPerson, shade, wrap, contourAt } = E;
const TS = 16, TW = 104, TH = 84, CAP = 6;
const TSAVE = "cellblock9-town-v1";
const DIRS4 = [[0,-1],[1,0],[0,1],[-1,0]];
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const PNUMT = "#4471";

let T = null;          // the whole saveable town state
let folk = [];         // T.folk, the townspeople

// ---------- name and personality pools ----------
const FIRST = ["Agnes","Bea","Cal","Dot","Earl","Faye","Gus","Hattie","Ida","Jules","Kit","Lou","Mabel","Ned","Opal","Pete","Queenie","Ray","Sid","Tess","Ulla","Vern","Wren","Abe","Bonnie","Cy","Della","Elmer","Flo","Gil","Hank","Irene","June","Lyle","Marge","Nola","Otis","Pearl","Rosa","Sully","Thea","Walt","Zelda","Arlo","Birdie","Clem","Dina","Ezra","Frankie","Ginny","Hal","Iris","Joe","Lena","Mo","Nico","Ora","Percy","Ruthie","Sam","Tully","Vi","Win","Yuki","Amos","Bess","Cora","Dale","Effie","Floyd","Grady","Hazel","Jasper","Lottie","Milo","Nell","Odell","Priya","Reuben","Sunny","Tomas"];
const LAST = ["Abernathy","Baines","Calloway","Dunmore","Ebert","Fairchild","Greer","Hollis","Ingram","Jessup","Kowalski","Lindqvist","Marsh","Nakamura","Ortega","Pruitt","Quill","Ramsey","Sawyer","Thibodeaux","Underwood","Vance","Whitlock","Yates","Alvarez","Bishop","Crane","Delacroix","Esposito","Finch","Gallo","Hargrove","Ivers","Juarez","Kincaid","Lowell","Mercer","Nguyen","Osei","Pemberton","Rourke","Stroud","Tanaka","Voss","Wexler","Zimmer","Boone","Castillo","Doyle","Everly"];
const TRAITS = ["warm","gossipy","grumpy","shy","flirtatious","nosy","pious","cynical","cheerful","anxious","proud","generous","stingy","superstitious","witty","blunt","romantic","paranoid","lazy","hardworking","nostalgic","competitive","kind","sarcastic","dramatic","calm","lonely","nervous","bossy","dreamy"];
const HOBBIES = ["fishing","darts","cards","arcade","dancing","reading","gardening","church choir","painting","gossip","walks in the park","drinking"];
const LIKES = ["apple pie","flowers","coffee","whiskey","book","record","chocolate","perch","bass","trout","donut","milkshake","lottery ticket","newspaper","beer","sandwich"];
const SECRETS = [
  "is having a secret affair with {X}",
  "owes {X} five hundred dollars and avoids them",
  "has been skimming money from the till at work",
  "did two years in a state prison long ago and never told anyone",
  "is quietly in love with {X}",
  "writes the anonymous letters that keep appearing in the Gazette",
  "buried a box of something behind the church years ago",
  "is saving up to leave Millbrook forever and tell no one",
  "lies about having served in the army",
  "drinks on the job and hides bottles at work",
  "is the one who keeps stealing garden gnomes",
  "has a grown child in the city they never mention",
  "reads other people's mail when no one's looking",
  "is terrified of something they saw in the woods last autumn",
  "is secretly broke and pretending otherwise",
  "cheats at cards and has for twenty years"
];
// Little habits. The detective has two; a few innocent people share one, to muddy the trail.
const TELLS = [
  {id:"mint", clue:"A crumpled peppermint wrapper", habit:"is always sucking on a peppermint", words:["peppermint","mint"]},
  {id:"pipe", clue:"The faint smell of cherry pipe tobacco", habit:"smokes a cherry-scented pipe", words:["pipe","tobacco","cherry"]},
  {id:"ink", clue:"A smudge of green ink", habit:"writes everything down with a fountain pen in green ink", words:["green ink","fountain pen","pen"]},
  {id:"hum", clue:"Someone humming three notes of an old jazz tune, out of sight", habit:"hums an old jazz tune under their breath", words:["hum","humming","tune"]},
  {id:"cologne", clue:"A whiff of sandalwood", habit:"wears sandalwood cologne", words:["sandalwood","cologne"]},
  {id:"limp", clue:"Uneven footprints, one foot dragging", habit:"walks with a slight limp from an old injury", words:["limp","knee","old injury"]},
  {id:"seeds", clue:"Sunflower seed shells on the floor", habit:"snacks on sunflower seeds constantly", words:["sunflower","seeds"]},
  {id:"chalk", clue:"A dusting of blue pool chalk", habit:"always has blue chalk on their fingers from shooting pool", words:["chalk","pool"]}
];

// ---------- items ----------
const TITEMS = {
  "prison jumpsuit":["Orange. Stencilled 4471 on the back. Get rid of it.",0,{evidence:3}],
  "burger":["Lou's famous double.",6,{heal:22}], "milkshake":["Strawberry.",4,{heal:10}], "pie slice":["Still warm.",3,{heal:12}],
  "donut":["Glazed.",2,{heal:6}], "sandwich":["Ham and pickles.",4,{heal:15}], "coffee":["Diner coffee. Strong.",1,{heal:4}],
  "apple pie":["A whole pie, lattice top.",10,{heal:30}], "chocolate":["A box of chocolates.",8,{heal:10}],
  "whiskey":["A pint bottle. Makes you brave and sloppy.",12,{drink:3}], "beer":["A cold bottle.",3,{drink:1}],
  "perch":["A small perch.",4,{fish:1}], "bass":["A fat largemouth bass.",9,{fish:2}], "catfish":["Whiskers and all.",12,{fish:3}],
  "trout":["A speckled trout.",14,{fish:3}], "golden carp":["Glittering. People talk about these.",60,{fish:5}], "old boot":["Soggy.",0,{junk:1}],
  "flowers":["A bunch of wildflowers.",5,{}], "record":["A jazz record, barely scratched.",15,{}], "book":["A paperback mystery.",6,{}],
  "lottery ticket":["Scratch it to find out.",2,{scratch:1}], "newspaper":["Today's Millbrook Gazette.",1,{read:1}],
  "fishing rod":["Bamboo, with a red bobber.",20,{tool:1}], "shovel":["For gardening. Or not.",18,{tool:1}], "mop":["Cleans up spills. Any spills.",8,{tool:1}],
  "bleach":["Gets out the toughest stains.",6,{clean:1}], "rope":["Twenty feet of rope.",7,{tool:1}],
  "hat":["A brimmed hat. Hides your face a little.",14,{wear:"hat"}], "reading glasses":["Thick frames. You look like someone else.",10,{wear:"glasses"}],
  "sunglasses":["Aviators.",12,{wear:"shades"}],
  "room key":["Key to your room at the Millbrook Arms.",0,{keep:1}], "fake ID":["A new you, laminated.",150,{papers:1}], "train ticket":["One way to the city.",120,{ticket:1}],
  "kitchen knife":["Sharp.",9,{weapon:22}], "baseball bat":["Louisville slugger.",15,{weapon:18}], "wrench":["Heavy.",8,{weapon:16}],
  "wallet":["Someone else's wallet.",0,{evidence:2}], "creepy note":["Unsigned. Someone has been watching you.",0,{read:1}],
  "letter":["A letter.",0,{read:1}], "case file":["A thin folder stamped STATE BUREAU. CONFIDENTIAL.",0,{read:1,evidence:1}],
  "matches":["A book of matches.",1,{tool:1}],
  "revolver":["A six-shooter. Loud enough to wake the whole street.",80,{weapon:12, gun:{dmg:46, range:8, cd:700}}],
  "hunting rifle":["Bolt action. Reaches across the square.",90,{weapon:14, gun:{dmg:64, range:12, cd:1300}}],
  "shotgun":["Double barrel. Short range, no mistakes.",70,{weapon:14, gun:{dmg:58, range:5, cd:1100, spread:true}}],
  "bullets":["Loose rounds. Every gun in town takes them, somehow.",2,{ammo:1}],
  "detective's badge":["STATE BUREAU OF INVESTIGATION. The photo almost looks like you, if you squint.",0,{evidence:4, badge:1}], "flashlight":["Lights up dark corners.",12,{tool:1}], "lockpick":["Opens locked doors. Might snap.",0,{evidence:1}]
};
// Items carried over from the prison that would give you away if found on you.
const PRISON_TELLTALE = new Set(["shiv","sock mace","comb blade","baton","guard uniform","grappling hook","makeshift file","wire cutters","gate key","spare gate key","hooch","dummy","dirt","lockpick","prison jumpsuit"]);
E.addIcons({
  "prison jumpsuit":[".oo..oo.","oooooooo","oOooooOo",".owwwwo.",".owkkwo.",".oooooo.",".oo..oo.",".OO..OO."],
  "burger":["........",".aaaaaa.","aayayaya","GGGGGGGG","UUUUUUUU","rrrrrrrr",".aaaaaa.","........"],
  "milkshake":["..w.....","...w....",".kPPPPk.",".kPwPPk.","..kPPk..","..kPPk..","..kPPk..","..kkkk.."],
  "pie slice":["........","......u.","....uaa.","..uaaaa.",".uaraara","uaaaaaaa","uuuuuuuu","........"],
  "donut":["........","..kkkk..",".kPPPPk.","kPPkkPPk","kPPkkPPk",".kaaaak.","..kkkk..","........"],
  "sandwich":["........","........",".aaaaaa.","GGGGGGGG","rrrrrrrr","yyyyyyyy",".aaaaaa.","........"],
  "apple pie":["........","..kkkk..",".kauauk.","kauauauk","kuauauak",".kuuuuk.","..kkkk..","........"],
  "whiskey":["...kk...","...kk...","..kuuk..",".kuuuuk.",".kuwuuk.",".kuuuuk.",".kuuuuk.","..kkkk.."],
  "beer":["...kk...","...GG...","..kGGk..",".kGGGGk.",".kGwGGk.",".kGGGGk.",".kGGGGk.","..kkkk.."],
  "fish":["........","........",".kkkk..k","kllllkkl","klwklllk","kllllkkl",".kkkk..k","........"],
  "golden carp":["........","........",".kkkk..k","kyyyykky","kywkyyyk","kyyyykky",".kkkk..k","........"],
  "old boot":["........","..kkk...","..kUk...","..kUk...","..kUUkk.","..kUUUUk","..kkkkkk","........"],
  "flowers":[".r.y.P..","rrryyPPP",".r.y.P..","..GGG...","...G....","...G....","..kkk...","..kkk..."],
  "record":["..kkkk..",".kkkkkk.","kkkrrkkk","kkrwrrkk","kkkrrkkk","kkkkkkkk",".kkkkkk.","..kkkk.."],
  "book":[".kkkkkk.",".kbbbbkk",".kbyybkw",".kbbbbkw",".kbbbbkw",".kbbbbkw",".kkkkkkw","..wwwww."],
  "lottery ticket":["........","kkkkkkkk","kyyyyyyk","kyrryyyk","kyyymmyk","kyyyyyyk","kkkkkkkk","........"],
  "newspaper":[".kkkkkk.",".kwwwwk.",".kwddwk.",".kwwwwk.",".kwdwdk.",".kwwwwk.",".kwddwk.",".kkkkkk."],
  "fishing rod":[".......l","......l.",".....l.w","....l..w","...l...w","..u....r","..u.....","..u....."],
  "mop":["......u.",".....u..","....u...","...u....","..u.....",".www....","wwwww...","w.w.w..."],
  "bleach":["...kk...","..kBBk..",".kwwwwk.",".kwBBwk.",".kwBwwk.",".kwBBwk.",".kwwwwk.",".kkkkkk."],
  "rope":["..aaaa..",".a....a.","a..aa..a","a.a..a.a","a.a..a.a","a..aa..a",".a....a.","..aaaa.."],
  "hat":["........","........","..kkkk..",".kUUUUk.",".kkkkkk.","kUUUUUUk","kkkkkkkk","........"],
  "reading glasses":["........","........","kkk..kkk","kck..kck","kkkkkkkk","k......k","........","........"],
  "room key":["..kkk...",".kaaak..",".ka.ak..",".kaaak..","..kak...","..kak...","..kaak..","..kak..."],
  "fake ID":["kkkkkkkk","kwwwwwwk","kwsswbbk","kwsswwwk","kwkkwbbk","kwwwwwwk","kkkkkkkk","........"],
  "train ticket":["........","kkkkkkkk","kyyyyryk","kykkyyyk","kyyyyryk","kkkkkkkk","........","........"],
  "kitchen knife":[".......l","......lw",".....lw.","....lw..","...lw...","..kk....",".kUk....","kUk....."],
  "baseball bat":[".......a","......aa",".....aa.","....aa..","...aa...","..aa....",".uu.....","uu......"],
  "wrench":["......ll",".....l.l","....l.ll","...l....","..l.....",".l......","ll......","l......."],
  "wallet":["........","........","kkkkkkkk","kUUUUUUk","kUUyUUUk","kUUUUUUk","kkkkkkkk","........"],
  "creepy note":["........",".kkkkkk.",".kwwwwk.",".kwrrwk.",".kwwwwk.",".kwrwrk.",".kkkkkk.","........"],
  "revolver":["........","........","kkkkkkk.","klllllkk","kkkkuk..","....uk..","....uk..","....kk.."],
  "hunting rifle":["........","........","kkkkkkkk","lllllluu","kkkkkuuu",".....uuu","......uu","........"],
  "shotgun":["........","kkkkkkk.","lllllluu","lllllluu","kkkkkuuu","....uuuu",".....uu.","........"],
  "bullets":["........","..y..y..",".yy.yy..",".yy.yy..",".uu.uu..",".uu.uu..","........","........"],
  "detective's badge":["..kkkk..",".kyyyyk.","kyyrryyk","kyrwwryk","kyyrryyk",".kyyyyk.","..kyyk..","...kk..."],
  "case file":["........","kkkkk...","kaaaakkk","kaaaaaak","karrraak","kaaaaaak","kkkkkkkk","........"]
});
const FISH = ["perch","bass","catfish","trout","golden carp","old boot"];
function iconOfT(it){ if (E.iconUrl[it]) return E.iconUrl[it]; if (FISH.includes(it)) return E.iconUrl.fish; if (/letter|note/.test(it)) return E.iconUrl.note; return E.iconOf(it); }
function itemT(it){
  if (TITEMS[it]) return {desc:TITEMS[it][0], price:TITEMS[it][1], ...TITEMS[it][2]};
  const p = E.ITEMS[it];
  const w = E.WEAPONS[it], h = E.HEALS[it];
  return {desc:p ? p[0] : "", price:p ? p[1]*3 : 1, weapon:w, heal:h, evidence: PRISON_TELLTALE.has(it) ? 2 : 0};
}
const weaponDmg = it => itemT(it).weapon || 0;
const gunOf = it => it && itemT(it).gun || null;
const isEvidence = it => !!itemT(it).evidence || /'s wallet$/.test(it);
const STACKT = new Set(["coffee","donut","beer","perch","bass","catfish","trout","old boot","flowers","lottery ticket","newspaper","bleach","burger","milkshake","pie slice","sandwich","matches","dirt","bullets"]);
function slotsT(inv){
  const order = [], counts = {};
  for (const it of inv){ if (!(it in counts)){ counts[it] = 0; order.push(it); } counts[it]++; }
  const out = [];
  for (const it of order){ let c = counts[it]; if (STACKT.has(it) || E.STACKS.has(it)){ while (c>0){ const k = Math.min(10, c); out.push({item:it, count:k}); c -= k; } } else for (let i=0;i<c;i++) out.push({item:it, count:1}); }
  return out;
}
const canAddT = (inv, it, n=1) => slotsT(inv.concat(Array(n).fill(it))).length <= CAP;
const countIn = (inv, it) => inv.reduce((s,x)=>s+(x===it?1:0),0);

// ---------- time ----------
const absT = () => T.day*1440 + T.t;
const hourNow = () => Math.floor(T.t/60);
const dayName = (d=T.day) => DAYS[(d-1)%7];
const fmtT = t => { const m = Math.floor(t)%1440; return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0"); };
const stampT = () => `${dayName()} (day ${T.day}) ${fmtT(T.t)}`;
const isNightT = () => T.t >= 22*60 || T.t < 6*60;
const darknessT = t => { if (t<300) return .78; if (t<420) return .78*(1-(t-300)/120); if (t<1140) return 0; if (t<1320) return .78*((t-1140)/180); return .78; };

// ---------- people helpers ----------
const byIdT = id => folk.find(n=>n.id===id);
const nmT = id => { const n = byIdT(id); return n ? n.first : "someone"; };
const fullT = n => `${n.first} ${n.last}`;
const alive = n => n && !n.dead;
const isDet = n => n && T.det && n.id===T.det.id;
function rememberT(n, text){ if (!n || !text || n.dead) return; n.memories.push({s:stampT(), text:String(text).slice(0,300)}); if (n.memories.length>160) n.memories.splice(6,1); }
function gossipT(n, text){ if (n && text && !n.dead) n.gossip.push({text:String(text).slice(0,240), to:[]}); }
function newsT(text, who=[], quiet, kind){
  const pl = T.player, seen = who.some(id => { const n = byIdT(id); return n && distT(n, pl) < 12; });
  T.news.push({s:stampT(), day:T.day, text, who, seen, kind:kind||""});
  if (T.news.length > 200) T.news.shift();
  if (!quiet && seen){ toast(text, "news", 5); sfx("news"); }
}
const relKeyT = (a,b) => a<b ? a+"|"+b : b+"|"+a;
const relGetT = (a,b) => T.rel[relKeyT(a,b)] || 0;
function relAddT(a,b,v){ const k = relKeyT(a,b); T.rel[k] = clamp((T.rel[k]||0)+v, -100, 100); }
const relWordT = v => v>=70?"devoted":v>=45?"close":v>=20?"friends":v>=5?"friendly":v>-10?"neutral":v>-30?"tense":v>-60?"enemies":"bitter enemies";
function tierOf(n){
  if (n.partner) return "Sweetheart";
  const v = n.opinion + n.trust*.5;
  return v>=110?"Best friend":v>=70?"Close friend":v>=35?"Friend":v>=10?"Acquaintance":v>-20?"Stranger":v>-50?"Wary":"Enemy";
}
const opWordT = v => v>=60?"Adores you":v>=30?"Likes you":v>=10?"Warming up":v>-10?"Neutral":v>-30?"Wary":v>-60?"Dislikes you":"Hates you";

// ---------- money ----------
function addMoney(v, why){
  T.money = Math.max(0, Math.round(T.money + v));
  if (why) toast(`${v>=0?"+":"−"}$${Math.abs(Math.round(v))} · ${why}`, v>=0?"good":"", 2.5);
  if (v>0) sfx("coin");
}

// ---------- save ----------
const SKIP_SAVE = new Set(["scene","bubble","emote","path","fx"]);
function saveT(){ if (!T || T.ending) return; try { localStorage.setItem(TSAVE, JSON.stringify(T, (k,v)=>SKIP_SAVE.has(k) ? undefined : v)); } catch (e){ console.warn("save failed", e); } }
function loadSavedT(){ try { const s = localStorage.getItem(TSAVE); return s ? JSON.parse(s) : null; } catch { return null; } }
function clearSaveT(){ try { localStorage.removeItem(TSAVE); } catch {} }
