"""Post today's West Coast Hearts lyric card to Instagram.

Runs from GitHub Actions a few times each morning. It posts once per day:
it skips if it's before the posting hour (Pacific time) or if today's card is
already on Instagram. Needs secrets IG_TOKEN and IG_USER_ID.
"""
import json, os, sys, time, urllib.parse, urllib.request
from datetime import datetime, date
from zoneinfo import ZoneInfo

# Instagram API with Unified login (Facebook Login for Business, system-user token)
API = "https://graph.facebook.com/v23.0"
TOKEN = os.environ["IG_TOKEN"]
USER = os.environ["IG_USER_ID"]
REPO = os.environ["GITHUB_REPOSITORY"]          # owner/name, set by GitHub
BRANCH = os.environ.get("GITHUB_REF_NAME", "main")
DRY = os.environ.get("DRY_RUN") == "true"        # create the post but don't publish it
FORCE = os.environ.get("FORCE") == "true"        # ignore the time-of-day check

def call(method, path, **params):
    params["access_token"] = TOKEN
    data = urllib.parse.urlencode(params).encode()
    url = f"{API}/{path}"
    req = urllib.request.Request(url + ("" if method == "POST" else "?" + data.decode()),
                                 data=data if method == "POST" else None, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace").replace(TOKEN, "***")
        sys.exit(f"Instagram API error on {path}: {e.code} {body}")

cfg = json.load(open("config.json"))
posts = json.load(open("posts.json"))
now = datetime.now(ZoneInfo("America/Los_Angeles"))
today = now.date()
start = date.fromisoformat(cfg["start_date"])

if cfg.get("paused"):
    print("Paused in config.json; nothing to do."); sys.exit(0)
if today < start and not FORCE:
    print(f"Daily posts start on {start}; nothing to do yet."); sys.exit(0)
if now.hour < cfg["post_hour_pacific"] and not FORCE:
    print(f"It's {now:%H:%M} Pacific; waiting for {cfg['post_hour_pacific']}:00."); sys.exit(0)

post = posts[(today - start).days % len(posts)]
print(f"Today's card: day {post['day']}: {post['lyric']} ({post['song']})")

# Already posted today? Compare with the most recent post's caption.
recent = call("GET", f"{USER}/media", fields="caption,timestamp", limit="3").get("data", [])
if not DRY and any((m.get("caption") or "").strip() == post["caption"].strip() for m in recent):
    print("Today's card is already on Instagram; nothing to do."); sys.exit(0)

REEL_URL = os.environ.get("REEL_URL")  # set by the workflow when today's Reel was made
if REEL_URL:
    print("Posting today's lyric as a Reel.")
    container = call("POST", f"{USER}/media", media_type="REELS", video_url=REEL_URL,
                     caption=post["caption"], share_to_feed="true")["id"]
    tries, wait, kind = 100, 3, "video"                # videos can take a few minutes
else:
    image_url = f"https://raw.githubusercontent.com/{REPO}/{BRANCH}/{post['image']}"
    container = call("POST", f"{USER}/media", image_url=image_url, caption=post["caption"])["id"]
    tries, wait, kind = 30, 2, "image"
for _ in range(tries):
    status = call("GET", container, fields="status_code").get("status_code")
    if status == "FINISHED": break
    if status == "ERROR": sys.exit(f"Instagram could not process the {kind}.")
    time.sleep(wait)
else:
    sys.exit(f"Instagram took too long to process the {kind}.")

if DRY:
    print("Dry run: the post was prepared but not published. Everything is connected."); sys.exit(0)
media = call("POST", f"{USER}/media_publish", creation_id=container)
print(f"Posted to Instagram (media id {media.get('id')}).")
