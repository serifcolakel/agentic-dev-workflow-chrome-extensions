const btn = document.getElementById("toggleBtn");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const statusBadge = document.getElementById("statusBadge");
const analyticsDiv = document.getElementById("analytics");

function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function loadAnalytics() {
  const todayKey = getTodayKey();
  const storageKey = `analytics_${todayKey}`;

  chrome.storage.local.get([storageKey], (result) => {
    const analytics = result[storageKey] || {};
    const total = analytics.total || 0;

    if (total > 0) {
      let html = `<div class="analytics-title">📊 Today's Stats</div>`;
      html += `<div class="analytics-total">Total: ${total} scrolls</div>`;
      html += `<div class="analytics-breakdown">`;

      const platformEmojis = {
        youtube: "🎥",
        instagram: "📸",
        tiktok: "🎵",
        facebook: "👥",
        reddit: "🤖",
      };

      Object.keys(analytics).forEach((platform) => {
        if (platform !== "total") {
          const emoji = platformEmojis[platform] || "📱";
          const count = analytics[platform];
          html += `<div class="analytics-item">${emoji} ${platform}: ${count}</div>`;
        }
      });

      html += "</div>";
      analyticsDiv.innerHTML = html;
      analyticsDiv.style.display = "block";
    } else {
      analyticsDiv.style.display = "none";
    }
  });
}

// Kayıtlı durumu kontrol et
chrome.storage.local.get(["enabled"], (result) => {
  const isEnabled = result.enabled !== false; // Varsayılan: Açık
  updateUI(isEnabled);
  loadAnalytics();
});

btn.addEventListener("click", () => {
  chrome.storage.local.get(["enabled"], (result) => {
    const newState = !(result.enabled !== false);
    chrome.storage.local.set({ enabled: newState });
    updateUI(newState);
    // Sayfayı yenilemeden değişikliği yansıtmak için mesaj gönder
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { enabled: newState });
    });
  });
});

function updateUI(isEnabled) {
  // OPEN = kapalı (açmak için tıkla), CLOSE = açık (kapatmak için tıkla)
  btn.textContent = isEnabled ? "CLOSE" : "OPEN";
  btn.className = isEnabled ? "on" : "off";

  // Update status indicators
  statusDot.className = isEnabled ? "status-dot active" : "status-dot inactive";
  statusText.textContent = isEnabled ? "Active" : "Inactive";
  statusBadge.className = isEnabled
    ? "status-badge active"
    : "status-badge inactive";
}
