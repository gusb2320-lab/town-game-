# Cellblock Nine

An 8-bit prison-escape game in the style of The Escapists. All 17 inmates and guards are voiced by Claude. They remember everything you say, keep relationships with each other, trade, gossip, fight, and act on what you ask them to do.

Escape, and the game goes on: a cutscene carries you to **Millbrook**, a small town where you have to live as someone new while an undercover detective tries to prove you're the escaped convict. Kill that detective and take their badge, and you find out who you really are: part three sends you back into Cellblock Nine in a guard's uniform, and part four brings you back to Millbrook for something much worse.

The title screen has a **Chapter select**, so any part can be started on its own.

This repo runs the game on your own computer. A small Node server serves the game and forwards its requests to the Claude API, so your API key stays on your machine and never reaches the browser.

## Run it

You need Node.js 18 or newer and an Anthropic API key from https://console.anthropic.com.

```bash
git clone https://github.com/gusb2320-lab/town-game-.git
cd town-game-
npm install
export ANTHROPIC_API_KEY=sk-ant-...   # Windows PowerShell: $env:ANTHROPIC_API_KEY="sk-ant-..."
npm start
```

Then open http://127.0.0.1:3000.

If you have run `ant auth login`, you can skip the API key; the server picks up that login. Without any credentials the game still runs, but the characters fall back to a few stock lines.

## Phase two: Millbrook

After you break out (or with **Skip to Millbrook** on the title screen), a truck drops you outside the Millbrook Arms with $40, a room key and a jumpsuit you need to get rid of. Pick a new name.

- **A new cast every game.** 20 townspeople plus the sheriff, with random names, jobs, homes, families, marriages, friendships, feuds, secrets and affairs. Claude writes their backstories at the start. They keep daily routines, talk to each other, fall in and out of love, trade, steal, gossip and fight without you. They also walk up to you to chat, ask favors, offer deals, invite you places, collect debts or warn you.
- **The detective.** One random townsperson is secretly a State Bureau investigator, and you're never told who. They keep a case file on you and act on it: tailing you, standing outside your window at night, picking the lock to go through your things, leaving notes, hiding in your wardrobe and waiting for you to come home, questioning your neighbors, checking your story by phone, and finally confronting you. At 100 suspicion they make the arrest. You choose to surrender, run or fight.
- **Finding them.** The detective has two habits (peppermints, a cherry pipe, green ink, a limp…) and leaves traces of them behind. A few innocent people share one habit each. Watch people, ask around, mark suspects in the journal, and accuse someone to their face if you're sure. Being wrong makes you look paranoid, and being right makes you look guilty.
- **Life in town.** Houses you can enter (knock, get invited in, or pick the lock), shops, odd jobs, fishing, darts, blackjack, an arcade game with a high-score table, the Saturday barn dance, a daily Gazette, dates, sweethearts, loans, rent, and a WANTED poster with your face on it from day two.
- **Fights are permanent here.** Anyone you beat doesn't get up. You have to deal with the body: carry it, hide it in a wardrobe, freezer or dumpster, sink it in the pond or bury it, and scrub up the blood. Bodies get found by smell, by the garbage truck on Thursdays, or by someone fishing. People notice who's missing.
- **Guns.** Hartley's sells a hunting rifle and bullets, the sheriff and the detective carry revolvers, and there's a shotgun in the back room of the Rusty Nail. Shots are loud: everyone within earshot remembers.
- **Endings.** Survive to day 12 with the detective unconvinced, talk them into closing the case, catch a train (a fake ID helps), walk out of town, deal with the detective permanently, or get taken back to Cellblock Nine.

## Millbrook in 3D (standalone)

Part two also stands alone as a 3D game: open http://127.0.0.1:3000/millbrook3d.html. It's the same town, cast, detective, conversations, crime and endings, drawn in low-poly 3D with Three.js instead of pixel art.

- Third-person camera you can orbit (drag) and zoom (scroll), or press **V** for first person. WASD moves relative to the camera.
- Buildings have roofs and real interiors. Walk inside and the roof lifts off and the walls cut down so you can see in.
- A day-night cycle with a moving sun and shadows, street lamps and lit windows at night, stars, and rain.
- "Chunky retro pixels" in the pause menu switches between a low-resolution retro look (faster) and a sharp one.

It has its own title screen and its own save. `town3d-src/` holds the 3D renderer and the standalone title screen; `npm run build` combines them with `town-src/` into `public/millbrook3d/`, and copies the shared sound, sprite and icon code out of `public/index.html` into `public/millbrook3d/engine.js`. Three.js r128 is vendored in `public/vendor/` (MIT licence included).

## Millbrook: Hallowmere (Halloween edition)

http://127.0.0.1:3000/millbrook-hallow.html is the 3D Millbrook rebuilt as a medieval village in All Hallows' week, for adults. The rules, the cast and the detective are the same. Everything else changes:

- Timber-framed and stone buildings under thatch and slate, leaded windows with shutters and candles, studded doors, torches on posts and by every shop door, a gallows and a bonfire in the square, a well, a gibbet, skulls on pikes at the edge of town, a graveyard behind iron railings, dead trees, pumpkin fields and scarecrows.
- People wear tunics, belts, boots, cloaks and hoods, with painted faces. After dark some wear masks (skull, plague doctor, goat, porcelain, sack, crow), and a masked stranger shows only "?" until you're close. Every seventh day is All Hallows' Eve: everyone is masked and the moon turns red.
- A sun by day. At night, a huge moon with a face whose eyes follow you. It blinks, and it grins after someone dies.
- A composed retro score (harpsichord, choir, strings, bells, through reverb and delay) and horror sound design: wind, wolves, crows, the midnight bell, whispers.
- Effects: fire and embers, chimney smoke, ground mist, graveyard wisps, falling leaves, bats, crows that scatter, lightning in the rain, blood, film grain.
- Scares: something stands at the edge of the fog and watches you, three knocks at 3 a.m., and sometimes it's right behind you.
- Pause menu: camera sensitivity slider, invert camera, jumpscares on or off, film grain on or off. The sensitivity and invert settings also apply to the plain 3D build.

### The expanded village

Hallowmere's Millbrook is about four times the size of the original town, with 70 villagers:

- **East over the river**: a market with stalls, the Mill (with a turning wheel), the Stables, the Bakehouse, a butcher, chandler, tailor, cobbler, cooper and potter, a second tavern (the Black Lamb), the Watch House with its guards, Ravensworth Manor, and three streets of homes.
- **The Blackwood**: a big, dark forest south of everything, with paths, a stone circle, the hanging tree, a bog, a wolf's den, an abandoned woodcutter's hut, the wise woman's hut and the hunter's lodge. Fog is thicker there, the camera rises above the canopy, eyes watch from between the trees, and the thing in the fog comes by day as well as by night.
- **New trades**: bakers, butchers, millers, manor staff, gate guards, a night watchman, a gravedigger, monks, woodcutters, a hunter, market vendors, a fortune teller, a beggar and more. Each has a workplace and routine; several shops and new odd jobs open up.
- **Distinct voices**: every villager gets their own pitch, timbre and pace. Women are always pitched higher than men.
- **Questlines**: everyone has a three-part story ("Their story" in the talk window): find a lost keepsake somewhere in the village or the Blackwood, fetch something, carry a sealed letter or ask someone a question. Finishing one earns a reward, their loyalty and respect.
- **Respect**: shown under your silver. Solving mysteries and finishing stories raises it, and everyone's opinion of you rises with it.
- **The tavern** (the Hanged Man / Rusty Nail) can be entered again; shelves were blocking the door. This fix applies to every edition.

### Mysteries

- **The Horned Moon**: five villagers are a blood cult that meets at the stone circle at midnight on odd nights. Find a robe, a ledger, the altar dagger or a bone sigil, and show any three to the Reeve (the sheriff). If they learn what you know, from your questions, your snooping or seeing you at the stones, one of them comes for you at night in a red robe.
- **Ashcombe House**: the boarded-up manor at the forest's edge. Inside, a ghost girl appears and vanishes, doors slam and lock, a music box plays, footsteps cross the floor above, and "GET OUT" is written on the floor. Read the diary, find what's behind the nursery wall, take her doll, and lay her to rest at the church altar. Her silver dagger is the reward.
- **The Beast**: every third night one villager becomes a werewolf, breaks into homes and kills. Clues: bloody paw prints leading to its door, an empty bed at night, a bandaged arm the next morning, villagers' half-memories, and wolfsbane (it can't stand it). Name it to the Reeve and it transforms and fights; steel wounds close up, silver doesn't. Name the wrong person and an innocent goes to the gaol.

### More dread (update)

- **The moon** is a fat grinning crescent with one ringed eye that tracks you, a mouth full of teeth, and red drool. It grins wider after a death and turns blood red on bad nights.
- **Bodies stay quiet until someone talks.** Whoever finds a body runs for the sheriff; the town only hears (and the rumors only rise) once they get there. Stop them first, and nobody knows. Witnesses to a killing work the same way. This applies to every edition.
- **Ashcombe House** is now a 32-by-22 manor with a parlour, great hall, study, dining room, the lord's bedroom, the nursery and a family chapel. You can solve it without leaving: lay Elspeth to rest at the chapel altar. Inside, the roof stays on and you see through your own eyes. It's dark, the candles die, portraits have their faces scratched out, dolls hang from the nursery ceiling, and she rushes you out of the dark with a scream. To use a recorded scream, drop it in `public/millbrook3d/` as `scream.mp3` (or `.m4a`, `.wav`, `.ogg`, `.webm`); otherwise a harsh synthesized scream plays.
- **The cult** gathers in a ring around the altar stone. The sigil lights, fire crowns the standing stones, smoke spirals up, and at the height of the rite a horned, winged devil rises out of the ground. If any of them sees you, the whole Circle comes for you; hide in the thickets around the clearing and you can watch unseen, peering over the thorns.
- **The werewolf** is rebuilt: hunched and huge, matted fur, a snarling jaw full of fangs, long clawed arms, digitigrade legs, a tail, glowing eyes, and the rags of whoever it was.
- **Buildings** gained jettied upper storeys with their own windows and shutters, door canopies, lanterns and chimney pots. Roofs between the camera and you get out of the way. **People** are built from rounded shapes with buttons, straps, fingers and patches. The Halloween edition now defaults to sharp rendering with soft shadows ("Chunky retro pixels" is still in the pause menu).

The expansion is in `town3d-src/13-expand.js` (map, trades, shops, items), `14-mysteries.js` (cult, house, beast, questlines, respect, journal page) and `23-mystfx.js` (ghost, tracks, forest atmosphere).

It has its own save. The edition lives in `town3d-src/12-hallow.js` (names, jobs, events, intro), `16-music.js` (score and sound), `18-tex.js` (painted textures), `21-hallow-world.js` (world, people, sky) and `22-fx.js` (effects and scares), plus `hallow.css`. They switch on when the page sets `window.MILLBROOK_HALLOW`; `npm run build` writes `public/millbrook-hallow.html`.

## Part three: Operation Birch

Kill the detective and search the body for their badge, then use it from your pockets. A phone rings in Room C, and the truth comes out: you were a Russian intelligence officer (codename SPARROW) all along, and the escape was the plan. You go back into Cellblock Nine as a new guard on probation, wearing the dead agent's name.

- **Find Birch.** One random inmate is a fellow agent held under a false name. They don't know who you are. Watch for habits (tea from a glass, humming "Kalinka", counting in Russian, Orthodox crosses, Morse on the pipes at night), read the inmate files in the warden's office and censor the mail in the guard room. A few innocent inmates share one habit each.
- **Make contact.** Say "The birch trees are early this year." Birch answers "Only in Leningrad." Say it to the wrong person and they'll talk.
- **Get them out without getting caught.** Your suspicion meter rises when you skip your post, hang around one inmate too much, open cells at night, read files with the warden watching, or get seen passing contraband. Inmates who knew #4471 might recognize you. Two routes: walk Birch out at night in a stolen uniform with a gate key (take the night shift so Kessler goes home, and wait for Dunn's 3 a.m. nap), or forge a transfer order (the warden's stamp, or Ike's steady hand), file it with Dunn and escort Birch to the morning van.
- **The Ask tab** works here too, and fellow guards will take orders from you.

## Part four: Leave No Evidence

Two weeks later you drive back into Millbrook at night with Birch in the passenger seat. Everyone you killed before is still dead, and everyone else remembers you. Kill every last person in town without getting caught, and keep Birch hidden: anyone who sees them panics.

- People who see a killing, a body or Birch run for a phone. If one gets through, the state police are a few hours out. Cut the phone exchange in the post office and smash the sheriff's radio, and they'll try to run for the road or the train instead. If anyone gets out, it's over.
- Sleeping people, and people looking the other way, die without a sound. Guns wake the street. Panic sends everyone home behind locked doors, so you'll need your lockpick.
- When Millbrook is empty, a plane takes you both home to Moscow.

## Settings

Set these as environment variables before `npm start`:

| Variable | Default | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | none | Your Claude API key |
| `MAIN_MODEL` | `claude-opus-5-5` | Model for the game's normal and deep-thinking requests |
| `QUICK_MODEL` | same as `MAIN_MODEL` | Model for everyday conversations. `claude-haiku-5-5` is faster and much cheaper |
| `PORT` | `3000` | Port to serve on |
| `HOST` | `127.0.0.1` | Only your computer can connect. Set `0.0.0.0` to let other devices on your network play, but they will be spending your API credit |
| `MAX_CONCURRENT` | `4` | Most Claude requests running at once |
| `MAX_PER_MINUTE` | `40` | Most Claude requests per minute |

## Cost

Every conversation, every conversation between characters near you, people walking up to you, and the morning twist each make one API call. You pay for these on your Anthropic account. To spend less:

- Set `QUICK_MODEL=claude-haiku-5-5`.
- In the game menu (Esc), turn off "People talk to each other with Claude", "People walk up and start conversations", or "Claude invents a twist each morning".
- Lower `MAX_PER_MINUTE`.

## How it fits together

- `public/index.html` is the prison game: map, characters, combat, crafting, sound and music, all in one file. It shares its engine with phase two through `window.CB9`.
- `town-src/` is phase two (Millbrook), split into parts: map, people, detective, crime, talk, social life, games, UI, cutscenes and the main loop. `npm run build` (run by `npm start`) joins them into `public/town.js`.
- `public/claude-shim.js` gives the game the same `window.claude.use("sample")` call it uses on claude.ai, but sends it to the local server.
- `server.js` serves `public/` and handles `POST /api/sample`. It calls the Claude API with the official SDK, with effort set by tier (`quick` is low, `default` is medium, `complex` is high). Opus and Sonnet requests use server-side refusal fallback (`fallbacks: "default"`), so a falsely flagged request is retried on another model instead of failing.

Saves live in your browser's local storage.

## Controls

| Key | Action |
|---|---|
| WASD / arrows | Walk |
| E / Space | Talk, search, use. Hold to cut, dig, pick locks, work |
| F | Fight with whatever you're holding |
| 1–6 | Pick a pocket slot |
| I · C · J | Inventory · Craft · Journal |
| N · M | Music · All sound |
| Esc | Menu, or leave a conversation |

The talk box has an **Ask…** tab for direct requests: take something to someone, bring you an item, start a fight, watch your back, distract a guard, raid a cell, or go wait somewhere. People say yes or no based on how much they trust you.

In Millbrook, Tab opens the town map, F fires a selected gun, Q puts down a body you're carrying, and the talk box adds Pay, Favor and Accuse buttons.
