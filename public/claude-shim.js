// Gives the game the same `window.claude.use("sample")` call it has on claude.ai,
// but routes it through the local server (/api/sample), which holds your API key.
(function () {
  if (window.claude && window.claude.use) return; // already inside a Claude viewer

  async function call(input, opts, json) {
    opts = opts || {};
    let res;
    try {
      res = await fetch("/api/sample", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input, modelTier: opts.modelTier || "default", json: !!json }),
        signal: opts.signal,
      });
    } catch (e) {
      throw { code: e && e.name === "AbortError" ? "cancelled" : "upstream_error", message: String((e && e.message) || e) };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { code: data.code || "upstream_error", message: data.message || res.statusText };
    if (typeof opts.onText === "function") { try { opts.onText({ text: data.text, delta: data.text }); } catch (e) { console.error(e); } }
    return data;
  }

  // Same tolerant reading as claude.ai: the whole reply, else a code fence, else first { or [ to last } or ].
  function parseLoose(text) {
    const tryParse = (s) => { try { return { ok: true, v: JSON.parse(s) }; } catch { return { ok: false }; } };
    let r = tryParse(text.trim());
    if (r.ok) return r;
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) { r = tryParse(fence[1].trim()); if (r.ok) return r; }
    const start = text.search(/[{[]/);
    const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
    if (start >= 0 && end > start) { r = tryParse(text.slice(start, end + 1)); if (r.ok) return r; }
    return { ok: false };
  }

  async function sample(input, opts) {
    const d = await call(input, opts, false);
    return { text: d.text, truncated: !!d.truncated, modelTierApplied: d.modelTierApplied || "default" };
  }
  sample.json = async function (input, opts) {
    const d = await call(input, opts, true);
    if (d.truncated) throw { code: "invalid_json", message: "Reply was cut short.", text: d.text };
    const r = parseLoose(d.text);
    if (!r.ok) throw { code: "invalid_json", message: "Reply held no JSON.", text: d.text };
    return r.v;
  };
  sample.limits = async function () { return { maxPromptBytes: 262144 }; };

  window.claude = { use: async (name) => (name === "sample" ? sample : null) };
})();
