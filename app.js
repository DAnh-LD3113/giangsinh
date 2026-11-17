"use strict";

// Return from the embedded page to this site's homepage; keep the public URL offline.
if (location.protocol === "http:" || location.protocol === "https:") {
  document.getElementById("home-link").href = "/";
}

const controls = Object.fromEntries(["play", "restart", "sound", "save", "loop", "seek", "time", "status"].map(id => [id, document.getElementById(id)]));
const coffeeDialog = document.getElementById("coffee-dialog");
document.getElementById("coffee").addEventListener("click", () => coffeeDialog.showModal());
coffeeDialog.addEventListener("click", event => {
  if (event.target !== coffeeDialog) return;
  const bounds = coffeeDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) coffeeDialog.close();
});
const params = new URLSearchParams(location.search);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const wantsYouTube = params.get("music") !== "original";
let music = null;
function updateSoundButton(muted = tree.muted) {
  const isMuted = music?.active ? music.muted : wantsYouTube && !music ? false : muted;
  controls.sound.textContent = isMuted ? "Sound off" : "Sound on";
  controls.sound.setAttribute("aria-pressed", String(!isMuted));
}
const tree = new window.ChristmasTree(document.getElementById("tree"), {
  zoom: 1.12,
  fullWidth: true,
  message: params.get("message") ?? undefined,
  author: params.get("author") ?? undefined,
  loop: params.get("loop") !== "false",
  paused: reducedMotion,
  onUpdate({ time, paused, muted }) {
    controls.seek.value = time;
    controls.time.value = `${time.toFixed(1)} / 20.0s`;
    controls.play.textContent = paused ? "Play" : "Pause";
    updateSoundButton(muted);
  },
});
controls.loop.checked = tree.loop;
if (reducedMotion) tree.seek(20);

const soundHint = document.getElementById("sound-hint");
function updateSoundHint() {
  if (music?.active || wantsYouTube && !music) return;
  soundHint.textContent = !tree.muted && tree.sound.context?.state === "suspended"
    ? "Sound is on. Tap the page or press a key to start the music."
    : "";
}
// Try autoplay, then resume the same context on a user gesture if it is blocked.
// Do not disable the sound button while the browser waits for that gesture.
if (!wantsYouTube) tree.setMuted(false).catch(error => {
  controls.status.textContent = `Sound could not start: ${error.message}`;
}).finally(updateSoundHint);
tree.sound.context?.addEventListener("statechange", updateSoundHint);
updateSoundHint();
function unlockSound(event) {
  if (event.target.closest("#sound") || tree.muted || tree.sound.context?.state !== "suspended") return;
  tree.sound.context.resume().catch(() => {});
}
document.addEventListener("pointerdown", unlockSound);
document.addEventListener("keydown", unlockSound);

controls.play.addEventListener("click", () => { tree.setPaused(!tree.paused); music?.setPaused(tree.paused); });
controls.restart.addEventListener("click", () => { tree.seek(0); music?.restart(); });
controls.seek.addEventListener("input", () => tree.seek(Number(controls.seek.value)));
controls.loop.addEventListener("change", () => tree.setLoop(controls.loop.checked));
controls.save.addEventListener("click", () => tree.savePNG());
controls.sound.addEventListener("click", async () => {
  if (music?.active) { music.toggleSound(); updateSoundButton(); return; }
  controls.sound.disabled = true;
  controls.status.textContent = "";
  try { await tree.setMuted(!tree.muted); }
  catch (error) { controls.status.textContent = `Sound could not start: ${error.message}`; }
  finally { controls.sound.disabled = false; updateSoundHint(); }
});

document.addEventListener("keydown", event => {
  if (document.querySelector("dialog[open]") || event.ctrlKey || event.metaKey || event.altKey || event.target.closest("a, input, button, textarea, select, [contenteditable]")) return;
  switch (event.key.toLowerCase()) {
    case " ": event.preventDefault(); controls.play.click(); break;
    case "r": controls.restart.click(); break;
    case "arrowleft": event.preventDefault(); tree.seek(tree.currentTime() - 1); break;
    case "arrowright": event.preventDefault(); tree.seek(tree.currentTime() + 1); break;
    case "s": tree.savePNG(); break;
    case "m": controls.sound.click(); break;
  }
});
// Pause hidden tabs so the animation and soundtrack stay together on return.
let resumeWhenVisible = false;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { resumeWhenVisible = !tree.paused; tree.setPaused(true); }
  else if (resumeWhenVisible) { resumeWhenVisible = false; tree.setPaused(false); }
});
window.addEventListener("pagehide", event => { if (!event.persisted) tree.destroy(); });
