# Whiteboard-inspired visual direction

Default visual style unless the user explicitly requests another. Applies to both planning (`storyboard-director`) and the image-generation prompt (`master-prompt-template.md`'s `{STYLE_AND_CONTINUITY_RULES}`).

- Treat any supplied reference image as inspiration for visual language only. Never reproduce its exact layout, characters, objects, wording, typeface, palette, or decorative placements.
- Create an original whiteboard presentation system suited to the topic: clean paper-like space, hand-drawn line art, simple diagrams, expressive characters, editorial hierarchy, restrained orange emphasis.
- Choose a bright white or warm off-white background; use a subtle grid, dots, paper grain, or no pattern according to the story.
- Draw characters, arrows, icons, diagrams, charts, and objects as clean hand-sketched dark line art with confident outlines. Use optional light pencil hatching or marker texture sparingly.
- Use warm orange as the only accent color. Reserve it for important words, arrows, selected outcomes, underlines, highlights, and a few emphasis marks; keep all other artwork and text black, white, or neutral gray.
- Use generous negative space, a strong headline zone, simple containers when useful, and one clear left-to-right or top-to-bottom visual path per slide. Vary composition from slide to slide without losing the shared theme.
- Keep every named recurring character identical across slides: face, hair, clothing, body proportions, line treatment.
- Use hand-drawn arrows, gears, charts, magnifiers, people, sticky-note shapes, and topic-specific icons instead of realistic environments to turn abstract narration into a visible explanation.
- Avoid photorealism, 3D rendering, glossy UI, gradients, saturated multicolor palettes, painterly textures, stock-photo elements, dense backgrounds, messy marker scrawls, comic panels, and heavy soft shadows.
- Treat this as polished original whiteboard explainer art — not a replica of any reference, a classroom board, a comic page, or a rough first draft.

## Remotion overlay theme

The bundled template's default `theme` matches this direction: paper background `#F7F3E8`, ink `#1F2937`, accent `#F97316`, handwritten font stack. See `overlay-storyboard.md` for the `theme` block; only override it when the user requests a different visual direction.
