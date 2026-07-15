import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { authorizeRequest } from "./lib/auth";
import {
  upscaleImageSchema,
  runUpscaleImage,
} from "./tools/upscale-image";
import {
  generateVoiceoverSchema,
  runGenerateVoiceover,
} from "./tools/generate-voiceover";

export class ExplainerMediaMcp extends McpAgent<Env> {
  server = new McpServer({
    name: "codex-explainer-media",
    version: "0.1.0",
  });

  async init(): Promise<void> {
    this.server.tool(
      "upscale_image",
      "Upscale a public image URL from 2x to 10x using Real-ESRGAN on Replicate.",
      upscaleImageSchema,
      async (input) => runUpscaleImage(this.env, input),
    );

    this.server.tool(
      "generate_voiceover",
      "Generate an AI voiceover with OpenAI TTS and store it in Cloudflare R2.",
      generateVoiceoverSchema,
      async (input) => runGenerateVoiceover(this.env, input),
    );
  }
}

const mcpHandler = ExplainerMediaMcp.serve("/mcp");

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "codex-explainer-media-mcp",
        tools: ["upscale_image", "generate_voiceover"],
      });
    }

    if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/")) {
      const denied = authorizeRequest(request, env);
      if (denied) return denied;
      return mcpHandler.fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
