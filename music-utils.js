"use strict";

(() => {
  const DEFAULT_VIDEO_ID = "QcEpLwK1XOA";
  const DEFAULT_BPM = 120;
  const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
  const HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);

  /** @param {unknown} value */
  function parseVideoId(value) {
    if (typeof value !== "string") return null;
    const text = value.trim();
    if (VIDEO_ID.test(text)) return text;
    try {
      const url = new URL(text);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
      let id = null;
      if (url.hostname === "youtu.be" || url.hostname === "www.youtu.be") id = url.pathname.split("/")[1];
      else if (HOSTS.has(url.hostname)) {
        if (url.pathname === "/watch") id = url.searchParams.get("v");
        else if (/^\/(embed|shorts|live)\//.test(url.pathname)) id = url.pathname.split("/")[2];
      }
      return id && VIDEO_ID.test(id) ? id : null;
    } catch { return null; }
  }

  /** @param {unknown} value */
  function normalizeBpm(value) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 60 && number <= 200 ? number : DEFAULT_BPM;
  }

  /** @param {string} videoId @param {number} bpm */
  function getShortPath(videoId, bpm = DEFAULT_BPM) {
    if (!VIDEO_ID.test(videoId)) return null;
    const tempo = normalizeBpm(bpm);
    return `/r/n-${videoId}${tempo === DEFAULT_BPM ? "" : `-${tempo}`}`;
  }

  /** @param {string} value */
  function parseShortId(value) {
    const match = /^n-([A-Za-z0-9_-]{11})(?:-(\d{2,3}))?$/.exec(value);
    if (!match) return null;
    const bpm = match[2] ? Number(match[2]) : DEFAULT_BPM;
    if (bpm < 60 || bpm > 200) return null;
    return { videoId: match[1], bpm };
  }

  const api = { DEFAULT_VIDEO_ID, DEFAULT_BPM, parseVideoId, normalizeBpm, getShortPath, parseShortId };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.NoelMusicUtils = api;
})();
