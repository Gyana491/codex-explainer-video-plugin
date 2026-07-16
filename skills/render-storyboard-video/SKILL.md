---
name: render-storyboard-video
description: Render or resynchronize an existing storyboard and narration by analyzing voiceover rhythm with pydub and FFprobe, deriving per-scene timestamps, splitting the storyboard, and building a synchronized MP4 with FFmpeg. Use when a storyboard already exists, only composition is needed, or visuals currently move on fixed durations and drift from the voiceover.
---

# Render storyboard video

Use the configured `explainer-media` MCP server. Read `upscaledImageUrl` from `upscale_image` and `voiceoverUrl` from `generate_voiceover`.

1. Preserve the source image without filters.
2. Call `explainer-media.upscale_image` unless the supplied image is already sufficiently large. Pass an HTTP(S) URL or a complete base64 data URI (`data:image/png;base64,...`) as `imageUrl`; never pass a local path, `file://` URL, blob URL, or bare base64. Convert local image bytes to a complete data URI first.
3. Establish an audio-derived timeline before rendering visuals.
   - Prefer one narration file per scene. Generate every clip with the same voice and instructions, measure each clip with FFprobe, concatenate the decoded clips with `pydub`, and use cumulative measured durations as exact scene boundaries.
   - For supplied or monolithic narration, run `python3 /absolute/path/to/this-skill/scripts/analyze_audio.py AUDIO --scene-count N --output output/audio-analysis.json`, resolving the script relative to this `SKILL.md`. The analyzer is fully self-contained inside this skill directory; it uses `pydub` silence/speech detection and FFprobe duration verification, then snaps scene cuts to pause midpoints.
   - Inspect every `uniform_fallback` boundary and adjust the silence threshold or scene count if it cuts through speech. Never silently replace failed analysis with fixed-duration images.
   - Install dependencies with `python3 -m pip install -r /absolute/path/to/this-skill/requirements-audio.txt`. On Python 3.13+, this installs `audioop-lts` alongside `pydub`.
4. Write `output/scene-timings.json` as the authoritative render timeline. Each item must contain `scene_number`, `start_seconds`, `end_seconds`, `duration_seconds`, `timing_source`, and its narration segment. Require contiguous, ordered timestamps starting at 0 and ending at the measured audio duration.
5. Derive scene count from the script's visual beats and measured voiceover duration. Calculate an inclusive target of `ceil(duration_seconds / 6)` through `floor(duration_seconds / 5)` scenes, choose a count within it, and record the calculation. This produces 10-12 scenes per minute, or 5-6 seconds per scene on average. Individual durations must follow speech rhythm rather than a global fixed duration. Avoid leaving an ordinary still panel longer than 8 seconds unless deliberately required.
6. Require exactly one master storyboard containing every scene. It must be exact 4:3 and use a proportional equal-cell grid calculated with `k = ceil(sqrt(scene_count / 12))`, `columns = 3k`, and `rows = 4k`. Every cell must be exact 16:9. Use row-major scene order and ignore only declared trailing unused cells.
7. Crop exact storyboard panels into individual scene files. Require each crop to satisfy `width * 9 = height * 16`. Allow only a one-pixel rounding trim when grid division requires it. Reject square, portrait, approximate, missing, merged, or mixed-ratio panels, and never stretch artwork to force the ratio.
8. Build the FFmpeg concat or filter-complex directly from `output/scene-timings.json`. Set every image duration to its own `end_seconds - start_seconds`. Keep the narration on its original timeline. If `xfade` overlaps visuals, compensate for that overlap so the last visual frame still ends at the measured audio duration; use a direct cut where compensation would distort a short scene.
9. Add subtitles from the narration when requested.
10. Export H.264 MP4 with AAC audio and `yuv420p`.
11. Verify that the duration is 4-8 minutes unless the user explicitly requested shorter, the scene count is within the calculated 10-12-scenes-per-minute range, exactly one master exists and is exact 4:3 with the calculated proportional grid, every scene is exact 16:9, every visual boundary matches `output/scene-timings.json`, the video/audio duration difference is at most 50 ms, and the final file has valid dimensions, audio, and playback.
12. When correcting one scene, replace only that scene and rerender without changing unrelated audio-derived timestamps.
