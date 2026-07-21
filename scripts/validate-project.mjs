#!/usr/bin/env node
// Deterministic post-build gate for an explainer video project directory.
// Usage: node scripts/validate-project.mjs [projectRoot] [--json report.json]

import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";

const args = process.argv.slice(2);
let root = ".";
let jsonOut = null;
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--json") jsonOut = args[++i];
  else root = args[i];
}
const R = (...p) => path.join(root, ...p);
const findings = [];
const pass = [];
const check = (name, ok, detail) => (ok ? pass.push(name) : findings.push({name, detail}));

function ffprobe(entries, file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", entries,
    "-of", "json", file], {encoding: "utf8"});
  if (r.status !== 0) return null;
  try { return JSON.parse(r.stdout); } catch { return null; }
}
const mediaDuration = (file) => {
  const d = ffprobe("format=duration", file);
  return d ? Number(d.format?.duration) : null;
};
const imageSize = (file) => {
  const d = ffprobe("stream=width,height", file);
  const s = d?.streams?.[0];
  return s ? [Number(s.width), Number(s.height)] : null;
};
const readJson = (file) => {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }
};

// 1. Geometry manifest
const geo = readJson(R("output", "storyboard-geometry.json"));
check("geometry-manifest-exists", !!geo, "output/storyboard-geometry.json missing or unparsable");
if (geo) {
  const m = geo.master ?? {};
  check("master-4:3", m.width * 3 === m.height * 4, `master ${m.width}x${m.height}`);
  check("master-ratio-verified", m.ratio_verified === true, "ratio_verified not true");
  for (const slot of geo.slots ?? []) {
    check(`slot-${slot.slot}-16:9`, slot.width * 9 === slot.height * 16,
      `slot ${slot.slot} is ${slot.width}x${slot.height}`);
  }
}

// 2. Scene images: contiguous, count matches, exact 16:9
const sceneDir = R("assets", "scenes");
const sceneFiles = fs.existsSync(sceneDir)
  ? fs.readdirSync(sceneDir).filter((f) => /^scene-\d+\.png$/i.test(f)).sort()
  : [];
check("scene-images-exist", sceneFiles.length > 0, "no assets/scenes/scene-NN.png files");
const declaredCount = geo?.grid?.scene_count;
if (declaredCount !== undefined) {
  check("scene-count-matches-geometry", sceneFiles.length === declaredCount,
    `${sceneFiles.length} images vs geometry scene_count ${declaredCount}`);
}
sceneFiles.forEach((f, i) => {
  const n = Number(f.match(/\d+/)[0]);
  check(`scene-file-contiguous-${f}`, n === i + 1, `expected scene-${String(i + 1).padStart(2, "0")}`);
  const size = imageSize(path.join(sceneDir, f));
  check(`scene-image-16:9-${f}`, !!size && size[0] * 9 === size[1] * 16,
    size ? `${size[0]}x${size[1]}` : "unreadable");
});

// 3. Per-scene audio pairing
const audioDir = R("assets", "audio", "scenes");
const audioFiles = fs.existsSync(audioDir)
  ? fs.readdirSync(audioDir).filter((f) => /^scene-\d+\.(mp3|wav)$/i.test(f)).sort()
  : [];
check("audio-image-pairing", audioFiles.length === sceneFiles.length,
  `${audioFiles.length} audio vs ${sceneFiles.length} images`);

// 4. Scene timings: start 0, contiguous, monotonic, per_scene_audio
const timings = readJson(R("output", "scene-timings.json"));
check("scene-timings-exist", !!timings, "output/scene-timings.json missing");
const scenes = timings?.scenes ?? timings ?? [];
if (Array.isArray(scenes) && scenes.length) {
  check("timings-start-zero", Math.abs(scenes[0].start_seconds) < 1e-6,
    `first start ${scenes[0].start_seconds}`);
  for (let i = 1; i < scenes.length; i += 1) {
    check(`timings-contiguous-${i}`,
      Math.abs(scenes[i].start_seconds - scenes[i - 1].end_seconds) < 1e-3,
      `scene ${i + 1} starts ${scenes[i].start_seconds}, previous ends ${scenes[i - 1].end_seconds}`);
  }
  check("timings-source", scenes.every((s) => s.timing_source === "per_scene_audio"),
    "not all timing_source=per_scene_audio");
  // 5. Concatenated narration duration vs sum
  const sum = scenes.reduce((a, s) => a + (s.end_seconds - s.start_seconds), 0);
  const vo = mediaDuration(R("assets", "audio", "voiceover.mp3"));
  check("voiceover-exists", vo !== null, "assets/audio/voiceover.mp3 missing/unreadable");
  if (vo !== null) {
    check("voiceover-duration-matches", Math.abs(vo - sum) <= 0.05,
      `voiceover ${vo.toFixed(3)}s vs scene sum ${sum.toFixed(3)}s`);
  }
  // 6. Final video duration vs audio
  const video = R("output", "explainer-video.mp4");
  if (fs.existsSync(video)) {
    const vd = mediaDuration(video);
    check("video-duration-matches-audio", vd !== null && vo !== null && Math.abs(vd - vo) <= 0.1,
      `video ${vd}s vs audio ${vo}s`);
  }
}

// 7. Voice config
check("voice-config-exists", !!readJson(R("output", "voice-config.json")),
  "output/voice-config.json missing");

// 8. Word timings (optional file, hard rules if present)
const wt = readJson(R("output", "word-timings.json"));
if (wt) {
  const words = wt.words ?? wt;
  let ordered = true;
  for (let i = 1; i < words.length; i += 1) {
    if (words[i].start_seconds < words[i - 1].start_seconds - 1e-3) ordered = false;
  }
  check("word-timings-ordered", ordered, "word start times not monotonic");
}

const report = {passed: pass.length, failed: findings.length, findings};
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2) + "\n");
for (const f of findings) console.error(`FAIL ${f.name}: ${f.detail}`);
console.log(`${pass.length} checks passed, ${findings.length} failed`);
process.exit(findings.length ? 1 : 0);
