---
name: storyboard-director
description: Design narration, audio-derived timing, slide plan, and a master storyboard prompt for a story-driven explainer presentation, defaulting to a polished editorial whiteboard style. Use for storyboard planning, voiceover-synchronized slide timestamps, or when a user wants slides, visual prompts, and timing without immediately rendering the final video.
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
- theme_bible
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
- story_role
- on_slide_text
- character_action
- layout
- reveal_beats

Rules:

- Write narration in the style of a polished YouTube explainer: open with a clear hook, establish why the topic matters, explain one idea at a time, and finish with a concise takeaway.
- Use plain, conversational language, short sentences, and as few words as necessary. Prefer familiar words over jargon and define any technical term immediately.
- Make the script sound natural when spoken aloud. Do not include headings, stage directions, scene labels, or production notes in the voiceover text.
- Remove filler, repetition, exaggerated claims, and unnecessary calls to action unless the user requests them.
- Target 4-8 minutes (240-480 seconds). Use 4 minutes when the user gives no duration. Honor a shorter duration only when the user explicitly requests it; never exceed 8 minutes.
- Use second-based scene timestamps for precise narration alignment and rendering, even when the overall duration is expressed in minutes.
- Treat every scene as one explainer-presentation slide and one chapter in a continuous story. Derive the slide count from meaningful narrative chapters and the supplied or measured voiceover duration. Target 2-3 slides per minute, equivalent to 20-30 seconds per slide on average.
- When voiceover audio is available, analyze it with `pydub` silence/speech detection and verify duration with FFprobe. Prefer cumulative measured durations from one audio file per scene; otherwise snap monolithic-audio boundaries to natural pause midpoints. Never replace audio analysis with a fixed duration per image.
- Set top-level `timing_source` to `per_scene_audio`, `monolithic_pause_analysis`, or `estimated`. Set every scene's `timing_source` too, and point `audio_analysis_file` to the JSON analysis artifact when audio exists.
- Calculate `minimum_scene_count = ceil(duration_seconds / 30)` and `maximum_scene_count = floor(duration_seconds / 20)`. Choose a count inside that inclusive range based on meaningful story chapters; if the range is empty for an unusually short clip, use one slide. Combine nearby beats until the count is in range without dropping essential narration.
- Record the formula, measured or estimated duration, calculated range, chosen scene count, achieved scenes per minute, and average scene duration in `scene_count_rationale`.
- Keep scene timing aligned with natural speech. Require contiguous timestamps starting at 0 and ending at the measured voiceover duration. Flag any pause-analysis boundary that falls back to a uniform cut for manual review.
- Give every slide 2-4 internal `reveal_beats` tied to exact voiceover timestamps or trigger phrases. Each beat must specify the narration trigger, start time, and visual change, favoring progressive draw-on strokes, text, pink underlines, arrows, highlights, callouts, diagram states, character action, crop, or camera motion.
- Do not leave the complete slide static for its full duration. A slide may run longer than 30 seconds only when its timed reveal beats create purposeful visual progression.
- Make adjacent slides advance the story through a new question, consequence, insight, mechanism, proof point, or resolution while keeping a stable presentation design language.
- Default to a polished editorial whiteboard style unless the user explicitly requests another visual direction.
- Establish one top-level `theme_bible` for all panels: named recurring character designs and wardrobe, warm off-white paper, faint square grid, confident black hand-drawn outlines, restrained light-gray pencil hatching, one pink accent family, typography, generous spacing, rounded frames, geometric edge decorations, hand-drawn icons, and crisp pink offset shadows. Repeat the essential character and theme anchors in every slide description.
- Use oversized black editorial display headlines, clean supporting labels, simple whiteboard metaphors, and one clear visual reading path. Keep pink for emphasis rather than body copy.
- Avoid photorealism, 3D rendering, glossy UI, gradients, saturated extra colors, stock imagery, dense scenery, messy marker scribbles, comic panels, and heavy soft shadows.
- Describe subjects, composition, background, lighting, and emotional purpose.
- Make every final slide presentation-complete: concise headline, only the supporting copy needed for comprehension, at least one named recurring story character, and one explanatory visual such as a diagram, comparison, object, chart, or environment.
- Keep `on_slide_text` concise and exact: prefer a headline of at most 7 words and no more than 20 additional words across labels, callouts, or supporting copy. Do not use the narration transcript as slide copy.
- Reserve clean, high-contrast text zones in the generated art. Plan to add the exact copy as a deterministic post-generation overlay after panel extraction rather than relying on generated bitmap lettering.
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

Use this structure, followed by the numbered scene descriptions. Include the editorial whiteboard block for the default style; replace only that block with an equally specific visual contract when the user explicitly requests another style.

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

PRESENTATION STORYTELLING:
- Treat every cell as one polished explainer-presentation slide and one chapter in a continuous story.
- Every slide includes at least one named recurring story character and one explanatory visual.
- Reserve clean, uncluttered, high-contrast zones for the exact headline and supporting copy specified in each scene. The exact text will be composited after extraction; do not invent words or render lettering in the base artwork.
- Show the complete base composition; timed reveals, highlights, and camera moves will be added during video rendering.
- Do not add panel numbers, logos, watermarks, or unspecified text.

EDITORIAL WHITEBOARD VISUAL SYSTEM:
- Use a warm off-white paper background with an extremely faint square grid.
- Draw all characters, arrows, icons, diagrams, charts, and objects as clean black hand-sketched line art with confident outlines and restrained light-gray pencil hatching.
- Limit the palette to black, white, pale gray, and one pink accent family. Use pink sparingly for emphasis, selected fills, marker strokes, and crisp offset shadows.
- Use generous negative space, an oversized headline zone, rounded rectangular content frames, cropped geometric decorations at selected edges, and a clear visual reading path.
- Keep every named character identical across slides in face, hair, clothing, body proportions, and drawing style.
- Use simple whiteboard metaphors and topic-specific diagrams instead of realistic environments.
- No photorealism, 3D, glossy UI, gradients, saturated extra colors, stock imagery, dense scenery, messy marker scribbles, comic panels, or heavy soft shadows.

For every numbered slide description, specify: story role, voiceover idea, named character and action, base composition, explanatory visual, reserved text-zone layout, exact on-slide copy for later overlay, and planned reveal beats. Reveal beats describe later animation and must not create nested panels in the base image.

SLIDES IN ROW-MAJOR ORDER:
{NUMBERED_SCENE_DESCRIPTIONS}

Final compliance check before output: exactly one 4:3 image; {COLUMNS}x{ROWS} equal grid; {CELL_COUNT} cells; all {SCENE_COUNT} scenes; every individual cell exact 16:9; all requested scenes visible inside the canvas.
```
