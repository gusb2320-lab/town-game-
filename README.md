# Cellblock Nine

An 8-bit prison-escape game in the style of The Escapists. All 17 inmates and guards are voiced by Claude. They remember everything you say, keep relationships with each other, trade, gossip, fight, and act on what you ask them to do.

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

- `public/index.html` is the whole game: map, characters, combat, crafting, sound and music, all in one file.
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
