/* canvas.js — handwriting on a touchscreen.
   Pointer Events, so finger, stylus and mouse all work through one code path. Pen pressure
   varies the stroke width where the hardware reports it, which makes the output look like a
   brush rather than a wire and, more usefully, makes sloppy strokes visibly sloppy.

   There is no handwriting recognition here and that is deliberate. Shipping a recogniser would
   mean a model file, which would break the offline-in-one-folder promise, and a bad recogniser
   is worse than none — it marks correct characters wrong and destroys trust in the drill.
   Instead the canvas gives one objective signal that costs nothing and catches most of what
   goes wrong: STROKE COUNT. If the character takes nine strokes and you drew seven, you have a
   stroke-order fault, every time. Everything else is honest self-assessment against the model. */
'use strict';

const Hand = (function () {
  let cv = null, ctx = null, strokes = [], cur = null, drawing = false;
  let opts = { glyph: '', expected: 0, ghost: true, grid: true };

  const GHOST = 'rgba(236,231,225,0.10)';
  const GRID  = 'rgba(236,231,225,0.08)';
  const INK   = '#ece7e1';

  function dpr() { return window.devicePixelRatio || 1; }

  function mount(el, options) {
    opts = Object.assign({ glyph: '', expected: 0, ghost: true, grid: true }, options || {});
    cv = el;
    const size = cv.clientWidth;
    cv.width = size * dpr();
    cv.height = size * dpr();
    cv.style.height = size + 'px';
    ctx = cv.getContext('2d');
    ctx.scale(dpr(), dpr());
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    strokes = [];
    bind();
    repaint();
  }

  function pos(e) {
    const r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top,
      p: (e.pointerType === 'pen' && e.pressure > 0) ? e.pressure : 0.5 };
  }

  function bind() {
    cv.style.touchAction = 'none';   // without this, a finger scrolls the page instead of drawing
    cv.onpointerdown = function (e) {
      e.preventDefault();
      cv.setPointerCapture(e.pointerId);
      drawing = true;
      cur = [pos(e)];
      strokes.push(cur);
      repaint();
    };
    cv.onpointermove = function (e) {
      if (!drawing) return;
      e.preventDefault();
      // Coalesced events give smooth lines on high-rate touch digitisers, which report far
      // faster than the frame rate. The list can come back empty (synthetic or untrusted
      // events), so fall back to the event itself rather than silently dropping the point.
      let pts = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
      if (!pts || !pts.length) pts = [e];
      for (const p of pts) cur.push(pos(p));
      repaint();
    };
    const end = function (e) {
      if (!drawing) return;
      drawing = false; cur = null;
      repaint();
      if (opts.onStroke) opts.onStroke(strokes.length);
    };
    cv.onpointerup = end;
    cv.onpointercancel = end;
    cv.onpointerleave = end;
  }

  function repaint() {
    const w = cv.clientWidth, h = cv.clientHeight;
    ctx.clearRect(0, 0, w, h);

    if (opts.grid) {
      ctx.strokeStyle = GRID; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
      ctx.stroke();
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(w, h);
      ctx.moveTo(w, 0); ctx.lineTo(0, h);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (opts.ghost && opts.glyph) {
      ctx.save();
      ctx.fillStyle = GHOST;
      ctx.font = Math.round(w * 0.78) + 'px "UD Digi Kyokasho N-R","Yu Gothic","Noto Sans JP",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opts.glyph, w / 2, h / 2 + w * 0.02);
      ctx.restore();
    }

    ctx.strokeStyle = INK;
    for (const s of strokes) {
      if (s.length === 1) {
        ctx.beginPath();
        ctx.arc(s[0].x, s[0].y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = INK; ctx.fill();
        continue;
      }
      for (let i = 1; i < s.length; i++) {
        ctx.beginPath();
        ctx.lineWidth = 2 + s[i].p * 6;
        ctx.moveTo(s[i - 1].x, s[i - 1].y);
        ctx.lineTo(s[i].x, s[i].y);
        ctx.stroke();
      }
    }
  }

  function clear() { strokes = []; repaint(); if (opts.onStroke) opts.onStroke(0); }
  function undo() { strokes.pop(); repaint(); if (opts.onStroke) opts.onStroke(strokes.length); }
  function setGhost(v) { opts.ghost = v; repaint(); }
  function setGrid(v) { opts.grid = v; repaint(); }
  function setGlyph(g, expected) { opts.glyph = g; opts.expected = expected || 0; strokes = []; repaint(); }
  function count() { return strokes.length; }
  // snapshot / restore, so re-rendering the page around the canvas does not wipe what was written
  function getStrokes() { return strokes; }
  function setStrokes(s) { strokes = s || []; repaint(); }
  function isTouch() { return window.matchMedia && window.matchMedia('(pointer: coarse)').matches; }
  function hasPointer() { return typeof window.PointerEvent !== 'undefined'; }

  return { mount: mount, clear: clear, undo: undo, setGhost: setGhost, setGrid: setGrid,
    setGlyph: setGlyph, count: count, repaint: repaint, isTouch: isTouch, hasPointer: hasPointer,
    getStrokes: getStrokes, setStrokes: setStrokes };
})();

window.Hand = Hand;

/* The stroke-count verdict. Blunt on purpose: a wrong count is a fact, not an opinion. */
window.strokeVerdict = function (drawn, expected) {
  if (!expected) return '';
  if (drawn === 0) return '<span class="dim">nothing drawn yet</span>';
  if (drawn === expected)
    return '<span style="color:var(--midori)">✓ ' + drawn + ' strokes — correct count</span>';
  if (drawn < expected)
    return '<span style="color:var(--aka)">' + drawn + ' strokes, should be ' + expected +
      ' — you merged ' + (expected - drawn) + '. Almost always a corner written as one stroke ' +
      'when it is two.</span>';
  return '<span style="color:var(--aka)">' + drawn + ' strokes, should be ' + expected +
    ' — you split ' + (drawn - expected) + '. Usually a stroke that changes direction but is ' +
    'written without lifting the pen.</span>';
};
