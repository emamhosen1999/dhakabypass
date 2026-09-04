#!/usr/bin/env bash
# One command to make a fresh environment usable: cloud session, new laptop,
# CI runner. Idempotent — running it twice is safe and does not reseed over
# content you have edited.
#
#   npm run setup
#
# Local Windows/Laragon developers do not need this; MySQL is already running
# and .env.local already exists. It is for environments that start with nothing.
set -euo pipefail

say() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }
warn() { printf '\033[33m    ! %s\033[0m\n' "$1"; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

say "Node"
node --version
if ! node -e 'process.exit(parseInt(process.versions.node) >= 22 ? 0 : 1)'; then
  warn "Node 22+ expected (production runs 22.23.2). Continuing, but the build may differ."
fi

say "Dependencies"
if [ -d node_modules ] && [ package-lock.json -ot node_modules ]; then
  echo "    node_modules is current"
else
  npm ci 2>/dev/null || npm install
fi

say "Environment file"
if [ -f .env.local ]; then
  echo "    .env.local already exists — left untouched"
else
  cp .env.example .env.local
  # A dev secret so the admin boots. Never reuse this in production; the
  # deployment runbook generates a real one.
  SECRET="$(node -e 'console.log(require("crypto").randomBytes(32).toString("base64"))')"
  node -e '
    const fs = require("fs");
    const secret = process.argv[1];
    let s = fs.readFileSync(".env.local", "utf8");
    s = s.replace(/^AUTH_SECRET=.*$/m, "AUTH_SECRET=" + secret);
    fs.writeFileSync(".env.local", s);
  ' "$SECRET"
  echo "    created .env.local from .env.example with a generated AUTH_SECRET"
  warn "Set ADMIN_EMAILS to your own address before using the admin."
fi

say "Database"
DB_HOST="$(node -e 'require("./scripts/load-env.mjs")' 2>/dev/null || true)"
if command -v mysqladmin >/dev/null 2>&1 && mysqladmin ping --silent 2>/dev/null; then
  echo "    MySQL/MariaDB is up"
elif command -v service >/dev/null 2>&1 && service mysql start >/dev/null 2>&1; then
  echo "    started MySQL via service"
  for _ in $(seq 1 30); do mysqladmin ping --silent 2>/dev/null && break; sleep 1; done
else
  warn "No local MySQL found."
  warn "The app degrades gracefully without a database — pages render with safe"
  warn "defaults — but tests/db/** and every seed script need one."
  warn "In a container: apt-get install -y mariadb-server && service mysql start"
  exit 0
fi

say "Schema"
npm run db:migrate

say "Seed"
# db-seed.mjs first: it fills the legacy `content` table and, only when they are
# empty, `gallery_images` and `news_updates`. Without it a fresh environment has
# no news at all, so /[locale]/news renders its empty state and looks broken —
# and the legacy site, which is still live and is what the e2e tripwire checks,
# has no content either. It was missing from this script until the localised
# newsroom made the gap visible.
npm run db:seed
npm run db:seed:all
node scripts/import-legacy-media.mjs
node scripts/translate-media-alt.mjs

say "Done"
cat <<'EOF'
    npm run dev          the site on http://localhost:3000
    npm test             unit + db suites
    npm run test:e2e     Playwright (needs `npx playwright install chromium` once)

    Read docs/CLOUD.md before starting work in a fresh environment.
EOF
