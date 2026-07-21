#!/usr/bin/env node
// Key a flat chroma-key background out of one cropped cutout cell, producing a
// transparent PNG for use as a Remotion overlay asset.
// Usage: node scripts/extract-cutouts.mjs <input.png> <output.png> [--color 0xFF00FF] [--similarity 0.12] [--blend 0.06]

import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";

const args = process.argv.slice(2);
const positional = [];
const options = {color: "0xFF00FF", similarity: 0.12, blend: 0.06};
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--color") options.color = args[++i];
  else if (arg === "--similarity") options.similarity = Number(args[++i]);
  else if (arg === "--blend") options.blend = Number(args[++i]);
  else positional.push(arg);
}
const [input, output] = positional;
if (!input || !output) {
  console.error("usage: node scripts/extract-cutouts.mjs <input.png> <output.png> [--color 0xFF00FF] [--similarity 0.12] [--blend 0.06]");
  process.exit(1);
}
if (!fs.existsSync(input)) {
  console.error(`input not found: ${input}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(path.resolve(output)), {recursive: true});

const filter = `colorkey=color=${options.color}:similarity=${options.similarity}:blend=${options.blend},format=rgba`;
const render = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", input, "-vf", filter, "-frames:v", "1", output],
  {encoding: "utf8"});
if (render.status !== 0) {
  console.error(`ffmpeg failed: ${render.stderr || render.stdout}`);
  process.exit(1);
}

const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
  "-show_entries", "stream=pix_fmt,width,height", "-of", "json", output], {encoding: "utf8"});
if (probe.status !== 0) {
  console.error(`ffprobe could not inspect ${output}: ${probe.stderr}`);
  process.exit(1);
}
const stream = JSON.parse(probe.stdout).streams?.[0];
if (!stream || !/a$/.test(stream.pix_fmt ?? "")) {
  console.error(`warning: ${output} has pixel format "${stream?.pix_fmt}" — no alpha channel, chroma key likely failed`);
  process.exit(1);
}

const alphaBytes = spawnSync("ffmpeg", ["-v", "error", "-i", output, "-vf", "alphaextract",
  "-f", "rawvideo", "-pix_fmt", "gray", "-"], {encoding: null});
if (alphaBytes.status !== 0 || !alphaBytes.stdout?.length) {
  console.error(`could not read alpha channel of ${output}: ${alphaBytes.stderr}`);
  process.exit(1);
}
let alphaSum = 0;
for (const byte of alphaBytes.stdout) alphaSum += byte;
const yavg = alphaSum / alphaBytes.stdout.length;
if (yavg > 250) {
  console.error(`warning: ${output} alpha channel averages ${yavg.toFixed(1)}/255 — nearly fully opaque, chroma key likely did not match the background`);
  process.exit(1);
}

console.log(`Extracted ${stream.width}x${stream.height} cutout: ${output}`);
