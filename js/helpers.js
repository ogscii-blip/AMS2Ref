/* =========================================================
   Helpers & Cached State
   ========================================================= */

/* -----------------------------
   Helpers & Cached State
   ----------------------------- */
const CACHE = {
  tracksMap: null,
  carsMap: null,
  setupArray: null,
  roundDataArray: null,
  leaderboardArray: null
};

function toArray(obj) {
  if (!obj) return [];
  return Array.isArray(obj) ? obj : Object.values(obj);
}

function normalizePhotoUrl(url) {
  if (!url) return '';
  if (url.includes('drive.google.com/uc?id=')) {
    const fileId = url.split('id=')[1];
    return `https://lh3.googleusercontent.com/d/${fileId}=s200`;
  }
  return url;
}

function safeGet(fn, fallback = '') {
  try { return fn(); } catch { return fallback; }
}

// format seconds into MM:SS,mmm safe with non-numeric values
function formatTime(seconds) {
  if (seconds === undefined || seconds === null || seconds === '') return '';
  const totalSeconds = parseFloat(seconds);
  if (!isFinite(totalSeconds)) return '';
  const minutes = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds % 1) * 1000);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const ms = String(milliseconds).padStart(3, '0');

  return `${mm}:${ss},${ms}`;
}

function timeToSeconds(timeStr) {
  if (!timeStr) return 0;
  // Expect MM:SS,mmm
  const parts = String(timeStr).split(':');
  if (parts.length < 2) return parseFloat(timeStr) || 0;
  const minutes = parseInt(parts[0]) || 0;
  const secondsParts = parts[1].split(',');
  const seconds = parseInt(secondsParts[0]) || 0;
  const milliseconds = parseInt(secondsParts[1]) || 0;
  return minutes * 60 + seconds + milliseconds / 1000;
}

function encodeKey(name) {
  // safe firebase key from username: replace '.' and '/' with '_' etc.
  return String(name).replace(/[.#$\[\]/]/g, '_');
}

