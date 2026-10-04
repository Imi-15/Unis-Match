from typing import Optional
from pydantic import BaseModel, Field


class StudentProfile(BaseModel):
    # Optional now: a student who hasn't written JAMB/WAEC yet can still use
    # the app. When this is None, the engine skips the eligibility filter
    # entirely and ranks purely on vibe + interest fit ("exploring mode").
    utme_score: Optional[int] = Field(None, ge=0, le=400)

    # Optional "what if I scored X" -- lets an exploring student see what
    # would open up at a target score, without claiming they have it yet.
    target_score: Optional[int] = Field(None, ge=0, le=400)

    subject_combo: list[str] = []
    vibe_tags: list[str] = Field(default_factory=list, description="e.g. ['diverse', 'community']")
    interest_text: str = Field("", description="Free-text interests, e.g. 'I love coding and robotics'")
    max_tuition: Optional[int] = None
    preferred_region: Optional[str] = None

    # "I just want a real degree -- size or prestige doesn't matter."
    # See matching.py's rank_universities() docstring for exactly what
    # this changes about the ranking.
    flexible: bool = False


class SubScores(BaseModel):
    # None = "not evaluated" (exploring mode with no score/target given at all).
    # True/False = "evaluated against utme_score or target_score".
    eligible: Optional[bool] = None
    vibe_score: float
    interest_score: float


class MatchResult(BaseModel):
    university_name: str
    match_score: float
    sub_scores: SubScores
    # Filled in only when the student doesn't yet have a real score -- tells
    # them what to aim for instead of a yes/no they can't act on yet.
    needed_score: Optional[int] = None
    # Plain-language reasons -- generated with no network dependency, so
    # this is what shows even fully offline. See matching.py's
    # build_reasons() for exactly how these are written.
    reasons: list[str] = Field(default_factory=list)
    narrative: Optional[str] = None


class ScholarshipIngestItem(BaseModel):
    id: str
    title: str
    link: str
    source: str
    published_date: str = ""
    field_tags: list[str] = []
    region: str = "Africa"
    deadline: Optional[str] = None
    amount: Optional[str] = None
    note_to_reviewer: Optional[str] = None
