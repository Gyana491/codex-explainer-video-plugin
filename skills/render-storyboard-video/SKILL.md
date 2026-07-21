---
name: render-storyboard-video
description: Render or resynchronize an existing storyboard and narration into a story-driven whiteboard video with pixel-verified scenes, per-scene voiceover, word-focused captions, and deterministic Remotion overlays. Use when a storyboard already exists or only composition/re-render is needed.
---

# Render storyboard video

Use the configured `explainer-media` server. Read `upscaledImageUrl` from `upscale_image` and `voiceoverUrl` from `generate_voiceover`. Read `../../references/overlay-storyboard.md` when the storyboard package contains overlays; the template defaults to the whiteboard `theme` — set `theme` in `project.json` only to depart from it.

1. **Never make an additional image-generation call.** Use the single supplied/generated contact sheet(s) only. If a sheet has no passing `output/storyboard-geometry.json`, treat it as a draft and run `python <plugin-root>/scripts/canonicalize_storyboard.py --scene-dir <candidates> --output assets/storyboard/storyboard-upscaled.png --manifest output/storyboard-geometry.json` after extracting scene candidates. Accept only the locally composited exact-4:3/16:9 master.
2. **Upscale before splitting** unless the sheet is already large enough. Compute `scale = ceil((1920 * columns) / master_width)`, clamped to 2-10, and pass it explicitly. Pass an HTTP(S) URL to `upscale_image`; use a base64 data URI only when no URL exists.
3. **Split before any voiceover work.** Require the geometry manifest to prove master `width*3 == height*4` and every slot `width*9 == height*16`; any missing or false check blocks rendering. Crop row-major panels into `assets/scenes/scene-01.png`, etc., using each scene's recorded `crop_panel`. Blank slots share populated-slot geometry but are never exported as scenes.
4. **Finish every scene image** — verify and correct exact handwritten text from `output/storyboard.json` using one typography system — before generated voiceover work begins.
5. **Generate per-scene voiceover.** Save one locked configuration to `output/voice-config.json`, then call `generate_voiceover` once per scene in image order with identical voice, model, format, language, delivery, and pronunciation guidance. Save `assets/audio/scenes/scene-01.mp3`, etc., one file per image. Retry only a failed scene with the locked configuration.
   - **May run concurrently with steps 1-4** once narration segments in `output/storyboard.json` are locked and `output/voice-config.json` is saved — voiceover depends only on narration text, not on finished images. Issue independent `generate_voiceover` calls in parallel when the environment supports it. Do not start captions or timing (steps 6-7) until BOTH verified scene images and all scene clips exist.
6. **Measure and concatenate scene audio.** FFprobe every clip for its exact duration; concatenate with `pydub` in order, no gaps or overlaps, save `assets/audio/voiceover.mp3`. Write cumulative measured boundaries to `output/scene-timings.json` (`timing_source: per_scene_audio`), then copy those timestamps into `output/storyboard.json`. Investigate any difference above 50 ms between the concatenated file and the sum of scene durations.
7. **Generate captions after all voiceovers are final.** Run `python <plugin-root>/scripts/align_words.py output/scene-timings.json --words output/word-timings.json --captions output/captions.ass`. Resolve storyboard reveal triggers from the resulting word timestamps.
8. **Stitch the final video.**
   - Use FFmpeg pans, zooms, and crossfades for `artwork-only` scenes.
   - For kinetic text, diagrams, charts, equations, or artwork with overlays: run `node <plugin-root>/scripts/prepare-overlay-project.mjs <project-dir>` to copy the template and link its installed dependencies, then write `src/project.json`, place panels under `public/scenes`, and place the joined narration under `public/audio`.
   - Keep exact titles, labels, numbers, equations, and factual relationships in deterministic overlays — never rely on generated lettering as the source of truth.
   - Validate before rendering: `node <plugin-root>/scripts/validate-overlay-storyboard.mjs <project-dir>/src/project.json`.
   - Run layout QA before the expensive render: `node <project-dir>/scripts/analyze-overlay-layout.mjs <project-dir>/src/project.json --json <project-dir>/output/layout-report.json`. Fix reported collisions first. When text uses `intent.autoPlace: true` or belongs to an anchored group, run `npm run layout-fix` then `npm run layout-stills` to inspect solved positions as stills.
   - In `<project-dir>` run `npm run preflight`, `npm run type-check`, and `npm run render`. On Windows ARM64, use x64 Node under emulation.
   - Set every image duration from its matching measured audio clip; execute reveal beats at aligned timestamps. Burn in the final captions; compensate for any `xfade` overlap so the last visual frame ends with the final audio sample. Export H.264 MP4, AAC audio, `yuv420p`, `+faststart`.
9. **Validate.** Run `node <plugin-root>/scripts/validate-project.mjs <project-dir>` and fix every reported FAIL. Then judge what the validator cannot check: theme/style consistency across slides, no text over faces/hands/screens/dense artwork, accent color used only for emphasis, captions match narration with correctly timed active-word highlighting, story arc still closes every open loop, final file plays start to finish.
10. **Corrections.** When one slide or clip needs fixing, replace only the affected asset, rebuild downstream timing or captions when necessary, and preserve all unaffected work. Never make another image-generation call to correct geometry, wording, or composition.

## Text and timing rules

- Keep essential text separate from optional subtitles; never display the full narration as a permanent text band.
- Store deterministic `startProgress` for animation cues so rendering does not depend on an external timestamp service; use verified word timings to resolve cues when available.
- Keep overlay text concise — normally 1-6 words per element, no more than two simultaneous blocks excluding captions.
