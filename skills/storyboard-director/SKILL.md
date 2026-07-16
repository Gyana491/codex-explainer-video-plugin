---
name: storyboard-director
description: Design narration, audio-derived timing, shot list, and a master storyboard prompt for an explainer video before assets are generated. Use for storyboard planning, voiceover-synchronized scene timestamps, or when a user wants scenes, visual prompts, and timing without immediately rendering the final video.
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
- timing_source
- audio_analysis_file
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
- timing_source

Rules:

- Write narration in the style of a polished YouTube explainer: open with a clear hook, establish why the topic matters, explain one idea at a time, and finish with a concise takeaway.
- Use plain, conversational language, short sentences, and as few words as necessary. Prefer familiar words over jargon and define any technical term immediately.
- Make the script sound natural when spoken aloud. Do not include headings, stage directions, scene labels, or production notes in the voiceover text.
- Remove filler, repetition, exaggerated claims, and unnecessary calls to action unless the user requests them.
- Target 4-8 minutes (240-480 seconds). Use 4 minutes when the user gives no duration. Honor a shorter duration only when the user explicitly requests it; never exceed 8 minutes.
- Use second-based scene timestamps for precise narration alignment and rendering, even when the overall duration is expressed in minutes.
- Derive the scene count from the script's distinct visual beats and the supplied or measured voiceover duration, then check the visual cadence. Target 10-12 scenes per minute, equivalent to 5-6 seconds per scene on average. Avoid leaving an ordinary still panel on screen longer than 8 seconds unless the content deliberately needs a pause.
- When voiceover audio is available, analyze it with `pydub` silence/speech detection and verify duration with FFprobe. Prefer cumulative measured durations from one audio file per scene; otherwise snap monolithic-audio boundaries to natural pause midpoints. Never replace audio analysis with a fixed duration per image.
- Set top-level `timing_source` to `per_scene_audio`, `monolithic_pause_analysis`, or `estimated`. Set every scene's `timing_source` too, and point `audio_analysis_file` to the JSON analysis artifact when audio exists.
- Calculate `minimum_scene_count = ceil(duration_seconds / 6)` and `maximum_scene_count = floor(duration_seconds / 5)`. Choose a count inside that inclusive range based on meaningful beats; if the range is empty for an unusually short clip, use one scene. Split or combine nearby beats until the count is in range without dropping essential narration.
- Record the formula, measured or estimated duration, calculated range, chosen scene count, achieved scenes per minute, and average scene duration in `scene_count_rationale`.
- Keep scene timing aligned with natural speech. Require contiguous timestamps starting at 0 and ending at the measured voiceover duration. Flag any pause-analysis boundary that falls back to a uniform cut for manual review.
- Make adjacent scenes visibly different in at least one meaningful way: subject action, camera distance, camera angle, environment, diagram state, or point of view. Alternate establishing, medium, close-up, process, comparison, and consequence shots where appropriate; do not create a sequence of near-identical talking-head panels.
- Maintain one consistent art direction across all panels.
- Describe subjects, composition, background, lighting, and emotional purpose.
- Do not put essential copy inside the generated image.
- Generate exactly one master storyboard containing every scene.
- Calculate `grid_scale = ceil(sqrt(scene_count / 12))`, `columns = 3 * grid_scale`, `rows = 4 * grid_scale`, and `cell_count = 12 * grid_scale^2`.
- Set `storyboard_grid.master_aspect_ratio` to `4:3` and `panel_aspect_ratio` to `16:9`. Include `grid_scale`, `rows`, `columns`, `scene_count`, `cell_count`, `unused_cell_count`, and `reading_order: row-major`.
- Keep the grid proportional at `3k` columns by `4k` rows. This makes the single master exact 4:3 while keeping all equal cells exact 16:9 because `(3 x 16):(4 x 9) = 4:3`.
- Put every scene in row-major order and leave only the trailing unused cells plain neutral.
- Require every scene panel inside the master storyboard to be an exact 16:9 landscape frame with identical dimensions, straight boundaries, and clear gutters. Do not accept approximate, square, portrait, or mixed-ratio panels.
- Include one `master_prompt` that follows the contract below and substitutes exact values. Repeat the counts and ratios because panel geometry is a hard requirement, not an artistic suggestion.
- Keep all important subjects and action inside each panel's 16:9 safe area.
- Verify that each panel's pixel dimensions satisfy `width * 9 = height * 16`. Regenerate a malformed storyboard instead of stretching its panels.
- Treat `aspect_ratio` as the final video ratio. When the final output is vertical, compose each 16:9 source panel so its important content also survives a centered 9:16 crop.

## Master storyboard prompt contract

Use this structure, followed by the numbered scene descriptions:

```text
Create ONE master storyboard contact sheet as a single exact 4:3 landscape image containing ALL {SCENE_COUNT} scenes.

HARD LAYOUT CONTRACT:
- Draw exactly {COLUMNS} columns by {ROWS} rows: {CELL_COUNT} equal cells total.
- Every cell is an exact 16:9 landscape rectangle. No square, portrait, merged, inset, overlapping, or irregular cells.
- The complete outer canvas is exact 4:3 landscape. Keep the grid at 3k columns by 4k rows, where k={GRID_SCALE}; do not change its rows or columns.
- Use identical cell dimensions, perfectly straight aligned boundaries, and thin uniform divider strokes inside the cell edges.
- Place all {SCENE_COUNT} scenes in cells 1-{SCENE_COUNT}, read left-to-right and top-to-bottom.
- Leave cells {FIRST_UNUSED}-{CELL_COUNT} plain neutral and empty. Do not invent extra scenes. [Omit this line when no cells are unused.]
- Fit the complete grid inside the canvas. Nothing may extend beyond or be clipped by the outer image.
- Keep each scene visually self-contained and keep important subjects away from dividers.
- Show one composition per cell. Do not subdivide a cell into a collage, comic strip, or nested mini-panels.

VISUAL CONTINUITY:
{STYLE_AND_CONTINUITY_RULES}

SCENES IN ROW-MAJOR ORDER:
{NUMBERED_SCENE_DESCRIPTIONS}

Final compliance check before output: exactly one 4:3 image; {COLUMNS}x{ROWS} equal grid; {CELL_COUNT} cells; all {SCENE_COUNT} scenes; every individual cell exact 16:9; all requested scenes visible inside the canvas.
```
