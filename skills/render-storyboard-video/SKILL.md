---
name: render-storyboard-video
description: Take an existing storyboard image and narration, upscale it, split it into scenes, create or attach voiceover, and render a final MP4 with FFmpeg. Use when the storyboard already exists or only the composition stage is needed.
---

# Render storyboard video

Use the configured `explainer-media` MCP server. Read `upscaledImageUrl` from `upscale_image` and `voiceoverUrl` from `generate_voiceover`.

1. Preserve the source image without filters.
2. Call `explainer-media.upscale_image` unless the supplied image is already sufficiently large.
3. Call `explainer-media.generate_voiceover` when no narration audio is supplied, then measure the actual audio duration with `ffprobe`.
4. Derive scene timing from the script's visual beats and measured voiceover duration. Calculate an inclusive target of `ceil(duration_seconds / 6)` through `floor(duration_seconds / 5)` scenes, choose a count within it, and record the calculation. This produces 10-12 scenes per minute, or 5-6 seconds per scene on average. Avoid leaving an ordinary still panel longer than 8 seconds unless deliberately required.
5. Require exactly one master storyboard containing every scene. It must be exact 4:3 and use a proportional equal-cell grid calculated with `k = ceil(sqrt(scene_count / 12))`, `columns = 3k`, and `rows = 4k`. Every cell must be exact 16:9. Use row-major scene order and ignore only declared trailing unused cells.
6. Crop exact storyboard panels into individual scene files. Require each crop to satisfy `width * 9 = height * 16`. Allow only a one-pixel rounding trim when grid division requires it. Reject square, portrait, approximate, missing, merged, or mixed-ratio panels, and never stretch artwork to force the ratio.
7. Build a concat or filter-complex FFmpeg render with subtle motion.
8. Add subtitles from the narration when requested.
9. Export H.264 MP4 with AAC audio and `yuv420p`.
10. Verify that the duration is 4-8 minutes unless the user explicitly requested shorter, the scene count is within the calculated 10-12-scenes-per-minute range, exactly one master exists and is exact 4:3 with the calculated proportional grid, every scene is exact 16:9, and the final file has valid dimensions, audio, and playback.
11. When correcting one scene, replace only that scene and rerender.
