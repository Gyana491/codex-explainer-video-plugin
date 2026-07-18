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
const allowedCoordinateSpaces = new Set(["screen", "artwork"]);
const allowedAssetFits = new Set(["contain", "cover", "fill"]);
const allowedPlacements = new Set([
  "above",
  "below",
  "left",
  "right",
  "near",
  "inside",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
]);

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
  for (const [objectIndex, object] of (scene.objects ?? []).entries()) {
    const objectLocation = `${location}.objects[${objectIndex}]`;
    if (!object.id) errors.push(`${objectLocation}.id is required`);
    if (!Array.isArray(object.bbox) || object.bbox.length !== 4) {
      errors.push(`${objectLocation}.bbox must be [x1, y1, x2, y2]`);
    } else {
      object.bbox.forEach((value, bboxIndex) => checkUnit(value, `${objectLocation}.bbox[${bboxIndex}]`, errors));
      if (object.bbox[2] <= object.bbox[0]) errors.push(`${objectLocation}.bbox x2 must be greater than x1`);
      if (object.bbox[3] <= object.bbox[1]) errors.push(`${objectLocation}.bbox y2 must be greater than y1`);
    }
  }
  const overlay = scene.overlay;
  if (!overlay) continue;
  if (!allowedStrategies.has(overlay.strategy)) errors.push(`${location}.overlay.strategy is unsupported`);

  const ids = new Set();
  const groupIds = new Set();
  const objectIds = new Set((scene.objects ?? []).map((object) => object.id));
  const intentReferences = [];
  for (const [groupIndex, group] of (overlay.groups ?? []).entries()) {
    const groupLocation = `${location}.overlay.groups[${groupIndex}]`;
    if (!group.id || ids.has(group.id)) errors.push(`${groupLocation}.id must be present and unique`);
    ids.add(group.id);
    groupIds.add(group.id);
    if (group.placement !== undefined && !allowedPlacements.has(group.placement)) {
      errors.push(`${groupLocation}.placement is unsupported`);
    }
    if (group.coordinateSpace !== undefined && !allowedCoordinateSpaces.has(group.coordinateSpace)) {
      errors.push(`${groupLocation}.coordinateSpace is unsupported`);
    }
    if (group.bbox !== undefined) checkBox(group.bbox, `${groupLocation}.bbox`, errors);
    if (group.offsetX !== undefined) checkSignedUnit(group.offsetX, `${groupLocation}.offsetX`, errors);
    if (group.offsetY !== undefined) checkSignedUnit(group.offsetY, `${groupLocation}.offsetY`, errors);
    if (group.zIndex !== undefined && !Number.isFinite(group.zIndex)) errors.push(`${groupLocation}.zIndex must be finite`);
  }
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
    checkIntent(text.intent, `${textLocation}.intent`, errors);
    checkLayer(text, textLocation, groupIds, errors);
    if (text.intent?.target) intentReferences.push({target: text.intent.target, location: `${textLocation}.intent.target`});
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
    checkIntent(shape.intent, `${shapeLocation}.intent`, errors);
    checkLayer(shape, shapeLocation, groupIds, errors);
    if (shape.intent?.target) intentReferences.push({target: shape.intent.target, location: `${shapeLocation}.intent.target`});
  }

  for (const [assetIndex, asset] of (overlay.assets ?? []).entries()) {
    const assetLocation = `${location}.overlay.assets[${assetIndex}]`;
    if (!asset.id || ids.has(asset.id)) errors.push(`${assetLocation}.id must be present and unique`);
    ids.add(asset.id);
    if (!asset.src?.trim()) errors.push(`${assetLocation}.src is required`);
    checkUnit(asset.x, `${assetLocation}.x`, errors);
    checkUnit(asset.y, `${assetLocation}.y`, errors);
    checkUnit(asset.width, `${assetLocation}.width`, errors);
    checkUnit(asset.height, `${assetLocation}.height`, errors);
    if (asset.width <= 0) errors.push(`${assetLocation}.width must be greater than zero`);
    if (asset.height <= 0) errors.push(`${assetLocation}.height must be greater than zero`);
    if (asset.opacity !== undefined) checkUnit(asset.opacity, `${assetLocation}.opacity`, errors);
    if (asset.fit !== undefined && !allowedAssetFits.has(asset.fit)) errors.push(`${assetLocation}.fit is unsupported`);
    checkIntent(asset.intent, `${assetLocation}.intent`, errors);
    checkLayer(asset, assetLocation, groupIds, errors);
    if (asset.intent?.target) intentReferences.push({target: asset.intent.target, location: `${assetLocation}.intent.target`});
  }

  for (const [groupIndex, group] of (overlay.groups ?? []).entries()) {
    if (group.anchorTo && !objectIds.has(group.anchorTo) && !ids.has(group.anchorTo)) {
      errors.push(`${location}.overlay.groups[${groupIndex}].anchorTo does not match a scene object or overlay element`);
    }
  }
  for (const reference of intentReferences) {
    if (!objectIds.has(reference.target) && !ids.has(reference.target)) {
      errors.push(`${reference.location} does not match a scene object or overlay element`);
    }
  }

  for (const [cueIndex, cue] of (overlay.animationCues ?? []).entries()) {
    const cueLocation = `${location}.overlay.animationCues[${cueIndex}]`;
    if (!allowedActions.has(cue.action)) errors.push(`${cueLocation}.action is unsupported`);
    if (!ids.has(cue.target)) errors.push(`${cueLocation}.target does not match an overlay element`);
    if (cue.startProgress === undefined && cue.startSeconds === undefined) {
      errors.push(`${cueLocation} requires startProgress or startSeconds`);
    }
    if (cue.startProgress !== undefined && cue.startSeconds !== undefined) {
      errors.push(`${cueLocation} cannot set both startProgress and startSeconds`);
    }
    if (cue.startProgress !== undefined) checkUnit(cue.startProgress, `${cueLocation}.startProgress`, errors);
    if (cue.startSeconds !== undefined) {
      if (!Number.isFinite(cue.startSeconds) || cue.startSeconds < 0 || cue.startSeconds > scene.durationSeconds) {
        errors.push(`${cueLocation}.startSeconds must be within the scene duration`);
      }
    }
    if (!Number.isFinite(cue.durationSeconds) || cue.durationSeconds <= 0) {
      errors.push(`${cueLocation}.durationSeconds must be positive`);
    }
    if (cue.offsetX !== undefined) checkSignedUnit(cue.offsetX, `${cueLocation}.offsetX`, errors);
    if (cue.offsetY !== undefined) checkSignedUnit(cue.offsetY, `${cueLocation}.offsetY`, errors);
    if (cue.action === "move" && cue.offsetX === undefined && cue.offsetY === undefined) {
      errors.push(`${cueLocation}.move requires offsetX or offsetY`);
    }
  }
  if ((overlay.animationCues ?? []).length > 8) warnings.push(`${location} has more than eight animation cues`);
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

function checkSignedUnit(value, location, output) {
  if (!Number.isFinite(value) || value < -1 || value > 1) output.push(`${location} must be between -1 and 1`);
}

function checkBox(value, location, output) {
  if (!Array.isArray(value) || value.length !== 4) {
    output.push(`${location} must be [x1, y1, x2, y2]`);
    return;
  }
  value.forEach((coordinate, index) => checkUnit(coordinate, `${location}[${index}]`, output));
  if (value[2] <= value[0]) output.push(`${location} x2 must be greater than x1`);
  if (value[3] <= value[1]) output.push(`${location} y2 must be greater than y1`);
}

function checkLayer(element, location, groupIds, output) {
  if (element.groupId !== undefined && !groupIds.has(element.groupId)) {
    output.push(`${location}.groupId does not match an overlay group`);
  }
  if (element.coordinateSpace !== undefined && !allowedCoordinateSpaces.has(element.coordinateSpace)) {
    output.push(`${location}.coordinateSpace is unsupported`);
  }
  if (element.zIndex !== undefined && !Number.isFinite(element.zIndex)) output.push(`${location}.zIndex must be finite`);
}

function checkIntent(intent, location, output) {
  if (intent === undefined) return;
  if (typeof intent !== "object" || Array.isArray(intent)) {
    output.push(`${location} must be an object`);
    return;
  }
  if (intent.placement !== undefined && !allowedPlacements.has(intent.placement)) {
    output.push(`${location}.placement is unsupported`);
  }
  if (intent.avoid !== undefined && !Array.isArray(intent.avoid)) output.push(`${location}.avoid must be an array`);
  if (intent.maxDistance !== undefined) checkUnit(intent.maxDistance, `${location}.maxDistance`, output);
}

