import {Easing, interpolate, spring} from "remotion";
import type {AnimationCue} from "./types";

export function cueProgress(
  cue: AnimationCue | undefined,
  sceneFrame: number,
  sceneFrames: number,
  fps: number,
): number {
  if (!cue) return 1;
  const start = cue.startProgress * sceneFrames;
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

