---
name: storyboard-director
description: Extract a source's essence and design clear, relatable narration, audio-derived timing, a slide plan, and a master storyboard prompt for a story-driven explainer presentation, defaulting to a polished whiteboard-inspired style. Use for source-to-explainer planning, voiceover-synchronized slide and caption timestamps, or when a user wants slides, visual prompts, and timing without immediately rendering the final video.
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
- source_essence
- source_essence_file
- narration
- voiceover_duration_seconds
- timing_source
- audio_analysis_file
- word_timing_file
- caption_file
- caption_style
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
- caption_safe_area
- reveal_beats

Rules:

- Read the complete source or input before outlining. Distill it into `source_essence` with `central_question`, `one_sentence_idea`, `audience`, `why_it_matters`, 3-5 `must_understand_points`, `supporting_evidence_or_examples`, `likely_misconception`, and `final_takeaway`. Point `source_essence_file` to `output/source-essence.json`.
- Preserve the source's meaning, evidence, qualifications, and causal relationships rather than its original structure or wording. Remove tangents, repetition, and detail that does not change audience understanding.
- Never invent unsupported facts, statistics, quotes, examples, or certainty. Preserve meaningful uncertainty and surface conflicting source claims for review.
- Write narration in a polished explainer style using a clear story arc: relatable hook, audience problem, consequence or confusion, simple insight, how it works, concrete example, result, and memorable takeaway.
- Use familiar situations and concrete stakes so the audience feels why the topic matters. Create resonance through recognition and clarity, not hype or manufactured drama.
- Explain one idea at a time with plain conversational language, short sentences, active voice, familiar words, and concrete verbs. Assume no prior knowledge and define unavoidable jargon immediately in everyday language.
- Use analogies only when they clarify the mechanism, and state their limits when they could mislead. Simplify without removing conditions that change the meaning.
- Make the script sound natural when spoken aloud. Do not include headings, stage directions, scene labels, or production notes in the voiceover text.
- Remove filler, repetition, throat-clearing, exaggerated claims, generic motivation, and unnecessary calls to action unless the user requests them.
- End with one concise takeaway the audience can repeat. Run a cold-listener test: narration alone must explain what the topic is, why it matters, how it works, and what to remember without requiring the original source or visuals.
- Target 4-8 minutes (240-480 seconds). Use 4 minutes when the user gives no duration. Honor a shorter duration only when the user explicitly requests it; never exceed 8 minutes.
- Use second-based scene timestamps for precise narration alignment and rendering, even when the overall duration is expressed in minutes.
- Treat every scene as one explainer-presentation slide and one chapter in a continuous story. Derive the slide count from meaningful narrative chapters and the supplied or measured voiceover duration. Target 2-3 slides per minute, equivalent to 20-30 seconds per slide on average.
- When voiceover audio is available, analyze it with `pydub` silence/speech detection and verify duration with FFprobe. Prefer cumulative measured durations from one audio file per scene; otherwise snap monolithic-audio boundaries to natural pause midpoints. Never replace audio analysis with a fixed duration per image.
- Set top-level `timing_source` to `per_scene_audio`, `monolithic_pause_analysis`, or `estimated`. Set every scene's `timing_source` too, and point `audio_analysis_file` to the JSON analysis artifact when audio exists.
- Calculate `minimum_scene_count = ceil(duration_seconds / 30)` and `maximum_scene_count = floor(duration_seconds / 20)`. Choose a count inside that inclusive range based on meaningful story chapters; if the range is empty for an unusually short clip, use one slide. Combine nearby beats until the count is in range without dropping essential narration.
- Record the formula, measured or estimated duration, calculated range, chosen scene count, achieved scenes per minute, and average scene duration in `scene_count_rationale`.
- Keep scene timing aligned with natural speech. Require contiguous timestamps starting at 0 and ending at the measured voiceover duration. Flag any pause-analysis boundary that falls back to a uniform cut for manual review.
- Enable captions by default and define a `caption_style` that fits the theme without competing with on-slide headlines or labels.
- When narration audio exists, force-align the approved narration to the final audio with a local tool that returns word timestamps. Never derive word timing by uniformly dividing sentence or scene duration. Point `word_timing_file` to `output/word-timings.json` and `caption_file` to `output/captions.ass`.
- Store `word`, `start_seconds`, `end_seconds`, `scene_number`, and `timing_source` for every aligned spoken token. If reliable alignment is unavailable, explicitly use phrase-level timing instead of claiming word synchronization.
- Group captions into natural phrases of roughly 3-7 words and no more than two lines. Keep the phrase visible while emphasizing only the currently spoken word with the selected accent color, stronger weight, a subtle scale increase, or marker-like underline.
- Place captions in a consistent title-safe lower area, using a clean whiteboard-style backing shape only when contrast requires it. Move them only to avoid covering essential characters, diagrams, or on-slide text.
- Give every slide 2-4 internal `reveal_beats` tied to exact voiceover timestamps or trigger phrases. Each beat must specify the narration trigger, start time, and visual change, favoring progressive draw-on strokes, text, accent-color underlines, arrows, highlights, callouts, diagram states, character action, crop, or camera motion.
- Do not leave the complete slide static for its full duration. A slide may run longer than 30 seconds only when its timed reveal beats create purposeful visual progression.
- Make adjacent slides advance the story through a new question, consequence, insight, mechanism, proof point, or resolution while keeping a stable presentation design language.
- Default to a polished whiteboard-inspired direction unless the user explicitly requests another visual direction. Treat any supplied reference as inspiration only, never as a layout or asset template.
- Establish one original top-level `theme_bible` for all panels: named recurring character designs and wardrobe, chosen bright paper-like background treatment, dark hand-drawn line art, optional restrained hatching, one topic-appropriate accent family, typography, generous spacing, container and decoration language, hand-drawn icons, and shadow treatment. Repeat the essential character and theme anchors in every slide description.
- Use strong editorial headlines, clean supporting labels, simple whiteboard metaphors, and one clear visual reading path. Keep the chosen accent for emphasis rather than body copy.
- Do not copy the reference's exact composition, characters, objects, wording, typeface, palette, or decorative placements. Vary slide layouts and visual metaphors while preserving the original theme bible.
- Avoid photorealism, 3D rendering, glossy UI, gradients, saturated extra colors, stock imagery, dense scenery, messy marker scribbles, comic panels, and heavy soft shadows.
- Describe subjects, composition, background, lighting, and emotional purpose.
- Make every final slide presentation-complete: concise headline, only the supporting copy needed for comprehension, at least one named recurring story character, and one explanatory visual such as a diagram, comparison, object, chart, or environment.
- Keep `on_slide_text` concise and exact: prefer a headline of at most 7 words and no more than 20 additional words across labels, callouts, or supporting copy. Do not use the narration transcript as slide copy.
- Reserve clean, high-contrast text zones in the generated art. Plan to add the exact copy as a deterministic post-generation overlay after panel extraction rather than relying on generated bitmap lettering.
- Define a `caption_safe_area` for every slide, normally near the title-safe lower edge and free of faces, essential diagram details, and small on-slide text.
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

Use this structure, followed by the numbered scene descriptions. Include the whiteboard-inspired block for the default style; replace only that block with an equally specific visual contract when the user explicitly requests another style.

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
- Reserve a title-safe caption area near the lower edge without faces, essential diagram details, or small on-slide text. Allow an alternate safe position only when the composition requires it.
- Show the complete base composition; timed reveals, highlights, and camera moves will be added during video rendering.
- Do not add panel numbers, logos, watermarks, or unspecified text.

WHITEBOARD-INSPIRED VISUAL DIRECTION:
- Use the reference only for broad inspiration. Do not copy its exact composition, characters, objects, typography, colors, wording, or decoration placement.
- Create an original polished whiteboard presentation with a bright paper-like background, clean dark hand-sketched line art, simple explanatory diagrams, expressive characters, editorial hierarchy, generous negative space, and a restrained accent palette chosen for this topic.
- Choose a subtle grid, dots, paper grain, or plain background; choose one topic-appropriate accent family; and use hatching, containers, geometric decorations, and offset shadows only where they improve the slide.
- Vary slide layouts and visual metaphors while preserving the same drawing language, character model, palette, typography, and spacing system.
- Keep every named character identical across slides in face, hair, clothing, body proportions, and drawing style.
- Use simple whiteboard metaphors and topic-specific diagrams instead of realistic environments.
- No photorealism, 3D, glossy UI, gradients, saturated extra colors, stock imagery, dense scenery, messy marker scribbles, comic panels, or heavy soft shadows.

For every numbered slide description, specify: story role, voiceover idea, named character and action, base composition, explanatory visual, reserved text-zone layout, exact on-slide copy for later overlay, caption-safe area, and planned reveal beats. Reveal beats describe later animation and must not create nested panels in the base image.

SLIDES IN ROW-MAJOR ORDER:
{NUMBERED_SCENE_DESCRIPTIONS}

Final compliance check before output: exactly one 4:3 image; {COLUMNS}x{ROWS} equal grid; {CELL_COUNT} cells; all {SCENE_COUNT} scenes; every individual cell exact 16:9; all requested scenes visible inside the canvas.
```
