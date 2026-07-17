import React from "react";
import {interpolate} from "remotion";
import {cueProgress} from "./animation";
import type {AnimationCue, EssentialText, SceneOverlay, Shape} from "./types";

export const OverlayRenderer: React.FC<{
  overlay?: SceneOverlay;
  frame: number;
  sceneFrames: number;
  fps: number;
}> = ({overlay, frame, sceneFrames, fps}) => {
  if (!overlay) return null;
  const cues = overlay.animationCues ?? [];
  return (
    <div style={{position: "absolute", inset: 0}}>
      <svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        {(overlay.shapes ?? []).map((shape) => (
          <ShapeElement
            key={shape.id}
            shape={shape}
            progress={progressFor(shape.id, cues, frame, sceneFrames, fps)}
            action={cues.find((cue) => cue.target === shape.id)?.action}
          />
        ))}
      </svg>
      {(overlay.essentialText ?? []).map((text) => (
        <TextElement
          key={text.id}
          text={text}
          progress={progressFor(text.id, cues, frame, sceneFrames, fps)}
          action={cues.find((cue) => cue.target === text.id)?.action}
        />
      ))}
    </div>
  );
};

function progressFor(id: string, cues: AnimationCue[], frame: number, sceneFrames: number, fps: number) {
  return cueProgress(cues.find((cue) => cue.target === id), frame, sceneFrames, fps);
}

const ShapeElement: React.FC<{shape: Shape; progress: number; action?: AnimationCue["action"]}> = ({
  shape,
  progress,
  action,
}) => {
  const x = shape.x * 1000;
  const y = shape.y * 1000;
  const width = (shape.width ?? 0.1) * 1000;
  const height = (shape.height ?? 0.1) * 1000;
  const stroke = shape.stroke ?? "#f8fafc";
  const fill = shape.fill ?? "#2563eb";
  const strokeWidth = shape.strokeWidth ?? 5;
  const pulse = action === "pulse" ? 1 + Math.sin(progress * Math.PI * 4) * 0.06 : 1;
  const scale = (action === "grow" || action === "reveal" || action === "pulse") ? progress * pulse : 1;
  const opacity = action === "draw" ? 1 : progress;

  if (shape.type === "line" || shape.type === "arrow") {
    const x2 = (shape.x2 ?? shape.x) * 1000;
    const y2 = (shape.y2 ?? shape.y) * 1000;
    const currentX = x + (x2 - x) * progress;
    const currentY = y + (y2 - y) * progress;
    const angle = Math.atan2(y2 - y, x2 - x) * (180 / Math.PI);
    const headLength = Math.max(16, strokeWidth * 4);
    const headHalfWidth = headLength * 0.55;
    return (
      <g opacity={progress > 0 ? 1 : 0}>
        <line
          x1={x}
          y1={y}
          x2={currentX}
          y2={currentY}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {shape.type === "arrow" && progress > 0.02 ? (
          <polygon
            points={`${headLength},0 0,${-headHalfWidth} 0,${headHalfWidth}`}
            fill={stroke}
            transform={`translate(${currentX} ${currentY}) rotate(${angle}) translate(${-headLength} 0)`}
          />
        ) : null}
      </g>
    );
  }

  if (shape.type === "progress-bar") {
    return (
      <g opacity={opacity}>
        <rect x={x} y={y} width={width} height={height} rx={height / 2} fill="rgba(255,255,255,0.24)" />
        <rect x={x} y={y} width={width * progress} height={height} rx={height / 2} fill={fill} />
      </g>
    );
  }

  const transform = `translate(${x} ${y}) scale(${scale}) translate(${-x} ${-y})`;
  return shape.type === "circle" ? (
    <ellipse cx={x} cy={y} rx={width / 2} ry={height / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} transform={transform} />
  ) : (
    <rect x={x - width / 2} y={y - height / 2} width={width} height={height} rx={Math.min(width, height) * 0.16} fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} transform={transform} />
  );
};

const TextElement: React.FC<{text: EssentialText; progress: number; action?: AnimationCue["action"]}> = ({
  text,
  progress,
  action,
}) => {
  const displayed =
    text.numericValue === undefined
      ? text.text
      : `${Math.round(text.numericValue * (action === "count" ? progress : 1))}${text.suffix ?? ""}`;
  const roleStyles: Record<EssentialText["role"], React.CSSProperties> = {
    title: {fontSize: 76, fontWeight: 800, lineHeight: 1.02},
    label: {fontSize: 34, fontWeight: 700},
    value: {fontSize: 72, fontWeight: 800},
    definition: {fontSize: 38, fontWeight: 600, lineHeight: 1.2},
    equation: {fontSize: 58, fontWeight: 700, fontFamily: "Georgia, serif"},
    takeaway: {fontSize: 54, fontWeight: 800, lineHeight: 1.12},
  };
  const translateY = interpolate(progress, [0, 1], [24, 0]);
  const anchor = text.align === "left" ? "translate(0, -50%)" : text.align === "right" ? "translate(-100%, -50%)" : "translate(-50%, -50%)";
  return (
    <div
      style={{
        position: "absolute",
        left: `${text.x * 100}%`,
        top: `${text.y * 100}%`,
        width: `${(text.maxWidth ?? 0.26) * 100}%`,
        transform: `${anchor} translateY(${translateY}px)`,
        textAlign: text.align ?? "center",
        color: text.color ?? "#f8fafc",
        background: action === "highlight" ? `rgba(249,115,22,${0.12 + progress * 0.7})` : text.background,
        borderRadius: 18,
        padding: text.background || action === "highlight" ? "14px 20px" : 0,
        opacity: progress,
        textShadow: "0 2px 18px rgba(0,0,0,0.45)",
        fontFamily: "Inter, Arial, sans-serif",
        ...roleStyles[text.role],
      }}
    >
      {displayed}
    </div>
  );
};
