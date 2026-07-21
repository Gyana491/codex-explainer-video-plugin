---
name: storyboard-director
description: Plan a production-ready explainer storyboard from any source — essence, story engine, narration, slide plan, master prompt, and timing scaffolding. Use for source-to-explainer planning without immediately rendering the final video.
---

# Storyboard director

**Step 0 — before anything else, read all three:** `../../references/story-rules.md` (essence, story engine, narration, slide craft), `../../references/house-style.md` (default visual direction — do not improvise a style), `../../references/master-prompt-template.md` (the exact image prompt to build — do not improvise one). Read `../../references/overlay-storyboard.md` when any scene needs exact text, shapes, charts, diagrams, equations, or cutouts.

## Outputs

Return or save structured JSON with these top-level fields: `title`, `target_duration`, `duration_unit`, `aspect_ratio`, `fps`, `visual_style`, `narration_style`, `source_essence`, `source_essence_file`, `story_engine`, `narration`, `production_sequence`, `voiceover_duration_seconds`, `timing_source`, `audio_analysis_file`, `word_timing_file`, `caption_file`, `caption_style`, `scene_count_rationale`, `storyboard_grid`, `average_scene_duration_seconds`, `theme_bible`, `master_prompt`, `overlay_contract`, `scenes`.

**Required** per-scene fields: `scene_number`, `narration_segment`, `visual_description`, `start_seconds`, `end_seconds`, `duration_seconds`, `timing_source`, `crop_panel`, `camera_motion`, `transition`, `overlay_strategy`, `on_slide_text`, `text_zones`, `caption_safe_area`, `reveal_beats`; add `overlay_elements` and `animation_cues` whenever `overlay_strategy` is not `artwork-only`.

`text_zones` records the empty regions the image prompt reserved for this scene, each as `{x, y, width, height}` normalized 0-1: `title`, `caption`, and any `labels` (one entry per planned label, keyed to its target). These become the deterministic overlay's coordinates — do not invent overlay positions independently of what the artwork actually left blank.

Story-craft fields (`story_role`, `story_beat`, `cause_from_previous`, `question_opened_or_answered`, `setup_or_payoff`, `emotional_shift`, `visual_callback`, `clear_idea`, `visual_story_map`, `composition_signature`, `text_layout`, `character_action`, `layout`) are planning aids — include them when they help you write better slides, but no downstream script or validator reads them. Do not treat them as required output.

## Process

1. **Essence** → `output/source-essence.json`. Rules: `story-rules.md` § Source essence.
2. **Story engine + narration.** Rules: `story-rules.md` § Story engine and § Narration. Set `timing_source: estimated_pre_audio` on the top level and every scene until voiceover is measured.
3. **Slide plan. Hard cap: at most 6 scenes, minimum 3.** No target video length — duration follows however long the narration needs. Split or combine narration beats until the scene count fits 3-6 based on meaningful visual ideas, never by rushing the cadence to hit a duration target.
   - Record the chosen count and the reasoning (why each scene earns its place) in `scene_count_rationale`.
   - Give every scene 2-5 `reveal_beats` (mandatory) so it never sits static — see step 6 below.
   - Apply `story-rules.md` § Slide craft to every scene, including its `text_zones`.
4. **Grid.** With 3-6 scenes, always one sheet: pick the layout that maximizes panel size — 3x2 for 5-6 scenes, 2x2 for 4, 3x1 for 3. Record your choice in `storyboard_grid` (`master_aspect_ratio: "4:3"`, `panel_aspect_ratio: "16:9"`, `canvas_width`, `canvas_height`, `rows`, `columns`, `scene_count`, `cell_count`, `unused_cell_count`, `outer_padding`, `gutter`, `panel_width`, `panel_height`, `reading_order: "row-major"`). `scripts/canonicalize_storyboard.py` recomputes this exactly during production — your figures only drive the image prompt and grid choice.
   - Only if the user explicitly asks for more than 6 scenes: plan chunked sheets per `../../references/master-prompt-template.md` § Chunked sheets.
5. **Cutouts (optional).** If a character or object recurs across scenes, plan one chroma-key asset tray per `house-style.md` § Cutout tray instead of redrawing it per scene. Record each cutout's id, description, and chroma color; list which scenes reference it via `overlay_elements`.
6. **Master prompt.** Build from `../../references/master-prompt-template.md`, using the house style block from `../../references/house-style.md` unless the user requests another style. Every scene description must state its reserved zones with position and purpose (feeds `text_zones`). Set `overlay_contract` to `references/overlay-storyboard.md`.
7. **Production sequence.** Set `production_sequence` to this exact order: `plan_storyboard`, `generate_master_draft`, `upscale_master_draft`, `extract_scene_candidates`, `canonicalize_master_geometry`, `verify_master_and_scenes`, `finish_scene_text`, `generate_per_scene_voiceovers`, `measure_and_concatenate_audio`, `generate_word_level_captions`, `stitch_video`.

## Timing rules

- Before any voiceover exists, `timing_source` is `estimated_pre_audio` everywhere and scene/reveal-beat timestamps are provisional.
- Generate exactly one voiceover per scene, in order, with one locked voice/model/format/language/delivery configuration saved to `output/voice-config.json` before the first call. Never generate one monolithic voiceover for the whole narration — that path exists only for user-supplied narration audio.
- Measure every clip with FFprobe, concatenate without gaps or overlaps, and replace every timestamp with cumulative measured durations using `timing_source: per_scene_audio`. Never derive timing from a fixed or estimated duration once audio exists.
- Generate captions only after all scene audio is final: run `python <plugin-root>/scripts/align_words.py output/scene-timings.json --words output/word-timings.json --captions output/captions.ass`. If it reports `proportional_fallback`, treat captions as phrase-accurate, not word-verified.
- Every slide's 2-5 `reveal_beats` (mandatory, see step 3) are tied to narration trigger phrases, with `start_seconds: null` until word alignment resolves them. Each beat records its trigger phrase, resolved start time, and visual change.
- Keep narration segment and scene order immutable after image generation unless the user approves a storyboard revision.
