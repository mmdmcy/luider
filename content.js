// Luider: boosts the sound of every <audio> and <video> on the page through a
// Web Audio gain node. Nothing is touched until a boost above 100% is asked,
// so a page sounds exactly as before by default. Fullscreen, controls and the
// page's own scripts are untouched: the elements stay where they are; only
// their sound is routed through the gain.
(() => {
  if (window.__luider) return;
  const state = { gain: 1, ctx: null, nodes: new Map(), observer: null };
  window.__luider = state;

  const api = typeof browser !== "undefined" ? browser : chrome;
  const host = location.hostname || "file";

  function sameOrigin(el) {
    // A cross-origin source without CORS would play silence through Web Audio;
    // such a player is left alone and reported.
    const src = el.currentSrc || el.src;
    if (!src || src.startsWith("blob:") || src.startsWith("data:")) return true;
    try { return new URL(src, location.href).origin === location.origin || !!el.crossOrigin; } catch { return true; }
  }

  function attach(el) {
    if (state.nodes.has(el)) return true;
    if (!sameOrigin(el)) return false;
    if (!state.ctx) state.ctx = new (window.AudioContext || window.webkitAudioContext)();
    try {
      const source = state.ctx.createMediaElementSource(el);
      const gain = state.ctx.createGain();
      gain.gain.value = state.gain;
      source.connect(gain).connect(state.ctx.destination);
      state.nodes.set(el, gain);
      return true;
    } catch (e) {
      return false;
    }
  }

  function media() { return Array.from(document.querySelectorAll("audio, video")); }

  function apply(gain) {
    state.gain = Math.min(6, Math.max(0.1, Number(gain) || 1));
    let attached = 0, skipped = 0;
    if (state.gain === 1 && state.nodes.size === 0) return { gain: 1, attached: 0, skipped: 0, elements: media().length };
    for (const el of media()) { attach(el) ? attached++ : skipped++; }
    for (const g of state.nodes.values()) g.gain.setTargetAtTime(state.gain, state.ctx.currentTime, 0.02);
    if (state.ctx && state.ctx.state === "suspended") state.ctx.resume().catch(() => {});
    if (!state.observer) {
      state.observer = new MutationObserver(() => { for (const el of media()) attach(el); });
      state.observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    return { gain: state.gain, attached, skipped, elements: media().length };
  }

  api.runtime.onMessage.addListener((msg, sender, reply) => {
    if (!msg || msg.luider !== 1) return;
    if (msg.type === "get") { reply({ gain: state.gain, elements: media().length, attached: state.nodes.size }); return; }
    if (msg.type === "set") {
      const result = apply(msg.gain);
      api.storage.local.set({ [host]: state.gain }).catch?.(() => {});
      reply(result);
    }
  });

  // A boost remembered for this site comes back on the next visit, but only
  // once the page has sound and the person has interacted (autoplay rules).
  api.storage.local.get(host).then?.((saved) => {
    const remembered = saved && saved[host];
    if (!remembered || remembered === 1) return;
    const once = () => { apply(remembered); document.removeEventListener("pointerdown", once, true); document.removeEventListener("keydown", once, true); };
    document.addEventListener("pointerdown", once, true);
    document.addEventListener("keydown", once, true);
  });
})();
