---
name: storyboard-director
description: Design the narration, timing, shot list, and master storyboard prompt for an explainer video before assets are generated. Use for storyboard planning or when a user wants scenes, visual prompts, and timing without immediately rendering the final video.
---

# Storyboard director

Create a production-ready storyboard package.

Return or save structured JSON with:

- title
- target_duration
- duration_unit
- aspect_ratio
- fps
- visual_style
- narration_style
- narration
- voiceover_duration_seconds
- scene_count_rationale
- storyboard_grid
- master_prompt
- scenes

Each scene must include:

- scene_number
- start_seconds
- end_seconds
- narration_segment
- visual_description
- camera_motion
- transition
- crop_panel

Rules:

- Write narration in the style of a polished YouTube explainer: open with a clear hook, establish why the topic matters, explain one idea at a time, and finish with a concise takeaway.
- Use plain, conversational language, short sentences, and as few words as necessary. Prefer familiar words over jargon and define any technical term immediately.
- Make the script sound natural when spoken aloud. Do not include headings, stage directions, scene labels, or production notes in the voiceover text.
- Remove filler, repetition, exaggerated claims, and unnecessary calls to action unless the user requests them.
- Accept durations in seconds or minutes, up to a hard maximum of 8 minutes.
- Use second-based scene timestamps for precise narration alignment and rendering, even when the overall duration is expressed in minutes.
- Derive the scene count from the script's distinct visual beats and the supplied or measured voiceover duration. Do not select a fixed or preferred scene count merely from the requested total duration.
- When voiceover audio is available, measure its actual duration and use it to set scene boundaries. Otherwise, estimate duration from the final narration and identify the value as an estimate.
- Use no more than 24 scenes. If the script contains more than 24 visual beats, combine closely related beats without dropping essential narration.
- Keep scene timing aligned with natural speech.
- Maintain one consistent art direction across all panels.
- Describe subjects, composition, background, lighting, and emotional purpose.
- Do not put essential copy inside the generated image.
- Set `storyboard_grid.panel_aspect_ratio` to `16:9` and include the intended rows, columns, and panel count.
- Require every scene panel inside the master storyboard to be an exact 16:9 landscape frame with identical dimensions, straight boundaries, and clear gutters. Do not accept approximate, square, portrait, or mixed-ratio panels.
- Include a master prompt that states the exact panel count and grid layout and repeats that every individual panel must be 16:9.
- Keep all important subjects and action inside each panel's 16:9 safe area.
- Verify that each panel's pixel dimensions satisfy `width * 9 = height * 16`. Regenerate a malformed storyboard instead of stretching its panels.
- Treat `aspect_ratio` as the final video ratio. When the final output is vertical, compose each 16:9 source panel so its important content also survives a centered 9:16 crop.
