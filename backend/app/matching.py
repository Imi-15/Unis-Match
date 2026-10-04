"""
The matching engine. This is the "chef" from the restaurant explanation:
takes a student's answers plus the list of universities, and returns a
ranked list of how well each one fits.

Three ingredients go into each score:

  1. ELIGIBILITY -- a hard filter, not a weighted score. If a student
     already has (or is testing) a real score, universities they can't
     get into are dropped entirely rather than ranked low. Admission
     is binary in real life, so the model treats it that way.

  2. VIBE MATCH -- how much the student's chosen campus-feel tags
     ("diverse", "strict", "tech_focused"...) overlap with a
     university's own tags. Measured with Jaccard similarity:
     (tags they share) / (all tags either one has). Pure set math,
     no machine learning involved.

  3. INTEREST MATCH -- how well the student's free-text interests
     ("I love coding and robotics") line up with what each
     university is known for (its strong_fields). This is where
     TF-IDF + cosine similarity comes in -- see the long comment
     inside interest_scores() below for what that actually means.

A fourth input, `flexible`, isn't a score -- it's a signal that the
student doesn't care about campus prestige or size, just wants a real,
accredited path to a degree. When set, every result gets a plain
reason saying so, and among close scores, less selective (lower
cutoff, typically smaller/less competitive) universities are nudged
ahead -- these are exactly the schools a "just want a degree" student
is likely to overlook in favour of names they've already heard of.

IMPORTANT: `reasons` are built entirely with plain Python string
logic, not the Featherless/LLM call in featherless_client.py. This is
deliberate -- given the offline-first pitch, the actual explanation
for *why* something is recommended must work with zero network
access. The AI-generated narrative (built in main.py) is an optional
polish layer on top of these reasons, not a replacement for them.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# How much each remaining factor counts, AFTER eligibility has already
# filtered the list. These must add up to 1.0. Vibe is weighted slightly
# higher than interest here on the reasoning that "will I actually enjoy
# being on this campus for 4 years" matters at least as much as "does my
# hobby list match their course list" -- adjust these once you've run a
# few test profiles and seen how the rankings feel.
VIBE_WEIGHT = 0.55
INTEREST_WEIGHT = 0.45


def jaccard_similarity(set_a: set, set_b: set) -> float:
    """
    Jaccard similarity = how much two sets overlap, as a fraction.
        (things they share) / (all things between the two of them)

    Example: student wants {"diverse", "community"}, a university is
    tagged {"diverse", "community", "vibrant"}.
        shared = {"diverse", "community"}          -> 2 items
        union  = {"diverse", "community", "vibrant"} -> 3 items
        score  = 2 / 3 = 0.67

    If the student gave no vibe tags at all, there's nothing to compare,
    so we return 0.0 rather than dividing by zero.
    """
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    return intersection / union


def interest_scores(student_interest_text: str, universities: list[dict]) -> list[float]:
    """
    Returns one interest-match score (0-1) per university, in the same
    order as the `universities` list passed in.

    What TF-IDF + cosine similarity actually does, in plain terms:

    1. TF-IDF turns each piece of text into a list of numbers (a
       "vector"), one number per word that appears ANYWHERE in the
       whole set of texts. A word gets a LOW weight if it shows up in
       almost every document (it's not telling you anything special,
       like "and" or "the"), and a HIGH weight if it's rare -- because
       rare, specific words are what actually distinguish one document
       from another (like "robotics" or "agriculture").

    2. Once every piece of text is a vector, cosine similarity measures
       the ANGLE between two vectors, not their length. Two short
       sentences that use similar important words point in a similar
       direction, so they score close to 1. Completely unrelated text
       points in a very different direction, closer to 0.

    3. Here, the "documents" are: the student's interest text, PLUS
       each university's strong_fields joined into one string (e.g.
       "engineering technology"). We fit the vectorizer on all of them
       together, so it learns word importance across this specific
       comparison, then compare the student's vector against each
       university's vector one at a time.

    If the student left interest_text blank, there's nothing meaningful
    to compare, so every university gets 0.0 instead of a misleading
    number.
    """
    if not student_interest_text.strip():
        return [0.0] * len(universities)

    university_texts = [" ".join(u.get("strong_fields", [])) for u in universities]
    corpus = [student_interest_text] + university_texts

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)  # this is the "fit" / learning step

    student_vector = tfidf_matrix[0]
    university_vectors = tfidf_matrix[1:]

    similarities = cosine_similarity(student_vector, university_vectors)[0]
    return similarities.tolist()


def matched_fields(interest_text: str, fields: list[str]) -> list[str]:
    """
    Which of a university's strong_fields actually show up in the
    student's own words? Simple substring check, not TF-IDF -- this is
    just for writing a human-readable reason ("strong in engineering,
    technology"), not for scoring.
    """
    text_lower = interest_text.lower()
    return [f for f in fields if f.replace("_", " ") in text_lower]


def build_reasons(
    eligible: bool | None,
    effective_score: int | None,
    cutoff_mark: int,
    matched_vibe_tags: list[str],
    matched_field_list: list[str],
    flexible: bool,
) -> list[str]:
    """
    Builds the plain-language reasons shown under every match -- see the
    module docstring for why this is plain Python, not an LLM call.
    """
    reasons = []

    if eligible is True:
        margin = effective_score - cutoff_mark
        if margin >= 30:
            reasons.append(f"You clear the {cutoff_mark} cutoff comfortably, {margin} points to spare.")
        else:
            reasons.append(f"You meet the {cutoff_mark} cutoff.")
    elif eligible is None:
        reasons.append(f"Needs {cutoff_mark}+ to qualify -- not yet checked against a real score.")

    if matched_vibe_tags:
        pretty = ", ".join(t.replace("_", " ") for t in sorted(matched_vibe_tags))
        reasons.append(f"Matches your preference for a {pretty} campus.")

    if matched_field_list:
        pretty = ", ".join(matched_field_list)
        reasons.append(f"Strong in {pretty}, which lines up with what you're interested in.")

    if flexible:
        reasons.append("A recognized, accredited university -- a solid, less competitive path to a real degree.")

    if not reasons:
        reasons.append("Meets your basic criteria, though nothing here stands out strongly yet.")

    return reasons


def rank_universities(student: dict, universities: list[dict]) -> list[dict]:
    """
    The main entry point main.py calls.

    Three modes, decided automatically from what the student gave us:

      - DECIDED:     student.utme_score is set (they've written JAMB).
                     Universities below the cutoff are dropped entirely.
      - HYPOTHETICAL: no utme_score, but student.target_score is set
                     ("what if I scored 250?"). Same filtering, but
                     nothing is claimed about a score they don't have.
      - EXPLORING:   neither is set. No filtering at all -- every
                     university is ranked purely on vibe + interest,
                     and each result includes needed_score (the real
                     cutoff) so the student knows what to aim for.

    `flexible` (from student.get("flexible")) means "I just want a
    real degree, size/prestige doesn't matter." It doesn't change the
    scoring formula -- it adds a reason to every result, and nudges
    less selective (lower cutoff) universities ahead when scores tie,
    since those are exactly the schools a prestige-focused ranking
    would bury.

    Returns a list of dicts (best match first), each shaped like:
        {
            "university_name": str,
            "match_score": float,      # 0-100
            "sub_scores": {
                "eligible": bool | None,
                "vibe_score": float,   # 0-1
                "interest_score": float,  # 0-1
            },
            "needed_score": int,       # the university's real cutoff_mark
            "reasons": list[str],      # plain-language, works fully offline
        }
    """
    utme_score = student.get("utme_score")
    target_score = student.get("target_score")
    effective_score = utme_score if utme_score is not None else target_score
    exploring = effective_score is None
    flexible = bool(student.get("flexible"))

    student_vibe_tags = set(student.get("vibe_tags") or [])
    interest_text = student.get("interest_text") or ""

    all_interest_scores = interest_scores(interest_text, universities)

    results = []
    for uni, interest_score in zip(universities, all_interest_scores):
        eligible = None
        if not exploring:
            eligible = effective_score >= uni["cutoff_mark"]
            if not eligible:
                continue

        uni_vibe_tags = set(uni.get("culture_tags", []))
        vibe_score = jaccard_similarity(student_vibe_tags, uni_vibe_tags)
        matched_vibe = sorted(student_vibe_tags & uni_vibe_tags)
        matched_field_list = matched_fields(interest_text, uni.get("strong_fields", []))

        combined = (VIBE_WEIGHT * vibe_score) + (INTEREST_WEIGHT * interest_score)
        match_score = round(combined * 100, 1)

        reasons = build_reasons(
            eligible=eligible,
            effective_score=effective_score,
            cutoff_mark=uni["cutoff_mark"],
            matched_vibe_tags=matched_vibe,
            matched_field_list=matched_field_list,
            flexible=flexible,
        )

        results.append(
            {
                "university_name": uni["name"],
                "match_score": match_score,
                "sub_scores": {
                    "eligible": eligible,
                    "vibe_score": round(vibe_score, 3),
                    "interest_score": round(interest_score, 3),
                },
                "needed_score": uni["cutoff_mark"],
                "reasons": reasons,
                "_cutoff_for_sort": uni["cutoff_mark"],  # stripped before returning
            }
        )

    # Primary sort: best match first. Secondary sort (only when flexible):
    # among close scores, prefer the less selective school -- see the
    # "flexible" explanation in the docstring above.
    if flexible:
        results.sort(key=lambda r: (-r["match_score"], r["_cutoff_for_sort"]))
    else:
        results.sort(key=lambda r: -r["match_score"])

    for r in results:
        del r["_cutoff_for_sort"]

    return results
