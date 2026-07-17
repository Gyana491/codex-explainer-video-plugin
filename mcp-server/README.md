# Explainer Video Media MCP

A small, stateless Cloudflare MCP server with two tools:

- `upscale_image` accepts an HTTP(S) image URL or a base64 image data URI, upscales it with Replicate, and stores it in R2.
- `generate_voiceover` creates narration with OpenAI TTS and stores it in R2.

## Local setup

Copy `.dev.vars.example` to `.dev.vars` and add your API keys and Replicate model version. Then update `PUBLIC_MEDIA_BASE_URL` in `wrangler.jsonc` to the public domain connected to the R2 bucket.

```bash
npm install
npm run cf-typegen
npm run dev
```

The MCP endpoint is `/mcp`. A simple health check is available at `/health`.

API keys belong in `.dev.vars` locally and in Wrangler secrets in production. Do not put them in `wrangler.jsonc`.
