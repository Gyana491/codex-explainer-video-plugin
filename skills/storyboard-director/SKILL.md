---
name: storyboard-director
description: Extract a source's essence and design a truthful causal story with an audience proxy, goal, stakes, obstacle, turning point, payoff, emotional progression, and visual callbacks. Produce clear narration, audio-derived timing, and a master storyboard prompt with 5-6 professional hand-drawn whiteboard slides per minute, distinct compositions, exact handwritten titles and labels, orange emphasis, and word-focused captions. Use for source-to-explainer planning, voiceover-synchronized slide and caption timestamps, or when a user wants slides, visual prompts, and timing without immediately rendering the final video.
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
- story_engine
- narration
- production_sequence
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
- story_beat
- cause_from_previous
- question_opened_or_answered
- setup_or_payoff
- emotional_shift
- visual_callback
- clear_idea
- visual_story_map
- composition_signature
- on_slide_text
- text_layout
- character_action
- layout
- caption_safe_area
- reveal_beats

Rules:

- Read the complete source or input before outlining. Distill it into `source_essence` with `central_question`, `one_sentence_idea`, `audience`, `why_it_matters`, 3-5 `must_understand_points`, `supporting_evidence_or_examples`, `likely_misconception`, and `final_takeaway`. Point `source_essence_file` to `output/source-essence.json`.
- Preserve the source's meaning, evidence, qualifications, and causal relationships rather than its original structure or wording. Remove tangents, repetition, and detail that does not change audience understanding.
- Never invent unsupported facts, statistics, quotes, examples, or certainty. Preserve meaningful uncertainty and surface conflicting source claims for review.
- Build `story_engine` before writing narration. Include `one_sentence_story`, `narrative_spine`, `audience_proxy`, `starting_state`, `goal`, `stakes`, `obstacle`, `turning_point`, `payoff`, `emotional_arc`, `visual_motif`, `open_loops`, and `callbacks`.
- Choose the simplest truthful `narrative_spine`: `transformation`, `mystery_reveal`, `problem_solution`, `journey`, or `cause_effect`. Do not force a problem-solution formula when another spine better preserves the source.
- Use a relatable audience proxy when helpful; for abstract, sensitive, historical, or technical topics, use a neutral guide, representative object, system, or central question instead of forced fiction.
- Define concrete stakes and a real obstacle, then place one midpoint turning point that changes the audience's interpretation. Resolve the opening question with a useful payoff. Never fabricate danger, conflict, urgency, certainty, or success.
- Shape an earned `emotional_arc`, such as curiosity to concern to surprise to clarity to confidence. Use recognition, consequence, discovery, and relief instead of hype or manipulation.
- Record every open loop with setup and payoff scenes. Record every visual callback with its first appearance and purposeful return. Close every loop before the ending.
- Write narration in a polished explainer style using a clear story arc: relatable hook, goal and stakes, obstacle or misconception, rising questions, turning-point insight, mechanism, proof or example, payoff, and memorable takeaway.
- Apply a `but/therefore` test between scenes. Make each scene follow because the previous beat created a complication, question, consequence, or discovery; rewrite sequences that are merely unrelated facts joined by “and then.”
- Give every scene one primary story job: `setup`, `escalation`, `question`, `reveal`, `mechanism`, `proof`, `payoff`, or `reflection`. Avoid listicle-like middle sections.
- Use familiar situations and concrete stakes so the audience feels why the topic matters. Create resonance through recognition and clarity, not hype or manufactured drama.
- Explain one idea at a time with plain conversational language, short sentences, active voice, familiar words, and concrete verbs. Assume no prior knowledge and define unavoidable jargon immediately in everyday language.
- Use analogies only when they clarify the mechanism, and state their limits when they could mislead. Simplify without removing conditions that change the meaning.
- Make the script sound natural when spoken aloud. Do not include headings, stage directions, scene labels, or production notes in the voiceover text.
- Remove filler, repetition, throat-clearing, exaggerated claims, generic motivation, and unnecessary calls to action unless the user requests them.
- End with one concise takeaway the audience can repeat. Run a cold-listener test: narration alone must explain what the topic is, why it matters, how it works, and what to remember without requiring the original source or visuals.
- Run a story-integrity test: summarize the full arc in one sentence; confirm the opening question is answered; verify every open loop closes; and remove or rewrite any scene whose absence would not break the causal logic, necessary evidence, or emotional progression.
- Target 4-8 minutes (240-480 seconds). Use 4 minutes when the user gives no duration. Honor a shorter duration only when the user explicitly requests it; never exceed 8 minutes.
- Use second-based scene timestamps for precise narration alignment and rendering, even when the overall duration is expressed in minutes.
- Set `production_sequence` to this exact order: `plan_storyboard`, `generate_master_storyboard`, `upscale_master`, `split_scenes`, `finish_scene_text`, `generate_per_scene_voiceovers`, `measure_and_concatenate_audio`, `generate_word_level_captions`, `stitch_video`.
- Treat every scene as one explainer-presentation slide and one visual idea in a continuous story. Derive the slide count from meaningful visual ideas and the supplied or measured voiceover duration. Target 5-6 slides per minute, equivalent to 10-12 seconds per slide on average.
- Before audio generation, assign one complete narration segment to every planned slide, set `timing_source` to `estimated_pre_audio`, and keep exact scene and reveal timestamps provisional. Generate, upscale, split, and finish the storyboard before generating any voiceover.
- After the scene images are final, generate exactly one voiceover file per scene in the same order using one locked voice, model, format, language, delivery, and pronunciation configuration. Save the configuration to `output/voice-config.json` and require matching zero-padded image and audio filenames.
- Measure every scene clip, concatenate them without gaps or overlaps, and replace all provisional timestamps with cumulative measured durations using `timing_source: per_scene_audio`. Preserve storyboard order and unaffected assets when one clip needs correction.
- Generate captions only after all scene audio is final. Force-align each clip locally, offset word timestamps by cumulative scene start, merge them into `output/word-timings.json`, resolve reveal triggers, and write `output/captions.ass` before stitching.
- When generated voiceover audio is available, require one file per scene, verify every duration with FFprobe, concatenate with `pydub`, and use cumulative measured clip durations as exact boundaries. Use monolithic analysis only when the user supplied an existing narration file; never use it for newly generated voiceover.
- Set top-level and scene `timing_source` to `estimated_pre_audio` before scene voiceovers exist, then replace it with `per_scene_audio` after measurement. Use `supplied_monolithic_analysis` only for user-provided audio. Point `audio_analysis_file` to the JSON analysis artifact when audio exists.
- Calculate `minimum_scene_count = ceil(duration_seconds / 12)` and `maximum_scene_count = floor(duration_seconds / 10)`. Choose a count inside that inclusive range based on meaningful visual ideas; if the range is empty for an unusually short clip, use one slide. Split or combine nearby beats until the count is in range without dropping essential narration.
- Record the formula, measured or estimated duration, calculated range, chosen scene count, achieved scenes per minute, and average scene duration in `scene_count_rationale`.
- Keep scene timing aligned with natural speech. Require contiguous timestamps starting at 0 and ending at the measured voiceover duration. Flag any pause-analysis boundary that falls back to a uniform cut for manual review.
- Enable captions by default and define a `caption_style` that fits the theme without competing with on-slide headlines or labels.
- When narration audio exists, force-align the approved narration to the final audio with a local tool that returns word timestamps. Never derive word timing by uniformly dividing sentence or scene duration. Point `word_timing_file` to `output/word-timings.json` and `caption_file` to `output/captions.ass`.
- Store `word`, `start_seconds`, `end_seconds`, `scene_number`, and `timing_source` for every aligned spoken token. If reliable alignment is unavailable, explicitly use phrase-level timing instead of claiming word synchronization.
- Group captions into natural phrases of roughly 3-7 words and no more than two lines. Keep the phrase visible while emphasizing only the currently spoken word with orange, stronger weight, a subtle scale increase, or marker-like underline.
- Place captions in a consistent title-safe lower area, using a clean whiteboard-style backing shape only when contrast requires it. Move them only to avoid covering essential characters, diagrams, or on-slide text.
- Plan 2-4 internal `reveal_beats` per slide using narration trigger phrases before audio exists; keep `start_seconds: null`. After per-scene voiceovers are finalized and aligned, resolve every trigger to an exact timestamp. Each beat must specify the trigger, final start time, and visual change, favoring progressive draw-on strokes, text, orange underlines, arrows, highlights, callouts, diagram states, character action, crop, or camera motion.
- Do not leave the complete slide static for its full duration. A slide may run longer than 15 seconds only when natural speech requires it and timed reveal beats create purposeful visual progression.
- Give every slide exactly one `clear_idea` that a viewer can identify within two seconds.
- Make adjacent slides advance causally from setup and stakes through obstacle, discovery, mechanism, proof, and resolved outcome. Complete `cause_from_previous` for every scene after the first. Give each slide a distinct `composition_signature`; never reuse the same arrangement of title, character, objects, and diagram in multiple panels.
- Use `question_opened_or_answered`, `setup_or_payoff`, `emotional_shift`, and `visual_callback` to preserve suspense, closure, emotional progression, and visual continuity without sacrificing factual accuracy.
- Default to a polished whiteboard-inspired direction unless the user explicitly requests another visual direction. Treat any supplied reference as inspiration only, never as a layout or asset template.
- Establish one original top-level `theme_bible` for all panels: named recurring character designs and wardrobe, chosen bright paper-like background treatment, dark hand-drawn line art, optional restrained hatching, warm orange as the only accent, professional handwritten typography, generous spacing, container and decoration language, hand-drawn icons, and shadow treatment. Repeat the essential character and theme anchors in every slide description.
- Use professional handwritten titles, labels, and short annotations with one clear visual reading path. Keep warm orange for emphasis rather than body copy.
- Do not copy the reference's exact composition, characters, objects, wording, typeface, palette, or decorative placements. Vary slide layouts and visual metaphors while preserving the original theme bible.
- Avoid photorealism, 3D rendering, glossy UI, gradients, saturated extra colors, stock imagery, dense scenery, messy marker scribbles, comic panels, and heavy soft shadows.
- Describe subjects, composition, background, lighting, and emotional purpose.
- Make every final slide presentation-complete and understandable without narration: one `clear_idea`, a concise handwritten title, only the labels and short annotations needed for that idea, at least one named recurring story character, and a visual explanation using the most appropriate arrows, paths, diagrams, process flows, charts, text, and objects.
- Structure `on_slide_text` as `title`, `object_labels`, `important_phrase`, `supporting_notes`, and `emphasis_marks`. For every object label record its target and whether it requires a thin pointer line.
- Keep text concise and exact: title at most 7 words, labels 1-4 words, notes at most 6 words, and no more than 24 supporting words total. Do not use narration as a paragraph on the slide.
- Place the title in an empty area, usually top-left. Place labels next to their objects and use thin hand-drawn pointer lines only when necessary.
- Keep text and important subjects inside safe margins. Never place text over faces, hands, screens, detailed illustrations, panel dividers, or borders. Maintain generous whitespace around every text block.
- Use visual hierarchy that communicates the idea within two seconds: title first, main visual path second, orange outcome or important phrase third, supporting notes last.
- Use orange only for important words, arrows, outcomes, underlines, highlights, and occasional circles, boxes, or stars. Keep ordinary text black and avoid overcrowding.
- Ask image generation to include only the exact specified handwritten copy. After panel extraction, verify and deterministically correct or replace malformed lettering so every final slide contains accurate text directly inside the composition.
- Define a `caption_safe_area` for every slide, normally near the title-safe lower edge and free of faces, essential diagram details, and small on-slide text.
- Generate exactly one master storyboard containing every scene.
- Set `storyboard_grid.master_aspect_ratio` to `9:16` and `panel_aspect_ratio` to `16:9`. Include `canvas_width`, `canvas_height`, `rows`, `columns`, `scene_count`, `cell_count`, `unused_cell_count`, `outer_padding`, `gutter`, `panel_width`, `panel_height`, and `reading_order: row-major`.
- Choose the row-major rows and columns that maximize the area of equal 16:9 panels inside the exact 9:16 portrait canvas. Evaluate candidate column counts from 1 through `scene_count`, set `rows = ceil(scene_count / columns)`, and choose the candidate with the largest panel size after outer padding and uniform gutters. Center the finished grid in the canvas; neutral outer space is allowed and must never be treated as part of a panel.
- Put every scene in row-major order and leave only trailing unused grid positions plain neutral. Record an exact pixel `crop_panel` rectangle for every populated position; do not infer crops later from the full canvas bounds.
- Require every scene panel inside the master storyboard to be an exact 16:9 landscape frame with identical dimensions, straight boundaries, and clear gutters. Do not accept approximate, square, portrait, or mixed-ratio panels.
- Include one `master_prompt` that follows the contract below and substitutes exact values. Repeat the canvas ratio, panel ratio, counts, dimensions, padding, and gutters because panel geometry is a hard requirement, not an artistic suggestion.
- Keep all important subjects and action inside each panel's 16:9 safe area.
- Verify that each panel's pixel dimensions satisfy `width * 9 = height * 16`. Regenerate a malformed storyboard instead of stretching its panels.
- Treat `aspect_ratio` as the final video ratio. When the final output is vertical, compose each 16:9 source panel so its important content also survives a centered 9:16 crop.

## Master storyboard prompt contract

Use this structure, followed by the numbered scene descriptions. Include the whiteboard-inspired block for the default style; replace only that block with an equally specific visual contract when the user explicitly requests another style.

```text
Create ONE master storyboard contact sheet as a single exact 9:16 portrait image containing ALL {SCENE_COUNT} scenes.

HARD LAYOUT CONTRACT:
- The complete outer canvas is exactly 9:16 portrait: {CANVAS_WIDTH}x{CANVAS_HEIGHT} pixels.
- Draw exactly {COLUMNS} columns by {ROWS} rows: {CELL_COUNT} equal panel positions total.
- Every panel is an exact 16:9 landscape rectangle of {PANEL_WIDTH}x{PANEL_HEIGHT} pixels, satisfying width x 9 = height x 16. No square, portrait, merged, overlapping, stretched, or irregular panels.
- Use {OUTER_PADDING}px outer padding and {GUTTER}px uniform gutters. Center the grid on the portrait canvas and leave any remaining outer canvas plain neutral.
- Use identical panel dimensions, perfectly straight aligned boundaries, and thin uniform divider strokes inside the panel edges.
- Place all {SCENE_COUNT} scenes in cells 1-{SCENE_COUNT}, read left-to-right and top-to-bottom.
- Leave cells {FIRST_UNUSED}-{CELL_COUNT} plain neutral and empty. Do not invent extra scenes. [Omit this line when no cells are unused.]
- Fit the complete grid inside the 9:16 canvas. Nothing may extend beyond or be clipped by the outer image, and neutral padding must not be included in any scene crop.
- Keep each scene visually self-contained and keep important subjects away from dividers.
- Show one composition per cell. Do not subdivide a cell into a collage, comic strip, or nested mini-panels.

VISUAL CONTINUITY:
{STYLE_AND_CONTINUITY_RULES}

PRESENTATION STORYTELLING:
- Treat every cell as one polished explainer-presentation slide containing exactly one clear idea that remains understandable without narration.
- Use arrows, paths, diagrams, process flows, charts, handwritten text, characters, and objects as needed to make the idea visually self-explanatory.
- Every slide includes at least one named recurring story character and one explanatory visual.
- Follow the declared narrative spine. Make every slide perform one story job and create the question, consequence, or discovery that motivates the next slide.
- Establish the audience proxy, goal, and stakes early; make the midpoint turning point visibly change the audience's understanding; resolve the opening question in the payoff.
- Reuse the declared visual motif for purposeful callbacks that show a changed state or meaning. Preserve every open-loop setup and payoff in order.
- Reserve a title-safe caption area near the lower edge without faces, essential diagram details, or small on-slide text. Allow an alternate safe position only when the composition requires it.
- Show the complete base composition; timed reveals, highlights, and camera moves will be added during video rendering.
- Do not add panel numbers, logos, watermarks, or unspecified text.

COMPOSITION AND HANDWRITTEN TEXT CONTRACT:
- Add the exact specified handwritten title, object labels, important phrase, and short supporting annotations directly inside every scene.
- Put the largest handwritten scene title in an empty area, usually top-left.
- Put smaller handwritten labels close to the objects they describe. Use thin hand-drawn pointer lines only when necessary.
- Put small black handwritten supporting notes near the relevant visual evidence.
- Use orange only for important words, arrows, outcomes, underlines, highlights, and occasional circles, boxes, or stars. Use black for ordinary text.
- Keep all important objects and characters away from panel borders.
- Never place text over faces, hands, screens, detailed illustrations, or dividers.
- Maintain generous whitespace around text and avoid overcrowding.
- Make title, main visual path, outcome, and notes readable in that order within two seconds.
- Give every slide a distinct composition. Do not repeat the same arrangement in multiple panels.

WHITEBOARD-INSPIRED VISUAL DIRECTION:
- Use the reference only for broad inspiration. Do not copy its exact composition, characters, objects, typography, colors, wording, or decoration placement.
- Create an original polished whiteboard presentation with a bright paper-like background, clean dark hand-sketched line art, simple explanatory diagrams, expressive characters, editorial hierarchy, generous negative space, and warm orange as the only accent color.
- Choose a subtle grid, dots, paper grain, or plain background; use hatching, containers, geometric decorations, and offset shadows only where they improve the slide.
- Vary slide layouts and visual metaphors while preserving the same drawing language, character model, palette, typography, and spacing system.
- Keep every named character identical across slides in face, hair, clothing, body proportions, and drawing style.
- Use simple whiteboard metaphors and topic-specific diagrams instead of realistic environments.
- No photorealism, 3D, glossy UI, gradients, saturated extra colors, stock imagery, dense scenery, messy marker scribbles, comic panels, or heavy soft shadows.

For every numbered slide description, specify: story role, story beat, cause from previous, question opened or answered, setup or payoff, emotional shift, visual callback, one clear idea, voiceover idea, named character and action, unique composition signature, visual story map, exact handwritten title, object labels and targets, important phrase, supporting notes, orange emphasis marks, text layout, caption-safe area, and planned reveal beats. Reveal beats describe later animation and must not create nested panels in the base image.

SLIDES IN ROW-MAJOR ORDER:
{NUMBERED_SCENE_DESCRIPTIONS}

Final compliance check before output: exactly one 9:16 portrait image at {CANVAS_WIDTH}x{CANVAS_HEIGHT}; {COLUMNS}x{ROWS} equal grid; {CELL_COUNT} panel positions; all {SCENE_COUNT} scenes; every individual panel exactly 16:9 at {PANEL_WIDTH}x{PANEL_HEIGHT}; all requested scenes visible inside the canvas; every recorded crop excludes padding and gutters; every slide communicates one idea within two seconds; every slide has exact handwritten text and a distinct uncrowded composition; the sequence follows one causal narrative spine, reaches a genuine turning point, pays off every open loop and callback, is understandable without narration, and feels like a professional hand-drawn presentation created by a skilled visual storyteller.
```
