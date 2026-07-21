import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Replicate, { type FileOutput } from "replicate";
import { z } from "zod";
import { saveToR2 } from "../storage";

const REPLICATE_MODEL = "nightmareai/real-esrgan";

const imageInputSchema = z.string().min(1).refine(isSupportedImageInput, {
	message: "Expected an HTTP(S) image URL or a base64 data URI such as data:image/png;base64,...",
});

export function registerUpscaleImage(server: McpServer, env: Env): void {
	server.registerTool(
		"upscale_image",
		{
			description:
				"Upscale an existing storyboard or scene image with Real-ESRGAN. imageUrl accepts an HTTP(S) URL or a base64 image data URI (URL strongly preferred; data URIs are a last resort). Choose the smallest scale that brings each grid panel to roughly 1920px wide: scale = ceil((1920 * columns) / masterWidth), clamped to 2-10. Keep faceEnhance false for illustrations. The result is saved to R2.",
			inputSchema: {
				imageUrl: imageInputSchema,
				scale: z.number().min(2).max(10).default(4),
				faceEnhance: z.boolean().default(false),
				filename: z.string().max(100).optional(),
			},
		},
		async ({ imageUrl, scale, faceEnhance, filename }) => {
			try {
				const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
				const image = toReplicateImageInput(imageUrl);
				let predictionId: string | undefined;
				const output = await replicate.run(
					REPLICATE_MODEL,
					{
						input: {
							image,
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
					...(isImageDataUri(imageUrl) ? {} : { sourceImageUrl: imageUrl }),
					sourceImageType: isImageDataUri(imageUrl) ? "data-uri" : "url",
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

function isSupportedImageInput(value: string): boolean {
	if (isImageDataUri(value)) {
		const base64 = value.slice(value.indexOf(",") + 1);
		return (
			base64.length > 0 && base64.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(base64)
		);
	}

	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

function isImageDataUri(value: string): boolean {
	return /^data:image\/(?:png|jpeg|webp);base64,/i.test(value);
}

function toReplicateImageInput(value: string): string | Blob {
	if (!isImageDataUri(value)) return value;

	const commaIndex = value.indexOf(",");
	const contentType = value.slice(5, value.indexOf(";"));
	const binary = atob(value.slice(commaIndex + 1));
	const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

	return new Blob([bytes], { type: contentType });
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
