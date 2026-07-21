---
name: storyboard-director
description: Plan a production-ready explainer storyboard from any source — essence, story engine, narration, slide plan, master prompt, and timing scaffolding. Use for source-to-explainer planning without immediately rendering the final video.
---

# Storyboard director

Read `../../references/story-rules.md` before writing the essence, story engine, or narration. Read `../../references/overlay-storyboard.md` when any scene needs exact text, shapes, charts, diagrams, or equations. Read `../../references/whiteboard-style.md` for the default visual direction.

## Outputs

Return or save structured JSON with these top-level fields: `title`, `target_duration`, `duration_unit`, `aspect_ratio`, `fps`, `visual_style`, `narration_style`, `source_essence`, `source_essence_file`, `story_engine`, `narration`, `production_sequence`, `voiceover_duration_seconds`, `timing_source`, `audio_analysis_file`, `word_timing_file`, `caption_file`, `caption_style`, `scene_count_rationale`, `storyboard_grid`, `average_scene_duration_seconds`, `theme_bible`, `master_prompt`, `overlay_contract`, `scenes`.

**Required** per-scene fields: `scene_number`, `narration_segment`, `visual_description`, `start_seconds`, `end_seconds`, `duration_seconds`, `timing_source`, `crop_panel`, `camera_motion`, `transition`, `overlay_strategy`, `on_slide_text`, `caption_safe_area`, `reveal_beats`; add `overlay_elements` and `animation_cues` whenever `overlay_strategy` is not `artwork-only`.

Story-craft fields (`story_role`, `story_beat`, `cause_from_previous`, `question_opened_or_answered`, `setup_or_payoff`, `emotional_shift`, `visual_callback`, `clear_idea`, `visual_story_map`, `composition_signature`, `text_layout`, `character_action`, `layout`) are planning aids — include them when they help you write better slides, but no downstream script or validator reads them. Do not treat them as required output.

## Process

1. **Essence** → `output/source-essence.json`. Rules: `story-rules.md` § Source essence.
2. **Story engine + narration.** Rules: `story-rules.md` § Story engine and § Narration. Set `timing_source: estimated_pre_audio` on the top level and every scene until voiceover is measured.
3. **Slide plan.** Target 5-6 slides per minute, an average of 10-12 seconds per slide.
   - `minimum_scene_count = ceil(duration_seconds / 12)`, `maximum_scene_count = floor(duration_seconds / 10)`.
   - Choose a scene count inside that inclusive range based on meaningful visual ideas; use one slide if the range is empty for an unusually short clip.
   - Record the formula, measured or estimated duration, calculated range, chosen count, achieved scenes-per-minute, and average scene duration in `scene_count_rationale`.
   - Apply `story-rules.md` § Slide craft to every scene.
4. **Grid.** Choose rows/columns that maximize equal 16:9 panels inside a 4:3 canvas: evaluate column counts 1 through `scene_count`, set `rows = ceil(scene_count / columns)`, pick the candidate with the largest panel after outer padding and uniform gutters. Record your choice in `storyboard_grid` (`master_aspect_ratio: "4:3"`, `panel_aspect_ratio: "16:9"`, `canvas_width`, `canvas_height`, `rows`, `columns`, `scene_count`, `cell_count`, `unused_cell_count`, `outer_padding`, `gutter`, `panel_width`, `panel_height`, `reading_order: "row-major"`). `scripts/canonicalize_storyboard.py` recomputes this exactly during production — your figures only drive the image prompt and grid choice.
   - More than 12 scenes → plan chunked sheets per `../../references/master-prompt-template.md` § Chunked sheets.
5. **Master prompt.** Build from `../../references/master-prompt-template.md`, using the whiteboard block from `../../references/whiteboard-style.md` unless the user requests another style. Set `overlay_contract` to `references/overlay-storyboard.md`.
6. **Production sequence.** Set `production_sequence` to this exact order: `plan_storyboard`, `generate_master_draft`, `upscale_master_draft`, `extract_scene_candidates`, `canonicalize_master_geometry`, `verify_master_and_scenes`, `finish_scene_text`, `generate_per_scene_voiceovers`, `measure_and_concatenate_audio`, `generate_word_level_captions`, `stitch_video`.

## Timing rules

- Before any voiceover exists, `timing_source` is `estimated_pre_audio` everywhere and scene/reveal-beat timestamps are provisional.
- After scene images are final, generate exactly one voiceover per scene, in order, with one locked voice/model/format/language/delivery configuration saved to `output/voice-config.json` before the first call.
- Measure every clip with FFprobe, concatenate without gaps or overlaps, and replace every timestamp with cumulative measured durations using `timing_source: per_scene_audio`. Never derive timing from a fixed or estimated duration once audio exists.
- Generate captions only after all scene audio is final: run `python <plugin-root>/scripts/align_words.py output/scene-timings.json --words output/word-timings.json --captions output/captions.ass`. If it reports `proportional_fallback`, treat captions as phrase-accurate, not word-verified.
- Plan 2-4 `reveal_beats` per slide tied to narration trigger phrases, with `start_seconds: null` until word alignment resolves them. Each beat records its trigger phrase, resolved start time, and visual change.
- Keep narration segment and scene order immutable after image generation unless the user approves a storyboard revision.
