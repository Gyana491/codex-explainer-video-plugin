# Master storyboard prompt template

The generated sheet is a DRAFT. `scripts/canonicalize_storyboard.py` rebuilds
exact 4:3/16:9 geometry deterministically, so do not spend prompt tokens on
pixel equations. Ask only for what image generation can control.

Substitute the placeholders, append numbered scene descriptions:

```text
Create ONE storyboard contact sheet: a single 4:3 landscape image containing
ALL {SCENE_COUNT} scenes in a {COLUMNS}x{ROWS} grid of equal 16:9 landscape
panels.

LAYOUT:
- Even gutters, thin uniform dividers, grid centered, remaining canvas plain
  neutral.
- Scenes fill cells 1-{SCENE_COUNT} left-to-right, top-to-bottom. Leave cells
  {FIRST_UNUSED}-{CELL_COUNT} plain and empty; invent no extra scenes.
  [Omit this line when no cells are unused.]
- One composition per cell — no collages, comic strips, or nested mini-panels.
- Keep every character, subject, and reserved text zone well inside its panel
  with generous safe margins: panels will be machine center-cropped to exact
  16:9, and content near dividers will be lost.
- No panel numbers, logos, watermarks, or lettering. Reserve the declared
  clear zones (title area, label areas, lower caption band) as empty space —
  exact text is added deterministically afterward.

STYLE AND CONTINUITY:
{STYLE_AND_CONTINUITY_RULES}

SLIDES IN ROW-MAJOR ORDER (each slide: one clear idea, readable without
narration; at least one named recurring character drawn identically; one
explanatory visual; distinct composition):
{NUMBERED_SCENE_DESCRIPTIONS}
```

For the default style, `{STYLE_AND_CONTINUITY_RULES}` is the bullet list in
`references/whiteboard-style.md`.

## Chunked sheets for long videos

More than 12 scenes on one sheet makes each panel too small to survive
upscaling. When `scene_count > 12`:

- Split scenes into `ceil(scene_count / 12)` sheets of consecutive scenes.
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
order, separable panels, style continuity. Approximate borders are fine — the
compositor replaces them. A sheet with missing, merged, or duplicated scenes
fails the run for that sheet's scenes; report it to the user instead of
regenerating.
