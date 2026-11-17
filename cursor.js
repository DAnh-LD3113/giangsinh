"use strict";

(() => {
  const desktop = matchMedia("(hover: hover) and (pointer: fine)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const trail = document.createElement("div");
  trail.id = "cursor-trail";
  trail.setAttribute("aria-hidden", "true");
  document.body.appendChild(trail);
  let pending = 0, latest = null, previous = null;
  const enabled = () => desktop.matches && !reduced.matches && !document.hidden;
  const colors = ["#fff5cb", "#ffc45a", "#80eaff", "#d8bbff"];

  function clear() {
    cancelAnimationFrame(pending); pending = 0;
    latest = previous = null; trail.replaceChildren();
  }
  function draw() {
    pending = 0;
    if (!enabled() || !latest) { clear(); return; }
    const from = previous || latest;
    const distance = Math.hypot(latest.x - from.x, latest.y - from.y);
    if (previous && distance < 3) return;
    const count = Math.min(6, Math.max(2, Math.ceil(distance / 12)));
    for (let i = 1; i <= count; i++) {
      const spark = document.createElement("span");
      spark.textContent = Math.random() > .55 ? "✦" : "·";
      spark.style.left = `${from.x + (latest.x - from.x) * i / count}px`;
      spark.style.top = `${from.y + (latest.y - from.y) * i / count}px`;
      spark.style.color = colors[Math.floor(Math.random() * colors.length)];
      spark.style.setProperty("--drift-x", `${(Math.random() - .5) * 36}px`);
      spark.style.setProperty("--drift-y", `${12 + Math.random() * 28}px`);
      spark.addEventListener("animationend", () => spark.remove(), { once: true });
      trail.appendChild(spark);
      if (trail.childElementCount > 48) trail.firstElementChild.remove();
    }
    previous = latest;
  }
  document.addEventListener("pointermove", event => {
    if (event.pointerType !== "mouse" || !enabled()) return;
    latest = { x: event.clientX, y: event.clientY };
    if (!pending) pending = requestAnimationFrame(draw);
  }, { passive: true });
  document.addEventListener("pointerout", event => { if (!event.relatedTarget) clear(); });
  document.addEventListener("visibilitychange", clear);
  window.addEventListener("blur", clear);
  window.addEventListener("pagehide", clear);
  desktop.addEventListener("change", clear);
  reduced.addEventListener("change", clear);
})();
