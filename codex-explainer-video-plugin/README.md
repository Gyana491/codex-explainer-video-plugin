# Explainer Video Studio Codex Plugin

A Codex plugin plus a Cloudflare-hosted MCP server for a storyboard explainer-video workflow.

## Architecture

```text
User request
  |
  v
Codex skill: create-explainer-video
  |
  +--> Codex built-in image generation
  |      Generates one master storyboard image
  |
  +--> Cloudflare MCP: upscale_image
  |      Replicate Real-ESRGAN, 2x to 10x
  |
  +--> Local workspace
  |      Download and split storyboard panels
  |
  +--> Cloudflare MCP: generate_voiceover
  |      OpenAI gpt-4o-mini-tts
  |      Audio stored in Cloudflare R2
  |
  +--> Local FFmpeg
         Motion, scene stitching, captions, audio, MP4
```

The MCP server intentionally exposes only two tools:

1. `upscale_image`
2. `generate_voiceover`

Storyboard creation, scene planning, image generation, cropping, and video rendering stay in Codex skills and the local project workspace.

## Repository layout

```text
.
├── .codex-plugin/
│   └── plugin.json
├── .agents/
│   └── plugins/
│       └── marketplace.json
├── skills/
│   ├── create-explainer-video/
│   │   └── SKILL.md
│   ├── storyboard-director/
│   │   └── SKILL.md
│   └── render-storyboard-video/
│       └── SKILL.md
├── scripts/
│   ├── download-asset.mjs
│   └── split-grid.mjs
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── lib/
│   │   ├── auth.ts
│   │   └── http.ts
│   ├── services/
│   │   ├── openai.ts
│   │   └── replicate.ts
│   └── tools/
│       ├── generate-voiceover.ts
│       └── upscale-image.ts
├── .mcp.json
├── .dev.vars.example
├── package.json
├── tsconfig.json
├── worker-configuration.d.ts
└── wrangler.jsonc
```

## 1. Install

```bash
pnpm install
cp .dev.vars.example .dev.vars
```

Fill in:

```env
OPENAI_API_KEY=...
REPLICATE_API_TOKEN=...
MCP_API_KEY=...
```

## 2. Create the R2 bucket

```bash
pnpm wrangler r2 bucket create codex-explainer-media
```

Expose the bucket through an R2 custom domain or another public delivery Worker, then replace:

```json
"PUBLIC_MEDIA_BASE_URL": "https://media.example.com"
```

in `wrangler.jsonc`.

The TTS tool stores generated audio in R2 and returns the public URL. The public base URL must map URL paths directly to R2 object keys.

## 3. Local development

```bash
pnpm dev
```

MCP endpoint:

```text
http://localhost:8787/mcp
```

Health endpoint:

```text
http://localhost:8787/health
```

Test with MCP Inspector:

```bash
npx @modelcontextprotocol/inspector@latest
```

Connect to `http://localhost:8787/mcp` and provide:

```text
Authorization: Bearer <MCP_API_KEY>
```

## 4. Deploy to Cloudflare

Store secrets:

```bash
pnpm wrangler secret put OPENAI_API_KEY
pnpm wrangler secret put REPLICATE_API_TOKEN
pnpm wrangler secret put MCP_API_KEY
```

Deploy:

```bash
pnpm deploy
```

The production endpoint is:

```text
https://explainer-video-media-mcp.gyan491.workers.dev/mcp
```

## 5. Configure the plugin MCP token

The plugin marketplace uses `policy.authentication: "ON_INSTALL"`, so installation in the Codex app asks for the MCP bearer key. Enter the same secret stored in the Worker as `MCP_API_KEY`. Codex stores it for the plugin as `EXPLAINER_MCP_API_KEY`, the environment variable referenced by `.mcp.json`.

For command-line development, set the same environment variable manually:

```bash
export EXPLAINER_MCP_API_KEY="<same value as MCP_API_KEY>"
```

The supplied `.mcp.json` uses:

```json
{
  "url": "https://...workers.dev/mcp",
  "transport": "streamable_http",
  "bearer_token_env_var": "EXPLAINER_MCP_API_KEY"
}
```

## 6. Install the plugin locally

This repository includes a local marketplace file under:

```text
.agents/plugins/marketplace.json
```

Add `codex-explainer-video-plugin` as a local marketplace, then open Plugins and install **Explainer Video Studio**. Codex app installation should request the Explainer MCP API key before enabling the plugin. The CLI installer does not provide the same credential form, so CLI users must set `EXPLAINER_MCP_API_KEY` in their environment.

During development, the built-in `$plugin-creator` can also scaffold or refresh the local marketplace registration.

## 7. Use

Examples:

```text
Use Explainer Video Studio to make a 40-second vertical explainer video about product-led growth.
```

```text
Use storyboard-director to create an eight-scene storyboard for this script.
```

```text
Use render-storyboard-video with assets/storyboard.png and narration.txt.
```

## Real-ESRGAN note

The default Replicate model is configured as:

```text
juergengunz/real-esrgan-v2
```

Its input names can change if the model owner publishes a new schema. Confirm the current Replicate API schema before production deployment. If needed, change `REPLICATE_MODEL` and the request fields in `src/services/replicate.ts`.

## Security

The example uses a shared bearer token because it is simple and suitable for private development. Before publishing broadly:

- replace shared-token access with OAuth,
- add per-user quotas,
- rate-limit costly tools,
- validate allowed source-image hosts,
- record prediction and TTS usage,
- add abuse controls,
- set R2 retention or cleanup policies.

## Important disclosure

OpenAI requires end users to be clearly told that generated TTS audio is AI-generated. The MCP tool returns this reminder with every generated voiceover.
