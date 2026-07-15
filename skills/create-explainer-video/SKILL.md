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
   - Aim for 10-12 seconds per scene. For 4-8 minute videos, require at least `ceil(duration_seconds / 15)` scenes and normally use `ceil(duration_seconds / 12)` through `ceil(duration_seconds / 10)` scenes.
   - Do not leave a still panel on screen longer than 15 seconds unless the narration deliberately calls for a pause or close study.
   - Make adjacent scenes visibly different through action, camera scale, angle, environment, diagram state, or point of view. Avoid long runs of near-identical compositions.
   - Use no more than 49 scenes in one master storyboard. If the script has more than 49 beats, combine closely related beats without omitting essential narration.
   - Write the scene-count rationale, per-scene narration segments, exact start and end times, and framing notes.
   - Write one master storyboard prompt using the derived scene count.

6. Generate one master storyboard image with clearly separated scene panels.
   - Require the master image itself to be exact 16:9 landscape. Do not accept the image generator's closest alternative ratio.
   - Make every individual panel an exact 16:9 landscape frame, regardless of the final video's aspect ratio.
   - Choose `grid_size = ceil(sqrt(scene_count))` and use exactly `grid_size` rows by `grid_size` columns. This square grid is mandatory: it is what lets an equal-cell grid be 16:9 both at the master-image level and at the individual-panel level.
   - State the scene count, total cell count, row count, column count, and row-major reading order in the image-generation prompt. Put scenes first and leave only trailing unused cells plain neutral; never let the model invent filler scenes.
   - Use identical panel dimensions, straight boundaries, and clear gutters so crops can be calculated deterministically.
   - Keep important subjects and action inside each panel's 16:9 safe area.
   - For vertical output, also keep important content safe for a centered 9:16 crop from each 16:9 panel.
   - Keep characters, palette, lighting, and art direction consistent.
   - Avoid text inside generated artwork unless the user specifically requests it.
   - Request the highest available 16:9 resolution. Small panels are acceptable because the storyboard is upscaled before it is split.
   - Inspect the result before continuing. Reject and regenerate any storyboard containing a missing panel or an approximate, square, portrait, or mixed-ratio panel.

   Use this prompt skeleton and append the numbered scene descriptions:

   ```text
   Create ONE master storyboard contact sheet as a single exact 16:9 landscape image.

   HARD LAYOUT CONTRACT:
   - Exactly {G} columns by {G} rows: {CELL_COUNT} equal cells total.
   - Every cell is exact 16:9 landscape; the complete outer canvas is also exact 16:9.
   - No square, portrait, merged, inset, overlapping, irregular, missing, or clipped cells.
   - Show one composition per cell; never create collages or nested mini-panels inside a cell.
   - Use identical cell dimensions, straight aligned boundaries, and thin uniform divider strokes inside the cell edges.
   - Put exactly {SCENE_COUNT} scenes in cells 1-{SCENE_COUNT}, left-to-right then top-to-bottom.
   - Leave cells {FIRST_UNUSED}-{CELL_COUNT} plain neutral and empty; do not invent extra scenes. [Omit when none are unused.]
   - Keep every subject inside its own cell and away from dividers.

   Preserve one consistent visual style, character design, palette, lighting language, and world across all scenes. Do not add captions, labels, panel numbers, logos, or watermarks.

   SCENES IN ROW-MAJOR ORDER:
   {NUMBERED_SCENE_DESCRIPTIONS}

   Final compliance check: one 16:9 image; {G}x{G} equal grid; {CELL_COUNT} cells; {SCENE_COUNT} requested scenes; every cell exact 16:9; all scenes fully inside the canvas.
   ```

7. Call `upscale_image`.
   - Default to `scale: 10`.
   - Use `faceEnhance: false` for illustrations.
   - Use face enhancement only when faces are photorealistic and visibly important.

8. Download the returned `upscaledImageUrl` into:
   `assets/storyboard/storyboard-upscaled.png`

9. Split the storyboard into individual scenes.
   - Use exact equal grid coordinates based on the declared square layout and row-major order.
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
   - scene count satisfies the 15-second maximum-static cadence and does not exceed 49,
   - master storyboard is exact 16:9 and contains the declared square grid,
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

Choose scene count only after the narration is final and voiceover duration is measured. Base scene boundaries on meaningful script beats and natural audio pauses, then enforce frequent visual change. Aim for 10-12 seconds per scene, allow at most 15 seconds for an ordinary still, and never exceed 49 scenes or 8 minutes.

Examples:

- 240 seconds: minimum 16, normally 20-24 scenes; use a 5x5 grid.
- 360 seconds: minimum 24, normally 30-36 scenes; use a 6x6 grid.
- 480 seconds: minimum 32, normally 40-48 scenes; use a 7x7 grid.

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
