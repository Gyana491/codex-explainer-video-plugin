---
name: create-explainer-video
description: Create or resynchronize a complete storyboard-based explainer video from a topic, script, article, brief, or narration audio. Shape the source into a truthful causal story, build a pixel-verified storyboard, then combine locked OpenAI voiceover, word-focused captions, deterministic Remotion shape animation and essential text, and local FFmpeg delivery. Use for story-driven whiteboard explainers that need editable diagrams, charts, equations, labels, kinetic text, or other motion graphics. Do not use an external image-generation API or ElevenLabs.
---

# Create an explainer video

Produce the finished video in the user's current writable workspace.

## System boundaries

- Generate images using Codex or ChatGPT's built-in image-generation capability.
- Call built-in image generation exactly once for the complete storyboard. Never call it again for a retry, correction, replacement panel, geometry fix, text fix, or alternate.
- Never call an external image-generation API.
- Use the `explainer-media.upscale_image` MCP tool for image upscaling.
- Use the `explainer-media.generate_voiceover` MCP tool for narration; do not use ElevenLabs.
- Use the bundled Remotion template for deterministic text, diagrams, charts, equations, and shape overlays.
- Use local Python with `pydub`, FFprobe, and FFmpeg for audio analysis, cropping, scene extraction, audio mixing, subtitles, final encoding, and validation.
- Treat measured audio timestamps as the visual timeline. Never assign every image a programmed fixed duration.
- Do not restart the entire workflow when only one asset or scene needs correction.

Read [the overlay storyboard contract](../../references/overlay-storyboard.md) before planning scenes that need exact information.

## Workflow

1. Inspect the request and choose:
   - duration in seconds or minutes, targeting 4-8 minutes (240-480 seconds),
   - aspect ratio,
   - visual style, defaulting to the flexible whiteboard-inspired direction below unless the user requests another style,
   - narration style,
   - output resolution.

## Default whiteboard-inspired direction

- Treat any supplied reference image as inspiration for visual language only. Never reproduce its exact layout, characters, objects, wording, typeface, palette, or decorative placements.
- Create an original whiteboard presentation system suited to the topic while retaining the broad qualities of clean paper-like space, hand-drawn line art, simple diagrams, expressive characters, editorial hierarchy, and restrained orange emphasis.
- Choose a bright white or warm off-white background; use a subtle grid, dots, paper grain, or no pattern according to the story.
- Draw characters, arrows, icons, diagrams, charts, and objects as clean hand-sketched dark line art with confident outlines. Use optional light pencil hatching or marker texture sparingly.
- Use warm orange as the only accent color. Reserve orange for important words, arrows, selected outcomes, underlines, highlights, and a few emphasis marks; keep all other artwork and text black, white, or neutral gray.
- Use generous negative space, a strong headline zone, simple containers when useful, and one clear left-to-right or top-to-bottom visual path. Vary the composition from slide to slide without losing the shared theme.
- Keep recurring characters simple, expressive, recognizable, and identical in face, hair, clothing, proportions, and line treatment across slides.
- Use hand-drawn arrows, gears, charts, magnifiers, people, sticky-note shapes, and topic-specific icons to turn abstract narration into a visible explanation.
- Avoid photorealism, 3D rendering, glossy UI, gradients, saturated multicolor palettes, painterly textures, stock-photo elements, dense backgrounds, messy marker scrawls, and heavy soft shadows.
- Treat this as polished original whiteboard explainer art, not a replica of the reference, classroom board, comic page, or rough first draft.

2. Extract the essence before writing narration.
   - Read the complete source or input, then write `output/source-essence.json` with: `central_question`, `one_sentence_idea`, `audience`, `why_it_matters`, `must_understand_points`, `supporting_evidence_or_examples`, `likely_misconception`, and `final_takeaway`.
   - Reduce the source to one central idea and 3-5 essential supporting points. Preserve the source's meaning, evidence, qualifications, and causal relationships, not its original order or wording.
   - Remove tangents, repeated arguments, background that does not change understanding, and details that cannot fit without overwhelming the audience.
   - Never invent a fact, statistic, quote, example, or certainty that the source does not support. Keep important uncertainty and limitations; flag a source conflict instead of smoothing it over.
   - When the input is only a topic or short brief, build the same essence structure from the available information and clearly distinguish reasonable explanation from supplied facts.

2a. Build the story engine from the approved essence.
   - Add a top-level `story_engine` to `output/storyboard.json` with: `one_sentence_story`, `narrative_spine`, `audience_proxy`, `starting_state`, `goal`, `stakes`, `obstacle`, `turning_point`, `payoff`, `emotional_arc`, `visual_motif`, `open_loops`, and `callbacks`.
   - Choose the simplest truthful `narrative_spine` that fits the material: `transformation`, `mystery_reveal`, `problem_solution`, `journey`, or `cause_effect`. Do not force every source into the same problem-solution template.
   - Use an audience proxy as the recurring protagonist when it improves identification. For abstract, sensitive, historical, or highly technical topics, the proxy may be a neutral guide, representative object, system, or question rather than a fictional person.
   - Define a concrete starting state, understandable goal, meaningful stakes, and the real obstacle to understanding or progress. Never fabricate danger, conflict, certainty, urgency, or a success story that the source does not support.
   - Place one turning point near the middle that changes how the audience interprets the problem, then make the payoff resolve the opening question and show the useful new understanding.
   - Shape an honest emotional progression such as `curiosity -> concern -> surprise -> clarity -> confidence`. Emotion must come from recognition, consequence, discovery, and relief, not clickbait or manipulation.
   - Open only questions the explainer will answer. Record each `open_loop` with its setup scene and payoff scene, and close every loop before the ending.
   - Choose one recurring visual motif, object, location, diagram, or character gesture that can return in later scenes with changed meaning. Record each callback with its setup and return scenes.

2b. Write the explainer narration from the approved essence and story engine.
   - Write a one-line concept, complete spoken narration, and delivery instructions matching the video tone.
   - Build a clear story arc: relatable hook, goal and stakes, obstacle or misconception, rising questions, turning-point insight, mechanism, proof or example, payoff, and memorable takeaway.
   - Make each beat cause the next. Use a `but/therefore` test between scenes: the next scene should follow because the previous beat created a complication, question, consequence, or discovery. Rewrite sequences that amount to unrelated facts joined by “and then.”
   - Give every scene one primary story job: `setup`, `escalation`, `question`, `reveal`, `mechanism`, `proof`, `payoff`, or `reflection`. Do not turn the middle into a listicle.
   - Make the listener feel why the topic matters through familiar situations and concrete stakes. Use warmth and moments of recognition without manufactured drama, hype, or exaggerated promises.
   - Explain one idea at a time in plain conversational language. Prefer short sentences, active voice, familiar words, and concrete verbs.
   - Assume no prior knowledge. Define unavoidable jargon immediately in everyday language, then continue using the simpler term where possible.
   - Use an analogy only when it makes the mechanism easier to understand, and state the boundary when the analogy could mislead.
   - Make every sentence earn its place by advancing understanding, story, or emotional relevance. Remove filler, repetition, throat-clearing, generic motivation, and unnecessary calls to action.
   - Preserve accuracy while simplifying. Never make a concept sound easier by deleting a condition that changes its meaning.
   - Write only spoken narration in the voiceover script; keep headings, scene labels, citations, and production directions outside it.
   - End with one concise takeaway the audience can repeat in their own words.
   - Run a cold-listener test before voice generation: a person who never saw the source must understand what the topic is, why it matters, how it works, and what to remember using the narration alone. Revise any line that requires the visuals or the original source to make sense.
   - Run a story-integrity test: summarize the full arc in one sentence; confirm the opening question is answered; verify every open loop closes; and remove or rewrite any scene whose absence would not break the causal logic, necessary evidence, or emotional progression.

3. Plan the complete storyboard before generating audio.
   - Divide the approved narration into scene narration segments in exact story order. Each segment must map to one slide and contain the complete spoken text for that slide.
   - Estimate total speaking duration only for storyboard sizing. Default to 4 minutes when the user gives no duration; honor an explicitly requested shorter duration and never plan beyond 8 minutes.
   - Treat each scene as a designed presentation slide and one visual idea, not as a rapid shot change.
   - Split at meaningful narrative and visual beats. Prefer sentence or thought boundaries so each later per-scene voiceover is self-contained.
   - Target 5-6 slides per minute, equivalent to an average of 10-12 seconds per slide.
   - Calculate `minimum_scene_count = ceil(duration_seconds / 12)` and `maximum_scene_count = floor(duration_seconds / 10)`. Choose a count inside that inclusive range based on meaningful visual ideas. If the range is empty for an unusually short clip, use one slide.
   - Split or combine nearby beats until the planned count is within range without dropping narration. Record `timing_source: estimated_pre_audio`; do not present estimated slide timestamps as final.
   - Give every slide 2-4 planned `reveal_beats` tied to narration trigger phrases. Add exact timestamps only after the matching per-scene voiceover is measured and word-aligned.
   - Give every slide exactly one clear visual idea that a viewer can identify within two seconds.
   - Make adjacent slides advance causally from setup and stakes through obstacle, discovery, mechanism, proof, and resolved outcome. Give each slide a distinct composition signature and never reuse the same arrangement of title, character, objects, and diagram in multiple panels.
   - In `output/storyboard.json`, add the top-level `story_engine` and a top-level `theme_bible` defining the named recurring characters and original selected style. For the default direction, record the chosen background treatment, line art, optional hatching, orange accent, handwritten typography, spacing, container, decoration, icon, and shadow rules. For every slide include `story_role`, `story_beat`, `cause_from_previous`, `question_opened_or_answered`, `setup_or_payoff`, `emotional_shift`, `visual_callback`, `clear_idea`, `visual_story_map`, `composition_signature`, structured `on_slide_text`, `text_layout`, `character_action`, `layout`, `caption_safe_area`, and `reveal_beats`. Each reveal beat must include its narration trigger, start time, and visual change.
   - Make `cause_from_previous` explicit for every slide after the first. Use `question_opened_or_answered` and `setup_or_payoff` to ensure every promised explanation, motif, and detail receives a visible payoff.
   - Set each pre-audio reveal beat's `start_seconds` to `null` until alignment. Keep narration segment and storyboard scene order immutable after image generation unless the user approves a storyboard revision.
   - Write one master storyboard prompt containing every planned scene. Do not generate any voiceover yet.
   - Treat the image generator's result as a draft contact sheet. Pixel-exact geometry will be enforced deterministically before any scene is accepted.

4. Generate exactly one draft contact sheet with clearly separated scene regions. It is not the accepted master until deterministic canonicalization in step 7.
   - Make exactly one image-generation call total. The single prompt must contain every scene description, exact count, complete geometry contract, safe-margin requirements, and final compliance check.
   - Require the single master image itself to be exact 4:3 landscape. Do not accept the image generator's closest alternative ratio.
   - Make every individual panel an exact 16:9 landscape frame, regardless of the final video's aspect ratio.
   - Choose rows and columns that maximize the size of equal 16:9 panels inside the exact 4:3 landscape canvas. Evaluate candidate column counts from 1 through `scene_count`, use `rows = ceil(scene_count / columns)`, account for uniform gutters and outer padding, and select the largest valid panel size.
   - Center the grid on the landscape canvas. Plain neutral outer space is allowed; never stretch panels to fill that space.
   - Put all scenes into this one grid in row-major order. Leave only trailing unused cells plain neutral; never create a second master image or let the model invent filler scenes.
   - State the exact canvas dimensions, scene count, total cell count, row count, column count, panel dimensions, outer padding, gutters, and row-major reading order in the image-generation prompt.
   - Use identical panel dimensions, straight boundaries, and clear gutters so crops can be calculated deterministically.
   - Keep important subjects and action inside each panel's 16:9 safe area.
   - For vertical output, also keep important content safe for a centered 9:16 crop from each 16:9 panel.
   - Use the default whiteboard-inspired direction unless the user explicitly requests another visual style. Derive an original theme from the story, then repeat its chosen background, line-art, texture, accent, typography, shape, and recurring-character anchors in every slide description.
   - Make each final composited slide presentation-complete and understandable without narration: one clear idea, a concise handwritten-style overlay title, only the labels and short annotations needed for that idea, at least one named recurring story character, and a visual explanation using the most appropriate arrows, paths, diagrams, process flows, charts, text, and objects.
   - Structure `on_slide_text` as `title`, `object_labels`, `important_phrase`, `supporting_notes`, and `emphasis_marks`. For each object label record its target object and whether it needs a thin pointer line.
   - Keep copy concise and exact: prefer a title of at most 7 words, labels of 1-4 words, notes of at most 6 words, and no more than 24 supporting words total. Never invent extra copy or use narration as a paragraph on the slide.
   - Place the title in a clean empty area, usually top-left. Place labels close to their objects and connect them with thin hand-drawn pointer lines only when proximity is insufficient.
   - Keep text and important objects inside safe margins. Never place text over faces, hands, screens, detailed illustrations, or panel borders. Maintain generous whitespace around every text block.
   - Use visual hierarchy that reveals the idea within two seconds: title first, main visual path second, orange outcome or key phrase third, supporting notes last.
   - Use orange only for important words, arrows, outcomes, underlines, highlights, and occasional circles, boxes, or stars. Keep ordinary text black.
   - Ask image generation to reserve the declared text and overlay zones and avoid essential lettering. Render exact copy deterministically after splitting so every final composited scene contains accurate text.
   - Request the highest available exact 4:3 landscape resolution. Dense grids produce small panels, so always upscale the master before splitting it.
   - Inspect the draft for complete scene content, correct order, and separable panel regions. Reject a draft with missing, merged, duplicated, or clipped scenes. Approximate draft borders are not accepted as geometry; the compositor replaces them.
   - This inspection is only a draft-content check. Never declare the generated image final based on appearance; image-generation prompts cannot prove exact panel geometry.

   Use this prompt skeleton and append the numbered scene descriptions. Include the whiteboard-inspired block for the default style; replace only that block with an equally specific visual contract when the user explicitly requests another style.

   ```text
   Create ONE master storyboard contact sheet as a single exact 4:3 landscape image containing ALL {SCENE_COUNT} scenes.

   HARD LAYOUT CONTRACT:
   - ONE IMAGE-GENERATION ATTEMPT ONLY: render every requested scene correctly in this single output. Do not defer, omit, or propose a retry.
   - The complete outer canvas is exactly 4:3 landscape: {CANVAS_WIDTH}x{CANVAS_HEIGHT} pixels, satisfying width x 3 = height x 4.
   - Exactly {COLUMNS} columns by {ROWS} rows: {CELL_COUNT} equal panel positions total.
   - Every panel is exactly 16:9 landscape at {PANEL_WIDTH}x{PANEL_HEIGHT} pixels and satisfies width x 9 = height x 16.
   - Use {OUTER_PADDING}px outer padding and {GUTTER}px uniform gutters. Center the grid and leave any remaining canvas plain neutral.
   - No square, portrait, merged, overlapping, stretched, irregular, missing, or clipped panels.
   - Show one composition per cell; never create collages or nested mini-panels inside a cell.
   - Use identical cell dimensions, straight aligned boundaries, and thin uniform divider strokes inside the cell edges.
   - Put all {SCENE_COUNT} scenes in cells 1-{SCENE_COUNT}, left-to-right then top-to-bottom.
   - Leave cells {FIRST_UNUSED}-{CELL_COUNT} plain neutral and empty; do not invent extra scenes. [Omit when none are unused.]
   - Keep every subject inside its own cell and away from dividers.
   - Keep all titles, labels, characters, and diagrams well inside each panel's safe margin so deterministic 16:9 center-cropping cannot remove required content.
   - This generated contact sheet is a visual draft. A deterministic compositor will create the only accepted master; visually approximate borders never pass final validation.

   PRESENTATION STORYTELLING CONTRACT:
   - Treat every cell as one polished explainer-presentation slide, not a film shot or generic illustration.
   - Preserve one consistent theme across all slides: character design, illustration style, palette, typography plan, spacing, shape language, icon style, lighting, and background treatment.
   - Every slide communicates exactly one clear idea and remains understandable without narration.
   - Use arrows, paths, diagrams, process flows, charts, handwritten text, characters, and objects as needed to make the idea visually self-explanatory.
   - Every slide includes at least one named recurring story character and one explanatory visual such as a diagram, comparison, object, chart, or environment.
   - Follow the declared narrative spine. Make each slide perform one story job and create the question, consequence, or discovery that motivates the next slide.
   - Establish the audience proxy, goal, and stakes early; make the midpoint turning point visibly change the audience's understanding; resolve the opening question in the payoff.
   - Reuse the declared visual motif for purposeful callbacks, showing how its meaning or state changes. Never repeat it as decoration.
   - Preserve open-loop setup and payoff order. Do not reveal an answer before its setup or leave a promised question unresolved.
   - Reserve a title-safe caption area near the lower edge without faces, essential diagram details, or small on-slide text. Allow an alternate safe position only when the composition requires it.
   - Show the complete base composition for each slide. Timed progressive reveals, highlights, and camera moves will be added during video rendering.
   - Do not add panel numbers, logos, watermarks, or essential text. Leave the specified overlay zones visually clear.

   COMPOSITION AND OVERLAY-SAFE TEXT CONTRACT:
   - Reserve clear regions for the exact handwritten-style overlay title, object labels, important phrase, and short supporting annotations declared for every scene.
   - Reserve the largest title area in empty space, usually top-left.
   - Leave room for smaller labels close to the objects they describe and for thin pointer lines when necessary.
   - Leave room for small black supporting notes near the relevant visual evidence.
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

   For every numbered slide description, specify: story role, story beat, cause from previous, question opened or answered, setup or payoff, emotional shift, visual callback, one clear idea, voiceover idea, named character and action, unique composition signature, visual story map, exact overlay title, object labels and targets, important phrase, supporting notes, orange emphasis marks, text layout, caption-safe area, overlay strategy, and planned reveal beats. Reveal beats describe later animation and must not create nested panels in the base image.

   SLIDES IN ROW-MAJOR ORDER:
   {NUMBERED_SCENE_DESCRIPTIONS}

   Final compliance check: exactly one 4:3 landscape image at {CANVAS_WIDTH}x{CANVAS_HEIGHT}, satisfying width x 3 = height x 4; {COLUMNS}x{ROWS} equal grid; {CELL_COUNT} panel positions; all {SCENE_COUNT} requested scenes; every panel exact 16:9 at {PANEL_WIDTH}x{PANEL_HEIGHT}, satisfying width x 9 = height x 16; all scenes fully inside the canvas; no crop includes padding or gutters; every slide communicates one idea within two seconds; every slide reserves clear overlay-safe text regions and has a distinct uncrowded composition; the sequence follows one causal narrative spine, reaches a genuine turning point, pays off every open loop and visual callback, and supports a professional final hand-drawn presentation after deterministic overlays are applied.
   ```

5. Call `upscale_image` for the draft storyboard.
   - Pass the image generator's returned `image_url` as `imageUrl`.
   - `imageUrl` accepts either an HTTP(S) URL or a complete base64 data URI such as `data:image/png;base64,...`.
   - Never pass a local filesystem path, `file://` URL, blob URL, or only the raw base64 payload. If the generated result is available only as a local file, read its MIME type and encode the complete file as a data URI before calling the tool.
   - Default to `scale: 10`.
   - Use `faceEnhance: false` for illustrations.
   - Use face enhancement only when faces are photorealistic and visibly important.

6. Download the returned `upscaledImageUrl` into:
   `assets/storyboard/storyboard-draft-upscaled.png`

7. Extract draft scene candidates, then build the canonical master with strict pixel geometry.
   - Extract each visible scene from `storyboard-draft-upscaled.png` into a temporary candidate image. These candidate crops are draft artwork, so their initial ratio is not trusted.
   - Run the bundled `scripts/canonicalize_storyboard.py` with the candidate scene directory, `--output assets/storyboard/storyboard-upscaled.png`, and `--manifest output/storyboard-geometry.json`.
   - The compositor must scale each candidate to cover and center-crop it into one exact 16:9 slot without stretching, assemble all populated and unused slots on one exact 4:3 landscape canvas, and draw deterministic borders and gutters.
   - Treat `assets/storyboard/storyboard-upscaled.png` as the only accepted master. Never use the generated draft as the final master.
   - Copy each populated slot's exact `x`, `y`, `width`, and `height` from `output/storyboard-geometry.json` into the matching scene's `crop_panel` field.
   - Require every unused blank slot to have the identical `width`, `height`, and border geometry as populated scene slots. Do not export blank slots as scenes.
   - Use the exact recorded `crop_panel` pixel rectangle for each final scene. Do not divide the full landscape canvas into equal cells because that would include outer padding or gutters.
   - Do not use OCR unless unavoidable.
   - Crop every scene to exact 16:9 dimensions and require the integer equality `width * 9 == height * 16` before rendering. No tolerance, approximate ratio, or one-pixel exception is allowed.
   - Ignore the declared trailing unused cells and verify the number of exported scene files equals `scene_count`.
   - Never stretch a panel to force the ratio. Use only the pixels from the single generated contact sheet. Do not request replacement artwork or make another image-generation call; preserve required content through the strict safe-margin prompt and local crop placement.
   - Save scenes as:
     `assets/scenes/scene-01.png`, `scene-02.png`, and so on.

7a. Finish each scene as a presentation slide.
   - Treat generated lettering as non-authoritative artwork. Put exact titles, labels, numbers, equations, chart values, and factual relationships in structured `on_slide_text` and deterministic overlays rather than relying on image-generated text.
   - Use one professional handwritten overlay typography system across all slides: largest title, smaller object labels, small black supporting notes, and orange treatment for the important phrase.
   - Draw thin pointer lines from labels to targets only when necessary. Use occasional hand-drawn circles, boxes, stars, and underlines for emphasis.
   - Keep text inside title-safe margins and verify legibility at the final output resolution.
   - Keep text away from faces, hands, screens, detailed illustrations, and the karaoke caption-safe area. Preserve generous whitespace and remove any nonessential note that creates crowding.
   - For each scene choose `artwork-only`, `kinetic-text`, `diagram`, `chart`, `equation`, or `artwork-with-overlays`. Give every text, shape, asset, group, and cue a stable ID and normalized geometry.
   - Add tight `objects` boxes for faces, hands, screens, detailed illustration regions, major recurring objects, and caption-safe areas. Use anchored `groups` when a label, value, card, and connector must remain together. Add `intent` metadata to ungrouped elements that should stay attached to a shape or generated object.
   - Use `screen` coordinates for fixed titles and `artwork` coordinates for annotations that follow pan or zoom. Use transparent foreground cutouts plus explicit `zIndex` values when an overlay must pass behind an illustrated character or object.
   - Preserve editable overlay instructions in `output/storyboard.json`; never leave unverified generated lettering as the only source of essential information.

8. Generate one voiceover file separately for every finished scene.
   - Do not begin voice generation until the master storyboard is generated, upscaled, split, and every scene image is verified.
   - Call `generate_voiceover` exactly once per scene narration segment in the same row-major order as the extracted scene images.
   - Lock one voice configuration before the first call and reuse the identical voice, model, format, speed or delivery instructions, language, pronunciation guidance, and audio settings for every scene. Prefer `marin` or `cedar` for polished narration and request MP3 unless WAV is required.
   - Save the locked configuration to `output/voice-config.json` before generating scene 1. Record the voice identifier, model, format, language, delivery instructions, and any pronunciation guidance used for every call.
   - Save returned files as `assets/audio/scenes/scene-01.mp3`, `scene-02.mp3`, and so on. Require a one-to-one filename match with `assets/scenes/scene-01.png`, `scene-02.png`, and so on.
   - Keep narration text, storyboard scenes, image files, and audio files in identical order. If one generation fails, retry only that scene with the locked configuration; never regenerate completed scene audio unnecessarily.
   - Preserve the returned AI-generated voice disclosure in publishing notes.
   - When the user supplies narration audio instead, preserve it and explicitly document that the per-scene generation stage was skipped; otherwise scene-isolated generation is mandatory.

9. Measure scene audio and build the authoritative timeline.
   - Measure every scene audio file with FFprobe. Treat each measured clip duration as that scene's exact visual duration; never use the pre-audio estimate or a global fixed duration.
   - Decode and concatenate the measured clips in scene order with `pydub.AudioSegment`, without gaps, overlaps, truncation, time-stretching, or resampling drift. Save `assets/audio/voiceover.mp3`.
   - Derive cumulative `start_seconds` and `end_seconds` from the measured clip durations and write `output/scene-timings.json`. For every scene include `scene_number`, `audio_file`, `start_seconds`, `end_seconds`, `duration_seconds`, `timing_source: per_scene_audio`, `narration_segment`, and `visual_description`.
   - Copy those exact measured timestamps into `output/storyboard.json`; do not maintain two independently calculated timelines.
   - Measure the concatenated file with FFprobe and compare it with the sum of the scene clips. Investigate a difference greater than 50 ms.
   - Run the bundled `scripts/analyze_audio.py` on the concatenated narration to save loudness and rhythm analysis to `output/audio-analysis.json`. Use silence analysis for review only; never move a scene boundary away from its matching clip boundary.
   - Revise only the affected narration segment or delivery when a clip is far outside the planned 10-12-second cadence. Preserve the storyboard order and all unaffected audio.

10. Generate word-level captions after all scene voiceovers are final.
   - Force-align each scene audio file against its exact scene narration with a local aligner or speech recognizer that returns word timestamps.
   - Offset each scene's local word timestamps by that scene's measured cumulative `start_seconds`, then merge them in scene order into `output/word-timings.json`.
   - Never calculate word timing by dividing a sentence or scene into equal durations. `pydub` silence boundaries are not precise enough for word-by-word highlighting.
   - For every spoken token include `word`, `start_seconds`, `end_seconds`, `scene_number`, `audio_file`, and `timing_source`.
   - Require ordered, non-overlapping word timings inside the measured final narration duration. Preserve punctuation with the adjacent spoken word and reconcile the aligned transcript against the approved narration.
   - If reliable word alignment is unavailable, report the limitation and use phrase-level captions without pretending they are word-synchronized.
   - Group words into natural phrases of roughly 3-7 words, no more than two lines, without crossing scene boundaries or awkward grammatical breaks.
   - Resolve every planned reveal beat's trigger phrase to an exact timestamp from `output/word-timings.json`, then update `output/storyboard.json`.
   - Write `output/captions.ass` with word-level karaoke timing so the currently spoken word can be emphasized independently while the surrounding phrase remains visible.
   - Convert each planned overlay trigger into an exact resolved timestamp. Store it as scene-relative `startSeconds` when known, otherwise use deterministic `startProgress`; preserve the trigger phrase as alignment metadata.

11. Build the video from `output/scene-timings.json`.
   - Use FFmpeg pans, zooms, and crossfades for `artwork-only` scenes.
   - For kinetic text, diagrams, charts, equations, or artwork with overlays, copy `../../assets/remotion-overlay-template` into the writable project, place scene images under `public/scenes`, place the joined narration under `public/audio`, and write `src/project.json` plus `output/overlay-project.json` from the resolved scene plan.
   - Validate the overlay project before rendering:

     ```powershell
     node ../../scripts/validate-overlay-storyboard.mjs <copied-template>/src/project.json
     ```

   - Run visual-aware layout QA before the expensive render:

     ```powershell
     node <copied-template>/scripts/analyze-overlay-layout.mjs <copied-template>/src/project.json --json <copied-template>/output/layout-report.json
     ```

     Fix any text that collides with dense artwork, faces, hands, screens, borders, or the caption-safe area before rendering.
     When scene objects, anchored groups, or text intents are present, run `npm run layout-fix` inside the copied template to apply safe group/text positions, then run `npm run layout-stills` to review one near-final still per scene before the full MP4 render.

   - In the copied template run `npm install`, `npm run preflight`, `npm run type-check`, and `npm run render`. On Windows ARM64, use x64 Node under Windows emulation because Remotion does not publish a native ARM64 compositor.
   - Use each slide's `reveal_beats` to synchronize progressive draw-on strokes, text, orange underlines, arrows, highlights, callouts, diagram states, character emphasis, and subtle pans or zooms with the corresponding voiceover phrases.
   - Keep the slide's core layout stable between reveal beats so the audience experiences one coherent presentation slide rather than several unrelated shots.
   - Set each image's duration to `end_seconds - start_seconds`; never use a global fixed duration or a hard-coded loop length.
   - Keep narration audio untouched on its original timeline. Place every visual cut or transition at its recorded audio boundary.
   - When using `xfade`, compensate for transition overlap so the last visual frame still ends at the measured audio duration. A transition must not shorten the video timeline.
   - Prefer a direct cut when a dissolve would obscure a short scene or weaken the spoken rhythm.
   - Burn in `output/captions.ass` by default. Keep each short caption phrase visible while highlighting only the currently spoken word from `output/word-timings.json`.
   - Style inactive words in a high-contrast neutral color and the active word in orange with stronger weight, a subtle scale increase, or a marker-like underline. Avoid flashing, bouncing, or moving the whole phrase for every word.
   - Place captions in a consistent title-safe lower area inside a clean whiteboard-style backing shape when needed for contrast. Move the caption block only when it would cover an essential character, diagram, or on-slide label.
   - Keep caption typography separate from on-slide headlines. Use a clean, highly legible supporting face, balanced outline or shadow, and no more than two lines.
   - Use `libx264`, `yuv420p`, AAC audio, and `+faststart`.
   - Avoid visual filters that alter the supplied or generated artwork unless requested.

12. Validate:
   - duration is 4-8 minutes unless the user explicitly requested a shorter video,
   - scene count is within the calculated 5-6-slides-per-minute range,
   - exactly one master storyboard exists, is exact 4:3 landscape, and contains the declared centered grid,
   - `output/storyboard-geometry.json` exists and records `ratio_verified: true` for the master, every populated slot, and every unused blank slot,
   - every extracted storyboard scene satisfies the exact integer equality `width * 9 == height * 16`, with no tolerance or rounding exception,
   - every scene fills the frame,
   - no panel borders remain,
   - voiceover is audible,
   - every visual boundary matches `output/scene-timings.json`,
   - final video and final audio durations differ by no more than 50 ms,
   - no FFmpeg transition overlap has shortened the visual timeline,
   - no scene is duplicated accidentally,
   - every slide uses the same declared theme and its deterministic overlays contain a legible, correctly spelled handwritten-style title, labels, and short annotations,
   - when the default direction is selected, every slide follows the original chosen whiteboard theme without drifting into a literal copy of the reference,
   - every slide has at least one named recurring story character plus an explanatory visual,
   - every slide communicates exactly one clear idea and remains understandable without narration within two seconds,
   - every `visual_story_map` uses the appropriate arrows, paths, diagrams, process flows, charts, text, and objects to explain that idea,
   - titles occupy clean space, usually top-left; labels sit near their targets; pointer lines appear only when necessary,
   - no text overlaps faces, hands, screens, detailed illustrations, dividers, borders, or the caption-safe area,
   - orange appears only on important words, arrows, outcomes, underlines, highlights, and sparse emphasis marks,
   - whitespace remains generous, no scene is overcrowded, and no composition signature is repeated,
   - the sequence follows the declared narrative spine with a clear goal, stakes, obstacle, turning point, and truthful payoff,
   - every scene has one primary story job and a causal reason to follow the previous scene; no middle section degrades into a disconnected list,
   - every opening question and `open_loop` is resolved, every declared callback returns with purpose, and the final takeaway answers the opening premise,
   - the emotional arc progresses through earned understanding without hype, fabricated urgency, or manufactured conflict,
   - the master storyboard was generated, upscaled, split, and verified before generated voiceover work began,
   - every final scene image has exactly one matching per-scene audio file with the same zero-padded scene number,
   - every generated scene audio call used the exact configuration recorded in `output/voice-config.json`,
   - the concatenated narration preserves scene order and equals the cumulative measured clip duration within 50 ms,
   - captions and reveal-beat timestamps were created only after all per-scene voiceovers were finalized,
   - every slide's internal reveal beats match its voiceover triggers and no slide remains unintentionally static,
   - every spoken word has a verified timing entry or an explicitly declared phrase-level fallback,
   - captions match the narration exactly, remain inside title-safe margins, and highlight the active word at the correct audible moment,
   - caption placement does not obscure essential slide content or conflict with the slide's own text,
   - `output/overlay-project.json` passes the bundled validator whenever any scene uses a non-`artwork-only` strategy,
   - `output/layout-report.json` exists for overlay renders and has no unexpected errors or warnings,
   - every overlay stays inside its safe area, uses stable IDs, follows the correct `screen` or `artwork` coordinate space, respects declared layer depth, and starts at its resolved `startSeconds` or deterministic `startProgress`,
   - `output/source-essence.json` captures the source's central idea, essential support, meaningful qualifications, and final takeaway without tangents,
   - the narration covers every `must_understand_point`, contains no unsupported claims, and preserves important uncertainty,
   - a cold listener can understand the narration without seeing the source or visuals,
   - the script sounds conversational and resonant rather than academic, copied, promotional, or childish,
   - final file plays from start to finish.

13. Save:
   - final video: `output/explainer-video.mp4`
   - narration: `output/narration.txt`
   - joined scene voiceover: `assets/audio/voiceover.mp3`
   - source essence: `output/source-essence.json`
   - storyboard plan: `output/storyboard.json`
   - audio analysis: `output/audio-analysis.json`
   - authoritative scene timeline: `output/scene-timings.json`
   - authoritative word timeline: `output/word-timings.json`
   - karaoke captions: `output/captions.ass`
   - locked voice configuration: `output/voice-config.json`
   - editable overlay project: `output/overlay-project.json`
   - overlay layout QA report: `output/layout-report.json`
   - render command: `output/render-command.txt`

## Storyboard sizing

Choose slide count after the narration is final but before voiceover generation. Use the requested or planned speaking duration to calculate an inclusive range of `ceil(duration_seconds / 12)` through `floor(duration_seconds / 10)`, then choose a count inside it based on meaningful visual ideas. This yields a planned cadence of 5-6 slides per minute, or 10-12 seconds per slide on average. Generate and upscale the draft, extract scene candidates, canonicalize the accepted master and exact scenes, then begin voiceover work. Afterward, generate one voiceover per scene and replace all estimated timing with cumulative measured clip durations. Give each slide 2-4 narration-triggered reveal beats, resolving their exact timestamps only after word alignment. Fit every exact 16:9 slide into one pixel-verified 4:3 landscape master using a centered row-major grid with recorded crop rectangles. Never exceed 8 minutes.

Examples:

- 60 seconds: 5-6 slides; calculate the largest centered 16:9 panel grid inside one 4:3 master.
- 240 seconds: 20-24 slides; calculate the largest centered 16:9 panel grid inside one 4:3 master.
- 360 seconds: 30-36 slides; calculate the largest centered 16:9 panel grid inside one 4:3 master.
- 480 seconds: 40-48 slides; calculate the largest centered 16:9 panel grid inside one 4:3 master.

Suggested narrative progression:

1. Hook and audience proxy
2. Goal and stakes
3. Obstacle, misconception, or unanswered question
4. Escalation through consequence or evidence
5. Turning-point insight
6. Mechanism and proof
7. Payoff with a visual callback
8. Resolved opening question and repeatable takeaway

Use this progression as a guide, not a rigid formula. Allocate roughly 10-15% to hook and setup, 15-20% to stakes and obstacle, about 15% to the turning point, 30-35% to mechanism and proof, 15-20% to payoff, and 5-10% to the final takeaway. Assign one primary story role to every slide and make the roles form a causal chain. Use recurring characters or motifs as the audience's guide through the problem, discovery, mechanism, proof, and resolution. Treat on-slide text as visual reinforcement rather than a transcript of the narration.

## Rendering rule

When a crop or scene output needs correction, adjust only the local crop, text overlay, or compositor settings and rerun the local render command. Never make another image-generation call. Keep all unaffected assets.
