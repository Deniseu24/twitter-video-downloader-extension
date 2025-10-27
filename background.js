chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
  if (msg?.type === "DOWNLOAD" && msg.url) {
    chrome.downloads.download({
      url: msg.url,
      filename: msg.filename || defaultName(msg.url),
      saveAs: true
    }).catch(err => {
      console.error("Download failed:", err);
    });
  }
});

function defaultName(u) {
  try {
    const url = new URL(u);
    const base = url.pathname.split("/").pop() || "video";
    return base.includes(".") ? base : base + ".mp4";
  } catch {
    return "twitter-video.mp4";
  }
}
