import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler } from "agents/mcp";
import { registerGenerateVoiceover } from "./tools/generate-voiceover";
import { registerUpscaleImage } from "./tools/upscale-image";

function createServer(env: Env): McpServer {
	const server = new McpServer({
		name: "explainer-video-media",
		version: "0.1.0",
	});

	registerUpscaleImage(server, env);
	registerGenerateVoiceover(server, env);

	return server;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/health") {
			return Response.json({
				ok: true,
				service: "explainer-video-media",
				tools: ["upscale_image", "generate_voiceover"],
			});
		}

		if (url.pathname === "/mcp") {
			return createMcpHandler(createServer(env))(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
