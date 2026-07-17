export type CameraMotion = "none" | "slow-zoom-in" | "slow-zoom-out" | "pan-left" | "pan-right";
export type OverlayStrategy =
  | "artwork-only"
  | "kinetic-text"
  | "diagram"
  | "chart"
  | "equation"
  | "artwork-with-overlays";
export type TextRole = "title" | "label" | "value" | "definition" | "equation" | "takeaway";
export type ShapeType = "circle" | "rounded-rect" | "line" | "arrow" | "progress-bar";
export type AnimationAction = "reveal" | "draw" | "grow" | "count" | "move" | "pulse" | "highlight";
export type Easing = "linear" | "ease-out" | "ease-in-out" | "spring";
export type LayoutPlacement =
  | "above"
  | "below"
  | "left"
  | "right"
  | "near"
  | "inside"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface LayoutIntent {
  target?: string;
  placement?: LayoutPlacement;
  avoid?: string[];
  priority?: "low" | "medium" | "high";
  autoPlace?: boolean;
  maxDistance?: number;
}

export interface LayoutObject {
  id: string;
  type: "character" | "face" | "hand" | "object" | "diagram" | "reserved" | "caption" | "artwork";
  bbox: [number, number, number, number];
  avoid?: boolean;
  label?: string;
}

export interface EssentialText {
  id: string;
  text: string;
  role: TextRole;
  x: number;
  y: number;
  align?: "left" | "center" | "right";
  maxWidth?: number;
  color?: string;
  background?: string;
  numericValue?: number;
  suffix?: string;
  intent?: LayoutIntent;
}

export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  intent?: LayoutIntent;
}

export interface AnimationCue {
  action: AnimationAction;
  target: string;
  startProgress: number;
  durationSeconds: number;
  easing?: Easing;
  triggerPhrase?: string;
}

export interface SceneOverlay {
  strategy: OverlayStrategy;
  essentialText?: EssentialText[];
  shapes?: Shape[];
  animationCues?: AnimationCue[];
}

export interface ExplainerScene {
  id: string;
  durationSeconds: number;
  backgroundImage: string;
  cameraMotion?: CameraMotion;
  objects?: LayoutObject[];
  overlay?: SceneOverlay;
}

export interface ExplainerProject {
  fps: number;
  width: number;
  height: number;
  audioPath: string;
  voiceoverDurationSeconds: number;
  backgroundColor?: string;
  scenes: ExplainerScene[];
}

