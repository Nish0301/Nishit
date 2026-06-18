#!/usr/bin/env node
// render.js — Screenshot every frame with Playwright, encode to MP4 with ffmpeg
// Usage: node render.js <config.json>
// Output: output/slide-NN.mp4

'use strict';
const { chromium }   = require('playwright');
const { execSync }   = require('child_process');
const fs             = require('fs');
const path           = require('path');

const ROOT        = __dirname;
const SLIDES_DIR  = path.join(ROOT, 'slides');
const OUTPUT_DIR  = path.join(ROOT, 'output');
const FRAMES_ROOT = path.join(OUTPUT_DIR, 'frames');

const FPS            = 30;
const FRAME_TIMEOUT  = 10_000;   // ms to wait for __FRAME_READY__
const MAX_RETRIES    = 3;
const CONCURRENCY    = 1;        // Chromium instances (low = stable)

// Chromium installed by Playwright
const CHROMIUM_EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Default durations per slide type (seconds)
const TYPE_DURATION = { cover: 3.5, step: 3.0, stat: 3.2, cta: 3.5 };

// ─── helpers ─────────────────────────────────────────────────────────────────

function pad(n, w = 4) { return String(n).padStart(w, '0'); }

function duration(slide) {
  return slide.duration ?? TYPE_DURATION[slide.type] ?? 3.0;
}

// ─── per-slide renderer ───────────────────────────────────────────────────────
async function renderSlide(browser, slidePath, slideNum, dur) {
  const totalFrames = Math.round(dur * FPS);
  const framesDir   = path.join(FRAMES_ROOT, `slide-${pad(slideNum, 2)}`);
  fs.mkdirSync(framesDir, { recursive: true });

  console.log(`\n  slide-${pad(slideNum, 2)}  [${dur}s → ${totalFrames} frames]`);

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1080, height: 1350 });

  const failed = [];

  for (let f = 0; f < totalFrames; f++) {
    const t         = (f / FPS).toFixed(5);
    const frameFile = path.join(framesDir, `frame-${pad(f)}.png`);
    const url       = `file://${slidePath}?t=${t}`;
    let   ok        = false;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
        await page.waitForFunction(
          () => document.title === '__FRAME_READY__',
          { timeout: FRAME_TIMEOUT }
        );
        await page.screenshot({ path: frameFile, type: 'png', fullPage: false });
        ok = true;
        break;
      } catch (_) {
        if (attempt === MAX_RETRIES - 1) failed.push(f);
      }
    }

    if (!ok) process.stdout.write(`    ⚠ frame ${f} failed\n`);
    if (f % FPS === 0) process.stdout.write(`    ${f}/${totalFrames} frames\r`);
  }

  process.stdout.write('\n');

  // Retry pass for dropped frames
  if (failed.length > 0) {
    console.log(`    retry pass: ${failed.length} frames`);
    for (const f of failed) {
      const t         = (f / FPS).toFixed(5);
      const frameFile = path.join(framesDir, `frame-${pad(f)}.png`);
      try {
        await page.goto(`file://${slidePath}?t=${t}`, { waitUntil: 'domcontentloaded', timeout: 8000 });
        await page.waitForFunction(() => document.title === '__FRAME_READY__', { timeout: FRAME_TIMEOUT });
        await page.screenshot({ path: frameFile, type: 'png', fullPage: false });
      } catch (_) {
        console.warn(`    ✗ frame ${f} permanently failed — will produce a blank frame`);
        // Write blank frame so ffmpeg sequence is unbroken
        if (!fs.existsSync(frameFile)) {
          execSync(`ffmpeg -y -f lavfi -i color=black:s=1080x1350 -frames:v 1 "${frameFile}" 2>/dev/null`);
        }
      }
    }
  }

  await page.close();

  // Encode to MP4
  const outMp4 = path.join(OUTPUT_DIR, `slide-${pad(slideNum, 2)}.mp4`);
  console.log(`    encoding → ${path.basename(outMp4)}`);

  execSync([
    'ffmpeg -y',
    `-framerate ${FPS}`,
    `-i "${framesDir}/frame-%04d.png"`,
    '-c:v libx264 -preset fast -crf 18',
    '-pix_fmt yuv420p',
    `-vf "scale=1080:1350"`,
    `"${outMp4}"`
  ].join(' '), { stdio: 'pipe' });

  console.log(`    ✓  ${outMp4}`);
  return outMp4;
}

// ─── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error('Usage: node render.js <config.json>');
    process.exit(1);
  }

  const config     = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const slideFiles = fs.readdirSync(SLIDES_DIR)
    .filter(f => f.match(/^slide-\d+\.html$/))
    .sort();

  if (slideFiles.length === 0) {
    console.error('No slides found. Run: node gen.js <config.json> first.');
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(FRAMES_ROOT, { recursive: true });

  console.log(`\n=== Rendering ${slideFiles.length} slides at ${FPS}fps ===`);

  const browser = await chromium.launch({
    executablePath: CHROMIUM_EXE,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--allow-file-access-from-files',
      '--force-device-scale-factor=1',
      '--hide-scrollbars',
      '--disable-background-networking',
    ]
  });

  const outputs = [];
  for (let i = 0; i < slideFiles.length; i++) {
    const slidePath  = path.join(SLIDES_DIR, slideFiles[i]);
    const slideConf  = config.slides?.[i] ?? {};
    const dur        = duration(slideConf);
    outputs.push(await renderSlide(browser, slidePath, i + 1, dur));
  }

  await browser.close();

  console.log('\n=== Done ===');
  console.log('MP4s:');
  outputs.forEach(p => console.log(`  ${p}`));
}

main().catch(err => { console.error(err); process.exit(1); });
