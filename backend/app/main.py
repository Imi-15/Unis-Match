import json
import os
import threading
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.featherless_client import get_match_narrative
from app.matching import rank_universities
from app.models import MatchResult, ScholarshipIngestItem, StudentProfile

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
NARRATIVE_TOP_N = 3  # only generate LLM narratives for the top few results

app = FastAPI(title="Scholarship & University Matcher API")

# Loosen/tighten this to your actual frontend origin before deploying.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Guards read-modify-write on scholarships.json so two ingest calls
# (e.g. two n8n runs) can't clobber each other.
_scholarships_lock = threading.Lock()


def _load(filename: str) -> dict:
    path = DATA_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=500, detail=f"Data file missing: {filename}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/universities")
def get_universities():
    data = _load("universities.json")
    return {
        "last_updated": data.get("last_updated"),
        "source": data.get("source"),
        "count": len(data["universities"]),
        "universities": data["universities"],
    }


@app.get("/api/scholarships")
def get_scholarships():
    data = _load("scholarships.json")
    return {
        "last_updated": data.get("last_updated"),
        "count": len(data["scholarships"]),
        "scholarships": data["scholarships"],
    }


@app.post("/api/match", response_model=list[MatchResult])
def match(student: StudentProfile):
    universities = _load("universities.json")["universities"]

    try:
        ranked = rank_universities(student.model_dump(), universities)
    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail=str(e))

    # Narratives only for the top few — 45 LLM calls per request would be slow.
    # Describe the score honestly depending on which mode the student is in,
    # so the AI-written text never claims a score they don't actually have.
    if student.utme_score is not None:
        score_phrase = f"scored {student.utme_score}"
    elif student.target_score is not None:
        score_phrase = f"is aiming for a score around {student.target_score} (hasn't written JAMB yet)"
    else:
        score_phrase = "hasn't written JAMB/WAEC yet and is exploring options early"

    summary = (
        f"{score_phrase}, prefers {', '.join(student.vibe_tags) or 'no particular'} campus vibe, "
        f"interests: {student.interest_text or 'not specified'}"
    )
    results = []
    for i, item in enumerate(ranked):
        narrative = None
        if i < NARRATIVE_TOP_N:
            narrative = get_match_narrative(
                student_summary=summary,
                university_name=item["university_name"],
                match_score=int(round(item["match_score"])),
                reasons=item.get("reasons"),
            )
        results.append({**item, "narrative": narrative})
    return results


@app.post("/api/scholarships/ingest")
def ingest_scholarships(items: list[ScholarshipIngestItem]):
    """Called by the n8n workflow. Adds only items whose link isn't already stored."""
    with _scholarships_lock:
        data = _load("scholarships.json")
        existing_links = {s["link"] for s in data["scholarships"]}

        added = 0
        for item in items:
            if item.link in existing_links:
                continue
            data["scholarships"].append(item.model_dump())
            existing_links.add(item.link)
            added += 1

        if added:
            from datetime import datetime, timezone

            data["last_updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            with open(DATA_DIR / "scholarships.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

    return {"added": added, "total": len(data["scholarships"])}
