// Cellblock Nine local server.
// Serves the game from ./public and forwards the game's "ask Claude" calls to the
// Claude API, so your API key stays on your machine and never reaches the browser.

import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(here, "public");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const MAIN_MODEL = process.env.MAIN_MODEL || "claude-opus-5-5";
const QUICK_MODEL = process.env.QUICK_MODEL || MAIN_MODEL;
const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT || 4);
const MAX_PER_MINUTE = Number(process.env.MAX_PER_MINUTE || 40);
const MAX_INPUT_BYTES = 256 * 1024;

// The game asks for one of three tiers. Conversations use "quick" so replies come back fast.
const TIERS = {
  quick: { model: QUICK_MODEL, effort: "low" },
  default: { model: MAIN_MODEL, effort: "medium" },
  complex: { model: MAIN_MODEL, effort: "high" },
};

// Credentials come from ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, or an `ant auth login` profile.
const client = new Anthropic();

const JSON_SYSTEM =
  "Your reply is read by a program. Reply with only the JSON value the prompt asks for: no prose before or after it, no code fences.";

// Server-side refusal fallback is available on these model families (not on Haiku).
const supportsFallback = (model) => /^claude-(opus-5|sonnet-5-5|fable-5)/.test(model);

function toMessages(input) {
  if (typeof input === "string") {
    if (!input.trim()) return null;
    return [{ role: "user", content: input }];
  }
  if (!Array.isArray(input) || !input.length) return null;
  const turns = [];
  for (const t of input) {
    if (!t || (t.role !== "user" && t.role !== "assistant") || typeof t.content !== "string" || !t.content.trim()) return null;
    const prev = turns[turns.length - 1];
    if (prev && prev.role === t.role) prev.content += "\n\n" + t.content;
    else turns.push({ role: t.role, content: t.content });
  }
  if (turns[0].role !== "user" || turns[turns.length - 1].role !== "user") return null;
  return turns;
}

async function askClaude({ input, modelTier, json }) {
  const tier = TIERS[modelTier] || TIERS.default;
  const messages = toMessages(input);
  if (!messages) return { status: 400, body: { code: "invalid_request", message: "input must be a prompt string or user/assistant turns ending on a user turn" } };

  const params = {
    model: tier.model,
    max_tokens: 16000,
    output_config: { effort: tier.effort },
    messages,
    ...(json ? { system: JSON_SYSTEM } : {}),
  };
  const response = supportsFallback(tier.model)
    ? await client.beta.messages.create({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" })
    : await client.messages.create(params);

  if (response.stop_reason === "refusal") {
    return { status: 422, body: { code: "refused", message: response.stop_details?.explanation || "Claude declined this request." } };
  }
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  if (!text) return { status: 502, body: { code: "empty_completion", message: "Claude returned no text." } };
  return { status: 200, body: { text, truncated: response.stop_reason === "max_tokens", modelTierApplied: modelTier in TIERS ? modelTier : "default" } };
}

function errorReply(err) {
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return { status: 503, body: { code: "sampling_disabled", message: "The server's Claude credentials were rejected. Check ANTHROPIC_API_KEY." } };
  }
  if (err instanceof Anthropic.RateLimitError) return { status: 429, body: { code: "rate_limited", message: "Claude is rate limited. Try again in a minute." } };
  if (err instanceof Anthropic.BadRequestError) return { status: 400, body: { code: "invalid_request", message: err.message } };
  if (err instanceof Anthropic.APIError) return { status: 502, body: { code: "upstream_error", message: err.message } };
  if (/api key|apiKey|authToken|credentials/i.test(String(err && err.message))) {
    return { status: 503, body: { code: "sampling_disabled", message: "No Claude credentials. Set ANTHROPIC_API_KEY and restart the server." } };
  }
  return { status: 502, body: { code: "upstream_error", message: String((err && err.message) || err) } };
}

// Simple guards so a runaway page can't spend your whole budget.
let inFlight = 0;
let windowStart = Date.now();
let windowCount = 0;
function admit() {
  const now = Date.now();
  if (now - windowStart > 60_000) { windowStart = now; windowCount = 0; }
  if (inFlight >= MAX_CONCURRENT || windowCount >= MAX_PER_MINUTE) return false;
  inFlight++; windowCount++;
  return true;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_INPUT_BYTES + 4096) { reject(Object.assign(new Error("too large"), { code: "prompt_too_large" })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/api/sample" && req.method === "POST") {
    let payload;
    try { payload = JSON.parse(await readBody(req)); }
    catch (e) { return send(res, e.code === "prompt_too_large" ? 413 : 400, { code: e.code === "prompt_too_large" ? "prompt_too_large" : "invalid_request", message: "Bad request body." }); }
    if (!admit()) return send(res, 429, { code: "rate_limited", message: "Too many requests to Claude at once. Try again shortly." });
    try {
      const out = await askClaude(payload || {});
      send(res, out.status, out.body);
    } catch (err) {
      const out = errorReply(err);
      if (out.status >= 500) console.error("[claude]", out.body.message);
      send(res, out.status, out.body);
    } finally {
      inFlight--;
    }
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { message: "Method not allowed" });

  const rel = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, "Forbidden", "text/plain");
  try {
    const data = await readFile(file);
    send(res, 200, data, TYPES[path.extname(file)] || "application/octet-stream");
  } catch {
    send(res, 404, "Not found", "text/plain");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Cellblock Nine is running at http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
  console.log(`Models: ${MAIN_MODEL} (default), ${QUICK_MODEL} (quick conversations)`);
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.log("No ANTHROPIC_API_KEY set. If you haven't run `ant auth login`, characters will fall back to stock lines.");
  }
});
