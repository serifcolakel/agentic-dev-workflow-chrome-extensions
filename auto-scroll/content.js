// Platform detection
function detectPlatform() {
  const hostname = window.location.hostname;
  if (hostname.includes("youtube.com")) return "youtube";
  if (hostname.includes("instagram.com")) return "instagram";
  if (hostname.includes("tiktok.com")) return "tiktok";
  if (hostname.includes("facebook.com")) return "facebook";
  if (hostname.includes("reddit.com")) return "reddit";
  return "unknown";
}

// Platform-specific configurations
const platformConfigs = {
  youtube: {
    videoSelector: "video",
    scrollMethod: "arrow",
    scrollKey: "ArrowDown",
    triggerThreshold: 0.1,
    checkInterval: 100,
    fallbackTimeout: null, // YouTube doesn't need fallback
  },
  instagram: {
    videoSelector: "video",
    scrollMethod: "arrow",
    scrollKey: "ArrowRight",
    triggerThreshold: 0.2,
    checkInterval: 100,
    fallbackTimeout: 5_000, // 5 seconds - scroll if stuck on image or paused video
  },
  tiktok: {
    videoSelector: "video",
    scrollMethod: "scroll",
    scrollKey: "ArrowDown",
    triggerThreshold: 0.1,
    checkInterval: 100,
    fallbackTimeout: null,
  },
  facebook: {
    videoSelector: "video",
    scrollMethod: "arrow",
    scrollKey: "ArrowDown",
    triggerThreshold: 0.2,
    checkInterval: 100,
    fallbackTimeout: 8000, // 8 seconds
  },
  reddit: {
    videoSelector: "video",
    scrollMethod: "arrow",
    scrollKey: "ArrowDown",
    triggerThreshold: 0.2,
    checkInterval: 100,
    fallbackTimeout: null,
  },
};

// State management
let isEnabled = true;
let userInteracting = false;
let interactionTimeout = null;
let lastScrollTime = 0;
let lastVideoSrc = "";
let hasTriggeredScroll = false;
const currentPlatform = detectPlatform();
const config = platformConfigs[currentPlatform] || platformConfigs.youtube;
let contentStartTime = Date.now(); // Track when current content started
let lastContentId = ""; // Track content changes

// Analytics functions
function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

async function incrementScrollCount(platform) {
  const todayKey = getTodayKey();
  const storageKey = `analytics_${todayKey}`;

  chrome.storage.local.get([storageKey], (result) => {
    const analytics = result[storageKey] || {};
    analytics[platform] = (analytics[platform] || 0) + 1;
    analytics.total = (analytics.total || 0) + 1;

    chrome.storage.local.set({ [storageKey]: analytics });
  });
}

// Load settings
chrome.storage.local.get(["enabled"], (result) => {
  isEnabled = result.enabled !== false;
});

// Listen for popup messages
chrome.runtime.onMessage.addListener((request) => {
  isEnabled = request.enabled;
});

// User interaction detection
function handleUserInteraction() {
  userInteracting = true;

  if (interactionTimeout) {
    clearTimeout(interactionTimeout);
  }

  interactionTimeout = setTimeout(() => {
    userInteracting = false;
  }, 1_000);
}

// Event listeners for user interaction
document.addEventListener("wheel", handleUserInteraction, { passive: true });
document.addEventListener("touchstart", handleUserInteraction, {
  passive: true,
});
document.addEventListener("touchmove", handleUserInteraction, {
  passive: true,
});
document.addEventListener("click", handleUserInteraction, { passive: true });

// Scroll trigger function
function triggerScroll() {
  // TikTok-specific scroll logic
  if (currentPlatform === "tiktok") {
    // Try method 1: Find and click next button
    const nextButton =
      document.querySelector('[data-e2e="arrow-right"]') ||
      document.querySelector('[aria-label*="next"]') ||
      document.querySelector('button[aria-label*="Next"]');

    if (nextButton) {
      nextButton.click();
      return;
    }

    // Try method 2: Scroll down
    window.scrollBy({
      top: window.innerHeight,
      behavior: "smooth",
    });
    return;
  }

  // Default arrow key method for other platforms
  const keyCode =
    config.scrollKey === "ArrowDown"
      ? 40
      : config.scrollKey === "ArrowRight"
        ? 39
        : 0;

  const event = new KeyboardEvent("keydown", {
    key: config.scrollKey,
    code: config.scrollKey,
    keyCode: keyCode,
    which: keyCode,
    bubbles: true,
  });
  document.dispatchEvent(event);
}

// Get unique content identifier
function getContentId() {
  // For Instagram, use URL or video src as identifier
  if (currentPlatform === "instagram") {
    const video = document.querySelector(config.videoSelector);
    return video ? video.currentSrc || video.src : window.location.href;
  }
  const video = document.querySelector(config.videoSelector);
  return video ? video.currentSrc || video.src : "";
}

// Toast notification system
function showToast(message) {
  // Don't show toast if extension is disabled
  if (!isEnabled) return;

  // Remove existing toast if any
  const existingToast = document.getElementById("auto-scroll-toast");
  if (existingToast) {
    existingToast.remove();
  }

  // Platform-specific colors
  const platformColors = {
    youtube: { bg: "#FF0000", text: "#FFFFFF" },
    instagram: {
      bg: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
      text: "#FFFFFF",
    },
    tiktok: { bg: "#000000", text: "#FFFFFF" },
    facebook: { bg: "#1877F2", text: "#FFFFFF" },
    reddit: { bg: "#FF4500", text: "#FFFFFF" },
  };

  const colors = platformColors[currentPlatform] || platformColors.youtube;

  // Create toast element
  const toast = document.createElement("div");
  toast.id = "auto-scroll-toast";
  toast.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 12L12 16L8 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>${message}</span>
    </div>
  `;

  // Apply styles
  Object.assign(toast.style, {
    position: "fixed",
    top: "16px",
    left: "16px",
    right: "16px",
    transform: "translateY(-80px)",
    background: colors.bg,
    color: colors.text,
    padding: "14px 20px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    zIndex: "999999",
    opacity: "0",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    pointerEvents: "none",
    backdropFilter: "blur(10px)",
    textAlign: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  });

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  // Animate out and remove
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-80px)";
    setTimeout(() => toast.remove(), 400);
  }, 2000);
}

// Main auto-scroll logic
setInterval(() => {
  if (!isEnabled || userInteracting) return;

  const currentTime = Date.now();
  const video = document.querySelector(config.videoSelector);
  const contentId = getContentId();

  // Detect content change (new post/video)
  if (contentId !== lastContentId) {
    lastContentId = contentId;
    contentStartTime = currentTime;
    hasTriggeredScroll = false;
  }

  // Fallback: If stuck on same content for too long (image or paused video)
  if (
    config.fallbackTimeout &&
    currentTime - contentStartTime > config.fallbackTimeout &&
    !hasTriggeredScroll &&
    currentTime - lastScrollTime > 500
  ) {
    triggerScroll();
    hasTriggeredScroll = true;
    lastScrollTime = currentTime;
    incrementScrollCount(currentPlatform);
    showToast("⏭️ Next content");
    console.log(
      `[${currentPlatform.toUpperCase()}] Fallback scroll: Content timeout (no video or stuck)`,
    );
    return;
  }

  // Normal video-based scroll
  if (!video) return;

  const currentVideoSrc = video.currentSrc || video.src;

  // Reset flag when new video starts
  if (currentVideoSrc !== lastVideoSrc) {
    lastVideoSrc = currentVideoSrc;
    hasTriggeredScroll = false;
  }

  // Trigger scroll when video is about to end
  if (
    !video.paused &&
    video.duration > 0 &&
    video.duration - video.currentTime < config.triggerThreshold &&
    !hasTriggeredScroll &&
    currentTime - lastScrollTime > 500
  ) {
    triggerScroll();

    hasTriggeredScroll = true;
    lastScrollTime = currentTime;
    incrementScrollCount(currentPlatform);
    showToast("▶️ Next video");

    console.log(`[${currentPlatform.toUpperCase()}] Auto Scroll: Next video`);
  }
}, config.checkInterval);
