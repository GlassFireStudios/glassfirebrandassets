# Purging the machine tracker files from public history

`Machines/board.json` and `Machines/_access.json` were committed to this
**public** repository. This runbook removes them. Read all of it before starting;
step 2 is the one that actually closes the security hole, and the history
rewrite is cleanup.

## What was exposed

| File | What it published |
|---|---|
| `Machines/_access.json` | A 64-character token. `/m/<token>` is exempted in `middleware.ts`, so this token was the **only** gate on the no-login tracker. |
| `Machines/board.json` | Named, timestamped presence history: 103 sessions, 8 people, 5 machines, 16 Jul to 21 Aug 2026, plus every intermediate version across ~600 commits. |

## Read this before you start

**A history rewrite does not delete anything from GitHub.** Force-pushing
removes the commits from the branch, but the old objects stay reachable by SHA
through the web UI and the API until GitHub garbage-collects them, and that only
happens if you **ask GitHub Support to do it**. Anyone who noted a commit SHA,
or any fork or cache, still has the data.

So the rewrite is worth doing, but treat the token as **burned regardless**.
Rotating it is what closes the door. That is step 2 and it is not optional.

**This repo has to stay public.** The brand embeds resolve through
`cdn.jsdelivr.net/gh/GlassFireStudios/glassfirebrandassets@main/`, and jsDelivr
only serves public repos. Making it private would break live client embeds, so
that shortcut is not available.

**A force-push breaks every existing clone.** Anyone with a checkout has to
re-clone or hard-reset. Coordinate before you push.

---

## 1. Ship the Supabase version first

Nothing else works until the app stops writing these files. Set in Vercel:

```
SUPABASE_URL=https://sqyyorwhvdyhgixfxgec.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
MACHINE_TRACKER_TOKEN=<a NEW token, see step 2>
```

Deploy, then confirm at `/machines`: the board renders, a sign-in and sign-out
work, and **no new commit appears in this repo**.

## 2. Rotate the share token (this is the real fix)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set that as `MACHINE_TRACKER_TOKEN` in Vercel. The old token is public and
stays public whatever the rewrite does. Anyone still holding the old `/m/<old>`
link will get a 403 after this, which is the point.

## 3. Remove the files from the tip

```bash
git rm --cached Machines/board.json Machines/_access.json
git commit -m "Move machine tracker state to Supabase; stop committing presence data"
git push
```

`.gitignore` already blocks both paths, so they cannot come back by accident.

## 4. Rewrite history

`git-filter-repo` is the supported tool (`git filter-branch` is deprecated and
much slower).

```bash
pip install git-filter-repo        # or: brew install git-filter-repo

# Work on a FRESH mirror clone, never your working copy.
cd /tmp
git clone --mirror https://github.com/GlassFireStudios/glassfirebrandassets.git
cd glassfirebrandassets.git

# Keep a local backup before rewriting anything.
git bundle create ~/glassfirebrandassets-backup-$(date +%Y%m%d).bundle --all

git filter-repo --invert-paths \
  --path Machines/board.json \
  --path Machines/_access.json

# Confirm they are gone from every commit. Both should print nothing.
git log --all --oneline -- Machines/board.json
git log --all --oneline -- Machines/_access.json
```

## 5. Force-push

```bash
git remote add origin https://github.com/GlassFireStudios/glassfirebrandassets.git
git push --force --all
git push --force --tags
```

Then tell anyone with a clone to re-clone. Every commit SHA has changed.

## 6. Ask GitHub to garbage-collect

Without this the old objects remain fetchable by SHA. Open a ticket at
https://support.github.com and ask them to run garbage collection on
`GlassFireStudios/glassfirebrandassets` after a history rewrite that removed
sensitive data. Reference this file.

## 7. Check the CDN

jsDelivr caches by path and by ref. After the rewrite, spot-check a few embed
images still resolve:

```
https://cdn.jsdelivr.net/gh/GlassFireStudios/glassfirebrandassets@main/Logos/<file>
```

If anything 404s, jsDelivr's purge endpoint is
`https://purge.jsdelivr.net/gh/GlassFireStudios/glassfirebrandassets@main/<path>`.

## 8. Afterwards

The presence history is not lost. All 103 sessions were imported into
`brandstudio.machine_sessions` before any of this, where they are private,
queryable, and protected by RLS with no anon policy.
