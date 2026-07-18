#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";

const args = parseArgs(process.argv.slice(2));
const projectPath = path.resolve(args.projectPath ?? "src/project.json");
const entry = args.entry ?? "src/index.ts";
const composition = args.composition ?? "ExplainerVideo";
const outDir = path.resolve(args.outDir ?? "output/qa/layout");
const project = JSON.parse(fs.readFileSync(projectPath, "utf8"));
const remotionBin = localBin("remotion");

fs.mkdirSync(outDir, {recursive: true});

let startFrame = 0;
const rendered = [];
for (const [index, scene] of (project.scenes ?? []).entries()) {
  const durationFrames = Math.max(1, Math.round(scene.durationSeconds * project.fps));
  const frame = startFrame + Math.max(0, durationFrames - Math.round(project.fps * 0.35));
  startFrame += durationFrames;
  const outputPath = path.join(outDir, `layout-scene-${String(index + 1).padStart(2, "0")}.png`);
  const result = spawnSync(remotionBin, [
    "still",
    entry,
    composition,
    outputPath,
    `--frame=${frame}`,
  ], {stdio: "inherit", shell: process.platform === "win32"});
  if (result.error) {
    console.error(`Could not run Remotion at ${remotionBin}: ${result.error.message}`);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
  rendered.push({sceneId: scene.id, frame, outputPath});
}

if (rendered.length > 0) {
  const columns = Math.ceil(Math.sqrt(rendered.length));
  const rows = Math.ceil(rendered.length / columns);
  const contactPath = path.join(outDir, "layout-contact-sheet.png");
  const ffmpeg = spawnSync("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-framerate",
    "1",
    "-i",
    path.join(outDir, "layout-scene-%02d.png"),
    "-vf",
    `scale=480:-1,tile=${columns}x${rows}:padding=12:margin=12:color=0xF7F3E8`,
    "-frames:v",
    "1",
    contactPath,
  ], {stdio: "inherit"});
  if (ffmpeg.status !== 0) process.exit(ffmpeg.status ?? 1);
  console.log(`Layout stills: ${rendered.length} scenes`);
  console.log(`Contact sheet: ${contactPath}`);
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--project") parsed.projectPath = argv[++index];
    else if (arg === "--entry") parsed.entry = argv[++index];
    else if (arg === "--composition") parsed.composition = argv[++index];
    else if (arg === "--out-dir") parsed.outDir = argv[++index];
    else if (arg === "--help" || arg === "-h") {
      console.error("Usage: node scripts/render-layout-stills.mjs [--project src/project.json] [--out-dir output/qa/layout]");
      process.exit(0);
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }
  return parsed;
}

function localBin(name) {
  const executable = process.platform === "win32" ? `${name}.cmd` : name;
  const candidate = path.resolve("node_modules", ".bin", executable);
  if (fs.existsSync(candidate)) return candidate;
  return process.platform === "win32" ? "npx.cmd" : "npx";
}
