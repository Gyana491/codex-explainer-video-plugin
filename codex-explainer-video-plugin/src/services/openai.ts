import type { AudioFormat, Voice } from "../types";
import { assertOk } from "../lib/http";

const OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech";

function extension(format: AudioFormat): string {
  return format;
}

function contentType(format: AudioFormat): string {
  const types: Record<AudioFormat, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    aac: "audio/aac",
    flac: "audio/flac",
    opus: "audio/opus",
  };
  return types[format];
}

export async function generateVoiceover(
  env: Env,
  input: {
    text: string;
    voice: Voice;
    instructions?: string;
    format: AudioFormat;
    filename?: string;
  },
): Promise<{
  key: string;
  url: string;
  contentType: string;
  bytes: number;
  aiGeneratedDisclosure: string;
}> {
  const response = await fetch(OPENAI_SPEECH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      input: input.text,
      voice: input.voice,
      instructions: input.instructions,
      response_format: input.format,
    }),
  });

  await assertOk(response, "OpenAI speech generation");

  const audio = await response.arrayBuffer();
  const safeName = sanitizeFilename(
    input.filename ?? `voiceover-${crypto.randomUUID()}`,
  );
  const key = `voiceovers/${safeName}.${extension(input.format)}`;
  const mime = contentType(input.format);

  await env.MEDIA_BUCKET.put(key, audio, {
    httpMetadata: {
      contentType: mime,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      generatedBy: env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice: input.voice,
    },
  });

  const base = env.PUBLIC_MEDIA_BASE_URL.replace(/\/+$/, "");

  return {
    key,
    url: `${base}/${key}`,
    contentType: mime,
    bytes: audio.byteLength,
    aiGeneratedDisclosure:
      "This voice is AI-generated and must be disclosed to end users.",
  };
}

function sanitizeFilename(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return normalized || `voiceover-${crypto.randomUUID()}`;
}
