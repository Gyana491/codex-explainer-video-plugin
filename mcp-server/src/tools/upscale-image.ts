import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { saveToR2 } from "../storage";

const REPLICATE_MODEL = "juergengunz/real-esrgan-v2";

type Prediction = {
	id: string;
	status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
	output?: string | string[] | null;
	error?: string | null;
	urls?: { get?: string };
};

type ReplicateModel = {
	latest_version?: { id?: string } | null;
};

export function registerUpscaleImage(server: McpServer, env: Env): void {
	server.registerTool(
		"upscale_image",
		{
			description:
				"Upscale an existing storyboard or scene image with Real-ESRGAN. Keep faceEnhance false for illustrations and storyboards. The result is saved to R2.",
			inputSchema: {
				imageUrl: z.string().url(),
				scale: z.number().int().min(2).max(10).default(10),
				faceEnhance: z.boolean().default(false),
				filename: z.string().max(100).optional(),
			},
		},
		async ({ imageUrl, scale, faceEnhance, filename }) => {
			try {
				let prediction = await createPrediction(env, imageUrl, scale, faceEnhance);

				if (prediction.status !== "succeeded") {
					prediction = await waitForPrediction(env, prediction);
				}

				if (prediction.status !== "succeeded") {
					throw new Error(
						prediction.error || `Replicate ended with ${prediction.status}.`,
					);
				}

				const temporaryUrl = getOutputUrl(prediction.output);
				const imageResponse = await fetch(temporaryUrl, {
					headers: { Authorization: `Bearer ${env.REPLICATE_API_TOKEN}` },
				});

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
					predictionId: prediction.id,
					scale,
					faceEnhance,
				});
			} catch (error) {
				return toolError(error);
			}
		},
	);
}

async function createPrediction(
	env: Env,
	imageUrl: string,
	scale: number,
	faceEnhance: boolean,
): Promise<Prediction> {
	const version = await getLatestModelVersion(env);
	const response = await fetch("https://api.replicate.com/v1/predictions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${env.REPLICATE_API_TOKEN}`,
			"Content-Type": "application/json",
			Prefer: "wait=60",
		},
		body: JSON.stringify({
			version,
			input: { image: imageUrl, scale, face_enhance: faceEnhance },
		}),
	});

	if (!response.ok) {
		throw new Error(`Replicate prediction failed with HTTP ${response.status}.`);
	}

	return response.json<Prediction>();
}

async function getLatestModelVersion(env: Env): Promise<string> {
	const response = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}`, {
		headers: { Authorization: `Bearer ${env.REPLICATE_API_TOKEN}` },
	});

	if (!response.ok) {
		throw new Error(`Could not resolve the Replicate model (HTTP ${response.status}).`);
	}

	const model = await response.json<ReplicateModel>();
	const version = model.latest_version?.id;
	if (!version) {
		throw new Error("Replicate did not return a latest model version.");
	}

	return version;
}

async function waitForPrediction(env: Env, initial: Prediction): Promise<Prediction> {
	if (!initial.urls?.get) {
		throw new Error("Replicate did not return a prediction status URL.");
	}

	const deadline = Date.now() + 150_000;
	let prediction = initial;

	while (Date.now() < deadline) {
		await scheduler.wait(1_500);
		const response = await fetch(initial.urls.get, {
			headers: { Authorization: `Bearer ${env.REPLICATE_API_TOKEN}` },
		});

		if (!response.ok) {
			throw new Error(`Replicate polling failed with HTTP ${response.status}.`);
		}

		prediction = await response.json<Prediction>();
		if (["succeeded", "failed", "canceled"].includes(prediction.status)) {
			return prediction;
		}
	}

	throw new Error("Replicate prediction timed out after 150 seconds.");
}

function getOutputUrl(output: Prediction["output"]): string {
	if (typeof output === "string") return output;
	if (Array.isArray(output) && typeof output[0] === "string") return output[0];
	throw new Error("Replicate completed without an image URL.");
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
