const recordingState = document.getElementById("recordingState");
const eventCount = document.getElementById("eventCount");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const exportBtn = document.getElementById("exportBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");

function sendMessage(type) {
  return chrome.runtime.sendMessage({ type });
}

function downloadMarkdown(filename, markdown) {
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download(
    {
      url,
      filename,
      saveAs: true,
    },
    () => {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  );
}

async function refreshState() {
  const state = await sendMessage("atlastrace:getState");
  const isRecording = Boolean(state.recording);

  recordingState.textContent = isRecording ? "Yes" : "No";
  recordingState.style.color = isRecording ? "#22c55e" : "#f97316";
  eventCount.textContent = String(state.eventCount || 0);

  startBtn.disabled = isRecording;
  stopBtn.disabled = !isRecording;
  exportBtn.disabled = !state.hasSession;
  copyBtn.disabled = !state.hasSession;
  clearBtn.disabled = !state.hasSession;
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function flashButtonText(button, text, delayMs = 1200) {
  const previous = button.textContent;
  button.textContent = text;
  setTimeout(() => {
    button.textContent = previous;
  }, delayMs);
}

startBtn.addEventListener("click", async () => {
  await sendMessage("atlastrace:start");
  await refreshState();
});

stopBtn.addEventListener("click", async () => {
  await sendMessage("atlastrace:stop");
  await refreshState();
});

exportBtn.addEventListener("click", async () => {
  const result = await sendMessage("atlastrace:export");
  if (result?.ok) {
    downloadMarkdown(result.filename, result.markdown);
  }
});

copyBtn.addEventListener("click", async () => {
  const result = await sendMessage("atlastrace:export");
  if (!result?.ok) return;

  try {
    await copyToClipboard(result.markdown || "");
    flashButtonText(copyBtn, "Copied");
  } catch (error) {
    flashButtonText(copyBtn, "Copy Failed");
  }
});

clearBtn.addEventListener("click", async () => {
  await sendMessage("atlastrace:clear");
  await refreshState();
});

refreshState();
