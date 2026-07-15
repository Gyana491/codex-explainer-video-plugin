---
name: storyboard-director
description: Design the narration, timing, shot list, and master storyboard prompt for an explainer video before assets are generated. Use for storyboard planning or when a user wants scenes, visual prompts, and timing without immediately rendering the final video.
---

# Storyboard director

Create a production-ready storyboard package.

Return or save structured JSON with:

- title
- target_duration_seconds
- aspect_ratio
- fps
- visual_style
- narration
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

- Keep scene timing aligned with natural speech.
- Maintain one consistent art direction across all panels.
- Describe subjects, composition, background, lighting, and emotional purpose.
- Do not put essential copy inside the generated image.
- Include a master prompt that asks for a clean storyboard grid with equal panels and clear gutters.
- For vertical video, compose subjects so every panel survives a 9:16 crop.
