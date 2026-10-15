# West Coast Hearts: daily lyric

Posts one lyric card to Instagram (@westcoasthearts_band) every morning at 9 am Pacific.

- `cards/`: 365 lyric cards (1080×1350), alternating ivory and ink.
- `posts.json`: the caption for each card, in posting order.
- `config.json`: the start date, posting hour, and a pause switch.
- `scripts/post.py`: posts today's card.
- `.github/workflows/daily-lyric.yml`: runs each morning. It posts once, at or after 9 am Pacific, and skips if today's card is already up.
- `.github/workflows/refresh-token.yml`: renews the Instagram key every Monday, before it expires.

## Everyday controls
- **Pause:** set `"paused": true` in `config.json`.
- **Skip or swap a line:** edit that day's entry in `posts.json` (and its card in `cards/`).
- **Test without posting:** Actions → Daily lyric → Run workflow, with "Test only" ticked.
- If a post or key renewal fails, an issue opens in this repository, and GitHub emails you about it.

After 365 days the cards start again from day 1.

## Secrets (Settings → Secrets and variables → Actions)
- `IG_TOKEN`: the Instagram access key from the Meta developer app.
- `IG_USER_ID`: the Instagram account's numeric ID.
- `GH_PAT`: a GitHub fine-grained token for this repository with "Secrets: Read and write", used to save the renewed Instagram key.
