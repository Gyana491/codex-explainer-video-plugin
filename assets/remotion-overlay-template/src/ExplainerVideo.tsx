import React from "react";
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from "remotion";
import {OverlayRenderer} from "./OverlayRenderer";
import type {ExplainerProject, ExplainerScene} from "./types";

export const ExplainerVideo: React.FC<{project: ExplainerProject}> = ({project}) => {
  let startFrame = 0;
  return (
    <AbsoluteFill style={{backgroundColor: project.backgroundColor ?? "#0f172a"}}>
      <Audio src={staticFile(project.audioPath)} />
      {project.scenes.map((scene) => {
        const durationInFrames = Math.max(1, Math.round(scene.durationSeconds * project.fps));
        const from = startFrame;
        startFrame += durationInFrames;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={durationInFrames} premountFor={project.fps}>
            <Scene scene={scene} durationInFrames={durationInFrames} fps={project.fps} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const Scene: React.FC<{scene: ExplainerScene; durationInFrames: number; fps: number}> = ({
  scene,
  durationInFrames,
  fps,
}) => {
  const frame = useCurrentFrame();
  const progress = frame / Math.max(1, durationInFrames - 1);
  const scaleStart = scene.cameraMotion === "slow-zoom-out" ? 1.06 : 1;
  const scaleEnd = scene.cameraMotion === "slow-zoom-in" ? 1.06 : 1;
  const scale = interpolate(progress, [0, 1], [scaleStart, scaleEnd]);
  const pan = interpolate(progress, [0, 1], [-2.5, 2.5]);
  const translateX = scene.cameraMotion === "pan-left" ? -pan : scene.cameraMotion === "pan-right" ? pan : 0;
  const edgeFade = Math.min(1, frame / 8, (durationInFrames - frame) / 8);
  return (
    <AbsoluteFill style={{overflow: "hidden", opacity: edgeFade}}>
      <Img
        src={staticFile(scene.backgroundImage)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translateX(${translateX}%) scale(${scale})`,
        }}
      />
      <OverlayRenderer overlay={scene.overlay} frame={frame} sceneFrames={durationInFrames} fps={fps} />
    </AbsoluteFill>
  );
};

