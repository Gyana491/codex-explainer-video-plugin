---
name: create-explainer-video
description: Create a complete storyboard-based explainer video from a topic, script, article, or brief. Use Codex built-in image generation, then call the explainer-media MCP tools for 2x-10x upscaling and OpenAI voiceover, then use local FFmpeg to split, animate, and render the final video. Do not use an external image-generation API.
---

# Create an explainer video

Produce the finished video in the user's current project workspace.

## Fixed system boundaries

- Generate images using Codex or ChatGPT's built-in image-generation capability.
- Never call an external image-generation API.
- Use the `explainer-media.upscale_image` MCP tool for image upscaling.
- Use the `explainer-media.generate_voiceover` MCP tool for narration.
- Use local code and FFmpeg for cropping, scene extraction, animation, audio mixing, subtitles, and rendering.
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
   - visual style,
   - narration style,
   - output resolution.

2. Write:
   - one-line concept,
   - complete narration in a polished YouTube-explainer style,
   - delivery instructions matching the video tone.
   - Start with a direct hook, quickly explain why the topic matters, develop one idea at a time, and end with a concise takeaway.
   - Use plain, conversational language, short sentences, and as few words as necessary for clarity.
   - Prefer familiar words over jargon. Define unavoidable technical terms immediately.
   - Write only spoken narration in the voiceover script; keep headings, scene labels, and production directions outside it.
   - Remove filler, repetition, exaggerated claims, and unnecessary calls to action unless the user requests them.

3. Call `generate_voiceover` for the completed narration.
   - Default model is handled by the MCP server.
   - Prefer `marin` or `cedar` for polished narration.
   - Request MP3 unless WAV is needed for editing.
   - Preserve the returned AI-generated voice disclosure in publishing notes.

4. Download the returned `voiceoverUrl` to `assets/audio/voiceover.mp3`, then measure its actual duration with `ffprobe`.
   - Default to 4 minutes when no duration is supplied.
   - Revise narration or delivery until the measured audio is 4-8 minutes. Honor a shorter video only when the user explicitly requests it. Never exceed 8 minutes.
   - When the user supplies narration audio, skip generation and measure the supplied audio instead.

5. Derive the timed scene list from both the script and measured voiceover duration.
   - Split at meaningful visual or narrative beats and align boundaries with natural pauses in the voiceover.
   - Let the content determine scene boundaries, then enforce enough visual change to avoid a slide-deck feel.
   - Target 10-12 scenes per minute, equivalent to an average of 5-6 seconds per scene.
   - Calculate `minimum_scene_count = ceil(duration_seconds / 6)` and `maximum_scene_count = floor(duration_seconds / 5)`. Choose a count inside that inclusive range based on meaningful visual beats. If the range is empty for an unusually short clip, use one scene.
   - Split or combine nearby beats until the calculated count is within range without dropping narration. Individual scenes may vary around 5-6 seconds to follow natural speech, but the whole video must maintain the requested average cadence.
   - Avoid leaving an ordinary still panel on screen longer than 8 seconds unless the narration deliberately calls for a pause or close study.
   - Make adjacent scenes visibly different through action, camera scale, angle, environment, diagram state, or point of view. Avoid long runs of near-identical compositions.
   - Write the scene-count calculation and rationale, per-scene narration segments, exact start and end times, and framing notes.
   - Write one master storyboard prompt containing every calculated scene.

6. Generate exactly one master storyboard image with clearly separated scene panels.
   - Require the single master image itself to be exact 4:3 landscape. Do not accept the image generator's closest alternative ratio.
   - Make every individual panel an exact 16:9 landscape frame, regardless of the final video's aspect ratio.
   - Calculate `grid_scale = ceil(sqrt(scene_count / 12))`, `columns = 3 * grid_scale`, `rows = 4 * grid_scale`, and `cell_count = 12 * grid_scale^2`.
   - This proportional grid keeps the master exact 4:3 and every equal cell exact 16:9 because `columns:rows = 3:4` and `(3 x 16):(4 x 9) = 4:3`.
   - Put all scenes into this one grid in row-major order. Leave only trailing unused cells plain neutral; never create a second master image or let the model invent filler scenes.
   - State the scene count, total cell count, row count, column count, and row-major reading order in the image-generation prompt.
   - Use identical panel dimensions, straight boundaries, and clear gutters so crops can be calculated deterministically.
   - Keep important subjects and action inside each panel's 16:9 safe area.
   - For vertical output, also keep important content safe for a centered 9:16 crop from each 16:9 panel.
   - Keep characters, palette, lighting, and art direction consistent.
   - Avoid text inside generated artwork unless the user specifically requests it.
   - Request the highest available exact 4:3 resolution. Dense grids produce small panels, so always upscale the master before splitting it.
   - Inspect the result before continuing. Reject and regenerate a master that is not exact 4:3 or contains a missing panel or an approximate, square, portrait, or mixed-ratio panel.

   Use this prompt skeleton and append the numbered scene descriptions:

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

   Preserve one consistent visual style, character design, palette, lighting language, and world across all scenes. Do not add captions, labels, panel numbers, logos, or watermarks.

   SCENES IN ROW-MAJOR ORDER:
   {NUMBERED_SCENE_DESCRIPTIONS}

   Final compliance check: exactly one 4:3 image; {COLUMNS}x{ROWS} equal grid; {CELL_COUNT} cells; all {SCENE_COUNT} requested scenes; every cell exact 16:9; all scenes fully inside the canvas.
   ```

7. Call `upscale_image` for the master storyboard.
   - Pass the image generator's returned `image_url` as `imageUrl`.
   - `imageUrl` accepts either an HTTP(S) URL or a complete base64 data URI such as `data:image/png;base64,...`.
   - Never pass a local filesystem path, `file://` URL, blob URL, or only the raw base64 payload. If the generated result is available only as a local file, read its MIME type and encode the complete file as a data URI before calling the tool.
   - Default to `scale: 10`.
   - Use `faceEnhance: false` for illustrations.
   - Use face enhancement only when faces are photorealistic and visibly important.

8. Download the returned `upscaledImageUrl` into:
   `assets/storyboard/storyboard-upscaled.png`

9. Split the storyboard into individual scenes.
   - Use exact equal grid coordinates based on the declared proportional grid and row-major order.
   - Do not use OCR unless unavoidable.
   - Crop every scene to exact 16:9 dimensions and verify `width * 9 = height * 16` before rendering. A one-pixel rounding trim is allowed when the master dimensions are not evenly divisible by the grid size; never stretch.
   - Ignore the declared trailing unused cells and verify the number of exported scene files equals `scene_count`.
   - Never stretch a panel to force the ratio. Regenerate the malformed storyboard when a correct crop would remove required content.
   - Save scenes as:
     `assets/scenes/scene-01.png`, `scene-02.png`, and so on.

10. Build the video with FFmpeg.
   - Use subtle pans, zooms, and crossfades.
   - Match scene durations to narration beats.
   - Add captions when useful.
   - Use `libx264`, `yuv420p`, AAC audio, and `+faststart`.
   - Avoid visual filters that alter the supplied or generated artwork unless requested.

11. Validate:
   - duration is 4-8 minutes unless the user explicitly requested a shorter video,
   - scene count is within the calculated 10-12-scenes-per-minute range,
   - exactly one master storyboard exists, is exact 4:3, and contains the calculated proportional grid,
   - every extracted storyboard scene satisfies `width * 9 = height * 16`,
   - every scene fills the frame,
   - no panel borders remain,
   - voiceover is audible,
   - duration is correct,
   - no scene is duplicated accidentally,
   - final file plays from start to finish.

12. Save:
   - final video: `output/explainer-video.mp4`
   - narration: `output/narration.txt`
   - storyboard plan: `output/storyboard.json`
   - render command: `output/render-command.txt`

## Storyboard sizing

Choose scene count only after the narration is final and voiceover duration is measured. Calculate an inclusive range of `ceil(duration_seconds / 6)` through `floor(duration_seconds / 5)`, then choose a count inside it based on meaningful script beats and natural audio pauses. This yields 10-12 scenes per minute, or 5-6 seconds per scene on average. Fit every scene into exactly one 4:3 master using a `3k`-column by `4k`-row grid, where `k = ceil(sqrt(scene_count / 12))`. Never exceed 8 minutes.

Examples:

- 60 seconds: 10-12 scenes; use one 3x4 master with 12 cells.
- 240 seconds: 40-48 scenes; use one 6x8 master with 48 cells.
- 360 seconds: 60-72 scenes; use one 9x12 master with 108 cells.
- 480 seconds: 80-96 scenes; use one 9x12 master with 108 cells.

Suggested narrative progression:

1. Hook
2. Problem
3. Friction or consequence
4. Insight
5. Solution
6. How it works
7. Result
8. Closing message

## Rendering rule

When a single image or scene is replaced, regenerate only the affected crops and rerun the render command. Keep all unaffected assets.
