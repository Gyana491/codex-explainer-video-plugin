#!/usr/bin/env node
// Copy the bundled Remotion overlay template into a project directory and make
// its dependencies available without a per-project npm install.
// Usage: node scripts/prepare-overlay-project.mjs <destinationDir>

import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";

const templateDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)),
  "..", "assets", "remotion-overlay-template");
const dest = process.argv[2];
if (!dest) {
  console.error("usage: node scripts/prepare-overlay-project.mjs <destinationDir>");
  process.exit(1);
}

const SKIP = new Set(["node_modules", "output", "package-lock.json"]);

function copyDir(from, to) {
  fs.mkdirSync(to, {recursive: true});
  for (const entry of fs.readdirSync(from, {withFileTypes: true})) {
    if (SKIP.has(entry.name)) continue;
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

copyDir(templateDir, path.resolve(dest));
// lock file is needed for npm ci fallback
fs.copyFileSync(path.join(templateDir, "package-lock.json"),
  path.join(dest, "package-lock.json"));

const templateModules = path.join(templateDir, "node_modules");
const destModules = path.join(path.resolve(dest), "node_modules");

if (fs.existsSync(templateModules)) {
  const linkType = process.platform === "win32" ? "junction" : "dir";
  fs.symlinkSync(templateModules, destModules, linkType);
  console.log(`Linked node_modules -> ${templateModules} (${linkType})`);
} else {
  console.log("Template has no node_modules; running npm ci (one-time)...");
  const r = spawnSync("npm", ["ci", "--prefer-offline"],
    {cwd: templateDir, stdio: "inherit", shell: process.platform === "win32"});
  if (r.status !== 0) process.exit(r.status ?? 1);
  const linkType = process.platform === "win32" ? "junction" : "dir";
  fs.symlinkSync(templateModules, destModules, linkType);
  console.log(`Installed once in template, linked into project (${linkType}).`);
}
console.log(`Project ready: ${path.resolve(dest)}`);
