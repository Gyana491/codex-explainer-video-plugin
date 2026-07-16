---
name: render-storyboard-video
description: Render or resynchronize an existing storyboard and narration, including 5-6-slides-per-minute whiteboard presentations with handwritten scene text, orange emphasis, and word-focused captions. Split and finish storyboard scenes first, then generate one locked-voice clip per scene, measure and concatenate audio, create captions, and stitch a synchronized MP4 with FFmpeg. Use when a storyboard already exists, only composition is needed, or presentation visuals drift from the voiceover.
---

# Render storyboard video

Use the configured `explainer-media` MCP server. Read `upscaledImageUrl` from `upscale_image` and `voiceoverUrl` from `generate_voiceover`.

1. Preserve the generated master storyboard without visual filters. Require exactly one exact-4:3 master with the declared proportional grid and exact-16:9 cells.
2. Upscale the master before splitting unless it is already sufficiently large. Pass an HTTP(S) URL or complete base64 data URI to `upscale_image`; never pass a local path, `file://` URL, blob URL, or bare base64.
3. Split the storyboard before any generated voiceover work.
   - Crop row-major panels into `assets/scenes/scene-01.png`, `scene-02.png`, and so on. Require every crop to satisfy `width * 9 = height * 16`; never stretch malformed artwork.
   - Preserve the storyboard's declared narrative order. Verify the crop count, safe margins, unique compositions, one-idea clarity, causal beat progression, open-loop setup/payoff order, and visual callbacks before continuing.
4. Finish every scene image before generated voiceover work.
   - Verify and correct exact structured handwritten text from `output/storyboard.json` using one typography system. Keep titles, labels, pointer lines, annotations, orange emphasis, whitespace, and caption-safe areas compliant.
   - Do not start voice generation until all scene images pass visual and text review.
5. Generate one separate voiceover file per scene.
   - Save one locked configuration to `output/voice-config.json`, then call `generate_voiceover` once per scene narration segment in image order using identical voice, model, format, language, delivery, speed, and pronunciation guidance.
   - Save `assets/audio/scenes/scene-01.mp3`, `scene-02.mp3`, and so on. Require one matching audio file for every image. Retry only a failed scene with the locked configuration.
   - If the user supplies narration audio, preserve it and document the exception; otherwise per-scene generation is mandatory.
6. Measure and concatenate scene audio.
   - Measure every clip with FFprobe and use its exact duration for the matching slide. Concatenate decoded clips in order with `pydub`, without gaps or overlaps, and save `assets/audio/voiceover.mp3`.
   - Write cumulative measured boundaries to `output/scene-timings.json` with `timing_source: per_scene_audio`, then copy those exact timestamps into `output/storyboard.json`.
   - Compare concatenated duration with the sum of scene durations and investigate a difference above 50 ms. Use bundled audio analysis for rhythm review only; never move a cut away from its clip boundary.
7. Generate captions only after all scene voiceovers are final.
   - Force-align each clip against its exact narration, offset local word timestamps by cumulative scene start, and merge them into `output/word-timings.json`. Never divide scene duration uniformly across words.
   - Resolve storyboard reveal triggers from verified word timestamps. Group captions into 3-7-word phrases and write `output/captions.ass` with orange word-focused karaoke highlighting.
8. Stitch the final video from `output/scene-timings.json`.
   - Set every image duration from its matching measured audio clip. Keep narration untouched and execute reveal beats at aligned timestamps.
   - Burn in the final captions, compensate for any `xfade` overlap, and ensure the last visual frame ends with the final audio sample.
   - Export H.264 MP4 with AAC audio, `yuv420p`, and `+faststart`.
9. Validate the exact production order: storyboard master, upscale, split, finish scenes, generate per-scene voiceovers, measure and concatenate audio, generate captions, stitch video. Also verify 5-6 slides per minute, one matching image/audio pair per scene, identical voice configuration, exact handwritten text, orange-only emphasis, unique readable compositions, aligned captions and reveal beats, and final video/audio duration difference of at most 50 ms. Confirm the story still preserves its audience proxy, goal, stakes, obstacle, turning point, payoff, emotional progression, open-loop closures, and purposeful visual callbacks after splitting and stitching.
10. When correcting one slide or clip, replace only the affected asset, rebuild downstream timing or captions when necessary, and preserve all unaffected work.
