# Codex Explainer Video Plugin

## Prerequisites

Before installing the plugin, make sure you have:

- Codex installed and available from your terminal.
- FFmpeg installed and available as `ffmpeg` and `ffprobe`.
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

## Verify the installation

```bash
codex plugin list
```

Confirm that `codex-explainer-video-plugin` appears in the installed plugin list.

In a new Codex task, try:

```text
Create a 4-minute, story-driven whiteboard explainer presentation about how solar panels work. First extract the source's central idea, 3-5 essential supporting points, evidence, meaningful qualifications, likely misconception, and final takeaway. Choose the simplest truthful narrative spine and define an audience proxy, starting state, goal, stakes, obstacle, midpoint turning point, payoff, emotional arc, recurring visual motif, open loops, and callbacks. Make every scene cause the next through a complication, question, consequence, or discovery; avoid an “and then” list of facts, close every open loop, and return visual callbacks with changed meaning. Rewrite the essence as a simple, relatable story anyone can understand without inventing unsupported claims or manufactured drama. Use 5-6 slides per minute and make each slide communicate one clear idea within two seconds. Use distinct, uncrowded compositions with arrows, paths, diagrams, process flows, charts, characters, text, and objects. Add an exact handwritten title, nearby object labels, and short annotations directly inside every scene; keep titles in empty space, usually top-left, and never place text over faces, hands, screens, or detailed artwork. Use orange only for important words, arrows, outcomes, underlines, highlights, and sparse emphasis marks. Treat any supplied visual reference as broad inspiration only and never copy its exact layout, characters, typography, colors, or objects. Make exactly one image-generation call containing every scene and the full hard geometry contract; never generate a retry, correction, replacement, or alternate. Then upscale that single contact sheet, extract its scene artwork, and use fast local processing to rebuild a pixel-verified 9:16 master whose populated and blank slots are all exact 16:9. Finish every scene, generate one separate voiceover file per scene using the same locked voice configuration, measure and concatenate those clips, generate word-level karaoke captions, then stitch the final video. Synchronize 2-4 progressive draw-on reveal beats within each slide to the measured per-scene voiceover, and keep a short caption phrase visible while highlighting the currently spoken word in orange. Reject any master, populated slot, blank slot, or exported scene that fails its exact integer aspect-ratio equation without making another image-generation call.
```

## Reinstall or update

To refresh the marketplace registration and reinstall the latest published version, run:

```bash
codex plugin marketplace remove codex-explainer-video-plugin
codex plugin marketplace add Gyana491/codex-explainer-video-plugin
codex plugin add codex-explainer-video-plugin@codex-explainer-video-plugin
```

Then restart Codex and use a new task.
