---
name: create-explainer-video
description: Create a complete storyboard-based explainer video with Codex image generation, OpenAI voiceover, deterministic Remotion shape animation and essential text, and local FFmpeg delivery. Use for explainer videos that combine generated artwork with diagrams, charts, equations, labels, kinetic text, or other editable motion graphics. Do not use an external image-generation API or ElevenLabs.
---

# Create an explainer video

Produce the finished video in the user's current writable workspace.

## System boundaries

- Generate artwork with Codex or ChatGPT built-in image generation only.
- Use `explainer-media.upscale_image` for upscaling.
- Use `explainer-media.generate_voiceover` for narration; do not use ElevenLabs.
- Use the bundled Remotion template for deterministic text and shape overlays.
- Use local FFmpeg for probing, cropping, audio work, subtitles, final encoding, and validation.
- Repair only affected scenes or assets.

Read [the overlay storyboard contract](../../references/overlay-storyboard.md) before planning scenes that need exact information.

## Workflow

1. Choose a duration of no more than 8 minutes, final aspect ratio, visual style, narration style, and resolution.
2. Write a direct-hook narration in plain conversational language. Keep headings and production notes out of spoken text.
3. Call `generate_voiceover` with the final narration. Prefer `marin` or `cedar`, use one consistent voice and instruction set, request MP3, and preserve the returned AI disclosure.
4. If narration exceeds 4,096 characters, split at paragraph boundaries and concatenate the generated parts. Download the completed track to `assets/audio/voiceover.mp3` and measure it with `ffprobe`.
5. Derive no more than 24 timed scenes from meaningful narration beats and natural pauses.
6. For each scene, choose one overlay strategy:
   - `artwork-only`
   - `kinetic-text`
   - `diagram`
   - `chart`
   - `equation`
   - `artwork-with-overlays`
7. Put atmosphere, characters, settings, and illustrative objects in generated panels. Put exact words, labels, numbers, equations, charts, and factual relationships in code-rendered overlays.
8. Write essential text, normalized shape geometry, and animation cues using stable IDs. Prefer 1-6 words per text element and no more than five cues per scene.
9. Create one master storyboard with the derived panel count. Require identical, exact 16:9 panels with straight boundaries and clear gutters. Keep important content safe for vertical cropping when needed.
10. Inspect the storyboard, call `upscale_image`, download it to `assets/storyboard/storyboard-upscaled.png`, split it, and verify every crop satisfies `width * 9 = height * 16`.
11. Copy the bundled `../../assets/remotion-overlay-template` into the workspace. Put scene panels under its `public/scenes`, voiceover under `public/audio`, and write its `src/project.json` from the timed plan.
12. Run the bundled validator before rendering:

    ```powershell
    node ../../scripts/validate-overlay-storyboard.mjs <copied-template>/src/project.json
    ```

13. Run `npm install`, `npm run preflight`, `npm run type-check`, and `npm run render` inside the copied template. On Windows ARM64, use x64 Node under Windows emulation because Remotion does not publish a native ARM64 compositor. The render script uses FFmpeg to normalize the Remotion intermediate to H.264/AAC, limited-range `yuv420p`, and `+faststart`.
14. Use an additional FFmpeg pass only when subtitles or audio mixing are requested.
15. Validate duration, scene count, exact crops, overlay safe areas, audio, unique scenes, and full playback.

## Timing policy

Generate one continuous narration track when possible for consistent delivery. The OpenAI voice tool does not return word timestamps, so every animation cue must have deterministic `startProgress`. Derive it from the cue's relative position inside the scene narration; preserve `triggerPhrase` for later alignment without making it a rendering dependency.

## Outputs

- `output/explainer-video.mp4`
- `output/narration.txt`
- `output/storyboard.json`
- `output/overlay-project.json`
- `output/render-command.txt`
