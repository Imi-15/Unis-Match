# How to run everything built so far

## 1. Backend (FastAPI + real datasets)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # add your Featherless API key when ready (not used yet)

# pull fresh scholarship listings from live RSS feeds (couldn't be tested
# from the build sandbox — this is the first time it'll hit the real feeds)
python scripts/fetch_scholarships.py

uvicorn app.main:app --reload --port 8000
```

Confirm it's working:
- http://127.0.0.1:8000/api/health → `{"status": "ok"}`
- http://127.0.0.1:8000/api/universities → 117 real universities with JAMB cutoffs
- http://127.0.0.1:8000/api/scholarships → whatever the RSS pull returned

## 2. Automation (self-hosted n8n via Docker)

```bash
cd automation
cp .env.example .env          # set a real password before running
docker compose up -d
```

Then open http://localhost:5678 and follow `automation/README-n8n.md` for
building the actual scrape-and-sync workflow. This wasn't tested in a live
container (no Docker Hub access from the build sandbox) — confirm
`docker compose ps` shows the container as `Up`, not restarting.

## Order that matters

Run the backend first — the n8n workflow's last step will eventually POST
into it, so it's more useful to have something to POST *into* before you
wire that up.

## 3. Frontend (React wizard + dashboard)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the dev server proxies `/api/*` to the
backend on `localhost:8000` (see `vite.config.js`), so make sure the
backend is running too.

Confirmed working: `npm run build` completes with no errors, and Tailwind
is compiling correctly (checked the `has-[:checked]` variant made it into
the output CSS). **Not confirmed**: I haven't run this in an actual
browser — click through the full wizard → match flow yourself and watch
for anything that looks visually broken, since a clean build doesn't
guarantee that.

Three-screen flow: **Landing → Wizard → Dashboard**. Landing has two
buttons: "Find my university matches" (goes to the wizard) and "Just
browse scholarships" (skips straight to the Dashboard's scholarships tab,
since scholarships aren't matched against a profile the way universities
are — no reason to force four wizard steps just to browse them).

Structure:
- `src/components/Landing.jsx` — the entry screen with both CTAs
- `src/components/Step*.jsx` — the four wizard steps (academic status,
  interests, campus vibe, budget/region)
- `src/components/Wizard.jsx` — manages step state, moves focus to each
  step's heading for screen-reader users, builds the final payload
- `src/components/Dashboard.jsx` — fetches `/api/match` (only when a
  profile exists — shows a "take the quiz" prompt instead of loading
  forever when reached via "Just browse scholarships"), tabs between
  universities and scholarships, shows a fallback message instead of a
  dead end when zero universities match (see "Known gaps" below)
- `src/components/MatchCard.jsx` — uses native `<details>/<summary>` for
  the expandable score breakdown — free keyboard/screen-reader support,
  no extra ARIA code needed
- `src/App.jsx` — holds which of the three screens is active; clicking
  the header title returns to Landing from anywhere

## What's not built yet

- PWA/offline setup (`vite-plugin-pwa`, service worker, IndexedDB caching)
- The actual n8n workflow (server is set up; workflow still needs building)
- Live Featherless narrative call (wrapper is done and its failure path
  is tested; the successful path needs your real API key + real internet)
