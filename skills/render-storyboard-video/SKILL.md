---
name: render-storyboard-video
description: Take an existing storyboard image and narration, upscale it, split it into scenes, create or attach voiceover, and render a final MP4 with FFmpeg. Use when the storyboard already exists or only the composition stage is needed.
---

# Render storyboard video

Use the configured `explainer-media` MCP server. Read `upscaledImageUrl` from `upscale_image` and `voiceoverUrl` from `generate_voiceover`.

1. Preserve the source image without filters.
2. Call `explainer-media.upscale_image` unless the supplied image is already sufficiently large.
3. Call `explainer-media.generate_voiceover` when no narration audio is supplied, then measure the actual audio duration with `ffprobe`.
4. Derive scene timing from the script's visual beats and the measured voiceover duration. Aim for 10-12 seconds per scene and allow no ordinary still panel to remain longer than 15 seconds. For a 4-8 minute video, require at least `ceil(duration_seconds / 15)` scenes and use no more than 49.
5. Require the master storyboard itself to be exact 16:9 and its declared layout to be a square equal-cell grid (`rows = columns = ceil(sqrt(scene_count))`). Scenes must occupy cells in row-major order; ignore only declared trailing unused cells.
6. Crop exact storyboard panels into individual scene files. Require each crop to satisfy `width * 9 = height * 16`. Allow only a one-pixel rounding trim when grid division requires it. Reject square, portrait, approximate, missing, merged, or mixed-ratio panels, and never stretch artwork to force the ratio.
7. Build a concat or filter-complex FFmpeg render with subtle motion.
8. Add subtitles from the narration when requested.
9. Export H.264 MP4 with AAC audio and `yuv420p`.
10. Verify that the duration is 4-8 minutes unless the user explicitly requested shorter, the scene cadence passes the 15-second maximum-static check, the scene count is no more than 49, the master and every scene are exact 16:9, and the final file has valid dimensions, audio, and playback.
11. When correcting one scene, replace only that scene and rerender.
