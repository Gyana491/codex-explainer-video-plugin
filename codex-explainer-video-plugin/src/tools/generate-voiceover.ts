import { z } from "zod";
import { generateVoiceover } from "../services/openai";
import type { AudioFormat, Voice } from "../types";

export const generateVoiceoverSchema = {
  text: z
    .string()
    .min(1)
    .max(4096)
    .describe("Narration text. Keep the final voiceover within the video duration."),
  voice: z
    .enum([
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
    ])
    .default("marin")
    .describe("OpenAI built-in TTS voice."),
  instructions: z
    .string()
    .max(1000)
    .optional()
    .describe("Delivery instructions such as pacing, emotion, accent, and tone."),
  format: z
    .enum(["mp3", "wav", "aac", "flac", "opus"])
    .default("mp3")
    .describe("Audio output format."),
  filename: z
    .string()
    .max(100)
    .optional()
    .describe("Optional output filename without an extension."),
};

export async function runGenerateVoiceover(
  env: Env,
  input: {
    text: string;
    voice: Voice;
    instructions?: string;
    format: AudioFormat;
    filename?: string;
  },
) {
  const result = await generateVoiceover(env, input);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            ...result,
            voice: input.voice,
            format: input.format,
          },
          null,
          2,
        ),
      },
    ],
  };
}
