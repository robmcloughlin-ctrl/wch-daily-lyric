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

## Daily rotation
One piece of content goes out each morning, rotating through `"rotation"` in `config.json`: a **Reel**, then the **horoscope Stories**, then a **still lyric card**. Lyrics keep their order through `posts.json`; on horoscope days the next lyric waits a day. Run `python3 scripts/schedule.py --week` to see the next ten days.

**Reels:** the lyric card animated with the sea lines from the home page, set to about 10 to 15 seconds of the song around that line. The clips are in `clips/` (one per lyric day, cut from Rob's recordings, sometimes a demo or alternate mix). `clips/index.json` lists the song file and timing for each. A lyric with no clip (12 of 365) goes out as the still card. Turn Reels off with `"reels": false`. To preview any day without posting: Actions, then Reel test, then Run workflow with the day number.

## Horoscope Stories
Right after the card, the same run posts today's lyric horoscope as 12 Instagram Stories, one per sign, Aries to Pisces. Each sign gets the same line as westcoasthearts.com/horoscope that day, because the cards are drawn by the site's own code (`scripts/horoscope_cards.mjs`) and posted by `scripts/post_stories.py`. Today's images live on the `stories` branch, which is replaced each day.

- **Pause just the Stories:** set `"stories_paused": true` in `config.json`.
- They started on the date in `"stories_start_date"`.

## Secrets (Settings → Secrets and variables → Actions)
- `IG_TOKEN`: the system-user access token from the Meta app "WCH Daily Lyric" (Instagram API with Unified login, owned by the Inner Noise Records business portfolio). It never expires, so there's nothing to renew. If it ever stops working, generate a new one under Use cases → Instagram API → API setup with Unified login → Generate token.
- `IG_USER_ID` (optional): defaults to 17841455416450834 (@westcoasthearts_band) in the workflow.
