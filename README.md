# Codex Explainer Video Plugin

## Prerequisites

Before installing the plugin, make sure you have:

- Codex installed and available from your terminal.
- FFmpeg installed and available as `ffmpeg` and `ffprobe`.
- A Codex workspace where generated video files can be saved.

Verify FFmpeg:

```bash
ffmpeg -version
ffprobe -version
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
Create a 4-minute explainer video about how solar panels work. Use enough scenes for frequent visual changes, and place every exact 16:9 scene panel inside one exact 16:9 master storyboard.
```

## Reinstall or update

To refresh the marketplace registration and reinstall the latest published version, run:

```bash
codex plugin marketplace remove codex-explainer-video-plugin
codex plugin marketplace add Gyana491/codex-explainer-video-plugin
codex plugin add codex-explainer-video-plugin@codex-explainer-video-plugin
```

Then restart Codex and use a new task.
