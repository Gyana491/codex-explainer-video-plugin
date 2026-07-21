import React from "react";
import {Img, interpolate, staticFile} from "remotion";
import {animationState, type AnimationState} from "./animation";
import {resolveGroupTransforms} from "./layout";
import type {
  AnimationCue,
  CoordinateSpace,
  EssentialText,
  LayoutObject,
  OverlayAsset,
  OverlayGroup,
  ProjectTheme,
  SceneOverlay,
  Shape,
} from "./types";

type ResolvedTheme = Required<ProjectTheme>;

function withAlpha(hex: string, alpha: number): string {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

type Layer =
  | {kind: "shape"; element: Shape}
  | {kind: "asset"; element: OverlayAsset}
  | {kind: "text"; element: EssentialText};

export const OverlayRenderer: React.FC<{
  overlay?: SceneOverlay;
  objects?: LayoutObject[];
  frame: number;
  sceneFrames: number;
  fps: number;
  width: number;
  height: number;
  artworkTransform: string;
  theme: ResolvedTheme;
}> = ({overlay, objects, frame, sceneFrames, fps, width, height, artworkTransform, theme}) => {
  if (!overlay) return null;
  const cues = overlay.animationCues ?? [];
  const groups = new Map((overlay.groups ?? []).map((group) => [group.id, group]));
  const groupTransforms = resolveGroupTransforms(overlay, objects);
  const layers: Layer[] = [
    ...(overlay.shapes ?? []).map((element): Layer => ({kind: "shape", element})),
    ...(overlay.assets ?? []).map((element): Layer => ({kind: "asset", element})),
    ...(overlay.essentialText ?? []).map((element): Layer => ({kind: "text", element})),
  ].sort((a, b) => layerZIndex(a, groups) - layerZIndex(b, groups));

  return (
    <div style={{position: "absolute", inset: 0, pointerEvents: "none"}}>
      {layers.map((layer) => {
        const group = layer.element.groupId ? groups.get(layer.element.groupId) : undefined;
        const groupTransform = layer.element.groupId ? groupTransforms.get(layer.element.groupId) : undefined;
        const state = animationState(
          cues.filter((cue) => cue.target === layer.element.id || cue.target === layer.element.groupId),
          frame,
          sceneFrames,
          fps,
        );
        const coordinateSpace = layer.element.coordinateSpace ?? group?.coordinateSpace ?? defaultSpace(group);
        const dx = (groupTransform?.dx ?? 0) + state.translateX;
        const dy = (groupTransform?.dy ?? 0) + state.translateY;
        return (
          <div
            key={`${layer.kind}-${layer.element.id}`}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: layerZIndex(layer, groups),
              transform: coordinateSpace === "artwork" ? artworkTransform : undefined,
              transformOrigin: "center center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `translate(${dx * width}px, ${dy * height}px)`,
              }}
            >
              {layer.kind === "shape" ? (
                <ShapeElement shape={layer.element} state={state} width={width} height={height} theme={theme} />
              ) : layer.kind === "asset" ? (
                <AssetElement asset={layer.element} state={state} />
              ) : (
                <TextElement text={layer.element} state={state} theme={theme} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function layerZIndex(layer: Layer, groups: Map<string, OverlayGroup>): number {
  const group = layer.element.groupId ? groups.get(layer.element.groupId) : undefined;
  const fallback = layer.kind === "shape" ? 10 : layer.kind === "asset" ? 15 : 20;
  return layer.element.zIndex ?? group?.zIndex ?? fallback;
}

function defaultSpace(group?: OverlayGroup): CoordinateSpace {
  return group?.anchorTo ? "artwork" : "screen";
}

const ShapeElement: React.FC<{shape: Shape; state: AnimationState; width: number; height: number; theme: ResolvedTheme}> = ({
  shape,
  state,
  width: projectWidth,
  height: projectHeight,
  theme,
}) => {
  const x = shape.x * projectWidth;
  const y = shape.y * projectHeight;
  const width = (shape.width ?? 0.1) * projectWidth;
  const height = (shape.height ?? 0.1) * projectHeight;
  const stroke = shape.stroke ?? theme.ink;
  const fill = shape.fill ?? theme.accent;
  const strokeWidth = shape.strokeWidth ?? 5;

  if (shape.type === "line" || shape.type === "arrow") {
    const x2 = (shape.x2 ?? shape.x) * projectWidth;
    const y2 = (shape.y2 ?? shape.y) * projectHeight;
    const currentX = x + (x2 - x) * state.draw;
    const currentY = y + (y2 - y) * state.draw;
    const angle = Math.atan2(y2 - y, x2 - x) * (180 / Math.PI);
    const headLength = Math.max(16, strokeWidth * 4);
    const headHalfWidth = headLength * 0.55;
    return (
      <SvgCanvas width={projectWidth} height={projectHeight}>
        <g opacity={state.visibility > 0 ? state.visibility : 0}>
          <line x1={x} y1={y} x2={currentX} y2={currentY} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
          {shape.type === "arrow" && state.draw > 0.02 ? (
            <polygon
              points={`${headLength},0 0,${-headHalfWidth} 0,${headHalfWidth}`}
              fill={stroke}
              transform={`translate(${currentX} ${currentY}) rotate(${angle}) translate(${-headLength} 0)`}
            />
          ) : null}
        </g>
      </SvgCanvas>
    );
  }

  if (shape.type === "progress-bar") {
    return (
      <SvgCanvas width={projectWidth} height={projectHeight}>
        <g opacity={state.visibility} transform={`translate(${x} ${y}) scale(${state.scale}) translate(${-x} ${-y})`}>
          <rect x={x} y={y} width={width} height={height} rx={height / 2} fill={withAlpha(theme.ink, 0.15)} />
          <rect x={x} y={y} width={width * Math.min(state.draw, state.visibility)} height={height} rx={height / 2} fill={fill} />
        </g>
      </SvgCanvas>
    );
  }

  const transform = `translate(${x} ${y}) scale(${state.scale}) translate(${-x} ${-y})`;
  return (
    <SvgCanvas width={projectWidth} height={projectHeight}>
      {shape.type === "circle" ? (
        <ellipse cx={x} cy={y} rx={width / 2} ry={height / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={state.visibility} transform={transform} />
      ) : (
        <rect x={x - width / 2} y={y - height / 2} width={width} height={height} rx={Math.min(width, height) * 0.16} fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={state.visibility} transform={transform} />
      )}
    </SvgCanvas>
  );
};

const SvgCanvas: React.FC<{width: number; height: number; children: React.ReactNode}> = ({width, height, children}) => (
  <svg
    width="100%"
    height="100%"
    viewBox={`0 0 ${width} ${height}`}
    preserveAspectRatio="xMidYMid meet"
    style={{position: "absolute", inset: 0}}
  >
    {children}
  </svg>
);

const AssetElement: React.FC<{asset: OverlayAsset; state: AnimationState}> = ({asset, state}) => (
  <Img
    src={staticFile(asset.src)}
    style={{
      position: "absolute",
      left: `${asset.x * 100}%`,
      top: `${asset.y * 100}%`,
      width: `${asset.width * 100}%`,
      height: `${asset.height * 100}%`,
      objectFit: asset.fit ?? "contain",
      borderRadius: asset.borderRadius ?? 0,
      opacity: (asset.opacity ?? 1) * state.visibility,
      transform: `translate(-50%, -50%) scale(${state.scale})`,
      transformOrigin: "center center",
    }}
  />
);

const TextElement: React.FC<{text: EssentialText; state: AnimationState; theme: ResolvedTheme}> = ({text, state, theme}) => {
  const displayed =
    text.numericValue === undefined
      ? text.text
      : `${Math.round(text.numericValue * state.count)}${text.suffix ?? ""}`;
  const roleStyles: Record<EssentialText["role"], React.CSSProperties> = {
    title: {fontSize: 76, fontWeight: 800, lineHeight: 1.02},
    label: {fontSize: 34, fontWeight: 700},
    value: {fontSize: 72, fontWeight: 800},
    definition: {fontSize: 38, fontWeight: 600, lineHeight: 1.2},
    equation: {fontSize: 58, fontWeight: 700, fontFamily: "Georgia, serif"},
    takeaway: {fontSize: 54, fontWeight: 800, lineHeight: 1.12},
  };
  const translateY = interpolate(state.visibility, [0, 1], [24, 0]);
  const anchor = text.align === "left" ? "translate(0, -50%)" : text.align === "right" ? "translate(-100%, -50%)" : "translate(-50%, -50%)";
  return (
    <div
      style={{
        position: "absolute",
        left: `${text.x * 100}%`,
        top: `${text.y * 100}%`,
        width: `${(text.maxWidth ?? 0.26) * 100}%`,
        transform: `${anchor} translateY(${translateY}px) scale(${state.scale})`,
        transformOrigin: "center center",
        textAlign: text.align ?? "center",
        color: text.color ?? theme.ink,
        background: state.highlight > 0 ? withAlpha(theme.accent, 0.12 + state.highlight * 0.7) : text.background,
        borderRadius: 18,
        padding: text.background || state.highlight > 0 ? "14px 20px" : 0,
        opacity: state.visibility,
        textShadow: theme.textShadow,
        fontFamily: theme.fontFamily,
        ...roleStyles[text.role],
      }}
    >
      {displayed}
    </div>
  );
};
