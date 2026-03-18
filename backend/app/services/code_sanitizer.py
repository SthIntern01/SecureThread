"""
Lightweight code sanitizer to reduce regex/YARA false positives.

Goal: remove comments (and optionally strings) while preserving newline positions
so that line-number calculations remain correct.
"""
from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class SanitizedContent:
    original: str
    sanitized: str


def _mask(text: str, start: int, end: int) -> str:
    chunk = text[start:end]
    masked = "".join("\n" if c == "\n" else " " for c in chunk)
    return text[:start] + masked + text[end:]


def sanitize_code(
    content: str,
    language: str,
    *,
    strip_comments: bool = True,
    strip_strings: bool = False,
) -> SanitizedContent:
    if not content:
        return SanitizedContent(original=content, sanitized=content)

    lang = (language or "unknown").lower()
    sanitized = content

    if strip_comments:
        if lang in ("javascript", "typescript"):
            # /* ... */
            for m in list(re.finditer(r"/\*[\s\S]*?\*/", sanitized)):
                sanitized = _mask(sanitized, m.start(), m.end())
            # // ...
            for m in list(re.finditer(r"//.*?$", sanitized, flags=re.MULTILINE)):
                sanitized = _mask(sanitized, m.start(), m.end())

        elif lang == "python":
            for m in list(re.finditer(r"#.*?$", sanitized, flags=re.MULTILINE)):
                sanitized = _mask(sanitized, m.start(), m.end())

        elif lang == "html":
            for m in list(re.finditer(r"<!--[\s\S]*?-->", sanitized)):
                sanitized = _mask(sanitized, m.start(), m.end())

    if strip_strings:
        if lang in ("javascript", "typescript"):
            for m in list(re.finditer(r"""(["'])(?:\\.|(?!\1)[^\\])*\1""", sanitized)):
                sanitized = _mask(sanitized, m.start(), m.end())
            for m in list(re.finditer(r"`(?:\\.|[^\\`])*`", sanitized)):
                sanitized = _mask(sanitized, m.start(), m.end())

        elif lang == "python":
            for m in list(re.finditer(r"'''[\s\S]*?'''", sanitized)):
                sanitized = _mask(sanitized, m.start(), m.end())
            for m in list(re.finditer(r'"""[\s\S]*?"""', sanitized)):
                sanitized = _mask(sanitized, m.start(), m.end())
            for m in list(re.finditer(r"""(["'])(?:\\.|(?!\1)[^\\])*\1""", sanitized)):
                sanitized = _mask(sanitized, m.start(), m.end())

    return SanitizedContent(original=content, sanitized=sanitized)