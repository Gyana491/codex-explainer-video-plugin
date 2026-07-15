import type { ReplicatePrediction } from "../types";
import { assertOk } from "../lib/http";

const REPLICATE_API = "https://api.replicate.com/v1";

function headers(env: Env): HeadersInit {
  return {
    Authorization: `Bearer ${env.REPLICATE_API_TOKEN}`,
    "Content-Type": "application/json",
    Prefer: "wait=60",
  };
}

function outputUrl(output: ReplicatePrediction["output"]): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && typeof output[0] === "string") return output[0];
  throw new Error("Replicate completed without returning an image URL.");
}

export async function upscaleImage(
  env: Env,
  input: {
    imageUrl: string;
    scale: number;
    faceEnhance: boolean;
  },
): Promise<{ predictionId: string; imageUrl: string }> {
  const model = env.REPLICATE_MODEL || "juergengunz/real-esrgan-v2";

  const response = await fetch(
    `${REPLICATE_API}/models/${model}/predictions`,
    {
      method: "POST",
      headers: headers(env),
      body: JSON.stringify({
        input: {
          image: input.imageUrl,
          scale: input.scale,
          face_enhance: input.faceEnhance,
        },
      }),
    },
  );

  await assertOk(response, "Replicate prediction creation");
  let prediction = (await response.json()) as ReplicatePrediction;

  if (
    prediction.status !== "succeeded" &&
    prediction.status !== "failed" &&
    prediction.urls?.get
  ) {
    prediction = await waitForPrediction(env, prediction.urls.get);
  }

  if (prediction.status !== "succeeded") {
    throw new Error(
      `Upscaling failed: ${prediction.error ?? `status ${prediction.status}`}`,
    );
  }

  return {
    predictionId: prediction.id,
    imageUrl: outputUrl(prediction.output),
  };
}

async function waitForPrediction(
  env: Env,
  getUrl: string,
): Promise<ReplicatePrediction> {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    const response = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${env.REPLICATE_API_TOKEN}`,
      },
    });
    await assertOk(response, "Replicate prediction polling");

    const prediction = (await response.json()) as ReplicatePrediction;
    if (
      prediction.status === "succeeded" ||
      prediction.status === "failed" ||
      prediction.status === "canceled"
    ) {
      return prediction;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_500));
  }

  throw new Error("Replicate prediction timed out after 120 seconds.");
}
