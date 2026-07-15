import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import OpenAI from "openai";
import { z } from "zod";
import { saveToR2 } from "../storage";

const voices = [
	"alloy",
	"ash",
	"ballad",
	"coral",
	"echo",
	"fable",
	"nova",
	"onyx",
	"sage",
	"shimmer",
	"verse",
	"marin",
	"cedar",
] as const;

const formats = ["mp3", "wav", "aac", "flac", "opus"] as const;

const contentTypes: Record<(typeof formats)[number], string> = {
	mp3: "audio/mpeg",
	wav: "audio/wav",
	aac: "audio/aac",
	flac: "audio/flac",
	opus: "audio/opus",
};

export function registerGenerateVoiceover(server: McpServer, env: Env): void {
	const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

	server.registerTool(
		"generate_voiceover",
		{
			description:
				"Generate a voiceover after the narration is finalized, save it to R2, and return a stable public URL.",
			inputSchema: {
				text: z.string().min(1).max(4096),
				voice: z.enum(voices).default("marin"),
				instructions: z.string().max(1000).optional(),
				format: z.enum(formats).default("mp3"),
				filename: z.string().max(100).optional(),
			},
		},
		async ({ text, voice, instructions, format, filename }) => {
			try {
				const response = await openai.audio.speech.create({
					model: env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
					input: text,
					voice,
					instructions,
					response_format: format,
				});

				const asset = await saveToR2(env, response, {
					folder: "voiceovers",
					filename,
					extension: format,
					contentType: contentTypes[format],
				});

				return jsonResult({
					success: true,
					voiceoverUrl: asset.url,
					key: asset.key,
					voice,
					format,
					contentType: asset.contentType,
					bytes: asset.bytes,
					aiGeneratedDisclosure: "This narration was generated using an AI voice.",
				});
			} catch (error) {
				return toolError(error);
			}
		},
	);
}

function jsonResult(value: unknown) {
	return {
		content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
	};
}

function toolError(error: unknown) {
	return {
		isError: true,
		content: [
			{
				type: "text" as const,
				text: error instanceof Error ? error.message : "Voiceover generation failed.",
			},
		],
	};
}
