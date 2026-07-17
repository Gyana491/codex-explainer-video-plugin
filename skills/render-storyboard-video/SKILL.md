---
name: render-storyboard-video
description: Take an existing storyboard image and narration, upscale and split it, create or attach OpenAI voiceover, add deterministic Remotion shape animation and essential text, and render a final MP4. Use when the storyboard already exists or only composition is needed.
---

# Render storyboard video

Use the configured `explainer-media` server. Read `upscaledImageUrl` from `upscale_image` and `voiceoverUrl` from `generate_voiceover`.

Read [the overlay contract](../../references/overlay-storyboard.md) when the storyboard package contains overlays.

1. Preserve the source image without filters.
2. Call `explainer-media.upscale_image` unless the source is already sufficiently large.
3. Call `explainer-media.generate_voiceover` when no narration audio is supplied. Prefer `marin` or `cedar`, request MP3, download the result, and preserve the AI-voice disclosure.
4. Measure the actual audio duration with `ffprobe`. If narration exceeds the tool's 4,096-character input limit, split only at paragraph boundaries, generate each part with the same voice and instructions, then concatenate the parts before timing scenes.
5. Derive scene boundaries from narration beats, natural pauses, and measured duration. Do not impose a fixed scene count; use at most 24.
6. Crop exact 16:9 storyboard panels. Verify `width * 9 = height * 16`; never stretch artwork.
7. Decide per scene whether simple FFmpeg motion is sufficient:
   - Use FFmpeg pans, zooms, and crossfades for `artwork-only` scenes.
   - Use the bundled Remotion template for kinetic text, diagrams, charts, equations, or artwork with overlays.
8. For hybrid rendering, copy `../../assets/remotion-overlay-template` into the user's workspace, replace `src/project.json`, place panels under `public/scenes`, and place voiceover under `public/audio`.
9. Validate the project before installing dependencies or rendering:

   ```powershell
   node ../../scripts/validate-overlay-storyboard.mjs <copied-template>/src/project.json
   ```

10. In the copied template, run `npm install`, `npm run preflight`, `npm run type-check`, and `npm run render`. On Windows ARM64, use x64 Node under Windows emulation because Remotion does not publish a native ARM64 compositor. The render script normalizes the Remotion intermediate to H.264/AAC, limited-range `yuv420p`, and `+faststart`.
11. Use an additional FFmpeg pass for subtitle burn-in or attachment and audio replacement or mixing when requested.
12. Verify duration, dimensions, scene count, audio, overlay safe areas, unique scenes, and start-to-finish playback.

## Text and timing rules

- Keep essential text separate from optional subtitles.
- Never display the entire narration as a permanent text band.
- Use deterministic `startProgress` values for cue timing. A `triggerPhrase` documents intent and may support later word alignment, but rendering must not depend on ElevenLabs timestamps.
- When correcting one scene, replace only its panel or overlay data and rerender; preserve all unaffected assets.
