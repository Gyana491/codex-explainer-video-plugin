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

function unauthorized(): Response {
	return Response.json(
		{
			error: "Unauthorized",
			message: "Provide a valid bearer token.",
		},
		{
			status: 401,
			headers: { "WWW-Authenticate": "Bearer" },
		},
	);
}

function serverAuthMisconfigured(): Response {
	return Response.json(
		{ error: "Server authentication is not configured" },
		{ status: 500 },
	);
}

function authorizeRequest(request: Request, env: Env): Response | null {
	if (!env.MCP_API_KEY) return serverAuthMisconfigured();

	const authorization = request.headers.get("Authorization");
	if (!authorization?.startsWith("Bearer ")) return unauthorized();

	const provided = new TextEncoder().encode(authorization.slice(7));
	const expected = new TextEncoder().encode(env.MCP_API_KEY);
	if (provided.byteLength !== expected.byteLength) return unauthorized();

	return crypto.subtle.timingSafeEqual(provided, expected) ? null : unauthorized();
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
			const denied = authorizeRequest(request, env);
			if (denied) return denied;
			return createMcpHandler(createServer(env))(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
