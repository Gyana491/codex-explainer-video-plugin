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
   - duration,
   - aspect ratio,
   - scene count,
   - visual style,
   - narration style,
   - output resolution.

2. Write:
   - one-line concept,
   - complete narration,
   - timed scene list,
   - one master storyboard prompt,
   - per-scene framing notes.

3. Generate one master storyboard image with clearly separated scene panels.
   - Keep characters, palette, lighting, and art direction consistent.
   - Avoid text inside generated artwork unless the user specifically requests it.
   - Request enough resolution for later cropping.

4. Call `upscale_image`.
   - Default to `scale: 10`.
   - Use `faceEnhance: false` for illustrations.
   - Use face enhancement only when faces are photorealistic and visibly important.

5. Download the returned `upscaledImageUrl` into:
   `assets/storyboard/storyboard-upscaled.png`

6. Split the storyboard into individual scenes.
   - Prefer exact grid coordinates based on the intended storyboard layout.
   - Do not use OCR unless unavoidable.
   - Save scenes as:
     `assets/scenes/scene-01.png`, `scene-02.png`, and so on.

7. Call `generate_voiceover`.
   - Default model is handled by the MCP server.
   - Prefer `marin` or `cedar` for polished narration.
   - Request MP3 unless WAV is needed for editing.
   - Add delivery instructions matching the video tone.
   - Preserve the returned AI-generated voice disclosure in publishing notes.

8. Download the returned `voiceoverUrl` to:
   `assets/audio/voiceover.mp3`

9. Build the video with FFmpeg.
   - Use subtle pans, zooms, and crossfades.
   - Match scene durations to narration beats.
   - Add captions when useful.
   - Use `libx264`, `yuv420p`, AAC audio, and `+faststart`.
   - Avoid visual filters that alter the supplied or generated artwork unless requested.

10. Validate:
   - every scene fills the frame,
   - no panel borders remain,
   - voiceover is audible,
   - duration is correct,
   - no scene is duplicated accidentally,
   - final file plays from start to finish.

11. Save:
   - final video: `output/explainer-video.mp4`
   - narration: `output/narration.txt`
   - storyboard plan: `output/storyboard.json`
   - render command: `output/render-command.txt`

## Suggested storyboard structure

For a 30 to 45 second video, use 6 to 8 scenes:
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
