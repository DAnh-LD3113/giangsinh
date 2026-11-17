/* Browser port of christmas_tree.py. No dependencies or build step required. */
"use strict";

(() => {
  const TAU = Math.PI * 2;
  const DURATION = 20, GROUND = -1.12, Y0 = -0.76, Y1 = 1.24;
  const COLS = 88, ROWS = 74, CW = 9, CH = 14, ASPECT = CW / CH;
  const NEEDLE = 0, SNOW = 1, CONE = 2, TRUNK = 3, TINSEL = 4;
  const BALL = 5, LIGHT = 6, GIFT = 7, RIBBON = 8;
  const GOLD = [1, .84, .28], RED = [.96, .20, .24], SILVER = [.86, .90, .98];
  const WHITE = [1, 1, 1], GREEN = [.18, .78, .34], BLUE = [.22, .48, .98];
  const RAMP = " .,:;-~=+*^oxv%&#W@";
  const STRIDE = 17;
  const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
  const smooth = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
  const mod = (x, n) => ((x % n) + n) % n;
  const envelope = y => {
    const u = clamp((y - Y0) / (Y1 - Y0));
    return .96 * (1 - u) ** .9 * (1 + .07 * Math.sin(u * TAU * 5) * (1 - u));
  };
  const growTime = y => .7 + 4.9 * clamp((y - GROUND) / (Y1 - GROUND));

  // Seeded randomness keeps the geometry and snow identical on every replay.
  class Random {
    constructor(seed) { this.seed = seed; }
    next() {
      let t = this.seed = (this.seed + 0x6D2B79F5) | 0;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    range(a, b) { return a + (b - a) * this.next(); }
    normal() { return Math.sqrt(-2 * Math.log(Math.max(1e-9, this.next()))) * Math.cos(TAU * this.next()); }
  }

  function sphere(count) {
    return Array.from({ length: count }, (_, i) => {
      const y = 1 - 2 * (i + .5) / count, r = Math.sqrt(1 - y * y), phi = (i + .5) * 2.39996323;
      return [Math.cos(phi) * r, y, Math.sin(phi) * r];
    });
  }

  function buildScene() {
    const rng = new Random(7), data = [], tips = [];
    function add(p, n, color, kind, start, base = 1, center = p, phase = 0, pop = false) {
      const len = Math.hypot(...n) || 1;
      data.push(...p, n[0] / len, n[1] / len, n[2] / len, ...color,
        kind, start, base, ...center, phase, Number(pop));
    }

    // Whorls of drooping branches, with a frost-white growth frontier.
    for (let tier = 0; tier < 25; tier++) {
      const y = Y0 + .02 + (Y1 - .08 - Y0 - .02) * tier / 24;
      const u = (y - Y0) / (Y1 - Y0), radius = envelope(y) + .05;
      const branches = Math.floor(7 + 12 * (1 - u));
      for (let b = 0; b < branches; b++) {
        const angle = TAU * (b + .5 * rng.next()) / branches + tier * .77;
        const length = radius * rng.range(.85, 1.08), count = Math.floor(26 + 240 * length);
        const dx = Math.cos(angle), dz = Math.sin(angle);
        for (let j = 0; j < count; j++) {
          const s = rng.next() ** .65, sl = s * length;
          const spread = (.025 + .09 * s) * rng.normal();
          const p = [dx * sl - dz * spread, y + .06 * sl - .20 * sl * sl + .012 * rng.normal(), dz * sl + dx * spread];
          const n = [dx * .75 + .3 * rng.normal(), .55 + .3 * rng.normal(), dz * .75 + .3 * rng.normal()];
          const ao = (.3 + .7 * s ** 1.3) * rng.range(.75, 1.1);
          const snowy = s > .5 && rng.next() < .07 * s && n[1] / Math.hypot(...n) > .5;
          const green = rng.next();
          add(p, n, snowy ? [.88, .94, 1] : [.10 + .12 * green, .48 + .38 * green, .18 + .14 * green],
            snowy ? SNOW : NEEDLE, growTime(y) + .45 * s, snowy ? 1 : ao);
        }
        const tl = .93 * length;
        tips.push([dx * tl, y + .06 * tl - .20 * tl * tl, dz * tl]);
      }
    }
    // Inner cone and bark keep the point cloud visually solid.
    for (let j = 0; j < 4200; j++) {
      const y = rng.range(Y0, Y1 - .1), a = rng.next() * TAU, r = .6 * envelope(y);
      add([Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(a), .3, Math.sin(a)], [.06, .28, .10], CONE, growTime(y), .55);
    }
    for (let j = 0; j < 1000; j++) {
      const y = rng.range(GROUND, Y0 + .1), a = rng.next() * TAU;
      const bark = .75 + .25 * Math.sign(Math.sin(a * 30 + y * 5));
      add([Math.cos(a) * .08, y, Math.sin(a) * .08], [Math.cos(a), 0, Math.sin(a)], [.42 * bark, .24 * bark, .12 * bark], TRUNK, growTime(y));
    }
    // Three strands of a gold spiral with hanging swags.
    for (let strand = 0; strand < 3; strand++) {
      for (let j = 0; j < 1800; j++) {
        const u = j / 1799, y = Y0 + .15 + (Y1 - Y0 - .45) * u;
        const a = TAU * 3.6 * u + .9, r = envelope(y) + .07;
        add([Math.cos(a) * r + .016 * rng.normal(), y - .07 * Math.abs(Math.sin(a * 2.5)) + .016 * rng.normal(), Math.sin(a) * r + .016 * rng.normal()],
          [Math.cos(a) + .6 * rng.normal(), .3 + .6 * rng.normal(), Math.sin(a) + .6 * rng.normal()], GOLD, TINSEL, 6.4 + 2.2 * u, 1, undefined, rng.next() * TAU);
      }
    }
    const bauble = sphere(160);
    for (let k = 0; k < 34; k++) {
      const u = (k + rng.next()) / 34, y = Y0 + .08 + u * (Y1 - Y0 - .38), a = k * 2.39996 + rng.next() * .4;
      const r = envelope(y) + .02, center = [Math.cos(a) * r, y - .03, Math.sin(a) * r];
      const radius = .058 + .032 * (1 - u), color = k % 2 === 0 ? RED : k % 4 === 1 ? [1, .78, .24] : SILVER;
      const start = rng.range(7.4, 9.5);
      for (const n of bauble) add(n.map((v, i) => center[i] + v * radius), n, color, BALL, start, 1, center, 0, true);
    }
    // Shuffle branch tips without replacement; each bulb has sixteen points.
    for (let i = tips.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [tips[i], tips[j]] = [tips[j], tips[i]];
    }
    const bulb = sphere(16);
    for (const center of tips.slice(0, 170)) {
      const start = rng.range(8.3, 11.3), phase = rng.next() * TAU;
      const color = rng.next() < .8 ? [1, .88, .5] : [1, .95, .85];
      for (const n of bulb) add(n.map((v, i) => center[i] + v * .03), n, color, LIGHT, start, 1, center, phase);
    }
    const gifts = [
      [.3, .96, .25, .20, .24, .4, RED, GOLD], [1.4, 1.02, .23, .23, .22, .9, BLUE, SILVER],
      [2.5, .95, .28, .16, .22, 1, GOLD, RED], [3.6, 1, .22, .22, .22, .3, RED, WHITE],
      [4.6, .95, .25, .19, .25, .1, GREEN, RED], [5.5, 1.02, .22, .20, .21, .7, BLUE, GOLD],
    ];
    const bow = sphere(64);
    gifts.forEach(([a, distance, w, h, d, rot, body, ribbon], index) => {
      const center = [Math.cos(a) * distance, GROUND, Math.sin(a) * distance];
      const ca = Math.cos(rot), sa = Math.sin(rot), start = 10 + index / gifts.length * 1.5;
      const areas = [w * d, h * d, h * d, h * w, h * w], area = areas.reduce((sum, x) => sum + x, 0);
      for (let j = 0; j < Math.floor(2600 * area); j++) {
        let choice = rng.next() * area, face = 0;
        while (face < 4 && choice > areas[face]) choice -= areas[face++];
        const fa = rng.next() - .5, fb = rng.next() - .5;
        const x = face === 1 ? w / 2 : face === 2 ? -w / 2 : fa * w;
        const y = face === 0 ? h : (fb + .5) * h;
        const z = face === 0 ? fb * d : face <= 2 ? fa * d : face === 3 ? d / 2 : -d / 2;
        const n = [[0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]][face];
        const onRibbon = face === 0 ? Math.abs(x) < .024 || Math.abs(z) < .024 : face <= 2 ? Math.abs(z) < .024 : Math.abs(x) < .024;
        add([center[0] + x * ca - z * sa, GROUND + y, center[2] + x * sa + z * ca],
          [n[0] * ca - n[2] * sa, n[1], n[0] * sa + n[2] * ca], onRibbon ? ribbon : body,
          onRibbon ? RIBBON : GIFT, start, 1, [center[0], GROUND + h / 2, center[2]], 0, true);
      }
      for (const angle of [rot, rot + Math.PI / 2]) {
        const c = Math.cos(angle), s = Math.sin(angle);
        const bc = [center[0] + c * .035, GROUND + h + .03, center[2] + s * .035];
        for (const n of bow) add([bc[0] + n[0] * .045 * c - n[2] * .024 * s, bc[1] + n[1] * .026, bc[2] + n[0] * .045 * s + n[2] * .024 * c], n, ribbon, RIBBON, start + .05, 1, bc, 0, true);
      }
    });
    return new Float32Array(data);
  }

  class Scene {
    constructor(zoom = 1) {
      this.zoom = clamp(zoom, .5, 1.2);
      this.points = buildScene();
      this.visitors = [];
      this.resize(COLS);
    }
    resize(cols) {
      const COLS = this.cols = Math.max(88, Math.min(440, Math.round(cols)));
      this.chars = new Uint16Array(COLS * ROWS);
      this.colors = new Float32Array(COLS * ROWS * 3);
      this.depth = new Float32Array(COLS * ROWS);
      const rng = new Random(42);
      const glyph = () => [43, 42, 46][Math.floor(rng.next() * 3)];
      this.stars = Array.from({ length: Math.floor(COLS * ROWS * .038) }, () =>
        [Math.floor(rng.next() * COLS), Math.floor(rng.next() * (ROWS * .53 + 4)), glyph(), rng.next() * TAU, rng.range(1.2, 3.2)]);
      this.snow = Array.from({ length: 115 }, () =>
        [rng.next() * COLS, rng.next() * ROWS, rng.range(-.8, .8), rng.range(2.2, 5.4), rng.next() * TAU, glyph()]);
      this.ground = [];
      for (let z = 0; z < 110; z++) for (let x = 0; x < 130; x++)
        this.ground.push([-4.2 + x * 8.4 / 129 + rng.range(-.025, .025), GROUND, -2.6 + z * 8 / 109 + rng.range(-.025, .025)]);
    }

    put(x, y, char, color, lum = 1) {
      const COLS = this.cols;
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
      const cell = y * COLS + x;
      this.chars[cell] = typeof char === "number" ? char : char.charCodeAt(0);
      for (let k = 0; k < 3; k++) this.colors[cell * 3 + k] = clamp(color[k] * lum);
    }

    project(x, y, z, ca, sa) {
      const COLS = this.cols;
      const rx = x * ca - z * sa, rz = x * sa + z * ca;
      const yp = (y - .12) * Math.cos(.15) - rz * Math.sin(.15);
      const depth = (y - .12) * Math.sin(.15) + rz * Math.cos(.15) + 4.85;
      const scale = 2.65 * this.zoom / Math.max(depth, .25);
      return [Math.round(COLS * .5 + rx * scale * ROWS * .4 / ASPECT), Math.round(ROWS * .44 - yp * scale * ROWS * .4), depth];
    }

    paintBackground(t, rot) {
      const COLS = this.cols;
      const ca = Math.cos(rot * .35), sa = Math.sin(rot * .35);
      for (const p of this.ground) {
        const [x, y, depth] = this.project(...p, ca, sa);
        if (y < Math.floor(ROWS * .53) || depth <= .6) continue;
        const fade = clamp(1.3 - depth / 8.5, .16, .62);
        this.put(x, y, fade > .4 ? "-" : ".", [.55, .62, .78], fade);
      }
      for (const [x, y, ch, phase, speed] of this.stars) {
        if (y >= Math.floor(ROWS * .53) || (y < 4 && x >= COLS - 16)) continue;
        this.put(x, y, ch, [.78, .85, .98], .35 + .65 * (.5 + .5 * Math.sin(t * speed + phase)));
      }
      for (const [x0, y0, vx, vy, phase, ch] of this.snow) {
        const x = Math.min(COLS - 1, Math.round(mod(x0 + vx * t + .8 * Math.sin(t * 1.1 + phase), COLS)));
        const y = Math.min(ROWS - 1, Math.round(mod(y0 + vy * t, ROWS)));
        if (y < 4 && x >= COLS - 16) continue;
        this.put(x, y, ch, [.86, .92, 1], .6 + .4 * Math.sin(t * 2.5 + phase));
      }
    }

    paintStar(t, ca, sa) {
      const COLS = this.cols;
      if (t < 5.1) return;
      const [cx, cy] = this.project(0, Y1 + .13, 0, ca, sa);
      const on = smooth((t - 11.8) / .3), flash = t >= 11.8 ? clamp(1 - (t - 11.8)) ** 2 : 0;
      const power = (.25 + .85 * on) * (1 + 1.6 * flash);
      const size = (1.6 + 1.5 * on) * (1 + .05 * Math.sin(t * 3));
      const tint = GOLD.map(v => v + (1 - v) * flash);
      for (let k = 0; k < 8; k++) {
        const a = k * TAU / 8 + .1 * Math.sin(t * .7);
        if (Math.sin(a) < -.2) continue;
        const horizontal = Math.abs(Math.sin(a)) < .25 ? .55 : 1;
        const reach = size * (2.6 + .6 * Math.sin(t * 3 + k * 1.3)) * (k % 2 === 0 ? 1 : .75) * horizontal * (1 + 1.6 * flash);
        const ch = "-|/\\"[Math.round(mod(a * 180 / Math.PI, 180) / 45) % 4];
        for (let s = size * 1.15; s < reach; s += .5) {
          const x = Math.round(cx + Math.cos(a) * s / ASPECT), y = Math.round(cy - Math.sin(a) * s);
          if (x < 0 || x >= COLS || y < 0 || y >= ROWS) continue;
          const i = (y * COLS + x) * 3;
          if (Math.max(this.colors[i], this.colors[i + 1], this.colors[i + 2]) < .75)
            this.put(x, y, ch, tint, power * .65 * (1 - s / reach) * horizontal);
        }
      }
      const vertices = Array.from({ length: 10 }, (_, i) => {
        const a = -Math.PI / 2 + i * TAU / 10, r = size * (i % 2 === 0 ? 1 : .42);
        return [cx + Math.cos(a) * r / ASPECT, cy + Math.sin(a) * r];
      });
      for (let y = Math.floor(cy - size - 1); y <= Math.ceil(cy + size + 1); y++) {
        for (let x = Math.floor(cx - size / ASPECT - 1); x <= Math.ceil(cx + size / ASPECT + 1); x++) {
          let inside = false;
          for (let i = 0, j = 9; i < 10; j = i++) {
            const [xi, yi] = vertices[i], [xj, yj] = vertices[j];
            if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
          }
          if (inside) this.put(x, y, Math.hypot((x - cx) * ASPECT, y - cy) / size < .52 ? "@" : "#", tint, Math.min(1.35, power));
        }
      }
      vertices.forEach(([x, y], i) => { if (i % 2 === 0) this.put(Math.round(x), Math.round(y), "*", tint, Math.min(1.35, power)); });
    }

    paintVisitors(clock) {
      const colors = [[1, .36, .42], [.32, .85, 1], [1, .77, .3], [.74, .46, 1], [.32, 1, .66]];
      const figures = this.visitors.map(visitor => {
        const phase = visitor.seed / 4294967296 * TAU;
        const angle = clock * (.13 + (visitor.seed % 5) * .012) + phase;
        const radius = 1.25 + (visitor.seed % 4) * .12;
        const [x, y, depth] = this.project(Math.cos(angle) * radius, GROUND, Math.sin(angle) * radius, 1, 0);
        return { ...visitor, x, y, depth };
      }).sort((a, b) => b.depth - a.depth);
      for (const person of figures) {
        const stepping = Math.floor(clock * 3 + person.seed % 10) % 2;
        const sprite = [" ^ ", "/_\\", " @ ", stepping ? "\\#/" : "/#\\", " # ", stepping ? "| |" : "/ \\"];
        const color = colors[person.seed % colors.length];
        // Clear snow/ground behind each silhouette, respecting tree occlusion.
        for (let y = person.y - 6; y <= person.y + 1; y++) for (let x = person.x - 2; x <= person.x + 2; x++) {
          if (x < 0 || x >= this.cols || y < 0 || y >= ROWS) continue;
          const cell = y * this.cols + x;
          if (person.depth <= this.depth[cell]) this.chars[cell] = 0;
        }
        for (let row = 0; row < sprite.length; row++) for (let col = 0; col < 3; col++) {
          const ch = sprite[row][col], x = person.x + col - 1, y = person.y - 5 + row;
          if (ch === " " || x < 0 || x >= this.cols || y < 0 || y >= ROWS) continue;
          const cell = y * this.cols + x;
          if (person.depth > this.depth[cell]) continue;
          this.depth[cell] = person.depth;
          this.put(x, y, ch, row === 2 ? [1, .85, .67] : row >= 4 ? [.8, .88, 1] : color);
        }
        if (person.mine) Array.from("Bạn").forEach((ch, i) => {
          const x = person.x + i - 1, y = person.y + 1;
          if (x >= 0 && x < this.cols && y >= 0 && y < ROWS && person.depth <= this.depth[y * this.cols + x]) this.put(x, y, ch, [1, .85, .35]);
        });
      }
    }

    frame(t, message = "M E R R Y   C H R I S T M A S   2 0 2 6", visitorClock = Date.now() / 1000) {
      const COLS = this.cols;
      this.chars.fill(0); this.colors.fill(0); this.depth.fill(Infinity);
      const rot = t * .31, ca = Math.cos(rot), sa = Math.sin(rot), p = this.points;
      this.paintBackground(t, rot);
      let lights = 0;
      for (let i = 0; i < p.length; i += STRIDE) {
        const age = t - p[i + 10];
        if (age < 0) continue;
        const kind = p[i + 9];
        if (kind === LIGHT) lights++;
        let x = p[i], y = p[i + 1], z = p[i + 2];
        if (p[i + 16]) {
          const s = smooth(age / .35);
          x = p[i + 12] + (x - p[i + 12]) * s;
          y = p[i + 13] + (y - p[i + 13]) * s;
          z = p[i + 14] + (z - p[i + 14]) * s;
        }
        const [sx, sy, depth] = this.project(x, y, z, ca, sa);
        if (sx < 0 || sx >= COLS || sy < 0 || sy >= ROWS || depth <= .5) continue;
        const cell = sy * COLS + sx;
        if (depth >= this.depth[cell]) continue;
        this.depth[cell] = depth;
        const nx = p[i + 3] * ca - p[i + 5] * sa, nz = p[i + 3] * sa + p[i + 5] * ca;
        const dot = clamp(nx * .42 + p[i + 4] * .56 - nz * .71), base = p[i + 11], phase = p[i + 15];
        let lum = base * (.28 + .72 * dot);
        if (kind === CONE) lum = base * (.18 + .25 * dot);
        else if (kind === SNOW) lum = .72 + .28 * dot;
        else if (kind === TINSEL) lum = .65 + .175 * Math.sin(t * 4.5 + phase) + .35 * dot;
        else if (kind === BALL) lum = .38 + .62 * dot ** 1.3;
        else if (kind === GIFT) lum = .42 + .58 * dot;
        else if (kind === RIBBON) lum = .62 + .38 * dot;
        else if (kind === LIGHT) lum = .55 + .65 * (.55 + .45 * Math.sin(t * 6 + phase));
        const flash = kind === NEEDLE || kind === SNOW || kind === TRUNK ? clamp(1 - age / .38) : 0;
        lum = Math.max(lum, 1.05 * flash);
        let char = RAMP[Math.max(1, Math.floor(clamp(lum) * (RAMP.length - 1)))];
        if (kind === LIGHT || kind === RIBBON) char = "@";
        else if (kind === GIFT) char = lum > .65 ? "#" : "%";
        this.chars[cell] = char.charCodeAt(0);
        for (let k = 0; k < 3; k++) this.colors[cell * 3 + k] = clamp((p[i + 6 + k] * (1 - .85 * flash) + .85 * flash) * clamp(lum, .12, 1.2));
      }
      this.paintStar(t, ca, sa);
      this.paintVisitors(visitorClock);
      if (t > 13 && message) {
        const text = Array.from(message).slice(0, COLS - 4), row = ROWS - 9;
        const x0 = Math.floor((COLS - text.length) / 2), shown = Math.min(text.length, Math.floor((t - 13) * 10));
        for (let y = row - 1; y <= row + 1; y++) for (let x = Math.max(0, x0 - 3); x < Math.min(COLS, x0 + shown + 3); x++) this.chars[y * COLS + x] = 0;
        for (let j = 0; j < shown; j++) if (text[j] !== " ") this.put(x0 + j, row, text[j], [RED, GOLD, GREEN][(Math.floor(j / 2) + Math.floor(t * 1.5)) % 3], .85 + .25 * Math.sin(t * 5 + j));
      }
      let letters = 0;
      for (const ch of this.chars) if (ch) letters++;
      return { rotation: mod(rot * 180 / Math.PI, 360), lights: Math.floor(lights / 16), letters };
    }
  }

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.layer = document.createElement("canvas");
      this.ink = this.layer.getContext("2d");
      this.resize(COLS);
    }
    resize(cols) {
      this.canvas.width = this.layer.width = cols * CW;
      this.canvas.height = this.layer.height = ROWS * CH;
      this.ink.font = '15px Menlo, Consolas, "DejaVu Sans Mono", monospace';
      this.ink.textAlign = "center"; this.ink.textBaseline = "middle";
    }
    draw(scene, t, info, author) {
      const COLS = scene.cols;
      const { ctx, ink, canvas, layer } = this, { width: w, height: h } = canvas;
      ink.clearRect(0, 0, w, h);
      for (let i = 0; i < scene.chars.length; i++) {
        const ch = scene.chars[i];
        if (ch <= 32) continue;
        const k = i * 3;
        ink.fillStyle = `rgb(${Math.round(scene.colors[k] * 255)},${Math.round(scene.colors[k + 1] * 255)},${Math.round(scene.colors[k + 2] * 255)})`;
        ink.fillText(String.fromCharCode(ch), (i % COLS + .5) * CW, (Math.floor(i / COLS) + .5) * CH);
      }
      ctx.fillStyle = "#05080f"; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(layer, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      // Canvas blur replaces the Python OpenCV/pygame bloom passes.
      for (const [blur, alpha] of [[4, .5], [14, .45]]) {
        ctx.filter = `blur(${blur}px)`; ctx.globalAlpha = alpha;
        ctx.drawImage(layer, 0, 0);
      }
      ctx.restore();
      ctx.font = '15px Menlo, Consolas, monospace';
      ctx.textBaseline = "top"; ctx.textAlign = "right";
      ctx.fillStyle = "#ffc45a"; ctx.fillText(`●  t ${t.toFixed(2).padStart(5, "0")}s`, w - 18, 16);
      ctx.textAlign = "left";
      ctx.fillStyle = "#b0a8c4"; ctx.fillText(author, 18, h - 78, w - 36);
      ctx.fillStyle = "#60687a";
      ctx.fillText(`rotation ${info.rotation.toFixed(2).padStart(6, "0")}°     lights ${String(info.lights).padStart(3)}`, 18, h - 56);
      ctx.fillText(`letters ${info.letters.toLocaleString("en-US")}`, 18, h - 34);
      // Draw branding on the canvas so it is included in saved PNG frames.
      ctx.save();
      ctx.font = '20px Menlo, Consolas, monospace';
      ctx.textAlign = "right";
      ctx.fillStyle = "#b0a8c4";
      ctx.fillText("", w - 18, h - 34);
      ctx.restore();
    }
  }

  // A browser-synthesized adaptation of the original D-major bell/synth track.
  // A single buffer makes pause, scrubbing, restart and looping sample-accurate.
  class Soundtrack {
    constructor() { this.context = null; this.buffer = null; this.source = null; }
    async enable() {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error("Web Audio is unavailable in this browser.");
      if (!this.context) this.context = new AudioContext();
      await this.context.resume();
      if (!this.buffer) this.buffer = this.synthesize();
    }
    synthesize() {
      const rate = 22050, length = rate * DURATION;
      const buffer = this.context.createBuffer(2, length, rate);
      const left = buffer.getChannelData(0), right = buffer.getChannelData(1);
      const frequency = note => {
        const [, name, accidental, octave] = /^([A-G])(#?)(\d)$/.exec(note);
        const midi = (Number(octave) + 1) * 12 + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[name] + (accidental ? 1 : 0);
        return 440 * 2 ** ((midi - 69) / 12);
      };
      function note(start, name, duration, amp, voice = "bell", pan = 0) {
        const f = frequency(name), begin = Math.floor(start * rate);
        const count = Math.min(Math.floor(duration * rate), length - begin);
        const lg = Math.sqrt(.5 * (1 - pan)), rg = Math.sqrt(.5 * (1 + pan));
        for (let i = 0; i < count; i++) {
          const t = i / rate, phase = TAU * f * t;
          let v;
          if (voice === "pad") v = (Math.sin(phase) + .28 * Math.sin(phase * 2)) * Math.min(t / .28, 1) * clamp((duration - t) / .35);
          else if (voice === "bass") v = (.66 * Math.sin(phase) * Math.exp(-t * 11.5) + .26 * Math.sin(phase * 2) * Math.exp(-t * 22)) * Math.min(t / .004, 1);
          else v = (.65 * Math.sin(phase) * Math.exp(-t * 3.1) + .24 * Math.sin(phase * 2) * Math.exp(-t * 6.5) + .11 * Math.sin(phase * 3) * Math.exp(-t * 11) + .05 * Math.sin(phase * 4.02) * Math.exp(-t * 11)) * Math.min(t / .006, 1);
          // Short release avoids clicks when a synthesized note is truncated.
          v *= amp * clamp((duration - t) / .015);
          left[begin + i] += v * lg; right[begin + i] += v * rg;
        }
      }
      const beat = 60 / 108, bar = beat * 4;
      const chords = [[0, 3, ["D3", "F#3", "A3", "C#4"]], [3, 2, ["B2", "D3", "F#3", "A3"]], [5, 2, ["E3", "G3", "B3", "D4"]], [7, 1.75, ["A2", "C#3", "E3", "G3"]], [8.75, .25, ["D3", "F#3", "A3", "E4"]]];
      for (const [start, bars, notes] of chords) notes.forEach(n => note(start * bar, n, bars * bar + .1, .035, "pad"));
      for (let e = 0; e < 68; e++) note(e * beat / 2, e < 24 ? "D2" : e < 40 ? "B1" : e < 56 ? "E2" : "A1", .21, .17, "bass");
      ["D5", "F#5", "A5", "C#6", "A5", "F#5"].forEach((n, i) => note(.15 + i * .5 * beat, n, .85, .15, "bell", -.35 + .14 * i));
      const melody = [[4,"E5",1.35],[5.5,"E5",.45],[6,"D5",.85],[7,"A4",.8],[8,"E5",.45],[8.5,"E5",.45],[9,"F#5",.8],[10,"D5",1.8],[12,"B4",.45],[12.5,"B4",.45],[13,"E5",.45],[13.5,"E5",.45],[14,"F#5",.48],[14.5,"D5",1.3],[16,"B4",.45],[16.5,"C#5",.45],[17,"D5",.45],[17.5,"C#5",.45],[18,"B4",1.8],[20,"F#5",.9],[21,"E5",1.25],[22.5,"B4",.45],[23,"F#5",.48],[23.5,"G5",.48],[24,"F#5",.48],[24.5,"E5",2.5],[28,"D5",.45],[28.5,"C#5",.45],[29,"D5",.45],[29.5,"C#5",.45],[30,"C#5",.48],[30.5,"D5",.48],[31,"C#5",.85],[32,"A4",2],[34.5,"D5",1.45]];
      melody.forEach(([b, n, d], i) => note(b * beat, n, Math.max(.8, d * beat), .36, "bell", i % 2 ? .14 : -.14));
      ["D5", "F#5", "A5", "C#6", "D6", "E6", "F#6", "A6"].forEach((n, i) => note(11.8 + i * .052, n, 1.5, .13, "bell", -.6 + 1.2 * i / 7));
      const dryL = left.slice(), dryR = right.slice();
      for (const [delay, same, cross] of [[.037,.25,.14],[.061,.16,.23],[.097,.17,.11],[.149,.09,.15]]) {
        const offset = Math.floor(delay * rate);
        for (let i = offset; i < length; i++) {
          left[i] += dryL[i - offset] * same + dryR[i - offset] * cross;
          right[i] += dryR[i - offset] * same + dryL[i - offset] * cross;
        }
      }
      for (let i = 0; i < length; i++) {
        const fade = clamp(i / (rate * .02)) * clamp((length - i) / (rate * .85));
        left[i] = Math.tanh(left[i] * .88) * fade; right[i] = Math.tanh(right[i] * .88) * fade;
      }
      return buffer;
    }
    stop() {
      if (this.source) { this.source.stop(); this.source.disconnect(); this.source = null; }
    }
    play(time, loop) {
      this.stop();
      if (!this.buffer || time >= DURATION) return;
      const source = this.context.createBufferSource();
      source.buffer = this.buffer; source.loop = loop;
      source.connect(this.context.destination); source.start(0, time);
      this.source = source;
    }
  }

  class ChristmasTree {
    constructor(canvas, options = {}) {
      this.scene = new Scene(options.zoom); this.renderer = new Renderer(canvas);
      this.message = options.message ?? "M E R R Y   C H R I S T M A S   2 0 2 6";
      this.author = options.author ?? "@cfs.ascii";
      this.loop = options.loop ?? true; this.paused = options.paused ?? false;
      this.loopStart = clamp(options.loopStart ?? 0, 0, DURATION - 1);
      this.frameInterval = 1000 / clamp(options.fps ?? 30, 1, 30);
      this.sound = new Soundtrack(); this.muted = true;
      this.time = this.loopStart; this.anchorTime = this.time; this.anchorClock = performance.now();
      this.onUpdate = options.onUpdate ?? (() => {});
      this.lastDraw = -Infinity; this.destroyed = false; this.visitorClock = Date.now() / 1000;
      this.tick = this.tick.bind(this);
      this.render(); this.request = requestAnimationFrame(this.tick);
      if (options.fullWidth && typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver(([entry]) => {
          const { width, height } = entry.contentRect;
          if (!width || !height || this.destroyed) return;
          const cols = Math.max(COLS, Math.min(440, Math.round(width / height * ROWS * CH / CW)));
          if (cols === this.scene.cols) return;
          this.scene.resize(cols); this.renderer.resize(cols); this.render();
        });
        this.resizeObserver.observe(canvas.parentElement);
      }
    }
    currentTime() {
      if (this.paused) return this.time;
      const elapsed = this.anchorTime + (performance.now() - this.anchorClock) / 1000;
      return this.loop ? this.loopStart + mod(elapsed - this.loopStart, DURATION - this.loopStart) : Math.min(DURATION, elapsed);
    }
    syncAudio() { if (!this.muted && !this.paused) this.sound.play(this.time, this.loop); else this.sound.stop(); }
    seek(value) {
      if (!Number.isFinite(value)) return;
      this.time = clamp(value, 0, DURATION); this.anchorTime = this.time; this.anchorClock = performance.now();
      this.syncAudio(); this.render();
    }
    setPaused(paused) {
      this.time = this.currentTime(); this.paused = paused;
      // Play at the end starts a fresh run when looping is disabled.
      if (!paused && this.time >= DURATION) this.time = this.loopStart;
      this.anchorTime = this.time; this.anchorClock = performance.now();
      this.syncAudio(); this.render();
    }
    setLoop(loop) {
      this.time = this.currentTime(); this.loop = loop;
      this.anchorTime = this.time; this.anchorClock = performance.now(); this.syncAudio();
    }
    setVisitors(ids, ownId) {
      this.scene.visitors = [...new Set(ids)].sort().map(id => {
        let seed = 2166136261;
        for (let i = 0; i < id.length; i++) seed = Math.imul(seed ^ id.charCodeAt(i), 16777619);
        return { seed: seed >>> 0, mine: id === ownId };
      });
      if (!this.destroyed) this.render();
    }
    async setMuted(muted) {
      this.muted = muted;
      this.render();
      if (!muted) {
        try { await this.sound.enable(); }
        catch (error) { this.muted = true; this.render(); throw error; }
      }
      if (this.destroyed) return;
      this.time = this.currentTime(); this.syncAudio(); this.render();
    }
    render() {
      const info = this.scene.frame(this.time, this.message, this.visitorClock);
      this.renderer.draw(this.scene, this.time, info, this.author);
      this.onUpdate({ time: this.time, paused: this.paused, muted: this.muted, ...info });
    }
    tick(now) {
      if (this.destroyed) return;
      if (!this.paused && now - this.lastDraw >= this.frameInterval) {
        const previous = this.time;
        this.visitorClock = Date.now() / 1000;
        this.time = this.currentTime();
        if (this.loop && this.time < previous) this.syncAudio();
        if (!this.loop && this.time >= DURATION) { this.paused = true; this.sound.stop(); }
        this.render(); this.lastDraw = now;
      }
      this.request = requestAnimationFrame(this.tick);
    }
    savePNG() {
      this.renderer.canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob), link = document.createElement("a");
        link.href = url; link.download = `christmas-tree-${this.time.toFixed(2)}s.png`; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, "image/png");
    }
    destroy() {
      this.destroyed = true; this.resizeObserver?.disconnect(); cancelAnimationFrame(this.request); this.sound.stop();
      if (this.sound.context) this.sound.context.close();
    }
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { Scene, Soundtrack, DURATION, COLS, ROWS };
  if (typeof window !== "undefined") window.ChristmasTree = ChristmasTree;
})();
