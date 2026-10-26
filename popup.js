// The popup is the whole interface: one slider for the active tab.
const api = typeof browser !== "undefined" ? browser : chrome;
const slider = document.getElementById("gain");
const value = document.getElementById("value");
const note = document.getElementById("note");
let tabId = null;

function show(percent) { value.textContent = `${Math.round(percent)}%`; slider.value = String(Math.round(percent)); }

// Firefox grants a site only when you click the icon (activeTab), so the
// content script is injected on demand; the guard inside it makes a second
// injection a no-op.
let injected = false;
async function inject() {
  if (injected || tabId == null) return;
  try { await api.scripting.executeScript({ target: { tabId, allFrames: true }, files: ["content.js"] }); } catch { /* chrome:// and the like */ }
  injected = true;
}

async function tell(message) {
  if (tabId == null) return null;
  await inject();
  try {
    return await api.tabs.sendMessage(tabId, { luider: 1, ...message });
  } catch (e) {
    note.textContent = "This page cannot be boosted here (browser pages and some stores are off limits).";
    return null;
  }
}

async function badge(percent) {
  const text = percent === 100 ? "" : `${Math.round(percent)}`;
  try {
    await api.action.setBadgeText({ tabId, text });
    await api.action.setBadgeBackgroundColor({ tabId, color: percent > 100 ? "#c0392b" : "#555" });
  } catch { /* an older browser without a badge is fine */ }
}

async function set(percent) {
  show(percent);
  const result = await tell({ type: "set", gain: percent / 100 });
  if (!result) return;
  await badge(percent);
  if (result.elements === 0) note.textContent = "No sound on this page yet. The boost applies when something plays.";
  else if (result.skipped) note.textContent = `${result.skipped} player(s) come from another site and are left alone.`;
  else note.textContent = percent > 100 ? "Boosting. Loud is loud: mind your ears." : "";
}

slider.addEventListener("input", () => set(Number(slider.value)));
for (const button of document.querySelectorAll("button[data-gain]")) {
  button.addEventListener("click", () => set(Number(button.dataset.gain)));
}

(async () => {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  tabId = tab.id;
  const current = await tell({ type: "get" });
  if (current) show(current.gain * 100);
})();
