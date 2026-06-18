#!/usr/bin/env node
// gen.js — Carousel Slide Generator
// Usage: node gen.js <config.json>
// Outputs: slides/slide-01.html … slide-NN.html

'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT      = __dirname;
const SLIDES    = path.join(ROOT, 'slides');
const ASSETS    = path.join(ROOT, 'assets');

// Resolve path for font files (relative to the HTML in slides/)
const FONT_DIR = '../node_modules/@fontsource/inter/files';

// ─── Font face block (embedded in every slide) ────────────────────────────────
const FONT_CSS = `
@font-face { font-family:'Inter'; font-weight:400; font-style:normal;
  src: url('${FONT_DIR}/inter-latin-400-normal.woff2') format('woff2'); }
@font-face { font-family:'Inter'; font-weight:500; font-style:normal;
  src: url('${FONT_DIR}/inter-latin-500-normal.woff2') format('woff2'); }
@font-face { font-family:'Inter'; font-weight:600; font-style:normal;
  src: url('${FONT_DIR}/inter-latin-600-normal.woff2') format('woff2'); }
@font-face { font-family:'Inter'; font-weight:700; font-style:normal;
  src: url('${FONT_DIR}/inter-latin-700-normal.woff2') format('woff2'); }
@font-face { font-family:'Inter'; font-weight:800; font-style:normal;
  src: url('${FONT_DIR}/inter-latin-800-normal.woff2') format('woff2'); }
@font-face { font-family:'Inter'; font-weight:900; font-style:normal;
  src: url('${FONT_DIR}/inter-latin-900-normal.woff2') format('woff2'); }
`;

// ─── Render-mode boilerplate (injected into every slide) ──────────────────────
// Passing ?t=<seconds> seeks the timeline to that exact frame and
// signals 'document.title = __FRAME_READY__' once the browser has painted.
const RENDER_HEAD = `
  const _qs   = new URLSearchParams(location.search);
  const _t    = _qs.get('t');
  const RMODE = _t !== null;
  const tl    = gsap.timeline({ paused: RMODE });
`;

const RENDER_TAIL = `
  if (RMODE) {
    tl.seek(parseFloat(_t), false);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.title = '__FRAME_READY__';
    }));
  } else {
    tl.play();
  }
`;

// ─── HTML shell ───────────────────────────────────────────────────────────────
function wrap(bgClass, body, script) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
${FONT_CSS}
</style>
<link rel="stylesheet" href="../base.css">
</head>
<body>
<div class="${bgClass}" id="slide">
${body}
</div>
<script src="../gsap.min.js"></script>
<script>
${RENDER_HEAD}
${script}
${RENDER_TAIL}
</script>
</body>
</html>`;
}

// ─── SLIDE TEMPLATES ──────────────────────────────────────────────────────────

// COVER — full-frame dark plate, centered title, avatar (casual)
function coverSlide(cfg, idx, total) {
  const { eyebrow = 'Deep Dive', title, subtitle, author = '@you' } = cfg;

  const body = `
  <!-- Glow orbs -->
  <div id="orb1" style="position:absolute;width:700px;height:700px;border-radius:50%;
    background:radial-gradient(circle,rgba(37,99,235,0.20) 0%,transparent 68%);
    top:-120px;left:-120px;pointer-events:none;"></div>
  <div id="orb2" style="position:absolute;width:400px;height:400px;border-radius:50%;
    background:radial-gradient(circle,rgba(96,165,250,0.10) 0%,transparent 70%);
    bottom:200px;right:-100px;pointer-events:none;"></div>

  <!-- Slide counter -->
  <div class="slide-counter">${idx + 1} <span style="opacity:.4">/</span> ${total}</div>

  <!-- Main headline plate -->
  <div id="plate" class="plate" style="left:60px;right:60px;top:170px;padding:72px 72px 84px;">
    <div id="eyebrow" class="t-eyebrow" style="margin-bottom:32px;">${eyebrow}</div>
    <div id="title"   class="t-headline" style="margin-bottom:36px;">${title}</div>
    <div id="bar"     class="accent-bar"  style="margin-bottom:32px;"></div>
    <div id="sub"     class="t-subhead">${subtitle}</div>
  </div>

  <!-- Avatar — casual, anchored bottom-right -->
  <img id="avatar" class="avatar" src="../assets/pose-casual-cutout.png"
       style="height:680px;right:20px;bottom:0;" />

  <!-- Brand tag -->
  <div class="brand-tag">${author}</div>
`;

  const script = `
  tl
    .from('#orb1',  { scale:0.3, opacity:0, duration:1.4, ease:'power2.out' }, 0)
    .from('#orb2',  { scale:0.3, opacity:0, duration:1.2, ease:'power2.out' }, 0.2)
    .from('#plate', { y:90, opacity:0, duration:0.75, ease:'power3.out' }, 0.25)
    .from('#eyebrow',{ y:22, opacity:0, duration:0.5, ease:'power2.out' }, 0.55)
    .from('#title',  { y:32, opacity:0, duration:0.65, ease:'power3.out' }, 0.70)
    .from('#bar',    { scaleX:0, opacity:0, transformOrigin:'left center',
                       duration:0.45, ease:'power2.inOut' }, 0.95)
    .from('#sub',    { y:22, opacity:0, duration:0.5, ease:'power2.out' }, 1.05)
    .from('#avatar', { x:90, opacity:0, duration:0.75, ease:'power3.out' }, 0.50);
`;
  return wrap('bg-spatial', body, script);
}

// STEP — icon + heading + body copy on light bg, avatar (lean-casual)
function stepSlide(cfg, idx, total) {
  const { step, heading, body: bodyText, icon } = cfg;

  const iconHTML = icon
    ? `<img src="../icons/${icon}" style="width:52px;height:52px;object-fit:contain;" />`
    : `<span style="font-size:36px;font-weight:800;color:var(--accent-lt);">${step}</span>`;

  const body = `
  <!-- Slide counter -->
  <div class="slide-counter dark" style="color:rgba(15,23,42,.28);">${idx + 1} <span style="opacity:.4">/</span> ${total}</div>

  <!-- Step badge -->
  <div id="badge" class="step-badge" style="top:140px;left:80px;">${step}</div>

  <!-- Content card -->
  <div id="card" class="card" style="left:60px;right:60px;top:262px;padding:64px 64px 80px;">
    <div id="heading"   class="t-headline t-dark"  style="margin-bottom:32px;">${heading}</div>
    <div id="divider"   class="accent-bar"           style="margin-bottom:32px;"></div>
    <div id="body-text" class="t-body t-mid">${bodyText}</div>
  </div>

  <!-- Avatar — lean-casual, bottom-right -->
  <img id="avatar" class="avatar" src="../assets/pose-lean-casual-cutout.png"
       style="height:560px;right:24px;bottom:0;" />
`;

  const script = `
  tl
    .from('#badge',     { scale:0, opacity:0, duration:0.55, ease:'back.out(2)' }, 0)
    .from('#card',      { y:70, opacity:0, duration:0.65, ease:'power3.out' }, 0.15)
    .from('#heading',   { y:24, opacity:0, duration:0.55, ease:'power2.out' }, 0.40)
    .from('#divider',   { scaleX:0, opacity:0, transformOrigin:'left center',
                         duration:0.38, ease:'power2.inOut' }, 0.60)
    .from('#body-text', { y:22, opacity:0, duration:0.48, ease:'power2.out' }, 0.72)
    .from('#avatar',    { x:70, opacity:0, duration:0.65, ease:'power3.out' }, 0.30);
`;
  return wrap('bg-light', body, script);
}

// STAT — giant number, dark bg, avatar (victory)
function statSlide(cfg, idx, total) {
  const { stat, label, context = '', author = '@you' } = cfg;

  const ctxHTML = context
    ? `<div id="ctx" class="t-body" style="margin-top:24px;padding:0 100px;text-align:center;">${context}</div>`
    : '';

  const body = `
  <!-- Slide counter -->
  <div class="slide-counter">${idx + 1} <span style="opacity:.4">/</span> ${total}</div>

  <!-- Radial glow behind stat -->
  <div style="position:absolute;width:800px;height:800px;border-radius:50%;
    background:radial-gradient(circle,rgba(37,99,235,0.18) 0%,transparent 68%);
    top:180px;left:50%;transform:translateX(-50%);pointer-events:none;"></div>

  <!-- Stat content -->
  <div style="position:absolute;top:240px;left:0;right:0;text-align:center;">
    <div id="stat-num"  class="t-stat">${stat}</div>
    <div id="stat-label" class="t-headline" style="margin-top:12px;">${label}</div>
    ${ctxHTML}
  </div>

  <!-- Avatar — victory, centered bottom -->
  <img id="avatar" class="avatar" src="../assets/pose-victory-cutout.png"
       style="height:600px;left:50%;transform:translateX(-50%);bottom:0;" />

  <!-- Brand tag -->
  <div class="brand-tag">${author}</div>
`;

  const ctxAnim = context ? `.from('#ctx',{y:20,opacity:0,duration:0.42,ease:'power2.out'}, 1.05)` : '';

  const script = `
  tl
    .from('#stat-num',   { scale:0.4, opacity:0, duration:0.75, ease:'back.out(1.6)' }, 0)
    .from('#stat-label', { y:28,      opacity:0, duration:0.55, ease:'power2.out' }, 0.55)
    ${ctxAnim}
    .from('#avatar',     { y:50,      opacity:0, duration:0.65, ease:'power3.out' }, 0.40);
`;
  return wrap('bg-spatial', body, script);
}

// CTA — comment keyword call-to-action, avatar (arms-crossed)
function ctaSlide(cfg, idx, total) {
  const {
    prompt   = 'Comment',
    keyword,
    subtext  = "and I'll DM you the full guide",
    author   = '@you'
  } = cfg;

  const body = `
  <!-- Slide counter -->
  <div class="slide-counter">${idx + 1} <span style="opacity:.4">/</span> ${total}</div>

  <!-- Glow -->
  <div style="position:absolute;width:900px;height:600px;border-radius:50%;
    background:radial-gradient(ellipse,rgba(37,99,235,0.16) 0%,transparent 68%);
    top:280px;left:50%;transform:translateX(-50%);pointer-events:none;"></div>

  <!-- CTA plate -->
  <div id="plate" class="plate"
       style="left:60px;right:60px;top:210px;padding:80px 72px;text-align:center;">
    <div id="prompt"  class="t-subhead" style="margin-bottom:36px;">
      <span style="opacity:.55">${prompt}</span>
    </div>
    <div id="keyword" style="font-size:96px;font-weight:900;letter-spacing:-0.03em;
      color:var(--accent-lt);line-height:1;margin-bottom:36px;">"${keyword}"</div>
    <div id="subtext" class="t-subhead" style="opacity:.5;">${subtext}</div>
  </div>

  <!-- Avatar — arms-crossed, bottom-right -->
  <img id="avatar" class="avatar" src="../assets/pose-arms-crossed-cutout.png"
       style="height:560px;right:30px;bottom:0;" />

  <!-- Brand tag -->
  <div class="brand-tag">${author}</div>
`;

  const script = `
  tl
    .from('#plate',   { y:90,   opacity:0,  duration:0.75, ease:'power3.out' }, 0)
    .from('#prompt',  { y:24,   opacity:0,  duration:0.45, ease:'power2.out' }, 0.45)
    .from('#keyword', { scale:0.65, opacity:0, duration:0.65, ease:'back.out(1.8)' }, 0.60)
    .from('#subtext', { y:22,   opacity:0,  duration:0.45, ease:'power2.out' }, 0.90)
    .from('#avatar',  { x:90,   opacity:0,  duration:0.75, ease:'power3.out' }, 0.35);
`;
  return wrap('bg-spatial', body, script);
}

// ─── DISPATCH ─────────────────────────────────────────────────────────────────
function renderSlide(slide, idx, total) {
  switch (slide.type) {
    case 'cover': return coverSlide(slide, idx, total);
    case 'step':  return stepSlide(slide, idx, total);
    case 'stat':  return statSlide(slide, idx, total);
    case 'cta':   return ctaSlide(slide, idx, total);
    default: throw new Error(`Unknown slide type: "${slide.type}"`);
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const configPath = process.argv[2];
if (!configPath) {
  console.error('Usage: node gen.js <config.json>');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const { slides } = config;
const total = slides.length;

fs.mkdirSync(SLIDES, { recursive: true });

slides.forEach((slide, i) => {
  const num  = String(i + 1).padStart(2, '0');
  const html = renderSlide(slide, i, total);
  const out  = path.join(SLIDES, `slide-${num}.html`);
  fs.writeFileSync(out, html, 'utf8');
  console.log(`  ✓  slide-${num}.html  [${slide.type}]`);
});

console.log(`\n  ${total} slides → slides/`);
