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
   - duration in seconds or minutes, with a maximum of 8 minutes,
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
   - Reject or revise narration longer than 8 minutes.
   - When the user supplies narration audio, skip generation and measure the supplied audio instead.

5. Derive the timed scene list from both the script and measured voiceover duration.
   - Split at meaningful visual or narrative beats and align boundaries with natural pauses in the voiceover.
   - Let the content determine the scene count; do not start from a fixed or preferred number of scenes.
   - Use no more than 24 scenes. If the script has more than 24 beats, combine closely related beats without omitting essential narration.
   - Write the scene-count rationale, per-scene narration segments, exact start and end times, and framing notes.
   - Write one master storyboard prompt using the derived scene count.

6. Generate one master storyboard image with clearly separated scene panels.
   - Make every individual panel an exact 16:9 landscape frame, regardless of the master image's overall dimensions or the final video's aspect ratio.
   - State the exact panel count, row count, and column count in the image-generation prompt.
   - Use identical panel dimensions, straight boundaries, and clear gutters so crops can be calculated deterministically.
   - Keep important subjects and action inside each panel's 16:9 safe area.
   - For vertical output, also keep important content safe for a centered 9:16 crop from each 16:9 panel.
   - Keep characters, palette, lighting, and art direction consistent.
   - Avoid text inside generated artwork unless the user specifically requests it.
   - Request enough resolution for later cropping.
   - Inspect the result before continuing. Reject and regenerate any storyboard containing a missing panel or an approximate, square, portrait, or mixed-ratio panel.

7. Call `upscale_image`.
   - Default to `scale: 10`.
   - Use `faceEnhance: false` for illustrations.
   - Use face enhancement only when faces are photorealistic and visibly important.

8. Download the returned `upscaledImageUrl` into:
   `assets/storyboard/storyboard-upscaled.png`

9. Split the storyboard into individual scenes.
   - Prefer exact grid coordinates based on the intended storyboard layout.
   - Do not use OCR unless unavoidable.
   - Crop every scene to exact 16:9 dimensions and verify `width * 9 = height * 16` before rendering.
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
   - duration does not exceed 8 minutes,
   - scene count does not exceed 24,
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

Choose scene count only after the narration is final and voiceover duration is measured. Base it on meaningful script beats, natural audio pauses, and the amount of visual change needed. Never exceed 24 scenes or 8 minutes.

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
