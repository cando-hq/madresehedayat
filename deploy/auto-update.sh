#!/usr/bin/env bash
# مدرسهٔ هدایت — به‌روزرسانی خودکار از گیت‌هاب (با cron هر ۳ دقیقه؛ نصب: deploy/install-auto-update.sh)
#
# هر بار: اگر نسخهٔ apps/api/package.json روی شاخهٔ main بالاتر از نسخهٔ در حال اجرا باشد:
#   پشتیبان دیتابیس ← کد تازه ← ساخت API ← چک /api/health ← ساخت وب.
# اگر API تازه بالا نیامد یا ساخت وب شکست، کد و API به نسخهٔ قبل برمی‌گردد و آن نسخه «خراب» علامت می‌خورد
# تا دوباره امتحان نشود (نسخهٔ بالاتر بعدی دوباره امتحان می‌شود).
# فقط رو به جلو: نسخهٔ پایین‌تر یا برابر هیچ‌وقت نصب نمی‌شود. .env و داده‌ها دست نمی‌خورند.
set -uo pipefail
export PATH="$PATH:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
STATE="$ROOT/.auto-update"; mkdir -p "$STATE/backups"
LOG="$STATE/log"
log() { echo "$(date '+%F %T') $*" >> "$LOG"; }
trim_log() { [ "$(wc -l < "$LOG" 2>/dev/null || echo 0)" -gt 2000 ] && tail -1000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"; true; }

exec 9>"$STATE/lock"
flock -n 9 || exit 0
date '+%F %T' > "$STATE/last-check"

env_get() { [ -f .env ] && grep -E "^$1=" .env | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' || true; }
PORT="$(env_get API_PORT)"; HEALTH="http://127.0.0.1:${PORT:-3000}/api/health"
running() { curl -fsS -m 5 "$HEALTH" 2>/dev/null | sed -n 's/.*"version":"\([^"]*\)".*/\1/p'; }
newer() { [ "$1" != "$2" ] && [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | tail -1)" = "$1" ]; }  # $1 > $2

if ! git fetch -q origin main 2>>"$LOG"; then log "خطا: گرفتن از گیت‌هاب نشد"; trim_log; exit 1; fi
REMOTE="$(git show origin/main:apps/api/package.json 2>/dev/null | sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' | head -1)"
CUR="$(running)"
[ -z "$CUR" ] && CUR="$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' apps/api/package.json | head -1)"
if [ -z "$REMOTE" ] || ! newer "$REMOTE" "$CUR"; then trim_log; exit 0; fi
if [ -f "$STATE/failed" ] && [ "$(cat "$STATE/failed")" = "$REMOTE" ]; then exit 0; fi

DIRTY="$(git status --porcelain --untracked-files=no)"
if [ -n "$DIRTY" ]; then
  [ "$(cat "$STATE/dirty" 2>/dev/null)" = "$REMOTE" ] || log "نسخهٔ $REMOTE آماده است ولی فایل‌هایی از گیت روی سرور دستی عوض شده‌اند؛ نصب نکردم تا چیزی پاک نشود: $(echo "$DIRTY" | tr '\n' ' ')"
  echo "$REMOTE" > "$STATE/dirty"; exit 1
fi
rm -f "$STATE/dirty"
log "نسخهٔ تازه: $CUR → $REMOTE"
PREV="$(git rev-parse HEAD)"

B="$STATE/backups/before-$REMOTE-$(date +%Y%m%d-%H%M).sql.gz"
if docker compose exec -T db pg_dump -U madrese madrese 2>>"$LOG" | gzip > "$B" && [ -s "$B" ]; then
  log "پشتیبان: $B"
  ls -1t "$STATE"/backups/*.sql.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
else
  rm -f "$B"; log "خطا: پشتیبان دیتابیس گرفته نشد؛ به‌روزرسانی انجام نشد"; exit 1
fi

rollback() {
  log "برگشت به $CUR ($1)"
  echo "$REMOTE" > "$STATE/failed"
  git reset -q --hard "$PREV"
  docker compose up -d --build >>"$LOG" 2>&1
  log "برگشت انجام شد؛ نسخهٔ در حال اجرا: $(running || echo '?')؛ پشتیبان پیش از تلاش: $B"
  trim_log; exit 1
}

git reset -q --hard origin/main || rollback "کد تازه گرفته نشد"
if ! docker compose up -d --build >>"$LOG" 2>&1; then rollback "ساخت API شکست خورد"; fi
ok=""
for _ in $(seq 1 40); do [ "$(running)" = "$REMOTE" ] && ok=1 && break; sleep 3; done
[ -n "$ok" ] || rollback "API تازه بالا نیامد (health)"
if ! ./deploy/build-web.sh >>"$LOG" 2>&1; then rollback "ساخت وب شکست خورد"; fi
rm -f "$STATE/failed"
log "نصب شد: $REMOTE"
trim_log
