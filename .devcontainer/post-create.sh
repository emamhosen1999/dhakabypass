#!/usr/bin/env bash
# Runs once when a container is created. Installs MariaDB, because this project
# has 8 database-backed test files and every seed script needs a server; without
# one, a third of the suite cannot run and the seeded content does not exist.
#
# Deliberately tolerant: if a step fails the container should still come up so
# a person can diagnose it, rather than dying at create time with no shell.
set -uo pipefail

say() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

say "MariaDB"
if ! command -v mariadbd >/dev/null 2>&1 && ! command -v mysqld >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mariadb-server >/dev/null
fi
sudo service mariadb start 2>/dev/null || sudo service mysql start 2>/dev/null || true
for _ in $(seq 1 40); do
  if mysqladmin ping --silent 2>/dev/null; then break; fi
  sleep 1
done

# root@localhost defaults to unix_socket auth on Debian, which mysql2 cannot
# use. Switch it to an empty native password so the app's TCP connection works.
say "Database user"
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('');" 2>/dev/null \
  || sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '';" 2>/dev/null || true
sudo mysql -e "FLUSH PRIVILEGES;" 2>/dev/null || true
sudo mysql -e "CREATE DATABASE IF NOT EXISTS dhakabypass CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
sudo mysql -e "CREATE DATABASE IF NOT EXISTS dhakabypass_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true

say "Playwright"
# Chromium only — the e2e suite does not use firefox or webkit, and pulling all
# three costs several minutes and ~1GB for no benefit here.
npx --yes playwright install --with-deps chromium >/dev/null 2>&1 || \
  echo "    playwright browsers not installed; run 'npx playwright install chromium' if you need e2e"

say "Project setup"
bash scripts/setup-env.sh || echo "    setup-env.sh did not complete; run 'npm run setup' to see why"

say "Ready"
echo "    npm run dev      http://localhost:3000"
echo "    npm test         51 files / 446 tests expected"
echo "    Read docs/CLOUD.md first."
