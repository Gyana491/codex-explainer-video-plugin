---
name: create-explainer-video
description: Create or resynchronize a complete storyboard-based explainer video from a topic, script, article, brief, or narration audio, defaulting to a story-driven editorial whiteboard presentation style. Use Codex built-in image generation, explainer-media upscaling and OpenAI voiceover, pydub and FFprobe for audio-derived scene timestamps, then local FFmpeg to split, animate, and render. Use when visuals must follow voiceover rhythm instead of fixed scene durations. Do not use an external image-generation API.
---

# Create an explainer video

Produce the finished video in the user's current project workspace.

## Fixed system boundaries

- Generate images using Codex or ChatGPT's built-in image-generation capability.
- Never call an external image-generation API.
- Use the `explainer-media.upscale_image` MCP tool for image upscaling.
- Use the `explainer-media.generate_voiceover` MCP tool for narration.
- Use local Python with `pydub`, FFprobe, and FFmpeg for audio analysis, cropping, scene extraction, animation, audio mixing, subtitles, and rendering.
- Treat measured audio timestamps as the visual timeline. Never assign every image a programmed fixed duration.
- Do not restart the entire workflow when only one asset or scene needs correction.

## Explainer Media MCP contract

- Use only the configured `explainer-media` server at the plugin-provided endpoint.
- Read `upscaledImageUrl` from a successful `upscale_image` result.
- Read `voiceoverUrl` from a successful `generate_voiceover` result.
- Treat `isError: true` or `success: false` as a failed generation. Report the returned error and preserve completed assets.

## Default workflow

1. Inspect the request and choose:
   - duration in seconds or minutes, targeting 4-8 minutes (240-480 seconds),
   - aspect ratio,
   - visual style, defaulting to the editorial whiteboard system below unless the user requests another style,
   - narration style,
   - output resolution.

## Default editorial whiteboard system

- Use a warm white or off-white square-grid paper background with a very faint neutral grid.
- Draw characters, arrows, icons, diagrams, charts, and objects as clean hand-sketched black line art with confident outlines and restrained light-gray pencil hatching.
- Limit color to black, white, pale gray, and one pink accent family. Use pink only for emphasis, selected fills, marker strokes, and crisp offset shadows behind rounded frames.
- Use generous negative space, an oversized editorial headline zone, rounded rectangular content frames, cropped geometric edge decorations, and one clear left-to-right or top-to-bottom visual path.
- Keep recurring characters simple, expressive, recognizable, and identical in face, hair, clothing, proportions, and line treatment across slides.
- Use hand-drawn arrows, gears, charts, magnifiers, people, sticky-note shapes, and topic-specific icons to turn abstract narration into a visible explanation.
- Avoid photorealism, 3D rendering, glossy UI, gradients, saturated multicolor palettes, painterly textures, stock-photo elements, dense backgrounds, messy marker scrawls, and heavy soft shadows.
- Treat this as polished editorial whiteboard art, not a classroom board, comic page, or rough first draft.

2. Write:
   - one-line concept,
   - complete narration in a polished YouTube-explainer style,
   - delivery instructions matching the video tone.
   - Start with a direct hook, quickly explain why the topic matters, develop one idea at a time, and end with a concise takeaway.
   - Use plain, conversational language, short sentences, and as few words as necessary for clarity.
   - Prefer familiar words over jargon. Define unavoidable technical terms immediately.
   - Write only spoken narration in the voiceover script; keep headings, scene labels, and production directions outside it.
   - Remove filler, repetition, exaggerated claims, and unnecessary calls to action unless the user requests them.

3. Draft the scene narration segments, then choose an audio timing mode.
   - Prefer **scene-isolated voiceover**: call `generate_voiceover` once per scene with the same voice, model, format, and delivery instructions. Save `assets/audio/scenes/scene-01.mp3`, `scene-02.mp3`, and so on. Measure every file with FFprobe, concatenate the decoded segments in order, and derive cumulative scene timestamps from their measured durations. This is the most reliable synchronization mode.
   - Use **monolithic voiceover** when the user supplies one audio file or when per-scene generation is impractical. Analyze the completed file with this skill's bundled `scripts/analyze_audio.py`, resolved relative to this `SKILL.md`, then snap scene boundaries to narration pauses. The analyzer is fully self-contained inside this skill directory.
   - Keep narration text and audio files in identical scene order. Never render until each visual scene has a matching narration segment or an explicitly reviewed pause-based boundary.

4. Generate or attach the voiceover.
   - Default model is handled by the MCP server.
   - Prefer `marin` or `cedar` for polished narration.
   - Request MP3 unless WAV is needed for editing.
   - Preserve the returned AI-generated voice disclosure in publishing notes.
   - For scene-isolated generation, concatenate with `pydub.AudioSegment` after decoding; do not estimate the joined duration from text length.
   - For monolithic generation, download the returned `voiceoverUrl` to `assets/audio/voiceover.mp3`.

5. Analyze the final audio before setting scene durations.
   - Measure the final joined or monolithic audio with FFprobe.
   - Run:

     ```bash
     python3 /absolute/path/to/this-skill/scripts/analyze_audio.py assets/audio/voiceover.mp3 \
       --scene-count "$SCENE_COUNT" \
       --output output/audio-analysis.json
     ```

   - The analyzer uses `pydub` to record average and peak loudness, detect silence and speech, and produce pause-aware scene timestamps. It uses an adaptive silence threshold by default; pass `--silence-thresh-dbfs -45` when that threshold fits the recording.
   - Install dependencies with `python3 -m pip install -r /absolute/path/to/this-skill/requirements-audio.txt`. On Python 3.13+, this installs `audioop-lts` alongside `pydub`.
   - Compare the `pydub` and FFprobe durations. Investigate a difference greater than 50 ms before rendering.
   - In scene-isolated mode, cumulative measured clip durations are authoritative. Use silence analysis to inspect rhythm, not to move a boundary into a different scene's narration.
   - In monolithic mode, inspect every `uniform_fallback` boundary. Adjust the threshold or scene count when a fallback cut lands inside a spoken phrase.
   - Default to 4 minutes when no duration is supplied.
   - Revise narration or delivery until the measured audio is 4-8 minutes. Honor a shorter video only when the user explicitly requests it. Never exceed 8 minutes.
   - When the user supplies narration audio, skip generation and measure the supplied audio instead.

6. Derive the timed scene list from the script and audio analysis.
   - Treat each scene as a designed presentation slide and each slide as one story chapter, not as a rapid shot change.
   - Split at meaningful narrative chapters and align slide boundaries with natural pauses in the voiceover.
   - Target 2-3 slides per minute, equivalent to an average of 20-30 seconds per slide.
   - Calculate `minimum_scene_count = ceil(duration_seconds / 30)` and `maximum_scene_count = floor(duration_seconds / 20)`. Choose a count inside that inclusive range based on meaningful story chapters. If the range is empty for an unusually short clip, use one slide.
   - Combine nearby beats until the calculated count is within range without dropping narration. Individual slides may vary around 20-30 seconds to follow natural speech, but the complete video must maintain the requested average cadence.
   - Give every slide 2-4 internal `reveal_beats` tied to exact voiceover timestamps or trigger phrases. Use those beats for progressive text, callout, diagram-state, character-action, crop, pan, or highlight changes while preserving the slide's core composition.
   - Do not leave the complete slide visually static for its full duration. A slide may stay on screen longer than 30 seconds only when its timed reveal beats create purposeful visual progression.
   - Make adjacent slides advance the story through a new question, consequence, insight, mechanism, proof point, or resolution while preserving the same presentation design language.
   - Write `output/scene-timings.json`. For every scene include `scene_number`, `audio_file` when isolated, `start_seconds`, `end_seconds`, `duration_seconds`, `timing_source`, `narration_segment`, and `visual_description`.
   - In `output/storyboard.json`, add a top-level `theme_bible` defining the named recurring characters and selected style. For the default style, include the editorial whiteboard paper, grid, ink, hatching, pink accent, typography, spacing, rounded-frame, geometric-decoration, icon, and shadow rules. Also include `story_role`, `on_slide_text`, `character_action`, `layout`, and `reveal_beats` for every slide. Each reveal beat must include its narration trigger, start time, and visual change.
   - Copy those exact timestamps into `output/storyboard.json`; do not maintain two independently calculated timelines.
   - Write one master storyboard prompt containing every calculated scene.

7. Generate exactly one master storyboard image with clearly separated scene panels.
   - Require the single master image itself to be exact 4:3 landscape. Do not accept the image generator's closest alternative ratio.
   - Make every individual panel an exact 16:9 landscape frame, regardless of the final video's aspect ratio.
   - Calculate `grid_scale = ceil(sqrt(scene_count / 12))`, `columns = 3 * grid_scale`, `rows = 4 * grid_scale`, and `cell_count = 12 * grid_scale^2`.
   - This proportional grid keeps the master exact 4:3 and every equal cell exact 16:9 because `columns:rows = 3:4` and `(3 x 16):(4 x 9) = 4:3`.
   - Put all scenes into this one grid in row-major order. Leave only trailing unused cells plain neutral; never create a second master image or let the model invent filler scenes.
   - State the scene count, total cell count, row count, column count, and row-major reading order in the image-generation prompt.
   - Use identical panel dimensions, straight boundaries, and clear gutters so crops can be calculated deterministically.
   - Keep important subjects and action inside each panel's 16:9 safe area.
   - For vertical output, also keep important content safe for a centered 9:16 crop from each 16:9 panel.
   - Use the default editorial whiteboard system unless the user explicitly requests another visual style. Repeat its paper, grid, black-ink, gray-hatching, pink-accent, rounded-frame, and recurring-character anchors in every slide description.
   - Make each final slide presentation-complete: a concise headline, only the supporting copy needed for comprehension, at least one named recurring story character, and one explanatory visual such as a diagram, comparison, object, chart, or environment.
   - Keep on-slide copy concise and exact: prefer a headline of at most 7 words and no more than 20 additional words across labels, callouts, or supporting text. Never invent extra copy.
   - Reserve clean, high-contrast text zones in the artwork. For reliable spelling, compose the exact `on_slide_text` as post-generation overlays after splitting instead of trusting generated bitmap lettering. The final slide must contain the requested text even when the generated background does not.
   - Request the highest available exact 4:3 resolution. Dense grids produce small panels, so always upscale the master before splitting it.
   - Inspect the result before continuing. Reject and regenerate a master that is not exact 4:3 or contains a missing panel or an approximate, square, portrait, or mixed-ratio panel.

   Use this prompt skeleton and append the numbered scene descriptions. Include the editorial whiteboard block for the default style; replace only that block with an equally specific visual contract when the user explicitly requests another style.

   ```text
   Create ONE master storyboard contact sheet as a single exact 4:3 landscape image containing ALL {SCENE_COUNT} scenes.

   HARD LAYOUT CONTRACT:
   - Exactly {COLUMNS} columns by {ROWS} rows: {CELL_COUNT} equal cells total.
   - Every cell is exact 16:9 landscape; the complete outer canvas is exact 4:3 landscape.
   - Keep the grid proportional at 3k columns by 4k rows, where k={GRID_SCALE}; do not change its rows or columns.
   - No square, portrait, merged, inset, overlapping, irregular, missing, or clipped cells.
   - Show one composition per cell; never create collages or nested mini-panels inside a cell.
   - Use identical cell dimensions, straight aligned boundaries, and thin uniform divider strokes inside the cell edges.
   - Put all {SCENE_COUNT} scenes in cells 1-{SCENE_COUNT}, left-to-right then top-to-bottom.
   - Leave cells {FIRST_UNUSED}-{CELL_COUNT} plain neutral and empty; do not invent extra scenes. [Omit when none are unused.]
   - Keep every subject inside its own cell and away from dividers.

   PRESENTATION STORYTELLING CONTRACT:
   - Treat every cell as one polished explainer-presentation slide, not a film shot or generic illustration.
   - Preserve one consistent theme across all slides: character design, illustration style, palette, typography plan, spacing, shape language, icon style, lighting, and background treatment.
   - Every slide includes at least one named recurring story character and one explanatory visual such as a diagram, comparison, object, chart, or environment.
   - Reserve clean, uncluttered, high-contrast zones for the exact headline and supporting copy specified in each scene. The exact text will be composited after extraction; do not invent words or render lettering in the base artwork.
   - Show the complete base composition for each slide. Timed progressive reveals, highlights, and camera moves will be added during video rendering.
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

   Final compliance check: exactly one 4:3 image; {COLUMNS}x{ROWS} equal grid; {CELL_COUNT} cells; all {SCENE_COUNT} requested scenes; every cell exact 16:9; all scenes fully inside the canvas.
   ```

8. Call `upscale_image` for the master storyboard.
   - Pass the image generator's returned `image_url` as `imageUrl`.
   - `imageUrl` accepts either an HTTP(S) URL or a complete base64 data URI such as `data:image/png;base64,...`.
   - Never pass a local filesystem path, `file://` URL, blob URL, or only the raw base64 payload. If the generated result is available only as a local file, read its MIME type and encode the complete file as a data URI before calling the tool.
   - Default to `scale: 10`.
   - Use `faceEnhance: false` for illustrations.
   - Use face enhancement only when faces are photorealistic and visibly important.

9. Download the returned `upscaledImageUrl` into:
   `assets/storyboard/storyboard-upscaled.png`

10. Split the storyboard into individual scenes.
   - Use exact equal grid coordinates based on the declared proportional grid and row-major order.
   - Do not use OCR unless unavoidable.
   - Crop every scene to exact 16:9 dimensions and verify `width * 9 = height * 16` before rendering. A one-pixel rounding trim is allowed when the master dimensions are not evenly divisible by the grid size; never stretch.
   - Ignore the declared trailing unused cells and verify the number of exported scene files equals `scene_count`.
   - Never stretch a panel to force the ratio. Regenerate the malformed storyboard when a correct crop would remove required content.
   - Save scenes as:
     `assets/scenes/scene-01.png`, `scene-02.png`, and so on.

10a. Finish each scene as a presentation slide.
   - Add the exact `on_slide_text` from `output/storyboard.json` in the reserved text zones after splitting so spelling and typography are deterministic.
   - Use one typography system across all slides, with consistent headline, supporting-copy, label, margin, and contrast rules.
   - Keep text inside title-safe margins and verify legibility at the final output resolution.
   - Preserve editable or reproducible text-overlay instructions in `output/storyboard.json`; do not bake unverified generated lettering into the final video.
   - Style large headlines as bold black editorial display type and smaller labels as clean black supporting type. Keep pink for emphasis rather than body copy.

11. Build the video with FFmpeg from `output/scene-timings.json`.
   - Use each slide's `reveal_beats` to synchronize progressive draw-on strokes, text, pink underlines, arrows, highlights, callouts, diagram states, character emphasis, and subtle pans or zooms with the corresponding voiceover phrases.
   - Keep the slide's core layout stable between reveal beats so the audience experiences one coherent presentation slide rather than several unrelated shots.
   - Set each image's duration to `end_seconds - start_seconds`; never use a global fixed duration or a hard-coded loop length.
   - Keep narration audio untouched on its original timeline. Place every visual cut or transition at its recorded audio boundary.
   - When using `xfade`, compensate for transition overlap so the last visual frame still ends at the measured audio duration. A transition must not shorten the video timeline.
   - Prefer a direct cut when a dissolve would obscure a short scene or weaken the spoken rhythm.
   - Add captions when useful.
   - Use `libx264`, `yuv420p`, AAC audio, and `+faststart`.
   - Avoid visual filters that alter the supplied or generated artwork unless requested.

12. Validate:
   - duration is 4-8 minutes unless the user explicitly requested a shorter video,
   - scene count is within the calculated 2-3-slides-per-minute range,
   - exactly one master storyboard exists, is exact 4:3, and contains the calculated proportional grid,
   - every extracted storyboard scene satisfies `width * 9 = height * 16`,
   - every scene fills the frame,
   - no panel borders remain,
   - voiceover is audible,
   - every visual boundary matches `output/scene-timings.json`,
   - final video and final audio durations differ by no more than 50 ms,
   - no FFmpeg transition overlap has shortened the visual timeline,
   - no scene is duplicated accidentally,
   - every slide uses the same declared theme and contains legible, correctly spelled on-slide text,
   - when the default style is selected, every slide follows the editorial whiteboard paper, grid, black-line, gray-hatching, and restrained-pink visual system without style drift,
   - every slide has at least one named recurring story character plus an explanatory visual,
   - every slide's internal reveal beats match its voiceover triggers and no slide remains unintentionally static,
   - final file plays from start to finish.

13. Save:
   - final video: `output/explainer-video.mp4`
   - narration: `output/narration.txt`
   - storyboard plan: `output/storyboard.json`
   - audio analysis: `output/audio-analysis.json`
   - authoritative scene timeline: `output/scene-timings.json`
   - render command: `output/render-command.txt`

## Storyboard sizing

Choose slide count only after the narration is final and voiceover duration is measured. Calculate an inclusive range of `ceil(duration_seconds / 30)` through `floor(duration_seconds / 20)`, then choose a count inside it based on meaningful story chapters and natural audio pauses. This yields 2-3 slides per minute, or 20-30 seconds per slide on average. Give each slide 2-4 narration-timed reveal beats so the presentation progresses within the slide. Fit every slide into exactly one 4:3 master using a `3k`-column by `4k`-row grid, where `k = ceil(sqrt(scene_count / 12))`. Never exceed 8 minutes.

Examples:

- 60 seconds: 2-3 slides; use one 3x4 master with 12 cells.
- 240 seconds: 8-12 slides; use one 3x4 master with 12 cells.
- 360 seconds: 12-18 slides; use one 6x8 master with 48 cells.
- 480 seconds: 16-24 slides; use one 6x8 master with 48 cells.

Suggested narrative progression:

1. Hook
2. Problem
3. Friction or consequence
4. Insight
5. Solution
6. How it works
7. Result
8. Closing message

Assign one primary story role to every slide and make the roles form a continuous chain. Use recurring characters as the audience's guide through the problem, discovery, mechanism, proof, and resolution. Treat on-slide text as visual reinforcement rather than a transcript of the narration.

## Rendering rule

When a single image or scene is replaced, regenerate only the affected crops and rerun the render command. Keep all unaffected assets.
