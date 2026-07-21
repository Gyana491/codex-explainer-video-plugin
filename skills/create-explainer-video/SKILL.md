---
name: create-explainer-video
description: Create a complete storyboard-based explainer video (max 6 scenes) from a topic, script, article, brief, or narration audio, using built-in image generation, the explainer-media MCP tools, Remotion overlays, and local FFmpeg. Use for story-driven explainers end to end.
---

# Create an explainer video

Produce the finished video in the user's current writable workspace.

## Definition of done

**A rendered MP4 is not a finished run.** Before reporting success, all of the following must be true, or you report exactly what is missing instead of claiming completion:

- `node <plugin-root>/scripts/validate-project.mjs` exits 0 in the workspace.
- `output/captions.ass` and `output/word-timings.json` exist and are non-empty.
- `output/storyboard-geometry.json` exists with `ratio_verified: true` on the master and every slot.
- One audio clip exists per scene under `assets/audio/scenes/`, and `output/scene-timings.json` has `timing_source: per_scene_audio` for every scene.
- Scene count is between 3 and 6 inclusive (see step 0 below).

A video that skips any of these is a failed run, not a smaller success — do not deliver it as final.

## Step 0 — read before planning

Read `../../references/story-rules.md`, `../../references/house-style.md`, and `../../references/master-prompt-template.md` in full before writing narration or an image prompt. Do not improvise a visual style, palette, or image-generation prompt structure — all three are defined in these files, not invented per run.

**Default style is editorial paper-collage: cream background, dark ink outlines, hand-cut-paper illustration, a warm + cool accent pair, clean editorial sans typography (Inter). Never substitute another style — handwritten, whiteboard, 3D, or otherwise — unless the user explicitly asks for it.** Full rules: `../../references/house-style.md`.

## System boundaries

- Generate images using Codex or ChatGPT's built-in image-generation capability. Never call an external image-generation API.
- **Hard cap: at most 6 scenes, minimum 3.** No target video length — duration follows the narration. Never inflate the scene count to fill a duration, and never exceed 6 without the user explicitly requesting it.
- Make exactly one image-generation call per contact sheet, as defined in `../../references/master-prompt-template.md` (with ≤6 scenes, this is always exactly one sheet — see § Chunked sheets for the explicit-request exception). Never a retry, correction, replacement panel, geometry fix, text fix, or alternate call for any sheet.
- Use the `explainer-media.upscale_image` MCP tool for upscaling. Built-in image generation returns a **local file** — encode it as a base64 data URI (`data:image/png;base64,...`) and pass that; this is the normal path, not a fallback. Use an HTTP(S) URL only when you already have one.
- **Never call `generate_voiceover` until `output/storyboard.json` exists with per-scene narration segments and `output/voice-config.json` is saved.** Always one call per scene, never one call for the whole narration — the monolithic path is reserved for user-supplied narration audio only.
- Use the bundled Remotion template for deterministic text, diagrams, charts, equations, and shape overlays.
- Use local Python (`pydub`, `faster-whisper`) and FFprobe/FFmpeg for audio analysis, cropping, mixing, subtitles, encoding, and validation.
- Treat measured audio timestamps as the visual timeline. Never assign a global fixed duration.
- Do not restart the entire workflow when only one asset or scene needs correction — see the correction rule below.
- Prefer the bundled scripts (`scripts/*.mjs`, `scripts/*.py`) over improvised multi-step shell commands — they exist specifically to avoid quoting/escaping mistakes with generated filenames and paths.
- A file download blocked by the workspace network sandbox is not a failure — retry the same download once outside the sandbox before treating it as blocked.

## Workflow

1. **Choose** aspect ratio, visual style (default: house style, step 0), narration style, output resolution. No duration target — see System boundaries.
2. **Plan** — follow the storyboard-director skill contract (`../storyboard-director/SKILL.md`): essence → story engine → narration → slide plan (3-6 scenes) → master prompt with reserved `text_zones` per scene. Craft rules live in `../../references/story-rules.md`.
3. **Generate** — one image call for the single sheet (all scenes fit one grid at the 6-scene cap) from the master prompt template, including a cutout tray when characters/objects recur across scenes. Upscale (`scale = ceil((1920 * columns) / master_width)`, clamped 2-10) by base64-encoding the local file, download, extract scene candidates, then run:

   ```
   python <plugin-root>/scripts/canonicalize_storyboard.py --scene-dir <candidates> --output assets/storyboard/storyboard-upscaled.png --manifest output/storyboard-geometry.json
   ```

   Copy each populated slot's exact rectangle into the matching scene's `crop_panel`. If a cutout tray was generated, crop and key its cells per `../../references/overlay-storyboard.md` § Cutout extraction.
4. **Voice** — only after `output/storyboard.json` and `output/voice-config.json` exist (System boundaries): one `generate_voiceover` call per scene, saved as `assets/audio/scenes/scene-NN.mp3` matching image numbering. May run concurrently with step 3 since it depends only on narration text.
5. **Timing** — FFprobe every clip, concatenate with `pydub` to `assets/audio/voiceover.mp3`, write `output/scene-timings.json` (`timing_source: per_scene_audio`), run `python <plugin-root>/scripts/analyze_audio.py assets/audio/voiceover.mp3`.
6. **Captions** — `python <plugin-root>/scripts/align_words.py output/scene-timings.json --words output/word-timings.json --captions output/captions.ass`; resolve every scene's 2-5 reveal-beat triggers from the result — no scene may end up with zero resolved beats.
7. **Render** — follow the render-storyboard-video skill contract (`../render-storyboard-video/SKILL.md`) steps 8-10: prepare the overlay project with `scripts/prepare-overlay-project.mjs`, validate with `scripts/validate-overlay-storyboard.mjs`, run layout QA, render, finalize.
8. **Validate** — run `node <plugin-root>/scripts/validate-project.mjs . --render-project <render-dir>/src/project.json` (the render directory from step 7) and fix every FAIL (see Definition of done). Then judge:
   - scene count is 3-6 and every slide earns its place,
   - every slide uses the same declared theme, one clear idea, at least one named recurring character or object, and one explanatory visual, understandable within two seconds without narration,
   - no text sits over faces, hands, screens, dense artwork, dividers, borders, or the caption-safe area; the theme's accent colors are used only for emphasis, never body copy,
   - the sequence follows its declared narrative spine with a real turning point, and every open loop and visual callback pays off,
   - narration passes the cold-listener and story-integrity tests from `../../references/story-rules.md`,
   - captions match the narration exactly and highlight the active word at the correct moment,
   - the final file plays start to finish.

## Save

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

## Correction rule

When a crop or scene output needs correction, adjust only the local crop, text overlay, or compositor settings and rerun the local render command. Never make another image-generation call. Keep all unaffected assets.
