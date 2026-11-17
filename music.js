"use strict";

(() => {
  const utils = window.NoelMusicUtils;
  const byId = id => document.getElementById(id);
  const panel = byId("music-panel"), status = byId("music-status");
  const form = byId("music-form"), error = byId("music-error");
  const shareDialog = byId("share-dialog"), shareUrl = byId("share-url"), shareStatus = byId("share-status");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const spectrum = byId("music-visualizer"), spectrumContext = spectrum.getContext("2d");
  const orb = byId("music-orb"), orbCaption = orb.querySelector(".music-orb-caption");
  let videoId = utils.parseVideoId(params.get("v")) || utils.DEFAULT_VIDEO_ID;
  let bpm = utils.normalizeBpm(params.get("bpm"));
  let player = null, ready = false, apiRequested = false, destroyed = false;
  let active = wantsYouTube, muted = false, playing = false, resumeWhenVisible = false;
  let frame = 0, previousFrame = 0;
  byId("youtube-url").value = `https://www.youtube.com/watch?v=${videoId}`;

  function setLoading(loading, caption = "Đang tải…") {
    const busy = active && loading;
    panel.classList.toggle("is-loading", busy);
    orb.setAttribute("aria-busy", String(busy));
    orbCaption.textContent = busy ? caption : "Đổi nhạc";
  }

  function updateLocation() {
    if (!/^https?:$/.test(location.protocol)) return;
    const query = new URLSearchParams(location.search);
    query.set("v", videoId); query.set("bpm", String(bpm));
    if (active) query.delete("music"); else query.set("music", "original");
    history.replaceState(null, "", `${location.pathname}?${query}${location.hash}`);
  }
  function updatePanel() {
    panel.hidden = !active;
    if (!active) setLoading(false);
    // Keep the editor available when the original soundtrack hides the orb.
    if (!active) setMusicEditor(true);
    document.body.classList.toggle("youtube-active", active);
    updateSoundButton();
    if (!active) { soundHint.textContent = ""; updateSoundHint(); }
  }
  function stopBeat() {
    document.documentElement.style.setProperty("--music-beat", "0");
  }
  function drawSpectrum(time, pulse, animate) {
    const ctx = spectrumContext, size = spectrum.width, center = size / 2, radius = size * .235;
    ctx.clearRect(0, 0, size, size);
    // A decorative radial spectrum driven by playback time and the chosen BPM.
    const clock = animate ? time : 0;
    const anchors = [230, 183, 330, 285, 230];
    for (let i = 0; i < 112; i++) {
      const progress = i / 112, angle = progress * Math.PI * 2 - Math.PI / 2;
      const sector = progress * 4, part = Math.floor(sector);
      const hue = anchors[part] + (anchors[part + 1] - anchors[part]) * (sector - part);
      const wave = (Math.sin(i * 1.73 + clock * 3.2) + Math.sin(i * .41 - clock * 1.7) + 2) / 4;
      const accent = Math.pow((Math.sin(i * 2.39 + clock * .8) + 1) / 2, 6);
      const length = size * (.018 + wave * .055 + accent * .075 + pulse * (.025 + wave * .065));
      const x = Math.cos(angle), y = Math.sin(angle);
      ctx.strokeStyle = `hsl(${hue} 100% 58%)`;
      ctx.globalAlpha = .22;
      ctx.lineWidth = size * .008;
      ctx.beginPath(); ctx.moveTo(center + x * radius, center + y * radius);
      ctx.lineTo(center + x * (radius + length * 1.4), center + y * (radius + length * 1.4)); ctx.stroke();
      ctx.globalAlpha = animate ? .85 + pulse * .15 : .45;
      ctx.lineWidth = size * .005;
      ctx.beginPath(); ctx.moveTo(center + x * radius, center + y * radius);
      ctx.lineTo(center + x * (radius + length), center + y * (radius + length)); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function beat(now) {
    if (destroyed) return;
    if (now - previousFrame >= 1000 / 30) {
      previousFrame = now;
      // YouTube does not expose cross-origin audio samples. Pulse from its clock,
      // using the user's BPM; pause/buffering/mute/reduced motion disable the pulse.
      const animate = active && ready && playing && !muted && !player.isMuted() && player.getVolume() > 0 && !document.hidden && !motion.matches;
      const time = animate ? player.getCurrentTime() : 0;
      const pulse = animate ? Math.exp(-((time * bpm / 60) % 1) * 8) : 0;
      document.documentElement.style.setProperty("--music-beat", pulse.toFixed(3));
      if (active && !document.hidden) drawSpectrum(time, pulse, animate);
    }
    frame = requestAnimationFrame(beat);
  }
  function createPlayer() {
    if (destroyed || player || !window.YT?.Player) return;
    player = new window.YT.Player("youtube-player", {
      width: "100%", height: "200", host: "https://www.youtube-nocookie.com",
      videoId,
      playerVars: { autoplay: active && !tree.paused && !document.hidden ? 1 : 0, playsinline: 1, controls: 1, rel: 0,
        ...(/^https?:$/.test(location.protocol) ? { origin: location.origin } : {}) },
      events: {
        onReady() {
          if (destroyed) return;
          ready = true;
          player.getIframe().title = "Nhạc YouTube cho cây thông Noel";
          player.getIframe().setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
          player.getIframe().setAttribute("tabindex", "-1");
          player.getIframe().setAttribute("aria-hidden", "true");
          if (muted) player.mute(); else player.unMute();
          status.textContent = "";
          if (active && !tree.paused && !document.hidden) { setLoading(true); player.loadVideoById(videoId); }
          else { setLoading(false); player.cueVideoById(videoId); }
        },
        onStateChange(event) {
          if (destroyed) return;
          playing = event.data === 1;
          if (event.data === 3) setLoading(true);
          // Cued/paused can be intermediate states while a new video loads.
          // Keep the spinner until PLAYING, unless playback was explicitly stopped.
          else if (event.data === 1 || tree.paused || document.hidden) setLoading(false);
          if (!active && playing) { player.pauseVideo(); return; }
          if (playing) { status.textContent = ""; soundHint.textContent = ""; }
          else stopBeat();
          if (event.data === 0 && active && !tree.paused && !document.hidden) {
            setLoading(true);
            player.loadVideoById(videoId);
          }
        },
        onAutoplayBlocked() {
          setLoading(true, "Chạm để phát");
          if (active) status.textContent = "Chạm trang để bật nhạc nhé ♫";
        },
        onError(event) {
          setLoading(false);
          playing = false; stopBeat();
          const messages = {
            2: "Link video chưa hợp lệ. Hãy chọn bài khác ở ô YouTube.",
            100: "Video không còn khả dụng. Hãy chọn bài khác ở ô YouTube.",
            101: "Video này không cho phép nhúng. Hãy chọn bài khác hoặc dùng nhạc gốc.",
            150: "Video này không cho phép nhúng. Hãy chọn bài khác hoặc dùng nhạc gốc.",
            153: "YouTube chưa cho phát trên trang này. Hãy thử link khác hoặc dùng nhạc gốc.",
          };
          status.textContent = messages[event.data] || "Chưa phát được YouTube. Bạn có thể chọn nhạc khác hoặc dùng nhạc gốc.";
        },
      },
    });
  }
  function loadApi() {
    setLoading(true);
    if (window.YT?.Player) { createPlayer(); return; }
    if (apiRequested) return;
    apiRequested = true;
    status.textContent = "Đang tải YouTube…";
    window.onYouTubeIframeAPIReady = createPlayer;
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => { setLoading(false); status.textContent = "Không tải được YouTube. Bấm Gốc để dùng nhạc có sẵn."; apiRequested = false; script.remove(); };
    document.head.appendChild(script);
  }
  async function useOriginal() {
    active = false; playing = false; player?.pauseVideo?.(); stopBeat();
    updatePanel(); updateLocation();
    try { await tree.setMuted(false); }
    catch (err) { controls.status.textContent = `Sound could not start: ${err.message}`; }
    updateSoundHint(); updateSoundButton();
  }
  music = {
    get active() { return active; }, get muted() { return muted; },
    toggleSound() {
      muted = !muted;
      if (ready) {
        if (muted) player.mute();
        else { player.unMute(); if (!tree.paused) player.playVideo(); }
      }
      if (muted) stopBeat();
    },
    setPaused(paused) {
      if (!active) return;
      setLoading(!paused);
      if (!ready) return;
      if (paused) player.pauseVideo(); else player.playVideo();
    },
    restart() { if (active && ready) { player.seekTo(0, true); if (tree.paused) player.pauseVideo(); } },
  };
  function setMusicEditor(visible) {
    form.hidden = !visible;
    byId("music-orb").setAttribute("aria-expanded", String(visible));
    if (!visible) error.textContent = "";
  }
  function openMusic() {
    if (active && ready && !playing && !tree.paused) player.playVideo();
    setMusicEditor(form.hidden);
    if (!form.hidden) { byId("youtube-url").focus(); byId("youtube-url").select(); }
  }
  byId("music-orb").addEventListener("click", openMusic);
  // Audible autoplay may be blocked on a first visit. Retry inside the first
  // trusted interaction, without overriding an explicit mute or pause.
  function unlockYouTube(event) {
    if (event.type === "keydown" && (event.repeat || event.ctrlKey || event.metaKey || event.altKey)) return;
    if (event.target.closest("#sound, #play, #restart, input, textarea, select")) return;
    if (active && ready && !playing && !muted && !tree.paused && !document.hidden) {
      player.unMute(); player.playVideo();
    }
  }
  document.addEventListener("pointerdown", unlockYouTube);
  document.addEventListener("keydown", unlockYouTube);
  byId("original-music").addEventListener("click", useOriginal);
  form.addEventListener("submit", event => {
    event.preventDefault();
    const selected = utils.parseVideoId(byId("youtube-url").value);
    if (!selected) { error.textContent = "Dán link YouTube hợp lệ hoặc video ID gồm 11 ký tự nhé."; byId("youtube-url").focus(); return; }
    videoId = selected; bpm = utils.DEFAULT_BPM;
    active = true; muted = false; playing = false; error.textContent = "";
    tree.setMuted(true); tree.setPaused(false);
    byId("youtube-url").value = `https://www.youtube.com/watch?v=${videoId}`;
    updatePanel(); updateLocation();
    setLoading(true);
    if (ready) { player.unMute(); player.loadVideoById(videoId); }
    else loadApi();
  });

  function getShareUrl() {
    const origin = /^https?:$/.test(location.protocol) ? location.origin : "https://vuicoding.me";
    const result = new URL(utils.getShortPath(videoId, bpm), origin);
    for (const [key, limit] of [["message", 84], ["author", 80]]) {
      const value = params.get(key);
      if (value) result.searchParams.set(key, Array.from(value).slice(0, limit).join(""));
    }
    if (!tree.loop) result.searchParams.set("loop", "false");
    if (!active) result.searchParams.set("music", "original");
    return result.href;
  }
  byId("share").addEventListener("click", () => {
    shareUrl.value = getShareUrl(); shareStatus.textContent = ""; shareDialog.showModal();
  });
  byId("copy-share").addEventListener("click", async () => {
    shareUrl.select();
    try {
      await navigator.clipboard.writeText(shareUrl.value);
      shareStatus.textContent = "Đã copy! Gửi chút Noel cho bạn bè thôi 🎄";
    } catch { shareStatus.textContent = "Link đã được chọn. Nhấn giữ hoặc Ctrl/Cmd+C để copy nhé."; }
  });
  if (navigator.share) {
    byId("native-share").hidden = false;
    byId("native-share").addEventListener("click", async () => {
      try { await navigator.share({ title: "Một chút Noel từ Vui Coding", text: "Cây thông này có nhạc dành cho bạn 🎄", url: shareUrl.value }); }
      catch (err) { if (err.name !== "AbortError") shareStatus.textContent = "Hãy dùng nút Copy link để chia sẻ nhé."; }
    });
  }
  for (const modal of [shareDialog]) modal.addEventListener("click", event => {
    if (event.target !== modal) return;
    const rect = modal.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close();
  });
  document.addEventListener("visibilitychange", () => {
    if (!ready || !active) return;
    if (document.hidden) { resumeWhenVisible = player.getPlayerState() === 1; player.pauseVideo(); stopBeat(); }
    else if (resumeWhenVisible) { resumeWhenVisible = false; player.playVideo(); }
  });
  window.addEventListener("pagehide", event => {
    if (event.persisted) return;
    destroyed = true; cancelAnimationFrame(frame); player?.destroy?.();
  });
  updatePanel();
  if (active) { tree.setMuted(true); loadApi(); }
  frame = requestAnimationFrame(beat);
})();
