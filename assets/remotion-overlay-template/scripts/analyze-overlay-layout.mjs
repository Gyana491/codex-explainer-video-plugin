#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const ROLE_HEIGHTS = {
  title: 0.105,
  label: 0.06,
  value: 0.095,
  definition: 0.085,
  equation: 0.095,
  takeaway: 0.095,
};

const DEFAULT_OPTIONS = {
  sampleWidth: 320,
  failOn: "none",
  apply: false,
  applyAll: false,
  moveThreshold: 0.03,
  textAvgWarn: 0.115,
  textInkWarn: 0.16,
  textAvgError: 0.18,
  textInkError: 0.27,
  shapeAvgWarn: 0.2,
  shapeInkWarn: 0.32,
  captionSafeBottom: 0.14,
  marginX: 0.04,
  marginY: 0.06,
};

const args = parseArgs(process.argv.slice(2));
if (!args.projectPath) {
  usage();
  process.exit(2);
}

const projectPath = path.resolve(args.projectPath);
const projectDir = path.dirname(projectPath);
const publicDir = path.resolve(args.publicDir ?? path.join(projectDir, "..", "public"));
const options = {...DEFAULT_OPTIONS, ...args.options};
const project = JSON.parse(fs.readFileSync(projectPath, "utf8"));
let report = analyzeProject(project, projectPath, publicDir, options);

if (options.apply) {
  const appliedMoves = applyMoves(project, report, options);
  if (appliedMoves.length > 0) {
    fs.writeFileSync(projectPath, `${JSON.stringify(project, null, 2)}\n`);
    report = analyzeProject(project, projectPath, publicDir, options);
  }
  report.appliedMoves = appliedMoves;
}

printReport(report);
if (args.jsonPath) {
  fs.mkdirSync(path.dirname(path.resolve(args.jsonPath)), {recursive: true});
  fs.writeFileSync(path.resolve(args.jsonPath), JSON.stringify(report, null, 2));
}

const hasErrors = report.findings.some((finding) => finding.severity === "error");
const hasWarnings = report.findings.some((finding) => finding.severity === "warning");
if (options.failOn === "error" && hasErrors) process.exit(1);
if (options.failOn === "warning" && (hasErrors || hasWarnings)) process.exit(1);

function parseArgs(argv) {
  const parsed = {options: {}};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--public-dir") parsed.publicDir = argv[++index];
    else if (arg === "--json") parsed.jsonPath = argv[++index];
    else if (arg === "--fail-on") parsed.options.failOn = argv[++index];
    else if (arg === "--sample-width") parsed.options.sampleWidth = Number(argv[++index]);
    else if (arg === "--apply") parsed.options.apply = true;
    else if (arg === "--apply-all") {
      parsed.options.apply = true;
      parsed.options.applyAll = true;
    }
    else if (arg === "--move-threshold") parsed.options.moveThreshold = Number(argv[++index]);
    else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else if (!parsed.projectPath) parsed.projectPath = arg;
    else throw new Error(`Unexpected argument: ${arg}`);
  }
  if (!["none", "warning", "error"].includes(parsed.options.failOn ?? "none")) {
    throw new Error("--fail-on must be one of: none, warning, error");
  }
  return parsed;
}

function usage() {
  console.error("Usage: node scripts/analyze-overlay-layout.mjs <project.json> [--public-dir public] [--json output/layout-report.json] [--apply] [--apply-all] [--fail-on none|warning|error]");
}

function analyzeProject(project, projectPath, publicDir, options) {
  const findings = [];
  const scenes = [];
  const width = project.width ?? 1920;
  const height = project.height ?? 1080;
  const sampleWidth = options.sampleWidth;
  const sampleHeight = Math.max(1, Math.round(sampleWidth * (height / width)));

  for (const [sceneIndex, scene] of (project.scenes ?? []).entries()) {
    const imagePath = path.resolve(publicDir, scene.backgroundImage ?? "");
    const sceneLocation = `scenes[${sceneIndex}]`;
    const sceneReport = {
      id: scene.id ?? sceneLocation,
      imagePath,
      elements: [],
      findings: [],
    };

    if (!fs.existsSync(imagePath)) {
      const finding = {
        severity: "error",
        sceneId: sceneReport.id,
        elementId: null,
        kind: "missing-image",
        message: `${sceneReport.id}: background image not found at ${imagePath}`,
      };
      findings.push(finding);
      sceneReport.findings.push(finding);
      scenes.push(sceneReport);
      continue;
    }

    const saliency = loadSaliency(imagePath, sampleWidth, sampleHeight);
    sceneReport.saliencyMode = saliency.mode;
    const layoutObjects = collectLayoutObjects(scene);
    const elements = collectElements(scene, width, height, layoutObjects);
    const textElements = elements.filter((element) => element.kind === "text");
    const context = {
      scene,
      sceneId: sceneReport.id,
      elements,
      textElements,
      layoutObjects,
      saliency,
      options,
    };

    for (const element of elements) {
      const metrics = saliency.query(element.bbox);
      const finding = classifyElement(sceneReport.id, element, metrics, options);
      const placement = element.kind === "text" ? planTextPlacement(element, context, finding) : null;
      const suggestions =
        element.kind === "text" ? placement?.suggestions ?? [] : [];
      const elementReport = {
        id: element.id,
        kind: element.kind,
        role: element.role,
        groupId: element.groupId ?? null,
        position: element.position ? roundPoint(element.position) : null,
        bbox: roundBox(element.bbox),
        saliency: roundMetrics(metrics),
        suggestions,
        recommendedMove: placement?.recommendedMove ?? null,
      };
      sceneReport.elements.push(elementReport);
      if (finding) {
        const completeFinding = {...finding, saliency: roundMetrics(metrics), suggestions};
        findings.push(completeFinding);
        sceneReport.findings.push(completeFinding);
      }
    }

    for (const finding of findTextOverlaps(sceneReport.id, textElements)) {
      findings.push(finding);
      sceneReport.findings.push(finding);
    }

      scenes.push(sceneReport);
  }

  return {
    tool: "analyze-overlay-layout",
    projectPath,
    publicDir,
    generatedAt: new Date().toISOString(),
    thresholds: {
      textAvgWarn: options.textAvgWarn,
      textInkWarn: options.textInkWarn,
      textAvgError: options.textAvgError,
      textInkError: options.textInkError,
    },
    summary: summarize(project, scenes, findings),
    scenes,
    findings,
  };
}

function applyMoves(project, report, options) {
  const moves = [];
  const movedGroups = new Set();
  const scenesById = new Map((project.scenes ?? []).map((scene) => [scene.id, scene]));
  for (const sceneReport of report.scenes ?? []) {
    const scene = scenesById.get(sceneReport.id);
    if (!scene?.overlay?.essentialText) continue;
    const textsById = new Map(scene.overlay.essentialText.map((text) => [text.id, text]));
    const groupsById = new Map((scene.overlay.groups ?? []).map((group) => [group.id, group]));
    for (const elementReport of sceneReport.elements ?? []) {
      const move = elementReport.recommendedMove;
      if (!move) continue;
      const text = textsById.get(elementReport.id);
      if (!text) continue;
      const finding = (sceneReport.findings ?? []).find((item) => item.elementId === text.id);
      const group = elementReport.groupId ? groupsById.get(elementReport.groupId) : null;
      const autoPlace = text.intent?.autoPlace === true || Boolean(group?.anchorTo) || options.applyAll;
      if (!finding && !autoPlace) continue;
      if (group) {
        const moveKey = `${scene.id}:${group.id}`;
        if (movedGroups.has(moveKey)) continue;
        const current = elementReport.position ?? {x: text.x, y: text.y};
        const deltaX = move.x - current.x;
        const deltaY = move.y - current.y;
        group.offsetX = round((group.offsetX ?? 0) + deltaX);
        group.offsetY = round((group.offsetY ?? 0) + deltaY);
        movedGroups.add(moveKey);
        moves.push({
          sceneId: scene.id,
          groupId: group.id,
          elementId: text.id,
          from: current,
          to: {x: move.x, y: move.y},
          reason: finding?.kind ?? "group-layout-intent",
        });
        continue;
      }
      moves.push({
        sceneId: scene.id,
        elementId: text.id,
        from: {x: text.x, y: text.y},
        to: {x: move.x, y: move.y},
        reason: finding?.kind ?? "layout-intent",
      });
      text.x = move.x;
      text.y = move.y;
    }
  }
  return moves;
}

function loadSaliency(imagePath, sampleWidth, sampleHeight) {
  if (path.extname(imagePath).toLowerCase() === ".svg") {
    return {
      mode: "vector-skipped",
      width: sampleWidth,
      height: sampleHeight,
      query(bbox) {
        const x1 = clamp(Math.floor(bbox.x1 * sampleWidth), 0, sampleWidth - 1);
        const y1 = clamp(Math.floor(bbox.y1 * sampleHeight), 0, sampleHeight - 1);
        const x2 = clamp(Math.ceil(bbox.x2 * sampleWidth), x1 + 1, sampleWidth);
        const y2 = clamp(Math.ceil(bbox.y2 * sampleHeight), y1 + 1, sampleHeight);
        return {avg: 0, inkRatio: 0, area: (x2 - x1) * (y2 - y1)};
      },
    };
  }
  const result = spawnSync("ffmpeg", [
    "-v",
    "error",
    "-i",
    imagePath,
    "-vf",
    `scale=${sampleWidth}:${sampleHeight}:flags=area,format=gray`,
    "-f",
    "rawvideo",
    "pipe:1",
  ], {encoding: null, maxBuffer: sampleWidth * sampleHeight * 4});

  if (result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString("utf8") : "";
    throw new Error(`ffmpeg could not decode ${imagePath}\n${stderr}`);
  }

  const pixels = result.stdout;
  if (pixels.length !== sampleWidth * sampleHeight) {
    throw new Error(`Unexpected decoded size for ${imagePath}: ${pixels.length} bytes`);
  }

  const sortedLuma = Array.from(pixels).sort((a, b) => a - b);
  const backgroundLuma = sortedLuma[Math.floor(sortedLuma.length * 0.85)] ?? 245;
  const darknessScale = Math.max(80, backgroundLuma);
  const salience = new Float64Array(sampleWidth * sampleHeight);
  for (let y = 0; y < sampleHeight; y += 1) {
    for (let x = 0; x < sampleWidth; x += 1) {
      const index = y * sampleWidth + x;
      const luma = pixels[index];
      const darkness = Math.max(0, (backgroundLuma - luma) / darknessScale);
      const right = pixels[y * sampleWidth + Math.min(sampleWidth - 1, x + 1)];
      const down = pixels[Math.min(sampleHeight - 1, y + 1) * sampleWidth + x];
      const gradient = (Math.abs(right - luma) + Math.abs(down - luma)) / 510;
      salience[index] = Math.min(1, Math.max(darkness, gradient * 1.6));
    }
  }

  const sum = new Float64Array((sampleWidth + 1) * (sampleHeight + 1));
  const ink = new Uint32Array((sampleWidth + 1) * (sampleHeight + 1));
  for (let y = 1; y <= sampleHeight; y += 1) {
    let rowSum = 0;
    let rowInk = 0;
    for (let x = 1; x <= sampleWidth; x += 1) {
      const value = salience[(y - 1) * sampleWidth + (x - 1)];
      rowSum += value;
      rowInk += value > 0.1 ? 1 : 0;
      const integralIndex = y * (sampleWidth + 1) + x;
      sum[integralIndex] = sum[integralIndex - sampleWidth - 1] + rowSum;
      ink[integralIndex] = ink[integralIndex - sampleWidth - 1] + rowInk;
    }
  }

  return {
    mode: "raster",
    width: sampleWidth,
    height: sampleHeight,
    query(bbox) {
      const x1 = clamp(Math.floor(bbox.x1 * sampleWidth), 0, sampleWidth - 1);
      const y1 = clamp(Math.floor(bbox.y1 * sampleHeight), 0, sampleHeight - 1);
      const x2 = clamp(Math.ceil(bbox.x2 * sampleWidth), x1 + 1, sampleWidth);
      const y2 = clamp(Math.ceil(bbox.y2 * sampleHeight), y1 + 1, sampleHeight);
      const area = (x2 - x1) * (y2 - y1);
      const total = rectIntegral(sum, sampleWidth + 1, x1, y1, x2, y2);
      const inkTotal = rectIntegral(ink, sampleWidth + 1, x1, y1, x2, y2);
      return {
        avg: total / area,
        inkRatio: inkTotal / area,
        area,
      };
    },
  };
}

function rectIntegral(integral, stride, x1, y1, x2, y2) {
  return integral[y2 * stride + x2] - integral[y1 * stride + x2] - integral[y2 * stride + x1] + integral[y1 * stride + x1];
}

function collectElements(scene, width, height, layoutObjects) {
  const overlay = scene.overlay ?? {};
  const elements = [];
  for (const text of overlay.essentialText ?? []) {
    elements.push({
      id: text.id,
      kind: "text",
      role: text.role,
      text: text.text,
      align: text.align ?? "center",
      maxWidth: text.maxWidth ?? 0.26,
      intent: text.intent ?? {},
      groupId: text.groupId,
      coordinateSpace: text.coordinateSpace ?? "screen",
      source: text,
      position: {x: text.x, y: text.y},
      bbox: textBox(text),
    });
  }
  for (const shape of overlay.shapes ?? []) {
    elements.push({
      id: shape.id,
      kind: "shape",
      role: shape.type,
      intent: shape.intent ?? {},
      groupId: shape.groupId,
      coordinateSpace: shape.coordinateSpace ?? "screen",
      source: shape,
      position: {x: shape.x, y: shape.y},
      bbox: shapeBox(shape, width, height),
    });
  }
  for (const asset of overlay.assets ?? []) {
    elements.push({
      id: asset.id,
      kind: "asset",
      role: "asset",
      intent: asset.intent ?? {},
      groupId: asset.groupId,
      coordinateSpace: asset.coordinateSpace ?? "screen",
      source: asset,
      position: {x: asset.x, y: asset.y},
      bbox: assetBox(asset),
    });
  }
  return resolveElementGroups(overlay, elements, layoutObjects);
}

function resolveElementGroups(overlay, elements, layoutObjects) {
  const elementBoxes = new Map(elements.map((element) => [element.id, element.bbox]));
  const objectBoxes = new Map(layoutObjects.map((object) => [object.id, object.bbox]));
  for (const group of overlay.groups ?? []) {
    const members = elements.filter((element) => element.groupId === group.id);
    if (members.length === 0) continue;
    const bounds = group.bbox ? normalizeBox({x1: group.bbox[0], y1: group.bbox[1], x2: group.bbox[2], y2: group.bbox[3]}) : unionBoxes(members.map((member) => member.bbox));
    const target = group.anchorTo ? objectBoxes.get(group.anchorTo) ?? elementBoxes.get(group.anchorTo) : null;
    const anchored = bounds && target ? groupPlacementOffset(bounds, target, group.placement ?? "near") : {dx: 0, dy: 0};
    const dx = anchored.dx + (group.offsetX ?? 0);
    const dy = anchored.dy + (group.offsetY ?? 0);
    for (const member of members) {
      member.bbox = translateBox(member.bbox, dx, dy);
      member.position = {x: member.position.x + dx, y: member.position.y + dy};
      member.coordinateSpace = member.source.coordinateSpace ?? group.coordinateSpace ?? (group.anchorTo ? "artwork" : "screen");
      member.intent = {
        ...member.intent,
        target: member.intent.target ?? group.anchorTo,
        placement: member.intent.placement ?? group.placement,
      };
    }
  }
  return elements;
}

function collectLayoutObjects(scene) {
  const objects = [];
  for (const object of scene.objects ?? []) {
    const bbox = normalizeBox({
      x1: object.bbox?.[0] ?? 0,
      y1: object.bbox?.[1] ?? 0,
      x2: object.bbox?.[2] ?? 0,
      y2: object.bbox?.[3] ?? 0,
    });
    objects.push({
      id: object.id,
      type: object.type ?? "object",
      avoid: object.avoid !== false,
      bbox,
      source: object,
    });
  }
  objects.push({
    id: "caption-safe-area",
    type: "caption",
    avoid: true,
    bbox: normalizeBox({x1: 0.14, y1: 0.82, x2: 0.86, y2: 0.98}),
    source: {id: "caption-safe-area", type: "caption"},
  });
  return objects;
}

function textBox(text) {
  const width = clamp(text.maxWidth ?? 0.26, 0.03, 1);
  const baseHeight = ROLE_HEIGHTS[text.role] ?? 0.075;
  const estimatedLines = Math.max(1, Math.ceil((text.text ?? "").length / Math.max(10, Math.round(width * 80))));
  const height = clamp(baseHeight * estimatedLines + (text.background ? 0.025 : 0.01), 0.035, 0.28);
  const align = text.align ?? "center";
  const x1 = align === "left" ? text.x : align === "right" ? text.x - width : text.x - width / 2;
  const x2 = x1 + width;
  const y1 = text.y - height / 2;
  const y2 = text.y + height / 2;
  return normalizeBox({x1, y1, x2, y2});
}

function shapeBox(shape, projectWidth, projectHeight) {
  const pad = Math.max(0.008, (shape.strokeWidth ?? 5) / 1000);
  if (shape.type === "line" || shape.type === "arrow") {
    return normalizeBox({
      x1: Math.min(shape.x, shape.x2 ?? shape.x) - pad * (projectHeight / projectWidth),
      y1: Math.min(shape.y, shape.y2 ?? shape.y) - pad,
      x2: Math.max(shape.x, shape.x2 ?? shape.x) + pad * (projectHeight / projectWidth),
      y2: Math.max(shape.y, shape.y2 ?? shape.y) + pad,
    });
  }
  if (shape.type === "progress-bar") {
    return normalizeBox({
      x1: shape.x - pad,
      y1: shape.y - pad,
      x2: shape.x + (shape.width ?? 0.1) + pad,
      y2: shape.y + (shape.height ?? 0.04) + pad,
    });
  }
  const width = shape.width ?? 0.1;
  const height = shape.height ?? 0.1;
  return normalizeBox({
    x1: shape.x - width / 2 - pad,
    y1: shape.y - height / 2 - pad,
    x2: shape.x + width / 2 + pad,
    y2: shape.y + height / 2 + pad,
  });
}

function assetBox(asset) {
  return normalizeBox({
    x1: asset.x - asset.width / 2,
    y1: asset.y - asset.height / 2,
    x2: asset.x + asset.width / 2,
    y2: asset.y + asset.height / 2,
  });
}

function unionBoxes(boxes) {
  if (boxes.length === 0) return null;
  return boxes.reduce((result, box) => ({
    x1: Math.min(result.x1, box.x1),
    y1: Math.min(result.y1, box.y1),
    x2: Math.max(result.x2, box.x2),
    y2: Math.max(result.y2, box.y2),
  }));
}

function groupPlacementOffset(bounds, target, placement) {
  const gap = 0.035;
  const width = bounds.x2 - bounds.x1;
  const height = bounds.y2 - bounds.y1;
  const current = boxCenter(bounds);
  const targetCenter = boxCenter(target);
  const candidates = {
    above: {x: targetCenter.x, y: target.y1 - gap - height / 2},
    below: {x: targetCenter.x, y: target.y2 + gap + height / 2},
    left: {x: target.x1 - gap - width / 2, y: targetCenter.y},
    right: {x: target.x2 + gap + width / 2, y: targetCenter.y},
    inside: targetCenter,
    "top-left": {x: target.x1 + width / 2, y: target.y1 - gap - height / 2},
    "top-right": {x: target.x2 - width / 2, y: target.y1 - gap - height / 2},
    "bottom-left": {x: target.x1 + width / 2, y: target.y2 + gap + height / 2},
    "bottom-right": {x: target.x2 - width / 2, y: target.y2 + gap + height / 2},
  };
  const desired = placement === "near"
    ? [candidates.above, candidates.below, candidates.left, candidates.right].sort(
        (a, b) => Math.hypot(a.x - current.x, a.y - current.y) - Math.hypot(b.x - current.x, b.y - current.y),
      )[0]
    : candidates[placement] ?? candidates.right;
  return {dx: desired.x - current.x, dy: desired.y - current.y};
}

function translateBox(box, dx, dy) {
  return {x1: box.x1 + dx, y1: box.y1 + dy, x2: box.x2 + dx, y2: box.y2 + dy};
}

function classifyElement(sceneId, element, metrics, options) {
  if (element.kind === "text") {
    const hasBackground = Boolean(element.source.background);
    const error = metrics.avg >= options.textAvgError || metrics.inkRatio >= options.textInkError;
    const warning = metrics.avg >= options.textAvgWarn || metrics.inkRatio >= options.textInkWarn;
    if (!error && !warning) return null;
    const severity = error && !hasBackground ? "error" : "warning";
    const legibility = hasBackground ? "has a backing shape but still covers dense artwork" : "sits on dense artwork";
    return {
      severity,
      sceneId,
      elementId: element.id,
      kind: "background-collision",
      message: `${sceneId}.${element.id}: text ${legibility}`,
    };
  }

  if (element.kind === "shape") {
    const isPointer = element.role === "line" || element.role === "arrow";
    const isTransparentFocus = String(element.source.fill ?? "").includes("rgba") && String(element.source.fill).includes("0.0");
    if (isPointer || isTransparentFocus) return null;
    if (metrics.avg >= options.shapeAvgWarn || metrics.inkRatio >= options.shapeInkWarn) {
      return {
        severity: "warning",
        sceneId,
        elementId: element.id,
        kind: "shape-covers-artwork",
        message: `${sceneId}.${element.id}: shape covers dense illustration detail`,
      };
    }
  }
  return null;
}

function planTextPlacement(element, context, finding) {
  const {textElements, saliency, options} = context;
  const width = element.bbox.x2 - element.bbox.x1;
  const height = element.bbox.y2 - element.bbox.y1;
  const current = saliency.query(element.bbox);
  const target = findTarget(element.intent?.target, context);
  const candidates = [];
  const otherTexts = textElements.filter((other) => other.id !== element.id);
  const seeded = target ? anchoredCandidates(element, target, width, height, options) : [];

  for (const candidate of seeded) {
    addCandidate(candidate.x, candidate.y, "anchor");
  }
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 10; column += 1) {
      const x = options.marginX + (column / 9) * (1 - options.marginX * 2);
      const y = options.marginY + (row / 7) * (1 - options.marginY - options.captionSafeBottom);
      addCandidate(x, y, "grid");
    }
  }

  candidates.sort((a, b) => a.score - b.score);
  const currentScore = current.avg * 0.65 + current.inkRatio * 0.35;
  const topSuggestions = candidates
    .filter((candidate) => candidate.score < currentScore * 0.75)
    .slice(0, 3)
    .map((candidate) => ({
      x: Number(candidate.x.toFixed(3)),
      y: Number(candidate.y.toFixed(3)),
      score: Number(candidate.score.toFixed(3)),
      source: candidate.source,
      saliency: roundMetrics(candidate.metrics),
    }));
  const best = candidates[0];
  const hasAutoIntent = element.intent?.autoPlace === true || Boolean(target);
  const meaningfulImprovement = best && currentScore - best.score >= options.moveThreshold;
  const recommendedMove =
    best && (finding || hasAutoIntent) && meaningfulImprovement
      ? {
          x: Number(best.x.toFixed(3)),
          y: Number(best.y.toFixed(3)),
          score: Number(best.score.toFixed(3)),
          previousScore: Number(currentScore.toFixed(3)),
          target: target?.id ?? null,
          placement: element.intent?.placement ?? null,
        }
      : null;

  return {suggestions: topSuggestions, recommendedMove};

  function addCandidate(x, y, source) {
    const bbox = boxFromAnchor(x, y, width, height, element.align);
    if (!insideSafeArea(bbox, options)) return;
    const metrics = saliency.query(bbox);
    const overlapPenalty = otherTexts.reduce((total, other) => total + intersectionRatio(bbox, other.bbox), 0);
    const objectPenalty = objectOverlapPenalty(bbox, element, context);
    const targetPenalty = target ? targetDistancePenalty(bbox, target, element.intent) : 0;
    const edgePenalty = edgePenaltyFor(bbox, options);
    const score =
      metrics.avg * 0.65 +
      metrics.inkRatio * 0.35 +
      overlapPenalty * 1.2 +
      objectPenalty +
      targetPenalty +
      edgePenalty;
    candidates.push({x, y, bbox, metrics, score, source});
  }
}

function findTarget(targetId, context) {
  if (!targetId) return null;
  const element = context.elements.find((candidate) => candidate.id === targetId);
  if (element) return {...element, type: "overlay"};
  const object = context.layoutObjects.find((candidate) => candidate.id === targetId || candidate.type === targetId);
  return object ? {...object, role: object.type, kind: "object"} : null;
}

function anchoredCandidates(element, target, width, height, options) {
  const placement = element.intent?.placement ?? "near";
  const gap = 0.035;
  const center = boxCenter(target.bbox);
  const candidates = [];
  const add = (x, y) => candidates.push({x: clamp(x, 0, 1), y: clamp(y, 0, 1)});
  const xOffsets = [-0.1, 0, 0.1];
  const yOffsets = [-0.08, 0, 0.08];

  if (placement === "above" || placement === "near") {
    for (const offset of xOffsets) add(center.x + offset, target.bbox.y1 - gap - height / 2);
  }
  if (placement === "below" || placement === "near") {
    for (const offset of xOffsets) add(center.x + offset, target.bbox.y2 + gap + height / 2);
  }
  if (placement === "left" || placement === "near") {
    for (const offset of yOffsets) add(target.bbox.x1 - gap - width / 2, center.y + offset);
  }
  if (placement === "right" || placement === "near") {
    for (const offset of yOffsets) add(target.bbox.x2 + gap + width / 2, center.y + offset);
  }
  if (placement === "inside") add(center.x, center.y);
  if (placement === "top-left") add(target.bbox.x1, target.bbox.y1 - gap - height / 2);
  if (placement === "top-right") add(target.bbox.x2 - width, target.bbox.y1 - gap - height / 2);
  if (placement === "bottom-left") add(target.bbox.x1, target.bbox.y2 + gap + height / 2);
  if (placement === "bottom-right") add(target.bbox.x2 - width, target.bbox.y2 + gap + height / 2);

  for (let ring = 1; ring <= 2; ring += 1) {
    const spreadX = ring * 0.08;
    const spreadY = ring * 0.07;
    add(center.x - spreadX, center.y - spreadY);
    add(center.x + spreadX, center.y - spreadY);
    add(center.x - spreadX, center.y + spreadY);
    add(center.x + spreadX, center.y + spreadY);
  }

  return candidates.filter((candidate) => insideSafeArea(boxFromAnchor(candidate.x, candidate.y, width, height, element.align), options));
}

function objectOverlapPenalty(bbox, element, context) {
  const avoidList = new Set(element.intent?.avoid ?? []);
  let penalty = 0;
  for (const object of context.layoutObjects) {
    const explicitlyAvoided = avoidList.has(object.id) || avoidList.has(object.type);
    const isTarget = element.intent?.target === object.id || element.intent?.target === object.type;
    if (isTarget && !explicitlyAvoided) continue;
    if (!object.avoid && !explicitlyAvoided) continue;
    const ratio = intersectionRatio(bbox, object.bbox);
    if (ratio <= 0) continue;
    const weight = object.type === "caption" || object.type === "face" || object.type === "hand" ? 3.5 : 1.8;
    penalty += ratio * weight;
  }
  return penalty;
}

function targetDistancePenalty(bbox, target, intent = {}) {
  const center = boxCenter(bbox);
  const targetCenter = boxCenter(target.bbox);
  const distance = Math.hypot(center.x - targetCenter.x, center.y - targetCenter.y);
  const maxDistance = intent.maxDistance ?? 0.42;
  const overflow = Math.max(0, distance - maxDistance);
  const base = distance * 0.12;
  return base + overflow * 1.5;
}

function boxFromAnchor(x, y, width, height, align) {
  const x1 = align === "left" ? x : align === "right" ? x - width : x - width / 2;
  return normalizeBox({x1, y1: y - height / 2, x2: x1 + width, y2: y + height / 2});
}

function insideSafeArea(bbox, options) {
  return (
    bbox.x1 >= options.marginX &&
    bbox.x2 <= 1 - options.marginX &&
    bbox.y1 >= options.marginY &&
    bbox.y2 <= 1 - options.captionSafeBottom
  );
}

function edgePenaltyFor(bbox, options) {
  let penalty = 0;
  if (bbox.x1 < options.marginX * 1.5) penalty += 0.04;
  if (bbox.x2 > 1 - options.marginX * 1.5) penalty += 0.04;
  if (bbox.y1 < options.marginY * 1.5) penalty += 0.04;
  if (bbox.y2 > 1 - options.captionSafeBottom - options.marginY * 0.5) penalty += 0.06;
  return penalty;
}

function findTextOverlaps(sceneId, textElements) {
  const findings = [];
  for (let left = 0; left < textElements.length; left += 1) {
    for (let right = left + 1; right < textElements.length; right += 1) {
      const a = textElements[left];
      const b = textElements[right];
      const ratio = intersectionRatio(a.bbox, b.bbox);
      if (ratio > 0.15) {
        findings.push({
          severity: ratio > 0.35 ? "error" : "warning",
          sceneId,
          elementId: `${a.id},${b.id}`,
          kind: "text-overlap",
          message: `${sceneId}: text boxes ${a.id} and ${b.id} overlap (${ratio.toFixed(2)})`,
        });
      }
    }
  }
  return findings;
}

function intersectionRatio(a, b) {
  const x1 = Math.max(a.x1, b.x1);
  const y1 = Math.max(a.y1, b.y1);
  const x2 = Math.min(a.x2, b.x2);
  const y2 = Math.min(a.y2, b.y2);
  if (x2 <= x1 || y2 <= y1) return 0;
  const intersection = (x2 - x1) * (y2 - y1);
  const minArea = Math.min((a.x2 - a.x1) * (a.y2 - a.y1), (b.x2 - b.x1) * (b.y2 - b.y1));
  return intersection / minArea;
}

function summarize(project, scenes, findings) {
  const textCount = scenes.reduce((total, scene) => total + scene.elements.filter((element) => element.kind === "text").length, 0);
  const shapeCount = scenes.reduce((total, scene) => total + scene.elements.filter((element) => element.kind === "shape").length, 0);
  const assetCount = scenes.reduce((total, scene) => total + scene.elements.filter((element) => element.kind === "asset").length, 0);
  return {
    scenes: project.scenes?.length ?? 0,
    textElements: textCount,
    shapeElements: shapeCount,
    assetElements: assetCount,
    errors: findings.filter((finding) => finding.severity === "error").length,
    warnings: findings.filter((finding) => finding.severity === "warning").length,
  };
}

function printReport(report) {
  const {summary} = report;
  console.log(`Overlay layout analysis: ${summary.scenes} scenes, ${summary.textElements} text elements, ${summary.shapeElements} shapes, ${summary.assetElements} assets`);
  console.log(`Findings: ${summary.errors} errors, ${summary.warnings} warnings`);
  for (const finding of report.findings) {
    const prefix = finding.severity === "error" ? "ERROR" : "WARN";
    console.log(`${prefix}: ${finding.message}`);
    for (const suggestion of finding.suggestions ?? []) {
      console.log(`  suggestion: x=${suggestion.x} y=${suggestion.y} saliency=${suggestion.saliency.avg}/${suggestion.saliency.inkRatio}`);
    }
  }
  for (const move of report.appliedMoves ?? []) {
    console.log(`APPLIED: ${move.sceneId}.${move.elementId} x=${move.from.x} y=${move.from.y} -> x=${move.to.x} y=${move.to.y} (${move.reason})`);
  }
}

function roundMetrics(metrics) {
  return {
    avg: Number(metrics.avg.toFixed(3)),
    inkRatio: Number(metrics.inkRatio.toFixed(3)),
    area: metrics.area,
  };
}

function roundBox(box) {
  return {
    x1: Number(box.x1.toFixed(3)),
    y1: Number(box.y1.toFixed(3)),
    x2: Number(box.x2.toFixed(3)),
    y2: Number(box.y2.toFixed(3)),
  };
}

function roundPoint(point) {
  return {x: round(point.x), y: round(point.y)};
}

function round(value) {
  return Number(value.toFixed(3));
}

function normalizeBox(box) {
  return {
    x1: clamp(Math.min(box.x1, box.x2), 0, 1),
    y1: clamp(Math.min(box.y1, box.y2), 0, 1),
    x2: clamp(Math.max(box.x1, box.x2), 0, 1),
    y2: clamp(Math.max(box.y1, box.y2), 0, 1),
  };
}

function boxCenter(box) {
  return {
    x: (box.x1 + box.x2) / 2,
    y: (box.y1 + box.y2) / 2,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export {analyzeProject};

if (process.argv[1] && path.resolve(process.argv[1]) !== fileURLToPath(import.meta.url)) {
  // No-op. The export is here for tests or future wrappers.
}
