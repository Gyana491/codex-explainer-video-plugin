# Overlay storyboard contract

Use this contract when a scene needs editable text, diagrams, charts, equations, or other deterministic motion graphics. Generated storyboard panels remain background artwork; overlays carry exact information.

## Project shape

```json
{
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "audioPath": "audio/voiceover.mp3",
  "voiceoverDurationSeconds": 42.8,
  "scenes": []
}
```

Use `1080x1920` for vertical output. Scene durations must sum to the measured voiceover duration within 0.25 seconds.

## Scene shape

```json
{
  "id": "scene-03",
  "durationSeconds": 5.7,
  "backgroundImage": "scenes/scene-03.png",
  "cameraMotion": "slow-zoom-in",
  "overlay": {
    "strategy": "diagram",
    "essentialText": [],
    "shapes": [],
    "animationCues": []
  }
}
```

`cameraMotion` is one of `none`, `slow-zoom-in`, `slow-zoom-out`, `pan-left`, or `pan-right`.

`strategy` is one of:

- `artwork-only`
- `kinetic-text`
- `diagram`
- `chart`
- `equation`
- `artwork-with-overlays`

## Essential text

```json
{
  "id": "output-label",
  "text": "Useful output",
  "role": "label",
  "x": 0.76,
  "y": 0.42,
  "align": "center",
  "maxWidth": 0.22,
  "numericValue": 72,
  "suffix": "%"
}
```

Coordinates and widths are normalized from `0` to `1`. `role` is one of `title`, `label`, `value`, `definition`, `equation`, or `takeaway`.

Only include text necessary to understand the visual: names, short definitions, numbers and units, diagram labels, equations, step names, and the key takeaway. Prefer 1-6 words. Never place essential copy inside generated artwork. Keep subtitles separate from `essentialText`.

## Shapes

All geometry uses normalized coordinates.

```json
{
  "id": "input-node",
  "type": "circle",
  "x": 0.24,
  "y": 0.5,
  "width": 0.13,
  "height": 0.13,
  "fill": "#2563eb",
  "stroke": "#0f172a",
  "strokeWidth": 4
}
```

Supported types:

- `circle` and `rounded-rect`: use `x`, `y`, `width`, and `height`.
- `line` and `arrow`: use `x`, `y`, `x2`, and `y2`.
- `progress-bar`: use `x`, `y`, `width`, and `height`; its fill grows with its animation cue.

Treat `x` and `y` as the center for circles and rounded rectangles, and as the start point for lines and arrows.

## Animation cues

```json
{
  "action": "draw",
  "target": "flow-arrow",
  "startProgress": 0.32,
  "durationSeconds": 0.7,
  "easing": "ease-out",
  "triggerPhrase": "moves to the next step"
}
```

`action` is one of `reveal`, `draw`, `grow`, `count`, `move`, `pulse`, or `highlight`. `easing` is one of `linear`, `ease-out`, `ease-in-out`, or `spring`.

Use `startProgress` for deterministic timing. It is normalized within the scene. Preserve `triggerPhrase` as planning metadata; if word-level alignment is added later, it can replace the approximate progress without changing the scene contract.

Every cue target must match a shape or essential-text ID. Use no more than five cues per scene unless the explanation genuinely requires more.

