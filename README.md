# Scholarship & University Matcher — Day 1

## What's done and verified today

- **`backend/data/universities.json`** — 45 real Nigerian universities with their
  actual 2026 JAMB cutoff marks, transcribed from the official May 11, 2026
  policy meeting announcement. `culture_tags` are illustrative starting values
  for the vibe-matching feature — review/adjust these, they're not from JAMB.
- **`backend/data/scholarships.json`** — schema + one real seed entry (MTN
  Pan-African Journalism Programme, from a live RSS feed).
- **`backend/scripts/fetch_scholarships.py`** — pulls fresh scholarship listings
  from official RSS feeds (not HTML scraping), dedupes by link, tags by
  keyword, and merges into `scholarships.json`. Logic tested against a local
  sample feed — works. The live bizcommunity.com feeds couldn't be reached
  from this sandbox (network is restricted here), so **run this yourself**
  once you're on your own machine or Render, where it'll hit the real feeds.
- **`backend/app/main.py`** — FastAPI app serving `/api/universities` and
  `/api/scholarships`. Started locally and both endpoints confirmed returning
  real data (45 universities, correct fields).

## How to run it yourself

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in FEATHERLESS_API_KEY later

# pull fresh scholarship listings from the live RSS feeds
python scripts/fetch_scholarships.py

# start the API
uvicorn app.main:app --reload --port 8000
```

Then check:
- http://127.0.0.1:8000/api/health
- http://127.0.0.1:8000/api/universities
- http://127.0.0.1:8000/api/scholarships

## Feeds currently wired up

Only Nigeria and Gabon bizcommunity.com feeds are in `FEED_URLS` right now —
add more country-specific feeds to `scripts/fetch_scholarships.py` as you
find them (search `"bizcommunity.com rss bursaries scholarships [country]"`).

## Update — matching engine done (Day 2/3 code)

`backend/app/matching.py` is implemented: eligibility as a hard filter,
Jaccard overlap for campus vibe, TF-IDF + cosine similarity for interests,
weighted combination. Heavily commented — read it as the explanation, not
just the code.

Three modes, auto-detected from what the student provides:
- **Decided** — `utme_score` given. Universities below cutoff are dropped.
- **Hypothetical** — only `target_score` given ("what if I scored X").
  Same filtering, nothing claimed about a score they don't have.
- **Exploring** — neither given. No filtering; every university is ranked
  on vibe + interest alone, with `needed_score` (the real cutoff) attached
  so the student knows what to aim for.

`universities.json` also now has a `strong_fields` array per institution
(what interests are compared against) — same caveat as `culture_tags`:
illustrative, not verified per-course data.

## Update — dataset expanded to 117 universities

The original 45-institution list undersold coverage badly, especially
private and state universities. Rebuilt from a real, sourced 117-institution
list (schoolngr.com's compilation of the 2026 JAMB Policy Meeting cutoffs,
dated May 12, 2026 — see `source` in the JSON) that includes many smaller
schools the first version missed entirely (Kadija University, Southwestern
University, Ojaja University, and dozens more).

**Still not exhaustive** — Nigeria has 270+ universities (NUC: ~50 federal,
~60 state, 147+ private); 117 is a real improvement, not full coverage.
`ownership` is inferred from naming patterns (e.g. "Federal" in the name),
not individually verified per institution. `culture_tags`/`strong_fields`
for the well-known institutions are hand-picked from general knowledge; for
everything else they're assigned by simple keyword rules (religious names →
faith-based, "Technology" in the name → tech-focused, etc.) — rougher than
the hand-picked ones, worth reviewing before treating as authoritative.

Tested against 6 profiles (strict/faith-based, diverse/community, two
exploring/hypothetical cases, and two edge cases) — face validity holds,
e.g. a strict/faith-based high scorer surfaces Bowen/Redeemer's/Covenant
near the top. Full API tested end-to-end via `/api/match`, including the
501 (engine missing — no longer applies), 422 (bad input), and empty-list
cases.

## Known gaps, honestly

1. **A score too low for every cutoff returns an empty list.** Technically
   correct, but a dead end for the student — no "here's what to work
   toward instead" message. Worth a small fallback before demo day: if
   the eligible list is empty, fall back to exploring-mode ranking so
   they see *something* with `needed_score` attached.
2. **`strong_fields` and `culture_tags` are illustrative**, based on
   general knowledge of these institutions, not sourced/verified data.
   Fine for a hackathon demo, worth flagging in the pitch as "v2 would
   verify this against official program listings."
3. **Course-level admission isn't modeled.** Cutoffs are institution-wide
   minimums; a specific course (e.g. Medicine) is usually much higher.
   The app should say "meets the university's minimum" rather than
   implying guaranteed admission.
4. **Subject combinations aren't used in scoring**, only stored on the
   student profile. WAEC/NECO results aren't modeled at all.

## Keeping the university data updated

There's no automated pipeline for `universities.json`, unlike scholarships'
RSS pipeline — and that's deliberate, not a gap. JAMB cutoffs are set once
a year at the Policy Meeting (mid-May), so a scraper checking weekly would
be solving a problem that doesn't exist here.

**To refresh next year**: search `"JAMB [year] cut-off marks list"` shortly
after the May policy meeting, find a compiled list like the one this
dataset is sourced from (check `source` in the JSON), and re-run something
like `/tmp/build_universities.py`'s approach — transcribe name/state/cutoff,
re-run the ownership/tag classifier, keep the hand-picked `OVERRIDES` for
institutions you have real knowledge of. This is a 30–60 minute manual job
once a year, not something worth automating.

## Update — "just want a degree" preference + reasons for every match

Two additions based on user feedback:

1. **`flexible` flag** on the student profile — "I just want a real degree,
   size or prestige doesn't matter." Doesn't change the scoring formula,
   but (a) adds a plain reason to every result explaining this, and (b)
   nudges less-selective (lower cutoff) universities ahead when scores
   tie, since a prestige-blind ranking would otherwise bury them under
   famous names with identical fit scores. Wired into `StepVibe.jsx` as a
   fourth option.

2. **`reasons` — plain-language explanations for every match, generated
   with zero network dependency.** This was previously only the AI
   narrative's job, which meant "why was this recommended" silently
   degraded to a vague placeholder offline. Now `matching.py`'s
   `build_reasons()` always produces specific reasons (cutoff margin,
   which vibe tags matched, which fields matched your interests) using
   plain Python logic. The Featherless narrative is now explicitly a
   polish layer built ON TOP of these reasons (the reasons are passed
   into its prompt) rather than a separate, possibly-contradictory
   explanation — and when Featherless fails, the fallback is now the
   reasons themselves, not a generic sentence.

Tested end-to-end: flexible mode correctly sorts tied low-cutoff private
universities together with the right reasoning; non-flexible mode
correctly surfaces matched vibe tags and fields in the reason text;
confirmed the narrative-failure fallback now returns real reasons (no
Featherless key was available in the build sandbox, so this was an actual
failure path, not a simulated one).

## Not built yet

- Featherless narrative: wired and tested for its *failure* path (no
  internet in the build sandbox); the real successful call is untested —
  do this once you have your API key and real internet access.
- Frontend (wizard + dashboard)
- PWA/offline setup
- The actual n8n workflow (server is set up; the workflow itself still
  needs building once the backend is deployed to Render)
