function nowIso() {
  return new Date().toISOString();
}

function sendEvent(payload) {
  chrome.runtime.sendMessage({
    type: "atlastrace:event",
    payload,
  });
}

function injectRecorderScript() {
  if (window.__atlasTraceBridgeReady) return;
  window.__atlasTraceBridgeReady = true;

  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.async = false;
  (document.documentElement || document.head).appendChild(script);
  script.onload = () => script.remove();
}

function cssPath(element) {
  if (!element || !element.tagName) return "";
  if (element.id) return `#${element.id}`;

  const parts = [];
  let node = element;

  while (node && node.nodeType === Node.ELEMENT_NODE && parts.length < 4) {
    let selector = node.tagName.toLowerCase();

    if (node.classList && node.classList.length) {
      selector += `.${Array.from(node.classList).slice(0, 2).join(".")}`;
    }

    const parent = node.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === node.tagName
      );
      if (siblings.length > 1) {
        selector += `:nth-of-type(${siblings.indexOf(node) + 1})`;
      }
    }

    parts.unshift(selector);
    node = parent;
  }

  return parts.join(" > ");
}

function trackNavigation() {
  sendEvent({
    type: "navigation",
    ts: nowIso(),
    url: window.location.href,
    title: document.title || "",
  });
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.source !== "atlastrace_injected") return;
  if (data.type !== "ATLASTRACE_NETWORK") return;

  const payload = data.payload || {};
  sendEvent({
    type: "request",
    source: payload.source || "unknown",
    ts: payload.ts || nowIso(),
    url: payload.url || window.location.href,
    method: payload.method || "GET",
    status: payload.status ?? null,
    durationMs: payload.durationMs ?? null,
    contentType: payload.contentType || "",
    error: payload.error || null,
    requestBody: payload.requestBody || "",
    responseBody: payload.responseBody || "",
  });
});

document.addEventListener(
  "click",
  (event) => {
    const target = event.target;
    const element = target instanceof Element ? target : null;

    sendEvent({
      type: "action",
      actionType: "click",
      ts: nowIso(),
      url: window.location.href,
      selector: cssPath(element),
      text: element?.textContent?.trim().slice(0, 120) || "",
    });
  },
  true
);

document.addEventListener(
  "change",
  (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const tag = target.tagName.toLowerCase();
    if (!["input", "select", "textarea"].includes(tag)) return;

    sendEvent({
      type: "action",
      actionType: "input_change",
      ts: nowIso(),
      url: window.location.href,
      selector: cssPath(target),
      fieldType: tag,
    });
  },
  true
);

window.addEventListener("popstate", trackNavigation);
window.addEventListener("hashchange", trackNavigation);

const pushState = history.pushState;
history.pushState = function patchedPushState(...args) {
  const result = pushState.apply(this, args);
  trackNavigation();
  return result;
};

const replaceState = history.replaceState;
history.replaceState = function patchedReplaceState(...args) {
  const result = replaceState.apply(this, args);
  trackNavigation();
  return result;
};

injectRecorderScript();
trackNavigation();
