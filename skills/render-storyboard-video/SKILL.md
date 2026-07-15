---
name: render-storyboard-video
description: Take an existing storyboard image and narration, upscale it, split it into scenes, create or attach voiceover, and render a final MP4 with FFmpeg. Use when the storyboard already exists or only the composition stage is needed.
---

# Render storyboard video

Use the configured `explainer-media` MCP server. Read `upscaledImageUrl` from `upscale_image` and `voiceoverUrl` from `generate_voiceover`.

1. Preserve the source image without filters.
2. Call `explainer-media.upscale_image` unless the supplied image is already sufficiently large.
3. Call `explainer-media.generate_voiceover` when no narration audio is supplied, then measure the actual audio duration with `ffprobe`.
4. Derive scene timing from the script's visual beats and the measured voiceover duration. Do not impose a fixed scene count; use only the panels the script and audio require, up to 24.
5. Crop exact storyboard panels into individual scene files. Require each crop to satisfy `width * 9 = height * 16`. Reject square, portrait, approximate, or mixed-ratio panels, and never stretch artwork to force the ratio.
6. Build a concat or filter-complex FFmpeg render with subtle motion.
7. Add subtitles from the narration when requested.
8. Export H.264 MP4 with AAC audio and `yuv420p`.
9. Verify that the duration is no more than 8 minutes, the scene count is no more than 24, every scene is exact 16:9, and the final file has valid dimensions, audio, and playback.
10. When correcting one scene, replace only that scene and rerender.
