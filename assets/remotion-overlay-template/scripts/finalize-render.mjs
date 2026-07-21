#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";

const intermediatePath = path.resolve("output/explainer-video-remotion.mp4");
const finalPath = path.resolve("output/explainer-video.mp4");

const result = spawnSync("ffmpeg", [
  "-y",
  "-i",
  intermediatePath,
  "-vf",
  "scale=in_range=full:out_range=tv,format=yuv420p",
  "-c:v",
  "libx264",
  "-preset",
  "medium",
  "-crf",
  "18",
  "-pix_fmt",
  "yuv420p",
  "-color_range",
  "tv",
  "-c:a",
  "aac",
  "-movflags",
  "+faststart",
  finalPath,
], {stdio: "inherit"});

if (result.error) {
  console.error(`Could not run FFmpeg: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error("FFmpeg finalization failed; keeping the Remotion intermediate for diagnosis.");
  process.exit(result.status ?? 1);
}

fs.rmSync(intermediatePath, {force: true});
console.log(`Final video: ${finalPath}`);
console.log("Removed the Remotion intermediate after successful finalization.");
