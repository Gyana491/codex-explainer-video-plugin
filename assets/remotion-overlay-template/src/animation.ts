import {Easing, interpolate, spring} from "remotion";
import type {AnimationCue} from "./types";

export interface AnimationState {
  visibility: number;
  draw: number;
  count: number;
  highlight: number;
  scale: number;
  translateX: number;
  translateY: number;
}

export function cueProgress(
  cue: AnimationCue | undefined,
  sceneFrame: number,
  sceneFrames: number,
  fps: number,
): number {
  if (!cue) return 1;
  const start = cue.startSeconds !== undefined ? cue.startSeconds * fps : (cue.startProgress ?? 0) * sceneFrames;
  const duration = Math.max(1, cue.durationSeconds * fps);
  if (cue.easing === "spring") {
    return spring({frame: Math.max(0, sceneFrame - start), fps, config: {damping: 15, stiffness: 130}});
  }
  const easing =
    cue.easing === "linear"
      ? Easing.linear
      : cue.easing === "ease-in-out"
        ? Easing.inOut(Easing.cubic)
        : Easing.out(Easing.cubic);
  return interpolate(sceneFrame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
}

export function animationState(
  cues: AnimationCue[],
  sceneFrame: number,
  sceneFrames: number,
  fps: number,
): AnimationState {
  const ordered = [...cues].sort((a, b) => cueStartFrame(a, sceneFrames, fps) - cueStartFrame(b, sceneFrames, fps));
  const entrance = ordered.find((cue) => ["reveal", "grow", "draw", "count"].includes(cue.action));
  const visibility = entrance ? cueProgress(entrance, sceneFrame, sceneFrames, fps) : 1;
  const drawCue = ordered.find((cue) => cue.action === "draw");
  const countCue = ordered.find((cue) => cue.action === "count");
  const highlightCues = ordered.filter((cue) => cue.action === "highlight");
  const pulseCues = ordered.filter((cue) => cue.action === "pulse");
  const moveCues = ordered.filter((cue) => cue.action === "move");
  const entranceScale = entrance && ["reveal", "grow"].includes(entrance.action) ? visibility : 1;
  const pulseScale = pulseCues.reduce((scale, cue) => {
    const progress = cueProgress(cue, sceneFrame, sceneFrames, fps);
    return scale * (1 + Math.sin(progress * Math.PI) * 0.08);
  }, 1);

  return {
    visibility,
    draw: drawCue ? cueProgress(drawCue, sceneFrame, sceneFrames, fps) : 1,
    count: countCue ? cueProgress(countCue, sceneFrame, sceneFrames, fps) : 1,
    highlight: highlightCues.reduce(
      (maximum, cue) => Math.max(maximum, cueProgress(cue, sceneFrame, sceneFrames, fps)),
      0,
    ),
    scale: entranceScale * pulseScale,
    translateX: moveCues.reduce(
      (total, cue) => total + (cue.offsetX ?? 0) * cueProgress(cue, sceneFrame, sceneFrames, fps),
      0,
    ),
    translateY: moveCues.reduce(
      (total, cue) => total + (cue.offsetY ?? 0) * cueProgress(cue, sceneFrame, sceneFrames, fps),
      0,
    ),
  };
}

function cueStartFrame(cue: AnimationCue, sceneFrames: number, fps: number): number {
  return cue.startSeconds !== undefined ? cue.startSeconds * fps : (cue.startProgress ?? 0) * sceneFrames;
}
