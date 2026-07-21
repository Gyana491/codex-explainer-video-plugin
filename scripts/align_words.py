#!/usr/bin/env python3
"""Word-align per-scene narration clips and emit word timings plus karaoke captions.

Reads output/scene-timings.json, transcribes each scene clip with faster-whisper
(word timestamps on), snaps recognized words to the known narration text, offsets
by cumulative scene start, and writes word-timings.json and captions.ass.
Falls back to proportional phrase-level timing per scene when the model is
unavailable, and says so in timing_source.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ACCENT = "F97316"  # warm orange, matches the plugin accent (BGR in ASS: 1673F9)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("scene_timings", type=Path)
    p.add_argument("--words", type=Path, default=Path("output/word-timings.json"))
    p.add_argument("--captions", type=Path, default=Path("output/captions.ass"))
    p.add_argument("--model", default="base")
    p.add_argument("--language", default="en")
    p.add_argument("--max-phrase-words", type=int, default=7)
    p.add_argument("--min-phrase-words", type=int, default=3)
    return p.parse_args()


def tokenize(text: str) -> list[str]:
    return [t for t in re.findall(r"\S+", text) if t]


def norm(token: str) -> str:
    return re.sub(r"[^\w']", "", token).lower()


def load_model(name: str):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return None
    return WhisperModel(name, device="cpu", compute_type="int8")


def align_scene(model, scene: dict, language: str) -> tuple[list[dict], str]:
    """Return (words, timing_source) for one scene, offsets applied."""
    narration = tokenize(scene.get("narration_segment", ""))
    offset = float(scene["start_seconds"])
    duration = float(scene["end_seconds"]) - offset
    if not narration:
        return [], "empty_narration"

    recognized: list[tuple[str, float, float]] = []
    if model is not None:
        segments, _info = model.transcribe(
            scene["audio_file"], language=language, word_timestamps=True,
            initial_prompt=" ".join(narration)[:200],
        )
        for seg in segments:
            for w in seg.words or []:
                recognized.append((w.word.strip(), w.start, w.end))

    words: list[dict] = []
    if recognized:
        # Greedy monotonic match: walk narration; consume the next recognized
        # word whose normalized form matches, else borrow neighbor timing.
        ri = 0
        last_end = 0.0
        for token in narration:
            start = end = None
            for look in range(ri, min(ri + 3, len(recognized))):
                if norm(recognized[look][0]) == norm(token):
                    start, end = recognized[look][1], recognized[look][2]
                    ri = look + 1
                    break
            if start is None:
                if ri < len(recognized):
                    start, end = recognized[ri][1], recognized[ri][2]
                    ri += 1
                else:
                    start, end = last_end, min(duration, last_end + 0.3)
            start = max(last_end, min(start, duration))
            end = max(start + 0.01, min(end, duration))
            last_end = end
            words.append({"word": token, "start_seconds": round(offset + start, 3),
                          "end_seconds": round(offset + end, 3)})
        source = "faster_whisper_alignment"
    else:
        # Proportional fallback: distribute by character weight across the clip.
        weights = [max(1, len(norm(t))) for t in narration]
        total = sum(weights)
        cursor = 0.0
        for token, weight in zip(narration, weights):
            span = duration * weight / total
            words.append({"word": token,
                          "start_seconds": round(offset + cursor, 3),
                          "end_seconds": round(offset + cursor + span, 3)})
            cursor += span
        source = "proportional_fallback"

    for w in words:
        w["scene_number"] = scene["scene_number"]
        w["audio_file"] = scene["audio_file"]
        w["timing_source"] = source
    return words, source


def phrase_groups(words: list[dict], lo: int, hi: int) -> list[list[dict]]:
    groups: list[list[dict]] = []
    current: list[dict] = []
    for w in words:
        if current and (len(current) >= hi or w["scene_number"] != current[0]["scene_number"]):
            groups.append(current)
            current = []
        current.append(w)
        if len(current) >= lo and re.search(r"[.!?,;:]$", w["word"]):
            groups.append(current)
            current = []
    if current:
        groups.append(current)
    return groups


ASS_HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Karaoke,Arial,58,&H00252525,&H001673F9,&H00FFFFFF,&H64FFFFFF,-1,0,0,0,100,100,0,0,1,3,0,2,120,120,64,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def ass_time(seconds: float) -> str:
    cs = int(round(seconds * 100))
    return f"{cs // 360000}:{(cs // 6000) % 60:02d}:{(cs // 100) % 60:02d}.{cs % 100:02d}"


def write_ass(path: Path, groups: list[list[dict]]) -> None:
    lines = [ASS_HEADER]
    for group in groups:
        start, end = group[0]["start_seconds"], group[-1]["end_seconds"]
        parts = []
        for w in group:
            k = max(1, int(round((w["end_seconds"] - w["start_seconds"]) * 100)))
            parts.append(f"{{\\k{k}}}{w['word']} ")
        text = "".join(parts).rstrip()
        lines.append(f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Karaoke,,0,0,0,,{text}\n")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(lines), encoding="utf-8")


def main() -> int:
    args = parse_args()
    data = json.loads(args.scene_timings.read_text(encoding="utf-8"))
    scenes = data["scenes"] if isinstance(data, dict) else data
    model = load_model(args.model)
    if model is None:
        print("warning: faster-whisper unavailable; using proportional fallback",
              file=sys.stderr)

    all_words: list[dict] = []
    for scene in scenes:
        words, source = align_scene(model, scene, args.language)
        all_words.extend(words)
        print(f"scene {scene['scene_number']}: {len(words)} words ({source})")

    args.words.parent.mkdir(parents=True, exist_ok=True)
    args.words.write_text(json.dumps({"words": all_words}, indent=2) + "\n",
                          encoding="utf-8")
    write_ass(args.captions, phrase_groups(all_words, args.min_phrase_words,
                                           args.max_phrase_words))
    print(args.words)
    print(args.captions)
    return 0


if __name__ == "__main__":
    sys.exit(main())
