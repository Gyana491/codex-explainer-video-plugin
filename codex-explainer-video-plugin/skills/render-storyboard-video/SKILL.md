---
name: render-storyboard-video
description: Take an existing storyboard image and narration, upscale it, split it into scenes, create or attach voiceover, and render a final MP4 with FFmpeg. Use when the storyboard already exists or only the composition stage is needed.
---

# Render storyboard video

Use the configured `explainer-media` MCP server. Read `upscaledImageUrl` from `upscale_image` and `voiceoverUrl` from `generate_voiceover`. On an authentication error, stop and ask the user to reinstall or reconfigure the plugin with `EXPLAINER_MCP_API_KEY`; never request or print the key in chat.

1. Preserve the source image without filters.
2. Call `explainer-media.upscale_image` unless the supplied image is already sufficiently large.
3. Crop exact storyboard panels into individual scene files.
4. Call `explainer-media.generate_voiceover` when no narration audio is supplied.
5. Build a concat or filter-complex FFmpeg render with subtle motion.
6. Add subtitles from the narration when requested.
7. Export H.264 MP4 with AAC audio and `yuv420p`.
8. Verify dimensions, duration, audio stream, and playback.
9. When correcting one scene, replace only that scene and rerender.
