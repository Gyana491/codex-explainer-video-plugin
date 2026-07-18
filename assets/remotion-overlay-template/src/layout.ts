import type {
  EssentialText,
  LayoutObject,
  LayoutPlacement,
  OverlayAsset,
  OverlayGroup,
  SceneOverlay,
  Shape,
} from "./types";

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GroupTransform {
  dx: number;
  dy: number;
  group: OverlayGroup;
}

export function resolveGroupTransforms(
  overlay: SceneOverlay,
  objects: LayoutObject[] = [],
): Map<string, GroupTransform> {
  const groups = overlay.groups ?? [];
  const elements = [
    ...(overlay.essentialText ?? []).map((element) => ({id: element.id, groupId: element.groupId, bbox: textBox(element)})),
    ...(overlay.shapes ?? []).map((element) => ({id: element.id, groupId: element.groupId, bbox: shapeBox(element)})),
    ...(overlay.assets ?? []).map((element) => ({id: element.id, groupId: element.groupId, bbox: assetBox(element)})),
  ];
  const elementBoxes = new Map(elements.map((element) => [element.id, element.bbox]));
  const objectBoxes = new Map(
    objects.map((object) => [object.id, tupleBox(object.bbox)]),
  );
  const transforms = new Map<string, GroupTransform>();

  for (const group of groups) {
    const memberBoxes = elements.filter((element) => element.groupId === group.id).map((element) => element.bbox);
    const bounds = group.bbox ? tupleBox(group.bbox) : unionBoxes(memberBoxes);
    const target = group.anchorTo ? objectBoxes.get(group.anchorTo) ?? elementBoxes.get(group.anchorTo) : undefined;
    const anchored = bounds && target ? placementOffset(bounds, target, group.placement ?? "near") : {dx: 0, dy: 0};
    transforms.set(group.id, {
      dx: anchored.dx + (group.offsetX ?? 0),
      dy: anchored.dy + (group.offsetY ?? 0),
      group,
    });
  }

  return transforms;
}

function placementOffset(bounds: Box, target: Box, placement: LayoutPlacement): {dx: number; dy: number} {
  const gap = 0.035;
  const width = bounds.x2 - bounds.x1;
  const height = bounds.y2 - bounds.y1;
  const current = center(bounds);
  const targetCenter = center(target);
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
  } as const;
  const desired = placement === "near"
    ? [candidates.above, candidates.below, candidates.left, candidates.right].sort(
        (a, b) => distance(a, current) - distance(b, current),
      )[0]
    : candidates[placement];
  return {dx: desired.x - current.x, dy: desired.y - current.y};
}

function textBox(text: EssentialText): Box {
  const width = text.maxWidth ?? 0.26;
  const height = text.role === "title" ? 0.105 : text.role === "label" ? 0.06 : 0.095;
  const x1 = text.align === "left" ? text.x : text.align === "right" ? text.x - width : text.x - width / 2;
  return normalize({x1, y1: text.y - height / 2, x2: x1 + width, y2: text.y + height / 2});
}

function shapeBox(shape: Shape): Box {
  if (shape.type === "line" || shape.type === "arrow") {
    return normalize({
      x1: Math.min(shape.x, shape.x2 ?? shape.x),
      y1: Math.min(shape.y, shape.y2 ?? shape.y),
      x2: Math.max(shape.x, shape.x2 ?? shape.x),
      y2: Math.max(shape.y, shape.y2 ?? shape.y),
    });
  }
  const width = shape.width ?? 0.1;
  const height = shape.height ?? 0.1;
  if (shape.type === "progress-bar") {
    return normalize({x1: shape.x, y1: shape.y, x2: shape.x + width, y2: shape.y + height});
  }
  return normalize({
    x1: shape.x - width / 2,
    y1: shape.y - height / 2,
    x2: shape.x + width / 2,
    y2: shape.y + height / 2,
  });
}

function assetBox(asset: OverlayAsset): Box {
  return normalize({
    x1: asset.x - asset.width / 2,
    y1: asset.y - asset.height / 2,
    x2: asset.x + asset.width / 2,
    y2: asset.y + asset.height / 2,
  });
}

function tupleBox(tuple: [number, number, number, number]): Box {
  return normalize({x1: tuple[0], y1: tuple[1], x2: tuple[2], y2: tuple[3]});
}

function unionBoxes(boxes: Box[]): Box | undefined {
  if (boxes.length === 0) return undefined;
  return boxes.reduce((result, box) => ({
    x1: Math.min(result.x1, box.x1),
    y1: Math.min(result.y1, box.y1),
    x2: Math.max(result.x2, box.x2),
    y2: Math.max(result.y2, box.y2),
  }));
}

function center(box: Box) {
  return {x: (box.x1 + box.x2) / 2, y: (box.y1 + box.y2) / 2};
}

function distance(a: {x: number; y: number}, b: {x: number; y: number}) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(box: Box): Box {
  return {
    x1: Math.min(box.x1, box.x2),
    y1: Math.min(box.y1, box.y2),
    x2: Math.max(box.x1, box.x2),
    y2: Math.max(box.y1, box.y2),
  };
}
