#!/usr/bin/env python3
"""
Convert hardcoded hex and rgba(r,g,b) colors to luminance-matched grayscale.
Run from repo root: python3 scripts/apply_monochrome_colors.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Only touch theme source; skip locales (no hex today; avoid accidental churn)
RELATIVE_DIRS = [
    "config",
    "templates",
    "sections",
    "snippets",
    "layout",
]
ASSET_GLOBS = ["*.css", "*.js"]


def luminance_gray(r: int, g: int, b: int) -> tuple[int, int, int]:
    y = int(round(0.299 * r + 0.587 * g + 0.114 * b))
    y = max(0, min(255, y))
    return y, y, y


def gray_hex(r: int, g: int, b: int) -> str:
    y, _, _ = luminance_gray(r, g, b)
    return f"#{y:02X}{y:02X}{y:02X}"


HEX_RE = re.compile(r"#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b")

RGBA_RE = re.compile(
    r"rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([^)]+)\)"
)
RGB_COMMA_RE = re.compile(r"rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)")
RGB_SLASH_RE = re.compile(
    r"rgb\(\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s*/\s*([^)]+)\)"
)


def replace_hex(m: re.Match) -> str:
    raw = m.group(1)
    if len(raw) == 3:
        r = int(raw[0] + raw[0], 16)
        g = int(raw[1] + raw[1], 16)
        b = int(raw[2] + raw[2], 16)
        return gray_hex(r, g, b)
    if len(raw) == 6:
        r = int(raw[0:2], 16)
        g = int(raw[2:4], 16)
        b = int(raw[4:6], 16)
        return gray_hex(r, g, b)
    if len(raw) == 8:
        r = int(raw[0:2], 16)
        g = int(raw[2:4], 16)
        b = int(raw[4:6], 16)
        a = raw[6:8]
        y, _, _ = luminance_gray(r, g, b)
        return f"#{y:02X}{y:02X}{y:02X}{a.upper()}"
    return m.group(0)


def replace_rgba(m: re.Match) -> str:
    r, g, b = int(m.group(1)), int(m.group(2)), int(m.group(3))
    y, _, _ = luminance_gray(r, g, b)
    tail = m.group(4).strip()
    return f"rgba({y}, {y}, {y}, {tail})"


def replace_rgb(m: re.Match) -> str:
    r, g, b = int(m.group(1)), int(m.group(2)), int(m.group(3))
    y, _, _ = luminance_gray(r, g, b)
    return f"rgb({y}, {y}, {y})"


def replace_rgb_slash(m: re.Match) -> str:
    r, g, b = int(m.group(1)), int(m.group(2)), int(m.group(3))
    y, _, _ = luminance_gray(r, g, b)
    tail = m.group(4).strip()
    return f"rgb({y} {y} {y} / {tail})"


def transform(text: str) -> str:
    text = RGBA_RE.sub(replace_rgba, text)
    text = RGB_COMMA_RE.sub(replace_rgb, text)
    text = RGB_SLASH_RE.sub(replace_rgb_slash, text)
    text = HEX_RE.sub(lambda m: replace_hex(m), text)
    return text


def iter_files() -> list[Path]:
    out: list[Path] = []
    for rel in RELATIVE_DIRS:
        base = ROOT / rel
        if not base.is_dir():
            continue
        for path in base.rglob("*"):
            if path.is_file() and path.suffix.lower() in {".json", ".liquid"}:
                out.append(path)
    ad = ROOT / "assets"
    if ad.is_dir():
        for pat in ASSET_GLOBS:
            out.extend(ad.glob(pat))
    return sorted(out)


def main() -> int:
    changed = 0
    for path in iter_files():
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        new = transform(text)
        if new != text:
            path.write_text(new, encoding="utf-8")
            print(path.relative_to(ROOT))
            changed += 1
    print(f"Updated {changed} files.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
