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
# In the repo this file lives in scripts/; in the artifact it sits beside
# server.js. Either way, run from the directory that holds .next/BUILD_ID.
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$HERE/.next/BUILD_ID" ]; then cd "$HERE"; else cd "$HERE/.." || exit 1; fi
[ -f .next/BUILD_ID ] || { echo "no .next/BUILD_ID here: $(pwd)"; exit 1; }
ORIGIN_IP="${ORIGIN_IP:-209.74.67.113}"
HOST="${SITE_HOST:-dhakabypass.com}"
BUILD_ID="$(cat .next/BUILD_ID)"
# The probe is a chunk that exists ONLY in this build: the catch-all page's
# hashed chunk from app-build-manifest.json. The old process answers 404 for
# a chunk it does not know even though the file is on disk; the new one
# serves it. (`_buildManifest.js` is not a usable probe — the app returns
# 400 for it in some states.)
CHUNK="$(grep -o 'static/chunks/app/\[locale\]/\[\[\.\.\.slug\]\]/page-[a-z0-9]*\.js' .next/app-build-manifest.json | head -1)"
[ -n "$CHUNK" ] || { echo "cannot find the catch-all page chunk in .next/app-build-manifest.json"; exit 1; }
CHUNK_URL="/_next/$(printf '%s' "$CHUNK" | sed 's/\[/%5B/g; s/\]/%5D/g')"
probe() { curl -sk --resolve "$HOST:443:$ORIGIN_IP" -o /dev/null -m 30 -w "%{http_code}" "https://$HOST$CHUNK_URL"; }
if [ "$(probe)" = "200" ]; then echo "already serving build $BUILD_ID"; exit 0; fi
touch tmp/restart.txt; sleep 25
if [ "$(probe)" = "200" ]; then echo "restart.txt was enough: serving build $BUILD_ID"; exit 0; fi
STUB='process.stderr.write("release handover: exiting so LiteSpeed spawns the current build
"); process.exit(0);'
# Route module -> URL that loads it. /api/handover exists for this purpose
# (app/api/handover/route.js) and nothing else requests it. The rest are
# fallbacks for a build that predates it; the admin ones only work if the
# middleware lets the request reach the module. Least-visited first
# (admin screens nobody but staff opens, which 307 before rendering but
# still require the module) to most. Each is tried in turn; the first one
# the old process has not loaded kills it.
CANDIDATES=(
  ".next/server/app/api/handover/route.js|/api/handover"
  ".next/server/app/admin/(dash)/corridor/toll-matrix/page.js|/admin/corridor/toll-matrix"
  ".next/server/app/admin/(dash)/corridor/waypoints/page.js|/admin/corridor/waypoints"
  ".next/server/app/admin/(dash)/corridor/geometry/page.js|/admin/corridor/geometry"
  ".next/server/app/admin/(dash)/corridor/monthly/page.js|/admin/corridor/monthly"
  ".next/server/app/admin/(dash)/corridor/sections/page.js|/admin/corridor/sections"
  ".next/server/app/admin/(dash)/corridor/advisories/page.js|/admin/corridor/advisories"
  ".next/server/app/admin/(dash)/corridor/segments/page.js|/admin/corridor/segments"
  ".next/server/app/admin/(dash)/corridor/tolls/page.js|/admin/corridor/tolls"
  ".next/server/app/admin/(dash)/corridor/interchanges/page.js|/admin/corridor/interchanges"
  ".next/server/app/admin/(dash)/news/[id]/translations/page.js|/admin/news/1/translations"
  ".next/server/app/admin/(dash)/news/new/page.js|/admin/news/new"
  ".next/server/app/admin/(dash)/menus/page.js|/admin/menus"
  ".next/server/app/admin/(dash)/translations/page.js|/admin/translations"
  ".next/server/app/admin/(dash)/redirects/page.js|/admin/redirects"
  ".next/server/app/admin/(dash)/seo/page.js|/admin/seo"
  ".next/server/app/admin/(dash)/settings/page.js|/admin/settings"
  ".next/server/app/admin/(dash)/users/page.js|/admin/users"
  ".next/server/app/admin/(dash)/subscribers/page.js|/admin/subscribers"
  ".next/server/app/admin/(dash)/requests/page.js|/admin/requests"
  ".next/server/app/admin/(dash)/media/page.js|/admin/media"
  ".next/server/app/admin/(dash)/pages-v2/[id]/page.js|/admin/pages-v2/1"
  ".next/server/app/admin/api/upload/route.js|/admin/api/upload"
  ".next/server/app/admin/api/media/route.js|/admin/api/media"
  ".next/server/app/[locale]/preview/[id]/page.js|/en/preview/1"
  ".next/server/app/[locale]/news/[slug]/page.js|/en/news/handover-probe"
)
for entry in "${CANDIDATES[@]}"; do
  F="${entry%%|*}"; U="${entry##*|}"
  [ -f "$F" ] || continue
  printf '%s
' "$STUB" > "$F"
  curl -sk --resolve "$HOST:443:$ORIGIN_IP" -o /dev/null -m 30 "https://$HOST$U?r=$RANDOM"
  git checkout -- "$F"
  sleep 8
  if [ "$(probe)" = "200" ]; then
    sleep 20; echo "handover done via $U: serving build $BUILD_ID"; exit 0
  fi
done
# Last resort, and the one that worked on 13 September 2026: the detached
# process is visible to its own account as `next-server`. End every one whose
# working directory is this app root; LiteSpeed spawns the current build on
# the next request.
APP_ROOT="$(pwd -P)"
for PID in $(ps -u "$(id -u)" -o pid=,args= | awk '/next-server/ {print $1}'); do
  if [ "$(readlink "/proc/$PID/cwd" 2>/dev/null)" = "$APP_ROOT" ]; then
    echo "ending stale next-server $PID"; kill "$PID"
  fi
done
sleep 5
curl -sk --resolve "$HOST:443:$ORIGIN_IP" -o /dev/null -m 60 "https://$HOST/en"
sleep 5
if [ "$(probe)" = "200" ]; then echo "handover done by ending the old process: serving build $BUILD_ID"; exit 0; fi
echo "STILL the old process. Ask Namecheap support to reset CageFS for the account (kills the detached Node process)."; exit 1
