#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node validate-overlay-storyboard.mjs <project.json>");
  process.exit(2);
}

const project = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
const errors = [];
const warnings = [];
const allowedStrategies = new Set([
  "artwork-only",
  "kinetic-text",
  "diagram",
  "chart",
  "equation",
  "artwork-with-overlays",
]);
const allowedShapes = new Set(["circle", "rounded-rect", "line", "arrow", "progress-bar"]);
const allowedActions = new Set(["reveal", "draw", "grow", "count", "move", "pulse", "highlight"]);

if (!Number.isFinite(project.fps) || project.fps <= 0) errors.push("fps must be positive");
if (!Number.isFinite(project.width) || project.width <= 0) errors.push("width must be positive");
if (!Number.isFinite(project.height) || project.height <= 0) errors.push("height must be positive");
if (!project.audioPath) errors.push("audioPath is required");
if (!Array.isArray(project.scenes) || project.scenes.length === 0) errors.push("at least one scene is required");
if (project.scenes?.length > 24) errors.push("scene count exceeds the 24-scene maximum");

let totalDuration = 0;
for (const [index, scene] of (project.scenes ?? []).entries()) {
  const location = `scenes[${index}]`;
  if (!scene.id) errors.push(`${location}.id is required`);
  if (!Number.isFinite(scene.durationSeconds) || scene.durationSeconds <= 0) {
    errors.push(`${location}.durationSeconds must be positive`);
  } else {
    totalDuration += scene.durationSeconds;
  }
  if (!scene.backgroundImage) errors.push(`${location}.backgroundImage is required`);
  const overlay = scene.overlay;
  if (!overlay) continue;
  if (!allowedStrategies.has(overlay.strategy)) errors.push(`${location}.overlay.strategy is unsupported`);

  const ids = new Set();
  for (const [textIndex, text] of (overlay.essentialText ?? []).entries()) {
    const textLocation = `${location}.overlay.essentialText[${textIndex}]`;
    if (!text.id || ids.has(text.id)) errors.push(`${textLocation}.id must be present and unique`);
    ids.add(text.id);
    if (!text.text?.trim()) errors.push(`${textLocation}.text is required`);
    const wordCount = text.text?.trim().split(/\s+/).length ?? 0;
    if (wordCount > 12) errors.push(`${textLocation}.text exceeds 12 words`);
    else if (wordCount > 6) warnings.push(`${textLocation}.text exceeds the preferred 6 words`);
    checkUnit(text.x, `${textLocation}.x`, errors);
    checkUnit(text.y, `${textLocation}.y`, errors);
    if (text.maxWidth !== undefined) checkUnit(text.maxWidth, `${textLocation}.maxWidth`, errors);
  }

  for (const [shapeIndex, shape] of (overlay.shapes ?? []).entries()) {
    const shapeLocation = `${location}.overlay.shapes[${shapeIndex}]`;
    if (!shape.id || ids.has(shape.id)) errors.push(`${shapeLocation}.id must be present and unique`);
    ids.add(shape.id);
    if (!allowedShapes.has(shape.type)) errors.push(`${shapeLocation}.type is unsupported`);
    checkUnit(shape.x, `${shapeLocation}.x`, errors);
    checkUnit(shape.y, `${shapeLocation}.y`, errors);
    if (["line", "arrow"].includes(shape.type)) {
      checkUnit(shape.x2, `${shapeLocation}.x2`, errors);
      checkUnit(shape.y2, `${shapeLocation}.y2`, errors);
    } else {
      checkUnit(shape.width, `${shapeLocation}.width`, errors);
      checkUnit(shape.height, `${shapeLocation}.height`, errors);
    }
  }

  for (const [cueIndex, cue] of (overlay.animationCues ?? []).entries()) {
    const cueLocation = `${location}.overlay.animationCues[${cueIndex}]`;
    if (!allowedActions.has(cue.action)) errors.push(`${cueLocation}.action is unsupported`);
    if (!ids.has(cue.target)) errors.push(`${cueLocation}.target does not match an overlay element`);
    checkUnit(cue.startProgress, `${cueLocation}.startProgress`, errors);
    if (!Number.isFinite(cue.durationSeconds) || cue.durationSeconds <= 0) {
      errors.push(`${cueLocation}.durationSeconds must be positive`);
    }
  }
  if ((overlay.animationCues ?? []).length > 5) warnings.push(`${location} has more than five animation cues`);
}

if (Number.isFinite(project.voiceoverDurationSeconds)) {
  const drift = Math.abs(totalDuration - project.voiceoverDurationSeconds);
  if (drift > 0.25) errors.push(`scene duration total differs from voiceover by ${drift.toFixed(3)} seconds`);
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}
console.log(`Valid overlay storyboard: ${project.scenes.length} scenes, ${totalDuration.toFixed(3)} seconds`);

function checkUnit(value, location, output) {
  if (!Number.isFinite(value) || value < 0 || value > 1) output.push(`${location} must be between 0 and 1`);
}

