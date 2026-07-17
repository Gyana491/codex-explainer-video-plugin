#!/usr/bin/env python3
"""Build a pixel-exact 9:16 storyboard master from scene images.

Every populated and unused grid slot is exactly 16:9. Scene artwork is scaled
to cover and center-cropped; it is never stretched. FFmpeg and FFprobe are the
only external dependencies.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


SCENE_PATTERN = re.compile(r"^scene-(\d+)\.(?:png|jpe?g|webp)$", re.IGNORECASE)


def fail(message: str) -> None:
    raise SystemExit(f"error: {message}")


def run(command: list[str]) -> None:
    completed = subprocess.run(command, capture_output=True, text=True)
    if completed.returncode:
        detail = completed.stderr.strip() or completed.stdout.strip()
        fail(f"command failed: {' '.join(command)}\n{detail}")


def image_size(path: Path) -> tuple[int, int]:
    completed = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height",
            "-of",
            "json",
            str(path),
        ],
        capture_output=True,
        text=True,
    )
    if completed.returncode:
        fail(f"ffprobe could not inspect {path}: {completed.stderr.strip()}")
    stream = json.loads(completed.stdout)["streams"][0]
    return int(stream["width"]), int(stream["height"])


def find_scenes(scene_dir: Path) -> list[Path]:
    numbered: list[tuple[int, Path]] = []
    for path in scene_dir.iterdir():
        match = SCENE_PATTERN.match(path.name)
        if match:
            numbered.append((int(match.group(1)), path))
    numbered.sort()
    if not numbered:
        fail(f"no scene-NN images found in {scene_dir}")
    expected = list(range(1, len(numbered) + 1))
    actual = [number for number, _ in numbered]
    if actual != expected:
        fail(f"scene numbers must be contiguous from 1; found {actual}")
    return [path for _, path in numbered]


def choose_grid(
    scene_count: int,
    canvas_width: int,
    canvas_height: int,
    padding: int,
    gutter: int,
) -> tuple[int, int, int, int]:
    best: tuple[int, int, int, int, int, int] | None = None
    for columns in range(1, scene_count + 1):
        rows = math.ceil(scene_count / columns)
        available_width = canvas_width - 2 * padding - (columns - 1) * gutter
        available_height = canvas_height - 2 * padding - (rows - 1) * gutter
        if available_width <= 0 or available_height <= 0:
            continue
        unit = min(available_width // (16 * columns), available_height // (9 * rows))
        if unit < 1:
            continue
        panel_width = 16 * unit
        panel_height = 9 * unit
        candidate = (unit, -columns * rows, columns, rows, panel_width, panel_height)
        if best is None or candidate[:2] > best[:2]:
            best = candidate
    if best is None:
        fail("canvas is too small for the requested scene count, padding, and gutter")
    _, _, columns, rows, panel_width, panel_height = best
    return columns, rows, panel_width, panel_height


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scene-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--canvas-width", type=int, default=1080)
    parser.add_argument("--canvas-height", type=int, default=1920)
    parser.add_argument("--padding", type=int, default=24)
    parser.add_argument("--gutter", type=int, default=12)
    parser.add_argument("--background", default="F7F3E8")
    parser.add_argument("--border", default="1F2937")
    parser.add_argument("--border-width", type=int, default=2)
    args = parser.parse_args()

    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        fail("ffmpeg and ffprobe must be installed")
    if args.canvas_width * 16 != args.canvas_height * 9:
        fail("master canvas must satisfy width * 16 = height * 9 (exact 9:16)")
    if min(args.padding, args.gutter, args.border_width) < 0:
        fail("padding, gutter, and border width cannot be negative")
    if not args.scene_dir.is_dir():
        fail(f"scene directory does not exist: {args.scene_dir}")

    scenes = find_scenes(args.scene_dir)
    columns, rows, panel_width, panel_height = choose_grid(
        len(scenes),
        args.canvas_width,
        args.canvas_height,
        args.padding,
        args.gutter,
    )
    if panel_width * 9 != panel_height * 16:
        fail("internal error: calculated panel is not exact 16:9")

    grid_width = columns * panel_width + (columns - 1) * args.gutter
    grid_height = rows * panel_height + (rows - 1) * args.gutter
    origin_x = (args.canvas_width - grid_width) // 2
    origin_y = (args.canvas_height - grid_height) // 2
    cell_count = columns * rows

    args.output.parent.mkdir(parents=True, exist_ok=True)
    manifest_path = args.manifest or args.output.with_suffix(".geometry.json")
    manifest_path.parent.mkdir(parents=True, exist_ok=True)

    slots = []
    for index in range(cell_count):
        row, column = divmod(index, columns)
        x = origin_x + column * (panel_width + args.gutter)
        y = origin_y + row * (panel_height + args.gutter)
        slots.append(
            {
                "slot": index + 1,
                "scene_number": index + 1 if index < len(scenes) else None,
                "blank": index >= len(scenes),
                "x": x,
                "y": y,
                "width": panel_width,
                "height": panel_height,
                "aspect_ratio": "16:9",
                "ratio_verified": panel_width * 9 == panel_height * 16,
            }
        )

    with tempfile.TemporaryDirectory(prefix="storyboard-canonical-") as temporary:
        temporary_path = Path(temporary)
        normalized: list[Path] = []
        for index, scene in enumerate(scenes, start=1):
            target = temporary_path / f"scene-{index:02d}.png"
            run(
                [
                    "ffmpeg",
                    "-v",
                    "error",
                    "-y",
                    "-i",
                    str(scene),
                    "-vf",
                    (
                        f"scale={panel_width}:{panel_height}:"
                        "force_original_aspect_ratio=increase,"
                        f"crop={panel_width}:{panel_height}"
                    ),
                    "-frames:v",
                    "1",
                    str(target),
                ]
            )
            width, height = image_size(target)
            if width * 9 != height * 16 or (width, height) != (panel_width, panel_height):
                fail(f"normalized scene {index} failed exact 16:9 verification")
            normalized.append(target)

        command = [
            "ffmpeg",
            "-v",
            "error",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"color=c=0x{args.background}:s={args.canvas_width}x{args.canvas_height}:d=1",
        ]
        for path in normalized:
            command.extend(["-i", str(path)])

        filters: list[str] = []
        current = "[0:v]"
        for index, slot in enumerate(slots[: len(normalized)], start=1):
            output_label = f"[placed{index}]"
            filters.append(
                f"{current}[{index}:v]overlay=x={slot['x']}:y={slot['y']}{output_label}"
            )
            current = output_label
        for index, slot in enumerate(slots, start=1):
            output_label = f"[boxed{index}]"
            filters.append(
                f"{current}drawbox=x={slot['x']}:y={slot['y']}:"
                f"w={panel_width}:h={panel_height}:color=0x{args.border}:"
                f"t={args.border_width}{output_label}"
            )
            current = output_label
        filters.append(f"{current}format=rgb24[out]")
        command.extend(
            [
                "-filter_complex",
                ";".join(filters),
                "-map",
                "[out]",
                "-frames:v",
                "1",
                str(args.output),
            ]
        )
        run(command)

    master_width, master_height = image_size(args.output)
    if (master_width, master_height) != (args.canvas_width, args.canvas_height):
        fail("canonical master dimensions do not match the requested canvas")
    if master_width * 16 != master_height * 9:
        fail("canonical master failed exact 9:16 verification")

    manifest = {
        "master": {
            "path": str(args.output),
            "width": master_width,
            "height": master_height,
            "aspect_ratio": "9:16",
            "ratio_verified": master_width * 16 == master_height * 9,
        },
        "grid": {
            "columns": columns,
            "rows": rows,
            "cell_count": cell_count,
            "scene_count": len(scenes),
            "unused_cell_count": cell_count - len(scenes),
            "origin_x": origin_x,
            "origin_y": origin_y,
            "panel_width": panel_width,
            "panel_height": panel_height,
            "panel_aspect_ratio": "16:9",
            "panel_ratio_verified": panel_width * 9 == panel_height * 16,
            "gutter": args.gutter,
            "minimum_outer_padding": args.padding,
            "reading_order": "row-major",
        },
        "slots": slots,
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
