# Codex Explainer Video Plugin

Turns a topic, script, article, or narration audio into a story-driven explainer video: one pixel-verified storyboard of at most 6 scenes, locked OpenAI voiceover per scene, word-focused karaoke captions, deterministic Remotion overlays, and local FFmpeg delivery.

```
source → essence/story → storyboard sheet(s) → upscale → canonicalize
       → per-scene voiceover ∥ (parallel with the above)
       → measured timings → word captions → Remotion overlays → FFmpeg finalize
```

## Prerequisites

- Codex installed and available from your terminal.
- FFmpeg installed and available as `ffmpeg` and `ffprobe`.
- Node.js and npm for videos that use animated shapes or essential text overlays.
- Python with `pydub` and `faster-whisper` for narration rhythm analysis and word alignment. Python 3.13+ also needs `audioop-lts`.
- A Codex workspace where generated video files can be saved.

Verify FFmpeg and install Python dependencies (run from the plugin root):

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

No local API keys or MCP server configuration are required for the published plugin — see [Media service](#media-service) below for the default endpoint and self-hosting.

## Quick start

```
codex plugin list
```

Confirm `codex-explainer-video-plugin` appears in the installed plugin list. In a new Codex task, try:

```text
Create an explainer video about how solar panels work. Use the default style and voice. Save it in this workspace.
```

The skills carry the story, geometry, and production rules — the prompt only needs to state topic, duration, and any style preferences.

## Media service

The plugin uses OpenAI voiceover through its bundled media service; it does not use ElevenLabs. By default `.mcp.json` points at the author's Cloudflare Worker (`explainer-video-media-mcp.gyan491.workers.dev`). This is third-party infrastructure — availability and quotas are not guaranteed. For production use, self-host:

```bash
cd mcp-server
cp .dev.vars.example .dev.vars   # set OPENAI_API_KEY and REPLICATE_API_TOKEN
npm install
npx wrangler deploy
```

Then point `.mcp.json`'s `url` at your deployed worker's `/mcp` endpoint. See `mcp-server/README.md` for local dev, R2 configuration, and secret management.

## Overlays and layout QA

Storyboard panels combine with editable Remotion overlays for diagrams, charts, equations, labels, counters, kinetic text, and transparent foreground cutouts. Overlays support explicit depth, anchored groups, and separate artwork/screen coordinate spaces so annotations follow camera motion while titles stay fixed. The default visual theme is an editorial paper-collage style (cream background, dark ink, warm and cool accents, Inter typography) — see `references/house-style.md` for the full direction and `references/overlay-storyboard.md` for the `theme` block.

Run the layout analyzer before the final Remotion render to catch text or filled shapes that collide with dense illustration detail:

```bash
node scripts/analyze-overlay-layout.mjs my-video/src/project.json --json my-video/output/layout-report.json
```

For smarter placement, add scene `objects`, anchored overlay `groups`, and element `intent` metadata to `project.json`, then run `npm run layout-fix` (moves colliding or auto-place text) and `npm run layout-stills` (renders a contact sheet at `output/qa/layout/layout-contact-sheet.png` for review before a full render).

A successful render leaves only the finalized `output/explainer-video.mp4`; the Remotion intermediate is kept only when finalization fails, for diagnosis.

## Troubleshooting

- **Windows ARM64:** run the bundled overlay template with x64 Node.js under Windows emulation — Remotion does not publish a native ARM64 compositor. The template preflight reports this before rendering. Set `REMOTION_BROWSER_EXECUTABLE` to override browser discovery for a custom Chrome or Edge path.
- **Word alignment unavailable:** if `faster-whisper` is not installed, `scripts/align_words.py` falls back to proportional phrase-level timing and reports it in `timing_source` — captions stay phrase-accurate but are not word-verified.

## Reinstall or update

```bash
codex plugin marketplace remove codex-explainer-video-plugin
codex plugin marketplace add Gyana491/codex-explainer-video-plugin
codex plugin add codex-explainer-video-plugin@codex-explainer-video-plugin
```

Then restart Codex and use a new task.
