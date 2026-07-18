# Overlay storyboard contract

Use this contract when a scene needs editable text, diagrams, charts, equations, cutout assets, or other deterministic motion graphics. Generated storyboard panels provide the base artwork; transparent foreground assets and editable overlays can be layered around them so the illustration and explanation read as one composition.

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
    "groups": [],
    "assets": [],
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
  "suffix": "%",
  "groupId": "output-callout",
  "coordinateSpace": "artwork",
  "zIndex": 20,
  "intent": {
    "target": "output-node",
    "placement": "above",
    "avoid": ["face", "caption"],
    "priority": "high",
    "autoPlace": true
  }
}
```

Coordinates and widths are normalized from `0` to `1`. `role` is one of `title`, `label`, `value`, `definition`, `equation`, or `takeaway`.

Only include text necessary to understand the visual: names, short definitions, numbers and units, diagram labels, equations, step names, and the key takeaway. Prefer 1-6 words. Never place essential copy inside generated artwork. Keep subtitles separate from `essentialText`.

Use `intent` when a text element needs to stay visually attached to a generated object or overlay shape. `target` may reference a shape, another text element, or a scene object. `placement` is one of `above`, `below`, `left`, `right`, `near`, `inside`, `top-left`, `top-right`, `bottom-left`, or `bottom-right`. Set `autoPlace: true` when the local solver is allowed to move the text before rendering.

## Scene objects and avoid zones

Add `objects` when important generated illustration regions should guide overlay placement:

```json
{
  "objects": [
    {"id": "maya", "type": "character", "bbox": [0.03, 0.28, 0.22, 0.82]},
    {"id": "tree", "type": "artwork", "bbox": [0.78, 0.18, 0.96, 0.80]},
    {"id": "caption-band", "type": "caption", "bbox": [0.20, 0.82, 0.80, 0.98]}
  ]
}
```

Object boxes use normalized `[x1, y1, x2, y2]` coordinates. Use them for faces, hands, screens, detailed objects, important diagram art, and reserved caption areas. Keep boxes tight; overly broad avoid zones make the solver push labels too far away from their targets.

## Layers and coordinate spaces

Every text, shape, and asset may set `zIndex`, `groupId`, and `coordinateSpace`.

- Use `coordinateSpace: "screen"` for titles, captions, and UI-like elements that must remain fixed while the camera moves.
- Use `coordinateSpace: "artwork"` for arrows, labels, highlights, and cutouts attached to the illustration. These receive the same pan and zoom as the background artwork.
- Use `zIndex` to interleave shapes, text, and transparent foreground assets. Shapes default to `10`, assets to `15`, and text to `20`.

Do not rely on array order for depth. Declare `zIndex` whenever an overlay must pass behind or in front of a cutout.

## Anchored groups

Use a group when a card, label, connector, and value form one visual unit. Members keep their own normalized coordinates but move together.

```json
{
  "groups": [
    {
      "id": "growth-callout",
      "anchorTo": "tree",
      "placement": "left",
      "bbox": [0.58, 0.30, 0.82, 0.54],
      "coordinateSpace": "artwork",
      "zIndex": 20
    }
  ]
}
```

Set each member's `groupId` to the group ID. `anchorTo` may reference a scene object or overlay element. The renderer resolves the group against that target, while `offsetX` and `offsetY` provide small signed normalized adjustments. The layout fixer moves the group as a unit instead of separating its text from its shapes.

## Foreground and cutout assets

Place transparent PNG, WebP, or SVG files under `public/overlays` and declare them in `assets`:

```json
{
  "id": "maya-foreground",
  "src": "overlays/maya-foreground.png",
  "x": 0.78,
  "y": 0.66,
  "width": 0.32,
  "height": 0.62,
  "fit": "contain",
  "coordinateSpace": "artwork",
  "zIndex": 30
}
```

Use cutouts to let arrows, diagrams, or cards pass behind an illustrated character or object. Keep the full background plate as the lowest layer; add only the foreground pieces needed to create useful depth.

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

Use `startSeconds` instead when an exact audio-resolved scene time is known; set exactly one of `startProgress` or `startSeconds`. A `move` cue also declares signed normalized `offsetX` and/or `offsetY`.

Every cue target must match a group, asset, shape, or essential-text ID. Multiple cues may target the same element, so a group can reveal and later pulse or move. Use no more than eight cues per scene unless the explanation genuinely requires more.

## Visual-aware layout QA

Run the layout analyzer after `project.json` is written and before the expensive final render:

```powershell
node scripts/analyze-overlay-layout.mjs src/project.json --json output/layout-report.json
```

From the plugin root, run:

```powershell
node scripts/analyze-overlay-layout.mjs <copied-template>/src/project.json --json <copied-template>/output/layout-report.json
```

The analyzer uses FFmpeg to sample each raster background scene, estimate dense illustration regions, resolve anchored groups, and compare them with deterministic text, shape, and asset boxes. SVG backgrounds skip raster saliency but still receive geometry and overlap checks. The analyzer does not mutate the project unless `--apply` is used. It reports:

- text that sits on dense artwork,
- filled shapes that cover dense illustration detail,
- overlapping text boxes,
- suggested safer normalized `x`/`y` positions for risky text.

Treat this as a fast pre-render gate. Fix reported overlay positions in `project.json`, rerun the analyzer, then render only when it reports zero unexpected findings.

To let the solver write improved text positions back into `project.json`, run:

```powershell
npm run layout-fix
```

Only text with a collision, an anchored group, or `intent.autoPlace: true` is moved by default. Grouped text moves by changing the group's offsets, keeping its associated shapes and assets together. Use tight scene objects plus explicit targets and placements so the solver keeps each callout close to the illustration element it explains.

To review one near-final still per scene without rendering a full MP4, run:

```powershell
npm run layout-stills
```

This writes individual scene stills and `output/qa/layout/layout-contact-sheet.png`.

