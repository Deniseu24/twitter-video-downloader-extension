// content.js
function getDirectVideoUrl() {
  const video = document.querySelector('video');
  if (!video) return { url: null, reason: 'no-video' };

  // Try direct <video src>
  if (video.src && !video.src.startsWith('blob:')) {
    return { url: video.src, reason: 'direct-src' };
  }

  // Try <source>
  const source = video.querySelector('source');
  if (source?.src && !source.src.startsWith('blob:')) {
    return { url: source.src, reason: 'source-src' };
  }

  // Likely HLS / MSE blob
  return { url: null, reason: 'hls-or-blob' };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'GET_VIDEO_URL') {
    const res = getDirectVideoUrl();
    console.log('[Simple X Video Saver] GET_VIDEO_URL ->', res);
    sendResponse(res);
  }
  // Return true only if you respond asynchronously (we respond sync here)
});
