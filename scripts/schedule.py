"""What goes out today: one piece of content per day, rotating.

config.json:
  "rotation": ["reel", "horoscope", "card"]   order of the daily rotation
  "rotation_start": "2026-11-11"              first day of the rotation
  "lyrics_before_rotation": 1                 lyric cards already posted before it

On "reel" and "card" days the next lyric in posts.json goes out (a Reel when
the song clip exists, otherwise the still card). On "horoscope" days the
12 sign Stories go out instead, and the lyric sequence waits a day.
Run directly to print today's plan.
"""
import json
from datetime import datetime, date, timedelta
from zoneinfo import ZoneInfo


def plan(day=None, cfg=None, posts=None):
    cfg = cfg or json.load(open("config.json"))
    posts = posts or json.load(open("posts.json"))
    day = day or datetime.now(ZoneInfo("America/Los_Angeles")).date()
    rot = cfg.get("rotation") or ["card"]
    start = date.fromisoformat(cfg.get("rotation_start", cfg["start_date"]))
    if day < start:  # before the rotation: daily cards from start_date
        i = (day - date.fromisoformat(cfg["start_date"])).days
        return {"kind": "card", "post": posts[i % len(posts)], "date": day.isoformat()}
    n = (day - start).days
    kind = rot[n % len(rot)]
    lyric_days = sum(1 for k in range(n) if rot[k % len(rot)] != "horoscope")
    idx = (cfg.get("lyrics_before_rotation", 0) + lyric_days) % len(posts)
    return {"kind": kind, "post": posts[idx], "date": day.isoformat()}


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--week":
        today = datetime.now(ZoneInfo("America/Los_Angeles")).date()
        for k in range(10):
            p = plan(today + timedelta(days=k))
            what = "12 horoscope Stories" if p["kind"] == "horoscope" else f"day {p['post']['day']}: {p['post']['lyric']}"
            print(f"{p['date']}  {p['kind']:<9}  {what}")
    else:
        p = plan(); print(p["kind"], p["post"]["day"])
