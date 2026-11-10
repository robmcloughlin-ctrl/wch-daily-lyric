"""Post today's 12 lyric-horoscope cards to Instagram Stories.

The cards are rendered by horoscope_cards.mjs and published on the
`stories` branch so Instagram can fetch them. A marker file on that
branch (posted-<date>) stops a second run from posting them twice.
Needs IG_TOKEN and IG_USER_ID.

Usage: python scripts/post_stories.py CARDS_DIR
"""
import json, os, sys, time, urllib.parse, urllib.request

API = "https://graph.facebook.com/v23.0"
TOKEN = os.environ["IG_TOKEN"]
USER = os.environ["IG_USER_ID"]
REPO = os.environ["GITHUB_REPOSITORY"]
DRY = os.environ.get("DRY_RUN") == "true"

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

cards_dir = sys.argv[1]
index = json.load(open(next(os.path.join(cards_dir, f) for f in os.listdir(cards_dir) if f.endswith(".json"))))
date = index[0]["date"]

if os.path.exists(os.path.join(cards_dir, f"posted-{date}")) and not DRY:
    print(f"Horoscope Stories for {date} are already up; nothing to do."); sys.exit(0)

posted = 0
for card in index:
    url = f"https://raw.githubusercontent.com/{REPO}/stories/{card['file']}"
    cid = call("POST", f"{USER}/media", media_type="STORIES", image_url=url)["id"]
    for _ in range(30):
        status = call("GET", cid, fields="status_code").get("status_code")
        if status == "FINISHED": break
        if status == "ERROR": sys.exit(f"Instagram could not process {card['file']}.")
        time.sleep(2)
    else:
        sys.exit(f"Instagram took too long to process {card['file']}.")
    if DRY:
        print(f"Dry run: {card['sign']} Story prepared, not published.")
        continue
    call("POST", f"{USER}/media_publish", creation_id=cid)
    posted += 1
    print(f"Posted {card['sign']}: {card['line']}")
    time.sleep(3)  # keep them in sign order

if not DRY:
    open(os.path.join(cards_dir, f"posted-{date}"), "w").write(f"{posted}\n")
print("Dry run complete: all 12 Stories prepared. Everything is connected." if DRY else f"Posted {posted} horoscope Stories for {date}.")
