---
name: storyboard-director
description: Design the narration, timing, shot list, and master storyboard prompt for an explainer video before assets are generated. Use for storyboard planning or when a user wants scenes, visual prompts, and timing without immediately rendering the final video.
---

# Storyboard director

Create a production-ready storyboard package.

Return or save structured JSON with:

- title
- target_duration
- duration_unit
- aspect_ratio
- fps
- visual_style
- narration_style
- narration
- voiceover_duration_seconds
- scene_count_rationale
- storyboard_grid
- average_scene_duration_seconds
- master_prompt
- scenes

Each scene must include:

- scene_number
- start_seconds
- end_seconds
- narration_segment
- visual_description
- camera_motion
- transition
- crop_panel

Rules:

- Write narration in the style of a polished YouTube explainer: open with a clear hook, establish why the topic matters, explain one idea at a time, and finish with a concise takeaway.
- Use plain, conversational language, short sentences, and as few words as necessary. Prefer familiar words over jargon and define any technical term immediately.
- Make the script sound natural when spoken aloud. Do not include headings, stage directions, scene labels, or production notes in the voiceover text.
- Remove filler, repetition, exaggerated claims, and unnecessary calls to action unless the user requests them.
- Target 4-8 minutes (240-480 seconds). Use 4 minutes when the user gives no duration. Honor a shorter duration only when the user explicitly requests it; never exceed 8 minutes.
- Use second-based scene timestamps for precise narration alignment and rendering, even when the overall duration is expressed in minutes.
- Derive the scene count from the script's distinct visual beats and the supplied or measured voiceover duration, then check the visual cadence. Aim for a new scene every 10-12 seconds and never leave one still panel on screen longer than 15 seconds unless the content deliberately needs a pause.
- When voiceover audio is available, measure its actual duration and use it to set scene boundaries. Otherwise, estimate duration from the final narration and identify the value as an estimate.
- For 4-8 minute videos, use at least `ceil(duration_seconds / 15)` scenes and normally `ceil(duration_seconds / 12)` through `ceil(duration_seconds / 10)` scenes. This typically means 20-24 scenes for 4 minutes and 40-48 scenes for 8 minutes.
- Use no more than 49 scenes in one master storyboard. If the script contains more than 49 visual beats, combine closely related beats without dropping essential narration.
- Keep scene timing aligned with natural speech.
- Make adjacent scenes visibly different in at least one meaningful way: subject action, camera distance, camera angle, environment, diagram state, or point of view. Alternate establishing, medium, close-up, process, comparison, and consequence shots where appropriate; do not create a sequence of near-identical talking-head panels.
- Maintain one consistent art direction across all panels.
- Describe subjects, composition, background, lighting, and emotional purpose.
- Do not put essential copy inside the generated image.
- Set `storyboard_grid.master_aspect_ratio` and `storyboard_grid.panel_aspect_ratio` to `16:9`. Include `rows`, `columns`, `scene_count`, `cell_count`, `unused_cell_count`, and `reading_order: row-major`.
- Use a square grid: `rows = columns = ceil(sqrt(scene_count))`. A square grid is mandatory because it is the only equal-cell grid that keeps both the 16:9 master canvas and every cell at 16:9. Put scenes in row-major order and leave only the trailing unused cells as plain neutral cells.
- Require every scene panel inside the master storyboard to be an exact 16:9 landscape frame with identical dimensions, straight boundaries, and clear gutters. Do not accept approximate, square, portrait, or mixed-ratio panels.
- Include a master prompt that follows the contract below and substitutes exact values. Repeat the counts and ratios because panel geometry is a hard requirement, not an artistic suggestion.
- Keep all important subjects and action inside each panel's 16:9 safe area.
- Verify that each panel's pixel dimensions satisfy `width * 9 = height * 16`. Regenerate a malformed storyboard instead of stretching its panels.
- Treat `aspect_ratio` as the final video ratio. When the final output is vertical, compose each 16:9 source panel so its important content also survives a centered 9:16 crop.

## Master storyboard prompt contract

Use this structure, followed by the numbered scene descriptions:

```text
Create ONE master storyboard contact sheet as a single exact 16:9 landscape image.

HARD LAYOUT CONTRACT:
- Draw exactly {G} columns by {G} rows: {CELL_COUNT} equal cells total.
- Every cell is an exact 16:9 landscape rectangle. No square, portrait, merged, inset, overlapping, or irregular cells.
- The complete outer canvas is also exact 16:9. Keep the {G}x{G} grid square; do not change its rows or columns.
- Use identical cell dimensions, perfectly straight aligned boundaries, and thin uniform divider strokes inside the cell edges.
- Place exactly {SCENE_COUNT} illustrated scenes in cells 1-{SCENE_COUNT}, read left-to-right and top-to-bottom.
- Leave cells {FIRST_UNUSED}-{CELL_COUNT} plain neutral and empty. Do not invent extra scenes. [Omit this line when no cells are unused.]
- Fit the complete grid inside the canvas. Nothing may extend beyond or be clipped by the outer image.
- Keep each scene visually self-contained and keep important subjects away from dividers.
- Show one composition per cell. Do not subdivide a cell into a collage, comic strip, or nested mini-panels.

VISUAL CONTINUITY:
{STYLE_AND_CONTINUITY_RULES}

SCENES IN ROW-MAJOR ORDER:
{NUMBERED_SCENE_DESCRIPTIONS}

Final compliance check before output: one 16:9 image; {G}x{G} equal grid; {CELL_COUNT} cells; {SCENE_COUNT} scenes; every individual cell exact 16:9; all requested scenes visible inside the canvas.
```
