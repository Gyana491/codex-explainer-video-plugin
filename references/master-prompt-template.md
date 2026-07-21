# Master storyboard prompt template

The generated sheet is a DRAFT. `scripts/canonicalize_storyboard.py` rebuilds
exact 4:3/16:9 geometry deterministically, so do not spend prompt tokens on
pixel equations. Ask only for what image generation can control.

Scene count is capped at 6, so one sheet in a 3x2 (or smaller) grid always
fits — there is no default multi-sheet case. See § Chunked sheets only for
an explicit user request beyond 6 scenes.

Substitute the placeholders, append numbered scene descriptions:

```text
Create ONE storyboard contact sheet: a single 4:3 landscape image containing
ALL {SCENE_COUNT} scenes in a {COLUMNS}x{ROWS} grid of equal 16:9 landscape
panels[, plus one asset tray below the grid — see TRAY below].

LAYOUT:
- Even gutters, thin uniform dividers, grid centered, remaining canvas plain
  neutral.
- Scenes fill cells 1-{SCENE_COUNT} left-to-right, top-to-bottom. Leave cells
  {FIRST_UNUSED}-{CELL_COUNT} plain and empty; invent no extra scenes.
  [Omit this line when no cells are unused.]
- One composition per cell — no collages, comic strips, or nested mini-panels.
- Keep every character, subject, and reserved zone well inside its panel
  with generous safe margins: panels will be machine center-cropped to exact
  16:9, and content near dividers will be lost.
- No panel numbers, logos, watermarks, or lettering anywhere. Every reserved
  zone below is empty space — exact text is added deterministically after
  extraction.

STYLE AND CONTINUITY:
{STYLE_AND_CONTINUITY_RULES}

SLIDES IN ROW-MAJOR ORDER (each slide: one clear idea, readable without
narration; at least one named recurring character or object drawn
identically; one explanatory visual; distinct composition; explicit reserved
zones with position AND purpose, e.g. "keep the left third clear for a hook
card", "preserve a calm central clearing for the diagram", "quiet upper
label band"):
{NUMBERED_SCENE_DESCRIPTIONS}

[TRAY, only when the storyboard plan declares cutouts — see
house-style.md § Cutout tray:
Below the scene grid, add one horizontal asset tray of {CUTOUT_COUNT} equal
cells in a single row, clearly separated from the scene grid. Each cell has
a perfectly flat, uniform solid {CHROMA_COLOR} background extending to all
four cell edges — no gradient, texture, shadow, or scenery in that
background. Each cell contains one full-body subject in the same drawing
language, palette, and proportions as the scene panels, generous padding,
no cast shadow, no ground plane, no scenery.
{NUMBERED_CUTOUT_DESCRIPTIONS}]
```

For the default style, `{STYLE_AND_CONTINUITY_RULES}` is the bullet list in
`references/house-style.md`.

## Chunked sheets (only when the user explicitly requests more than 6 scenes)

The default scene cap is 6, which always fits one sheet. If the user
explicitly asks for a longer, denser video and you agree to exceed 6 scenes:

- Split scenes into `ceil(scene_count / 6)` sheets of consecutive scenes.
- Make exactly one image-generation call per sheet — never a retry,
  correction, or replacement call for any sheet.
- Repeat the identical STYLE AND CONTINUITY block and the named character
  descriptions verbatim in every sheet prompt so panels match across sheets.
- Number scenes globally ({start}-{end} per sheet) and extract candidates
  from every sheet into one `scene-NN` sequence before running
  `scripts/canonicalize_storyboard.py`, which assembles the single accepted
  master from all candidates.

## Draft inspection

Inspect each returned sheet only for: all requested scenes present, correct
order, separable panels, style continuity, reserved zones visibly empty. A
sheet with missing, merged, or duplicated scenes fails the run for that
sheet's scenes; report it to the user instead of regenerating. Approximate
panel borders are fine — the compositor replaces them.
