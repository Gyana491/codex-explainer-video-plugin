#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

if (process.platform === "win32" && process.arch === "arm64") {
  const candidates = [
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "CodexTools", "node-x64", "node.exe"),
    "C:\\tools\\node-x64\\node.exe",
  ].filter(Boolean);
  const found = candidates.find((p) => fs.existsSync(p));
  console.error(
    [
      "Remotion does not publish its native compositor for Windows ARM64.",
      "Run this template with the x64 build of Node.js under Windows emulation,",
      "or route artwork-only scenes through the plugin's FFmpeg-only path.",
      "Current runtime: win32 arm64",
      found
        ? `Found an x64 Node build at ${found} — prepend its directory to PATH and retry.`
        : `No x64 Node build found at the usual locations (${candidates.join(", ")}). Install one and prepend its directory to PATH.`,
    ].join("\n"),
  );
  process.exit(1);
}

console.log(`Remotion runtime supported: ${process.platform} ${process.arch}`);

