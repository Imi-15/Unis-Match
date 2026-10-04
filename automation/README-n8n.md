# Self-hosted n8n (Docker) — setup & what to expect

## Run it

```bash
cd automation
cp .env.example .env   # edit the password before you forget
docker compose up -d
```

## How to know it worked

- `docker compose ps` should show the `n8n` container as `Up` (not
  `Restarting` — a restart loop usually means a bad env var, check
  `docker compose logs n8n`).
- Open http://localhost:5678 in your browser. You should hit n8n's login
  screen (basic auth prompt from the browser itself, then n8n's own
  owner-account setup on first run).
- If the page won't load at all: confirm nothing else is already using
  port 5678 (`lsof -i :5678` on Mac/Linux), and that Docker Desktop is
  actually running.

## Building the actual workflow (once it's up)

1. New workflow → add a **Schedule Trigger** node → set it to weekly
   (or daily while you're testing, so you're not waiting a week to see
   if it works).
2. Add an **RSS Feed Read** node after it → paste in the bizcommunity
   feed URL(s) from `backend/scripts/fetch_scholarships.py`.
3. Click "Execute Node" on the RSS node by itself first — you should
   see a list of items (title, link, pubDate) in the output panel.
   This confirms the feed itself is reachable before you build
   anything downstream.
4. Add an **HTTP Request** node → POST each item to your backend's
   ingest endpoint (this endpoint doesn't exist yet — it's a small
   addition to `backend/app/main.py`, not built as of this file).

## Deploying this to Render instead of running it on your laptop

Render supports deploying directly from a Dockerfile/image, so once
this works locally: create a new Render "Web Service", point it at
this `docker-compose.yml`'s image, set the same env vars in Render's
dashboard (never commit your real `.env`), and update `N8N_HOST` /
`WEBHOOK_URL` to your actual Render URL — n8n needs to know its own
public URL for webhook-based nodes to work correctly.

## Known limitation

This compose file was written against n8n's documented Docker setup
but has **not** been run in a live container — this sandbox can't
reach Docker Hub. If `docker compose up` throws an error, paste the
output here and we'll fix it together rather than guessing.
