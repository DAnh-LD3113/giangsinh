"use strict";

(() => {
  const badge = document.getElementById("online-count");
  let client = null, channel = null, disposed = false, retry = 0, generation = 0;
  let controller = null;
  const storageKey = "vuicoding-noel-visitor";
  let visitorId = crypto.randomUUID();
  try {
    const saved = localStorage.getItem(storageKey);
    if (/^[0-9a-f-]{36}$/i.test(saved || "")) visitorId = saved;
    else localStorage.setItem(storageKey, visitorId);
  } catch { /* A private browsing session still gets one anonymous character. */ }

  function clear(message) {
    badge.textContent = message;
    badge.dataset.connected = "false";
    tree.setVisitors([], visitorId);
  }
  function sync() {
    if (disposed || !channel) return;
    const ids = Object.keys(channel.presenceState()).filter(id => /^[0-9a-f-]{36}$/i.test(id)).sort();
    badge.textContent = `${ids.length.toLocaleString("vi-VN")} đang xem`;
    badge.dataset.connected = "true";
    tree.setVisitors(ids, visitorId);
  }
  function reconnect() {
    generation++;
    client?.disconnect(); client = null; channel = null;
    clearTimeout(retry); retry = window.setTimeout(connect, 10000);
  }
  async function connect() {
    if (disposed || client) return;
    if (!/^https?:$/.test(location.protocol)) { clear("Chế độ offline"); return; }
    const attempt = ++generation;
    clear("Đang kết nối…");
    controller = new AbortController();
    try {
      const response = await fetch("/api/noel/presence", { signal: controller.signal });
      if (!response.ok) throw new Error("Presence unavailable");
      const config = await response.json();
      if (disposed || attempt !== generation) return;
      const endpoint = new URL("/realtime/v1", config.url);
      endpoint.protocol = endpoint.protocol === "https:" ? "wss:" : "ws:";
      client = new window.NoelRealtimeClient(endpoint.href, {
        params: { apikey: config.key },
        accessToken: async () => config.key,
      });
      channel = client.channel("noel-online-v1", { config: { presence: { key: visitorId } } });
      channel.on("presence", { event: "sync" }, sync).subscribe(async status => {
        if (disposed || attempt !== generation) return;
        if (status === "SUBSCRIBED") {
          const result = await channel.track({ page: "noel" });
          if (disposed || attempt !== generation) return;
          if (result === "ok") sync();
          else { clear("Đang kết nối lại…"); reconnect(); }
        } else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
          clear("Đang kết nối lại…"); reconnect();
        }
      });
    } catch {
      if (disposed || attempt !== generation) return;
      clear("Chưa kết nối");
      retry = window.setTimeout(connect, 10000);
    }
  }
  function disconnect() {
    disposed = true; generation++;
    clearTimeout(retry); controller?.abort();
    if (channel) void channel.untrack();
    client?.disconnect(); channel = null; client = null;
  }
  window.addEventListener("pagehide", disconnect);
  window.addEventListener("pageshow", event => {
    if (event.persisted) { disposed = false; void connect(); }
  });
  window.addEventListener("offline", () => clear("Mất kết nối"));
  window.addEventListener("online", () => { if (!client) { clearTimeout(retry); void connect(); } });
  void connect();
})();
