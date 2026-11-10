# West Coast Hearts: daily lyric

Posts one lyric card to Instagram (@westcoasthearts_band) every morning at 9 am Pacific.

- `cards/`: 365 lyric cards (1080×1350), alternating ivory and ink.
- `posts.json`: the caption for each card, in posting order.
- `config.json`: the start date, posting hour, and a pause switch.
- `scripts/post.py`: posts today's card.
- `.github/workflows/daily-lyric.yml`: runs each morning. It posts once, at or after 9 am Pacific, and skips if today's card is already up.

## Everyday controls
- **Pause:** set `"paused": true` in `config.json`.
- **Skip or swap a line:** edit that day's entry in `posts.json` (and its card in `cards/`).
- **Test without posting:** Actions → Daily lyric → Run workflow, with "Test only" ticked.
- If a post fails, an issue opens in this repository, and GitHub emails you about it.

After 365 days the cards start again from day 1.

## Secrets (Settings → Secrets and variables → Actions)
- `IG_TOKEN`: the system-user access token from the Meta app "WCH Daily Lyric" (Instagram API with Unified login, owned by the Inner Noise Records business portfolio). It never expires, so there's nothing to renew. If it ever stops working, generate a new one under Use cases → Instagram API → API setup with Unified login → Generate token.
- `IG_USER_ID`: 17841455416450834 (@westcoasthearts_band).
