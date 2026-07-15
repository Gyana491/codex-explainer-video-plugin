import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Replicate, { type FileOutput } from "replicate";
import { z } from "zod";
import { saveToR2 } from "../storage";

const REPLICATE_MODEL = "nightmareai/real-esrgan";

export function registerUpscaleImage(server: McpServer, env: Env): void {
	server.registerTool(
		"upscale_image",
		{
			description:
				"Upscale an existing storyboard or scene image with Real-ESRGAN. Keep faceEnhance false for illustrations and storyboards. The result is saved to R2.",
			inputSchema: {
				imageUrl: z.string().url(),
				scale: z.number().min(2).max(10).default(10),
				faceEnhance: z.boolean().default(false),
				filename: z.string().max(100).optional(),
			},
		},
		async ({ imageUrl, scale, faceEnhance, filename }) => {
			try {
				const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
				let predictionId: string | undefined;
				const output = await replicate.run(
					REPLICATE_MODEL,
					{
						input: {
							image: imageUrl,
							scale,
							face_enhance: faceEnhance,
						},
					},
					(prediction) => {
						predictionId = prediction.id;
					},
				);

				const file = getFileOutput(output);
				const imageResponse = await fetch(file.url());

				if (!imageResponse.ok) {
					throw new Error(
						`Could not download the Replicate result (HTTP ${imageResponse.status}).`,
					);
				}

				const contentType =
					imageResponse.headers.get("content-type")?.split(";")[0] || "image/png";
				const asset = await saveToR2(env, imageResponse, {
					folder: "upscaled-images",
					filename,
					extension: imageExtension(contentType),
					contentType,
				});

				return jsonResult({
					success: true,
					sourceImageUrl: imageUrl,
					upscaledImageUrl: asset.url,
					key: asset.key,
					predictionId,
					scale,
					faceEnhance,
				});
			} catch (error) {
				return toolError(error);
			}
		},
	);
}

function getFileOutput(output: object): FileOutput {
	const file = Array.isArray(output) ? output[0] : output;
	if (
		typeof file === "object" &&
		file !== null &&
		"url" in file &&
		typeof file.url === "function"
	) {
		return file as FileOutput;
	}

	throw new Error("Replicate completed without an image file.");
}

function imageExtension(contentType: string): string {
	if (contentType === "image/jpeg") return "jpg";
	if (contentType === "image/webp") return "webp";
	return "png";
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
				text: error instanceof Error ? error.message : "Image upscaling failed.",
			},
		],
	};
}
