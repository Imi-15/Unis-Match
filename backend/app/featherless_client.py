"""
Thin wrapper around Featherless.ai's OpenAI-SDK-compatible endpoint.

Why this is separated out: getting an OpenAI-compatible client configured
correctly (base_url, auth header, timeout, graceful failure) is boilerplate
with near-zero learning value — it's the same 15 lines regardless of what
you're building. The actual thinking for this project is in main.py's
prompt construction, not here.

Usage:
    from app.featherless_client import get_match_narrative

    text = get_match_narrative(
        student_summary="scored 210, wants a diverse/vibrant campus, interested in engineering and robotics",
        university_name="Ahmadu Bello University",
        match_score=92,
    )
"""

import os
from openai import OpenAI, APIError, APITimeoutError

_client = None


def _get_client() -> OpenAI:
    """Lazily build the client so importing this module doesn't require
    FEATHERLESS_API_KEY to already be set (e.g. during tests)."""
    global _client
    if _client is None:
        _client = OpenAI(
            base_url=os.getenv("FEATHERLESS_BASE_URL", "https://api.featherless.ai/v1"),
            api_key=os.getenv("FEATHERLESS_API_KEY"),
            timeout=8.0,  # fail fast — this is a "nice to have" narrative, not core functionality
        )
    return _client


FALLBACK_TEXT = "This match is based on your academic eligibility, campus preferences, and interests."


def get_match_narrative(
    student_summary: str, university_name: str, match_score: int, reasons: list[str] | None = None
) -> str:
    """
    Calls Featherless to generate a short "why this fits you" explanation.

    `reasons` are the deterministic, offline-computed reasons from
    matching.py's build_reasons() -- passed in so the AI-written text
    elaborates on real reasons rather than inventing its own, possibly
    contradictory, ones. This call is a polish layer on top of `reasons`,
    not a replacement for it -- see matching.py's module docstring.

    Design choice: on ANY failure (timeout, bad key, model unavailable,
    no internet), this returns FALLBACK_TEXT instead of raising. Given the
    app's offline-first pitch, a narrative call failing must never break
    the response the student sees — it should just degrade to something
    plain but still useful.
    """
    reasons_text = " ".join(reasons) if reasons else "General academic and preference fit."
    prompt = (
        f"A student profile: {student_summary}\n"
        f"Matched university: {university_name} ({match_score}% match)\n"
        f"Known reasons for this match: {reasons_text}\n\n"
        "In 2 short sentences, explain in plain, encouraging language why "
        "this university fits this student, building on the reasons given "
        "above rather than inventing new ones. No headings, no bullet points."
    )

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model=os.getenv("FEATHERLESS_MODEL", "meta-llama/Llama-3.1-8B-Instruct"),
            messages=[{"role": "user", "content": prompt}],
            max_tokens=120,
            temperature=0.7,
        )
        text = response.choices[0].message.content.strip()
        return text or FALLBACK_TEXT
    except (APIError, APITimeoutError, Exception) as e:
        # Broad except is intentional here: this call must never take down
        # the request. Log it so you can see failures during testing.
        print(f"[featherless_client] narrative generation failed, using fallback: {e}")
        # Fall back to the deterministic reasons themselves rather than a
        # generic placeholder -- they're real, specific, and already computed
        # with no network needed, so this degrades gracefully instead of
        # degrading to something vague.
        return reasons_text if reasons else FALLBACK_TEXT
