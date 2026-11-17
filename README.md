# ASCII Christmas Tree — JavaScript

Open `index.html` in a modern browser. No installation, Python, server, or build step is needed. The tree and original synthesized soundtrack work offline; YouTube playback requires internet access and permission to embed the selected video.

On the Vui Coding website, visit `/noel` (local: `http://localhost:3002/noel`). The Next.js page embeds this standalone animation and forwards the `message`, `author`, `loop`, `v`, `bpm`, and `music` query parameters.

The Canvas port preserves the original 20-second choreography: a growing, rotating 3D ASCII tree, gold garland, baubles, 170 twinkling lights, six presents, falling snow, a bursting star, and the typed Christmas greeting. Geometry is deterministic, using a JavaScript seeded random generator rather than NumPy's generator.

- **Space:** play/pause. **R:** restart. **← / →:** seek one second.
- **S:** download the current frame as PNG. **M:** toggle sound.
- The “” watermark stays visible at the bottom right and is included in saved PNGs.
- Use the slider to scrub and the Loop checkbox to hold the final frame.
- YouTube music is selected by default (`QcEpLwK1XOA`). Paste another YouTube URL or video ID directly into the header and press Enter or **Phát**. The center **Đổi nhạc** button shows or hides the URL bar (hidden initially), and selects the URL when opened. Original-music mode keeps the bar visible so YouTube can be selected again. **Gốc** switches to the original synthesized soundtrack. The `v` query parameter selects the video, falling back to the default if absent or invalid. Audible autoplay is attempted on entry; when the browser blocks it, the first page interaction or **Phát** starts playback. **Sound on/off** controls the selected source.
- The radial spectrum follows YouTube playback time at a default 120 BPM (older shared links preserve their tempo); it is not audio amplitude or beat detection. It stops when the video pauses, buffers, is muted, or reduced motion is enabled. The tree has a full-width, plain dark background without music lighting.
- **Chia sẻ** creates a Vui Coding shortlink such as `/r/n-QcEpLwK1XOA-128`, including the selected video. Custom greeting/author and original-music mode are preserved. The `/r/` redirect is hosted by Vui Coding; it is not part of the offline ZIP.
- **Mời cà phê** opens an in-page QR modal. Close it with ×, Escape, or a click outside. The SVG viewport shows only the QR card from `coffee-qr.jpg`, preserving the original QR pixels. **Download source code** downloads this standalone page and QR asset as a ZIP; extract it and open `index.html`.
- The live counter uses Supabase Presence in the Noel room. One anonymous browser ID produces one walking ASCII visitor; multiple tabs count once. Leaving the page removes that visitor after the realtime connection closes. Connection failures show an unavailable status instead of an invented count. The offline ZIP has no live presence unless hosted with `/api/noel/presence`; the tree and music controls still work.
- Desktop mouse movement leaves a short sparkling trail; touch devices and reduced-motion mode disable it. Music loading stays visible through cued/intermediate states until YouTube reports playback, with a tap-to-play prompt when autoplay is blocked.
- Reduced-motion preferences show the completed tree, paused. Press Play to animate.

Customize the greeting and signature with `index.html?message=Happy%20Holidays&author=Your%20Name`. Add `&loop=false` to play once. The greeting is limited to 84 characters to fit the ASCII grid.

To embed the animation elsewhere, load `christmas_tree.js` and create a canvas:

```html
<canvas id="tree" style="width:100%;max-width:792px"></canvas>
<script src="christmas_tree.js"></script>
<script>
  const animation = new ChristmasTree(document.querySelector('#tree'), {
    author: '@yourname',
    message: 'M E R R Y   C H R I S T M A S',
    loop: true,
  });
  // animation.setPaused(true), animation.seek(12), animation.savePNG()
  // Call animation.setMuted(false) from a click handler to enable audio.
  // Call animation.destroy() when removing the canvas.
</script>
```

The original Python export features are outside this standalone browser animation.

For repository maintainers: after editing the page, run `python3 scripts/build-noel-source.py` from the repository root to refresh `noel-source.zip`. The archive includes only the standalone page files and QR asset, not the rest of the website.

Rebuild the bundled realtime SDK with `node scripts/build-noel-presence.mjs` after dependency updates, then regenerate the ZIP. Public Supabase browser configuration is served by `/api/noel/presence`; no service-role credentials are exposed.

The standalone production Noel page loads Google Analytics `G-9C596LLS4D`. Tracking is restricted to top-level pages on `vuicoding.me` and `www.vuicoding.me`; local/offline copies and iframe embeds do not initialize a second tracker. The reported page URL is `/noel/`, without personal greetings or other query parameters.
