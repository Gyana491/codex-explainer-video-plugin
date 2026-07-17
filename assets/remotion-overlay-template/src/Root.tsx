import React from "react";
import {Composition} from "remotion";
import projectJson from "./project.json";
import {ExplainerVideo} from "./ExplainerVideo";
import type {ExplainerProject} from "./types";

const project = projectJson as ExplainerProject;
const durationInFrames = project.scenes.reduce(
  (total, scene) => total + Math.max(1, Math.round(scene.durationSeconds * project.fps)),
  0,
);

export const Root: React.FC = () => (
  <Composition
    id="ExplainerVideo"
    component={ExplainerVideo}
    durationInFrames={durationInFrames}
    fps={project.fps}
    width={project.width}
    height={project.height}
    defaultProps={{project}}
  />
);

