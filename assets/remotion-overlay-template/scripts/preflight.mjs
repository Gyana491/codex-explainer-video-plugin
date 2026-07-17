#!/usr/bin/env node

if (process.platform === "win32" && process.arch === "arm64") {
  console.error(
    [
      "Remotion does not publish its native compositor for Windows ARM64.",
      "Run this template with the x64 build of Node.js under Windows emulation,",
      "or route artwork-only scenes through the plugin's FFmpeg-only path.",
      "Current runtime: win32 arm64",
    ].join("\n"),
  );
  process.exit(1);
}

console.log(`Remotion runtime supported: ${process.platform} ${process.arch}`);

