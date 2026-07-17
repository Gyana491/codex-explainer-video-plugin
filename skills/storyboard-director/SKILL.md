---
name: storyboard-director
description: Design narration, audio-aware timing, shot lists, essential on-screen text, deterministic shape-animation overlays, and master storyboard prompts for explainer videos before rendering. Use for storyboard planning or when the user wants scenes, visual prompts, motion-graphic cues, and timing without immediately rendering the final video.
---

# Storyboard director

Create a production-ready storyboard package. Read [the overlay contract](../../references/overlay-storyboard.md) whenever any scene needs exact text, shapes, charts, diagrams, or equations.

Return or save structured JSON with:

- title
- target duration and aspect ratio
- fps
- visual and narration styles
- narration
- measured or estimated voiceover duration
- scene-count rationale
- storyboard grid and master image prompt
- scenes

For every scene, provide:

- ID, start, end, and duration in seconds
- narration segment
- visual description and emotional purpose
- background camera motion and transition
- crop panel
- overlay strategy
- essential text, shapes, and animation cues when needed

## Direction rules

- Open with a direct hook, establish why the topic matters, explain one idea at a time, and end with a concise takeaway.
- Use natural, conversational narration with short sentences. Keep production directions out of spoken text.
- Derive scene count from meaningful visual beats and voiceover pauses. Use no more than 24 scenes or 8 minutes.
- When audio exists, measure it and align scene boundaries to it. Otherwise mark duration as estimated.
- Maintain one art direction across every storyboard panel.
- Make every source panel an exact 16:9 landscape frame with identical dimensions and clear gutters. Keep subjects safe for a centered 9:16 crop when output is vertical.
- Never place essential copy, labels, numbers, charts, equations, or citations inside generated artwork. Put exact information in deterministic overlays.
- Use `artwork-only` when the image communicates the idea without exact information.
- Use kinetic text only for a short term, contrast, or takeaway—not as a transcript.
- Prefer diagrams for process or cause-and-effect, charts for quantities, and equations for mathematical relationships.
- Keep essential text to 1-6 words per element when possible and no more than two simultaneous blocks, excluding captions.
- Give each animated overlay a stable ID and deterministic `startProgress`. Preserve a matching narration `triggerPhrase` as metadata.
- Use no more than five animation cues per scene unless additional cues are necessary for comprehension.

Run the bundled validator against the final overlay project JSON before handing it to the renderer:

```powershell
node ../../scripts/validate-overlay-storyboard.mjs <project.json>
```
