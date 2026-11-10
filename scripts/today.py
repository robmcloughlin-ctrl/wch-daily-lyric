"""Print today's day number (the posts.json entry the card job will use)."""
import json
from datetime import datetime, date
from zoneinfo import ZoneInfo
cfg = json.load(open("config.json")); posts = json.load(open("posts.json"))
today = datetime.now(ZoneInfo("America/Los_Angeles")).date()
print(posts[(today - date.fromisoformat(cfg["start_date"])).days % len(posts)]["day"])
