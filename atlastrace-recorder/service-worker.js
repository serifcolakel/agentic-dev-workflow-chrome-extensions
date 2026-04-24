const STATE_KEY = "atlastrace_state";
const MAX_EVENTS = 5000;

const runtimeState = {
  recording: false,
  session: null,
  latestActionByTab: new Map(),
  requestSignatures: new Set(),
};
let stateLoaded = false;

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return String(hash >>> 0);
}

function requestSignature(event) {
  const raw = [
    event.source || "",
    event.method || "",
    event.url || "",
    String(event.status ?? ""),
    event.contentType || "",
    event.error || "",
    event.requestBody || "",
    event.responseBody || "",
  ].join("|");

  return hashString(raw);
}

function uniqueRequestEvents(requestEvents) {
  const seen = new Set();
  const unique = [];

  requestEvents.forEach((event) => {
    const sig = requestSignature(event);
    if (seen.has(sig)) return;
    seen.add(sig);
    unique.push(event);
  });

  return unique;
}

async function saveState() {
  await chrome.storage.local.set({
    [STATE_KEY]: {
      recording: runtimeState.recording,
      session: runtimeState.session,
    },
  });
}

async function loadState() {
  if (stateLoaded) return;
  const result = await chrome.storage.local.get([STATE_KEY]);
  const state = result[STATE_KEY];
  if (state) {
    runtimeState.recording = Boolean(state.recording);
    runtimeState.session = state.session || null;
  }
  stateLoaded = true;

  runtimeState.requestSignatures.clear();
  if (runtimeState.session?.events?.length) {
    runtimeState.session.events.forEach((event) => {
      if (event.type === "request") {
        runtimeState.requestSignatures.add(requestSignature(event));
      }
    });
  }
}

function addEvent(event) {
  if (!runtimeState.session) return;
  runtimeState.session.events.push(event);
  if (runtimeState.session.events.length > MAX_EVENTS) {
    runtimeState.session.events.shift();
  }
}

function startSession() {
  runtimeState.recording = true;
  runtimeState.latestActionByTab.clear();
  runtimeState.requestSignatures.clear();
  runtimeState.session = {
    id: createId("session"),
    startedAt: nowIso(),
    endedAt: null,
    events: [],
  };
  addEvent({
    id: createId("event"),
    type: "session_start",
    ts: nowIso(),
  });
}

function stopSession() {
  runtimeState.recording = false;
  runtimeState.latestActionByTab.clear();
  if (runtimeState.session) {
    runtimeState.session.endedAt = nowIso();
    addEvent({
      id: createId("event"),
      type: "session_stop",
      ts: nowIso(),
    });
  }
}

function clearSession() {
  runtimeState.latestActionByTab.clear();
  runtimeState.requestSignatures.clear();
  runtimeState.session = null;
}

function shouldLinkAction(tabId, requestStartTs) {
  const action = runtimeState.latestActionByTab.get(tabId);
  if (!action) return null;
  const delta = requestStartTs - action.tsMs;
  if (delta >= 0 && delta <= 5000) {
    return action;
  }
  return null;
}

function markdownForSession(session) {
  if (!session) return "# AtlasTrace Session\n\nNo session recorded.";

  const lines = [];
  const requestEvents = session.events.filter(
    (event) => event.type === "request",
  );
  const uniqueRequests = uniqueRequestEvents(requestEvents);

  lines.push("# AtlasTrace Session Report");
  lines.push("");
  lines.push(`- Session ID: \`${session.id}\``);
  lines.push(`- Started: ${session.startedAt || "unknown"}`);
  lines.push(`- Ended: ${session.endedAt || "in-progress"}`);
  lines.push(`- Total Events: ${session.events.length}`);
  lines.push(`- Total Requests (fetch/xhr): ${requestEvents.length}`);
  lines.push(`- Unique Requests: ${uniqueRequests.length}`);
  lines.push("");
  lines.push("## Timeline");
  lines.push("");

  session.events.forEach((event, index) => {
    const i = index + 1;

    if (event.type === "action") {
      lines.push(
        `${i}. [ACTION] ${event.actionType} on ${event.url} (${event.selector || "no-selector"}) @ ${event.ts}`,
      );
      return;
    }

    if (event.type === "request") {
      const link = event.linkedActionId
        ? ` linked-to=\`${event.linkedActionId}\``
        : "";
      const source = event.source ? ` source=${event.source}` : "";
      const contentType = event.contentType
        ? ` contentType=${event.contentType}`
        : "";
      lines.push(
        `${i}. [REQUEST] ${event.method} ${event.url} status=${event.status || "?"} durationMs=${event.durationMs || "?"}${source}${contentType}${link} @ ${event.ts}`,
      );
      return;
    }

    if (event.type === "navigation") {
      lines.push(`${i}. [NAV] ${event.url} @ ${event.ts}`);
      return;
    }

    if (event.type === "session_start" || event.type === "session_stop") {
      lines.push(`${i}. [${event.type.toUpperCase()}] @ ${event.ts}`);
      return;
    }

    lines.push(`${i}. [${event.type || "unknown"}] @ ${event.ts}`);
  });

  lines.push("");
  lines.push("## Unique Request/Response Bodies");
  lines.push("");

  if (!uniqueRequests.length) {
    lines.push("No fetch/xhr responses captured.");
  } else {
    uniqueRequests.forEach((event, idx) => {
      lines.push(`### ${idx + 1}. ${event.method} ${event.url}`);
      lines.push(`- Source: ${event.source || "unknown"}`);
      lines.push(`- Status: ${event.status ?? "?"}`);
      lines.push(`- Duration: ${event.durationMs ?? "?"}ms`);
      if (event.error) lines.push(`- Error: ${event.error}`);
      if (event.contentType) lines.push(`- Content-Type: ${event.contentType}`);
      lines.push("- Request Body:");
      lines.push("```txt");
      lines.push(event.requestBody || "[empty]");
      lines.push("```");
      lines.push("- Response Body:");
      lines.push("```txt");
      lines.push(event.responseBody || "[empty]");
      lines.push("```");
      lines.push("");
    });
  }

  return lines.join("\n");
}

chrome.runtime.onInstalled.addListener(async () => {
  await loadState();
});

chrome.runtime.onStartup.addListener(async () => {
  await loadState();
});

loadState();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "atlastrace:getState") {
    sendResponse({
      recording: runtimeState.recording,
      hasSession: Boolean(runtimeState.session),
      eventCount: runtimeState.session?.events?.length || 0,
    });
    return;
  }

  if (message?.type === "atlastrace:start") {
    startSession();
    saveState();
    sendResponse({ ok: true });
    return;
  }

  if (message?.type === "atlastrace:stop") {
    stopSession();
    saveState();
    sendResponse({ ok: true });
    return;
  }

  if (message?.type === "atlastrace:clear") {
    clearSession();
    saveState();
    sendResponse({ ok: true });
    return;
  }

  if (message?.type === "atlastrace:export") {
    const markdown = markdownForSession(runtimeState.session);
    const filename = `atlastrace-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.md`;
    sendResponse({ ok: true, markdown, filename });
    return;
  }

  if (message?.type === "atlastrace:event") {
    if (!runtimeState.recording || !runtimeState.session) {
      sendResponse({ ok: false, reason: "not-recording" });
      return;
    }

    const tabId = sender?.tab?.id;
    const event = {
      id: createId("event"),
      ...message.payload,
      tabId,
    };

    if (event.type === "request" && typeof tabId === "number") {
      const requestTs = Date.parse(event.ts) || Date.now();
      const action = shouldLinkAction(tabId, requestTs);
      event.linkedActionId = action?.eventId || null;

      const sig = requestSignature(event);
      if (runtimeState.requestSignatures.has(sig)) {
        sendResponse({ ok: true, duplicate: true });
        return;
      }
      runtimeState.requestSignatures.add(sig);
    }

    addEvent(event);

    if (event.type === "action" && typeof tabId === "number") {
      runtimeState.latestActionByTab.set(tabId, {
        eventId: event.id,
        tsMs: Date.parse(event.ts) || Date.now(),
      });
    }

    saveState();
    sendResponse({ ok: true });
  }
});
