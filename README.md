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
Create a 4-minute, story-driven whiteboard explainer presentation about how solar panels work. Use 2-3 slides per minute. Keep a consistent editorial whiteboard theme: warm off-white grid paper, confident black hand-drawn outlines, light-gray pencil hatching, sparse pink accents, rounded content frames, oversized headlines, simple diagrams, and one recurring guide character. Include concise on-slide text and synchronize 2-4 progressive draw-on reveal beats within each slide to the voiceover. Arrange every exact 16:9 slide panel inside one exact 4:3 master storyboard using the calculated proportional grid.
```

## Reinstall or update

To refresh the marketplace registration and reinstall the latest published version, run:

```bash
codex plugin marketplace remove codex-explainer-video-plugin
codex plugin marketplace add Gyana491/codex-explainer-video-plugin
codex plugin add codex-explainer-video-plugin@codex-explainer-video-plugin
```

Then restart Codex and use a new task.
