"""
Pulls fresh scholarship listings from official, published RSS feeds
(NOT html scraping) and merges new items into data/scholarships.json.

Why RSS instead of a scraper: RSS is a stable, intentional interface the
publisher put out for machines to read. It doesn't break when the site's
page layout changes, unlike a scraper built against today's HTML.

Run manually for now:
    python scripts/fetch_scholarships.py

Later, point an n8n "Schedule Trigger" -> "RSS Feed Read" node at the same
feed URLs and have it call the /api/scholarships/ingest endpoint (or just
re-run this script on a cron) so the dataset refreshes weekly without you
touching it.
"""

import json
import re
from datetime import datetime, timezone
from pathlib import Path

import feedparser

# Add more country feeds here as you find them. These are bizcommunity.com's
# published "Bursaries, Scholarships & Finance" RSS feeds, one per country.
FEED_URLS = [
    "https://www.bizcommunity.com/rss/157/853.html",  # Nigeria
    "https://www.bizcommunity.com/rss/79/853.html",   # Gabon
]

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "scholarships.json"

# Very simple keyword tagging so entries have *some* field_tags without
# needing an LLM call for every single item. Swap/extend this — or replace
# with a Featherless call — once you want richer tagging.
FIELD_KEYWORDS = {
    "journalism": ["journalism", "media", "broadcast"],
    "tech": ["technology", "engineering", "computer", "ict", "software"],
    "medicine": ["medicine", "medical", "health", "nursing"],
    "business": ["business", "finance", "economics", "entrepreneur"],
    "arts": ["art", "design", "creative", "music"],
    "agriculture": ["agriculture", "agric", "farming"],
}


def slugify(text: str) -> str:
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return text[:80]


def guess_field_tags(title: str) -> list[str]:
    title_lower = title.lower()
    tags = [
        field
        for field, keywords in FIELD_KEYWORDS.items()
        if any(k in title_lower for k in keywords)
    ]
    return tags or ["general"]


def load_existing() -> dict:
    if DATA_PATH.exists():
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"note": "", "last_updated": None, "scholarships": []}


def fetch_new_entries(existing_links: set[str]) -> list[dict]:
    new_entries = []
    for feed_url in FEED_URLS:
        parsed = feedparser.parse(feed_url)
        if parsed.bozo:
            print(f"  Warning: could not parse {feed_url} cleanly ({parsed.bozo_exception})")
        for entry in parsed.entries:
            link = entry.get("link", "")
            if not link or link in existing_links:
                continue
            title = entry.get("title", "Untitled")
            new_entries.append(
                {
                    "id": slugify(title),
                    "title": title,
                    "link": link,
                    "source": feed_url,
                    "published_date": entry.get("published", entry.get("updated", "")),
                    "field_tags": guess_field_tags(title),
                    "region": "Africa",
                    "deadline": None,
                    "amount": None,
                    "note_to_reviewer": "Auto-fetched from RSS title only — deadline/amount need enrichment (Featherless call or manual check) before showing to students.",
                }
            )
            existing_links.add(link)
    return new_entries


def main():
    data = load_existing()
    existing_links = {item["link"] for item in data["scholarships"]}

    new_entries = fetch_new_entries(existing_links)
    data["scholarships"].extend(new_entries)
    data["last_updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Added {len(new_entries)} new scholarship(s). Total: {len(data['scholarships'])}")


if __name__ == "__main__":
    main()
