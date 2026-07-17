#!/usr/bin/env python3
"""Analyze narration rhythm and emit scene-ready timestamps.

FFprobe supplies the container duration. pydub supplies loudness plus silence and
speech ranges. When --scene-count is provided, scene cuts snap to nearby silence
midpoints and fall back to evenly spaced cuts only when no usable pause exists.
"""

from __future__ import annotations

import argparse
import json
import math
import subprocess
import sys
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("audio", type=Path, help="Narration audio file")
    parser.add_argument("--scene-count", type=int, help="Number of timed scenes to emit")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("output/audio-analysis.json"),
        help="JSON output path",
    )
    parser.add_argument("--min-silence-ms", type=int, default=300)
    parser.add_argument(
        "--silence-thresh-dbfs",
        type=float,
        help="Explicit threshold; default is derived from average loudness",
    )
    parser.add_argument("--seek-step-ms", type=int, default=10)
    parser.add_argument(
        "--minimum-scene-ms",
        type=int,
        default=1000,
        help="Minimum spacing between adjacent cuts",
    )
    return parser.parse_args()


def require_pydub() -> tuple[Any, Any]:
    try:
        from pydub import AudioSegment, silence
    except (ImportError, ModuleNotFoundError) as exc:
        raise SystemExit(
            "pydub could not be imported. Install `pydub`; on Python 3.13+ also "
            "install `audioop-lts` (or use Python 3.12 or earlier)."
        ) from exc
    return AudioSegment, silence


def ffprobe_duration_seconds(audio_path: Path) -> float:
    command = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        str(audio_path),
    ]
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        return float(result.stdout.strip())
    except FileNotFoundError as exc:
        raise SystemExit("ffprobe is required but was not found on PATH.") from exc
    except (subprocess.CalledProcessError, ValueError) as exc:
        details = getattr(exc, "stderr", "") or str(exc)
        raise SystemExit(f"ffprobe could not inspect {audio_path}: {details.strip()}") from exc


def seconds_ranges(ranges_ms: list[list[int]]) -> list[dict[str, float]]:
    return [
        {
            "start_seconds": round(start / 1000, 3),
            "end_seconds": round(end / 1000, 3),
            "duration_seconds": round((end - start) / 1000, 3),
        }
        for start, end in ranges_ms
    ]


def choose_scene_boundaries(
    duration_ms: int,
    silent_ranges: list[list[int]],
    scene_count: int,
    minimum_scene_ms: int,
) -> tuple[list[int], list[dict[str, Any]]]:
    if scene_count < 1:
        raise SystemExit("--scene-count must be at least 1.")
    if scene_count == 1:
        return [0, duration_ms], []
    if duration_ms < scene_count:
        raise SystemExit("The requested scene count exceeds the audio duration in milliseconds.")

    # Do not force an impossible minimum; preserve ordered, non-empty scenes.
    effective_minimum = min(minimum_scene_ms, max(1, duration_ms // scene_count))
    pause_midpoints = sorted((start + end) // 2 for start, end in silent_ranges)
    boundaries = [0]
    decisions: list[dict[str, Any]] = []

    for index in range(1, scene_count):
        ideal = round(duration_ms * index / scene_count)
        remaining_scenes = scene_count - index
        lower = boundaries[-1] + effective_minimum
        upper = duration_ms - (remaining_scenes * effective_minimum)
        if lower > upper:
            lower = boundaries[-1] + 1
            upper = duration_ms - remaining_scenes

        eligible = [point for point in pause_midpoints if lower <= point <= upper]
        if eligible:
            chosen = min(eligible, key=lambda point: (abs(point - ideal), point))
            source = "silence_midpoint"
        else:
            chosen = min(max(ideal, lower), upper)
            source = "uniform_fallback"

        boundaries.append(chosen)
        decisions.append(
            {
                "boundary_after_scene": index,
                "timestamp_seconds": round(chosen / 1000, 3),
                "source": source,
                "ideal_timestamp_seconds": round(ideal / 1000, 3),
            }
        )

    boundaries.append(duration_ms)
    return boundaries, decisions


def scene_ranges(boundaries: list[int]) -> list[dict[str, Any]]:
    scenes: list[dict[str, Any]] = []
    for index, (start, end) in enumerate(zip(boundaries, boundaries[1:]), start=1):
        scenes.append(
            {
                "scene_number": index,
                "start_seconds": round(start / 1000, 3),
                "end_seconds": round(end / 1000, 3),
                "duration_seconds": round((end - start) / 1000, 3),
            }
        )
    return scenes


def main() -> int:
    args = parse_args()
    if not args.audio.is_file():
        raise SystemExit(f"Audio file not found: {args.audio}")
    if args.min_silence_ms < 1 or args.seek_step_ms < 1 or args.minimum_scene_ms < 1:
        raise SystemExit("Silence and scene timing values must be positive integers.")

    AudioSegment, silence = require_pydub()
    audio = AudioSegment.from_file(args.audio)
    duration_ms = len(audio)
    ffprobe_duration = ffprobe_duration_seconds(args.audio)

    if math.isinf(audio.dBFS):
        derived_threshold = -45.0
    else:
        derived_threshold = max(-50.0, min(-35.0, audio.dBFS - 14.0))
    threshold = (
        args.silence_thresh_dbfs
        if args.silence_thresh_dbfs is not None
        else derived_threshold
    )

    silence_options = {
        "min_silence_len": args.min_silence_ms,
        "silence_thresh": threshold,
        "seek_step": args.seek_step_ms,
    }
    silent_ranges = silence.detect_silence(audio, **silence_options)
    spoken_ranges = silence.detect_nonsilent(audio, **silence_options)

    output: dict[str, Any] = {
        "schema_version": 1,
        "audio_file": str(args.audio),
        "duration_seconds": round(duration_ms / 1000, 3),
        "ffprobe_duration_seconds": round(ffprobe_duration, 6),
        "duration_difference_seconds": round(abs(ffprobe_duration - duration_ms / 1000), 6),
        "average_dbfs": None if math.isinf(audio.dBFS) else round(audio.dBFS, 3),
        "peak_dbfs": None if math.isinf(audio.max_dBFS) else round(audio.max_dBFS, 3),
        "silence_detection": {
            "min_silence_ms": args.min_silence_ms,
            "silence_thresh_dbfs": round(threshold, 3),
            "seek_step_ms": args.seek_step_ms,
            "threshold_source": "explicit" if args.silence_thresh_dbfs is not None else "adaptive",
        },
        "silent_ranges": seconds_ranges(silent_ranges),
        "spoken_ranges": seconds_ranges(spoken_ranges),
    }

    if args.scene_count is not None:
        boundaries, decisions = choose_scene_boundaries(
            duration_ms,
            silent_ranges,
            args.scene_count,
            args.minimum_scene_ms,
        )
        output["scene_count"] = args.scene_count
        output["scene_boundaries"] = decisions
        output["scenes"] = scene_ranges(boundaries)
        output["fallback_boundary_count"] = sum(
            item["source"] == "uniform_fallback" for item in decisions
        )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(args.output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
