#!/bin/bash
# Make the Reel for one day: render the animated card, add the song clip.
# Usage: scripts/make_reel.sh DAY OUT.mp4   (needs clips/DAY.m4a)
set -euo pipefail
DAY=$(printf "%03d" "$1"); OUT="$2"
CLIP="clips/$DAY.m4a"
LEN=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$CLIP")
python3 - "$1" > /tmp/day.json <<'PY'
import json, sys
p = next(x for x in json.load(open("posts.json")) if x["day"] == int(sys.argv[1]))
print(json.dumps({"day": p["day"], "line": p["lyric"], "song": p["song"], "album": p["album"], "year": p["year"]}))
PY
node scripts/reel_render.mjs /tmp/day.json "$LEN" /tmp/reel.webm
ffmpeg -nostdin -loglevel error -y -i /tmp/reel.webm -i "$CLIP" -map 0:v -map 1:a \
  -vf "fps=30,scale=1080:1920,format=yuv420p,fade=t=in:st=0:d=0.5" \
  -c:v libx264 -profile:v high -preset medium -crf 20 -g 60 \
  -c:a aac -b:a 160k -ar 48000 -shortest -movflags +faststart "$OUT"
echo "Made $OUT ($(du -h "$OUT" | cut -f1), ${LEN}s)"
