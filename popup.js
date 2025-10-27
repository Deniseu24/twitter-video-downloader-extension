const $ = (sel) => document.querySelector(sel);
const urlInput = $("#url");
const msg = $("#msg");
const btn = $("#go");

btn.addEventListener("click", async () => {
  msg.textContent = "Working...";
  const raw = urlInput.value.trim();
  if (!raw) { msg.textContent = "Paste a link first."; return; }

  try {
    if (/video\.twimg\.com/.test(raw)) {
      await sendDownload(raw);
      msg.textContent = "Downloading direct video...";
      return;
    }

    const media = await resolveTweetToMedia(raw);
    if (!media?.url) {
      msg.textContent = media?.reason || "No downloadable video found.";
      return;
    }

    await sendDownload(media.url, media.filename);
    msg.textContent = "Downloading...";
  } catch (e) {
    console.error(e);
    msg.textContent = "Error: " + e.message;
  }
});

function sendDownload(url, filename) {
  return chrome.runtime.sendMessage({ type: "DOWNLOAD", url, filename });
}

// // 🟢 Updated to support latest vxtwitter API format (2025)
async function resolveTweetToMedia(tweetUrl) {
  try {
    let cleanUrl = tweetUrl.replace("x.com", "twitter.com");
    if (cleanUrl.includes("/i/status/")) {
      cleanUrl = cleanUrl.replace("/i/status/", "/status/");
    }

    const api = `https://api.vxtwitter.com/${encodeURIComponent(cleanUrl)}`;
    const res = await fetch(api);
    if (!res.ok) return { reason: `API request failed (${res.status})` };

    const data = await res.json();

    // Try new format: data.media_extended or data.mediaURLs
    let videoUrl = null;

    if (data.media_extended && Array.isArray(data.media_extended)) {
      const vid = data.media_extended.find(m => m.type === "video" && m.url);
      if (vid) videoUrl = vid.url;
    }

    // Fallback: older field
    if (!videoUrl && data.media && Array.isArray(data.media)) {
      const vid = data.media.find(m => m.type === "video" && m.url);
      if (vid) videoUrl = vid.url;
    }

    // Fallback: plain mediaURLs field
    if (!videoUrl && data.mediaURLs && Array.isArray(data.mediaURLs)) {
      const vidUrl = data.mediaURLs.find(u => u.includes("video.twimg.com"));
      if (vidUrl) videoUrl = vidUrl;
    }

    if (!videoUrl) {
      console.log("Full API response:", data); // helps debug
      return { reason: "No downloadable video found in this tweet." };
    }

    return {
      url: videoUrl,
      filename: `twitter-video-${data.tweetID || Date.now()}.mp4`
    };
  } catch (err) {
    console.error("API fetch error:", err);
    return { reason: "Failed to reach API." };
  }
}

