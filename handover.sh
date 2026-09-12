#!/usr/bin/env bash
# Force LiteSpeed to spawn the CURRENT build after `git pull`.
#
# LiteSpeed keeps the app's Node process detached per domain, and
# tmp/restart.txt, the selector's stop/start/restart, and even destroying and
# re-creating the app all left the old process serving on 12 September 2026.
# What does end it: the running process `require()`s route modules lazily
# from disk on first request, so a route it has not served yet loads whatever
# file is there NOW. This writes a one-line `process.exit(0)` into the
# news-article route (rarely hit by the time a release lands), requests it,
# lets the old process die, restores the file from git, and confirms the new
# build answers by fetching its own _buildManifest.
#
# Run on the server, in the app root, after `git pull` and the SQL imports:
#   bash scripts/handover.sh
set -u
cd "$(dirname "$0")/.." || exit 1
ORIGIN_IP="${ORIGIN_IP:-209.74.67.113}"
HOST="${SITE_HOST:-dhakabypass.com}"
BUILD_ID="$(cat .next/BUILD_ID)"
probe() { curl -sk --resolve "$HOST:443:$ORIGIN_IP" -o /dev/null -m 30 -w "%{http_code}" "https://$HOST/_next/static/$BUILD_ID/_buildManifest.js"; }
if [ "$(probe)" = "200" ]; then echo "already serving build $BUILD_ID"; exit 0; fi
touch tmp/restart.txt; sleep 25
if [ "$(probe)" = "200" ]; then echo "restart.txt was enough: serving build $BUILD_ID"; exit 0; fi
STUB='process.stderr.write("release handover: exiting so LiteSpeed spawns the current build\n"); process.exit(0);'
for F in ".next/server/app/[locale]/news/[slug]/page.js" ".next/server/app/admin/api/media/route.js" ".next/server/app/[locale]/preview/[id]/page.js"; do
  [ -f "$F" ] && printf '%s\n' "$STUB" > "$F"
done
for u in "/en/news/handover-probe" "/admin/api/media" "/en/preview/1"; do
  curl -sk --resolve "$HOST:443:$ORIGIN_IP" -o /dev/null -m 30 "https://$HOST$u?r=$RANDOM"; sleep 4
done
git checkout -- .next/server/app
sleep 30
if [ "$(probe)" = "200" ]; then echo "handover done: serving build $BUILD_ID"; exit 0; fi
echo "STILL the old process. Ask Namecheap support to reset CageFS for the account (kills the detached Node process)."; exit 1
