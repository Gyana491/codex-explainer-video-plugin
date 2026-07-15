import { z } from "zod";
import { upscaleImage } from "../services/replicate";

export const upscaleImageSchema = {
  imageUrl: z
    .string()
    .url()
    .describe("Publicly reachable URL of the storyboard or scene image."),
  scale: z
    .number()
    .int()
    .min(2)
    .max(10)
    .default(10)
    .describe("Upscale factor from 2 to 10."),
  faceEnhance: z
    .boolean()
    .default(false)
    .describe("Enable face restoration for images containing important faces."),
};

export async function runUpscaleImage(
  env: Env,
  input: {
    imageUrl: string;
    scale: number;
    faceEnhance: boolean;
  },
) {
  const result = await upscaleImage(env, input);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            sourceImageUrl: input.imageUrl,
            scale: input.scale,
            faceEnhance: input.faceEnhance,
            upscaledImageUrl: result.imageUrl,
            predictionId: result.predictionId,
          },
          null,
          2,
        ),
      },
    ],
  };
}
