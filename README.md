# Codex Explainer Video Plugin

## Prerequisites

Before installing the plugin, make sure you have:

- Codex installed and available from your terminal.
- FFmpeg installed and available as `ffmpeg` and `ffprobe`.
- Node.js and npm for videos that use animated shapes or essential text overlays.
- Python with `pydub` for narration rhythm analysis. Python 3.13+ also needs `audioop-lts`.
- A Codex workspace where generated video files can be saved.

Verify FFmpeg:

```bash
ffmpeg -version
ffprobe -version
python3 -m pip install -r requirements-audio.txt
```

## Install the plugin

Run these commands in order:

```bash
codex plugin marketplace remove codex-explainer-video-plugin
codex plugin marketplace add Gyana491/codex-explainer-video-plugin
codex plugin add codex-explainer-video-plugin@codex-explainer-video-plugin
```

The first command removes an older marketplace registration. If Codex reports that the marketplace is not installed, continue with the next command.

## Finish setup

1. Close and reopen Codex after the installation completes.
2. Start a new Codex task so the plugin's skills and media tools are loaded.
3. Open or create a writable workspace for the generated storyboard, audio, and video files.
4. Confirm that FFmpeg is available in the same environment where Codex is running.

No local API keys or MCP server configuration are required for the published plugin.

The plugin uses OpenAI voiceover through its bundled media service; it does not use ElevenLabs. Storyboard panels can be combined with editable Remotion overlays for diagrams, charts, equations, labels, counters, and kinetic text. FFmpeg remains the final media-processing layer.

Overlay projects include a fast visual layout analyzer. Run it before the final Remotion render to catch text or filled shapes that collide with dense illustration detail:

```bash
npm run layout-check
```

The same checker can be run from the plugin root against an existing generated project:

```bash
node scripts/analyze-overlay-layout.mjs my-video/src/project.json --json my-video/output/layout-report.json
```

For smarter placement, add scene `objects` and per-text `intent` metadata in `project.json`, then run:

```bash
npm run layout-fix
npm run layout-stills
```

`layout-fix` can move text with collisions or `intent.autoPlace: true`; `layout-stills` renders a quick contact sheet at `output/qa/layout/layout-contact-sheet.png` for review before a full MP4 render.

A successful render leaves only the finalized `output/explainer-video.mp4`. The larger Remotion intermediate is retained only when finalization fails, so it remains available for diagnosis without accumulating duplicate deliverables.

On Windows ARM64, run the bundled overlay template with x64 Node.js under Windows emulation because Remotion does not publish its native compositor for that architecture. The template preflight reports this clearly before rendering. Set `REMOTION_BROWSER_EXECUTABLE` to override browser discovery when a custom Chrome or Edge path is needed.

## Verify the installation

```bash
codex plugin list
```

Confirm that `codex-explainer-video-plugin` appears in the installed plugin list.

In a new Codex task, try:

```text
Create a 4-minute, story-driven whiteboard explainer presentation about how solar panels work. First extract the source's central idea, 3-5 essential supporting points, evidence, meaningful qualifications, likely misconception, and final takeaway. Choose the simplest truthful narrative spine and define an audience proxy, starting state, goal, stakes, obstacle, midpoint turning point, payoff, emotional arc, recurring visual motif, open loops, and callbacks. Make every scene cause the next through a complication, question, consequence, or discovery; avoid an “and then” list of facts, close every open loop, and return visual callbacks with changed meaning. Rewrite the essence as a simple, relatable story anyone can understand without inventing unsupported claims or manufactured drama. Use 5-6 slides per minute and make each slide communicate one clear idea within two seconds. Use distinct, uncrowded compositions with characters and illustrative objects while reserving clear areas for deterministic arrows, diagrams, charts, titles, labels, equations, and exact values. Use handwritten-style overlays with orange only for important words, arrows, outcomes, underlines, highlights, and sparse emphasis marks; never place text over faces, hands, screens, or detailed artwork. Treat any supplied visual reference as broad inspiration only and never copy its exact layout, characters, typography, colors, or objects. Make exactly one image-generation call containing every scene and the full hard geometry contract; never generate a retry, correction, replacement, or alternate. Then upscale that single contact sheet, extract its scene artwork, and use fast local processing to rebuild a pixel-verified 4:3 landscape master whose populated and blank slots are all exact 16:9. Finish every scene, generate one separate voiceover file per scene using the same locked voice configuration, measure and concatenate those clips, generate word-level karaoke captions, render editable Remotion overlays, then stitch the final video. Synchronize 2-4 progressive reveal beats within each slide to the measured per-scene voiceover, and keep a short caption phrase visible while highlighting the currently spoken word in orange. Reject any master, populated slot, blank slot, exported scene, or overlay project that fails its validator without making another image-generation call.
```

## Reinstall or update

To refresh the marketplace registration and reinstall the latest published version, run:

```bash
codex plugin marketplace remove codex-explainer-video-plugin
codex plugin marketplace add Gyana491/codex-explainer-video-plugin
codex plugin add codex-explainer-video-plugin@codex-explainer-video-plugin
```

Then restart Codex and use a new task.
