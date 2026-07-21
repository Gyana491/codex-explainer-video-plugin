---
name: create-explainer-video
description: Create a complete storyboard-based explainer video from a topic, script, article, brief, or narration audio, using built-in image generation, the explainer-media MCP tools, Remotion overlays, and local FFmpeg. Use for story-driven whiteboard explainers end to end.
---

# Create an explainer video

Produce the finished video in the user's current writable workspace.

## System boundaries

- Generate images using Codex or ChatGPT's built-in image-generation capability. Never call an external image-generation API.
- Make exactly one image-generation call per contact sheet, as defined in `../../references/master-prompt-template.md` (one sheet for ≤12 scenes; chunked sheets above that). Never a retry, correction, replacement panel, geometry fix, text fix, or alternate call for any sheet.
- Use the `explainer-media.upscale_image` MCP tool for upscaling. Prefer passing HTTP(S) URLs; a base64 data URI is a last resort.
- Use the `explainer-media.generate_voiceover` MCP tool for narration; do not use ElevenLabs.
- Use the bundled Remotion template for deterministic text, diagrams, charts, equations, and shape overlays.
- Use local Python (`pydub`, `faster-whisper`) and FFprobe/FFmpeg for audio analysis, cropping, mixing, subtitles, encoding, and validation.
- Treat measured audio timestamps as the visual timeline. Never assign a global fixed duration.
- Do not restart the entire workflow when only one asset or scene needs correction — see the correction rule below.

## Workflow

1. **Choose** duration (default 4 min, 4-8 min range, never longer unless the user explicitly requests it), aspect ratio, visual style (default: `../../references/whiteboard-style.md`), narration style, output resolution.
2. **Plan** — follow the storyboard-director skill contract (`../storyboard-director/SKILL.md`): essence → story engine → narration → slide plan → master prompt. Craft rules live in `../../references/story-rules.md`.
3. **Generate** — one image call per sheet from the master prompt template. Upscale each sheet (`scale = ceil((1920 * columns) / master_width)`, clamped 2-10), download, extract scene candidates, then run:

   ```
   python <plugin-root>/scripts/canonicalize_storyboard.py --scene-dir <candidates> --output assets/storyboard/storyboard-upscaled.png --manifest output/storyboard-geometry.json
   ```

   Copy each populated slot's exact rectangle into the matching scene's `crop_panel`.
4. **Voice** — may start concurrently with step 3 once narration is locked: save `output/voice-config.json`, then one `generate_voiceover` call per scene, saved as `assets/audio/scenes/scene-NN.mp3` matching image numbering.
5. **Timing** — FFprobe every clip, concatenate with `pydub` to `assets/audio/voiceover.mp3`, write `output/scene-timings.json` (`timing_source: per_scene_audio`), run `python <plugin-root>/scripts/analyze_audio.py assets/audio/voiceover.mp3`.
6. **Captions** — `python <plugin-root>/scripts/align_words.py output/scene-timings.json --words output/word-timings.json --captions output/captions.ass`; resolve reveal-beat triggers from the result.
7. **Render** — follow the render-storyboard-video skill contract (`../render-storyboard-video/SKILL.md`) steps 8-10: prepare the overlay project with `scripts/prepare-overlay-project.mjs`, validate with `scripts/validate-overlay-storyboard.mjs`, run layout QA, render, finalize.
8. **Validate** — run `node <plugin-root>/scripts/validate-project.mjs` and fix every FAIL, then judge:
   - duration is 4-8 minutes unless the user explicitly requested shorter, and scene count matches the calculated 5-6-slides-per-minute range,
   - every slide uses the same declared theme, one clear idea, at least one named recurring character, and one explanatory visual, understandable within two seconds without narration,
   - no text sits over faces, hands, screens, dense artwork, dividers, borders, or the caption-safe area; the theme's accent color is used only for emphasis,
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
